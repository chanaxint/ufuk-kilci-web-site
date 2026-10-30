/**
 * Panelin canlı önizlemesi.
 *
 * Panel siteyi bir çerçevede `/?onizleme=1` ile açıyor ve kaydedilmemiş
 * taslağı mesajla gönderiyor; site onu gerçek içerik yerine gösteriyor.
 * Yalnızca aynı adresteki (aynı köken) üst pencereden gelen mesaj kabul
 * ediliyor — başka bir site bu sayfayı çerçeveye alıp içerik basamaz.
 * Önizleme yalnızca o çerçevede yaşıyor; hiçbir şey kaydedilmiyor.
 */

import type { CanvasPatch } from './canvas'

export const isPreview =
  typeof window !== 'undefined' &&
  window.parent !== window &&
  new URLSearchParams(window.location.search).has('onizleme')

export type PanelToSite =
  | { type: 'uk-icerik'; content: unknown }
  | { type: 'uk-git'; target: string }
  /** Panel siteyi küçülterek gösteriyorsa düzenleme düğmeleri o oranda büyüsün */
  | { type: 'uk-olcek'; scale: number }
  /** Panelde bir serbest düzen öğesi seçildi (ya da seçim kalktı) */
  | { type: 'uk-sec'; block: string; item: string | null }

export type SiteToPanel =
  | { type: 'uk-hazir' }
  | { type: 'uk-duzenle'; target: string }
  | { type: 'uk-ekle'; after: string }
  /** Önizlemede bir öğe sürüklendi, boyutlandı, yazısı değişti ya da silindi */
  | { type: 'uk-tuval'; block: string; patch: CanvasPatch }
  | { type: 'uk-sec'; block: string; item: string | null }

export function sendToPanel(msg: SiteToPanel) {
  if (isPreview) window.parent.postMessage(msg, window.location.origin)
}

/** Panelden gelen mesajları dinler; dinlemeyi bırakan fonksiyonu döndürür */
export function onPanelMessage(cb: (msg: PanelToSite) => void) {
  if (!isPreview) return () => {}
  const handler = (e: MessageEvent) => {
    if (e.origin !== window.location.origin || e.source !== window.parent) return
    const msg = e.data as PanelToSite
    if (msg && ['uk-icerik', 'uk-git', 'uk-olcek', 'uk-sec'].includes(msg.type)) cb(msg)
  }
  window.addEventListener('message', handler)
  return () => window.removeEventListener('message', handler)
}
