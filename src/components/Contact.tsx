import { doctor, workingHours } from '../lib/content'
import Reveal from './ui/Reveal'
import { Clock, Instagram, Mail, MapPin, Phone, WhatsApp } from './ui/icons'
import LetterForm from './ui/LetterForm'

export default function Contact() {
  const contactCards = [
    { icon: Phone, label: 'Telefon', value: doctor.phone, href: `tel:${doctor.phone.replace(/\s/g, '')}` },
    { icon: Mail, label: 'E-posta', value: doctor.email, href: `mailto:${doctor.email}` },
    { icon: MapPin, label: 'Klinik', value: doctor.address, href: doctor.mapsUrl },
    {
      icon: Instagram,
      label: 'Instagram',
      value: doctor.instagramHandle,
      href: doctor.instagram,
    },
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

            {/* Randevu mektubu — eski form tasarımının yerine */}
            <div className="lg:col-span-7 lg:pt-1">
              <Reveal>
                <LetterForm />
              </Reveal>

              <div className="mt-9 grid gap-3 border-t border-ivory-100/18 pt-7 sm:grid-cols-3">
                {[
                  { title: 'Aynı gün dönüş', text: 'Mesai saatleri içinde yanıt' },
                  { title: 'Ön değerlendirme', text: 'Telefonda kısa bilgilendirme' },
                  { title: 'Merkezî konum', text: 'Nevşehir merkez, İŞKUR yanı' },
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
