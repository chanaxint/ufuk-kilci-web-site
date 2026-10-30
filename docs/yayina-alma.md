# Yayına alma — Cloudflare Pages

Site statik; tek sunucu parçası randevu formunun "E-posta ile" seçeneği:
Cloudflare Pages Function (`functions/api/randevu.ts` → `/api/randevu`) ve
e-postayı gönderen küçük Worker (`workers/randevu-eposta/`, ayrı yayınlanır,
`docs/randevu-gonderimi.md`). Derleme çıktısı (`dist/`) Cloudflare Pages'in
ücretsiz planına sığıyor (≈11 MB, ~50 dosya, en büyük dosya ~2 MB). Fonksiyon
ve Worker ücretsiz planda ortak günlük 100.000 istek kotasından yer; statik
dosyalar kotaya sayılmaz. Randevu formu için fazlasıyla yeterli.
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
| `VITE_SUPABASE_URL` | düz metin | Supabase kurulunca | Supabase → Project Settings → Data API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | düz metin | Supabase kurulunca | **anon public** (Legacy API keys) ya da **Publishable key** — asla `service_role` / secret değil |
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

Supabase değişkenleri boş bırakılırsa site varsayılan içerikle açılır, panel
"Panel henüz kurulmadı" der. Randevu formu Supabase'e bağlı değil:
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
3. Supabase → Authentication → URL Configuration: Site URL ve Redirect URL
   (`https://alanadi/yonetim/`).
4. Cloudflare → SSL/TLS: "Always Use HTTPS" açık; HSTS'yi alan adı kalıcı
   olarak HTTPS'te çalıştığından emin olunca açın (geri alması zordur, bu
   yüzden `_headers`'a bilerek konmadı).
5. Önizleme dallarının `*.pages.dev` adresleri herkese açıktır; istenmiyorsa
   Settings → Builds → Preview deployments kapatılır ya da Cloudflare Access
   ile korunur. (Cloudflare `*.pages.dev` önizlemelerine kendiliğinden
   `noindex` ekler.)
6. Google Search Console'a `https://alanadi/sitemap.xml` gönderin.

## Yerelde nasıl denendi

`dist/_headers` kurallarını birebir uygulayan küçük bir sunucuyla ve gerçek
tarayıcıyla (1440 px ve 390 px): sayfa baştan sona kaydırıldı, CSP ihlali
yok; 3B sahne (WebGL), videolar, yazı tipleri, GSAP/Motion animasyonları ve
Lottie çalışıyor. Supabase'li bir test derlemesinde (sahte sunucuyla): panel
girişi, talep listesi, fotoğraf yükleme ve gösterme, canlı önizleme çerçevesi,
serbest düzen düzenleyicisi, kaydetme ve sitedeki randevu gönderimi — CSP
ihlali yok. Başka bir siteden çerçeveleme engellendi, aynı adresten izin
verildi. `npm run dev` ve `npm run preview` `_headers` dosyasını okumaz;
başlıklar yalnızca Cloudflare'de etkindir.
