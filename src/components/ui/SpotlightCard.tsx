import { useRef, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
  /** Işık lekesinin rengi */
  glow?: string
}

/**
 * İmleci takip eden yumuşak bir ışık lekesi taşıyan kart yüzeyi.
 * (Reactbits "Spotlight Card" mantığının projenin paletine uyarlanmış hâli.)
 */
export default function SpotlightCard({ children, className = '', glow = '232 211 191' }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={ref}
      onPointerMove={(e) => {
        const el = ref.current
        if (!el) return
        const r = el.getBoundingClientRect()
        el.style.setProperty('--x', `${e.clientX - r.left}px`)
        el.style.setProperty('--y', `${e.clientY - r.top}px`)
        el.style.setProperty('--spot', '1')
      }}
      onPointerLeave={() => ref.current?.style.setProperty('--spot', '0')}
      className={`group relative overflow-hidden rounded-3xl border border-white/70 bg-white/75 shadow-soft backdrop-blur-sm transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:shadow-lift ${className}`}
      style={{ ['--spot' as string]: '0' }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[var(--spot)] transition-opacity duration-300"
        style={{
          background: `radial-gradient(22rem 22rem at var(--x) var(--y), rgb(${glow} / 0.55), transparent 65%)`,
        }}
      />
      <div className="relative">{children}</div>
    </div>
  )
}
