/**
 * Yönetim panelinin bütün sunucu işleri: giriş, çıkış, şifre, kaydetme,
 * fotoğraf yükleme.
 *
 * Supabase bağlıysa gerçek işlemler; geliştirmede bağlı değilse "deneme
 * modu" (her şey bu tarayıcıda). Deneme modunda giriş bilgisi KONTROL
 * EDİLMİYOR — bu yüzden yalnızca `npm run dev` altında açılıyor: yayın
 * derlemesinde `import.meta.env.DEV` sabit `false`, `mode` hiçbir zaman
 * 'deneme' olamıyor ve ziyaretçi sitesi tarayıcı hafızasını hiç okumuyor.
 *
 * Asıl güvenlik Supabase'deki satır kurallarında (supabase/kurulum.sql):
 * panelin kendisi kandırılsa bile yönetici listesinde olmayan biri tek
 * bir kelimeyi bile değiştiremiyor.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { BUCKET, configured, DEMO_KEY, demoMode, SUPABASE_ANON_KEY, SUPABASE_URL } from '../lib/backend'
import { defaultContent, mergeContent, type SiteContent } from '../lib/siteContent'

export type Mode = 'supabase' | 'deneme' | 'kurulmamis'
export const mode: Mode = configured ? 'supabase' : demoMode ? 'deneme' : 'kurulmamis'

let client: SupabaseClient | null = null
async function sb() {
  if (!client) {
    const { createClient } = await import('@supabase/supabase-js')
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  }
  return client
}

/* ——— Türkçe hata iletileri ——— */

export class PanelError extends Error {}

function turkce(err: unknown): string {
  const raw = err instanceof Error ? err.message : typeof err === 'object' && err && 'message' in err ? String((err as { message: unknown }).message) : String(err)
  const m = raw.toLowerCase()
  if (m.includes('invalid login credentials')) return 'E-posta ya da şifre hatalı.'
  if (m.includes('email not confirmed')) return 'Bu e-posta adresi henüz onaylanmamış.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Çok fazla deneme yapıldı. Birkaç dakika bekleyip tekrar deneyin.'
  if (m.includes('row-level security') || m.includes('permission denied') || m.includes('42501') || m.includes('unauthorized'))
    return 'Bu hesabın siteyi değiştirme yetkisi yok. Kurulumdaki yönetici e-postasını kontrol edin.'
  if (m.includes('password should be') || m.includes('weak password')) return 'Şifre en az 8 karakter olmalı.'
  if (m.includes('same password') || m.includes('different from the old')) return 'Yeni şifre eskisiyle aynı olamaz.'
  if (m.includes('payload too large') || m.includes('exceeded the maximum')) return 'Fotoğraf çok büyük.'
  if (m.includes('mime') || m.includes('invalid file type')) return 'Bu dosya türü yüklenemiyor. JPG, PNG ya da WEBP seçin.'
  if (m.includes('failed to fetch') || m.includes('network') || m.includes('load failed'))
    return 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.'
  return 'Beklenmeyen bir hata oldu. Lütfen tekrar deneyin.'
}

/* ——— Oturum ——— */

const DEMO_SESSION = 'uk-deneme-oturum'

export async function currentEmail(): Promise<string | null> {
  if (mode === 'supabase') {
    const { data } = await (await sb()).auth.getSession()
    return data.session?.user.email ?? null
  }
  if (mode === 'deneme') return sessionStorage.getItem(DEMO_SESSION)
  return null
}

/**
 * Oturum olaylarını dinler. Şifre sıfırlama bağlantısıyla gelinince
 * `recovery` çağrılıyor: panel o zaman "yeni şifre belirle" ekranını açıyor.
 */
export async function watchAuth(handlers: { recovery: () => void; signedOut: () => void }) {
  if (mode !== 'supabase') return () => {}
  const { data } = (await sb()).auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') handlers.recovery()
    if (event === 'SIGNED_OUT') handlers.signedOut()
  })
  return () => data.subscription.unsubscribe()
}

export async function signIn(email: string, password: string) {
  email = email.trim()
  if (!email || !password) throw new PanelError('E-posta ve şifrenizi yazın.')
  if (mode === 'supabase') {
    const { error } = await (await sb()).auth.signInWithPassword({ email, password })
    if (error) throw new PanelError(turkce(error))
    return
  }
  if (mode === 'deneme') {
    sessionStorage.setItem(DEMO_SESSION, email)
    return
  }
  throw new PanelError('Panel henüz kurulmadı.')
}

export async function signOut() {
  if (mode === 'supabase') await (await sb()).auth.signOut()
  if (mode === 'deneme') sessionStorage.removeItem(DEMO_SESSION)
}

