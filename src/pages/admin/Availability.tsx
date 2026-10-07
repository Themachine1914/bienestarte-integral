import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'
import {
  DEFAULT_AVAILABILITY,
  MAX_SLOTS_PER_DAY,
  PRACTICE_SLOTS,
  PRACTICE_WEEKDAYS,
} from '../../lib/defaults'
import { blockedSlotKey, formatDisplayDate } from '../../lib/dates'
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
  const [newBlockedHours, setNewBlockedHours] = useState<string[]>([])
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

  function resetBlockForm() {
    setNewBlockedDate('')
    setNewBlockedHours([])
  }

  function toggleNewBlockedHour(slot: string) {
    setNewBlockedHours((h) =>
      h.includes(slot) ? h.filter((s) => s !== slot) : [...h, slot],
    )
  }

  function addBlockedDate() {
    if (!newBlockedDate) return
    setConfig((c) => ({
      ...c,
      blockedDates: c.blockedDates.includes(newBlockedDate)
        ? c.blockedDates
        : [...c.blockedDates, newBlockedDate].sort(),
      // The whole day covers any hours blocked on it before.
      blockedSlots: c.blockedSlots.filter(
        (k) => !k.startsWith(`${newBlockedDate}_`),
      ),
    }))
    resetBlockForm()
  }

  function addBlockedHours() {
    if (!newBlockedDate || newBlockedHours.length === 0) return
    if (newBlockedHours.length === PRACTICE_SLOTS.length) {
      addBlockedDate()
      return
    }
    setConfig((c) => ({
      ...c,
      blockedSlots: [
        ...new Set([
          ...c.blockedSlots,
          ...newBlockedHours.map((slot) => blockedSlotKey(newBlockedDate, slot)),
        ]),
      ].sort(),
    }))
    resetBlockForm()
  }

  function removeBlockedDate(date: string) {
    setConfig((c) => ({
      ...c,
      blockedDates: c.blockedDates.filter((d) => d !== date),
    }))
  }

  function removeBlockedSlot(key: string) {
    setConfig((c) => ({
      ...c,
      blockedSlots: c.blockedSlots.filter((k) => k !== key),
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

  // One row per date: either the whole day, or the hours closed on it.
  const blockedRows = [
    ...config.blockedDates.map((date) => ({ date, hours: [] as string[] })),
    ...Object.entries(
      config.blockedSlots.reduce<Record<string, string[]>>((acc, key) => {
        const [date, slot] = key.split('_')
        ;(acc[date] ??= []).push(slot)
        return acc
      }, {}),
    ).map(([date, hours]) => ({ date, hours: hours.sort() })),
  ].sort((a, b) => a.date.localeCompare(b.date))

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
            Días y horas bloqueados (feriados, vacaciones, compromisos)
          </p>
          <p className="mt-1 text-xs text-muted">
            Elige una fecha y bloquea el día completo, o marca solo las horas
            que no vas a atender. Lo bloqueado no aparecerá aunque caiga en un
            día activo.
          </p>
          <div className="mt-3">
            <input
              type="date"
              value={newBlockedDate}
              onChange={(e) => {
                setNewBlockedDate(e.target.value)
                setNewBlockedHours([])
              }}
              className="rounded-lg border border-sage-200 px-3 py-2 text-sm outline-none focus:border-sage-400"
            />
          </div>
          {newBlockedDate && (
            <div className="mt-3 rounded-lg border border-sage-100 bg-white p-3">
              <p className="text-xs text-muted">
                Toca las horas que quieres bloquear ese día:
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {PRACTICE_SLOTS.map((slot) => {
                  const selected = newBlockedHours.includes(slot)
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => toggleNewBlockedHour(slot)}
                      aria-pressed={selected}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                        selected
                          ? 'bg-red-500 text-white'
                          : 'border border-sage-200 bg-white text-muted'
                      }`}
                    >
                      {formatSlotLabel(slot)}
                    </button>
                  )
                })}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={addBlockedHours}
                  disabled={newBlockedHours.length === 0}
                  className="rounded-lg border border-sage-200 px-3 py-2 text-sm font-medium text-sage-700 hover:bg-sage-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {newBlockedHours.length === 0
                    ? 'Bloquear horas'
                    : `Bloquear ${newBlockedHours.length} ${
                        newBlockedHours.length === 1 ? 'hora' : 'horas'
                      }`}
                </button>
                <button
                  type="button"
                  onClick={addBlockedDate}
                  className="rounded-lg border border-sage-200 px-3 py-2 text-sm font-medium text-sage-700 hover:bg-sage-50"
                >
                  Bloquear día completo
                </button>
              </div>
            </div>
          )}
          {blockedRows.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {blockedRows.map(({ date, hours }) => (
                <li
                  key={`${date}-${hours.length ? 'h' : 'd'}`}
                  className="rounded-lg border border-sage-100 bg-white px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="capitalize text-ink">
                      {formatDisplayDate(date)}
                    </span>
                    {hours.length === 0 ? (
                      <span className="flex items-center gap-2">
                        <span className="text-xs text-muted">Día completo</span>
                        <button
                          type="button"
                          onClick={() => removeBlockedDate(date)}
                          aria-label={`Quitar ${date}`}
                          className="text-muted hover:text-red-600"
                        >
                          <X size={16} />
                        </button>
                      </span>
                    ) : null}
                  </div>
                  {hours.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {hours.map((slot) => (
                        <span
                          key={slot}
                          className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700"
                        >
                          {formatSlotLabel(slot)}
                          <button
                            type="button"
                            onClick={() =>
                              removeBlockedSlot(blockedSlotKey(date, slot))
                            }
                            aria-label={`Quitar ${formatSlotLabel(slot)} del ${date}`}
                            className="hover:text-red-900"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          {(newBlockedDate || blockedRows.length > 0) && (
            <p className="mt-2 text-xs text-muted">
              Recuerda pulsar <strong>Guardar</strong> para aplicar los cambios.
            </p>
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
