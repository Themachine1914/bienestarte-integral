export type PushAudience = 'admin' | 'patient'

export type PushPayload = {
  title: string
  body: string
  url: string
}

function urlBase64ToUint8Array(base64: string): BufferSource {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i)
  return output
}

export function canUsePush(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export async function ensurePushWorker(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration()
  if (existing) {
    await navigator.serviceWorker.ready
    return existing
  }
  const registration = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready
  return registration
}

export async function subscribeToPush(
  audience: PushAudience,
  appointmentId?: string,
  idToken?: string,
): Promise<void> {
  if (!canUsePush()) {
    throw new Error('Este celular no admite avisos con la app cerrada')
  }
  const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
  if (!publicKey) {
    throw new Error('Faltan las claves de avisos (VITE_VAPID_PUBLIC_KEY)')
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Hay que permitir los avisos en el celular')
  }

  const registration = await ensurePushWorker()
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (idToken) headers.Authorization = `Bearer ${idToken}`

  const res = await fetch('/api/push', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action: 'subscribe',
      audience,
      appointmentId,
      subscription: subscription.toJSON(),
    }),
  })
  if (!res.ok) {
    throw new Error('No se pudo guardar el aviso en el servidor')
  }
}

export async function notifyPush(input: {
  kind: 'appointment' | 'reminder'
  appointmentId: string
  idToken?: string
}): Promise<void> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (input.idToken) headers.Authorization = `Bearer ${input.idToken}`
  await fetch('/api/push', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action: 'notify',
      kind: input.kind,
      appointmentId: input.appointmentId,
    }),
  }).catch(() => undefined)
}
