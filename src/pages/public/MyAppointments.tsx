import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Search } from 'lucide-react'
import { formatCurrencyDop, formatDisplayDate } from '../../lib/dates'
import { formatAppointmentClock, hoursLabel, normalizeHours } from '../../lib/time'
import {
  canPatientReschedule,
  MAX_RESCHEDULES,
  rescheduleBlockMessage,
} from '../../lib/policy'
import {
  confirmAttendance,
  getAppointmentByReference,
} from '../../services/appointments'
import { EnablePush } from '../../components/EnablePush'
import { ReceiptRequest } from '../../components/ReceiptRequest'
import { StatusBadge } from '../../components/StatusBadge'
import { WhatsAppLink } from '../../components/WhatsAppLink'
import { getSettings } from '../../services/settings'
import { RescheduleForm } from './RescheduleForm'
import type { Appointment, AppSettings } from '../../types'

export function MyAppointmentsPage() {
  const location = useLocation()
  const passedReference =
    (location.state as { reference?: string } | null)?.reference ?? ''

  const [reference, setReference] = useState(passedReference)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [result, setResult] = useState<Appointment | null>(null)
  const [editing, setEditing] = useState(false)
  const [settings, setSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    getSettings().then(setSettings)
  }, [])

  async function lookup(code: string, confirm = false) {
    setLoading(true)
    try {
      const found = await getAppointmentByReference(code)
      setEditing(false)
      setSearched(true)
      if (!found) {
        setResult(null)
        toast('No encontramos ninguna cita con ese código')
        return
      }
      setResult(found)
      if (confirm) {
        const confirmed = await confirmAttendance(code)
        setResult(confirmed)
        toast.success('Asistencia confirmada. Te esperamos.')
      }
    } catch {
      toast.error(confirm ? 'No se pudo confirmar la asistencia' : 'Error al buscar la cita')
    } finally {
      setLoading(false)
    }
  }

  // Coming straight from the booking flow or from a WhatsApp reminder link.
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const fromQuery = params.get('codigo') ?? ''
    const code = passedReference || fromQuery
    if (!code) return
    setReference(code)
    lookup(code, params.get('confirmar') === '1')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passedReference, location.search])

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
          Sin resultados. Revisa el código, o escríbele a Orlandia por WhatsApp
          al <WhatsAppLink /> si lo perdiste — ella puede consultarlo por ti.
        </p>
      )}

      {result && (
        <article className="mt-8 border border-sage-100 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium text-ink">
                {formatDisplayDate(result.date)} · {formatAppointmentClock(result)}
              </p>
              <p className="text-sm text-muted">
                {result.sessionType === 'individual'
                  ? 'Individual'
                  : 'Pareja / Familia'}{' '}
                · {hoursLabel(normalizeHours(result.hours))} ·{' '}
                {formatCurrencyDop(result.price)} · Virtual
              </p>
              <p className="mt-2 text-xs text-muted">
                Código: {result.reference}
              </p>
              {result.attendanceConfirmedAt && (
                <p className="mt-2 text-sm font-medium text-sage-700">
                  Asistencia confirmada. Te esperamos.
                </p>
              )}
            </div>
            <StatusBadge status={result.status} />
          </div>

          <PatientActions
            appointment={result}
            editing={editing}
            onStartEdit={() => setEditing(true)}
            onStopEdit={() => setEditing(false)}
            onRescheduled={(updated) => {
              setResult(updated)
              setEditing(false)
            }}
          />
          {settings && (
            <ReceiptRequest
              appointment={result}
              settings={settings}
              onUpdated={setResult}
            />
          )}
          <EnablePush audience="patient" appointmentId={result.id} compact />
        </article>
      )}
    </div>
  )
}

/**
 * What the patient may do with the appointment they just looked up.
 *
 * Rescheduling is the only action; cancelling is deliberately not offered to
 * anyone, at any notice. Every refusal ends the same way — talk to Orlandia —
 * and never leaves a dead button on screen.
 */
function PatientActions({
  appointment,
  editing,
  onStartEdit,
  onStopEdit,
  onRescheduled,
}: {
  appointment: Appointment
  editing: boolean
  onStartEdit: () => void
  onStopEdit: () => void
  onRescheduled: (updated: Appointment) => void
}) {
  // `true` applies the UI grace margin, so the button disappears slightly
  // before the server would start refusing the write.
  const verdict = canPatientReschedule(appointment, new Date(), true)

  if (editing) {
    return (
      <RescheduleForm
        appointment={appointment}
        onDone={onRescheduled}
        onCancel={onStopEdit}
      />
    )
  }

  async function confirmHere() {
    try {
      const updated = await confirmAttendance(appointment.reference)
      onRescheduled(updated)
      toast.success('Asistencia confirmada. Te esperamos.')
    } catch {
      toast.error('No se pudo confirmar la asistencia')
    }
  }

  return (
    <div className="mt-5 border-t border-sage-100 pt-4">
      {!appointment.attendanceConfirmedAt &&
        (appointment.status === 'pending' ||
          appointment.status === 'confirmed') && (
          <button
            type="button"
            onClick={confirmHere}
            className="mb-3 rounded-full bg-sage-500 px-4 py-2 text-sm font-medium text-white hover:bg-sage-600"
          >
            Confirmar asistencia
          </button>
        )}
      {verdict.allowed ? (
        <>
          <button
            type="button"
            onClick={onStartEdit}
            className="rounded-full border border-sage-300 px-4 py-2 text-sm font-medium text-sage-700 hover:bg-sage-50"
          >
            Cambiar fecha u hora
          </button>
          <p className="mt-2 text-xs text-muted">
            Puedes cambiarla hasta 24 horas antes.{' '}
            {verdict.remaining === MAX_RESCHEDULES
              ? `Tienes ${MAX_RESCHEDULES} cambios disponibles.`
              : `Te queda${verdict.remaining === 1 ? '' : 'n'} ${verdict.remaining} cambio${verdict.remaining === 1 ? '' : 's'}.`}
          </p>
        </>
      ) : (
        <p className="text-sm text-muted">
          {rescheduleBlockMessage(verdict.reason)}
        </p>
      )}

      <p className="mt-3 text-xs text-muted">
        ¿Necesitas cancelar? No se puede hacer desde el sitio. Escríbele a
        Orlandia por WhatsApp al <WhatsAppLink /> con tu código y ella la
        cancela por ti.
      </p>
    </div>
  )
}
