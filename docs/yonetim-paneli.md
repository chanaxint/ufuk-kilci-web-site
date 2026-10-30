# Yönetim paneli — kurulum ve kullanım

Panel, sitenin yazılarını, fotoğraflarını, sertifikalarını, iletişim
bilgilerini, çalışma saatlerini ve arama motorlarında görünen başlığı kod
bilmeden değiştirmenizi; siteye kendi bölümlerinizi eklemenizi sağlar.
Değişiklikleri kaydetmeden önce yan taraftaki önizlemede görürsünüz;
**Kaydet**'e basınca site hemen güncellenir (yeniden yayınlama gerekmez).
Adresi:

```
https://sitenizin-adresi.com/yonetim/
```

Randevu talepleri panele değil, WhatsApp'a ya da e-postanıza gelir
(`docs/randevu-gonderimi.md`); panelde hasta verisi tutulmaz.

## Nasıl çalışıyor

Her şey sitenin yayınlandığı **Cloudflare** hesabında; başka bir hizmete
abonelik gerekmez.

| Parça | Cloudflare hizmeti | Ne tutar |
|---|---|---|
| Site ve panel sayfaları | Pages | derlenmiş site (`dist/`) |
| Sunucu işleri | Pages Functions (`functions/`) | içeriği okur/yazar, fotoğraf alır, girişi denetler |
| İçerik | **D1** (veritabanı) `DB` | bütün yazılar tek kayıt + son 50 sürüm |
| Fotoğraflar | **R2** (depo) `MEDYA` | panelden yüklenen fotoğraflar |
| Yönetici girişi | **Access** (Zero Trust) | yalnızca izinli e-postalar panele girer |

- Ziyaretçi ana sayfayı açınca sunucu D1'deki içeriği sayfanın içine
  yerleştirir; fotoğraflar `/medya/…` adresinden R2'den gelir.
- Panel sayfası ve panel API'leri Access'in arkasında. Access önce
  e-postanıza tek kullanımlık bir kod gönderir; kodla girersiniz. Ayrıca
  sunucu her istekte Access'in imzalı belirtecini kendisi doğrular (imza,
  yayıncı, uygulama etiketi, süre, izinli e-posta). Panelde ayrı bir şifre
  yok.
- Tarayıcıda hiçbir anahtar yok; veritabanına ve depoya yalnızca sunucu
  erişir.

> Kurulum bitene kadar site bugünkü yazı ve fotoğraflarla çalışmaya devam
> eder. Panel adresine girilirse "Panel henüz kurulmadı" yazar.

---

## Kurulum (doktorun Cloudflare hesabında, bir kez)

Sırayla yapın. Hiçbir adres, anahtar ya da e-posta bu depoya yazılmaz.

### 0. Ön koşullar

1. Site Cloudflare Pages'te yayında olmalı (`docs/yayina-alma.md`).
2. Özel alan adı (ör. `ufukkilci.com`) Pages projesine **Access'ten önce**
   eklenmeli: Cloudflare'in bilinen bir kısıtı, Access politikası olan bir
   alan adının sonradan Pages'e eklenememesi.
3. Cloudflare hesabında iki adımlı doğrulama açık olsun (hesabı ele geçiren
   her şeyi değiştirebilir).

### 1. İçerik veritabanı (D1)

1. **Storage & databases** → **D1** → **Create database**.
2. Ad: `ufuk-kilci-icerik` (başka bir ad da olur). Konum ipucu: **Western
   Europe** ya da **Eastern Europe**.
3. Tablolar ilk kayıtta kendiliğinden kurulur. Elle kurmak isterseniz:
   `npx wrangler d1 execute ufuk-kilci-icerik --remote --file=migrations/0001_icerik.sql`

Veritabanı boşken site varsayılan içerikle açılır; panelde ilk **Kaydet**
bunların üzerine yazar. Boş ya da bozuk sayfa oluşmaz.

### 2. Fotoğraf deposu (R2)

1. **Storage & databases** → **R2** → **Overview**. R2 ilk kez
   kullanılıyorsa Cloudflare bir **abonelik/ödeme adımı** ister (resmî
   belge: "checkout flow"); ücretsiz kotayı aşmadıkça ücret alınmaz, ama
   bu adımda ödeme yöntemi istenebilir.
2. **Create bucket** → ad: `ufuk-kilci-medya`; **Public access kapalı
   kalsın** (r2.dev adresi açılmaz). Fotoğraflar yalnızca sitenin
   `/medya/` adresinden, yalnızca `gorsel/` klasöründen sunulur.
