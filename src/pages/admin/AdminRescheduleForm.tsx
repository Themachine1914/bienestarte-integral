import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { MessageCircle } from 'lucide-react'
import {
  formatDisplayDate,
  getBookableDates,
  getOpenSlots,
  toDateKey,
} from '../../lib/dates'
import {
  lookupUrlFor,
  rescheduleNoticeMessage,
  whatsappHref,
} from '../../lib/reminders'
import { getAvailability } from '../../services/availability'
import {
  getBookedSlotsForDate,
  rescheduleAppointment,
} from '../../services/appointments'
import {
  appointmentTimes,
  expandBlock,
  formatBlockLabel,
  hoursLabel,
  normalizeHours,
  startsForDuration,
} from '../../lib/time'
import type { Appointment, AvailabilityConfig } from '../../types'

/**
 * Admin version of the reschedule picker. Same service call, `actor: 'admin'`,
 * so the 24-hour window never applies — she can move a session that starts in
 * an hour. «Fuera del horario habitual» drops the published grid too, leaving
 * only the slot lock.
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
  const [offGrid, setOffGrid] = useState(false)
  const [note, setNote] = useState('')
  const [moved, setMoved] = useState<{ date: string; time: string } | null>(
    null,
  )
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
  const hours = normalizeHours(appointment.hours)
  const ownTimes = date === appointment.date ? appointmentTimes(appointment) : []
  const freeSlots = availability
    ? startsForDuration(
        hours,
        getOpenSlots(
          date,
          availability,
          booked.filter((t) => !ownTimes.includes(t)),
        ),
        availability.slots,
      ).filter((s) => !(date === appointment.date && s === appointment.time))
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
        override: offGrid,
      })
      toast.success('Cita reprogramada. El cupo anterior quedó libre.')
      setMoved({ date, time })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo reprogramar')
    } finally {
      setSaving(false)
    }
  }

  if (moved) {
    const text = rescheduleNoticeMessage(
      appointment,
      moved.date,
      moved.time,
      note,
      lookupUrlFor(appointment.reference, window.location.origin),
    )
    return (
      <div className="mt-4 border-t border-sage-100 pt-4">
        <p className="text-sm text-ink">
          Movida al{' '}
          <span className="font-medium">{formatDisplayDate(moved.date)}</span> a
          las{' '}
          <span className="font-medium">
            {formatBlockLabel(expandBlock(moved.time, hours))}
          </span>
          . El cupo anterior quedó libre.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {appointment.patientPhone && (
            <a
              href={whatsappHref(appointment.patientPhone, text)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-sage-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sage-600"
            >
              <MessageCircle size={14} /> Avisar por WhatsApp
            </a>
          )}
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg border border-sage-200 px-3 py-1.5 text-xs text-muted"
          >
            Listo
          </button>
        </div>
      </div>
    )
  }

  if (!availability) return <p className="mt-3 text-sm text-muted">Cargando…</p>

  return (
    <div className="mt-4 border-t border-sage-100 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-sage-700">
          Mover a otra fecha
          {hours > 1 ? ` · ${hoursLabel(hours)}` : ''}
        </p>
        <label className="flex items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={offGrid}
            onChange={(e) => {
              setOffGrid(e.target.checked)
              setDate('')
              setTime('')
            }}
            className="accent-sage-500"
          />
          Fuera del horario habitual
        </label>
      </div>

      {offGrid ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-sage-200 px-3 py-2 text-xs outline-none focus:border-sage-400"
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="rounded-lg border border-sage-200 px-3 py-2 text-xs outline-none focus:border-sage-400"
          />
          {date && booked.length > 0 && (
            <p className="text-xs text-amber-700 sm:col-span-2">
              Ese día ya tienes: {booked.join(', ')}
            </p>
          )}
        </div>
      ) : (
        <>
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
                    {formatBlockLabel(expandBlock(s, hours))}
                  </button>
                ))
              )}
            </div>
          )}
        </>
      )}

      <label className="mt-4 block text-xs font-medium text-ink">
        Nota para el paciente (opcional)
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Ej.: Tuve una emergencia y no podré atenderte ese día. Disculpa el cambio."
          className="mt-1.5 w-full rounded-lg border border-sage-200 px-3 py-2 text-xs outline-none focus:border-sage-400"
        />
        <span className="mt-1 block font-normal text-muted">
          Se incluye en el mensaje de WhatsApp que le envías después de mover la
          cita.
        </span>
      </label>

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
