import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { doctor, stageBeats } from '../lib/content'
import ShinyText from './reactbits/ShinyText'
import type { SpineRegionId } from '../lib/spine'
import { ArrowDown, ArrowRight } from './ui/icons'
import SceneBoundary from './ui/SceneBoundary'
import { hasWebGL } from '../lib/webgl'

const SpineStageScene = lazy(() => import('./three/SpineStageScene'))

gsap.registerPlugin(ScrollTrigger)

/** Scroll ilerlemesinden metin durağı (beat) indeksi */
const beatFor = (p: number) => (p < 0.2 ? 0 : p < 0.47 ? 1 : p < 0.74 ? 2 : 3)

export default function SpineStage() {
  const stageRef = useRef<HTMLDivElement>(null)
  const progress = useRef(0)
  const [beat, setBeat] = useState(0)
  const [hovered, setHovered] = useState<SpineRegionId | null>(null)
  const [mounted, setMounted] = useState(false)
  const [onScreen, setOnScreen] = useState(true)
  const stickyRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  /* WebGL bağlamını ilk karede değil, bileşen bağlandıktan hemen sonra kur */
  useEffect(() => {
    if (!hasWebGL()) return
    const id = window.setTimeout(() => setMounted(true), 60)
    return () => window.clearTimeout(id)
  }, [])

  /* Sahne görüş alanından çıkınca WebGL render döngüsü duruyor */
  useEffect(() => {
    const el = stickyRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), {
      rootMargin: '250px 0px',
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  /* Scroll → ilerleme (ref, kare başına React render'ı olmadan) + metin durağı */
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          progress.current = self.progress
          const next = beatFor(self.progress)
          setBeat((prev) => (prev === next ? prev : next))
        },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  const activeBeat = beat > 0 ? stageBeats[beat - 1] : null

  return (
    <section id="top" ref={stageRef} className="relative h-[380vh] lg:h-[460vh]">
      <div ref={stickyRef} className="sticky top-0 h-[100svh] overflow-hidden">
        {/* Zemin doku çizgileri — renk genel yüzeyden gelir */}
        <div className="pointer-events-none absolute inset-0 -z-10 grid-lines opacity-35 [mask-image:radial-gradient(75%_65%_at_50%_40%,black,transparent)]" />

        {/* Taslaktaki akış çizgisi */}
        <svg
          aria-hidden
          viewBox="0 0 1440 420"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-x-0 top-0 h-[38vh] w-full"
        >
          <motion.path
            d="M -20 300 C 240 300, 380 120, 640 118 C 900 116, 1020 236, 1200 250 C 1330 260, 1400 210, 1460 120"
            fill="none"
            stroke="url(#stroke-aurora)"
            strokeWidth="1.5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          />
          <defs>
            <linearGradient id="stroke-aurora" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8a5a33" stopOpacity="0" />
              <stop offset="35%" stopColor="#8a5a33" stopOpacity="0.55" />
              <stop offset="70%" stopColor="#7a8f5c" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#c08f3c" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* 3B sahne */}
        <div className="absolute inset-0">
          {mounted && (
            <SceneBoundary>
              <Suspense fallback={null}>
                <SpineStageScene
                  progress={progress}
                  active={onScreen}
                  labelsVisible={beat > 0}
                  hovered={hovered}
                  onHover={setHovered}
                  isMobile={isMobile}
                />
              </Suspense>
            </SceneBoundary>
          )}
        </div>

        {/* Giriş (beat 0) */}
        <AnimatePresence>
          {beat === 0 && (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30, filter: 'blur(6px)' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-none absolute inset-0 flex items-end pb-28 lg:items-center lg:pb-0"
            >
              <div className="section-shell">
                <div className="max-w-2xl">
                  <motion.span
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.7 }}
                    className="font-display text-[0.7rem] font-bold tracking-[0.42em] text-ink-500 uppercase"
                  >
                    {doctor.titles}
                  </motion.span>

                  <h1 className="mt-4 font-wordmark text-[clamp(3.4rem,10vw,7rem)] leading-[0.95] font-normal tracking-[-0.012em]">
                    <ShinyText
                      text={doctor.name}
                      speed={6}
                      color="#5b4633"
                      shineColor="#d9b98e"
                      spread={100}
                    />
                  </h1>

                  <p className="lead mt-6 max-w-lg">
                    Ağrıyı susturmak yetmez; sebebini bulmak gerekir. Omurga, duruş ve hareket
                    bütününü tek bir zincir olarak değerlendiren bütüncül bir tedavi yaklaşımı.
                  </p>

                  <div className="pointer-events-auto mt-9 flex flex-wrap items-center gap-3">
                    <a
                      href="#iletisim"
                      className="group inline-flex items-center gap-2 rounded-full bg-ink-900 px-7 py-3.5 font-display text-[0.95rem] font-bold text-sand-50 shadow-[0_18px_40px_-18px_rgb(58_42_28/0.85)] transition-colors hover:bg-brand-700"
                    >
                      Randevu Oluştur
                      <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </a>
                    <a
                      href="#skolyoz"
                      className="inline-flex items-center gap-2 rounded-full border border-ink-300/80 px-7 py-3.5 font-display text-[0.95rem] font-bold text-ink-800 transition-colors hover:border-brand-500 hover:text-brand-700"
                    >
                      Skolyoz Tedavisi
                      <ArrowDown className="size-4" />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Duraklar (beat 1–3) */}
        <div
          className="pointer-events-none absolute inset-0 flex items-end pb-24 transition-opacity duration-500 lg:items-center lg:pb-0"
          style={{ opacity: hovered ? 0.28 : 1 }}
        >
          <div className="section-shell w-full">
            <div className="grid grid-cols-1 items-center gap-3 lg:grid-cols-12 lg:gap-6">
              <AnimatePresence mode="wait">
                {activeBeat && (
                  <motion.div
                    key={activeBeat.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45 }}
                    className="contents"
                  >
                    {activeBeat.items.map((item, i) => (
                      <motion.div
                        key={item.title}
                        initial={{ opacity: 0, y: 28, filter: 'blur(8px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -22, filter: 'blur(8px)' }}
                        transition={{ duration: 0.75, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                        className={
                          item.align === 'left'
                            ? 'lg:col-span-3 lg:col-start-1 lg:-translate-y-[13vh]'
                            : 'lg:col-span-3 lg:col-start-10 lg:translate-y-[14vh] lg:text-right'
                        }
                      >
                        <div>
                          <span className="font-display text-[clamp(1.6rem,7vw,3.4rem)] leading-none font-extrabold tracking-[-0.03em] gradient-text">
                            {item.kicker}
                          </span>
                          <p className="mt-1.5 font-display text-xl font-extrabold tracking-[-0.02em] text-ink-900 sm:text-2xl lg:mt-3 lg:text-3xl">
                            {item.title}
                          </p>
                          <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-700 lg:mt-3 lg:text-[0.98rem]">
                            {item.text}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Alt bilgi çubuğu */}
        <div className="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center sm:bottom-6">
          <AnimatePresence mode="wait">
            {beat === 0 ? (
              <motion.span
                key="cue"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="hidden flex-col items-center gap-2 font-display text-[0.68rem] font-bold tracking-[0.24em] text-ink-500 uppercase sm:flex"
              >
                Keşfetmek için kaydırın
                <motion.span
                  animate={{ y: [0, 7, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ArrowDown className="size-4" />
                </motion.span>
              </motion.span>
            ) : (
              <motion.span
                key="hint"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="hidden text-[0.76rem] font-medium tracking-[0.02em] text-ink-500 lg:block"
              >
                Omurganın bir bölgesine gelin — bölge vurgulansın, bilgisi açılsın
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Durak göstergesi */}
        <div className="pointer-events-none absolute top-1/2 right-5 hidden -translate-y-1/2 flex-col gap-2.5 lg:flex">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="h-6 w-[3px] rounded-full transition-all duration-500"
              style={{
                background: i === beat ? 'var(--color-ink-900)' : 'var(--color-ink-200)',
                transform: i === beat ? 'scaleY(1.35)' : 'scaleY(1)',
              }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
