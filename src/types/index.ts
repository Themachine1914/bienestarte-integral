export type SessionType = 'individual' | 'couple_family'

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'completed'
  | 'cancelled'

export interface BankAccount {
  bank: string
  holder: string
  accountType: string
  accountNumber: string
  currency: 'DOP' | 'USD'
  cedula: string
  iban?: string
  swift?: string
}

export interface SessionTypeConfig {
  id: SessionType
  label: string
  durationMinutes: number
  priceDop: number
}

export interface AppSettings {
  practiceName: string
  professionalName: string
  credentials: string
  titles: string
  codopsi: string
  exequatur: string
  instagram: string
  modality: 'virtual'
  sessionTypes: SessionTypeConfig[]
  bankAccounts: BankAccount[]
  paymentInstructions: string
}

export interface AvailabilityConfig {
  activeDays: number[] // 1=Mon … 5=Fri (date-fns: Monday=1)
  slots: string[] // "HH:mm"
  sessionDurationMinutes: number
  /** Specific yyyy-MM-dd days closed for holidays or vacation. */
  blockedDates: string[]
}

export interface Patient {
  id: string
  name: string
  phone: string
  email: string
  privateNotes: string
  createdAt: string
  updatedAt: string
}

export interface Appointment {
  id: string
  /** Unguessable code the patient uses to look up this appointment. */
  reference: string
  patientId: string
  patientName: string
  patientPhone: string
  patientEmail: string
  sessionType: SessionType
  price: number
  date: string // yyyy-MM-dd
  time: string // HH:mm
  modality: 'virtual'
  status: AppointmentStatus
  notes: string
  paymentProofUrl: string
  paymentProofName?: string
  createdAt: string
  updatedAt: string
  /**
   * Times the patient has moved this appointment. Absent on appointments made
   * before rescheduling existed, which counts as zero.
   */
  rescheduleCount?: number
  /** `${date}_${time}` of every slot this appointment held before, oldest first. */
  previousSlots?: string[]
}

export interface AppNotification {
  id: string
  type:
    | 'appointment_created'
    | 'appointment_confirmed'
    | 'appointment_rejected'
    | 'appointment_cancelled'
    | 'appointment_rescheduled'
  appointmentId: string
  message: string
  read: boolean
  createdAt: string
}


/**
 * One booked slot, stored apart from the appointment so the public booking
 * page can see which times are taken without reading any patient data.
 *
 * Deliberately holds no link back to its appointment. The collection has to
 * stay publicly listable (the booking page queries it by date), so anything
 * stored here is world-readable — and the appointment reference is the
 * patient's only credential. Do not add an id back.
 */
export interface SlotLock {
  id: string // `${date}_${time}`
  date: string // yyyy-MM-dd
  time: string // HH:mm
  createdAt: string
}
