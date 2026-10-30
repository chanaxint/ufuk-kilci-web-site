# Yayına alma — Cloudflare Pages

Site statik dosyalar + Cloudflare Pages Functions (`functions/`):
ana sayfa (`/`, içeriği D1'den yerleştirir), içerik ve yönetim API'leri
(`/api/icerik`, `/api/yonetim/*`), panelden yüklenen fotoğraflar
(`/medya/*`, R2) ve randevu formu (`/api/randevu`). E-postayı gönderen
küçük Worker (`workers/randevu-eposta/`) ayrı yayınlanır
(`docs/randevu-gonderimi.md`). Panel kurulumu (D1, R2, Access):
`docs/yonetim-paneli.md`. Derleme çıktısı (`dist/`) ≈11 MB, ~50 dosya.
Fonksiyonlar ve Worker ücretsiz planda ortak günlük 100.000 istek
kotasından yer (her sayfa açılışı 1 istek); statik dosyalar kotaya sayılmaz.
Bu belge, yayına almak için gereken ayarları toplar. **Hiçbir adım otomatik
yapılmadı; her biri sizin onayınızla yapılacak.**

## Projede hazır olanlar

| Ne | Nerede | Açıklama |
|---|---|---|
| Node 22 | `.nvmrc`, `package.json` → `engines` | Cloudflare derleyicisi `.nvmrc`'yi okur. Vite 7 en az Node 22.12 / 20.19 ister. |
| Güvenlik başlıkları | `public/_headers` → `dist/_headers` | CSP, çerçeveleme yalnızca kendi alan adından (panel önizlemesi için), `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP. Her iznin gerekçesi dosyanın içinde. |
| Panel arama motorlarına kapalı | `public/_headers` + `yonetim/index.html` | `X-Robots-Tag: noindex, nofollow, noarchive` + `<meta name="robots">`, panel sayfası önbelleğe alınmaz. |
| robots.txt | derlemede üretilir (`vite/site-seo.ts`) | Her şeye izin verir. Panel robots.txt ile kapatılmadı; kapatılsaydı arama motoru `noindex`'i hiç göremezdi. |
| sitemap.xml, canonical, og:url, tam adresli og:image ve JSON-LD | derlemede, **yalnızca `SITE_URL` verilince** | Alan adı belli olmadan adres uydurulmuyor. `SITE_URL` yoksa derleme bir uyarı verir ve bunları üretmez. |
| Derlenen JS/CSS önbelleği | `public/_headers` → `/assets/*` | Dosya adları içeriğe göre değiştiği için bir yıl, `immutable`. |
| İçerik ve panel fonksiyonları | `functions/index.ts`, `functions/api/icerik.ts`, `functions/api/yonetim/*`, `functions/medya/*` | `_headers` fonksiyon yanıtlarına uygulanmadığı için güvenlik başlıkları `functions/_lib/http.ts`'te; CSP iki yerde aynı olmalı, derleme denetler (`vite/baslik-denetimi.ts`). |
| Randevu sunucu fonksiyonu | `functions/api/randevu.ts` (+ `functions/_lib/`) | Cloudflare `functions/` klasörünü kendiliğinden tanır; ayrı derleme ayarı gerekmez. Alanları ve Turnstile belirtecini sunucuda doğrular, talebi service binding ile e-posta Worker'ına iletir; hiçbir şey saklamaz. `_lib` alt çizgiyle başladığı için adres olarak yayınlanmaz. Tür denetimi `tsconfig.functions.json` (`npx tsc -b`). |
| Randevu e-posta Worker'ı | `workers/randevu-eposta/` | Pages'in derlemesine girmez; `wrangler deploy` ile bir kez ayrı yayınlanır. `send_email` + oran sınırı bağlamaları. |

## Cloudflare Pages proje ayarları

Workers & Pages → Create → Pages → **Connect to Git** → `chanaxint/ufuk-kilci-web-site`

| Ayar | Değer |
|---|---|
| Production branch | `main` (henüz yok — önce oluşturulmalı) |
| Framework preset | Vite (ya da None) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` (boş) |

**Environment variables (Production):**

| Değişken | Tür | Ne zaman | Değer |
|---|---|---|---|
| `SITE_URL` | düz metin | alan adı belli olunca | `https://gercek-alan-adi` (sonunda `/` ve yol olmadan, yalnızca `https`) |
| `DB` | **D1 binding** (Settings → Bindings) | panel kurulunca | D1 veritabanı `ufuk-kilci-icerik` |
| `MEDYA` | **R2 binding** (Settings → Bindings) | panel kurulunca | R2 deposu `ufuk-kilci-medya` |
| `ACCESS_TEAM_DOMAIN` | düz metin | panel kurulunca | `https://<takim>.cloudflareaccess.com` |
| `ACCESS_AUD` | düz metin / Secret | panel kurulunca | Access uygulamalarının AUD etiketleri, virgülle |
| `YONETICI_EPOSTALARI` | düz metin / Secret | panel kurulunca | panele girebilecek e-postalar, virgülle |
| `VITE_TURNSTILE_SITE_KEY` | düz metin | Turnstile kurulunca | Cloudflare → Turnstile → Site Key (herkese açık) |
| `TURNSTILE_SECRET_KEY` | **Secret** | Turnstile kurulunca | Cloudflare → Turnstile → Secret Key |
| `RANDEVU_EPOSTA` | **Service binding** (Settings → Bindings) | e-posta kurulunca | Worker `ufuk-kilci-randevu-eposta` (`workers/randevu-eposta/`) |
| `TURNSTILE_HOSTNAMES` | düz metin | önerilir | `ufukkilci.com,www.ufukkilci.com` — belirteç başka bir alan adında üretildiyse reddedilir |
| `NODE_VERSION` | — | gerekmez | `.nvmrc` yeterli; derleme eski Node ile başlarsa `22` yazın |

**Gizli anahtar (`TURNSTILE_SECRET_KEY`) yalnızca
"Secret" türünde eklenir ve asla `VITE_` ile başlamaz**: `VITE_` değerleri
sitenin JavaScript'ine gömülür. Yerelde fonksiyonu denemek için
`.dev.vars.example` → `.dev.vars` (git'e girmez) ve `npx wrangler pages dev
dist --service RANDEVU_EPOSTA=ufuk-kilci-randevu-eposta`. Kurulum sırası ve
deneme adımları: `docs/randevu-gonderimi.md`.

Önizleme dallarında (`*.pages.dev`) Turnstile, alan adı Turnstile'a
eklenmediği sürece belirteç üretmez; `TURNSTILE_HOSTNAMES` de o adresleri
reddeder. Bu bilerek böyle: önizleme adresleri gerçek talep almaz.

`VITE_*` değerleri derleme anında koda gömülür: değiştirildikten sonra
**yeniden derleme** (Retry deployment) gerekir.

D1/R2/Access ayarları yokken site varsayılan içerikle açılır, panel
"Panel henüz kurulmadı" der. Randevu formu panele ve veritabanına bağlı değil:
`VITE_TURNSTILE_SITE_KEY` boşsa formda yalnızca WhatsApp yolu görünür;
verilince "E-posta ile" seçeneği de çıkar. Fonksiyonun gizli değeri ya da
service binding eksikse e-posta talebi alınmaz (503), ziyaretçiye hata ve
WhatsApp seçeneği gösterilir (sahte başarı yok).

## CSP'ye dokunmanız gereken durumlar

Turnstile için `https://challenges.cloudflare.com` `script-src`,
`frame-src` ve `connect-src`'de izinli; ayrıca bir şey gerekmez.

- **Kedi animasyonu projeye alınırsa** (`src/components/ui/LottieCat.tsx`
  içindeki not): `connect-src` içinden `https://lottie.host` silinir.
- Randevu formu dışarıya istek atmaz (e-posta sunucuda gönderilir, WhatsApp
  yalnızca bağlantı); onun için CSP'ye bir şey eklenmez.
- **Sitede başka bir dış kaynak kullanılırsa** (harita gömme, video servisi,
  analiz aracı): ilgili yönerge (`frame-src`, `script-src`, `connect-src`…)
  genişletilmeli; yoksa tarayıcı engeller.
- Çerçeveleme izni **`'self'` kalmalı**: `'none'` / `DENY` yazılırsa panelin
  canlı önizlemesi açılmaz.

## Alan adı bağlandıktan sonra

1. Pages → Custom domains → alan adını ekleyin (SSL otomatik).
2. `SITE_URL`'yi ekleyip yeniden derleyin → `/sitemap.xml` oluşur, robots.txt
   ona işaret eder.
3. Panel: alan adı Pages'e eklendikten SONRA Cloudflare Access uygulaması
   kurulur (`docs/yonetim-paneli.md`, 4. adım).
4. Cloudflare → SSL/TLS: "Always Use HTTPS" açık; HSTS'yi alan adı kalıcı
   olarak HTTPS'te çalıştığından emin olunca açın (geri alması zordur, bu
   yüzden `_headers`'a bilerek konmadı).
5. Önizleme dallarının `*.pages.dev` adresleri herkese açıktır; panel
   yolları Access ile korunmalı (`docs/yonetim-paneli.md`). D1/R2 yalnızca
   Production'a bağlandığı için önizlemeler gerçek içeriği değiştiremez.
   (Cloudflare `*.pages.dev` önizlemelerine kendiliğinden `noindex` ekler.)
6. Google Search Console'a `https://alanadi/sitemap.xml` gönderin.

## Yerelde nasıl denendi

`dist/_headers` kurallarını birebir uygulayan küçük bir sunucuyla ve gerçek
tarayıcıyla (1440 px ve 390 px): sayfa baştan sona kaydırıldı, CSP ihlali
yok; 3B sahne (WebGL), videolar, yazı tipleri, GSAP/Motion animasyonları ve
Lottie çalışıyor. Cloudflare'in yerel çalışma ortamında (`wrangler pages dev`,
yerel D1/R2, taklit Access belirteci): panel girişi, içerik kaydetme, sürüm
geçmişi, yedek, fotoğraf yükleme/gösterme/temizlik, canlı önizleme, serbest
düzen düzenleyicisi ve ziyaretçi sitesinde güncel içerik — CSP ihlali yok. Başka bir siteden çerçeveleme engellendi, aynı adresten izin
verildi. `npm run dev` ve `npm run preview` `_headers` dosyasını okumaz;
başlıklar yalnızca Cloudflare'de etkindir.
