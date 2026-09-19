import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import Reveal from './ui/Reveal'
import {
  hotspotPosition,
  spineRegions,
  vertebraLabel,
  type SpineHit,
  type SpineRegion,
} from '../lib/spine'
import { Cursor, Rotate3D, Sparkle } from './ui/icons'

const SpineScene = lazy(() => import('./three/SpineScene'))

const hints = [
  { icon: Rotate3D, label: 'Sürükleyerek döndür' },
  { icon: Cursor, label: 'Bir bölgeye tıkla' },
  { icon: Sparkle, label: 'Tekerlekle yakınlaş' },
]

export default function SpineSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [hit, setHit] = useState<SpineHit | null>(null)
  const [hovered, setHovered] = useState<SpineRegion | null>(null)

  const selected = hit?.region ?? null

  /* WebGL bağlamını yalnızca bölüm görünüme yaklaşınca kur. */
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setMounted(true)
          io.disconnect()
        }
      },
      { rootMargin: '400px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const selectRegion = (region: SpineRegion) => {
    setHit({ region, h: region.focus, point: hotspotPosition(region) })
  }

  return (
    <section id="omurga" ref={sectionRef} className="relative scroll-mt-28 py-24 sm:py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ink-200 to-transparent" />

      <div className="section-shell">
        <div className="grid gap-10 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-12 lg:gap-y-8">
          {/* Başlık — mobilde 3B sahnenin üstünde kalır */}
          <div className="order-1 lg:col-span-5">
            <Reveal>
              <span className="eyebrow">Etkileşimli Omurga Haritası</span>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="title-lg mt-6">
                Ağrının adresini <span className="gradient-text">birlikte</span> bulalım.
              </h2>
            </Reveal>
            <Reveal delay={0.14}>
              <p className="lead mt-5">
                Modeli döndürün, incelemek istediğiniz bölgeye tıklayın. Seçtiğiniz omur grubunun adı,
                seviyesi ve o bölgede en sık karşılaştığımız şikâyetler anında karşınıza gelsin.
              </p>
            </Reveal>

          </div>

          {/* İpuçları ve bölge listesi */}
          <div className="order-3 lg:col-span-5">
            <Reveal delay={0.2}>
              <div className="flex flex-wrap gap-2">
                {hints.map(({ icon: Icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-2 rounded-full border border-ink-200/70 bg-white/70 px-3.5 py-2 text-[0.8rem] font-medium text-ink-600 backdrop-blur"
                  >
                    <Icon className="size-4 text-brand-600" />
                    {label}
                  </span>
                ))}
              </div>
            </Reveal>

            {/* Bölge listesi */}
            <div className="mt-9 flex flex-col gap-2.5">
              {spineRegions.map((region, i) => {
                const active = selected?.id === region.id
                return (
                  <Reveal key={region.id} delay={0.24 + i * 0.06}>
                    <button
                      type="button"
                      onClick={() => selectRegion(region)}
                      onMouseEnter={() => setHovered(region)}
                      onMouseLeave={() => setHovered(null)}
                      className={`w-full overflow-hidden rounded-2xl border px-5 py-4 text-left transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        active
                          ? 'border-transparent bg-white shadow-lift'
                          : 'border-white/70 bg-white/55 hover:-translate-y-0.5 hover:bg-white/80 hover:shadow-soft'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-3">
                          <span
                            className="size-2.5 shrink-0 rounded-full transition-transform duration-500"
                            style={{
                              background: region.color,
                              transform: active || hovered?.id === region.id ? 'scale(1.5)' : 'scale(1)',
                            }}
                          />
                          <span className="font-display text-[1.05rem] font-bold text-ink-900">
                            {region.name}
                          </span>
                        </span>
                        <span className="font-display text-[0.7rem] font-bold tracking-[0.14em] text-ink-500 uppercase">
                          {region.code}
                        </span>
                      </div>

                      <AnimatePresence initial={false}>
                        {active && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                          >
                            <p className="pt-3 text-[0.92rem] leading-relaxed text-ink-600">
                              {region.description}
                            </p>
                            <div className="mt-3.5 flex flex-wrap gap-1.5">
                              {region.complaints.map((c) => (
                                <span
                                  key={c}
                                  className="rounded-full bg-sand-100 px-3 py-1 text-[0.74rem] font-medium text-ink-600"
                                >
                                  {c}
                                </span>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  </Reveal>
                )
              })}
            </div>
          </div>

          {/* 3B sahne */}
          <Reveal delay={0.1} className="order-2 lg:col-span-7 lg:row-span-2">
            <div className="relative h-[30rem] overflow-hidden rounded-[2.25rem] border border-white/70 bg-gradient-to-b from-white/85 via-brand-50/70 to-sand-100/90 shadow-lift sm:h-[36rem] lg:h-[42rem]">
              <div className="pointer-events-none absolute inset-0 grid-lines opacity-50" />
              <div className="pointer-events-none absolute inset-x-8 bottom-8 h-40 rounded-full bg-brand-200/35 blur-3xl" />

              {/* Üst bilgi çubuğu */}
              <div className="pointer-events-none absolute inset-x-4 top-4 z-10 flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3.5 py-2 font-display text-[0.68rem] font-bold tracking-[0.16em] text-ink-600 uppercase backdrop-blur">
                  <span className="size-1.5 animate-pulse rounded-full bg-vital-500" />
                  3B Model · Gerçek zamanlı
                </span>
                <AnimatePresence>
                  {hit && (
                    <motion.span
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-3.5 py-2 font-display text-[0.7rem] font-bold tracking-[0.1em] text-sand-50 uppercase"
                    >
                      Seçili: {vertebraLabel(hit.region, hit.h)}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {mounted ? (
                <Suspense fallback={null}>
                  <SpineScene selected={selected} hit={hit} onSelect={setHit} onHover={setHovered} />
                </Suspense>
              ) : null}

              {/* Alt ipucu */}
              <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center">
                <span className="rounded-full border border-white/70 bg-white/75 px-4 py-2 text-[0.76rem] font-medium text-ink-500 backdrop-blur">
                  {selected
                    ? 'Boş alana tıklayarak seçimi temizleyebilirsiniz'
                    : 'Modeli sürükleyin · Bir omur grubuna tıklayın'}
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
