import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { SPINE_HEIGHT, type SpineRegionId } from '../../lib/spine'
import { prepareSpineGeometry, splitSpineGeometry, type SpinePart } from '../../lib/spineGeometry'

const MODEL_URL = '/models/spine.glb'

type Props = {
  hovered: SpineRegionId | null
  onHover: (id: SpineRegionId | null) => void
  onParts: (parts: SpinePart[]) => void
  /** Omurgaya tıklandı — kamera modele yaklaşır */
  onSelect?: () => void
  /**
   * Bölge vurgusu açık mı. Kapalıyken imleç parçaları ayırmaz ve
   * renklendirmez: omurga standın üzerinde bütün hâlde durur, yalnızca
   * tıklanabilir olduğu imleçten belli olur.
   */
  interactive?: boolean
}

/**
 * Omurga, anatomik bölgelere ayrılmış dört ayrı mesh olarak çizilir.
 *
 * Üzerine gelinen bölge yalnızca çok az dışa kayar ve bölge rengiyle
 * vurgulanır. Kayma eskiden büyüktü; parça imlecin altından çıkıyor,
 * pointerout tetikleniyor, parça geri dönüyor ve titreme başlıyordu. Ayrıca
 * imleç olaylarını hareket etmeyen görünmez bir isabet gövdesi karşılıyor,
 * böylece vurgu hiçbir koşulda kendi kendini bozamıyor.
 */
const SHIFT_ACTIVE = 0.075
const SHIFT_NEIGHBOUR = 0.03

/** Modelin taban rengi — kemik fildişi */
const BONE = '#e4d3b4'

export default function SpineParts({
  hovered,
  onHover,
  onParts,
  onSelect,
  interactive = true,
}: Props) {
  const { scene } = useGLTF(MODEL_URL)

  const parts = useMemo(() => {
    const geometry = prepareSpineGeometry(scene, SPINE_HEIGHT)
    const result = splitSpineGeometry(geometry, SPINE_HEIGHT)
    geometry.dispose()
    return result
  }, [scene])

  useEffect(() => {
    onParts(parts)
    return () => parts.forEach((p) => p.geometry.dispose())
  }, [parts, onParts])

  const groups = useRef<(THREE.Group | null)[]>([])
  const materials = useMemo(
    () =>
      parts.map(
        () =>
          /*
           * Kemik yüzeyi: saf beyaz değil, sıcak fildişi. Parlak vernik
           * katmanı da kısıldı; yüksek clearcoat modeli plastik beyaz
           * gösteriyordu.
           */
          new THREE.MeshPhysicalMaterial({
            color: BONE,
            roughness: 0.58,
            metalness: 0.02,
            clearcoat: 0.16,
            clearcoatRoughness: 0.5,
            sheen: 0.22,
            sheenColor: new THREE.Color('#f0e2c8'),
            emissive: new THREE.Color('#000000'),
          }),
      ),
    [parts],
  )

  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials])

  const targetPos = useRef(parts.map(() => new THREE.Vector3()))
  const baseColor = useMemo(() => new THREE.Color(BONE), [])
  const tintColor = useMemo(() => new THREE.Color(), [])

  useFrame((_, delta) => {
    const k = 1 - Math.pow(0.0015, Math.min(delta, 0.1))
    const activeIndex = parts.findIndex((p) => p.region.id === hovered)

    parts.forEach((part, i) => {
      const group = groups.current[i]
      if (!group) return
      const target = targetPos.current[i]

      if (activeIndex === -1) {
        target.set(0, 0, 0)
      } else if (i === activeIndex) {
        target.copy(part.explodeDir).multiplyScalar(SHIFT_ACTIVE)
      } else {
        // Komşu parçalar, seçilen parçadan dikey olarak azıcık uzaklaşır
        const away = Math.sign(part.center.y - parts[activeIndex].center.y) || 1
        target.set(0, away * SHIFT_NEIGHBOUR, 0)
      }

      group.position.lerp(target, k)

      const material = materials[i]
      const isActive = i === activeIndex
      tintColor.copy(baseColor).lerp(new THREE.Color(part.region.color), isActive ? 0.38 : 0)
      material.color.lerp(tintColor, k)
      material.emissive.lerp(
        isActive ? new THREE.Color(part.region.color).multiplyScalar(0.16) : new THREE.Color('#000000'),
        k,
      )
    })
  })

  return (
    <group>
      {parts.map((part, i) => (
        <group key={part.region.id}>
          {/* Hareket etmeyen isabet gövdesi — görünmez, yalnızca imleci karşılar */}
          <mesh
            geometry={part.geometry}
            onClick={(e) => {
              e.stopPropagation()
              onSelect?.()
            }}
            onPointerOver={(e) => {
              e.stopPropagation()
              if (interactive) onHover(part.region.id)
              document.body.style.cursor = 'pointer'
            }}
            onPointerOut={(e) => {
              e.stopPropagation()
              if (interactive) onHover(null)
              document.body.style.cursor = 'auto'
            }}
          >
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>

          <group ref={(el) => void (groups.current[i] = el)}>
            <mesh geometry={part.geometry} material={materials[i]} castShadow receiveShadow />
          </group>
        </group>
      ))}
    </group>
  )
}

useGLTF.preload(MODEL_URL)
