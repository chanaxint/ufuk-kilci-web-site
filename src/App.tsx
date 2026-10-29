import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
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
import Testimonials from './components/Testimonials'
import Faq from './components/Faq'
import Contact from './components/Contact'
import Footer from './components/Footer'
import MobileCallBar from './components/MobileCallBar'
import SectionRule from './components/ui/SectionRule'
import ScrollHint from './components/ui/ScrollHint'
import { jumpTo, useSmoothScroll } from './lib/useSmoothScroll'
import { heroY, introSeen } from './lib/entry'
import { ContentProvider, useLoadedContent } from './lib/ContentContext'
import { isPreview, onPanelMessage } from './lib/preview'
import { BlocksAfter } from './components/CustomBlock'

/* Paneldeki bölüm adından sayfadaki konuma */
const PREVIEW_IDS: Record<string, string> = {
  skolyoz: 'skolyoz',
  acilar: 'skolyoz-acilari',
  yorumlar: 'yorumlar',
  hakkimda: 'hakkimda',
  sertifikalar: 'sertifikalar',
  sss: 'sss',
  iletisim: 'iletisim',
  randevu: 'iletisim',
}
function previewTargetY(target: string): number | null {
  if (target === 'giris') return heroY()
  if (target === 'genel') return document.documentElement.scrollHeight
  const id = target.startsWith('blok:') ? `bolum-${target.slice(5)}` : PREVIEW_IDS[target]
  const el = id ? document.getElementById(id) : null
  return el ? el.getBoundingClientRect().top + window.scrollY - 90 : null
}

export default function App() {
  /*
   * Yükleme ekranı iki şeyi bekliyor: kendi açılış animasyonu ve yönetim
   * panelinden kaydedilmiş içerik. Böylece ziyaretçi önce eski metni görüp
   * sonra değiştiğini görmüyor (içerik en geç birkaç saniyede gelmezse site
   * varsayılan metinlerle açılıyor).
   */
  const { content, ready } = useLoadedContent()
  /* Paneldeki önizlemede yükleme ekranı yok: düzenlerken her seferinde beklemesin */
  const [preloaderDone, setPreloaderDone] = useState(isPreview)
  const loading = !(preloaderDone && ready)
  useSmoothScroll(!loading)

  /* Yükleme ekranı açıkken sayfa kaydırılmasın */
  useEffect(() => {
    document.documentElement.style.overflow = loading ? 'hidden' : ''
    return () => {
      document.documentElement.style.overflow = ''
    }
  }, [loading])

  /*
   * Yürüyüş bu sekmede daha önce izlendiyse (yani sayfa yenilendiyse) yükleme
   * ekranı kalkar kalkmaz masanın üstündeki giriş sahnesine geçiliyor;
   * kapıdan yeniden yürümek yok. İlk girişte kapıdan başlanıyor.
   */
  useEffect(() => {
    if (loading || !(introSeen() || isPreview)) return
    jumpTo(heroY())
  }, [loading])

  /* Önizlemede taslak değiştikçe bölümlerin boyu değişiyor: kaydırma sahneleri yeniden ölçülsün */
  useEffect(() => {
    if (!isPreview) return
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 250)
    return () => window.clearTimeout(t)
  }, [content])

  const handleDone = useCallback(() => setPreloaderDone(true), [])

  /* Önizleme: panelde bir bölüm seçilince çerçeve o bölüme kayıyor */
  useEffect(
    () =>
      onPanelMessage((msg) => {
        if (msg.type === 'uk-olcek') {
          const k = Number(msg.scale) > 0 ? Math.min(2.2, Math.max(1, 1 / Number(msg.scale))) : 1
          document.documentElement.style.setProperty('--onizleme-olcek', String(k))
          return
        }
        if (msg.type !== 'uk-git') return
        /* Yeni eklenen bölüm birkaç kare sonra çiziliyor: bulunana kadar kısa bir süre dene */
        let tries = 0
        const go = () => {
          const y = previewTargetY(msg.target)
          if (y !== null) jumpTo(y)
          else if (++tries < 20) window.setTimeout(go, 100)
        }
        go()
      }),
    [],
  )

  return (
    <ContentProvider value={content}>
      <AnimatePresence mode="wait">
        {loading && <Preloader key="preloader" onDone={handleDone} />}
      </AnimatePresence>

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
        {/* Panelden eklenen bölümler her sabit bölümün ardına girebiliyor */}
        <SpineStage />
        <BlocksAfter after="giris" />
        <Scoliosis />
        <BlocksAfter after="skolyoz" />
        <SectionRule />
        <ScoliosisAngles />
        <BlocksAfter after="acilar" />
        <SectionRule />
        <Testimonials />
        <BlocksAfter after="yorumlar" />
        <SectionRule />
        <About />
        <BlocksAfter after="hakkimda" />
        <SectionRule />
        <Certificates />
        <BlocksAfter after="sertifikalar" />
        <SectionRule />
        <Faq />
        <BlocksAfter after="sss" />
        <SectionRule />
        <Contact />
        <BlocksAfter after="iletisim" />
      </motion.main>

      <Footer />
      {!loading && <MobileCallBar />}
      {!loading && <ScrollHint />}
    </ContentProvider>
  )
}
