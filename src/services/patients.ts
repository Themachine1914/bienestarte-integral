import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import type { Patient } from '../types'
import { localDb, uid } from './localDb'

export async function listPatients(): Promise<Patient[]> {
  if (!isFirebaseConfigured || !db) {
    return localDb.getPatients().sort((a, b) =>
      a.name.localeCompare(b.name, 'es'),
    )
  }
  const snap = await getDocs(collection(db, 'patients'))
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Patient)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

export async function findOrCreatePatient(input: {
  name: string
  phone: string
  email: string
}): Promise<Patient> {
  const email = input.email.trim().toLowerCase()
  const phone = input.phone.trim()
  const now = new Date().toISOString()

  if (!isFirebaseConfigured || !db) {
    const patients = localDb.getPatients()
    const existing = patients.find(
      (p) =>
        p.email.toLowerCase() === email ||
        p.phone.replace(/\D/g, '') === phone.replace(/\D/g, ''),
    )
    if (existing) {
      const updated = {
        ...existing,
        name: input.name.trim(),
        phone,
        email,
        updatedAt: now,
      }
      localDb.savePatients(
        patients.map((p) => (p.id === existing.id ? updated : p)),
      )
      return updated
    }
    const patient: Patient = {
      id: uid('pat'),
      name: input.name.trim(),
      phone,
      email,
      privateNotes: '',
      createdAt: now,
      updatedAt: now,
    }
    localDb.savePatients([...patients, patient])
    return patient
  }

  const snap = await getDocs(collection(db, 'patients'))
  const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Patient)
  const existing = all.find(
    (p) =>
      p.email.toLowerCase() === email ||
      p.phone.replace(/\D/g, '') === phone.replace(/\D/g, ''),
  )
  if (existing) {
    const updated = {
      ...existing,
      name: input.name.trim(),
      phone,
      email,
      updatedAt: now,
    }
    await setDoc(doc(db, 'patients', existing.id), updated)
    return updated
  }

  const ref = doc(collection(db, 'patients'))
  const patient: Patient = {
    id: ref.id,
    name: input.name.trim(),
    phone,
    email,
    privateNotes: '',
    createdAt: now,
    updatedAt: now,
  }
  await setDoc(ref, patient)
  return patient
}

export async function updatePatientNotes(
  id: string,
  privateNotes: string,
): Promise<void> {
  const now = new Date().toISOString()
  if (!isFirebaseConfigured || !db) {
    const patients = localDb.getPatients()
    localDb.savePatients(
      patients.map((p) =>
        p.id === id ? { ...p, privateNotes, updatedAt: now } : p,
      ),
    )
    return
  }
  await updateDoc(doc(db, 'patients', id), { privateNotes, updatedAt: now })
}
