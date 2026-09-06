import type { Appointment, AppSettings } from '../types'
import { formatCurrencyDop, formatDisplayDate } from './dates'
import { formatAppointmentClock, hoursLabel, normalizeHours } from './time'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function receiptRows(
  appointment: Appointment,
): Array<[string, string]> {
  const invoice = appointment.invoice
  const hours = normalizeHours(appointment.hours)
  return [
    ['Paciente / titular', invoice?.legalName || appointment.patientName],
    invoice?.rncCedula ? ['Cédula / RNC', invoice.rncCedula] : null,
    invoice?.email ? ['Correo', invoice.email] : null,
    [
      'Servicio',
      appointment.sessionType === 'individual'
        ? 'Sesión individual'
        : 'Sesión de pareja / familia',
    ],
    ['Duración', hoursLabel(hours)],
    ['Fecha', formatDisplayDate(appointment.date)],
    ['Horario', formatAppointmentClock(appointment)],
    ['Modalidad', 'Virtual'],
    ['Referencia', appointment.reference],
    ['Total', formatCurrencyDop(appointment.price)],
  ].filter((row): row is [string, string] => row !== null)
}

export function issuedLabel(now = new Date()): string {
  return now.toLocaleDateString('es-DO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function logoSrc(): string {
  return `${window.location.origin}/brand/logo-seal.png`
}

/** Opens a window the patient can see, then print or save as PDF. No fiscal NCF. */
export function printReceipt(
  appointment: Appointment,
  settings: AppSettings,
): void {
  const rows = receiptRows(appointment)
  const issued = issuedLabel()
  const logo = escapeHtml(logoSrc())

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Comprobante ${escapeHtml(appointment.reference)}</title>
  <style>
    body { font-family: Georgia, "Times New Roman", serif; color: #2c3228; margin: 0; background: #f4f1ea; }
    .bar { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 20px; background: #fff; border-bottom: 1px solid #e4e8e0; }
    .bar button { font: 600 13px system-ui, sans-serif; border: 0; border-radius: 999px; padding: 8px 16px; cursor: pointer; }
    .print { background: #6b8f71; color: #fff; }
    .sheet { max-width: 640px; margin: 28px auto; background: #fff; padding: 40px 44px; }
    .letterhead { text-align: center; margin-bottom: 28px; }
    .letterhead img { width: 104px; height: 104px; object-fit: contain; }
    h1 { font-size: 22px; margin: 12px 0 4px; }
    .sub { color: #5c6658; font-size: 13px; margin: 0 0 8px; line-height: 1.45; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { text-align: left; padding: 8px 0; border-bottom: 1px solid #e4e8e0; font-size: 14px; }
    th { width: 40%; color: #5c6658; font-weight: normal; }
    .note { margin-top: 28px; font-size: 12px; color: #5c6658; line-height: 1.5; }
    .total { font-size: 18px; font-weight: bold; }
    @media print {
      body { background: #fff; }
      .bar { display: none; }
      .sheet { margin: 0; box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="bar">
    <button class="print" type="button" onclick="window.print()">Imprimir o guardar PDF</button>
  </div>
  <div class="sheet">
    <div class="letterhead">
      <img src="${logo}" alt="Bienestarte Integral" />
      <h1>${escapeHtml(settings.practiceName)}</h1>
      <p class="sub">
        ${escapeHtml(settings.professionalName)}<br />
        ${escapeHtml(settings.credentials)}<br />
        CODOPSI ${escapeHtml(settings.codopsi)} · Exequátur ${escapeHtml(settings.exequatur)}
      </p>
      <p class="sub">Comprobante de servicio · ${escapeHtml(issued)}</p>
    </div>
    <table>
      ${rows
        .map(
          ([label, value]) =>
            `<tr><th>${escapeHtml(label)}</th><td class="${label === 'Total' ? 'total' : ''}">${escapeHtml(value)}</td></tr>`,
        )
        .join('')}
    </table>
    <p class="note">
      Este es un comprobante simple de servicio profesional. No es una factura
      fiscal con NCF. Guárdalo junto a tu código de seguimiento.
    </p>
  </div>
</body>
</html>`

  const popup = window.open('', '_blank', 'noopener,noreferrer,width=720,height=900')
  if (!popup) {
    throw new Error('Permite ventanas emergentes para ver el comprobante')
  }
  popup.document.write(html)
  popup.document.close()
}
