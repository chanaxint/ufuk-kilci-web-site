/**
 * /api/yonetim/gecmis/:surum
 *   GET   o sürümün içeriği (panelde önizlemek için)
 *   POST  { surum }  — o sürümü geri yükle: içeriği YENİ bir sürüm olarak
 *         kaydedilir, böylece geri alma da geri alınabilir.
 */

import { icerikDenetle } from '../../../_lib/denetim'
import { hata, json, jsonOku } from '../../../_lib/http'
import { CAKISMA_ILETISI, gecmisSurumu, icerikKaydet } from '../../../_lib/icerik'
import type { PagesContext } from '../../../_lib/cf'
import type { Yonetici } from '../../../_lib/erisim'

const numara = (v: string | string[] | undefined) => {
  const s = Array.isArray(v) ? '' : (v ?? '')
  return /^\d{1,9}$/.test(s) ? Number(s) : null
}

export async function onRequestGet({ env, params }: PagesContext): Promise<Response> {
  if (!env.DB) return hata(503, 'İçerik veritabanı (D1) bağlı değil.')
  const n = numara(params.surum)
  if (n === null) return hata(400, 'Geçersiz sürüm.')
  const k = await gecmisSurumu(env.DB, n)
  if (!k) return hata(404, 'Bu sürüm bulunamadı (son 50 sürüm saklanır).')
  return json(200, { ok: true, surum: k.surum, icerik: k.veri, guncellendi: k.guncellendi, guncelleyen: k.guncelleyen })
}

export async function onRequestPost(ctx: PagesContext): Promise<Response> {
  const { env, request, params } = ctx
  if (!env.DB) return hata(503, 'İçerik veritabanı (D1) bağlı değil.')
  const n = numara(params.surum)
  if (n === null) return hata(400, 'Geçersiz sürüm.')
  const g = await jsonOku(request, 1000)
  if ('hata' in g) return g.hata
  const taban = (g.deger as { surum?: unknown })?.surum
  if (!Number.isInteger(taban) || (taban as number) < 0) return hata(400, 'Geçersiz istek.')
  const k = await gecmisSurumu(env.DB, n)
  if (!k) return hata(404, 'Bu sürüm bulunamadı (son 50 sürüm saklanır).')
  /* Eski sürüm bugünkü kurallarla yeniden denetlenir */
  const d = icerikDenetle(k.veri)
  if ('hata' in d) return hata(422, d.hata)
  const y = ctx.data.yonetici as Yonetici
  const r = await icerikKaydet(env.DB, { taban: taban as number, icerik: d.icerik, email: y.email, aciklama: `${n}. sürüme geri dönüldü` })
  if ('cakisma' in r) return json(409, { ok: false, hata: CAKISMA_ILETISI, surum: r.cakisma })
  return json(200, { ok: true, surum: r.surum, icerik: d.icerik })
}
