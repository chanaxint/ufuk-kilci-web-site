import { waHref, type SiteContent } from './siteContent'
import { SUPABASE_URL, anonHeaders, configured, demoMode } from './backend'
import { isPreview } from './preview'

export type AppointmentForm = {
  name: string
  phone: string
  topic: string
  message: string
}

/**
 * Randevu talebinin gideceği adres.
 *
 * Tarayıcıdan doğrudan WhatsApp'a mesaj göndermek mümkün değil: WhatsApp
 * Cloud API bir erişim anahtarı istiyor ve o anahtar tarayıcıya konulamaz
 * (herkes görür). Bu yüzden form, araya konan küçük bir uç noktaya
 * gönderiliyor; mesajı doktorun WhatsApp'ına ileten taraf orası.
 *
 * Adres `.env` dosyasındaki `VITE_APPOINTMENT_ENDPOINT` ile veriliyor.
 * Tanımlı değilse form yine çalışıyor ama talep hiçbir yere gitmiyor;
 * arayüz bu durumda kullanıcıya WhatsApp bağlantısını gösteriyor.
 * Kurulum: `docs/randevu-gonderimi.md`
 */
export const ENDPOINT = (import.meta.env.VITE_APPOINTMENT_ENDPOINT ?? '').trim()

/**
 * Form servisleri (Web3Forms gibi) gövdede bir `access_key` istiyor. Anahtar
 * gizli değil — formda zaten görünür; önemli olan hangi e-posta adresine
 * bağlı olduğu, o da doktorun hesabı olacak. Burada duruyor ki anahtar
 * geldiğinde kod değil, yalnızca `.env` değişsin.
 */
export const ACCESS_KEY = (import.meta.env.VITE_APPOINTMENT_KEY ?? '').trim()

export const hasEndpoint = ENDPOINT.length > 0

/**
 * Cloudflare Turnstile site anahtarı (herkese açık; gizli anahtar sunucuda).
 * Tanımlıysa talep doğrudan Supabase'e DEĞİL, sitenin kendi sunucu
 * fonksiyonuna (`/api/randevu`) gider: belirteç orada doğrulanır, kayıt
 * sunucu anahtarıyla yapılır. Bu durumda veritabanında ziyaretçinin doğrudan
 * ekleme yetkisi kapatılabilir (`supabase/dogrudan-eklemeyi-kapat.sql`).
 */
export const TURNSTILE_SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '').trim()
export const serverFlow = TURNSTILE_SITE_KEY.length > 0
export const RANDEVU_API = '/api/randevu'

/** Talebin gidebileceği en az bir yer var mı (sunucu, panel, e-posta servisi ya da deneme kaydı) */
export const canDeliver = !isPreview && (serverFlow || configured || hasEndpoint || demoMode)

/** Deneme modunda talepler bu tarayıcıda saklanıyor; panel oradan okuyor */
export const DEMO_REQUESTS_KEY = 'uk-deneme-randevular'

/** Veritabanındaki sınırlarla aynı (`supabase/kurulum.sql`) */
export const REQUEST_LIMITS = { name: 120, phone: 40, topic: 200, message: 2000 }

const clip = (form: AppointmentForm) => ({
  ad: form.name.trim().slice(0, REQUEST_LIMITS.name),
  telefon: form.phone.trim().slice(0, REQUEST_LIMITS.phone),
  konu: form.topic.trim().slice(0, REQUEST_LIMITS.topic),
  mesaj: form.message.trim().slice(0, REQUEST_LIMITS.message),
})

/**
 * Sunucu akışı: Turnstile belirteciyle sitenin kendi fonksiyonuna gönder.
 * Hata iletisi sunucudan geliyor (ör. "Bu numaradan yakın zamanda talep alındı").
 */
async function saveViaServer(form: AppointmentForm, token: string) {
  const res = await fetch(RANDEVU_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...clip(form), onay: true, token }),
  })
  const data = (await res.json().catch(() => null)) as { ok?: boolean; hata?: string } | null
  if (!res.ok || !data?.ok) throw new Error(data?.hata || `Gönderim başarısız: ${res.status}`)
}

