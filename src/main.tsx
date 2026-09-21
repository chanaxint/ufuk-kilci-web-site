import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import AppBoundary from './components/ui/AppBoundary'
import './index.css'

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <AppBoundary>
      <App />
    </AppBoundary>
  </StrictMode>,
)
