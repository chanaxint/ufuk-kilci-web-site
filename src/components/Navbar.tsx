import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { doctor, navLinks } from '../lib/content'
import GooeyNav from './reactbits/GooeyNav'
import { StaggeredMenu } from './reactbits/StaggeredMenu'
import ShinyText from './reactbits/ShinyText'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const sideLink =
    'font-display text-[0.78rem] font-semibold tracking-[0.16em] whitespace-nowrap text-ink-600 uppercase transition-colors duration-300 hover:text-brand-700'

  return (
    <>
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-none fixed inset-x-0 top-0 z-50"
      >
        <div className="relative flex items-center justify-center px-5 py-5 sm:px-8 sm:py-6">
          <div className="pointer-events-auto relative flex items-center gap-10 xl:gap-14">
            {/*
              Omurga ya da yorum spirali başlığın altından geçtiğinde okunurluğu
              korumak için yumuşak bir bulanıklık lekesi. Radyal maske sayesinde
              kenarı yok; boş duvarda hiç görünmüyor.
            */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -inset-x-32 -inset-y-9 -z-10 backdrop-blur-[8px] [-webkit-mask-image:radial-gradient(60%_64%_at_50%_50%,black_42%,transparent_88%)] [mask-image:radial-gradient(60%_64%_at_50%_50%,black_42%,transparent_88%)]"
            />

            <a href="#hakkimda" className={`hidden lg:block ${sideLink}`}>
              Hakkımda
            </a>

            <a href="#top" className="group relative flex flex-col items-center leading-none">
              <ShinyText
                text={doctor.name}
                speed={5}
                color="#3b2b1d"
                shineColor="#c49466"
                spread={90}
                className="font-wordmark text-[1.55rem] leading-none font-normal tracking-[0.004em] whitespace-nowrap sm:text-[1.85rem]"
              />
              <span className="mt-1.5 font-display text-[0.56rem] font-semibold tracking-[0.3em] whitespace-nowrap text-ink-600 uppercase sm:text-[0.62rem]">
                {doctor.titles}
              </span>
            </a>

            <a href="#iletisim" className={`hidden lg:block ${sideLink}`}>
              İletişim
            </a>
          </div>

          {/* İki çizgi; açıkken çarpıya dönüyor */}
          <button
            type="button"
            aria-label={open ? 'Menüyü kapat' : 'Menüyü aç'}
            aria-expanded={open}
            aria-controls="staggered-menu-panel"
            onClick={() => setOpen((v) => !v)}
            className="pointer-events-auto absolute right-5 z-[60] grid size-11 place-items-center rounded-full text-ink-800 transition-colors duration-300 hover:text-brand-700 sm:right-8"
          >
            <span className="relative block h-3.5 w-7">
              <span
                className={`absolute left-0 block h-[2px] w-full rounded-full bg-current transition-all duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  open ? 'top-1/2 -translate-y-1/2 rotate-45' : 'top-0 rotate-0'
                }`}
              />
              <span
                className={`absolute left-0 block h-[2px] w-full rounded-full bg-current transition-all duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  open ? 'top-1/2 -translate-y-1/2 -rotate-45' : 'top-full -translate-y-full rotate-0'
                }`}
              />
            </span>
          </button>
        </div>
      </motion.header>

      {/* Tüm navigasyon burada — React Bits StaggeredMenu + dikey GooeyNav */}
      <StaggeredMenu
        isFixed
        showHeader={false}
        controlledOpen={open}
        position="right"
        colors={['#e6d3bf', '#c49466']}
        accentColor="#8a5a33"
        items={navLinks.map((l) => ({ label: l.label, ariaLabel: l.label, link: l.href }))}
        panelContent={
          <GooeyNav
            orientation="vertical"
            items={navLinks.map((l) => ({ label: l.label, href: l.href }))}
            itemClassName="sm-panel-itemWrap"
            labelClassName="sm-panel-itemLabel"
            /* Damla efekti tamamlansın diye kapanış hafif gecikmeli */
            onItemClick={() => window.setTimeout(() => setOpen(false), 420)}
          />
        }
        socialItems={[
          { label: doctor.phone, link: `tel:${doctor.phone.replace(/\s/g, '')}` },
          { label: 'WhatsApp', link: doctor.whatsapp },
          { label: 'Instagram', link: doctor.instagram },
          { label: 'Randevu Al', link: '#iletisim' },
        ]}
        closeOnClickAway
        onMenuClose={() => setOpen(false)}
      />
    </>
  )
}
