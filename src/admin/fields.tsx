import { useId, useRef, useState, type ReactNode } from 'react'
import { PanelError, uploadImage, type ImageKind } from './api'

/*
 * Panelin form parçaları. Hepsi aynı düzende: üstte etiket, altında kısa
 * bir açıklama (nerede göründüğü), sonra alan. Yazılar 16 px — telefonda
 * tarayıcı alana yakınlaşmasın.
 */

const inputCls =
  'w-full rounded-xl border border-[#dccfbb] bg-white px-4 py-3 text-[1rem] text-[#2a1d12] shadow-[inset_0_1px_2px_rgb(42_29_18/0.05)] outline-none transition-colors placeholder:text-[#a8977f] focus:border-[#8a6a48] focus:ring-4 focus:ring-[#8a6a48]/15'

export function Field({
  label,
  hint,
  htmlFor,
  required,
  children,
}: {
  label: string
  hint?: ReactNode
  htmlFor?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="font-display text-[0.95rem] font-bold text-[#2a1d12]">
        {label}
        {required && <span className="ml-1 text-[#9b3b2a]" aria-hidden>*</span>}
      </label>
      {hint && <p className="-mt-0.5 text-[0.86rem] leading-snug text-[#7a6650]">{hint}</p>}
      {children}
    </div>
  )
}

export function TextInput({
  label,
  hint,
  value,
  onChange,
  placeholder,
  required,
  type = 'text',
  inputMode,
}: {
  label: string
  hint?: ReactNode
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  type?: string
  inputMode?: 'text' | 'tel' | 'email' | 'url' | 'numeric' | 'decimal'
}) {
  const id = useId()
  const empty = required && !value.trim()
  return (
    <Field label={label} hint={hint} htmlFor={id} required={required}>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={empty || undefined}
        className={`${inputCls} ${empty ? 'border-[#c98a7a]' : ''}`}
      />
      {empty && <p className="text-[0.85rem] text-[#9b3b2a]">Bu alan boş bırakılamaz.</p>}
    </Field>
  )
}

export function TextArea({
  label,
  hint,
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  label: string
  hint?: ReactNode
  value: string
  onChange: (v: string) => void
  rows?: number
  placeholder?: string
}) {
  const id = useId()
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} resize-y leading-relaxed`}
      />
    </Field>
  )
}

export function NumberInput({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint?: ReactNode
  value: number
  onChange: (v: number) => void
}) {
  const id = useId()
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={Number.isFinite(value) ? String(value) : ''}
        onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, '')) || 0)}
        className={inputCls}
      />
    </Field>
  )
}

/* ——— Sıralama düğmeleri ——— */

function RowButtons({
  index,
  count,
  onMove,
  onRemove,
  removeLabel,
}: {
  index: number
  count: number
  onMove: (from: number, to: number) => void
  onRemove: (i: number) => void
  removeLabel: string
}) {
  const btn =
    'grid size-10 place-items-center rounded-lg border border-[#dccfbb] bg-white text-[#5c4831] transition-colors hover:bg-[#f3ebde] disabled:cursor-not-allowed disabled:opacity-35'
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button type="button" className={btn} disabled={index === 0} onClick={() => onMove(index, index - 1)} aria-label="Yukarı taşı" title="Yukarı taşı">
        ↑
      </button>
      <button type="button" className={btn} disabled={index === count - 1} onClick={() => onMove(index, index + 1)} aria-label="Aşağı taşı" title="Aşağı taşı">
        ↓
      </button>
      <button
        type="button"
        className={`${btn} text-[#9b3b2a] hover:bg-[#f7e6e1]`}
        onClick={() => {
          if (window.confirm(`${removeLabel} silinsin mi?`)) onRemove(index)
        }}
        aria-label={`${removeLabel} sil`}
        title="Sil"
      >
        ✕
      </button>
    </div>
  )
}

const move = <T,>(list: T[], from: number, to: number) => {
  const next = list.slice()
  const [it] = next.splice(from, 1)
  next.splice(to, 0, it)
  return next
}

