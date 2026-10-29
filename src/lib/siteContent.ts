/**
 * Sitenin yönetim panelinden değiştirilebilen bütün içeriği.
 *
 * Buradaki değerler varsayılan: Supabase bağlı değilken site bunlarla
 * açılıyor, bağlıyken panelden kaydedilen içerik bunların üzerine yazılıyor.
 * Kaydedilmiş içerikte olmayan bir alan (ör. sonradan eklenen yeni bir alan)
 * her zaman buradan geliyor; böylece eski kayıtlar siteyi bozmuyor.
 *
 * Bölüm başlıkları ve skolyoz açı ölçeği bilerek panelde değil: başlıklar
 * tasarımın parçası, açı ölçeği de klinik bir tablo.
 */

export type Stat = { value: number; suffix: string; label: string }
export type Testimonial = { name: string; role: string; quote: string }
export type Credential = { year: string; title: string; org: string; image: string }
export type Faq = { q: string; a: string }
export type Hours = { day: string; hours: string }

export type SiteContent = {
  doctor: {
    name: string
    titles: string
    photo: string
    phone: string
    /** WhatsApp'a mesaj gelecek numara; boşsa telefon numarası kullanılır */
    whatsappNumber: string
    email: string
    address: string
    mapsUrl: string
    instagramHandle: string
    /** Alt bilgideki kısa tanıtım */
    shortBio: string
  }
  hero: {
    /** Girişte "Ufuk Kilci" yazısının altındaki cümle */
    tagline: string
  }
  about: {
    intro: string
    /** Giriş cümlesinin sonunda altın renkle vurgulanan kısım */
    introHighlight: string
    paragraphs: string[]
    chips: string[]
    stats: Stat[]
  }
  scoliosis: {
    definition: string
    note: string
    symptoms: string[]
    symptomsNote: string
  }
  testimonials: {
    intro: string
    rating: string
    ratingCount: string
    items: Testimonial[]
  }
  certificates: {
    intro: string
    items: Credential[]
  }
  faq: {
    intro: string
    items: Faq[]
  }
  contact: {
    heading: string
    intro: string
    hours: Hours[]
  }
  appointment: {
    complaintOptions: string[]
  }
}

/* Yerleşimin taşıyabildiği en fazla öğe: sertifika ve yorum sahneleri elle dağıtılmış noktalara dayanıyor */
export const LIMITS = { certificates: 5, testimonials: 8, stats: 2 } as const

const SAMPLE_CERTIFICATE = '/images/sertifika-ornek.jpg'

