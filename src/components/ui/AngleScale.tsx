import { useCallback, useRef, useState } from 'react'

type Props = {
  value: number
  /** Seçilebilen duraklar; ara değerlere düşmüyor */
  ticks: number[]
  max: number
  /** Etkin evrenin rengi — dolu kısım ve tutamak bu renkte */
  color: string
  onChange: (value: number) => void
  className?: string
}

const snap = (ticks: number[], v: number) =>
  ticks.reduce((best, t) => (Math.abs(t - v) < Math.abs(best - v) ? t : best), ticks[0])

/**
 * Yatay açı ölçeği.
 *
 * Kadran yerine tek bir çizgi: üzerinde duraklar, altında dereceler.
 * Sürüklerken de tıklarken de yalnızca tanımlı duraklara oturuyor, çünkü
 * aradaki değerlerin klinik bir karşılığı yok. Klavyeyle de gezilebiliyor.
 */
export default function AngleScale({ value, ticks, max, color, onChange, className = '' }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  const pick = useCallback(
    (clientX: number) => {
      const el = trackRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const ratio = r.width > 0 ? (clientX - r.left) / r.width : 0
      onChange(snap(ticks, Math.min(1, Math.max(0, ratio)) * max))
    },
    [max, onChange, ticks],
  )

  const step = (dir: number) => {
    const i = ticks.indexOf(snap(ticks, value))
    onChange(ticks[Math.min(ticks.length - 1, Math.max(0, i + dir))])
  }

  const pct = (v: number) => `${(v / max) * 100}%`

  return (
    <div className={`select-none ${className}`}>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="Cobb açısı"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value} derece`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          setDragging(true)
          pick(e.clientX)
        }}
        onPointerMove={(e) => {
          if (dragging) pick(e.clientX)
        }}
        onPointerUp={(e) => {
          e.currentTarget.releasePointerCapture(e.pointerId)
          setDragging(false)
        }}
        onPointerCancel={() => setDragging(false)}
        onKeyDown={(e) => {
          const dir =
            e.key === 'ArrowRight' || e.key === 'ArrowUp'
              ? 1
              : e.key === 'ArrowLeft' || e.key === 'ArrowDown'
                ? -1
                : 0
          if (!dir) return
          e.preventDefault()
          step(dir)
        }}
        className="relative h-9 cursor-pointer touch-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-warm-300"
      >
        {/* Çizgi */}
        <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-ivory-100/25" />
        {/* Dolu kısım */}
        <span
          className="absolute top-1/2 left-0 h-px -translate-y-1/2 transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ width: pct(value), background: color }}
        />

        {/* Duraklar */}
        {ticks.map((t) => {
          const passed = t <= value
          return (
            <span
              key={t}
              aria-hidden="true"
              className="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-300"
              style={{
                left: pct(t),
                background: passed ? color : 'rgb(242 232 216 / 0.3)',
              }}
            />
          )
        })}

        {/* Tutamak */}
        <span
          aria-hidden="true"
          className={`absolute top-1/2 grid size-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full transition-[left,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            dragging ? 'shadow-[0_0_0_6px_rgb(242_232_216/0.12)]' : ''
          }`}
          style={{ left: pct(value), background: color }}
        >
          <span className="size-1.5 rounded-full bg-ink-950/45" />
        </span>
      </div>

      {/* Dereceler — durakların tam altında */}
      <div className="relative mt-1 h-6">
        {ticks.map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            aria-pressed={value === t}
            className={`absolute top-0 -translate-x-1/2 rounded-full px-1.5 py-0.5 font-display text-[0.74rem] font-bold tabular-nums transition-colors duration-300 ${
              value === t ? 'text-ivory-50' : 'text-ivory-300 hover:text-ivory-100'
            }`}
            style={{
              left: pct(t),
              /* İlk ve son etiket kenardan taşmasın */
              transform: i === 0 ? 'translateX(-25%)' : i === ticks.length - 1 ? 'translateX(-75%)' : undefined,
            }}
          >
            {t}°
          </button>
        ))}
      </div>
    </div>
  )
}
