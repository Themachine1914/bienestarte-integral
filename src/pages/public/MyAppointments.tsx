import { useState } from 'react'
import toast from 'react-hot-toast'
import { Search } from 'lucide-react'
import { formatCurrencyDop, formatDisplayDate } from '../../lib/dates'
import { getAppointmentsByContact } from '../../services/appointments'
import { StatusBadge } from '../../components/StatusBadge'
import type { Appointment } from '../../types'

export function MyAppointmentsPage() {
  const [contact, setContact] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Appointment[] | null>(null)

  async function search(e: React.FormEvent) {
    e.preventDefault()
    if (!contact.trim()) {
      toast.error('Ingresa tu email o teléfono')
      return
    }
    setLoading(true)
    try {
      const list = await getAppointmentsByContact(contact)
      setResults(list)
      if (list.length === 0) {
        toast('No encontramos citas con ese dato')
      }
    } catch {
      toast.error('Error al buscar citas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl text-ink">Mis citas</h1>
      <p className="mt-2 text-muted">
        Consulta el estado de tus citas con el email o teléfono que usaste al
        agendar.
      </p>

      <form onSubmit={search} className="mt-8 flex gap-2">
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="Email o teléfono"
          className="flex-1 rounded-lg border border-sage-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sage-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-sage-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sage-600 disabled:opacity-60"
        >
          <Search size={16} />
          {loading ? '…' : 'Buscar'}
        </button>
      </form>

      {results && (
        <div className="mt-8 space-y-4">
          {results.length === 0 ? (
            <p className="text-sm text-muted">Sin resultados.</p>
          ) : (
            results.map((a) => (
              <article
                key={a.id}
                className="border border-sage-100 bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink">
                      {formatDisplayDate(a.date)} · {a.time}
                    </p>
                    <p className="text-sm text-muted capitalize">
                      {a.sessionType === 'individual'
                        ? 'Individual'
                        : 'Pareja / Familia'}{' '}
                      · {formatCurrencyDop(a.price)} · Virtual
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  )
}
