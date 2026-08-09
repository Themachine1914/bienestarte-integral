import { EDUCATION, EXPERIENCE } from '../../lib/defaults'
import { Award, GraduationCap, Briefcase } from 'lucide-react'

export function AboutPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-sage-100">
        <div className="absolute inset-0 bg-gradient-to-br from-cream-100 via-sage-50 to-lavender-50" />
        <div className="relative mx-auto grid max-w-6xl items-end gap-10 px-4 pt-14 pb-0 sm:px-6 lg:grid-cols-2">
          <div className="pb-14">
            <p className="text-sm font-medium uppercase tracking-wider text-sage-600">
              Sobre mí
            </p>
            <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">
              Orlandia Ortiz Almonte, M.A.
            </h1>
            <p className="mt-3 text-lg text-muted">
              Psicoterapeuta Clínico Familiar · Psicotrauma
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sage-200 bg-white px-3 py-1.5 text-sage-700">
                <Award size={14} /> CODOPSI 10-03029
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-lavender-200 bg-white px-3 py-1.5 text-lavender-700">
                <Award size={14} /> Exequátur 417-24
              </span>
            </div>
            <p className="mt-6 max-w-lg text-muted leading-relaxed">
              Fundadora de Bienestarte Integral. Acompaño procesos de sanación
              emocional con una mirada integral que integra neurobiología,
              trauma, apego y terapia familiar — siempre desde un espacio de
              respeto y confidencialidad.
            </p>
          </div>
          <img
            src="/brand/orlandia-sofa.jpg"
            alt="Orlandia Ortiz Almonte"
            className="w-full max-h-[520px] object-cover object-top"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-center gap-3 mb-8">
          <GraduationCap className="text-sage-500" />
          <h2 className="font-display text-3xl text-ink">Formación</h2>
        </div>
        <ul className="space-y-3">
          {EDUCATION.map((item) => (
            <li
              key={item}
              className="border-l-2 border-sage-300 pl-4 text-sm text-muted leading-relaxed"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white border-y border-sage-100">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex items-center gap-3 mb-8">
            <Briefcase className="text-lavender-500" />
            <h2 className="font-display text-3xl text-ink">
              Experiencia laboral
            </h2>
          </div>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            <ul className="space-y-3">
              {EXPERIENCE.map((item) => (
                <li
                  key={item}
                  className="border-l-2 border-lavender-300 pl-4 text-sm text-muted leading-relaxed"
                >
                  {item}
                </li>
              ))}
            </ul>
            <img
              src="/brand/orlandia-desk.jpg"
              alt="Consulta profesional"
              className="w-full object-cover max-h-[420px]"
            />
          </div>
        </div>
      </section>
    </div>
  )
}
