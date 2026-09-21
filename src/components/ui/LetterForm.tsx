import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { complaintOptions, doctor } from '../../lib/content'
import {
  hasEndpoint,
  sendAppointment,
  whatsappHref,
  type AppointmentForm as Form,
} from '../../lib/appointment'
import { ArrowRight, Send } from './icons'

/* Kâğıdın ve zarfın ortak sıcak tonu */
const PAPER = `radial-gradient(70% 55% at 18% 10%, rgb(255 251 240 / 0.9), transparent 66%),
  radial-gradient(55% 45% at 86% 88%, rgb(198 168 118 / 0.16), transparent 72%),
  linear-gradient(168deg, #f7efdd 0%, #f1e7d2 55%, #e9dcc3 100%)`

const GRAIN = { backgroundImage: 'url(/images/doku.png)', backgroundRepeat: 'repeat' as const }

/** Kâğıdın üzerindeki çizgili alan — deftere yazar gibi */
const RULED =
  'repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, rgb(107 83 52 / 0.18) 27px, rgb(107 83 52 / 0.18) 28px)'

const fieldRow =
  'w-full border-0 border-b border-[#6b5334]/35 bg-transparent px-1 pt-1 pb-1.5 font-sans text-[0.98rem] text-[#3b2c1d] outline-none transition-colors duration-300 placeholder:text-[#9a866a] focus:border-[#6b4a2c]'

const labelRow =
  'font-display text-[0.7rem] font-bold tracking-[0.16em] text-[#7a6446] uppercase'

/**
 * Randevu talebi — mektup ve zarf.
 *
 * Form gerçek bir kâğıt: alanlar kâğıdın üzerine çizilmiş satırlar. Gönder
 * denince kullanıcı siteden çıkmıyor — talep arka planda uç noktaya
 * gönderiliyor, kâğıt önce alttan sonra üstten katlanıp zarfa giriyor,
 * kapak kapanıyor ve mühür basılıyor.
 *
 * Animasyon işin önüne geçmiyor: alanlar normal form alanları, klavyeyle
 * gezilebiliyor; "azaltılmış hareket" tercihinde katlanma atlanıp doğrudan
 * kapalı zarf gösteriliyor.
 */
