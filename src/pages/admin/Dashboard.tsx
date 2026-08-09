import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDisplayDate } from '../../lib/dates'
import { listAppointments } from '../../services/appointments'
import { StatusBadge } from '../../components/StatusBadge'
import type { Appointment } from '../../types'

export function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listAppointments()
      .then(setAppointments)
      .finally(() => setLoading(false))
  }, [])

  const pending = useMemo(
    () => appointments.filter((a) => a.status === 'pending'),
    [appointments],
  )
  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return appointments
      .filter((a) => a.status === 'confirmed' && a.date >= today)
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
      .slice(0, 5)
  }, [appointments])

  const counts = useMemo(
    () => ({
      pending: appointments.filter((a) => a.status === 'pending').length,
      confirmed: appointments.filter((a) => a.status === 'confirmed').length,
      completed: appointments.filter((a) => a.status === 'completed').length,
    }),
    [appointments],
  )

  if (loading) return <p className="text-muted">Cargando…</p>

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">Resumen de tu agenda</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Pendientes', value: counts.pending },
          { label: 'Confirmadas', value: counts.confirmed },
          { label: 'Completadas', value: counts.completed },
        ].map((c) => (
          <div key={c.label} className="border border-sage-100 bg-white p-5">
            <p className="text-sm text-muted">{c.label}</p>
            <p className="mt-1 font-display text-4xl text-sage-700">{c.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl text-ink">
            Pendientes de confirmar
          </h2>
          <Link to="/admin/citas" className="text-sm text-sage-600">
            Ver todas
          </Link>
        </div>
        {pending.length === 0 ? (
          <p className="text-sm text-muted">No hay citas pendientes.</p>
        ) : (
          <div className="space-y-3">
            {pending.slice(0, 5).map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center gap-4 border border-sage-100 bg-white p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{a.patientName}</p>
                  <p className="text-sm text-muted">
                    {formatDisplayDate(a.date)} · {a.time}
                  </p>
                </div>
                {a.paymentProofUrl && (
                  <a
                    href={a.paymentProofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-sage-600 underline"
                  >
                    Ver comprobante
                  </a>
                )}
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-display text-2xl text-ink">
          Próximas confirmadas
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted">Sin próximas citas confirmadas.</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 border border-sage-100 bg-white p-4"
              >
                <div>
                  <p className="font-medium text-ink">{a.patientName}</p>
                  <p className="text-sm text-muted">
                    {formatDisplayDate(a.date)} · {a.time}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
