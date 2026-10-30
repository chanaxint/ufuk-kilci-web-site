/**
 * Randevu uç noktasının (functions/api/randevu.ts) parçaları. Alt çizgiyle
 * başlayan klasör Cloudflare Pages tarafından adres olarak yayınlanmaz.
 */

import { randevuDenetle, type RandevuTalebi } from '../../src/lib/randevuKurallari'

/** Cloudflare'in "service binding" nesnesi: başka bir Worker'a internetsiz istek */
export type Fetcher = { fetch(input: Request | string, init?: RequestInit): Promise<Response> }

export interface Env {
  /** Cloudflare → Turnstile → site → Secret key (Pages "Secret") */
  TURNSTILE_SECRET_KEY?: string
  /** Önerilir: belirtecin üretilebileceği alan adları, virgülle */
  TURNSTILE_HOSTNAMES?: string
  /** Pages → Settings → Bindings → Service binding → `ufuk-kilci-randevu-eposta` Worker'ı */
  RANDEVU_EPOSTA?: Fetcher
}

/* Gövde ~300 bayt; 4 KB fazlasıyla yeter */
export const MAX_BODY = 4_096
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
/* Ön yüzdeki widget `action: 'randevu'` ile çiziliyor */
const ACTION = 'randevu'
/* Gövdede bulunabilecek alanların tamamı; başka bir alan (ör. mesaj) gelirse istek reddedilir */
const IZINLI = new Set(['ad', 'telefon', 'eposta', 'gun', 'zaman', 'onay', 'token', 'web_sitesi'])

export const json = (status: number, body: Record<string, unknown>, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extra,
    },
  })

export const fail = (status: number, hata: string, extra?: Record<string, string>) => json(status, { ok: false, hata }, extra)

/** Gövdeyi denetler; geçerliyse temizlenmiş talep, değilse hata iletisi */
export function denetle(body: unknown): { talep: RandevuTalebi; token: string; tuzak: boolean } | { hata: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { hata: 'Geçersiz istek.' }
  const b = body as Record<string, unknown>
  if (Object.keys(b).some((k) => !IZINLI.has(k))) return { hata: 'Geçersiz istek.' }
  for (const k of ['ad', 'telefon', 'eposta', 'gun', 'zaman', 'token', 'web_sitesi'])
    if (b[k] !== undefined && typeof b[k] !== 'string') return { hata: 'Geçersiz istek.' }
  const str = (v: unknown) => (typeof v === 'string' ? v : '')
  /* Görünmez tuzak alan: insanlar doldurmuyor */
  const tuzak = str(b.web_sitesi).trim().length > 0
  if (b.onay !== true) return { hata: 'Bilgilerinizin kullanımına onay vermeniz gerekiyor.' }
  const d = randevuDenetle({ ad: str(b.ad), telefon: str(b.telefon), eposta: str(b.eposta), gun: str(b.gun), zaman: str(b.zaman) })
  if ('hatalar' in d) return { hata: Object.values(d.hatalar)[0] ?? 'Bilgilerinizi kontrol edin.' }
  const token = str(b.token).trim()
  if (!token || token.length > 2048) return { hata: 'Güvenlik doğrulaması eksik. Sayfayı yenileyip tekrar deneyin.' }
  return { talep: d.talep, token, tuzak }
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
 * Ziyaretçinin IP'si oran sınırı için yalnızca özet (SHA-256, kısaltılmış)
 * olarak e-posta Worker'ına gider; IP'nin kendisi hiçbir yere yazılmaz.
 */
export async function ozet(deger: string): Promise<string> {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(deger))
  return [...new Uint8Array(h).slice(0, 12)].map((x) => x.toString(16).padStart(2, '0')).join('')
}

/**
 * Talebi e-posta Worker'ına iletir (service binding, internet üzerinden
 * gitmez). Worker oran sınırını uygular ve Cloudflare Email Service ile
 * doktorun doğrulanmış adresine gönderir.
 */
export async function epostayaIlet(env: Env, talep: RandevuTalebi, ip: string | null): Promise<Response> {
  let res: Response
  try {
    res = await env.RANDEVU_EPOSTA!.fetch('https://randevu-eposta.ic/gonder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Istemci': ip ? await ozet(ip) : 'bilinmiyor',
      },
      body: JSON.stringify({ talep }),
    })
  } catch {
    return fail(502, 'Talebiniz şu an iletilemedi. Lütfen biraz sonra tekrar deneyin ya da WhatsApp’tan yazın.')
  }
  if (res.ok) return json(202, { ok: true })
  if (res.status === 429)
    return fail(429, 'Kısa sürede çok fazla talep geldi. Birkaç dakika sonra tekrar deneyin ya da WhatsApp’tan yazın.', {
      'Retry-After': '60',
    })
  return fail(502, 'Talebiniz şu an iletilemedi. Lütfen biraz sonra tekrar deneyin ya da WhatsApp’tan yazın.')
}
