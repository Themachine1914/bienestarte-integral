import { Link } from 'react-router-dom'
import { Clock, Users, User, Video } from 'lucide-react'
import { formatCurrencyDop } from '../../lib/dates'
import { DEFAULT_SETTINGS } from '../../lib/defaults'

export function ServicesPage() {
  const sessions = DEFAULT_SETTINGS.sessionTypes

  return (
    <div>
      <section className="border-b border-sage-100 bg-gradient-to-b from-sage-50 to-cream-50 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-sage-600">
            Servicios
          </p>
          <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">
            Sesiones pensadas para ti
          </h1>
          <p className="mt-4 text-muted">
            Todas las citas son virtuales, de 50 minutos. Elige el formato que
            mejor se adapte a tu necesidad.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-8 md:grid-cols-2">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="border border-sage-100 bg-white p-8 shadow-sm"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sage-100 text-sage-600">
                {s.id === 'individual' ? <User size={22} /> : <Users size={22} />}
              </div>
              <h2 className="font-display text-3xl text-ink">{s.label}</h2>
              <p className="mt-2 text-2xl font-semibold text-sage-600">
                {formatCurrencyDop(s.priceDop)}
              </p>
              <ul className="mt-6 space-y-2 text-sm text-muted">
                <li className="flex items-center gap-2">
                  <Clock size={16} className="text-sage-400" />
                  {s.durationMinutes} minutos
                </li>
                <li className="flex items-center gap-2">
                  <Video size={16} className="text-sage-400" />
                  Modalidad virtual
                </li>
              </ul>
              <Link
                to="/agendar"
                state={{ sessionType: s.id }}
                className="mt-8 inline-flex rounded-full bg-sage-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sage-600"
              >
                Agendar esta sesión
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-14 border border-lavender-100 bg-lavender-50/50 p-8 text-center">
          <h3 className="font-display text-2xl text-ink">Cómo funciona</h3>
          <ol className="mx-auto mt-6 grid max-w-3xl gap-4 text-left text-sm text-muted sm:grid-cols-3">
            <li>
              <span className="font-semibold text-sage-600">01.</span> Eliges
              fecha y hora (lun–vie).
            </li>
            <li>
              <span className="font-semibold text-sage-600">02.</span> Realizas
              la transferencia y subes el comprobante.
            </li>
            <li>
              <span className="font-semibold text-sage-600">03.</span> Orlandia
              confirma tu cita tras revisar el pago.
            </li>
          </ol>
        </div>
      </section>
    </div>
  )
}