3. Bu depoya hasta belgesi ya da kişisel veri içeren dosya koymayın.

### 3. Pages'e bağlayın

Pages → proje → **Settings** → **Bindings** (Production):

| Tür | Ad | Hedef |
|---|---|---|
| D1 database | `DB` | `ufuk-kilci-icerik` |
| R2 bucket | `MEDYA` | `ufuk-kilci-medya` |

Önizleme (Preview) ortamına bağlamayın: önizleme dağıtımları gerçek
içeriği değiştiremesin.

### 4. Yönetici girişi (Cloudflare Access)

1. **Zero Trust** panelini açın; ilk kez açılıyorsa bir **takım adı**
   seçin (ör. `ufukkilci`) ve **Free** planı seçin (50 kullanıcıya kadar
   ücretsiz). Takım adresi: `https://<takim>.cloudflareaccess.com`.
2. **Settings** → **Authentication**: **One-time PIN** (e-postaya kod)
   açık olsun. (İsterseniz Google hesabıyla giriş de eklenebilir; o
   zaman Google hesabında iki adımlı doğrulama açık olmalı.)
3. **Access controls** → **Applications** → **Create new application** →
   **Self-hosted**:
   - Ad: `Ufuk Kilci yönetim paneli`
   - **Public hostnames** (her biri ayrı satır; Cloudflare'in yol kuralına
     göre `yonetim` alt yolları da kapsar, `yonetim/*` yine de açıkça
     eklensin):
     - `alanadi` + yol `yonetim` ve `alanadi` + yol `yonetim/*`
     - `alanadi` + yol `api/yonetim` ve `alanadi` + yol `api/yonetim/*`
     - `www` kullanılıyorsa aynı dördü `www.alanadi` için
   - **Session duration:** 24 saat (ya da daha kısa).
   - **Policy:** Action **Allow**, Include → **Emails**: doktorun e-postası
     (ve gerekiyorsa Sandy Labs geliştirici hesabı). Başka kural eklemeyin.
