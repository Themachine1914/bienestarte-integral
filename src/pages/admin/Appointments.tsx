import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  CalendarClock,
  CalendarPlus,
  Check,
  MessageCircle,
  Plus,
  Undo2,
  X,
} from 'lucide-react'
import { formatCurrencyDop, formatDisplayDate } from '../../lib/dates'
import { formatAppointmentClock, hoursLabel, normalizeHours } from '../../lib/time'
import { downloadIcs } from '../../lib/ics'
import { auth } from '../../lib/firebase'
import { notifyPush } from '../../lib/push'
import {
  confirmUrlFor,
  reminderMessage,
  whatsappHref,
} from '../../lib/reminders'
import {
  listAppointments,
  markReminderSent,
  reconcileData,
  updateAppointmentStatus,
} from '../../services/appointments'
import { createNotification } from '../../services/notifications'
import { StatusBadge } from '../../components/StatusBadge'
import { NewAppointmentForm } from './NewAppointmentForm'
import { AppointmentsHelp } from './AppointmentsHelp'
import { AdminRescheduleForm } from './AdminRescheduleForm'
import type { Appointment, AppointmentStatus } from '../../types'

const FILTERS: Array<{ id: 'all' | AppointmentStatus; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'pending', label: 'Pendientes' },
  { id: 'confirmed', label: 'Confirmadas' },
  { id: 'completed', label: 'Completadas' },
  { id: 'rejected', label: 'Rechazadas' },
  { id: 'cancelled', label: 'Canceladas' },
]

