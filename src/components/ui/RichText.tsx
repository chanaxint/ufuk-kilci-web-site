import { Fragment } from 'react'

/**
 * Panelden gelen başlıklarda *yıldız* içindeki kısım sitenin altın
 * vurgusuyla yazılıyor: "Sonucu en iyi *onlar* anlatır." Başka biçimlendirme
 * yok; metin her zaman düz yazı olarak basılıyor (HTML yorumlanmıyor).
 */
export function Emphasis({ text }: { text: string }) {
  const parts = text.split(/\*([^*]+)\*/)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="gradient-text">
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  )
}

/** Boş satırla ayrılmış paragraflar; paragraf içindeki tek satır sonu korunuyor */
export function Paragraphs({ text, className = '' }: { text: string; className?: string }) {
  const paras = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
  return (
    <>
      {paras.map((p, i) => (
        <p key={i} className={`whitespace-pre-line ${i > 0 ? 'mt-4' : ''} ${className}`}>
          {p}
        </p>
      ))}
    </>
  )
}
