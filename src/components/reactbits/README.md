# React Bits bileşenleri

Bu klasördeki dosyalar [React Bits](https://reactbits.dev) kütüphanesinin
TypeScript + Tailwind sürümünden alınmıştır (MIT).

Kaynak dışında değiştirilen yerler dosya başlarındaki notlarda belirtilir;
kütüphane güncellenirse bu notlara bakarak yeniden uygulanabilir.

## Kullanılan bileşenler ve yapılan uyarlamalar

| Bileşen | Nerede | Uyarlama |
| --- | --- | --- |
| `GooeyNav` | Menü içindeki bağlantılar | Dikey liste seçeneği (`orientation="vertical"`) eklendi. Damla birleşmesi, koyu zemin + `mix-blend-mode` yerine SVG alfa eşiğiyle (feGaussianBlur + feColorMatrix) yapılıyor; açık sıva zemininde özgün teknik ya siyah bir kutu bırakıyor ya da `backdrop-filter`'lı kapsülün içinde hiç karışmıyordu. Enter'daki `preventDefault` kaldırıldı — bağlantıyı klavyeden açmayı engelliyordu. Üst üste binen metin kopyası kapatıldı; renkler espresso paletine bağlandı. |
| `StaggeredMenu` | Tüm navigasyon menüsü | `showHeader` ve `controlledOpen` eklendi (site kendi başlığını kullanıyor). İlk kurulum efektindeki erken dönüş, başlık gizlendiğinde paneli ekran dışına itmeyi atlıyordu — koşul yalnızca panele bağlandı. `isFixed` kabuğu tüm ekranı kaplayıp altındaki her şeyin tıklama/imleç olaylarını yutuyordu; kabuğa `pointer-events: none` verildi. `panelContent` ile varsayılan madde listesi yerine dikey `GooeyNav` çiziliyor, stagger animasyonu onu da yükseltiyor. Tipografi ve renkler projeye uyarlandı. |
| `ShinyText` | "Ufuk Kilci" yazıları | Yalnızca renk/hız ayarı. |
| `InfiniteSpiral` | Yorumlar | Kartlar görsel yerine serbest içerik (`node`) alabiliyor; kart yüzeyi projenin kart stiline çekildi (sıcak krem, backdrop-blur yok — üst maske altında tampon boşalıyor). Sığdırma katsayısı gevşetildi: kartlar artık dar ekranlarda da büyük kalıyor, spiral tam genişlikte akıyor. |
| `CometDial` | Skolyoz açısı | Uyarlama yok; snap/klavye davranışı kullanan bileşende (`ScoliosisAngles`) çözüldü. |
