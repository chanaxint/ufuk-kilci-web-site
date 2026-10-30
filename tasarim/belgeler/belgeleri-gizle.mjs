/**
 * Giriş görsellerindeki örnek diplomaları okunmaz hâle getirir.
 *
 * Giriş fotoğrafı ve iki video yapay zekâyla üretildi; duvardaki altı çerçevede
 * gerçek olmayan bir kişiye ait diplomalar var. Gerçek belgelerle yeni görsel
 * üretilene kadar her çerçevedeki KÂĞIDIN İÇİ güçlü biçimde bulanıklaştırılıp
 * kâğıt rengine yaklaştırılıyor; çerçeveler, duvar, lamba, kitaplar, anatomi
 * çizimleri ve masa (3B omurganın oturduğu yer) olduğu gibi kalıyor.
 *
 * Videolarda kamera hareket ettiği için diplomaların yeri her karede izleniyor:
 * referans karedeki diploma bloğu bir şablon; her yeni karede ölçek ve kayma,
 * bir önceki karenin çevresinde aranıyor (ortalaması çıkarılmış mutlak fark).
 *
 * Kullanım (proje kökünden; ffmpeg gerekir):
 *   node tasarim/belgeler/belgeleri-gizle.mjs foto  <giriş.jpg>  <çıkış.jpg>
 *   node tasarim/belgeler/belgeleri-gizle.mjs video <giriş.mp4> <çıkış.mp4> <ileri|geri> [--tahmin N] [--hata-ayikla klasör]
 *     ileri: referans ilk kare (masaya iniş videosu)
 *     geri : referans son kare (kliniğe giriş videosu, son karesi fotoğrafla aynı kadraj)
 *
 * Çıkış videosu README'deki ayarlarla kodlanır (H.264, -g 12: kaydırmayla sarma
 * akıcı kalsın). Mobil ve WEBM kopyaları bundan sonra README'deki komutlarla
 * yeniden üretilir.
 */
import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

/* Referans karede (1280x714, fotoğrafla aynı kadraj) altı diplomanın kâğıt alanı:
   [sol, üst, sağ, alt]. Ahşap çerçevenin iç kenarından birkaç piksel içeride. */
const PAPERS = [
  [311, 35, 491, 170],
  [554, 35, 729, 162],
  [793, 39, 966, 169],
  [310, 228, 491, 346],
  [553, 215, 730, 352],
  [792, 228, 968, 350],
]
/* İzleme şablonu: çerçeveler dahil bütün blok */
const BLOCK = [292, 18, 988, 368]
const REF_W = 1280
const REF_H = 714

const [mode, input, output, dir, ...rest] = process.argv.slice(2)
const opt = (name) => {
  const i = rest.indexOf(name)
  return i >= 0 ? rest[i + 1] : null
}
const debugDir = opt('--hata-ayikla')
/*
 * Blok kaybedildikten sonra en çok kaç kare tahminle örtülsün. İniş videosunda
 * diplomalar kadrajın üstünden yavaşça çıkıyor (≈30 kare). Giriş videosunda ise
 * kapı kasasının arkasından çıkıyorlar: daha geride diploma görünmüyor, o yüzden
 * orada `--tahmin 6` verilir.
 */
const MAX_GUESS = Number(opt('--tahmin') ?? 40)
if (!mode || !input || !output) {
  console.error('Kullanım: foto <giriş> <çıkış> | video <giriş> <çıkış> <ileri|geri> [--hata-ayikla klasör]')
  process.exit(1)
}

function probe(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-count_frames', '-show_entries', 'stream=width,height,nb_read_frames,r_frame_rate', '-of', 'json', file])
  const s = JSON.parse(r.stdout).streams[0]
  return { w: s.width, h: s.height, n: Number(s.nb_read_frames), fps: s.r_frame_rate }
}

function readFrames(file, w, h, pixFmt, bpp) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'rawvideo', '-pix_fmt', pixFmt, '-'], { maxBuffer: 2 ** 31 })
  if (r.status !== 0) throw new Error(String(r.stderr))
  const size = w * h * bpp
  const frames = []
  for (let o = 0; o + size <= r.stdout.length; o += size) frames.push(r.stdout.subarray(o, o + size))
  return frames
}

/* ——— İzleme (yarım çözünürlükte gri) ——— */

