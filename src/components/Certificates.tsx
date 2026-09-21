import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { credentials, doctor } from '../lib/content'
import Reveal from './ui/Reveal'
import { Close } from './ui/icons'

type Credential = (typeof credentials)[number]

/*
 * Çerçeveler zemine tek tek bırakılmış gibi duruyor: dizilmiş değil,
 * dağınık. Her biri kendi noktasında, kendi açısında ve biraz farklı
 * büyüklükte; birbirlerinin üzerine hafifçe biniyorlar. Sayılar sabit —
 * rastgelelik yalnızca bakışta, her açılışta aynı yerde duruyorlar.
 *
 * x/y sahnenin yüzdesi (sol üst köşe), rotate derece, lean ise kâğıdın
 * yere yatıklığı (perspektif içinde rotateX).
 */
type FrameSpot = {
  x: number
  y: number
  rotate: number
  lean: number
  depth: number
  scale: number
  z: number
}

/*
 * Hiçbir çerçeve bir diğerinin üstüne binmiyor: geniş ekranda üstte üç,
 * altta iki; dağınıklık açı, yatıklık ve ölçek farkından geliyor.
 */
const WIDE_SPOTS: FrameSpot[] = [
  { x: 3, y: 2, rotate: -7, lean: 6, depth: 24, scale: 1, z: 2 },
  { x: 37, y: 4, rotate: 5, lean: 5, depth: 48, scale: 0.95, z: 4 },
  { x: 71, y: 1, rotate: -4, lean: 7, depth: 14, scale: 0.98, z: 3 },
  { x: 19, y: 52, rotate: 6.5, lean: 6, depth: 40, scale: 0.93, z: 1 },
  { x: 54, y: 54, rotate: -6, lean: 8, depth: 20, scale: 0.97, z: 5 },
]

/* Dar ekranda tek sütun; sola sağa kaydırılmış ama yine üst üste binmiyor */
const NARROW_SPOTS: FrameSpot[] = [
  { x: 3, y: 1, rotate: -6, lean: 6, depth: 24, scale: 1, z: 2 },
  { x: 22, y: 21, rotate: 5, lean: 5, depth: 48, scale: 0.95, z: 4 },
  { x: 2, y: 41, rotate: -4, lean: 7, depth: 14, scale: 1, z: 3 },
  { x: 21, y: 61, rotate: 7, lean: 6, depth: 40, scale: 0.93, z: 1 },
  { x: 4, y: 80.5, rotate: -5, lean: 8, depth: 20, scale: 0.97, z: 5 },
]

/**
 * Ahşap çerçeve, altın pervaz, paspartu ve pirinç künye.
 * Hem zemindeki küçük hâlde hem de tam ekran görünümde aynı bileşen çizilir.
 */
