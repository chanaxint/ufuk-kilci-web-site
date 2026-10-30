-- Ufuk Kilci sitesi — Cloudflare D1 şeması (içerik + sürüm geçmişi).
-- Fonksiyonlar bu tabloları ilk kayıtta kendiliğinden kurar
-- (functions/_lib/icerik.ts, SEMA); bu dosya elle kurmak isterseniz:
--   npx wrangler d1 execute ufuk-kilci-icerik --remote --file=migrations/0001_icerik.sql
-- Randevu talepleri ya da hasta verisi burada TUTULMAZ.

CREATE TABLE IF NOT EXISTS icerik (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  veri TEXT NOT NULL CHECK (json_valid(veri)),
  surum INTEGER NOT NULL CHECK (surum > 0),
  guncelleyen TEXT NOT NULL,
  guncellendi TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS icerik_gecmisi (
  surum INTEGER PRIMARY KEY,
  veri TEXT NOT NULL CHECK (json_valid(veri)),
  guncelleyen TEXT NOT NULL,
  guncellendi TEXT NOT NULL,
  aciklama TEXT NOT NULL DEFAULT ''
);