function track(gray, w, h, refIndex, direction) {
  const k = w / REF_W // gerçek kare / referans ölçeği
  const ref = gray[refIndex]
  /* Şablon noktaları: referans karede blok içindeki her 3. piksel */
  const pts = []
  for (let y = BLOCK[1] * k; y < BLOCK[3] * k; y += 3) for (let x = BLOCK[0] * k; x < BLOCK[2] * k; x += 3) pts.push([x, y, ref[(y | 0) * w + (x | 0)]])

  /* Durum: referans noktası (x,y) → s*x + tx, s*y + ty (gerçek kare pikseli) */
  const cost = (img, s, tx, ty) => {
    let sum = 0
    let inside = 0
    let iMean = 0
    const vals = []
    for (const [x, y, v] of pts) {
      const X = Math.round(s * x + tx)
      const Y = Math.round(s * y + ty)
      if (X < 0 || Y < 0 || X >= w || Y >= h) continue
      const iv = img[Y * w + X]
      vals.push(v, iv)
      iMean += iv
      inside++
    }
    if (inside < pts.length * 0.25) return { c: Infinity, f: inside / pts.length }
    iMean /= inside
    let tm = 0
    for (let i = 0; i < vals.length; i += 2) tm += vals[i]
    tm /= inside
    for (let i = 0; i < vals.length; i += 2) sum += Math.abs(vals[i] - tm - (vals[i + 1] - iMean))
    return { c: sum / inside, f: inside / pts.length }
  }

  /*
   * Her diplomanın kendi şablonu (ahşap çerçevesi dahil). Kamera açılı
   * baktığında blok tek parça ölçeklenmiyor (perspektif): blok konumu yalnızca
   * başlangıç, her kâğıt kendi çevresinde ayrıca aranıyor.
   */
  const paperTpl = PAPERS.map(([a, b, c, d]) => {
    const m = 14
    const tp = []
    for (let y = (b - m) * k; y < (d + m) * k; y += 2) for (let x = (a - m) * k; x < (c + m) * k; x += 2) tp.push([x, y, ref[(y | 0) * w + (x | 0)]])
    return { pts: tp, cx: ((a + c) / 2) * k, cy: ((b + d) / 2) * k }
  })
  const CX = ((BLOCK[0] + BLOCK[2]) / 2) * k
  const CY = ((BLOCK[1] + BLOCK[3]) / 2) * k
  const states = new Array(gray.length).fill(null)
  states[refIndex] = { s: 1, tx: 0, ty: 0, c: cost(ref, 1, 0, 0).c, f: 1, per: PAPERS.map(() => ({ sx: 1, sy: 1, tx: 0, ty: 0 })) }
  let prev = states[refIndex]
  for (let i = refIndex + direction; i >= 0 && i < gray.length; i += direction) {
    const img = gray[i]
    let best = null
    /* Kaba → ince: ölçek ±%5 / ±%1,2 / ±%0,4, kayma ±16 / ±4 / ±1 px (yarım çözünürlük) */
    for (const [ds, dt, st, sstep] of [
      [0.05, 16, 4, 0.01],
      [0.012, 4, 2, 0.004],
      [0.004, 1, 1, 0.002],
    ]) {
      const base = best ?? prev
      for (let s = base.s * (1 - ds); s <= base.s * (1 + ds) + 1e-9; s += base.s * sstep) {
        /* ölçek değişince merkez sabit kalsın diye kaymayı düzelt */
        const cx = ((BLOCK[0] + BLOCK[2]) / 2) * k
        const cy = ((BLOCK[1] + BLOCK[3]) / 2) * k
        const ox = base.s * cx + base.tx - s * cx
        const oy = base.s * cy + base.ty - s * cy
        for (let dx = -dt; dx <= dt; dx += st)
          for (let dy = -dt; dy <= dt; dy += st) {
            const r = cost(img, s, ox + dx, oy + dy)
            if (!best || r.c < best.c) best = { s, tx: ox + dx, ty: oy + dy, c: r.c, f: r.f }
          }
      }
    }
    /*
     * Blok kadrajdan çıkarken eşleşme bozulur (fark birden 25-40'a çıkıyor; iyi
     * eşleşmede 6'nın altında). O andan sonra aramak yerine son iyi karelerin
     * hızıyla devam et: kâğıtların kenarda kalan parçası da örtülsün, blok
     * kadrajdan tamamen çıkınca dur.
     */
    if (!best || !Number.isFinite(best.c) || best.c > LOST_COST || best.s < MIN_SCALE) {
      const good = []
      for (let j = i - direction; j >= 0 && j < gray.length && good.length < 7; j -= direction) if (states[j] && !states[j].tahmin) good.push(states[j])
      if (good.length < 2) break
      const n = good.length - 1
      /* ölçek çarpanla (yaklaşma/uzaklaşma), merkez doğrusal ilerliyor */
      const rate = Math.pow(good[0].s / good[n].s, 1 / n)
      const center = (st) => [st.s * CX + st.tx, st.s * CY + st.ty]
      const [c0x, c0y] = center(good[0])
      const [cnx, cny] = center(good[n])
      const vx = (c0x - cnx) / n
      const vy = (c0y - cny) / n
      let cur = prev
      for (let j = i, guessed = 0; j >= 0 && j < gray.length && guessed < MAX_GUESS; j += direction, guessed++) {
        const [cx, cy] = center(cur)
        const s = cur.s * rate
        cur = { s, tx: cx + vx - s * CX, ty: cy + vy - s * CY, c: NaN, tahmin: true }
        if (s < MIN_SCALE || !papersVisible(cur, k, w, h)) break
        states[j] = cur
      }
      break
    }
    states[i] = best
    prev = best
    best.per = refinePapers(img, w, h, k, best, paperTpl)
    /*
     * Şablonu bu kareyle tazele (ışık ve bakış açısı yavaş yavaş değişiyor) —
     * yalnızca blok neredeyse tamamen kadrajdayken. Kenardan çıkarken
     * tazelenirse şablon duvara/masaya uyar ve izleme olmayan bir şeyi kovalar.
     */
    if (best.f >= 0.9) for (const p of pts) {
      const X = Math.round(best.s * p[0] + best.tx)
      const Y = Math.round(best.s * p[1] + best.ty)
      if (X >= 0 && Y >= 0 && X < w && Y < h) p[2] = img[Y * w + X]
    }
  }
  return states
}