4. `*.pages.dev` adresi ve önizlemeler: Pages → proje → **Settings** →
   **Enable access policy**, ardından Cloudflare'in belgesindeki adımlarla
   (`pages/platform/known-issues`, "Enable Access on your *.pages.dev
   domain") hem `proje.pages.dev` hem `*.proje.pages.dev` için politika
   oluşturup aynı e-posta kuralını verin. Bu uygulamaların AUD etiketlerini
   de not edin.
   > Bu adım atlansa bile panel API'si `pages.dev` üzerinden açılmaz: sunucu
   > yalnızca bizim Access uygulamalarımızın imzalı belirtecini kabul eder.
   > Ama panel sayfasının kendisini de gizlemek için yapılmalı.
5. Her uygulamanın **Additional settings** → **Application Audience (AUD)
   Tag** değerini kopyalayın.

### 5. Pages ortam değişkenleri

Pages → **Settings** → **Variables and Secrets** (Production):

| Ad | Değer |
|---|---|
| `ACCESS_TEAM_DOMAIN` | `https://<takim>.cloudflareaccess.com` |
| `ACCESS_AUD` | AUD etiketi; birden fazla uygulama varsa virgülle |
| `YONETICI_EPOSTALARI` | Access politikasındaki e-postalar, virgülle |

İkisi gizli değil ama "Secret" olarak da eklenebilir. Biri eksikse panel
API'si hiçbir isteği kabul etmez ("Panel henüz kurulmadı"). Sonra
**Retry deployment**.

### 6. Deneyin

1. `https://alanadi/yonetim/` → Access e-posta kodu → panel açılır.
2. Bir yazıyı değiştirip **Kaydet** → siteyi yeni sekmede açın: değişiklik
   orada.
3. Bir fotoğraf yükleyip kaydedin → sitede görünüyor mu.
4. Aşağıdaki "Gerçek ortamda güvenlik testleri"ni yapın.

---

## Gerçek ortamda güvenlik testleri

Bunlar yerelde taklit ortamla denendi; gerçek Cloudflare'de bir kez elle
doğrulanmalı:

1. Gizli pencerede `https://alanadi/yonetim/` → Access giriş sayfası
   çıkmalı, panel görünmemeli.
2. İzinli olmayan bir e-postayla kod istenince kod gelmemeli / giriş
   reddedilmeli.
3. Gizli pencerede `https://alanadi/api/yonetim/oturum` → Access giriş
   sayfası ya da 401; asla e-posta dönmemeli.
4. Aynısı `https://proje.pages.dev/yonetim/`, `…/api/yonetim/oturum` ve bir
   önizleme adresi için.
5. `curl -X PUT https://proje.pages.dev/api/yonetim/icerik -H 'Content-Type: application/json' -H 'X-Yonetim-Istegi: 1' -d '{}'`
   → 401/403 (Access'in önünden geçse bile sunucu reddetmeli).
6. `curl -H 'Cf-Access-Jwt-Assertion: uydurma' https://alanadi/api/yonetim/oturum` → 401.
7. Panelden çıkış (`/cdn-cgi/access/logout`) sonrası panel yeniden kod
   istemeli.
8. Ana sayfa yanıt başlıklarında `Content-Security-Policy`,
   `X-Frame-Options: SAMEORIGIN` olmalı (tarayıcı geliştirici araçları →
   Ağ).
9. `https://alanadi/medya/gorsel/…` görseli açılmalı; `…/medya/baska/x`
   404 vermeli.

---

## Erişimi geri alma ve kurtarma

- **Birinin erişimini kaldırmak:** Zero Trust → Access → uygulama →
  politika → e-postayı silin **ve** Pages'teki `YONETICI_EPOSTALARI`'ndan
  çıkarın (ikisi ayrı kilit). Açık oturumları hemen kapatmak için Zero
  Trust → **Users** → kişi → **Revoke session**.
- **Geliştirici hesabı (Sandy Labs):** yalnızca iş sürerken listede
  tutun; iş bitince yukarıdaki gibi çıkarın.
- **Doktor e-postasına erişemiyorsa:** Cloudflare hesabına giren kişi
  politikaya yeni e-postayı ekler, `YONETICI_EPOSTALARI`'nı günceller,
  yeniden dağıtır.
- **Cloudflare hesabına erişim kaybı:** Cloudflare'in hesap kurtarma
  süreci (iki adımlı doğrulamanın yedek kodlarını saklayın).
- **Şüpheli durum:** Zero Trust → Access → **Revoke existing tokens**;
  gerekirse Access imza anahtarını Cloudflare API'siyle döndürün. Panelde
  **Hesap ve yedekler → Sürüm geçmişi**'nden hangi e-postanın ne zaman
  kaydettiğini görün, gerekirse eski sürüme dönün.

## Yedekleme ve geri yükleme

- **Panelden:** **Hesap ve yedekler → Yedek → Yedeği indir** bütün
  yazıları tek JSON dosyası olarak indirir; **Yedekten geri yükle** aynı
  dosyayı yeni sürüm olarak yükler (önce denetlenir).
- **Sürüm geçmişi:** her kayıt saklanır (son 50); **Bu sürüme dön** eski
  hâli yeni bir sürüm olarak yayınlar — o da geri alınabilir.
- **D1 Time Travel:** veritabanını son 7 gün (ücretsiz plan; ücretli 30
  gün) içindeki herhangi bir dakikaya döndürür:
  `npx wrangler d1 time-travel restore ufuk-kilci-icerik --timestamp=<UNIX zaman>`
- **Dosyaya döküm:** `npx wrangler d1 export ufuk-kilci-icerik --remote --output=icerik-yedegi.sql`
- **Fotoğraflar:** R2'de kalır. Temizlik yalnızca hiçbir sürümde
  kullanılmayan ve 24 saatten eski fotoğrafları siler. Toplu indirme için
  Cloudflare panelinden ya da R2'nin S3 uyumlu araçlarıyla (ör. `rclone`).

## Ücretsiz plan sınırları (resmî belgelere göre, Ekim 2026)

| Hizmet | Ücretsiz | Bu site için |
|---|---|---|
| Pages statik dosyalar | sınırsız | — |
| Pages Functions + Workers | günde 100.000 istek, istek başına 10 ms işlemci | her sayfa açılışı 1 istek (+ yüklenen fotoğraf başına, önbellekten önce) |
| D1 | günde 5 milyon satır okuma, 100.000 satır yazma; veritabanı en fazla 500 MB, hesapta 5 GB; Time Travel 7 gün | açılış başına ~1 satır okuma, kayıt başına ~3 yazma |
| R2 | ayda 10 GB depolama, 1 milyon yazma, 10 milyon okuma; çıkış trafiği ücretsiz | yüzlerce fotoğraf birkaç yüz MB |
| Access (Zero Trust Free) | 50 kullanıcı | 1–2 kişi |

- Sınır aşılırsa ücretsiz planda o günün istekleri başarısız olur (D1
  için 1 Eylül 2026'dan beri katı uygulanıyor); ana sayfa yine açılır ama
  varsayılan içerikle. Kötü niyetli yoğun trafikte Cloudflare **WAF →
  Rate limiting rules** ile bir kural eklenebilir.
- Büyürse **Workers Paid** (aylık 5 $) bütün sınırları çok yükseltir.
- R2 için ödeme yöntemi istenebilir (yukarıda); kota aşılmadıkça ücret
  yok.

---

## Günlük kullanım

### Kaydet ve yayın

**Kaydet**'e basınca içerik sunucuda denetlenip veritabanına yazılır ve
site hemen güncellenir; ziyaretçi sayfayı açtığında yeni hâlini görür.
İki kişi aynı anda düzenleyip ikisi de kaydederse, ikincisi "İçerik siz
düzenlerken başka bir yerden kaydedildi" uyarısı alır; değişikliğini not
edip sayfayı yeniler.

### Arama motorları (SEO)

**Arama motorları (SEO)** bölümünden sayfa başlığı (en fazla ~70
karakter) ve açıklama (~170 karakter) değişir; kaydedince sitenin HTML'ine
sunucuda yazılır.

### Hesap ve yedekler

Giriş yapılan e-posta, çıkış, sürüm geçmişi, yedek indirme/yükleme ve
kullanılmayan fotoğrafların temizliği bu ekranda.

### Yazıları ve fotoğrafları değiştirmek

1. Soldan (telefonda üstteki listeden) bölümü seçin. Bilgisayarda sağda
   sitenin **önizlemesi** açılır ve o bölüme kayar; telefonda üstteki
   **Önizle** sekmesine dokunun.
2. Değiştirin — önizleme yazdıkça güncellenir. Önizlemedeki **✎**
   etiketlerine tıklarsanız o bölümün formu açılır.
3. Alttaki **Kaydet**'e basın. "Kaydedildi. Site güncellendi." yazısını
   görünce bitti — ziyaretçiler sayfayı açtığında yeni hâlini görür.
   Kaydetmeden önce gerçek site değişmez.

- **Başlıklar:** her bölümün başlığı değiştirilebilir. Bir kelimeyi altın
  renkle vurgulamak için yıldız içine alın: `Sonucu en iyi *onlar* anlatır.`
- **Önizlemede Bilgisayar / Telefon:** sitenin iki cihazda nasıl
  göründüğünü kaydetmeden görürsünüz. Önizleme yer kaplıyorsa üstteki
  **Önizlemeyi gizle** ile kapatabilirsiniz.

### Siteye yeni bölüm eklemek (+)

Soldaki **+ Yeni bölümler**'den ya da önizlemedeki **"+ Buraya yeni
bölüm ekle"** çubuklarından birine tıklayın; bölüm tam o yere eklenir.

- **Türler:** serbest düzen · başlık ve yazı · fotoğraf ve yazı ·
  fotoğraf galerisi · büyük fotoğraf · duyuru (kâğıda yazılmış kısa not:
  tatil, yeni hizmet…).
- **Nereye?** Her bölüm sitedeki sabit bölümlerden birinin ardından gelir;
  sonradan değiştirebilirsiniz. Aynı yerdeki bölümleri **↑ ↓** ile
  sıralayın.
- **Düğme** (isteğe bağlı): randevu formuna götürsün, WhatsApp'tan
  yazsın, telefonla arasın ya da başka bir web adresine gitsin.
- **Menüde görünsün mü?** Bir ad yazarsanız bölüm üst menüde ve sayfanın
  altında o adla görünür.
- Boş bırakılan bölüm sitede görünmez. Bir sayfada en fazla 20 yeni bölüm,
  bir galeride en fazla 12 fotoğraf olabilir.

### Serbest düzen: önizlemede sürükle, boyutlandır

"Serbest düzen" bölümünde başlık, yazı, fotoğraf ve düğmeleri
önizlemenin içinde elinizle yerleştirirsiniz:

- **Taşımak:** öğeyi tutup sürükleyin.
- **Boyutlandırmak:** seçili öğenin köşesindeki beyaz kareden çekin.
  Fotoğrafta boyutu, yazıda yazı büyüklüğünü değiştirir; yazının yanlarındaki
  tutamaçlar satır genişliğini ayarlar. (Fotoğrafta Shift basılıysa oran
  korunur.)
- **Kılavuz çizgileri:** öğe tuvalin **tam ortasına**, **kenarına** ya da
  başka bir öğenin kenarına/ortasına birkaç piksel yaklaşınca pembe bir
  çizgi çıkar ve öğe tam oraya oturur. Hizada değilken çizgi görünmez.
  Ortalamak için öğeyi ortaya doğru sürüklemeniz yeter: dikey ve yatay iki
  çizgi birden çıkınca öğe tam ortadadır. (Alt tuşu basılıyken mıknatıs
  kapanır.)
- **Yazıyı yerinde değiştirmek:** yazıya çift tıklayın, yazın, Enter
  (paragrafta dışarı tıklayın).
- **İnce ayar:** öğe seçiliyken klavyedeki oklar (Shift ile büyük adım);
  **Delete** siler, **Esc** seçimi bırakır.
- **Bölümün yüksekliği:** altındaki **⇕ Bölümün yüksekliği** tutamacı. Bir
  öğeyi alta taşırırsanız bölüm kendiliğinden uzar.
- Öğe eklemek, fotoğraf seçmek, yazı boyu, hizalama, öne/arkaya alma,
  kopyalama ve silme soldaki listeden de yapılır. Önizlemede tıkladığınız
  öğe listede kendiliğinden açılır.
- **Zemin:** sitenin ahşap zemini ya da eski kâğıt.
- **Telefonda:** öğeler kendiliğinden yukarıdan aşağıya alt alta dizilir
  (her telefonda okunur kalır). Telefona özel yerleşim isterseniz
  önizlemeyi **Telefon**'a alıp bir öğeyi sürükleyin; o andan sonra telefon
  yerleşimi ayrı ayarlanır. **Telefonda yine alt alta diz** ile geri
  dönülür. Tablet gibi ara genişliklerde de alt alta dizilir.
- Hazır bölümlerden birini (fotoğraf ve yazı, galeri…) **Serbest düzene
  çevir** düğmesiyle sürüklenebilir hâle getirebilirsiniz.
- Sitedeki sabit bölümler (giriş sahnesi, yere düşen yorum kâğıtları,
  sertifikalar…) animasyonlarına göre elle yerleştirildiği için
  sürüklenmez; onların yazı ve fotoğrafları kendi bölümlerinden değişir.

- **Fotoğraf:** "Fotoğraf seç" → telefondan ya da bilgisayardan seçin.
  Büyük fotoğraflar otomatik küçültülür; site yavaşlamaz.
- **Liste öğeleri** (yorum, sertifika, soru…): **+ ekle** ile yenisi,
  **↑ ↓** ile sıralama, **✕** ile silme.
- **Vazgeçmek:** kaydetmeden önce **Geri al** her şeyi son kayda döndürür.
- Kaydetmeden sayfadan çıkmaya kalkarsanız tarayıcı uyarır.
- **Harita bağlantısı** (İletişim): yalnızca `https://` ile başlayan bir
  adres kabul edilir (Google Haritalar'da **Paylaş → Bağlantıyı kopyala**).
  Geçersiz bir adres yazılırsa panel kırmızıyla uyarır ve site
  bağlantıyı adresten kendisi üretir.

### Sınırlar (bilerek)

- **Yorumlar en fazla 8, sertifikalar en fazla 5.** Yere düşen kâğıtların
  ve çerçevelerin yerleşimi bu sayılara göre elle ayarlandı; fazlası üst
  üste binerdi. Yenisini eklemek için birini silin.
- **Skolyoz açı tablosu** panelde yok: klinik bir ölçek.
- **Giriş videoları ve masadaki fotoğraf** panelden değiştirilemez; 3B
  omurga o fotoğrafa göre yerleştirildi.
- Arama motorlarının okuduğu künye (`index.html` içindeki yapısal veri:
  telefon, adres, çalışma saatleri) panelden değişmez; bunlar değişirse
  orası da elle güncellenmeli. Sayfa başlığı ve açıklaması ise panelden
  (**Arama motorları (SEO)**) değişir.

### Bilmekte fayda var

- Değiştirilen ya da kaldırılan fotoğraflar, geri alınabilsin diye depoda
  kalır. Ara sıra **Hesap ve yedekler → Kullanılmayan fotoğraflar**'dan
  temizleyebilirsiniz.
- Cloudflare'in ücretsiz planlarında proje uykuya alınmaz; uzun süre
  girilmese de site ve panel çalışır.

---

## Bilgisayarınızda denemek

- `npm run dev` → `http://localhost:5173/yonetim/`: panel **deneme
  modunda** açılır (giriş yok, değişiklikler yalnızca o tarayıcıda). Bu mod
  yalnızca `npm run dev` altında var; yayına alınan sitede asla açılmaz.
- Sunucu fonksiyonlarıyla birlikte (yerel D1/R2): `npm run build` sonra
  `npm run cf:yerel` → `http://localhost:8788`. Panel API'si Access
  ayarları olmadan kapalıdır (503); site yerel veritabanındaki içerikle
  açılır.
