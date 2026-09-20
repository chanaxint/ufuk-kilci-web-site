import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Html, OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import ScoliosisSpine from './ScoliosisSpine'
import { SPINE_HEIGHT } from '../../lib/spine'

export type SpineView = 'front' | 'top'

/** Cobb açısının ölçüldüğü uç omurların normalize yükseklikleri */
const TOP_H = 0.76
const BOTTOM_H = 0.32
const MAX_BEND = 0.62

const worldY = (h: number) => (h - 0.5) * SPINE_HEIGHT

/** Uç omurlara oturan Cobb tanjant çizgileri */
function CobbLines({ angle, color, visible }: { angle: number; color: string; visible: boolean }) {
  const top = useRef<THREE.Group>(null)
  const bottom = useRef<THREE.Group>(null)
  const current = useRef(0)

  useFrame((_, delta) => {
    const k = 1 - Math.pow(0.004, Math.min(delta, 0.1))
    current.current += (angle - current.current) * k
    const a = current.current
    const bend = Math.min(a / 50, 1.2) * MAX_BEND
    const tilt = THREE.MathUtils.degToRad(a / 2)

    if (top.current) {
      top.current.position.x = Math.sin(TOP_H * Math.PI) * bend
      top.current.rotation.z = -tilt
    }
    if (bottom.current) {
      bottom.current.position.x = Math.sin(BOTTOM_H * Math.PI) * bend
      bottom.current.rotation.z = tilt
    }
  })

  return (
    <group visible={visible && angle > 4}>
      {[
        { ref: top, y: worldY(TOP_H) },
        { ref: bottom, y: worldY(BOTTOM_H) },
      ].map((line, i) => (
        <group key={i} ref={line.ref} position={[0, line.y, 0]}>
          <mesh>
            <boxGeometry args={[3.1, 0.018, 0.018]} />
            <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** Kamera açısı ön görünüm ile üstten görünüm arasında yumuşakça geçer. */
function ViewRig({ view, controls }: { view: SpineView; controls: React.RefObject<OrbitControlsImpl | null> }) {
  const { camera } = useThree()
  const desired = useRef<THREE.Vector3 | null>(null)

  useEffect(() => {
    desired.current =
      view === 'top' ? new THREE.Vector3(0, 6.2, 1.7) : new THREE.Vector3(0, 0.3, 8.8)
  }, [view])

  useFrame((_, delta) => {
    if (!desired.current) return
    const k = 1 - Math.pow(0.006, Math.min(delta, 0.1))
    camera.position.lerp(desired.current, k)
    controls.current?.update()
    if (camera.position.distanceTo(desired.current) < 0.02) desired.current = null
  })
  return null
}

function Loader() {
  return (
    <Html center>
      <div className="flex items-center gap-3 rounded-full border border-white/70 bg-white/80 px-4 py-2 shadow-soft backdrop-blur-xl">
        <span className="size-2 animate-ping rounded-full bg-brand-500" />
        <span className="font-display text-[0.8rem] font-semibold text-ink-700">Model yükleniyor…</span>
      </div>
    </Html>
  )
}

export default function ScoliosisAngleScene({
  angle,
  color,
  view,
}: {
  angle: number
  color: string
  view: SpineView
}) {
  const controls = useRef<OrbitControlsImpl | null>(null)

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0.3, 8.8], fov: 34 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.06
      }}
      style={{ touchAction: 'pan-y' }}
    >
      <hemisphereLight args={['#ffffff', '#d9c7ad', 0.95]} />
      <directionalLight position={[4, 6, 5]} intensity={2.1} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-5, 1.5, -3]} intensity={0.9} color="#ecdfc9" />

      <Suspense fallback={<Loader />}>
        <ScoliosisSpine angle={angle} color={color} />
        <CobbLines angle={angle} color={color} visible={view === 'front'} />

        {/* Şakül çizgisi */}
        <mesh position={[0, 0, -0.35]}>
          <boxGeometry args={[0.008, SPINE_HEIGHT + 0.8, 0.008]} />
          <meshBasicMaterial color="#3a2c20" transparent opacity={0.16} toneMapped={false} />
        </mesh>

        <ContactShadows position={[0, -2.6, 0]} opacity={0.24} scale={9} blur={3} far={4.5} color="#3a2c20" />
      </Suspense>

      <OrbitControls
        ref={controls}
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={5}
        maxDistance={11}
        minPolarAngle={0.12}
        maxPolarAngle={Math.PI * 0.88}
      />
      <ViewRig view={view} controls={controls} />
    </Canvas>
  )
}
