/**
 * Panelden gelen içeriğin sunucuda denetlenmesi. İstemciye güvenilmez:
 * içerik sitenin kendi birleştirme kuralından geçirilir (`loadSaved`:
 * bilinmeyen alanlar atılır, eksikler varsayılandan gelir, yeni bölümler
 * düzeltilir), sonra adres taşıyan alanlar tek tek denetlenir.
 */

import { loadSaved, safeHref, safeLinkUrl, safeMapsUrl, BUTTON_PHONE, BUTTON_WHATSAPP, type SiteContent } from '../../src/lib/siteContent'

/** D1'de bir satır en fazla 2 MB; içerik (fotoğraflar R2'de) bunun çok altında */
export const ICERIK_SINIRI = 1_000_000
const METIN_SINIRI = 20_000

/** Görsel alanları: yalnızca sitenin kendi yolları (/images/…, /medya/…) */
const GORSEL = /^\/(?!\/)[\w\-./%]*$/
const GORSEL_ANAHTARLARI = new Set(['photo', 'image', 'src'])
const BAGLANTI_ANAHTARLARI = new Set(['href', 'buttonHref'])

export type DenetimSonucu = { icerik: SiteContent } | { hata: string }

export function icerikDenetle(ham: unknown): DenetimSonucu {
  if (!ham || typeof ham !== 'object' || Array.isArray(ham)) return { hata: 'İçerik geçersiz.' }
  const icerik = loadSaved(ham)
  if (JSON.stringify(icerik).length > ICERIK_SINIRI) return { hata: 'İçerik çok büyük.' }

  const sorun: string[] = []
  if (icerik.seo.title.length > 200 || icerik.seo.description.length > 500) sorun.push('seo: başlık ya da açıklama çok uzun')
  const gez = (v: unknown, anahtar: string, yol: string) => {
    if (typeof v === 'string') {
      if (v.length > METIN_SINIRI) sorun.push(`${yol}: çok uzun`)
      const t = v.trim()
      if (!t) return
      if (GORSEL_ANAHTARLARI.has(anahtar) && !GORSEL.test(t)) sorun.push(`${yol}: fotoğraf panelden yüklenmeli`)
      if (BAGLANTI_ANAHTARLARI.has(anahtar) && t !== BUTTON_WHATSAPP && t !== BUTTON_PHONE && !safeHref(t))
        sorun.push(`${yol}: geçersiz bağlantı`)
      if (anahtar === 'mapsUrl' && !safeMapsUrl(t)) sorun.push(`${yol}: harita bağlantısı https:// olmalı`)
      if (anahtar === 'privacyUrl' && !safeLinkUrl(t)) sorun.push(`${yol}: aydınlatma bağlantısı geçersiz`)
      return
    }
    if (Array.isArray(v)) v.forEach((x, i) => gez(x, anahtar, `${yol}[${i}]`))
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) gez(x, k, yol ? `${yol}.${k}` : k)
  }
  gez(icerik, '', '')
  if (sorun.length) return { hata: `Kaydedilemedi: ${sorun.slice(0, 3).join('; ')}` }
  return { icerik }
}

/** İçerikte geçen R2 görsel anahtarları (temizlik için) */
export function medyaAnahtarlari(v: unknown, out = new Set<string>()): Set<string> {
  if (typeof v === 'string') {
    const m = /^\/medya\/(gorsel\/[\w\-./]+)$/.exec(v.trim())
    if (m) out.add(m[1])
  } else if (Array.isArray(v)) v.forEach((x) => medyaAnahtarlari(x, out))
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => medyaAnahtarlari(x, out))
  return out
}
