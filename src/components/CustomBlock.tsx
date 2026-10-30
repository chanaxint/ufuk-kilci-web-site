import { useContent } from '../lib/ContentContext'
import { GRAIN, PAPER, AGE } from '../lib/paper'
import { isPreview, sendToPanel } from '../lib/preview'
import { blockAnchor, blockIsEmpty as isEmpty, safeHref, safeImage, type Block, type SiteSectionId } from '../lib/siteContent'
import Reveal from './ui/Reveal'
import CanvasBlock from './CanvasBlock'
import SectionRule from './ui/SectionRule'
import { Emphasis, Paragraphs } from './ui/RichText'
import { ArrowRight } from './ui/icons'

/**
 * Yönetim panelinden eklenen bölümler.
 *
 * Her tür sitenin kendi dilinde: ahşap zeminde fildişi yazı, Hakkımda'daki
 * gibi gölgeli fotoğraf çerçevesi, duyuru için randevu mektubundaki eski
 * kâğıt. Panelde ne yazılırsa düz yazı olarak basılıyor; bağlantı ve görsel
 * adresleri güvenli türlerle sınırlı (`safeHref`, `safeImage`).
 */

function Button({ block, onPaper = false }: { block: Block; onPaper?: boolean }) {
  const href = safeHref(block.buttonHref, useContent())
  if (!block.buttonLabel.trim() || !href) return null
  const external = /^https?:/i.test(href)
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className={`group mt-8 inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-display text-[0.95rem] font-bold transition-colors ${
        onPaper
          ? 'bg-[#2a1d12] text-[#f4ead6] hover:bg-[#3b2a1a]'
          : 'bg-ivory-50 text-ink-900 hover:bg-white'
      }`}
    >
      {block.buttonLabel}
      <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
    </a>
  )
}

function Photo({ src, alt, className }: { src: string; alt: string; className: string }) {
  const url = safeImage(src)
  if (!url) {
    return isPreview ? (
      <div className={`grid place-items-center rounded-3xl border-2 border-dashed border-ivory-100/30 text-[0.95rem] text-ivory-300 ${className}`}>
        Fotoğraf seçilmedi
      </div>
    ) : null
  }
  return <img src={url} alt={alt} loading="lazy" className={`rounded-3xl object-cover shadow-lift ${className}`} />
}

function BlockBody({ block: b }: { block: Block }) {
  switch (b.kind) {
    case 'serbest':
      return <CanvasBlock block={b} />

    case 'yazi':
      return (
        <div className="mx-auto max-w-3xl text-center">
          {b.heading && (
            <Reveal>
              <h2 className="title-lg">
                <Emphasis text={b.heading} />
              </h2>
            </Reveal>
          )}
          {b.text && (
            <Reveal delay={0.1}>
              <div className={`lead ${b.heading ? 'mt-6' : ''}`}>
                <Paragraphs text={b.text} />
              </div>
            </Reveal>
          )}
          <Button block={b} />
        </div>
      )

    case 'fotograf-yazi':
      return (
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal className={b.imageSide === 'sag' ? 'lg:order-2' : ''}>
            <Photo src={b.image} alt={b.caption || b.heading} className="aspect-[4/5] max-h-[34rem] w-full" />
            {b.caption && <p className="mt-3 text-center text-[0.88rem] text-ivory-300">{b.caption}</p>}
          </Reveal>
          <Reveal delay={0.1}>
            {b.heading && (
              <h2 className="title-lg">
                <Emphasis text={b.heading} />
              </h2>
            )}
            {b.text && (
              <div className={`text-[1.05rem] leading-relaxed text-ivory-200 ${b.heading ? 'mt-6' : ''}`}>
                <Paragraphs text={b.text} />
              </div>
            )}
            <Button block={b} />
          </Reveal>
        </div>
      )

    case 'galeri': {
      const images = b.images.filter((im) => safeImage(im.src) || isPreview)
      return (
        <>
          {(b.heading || b.text) && (
            <div className="mx-auto max-w-2xl text-center">
              {b.heading && (
                <Reveal>
                  <h2 className="title-lg">
                    <Emphasis text={b.heading} />
                  </h2>
                </Reveal>
              )}
              {b.text && (
                <Reveal delay={0.1}>
                  <div className={`lead ${b.heading ? 'mt-6' : ''}`}>
                    <Paragraphs text={b.text} />
                  </div>
                </Reveal>
              )}
            </div>
          )}
          <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${b.heading || b.text ? 'mt-12' : ''}`}>
            {images.map((im, i) => (
              <Reveal key={i} delay={Math.min(i, 5) * 0.06}>
                <figure>
                  <Photo src={im.src} alt={im.caption || b.heading} className="aspect-[4/3] w-full" />
                  {im.caption && <figcaption className="mt-3 text-[0.9rem] leading-snug text-ivory-300">{im.caption}</figcaption>}
                </figure>
              </Reveal>
            ))}
          </div>
          {isPreview && images.length === 0 && (
            <p className="mt-6 text-center text-ivory-300">Galeriye henüz fotoğraf eklenmedi.</p>
          )}
          <div className="text-center">
            <Button block={b} />
          </div>
        </>
      )
    }

    case 'buyuk-fotograf':
      return (
        <>
          {b.heading && (
            <Reveal>
              <h2 className="title-lg mb-10 text-center">
                <Emphasis text={b.heading} />
              </h2>
            </Reveal>
          )}
          <Reveal delay={0.08}>
            <figure>
              <Photo src={b.image} alt={b.caption || b.heading} className="aspect-[3/2] max-h-[42rem] w-full" />
              {b.caption && <figcaption className="mt-4 text-center text-[0.95rem] text-ivory-300">{b.caption}</figcaption>}
            </figure>
          </Reveal>
          {b.text && (
            <Reveal delay={0.12}>
              <div className="mx-auto mt-8 max-w-2xl text-center text-[1.02rem] leading-relaxed text-ivory-200">
                <Paragraphs text={b.text} />
              </div>
            </Reveal>
          )}
          <div className="text-center">
            <Button block={b} />
          </div>
        </>
      )

    case 'duyuru':
      return (
        <Reveal>
          <div
            className="relative mx-auto max-w-2xl overflow-hidden rounded-[3px] px-7 py-9 text-center shadow-[0_2px_6px_-2px_rgb(12_7_3/0.5),0_30px_64px_-30px_rgb(12_7_3/0.85),inset_0_0_30px_rgb(126_96_52/0.18)] sm:px-12 sm:py-11"
            style={{ background: PAPER, transform: 'rotate(-0.6deg)' }}
          >
            <span aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.4] mix-blend-multiply" style={GRAIN} />
            <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: AGE }} />
            <div className="relative">
              {b.heading && (
                <h2 className="font-wordmark text-[2rem] leading-[1.1] text-[#31241a] sm:text-[2.4rem]">{b.heading.replace(/\*/g, '')}</h2>
              )}
              {b.text && (
                <div className={`text-[1rem] leading-relaxed text-[#4a3826] ${b.heading ? 'mt-4' : ''}`}>
                  <Paragraphs text={b.text} />
                </div>
              )}
              <Button block={b} onPaper />
            </div>
          </div>
        </Reveal>
      )
  }
}

