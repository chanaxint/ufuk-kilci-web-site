import { motion, useScroll, useSpring } from 'motion/react'

/** Sayfanın üst kenarında ilerlemeyi gösteren ince çizgi. */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 })

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[70] h-[3px] origin-left bg-gradient-to-r from-brand-600 via-brand-500 to-vital-500"
    />
  )
}
