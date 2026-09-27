import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import AppBoundary from './components/ui/AppBoundary'
/*
 * Fontlar siteyle birlikte sunuluyor (Google Fonts yerine). Ziyaretçinin
 * tarayıcısı üçüncü bir sunucuya gitmiyor — KVKK açısından temiz — ve font
 * yüklenemediği için yedek yazı tipine düşüp düzenin kayması da yok.
 * Tarayıcı yalnızca sayfada geçen karakter kümesini (latin, latin-ext
 * Türkçe harfler için) indiriyor.
 */
import '@fontsource-variable/manrope'
import '@fontsource-variable/inter'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import './index.css'

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <AppBoundary>
      <App />
    </AppBoundary>
  </StrictMode>,
)
