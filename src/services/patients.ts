import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { asyncCache } from '../lib/asyncCache'
import { commitInBatches } from '../lib/firestoreBatch'
import { db, isFirebaseConfigured } from '../lib/firebase'
import type { Patient } from '../types'
import { localDb, uid } from './localDb'

const patientsCache = asyncCache<Patient[]>(10_000)

function byName(a: Patient, b: Patient): number {
  return a.name.localeCompare(b.name, 'es')
}

/** Same match the panel has always used: email, or phone compared by digits. */
export function matchPatient(
  patients: Patient[],
  input: { email: string; phone: string },
): Patient | undefined {
  const email = input.email.trim().toLowerCase()
  const phone = input.phone.replace(/\D/g, '')
  return patients.find(
    (p) =>
      (email !== '' && p.email.toLowerCase() === email) ||
      p.phone.replace(/\D/g, '') === phone,
  )
}

async function loadPatients(): Promise<Patient[]> {
  if (!isFirebaseConfigured || !db) {
    return localDb.getPatients().sort(byName)
  }
  const snap = await getDocs(collection(db, 'patients'))
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Patient)
    .sort(byName)
}

export async function listPatients(): Promise<Patient[]> {
  return patientsCache.get(loadPatients)
}

function rememberPatients(patients: Patient[]) {
  patientsCache.set([...patients].sort(byName))
}

function newPatientId(): string {
  if (!isFirebaseConfigured || !db) return uid('pat')
  return doc(collection(db, 'patients')).id
}

export async function findOrCreatePatient(input: {
  name: string
  phone: string
  email: string
}): Promise<Patient> {
  const email = input.email.trim().toLowerCase()
  const phone = input.phone.trim()
  const name = input.name.trim()
  const now = new Date().toISOString()
  const patients = [...(await listPatients())]
  const existing = matchPatient(patients, { email, phone })

  if (existing) {
    const updated: Patient = {
      ...existing,
      name,
      phone,
      email: email || existing.email,
      updatedAt: now,
    }
    const next = patients.map((p) => (p.id === existing.id ? updated : p))
    if (!isFirebaseConfigured || !db) {
      localDb.savePatients(next)
    } else {
      await setDoc(doc(db, 'patients', existing.id), updated)
    }
    rememberPatients(next)
    return updated
  }

  const patient: Patient = {
    id: newPatientId(),
    name,
    phone,
    email,
    privateNotes: '',
    createdAt: now,
    updatedAt: now,
  }
  const next = [...patients, patient]
  if (!isFirebaseConfigured || !db) {
    localDb.savePatients(next)
  } else {
    await setDoc(doc(db, 'patients', patient.id), patient)
  }
  rememberPatients(next)
  return patient
}

/**
 * Links many people to patient records with one read of the collection.
 * Doing this one appointment at a time re-downloaded every patient on each
 * pass, which is what made the admin panel crawl once the agenda grew.
 */
export async function resolvePatientIds(
  people: Array<{ key: string; name: string; phone: string; email: string }>,
): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  if (people.length === 0) return result

  const now = new Date().toISOString()
  const list = [...(await listPatients())]
  const pending: Patient[] = []

  function stage(patient: Patient) {
    const index = pending.findIndex((p) => p.id === patient.id)
    if (index >= 0) pending[index] = patient
    else pending.push(patient)
  }

  for (const person of people) {
    const email = person.email.trim().toLowerCase()
    const phone = person.phone.trim()
    const name = person.name.trim()
    const existing = matchPatient(list, { email, phone })
    if (existing) {
      const updated: Patient = {
        ...existing,
        name,
        phone,
        email: email || existing.email,
        updatedAt: now,
      }
      const changed =
        updated.name !== existing.name ||
        updated.phone !== existing.phone ||
        updated.email !== existing.email
      const index = list.findIndex((p) => p.id === existing.id)
      list[index] = updated
      if (changed) stage(updated)
      result.set(person.key, updated.id)
      continue
    }

    const patient: Patient = {
      id: newPatientId(),
      name,
      phone,
      email,
      privateNotes: '',
      createdAt: now,
      updatedAt: now,
    }
    list.push(patient)
    stage(patient)
    result.set(person.key, patient.id)
  }

  if (pending.length > 0) {
    if (!isFirebaseConfigured || !db) {
      localDb.savePatients(list)
    } else {
      const database = db
      await commitInBatches(
        database,
        pending.map(
          (patient) => (batch) =>
            batch.set(doc(database, 'patients', patient.id), patient),
        ),
      )
    }
  }
  rememberPatients(list)
  return result
}

export async function updatePatientNotes(
  id: string,
  privateNotes: string,
): Promise<void> {
  const now = new Date().toISOString()
  if (!isFirebaseConfigured || !db) {
    const patients = localDb.getPatients()
    const next = patients.map((p) =>
      p.id === id ? { ...p, privateNotes, updatedAt: now } : p,
    )
    localDb.savePatients(next)
    rememberPatients(next)
    return
  }
  await updateDoc(doc(db, 'patients', id), { privateNotes, updatedAt: now })
  const current = patientsCache.peek()
  if (current) {
    rememberPatients(
      current.map((p) =>
        p.id === id ? { ...p, privateNotes, updatedAt: now } : p,
      ),
    )
  }
}
