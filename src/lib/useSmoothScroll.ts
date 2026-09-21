import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/*
 * Etkin Lenis örneği. Giriş sahnesinde omurgaya odaklanıldığında sayfa
 * kaydırması kilitleniyor; bir sonraki kaydırma hareketi odağı bırakıyor.
 */
let current: Lenis | null = null

export function setScrollLocked(locked: boolean) {
  /*
   * Yalnızca Lenis durduruluyor. Eskiden buraya `body.overflow = 'hidden'`
   * de yazılıyordu; o satır tarayıcıyı yeniden ölçüme zorlayıp
   * ScrollTrigger'ın bölüm ilerlemesini sıçratıyordu: omurgaya tıklayınca
   * sahne bir anda bölümün başına/sonuna atlıyor, videolar başa sarıyordu.
   * Lenis durduğunda tekerlek ve dokunuş zaten ona gitmiyor; odaktan çıkış
   * da ilk tekerlek hareketinde oluyor.
   */
  if (locked) current?.stop()
  else current?.start()
}

/**
 * Sayfa genelinde akıcı kaydırma (Lenis) ve GSAP ScrollTrigger entegrasyonu.
 * Lenis kendi rAF döngüsü yerine GSAP ticker'ı üzerinden sürülür; böylece
 * ScrollTrigger tetikleyicileri kaydırma ile birebir aynı karede güncellenir.
 * "Azaltılmış hareket" tercihinde Lenis devre dışı kalır, ScrollTrigger
 * tarayıcının doğal kaydırmasıyla çalışmaya devam eder.
 */
export function useSmoothScroll(enabled = true) {
  useEffect(() => {
    if (!enabled) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 0.95,
      touchMultiplier: 1.4,
    })

    current = lenis
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    /* Çapa bağlantıları Lenis üzerinden yumuşakça çalışsın */
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a[href^="#"]')
      if (!anchor) return
      const id = anchor.getAttribute('href')
      if (!id || id === '#') return
      const target = document.querySelector(id)
      if (!target) return
      e.preventDefault()
      lenis.scrollTo(target as HTMLElement, { offset: -24, duration: 1.25 })
    }
    document.addEventListener('click', onClick)

    ScrollTrigger.refresh()

    return () => {
      document.removeEventListener('click', onClick)
      gsap.ticker.remove(tick)
      lenis.destroy()
      if (current === lenis) current = null
    }
  }, [enabled])
}
