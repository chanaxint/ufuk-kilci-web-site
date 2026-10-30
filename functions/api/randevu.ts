/**
 * POST /api/randevu — randevu formunun "E-posta ile gönder" seçeneği.
 *
 * Cloudflare Pages bu dosyayı kendiliğinden bir "Pages Function" olarak
 * yayınlar (proje kökündeki `functions/` klasörü). Akış:
 *   1. Yalnızca POST; aynı siteden, JSON, en fazla 4 KB.
 *   2. Alanları denetle (`src/lib/randevuKurallari.ts`); listede olmayan
 *      alan (ör. serbest mesaj) varsa reddet.
 *   3. Cloudflare Turnstile belirtecini Cloudflare'in sunucusunda doğrula.
 *   4. Talebi `ufuk-kilci-randevu-eposta` Worker'ına service binding ile
 *      ilet. Pages Functions `send_email` bağlamasını desteklemediği için
 *      e-postayı o küçük Worker gönderiyor (`workers/randevu-eposta/`).
 *
 * Veritabanı yok: talep hiçbir yerde saklanmaz, yalnızca e-postayla iletilir.
 * Kişisel veri günlüğe yazılmaz.
 *
 * Pages → Settings:
 *   Variables and Secrets  TURNSTILE_SECRET_KEY (Secret), TURNSTILE_HOSTNAMES
 *   Bindings               Service binding  RANDEVU_EPOSTA → ufuk-kilci-randevu-eposta
 *
 * Yanıtlar JSON: { ok: true } ya da { ok: false, hata: "…" }.
 */

import { MAX_BODY, denetle, epostayaIlet, fail, json, turnstileDogrula, type Env } from '../_lib/randevu'

type Context = { request: Request; env: Env }

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  if (!env.TURNSTILE_SECRET_KEY || !env.RANDEVU_EPOSTA) return fail(503, 'E-posta ile talep şu an kapalı. Lütfen WhatsApp’tan yazın.')
  const url = new URL(request.url)
  /* Başka bir siteden gönderilen tarayıcı isteklerini reddet */
  const origin = request.headers.get('Origin')
  if (origin) {
    let host = ''
    try {
      host = new URL(origin).host
    } catch {
      /* geçersiz Origin */
    }
    if (host !== url.host) return fail(403, 'İzin verilmeyen kaynak.')
  }
  if (!(request.headers.get('Content-Type') ?? '').includes('application/json')) return fail(415, 'Geçersiz istek.')
  if (Number(request.headers.get('Content-Length') ?? 0) > MAX_BODY) return fail(413, 'İstek çok büyük.')
  const raw = await request.text()
  if (raw.length > MAX_BODY) return fail(413, 'İstek çok büyük.')
  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return fail(400, 'Geçersiz istek.')
  }

  const d = denetle(body)
  if ('hata' in d) return fail(400, d.hata)
  /* Tuzak doluysa göndermeden "tamam" de: bot farkı anlamasın */
  if (d.tuzak) return json(202, { ok: true })

  const ip = request.headers.get('CF-Connecting-IP')
  const ok = await turnstileDogrula(env, d.token, ip, url.hostname)
  if (!ok) return fail(403, 'Güvenlik doğrulaması başarısız. Sayfayı yenileyip tekrar deneyin.')

  return epostayaIlet(env, d.talep, ip)
}

/* POST dışındaki her yöntem: 405 */
export function onRequest(): Response {
  return new Response(null, { status: 405, headers: { Allow: 'POST', 'Cache-Control': 'no-store' } })
}
