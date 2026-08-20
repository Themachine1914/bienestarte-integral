import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { isBookableDateKey } from '../lib/dates'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { generateReference, normalizeReference } from '../lib/reference'
import { isSlotInPast } from '../lib/time'
import type { Appointment, AppointmentStatus, SlotLock } from '../types'
import { getAvailability } from './availability'
import { localDb } from './localDb'
import { createNotification } from './notifications'
import { findOrCreatePatient } from './patients'
import { listSlotIds, releaseSlot, slotId } from './slots'

export { getBookedSlotsForDate } from './slots'

/** Statuses that still occupy the calendar. A completed session keeps its slot. */
const ACTIVE_STATUSES: AppointmentStatus[] = ['pending', 'confirmed', 'completed']

function byDateDesc(a: Appointment, b: Appointment): number {
  return `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)
}

/** Admin-only: the public site can no longer list this collection. */
export async function listAppointments(): Promise<Appointment[]> {
  if (!isFirebaseConfigured || !db) {
    return localDb.getAppointments().sort(byDateDesc)
  }
  const snap = await getDocs(collection(db, 'appointments'))
  return snap.docs
    .map((d) => ({ ...(d.data() as Appointment), id: d.id }))
    .sort(byDateDesc)
}

/**
 * The public "Mis citas" lookup. Takes the code printed on the confirmation
 * screen and reads exactly one document — there is no way to enumerate.
 */
export async function getAppointmentByReference(
  input: string,
): Promise<Appointment | null> {
  const reference = normalizeReference(input)
  if (!reference) return null

  if (!isFirebaseConfigured || !db) {
    return (
      localDb.getAppointments().find((a) => a.reference === reference) ?? null
    )
  }
  const snap = await getDoc(doc(db, 'appointments', reference))
  if (!snap.exists()) return null
  return { ...(snap.data() as Appointment), id: snap.id }
}

/** Idempotent by slot id, so a repeated reconcile cannot duplicate a lock. */
async function writeSlotLock(lock: SlotLock): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    const others = localDb.getSlots().filter((s) => s.id !== lock.id)
    localDb.saveSlots([...others, lock])
    return
  }
  await setDoc(doc(db, 'slots', lock.id), lock)
}

/**
 * Claims a time atomically. In Firestore the transaction fails if another
 * booking created the same slot id first, so concurrent submissions cannot
 * both win. Demo mode is single-threaded, so a plain check is equivalent.
 */
async function claimSlot(
  date: string,
  time: string,
  appointmentId: string,
): Promise<void> {
  const id = slotId(date, time)
  const lock: SlotLock = {
    id,
    date,
    time,
    appointmentId,
    createdAt: new Date().toISOString(),
  }
  const taken = new Error('Ese horario ya no está disponible. Elige otra hora.')

  if (!isFirebaseConfigured || !db) {
    if (localDb.getSlots().some((s) => s.id === id)) throw taken
    localDb.saveSlots([...localDb.getSlots(), lock])
    return
  }

  const database = db
  await runTransaction(database, async (tx) => {
    const ref = doc(database, 'slots', id)
    const existing = await tx.get(ref)
    if (existing.exists()) throw taken
    tx.set(ref, lock)
  })
}

async function assertBookable(date: string, time: string): Promise<void> {
  const availability = await getAvailability()

  if (!availability.slots.includes(time)) {
    throw new Error('Ese horario no está en la agenda.')
  }
  if (!isBookableDateKey(date, availability)) {
    throw new Error('Esa fecha no está disponible para agendar.')
  }
  if (isSlotInPast(date, time)) {
    throw new Error('Ese horario ya pasó. Elige otro.')
  }
}

export async function createAppointment(input: {
  name: string
  phone: string
  email: string
  sessionType: Appointment['sessionType']
  price: number
  date: string
  time: string
  notes: string
  paymentProofUrl: string
  paymentProofName?: string
}): Promise<Appointment> {
  await assertBookable(input.date, input.time)

  // Claim the time first. Creating the patient before this point left orphan
  // records behind whenever the slot turned out to be taken.
  const reference = generateReference()
  await claimSlot(input.date, input.time, reference)

  try {
    const now = new Date().toISOString()

    const appointment: Appointment = {
      id: reference,
      reference,
      // Linked to a patient record by the admin panel — see reconcileData().
      patientId: '',
      patientName: input.name.trim(),
      patientPhone: input.phone.trim(),
      patientEmail: input.email.trim().toLowerCase(),
      sessionType: input.sessionType,
      price: input.price,
      date: input.date,
      time: input.time,
      modality: 'virtual',
      status: 'pending',
      notes: input.notes,
      paymentProofUrl: input.paymentProofUrl,
      paymentProofName: input.paymentProofName ?? '',
      createdAt: now,
      updatedAt: now,
    }

    if (!isFirebaseConfigured || !db) {
      localDb.saveAppointments([...localDb.getAppointments(), appointment])
    } else {
      await setDoc(doc(db, 'appointments', reference), appointment)
    }

    await createNotification({
      type: 'appointment_created',
      appointmentId: appointment.id,
      message: `Nueva cita pendiente: ${appointment.patientName} — ${appointment.date} ${appointment.time}`,
    })

    return appointment
  } catch (error) {
    // Don't leave the time blocked by a booking that never completed.
    await releaseSlot(input.date, input.time).catch(() => undefined)
    throw error
  }
}

/** Admin-created booking, for patients who call instead of using the site. */
export async function createManualAppointment(input: {
  name: string
  phone: string
  email: string
  sessionType: Appointment['sessionType']
  price: number
  date: string
  time: string
  notes: string
}): Promise<Appointment> {
  const appointment = await createAppointment({
    ...input,
    paymentProofUrl: '',
    paymentProofName: '',
  })
  // The admin is signed in here, so the patient record can be linked at once.
  await linkPatient(appointment)
  return updateAppointmentStatus(appointment.id, 'confirmed')
}

/** Attaches an appointment to a patient record, creating it if needed. */
async function linkPatient(appointment: Appointment): Promise<void> {
  const patient = await findOrCreatePatient({
    name: appointment.patientName,
    phone: appointment.patientPhone,
    email: appointment.patientEmail,
  })
  if (!isFirebaseConfigured || !db) {
    localDb.saveAppointments(
      localDb
        .getAppointments()
        .map((a) =>
          a.id === appointment.id ? { ...a, patientId: patient.id } : a,
        ),
    )
    return
  }
  await updateDoc(doc(db, 'appointments', appointment.id), {
    patientId: patient.id,
  })
}

const NOTIFICATION_BY_STATUS: Partial<
  Record<AppointmentStatus, { type: 'appointment_confirmed' | 'appointment_rejected' | 'appointment_cancelled'; label: string }>
> = {
  confirmed: { type: 'appointment_confirmed', label: 'confirmada' },
  rejected: { type: 'appointment_rejected', label: 'rechazada' },
  cancelled: { type: 'appointment_cancelled', label: 'cancelada' },
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<Appointment> {
  const now = new Date().toISOString()
  let updated: Appointment

  if (!isFirebaseConfigured || !db) {
    const list = localDb.getAppointments()
    const current = list.find((a) => a.id === id)
    if (!current) throw new Error('Cita no encontrada')
    updated = { ...current, status, updatedAt: now }
    localDb.saveAppointments(list.map((a) => (a.id === id ? updated : a)))
  } else {
    const ref = doc(db, 'appointments', id)
    await updateDoc(ref, { status, updatedAt: now })
    const snap = await getDoc(ref)
    if (!snap.exists()) throw new Error('Cita no encontrada')
    updated = { ...(snap.data() as Appointment), id: snap.id }
  }

  // Rejecting or cancelling puts the time back on the calendar; confirming and
  // completing keep it held.
  if (!ACTIVE_STATUSES.includes(status)) {
    await releaseSlot(updated.date, updated.time)
  }

  const notification = NOTIFICATION_BY_STATUS[status]
  if (notification) {
    await createNotification({
      type: notification.type,
      appointmentId: id,
      message: `Cita ${notification.label}: ${updated.patientName} — ${updated.date} ${updated.time}`,
    })
  }
  return updated
}

/**
 * Repairs data the public booking flow deliberately cannot write: slot locks
 * for bookings made before they were tracked separately, missing reference
 * codes, and the patient record each appointment belongs to. Runs when the
 * admin opens the panel, which is the first moment we have permission.
 */
export async function reconcileData(): Promise<number> {
  const appointments = await listAppointments()
  const active = appointments.filter((a) => ACTIVE_STATUSES.includes(a.status))
  const existing = new Set(await listSlotIds())
  let repaired = 0

  for (const appointment of active) {
    const id = slotId(appointment.date, appointment.time)
    if (existing.has(id)) continue
    existing.add(id)

    await writeSlotLock({
      id,
      date: appointment.date,
      time: appointment.time,
      appointmentId: appointment.id,
      createdAt: appointment.createdAt,
    })
    repaired += 1
  }

  for (const appointment of appointments) {
    if (!appointment.reference) {
      const reference = generateReference()
      if (!isFirebaseConfigured || !db) {
        localDb.saveAppointments(
          localDb
            .getAppointments()
            .map((a) => (a.id === appointment.id ? { ...a, reference } : a)),
        )
      } else {
        await updateDoc(doc(db, 'appointments', appointment.id), { reference })
      }
      repaired += 1
    }

    if (!appointment.patientId) {
      await linkPatient(appointment)
      repaired += 1
    }
  }
  return repaired
}

export async function getAppointmentsForPatient(
  patientId: string,
): Promise<Appointment[]> {
  if (!isFirebaseConfigured || !db) {
    return localDb
      .getAppointments()
      .filter((a) => a.patientId === patientId)
      .sort(byDateDesc)
  }
  const snap = await getDocs(
    query(collection(db, 'appointments'), where('patientId', '==', patientId)),
  )
  return snap.docs
    .map((d) => ({ ...(d.data() as Appointment), id: d.id }))
    .sort(byDateDesc)
}
