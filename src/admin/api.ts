/**
 * Yönetim panelinin bütün sunucu işleri: oturum, içerik okuma/kaydetme,
 * sürüm geçmişi, yedek, fotoğraf yükleme ve temizlik.
 *
 * Yayında (Cloudflare Pages): istekler sitenin kendi `/api/yonetim/*`
 * fonksiyonlarına gider. Giriş Cloudflare Access ile yapılır: panel
 * sayfası açılmadan önce Access e-posta doğrulaması ister, her API
 * isteğinde de Access'in imzalı belirteci sunucuda denetlenir
 * (`functions/api/yonetim/_middleware.ts`). Panel şifre ya da oturum
 * anahtarı tutmaz; veritabanına ve depoya yalnızca sunucu erişir.
 *
 * `npm run dev` altında (sunucu fonksiyonları yok) "deneme modu": giriş
 * yok, değişiklikler yalnızca bu tarayıcıda saklanır. Yayın derlemesinde
 * `import.meta.env.DEV` sabit `false`, deneme modu hiç açılmaz.
 */
import { DEMO_KEY, demoMode } from '../lib/backend'
import { defaultContent, loadSaved, type SiteContent } from '../lib/siteContent'

export type Mode = 'cloudflare' | 'deneme'
export const mode: Mode = demoMode ? 'deneme' : 'cloudflare'

export class PanelError extends Error {
  constructor(
    message: string,
    /** HTTP durum kodu (0: ağ hatası) */
    readonly status = 0,
    /** 409 çakışmada sunucudaki güncel sürüm */
    readonly surum?: number,
  ) {
    super(message)
  }
}

/* Değiştiren her istekte: çapraz site isteklerine karşı özel başlık (sunucu arar) */
const YAZ = { 'X-Yonetim-Istegi': '1' }

async function istek<T>(yol: string, init: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(yol, { credentials: 'same-origin', cache: 'no-store', ...init })
  } catch {
    throw new PanelError('Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.')
  }
  /* Access oturumu bittiyse istek giriş sayfasına yönlenir: JSON gelmez */
  if (!(res.headers.get('Content-Type') ?? '').includes('application/json')) {
    if (res.ok || res.redirected) throw new PanelError('Oturumunuzun süresi doldu. Sayfayı yenileyip yeniden giriş yapın.', 401)
    throw new PanelError('Beklenmeyen bir hata oldu. Lütfen tekrar deneyin.', res.status)
  }
  const veri = (await res.json().catch(() => null)) as (T & { ok?: boolean; hata?: string; surum?: number }) | null
  if (!res.ok || !veri || veri.ok === false)
    throw new PanelError(veri?.hata || 'Beklenmeyen bir hata oldu. Lütfen tekrar deneyin.', res.status, veri?.surum)
  return veri
}

const jsonYaz = (method: string, govde: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json', ...YAZ },
  body: JSON.stringify(govde),
})

/* ——— Oturum ——— */

/** Giriş yapan yöneticinin e-postası (Access belirtecinden, sunucu söyler) */
export async function currentEmail(): Promise<string> {
  if (mode === 'deneme') return 'deneme modu'
  return (await istek<{ email: string }>('/api/yonetim/oturum')).email
}

/** Cloudflare Access oturumunu kapatır */
export function signOut() {
  location.href = mode === 'deneme' ? '/' : '/cdn-cgi/access/logout'
}

/* ——— İçerik ——— */

export type Kayit = { content: SiteContent; surum: number; guncellendi: string | null; guncelleyen: string | null }

export async function loadContent(): Promise<Kayit> {
  if (mode === 'deneme') {
    try {
      const raw = localStorage.getItem(DEMO_KEY)
      return { content: loadSaved(raw ? JSON.parse(raw) : null), surum: 0, guncellendi: null, guncelleyen: null }
    } catch {
      return { content: defaultContent, surum: 0, guncellendi: null, guncelleyen: null }
    }
  }
  const r = await istek<{ icerik: unknown; surum: number; guncellendi: string | null; guncelleyen: string | null }>('/api/yonetim/icerik')
  return { content: loadSaved(r.icerik), surum: r.surum, guncellendi: r.guncellendi, guncelleyen: r.guncelleyen }
}

/**
 * `surum` üzerine kaydeder. Arada başka biri kaydettiyse 409 ile
 * `PanelError` fırlatır (sunucudaki sürüm `surum` alanında).
 */
