-- ════════════════════════════════════════════════════════════════════
--  Ufuk Kilci web sitesi — yönetim paneli kurulumu (Supabase)
--
--  ÖNCE: Authentication → Sign In / Providers → "Allow new users to sign
--  up" KAPALI olsun (docs/yonetim-paneli.md, 2. adım).
--
--  Supabase panelinde: SQL Editor → New query → bu dosyanın tamamını
--  yapıştırın → EN ALTTAKİ e-posta adresini kendi adresinizle değiştirin
--  → Run. Birden fazla kez çalıştırmak zararsızdır. Gerçek e-posta adresini
--  yalnızca SQL Editor'de yazın; bu dosyaya (açık depoya) yazmayın.
--
--  Ne kuruluyor:
--    1. site_content  — sitenin bütün yazıları (tek satır)
--    2. yoneticiler   — siteyi değiştirebilecek e-posta adresleri
--       + iki adımlı doğrulama (MFA) kuralı
--    3. Satır kuralları: herkes OKUR, yalnızca yönetici YAZAR
--    4. site-gorselleri — fotoğraf deposu (herkese açık okuma)
--    5. randevu_talepleri — sitedeki formdan gelen talepler
--       (okuyan/silen yalnızca yönetici). Ziyaretçinin DOĞRUDAN ekleme
--       yetkisi yalnızca geçiş dönemi için; sunucu akışı (Turnstile +
--       /api/randevu) kurulup denendikten sonra
--       supabase/dogrudan-eklemeyi-kapat.sql ile kapatılır.
-- ════════════════════════════════════════════════════════════════════

-- 1) Sitenin içeriği: tek satır (id = 1), bütün içerik JSON olarak
create table if not exists public.site_content (
  id smallint primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.site_content (id) values (1) on conflict (id) do nothing;

-- 2) Yöneticiler. Bu tablo dışarıdan hiç okunamaz/yazılamaz (kural ve
--    yetki yok); yalnızca aşağıdaki fonksiyon içeriden bakar.
create table if not exists public.yoneticiler (
  email text primary key
);
--    mfa_zorunlu: true yapılırsa bu yönetici iki adımlı doğrulama olmadan
--    hiçbir şeyi değiştiremez (kurulduktan sonra açılması önerilir).
alter table public.yoneticiler add column if not exists mfa_zorunlu boolean not null default false;
alter table public.yoneticiler enable row level security;
revoke all on public.yoneticiler from anon, authenticated;

--    Yönetici mi? E-posta listede olmalı VE iki adımlı doğrulama kuralı
--    sağlanmalı: kullanıcı doğrulama uygulamasını (TOTP) kurduysa ya da
--    mfa_zorunlu açıksa yalnızca iki adımlı oturum (aal2) yetkilidir;
--    yalnızca şifreyle açılmış oturum (aal1) okuyamaz, yazamaz.
create or replace function public.yonetici_mi()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.yoneticiler y
    where lower(y.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and (
        coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
        or (
          not y.mfa_zorunlu
          and not exists (
            select 1
            from auth.mfa_factors f
            where f.user_id = auth.uid()
              and f.status = 'verified'
          )
        )
      )
  );
$$;
--    Ziyaretçinin bu fonksiyona işi yok (yalnızca giriş yapmış kullanıcıların
--    kurallarında kullanılıyor)
revoke execute on function public.yonetici_mi() from public, anon;
grant execute on function public.yonetici_mi() to authenticated;

-- 3) Satır kuralları
alter table public.site_content enable row level security;

drop policy if exists "herkes okur" on public.site_content;
create policy "herkes okur" on public.site_content
  for select using (true);

drop policy if exists "yonetici ekler" on public.site_content;
create policy "yonetici ekler" on public.site_content
  for insert to authenticated
  with check (public.yonetici_mi());

drop policy if exists "yonetici gunceller" on public.site_content;
create policy "yonetici gunceller" on public.site_content
  for update to authenticated
  using (public.yonetici_mi())
  with check (public.yonetici_mi());

-- 4) Fotoğraf deposu: herkese açık adresle okunur (listeleme kuralı yok),
--    yalnızca yönetici yükler/siler. Panel fotoğrafları zaten küçültüyor;
--    5 MB sınırı ve tür kısıtı ikinci bir güvence.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-gorselleri', 'site-gorselleri', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "yonetici gorsel yukler" on storage.objects;
create policy "yonetici gorsel yukler" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'site-gorselleri' and public.yonetici_mi());

drop policy if exists "yonetici gorsel siler" on storage.objects;
create policy "yonetici gorsel siler" on storage.objects
  for delete to authenticated
  using (bucket_id = 'site-gorselleri' and public.yonetici_mi());

