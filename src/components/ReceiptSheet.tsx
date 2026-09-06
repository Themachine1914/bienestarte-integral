import { printReceipt, receiptRows, issuedLabel } from '../lib/receipt'
import type { Appointment, AppSettings } from '../types'

/** On-screen copy of the printable receipt, so the patient can see it. */
export function ReceiptSheet({
  appointment,
  settings,
}: {
  appointment: Appointment
  settings: AppSettings
}) {
  const rows = receiptRows(appointment)

  return (
    <div className="mt-6 border border-sage-100 bg-white p-5 text-left sm:p-7">
      <div className="text-center">
        <img
          src="/brand/logo-seal.png"
          alt="Bienestarte Integral"
          className="mx-auto h-24 w-24 object-contain"
        />
        <h2 className="font-display mt-3 text-2xl text-ink">
          {settings.practiceName}
        </h2>
        <p className="mt-1 text-xs leading-5 text-muted">
          {settings.professionalName}
          <br />
          {settings.credentials}
          <br />
          CODOPSI {settings.codopsi} · Exequátur {settings.exequatur}
        </p>
        <p className="mt-3 text-xs text-muted">
          Comprobante de servicio · {issuedLabel()}
        </p>
      </div>

      <dl className="mt-6 divide-y divide-sage-100 text-sm">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex justify-between gap-4 py-2.5"
          >
            <dt className="text-muted">{label}</dt>
            <dd
              className={
                label === 'Total'
                  ? 'font-display text-lg text-ink'
                  : 'text-right text-ink'
              }
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-5 text-xs leading-5 text-muted">
        Este es un comprobante simple de servicio profesional. No es una
        factura fiscal con NCF. Guárdalo junto a tu código de seguimiento.
      </p>

      <button
        type="button"
        onClick={() => printReceipt(appointment, settings)}
        className="mt-5 rounded-full bg-sage-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sage-600"
      >
        Imprimir o guardar PDF
      </button>
    </div>
  )
}
