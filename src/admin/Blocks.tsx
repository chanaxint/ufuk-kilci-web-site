import { useEffect, useId, useRef, useState } from 'react'
import {
  BLOCK_KINDS,
  BLOCK_LIMITS,
  BUTTON_PRESETS,
  SITE_SECTIONS,
  blankBlock,
  type Block,
  type BlockKind,
  type SiteSectionId,
} from '../lib/siteContent'
import { CardList, Field, ImageInput, TextArea, TextInput } from './fields'
import {
  CANVAS_LIMIT,
  DEFAULT_FS,
  ITEM_LABELS,
  addItem,
  newItemId,
  resetPhone,
  scaleFont,
  toCanvas,
  type Canvas,
  type CanvasItem,
  type CanvasItemType,
} from '../lib/canvas'

/*
 * Panelden eklenen bölümler. Her bölüm sabit bölümlerden birinin ardına
 * yerleşiyor ("Nereye?"); aynı yerdeki bölümler ↑ ↓ ile sıralanıyor.
 * Serbest sürükle-bırak yok: telefonda da bilgisayarda da düzgün dursun
 * diye her şey sitenin kendi düzeninde akıyor.
 */

const sectionLabel = (id: SiteSectionId) => SITE_SECTIONS.find((s) => s.id === id)?.label ?? id
const kindTitle = (k: BlockKind) => BLOCK_KINDS.find((x) => x.kind === k)?.title ?? k
const rank = (id: SiteSectionId) => SITE_SECTIONS.findIndex((s) => s.id === id)

/** Sayfadaki sırası: önce hangi bölümün ardında olduğu, sonra kendi sırası */
export const pageOrder = (blocks: Block[]) =>
  blocks.map((b, i) => ({ b, i })).sort((x, y) => rank(x.b.after) - rank(y.b.after) || x.i - y.i).map((x) => x.b)

/* Türü anlatan küçük çizimler */
function KindSketch({ kind }: { kind: BlockKind }) {
  const bar = 'rounded-full bg-[#c9b89e]'
  const box = 'rounded bg-[#e3d4bb]'
  return (
    <div aria-hidden className="flex h-14 w-full items-center gap-1.5 rounded-lg bg-[#f6efe4] p-2">
      {kind === 'yazi' && (
        <div className="flex w-full flex-col items-center gap-1">
          <span className={`${bar} h-2 w-1/2 bg-[#a8916f]`} />
          <span className={`${bar} h-1 w-4/5`} />
          <span className={`${bar} h-1 w-3/4`} />
        </div>
      )}
      {kind === 'fotograf-yazi' && (
        <>
          <span className={`${box} h-full w-2/5`} />
          <div className="flex flex-1 flex-col gap-1">
            <span className={`${bar} h-2 w-3/4 bg-[#a8916f]`} />
            <span className={`${bar} h-1 w-full`} />
            <span className={`${bar} h-1 w-5/6`} />
          </div>
        </>
      )}
      {kind === 'galeri' && [0, 1, 2].map((i) => <span key={i} className={`${box} h-full flex-1`} />)}
      {kind === 'buyuk-fotograf' && <span className={`${box} h-full w-full`} />}
      {kind === 'serbest' && (
        <span className="relative block size-full">
          <span className="absolute inset-y-0 left-1/2 w-px bg-[#ff3d8b]/70" />
          <span className={`${box} absolute top-1 left-[8%] h-7 w-[30%] bg-[#d9c7a8]`} />
          <span className={`${bar} absolute top-2 left-[42%] h-2 w-[16%] -translate-x-0 bg-[#a8916f]`} />
          <span className={`${bar} absolute top-6 left-[62%] h-1 w-[30%]`} />
          <span className="absolute right-[6%] bottom-0.5 h-3 w-[20%] rounded-full bg-[#6b4a2c]/70" />
        </span>
      )}
      {kind === 'duyuru' && (
        <span className="mx-auto flex h-full w-3/5 -rotate-2 flex-col items-center justify-center gap-1 rounded-sm bg-[#efe2c6] shadow-sm">
          <span className={`${bar} h-1.5 w-1/2 bg-[#a8916f]`} />
          <span className={`${bar} h-1 w-3/4`} />
        </span>
      )}
    </div>
  )
}

