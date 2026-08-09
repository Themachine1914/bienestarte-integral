import { doc, getDoc, setDoc } from 'firebase/firestore'
import { DEFAULT_SETTINGS } from '../lib/defaults'
import { db, isFirebaseConfigured } from '../lib/firebase'
import type { AppSettings } from '../types'
import { localDb } from './localDb'

export async function getSettings(): Promise<AppSettings> {
  if (!isFirebaseConfigured || !db) {
    return localDb.getSettings()
  }
  const snap = await getDoc(doc(db, 'settings', 'general'))
  if (!snap.exists()) {
    await setDoc(doc(db, 'settings', 'general'), DEFAULT_SETTINGS)
    return DEFAULT_SETTINGS
  }
  return snap.data() as AppSettings
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    localDb.saveSettings(settings)
    return
  }
  await setDoc(doc(db, 'settings', 'general'), settings)
}
