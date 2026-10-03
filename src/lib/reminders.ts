import type { Appointment } from '../types'
import { formatDisplayDate } from './dates'
import { formatAppointmentClock } from './time'
import { toWhatsAppNumber } from './phone'

const REMINDABLE: Appointment['status'][] = ['pending', 'confirmed']

/** Dominican Republic is UTC-4 all year. */
const PRACTICE_OFFSET_MS = 4 * 60 * 60 * 1000

/** Calendar date in practice time, optionally shifted by whole days. */
export function practiceDateKey(now: Date = new Date(), plusDays = 0): string {
  const ast = new Date(now.getTime() - PRACTICE_OFFSET_MS)
  ast.setUTCDate(ast.getUTCDate() + plusDays)
  const y = ast.getUTCFullYear()
  const m = String(ast.getUTCMonth() + 1).padStart(2, '0')
  const d = String(ast.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function needsWhatsAppReminder(
  appointment: Appointment,
  now: Date = new Date(),
): boolean {
  if (!REMINDABLE.includes(appointment.status)) return false
  if (appointment.reminderSentAt) return false
  if (!appointment.patientPhone.trim()) return false
  return appointment.date === practiceDateKey(now, 1)
}

export function reminderMessage(
  appointment: Appointment,
  confirmUrl: string,
): string {
  return [
    `Hola ${appointment.patientName.trim() || 'buenas'},`,
    `te recordamos tu sesión de mañana ${formatDisplayDate(appointment.date)} a las ${formatAppointmentClock(appointment)} con Orlandia (virtual).`,
    `Confirma tu asistencia aquí: ${confirmUrl}`,
  ].join(' ')
}

export function lookupUrlFor(reference: string, siteUrl: string): string {
  const base = siteUrl.replace(/\/$/, '')
  return `${base}/mis-citas?codigo=${encodeURIComponent(reference)}`
}

export function confirmUrlFor(reference: string, siteUrl: string): string {
  return `${lookupUrlFor(reference, siteUrl)}&confirmar=1`
}

/**
 * Sent when Orlandia moves a session for her own reasons. The note is her
 * explanation in her own words, so it goes through untouched.
 */
export function rescheduleNoticeMessage(
  appointment: Appointment,
  newDate: string,
  newTime: string,
  note: string,
  lookupUrl: string,
): string {
  const parts = [
    `Hola ${appointment.patientName.trim() || 'buenas'},`,
    `tuve que mover tu sesión: queda para el ${formatDisplayDate(newDate)} a las ${formatAppointmentClock({ time: newTime, hours: appointment.hours })}.`,
  ]
  const reason = note.trim()
  if (reason) parts.push(reason)
  parts.push(`Puedes verla con tu código ${appointment.reference}: ${lookupUrl}`)
  return parts.join(' ')
}

export function whatsappHref(phone: string, text: string): string {
  return `https://wa.me/${toWhatsAppNumber(phone)}?text=${encodeURIComponent(text)}`
}

export function receiptUrlFor(reference: string, siteUrl: string): string {
  return `${lookupUrlFor(reference, siteUrl)}&comprobante=1`
}

/**
 * Sent by Orlandia from the patient record. A future session reads as a
 * confirmation; a past one as the receipt for what already happened.
 */
export function receiptMessage(
  appointment: Appointment,
  receiptUrl: string,
  now: Date = new Date(),
): string {
  const when = `${formatDisplayDate(appointment.date)} a las ${formatAppointmentClock(appointment)}`
  const upcoming =
    appointment.status === 'confirmed' &&
    appointment.date >= practiceDateKey(now)
  return [
    `Hola ${appointment.patientName.trim() || 'buenas'},`,
    upcoming
      ? `tu sesión con Orlandia (virtual) quedó confirmada para el ${when}.`
      : `te comparto el comprobante de tu sesión del ${when} con Orlandia (virtual).`,
    `Aquí puedes ver, imprimir o guardar tu comprobante: ${receiptUrl}`,
    `Tu código de seguimiento es ${appointment.reference}.`,
  ].join(' ')
}

export function mailtoHref(email: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
