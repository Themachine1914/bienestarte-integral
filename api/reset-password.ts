type Body = { email?: unknown }

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

/**
 * Ask Firebase Auth to send its own reset email. Locale header makes the
 * subject/body Spanish so it is less likely to be treated as junk.
 *
 * Do not import `firebase-admin/auth` here: verifyIdToken / getAuth pull
 * jwks-rsa/jose and crash this CJS function on Vercel (see api/push.ts).
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
    if (message === 'missing_api_key') {
      return Response.json({ ok: false, error: 'not_configured' }, { status: 503 })
    }
    return Response.json({ ok: false, error: 'send_failed' }, { status: 502 })
  }

  return Response.json({ ok: true })
}
