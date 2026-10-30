/**
 * GET /api/icerik — sitenin kayıtlı içeriği (herkese açık, salt okunur).
 *
 * Ana sayfa içeriği zaten HTML'in içinde gönderiyor (`functions/index.ts`);
 * bu uç nokta yedek yol (ör. HTML'de içerik yoksa). Önbellek: tarayıcı her
 * seferinde sorar (`no-cache`), sürüm değişmediyse 304 döner — eski içerik
 * gösterilmez, gövde boşuna taşınmaz.
 */

import { hata, json } from '../_lib/http'
import { icerikOku } from '../_lib/icerik'
import { loadSaved } from '../../src/lib/siteContent'
import { yayinIcerigi } from '../../src/lib/yayin'
import type { PagesContext } from '../_lib/cf'

export async function onRequestGet({ env, request }: PagesContext): Promise<Response> {
  if (!env.DB) return hata(503, 'İçerik yok.')
  let k
  try {
    k = await icerikOku(env.DB)
  } catch {
    return hata(503, 'İçerik şu an okunamadı.')
  }
  const etag = `"s${k?.surum ?? 0}"`
  const onbellek = { 'Cache-Control': 'no-cache', ETag: etag }
  if (request.headers.get('If-None-Match') === etag) return new Response(null, { status: 304, headers: onbellek })
  /* Yayında olmayan bölümlerin verisi herkese açık yanıtta yer almaz */
  return json(200, { surum: k?.surum ?? 0, icerik: k ? yayinIcerigi(loadSaved(k.veri)) : null }, onbellek)
}
