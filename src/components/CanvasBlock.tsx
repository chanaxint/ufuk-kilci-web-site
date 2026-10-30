import { lazy, Suspense, useEffect, useState, type CSSProperties, type ReactNode, type Ref } from 'react'
import { useContent } from '../lib/ContentContext'
import { DEFAULT_FS, DESKTOP_MIN, PHONE_MAX, flowOrder, type Canvas, type CanvasItem, type Rect } from '../lib/canvas'
import { GRAIN, PAPER, AGE } from '../lib/paper'
import { isPreview } from '../lib/preview'
import { safeHref, safeImage, type Block } from '../lib/siteContent'
import Reveal from './ui/Reveal'
import { Emphasis } from './ui/RichText'
import { ArrowRight } from './ui/icons'

/*
 * "Serbest düzen" bölümünün sitedeki hâli. Konumlar tuval genişliğinin
 * yüzdesi; `cqw` birimi (tuvalin kendi genişliği) sayesinde ekran
 * küçüldükçe her şey aynı oranda küçülüyor. Panelin önizlemesinde aynı
 * çizim sürüklenebilir sürümüyle (`CanvasEditor`) değişiyor.
 */

const CanvasEditor = isPreview ? lazy(() => import('./CanvasEditor')) : null

export type CanvasMode = 'd' | 'm' | 'akis'

function useWidth() {
  const [w, setW] = useState(() => window.innerWidth)
  useEffect(() => {
    const on = () => setW(window.innerWidth)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return w
}

export function modeFor(c: Canvas, width: number): CanvasMode {
  if (width >= DESKTOP_MIN) return 'd'
  if (width <= PHONE_MAX && c.hm !== null) return 'm'
  return 'akis'
}

export const rectFor = (it: CanvasItem, mode: CanvasMode): Rect => (mode === 'm' && it.m ? it.m : it.d)

const ALIGN = { sol: 'left', orta: 'center', sag: 'right' } as const

/** Bir öğenin içeriği — konumdan bağımsız, hem serbest hem alt alta düzende aynı */
export function ItemBody({ item, paper, editingText }: { item: CanvasItem; paper: boolean; editingText?: ReactNode }) {
  const content = useContent()
  switch (item.type) {
    case 'baslik':
      return (
        <h2
          className={`font-display leading-[1.1] font-extrabold tracking-[-0.02em] whitespace-pre-line ${paper ? 'text-[#31241a]' : 'text-ivory-50'}`}
          style={{ textAlign: ALIGN[item.align], fontSize: '1em' }}
        >
          {editingText ?? <Emphasis text={item.text} />}
        </h2>
      )
    case 'yazi':
      return (
        <p
          className={`leading-relaxed whitespace-pre-line ${paper ? 'text-[#4a3826]' : 'text-ivory-200'}`}
          style={{ textAlign: ALIGN[item.align] }}
        >
          {editingText ?? item.text}
        </p>
      )
    case 'dugme': {
      const href = safeHref(item.href, content)
      const external = !!href && /^https?:/i.test(href)
      return (
        <a
          href={href ?? undefined}
          target={external ? '_blank' : undefined}
          rel={external ? 'noreferrer' : undefined}
          onClick={isPreview ? (e) => e.preventDefault() : undefined}
          draggable={false}
          className={`group inline-flex items-center gap-[0.5em] rounded-full font-display font-bold whitespace-nowrap transition-colors ${
            paper ? 'bg-[#2a1d12] text-[#f4ead6] hover:bg-[#3b2a1a]' : 'bg-ivory-50 text-ink-900 hover:bg-white'
          }`}
          style={{ padding: '0.85em 1.7em' }}
        >
          {editingText ?? item.text}
          <ArrowRight className="size-[1em] transition-transform duration-300 group-hover:translate-x-0.5" />
        </a>
      )
    }
    case 'fotograf': {
      const url = safeImage(item.src)
      return url ? (
        <img src={url} alt="" draggable={false} loading="lazy" className="size-full rounded-[min(1.5rem,6%)] object-cover shadow-lift" />
      ) : isPreview ? (
        <div className="grid size-full place-items-center rounded-2xl border-2 border-dashed border-ivory-100/40 bg-[#1a110a]/30 text-[0.85rem] text-ivory-300">
          Fotoğraf seçilmedi
        </div>
      ) : null
    }
  }
}

/** Tuvalin zemini: ahşabın kendisi ya da üstüne konmuş eski kâğıt */
export function CanvasSurface({
  canvas,
  children,
  style,
  className = '',
  ref,
}: {
  canvas: Canvas
  children: ReactNode
  style?: CSSProperties
  className?: string
  ref?: Ref<HTMLDivElement>
}) {
  const paper = canvas.bg === 'kagit'
  return (
    <div
      ref={ref}
      className={`relative ${paper ? 'on-paper overflow-hidden rounded-[3px] shadow-[0_2px_6px_-2px_rgb(12_7_3/0.5),0_30px_64px_-30px_rgb(12_7_3/0.85),inset_0_0_30px_rgb(126_96_52/0.18)]' : ''} ${className}`}
      style={{ ...(paper ? { background: PAPER } : {}), ...style }}
    >
      {paper && (
        <>
          <span aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.4] mix-blend-multiply" style={GRAIN} />
          <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: AGE }} />
        </>
      )}
      {children}
    </div>
  )
}

