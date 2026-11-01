# Randevu talebi — WhatsApp ve e-posta

Sitedeki randevu mektubu **randevu oluşturmaz, yalnızca talep alır.** Form
yalnızca iletişim için gerekenleri sorar: ad soyad, telefon, isteğe bağlı
e-posta, tercih edilen gün ve iletişim zamanı. Şikâyet, teşhis, tedavi
geçmişi ya da serbest mesaj alanı **bilerek yok**; sunucu da listede olmayan
bir alan gelirse isteği reddeder.

Talep **hiçbir yerde saklanmaz**: veritabanı yok, tarayıcı hafızasına da
yazılmaz. İki gönderim yolu var:

| | WhatsApp | E-posta |
|---|---|---|
| Ne olur | Hazır mesajla WhatsApp açılır, **ziyaretçi kendisi gönderir** | Talep sitenin sunucusundan doktorun e-postasına gider |
| Kurulum | Yok (doktorun WhatsApp numarası panelde) | Cloudflare'de bir kez (aşağıda) |
| Site ne der | "Mesajınız WhatsApp'ta hazır; gönder tuşuna basmadan talebiniz bize ulaşmaz" — **başarı demez**, çünkü gönderildiğini bilemeyiz | Sunucu kabul ederse "talebiniz gönderildi"; hata olursa hata ve WhatsApp seçeneği. Teslim garanti edilmez |
| Ücret | Yok | Yok (aşağıdaki koşullarla) |

E-posta kurulmadıysa (`VITE_TURNSTILE_SITE_KEY` boş) formda yalnızca
WhatsApp yolu görünür; site yine eksiksiz çalışır.

---

## E-posta yolu nasıl çalışıyor

```
Ziyaretçinin tarayıcısı
  │  Cloudflare Turnstile (bot doğrulaması, belirteç)
  ▼
POST /api/randevu  ── Cloudflare Pages Function (functions/api/randevu.ts)
  │  • yalnızca POST, aynı siteden, JSON, en fazla 4 KB
  │  • alan denetimi (src/lib/randevuKurallari.ts), fazladan alan → red
  │  • Turnstile belirteci Cloudflare'de doğrulanır
  ▼  service binding (internetten geçmez)
ufuk-kilci-randevu-eposta ── Worker (workers/randevu-eposta/)
  │  • alanlar bir kez daha denetlenir
  │  • oran sınırı: aynı ziyaretçi (IP özeti) 3, aynı telefon 2,
  │    toplam 20 talep / dakika (Cloudflare Rate Limiting, yaklaşık)
  ▼  send_email bağlaması
Cloudflare Email Service ──► doktorun DOĞRULANMIŞ e-posta adresi
```

**Neden iki parça:** Cloudflare'in resmî belgelerine göre Pages Functions'ın
desteklediği bağlamalar KV, Durable Objects, R2, D1, Vectorize, Workers AI,
Service bindings, Queues, Hyperdrive, Analytics Engine, ortam değişkenleri ve
gizli değerlerdir; **`send_email` bu listede yok.** `send_email` yalnızca
Worker'larda var. Pages Functions ise "service binding" ile bir Worker'ı
çağırabiliyor. Bu yüzden e-postayı gönderen küçük bir Worker var; herkese açık
adresi yok (`workers_dev: false`), yalnızca sitenin fonksiyonu ona ulaşabiliyor.

**Neden ücretsiz:** Email Service belgelerine göre hesaptaki **doğrulanmış hedef
adreslere** gönderim her planda (Workers Free dahil) ücretsiz; aylık kotaya ve
günlük gönderim sınırına sayılmaz; yalnızca Email Routing kurulu olması
yeterli. Gönderen adres ise Email Routing açık alan adından olmalı. Herhangi
bir adrese (ör. ziyaretçiye onay e-postası) göndermek Workers Paid ister; bu
sistem bunu **yapmıyor**, yalnızca doktora gönderiyor.

---

## Kurulum (doktorun Cloudflare hesabında, bir kez)

Hiçbir adres ya da anahtar bu depoya yazılmaz; hepsi Cloudflare'de durur.

### Ön koşul: alan adı Cloudflare'de

Email Routing, alan adının DNS'i Cloudflare'de olduğunda çalışır (alan adının
nameserver'ları Cloudflare'i gösterir). Site de zaten Cloudflare Pages'te
yayınlanacak.

