import type { AppSettings, AvailabilityConfig } from '../types'

export const DEFAULT_SETTINGS: AppSettings = {
  practiceName: 'Bienestarte Integral',
  professionalName: 'Orlandia Ortiz Almonte, M.A.',
  credentials: 'Psicoterapeuta Clínico Familiar · Psicotrauma',
  titles: 'Psicoterapia · Salud Mental',
  codopsi: '10-03029',
  exequatur: '417-24',
  instagram: 'https://www.instagram.com/bienestarteintegral',
  modality: 'virtual',
  sessionTypes: [
    {
      id: 'individual',
      label: 'Individual',
      durationMinutes: 50,
      priceDop: 4000,
    },
    {
      id: 'couple_family',
      label: 'Pareja / Familia',
      durationMinutes: 50,
      priceDop: 4500,
    },
  ],
  bankAccounts: [
    {
      bank: 'Banco Popular Dominicano',
      holder: 'Orlandia Ortiz',
      accountType: 'Ahorros',
      accountNumber: '775058365',
      currency: 'DOP',
      cedula: '031-0451722-6',
      iban: 'DO28 BAGR 0000 0007 75058365',
    },
    {
      bank: 'Scotiabank',
      holder: 'Orlandia Ortiz',
      accountType: 'Ahorros',
      accountNumber: '12010008745',
      currency: 'DOP',
      cedula: '031-0451722-6',
    },
    {
      bank: 'Banco Popular Dominicano',
      holder: 'Orlandia Ortiz',
      accountType: 'Ahorros',
      accountNumber: '822462156',
      currency: 'USD',
      cedula: '031-0451722-6',
      iban: 'DO28 BAGR 0000 0008 22462156',
      swift: 'BPDODOSX',
    },
    {
      bank: 'Scotiabank',
      holder: 'Orlandia Ortiz',
      accountType: 'Ahorros',
      accountNumber: '03100342780',
      currency: 'USD',
      cedula: '031-0451722-6',
      swift: 'NOSCDOSDXXX',
    },
  ],
  paymentInstructions:
    'Para confirmar tu sesión envía: nombre del paciente, fecha y hora de la cita, y el comprobante de transferencia o depósito.',
}

export const DEFAULT_AVAILABILITY: AvailabilityConfig = {
  activeDays: [1, 2, 3, 4, 5], // Mon–Fri
  slots: ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00'],
  sessionDurationMinutes: 50,
}

export const EDUCATION = [
  'Lic. en Psicología Clínica — Universidad Abierta para Adultos (UAPA)',
  'Maestría en Terapia Familiar — Universidad Nacional Evangélica (UNEV) con el Dr. Duncker',
  'Maestría en Psicología Clínica y de la Salud — Universidad Autónoma de Santo Domingo (UASD)',
  'Máster en el modelo PARCUVE, neurobiología, trauma y apego — Dr. Manuel Hernández (Asociación Española del Trauma Psicológico y Feelink, México)',
  'Máster Internacional en Trauma Psicológico — AEPSIS y Feelink, México',
  'Especialidad en intervención en crisis, trauma, cronicidad y neurociencias — UNIBE y Universidad de Salamanca (USAL)',
  'Diplomado en Psiconutrición — Institute of Medicine and Psychology (IMEP), Miami FL',
  'Diplomado en Neuropsicología — Eduti Academy, Estados Unidos',
  'Diplomado Internacional en Psicotrauma e Intervención en Crisis — Universidad Autónoma de Tlaxcala, México',
  'Diplomado en Telepsicología — CODOPSI y CIEM',
  'Técnico Analista del Comportamiento ABA — Miami, EE.UU.',
  'Terapia Cognitivo Conductual y otras formaciones',
]

export const EXPERIENCE = [
  'Docente universitaria de Terapia Sistémica Familiar — Universidad Nordestana (UCNE)',
  'Coordinadora de servicios terapéuticos — CAID (Centro de Atención a la Discapacidad)',
  'Proyectos de investigación y maestra facilitadora — Pontificia Universidad Católica Madre y Maestra (PUCMM)',
  '18 años de experiencia en rehabilitación de pacientes psiquiátricos y psiconutrición',
  '15 años de experiencia en telepsicología',
  'Fundadora de Bienestarte Integral',
]
