export const doctor = {
  name: 'Ufuk Kilci',
  titles: 'Fizyoterapist - Osteopat',
  shortBio:
    'Ağrıyı susturmak yetmez; sebebini bulmak gerekir. Omurga, duruş ve hareket bütününü değerlendirerek kişiye özel tedavi planları kuruyorum.',
  photo: '/images/ufuk-kilci.jpg',
  phone: '+90 555 000 00 00',
  email: 'info@ufukkilci.com',
  address: 'Örnek Mah. Sağlık Cad. No: 12, Kat 3 — İstanbul',
  mapsUrl: 'https://maps.google.com/?q=Istanbul',
  instagram: 'https://instagram.com/',
  whatsapp: 'https://wa.me/905550000000',
}

export const navLinks = [
  { label: 'Skolyoz', href: '#skolyoz' },
  { label: 'Tedaviler', href: '#tedaviler' },
  { label: 'Hakkımda', href: '#hakkimda' },
  { label: 'Sertifikalar', href: '#sertifikalar' },
  { label: 'S.S.S.', href: '#sss' },
  { label: 'İletişim', href: '#iletisim' },
]

export const stats = [
  { value: 12, suffix: '+', label: 'Yıllık klinik deneyim' },
  { value: 4500, suffix: '+', label: 'Tamamlanan seans' },
  { value: 96, suffix: '%', label: 'Memnuniyet oranı' },
  { value: 18, suffix: '', label: 'Sertifika & eğitim' },
]

export const trustBadges = [
  'Manuel Terapi',
  'Osteopatik Muayene',
  'Kuru İğneleme',
  'Klinik Pilates',
  'Kinezyolojik Bantlama',
  'Postür Analizi',
  'Sporcu Rehabilitasyonu',
  'Nörolojik Rehabilitasyon',
]

export const services = [
  {
    id: 'manuel-terapi',
    title: 'Manuel Terapi',
    description:
      'Eklem mobilizasyonu ve yumuşak doku teknikleriyle kısıtlanmış hareketi geri kazandırır, ağrıyı kaynağında ele alırız.',
    points: ['Eklem mobilizasyonu', 'Miyofasyal gevşetme', 'Trigger point tedavisi'],
    accent: 'brand',
  },
  {
    id: 'osteopati',
    title: 'Osteopatik Tedavi',
    description:
      'Vücudu tek bir bütün olarak okuyan, kraniyosakral ve viseral tekniklerle desteklenen bütüncül bir yaklaşım.',
    points: ['Kraniyosakral terapi', 'Viseral manipülasyon', 'Yapısal denge'],
    accent: 'vital',
  },
  {
    id: 'omurga',
    title: 'Omurga Sağlığı',
    description:
      'Bel ve boyun fıtığı, skolyoz, düzleşme ve duruş bozukluklarında kademeli, kanıta dayalı tedavi programları.',
    points: ['Bel & boyun fıtığı', 'Skolyoz takibi', 'Postür rehabilitasyonu'],
    accent: 'brand',
  },
  {
    id: 'sporcu',
    title: 'Sporcu Rehabilitasyonu',
    description:
      'Sahaya güvenle dönüş için performans testleri, yüklenme planlaması ve sakatlık tekrarını önleyen programlar.',
    points: ['Return-to-play testleri', 'Kuvvet planlaması', 'Sakatlık önleme'],
    accent: 'warm',
  },
  {
    id: 'egzersiz',
    title: 'Kişiye Özel Egzersiz',
    description:
      'Klinikte öğrenilen, evde sürdürülen; ölçülebilir hedeflerle ilerleyen bireysel egzersiz reçeteleri.',
    points: ['Klinik pilates', 'Core stabilizasyon', 'Ev programı takibi'],
    accent: 'vital',
  },
  {
    id: 'agri',
    title: 'Kronik Ağrı Yönetimi',
    description:
      'Uzun süredir devam eden ağrılarda ağrı bilimi eğitimi, yük yönetimi ve fonksiyonel geri dönüş stratejileri.',
    points: ['Ağrı nörobilimi eğitimi', 'Kuru iğneleme', 'Yük yönetimi'],
    accent: 'warm',
  },
] as const

export const testimonials = [
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
]

export const faqs = [
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
]

/**
 * Sertifika görselleri. Gerçek belgeler geldiğinde `image` alanını
 * public/images altındaki dosyayla değiştirmek yeterli.
 */
const SAMPLE_CERTIFICATE = '/images/sertifika-ornek.jpg'

export const credentials = [
  {
    year: '2012',
    title: 'Fizyoterapi ve Rehabilitasyon Lisans',
    org: 'Sağlık Bilimleri Fakültesi',
    image: SAMPLE_CERTIFICATE,
  },
  {
    year: '2015',
    title: 'Manuel Terapi Sertifikasyonu',
    org: 'Uluslararası Manuel Terapi Derneği',
    image: SAMPLE_CERTIFICATE,
  },
  {
    year: '2018',
    title: 'Osteopati Eğitimi (D.O.)',
    org: 'Osteopatik Tıp Akademisi',
    image: SAMPLE_CERTIFICATE,
  },
  {
    year: '2021',
    title: 'Kuru İğneleme & Ağrı Bilimi',
    org: 'Klinik Uygulamalı Eğitim Programı',
    image: SAMPLE_CERTIFICATE,
  },
  {
    year: '2023',
    title: 'Schroth Metodu — Skolyoz Rehabilitasyonu',
    org: 'Uluslararası Schroth Eğitim Enstitüsü',
    image: SAMPLE_CERTIFICATE,
  },
]