export const defaultContent: SiteContent = {
  doctor: {
    name: 'Ufuk Kilci',
    titles: 'Fizyoterapist - Osteopat',
    photo: '/images/ufuk-kilci.jpg',
    phone: '0543 780 50 50',
    whatsappNumber: '0543 780 50 50',
    email: 'info@ufukkilci.com',
    address: '350 Evler Mah. Milli İrade Cad. İŞKUR yanı No: 46, Daire 6-7 — Nevşehir / Merkez',
    mapsUrl:
      'https://maps.google.com/?q=350+Evler+Mahallesi+Milli+İrade+Caddesi+No+46+Nevşehir+Merkez',
    instagramHandle: '@fzt.ufukkilci',
    shortBio:
      'Ağrıyı susturmak yetmez; sebebini bulmak gerekir. Omurga, duruş ve hareket bütününü değerlendirerek kişiye özel tedavi planları kuruyorum.',
  },
  hero: {
    tagline:
      'Ağrıyı susturmak yetmez; sebebini bulmak gerekir. Omurga, duruş ve hareket bütününü tek bir zincir olarak değerlendiren bütüncül bir tedavi yaklaşımı.',
  },
  about: {
    intro: 'Tedaviye her zaman aynı soruyla başlarım:',
    introHighlight: 'bu ağrı neden burada?',
    paragraphs: [
      'On iki yılı aşkın klinik deneyimimde bel ve boyun problemlerinden sporcu yaralanmalarına, skolyozdan ameliyat sonrası rehabilitasyona kadar geniş bir yelpazede çalıştım.',
      'Manuel terapi ve osteopatik teknikleri ölçülebilir hedeflerle ilerleyen egzersiz programlarıyla birleştiriyorum. Amacım seans sayısını uzatmak değil; bedeninizi yönetebildiğiniz noktaya en kısa sürede ulaşmak.',
    ],
    chips: ['Manuel Terapi', 'Osteopati', 'Schroth', 'Kuru İğneleme'],
    stats: [
      { value: 12, suffix: '+', label: 'Yıllık klinik deneyim' },
      { value: 4500, suffix: '+', label: 'Tamamlanan seans' },
    ],
  },
  scoliosis: {
    definition:
      'Skolyoz, omurganın sağa ya da sola doğru 10 dereceden fazla eğilmesi ve aynı anda kendi ekseni etrafında dönmesidir. Yani yalnızca bir "eğrilik" değil; üç boyutlu bir şekil bozukluğudur.',
    note: 'Bu yüzden tedavi de tek düzlemde değil, üç boyutta planlanır.',
    symptoms: [
      'Omuz ve kürek kemiği yüksekliklerinin birbirinden farklı olması',
      'Bir kürek kemiğinin diğerine göre daha belirgin çıkıntı yapması',
      'Öne doğru eğilindiğinde sırtta asimetri ya da kaburgada çıkıntı görülmesi',
      'Gövdenin bir tarafa doğru kaymış görünmesi',
      'Bel çukurlarının ve kalça yüksekliğinin eşit olmaması',
    ],
    symptomsNote:
      'Bu belirtilerden birini fark ettiyseniz erken değerlendirme önemlidir; büyüme çağında eğrilik sessizce ilerleyebilir.',
  },
  testimonials: {
    intro:
      'Farklı yaşlardan, farklı şikâyetlerle gelen hastaların tedavi sonrasında anlattıkları. Hepsi kendi izinleriyle paylaşıldı; isimler kısaltılarak yazıldı.',
    rating: '4.9',
    ratingCount: '120+ değerlendirme',
    items: [
      {
        name: 'Elif A.',
        role: 'Grafik Tasarımcı',
        quote:
          'İki yıldır süren boyun ağrım için gittiğim ilk yer değildi ama son yer oldu. Neyi neden yaptığını anlatması tedaviden bağımsız bir güven veriyor.',
      },
      {
        name: 'Mert K.',
        role: 'Yarı Maraton Koşucusu',
        quote:
          'Sakatlık sonrası koşuya dönüş sürecini haftalara bölerek planladı. Altı haftada yarışa girdim, üstelik daha sağlam bir teknikle.',
      },
      {
        name: 'Ayşe D.',
        role: 'Öğretmen',
        quote:
          'Bel fıtığı ameliyatı önerilmişti. Üç aylık programın sonunda ağrısız şekilde günlük hayatıma döndüm, ameliyat gündemden kalktı.',
      },
      {
        name: 'Can Ö.',
        role: 'Yazılım Geliştirici',
        quote:
          'Masa başı duruşumun ne yaptığını ilk kez birinden net şekilde duydum. Ev egzersizleri kısa ve uygulanabilir, o yüzden gerçekten yapıyorum.',
      },
      {
        name: 'Zeynep T.',
        role: '16 yaşında hastanın annesi',
        quote:
          'Kızımın skolyoz açısı bir yılda ilerlemedi. Schroth egzersizlerini ona sabırla öğretmesi bu işin yarısıydı.',
      },
      {
        name: 'Burak S.',
        role: 'Şef',
        quote:
          'Günde on saat ayaktayım. Bel ağrım için verilen program mutfaktaki düzenime göre kurgulandı; iki ayda ağrısız çalışmaya başladım.',
      },
      {
        name: 'Nihan K.',
        role: 'Yoga Eğitmeni',
        quote:
          'Kalça sıkışmamın kaynağının sırtımda olduğunu burada öğrendim. Bölgeye değil zincire bakması işi çözdü.',
      },
      {
        name: 'Serkan A.',
        role: 'Emekli',
        quote:
          'Yürüyüş mesafem 200 metreye düşmüştü. Üç aylık programın sonunda parkta bir saat yürüyorum.',
      },
    ],
  },
  certificates: {
    intro:
      'Manuel terapi, osteopati, Schroth ve kuru iğneleme başta olmak üzere tamamladığım eğitimler. Her biri, kliniğe yeni bir değerlendirme ya da tedavi yöntemi olarak taşındı; belgeyi büyütmek için üzerine tıklayabilirsiniz.',
    items: [
      { year: '2012', title: 'Fizyoterapi ve Rehabilitasyon Lisans', org: 'Sağlık Bilimleri Fakültesi', image: SAMPLE_CERTIFICATE },
      { year: '2015', title: 'Manuel Terapi Sertifikasyonu', org: 'Uluslararası Manuel Terapi Derneği', image: SAMPLE_CERTIFICATE },
      { year: '2018', title: 'Osteopati Eğitimi (D.O.)', org: 'Osteopatik Tıp Akademisi', image: SAMPLE_CERTIFICATE },
      { year: '2021', title: 'Kuru İğneleme & Ağrı Bilimi', org: 'Klinik Uygulamalı Eğitim Programı', image: SAMPLE_CERTIFICATE },
      { year: '2023', title: 'Schroth Metodu — Skolyoz Rehabilitasyonu', org: 'Uluslararası Schroth Eğitim Enstitüsü', image: SAMPLE_CERTIFICATE },
    ],
  },
  faq: {
    intro:
      'Cevabını bulamadığınız bir soru varsa yazmanız yeterli; aynı gün içinde dönüş yapıyorum.',
    items: [
      {
        q: 'İlk seansta neler oluyor?',
        a: 'İlk seans yaklaşık 45 dakika sürer. Şikâyetinizin hikâyesi, varsa görüntüleme raporlarınız ve günlük yaşam alışkanlıklarınız dinlenir; ardından postür, eklem hareket açıklığı ve kas testlerinden oluşan fiziksel değerlendirme yapılır. Seans sonunda bulgular ve tedavi planı sizinle paylaşılır.',
      },
      {
        q: 'Kaç seansta sonuç alırım?',
        a: 'Akut şikâyetlerde ilk 2–3 seansta belirgin rahatlama sık görülür. Kronikleşmiş tablolarda kalıcı sonuç için genellikle 6–12 seanslık bir program planlanır. Süre, her kontrol seansında ölçülen objektif verilere göre güncellenir.',
      },
      {
        q: 'Doktor sevki ya da reçete gerekli mi?',
        a: 'Değerlendirme seansı için sevk gerekmez. Ancak kırmızı bayrak olarak tanımlanan bulgular (açıklanamayan kilo kaybı, gece ağrısı, ilerleyici güç kaybı vb.) tespit edilirse süreç hekim yönlendirmesiyle birlikte yürütülür.',
      },
      {
        q: 'Osteopati ile fizyoterapi arasındaki fark nedir?',
        a: 'Fizyoterapi ağrıyı ve fonksiyon kaybını hedefe yönelik tekniklerle ele alır; osteopati ise vücudu tek bir bütün olarak değerlendirip bölgeler arası ilişkileri inceler. İki yaklaşımı birleştirmek, şikâyetin kaynağına ulaşmayı kolaylaştırır.',
      },
      {
        q: 'Egzersizleri evde yapmak zorunda mıyım?',
        a: 'Kalıcı sonucun en belirleyici parçası ev programıdır. Programlar günde 10–15 dakikayı aşmayacak şekilde, ekipman gerektirmeden tasarlanır ve her kontrol seansında sadeleştirilerek güncellenir.',
      },
    ],
  },
  contact: {
    heading: 'İlk adımı bugün atalım.',
    intro: 'Formu doldurun ya da doğrudan arayın. Uygun seans saatleri için aynı gün içinde dönüş yapıyorum.',
    hours: [
      { day: 'Pazartesi – Cuma', hours: '09:00 – 19:00' },
      { day: 'Cumartesi', hours: '10:00 – 15:00' },
      { day: 'Pazar', hours: 'Kapalı' },
    ],
  },
  appointment: {
    complaintOptions: [
      'Bel ağrısı / bel fıtığı',
      'Boyun ağrısı / boyun düzleşmesi',
      'Sırt ve duruş problemleri',
      'Spor yaralanması',
      'Ameliyat sonrası rehabilitasyon',
      'Diğer',
    ],
  },
}

