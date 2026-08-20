import { Link } from 'react-router-dom'
import { ArrowRight, HeartHandshake, Users, Video } from 'lucide-react'

export function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <img
          src="/brand/orlandia-hero.jpg"
          alt="Orlandia Ortiz Almonte"
          className="absolute inset-0 h-full w-full object-cover object-[38%_14%] md:object-[42%_16%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cream-50/70 via-cream-50/20 to-transparent md:bg-gradient-to-l md:from-cream-50/50 md:via-cream-50/18 md:to-transparent" />

        <div className="relative mx-auto flex min-h-[calc(100svh-4.5rem)] max-w-6xl items-end px-4 pb-10 pt-16 sm:px-6 md:min-h-[calc(100svh-5rem)] md:items-center md:py-20">
          <div className="max-w-md fade-up md:ml-auto md:max-w-lg">
            <h1 className="font-display text-[2.15rem] leading-[1.12] text-ink sm:text-5xl lg:text-[3.35rem]">
              <span className="block">Comprender tu historia.</span>
              <span className="block">Regular tu presente.</span>
              <span className="block">Construir bienestar.</span>
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-ink/80 sm:text-base">
              Psicoterapia individual, de pareja y familia, con atención
              especializada en trauma complejo y salud mental.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/agendar"
                className="inline-flex items-center gap-2 rounded-full bg-sage-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sage-600"
              >
                Agendar consulta
                <ArrowRight size={15} />
              </Link>
              <Link
                to="/sobre-mi"
                className="inline-flex items-center rounded-full border border-sage-600/40 bg-transparent px-5 py-2.5 text-sm font-medium text-sage-700 transition hover:bg-cream-50/50"
              >
                Sobre mí
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
