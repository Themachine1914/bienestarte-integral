/**
 * Slot times are plain "HH:mm" strings. A shape check alone is not enough —
 * "99:99" matches /\d{2}:\d{2}/ and, once it reaches the calendar export,
 * rolls over into a different day. Everything here validates the range too.
 */

const SHAPE = /^(\d{2}):(\d{2})$/

export function parseTimeSlot(value: string): { hours: number; minutes: number } | null {
  const match = SHAPE.exec(value.trim())
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours < 0 || hours > 23) return null
  if (minutes < 0 || minutes > 59) return null
  return { hours, minutes }
}

export function isValidTimeSlot(value: string): boolean {
  return parseTimeSlot(value) !== null
}

/** Minutes since midnight, or null when the slot is malformed. */
export function slotToMinutes(value: string): number | null {
  const parsed = parseTimeSlot(value)
  if (!parsed) return null
  return parsed.hours * 60 + parsed.minutes
}

export function compareSlots(a: string, b: string): number {
  return (slotToMinutes(a) ?? 0) - (slotToMinutes(b) ?? 0)
}

/** Normalises, validates, de-duplicates and sorts a list of slot strings. */
export function normalizeSlots(values: string[]): string[] {
  const seen = new Set<string>()
  for (const raw of values) {
    const value = raw.trim()
    if (!isValidTimeSlot(value)) continue
    seen.add(value)
  }
  return [...seen].sort(compareSlots)
}

/**
 * True when the slot has already started. Only same-day slots can be past —
 * a future date is never past, whatever the clock says.
 */
export function isSlotInPast(
  dateKey: string,
  time: string,
  now: Date = new Date(),
): boolean {
  const minutes = slotToMinutes(time)
  if (minutes === null) return true

  const todayKey = toLocalDateKey(now)
  if (dateKey > todayKey) return false
  if (dateKey < todayKey) return true

  return minutes <= now.getHours() * 60 + now.getMinutes()
}

/** yyyy-MM-dd in the browser's own timezone (never UTC-shifted). */
export function toLocalDateKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
