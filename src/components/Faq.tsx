import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { faqs } from '../lib/content'
import Reveal from './ui/Reveal'
import { Plus } from './ui/icons'

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="sss" className="relative scroll-mt-28 py-24 sm:py-28">
      <div className="section-shell">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-4">
            <Reveal>
              <span className="eyebrow">Sık Sorulanlar</span>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="title-lg mt-6">
                Aklınızdaki
                <br />
                <span className="gradient-text">soruların</span> cevabı.
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-5 text-[1rem] leading-relaxed text-ink-500">
                Cevabını bulamadığınız bir soru varsa yazmanız yeterli; aynı gün içinde dönüş
                yapıyorum.
              </p>
            </Reveal>
          </div>

          <div className="lg:col-span-8">
            <div className="flex flex-col gap-3">
              {faqs.map((faq, i) => {
                const active = open === i
                return (
                  <Reveal key={faq.q} delay={i * 0.05}>
                    <div
                      className={`overflow-hidden rounded-2xl border transition-all duration-500 ${
                        active
                          ? 'border-transparent bg-white shadow-lift'
                          : 'border-white/70 bg-white/60 hover:bg-white/85'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setOpen(active ? null : i)}
                        aria-expanded={active}
                        className="flex w-full items-center justify-between gap-5 px-6 py-5 text-left sm:px-7"
                      >
                        <span className="font-display text-[1.05rem] font-bold text-ink-900 sm:text-[1.15rem]">
                          {faq.q}
                        </span>
                        <span
                          className={`grid size-8 shrink-0 place-items-center rounded-full transition-all duration-500 ${
                            active ? 'rotate-45 bg-ink-900 text-sand-50' : 'bg-sand-100 text-ink-600'
                          }`}
                        >
                          <Plus className="size-4" />
                        </span>
                      </button>
                      <AnimatePresence initial={false}>
                        {active && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                          >
                            <p className="px-6 pb-6 text-[0.98rem] leading-relaxed text-ink-600 sm:px-7">
                              {faq.a}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </Reveal>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
