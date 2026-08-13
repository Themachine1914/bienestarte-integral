import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { DEFAULT_AVAILABILITY, PRACTICE_WEEKDAYS } from '../../lib/defaults'
import {
  getAvailability,
  saveAvailability,
} from '../../services/availability'
import type { AvailabilityConfig } from '../../types'

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
  const [slotsText, setSlotsText] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAvailability()
      .then((c) => {
        setConfig(c)
        setSlotsText(c.slots.join(', '))
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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const slots = slotsText
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => /^\d{2}:\d{2}$/.test(s))

    if (slots.length === 0) {
      toast.error('Agrega al menos un horario (HH:mm)')
      return
    }
    if (slots.length > 6) {
      toast.error('Máximo 6 pacientes por día')
      return
    }

    const next = {
      ...config,
      slots,
      activeDays: config.activeDays.filter((d) =>
        PRACTICE_WEEKDAYS.includes(d),
      ),
    }
    try {
      await saveAvailability(next)
      setConfig(next)
      toast.success('Disponibilidad guardada')
    } catch {
      toast.error('No se pudo guardar')
    }
  }

  if (loading) return <p className="text-muted">Cargando…</p>

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Disponibilidad</h1>
      <p className="mt-1 text-sm text-muted">
        Consulta lunes, martes y miércoles · máx. 6 cupos/día
      </p>

      <form onSubmit={handleSave} className="mt-8 max-w-xl space-y-6">
        <div>
          <p className="text-sm font-medium text-ink">Días activos</p>
          <p className="mt-1 text-xs text-muted">
            Jueves a domingo no se atienden.
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
        </div>

        <label className="block text-sm font-medium text-ink">
          Horarios (separados por coma, formato HH:mm)
          <input
            value={slotsText}
            onChange={(e) => setSlotsText(e.target.value)}
            placeholder="09:00, 10:00, 11:00, 12:00, 14:00, 15:00"
            className="mt-1.5 w-full rounded-lg border border-sage-200 px-3 py-2 text-sm outline-none focus:border-sage-400"
          />
        </label>

        <label className="block text-sm font-medium text-ink">
          Duración de sesión (minutos)
          <input
            type="number"
            min={30}
            max={120}
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
