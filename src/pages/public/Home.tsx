import { Link } from 'react-router-dom'
import { ArrowRight, HeartHandshake, Users, Video } from 'lucide-react'

export function HomePage() {
  return (
    <div>
      {/* Hero: stacked on every breakpoint — photo, then copy */}
      <section className="bg-cream-50">
        <img
          src="/brand/orlandia-hero.jpg"
          alt="Orlandia Ortiz Almonte"
          className="block h-[46vh] min-h-[280px] w-full object-cover object-[42%_8%] md:h-[68vh] md:min-h-[520px]"
        />

        <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 md:max-w-2xl md:py-16">
          <img
            src="/brand/logo-seal.png"
            alt="Bienestarte Integral"
            className="fade-up mb-6 h-[4.25rem] w-[4.25rem] object-contain md:h-20 md:w-20"
          />
          <h1 className="fade-up-delay font-display text-4xl leading-[1.1] text-ink sm:text-5xl lg:text-[3.25rem] text-balance">
            Un espacio seguro para sanar, comprender y crecer
          </h1>
          <p className="fade-up-delay-2 mt-5 text-base text-muted sm:text-lg">
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
              className="inline-flex items-center rounded-full border border-sage-300 bg-white px-6 py-3 text-sm font-medium text-sage-700 hover:bg-cream-100"
            >
              Conocer a Orlandia
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-sage-100 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-3">
          {[
            {
              icon: Video,
              title: '100 % virtual',
              text: 'Atención profesional, cercana y confidencial.',
            },
            {
              icon: Users,
              title: 'Psicoterapia',
              text: 'Sesiones individuales, de pareja y familia.',
            },
            {
              icon: HeartHandshake,
              title: 'Atención especializada',
              text: 'Trauma complejo y rehabilitación en diagnósticos clínicos y psiquiátricos.',
            },
          ].map((item) => (
            <div key={item.title} className="text-center">
              <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-sage-100 text-sage-600">
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
          Citas virtuales lunes, martes y miércoles. Confirmación manual tras
          revisar tu comprobante de pago.
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
