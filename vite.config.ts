import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  assetsInclude: ['**/*.glb'],
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
