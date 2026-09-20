/**
 * Tarayıcı WebGL bağlamı açabiliyor mu?
 *
 * Donanım hızlandırması kapalı, sürücü kara listede ya da uzak masaüstü gibi
 * ortamlarda bağlam kurulamıyor ve three.js hata fırlatıyor. Sahneleri hiç
 * kurmayıp zarifçe gerilemek için önceden bakıyoruz. Sonuç bir kez hesaplanır.
 */
let cached: boolean | null = null

export function hasWebGL(): boolean {
  if (cached !== null) return cached
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    cached = Boolean(gl)
    if (gl && 'getExtension' in gl) {
      const lose = (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context')
      lose?.loseContext()
    }
  } catch {
    cached = false
  }
  return cached
}
