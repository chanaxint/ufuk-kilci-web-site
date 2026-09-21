# Giriş videoları

Sitenin girişinde iki ayrı kaydırmaya kilitli video var:

1. **`public/video/klinige-giris.*`** — kliniğe giriş (koridor → kapı → oda →
   masa, 8 sn). Yükleme ekranı kapanınca ilk görünen sahne.
2. **`public/video/masa-alti-inis.*`** — masanın altına iniş (17,8 sn).
   Aşağıda anlatılan video.

## Kliniğe giriş videosu

Kullanıcının verdiği 3840×2160 / 30 fps klipten üretildi. Son karesi giriş
fotoğrafının (`public/images/klinik-masa.jpg`) aynısı; ölçülen fark ölçek
1,00 ve 8 piksel yatay kayma, kayma kodlarken düzeltildi:

```bash
ffmpeg -i <ham-4k>.mp4 \
 -vf "fps=30,scale=1288:724:flags=lanczos,crop=1280:714:8:5,setsar=1" \
 -c:v libx264 -preset slow -crf 26 -g 12 -pix_fmt yuv420p \
 -movflags +faststart -an public/video/klinige-giris.mp4 -y

ffmpeg -i public/video/klinige-giris.mp4 -vf scale=854:476 -c:v libx264 \
 -preset slow -crf 29 -g 12 -pix_fmt yuv420p -movflags +faststart -an \
 public/video/klinige-giris-mobil.mp4 -y

ffmpeg -i public/video/klinige-giris.mp4 -c:v libvpx-vp9 -crf 37 -b:v 0 \
 -g 12 -row-mt 1 -deadline good -cpu-used 3 -pix_fmt yuv420p -an \
 public/video/klinige-giris.webm -y
```

Ses şeridi atıldı (`-an`): video oynamıyor, karesi kaydırmaya kilitli.

# Masanın altına iniş videosu

Sitenin girişindeki kamera inişi (`public/video/masa-alti-inis.*`) iki yapay
zekâ klibinden birleştirildi:

1. **Camera moving down showing books** (10 sn) — masa üstünden masanın
   altına iner.
2. **Camera tilting down at desk** (8 sn) — masanın altından zemine iner.

Aralarındaki bağlantı geometrik olarak neredeyse birebir örtüşüyor
(ölçüldü: ölçek 1,0075, kayma 0 piksel). Toplam 17,8 sn.

**Birleşmedeki tutarsızlık ve çözümü.** Birinci klip son ~1,4 saniyesinde
kamerayı geri çekiyor: iniş bir an duruyor, geri gidiyor, sonra ikinci klip
devam ediyor. Uzun bir çapraz geçiş bunu üst üste iki hareketli görüntü
olarak gösterdiği için hayalet yapıyordu. Çözüm:

- Birinci klibin son 1,4 saniyesine kademeli bir karşı-zoom (1,000 → 1,042)
  uygulanıp geri çekilme iptal edildi.
- İkinci klip aynı zoomla başlayıp ilk 1,6 saniyede 1,000'e dönüyor: kalan
  fark, kameranın zaten indiği bir anda yavaşça dağıtılıyor.
- Çapraz geçiş 0,6 sn'den 0,15 sn'ye indirildi.

Birinci klibin ilk karesi giriş fotoğrafının (`public/images/klinik-masa.jpg`)
aynısı. Ölçüldü: aynı ölçekte, kaymasız (SSIM 0,875 — fark yalnızca yapay
zekânın yeniden çizdiği sertifika yazıları). Bu yüzden sitede fotoğraftan
videoya geçiş görünmüyor.

## Kırpma neden 1280x714?

Giriş fotoğrafı 2000x1116, yani 1,7921 oranında; video 16:9 (1,7778) geldi.
`object-cover` iki farklı oranı farklı kırptığı için ilk kare fotoğrafla
üst üste oturmuyordu. Video, fotoğrafın oranına kırpıldı (1280x714) ve
sitede ikisi de `object-cover object-[70%_center]` kullanıyor: artık
çerçeveleme birebir aynı.

## Yeniden üretmek

Kaynak klipler depoda tutulmuyor (birlikte 6,7 MB). Tempoyu değiştirmek
gerekirse depodaki 720p kopya yeniden kesilebilir; sıfırdan üretmek için
klipleri tekrar yükleyip:

```bash
ffmpeg -i <1-books>.mp4 -i <2-tilt>.mp4 -filter_complex "\
[0:v]fps=24,scale=2560:1440,crop=2560:1428:0:6,setsar=1,zoompan=z='if(lte(on,206),1,1+0.042*(on-206)/33)':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d=1:s=1280x714:fps=24[a];\
[1:v]fps=24,scale=2560:1440,crop=2560:1428:0:6,setsar=1,zoompan=z='if(lte(on,38),1.042-0.042*on/38,1)':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d=1:s=1280x714:fps=24[b];\
[a][b]xfade=transition=fade:duration=0.15:offset=9.85,format=yuv420p[v]" \
 -map "[v]" -an -c:v libx264 -preset slow -crf 27 -g 12 \
 -movflags +faststart public/video/masa-alti-inis.mp4 -y

# dar ekran kopyası
ffmpeg -i public/video/masa-alti-inis.mp4 -vf scale=854:476 -c:v libx264 \
 -preset slow -crf 30 -g 12 -pix_fmt yuv420p -movflags +faststart -an \
 public/video/masa-alti-inis-mobil.mp4 -y

# H.264 çözemeyen tarayıcılar için yedek
ffmpeg -i public/video/masa-alti-inis.mp4 -c:v libvpx-vp9 -crf 38 -b:v 0 \
 -g 12 -row-mt 1 -deadline good -cpu-used 3 -pix_fmt yuv420p -an \
 public/video/masa-alti-inis.webm -y
```

`-g 12` (yarım saniyede bir anahtar kare) kaydırmayla ileri geri sarmayı
akıcı tutuyor: video oynamıyor, karesi kaydırmaya kilitli.

## Omurga ve yazıların çıkışı

`SpineStage.tsx` içindeki `STAND_RISE` tablosu uydurma değil: videodaki
stand bölgesi kare kare izlenip masa üstündeki eşyaların kadrajda ne kadar
yükseldiği ölçüldü. Omurga tam bu hızla yükseliyor, yani standın üstünden
havalanmıyor. Gerçekte stand kadrajdan çıkmıyor, kamera masa düzleminin
altına inerken masanın ön kenarı önünü kapatıyor; bu maskelenemediği için
omurga ve giriş yazıları tam o aralıkta (≈2,4–4,2 sn) yavaşça siliniyor.

## Buradaki kareler

`01-masa-alti.jpg` ve `02-zemin.jpg` inişin hedef kareleri — klipler
bunlara göre üretildi, arşiv olarak duruyor.
