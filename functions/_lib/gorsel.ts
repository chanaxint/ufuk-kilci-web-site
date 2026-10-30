/**
 * Panelden yüklenen fotoğraflar (R2). Kurallar:
 *   - Yalnızca JPEG, PNG, WebP. Tür, istemcinin söylediğine değil dosyanın
 *     ilk baytlarına (imza) bakılarak belirlenir; SVG/HTML gibi çalıştırılabilir
 *     içerik hiçbir koşulda kabul edilmez.
 *   - En fazla 6 MB (panel fotoğrafı zaten 2000 px'e küçültüp gönderiyor).
 *   - Dosya adı sunucuda üretilir: gorsel/<tür>/<yyyymm>/<uuid>.<uzantı>.
 *     Kullanıcının dosya adı hiçbir yerde kullanılmaz.
 *   - Herkese açık sunulan tek önek `gorsel/`. Depoda başka bir önek
 *     (ör. ileride özel belgeler) olursa `/medya/` onu asla sunmaz.
 *   - Temizlik: hiçbir sürümde geçmeyen ve 24 saatten eski görseller
 *     (`kullanilmayanlar`).
 */

import type { D1Database, R2Bucket } from './cf'
import { medyaAnahtarlari } from './denetim'
import { gecmisListe, gecmisSurumu, icerikOku } from './icerik'

export const GORSEL_SINIRI = 6 * 1024 * 1024
export const GORSEL_TURLERI = ['portre', 'sertifika', 'bolum'] as const
export const ANAHTAR = /^gorsel\/(portre|sertifika|bolum)\/\d{6}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/
export const TURLER = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' } as const
/** Yüklenip hiç kaydedilmemiş görseller bu süre korunur (panelde açık taslak olabilir) */
export const TEMIZLIK_BEKLEME_MS = 24 * 60 * 60 * 1000

export function turTespit(b: Uint8Array): keyof typeof TURLER | null {
  if (b.length < 32) return null
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg'
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a)
    return 'png'
  const ascii = (i: number, n: number) => String.fromCharCode(...b.slice(i, i + n))
  if (ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') return 'webp'
  return null
}

export function yeniAnahtar(tur: (typeof GORSEL_TURLERI)[number], uzanti: keyof typeof TURLER, simdi = new Date()) {
  const ay = `${simdi.getUTCFullYear()}${String(simdi.getUTCMonth() + 1).padStart(2, '0')}`
  return `gorsel/${tur}/${ay}/${crypto.randomUUID()}.${uzanti}`
}

/** Güncel içerikte ya da saklanan herhangi bir sürümde geçen görsel anahtarları */
export async function kullanilanAnahtarlar(db: D1Database): Promise<Set<string>> {
  const set = new Set<string>()
  const k = await icerikOku(db)
  if (k) medyaAnahtarlari(k.veri, set)
  for (const s of await gecmisListe(db)) {
    const v = await gecmisSurumu(db, s.surum)
    if (v) medyaAnahtarlari(v.veri, set)
  }
  return set
}

export async function kullanilmayanlar(db: D1Database, medya: R2Bucket, beklemeMs = TEMIZLIK_BEKLEME_MS, simdi = Date.now()) {
  const kullanilan = await kullanilanAnahtarlar(db)
  const toplam: string[] = []
  const silinecek: string[] = []
  let cursor: string | undefined
  do {
    const sayfa = await medya.list({ prefix: 'gorsel/', cursor, limit: 1000 })
    for (const o of sayfa.objects) {
      toplam.push(o.key)
      if (!kullanilan.has(o.key) && simdi - new Date(o.uploaded).getTime() >= beklemeMs) silinecek.push(o.key)
    }
    cursor = sayfa.truncated ? sayfa.cursor : undefined
  } while (cursor)
  return { toplam: toplam.length, kullanilan: kullanilan.size, silinecek }
}
