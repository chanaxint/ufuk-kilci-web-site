import { doctor, navLinks } from '../lib/content'
import ShinyText from './reactbits/ShinyText'
import { ArrowRight, Instagram, Mail, Phone, WhatsApp } from './ui/icons'

/**
 * Alt bilgi.
 *
 * Burada eskiden tam genişlikte koyu kahve bir blok vardı: sayfanın geri
 * kalanı ahşap zeminin üstünde dururken alt bilgi zemini kapatıp ayrı bir
 * kutu gibi duruyordu. Artık zemin sonuna kadar görünüyor; bölümü ayıran
 * tek şey sitenin her yerinde kullanılan ince çizgi ve en alta doğru
 * koyulaşan yumuşak bir perde (yazılar okunsun diye).
 */
export default function Footer() {
  return (
    <footer className="relative mt-10 text-ivory-200">
      {/* Zemine doğru koyulaşan perde — blok değil, geçiş */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, transparent, rgb(26 16 9 / 0.55))',
        }}
      />

      <div className="section-shell relative">
        <div className="rule" />
      </div>

      <div className="section-shell relative py-16 pb-28 sm:py-20 sm:pb-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="font-wordmark text-4xl leading-tight font-normal tracking-[-0.01em] sm:text-5xl">
              <ShinyText text={doctor.name} speed={6} color="#e6d3bf" shineColor="#ffffff" spread={100} />
            </p>
            <p className="mt-2 font-display text-[0.72rem] font-bold tracking-[0.28em] text-warm-200 uppercase">
              {doctor.titles}
            </p>
            <p className="mt-6 max-w-sm text-[0.95rem] leading-relaxed text-ivory-300">
              {doctor.shortBio}
            </p>

            <div className="mt-7 flex items-center gap-2">
              {[
                { href: doctor.whatsapp, icon: WhatsApp, label: 'WhatsApp' },
                { href: doctor.instagram, icon: Instagram, label: 'Instagram' },
                { href: `mailto:${doctor.email}`, icon: Mail, label: 'E-posta' },
                { href: `tel:${doctor.phone.replace(/\s/g, '')}`, icon: Phone, label: 'Telefon' },
              ].map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noreferrer"
                  className="grid size-11 place-items-center rounded-full border border-ivory-100/20 text-ivory-100 transition-colors duration-300 hover:border-warm-300/70 hover:text-warm-200"
                >
                  <Icon className="size-4.5" />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            <p className="font-display text-[0.7rem] font-bold tracking-[0.2em] text-ivory-300 uppercase">
              Sayfalar
            </p>
            <ul className="mt-5 flex flex-col gap-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="group inline-flex items-center gap-2 text-[0.95rem] text-ivory-200 transition-colors duration-300 hover:text-warm-200"
                  >
                    <ArrowRight className="size-3.5 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-4">
            <p className="font-display text-[0.7rem] font-bold tracking-[0.2em] text-ivory-300 uppercase">
              Klinik
            </p>
            <p className="mt-5 text-[0.95rem] leading-relaxed text-ivory-200">{doctor.address}</p>
            <a
              href="#iletisim"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-ivory-50 px-6 py-3 font-display text-[0.9rem] font-bold text-ink-900 transition-transform duration-300 hover:-translate-y-0.5"
            >
              Randevu Al <ArrowRight className="size-4" />
            </a>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-ivory-100/14 pt-7 text-[0.82rem] text-ivory-300 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {doctor.name}. Tüm hakları saklıdır.</p>
          <p className="max-w-xl sm:text-right">
            Bu sitedeki içerikler bilgilendirme amaçlıdır; tıbbi teşhis ve tedavi yerine geçmez.
          </p>
        </div>
      </div>
    </footer>
  )
}