/** Serbest yerleşimde bir öğenin kutusu */
export function itemBoxStyle(it: CanvasItem, r: Rect): CSSProperties {
  return {
    position: 'absolute',
    left: `${r.x}%`,
    top: `${r.y}cqw`,
    width: it.type === 'dugme' ? 'max-content' : `${r.w}%`,
    height: it.type === 'fotograf' ? `${r.h}cqw` : undefined,
    fontSize: `${r.fs}cqw`,
  }
}

/** Alt alta düzende yazı boyu: türün olağan boyu × panelde verilen oran */
function flowFont(it: CanvasItem) {
  const base = { baslik: 2, yazi: 1.05, dugme: 0.95, fotograf: 1 }[it.type]
  const k = Math.min(1.5, Math.max(0.7, it.d.fs / DEFAULT_FS[it.type]))
  return `${(base * k).toFixed(3)}rem`
}

export function FlowItems({
  canvas,
  wrap,
  editingText,
}: {
  canvas: Canvas
  wrap?: (it: CanvasItem, body: ReactNode) => ReactNode
  editingText?: (it: CanvasItem) => ReactNode
}) {
  const paper = canvas.bg === 'kagit'
  return (
    <div className={`relative flex flex-col gap-6 ${paper ? 'px-7 py-9' : ''}`}>
      {flowOrder(canvas.items).map((it) => {
        if (!isPreview && (it.type === 'fotograf' ? !safeImage(it.src) : !it.text.trim())) return null
        const body = (
          <div
            data-oge={it.id}
            style={{
              fontSize: flowFont(it),
              ...(it.type === 'fotograf' ? { aspectRatio: `${it.d.w} / ${it.d.h}` } : {}),
              ...(it.type === 'dugme' ? { alignSelf: it.align === 'sol' ? 'flex-start' : it.align === 'sag' ? 'flex-end' : 'center' } : {}),
            }}
          >
            <ItemBody item={it} paper={paper} editingText={editingText?.(it)} />
          </div>
        )
        return wrap ? wrap(it, body) : <Reveal key={it.id}>{body}</Reveal>
      })}
    </div>
  )
}

function StaticCanvas({ canvas, mode }: { canvas: Canvas; mode: CanvasMode }) {
  const paper = canvas.bg === 'kagit'
  if (mode === 'akis') {
    return (
      <CanvasSurface canvas={canvas}>
        <FlowItems canvas={canvas} />
      </CanvasSurface>
    )
  }
  const H = mode === 'm' && canvas.hm !== null ? canvas.hm : canvas.hd
  return (
    <CanvasSurface canvas={canvas} style={{ containerType: 'inline-size', aspectRatio: `100 / ${H}` }}>
      {canvas.items.map((it, i) => {
        if (it.type === 'fotograf' ? !safeImage(it.src) : !it.text.trim()) return null
        return (
          <div key={it.id} style={itemBoxStyle(it, rectFor(it, mode))}>
            <Reveal delay={Math.min(i, 6) * 0.05} className="size-full">
              <ItemBody item={it} paper={paper} />
            </Reveal>
          </div>
        )
      })}
    </CanvasSurface>
  )
}

export default function CanvasBlock({ block }: { block: Block }) {
  const width = useWidth()
  const mode = modeFor(block.canvas, width)
  if (CanvasEditor) {
    return (
      <Suspense fallback={<StaticCanvas canvas={block.canvas} mode={mode} />}>
        <CanvasEditor block={block} mode={mode} />
      </Suspense>
    )
  }
  return <StaticCanvas canvas={block.canvas} mode={mode} />
}