function PositionSelect({ value, onChange }: { value: SiteSectionId; onChange: (v: SiteSectionId) => void }) {
  const id = useId()
  return (
    <Field label="Nereye?" hint="Bu bölüm, seçtiğiniz bölümün hemen ardından gelir." htmlFor={id}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as SiteSectionId)}
        className="w-full rounded-xl border border-[#dccfbb] bg-white px-4 py-3 text-[1rem] text-[#2a1d12]"
      >
        {SITE_SECTIONS.map((s) => (
          <option key={s.id} value={s.id}>
            “{s.label}” bölümünden sonra
          </option>
        ))}
      </select>
    </Field>
  )
}

/* ——— Yeni bölüm penceresi ——— */

export function AddBlockDialog({
  after,
  onAdd,
  onClose,
}: {
  after: SiteSectionId
  onAdd: (b: Block) => void
  onClose: () => void
}) {
  const [pos, setPos] = useState(after)
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (d && !d.open) d.showModal()
  }, [])
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="yeni-bolum-baslik"
      className="m-auto w-[min(44rem,calc(100vw-1.5rem))] rounded-2xl border border-[#e3d7c4] bg-[#fbf7f0] p-0 text-[#2a1d12] shadow-2xl backdrop:bg-[#2a1d12]/45"
    >
      <div className="max-h-[85svh] overflow-y-auto p-5 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <h2 id="yeni-bolum-baslik" className="font-display text-[1.4rem] font-extrabold">
            Yeni bölüm ekle
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="grid size-10 place-items-center rounded-lg text-[1.1rem] text-[#7a6650] hover:bg-[#efe5d6]"
          >
            ✕
          </button>
        </div>
        <div className="mt-4">
          <PositionSelect value={pos} onChange={setPos} />
        </div>
        <p className="mt-6 font-display text-[0.95rem] font-bold">Ne tür bir bölüm?</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {BLOCK_KINDS.map((k) => (
            <button
              key={k.kind}
              type="button"
              onClick={() => onAdd(blankBlock(k.kind, pos))}
              className="flex flex-col gap-3 rounded-2xl border border-[#e3d7c4] bg-white p-4 text-left transition-colors hover:border-[#8a6a48] hover:bg-[#fffdf9] focus-visible:border-[#8a6a48]"
            >
              <KindSketch kind={k.kind} />
              <span>
                <span className="block font-display text-[1rem] font-extrabold">{k.title}</span>
                <span className="mt-1 block text-[0.88rem] leading-snug text-[#7a6650]">{k.description}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </dialog>
  )
}

/* ——— Düğme ——— */

function ButtonFields({ b, up }: { b: Block; up: (p: Partial<Block>) => void }) {
  return (
    <LinkFields
      label={b.buttonLabel}
      href={b.buttonHref}
      onLabel={(buttonLabel) => up({ buttonLabel })}
      onHref={(buttonHref) => up({ buttonHref })}
    />
  )
}

function LinkFields({
  label,
  href,
  onLabel,
  onHref,
}: {
  label: string
  href: string
  onLabel: (v: string) => void
  onHref: (v: string) => void
}) {
  const preset = BUTTON_PRESETS.some((p) => p.value === href) ? href : href ? 'diger' : ''
  const [custom, setCustom] = useState(preset === 'diger')
  const choice = custom ? 'diger' : preset
  const id = useId()
  return (
    <div className="grid gap-4 rounded-xl bg-[#faf5ec] p-4 sm:grid-cols-2">
      <TextInput
        label="Düğme yazısı"
        hint="Boş bırakırsanız düğme görünmez. Örnek: Randevu alın"
        value={label}
        onChange={onLabel}
      />
      <Field label="Düğmeye basınca" htmlFor={id}>
        <select
          id={id}
          value={choice}
          onChange={(e) => {
            const v = e.target.value
            setCustom(v === 'diger')
            onHref(v === 'diger' ? '' : v)
          }}
          className="w-full rounded-xl border border-[#dccfbb] bg-white px-4 py-3 text-[1rem] text-[#2a1d12]"
        >
          <option value="">Seçin…</option>
          {BUTTON_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
          <option value="diger">Başka bir sayfaya gitsin</option>
        </select>
      </Field>
      {choice === 'diger' && (
        <div className="sm:col-span-2">
          <TextInput
            label="Gidilecek adres"
            inputMode="url"
            hint="Örnek: www.ornek.com — yeni sekmede açılır."
            value={href}
            onChange={onHref}
          />
        </div>
      )}
    </div>
  )
}


/* ——— Serbest düzen ——— */

const pill = (on: boolean) =>
  `rounded-xl px-4 py-2.5 font-display text-[0.92rem] font-bold transition-colors ${
    on ? 'bg-[#6b4a2c] text-white' : 'border border-[#dccfbb] bg-white text-[#5c4831] hover:bg-[#f3ebde]'
  }`

function Range({
  label,
  hint,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}: {
  label: string
  hint?: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (v: number) => void
}) {
  const id = useId()
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-2 w-full cursor-pointer accent-[#6b4a2c]"
        />
        <span className="w-14 shrink-0 text-right font-display text-[0.9rem] font-bold text-[#5c4831]">
          {Math.round(value)}
          {unit}
        </span>
      </div>
    </Field>
  )
}

const ITEM_ICON: Record<CanvasItemType, string> = { baslik: 'H', yazi: '¶', fotograf: '▣', dugme: '➜' }

function CanvasFields({
  b,
  up,
  selected,
  onSelect,
}: {
  b: Block
  up: (p: Partial<Block>) => void
  selected: string | null
  onSelect: (item: string | null) => void
}) {
  const c = b.canvas
  const setC = (canvas: Canvas) => up({ canvas })
  const upItem = (id: string, fn: (it: CanvasItem) => CanvasItem) => setC({ ...c, items: c.items.map((it) => (it.id === id ? fn(it) : it)) })
  const refs = useRef(new Map<string, HTMLElement>())

  /* Önizlemede seçilen öğe burada açılıp ekrana gelsin */
  useEffect(() => {
    if (!selected) return
    const t = window.setTimeout(() => refs.current.get(selected)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60)
    return () => window.clearTimeout(t)
  }, [selected])

  const add = (type: CanvasItemType) => {
    const r = addItem(c, type)
    setC(r.canvas)
    onSelect(r.id)
  }
  const moveLayer = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= c.items.length) return
    const items = c.items.slice()
    ;[items[i], items[j]] = [items[j], items[i]]
    setC({ ...c, items })
  }
  const full = c.items.length >= CANVAS_LIMIT

  return (
    <>
      <div className="rounded-xl bg-[#eef5fd] px-4 py-3 text-[0.92rem] leading-relaxed text-[#2f4c6b]">
        <strong>Önizlemede düzenleyin:</strong> öğeyi tutup sürükleyin, köşesinden çekerek büyütün ya da küçültün, yazıyı
        çift tıklayıp yerinde değiştirin. Bir öğe tam ortaya, kenara ya da başka bir öğenin hizasına gelince{' '}
        <span className="font-bold text-[#c2185b]">pembe kılavuz çizgisi</span> çıkar ve öğe oraya oturur.
      </div>

      <Field label="Zemin">
        <div className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={c.bg === 'zemin'} onClick={() => setC({ ...c, bg: 'zemin' })} className={pill(c.bg === 'zemin')}>
            Ahşap (sitenin zemini)
          </button>
          <button type="button" aria-pressed={c.bg === 'kagit'} onClick={() => setC({ ...c, bg: 'kagit' })} className={pill(c.bg === 'kagit')}>
            Eski kâğıt
          </button>
        </div>
      </Field>

      <Range
        label="Bölümün yüksekliği"
        hint="Önizlemedeki “⇕ Bölümün yüksekliği” tutamacıyla da ayarlanır."
        value={c.hd}
        min={10}
        max={200}
        unit="%"
        onChange={(hd) => setC({ ...c, hd })}
      />

      <div className="rounded-xl border border-[#e3d7c4] bg-[#faf5ec] px-4 py-3 text-[0.9rem] leading-relaxed text-[#5c4831]">
        {c.hm === null ? (
          <>
            <strong>Telefonda:</strong> öğeler yukarıdan aşağıya alt alta dizilir; her telefonda okunur kalır. Telefona özel
            yerleşim isterseniz önizlemeyi <strong>Telefon</strong> görünümüne alıp bir öğeyi sürükleyin.
          </>
        ) : (
          <div className="flex flex-col gap-3">
            <p>
              <strong>Telefon için ayrı bir yerleşim var.</strong> Önizlemenin Telefon görünümünde düzenlenir.
            </p>
            <Range label="Telefonda yükseklik" value={c.hm} min={10} max={600} unit="%" onChange={(hm) => setC({ ...c, hm })} />
            <button
              type="button"
              onClick={() => window.confirm('Telefondaki yerleşim silinsin ve öğeler yine alt alta dizilsin mi?') && setC(resetPhone(c))}
              className="self-start rounded-xl border border-[#dccfbb] bg-white px-4 py-2.5 font-display text-[0.9rem] font-bold text-[#5c4831] hover:bg-[#f3ebde]"
            >
              Telefonda yine alt alta diz
            </button>
          </div>
        )}
      </div>

      <Field label="Öğe ekle" hint="Yeni öğe bölümün ortasına gelir; sonra önizlemede istediğiniz yere sürükleyin.">
        <div className="flex flex-wrap gap-2">
          {(['baslik', 'yazi', 'fotograf', 'dugme'] as const).map((t) => (
            <button
              key={t}
              type="button"
              disabled={full}
              onClick={() => add(t)}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-[#c9b89e] px-4 py-2.5 font-display text-[0.92rem] font-bold text-[#6b4a2c] transition-colors hover:border-[#8a6a48] hover:bg-white disabled:opacity-45"
            >
              + {ITEM_LABELS[t]}
            </button>
          ))}
        </div>
        {full && <p className="text-[0.86rem] text-[#7a6650]">Bir bölümde en fazla {CANVAS_LIMIT} öğe olabilir.</p>}
      </Field>

      <div className="flex flex-col gap-2">
        <p className="font-display text-[0.95rem] font-bold text-[#2a1d12]">Öğeler</p>
        {c.items.length === 0 && <p className="text-[0.9rem] text-[#7a6650]">Henüz öğe yok.</p>}
        {c.items.map((it, i) => {
          const open = selected === it.id
          const pct = Math.round((it.d.fs / DEFAULT_FS[it.type]) * 100)
          const small = 'rounded-lg border border-[#dccfbb] bg-white px-3 py-2 font-display text-[0.84rem] font-bold text-[#5c4831] hover:bg-[#f3ebde] disabled:opacity-40'
          return (
            <section
              key={it.id}
              ref={(el) => {
                if (el) refs.current.set(it.id, el)
                else refs.current.delete(it.id)
              }}
              className={`scroll-mt-24 rounded-xl border bg-white ${open ? 'border-[#4aa8ff] ring-4 ring-[#4aa8ff]/15' : 'border-[#e3d7c4]'}`}
            >
              <button
                type="button"
                aria-expanded={open}
                onClick={() => onSelect(open ? null : it.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#f3ebde] font-display font-extrabold text-[#6b4a2c]">
                  {ITEM_ICON[it.type]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[0.92rem] font-extrabold text-[#2a1d12]">{ITEM_LABELS[it.type]}</span>
                  <span className="block truncate text-[0.84rem] text-[#8a7458]">
                    {it.type === 'fotograf' ? (it.src ? 'Fotoğraf seçildi' : 'Fotoğraf seçilmedi') : it.text.replace(/\*/g, '') || 'Boş'}
                  </span>
                </span>
                <span className={`text-[#a8977f] transition-transform ${open ? 'rotate-90' : ''}`}>▸</span>
              </button>
              {open && (
                <div className="flex flex-col gap-4 border-t border-[#efe5d6] p-4">
                  {it.type === 'baslik' && (
                    <TextInput
                      label="Başlık"
                      hint="Vurgu için bir kelimeyi *yıldız* içine alın."
                      value={it.text}
                      onChange={(text) => upItem(it.id, (x) => ({ ...x, text }))}
                    />
                  )}
                  {it.type === 'yazi' && (
                    <TextArea
                      label="Yazı"
                      hint="Yeni paragraf için bir satır boş bırakın."
                      rows={4}
                      value={it.text}
                      onChange={(text) => upItem(it.id, (x) => ({ ...x, text }))}
                    />
                  )}
                  {it.type === 'dugme' && (
                    <LinkFields
                      label={it.text}
                      href={it.href}
                      onLabel={(text) => upItem(it.id, (x) => ({ ...x, text }))}
                      onHref={(href) => upItem(it.id, (x) => ({ ...x, href }))}
                    />
                  )}
                  {it.type === 'fotograf' && (
                    <ImageInput label="Fotoğraf" kind="bolum" value={it.src} onChange={(src) => upItem(it.id, (x) => ({ ...x, src }))} />
                  )}

                  {(it.type === 'baslik' || it.type === 'yazi') && (
                    <Field label="Hizalama">
                      <div className="flex gap-2">
                        {(['sol', 'orta', 'sag'] as const).map((a) => (
                          <button key={a} type="button" aria-pressed={it.align === a} onClick={() => upItem(it.id, (x) => ({ ...x, align: a }))} className={pill(it.align === a)}>
                            {a === 'sol' ? 'Sola' : a === 'orta' ? 'Ortaya' : 'Sağa'}
                          </button>
                        ))}
                      </div>
                    </Field>
                  )}
                  {it.type !== 'fotograf' && (
                    <Range
                      label="Yazı boyu"
                      value={pct}
                      min={40}
                      max={300}
                      step={5}
                      unit="%"
                      onChange={(v) => upItem(it.id, (x) => scaleFont(x, (DEFAULT_FS[x.type] * v) / 100))}
                    />
                  )}
                  {it.type !== 'dugme' && (
                    <Range
                      label="Genişlik"
                      hint={c.hm !== null ? 'Bilgisayardaki yerleşim için; telefon yerleşimi önizlemede ayrı ayarlanır.' : undefined}
                      value={it.d.w}
                      min={5}
                      max={100}
                      unit="%"
                      onChange={(w) =>
                        upItem(it.id, (x) => ({
                          ...x,
                          d: { ...x.d, w, h: x.type === 'fotograf' ? (x.d.h * w) / x.d.w : x.d.h },
                        }))
                      }
                    />
                  )}

                  <div className="flex flex-wrap gap-2 border-t border-[#efe5d6] pt-4">
                    {it.type !== 'dugme' && (
                      <button type="button" className={small} onClick={() => upItem(it.id, (x) => ({ ...x, d: { ...x.d, x: Math.round((50 - x.d.w / 2) * 100) / 100 } }))}>
                        ↔ Yatayda ortala
                      </button>
                    )}
                    <button type="button" className={small} disabled={i === c.items.length - 1} onClick={() => moveLayer(i, 1)}>
                      Öne getir
                    </button>
                    <button type="button" className={small} disabled={i === 0} onClick={() => moveLayer(i, -1)}>
                      Arkaya gönder
                    </button>
                    <button
                      type="button"
                      className={small}
                      disabled={full}
                      onClick={() => {
                        const copy: CanvasItem = {
                          ...it,
                          id: newItemId(),
                          d: { ...it.d, x: it.d.x + 2, y: it.d.y + 2 },
                          m: it.m ? { ...it.m, x: it.m.x + 3, y: it.m.y + 3 } : null,
                        }
                        setC({ ...c, items: [...c.items, copy] })
                        onSelect(copy.id)
                      }}
                    >
                      Kopyala
                    </button>
                    <button
                      type="button"
                      className={`${small} text-[#9b3b2a] hover:bg-[#f7e6e1]`}
                      onClick={() => {
                        if (!window.confirm(`${ITEM_LABELS[it.type]} silinsin mi?`)) return
                        setC({ ...c, items: c.items.filter((x) => x.id !== it.id) })
                        onSelect(null)
                      }}
                    >
                      Sil
                    </button>
                  </div>
                </div>
              )}
            </section>
          )
        })}
      </div>
    </>
  )
}

/* ——— Bir bölümün alanları ——— */

function BlockFields({
  b,
  up,
  selected,
  onSelect,
}: {
  b: Block
  up: (p: Partial<Block>) => void
  selected: string | null
  onSelect: (item: string | null) => void
}) {
  const menu = (
    <TextInput
      label="Menüde görünsün mü?"
      hint="Buraya bir ad yazarsanız bölüm üst menüde ve sayfanın altında bu adla görünür. Boş bırakırsanız menüde görünmez."
      placeholder="Örnek: Galeri"
      value={b.menuLabel}
      onChange={(menuLabel) => up({ menuLabel })}
    />
  )
  if (b.kind === 'serbest') {
    return (
      <>
        <PositionSelect value={b.after} onChange={(after) => up({ after })} />
        <CanvasFields b={b} up={up} selected={selected} onSelect={onSelect} />
        {menu}
      </>
    )
  }

  const heading = <TextInput label="Başlık" hint="Vurgu için bir kelimeyi *yıldız* içine alın." value={b.heading} onChange={(v) => up({ heading: v })} />
  const text = (
    <TextArea
      label="Yazı"
      hint="Yeni paragraf için bir satır boş bırakın."
      rows={b.kind === 'duyuru' ? 3 : 5}
      value={b.text}
      onChange={(v) => up({ text: v })}
    />
  )
  const caption = (
    <TextInput label="Fotoğrafın altındaki yazı" hint="İsteğe bağlı." value={b.caption} onChange={(v) => up({ caption: v })} />
  )

  return (
    <>
      <PositionSelect value={b.after} onChange={(after) => up({ after })} />

      {b.kind === 'fotograf-yazi' && (
        <>
          <ImageInput label="Fotoğraf" kind="bolum" aspect="aspect-[4/5]" value={b.image} onChange={(image) => up({ image })} />
          <Field label="Fotoğraf hangi yanda?" hint="Telefonda fotoğraf her zaman yazının üstünde durur.">
            <div className="flex gap-2">
              {(['sol', 'sag'] as const).map((side) => (
                <button
                  key={side}
                  type="button"
                  aria-pressed={b.imageSide === side}
                  onClick={() => up({ imageSide: side })}
                  className={`rounded-xl px-5 py-2.5 font-display text-[0.95rem] font-bold transition-colors ${
                    b.imageSide === side ? 'bg-[#6b4a2c] text-white' : 'border border-[#dccfbb] bg-white text-[#5c4831] hover:bg-[#f3ebde]'
                  }`}
                >
                  {side === 'sol' ? 'Solda' : 'Sağda'}
                </button>
              ))}
            </div>
          </Field>
          {caption}
          {heading}
          {text}
        </>
      )}

      {b.kind === 'buyuk-fotograf' && (
        <>
          {heading}
          <ImageInput label="Fotoğraf" hint="Yatay fotoğraf en iyi görünür." kind="bolum" aspect="aspect-[3/2]" value={b.image} onChange={(image) => up({ image })} />
          {caption}
          {text}
        </>
      )}

      {b.kind === 'galeri' && (
        <>
          {heading}
          {text}
          <Field label="Fotoğraflar" hint={`En fazla ${BLOCK_LIMITS.gallery} fotoğraf. Sitede üçerli sıralar hâlinde görünür.`}>
            <CardList
              items={b.images}
              onChange={(images) => up({ images })}
              blank={() => ({ src: '', caption: '' })}
              addLabel="Fotoğraf ekle"
              itemName="Fotoğraf"
              max={BLOCK_LIMITS.gallery}
              maxNote={`Bir galeride en fazla ${BLOCK_LIMITS.gallery} fotoğraf olabilir.`}
              title={(im) => im.caption}
              render={(im, set) => (
                <>
                  <ImageInput label="Fotoğraf" kind="bolum" aspect="aspect-[4/3]" value={im.src} onChange={(src) => set({ src })} />
                  <TextInput label="Açıklama" hint="İsteğe bağlı." value={im.caption} onChange={(caption) => set({ caption })} />
                </>
              )}
            />
          </Field>
        </>
      )}

      {(b.kind === 'yazi' || b.kind === 'duyuru') && (
        <>
          {heading}
          {text}
        </>
      )}

      <ButtonFields b={b} up={up} />

      {menu}

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-[#c9b89e] px-4 py-3">
        <p className="min-w-0 flex-1 text-[0.9rem] leading-snug text-[#5c4831]">
          Fotoğrafı ve yazıları önizlemede tutup istediğiniz yere taşımak, boyutlandırmak ister misiniz?
        </p>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Bu bölüm serbest düzene çevrilsin mi? Başlık, yazı, fotoğraf ve düğme ayrı ayrı sürüklenebilir hâle gelir.'))
              up({ kind: 'serbest', canvas: toCanvas(b) })
          }}
          className="rounded-xl bg-[#6b4a2c] px-4 py-2.5 font-display text-[0.9rem] font-bold text-white hover:bg-[#573b22]"
        >
          Serbest düzene çevir
        </button>
      </div>
    </>
  )
}

/* ——— Bölüm listesi ——— */

export default function BlocksEditor({
  blocks,
  onChange,
  onAdd,
  focusId,
  onFocus,
  selected,
  onSelectItem,
}: {
  blocks: Block[]
  onChange: (b: Block[]) => void
  onAdd: () => void
  focusId: string | null
  onFocus: (id: string) => void
  /** Serbest düzende seçili öğe (önizlemeyle ortak) */
  selected: { block: string; item: string | null } | null
  onSelectItem: (block: string, item: string | null) => void
}) {
  const ordered = pageOrder(blocks)
  const [open, setOpen] = useState<Set<string>>(() => new Set(focusId ? [focusId] : []))
  const refs = useRef(new Map<string, HTMLElement>())

  /* Önizlemede bir bölüme tıklanınca burada açılıp ekrana gelsin */
  useEffect(() => {
    if (!focusId) return
    setOpen((s) => new Set(s).add(focusId))
    const t = window.setTimeout(() => refs.current.get(focusId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
    return () => window.clearTimeout(t)
  }, [focusId])

  const update = (id: string, patch: Partial<Block>) => onChange(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)))

  /* Aynı yerdeki komşusuyla yer değiştir */
  const shift = (b: Block, dir: -1 | 1) => {
    const same = ordered.filter((x) => x.after === b.after)
    const k = same.indexOf(b)
    const other = same[k + dir]
    if (!other) return
    const i = blocks.indexOf(b)
    const j = blocks.indexOf(other)
    const next = blocks.slice()
    next[i] = other
    next[j] = b
    onChange(next)
  }

  const full = blocks.length >= BLOCK_LIMITS.blocks
  const btn =
    'grid size-10 place-items-center rounded-lg border border-[#dccfbb] bg-white text-[#5c4831] transition-colors hover:bg-[#f3ebde] disabled:cursor-not-allowed disabled:opacity-35'

  return (
    <div className="flex flex-col gap-4">
      {ordered.length === 0 && (
        <p className="rounded-2xl border border-dashed border-[#dccfbb] bg-[#fffdf9] px-5 py-8 text-center text-[0.98rem] leading-relaxed text-[#7a6650]">
          Henüz yeni bölüm yok. Aşağıdaki düğmeyle ya da önizlemedeki <strong>“+ Buraya yeni bölüm ekle”</strong> çubuklarıyla
          ekleyebilirsiniz.
        </p>
      )}
      {ordered.map((b) => {
        const same = ordered.filter((x) => x.after === b.after)
        const k = same.indexOf(b)
        const isOpen = open.has(b.id)
        return (
          <section
            key={b.id}
            ref={(el) => {
              if (el) refs.current.set(b.id, el)
              else refs.current.delete(b.id)
            }}
            className={`scroll-mt-24 rounded-2xl border bg-[#fffdf9] shadow-[0_1px_2px_rgb(42_29_18/0.05)] ${
              focusId === b.id ? 'border-[#8a6a48] ring-4 ring-[#8a6a48]/15' : 'border-[#e3d7c4]'
            }`}
          >
            <header className="flex items-center gap-3 p-4 sm:px-5">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => {
                  setOpen((s) => {
                    const n = new Set(s)
                    if (n.has(b.id)) n.delete(b.id)
                    else n.add(b.id)
                    return n
                  })
                  if (!isOpen) onFocus(b.id)
                }}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span className={`text-[#a8977f] transition-transform ${isOpen ? 'rotate-90' : ''}`}>▸</span>
                <span className="min-w-0">
                  <span className="block truncate font-display text-[1rem] font-extrabold text-[#2a1d12]">
                    {(b.kind === 'serbest' ? (b.canvas.items.find((x) => x.type === 'baslik')?.text ?? '') : b.heading).replace(/\*/g, '') ||
                      b.menuLabel ||
                      `Yeni ${kindTitle(b.kind).toLocaleLowerCase('tr')}`}
                  </span>
                  <span className="block truncate text-[0.84rem] text-[#8a7458]">
                    {kindTitle(b.kind)} · “{sectionLabel(b.after)}” bölümünden sonra
                  </span>
                </span>
              </button>
              <div className="flex shrink-0 items-center gap-1.5">
                <button type="button" className={btn} disabled={k === 0} onClick={() => shift(b, -1)} aria-label="Yukarı taşı" title="Yukarı taşı">
                  ↑
                </button>
                <button
                  type="button"
                  className={btn}
                  disabled={k === same.length - 1}
                  onClick={() => shift(b, 1)}
                  aria-label="Aşağı taşı"
                  title="Aşağı taşı"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className={`${btn} text-[#9b3b2a] hover:bg-[#f7e6e1]`}
                  onClick={() => {
                    if (window.confirm('Bu bölüm silinsin mi?')) onChange(blocks.filter((x) => x.id !== b.id))
                  }}
                  aria-label="Bölümü sil"
                  title="Sil"
                >
                  ✕
                </button>
              </div>
            </header>
            {isOpen && (
              <div className="flex flex-col gap-5 border-t border-[#efe5d6] p-4 sm:p-5">
                <BlockFields
                  b={b}
                  up={(p) => update(b.id, p)}
                  selected={selected?.block === b.id ? selected.item : null}
                  onSelect={(item) => onSelectItem(b.id, item)}
                />
              </div>
            )}
          </section>
        )
      })}
      <button
        type="button"
        onClick={onAdd}
        disabled={full}
        className="inline-flex items-center gap-2 self-start rounded-xl bg-[#6b4a2c] px-6 py-3.5 font-display text-[1rem] font-bold text-white shadow-[0_8px_20px_-10px_rgb(42_29_18/0.7)] transition-colors hover:bg-[#573b22] disabled:opacity-45"
      >
        <span className="text-lg leading-none">+</span> Yeni bölüm ekle
      </button>
      {full && <p className="text-[0.88rem] text-[#7a6650]">Bir sayfada en fazla {BLOCK_LIMITS.blocks} yeni bölüm olabilir.</p>}
    </div>
  )
}
