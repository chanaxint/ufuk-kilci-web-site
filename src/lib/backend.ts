/**
 * Sitenin içeriğinin nerede durduğu.
 *
 * - Yayında (Cloudflare Pages): içerik D1 veritabanında. Ana sayfa HTML'i
 *   bir sunucu fonksiyonundan geçerken içerik sayfanın içine gömülüyor
 *   (`functions/index.ts`, `<script id="site-icerik" type="application/json">`);
 *   site onu beklemeden, ek istek atmadan okuyor. Gömülü içerik yoksa
 *   `/api/icerik` soruluyor; o da yoksa site `siteContent.ts` içindeki
 *   varsayılanlarla açılıyor.
 * - Geliştirme sunucusunda (`npm run dev`) "deneme modu": panelde yapılan
 *   değişiklikler bu tarayıcıda saklanıyor, site de onları gösteriyor.
 *   Yayın derlemesinde bu mod hiç açılmıyor: `import.meta.env.DEV` orada
 *   sabit `false`.
 *
 * Tarayıcıda hiçbir anahtar yok; veritabanına yalnızca sunucu erişiyor.
 */

export const demoMode = import.meta.env.DEV

/** Deneme modunda içeriğin saklandığı yer (yalnızca bu tarayıcı) */
export const DEMO_KEY = 'uk-deneme-icerik'

/** HTML'e gömülü kayıtlı içerik (sunucu fonksiyonu koyar); yoksa null */
export function embeddedContent(): unknown | null {
  if (typeof document === 'undefined') return null
  const el = document.getElementById('site-icerik')
  if (!el?.textContent) return null
  try {
    return JSON.parse(el.textContent)
  } catch {
    return null
  }
}

/**
 * Kaydedilmiş içeriği getirir; yoksa ya da ulaşılamazsa `null` (site o
 * zaman varsayılanlarla açılır). Hata fırlatmaz.
 */
export async function fetchSavedContent(signal?: AbortSignal): Promise<unknown | null> {
  if (demoMode) {
    try {
      const raw = localStorage.getItem(DEMO_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }
  const gomulu = embeddedContent()
  if (gomulu) return gomulu
  try {
    const res = await fetch('/api/icerik', { signal, cache: 'no-cache' })
    if (!res.ok || !(res.headers.get('Content-Type') ?? '').includes('application/json')) return null
    return ((await res.json()) as { icerik?: unknown }).icerik ?? null
  } catch {
    return null
  }
}
