import { motion } from 'motion/react'
import { doctor, stats } from '../lib/content'
import Reveal from './ui/Reveal'
import CountUp from './ui/CountUp'
import ShinyText from './reactbits/ShinyText'
import { ArrowRight, Sparkle } from './ui/icons'

/* Kart yüzeyi yok; bölümler yalnızca ince bir üst çizgiyle ayrılıyor */
const tile =
  'relative border-t border-ivory-100/18 pt-6 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1'

export default function About() {
  return (
    <section id="hakkimda" className="relative scroll-mt-28 py-24 sm:py-28">
      <div className="section-shell">
        <div className="max-w-2xl">
          <Reveal>
            <h2 className="title-lg">
              Tedaviye her zaman aynı soruyla başlarım:{' '}
              <span className="gradient-text">bu ağrı neden burada?</span>
            </h2>
          </Reveal>
        </div>

        {/* Bento ızgara */}
        <div className="mt-14 grid auto-rows-auto grid-cols-1 gap-x-10 gap-y-11 sm:grid-cols-2 lg:grid-cols-4">
          {/* Fotoğraf */}
          <Reveal className="sm:col-span-2 lg:row-span-2">
            <div className="group relative h-full overflow-hidden rounded-3xl shadow-lift">
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
                className="h-full max-h-[26rem] min-h-[20rem] w-full object-cover lg:max-h-none transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/75 via-ink-950/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7">
                <p className="font-wordmark text-3xl font-normal tracking-[-0.01em]">
                  <ShinyText text={doctor.name} speed={6} color="#f3e7d6" shineColor="#ffffff" spread={100} />
                </p>
                <p className="mt-1.5 font-display text-[0.68rem] font-bold tracking-[0.24em] text-brand-200 uppercase">
                  {doctor.titles}
                </p>
              </div>
            </div>
          </Reveal>

          {/* Tanıtım */}
          <Reveal delay={0.06} className="sm:col-span-2">
            <div className={`${tile} h-full`}>
              <span className="grid size-10 place-items-center rounded-2xl bg-brand-100 text-brand-700">
                <Sparkle className="size-5" />
              </span>
              <p className="mt-5 text-[1.02rem] leading-relaxed text-ivory-200">
                On iki yılı aşkın klinik deneyimimde bel ve boyun problemlerinden sporcu
                yaralanmalarına, skolyozdan ameliyat sonrası rehabilitasyona kadar geniş bir
                yelpazede çalıştım.
              </p>
              <p className="mt-4 text-[0.95rem] leading-relaxed text-ivory-300">
                Manuel terapi ve osteopatik teknikleri ölçülebilir hedeflerle ilerleyen egzersiz
                programlarıyla birleştiriyorum. Amacım seans sayısını uzatmak değil; bedeninizi
                yönetebildiğiniz noktaya en kısa sürede ulaşmak.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 border-t border-ivory-100/14 pt-5">
                {['Manuel Terapi', 'Osteopati', 'Schroth', 'Kuru İğneleme'].map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-ivory-100/22 px-3.5 py-1.5 font-display text-[0.76rem] font-semibold text-ivory-300"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Sayılar */}
          {stats.slice(0, 2).map((stat, i) => (
            <Reveal key={stat.label} delay={0.12 + i * 0.06}>
              <div className={`${tile} h-full`}>
                <p className="font-display text-4xl font-extrabold tracking-[-0.03em] text-ivory-50 sm:text-5xl">
                  <CountUp value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-2 text-[0.88rem] leading-snug text-ivory-300">{stat.label}</p>
              </div>
            </Reveal>
          ))}

          {/* Çağrı — artık ızgaranın tamamına yayılan bir şerit */}
          <Reveal delay={0.24} className="sm:col-span-2 lg:col-span-4">
            <a
              href="#iletisim"
              className="group relative flex h-full flex-col gap-6 overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 via-ink-800 to-brand-700 px-7 py-8 shadow-lift transition-transform duration-500 hover:-translate-y-1 sm:flex-row sm:items-center sm:justify-between sm:px-9"
            >
              <div className="pointer-events-none absolute inset-0 grid-lines opacity-20" />
              <span className="relative">
                <span className="block font-display text-[0.68rem] font-bold tracking-[0.2em] text-brand-200 uppercase">
                  Randevu
                </span>
                <span className="mt-2 block font-display text-xl leading-tight font-extrabold text-sand-50 sm:text-2xl">
                  Birlikte çalışalım
                </span>
              </span>
              <span className="relative inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-sand-50 text-ink-900 transition-transform duration-500 group-hover:translate-x-1">
                <ArrowRight className="size-4" />
              </span>
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
