import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent } from 'react'
import { PHONE_MAX, type CanvasItem, type CanvasPatch, type Rect } from '../lib/canvas'
import { onPanelMessage, sendToPanel } from '../lib/preview'
import type { Block } from '../lib/siteContent'
import { CanvasSurface, FlowItems, ItemBody, itemBoxStyle, rectFor, type CanvasMode } from './CanvasBlock'

/*
 * Paneldeki önizlemede "Serbest düzen" bölümünü düzenleme katmanı. Yalnızca
 * önizlemede yükleniyor (gerçek sitenin paketine girmiyor).
 *
 * - Öğeye tıkla: seçilir, panelde alanları açılır.
 * - Sürükle: taşınır. Köşe tutamaçları: fotoğrafta boyut, yazıda yazı boyu;
 *   yan tutamaçlar: yazının genişliği. Alttaki tutamaç: bölümün yüksekliği.
 * - Kılavuz çizgileri yalnızca hizaya GELİNCE çıkıyor: tuvalin tam ortası,
 *   kenarları ya da başka bir öğenin kenarı/ortası birkaç piksel yakına
 *   gelince öğe oraya oturuyor ve çizgi görünüyor; uzaklaşınca kayboluyor.
 *   Alt tuşu basılıyken mıknatıs kapalı.
 * - Çift tıkla: yazı yerinde düzenlenir. Oklar: ince kaydırma (Shift ile
 *   büyük adım). Delete: öğeyi siler. Esc: seçimi bırakır.
 *
 * Değişiklik bırakıldığı anda panele gidiyor; panel taslağı güncelleyip
 * önizlemeye geri yolluyor. "Kaydet"e basılana kadar gerçek site değişmez.
 */

/** Mıknatısın çektiği uzaklık (ekran pikseli) */
const SNAP_PX = 7
const SEL = '#4aa8ff'
const GUIDE = '#ff3d8b'
const z = (px: number) => `calc(${px}px * var(--onizleme-olcek, 1))`

type Handle = 'tasi' | 'sol-ust' | 'sag-ust' | 'sol-alt' | 'sag-alt' | 'sol' | 'sag' | 'yukseklik'
type Guides = { v: number[]; h: number[] }

const r2 = (n: number) => Math.round(n * 100) / 100
const roundRect = (r: Rect): Rect => ({ x: r2(r.x), y: r2(r.y), w: r2(r.w), h: r2(r.h), fs: r2(r.fs) })
const near = (a: Rect, b: Rect) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.w - b.w) + Math.abs(a.fs - b.fs) < 0.05

/**
 * Hareket eden kenarlardan (ör. sol, orta, sağ) en yakın hedefe olan farkı
 * bulur. Eşik içinde hedef yoksa fark 0 ve çizgi yok.
 */
function snap(moving: number[], targets: number[], th: number) {
  let best: number | null = null
  for (const m of moving)
    for (const t of targets) {
      const d = t - m
      if (Math.abs(d) <= th && (best === null || Math.abs(d) < Math.abs(best))) best = d
    }
  if (best === null) return { d: 0, at: [] as number[] }
  const d = best
  const at = [...new Set(targets.filter((t) => moving.some((m) => Math.abs(m + d - t) < 0.02)).map(r2))]
  return { d, at }
}

const CURSOR: Record<Exclude<Handle, 'tasi'>, string> = {
  'sol-ust': 'nwse-resize',
  'sag-alt': 'nwse-resize',
  'sag-ust': 'nesw-resize',
  'sol-alt': 'nesw-resize',
  sol: 'ew-resize',
  sag: 'ew-resize',
  yukseklik: 'ns-resize',
}

function handlesFor(type: CanvasItem['type']): Exclude<Handle, 'tasi' | 'yukseklik'>[] {
  if (type === 'fotograf') return ['sol-ust', 'sag-ust', 'sol-alt', 'sag-alt']
  if (type === 'dugme') return ['sag-alt']
  return ['sol', 'sag', 'sag-alt']
}

function handleStyle(h: Exclude<Handle, 'tasi' | 'yukseklik'>): CSSProperties {
  const side = h === 'sol' || h === 'sag'
  const s: CSSProperties = {
    position: 'absolute',
    width: z(side ? 8 : 12),
    height: z(side ? 26 : 12),
    background: '#fff',
    border: `${z(2)} solid ${SEL}`,
    borderRadius: z(side ? 6 : 3),
    transform: 'translate(-50%, -50%)',
    cursor: CURSOR[h],
    zIndex: 3,
    touchAction: 'none',
  }
  if (h.startsWith('sol')) s.left = 0
  else s.left = '100%'
  if (h.endsWith('ust')) s.top = 0
  else if (h.endsWith('alt')) s.top = '100%'
  else s.top = '50%'
  return s
}