/**
 * GEÇİŞ DÖNEMİ: Turnstile kurulmadan önce talep doğrudan Supabase'e yazılıyor.
 * Ziyaretçi yalnızca ekleyebiliyor; okuyan, durumunu değiştiren ve silen
 * yalnızca yönetici (satır kuralları). Yanıt olarak satır istenmiyor
 * (`return=minimal`): ziyaretçinin okuma yetkisi yok, istense kural reddederdi.
 * Sunucu akışı kurulup doğrudan ekleme kapatıldığında bu yol kullanılmaz.
 */
async function saveToPanel(form: AppointmentForm) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/randevu_talepleri`, {
    method: 'POST',
    headers: {
      ...anonHeaders,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ ...clip(form), onay: true }),
  })
  if (!res.ok) throw new Error(`Kayıt başarısız: ${res.status}`)
}

function saveToDemo(form: AppointmentForm) {
  const list = (() => {
    try {
      const raw = JSON.parse(localStorage.getItem(DEMO_REQUESTS_KEY) ?? '[]')
      return Array.isArray(raw) ? raw : []
    } catch {
      return []
    }
  })()
  const id = list.reduce((m: number, r: { id?: number }) => Math.max(m, Number(r.id) || 0), 0) + 1
  list.push({ id, created_at: new Date().toISOString(), ...clip(form), durum: 'yeni' })
  localStorage.setItem(DEMO_REQUESTS_KEY, JSON.stringify(list))
}

/** Hem WhatsApp bağlantısında hem de uç noktaya giden gövdede aynı metin */
export function appointmentText(form: AppointmentForm, content: SiteContent) {
  return [
    `Merhaba ${content.doctor.name},`,
    '',
    `Ad Soyad: ${form.name || '-'}`,
    `Telefon: ${form.phone || '-'}`,
    `Konu: ${form.topic}`,
    form.message ? `Mesaj: ${form.message}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

export function whatsappHref(form: AppointmentForm, content: SiteContent) {
  return `${waHref(content)}?text=${encodeURIComponent(appointmentText(form, content))}`
}

/**
 * Talebi iletir: Supabase bağlıysa yönetim paneline, e-posta uç noktası
 * tanımlıysa oraya da. Biri bile ulaştıysa `true`. Gidecek yer yoksa
 * (ya da paneldeki önizlemedeyse) `false` döner; arayüz o zaman "iletildi"
 * demiyor, kullanıcıya WhatsApp bağlantısını gösteriyor.
 */
export async function sendAppointment(form: AppointmentForm, content: SiteContent, token?: string | null): Promise<boolean> {
  if (!canDeliver) return false
  const jobs: Promise<unknown>[] = []
  if (serverFlow) jobs.push(token ? saveViaServer(form, token) : Promise.reject(new Error('Güvenlik doğrulaması eksik')))
  else if (configured) jobs.push(saveToPanel(form))
  else if (demoMode) jobs.push(Promise.resolve().then(() => saveToDemo(form)))
  if (hasEndpoint) jobs.push(sendToEndpoint(form, content))
  const results = await Promise.allSettled(jobs)
  if (results.some((r) => r.status === 'fulfilled')) return true
  throw new Error('Talep hiçbir yere ulaşmadı')
}

async function sendToEndpoint(form: AppointmentForm, content: SiteContent) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...(ACCESS_KEY ? { access_key: ACCESS_KEY } : {}),
      subject: `Randevu talebi — ${form.name || 'isimsiz'}`,
      from_name: `${content.doctor.name} web sitesi`,
      ...form,
      text: appointmentText(form, content),
      kaynak: 'ufukkilci.com randevu formu',
    }),
  })
  if (!res.ok) throw new Error(`Gönderim başarısız: ${res.status}`)
}
