import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import type { Appointment, AppointmentStatus } from '../types'
import { localDb, uid } from './localDb'
import { createNotification } from './notifications'
import { findOrCreatePatient } from './patients'

export async function listAppointments(): Promise<Appointment[]> {
  if (!isFirebaseConfigured || !db) {
    return localDb
      .getAppointments()
      .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
  }
  const snap = await getDocs(collection(db, 'appointments'))
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Appointment)
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
}

export async function getAppointmentsByContact(
  contact: string,
): Promise<Appointment[]> {
  const value = contact.trim().toLowerCase()
  const digits = contact.replace(/\D/g, '')
  const all = await listAppointments()
  return all.filter(
    (a) =>
      a.patientEmail.toLowerCase() === value ||
      (digits.length >= 7 &&
        a.patientPhone.replace(/\D/g, '').includes(digits)),
  )
}

export async function getBookedSlotsForDate(date: string): Promise<string[]> {
  const all = await listAppointments()
  return all
    .filter(
      (a) =>
        a.date === date &&
        (a.status === 'pending' || a.status === 'confirmed'),
    )
    .map((a) => a.time)
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
  const patient = await findOrCreatePatient({
    name: input.name,
    phone: input.phone,
    email: input.email,
  })
  const now = new Date().toISOString()
  const booked = await getBookedSlotsForDate(input.date)
  if (booked.includes(input.time)) {
    throw new Error('Ese horario ya no está disponible. Elige otra hora.')
  }

  const base: Omit<Appointment, 'id'> = {
    patientId: patient.id,
    patientName: patient.name,
    patientPhone: patient.phone,
    patientEmail: patient.email,
    sessionType: input.sessionType,
    price: input.price,
    date: input.date,
    time: input.time,
    modality: 'virtual',
    status: 'pending',
    notes: input.notes,
    paymentProofUrl: input.paymentProofUrl,
    paymentProofName: input.paymentProofName,
    createdAt: now,
    updatedAt: now,
  }

  let appointment: Appointment

  if (!isFirebaseConfigured || !db) {
    appointment = { id: uid('apt'), ...base }
    localDb.saveAppointments([...localDb.getAppointments(), appointment])
  } else {
    const ref = await addDoc(collection(db, 'appointments'), base)
    appointment = { id: ref.id, ...base }
    await setDoc(doc(db, 'appointments', ref.id), appointment)
  }

  await createNotification({
    type: 'appointment_created',
    appointmentId: appointment.id,
    message: `Nueva cita pendiente: ${appointment.patientName} — ${appointment.date} ${appointment.time}`,
  })

  return appointment
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<Appointment> {
  const now = new Date().toISOString()

  if (!isFirebaseConfigured || !db) {
    const list = localDb.getAppointments()
    const current = list.find((a) => a.id === id)
    if (!current) throw new Error('Cita no encontrada')
    const updated = { ...current, status, updatedAt: now }
    localDb.saveAppointments(list.map((a) => (a.id === id ? updated : a)))
    if (status === 'confirmed' || status === 'rejected') {
      await createNotification({
        type:
          status === 'confirmed'
            ? 'appointment_confirmed'
            : 'appointment_rejected',
        appointmentId: id,
        message: `Cita ${status === 'confirmed' ? 'confirmada' : 'rechazada'}: ${updated.patientName}`,
      })
    }
    return updated
  }

  await updateDoc(doc(db, 'appointments', id), { status, updatedAt: now })
  const all = await listAppointments()
  const updated = all.find((a) => a.id === id)
  if (!updated) throw new Error('Cita no encontrada')

  if (status === 'confirmed' || status === 'rejected') {
    await createNotification({
      type:
        status === 'confirmed'
          ? 'appointment_confirmed'
          : 'appointment_rejected',
      appointmentId: id,
      message: `Cita ${status === 'confirmed' ? 'confirmada' : 'rechazada'}: ${updated.patientName}`,
    })
  }
  return updated
}

export async function getAppointmentsForPatient(
  patientId: string,
): Promise<Appointment[]> {
  if (!isFirebaseConfigured || !db) {
    return localDb
      .getAppointments()
      .filter((a) => a.patientId === patientId)
      .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
  }
  const q = query(
    collection(db, 'appointments'),
    where('patientId', '==', patientId),
  )
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Appointment)
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
}
