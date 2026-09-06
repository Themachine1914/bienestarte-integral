import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'
import {
  DEFAULT_AVAILABILITY,
  MAX_SLOTS_PER_DAY,
  PRACTICE_SLOTS,
  PRACTICE_WEEKDAYS,
} from '../../lib/defaults'
import { formatDisplayDate } from '../../lib/dates'
import { formatSlotLabel } from '../../lib/time'
import {
  getAvailability,
  saveAvailability,
} from '../../services/availability'
import type { AvailabilityConfig } from '../../types'
import { AvailabilityHelp } from './AvailabilityHelp'

const DAY_LABELS: Record<number, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo',
}

export function AvailabilityPage() {
  const [config, setConfig] = useState<AvailabilityConfig>(DEFAULT_AVAILABILITY)
  const [newBlockedDate, setNewBlockedDate] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAvailability()
      .then((c) => {
        setConfig(c)
      })
      .finally(() => setLoading(false))
  }, [])

  function toggleDay(day: number) {
    if (!PRACTICE_WEEKDAYS.includes(day)) return
    setConfig((c) => ({
      ...c,
      activeDays: c.activeDays.includes(day)
        ? c.activeDays.filter((d) => d !== day)
        : [...c.activeDays, day].sort((a, b) => a - b),
    }))
  }

  function addBlockedDate() {
    if (!newBlockedDate) return
    setConfig((c) =>
      c.blockedDates.includes(newBlockedDate)
        ? c
        : { ...c, blockedDates: [...c.blockedDates, newBlockedDate].sort() },
    )
    setNewBlockedDate('')
  }

  function removeBlockedDate(date: string) {
    setConfig((c) => ({
      ...c,
      blockedDates: c.blockedDates.filter((d) => d !== date),
    }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()

    const next: AvailabilityConfig = { ...config, slots: [...PRACTICE_SLOTS] }
    try {
      await saveAvailability(next)
      setConfig(next)
      toast.success('Disponibilidad guardada')
    } catch {
      toast.error('No se pudo guardar')
    }
  }

  if (loading) return <p className="text-muted">Cargando…</p>

  const agendaClosed = config.activeDays.length === 0

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Disponibilidad</h1>
      <p className="mt-1 text-sm text-muted">
        Consulta lunes, martes y miércoles · máx. {MAX_SLOTS_PER_DAY} cupos/día
      </p>

      <div className="mt-6 max-w-xl">
        <AvailabilityHelp />
      </div>

      <form onSubmit={handleSave} className="mt-8 max-w-xl space-y-6">
        <div>
          <p className="text-sm font-medium text-ink">Días activos</p>
          <p className="mt-1 text-xs text-muted">
            Jueves a domingo no se atienden. Puedes desmarcar todos para cerrar
            la agenda por completo.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
              const allowed = PRACTICE_WEEKDAYS.includes(day)
              const active = allowed && config.activeDays.includes(day)
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  disabled={!allowed}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    active
                      ? 'bg-sage-500 text-white'
                      : allowed
                        ? 'border border-sage-200 bg-white text-muted'
                        : 'cursor-not-allowed border border-sage-100 bg-sage-50 text-sage-300'
                  }`}
                >
                  {DAY_LABELS[day]}
                </button>
              )
            })}
          </div>
          {agendaClosed && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              La agenda está cerrada: nadie podrá reservar hasta que actives al
              menos un día.
            </p>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-ink">Horarios de consulta</p>
          <p className="mt-1 text-xs text-muted">
            9:00 AM, 10:00 AM, 11:00 AM, 2:00 PM, 3:00 PM y 4:00 PM.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {PRACTICE_SLOTS.map((slot) => (
              <span
                key={slot}
                className="rounded-full bg-sage-500 px-3 py-1.5 text-xs font-medium text-white"
              >
                {formatSlotLabel(slot)}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-ink">
            Días bloqueados (feriados, vacaciones)
          </p>
          <p className="mt-1 text-xs text-muted">
            Estas fechas no aparecerán aunque caigan en un día activo.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              type="date"
              value={newBlockedDate}
              onChange={(e) => setNewBlockedDate(e.target.value)}
              className="rounded-lg border border-sage-200 px-3 py-2 text-sm outline-none focus:border-sage-400"
            />
            <button
              type="button"
              onClick={addBlockedDate}
              className="rounded-lg border border-sage-200 px-3 py-2 text-sm font-medium text-sage-700 hover:bg-sage-50"
            >
              Bloquear
            </button>
          </div>
          {config.blockedDates.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {config.blockedDates.map((d) => (
                <li
                  key={d}
                  className="flex items-center justify-between rounded-lg border border-sage-100 bg-white px-3 py-2 text-sm"
                >
                  <span className="capitalize text-ink">
                    {formatDisplayDate(d)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeBlockedDate(d)}
                    aria-label={`Quitar ${d}`}
                    className="text-muted hover:text-red-600"
                  >
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <label className="block text-sm font-medium text-ink">
          Duración de sesión (minutos)
          <input
            type="number"
            min={15}
            max={240}
            value={config.sessionDurationMinutes}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                sessionDurationMinutes: Number(e.target.value),
              }))
            }
            className="mt-1.5 w-32 rounded-lg border border-sage-200 px-3 py-2 text-sm outline-none focus:border-sage-400"
          />
        </label>

        <button
          type="submit"
          className="rounded-full bg-sage-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sage-600"
        >
          Guardar
        </button>
      </form>
    </div>
  )
}
