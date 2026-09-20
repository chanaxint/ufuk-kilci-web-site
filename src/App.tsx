import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import Preloader from './components/Preloader'
import Navbar from './components/Navbar'
import ScrollProgress from './components/ScrollProgress'
import StudioBackground from './components/ui/StudioBackground'
import CursorTrail from './components/ui/CursorTrail'
import SpineStage from './components/SpineStage'
import Scoliosis from './components/Scoliosis'
import Certificates from './components/Certificates'
import ScoliosisAngles from './components/ScoliosisAngles'
import About from './components/About'
import Services from './components/Services'
import Testimonials from './components/Testimonials'
import Faq from './components/Faq'
import Contact from './components/Contact'
import Footer from './components/Footer'
import MobileCallBar from './components/MobileCallBar'
import SectionRule from './components/ui/SectionRule'
import { useSmoothScroll } from './lib/useSmoothScroll'

export default function App() {
  const [loading, setLoading] = useState(true)
  useSmoothScroll(!loading)

  /* Yükleme ekranı açıkken sayfa kaydırılmasın */
  useEffect(() => {
    document.documentElement.style.overflow = loading ? 'hidden' : ''
    return () => {
      document.documentElement.style.overflow = ''
    }
  }, [loading])

  const handleDone = useCallback(() => setLoading(false), [])

  return (
    <>
      <AnimatePresence mode="wait">
        {loading && <Preloader key="preloader" onDone={handleDone} />}
      </AnimatePresence>

      {/*
        NOT: Scroll'a bağlı omurga video girişi (scroll-bound intro) buraya,
        <Navbar /> ile <SpineStage /> arasına gelecek. Video dosyası projeye eklendiğinde
        <VideoIntro /> bileşeni bu noktaya yerleştirilecek.
      */}

      <a
        href="#top"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[90] focus:rounded-full focus:bg-ink-900 focus:px-5 focus:py-3 focus:font-display focus:text-sm focus:font-bold focus:text-sand-50"
      >
        İçeriğe geç
      </a>

      <StudioBackground />
      <CursorTrail />
      <ScrollProgress />
      <Navbar />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.8, delay: loading ? 0 : 0.15, ease: [0.16, 1, 0.3, 1] }}
      >
        <SpineStage />
        <Scoliosis />
        <SectionRule />
        <ScoliosisAngles />
        <SectionRule />
        <Testimonials />
        <SectionRule />
        <Services />
        <SectionRule />
        <About />
        <SectionRule />
        <Certificates />
        <SectionRule />
        <Faq />
        <SectionRule />
        <Contact />
      </motion.main>

      <Footer />
      {!loading && <MobileCallBar />}
    </>
  )
}
