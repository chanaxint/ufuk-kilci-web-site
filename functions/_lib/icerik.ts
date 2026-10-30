/**
 * Sitenin içeriği D1'de: tek satırlık `icerik` tablosu (Supabase'deki
 * `site_content` ile aynı model: bütün içerik tek JSON) ve her kayıtta bir
 * kopyası `icerik_gecmisi` tablosuna yazılır (geri alma, son 50 sürüm).
 *
 * Bütün sorgular parametreli (`?` + bind). Eşzamanlı iki kayıt birbirini
 * ezmesin diye kayıt "şu sürümün üzerine" yapılır: arada başka biri
 * kaydettiyse ikincisi reddedilir (409) ve panel kullanıcıya söyler.
 *
 * Tablolar yoksa ilk istekte kurulur (`CREATE TABLE IF NOT EXISTS`);
 * `migrations/0001_icerik.sql` aynı şemayı elle kurmak için. Satır yokken
 * site `src/lib/siteContent.ts` içindeki varsayılan içerikle açılır; ilk
 * kayıt bunların üzerine yazılır. Boş ya da bozuk sayfa oluşmaz.
 */

import type { D1Database } from './cf'

export const GECMIS_SAKLAMA = 50

export const SEMA = [
  `CREATE TABLE IF NOT EXISTS icerik (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    veri TEXT NOT NULL CHECK (json_valid(veri)),
    surum INTEGER NOT NULL CHECK (surum > 0),
    guncelleyen TEXT NOT NULL,
    guncellendi TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS icerik_gecmisi (
    surum INTEGER PRIMARY KEY,
    veri TEXT NOT NULL CHECK (json_valid(veri)),
    guncelleyen TEXT NOT NULL,
    guncellendi TEXT NOT NULL,
    aciklama TEXT NOT NULL DEFAULT ''
  )`,
]

let semaHazir = false
export async function semaHazirla(db: D1Database) {
  if (semaHazir) return
  await db.batch(SEMA.map((s) => db.prepare(s)))
  semaHazir = true
}

export type KayitliIcerik = { veri: unknown; surum: number; guncellendi: string; guncelleyen: string }

/** Kayıtlı içerik; hiç kayıt yoksa (ya da tablo henüz yoksa) null */
export async function icerikOku(db: D1Database): Promise<KayitliIcerik | null> {
  try {
    const r = await db
      .prepare('SELECT veri, surum, guncellendi, guncelleyen FROM icerik WHERE id = 1')
      .first<{ veri: string; surum: number; guncellendi: string; guncelleyen: string }>()
    if (!r) return null
    return { veri: JSON.parse(r.veri), surum: r.surum, guncellendi: r.guncellendi, guncelleyen: r.guncelleyen }
  } catch (e) {
    if (/no such table/i.test(String(e))) return null
    throw e
  }
}

/** Yalnızca sürüm numarası (önbellek doğrulaması için ucuz sorgu) */
export async function surumOku(db: D1Database): Promise<number> {
  try {
    const r = await db.prepare('SELECT surum FROM icerik WHERE id = 1').first<{ surum: number }>()
    return r?.surum ?? 0
  } catch (e) {
    if (/no such table/i.test(String(e))) return 0
    throw e
  }
}

/**
 * İçeriği `taban` sürümünün üzerine kaydeder. Başarılıysa yeni sürüm,
 * arada başka bir kayıt olduysa `{ cakisma }` döner.
 */
export async function icerikKaydet(
  db: D1Database,
  o: { taban: number; icerik: unknown; email: string; aciklama: string },
): Promise<{ surum: number } | { cakisma: number }> {
  await semaHazirla(db)
  const yeni = o.taban + 1
  const zaman = new Date().toISOString()
  const veri = JSON.stringify(o.icerik)
  const sonuc = await db.batch([
    /* Satır yoksa ekle; varsa yalnızca sürüm hâlâ `taban` ise güncelle */
    db
      .prepare(
        `INSERT INTO icerik (id, veri, surum, guncelleyen, guncellendi) VALUES (1, ?1, ?2, ?3, ?4)
         ON CONFLICT(id) DO UPDATE SET veri = excluded.veri, surum = excluded.surum,
           guncelleyen = excluded.guncelleyen, guncellendi = excluded.guncellendi
         WHERE icerik.surum = ?5`,
      )
      .bind(veri, yeni, o.email, zaman, o.taban),
    /* Geçmişe yalnızca yukarıdaki kayıt gerçekten olduysa kopya düşer */
    db
      .prepare(
        `INSERT OR REPLACE INTO icerik_gecmisi (surum, veri, guncelleyen, guncellendi, aciklama)
         SELECT surum, veri, guncelleyen, guncellendi, ?2 FROM icerik WHERE id = 1 AND surum = ?1 AND guncellendi = ?3`,
      )
      .bind(yeni, o.aciklama, zaman),
    db.prepare('DELETE FROM icerik_gecmisi WHERE surum <= ?1').bind(yeni - GECMIS_SAKLAMA),
  ])
  if ((sonuc[0]?.meta.changes ?? 0) === 0) return { cakisma: await surumOku(db) }
  return { surum: yeni }
}

export type GecmisSatiri = { surum: number; guncellendi: string; guncelleyen: string; aciklama: string }

export async function gecmisListe(db: D1Database): Promise<GecmisSatiri[]> {
  try {
    const r = await db
      .prepare('SELECT surum, guncellendi, guncelleyen, aciklama FROM icerik_gecmisi ORDER BY surum DESC LIMIT ?1')
      .bind(GECMIS_SAKLAMA)
      .all<GecmisSatiri>()
    return r.results
  } catch (e) {
    if (/no such table/i.test(String(e))) return []
    throw e
  }
}

export async function gecmisSurumu(db: D1Database, surum: number): Promise<KayitliIcerik | null> {
  try {
    const r = await db
      .prepare('SELECT veri, surum, guncellendi, guncelleyen FROM icerik_gecmisi WHERE surum = ?1')
      .bind(surum)
      .first<{ veri: string; surum: number; guncellendi: string; guncelleyen: string }>()
    return r ? { veri: JSON.parse(r.veri), surum: r.surum, guncellendi: r.guncellendi, guncelleyen: r.guncelleyen } : null
  } catch (e) {
    if (/no such table/i.test(String(e))) return null
    throw e
  }
}

/** Panelden kaydın sonucu: başarı, çakışma ya da hata yanıtına çevrilir */
export const CAKISMA_ILETISI =
  'İçerik siz düzenlerken başka bir yerden kaydedildi. Değişikliklerinizi bir yere not edip sayfayı yenileyin.'
