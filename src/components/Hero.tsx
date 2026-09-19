import { motion } from 'motion/react'
import { doctor, stats, trustBadges } from '../lib/content'
import CountUp from './ui/CountUp'
import MagneticButton from './ui/MagneticButton'
import Marquee from './ui/Marquee'
import SpineGlyph from './ui/SpineGlyph'
import { ArrowDown, ArrowRight, Check, Clock, Star } from './ui/icons'

const fade = {
  hidden: { opacity: 0, y: 22, filter: 'blur(6px)' },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.85, delay: 0.1 + i * 0.09, ease: [0.16, 1, 0.3, 1] as const },
  }),
}

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-32 pb-16 sm:pt-36 lg:pt-44">
      {/* Zemin katmanları */}
      <div className="pointer-events-none absolute inset-0 grid-lines [mask-image:radial-gradient(70%_60%_at_50%_30%,black,transparent)]" />
      <div className="pointer-events-none absolute -top-24 -right-32 size-[34rem] rounded-full bg-gradient-to-br from-brand-200/60 to-vital-100/0 blur-3xl" />
      <div className="pointer-events-none absolute top-64 -left-40 size-[28rem] rounded-full bg-gradient-to-tr from-vital-100/80 to-transparent blur-3xl" />

      <div className="section-shell relative">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Metin sütunu */}
          <div className="lg:col-span-6 xl:col-span-6">
            <motion.div custom={0} variants={fade} initial="hidden" animate="show">
              <span className="eyebrow">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-pulse-ring rounded-full bg-vital-500" />
                  <span className="relative inline-flex size-2 rounded-full bg-vital-600" />
                </span>
                Yeni hasta kabulü açık
              </span>
            </motion.div>

            <motion.h1 custom={1} variants={fade} initial="hidden" animate="show" className="title-xl mt-6">
              Ağrıyı susturmak değil,
              <br />
              <span className="gradient-text">sebebini bulmak</span> için
              <br />
              buradayım.
            </motion.h1>

            <motion.p custom={2} variants={fade} initial="hidden" animate="show" className="lead mt-6 max-w-xl">
              Fizyoterapist ve osteopat <strong className="font-semibold text-ink-800">{doctor.name}</strong>.
              Omurga, duruş ve hareket bütününü tek bir zincir olarak değerlendirip; manuel terapi,
              osteopatik teknikler ve kişiye özel egzersizle kalıcı sonuç hedefliyorum.
            </motion.p>

            <motion.div
              custom={3}
              variants={fade}
              initial="hidden"
              animate="show"
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <MagneticButton href="#iletisim">
                Randevu Oluştur
                <ArrowRight className="size-4" />
              </MagneticButton>
              <MagneticButton href="#omurga" variant="ghost">
                Omurga Haritasını İncele
                <ArrowDown className="size-4" />
              </MagneticButton>
            </motion.div>

            <motion.ul
              custom={4}
              variants={fade}
              initial="hidden"
              animate="show"
              className="mt-8 flex flex-wrap gap-x-6 gap-y-3"
            >
              {['Aynı gün değerlendirme', '45 dakikalık ilk seans', 'Ev programı takibi'].map((item) => (
                <li key={item} className="flex items-center gap-2 text-[0.92rem] font-medium text-ink-600">
                  <span className="grid size-5 place-items-center rounded-full bg-vital-100 text-vital-700">
                    <Check className="size-3.5" />
                  </span>
                  {item}
                </li>
              ))}
            </motion.ul>
          </div>

          {/* Görsel kompozisyon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative lg:col-span-6 xl:col-span-6"
          >
            <div className="relative mx-auto aspect-[4/4.6] w-[min(30rem,100%)]">
              <div className="absolute inset-0 rotate-2 rounded-[2.5rem] border border-white/70 bg-gradient-to-br from-white/80 via-sand-100/70 to-brand-100/60 shadow-lift backdrop-blur-sm" />
              <div className="absolute inset-0 -rotate-1 overflow-hidden rounded-[2.5rem] border border-white/80 bg-gradient-to-b from-white/90 to-sand-100/80 shadow-soft">
                <div className="absolute inset-0 grid-lines opacity-60" />
                <SpineGlyph className="absolute inset-0 size-full p-7" />
              </div>

              {/* Yüzen bilgi kartları */}
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-5 -left-4 flex items-center gap-3 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-lift backdrop-blur-md sm:-left-8"
              >
                <span className="grid size-9 place-items-center rounded-xl bg-brand-100 text-brand-700">
                  <Clock className="size-4.5" />
                </span>
                <span className="leading-tight">
                  <span className="block font-display text-sm font-extrabold text-ink-900">45 dakika</span>
                  <span className="block text-[0.72rem] text-ink-500">Detaylı ilk değerlendirme</span>
                </span>
              </motion.div>

              <motion.div
                animate={{ y: [0, 14, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
                className="absolute -right-3 bottom-16 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-lift backdrop-blur-md sm:-right-8"
              >
                <div className="flex items-center gap-1 text-warm-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3.5" />
                  ))}
                </div>
                <span className="mt-1 block font-display text-sm font-extrabold text-ink-900">4.9 / 5.0</span>
                <span className="block text-[0.72rem] text-ink-500">120+ hasta değerlendirmesi</span>
              </motion.div>

              <div className="absolute -bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/80 bg-ink-900 px-5 py-2.5 shadow-lift">
                <span className="size-1.5 rounded-full bg-vital-500" />
                <span className="font-display text-[0.7rem] font-bold tracking-[0.18em] text-sand-50 uppercase">
                  Manuel Terapi · Osteopati
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* İstatistik şeridi */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/70 bg-ink-200/50 shadow-soft lg:grid-cols-4"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white/80 px-6 py-7 backdrop-blur-sm">
              <p className="font-display text-3xl font-extrabold tracking-[-0.02em] text-ink-900 sm:text-4xl">
                <CountUp value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-1.5 text-[0.86rem] leading-snug text-ink-500">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        <div className="mt-10">
          <Marquee items={trustBadges} />
        </div>
      </div>
    </section>
  )
}
