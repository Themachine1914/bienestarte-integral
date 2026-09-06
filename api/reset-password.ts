import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

type Body = { email?: unknown }

function adminAuth() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT
    if (!raw) return null
    initializeApp({ credential: cert(JSON.parse(raw) as object) })
  }
  return getAuth()
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

/**
 * Ask Firebase Auth to send its own reset email. Locale header makes the
 * subject/body Spanish so it is less likely to be treated as junk.
 */
async function sendFirebaseResetEmail(email: string): Promise<void> {
  const key = process.env.VITE_FIREBASE_API_KEY
  if (!key) throw new Error('missing_api_key')
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(key)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Firebase-Locale': 'es',
      },
      body: JSON.stringify({ requestType: 'PASSWORD_RESET', email }),
    },
  )
  if (res.ok) return
  const text = await res.text()
  if (text.includes('EMAIL_NOT_FOUND')) return
  if (text.includes('INVALID_EMAIL')) throw new Error('invalid_email')
  if (text.includes('TOO_MANY_ATTEMPTS')) throw new Error('too_many')
  throw new Error(text.slice(0, 240) || 'send_failed')
}

async function sendResendEmail(to: string, resetLink: string): Promise<void> {
  const key = process.env.RESEND_API_KEY
  if (!key) return
  const from =
    process.env.RESEND_FROM ||
    'Bienestarte Integral <noreply@bienestarteintegral.com>'
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: 'Recupera tu clave del panel de Bienestarte',
      html: `<p>Hola,</p>
<p>Pediste cambiar la clave del panel de <strong>Bienestarte Integral</strong>.</p>
<p><a href="${resetLink}">Pulsa aquí para elegir una clave nueva</a>.</p>
<p>Si no fuiste tú, ignora este correo. El enlace vence en una hora.</p>`,
    }),
  })
  if (!res.ok) {
    throw new Error((await res.text()).slice(0, 240))
  }
}

/**
 * Always answers the same way whether the address has an account or not,
 * so this box cannot be used to discover the owner's email.
 */
export async function POST(request: Request) {
  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim() : ''
  if (!isEmail(email)) {
    return Response.json({ ok: false, error: 'invalid_email' }, { status: 400 })
  }

  let firebaseError: string | null = null
  try {
    await sendFirebaseResetEmail(email)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'send_failed'
    if (message === 'invalid_email') {
      return Response.json({ ok: false, error: 'invalid_email' }, { status: 400 })
    }
    if (message === 'too_many') {
      return Response.json({ ok: false, error: 'too_many' }, { status: 429 })
    }
    firebaseError = message
  }

  const auth = adminAuth()
  if (auth && process.env.RESEND_API_KEY) {
    try {
      await auth.getUserByEmail(email)
      const siteUrl = (process.env.SITE_URL || 'https://bienestarteintegral.com').replace(
        /\/$/,
        '',
      )
      let link: string
      try {
        link = await auth.generatePasswordResetLink(email, {
          url: `${siteUrl}/admin/recuperar`,
          handleCodeInApp: true,
        })
      } catch {
        // Production domain is not always in Firebase authorized domains.
        // The default hosted handler still lets her set a new password.
        link = await auth.generatePasswordResetLink(email)
      }
      await sendResendEmail(email, link)
      return Response.json({ ok: true })
    } catch {
      // No such user, or Resend rejected the send. Fall through.
    }
  }

  if (firebaseError && !process.env.VITE_FIREBASE_API_KEY) {
    return Response.json({ ok: false, error: 'not_configured' }, { status: 503 })
  }

  // Firebase accepted the request (or the address has no account). Same reply.
  return Response.json({ ok: true })
}
