import { SPINE_HEIGHT } from '../../lib/spine'

export type Pose = { x: number; y: number; z: number; scale: number; rotY: number }

/** Kamera z=8, fov=35 → z=0 düzleminde ekran yüksekliğinin dünya karşılığı */
export const VIEW_HEIGHT = 2 * 8 * Math.tan((35 * Math.PI) / 360)

/** Giriş fotoğrafı ve CSS'teki `object-cover object-[70%_center]` karşılığı */
const IMAGE = { w: 2000, h: 1116, posX: 0.7, posY: 0.5 }

/**
 * Omurganın standa oturduğu yer, FOTOĞRAFIN kendi koordinatlarında (0–1).
 *
 * Dünya birimiyle sabit bir konum vermek işe yaramıyor: fotoğraf
 * `object-cover` ile kırpıldığı için stand, pencerenin en–boy oranına göre
 * ekranda yer değiştiriyor ve bir boyutta oturan omurga diğerinde kayıyor.
 * Bu yüzden çıpa fotoğrafa göre tanımlı; duruş her karede o anki pencereye
 * göre hesaplanıyor ve omurga her ekranda aynı noktada kalıyor.
 *
 * `x`,`y`: leğen kemiğinin oturduğu nokta. `span`: omurganın fotoğraf
 * yüksekliğine oranı. Ayar paneli (`?ayar=1`) doğrudan bunları değiştirir.
 */
export const stand = { x: 0.7087, y: 0.772 }
export const spine = { span: 0.498, rotY: -0.52 }

/** Üzerine tıklanınca kameranın yaklaştığı hâl — pencereden bağımsız */
export const desktopFocus: Pose = { x: 0.06, y: -0.02, z: 0.9, scale: 0.8, rotY: 0.3 }
export const mobileFocus: Pose = { x: 0, y: -0.02, z: 0.9, scale: 0.72, rotY: 0.3 }

/** Fotoğrafın `object-cover` ile ekrana oturma katsayıları */
export function coverFit(vw: number, vh: number) {
  const scale = Math.max(vw / IMAGE.w, vh / IMAGE.h)
  return {
    scale,
    offX: (IMAGE.w * scale - vw) * IMAGE.posX,
    offY: (IMAGE.h * scale - vh) * IMAGE.posY,
    pxPerUnit: vh / VIEW_HEIGHT,
  }
}

/** Standın üzerindeki duruş — o anki pencereye göre hesaplanır */
export function restPose(vw: number, vh: number): Pose {
  const { scale, offX, offY, pxPerUnit } = coverFit(vw, vh)

  /* Çıpanın ekrandaki yeri */
  const sx = stand.x * IMAGE.w * scale - offX
  const sy = stand.y * IMAGE.h * scale - offY

  /* Omurganın ekranda kaplayacağı yükseklik → model ölçeği */
  const heightUnits = (spine.span * IMAGE.h * scale) / pxPerUnit
  const s = heightUnits / SPINE_HEIGHT

  return {
    x: (sx - vw / 2) / pxPerUnit,
    /* Çıpa leğen kemiğinin altı; modelin merkezi yarım boy yukarıda */
    y: (vh / 2 - sy) / pxPerUnit + heightUnits / 2,
    z: 0,
    scale: s,
    rotY: spine.rotY,
  }
}
