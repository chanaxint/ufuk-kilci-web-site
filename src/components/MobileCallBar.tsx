import { motion } from 'motion/react'
import { doctor } from '../lib/content'
import { Phone, WhatsApp } from './ui/icons'

/** Mobilde ekranın altına sabitlenen hızlı iletişim çubuğu. */
export default function MobileCallBar() {
  return (
    <motion.div
      initial={{ y: 90 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-3 bottom-3 z-30 flex items-center gap-2 rounded-full border border-white/80 bg-white/90 p-1.5 shadow-lift backdrop-blur-xl sm:hidden"
    >
      <a
        href={`tel:${doctor.phone.replace(/\s/g, '')}`}
        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink-900 py-3 font-display text-[0.88rem] font-bold text-sand-50"
      >
        <Phone className="size-4" />
        Hemen Ara
      </a>
      <a
        href={doctor.whatsapp}
        target="_blank"
        rel="noreferrer"
        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-vital-600 py-3 font-display text-[0.88rem] font-bold text-white"
      >
        <WhatsApp className="size-4" />
        WhatsApp
      </a>
    </motion.div>
  )
}
