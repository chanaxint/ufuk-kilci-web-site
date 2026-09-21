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
const ease = (t: number) => t * t * (3 - 2 * t)

/* Kaydırma inişinin kilometre taşları (bölümün ilerlemesi üzerinden) */
const HOLD = 0.16 // buraya kadar sahne olduğu gibi duruyor
/*
 * Omurganın ve giriş yazılarının çıkışı.
 *
 * Sayılar uydurma değil: videodaki stand bölgesi kare kare izlendi ve
 * masanın üstündeki eşyaların kadrajda ne kadar yükseldiği ölçüldü
 * ([video saniyesi, kare yüksekliğinin kesri]). Omurga tam bu hızla
 * yükseliyor, yani standın üstünden havalanmıyor.
 *
 * Gerçekte stand kadrajdan çıkmıyor; kamera masa düzleminin altına
 * indikçe masanın ön kenarı önünü kapatıyor. Bunu maskeleyemediğimiz için
 * omurga ve yazılar tam o aralıkta (≈2,4–4,2 sn) yavaşça siliniyor:
 * "bir anda yok olmak" yerine kamerayla birlikte masanın altında kalmış
 * gibi görünüyor.
 */
const STAND_RISE: [number, number][] = [
  [0, 0],
  [1.0, -0.003],
  [1.5, -0.02],
  [2.0, -0.05],
  [2.5, -0.09],
  [3.0, -0.14],
  [3.5, -0.199],
  [4.0, -0.244],
  [4.5, -0.277],
  [5.0, -0.311],
  [5.4, -0.345],
]
const FADE_FROM = 2.4
const FADE_TO = 4.2

function cameraRise(t: number) {
  const k = STAND_RISE
  if (t <= 0) return 0
  for (let i = 1; i < k.length; i++) {
    if (t <= k[i][0]) {
      const [t0, v0] = k[i - 1]
      const [t1, v1] = k[i]
      return v0 + ((v1 - v0) * (t - t0)) / (t1 - t0)
    }
  }
  const [t0, v0] = k[k.length - 2]
  const [t1, v1] = k[k.length - 1]
  return v1 + ((v1 - v0) / (t1 - t0)) * (t - t1)
}

const HANDOFF = 0.045 // fotoğraftan videoya devir bu aralıkta tamamlanıyor
const FLOOR = 0.86 // burada kamera zemine varmış oluyor
const BLOOM = 0.91 // ışık doluyor, sonra sahne sayfaya çözülüyor

/**
 * Giriş sahnesi.
 *
 * Ekranda klinik masası duruyor ve 3B omurga, fotoğraftaki krom standın
 * üzerinde. Omurga scroll ile gelmiyor: başından beri orada. Üzerine
 * tıklanınca kamera yaklaşıyor (çevre görünürken), bölge adları açılıyor;
 * bir sonraki kaydırma hareketi odağı bırakıp sahneyi geri veriyor.
 *
 * Kaydırmaya devam edilince fotoğraf, ilk karesi onunla birebir aynı olan
 * iniş videosuna devrediyor. Video oynamıyor: karesi kaydırmaya kilitli,
 * yani kamera ancak siz kaydırdıkça masanın kenarından aşağı iniyor,
 * masanın altına giriyor ve zemine varıyor. Zeminde ışık perdesi açılıp
 * siteyi devralıyor.
 */
