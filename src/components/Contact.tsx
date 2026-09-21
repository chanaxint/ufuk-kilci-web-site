import { useState } from 'react'
import { complaintOptions, doctor, workingHours } from '../lib/content'
import Reveal from './ui/Reveal'
import { ArrowRight, Clock, Instagram, Mail, MapPin, Phone, WhatsApp } from './ui/icons'

const inputClass =
  'w-full rounded-2xl border border-ivory-100/25 bg-transparent px-4 py-3.5 font-sans text-[0.95rem] text-ivory-100 transition-colors duration-300 placeholder:text-ivory-400/70 focus-visible:border-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600'

export default function Contact() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    topic: complaintOptions[0],
    message: '',
  })

  const waHref = () => {
    const text = [
      `Merhaba ${doctor.name},`,
      '',
      `Ad Soyad: ${form.name || '-'}`,
      `Telefon: ${form.phone || '-'}`,
      `Konu: ${form.topic}`,
      form.message ? `Mesaj: ${form.message}` : '',
    ]
      .filter(Boolean)
      .join('\n')
    return `${doctor.whatsapp}?text=${encodeURIComponent(text)}`
  }

  const contactCards = [
    { icon: Phone, label: 'Telefon', value: doctor.phone, href: `tel:${doctor.phone.replace(/\s/g, '')}` },
    { icon: Mail, label: 'E-posta', value: doctor.email, href: `mailto:${doctor.email}` },
    { icon: MapPin, label: 'Klinik', value: doctor.address, href: doctor.mapsUrl },
  ]

  return (
    <section id="iletisim" className="relative scroll-mt-28 py-24 sm:py-28">
      <div className="section-shell">
        <div>
          <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-14">
            {/* Bilgi paneli */}
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-ink-900 via-ink-800 to-brand-700 p-8 shadow-lift sm:p-10 lg:col-span-5">
              <div className="pointer-events-none absolute inset-0 grid-lines opacity-20" />
              <div className="pointer-events-none absolute -right-20 -bottom-24 size-72 rounded-full bg-vital-500/20 blur-3xl" />

              <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 font-display text-[0.68rem] font-bold tracking-[0.18em] text-sand-50 uppercase">
                  <span className="size-1.5 animate-pulse rounded-full bg-vital-300" />
                  Randevu & İletişim
                </span>

                <h2 className="mt-6 font-display text-3xl leading-[1.12] font-extrabold tracking-[-0.02em] text-sand-50 sm:text-4xl">
                  İlk adımı bugün atalım.
                </h2>
                <p className="mt-4 text-[0.98rem] leading-relaxed text-brand-100">
                  Formu doldurun ya da doğrudan arayın. Uygun seans saatleri için aynı gün içinde
                  dönüş yapıyorum.
                </p>

                <div className="mt-8 flex flex-col gap-3">
                  {contactCards.map(({ icon: Icon, label, value, href }) => (
                    <a
                      key={label}
                      href={href}
                      target={label === 'Klinik' ? '_blank' : undefined}
                      rel="noreferrer"
                      className="group flex items-start gap-4 border-b border-white/15 py-4 transition-colors duration-300 last:border-0 hover:border-white/40"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15 text-sand-50">
                        <Icon className="size-4.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-display text-[0.68rem] font-bold tracking-[0.16em] text-brand-200 uppercase">
                          {label}
                        </span>
                        <span className="mt-1 block text-[0.95rem] leading-snug font-medium text-sand-50">
                          {value}
                        </span>
                      </span>
                    </a>
                  ))}
                </div>

                <div className="mt-8 border-t border-white/15 pt-6">
                  <span className="flex items-center gap-2 font-display text-[0.68rem] font-bold tracking-[0.16em] text-brand-200 uppercase">
                    <Clock className="size-4" />
                    Çalışma Saatleri
                  </span>
                  <ul className="mt-4 flex flex-col gap-2.5">
                    {workingHours.map((w) => (
                      <li
                        key={w.day}
                        className="flex items-center justify-between gap-4 text-[0.9rem] text-sand-50/85"
                      >
                        <span>{w.day}</span>
                        <span className="font-display font-bold text-sand-50">{w.hours}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 flex items-center gap-2">
                  <a
                    href={doctor.instagram}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                    className="grid size-11 place-items-center rounded-full border border-white/20 bg-white/10 text-sand-50 transition-colors hover:bg-white/20"
                  >
                    <Instagram className="size-4.5" />
                  </a>
                  <a
                    href={doctor.whatsapp}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="WhatsApp"
                    className="grid size-11 place-items-center rounded-full border border-white/20 bg-white/10 text-sand-50 transition-colors hover:bg-white/20"
                  >
                    <WhatsApp className="size-4.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-7 lg:pt-1">
              <Reveal>
                <h3 className="font-display text-2xl font-extrabold text-ivory-50">Randevu talebi</h3>
                <p className="mt-2 text-[0.95rem] text-ivory-300">
                  Bilgilerinizi doldurun, talebiniz WhatsApp üzerinden hazır mesaj olarak iletilsin.
                </p>
              </Reveal>

              <form
                className="mt-8 grid gap-4 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  window.open(waHref(), '_blank', 'noopener,noreferrer')
                }}
              >
                <label className="flex flex-col gap-2 sm:col-span-1">
                  <span className="font-display text-[0.78rem] font-bold tracking-[0.1em] text-ivory-300 uppercase">
                    Ad Soyad
                  </span>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Adınız ve soyadınız"
                    className={inputClass}
                  />
                </label>

                <label className="flex flex-col gap-2 sm:col-span-1">
                  <span className="font-display text-[0.78rem] font-bold tracking-[0.1em] text-ivory-300 uppercase">
                    Telefon
                  </span>
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="05__ ___ __ __"
                    className={inputClass}
                  />
                </label>

                <label className="flex flex-col gap-2 sm:col-span-2">
                  <span className="font-display text-[0.78rem] font-bold tracking-[0.1em] text-ivory-300 uppercase">
                    Şikâyet konusu
                  </span>
                  <select
                    value={form.topic}
                    onChange={(e) => setForm({ ...form, topic: e.target.value })}
                    className={inputClass}
                  >
                    {complaintOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-2 sm:col-span-2">
                  <span className="font-display text-[0.78rem] font-bold tracking-[0.1em] text-ivory-300 uppercase">
                    Kısaca anlatın
                  </span>
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Şikâyetiniz ne zaman başladı, hangi hareketlerde artıyor?"
                    className={`${inputClass} resize-none`}
                  />
                </label>

                <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
                  <button
                    type="submit"
                    className="group inline-flex items-center gap-2 rounded-full bg-ivory-50 px-7 py-3.5 font-display text-[0.95rem] font-bold text-ink-900 shadow-[0_18px_40px_-18px_rgb(10_6_3/0.9)] transition-colors duration-300 hover:bg-warm-100"
                  >
                    <WhatsApp className="size-4.5" />
                    WhatsApp ile gönder
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </button>
                  <p className="text-[0.78rem] leading-snug text-ivory-300">
                    Bilgileriniz yalnızca randevu planlaması için kullanılır.
                  </p>
                </div>
              </form>

              <div className="mt-9 grid gap-3 border-t border-ivory-100/18 pt-7 sm:grid-cols-3">
                {[
                  { title: 'Aynı gün dönüş', text: 'Mesai saatleri içinde yanıt' },
                  { title: 'Ücretsiz ön görüşme', text: '10 dakikalık telefon değerlendirmesi' },
                  { title: 'Kolay ulaşım', text: 'Metro ve otoparka yakın konum' },
                ].map((item) => (
                  <div key={item.title}>
                    <p className="flex items-center gap-2 font-display text-[0.9rem] font-bold text-ivory-50">
                      <span className="size-1.5 rounded-full bg-vital-500" />
                      {item.title}
                    </p>
                    <p className="mt-1.5 text-[0.78rem] leading-snug text-ivory-300">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
