import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { doctor } from '../lib/content'

const letters = (word: string) => Array.from(word)

export default function Preloader({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const duration = 2100
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setProgress(Math.round(eased * 100))
      if (t < 1) raf = requestAnimationFrame(tick)
      else setTimeout(onDone, 520)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
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

        <h1 className="mt-5 flex overflow-hidden font-display text-[clamp(2.4rem,8vw,5rem)] leading-none font-extrabold tracking-[-0.03em] text-ink-800">
          {letters(doctor.name).map((ch, i) => (
            <motion.span
              key={`${ch}-${i}`}
              initial={{ y: '110%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              transition={{ duration: 0.85, delay: 0.16 + i * 0.045, ease: [0.16, 1, 0.3, 1] }}
              className={ch === ' ' ? 'inline-block w-[0.28em]' : 'inline-block'}
            >
              {ch === ' ' ? ' ' : ch}
            </motion.span>
          ))}
        </h1>

        {/* İlerleme çizgisi */}
        <div className="mt-9 flex w-[min(22rem,80vw)] flex-col gap-3">
          <div className="h-[3px] w-full overflow-hidden rounded-full bg-ink-900/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-brand-600 via-brand-500 to-vital-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between font-display text-[0.68rem] font-bold tracking-[0.22em] text-ink-500 uppercase">
            <span>Omurga sağlığı merkezi</span>
            <span className="tabular-nums text-ink-800">{progress}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
