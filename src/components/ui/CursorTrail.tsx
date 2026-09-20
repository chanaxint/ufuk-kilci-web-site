import { useEffect, useRef } from 'react'

const MAX_POINTS = 14
const FADE_MS = 340

type Point = { x: number; y: number; t: number }

/**
 * İmlecin arkasında kalan kısa ışık izi.
 *
 * 2B canvas üzerine, son birkaç imleç konumundan geçen inceltilmiş bir çizgi
 * çizer. Sayfanın hiçbir yerine karışmaz (yalnızca kendi katmanına çizer),
 * dokunmatik cihazlarda ve azaltılmış hareket tercihinde hiç çalışmaz.
 */
export default function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const points: Point[] = []
    const onMove = (e: PointerEvent) => {
      points.push({ x: e.clientX, y: e.clientY, t: performance.now() })
      if (points.length > MAX_POINTS) points.shift()
    }

    let raf = 0
    const draw = () => {
      raf = requestAnimationFrame(draw)
      const now = performance.now()
      while (points.length && now - points[0].t > FADE_MS) points.shift()

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      if (points.length < 2) return

      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      for (let i = 1; i < points.length; i++) {
        const p = points[i]
        const prev = points[i - 1]
        const life = 1 - (now - p.t) / FADE_MS
        if (life <= 0) continue
        const taper = i / points.length
        ctx.strokeStyle = `rgb(255 250 238 / ${(0.42 * life * taper).toFixed(3)})`
        ctx.lineWidth = 1 + 5.5 * life * taper
        ctx.beginPath()
        ctx.moveTo(prev.x, prev.y)
        ctx.lineTo(p.x, p.y)
        ctx.stroke()
      }
    }
    raf = requestAnimationFrame(draw)

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[5] hidden lg:block"
    />
  )
}