-- 5) Randevu talepleri. Ziyaretçi formu gönderince buraya bir satır
--    ekleniyor; ziyaretçi hiçbir talebi (kendi talebini bile) okuyamaz.
--    Panelde yönetici listeler, "arandı / tamamlandı" der ya da siler.
create table if not exists public.randevu_talepleri (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  ad text not null check (char_length(btrim(ad)) between 2 and 120),
  telefon text not null check (char_length(telefon) <= 40 and char_length(regexp_replace(telefon, '[^0-9]', '', 'g')) between 7 and 15),
  konu text not null default '' check (char_length(konu) <= 200),
  mesaj text not null default '' check (char_length(mesaj) <= 2000),
  onay boolean not null check (onay),
  durum text not null default 'yeni' check (durum in ('yeni', 'arandi', 'tamamlandi'))
);
create index if not exists randevu_talepleri_tarih on public.randevu_talepleri (created_at desc);
alter table public.randevu_talepleri enable row level security;

-- Kurulum işaretleri (dışarıdan erişilemez). dogrudan-eklemeyi-kapat.sql
-- buraya not düşer; bu dosya yeniden çalıştırılınca kapı tekrar açılmaz.
create table if not exists public.kurulum_ayarlari (
  anahtar text primary key,
  deger text not null
);
alter table public.kurulum_ayarlari enable row level security;
revoke all on public.kurulum_ayarlari from anon, authenticated;

-- Sütun yetkileri: yönetici yalnızca durumu değiştirebilir. Sunucu
-- fonksiyonu (sunucu anahtarı) satır kurallarını aşar; frenleyici
-- tetikleyici onda da çalışır.
revoke all on public.randevu_talepleri from anon, authenticated;
grant select, delete on public.randevu_talepleri to authenticated;
grant update (durum) on public.randevu_talepleri to authenticated;

-- GEÇİŞ DÖNEMİ: ziyaretçinin doğrudan ekleme yetkisi (yalnızca formdaki
-- alanlar; tarih, numara ve durum veritabanında belirlenir). Kapatıldıysa
-- (kurulum_ayarlari.dogrudan_randevu = 'kapali') yeniden açılmaz.
do $$
begin
  if exists (select 1 from public.kurulum_ayarlari where anahtar = 'dogrudan_randevu' and deger = 'kapali') then
    drop policy if exists "ziyaretci talep birakir" on public.randevu_talepleri;
  else
    grant insert (ad, telefon, konu, mesaj, onay) on public.randevu_talepleri to anon, authenticated;
    drop policy if exists "ziyaretci talep birakir" on public.randevu_talepleri;
    create policy "ziyaretci talep birakir" on public.randevu_talepleri
      for insert to anon, authenticated
      with check (durum = 'yeni');
  end if;
end;
$$;

drop policy if exists "yonetici talepleri okur" on public.randevu_talepleri;
create policy "yonetici talepleri okur" on public.randevu_talepleri
  for select to authenticated
  using (public.yonetici_mi());

drop policy if exists "yonetici talep gunceller" on public.randevu_talepleri;
create policy "yonetici talep gunceller" on public.randevu_talepleri
  for update to authenticated
  using (public.yonetici_mi())
  with check (public.yonetici_mi());

drop policy if exists "yonetici talep siler" on public.randevu_talepleri;
create policy "yonetici talep siler" on public.randevu_talepleri
  for delete to authenticated
  using (public.yonetici_mi());

-- Toplu gönderime fren: aynı numaradan (0532…, +90 532… aynı sayılır) saatte 3'ten, toplamda 10
-- dakikada 30'dan fazla talep kabul edilmez. (Gerçek bir hasta bu
-- sınırlara hiç yaklaşmaz; formu dolduran bir program durur.)
create or replace function public.randevu_frenle()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.randevu_talepleri
      where created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'Çok fazla talep geldi, biraz sonra tekrar deneyin.';
  end if;
  if (select count(*) from public.randevu_talepleri
      where created_at > now() - interval '1 hour'
        and right(regexp_replace(telefon, '[^0-9]', '', 'g'), 10) = right(regexp_replace(new.telefon, '[^0-9]', '', 'g'), 10)) >= 3 then
    raise exception 'Bu numaradan yakın zamanda talep alındı.';
  end if;
  return new;
end;
$$;
revoke execute on function public.randevu_frenle() from public, anon, authenticated;

drop trigger if exists randevu_frenle on public.randevu_talepleri;
create trigger randevu_frenle
  before insert on public.randevu_talepleri
  for each row execute function public.randevu_frenle();

-- 6) ▼▼▼ KENDİ E-POSTA ADRESİNİZİ YAZIN ▼▼▼
--    Panele giriş yapacağınız adres. Authentication → Users bölümünde
--    açacağınız kullanıcının e-postasıyla birebir aynı olmalı.
insert into public.yoneticiler (email)
values ('BURAYA-E-POSTANIZ@ornek.com')
on conflict (email) do nothing;
