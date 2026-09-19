import { useState } from 'react'
import { testimonials } from '../lib/content'
import Reveal from './ui/Reveal'
import { Star } from './ui/icons'

type Item = (typeof testimonials)[number]

function QuoteCard({ item }: { item: Item }) {
  return (
    <figure className="flex w-[22rem] shrink-0 flex-col rounded-3xl border border-white/70 bg-white/80 p-7 shadow-soft backdrop-blur-sm transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:shadow-lift sm:w-[25rem]">
      <div className="flex items-center gap-0.5 text-warm-500">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="size-3.5" />
        ))}
      </div>
      <blockquote className="mt-4 text-[1rem] leading-relaxed text-ink-700">{item.quote}</blockquote>
      <figcaption className="mt-6 flex items-center gap-3 border-t border-ink-200/40 pt-5">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-ink-900 to-brand-700 font-display text-sm font-extrabold text-sand-50">
          {item.name.charAt(0)}
        </span>
        <span>
          <span className="block font-display text-[0.95rem] font-bold text-ink-900">{item.name}</span>
          <span className="block text-[0.8rem] text-ink-500">{item.role}</span>
        </span>
      </figcaption>
    </figure>
  )
}

/** Kesintisiz kayan şerit; üzerine gelindiğinde yavaşlar. */
function Row({ items, reverse = false, duration }: { items: Item[]; reverse?: boolean; duration: number }) {
  const doubled = [...items, ...items]
  /* animation kısaltması satır içinde verildiği için duraklatma da satır içi olmalı */
  const [paused, setPaused] = useState(false)

  return (
    <div
      className="flex overflow-hidden py-3 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex w-max gap-5 motion-reduce:animate-none"
        style={{
          animation: `marquee ${duration}s linear infinite`,
          animationDirection: reverse ? 'reverse' : 'normal',
          animationPlayState: paused ? 'paused' : 'running',
        }}
      >
        {doubled.map((item, i) => (
          <QuoteCard key={`${item.name}-${i}`} item={item} />
        ))}
      </div>
    </div>
  )
}

export default function Testimonials() {
  const half = Math.ceil(testimonials.length / 2)

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
      </div>

      {/* Tam genişlikte, iki yönde kayan şerit */}
      <div className="mt-12 flex flex-col gap-1">
        <Row items={testimonials.slice(0, half)} duration={52} />
        <Row items={testimonials.slice(half)} duration={64} reverse />
      </div>

      <div className="section-shell mt-8">
        <p className="text-center text-[0.82rem] text-ink-500">
          Şeridin üzerine gelince durur — okumak istediğiniz yorumda bekleyin.
        </p>
      </div>
    </section>
  )
}
