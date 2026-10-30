# Giriş görsellerindeki örnek diplomalar

Giriş fotoğrafı (`public/images/klinik-masa.jpg`) ve iki giriş videosu yapay
zekâyla üretildi. Duvardaki altı çerçevede **gerçek olmayan bir kişiye ait**
diplomalar vardı ("Dr. Elara Vance" — "The Royal College of Surgeons", "Johns
Hopkins University", "European Spine Society"). Bir sağlık profesyonelinin
sitesinde yanıltıcı olacağı için yayından önce okunmaz hâle getirildi.

## Ne yapıldı

`belgeleri-gizle.mjs` her çerçevedeki **kâğıdın içini** güçlü biçimde
bulanıklaştırıp kâğıt rengine yaklaştırıyor. Çerçeveler, duvar, lamba,
kitaplar, anatomi çizimleri ve masa (3B omurganın oturduğu yer) değişmedi;
fotoğraf ile videoların ilk/son kareleri hâlâ birbirinin aynısı, yani sitedeki
geçişler görünmüyor.

| Dosya | Nasıl |
|---|---|
| `public/images/klinik-masa.jpg` | `foto` — altı kâğıt alanı |
| `public/video/masa-alti-inis.mp4` | `video … ileri` — diplomalar ilk ~190 karede, kamera aşağı inerken kadrajdan çıkıyor |
| `public/video/klinige-giris.mp4` | `video … geri --tahmin 6` — diplomalar son ~95 karede, kapı kasasının arkasından çıkıp yaklaşıyor |
| `-mobil.mp4` ve `.webm` kopyaları | `tasarim/inis/README.md` içindeki komutlarla işlenmiş mp4'ten yeniden üretildi |

Videolarda diplomaların yeri her karede izleniyor: önce bütün blok (ölçek +
kayma), sonra her diploma kendi şablonuyla ayrıca (açılı bakışta perspektif
yüzünden blok tek parça ölçeklenmiyor). Blok kadrajdan çıkarken izleme
bozulunca son karelerin hızıyla birkaç kare daha tahmin ediliyor; tahmin
edilen karelerde yalnızca bulanıklaştırma yapılıyor (kâğıt rengine
yaklaştırma yok), dikdörtgen kâğıda tam oturmazsa komşu yüzey grileşmesin
diye. Her kare kontrol edildi; açılı geçişte (kliniğe giriş, ~152. kare)
kadraj kenarındaki iki kâğıtta okunamayan silik izler kalıyor.

## Gerçek belgeler gelince

Bu bir geçici çözüm. Doğru olan, duvarda **doktorun kendi belgeleri** (ya da
hiç belge olmayan) yeni bir giriş fotoğrafı ve videoları üretmek; 3B omurganın
fotoğrafa oturtulması (`src/components/three/spinePose.ts`) ve iniş videosunun
stand izleme tablosu (`STAND_RISE`) yeni görsele göre yeniden ayarlanmalı.

Orijinal (yazılı) dosyalar git geçmişinde duruyor; yayına giren klasöre
(`public/`) geri konmamalı.

## Yeniden çalıştırmak

```bash
node tasarim/belgeler/belgeleri-gizle.mjs foto  <orijinal.jpg> public/images/klinik-masa.jpg
node tasarim/belgeler/belgeleri-gizle.mjs video <orijinal-inis.mp4> public/video/masa-alti-inis.mp4 ileri
node tasarim/belgeler/belgeleri-gizle.mjs video <orijinal-giris.mp4> public/video/klinige-giris.mp4 geri --tahmin 6
# her videoda izleme sonucunu görmek için: --hata-ayikla <klasör> (12 karede bir işaretli kare)
```

Betik yalnızca `ffmpeg` ister; çıkışı H.264, `-g 12` (kaydırmayla sarma akıcı
kalsın), `CRF` ortam değişkeniyle (varsayılan 25). İşlem birkaç dakika sürer.
