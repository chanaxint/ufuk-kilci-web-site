/**
 * Randevu bölümünün ortak kâğıt yüzeyi.
 *
 * Hem bilgi sayfası hem de mektup aynı dokudan çıkıyor: zeminin üstüne
 * bırakılmış iki sayfa gibi dursunlar diye tonlar tek yerde tutuluyor.
 */

/** Kâğıdın ve zarfın ortak sıcak tonu */
export const PAPER = `radial-gradient(70% 55% at 18% 10%, rgb(255 251 240 / 0.9), transparent 66%),
  radial-gradient(55% 45% at 86% 88%, rgb(198 168 118 / 0.16), transparent 72%),
  linear-gradient(168deg, #f7efdd 0%, #f1e7d2 55%, #e9dcc3 100%)`

/** Kâğıdın tanesi — aynı döşenen doku, çarpma karışımıyla */
export const GRAIN = {
  backgroundImage: 'url(/images/doku.png)',
  backgroundRepeat: 'repeat' as const,
}

/** Kâğıdın üzerindeki çizgili alan — deftere yazar gibi */
export const RULED =
  'repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, rgb(107 83 52 / 0.18) 27px, rgb(107 83 52 / 0.18) 28px)'

/** Kâğıda basılmış mürekkep tonları */
export const INK = {
  title: '#31241a',
  body: '#3b2c1d',
  soft: '#6b5334',
  label: '#7a6446',
  line: 'rgb(107 83 52 / 0.28)',
} as const
