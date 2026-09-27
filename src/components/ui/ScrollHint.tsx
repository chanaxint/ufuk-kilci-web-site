import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from './icons'

/** Kaydırma durduktan bu kadar sonra ipucu geri geliyor (ms) */
const IDLE = 1200
/** Sayfa açılınca ilk görünme gecikmesi (yükleme ekranı çekilirken) */
const FIRST = 700
/*
 * Kaydırmaya bağlı bölgenin bitmesine bir ekranın bu kadarı kala ipucu
 * çekiliyor; sonrası normal sayfa akışı, orada "kaydırın" demeye gerek yok.
 */
const TAIL = 0.04

/**
 * Kaydırmaya bağlı bölgelerde mi — `data-kaydir` işaretli bir alanın
 * yapışkan kısmı ekranı kaplıyor ve daha kaydırılacak yol var mı.
 */
function inZone() {
  const vh = window.innerHeight
  for (const el of document.querySelectorAll<HTMLElement>('[data-kaydir]')) {
    const r = el.getBoundingClientRect()
    if (r.top <= 1 && r.bottom > vh * (1 + TAIL)) return true
  }
  return false
}

/**
 * "Aşağı kaydırın" ipucu.
 *
 * Girişteki yürüyüş ve iniş, yorumlarda kâğıtların düşmesi gibi sayfanın
 * kaydırmayla oynayan yerlerinde ekran bir süre aynı kalıyor; ilk kez
 * gelen biri sayfanın bittiğini sanabilir. İpucu yalnızca bu bölgelerde,
 * yalnızca kullanıcı durmuşken görünüyor: kaydırma başladığı an çekiliyor,
 * durunca geri geliyor. Omurgaya odaklanıldığında (sayfa kilitliyken)
 * görünmüyor. Ekran okuyucular için süs sayılıyor.
 */
export default function ScrollHint() {
  const [show, setShow] = useState(false)
  const timer = useRef<number>(0)
  const textRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const locked = () => document.documentElement.classList.contains('lenis-stopped')
    /*
     * İpucunun altında okunacak bir şey varsa (telefonda en alttaki yorum
     * kâğıdı gibi) görünmesin; yazı kâğıdın imzasının üstüne biniyordu.
     * İpucu yalnızca kaydırma dururken çıktığı için o an her şey yerinde.
     */
    const blocked = () => {
      const t = textRef.current?.getBoundingClientRect()
      if (!t) return false
      for (const el of document.querySelectorAll<HTMLElement>('[data-ipucu-engel]')) {
        if (+getComputedStyle(el).opacity < 0.1) continue
        const r = el.getBoundingClientRect()
        if (r.left < t.right && r.right > t.left && r.top < t.bottom + 8 && r.bottom > t.top - 8) return true
      }
      return false
    }
    const canShow = () => inZone() && !locked() && !blocked()

    const settle = () => {
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setShow(canShow()), IDLE)
    }
    const onMove = () => {
      setShow(false)
      settle()
    }

    timer.current = window.setTimeout(() => setShow(canShow()), FIRST)

    /*
     * Lenis yumuşatması sürdükçe tarayıcıya kaydırma olayı gelmeye devam
     * ediyor; "durdu" sayacı hareket gerçekten bittiğinde başlıyor.
     */
    window.addEventListener('scroll', onMove, { passive: true })
    window.addEventListener('wheel', onMove, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('resize', settle)

    /* Omurga odağı açılıp kapanınca (Lenis durup kalkınca) yeniden değerlendir */
    const watch = new MutationObserver(() => {
      if (locked()) setShow(false)
      else settle()
    })
    watch.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    return () => {
      window.clearTimeout(timer.current)
      window.removeEventListener('scroll', onMove)
      window.removeEventListener('wheel', onMove)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('resize', settle)
      watch.disconnect()
    }
  }, [])

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-x-0 bottom-[4.6rem] z-[25] flex justify-center transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:bottom-5 ${
        show ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}
    >
      {/* Yalnızca yazı, çerçevesiz; renk ve hâle `.hint-fg` içinde */}
      <span ref={textRef} className="hint-fg inline-flex items-center gap-2 font-display text-[0.72rem] font-bold tracking-[0.2em]">
        AŞAĞI KAYDIRIN
        <ChevronDown
          className="size-3.5 animate-[hintBob_1.6s_ease-in-out_infinite]"
          strokeWidth={2.2}
        />
      </span>
    </div>
  )
}