/* ——— Türetilen bağlantılar: panelde yalnızca sade bilgi isteniyor ——— */

/** "0543 780 50 50" → "905437805050" (Türkiye cep telefonu varsayımıyla) */
export function waDigits(raw: string) {
  let d = raw.replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  if (d.startsWith('0')) d = '9' + d
  else if (d.length === 10 && d.startsWith('5')) d = '90' + d
  return d
}

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`
export const waHref = (c: SiteContent) => `https://wa.me/${waDigits(c.doctor.whatsappNumber || c.doctor.phone)}`
/** Harita bağlantısı girilmemişse adresten bir Google Haritalar araması */
export const mapsHref = (d: SiteContent['doctor']) =>
  d.mapsUrl.trim() || `https://maps.google.com/?q=${encodeURIComponent(d.address)}`

export const instagramHref = (handle: string) =>
  `https://instagram.com/${handle.trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '')}`

/* ——— Kayıtlı içerikle varsayılanları birleştirme ——— */

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

/** Aynı biçimde boş bir değer: yazı → '', sayı → 0, liste → [] */
function blank<T>(v: T): T {
  if (Array.isArray(v)) return [] as T
  if (isObj(v)) return Object.fromEntries(Object.keys(v).map((k) => [k, blank(v[k])])) as T
  if (typeof v === 'number') return 0 as T
  if (typeof v === 'string') return '' as T
  return v
}

/**
 * Kaydedilmiş içeriği varsayılanların üzerine yazar. Nesneler alan alan
 * birleşiyor; listeler bütün olarak yer değiştiriyor (panelde silinen öğe
 * geri gelmesin). Türü tutmayan değerler yok sayılıyor — bozuk bir kayıt
 * siteyi düşürmesin.
 */
export function mergeContent<T>(base: T, saved: unknown): T {
  if (Array.isArray(base)) {
    if (!Array.isArray(saved)) return base
    /* Her öğe, listenin ilk öğesinin boş bir kopyasıyla tamamlanıyor */
    const tpl = base[0]
    return (tpl === undefined ? saved : saved.map((x) => mergeContent(blank(tpl), x))) as T
  }
  if (isObj(base)) {
    if (!isObj(saved)) return base
    const out: Record<string, unknown> = { ...base }
    for (const k of Object.keys(base)) out[k] = mergeContent((base as Record<string, unknown>)[k], saved[k])
    return out as T
  }
  if (typeof base === 'number') return (typeof saved === 'number' && Number.isFinite(saved) ? saved : base) as T
  if (typeof base === 'string') return (typeof saved === 'string' ? saved : base) as T
  return base
}
