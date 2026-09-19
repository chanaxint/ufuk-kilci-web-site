# Ufuk Kilci — Fizyoterapist & Osteopat

Fizyoterapist ve osteopat **Ufuk Kilci** için geliştirilen, etkileşimli ve hareketli tek sayfalık
web arayüzü. Aydınlık, sıcak ve kurumsal bir medikal-premium tasarım dili kullanır; karanlık,
uzay veya cyberpunk temalardan kaçınır.

## Teknolojiler

| Alan | Seçim |
| --- | --- |
| Uygulama | React 19 + TypeScript + Vite 7 |
| Stil | Tailwind CSS v4 (`src/index.css` içinde `@theme` ile tanımlı tasarım sistemi) |
| Animasyon | Motion (framer-motion v12) + GSAP ScrollTrigger |
| Akıcı kaydırma | Lenis |
| 3B | three.js + @react-three/fiber + @react-three/drei |
| Tipografi | Manrope (başlık) + Inter (gövde) — Google Fonts |

## Komutlar

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc + vite build → dist/
npm run preview
npm run typecheck
npm run model      # assets/spine-draco.glb → public/models/spine.glb (Draco açma)
```

## Sayfa yapısı

`src/App.tsx` sıralamayı belirler (parantez içindekiler taslaktaki bölüm numaraları):

1. **Preloader** — doktorun adı ve unvanı harf harf açılır, ilerleme çubuğu dolar, ekran yukarı
   kayarak sahneyi açar.
2. _(Ayrılmış alan)_ **Scroll-bound video intro** — omurga videosu projeye eklendiğinde
   `App.tsx` içindeki işaretli yoruma `<VideoIntro />` olarak yerleştirilecek.
3. **SpineStage (1–4)** — sticky 3B sahne, GSAP ScrollTrigger ile sürülen dört durak.
4. **Scoliosis (5)** — "Skolyoz Nedir?", üç anatomik düzlem, sırayla beliren belirti listesi.
5. **ScoliosisAngles (6)** — Cobb açısına göre eğilen 3B omurga + evre skalası.
6. **Testimonials (7)** — iki yönde kesintisiz kayan yorum şeridi, üzerine gelince durur.
7. **Process (8)** — sabit sol panel, scroll ile sırayla devralan üç adım.
8. **Services** — imleci takip eden ışık lekeli tedavi kartları.
9. **About (9)** — bento ızgara: fotoğraf, tanıtım, sayılar, yaklaşım kartları, randevu kutusu.
10. **Certificates (10)** — prosedürel sıva dokulu loş duvar; ahşap/altın çerçeveler, mühürlü
    kâğıt sertifikalar, fare hareketine bağlı CSS 3B paralaks ve imleci takip eden sıcak ışık.
11. **Faq**, **Contact (11)** (WhatsApp'a hazır mesaj gönderen randevu formu), **Footer**.
12. Mobilde ekran altına sabitlenen hızlı iletişim çubuğu.

## Etkileşimli 3B omurga

- Model: `public/models/spine.glb` (kaynak: `assets/spine-draco.glb`, Meshy çıktısı).
  Orijinal dosya Draco ile sıkıştırılmıştı; tarayıcıda ek decoder yüklemesi gerekmesin diye
  `npm run model` ile açılmış hâli yayınlanıyor.
- Sahne `React.lazy` ile yükleniyor ve WebGL bağlamı yalnızca bölüm görünüme yaklaşınca kuruluyor
  (three.js ana pakete girmiyor, ayrı chunk olarak geliyor).
- **Döndürme / yakınlaştırma:** `OrbitControls` (pan kapalı, seçim yokken yavaş otomatik dönüş).
- **Exploded view:** Model tek parça geldiği için üçgenler, ağırlık merkezlerinin
  yüksekliğine göre dört anatomik bölgeye ayrılıp ayrı BufferGeometry'lere bölünür
  (`src/lib/spineGeometry.ts`). Üzerine gelinen bölge dışa kayar, komşuları hafifçe
  uzaklaşır, bölge rengiyle vurgulanır ve `drei/Html` ile camsı bir etiket açılır.
- **Bölge eşlemesi:** Model tek parça (single-mesh) bir GLB olduğundan omurlar ayrı node
  olarak gelmiyor. Bu yüzden raycast sonucu gelen kesişim noktası modelin yerel yükseklik oranına
  çevriliyor ve `src/lib/spine.ts` içindeki anatomik haritaya eşleniyor:

  | Bölge | Normalize aralık | Kod |
  | --- | --- | --- |
  | Servikal | 0.80 – 1.00 | C1 – C7 |
  | Torakal | 0.47 – 0.80 | T1 – T12 |
  | Lomber | 0.30 – 0.47 | L1 – L5 |
  | Sakrum & Pelvis | 0.00 – 0.30 | S1 – S5 / Koksiks |

  Seçilen bölgenin yaklaşık omur seviyesi de (T6 gibi) hesaplanıp etikette gösteriliyor.
  Aralıklar modelin geometrisi ölçülerek belirlendi; başka bir model kullanılacaksa yalnızca
  bu tablo güncellenir.
- **Görsel geri bildirim:** Seçili ve üzerine gelinen bölge, malzemenin fragment shader'ına
  eklenen bir renk bandı ile gövde üzerinde boyanıyor (`SpineModel.tsx` → `onBeforeCompile`).
- **Tooltip:** Tıklanan noktanın hemen yanında `drei/Html` ile bölge adı, seviyesi ve alt başlığı
  gösteriliyor; sol paneldeki liste ise açıklama ve sık görülen şikâyetleri açıyor.
- **İşaretçiler:** Her bölge için kameraya dönük (billboard) nabız gibi atan noktalar.
- Boş alana tıklamak seçimi temizler.

## Skolyoz açısı bölümü (aynı model, eğilen hâliyle)

`ScoliosisSpine` aynı GLB'yi kullanır; modelde kemik (armature) ya da morph target
olmadığı için eğrilik **vertex shader'ında** üretilir: her tepe noktası yüksekliğine
bağlı bir sinüs eğrisi kadar yana kayar (`uBend`) ve aynı anda kendi ekseni etrafında
döner (`uTwist`). Böylece skolyozun üç boyutlu tanımı — frontal eğrilik + transvers
rotasyon — modelin üzerinde doğrudan görülür. Cobb tanjant çizgileri uç omurların
yüksekliğine oturur ve açının yarısı kadar eğilir. "Üstten" görünüm rotasyonu gösterir.
Geometri hazırlığı iki sahne arasında `prepareSpineGeometry` ile paylaşılır.

## İçerik nasıl düzenlenir

Tüm metinler, iletişim bilgileri ve listeler `src/lib/content.ts` içinde toplanmıştır
(telefon, e-posta, adres, WhatsApp bağlantısı, çalışma saatleri, hizmetler, yorumlar, S.S.S.).
Şu an örnek/yer tutucu olan alanlar — telefon, e-posta, adres, sosyal medya bağlantıları,
istatistikler ve eğitim yılları — yayına çıkmadan önce gerçek bilgilerle değiştirilmelidir.

## Tasarım sistemi

Renkler, gölgeler ve tipografi `src/index.css` içindeki `@theme` bloğunda tanımlıdır:
`ink` (lacivert), `brand` (medikal mavi), `vital` (turkuaz), `warm` (amber), `sand` (kum/kağıt).
Ortak yardımcı sınıflar: `.eyebrow`, `.title-xl`, `.title-lg`, `.lead`, `.section-shell`,
`.gradient-text`, `.grid-lines`, `.card-surface`.
