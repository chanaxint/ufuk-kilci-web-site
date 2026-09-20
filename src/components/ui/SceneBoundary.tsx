import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * 3B sahneleri saran hata sınırı.
 *
 * WebGL bağlamı açılamadığında ya da model yüklenemediğinde three.js hata
 * fırlatıyor; sınır olmadan bu hata React ağacının tamamını söküyor ve sayfa
 * bembeyaz kalıyordu. Artık yalnızca sahne düşüyor, sitenin geri kalanı
 * ayakta kalıyor.
 */
export default class SceneBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('3B sahne yüklenemedi:', error, info.componentStack)
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null
    return this.props.children
  }
}
