import { doctor, navLinks } from '../lib/content'
import ShinyText from './reactbits/ShinyText'
import { ArrowRight, Instagram, Mail, Phone, WhatsApp } from './ui/icons'

export default function Footer() {
  return (
    <footer className="relative mt-10 overflow-hidden bg-ink-950 text-sand-50">
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-10" />
      <div className="pointer-events-none absolute -top-32 left-1/2 size-[42rem] -translate-x-1/2 rounded-full bg-brand-700/25 blur-3xl" />

      <div className="section-shell relative py-16 pb-28 sm:py-20 sm:pb-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-vital-600 font-display text-base font-extrabold text-sand-50">
              UK
            </span>
            <p className="mt-6 font-wordmark text-4xl leading-tight font-normal tracking-[-0.01em] sm:text-5xl">
              <ShinyText text={doctor.name} speed={6} color="#e6d3bf" shineColor="#ffffff" spread={100} />
            </p>
            <p className="mt-2 font-display text-[0.72rem] font-bold tracking-[0.28em] text-brand-200 uppercase">
              {doctor.titles}
            </p>
            <p className="mt-6 max-w-sm text-[0.95rem] leading-relaxed text-sand-50/65">
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
                  className="grid size-11 place-items-center rounded-full border border-white/15 bg-white/5 text-sand-50 transition-colors hover:border-white/35 hover:bg-white/15"
                >
                  <Icon className="size-4.5" />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            <p className="font-display text-[0.7rem] font-bold tracking-[0.2em] text-sand-50/45 uppercase">
              Sayfalar
            </p>
            <ul className="mt-5 flex flex-col gap-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="group inline-flex items-center gap-2 text-[0.95rem] text-sand-50/75 transition-colors hover:text-sand-50"
                  >
                    <ArrowRight className="size-3.5 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-4">
            <p className="font-display text-[0.7rem] font-bold tracking-[0.2em] text-sand-50/45 uppercase">
              Klinik
            </p>
            <p className="mt-5 text-[0.95rem] leading-relaxed text-sand-50/75">{doctor.address}</p>
            <a
              href="#iletisim"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-sand-50 px-6 py-3 font-display text-[0.9rem] font-bold text-ink-900 transition-transform duration-300 hover:-translate-y-0.5"
            >
              Randevu Al <ArrowRight className="size-4" />
            </a>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-7 text-[0.82rem] text-sand-50/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {doctor.name}. Tüm hakları saklıdır.</p>
          <p className="max-w-xl sm:text-right">
            Bu sitedeki içerikler bilgilendirme amaçlıdır; tıbbi teşhis ve tedavi yerine geçmez.
          </p>
        </div>
      </div>
    </footer>
  )
}
