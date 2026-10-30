/**
 * "Serbest düzen" bölümü: öğeler (başlık, yazı, fotoğraf, düğme) bir tuvalin
 * üzerinde serbestçe duruyor; panelin önizlemesinde sürüklenip
 * boyutlandırılıyor.
 *
 * Bütün ölçüler tuvalin GENİŞLİĞİNİN yüzdesi (x, y, en, boy, yazı boyu):
 * ekran büyüyüp küçüldükçe her şey aynı oranda büyüyüp küçülüyor, yerleşim
 * bozulmuyor. Sitede bunlar `cqw` (tuval genişliğinin yüzdesi) olarak
 * basılıyor.
 *
 * Üç görünüm var:
 *  - geniş ekran (≥ 1024 px): bilgisayar yerleşimi `d`
 *  - telefon (< 640 px): telefon için ayrı yerleşim yapıldıysa `m`
 *  - geri kalan her şey (tablet, ya da telefon yerleşimi yoksa): öğeler
 *    yukarıdan aşağıya alt alta — her ekranda okunur kalsın diye
 */

import type { Block } from './siteContent'

export type CanvasItemType = 'baslik' | 'yazi' | 'fotograf' | 'dugme'
export type Rect = { x: number; y: number; w: number; h: number; fs: number }

export type CanvasItem = {
  id: string
  type: CanvasItemType
  /** Başlık / yazı / düğme yazısı */
  text: string
  src: string
  href: string
  align: 'sol' | 'orta' | 'sag'
  /** Bilgisayar yerleşimi */
  d: Rect
  /** Telefon yerleşimi; yoksa telefonda alt alta dizilir */
  m: Rect | null
}

export type Canvas = {
  bg: 'zemin' | 'kagit'
  /** Tuvalin yüksekliği (genişliğin yüzdesi) */
  hd: number
  /** Telefon yerleşiminin yüksekliği; `null` = telefonda otomatik dizilim */
  hm: number | null
  items: CanvasItem[]
}

export const CANVAS_LIMIT = 30

/** Yeni öğenin varsayılan yazı boyu (tuval genişliğinin yüzdesi) */
export const DEFAULT_FS: Record<CanvasItemType, number> = { baslik: 3.8, yazi: 1.45, dugme: 1.3, fotograf: 1 }

export const ITEM_LABELS: Record<CanvasItemType, string> = {
  baslik: 'Başlık',
  yazi: 'Yazı',
  fotograf: 'Fotoğraf',
  dugme: 'Düğme',
}

/** Ekran genişliğine göre hangi yerleşimin kullanılacağı */
export const DESKTOP_MIN = 1024
export const PHONE_MAX = 639

let seq = 0
export const newItemId = () => `o${Date.now().toString(36)}${(seq++).toString(36)}`

const clamp = (v: unknown, lo: number, hi: number, fallback: number) => {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : fallback
  return Math.min(hi, Math.max(lo, n))
}
const round = (n: number) => Math.round(n * 100) / 100

export function normalizeRect(raw: unknown, fallback: Rect): Rect {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    x: round(clamp(r.x, -50, 150, fallback.x)),
    y: round(clamp(r.y, -20, 400, fallback.y)),
    w: round(clamp(r.w, 2, 100, fallback.w)),
    h: round(clamp(r.h, 2, 400, fallback.h)),
    fs: round(clamp(r.fs, 0.4, 20, fallback.fs)),
  }
}

export function blankItem(type: CanvasItemType, at: Partial<Rect> = {}): CanvasItem {
  const w = type === 'baslik' ? 70 : type === 'yazi' ? 56 : type === 'fotograf' ? 34 : 22
  const d: Rect = {
    x: round(50 - w / 2),
    y: 6,
    w,
    h: type === 'fotograf' ? 24 : 6,
    fs: DEFAULT_FS[type],
    ...at,
  }
  return {
    id: newItemId(),
    type,
    text: type === 'baslik' ? 'Yeni başlık' : type === 'yazi' ? 'Buraya yazınızı yazın.' : type === 'dugme' ? 'Randevu alın' : '',
    src: '',
    href: type === 'dugme' ? '#iletisim' : '',
    align: 'orta',
    d,
    m: null,
  }
}

