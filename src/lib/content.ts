/*
 * Panelden değiştirilmeyen sabitler. Düzenlenebilir bütün içerik (iletişim
 * bilgileri, yazılar, yorumlar, sertifikalar, SSS…) `siteContent.ts` içinde;
 * bileşenler onu `useContent()` ile okuyor.
 */

import { SITE_SECTIONS, blockAnchor, blockIsEmpty, type SiteContent } from './siteContent'

export const navLinks = [
  { label: 'Skolyoz', href: '#skolyoz', section: 'skolyoz' },
  { label: 'Hakkımda', href: '#hakkimda', section: 'hakkimda' },
  { label: 'Sertifikalar', href: '#sertifikalar', section: 'sertifikalar' },
  { label: 'S.S.S.', href: '#sss', section: 'sss' },
  { label: 'İletişim', href: '#iletisim', section: 'iletisim' },
]

/**
 * Menü: sabit bağlantılar + panelde "menüde göster" adı verilen yeni
 * bölümler, sayfadaki sıralarına göre araya yerleşmiş. Sitede görünmeyen
 * bölüme (ör. henüz belge yüklenmemiş Sertifikalar) bağlantı verilmiyor.
 */
export function menuLinks({ blocks, certificates }: Pick<SiteContent, 'blocks' | 'certificates'>) {
  const order = (id: string) => SITE_SECTIONS.findIndex((s) => s.id === id)
  const items = navLinks
    .filter((l) => l.section !== 'sertifikalar' || certificates.items.length > 0)
    .map((l) => ({ label: l.label, href: l.href, rank: order(l.section) }))
  blocks.forEach((b, i) => {
    const label = b.menuLabel.trim()
    if (label && !blockIsEmpty(b)) items.push({ label, href: `#${blockAnchor(b)}`, rank: order(b.after) + 0.5 + i / 1000 })
  })
  return items.sort((a, b) => a.rank - b.rank).map(({ label, href }) => ({ label, href }))
}

/** Taslaktaki 6. bölüm — Cobb açısına göre evreler */
export const angleStages = [
  {
    max: 10,
    label: 'Eğrilik sayılmaz',
    range: '0° – 10°',
    color: '#5f7047',
    text: 'On derecenin altındaki sapmalar skolyoz olarak tanımlanmaz. Duruş alışkanlıkları ve kas dengesizlikleri değerlendirilir.',
    action: 'Postür eğitimi ve genel egzersiz',
  },
  {
    max: 25,
    label: 'Hafif skolyoz',
    range: '10° – 25°',
    color: '#a87445',
    text: 'Skolyoz tanısının başladığı aralık. Büyüme çağında ilerleme riski nedeniyle düzenli takip gerekir.',
    action: 'Schroth egzersizleri ve 6 aylık takip',
  },
  {
    max: 40,
    label: 'Orta derece skolyoz',
    range: '25° – 40°',
    color: '#c08f3c',
    text: 'Eğriliğin ilerlemesini durdurmak öncelik hâline gelir. Egzersiz programı çoğu zaman korse ile birlikte yürütülür.',
    action: 'Yoğun Schroth programı + korse değerlendirmesi',
  },
  {
    max: 100,
    label: 'İleri derece skolyoz',
    range: '40° ve üzeri',
    color: '#8f4a25',
    text: 'Solunum kapasitesi ve gövde dengesi etkilenebilir. Tedavi, ortopedi hekimiyle birlikte planlanır.',
    action: 'Cerrahi değerlendirme ve destekleyici fizyoterapi',
  },
]
