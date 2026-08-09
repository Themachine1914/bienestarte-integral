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
}

export interface AppNotification {
  id: string
  type: 'appointment_created' | 'appointment_confirmed' | 'appointment_rejected'
  appointmentId: string
  message: string
  read: boolean
  createdAt: string
}
