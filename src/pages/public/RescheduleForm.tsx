import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import {
  getBookableDates,
  getOpenSlots,
  toDateKey,
} from '../../lib/dates'
import { getAvailability } from '../../services/availability'
import {
  getBookedSlotsForDate,
  rescheduleAppointment,
} from '../../services/appointments'
import type { Appointment, AvailabilityConfig } from '../../types'

/** Date and time picker for moving an existing appointment. */
export function RescheduleForm({
  appointment,
  onDone,
  onCancel,
}: {
  appointment: Appointment
  onDone: (updated: Appointment) => void
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
    getBookedSlotsForDate(date).then((slots) => {
      if (active) setBooked(slots)
    })
    return () => {
      active = false
    }
  }, [date])

  const dates = useMemo(
    () => (availability ? getBookableDates(availability) : []),
    [availability],
  )

  // The hour it holds right now is not an option, and its lock would make it
  // look taken anyway.
  const freeSlots = availability
    ? getOpenSlots(date, availability, booked).filter(
        (s) => !(date === appointment.date && s === appointment.time),
      )
    : []

  async function submit() {
    if (!date || !time) {
      toast.error('Elige la nueva fecha y hora')
      return
    }
    setSaving(true)
    try {
      const updated = await rescheduleAppointment(
        appointment.reference,
        date,
        time,
        { actor: 'patient' },
      )
      toast.success('Listo. Tu cita quedó movida.')
      onDone(updated)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo cambiar la cita')
    } finally {
      setSaving(false)
    }
  }

  if (!availability) return <p className="mt-4 text-sm text-muted">Cargando…</p>

  return (
    <div className="mt-5 border-t border-sage-100 pt-5">
      <p className="text-sm font-medium text-ink">Elige la nueva fecha</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {dates.map((d) => {
          const key = toDateKey(d)
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setDate(key)
                setTime('')
              }}
              className={`rounded-lg border px-3 py-3 text-left text-sm transition ${
                date === key
                  ? 'border-sage-500 bg-sage-50'
                  : 'border-sage-100 bg-white hover:border-sage-200'
              }`}
            >
              <span className="block text-xs capitalize text-muted">
                {format(d, 'EEEE', { locale: es })}
              </span>
              <span className="font-medium text-ink">
                {format(d, 'd MMM', { locale: es })}
              </span>
            </button>
          )
        })}
      </div>

      {date && (
        <>
          <p className="mt-5 text-sm font-medium text-ink">Elige la hora</p>
          {freeSlots.length === 0 ? (
            <p className="mt-2 text-sm text-muted">
              Ese día ya no tiene horas libres. Prueba con otro.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {freeSlots.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTime(s)}
                  className={`rounded-lg border px-4 py-2 text-sm transition ${
                    time === s
                      ? 'border-sage-500 bg-sage-50 font-medium'
                      : 'border-sage-100 bg-white hover:border-sage-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving || !date || !time}
          onClick={submit}
          className="rounded-full bg-sage-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sage-600 disabled:opacity-50"
        >
          {saving ? 'Cambiando…' : 'Confirmar cambio'}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={onCancel}
          className="rounded-full border border-sage-200 px-5 py-2.5 text-sm text-muted"
        >
          Dejarla como está
        </button>
      </div>
    </div>
  )
}