export async function saveContent(content: SiteContent, surum: number): Promise<{ content: SiteContent; surum: number }> {
  if (mode === 'deneme') {
    try {
      localStorage.setItem(DEMO_KEY, JSON.stringify(content))
    } catch {
      throw new PanelError('Deneme modunda tarayıcı hafızası doldu. Birkaç fotoğrafı daha küçük seçip tekrar deneyin.')
    }
    return { content, surum: surum + 1 }
  }
  const r = await istek<{ surum: number; icerik: unknown }>('/api/yonetim/icerik', jsonYaz('PUT', { surum, icerik: content }))
  return { content: loadSaved(r.icerik), surum: r.surum }
}

/* ——— Sürüm geçmişi ——— */

export type Surum = { surum: number; guncellendi: string; guncelleyen: string; aciklama: string }

export async function listVersions(): Promise<Surum[]> {
  if (mode === 'deneme') return []
  return (await istek<{ surumler: Surum[] }>('/api/yonetim/gecmis')).surumler
}

export async function loadVersion(n: number): Promise<SiteContent> {
  return loadSaved((await istek<{ icerik: unknown }>(`/api/yonetim/gecmis/${n}`)).icerik)
}

/** Eski bir sürümü yeni sürüm olarak geri yükler */
export async function restoreVersion(n: number, surum: number): Promise<{ content: SiteContent; surum: number }> {
  const r = await istek<{ surum: number; icerik: unknown }>(`/api/yonetim/gecmis/${n}`, jsonYaz('POST', { surum }))
  return { content: loadSaved(r.icerik), surum: r.surum }
}

/* ——— Yedek ——— */

/** Güncel içeriğin yedeğini dosya olarak indirir */
export async function downloadBackup() {
  if (mode === 'deneme') throw new PanelError('Deneme modunda yedek yok.')
  const veri = await istek<Record<string, unknown>>('/api/yonetim/yedek')
  const blob = new Blob([JSON.stringify(veri, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `site-yedegi-${new Date().toISOString().slice(0, 10)}.json`
  document.body.append(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export async function restoreBackup(file: File, surum: number): Promise<{ content: SiteContent; surum: number }> {
  if (file.size > 1_500_000) throw new PanelError('Bu dosya bir site yedeği olamayacak kadar büyük.')
  let yedek: unknown
  try {
    yedek = JSON.parse(await file.text())
  } catch {
    throw new PanelError('Dosya okunamadı. Panelden indirilen bir yedek dosyası seçin.')
  }
  const r = await istek<{ surum: number; icerik: unknown }>('/api/yonetim/yedek', jsonYaz('POST', { surum, yedek }))
  return { content: loadSaved(r.icerik), surum: r.surum }
}

/* ——— Fotoğraflar ——— */

/** Telefon fotoğrafları 5–10 MB geliyor; site için bu boyut yetiyor */
const MAX_SIDE = { portre: 1600, sertifika: 2000, bolum: 2000 } as const
export type ImageKind = keyof typeof MAX_SIDE

/**
 * Fotoğrafı tarayıcıda küçültüp sıkıştırır (WEBP, desteklenmiyorsa JPEG).
 * Yükleme hızlanıyor, site de ağırlaşmıyor. Telefonun yan çevirme bilgisi
 * (EXIF) `createImageBitmap` tarafından uygulanıyor; yeniden kodlama konum
 * gibi üst verileri de siliyor.
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
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new PanelError('Lütfen bir fotoğraf dosyası seçin (JPG, PNG ya da WEBP).')
  if (file.size > 25 * 1024 * 1024) throw new PanelError('Fotoğraf 25 MB’tan büyük. Daha küçük bir fotoğraf seçin.')
  let blob: Blob
  try {
    blob = await shrink(file, mode === 'deneme' ? 1000 : MAX_SIDE[kind], mode === 'deneme' ? 0.8 : 0.86)
  } catch (e) {
    throw e instanceof PanelError ? e : new PanelError('Fotoğraf açılamadı. Başka bir fotoğraf deneyin.')
  }
  /* Tarayıcı hafızası küçük; deneme modunda fotoğraf içeriğe gömülüyor */
  if (mode === 'deneme') return blobToDataUrl(blob)
  const r = await istek<{ url: string }>(`/api/yonetim/gorsel?tur=${kind}`, {
    method: 'POST',
    headers: { 'Content-Type': blob.type, ...YAZ },
    body: blob,
  })
  return r.url
}

/** Hiçbir sürümde kullanılmayan fotoğrafları sayar; `uygula` ise siler */
export async function cleanImages(uygula: boolean): Promise<{ toplam: number; silinecek: number; silindi: number }> {
  if (mode === 'deneme') return { toplam: 0, silinecek: 0, silindi: 0 }
  return istek('/api/yonetim/temizlik', jsonYaz('POST', { uygula }))
}
