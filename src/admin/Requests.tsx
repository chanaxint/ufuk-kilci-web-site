import { useCallback, useEffect, useMemo, useState } from 'react'
import { telHref, waDigits } from '../lib/siteContent'
import { deleteRequest, listRequests, mode, PanelError, setRequestStatus, type AppointmentRequest, type RequestStatus } from './api'

/*
 * Randevu talepleri: sitedeki mektup formundan gelenler. En yeni üstte;
 * hasta tek dokunuşla aranıyor ya da WhatsApp'tan yazılıyor, sonra
 * "arandı" / "tamamlandı" diye işaretleniyor.
 */

const STATUS: Record<RequestStatus, { label: string; cls: string }> = {
  yeni: { label: 'Yeni', cls: 'bg-[#fbe3c4] text-[#7a4a12]' },
  arandi: { label: 'Arandı', cls: 'bg-[#e3ecf6] text-[#2f4c6b]' },
  tamamlandi: { label: 'Tamamlandı', cls: 'bg-[#e2efdc] text-[#3f6a2f]' },
}

const FILTERS: { id: 'hepsi' | RequestStatus; label: string }[] = [
  { id: 'hepsi', label: 'Tümü' },
  { id: 'yeni', label: 'Yeni' },
  { id: 'arandi', label: 'Arandı' },
  { id: 'tamamlandi', label: 'Tamamlandı' },
]

/** "Bugün 14:32", "Dün 09:10" ya da "12 Mart 2026, 16:05" */
function when(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const time = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((day(new Date()) - day(d)) / 86_400_000)
  if (diff === 0) return `Bugün ${time}`
  if (diff === 1) return `Dün ${time}`
  return `${d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}, ${time}`
}

/** Paneldeki menü rozeti için: yeni talep sayısı, birkaç dakikada bir tazeleniyor */
export function useNewRequestCount(refreshKey: number) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let alive = true
    const load = () =>
      listRequests()
        .then((list) => alive && setCount(list.filter((r) => r.durum === 'yeni').length))
        .catch(() => {})
    load()
    const id = window.setInterval(load, 120_000)
    return () => {
      alive = false
      window.clearInterval(id)
    }
  }, [refreshKey])
  return count
}

