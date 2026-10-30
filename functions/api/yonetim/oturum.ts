/** GET /api/yonetim/oturum — giriş yapan yönetici (Access belirtecinden) */

import { json } from '../../_lib/http'
import type { PagesContext } from '../../_lib/cf'
import type { Yonetici } from '../../_lib/erisim'

export function onRequestGet(ctx: PagesContext): Response {
  const y = ctx.data.yonetici as Yonetici
  return json(200, { ok: true, email: y.email, depo: { icerik: !!ctx.env.DB, medya: !!ctx.env.MEDYA } })
}
