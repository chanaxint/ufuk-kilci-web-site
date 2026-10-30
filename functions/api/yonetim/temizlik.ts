/**
 * POST /api/yonetim/temizlik  { uygula: boolean }
 * Hiçbir içerik sürümünde (güncel + son 50) geçmeyen ve 24 saatten eski
 * fotoğrafları bulur; `uygula: true` ise siler. Silinen fotoğraf geri
 * gelmez; bu yüzden panel önce sayıyı gösterip onay ister.
 */

import { hata, json, jsonOku } from '../../_lib/http'
import { kullanilmayanlar, TEMIZLIK_BEKLEME_MS } from '../../_lib/gorsel'
import type { PagesContext } from '../../_lib/cf'

export async function onRequestPost({ env, request }: PagesContext): Promise<Response> {
  if (!env.DB || !env.MEDYA) return hata(503, 'İçerik veritabanı ya da fotoğraf deposu bağlı değil.')
  const g = await jsonOku(request, 200)
  if ('hata' in g) return g.hata
  const uygula = (g.deger as { uygula?: unknown })?.uygula === true
  const saat = Number(env.TEMIZLIK_BEKLEME_SAAT)
  const bekleme = Number.isFinite(saat) && saat >= 0 && env.TEMIZLIK_BEKLEME_SAAT !== undefined ? saat * 3600_000 : TEMIZLIK_BEKLEME_MS
  const r = await kullanilmayanlar(env.DB, env.MEDYA, bekleme)
  if (uygula) for (let i = 0; i < r.silinecek.length; i += 1000) await env.MEDYA.delete(r.silinecek.slice(i, i + 1000))
  return json(200, { ok: true, toplam: r.toplam, kullanilan: r.kullanilan, silinecek: r.silinecek.length, silindi: uygula ? r.silinecek.length : 0 })
}
