/**
 * GET /medya/gorsel/… — panelden yüklenen fotoğrafları R2'den sunar.
 *
 * Yalnızca `gorsel/` altındaki, sunucunun ürettiği biçimdeki adlar
 * sunulur; tür uzantıdan gelir (depodaki üst veriye güvenilmez) ve
 * tarayıcı içerik koklamaz. Dosya adları benzersiz olduğundan yanıt bir
 * yıl değişmez kabul edilir; Cloudflare önbelleğinde (Cache API, veri
 * merkezi başına) ve tarayıcıda tutulur, R2 okuması azalır.
 */

import { ANAHTAR, TURLER } from '../_lib/gorsel'
import type { PagesContext } from '../_lib/cf'

const BASLIK = {
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Content-Disposition': 'inline',
}

export async function onRequest({ env, request, params, waitUntil }: PagesContext): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD')
    return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD', ...BASLIK } })
  const yol = Array.isArray(params.yol) ? params.yol.join('/') : String(params.yol ?? '')
  const m = ANAHTAR.exec(yol)
  if (!m || !env.MEDYA) return new Response('Bulunamadı', { status: 404, headers: { ...BASLIK, 'Cache-Control': 'no-store' } })

  const cache = (globalThis.caches as unknown as { default: Cache }).default
  const anahtar = new Request(new URL(request.url).origin + '/medya/' + yol, { method: 'GET' })
  let yanit = await cache.match(anahtar)
  if (!yanit) {
    const nesne = await env.MEDYA.get(yol)
    if (!nesne) return new Response('Bulunamadı', { status: 404, headers: { ...BASLIK, 'Cache-Control': 'no-store' } })
    yanit = new Response(nesne.body, {
      headers: {
        ...BASLIK,
        'Content-Type': TURLER[m[2] as keyof typeof TURLER],
        'Content-Length': String(nesne.size),
        'Cache-Control': 'public, max-age=31536000, immutable',
        ETag: nesne.httpEtag,
      },
    })
    waitUntil(cache.put(anahtar, yanit.clone()))
  }
  if (request.headers.get('If-None-Match') && request.headers.get('If-None-Match') === yanit.headers.get('ETag'))
    return new Response(null, { status: 304, headers: { ETag: yanit.headers.get('ETag')!, 'Cache-Control': 'public, max-age=31536000, immutable' } })
  return request.method === 'HEAD' ? new Response(null, { status: 200, headers: yanit.headers }) : yanit
}
