import { doc, getDoc, setDoc } from 'firebase/firestore'
import { DEFAULT_AVAILABILITY, PRACTICE_WEEKDAYS } from '../lib/defaults'
import { db, isFirebaseConfigured } from '../lib/firebase'
import type { AvailabilityConfig } from '../types'
import { localDb } from './localDb'

function sameDays(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false
  return a.every((day, i) => day === b[i])
}

function onlyPracticeDays(config: AvailabilityConfig): AvailabilityConfig {
  const activeDays = config.activeDays.filter((d) =>
    PRACTICE_WEEKDAYS.includes(d),
  )
  return {
    ...config,
    activeDays: activeDays.length > 0 ? activeDays : [...PRACTICE_WEEKDAYS],
  }
}

export async function getAvailability(): Promise<AvailabilityConfig> {
  if (!isFirebaseConfigured || !db) {
    const raw = localDb.getAvailability()
    const stored = onlyPracticeDays(raw)
    if (!sameDays(stored.activeDays, raw.activeDays)) {
      localDb.saveAvailability(stored)
    }
    return stored
  }
  const snap = await getDoc(doc(db, 'availability', 'default'))
  if (!snap.exists()) {
    await setDoc(doc(db, 'availability', 'default'), DEFAULT_AVAILABILITY)
    return DEFAULT_AVAILABILITY
  }
  const raw = snap.data() as AvailabilityConfig
  const stored = onlyPracticeDays(raw)
  if (!sameDays(stored.activeDays, raw.activeDays)) {
    await setDoc(doc(db, 'availability', 'default'), stored)
  }
  return stored
}

export async function saveAvailability(
  config: AvailabilityConfig,
): Promise<void> {
  const next = onlyPracticeDays(config)
  if (!isFirebaseConfigured || !db) {
    localDb.saveAvailability(next)
    return
  }
  await setDoc(doc(db, 'availability', 'default'), next)
}
