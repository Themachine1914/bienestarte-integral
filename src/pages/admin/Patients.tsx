import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { formatDisplayDate } from '../../lib/dates'
import { getAppointmentsForPatient } from '../../services/appointments'
import { listPatients, updatePatientNotes } from '../../services/patients'
import { StatusBadge } from '../../components/StatusBadge'
import type { Appointment, Patient } from '../../types'

export function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [selected, setSelected] = useState<Patient | null>(null)
  const [history, setHistory] = useState<Appointment[]>([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listPatients()
      .then(setPatients)
      .finally(() => setLoading(false))
  }, [])

  async function openPatient(p: Patient) {
    setSelected(p)
    setNotes(p.privateNotes)
    const appts = await getAppointmentsForPatient(p.id)
    setHistory(appts)
  }

  async function saveNotes() {
    if (!selected) return
    try {
      await updatePatientNotes(selected.id, notes)
      toast.success('Notas guardadas')
      const updated = await listPatients()
      setPatients(updated)
      setSelected(updated.find((p) => p.id === selected.id) ?? null)
    } catch {
      toast.error('No se pudieron guardar las notas')
    }
  }

  if (loading) return <p className="text-muted">Cargando…</p>

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Pacientes</h1>
      <p className="mt-1 text-sm text-muted">
        Inventario e historial de citas
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          {patients.length === 0 ? (
            <p className="text-sm text-muted">
              Aún no hay pacientes. Se crean al agendar una cita.
            </p>
          ) : (
            patients.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => openPatient(p)}
                className={`w-full border px-4 py-3 text-left transition ${
                  selected?.id === p.id
                    ? 'border-sage-500 bg-sage-50'
                    : 'border-sage-100 bg-white hover:border-sage-200'
                }`}
              >
                <p className="font-medium text-ink">{p.name}</p>
                <p className="text-xs text-muted">
                  {p.email} · {p.phone}
                </p>
              </button>
            ))
          )}
        </div>

        {selected && (
          <div className="border border-sage-100 bg-white p-5">
            <h2 className="font-display text-2xl text-ink">{selected.name}</h2>
            <p className="text-sm text-muted">
              {selected.email}
              <br />
              {selected.phone}
            </p>

            <label className="mt-6 block text-sm font-medium text-ink">
              Notas privadas
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="mt-1.5 w-full rounded-lg border border-sage-200 px-3 py-2 text-sm outline-none focus:border-sage-400"
              />
            </label>
            <button
              type="button"
              onClick={saveNotes}
              className="mt-2 rounded-full bg-sage-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Guardar notas
            </button>

            <h3 className="mt-8 font-medium text-ink">Historial de citas</h3>
            <div className="mt-3 space-y-2">
              {history.length === 0 ? (
                <p className="text-sm text-muted">Sin citas.</p>
              ) : (
                history.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-2 border border-sage-50 px-3 py-2 text-sm"
                  >
                    <span>
                      {formatDisplayDate(a.date)} · {a.time}
                    </span>
                    <StatusBadge status={a.status} />
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
