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
  deleteField,
} from 'firebase/firestore'
import { isBookableDateKey } from '../lib/dates'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { generateReference, normalizeReference } from '../lib/reference'
import { canPatientReschedule, rescheduleBlockMessage } from '../lib/policy'
import { notifyPush } from '../lib/push'
import {
  appointmentTimes,
  expandBlock,
  isSlotInPast,
  isValidTimeSlot,
  normalizeHours,
} from '../lib/time'
import type {
  Appointment,
  AppointmentStatus,
  InvoiceRequest,
  SessionHours,
  SlotLock,
} from '../types'
import { getAvailability } from './availability'
import { localDb } from './localDb'
import { createNotification } from './notifications'
import { findOrCreatePatient } from './patients'
import { getSettings } from './settings'
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
 * Claims every hour of a block atomically. In Firestore the transaction
 * fails if another booking created any of the same slot ids first, so
 * concurrent submissions cannot both win. Demo mode is single-threaded,
 * so a plain check is equivalent.
 */
async function claimSlots(date: string, times: string[]): Promise<void> {
  const taken = new Error('Ese horario ya no está disponible. Elige otra hora.')
  const now = new Date().toISOString()
  const locks: SlotLock[] = times.map((time) => ({
    id: slotId(date, time),
    date,
    time,
    createdAt: now,
  }))

  if (!isFirebaseConfigured || !db) {
    const existing = localDb.getSlots()
    if (locks.some((lock) => existing.some((s) => s.id === lock.id))) {
      throw taken
    }
    localDb.saveSlots([...existing, ...locks])
    return
  }

  const database = db
  await runTransaction(database, async (tx) => {
    const refs = locks.map((lock) => doc(database, 'slots', lock.id))
    const snaps = await Promise.all(refs.map((ref) => tx.get(ref)))
    if (snaps.some((snap) => snap.exists())) throw taken
    locks.forEach((lock, i) => {
      tx.set(refs[i], lock)
    })
  })
}

async function releaseSlots(date: string, times: string[]): Promise<void> {
  await Promise.all(times.map((time) => releaseSlot(date, time)))
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/

/**
 * `override` is the admin booking off the published grid on purpose: an extra
 * patient on a Friday, an early hour, a day she had blocked for herself. The
 * slot lock still applies, so the one thing she cannot do is double-book.
 */
async function assertBookable(
  date: string,
  time: string,
  { override = false }: { override?: boolean } = {},
): Promise<void> {
  if (!DATE_KEY.test(date) || !isValidTimeSlot(time)) {
    throw new Error('Fecha u hora inválida.')
  }
  if (override) return

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
  date: string
  time: string
  hours?: SessionHours
  notes: string
  paymentProofUrl: string
  paymentProofName?: string
}, options: { override?: boolean; skipPush?: boolean } = {}): Promise<Appointment> {
  const hours = normalizeHours(input.hours)
  const times = expandBlock(input.time, hours)

  for (const time of times) {
    await assertBookable(input.date, time, options)
  }

  const settings = await getSettings()
  const session = settings.sessionTypes.find((s) => s.id === input.sessionType)
  if (!session) throw new Error('Tipo de sesión inválido.')
  const price = session.priceDop * hours

  // Claim the times first. Creating the patient before this point left orphan
  // records behind whenever the slot turned out to be taken.
  const reference = generateReference()
  await claimSlots(input.date, times)

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
    price,
    date: input.date,
    time: input.time,
    hours,
    times,
    modality: 'virtual',
    status: 'pending',
    notes: input.notes,
    paymentProofUrl: input.paymentProofUrl,
    paymentProofName: input.paymentProofName ?? '',
    createdAt: now,
    updatedAt: now,
  }

  try {
    if (!isFirebaseConfigured || !db) {
      localDb.saveAppointments([...localDb.getAppointments(), appointment])
    } else {
      await setDoc(doc(db, 'appointments', reference), appointment)
    }
  } catch (error) {
    // Don't leave the times blocked by a booking that never completed.
    await releaseSlots(input.date, times).catch(() => undefined)
    throw error
  }

  const clock = times.length > 1 ? `${times[0]}–${times[times.length - 1]}` : times[0]
  await createNotification({
    type: 'appointment_created',
    appointmentId: appointment.id,
    message: `Nueva cita pendiente: ${appointment.patientName} — ${appointment.date} ${clock}`,
  }).catch(() => undefined)

  if (!options.skipPush) {
    void notifyPush({ kind: 'appointment', appointmentId: appointment.id })
  }

  return appointment
}

