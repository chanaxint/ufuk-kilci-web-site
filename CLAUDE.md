# Ufuk Kilci — çalışma kuralları

## Önce bunu oku

Yeni bir oturuma başlıyorsan ilk iş **`.claude/PROJE-DURUMU.md`** dosyasını
oku: projenin ne olduğu, nasıl kurulduğu, giriş sahnesinin mekaniği, elle
ayarlanmış sayılar, bilinen tuzaklar ve açık işler orada duruyor. Bir iş
bitirdiğinde o dosyayı da güncelle — sohbetler arası hafıza orası.

## Her işin sonunda (kullanıcı isteği, kalıcı kural)

Bir iş bittiğinde ve site tamamen açılabilir durumdayken **her seferinde**:

1. `npx tsc -b` ve `npm run build` temiz geçsin. (`npx tsc --noEmit` bu projede
   hiçbir dosyayı denetlemiyor: kök `tsconfig.json` yalnızca referans veriyor.)
2. Site gerçek tarayıcıda açılıp kontrol edilsin (beyaz ekran / konsol hatası yok).
3. Geliştirme sunucusu başlatılsın.
4. Kullanıcıya çalıştırma komutları verilsin:

```bash
git pull origin claude/eloquent-thompson-5vbnt4
npm install        # ilk kez ya da bağımlılık değiştiyse
npm run dev        # http://localhost:5173
npm run dev:mobile # aynı Wi-Fi'daki telefon için
```

Bu adım hatırlatılmayı beklemez; her iş tesliminin parçasıdır.

## Notlar

- Konteynerdeki dev sunucusu kullanıcının makinesinden erişilemez; site mutlaka
  kendi bilgisayarında çalıştırılır.
- Sitenin düzenlenebilir içeriği (iletişim, yazılar, yorumlar, sertifikalar, SSS…)
  `src/lib/siteContent.ts` içindeki varsayılanlar + yönetim paneli (`/yonetim/`,
  Supabase). Kurulum: `docs/yonetim-paneli.md`. Yayından önce örnek veriler
  (e-posta, yorumlar, "4.9 / 120+" puanı, sertifikalar) panelden ya da
  varsayılanlardan gerçekleriyle değiştirilmeli; `index.html` içindeki JSON-LD
  panelden değişmez, elle güncellenir.
- Bileşenler içeriği `useContent()` ile okur; `lib/content.ts` yalnızca panelde
  olmayan sabitler (menü bağlantıları, skolyoz açı tablosu).
