/**
 * /api/yonetim/* — yönetici API'lerinin kapısı. Her istekte:
 *   1. Cloudflare Access belirteci sunucuda doğrulanır (`_lib/erisim.ts`):
 *      imza, issuer, audience, süre, izinli e-posta. Access'in önünde olması
 *      tek başına yeterli sayılmaz; `*.pages.dev` ya da önizleme adresinden
 *      gelen, belirteçsiz bir istek burada durur.
 *   2. Değiştiren isteklerde (POST/PUT/DELETE) çapraz site koruması:
 *      `X-Yonetim-Istegi: 1` başlığı (başka sitenin formu bunu ekleyemez,
 *      fetch ile eklemeye kalkarsa tarayıcı ön kontrol ister ve izin yok),
 *      `Origin` aynı adres, `Sec-Fetch-Site` başka site değil.
 * Doğrulanan yönetici `data.yonetici` içinde sonraki fonksiyona geçer.
 */

import { erisimDogrula } from '../../_lib/erisim'
import { hata } from '../../_lib/http'
import type { PagesContext } from '../../_lib/cf'

const GUVENLI = new Set(['GET', 'HEAD'])

export async function onRequest(ctx: PagesContext): Promise<Response> {
  const { request, env } = ctx
  const ek = { 'X-Robots-Tag': 'noindex, nofollow' }

  if (!GUVENLI.has(request.method)) {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin')
    if (origin !== null && origin !== url.origin) return hata(403, 'İzin verilmeyen kaynak.', ek)
    const site = request.headers.get('Sec-Fetch-Site')
    if (site && site !== 'same-origin' && site !== 'none') return hata(403, 'İzin verilmeyen kaynak.', ek)
    if (request.headers.get('X-Yonetim-Istegi') !== '1') return hata(403, 'İzin verilmeyen istek.', ek)
  }

  const s = await erisimDogrula(request, env)
  if ('durum' in s) {
    const ileti =
      s.durum === 503
        ? 'Yönetim girişi henüz yapılandırılmadı.'
        : s.durum === 403
          ? 'Bu hesabın paneli kullanma yetkisi yok.'
          : 'Oturum bulunamadı ya da süresi doldu. Sayfayı yenileyip yeniden giriş yapın.'
    return hata(s.durum, ileti, ek)
  }
  ctx.data.yonetici = s.yonetici
  const res = await ctx.next()
  const out = new Response(res.body, res)
  out.headers.set('X-Robots-Tag', 'noindex, nofollow')
  out.headers.set('Cache-Control', 'no-store')
  return out
}
