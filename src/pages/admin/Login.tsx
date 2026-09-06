import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { authErrorMessage } from '../../lib/authErrors'

export function LoginPage() {
  const { login, isAdmin, loading, isDemoMode } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: { pathname: string } } | null)?.from
      ?.pathname || '/admin'

  const params = new URLSearchParams(location.search)
  const oobCode = params.get('oobCode')
  const mode = params.get('mode')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (oobCode && mode === 'resetPassword') {
    return <Navigate to={`/admin/recuperar?${params.toString()}`} replace />
  }

  if (!loading && isAdmin) {
    return <Navigate to="/admin" replace />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await login(email, password)
      toast.success('Bienvenida')
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(
        authErrorMessage(
          err,
          err instanceof Error ? err.message : 'Error al iniciar sesión',
        ),
      )
    } finally {
      setSubmitting(false)
    }
  }

  const recoverTo = email.trim()
    ? `/admin/recuperar?email=${encodeURIComponent(email.trim())}`
    : '/admin/recuperar'

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cream-100 via-sage-50 to-lavender-50 px-4">
      <Toaster position="top-center" />
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md border border-sage-100 bg-white p-8 shadow-sm"
      >
        <img
          src="/brand/logo-seal.jpg"
          alt=""
          className="mx-auto h-16 w-16 rounded-full object-cover"
        />
        <h1 className="mt-4 text-center font-display text-3xl text-ink">
          Acceso admin
        </h1>
        <p className="mt-1 text-center text-sm text-muted">
          Bienestarte Integral
        </p>

        {isDemoMode && (
          <p className="mt-4 rounded-lg bg-lavender-50 px-3 py-2 text-xs text-lavender-700">
            Modo demo (sin Firebase). Requiere{' '}
            <code>VITE_DEMO_ADMIN_EMAIL</code> y{' '}
            <code>VITE_DEMO_ADMIN_PASSWORD</code> en tu <code>.env</code>.
          </p>
        )}

        <label className="mt-6 block text-sm font-medium text-ink">
          Email
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-sage-200 px-3 py-2 outline-none focus:border-sage-400"
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-ink">
          Contraseña
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-sage-200 px-3 py-2 outline-none focus:border-sage-400"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-full bg-sage-500 py-2.5 text-sm font-semibold text-white hover:bg-sage-600 disabled:opacity-60"
        >
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>

        <Link
          to={recoverTo}
          className="mt-4 block w-full text-center text-xs text-muted underline underline-offset-2 hover:text-sage-700"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </form>
    </div>
  )
}
