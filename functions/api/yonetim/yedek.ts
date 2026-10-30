/**
 * /api/yonetim/yedek
 *   GET   içeriğin yedeği (JSON dosyası olarak indirilir)
 *   POST  { surum, yedek }  — yedekten geri yükle (yeni sürüm olarak)
 *
 * Yedek yalnızca içeriği taşır; fotoğraflar R2'de kalır (temizlik onlara,
 * son 50 sürümde ya da güncel içerikte geçtikleri sürece dokunmaz).
 * Tam veritabanı yedeği için ayrıca: D1 Time Travel ve `wrangler d1 export`
 * (docs/yonetim-paneli.md).
 */

import { defaultContent } from '../../../src/lib/siteContent'
import { icerikDenetle, ICERIK_SINIRI } from '../../_lib/denetim'
import { hata, json, jsonOku } from '../../_lib/http'
import { CAKISMA_ILETISI, icerikKaydet, icerikOku } from '../../_lib/icerik'
import type { PagesContext } from '../../_lib/cf'
import type { Yonetici } from '../../_lib/erisim'

const TUR = 'ufuk-kilci-site-yedegi'

export async function onRequestGet({ env }: PagesContext): Promise<Response> {
  if (!env.DB) return hata(503, 'İçerik veritabanı (D1) bağlı değil.')
  const k = await icerikOku(env.DB)
  const tarih = new Date().toISOString()
  return json(
    200,
    { tur: TUR, bicim: 1, alindi: tarih, surum: k?.surum ?? 0, guncellendi: k?.guncellendi ?? null, icerik: k?.veri ?? defaultContent },
    { 'Content-Disposition': `attachment; filename="site-yedegi-${tarih.slice(0, 10)}.json"` },
  )
}

export async function onRequestPost(ctx: PagesContext): Promise<Response> {
  const { env, request } = ctx
  if (!env.DB) return hata(503, 'İçerik veritabanı (D1) bağlı değil.')
  const g = await jsonOku(request, ICERIK_SINIRI + 20_000)
  if ('hata' in g) return g.hata
  const b = g.deger as { surum?: unknown; yedek?: { tur?: unknown; icerik?: unknown } }
  if (!Number.isInteger(b?.surum) || (b.surum as number) < 0) return hata(400, 'Geçersiz istek.')
  if (b.yedek?.tur !== TUR) return hata(422, 'Bu dosya bu sitenin yedeği değil.')
  const d = icerikDenetle(b.yedek.icerik)
  if ('hata' in d) return hata(422, d.hata)
  const y = ctx.data.yonetici as Yonetici
  const r = await icerikKaydet(env.DB, { taban: b.surum as number, icerik: d.icerik, email: y.email, aciklama: 'Yedekten geri yüklendi' })
  if ('cakisma' in r) return json(409, { ok: false, hata: CAKISMA_ILETISI, surum: r.cakisma })
  return json(200, { ok: true, surum: r.surum, icerik: d.icerik })
}