> **Dikkat — mevcut e-posta:** Email Routing, alan adının gelen posta
> (MX) kayıtlarını Cloudflare'e yönlendirir. Doktor alan adında **başka bir
> sağlayıcıyla** e-posta kullanıyorsa (ör. `info@alanadi` için Google
> Workspace, Yandex, hosting firmasının postası), Email Routing'i kök alan
> adında açmak o posta kutusunu bozabilir. Bu durumda Email Routing'i bir alt
> alan adında (ör. `bildirim.alanadi`) açmak ya da önce mevcut posta
> düzenini kontrol etmek gerekir. **Bu karar alan adı belli olunca birlikte
> verilmeli.**

### 1. Alıcı adres ve gönderen alan adı

Email Service'te iki ayrı şey var ve ikisi de gerekiyor:

- **Email Routing → Destination addresses:** e-postayı *alacak* adres.
  Doğrulanınca Worker bu adrese gönderebilir — ama **bu tek başına gönderimi
  açmaz.**
- **Email Sending:** e-postayı *gönderecek* alan adı. Gönderen adres
  (`GONDEREN_EPOSTA`, ör. `randevu@alanadi`) Email Sending'e eklenmiş
  (onboard edilmiş) bir alan adından olmalı; değilse gönderim
  `E_SENDER_NOT_VERIFIED` benzeri bir hatayla reddedilir.

1. Cloudflare → **Compute** → **Email Service** → **Email Routing** →
   **Destination addresses** → talepleri alacak adresi ekleyin ve gelen
   e-postadaki **Verify email address** bağlantısına tıklayın.
2. Cloudflare → **Compute** → **Email Service** → **Email Sending** →
   **Onboard domain** → sitenin alan adını (DNS'i Cloudflare'de olan) seçin.
   Cloudflare gönderim için DNS kayıtlarını (SPF, DKIM, DMARC; `cf-bounce`
   alt alan adında) ekler. Durum **Active / Verified** olana kadar bekleyin
   (genelde dakikalar, en fazla 24 saat). Mevcut gelen posta (MX) kayıtlarına
   dokunmaz; yine de eklenen kayıtları onaylamadan önce gözden geçirin.
3. Gönderen adres için bir ad seçin, ör. `randevu@alanadi` (gerçek bir posta
   kutusu olması gerekmez; doktor "yanıtla" deyince ziyaretçinin adresine
   yanıt gider, çünkü `replyTo` ziyaretçinin e-postası).

> Plan notu: Cloudflare belgelerine göre doğrulanmış hedef adreslere gönderim
> günlük kotaya sayılmıyor; **herhangi bir** adrese gönderim Workers Paid
> ister. Bu sistem yalnızca doktorun doğrulanmış adresine gönderiyor. Yine de
> Email Sending'i eklerken ekranda bir plan uyarısı çıkarsa kurulumdan önce
> değerlendirin.

### 2. E-posta Worker'ını yayınlayın

Bilgisayarda proje klasöründe (Cloudflare hesabıyla giriş yapılmış olarak):

```bash
npx wrangler login
npx wrangler deploy --config workers/randevu-eposta/wrangler.jsonc
npx wrangler secret put ALICI_EPOSTA    --config workers/randevu-eposta/wrangler.jsonc
npx wrangler secret put GONDEREN_EPOSTA --config workers/randevu-eposta/wrangler.jsonc
```

`ALICI_EPOSTA` = 1. adımda doğrulanan adres, `GONDEREN_EPOSTA` = ör.
`randevu@alanadi`. İsterseniz `wrangler.jsonc` içindeki `send_email`
bağlamasına `"allowed_destination_addresses": ["…"]` ekleyerek Worker'ı
yalnızca o adrese gönderebilir hâle getirebilirsiniz (adres o zaman bu
dosyada, yani depoda görünür).

### 3. Turnstile

Cloudflare → **Turnstile** → **Add widget** → Hostnames: sitenin alan
adları; Widget mode: **Managed**. **Site Key** ve **Secret Key** alınır.

### 4. Pages projesini bağlayın

Cloudflare Pages → proje → **Settings**:

| Nerede | Ad | Değer |
|---|---|---|
| Variables and Secrets | `VITE_TURNSTILE_SITE_KEY` (düz metin) | Turnstile **Site Key** |
| Variables and Secrets | `TURNSTILE_SECRET_KEY` (**Secret**) | Turnstile **Secret Key** |
| Variables and Secrets | `TURNSTILE_HOSTNAMES` (önerilir) | `alanadi,www.alanadi` |
| Bindings → **Service binding** | `RANDEVU_EPOSTA` | Worker: `ufuk-kilci-randevu-eposta` |

