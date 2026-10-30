import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { currentEmail, PanelError, signOut } from './api'
import Editor from './Editor'

/*
 * Giriş Cloudflare Access ile: panel sayfası açılmadan önce Access,
 * izinli e-postaya tek kullanımlık kod gönderip doğrular. Panel bu yüzden
 * kendi giriş/şifre/kod ekranı göstermiyor; yalnızca sunucuya "kim giriş
 * yaptı" diye soruyor. Sunucu her istekte Access belirtecini ayrıca
 * doğruluyor (`functions/api/yonetim/_middleware.ts`).
 */
type Screen =
  | { kind: 'yukleniyor' }
  | { kind: 'panel'; email: string }
  | { kind: 'kurulum' }
  | { kind: 'yetkisiz'; ileti: string }
  | { kind: 'hata'; ileti: string }

export default function AdminApp() {
  const [screen, setScreen] = useState<Screen>({ kind: 'yukleniyor' })

  const kontrol = useCallback(() => {
    setScreen({ kind: 'yukleniyor' })
    currentEmail()
      .then((email) => setScreen({ kind: 'panel', email }))
      .catch((e) => {
        const status = e instanceof PanelError ? e.status : 0
        const ileti = e instanceof PanelError ? e.message : 'Beklenmeyen bir hata oldu.'
        if (status === 503) setScreen({ kind: 'kurulum' })
        else if (status === 401 || status === 403) setScreen({ kind: 'yetkisiz', ileti })
        else setScreen({ kind: 'hata', ileti })
      })
  }, [])
  useEffect(kontrol, [kontrol])

  if (screen.kind === 'yukleniyor') return <Center><p className="text-[#7a6650]">Yükleniyor…</p></Center>
  if (screen.kind === 'kurulum') return <Setup />
  if (screen.kind === 'yetkisiz' || screen.kind === 'hata')
    return (
      <Card title={screen.kind === 'yetkisiz' ? 'Giriş gerekli' : 'Panel açılamadı'}>
        <div className="flex flex-col gap-4">
          <Message>{screen.ileti}</Message>
          <button type="button" onClick={kontrol} className={primaryCls}>
            Tekrar dene
          </button>
          {screen.kind === 'yetkisiz' && (
            <button
              type="button"
              onClick={signOut}
              className="self-center font-display text-[0.92rem] font-bold text-[#7a6650] underline-offset-4 hover:underline"
            >
              Farklı hesapla gir
            </button>
          )}
        </div>
      </Card>
    )
  return <Editor email={screen.email} />
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

/* ——— Kurulum yapılmamış ——— */

function Setup() {
  return (
    <Card title="Panel henüz kurulmadı">
      <div className="flex flex-col gap-4 text-[0.97rem] leading-relaxed text-[#5c4831]">
        <p>
          Bu panel sitenin Cloudflare hesabındaki içerik veritabanına (D1), fotoğraf deposuna (R2) ve yönetici
          girişine (Cloudflare Access) bağlanınca çalışır.
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