type Drag = {
  id: string
  handle: Handle
  sx: number
  sy: number
  u: number
  r0: Rect
  H: number
  others: Rect[]
  moved: boolean
  last: Rect | null
  lastH: number | null
  type: CanvasItem['type'] | null
  /** Hangi yerleşime yazılacak (sürükleme başında belli) */
  key: 'd' | 'm'
}

export default function CanvasEditor({ block, mode }: { block: Block; mode: CanvasMode }) {
  const c = block.canvas
  const paper = c.bg === 'kagit'
  const surface = useRef<HTMLDivElement>(null)
  const [sel, setSel] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  /* Sürüklenirken ve panelden yanıt gelene kadar yerel değerler */
  const [over, setOver] = useState<Record<string, Rect>>({})
  const [hOver, setHOver] = useState<number | null>(null)
  const [tOver, setTOver] = useState<Record<string, string>>({})
  const [guides, setGuides] = useState<Guides>({ v: [], h: [] })
  /* Telefonda alt alta dizilimden serbest yerleşime geçiş (panel yanıtlayana kadar) */
  const [local, setLocal] = useState<{ hm: number; m: Record<string, Rect> } | null>(null)
  const drag = useRef<Drag | null>(null)
  /* Çift tıklamayı kendimiz yakalıyoruz: sürükleme için basışı iptal ettiğimizde tarayıcı dblclick göndermeyebiliyor */
  const lastDown = useRef<{ id: string; t: number } | null>(null)

  const phoneWidth = window.innerWidth <= PHONE_MAX
  const editMode: CanvasMode = local && c.hm === null ? 'm' : mode
  const layoutKey = editMode === 'm' ? 'm' : 'd'
  const H = hOver ?? (editMode === 'm' ? (local && c.hm === null ? local.hm : (c.hm ?? c.hd)) : c.hd)

  const rectOf = useCallback(
    (it: CanvasItem): Rect => over[it.id] ?? (local && c.hm === null && local.m[it.id] ? local.m[it.id] : rectFor(it, editMode)),
    [over, local, c.hm, editMode],
  )

  /* Panelden yanıt gelince, karşılığı gelmiş yerel değerleri bırak */
  useEffect(() => {
    if (drag.current) return
    setOver((o) => {
      const next: Record<string, Rect> = {}
      for (const [id, r] of Object.entries(o)) {
        const it = c.items.find((i) => i.id === id)
        if (it && !near(rectFor(it, editMode), r)) next[id] = r
      }
      return next
    })
    setHOver((h) => (h !== null && Math.abs((editMode === 'm' ? (c.hm ?? c.hd) : c.hd) - h) < 0.05 ? null : h))
    setTOver((t) => {
      const next: Record<string, string> = {}
      for (const [id, v] of Object.entries(t)) if (c.items.find((i) => i.id === id)?.text !== v) next[id] = v
      return next
    })
    if (c.hm !== null) setLocal(null)
  }, [c, editMode])

  const send = useCallback((patch: CanvasPatch) => sendToPanel({ type: 'uk-tuval', block: block.id, patch }), [block.id])
  const choose = useCallback(
    (id: string | null) => {
      setSel(id)
      sendToPanel({ type: 'uk-sec', block: block.id, item: id })
    },
    [block.id],
  )

  /* Panelde bir öğe açılınca önizlemede de seçilsin */
  useEffect(
    () =>
      onPanelMessage((msg) => {
        if (msg.type !== 'uk-sec') return
        setSel(msg.block === block.id ? msg.item : null)
      }),
    [block.id],
  )

  /** Öğelerin tuvaldeki gerçek kutuları (yazının yüksekliği içeriğe bağlı) */
  const measure = useCallback(() => {
    const el = surface.current
    const out: Record<string, Rect> = {}
    if (!el) return { out, u: 1 }
    const box = el.getBoundingClientRect()
    const u = box.width / 100
    for (const it of c.items) {
      const node = el.querySelector<HTMLElement>(`[data-oge="${it.id}"]`)
      if (!node) continue
      const r = node.getBoundingClientRect()
      const fsPx = parseFloat(getComputedStyle(node).fontSize) || 16
      out[it.id] = {
        x: (r.left - box.left) / u,
        y: (r.top - box.top) / u,
        w: r.width / u,
        h: r.height / u,
        fs: editMode === 'akis' ? fsPx / u : rectOf(it).fs,
      }
    }
    return { out, u, height: box.height / u }
  }, [c.items, editMode, rectOf])

  const onMove = useCallback((ev: PointerEvent) => {
    const g = drag.current
    if (!g) return
    if (!g.moved && Math.hypot(ev.clientX - g.sx, ev.clientY - g.sy) < 3) return
    g.moved = true
    const dx = (ev.clientX - g.sx) / g.u
    const dy = (ev.clientY - g.sy) / g.u
    const th = ev.altKey ? -1 : SNAP_PX / g.u
    const X = [0, 50, 100, ...g.others.flatMap((o) => [o.x, o.x + o.w / 2, o.x + o.w])]
    const Y = [0, g.H / 2, g.H, ...g.others.flatMap((o) => [o.y, o.y + o.h / 2, o.y + o.h])]
    const r0 = g.r0

    if (g.handle === 'yukseklik') {
      const bottoms = g.others.map((o) => o.y + o.h)
      let h = Math.max(8, g.H + dy)
      const s = snap([h], bottoms, th)
      h += s.d
      g.lastH = h
      setHOver(h)
      setGuides({ v: [], h: s.at })
      return
    }

    let r: Rect = { ...r0 }
    let v: number[] = []
    let hl: number[] = []
    if (g.handle === 'tasi') {
      r.x = r0.x + dx
      r.y = r0.y + dy
      const sx = snap([r.x, r.x + r.w / 2, r.x + r.w], X, th)
      const sy = snap([r.y, r.y + r.h / 2, r.y + r.h], Y, th)
      r.x += sx.d
      r.y += sy.d
      v = sx.at
      hl = sy.at
    } else if (g.handle === 'sol' || g.handle === 'sag') {
      /* Yazının genişliği: satırlar yeniden kırılıyor */
      let L = r0.x
      let R = r0.x + r0.w
      if (g.handle === 'sol') {
        const s = snap([L + dx], X, th)
        L = Math.min(R - 6, L + dx + s.d)
        v = s.at
      } else {
        const s = snap([R + dx], X, th)
        R = Math.max(L + 6, R + dx + s.d)
        v = s.at
      }
      r = { ...r0, x: L, w: R - L }
    } else if (g.type !== 'fotograf') {
      /* Yazı ve düğmede köşe: yazı boyu büyüyor/küçülüyor, oran korunuyor */
      let R = r0.x + r0.w + dx
      const s = snap([R], X, th)
      R += s.d
      v = s.at
      const k = Math.max(0.25, (R - r0.x) / r0.w)
      r = { ...r0, w: r0.w * k, h: r0.h * k, fs: r0.fs * k }
    } else {
      /* Fotoğrafta köşe: sürüklenen iki kenar hareket ediyor; Shift ile oran korunur */
      let L = r0.x
      let R = r0.x + r0.w
      let T = r0.y
      let B = r0.y + r0.h
      const h = g.handle
      if (h.startsWith('sol')) {
        const s = snap([L + dx], X, th)
        L = Math.min(R - 4, L + dx + s.d)
        v = s.at
      } else {
        const s = snap([R + dx], X, th)
        R = Math.max(L + 4, R + dx + s.d)
        v = s.at
      }
      if (ev.shiftKey) {
        const nh = ((R - L) * r0.h) / r0.w
        if (h.endsWith('ust')) T = B - nh
        else B = T + nh
      } else if (h.endsWith('ust')) {
        const s = snap([T + dy], Y, th)
        T = Math.min(B - 4, T + dy + s.d)
        hl = s.at
      } else {
        const s = snap([B + dy], Y, th)
        B = Math.max(T + 4, B + dy + s.d)
        hl = s.at
      }
      r = { ...r0, x: L, y: T, w: R - L, h: B - T }
    }
    g.last = r
    setOver((o) => ({ ...o, [g.id]: r }))
    setGuides({ v, h: hl })
  }, [])

  const onUp = useCallback(() => {
    const g = drag.current
    drag.current = null
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)
    setGuides({ v: [], h: [] })
    if (!g || !g.moved) return
    if (g.handle === 'yukseklik' && g.lastH !== null) {
      send(g.key === 'm' ? { hm: r2(g.lastH) } : { hd: r2(g.lastH) })
    } else if (g.last) {
      /* Öğe tuvalin altına taştıysa bölüm onu içine alacak kadar uzasın */
      const bottom = g.last.y + g.last.h
      const grow = bottom > g.H ? { [g.key === 'm' ? 'hm' : 'hd']: r2(bottom + 2) } : {}
      send({ items: [{ id: g.id, set: { [g.key]: roundRect(g.last) } }], ...grow })
    }
  }, [onMove, send])

  const start = (e: RPointerEvent, id: string, handle: Handle) => {
    if (e.button !== 0 || (editing && editing === id)) return
    e.preventDefault()
    e.stopPropagation()
    /* Basışı iptal edince çerçeve klavye odağını almıyor; oklar ve Delete çalışsın */
    window.focus()
    const item = c.items.find((i) => i.id === id)
    if (handle === 'tasi' && item && item.type !== 'fotograf') {
      const now = performance.now()
      const prev = lastDown.current
      lastDown.current = { id, t: now }
      if (prev && prev.id === id && now - prev.t < 400) {
        lastDown.current = null
        setEditing(id)
        return
      }
    }
    if (handle !== 'yukseklik') choose(id)
    let { out, u, height } = measure()
    let H0 = H
    const key = editMode === 'akis' ? 'm' : layoutKey

    /* Telefonda alt alta dizilimdeyken ilk sürükleme: telefona özel yerleşim başlıyor */
    if (editMode === 'akis') {
      if (!phoneWidth) return
      H0 = Math.ceil((height ?? 100) + 2)
      const m: Record<string, Rect> = {}
      for (const it of c.items) if (out[it.id]) m[it.id] = roundRect(out[it.id])
      setLocal({ hm: H0, m })
      send({ hm: H0, items: c.items.map((it) => ({ id: it.id, set: { m: m[it.id] ?? it.d } })) })
      out = m
    }
    const r0 = out[id] ?? (handle === 'yukseklik' ? { x: 0, y: 0, w: 1, h: 1, fs: 1 } : null)
    if (!r0) return
    drag.current = {
      id,
      handle,
      sx: e.clientX,
      sy: e.clientY,
      u,
      r0,
      H: H0,
      others: Object.entries(out)
        .filter(([k]) => k !== id)
        .map(([, r]) => r),
      moved: false,
      last: null,
      lastH: null,
      type: c.items.find((i) => i.id === id)?.type ?? null,
      key,
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  /* Klavye: oklarla ince ayar, Delete ile sil, Esc ile bırak */
  useEffect(() => {
    if (!sel || editing) return
    const it = c.items.find((i) => i.id === sel)
    if (!it) return
    const onKey = (ev: KeyboardEvent) => {
      const t = ev.target as HTMLElement | null
      if (t && (t.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(t.tagName))) return
      if (ev.key === 'Escape') return choose(null)
      if (ev.key === 'Delete' || ev.key === 'Backspace') {
        ev.preventDefault()
        send({ remove: sel })
        return choose(null)
      }
      const step = ev.shiftKey ? 2 : 0.25
      const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[ev.key]
      if (!d || editMode === 'akis') return
      ev.preventDefault()
      const r = rectOf(it)
      const next = roundRect({ ...r, x: r.x + d[0], y: r.y + d[1] })
      setOver((o) => ({ ...o, [it.id]: next }))
      send({ items: [{ id: it.id, set: { [layoutKey]: next } }] })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sel, editing, c.items, editMode, layoutKey, rectOf, send, choose])

  useEffect(
    () => () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    },
    [onMove, onUp],
  )

  /* ——— Yerinde yazı düzenleme ——— */
  const editable = (it: CanvasItem) =>
    editing === it.id ? (
      <span
        ref={(el) => {
          if (el && document.activeElement !== el) {
            el.focus()
            const range = document.createRange()
            range.selectNodeContents(el)
            window.getSelection()?.removeAllRanges()
            window.getSelection()?.addRange(range)
          }
        }}
        contentEditable="plaintext-only"
        suppressContentEditableWarning
        className="block cursor-text outline-none"
        onPointerDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape' || (e.key === 'Enter' && it.type !== 'yazi' && !e.shiftKey)) {
            e.preventDefault()
            ;(e.currentTarget as HTMLElement).blur()
          }
        }}
        onBlur={(e) => {
          const text = e.currentTarget.innerText.replace(/\n{3,}/g, '\n\n').replace(/\s+$/, '')
          setEditing(null)
          if (text !== it.text) {
            setTOver((t) => ({ ...t, [it.id]: text }))
            send({ items: [{ id: it.id, set: { text } }] })
          }
        }}
      >
        {tOver[it.id] ?? it.text}
      </span>
    ) : undefined

  const shown = (it: CanvasItem): CanvasItem => (tOver[it.id] !== undefined ? { ...it, text: tOver[it.id] } : it)

  const selOutline = (id: string): CSSProperties =>
    sel === id ? { outline: `${z(2)} solid ${SEL}`, outlineOffset: z(3) } : {}

  const hint = (text: string) => (
    <p
      className="pointer-events-none absolute -top-2 right-0 z-20 -translate-y-full rounded-full bg-[#1a110a]/80 px-3 py-1 text-[0.75rem] text-ivory-100"
      style={{ zoom: 'var(--onizleme-olcek, 1)' }}
    >
      {text}
    </p>
  )

  /* ——— Alt alta dizilim (telefon yerleşimi henüz yok) ——— */
  if (editMode === 'akis') {
    return (
      <div className="relative">
        {hint(phoneWidth ? 'Telefonda alt alta diziliyor · bir öğeyi sürükleyince serbest yerleşim başlar' : 'Bu genişlikte öğeler alt alta dizilir')}
        <CanvasSurface
          canvas={c}
          ref={surface}
          style={{ outline: `${z(1)} dashed ${paper ? 'rgb(74 56 38 / 0.35)' : 'rgb(255 255 255 / 0.28)'}`, outlineOffset: z(6) }}
        >
          <FlowItems
            canvas={{ ...c, items: c.items.map(shown) }}
            editingText={editable}
            wrap={(it, body) => (
              <div
                key={it.id}
                onPointerDown={(e) => start(e, it.id, 'tasi')}
                className="cursor-move"
                style={{ ...selOutline(it.id), touchAction: 'none', display: 'flex', flexDirection: 'column' }}
              >
                {body}
              </div>
            )}
          />
        </CanvasSurface>
      </div>
    )
  }

  /* ——— Serbest yerleşim ——— */
  return (
    <div className="relative">
      {hint(editMode === 'm' ? 'Telefon yerleşimi · sürükleyin, köşesinden boyutlandırın' : 'Sürükleyin, köşesinden boyutlandırın · çift tıkla yazıyı düzenle')}
      <CanvasSurface
        canvas={c}
        ref={surface}
        style={{
          containerType: 'inline-size',
          aspectRatio: `100 / ${H}`,
          outline: `${z(1)} dashed ${paper ? 'rgb(74 56 38 / 0.35)' : 'rgb(255 255 255 / 0.28)'}`,
          outlineOffset: z(paper ? 0 : 6),
        }}
      >
        {/* Boş yere tıklamak seçimi bırakır */}
        <div className="absolute inset-0" onPointerDown={() => sel && choose(null)} />

        {c.items.map((raw) => {
          const it = shown(raw)
          const r = rectOf(raw)
          return (
            <div
              key={it.id}
              data-oge={it.id}
              onPointerDown={(e) => start(e, it.id, 'tasi')}
              style={{
                ...itemBoxStyle(it, r),
                ...selOutline(it.id),
                cursor: editing === it.id ? 'text' : 'move',
                touchAction: 'none',
                userSelect: editing === it.id ? 'text' : 'none',
                zIndex: sel === it.id ? 2 : undefined,
              }}
            >
              <ItemBody item={it} paper={paper} editingText={editable(it)} />
              {sel === it.id &&
                editing !== it.id &&
                handlesFor(it.type).map((h) => (
                  <span key={h} style={handleStyle(h)} onPointerDown={(e) => start(e, it.id, h)} />
                ))}
            </div>
          )
        })}

        {/* Kılavuz çizgileri — yalnızca hizaya gelince */}
        {guides.v.map((x) => (
          <span
            key={`v${x}`}
            aria-hidden
            className="pointer-events-none absolute z-10"
            style={{ left: `${x}%`, top: z(-14), bottom: z(-14), width: z(Math.abs(x - 50) < 0.01 ? 2 : 1), background: GUIDE, transform: 'translateX(-50%)' }}
          />
        ))}
        {guides.h.map((y) => (
          <span
            key={`h${y}`}
            aria-hidden
            className="pointer-events-none absolute z-10"
            style={{ top: `${y}cqw`, left: z(-14), right: z(-14), height: z(Math.abs(y - H / 2) < 0.01 ? 2 : 1), background: GUIDE, transform: 'translateY(-50%)' }}
          />
        ))}
      </CanvasSurface>

      {/* Bölümün yüksekliği */}
      <div className="relative z-30 mt-2 flex justify-center">
        <button
          type="button"
          onPointerDown={(e) => start(e, '__yukseklik', 'yukseklik')}
          className="rounded-full bg-[#1a110a]/70 px-4 py-1.5 font-display text-[0.75rem] font-bold text-ivory-100 ring-1 ring-ivory-100/30 hover:bg-[#1a110a]"
          style={{ cursor: 'ns-resize', touchAction: 'none', zoom: 'var(--onizleme-olcek, 1)' }}
        >
          ⇕ Bölümün yüksekliği
        </button>
      </div>
    </div>
  )
}
