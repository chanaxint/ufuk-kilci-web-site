import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { doctor, navLinks } from '../lib/content'
import { ArrowRight, Close, Menu, Phone } from './ui/icons'

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
              ? 'border-white/45 bg-white/30 shadow-[0_2px_10px_-4px_rgb(48_38_24/0.18),0_16px_40px_-28px_rgb(48_38_24/0.35)] backdrop-blur-md'
              : 'border-transparent bg-transparent'
          }`}
        >
          <a href="#top" className="group flex items-center gap-3 pl-1.5">
            <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-ink-900 to-brand-700 font-display text-sm font-extrabold text-sand-50 shadow-[0_10px_24px_-12px_rgb(58_42_28/0.9)]">
              UK
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-[0.98rem] font-extrabold tracking-[-0.01em] whitespace-nowrap text-ink-900">
                {doctor.name}
              </span>
              <span className="mt-1 hidden font-display text-[0.62rem] font-semibold tracking-[0.2em] whitespace-nowrap text-ink-600 uppercase sm:block">
                {doctor.titles}
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative rounded-full px-4 py-2 font-display text-[0.9rem] font-semibold text-ink-600 transition-colors duration-300 hover:text-ink-900"
              >
                <span className="relative z-10">{link.label}</span>
                <span className="absolute inset-0 scale-90 rounded-full bg-white/55 opacity-0 transition-all duration-300 hover:scale-100 hover:opacity-100" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${doctor.phone.replace(/\s/g, '')}`}
              className="hidden items-center gap-2 rounded-full border border-ink-200/80 bg-white/76 px-4 py-2.5 font-display text-[0.85rem] font-semibold text-ink-700 transition-colors hover:border-brand-400 hover:text-brand-700 sm:inline-flex"
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
              aria-label="Menüyü aç"
              onClick={() => setOpen(true)}
              className="grid size-11 place-items-center rounded-full border border-white/35 bg-white/18 text-ink-800 backdrop-blur-sm lg:hidden"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-ink-900/40 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          >
            <motion.nav
              initial={{ y: '-100%' }}
              animate={{ y: 0 }}
              exit={{ y: '-100%' }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-b-[2rem] bg-sand-50 px-6 pt-6 pb-10 shadow-lift"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-[0.68rem] font-bold tracking-[0.24em] text-ink-500 uppercase">
                  Menü
                </span>
                <button
                  type="button"
                  aria-label="Menüyü kapat"
                  onClick={() => setOpen(false)}
                  className="grid size-11 place-items-center rounded-full border border-ink-200 bg-white text-ink-800"
                >
                  <Close className="size-5" />
                </button>
              </div>
              <ul className="mt-6 flex flex-col">
                {navLinks.map((link, i) => (
                  <motion.li
                    key={link.href}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="border-b border-ink-200/60 last:border-0"
                  >
                    <a
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between py-4 font-display text-2xl font-bold text-ink-900"
                    >
                      {link.label}
                      <ArrowRight className="size-5 text-ink-300" />
                    </a>
                  </motion.li>
                ))}
              </ul>
              <a
                href="#iletisim"
                onClick={() => setOpen(false)}
                className="mt-7 flex items-center justify-center gap-2 rounded-full bg-ink-900 py-4 font-display font-bold text-sand-50"
              >
                Randevu Al <ArrowRight className="size-4" />
              </a>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
