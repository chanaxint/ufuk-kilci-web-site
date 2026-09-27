import { useEffect, useRef, useState } from 'react'
import { testimonials } from '../lib/content'
import Reveal from './ui/Reveal'
import { Star } from './ui/icons'

/** Bir kâğıdın yeri: kabın sol üstüne göre piksel, yattığı açı */
type Slot = { x: number; y: number; r: number }
type Layout = { slots: Slot[]; group: number }

/* Kâğıtların yattığı açılar; telefonda biraz daha az eğik */
const TILT = [-5, 4, -3, 6, -6, 3, -4, 5]

/* 0–1 arası sabit "rastgele" sayılar: her açılışta aynı dağılım */
const rnd = (k: number) => {
  const v = Math.sin(k * 127.1 + 311.7) * 43758.5453
  return v - Math.floor(v)
}

/**
 * Kâğıtları yere dağıtır.
 *
 * Eskiden sekiz nokta elle, ekranın yüzdesi olarak yazılmıştı. 1920×1080'de
 * temizdi ama ekran kısaldıkça sıralar birbirine yaklaşıyordu: 1440×900'de
 * iki kâğıt birinin imzasını örtüyor, 1366×768 ve 1280×720'de dört çift
 * üst üste biniyor, 1024'te kâğıtlar ekrandan taşıyordu (ölçüldü).
 *
 * Şimdi alan ve kâğıdın gerçek boyu ölçülüyor: eğik kâğıdın kapladığı kutu
 * kadar hücreli bir ızgara kuruluyor, kâğıtlar hücrelerin içinde biraz
 * kaydırılıp eğiliyor — dağınık görünüyor ama hücre dışına taşamadığı için
 * hiçbir yazı örtülmüyor. Sekizi birden sığmıyorsa kâğıtlar dalga dalga
 * geliyor: sonraki kâğıt düşerken aynı yerdeki önceki kâğıt kalkıyor.
 */
function scatter(
  W: number,
  H: number,
  pad: number,
  pw: number,
  ph: number,
  n: number,
): Layout {
  const phone = W < 640
  /* Üstte başlık ve perdesi, altta kaydırma ipucu (telefonda arama çubuğu da) */
  const top = phone ? 84 : 92
  const bottom = phone ? 124 : 64
  const availW = W - pad * 2
  const availH = Math.max(ph, H - top - bottom)
  const tilt = phone ? 0.6 : 1
  const rad = (6 * tilt * Math.PI) / 180
  const bw = pw * Math.cos(rad) + ph * Math.sin(rad)
  const bh = pw * Math.sin(rad) + ph * Math.cos(rad)
  const gapX = 24
  const gapY = 18
  const cols = Math.max(1, Math.floor((availW + gapX) / (bw + gapX)))
  const rows = Math.max(1, Math.floor((availH + gapY) / (bh + gapY)))
  const group = Math.min(n, cols * rows)

  /* Önce dama tahtası gibi seyrek hücreler, sonra aradakiler */
  const cells: [number, number][] = []
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push([r, c])
  cells.sort((a, b) => ((a[0] + a[1]) % 2) - ((b[0] + b[1]) % 2) || a[0] - b[0] || a[1] - b[1])
  const chosen = cells.slice(0, group)
  /* Düşüş sırası okuma sırasında olmasın; kâğıtlar oraya buraya düşsün */
  chosen.sort((a, b) => rnd(a[0] * 7 + a[1] + 1) - rnd(b[0] * 7 + b[1] + 1))

  const cw = availW / cols
  const ch = availH / rows
  const slots = chosen.map(([r, c], i) => {
    const jx = (rnd(i * 3 + 11) - 0.5) * 1.4 * Math.max(0, (cw - bw) / 2)
    const jy = (rnd(i * 5 + 17) - 0.5) * 1.4 * Math.max(0, (ch - bh) / 2)
    return {
      x: pad + (c + 0.5) * cw - pw / 2 + jx,
      y: top + (r + 0.5) * ch - ph / 2 + jy,
      r: TILT[i % TILT.length] * tilt,
    }
  })
  return { slots, group }
}

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

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
/* Düşüşün sonunda hafif bir oturma: yere çarpıp yerine yatıyor */
const settle = (t: number) => 1 - Math.pow(1 - t, 3)

