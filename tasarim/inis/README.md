# Giriş inişi videosu

Sitenin girişindeki kamera inişi (`public/video/masa-alti-inis.*`) iki yapay
zekâ klibinden birleştirildi:

1. **Camera moving down showing books** (10 sn) — masa üstünden masanın
   altına iner.
2. **Camera tilting down at desk** (8 sn) — masanın altından zemine iner.

Aralarındaki bağlantı neredeyse birebir örtüşüyor; 0,6 sn'lik bir geçişle
birleştirildi. Toplam 17,4 sn.

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
[0:v]fps=24,scale=1280:720,crop=1280:714:0:3,setsar=1[a];\
[1:v]fps=24,scale=1280:720,crop=1280:714:0:3,setsar=1[b];\
[a][b]xfade=transition=fade:duration=0.6:offset=9.4,format=yuv420p[v]" \
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

## Buradaki kareler

`01-masa-alti.jpg` ve `02-zemin.jpg` inişin hedef kareleri — klipler
bunlara göre üretildi, arşiv olarak duruyor.
