import { useEffect, useRef, useState } from 'react'
import { useContent } from '../lib/ContentContext'
import { LIMITS } from '../lib/siteContent'
import { yorumlarGorunur } from '../lib/gorunurluk'
import Reveal from './ui/Reveal'
import { Emphasis } from './ui/RichText'
import { Star } from './ui/icons'
import { EditChip } from './CustomBlock'

/**
 * Kâğıtların yere düştüğü noktalar (sahnenin yüzdesi) ve yattıkları açı.
 * Elle dağıtıldı: üst üste binen ama yazısı okunan, rastgele atılmış bir
 * deste hissi verecek şekilde.
 */
type Spot = { x: number; y: number; r: number; /** sağ kenardan ölçülür */ right?: boolean }

/*
 * Kâğıtlar birbirinin kopyası olmasın: her biri biraz farklı sararmış,
 * lekeleri başka yerde. Sayılar sabit — her açılışta aynı kâğıt aynı
 * görünüyor, rastgelelik yalnızca bakışta.
 */
const AGED = [
  { tone: '#ecdfc4', stain: '18% 22%', stain2: '82% 78%', crease: 118 },
  { tone: '#efe3cb', stain: '76% 18%', stain2: '22% 82%', crease: 64 },
  { tone: '#e8dabd', stain: '30% 78%', stain2: '70% 26%', crease: 141 },
  { tone: '#f0e5cf', stain: '84% 62%', stain2: '14% 30%', crease: 97 },
  { tone: '#e9dcc0', stain: '24% 34%', stain2: '78% 70%', crease: 126 },
  { tone: '#eee2c8', stain: '68% 80%', stain2: '28% 18%', crease: 72 },
  { tone: '#e7d9ba', stain: '46% 20%', stain2: '60% 84%', crease: 134 },
  { tone: '#f1e6d1', stain: '20% 68%', stain2: '80% 24%', crease: 88 },
]

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
 * Dar ekranda aynı anda üç kâğıt sığıyor; mobilde kâğıtlar üçlü dalgalar
 * hâlinde geliyor. Kullanıcı isteğiyle (2026-11-01) üst üste değil çapraz:
 * sol–sağ–sol zikzak, karşılıklı eğik. Her kâğıt kendi tarafından çapraz
 * bir çizgiyle kadraja giriyor; bir sonraki dalga gelince silinmiyor,
 * aşağı kayıp kadrajdan çıkıyor. Sağdakiler sağ kenardan ölçülüyor ki
 * tablette de karşı kenara otursun.
 */
const NARROW: Spot[] = [
  { x: 0, y: 10, r: -6 },
  { x: 0, y: 37, r: 5, right: true },
  { x: 2, y: 64, r: -4 },
]

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
/* Düşüşün sonunda hafif bir oturma: yere çarpıp yerine yatıyor */
const settle = (t: number) => 1 - Math.pow(1 - t, 3)

/** Kâğıtların hepsi bu ilerlemeye kadar yere inmiş oluyor */
const LAST = 0.86
const DROP = 0.2

