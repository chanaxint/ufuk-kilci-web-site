import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import ScoliosisSpine from './ScoliosisSpine'

/** Modeli yavaşça çeviren, etkileşimsiz taşıyıcı. */
function SlowSpin({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!group.current) return
    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.22) * 0.5
  })
  return <group ref={group}>{children}</group>
}

/**
 * Süreç bölümündeki küçük sahne: adım ilerledikçe eğrilik azalır.
 * Etkileşim yok; yalnızca aktif adımın açısını gösterir.
 */
export default function ProcessSpineScene({ angle, color }: { angle: number; color: string }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 10.6], fov: 32 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.06
      }}
      style={{ pointerEvents: 'none' }}
    >
      <hemisphereLight args={['#ffffff', '#d9c7ad', 0.95]} />
      <directionalLight position={[4, 6, 5]} intensity={2} />
      <directionalLight position={[-5, 1.5, -3]} intensity={0.85} color="#bcdcfa" />
      <Suspense fallback={null}>
        <SlowSpin>
          <ScoliosisSpine angle={angle} color={color} />
        </SlowSpin>
      </Suspense>
    </Canvas>
  )
}
