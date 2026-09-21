import type { SVGProps } from 'react'

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
}

type P = SVGProps<SVGSVGElement>

export const ArrowRight = (p: P) => (
  <svg {...base} {...p}><path d="M4 12h15M13 6l6 6-6 6" /></svg>
)
export const ArrowDown = (p: P) => (
  <svg {...base} {...p}><path d="M12 4v15M6 13l6 6 6-6" /></svg>
)
export const Phone = (p: P) => (
  <svg {...base} {...p}><path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5L16 12l4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4 6.2 2 2 0 0 1 6 4z" /></svg>
)
export const Mail = (p: P) => (
  <svg {...base} {...p}><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m4 7 8 5.5L20 7" /></svg>
)
export const MapPin = (p: P) => (
  <svg {...base} {...p}><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" /><circle cx="12" cy="10" r="2.6" /></svg>
)
export const Clock = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 1.8" /></svg>
)
export const Check = (p: P) => (
  <svg {...base} {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
)
export const Plus = (p: P) => (
  <svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>
)
export const Menu = (p: P) => (
  <svg {...base} {...p}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
)
export const Close = (p: P) => (
  <svg {...base} {...p}><path d="m6 6 12 12M18 6 6 18" /></svg>
)
export const Star = (p: P) => (
  <svg {...base} fill="currentColor" stroke="none" {...p}><path d="m12 3.6 2.5 5.1 5.6.8-4 3.9 1 5.6-5.1-2.7-5 2.7 1-5.6-4.1-3.9 5.6-.8z" /></svg>
)
export const Rotate3D = (p: P) => (
  <svg {...base} {...p}><path d="M12 20.5c4.7 0 8.5-1.9 8.5-4.2 0-1.4-1.4-2.6-3.6-3.4M3.5 16.3c0 1.2 1.1 2.3 2.8 3M12 3.5a8.5 8.5 0 1 0 0 17" /><path d="M9.2 6.3 12 3.5 9.2 1" /></svg>
)
export const Cursor = (p: P) => (
  <svg {...base} {...p}><path d="M6 3.5 18.5 10 13 11.7 10.8 17z" /></svg>
)
export const Sparkle = (p: P) => (
  <svg {...base} {...p}><path d="M12 4.5 13.7 9l4.5 1.7-4.5 1.7L12 17l-1.7-4.6L5.8 10.7 10.3 9z" /><path d="M18.5 16.5 19 18l1.5.5L19 19l-.5 1.5L18 19l-1.5-.5L18 18z" /></svg>
)
/** Kâğıt uçak — randevu mektubunu gönderme düğmesi */
export const Send = (p: P) => (
  <svg {...base} {...p}>
    <path d="M21 3 10.5 13.5" />
    <path d="M21 3 14.5 21l-4-7.5L3 9.5 21 3Z" />
  </svg>
)

export const WhatsApp = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.48 1.34 5L2 22l5.2-1.36a9.92 9.92 0 0 0 4.84 1.24h.01c5.5 0 9.96-4.46 9.96-9.96 0-2.66-1.04-5.16-2.92-7.04A9.88 9.88 0 0 0 12.04 2Zm0 18.18h-.01a8.27 8.27 0 0 1-4.21-1.15l-.3-.18-3.09.81.82-3.01-.2-.31a8.24 8.24 0 0 1-1.26-4.38c0-4.56 3.71-8.27 8.28-8.27 2.21 0 4.29.86 5.85 2.43a8.22 8.22 0 0 1 2.42 5.85c0 4.57-3.71 8.28-8.3 8.28Zm4.54-6.2c-.25-.13-1.47-.72-1.7-.81-.23-.08-.4-.12-.56.13-.17.25-.64.8-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.07s.9 2.4 1.02 2.57c.12.17 1.76 2.68 4.26 3.76.6.26 1.06.41 1.42.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.19.21-.58.21-1.08.14-1.18-.06-.11-.23-.17-.48-.29Z" /></svg>
)
export const Instagram = (p: P) => (
  <svg {...base} {...p}><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="3.8" /><circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" /></svg>
)

/* Anatomik düzlem simgeleri */
