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
- **Certificates**: çerçeveler zemine rastgele bırakılmış gibi dağınık
  (`WIDE_SPOTS` / `NARROW_SPOTS`: her biri kendi noktası, açısı, yatıklığı
  ve ölçeğiyle). Hiçbiri bir diğerinin üstüne binmiyor (ölçüldü: beş
  pencere boyunda çakışan çift yok) ve grup paralaksı yok — yalnızca
  üzerine gelinen çerçeve kalkıyor. Belge kâğıdı yıllanmış: sıcak perde,
  kenar koyuluğu ve zeminle aynı tane. Tıklayınca tam ekran, imleçle
  eğiliyor, ok tuşu yok — boşluğa tıklayıp kapanıyor.

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

Bölüm boyu `h-[366vh] sm:h-[480vh] lg:h-[580vh]`.

### Randevu e-postası durumu (2026-11-02)

Kullanıcı Ufuk Bey'in adresini Email Routing → Destination addresses'e
ekleyip doğruladı. Bu **gönderimi açmaz**: gönderen alan adı ayrıca
Email Service → Email Sending'e eklenmeli (sıradaki adım). `send()`
arayüzü (from/to/subject/text/html/replyTo nesnesi) wrangler 4.151
türleriyle uyumlu; Worker yerel workerd'de denendi (202, 400, 405, 404,
telefon sınırı 429; e-posta `.wrangler/tmp/email` altına taklit yazıldı),
sunucu testleri 18/18. Worker'a `observability` eklendi. **Gerçek teslim
henüz yapılmadı** — çalışır diye raporlanmayacak.

### 4.5c Mobil düzeltmeler (2026-11-01, kullanıcı isteği)

- **Bölge adı omurganın yanında:** telefonda dokunulan bölgenin adı + kodu +
  alt başlığı, bölgenin sınır kutusunun hemen solunda, kutusuz (fildişi +
  `LABEL_SHADOW`) — `SpineStageScene` içindeki `isMobile` etiketleri. Üstteki
  hap yalnızca "dokunun" ipucu için; bölge seçilince siliniyor. Yer açmak
  için `mobileFocus` = `{ x: 0.5, scale: 0.66 }` (omurga sağa kaydı).
- **En alt bölge seçilemiyordu:** yakın planda görünmez "Randevu Oluştur /
  Skolyoz Tedavisi" düğmeleri pelvisin üstünde kalıp dokunuşu yutuyordu
  (sayfa kayıyordu). Odaktayken düğmeler `pointer-events-none`. Ayrıca
  `--stage-dark` > 0,5 iken `html[data-sahne-karanlik]` → başlık ve mobil
  arama çubuğu (`.sahne-silinen`) dokunuş almıyor.
- **Menü yazıları büyüdü:** `clamp(1.9rem,9vw,2.5rem)`, aralık `gap-2.5`.
- **Yorum kâğıtları (< 1024 px):** sol–sağ–sol zikzak (`NARROW`, sağdakiler
  `right` ile), her kâğıt kendi tarafının üst köşesinden çapraz giriyor;
  sonraki dalga gelince saydamlaşmadan aşağı kayıp kadrajdan çıkıyor.
  Masaüstü (`WIDE`) mantığı değişmedi.

### 4.5a Telefonda yürüyüş yok (2026-11-01, kullanıcı isteği)

`(max-width: 640px)` (videoların mobil kopyalarıyla aynı eşik) altında kliniğe
giriş videosu **hiç çizilmiyor ve indirilmiyor**; sahne doğrudan masanın
üstünde, omurga + yazılar görünür, başlık mürekkep açılıyor. Zaman çizelgesi
değişmedi: `timeline(p) = REVEAL_B + p·(1 − REVEAL_B)` ile bölüm ilerlemesi
REVEAL_B'den başlatılıyor, bölüm boyu da aynı oranda kısaldı (`h-[366vh]`) →
iniş hızı aynı. `#giris` çapası telefonda `(HERO − REVEAL_B)/(1 − REVEAL_B)`
noktasında. WebGL telefonda beklemeden kuruluyor (yürüyüşle yarışmadığı için).
İlk kare `update(st.progress)` ile kaydırma beklenmeden yazılıyor.
`klinige-giris-mobil.mp4` artık yalnızca pencere 640'ın üstüne büyütülürse
devreye girebilir (pratikte kullanılmıyor). Ölçüm: 390/375'te video isteği
yalnızca `masa-alti-inis-mobil.mp4`; 1440'ta değişiklik yok (çapa 1468 px).

### 4.5b Giriş noktası: yenileme ve logo

Kapıdan başlayan yürüyüş yalnızca **sekmedeki ilk girişte** oynuyor.
`SpineStage` içindeki görünmez `#giris` çapası, bölümün kaydırma aralığında
`HERO = (REVEAL_B + HOLD) / 2 = 0.34` noktasında duruyor: omurga ve yazılar tam
görünür, iniş başlamamış (masanın üstü).

- İlerleme `REVEAL_B`'yi geçince `sessionStorage['uk-giris-goruldu'] = '1'`
  (`lib/entry.ts`). Sekme kapanınca silinir; yeni gelen yine kapıdan girer.
- `history.scrollRestoration = 'manual'` ve `ScrollTrigger.clearScrollMemory`
  (`useSmoothScroll.ts`, modül düzeyi): tarayıcı artık kaldığınız yere dönmüyor.
- `App`: yükleme ekranı kalkınca bayrak varsa `jumpTo(heroY())` — animasyonsuz,
  Lenis'in iç hedefi de güncelleniyor.
- Ortadaki "Ufuk Kilci" yazısı `href="#giris"`; Lenis çapa işleyicisi bu çapada
  −24 px payı uygulamıyor. Azaltılmış harekette tarayıcının kendi çapa atlaması
  aynı noktaya iniyor. "İçeriğe geç" bağlantısı hâlâ `#top`.
- `SpineStageScene` → `ScrollRig` ilk karede modeli doğrudan hedef duruşa
  koyuyor. Eskiden sıfır noktasından yumuşayarak geliyordu; sahne omurga zaten
  görünürken kurulunca (yenilemeden sonra) model ekranın ortasından standa
  süzülüyordu.
- Ölçüm (1440 ve 390 genişlik): ilk giriş `scrollY 0`; iletişimden yenileme ve
  logoya tıklama `ilerleme 0.34`; yeni sekme yine `0`.

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

- **`npx tsc --noEmit` hiçbir şeyi denetlemiyor.** Kök `tsconfig.json`
  `"files": []` + referanslar; komut boş geçiyor. Gerçek denetim
  `npx tsc -b` (derlemedeki adım). Bir kez "temiz" deyip derlemede kırıldı.
- Döngü içinde aynı adla gölgelenen değişken (`const drop` hem düşüş süresi
  hem gölge derinliği) TDZ hatasıyla sayfayı düşürdü; `tsc` yakalamadı,
  `AppBoundary` ekranda gösterdi. Değişkeni yeniden adlandır.

