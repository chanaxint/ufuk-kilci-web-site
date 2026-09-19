import { services } from '../lib/content'
import Reveal from './ui/Reveal'
import SpotlightCard from './ui/SpotlightCard'
import { ArrowRight, Check } from './ui/icons'

const accents = {
  brand: { glow: '188 220 250', chip: 'bg-brand-100 text-brand-700', dot: 'bg-brand-500' },
  vital: { glow: '212 243 236', chip: 'bg-vital-100 text-vital-700', dot: 'bg-vital-500' },
  warm: { glow: '251 238 218', chip: 'bg-warm-100 text-warm-600', dot: 'bg-warm-500' },
} as const

export default function Services() {
  return (
    <section id="tedaviler" className="relative scroll-mt-28 py-24 sm:py-28">
      <div className="section-shell">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <Reveal>
              <span className="eyebrow">Tedavi Alanları</span>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="title-lg mt-6">
                Şikâyete değil, <span className="gradient-text">kaynağa</span> yönelen programlar.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.12}>
            <p className="max-w-sm text-[1rem] leading-relaxed text-ink-500">
              Her program detaylı değerlendirmeyle başlar; teknikler ve seans sıklığı kişiye göre
              belirlenir.
            </p>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => {
            const accent = accents[service.accent]
            return (
              <Reveal key={service.id} delay={0.06 * i}>
                <SpotlightCard glow={accent.glow} className="h-full">
                  <div className="flex h-full flex-col p-7">
                    <div className="flex items-start justify-between">
                      <span
                        className={`grid size-11 place-items-center rounded-2xl font-display text-sm font-extrabold ${accent.chip}`}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <ArrowRight className="size-5 text-ink-200 transition-all duration-500 group-hover:translate-x-1 group-hover:text-brand-600" />
                    </div>

                    <h3 className="mt-6 font-display text-xl font-extrabold tracking-[-0.01em] text-ink-900">
                      {service.title}
                    </h3>
                    <p className="mt-3 text-[0.94rem] leading-relaxed text-ink-600">
                      {service.description}
                    </p>

                    <ul className="mt-5 flex flex-col gap-2 border-t border-ink-200/40 pt-5">
                      {service.points.map((point) => (
                        <li key={point} className="flex items-center gap-2.5 text-[0.86rem] text-ink-600">
                          <span className={`size-1.5 rounded-full ${accent.dot}`} />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </SpotlightCard>
              </Reveal>
            )
          })}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-5 rounded-3xl border border-white/70 bg-gradient-to-r from-ink-900 to-brand-700 px-7 py-7 shadow-lift sm:px-9">
            <div className="max-w-lg">
              <p className="font-display text-xl font-extrabold text-sand-50 sm:text-2xl">
                Hangi programın size uyduğundan emin değil misiniz?
              </p>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-brand-100">
                Kısa bir ön görüşmede şikâyetinizi dinleyip doğru başlangıç noktasını birlikte
                belirleyelim.
              </p>
            </div>
            <a
              href="#iletisim"
              className="group inline-flex items-center gap-2 rounded-full bg-sand-50 px-6 py-3.5 font-display text-[0.95rem] font-bold text-ink-900 transition-transform duration-300 hover:-translate-y-0.5"
            >
              <Check className="size-4 text-vital-600" />
              Ön görüşme talep et
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
