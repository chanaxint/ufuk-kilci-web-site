/*
 * Tüm sayfayı adım adım inen denetim. Her adımda: üst üste binen yazılar
 * (metin satırı kutuları), ekrandan taşan yazı, kırpılmış metin, 11 px'ten
 * küçük yazı, kırık görsel, yatay taşma, konsol/sayfa hataları; her adımın
 * ekran görüntüsü `denetim-<ad>/` içine.
 *
 * Çalıştırma (geliştirme sunucusu 5173'te açıkken, çalışma klasöründen):
 *   node .claude/araclar/denetim.mjs d1440 1440 900
 *   node .claude/araclar/denetim.mjs m390 390 844 mobil
 *
 * Bilinen yanlış alarmlar: sabit başlık ve mobil arama çubuğunun altından
 * geçen içerik (perde okunurluğu koruyor), "İçeriğe geç" (ekran okuyucu
 * bağlantısı, bilerek 1 px), omurga bölge açıklamaları (üzerine gelinene
 * kadar kapalı), düşmekte olan yorum kâğıtları (havadayken üstten geçer).
 * Konteynerde yazılım WebGL'i ana iş parçacığını yavaşlatıyor; zamanlayıcı
 * ölçümleri gerçek tarayıcıdan uzun çıkar.
 */
// Kullanım: node denetim.mjs <ad> <genişlik> <yükseklik> [mobil]
import pw from '/opt/node22/lib/node_modules/playwright/index.js'
import fs from 'node:fs'
const { chromium } = pw
const [ad, w, h, mob] = [process.argv[2], +process.argv[3], +process.argv[4], process.argv[5] === 'mobil']
const dir = `denetim-${ad}`
fs.mkdirSync(dir, { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const ctx = await b.newContext(mob ? { viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: w, height: h } })
const p = await ctx.newPage()
const hatalar = []
p.on('pageerror', (e) => hatalar.push('PAGEERROR ' + e.message))
p.on('console', (m) => m.type() === 'error' && !/lottie|ERR_TUNNEL|ERR_CERT/.test(m.text()) && hatalar.push('CONSOLE ' + m.text().slice(0, 160)))
await p.goto('http://localhost:5173/', { waitUntil: 'load' })
await p.waitForFunction(() => document.documentElement.style.overflow === '', null, { timeout: 20000 })
await p.waitForTimeout(1200)

const tara = () => p.evaluate(() => {
  const vw = innerWidth, vh = innerHeight
  const effOp = (el) => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; o *= +cs.opacity } return o }
  const kutular = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n.textContent.trim()
    if (!t) continue
    const el = n.parentElement
    if (!el || el.closest('[data-denetim-yok], script, style, svg, canvas')) continue
    const op = effOp(el)
    if (op < 0.25) continue
    const r = document.createRange(); r.selectNodeContents(n)
    for (const q of r.getClientRects()) {
      if (q.width < 2 || q.height < 2) continue
      if (q.bottom < 0 || q.top > vh || q.right < 0 || q.left > vw) continue
      kutular.push({ el, t: t.slice(0, 40), q, op, fs: parseFloat(getComputedStyle(el).fontSize) })
    }
  }
  const cakisma = []
  for (let i = 0; i < kutular.length; i++) for (let j = i + 1; j < kutular.length; j++) {
    const a = kutular[i], c = kutular[j]
    if (a.el === c.el || a.el.contains(c.el) || c.el.contains(a.el)) continue
    const ix = Math.min(a.q.right, c.q.right) - Math.max(a.q.left, c.q.left)
    const iy = Math.min(a.q.bottom, c.q.bottom) - Math.max(a.q.top, c.q.top)
    if (ix > 3 && iy > 3) cakisma.push(`"${a.t}" ⟂ "${c.t}" (${Math.round(ix)}×${Math.round(iy)} @${Math.round(a.q.left)},${Math.round(a.q.top)})`)
  }
  const kucuk = [...new Set(kutular.filter(k => k.fs < 11).map(k => `${k.fs}px "${k.t}"`))]
  // Ekrandan taşan yazı (yatay)
  const tasan = [...new Set(kutular.filter(k => k.q.right > vw + 1 || k.q.left < -1).map(k => `"${k.t}" [${Math.round(k.q.left)}→${Math.round(k.q.right)}]`))]
  // Kırpılmış metin: taşması gizlenmiş kutuda yazı sığmıyor
  const kirpik = []
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el)
    if (!(cs.overflow.includes('hidden') || cs.textOverflow === 'ellipsis')) continue
    if (!el.childNodes.length || ![...el.childNodes].some(c => c.nodeType === 3 && c.textContent.trim())) continue
    const r = el.getBoundingClientRect()
    if (r.bottom < 0 || r.top > vh || r.width === 0) continue
    if (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2) kirpik.push(`"${el.textContent.trim().slice(0, 40)}" ${el.scrollWidth}/${el.clientWidth}×${el.scrollHeight}/${el.clientHeight}`)
  }
  const kirikGorsel = [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.getBoundingClientRect().bottom > 0 && i.getBoundingClientRect().top < vh).map(i => i.src.slice(-50))
  return { y: Math.round(scrollY), docW: document.documentElement.scrollWidth, cakisma, kucuk, tasan, kirpik, kirikGorsel }
})

const H = await p.evaluate(() => document.documentElement.scrollHeight)
const adim = Math.round(h * 0.75)
const rapor = []
let i = 0
for (let y = 0; y < H; y += adim, i++) {
  await p.evaluate((y) => window.scrollTo(0, y), y)
  await p.waitForTimeout(1100)
  const r = await tara()
  const sec = await p.evaluate(() => { const ids = [...document.querySelectorAll('section[id], footer')]; const m = ids.find(s => { const q = s.getBoundingClientRect(); return q.top <= innerHeight / 2 && q.bottom > innerHeight / 2 }); return m ? (m.id || m.tagName) : '?' })
  const f = `${dir}/${String(i).padStart(2, '0')}-${sec}.png`
  await p.screenshot({ path: f })
  rapor.push({ f, sec, ...r })
}
for (const r of rapor) {
  const sorun = r.cakisma.length + r.kucuk.length + r.tasan.length + r.kirpik.length + r.kirikGorsel.length + (r.docW > w ? 1 : 0)
  if (!sorun) continue
  console.log(`\n== ${r.f}  y=${r.y}${r.docW > w ? `  YATAY TAŞMA docW=${r.docW}` : ''}`)
  r.cakisma.slice(0, 12).forEach(c => console.log('  çakışma ', c))
  r.tasan.slice(0, 6).forEach(c => console.log('  taşan   ', c))
  r.kirpik.slice(0, 6).forEach(c => console.log('  kırpık  ', c))
  r.kucuk.slice(0, 6).forEach(c => console.log('  küçük   ', c))
  r.kirikGorsel.forEach(c => console.log('  kırık görsel', c))
}
console.log('\nadım:', rapor.length, 'sayfa yüksekliği:', H)
console.log('hatalar:', JSON.stringify([...new Set(hatalar)]))
await b.close()
