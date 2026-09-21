import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { doctor } from '../lib/content'
import { setScrollLocked } from '../lib/useSmoothScroll'
import ShinyText from './reactbits/ShinyText'
import type { SpineRegionId } from '../lib/spine'
import { ArrowDown, ArrowRight } from './ui/icons'
import SceneBoundary from './ui/SceneBoundary'
import PoseTuner from './ui/PoseTuner'
import { hasWebGL } from '../lib/webgl'

const SpineStageScene = lazy(() => import('./three/SpineStageScene'))

gsap.registerPlugin(ScrollTrigger)

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

/**
 * Giriş sahnesi.
 *
 * Ekranda klinik masası duruyor ve 3B omurga, fotoğraftaki krom standın
 * üzerinde. Omurga scroll ile gelmiyor: başından beri orada. Üzerine
 * tıklanınca kamera yaklaşıyor (çevre görünürken), bölge adları açılıyor;
 * bir sonraki kaydırma hareketi odağı bırakıp sahneyi geri veriyor.
 * Kaydırmaya devam edilince sahne yukarı kayıp kararıyor — masanın altına
 * inilmiş gibi — ve site oradan açılıyor.
 */
export default function SpineStage() {
  const stageRef = useRef<HTMLDivElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const photoRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const veilRef = useRef<HTMLDivElement>(null)
  /** 0: standın üzerinde, 1: kamera yaklaşmış */
  const focus = useRef(0)
  /** Omurgaya en son ne zaman tıklandı — boşluğa tıklamayı ayırt etmek için */
  const spineClickAt = useRef(0)

  const [focused, setFocused] = useState(false)
  const [hovered, setHovered] = useState<SpineRegionId | null>(null)
  const [mounted, setMounted] = useState(false)
  const [onScreen, setOnScreen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  /* Adrese ?ayar=1 eklenince omurgayı yerine oturtan panel açılır */
  const [tuning, setTuning] = useState(false)

  useEffect(() => {
    setTuning(new URLSearchParams(window.location.search).has('ayar'))
  }, [])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  /* WebGL bağlamını ilk karede değil, bileşen bağlandıktan hemen sonra kur */
  useEffect(() => {
    if (!hasWebGL()) return
    const id = window.setTimeout(() => setMounted(true), 60)
    return () => window.clearTimeout(id)
  }, [])

  /* Sahne görüş alanından çıkınca WebGL render döngüsü duruyor */
  useEffect(() => {
    const el = stickyRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), {
      rootMargin: '250px 0px',
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  /*
   * Odak geçişi: hem 3B modeli hem de fotoğrafı aynı değer sürüyor. Fotoğraf
   * yaklaşıp hafifçe bulanıklaşıyor, böylece çevre kaybolmadan geri çekiliyor
   * ve kamera gerçekten omurgaya yaklaşmış gibi duruyor.
   */
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const target = focused ? 1 : 0

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const k = 1 - Math.pow(0.004, dt)
      focus.current += (target - focus.current) * k
      if (Math.abs(target - focus.current) < 0.002) focus.current = target

      const f = focus.current
      if (photoRef.current) {
        photoRef.current.style.transform = `scale(${1 + f * 0.32})`
        photoRef.current.style.filter = `blur(${(f * 3.5).toFixed(2)}px) brightness(${1 - f * 0.16})`
      }
      if (heroRef.current) heroRef.current.style.opacity = String(1 - Math.min(1, f * 1.6))

      if (focus.current !== target) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [focused])

  /*
   * Odaktayken sayfa kilitli. Kaydırma, Esc ya da boşluğa tıklama odağı
   * bırakıp aynı sahneye döndürüyor; omurganın kendisine tıklamak saymıyor.
   */
  useEffect(() => {
    if (!focused) return
    setScrollLocked(true)
    const release = () => {
      setFocused(false)
      setHovered(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') release()
    }
    const onClickAway = () => {
      if (performance.now() - spineClickAt.current > 150) release()
    }
    window.addEventListener('wheel', release, { passive: true })
    window.addEventListener('touchmove', release, { passive: true })
    window.addEventListener('keydown', onKey)
    window.addEventListener('click', onClickAway)
    return () => {
      setScrollLocked(false)
      window.removeEventListener('wheel', release)
      window.removeEventListener('touchmove', release)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('click', onClickAway)
    }
  }, [focused])

  /*
   * Kaydırma: sahne önce olduğu gibi duruyor, sonra yukarı kayıp sönüyor ve
   * siyah perde aşağıdan yükselip ekranı kaplıyor; son bölümde perde açılınca
   * sitenin sıvalı zemini görünüyor.
   */
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          const p = self.progress
          const down = clamp01((p - 0.45) / 0.35)
          const up = clamp01((p - 0.8) / 0.2)
          if (sceneRef.current) {
            sceneRef.current.style.opacity = String(1 - down)
            sceneRef.current.style.transform = `translate3d(0, ${(-down * 16).toFixed(2)}vh, 0)`
          }
          if (veilRef.current) {
            veilRef.current.style.transform = `translate3d(0, ${((1 - down) * 100).toFixed(2)}%, 0)`
            veilRef.current.style.opacity = String(1 - up)
          }
          /*
           * Sabit başlık ve mobil arama çubuğu koyu geçiş boyunca siliniyor:
           * mürekkep rengi yazılar siyah perdenin üzerinde okunmuyordu.
           */
          document.documentElement.style.setProperty('--stage-dark', (down * (1 - up)).toFixed(3))
        },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section id="top" ref={stageRef} className="relative h-[220vh]">
      <div ref={stickyRef} className="sticky top-0 h-[100svh] overflow-hidden">
        <div ref={sceneRef} className="absolute inset-0 will-change-[opacity,transform]">
          {/* Klinik masası */}
          <div
            ref={photoRef}
            className="absolute inset-0 will-change-[transform,filter]"
            style={{ transformOrigin: '68% 46%' }}
          >
            <img
              src="/images/klinik-masa.jpg"
              alt=""
              aria-hidden="true"
              fetchPriority="high"
              className="size-full object-cover object-[70%_center]"
            />
            {/*
              Metni okunur tutan ışık perdesi. Geniş ekranda soldan gelir;
              dar ekranda metin aşağıda durduğu için perde alttan gelir.
            */}
            <div
              className="absolute inset-0 lg:hidden"
              style={{
                background:
                  'linear-gradient(to top, rgb(250 246 239 / 0.94) 0%, rgb(250 246 239 / 0.86) 22%, rgb(250 246 239 / 0.45) 34%, transparent 46%)',
              }}
            />
            <div
              className="absolute inset-0 hidden lg:block"
              style={{
                background:
                  'linear-gradient(100deg, rgb(250 246 239 / 0.74) 0%, rgb(250 246 239 / 0.4) 32%, transparent 56%), linear-gradient(to top, rgb(28 20 12 / 0.34) 0%, transparent 26%)',
              }}
            />
          </div>

          {/* 3B omurga — standın üzerinde */}
          <div className="absolute inset-0">
            {mounted && (
              <SceneBoundary>
                <Suspense fallback={null}>
                  <SpineStageScene
                    focus={focus}
                    active={onScreen}
                    labelsVisible={focused}
                    hovered={hovered}
                    onHover={setHovered}
                    onSelect={() => {
                      spineClickAt.current = performance.now()
                      setFocused(true)
                    }}
                    isMobile={isMobile}
                  />
                </Suspense>
              </SceneBoundary>
            )}
          </div>

          {/* Giriş metni */}
          <div
            ref={heroRef}
            className="pointer-events-none absolute inset-0 flex items-end pb-24 sm:pb-28 lg:items-center lg:pb-0"
          >
            <div className="section-shell">
              <div className="max-w-2xl">
                <motion.span
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.7 }}
                  className="font-display text-[0.7rem] font-bold tracking-[0.42em] text-ink-600 uppercase"
                >
                  {doctor.titles}
                </motion.span>

                <h1 className="mt-4 font-wordmark text-[clamp(3.4rem,10vw,7rem)] leading-[0.95] font-normal tracking-[-0.012em]">
                  <ShinyText
                    text={doctor.name}
                    speed={6}
                    color="#4a3626"
                    shineColor="#d9b98e"
                    spread={100}
                  />
                </h1>

                <p className="lead mt-6 hidden max-w-lg sm:block">
                  Ağrıyı susturmak yetmez; sebebini bulmak gerekir. Omurga, duruş ve hareket
                  bütününü tek bir zincir olarak değerlendiren bütüncül bir tedavi yaklaşımı.
                </p>

                <div className="pointer-events-auto mt-6 flex flex-wrap items-center gap-3 sm:mt-9">
                  <a
                    href="#iletisim"
                    className="group inline-flex items-center gap-2 rounded-full bg-ink-900 px-7 py-3.5 font-display text-[0.95rem] font-bold text-sand-50 shadow-[0_18px_40px_-18px_rgb(58_42_28/0.85)] transition-colors hover:bg-brand-700"
                  >
                    Randevu Oluştur
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </a>
                  <a
                    href="#skolyoz"
                    className="inline-flex items-center gap-2 rounded-full border border-ink-700/50 bg-white/30 px-7 py-3.5 font-display text-[0.95rem] font-bold text-ink-800 transition-colors hover:border-brand-600 hover:text-brand-700"
                  >
                    Skolyoz Tedavisi
                    <ArrowDown className="size-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Alt ipucu */}
          <div className="pointer-events-none absolute inset-x-0 bottom-20 flex justify-center px-6 sm:bottom-6">
            <span className="rounded-full bg-ink-950/45 px-4 py-2 text-center font-display text-[0.66rem] font-bold tracking-[0.2em] text-sand-50/85 uppercase backdrop-blur-sm">
              {focused
                ? 'Bölgelerin üzerine gelin · boşluğa tıklayın ya da kaydırın'
                : 'Omurgaya tıklayın · bölgeleri tanıyın'}
            </span>
          </div>
        </div>

        {tuning && <PoseTuner isMobile={isMobile} focused={focused} />}

        {/* Masanın altına iniş — aşağıdan yükselen siyah perde */}
        <div
          ref={veilRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 translate-y-full bg-[#0b0806] will-change-[opacity,transform]"
        />
      </div>
    </section>
  )
}
