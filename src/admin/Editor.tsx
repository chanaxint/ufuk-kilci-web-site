import { useCallback, useEffect, useMemo, useState } from 'react'
import type { SiteContent } from '../lib/siteContent'
import { loadContent, mode, PanelError, saveContent, signOut, updatePassword } from './api'
import { TextInput } from './fields'
import { missingRequired, sections, type Setter } from './sections'

type Status = { kind: 'idle' | 'saving' | 'ok' | 'error'; message?: string }

const ACCOUNT = 'hesap'

export default function Editor({ email, onSignedOut }: { email: string; onSignedOut: () => void }) {
  const [saved, setSaved] = useState<SiteContent | null>(null)
  const [draft, setDraft] = useState<SiteContent | null>(null)
  const [loadError, setLoadError] = useState('')
  const [active, setActive] = useState(sections[0].id)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const load = useCallback(() => {
    setLoadError('')
    loadContent()
      .then((c) => {
        setSaved(c)
        setDraft(c)
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

  const save = async () => {
    if (!draft) return
    const missing = missingRequired(draft)
    if (missing) {
      setActive(missing.section)
      setStatus({ kind: 'error', message: `"${missing.label}" boş bırakılamaz.` })
      return
    }
    setStatus({ kind: 'saving' })
    try {
      await saveContent(draft)
      setSaved(draft)
      setStatus({ kind: 'ok' })
    } catch (e) {
      setStatus({ kind: 'error', message: e instanceof PanelError ? e.message : 'Kaydedilemedi. Tekrar deneyin.' })
    }
  }

  const undo = () => {
    if (saved && window.confirm('Kaydetmediğiniz bütün değişiklikler geri alınsın mı?')) {
      setDraft(saved)
      setStatus({ kind: 'idle' })
    }
  }

  const leave = async () => {
    if (dirty && !window.confirm('Kaydetmediğiniz değişiklikler var. Yine de çıkılsın mı?')) return
    await signOut()
    onSignedOut()
  }

  const section = sections.find((s) => s.id === active)

  return (
    <div className="min-h-svh pb-28">
      {/* Üst şerit */}
      <header className="sticky top-0 z-30 border-b border-[#e3d7c4] bg-[#fbf7f0]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="font-wordmark text-[1.45rem] leading-none text-[#2a1d12]">{draft?.doctor.name || 'Site'}</p>
            <p className="mt-0.5 font-display text-[0.72rem] font-bold tracking-[0.16em] text-[#8a7458] uppercase">Site yönetimi</p>
          </div>
          <div className="flex items-center gap-2">
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
          <strong>Deneme modu.</strong> Panel henüz bir hesaba bağlı değil: giriş bilgisi kontrol edilmiyor,
          değişiklikler yalnızca bu tarayıcıda saklanıyor ve yalnızca bu bilgisayardaki sitede görünüyor.
        </div>
      )}

      <div className="mx-auto grid max-w-6xl gap-6 px-4 pt-6 sm:px-6 lg:grid-cols-[15rem_1fr] lg:gap-10 lg:pt-10">
        {/* Bölümler — masaüstünde yan menü, telefonda açılır liste */}
        <nav aria-label="Bölümler">
          <label className="lg:hidden">
            <span className="mb-1.5 block font-display text-[0.85rem] font-bold text-[#7a6650]">Düzenlenecek bölüm</span>
            <select
              value={active}
              onChange={(e) => setActive(e.target.value)}
              className="w-full rounded-xl border border-[#dccfbb] bg-white px-4 py-3 font-display text-[1rem] font-bold text-[#2a1d12]"
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
              <option value={ACCOUNT}>Hesabım</option>
            </select>
          </label>
          <ul className="hidden flex-col gap-1 lg:flex">
            {[...sections.map((s) => ({ id: s.id, title: s.title })), { id: ACCOUNT, title: 'Hesabım' }].map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setActive(s.id)}
                  aria-current={active === s.id ? 'page' : undefined}
                  className={`w-full rounded-xl px-4 py-3 text-left font-display text-[0.98rem] font-bold transition-colors ${
                    active === s.id ? 'bg-[#6b4a2c] text-white' : 'text-[#5c4831] hover:bg-[#efe5d6]'
                  } ${s.id === ACCOUNT ? 'mt-4' : ''}`}
                >
                  {s.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <main className="min-w-0">
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
            <Account email={email} onLeave={leave} />
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
      </div>

      {/* Kaydet şeridi */}
      {draft && active !== ACCOUNT && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e3d7c4] bg-[#fbf7f0]/97 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
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

function Account({ email, onLeave }: { email: string; onLeave: () => void }) {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const change = async () => {
    setMsg(null)
    if (pw !== pw2) return setMsg({ ok: false, text: 'İki şifre birbirini tutmuyor.' })
    setBusy(true)
    try {
      await updatePassword(pw)
      setPw('')
      setPw2('')
      setMsg({ ok: true, text: 'Şifreniz değiştirildi. Bir dahaki girişte yeni şifrenizi kullanın.' })
    } catch (e) {
      setMsg({ ok: false, text: e instanceof PanelError ? e.message : 'Şifre değiştirilemedi.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <h1 className="font-display text-[1.75rem] font-extrabold text-[#2a1d12] sm:text-[2rem]">Hesabım</h1>
      <p className="mt-2 text-[0.98rem] text-[#7a6650]">
        Giriş yapılan e-posta: <strong className="text-[#2a1d12]">{email}</strong>
      </p>
      <div className="mt-6 flex flex-col gap-5 rounded-2xl border border-[#e3d7c4] bg-white p-5 sm:p-7">
        <h2 className="font-display text-[1.15rem] font-extrabold text-[#2a1d12]">Şifre değiştir</h2>
        {mode === 'deneme' ? (
          <p className="text-[0.95rem] text-[#7a6650]">Deneme modunda şifre yok; panel bir hesaba bağlanınca burada şifrenizi değiştirebilirsiniz.</p>
        ) : (
          <>
            <TextInput label="Yeni şifre" hint="En az 8 karakter." type="password" value={pw} onChange={setPw} />
            <TextInput label="Yeni şifre (tekrar)" type="password" value={pw2} onChange={setPw2} />
            <button
              type="button"
              onClick={change}
              disabled={busy || !pw}
              className="self-start rounded-xl bg-[#6b4a2c] px-6 py-3 font-display font-bold text-white hover:bg-[#573b22] disabled:opacity-45"
            >
              {busy ? 'Değiştiriliyor…' : 'Şifreyi değiştir'}
            </button>
          </>
        )}
        {msg && <p className={`text-[0.95rem] font-semibold ${msg.ok ? 'text-[#3f6a2f]' : 'text-[#9b3b2a]'}`}>{msg.text}</p>}
      </div>
      <button
        type="button"
        onClick={onLeave}
        className="mt-6 rounded-xl border border-[#dccfbb] bg-white px-6 py-3 font-display font-bold text-[#5c4831] hover:bg-[#f3ebde]"
      >
        Çıkış yap
      </button>
    </>
  )
}