export default function SpineStage() {
  const stageRef = useRef<HTMLDivElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const photoRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  /** Kamerayla birlikte yukarı çıkan katman: omurga + giriş yazıları */
  const followRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)
  /*
   * Standın iki alt kolu, fotoğraftan kesilip omurganın üstüne bindirilen
   * saydam katman. Pelvisin alt iki çıkıntısı böylece demirin arkasında
   * kalıyor. Yalnızca duruş hâlinde görünüyor: yakın plana geçilince de,
   * iniş başlayınca da siliniyor.
   */
  const rodRef = useRef<HTMLDivElement>(null)
  const rodFocus = useRef(1)
  const rodScroll = useRef(1)
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoWrapRef = useRef<HTMLDivElement>(null)
  const washRef = useRef<HTMLDivElement>(null)
  /** Videonun süresi yüklenince buraya yazılıyor */
  const duration = useRef(0)
  /** Son yazılan currentTime — gereksiz seek isteklerini eliyor */
  const lastSeek = useRef(-1)
  /** 0: standın üzerinde, 1: kamera yaklaşmış */
  const focus = useRef(0)
  /** Omurgaya en son ne zaman tıklandı — boşluğa tıklamayı ayırt etmek için */
  const spineClickAt = useRef(0)
  /*
   * Sabit başlık iki ayrı durumda siliniyor: siyah perdeye girerken ve
   * omurgaya yaklaşılırken (fotoğraf koyulaşınca mürekkep rengi yazılar
   * okunmuyor). İkisinin büyüğü yazılıyor ki biri diğerini ezmesin.
   */
  const scrollDark = useRef(0)
  const focusDark = useRef(0)

  const applyRod = () => {
    if (rodRef.current) rodRef.current.style.opacity = (rodFocus.current * rodScroll.current).toFixed(3)
  }

  const applyDark = () => {
    const v = Math.max(scrollDark.current, focusDark.current)
    document.documentElement.style.setProperty('--stage-dark', v.toFixed(3))
  }

  /* İniş başlayınca WebGL döngüsü duruyor; sahne zaten görünmüyor */
  const sceneLive = useRef(true)
  const [isSceneLive, setSceneLive] = useState(true)

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
        /*
         * Yakın planda çevre hem daha çok bulanıklaşıyor hem de koyulaşıyor:
         * bölge yazıları fotoğrafın açık duvarı üzerinde okunmuyordu.
         */
        photoRef.current.style.filter = `blur(${(f * 5).toFixed(2)}px) brightness(${(1 - f * 0.58).toFixed(3)})`
      }
      if (rodRef.current) {
        /* Demir fotoğrafla birlikte hareket ediyor ama yakın planda kalmıyor */
        rodRef.current.style.transform = `scale(${1 + f * 0.32})`
        rodFocus.current = 1 - Math.min(1, f * 2.6)
        applyRod()
      }
      if (heroRef.current) heroRef.current.style.opacity = String(1 - Math.min(1, f * 1.6))
      focusDark.current = Math.min(1, f * 1.6)
      applyDark()

      if (focus.current !== target) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [focused])

  /*
   * Video kurulumu. Süre öğrenilince kaydırma onu sürebiliyor. iOS Safari
   * ilk kullanıcı hareketine kadar kareyi çözmediği için videoyu bir kez
   * oynatıp hemen duruyoruz; bu, sessiz ve satır içi videoda görünmez.
   */
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onMeta = () => {
      duration.current = v.duration || 0
    }
    if (v.readyState >= 1) onMeta()
    v.addEventListener('loadedmetadata', onMeta)

    /*
     * Video giriş fotoğrafıyla yarışmasın: ilk kare ekrana oturduktan sonra
     * indirmeye başlıyor. Kaydırma oraya varana kadar fazlasıyla vakit var.
     */
    const warm = window.setTimeout(() => {
      v.preload = 'auto'
      v.load()
    }, 1400)

    let primed = false
    const prime = () => {
      if (primed) return
      primed = true
      v.play()
        .then(() => v.pause())
        .catch(() => {})
    }
    window.addEventListener('touchstart', prime, { once: true, passive: true })
    window.addEventListener('pointerdown', prime, { once: true })
    window.addEventListener('wheel', prime, { once: true, passive: true })

    return () => {
      window.clearTimeout(warm)
      v.removeEventListener('loadedmetadata', onMeta)
      window.removeEventListener('touchstart', prime)
      window.removeEventListener('pointerdown', prime)
      window.removeEventListener('wheel', prime)
    }
  }, [])

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
   * Kaydırma inişi. Sahne bir süre olduğu gibi duruyor; sonra giriş
   * fotoğrafı, ilk karesi onunla birebir aynı olan videoya devrediyor ve
   * video kaydırmaya kilitleniyor: kamera masanın kenarından aşağı inip
   * masanın altına giriyor, oradan zemine varıyor. Son bölümde sıcak bir
   * ışık perdesi açılıp sayfayı devralıyor.
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
          /* Fotoğraftan videoya devir */
          const hand = clamp01((p - HOLD) / HANDOFF)
          /*
           * Videonun kendi ilerlemesi. Devir bitmeden başlamıyor: geçiş
           * boyunca video ilk karesinde duruyor, o kare de giriş
           * fotoğrafının aynısı olduğu için devir görünmüyor.
           * Doğrusal: kamera parmağınıza kilitli, kaydırdığınız kadar
           * iniyor — ortada hızlanıp yavaşlamıyor.
           */
          const roll = clamp01((p - HOLD - HANDOFF) / (FLOOR - HOLD - HANDOFF))
          /*
           * Videonun son karesi de, sayfanın arkaplanı da aynı ahşap zemin.
           * Bu yüzden sonda beyaza patlamak yerine yalnızca sıcak bir ışık
           * geçiyor ve sahne sayfanın kendi zeminine çözülüyor: iki zemin
           * birbirine karışıyor, dikiş görünmüyor.
           */
          const bloom = ease(clamp01((p - FLOOR) / (BLOOM - FLOOR)))
          const dissolve = ease(clamp01((p - BLOOM) / (1 - BLOOM)))

          /*
           * Devir sırasında fotoğraf kıpırdamıyor: video ilk karesinde
           * duruyor ve o kare fotoğrafın aynısı, en ufak kayma bile iki
           * görüntüyü üst üste düşürüp hayalet yapıyor. Yalnızca fotoğraf
           * sönüyor — omurga ve yazılar sahnede kalıyor.
           */
          if (photoRef.current) photoRef.current.style.opacity = String(1 - hand)
          rodScroll.current = 1 - hand
          applyRod()

          /*
           * Omurga ve giriş yazıları kaybolmuyor: kamera indikçe, masa
           * üstüyle aynı ritimde yukarı çıkıp kadrajdan çıkıyorlar.
           * Ölçülen eğri video saniyesiyle okunuyor, böylece hareket
           * videodaki kamerayla aynı anda başlıyor ve hızlanıyor.
           */
          const vt = roll * (duration.current || 0)
          const rise = cameraRise(vt)
          if (followRef.current) {
            followRef.current.style.transform = `translate3d(0, ${(rise * 100).toFixed(2)}vh, 0)`
            followRef.current.style.opacity = (
              1 - ease(clamp01((vt - FADE_FROM) / (FADE_TO - FADE_FROM)))
            ).toFixed(3)
          }
          /* "Omurgaya tıklayın" ipucu iniş başlar başlamaz çekiliyor */
          if (hintRef.current) hintRef.current.style.opacity = String(1 - hand)
          if (videoWrapRef.current)
            videoWrapRef.current.style.opacity = (hand * (1 - dissolve)).toFixed(3)
          if (washRef.current) washRef.current.style.opacity = (bloom * (1 - dissolve)).toFixed(3)

          const v = videoRef.current
          if (v && duration.current > 0) {
            const t = roll * duration.current
            /* Yarım kareden küçük farklar için seek istemiyoruz */
            if (Math.abs(t - lastSeek.current) > 1 / 48) {
              lastSeek.current = t
              try {
                v.currentTime = t
              } catch {
                /* tarayıcı henüz hazır değilse sessizce geç */
              }
            }
          }

          /*
           * Sabit başlık ve mobil arama çubuğu koyu inişte siliniyor;
           * zeminde perde açılırken geri geliyor.
           */
          scrollDark.current = clamp01(hand * 1.2) * (1 - Math.max(bloom, dissolve))
          applyDark()

          /* Omurga silindikten sonra WebGL döngüsü boşuna dönmesin */
          const live = vt < FADE_TO + 0.2
          if (live !== sceneLive.current) {
            sceneLive.current = live
            setSceneLive(live)
          }
        },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section id="top" ref={stageRef} className="relative h-[340vh] lg:h-[420vh]">
      <div ref={stickyRef} className="sticky top-0 h-[100svh] overflow-hidden">
        {/*
          Yığın sırası: en altta video, üstünde giriş fotoğrafı (sönerek
          videoyu açıyor), en üstte kamerayla yükselen omurga ve yazılar.
        */}
        <div ref={sceneRef} className="absolute inset-0 z-10">
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

          {/*
            Kamerayla birlikte yukarı çıkan katman. Omurga masanın üstünde
            durduğu için iniş başlayınca kaybolmuyor: masa üstüyle aynı
            ritimde yükselip kadrajdan çıkıyor. Giriş yazıları da aynı
            kapta, aynı hareketle gidiyor.
          */}
          <div ref={followRef} className="absolute inset-0 will-change-[opacity,transform]">
          {/* 3B omurga — standın üzerinde */}
          <div className="absolute inset-0">
            {mounted && (
              <SceneBoundary>
                <Suspense fallback={null}>
                  <SpineStageScene
                    focus={focus}
                    active={onScreen && isSceneLive}
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
          <div
            ref={hintRef}
            className="pointer-events-none absolute inset-x-0 bottom-20 flex justify-center px-6 sm:bottom-6"
          >
            <span className="rounded-full bg-ink-950/45 px-4 py-2 text-center font-display text-[0.66rem] font-bold tracking-[0.2em] text-sand-50/85 uppercase backdrop-blur-sm">
              {focused
                ? 'Bölgelerin üzerine gelin · boşluğa tıklayın ya da kaydırın'
                : 'Omurgaya tıklayın · bölgeleri tanıyın'}
            </span>
          </div>
          </div>

          {/*
            Standın kolları — omurganın üstünde. Fotoğrafla birebir aynı
            çerçeveleme (aynı oran, aynı çıpa), bu yüzden her pencere
            boyutunda tam fotoğraftaki demirin üstüne oturuyor (ölçüldü:
            omurga gizlendiğinde kare fotoğrafla aynı kalıyor).

            Yalnızca geniş ekranda: dar ekranda metni okutan açık perde
            fotoğrafı yıkıyor, perdenin üstünde kalan demir ise yıkanmadığı
            için sırıtıyordu. Orada zaten pelvis de solgun, kazanç yok.
          */}
          <div
            ref={rodRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 hidden lg:block"
            style={{ transformOrigin: '68% 46%' }}
          >
            <img
              src="/images/stand-kollari.png"
              alt=""
              className="size-full object-cover object-[70%_center]"
            />
          </div>

        </div>

        {/*
          İniş videosu. İlk karesi giriş fotoğrafının aynısı olduğu için
          devir görünmüyor; oradan sonra kamera kaydırmayla aşağı iniyor.
        */}
        <div
          ref={videoWrapRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 opacity-0 will-change-[opacity]"
        >
          <video
            ref={videoRef}
            poster="/images/klinik-masa.jpg"
            muted
            playsInline
            preload="none"
            disablePictureInPicture
            /* Fotoğrafla birebir aynı çerçeveleme: aynı oran, aynı çıpa */
            className="size-full object-cover object-[70%_center]"
          >
            {/*
              H.264 her yerde donanımla çözülüyor; dar ekrana daha küçük
              kopya gidiyor. Sıra bilinçli: `media` koşulunu yok sayan bir
              tarayıcı olursa herkese büyük kopya gider, tersi olmaz.
              VP9 yalnızca H.264 çözemeyen tarayıcılar için.
            */}
            <source
              src="/video/masa-alti-inis.mp4"
              type='video/mp4; codecs="avc1.4d401f"'
              media="(min-width: 641px)"
            />
            <source
              src="/video/masa-alti-inis-mobil.mp4"
              type='video/mp4; codecs="avc1.4d401e"'
              media="(max-width: 640px)"
            />
            <source src="/video/masa-alti-inis.webm" type="video/webm" />
          </video>
        </div>

        {/* Zeminde dolan ışık — sonra sahneyle birlikte çözülüyor */}
        <div
          ref={washRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 opacity-0 will-change-[opacity]"
          style={{
            background:
              'radial-gradient(130% 95% at 50% 30%, rgb(255 233 196 / 0.4), rgb(226 190 146 / 0.22) 55%, rgb(40 24 14 / 0.3) 100%)',
          }}
        />

        {tuning && <PoseTuner isMobile={isMobile} focused={focused} />}
      </div>
    </section>
  )
}
