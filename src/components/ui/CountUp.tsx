import { useEffect, useRef, useState } from 'react'
import { useInView } from 'motion/react'

type Props = { value: number; suffix?: string; duration?: number }

/** Görüş alanına girdiğinde hedefe kadar sayan rakam. */
export default function CountUp({ value, suffix = '', duration = 1600 }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -5% 0px' })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 4)
      setDisplay(Math.round(value * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, duration])

  return (
    <span ref={ref}>
      {display.toLocaleString('tr-TR')}
      {suffix}
    </span>
  )
}
