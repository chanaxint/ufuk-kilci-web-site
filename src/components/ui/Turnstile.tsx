import { useEffect, useRef } from 'react'

/**
 * Cloudflare Turnstile — randevu formunun bot doğrulaması.
 *
 * Betik yalnızca form ekrana yaklaşınca yükleniyor (açılışı yavaşlatmasın).
 * `interaction-only` görünümüyle çoğu ziyaretçi hiçbir şey görmüyor; Cloudflare
 * şüphelenirse kutucuk kâğıdın üzerinde beliriyor. Üretilen belirteç tek
 * kullanımlık, ~5 dakika geçerli; asıl doğrulamayı sunucu yapıyor
 * (`functions/api/randevu.ts`).
 */

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string
  reset: (id: string) => void
  remove: (id: string) => void
}
declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
let loading: Promise<TurnstileApi> | null = null

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = SCRIPT
      s.async = true
      s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile yok')))
      s.onerror = () => {
        loading = null
        reject(new Error('turnstile yüklenemedi'))
      }
      document.head.appendChild(s)
    })
  }
  return loading
}

export type TurnstileState = 'bekliyor' | 'hazir' | 'hata'

export default function Turnstile({
  siteKey,
  onToken,
  onState,
  resetKey,
}: {
  siteKey: string
  onToken: (token: string | null) => void
  onState?: (s: TurnstileState) => void
  /** Değişince widget yeni bir belirteç üretir (gönderimden sonra) */
  resetKey: number
}) {
  const box = useRef<HTMLDivElement>(null)
  const widget = useRef<string | null>(null)
  const cb = useRef({ onToken, onState })
  cb.current = { onToken, onState }

  useEffect(() => {
    const el = box.current
    if (!el) return
    let cancelled = false
    const start = () => {
      loadTurnstile()
        .then((t) => {
          if (cancelled || widget.current) return
          widget.current = t.render(el, {
            sitekey: siteKey,
            action: 'randevu',
            appearance: 'interaction-only',
            theme: 'light',
            language: 'tr',
            size: 'flexible',
            'refresh-expired': 'auto',
            callback: (token: string) => {
              cb.current.onToken(token)
              cb.current.onState?.('hazir')
            },
            'expired-callback': () => cb.current.onToken(null),
            'error-callback': () => {
              cb.current.onToken(null)
              cb.current.onState?.('hata')
            },
          })
        })
        .catch(() => cb.current.onState?.('hata'))
    }
    /* Form ekrana yaklaşınca başla */
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect()
          start()
        }
      },
      { rootMargin: '600px 0px' },
    )
    io.observe(el)
    return () => {
      cancelled = true
      io.disconnect()
      if (widget.current) window.turnstile?.remove(widget.current)
      widget.current = null
    }
  }, [siteKey])

  useEffect(() => {
    if (resetKey === 0 || !widget.current) return
    cb.current.onToken(null)
    window.turnstile?.reset(widget.current)
  }, [resetKey])

  return <div ref={box} className="mt-5 empty:mt-0" data-turnstile />
}