export function blankCanvas(): Canvas {
  return {
    bg: 'zemin',
    hd: 34,
    hm: null,
    items: [
      { ...blankItem('baslik', { y: 7 }), text: 'Başlığınız' },
      { ...blankItem('yazi', { y: 15 }), text: 'Önizlemede bu yazıyı sürükleyip istediğiniz yere taşıyabilirsiniz.' },
    ],
  }
}

const TYPES = new Set<CanvasItemType>(['baslik', 'yazi', 'fotograf', 'dugme'])

export function normalizeCanvas(raw: unknown): Canvas {
  const base = blankCanvas()
  const c = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const seen = new Set<string>()
  const items = (Array.isArray(c.items) ? c.items : []).flatMap((x): CanvasItem[] => {
    if (!x || typeof x !== 'object') return []
    const it = x as Record<string, unknown>
    const type = it.type as CanvasItemType
    if (!TYPES.has(type)) return []
    const tpl = blankItem(type)
    let id = typeof it.id === 'string' && /^[\w-]{1,40}$/.test(it.id) ? it.id : tpl.id
    if (seen.has(id)) id = newItemId()
    seen.add(id)
    const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '')
    return [
      {
        id,
        type,
        text: str(it.text, 4000),
        /* Deneme modunda fotoğraf tarayıcıda veri adresi olarak duruyor, uzun olabilir */
        src: str(it.src, 3_000_000),
        href: str(it.href, 2000),
        align: it.align === 'sol' || it.align === 'sag' ? it.align : 'orta',
        d: normalizeRect(it.d, tpl.d),
        m: it.m ? normalizeRect(it.m, tpl.d) : null,
      },
    ]
  })
  const hm = typeof c.hm === 'number' && Number.isFinite(c.hm) ? round(clamp(c.hm, 10, 600, 120)) : null
  return {
    bg: c.bg === 'kagit' ? 'kagit' : 'zemin',
    hd: round(clamp(c.hd, 8, 300, base.hd)),
    hm,
    /* Telefon yerleşimi yarım kalmasın: biri bile eksikse hepsi otomatiğe döner */
    items: (hm !== null && items.some((i) => !i.m) ? items.map((i) => ({ ...i, m: null })) : items).slice(0, CANVAS_LIMIT),
  }
}

/* ——— Önizlemeden gelen değişiklik ——— */

export type CanvasPatch = {
  items?: { id: string; set: Partial<Pick<CanvasItem, 'd' | 'm' | 'text'>> }[]
  /** Telefon yerleşimine geçerken bütün öğelerin `m`'si ile birlikte gelir */
  hd?: number
  hm?: number | null
  remove?: string
}

/** Önizlemenin gönderdiği değişikliği uygular; sayılar yine sınırlanıyor */
export function applyCanvasPatch(c: Canvas, p: CanvasPatch): Canvas {
  const sets = new Map((p.items ?? []).map((x) => [x.id, x.set]))
  const items = c.items
    .filter((i) => i.id !== p.remove)
    .map((i) => {
      const s = sets.get(i.id)
      if (!s) return i
      return {
        ...i,
        ...(s.d ? { d: normalizeRect(s.d, i.d) } : {}),
        ...('m' in s ? { m: s.m ? normalizeRect(s.m, i.m ?? i.d) : null } : {}),
        ...(typeof s.text === 'string' ? { text: s.text.slice(0, 4000) } : {}),
      }
    })
  return normalizeCanvas({
    ...c,
    items,
    ...(p.hd !== undefined ? { hd: p.hd } : {}),
    ...(p.hm !== undefined ? { hm: p.hm } : {}),
  })
}

/** Telefonda otomatik dizilime dön */
export const resetPhone = (c: Canvas): Canvas => ({ ...c, hm: null, items: c.items.map((i) => ({ ...i, m: null })) })

/** Otomatik dizilimde sıra: yukarıdan aşağıya, aynı hizadakiler soldan sağa */
export const flowOrder = (items: CanvasItem[]) =>
  items.slice().sort((a, b) => (Math.abs(a.d.y - b.d.y) < 2 ? a.d.x - b.d.x : a.d.y - b.d.y))

export const canvasIsEmpty = (c: Canvas) =>
  !c.items.some((i) => (i.type === 'fotograf' ? i.src.trim() : i.text.trim()))

