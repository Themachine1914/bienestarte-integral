import type { Appointment } from '../types'
import { PRACTICE_WHATSAPP_DISPLAY } from './defaults'

/**
 * Rules about what a patient may do to their own appointment.
 *
 * The authority is firestore.rules — anyone can call Firestore directly with a
 * lookup code, so nothing here is a barrier. This module exists so the UI and
 * the service layer refuse the same things the server refuses, and refuse them
 * with a sentence a patient can act on.
 */

export const RESCHEDULE_WINDOW_HOURS = 24
export const MAX_RESCHEDULES = 2

/**
 * The UI is deliberately stricter than the rule by this much. Both sides
 * compute the deadline in practice time, so they agree — the margin only
 * absorbs the seconds between rendering a button and the write landing, so a
 * patient never sees an enabled button that the server then rejects.
 */
export const UI_GRACE_MINUTES = 15

/** Dominican Republic is UTC-4 all year — no daylight saving to track. */
const PRACTICE_UTC_OFFSET_HOURS = -4

/** Statuses a patient is allowed to move. */
const RESCHEDULABLE: Appointment['status'][] = ['pending', 'confirmed']

/**
 * The instant an appointment starts, as a real point in time.
 *
 * `date` and `time` are wall-clock strings in practice time, so they are
 * anchored to UTC-4 here rather than to whatever timezone the patient's
 * browser happens to be in. A patient booking from Madrid gets the same
 * deadline as one booking from Santo Domingo, and it matches firestore.rules.
 */
export function appointmentStartUtc(date: string, time: string): Date | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  const t = /^(\d{2}):(\d{2})$/.exec(time)
  if (!d || !t) return null

  return new Date(
    Date.UTC(
      Number(d[1]),
      Number(d[2]) - 1,
      Number(d[3]),
      Number(t[1]) - PRACTICE_UTC_OFFSET_HOURS,
      Number(t[2]),
    ),
  )
}

/** Hours left before the appointment starts. Negative once it has passed. */
export function hoursUntil(
  date: string,
  time: string,
  now: Date = new Date(),
): number | null {
  const start = appointmentStartUtc(date, time)
  if (!start) return null
  return (start.getTime() - now.getTime()) / 3_600_000
}

export type RescheduleBlock =
  | 'ok'
  | 'not_reschedulable'
  | 'too_late'
  | 'limit_reached'

export interface RescheduleVerdict {
  allowed: boolean
  reason: RescheduleBlock
  hoursLeft: number | null
  used: number
  remaining: number
}

/**
 * Whether the patient may move this appointment themselves.
 *
 * `withGrace` is for the UI: it applies UI_GRACE_MINUTES so the button closes
 * slightly before the server does. The service layer calls it without grace,
 * matching the rule exactly.
 */
export function canPatientReschedule(
  appointment: Pick<Appointment, 'date' | 'time' | 'status'> & {
    rescheduleCount?: number
  },
  now: Date = new Date(),
  withGrace = false,
): RescheduleVerdict {
  const used = appointment.rescheduleCount ?? 0
  const remaining = Math.max(0, MAX_RESCHEDULES - used)
  const hoursLeft = hoursUntil(appointment.date, appointment.time, now)

  const verdict = (allowed: boolean, reason: RescheduleBlock) => ({
    allowed,
    reason,
    hoursLeft,
    used,
    remaining,
  })

  if (!RESCHEDULABLE.includes(appointment.status)) {
    return verdict(false, 'not_reschedulable')
  }
  if (used >= MAX_RESCHEDULES) return verdict(false, 'limit_reached')

  const needed =
    RESCHEDULE_WINDOW_HOURS + (withGrace ? UI_GRACE_MINUTES / 60 : 0)
  if (hoursLeft === null || hoursLeft < needed) return verdict(false, 'too_late')

  return verdict(true, 'ok')
}

/** Patient-facing sentence for a refusal. Never blames the patient. */
export function rescheduleBlockMessage(reason: RescheduleBlock): string {
  switch (reason) {
    case 'too_late':
      return `Faltan menos de ${RESCHEDULE_WINDOW_HOURS} horas para tu cita, así que ya no se puede cambiar desde aquí. Escríbele directamente a Orlandia por WhatsApp al ${PRACTICE_WHATSAPP_DISPLAY} con tu código y ella lo resuelve contigo.`
    case 'limit_reached':
      return `Ya cambiaste esta cita ${MAX_RESCHEDULES} veces, que es el máximo desde el sitio. Si necesitas moverla otra vez, escríbele directamente a Orlandia por WhatsApp al ${PRACTICE_WHATSAPP_DISPLAY} con tu código.`
    case 'not_reschedulable':
      return `Esta cita ya no está activa, así que no se puede cambiar. Si crees que es un error, escríbele a Orlandia por WhatsApp al ${PRACTICE_WHATSAPP_DISPLAY} con tu código.`
    default:
      return ''
  }
}
