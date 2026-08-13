import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

const links = [
  { to: '/', label: 'Inicio' },
  { to: '/sobre-mi', label: 'Sobre mí' },
  { to: '/servicios', label: 'Servicios' },
  { to: '/agendar', label: 'Agendar cita' },
  { to: '/mis-citas', label: 'Mis citas' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-sage-100/80 bg-cream-50/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-3 shrink-0"
          onClick={() => setOpen(false)}
        >
          <img
            src="/brand/logo-seal.png"
            alt="Bienestarte Integral"
            className="h-11 w-11 object-contain"
          />
          <div className="leading-tight">
            <p className="font-display text-lg sm:text-xl text-sage-600 tracking-wide">
              BIENESTARTE <span className="italic text-ink">Integral</span>
            </p>
            <p className="text-[11px] text-muted hidden sm:block">Psicoterapia · Salud Mental</p>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `px-3 py-2 text-sm rounded-lg transition ${
                  isActive
                    ? 'text-sage-700 bg-sage-100 font-medium'
                    : 'text-muted hover:text-ink hover:bg-sage-50'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <Link
            to="/agendar"
            className="ml-2 inline-flex items-center rounded-full bg-sage-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sage-600"
          >
            Agendar cita
          </Link>
        </nav>

        <button
          type="button"
          className="lg:hidden rounded-lg p-2 text-ink hover:bg-sage-50"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-sage-100 bg-cream-50 px-4 py-4 space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2.5 text-sm ${
                  isActive
                    ? 'bg-sage-100 text-sage-700 font-medium'
                    : 'text-ink'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  )
}
