import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { processSteps } from '../lib/content'
import Reveal from './ui/Reveal'
import { Check, Clock } from './ui/icons'

const ProcessSpineScene = lazy(() => import('./three/ProcessSpineScene'))

/** Adım ilerledikçe koyulaşan vurgu rengi */
const stepColors = ['#e6a13c', '#1668b8', '#0e9484']

gsap.registerPlugin(ScrollTrigger)

export default function Process() {
  const root = useRef<HTMLDivElement>(null)
  const cards = useRef<(HTMLDivElement | null)[]>([])
  const list = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [showScene, setShowScene] = useState(false)
  const sceneReady = useRef(false)


  /*
   * Sol panel, merkez çizgisine en yakın adımı gösterir. Konumlar her karede
   * ölçüldüğü için sahne geç yüklense ya da yazı tipleri sonradan otursa bile
   * eşleşme kaymaz.
   */
  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: list.current as HTMLElement,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: () => {
          /*
           * Sahneyi bölüm yaklaşınca kur. IntersectionObserver hızlı kaydırmada
           * ara konumları atlayabildiği için kontrol her güncellemede yapılıyor.
           */
          if (!sceneReady.current && window.innerWidth >= 1024) {
            const rect = (list.current as HTMLElement).getBoundingClientRect()
            if (rect.top < window.innerHeight * 1.5 && rect.bottom > -window.innerHeight * 0.5) {
              sceneReady.current = true
              setShowScene(true)
            }
          }

          const mid = window.innerHeight * 0.45
          let best = 0
          let bestDistance = Number.POSITIVE_INFINITY
          cards.current.forEach((card, i) => {
            if (!card) return
            const rect = card.getBoundingClientRect()
            const distance = Math.abs(rect.top + rect.height / 2 - mid)
            if (distance < bestDistance) {
              bestDistance = distance
              best = i
            }
          })
          setActive((prev) => (prev === best ? prev : best))
        },
      })
    }, root)
    return () => ctx.revert()
  }, [])

  const step = processSteps[active]

  return (
    <section id="surec" ref={root} className="relative scroll-mt-28 py-24 sm:py-28">
      <div className="section-shell">
        <div className="max-w-2xl">
          <Reveal>
            <span className="eyebrow">Nasıl İlerliyoruz</span>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className="title-lg mt-6">
              İlk seanstan kalıcı sonuca, <span className="gradient-text">üç adımda</span>.
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="lead mt-5">
              Süreç boyunca nerede olduğunuzu ve bir sonraki adımı her zaman bilirsiniz. Belirsizlik,
              tedavinin en büyük engellerinden biridir.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Sabit kalan özet paneli */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              {/* Temsilî izlem görseli */}
              <div className="relative mb-8 hidden h-72 overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-b from-white/80 via-brand-50/60 to-sand-100/70 shadow-soft lg:block">
                <div className="pointer-events-none absolute inset-0 grid-lines opacity-40" />
                {showScene && (
                  <Suspense fallback={null}>
                    <ProcessSpineScene angle={step.angle} color={stepColors[active]} />
                  </Suspense>
                )}
                <div className="pointer-events-none absolute inset-x-5 top-4 flex items-start justify-between">
                  <span className="font-display text-[0.6rem] font-bold tracking-[0.18em] text-ink-500 uppercase">
                    Temsilî izlem
                  </span>
                  <span
                    className="font-display text-2xl leading-none font-extrabold tabular-nums transition-colors duration-500"
                    style={{ color: stepColors[active] }}
                  >
                    {step.angle}°
                  </span>
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/85 to-transparent" />
                <div className="pointer-events-none absolute inset-x-5 bottom-4 flex items-center gap-2">
                  {processSteps.map((s2, i) => (
                    <span
                      key={s2.step}
                      className="h-1 flex-1 rounded-full transition-colors duration-500"
                      style={{ background: i <= active ? stepColors[i] : 'rgb(194 209 224 / 0.6)' }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-end gap-5">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={step.step}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -18 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="font-display text-[clamp(3.5rem,8vw,5.5rem)] leading-[0.8] font-extrabold tracking-[-0.04em] gradient-text"
                  >
                    {step.step}
                  </motion.span>
                </AnimatePresence>
                <span className="mb-2 font-display text-[0.7rem] font-bold tracking-[0.2em] text-ink-500 uppercase">
                  / {String(processSteps.length).padStart(2, '0')}
                </span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                >
                  <h3 className="mt-6 font-display text-2xl font-extrabold tracking-[-0.02em] text-ink-900 sm:text-3xl">
                    {step.title}
                  </h3>
                  <p className="mt-4 max-w-md text-[1rem] leading-relaxed text-ink-600">
                    {step.description}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-sand-100 px-4 py-2 font-display text-[0.78rem] font-bold text-ink-700">
                    <Clock className="size-4" />
                    {step.duration}
                  </span>
                </motion.div>
              </AnimatePresence>

              {/* İlerleme (mobil) */}
              <div className="mt-9 flex items-center gap-3 lg:hidden">
                {processSteps.map((s2, i) => (
                  <span
                    key={s2.step}
                    className="h-1 flex-1 overflow-hidden rounded-full bg-ink-200/60"
                    aria-hidden
                  >
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-brand-600 to-vital-500 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                      style={{ transform: `scaleX(${i <= active ? 1 : 0})`, transformOrigin: 'left' }}
                    />
                  </span>
                ))}
              </div>

              <p className="mt-6 hidden max-w-md text-[0.8rem] leading-relaxed text-ink-500 lg:block">
                Görsel temsilîdir; Schroth programıyla izlenen bir olguda eğrilik takibini anlatır.
                Sonuçlar kişiye, yaşa ve eğriliğin tipine göre değişir.
              </p>
            </div>
          </div>

          {/* Sırayla geçen adımlar */}
          <div ref={list} className="flex flex-col lg:col-span-7">
            {processSteps.map((item, i) => (
              <div
                key={item.step}
                ref={(el) => void (cards.current[i] = el)}
                className="flex min-h-[46vh] items-center py-6"
              >
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-15% 0px' }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className={`w-full rounded-3xl border p-7 backdrop-blur-sm transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] sm:p-9 ${
                    active === i
                      ? 'border-transparent bg-white shadow-lift'
                      : 'border-white/60 bg-white/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`grid size-11 place-items-center rounded-2xl font-display text-sm font-extrabold transition-colors duration-700 ${
                        active === i ? 'bg-ink-900 text-sand-50' : 'bg-sand-100 text-ink-500'
                      }`}
                    >
                      {item.step}
                    </span>
                    <h4 className="font-display text-xl font-extrabold text-ink-900 sm:text-2xl">
                      {item.title}
                    </h4>
                  </div>

                  <ul className="mt-7 flex flex-col gap-2.5 border-t border-ink-200/40 pt-6">
                    {item.points.map((point) => (
                      <li key={point} className="flex items-center gap-3 text-[0.92rem] text-ink-700">
                        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-vital-100 text-vital-700">
                          <Check className="size-3" />
                        </span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