export default function Testimonials() {
  const { testimonials: section, headings } = useContent()
  /* Elle dağıtılmış sekiz nokta var; fazlası aynı noktalara düşerdi */
  const testimonials = section.items.slice(0, LIMITS.testimonials)
  const count = testimonials.length
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
        if (narrow) {
          const spot = NARROW[i % group]
          const side = spot.right ? 1 : -1
          const next = i + group
          /* Ardılı düşmeye başlayınca bu kâğıt aşağı kayıp kadrajdan çıkıyor */
          const leave =
            next < testimonials.length ? clamp01((p - next * step) / (DROP * 0.8)) : 0
          const out = leave * leave
          /*
           * Geliş çapraz: kendi tarafının üst köşesinden, kadrajın dışından.
           * Dikey yol kâğıdın durduğu yükseklik + payı kadar, böylece
           * havadayken hiç görünmüyor ve saydamlığa gerek kalmıyor.
           */
          const fromY = -(spot.y + 38) * (1 - t)
          const fromX = side * 70 * (1 - t)
          /* Gidiş: aşağıya, kadrajın altına; hafif dönerek */
          const toY = (100 - spot.y + 12) * out
          const x = fromX + side * 8 * out
          const y = fromY + toY
          const spin = (1 - t) * side * 18 + out * side * -8
          node.style.transform = `translate3d(${x.toFixed(2)}vw, ${y.toFixed(2)}vh, 0) rotate(${spot.r + spin}deg) scale(${(1 + (1 - t) * 0.06).toFixed(3)})`
          node.style.opacity = t > 0 && leave < 1 ? '1' : '0'
          node.style.zIndex = String(10 + i)
          const spread = 10 + (1 - t) * 44
          const drop = 8 + (1 - t) * 40
          node.style.boxShadow =
            `0 ${drop.toFixed(0)}px ${spread.toFixed(0)}px -${(spread * 0.55).toFixed(0)}px rgb(12 7 3 / ${(0.85 - (1 - t) * 0.3).toFixed(2)}),` +
            ' inset 0 0 26px rgb(126 96 52 / 0.22)'
          return
        }
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
        /* Dışarıda yere düşen gölge, içeride yıllanmış kenar koyuluğu */
        node.style.boxShadow =
          `0 ${drop.toFixed(0)}px ${spread.toFixed(0)}px -${(spread * 0.55).toFixed(0)}px rgb(12 7 3 / ${(0.85 - (1 - t) * 0.3).toFixed(2)}),` +
          ' inset 0 0 26px rgb(126 96 52 / 0.22)'
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
    /* Kâğıt sayısı panelden değişince sahne yeniden kuruluyor */
  }, [narrow, count])

  const spots = narrow ? NARROW : WIDE

  /* Yayında değilse ya da panelde bütün yorumlar silinmişse bölüm hiç görünmüyor */
  if (!yorumlarGorunur || count === 0) return null

  return (
    <section id="yorumlar" className="relative scroll-mt-28 pt-24 pb-16 sm:pt-28">
      <EditChip target="yorumlar" label="Yorumlar" />
      <div className="section-shell">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <Reveal>
              <h2 className="title-lg">
                <Emphasis text={headings.yorumlar} />
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="lead mt-5 max-w-lg">{section.intro}</p>
            </Reveal>
          </div>
          {/* Puan boş bırakılırsa kutu hiç gösterilmiyor */}
          {section.rating.trim() && (
          <Reveal delay={0.1}>
            <div className="flex items-center gap-4 border-l border-ivory-100/20 pl-5">
              <span className="font-display text-3xl font-extrabold text-ivory-50">{section.rating}</span>
              <span>
                <span className="flex items-center gap-0.5 text-warm-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3.5" />
                  ))}
                </span>
                <span className="mt-1 block text-[0.78rem] text-ivory-300">{section.ratingCount}</span>
              </span>
            </div>
          </Reveal>
          )}
        </div>
      </div>

      {/*
        Sarmalayıcı alan viewport'tan uzun, içerideki katman yapışkan: sayfa
        burada bir süre yerinde kalıyor ve kaydırma yalnızca kâğıtları
        indiriyor. Kâğıtlar kabuğun dışında, tam genişlikte duruyor.
      */}
      <div ref={pinRef} data-kaydir className="relative mt-8 h-[300vh] sm:mt-12 sm:h-[340vh]">
        <div className="sticky top-0 h-[100svh] overflow-hidden">
          <div className="relative mx-auto h-full w-full max-w-[86rem] px-4 sm:px-8">
            {testimonials.map((item, i) => {
              const spot = spots[i % spots.length]
              const aged = AGED[i % AGED.length]
              /* İsimsiz kâğıt yer tutucu: yıldız ve imza yok, yalnızca not */
              const imzali = !!(item.name.trim() || item.role.trim())
              return (
                <figure
                  key={i}
                  data-ipucu-engel
                  ref={(node) => {
                    paperRefs.current[i] = node
                  }}
                  data-rot={spot.r}
                  style={{
                    ...(spot.right ? { right: `${spot.x}%` } : { left: `${spot.x}%` }),
                    top: `${spot.y}%`,
                    transformOrigin: '50% 40%',
                    opacity: 0,
                    /*
                      Eski kâğıt: sararmış zemin, üzerinde iki soluk leke ve
                      odanın soldan gelen ışığına uyan hafif bir eğim.
                    */
                    background: `radial-gradient(60% 50% at ${aged.stain}, rgb(196 160 104 / 0.16), transparent 70%),
                      radial-gradient(52% 44% at ${aged.stain2}, rgb(176 138 86 / 0.13), transparent 72%),
                      linear-gradient(152deg, rgb(255 252 244 / 0.55) 0%, transparent 38%),
                      ${aged.tone}`,
                  }}
                  className="absolute w-[15.5rem] overflow-hidden rounded-[2px] px-5 py-4 will-change-[transform,opacity] sm:w-[18rem] lg:w-[19.5rem]"
                >
                  {/* Kâğıt lifi — zeminle aynı tane, çarpımla dokuya işliyor */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-[0.45] mix-blend-multiply"
                    style={{ backgroundImage: 'url(/images/doku.png)', backgroundRepeat: 'repeat' }}
                  />
                  {/* Yıllarca katlı durmuş gibi soluk bir kırık izi */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background: `linear-gradient(${aged.crease}deg, transparent 46%, rgb(120 92 52 / 0.1) 49.5%, rgb(255 250 236 / 0.4) 50.5%, transparent 54%)`,
                    }}
                  />

                  {imzali ? (
                    <>
                      <div className="relative flex items-center gap-0.5 text-[#96691f]">
                        {Array.from({ length: 5 }).map((_, s) => (
                          <Star key={s} className="size-3.5" />
                        ))}
                      </div>

                      <blockquote className="relative mt-2.5 text-[0.88rem] leading-relaxed text-[#453524]">
                        {item.quote}
                      </blockquote>

                      <figcaption className="relative mt-3.5 flex items-baseline gap-2 border-t border-[#6b5334]/25 pt-2.5">
                        <span className="font-wordmark text-[1.15rem] leading-none text-[#31241a]">
                          {item.name}
                        </span>
                        <span className="text-[0.74rem] text-[#6f5a3f]">{item.role}</span>
                      </figcaption>
                    </>
                  ) : (
                    <p className="relative py-6 text-center font-wordmark text-[1.3rem] leading-snug text-[#5a4630]">
                      {item.quote}
                    </p>
                  )}
                </figure>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
