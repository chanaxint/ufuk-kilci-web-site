/**
 * Omurganın sahnedeki duruşları.
 *
 * Değerler three.js dünya birimi. Kamera z=8 ve fov=35 olduğu için z=0
 * düzleminde ekranın yüksekliği 5.0447 birime denk gelir; yani 1 piksel
 * ≈ 5.0447 / ekranYüksekliği birimdir. Ayar panelini (`?ayar=1`) kullanırken
 * bu dönüşüm zaten yapılır, elle hesaplamak gerekmez.
 *
 * Nesneler bilerek `const` değil de değiştirilebilir: ayar paneli doğrudan
 * bunları güncelliyor ve sahne her karede okuduğu için değişiklik anında
 * ekrana yansıyor.
 */
export type Pose = { x: number; y: number; z: number; scale: number; rotY: number }

/** Fotoğraftaki krom standın üzerinde duruyor */
export const desktopRest: Pose = { x: 1.92, y: 0.16, z: 0, scale: 0.43, rotY: -0.12 }
/** Üzerine tıklanınca kameranın yaklaştığı hâl */
export const desktopFocus: Pose = { x: 0.06, y: -0.02, z: 0.9, scale: 0.8, rotY: 0.3 }

export const mobileRest: Pose = { x: 0.46, y: 0.16, z: 0, scale: 0.4, rotY: -0.12 }
export const mobileFocus: Pose = { x: 0, y: -0.02, z: 0.9, scale: 0.72, rotY: 0.3 }

/** Kamera z=8, fov=35 → z=0 düzleminde ekran yüksekliğinin dünya karşılığı */
export const VIEW_HEIGHT = 2 * 8 * Math.tan((35 * Math.PI) / 360)