const TOASTS: Record<AppointmentStatus, string> = {
  pending: 'Cita devuelta a pendiente',
  confirmed: 'Cita confirmada. Se descargó el archivo .ics',
  rejected: 'Cita rechazada. El cupo quedó libre',
  completed: 'Marcada como completada',
  cancelled: 'Cita cancelada. El cupo quedó libre',
}

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filter, setFilter] = useState<'all' | AppointmentStatus>('all')
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [movingId, setMovingId] = useState<string | null>(null)

  async function reload() {
    setAppointments(await listAppointments())
  }

  useEffect(() => {
    // Bookings made before slots were tracked separately have no lock yet;
    // without this their times would look free to new patients.
    reconcileData()
      .then(reload)
      .catch(() => reload())
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(
    () =>
      filter === 'all'
        ? appointments
        : appointments.filter((a) => a.status === filter),
    [appointments, filter],
  )

  async function sendWhatsAppReminder(a: Appointment) {
    const text = reminderMessage(
      a,
      confirmUrlFor(a.reference, window.location.origin),
    )
    window.open(whatsappHref(a.patientPhone, text), '_blank', 'noopener,noreferrer')
    try {
      await markReminderSent(a.id)
      const idToken = await auth?.currentUser?.getIdToken()
      await notifyPush({ kind: 'reminder', appointmentId: a.id, idToken })
      await createNotification({
        type: 'appointment_reminder',
        appointmentId: a.id,
        message: `Recordatorio enviado a ${a.patientName}`,
      }).catch(() => undefined)
      toast.success(
        'WhatsApp abierto. Si el paciente activó avisos, también le llega al celular.',
      )
      await reload()
    } catch {
      toast.error('Se abrió WhatsApp, pero no se pudo marcar el recordatorio')
    }
  }

  async function setStatus(id: string, status: AppointmentStatus) {
    if (
      (status === 'cancelled' || status === 'rejected') &&
      !window.confirm(
        `¿Seguro que quieres ${status === 'cancelled' ? 'cancelar' : 'rechazar'} esta cita? El cupo volverá a quedar disponible.`,
      )
    ) {
      return
    }

    try {
      const updated = await updateAppointmentStatus(id, status)
      if (status === 'confirmed') downloadIcs(updated)
      toast.success(TOASTS[status])
      await reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al actualizar')
    }
  }

  if (loading) return <p className="text-muted">Cargando…</p>

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Citas</h1>
          <p className="mt-1 text-sm text-muted">
            Revisa comprobantes y gestiona el estado de cada cita
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNew((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full bg-sage-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sage-600"
        >
          <Plus size={16} /> {showNew ? 'Cerrar' : 'Nueva cita'}
        </button>
      </div>

      <div className="mt-6">
        <AppointmentsHelp />
      </div>

      {showNew && (
        <NewAppointmentForm
          onCreated={() => {
            setShowNew(false)
            reload()
          }}
        />
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              filter === f.id
                ? 'bg-sage-500 text-white'
                : 'bg-white border border-sage-200 text-muted'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted">No hay citas en este filtro.</p>
        ) : (
          filtered.map((a) => (
            <article key={a.id} className="border border-sage-100 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{a.patientName}</p>
                  <p className="text-sm text-muted">
                    {a.patientEmail ? `${a.patientEmail} · ` : ''}
                    {a.patientPhone}
                  </p>
                  <p className="mt-1 text-sm text-ink">
                    {formatDisplayDate(a.date)} · {formatAppointmentClock(a)}
                    {normalizeHours(a.hours) > 1
                      ? ` · ${hoursLabel(normalizeHours(a.hours))}`
                      : ''}{' '}
                    ·{' '}
                    {a.sessionType === 'individual'
                      ? 'Individual'
                      : 'Pareja / Familia'}{' '}
                    · {formatCurrencyDop(a.price)}
                  </p>
                  {a.invoice && (
                    <p className="mt-2 text-xs text-sage-700">
                      Comprobante pedido: {a.invoice.legalName}
                      {a.invoice.rncCedula ? ` · ${a.invoice.rncCedula}` : ''}
                    </p>
                  )}
                  {a.notes && (
                    <p className="mt-2 text-sm text-muted">Notas: {a.notes}</p>
                  )}
                  {a.reference && (
                    <p className="mt-2 text-xs text-muted">
                      Código del paciente:{' '}
                      <span className="font-medium text-sage-700">
                        {a.reference}
                      </span>
                    </p>
                  )}
                  {a.reminderSentAt && (
                    <p className="mt-1 text-xs text-sage-700">
                      Recordatorio WhatsApp enviado
                    </p>
                  )}
                  {a.attendanceConfirmedAt && (
                    <p className="mt-1 text-xs font-medium text-sage-700">
                      El paciente confirmó asistencia
                    </p>
                  )}
                </div>
                <StatusBadge status={a.status} />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {a.paymentProofUrl && (
                  <a
                    href={a.paymentProofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-sage-200 px-3 py-1.5 text-xs font-medium text-sage-700 hover:bg-sage-50"
                  >
                    Ver comprobante
                    {a.paymentProofName ? ` (${a.paymentProofName})` : ''}
                  </a>
                )}

                {a.status === 'pending' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setStatus(a.id, 'confirmed')}
                      className="inline-flex items-center gap-1 rounded-lg bg-sage-500 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      <Check size={14} /> Confirmar
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus(a.id, 'rejected')}
                      className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                    >
                      <X size={14} /> Rechazar
                    </button>
                  </>
                )}

                {a.status === 'confirmed' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setStatus(a.id, 'completed')}
                      className="rounded-lg bg-lavender-100 px-3 py-1.5 text-xs font-semibold text-lavender-700"
                    >
                      Marcar completada
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadIcs(a)}
                      className="inline-flex items-center gap-1 rounded-lg border border-sage-200 px-3 py-1.5 text-xs font-medium text-sage-700"
                    >
                      <CalendarPlus size={14} /> Descargar .ics
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus(a.id, 'cancelled')}
                      className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                    >
                      <X size={14} /> Cancelar
                    </button>
                  </>
                )}

                {(a.status === 'pending' || a.status === 'confirmed') &&
                  a.patientPhone && (
                    <button
                      type="button"
                      onClick={() => sendWhatsAppReminder(a)}
                      className="inline-flex items-center gap-1 rounded-lg border border-sage-200 px-3 py-1.5 text-xs font-medium text-sage-700"
                    >
                      <MessageCircle size={14} />{' '}
                      {a.reminderSentAt
                        ? 'Reenviar WhatsApp'
                        : 'Recordatorio WhatsApp'}
                    </button>
                  )}

                {(a.status === 'pending' || a.status === 'confirmed') && (
                  <button
                    type="button"
                    onClick={() =>
                      setMovingId((id) => (id === a.id ? null : a.id))
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-sage-200 px-3 py-1.5 text-xs font-medium text-sage-700"
                  >
                    <CalendarClock size={14} />{' '}
                    {movingId === a.id ? 'Cerrar' : 'Reprogramar'}
                  </button>
                )}

                {a.status === 'completed' && (
                  <button
                    type="button"
                    onClick={() => setStatus(a.id, 'confirmed')}
                    className="inline-flex items-center gap-1 rounded-lg border border-sage-200 px-3 py-1.5 text-xs font-medium text-sage-700"
                  >
                    <Undo2 size={14} /> Deshacer completada
                  </button>
                )}

                {(a.status === 'rejected' || a.status === 'cancelled') && (
                  <p className="text-xs text-muted">
                    El cupo de esta fecha volvió a quedar disponible.
                  </p>
                )}
              </div>

              {movingId === a.id && (
                <AdminRescheduleForm
                  appointment={a}
                  onDone={() => {
                    setMovingId(null)
                    reload()
                  }}
                  onCancel={() => setMovingId(null)}
                />
              )}
            </article>
          ))
        )}
      </div>
    </div>
  )
}