export async function sendReset(email: string) {
  email = email.trim()
  if (!email) throw new PanelError('Önce e-posta adresinizi yazın.')
  if (mode !== 'supabase') throw new PanelError('Şifre sıfırlama, panel kurulduktan sonra çalışır.')
  const { error } = await (await sb()).auth.resetPasswordForEmail(email, {
    redirectTo: `${location.origin}/yonetim/`,
  })
  if (error) throw new PanelError(turkce(error))
}

export async function updatePassword(password: string) {
  if (password.length < 8) throw new PanelError('Şifre en az 8 karakter olmalı.')
  if (mode !== 'supabase') return
  const { error } = await (await sb()).auth.updateUser({ password })
  if (error) throw new PanelError(turkce(error))
}

/* ——— İçerik ——— */

export async function loadContent(): Promise<SiteContent> {
  if (mode === 'supabase') {
    const { data, error } = await (await sb()).from('site_content').select('data').eq('id', 1).maybeSingle()
    if (error) throw new PanelError(turkce(error))
    return mergeContent(defaultContent, data?.data ?? null)
  }
  if (mode === 'deneme') {
    try {
      const raw = localStorage.getItem(DEMO_KEY)
      return mergeContent(defaultContent, raw ? JSON.parse(raw) : null)
    } catch {
      return defaultContent
    }
  }
  return defaultContent
}

export async function saveContent(content: SiteContent) {
  if (mode === 'supabase') {
    /*
     * `select()` olmadan satır kuralı reddi sessiz kalabiliyor (0 satır
     * güncellendi); geri dönen satırı isteyerek yetki sorununu yakalıyoruz.
     */
    const { data, error } = await (await sb())
      .from('site_content')
      .upsert({ id: 1, data: content, updated_at: new Date().toISOString() })
      .select('id')
    if (error) throw new PanelError(turkce(error))
    if (!data?.length) throw new PanelError(turkce('row-level security'))
    return
  }
  if (mode === 'deneme') {
    try {
      localStorage.setItem(DEMO_KEY, JSON.stringify(content))
    } catch {
      throw new PanelError('Deneme modunda tarayıcı hafızası doldu. Birkaç fotoğrafı daha küçük seçip tekrar deneyin.')
    }
    return
  }
  throw new PanelError('Panel henüz kurulmadı.')
}

/* ——— Fotoğraflar ——— */

/** Telefon fotoğrafları 5–10 MB geliyor; site için bu boyut yetiyor */
const MAX_SIDE = { portre: 1600, sertifika: 2000 } as const
export type ImageKind = keyof typeof MAX_SIDE

/**
 * Fotoğrafı tarayıcıda küçültüp sıkıştırır (WEBP, desteklenmiyorsa JPEG).
 * Yükleme hızlanıyor, site de ağırlaşmıyor. Telefonun yan çevirme bilgisi
 * (EXIF) `createImageBitmap` tarafından uygulanıyor.
 */
async function shrink(file: File, maxSide: number, quality: number): Promise<Blob> {
  const bmp = await createImageBitmap(file)
  const k = Math.min(1, maxSide / Math.max(bmp.width, bmp.height))
  const w = Math.round(bmp.width * k)
  const h = Math.round(bmp.height * k)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h)
  bmp.close()
  const encode = (type: string) => new Promise<Blob | null>((res) => canvas.toBlob(res, type, quality))
  const webp = await encode('image/webp')
  if (webp && webp.type === 'image/webp') return webp
  const jpg = await encode('image/jpeg')
  if (!jpg) throw new PanelError('Fotoğraf işlenemedi. Başka bir fotoğraf deneyin.')
  return jpg
}

const blobToDataUrl = (b: Blob) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(String(r.result))
    r.onerror = () => rej(r.error)
    r.readAsDataURL(b)
  })

/** Fotoğrafı yükler, sitede kullanılacak adresi döndürür */
export async function uploadImage(file: File, kind: ImageKind): Promise<string> {
  if (!file.type.startsWith('image/')) throw new PanelError('Lütfen bir fotoğraf dosyası seçin (JPG, PNG ya da WEBP).')
  if (file.size > 25 * 1024 * 1024) throw new PanelError('Fotoğraf 25 MB’tan büyük. Daha küçük bir fotoğraf seçin.')

  if (mode === 'deneme') {
    /* Tarayıcı hafızası küçük; deneme modunda daha sıkı küçültülüyor */
    return blobToDataUrl(await shrink(file, 1000, 0.8))
  }
  if (mode !== 'supabase') throw new PanelError('Panel henüz kurulmadı.')

  const blob = await shrink(file, MAX_SIDE[kind], 0.86)
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${kind}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const store = (await sb()).storage.from(BUCKET)
  const { error } = await store.upload(path, blob, { contentType: blob.type, cacheControl: '31536000', upsert: false })
  if (error) throw new PanelError(turkce(error))
  return store.getPublicUrl(path).data.publicUrl
}
