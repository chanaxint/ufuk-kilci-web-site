# Ufuk Kilci — çalışma kuralları

## Önce bunu oku

Yeni bir oturuma başlıyorsan ilk iş **`.claude/PROJE-DURUMU.md`** dosyasını
oku: projenin ne olduğu, nasıl kurulduğu, giriş sahnesinin mekaniği, elle
ayarlanmış sayılar, bilinen tuzaklar ve açık işler orada duruyor. Bir iş
bitirdiğinde o dosyayı da güncelle — sohbetler arası hafıza orası.

## Her işin sonunda (kullanıcı isteği, kalıcı kural)

Bir iş bittiğinde ve site tamamen açılabilir durumdayken **her seferinde**:

1. `npx tsc --noEmit` ve `npm run build` temiz geçsin.
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
- Yayına çıkmadan önce `src/lib/content.ts` içindeki telefon, e-posta, adres,
  Instagram/WhatsApp bağlantıları, yorumlar, "4.9 / 120+ değerlendirme" puanı ve
  sertifika yılları gerçek verilerle değiştirilmeli (`index.html` içindeki
  JSON-LD ile birlikte).
