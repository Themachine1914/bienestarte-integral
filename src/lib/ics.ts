import type { Appointment } from '../types'
import { parseTimeSlot } from './time'

/**
 * The practice runs on Dominican time, which has been a fixed UTC-4 with no
 * daylight saving since 2000. Emitting a VTIMEZONE and tagging DTSTART with it
 * means a patient abroad sees the session at the right local hour — the old
 * floating times drifted by whatever their own offset happened to be.
 */
const TZID = 'America/Santo_Domingo'

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** RFC 5545 escaping: commas, semicolons, backslashes and newlines. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/** Long lines must be folded at 75 octets or strict parsers reject them. */
function fold(line: string): string {
  if (line.length <= 75) return line
  const parts: string[] = [line.slice(0, 75)]
  let rest = line.slice(75)
  while (rest.length > 74) {
    parts.push(` ${rest.slice(0, 74)}`)
    rest = rest.slice(74)
  }
  if (rest.length > 0) parts.push(` ${rest}`)
  return parts.join('\r\n')
}

function localStamp(date: string, time: string, addMinutes: number): string {
  const [y, m, d] = date.split('-').map(Number)
  const parsed = parseTimeSlot(time)
  if (!parsed) throw new Error(`Hora inválida en la cita: "${time}"`)

  const dt = new Date(y, m - 1, d, parsed.hours, parsed.minutes, 0)
  dt.setMinutes(dt.getMinutes() + addMinutes)
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`
}

/** DTSTAMP is when the file was produced, in UTC — not the event time. */
function utcStamp(now: Date): string {
  return `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`
}

export function buildIcsContent(
  appointment: Appointment,
  durationMinutes = 50,
  now: Date = new Date(),
): string {
  const start = localStamp(appointment.date, appointment.time, 0)
  const end = localStamp(appointment.date, appointment.time, durationMinutes)

  const description = [
    `Paciente: ${appointment.patientName}`,
    `Teléfono: ${appointment.patientPhone}`,
    `Email: ${appointment.patientEmail}`,
    `Tipo: ${appointment.sessionType === 'individual' ? 'Individual' : 'Pareja / Familia'}`,
    'Modalidad: Virtual',
    appointment.reference ? `Referencia: ${appointment.reference}` : '',
    appointment.notes ? `Notas: ${appointment.notes}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bienestarte Integral//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    `TZID:${TZID}`,
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    'TZOFFSETFROM:-0400',
    'TZOFFSETTO:-0400',
    'TZNAME:AST',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:${appointment.id}@bienestarteintegral.com`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART;TZID=${TZID}:${start}`,
    `DTEND;TZID=${TZID}:${end}`,
    fold(`SUMMARY:${escapeText(`Cita virtual — ${appointment.patientName}`)}`),
    fold(`DESCRIPTION:${escapeText(description)}`),
    'LOCATION:Sesión virtual',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadIcs(
  appointment: Appointment,
  durationMinutes = 50,
): void {
  const content = buildIcsContent(appointment, durationMinutes)
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cita-${appointment.date}-${appointment.time.replace(':', '')}.ics`
  a.click()
  URL.revokeObjectURL(url)
}