## 7. Doğrulama alışkanlığı

Her görsel iddia gerçek Chromium'da ölçülerek doğrulanıyor:

```
/opt/pw-browsers/chromium-1194/chrome-linux/chrome
--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader
```

Tüm sayfa denetimi: `.claude/araclar/denetim.mjs` (kullanımı dosyanın başında).
Playwright konteynerde global: `/opt/node22/lib/node_modules/playwright/index.js`
(ESM'de `import pw from …; const { chromium } = pw`).

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
3. **Yayın öncesi içerik.** Telefon (0543 780 50 50), WhatsApp, Instagram
   (@fzt.ufukkilci) ve adres (350 Evler Mah. Milli İrade Cad. İŞKUR yanı
   No: 46, Daire 6-7 — Nevşehir/Merkez) **gerçek** ve `index.html` JSON-LD
   ile birlikte güncellendi. Hâlâ örnek olan: **e-posta**
   (info@ufukkilci.com, sitede ve JSON-LD'de). Yorumlar, puan, sayılar ve
   örnek sertifikalar yayından kaldırıldı (aşağıda "Yayın öncesi içerik
   temizliği"); sağlık beyanları ve KVKK metinleri doktor onayı bekliyor.
4. **Kedi Lottie**: şu an uzak adresten çekiliyor. `public/animations/cat.json`
   olarak indirilip `CAT_SRC` oraya çevrilebilir; lisans kontrol edilmeli.
5. İstenirse doktor sitesine içerik eklemeleri: öncesi/sonrası vakalar, seans
   akışı, blog, Google yorumları, klinik fotoğrafları + harita.

### Randevu formu — mektup ve zarf

`ui/LetterForm.tsx`: form gerçek bir kâğıt (satırlı alanlar, mürekkep yazı).
Gönderince kullanıcı **siteden çıkmıyor**; kâğıt önce alttan sonra üstten
katlanıp zarfa giriyor, kapak kapanıyor, mühür basılıyor. Kâğıt ve zarf aynı
ızgara hücresinde duruyor (sıralı giriş-çıkış beklenirse mektup görünmeden
sönüyordu).

Gönderim `lib/appointment.ts` üzerinden: `VITE_APPOINTMENT_ENDPOINT` tanımlıysa
oraya POST ediliyor ve "iletildi" deniyor; tanımlı değilse "hazırlandı" deyip
WhatsApp bağlantısı gösteriliyor — yalan söylemiyor. **Tarayıcı tek başına
WhatsApp mesajı gönderemez** (anahtar tarayıcıya konulamaz); seçenekler
`docs/randevu-gonderimi.md` içinde.

Doktor form servisi anahtarını aldığında **kod değişmeyecek**: `.env` içine iki
satır yeter — `VITE_APPOINTMENT_ENDPOINT` ve `VITE_APPOINTMENT_KEY`. Anahtar
doktorun kendi e-posta hesabıyla alınmalı (KVKK: veri sorumlusu klinik; ayrıca
talepler anahtarın bağlı olduğu kutuya düşer). Kullanıcının kararı: *"şuan böyle
kalsın, doktor anahtarı aldığı zaman ekleriz."*

### İletişim ve randevu bölümü iki kâğıt sayfa

`Contact.tsx` ve `LetterForm.tsx` ortak dokudan çıkıyor: `lib/paper.ts`
(`PAPER`, `GRAIN`, `RULED`, `INK`). Solda kliniğin künyesi yazılı kâğıt
(hafif `rotate(-0.5deg)`, sararan kenar, çalışma saatlerinde noktalı çizelge),
sağda doldurulup zarfa giren mektup. Koyu gradyanlı panel ve "Randevu &
İletişim" rozeti kaldırıldı; About'taki "Birlikte çalışalım" çağrı şeridi de
kaldırıldı (kullanıcı isteği).

Randevu kâğıdı hafifçe yaşlandırıldı (`AGE`): iki soluk leke, bir kırık izi ve
kenarlara doğru sararma. Yorum kâğıtlarının yarısı kadar soluk tutuldu —
kullanıcı "çok değil" dedi.

Şikâyet konusu listesi tarayıcının beyaz zemin + mavi seçim çubuğuyla açılıyordu;
`index.css` içindeki `.paper-select` ile seçenekler kâğıt tonuna çekildi
(`color-scheme: light`, `option` zemini `#f3ead6`, seçili satırda mavi vurguyu
bastırmak için `box-shadow: … inset`). Okun kendisi de `appearance-none` +
`ChevronDown` ile kâğıda uygun.

### Alt bilgi zemine oturdu

`Footer.tsx` eskiden `bg-ink-950` ile tam genişlikte koyu kahve bir bloktu;
sayfanın geri kalanı ahşap zeminin üstündeyken alt bilgi ayrı bir kutu gibi
duruyordu. Artık zemin sonuna kadar görünüyor: bölümü `.rule` çizgisi ayırıyor,
en alta doğru `rgb(26 16 9 / 0.55)` yumuşak bir perde iniyor. "UK" rozeti
kaldırıldı (kullanıcı isteği). Küçük etiketler ahşabın açık damarlarında
4,5'in altına düştüğü için ivory-400 → ivory-300 yapıldı (ölçüm: en açık
damarda 3,03 → 5,11).

### Hakkımda başlığı

Bölüm artık diğerleriyle aynı düzende: `<h2 class="title-lg">Hakkımda</h2>` +
altında `lead` cümlesi ("Tedaviye her zaman aynı soruyla başlarım: …").

### Denetim turu (kaydırma ipucu + masaüstü/mobil tarama)

- **Kaydırma ipucu** `ui/ScrollHint.tsx`: `data-kaydir` işaretli bölgelerde
  (giriş sahnesi, yorumların yapışkan alanı) kullanıcı durunca "AŞAĞI
  KAYDIRIN" çıkıyor; kaydırma olayında anında çekiliyor, 1,2 sn durunca geri
  geliyor, `lenis-stopped` (omurga odağı) sırasında gizli. Telefonda arama
  çubuğunun üstünde (`bottom-[4.6rem]`), masaüstünde `bottom-5`; omurga ipucu
  masaüstünde onun üstünde (`sm:bottom-[4.1rem]`), telefonda başlığın altında
  (`top-[5.75rem]`).
- **Fontlar yerelde**: `@fontsource-variable/manrope`, `@fontsource-variable/inter`,
  `@fontsource/instrument-serif` (400 + italik), `main.tsx`'te içe aktarılıyor;
  `index.html`'deki Google Fonts bağlantıları kaldırıldı (KVKK + yedek fonta
  düşüp kayma yok). Aile adları `Manrope Variable`, `Inter Variable`.
- **Başlık perdesi** `.nav-scrim` (index.css) + `--stage-photo` artık yürüyüş
  videosunun **fotoğrafa çözüldüğü anda** (`walkOut`) değişiyor; eskiden
  videonun 3,5–5,5. sn'sindeydi ve ölçüm ters çıktı (videonun sonunda mürekkep
  1,5 kontrast). Menü açıkken perde gizli; ≤1024 px'te `.nav-open` başlığı
  mürekkebe çeviriyor (panel tam ekran krem), çarpı her genişlikte mürekkep.
