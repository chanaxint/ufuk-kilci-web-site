import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { SiteContent } from '../lib/siteContent'
import { cleanImages, downloadBackup, listVersions, mode, PanelError, restoreBackup, restoreVersion, signOut, type Surum } from './api'

/*
 * Hesabım: giriş bilgisi, sürüm geçmişi (geri alma), yedek ve fotoğraf
 * temizliği. Şifre ve iki adımlı doğrulama artık Cloudflare Access'te;
 * panelde ayrı bir şifre yok.
 */

const btn = 'rounded-xl px-5 py-3 font-display text-[0.95rem] font-bold transition-colors disabled:opacity-45'
const birincil = `${btn} bg-[#6b4a2c] text-white hover:bg-[#573b22]`
const ikincil = `${btn} border border-[#dccfbb] bg-white text-[#5c4831] hover:bg-[#f3ebde]`

const tarih = (iso: string) =>
  new Date(iso).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })

type Ileti = { ok: boolean; text: string } | null

function Kart({ baslik, children }: { baslik: string; children: ReactNode }) {
  return (
    <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-[#e3d7c4] bg-white p-5 sm:p-7">
      <h2 className="font-display text-[1.15rem] font-extrabold text-[#2a1d12]">{baslik}</h2>
      {children}
    </div>
  )
}

function Durum({ ileti }: { ileti: Ileti }) {
  if (!ileti) return null
  return (
    <p role={ileti.ok ? 'status' : 'alert'} className={`text-[0.95rem] font-semibold ${ileti.ok ? 'text-[#3f6a2f]' : 'text-[#9b3b2a]'}`}>
      {ileti.text}
    </p>
  )
}

const hataMetni = (e: unknown, yedek: string) => (e instanceof PanelError ? e.message : yedek)

export default function Account({
  email,
  surum,
  dirty,
  onRestored,
}: {
  email: string
  surum: number
  dirty: boolean
  /** Geri alma / yedekten yükleme sonrası yeni kayıt */
  onRestored: (content: SiteContent, surum: number) => void
}) {
  const [surumler, setSurumler] = useState<Surum[] | null>(null)
  const [gecmisIleti, setGecmisIleti] = useState<Ileti>(null)
  const [yedekIleti, setYedekIleti] = useState<Ileti>(null)
  const [temizIleti, setTemizIleti] = useState<Ileti>(null)
  const [aday, setAday] = useState<number | null>(null)
  const [mesgul, setMesgul] = useState('')
  const dosya = useRef<HTMLInputElement>(null)

  const yenile = useCallback(() => {
    listVersions()
      .then(setSurumler)
      .catch((e) => setGecmisIleti({ ok: false, text: hataMetni(e, 'Geçmiş okunamadı.') }))
  }, [])
  useEffect(yenile, [yenile, surum])

  const kaydedilmemis = () => !dirty || window.confirm('Kaydetmediğiniz değişiklikler kaybolacak. Devam edilsin mi?')

  const geriAl = async (n: number) => {
    if (!kaydedilmemis() || !window.confirm(`Site ${n}. sürümdeki hâline döndürülsün mü? (Bu işlem de geçmişe yazılır; istediğinizde geri alabilirsiniz.)`))
      return
    setMesgul(`geri-${n}`)
    setGecmisIleti(null)
    try {
      const r = await restoreVersion(n, surum)
      onRestored(r.content, r.surum)
      setGecmisIleti({ ok: true, text: `${n}. sürüme dönüldü. Site güncellendi.` })
    } catch (e) {
      setGecmisIleti({ ok: false, text: hataMetni(e, 'Geri alınamadı.') })
    } finally {
      setMesgul('')
    }
  }

  const yedekYukle = async (f: File | undefined) => {
    if (!f) return
    if (!kaydedilmemis() || !window.confirm('Sitenin içeriği bu yedekteki hâline döndürülsün mü?')) return
    setMesgul('yedek')
    setYedekIleti(null)
    try {
      const r = await restoreBackup(f, surum)
      onRestored(r.content, r.surum)
      setYedekIleti({ ok: true, text: 'Yedek geri yüklendi. Site güncellendi.' })
    } catch (e) {
      setYedekIleti({ ok: false, text: hataMetni(e, 'Yedek yüklenemedi.') })
    } finally {
      setMesgul('')
      if (dosya.current) dosya.current.value = ''
    }
  }

  const temizle = async (uygula: boolean) => {
    if (uygula && !window.confirm(`${aday} fotoğraf kalıcı olarak silinsin mi? Bu geri alınamaz.`)) return
    setMesgul('temizlik')
    setTemizIleti(null)
    try {
      const r = await cleanImages(uygula)
      if (uygula) {
        setAday(null)
        setTemizIleti({ ok: true, text: `${r.silindi} fotoğraf silindi.` })
      } else {
        setAday(r.silinecek)
        setTemizIleti({
          ok: true,
          text: r.silinecek
            ? `Depoda ${r.toplam} fotoğraf var; ${r.silinecek} tanesi hiçbir sürümde kullanılmıyor.`
            : `Depoda ${r.toplam} fotoğraf var; hepsi kullanılıyor.`,
        })
      }
    } catch (e) {
      setTemizIleti({ ok: false, text: hataMetni(e, 'Temizlik yapılamadı.') })
    } finally {
      setMesgul('')
    }
  }

  return (
    <>
      <h1 className="font-display text-[1.75rem] font-extrabold text-[#2a1d12] sm:text-[2rem]">Hesap ve yedekler</h1>
      <p className="mt-2 text-[0.98rem] text-[#7a6650]">
        Giriş yapılan e-posta: <strong className="text-[#2a1d12]">{email}</strong>
      </p>

      <Kart baslik="Giriş">
        <p className="text-[0.95rem] leading-relaxed text-[#5c4831]">
          {mode === 'deneme'
            ? 'Deneme modunda giriş yok; panel yayına alınınca Cloudflare Access ile korunur.'
            : 'Panele giriş Cloudflare Access ile yapılıyor: yalnızca izin verilen e-posta adreslerine gelen tek kullanımlık kodla girilir. Panelde ayrı bir şifre yok. İzinli adresleri değiştirmek için: docs/yonetim-paneli.md.'}
        </p>
        <button type="button" onClick={signOut} className={`${ikincil} self-start`}>
          Çıkış yap
        </button>
      </Kart>

      <Kart baslik="Sürüm geçmişi">
        <p className="text-[0.95rem] leading-relaxed text-[#5c4831]">
          Her kayıt ayrı bir sürüm olarak saklanır (son 50). Hatalı bir değişiklikten sonra siteyi önceki hâline döndürebilirsiniz.
        </p>
        {mode === 'deneme' ? (
          <p className="text-[0.95rem] text-[#7a6650]">Deneme modunda geçmiş tutulmuyor.</p>
        ) : !surumler ? (
          <p className="text-[0.95rem] text-[#7a6650]">Okunuyor…</p>
        ) : surumler.length === 0 ? (
          <p className="text-[0.95rem] text-[#7a6650]">Henüz kayıt yok. Site varsayılan içerikle açılıyor; ilk Kaydet'ten sonra geçmiş başlar.</p>
        ) : (
          <ul className="flex max-h-[26rem] flex-col gap-2 overflow-y-auto pr-1">
            {surumler.map((s) => (
              <li key={s.surum} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#efe5d6] px-4 py-3">
                <span className="min-w-0 text-[0.93rem] text-[#2a1d12]">
                  <strong>{s.surum}.</strong> {tarih(s.guncellendi)}
                  <span className="block text-[0.84rem] text-[#8a7458]">
                    {s.aciklama} · {s.guncelleyen}
                  </span>
                </span>
                {s.surum === surum ? (
                  <span className="rounded-full bg-[#eef4e7] px-3 py-1 font-display text-[0.8rem] font-bold text-[#3f6a2f]">Yayında</span>
                ) : (
                  <button type="button" disabled={!!mesgul} onClick={() => geriAl(s.surum)} className={ikincil}>
                    {mesgul === `geri-${s.surum}` ? 'Dönülüyor…' : 'Bu sürüme dön'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        <Durum ileti={gecmisIleti} />
      </Kart>

      <Kart baslik="Yedek">
        <p className="text-[0.95rem] leading-relaxed text-[#5c4831]">
          Sitenin bütün yazılarını tek bir dosya olarak bilgisayarınıza indirin; gerektiğinde aynı dosyadan geri yükleyin.
          Fotoğraflar dosyaya girmez, Cloudflare'deki depoda kalır.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!!mesgul || mode === 'deneme'}
            onClick={() => downloadBackup().catch((e) => setYedekIleti({ ok: false, text: hataMetni(e, 'Yedek indirilemedi.') }))}
            className={birincil}
          >
            Yedeği indir
          </button>
          <button type="button" disabled={!!mesgul || mode === 'deneme'} onClick={() => dosya.current?.click()} className={ikincil}>
            {mesgul === 'yedek' ? 'Yükleniyor…' : 'Yedekten geri yükle'}
          </button>
          <input ref={dosya} type="file" accept="application/json,.json" className="hidden" onChange={(e) => yedekYukle(e.target.files?.[0])} />
        </div>
        <Durum ileti={yedekIleti} />
      </Kart>

      <Kart baslik="Kullanılmayan fotoğraflar">
        <p className="text-[0.95rem] leading-relaxed text-[#5c4831]">
          Değiştirdiğiniz ya da kaldırdığınız fotoğraflar, geri alabilmeniz için depoda kalır. Ne güncel sitede ne de saklanan
          sürümlerde kullanılan fotoğrafları buradan silebilirsiniz (son 24 saatte yüklenenler korunur).
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={!!mesgul || mode === 'deneme'} onClick={() => temizle(false)} className={ikincil}>
            {mesgul === 'temizlik' && aday === null ? 'Bakılıyor…' : 'Kullanılmayanları bul'}
          </button>
          {!!aday && (
            <button type="button" disabled={!!mesgul} onClick={() => temizle(true)} className={`${btn} bg-[#9b3b2a] text-white hover:bg-[#7d2f20]`}>
              {aday} fotoğrafı sil
            </button>
          )}
        </div>
        <Durum ileti={temizIleti} />
      </Kart>
    </>
  )
}
