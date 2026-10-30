# Yönetim paneli — kurulum ve kullanım

Panel, sitenin yazılarını, fotoğraflarını, yorumlarını, sertifikalarını ve
iletişim bilgilerini kod bilmeden değiştirmenizi; siteye kendi
bölümlerinizi eklemenizi ve sitedeki formdan gelen **randevu taleplerini**
görmenizi sağlar. Değişiklikleri kaydetmeden önce yan taraftaki
önizlemede görürsünüz. Adresi:

```
https://sitenizin-adresi.com/yonetim/
```

Panel yalnızca **sizin e-postanız ve şifrenizle** açılır. Bilgiler
[Supabase](https://supabase.com) adlı ücretsiz bir hizmette saklanır: giriş,
yazılar ve fotoğraflar orada durur. Hesabı **kendi e-postanızla** açın —
hem siteyi değiştirme yetkisi hem de veriler sizin olur.

> Kurulum bitene kadar site bugünkü yazı ve fotoğraflarla çalışmaya devam
> eder. Panel adresine girilirse "Panel henüz kurulmadı" yazar.

---

## Kurulum (bir kez, yaklaşık 30 dakika)

Adımları **bu sırayla** yapın: önce kapılar kapanır, sonra tablolar ve
hesap kurulur, en son site bağlanır.

### 1. Supabase hesabı ve proje

1. [supabase.com](https://supabase.com) → **Start your project** → kendi
   e-postanızla kaydolun. Supabase'in kendi hesap ayarlarında da iki
   adımlı doğrulamayı açın: Supabase hesabını ele geçiren, panelin bütün
   kurallarını aşabilir.
2. **New project** deyin:
   - **Name:** `ufuk-kilci-site` (ne isterseniz)
   - **Database Password:** güçlü bir şifre üretin ve bir yere not edin
     (panele girerken bu şifreyi kullanmayacaksınız; yalnızca Supabase'in
     kendi veritabanı şifresi).
   - **Region:** **Central EU (Frankfurt)** — veriler Avrupa'da kalsın.
3. **Create new project** → proje bir iki dakikada hazırlanır.

### 2. Önce kapıları kapatın (giriş ayarları)

Tabloları kurmadan **önce**:

1. **Authentication** → **Sign In / Providers** (bazı sürümlerde
   **Settings**):
   - **Allow new users to sign up** → **kapalı**. Kimse kendine hesap
     açamaz. (Açsa bile yönetici listesinde olmadığı için hiçbir şeyi
     değiştiremez; bu ikinci kilit.)
   - **Email** sağlayıcısında **Confirm email** → **açık**.
   - **Minimum password length** → en az **12**; varsa "harf + rakam"
     zorunluluğunu da seçin.
2. **Authentication** → **Multi-Factor** (bazı sürümlerde **Sign In /
   Providers** altında): **TOTP (Authenticator app)** → **Enabled**.
   Yeni projelerde zaten açıktır; kapalıysa açın. Panelde iki adımlı
   doğrulama bunun üzerine çalışır.

### 3. Tabloları ve kuralları kurun

1. Soldaki menüden **SQL Editor** → **New query**.
2. Projedeki `supabase/kurulum.sql` dosyasının **tamamını** kopyalayıp
   yapıştırın.
3. En alttaki `BURAYA-E-POSTANIZ@ornek.com` yazısını **panele giriş
   yapacağınız e-posta** ile değiştirin. Gerçek adresi **yalnızca SQL
   Editor'de** yazın; projedeki dosyaya yazıp kaydetmeyin (depo herkese
   açık olabilir).
4. **Run** deyin. "Success" yazısını görmelisiniz.

Bu adım şunları kurar: sitenin yazılarının saklandığı tablo, yönetici
listesi, fotoğraf deposu, randevu talepleri tablosu ve kurallar —
**herkes siteyi okuyabilir, yalnızca yönetici listesindeki e-posta
değiştirebilir; randevu taleplerini yalnızca yönetici görür ve
siler.** Yönetici iki adımlı doğrulamayı açtıysa, kod girilmeden açılan
bir oturum hiçbir şeyi değiştiremez ve talepleri göremez. (Bu kurallar
Supabase benzeri yerel bir PostgreSQL'de tek tek denendi; gerçek bir
Supabase projesinde henüz denenmedi.)

> Paneli daha önce kurduysanız: `supabase/kurulum.sql` dosyasını **bir kez
> daha** aynı şekilde çalıştırın (e-postanızı yine yazarak). Tekrar
> çalıştırmak zararsızdır; yazılarınız ve talepler silinmez, kapattığınız
> kapılar kapalı kalır.

### 4. Giriş hesabınızı açın

1. **Authentication** → **Users** → **Add user** → **Create new user**.
2. E-posta: 3. adımda yazdığınız adresin **aynısı**. Şifre: panele
   girerken kullanacağınız, başka hiçbir yerde kullanmadığınız şifre
   (en az 12 karakter; bir şifre yöneticisi üretsin).
3. **Auto Confirm User** kutusu işaretli olsun → **Create user**.

### 5. Şifre sıfırlama adresini tanıtın

1. **Authentication** → **URL Configuration**.
2. **Site URL:** sitenizin adresi, ör. `https://ufukkilci.com`
3. **Redirect URLs** → **Add URL:** `https://ufukkilci.com/yonetim/`
   (Bilgisayarınızda denemek için ayrıca `http://localhost:5173/yonetim/`)

"Şifremi unuttum" e-postasındaki bağlantı sizi buraya geri getirir.
Başka adres eklemeyin; joker (`*`) adresler kullanmayın.

### 6. Siteyi Supabase'e bağlayın (herkese açık anahtar)

1. **Project Settings** → **API Keys** (eski arayüzde **API**).
2. İki değeri kopyalayın:
   - **Project URL** — `https://xxxxxxxx.supabase.co`
     (**Project Settings → Data API**'de de yazar)
   - **herkese açık anahtar:** **Legacy API keys** sekmesindeki
     **anon public** anahtar (`eyJ…` ile başlar). Yeni **Publishable key**
     (`sb_publishable_…`) de kullanılabilir; site ikisini de tanır, ama bu
     proje gerçek bir Supabase hesabında yalnızca eski `anon` anahtarının
     davranışına göre hazırlandı.
3. Cloudflare Pages'te (`docs/yayina-alma.md`) ya da bilgisayarınızda
   `.env` dosyasında (yoksa `.env.example`'ı kopyalayıp adını `.env`
   yapın):

   ```bash
   VITE_SUPABASE_URL="https://xxxxxxxx.supabase.co"
   VITE_SUPABASE_ANON_KEY="kopyaladığınız-anon-anahtar"
   ```

> **`service_role` ya da `secret` (`sb_secret_…`) anahtarını ASLA buraya,
> `VITE_` ile başlayan bir değişkene ya da sitenin koduna yazmayın.** O
> anahtar bütün kuralları aşar; `VITE_` değerleri ise sitenin
> JavaScript'ine gömülür ve herkes görür. O anahtarın tek yeri 7. adımdaki
> Cloudflare **Secret** değişkenidir.

4. Siteyi yeniden derleyip yayına alın (`npm run build`). Bilgisayarınızda
   deniyorsanız `npm run dev` yeterli.

### 7. Randevu formunu bot korumasıyla sunucuya bağlayın (Turnstile)

İlk kurulumda form, talebi doğrudan Supabase'e yazar (**geçiş dönemi**).
Formu otomatik programlara karşı korumak için talep, Cloudflare
Turnstile doğrulamasından geçip sitenin kendi sunucu fonksiyonu
(`/api/randevu`, `functions/api/randevu.ts`) üzerinden kaydedilmeli.
Bunun için site Cloudflare Pages'te yayında olmalı.

1. **Cloudflare** → **Turnstile** → **Add widget**:
   - **Hostnames:** sitenin alan adları (ör. `ufukkilci.com`,
     `www.ufukkilci.com`).
   - **Widget mode:** **Managed**.
   - Size iki anahtar verir: **Site Key** (herkese açık) ve **Secret Key**
     (gizli).
2. **Cloudflare Pages** → proje → **Settings** → **Variables and Secrets**
   (Production):

   | Ad | Tür | Değer |
   |---|---|---|
   | `VITE_TURNSTILE_SITE_KEY` | düz metin | Turnstile **Site Key** |
   | `TURNSTILE_SECRET_KEY` | **Secret** | Turnstile **Secret Key** |
   | `SUPABASE_URL` | düz metin ya da Secret | Supabase Project URL |
   | `SUPABASE_SECRET_KEY` | **Secret** | Supabase → API Keys → **Secret key** (`sb_secret_…`) ya da Legacy → **service_role** |
   | `TURNSTILE_HOSTNAMES` | düz metin (önerilir) | `ufukkilci.com,www.ufukkilci.com` |

   Gizli değerler yalnızca sunucu fonksiyonunda okunur, tarayıcıya hiç
   gitmez. Eksik biri varsa fonksiyon talebi almaz (503) ve ziyaretçiye
   WhatsApp bağlantısı gösterilir.
3. **Retry deployment** ile yeniden derleyin (`VITE_TURNSTILE_SITE_KEY`
   derlemede koda girer).
4. **Deneyin:** yayındaki siteden bir deneme talebi gönderin → panelde
   **Randevu talepleri**'nde görünmeli. Görünmüyorsa Pages →
   **Functions** → günlüklere bakın; 5. adıma geçmeyin.
5. **Doğrudan eklemeyi kapatın:** Supabase → **SQL Editor** →
   `supabase/dogrudan-eklemeyi-kapat.sql` dosyasının tamamı → **Run**.
   Artık talep yalnızca Turnstile'dan geçip sunucu üzerinden kaydedilir;
   herkese açık anahtarla doğrudan talep yazılamaz.
6. Bir deneme talebi daha gönderip panelde gördüğünüzü doğrulayın.

> Sunucu akışında sorun çıkarsa kapıyı geçici olarak yeniden açmak için:
> SQL Editor'de
> `delete from public.kurulum_ayarlari where anahtar = 'dogrudan_randevu';`
> ve ardından `kurulum.sql`'i yeniden çalıştırın; Pages'ten
> `VITE_TURNSTILE_SITE_KEY`'i silip yeniden derleyin.

### 8. İlk giriş ve iki adımlı doğrulama

1. `https://sitenizin-adresi.com/yonetim/` → e-posta ve şifrenizle girin.
   Sitenin bugünkü bütün yazıları panelde hazır gelir; ilk **Kaydet**'te
   Supabase'e yazılır.
2. **Hesabım** → **İki adımlı doğrulama** → **İki adımlı doğrulamayı aç**.
   Telefonunuzdaki doğrulama uygulamasıyla (Google Authenticator,
   Microsoft Authenticator, 1Password…) QR kodu okutun, uygulamanın
   gösterdiği 6 haneli kodu yazın. Bundan sonra her girişte şifreden sonra
   kod istenir. Panelde hasta bilgileri olduğu için **açmanız güçlü
   biçimde önerilir**; açılana kadar panelin üstünde bir hatırlatma durur.
3. Kodun **zorunlu** olması için (önerilir) Supabase → SQL Editor:

   ```sql
   update public.yoneticiler set mfa_zorunlu = true
   where lower(email) = lower('panele-giris-epostaniz');
   ```

   Bunu yapmadan da, doğrulamayı bir kez açtığınızda kodsuz oturumlar
   hiçbir şeyi değiştiremez (Supabase kodsuz bir oturumun doğrulamayı
   kapatmasına da izin vermez). `mfa_zorunlu` ek bir kilittir: doğrulama
   herhangi bir yoldan silinse bile kodsuz giriş işe yaramaz. **Önce 2.
   adımı bitirin:** doğrulama açılmadan `mfa_zorunlu` açılırsa panelde
   hiçbir şey kaydedilemez.

> **Telefonunuzu kaybederseniz:** Supabase'e (kendi hesabınızla) girip
> **SQL Editor**'de eski doğrulamayı silin ve zorunluluğu geçici olarak
> kaldırın:
>
> ```sql
> delete from auth.mfa_factors
> where user_id = (select id from auth.users where lower(email) = lower('panele-giris-epostaniz'));
> update public.yoneticiler set mfa_zorunlu = false
> where lower(email) = lower('panele-giris-epostaniz');
> ```
>
> Sonra panele girip doğrulamayı yeni telefonla yeniden açın ve
> `mfa_zorunlu`'yu tekrar `true` yapın.

---

## Günlük kullanım

### Randevu talepleri

Panel açılınca ilk bu ekran gelir. Sitedeki randevu mektubunu dolduran
her hasta burada görünür; yeni talep sayısı menüde rozetle yazar.

- **Ara** telefonu açar, **WhatsApp'tan yaz** hastaya WhatsApp'ta yazar.
- Aradıktan sonra **Arandı**, iş bitince **Tamamlandı** deyin; üstteki
  düğmelerle yalnızca yenileri ya da tamamlananları görebilirsiniz.
- İşi biten talebi **Sil** ile kaldırabilirsiniz (geri alınamaz).
- Liste açıkken dakikada bir kendiliğinden yenilenir.

Formda hastanın "bilgilerimin randevu için kullanılmasını kabul ediyorum"
kutusunu işaretlemesi zorunludur. Aynı numaradan kısa sürede çok sayıda
talep gelirse sistem fazlasını kabul etmez; Turnstile kuruluysa (7. adım)
formu dolduran programlar da sunucuda elenir.

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
- **Şifre değiştirmek:** **Hesabım** bölümü. Unutursanız giriş ekranında
  **Şifremi unuttum**. İki adımlı doğrulama da **Hesabım**'dan açılır ve
  kapatılır.
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
- Arama motorlarının okuduğu künye (`index.html` içindeki yapısal veri)
  panelden değişmez; telefon ya da adres değişirse orası da elle
  güncellenmeli.

### Bilmekte fayda var

- Supabase'in ücretsiz planında proje **uzun süre hiç kullanılmazsa**
  uykuya alınır. Sitenize ziyaretçi geldikçe bu olmaz. Olursa Supabase
  panelinde projeyi açıp **Restore** demek yeter; o sürede site varsayılan
  yazılarla açılır, bozulmaz.
- Silinen fotoğraflar depoda kalır (yer kaplar ama sitede görünmez).
  Ücretsiz planın 1 GB alanı yüzlerce fotoğrafa yeter.

---

## Bilgisayarınızda denemek (Supabase olmadan)

`npm run dev` ile açıp `http://localhost:5173/yonetim/` adresine girin.
Supabase bağlı değilken panel **deneme modunda** açılır: herhangi bir
e-posta ve şifreyle girilir, değişiklikler (ve sitedeki formdan
gönderilen randevu talepleri) yalnızca o tarayıcıda saklanır ve yalnızca
o bilgisayardaki sitede görünür. Panelin nasıl çalıştığını
görmek için birebir. Bu mod yalnızca `npm run dev` altında var; yayına
alınan sitede asla açılmaz.
