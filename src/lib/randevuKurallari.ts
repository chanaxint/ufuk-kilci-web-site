/**
 * Randevu talebinin kuralları — hem tarayıcıdaki form hem de sunucu
 * (`functions/api/randevu.ts`, `workers/randevu-eposta`) aynı dosyayı kullanır.
 * Bu yüzden burada tarayıcıya ya da Cloudflare'e özgü hiçbir şey yok.
 *
 * Form yalnızca randevu için gereken iletişim bilgisini alır: ad, telefon,
 * isteğe bağlı e-posta, tercih edilen gün ve saat aralığı. Şikâyet, teşhis,
 * tedavi geçmişi ya da serbest mesaj alanı bilerek yok (sağlık verisi
 * toplanmasın). Sunucu da listede olmayan her alanı reddeder.
 */

export const GUNLER = ['Fark etmez', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'] as const
export const ZAMANLAR = [
  'Fark etmez',
  'Sabah (09.00–12.00)',
  'Öğle (12.00–15.00)',
  'Akşamüstü (15.00–19.00)',
] as const
export const YONTEMLER = ['whatsapp', 'eposta'] as const

export type Gun = (typeof GUNLER)[number]
export type Zaman = (typeof ZAMANLAR)[number]
export type Yontem = (typeof YONTEMLER)[number]

export const SINIR = { ad: 80, telefon: 20, eposta: 254 } as const

/** Formdan gelen ham değerler */
export type RandevuGirdisi = {
  ad: string
  telefon: string
  eposta: string
  gun: string
  zaman: string
}

/** Denetlenmiş, temizlenmiş talep */
export type RandevuTalebi = {
  ad: string
  telefon: string
  eposta: string
  gun: Gun
  zaman: Zaman
}

export type Alan = keyof RandevuGirdisi

const tekBosluk = (s: string) => s.replace(/\s+/g, ' ').trim()

export function telefonRakamlari(telefon: string) {
  return telefon.replace(/\D/g, '')
}

/** Basit ama sıkı: boşluksuz, tek @, noktalı alan adı */
export function epostaGecerli(eposta: string) {
  return eposta.length <= SINIR.eposta && /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/.test(eposta)
}

/**
 * Alanları denetler. Geçerliyse temizlenmiş talep, değilse alan alan
 * Türkçe hata iletileri döner (form bunları alanların altında gösterir).
 */
export function randevuDenetle(g: RandevuGirdisi): { talep: RandevuTalebi } | { hatalar: Partial<Record<Alan, string>> } {
  const ad = tekBosluk(g.ad)
  const telefon = tekBosluk(g.telefon)
  const eposta = g.eposta.trim()
  const hatalar: Partial<Record<Alan, string>> = {}

  if (ad.length < 2) hatalar.ad = 'Adınızı ve soyadınızı yazın.'
  else if (ad.length > SINIR.ad) hatalar.ad = `En fazla ${SINIR.ad} karakter.`
  else if (/[<>{}\\]|https?:|www\./i.test(ad)) hatalar.ad = 'Adınızda yalnızca harf kullanın.'

  const rakam = telefonRakamlari(telefon).length
  if (!telefon) hatalar.telefon = 'Telefon numaranızı yazın.'
  else if (telefon.length > SINIR.telefon || rakam < 10 || rakam > 15 || !/^[+\d\s().-]+$/.test(telefon))
    hatalar.telefon = 'Telefon numaranızı kontrol edin (ör. 0532 123 45 67).'

  if (eposta && !epostaGecerli(eposta)) hatalar.eposta = 'E-posta adresini kontrol edin ya da boş bırakın.'

  if (!(GUNLER as readonly string[]).includes(g.gun)) hatalar.gun = 'Bir gün seçin.'
  if (!(ZAMANLAR as readonly string[]).includes(g.zaman)) hatalar.zaman = 'Bir zaman aralığı seçin.'

  if (Object.keys(hatalar).length) return { hatalar }
  return { talep: { ad, telefon, eposta, gun: g.gun as Gun, zaman: g.zaman as Zaman } }
}

/** WhatsApp mesajı ve e-postanın düz metni — ikisi aynı satırları taşır */
export function talepSatirlari(t: RandevuTalebi): [string, string][] {
  return [
    ['Ad Soyad', t.ad],
    ['Telefon', t.telefon],
    ...(t.eposta ? ([['E-posta', t.eposta]] as [string, string][]) : []),
    ['Tercih edilen gün', t.gun],
    ['İletişim zamanı', t.zaman],
  ]
}

export function whatsappMetni(t: RandevuTalebi, doktorAdi: string) {
  return [
    `Merhaba ${doktorAdi},`,
    'Web sitenizden randevu talebi:',
    '',
    ...talepSatirlari(t).map(([k, v]) => `${k}: ${v}`),
  ].join('\n')
}
