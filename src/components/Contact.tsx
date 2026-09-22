import { doctor, workingHours } from '../lib/content'
import Reveal from './ui/Reveal'
import { Clock, Instagram, Mail, MapPin, Phone, WhatsApp } from './ui/icons'
import LetterForm from './ui/LetterForm'
import { GRAIN, PAPER } from '../lib/paper'

/**
 * Randevu ve iletişim.
 *
 * İki sayfa yan yana: solda kliniğin bilgilerinin yazılı olduğu kâğıt,
 * sağda doldurulup zarfa giren mektup. İkisi de aynı kâğıt dokusundan
 * çıkıyor; ahşap zeminin üstüne bırakılmış iki belge gibi duruyorlar.
 */
export default function Contact() {
  const contactCards = [
    {
      icon: Phone,
      label: 'Telefon',
      value: doctor.phone,
      href: `tel:${doctor.phone.replace(/\s/g, '')}`,
    },
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
        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-14">
          {/* Bilgi sayfası — kliniğin künyesi kâğıda yazılmış gibi */}
          <Reveal className="lg:col-span-5">
            <div
              className="relative overflow-hidden rounded-[3px] shadow-[0_2px_6px_-2px_rgb(12_7_3/0.5),0_30px_64px_-30px_rgb(12_7_3/0.85),inset_0_0_30px_rgb(126_96_52/0.18)]"
              style={{ background: PAPER, transform: 'rotate(-0.5deg)' }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.4] mix-blend-multiply"
                style={GRAIN}
              />
              {/* Zamanla sararan kenar */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(120% 90% at 50% 45%, transparent 58%, rgb(140 105 58 / 0.16) 100%)',
                }}
              />

              <div className="relative px-7 py-8 sm:px-9 sm:py-10">
                <h2 className="font-wordmark text-[2rem] leading-[1.1] text-[#31241a] sm:text-[2.3rem]">
                  İlk adımı bugün atalım.
                </h2>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-[#6b5334]">
                  Formu doldurun ya da doğrudan arayın. Uygun seans saatleri için aynı gün
                  içinde dönüş yapıyorum.
                </p>

                <div className="mt-7 flex flex-col">
                  {contactCards.map(({ icon: Icon, label, value, href }) => (
                    <a
                      key={label}
                      href={href}
                      target={label === 'Klinik' ? '_blank' : undefined}
                      rel="noreferrer"
                      className="group flex items-start gap-4 border-b border-[#6b5334]/25 py-4 transition-colors duration-300 last:border-0 hover:border-[#6b4a2c]/60"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-full border border-[#6b5334]/30 text-[#6b4a2c] transition-colors duration-300 group-hover:border-[#6b4a2c]/70">
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-display text-[0.66rem] font-bold tracking-[0.18em] text-[#7a6446] uppercase">
                          {label}
                        </span>
                        <span className="mt-1 block text-[0.95rem] leading-snug font-medium text-[#3b2c1d]">
                          {value}
                        </span>
                      </span>
                    </a>
                  ))}
                </div>

                <div className="mt-7 border-t border-[#6b5334]/30 pt-6">
                  <span className="flex items-center gap-2 font-display text-[0.66rem] font-bold tracking-[0.18em] text-[#7a6446] uppercase">
                    <Clock className="size-4" />
                    Çalışma Saatleri
                  </span>
                  <ul className="mt-4 flex flex-col gap-2.5">
                    {workingHours.map((w) => (
                      <li
                        key={w.day}
                        className="flex items-baseline justify-between gap-4 text-[0.9rem] text-[#5c4831]"
                      >
                        <span>{w.day}</span>
                        {/* Aradaki noktalar: elle doldurulmuş bir çizelge gibi */}
                        <span
                          aria-hidden
                          className="h-px min-w-6 flex-1 translate-y-[-0.15rem]"
                          style={{
                            backgroundImage:
                              'radial-gradient(circle, rgb(107 83 52 / 0.45) 0.5px, transparent 0.6px)',
                            backgroundSize: '5px 1px',
                            backgroundRepeat: 'repeat-x',
                          }}
                        />
                        <span className="font-display font-bold text-[#3b2c1d]">{w.hours}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href={doctor.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-7 inline-flex items-center gap-2 rounded-full border border-[#6b5334]/35 px-4 py-2.5 font-display text-[0.82rem] font-bold text-[#4a3826] transition-colors duration-300 hover:border-[#6b4a2c] hover:bg-[#6b4a2c]/8"
                >
                  <WhatsApp className="size-4" />
                  WhatsApp'tan yazın
                </a>
              </div>
            </div>
          </Reveal>

          {/* Randevu mektubu */}
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
    </section>
  )
}
