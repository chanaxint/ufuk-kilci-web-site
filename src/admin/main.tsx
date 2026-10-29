import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/manrope'
import '@fontsource-variable/inter'
import '@fontsource/instrument-serif/400.css'
import '../index.css'
import './admin.css'
import AppBoundary from '../components/ui/AppBoundary'
import AdminApp from './AdminApp'

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <AppBoundary>
      <AdminApp />
    </AppBoundary>
  </StrictMode>,
)
