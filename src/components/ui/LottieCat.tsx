import { LottieLight } from 'lottie-react'

/**
 * Yükleme ekranındaki küçük kedi.
 *
 * Animasyon verisi bir Lottie JSON dosyası; şu an LottieFiles'ın sunucusundan
 * çekiliyor. Dosya gelmezse kutu boş kalır, yükleme ekranının geri kalanı
 * olduğu gibi çalışmaya devam eder.
 *
 * YAYINA ÇIKMADAN ÖNCE: dosyayı bir kez indirip `public/animations/cat.json`
 * olarak kaydedin, aşağıdaki adresi de '/animations/cat.json' yapın. Böylece
 * site dışarıdaki bir servise bağımlı kalmaz.
 *
 * Motorun hafif (yalnızca SVG) yapısı kullanılıyor; tek bir yükleme
 * animasyonu için tam yapıyı taşımaya gerek yok.
 */
const CAT_SRC = 'https://lottie.host/8cf4ba71-e5fb-44f3-8134-178c4d389417/0CCsdcgNIP.json'

export default function LottieCat({ className = '' }: { className?: string }) {
  return (
    <LottieLight
      src={CAT_SRC}
      autoplay
      loop
      aria-hidden="true"
      className={className}
      /*
       * Kediyi sitenin kahve tonuna çekmek isterseniz bu satırı ekleyin:
       * style={{ filter: 'grayscale(1) sepia(1) hue-rotate(-12deg) saturate(2.4) brightness(0.78)' }}
       */
    />
  )
}