export const philosophy = [
  {
    title: 'Önce dinlerim',
    text: 'Ağrının hikâyesi, çoğu zaman görüntüleme raporundan daha fazlasını anlatır.',
  },
  {
    title: 'Zinciri bütün okurum',
    text: 'Boyundaki şikâyetin kaynağı kalçada olabilir; bölgeyi değil bütünü değerlendiririm.',
  },
  {
    title: 'Ölçerek ilerlerim',
    text: 'Her seansta test edilen objektif veriler tedavi planını günceller.',
  },
]

export const workingHours = [
  { day: 'Pazartesi – Cuma', hours: '09:00 – 19:00' },
  { day: 'Cumartesi', hours: '10:00 – 15:00' },
  { day: 'Pazar', hours: 'Kapalı' },
]

export const complaintOptions = [
  'Bel ağrısı / bel fıtığı',
  'Boyun ağrısı / boyun düzleşmesi',
  'Sırt ve duruş problemleri',
  'Spor yaralanması',
  'Ameliyat sonrası rehabilitasyon',
  'Diğer',
]

/** Scroll'a bağlı 3B omurga sahnesindeki metin durakları (taslaktaki 2, 3 ve 4 numaralı bölümler) */
export const stageBeats = [
  {
    id: 'deneyim',
    items: [
      {
        align: 'left' as const,
        kicker: '12+',
        title: 'Yıllık Deneyim',
        text: 'Kliniğe adım atan her hasta, aynı titizlikte değerlendirilen bir hikâye.',
      },
      {
        align: 'right' as const,
        kicker: '4.500+',
        title: 'Tamamlanan Seans',
        text: 'Manuel terapi, osteopati ve egzersiz; ölçülerek ilerleyen binlerce seans.',
      },
    ],
  },
  {
    id: 'yontemler',
    items: [
      {
        align: 'left' as const,
        kicker: 'Schroth',
        title: 'Schroth Tedavisi',
        text: 'Skolyozda üç boyutlu postür düzeltme ve rotasyonel solunum egzersizleri.',
      },
      {
        align: 'right' as const,
        kicker: 'Osteopati',
        title: 'Osteopatik Tedavi',
        text: 'Vücudu tek bir bütün olarak okuyan yapısal, kraniyosakral ve viseral teknikler.',
      },
    ],
  },
  {
    id: 'egzersiz',
    items: [
      {
        align: 'left' as const,
        kicker: 'Bireysel',
        title: 'Kişiye Özel Egzersiz',
        text: 'Klinikte öğrenilen, evde sürdürülen; her kontrolde sadeleşen bir program.',
      },
      {
        align: 'right' as const,
        kicker: 'Sıradaki',
        title: 'Skolyoz Nedir?',
        text: 'Eğriliğin derecesi, takip sıklığı ve tedavi eşiği — hemen aşağıda.',
      },
    ],
  },
]

/** Taslaktaki 5. bölüm — Skolyoz Nedir? */
export const scoliosis = {
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
}

/** Taslaktaki 6. bölüm — Cobb açısına göre evreler */
export const angleStages = [
  {
    max: 10,
    label: 'Eğrilik sayılmaz',
    range: '0° – 10°',
    color: '#5f7047',
    text: 'On derecenin altındaki sapmalar skolyoz olarak tanımlanmaz. Duruş alışkanlıkları ve kas dengesizlikleri değerlendirilir.',
    action: 'Postür eğitimi ve genel egzersiz',
  },
  {
    max: 25,
    label: 'Hafif skolyoz',
    range: '10° – 25°',
    color: '#a87445',
    text: 'Skolyoz tanısının başladığı aralık. Büyüme çağında ilerleme riski nedeniyle düzenli takip gerekir.',
    action: 'Schroth egzersizleri ve 6 aylık takip',
  },
  {
    max: 40,
    label: 'Orta derece skolyoz',
    range: '25° – 40°',
    color: '#c08f3c',
    text: 'Eğriliğin ilerlemesini durdurmak öncelik hâline gelir. Egzersiz programı çoğu zaman korse ile birlikte yürütülür.',
    action: 'Yoğun Schroth programı + korse değerlendirmesi',
  },
  {
    max: 100,
    label: 'İleri derece skolyoz',
    range: '40° ve üzeri',
    color: '#8f4a25',
    text: 'Solunum kapasitesi ve gövde dengesi etkilenebilir. Tedavi, ortopedi hekimiyle birlikte planlanır.',
    action: 'Cerrahi değerlendirme ve destekleyici fizyoterapi',
  },
]
