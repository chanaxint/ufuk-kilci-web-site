import { useEffect, useRef } from 'react'

/**
 * Sitenin tamamının oturduğu tek zemin: yumuşak ışık alan beyaz bir yüzey.
 *
 * Katmanlar: dikey beyaz gradyan → ince sıva dokusu → kenarlara doğru
 * koyulaşan vinyet → imleci takip eden ışık havuzu. Işık doğrudan DOM'a
 * yazılır (React state'i yok), dokunmatik cihazlarda sabit kalır.
 */
export default function StudioBackground() {
  const glow = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return

    let frame = 0
    const onMove = (e: PointerEvent) => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const x = (e.clientX / window.innerWidth) * 100
        const y = (e.clientY / window.innerHeight) * 100
        if (glow.current) {
          glow.current.style.background = `radial-gradient(46rem 38rem at ${x}% ${y}%, rgb(255 255 255 / 0.98), rgb(255 255 255 / 0.6) 34%, rgb(255 255 255 / 0.22) 56%, transparent 74%)`
        }
      })
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Yüzey */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #fbfaf9 0%, #f4f2ef 36%, #edebe7 70%, #e6e3de 100%)',
        }}
      />

      {/* Üstten gelen yumuşak ışık */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(64rem 40rem at 50% -10%, rgb(255 255 255 / 0.72), transparent 60%)',
        }}
      />

      {/* İmleci takip eden ışık havuzu */}
      <div
        ref={glow}
        className="absolute inset-0 transition-[background] duration-200 ease-out"
        style={{
          background:
            'radial-gradient(46rem 38rem at 50% 42%, rgb(255 255 255 / 0.98), rgb(255 255 255 / 0.6) 34%, rgb(255 255 255 / 0.22) 56%, transparent 74%)',
        }}
      />

      {/* Sıva dokusu — bantlanmayı kırar, yüzeye derinlik verir */}
      <svg className="absolute inset-0 size-full opacity-[0.05] mix-blend-multiply">
        <filter id="studioGrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#studioGrain)" />
      </svg>

      {/* Kenarlara doğru koyulaşan vinyet */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(125% 95% at 50% 42%, transparent 44%, rgb(52 45 34 / 0.14) 100%)',
        }}
      />
    </div>
  )
}
