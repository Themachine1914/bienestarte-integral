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
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
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
   */
  const resetPassword = useCallback(async (email: string) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('No disponible sin conexión al servidor')
    }
    await sendPasswordResetEmail(auth, email.trim())
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
    }),
    [user, demoAdmin, loading, login, logout, resetPassword],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
