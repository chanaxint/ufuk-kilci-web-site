/**
 * Omurga modeli tek parça (single-mesh) bir GLB olduğu için parçalar ayrı node'lar
 * hâlinde gelmiyor. Bu yüzden tıklanan noktayı modelin yerel yükseklik oranına
 * (h = 0 → leğen kemiği / en alt, h = 1 → atlas / en üst) çevirip anatomik bölgeye
 * eşliyoruz. Raycast sonucu gelen kesişim noktası bu fonksiyona veriliyor.
 */

export type SpineRegionId = 'servikal' | 'torakal' | 'lomber' | 'sakrum'

export type SpineRegion = {
  id: SpineRegionId
  /** Etiketlerde görünen ad */
  name: string
  /** Vertebra kısaltması (C, T, L …) */
  code: string
  /** Modelin alt ucundan ölçülen normalize aralık [alt, üst] */
  range: [number, number]
  /** Bölgedeki omur sayısı (sakrum için birleşik kabul edilir) */
  vertebraCount: number
  subtitle: string
  description: string
  /** Bu bölgeyle ilişkili sık görülen şikâyetler */
  complaints: string[]
  /** Etiket ve vurgu rengi */
  color: string
  /** Kamera bu bölgeye odaklandığında bakılacak yükseklik oranı */
  focus: number
}

export const spineRegions: SpineRegion[] = [
  {
    id: 'servikal',
    name: 'Servikal Bölge',
    code: 'C1 – C7',
    range: [0.8, 1],
    vertebraCount: 7,
    subtitle: 'Boyun omurları',
    description:
      'Başın ağırlığını taşıyan, en hareketli yedi omur. Masa başı duruşu ve ekran yüksekliği bu bölgeyi doğrudan etkiler.',
    complaints: ['Boyun düzleşmesi', 'Servikal disk hernisi', 'Gerilim tipi baş ağrısı'],
    color: '#2e86d9',
    focus: 0.9,
  },
  {
    id: 'torakal',
    name: 'Torakal Bölge',
    code: 'T1 – T12',
    range: [0.47, 0.8],
    vertebraCount: 12,
    subtitle: 'Sırt omurları',
    description:
      'Kaburgalarla eklemlenen on iki omur. Hareket kısıtlandığında yükü boyun ve bel devralır; sırt sertliği bu yüzden sessiz bir suç ortağıdır.',
    complaints: ['Kamburluk (kifoz)', 'Kürek arası ağrı', 'Kostovertebral kısıtlılık'],
    color: '#16b8a3',
    focus: 0.63,
  },
  {
    id: 'lomber',
    name: 'Lomber Bölge',
    code: 'L1 – L5',
    range: [0.3, 0.47],
    vertebraCount: 5,
    subtitle: 'Bel omurları',
    description:
      'Gövde yükünün büyük kısmını taşıyan beş güçlü omur. Bel ağrısı şikâyetlerinin çoğu bu bölgedeki yük dağılımı bozukluğundan doğar.',
    complaints: ['Bel fıtığı', 'Spondilolistezis', 'Siyatik ağrısı'],
    color: '#1668b8',
    focus: 0.38,
  },
  {
    id: 'sakrum',
    name: 'Sakrum & Pelvis',
    code: 'S1 – S5 / Koksiks',
    range: [0, 0.3],
    vertebraCount: 5,
    subtitle: 'Kuyruk sokumu ve leğen kemiği',
    description:
      'Omurgayı leğen kemiğine bağlayan temel. Sakroiliak eklemdeki milimetrik bir asimetri, zincirin en üstünde ağrı olarak karşımıza çıkabilir.',
    complaints: ['Sakroiliak disfonksiyon', 'Koksidini', 'Pelvik asimetri'],
    color: '#e6a13c',
    focus: 0.15,
  },
]

export const regionById = (id: SpineRegionId) =>
  spineRegions.find((r) => r.id === id) as SpineRegion

/** Yükseklik oranından (0–1) bölgeyi bulur. */
export function regionAtHeight(h: number): SpineRegion {
  const clamped = Math.min(1, Math.max(0, h))
  return (
    spineRegions.find((r) => clamped >= r.range[0] && clamped <= r.range[1]) ?? spineRegions[3]
  )
}

/**
 * Bölge içindeki yaklaşık omur seviyesini döndürür: "T7" gibi.
 * Numaralandırma anatomiye uygun olarak yukarıdan aşağıya artar.
 */
export function vertebraLabel(region: SpineRegion, h: number): string {
  const [low, high] = region.range
  const local = (Math.min(high, Math.max(low, h)) - low) / (high - low) // 0 = alt, 1 = üst
  const index = Math.min(region.vertebraCount, Math.max(1, Math.ceil((1 - local) * region.vertebraCount)))
  const prefix = region.code.charAt(0)
  return `${prefix}${index}`
}

/** Modelin sahnedeki hedef yüksekliği (world birimi) */
export const SPINE_HEIGHT = 4.6

/** Normalize yüksekliği (0–1) sahnedeki Y koordinatına çevirir. */
export function heightToWorldY(h: number) {
  return (h - 0.5) * SPINE_HEIGHT
}

/** Bölge işaretçilerinin omurganın yanındaki konumu */
export function hotspotPosition(region: SpineRegion): [number, number, number] {
  const x = region.id === 'sakrum' ? 1.1 : region.id === 'servikal' ? 0.62 : 0.72
  return [x, heightToWorldY(region.focus), 0.25]
}

/** Omurga üzerinde seçilen nokta */
export type SpineHit = {
  region: SpineRegion
  /** Modelin alt ucundan ölçülen normalize yükseklik (0–1) */
  h: number
  /** Dünya koordinatındaki kesişim noktası */
  point: [number, number, number]
}
