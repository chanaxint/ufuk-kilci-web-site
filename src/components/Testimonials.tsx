import { useEffect, useRef, useState } from 'react'
import { testimonials } from '../lib/content'
import Reveal from './ui/Reveal'
import { Star } from './ui/icons'

/**
 * Kâğıtların yere düştüğü noktalar (sahnenin yüzdesi) ve yattıkları açı.
 * Elle dağıtıldı: üst üste binen ama yazısı okunan, rastgele atılmış bir
 * deste hissi verecek şekilde.
 */
type Spot = { x: number; y: number; r: number }

/* Üst sıra sabit başlığın altından başlıyor (≈%11), en alt kâğıt ekranda kalıyor */
const WIDE: Spot[] = [
  { x: 4, y: 12, r: -6 },
  { x: 58, y: 10, r: 5 },
  { x: 31, y: 27, r: 2.5 },
  { x: 74, y: 33, r: -4.5 },
  { x: 2, y: 46, r: 4 },
  { x: 42, y: 51, r: -3 },
  { x: 70, y: 62, r: 7 },
  { x: 16, y: 68, r: -7 },
]

/*
 * Dar ekranda aynı anda üç kâğıt sığıyor. Sekizi birden inince yazılar
 * birbirinin altında kalıyordu; bu yüzden mobilde kâğıtlar üçlü dalgalar
 * hâlinde geliyor: ilk üçü yere iner, dördüncü düşerken ilki yerini ona
 * bırakır.
 */
const NARROW: Spot[] = [
  { x: 2, y: 9, r: -5 },
  { x: 12, y: 39, r: 4 },
  { x: 4, y: 68, r: 6 },
]

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
/* Düşüşün sonunda hafif bir oturma: yere çarpıp yerine yatıyor */
const settle = (t: number) => 1 - Math.pow(1 - t, 3)

/** Kâğıtların hepsi bu ilerlemeye kadar yere inmiş oluyor */
const LAST = 0.86
const DROP = 0.2

export default function Testimonials() {
  const pinRef = useRef<HTMLDivElement>(null)
  const paperRefs = useRef<(HTMLElement | null)[]>([])
  const [narrow, setNarrow] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const apply = () => setNarrow(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  /*
   * Kaydırma kâğıtları tek tek yere indiriyor. React render'ı yok: her
   * kâğıdın dönüşümü doğrudan yazılıyor, bu yüzden 8 kâğıt aynı anda
   * hareket etse de kare düşmüyor.
   */
  useEffect(() => {
    const el = pinRef.current
    if (!el) return
    let raf = 0

    const draw = () => {
      raf = 0
      const travel = el.offsetHeight - window.innerHeight
      if (travel <= 0) return
      const p = clamp01(-el.getBoundingClientRect().top / travel)
      const step = LAST / testimonials.length
      const group = (narrow ? NARROW : WIDE).length

      paperRefs.current.forEach((node, i) => {
        if (!node) return
        const t = settle(clamp01((p - i * step) / DROP))
        /*
         * Yerinde bir sonraki dalga varsa (mobil), ardılı düşerken bu kâğıt
         * yerini ona bırakıyor: hafifçe aşağı kayıp siliniyor.
         */
        const next = i + group
        const leave =
          next < testimonials.length
            ? settle(clamp01((p - next * step) / (DROP * 0.7)))
            : 0
        /* Havadayken kadranın üstünde, eğik ve biraz büyük; sonra yere iniyor */
        const lift = -(1 - t) * 74 + leave * 9
        const spin = (1 - t) * -16 + leave * 6
        const scale = 1 + (1 - t) * 0.07 - leave * 0.06
        node.style.transform = `translate3d(0, ${lift.toFixed(2)}vh, 0) rotate(${(node.dataset.rot ? +node.dataset.rot : 0) + spin}deg) scale(${scale.toFixed(3)})`
        node.style.opacity = (clamp01(t * 6) * (1 - leave)).toFixed(3)
        node.style.zIndex = String(10 + i)
        /* Gölge yere yaklaştıkça toplanıyor */
        const spread = 10 + (1 - t) * 44
        const drop = 8 + (1 - t) * 40
        node.style.boxShadow = `0 ${drop.toFixed(0)}px ${spread.toFixed(0)}px -${(spread * 0.55).toFixed(0)}px rgb(12 7 3 / ${(0.85 - (1 - t) * 0.3).toFixed(2)})`
      })
    }

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(draw)
    }
    draw()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [narrow])

  const spots = narrow ? NARROW : WIDE

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
                Bu bölümde sayfa bir süre yerinde kalır: kaydırdıkça yorumlar birer kâğıt gibi
                yere düşer, hepsi zemine yayılınca sayfa kaldığı yerden akmaya devam eder.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <div className="flex items-center gap-4 border-l border-ivory-100/20 pl-5">
              <span className="font-display text-3xl font-extrabold text-ivory-50">4.9</span>
              <span>
                <span className="flex items-center gap-0.5 text-warm-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3.5" />
                  ))}
                </span>
                <span className="mt-1 block text-[0.78rem] text-ivory-300">120+ değerlendirme</span>
              </span>
            </div>
          </Reveal>
        </div>
      </div>

      {/*
        Sarmalayıcı alan viewport'tan uzun, içerideki katman yapışkan: sayfa
        burada bir süre yerinde kalıyor ve kaydırma yalnızca kâğıtları
        indiriyor. Kâğıtlar kabuğun dışında, tam genişlikte duruyor.
      */}
      <div ref={pinRef} className="relative mt-8 h-[300vh] sm:mt-12 sm:h-[340vh]">
        <div className="sticky top-0 h-[100svh] overflow-hidden">
          <div className="relative mx-auto h-full w-full max-w-[86rem] px-4 sm:px-8">
            {testimonials.map((item, i) => {
              const spot = spots[i % spots.length]
              return (
                <figure
                  key={item.name}
                  ref={(node) => {
                    paperRefs.current[i] = node
                  }}
                  data-rot={spot.r}
                  style={{
                    left: `${spot.x}%`,
                    top: `${spot.y}%`,
                    transformOrigin: '50% 40%',
                    opacity: 0,
                    background:
                      'linear-gradient(158deg, #fbf6ea 0%, #f4ecdc 54%, #ece2cf 100%)',
                  }}
                  className="absolute w-[15.5rem] rounded-[3px] px-5 py-4 will-change-[transform,opacity] sm:w-[18rem] lg:w-[19.5rem]"
                >
                  {/* Kâğıdın üst kenarındaki hafif kıvrım ışığı */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-6 rounded-t-[3px]"
                    style={{
                      background: 'linear-gradient(180deg, rgb(255 255 255 / 0.65), transparent)',
                    }}
                  />

                  <div className="flex items-center gap-0.5 text-warm-500">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} className="size-3.5" />
                    ))}
                  </div>

                  <blockquote className="mt-2.5 text-[0.88rem] leading-relaxed text-ink-700">
                    {item.quote}
                  </blockquote>

                  <figcaption className="mt-3.5 flex items-baseline gap-2 border-t border-ink-700/15 pt-2.5">
                    <span className="font-wordmark text-[1.15rem] leading-none text-ink-900">
                      {item.name}
                    </span>
                    <span className="text-[0.74rem] text-ink-500">{item.role}</span>
                  </figcaption>
                </figure>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
