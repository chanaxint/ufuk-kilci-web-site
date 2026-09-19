import { testimonials } from '../lib/content'
import Reveal from './ui/Reveal'
import SpotlightCard from './ui/SpotlightCard'
import { Star } from './ui/icons'

export default function Testimonials() {
  return (
    <section id="yorumlar" className="relative scroll-mt-28 py-24 sm:py-28">
      <div className="section-shell">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <Reveal>
              <span className="eyebrow">Hasta Deneyimleri</span>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="title-lg mt-6">
                Sonucu en iyi <span className="gradient-text">onlar</span> anlatır.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <div className="flex items-center gap-4 rounded-2xl border border-white/70 bg-white/75 px-5 py-4 shadow-soft backdrop-blur">
              <span className="font-display text-3xl font-extrabold text-ink-900">4.9</span>
              <span>
                <span className="flex items-center gap-0.5 text-warm-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3.5" />
                  ))}
                </span>
                <span className="mt-1 block text-[0.78rem] text-ink-500">120+ değerlendirme</span>
              </span>
            </div>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {testimonials.map((item, i) => (
            <Reveal key={item.name} delay={i * 0.07}>
              <SpotlightCard className="h-full" glow={i % 2 ? '212 243 236' : '188 220 250'}>
                <figure className="flex h-full flex-col p-7 sm:p-8">
                  <span
                    aria-hidden
                    className="font-display text-5xl leading-none font-extrabold text-brand-200"
                  >
                    &ldquo;
                  </span>
                  <blockquote className="mt-2 text-[1.02rem] leading-relaxed text-ink-700">
                    {item.quote}
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 border-t border-ink-200/40 pt-5">
                    <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-ink-900 to-brand-700 font-display text-sm font-extrabold text-sand-50">
                      {item.name.charAt(0)}
                    </span>
                    <span>
                      <span className="block font-display text-[0.95rem] font-bold text-ink-900">
                        {item.name}
                      </span>
                      <span className="block text-[0.8rem] text-ink-500">{item.role}</span>
                    </span>
                  </figcaption>
                </figure>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