function CertificateFrame({ item, large = false }: { item: Credential; large?: boolean }) {
  return (
    <>
      <div
        className="relative rounded-[3px] p-[10px]"
        style={{
          background:
            'linear-gradient(145deg,#6b5238 0%,#4a3826 22%,#7c6044 48%,#43321f 72%,#5e4832 100%)',
          boxShadow:
            '0 1px 0 rgba(255,235,205,0.25) inset, 0 -1px 0 rgba(0,0,0,0.45) inset, 14px 22px 36px -18px rgba(38,30,20,0.42), 3px 6px 12px -6px rgba(38,30,20,0.3)',
        }}
      >
        {/* İç altın pervaz */}
        <div
          className="rounded-[2px] p-[3px]"
          style={{
            background: 'linear-gradient(145deg,#d9b877,#8a6c3c 45%,#e7ce9a 70%,#9c7c48)',
          }}
        >
          {/* Paspartu ve belge */}
          <div
            className="relative overflow-hidden p-2 sm:p-2.5"
            style={{
              background: 'linear-gradient(160deg,#fbf7ef 0%,#f2ebdd 60%,#e9e0cf 100%)',
              boxShadow: '0 2px 10px rgba(60,44,24,0.28) inset',
            }}
          >
            <img
              src={item.image}
              alt={`${item.title} — ${item.org}`}
              loading={large ? 'eager' : 'lazy'}
              draggable={false}
              className={`block w-full shadow-[0_1px_4px_rgba(60,44,24,0.25)] ${
                large ? 'max-h-[62vh] object-contain' : 'object-cover'
              }`}
            />

            {/*
              Yıllanma: belge kâğıdı bembeyaz parlamıyor. Sıcak bir perde,
              kenarlara doğru koyulaşma ve zeminle aynı tane — çerçeve
              odanın ışığına ve ahşabın rengine oturuyor.
            */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 mix-blend-multiply"
              style={{
                background:
                  'radial-gradient(120% 100% at 30% 20%, rgb(255 246 226 / 0.2), rgb(198 168 118 / 0.3) 62%, rgb(150 118 74 / 0.45) 100%)',
              }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.4] mix-blend-multiply"
              style={{ backgroundImage: 'url(/images/doku.png)', backgroundRepeat: 'repeat' }}
            />

            {/* Cam parlaması */}
            <span
              className={`pointer-events-none absolute inset-0 ${large ? 'opacity-25' : 'opacity-40'}`}
              style={{
                background:
                  'linear-gradient(112deg,rgba(255,255,255,0.55) 0%,rgba(255,255,255,0.12) 26%,transparent 44%,rgba(255,255,255,0.18) 72%,transparent 88%)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Çerçevenin altındaki pirinç künye */}
      <div className="mt-3 flex justify-center">
        <span
          className={`max-w-full rounded-[2px] px-3 py-1.5 text-center font-display leading-tight font-bold tracking-[0.1em] text-[#3a2c18] uppercase ${
            large ? 'text-[0.68rem] sm:px-5 sm:py-2 sm:text-[0.74rem]' : 'text-[0.56rem]'
          }`}
          style={{
            background: 'linear-gradient(145deg,#e4cd9b,#b99a63 45%,#f0dcb0 70%,#a98e5d)',
            boxShadow: '0 2px 5px rgba(30,18,6,0.4), 0 1px 0 rgba(255,255,255,0.4) inset',
          }}
        >
          {item.year} · {item.title}
        </span>
      </div>
    </>
  )
}

function WallCertificate({
  item,
  index,
  onOpen,
  spot,
}: {
  item: Credential
  index: number
  onOpen: (index: number) => void
  spot: FrameSpot
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 42 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-12% 0px' }}
      transition={{ duration: 0.9, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="absolute w-[14.5rem] sm:w-[17rem] lg:w-[20rem]"
      style={{
        left: `${spot.x}%`,
        top: `${spot.y}%`,
        zIndex: spot.z,
        transform: `translateZ(${spot.depth}px) scale(${spot.scale})`,
        transformStyle: 'preserve-3d',
      }}
      data-depth={spot.depth}
    >
      <button
        type="button"
        onClick={() => onOpen(index)}
        aria-label={`${item.title} belgesini büyüt`}
        /*
          Üzerine gelince hiçbir hareket yok: tıklanınca zaten tam ekrana
          geliyor. Yalnızca klavye odağında çerçeve dışı bir hat çıkıyor.
        */
        className="group relative block w-full cursor-pointer rounded-[3px] text-left focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-warm-300"
        style={{ transform: `rotate(${spot.rotate}deg) rotateX(${spot.lean}deg)` }}
      >
        {/* Zemine bırakılmış çerçeve: çivi yok, altında yere düşen temas gölgesi var */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-3 left-1/2 h-5 w-[86%] -translate-x-1/2 rounded-[50%] blur-md"
          style={{ background: 'radial-gradient(closest-side, rgb(10 6 3 / 0.7), transparent 78%)' }}
        />
        <CertificateFrame item={item} />
      </button>
    </motion.div>
  )
}

/**
 * Belgeyi çerçevesiyle birlikte tam ekran gösterir.
 *
 * Gerçek bir 3B model yok; çerçeve imlecin konumuna göre eğiliyor ve üstünde
 * gezen bir cam parlaması taşıyor. İmleç kenarlara yaklaştıkça eğim artıyor,
 * böylece tablo elde tutuluyormuş hissi veriyor.
 *
 * Gezinme düğmesi yok: boşluğa tıklayıp kapatılıyor, zeminden başka bir
 * çerçeveye tıklanarak diğer belgeler açılıyor.
 */
function Lightbox({ index, onClose }: { index: number; onClose: () => void }) {
  const item = credentials[index]
  const tilt = useRef<HTMLDivElement>(null)
  const glare = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  /* İmlece bağlı eğim — React state'i olmadan, doğrudan DOM'a yazılır */
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    const onMove = (e: PointerEvent) => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const nx = e.clientX / window.innerWidth - 0.5
        const ny = e.clientY / window.innerHeight - 0.5
        if (tilt.current) {
          tilt.current.style.transform = `rotateY(${nx * 26}deg) rotateX(${-ny * 17}deg) translateZ(0)`
        }
        if (glare.current) {
          glare.current.style.setProperty('--gx', `${(nx + 0.5) * 100}%`)
          glare.current.style.setProperty('--gy', `${(ny + 0.5) * 100}%`)
          glare.current.style.opacity = '1'
        }
      })
    }
    const onLeave = () => {
      if (tilt.current) tilt.current.style.transform = 'rotateY(0deg) rotateX(0deg)'
      if (glare.current) glare.current.style.opacity = '0'
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-ink-950/80 px-4 py-16 backdrop-blur-sm sm:px-16"
      style={{ perspective: '1500px' }}
      role="dialog"
      aria-modal="true"
      aria-label={`${item.title} — ${item.org}`}
      onClick={(e) => {
        /* Boşluğa tıklamak kapatır; çerçevenin kendisi kapatmaz */
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Kapat"
        className="pointer-events-auto absolute top-5 right-5 grid size-12 place-items-center rounded-full border border-white/25 bg-white/10 text-sand-50 backdrop-blur-sm transition-colors hover:border-white/60 hover:bg-white/20"
      >
        <Close className="size-5" />
      </button>

      <motion.figure
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: -10 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-[min(42rem,100%)] select-none"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div
          ref={tilt}
          className="relative transition-transform duration-[450ms] ease-out will-change-transform"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <CertificateFrame item={item} large />
          {/* İmleçle gezen cam parlaması */}
          <span
            ref={glare}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500"
            style={{
              background:
                'radial-gradient(22rem 22rem at var(--gx, 50%) var(--gy, 50%), rgb(255 255 255 / 0.28), transparent 62%)',
            }}
          />
        </div>

        <figcaption className="mt-7 text-center">
          <p className="font-display text-lg font-extrabold text-sand-50">{item.title}</p>
          <p className="mt-1.5 text-[0.9rem] text-brand-200">
            {item.org} · {item.year}
          </p>
          <p className="mt-5 font-display text-[0.62rem] font-bold tracking-[0.2em] text-sand-50/40 uppercase">
            Kapatmak için boşluğa tıklayın
          </p>
        </figcaption>
      </motion.figure>
    </motion.div>
  )
}

export default function Certificates() {
  const [open, setOpen] = useState<number | null>(null)
  /* Dar ekranda dağılım tek sütuna yakın: çerçeveler kenardan taşmasın */
  const [narrow, setNarrow] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const apply = () => setNarrow(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const close = useCallback(() => setOpen(null), [])

  /*
   * Fare paralaksı kaldırıldı: imleç çerçevelerin üzerinde gezinirken
   * bütün grup birlikte oynuyordu. Artık yalnızca üzerine gelinen çerçeve
   * kendi başına biraz kalkıyor.
   */

  return (
    <section id="sertifikalar" className="relative scroll-mt-28 py-24 sm:py-28">
      <div className="section-shell">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <h2 className="title-lg">Sertifikalar</h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="lead mt-6">
              Manuel terapi, osteopati, Schroth ve kuru iğneleme başta olmak üzere tamamladığım
              eğitimler. Her biri, kliniğe yeni bir değerlendirme ya da tedavi yöntemi olarak
              taşındı; belgeyi büyütmek için üzerine tıklayabilirsiniz.
            </p>
          </Reveal>
        </div>
      </div>

      {/* Zemin dizilimi */}
      <Reveal delay={0.1}>
        <div className="relative mt-14 overflow-hidden" style={{ perspective: '1400px' }}>
          {/* Çerçeveler */}
          <div
            className="relative mx-auto h-[82rem] w-full max-w-[86rem] px-5 sm:h-[96rem] sm:px-6 lg:h-[46rem]"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {credentials.map((item, i) => (
              <WallCertificate
                key={item.title}
                item={item}
                index={i}
                onOpen={setOpen}
                spot={(narrow ? NARROW_SPOTS : WIDE_SPOTS)[i % WIDE_SPOTS.length]}
              />
            ))}
          </div>

          {/* Pirinç künye */}
          <div className="relative z-10 flex justify-center pb-12">
            <span
              className="rounded-[3px] px-4 py-2 text-center font-display text-[0.5rem] font-bold tracking-[0.16em] text-[#3a2c18] uppercase sm:px-5 sm:text-[0.62rem] sm:tracking-[0.22em]"
              style={{
                background: 'linear-gradient(145deg,#e4cd9b,#b99a63 45%,#f0dcb0 70%,#a98e5d)',
                boxShadow: '0 2px 6px rgba(30,18,6,0.45), 0 1px 0 rgba(255,255,255,0.4) inset',
              }}
            >
              {doctor.name} · {doctor.titles}
            </span>
          </div>
        </div>
      </Reveal>

      <AnimatePresence>
        {open !== null && (
          <Lightbox key="lightbox" index={open} onClose={close} />
        )}
      </AnimatePresence>
    </section>
  )
}
