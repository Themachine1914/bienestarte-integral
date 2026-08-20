import { collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import type { SlotLock } from '../types'
import { localDb } from './localDb'

/**
 * Booked slots live in their own collection, holding nothing but a date, a
 * time and an appointment id.
 *
 * Two reasons. First, the public booking page has to know which times are
 * taken — pointing it here means it never reads a patient's name, phone or
 * notes. Second, the document id is deterministic, so creating it inside a
 * transaction is an atomic "claim this slot": two people submitting the same
 * time at once, one wins and the other gets a clear error instead of a
 * double booking.
 */

export function slotId(date: string, time: string): string {
  return `${date}_${time}`
}

export async function getBookedSlotsForDate(date: string): Promise<string[]> {
  if (!isFirebaseConfigured || !db) {
    return localDb
      .getSlots()
      .filter((s) => s.date === date)
      .map((s) => s.time)
  }
  const snap = await getDocs(
    query(collection(db, 'slots'), where('date', '==', date)),
  )
  return snap.docs.map((d) => (d.data() as SlotLock).time)
}

/** Every claimed slot id. Used to backfill locks for pre-existing bookings. */
export async function listSlotIds(): Promise<string[]> {
  if (!isFirebaseConfigured || !db) {
    return localDb.getSlots().map((s) => s.id)
  }
  const snap = await getDocs(collection(db, 'slots'))
  return snap.docs.map((d) => d.id)
}

/** Frees a slot so the time can be booked again (cancelled/rejected only). */
export async function releaseSlot(date: string, time: string): Promise<void> {
  const id = slotId(date, time)
  if (!isFirebaseConfigured || !db) {
    localDb.saveSlots(localDb.getSlots().filter((s) => s.id !== id))
    return
  }
  await deleteDoc(doc(db, 'slots', id))
}
