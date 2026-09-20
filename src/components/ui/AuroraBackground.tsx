/**
 * Sayfanın tamamının arkasında yavaşça hareket eden yumuşak renk bulutları.
 * Yeşil ve pembe tonlar düşük yoğunlukta tutulur; amaç zemine hafif bir
 * canlılık katmak, öne çıkmak değil. "Azaltılmış hareket" tercihinde
 * index.css'teki genel kural animasyonları durdurur.
 */
export default function AuroraBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-sand-50" />

      {/* Yeşil */}
      <div
        className="absolute -top-[18%] -left-[12%] h-[75vh] w-[75vw] rounded-[45%] blur-3xl will-change-transform"
        style={{
          background:
            'radial-gradient(closest-side, rgb(152 226 192 / 0.55), rgb(152 226 192 / 0.18) 55%, transparent 78%)',
          animation: 'auroraA 34s ease-in-out infinite',
        }}
      />

      {/* Pembe */}
      <div
        className="absolute top-[22%] -right-[14%] h-[70vh] w-[70vw] rounded-[45%] blur-3xl will-change-transform"
        style={{
          background:
            'radial-gradient(closest-side, rgb(247 190 214 / 0.52), rgb(247 190 214 / 0.16) 55%, transparent 78%)',
          animation: 'auroraB 42s ease-in-out infinite',
        }}
      />

      {/* Alt köşede iki tonun buluştuğu yumuşak geçiş */}
      <div
        className="absolute -bottom-[16%] left-[18%] h-[62vh] w-[68vw] rounded-[45%] blur-3xl will-change-transform"
        style={{
          background:
            'radial-gradient(closest-side, rgb(198 232 210 / 0.5), rgb(247 205 222 / 0.2) 58%, transparent 80%)',
          animation: 'auroraC 50s ease-in-out infinite',
        }}
      />

      {/* Renkleri kağıt tonunda tutan ince örtü */}
      <div className="absolute inset-0 bg-sand-50/45" />
    </div>
  )
}