- **Yorumlar — kullanıcı isteğiyle eski hâlinde.** Ölçerek dağıtan ızgara
  (`scatter()`, 66b9816) denendi, kullanıcı elle dağıtılmış eski düzeni
  (WIDE/NARROW yüzdeleri, sabit adım) istedi; geri alındı. Bilinen bedel:
  1440×900'de bir imza hafifçe örtülüyor, 1366/1280'de dört çift binişiyor,
  telefonda üçlü dalgada kâğıtlar kısa süre okunuyor. Kullanıcı yeniden
  isterse ızgara sürümü git geçmişinde (66b9816).
- **Kaydırma ipucu çerçevesiz** (`.hint-fg`): fildişi + koyu hâle; 1024 px
  altında giriş fotoğrafının üstünde (`--stage-photo`) mürekkep + krem hâle
  (orada fotoğrafın altı krem perde). `data-ipucu-engel` işaretli bir öğe
  (yorum kâğıtları) altındaysa ipucu çıkmıyor — telefonda en alttaki
  kâğıdın imzasına biniyordu.
- **Sertifikalar**: `lg:w-[17.5rem] xl:w-[20rem]`, üçüncü nokta %68 (1024'te
  sağdan taşıyordu). Künyeler 9 px → 10,5–11 px.
- **Mobil hero**: unvan satırı telefonda gizli (başlıkta zaten var, omurgaya
  biniyordu); `pb-[7.75rem]`. Omurgaya dokununca bölge seçiliyor
  (`SpineParts` onClick → onHover, `picked`) ve adı ipucu hapında yazıyor —
  telefonda etiket çizilmediği için eskiden hiçbir ad görünmüyordu.
- Yükleme ekranı "LOADING" → "YÜKLENİYOR". Küçük yazılar 0,62 → 0,7rem civarı.

### Yönetim paneli (`/yonetim/`, Supabase) — TARİHÇE: Supabase kaldırıldı, bkz. "Panel Cloudflare'e taşındı"

Kullanıcı isteği: doktor kendi e-posta/şifresiyle girip fotoğraf, yazı,
biyografi, yorum, sertifika, SSS, iletişim — "tüm siteyi" yönetebilsin;
basit ve Türkçe.

- **İçerik modeli** `lib/siteContent.ts`: `SiteContent` tipi + varsayılanlar
  (eski `content.ts` verileri + bileşenlere gömülü metinler: hero cümlesi,
  hakkımda paragrafları/etiketleri/sayıları, bölüm açıklamaları, puan).
  `mergeContent` kayıtlıyı varsayılanın üstüne yazar; liste öğeleri boş
  şablona göre tamamlanır, türü tutmayan değer yok sayılır. Türetilenler:
  `waHref`, `telHref`, `instagramHref`, `mapsHref` (panelde yalnızca sade
  bilgi isteniyor). `LIMITS`: sertifika 5, yorum 8, sayı 2 (yerleşimler elle).
  `lib/content.ts` artık yalnızca `navLinks` + `angleStages`.
- **Sağlayıcı** `lib/ContentContext.tsx`: `useLoadedContent` (App) +
  `useContent()` (bileşenler). Yükleme ekranı içerik gelene kadar bekliyor
  (en çok 4 sn), eski metin görünüp değişmesin. Deneme modunda başka
  sekmedeki kayıt `storage` olayıyla anında yansıyor.
- **Okuma** `lib/backend.ts`: ziyaretçi sitesi Supabase kütüphanesini
  indirmiyor; tek `fetch` ile `site_content?id=eq.1&select=data`.
  Kütüphane (`@supabase/supabase-js`) yalnızca panelin dinamik parçasında
  (derlemede doğrulandı: site paketi o parçaya hiç başvurmuyor).
- **Panel** `src/admin/` + `yonetim/index.html` (Vite çok sayfa:
  `build.rollupOptions.input`). `api.ts` (giriş/çıkış/sıfırlama, kaydet =
  `upsert(...).select('id')` — boş dönerse yetki hatası sayılıyor, fotoğraf
  = tarayıcıda küçültme → WEBP, `portre` 1600 / `sertifika` 2000 px),
  `fields.tsx` (alan, liste, kart listesi, fotoğraf), `sections.tsx` (9
  bölüm + zorunlu alan kontrolü), `Editor.tsx` (yan menü / telefonda açılır
  liste, yapışkan Kaydet şeridi, kaydedilmemiş değişiklik uyarısı, Hesabım),
  `AdminApp.tsx` (giriş, şifremi unuttum, e-posta bağlantısıyla yeni şifre,
  "henüz kurulmadı"). `src/main.tsx` `/yonetim` → `/yonetim/` yönlendiriyor.
- **Üç mod** (`api.ts` `mode`): `supabase` (.env'de VITE_SUPABASE_URL +
  VITE_SUPABASE_ANON_KEY), `deneme` (yalnızca `npm run dev` ve ayar yokken:
  her giriş kabul, veri localStorage `uk-deneme-icerik`), `kurulmamis`
  (yayında ayar yoksa "Panel henüz kurulmadı", giriş formu yok).
- **Güvenlik** `supabase/kurulum.sql`: `site_content` (tek satır), RLS
  herkes okur / yalnızca `public.yonetici_mi()` yazar (security definer,
  `yoneticiler` tablosunda e-posta, harf duyarsız), depo `site-gorselleri`
  (herkese açık okuma, listeleme kuralı yok, 5 MB, webp/jpeg/png).
  Yerel PostgreSQL 16'da Supabase iskeletiyle denendi: ziyaretçi okur ama
  yazamaz; başka hesap kaydedemez, fotoğraf yükleyemez, yönetici listesini
  göremez ve kendini ekleyemez; betik iki kez çalıştırılınca da hatasız.
- **Test** (yayın derlemesi + sahte Supabase, 20/20): yanlış şifre, doğru
  giriş, 2400×3000 PNG → 1280×1600 WEBP yükleme, kaydetme jetonla, sitede ad
  ve fotoğraf, ziyaretçinin yalnızca okuma isteği, çıkış, yönetici olmayanın
  reddi, şifre sıfırlama isteği ve bağlantıyla yeni şifre. Deneme modu uçtan
  uca (1440 + 390): ad, telefon→WhatsApp, boş e-posta satırı gizleniyor,
  yorum sil/ekle (8 sınırı), fotoğraf.
- Kurulum rehberi (doktor için): `docs/yonetim-paneli.md`. `.env` artık
  `.gitignore`'da.
- Panelde bilerek olmayanlar: açı tablosu, giriş videoları/masa
  fotoğrafı, `index.html` JSON-LD.