/**
 * Tek bir diplomanın dönüşümü: x ve y ölçeği ayrı (açılı bakışta çerçeve
 * yatayda daralıyor) + kayma. Blok tahmininin çevresinde aranıyor; eşleşme
 * zayıfsa o diploma için blok dönüşümü kullanılıyor (null).
 */
function refinePapers(img, w, h, k, block, tpls) {
  return tpls.map((t) => {
    const evalAt = (sx, sy, tx, ty) => {
      let inside = 0
      let m1 = 0
      let m2 = 0
      const vals = []
      for (const [x, y, v] of t.pts) {
        const X = Math.round(sx * x + tx)
        const Y = Math.round(sy * y + ty)
        if (X < 0 || Y < 0 || X >= w || Y >= h) continue
        const iv = img[Y * w + X]
        vals.push(v, iv)
        m1 += v
        m2 += iv
        inside++
      }
      if (inside < t.pts.length * 0.6) return Infinity
      m1 /= inside
      m2 /= inside
      let sum = 0
      for (let i = 0; i < vals.length; i += 2) sum += Math.abs(vals[i] - m1 - (vals[i + 1] - m2))
      return sum / inside
    }
    /* kâğıdın merkezi blok dönüşümüyle nereye düşüyor */
    const pcx = block.s * t.cx + block.tx
    const pcy = block.s * t.cy + block.ty
    let best = null
    for (const [ds, dt, st, sstep] of [
      [0.08, 8, 2, 0.02],
      [0.02, 2, 1, 0.005],
    ]) {
      const b = best ?? { sx: block.s, sy: block.s, cx: pcx, cy: pcy }
      for (let sx = b.sx * (1 - ds); sx <= b.sx * (1 + ds) + 1e-9; sx += b.sx * sstep)
        for (let sy = b.sy * (1 - ds); sy <= b.sy * (1 + ds) + 1e-9; sy += b.sy * sstep)
          for (let dx = -dt; dx <= dt; dx += st)
            for (let dy = -dt; dy <= dt; dy += st) {
              const cx = b.cx + dx
              const cy = b.cy + dy
              const c = evalAt(sx, sy, cx - sx * t.cx, cy - sy * t.cy)
              if (!best || c < best.c) best = { sx, sy, cx, cy, c }
            }
    }
    if (!best || !Number.isFinite(best.c) || best.c > LOST_COST) return null
    /* şablonu tazele (diploma tamamen kadrajda) */
    const tx = best.cx - best.sx * t.cx
    const ty = best.cy - best.sy * t.cy
    for (const p of t.pts) {
      const X = Math.round(best.sx * p[0] + tx)
      const Y = Math.round(best.sy * p[1] + ty)
      if (X >= 0 && Y >= 0 && X < w && Y < h) p[2] = img[Y * w + X]
    }
    return { sx: best.sx, sy: best.sy, tx, ty, c: best.c }
  })
}

