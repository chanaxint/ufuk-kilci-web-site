import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { currentEmail, mfaState, mfaVerifyLogin, mode, PanelError, sendReset, signIn, signOut, updatePassword, watchAuth } from './api'
import Editor from './Editor'

type Screen = 'yukleniyor' | 'giris' | 'kod' | 'kurtarma' | 'panel' | 'kurulum'

/*
 * Şifre sıfırlama e-postasındaki bağlantı panele `#...type=recovery` ile
 * geliyor. Supabase adresi okuyup temizlemeden önce burada yakalanıyor.
 */
const arrivedForRecovery = typeof location !== 'undefined' && location.hash.includes('type=recovery')

export default function AdminApp() {
  const [screen, setScreen] = useState<Screen>(mode === 'kurulmamis' ? 'kurulum' : 'yukleniyor')
  const [email, setEmail] = useState('')
  const recovering = useRef(arrivedForRecovery)

  /*
   * Oturum açıldıktan sonra: iki adımlı doğrulama kuruluysa önce kod iste.
   * Şifre sıfırlama bağlantısıyla gelindiyse de önce kod (Supabase, doğrulama
   * kurulu hesapta şifre değişikliği için iki adımlı oturum isteyebiliyor).
   */
  const afterSignIn = async () => {
    setEmail((await currentEmail()) ?? '')
    let needsCode = false
    try {
      needsCode = (await mfaState()).needsCode
    } catch {
      /* durum okunamadıysa panel açılır; yetki veritabanında yine denetleniyor */
    }
    setScreen(needsCode ? 'kod' : recovering.current ? 'kurtarma' : 'panel')
  }

  useEffect(() => {
    if (mode === 'kurulmamis') return
    let stop = () => {}
    watchAuth({
      recovery: () => {
        recovering.current = true
        afterSignIn()
      },
      signedOut: () => setScreen('giris'),
    }).then((s) => (stop = s))
    currentEmail().then((e) => {
      if (e) afterSignIn()
      else setScreen('giris')
    })
    return () => stop()
  }, [])

  if (screen === 'kurulum') return <Setup />
  if (screen === 'yukleniyor') return <Center><p className="text-[#7a6650]">Yükleniyor…</p></Center>
  if (screen === 'kod')
    return (
      <CodeStep
        email={email}
        onDone={() => setScreen(recovering.current ? 'kurtarma' : 'panel')}
        onCancel={async () => {
          await signOut()
          setScreen('giris')
        }}
      />
    )
  if (screen === 'kurtarma')
    return (
      <Recovery
        onDone={async () => {
          recovering.current = false
          setEmail((await currentEmail()) ?? '')
          setScreen('panel')
        }}
      />
    )
  if (screen === 'giris')
    return (
      <Login onSignedIn={afterSignIn} />
    )
  return <Editor email={email} onSignedOut={() => setScreen('giris')} />
}

/* ——— Ortak kart ——— */

function Center({ children }: { children: ReactNode }) {
  return <div className="grid min-h-svh place-items-center px-4 py-10">{children}</div>
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Center>
      <div className="w-full max-w-md rounded-3xl border border-[#e3d7c4] bg-white p-7 shadow-[0_24px_60px_-30px_rgb(42_29_18/0.45)] sm:p-9">
        <p className="font-wordmark text-[2rem] leading-none text-[#2a1d12]">Ufuk Kilci</p>
        <p className="mt-1 font-display text-[0.72rem] font-bold tracking-[0.16em] text-[#8a7458] uppercase">Site yönetimi</p>
        <h1 className="mt-7 font-display text-[1.35rem] font-extrabold text-[#2a1d12]">{title}</h1>
        <div className="mt-5">{children}</div>
      </div>
    </Center>
  )
}

const inputCls =
  'w-full rounded-xl border border-[#dccfbb] bg-white px-4 py-3 text-[1rem] text-[#2a1d12] outline-none transition-colors placeholder:text-[#a8977f] focus:border-[#8a6a48] focus:ring-4 focus:ring-[#8a6a48]/15'
const primaryCls =
  'w-full rounded-xl bg-[#6b4a2c] px-6 py-3.5 font-display text-[1.02rem] font-bold text-white transition-colors hover:bg-[#573b22] disabled:opacity-55'

function Message({ ok, children }: { ok?: boolean; children: ReactNode }) {
  return (
    <p
      role={ok ? 'status' : 'alert'}
      className={`rounded-xl px-4 py-3 text-[0.93rem] leading-snug ${ok ? 'bg-[#eef4e7] text-[#3f6a2f]' : 'bg-[#fbeee9] text-[#8a3424]'}`}
    >
      {children}
    </p>
  )
}

/* ——— İki adımlı doğrulama kodu ——— */

