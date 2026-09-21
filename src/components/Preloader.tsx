import { Suspense, lazy, useEffect } from 'react'
import { motion } from 'motion/react'
import { doctor } from '../lib/content'
import MessageLoading from './ui/MessageLoading'

/*
 * Lottie motoru yükleme ekranının ilk karesini geciktirmesin diye ayrı bir
 * parçada: yazı hemen çıkıyor, kedi motoru gelince beliriyor.
 */
const LottieCat = lazy(() => import('./ui/LottieCat'))

const letters = (word: string) => Array.from(word)

export default function Preloader({ onDone }: { onDone: () => void }) {
  /* Dolan çubuk kalktı; ekran sabit bir süre durup kendini kapatıyor */
  useEffect(() => {
    const id = window.setTimeout(onDone, 2400)
    return () => window.clearTimeout(id)
  }, [onDone])

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      exit={{ y: '-100%' }}
      transition={{ duration: 0.95, ease: [0.76, 0, 0.24, 1] }}
    >
      {/* Zemin */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #fdfdfc 0%, #f7f5f2 38%, #f1efec 72%, #eceae6 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(48rem 34rem at 50% 38%, rgb(255 255 255 / 0.95), transparent 66%)',
        }}
      />
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-50" />

      <div className="relative flex flex-col items-center px-6 text-center">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-[0.7rem] font-bold tracking-[0.42em] text-ink-500 uppercase"
        >
          Fizyoterapist — Osteopat
        </motion.span>

        <h1 className="mt-5 flex overflow-hidden font-wordmark text-[clamp(2.8rem,9vw,5.5rem)] leading-none font-normal tracking-[-0.01em] text-ink-800">
          {letters(doctor.name).map((ch, i) => (
            <motion.span
              key={`${ch}-${i}`}
              initial={{ y: '110%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              transition={{ duration: 0.85, delay: 0.16 + i * 0.045, ease: [0.16, 1, 0.3, 1] }}
              className={ch === ' ' ? 'inline-block w-[0.2em]' : 'inline-block'}
            >
              {ch === ' ' ? ' ' : ch}
            </motion.span>
          ))}
        </h1>

        {/* Kedi ve yükleme yazısı */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 flex flex-col items-center"
        >
          {/*
            Kutu her hâlükârda yer tutar: kedi geç gelse de yazı yerinden
            oynamaz. Kutu kareden alçak ve taşanı kırpıyor — Lottie karesinin
            alt/üst boşluğu böyle kesiliyor, kedi hem büyük kalıyor hem de
            doğrudan yazının üstüne oturuyor.
          */}
          <div className="flex h-[3.6rem] w-24 items-center justify-center overflow-hidden sm:h-[4.2rem] sm:w-28">
            <Suspense fallback={null}>
              <LottieCat className="size-24 sm:size-28" />
            </Suspense>
          </div>
          {/*
            LOADING zaten büyük harfle yazılı: `uppercase` Türkçe yerelde "i"
            harfini "İ" yapıp LOADİNG üretiyordu.
          */}
          <span className="mt-1 flex items-center gap-1.5 font-display text-[0.68rem] font-bold tracking-[0.34em] text-ink-500">
            LOADING
            <MessageLoading className="-ml-0.5 size-3.5" />
          </span>
        </motion.div>
      </div>
    </motion.div>
  )
}
