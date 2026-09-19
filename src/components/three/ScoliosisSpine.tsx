import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { SPINE_HEIGHT } from '../../lib/spine'
import { prepareSpineGeometry } from '../../lib/spineGeometry'

const MODEL_URL = '/models/spine.glb'

/** 50° için görsel referans değerler — açı bunlarla orantılanır. */
const MAX_BEND = 0.62 // dünya birimi yanal sapma
const MAX_TWIST = 0.38 // radyan, kendi ekseninde dönme

type Props = {
  /** Cobb açısı (derece) */
  angle: number
  color: string
}

/**
 * Omurga modelini Cobb açısına göre gerçek zamanlı olarak eğer.
 *
 * Model tek parça ve kemik (armature) içermiyor; bu yüzden eğrilik vertex
 * shader'ında üretiliyor: her tepe noktası, yüksekliğine bağlı bir sinüs
 * eğrisi kadar yana kayıyor ve aynı anda kendi ekseni etrafında dönüyor.
 * Skolyozun üç boyutlu tanımı (frontal eğrilik + transvers rotasyon) böylece
 * modelin üzerinde doğrudan görülebiliyor.
 */
export default function ScoliosisSpine({ angle, color }: Props) {
  const { scene } = useGLTF(MODEL_URL)
  const geometry = useMemo(() => prepareSpineGeometry(scene, SPINE_HEIGHT), [scene])

  const uniforms = useMemo(
    () => ({
      uHeight: { value: SPINE_HEIGHT },
      uBend: { value: 0 },
      uTwist: { value: 0 },
      uTint: { value: new THREE.Color(color) },
      uTintAmount: { value: 0 },
    }),
    [color],
  )

  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: '#efe6d8',
      roughness: 0.42,
      metalness: 0.04,
      clearcoat: 0.55,
      clearcoatRoughness: 0.32,
      sheen: 0.4,
      sheenColor: new THREE.Color('#ffffff'),
    })

    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms)
      const helpers = `
        uniform float uHeight;
        uniform float uBend;
        uniform float uTwist;
        /** Yüksekliğe göre eğrilik miktarı: uçlarda 0, tepe noktasında 1 */
        float curveAt(float y) {
          float h = clamp(y / uHeight + 0.5, 0.0, 1.0);
          return sin(h * 3.14159265);
        }
      `
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>\n${helpers}`)
        .replace(
          '#include <beginnormal_vertex>',
          `#include <beginnormal_vertex>
           {
             float k = curveAt(position.y);
             float a = k * uTwist;
             float c = cos(a), s = sin(a);
             objectNormal = vec3(
               objectNormal.x * c + objectNormal.z * s,
               objectNormal.y,
               -objectNormal.x * s + objectNormal.z * c
             );
           }`,
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           {
             float k = curveAt(position.y);
             float a = k * uTwist;
             float c = cos(a), s = sin(a);
             transformed = vec3(
               transformed.x * c + transformed.z * s,
               transformed.y,
               -transformed.x * s + transformed.z * c
             );
             transformed.x += k * uBend;
           }`,
        )

      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec3 uTint;\nuniform float uTintAmount;')
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
           diffuseColor.rgb = mix(diffuseColor.rgb, uTint, uTintAmount);`,
        )
    }
    m.customProgramCacheKey = () => 'scoliosis-bend'
    return m
  }, [uniforms])

  useEffect(
    () => () => {
      material.dispose()
      geometry.dispose()
    },
    [material, geometry],
  )

  /* Açı değişimini yumuşat */
  const target = useRef({ bend: 0, twist: 0, tint: 0 })
  useEffect(() => {
    const ratio = Math.min(angle / 50, 1.2)
    target.current = {
      bend: ratio * MAX_BEND,
      twist: ratio * MAX_TWIST,
      tint: Math.min(ratio * 0.34, 0.34),
    }
    uniforms.uTint.value.set(color)
  }, [angle, color, uniforms])

  useFrame((_, delta) => {
    const k = 1 - Math.pow(0.004, Math.min(delta, 0.1))
    uniforms.uBend.value += (target.current.bend - uniforms.uBend.value) * k
    uniforms.uTwist.value += (target.current.twist - uniforms.uTwist.value) * k
    uniforms.uTintAmount.value += (target.current.tint - uniforms.uTintAmount.value) * k
  })

  return <mesh geometry={geometry} material={material} castShadow receiveShadow />
}

useGLTF.preload(MODEL_URL)
