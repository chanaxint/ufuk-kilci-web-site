import { readFileSync } from 'node:fs'
import type { Plugin } from 'vite'
import { SITE_CSP } from '../functions/_lib/http'

/**
 * `public/_headers` statik dosyalara, `functions/_lib/http.ts` ise Pages
 * Functions yanıtlarına (ana sayfa dahil) CSP veriyor. İkisi ayrılırsa
 * sitenin bir yolu farklı kurallarla açılır; derleme bunu yakalayıp durur.
 */
export default function baslikDenetimi(): Plugin {
  return {
    name: 'baslik-denetimi',
    apply: 'build',
    buildStart() {
      const dosya = readFileSync(new URL('../public/_headers', import.meta.url), 'utf8')
      const m = /^\/\*\n(?:[ \t]+.*\n)*?[ \t]+Content-Security-Policy:\s*(.+)$/m.exec(dosya)
      if (!m) this.error('public/_headers içinde /* için Content-Security-Policy bulunamadı.')
      if (m[1].trim() !== SITE_CSP)
        this.error('public/_headers CSP ile functions/_lib/http.ts SITE_CSP aynı değil. İkisini birlikte güncelleyin.')
    },
  }
}
