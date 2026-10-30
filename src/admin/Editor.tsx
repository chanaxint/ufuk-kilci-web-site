import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Block, SiteContent, SiteSectionId } from '../lib/siteContent'
import { applyCanvasPatch, type CanvasPatch } from '../lib/canvas'
import { loadContent, mode, PanelError, saveContent, signOut } from './api'
import { missingRequired, sections, type Setter } from './sections'
import BlocksEditor, { AddBlockDialog } from './Blocks'
import Preview from './Preview'
import Account from './Account'

type Status = { kind: 'idle' | 'saving' | 'ok' | 'error'; message?: string }

const ACCOUNT = 'hesap'
const BLOCKS = 'bolumler'

/** Önizlemedeki "Düzenle" etiketinden paneldeki bölüme */
const EDIT_TARGET: Record<string, string> = { acilar: 'skolyoz' }

const PREVIEW_KEY = 'uk-panel-onizleme'
const readPreviewPref = () => {
  try {
    return localStorage.getItem(PREVIEW_KEY) !== '0'
  } catch {
    return true
  }
}

export default function Editor({ email }: { email: string }) {
  const [saved, setSaved] = useState<SiteContent | null>(null)
  const [draft, setDraft] = useState<SiteContent | null>(null)
  /* Kaydın hangi sürümün üzerine yapılacağı (arada başkası kaydettiyse sunucu reddeder) */
  const [surum, setSurum] = useState(0)
  const [loadError, setLoadError] = useState('')
  const [active, setActive] = useState(sections[0].id)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  /* Masaüstünde önizleme yanda; telefonda "Düzenle / Önizle" sekmeleri */
  const [showPreview, setShowPreview] = useState(readPreviewPref)
  const [tab, setTab] = useState<'duzenle' | 'onizle'>('duzenle')
  const [focusBlock, setFocusBlock] = useState<string | null>(null)
  const [adding, setAdding] = useState<SiteSectionId | null>(null)
  /*
   * Önizlemenin kayacağı yer. Yalnızca panelde bir bölüm seçilince değişiyor;
   * önizlemenin içinde tıklanınca (✎, sürükleme) önizleme yerinden oynamıyor.
   * `n`: aynı bölüme ikinci kez tıklanınca da gitsin diye.
   */
  const [scroll, setScroll] = useState<{ target: string | null; n: number }>({ target: null, n: 0 })
  /* Serbest düzende seçili öğe — panel ile önizleme arasında ortak */
  const [selItem, setSelItem] = useState<{ block: string; item: string | null } | null>(null)

  const load = useCallback(() => {
    setLoadError('')
    loadContent()
      .then((k) => {
        setSaved(k.content)
        setDraft(k.content)
        setSurum(k.surum)
      })
      .catch((e) => setLoadError(e instanceof PanelError ? e.message : 'İçerik yüklenemedi.'))
  }, [])
  useEffect(load, [load])

  const dirty = useMemo(() => !!draft && !!saved && JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved])

  /* Kaydedilmemiş değişiklikle sayfadan çıkılırsa tarayıcı sorsun */
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  /* "Kaydedildi" iletisi birkaç saniye sonra kendiliğinden kalksın */
  useEffect(() => {
    if (status.kind !== 'ok') return
    const id = window.setTimeout(() => setStatus({ kind: 'idle' }), 5000)
    return () => window.clearTimeout(id)
  }, [status])

  const set: Setter = useCallback((key, patch) => {
    setDraft((d) => (d ? { ...d, [key]: { ...d[key], ...patch } } : d))
    setStatus((s) => (s.kind === 'ok' || s.kind === 'error' ? { kind: 'idle' } : s))
  }, [])

  const setBlocks = useCallback((blocks: Block[]) => {
    setDraft((d) => (d ? { ...d, blocks } : d))
    setStatus((s) => (s.kind === 'ok' || s.kind === 'error' ? { kind: 'idle' } : s))
  }, [])

  const goPreview = (target: string | null) => setScroll((v) => ({ target, n: v.n + 1 }))

  /* Bölüm seçilince önizleme de oraya kayıyor */
  const open = (id: string, block: string | null = null) => {
    setActive(id)
    setFocusBlock(block)
    goPreview(id === BLOCKS ? (block ? `blok:${block}` : null) : id === ACCOUNT ? null : id)
  }

  /* Önizlemede sürüklenen / boyutlanan / yazısı değişen öğe taslağa işleniyor */
  const applyCanvas = useCallback((blockId: string, patch: CanvasPatch) => {
    setDraft((d) =>
      d
        ? {
            ...d,
            blocks: d.blocks.map((b) => (b.id === blockId && b.kind === 'serbest' ? { ...b, canvas: applyCanvasPatch(b.canvas, patch) } : b)),
          }
        : d,
    )
    setStatus((s) => (s.kind === 'ok' || s.kind === 'error' ? { kind: 'idle' } : s))
  }, [])

  const previewHandlers = {
    onEdit: (target: string) => {
      setTab('duzenle')
      if (target.startsWith('blok:')) {
        setActive(BLOCKS)
        setFocusBlock(target.slice(5))
      } else {
        setActive(EDIT_TARGET[target] ?? target)
        setFocusBlock(null)
      }
    },
    onInsert: (after: SiteSectionId) => setAdding(after),
    onCanvas: applyCanvas,
    onSelect: (block: string, item: string | null) => {
      setSelItem({ block, item })
      if (!item) return
      setActive(BLOCKS)
      setFocusBlock(block)
    },
  }

  const addBlock = (b: Block) => {
    if (!draft) return
    setBlocks([...draft.blocks, b])
    setAdding(null)
    setActive(BLOCKS)
    setFocusBlock(b.id)
    setTab('duzenle')
    goPreview(`blok:${b.id}`)
  }

  const togglePreview = () => {
    setShowPreview((v) => {
      try {
        localStorage.setItem(PREVIEW_KEY, v ? '0' : '1')
      } catch {
        /* tercih hatırlanmazsa da olur */
      }
      return !v
    })
  }

  const save = async () => {
    if (!draft) return
    const missing = missingRequired(draft)
    if (missing) {
      setActive(missing.section)
      setStatus({ kind: 'error', message: `"${missing.label}" boş bırakılamaz.` })
      return
    }
    setStatus({ kind: 'saving' })
    const gonderilen = draft
    try {
      const r = await saveContent(gonderilen, surum)
      /* Sunucu içeriği denetleyip düzeltilmiş hâlini döndürüyor; kayıt sırasında yazmaya devam edildiyse taslak korunur */
      setSaved(r.content)
      setDraft((d) => (d === gonderilen ? r.content : d))
      setSurum(r.surum)
      setStatus({ kind: 'ok' })
    } catch (e) {
      setStatus({ kind: 'error', message: e instanceof PanelError ? e.message : 'Kaydedilemedi. Tekrar deneyin.' })
    }
  }

  /* Geçmişten ya da yedekten geri yüklenince */
  const restored = (content: SiteContent, yeni: number) => {
    setSaved(content)
    setDraft(content)
    setSurum(yeni)
    setStatus({ kind: 'idle' })
  }

  const undo = () => {
    if (saved && window.confirm('Kaydetmediğiniz bütün değişiklikler geri alınsın mı?')) {
      setDraft(saved)
      setStatus({ kind: 'idle' })
    }
  }

  const leave = () => {
    if (dirty && !window.confirm('Kaydetmediğiniz değişiklikler var. Yine de çıkılsın mı?')) return
    signOut()
  }

  const section = sections.find((s) => s.id === active)
  const editing = active !== ACCOUNT
  /* Önizleme yalnızca site içeriği düzenlenirken; hesap ekranında yok */
  const withPreview = editing && !!draft && showPreview
  const nav = [
    ...sections.map((s) => ({ id: s.id, title: s.title, badge: 0 })),
    { id: BLOCKS, title: '+ Yeni bölümler', badge: 0 },
    { id: ACCOUNT, title: 'Hesap ve yedekler', badge: 0 },
  ]

  return (
    <div className="min-h-svh pb-28">
      {/* Üst şerit */}
      <header className="sticky top-0 z-30 border-b border-[#e3d7c4] bg-[#fbf7f0]/95 backdrop-blur">
        <div className={`mx-auto flex items-center justify-between gap-3 px-4 py-3 sm:px-6 ${withPreview ? 'max-w-[112rem]' : 'max-w-6xl'}`}>
          <div className="min-w-0">
            <p className="font-wordmark text-[1.45rem] leading-none text-[#2a1d12]">{draft?.doctor.name || 'Site'}</p>
            <p className="mt-0.5 font-display text-[0.72rem] font-bold tracking-[0.16em] text-[#8a7458] uppercase">Site yönetimi</p>
          </div>
          <div className="flex items-center gap-2">
            {editing && (
              <button
                type="button"
                onClick={togglePreview}
                aria-pressed={showPreview}
                className="hidden rounded-xl border border-[#dccfbb] bg-white px-4 py-2.5 font-display text-[0.9rem] font-bold text-[#5c4831] transition-colors hover:bg-[#f3ebde] xl:inline-flex"
              >
                {showPreview ? 'Önizlemeyi gizle' : 'Önizlemeyi göster'}
              </button>
            )}
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-[#dccfbb] bg-white px-4 py-2.5 font-display text-[0.9rem] font-bold text-[#5c4831] transition-colors hover:bg-[#f3ebde]"
            >
              Siteyi aç ↗
            </a>
            <button
              type="button"
              onClick={leave}
              className="rounded-xl px-3 py-2.5 font-display text-[0.9rem] font-bold text-[#7a6650] transition-colors hover:bg-[#f3ebde] hover:text-[#2a1d12]"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>

      {mode === 'deneme' && (
        <div className="border-b border-[#e8cf9a] bg-[#fbf0d6] px-4 py-3 text-center text-[0.9rem] leading-snug text-[#6b4f1d] sm:px-6">
          <strong>Deneme modu.</strong> Panel bilgisayarınızda çalışıyor: giriş yok, değişiklikler yalnızca bu
          tarayıcıda saklanıyor ve yalnızca bu bilgisayardaki sitede görünüyor.
        </div>
      )}

      {/* Telefon ve tablette: düzenle / önizle sekmeleri */}
      {withPreview && (
        <div className="sticky top-[4.4rem] z-20 border-b border-[#e3d7c4] bg-[#f5efe6]/95 px-4 py-2 backdrop-blur sm:px-6 xl:hidden">
          <div className="mx-auto flex max-w-md gap-1 rounded-xl bg-[#e9dfcf] p-1" role="tablist">
            {(['duzenle', 'onizle'] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`flex-1 rounded-lg py-2.5 font-display text-[0.95rem] font-bold transition-colors ${
                  tab === t ? 'bg-white text-[#2a1d12] shadow-sm' : 'text-[#7a6650]'
                }`}
              >
                {t === 'duzenle' ? 'Düzenle' : 'Önizle'}
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        className={`mx-auto grid grid-cols-[minmax(0,1fr)] gap-6 px-4 pt-6 sm:px-6 lg:gap-8 lg:pt-8 ${
          withPreview
            ? 'max-w-[112rem] lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[13rem_minmax(0,1fr)_minmax(0,1.15fr)]'
            : 'max-w-6xl lg:grid-cols-[15rem_1fr] lg:gap-10 lg:pt-10'
        }`}
      >
        {/* Bölümler — masaüstünde yan menü, telefonda açılır liste */}
        <nav aria-label="Bölümler" className={withPreview && tab === 'onizle' ? 'max-xl:hidden' : ''}>
          <label className="lg:hidden">
            <span className="mb-1.5 block font-display text-[0.85rem] font-bold text-[#7a6650]">Düzenlenecek bölüm</span>
            <select
              value={active}
              onChange={(e) => open(e.target.value)}
              className="w-full rounded-xl border border-[#dccfbb] bg-white px-4 py-3 font-display text-[1rem] font-bold text-[#2a1d12]"
            >
              {nav.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                  {s.badge ? ` (${s.badge} yeni)` : ''}
                </option>
              ))}
            </select>
          </label>
          <ul className="hidden flex-col gap-1 lg:sticky lg:top-24 lg:flex">
            {nav.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => open(s.id)}
                  aria-current={active === s.id ? 'page' : undefined}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-4 py-3 text-left font-display text-[0.98rem] font-bold transition-colors ${
                    active === s.id ? 'bg-[#6b4a2c] text-white' : 'text-[#5c4831] hover:bg-[#efe5d6]'
                  } ${s.id === ACCOUNT || s.id === BLOCKS ? 'mt-3' : ''}`}
                >
                  {s.title}
                  {s.badge > 0 && (
                    <span
                      className={`min-w-6 rounded-full px-2 py-0.5 text-center text-[0.78rem] ${
                        active === s.id ? 'bg-white text-[#6b4a2c]' : 'bg-[#c2702e] text-white'
                      }`}
                    >
                      {s.badge}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <main className={`min-w-0 ${withPreview && tab === 'onizle' ? 'max-xl:hidden' : ''}`}>
          {loadError ? (
            <div className="rounded-2xl border border-[#e8c3b8] bg-[#fbeee9] p-6">
              <p className="font-display text-[1.05rem] font-bold text-[#7d2f20]">{loadError}</p>
              <button type="button" onClick={load} className="mt-4 rounded-xl bg-[#6b4a2c] px-5 py-3 font-display font-bold text-white">
                Tekrar dene
              </button>
            </div>
          ) : !draft ? (
            <p className="py-16 text-center text-[#7a6650]">İçerik yükleniyor…</p>
          ) : active === ACCOUNT ? (
            <Account email={email} surum={surum} dirty={dirty} onRestored={restored} />
          ) : active === BLOCKS ? (
            <>
              <h1 className="font-display text-[1.75rem] leading-tight font-extrabold text-[#2a1d12] sm:text-[2rem]">Yeni bölümler</h1>
              <p className="mt-2 max-w-2xl text-[0.98rem] leading-relaxed text-[#7a6650]">
                Sitenin istediğiniz yerine kendi bölümünüzü ekleyin: yazı, fotoğraf, galeri, duyuru ya da öğeleri önizlemede sürükleyip yerleştirdiğiniz serbest düzen. Önizlemedeki
                “+ Buraya yeni bölüm ekle” çubuklarına tıklayarak da tam yerine ekleyebilirsiniz.
              </p>
              <div className="mt-6">
                <BlocksEditor
                  blocks={draft.blocks}
                  onChange={setBlocks}
                  onAdd={() => setAdding('skolyoz')}
                  focusId={focusBlock}
                  onFocus={(id) => open(BLOCKS, id)}
                  selected={selItem}
                  onSelectItem={(block, item) => setSelItem({ block, item })}
                />
              </div>
            </>
          ) : section ? (
            <>
              <h1 className="font-display text-[1.75rem] leading-tight font-extrabold text-[#2a1d12] sm:text-[2rem]">{section.title}</h1>
              <p className="mt-2 max-w-2xl text-[0.98rem] leading-relaxed text-[#7a6650]">{section.where}</p>
              <div className="mt-6 flex flex-col gap-6 rounded-2xl border border-[#e3d7c4] bg-white p-5 shadow-[0_1px_3px_rgb(42_29_18/0.06)] sm:p-7">
                {section.render(draft, set)}
              </div>
            </>
          ) : null}
        </main>

        {withPreview && (
          <aside
            aria-label="Önizleme"
            className={`h-[calc(100svh-14.5rem)] min-h-[24rem] min-w-0 lg:col-span-2 xl:sticky xl:top-[5.5rem] xl:col-span-1 xl:h-[calc(100svh-11rem)] ${
              tab === 'onizle' ? '' : 'max-xl:hidden'
            }`}
          >
            <Preview draft={draft} target={scroll.target} jumpKey={scroll.n} selection={selItem} handlers={previewHandlers} />
          </aside>
        )}
      </div>

      {adding && draft && <AddBlockDialog after={adding} onAdd={addBlock} onClose={() => setAdding(null)} />}

      {/* Kaydet şeridi */}
      {draft && editing && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e3d7c4] bg-[#fbf7f0]/97 backdrop-blur">
          <div className={`mx-auto flex items-center justify-between gap-3 px-4 py-3 sm:px-6 ${withPreview ? 'max-w-[112rem]' : 'max-w-6xl'}`}>
            <p
              role="status"
              className={`min-w-0 text-[0.92rem] leading-snug font-semibold ${
                status.kind === 'error' ? 'text-[#9b3b2a]' : status.kind === 'ok' ? 'text-[#3f6a2f]' : 'text-[#7a6650]'
              }`}
            >
              {status.kind === 'saving'
                ? 'Kaydediliyor…'
                : status.kind === 'ok'
                  ? '✓ Kaydedildi. Site güncellendi.'
                  : status.kind === 'error'
                    ? status.message
                    : dirty
                      ? 'Kaydedilmemiş değişiklikler var.'
                      : 'Değişiklik yok.'}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              {dirty && status.kind !== 'saving' && (
                <button
                  type="button"
                  onClick={undo}
                  className="rounded-xl px-4 py-3 font-display text-[0.95rem] font-bold text-[#7a6650] hover:bg-[#efe5d6]"
                >
                  Geri al
                </button>
              )}
              <button
                type="button"
                onClick={save}
                disabled={!dirty || status.kind === 'saving'}
                className="rounded-xl bg-[#6b4a2c] px-6 py-3 font-display text-[1rem] font-bold text-white shadow-[0_8px_20px_-10px_rgb(42_29_18/0.7)] transition-colors hover:bg-[#573b22] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
