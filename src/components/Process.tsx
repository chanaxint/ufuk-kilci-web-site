import { useRef } from 'react'
import { motion, useScroll, useSpring, useTransform } from 'motion/react'
import { processSteps } from '../lib/content'
import Reveal from './ui/Reveal'
import { Clock } from './ui/icons'

export default function Process() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 75%', 'end 55%'] })
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 })
  const height = useTransform(progress, (v) => `${v * 100}%`)

  return (
    <section id="surec" className="relative scroll-mt-28 overflow-hidden py-24 sm:py-28">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-white/50 to-transparent" />
      <div className="section-shell">
        <div className="max-w-2xl">
          <Reveal>
            <span className="eyebrow">Nasıl İlerliyoruz</span>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className="title-lg mt-6">
              İlk seanstan kalıcı sonuca, <span className="gradient-text">net bir yol haritası</span>.
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="lead mt-5">
              Süreç boyunca nerede olduğunuzu ve bir sonraki adımı her zaman bilirsiniz. Belirsizlik,
              tedavinin en büyük engellerinden biridir.
            </p>
          </Reveal>
        </div>

        <div ref={ref} className="relative mt-14 pl-10 sm:pl-14">
          {/* Dikey ilerleme çizgisi */}
          <div className="absolute top-2 bottom-2 left-3 w-px bg-ink-200/60">
            <motion.div
              style={{ height }}
              className="w-full bg-gradient-to-b from-brand-600 via-brand-500 to-vital-500"
            />
          </div>

          <div className="flex flex-col gap-5">
            {processSteps.map((step, i) => (
              <Reveal key={step.step} delay={i * 0.08}>
                <div className="group relative">
                  <span className="absolute top-8 -left-10 grid size-6 place-items-center rounded-full border-2 border-sand-50 bg-white shadow-[0_0_0_1px_rgb(11_31_56/0.08)] transition-colors duration-500 group-hover:bg-brand-600 sm:-left-14">
                    <span className="size-2 rounded-full bg-brand-500 transition-colors duration-500 group-hover:bg-white" />
                  </span>

                  <div className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-soft backdrop-blur-sm transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1 group-hover:shadow-lift sm:p-8">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="font-display text-4xl font-extrabold tracking-[-0.03em] text-ink-200 transition-colors duration-500 group-hover:text-brand-200">
                        {step.step}
                      </span>
                      <h3 className="font-display text-xl font-extrabold text-ink-900 sm:text-2xl">
                        {step.title}
                      </h3>
                      <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-sand-100 px-3 py-1.5 font-display text-[0.74rem] font-bold text-ink-600">
                        <Clock className="size-3.5" />
                        {step.duration}
                      </span>
                    </div>
                    <p className="mt-4 max-w-2xl text-[0.98rem] leading-relaxed text-ink-600">
                      {step.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
