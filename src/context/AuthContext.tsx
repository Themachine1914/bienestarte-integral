import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  confirmPasswordReset,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  verifyPasswordResetCode,
  type User,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../lib/firebase'
import { localDb } from '../services/localDb'

interface AuthContextValue {
  user: User | null
  isAdmin: boolean
  loading: boolean
  isDemoMode: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  verifyResetCode: (oobCode: string) => Promise<string>
  confirmReset: (oobCode: string, newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Offline credentials for developing without Firebase. Both have to be set on
 * purpose: there is no built-in fallback password, so a build that loses its
 * Firebase config refuses every login instead of accepting a well-known one.
 */
const DEMO_EMAIL = import.meta.env.VITE_DEMO_ADMIN_EMAIL
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_ADMIN_PASSWORD

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [demoAdmin, setDemoAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setDemoAdmin(localDb.getAdminSession())
      setLoading(false)
      return
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    if (!isFirebaseConfigured || !auth) {
      if (!DEMO_EMAIL || !DEMO_PASSWORD) {
        throw new Error(
          'No hay conexión con el servidor. Espera un momento y vuelve a intentarlo.',
        )
      }
      if (
        email.trim().toLowerCase() === DEMO_EMAIL.toLowerCase() &&
        password === DEMO_PASSWORD
      ) {
        localDb.setAdminSession(true)
        setDemoAdmin(true)
        return
      }
      throw new Error('Credenciales incorrectas (modo demo)')
    }
    await signInWithEmailAndPassword(auth, email.trim(), password)
  }, [])

  /**
   * The only way back in. There is no second admin account and no password
   * kept anywhere, so without this she would need someone with console access
   * to rescue her.
   *
   * Prefer the server route: it sets the Spanish locale and can send a second
   * branded copy. The client SDK is the fallback on `npm run dev`, where
   * `/api` is not served.
   */
  const resetPassword = useCallback(async (email: string) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('No disponible sin conexión al servidor')
    }
    const trimmed = email.trim()
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })
      if (res.ok) return
      const data = (await res.json().catch(() => null)) as {
        error?: string
      } | null
      if (data?.error === 'invalid_email') {
        throw Object.assign(new Error('invalid_email'), {
          code: 'auth/invalid-email',
        })
      }
      if (data?.error === 'too_many') {
        throw Object.assign(new Error('too_many'), {
          code: 'auth/too-many-requests',
        })
      }
      // 404 on Vite, or a cold function: use the client SDK instead.
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        typeof (error as { code: unknown }).code === 'string' &&
        String((error as { code: string }).code).startsWith('auth/')
      ) {
        throw error
      }
      // Network / 404 on the Vite dev server.
    }
    await sendPasswordResetEmail(auth, trimmed)
  }, [])

  const verifyResetCode = useCallback(async (oobCode: string) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('No disponible sin conexión al servidor')
    }
    return verifyPasswordResetCode(auth, oobCode)
  }, [])

  const confirmReset = useCallback(async (oobCode: string, newPassword: string) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('No disponible sin conexión al servidor')
    }
    await confirmPasswordReset(auth, oobCode, newPassword)
  }, [])

  const logout = useCallback(async () => {
    if (!isFirebaseConfigured || !auth) {
      localDb.setAdminSession(false)
      setDemoAdmin(false)
      return
    }
    await signOut(auth)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAdmin: Boolean(user) || demoAdmin,
      loading,
      isDemoMode: !isFirebaseConfigured,
      login,
      logout,
      resetPassword,
      verifyResetCode,
      confirmReset,
    }),
    [
      user,
      demoAdmin,
      loading,
      login,
      logout,
      resetPassword,
      verifyResetCode,
      confirmReset,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