### Randevu talepleri, yeni bölümler, canlı önizleme

Kullanıcı isteği: randevu talepleri panele gelsin; doktor siteye başlık /
yeni bölüm ekleyebilsin ("+ yeni"); siteyi önizlemede görüp istediği
fotoğrafı ve yazıyı istediği yere koyabilsin; kaydedince gerçek site
güncellensin.

- **Randevu talepleri.** `lib/appointment.ts` `sendAppointment`: Supabase
  bağlıysa `POST /rest/v1/randevu_talepleri` (anon anahtar,
  `Prefer: return=minimal` — ziyaretçinin okuma yetkisi yok), deneme
  modunda localStorage `uk-deneme-randevular`, e-posta uç noktası
  (`VITE_APPOINTMENT_ENDPOINT`) varsa ona da. Biri ulaşırsa "iletildi";
  hiçbiri yoksa WhatsApp bağlantısı, hata olursa "iletilemedi" + WhatsApp.
  Formda KVKK onay kutusu (zorunlu), görünmez tuzak alan `web_sitesi`
  (doluysa gönderilmiyor ama "iletildi" deniyor), telefon `pattern` en az 7
  rakam, alan uzunluk sınırları SQL ile aynı (`REQUEST_LIMITS`).
  Önizlemede form hiçbir yere göndermiyor (`canDeliver`).
- **SQL** (`supabase/kurulum.sql` 5. adım): `randevu_talepleri` (kimlik,
  tarih, ad, telefon, konu, mesaj, `onay` true zorunlu, `durum`
  yeni/arandi/tamamlandi, uzunluk ve "7–15 rakam" denetimleri). Sütun
  yetkileri: ziyaretçi yalnız `ad, telefon, konu, mesaj, onay` ekler
  (tarih/durum uyduramaz), yönetici okur/siler ve yalnız `durum`
  günceller. Fren tetikleyicisi (security definer): 10 dakikada toplam 30,
  aynı numaradan (son 10 rakam: 0532…/+90 532… aynı) saatte 3. Yerel
  PostgreSQL'de 25+ durumla denendi; betik iki kez çalıştırılınca hatasız.
  **Supabase daha önce kurulduysa betik bir kez daha çalıştırılmalı.**
- **Panel → Randevu talepleri** (`admin/Requests.tsx`, açılış ekranı):
  en yeni üstte, Tümü/Yeni/Arandı/Tamamlandı süzgeci, Ara (tel:) ve
  WhatsApp (`waDigits`) bağlantıları, durum düğmeleri, sil; açıkken
  dakikada bir, rozet iki dakikada bir tazeleniyor.
- **Başlıklar** `SiteContent.headings` (skolyoz, belirtiler, acilar,
  yorumlar, hakkimda, sertifikalar, sss). `*yıldız*` → `gradient-text`
  (`ui/RichText.tsx` `Emphasis`). SSS başlığındaki zorunlu `<br>` kalktı.
  İletişim başlığı kâğıt üstünde el yazısı olduğu için vurgusuz.
- **Yeni bölümler** `SiteContent.blocks` (`Block`: tür, `after` = hangi
  sabit bölümün ardından, başlık, yazı, fotoğraf + yan, alt yazı, galeri,
  düğme, menü adı). Türler: yazı, fotoğraf+yazı, galeri, büyük fotoğraf,
  duyuru (eski kâğıt). `components/CustomBlock.tsx` `BlocksAfter` her sabit
  bölümün ardında (`App.tsx`); girişten sonra çizgi blokların ardına,
  diğerlerinde önüne. Boş bölüm gerçek sitede ve menüde görünmez
  (`blockIsEmpty`). Güvenlik: bağlantılar `safeHref` (http/https, tel,
  mailto, #çapa, çıplak alan adı; `whatsapp`/`telefon` hazır seçenekleri
  içerikten çözülüyor), görseller `safeImage`; kimlikler `[\w-]{1,40}`,
  en çok 20 bölüm, galeri 12 fotoğraf (`BLOCK_LIMITS`). Menü adı verilen
  bölüm `menuLinks()` ile menüye/alt bilgiye sırasına göre giriyor.
- **Canlı önizleme** (`lib/preview.ts`, `admin/Preview.tsx`): panel siteyi
  `/?onizleme=1` çerçevesinde açıyor; site `uk-hazir` deyince taslak
  `uk-icerik` ile gidiyor (180 ms duraksamayla). Önizlemede yükleme ekranı
  yok, kapı yürüyüşü atlanıyor, içerik değişince `ScrollTrigger.refresh`.
  Site → panel: `uk-duzenle` (bölümlerdeki "✎" etiketleri; `acilar` →
  skolyoz formu, footer → genel), `uk-ekle` ("+ Buraya yeni bölüm ekle"
  çubukları). Panel → site: `uk-git` (seçili bölüme kay; bulunamazsa 2 sn
  boyunca yeniden dener), `uk-olcek` (küçültülmüş "Bilgisayar" görünümünde
  etiketler `zoom` ile okunur kalsın). Mesajlar yalnız aynı köken ve
  `window.parent` / çerçevenin kendisi arasında kabul ediliyor.
  "Bilgisayar" görünümü 1280 px çizip sığdırıyor, "Telefon" 390 px;
  telefondan açılan panelde varsayılan telefon. Düzen: xl'de form +
  önizleme yan yana (gizlenebilir, tercih localStorage `uk-panel-onizleme`),
  daha darda "Düzenle / Önizle" sekmeleri; gizliyken çerçeve yeniden
  yüklenmiyor.
