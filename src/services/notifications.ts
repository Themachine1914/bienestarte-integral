import { addDoc, collection, getDocs, limit, orderBy, query } from 'firebase/firestore'
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

/** The dashboard only shows the latest few. The rest can stay in Firestore. */
const RECENT_NOTIFICATIONS = 30

function newestFirst(items: AppNotification[]): AppNotification[] {
  return [...items]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, RECENT_NOTIFICATIONS)
}

export async function listNotifications(): Promise<AppNotification[]> {
  if (!isFirebaseConfigured || !db) {
    return newestFirst(localDb.getNotifications())
  }
  try {
    const snap = await getDocs(
      query(
        collection(db, 'notifications'),
        orderBy('createdAt', 'desc'),
        limit(RECENT_NOTIFICATIONS),
      ),
    )
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AppNotification)
  } catch {
    const snap = await getDocs(collection(db, 'notifications'))
    return newestFirst(
      snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AppNotification),
    )
  }
}
