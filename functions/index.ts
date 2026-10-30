/**
 * GET / — sitenin ana sayfası.
 *
 * Derlenmiş `index.html` (statik dosya) alınır; D1'deki kayıtlı içerik ve
 * SEO başlığı/açıklaması sunucuda içine yazılır (`_lib/sayfa.ts`). Böylece:
 *   - panelde Kaydet'ten hemen sonra ziyaretçi yeni içeriği görür (yeniden
 *     derleme ya da GitHub commit'i gerekmez),
 *   - site içerik için ayrıca istek atmaz, eski metni gösterip değiştirmez,
 *   - arama motorları güncel başlık ve açıklamayı HTML'de görür.
 * Önbellek: `no-cache` + ETag — tarayıcı her açılışta sorar, değişmediyse
 * 304 alır; eski içerik gösterilmez.
 *
 * `public/_headers` fonksiyon yanıtlarına uygulanmadığı için güvenlik
 * başlıkları burada eklenir (`_lib/http.ts`, CSP aynı).
 * Veritabanına ulaşılamazsa sayfa yine açılır (varsayılan içerikle).
 */

import { loadSaved } from '../src/lib/siteContent'
import { yayinIcerigi } from '../src/lib/yayin'
import { SITE_BASLIKLARI } from './_lib/http'
import { icerikOku } from './_lib/icerik'
import { sayfayaYerlestir } from './_lib/sayfa'
import type { PagesContext } from './_lib/cf'

async function ozet(s: string) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(h).slice(0, 8)].map((x) => x.toString(16).padStart(2, '0')).join('')
}

export async function onRequestGet({ env, request, next }: PagesContext): Promise<Response> {
  const statik = await next()
  if (!statik.ok || !(statik.headers.get('Content-Type') ?? '').includes('text/html')) return statik
  let html = await statik.text()
  if (env.DB) {
    try {
      const k = await icerikOku(env.DB)
      /* Yayında olmayan bölümlerin (hasta yorumları) metni HTML'e hiç girmez */
      if (k) html = sayfayaYerlestir(html, yayinIcerigi(loadSaved(k.veri)))
    } catch {
      /* Veritabanı geçici olarak yoksa site varsayılan içerikle açılır */
    }
  }
  const etag = `"${await ozet(html)}"`
  const basliklar = { ...SITE_BASLIKLARI, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache', ETag: etag }
  if (request.headers.get('If-None-Match') === etag) return new Response(null, { status: 304, headers: basliklar })
  return new Response(html, { headers: basliklar })
}
