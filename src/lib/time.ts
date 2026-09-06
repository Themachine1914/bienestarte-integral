import type { Appointment, SessionHours } from '../types'

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

/** How the practice shows a slot: "9:00 AM", "2:00 PM". */
export function formatSlotLabel(value: string): string {
  const parsed = parseTimeSlot(value)
  if (!parsed) return value
  const period = parsed.hours >= 12 ? 'PM' : 'AM'
  const hour12 = parsed.hours % 12 || 12
  const minutes = String(parsed.minutes).padStart(2, '0')
  return `${hour12}:${minutes} ${period}`
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

export function normalizeHours(value: unknown): SessionHours {
  return value === 2 || value === 3 ? value : 1
}

function minutesToSlot(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

/**
 * Consecutive hours starting at `start`, each 60 minutes apart.
 * 11:00 + 2 hours is not a morning+afternoon join: 12:00 is not on the grid,
 * so `startsForDuration` will reject it.
 */
export function expandBlock(start: string, hours: SessionHours): string[] {
  const startMinutes = slotToMinutes(start)
  if (startMinutes === null) return [start]
  const times = [start]
  for (let i = 1; i < hours; i += 1) {
    times.push(minutesToSlot(startMinutes + i * 60))
  }
  return times
}

export function appointmentTimes(
  appointment: Pick<Appointment, 'time' | 'hours' | 'times'>,
): string[] {
  const derived = expandBlock(appointment.time, normalizeHours(appointment.hours))
  const stored = appointment.times
  if (
    stored &&
    stored.length === derived.length &&
    stored.every((time, i) => time === derived[i])
  ) {
    return stored
  }
  return derived
}

/** Starts where every hour of the block is on the grid and still free. */
export function startsForDuration(
  hours: SessionHours,
  freeSlots: string[],
  gridSlots: string[],
): string[] {
  const free = new Set(freeSlots)
  const grid = new Set(gridSlots)
  return gridSlots.filter((start) => {
    const block = expandBlock(start, hours)
    if (block.length !== hours) return false
    return block.every((time) => grid.has(time) && free.has(time))
  })
}

export function formatBlockLabel(times: string[]): string {
  const labels = times.map(formatSlotLabel)
  if (labels.length <= 1) return labels[0] ?? ''
  if (labels.length === 2) return `${labels[0]} y ${labels[1]}`
  return `${labels.slice(0, -1).join(', ')} y ${labels[labels.length - 1]}`
}

export function formatAppointmentClock(
  appointment: Pick<Appointment, 'time' | 'hours' | 'times'>,
): string {
  return formatBlockLabel(appointmentTimes(appointment))
}

/** Wall-clock span for a block of 50-minute sessions on the hour. */
export function blockDurationMinutes(
  hours: SessionHours,
  sessionMinutes = 50,
): number {
  return (hours - 1) * 60 + sessionMinutes
}

export function hoursLabel(hours: SessionHours): string {
  if (hours === 1) return '1 sesión'
  return `${hours} sesiones corridas`
}

export function hoursHint(hours: SessionHours): string {
  if (hours === 1) return '50 min'
  return `${hours} cupos de 50 min`
}
