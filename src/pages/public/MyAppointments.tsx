import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Search } from 'lucide-react'
import { formatCurrencyDop, formatDisplayDate } from '../../lib/dates'
import { getAppointmentByReference } from '../../services/appointments'
import { StatusBadge } from '../../components/StatusBadge'
import type { Appointment } from '../../types'

export function MyAppointmentsPage() {
  const location = useLocation()
  const passedReference =
    (location.state as { reference?: string } | null)?.reference ?? ''

  const [reference, setReference] = useState(passedReference)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [result, setResult] = useState<Appointment | null>(null)

  async function lookup(code: string) {
    setLoading(true)
    try {
      const found = await getAppointmentByReference(code)
      setResult(found)
      setSearched(true)
      if (!found) toast('No encontramos ninguna cita con ese código')
    } catch {
      toast.error('Error al buscar la cita')
    } finally {
      setLoading(false)
    }
  }

  // Coming straight from the booking flow, the code is already known.
  useEffect(() => {
    if (passedReference) lookup(passedReference)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passedReference])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reference.trim()) {
      toast.error('Ingresa tu código de seguimiento')
      return
    }
    await lookup(reference)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl text-ink">Mis citas</h1>
      <p className="mt-2 text-muted">
        Consulta el estado de tu cita con el código de seguimiento que recibiste
        al agendar (empieza con <strong>BI-</strong>).
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex gap-2">
        <input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="BI-XXXX-XXXX"
          autoComplete="off"
          className="flex-1 rounded-lg border border-sage-200 bg-white px-3 py-2.5 text-sm uppercase tracking-wide outline-none focus:border-sage-400"
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

      {searched && !result && (
        <p className="mt-8 text-sm text-muted">
          Sin resultados. Revisa el código, o escríbele a Orlandia por Instagram
          si lo perdiste — ella puede consultarlo por ti.
        </p>
      )}

      {result && (
        <article className="mt-8 border border-sage-100 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium text-ink">
                {formatDisplayDate(result.date)} · {result.time}
              </p>
              <p className="text-sm text-muted">
                {result.sessionType === 'individual'
                  ? 'Individual'
                  : 'Pareja / Familia'}{' '}
                · {formatCurrencyDop(result.price)} · Virtual
              </p>
              <p className="mt-2 text-xs text-muted">
                Código: {result.reference}
              </p>
            </div>
            <StatusBadge status={result.status} />
          </div>
        </article>
      )}
    </div>
  )
}
