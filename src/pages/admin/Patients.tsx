import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  CalendarPlus,
  FileText,
  Mail,
  MessageCircle,
  Search,
  X,
} from 'lucide-react'
import { formatCurrencyDop, formatDisplayDate } from '../../lib/dates'
import { formatAppointmentClock, hoursLabel, normalizeHours } from '../../lib/time'
import { printReceipt } from '../../lib/receipt'
import {
  mailtoHref,
  practiceDateKey,
  receiptMessage,
  receiptUrlFor,
  whatsappHref,
} from '../../lib/reminders'
import { useSettings } from '../../hooks/useSettings'
import {
  listAppointments,
  reconcileData,
} from '../../services/appointments'
import { listPatients, updatePatientNotes } from '../../services/patients'
import { StatusBadge } from '../../components/StatusBadge'
import { NewAppointmentForm } from './NewAppointmentForm'
import { PatientsHelp } from './PatientsHelp'
import type { Appointment, AppSettings, Patient } from '../../types'

/** Only a session that is paid for (or already held) gets a receipt. */
const RECEIPTABLE: Appointment['status'][] = ['confirmed', 'completed']

function sessionLabel(a: Appointment): string {
  return a.sessionType === 'individual' ? 'Individual' : 'Pareja / Familia'
}

export function PatientsPage() {
  const { settings } = useSettings()
  const [patients, setPatients] = useState<Patient[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const detailRef = useRef<HTMLDivElement>(null)
  const reloadId = useRef(0)

  async function reload() {
    const id = ++reloadId.current
    const [p, a] = await Promise.all([listPatients(), listAppointments()])
    if (id !== reloadId.current) return
    setPatients(p)
    setAppointments(a)
  }

  useEffect(() => {
    // The list paints first. Linking a public booking to its patient record
    // continues in the background and only refreshes the page if it changed
    // something — waiting on that scan is what made this page feel stuck.
    let active = true
    reload()
      .catch(() => {
        if (active) toast.error('No se pudieron cargar los pacientes')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    void reconcileData()
      .then((result) => {
        if (active && result.appointmentsChanged) return reload()
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [])

  const byPatient = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    for (const a of appointments) {
      if (!a.patientId) continue
      map.set(a.patientId, [...(map.get(a.patientId) ?? []), a])
    }
    return map
  }, [appointments])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return patients
    const digits = q.replace(/\D/g, '')
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (digits !== '' && p.phone.replace(/\D/g, '').includes(digits)),
    )
  }, [patients, search])

  const selected = patients.find((p) => p.id === selectedId) ?? null

  function openPatient(id: string) {
    setSelectedId(id)
    // On a phone the record sits below the list; bring it into view.
    if (window.innerWidth < 1024) {
      requestAnimationFrame(() =>
        detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      )
    }
  }

  if (loading) return <p className="text-muted">Cargando…</p>

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Pacientes</h1>
      <p className="mt-1 text-sm text-muted">
        Expediente de cada paciente: sus citas, agendar una nueva y enviarle
        el comprobante
      </p>

      <div className="mt-6">
        <PatientsHelp />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <label className="relative block">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, teléfono o email"
              className="w-full rounded-lg border border-sage-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-sage-400"
            />
          </label>
          <p className="mt-2 text-xs text-muted">
            {patients.length} paciente{patients.length === 1 ? '' : 's'}
          </p>

          <div className="mt-3 space-y-2">
            {patients.length === 0 ? (
              <p className="text-sm text-muted">
                Aún no hay pacientes. Se crean al agendar una cita.
              </p>
            ) : visible.length === 0 ? (
              <p className="text-sm text-muted">Nadie coincide con la búsqueda.</p>
            ) : (
              visible.map((p) => {
                const history = byPatient.get(p.id) ?? []
                const held = history.filter((a) => a.status === 'completed')
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => openPatient(p.id)}
                    className={`w-full border px-4 py-3 text-left transition ${
                      selectedId === p.id
                        ? 'border-sage-500 bg-sage-50'
                        : 'border-sage-100 bg-white hover:border-sage-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-ink">{p.name}</p>
                      <span className="shrink-0 text-xs text-muted">
                        {history.length} cita{history.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <p className="text-xs text-muted">
                      {p.email ? `${p.email} · ` : ''}
                      {p.phone}
                    </p>
                    {held.length > 0 && (
                      <p className="mt-1 text-xs text-sage-700">
                        Última sesión: {formatDisplayDate(held[0].date)}
                      </p>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        <div ref={detailRef} className="scroll-mt-4 lg:col-span-3">
          {selected ? (
            <PatientRecord
              key={selected.id}
              patient={selected}
              history={byPatient.get(selected.id) ?? []}
              settings={settings}
              onBooked={(created) => {
                setAppointments((list) => {
                  const rest = list.filter((item) => item.id !== created.id)
                  return [created, ...rest].sort((a, b) =>
                    `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`),
                  )
                })
              }}
              onNotesSaved={(notes) => {
                setPatients((list) =>
                  list.map((item) =>
                    item.id === selected.id
                      ? { ...item, privateNotes: notes }
                      : item,
                  ),
                )
              }}
            />
          ) : (
            patients.length > 0 && (
              <p className="border border-dashed border-sage-200 p-6 text-sm text-muted">
                Elige un paciente para ver su expediente.
              </p>
            )
          )}
        </div>
      </div>
    </div>
  )
}

function PatientRecord({
  patient,
  history,
  settings,
  onBooked,
  onNotesSaved,
}: {
  patient: Patient
  history: Appointment[]
  settings: AppSettings
  onBooked: (appointment: Appointment) => void
  onNotesSaved: (notes: string) => void
}) {
  const [notes, setNotes] = useState(patient.privateNotes)
  const [booking, setBooking] = useState(false)
  const [justBooked, setJustBooked] = useState<Appointment | null>(null)

  const today = practiceDateKey()
  const completed = history.filter((a) => a.status === 'completed')
  const upcoming = history
    .filter(
      (a) =>
        (a.status === 'pending' || a.status === 'confirmed') && a.date >= today,
    )
    .reverse()
  const dropped = history.filter(
    (a) => a.status === 'cancelled' || a.status === 'rejected',
  )
  const billed = history
    .filter((a) => RECEIPTABLE.includes(a.status))
    .reduce((sum, a) => sum + a.price, 0)
  const kept = history.filter((a) => !dropped.includes(a))
  const firstDate = kept.length > 0 ? kept[kept.length - 1].date : null
  // Book the kind of session they had last, so a couple stays a couple.
  const lastType = kept[0]?.sessionType ?? 'individual'

  async function saveNotes() {
    try {
      await updatePatientNotes(patient.id, notes)
      toast.success('Notas guardadas')
      onNotesSaved(notes)
    } catch {
      toast.error('No se pudieron guardar las notas')
    }
  }

  return (
    <div className="border border-sage-100 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-ink">{patient.name}</h2>
          <p className="text-sm text-muted">
            {patient.email ? (
              <>
                {patient.email}
                <br />
              </>
            ) : null}
            {patient.phone}
          </p>
          {firstDate && (
            <p className="mt-1 text-xs text-muted">
              Paciente desde {formatDisplayDate(firstDate)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setBooking((v) => !v)
            setJustBooked(null)
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-sage-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sage-600"
        >
          {booking ? (
            <>
              <X size={16} /> Cerrar
            </>
          ) : (
            <>
              <CalendarPlus size={16} /> Agendar nueva cita
            </>
          )}
        </button>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden border border-sage-100 bg-sage-100 sm:grid-cols-4">
        <Stat label="Sesiones realizadas" value={String(completed.length)} />
        <Stat label="Próximas" value={String(upcoming.length)} />
        <Stat label="Canceladas / rechazadas" value={String(dropped.length)} />
        <Stat label="Total facturado" value={formatCurrencyDop(billed)} />
      </dl>

      {upcoming[0] && !booking && (
        <p className="mt-3 text-sm text-ink">
          Próxima cita:{' '}
          <span className="font-medium">
            {formatDisplayDate(upcoming[0].date)} ·{' '}
            {formatAppointmentClock(upcoming[0])}
          </span>
        </p>
      )}

      {booking && (
        <NewAppointmentForm
          patient={patient}
          defaultSessionType={lastType}
          onCreated={(created) => {
            setBooking(false)
            setJustBooked(created)
            onBooked(created)
          }}
        />
      )}

      {justBooked && (
        <div className="mt-4 border border-sage-200 bg-sage-50 p-4">
          <p className="text-sm font-medium text-ink">
            Cita confirmada para el {formatDisplayDate(justBooked.date)} ·{' '}
            {formatAppointmentClock(justBooked)}
          </p>
          <p className="mt-1 text-xs text-muted">
            Envíale el comprobante para que tenga la fecha y su código de
            seguimiento ({justBooked.reference}).
          </p>
          <ReceiptActions appointment={justBooked} settings={settings} />
        </div>
      )}

      <h3 className="mt-8 font-medium text-ink">Historial de citas</h3>
      <div className="mt-3 space-y-2">
        {history.length === 0 ? (
          <p className="text-sm text-muted">Sin citas.</p>
        ) : (
          history.map((a) => (
            <div key={a.id} className="border border-sage-100 px-3 py-2.5 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-ink">
                    {formatDisplayDate(a.date)} · {formatAppointmentClock(a)}
                  </p>
                  <p className="text-xs text-muted">
                    {sessionLabel(a)}
                    {normalizeHours(a.hours) > 1
                      ? ` · ${hoursLabel(normalizeHours(a.hours))}`
                      : ''}{' '}
                    · {formatCurrencyDop(a.price)}
                    {a.reference ? ` · ${a.reference}` : ''}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </div>
              {RECEIPTABLE.includes(a.status) && (
                <ReceiptActions appointment={a} settings={settings} compact />
              )}
            </div>
          ))
        )}
      </div>

      <label className="mt-8 block text-sm font-medium text-ink">
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
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-3 py-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-ink">{value}</dd>
    </div>
  )
}

/**
 * The receipt goes out as a link to the patient's own "Mis citas" page, where
 * they can see it, print it or save it as PDF. Orlandia can also open the
 * printable copy to attach the PDF herself.
 */
function ReceiptActions({
  appointment,
  settings,
  compact = false,
}: {
  appointment: Appointment
  settings: AppSettings
  compact?: boolean
}) {
  const text = receiptMessage(
    appointment,
    receiptUrlFor(appointment.reference, window.location.origin),
  )
  const button = compact
    ? 'inline-flex items-center gap-1 rounded-lg border border-sage-200 px-2.5 py-1 text-xs font-medium text-sage-700 hover:bg-sage-50'
    : 'inline-flex items-center gap-1 rounded-lg border border-sage-200 bg-white px-3 py-1.5 text-xs font-medium text-sage-700 hover:bg-sage-50'

  function open() {
    try {
      printReceipt(appointment, settings)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo abrir')
    }
  }

  return (
    <div className={`${compact ? 'mt-2' : 'mt-3'} flex flex-wrap gap-2`}>
      <button type="button" onClick={open} className={button}>
        <FileText size={14} /> Ver comprobante
      </button>
      {appointment.patientPhone && (
        <a
          href={whatsappHref(appointment.patientPhone, text)}
          target="_blank"
          rel="noreferrer"
          className={button}
        >
          <MessageCircle size={14} /> Enviar por WhatsApp
        </a>
      )}
      {appointment.patientEmail && (
        <a
          href={mailtoHref(
            appointment.patientEmail,
            `Comprobante de tu cita · ${settings.practiceName}`,
            text,
          )}
          className={button}
        >
          <Mail size={14} /> Enviar por email
        </a>
      )}
    </div>
  )
}
