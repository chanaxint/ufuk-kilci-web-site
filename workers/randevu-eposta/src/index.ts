/**
 * ufuk-kilci-randevu-eposta — randevu talebini doktora e-postayla ileten
 * küçük Worker.
 *
 * Neden ayrı bir Worker: Cloudflare Pages Functions `send_email`
 * bağlamasını desteklemiyor; desteklediği "service binding" ile bu Worker'ı
 * çağırıyor. Bu Worker'ın herkese açık adresi yok (`workers_dev: false`,
 * rota yok): yalnızca sitenin `/api/randevu` fonksiyonu ulaşabiliyor.
 * Turnstile ve alan denetimi orada yapılıyor; burada alanlar bir kez daha
 * denetleniyor, oran sınırı uygulanıyor ve e-posta gönderiliyor.
 *
 * Ücretsiz kullanım: Cloudflare Email Service, hesaptaki DOĞRULANMIŞ hedef
 * adreslere gönderimi her planda ücretsiz ve kotasız sayıyor. Alıcı bu
 * yüzden doktorun Email Routing'de doğruladığı adres; gönderen de Email
 * Routing açık alan adındaki bir adres olmalı (docs/randevu-gonderimi.md).
 *
 * Ayarlar (wrangler.jsonc + `wrangler secret put` ya da panel):
 *   EPOSTA            send_email bağlaması
 *   ALICI_EPOSTA      doktorun doğrulanmış hedef adresi
 *   GONDEREN_EPOSTA   Email Routing alan adındaki gönderen adresi
 *   KISI_SINIRI, TELEFON_SINIRI, GENEL_SINIRI   oran sınırı bağlamaları
 *
 * Kişisel veri günlüğe yazılmaz; hata olursa yalnızca hata kodu yazılır.
 */

import { randevuDenetle, talepSatirlari, type RandevuTalebi } from '../../../src/lib/randevuKurallari'

type EmailAddress = { email: string; name?: string }
type SendEmail = {
  send(message: {
    to: string | EmailAddress
    from: string | EmailAddress
    subject: string
    text?: string
    html?: string
    replyTo?: string | EmailAddress
  }): Promise<{ messageId: string }>
}
type RateLimit = { limit(o: { key: string }): Promise<{ success: boolean }> }

export interface Env {
  EPOSTA?: SendEmail
  ALICI_EPOSTA?: string
  GONDEREN_EPOSTA?: string
  KISI_SINIRI?: RateLimit
  TELEFON_SINIRI?: RateLimit
  GENEL_SINIRI?: RateLimit
}

const yanit = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } })

const kacis = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

async function ozet(deger: string) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(deger))
  return [...new Uint8Array(h).slice(0, 12)].map((x) => x.toString(16).padStart(2, '0')).join('')
}

/**
 * Yaklaşık, konum başına oran sınırı (Cloudflare Rate Limiting API).
 * Bağlama tanımlı değilse (ör. yerel deneme) sınır uygulanmaz.
 */
async function sinirlarIcinde(env: Env, istemci: string, talep: RandevuTalebi) {
  const tel = await ozet(talep.telefon.replace(/\D/g, ''))
  const sonuc = await Promise.all([
    env.KISI_SINIRI?.limit({ key: `ip:${istemci}` }),
    env.TELEFON_SINIRI?.limit({ key: `tel:${tel}` }),
    env.GENEL_SINIRI?.limit({ key: 'randevu' }),
  ])
  return sonuc.every((r) => !r || r.success)
}

export function epostaIcerigi(t: RandevuTalebi, zaman: Date) {
  const tarih = zaman.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', dateStyle: 'long', timeStyle: 'short' })
  const satirlar = talepSatirlari(t)
  const not =
    'Bu bir randevu TALEBİDİR, kesin randevu değildir. Ziyaretçiyle tercih ettiği zamanda iletişime geçin. ' +
    'Bu e-posta web sitesindeki formdan otomatik gönderildi; talep başka bir yerde saklanmıyor.'
  const text = [`Web sitesinden yeni randevu talebi (${tarih})`, '', ...satirlar.map(([k, v]) => `${k}: ${v}`), '', not].join('\n')
  const html = `<!doctype html><html lang="tr"><body style="font-family:Arial,sans-serif;color:#2a1d12;line-height:1.5">
<p style="margin:0 0 12px">Web sitesinden yeni randevu talebi <span style="color:#7a6446">(${kacis(tarih)})</span></p>
<table cellpadding="6" style="border-collapse:collapse">${satirlar
    .map(([k, v]) => `<tr><td style="color:#7a6446;padding-right:16px">${kacis(k)}</td><td><strong>${kacis(v)}</strong></td></tr>`)
    .join('')}</table>
<p style="margin:16px 0 0;font-size:13px;color:#7a6446">${kacis(not)}</p>
</body></html>`
  return { subject: `Randevu talebi: ${t.ad}`, text, html }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname !== '/gonder') return yanit(404, { ok: false })
    if (request.method !== 'POST') return yanit(405, { ok: false })
    if (!env.EPOSTA || !env.ALICI_EPOSTA || !env.GONDEREN_EPOSTA) return yanit(503, { ok: false, kod: 'AYAR_EKSIK' })

    const govde = (await request.json().catch(() => null)) as { talep?: Record<string, unknown> } | null
    const g = govde?.talep ?? {}
    const str = (v: unknown) => (typeof v === 'string' ? v : '')
    /* Pages fonksiyonu zaten denetledi; burada bir kez daha (savunma katmanı) */
    const d = randevuDenetle({ ad: str(g.ad), telefon: str(g.telefon), eposta: str(g.eposta), gun: str(g.gun), zaman: str(g.zaman) })
    if ('hatalar' in d) return yanit(400, { ok: false, kod: 'GECERSIZ' })
    const talep = d.talep

    if (!(await sinirlarIcinde(env, request.headers.get('X-Istemci') || 'bilinmiyor', talep)))
      return yanit(429, { ok: false, kod: 'SINIR' })

    const { subject, text, html } = epostaIcerigi(talep, new Date())
    try {
      await env.EPOSTA.send({
        to: env.ALICI_EPOSTA,
        from: { email: env.GONDEREN_EPOSTA, name: 'Web sitesi randevu formu' },
        subject,
        text,
        html,
        ...(talep.eposta ? { replyTo: talep.eposta } : {}),
      })
    } catch (e) {
      const kod = (e as { code?: string })?.code ?? 'BILINMEYEN'
      /* Yalnızca hata kodu; talep içeriği günlüğe yazılmaz */
      console.error('randevu e-postası gönderilemedi', kod)
      if (kod === 'E_RATE_LIMIT_EXCEEDED' || kod === 'E_DAILY_LIMIT_EXCEEDED') return yanit(429, { ok: false, kod })
      return yanit(502, { ok: false, kod })
    }
    /* "Gönderildi" = Cloudflare kabul etti; gelen kutusuna teslim garanti değil */
    return yanit(202, { ok: true })
  },
}
