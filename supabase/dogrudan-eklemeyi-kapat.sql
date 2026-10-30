-- ════════════════════════════════════════════════════════════════════
--  Randevu formu: ziyaretçinin Supabase'e DOĞRUDAN ekleme yetkisini kapat
--
--  NE ZAMAN: yalnızca sunucu akışı (Cloudflare Turnstile + /api/randevu)
--  yayındaki sitede kurulup gerçekten denendikten SONRA:
--    - Cloudflare Pages'te TURNSTILE_SECRET_KEY, SUPABASE_URL,
--      SUPABASE_SECRET_KEY (gizli) ve VITE_TURNSTILE_SITE_KEY tanımlı,
--    - site yeniden derlendi,
--    - sitedeki formdan gönderilen deneme talebi panelde göründü.
--  Daha önce çalıştırılırsa form talepleri kaydedilemez (ziyaretçiye
--  WhatsApp bağlantısı gösterilir).
--
--  Supabase → SQL Editor → New query → bu dosyanın tamamı → Run.
--  Birden fazla kez çalıştırmak zararsızdır. kurulum.sql sonradan yeniden
--  çalıştırılsa da kapı açılmaz (aşağıdaki işaret yüzünden).
--
--  Geri açmak gerekirse (ör. sunucu akışında sorun):
--    delete from public.kurulum_ayarlari where anahtar = 'dogrudan_randevu';
--    ve kurulum.sql'i yeniden çalıştırın.
-- ════════════════════════════════════════════════════════════════════

insert into public.kurulum_ayarlari (anahtar, deger)
values ('dogrudan_randevu', 'kapali')
on conflict (anahtar) do update set deger = excluded.deger;

-- Tablo düzeyindeki geri alma, sütun düzeyindeki ekleme yetkilerini de kaldırır
revoke insert on public.randevu_talepleri from anon, authenticated;
drop policy if exists "ziyaretci talep birakir" on public.randevu_talepleri;
