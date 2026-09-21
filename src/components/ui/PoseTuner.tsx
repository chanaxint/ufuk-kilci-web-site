import { useEffect, useState } from 'react'
import {
  VIEW_HEIGHT,
  desktopFocus,
  desktopRest,
  mobileFocus,
  mobileRest,
  type Pose,
} from '../three/spinePose'

/**
 * Omurgayı piksel piksel yerine oturtmak için ayar paneli.
 *
 * Yalnızca adrese `?ayar=1` eklendiğinde görünür; normal ziyaretçi hiçbir
 * zaman görmez. Ok tuşları modeli ekran pikseli kadar kaydırır (dünya
 * birimine dönüşüm burada yapılır), `+`/`-` büyütüp küçültür, `,`/`.`
 * döndürür. Panel o anki sayıları gösterir; "Kodu kopyala" ile
 * `src/components/three/spinePose.ts` içine yapıştırılacak satır panoya
 * gider.
 *
 * Hangi duruşun ayarlandığı sahnenin durumuna bağlı: omurga standın
 * üzerindeyken "duruş", üzerine tıklanıp yaklaşıldığında "yakın plan".
 */
export default function PoseTuner({ isMobile, focused }: { isMobile: boolean; focused: boolean }) {
  const [, force] = useState(0)

  const pose: Pose = isMobile
    ? focused
      ? mobileFocus
      : mobileRest
    : focused
      ? desktopFocus
      : desktopRest

  const name = `${isMobile ? 'mobile' : 'desktop'}${focused ? 'Focus' : 'Rest'}`

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      /* Ekran pikseli → dünya birimi */
      const unit = VIEW_HEIGHT / window.innerHeight
      const step = (e.shiftKey ? 10 : 1) * unit
      let used = true
      switch (e.key) {
        case 'ArrowLeft':
          pose.x -= step
          break
        case 'ArrowRight':
          pose.x += step
          break
        case 'ArrowUp':
          pose.y += step
          break
        case 'ArrowDown':
          pose.y -= step
          break
        case '+':
        case '=':
          pose.scale += e.shiftKey ? 0.02 : 0.004
          break
        case '-':
        case '_':
          pose.scale -= e.shiftKey ? 0.02 : 0.004
          break
        case ',':
          pose.rotY -= e.shiftKey ? 0.08 : 0.02
          break
        case '.':
          pose.rotY += e.shiftKey ? 0.08 : 0.02
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
  }, [pose])

  const line =
    `export const ${name}: Pose = { x: ${pose.x.toFixed(3)}, y: ${pose.y.toFixed(3)}, ` +
    `z: ${pose.z.toFixed(3)}, scale: ${pose.scale.toFixed(3)}, rotY: ${pose.rotY.toFixed(3)} }`

  return (
    <div className="pointer-events-auto fixed bottom-4 left-4 z-[95] w-[19rem] rounded-2xl bg-ink-950/88 p-4 font-mono text-[0.72rem] leading-relaxed text-sand-50 shadow-lift backdrop-blur">
      <p className="font-display text-[0.62rem] font-bold tracking-[0.2em] text-brand-200 uppercase">
        Ayar · {name}
      </p>
      <pre className="mt-2 break-all whitespace-pre-wrap text-sand-50/90">{line}</pre>
      <p className="mt-3 text-[0.66rem] text-sand-50/55">
        ok tuşları: 1 px · Shift+ok: 10 px · + / −: boyut · , / .: döndür
      </p>
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(line)}
        className="mt-3 w-full rounded-full bg-sand-50 px-4 py-2 font-display text-[0.72rem] font-bold text-ink-900"
      >
        Kodu kopyala
      </button>
    </div>
  )
}
