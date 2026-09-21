import { useEffect, useState } from 'react'
import { coverFit, desktopFocus, mobileFocus, spine, stand, type Pose } from '../three/spinePose'

/**
 * Omurgayı piksel piksel standa oturtmak için ayar paneli.
 *
 * Yalnızca adrese `?ayar=1` eklendiğinde görünür; normal ziyaretçi hiçbir
 * zaman görmez. Ok tuşları modeli tam bir ekran pikseli kadar kaydırır.
 *
 * Duruş hâlinde ayarlanan sayılar FOTOĞRAFA göre tanımlı (0–1 arası oran),
 * bu yüzden bir kez oturtunca her pencere boyutunda yerinde kalıyor. Yakın
 * plan ise dünya birimiyle, pencereden bağımsız.
 */
export default function PoseTuner({ isMobile, focused }: { isMobile: boolean; focused: boolean }) {
  const [, force] = useState(0)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const { scale, pxPerUnit } = coverFit(vw, vh)
      const mult = e.shiftKey ? 10 : 1
      /* Duruşta 1 ekran pikseli = fotoğrafta bu kadar oran */
      const stepX = mult / (2000 * scale)
      const stepY = mult / (1116 * scale)
      /* Yakın planda 1 ekran pikseli = bu kadar dünya birimi */
      const stepW = mult / pxPerUnit
      const focusPose: Pose = isMobile ? mobileFocus : desktopFocus

      let used = true
      switch (e.key) {
        case 'ArrowLeft':
          if (focused) focusPose.x -= stepW
          else stand.x -= stepX
          break
        case 'ArrowRight':
          if (focused) focusPose.x += stepW
          else stand.x += stepX
          break
        case 'ArrowUp':
          if (focused) focusPose.y += stepW
          else stand.y -= stepY
          break
        case 'ArrowDown':
          if (focused) focusPose.y -= stepW
          else stand.y += stepY
          break
        case '+':
        case '=':
          if (focused) focusPose.scale += e.shiftKey ? 0.02 : 0.004
          else spine.span += e.shiftKey ? 0.02 : 0.004
          break
        case '-':
        case '_':
          if (focused) focusPose.scale -= e.shiftKey ? 0.02 : 0.004
          else spine.span -= e.shiftKey ? 0.02 : 0.004
          break
        case ',':
          if (focused) focusPose.rotY -= e.shiftKey ? 0.08 : 0.02
          else spine.rotY -= e.shiftKey ? 0.08 : 0.02
          break
        case '.':
          if (focused) focusPose.rotY += e.shiftKey ? 0.08 : 0.02
          else spine.rotY += e.shiftKey ? 0.08 : 0.02
          break
        default:
          used = false
      }
      if (!used) return
      e.preventDefault()
      force((n) => n + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [focused, isMobile])

  const focusPose = isMobile ? mobileFocus : desktopFocus
  const name = focused ? (isMobile ? 'mobileFocus' : 'desktopFocus') : 'duruş (standa oturma)'
  const code = focused
    ? `export const ${isMobile ? 'mobileFocus' : 'desktopFocus'}: Pose = { x: ${focusPose.x.toFixed(3)}, ` +
      `y: ${focusPose.y.toFixed(3)}, z: ${focusPose.z.toFixed(3)}, scale: ${focusPose.scale.toFixed(3)}, ` +
      `rotY: ${focusPose.rotY.toFixed(3)} }`
    : `export const stand = { x: ${stand.x.toFixed(4)}, y: ${stand.y.toFixed(4)} }\n` +
      `export const spine = { span: ${spine.span.toFixed(4)}, rotY: ${spine.rotY.toFixed(3)} }`

  return (
    <div className="pointer-events-auto fixed bottom-4 left-4 z-[95] w-[20rem] rounded-2xl bg-ink-950/88 p-4 font-mono text-[0.72rem] leading-relaxed text-sand-50 shadow-lift backdrop-blur">
      <p className="font-display text-[0.62rem] font-bold tracking-[0.2em] text-brand-200 uppercase">
        Ayar · {name}
      </p>
      <pre className="mt-2 break-all whitespace-pre-wrap text-sand-50/90">{code}</pre>
      <p className="mt-3 text-[0.66rem] text-sand-50/55">
        ok tuşları: 1 px · Shift+ok: 10 px · + / −: boyut · , / .: döndür
      </p>
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(code)}
        className="mt-3 w-full rounded-full bg-sand-50 px-4 py-2 font-display text-[0.72rem] font-bold text-ink-900"
      >
        Kodu kopyala
      </button>
    </div>
  )
}
