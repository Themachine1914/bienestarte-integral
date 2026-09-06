import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { authErrorMessage } from '../../lib/authErrors'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export function RecoverPasswordPage() {
  const { resetPassword, verifyResetCode, confirmReset, isDemoMode } = useAuth()
  const [params] = useSearchParams()
  const oobCode = params.get('oobCode')?.trim() || ''
  const presetEmail = params.get('email') ?? ''

  return (
    <RecoverShell>
      {oobCode ? (
        <SetNewPassword
          oobCode={oobCode}
          verifyResetCode={verifyResetCode}
          confirmReset={confirmReset}
        />
      ) : (
        <RequestResetForm
          presetEmail={presetEmail}
          resetPassword={resetPassword}
          isDemoMode={isDemoMode}
        />
      )}
    </RecoverShell>
  )
}

function RecoverShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cream-100 via-sage-50 to-lavender-50 px-4">
      <Toaster position="top-center" />
      <div className="w-full max-w-md border border-sage-100 bg-white p-8 shadow-sm">
        <img
          src="/brand/logo-seal.jpg"
          alt=""
          className="mx-auto h-16 w-16 rounded-full object-cover"
        />
        {children}
      </div>
    </div>
  )
}

function RequestResetForm({
  presetEmail,
  resetPassword,
  isDemoMode,
}: {
  presetEmail: string
  resetPassword: (email: string) => Promise<void>
  isDemoMode: boolean
}) {
  const [email, setEmail] = useState(presetEmail)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      setStatus('error')
      setError('Escribe el correo con el que entras al panel.')
      return
    }
    if (isDemoMode) {
      setStatus('error')
      setError(
        'En este momento no hay conexión con el servidor, así que no se puede enviar el correo. Espera un momento e inténtalo de nuevo.',
      )
      return
    }
    setStatus('sending')
    setError('')
    try {
      await resetPassword(email)
      setStatus('sent')
    } catch (err) {
      setStatus('error')
      setError(
        authErrorMessage(
          err,
          'No se pudo enviar el correo. Inténtalo de nuevo en un momento.',
        ),
      )
    }
  }

  return (
    <>
      <h1 className="mt-4 text-center font-display text-3xl text-ink">
        Recuperar clave
      </h1>
      <p className="mt-2 text-center text-sm text-muted">
        Escribe el correo con el que entras al panel. Al pulsar el botón te
        llega un enlace para elegir una clave nueva. Revisa también la carpeta
        de spam.
      </p>
      <ol className="mt-4 list-decimal space-y-1 pl-5 text-left text-xs text-muted">
        <li>Usa el mismo correo de siempre, no otro.</li>
        <li>Pulsa Enviar enlace y abre el correo (y spam).</li>
        <li>En el enlace eliges la clave nueva y vuelves a entrar.</li>
      </ol>

      {status === 'sent' ? (
        <div className="mt-6 rounded-lg border border-sage-200 bg-sage-50 px-4 py-3 text-sm text-sage-800">
          Si ese correo tiene cuenta, ya salió el enlace. Puede tardar un
          minuto. Si no llega, revisa spam o vuelve a pedirlo.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6">
          <label className="block text-sm font-medium text-ink">
            Email de la cuenta
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (status === 'error') setStatus('idle')
              }}
              className="mt-1.5 w-full rounded-lg border border-sage-200 px-3 py-2 outline-none focus:border-sage-400"
            />
          </label>
          {status === 'error' && error && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={status === 'sending'}
            className="mt-6 w-full rounded-full bg-sage-500 py-2.5 text-sm font-semibold text-white hover:bg-sage-600 disabled:opacity-60"
          >
            {status === 'sending' ? 'Enviando el correo…' : 'Enviar enlace'}
          </button>
        </form>
      )}

      <Link
        to="/admin/login"
        className="mt-6 block text-center text-xs text-muted underline underline-offset-2 hover:text-sage-700"
      >
        Volver al acceso
      </Link>
    </>
  )
}

function SetNewPassword({
  oobCode,
  verifyResetCode,
  confirmReset,
}: {
  oobCode: string
  verifyResetCode: (oobCode: string) => Promise<string>
  confirmReset: (oobCode: string, newPassword: string) => Promise<void>
}) {
  const [checking, setChecking] = useState(true)
  const [accountEmail, setAccountEmail] = useState('')
  const [checkError, setCheckError] = useState('')
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    verifyResetCode(oobCode)
      .then((email) => {
        if (!cancelled) setAccountEmail(email)
      })
      .catch((err) => {
        if (!cancelled) {
          setCheckError(
            authErrorMessage(
              err,
              'Ese enlace no es válido o ya se usó. Pide uno nuevo.',
            ),
          )
        }
      })
      .finally(() => {
        if (!cancelled) setChecking(false)
      })
    return () => {
      cancelled = true
    }
  }, [oobCode, verifyResetCode])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      setStatus('error')
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== repeat) {
      setStatus('error')
      setError('Las dos contraseñas no coinciden.')
      return
    }
    setStatus('sending')
    setError('')
    try {
      await confirmReset(oobCode, password)
      setStatus('sent')
    } catch (err) {
      setStatus('error')
      setError(
        authErrorMessage(err, 'No se pudo guardar la clave nueva. Inténtalo de nuevo.'),
      )
    }
  }

  if (checking) {
    return <p className="mt-6 text-center text-sm text-muted">Comprobando el enlace…</p>
  }

  if (checkError) {
    return (
      <>
        <h1 className="mt-4 text-center font-display text-3xl text-ink">
          Enlace no válido
        </h1>
        <p className="mt-3 text-center text-sm text-red-600">{checkError}</p>
        <Link
          to="/admin/recuperar"
          className="mt-6 block text-center text-sm font-medium text-sage-700 underline underline-offset-2"
        >
          Pedir un enlace nuevo
        </Link>
      </>
    )
  }

  if (status === 'sent') {
    return (
      <>
        <h1 className="mt-4 text-center font-display text-3xl text-ink">
          Clave actualizada
        </h1>
        <p className="mt-3 text-center text-sm text-muted">
          Ya puedes entrar al panel con tu clave nueva.
        </p>
        <Link
          to="/admin/login"
          className="mt-6 block w-full rounded-full bg-sage-500 py-2.5 text-center text-sm font-semibold text-white hover:bg-sage-600"
        >
          Ir al acceso
        </Link>
      </>
    )
  }

  return (
    <>
      <h1 className="mt-4 text-center font-display text-3xl text-ink">
        Nueva clave
      </h1>
      <p className="mt-2 text-center text-sm text-muted">
        Cuenta: <span className="font-medium text-ink">{accountEmail}</span>
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-ink">
          Clave nueva
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-sage-200 px-3 py-2 outline-none focus:border-sage-400"
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          Repite la clave
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={repeat}
            onChange={(e) => setRepeat(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-sage-200 px-3 py-2 outline-none focus:border-sage-400"
          />
        </label>
        {status === 'error' && error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        <button
          type="submit"
          disabled={status === 'sending'}
          className="w-full rounded-full bg-sage-500 py-2.5 text-sm font-semibold text-white hover:bg-sage-600 disabled:opacity-60"
        >
          {status === 'sending' ? 'Guardando…' : 'Guardar clave'}
        </button>
      </form>
    </>
  )
}
