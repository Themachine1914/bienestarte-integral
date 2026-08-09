import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  Clock,
} from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/citas', label: 'Citas', icon: ClipboardList },
  { to: '/admin/pacientes', label: 'Pacientes', icon: Users },
  { to: '/admin/disponibilidad', label: 'Disponibilidad', icon: Clock },
  { to: '/admin/configuracion', label: 'Configuración', icon: Settings },
]

export function AdminLayout() {
  const { logout, isDemoMode } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-cream-100 lg:flex">
      <aside className="border-b border-sage-100 bg-white lg:w-64 lg:border-b-0 lg:border-r lg:min-h-screen">
        <div className="flex items-center gap-3 px-5 py-5">
          <img
            src="/brand/logo-seal.jpg"
            alt=""
            className="h-10 w-10 rounded-full object-cover"
          />
          <div>
            <p className="font-display text-lg text-sage-700 leading-tight">
              Bienestarte
            </p>
            <p className="text-xs text-muted">Panel administrativo</p>
          </div>
        </div>
        {isDemoMode && (
          <p className="mx-4 mb-3 rounded-lg bg-lavender-50 px-3 py-2 text-xs text-lavender-700 border border-lavender-100">
            Modo demo (sin Firebase). Datos en este navegador.
          </p>
        )}
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm transition ${
                  isActive
                    ? 'bg-sage-100 text-sage-800 font-medium'
                    : 'text-muted hover:bg-sage-50 hover:text-ink'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden lg:block px-3 pb-6 mt-auto">
          <NavLink
            to="/"
            className="mb-2 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-sage-50"
          >
            <CalendarDays size={18} />
            Ver sitio público
          </NavLink>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1">
        <div className="flex items-center justify-end gap-3 border-b border-sage-100 bg-white px-4 py-3 lg:hidden">
          <NavLink to="/" className="text-sm text-muted">
            Sitio
          </NavLink>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-red-600"
          >
            Salir
          </button>
        </div>
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </div>
      <Toaster position="top-center" />
    </div>
  )
}
