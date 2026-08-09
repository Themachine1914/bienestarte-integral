import {
  addDays,
  format,
  getDay,
  isBefore,
  parseISO,
  startOfDay,
} from 'date-fns'
import { es } from 'date-fns/locale'
import type { AvailabilityConfig } from '../types'

/** date-fns: Sunday=0 … Saturday=6. Our config uses Monday=1 … Friday=5. */
export function toConfigWeekday(jsDay: number): number {
  return jsDay === 0 ? 7 : jsDay
}

export function isActiveWeekday(
  date: Date,
  availability: AvailabilityConfig,
): boolean {
  const day = toConfigWeekday(getDay(date))
  return availability.activeDays.includes(day)
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

export function getBookableDates(
  availability: AvailabilityConfig,
  weeksAhead = 8,
): Date[] {
  const dates: Date[] = []
  const today = startOfDay(new Date())
  const end = addDays(today, weeksAhead * 7)

  for (let d = addDays(today, 0); d <= end; d = addDays(d, 1)) {
    if (isBefore(d, today)) continue
    if (isActiveWeekday(d, availability)) {
      dates.push(d)
    }
  }
  return dates
}

export function toDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}
