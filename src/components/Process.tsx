import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { processSteps } from '../lib/content'
import Reveal from './ui/Reveal'
import { Check, Clock } from './ui/icons'

gsap.registerPlugin(ScrollTrigger)

export default function Process() {
  const root = useRef<HTMLDivElement>(null)
  const cards = useRef<(HTMLDivElement | null)[]>([])
  const [active, setActive] = useState(0)

  /* Her adım, ekranın ortasına geldiğinde sol paneli devralır */
  useEffect(() => {
    const ctx = gsap.context(() => {
      cards.current.forEach((card, i) => {
        if (!card) return
        ScrollTrigger.create({
          trigger: card,
          start: 'top 60%',
          end: 'bottom 60%',
          onToggle: (self) => self.isActive && setActive(i),
        })
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
            <div className="lg:sticky lg:top-32">
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

              {/* İlerleme */}
              <div className="mt-9 flex items-center gap-3">
                {processSteps.map((s, i) => (
                  <span
                    key={s.step}
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
            </div>
          </div>

          {/* Sırayla geçen adımlar */}
          <div className="flex flex-col lg:col-span-7">
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
