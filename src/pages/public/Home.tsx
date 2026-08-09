import { Link } from 'react-router-dom'
import { ArrowRight, HeartHandshake, Video } from 'lucide-react'

export function HomePage() {
  return (
    <div>
      {/* Hero — full-bleed, brand first */}
      <section className="relative min-h-[92vh] overflow-hidden">
        <img
          src="/brand/orlandia-hero.jpg"
          alt="Orlandia Ortiz Almonte"
          className="absolute inset-0 h-full w-full object-cover object-[center_20%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-cream-50/95 via-cream-50/80 to-cream-50/20 sm:via-cream-50/70" />
        <div className="relative mx-auto flex min-h-[92vh] max-w-6xl flex-col justify-center px-4 py-20 sm:px-6">
          <div className="max-w-xl">
            <img
              src="/brand/logo-horizontal.jpg"
              alt="Bienestarte Integral"
              className="fade-up mb-8 h-16 w-auto object-contain sm:h-20"
            />
            <h1 className="fade-up-delay font-display text-4xl leading-[1.1] text-ink sm:text-5xl lg:text-6xl text-balance">
              Un espacio seguro para sanar, comprender y crecer
            </h1>
            <p className="fade-up-delay-2 mt-5 max-w-md text-base text-muted sm:text-lg">
              Psicoterapia clínica y familiar con enfoque en trauma, apego y
              bienestar integral. Sesiones virtuales, con calidez y rigor
              profesional.
            </p>
            <div className="fade-up-delay-2 mt-8 flex flex-wrap gap-3">
              <Link
                to="/agendar"
                className="inline-flex items-center gap-2 rounded-full bg-sage-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sage-600"
              >
                Agendar cita
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/sobre-mi"
                className="inline-flex items-center rounded-full border border-sage-300 bg-white/70 px-6 py-3 text-sm font-medium text-sage-700 backdrop-blur hover:bg-white"
              >
                Conocer a Orlandia
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-sage-100 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-3">
          {[
            {
              icon: Video,
              title: '100% virtual',
              text: 'Atiende desde donde te sientas más cómoda o cómodo, con confidencialidad.',
            },
            {
              icon: HeartHandshake,
              title: 'Enfoque integral',
              text: 'Trauma, apego, familia y salud mental con formación especializada.',
            },
            {
              icon: ArrowRight,
              title: 'Proceso claro',
              text: 'Agenda, paga por transferencia y recibe confirmación personal.',
            },
          ].map((item) => (
            <div key={item.title} className="text-center md:text-left">
              <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-sage-100 text-sage-600 md:mx-0">
                <item.icon size={20} />
              </div>
              <h2 className="font-display text-2xl text-ink">{item.title}</h2>
              <p className="mt-2 text-sm text-muted leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sage-50 via-cream-50 to-lavender-50" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-sage-600">
              Orlandia Ortiz Almonte, M.A.
            </p>
            <h2 className="mt-2 font-display text-4xl text-ink sm:text-5xl">
              Psicoterapeuta clínico familiar
            </h2>
            <p className="mt-4 text-muted leading-relaxed">
              CODOPSI 10-03029 · Exequátur 417-24. Más de 18 años acompañando
              procesos de rehabilitación, trauma y bienestar emocional.
            </p>
            <Link
              to="/sobre-mi"
              className="mt-6 inline-flex text-sm font-semibold text-sage-600 hover:text-sage-700"
            >
              Ver trayectoria completa →
            </Link>
          </div>
          <img
            src="/brand/orlandia-about.jpg"
            alt="Orlandia en consulta"
            className="w-full max-h-[480px] object-cover object-top"
          />
        </div>
      </section>

      <section className="bg-sage-700 px-4 py-16 text-center text-white sm:px-6">
        <h2 className="font-display text-3xl sm:text-4xl">
          Da el primer paso hacia tu bienestar
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sage-100">
          Citas virtuales de lunes a viernes. Confirmación manual tras revisar
          tu comprobante de pago.
        </p>
        <Link
          to="/agendar"
          className="mt-8 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-sage-700 hover:bg-cream-100"
        >
          Agendar ahora
        </Link>
      </section>
    </div>
  )
}