/**
 * Moves an appointment to a different slot.
 *
 * One function for both actors: the mechanics are identical and only the guard
 * differs, so splitting them would let the two copies drift apart on the first
 * bugfix applied to one of them. `actor` decides whether the 24-hour window
 * applies — but the real enforcement is firestore.rules, which cannot be
 * talked out of it by a client that skips this code.
 *
 * The write is a single transaction: the new slot is claimed and the
 * appointment is repointed together, so a failure can never leave the patient
 * holding neither slot.
 *
 * The old lock is only deleted here when the admin does it. `slots` allows
 * `delete` to signed-in users only, deliberately — opening it publicly would
 * let anyone free anyone else's booked time. A patient reschedule therefore
 * leaves the old lock behind, and reconcileData() clears it the next time the
 * admin opens the panel.
 */
export async function rescheduleAppointment(
  reference: string,
  newDate: string,
  newTime: string,
  options: { actor: 'patient' | 'admin'; override?: boolean },
): Promise<Appointment> {
  const current = await getAppointmentByReference(reference)
  if (!current) throw new Error('No encontramos ninguna cita con ese código')

  if (options.actor === 'patient') {
    const verdict = canPatientReschedule(current)
    if (!verdict.allowed) throw new Error(rescheduleBlockMessage(verdict.reason))
  }

  if (current.date === newDate && current.time === newTime) {
    throw new Error('Esa cita ya está en ese horario')
  }

  const hours = normalizeHours(current.hours)
  const oldTimes = appointmentTimes(current)
  const newTimes = expandBlock(newTime, hours)
  const override = options.actor === 'admin' && options.override === true

  for (const time of newTimes) {
    await assertBookable(newDate, time, { override })
  }

  const oldIds = oldTimes.map((time) => slotId(current.date, time))
  const newIds = newTimes.map((time) => slotId(newDate, time))
  const taken = new Error('Ese horario ya no está disponible. Elige otra hora.')
  const now = new Date().toISOString()

  const patch = {
    date: newDate,
    time: newTime,
    hours,
    times: newTimes,
    updatedAt: now,
    rescheduleCount: (current.rescheduleCount ?? 0) + 1,
    previousSlots: [...(current.previousSlots ?? []), oldIds[0]],
    reminderSentAt: deleteField(),
    attendanceConfirmedAt: deleteField(),
  }
  const updated: Appointment = {
    ...current,
    date: newDate,
    time: newTime,
    hours,
    times: newTimes,
    updatedAt: patch.updatedAt,
    rescheduleCount: patch.rescheduleCount,
    previousSlots: patch.previousSlots,
  }
  delete updated.reminderSentAt
  delete updated.attendanceConfirmedAt

  if (!isFirebaseConfigured || !db) {
    // Demo mode is single-threaded, so the sequence below is already atomic
    // from the app's point of view. Nothing else can interleave.
    const slots = localDb.getSlots()
    if (slots.some((s) => newIds.includes(s.id) && !oldIds.includes(s.id))) {
      throw taken
    }
    const kept = slots.filter((s) => !oldIds.includes(s.id))
    localDb.saveSlots([
      ...kept,
      ...newTimes.map((time) => ({
        id: slotId(newDate, time),
        date: newDate,
        time,
        createdAt: now,
      })),
    ])
    localDb.saveAppointments(
      localDb.getAppointments().map((a) => (a.id === current.id ? updated : a)),
    )
  } else {
    const database = db
    await runTransaction(database, async (tx) => {
      const newRefs = newIds.map((id) => doc(database, 'slots', id))
      const apptRef = doc(database, 'appointments', current.id)

      // Every read must happen before any write inside a Firestore transaction.
      const existing = await Promise.all(newRefs.map((ref) => tx.get(ref)))
      const apptSnap = await tx.get(apptRef)
      for (let i = 0; i < existing.length; i += 1) {
        if (existing[i].exists() && !oldIds.includes(newIds[i])) throw taken
      }
      if (!apptSnap.exists()) throw new Error('Cita no encontrada')

      newTimes.forEach((time, i) => {
        if (existing[i].exists()) return
        tx.set(newRefs[i], {
          id: newIds[i],
          date: newDate,
          time,
          createdAt: now,
        } satisfies SlotLock)
      })
      tx.update(apptRef, patch)

      if (options.actor === 'admin') {
        for (const oldId of oldIds) {
          if (!newIds.includes(oldId)) {
            tx.delete(doc(database, 'slots', oldId))
          }
        }
      }
    })
  }

  const from = oldTimes.length > 1 ? `${oldTimes[0]}–${oldTimes[oldTimes.length - 1]}` : current.time
  const to = newTimes.length > 1 ? `${newTimes[0]}–${newTimes[newTimes.length - 1]}` : newTime
  await createNotification({
    type: 'appointment_rescheduled',
    appointmentId: current.id,
    message: `Cita reprogramada por ${options.actor === 'admin' ? 'ti' : 'el paciente'}: ${updated.patientName} — de ${current.date} ${from} a ${newDate} ${to}`,
  })

  return updated
}

