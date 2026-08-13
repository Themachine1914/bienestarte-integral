import { Share2 } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="border-t border-sage-100 bg-sage-800 text-sage-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <img
            src="/brand/logo-seal.png"
            alt="Bienestarte Integral"
            className="mb-4 h-16 w-16 object-contain"
          />
          <p className="font-display text-2xl text-white">Bienestarte Integral</p>
          <p className="mt-2 text-sm text-sage-200">
            Orlandia Ortiz Almonte, M.A.
            <br />
            Psicoterapeuta Clínico Familiar · Psicotrauma
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-sage-300">
            Navegación
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/sobre-mi" className="hover:text-white">
                Sobre mí
              </Link>
            </li>
            <li>
              <Link to="/servicios" className="hover:text-white">
                Servicios
              </Link>
            </li>
            <li>
              <Link to="/agendar" className="hover:text-white">
                Agendar cita
              </Link>
            </li>
            <li>
              <Link to="/mis-citas" className="hover:text-white">
                Mis citas
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-sage-300">
            Contacto
          </p>
          <p className="mt-4 text-sm text-sage-200">
            CODOPSI 10-03029
            <br />
            Exequátur 417-24
          </p>
          <a
            href="https://www.instagram.com/bienestarteintegral"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm text-white hover:text-lavender-200"
          >
            <Share2 size={18} />
            @bienestarteintegral
          </a>
          <p className="mt-6 text-xs text-sage-300">
            Sesiones virtuales · Lunes, martes y miércoles
          </p>
        </div>
      </div>
      <div className="border-t border-sage-700/60 py-4 text-center text-xs text-sage-300">
        © {new Date().getFullYear()} Bienestarte Integral. Todos los derechos
        reservados.
      </div>
    </footer>
  )
}
