import { doctor } from './content'

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

export const hasEndpoint = ENDPOINT.length > 0

/** Hem WhatsApp bağlantısında hem de uç noktaya giden gövdede aynı metin */
export function appointmentText(form: AppointmentForm) {
  return [
    `Merhaba ${doctor.name},`,
    '',
    `Ad Soyad: ${form.name || '-'}`,
    `Telefon: ${form.phone || '-'}`,
    `Konu: ${form.topic}`,
    form.message ? `Mesaj: ${form.message}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

export function whatsappHref(form: AppointmentForm) {
  return `${doctor.whatsapp}?text=${encodeURIComponent(appointmentText(form))}`
}

/**
 * Talebi uç noktaya gönderir. Uç nokta tanımlı değilse `false` döner;
 * arayüz o zaman "iletildi" demiyor, kullanıcıya bağlantıyı gösteriyor.
 */
export async function sendAppointment(form: AppointmentForm): Promise<boolean> {
  if (!hasEndpoint) return false
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...form,
      text: appointmentText(form),
      kaynak: 'ufukkilci.com randevu formu',
    }),
  })
  if (!res.ok) throw new Error(`Gönderim başarısız: ${res.status}`)
  return true
}