/* İyi eşleşmede fark 2-8; bloğu kaybedince 25-40'a sıçrıyor */
const LOST_COST = 16
/* Bu ölçeğin altında diploma ~60 px genişliğe iner, yazı okunmaz; izleme durur */
const MIN_SCALE = 0.33

/** Kâğıtlardan en az biri kadrajda mı (yarım çözünürlük koordinatlarında) */
function papersVisible(st, k, w, h) {
  return PAPERS.some(([a, b, c, d]) => {
    const x0 = st.s * a * k + st.tx
    const y0 = st.s * b * k + st.ty
    const x1 = st.s * c * k + st.tx
    const y1 = st.s * d * k + st.ty
    return x1 > 0 && y1 > 0 && x0 < w && y0 < h
  })
}

/* ——— Bulanıklaştırma (RGB, tam çözünürlük) ——— */

function boxBlurRect(buf, w, x0, y0, x1, y1, r, flatten) {
  const W = x1 - x0
  const H = y1 - y0
  if (W < 3 || H < 3) return
  const tmp = new Float32Array(W * H * 3)
  const src = new Float32Array(W * H * 3)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) for (let c = 0; c < 3; c++) src[(y * W + x) * 3 + c] = buf[((y0 + y) * w + x0 + x) * 3 + c]
  const pass = (a, b, horiz) => {
    const len = horiz ? W : H
    const lines = horiz ? H : W
    for (let l = 0; l < lines; l++)
      for (let c = 0; c < 3; c++) {
        let acc = 0
        const at = (i) => {
          const j = Math.min(len - 1, Math.max(0, i))
          return horiz ? a[(l * W + j) * 3 + c] : a[(j * W + l) * 3 + c]
        }
        for (let i = -r; i <= r; i++) acc += at(i)
        for (let i = 0; i < len; i++) {
          if (horiz) b[(l * W + i) * 3 + c] = acc / (2 * r + 1)
          else b[(i * W + l) * 3 + c] = acc / (2 * r + 1)
          acc += at(i + r + 1) - at(i - r)
        }
      }
  }
  for (let k = 0; k < 3; k++) {
    pass(src, tmp, true)
    pass(tmp, src, false)
  }
  /* Kâğıdın ortalama rengi: bulanık lekeleri ona yaklaştır, kenarları yumuşat */
  const mean = [0, 0, 0]
  for (let i = 0; i < W * H; i++) for (let c = 0; c < 3; c++) mean[c] += src[i * 3 + c]
  for (let c = 0; c < 3; c++) mean[c] /= W * H
  const feather = Math.max(2, Math.round(Math.min(W, H) * 0.05))
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const edge = Math.min(x, y, W - 1 - x, H - 1 - y)
      const a = Math.min(1, (edge + 1) / feather)
      for (let c = 0; c < 3; c++) {
        const i = ((y0 + y) * w + x0 + x) * 3 + c
        const flat = src[(y * W + x) * 3 + c] * (1 - flatten) + mean[c] * flatten
        buf[i] = Math.round(buf[i] * (1 - a) + flat * a)
      }
    }
}

function hidePapers(buf, w, h, st, k) {
  /* Tahmin edilen karede dikdörtgen kâğıda tam oturmayabilir: yalnızca bulanıklaştır,
     kâğıt rengine yaklaştırma (komşu kapı kasası grileşmesin) */
  const flatten = st.tahmin ? 0 : 0.55
  PAPERS.forEach(([a, b, c, d], i) => {
    const t = paperTransform(st, i)
    const x0 = Math.max(0, Math.round(t.sx * a * k + t.tx))
    const y0 = Math.max(0, Math.round(t.sy * b * k + t.ty))
    const x1 = Math.min(w, Math.round(t.sx * c * k + t.tx))
    const y1 = Math.min(h, Math.round(t.sy * d * k + t.ty))
    if (x1 - x0 < 3 || y1 - y0 < 3) return
    boxBlurRect(buf, w, x0, y0, x1, y1, Math.max(3, Math.round((y1 - y0) * 0.09)), flatten)
  })
}

/** Bir diplomanın dönüşümü: kendi ince ayarı varsa o, yoksa blok */
function paperTransform(st, i) {
  return st.per?.[i] ?? { sx: st.s, sy: st.s, tx: st.tx, ty: st.ty }
}

