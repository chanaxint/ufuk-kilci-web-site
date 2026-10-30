/**
 * POST /api/randevu — sitedeki randevu formunun sunucu tarafı.
 *
 * Cloudflare Pages bu dosyayı kendiliğinden bir "Pages Function" olarak
 * yayınlar (proje kökündeki `functions/` klasörü). Akış:
 *   1. İstek gövdesini ve alanları denetle (veritabanındaki sınırlarla aynı).
 *   2. Cloudflare Turnstile belirtecini Cloudflare'in sunucusunda doğrula.
 *   3. Doğrulama geçerse talebi Supabase'e SUNUCU anahtarıyla yaz.
 *
 * Gizli anahtarlar yalnızca Cloudflare Pages → Settings → Variables and
 * Secrets altında "Secret" olarak tutulur; tarayıcıya hiç gitmez:
 *   TURNSTILE_SECRET_KEY   Turnstile → site → Secret key
 *   SUPABASE_URL           https://<proje>.supabase.co
 *   SUPABASE_SECRET_KEY    Supabase → API Keys → secret (sb_secret_…) ya da
 *                          eski "service_role" anahtarı. Satır kurallarını aşar:
 *                          ASLA VITE_* değişkenine ya da ön yüz koduna konmaz.
 *   TURNSTILE_HOSTNAMES    (önerilir) virgülle alan adları, ör.
 *                          "ufukkilci.com,www.ufukkilci.com". Verilirse belirtecin
 *                          yalnızca bu adreslerde üretilmiş olması şartı aranır.
 *
 * Yanıtlar JSON: { ok: true } ya da { ok: false, hata: "…" }.
 */

import { MAX_BODY, denetle, fail, json, kaydet, turnstileDogrula, type Env } from '../_lib/randevu'

type Context = { request: Request; env: Env }

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  if (!env.TURNSTILE_SECRET_KEY || !env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
    return fail(503, 'Randevu sistemi henüz yapılandırılmadı.')
  }
  const url = new URL(request.url)
  /* Başka bir siteden gönderilen tarayıcı isteklerini reddet */
  const origin = request.headers.get('Origin')
  if (origin && new URL(origin).host !== url.host) return fail(403, 'İzin verilmeyen kaynak.')
  if (!(request.headers.get('Content-Type') ?? '').includes('application/json')) return fail(415, 'Geçersiz istek.')
  const len = Number(request.headers.get('Content-Length') ?? 0)
  if (len > MAX_BODY) return fail(413, 'İstek çok büyük.')
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
  /* Tuzak doluysa kaydetmeden "tamam" de: bot farkı anlamasın */
  if (d.tuzak) return json(201, { ok: true })

  const ok = await turnstileDogrula(env, d.token, request.headers.get('CF-Connecting-IP'), url.hostname)
  if (!ok) return fail(403, 'Güvenlik doğrulaması başarısız. Sayfayı yenileyip tekrar deneyin.')

  return kaydet(env, d.talep)
}

/* Yalnızca POST kabul ediliyor */
export function onRequestGet(): Response {
  return new Response(null, { status: 405, headers: { Allow: 'POST' } })
}