export function CustomBlock({ block }: { block: Block }) {
  if (isEmpty(block) && !isPreview) return null
  return (
    <section id={blockAnchor(block)} data-bolum={`blok:${block.id}`} className="relative scroll-mt-28 py-20 sm:py-24">
      <EditChip target={`blok:${block.id}`} label="Bu bölümü düzenle" />
      <div className="section-shell">
        {isEmpty(block) && block.kind !== 'serbest' ? (
          <p className="rounded-2xl border-2 border-dashed border-ivory-100/30 py-14 text-center text-ivory-300">
            Boş bölüm — paneldeki alanları doldurun.
          </p>
        ) : (
          <BlockBody block={block} />
        )}
      </div>
    </section>
  )
}

/**
 * Bir sabit bölümün ardından gelen yeni bölümler. Ayırıcı çizgiler sitenin
 * geri kalanıyla aynı ritimde: girişten sonra çizgi blokların ardına,
 * diğerlerinde önüne geliyor. Önizlemede araya "+ Buraya bölüm ekle".
 */
export function BlocksAfter({ after }: { after: SiteSectionId }) {
  const { blocks } = useContent()
  const list = blocks.filter((b) => b.after === after && (isPreview || !isEmpty(b)))
  return (
    <>
      {list.map((b) =>
        after === 'giris' ? (
          <div key={b.id}>
            <CustomBlock block={b} />
            <SectionRule />
          </div>
        ) : (
          <div key={b.id}>
            <SectionRule />
            <CustomBlock block={b} />
          </div>
        ),
      )}
      {isPreview && <InsertBar after={after} />}
    </>
  )
}

/* ——— Yalnızca önizlemede ——— */

/** Bölümün sol üstündeki "Düzenle" etiketi: panelde o bölümün formunu açar */
export function EditChip({
  target,
  label = 'Düzenle',
  at = 'top-3 left-3',
}: {
  target: string
  label?: string
  at?: string
}) {
  if (!isPreview) return null
  return (
    <button
      type="button"
      onClick={() => sendToPanel({ type: 'uk-duzenle', target })}
      style={{ zoom: 'var(--onizleme-olcek, 1)' }}
      className={`absolute ${at} z-40 inline-flex items-center gap-1.5 rounded-full bg-[#6b4a2c] px-3.5 py-2 font-display text-[0.8rem] font-bold text-white shadow-[0_8px_20px_-8px_rgb(0_0_0/0.7)] ring-2 ring-white/70 transition-transform hover:scale-105`}
    >
      ✎ {label}
    </button>
  )
}

function InsertBar({ after }: { after: SiteSectionId }) {
  return (
    <div className="section-shell py-3">
      <button
        type="button"
        onClick={() => sendToPanel({ type: 'uk-ekle', after })}
        style={{ zoom: 'var(--onizleme-olcek, 1)' }}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#e0c59a]/60 bg-[#1a110a]/40 py-3 font-display text-[0.92rem] font-bold text-[#f3dcb4] transition-colors hover:border-[#f3dcb4] hover:bg-[#1a110a]/70"
      >
        + Buraya yeni bölüm ekle
      </button>
    </div>
  )
}
