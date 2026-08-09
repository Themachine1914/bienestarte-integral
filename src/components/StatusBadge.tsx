import type { AppointmentStatus } from '../types'

const LABELS: Record<AppointmentStatus, string> = {
  pending: 'Pendiente de confirmación',
  confirmed: 'Confirmada',
  rejected: 'Rechazada',
  completed: 'Completada',
  cancelled: 'Cancelada',
}

const STYLES: Record<AppointmentStatus, string> = {
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  confirmed: 'bg-sage-100 text-sage-800 border-sage-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  completed: 'bg-lavender-100 text-lavender-700 border-lavender-200',
  cancelled: 'bg-stone-100 text-stone-600 border-stone-200',
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  )
}

export { LABELS as STATUS_LABELS }