Sonra **Retry deployment** (site anahtarı derlemede koda girer).

### 5. Deneyin

Yayındaki sitede "E-posta ile" seçip kendi bilgilerinizle bir talep gönderin;
doktorun gelen kutusuna (gerekirse istenmeyen klasörüne) bakın. Gelmezse:
Worker → **Logs** (yalnızca hata kodu yazılır, ör. `E_SENDER_NOT_VERIFIED`) ve
Email Service → gönderim günlükleri.

---

## Kişisel veriler ve KVKK

- **Toplanan:** ad soyad, telefon, isteğe bağlı e-posta, tercih edilen gün ve
  zaman aralığı. Sağlık bilgisi yok.
- **Saklanan:** hiçbir şey. Talep yalnızca e-postayla iletilir; site, sunucu
  ve tarayıcı kaydetmez. Hata günlüklerine yalnızca hata kodu yazılır.
  Oran sınırı için IP'nin kendisi değil kısaltılmış özeti kullanılır.
- **Veri hangi sağlayıcılardan geçer:**
  - E-posta yolu: **Cloudflare** (Pages, Turnstile, Worker, Email Service) →
    doktorun e-posta sağlayıcısı (doğrulanan adres hangi hizmetteyse; ör.
    Gmail ise Google). Cloudflare ve o sağlayıcının sunucuları yurt dışında
    olabilir.
  - WhatsApp yolu: bilgiler ziyaretçinin kendi cihazından **WhatsApp
    (Meta)** üzerinden gönderilir; site sunucusuna hiç gelmez.
  - Turnstile, bot doğrulaması için ziyaretçinin tarayıcısından Cloudflare'e
    teknik bilgi gönderir (yalnızca "E-posta ile" seçilince yüklenir).
- **Aydınlatma metni:** hukuki metin uydurulmadı. Formdaki onay kutusunun
  metni ve "Aydınlatma metni" bağlantısı panelde **Randevu formu**
  bölümünden değiştirilir (`appointment.consentText`, `appointment.privacyUrl`).
  Bağlantı boşken görünmez. Metni doktorun hukuk danışmanı hazırlamalı; yurt
  dışına aktarım (Cloudflare, e-posta sağlayıcısı, WhatsApp) metinde ele
  alınmalı.

## Ücretsiz plan sınırları (resmî belgelere göre, Ekim 2026)

- **Email Service:** doğrulanmış hedef adrese gönderim her planda ücretsiz,
  kotaya ve günlük sınıra sayılmaz. Hesapta en fazla 200 doğrulanmış hedef
  adres. Bir e-posta en fazla 25 MiB. Email Sending (herhangi bir alıcıya)
  hâlâ **beta** ve Workers Paid ister (aylık 3.000 e-posta dahil) — bu
  sistem kullanmıyor.
- **Workers / Pages Functions:** ücretsiz planda günde 100.000 istek
  (fonksiyon + Worker ortak). Randevu formu için fazlasıyla yeterli.
- **Rate Limiting bağlaması:** süre yalnızca 10 ya da 60 saniye; sayım
  Cloudflare konumu başına ve **yaklaşık**. Uzun süreli (ör. günlük)
  sınır için Durable Objects gerekir; veritabanı istenmediği için
  kurulmadı. Asıl koruma Turnstile; gerekirse Cloudflare → WAF →
  **Rate limiting rules** ile `/api/randevu` için ek kural eklenebilir.
- Plan ve fiyatlar değişebilir; kurulumdan önce Cloudflare'in güncel
  belgelerine bakılmalı.

## Yerelde denemek

`npm run dev` altında e-posta seçeneği görünmez (Turnstile anahtarı yok),
WhatsApp yolu denenebilir. Fonksiyon ve Worker'ı birlikte denemek için
`wrangler` gerekir (projeye eklenmedi):

```bash
npx wrangler dev --config workers/randevu-eposta/wrangler.jsonc   # e-postayı göndermez, konsola yazar
npx wrangler pages dev dist --service RANDEVU_EPOSTA=ufuk-kilci-randevu-eposta
```

`wrangler dev` `send_email` bağlamasını varsayılan olarak taklit eder:
e-posta gönderilmez, içeriği konsola ve yerel dosyaya yazılır.
