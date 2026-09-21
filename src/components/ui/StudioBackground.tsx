/**
 * Sitenin tamamının oturduğu tek zemin: giriş inişinin bittiği ahşap döşeme.
 *
 * Kamera masanın altından zemine iniyor ve sayfa oradan devam ediyor; bu
 * yüzden arkaplan sıvalı duvar değil, aynı ceviz parke. Katmanlar: parke
 * fotoğrafı (sabit) → sıcak perde → yavaşça dolaşan ışık havuzları → ince
 * tane → kenarlara doğru koyulaşan vinyet.
 *
 * Başarım notu: burada eskiden tam ekran bir SVG `feTurbulence` filtresi ve
 * üç tane 64 piksel bulanıklıklı dev katman vardı. Ölçüldüğünde sayfanın
 * ilk on saniyesindeki uzun görevlerin çoğu buradan geliyordu (8,9 sn →
 * 2,3 sn). Tane artık küçük, döşenen hazır bir görsel; ışık havuzlarında
 * bulanıklık yok, çünkü radyal gradyan zaten yumuşak — filtre görüntüye
 * neredeyse hiçbir şey katmıyor ama her karede yeniden çiziliyordu.
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
        className="absolute -top-[10%] -left-[8%] h-[58vh] w-[52vw] will-change-transform"
        style={{
          background:
            'radial-gradient(closest-side, rgb(255 226 178 / 0.26), rgb(255 219 170 / 0.12) 48%, transparent 76%)',
          animation: 'auroraA 21s ease-in-out infinite',
        }}
      />
      <div
        className="absolute top-[28%] -right-[8%] h-[54vh] w-[48vw] will-change-transform"
        style={{
          background:
            'radial-gradient(closest-side, rgb(255 231 190 / 0.22), rgb(255 222 176 / 0.1) 48%, transparent 76%)',
          animation: 'auroraB 27s ease-in-out infinite',
        }}
      />
      <div
        className="absolute -bottom-[10%] left-[24%] h-[50vh] w-[50vw] will-change-transform"
        style={{
          background:
            'radial-gradient(closest-side, rgb(255 228 184 / 0.2), rgb(255 220 172 / 0.09) 52%, transparent 78%)',
          animation: 'auroraC 33s ease-in-out infinite',
        }}
      />

      {/* Tane — bantlanmayı kırar; döşenen küçük bir görsel */}
      <div
        className="absolute inset-0 opacity-[0.55]"
        style={{ backgroundImage: 'url(/images/doku.png)', backgroundRepeat: 'repeat' }}
      />

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
