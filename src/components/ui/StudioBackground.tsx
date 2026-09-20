/**
 * Sitenin tamamının oturduğu tek zemin: sıvalı duvar.
 *
 * Katmanlar: dikey sıva gradyanı → yavaşça yer değiştiren beyaz ışık bulutları
 * → sıva dokusu → kenarlara doğru koyulaşan vinyet. İmleç efekti ayrı bir
 * bileşende (GlowCursor) yaşar; burada imlece bağlı hiçbir şey yok.
 */
export default function StudioBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Sıvalı yüzey */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #d3c8b4 0%, #cabea9 38%, #c4b8a2 72%, #c0b39c 100%)',
        }}
      />

      {/* Yavaşça dolaşan beyaz ışık bulutları */}
      <div
        className="absolute -top-[15%] -left-[10%] h-[80vh] w-[75vw] rounded-[45%] blur-3xl will-change-transform"
        style={{
          background:
            'radial-gradient(closest-side, rgb(255 253 247 / 0.95), rgb(255 251 242 / 0.45) 52%, transparent 78%)',
          animation: 'auroraA 21s ease-in-out infinite',
        }}
      />
      <div
        className="absolute top-[26%] -right-[12%] h-[72vh] w-[68vw] rounded-[45%] blur-3xl will-change-transform"
        style={{
          background:
            'radial-gradient(closest-side, rgb(255 252 244 / 0.88), rgb(255 250 240 / 0.4) 52%, transparent 78%)',
          animation: 'auroraB 27s ease-in-out infinite',
        }}
      />
      <div
        className="absolute -bottom-[14%] left-[22%] h-[64vh] w-[70vw] rounded-[45%] blur-3xl will-change-transform"
        style={{
          background:
            'radial-gradient(closest-side, rgb(255 253 247 / 0.82), rgb(255 251 242 / 0.36) 55%, transparent 80%)',
          animation: 'auroraC 33s ease-in-out infinite',
        }}
      />

      {/* Sıva dokusu — bantlanmayı kırar, yüzeye derinlik verir */}
      <svg className="absolute inset-0 size-full opacity-[0.13] mix-blend-multiply">
        <filter id="studioGrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#studioGrain)" />
      </svg>

      {/* Kenarlara doğru koyulaşan vinyet */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(135% 105% at 50% 45%, transparent 62%, rgb(48 38 24 / 0.16) 100%)',
        }}
      />
    </div>
  )
}