- **Test**: deneme modu uçtan uca (form → panel listesi, onay kutusu
  zorunlu, tuzak alan kaydetmiyor, başlık önizlemede altın vurgulu,
  önizlemedeki çubukla fotoğraf+yazı ekleme, chip → form, kaydet → gerçek
  sitede doğru sırada, menüde, chip/çubuk yok); sahte Supabase ile yayın
  derlemesi 10/10 (insert `return=minimal` anon, ziyaretçi hiç GET yok,
  yönetici olmayan göremez, durum/silme, duyuru SSS'den sonra); telefonda
  panel (390 px) taşma yok.
### Serbest düzen (önizlemede sürükle-bırak + kılavuz çizgileri)

Kullanıcı isteği: önizlemede fotoğrafı/yazıyı tutup taşıyabilsin,
boyutlandırabilsin; ortaya ya da kenara gelince (yalnızca o zaman) çizgiler
çıksın, tam ortaya oturtabilsin.

- **Kapsam kararı:** yalnızca panelden eklenen bölümler. Sabit bölümler
  (3B giriş, yere düşen kâğıtlar, sertifika çerçeveleri) animasyona bağlı
  elle ayarlı; serbest konumlandırma onları bozardı.
- **Model** `lib/canvas.ts`: `Block.kind = 'serbest'`, `Block.canvas`
  (`bg` zemin/kağıt, `hd` yükseklik, `hm` telefon yüksekliği ya da `null`,
  `items`). Öğe: başlık / yazı / fotoğraf / düğme; `d` bilgisayar, `m`
  telefon yerleşimi. **Bütün ölçüler tuval genişliğinin yüzdesi** (x, y,
  en, boy, yazı boyu) → sitede `cqw` ile basılıyor, tuval
  `container-type: inline-size` + `aspect-ratio: 100 / H`. Böylece her
  genişlikte orantılı. Görünüm: ≥1024 px `d`; ≤639 px ve `hm` varsa `m`;
  diğer her şey alt alta akış (`flowOrder`: y'ye, aynı hizada x'e göre).
  `normalizeCanvas` sınırlıyor (en çok 30 öğe; `hm` varken bir öğenin `m`'si
  eksikse hepsi otomatiğe döner). `toCanvas` hazır bölümleri çeviriyor.
- **Site** `components/CanvasBlock.tsx` (gerçek sitede `Reveal`'li statik
  çizim). Kâğıt zeminde `.on-paper .gradient-text` koyu altın.
- **Düzenleyici** `components/CanvasEditor.tsx` — yalnızca önizlemede
  `lazy` yükleniyor (site paketine girmiyor). Sürükleme pencere
  dinleyicileriyle (alt alta akıştan serbest yerleşime geçerken DOM
  değiştiği için öğe yakalama kullanılmıyor). Mıknatıs: 7 ekran pikseli;
  hedefler x: 0/50/100 + diğer öğelerin sol/orta/sağı, y: 0/H÷2/H + diğer
  öğelerin üst/orta/alt'ı; yalnızca eşik içindeyken çizgi (`#ff3d8b`, orta
  çizgiler 2 px). Alt = mıknatıs kapalı, Shift = fotoğrafta oran. Fotoğraf
  4 köşe; yazı yan tutamaç (genişlik) + köşe (yazı boyu, orantılı); düğme
  köşe. Yazıların boyu DOM'dan ölçülüyor. Bırakınca `uk-tuval` yaması
  panele gidiyor (taşan öğe yüksekliği büyütür), panel `applyCanvasPatch`
  ile taslağa işleyip geri yolluyor; arada yerel `over` değerleri titremeyi
  önlüyor. Çift tıklama kendimiz (basış iptal edildiği için `dblclick`
  güvenilmez), basışta `window.focus()` (yoksa oklar panele gidiyordu).
  Telefonda alt alta dizilimdeyken ilk sürükleme ölçülen konumlarla telefon
  yerleşimini başlatıyor. Tutamaç/çizgi kalınlıkları `--onizleme-olcek`
  ile küçültülmüş önizlemede de okunur.
- **Panel:** `admin/Blocks.tsx` `CanvasFields` (zemin, yükseklik, telefon
  durumu + "alt alta diz", öğe ekle, öğe kartları: yazı/fotoğraf/bağlantı,
  hizalama, yazı boyu %, genişlik, yatayda ortala, öne/arkaya, kopyala,
  sil). Seçim iki yönlü (`uk-sec`). Önizleme artık yalnızca panelde bölüm
  seçilince kayıyor (`Editor` `scroll` durumu); önizlemenin içindeki
  tıklamalar onu oynatmıyor.
- **Test** (gerçek fareyle, küçültülmüş çerçevede): uzaktayken çizgi yok;
  ortaya 3 px kala dikey orta çizgi + tam ortaya oturma (608/608); tam
  ortada iki çizgi; bırakınca çizgiler gidiyor; fotoğraf köşeden büyüdü;
  taşan fotoğraf bölümü uzattı; çift tıkla yazı → panel alanı; yükseklik
  tutamacı; oklar (4 × 0,25 = 1 birim); kaydet → gerçek sitede konumlar
  önizlemeyle birebir; telefonda sürükleme telefon yerleşimini başlattı;
  hazır bölüm çevirme; 1440/820/390 taşma yok, düzenleme izi yok.

### Yayın hazırlığı (Cloudflare Pages) — yayınlanmadı, push yok

Ayrıntı ve Cloudflare ayarları: `docs/yayina-alma.md`.

