import { DEFAULT_AVAILABILITY, DEFAULT_SETTINGS } from '../lib/defaults'
import type {
  AppNotification,
  AppSettings,
  Appointment,
  AvailabilityConfig,
  Patient,
} from '../types'

const KEYS = {
  settings: 'bi_settings',
  availability: 'bi_availability',
  patients: 'bi_patients',
  appointments: 'bi_appointments',
  notifications: 'bi_notifications',
  session: 'bi_admin_session',
} as const

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${crypto.randomUUID()}`
}

export const localDb = {
  getSettings(): AppSettings {
    return read(KEYS.settings, DEFAULT_SETTINGS)
  },
  saveSettings(settings: AppSettings): void {
    write(KEYS.settings, settings)
  },

  getAvailability(): AvailabilityConfig {
    return read(KEYS.availability, DEFAULT_AVAILABILITY)
  },
  saveAvailability(config: AvailabilityConfig): void {
    write(KEYS.availability, config)
  },

  getPatients(): Patient[] {
    return read<Patient[]>(KEYS.patients, [])
  },
  savePatients(patients: Patient[]): void {
    write(KEYS.patients, patients)
  },

  getAppointments(): Appointment[] {
    return read<Appointment[]>(KEYS.appointments, [])
  },
  saveAppointments(appointments: Appointment[]): void {
    write(KEYS.appointments, appointments)
  },

  getNotifications(): AppNotification[] {
    return read<AppNotification[]>(KEYS.notifications, [])
  },
  saveNotifications(items: AppNotification[]): void {
    write(KEYS.notifications, items)
  },

  getAdminSession(): boolean {
    return localStorage.getItem(KEYS.session) === '1'
  },
  setAdminSession(active: boolean): void {
    if (active) localStorage.setItem(KEYS.session, '1')
    else localStorage.removeItem(KEYS.session)
  },
}