export async function confirmAttendance(
  reference: string,
): Promise<Appointment> {
  const current = await getAppointmentByReference(reference)
  if (!current) throw new Error('No encontramos ninguna cita con ese código')
  if (current.status !== 'pending' && current.status !== 'confirmed') {
    throw new Error('Esa cita ya no se puede confirmar')
  }
  if (current.attendanceConfirmedAt) return current

  const now = new Date().toISOString()
  const updated: Appointment = {
    ...current,
    attendanceConfirmedAt: now,
    updatedAt: now,
  }

  if (!isFirebaseConfigured || !db) {
    localDb.saveAppointments(
      localDb.getAppointments().map((a) => (a.id === current.id ? updated : a)),
    )
    return updated
  }
  await updateDoc(doc(db, 'appointments', current.id), {
    attendanceConfirmedAt: now,
    updatedAt: now,
  })
  return updated
}

export async function requestInvoice(
  reference: string,
  input: { legalName: string; rncCedula?: string; email?: string },
): Promise<Appointment> {
  const current = await getAppointmentByReference(reference)
  if (!current) throw new Error('No encontramos ninguna cita con ese código')
  if (current.invoice) return current

  const legalName = input.legalName.trim()
  if (legalName.length < 2) {
    throw new Error('Escribe el nombre que debe aparecer en el comprobante')
  }

  const invoice: InvoiceRequest = {
    requestedAt: new Date().toISOString(),
    legalName,
    rncCedula: (input.rncCedula ?? '').trim(),
    email: (input.email ?? '').trim().toLowerCase(),
  }
  const now = new Date().toISOString()
  const updated: Appointment = { ...current, invoice, updatedAt: now }

  if (!isFirebaseConfigured || !db) {
    localDb.saveAppointments(
      localDb.getAppointments().map((a) => (a.id === current.id ? updated : a)),
    )
    return updated
  }
  await updateDoc(doc(db, 'appointments', current.id), {
    invoice,
    updatedAt: now,
  })
  return updated
}

export async function markReminderSent(id: string): Promise<Appointment> {
  const current = await getAppointmentByReference(id)
  if (!current) throw new Error('Cita no encontrada')

  const now = new Date().toISOString()
  const updated: Appointment = { ...current, reminderSentAt: now, updatedAt: now }

  if (!isFirebaseConfigured || !db) {
    localDb.saveAppointments(
      localDb.getAppointments().map((a) => (a.id === current.id ? updated : a)),
    )
    return updated
  }
  await updateDoc(doc(db, 'appointments', current.id), {
    reminderSentAt: now,
    updatedAt: now,
  })
  return updated
}

/** Admin-created booking, for patients who call instead of using the site. */
export async function createManualAppointment(input: {
  name: string
  phone: string
  email: string
  sessionType: Appointment['sessionType']
  date: string
  time: string
  hours?: SessionHours
  notes: string
  override?: boolean
}): Promise<Appointment> {
  const { override = false, ...rest } = input
  const appointment = await createAppointment(
    { ...rest, paymentProofUrl: '', paymentProofName: '' },
    { override, skipPush: true },
  )
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

  // Rejecting or cancelling puts the times back on the calendar; confirming and
  // completing keep them held.
  if (!ACTIVE_STATUSES.includes(status)) {
    await releaseSlots(updated.date, appointmentTimes(updated))
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

  const wanted = new Set(
    active.flatMap((a) =>
      appointmentTimes(a).map((time) => slotId(a.date, time)),
    ),
  )

  for (const appointment of active) {
    for (const time of appointmentTimes(appointment)) {
      const id = slotId(appointment.date, time)
      if (existing.has(id)) continue
      existing.add(id)

      await writeSlotLock({
        id,
        date: appointment.date,
        time,
        createdAt: appointment.createdAt,
      })
      repaired += 1
    }
  }

  // Locks with no active appointment behind them. A patient reschedule cannot
  // delete its own old lock — `slots` only allows delete to a signed-in user —
  // so the hour it vacated stays blocked until this runs. Same cleanup covers
  // a reschedule that died between claiming the new slot and repointing the
  // appointment.
  for (const id of existing) {
    if (wanted.has(id)) continue
    const [date, time] = id.split('_')
    if (!date || !time) continue
    await releaseSlot(date, time)
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
