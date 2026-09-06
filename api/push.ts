import { createHash } from 'node:crypto'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore, type QuerySnapshot } from 'firebase-admin/firestore'
import webpush from 'web-push'

type Audience = 'admin' | 'patient'
type SubscriptionJSON = {
  endpoint: string
  keys?: { p256dh?: string; auth?: string }
}

function firestore() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT
    if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT missing')
    initializeApp({ credential: cert(JSON.parse(raw) as object) })
  }
  return getFirestore()
}

function configureWebPush() {
  const publicKey = process.env.VITE_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:ortizgenesis@gmail.com'
  if (!publicKey || !privateKey) throw new Error('VAPID keys missing')
  webpush.setVapidDetails(subject, publicKey, privateKey)
}

function subscriptionId(endpoint: string): string {
  return createHash('sha256').update(endpoint).digest('hex').slice(0, 40)
}

/** Admin Auth's verifyIdToken pulls jwks-rsa/jose and crashes this CJS function. */
async function isSignedIn(token: string | undefined): Promise<boolean> {
  const key = process.env.VITE_FIREBASE_API_KEY
  if (!token || !key) return false
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    },
  )
  if (!res.ok) return false
  const data = (await res.json()) as { users?: Array<{ localId?: string }> }
  return Boolean(data.users?.[0]?.localId)
}

function slotLabel(time?: string): string {
  if (!time) return ''
  const [hours, minutes] = time.split(':').map(Number)
  const suffix = hours >= 12 ? 'PM' : 'AM'
  const hour = hours % 12 || 12
  return `${hour}:${String(minutes).padStart(2, '0')} ${suffix}`
}

async function sendAll(
  rows: QuerySnapshot,
  payload: { title: string; body: string; url: string },
) {
  configureWebPush()
  const body = JSON.stringify(payload)
  const stale: string[] = []
  await Promise.all(
    rows.docs.map(async (doc) => {
      const sub = doc.data().subscription as SubscriptionJSON | undefined
      if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
          },
          body,
        )
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) stale.push(doc.id)
      }
    }),
  )
  if (stale.length) {
    const store = firestore()
    await Promise.all(stale.map((id) => store.doc(`pushSubscriptions/${id}`).delete()))
  }
}

export async function POST(request: Request) {
  let body: {
    action?: string
    audience?: Audience
    appointmentId?: string
    subscription?: SubscriptionJSON
    kind?: 'appointment' | 'reminder'
  }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  let db
  try {
    db = firestore()
  } catch {
    return Response.json({ ok: false, error: 'firebase_admin_not_configured' }, { status: 503 })
  }

  if (body.action === 'subscribe') {
    const sub = body.subscription
    if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
      return Response.json({ ok: false, error: 'bad_subscription' }, { status: 400 })
    }

    if (body.audience === 'admin') {
      const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
      if (!(await isSignedIn(token))) {
        return new Response('Unauthorized', { status: 401 })
      }
    } else if (body.audience === 'patient') {
      if (!body.appointmentId) {
        return Response.json({ ok: false, error: 'missing_appointment' }, { status: 400 })
      }
      const appt = await db.doc(`appointments/${body.appointmentId}`).get()
      if (!appt.exists) {
        return Response.json({ ok: false, error: 'appointment_not_found' }, { status: 404 })
      }
    } else {
      return Response.json({ ok: false, error: 'bad_audience' }, { status: 400 })
    }

    const id = subscriptionId(sub.endpoint)
    await db.doc(`pushSubscriptions/${id}`).set({
      audience: body.audience,
      appointmentId: body.appointmentId || null,
      subscription: {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      },
      updatedAt: new Date().toISOString(),
    })
    return Response.json({ ok: true, id })
  }

  if (body.action === 'notify') {
    if (!body.appointmentId || (body.kind !== 'appointment' && body.kind !== 'reminder')) {
      return Response.json({ ok: false, error: 'bad_notify' }, { status: 400 })
    }

    const snap = await db.doc(`appointments/${body.appointmentId}`).get()
    if (!snap.exists) {
      return Response.json({ ok: false, error: 'appointment_not_found' }, { status: 404 })
    }
    const appt = snap.data() as {
      patientName?: string
      date?: string
      time?: string
      reference?: string
    }

    if (body.kind === 'reminder') {
      const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
      if (!(await isSignedIn(token))) {
        return new Response('Unauthorized', { status: 401 })
      }
    }

    const when = [appt.date, slotLabel(appt.time)].filter(Boolean).join(' · ')
    if (body.kind === 'appointment') {
      const admins = await db.collection('pushSubscriptions').where('audience', '==', 'admin').get()
      await sendAll(admins, {
        title: 'Nueva cita',
        body: `${appt.patientName || 'Paciente'} — ${when}`,
        url: '/admin/citas',
      })
    } else {
      const patients = await db
        .collection('pushSubscriptions')
        .where('appointmentId', '==', body.appointmentId)
        .get()
      await sendAll(patients, {
        title: 'Recordatorio de tu sesión',
        body: `Te esperamos ${when} con Orlandia (virtual).`,
        url: `/mis-citas?codigo=${encodeURIComponent(appt.reference || body.appointmentId)}`,
      })
    }
    return Response.json({ ok: true })
  }

  return Response.json({ ok: false, error: 'unknown_action' }, { status: 400 })
}
