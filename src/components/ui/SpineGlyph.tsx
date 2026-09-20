import { motion } from 'motion/react'

const COUNT = 22

/** Omurgayı soyutlayan, kademeli olarak yerine oturan vektör çizim. */
export default function SpineGlyph({ className = '' }: { className?: string }) {
  const items = Array.from({ length: COUNT }, (_, i) => {
    const t = i / (COUNT - 1)
    const x = 150 + Math.sin(t * Math.PI * 1.75 + 0.35) * 24
    const y = 46 + t * 428
    const w = 44 + t * 54
    const h = 13 + t * 5
    const rot = Math.cos(t * Math.PI * 1.75 + 0.35) * 9
    return { t, x, y, w, h, rot }
  })

  return (
    <svg viewBox="0 0 300 520" className={className} role="presentation">
      <defs>
        <linearGradient id="vert" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#efe5d8" />
          <stop offset="100%" stopColor="#d6ccbd" />
        </linearGradient>
        <linearGradient id="spineLine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c49466" stopOpacity="0.15" />
          <stop offset="45%" stopColor="#7a8f5c" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#c08f3c" stopOpacity="0.25" />
        </linearGradient>
      </defs>

      {/* Omurganın akış çizgisi */}
      <motion.path
        d={`M ${items[0].x} ${items[0].y} ${items
          .slice(1)
          .map((p) => `L ${p.x} ${p.y}`)
          .join(' ')}`}
        fill="none"
        stroke="url(#spineLine)"
        strokeWidth="26"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
      />

      {items.map((p, i) => (
        <motion.g
          key={i}
          initial={{ opacity: 0, x: -18 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.25 + i * 0.045, ease: [0.16, 1, 0.3, 1] }}
        >
          <rect
            x={p.x - p.w / 2}
            y={p.y - p.h / 2}
            width={p.w}
            height={p.h}
            rx={p.h / 2}
            fill="url(#vert)"
            stroke="#3a2c20"
            strokeOpacity="0.12"
            transform={`rotate(${p.rot} ${p.x} ${p.y})`}
          />
        </motion.g>
      ))}
    </svg>
  )
}
