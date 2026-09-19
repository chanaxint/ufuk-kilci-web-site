import * as THREE from 'three'
import { spineRegions, type SpineRegion, type SpineRegionId } from './spine'

/**
 * GLB sahnesindeki tek mesh'in geometrisini alır; dik döndürür, merkeze taşır
 * ve hedef yüksekliğe ölçekler. Hem sahnedeki omurga hem de skolyoz açısı
 * bölümü aynı hazırlanmış geometriyi kullanır.
 */
export function prepareSpineGeometry(scene: THREE.Object3D, targetHeight: number) {
  let source: THREE.Mesh | null = null
  scene.traverse((o) => {
    if (!source && (o as THREE.Mesh).isMesh) source = o as THREE.Mesh
  })
  const g = (source as unknown as THREE.Mesh).geometry.clone()
  // Meshy çıktısında omurga +Z ekseninde uzanıyor, leğen kemiği +Z ucunda.
  g.rotateX(Math.PI / 2)
  g.computeBoundingBox()
  const center = (g.boundingBox as THREE.Box3).getCenter(new THREE.Vector3())
  g.translate(-center.x, -center.y, -center.z)
  g.computeBoundingBox()
  const localHeight = (g.boundingBox as THREE.Box3).getSize(new THREE.Vector3()).y
  const k = targetHeight / localHeight
  g.scale(k, k, k)
  g.computeBoundingBox()
  return g
}

export type SpinePart = {
  region: SpineRegion
  geometry: THREE.BufferGeometry
  /** Parçanın kendi merkezi (model yerel koordinatında) */
  center: THREE.Vector3
  /** "Patlatılmış görünüm"de parçanın kayacağı yön */
  explodeDir: THREE.Vector3
  /** Etiketin omurganın hangi yanında duracağı */
  side: 'left' | 'right'
}

/**
 * Model tek parça (single-mesh) bir GLB. Gerçek bir "exploded view" için
 * üçgenleri ağırlık merkezlerinin yüksekliğine göre anatomik bölgelere ayırıp
 * her bölge için ayrı bir BufferGeometry üretiyoruz. Parçalar aynı yerel
 * koordinat sisteminde kaldığı için hareket ettirilmedikleri sürece model
 * kusursuz biçimde birleşik görünür.
 */
export function splitSpineGeometry(source: THREE.BufferGeometry, height: number): SpinePart[] {
  const geo = source.index ? source.toNonIndexed() : source
  const position = geo.getAttribute('position') as THREE.BufferAttribute
  const normal = geo.getAttribute('normal') as THREE.BufferAttribute | undefined
  const uv = geo.getAttribute('uv') as THREE.BufferAttribute | undefined

  const triangleCount = position.count / 3
  const buckets = new Map<SpineRegionId, number[]>()
  spineRegions.forEach((r) => buckets.set(r.id, []))

  for (let t = 0; t < triangleCount; t++) {
    const i = t * 3
    const yCenter = (position.getY(i) + position.getY(i + 1) + position.getY(i + 2)) / 3
    const h = THREE.MathUtils.clamp(yCenter / height + 0.5, 0, 1)
    const region =
      spineRegions.find((r) => h >= r.range[0] && h <= r.range[1]) ?? spineRegions[spineRegions.length - 1]
    buckets.get(region.id)!.push(t)
  }

  const sides: Record<SpineRegionId, 'left' | 'right'> = {
    servikal: 'right',
    torakal: 'left',
    lomber: 'right',
    sakrum: 'left',
  }

  return spineRegions.map((region) => {
    const triangles = buckets.get(region.id) as number[]
    const count = triangles.length * 3
    const positions = new Float32Array(count * 3)
    const normals = normal ? new Float32Array(count * 3) : null
    const uvs = uv ? new Float32Array(count * 2) : null

    let v = 0
    for (const t of triangles) {
      for (let k = 0; k < 3; k++) {
        const src = t * 3 + k
        positions[v * 3] = position.getX(src)
        positions[v * 3 + 1] = position.getY(src)
        positions[v * 3 + 2] = position.getZ(src)
        if (normals && normal) {
          normals[v * 3] = normal.getX(src)
          normals[v * 3 + 1] = normal.getY(src)
          normals[v * 3 + 2] = normal.getZ(src)
        }
        if (uvs && uv) {
          uvs[v * 2] = uv.getX(src)
          uvs[v * 2 + 1] = uv.getY(src)
        }
        v++
      }
    }

    const part = new THREE.BufferGeometry()
    part.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    if (normals) part.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
    else part.computeVertexNormals()
    if (uvs) part.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
    part.computeBoundingBox()
    part.computeBoundingSphere()

    const center = (part.boundingBox as THREE.Box3).getCenter(new THREE.Vector3())
    const side = sides[region.id]
    const explodeDir = new THREE.Vector3(side === 'right' ? 1 : -1, 0, 0.45).normalize()

    return { region, geometry: part, center, explodeDir, side }
  })
}
