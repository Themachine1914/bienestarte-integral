import { useState } from 'react'
import toast from 'react-hot-toast'
import { Bell } from 'lucide-react'
import { auth } from '../lib/firebase'
import { canUsePush, subscribeToPush, type PushAudience } from '../lib/push'

export function EnablePush({
  audience,
  appointmentId,
  compact = false,
}: {
  audience: PushAudience
  appointmentId?: string
  compact?: boolean
}) {
  const storageKey = `bienestarte-push-${audience}-${appointmentId || 'admin'}`
  const [busy, setBusy] = useState(false)
  const [on, setOn] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem(storageKey) === '1',
  )

  if (!canUsePush()) return null

  async function enable() {
    setBusy(true)
    try {
      const idToken = audience === 'admin' ? await auth?.currentUser?.getIdToken() : undefined
      await subscribeToPush(audience, appointmentId, idToken)
      localStorage.setItem(storageKey, '1')
      setOn(true)
      toast.success('Avisos activados. Te llegan aunque cierres la app.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudieron activar los avisos')
    } finally {
      setBusy(false)
    }
  }

  if (on) {
    return (
      <p className="text-sm text-sage-700">
        Avisos activos en este celular.
      </p>
    )
  }

  return (
    <div
      className={
        compact
          ? 'mt-4'
          : 'mt-8 rounded-lg border border-sage-100 bg-white px-4 py-4'
      }
    >
      {!compact && (
        <>
          <p className="font-medium text-ink">Avisos en el celular</p>
          <p className="mt-1 text-sm text-muted">
            {audience === 'admin'
              ? 'Recibe la cita nueva y el recordatorio aunque tengas el panel cerrado. En iPhone, primero añade Bienestarte Admin a la pantalla de inicio.'
              : 'Actívalos para que el recordatorio te llegue aunque no tengas el sitio abierto. En iPhone, primero añade la página a la pantalla de inicio.'}
          </p>
        </>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={enable}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-sage-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sage-600 disabled:opacity-60"
      >
        <Bell size={15} />
        {busy ? 'Activando…' : 'Activar avisos'}
      </button>
    </div>
  )
}
