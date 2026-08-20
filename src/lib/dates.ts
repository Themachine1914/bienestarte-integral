import { addDays, format, getDay, parseISO, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import type { AvailabilityConfig } from '../types'
import { PRACTICE_WEEKDAYS } from './defaults'
import { isSlotInPast, toLocalDateKey } from './time'

/** date-fns: Sunday=0 … Saturday=6. Our config uses Monday=1 … Sunday=7. */
export function toConfigWeekday(jsDay: number): number {
  return jsDay === 0 ? 7 : jsDay
}

export function isActiveWeekday(
  date: Date,
  availability: AvailabilityConfig,
): boolean {
  const day = toConfigWeekday(getDay(date))
  return (
    PRACTICE_WEEKDAYS.includes(day) && availability.activeDays.includes(day)
  )
}

export function isBlockedDate(
  date: Date,
  availability: AvailabilityConfig,
): boolean {
  return (availability.blockedDates ?? []).includes(toDateKey(date))
}

export function formatDisplayDate(isoDate: string): string {
  return format(parseISO(isoDate), "EEEE d 'de' MMMM yyyy", { locale: es })
}

export function formatCurrencyDop(amount: number): string {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Slots still open on a given day: configured, not already booked, and — for
 * today — not already past. Booking a 09:00 session at 4pm was possible before.
 */
export function getOpenSlots(
  dateKey: string,
  availability: AvailabilityConfig,
  bookedSlots: string[],
  now: Date = new Date(),
): string[] {
  return availability.slots.filter(
    (slot) => !bookedSlots.includes(slot) && !isSlotInPast(dateKey, slot, now),
  )
}

/**
 * Dates a patient may pick. Today is included only while it still has a slot
 * left, so the calendar never offers a day that can no longer be booked.
 */
export function getBookableDates(
  availability: AvailabilityConfig,
  weeksAhead = 8,
  now: Date = new Date(),
): Date[] {
  const dates: Date[] = []
  const today = startOfDay(now)
  const todayKey = toLocalDateKey(now)

  for (let i = 0; i <= weeksAhead * 7; i += 1) {
    const day = addDays(today, i)
    if (!isActiveWeekday(day, availability)) continue
    if (isBlockedDate(day, availability)) continue

    const key = toDateKey(day)
    if (key === todayKey) {
      const remaining = availability.slots.some(
        (slot) => !isSlotInPast(key, slot, now),
      )
      if (!remaining) continue
    }
    dates.push(day)
  }
  return dates
}

/** Guards a booking request against a date the practice does not serve. */
export function isBookableDateKey(
  dateKey: string,
  availability: AvailabilityConfig,
  now: Date = new Date(),
): boolean {
  return getBookableDates(availability, 52, now).some(
    (d) => toDateKey(d) === dateKey,
  )
}

export function toDateKey(date: Date): string {
  return toLocalDateKey(date)
}
