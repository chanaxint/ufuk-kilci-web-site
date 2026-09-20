import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { credentials, doctor } from '../lib/content'
import Reveal from './ui/Reveal'
import { ArrowRight, Close } from './ui/icons'

type Credential = (typeof credentials)[number]

/** Her çerçeveye farklı derinlik ve eğim vererek duvarda asılı hissi verilir. */
const frameStyles = [
  { depth: 26, rotate: -1.1, width: 'w-[16rem] sm:w-[17rem] lg:w-[19rem]', offset: 'lg:mt-10' },
  { depth: 54, rotate: 0.8, width: 'w-[15rem] sm:w-[16rem] lg:w-[18rem]', offset: 'lg:mt-0' },
  { depth: 12, rotate: -0.6, width: 'w-[16rem] sm:w-[17.5rem] lg:w-[19.5rem]', offset: 'lg:mt-16' },
  { depth: 42, rotate: 1.2, width: 'w-[15rem] sm:w-[16.5rem] lg:w-[18.5rem]', offset: 'lg:mt-4' },
  { depth: 20, rotate: -0.9, width: 'w-[15rem] sm:w-[16rem] lg:w-[18rem]', offset: 'lg:mt-2' },
]

/**
 * Ahşap çerçeve, altın pervaz, paspartu ve pirinç künye.
 * Hem duvardaki küçük hâlde hem de tam ekran görünümde aynı bileşen çizilir.
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

            {/* Cam parlaması */}
            <span
              className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${
                large ? 'opacity-25' : 'opacity-45 group-hover:opacity-20'
              }`}
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
}: {
  item: Credential
  index: number
  onOpen: (index: number) => void
}) {
  const style = frameStyles[index % frameStyles.length]

  return (
    <motion.div
      initial={{ opacity: 0, y: 42 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-12% 0px' }}
      transition={{ duration: 0.9, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className={`${style.width} ${style.offset} shrink-0`}
      style={{ transform: `translateZ(${style.depth}px)`, transformStyle: 'preserve-3d' }}
      data-depth={style.depth}
    >
      <button
        type="button"
        onClick={() => onOpen(index)}
        aria-label={`${item.title} belgesini büyüt`}
        className="group relative block w-full cursor-pointer rounded-[3px] text-left transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-brand-600"
        style={{ transform: `rotate(${style.rotate}deg)` }}
      >
        {/* Çivi */}
        <span className="absolute -top-3 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-[#3a2f24] shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
        <CertificateFrame item={item} />
      </button>
    </motion.div>
  )
}

/** Belgeyi çerçevesiyle birlikte tam ekran gösterir; oklarla ya da sürükleyerek gezilir. */
function Lightbox({
  index,
  onClose,
  onStep,
}: {
  index: number
  onClose: () => void
  onStep: (delta: number) => void
}) {
  const item = credentials[index]
  const dragX = useRef<number | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') onStep(1)
      else if (e.key === 'ArrowLeft') onStep(-1)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, onStep])

  const arrow =
    'pointer-events-auto grid size-12 place-items-center rounded-full border border-white/25 bg-white/10 text-sand-50 backdrop-blur-sm transition-colors hover:border-white/60 hover:bg-white/20'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-ink-950/80 px-4 py-16 backdrop-blur-sm sm:px-16"
      role="dialog"
      aria-modal="true"
      aria-label={`${item.title} — ${item.org}`}
      onPointerDown={(e) => {
        dragX.current = e.clientX
      }}
      onPointerUp={(e) => {
        const start = dragX.current
        dragX.current = null
        if (start === null) return
        const dx = e.clientX - start
        /* Yatay sürükleme belgeyi değiştirir; yerinde bırakmak (zemine tıklamak) kapatır */
        if (Math.abs(dx) > 60) onStep(dx < 0 ? 1 : -1)
        else if (e.target === e.currentTarget) onClose()
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Kapat"
        className={`absolute top-5 right-5 ${arrow}`}
      >
        <Close className="size-5" />
      </button>

      <div className="pointer-events-none absolute inset-x-3 flex items-center justify-between sm:inset-x-6">
        <button type="button" onClick={() => onStep(-1)} aria-label="Önceki belge" className={arrow}>
          <ArrowRight className="size-5 rotate-180" />
        </button>
        <button type="button" onClick={() => onStep(1)} aria-label="Sonraki belge" className={arrow}>
          <ArrowRight className="size-5" />
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.figure
          key={item.title}
          initial={{ opacity: 0, scale: 0.96, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -10 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-[min(42rem,100%)] select-none"
        >
          <CertificateFrame item={item} large />
          <figcaption className="mt-6 text-center">
            <p className="font-display text-lg font-extrabold text-sand-50">{item.title}</p>
            <p className="mt-1.5 text-[0.9rem] text-brand-200">
              {item.org} · {item.year}
            </p>
            <p className="mt-4 font-display text-[0.62rem] font-bold tracking-[0.2em] text-sand-50/45 uppercase">
              {index + 1} / {credentials.length}
            </p>
          </figcaption>
        </motion.figure>
      </AnimatePresence>
    </motion.div>
  )
}

export default function Certificates() {
  const wall = useRef<HTMLDivElement>(null)
  const plane = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState<number | null>(null)

  const close = useCallback(() => setOpen(null), [])
  const step = useCallback(
    (delta: number) =>
      setOpen((i) => (i === null ? i : (i + delta + credentials.length) % credentials.length)),
    [],
  )

  /* Fare hareketine bağlı paralaks — React state'i olmadan, doğrudan DOM'a yazılır */
  useEffect(() => {
    const el = wall.current
    if (!el) return
    if (window.matchMedia('(pointer: coarse)').matches) return

    let frame = 0
    const onMove = (e: PointerEvent) => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const r = el.getBoundingClientRect()
        const nx = (e.clientX - r.left) / r.width - 0.5
        const ny = (e.clientY - r.top) / r.height - 0.5
        if (plane.current) {
          plane.current.style.transform = `rotateY(${nx * 7}deg) rotateX(${-ny * 5}deg) translateZ(0)`
        }
      })
    }
    const onLeave = () => {
      if (plane.current) plane.current.style.transform = 'rotateY(0deg) rotateX(0deg)'
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <section id="sertifikalar" className="relative scroll-mt-28 py-24 sm:py-28">
      <div className="section-shell">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <h2 className="title-lg">Duvardaki belgeler</h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="lead mt-6">
              Her biri, kliniğe taşınan bir yöntemin karşılığı. Bir çerçeveye tıklayın; belge
              tablosuyla birlikte büyüsün, oklarla diğerlerine geçin.
            </p>
          </Reveal>
        </div>
      </div>

      {/* Duvar */}
      <Reveal delay={0.1}>
        <div
          ref={wall}
          className="relative mt-14 overflow-hidden"
          style={{ perspective: '1400px' }}
        >
          {/* Çerçeveler */}
          <div
            ref={plane}
            className="relative mx-auto flex w-full max-w-[86rem] flex-wrap items-start justify-center gap-4 px-5 py-14 transition-transform duration-500 ease-out sm:gap-7 sm:px-6 sm:py-20 lg:gap-9 lg:py-24"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {credentials.map((item, i) => (
              <WallCertificate key={item.title} item={item} index={i} onOpen={setOpen} />
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
          <Lightbox key="lightbox" index={open} onClose={close} onStep={step} />
        )}
      </AnimatePresence>
    </section>
  )
}