function CodeStep({ email, onDone, onCancel }: { email: string; onDone: () => void; onCancel: () => void }) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await mfaVerifyLogin(code)
      onDone()
    } catch (err) {
      setError(err instanceof PanelError ? err.message : 'Kod doğrulanamadı. Tekrar deneyin.')
      setCode('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card title="Doğrulama kodu">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <p className="text-[0.95rem] leading-relaxed text-[#5c4831]">
          {email ? <strong>{email}</strong> : 'Hesabınız'} iki adımlı doğrulamayla korunuyor. Telefonunuzdaki doğrulama
          uygulamasında görünen <strong>6 haneli kodu</strong> yazın.
        </p>
        <label className="flex flex-col gap-1.5">
          <span className="font-display text-[0.95rem] font-bold text-[#2a1d12]">Kod</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^\d\s]/g, '').slice(0, 7))}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            placeholder="123 456"
            aria-label="Doğrulama kodu"
            className={`${inputCls} text-center font-display text-[1.4rem] tracking-[0.3em]`}
          />
        </label>
        {error && <Message>{error}</Message>}
        <button type="submit" disabled={busy || code.replace(/\s/g, '').length !== 6} className={primaryCls}>
          {busy ? 'Doğrulanıyor…' : 'Doğrula ve gir'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="self-center font-display text-[0.92rem] font-bold text-[#7a6650] underline-offset-4 hover:underline"
        >
          Farklı hesapla gir
        </button>
      </form>
    </Card>
  )
}

/* ——— Giriş ——— */

function Login({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [forgot, setForgot] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (forgot) {
        await sendReset(email)
        setSent(true)
      } else {
        await signIn(email, password)
        onSignedIn()
      }
    } catch (err) {
      setError(err instanceof PanelError ? err.message : 'Bir sorun oldu. Tekrar deneyin.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card title={forgot ? 'Şifrenizi mi unuttunuz?' : 'Giriş yapın'}>
      {mode === 'deneme' && !forgot && (
        <div className="mb-5">
          <Message ok>
            <strong>Deneme modu:</strong> panel henüz bir hesaba bağlı değil. Herhangi bir e-posta ve şifreyle
            girip paneli deneyebilirsiniz; değişiklikler yalnızca bu tarayıcıda kalır.
          </Message>
        </div>
      )}
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        {forgot && (
          <p className="text-[0.95rem] leading-relaxed text-[#5c4831]">
            E-posta adresinizi yazın; size yeni şifre belirlemeniz için bir bağlantı gönderelim.
          </p>
        )}
        <label className="flex flex-col gap-1.5">
          <span className="font-display text-[0.95rem] font-bold text-[#2a1d12]">E-posta</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
        </label>
        {!forgot && (
          <label className="flex flex-col gap-1.5">
            <span className="font-display text-[0.95rem] font-bold text-[#2a1d12]">Şifre</span>
            <span className="relative">
              <input
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputCls} pr-24`}
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg px-3 py-1.5 font-display text-[0.85rem] font-bold text-[#6b4a2c] hover:bg-[#f3ebde]"
              >
                {show ? 'Gizle' : 'Göster'}
              </button>
            </span>
          </label>
        )}
        {error && <Message>{error}</Message>}
        {sent && <Message ok>Bağlantı gönderildi. E-postanızı (gerekirse gereksiz klasörünü) kontrol edin.</Message>}
        <button type="submit" disabled={busy} className={primaryCls}>
          {busy ? 'Lütfen bekleyin…' : forgot ? 'Bağlantıyı gönder' : 'Giriş yap'}
        </button>
        <button
          type="button"
          onClick={() => {
            setForgot((v) => !v)
            setError('')
            setSent(false)
          }}
          className="self-center rounded-lg px-3 py-2 font-display text-[0.92rem] font-bold text-[#6b4a2c] hover:bg-[#f3ebde]"
        >
          {forgot ? '← Girişe dön' : 'Şifremi unuttum'}
        </button>
      </form>
    </Card>
  )
}

/* ——— E-postadaki bağlantıyla gelince: yeni şifre ——— */

function Recovery({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (pw !== pw2) return setError('İki şifre birbirini tutmuyor.')
    setBusy(true)
    try {
      await updatePassword(pw)
      onDone()
    } catch (err) {
      setError(err instanceof PanelError ? err.message : 'Şifre kaydedilemedi.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card title="Yeni şifrenizi belirleyin">
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <label className="flex flex-col gap-1.5">
          <span className="font-display text-[0.95rem] font-bold text-[#2a1d12]">Yeni şifre</span>
          <span className="text-[0.86rem] text-[#7a6650]">En az 8 karakter.</span>
          <input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-display text-[0.95rem] font-bold text-[#2a1d12]">Yeni şifre (tekrar)</span>
          <input type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} className={inputCls} />
        </label>
        {error && <Message>{error}</Message>}
        <button type="submit" disabled={busy || !pw} className={primaryCls}>
          {busy ? 'Kaydediliyor…' : 'Şifreyi kaydet ve devam et'}
        </button>
      </form>
    </Card>
  )
}

/* ——— Henüz kurulmamış ——— */

function Setup() {
  return (
    <Card title="Panel henüz kurulmadı">
      <div className="flex flex-col gap-4 text-[0.97rem] leading-relaxed text-[#5c4831]">
        <p>
          Bu panelin çalışması için sitenin bir Supabase hesabına bağlanması gerekiyor. Hesap ücretsiz ve
          doktorun kendi e-postasıyla açılmalı; giriş de o e-posta ve şifreyle yapılacak.
        </p>
        <p>
          Adım adım kurulum projedeki <code className="rounded bg-[#f3ebde] px-1.5 py-0.5 text-[0.9em]">docs/yonetim-paneli.md</code>{' '}
          dosyasında. Kurulum bitene kadar site bugünkü yazı ve fotoğraflarla çalışmaya devam eder.
        </p>
        <a href="/" className="mt-1 self-start rounded-xl border border-[#dccfbb] px-5 py-3 font-display font-bold text-[#5c4831] hover:bg-[#f3ebde]">
          ← Siteye dön
        </a>
      </div>
    </Card>
  )
}
