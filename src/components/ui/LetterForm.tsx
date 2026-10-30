import { useId, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useContent } from '../../lib/ContentContext'
import { emailAvailable, sendByEmail, TURNSTILE_SITE_KEY, whatsappHref } from '../../lib/appointment'
import { isPreview } from '../../lib/preview'
import { safeLinkUrl } from '../../lib/siteContent'
import {
  GUNLER,
  randevuDenetle,
  SINIR,
  ZAMANLAR,
  type Alan,
  type RandevuGirdisi,
  type RandevuTalebi,
  type Yontem,
} from '../../lib/randevuKurallari'
import { ArrowRight, ChevronDown, Send, WhatsApp } from './icons'
import { AGE, GRAIN, PAPER } from '../../lib/paper'
import Turnstile, { type TurnstileState } from './Turnstile'

const fieldRow =
  'w-full border-0 border-b border-[#6b5334]/35 bg-transparent px-1 pt-1 pb-1.5 font-sans text-[0.98rem] text-[#3b2c1d] outline-none transition-colors duration-300 placeholder:text-[#9a866a] focus:border-[#6b4a2c] aria-[invalid=true]:border-[#9b3b2a]/70 disabled:opacity-60'

const labelRow =
  'font-display text-[0.7rem] font-bold tracking-[0.16em] text-[#7a6446] uppercase'

const errorText = 'text-[0.8rem] leading-snug text-[#8c3320]'

type Hatalar = Partial<Record<Alan | 'onay', string>>

const BOS: RandevuGirdisi = { ad: '', telefon: '', eposta: '', gun: GUNLER[0], zaman: ZAMANLAR[0] }

/**
 * Randevu talebi — mektup ve zarf.
 *
 * Form gerçek bir kâğıt: alanlar kâğıdın üzerine çizilmiş satırlar. Yalnızca
 * randevu için gereken iletişim bilgisi isteniyor (şikâyet ya da sağlık
 * bilgisi yok). İki gönderim yolu var:
 *
 * - WhatsApp: mesaj hazırlanıp WhatsApp açılır, ziyaretçi kendisi gönderir.
 *   Gönderildiğini bilemediğimiz için "iletildi" denmez; kâğıt yerinde
 *   kalır, altında ne yapılacağı yazar.
 * - E-posta: talep sunucuya gider, yanıt beklenir ("Gönderiliyor…"). Ancak
 *   sunucu kabul ederse kâğıt katlanıp zarfa girer; hata olursa kâğıt
 *   yerinde kalır, hata iletisi ve WhatsApp seçeneği gösterilir.
 *
 * Alanlar normal form alanları, klavyeyle gezilebiliyor; hatalar alanın
 * altında yazıyor ve ekran okuyucuya bağlı. "Azaltılmış hareket"
 * tercihinde katlanma atlanıp doğrudan kapalı zarf gösteriliyor.
 */
