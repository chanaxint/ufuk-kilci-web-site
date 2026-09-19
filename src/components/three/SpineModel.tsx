import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { SPINE_HEIGHT, regionAtHeight, type SpineHit, type SpineRegion } from '../../lib/spine'

const MODEL_URL = '/models/spine.glb'

type Props = {
  selected: SpineRegion | null
  onSelect: (hit: SpineHit | null) => void
  onHover: (region: SpineRegion | null) => void
}

/** Bölgenin normalize aralığını modelin yerel Y aralığına çevirir. */
export function regionToLocalY(region: SpineRegion, height: number) {
  const half = height / 2
  return {
    min: -half + region.range[0] * height,
    max: -half + region.range[1] * height,
  }
}

export default function SpineModel({ selected, onSelect, onHover }: Props) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { scene } = useGLTF(MODEL_URL)

  /* Geometriyi bir kez hazırla: dik döndür, merkeze al, birim yüksekliğe ölçekle. */
  const { geometry, localHeight } = useMemo(() => {
    let source: THREE.Mesh | null = null
    scene.traverse((o) => {
      if (!source && (o as THREE.Mesh).isMesh) source = o as THREE.Mesh
    })
    const g = (source as unknown as THREE.Mesh).geometry.clone()
    // Meshy çıktısında omurga +Z ekseninde uzanıyor ve leğen kemiği +Z ucunda.
    g.rotateX(Math.PI / 2)
    g.computeBoundingBox()
    const box = g.boundingBox as THREE.Box3
    const center = box.getCenter(new THREE.Vector3())
    g.translate(-center.x, -center.y, -center.z)
    g.computeBoundingBox()
    const size = (g.boundingBox as THREE.Box3).getSize(new THREE.Vector3())
    return { geometry: g, localHeight: size.y }
  }, [scene])

  const scale = SPINE_HEIGHT / localHeight

  /* Seçili / üzerinde gezilen bölgeyi gövde üzerinde boyayan malzeme. */
  const uniforms = useMemo(
    () => ({
      uSelMin: { value: 0 },
      uSelMax: { value: 0 },
      uSelColor: { value: new THREE.Color('#2e86d9') },
      uSelStrength: { value: 0 },
      uHovMin: { value: 0 },
      uHovMax: { value: 0 },
      uHovColor: { value: new THREE.Color('#16b8a3') },
      uHovStrength: { value: 0 },
    }),
    [],
  )

  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: '#efe6d8',
      roughness: 0.42,
      metalness: 0.04,
      clearcoat: 0.5,
      clearcoatRoughness: 0.35,
      sheen: 0.35,
      sheenColor: new THREE.Color('#ffffff'),
      flatShading: false,
    })
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms)
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying float vLocalY;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocalY = position.y;')
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
           varying float vLocalY;
           uniform float uSelMin; uniform float uSelMax; uniform vec3 uSelColor; uniform float uSelStrength;
           uniform float uHovMin; uniform float uHovMax; uniform vec3 uHovColor; uniform float uHovStrength;
           float band(float y, float lo, float hi) {
             float feather = 0.06;
             return smoothstep(lo - feather, lo + feather, y) * (1.0 - smoothstep(hi - feather, hi + feather, y));
           }`,
        )
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
           float hovMask = band(vLocalY, uHovMin, uHovMax) * uHovStrength;
           diffuseColor.rgb = mix(diffuseColor.rgb, uHovColor, hovMask * 0.35);
           float selMask = band(vLocalY, uSelMin, uSelMax) * uSelStrength;
           diffuseColor.rgb = mix(diffuseColor.rgb, uSelColor, selMask * 0.85);`,
        )
    }
    m.customProgramCacheKey = () => 'spine-region-highlight'
    return m
  }, [uniforms])

  useEffect(() => () => { material.dispose(); geometry.dispose() }, [material, geometry])

  /* Seçim değiştiğinde hedef uniform değerlerini güncelle, useFrame içinde yumuşat. */
  const targets = useRef({ sel: 0, hov: 0 })
  const hovered = useRef<SpineRegion | null>(null)

  useEffect(() => {
    if (selected) {
      const { min, max } = regionToLocalY(selected, localHeight)
      uniforms.uSelMin.value = min
      uniforms.uSelMax.value = max
      uniforms.uSelColor.value.set(selected.color)
      targets.current.sel = 1
    } else {
      targets.current.sel = 0
    }
  }, [selected, uniforms, localHeight])

  useFrame((_, delta) => {
    const k = 1 - Math.pow(0.001, delta)
    uniforms.uSelStrength.value += (targets.current.sel - uniforms.uSelStrength.value) * k
    uniforms.uHovStrength.value += (targets.current.hov - uniforms.uHovStrength.value) * k
  })

  const pointToHeight = (mesh: THREE.Mesh, point: THREE.Vector3) => {
    const local = mesh.worldToLocal(point.clone())
    return THREE.MathUtils.clamp(local.y / localHeight + 0.5, 0, 1)
  }

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      scale={scale}
      castShadow
      receiveShadow
      onPointerDown={(e) => {
        e.stopPropagation()
        const mesh = meshRef.current
        if (!mesh) return
        const h = pointToHeight(mesh, e.point)
        onSelect({ region: regionAtHeight(h), h, point: [e.point.x, e.point.y, e.point.z] })
      }}
      onPointerMove={(e) => {
        e.stopPropagation()
        const mesh = meshRef.current
        if (!mesh) return
        const region = regionAtHeight(pointToHeight(mesh, e.point))
        if (hovered.current?.id !== region.id) {
          hovered.current = region
          const { min, max } = regionToLocalY(region, localHeight)
          uniforms.uHovMin.value = min
          uniforms.uHovMax.value = max
          uniforms.uHovColor.value.set(region.color)
          onHover(region)
        }
        targets.current.hov = 1
      }}
      onPointerOut={() => {
        hovered.current = null
        targets.current.hov = 0
        onHover(null)
      }}
    />
  )
}

useGLTF.preload(MODEL_URL)
