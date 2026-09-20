import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring } from 'motion/react'

type Props = {
  children: ReactNode
  href?: string
  onClick?: () => void
  variant?: 'solid' | 'ghost'
  className?: string
  strength?: number
}

/** İmlece hafifçe yaklaşan buton. */
export default function MagneticButton({
  children,
  href,
  onClick,
  variant = 'solid',
  className = '',
  strength = 0.28,
}: Props) {
  const ref = useRef<HTMLElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 })

  const base =
    'relative inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 font-display text-[0.95rem] font-bold tracking-[-0.01em] transition-colors duration-300 will-change-transform'
  const styles =
    variant === 'solid'
      ? 'bg-ink-900 text-sand-50 shadow-[0_18px_40px_-18px_rgb(58_42_28/0.85)] hover:bg-brand-700'
      : 'border border-ink-200 bg-white/70 text-ink-800 backdrop-blur hover:border-brand-400 hover:text-brand-700'

  const handleMove = (e: React.PointerEvent) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * strength)
    y.set((e.clientY - (r.top + r.height / 2)) * strength)
  }
  const reset = () => {
    x.set(0)
    y.set(0)
  }

  const Tag = (href ? motion.a : motion.button) as typeof motion.a

  return (
    <Tag
      ref={ref as never}
      href={href}
      onClick={onClick}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      style={{ x: sx, y: sy }}
      className={`${base} ${styles} ${className}`}
    >
      {children}
    </Tag>
  )
}
