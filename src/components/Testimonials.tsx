import { testimonials } from '../lib/content'
import Reveal from './ui/Reveal'
import InfiniteSpiral from './reactbits/InfiniteSpiral'
import { Star } from './ui/icons'

export default function Testimonials() {
  const items = testimonials.map((item, i) => ({
    id: i,
    label: `${item.name} — ${item.role}`,
    node: (
      <figure className="flex h-full w-full flex-col justify-between p-4">
        <div className="flex items-center gap-0.5 text-warm-500">
          {Array.from({ length: 5 }).map((_, s) => (
            <Star key={s} className="size-3" />
          ))}
        </div>
        <blockquote className="mt-2.5 line-clamp-4 text-[0.78rem] leading-snug text-ink-700">
          {item.quote}
        </blockquote>
        <figcaption className="mt-3 border-t border-ink-200/50 pt-3">
          <span className="block font-display text-[0.82rem] font-bold text-ink-900">{item.name}</span>
          <span className="block text-[0.72rem] text-ink-500">{item.role}</span>
        </figcaption>
      </figure>
    ),
  }))

  return (
    <section id="yorumlar" className="relative scroll-mt-28 overflow-hidden py-24 sm:py-28">
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
            <Reveal delay={0.12}>
              <p className="lead mt-5 max-w-lg">
                Sayfayı kaydırdıkça yorumlar spiral boyunca yukarı süzülür; okumak istediğiniz
                kartın üzerinde durabilir ya da sürükleyerek gezinebilirsiniz.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <div className="flex items-center gap-4 rounded-2xl border border-white/70 bg-white/76 px-5 py-4 shadow-soft backdrop-blur">
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

        <Reveal delay={0.12}>
          <div className="mt-10 h-[30rem] w-full sm:h-[38rem]">
            <InfiniteSpiral
              items={items}
              animationMode="all"
              direction="up"
              speed={0.5}
              radius={210}
              cardWidth={230}
              cardHeight={200}
              verticalSpacing={92}
              cardsPerTurn={6}
              cardTilt={6}
              cardRadius={20}
              centerScale={1.06}
              edgeFade={0.55}
              edgeBlur={1.5}
              pauseOnHover
            />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
