/**
 * Sitenin tamamının oturduğu tek zemin: giriş inişinin bittiği ahşap döşeme.
 *
 * Kamera masanın altından zemine iniyor ve sayfa oradan devam ediyor; bu
 * yüzden arkaplan artık sıvalı duvar değil, aynı ceviz parke. Katmanlar:
 * parke fotoğrafı (sabit) → üzerinde yavaşça dolaşan sıcak ışık havuzları →
 * dokuyu kıran ince tane → kenarlara doğru koyulaşan vinyet.
 *
 * Fotoğraf `fixed` durduğu için sayfa kaydıkça zemin kaymıyor: içerik
 * zeminin üzerinde duran nesneler gibi geçiyor.
 */
export default function StudioBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Parke */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/images/zemin-arkaplan.jpg)' }}
      />
      {/*
        Ahşabı bir tık sakinleştiren sıcak perde: damarlar okunmaya devam
        ediyor ama üzerine düşen yazı ve nesneler öne çıkıyor.
      */}
      <div className="absolute inset-0 bg-[#2a1a10]/46" />

      {/* Yavaşça dolaşan sıcak ışık havuzları */}
      <div
        className="absolute -top-[15%] -left-[10%] h-[80vh] w-[75vw] rounded-[45%] blur-3xl will-change-transform"
        style={{
          background:
            'radial-gradient(closest-side, rgb(255 226 178 / 0.3), rgb(255 219 170 / 0.13) 52%, transparent 78%)',
          animation: 'auroraA 21s ease-in-out infinite',
        }}
      />
      <div
        className="absolute top-[26%] -right-[12%] h-[72vh] w-[68vw] rounded-[45%] blur-3xl will-change-transform"
        style={{
          background:
            'radial-gradient(closest-side, rgb(255 231 190 / 0.26), rgb(255 222 176 / 0.11) 52%, transparent 78%)',
          animation: 'auroraB 27s ease-in-out infinite',
        }}
      />
      <div
        className="absolute -bottom-[14%] left-[22%] h-[64vh] w-[70vw] rounded-[45%] blur-3xl will-change-transform"
        style={{
          background:
            'radial-gradient(closest-side, rgb(255 228 184 / 0.24), rgb(255 220 172 / 0.1) 55%, transparent 80%)',
          animation: 'auroraC 33s ease-in-out infinite',
        }}
      />

      {/* Tane — bantlanmayı kırar */}
      <svg className="absolute inset-0 size-full opacity-[0.16] mix-blend-overlay">
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
            'radial-gradient(130% 100% at 50% 42%, transparent 52%, rgb(20 11 6 / 0.5) 100%)',
        }}
      />
    </div>
  )
}
