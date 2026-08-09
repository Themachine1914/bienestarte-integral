import { addDoc, collection, getDocs } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import type { AppNotification } from '../types'
import { localDb, uid } from './localDb'

export async function createNotification(input: {
  type: AppNotification['type']
  appointmentId: string
  message: string
}): Promise<AppNotification> {
  const item: AppNotification = {
    id: uid('ntf'),
    type: input.type,
    appointmentId: input.appointmentId,
    message: input.message,
    read: false,
    createdAt: new Date().toISOString(),
  }

  if (!isFirebaseConfigured || !db) {
    localDb.saveNotifications([item, ...localDb.getNotifications()])
    return item
  }

  const ref = await addDoc(collection(db, 'notifications'), {
    type: item.type,
    appointmentId: item.appointmentId,
    message: item.message,
    read: item.read,
    createdAt: item.createdAt,
  })
  return { ...item, id: ref.id }
}

export async function listNotifications(): Promise<AppNotification[]> {
  if (!isFirebaseConfigured || !db) {
    return localDb.getNotifications()
  }
  const snap = await getDocs(collection(db, 'notifications'))
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as AppNotification)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
