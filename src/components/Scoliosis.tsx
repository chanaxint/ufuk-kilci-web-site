import { motion } from 'motion/react'
import { scoliosis } from '../lib/content'
import Reveal from './ui/Reveal'
import { Check } from './ui/icons'

export default function Scoliosis() {
  return (
    <section id="skolyoz" className="relative scroll-mt-28 pt-28 pb-20 sm:pt-36 sm:pb-24">
      <div className="section-shell">
        {/* Başlık — ortalanmış, bol boşluklu */}
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <h2 className="title-lg">Skolyoz Nedir?</h2>
          </Reveal>
          <Reveal delay={0.14}>
            <p className="lead mt-7">{scoliosis.definition}</p>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-5 font-display text-[1.05rem] font-bold text-ivory-100">{scoliosis.note}</p>
          </Reveal>
        </div>

        {/* Belirtiler */}
        <div className="mx-auto mt-20 max-w-4xl">
          <Reveal>
            <h3 className="text-center font-display text-2xl font-extrabold tracking-[-0.02em] text-ivory-50 sm:text-3xl">
              Skolyoz belirtileri
            </h3>
          </Reveal>

          <ul className="mt-10 flex flex-col">
            {scoliosis.symptoms.map((symptom, i) => (
              <motion.li
                key={symptom}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10% 0px' }}
                transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="group flex items-start gap-5 border-b border-ivory-100/18 py-6 last:border-0"
              >
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700 transition-colors duration-500 group-hover:bg-brand-600 group-hover:text-white">
                  <Check className="size-4" />
                </span>
                <p className="text-[1.05rem] leading-relaxed text-ivory-200">{symptom}</p>
                <span className="ml-auto hidden font-display text-[0.7rem] font-bold text-ivory-400 tabular-nums sm:block">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </motion.li>
            ))}
          </ul>

          <Reveal delay={0.1}>
            <p className="mt-10 text-center text-[0.88rem] leading-relaxed text-ivory-200">
              Bu belirtilerden birini fark ettiyseniz erken değerlendirme önemlidir; büyüme çağında
              eğrilik sessizce ilerleyebilir.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
