/**
 * Cloudflare Access belirtecinin sunucuda doğrulanması.
 *
 * Access, panel isteklerini fonksiyona iletmeden önce kullanıcıyı giriş
 * yaptırır ve isteğe `Cf-Access-Jwt-Assertion` başlığında imzalı bir JWT
 * ekler. Burada (resmî belge: cloudflare-one … authorization-cookie/validating-json):
 *   - imza: RS256, anahtar `ACCESS_TEAM_DOMAIN/cdn-cgi/access/certs` adresindeki
 *     JWKS'ten, JWT'deki `kid` ile seçilir (anahtarlar dönüşümlü değişir),
 *   - `iss` takım adresiyle birebir aynı,
 *   - `aud` Access uygulamalarımızdan birinin AUD etiketi,
 *   - süre: `exp` geçmemiş, `nbf`/`iat` gelecekte değil,
 *   - e-posta yalnızca DOĞRULANMIŞ belirteçten okunur ve izin listesinde olmalı.
 * İstemcinin gönderdiği başka hiçbir kimlik bilgisine güvenilmez. Ayar
 * eksikse istek reddedilir (kapalı başarısızlık).
 */

import type { SiteEnv } from './cf'

export type Yonetici = { email: string }
export type DogrulamaSonucu = { yonetici: Yonetici } | { durum: 401 | 403 | 503; neden: string }

const SAAT_KAYMASI = 30 // saniye
const ANAHTAR_OMRU = 10 * 60 * 1000 // JWKS bu kadar süre bellekte tutulur

type Jwk = { kid: string; kty: string; alg?: string; n: string; e: string }
let anahtarOnbellegi: { adres: string; zaman: number; anahtarlar: Map<string, CryptoKey> } | null = null

const liste = (v?: string) =>
  (v ?? '')
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean)

function b64url(s: string): Uint8Array<ArrayBuffer> {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4))
  return Uint8Array.from(b, (c) => c.charCodeAt(0))
}

/** Takım adresi: https://<takim>.cloudflareaccess.com (yerel test için yalnızca localhost'ta http) */
export function takimAdresi(v?: string): string | null {
  const t = (v ?? '').trim().replace(/\/$/, '')
  if (!t) return null
  try {
    const u = new URL(t)
    const yerel = u.hostname === '127.0.0.1' || u.hostname === 'localhost'
    if (u.protocol !== 'https:' && !(yerel && u.protocol === 'http:')) return null
    if (u.pathname !== '/' || u.search || u.hash) return null
    return u.origin
  } catch {
    return null
  }
}

/** Bilinmeyen kid'li (sahte) belirteçler anahtar indirmeyi sürekli tetiklemesin */
const ZORLA_ARALIK = 60 * 1000

async function anahtarlar(adres: string, zorla: boolean): Promise<Map<string, CryptoKey>> {
  const yas = anahtarOnbellegi && anahtarOnbellegi.adres === adres ? Date.now() - anahtarOnbellegi.zaman : Infinity
  if (anahtarOnbellegi && yas < (zorla ? ZORLA_ARALIK : ANAHTAR_OMRU)) return anahtarOnbellegi.anahtarlar
  const res = await fetch(`${adres}/cdn-cgi/access/certs`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('jwks')
  const veri = (await res.json()) as { keys?: Jwk[] }
  const harita = new Map<string, CryptoKey>()
  for (const k of veri.keys ?? []) {
    if (k.kty !== 'RSA' || !k.kid || (k.alg && k.alg !== 'RS256')) continue
    harita.set(
      k.kid,
      await crypto.subtle.importKey(
        'jwk',
        { kty: 'RSA', n: k.n, e: k.e, alg: 'RS256', ext: true },
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify'],
      ),
    )
  }
  anahtarOnbellegi = { adres, zaman: Date.now(), anahtarlar: harita }
  return harita
}

/** Testler için: bellekteki anahtarları unut */
export function anahtarOnbelleginiSifirla() {
  anahtarOnbellegi = null
}

export async function erisimDogrula(request: Request, env: SiteEnv, simdi = Date.now() / 1000): Promise<DogrulamaSonucu> {
  const adres = takimAdresi(env.ACCESS_TEAM_DOMAIN)
  const audlar = liste(env.ACCESS_AUD)
  const izinli = liste(env.YONETICI_EPOSTALARI)
  if (!adres || audlar.length === 0 || izinli.length === 0) return { durum: 503, neden: 'ayar' }

  const belirtec = request.headers.get('Cf-Access-Jwt-Assertion') ?? ''
  const parcalar = belirtec.split('.')
  if (parcalar.length !== 3 || belirtec.length > 8192) return { durum: 401, neden: 'belirtec-yok' }

  let baslik: { alg?: string; kid?: string; typ?: string }
  let yuk: { iss?: string; aud?: string | string[]; exp?: number; nbf?: number; iat?: number; email?: string; type?: string }
  try {
    baslik = JSON.parse(new TextDecoder().decode(b64url(parcalar[0])))
    yuk = JSON.parse(new TextDecoder().decode(b64url(parcalar[1])))
  } catch {
    return { durum: 401, neden: 'bozuk' }
  }
  if (baslik.alg !== 'RS256' || !baslik.kid) return { durum: 401, neden: 'algoritma' }

  /* İmza */
  let harita: Map<string, CryptoKey>
  try {
    harita = await anahtarlar(adres, false)
    /* Bilinmeyen kid: anahtar yeni dönmüş olabilir, bir kez tazele */
    if (!harita.has(baslik.kid)) harita = await anahtarlar(adres, true)
  } catch {
    return { durum: 503, neden: 'jwks' }
  }
  const anahtar = harita.get(baslik.kid)
  if (!anahtar) return { durum: 401, neden: 'anahtar' }
  let gecerli = false
  try {
    gecerli = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      anahtar,
      b64url(parcalar[2]),
      new TextEncoder().encode(`${parcalar[0]}.${parcalar[1]}`),
    )
  } catch {
    gecerli = false
  }
  if (!gecerli) return { durum: 401, neden: 'imza' }

  /* İddialar */
  if (yuk.iss !== adres) return { durum: 401, neden: 'iss' }
  const aud = (Array.isArray(yuk.aud) ? yuk.aud : [yuk.aud]).map((a) => String(a ?? '').toLowerCase())
  if (!aud.some((a) => audlar.includes(a))) return { durum: 401, neden: 'aud' }
  if (typeof yuk.exp !== 'number' || yuk.exp <= simdi) return { durum: 401, neden: 'sure' }
  if (typeof yuk.nbf === 'number' && yuk.nbf > simdi + SAAT_KAYMASI) return { durum: 401, neden: 'nbf' }
  if (typeof yuk.iat === 'number' && yuk.iat > simdi + SAAT_KAYMASI) return { durum: 401, neden: 'iat' }
  /* Hizmet belirteçleri (kullanıcısız) panele giremez */
  if (yuk.type && yuk.type !== 'app') return { durum: 403, neden: 'tur' }
  const email = (yuk.email ?? '').trim().toLowerCase()
  if (!email || !izinli.includes(email)) return { durum: 403, neden: 'eposta' }

  return { yonetici: { email } }
}
