# React Bits bileşenleri

Bu klasördeki dosyalar [React Bits](https://reactbits.dev) kütüphanesinin
TypeScript + Tailwind sürümünden alınmıştır (MIT).

Kaynak dışında değiştirilen yerler dosya başlarındaki notlarda belirtilir;
kütüphane güncellenirse bu notlara bakarak yeniden uygulanabilir.

## Kullanılan bileşenler ve yapılan uyarlamalar

| Bileşen | Nerede | Uyarlama |
| --- | --- | --- |
| `GooeyNav` | Masaüstü navigasyonu | Koyu zemin için yazılmıştı; açık sıva zemine taşındı, renkler espresso paletine bağlandı. Damla efekti `contrast(100)` + karışım modu gerektiriyor; navigasyon `backdrop-filter`'lı cam kapsülün içinde olduğu için tarayıcı karışımı uygulamıyordu — katman karışım olmadan yumuşak bulanık hâle olarak çiziliyor. Üst üste binen metin kopyası kapatıldı. |
| `StaggeredMenu` | Mobil menü | `showHeader` ve `controlledOpen` eklendi (site kendi navigasyon çubuğunu kullanıyor). Tipografi, renkler ve numaralandırma projeye uyarlandı. |
| `ShinyText` | "Ufuk Kilci" yazıları | Yalnızca renk/hız ayarı. |
| `InfiniteSpiral` | Yorumlar | Kartlar görsel yerine serbest içerik (`node`) alabiliyor; kart yüzeyi projenin kart stiline çekildi. |
| `CometDial` | Skolyoz açısı | Uyarlama yok; snap/klavye davranışı kullanan bileşende (`ScoliosisAngles`) çözüldü. |