- `.nvmrc` = 22, `package.json` `engines.node >=22.12.0` (lock dosyasına da).
- `public/_headers`: CSP (`script-src 'self' 'wasm-unsafe-eval'` — drei
  açılışta WebAssembly çözücüsü hazırlıyor, bu olmadan konsola CSP hatası
  düşüyordu; `style-src 'unsafe-inline'` animasyonlar için; `img-src data:
  blob: *.supabase.co`; `connect-src *.supabase.co lottie.host`;
  `worker-src blob:` Lottie ve Supabase işçisi için; `frame-src` ve
  `frame-ancestors 'self'` panel önizlemesi için — **DENY/none yazılmamalı**),
  `X-Frame-Options: SAMEORIGIN`, nosniff, Referrer-Policy, Permissions-Policy,
  COOP. `/yonetim*` → `X-Robots-Tag: noindex…` + `no-store`. `/assets/*` →
  bir yıl `immutable`. HSTS bilerek yok (alan adı kesinleşince Cloudflare'den).
- `vite/site-seo.ts` (Vite eklentisi, `tsconfig.node.json` içine alındı):
  robots.txt her derlemede; `SITE_URL` (yalnızca https kökü, değilse derleme
  durur) verilirse sitemap.xml (tek kayıt), canonical, og:url, tam adresli
  og:image ve JSON-LD `url`/`image`. Verilmezse uyarı, adres uydurulmuyor.
  Panel robots.txt'de bilerek engellenmedi (noindex görülebilsin).
- Test: `_headers`'ı uygulayan yerel sunucu + Chromium. Site 1440/390 baştan
  sona: CSP ihlali yok, WebGL, videolar (readyState 4), yazı tipleri,
  animasyonlar, Lottie (adres konteynerde kapalı olduğu için geçerli sahte
  JSON'la). Supabase'li test derlemesi (geçici klasörde, projeye anahtar
  yazılmadı) + sahte Supabase: 13/13 (giriş, talepler, fotoğraf yükle/göster,
  önizleme çerçevesi, serbest düzen düzenleyicisi, kaydet, randevu gönderimi,
  başka siteden çerçeveleme reddi).

### Yayın öncesi içerik temizliği (push yok)

- Varsayılan içerikten kaldırıldı (`siteContent.ts`): 8 örnek hasta yorumu,
  "4.9 / 120+ değerlendirme" puanı, sayılar (12+ yıl, 4.500+ seans), Hakkımda
  paragrafındaki "On iki yılı aşkın", 5 örnek sertifika (yıl/kurum/başlık) ve
  `public/images/sertifika-ornek.jpg` (silindi). Yorumlar ve sertifikalar
  boşken bölüm görünmüyor; `App.tsx` ayırıcı çizgisini de çizmiyor (çift çizgi
  olmasın), menü/alt bilgi "Sertifikalar" bağlantısını gizliyor
  (`menuLinks(content)`), Hakkımda'da sayı yokken tanıtım kutusu `lg:row-span-2`.
- Boş varsayılan listeler için `loadSaved` içinde açık şablon (`LIST_TEMPLATES`):
  `mergeContent` şablonu listenin ilk öğesinden aldığı için boş listede panel
  verisi denetlenmeden geçerdi.
- Panelde uyarı notları (yorumlar: tanıtım kuralları / hukuki görüş;
  sertifikalar: yalnızca gerçek belge; sayılar: yalnızca belgelenebilir).
- Giriş fotoğrafı ve iki video: duvardaki altı sahte diploma ("Dr. Elara
  Vance") kâğıt içleri bulanıklaştırıldı — `tasarim/belgeler/` (betik + README).
  Fotoğraf↔video geçişi korunuyor. Kalıcı çözüm: doktorun belgeleriyle yeni
  görsel (spinePose ve STAND_RISE yeniden ayarlanmalı).
- Doğrulama bekleyen içerik listesi ve KVKK eksikleri kullanıcıya raporlandı
  (yayın öncesi onay listesi).

### Hasta yorumları yayında gizli (yayın kararı kodda)

`src/lib/yayin.ts` `YORUMLAR_YAYIN_KARARI = false`: panelden/D1'den
değiştirilemez; açmak için kodda `true` + commit + dağıtım. Tarayıcı:
`src/lib/gorunurluk.ts` `yorumlarGorunur = import.meta.env.DEV || karar` →
`Testimonials` null döner, `App.tsx` ayırıcı çizgisini çizmez. Sunucu:
`functions/index.ts` ve `functions/api/icerik.ts` `yayinIcerigi()` ile
yorum listesini/girişini/puanını boşaltır (HTML'e gömülen JSON ve herkese
açık API'de yorum metni yok). Panel (`/api/yonetim/*`) tam veriyi görür,
düzenler, kaydeder, geçmişe yazar; panelde "YAYINDA GİZLİ" notu; önizleme
ziyaretçiyle aynı (gizli). `npm run dev`'de 8 kâğıt ve animasyon görünür.
Not: yer tutucu metin varsayılan içerik olarak JS paketinde duruyor
(HTML/DOM/SEO'da yok). Testler: `yorum-gizli-test.mjs` 32/32.

### Hasta yorumları yer tutucu kâğıtlarla geri geldi

Kullanıcı isteği: bölüm görünsün, kâğıtlarda "Gerçek yorumlar eklenecektir."
yazsın. Varsayılanda `LIMITS.testimonials` (8) kâğıt, isim/unvan boş. İsim ve
unvan boşken `Testimonials.tsx` yıldızları ve imza satırını çizmiyor; not
ortada `font-wordmark` ile. Puan (`rating`) boş kaldı; uydurma yorum, puan ya
da "izinle paylaşıldı" metni geri konmadı. Panelde kayıtlı içerik varsa
(ör. yorum listesi boş kaydedildiyse) varsayılan değil kayıtlı liste görünür.

### Panel Cloudflare'e taşındı: D1 + R2 + Access (push yok)

Supabase tamamen kaldırıldı (paket, env, SQL, CSP, MFA/şifre ekranları,
randevu talepleri ekranı). Gerçek Supabase projesi hiç açılmamıştı; veri
kaybı yok.

- **Sunucu** (`functions/`, Pages Functions; tür denetimi
  `tsconfig.functions.json`, Cloudflare türleri elle `_lib/cf.ts`):
  - `index.ts` (`/`): `next()` ile statik `index.html`, D1 içeriğini
    `<script id="site-icerik" type="application/json">` olarak ve
    `seo.title/description`'ı `<title>`/meta/og'ye yazar (`_lib/sayfa.ts`,
    regex; JSON'da `<`→`\u003c`). Güvenlik başlıkları + `no-cache` + ETag.
  - `api/icerik.ts` (herkese açık GET, ETag `"s<sürüm>"`, 304).
  - `api/yonetim/_middleware.ts`: Access JWT (`_lib/erisim.ts`: RS256,
    JWKS `ACCESS_TEAM_DOMAIN/cdn-cgi/access/certs` kid ile, 10 dk önbellek,
    bilinmeyen kid'de en fazla dakikada bir tazeleme; iss, aud listesi,
    exp/nbf/iat, `type=app`, e-posta `YONETICI_EPOSTALARI`'nda). Yazmalarda
    `X-Yonetim-Istegi: 1`, Origin, Sec-Fetch-Site. Ayar eksikse 503.
  - `api/yonetim/oturum|icerik|gecmis/[surum]|yedek|gorsel|temizlik`.
  - `medya/[[yol]].ts`: yalnızca `gorsel/<tür>/<yyyymm>/<uuid>.(jpg|png|webp)`;
    Cache API + immutable; nosniff + `sandbox` CSP.
- **D1** (`_lib/icerik.ts`, `migrations/0001_icerik.sql`; tablolar ilk
  kayıtta da kurulur): `icerik` tek satır (veri JSON, surum, guncelleyen,
  guncellendi) + `icerik_gecmisi` (son 50). Kayıt `taban` sürüm üzerine
  (ON CONFLICT … WHERE surum = taban) → 409 çakışma. Geri alma/yedekten
  yükleme yeni sürüm olarak. Kayıt yokken varsayılan içerik.
- **Denetim** (`_lib/denetim.ts`): `loadSaved` ile normalleştirme (bilinmeyen
  alan atılır), görsel alanları yalnızca `/…` site yolu, bağlantılar
  `safeHref`, harita https, aydınlatma `safeLinkUrl`, metin ≤ 20.000, içerik
  ≤ 1 MB.
- **R2** (`_lib/gorsel.ts`): imza baytlarıyla tür (SVG/HTML red), ≤ 6 MB,
  sunucu üretimi ad. Temizlik: güncel + 50 sürümde geçmeyen ve
  `TEMIZLIK_BEKLEME_SAAT` (vars. 24) saatten eski.
- **Ön yüz:** `lib/backend.ts` (gömülü içerik → `/api/icerik` → varsayılan;
  dev'de localStorage deneme), `ContentContext` gömülüyü ilk çizimde
  kullanır. `admin/api.ts` fetch tabanlı (`PanelError` status/surum),
  `AdminApp` yalnızca `/api/yonetim/oturum` sorar (503 kurulum, 401/403
  "Giriş gerekli" + `/cdn-cgi/access/logout`), `admin/Account.tsx`
  (Hesap ve yedekler: giriş, sürüm geçmişi, yedek, fotoğraf temizliği).
  Panelde yeni **Arama motorları (SEO)** bölümü (`content.seo`); "Hakkımda"
  etiketleri "Hizmetler ve uzmanlık etiketleri".
- **CSP:** `*.supabase.co` çıktı. `vite/baslik-denetimi.ts` `_headers` CSP'si
  ile `SITE_CSP`'yi derlemede karşılaştırır.
- **Araç:** `wrangler@4.151.0` (devDependency), `npm run cf:yerel`.
- **Testler (scratchpad):** `access-sahte.mjs` (RSA JWKS + imzalayıcı),
  `api-test.mjs --r2` 76/76 (wrangler pages dev + yerel D1/R2), tarayıcı
  E2E `panel-cf-e2e.mjs`. Gerçek Cloudflare Access/D1/R2 ile denenmedi.

### Randevu sistemi: WhatsApp + e-posta, veritabanı yok (push yok)

Kullanıcı isteği ("Sandy Labs özel randevu sistemi"): hazır form servisi ve
Supabase olmadan; sağlık bilgisi toplanmadan; yalnızca talep.

- **Alanlar** (`src/lib/randevuKurallari.ts`, form + fonksiyon + Worker ortak):
  ad (2–80), telefon (10–15 rakam), isteğe bağlı e-posta, gün (`GUNLER`),
  zaman (`ZAMANLAR`). Şikâyet seçimi ve serbest mesaj kaldırıldı; sunucu
  izinli liste dışındaki her alanı 400 ile reddeder (`IZINLI`).
- **WhatsApp:** `whatsappHref` → `wa.me/<numara>?text=…` (encodeURIComponent),
  `window.open`; site "iletildi" DEMEZ, "gönder tuşuna basmadan ulaşmaz"
  notu + yeniden açma bağlantısı. Sunucuya istek yok, Turnstile yüklenmez.
- **E-posta:** yalnızca `VITE_TURNSTILE_SITE_KEY` varsa seçenek görünür
  (`emailAvailable`). Turnstile yalnızca "E-posta ile" seçilince çizilir.
  Gönderirken "Gönderiliyor…" (alanlar kilitli); ancak 2xx gelirse zarf
  animasyonu + "talebiniz gönderildi" (teslim garanti değil metni); hata →
  form yerinde, `role="alert"` kutu + "WhatsApp ile göndermeyi seç".
- **Sunucu:** `functions/api/randevu.ts` — POST dışı 405 (`onRequest`),
  Origin, JSON, 4 KB, `denetle`, tuzak alan (202, gönderim yok), Turnstile,
  sonra `RANDEVU_EPOSTA` service binding (`epostayaIlet`, IP yalnızca SHA-256
  özeti olarak). **Pages Functions `send_email` desteklemiyor** (resmî Pages
  bindings listesinde yok) → `workers/randevu-eposta/` (workers_dev false):
  ikinci denetim, `ratelimits` (IP 3/60 sn, telefon 2/60 sn, genel 20/60 sn;
  yaklaşık, konum başına), `env.EPOSTA.send({to: ALICI_EPOSTA, from:
  GONDEREN_EPOSTA, replyTo})`. Hata kodları 429/502'ye çevrilir, günlüğe
  yalnızca kod. Doğrulanmış hedef adrese gönderim her planda ücretsiz.
- **Panel:** Randevu formu bölümü artık onay metni (`appointment.consentText`)
  ve KVKK aydınlatma bağlantısı (`appointment.privacyUrl`, `safeLinkUrl`:
  https ya da `/yol`). `complaintOptions` kaldırıldı (kayıtlı içerikte
  kalsa `mergeContent` yok sayar).
- **Kaldırılan:** doğrudan Supabase insert, deneme modunda tarayıcıya talep
  yazma, `VITE_APPOINTMENT_ENDPOINT/KEY` (Web3Forms), fonksiyonun
  `SUPABASE_URL`/`SUPABASE_SECRET_KEY` kullanımı.
- **Bilerek bırakılan (SONRA KALDIRILDI, bkz. "Panel Cloudflare'e taşındı"):** `admin/Requests.tsx` +
  `api.ts` talep fonksiyonları (artık hep boş), `kurulum.sql` içindeki
  `randevu_talepleri` tablosu ve anon ekleme politikası (belge: kurulumdan
  hemen sonra `dogrudan-eklemeyi-kapat.sql`), `dogrudan-eklemeyi-kapat.sql`.
- **Testler (scratchpad):** `eposta-test.mjs` 48/48 (fonksiyon + Worker,
  sahte siteverify/send_email/ratelimit), `randevu-e2e.mjs` 30/30 (dist +
  `_headers` + gerçek fonksiyon/Worker kodu, sahte Turnstile betiği;
  masaüstü + 390 px). Gerçek Email Service / Turnstile / Pages ile
  denenmedi.

### Sertifikalar boş çerçevelerle geri geldi

Kullanıcı isteği: bölüm görünsün, fotoğraflar boş kalsın; doktor belgeleri
gönderince yüklenecek. Varsayılanda 5 boş öğe (`siteContent.ts`,
`LIMITS.certificates` kadar). Eski örnek başlıklar (2012 lisans, Schroth…)
uydurma olduğu için geri konmadı. `Certificates.tsx`: fotoğrafsız çerçevede
4:3 boş kâğıt, künye yazısız (`min-w-[7rem]`), düğme `disabled` (büyütülmez);
`docName()` boş başlıkta "Belge". Menüdeki Sertifikalar bağlantısı ve ayırıcı
çizgi öğe sayısına bağlı olduğu için kendiliğinden geri geldi.
**Belge gelince:** görseli `public/images/sertifikalar/` altına koyup
varsayılandaki ilgili öğenin `image`/`title`/`org`/`year` alanlarını doldur
(ya da panelden yüklenir). Panelde kayıtlı içerik varsa varsayılan değil
kayıtlı liste görünür.

### Güvenlik: Turnstile + sunucu fonksiyonu, panel MFA (push yok) — TARİHÇE: MFA/Supabase kısımları kaldırıldı

Supabase güvenlik incelemesinin eksikleri. Gerçek Supabase / Turnstile
hesabı yok; hiçbir anahtar uydurulmadı.

- **Randevu sunucu akışı.** `VITE_TURNSTILE_SITE_KEY` verilince
  (`lib/appointment.ts` `serverFlow`) form talebi yalnızca `POST /api/randevu`'ya
  gider (`{ad,telefon,konu,mesaj,onay:true,token}`); yoksa eski doğrudan
  Supabase ekleme ("GEÇİŞ DÖNEMİ") ya da deneme modu.
  `components/ui/Turnstile.tsx`: betik form 600 px yaklaşınca yüklenir,
  `render=explicit`, `interaction-only`, `action: 'randevu'`; gönderimden
  sonra `resetKey` ile yeni belirteç (tek kullanımlık). Belirteç yokken
  gönderim yerine uyarı (`LetterForm` `uyari`).
- **Fonksiyon** `functions/api/randevu.ts` (+ `functions/_lib/randevu.ts`,
  `_` → adres değil): sırayla env (503) → Origin = istek adresi (403) → JSON
  (415) → ≤16 KB (413) → alan denetimi (400; `onay` boolean `true`) → tuzak
  alan `web_sitesi` doluysa 201 ama kayıt yok → Turnstile siteverify
  (`remoteip` = CF-Connecting-IP, `action` ve isteğe bağlı
  `TURNSTILE_HOSTNAMES`) → Supabase REST insert (`SUPABASE_SECRET_KEY`;
  `eyJ…` ise Authorization da, `sb_secret_…` yalnızca `apikey`). Hatalar:
  P0001 (numara freni) → 429 iletiyle, 23514 → 400, diğerleri → 502 genel ileti.
  Tür denetimi `tsconfig.functions.json` (WebWorker lib), kök referansta.
- **Ön yüz anahtar başlığı:** `lib/backend.ts` `anonHeaders` — Authorization
  yalnızca JWT (`eyJ…`) anahtarda; `sb_publishable_` JWT değil.
- **SQL** (`kurulum.sql`): `yoneticiler.mfa_zorunlu`; `yonetici_mi()` artık
  aal2 ister — ya da `mfa_zorunlu` kapalı VE doğrulanmış TOTP yoksa aal1
  yeter (ilk kurulum çalışsın). `yoneticiler` / `kurulum_ayarlari`
  anon+authenticated'a tamamen kapalı, `yonetici_mi` anon çalıştıramaz.
  Randevu tablosu: authenticated'a select/delete + yalnızca `update(durum)`.
  Doğrudan ekleme `kurulum_ayarlari.dogrudan_randevu='kapali'` işaretine
  bağlı; `supabase/dogrudan-eklemeyi-kapat.sql` işareti koyar + revoke +
  policy drop; kurulum.sql yeniden çalışsa da kapalı kalır.
- **Panel MFA** (`admin/api.ts` `mfa*`, `admin/Mfa.tsx`, `AdminApp` `'kod'`
  ekranı): girişten sonra `nextLevel=aal2 && currentLevel≠aal2` ise kod
  ekranı; Hesabım'da QR + elle anahtar ile kurulum, kapatma; MFA yokken
  panelin üstünde hatırlatma. Deneme modunda MFA yok.
- **Harita:** `safeMapsUrl` yalnızca `https:` ve noktalı alan adı; geçersizse
  adresten arama bağlantısı; panelde kırmızı uyarı.
- **CSP:** `challenges.cloudflare.com` script/frame/connect-src'de.
- **Belgeler:** `docs/yonetim-paneli.md` kurulum sırası baştan yazıldı
  (önce kayıt kapalı + Confirm email + şifre uzunluğu + TOTP açık → SQL →
  kullanıcı → URL → anahtar → Turnstile + Pages Secrets + deneme →
  doğrudan eklemeyi kapat → giriş + MFA + `mfa_zorunlu`, telefon kaybı).
  `docs/yayina-alma.md` env tablosu (Secret türleri), Functions notu.
  `.env.example` + `.dev.vars.example` (`.dev.vars` gitignore'da).
- **Yerel testler (scratchpad, depoda değil):** SQL yerel PG 16 Supabase
  iskeletinde (auth.jwt aal, auth.mfa_factors, storage taklidi) — hepsi
  geçti; fonksiyon esbuild + sahte fetch 30/30; tarayıcı uçtan uca (dist +
  `_headers` + fonksiyon, sahte Turnstile betiği ve sahte siteverify/Supabase)
  14/14. **Gerçek servislerle denenmedi:** Turnstile widget/siteverify,
  Pages Functions çalışma ortamı, gerçek Supabase (JWT `aal`,
  `auth.mfa_factors`'a security definer erişimi, MFA uç noktaları,
  `sb_secret_`/`sb_publishable_` başlık davranışı).
- Paket taramasında `sb_secret_` eşleşmesi supabase-js'in kendi kodu
  (`startsWith("sb_secret_")`), gizli değer değil.

- Konteynerdeki yazılım GPU'sunda iletişim bölümü ~2 kare/sn çiziliyor
  (kâğıt dokusu + karışım modu); önceki commit'te de aynı, gerçek
  cihazlarla ilgisi yok. Ekran görüntüsü alırken `timeout` uzun tutulmalı.

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
src/lib/siteContent.ts               düzenlenebilir içerik: tip, varsayılanlar, yeni bölümler, güvenli adresler
src/lib/content.ts                   panelde olmayan sabitler (menü, açı tablosu) + menuLinks
src/lib/preview.ts                   panel ↔ önizleme mesajları
src/components/CustomBlock.tsx       panelden eklenen bölümler, ✎ etiketleri, ekleme çubukları
src/lib/canvas.ts                    serbest düzen modeli (yüzde ölçüler, yamalar, çevirme)
src/components/CanvasBlock.tsx       serbest düzenin sitedeki çizimi
src/components/CanvasEditor.tsx      önizlemede sürükle/boyutlandır + kılavuz çizgileri
src/admin/                           yönetim paneli (Editor, Blocks, Preview, Account, sections…)
functions/index.ts                   ana sayfa: D1 içeriği + SEO HTML'e, güvenlik başlıkları
functions/api/yonetim/               panel API'si (Access JWT doğrulaması _middleware.ts'te)
functions/_lib/                      erisim (JWT), icerik (D1), denetim, gorsel (R2), http (CSP), sayfa
functions/medya/[[yol]].ts           R2 fotoğraflarını sunar
migrations/0001_icerik.sql           D1 şeması (içerik + sürüm geçmişi)
src/admin/Account.tsx                Hesap ve yedekler: sürüm geçmişi, yedek, fotoğraf temizliği
functions/api/randevu.ts             Pages Function: alan + Turnstile doğrula → e-posta Worker'ına ilet
src/components/ui/Turnstile.tsx      Turnstile widget'ı (tembel yükleme)
src/lib/randevuKurallari.ts          randevu alanları ve denetimi (form + sunucu ortak)
workers/randevu-eposta/              randevu e-postasını gönderen Worker (send_email, oran sınırı)
docs/randevu-gonderimi.md            randevu sistemi kurulumu, KVKK notları, ücretsiz plan sınırları
public/_headers                      Cloudflare yanıt başlıkları (CSP, çerçeveleme, panel noindex, önbellek)
vite/site-seo.ts                     robots.txt; SITE_URL ile sitemap.xml, canonical, og:url
docs/yayina-alma.md                  Cloudflare Pages ayarları ve yayın sonrası adımlar
public/video/masa-alti-inis.*        iniş videosu (720p mp4 · mobil mp4 · webm)
public/images/klinik-masa.jpg        giriş fotoğrafı (2000×1116; diploma kâğıtları bulanık, tasarim/belgeler/)
public/images/stand-kollari.png      standın iki kolu, omurganın üstüne bindirilen katman
public/images/zemin-arkaplan.jpg     sitenin ahşap zemini
tasarim/inis/README.md               iniş videosunun üretim komutları ve kaynak kareler
CLAUDE.md                            çalışma kuralları (her iş sonunda sunucu + komutlar)
```
