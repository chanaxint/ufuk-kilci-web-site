# Proje durumu — Ufuk Kilci web sitesi

> Bu dosya, sohbet değiştiğinde devreye giren hafıza. Yeni bir oturuma
> başlayan herkes (ya da Claude) önce bunu okur; böylece hiçbir şey baştan
> anlatılmak zorunda kalmaz. **Bir iş bitirildiğinde bu dosya da güncellenir.**
>
> Son güncelleme: kliniğe giriş videosu eklendi (yükleme ekranından sonraki
> ilk sahne) ve başlık rengi zemine göre değişiyor.

---

## 1. İş ne?

Fizyoterapist ve osteopat **Ufuk Kilci** için tek sayfalık, etkileşimli,
Türkçe bir tanıtım sitesi. Dil Türkçe; kod yorumları da Türkçe yazılıyor.

**Değişmez tasarım kuralları (kullanıcının koyduğu):**

- Karanlık/uzay/"orb"/cyberpunk teması **yok**.
- Canlı, premium, medikal bir his; boş değil ama "animasyon çorbası" da değil.
- Kurumsal, düzenli tipografi; net hiyerarşi.
- Bölüm başlığı hapları (eyebrow pill) kaldırıldı, geri gelmeyecek.

**Değişmez teslim kuralı (her iş sonunda, hatırlatılmadan):**

1. `npx tsc --noEmit` ve `npm run build` temiz geçecek.
2. Site gerçek tarayıcıda açılıp kontrol edilecek (beyaz ekran / konsol hatası yok).
3. Geliştirme sunucusu başlatılacak.
4. Kullanıcıya çalıştırma komutları verilecek (aşağıdaki blok).

```bash
git pull origin claude/eloquent-thompson-5vbnt4
npm install        # ilk kez ya da bağımlılık değiştiyse
npm run dev        # http://localhost:5173
npm run dev:mobile # aynı Wi-Fi'daki telefon için
```

Çalışma dalı: **`claude/eloquent-thompson-5vbnt4`** (depo:
`chanaxint/ufuk-kilci-web-site`, herkese açık).

---

## 2. Teknik yığın

