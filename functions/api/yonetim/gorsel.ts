/**
 * POST /api/yonetim/gorsel?tur=portre|sertifika|bolum
 * Gövde: fotoğrafın kendisi (panel tarayıcıda küçültüp WebP/JPEG gönderir).
 * Yanıt: { url: "/medya/gorsel/…" } — içerikte bu adres saklanır.
 */

import { hata, json, sinirliOku } from '../../_lib/http'
import { GORSEL_SINIRI, GORSEL_TURLERI, TURLER, turTespit, yeniAnahtar } from '../../_lib/gorsel'
import type { PagesContext } from '../../_lib/cf'

export async function onRequestPost({ env, request }: PagesContext): Promise<Response> {
  if (!env.MEDYA) return hata(503, 'Fotoğraf deposu (R2) bağlı değil. Kurulum: docs/yonetim-paneli.md')
  const tur = new URL(request.url).searchParams.get('tur') ?? ''
  if (!(GORSEL_TURLERI as readonly string[]).includes(tur)) return hata(400, 'Geçersiz istek.')
  if (!(request.headers.get('Content-Type') ?? '').toLowerCase().startsWith('image/'))
    return hata(415, 'Yalnızca JPG, PNG ya da WEBP fotoğraf yüklenebilir.')
  const veri = await sinirliOku(request, GORSEL_SINIRI)
  if (!veri) return hata(413, 'Fotoğraf çok büyük (en fazla 6 MB).')
  const uzanti = turTespit(veri)
  if (!uzanti) return hata(415, 'Yalnızca JPG, PNG ya da WEBP fotoğraf yüklenebilir.')
  const anahtar = yeniAnahtar(tur as (typeof GORSEL_TURLERI)[number], uzanti)
  await env.MEDYA.put(anahtar, veri, {
    httpMetadata: { contentType: TURLER[uzanti], cacheControl: 'public, max-age=31536000, immutable' },
  })
  return json(201, { ok: true, url: `/medya/${anahtar}` })
}
