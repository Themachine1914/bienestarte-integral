import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

type ReminderAppointment = {
  id: string
  status: string
  reminderSentAt?: string
  patientPhone: string
  patientName?: string
  date: string
  time: string
  reference: string
}

function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('1') && digits.length >= 11) return digits
  if (digits.length === 10) return `1${digits}`
  return digits
}

function practiceDateKey(now: Date, plusDays = 0): string {
  const ast = new Date(now.getTime() - 4 * 60 * 60 * 1000)
  ast.setUTCDate(ast.getUTCDate() + plusDays)
  const y = ast.getUTCFullYear()
  const m = String(ast.getUTCMonth() + 1).padStart(2, '0')
  const d = String(ast.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function needsWhatsAppReminder(
  appointment: ReminderAppointment,
  now: Date,
): boolean {
  if (appointment.status !== 'pending' && appointment.status !== 'confirmed') {
    return false
  }
  if (appointment.reminderSentAt) return false
  if (!appointment.patientPhone?.trim()) return false
  return appointment.date === practiceDateKey(now, 1)
}

function firestore() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT
    if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT missing')
    initializeApp({ credential: cert(JSON.parse(raw) as object) })
  }
  return getFirestore()
}

async function sendWhatsApp(to: string, body: string): Promise<void> {
  const token = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const template = process.env.WHATSAPP_TEMPLATE_NAME
  if (!token || !phoneId) {
    throw new Error('WhatsApp no está configurado')
  }

  const payload = template
    ? {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: template,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG || 'es' },
        },
      }
    : {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body, preview_url: true },
      }

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${phoneId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  )
  if (!res.ok) {
    throw new Error((await res.text()).slice(0, 400))
  }
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const testTo = new URL(request.url).searchParams.get('test')
  if (testTo) {
    try {
      await sendWhatsApp(toWhatsAppNumber(testTo), 'test')
      return Response.json({ ok: true, test: toWhatsAppNumber(testTo) })
    } catch (error) {
      return Response.json(
        {
          ok: false,
          error: error instanceof Error ? error.message : 'error',
        },
        { status: 502 },
      )
    }
  }

  if (!process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
    return Response.json({
      ok: true,
      sent: 0,
      skipped: 'whatsapp_not_configured',
    })
  }

  let db
  try {
    db = firestore()
  } catch {
    return Response.json({
      ok: true,
      sent: 0,
      skipped: 'firebase_admin_not_configured',
    })
  }

  const snap = await db.collection('appointments').get()
  const now = new Date()
  const due = snap.docs
    .map((d) => ({ ...(d.data() as ReminderAppointment), id: d.id }))
    .filter((a) => needsWhatsAppReminder(a, now))

  const results: Array<{ id: string; ok: boolean; error?: string }> = []
  for (const appointment of due) {
    try {
      await sendWhatsApp(toWhatsAppNumber(appointment.patientPhone), 'reminder')
      await db.doc(`appointments/${appointment.id}`).update({
        reminderSentAt: now.toISOString(),
        updatedAt: now.toISOString(),
      })
      results.push({ id: appointment.id, ok: true })
    } catch (error) {
      results.push({
        id: appointment.id,
        ok: false,
        error: error instanceof Error ? error.message : 'error',
      })
    }
  }

  return Response.json({
    ok: true,
    sent: results.filter((row) => row.ok).length,
    results,
  })
}
