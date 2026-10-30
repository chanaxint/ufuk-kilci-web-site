import type { SiteContent } from './siteContent'

/**
 * Yayın kararları — panelden ya da veritabanından DEĞİŞTİRİLEMEZ.
 *
 * Hasta yorumları bölümü (yer tutucu kâğıtlar dahil) yalnızca geliştirme
 * ortamında (`npm run dev`) görünür. Yayında, gerçek ve izinli yorumların
 * yayınlanmasına karar verilene kadar gizli: D1'de kayıtlı yorum olsa da
 * sunucu ziyaretçiye giden içerikten çıkarır, site bölümü çizmez.
 *
 * Yayına almak için (hukuki görüş alındıktan sonra) bu değer `true` yapılıp
 * commit'lenir ve site yeniden dağıtılır. Panel yorumları bu kararı
 * beklerken de düzenleyip kaydedebilir.
 */
export const YORUMLAR_YAYIN_KARARI: boolean = false

/** Ziyaretçiye giden içerik: yayında olmayan bölümlerin verisi çıkarılır */
export function yayinIcerigi(c: SiteContent): SiteContent {
  if (YORUMLAR_YAYIN_KARARI) return c
  return { ...c, testimonials: { intro: '', rating: '', ratingCount: '', items: [] } }
}
