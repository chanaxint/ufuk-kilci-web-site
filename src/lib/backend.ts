/**
 * Sitenin içeriğinin nerede durduğu.
 *
 * - Supabase bağlıysa (`.env` içinde VITE_SUPABASE_URL ve
 *   VITE_SUPABASE_ANON_KEY): içerik oradaki `site_content` tablosundan, tek
 *   bir istekle okunuyor. Ziyaretçi sitesi Supabase kütüphanesini hiç
 *   indirmiyor; kütüphaneyi yalnızca yönetim paneli kullanıyor.
 * - Bağlı değilse: site `siteContent.ts` içindeki varsayılanlarla açılıyor.
 * - Geliştirme sunucusunda (`npm run dev`) ve Supabase bağlı değilken
 *   "deneme modu": panelde yapılan değişiklikler bu tarayıcıda saklanıyor,
 *   site de onları gösteriyor. Yayın derlemesinde bu mod hiç açılmıyor:
 *   `import.meta.env.DEV` orada sabit `false`.
 *
 * Anon anahtar gizli değil — tarayıcıya zaten gidiyor. Güvenliği Supabase
 * tarafındaki satır kuralları sağlıyor: herkes okuyabiliyor, yalnızca
 * yönetici listesindeki e-posta ile giriş yapan yazabiliyor
 * (`supabase/kurulum.sql`).
 */

export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? '').trim().replace(/\/$/, '')
export const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

export const configured = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0

/**
 * Doğrudan REST isteklerinin anahtar başlıkları. Eski `anon` anahtarı bir JWT
 * olduğu için Authorization'a da yazılır; yeni `sb_publishable_…` anahtarı
 * JWT değil, yalnızca `apikey` başlığında gider.
 */
export const anonHeaders: Record<string, string> = {
  apikey: SUPABASE_ANON_KEY,
  ...(SUPABASE_ANON_KEY.startsWith('eyJ') ? { Authorization: `Bearer ${SUPABASE_ANON_KEY}` } : {}),
}
export const demoMode = import.meta.env.DEV && !configured

/** Görsellerin yüklendiği depo */
export const BUCKET = 'site-gorselleri'

/** Deneme modunda içeriğin saklandığı yer (yalnızca bu tarayıcı) */
export const DEMO_KEY = 'uk-deneme-icerik'

/**
 * Kaydedilmiş içeriği getirir; yoksa ya da ulaşılamazsa `null` (site o
 * zaman varsayılanlarla açılır). Hata fırlatmaz.
 */
export async function fetchSavedContent(signal?: AbortSignal): Promise<unknown | null> {
  if (configured) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/site_content?id=eq.1&select=data`, {
        headers: anonHeaders,
        signal,
      })
      if (!res.ok) return null
      const rows = (await res.json()) as { data?: unknown }[]
      return rows[0]?.data ?? null
    } catch {
      return null
    }
  }
  if (demoMode) {
    try {
      const raw = localStorage.getItem(DEMO_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }
  return null
}
