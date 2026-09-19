import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'motion/react'
import { angleStages } from '../lib/content'
import Reveal from './ui/Reveal'
import type { SpineView } from './three/ScoliosisAngleScene'
import { Rotate3D } from './ui/icons'

const ScoliosisAngleScene = lazy(() => import('./three/ScoliosisAngleScene'))

const MAX = 50
const TICKS = [0, 15, 30, 45, 50]

const stageFor = (angle: number) =>
  angleStages.find((s) => angle < s.max) ?? angleStages[angleStages.length - 1]

export default function ScoliosisAngles() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-20% 0px' })
  const [angle, setAngle] = useState(0)
  const [view, setView] = useState<SpineView>('front')

  /* Bölüm görünüme girdiğinde eğriliği bir kez canlandır */
  useEffect(() => {
    if (!inView) return
    const id = window.setTimeout(() => setAngle(28), 450)
    return () => window.clearTimeout(id)
  }, [inView])

  const stage = stageFor(angle)
  const pct = (angle / MAX) * 100

  return (
    <section id="skolyoz-acilari" className="relative scroll-mt-28 py-24 sm:py-28">
      <div className="section-shell">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <span className="eyebrow">Cobb Açısı</span>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="title-lg mt-7">Skolyoz Açıları</h2>
          </Reveal>
          <Reveal delay={0.14}>
            <p className="lead mt-6">
              Eğriliğin derecesi, tedavinin yönünü belirler. Skalayı hareket ettirin; omurganın
              yalnızca yana eğilmediğini, aynı anda kendi ekseni etrafında da döndüğünü modelin
              üzerinde görün. "Üstten" görünüm bu rotasyonu en net gösteren açıdır.
            </p>
          </Reveal>
        </div>

        <div ref={ref} className="mt-16 grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Omurga çizimi + skala */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md rounded-[2rem] border border-white/70 bg-gradient-to-b from-white/80 via-brand-50/60 to-sand-100/80 px-6 pt-4 pb-8 shadow-lift backdrop-blur-sm">
              <div className="pointer-events-none absolute inset-0 grid-lines rounded-[2rem] opacity-40" />

              {/* Görünüm değiştirici */}
              <div className="relative z-10 flex items-center justify-between gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/70 px-3 py-1.5 font-display text-[0.62rem] font-bold tracking-[0.14em] text-ink-500 uppercase backdrop-blur">
                  <Rotate3D className="size-3.5 text-brand-600" />
                  Sürükleyin
                </span>
                <div className="flex rounded-full border border-white/70 bg-white/70 p-1 backdrop-blur">
                  {([
                    ['front', 'Önden'],
                    ['top', 'Üstten'],
                  ] as const).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setView(key)}
                      className={`rounded-full px-3.5 py-1.5 font-display text-[0.72rem] font-bold transition-colors duration-300 ${
                        view === key ? 'bg-ink-900 text-sand-50' : 'text-ink-600 hover:text-ink-900'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative h-[20rem] sm:h-[26rem]">
                {inView && (
                  <Suspense fallback={null}>
                    <ScoliosisAngleScene angle={angle} color={stage.color} view={view} />
                  </Suspense>
                )}
              </div>

              {/* Skala */}
              <div className="relative mt-2 px-1">
                <div className="relative h-1.5 rounded-full bg-ink-200/50">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-[width,background-color] duration-300"
                    style={{ width: `${pct}%`, background: stage.color }}
                  />
                  <span
                    className="pointer-events-none absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-ink-900 shadow-lift transition-[left] duration-300"
                    style={{ left: `${pct}%` }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={MAX}
                    step={1}
                    value={angle}
                    onChange={(e) => setAngle(Number(e.target.value))}
                    aria-label="Cobb açısı"
                    className="absolute inset-x-0 -top-3 h-8 w-full cursor-pointer opacity-0"
                  />
                </div>

                <div className="mt-4 flex justify-between">
                  {TICKS.map((tick) => (
                    <button
                      key={tick}
                      type="button"
                      onClick={() => setAngle(tick)}
                      className={`font-display text-[0.78rem] font-bold tabular-nums transition-colors duration-300 ${
                        angle === tick ? 'text-ink-900' : 'text-ink-500 hover:text-ink-800'
                      }`}
                    >
                      {tick}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Evre bilgisi */}
          <div className="lg:col-span-7 lg:pl-6">
            <div className="flex items-end gap-4">
              <span
                className="font-display text-[clamp(3.5rem,9vw,6rem)] leading-[0.85] font-extrabold tracking-[-0.04em] tabular-nums transition-colors duration-300"
                style={{ color: stage.color }}
              >
                {angle}°
              </span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={stage.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35 }}
                  className="mb-2 font-display text-xl font-extrabold text-ink-900 sm:text-2xl"
                >
                  {stage.label}
                </motion.span>
              </AnimatePresence>
            </div>

            <AnimatePresence mode="wait">
              <motion.p
                key={stage.text}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}
                className="mt-6 max-w-xl text-[1.05rem] leading-relaxed text-ink-600"
              >
                {stage.text}
              </motion.p>
            </AnimatePresence>

            {/* Evre listesi */}
            <div className="mt-10 flex flex-col gap-2.5">
              {angleStages.map((item) => {
                const active = item.label === stage.label
                return (
                  <div
                    key={item.label}
                    className={`flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border px-5 py-4 transition-all duration-500 ${
                      active
                        ? 'border-transparent bg-white shadow-lift'
                        : 'border-white/60 bg-white/45'
                    }`}
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full transition-transform duration-500"
                      style={{ background: item.color, transform: active ? 'scale(1.5)' : 'scale(1)' }}
                    />
                    <span className="font-display text-[0.95rem] font-bold whitespace-nowrap text-ink-900">
                      {item.range}
                    </span>
                    <span className="text-[0.92rem] text-ink-600">{item.action}</span>
                  </div>
                )
              })}
            </div>

            <p className="mt-7 text-[0.84rem] leading-relaxed text-ink-500">
              Cobb açısı yalnızca röntgen üzerinde ölçülür. Buradaki görsel, aralıkların ne anlama
              geldiğini anlatmak içindir; tanı ve tedavi kararı klinik değerlendirmeyle verilir.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
