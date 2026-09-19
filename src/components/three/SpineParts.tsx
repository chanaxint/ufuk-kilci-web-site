import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { SPINE_HEIGHT, type SpineRegionId } from '../../lib/spine'
import { splitSpineGeometry, type SpinePart } from '../../lib/spineGeometry'

const MODEL_URL = '/models/spine.glb'

type Props = {
  hovered: SpineRegionId | null
  onHover: (id: SpineRegionId | null) => void
  onParts: (parts: SpinePart[]) => void
}

/**
 * Omurga, anatomik bölgelere ayrılmış dört ayrı mesh olarak çizilir.
 * Üzerine gelinen bölge dışa doğru kayar (exploded view), komşu bölgeler
 * ondan hafifçe uzaklaşır ve bölge rengiyle vurgulanır.
 */
export default function SpineParts({ hovered, onHover, onParts }: Props) {
  const { scene } = useGLTF(MODEL_URL)

  const parts = useMemo(() => {
    let source: THREE.Mesh | null = null
    scene.traverse((o) => {
      if (!source && (o as THREE.Mesh).isMesh) source = o as THREE.Mesh
    })
    const g = (source as unknown as THREE.Mesh).geometry.clone()
    // Meshy çıktısında omurga +Z ekseninde uzanıyor, leğen kemiği +Z ucunda.
    g.rotateX(Math.PI / 2)
    g.computeBoundingBox()
    const box = g.boundingBox as THREE.Box3
    const center = box.getCenter(new THREE.Vector3())
    g.translate(-center.x, -center.y, -center.z)
    g.computeBoundingBox()
    const localHeight = (g.boundingBox as THREE.Box3).getSize(new THREE.Vector3()).y
    const scaled = g.clone().scale(
      SPINE_HEIGHT / localHeight,
      SPINE_HEIGHT / localHeight,
      SPINE_HEIGHT / localHeight,
    )
    g.dispose()
    const result = splitSpineGeometry(scaled, SPINE_HEIGHT)
    scaled.dispose()
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
          new THREE.MeshPhysicalMaterial({
            color: '#efe6d8',
            roughness: 0.42,
            metalness: 0.04,
            clearcoat: 0.55,
            clearcoatRoughness: 0.32,
            sheen: 0.4,
            sheenColor: new THREE.Color('#ffffff'),
            emissive: new THREE.Color('#000000'),
          }),
      ),
    [parts],
  )

  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials])

  const targetPos = useRef(parts.map(() => new THREE.Vector3()))
  const baseColor = useMemo(() => new THREE.Color('#efe6d8'), [])
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
        target.copy(part.explodeDir).multiplyScalar(0.3)
      } else {
        // Komşu parçalar, seçilen parçadan dikey olarak azıcık uzaklaşır
        const away = Math.sign(part.center.y - parts[activeIndex].center.y) || 1
        target.set(0, away * 0.07, 0)
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
        <group key={part.region.id} ref={(el) => void (groups.current[i] = el)}>
          <mesh
            geometry={part.geometry}
            material={materials[i]}
            castShadow
            receiveShadow
            onPointerOver={(e) => {
              e.stopPropagation()
              onHover(part.region.id)
              document.body.style.cursor = 'pointer'
            }}
            onPointerOut={(e) => {
              e.stopPropagation()
              onHover(null)
              document.body.style.cursor = 'auto'
            }}
          />
        </group>
      ))}
    </group>
  )
}

useGLTF.preload(MODEL_URL)
