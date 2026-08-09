import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { DEFAULT_SETTINGS } from '../../lib/defaults'
import { getSettings, saveSettings } from '../../services/settings'
import type { AppSettings } from '../../types'

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    try {
      await saveSettings(settings)
      toast.success('Configuración guardada')
    } catch {
      toast.error('No se pudo guardar')
    }
  }

  if (loading) return <p className="text-muted">Cargando…</p>

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Configuración</h1>
      <p className="mt-1 text-sm text-muted">
        Precios, datos de transferencia y perfil profesional
      </p>

      <form onSubmit={handleSave} className="mt-8 max-w-2xl space-y-8">
        <section className="space-y-3">
          <h2 className="font-medium text-ink">Perfil</h2>
          <Field
            label="Nombre del consultorio"
            value={settings.practiceName}
            onChange={(v) => setSettings({ ...settings, practiceName: v })}
          />
          <Field
            label="Nombre profesional"
            value={settings.professionalName}
            onChange={(v) => setSettings({ ...settings, professionalName: v })}
          />
          <Field
            label="Instagram URL"
            value={settings.instagram}
            onChange={(v) => setSettings({ ...settings, instagram: v })}
          />
          <Field
            label="Instrucciones de pago"
            value={settings.paymentInstructions}
            onChange={(v) =>
              setSettings({ ...settings, paymentInstructions: v })
            }
            multiline
          />
        </section>

        <section className="space-y-3">
          <h2 className="font-medium text-ink">Precios (DOP)</h2>
          {settings.sessionTypes.map((s, i) => (
            <div key={s.id} className="flex flex-wrap items-end gap-3">
              <Field
                label={s.label}
                value={String(s.priceDop)}
                onChange={(v) => {
                  const next = [...settings.sessionTypes]
                  next[i] = { ...s, priceDop: Number(v) || 0 }
                  setSettings({ ...settings, sessionTypes: next })
                }}
              />
            </div>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="font-medium text-ink">Cuentas bancarias</h2>
          <p className="text-xs text-muted">
            Se muestran al paciente en el paso de pago. Edita los números si
            cambian.
          </p>
          {settings.bankAccounts.map((acc, i) => (
            <div
              key={`${acc.bank}-${acc.accountNumber}`}
              className="border border-sage-100 bg-white p-4 space-y-2"
            >
              <p className="text-sm font-medium text-sage-700">
                {acc.bank} · {acc.currency}
              </p>
              <Field
                label="Número de cuenta"
                value={acc.accountNumber}
                onChange={(v) => {
                  const next = [...settings.bankAccounts]
                  next[i] = { ...acc, accountNumber: v }
                  setSettings({ ...settings, bankAccounts: next })
                }}
              />
              {acc.iban !== undefined && (
                <Field
                  label="IBAN"
                  value={acc.iban ?? ''}
                  onChange={(v) => {
                    const next = [...settings.bankAccounts]
                    next[i] = { ...acc, iban: v }
                    setSettings({ ...settings, bankAccounts: next })
                  }}
                />
              )}
              {acc.swift !== undefined && (
                <Field
                  label="SWIFT"
                  value={acc.swift ?? ''}
                  onChange={(v) => {
                    const next = [...settings.bankAccounts]
                    next[i] = { ...acc, swift: v }
                    setSettings({ ...settings, bankAccounts: next })
                  }}
                />
              )}
            </div>
          ))}
        </section>

        <button
          type="submit"
          className="rounded-full bg-sage-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sage-600"
        >
          Guardar configuración
        </button>
      </form>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  multiline?: boolean
}) {
  return (
    <label className="block text-sm font-medium text-ink">
      {label}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="mt-1.5 w-full rounded-lg border border-sage-200 px-3 py-2 text-sm font-normal outline-none focus:border-sage-400"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-sage-200 px-3 py-2 text-sm font-normal outline-none focus:border-sage-400"
        />
      )}
    </label>
  )
}
