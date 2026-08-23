import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { getBookableDates, getOpenSlots, toDateKey } from '../../lib/dates'
import { getAvailability } from '../../services/availability'
import {
  getBookedSlotsForDate,
  rescheduleAppointment,
} from '../../services/appointments'
import type { Appointment, AvailabilityConfig } from '../../types'

/**
 * Admin version of the reschedule picker. Same service call, `actor: 'admin'`,
 * so the 24-hour window never applies — she can move a session that starts in
 * an hour. Still bound by assertBookable(), so the target has to be a slot she
 * actually offers.
 */
export function AdminRescheduleForm({
  appointment,
  onDone,
  onCancel,
}: {
  appointment: Appointment
  onDone: () => void
  onCancel: () => void
}) {
  const [availability, setAvailability] = useState<AvailabilityConfig | null>(
    null,
  )
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [booked, setBooked] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getAvailability().then(setAvailability)
  }, [])

  useEffect(() => {
    if (!date) return
    let active = true
    getBookedSlotsForDate(date).then((s) => {
      if (active) setBooked(s)
    })
    return () => {
      active = false
    }
  }, [date])

  const dates = useMemo(
    () => (availability ? getBookableDates(availability) : []),
    [availability],
  )
  const freeSlots = availability
    ? getOpenSlots(date, availability, booked).filter(
        (s) => !(date === appointment.date && s === appointment.time),
      )
    : []

  async function submit() {
    if (!date || !time) {
      toast.error('Elige fecha y hora')
      return
    }
    setSaving(true)
    try {
      await rescheduleAppointment(appointment.reference, date, time, {
        actor: 'admin',
      })
      toast.success('Cita reprogramada. El cupo anterior quedó libre.')
      onDone()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo reprogramar')
    } finally {
      setSaving(false)
    }
  }

  if (!availability) return <p className="mt-3 text-sm text-muted">Cargando…</p>

  return (
    <div className="mt-4 border-t border-sage-100 pt-4">
      <p className="text-xs font-medium uppercase tracking-wider text-sage-700">
        Mover a otra fecha
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {dates.slice(0, 12).map((d) => {
          const key = toDateKey(d)
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setDate(key)
                setTime('')
              }}
              className={`rounded-lg border px-2 py-2 text-left text-xs transition ${
                date === key
                  ? 'border-sage-500 bg-sage-50'
                  : 'border-sage-100 bg-white hover:border-sage-200'
              }`}
            >
              <span className="block capitalize text-muted">
                {format(d, 'EEE', { locale: es })}
              </span>
              <span className="font-medium text-ink">
                {format(d, 'd MMM', { locale: es })}
              </span>
            </button>
          )
        })}
      </div>

      {date && (
        <div className="mt-3 flex flex-wrap gap-2">
          {freeSlots.length === 0 ? (
            <p className="text-sm text-muted">Sin horas libres ese día.</p>
          ) : (
            freeSlots.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setTime(s)}
                className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                  time === s
                    ? 'border-sage-500 bg-sage-50 font-medium'
                    : 'border-sage-100 bg-white hover:border-sage-200'
                }`}
              >
                {s}
              </button>
            ))
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving || !date || !time}
          onClick={submit}
          className="rounded-lg bg-sage-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {saving ? 'Moviendo…' : 'Confirmar nuevo horario'}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={onCancel}
          className="rounded-lg border border-sage-200 px-3 py-1.5 text-xs text-muted"
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}
