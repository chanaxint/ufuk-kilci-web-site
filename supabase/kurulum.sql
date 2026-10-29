-- ════════════════════════════════════════════════════════════════════
--  Ufuk Kilci web sitesi — yönetim paneli kurulumu (Supabase)
--
--  Supabase panelinde: SQL Editor → New query → bu dosyanın tamamını
--  yapıştırın → EN ALTTAKİ e-posta adresini kendi adresinizle değiştirin
--  → Run. Birden fazla kez çalıştırmak zararsızdır.
--
--  Ne kuruluyor:
--    1. site_content  — sitenin bütün yazıları (tek satır)
--    2. yoneticiler   — siteyi değiştirebilecek e-posta adresleri
--    3. Satır kuralları: herkes OKUR, yalnızca yönetici YAZAR
--    4. site-gorselleri — fotoğraf deposu (herkese açık okuma)
--    5. randevu_talepleri — sitedeki formdan gelen talepler
--       (ziyaretçi yalnızca EKLER; okuyan/silen yalnızca yönetici)
-- ════════════════════════════════════════════════════════════════════

-- 1) Sitenin içeriği: tek satır (id = 1), bütün içerik JSON olarak
create table if not exists public.site_content (
  id smallint primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.site_content (id) values (1) on conflict (id) do nothing;

-- 2) Yöneticiler. Bu tablo dışarıdan hiç okunamaz/yazılamaz (kural yok);
--    yalnızca aşağıdaki fonksiyon içeriden bakar.
create table if not exists public.yoneticiler (
  email text primary key
);
alter table public.yoneticiler enable row level security;

create or replace function public.yonetici_mi()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.yoneticiler
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

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

-- Sütun yetkileri: ziyaretçi yalnızca formdaki alanları yazabilir (tarih,
-- numara ve durum veritabanında belirlenir); yönetici yalnızca durumu
-- değiştirebilir.
revoke all on public.randevu_talepleri from anon, authenticated;
grant insert (ad, telefon, konu, mesaj, onay) on public.randevu_talepleri to anon, authenticated;
grant select, delete on public.randevu_talepleri to authenticated;
grant update (durum) on public.randevu_talepleri to authenticated;

drop policy if exists "ziyaretci talep birakir" on public.randevu_talepleri;
create policy "ziyaretci talep birakir" on public.randevu_talepleri
  for insert to anon, authenticated
  with check (durum = 'yeni');

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
