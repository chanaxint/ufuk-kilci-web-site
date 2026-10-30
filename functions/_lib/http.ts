/**
 * Pages Functions yanıt yardımcıları ve güvenlik başlıkları.
 *
 * `public/_headers` dosyası Pages Functions yanıtlarına UYGULANMAZ (resmî
 * belge: pages/configuration/headers). Bu yüzden fonksiyonların ürettiği
 * HTML ve JSON yanıtları başlıklarını buradan alır. Sitenin CSP'si
 * `public/_headers` ile birebir aynı olmalı; derleme sırasında
 * `vite/baslik-denetimi.ts` ikisini karşılaştırır.
 */

export const SITE_CSP =
  "default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self'; font-src 'self' data:; connect-src 'self' https://lottie.host https://challenges.cloudflare.com; worker-src 'self' blob:; frame-src 'self' https://challenges.cloudflare.com; frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests"

/** Sitenin HTML sayfası için (fonksiyondan dönen `/`) */
export const SITE_BASLIKLARI: Record<string, string> = {
  'Content-Security-Policy': SITE_CSP,
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
}

/** JSON yanıtları: hiçbir yerde HTML gibi yorumlanmasın, çerçevelenmesin */
const JSON_BASLIKLARI: Record<string, string> = {
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'Referrer-Policy': 'no-referrer',
}

export function json(status: number, body: unknown, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_BASLIKLARI, 'Cache-Control': 'no-store', ...extra },
  })
}

export const hata = (status: number, ileti: string, extra?: Record<string, string>) => json(status, { ok: false, hata: ileti }, extra)

/** Gövdeyi en fazla `sinir` bayt okur; aşarsa null */
export async function sinirliOku(request: Request, sinir: number): Promise<Uint8Array | null> {
  const bildirilen = Number(request.headers.get('Content-Length') ?? 0)
  if (bildirilen > sinir) return null
  if (!request.body) return new Uint8Array()
  const reader = request.body.getReader()
  const parcalar: Uint8Array[] = []
  let toplam = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    toplam += value.byteLength
    if (toplam > sinir) {
      await reader.cancel().catch(() => {})
      return null
    }
    parcalar.push(value)
  }
  const out = new Uint8Array(toplam)
  let i = 0
  for (const p of parcalar) {
    out.set(p, i)
    i += p.byteLength
  }
  return out
}

export async function jsonOku(request: Request, sinir: number): Promise<{ deger: unknown } | { hata: Response }> {
  if (!(request.headers.get('Content-Type') ?? '').toLowerCase().startsWith('application/json'))
    return { hata: hata(415, 'Geçersiz istek.') }
  const ham = await sinirliOku(request, sinir)
  if (!ham) return { hata: hata(413, 'İçerik çok büyük.') }
  try {
    return { deger: JSON.parse(new TextDecoder().decode(ham)) }
  } catch {
    return { hata: hata(400, 'Geçersiz istek.') }
  }
}
