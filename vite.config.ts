import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  assetsInclude: ['**/*.glb'],
  server: {
    /**
     * Geliştirme sunucusu geçici bir tünelle (localtunnel/cloudflared) dışarı
     * açıldığında istek `xxxxx.loca.lt` gibi bilinmeyen bir `Host` başlığıyla
     * geliyor; Vite bunu varsayılan olarak DNS rebinding koruması yüzünden
     * reddediyor. `.loca.lt` alt alan adı her tünelde rastgele değiştiği için
     * tek tek değil, uzantının tamamına izin veriliyor. Yalnızca yerel
     * geliştirmeyi etkiler, yayın derlemesiyle ilgisi yok.
     */
    allowedHosts: ['.loca.lt'],
  },
  css: {
    /**
     * Tailwind v4 burada @tailwindcss/vite eklentisiyle çalışıyor; ayrıca bir
     * PostCSS adımına ihtiyaç yok. Bu satır olmadan Vite, proje klasörünün
     * ÜSTÜNDEKİ dizinlerde postcss.config.* araması yapar; kullanıcının ana
     * klasöründe duran eski bir yapılandırma (ör. Tailwind v3) bulunursa
     * CSS'imiz yanlış sürümle işlenir ve "`@layer base` is used but no matching
     * `@tailwind base` directive is present" hatası verir.
     * Satır içi boş yapılandırma bu aramayı tamamen kapatır.
     */
    postcss: { plugins: [] },
  },
})
