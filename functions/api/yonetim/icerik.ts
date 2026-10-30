/**
 * /api/yonetim/icerik
 *   GET  kayıtlı içerik + sürüm (kayıt yoksa varsayılan içerik, sürüm 0)
 *   PUT  { surum, icerik }  — `surum` üzerine kaydet; yeni sürüm döner
 */

import { defaultContent } from '../../../src/lib/siteContent'
import { icerikDenetle, ICERIK_SINIRI } from '../../_lib/denetim'
import { hata, json, jsonOku } from '../../_lib/http'
import { CAKISMA_ILETISI, icerikKaydet, icerikOku } from '../../_lib/icerik'
import type { PagesContext } from '../../_lib/cf'
import type { Yonetici } from '../../_lib/erisim'

const DEPO_YOK = 'İçerik veritabanı (D1) bağlı değil. Kurulum: docs/yonetim-paneli.md'

export async function onRequestGet({ env }: PagesContext): Promise<Response> {
  if (!env.DB) return hata(503, DEPO_YOK)
  const k = await icerikOku(env.DB)
  if (!k) return json(200, { ok: true, surum: 0, icerik: defaultContent, guncellendi: null, guncelleyen: null })
  return json(200, { ok: true, surum: k.surum, icerik: k.veri, guncellendi: k.guncellendi, guncelleyen: k.guncelleyen })
}

export async function onRequestPut(ctx: PagesContext): Promise<Response> {
  const { env, request } = ctx
  if (!env.DB) return hata(503, DEPO_YOK)
  const g = await jsonOku(request, ICERIK_SINIRI + 10_000)
  if ('hata' in g) return g.hata
  const b = g.deger as { surum?: unknown; icerik?: unknown }
  if (!b || typeof b !== 'object' || !Number.isInteger(b.surum) || (b.surum as number) < 0) return hata(400, 'Geçersiz istek.')
  const d = icerikDenetle(b.icerik)
  if ('hata' in d) return hata(422, d.hata)
  const y = ctx.data.yonetici as Yonetici
  const r = await icerikKaydet(env.DB, { taban: b.surum as number, icerik: d.icerik, email: y.email, aciklama: 'Kaydet' })
  if ('cakisma' in r) return json(409, { ok: false, hata: CAKISMA_ILETISI, surum: r.cakisma })
  return json(200, { ok: true, surum: r.surum, icerik: d.icerik })
}
