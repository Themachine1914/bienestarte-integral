import { doc, getDoc, setDoc } from 'firebase/firestore'
import { DEFAULT_AVAILABILITY } from '../lib/defaults'
import { db, isFirebaseConfigured } from '../lib/firebase'
import type { AvailabilityConfig } from '../types'
import { localDb } from './localDb'

export async function getAvailability(): Promise<AvailabilityConfig> {
  if (!isFirebaseConfigured || !db) {
    return localDb.getAvailability()
  }
  const snap = await getDoc(doc(db, 'availability', 'default'))
  if (!snap.exists()) {
    await setDoc(doc(db, 'availability', 'default'), DEFAULT_AVAILABILITY)
    return DEFAULT_AVAILABILITY
  }
  return snap.data() as AvailabilityConfig
}

export async function saveAvailability(
  config: AvailabilityConfig,
): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    localDb.saveAvailability(config)
    return
  }
  await setDoc(doc(db, 'availability', 'default'), config)
}
