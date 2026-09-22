# Randevu talebinin doktora ulaşması

Form artık kullanıcıyı siteden çıkarmıyor: "Zarfa koy ve gönder" denince
kâğıt katlanıp zarfa giriyor ve talep arka planda gönderiliyor.

**Ama tarayıcı tek başına WhatsApp mesajı gönderemez.** WhatsApp'ın resmî
API'si bir erişim anahtarı istiyor; o anahtar tarayıcıya konulamaz, çünkü
siteyi açan herkes görür ve numarayı kullanabilir. Bu yüzden araya küçük bir
"gönderici" gerekiyor. Aşağıda iki yol var; hangisini seçerseniz bana söyleyin,
kurulumu birlikte tamamlayalım.

Site tarafında yapılacak tek şey, gönderici hazır olduğunda adresini `.env`
dosyasına yazmak:

```bash
VITE_APPOINTMENT_ENDPOINT="https://.../api/randevu"
```

Adres tanımlı değilken form yine çalışıyor; sonunda "talebiniz hazırlandı"
diyor ve kullanıcıya WhatsApp bağlantısını gösteriyor — yani kimseye yalan
söylemiyor.

---

## Yol 1 — E-posta olarak gelsin (en hızlı, ücretsiz)

[Web3Forms](https://web3forms.com) gibi bir form servisi, sunucu yazmadan
çalışır: e-posta adresinizi verirsiniz, size bir anahtar (access key) verir,
talepler e-posta olarak düşer. Telefonda WhatsApp bildirimi yerine e-posta
bildirimi alırsınız.

1. web3forms.com üzerinden e-posta adresinizle anahtar alın.
2. `.env` dosyasına iki satır yazın — **kod değişikliği gerekmiyor**:
   ```bash
   VITE_APPOINTMENT_ENDPOINT="https://api.web3forms.com/submit"
   VITE_APPOINTMENT_KEY="doktorun-aldığı-anahtar"
   ```
3. `npm run build` ile yeniden yayına alın. Form artık "talebiniz iletildi"
   diyecek ve talepler doktorun e-postasına düşecek.

**Anahtar kimin olmalı?** Doktorun. Forma ad, telefon ve şikâyet yazılıyor;
bu sağlıkla ilgili kişisel veri ve KVKK açısından veri sorumlusu klinik
olmalı. Ayrıca anahtar hangi e-posta adresine bağlıysa talepler oraya
düşer — başkasının hesabıyla kurulursa hasta bilgileri yanlış gelen kutuda
birikir ve o hesap kapandığında form sessizce ölür.

**Artısı:** on dakikada biter, bedava. **Eksisi:** WhatsApp'a değil,
e-postaya düşer.

---

## Yol 2 — Doğrudan WhatsApp'a düşsün (resmî API)

WhatsApp Cloud API (Meta) ile talep doğrudan WhatsApp'ınıza gelir. Gereken:

- Meta Business hesabı ve doğrulanmış bir **gönderici numara** (kliniğin
  kendi numarası bu iş için API'ye kaydedilir; o numara artık normal
  WhatsApp uygulamasında kullanılamaz, bu yüzden genelde ikinci bir numara
  alınır),
- bir erişim anahtarı (token),
- ve anahtarın saklanacağı küçük bir sunucu işlevi (Vercel/Netlify'da tek
  dosya).

Site Vercel'de yayına alınırsa dosya şudur — `api/randevu.ts`:

```ts
export const config = { runtime: 'edge' }

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const { name, phone, topic, message } = await req.json()

  const govde = {
    messaging_product: 'whatsapp',
    to: process.env.DOKTOR_WHATSAPP,        // ör. 905437805050
    type: 'text',
    text: {
      body: `Yeni randevu talebi\n\nAd Soyad: ${name}\nTelefon: ${phone}\nKonu: ${topic}\n${message ?? ''}`,
    },
  }

  const r = await fetch(
    `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(govde),
    },
  )

  return new Response(null, { status: r.ok ? 204 : 502 })
}
```

Sonra `.env` içine:

```bash
VITE_APPOINTMENT_ENDPOINT="/api/randevu"
```

**Dikkat:** Meta, işletmenin kendi başlattığı mesajlarda onaylı şablon
istiyor. Mesaj kendi numaranıza gideceği için pratikte sorun çıkmaz ama
hesabın ilk kurulumunda şablon onayı beklemek gerekebilir.

**Artısı:** talep gerçekten WhatsApp'a düşer. **Eksisi:** kurulum yarım gün
sürer, ikinci numara gerekebilir.

---

## Yol 3 — Şimdilik böyle kalsın

Hiçbir şey kurulmazsa form yine çalışır: kâğıt katlanır, zarf kapanır ve
kullanıcıya "talebiniz hazırlandı, isterseniz WhatsApp'tan iletin" denir.
Tek fark, gönderme adımını kullanıcının kendisinin tamamlaması.