export default function LetterForm() {
  const content = useContent()
  const { doctor } = content
  const uid = useId()
  const [form, setForm] = useState<RandevuGirdisi>(BOS)
  const [yontem, setYontem] = useState<Yontem>('whatsapp')
  const [consent, setConsent] = useState(false)
  const [hatalar, setHatalar] = useState<Hatalar>({})
  /* Görünmez tuzak alan: insanlar görmüyor, formu dolduran botlar dolduruyor */
  const [trap, setTrap] = useState('')
  /* Turnstile (yalnızca e-posta yolunda): tek kullanımlık belirteç */
  const [token, setToken] = useState<string | null>(null)
  const [tsState, setTsState] = useState<TurnstileState>('bekliyor')
  const [tsReset, setTsReset] = useState(0)
  const [uyari, setUyari] = useState('')
  const [sunucuHatasi, setSunucuHatasi] = useState('')
  /** WhatsApp açıldıysa: tekrar açmak için bağlantı */
  const [waAcildi, setWaAcildi] = useState<string | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [phase, setPhase] = useState<'yazi' | 'katlaniyor' | 'gonderildi'>('yazi')
  /** Zarfa giren talebin özeti (alanlar sıfırlansa da zarf aynı kalsın) */
  const [gonderilen, setGonderilen] = useState<RandevuTalebi | null>(null)
  const timers = useRef<number[]>([])
  const formRef = useRef<HTMLFormElement>(null)
  const reduce = useReducedMotion()
  const epostaSecili = emailAvailable && yontem === 'eposta'

  const alan = (k: Alan) => ({
    id: `${uid}-${k}`,
    'aria-invalid': hatalar[k] ? true : undefined,
    'aria-describedby': hatalar[k] ? `${uid}-${k}-hata` : undefined,
  })
  const degistir = (k: Alan, v: string) => {
    setForm((f) => ({ ...f, [k]: v }))
    if (hatalar[k]) setHatalar((h) => ({ ...h, [k]: undefined }))
  }
  const hataYaz = (k: Alan | 'onay') =>
    hatalar[k] ? (
      <span id={`${uid}-${k}-hata`} className={errorText}>
        {hatalar[k]}
      </span>
    ) : null

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (gonderiliyor) return
    setUyari('')
    setSunucuHatasi('')
    if (isPreview) {
      setUyari('Önizlemede gönderim yapılmaz.')
      return
    }
    const d = randevuDenetle(form)
    const yeni: Hatalar = 'hatalar' in d ? { ...d.hatalar } : {}
    if (!consent) yeni.onay = 'Devam etmek için onay kutusunu işaretleyin.'
    setHatalar(yeni)
    if ('hatalar' in d || !consent) {
      /* İlk hatalı alana odaklan */
      const ilk = (['ad', 'telefon', 'eposta', 'gun', 'zaman', 'onay'] as const).find((k) => yeni[k])
      if (ilk) formRef.current?.querySelector<HTMLElement>(`#${CSS.escape(`${uid}-${ilk}`)}`)?.focus()
      return
    }
    const talep = d.talep

    if (!epostaSecili) {
      /* WhatsApp: mesajı ziyaretçi gönderir; burada yalnızca açıyoruz */
      const href = whatsappHref(talep, content)
      window.open(href, '_blank', 'noopener,noreferrer')
      setWaAcildi(href)
      return
    }

    /* Güvenlik doğrulaması bitmeden gönderme: belirteçsiz talebi sunucu reddeder */
    if (!token) {
      setUyari(
        tsState === 'hata'
          ? 'Güvenlik doğrulaması yüklenemedi. Sayfayı yenileyin ya da WhatsApp ile gönderin.'
          : 'Güvenlik doğrulaması tamamlanıyor; birkaç saniye sonra tekrar deneyin.',
      )
      return
    }
    setGonderiliyor(true)
    try {
      await sendByEmail(talep, token, trap)
    } catch (err) {
      setSunucuHatasi(err instanceof Error ? err.message : 'Talebiniz şu an iletilemedi.')
      return
    } finally {
      setGonderiliyor(false)
      /* Belirteç tek kullanımlık: bir sonraki deneme için yenisini üret */
      setTsReset((n) => n + 1)
    }
    setGonderilen(talep)
    if (reduce) {
      setPhase('gonderildi')
      return
    }
    setPhase('katlaniyor')
    timers.current.push(window.setTimeout(() => setPhase('gonderildi'), 2300))
  }

  const reset = () => {
    timers.current.forEach(window.clearTimeout)
    timers.current = []
    setForm(BOS)
    setConsent(false)
    setHatalar({})
    setWaAcildi(null)
    setGonderilen(null)
    setPhase('yazi')
  }

  /* Katlanan kâğıtta görünen özet — canlı alanlar katlanmıyor */
  const summary = (
    <div className="flex h-full flex-col px-7 py-6 text-[#3b2c1d]">
      <p className="font-wordmark text-[1.35rem] leading-none">Randevu talebi</p>
      <p className="mt-1 font-display text-[0.62rem] font-bold tracking-[0.2em] text-[#7a6446] uppercase">
        {doctor.name} · {doctor.titles}
      </p>
      <dl className="mt-5 space-y-2 text-[0.9rem]">
        {[
          ['Ad Soyad', gonderilen?.ad || '—'],
          ['Telefon', gonderilen?.telefon || '—'],
          ['Gün', gonderilen?.gun ?? '—'],
          ['Zaman', gonderilen?.zaman ?? '—'],
        ].map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <dt className="w-24 shrink-0 text-[#7a6446]">{k}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-auto font-display text-[0.6rem] font-bold tracking-[0.2em] text-[#8a765a] uppercase">
        {doctor.phone}
      </p>
    </div>
  )

  const H = 300 // katlanan kâğıdın yüksekliği
  const band = H / 3

  const yaziyor = phase === 'yazi'

  /*
   * İki katman aynı hücrede duruyor. Böylece kâğıt söndüğü anda zarf
   * doğuyor: sıralı giriş-çıkış beklenirse mektup geç açılıp görünmeden
   * sönüyordu. Ayrıca bölüm yüksekliği de zıplamıyor.
   */
  return (
    <div className="relative grid">
      <div
        className={`col-start-1 row-start-1 transition-opacity duration-200 ${
          yaziyor ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
          <form
            ref={formRef}
            onSubmit={send}
            noValidate
            aria-busy={gonderiliyor}
            className="relative overflow-hidden rounded-[3px] shadow-[0_2px_6px_-2px_rgb(12_7_3/0.5),0_30px_64px_-30px_rgb(12_7_3/0.85),inset_0_0_30px_rgb(126_96_52/0.18)]"
            style={{ background: PAPER }}
          >
            <span aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.4] mix-blend-multiply" style={GRAIN} />
            {/* Yılların izi — yazının okunurluğuna dokunmayacak kadar soluk */}
            <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: AGE }} />

            <div className="relative px-6 py-7 sm:px-9 sm:py-9">
              <p className="font-wordmark text-[1.5rem] leading-none text-[#31241a]">
                Randevu talebi
              </p>
              <p className="mt-2 text-[0.9rem] leading-relaxed text-[#6b5334]">
                İletişim bilgilerinizi bırakın; size uygun zamanda dönüş yapılsın. Bu bir randevu
                talebidir, kesin randevu değildir.
              </p>

              <div className="mt-7 grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={`${uid}-ad`} className={labelRow}>
                    Ad Soyad
                  </label>
                  <input
                    {...alan('ad')}
                    required
                    maxLength={SINIR.ad}
                    autoComplete="name"
                    value={form.ad}
                    onChange={(e) => degistir('ad', e.target.value)}
                    placeholder="Adınız ve soyadınız"
                    disabled={gonderiliyor}
                    className={fieldRow}
                  />
                  {hataYaz('ad')}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor={`${uid}-telefon`} className={labelRow}>
                    Telefon
                  </label>
                  <input
                    {...alan('telefon')}
                    required
                    type="tel"
                    inputMode="tel"
                    maxLength={SINIR.telefon}
                    autoComplete="tel"
                    value={form.telefon}
                    onChange={(e) => degistir('telefon', e.target.value)}
                    placeholder="05__ ___ __ __"
                    disabled={gonderiliyor}
                    className={fieldRow}
                  />
                  {hataYaz('telefon')}
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label htmlFor={`${uid}-eposta`} className={labelRow}>
                    E-posta <span className="font-sans font-normal tracking-normal normal-case">(isteğe bağlı)</span>
                  </label>
                  <input
                    {...alan('eposta')}
                    type="email"
                    inputMode="email"
                    maxLength={SINIR.eposta}
                    autoComplete="email"
                    value={form.eposta}
                    onChange={(e) => degistir('eposta', e.target.value)}
                    placeholder="ornek@eposta.com"
                    disabled={gonderiliyor}
                    className={fieldRow}
                  />
                  {hataYaz('eposta')}
                </div>

                {(
                  [
                    ['gun', 'Tercih edilen gün', GUNLER],
                    ['zaman', 'İletişim zamanı', ZAMANLAR],
                  ] as const
                ).map(([k, etiket, secenekler]) => (
                  <div key={k} className="flex flex-col gap-1.5">
                    <label htmlFor={`${uid}-${k}`} className={labelRow}>
                      {etiket}
                    </label>
                    <span className="relative block">
                      <select
                        {...alan(k)}
                        value={form[k]}
                        onChange={(e) => degistir(k, e.target.value)}
                        disabled={gonderiliyor}
                        className={`${fieldRow} paper-select cursor-pointer appearance-none pr-7`}
                      >
                        {secenekler.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                      <ChevronDown
                        aria-hidden
                        className="pointer-events-none absolute top-1/2 right-1 size-4 -translate-y-1/2 text-[#7a6446]"
                      />
                    </span>
                    {hataYaz(k)}
                  </div>
                ))}
              </div>

              {emailAvailable ? (
                <fieldset className="mt-7" disabled={gonderiliyor}>
                  <legend className={labelRow}>Nasıl gönderilsin?</legend>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {(
                      [
                        ['whatsapp', 'WhatsApp ile', 'WhatsApp açılır, hazır mesajı siz gönderirsiniz.'],
                        ['eposta', 'E-posta ile', 'Talebiniz buradan doğrudan e-postayla iletilir.'],
                      ] as const
                    ).map(([v, baslik, aciklama]) => (
                      <label
                        key={v}
                        className={`flex cursor-pointer items-start gap-3 rounded-[3px] border px-3.5 py-3 transition-colors duration-300 ${
                          yontem === v ? 'border-[#6b4a2c]/70 bg-[#6b4a2c]/[0.07]' : 'border-[#6b5334]/25 hover:border-[#6b5334]/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`${uid}-yontem`}
                          value={v}
                          checked={yontem === v}
                          onChange={() => {
                            setYontem(v)
                            setUyari('')
                            setSunucuHatasi('')
                            setWaAcildi(null)
                          }}
                          className="mt-1 size-4 shrink-0 cursor-pointer accent-[#6b4a2c]"
                        />
                        <span className="flex flex-col gap-0.5">
                          <span className="font-display text-[0.92rem] font-bold text-[#31241a]">{baslik}</span>
                          <span className="text-[0.82rem] leading-snug text-[#6b5334]">{aciklama}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : (
                <p className="mt-7 text-[0.86rem] leading-snug text-[#6b5334]">
                  Gönder dediğinizde WhatsApp açılır; hazır mesajı siz gönderirsiniz.
                </p>
              )}

              {/* Tuzak alan: ekran okuyucudan ve klavyeden de gizli */}
              <input
                type="text"
                name="web_sitesi"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
                value={trap}
                onChange={(e) => setTrap(e.target.value)}
                className="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0"
              />

              <div className="mt-7 flex flex-col gap-1.5">
                <label className="flex cursor-pointer items-start gap-3 text-[0.86rem] leading-snug text-[#4a3826]">
                  <input
                    id={`${uid}-onay`}
                    type="checkbox"
                    required
                    checked={consent}
                    aria-invalid={hatalar.onay ? true : undefined}
                    aria-describedby={hatalar.onay ? `${uid}-onay-hata` : undefined}
                    onChange={(e) => {
                      setConsent(e.target.checked)
                      if (e.target.checked) setHatalar((h) => ({ ...h, onay: undefined }))
                    }}
                    disabled={gonderiliyor}
                    className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[#6b4a2c]"
                  />
                  <span>
                    {content.appointment.consentText}
                    {safeLinkUrl(content.appointment.privacyUrl) && (
                      <>
                        {' '}
                        <a
                          href={safeLinkUrl(content.appointment.privacyUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold underline decoration-[#6b4a2c]/40 underline-offset-4 hover:text-[#2a1d12]"
                        >
                          Aydınlatma metni
                        </a>
                      </>
                    )}
                  </span>
                </label>
                {hataYaz('onay')}
              </div>

              {epostaSecili && (
                <Turnstile
                  siteKey={TURNSTILE_SITE_KEY}
                  onToken={(t) => {
                    setToken(t)
                    if (t) setUyari('')
                  }}
                  onState={setTsState}
                  resetKey={tsReset}
                />
              )}

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  disabled={gonderiliyor}
                  aria-busy={gonderiliyor}
                  className="group inline-flex items-center gap-2 rounded-full bg-[#2a1d12] px-7 py-3.5 font-display text-[0.95rem] font-bold text-[#f4ead6] shadow-[0_14px_30px_-16px_rgb(12_7_3/0.9)] transition-colors duration-300 hover:bg-[#3b2a1a] disabled:cursor-wait disabled:opacity-75"
                >
                  {gonderiliyor ? (
                    <>
                      <span
                        aria-hidden
                        className="size-4 animate-spin rounded-full border-2 border-[#f4ead6]/30 border-t-[#f4ead6] motion-reduce:animate-none"
                      />
                      Gönderiliyor…
                    </>
                  ) : epostaSecili ? (
                    <>
                      <Send className="size-4.5" />
                      Zarfa koy ve gönder
                      <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </>
                  ) : (
                    <>
                      <WhatsApp className="size-4.5" />
                      WhatsApp’ta mesajı hazırla
                      <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
                {uyari && (
                  <p role="status" className="max-w-xs text-[0.82rem] leading-snug text-[#7d3a24]">
                    {uyari}
                  </p>
                )}
              </div>

              {sunucuHatasi && (
                <div role="alert" className="mt-5 rounded-[3px] border border-[#9b3b2a]/30 bg-[#9b3b2a]/[0.06] px-4 py-3 text-[0.86rem] leading-snug text-[#6e2a1a]">
                  <p className="font-semibold">Talebiniz iletilemedi.</p>
                  <p className="mt-1">{sunucuHatasi}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setYontem('whatsapp')
                      setSunucuHatasi('')
                    }}
                    className="mt-2 font-display font-bold underline decoration-[#6e2a1a]/40 underline-offset-4"
                  >
                    WhatsApp ile göndermeyi seç
                  </button>
                </div>
              )}

              {waAcildi && !epostaSecili && (
                <div role="status" className="mt-5 rounded-[3px] border border-[#6b5334]/25 bg-[#6b4a2c]/[0.05] px-4 py-3 text-[0.86rem] leading-snug text-[#4a3826]">
                  <p>
                    Mesajınız WhatsApp’ta hazır. <strong>WhatsApp’taki gönder tuşuna basmadan talebiniz bize ulaşmaz.</strong>
                  </p>
                  <a
                    href={waAcildi}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block font-display font-bold underline decoration-[#6b4a2c]/40 underline-offset-4 hover:text-[#2a1d12]"
                  >
                    WhatsApp açılmadıysa buraya dokunun
                  </a>
                </div>
              )}
            </div>
          </form>
      </div>

      <div
        className={`col-start-1 row-start-1 transition-opacity duration-200 ${
          yaziyor ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
        aria-hidden={yaziyor}
      >
          <div className="relative flex h-full min-h-[26rem] flex-col items-center justify-center py-10">
            {/* Katlanan kâğıt */}
            {phase === 'katlaniyor' && (
              <motion.div
                className="relative"
                style={{ perspective: 1000, width: 340, height: H }}
                /*
                  Önce kâğıt okunacak kadar duruyor, sonra katlanıyor, en
                  sonda zarfa iniyor. Sönme yalnızca zarfa girerken.
                */
                animate={{ y: [0, 0, 128], scale: [1, 1, 0.55], opacity: [1, 1, 0] }}
                transition={{
                  y: { duration: 1.9, times: [0, 0.58, 1], ease: [0.16, 1, 0.3, 1] },
                  scale: { duration: 1.9, times: [0, 0.58, 1], ease: [0.16, 1, 0.3, 1] },
                  opacity: { duration: 1.9, times: [0, 0.88, 1] },
                }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute left-0 w-full"
                    style={{
                      top: i * band,
                      height: band,
                      transformStyle: 'preserve-3d',
                      transformOrigin: i === 0 ? 'bottom center' : i === 2 ? 'top center' : 'center',
                    }}
                    animate={i === 2 ? { rotateX: 180 } : i === 0 ? { rotateX: -180 } : { rotateX: 0 }}
                    transition={{ duration: 0.45, delay: i === 2 ? 0.35 : 0.6, ease: [0.4, 0, 0.2, 1] }}
                  >
                    {/* Ön yüz: kâğıdın o şeridi */}
                    <div
                      className="absolute inset-0 overflow-hidden rounded-[2px]"
                      style={{ background: PAPER, backfaceVisibility: 'hidden' }}
                    >
                      <div className="absolute left-0 w-full" style={{ top: -i * band, height: H }}>
                        {summary}
                      </div>
                      <span aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.4] mix-blend-multiply" style={GRAIN} />
                      <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: AGE }} />
                    </div>
                    {/* Arka yüz: boş kâğıt */}
                    <div
                      className="absolute inset-0 rounded-[2px]"
                      style={{
                        background: PAPER,
                        transform: 'rotateX(180deg)',
                        backfaceVisibility: 'hidden',
                        boxShadow: 'inset 0 0 24px rgb(126 96 52 / 0.22)',
                      }}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Zarf */}
            <motion.div
              className="relative"
              style={{ width: 300, height: 190, perspective: 900 }}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: phase === 'gonderildi' ? 0 : 60 }}
              transition={{ duration: 0.6, delay: phase === 'katlaniyor' ? 1.1 : 0, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Gövde */}
              <div
                className="absolute inset-0 rounded-[3px] shadow-[0_2px_6px_-2px_rgb(12_7_3/0.5),0_26px_56px_-28px_rgb(12_7_3/0.85)]"
                style={{
                  background:
                    'linear-gradient(166deg, #e4d4b6 0%, #dbc9a7 52%, #cfbb95 100%)',
                }}
              >
                <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[3px] opacity-[0.45] mix-blend-multiply" style={GRAIN} />
                {/* Alt kapak kıvrımları */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to bottom right, transparent 49.6%, rgb(120 92 52 / 0.16) 50%, transparent 50.4%), linear-gradient(to bottom left, transparent 49.6%, rgb(120 92 52 / 0.16) 50%, transparent 50.4%)',
                  }}
                />
                <span className="absolute inset-x-0 bottom-4 text-center font-display text-[0.6rem] font-bold tracking-[0.24em] text-[#6b5334] uppercase">
                  {doctor.name}
                </span>
              </div>

              {/* Kapak */}
              <motion.div
                className="absolute inset-x-0 top-0 h-[62%] origin-top"
                initial={{ rotateX: -175 }}
                animate={{ rotateX: phase === 'gonderildi' ? 0 : -175 }}
                transition={{ duration: 0.5, delay: phase === 'katlaniyor' ? 1.9 : 0, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  transformStyle: 'preserve-3d',
                  clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                  background: 'linear-gradient(166deg, #eaddc2 0%, #ddcba9 100%)',
                  boxShadow: '0 10px 18px -12px rgb(12 7 3 / 0.7)',
                }}
              />

              {/* Mühür */}
              <motion.span
                className="absolute top-[52%] left-1/2 z-10 grid size-12 -translate-x-1/2 place-items-center rounded-full font-wordmark text-[0.95rem] text-[#f3e3c8]"
                style={{
                  background: 'radial-gradient(circle at 34% 30%, #9c4632, #6f2f20 70%)',
                  boxShadow: '0 3px 8px -2px rgb(12 7 3 / 0.7), inset 0 1px 2px rgb(255 220 200 / 0.35)',
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: phase === 'gonderildi' ? 1 : 0, opacity: phase === 'gonderildi' ? 1 : 0 }}
                transition={{ duration: 0.35, delay: phase === 'katlaniyor' ? 2.3 : 0.18, ease: [0.34, 1.56, 0.64, 1] }}
              >
                UK
              </motion.span>
            </motion.div>

            {/* Onay */}
            <AnimatePresence>
              {phase === 'gonderildi' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                  className="mt-10 text-center"
                >
                  <p className="font-display text-lg font-extrabold text-ivory-50">Zarf kapandı, talebiniz gönderildi.</p>
                  <p className="mx-auto mt-2 max-w-sm text-[0.92rem] leading-relaxed text-ivory-300">
                    Talebiniz e-postayla iletildi. Mesai saatleri içinde {gonderilen?.telefon || 'verdiğiniz numara'}{' '}
                    üzerinden dönüş yapılması planlanır. Birkaç gün içinde dönüş almazsanız lütfen telefonla ya da
                    WhatsApp’tan ulaşın.
                  </p>
                  <button
                    type="button"
                    onClick={reset}
                    className="mt-5 inline-flex items-center gap-2 rounded-full border border-ivory-100/25 px-5 py-2.5 font-display text-[0.85rem] font-bold text-ivory-100 transition-colors duration-300 hover:border-warm-300 hover:text-warm-300"
                  >
                    Yeni talep yaz
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
      </div>
    </div>
  )
}
