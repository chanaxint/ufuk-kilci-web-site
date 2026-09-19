import { motion } from 'motion/react'
import { credentials, doctor, philosophy } from '../lib/content'
import Reveal from './ui/Reveal'
import MagneticButton from './ui/MagneticButton'
import { ArrowRight, Check, Sparkle } from './ui/icons'

export default function About() {
  return (
    <section id="hakkimda" className="relative scroll-mt-28 py-24 sm:py-28">
      <div className="section-shell">
        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-14">
          {/* Fotoğraf kompozisyonu */}
          <Reveal className="lg:col-span-5">
            <div className="relative">
              <div className="absolute -top-5 -left-5 hidden size-40 rounded-3xl bg-gradient-to-br from-brand-200/70 to-vital-100/60 blur-2xl sm:block" />
              <motion.div
                initial={{ rotate: -3, scale: 0.97 }}
                whileInView={{ rotate: -2.5, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 rounded-[2.25rem] border border-white/80 bg-gradient-to-br from-brand-100/80 via-white/60 to-sand-200/80 shadow-soft"
              />
              <div className="relative overflow-hidden rounded-[2.25rem] border border-white/80 shadow-lift">
                <motion.img
                  src={doctor.photo}
                  alt={`${doctor.name} — ${doctor.titles}`}
                  width={1080}
                  height={1080}
                  loading="lazy"
                  initial={{ scale: 1.08 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                  className="aspect-square w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/25 via-transparent to-transparent" />
              </div>

              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-7 -left-3 w-[13.5rem] rounded-2xl border border-white/80 bg-white/92 p-4 shadow-lift backdrop-blur-md sm:-left-7"
              >
                <span className="grid size-9 place-items-center rounded-xl bg-vital-100 text-vital-700">
                  <Sparkle className="size-4.5" />
                </span>
                <p className="mt-3 font-display text-sm leading-snug font-extrabold text-ink-900">
                  Osteopatik değerlendirme
                </p>
                <p className="mt-1 text-[0.76rem] leading-snug text-ink-500">
                  Bölgesel şikâyeti bütün vücut zinciriyle birlikte okuyan muayene yaklaşımı.
                </p>
              </motion.div>
            </div>
          </Reveal>

          {/* Metin sütunu */}
          <div className="lg:col-span-7">
            <Reveal>
              <span className="eyebrow">Hakkımda</span>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="title-lg mt-6">
                {doctor.name},
                <br />
                <span className="text-ink-500">Fizyoterapist — Osteopat</span>
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="lead mt-6">
                On iki yılı aşkın klinik deneyimimde bel ve boyun problemlerinden sporcu
                yaralanmalarına kadar geniş bir yelpazede çalıştım. Tedaviye her zaman aynı soruyla
                başlıyorum: <em className="text-ink-800 not-italic">bu ağrı neden burada?</em>
              </p>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-4 text-[1.02rem] leading-relaxed text-ink-600">
                Manuel terapi ve osteopatik teknikleri, ölçülebilir hedeflerle ilerleyen egzersiz
                programlarıyla birleştiriyorum. Amacım seans sayısını uzatmak değil; hastanın kendi
                bedenini yönetebildiği, ağrısız ve sürdürülebilir bir noktaya en kısa sürede ulaşmak.
              </p>
            </Reveal>

            {/* Yaklaşım kartları */}
            <div className="mt-9 grid gap-3 sm:grid-cols-3">
              {philosophy.map((item, i) => (
                <Reveal key={item.title} delay={0.2 + i * 0.07}>
                  <div className="h-full rounded-2xl border border-white/70 bg-white/70 p-5 shadow-soft backdrop-blur-sm transition-transform duration-500 hover:-translate-y-1">
                    <span className="grid size-8 place-items-center rounded-lg bg-brand-100 text-brand-700">
                      <Check className="size-4" />
                    </span>
                    <p className="mt-3 font-display text-[0.98rem] font-bold text-ink-900">{item.title}</p>
                    <p className="mt-1.5 text-[0.84rem] leading-snug text-ink-500">{item.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Eğitim & sertifikalar */}
            <Reveal delay={0.24}>
              <div className="mt-10 rounded-3xl border border-white/70 bg-white/60 p-6 shadow-soft backdrop-blur-sm sm:p-7">
                <p className="font-display text-[0.7rem] font-bold tracking-[0.2em] text-ink-500 uppercase">
                  Eğitim & Sertifikalar
                </p>
                <ul className="mt-5 flex flex-col">
                  {credentials.map((c, i) => (
                    <li
                      key={c.title}
                      className="group grid grid-cols-[3.5rem_1fr] items-start gap-4 border-t border-ink-200/50 py-4 first:border-0 first:pt-0 last:pb-0"
                      style={{ transitionDelay: `${i * 40}ms` }}
                    >
                      <span className="font-display text-sm font-extrabold text-brand-600 tabular-nums">
                        {c.year}
                      </span>
                      <span>
                        <span className="block font-display text-[0.98rem] font-bold text-ink-900">
                          {c.title}
                        </span>
                        <span className="mt-0.5 block text-[0.84rem] text-ink-500">{c.org}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="mt-8">
                <MagneticButton href="#iletisim">
                  Birlikte çalışalım
                  <ArrowRight className="size-4" />
                </MagneticButton>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
