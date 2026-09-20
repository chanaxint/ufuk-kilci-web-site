import { useEffect, useState } from 'react'
import { motion, useMotionValueEvent, useScroll } from 'motion/react'
import { doctor, navLinks } from '../lib/content'
import GooeyNav from './reactbits/GooeyNav'
import { StaggeredMenu } from './reactbits/StaggeredMenu'
import ShinyText from './reactbits/ShinyText'
import { ArrowRight, Menu, Phone } from './ui/icons'

export default function Navbar() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 40))

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-x-0 top-0 z-50"
      >
        <div
          className={`mx-auto mt-3 flex w-[min(82rem,calc(100%-1.5rem))] items-center justify-between rounded-full border px-3 py-2.5 transition-all duration-500 sm:px-4 ${
            scrolled
              ? 'border-white/30 bg-white/14 shadow-[0_2px_10px_-6px_rgb(58_42_28/0.16),0_16px_40px_-30px_rgb(58_42_28/0.3)] backdrop-blur-md'
              : 'border-transparent bg-transparent'
          }`}
        >
          <a href="#top" className="group flex items-center gap-3 pl-1.5">
            <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-ink-900 to-brand-700 font-display text-sm font-extrabold text-sand-50 shadow-[0_10px_24px_-12px_rgb(58_42_28/0.9)]">
              UK
            </span>
            <span className="flex flex-col leading-none">
              <ShinyText
                text={doctor.name}
                speed={5}
                color="#34261a"
                shineColor="#c49466"
                spread={90}
                className="font-display text-[0.98rem] font-extrabold tracking-[-0.01em] whitespace-nowrap"
              />
              <span className="mt-1 hidden font-display text-[0.62rem] font-semibold tracking-[0.2em] whitespace-nowrap text-ink-600 uppercase sm:block">
                {doctor.titles}
              </span>
            </span>
          </a>

          {/*
            Gooey efekti, bulanıklık + kontrast filtresiyle çalıştığı için altında
            opak bir zemin ister. Bağlantılar bu yüzden kendi ince şeridinde durur;
            --gooey-bg şeridin rengiyle aynı tutulur.
          */}
          <nav
            className="isolate hidden rounded-full bg-[#d9d1c3] px-1 py-0.5 lg:block"
            style={{ ['--gooey-bg' as string]: '#d9d1c3' }}
          >
            <GooeyNav items={navLinks.map((l) => ({ label: l.label, href: l.href }))} />
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${doctor.phone.replace(/\s/g, '')}`}
              className="hidden items-center gap-2 rounded-full border border-white/35 bg-white/18 px-4 py-2.5 font-display text-[0.85rem] font-semibold text-ink-700 backdrop-blur-sm transition-colors hover:border-brand-400 hover:text-brand-700 sm:inline-flex"
            >
              <Phone className="size-4" />
              {doctor.phone}
            </a>
            <a
              href="#iletisim"
              className="group hidden items-center gap-2 rounded-full bg-ink-900 px-5 py-2.5 font-display text-[0.88rem] font-bold whitespace-nowrap text-sand-50 shadow-[0_14px_30px_-16px_rgb(58_42_28/0.9)] transition-colors hover:bg-brand-700 sm:inline-flex"
            >
              Randevu Al
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </a>
            <button
              type="button"
              aria-label={open ? 'Menüyü kapat' : 'Menüyü aç'}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="relative z-[60] grid size-11 place-items-center rounded-full border border-white/35 bg-white/18 text-ink-800 backdrop-blur-sm lg:hidden"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobil menü — React Bits StaggeredMenu */}
      <div className="lg:hidden">
        <StaggeredMenu
          isFixed
          showHeader={false}
          controlledOpen={open}
          position="right"
          colors={['#e6d3bf', '#c49466']}
          accentColor="#8a5a33"
          items={navLinks.map((l) => ({ label: l.label, ariaLabel: l.label, link: l.href }))}
          socialItems={[
            { label: 'WhatsApp', link: doctor.whatsapp },
            { label: 'Instagram', link: doctor.instagram },
            { label: 'Randevu', link: '#iletisim' },
          ]}
          displayItemNumbering
          closeOnClickAway
          onMenuClose={() => setOpen(false)}
        />
      </div>
    </>
  )
}
