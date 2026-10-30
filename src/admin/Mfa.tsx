import { useCallback, useEffect, useState } from 'react'
import { mfaEnrollFinish, mfaEnrollStart, mfaRemove, mfaState, PanelError, type MfaState } from './api'

/*
 * Hesabım → İki adımlı doğrulama. Kurulum: QR kodu doğrulama uygulamasıyla
 * okut (ya da gizli anahtarı elle yaz), uygulamanın verdiği 6 haneli kodu
 * gir. Bundan sonra girişte şifreden sonra kod istenir; kod girilmeden
 * açılan oturum veritabanında hiçbir şeyi değiştiremez.
 */

const btn =
  'rounded-xl px-5 py-3 font-display text-[0.95rem] font-bold transition-colors disabled:opacity-45'

export function useMfaState() {
  const [state, setState] = useState<MfaState | null>(null)
  const reload = useCallback(() => {
    mfaState()
      .then(setState)
      .catch(() => setState(null))
  }, [])
  useEffect(reload, [reload])
  return { state, reload }
}

/** Panelin üstünde: doğrulama kapalıysa kısa hatırlatma */
export function MfaReminder({ onOpen }: { onOpen: () => void }) {
  const { state } = useMfaState()
  if (!state?.available || state.enabled) return null
  return (
    <div className="border-b border-[#e8cf9a] bg-[#fbf0d6] px-4 py-2.5 text-center text-[0.9rem] leading-snug text-[#6b4f1d] sm:px-6">
      Panelde hasta bilgileri var: hesabınızı <strong>iki adımlı doğrulamayla</strong> koruyun.{' '}
      <button type="button" onClick={onOpen} className="font-bold underline underline-offset-4">
        Şimdi aç
      </button>
    </div>
  )
}

export default function MfaCard() {
  const { state, reload } = useMfaState()
  const [enroll, setEnroll] = useState<{ factorId: string; qr: string; secret: string } | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const run = async (job: () => Promise<void>, ok?: string) => {
    setBusy(true)
    setMsg(null)
    try {
      await job()
      if (ok) setMsg({ ok: true, text: ok })
    } catch (e) {
      setMsg({ ok: false, text: e instanceof PanelError ? e.message : 'İşlem yapılamadı. Tekrar deneyin.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-[#e3d7c4] bg-white p-5 sm:p-7">
      <h2 className="font-display text-[1.15rem] font-extrabold text-[#2a1d12]">İki adımlı doğrulama</h2>

      {!state ? (
        <p className="text-[0.95rem] text-[#7a6650]">Durum okunuyor…</p>
      ) : !state.available ? (
        <p className="text-[0.95rem] text-[#7a6650]">
          Deneme modunda yok; panel Supabase hesabına bağlanınca burada açabilirsiniz.
        </p>
      ) : state.enabled ? (
        <>
          <p className="rounded-xl bg-[#eef4e7] px-4 py-3 text-[0.95rem] leading-snug text-[#3f6a2f]">
            <strong>Açık.</strong> Girişte şifreden sonra doğrulama uygulamanızdaki kod isteniyor.
          </p>
          <ul className="flex flex-col gap-2">
            {state.factors.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#efe5d6] px-4 py-3">
                <span className="text-[0.95rem] text-[#2a1d12]">
                  {f.name}
                  <span className="ml-2 text-[0.84rem] text-[#8a7458]">{new Date(f.created).toLocaleDateString('tr-TR')}</span>
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (!window.confirm('İki adımlı doğrulama kapatılsın mı? Hesabınız yalnızca şifreyle korunur.')) return
                    run(async () => {
                      await mfaRemove(f.id)
                      reload()
                    }, 'İki adımlı doğrulama kapatıldı.')
                  }}
                  className={`${btn} border border-[#dccfbb] bg-white text-[#9b3b2a] hover:bg-[#f7e6e1]`}
                >
                  Kapat
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : enroll ? (
        <>
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-[0.95rem] leading-relaxed text-[#5c4831]">
            <li>Telefonunuzda bir doğrulama uygulaması açın (Google Authenticator, Microsoft Authenticator…).</li>
            <li>Aşağıdaki QR kodu okutun. Okutamazsanız anahtarı elle yazın.</li>
            <li>Uygulamanın gösterdiği 6 haneli kodu yazıp onaylayın.</li>
          </ol>
          <div className="flex flex-wrap items-center gap-5">
            <img src={enroll.qr} alt="Doğrulama uygulaması için QR kod" className="size-44 rounded-xl border border-[#efe5d6] bg-white p-2" />
            <div className="min-w-0">
              <p className="font-display text-[0.85rem] font-bold text-[#8a7458]">Elle girilecek anahtar</p>
              <code className="mt-1 block break-all rounded-lg bg-[#f3ebde] px-3 py-2 text-[0.92rem] text-[#2a1d12] select-all">
                {enroll.secret}
              </code>
            </div>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="font-display text-[0.95rem] font-bold text-[#2a1d12]">Uygulamadaki kod</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^\d\s]/g, '').slice(0, 7))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123 456"
              aria-label="Uygulamadaki kod"
              className="w-48 rounded-xl border border-[#dccfbb] bg-white px-4 py-3 text-center font-display text-[1.2rem] tracking-[0.25em] text-[#2a1d12] outline-none focus:border-[#8a6a48] focus:ring-4 focus:ring-[#8a6a48]/15"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || code.replace(/\s/g, '').length !== 6}
              onClick={() =>
                run(async () => {
                  await mfaEnrollFinish(enroll.factorId, code)
                  setEnroll(null)
                  setCode('')
                  reload()
                }, 'İki adımlı doğrulama açıldı. Bir sonraki girişte kod istenecek.')
              }
              className={`${btn} bg-[#6b4a2c] text-white hover:bg-[#573b22]`}
            >
              {busy ? 'Doğrulanıyor…' : 'Onayla ve aç'}
            </button>
            <button type="button" disabled={busy} onClick={() => setEnroll(null)} className={`${btn} text-[#7a6650] hover:bg-[#f3ebde]`}>
              Vazgeç
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-[0.95rem] leading-relaxed text-[#5c4831]">
            Açıkken panele girmek için şifrenin yanında telefonunuzdaki doğrulama uygulamasının ürettiği kod da gerekir.
            Şifreniz başkasının eline geçse bile panel açılmaz. Panelde hasta bilgileri olduğu için açmanız önerilir.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => run(async () => setEnroll(await mfaEnrollStart()))}
            className={`${btn} self-start bg-[#6b4a2c] text-white hover:bg-[#573b22]`}
          >
            {busy ? 'Hazırlanıyor…' : 'İki adımlı doğrulamayı aç'}
          </button>
        </>
      )}

      {msg && <p className={`text-[0.95rem] font-semibold ${msg.ok ? 'text-[#3f6a2f]' : 'text-[#9b3b2a]'}`}>{msg.text}</p>}
    </div>
  )
}