/** Son kâğıt bu ilerlemede yere inmiş oluyor; kalanı okumak için duruş */
const LAST = 0.86
const DROP = 0.2

export default function Testimonials() {
  const pinRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const paperRefs = useRef<(HTMLElement | null)[]>([])
  const [layout, setLayout] = useState<Layout | null>(null)

  /*
   * Yerleşim ekran boyu değişince ve fontlar yüklenince yeniden kuruluyor
   * (kâğıdın boyu yazının kaç satıra kırıldığına bağlı). Ölçü dönüşümden
   * bağımsız: offsetWidth/offsetHeight eğim ve düşüş hareketini saymıyor.
   */
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    let raf = 0
    let lastKey = ''
    const measure = () => {
      raf = 0
      const papers = paperRefs.current.filter((n): n is HTMLElement => !!n)
      if (!papers.length) return
      const pw = Math.max(...papers.map((n) => n.offsetWidth))
      const ph = Math.max(...papers.map((n) => n.offsetHeight))
      const pad = parseFloat(getComputedStyle(stage).paddingLeft) || 0
      const next = scatter(stage.clientWidth, stage.clientHeight, pad, pw, ph, testimonials.length)
      /*
       * Telefonda adres çubuğu açılıp kapandıkça "resize" geliyor ama sahne
       * `svh` ile sabit; sonuç aynıysa yeniden çizim tetiklenmesin.
       */
      const key = JSON.stringify(next)
      if (key === lastKey) return
      lastKey = key
      setLayout(next)
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure)
    }
    measure()
    document.fonts?.ready.then(schedule)
    window.addEventListener('resize', schedule)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('resize', schedule)
    }
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
      const n = testimonials.length
      const group = layout?.group ?? n
      /*
       * Zamanlama dalgalara göre. Hepsi sığıyorsa kâğıtlar sırayla düşüp
       * LAST'ta hepsi yerde oluyor. Dalga varsa her dalga kendi payında
       * düşüyor, bir süre okunacak kadar yerde kalıyor, sonra bir sonraki
       * dalga geliyor. Eskiden adım sabitti: telefonda (dalga başına iki
       * kâğıt) kâğıt yere indiği an kalkmaya başlıyordu.
       */
      const waves = Math.ceil(n / group)
      const waveLen = LAST / waves
      const fall = waves > 1 ? Math.min(DROP, waveLen * 0.45) : DROP
      const start = (k: number) =>
        waves === 1
          ? k * ((LAST - DROP) / Math.max(1, n - 1))
          : Math.floor(k / group) * waveLen + (k % group) * ((waveLen * 0.4) / group)

      paperRefs.current.forEach((node, i) => {
        if (!node) return
        const t = settle(clamp01((p - start(i)) / fall))
        /*
         * Yerinde bir sonraki dalga varsa, ardılı düşerken bu kâğıt
         * yerini ona bırakıyor: hafifçe aşağı kayıp siliniyor.
         */
        const next = i + group
        const leave = next < n ? settle(clamp01((p - start(next)) / (fall * 0.7))) : 0
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
  }, [layout])

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
                Farklı yaşlardan, farklı şikâyetlerle gelen hastaların tedavi sonrasında
                anlattıkları. Hepsi kendi izinleriyle paylaşıldı; isimler kısaltılarak yazıldı.
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
      <div ref={pinRef} data-kaydir className="relative mt-8 h-[300vh] sm:mt-12 sm:h-[340vh]">
        <div className="sticky top-0 h-[100svh] overflow-hidden">
          <div ref={stageRef} className="relative mx-auto h-full w-full max-w-[86rem] px-4 sm:px-8">
            {testimonials.map((item, i) => {
              const spot = layout?.slots[i % layout.group] ?? { x: 0, y: 0, r: 0 }
              const aged = AGED[i % AGED.length]
              return (
                <figure
                  key={item.name}
                  ref={(node) => {
                    paperRefs.current[i] = node
                  }}
                  data-rot={spot.r}
                  style={{
                    left: `${spot.x.toFixed(1)}px`,
                    top: `${spot.y.toFixed(1)}px`,
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
                </figure>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
