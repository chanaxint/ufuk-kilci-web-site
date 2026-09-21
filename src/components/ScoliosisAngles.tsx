import { Suspense, lazy, useRef, useState } from 'react'
import { motion, useInView } from 'motion/react'
import { angleStages } from '../lib/content'
import Reveal from './ui/Reveal'
import type { SpineView } from './three/ScoliosisAngleScene'
import AngleScale from './ui/AngleScale'
import { Rotate3D } from './ui/icons'

import SceneBoundary from './ui/SceneBoundary'
import { hasWebGL } from '../lib/webgl'

const ScoliosisAngleScene = lazy(() => import('./three/ScoliosisAngleScene'))

const MAX = 50
/*
 * Seçilebilen açılar. Duraklar evrelerin sınırlarıyla aynı (0-10, 10-25,
 * 25-40, 40+): ölçek üzerinde her durak bir eşiğe denk geliyor. Eski
 * 0/15/30/45/50 dizisinde 45 ile 50 dereceler yan yana sıkışıyordu.
 */
const TICKS = [0, 10, 25, 40, 50]

const stageFor = (angle: number) =>
  angleStages.find((s) => angle < s.max) ?? angleStages[angleStages.length - 1]

export default function ScoliosisAngles() {
  const ref = useRef<HTMLDivElement>(null)
  /*
   * Model bölüm ekrana girmeden önce yüklenmeye başlıyor: parça, GLB ve
   * shader derlemesi kullanıcı oraya varana kadar bitmiş oluyor. Eskiden
   * bölüm %20 göründükten sonra başlıyordu ve model geç geliyordu.
   */
  const inView = useInView(ref, { once: true, margin: '900px 0px' })
  /* Bölüm ekrandan çıkınca WebGL render döngüsü duruyor */
  const onScreen = useInView(ref, { margin: '250px 0px' })
  const [angle, setAngle] = useState(0)
  const [view, setView] = useState<SpineView>('front')

  const stage = stageFor(angle)

  return (
    <section id="skolyoz-acilari" className="relative scroll-mt-28 py-24 sm:py-28">
      <div className="section-shell">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <h2 className="title-lg">Skolyoz Açıları</h2>
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
            <div className="relative mx-auto max-w-md px-1 pt-1 pb-2">
              {/* Görünüm değiştirici */}
              <div className="relative z-10 flex items-center justify-between gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 font-display text-[0.62rem] font-bold tracking-[0.14em] text-ivory-300 uppercase">
                  <Rotate3D className="size-3.5 text-warm-300" />
                  Sürükleyin
                </span>
                <div className="flex rounded-full border border-ivory-100/22 p-1">
                  {([
                    ['front', 'Önden'],
                    ['top', 'Üstten'],
                  ] as const).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setView(key)}
                      className={`rounded-full px-3.5 py-1.5 font-display text-[0.72rem] font-bold transition-colors duration-300 ${
                        view === key ? 'bg-ivory-50 text-ink-900' : 'text-ivory-300 hover:text-ivory-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative h-[20rem] sm:h-[26rem]">
                {inView && hasWebGL() && (
                  <SceneBoundary
                    fallback={
                      <p className="flex h-full items-center justify-center px-6 text-center text-[0.85rem] text-ivory-300">
                        3B görünüm bu tarayıcıda açılamadı; açı bilgisi yandaki
                        ölçekten okunabilir.
                      </p>
                    }
                  >
                    <Suspense fallback={null}>
                      <ScoliosisAngleScene
                        angle={angle}
                        color={stage.color}
                        view={view}
                        active={onScreen}
                      />
                    </Suspense>
                  </SceneBoundary>
                )}
              </div>

              {/*
                Açı ölçeği: kadran kaldırıldı, yerine tek bir yatay çizgi
                geldi. Dereceler çizginin hemen altında ve modele yakın
                duruyor; sürüklerken de yalnızca tanımlı duraklara oturuyor.
              */}
              <AngleScale
                className="mt-2 px-2"
                value={angle}
                ticks={TICKS}
                max={MAX}
                color={stage.color}
                onChange={setAngle}
              />
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
              {/* Anahtar değişince yeni etiket anında yerini alır, sonra belirir */}
              <motion.span
                key={stage.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="mb-2 font-display text-xl font-extrabold text-ivory-50 sm:text-2xl"
              >
                {stage.label}
              </motion.span>
            </div>

            <motion.p
              key={stage.text}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 max-w-xl text-[1.05rem] leading-relaxed text-ivory-200"
            >
              {stage.text}
            </motion.p>

            {/* Evre listesi */}
            <div className="mt-10 flex flex-col border-t border-ivory-100/18">
              {angleStages.map((item) => {
                const active = item.label === stage.label
                return (
                  <div
                    key={item.label}
                    className={`flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-ivory-100/18 py-4 pl-4 transition-all duration-500 ${
                      active ? 'border-l-2 border-l-ink-900' : 'border-l-2 border-l-transparent'
                    }`}
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full transition-transform duration-500"
                      style={{ background: item.color, transform: active ? 'scale(1.5)' : 'scale(1)' }}
                    />
                    <span className="font-display text-[0.95rem] font-bold whitespace-nowrap text-ivory-50">
                      {item.range}
                    </span>
                    <span className="text-[0.92rem] text-ivory-300">{item.action}</span>
                  </div>
                )
              })}
            </div>

            <p className="mt-7 text-[0.84rem] leading-relaxed text-ivory-200">
              Cobb açısı yalnızca röntgen üzerinde ölçülür. Buradaki görsel, aralıkların ne anlama
              geldiğini anlatmak içindir; tanı ve tedavi kararı klinik değerlendirmeyle verilir.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
