import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { SiteContent, SiteSectionId } from '../lib/siteContent'
import type { PanelToSite, SiteToPanel } from '../lib/preview'
import type { CanvasPatch } from '../lib/canvas'

/*
 * Canlı önizleme: site bir çerçevede `/?onizleme=1` ile açılıyor, panel
 * kaydedilmemiş taslağı ona mesajla gönderiyor. Çerçevede yapılan hiçbir
 * şey kaydedilmiyor; "Kaydet"e basılana kadar gerçek site değişmiyor.
 *
 * "Bilgisayar" görünümü siteyi 1280 piksel genişlikte çizip alana sığacak
 * kadar küçültüyor — böylece dar panelde de masaüstündeki düzen görünüyor.
 */

const WIDTH = { bilgisayar: 1280, telefon: 390 } as const
type Device = keyof typeof WIDTH

export type PreviewHandlers = {
  onEdit: (target: string) => void
  onInsert: (after: SiteSectionId) => void
  /** Serbest düzende sürükleme, boyut, yazı ya da silme */
  onCanvas: (block: string, patch: CanvasPatch) => void
  onSelect: (block: string, item: string | null) => void
}

export default function Preview({
  draft,
  target,
  jumpKey,
  selection,
  handlers,
}: {
  draft: SiteContent
  /** Panelde açık olan bölüm: önizleme oraya kayıyor */
  target: string | null
  /** Aynı bölüm yeniden seçilince de kaysın diye artan sayı */
  jumpKey: number
  /** Panelde açılan serbest düzen öğesi: önizlemede de seçili görünsün */
  selection: { block: string; item: string | null } | null
  handlers: PreviewHandlers
}) {
  const frame = useRef<HTMLIFrameElement>(null)
  const box = useRef<HTMLDivElement>(null)
  /* Panel telefondan açıldıysa önizleme de telefon görünümünde başlasın */
  const [device, setDevice] = useState<Device>(() => (window.innerWidth < 768 ? 'telefon' : 'bilgisayar'))
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [ready, setReady] = useState(false)
  const latest = useRef(draft)
  latest.current = draft
  const h = useRef(handlers)
  h.current = handlers

  const post = (msg: PanelToSite) => frame.current?.contentWindow?.postMessage(msg, location.origin)

  /* Çerçeveden gelenler: hazırım / şu bölümü düzenle / buraya ekle */
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.source !== frame.current?.contentWindow) return
      const msg = e.data as SiteToPanel
      if (msg?.type === 'uk-hazir') {
        setReady(true)
        post({ type: 'uk-icerik', content: latest.current })
      } else if (msg?.type === 'uk-duzenle' && typeof msg.target === 'string') h.current.onEdit(msg.target)
      else if (msg?.type === 'uk-ekle' && typeof msg.after === 'string') h.current.onInsert(msg.after as SiteSectionId)
      else if (msg?.type === 'uk-tuval' && typeof msg.block === 'string' && msg.patch && typeof msg.patch === 'object')
        h.current.onCanvas(msg.block, msg.patch)
      else if (msg?.type === 'uk-sec' && typeof msg.block === 'string')
        h.current.onSelect(msg.block, typeof msg.item === 'string' ? msg.item : null)
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  /* Taslak değiştikçe çerçeveye (yazarken her harfte değil, kısa bir duraksamada) */
  useEffect(() => {
    if (!ready) return
    const t = window.setTimeout(() => post({ type: 'uk-icerik', content: draft }), 180)
    return () => window.clearTimeout(t)
  }, [draft, ready])

  useEffect(() => {
    if (ready && selection) post({ type: 'uk-sec', block: selection.block, item: selection.item })
  }, [ready, selection])

  /* Taslak gönderildikten sonra kaydır: yeni eklenen bölüm o zaman çizilmiş oluyor */
  useEffect(() => {
    if (!ready || !target) return
    const t = window.setTimeout(() => post({ type: 'uk-git', target }), 260)
    return () => window.clearTimeout(t)
  }, [target, jumpKey, ready])

  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    /* Gizliyken (telefonda "Düzenle" sekmesi) ölçü sıfırlanmasın: çerçeve yeniden yüklenmesin */
    const ro = new ResizeObserver(([e]) => {
      if (e.contentRect.width > 0) setSize({ w: e.contentRect.width, h: e.contentRect.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const width = WIDTH[device]
  const scale = size.w ? Math.min(1, size.w / width) : 1

  useEffect(() => {
    if (ready) post({ type: 'uk-olcek', scale })
  }, [ready, scale])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#e3d7c4] bg-[#efe6d8]">
      <div className="flex items-center justify-between gap-2 border-b border-[#e3d7c4] bg-[#fbf7f0] px-3 py-2">
        <p className="min-w-0 truncate font-display text-[0.85rem] font-bold text-[#7a6650]">
          Önizleme <span className="font-normal max-sm:hidden">· kaydedilmemiş hâli</span>
        </p>
        <div className="flex shrink-0 gap-1 rounded-lg bg-[#efe5d6] p-1" role="group" aria-label="Görünüm">
          {(['bilgisayar', 'telefon'] as const).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={device === d}
              onClick={() => {
                setReady(false)
                setDevice(d)
              }}
              className={`rounded-md px-3 py-1.5 font-display text-[0.82rem] font-bold transition-colors ${
                device === d ? 'bg-white text-[#2a1d12] shadow-sm' : 'text-[#7a6650] hover:text-[#2a1d12]'
              }`}
            >
              {d === 'bilgisayar' ? 'Bilgisayar' : 'Telefon'}
            </button>
          ))}
        </div>
      </div>
      <div ref={box} className="relative min-h-0 flex-1 overflow-hidden">
        {size.w > 0 && (
          <iframe
            /* Görünüm değişince çerçeve baştan açılıyor: site kendi ölçülerini yeni genişliğe göre kursun */
            key={device}
            ref={frame}
            src="/?onizleme=1"
            title="Sitenin önizlemesi"
            className="absolute top-0 border-0 bg-[#2a1d12]"
            style={{
              width,
              height: size.h / scale,
              left: Math.max(0, (size.w - width * scale) / 2),
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          />
        )}
        {!ready && (
          <p className="pointer-events-none absolute inset-x-0 top-1/3 text-center font-display text-[0.95rem] font-bold text-[#e9dcc6]">
            Önizleme açılıyor…
          </p>
        )}
      </div>
    </div>
  )
}
