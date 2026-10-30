/**
 * Cloudflare bağlamalarının (D1, R2) kullandığımız kadarının türleri.
 * `@cloudflare/workers-types` paketi tarayıcı türleriyle çakıştığı için
 * yalnızca gereken yüzey burada tanımlı.
 */

export interface D1Result<T = Record<string, unknown>> {
  results: T[]
  success: boolean
  meta: { changes?: number; rows_read?: number; rows_written?: number }
}
export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = Record<string, unknown>>(): Promise<T | null>
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>
  run(): Promise<D1Result>
}
export interface D1Database {
  prepare(sql: string): D1PreparedStatement
  /** Toplu ifadeler tek işlem (transaction) olarak çalışır */
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>
}

export interface R2Object {
  key: string
  size: number
  uploaded: Date
  httpEtag: string
  httpMetadata?: { contentType?: string; cacheControl?: string }
}
export interface R2ObjectBody extends R2Object {
  body: ReadableStream
}
export interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>
  put(
    key: string,
    value: ArrayBuffer | Uint8Array,
    options?: { httpMetadata?: { contentType?: string; cacheControl?: string }; customMetadata?: Record<string, string> },
  ): Promise<R2Object | null>
  delete(keys: string | string[]): Promise<void>
  list(options?: { prefix?: string; cursor?: string; limit?: number }): Promise<{
    objects: R2Object[]
    truncated: boolean
    cursor?: string
  }>
}

/** Pages Functions'ın bütün ortam değerleri (Pages → Settings) */
export interface SiteEnv {
  /** D1 bağlaması: içerik ve sürüm geçmişi */
  DB?: D1Database
  /** R2 bağlaması: yüklenen görseller */
  MEDYA?: R2Bucket
  /** https://<takim>.cloudflareaccess.com */
  ACCESS_TEAM_DOMAIN?: string
  /** Access uygulamalarının AUD etiketleri, virgülle (özel alan adı + pages.dev ayrı uygulamaysa ikisi) */
  ACCESS_AUD?: string
  /** Panele girebilecek e-postalar, virgülle (Access politikasıyla aynı olmalı) */
  YONETICI_EPOSTALARI?: string
  /** İsteğe bağlı: kaydedilmemiş görselin temizlikten korunduğu saat (varsayılan 24) */
  TEMIZLIK_BEKLEME_SAAT?: string
}

export type PagesContext<E = SiteEnv, P extends string = string> = {
  request: Request
  env: E
  params: Record<P, string | string[]>
  data: Record<string, unknown>
  next: () => Promise<Response>
  waitUntil: (p: Promise<unknown>) => void
}