export default function LetterForm() {
  const [form, setForm] = useState<Form>({
    name: '',
    phone: '',
    topic: complaintOptions[0],
    message: '',
  })
  const [phase, setPhase] = useState<'yazi' | 'katlaniyor' | 'gonderildi'>('yazi')
  /** 'iletildi' uç noktaya ulaştı · 'hazir' uç nokta yok · 'hata' denendi olmadı */
  const [sonuc, setSonuc] = useState<'iletildi' | 'hazir' | 'hata'>('hazir')
  const timers = useRef<number[]>([])
  const reduce = useReducedMotion()

  const waHref = useMemo(() => whatsappHref(form), [form])

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    /* Kullanıcı sitede kalıyor; talep arka planda gidiyor */
    setSonuc('hazir')
    if (hasEndpoint) {
      sendAppointment(form)
        .then((ok) => setSonuc(ok ? 'iletildi' : 'hazir'))
        .catch(() => setSonuc('hata'))
    }
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
    setForm({ name: '', phone: '', topic: complaintOptions[0], message: '' })
    setPhase('yazi')
  }

  /* Katlanan kâğıtta görünen özet — canlı alanlar katlanmıyor */
  const summary = (
    <div className="flex h-full flex-col px-7 py-6 text-[#3b2c1d]">
      <p className="font-wordmark text-[1.35rem] leading-none">Randevu talebi</p>
      <p className="mt-1 font-display text-[0.62rem] font-bold tracking-[0.2em] text-[#7a6446] uppercase">
        {doctor.name} · Fizyoterapist - Osteopat
      </p>
      <dl className="mt-5 space-y-2 text-[0.9rem]">
        {[
          ['Ad Soyad', form.name || '—'],
          ['Telefon', form.phone || '—'],
          ['Konu', form.topic],
        ].map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <dt className="w-24 shrink-0 text-[#7a6446]">{k}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      {form.message && (
        <p className="mt-4 line-clamp-3 text-[0.88rem] leading-relaxed text-[#4a3826]">
          {form.message}
        </p>
      )}
      <p className="mt-auto font-display text-[0.6rem] font-bold tracking-[0.2em] text-[#8a765a] uppercase">
        {doctor.phone} · Nevşehir
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
            onSubmit={send}
            className="relative overflow-hidden rounded-[3px] shadow-[0_2px_6px_-2px_rgb(12_7_3/0.5),0_30px_64px_-30px_rgb(12_7_3/0.85),inset_0_0_30px_rgb(126_96_52/0.18)]"
            style={{ background: PAPER }}
          >
            <span aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.4] mix-blend-multiply" style={GRAIN} />

            <div className="relative px-6 py-7 sm:px-9 sm:py-9">
              <p className="font-wordmark text-[1.5rem] leading-none text-[#31241a]">
                Randevu talebi
              </p>
              <p className="mt-2 text-[0.9rem] leading-relaxed text-[#6b5334]">
                Bilgilerinizi yazın; gönderdiğinizde talebiniz doğrudan iletilir.
                Siteden ayrılmanıza gerek yok.
              </p>

              <div className="mt-7 grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className={labelRow}>Ad Soyad</span>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Adınız ve soyadınız"
                    className={fieldRow}
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className={labelRow}>Telefon</span>
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="05__ ___ __ __"
                    className={fieldRow}
                  />
                </label>

                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className={labelRow}>Şikâyet konusu</span>
                  <select
                    value={form.topic}
                    onChange={(e) => setForm({ ...form, topic: e.target.value })}
                    className={fieldRow}
                  >
                    {complaintOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-2 sm:col-span-2">
                  <span className={labelRow}>Kısaca anlatın</span>
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Şikâyetiniz ne zaman başladı, hangi hareketlerde artıyor?"
                    className="w-full resize-none rounded-[2px] border border-[#6b5334]/25 bg-transparent px-3 py-2 font-sans text-[0.95rem] leading-7 text-[#3b2c1d] outline-none transition-colors duration-300 placeholder:text-[#9a866a] focus:border-[#6b4a2c]"
                    style={{ backgroundImage: RULED, backgroundPosition: '0 6px' }}
                  />
                </label>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  className="group inline-flex items-center gap-2 rounded-full bg-[#2a1d12] px-7 py-3.5 font-display text-[0.95rem] font-bold text-[#f4ead6] shadow-[0_14px_30px_-16px_rgb(12_7_3/0.9)] transition-colors duration-300 hover:bg-[#3b2a1a]"
                >
                  <Send className="size-4.5" />
                  Zarfa koy ve gönder
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </button>
                <p className="text-[0.78rem] leading-snug text-[#6b5334]">
                  Bilgileriniz yalnızca randevu planlaması için kullanılır.
                </p>
              </div>
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
                  <p className="font-display text-lg font-extrabold text-ivory-50">
                    {sonuc === 'iletildi' ? 'Zarf kapandı, talebiniz iletildi.' : 'Zarf kapandı.'}
                  </p>
                  <p className="mt-2 text-[0.92rem] leading-relaxed text-ivory-300">
                    {sonuc === 'iletildi' ? (
                      <>
                        Talebiniz {doctor.name}'ya ulaştı. Mesai saatleri içinde
                        {' '}
                        {form.phone || 'verdiğiniz numara'} üzerinden dönüş yapılacak.
                      </>
                    ) : (
                      <>
                        Talebiniz hazırlandı. Dilerseniz aynı bilgileri
                        <a
                          href={waHref}
                          target="_blank"
                          rel="noreferrer"
                          className="mx-1 underline decoration-warm-300/60 underline-offset-4 hover:text-warm-300"
                        >
                          WhatsApp üzerinden
                        </a>
                        da iletebilirsiniz.
                      </>
                    )}
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
