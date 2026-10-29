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

-- 5) ▼▼▼ KENDİ E-POSTA ADRESİNİZİ YAZIN ▼▼▼
--    Panele giriş yapacağınız adres. Authentication → Users bölümünde
--    açacağınız kullanıcının e-postasıyla birebir aynı olmalı.
insert into public.yoneticiler (email)
values ('BURAYA-E-POSTANIZ@ornek.com')
on conflict (email) do nothing;
