# Yönetim paneli — kurulum ve kullanım

Panel, sitenin yazılarını, fotoğraflarını, yorumlarını, sertifikalarını ve
iletişim bilgilerini kod bilmeden değiştirmenizi sağlar. Adresi:

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
listesi, fotoğraf deposu ve kurallar — **herkes okuyabilir, yalnızca
yönetici listesindeki e-posta yazabilir.** (Bu kurallar gerçek bir
PostgreSQL veritabanında tek tek denendi.)

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

1. Panele girin, soldan (telefonda üstteki listeden) bölümü seçin.
2. Değiştirin. Her bölümün başında, o yazıların sitede nerede göründüğü
   yazar.
3. Alttaki **Kaydet**'e basın. "Kaydedildi. Site güncellendi." yazısını
   görünce bitti — ziyaretçiler sayfayı açtığında yeni hâlini görür.

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
- **Bölüm başlıkları** ("Sertifikalar", "Skolyoz Nedir?"…) ve **skolyoz
  açı tablosu** panelde yok: başlıklar tasarımın parçası, açı tablosu
  klinik bir ölçek.
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
e-posta ve şifreyle girilir, değişiklikler yalnızca o tarayıcıda saklanır
ve yalnızca o bilgisayardaki sitede görünür. Panelin nasıl çalıştığını
görmek için birebir. Bu mod yalnızca `npm run dev` altında var; yayına
alınan sitede asla açılmaz.
