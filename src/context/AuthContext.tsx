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
}

const AuthContext = createContext<AuthContextValue | null>(null)

const DEMO_EMAIL =
  import.meta.env.VITE_DEMO_ADMIN_EMAIL || 'admin@bienestarteintegral.com'
const DEMO_PASSWORD =
  import.meta.env.VITE_DEMO_ADMIN_PASSWORD || 'bienestarte2026'

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
    }),
    [user, demoAdmin, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