/**
 * Hazır bir bölümü serbest düzene çevirir: başlık, yazı, fotoğraf ve düğme
 * bugünkü yerlerine yakın konup tek tek sürüklenebilir hâle geliyor.
 */
export function toCanvas(b: Block): Canvas {
  const items: CanvasItem[] = []
  const add = (type: CanvasItemType, r: Partial<Rect>, extra: Partial<CanvasItem> = {}) =>
    items.push({ ...blankItem(type, r), ...extra })
  const heading = (r: Partial<Rect>, align: CanvasItem['align'] = 'orta') => b.heading && add('baslik', r, { text: b.heading, align })
  const text = (r: Partial<Rect>, align: CanvasItem['align'] = 'orta') => b.text && add('yazi', r, { text: b.text, align })
  const button = (r: Partial<Rect>) => b.buttonLabel && add('dugme', r, { text: b.buttonLabel, href: b.buttonHref })
  let hd = 40

  switch (b.kind) {
    case 'yazi':
    case 'duyuru':
      heading({ x: 15, y: 5, w: 70 })
      text({ x: 20, y: 13, w: 60 })
      button({ x: 39, y: 26, w: 22 })
      hd = 34
      break
    case 'fotograf-yazi': {
      const left = b.imageSide !== 'sag'
      add('fotograf', { x: left ? 0 : 55, y: 0, w: 45, h: 56 }, { src: b.image })
      const tx = left ? 52 : 0
      heading({ x: tx, y: 12, w: 48 }, 'sol')
      text({ x: tx, y: 22, w: 46 }, 'sol')
      button({ x: tx, y: 40, w: 22 })
      hd = 57
      break
    }
    case 'buyuk-fotograf':
      heading({ x: 15, y: 0, w: 70 })
      add('fotograf', { x: 0, y: 8, w: 100, h: 62 }, { src: b.image })
      text({ x: 20, y: 73, w: 60 })
      button({ x: 39, y: 82, w: 22 })
      hd = 90
      break
    case 'galeri': {
      heading({ x: 15, y: 0, w: 70 })
      text({ x: 20, y: 7, w: 60 })
      const top = b.text ? 16 : b.heading ? 9 : 0
      b.images.forEach((im, i) => {
        const col = i % 3
        const row = Math.floor(i / 3)
        add('fotograf', { x: col * 34.5, y: top + row * 26, w: 31, h: 23 }, { src: im.src })
      })
      const rows = Math.ceil(b.images.length / 3)
      button({ x: 39, y: top + rows * 26 + 1, w: 22 })
      hd = top + rows * 26 + (b.buttonLabel ? 8 : 0)
      break
    }
    case 'serbest':
      return b.canvas
  }
  return { bg: b.kind === 'duyuru' ? 'kagit' : 'zemin', hd: Math.max(12, hd), hm: null, items }
}

/**
 * Panelden yeni öğe: tuvalin ortasına konuyor. Telefon yerleşimi varsa
 * orada da ortaya, telefona uygun genişlikte.
 */
export function addItem(c: Canvas, type: CanvasItemType): { canvas: Canvas; id: string } {
  const it = blankItem(type)
  const h = type === 'fotograf' ? it.d.h : 6
  it.d = { ...it.d, y: round(Math.max(1, c.hd / 2 - h / 2)) }
  if (c.hm !== null) {
    const w = type === 'dugme' ? it.d.w : 84
    const mh = type === 'fotograf' ? round((w * it.d.h) / it.d.w) : 14
    it.m = { x: round(50 - w / 2), y: round(Math.max(1, c.hm / 2 - mh / 2)), w, h: mh, fs: round(Math.min(12, it.d.fs * 2.6)) }
  }
  return { canvas: { ...c, items: [...c.items, it] }, id: it.id }
}

/** Panelden yazı boyu: bilgisayar ve (varsa) telefon yerleşiminde aynı oranda */
export function scaleFont(it: CanvasItem, fs: number): CanvasItem {
  const k = fs / it.d.fs
  return { ...it, d: { ...it.d, fs: round(fs) }, m: it.m ? { ...it.m, fs: round(it.m.fs * k) } : null }
}
