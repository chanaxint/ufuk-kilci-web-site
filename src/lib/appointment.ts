import { waHref, type SiteContent } from './siteContent'
import { isPreview } from './preview'
import { whatsappMetni, type RandevuTalebi } from './randevuKurallari'

/**
 * Randevu talebi iki yoldan gidebilir; ikisinde de talep hiçbir yerde
 * saklanmaz (veritabanı ya da tarayıcı hafızası yok):
 *
 * - WhatsApp: tarayıcıda hazırlanan mesajla wa.me açılır, ziyaretçi mesajı
 *   KENDİSİ gönderir. Gönderilip gönderilmediğini bilemediğimiz için site
 *   "iletildi" demez.
 * - E-posta: `/api/randevu` (Cloudflare Pages Function) Turnstile'ı doğrular,
 *   talebi e-posta Worker'ı üzerinden doktorun doğrulanmış adresine iletir
 *   (`functions/api/randevu.ts`, `workers/randevu-eposta/`).
 *
 * E-posta yolu yalnızca Turnstile site anahtarı verilince açılır
 * (`VITE_TURNSTILE_SITE_KEY`, herkese açık anahtar; gizli anahtar sunucuda).
 * Verilmezse formda yalnızca WhatsApp seçeneği görünür.
 */
export const TURNSTILE_SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '').trim()
export const RANDEVU_API = '/api/randevu'

/** E-posta seçeneği gösterilsin mi (panel önizlemesinde gönderim yok) */
export const emailAvailable = TURNSTILE_SITE_KEY.length > 0 && !isPreview

export function whatsappHref(talep: RandevuTalebi, content: SiteContent) {
  return `${waHref(content)}?text=${encodeURIComponent(whatsappMetni(talep, content.doctor.name))}`
}

/**
 * Talebi e-postayla iletir. Sunucu kabul ederse sessizce döner; etmezse
 * ziyaretçiye gösterilecek Türkçe iletiyle hata fırlatır. "Kabul edildi",
 * e-postanın gelen kutusuna ulaştığı anlamına gelmez.
 */
export async function sendByEmail(talep: RandevuTalebi, token: string, tuzak: string): Promise<void> {
  let res: Response
  try {
    res = await fetch(RANDEVU_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...talep, onay: true, token, ...(tuzak ? { web_sitesi: tuzak } : {}) }),
    })
  } catch {
    throw new Error('Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin ya da WhatsApp’tan yazın.')
  }
  const data = (await res.json().catch(() => null)) as { ok?: boolean; hata?: string } | null
  if (!res.ok || !data?.ok) throw new Error(data?.hata || 'Talebiniz şu an iletilemedi. Lütfen WhatsApp’tan yazın.')
}