function AddButton({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 self-start rounded-xl border-2 border-dashed border-[#c9b89e] px-5 py-3 font-display text-[0.95rem] font-bold text-[#6b4a2c] transition-colors hover:border-[#8a6a48] hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
    >
      <span className="text-lg leading-none">+</span>
      {children}
    </button>
  )
}

/* ——— Yazı listesi (paragraflar, etiketler, belirtiler…) ——— */

export function StringList({
  label,
  hint,
  items,
  onChange,
  addLabel,
  itemName,
  multiline,
  placeholder,
}: {
  label: string
  hint?: ReactNode
  items: string[]
  onChange: (v: string[]) => void
  addLabel: string
  itemName: string
  multiline?: boolean
  placeholder?: string
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-col gap-3">
        {items.map((text, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="mt-3 w-6 shrink-0 text-right font-display text-[0.85rem] font-bold text-[#a8977f]">{i + 1}.</span>
            {multiline ? (
              <textarea
                rows={3}
                value={text}
                placeholder={placeholder}
                aria-label={`${itemName} ${i + 1}`}
                onChange={(e) => onChange(items.map((t, j) => (j === i ? e.target.value : t)))}
                className={`${inputCls} resize-y leading-relaxed`}
              />
            ) : (
              <input
                value={text}
                placeholder={placeholder}
                aria-label={`${itemName} ${i + 1}`}
                onChange={(e) => onChange(items.map((t, j) => (j === i ? e.target.value : t)))}
                className={inputCls}
              />
            )}
            <RowButtons
              index={i}
              count={items.length}
              onMove={(a, b) => onChange(move(items, a, b))}
              onRemove={(k) => onChange(items.filter((_, j) => j !== k))}
              removeLabel={`${i + 1}. ${itemName.toLocaleLowerCase('tr')}`}
            />
          </div>
        ))}
        <AddButton onClick={() => onChange([...items, ''])}>{addLabel}</AddButton>
      </div>
    </Field>
  )
}

/* ——— Kart listesi (yorumlar, sertifikalar, sorular…) ——— */

export function CardList<T>({
  items,
  onChange,
  blank,
  addLabel,
  itemName,
  title,
  max,
  maxNote,
  render,
}: {
  items: T[]
  onChange: (v: T[]) => void
  blank: () => T
  addLabel: string
  itemName: string
  title: (item: T, i: number) => string
  max?: number
  maxNote?: string
  render: (item: T, update: (patch: Partial<T>) => void) => ReactNode
}) {
  const full = max !== undefined && items.length >= max
  return (
    <div className="flex flex-col gap-4">
      {items.map((item, i) => (
        <section key={i} className="rounded-2xl border border-[#e3d7c4] bg-[#fffdf9] p-4 shadow-[0_1px_2px_rgb(42_29_18/0.05)] sm:p-5">
          <header className="mb-4 flex items-center justify-between gap-3 border-b border-[#efe5d6] pb-3">
            <h3 className="min-w-0 truncate font-display text-[1rem] font-extrabold text-[#2a1d12]">
              <span className="mr-2 text-[#a8977f]">{i + 1}.</span>
              {title(item, i) || `Yeni ${itemName.toLocaleLowerCase('tr')}`}
            </h3>
            <RowButtons
              index={i}
              count={items.length}
              onMove={(a, b) => onChange(move(items, a, b))}
              onRemove={(k) => onChange(items.filter((_, j) => j !== k))}
              removeLabel={`${i + 1}. ${itemName.toLocaleLowerCase('tr')}`}
            />
          </header>
          <div className="flex flex-col gap-4">
            {render(item, (patch) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it))))}
          </div>
        </section>
      ))}
      <AddButton onClick={() => onChange([...items, blank()])} disabled={full}>
        {addLabel}
      </AddButton>
      {full && maxNote && <p className="text-[0.88rem] text-[#7a6650]">{maxNote}</p>}
    </div>
  )
}

/* ——— Fotoğraf ——— */

export function ImageInput({
  label,
  hint,
  value,
  onChange,
  kind,
  aspect = 'aspect-square',
}: {
  label: string
  hint?: ReactNode
  value: string
  onChange: (url: string) => void
  kind: ImageKind
  aspect?: string
}) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const pick = async (file: File | undefined) => {
    if (!file) return
    setError('')
    setBusy(true)
    try {
      onChange(await uploadImage(file, kind))
    } catch (e) {
      setError(e instanceof PanelError ? e.message : 'Fotoğraf yüklenemedi. Tekrar deneyin.')
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-wrap items-center gap-4">
        <div className={`relative w-36 overflow-hidden rounded-xl border border-[#dccfbb] bg-[#efe6d8] ${aspect}`}>
          {value ? (
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <span className="grid size-full place-items-center text-[0.85rem] text-[#a8977f]">Fotoğraf yok</span>
          )}
          {busy && (
            <span className="absolute inset-0 grid place-items-center bg-white/75 font-display text-[0.85rem] font-bold text-[#6b4a2c]">
              Yükleniyor…
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
            className="rounded-xl bg-[#6b4a2c] px-5 py-3 font-display text-[0.95rem] font-bold text-white transition-colors hover:bg-[#573b22] disabled:opacity-60"
          >
            {value ? 'Fotoğrafı değiştir' : 'Fotoğraf seç'}
          </button>
          <p className="text-[0.82rem] text-[#7a6650]">JPG, PNG ya da WEBP. Büyük fotoğraflar otomatik küçültülür.</p>
        </div>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </div>
      {error && <p className="text-[0.88rem] text-[#9b3b2a]">{error}</p>}
    </Field>
  )
}
