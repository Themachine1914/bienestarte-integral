import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  formatCurrencyDop,
  formatDisplayDate,
  getBookableDates,
  getOpenSlots,
  toDateKey,
} from '../../lib/dates'
import { useSettings } from '../../hooks/useSettings'
import {
  createManualAppointment,
  getBookedSlotsForDate,
} from '../../services/appointments'
import { getAvailability } from '../../services/availability'
import type { AvailabilityConfig, SessionType } from '../../types'

/**
 * Booking on behalf of a patient who called instead of using the site. The
 * appointment goes straight to confirmed — the payment was arranged off-site,
 * so there is no proof to review.
 */
export function NewAppointmentForm({ onCreated }: { onCreated: () => void }) {
  const { settings } = useSettings()
  const [availability, setAvailability] = useState<AvailabilityConfig | null>(
    null,
  )
  const [booked, setBooked] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const [sessionType, setSessionType] = useState<SessionType>('individual')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    getAvailability().then(setAvailability)
  }, [])

  useEffect(() => {
    if (!date) {
      setBooked([])
      return
    }
    getBookedSlotsForDate(date).then(setBooked)
  }, [date])

  const dates = useMemo(
    () => (availability ? getBookableDates(availability) : []),
    [availability],
  )
  const slots = availability ? getOpenSlots(date, availability, booked) : []
  const session = settings.sessionTypes.find((s) => s.id === sessionType)

  function reset() {
    setDate('')
    setTime('')
    setName('')
    setPhone('')
    setEmail('')
    setNotes('')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !phone.trim() || !email.trim()) {
      toast.error('Completa nombre, teléfono y email')
      return
    }
    if (!date || !time) {
      toast.error('Selecciona fecha y hora')
      return
    }
    if (!session) return

    setSaving(true)
    try {
      await createManualAppointment({
        name,
        phone,
        email,
        sessionType,
        price: session.priceDop,
        date,
        time,
        notes,
      })
      toast.success('Cita creada y confirmada')
      reset()
      onCreated()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo crear')
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'mt-1.5 w-full rounded-lg border border-sage-200 bg-white px-3 py-2 text-sm outline-none focus:border-sage-400'

  return (
    <form
      onSubmit={submit}
      className="mt-4 border border-sage-100 bg-white p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-ink">
          Nombre completo *
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          Teléfono *
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          Email *
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          Tipo de sesión
          <select
            value={sessionType}
            onChange={(e) => setSessionType(e.target.value as SessionType)}
            className={inputClass}
          >
            {settings.sessionTypes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label} · {formatCurrencyDop(s.priceDop)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-ink">
          Fecha
          <select
            value={date}
            onChange={(e) => {
              setDate(e.target.value)
              setTime('')
            }}
            className={inputClass}
          >
            <option value="">Selecciona…</option>
            {dates.map((d) => {
              const key = toDateKey(d)
              return (
                <option key={key} value={key}>
                  {formatDisplayDate(key)}
                </option>
              )
            })}
          </select>
        </label>
        <label className="block text-sm font-medium text-ink">
          Hora
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            disabled={!date}
            className={inputClass}
          >
            <option value="">
              {date ? 'Selecciona…' : 'Elige una fecha primero'}
            </option>
            {slots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-4 block text-sm font-medium text-ink">
        Notas (opcional)
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className={inputClass}
        />
      </label>

      {date && slots.length === 0 && (
        <p className="mt-3 text-xs text-amber-700">
          Ese día no tiene cupos libres.
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="mt-5 rounded-full bg-sage-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sage-600 disabled:opacity-60"
      >
        {saving ? 'Creando…' : 'Crear cita confirmada'}
      </button>
    </form>
  )
}
