# React Bits bileşenleri

Bu klasördeki dosyalar [React Bits](https://reactbits.dev) kütüphanesinin
TypeScript + Tailwind sürümünden alınmıştır (MIT).

Kaynak dışında değiştirilen yerler dosya başlarındaki notlarda belirtilir;
kütüphane güncellenirse bu notlara bakarak yeniden uygulanabilir.

## Kullanılan bileşenler ve yapılan uyarlamalar

| Bileşen | Nerede | Uyarlama |
| --- | --- | --- |
| `StaggeredMenu` | Tüm navigasyon menüsü | `showHeader` ve `controlledOpen` eklendi (site kendi başlığını kullanıyor). İlk kurulum efektindeki erken dönüş, başlık gizlendiğinde paneli ekran dışına itmeyi atlıyordu — koşul yalnızca panele bağlandı. `isFixed` kabuğu tüm ekranı kaplayıp altındaki her şeyin tıklama/imleç olaylarını yutuyordu; kabuğa `pointer-events: none` verildi. `panelContent` ile varsayılan madde listesi yerine alt çizgili bağlantı listesi çiziliyor, stagger animasyonu onu da yükseltiyor. Tipografi ve renkler projeye uyarlandı. |
| `DrawUnderlineLink` (21st.dev / Osmo) | Menü bağlantıları | GooeyNav'ın yerini aldı. Özgün demo kendi CSS sınıflarıyla geliyordu; stiller Tailwind'e ve sitenin tipografisine taşındı, çizgi rengi kırmızıdan espresso paletine çekildi. Klavye odağı da çizgiyi tetikliyor, azaltılmış hareket tercihinde çizgi animasyonsuz görünüyor. Yazı ayrı bir `.sm-panel-itemLabel` katmanında duruyor; alt çizgi kutusu o katmanın dışında, yoksa kademeli giriş maskesine takılıp kırpılıyordu. |
| `ShinyText` | "Ufuk Kilci" yazıları | Yalnızca renk/hız ayarı. |
| `InfiniteSpiral` | Yorumlar | Kartlar görsel yerine serbest içerik (`node`) alabiliyor; kart yüzeyi projenin kart stiline çekildi (sıcak krem, backdrop-blur yok — üst maske altında tampon boşalıyor). Sığdırma katsayısı gevşetildi: kartlar artık dar ekranlarda da büyük kalıyor, spiral tam genişlikte akıyor. |
| `CometDial` | Skolyoz açısı | Uyarlama yok; snap/klavye davranışı kullanan bileşende (`ScoliosisAngles`) çözüldü. |
