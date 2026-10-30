import type { Plugin } from 'vite'

/**
 * Yayın adresine bağlı arama motoru dosyaları.
 *
 * Sitemap, canonical ve paylaşım kartlarının görsel adresi TAM adres ister
 * (https://alanadi/...). Alan adı henüz belli olmadığı için hiçbir adres
 * uydurulmuyor: derleme ortamında `SITE_URL` tanımlıysa (Cloudflare Pages →
 * Settings → Environment variables, ör. `SITE_URL=https://ufukkilci.com`)
 *   - dist/sitemap.xml üretiliyor,
 *   - robots.txt'ye `Sitemap:` satırı ekleniyor,
 *   - ana sayfaya canonical ve og:url ekleniyor, og:image ile yapısal verinin
 *     (JSON-LD) görsel adresi tam adrese çevriliyor, JSON-LD'ye url ekleniyor.
 * Tanımlı değilse robots.txt yine üretiliyor (sitemap satırı olmadan), diğerleri
 * hiç yazılmıyor ve derleme bir uyarı veriyor.
 *
 * Yönetim paneli (/yonetim/) robots.txt'de engellenmiyor: sayfada ve sunucu
 * başlığında (public/_headers) "noindex" var. robots.txt ile kapatılsaydı arama
 * motoru sayfayı hiç açmayacağı için bu "noindex"i de göremezdi; adres başka bir
 * yerde bağlantı olarak geçerse sonuçlarda içeriksiz görünebilirdi.
 */
export default function siteSeo(): Plugin {
  const site = readSiteUrl(process.env.SITE_URL)

  return {
    name: 'uk-site-seo',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        /* Yalnızca ziyaretçi sitesinin ana sayfası; panel aranmasın */
        if (!site || ctx.path !== '/index.html') return html
        const abs = (path: string) => `${site}${path}`
        const out = html
          .replace(/(<meta property="og:image" content=")(\/[^"]*)"/, (_, a: string, p: string) => `${a}${abs(p)}"`)
          .replace(/("image":\s*")(\/[^"]*)"/, (_, a: string, p: string) => `${a}${abs(p)}"`)
          .replace(/("@type":\s*"Physiotherapy",)/, `$1\n        "url": "${site}/",`)
        return {
          html: out,
          tags: [
            { tag: 'link', attrs: { rel: 'canonical', href: `${site}/` }, injectTo: 'head' },
            { tag: 'meta', attrs: { property: 'og:url', content: `${site}/` }, injectTo: 'head' },
          ],
        }
      },
    },
    generateBundle() {
      const robots = ['User-agent: *', 'Allow: /', ...(site ? ['', `Sitemap: ${site}/sitemap.xml`] : []), ''].join('\n')
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots })

      if (!site) {
        this.warn(
          'SITE_URL tanımlı değil: sitemap.xml, canonical ve og:url üretilmedi. ' +
            'Alan adı belli olunca derleme ortamına SITE_URL=https://alanadi eklenmeli.',
        )
        return
      }
      /* Tek sayfalık site: bölümler (#hakkimda…) ayrı adres değil, sitemap'te tek kayıt */
      const today = new Date().toISOString().slice(0, 10)
      const sitemap = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        '  <url>',
        `    <loc>${site}/</loc>`,
        `    <lastmod>${today}</lastmod>`,
        '  </url>',
        '</urlset>',
        '',
      ].join('\n')
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap })
    },
  }
}

/** `https://ornek.com/` → `https://ornek.com`; geçersizse derleme açık bir hatayla durur */
function readSiteUrl(raw: string | undefined): string {
  const v = (raw ?? '').trim()
  if (!v) return ''
  let url: URL
  try {
    url = new URL(v)
  } catch {
    throw new Error(`SITE_URL geçerli bir adres değil: "${v}" (ör. https://ufukkilci.com)`)
  }
  if (url.protocol !== 'https:') throw new Error(`SITE_URL https:// ile başlamalı: "${v}"`)
  if (url.pathname !== '/' || url.search || url.hash) throw new Error(`SITE_URL yalnızca alan adı olmalı (yol olmadan): "${v}"`)
  return url.origin
}
