import { testimonials } from '../lib/content'
import Reveal from './ui/Reveal'
import InfiniteSpiral from './reactbits/InfiniteSpiral'
import { Star } from './ui/icons'

export default function Testimonials() {
  const items = testimonials.map((item, i) => ({
    id: i,
    label: `${item.name} — ${item.role}`,
    node: (
      <figure className="flex h-full w-full flex-col justify-between p-5">
        <div className="flex items-center gap-0.5 text-warm-500">
          {Array.from({ length: 5 }).map((_, s) => (
            <Star key={s} className="size-3.5" />
          ))}
        </div>
        <blockquote className="mt-3 line-clamp-6 text-[0.86rem] leading-relaxed text-ink-700">
          {item.quote}
        </blockquote>
        <figcaption className="mt-4 border-t border-ink-200/50 pt-3">
          <span className="block font-display text-[0.9rem] font-bold text-ink-900">{item.name}</span>
          <span className="block text-[0.78rem] text-ink-500">{item.role}</span>
        </figcaption>
      </figure>
    ),
  }))

  return (
    <section id="yorumlar" className="relative scroll-mt-28 pt-24 pb-16 sm:pt-28">
      <div className="section-shell">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <Reveal>
              <h2 className="title-lg">
                Sonucu en iyi <span className="gradient-text">onlar</span> anlatır.
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="lead mt-5 max-w-lg">
                Sayfayı kaydırdıkça yorumlar spiral boyunca yukarı süzülür; durduğunuzda spiral de
                durur, okumak istediğiniz kart karşınızda kalır.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <div className="flex items-center gap-4 border-l border-ink-200/60 pl-5">
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

      {/*
        Spiral bilerek kabuğun dışında: tam genişlikte akıp ekranın kenarlarından
        çıkıyor.

        Sarmalayıcı alan viewport'tan uzun ve içerideki katman yapışkan: bu
        bölümde sayfa bir süre yerinde kalıyor, kaydırma yalnızca yorumları
        döndürüyor. Yükseklik, birkaç yorum okunacak kadar (yaklaşık bir ekran
        boyu kaydırma) seçildi; sonra sayfa normal akışına dönüyor.
      */}
      <div className="relative mt-6 h-[200vh] sm:mt-10">
        <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
          <div className="h-[32rem] w-full sm:h-[40rem] lg:h-[46rem]">
            <InfiniteSpiral
              items={items}
              animationMode="scroll"
              /* Duraklama boyunca dört kadar yorum merkezden geçsin: okunacak kadar yavaş */
              speed={0.7}
              radius={560}
              perspective={1800}
              cardWidth={264}
              cardHeight={272}
              verticalSpacing={142}
              cardsPerTurn={6}
              cardTilt={5}
              cardRadius={22}
              centerScale={1.04}
              edgeFade={0.42}
              edgeBlur={1.6}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