export default function Requests({ onChanged }: { onChanged: () => void }) {
  const [list, setList] = useState<AppointmentRequest[] | null>(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('hepsi')
  const [busy, setBusy] = useState<number | null>(null)

  const load = useCallback(() => {
    setError('')
    listRequests()
      .then(setList)
      .catch((e) => setError(e instanceof PanelError ? e.message : 'Talepler yüklenemedi.'))
  }, [])

  /* Açıkken dakikada bir tazelensin: yeni talep gelirse kendiliğinden görünsün */
  useEffect(() => {
    load()
    const id = window.setInterval(load, 60_000)
    return () => window.clearInterval(id)
  }, [load])

  const shown = useMemo(() => (list ?? []).filter((r) => filter === 'hepsi' || r.durum === filter), [list, filter])

  const act = async (id: number, job: () => Promise<void>) => {
    setBusy(id)
    setError('')
    try {
      await job()
      load()
      onChanged()
    } catch (e) {
      setError(e instanceof PanelError ? e.message : 'İşlem yapılamadı. Tekrar deneyin.')
    } finally {
      setBusy(null)
    }
  }

  const btn = 'rounded-xl px-4 py-2.5 font-display text-[0.9rem] font-bold transition-colors disabled:opacity-50'

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[1.75rem] leading-tight font-extrabold text-[#2a1d12] sm:text-[2rem]">Randevu talepleri</h1>
          <p className="mt-2 max-w-2xl text-[0.98rem] leading-relaxed text-[#7a6650]">
            Sitedeki randevu mektubundan gelen talepler. Hastayı aradıktan sonra durumunu işaretleyin; işi biten talebi
            silebilirsiniz.
          </p>
        </div>
        <button type="button" onClick={load} className={`${btn} border border-[#dccfbb] bg-white text-[#5c4831] hover:bg-[#f3ebde]`}>
          ↻ Yenile
        </button>
      </div>

      {mode === 'deneme' && (
        <p className="mt-4 rounded-xl bg-[#fbf0d6] px-4 py-3 text-[0.9rem] text-[#6b4f1d]">
          Deneme modunda talepler yalnızca bu tarayıcıda: sitede formu doldurup gönderin, burada görünür.
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Duruma göre">
        {FILTERS.map((f) => {
          const n = f.id === 'hepsi' ? (list?.length ?? 0) : (list ?? []).filter((r) => r.durum === f.id).length
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-4 py-2 font-display text-[0.9rem] font-bold transition-colors ${
                filter === f.id ? 'bg-[#6b4a2c] text-white' : 'bg-white text-[#5c4831] ring-1 ring-[#dccfbb] hover:bg-[#f3ebde]'
              }`}
            >
              {f.label} <span className="opacity-70">({n})</span>
            </button>
          )
        })}
      </div>

      {error && <p className="mt-4 rounded-xl bg-[#fbeee9] px-4 py-3 font-semibold text-[#9b3b2a]">{error}</p>}

      <div className="mt-5 flex flex-col gap-4">
        {list === null && !error && <p className="py-12 text-center text-[#7a6650]">Talepler yükleniyor…</p>}
        {list !== null && shown.length === 0 && (
          <p className="rounded-2xl border border-dashed border-[#dccfbb] bg-white py-12 text-center text-[#7a6650]">
            {filter === 'hepsi' ? 'Henüz randevu talebi yok.' : 'Bu durumda talep yok.'}
          </p>
        )}
        {shown.map((r) => (
          <article
            key={r.id}
            className={`rounded-2xl border bg-white p-5 shadow-[0_1px_3px_rgb(42_29_18/0.06)] sm:p-6 ${
              r.durum === 'yeni' ? 'border-[#e8c48f]' : 'border-[#e3d7c4]'
            }`}
          >
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-display text-[1.2rem] font-extrabold break-words text-[#2a1d12]">{r.ad}</h2>
                <p className="mt-0.5 text-[0.88rem] text-[#8a7458]">{when(r.created_at)}</p>
              </div>
              <span className={`rounded-full px-3 py-1 font-display text-[0.8rem] font-bold ${STATUS[r.durum]?.cls ?? ''}`}>
                {STATUS[r.durum]?.label ?? r.durum}
              </span>
            </header>

            <dl className="mt-4 grid gap-2 text-[0.98rem] sm:grid-cols-[7rem_1fr]">
              <dt className="font-display text-[0.85rem] font-bold text-[#8a7458]">Telefon</dt>
              <dd className="font-semibold text-[#2a1d12]">{r.telefon}</dd>
              {r.konu && (
                <>
                  <dt className="font-display text-[0.85rem] font-bold text-[#8a7458]">Konu</dt>
                  <dd className="text-[#2a1d12]">{r.konu}</dd>
                </>
              )}
              {r.mesaj && (
                <>
                  <dt className="font-display text-[0.85rem] font-bold text-[#8a7458]">Mesaj</dt>
                  <dd className="leading-relaxed break-words whitespace-pre-line text-[#4a3826]">{r.mesaj}</dd>
                </>
              )}
            </dl>

            <div className="mt-5 flex flex-wrap gap-2 border-t border-[#efe5d6] pt-4">
              <a href={telHref(r.telefon)} className={`${btn} bg-[#6b4a2c] text-white hover:bg-[#573b22]`}>
                📞 Ara
              </a>
              <a
                href={`https://wa.me/${waDigits(r.telefon)}`}
                target="_blank"
                rel="noreferrer"
                className={`${btn} bg-[#e2efdc] text-[#2f5a22] hover:bg-[#d3e6ca]`}
              >
                WhatsApp’tan yaz
              </a>
              <span className="grow" />
              {r.durum !== 'arandi' && (
                <button
                  type="button"
                  disabled={busy === r.id}
                  onClick={() => act(r.id, () => setRequestStatus(r.id, 'arandi'))}
                  className={`${btn} border border-[#dccfbb] bg-white text-[#2f4c6b] hover:bg-[#eef3f9]`}
                >
                  Arandı
                </button>
              )}
              {r.durum !== 'tamamlandi' && (
                <button
                  type="button"
                  disabled={busy === r.id}
                  onClick={() => act(r.id, () => setRequestStatus(r.id, 'tamamlandi'))}
                  className={`${btn} border border-[#dccfbb] bg-white text-[#3f6a2f] hover:bg-[#eef6ea]`}
                >
                  Tamamlandı
                </button>
              )}
              {r.durum !== 'yeni' && (
                <button
                  type="button"
                  disabled={busy === r.id}
                  onClick={() => act(r.id, () => setRequestStatus(r.id, 'yeni'))}
                  className={`${btn} text-[#7a6650] hover:bg-[#f3ebde]`}
                >
                  Yeniye al
                </button>
              )}
              <button
                type="button"
                disabled={busy === r.id}
                onClick={() => {
                  if (window.confirm(`${r.ad} adlı talep silinsin mi? Bu geri alınamaz.`)) act(r.id, () => deleteRequest(r.id))
                }}
                className={`${btn} text-[#9b3b2a] hover:bg-[#f7e6e1]`}
              >
                Sil
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}
