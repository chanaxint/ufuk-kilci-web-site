/**
 * Ana sayfa HTML'ine kayıtlı içeriği ve SEO alanlarını yerleştirir.
 * HTML'i ayrıştırmadan, derlenmiş `index.html` içindeki bilinen etiketlerin
 * yerine yazar; bulamazsa o etikete dokunmaz (sayfa bozulmaz).
 */

import type { SiteContent } from '../../src/lib/siteContent'

const kacis = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/** <script type="application/json"> içinde güvenli JSON: etiketi kapatamaz */
export const gomuluJson = (v: unknown) =>
  JSON.stringify(v)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')

const meta = (oznitelik: 'name' | 'property', ad: string) =>
  new RegExp(`<meta\\s+${oznitelik}="${ad.replace(/[.:]/g, '\\$&')}"\\s+content="[^"]*"\\s*/?>`)

export function sayfayaYerlestir(html: string, icerik: SiteContent): string {
  const baslik = icerik.seo.title.trim()
  const aciklama = icerik.seo.description.trim()
  let out = html
  if (baslik) {
    out = out.replace(/<title>[^<]*<\/title>/, `<title>${kacis(baslik)}</title>`)
    out = out.replace(meta('property', 'og:title'), `<meta property="og:title" content="${kacis(baslik)}" />`)
  }
  if (aciklama) {
    out = out.replace(meta('name', 'description'), `<meta name="description" content="${kacis(aciklama)}" />`)
    out = out.replace(meta('property', 'og:description'), `<meta property="og:description" content="${kacis(aciklama)}" />`)
  }
  return out.replace('</head>', `<script id="site-icerik" type="application/json">${gomuluJson(icerik)}</script>\n  </head>`)
}
