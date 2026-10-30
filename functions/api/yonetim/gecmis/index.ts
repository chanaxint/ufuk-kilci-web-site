/** GET /api/yonetim/gecmis — son 50 kaydın listesi (içeriksiz) */

import { hata, json } from '../../../_lib/http'
import { gecmisListe } from '../../../_lib/icerik'
import type { PagesContext } from '../../../_lib/cf'

export async function onRequestGet({ env }: PagesContext): Promise<Response> {
  if (!env.DB) return hata(503, 'İçerik veritabanı (D1) bağlı değil.')
  return json(200, { ok: true, surumler: await gecmisListe(env.DB) })
}
