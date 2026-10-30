/**
 * Randevu uç noktasının (functions/api/randevu.ts) parçaları. Alt çizgiyle
 * başlayan klasör Cloudflare Pages tarafından adres olarak yayınlanmaz.
 */

export interface Env {
  TURNSTILE_SECRET_KEY?: string
  SUPABASE_URL?: string
  SUPABASE_SECRET_KEY?: string
  TURNSTILE_HOSTNAMES?: string
}

/* `supabase/kurulum.sql` içindeki kısıtlarla aynı */
const LIMITS = { name: 120, phone: 40, topic: 200, message: 2000 }
export const MAX_BODY = 16_000
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
/* Ön yüzdeki widget `action: 'randevu'` ile çiziliyor */
const ACTION = 'randevu'

export const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })

export const fail = (status: number, hata: string) => json(status, { ok: false, hata })

type Talep = { ad: string; telefon: string; konu: string; mesaj: string }

/** Gövdeyi denetler; geçerliyse temizlenmiş talep, değilse hata iletisi */
export function denetle(body: unknown): { talep: Talep; token: string; tuzak: boolean } | { hata: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { hata: 'Geçersiz istek.' }
  const b = body as Record<string, unknown>
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
  const ad = str(b.ad)
  const telefon = str(b.telefon)
  const konu = str(b.konu)
  const mesaj = str(b.mesaj)
  const token = str(b.token)
  /* Görünmez tuzak alan: insanlar doldurmuyor */
  const tuzak = str(b.web_sitesi).length > 0
  if (b.onay !== true) return { hata: 'Bilgilerinizin kullanımına onay vermeniz gerekiyor.' }
  if (ad.length < 2 || ad.length > LIMITS.name) return { hata: 'Adınızı ve soyadınızı yazın.' }
  const rakam = telefon.replace(/\D/g, '').length
  if (telefon.length > LIMITS.phone || rakam < 7 || rakam > 15) return { hata: 'Telefon numaranızı kontrol edin.' }
  if (konu.length > LIMITS.topic || mesaj.length > LIMITS.message) return { hata: 'Mesaj çok uzun.' }
  if (!token || token.length > 4096) return { hata: 'Güvenlik doğrulaması eksik. Sayfayı yenileyip tekrar deneyin.' }
  return { talep: { ad, telefon, konu, mesaj }, token, tuzak }
}

/** Turnstile belirtecini Cloudflare'de doğrular */
export async function turnstileDogrula(env: Env, token: string, ip: string | null, host: string): Promise<boolean> {
  const form = new FormData()
  form.append('secret', env.TURNSTILE_SECRET_KEY ?? '')
  form.append('response', token)
  if (ip) form.append('remoteip', ip)
  let res: Response
  try {
    res = await fetch(SITEVERIFY, { method: 'POST', body: form })
  } catch {
    return false
  }
  if (!res.ok) return false
  const r = (await res.json().catch(() => null)) as { success?: boolean; hostname?: string; action?: string } | null
  if (!r?.success) return false
  if (r.action && r.action !== ACTION) return false
  const izinli = (env.TURNSTILE_HOSTNAMES ?? '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean)
  if (izinli.length > 0 && !izinli.includes((r.hostname ?? '').toLowerCase())) return false
  /* Ayrıca isteğin geldiği adres de listede olmalı (önizleme adresleri dahil edilmezse reddedilir) */
  if (izinli.length > 0 && !izinli.includes(host.toLowerCase())) return false
  return true
}

/**
 * Talebi Supabase'e yazar. Sunucu anahtarı satır kurallarını aşar; tetikleyici
 * (aynı numaradan / toplam talep freni) yine çalışır.
 */
export async function kaydet(env: Env, talep: Talep): Promise<Response> {
  const key = env.SUPABASE_SECRET_KEY ?? ''
  const headers: Record<string, string> = {
    apikey: key,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  }
  /* Eski service_role anahtarı bir JWT; yeni sb_secret_ anahtarı JWT değil, yalnızca apikey başlığında gider */
  if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`
  let res: Response
  try {
    res = await fetch(`${env.SUPABASE_URL!.replace(/\/$/, '')}/rest/v1/randevu_talepleri`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...talep, onay: true }),
    })
  } catch {
    return fail(502, 'Talep kaydedilemedi. Lütfen biraz sonra tekrar deneyin.')
  }
  if (res.ok) return json(201, { ok: true })
  const err = (await res.json().catch(() => null)) as { code?: string; message?: string } | null
  /* Veritabanı freni (raise exception) */
  if (err?.code === 'P0001') return fail(429, err.message || 'Çok fazla talep geldi, biraz sonra tekrar deneyin.')
  if (err?.code === '23514') return fail(400, 'Bilgilerinizi kontrol edin.')
  return fail(502, 'Talep kaydedilemedi. Lütfen biraz sonra tekrar deneyin.')
}
