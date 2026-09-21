import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * Sitenin tamamını saran hata sınırı.
 *
 * React ağacında yakalanmayan bir hata olduğunda sayfa bembeyaz kalıyor ve
 * geriye bakacak hiçbir şey olmuyor. Bu sınır o durumda beyaz ekran yerine
 * hatanın kendisini yazıyor: ne olduğu ve nerede olduğu ekranda görünüyor,
 * konsolu açmaya gerek kalmıyor.
 */
export default class AppBoundary extends Component<
  { children: ReactNode },
  { error: Error | null; stack: string }
> {
  state: { error: Error | null; stack: string } = { error: null, stack: '' }

  static getDerivedStateFromError(error: Error) {
    return { error, stack: '' }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Site yüklenemedi:', error, info.componentStack)
    this.setState({ error, stack: (info.componentStack ?? '').trim().split('\n').slice(0, 6).join('\n') })
  }

  render() {
    const { error, stack } = this.state
    if (!error) return this.props.children

    return (
      <div
        style={{
          minHeight: '100svh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          background: '#2a1c12',
          color: '#f2e8d8',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <div style={{ maxWidth: '44rem' }}>
          <p style={{ fontSize: '0.72rem', letterSpacing: '0.3em', textTransform: 'uppercase', opacity: 0.6 }}>
            Site açılamadı
          </p>
          <h1 style={{ margin: '0.75rem 0 1rem', fontSize: '1.6rem', fontWeight: 700 }}>
            Bir hata sayfanın çizilmesini durdurdu
          </h1>
          <p style={{ margin: 0, lineHeight: 1.6, opacity: 0.85 }}>
            Aşağıdaki satırları olduğu gibi gönderin; sorun bu bilgiyle birlikte hızlıca
            bulunur.
          </p>
          <pre
            style={{
              marginTop: '1.25rem',
              padding: '1rem 1.15rem',
              borderRadius: '0.9rem',
              background: 'rgb(0 0 0 / 0.35)',
              border: '1px solid rgb(242 232 216 / 0.15)',
              fontSize: '0.8rem',
              lineHeight: 1.55,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {error.name}: {error.message}
            {stack ? '\n' + stack : ''}
          </pre>
        </div>
      </div>
    )
  }
}
