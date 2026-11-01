import { motion } from 'motion/react'
import { useContent } from '../lib/ContentContext'
import { telHref, waHref } from '../lib/siteContent'
import { Phone, WhatsApp } from './ui/icons'

/** Mobilde ekranın altına sabitlenen hızlı iletişim çubuğu. */
export default function MobileCallBar() {
  const content = useContent()
  return (
    <motion.div
      initial={{ y: 90 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
      className="sahne-silinen fixed inset-x-3 bottom-3 z-30 flex items-center gap-2.5 sm:hidden"
      style={{ opacity: 'calc(1 - var(--stage-dark, 0))' }}
    >
      <a
        href={telHref(content.doctor.phone)}
        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink-900 py-3.5 font-display text-[0.88rem] font-bold text-sand-50 shadow-[0_14px_30px_-16px_rgb(58_42_28/0.9)]"
      >
        <Phone className="size-4" />
        Hemen Ara
      </a>
      <a
        href={waHref(content)}
        target="_blank"
        rel="noreferrer"
        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-vital-600 py-3.5 font-display text-[0.88rem] font-bold text-white shadow-[0_14px_30px_-16px_rgb(58_42_28/0.9)]"
      >
        <WhatsApp className="size-4" />
        WhatsApp
      </a>
    </motion.div>
  )
}
