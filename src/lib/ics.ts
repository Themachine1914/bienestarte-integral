import type { Appointment } from '../types'

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function toIcsDate(date: string, time: string, durationMinutes: number): {
  start: string
  end: string
} {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  const startDate = new Date(y, m - 1, d, hh, mm, 0)
  const endDate = new Date(startDate.getTime() + durationMinutes * 60_000)

  const fmt = (dt: Date) =>
    `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`

  return { start: fmt(startDate), end: fmt(endDate) }
}

export function buildIcsContent(
  appointment: Appointment,
  durationMinutes = 50,
): string {
  const { start, end } = toIcsDate(
    appointment.date,
    appointment.time,
    durationMinutes,
  )
  const uid = `${appointment.id}@bienestarteintegral.com`
  const summary = `Cita virtual — ${appointment.patientName}`
  const description = [
    `Paciente: ${appointment.patientName}`,
    `Teléfono: ${appointment.patientPhone}`,
    `Email: ${appointment.patientEmail}`,
    `Tipo: ${appointment.sessionType}`,
    `Modalidad: Virtual`,
    appointment.notes ? `Notas: ${appointment.notes}` : '',
  ]
    .filter(Boolean)
    .join('\\n')

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bienestarte Integral//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${start}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
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