function outline(buf, w, h, st, k) {
  for (const [i, [a, b, c, d]] of PAPERS.entries()) {
    const t = paperTransform(st, i)
    const r = [t.sx * a * k + t.tx, t.sy * b * k + t.ty, t.sx * c * k + t.tx, t.sy * d * k + t.ty].map(Math.round)
    for (let x = r[0]; x <= r[2]; x++) for (const y of [r[1], r[3]]) if (x >= 0 && y >= 0 && x < w && y < h) buf.set([255, 0, 120], (y * w + x) * 3)
    for (let y = r[1]; y <= r[3]; y++) for (const x of [r[0], r[2]]) if (x >= 0 && y >= 0 && x < w && y < h) buf.set([255, 0, 120], (y * w + x) * 3)
  }
}

/* ——— Fotoğraf ——— */

if (mode === 'foto') {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'json', input])
  const { width: w, height: h } = JSON.parse(r.stdout).streams[0]
  const buf = Buffer.from(readFrames(input, w, h, 'rgb24', 3)[0])
  hidePapers(buf, w, h, { s: 1, tx: 0, ty: 0 }, w / REF_W)
  const enc = spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${w}x${h}`, '-i', '-', '-q:v', '2', output], { input: buf })
  if (enc.status !== 0) throw new Error(String(enc.stderr))
  console.log(`foto: ${path.basename(output)} (${w}x${h}) yazıldı`)
  process.exit(0)
}

/* ——— Video ——— */

const info = probe(input)
const { w, h } = info
const hw = Math.round(w / 2)
const hh = Math.round(h / 2)
const grayHalf = spawnSync('ffmpeg', ['-v', 'error', '-i', input, '-vf', `scale=${hw}:${hh},format=gray`, '-f', 'rawvideo', '-'], { maxBuffer: 2 ** 31 }).stdout
const gray = []
for (let o = 0; o + hw * hh <= grayHalf.length; o += hw * hh) gray.push(grayHalf.subarray(o, o + hw * hh))
const refIndex = dir === 'geri' ? gray.length - 1 : 0
console.log(`${path.basename(input)}: ${gray.length} kare, referans ${refIndex}, izleniyor…`)
const half = track(gray, hw, hh, refIndex, dir === 'geri' ? -1 : 1)
/* yarım çözünürlükteki kaymayı tam çözünürlüğe taşı */
const toFull = (t) => t && { ...t, tx: t.tx * (w / hw), ty: t.ty * (h / hh) }
const states = half.map((s) => (s ? { ...toFull(s), per: s.per?.map(toFull) } : null))
const tracked = states.filter(Boolean).length
const measured = states.filter((s) => s && !s.tahmin)
const worst = Math.max(...measured.map((s) => s.c))
console.log(`örtülen kare: ${tracked}/${gray.length} (ölçülen ${measured.length}, tahmin ${tracked - measured.length}) · en kötü eşleşme farkı: ${worst.toFixed(1)}`)
fs.writeFileSync(output + '.izleme.json', JSON.stringify(states.map((s, i) => s && { i, s: +s.s.toFixed(4), tx: +s.tx.toFixed(1), ty: +s.ty.toFixed(1), c: s.tahmin ? 'tahmin' : +s.c.toFixed(1), ince: s.per ? s.per.filter(Boolean).length : 0 })))

const frames = readFrames(input, w, h, 'rgb24', 3)
const enc = spawn('ffmpeg', [
  '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${w}x${h}`, '-r', info.fps, '-i', '-',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', process.env.CRF ?? '25', '-g', '12', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', output,
])
if (debugDir) fs.mkdirSync(debugDir, { recursive: true })
for (let i = 0; i < frames.length; i++) {
  const buf = Buffer.from(frames[i])
  if (states[i]) hidePapers(buf, w, h, states[i], 1)
  if (debugDir && i % 12 === 0) {
    const dbg = Buffer.from(buf)
    if (states[i]) outline(dbg, w, h, states[i], 1)
    spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${w}x${h}`, '-i', '-', '-vf', 'scale=480:-1', path.join(debugDir, `${String(i).padStart(3, '0')}.jpg`)], { input: dbg })
  }
  if (!enc.stdin.write(buf)) await new Promise((r) => enc.stdin.once('drain', r))
}
enc.stdin.end()
await new Promise((r) => enc.on('close', r))
console.log(`video: ${path.basename(output)} yazıldı`)
