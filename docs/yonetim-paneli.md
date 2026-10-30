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

## Kurulum (bir kez, yaklaşık 15 dakika)

### 1. Supabase hesabı ve proje

1. [supabase.com](https://supabase.com) → **Start your project** → kendi
   e-postanızla kaydolun.
2. **New project** deyin:
   - **Name:** `ufuk-kilci-site` (ne isterseniz)
   - **Database Password:** güçlü bir şifre üretin ve bir yere not edin
     (panele girerken bu şifreyi kullanmayacaksınız; yalnızca Supabase'in
     kendi veritabanı şifresi).
   - **Region:** **Central EU (Frankfurt)** — veriler Avrupa'da kalsın.
3. **Create new project** → proje bir iki dakikada hazırlanır.

### 2. Tabloları ve kuralları kurun

1. Soldaki menüden **SQL Editor** → **New query**.
2. Projedeki `supabase/kurulum.sql` dosyasının **tamamını** kopyalayıp
   yapıştırın.
3. En alttaki `BURAYA-E-POSTANIZ@ornek.com` yazısını **panele giriş
   yapacağınız e-posta** ile değiştirin.
4. **Run** deyin. "Success" yazısını görmelisiniz.

Bu adım şunları kurar: sitenin yazılarının saklandığı tablo, yönetici
listesi, fotoğraf deposu, randevu talepleri tablosu ve kurallar —
**herkes siteyi okuyabilir, yalnızca yönetici listesindeki e-posta
değiştirebilir; ziyaretçi randevu talebi bırakabilir ama hiçbir talebi
göremez.** (Bu kurallar gerçek bir PostgreSQL veritabanında tek tek
denendi.)

> Paneli daha önce kurduysanız ve randevu talepleri sonradan eklendiyse:
> `supabase/kurulum.sql` dosyasını **bir kez daha** aynı şekilde çalıştırın
> (e-postanızı yine yazarak). Tekrar çalıştırmak zararsızdır; mevcut
> yazılarınız silinmez.

### 3. Giriş hesabınızı açın

1. Soldaki menüden **Authentication** → **Users** → **Add user** →
   **Create new user**.
2. E-posta: 2. adımda yazdığınız adresin **aynısı**. Şifre: panele
   girerken kullanacağınız şifre (en az 8 karakter).
3. **Auto Confirm User** kutusu işaretli olsun → **Create user**.

### 4. Başkasının hesap açmasını kapatın

1. **Authentication** → **Sign In / Providers** (bazı sürümlerde
   **Settings**).
2. **Allow new users to sign up** seçeneğini **kapatın** → kaydedin.

Böylece kimse kendine hesap açamaz. (Açsa bile yönetici listesinde
olmadığı için hiçbir şeyi değiştiremez; bu ikinci bir kilit.)

### 5. Şifre sıfırlama adresini tanıtın

1. **Authentication** → **URL Configuration**.
2. **Site URL:** sitenizin adresi, ör. `https://ufukkilci.com`
3. **Redirect URLs** → **Add URL:** `https://ufukkilci.com/yonetim/`
   (Bilgisayarınızda denemek için ayrıca `http://localhost:5173/yonetim/`)

"Şifremi unuttum" e-postasındaki bağlantı sizi buraya geri getirir.

### 6. Siteyi Supabase'e bağlayın

1. **Project Settings** → **API** (ya da **Data API** / **API Keys**).
2. İki değeri kopyalayın:
   - **Project URL** — `https://xxxxxxxx.supabase.co`
   - **anon public** anahtarı (uzun bir yazı)
3. Projenin ana klasöründe `.env` dosyası oluşturun (yoksa `.env.example`
   dosyasını kopyalayıp adını `.env` yapın) ve şu iki satırı doldurun:

   ```bash
   VITE_SUPABASE_URL="https://xxxxxxxx.supabase.co"
   VITE_SUPABASE_ANON_KEY="kopyaladığınız-anon-anahtar"
   ```

> **`service_role` ya da `secret` anahtarını ASLA buraya yazmayın.** O
> anahtar bütün kuralları aşar. Siteye yalnızca **anon public** anahtar
> girer; o anahtar zaten herkese açık olacak şekilde tasarlanmıştır,
> güvenliği 2. adımdaki kurallar sağlar.

4. Siteyi yeniden derleyip yayına alın (`npm run build`). Bilgisayarınızda
   deniyorsanız `npm run dev` yeterli.

### 7. İlk giriş

`https://sitenizin-adresi.com/yonetim/` → e-posta ve şifrenizle girin.
Sitenin bugünkü bütün yazıları panelde hazır gelir; ilk **Kaydet**'te
Supabase'e yazılır.

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
talep gelirse sistem fazlasını kabul etmez (formu dolduran programlara
karşı).

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
  **Şifremi unuttum**.

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
