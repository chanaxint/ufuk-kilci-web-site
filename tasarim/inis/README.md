# Giriş inişi videosu

`public/video/masa-alti-inis.mp4` (+ `.webm`) burada duran karelerden
üretiliyor. Yapay zekâ yok: kamera hareketi ffmpeg ile render ediliyor,
yani ücretsiz ve her seferinde aynı sonucu veriyor.

Kareler (hepsi 2000×1116, aynı çerçeveleme):

1. `public/images/klinik-masa.jpg` — giriş fotoğrafı (videonun ilk karesi)
2. `01-masa-alti.jpg` — masanın altı
3. `02-zemin.jpg` — zemin

Yeniden üretmek için (ffmpeg 7 ile denendi):

```bash
ffmpeg \
 -loop 1 -t 3.2 -i public/images/klinik-masa.jpg \
 -loop 1 -t 3.2 -i tasarim/inis/01-masa-alti.jpg \
 -loop 1 -t 3.0 -i tasarim/inis/02-zemin.jpg \
 -filter_complex "\
[0:v]crop=1984:1116:11:0,scale=3840:2160,setsar=1,fps=24,zoompan=z='1.0+0.18*(on/76)':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)*(on/76)':d=1:s=1600x900:fps=24[a];\
[1:v]crop=1984:1116:11:0,scale=3840:2160,setsar=1,fps=24,zoompan=z='1.30-0.30*(on/76)':x='(iw-iw/zoom)/2':y='0':d=1:s=1600x900:fps=24[b];\
[2:v]crop=1984:1116:11:0,scale=3840:2160,setsar=1,fps=24,zoompan=z='1.28-0.22*(on/71)':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)':d=1:s=1600x900:fps=24[c];\
[a][b]xfade=transition=smoothup:duration=1.0:offset=2.2[ab];\
[ab][c]xfade=transition=smoothup:duration=1.0:offset=4.4[out]" \
 -map "[out]" -c:v libx264 -preset slow -crf 27 -g 12 -pix_fmt yuv420p \
 -movflags +faststart -an public/video/masa-alti-inis.mp4 -y

ffmpeg -i public/video/masa-alti-inis.mp4 -c:v libvpx-vp9 -crf 38 -b:v 0 \
 -g 12 -row-mt 1 -deadline good -cpu-used 2 -pix_fmt yuv420p -an \
 public/video/masa-alti-inis.webm -y
```

`crop=1984:1116:11:0` sitedeki `object-cover` çerçevelemesinin aynısı:
videonun ilk karesi giriş fotoğrafıyla birebir örtüşsün diye. `-g 12`
kaydırmayla ileri geri sarmayı akıcı tutuyor (yarım saniyede bir anahtar
kare).
