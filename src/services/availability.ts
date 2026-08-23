import { doc, getDoc, setDoc } from 'firebase/firestore'
import { DEFAULT_AVAILABILITY, PRACTICE_WEEKDAYS } from '../lib/defaults'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { normalizeSlots } from '../lib/time'
import type { AvailabilityConfig } from '../types'
import { localDb } from './localDb'

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/

/**
 * Keeps stored config within what the practice actually supports: only
 * Monday–Wednesday, only real "HH:mm" times, only well-formed blocked dates.
 *
 * An empty `activeDays` is respected rather than reset — that is how the
 * agenda gets closed for a holiday week.
 */
function normalize(config: Partial<AvailabilityConfig>): AvailabilityConfig {
  const activeDays = [...new Set(config.activeDays ?? [])]
    .filter((d) => PRACTICE_WEEKDAYS.includes(d))
    .sort((a, b) => a - b)

  const blockedDates = [...new Set(config.blockedDates ?? [])]
    .filter((d) => DATE_KEY.test(d))
    .sort()

  const slots = normalizeSlots(config.slots ?? [])
  const duration = Number(config.sessionDurationMinutes)

  return {
    activeDays,
    slots: slots.length > 0 ? slots : [...DEFAULT_AVAILABILITY.slots],
    sessionDurationMinutes:
      Number.isFinite(duration) && duration >= 15 && duration <= 240
        ? duration
        : DEFAULT_AVAILABILITY.sessionDurationMinutes,
    blockedDates,
  }
}

/**
 * Compares by value, field by field in a fixed order.
 *
 * Stringifying the objects whole compared key *order* too, and Firestore hands
 * back fields in its own order — so an already-normalized document looked
 * changed, and every visitor tried to rewrite it. Writing here needs auth, so
 * the booking page died on load for the public.
 */
function isSameConfig(a: AvailabilityConfig, b: AvailabilityConfig): boolean {
  const fingerprint = (c: Partial<AvailabilityConfig>) =>
    JSON.stringify([
      c.activeDays ?? null,
      c.slots ?? null,
      c.sessionDurationMinutes ?? null,
      c.blockedDates ?? null,
    ])
  return fingerprint(a) === fingerprint(b)
}

export async function getAvailability(): Promise<AvailabilityConfig> {
  if (!isFirebaseConfigured || !db) {
    const raw = localDb.getAvailability()
    const clean = normalize(raw)
    if (!isSameConfig(clean, raw)) localDb.saveAvailability(clean)
    return clean
  }

  const ref = doc(db, 'availability', 'default')
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, DEFAULT_AVAILABILITY)
    return DEFAULT_AVAILABILITY
  }

  const raw = snap.data() as AvailabilityConfig
  const clean = normalize(raw)
  // Best-effort self-heal. Only the admin may write here, so a visitor who
  // happens to load a stale document still gets the cleaned config to book
  // with instead of an error page.
  if (!isSameConfig(clean, raw)) {
    await setDoc(ref, clean).catch(() => undefined)
  }
  return clean
}

export async function saveAvailability(
  config: AvailabilityConfig,
): Promise<void> {
  const next = normalize(config)
  if (!isFirebaseConfigured || !db) {
    localDb.saveAvailability(next)
    return
  }
  await setDoc(doc(db, 'availability', 'default'), next)
}
