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
    <header className="sticky top-0 z-50 border-b border-sage-100/80 bg-cream-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" onClick={() => setOpen(false)} className="shrink-0">
          <img
            src="/brand/logo-seal.png"
            alt="Bienestarte Integral"
            className="h-16 w-16 object-contain sm:h-[4.25rem] sm:w-[4.25rem]"
          />
        </Link>

        <button
          type="button"
          className="rounded-md p-2 text-ink hover:bg-sage-50"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-sage-100 bg-cream-50 px-4 py-4 sm:px-6">
          <div className="mx-auto max-w-6xl space-y-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2.5 text-sm ${
                    isActive
                      ? 'bg-sage-100 font-medium text-sage-700'
                      : 'text-ink hover:bg-sage-50'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}
