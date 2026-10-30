import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { defaultContent, loadSaved, type SiteContent } from './siteContent'
import { DEMO_KEY, demoMode, embeddedContent, fetchSavedContent } from './backend'
import { isPreview, onPanelMessage, sendToPanel } from './preview'

const ContentCtx = createContext<SiteContent>(defaultContent)

export function ContentProvider({ value, children }: { value: SiteContent; children: ReactNode }) {
  return <ContentCtx.Provider value={value}>{children}</ContentCtx.Provider>
}

/** Sitenin o anki içeriği (kayıtlı + varsayılan) */
export const useContent = () => useContext(ContentCtx)

/** Kayıtlı içerik bu kadar sürede gelmezse site varsayılanlarla açılıyor */
const WAIT_MS = 4000

/* Sunucunun HTML'e gömdüğü içerik: ilk çizimden itibaren doğru metin */
const gomulu = !isPreview && !demoMode ? embeddedContent() : null

/**
 * İçeriği bir kez yükler. `ready`, içerik geldiğinde ya da bekleme süresi
 * dolduğunda `true` oluyor; yükleme ekranı bunu bekliyor ki ziyaretçi önce
 * eski metni görüp sonra değiştiğini görmesin. İçerik HTML'e gömülüyse
 * beklenecek bir şey yok.
 */

export function useLoadedContent() {
  const [content, setContent] = useState<SiteContent>(() => (gomulu ? loadSaved(gomulu) : defaultContent))
  const [ready, setReady] = useState(isPreview || !!gomulu)

  useEffect(() => {
    /* Paneldeki önizleme: kayıtlı içerik yerine panelin taslağını göster */
    if (isPreview) {
      const stop = onPanelMessage((msg) => {
        if (msg.type === 'uk-icerik') setContent(loadSaved(msg.content))
      })
      sendToPanel({ type: 'uk-hazir' })
      return stop
    }

    if (gomulu) return
    const ctrl = new AbortController()
    const timer = window.setTimeout(() => setReady(true), WAIT_MS)
    fetchSavedContent(ctrl.signal).then((saved) => {
      if (saved) setContent(loadSaved(saved))
      window.clearTimeout(timer)
      setReady(true)
    })

    /* Deneme modu: panel başka bir sekmede kaydedince site anında güncellensin */
    const onStorage = (e: StorageEvent) => {
      if (!demoMode || e.key !== DEMO_KEY) return
      try {
        setContent(loadSaved(e.newValue ? JSON.parse(e.newValue) : null))
      } catch {
        /* bozuk kayıt: mevcut içerik kalsın */
      }
    }
    window.addEventListener('storage', onStorage)
    return () => {
      ctrl.abort()
      window.clearTimeout(timer)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return { content, ready }
}
