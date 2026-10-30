import type { ReactNode } from 'react'
import { LIMITS, safeLinkUrl, safeMapsUrl, SEO_LIMITS, type SiteContent } from '../lib/siteContent'
import { CardList, HeadingInput, ImageInput, NumberInput, StringList, TextArea, TextInput } from './fields'

/** Bir bölümün alanlarını değiştirmek için: `set('doctor', { phone: '…' })` */
export type Setter = <K extends keyof SiteContent>(key: K, patch: Partial<SiteContent[K]>) => void

export type Section = {
  id: string
  title: string
  /** Sitede nerede göründüğü — bölümün başında tek cümle */
  where: string
  render: (c: SiteContent, set: Setter) => ReactNode
}

export const sections: Section[] = [
  {
    id: 'genel',
    title: 'Genel bilgiler',
    where: 'Adınız ve unvanınız sitenin her yerinde (üst menü, giriş, alt bilgi) görünür.',
    render: (c, set) => (
      <>
        <TextInput label="Ad soyad" required value={c.doctor.name} onChange={(v) => set('doctor', { name: v })} />
        <TextInput
          label="Unvan"
          required
          hint="Örnek: Fizyoterapist - Osteopat"
          value={c.doctor.titles}
          onChange={(v) => set('doctor', { titles: v })}
        />
        <TextArea
          label="Kısa tanıtım"
          hint="Sayfanın en altında, adınızın altında görünür. İki üç cümle yeterli."
          rows={3}
          value={c.doctor.shortBio}
          onChange={(v) => set('doctor', { shortBio: v })}
        />
      </>
    ),
  },
  {
    id: 'iletisim',
    title: 'İletişim ve çalışma saatleri',
    where: '"İletişim" bölümünde, alt bilgide ve telefondaki arama düğmelerinde görünür. Boş bırakılan satır sitede gösterilmez.',
    render: (c, set) => (
      <>
        <TextInput
          label="Telefon"
          required
          inputMode="tel"
          hint="Ziyaretçi dokununca bu numara aranır. Örnek: 0543 780 50 50"
          value={c.doctor.phone}
          onChange={(v) => set('doctor', { phone: v })}
        />
        <TextInput
          label="WhatsApp numarası"
          inputMode="tel"
          hint="WhatsApp düğmeleri bu numaraya yazar. Boş bırakırsanız telefon numarası kullanılır."
          value={c.doctor.whatsappNumber}
          onChange={(v) => set('doctor', { whatsappNumber: v })}
        />
        <TextInput
          label="E-posta"
          type="email"
          inputMode="email"
          value={c.doctor.email}
          onChange={(v) => set('doctor', { email: v })}
        />
        <TextArea label="Klinik adresi" rows={2} value={c.doctor.address} onChange={(v) => set('doctor', { address: v })} />
        <TextInput
          label="Harita bağlantısı"
          inputMode="url"
          hint={
            c.doctor.mapsUrl.trim() && !safeMapsUrl(c.doctor.mapsUrl) ? (
              <span className="font-semibold text-[#9b3b2a]">
                Bu bağlantı kullanılmayacak: yalnızca https:// ile başlayan adresler kabul ediliyor. Şu an sitede adresten
                arama yapılıyor.
              </span>
            ) : (
              "Google Haritalar'da kliniğinizi açıp 'Paylaş' bağlantısını buraya yapıştırın (https:// ile başlar). Boş bırakırsanız adres aranır."
            )
          }
          value={c.doctor.mapsUrl}
          onChange={(v) => set('doctor', { mapsUrl: v })}
        />
        <TextInput
          label="Instagram kullanıcı adı"
          hint="Örnek: @fzt.ufukkilci"
          value={c.doctor.instagramHandle}
          onChange={(v) => set('doctor', { instagramHandle: v })}
        />
        <TextInput label="İletişim başlığı" value={c.contact.heading} onChange={(v) => set('contact', { heading: v })} />
        <TextArea label="İletişim açıklaması" rows={2} value={c.contact.intro} onChange={(v) => set('contact', { intro: v })} />
        <div className="flex flex-col gap-1.5">
          <p className="font-display text-[0.95rem] font-bold text-[#2a1d12]">Çalışma saatleri</p>
          <CardList
            items={c.contact.hours}
            onChange={(hours) => set('contact', { hours })}
            blank={() => ({ day: '', hours: '' })}
            addLabel="Satır ekle"
            itemName="Satır"
            title={(h) => h.day}
            render={(h, up) => (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label="Gün" hint="Örnek: Pazartesi – Cuma" value={h.day} onChange={(v) => up({ day: v })} />
                <TextInput label="Saat" hint="Örnek: 09:00 – 19:00 ya da Kapalı" value={h.hours} onChange={(v) => up({ hours: v })} />
              </div>
            )}
          />
        </div>
      </>
    ),
  },
  {
    id: 'giris',
    title: 'Giriş ekranı',
    where: 'Siteye girince omurga modelinin yanında, adınızın altında görünen cümle (telefonda yer darlığından gösterilmez).',
    render: (c, set) => (
      <TextArea label="Tanıtım cümlesi" rows={3} value={c.hero.tagline} onChange={(v) => set('hero', { tagline: v })} />
    ),
  },
  {
    id: 'hakkimda',
    title: 'Hakkımda',
    where: '"Hakkımda" bölümü: fotoğrafınız, tanıtım yazınız, uzmanlık etiketleri ve iki sayı.',
    render: (c, set) => (
      <>
        <HeadingInput value={c.headings.hakkimda} onChange={(v) => set('headings', { hakkimda: v })} />
        <ImageInput
          label="Fotoğrafınız"
          hint="Kare ya da dikey, yüzünüzün net göründüğü bir fotoğraf en iyisi."
          kind="portre"
          value={c.doctor.photo}
          onChange={(v) => set('doctor', { photo: v })}
        />
        <TextInput
          label="Giriş cümlesi"
          hint="Başlığın hemen altında görünür."
          value={c.about.intro}
          onChange={(v) => set('about', { intro: v })}
        />
        <TextInput
          label="Vurgulu kısım"
          hint="Giriş cümlesinin sonuna altın renkle eklenir. İstemiyorsanız boş bırakın."
          value={c.about.introHighlight}
          onChange={(v) => set('about', { introHighlight: v })}
        />
        <StringList
          label="Tanıtım yazısı"
          hint="Her kutu bir paragraf. İlk paragraf biraz daha büyük görünür."
          items={c.about.paragraphs}
          onChange={(paragraphs) => set('about', { paragraphs })}
          addLabel="Paragraf ekle"
          itemName="Paragraf"
          multiline
        />
        <StringList
          label="Hizmetler ve uzmanlık etiketleri"
          hint="Yazının altında küçük kutucuklar hâlinde görünür. Örnek: Manuel Terapi. Bir hizmeti ayrıntılı anlatmak için “+ Yeni bölümler”den bölüm ekleyin."
          items={c.about.chips}
          onChange={(chips) => set('about', { chips })}
          addLabel="Etiket ekle"
          itemName="Etiket"
        />
        <div className="flex flex-col gap-1.5">
          <p className="font-display text-[0.95rem] font-bold text-[#2a1d12]">Sayılar</p>
          <p className="-mt-0.5 text-[0.86rem] text-[#7a6650]">
            Fotoğrafın yanında büyük rakamlarla, sayarak görünür. Yalnızca belgeleyebileceğiniz sayıları yazın (deneyim yılı,
            seans sayısı gibi); başarı ya da memnuniyet oranı yazmayın. Boş bırakılırsa görünmez.
          </p>
          <CardList
            items={c.about.stats}
            onChange={(stats) => set('about', { stats })}
            blank={() => ({ value: 0, suffix: '+', label: '' })}
            addLabel="Sayı ekle"
            itemName="Sayı"
            max={LIMITS.stats}
            maxNote={`Bu bölümde en fazla ${LIMITS.stats} sayı gösterilebiliyor.`}
            title={(s) => s.label}
            render={(s, up) => (
              <div className="grid gap-4 sm:grid-cols-[1fr_6rem_2fr]">
                <NumberInput label="Sayı" value={s.value} onChange={(v) => up({ value: v })} />
                <TextInput label="Eki" hint="+, % ya da boş" value={s.suffix} onChange={(v) => up({ suffix: v })} />
                <TextInput label="Açıklama" hint="Örnek: Yıllık klinik deneyim" value={s.label} onChange={(v) => up({ label: v })} />
              </div>
            )}
          />
        </div>
      </>
    ),
  },
  {
    id: 'skolyoz',
    title: 'Skolyoz bölümü',
    where: '"Skolyoz Nedir?" bölümü, altındaki belirtiler listesi ve skolyoz açıları tablosunun başlığı.',
    render: (c, set) => (
      <>
        <HeadingInput value={c.headings.skolyoz} onChange={(v) => set('headings', { skolyoz: v })} />
        <TextArea label="Skolyoz nedir?" rows={4} value={c.scoliosis.definition} onChange={(v) => set('scoliosis', { definition: v })} />
        <TextInput label="Altındaki kalın cümle" value={c.scoliosis.note} onChange={(v) => set('scoliosis', { note: v })} />
        <StringList
          label="Belirtiler"
          items={c.scoliosis.symptoms}
          onChange={(symptoms) => set('scoliosis', { symptoms })}
          addLabel="Belirti ekle"
          itemName="Belirti"
        />
        <TextArea label="Belirtilerin altındaki not" rows={2} value={c.scoliosis.symptomsNote} onChange={(v) => set('scoliosis', { symptomsNote: v })} />
        <HeadingInput label="Belirtiler başlığı" value={c.headings.belirtiler} onChange={(v) => set('headings', { belirtiler: v })} />
        <HeadingInput label="Skolyoz açıları başlığı" value={c.headings.acilar} onChange={(v) => set('headings', { acilar: v })} />
      </>
    ),
  },
  {
    id: 'yorumlar',
    title: 'Hasta yorumları',
    where:
      'Kaydırdıkça yere düşen kâğıtlar. İsim ve unvanı boş kâğıtta yalnızca yorum metni yazar ("Gerçek yorumlar eklenecektir."), yıldız çizilmez; gerçek yorumu, ismi ve unvanı yazınca kâğıt yorum kartına döner. Bütün kâğıtlar silinirse bölüm görünmez. Sağlık hizmetlerinde tanıtım kuralları hasta yorumu ve teşekkürüyle tanıtımı kısıtlayabilir: eklemeden önce hukuki görüş alın; yalnızca gerçek ve izinli yorum ekleyin.',
    render: (c, set) => (
      <>
        <HeadingInput value={c.headings.yorumlar} onChange={(v) => set('headings', { yorumlar: v })} />
        <TextArea label="Bölüm açıklaması" rows={2} value={c.testimonials.intro} onChange={(v) => set('testimonials', { intro: v })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="Puan"
            hint="Örnek: 4.9 — boş bırakırsanız puan kutusu gizlenir."
            value={c.testimonials.rating}
            onChange={(v) => set('testimonials', { rating: v })}
          />
          <TextInput
            label="Puanın altındaki yazı"
            hint="Örnek: 120+ değerlendirme"
            value={c.testimonials.ratingCount}
            onChange={(v) => set('testimonials', { ratingCount: v })}
          />
        </div>
        <CardList
          items={c.testimonials.items}
          onChange={(items) => set('testimonials', { items })}
          blank={() => ({ name: '', role: '', quote: '' })}
          addLabel="Yorum ekle"
          itemName="Yorum"
          max={LIMITS.testimonials}
          maxNote={`Kâğıtların yere dağılımı ${LIMITS.testimonials} yoruma göre ayarlı. Yeni eklemek için birini silin.`}
          title={(t) => t.name}
          render={(t, up) => (
            <>
              <TextArea label="Yorum" rows={3} value={t.quote} onChange={(v) => up({ quote: v })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label="Ad" hint="Örnek: Elif A." value={t.name} onChange={(v) => up({ name: v })} />
                <TextInput label="Meslek ya da not" hint="Örnek: Öğretmen" value={t.role} onChange={(v) => up({ role: v })} />
              </div>
            </>
          )}
        />
      </>
    ),
  },
  {
    id: 'sertifikalar',
    title: 'Sertifikalar',
    where:
      'Yere bırakılmış çerçeveler; ziyaretçi tıklayınca belge büyüyor. Yalnızca size ait gerçek belgelerin fotoğrafını ya da taramasını yükleyin. Fotoğrafı eklenmemiş çerçeve sitede boş kâğıt olarak durur ve tıklanmaz. Bütün çerçeveler silinirse bölüm ve menüdeki bağlantısı görünmez.',
    render: (c, set) => (
      <>
        <HeadingInput value={c.headings.sertifikalar} onChange={(v) => set('headings', { sertifikalar: v })} />
        <TextArea label="Bölüm açıklaması" rows={3} value={c.certificates.intro} onChange={(v) => set('certificates', { intro: v })} />
        <CardList
          items={c.certificates.items}
          onChange={(items) => set('certificates', { items })}
          blank={() => ({ year: '', title: '', org: '', image: '' })}
          addLabel="Sertifika ekle"
          itemName="Sertifika"
          max={LIMITS.certificates}
          maxNote={`Çerçevelerin yerleşimi en fazla ${LIMITS.certificates} belgeye göre ayarlı. Yeni eklemek için birini silin.`}
          title={(x) => x.title}
          render={(x, up) => (
            <>
              <ImageInput
                label="Belgenin fotoğrafı ya da taraması"
                hint="Yatay belge en iyi görünür."
                kind="sertifika"
                aspect="aspect-[4/3]"
                value={x.image}
                onChange={(v) => up({ image: v })}
              />
              <TextInput label="Belgenin adı" hint="Örnek: Manuel Terapi Sertifikasyonu" value={x.title} onChange={(v) => up({ title: v })} />
              <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                <TextInput label="Kurum" value={x.org} onChange={(v) => up({ org: v })} />
                <TextInput label="Yıl" inputMode="numeric" value={x.year} onChange={(v) => up({ year: v })} />
              </div>
            </>
          )}
        />
      </>
    ),
  },
  {
    id: 'sss',
    title: 'Sık sorulan sorular',
    where: 'Sık sorulan sorular bölümü. Soruya tıklanınca cevap açılır.',
    render: (c, set) => (
      <>
        <HeadingInput value={c.headings.sss} onChange={(v) => set('headings', { sss: v })} />
        <TextArea label="Bölüm açıklaması" rows={2} value={c.faq.intro} onChange={(v) => set('faq', { intro: v })} />
        <CardList
          items={c.faq.items}
          onChange={(items) => set('faq', { items })}
          blank={() => ({ q: '', a: '' })}
          addLabel="Soru ekle"
          itemName="Soru"
          title={(f) => f.q}
          render={(f, up) => (
            <>
              <TextInput label="Soru" value={f.q} onChange={(v) => up({ q: v })} />
              <TextArea label="Cevap" rows={4} value={f.a} onChange={(v) => up({ a: v })} />
            </>
          )}
        />
      </>
    ),
  },
  {
    id: 'randevu',
    title: 'Randevu formu',
    where:
      'Randevu mektubunun onay kutusu ve KVKK aydınlatma bağlantısı. Form sağlık bilgisi sormuyor; yalnızca ad, telefon, isteğe bağlı e-posta ve tercih edilen gün/saat.',
    render: (c, set) => (
      <>
        <TextArea
          label="Onay kutusunun metni"
          hint="Hukuki metni hukuk danışmanınızın onayladığı hâliyle yazın."
          rows={3}
          value={c.appointment.consentText}
          onChange={(v) => set('appointment', { consentText: v })}
        />
        <TextInput
          label="KVKK aydınlatma metninin adresi"
          hint={
            c.appointment.privacyUrl.trim() && !safeLinkUrl(c.appointment.privacyUrl) ? (
              <span className="text-[#9b3b2a]">Yalnızca https:// ile başlayan ya da sitede / ile başlayan bir adres kabul edilir.</span>
            ) : (
              'Boş bırakılırsa formda bağlantı görünmez. Metin hazır olunca adresini yazın.'
            )
          }
          value={c.appointment.privacyUrl}
          onChange={(v) => set('appointment', { privacyUrl: v })}
        />
      </>
    ),
  },
  {
    id: 'seo',
    title: 'Arama motorları (SEO)',
    where:
      'Google gibi arama motorlarında ve sitenin bağlantısı paylaşıldığında görünen başlık ve açıklama. Kaydedince sitenin sayfa başlığına yazılır.',
    render: (c, set) => (
      <>
        <TextInput
          label="Sayfa başlığı"
          hint={`Arama sonucundaki mavi başlık. En fazla ${SEO_LIMITS.title} karakter önerilir (şu an ${c.seo.title.length}).`}
          value={c.seo.title}
          onChange={(v) => set('seo', { title: v })}
        />
        <TextArea
          label="Açıklama"
          hint={`Başlığın altındaki iki satırlık yazı. En fazla ${SEO_LIMITS.description} karakter önerilir (şu an ${c.seo.description.length}).`}
          rows={3}
          value={c.seo.description}
          onChange={(v) => set('seo', { description: v })}
        />
      </>
    ),
  },
]

/** Kaydetmeden önce boş bırakılmaması gerekenler */
export function missingRequired(c: SiteContent): { section: string; label: string } | null {
  if (!c.doctor.name.trim()) return { section: 'genel', label: 'Ad soyad' }
  if (!c.doctor.titles.trim()) return { section: 'genel', label: 'Unvan' }
  if (!c.doctor.phone.trim()) return { section: 'iletisim', label: 'Telefon' }
  if (!c.seo.title.trim()) return { section: 'seo', label: 'Sayfa başlığı' }
  return null
}
