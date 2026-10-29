/*
 * Panelden değiştirilmeyen sabitler. Düzenlenebilir bütün içerik (iletişim
 * bilgileri, yazılar, yorumlar, sertifikalar, SSS…) `siteContent.ts` içinde;
 * bileşenler onu `useContent()` ile okuyor.
 */

export const navLinks = [
  { label: 'Skolyoz', href: '#skolyoz' },
  { label: 'Hakkımda', href: '#hakkimda' },
  { label: 'Sertifikalar', href: '#sertifikalar' },
  { label: 'S.S.S.', href: '#sss' },
  { label: 'İletişim', href: '#iletisim' },
]

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