| Alan | Seçim |
| --- | --- |
| Uygulama | React 19.2 + TypeScript (strict, `noUnusedLocals`) + Vite 7 |
| Stil | Tailwind CSS v4, `@tailwindcss/vite` ile. Tasarım sistemi `src/index.css` içindeki `@theme` bloğunda. **`tailwind.config.js` yok.** |
| Animasyon | Motion (framer-motion) v12 + GSAP 3.15 ScrollTrigger (tüm eklentiler 3.13'ten beri ücretsiz) |
| Akıcı kaydırma | Lenis (`src/lib/useSmoothScroll.ts`) |
| 3B | three.js 0.186 + @react-three/fiber 9 + @react-three/drei 10 |
| Lottie | `lottie-react@3.1.2` — v3 API: adlandırılmış `Lottie` / `LottieLight`, `src` URL kabul ediyor (varsayılan dışa aktarım **yok**) |
| Tipografi | Manrope (başlık) · Inter (gövde) · Instrument Serif (yalnızca doktorun adı) |

`vite.config.ts` içindeki `css: { postcss: { plugins: [] } }` satırı **yük
taşıyor**: silinirse Vite proje klasörünün üstünde eski bir Tailwind v3
PostCSS yapılandırması bulup CSS'i yanlış sürümle işliyor.

---

## 3. Sayfa akışı

`src/App.tsx` sırası: Preloader → StudioBackground (sabit zemin) → CursorTrail →
ScrollProgress → Navbar → **SpineStage** → Scoliosis → ScoliosisAngles →
Testimonials → About → Certificates → Faq → Contact → Footer → MobileCallBar.
Aralarda `SectionRule` (ince ayırıcı çizgi).

- **Preloader**: açık zeminli; "Ufuk Kilci" + küçük kedi (Lottie, uzak adresten)
  + `LOADING` + üç nokta. Dolan çubuk yok. 2,4 sn sonra kendini kapatıyor.
- **Navbar**: çubuk yok, ortada wordmark, iki yanında HAKKIMDA / İLETİŞİM
  (elle çizilen alt çizgi efekti), sağda 2 çizgi → çarpı hamburger, panel
  StaggeredMenu. Panel **açık zeminli** (`bg-sand-50/95`), içindeki yazılar koyu.
- **Testimonials**: spiral kaldırıldı. Sayfa sabitleniyor ve kaydırdıkça
  yorumlar birer kâğıt gibi yukarıdan düşüp zemine yapışıyor (dönüşümler
  doğrudan DOM'a yazılıyor, React render'ı yok). Kâğıtlar eski: sararmış
  zemin, lif dokusu, soluk lekeler, kırık izi, koyulaşmış kenar ve soluk
  mürekkep — her kâğıdın tonu ve leke yeri farklı (`AGED` dizisi). Geniş ekranda sekizi de
  yerde kalıyor; dar ekranda üçlü dalgalar hâlinde geliyor, yeni kâğıt
  düşerken bir öncekinin yerini alıyor.
- **ScoliosisAngles**: yuvarlak kadran kaldırıldı; yerinde yatay ölçek
  (`ui/AngleScale.tsx`) var — ince çizgi, üzerinde duraklar, hemen altında
  dereceler. Duraklar evre sınırlarıyla aynı (0/10/25/40/50) ve sürüklerken
  de yalnızca onlara oturuyor. 3B model bölüm ekrana girmeden ~900 px önce
  yüklenmeye başlıyor.
- **Certificates**: çerçeveler zemine dayalı; tıklayınca tam ekran, imleçle eğiliyor,
  ok tuşu yok — boşluğa tıklayıp kapanıyor.

---

## 4. Giriş sahnesi (`SpineStage.tsx`) — en karmaşık kısım

Akış: **kliniğe giriş videosu** (koridor → kapı → oda → masa, kaydırmaya
kilitli) → videonun son karesi giriş fotoğrafının aynısı olduğu için
fotoğrafa çözülüyor → **yazılar ve 3B omurga beliriyor** → omurgaya
tıklayınca **kamera yaklaşıyor** (çevre görünür kalıyor, bölge adları açılıyor)
→ boşluğa tıklayınca ya da kaydırınca geri → kaydırmaya devam edilince
**kaydırmaya kilitli iniş videosu**: masa üstünden masanın altına, oradan zemine
→ zeminde sahne sayfanın kendi zeminine çözülüyor.

### 4.1 Omurganın fotoğrafa çıpalanması — `three/spinePose.ts`

3B omurga dünya koordinatıyla değil, **fotoğrafın normalize edilmiş
koordinatlarıyla** konumlanıyor; yoksa pencere oranı değişince stand kayıyor.

```ts
export const stand = { x: 0.7087, y: 0.7720 }  // pelvis dibi, görüntü kesri
export const spine = { span: 0.4980, rotY: -0.520 }
VIEW_HEIGHT = 2 * 8 * tan(35°/2) = 5.0447      // kamera z=8, fov=35
```

`coverFit(vw, vh)` `object-cover` kırpmasını çözüyor; `restPose()` her karede
yeniden hesaplanıyor. **Bu sayılara dokunulmayacak** — kullanıcı elle ayarladı.
`?ayar=1` adresiyle `PoseTuner` açılıyor (ok tuşlarıyla piksel piksel).

Omurga rengi kemik fildişi (`BONE = '#e4d3b4'`). Yakın planda bölge adları
fildişi (`#f6efe2` / `#d8c3a0` / `#e8ddca`) + katmanlı gölge; fotoğraf yakın
planda `blur(f*5px) brightness(1 - f*0.58)`.

### 4.2 Standın kolları (`public/images/stand-kollari.png`)

Pelvisin alt iki çıkıntısı standın demirinin önünde duruyordu (demir fotoğrafta,
omurga onun üstündeki WebGL katmanında). Fotoğraftan **yalnızca o iki kol**
kesilip omurganın üstüne bindirildi.

- Merkez çizgileri ölçülerek bulundu: sol `x = 1361,6 + (y−833)·1,11`,
  sağ `x = 1468,1 − (y−833)·1,14`; şerit ±3,4 piksel; yalnız `y 833–868`
  (üstte duvar açık, altta kitabın yaldızlı yazısı var).
- Fotoğrafla **aynı çerçeveleme** (`object-cover object-[70%_center]`, aynı
  2000×1116 oran) → her pencere boyutunda üst üste oturuyor. Doğrulandı:
  omurga gizlenince kare, saf fotoğrafla aynı (18/255 üstü sapan piksel yok).
- Yakın plana geçerken **siliniyor** (kullanıcı isteği: modelle birlikte gelmesin),
  iniş başlarken fotoğrafla birlikte sönüyor.
- **Dar ekranda kapalı** (`hidden lg:block`): mobilde metni okutan açık perde
  fotoğrafı yıkıyor, perdenin üstünde kalan demir yıkanmadığı için sırıtıyordu.

### 4.3 Kliniğe giriş videosu

Kullanıcının verdiği 4K klipten üretildi (8 sn, 30 fps). Son karesi giriş
fotoğrafının aynısı; ölçüldü: ölçek 1,00, 8 piksel yatay kayma — kayma
kodlarken düzeltildi (`crop=1280:714:8:5`). Çıktılar: `klinige-giris.mp4`
(720p, 1,0 MB) · `-mobil.mp4` (0,43 MB) · `.webm` (0,86 MB). Ses atıldı.

Video oynamıyor, karesi kaydırmaya kilitli. Sonunda sönerken altında zaten
giriş fotoğrafı duruyor, ardından yazılar ve omurga beliriyor.

### 4.4 İniş videosu

Kullanıcının verdiği **iki yapay zekâ klibi** birleştirildi (ffmpeg ile, yerel):

1. "Camera moving down showing books" (10 sn) — masa üstünden masanın altına
2. "Camera tilting down at desk" (8 sn) — masanın altından zemine

Toplam **17,8 sn**. Birinci klip son ~1,4 saniyesinde kamerayı geri çekiyordu
(birleşmede hayalet yapıyordu); kademeli **karşı-zoom** (1,000 → 1,042) ile
iptal edildi, ikinci klip aynı zoomla başlayıp ilk 1,6 sn'de kendi çerçevesine
dönüyor, geçiş 0,15 sn. Tam komut: `tasarim/inis/README.md`.

Dosyalar: `masa-alti-inis.mp4` (720p, 2,0 MB) · `-mobil.mp4` (854×476, 0,75 MB,
`media="(max-width: 640px)"`) · `.webm` (VP9 yedek). Kaynak sırası bilinçli:
`media` koşulunu yok sayan tarayıcı olursa herkese büyük kopya gider.

**Video oynamıyor, karesi kaydırmaya kilitli** (`video.currentTime = ilerleme`,
doğrusal eşleme). `-g 12` (yarım saniyede bir anahtar kare) ileri geri sarmayı
akıcı tutuyor. İndirme ilk kare ekrana oturduktan 1,4 sn sonra başlıyor
(`preload="none"` → `auto`), iOS için ilk dokunuşta bir kez çözme hazırlığı var.

Videonun ilk karesi giriş fotoğrafının **birebir aynısı** (1280×714'e kırpıldı,
fotoğrafın 1,7921 oranına oturtuldu) → devir görünmüyor.

### 4.5 Kaydırma sabitleri

```ts
WALK = 0.20      // kliniğe giriş videosu burada bitiyor
CROSS = 0.24     // giriş videosu sönüp yerini fotoğrafa bırakıyor
REVEAL_A = 0.225 // yazılar ve omurga belirmeye başlıyor
REVEAL_B = 0.30  // tamamen geldiler
HOLD = 0.38      // buraya kadar sahne olduğu gibi duruyor
HANDOFF = 0.035  // fotoğraftan iniş videosuna devir
FLOOR = 0.88     // kamera zemine vardı
BLOOM = 0.93     // sıcak ışık dolup sahne sayfanın zeminine çözülüyor
```

Bölüm boyu `h-[480vh] lg:h-[580vh]`.

### 4.6 Omurganın ve yazıların çıkışı

`STAND_RISE` tablosu **ölçülerek** çıkarıldı: videodaki stand bölgesi kare kare
izlenip masa üstünün kadrajda ne kadar yükseldiği bulundu. Omurga tam o hızla
yükseliyor (standın üstünden havalanmıyor). Gerçekte stand kadrajdan çıkmıyor,
kamera masa düzleminin altına inerken masanın ön kenarı önünü kapatıyor; bu
maskelenemediği için omurga ve giriş yazıları o aralıkta (2,4–4,2 sn) yavaşça
siliniyor.

**Yığın sırası (önemli):** en altta video (`z-0`), üstünde giriş fotoğrafı
(`sceneRef`, `z-10`), onun içinde takip katmanı (omurga + yazılar), en üstte
standın kolları (`z-10` katman içinde), ışık perdesi `z-20`.

---

## 5. Renk sistemi — site ahşap zeminin üstünde

Arkaplan artık sıvalı duvar değil, **inişin bittiği ceviz parke**
(`public/images/zemin-arkaplan.jpg`, sabit, üstünde `#2a1a10/46` perde +
sıcak ışık havuzları + tane + vinyet).

Zemin koyu olduğu için tipografi çevrildi — `@theme` içinde **fildişi ölçeği**:

```css
--color-ivory-50:  #fbf5ea;  /* başlıklar */
--color-ivory-100: #f2e8d8;
--color-ivory-200: #ece1cf;  /* gövde */
--color-ivory-300: #d6c6ad;  /* ikincil */
--color-ivory-400: #ab977c;
```

`body` fildişi, başlıklar fildişi, `.rule` ve `.grid-lines` açık, kaydırma
çubuğu açık, `.gradient-text` sıcak altın, gövde zemini `#4c3325`.

**Sabit başlık zemine göre renk değiştiriyor.** `--stage-photo` (0→1) giriş
sahnesi tarafından yazılıyor: 1 iken açık giriş fotoğrafı ekranda, başlık
mürekkep; 0 iken ahşap zemin ya da loş koridor, başlık fildişi. Renkler
`.nav-fg` / `.nav-fg-soft` sınıflarında `color-mix` ile karışıyor; wordmark
(ShinyText) aynı ifadeyi gradyanında kullanıyor. Giriş paragrafı her zaman
fotoğrafın üstünde olduğu için `.lead` yerine doğrudan mürekkep yazıyor.

**Koyu yazısını koruyan yüzeyler** (buralara fildişi uygulanmayacak):
yükleme ekranı (açık zemin, `.grid-lines-dark` kullanıyor), hamburger menü
paneli (`bg-sand-50/95`), `.card-surface` kâğıt kartlar, iletişim bölümünün
koyu paneli, footer (`bg-ink-950`), giriş fotoğrafının üstündeki hero metni.

Küçük seçim hapları ve gönder düğmesi koyu yerine **kâğıt rengine** geçti;
ahşabın üstünde koyu düğme kayboluyordu.

Ölçüm (yazılar gizlenip yalnız zemin örneklenerek): başlık 4,6–7,8 · gövde
3,9–6,5 kontrast.

---

## 6. Bilinen tuzaklar (tekrar düşmemek için)

- **`backdrop-filter`**, üst öğede `mask-image` **veya** `isolation: isolate`
  varsa çalışmıyor (arkaplan kökü boşalıyor).
- **`position: sticky`**, üst öğede `overflow: hidden` varsa kırılıyor.
- **Kaydırmayı kilitlerken köke `overflow: hidden` yazmak** ScrollTrigger'ı
  yeniden ölçmeye zorluyor ve sabitlenmiş bölümün ilerlemesi sıçrıyor
  (omurgaya tıklayınca sahne bir anda bölümün sonuna atlıyordu). Lenis'in
  önerdiği `.lenis-stopped { overflow: hidden }` kuralı bu yüzden yok;
  `lenis.stop()` tekerleği zaten `preventDefault` ile tutuyor. Ayrıca
  odaktayken `onUpdate` tamamen yok sayılıyor (`focusedRef`).
- **Sonuna gelmiş bir videoda `play()`** onu başa sarıyor. iOS için yapılan
  "bir kez oynat-durdur" hazırlığı bu yüzden kare konumunu geri yazıyor.
- Chromium'da **`scrollbar-color`** verilince `::-webkit-scrollbar` kuralları
  yok sayılıyor ve ok düğmeli yerel çubuk geri geliyor → `@supports not
  selector(::-webkit-scrollbar)` ile sarıldı.
- Tailwind'in **`uppercase`** sınıfı Türkçe yerelde "i" harfini "İ" yapıyor
  (LOADING → LOADİNG); büyük harfli metin doğrudan yazıldı.
- **R3F `frameloop`**: sahneler görüş alanı dışındayken `'never'`. Site
  genelindeki kasmanın tek en büyük sebebi buydu.
- **Tam ekran SVG `feTurbulence` ve büyük `blur-3xl` katmanları** girişte
  ölçülebilir takılma yapıyordu (ilk 10 sn'de uzun görev toplamı 8,9 sn).
  Tane artık döşenen küçük bir PNG (`/images/doku.png`), ışık havuzlarında
  bulanıklık yok ve alanları küçültüldü → 4,4 sn. WebGL bağlamı da yükleme
  ekranıyla birlikte değil, ilk kaydırmada (ya da en geç 4,2 sn sonra)
  kuruluyor: giriş penceresinde 3 sn'de 1 kare yerine 31 kare.
- **Prettier çalıştırma.** Projede yapılandırma yok; varsayılanlar noktalı
  virgül ekleyip bütün dosyayı bozuyor. Biçim elle korunuyor.
- **`lottie.host` konteynerden engelli** (403 / tünel hatası) — kedi burada
  doğrulanamıyor, kullanıcının makinesinde sorun değil.
- **Konteynerde GPU yok** (SwiftShader) ve test tarayıcısı **H.264 çözemiyor**
  → mp4 yerine webm yedeği oynuyor, FPS sayıları temsili değil.
- Konteynerdeki dev sunucusu **kullanıcının makinesinden erişilemez**.

---

## 7. Doğrulama alışkanlığı

Her görsel iddia gerçek Chromium'da ölçülerek doğrulanıyor:

```
/opt/pw-browsers/chromium-1194/chrome-linux/chrome
--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader
```

`playwright-core` oturum scratchpad'ine kuruluyor (`npm i playwright-core`),
`ffmpeg-static` de video/görsel işleri için oradan. Ölçüm örnekleri: dönüşüm
matrisleri, hesaplanmış stiller, örneklenmiş piksel renkleri, WCAG kontrastı,
kaydırma/sticky ofsetleri, paket boyutları, SSIM.

---

## 8. Açık işler

1. **Beyaz ekran raporu (açık).** Kullanıcı "beyaz ekranda kalıyor" dedi.
   Bende üç ortamda da açılıyor: geliştirme, üretim derlemesi ve **depodan
   temiz klon + `npm install` + `npm run dev`**. Son commit'te üst düzey hata
   sınırı eklendi (`ui/AppBoundary.tsx`): artık beyaz ekran yerine hatanın
   adı, mesajı ve bileşeni yazıyor. Kullanıcıdan beklenen: ekrandaki hata
   metni (ya da konsoldaki ilk kırmızı satır), tarayıcı/cihaz bilgisi ve
   beyazlığın en baştan mı yükleme ekranından sonra mı başladığı.
2. **Zemin turunun devamı** (kullanıcı "düzelterek gideriz" dedi):
   footer'ın zeminle ilişkisi · sertifikalara yere yaslanmış perspektif ·
   hakkımda portresinin çerçevelenmesi · yorumların yere serilmiş kâğıt notlara
   dönmesi · girişin (aydınlık klinik fotoğrafı) siteyle bağının sıkılaştırılması.
3. **Yayın öncesi içerik**: `src/lib/content.ts` içindeki telefon, e-posta,
   adres, Instagram/WhatsApp, 8 hasta yorumu, "4.9 / 120+ değerlendirme" ve
   sertifika yıl/kurumları hâlâ örnek; `index.html` içindeki JSON-LD ile
   birlikte gerçek verilerle değişecek.
4. **Kedi Lottie**: şu an uzak adresten çekiliyor. `public/animations/cat.json`
   olarak indirilip `CAT_SRC` oraya çevrilebilir; lisans kontrol edilmeli.
5. İstenirse doktor sitesine içerik eklemeleri: öncesi/sonrası vakalar, seans
   akışı, blog, Google yorumları, klinik fotoğrafları + harita.

---

## 9. Dosya haritası (kısa)

```
src/components/SpineStage.tsx        giriş sahnesi: fotoğraf + 3B + iniş videosu
src/components/three/spinePose.ts    omurganın fotoğrafa çıpası (elle ayarlı sayılar)
src/components/three/SpineStageScene.tsx  giriş sahnesinin R3F tarafı, bölge etiketleri
src/components/ui/StudioBackground.tsx    ahşap zemin arkaplanı
src/components/ui/AppBoundary.tsx    beyaz ekran yerine hata gösteren sınır
src/components/ui/SceneBoundary.tsx  3B sahne ve tembel parçalar için sınır
src/index.css                        @theme tasarım sistemi + temel katman
src/lib/content.ts                   bütün metinler ve veriler (yayın öncesi gerçekleşecek)
public/video/masa-alti-inis.*        iniş videosu (720p mp4 · mobil mp4 · webm)
public/images/klinik-masa.jpg        giriş fotoğrafı (2000×1116)
public/images/stand-kollari.png      standın iki kolu, omurganın üstüne bindirilen katman
public/images/zemin-arkaplan.jpg     sitenin ahşap zemini
tasarim/inis/README.md               iniş videosunun üretim komutları ve kaynak kareler
CLAUDE.md                            çalışma kuralları (her iş sonunda sunucu + komutlar)
```
