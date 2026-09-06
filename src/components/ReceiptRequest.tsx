import { useState } from 'react'
import toast from 'react-hot-toast'
import { requestInvoice } from '../services/appointments'
import type { Appointment, AppSettings } from '../types'
import { ReceiptSheet } from './ReceiptSheet'

export function ReceiptRequest({
  appointment,
  settings,
  onUpdated,
}: {
  appointment: Appointment
  settings: AppSettings
  onUpdated?: (updated: Appointment) => void
}) {
  const [open, setOpen] = useState(false)
  const [legalName, setLegalName] = useState(
    appointment.invoice?.legalName || appointment.patientName,
  )
  const [rncCedula, setRncCedula] = useState(appointment.invoice?.rncCedula ?? '')
  const [email, setEmail] = useState(
    appointment.invoice?.email || appointment.patientEmail,
  )
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await requestInvoice(appointment.reference, {
        legalName,
        rncCedula,
        email,
      })
      onUpdated?.(updated)
      toast.success('Comprobante listo. Puedes verlo abajo.')
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo generar')
    } finally {
      setSaving(false)
    }
  }

  if (appointment.invoice) {
    return <ReceiptSheet appointment={appointment} settings={settings} />
  }

  if (!open) {
    return (
      <div className="mt-6 border border-sage-200 bg-white p-4 text-left">
        <p className="text-sm font-medium text-ink">
          ¿Necesitas un comprobante de servicio?
        </p>
        <p className="mt-1 text-xs text-muted">
          Es opcional. Es un PDF para tu contabilidad, no el comprobante de
          transferencia que ya enviaste ni una factura fiscal con NCF.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 rounded-full border border-sage-300 px-4 py-2 text-sm font-medium text-sage-700 hover:bg-sage-50"
        >
          Pedir comprobante de servicio
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={submit}
      className="mt-6 space-y-3 border border-sage-200 bg-white p-4 text-left"
    >
      <p className="text-sm font-medium text-ink">Datos del comprobante</p>
      <label className="block">
        <span className="text-xs font-medium text-ink">Nombre o razón social *</span>
        <input
          value={legalName}
          onChange={(e) => setLegalName(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-sage-200 px-3 py-2 text-sm outline-none focus:border-sage-400"
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-ink">Cédula o RNC (opcional)</span>
        <input
          value={rncCedula}
          onChange={(e) => setRncCedula(e.target.value)}
          className="mt-1 w-full rounded-lg border border-sage-200 px-3 py-2 text-sm outline-none focus:border-sage-400"
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-ink">Correo (opcional)</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-sage-200 px-3 py-2 text-sm outline-none focus:border-sage-400"
        />
      </label>
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-sage-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sage-600 disabled:opacity-60"
        >
          {saving ? 'Generando…' : 'Generar comprobante'}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => setOpen(false)}
          className="rounded-full border border-sage-200 px-4 py-2 text-sm text-muted"
        >
          Ahora no
        </button>
      </div>
    </form>
  )
}
