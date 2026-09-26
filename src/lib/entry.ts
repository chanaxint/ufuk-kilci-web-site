/**
 * Ana sayfa girişi: kliniğe yürüyüşün bittiği, omurganın masanın üstünde
 * durduğu an.
 *
 * Kapıdan başlayan yürüyüş yalnızca siteye ilk girişte oynuyor. Aynı
 * sekmede sayfa yenilendiğinde ya da ortadaki "Ufuk Kilci" yazısına
 * tıklandığında kullanıcı koridora değil, doğrudan bu sahneye geliyor.
 */

/** Giriş sahnesindeki görünmez çapanın kimliği (`SpineStage` içinde) */
export const HERO_ANCHOR = 'giris'

const KEY = 'uk-giris-goruldu'

/**
 * Yürüyüş bir kez izlendi mi. `sessionStorage` sekmeye özel: sekme
 * kapanınca siliniyor, yani siteye yeni gelen herkes yine kapıdan giriyor.
 * Gizli pencere ya da engelli depolamada sessizce "izlenmedi" sayılıyor.
 */
export function introSeen() {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function markIntroSeen() {
  try {
    sessionStorage.setItem(KEY, '1')
  } catch {
    /* depolama kapalıysa her yenilemede kapıdan başlanır, o kadar */
  }
}

/** Giriş sahnesinin sayfadaki kaydırma konumu */
export function heroY() {
  const el = document.getElementById(HERO_ANCHOR)
  return el ? el.getBoundingClientRect().top + window.scrollY : 0
}
