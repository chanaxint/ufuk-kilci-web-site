import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { credentials, doctor } from '../lib/content'
import Reveal from './ui/Reveal'

/** Her çerçeveye farklı derinlik ve eğim vererek duvarda asılı hissi verilir. */
const frameStyles = [
  { depth: 26, rotate: -1.1, width: 'w-[9.5rem] sm:w-[13rem] lg:w-[16.5rem]', offset: 'lg:mt-14' },
  { depth: 54, rotate: 0.8, width: 'w-[9rem] sm:w-[12.5rem] lg:w-[15.5rem]', offset: 'lg:mt-0' },
  { depth: 12, rotate: -0.6, width: 'w-[9.5rem] sm:w-[13.5rem] lg:w-[17rem]', offset: 'lg:mt-20' },
  { depth: 42, rotate: 1.2, width: 'w-[9rem] sm:w-[12.5rem] lg:w-[16rem]', offset: 'lg:mt-6' },
  { depth: 20, rotate: -0.9, width: 'w-[9rem] sm:w-[12rem] lg:w-[15rem]', offset: 'lg:mt-2' },
]

function Certificate({
  item,
  index,
}: {
  item: (typeof credentials)[number]
  index: number
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
      <div
        className="group relative"
        style={{ transform: `rotate(${style.rotate}deg)` }}
      >
        {/* Çivi */}
        <span className="absolute -top-3 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-[#3a2f24] shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />

        {/* Ahşap çerçeve */}
        <div
          className="relative rounded-[3px] p-[10px] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1"
          style={{
            background:
              'linear-gradient(145deg,#6b5238 0%,#4a3826 22%,#7c6044 48%,#43321f 72%,#5e4832 100%)',
            boxShadow:
              '0 1px 0 rgba(255,235,205,0.25) inset, 0 -1px 0 rgba(0,0,0,0.5) inset, 18px 26px 40px -18px rgba(20,12,4,0.75), 4px 8px 14px -6px rgba(20,12,4,0.55)',
          }}
        >
          {/* İç altın pervaz */}
          <div
            className="rounded-[2px] p-[3px]"
            style={{
              background: 'linear-gradient(145deg,#d9b877,#8a6c3c 45%,#e7ce9a 70%,#9c7c48)',
            }}
          >
            {/* Paspartu */}
            <div
              className="relative overflow-hidden px-2.5 py-3 sm:px-4 sm:py-5"
              style={{
                background: 'linear-gradient(160deg,#fbf7ef 0%,#f2ebdd 60%,#e9e0cf 100%)',
                boxShadow: '0 2px 10px rgba(60,44,24,0.28) inset',
              }}
            >
              {/* Kâğıt */}
              <div className="relative flex aspect-[3/4] flex-col justify-between bg-[#fffdf8] px-3 py-4 shadow-[0_1px_4px_rgba(60,44,24,0.18)] sm:px-4 sm:py-5">
                <div>
                  <span className="block text-center font-display text-[0.42rem] leading-tight font-bold tracking-[0.2em] text-[#8a7350] uppercase sm:text-[0.5rem] sm:tracking-[0.24em]">
                    {item.org}
                  </span>
                  <span className="mx-auto mt-1.5 block h-px w-8 bg-[#c9b48a] sm:mt-2 sm:w-10" />
                  <p className="mt-2 text-center font-display text-[0.62rem] leading-snug font-extrabold text-[#2c2317] sm:mt-3 sm:text-[0.76rem]">
                    {item.title}
                  </p>
                  <p className="mt-2 hidden text-center text-[0.56rem] tracking-[0.06em] text-[#7a684c] sm:block">
                    Bu belge {doctor.name} adına düzenlenmiştir.
                  </p>
                </div>

                <div className="flex items-end justify-between">
                  {/* İmza */}
                  <svg viewBox="0 0 70 24" className="h-4 w-12 text-[#4a3d28] sm:h-5 sm:w-16">
                    <path
                      d="M2 18c6-2 9-12 13-12s3 12 8 12 7-10 11-10 4 8 9 8 6-6 10-8 5 1 5 1"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Mühür */}
                  <span
                    className="grid size-7 shrink-0 place-items-center rounded-full font-display text-[0.42rem] font-extrabold tracking-[0.06em] text-[#7d3f2c] sm:size-9 sm:text-[0.5rem]"
                    style={{
                      background: 'radial-gradient(circle at 35% 30%,#e8c6a0,#c98f63 60%,#a86b45)',
                      boxShadow: '0 1px 3px rgba(60,30,10,0.45), 0 0 0 1px rgba(255,255,255,0.35) inset',
                    }}
                  >
                    {item.year}
                  </span>
                </div>
              </div>

              {/* Cam parlaması */}
              <span
                className="pointer-events-none absolute inset-0 opacity-45 transition-opacity duration-700 group-hover:opacity-25"
                style={{
                  background:
                    'linear-gradient(112deg,rgba(255,255,255,0.55) 0%,rgba(255,255,255,0.12) 26%,transparent 44%,rgba(255,255,255,0.18) 72%,transparent 88%)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Duvara düşen gölge */}
        <span
          className="pointer-events-none absolute inset-x-3 -bottom-2 h-6 rounded-[50%] blur-md"
          style={{ background: 'rgba(30,18,6,0.35)' }}
        />
      </div>
    </motion.div>
  )
}

export default function Certificates() {
  const wall = useRef<HTMLDivElement>(null)
  const plane = useRef<HTMLDivElement>(null)
  const glow = useRef<HTMLDivElement>(null)

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
        if (glow.current) {
          glow.current.style.background = `radial-gradient(38rem 26rem at ${(nx + 0.5) * 100}% ${(ny + 0.5) * 100}%, rgba(255,236,205,0.5), transparent 68%)`
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
            <span className="eyebrow">Eğitim & Sertifikalar</span>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className="title-lg mt-7">Duvardaki belgeler</h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="lead mt-6">
              Her biri, kliniğe taşınan bir yöntemin karşılığı. Çerçevelerin üzerinde gezinin.
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
          {/* Sıva dokusu */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg,#cdbfa9 0%,#c2b39c 35%,#b6a68e 70%,#a8977f 100%)',
            }}
          />
          <svg className="absolute inset-0 size-full opacity-[0.16] mix-blend-multiply" aria-hidden>
            <filter id="plaster">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#plaster)" />
          </svg>

          {/* Loş ışık ve vinyet */}
          <div
            ref={glow}
            className="pointer-events-none absolute inset-0 transition-[background] duration-300"
            style={{
              background:
                'radial-gradient(38rem 26rem at 50% 18%, rgba(255,236,205,0.5), transparent 68%)',
            }}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(120% 90% at 50% 40%, transparent 35%, rgba(28,18,8,0.45) 100%)',
            }}
          />

          {/* Çerçeveler */}
          <div
            ref={plane}
            className="relative mx-auto flex w-full max-w-[86rem] flex-wrap items-start justify-center gap-4 px-5 py-14 transition-transform duration-500 ease-out sm:gap-7 sm:px-6 sm:py-20 lg:gap-9 lg:py-24"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {credentials.map((item, i) => (
              <Certificate key={item.title} item={item} index={i} />
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
    </section>
  )
}
