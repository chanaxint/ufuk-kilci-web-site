import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Billboard, ContactShadows, Html, OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import SpineModel from './SpineModel'
import {
  heightToWorldY,
  hotspotPosition,
  spineRegions,
  vertebraLabel,
  type SpineHit,
  type SpineRegion,
} from '../../lib/spine'

type Props = {
  selected: SpineRegion | null
  hit: SpineHit | null
  onSelect: (hit: SpineHit | null) => void
  onHover: (region: SpineRegion | null) => void
}

function Hotspot({
  region,
  active,
  onSelect,
}: {
  region: SpineRegion
  active: boolean
  onSelect: (hit: SpineHit) => void
}) {
  const ref = useRef<THREE.Group>(null)
  const position = hotspotPosition(region)
  const y = position[1]

  useFrame((state) => {
    if (!ref.current) return
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.4 + y) * 0.12
    ref.current.scale.setScalar(active ? 1.35 : pulse)
  })

  return (
    <Billboard position={position}>
      <group ref={ref}>
        <mesh
          onPointerDown={(e) => {
            e.stopPropagation()
            onSelect({ region, h: region.focus, point: position })
          }}
          onPointerOver={(e) => {
            e.stopPropagation()
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto'
          }}
        >
          <sphereGeometry args={[0.075, 24, 24]} />
          <meshBasicMaterial color={region.color} toneMapped={false} />
        </mesh>
        <mesh>
          <ringGeometry args={[0.11, 0.135, 36]} />
          <meshBasicMaterial
            color={region.color}
            transparent
            opacity={active ? 0.9 : 0.45}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      </group>
    </Billboard>
  )
}

/** Seçim yapıldığında kamerayı ilgili yüksekliğe yumuşakça taşır. */
function CameraRig({
  controls,
  focusY,
}: {
  controls: React.RefObject<OrbitControlsImpl | null>
  focusY: number | null
}) {
  const { camera } = useThree()
  const desired = useRef<number | null>(null)

  useEffect(() => {
    desired.current = focusY
  }, [focusY])

  useFrame((_, delta) => {
    const c = controls.current
    if (!c || desired.current === null) return
    const k = 1 - Math.pow(0.008, delta)
    c.target.y += (desired.current - c.target.y) * k
    const targetCamY = desired.current * 0.55
    camera.position.y += (targetCamY - camera.position.y) * k
    if (Math.abs(c.target.y - desired.current) < 0.002) desired.current = null
    c.update()
  })
  return null
}

function Loader() {
  return (
    <Html center>
      <div className="flex items-center gap-3 rounded-full bg-white/85 px-5 py-2.5 shadow-soft backdrop-blur">
        <span className="size-2.5 animate-ping rounded-full bg-brand-500" />
        <span className="font-display text-sm font-semibold text-ink-700">Model yükleniyor…</span>
      </div>
    </Html>
  )
}

export default function SpineScene({ selected, hit, onSelect, onHover }: Props) {
  const controls = useRef<OrbitControlsImpl | null>(null)
  const [userMoved, setUserMoved] = useState(false)

  const labelPosition = hit ? new THREE.Vector3(...hit.point) : null

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0.5, 0.15, 7.9], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
      onPointerMissed={() => onSelect(null)}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
      }}
      style={{ touchAction: 'pan-y' }}
    >
      <hemisphereLight args={['#ffffff', '#d9c7ad', 0.85]} />
      <directionalLight
        position={[4.5, 6, 5]}
        intensity={2.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={20}
      />
      <directionalLight position={[-5, 1.5, -3]} intensity={0.9} color="#bcdcfa" />
      <directionalLight position={[0, -3, -4]} intensity={0.5} color="#d4f3ec" />

      <Suspense fallback={<Loader />}>
        <group position={[0, 0, 0]}>
          <SpineModel selected={selected} onSelect={onSelect} onHover={onHover} />
          {spineRegions.map((region) => (
            <Hotspot
              key={region.id}
              region={region}
              active={selected?.id === region.id}
              onSelect={onSelect}
            />
          ))}
          {selected && hit && labelPosition && (
            <Html
              position={labelPosition}
              zIndexRange={[30, 0]}
              style={{ pointerEvents: 'none' }}
            >
              <div className="-translate-y-1/2 translate-x-4">
                <div className="relative w-56 rounded-2xl border border-white/80 bg-white/92 p-4 shadow-lift backdrop-blur-md">
                  <span
                    className="absolute top-1/2 -left-6 h-px w-6 -translate-y-1/2"
                    style={{ background: selected.color }}
                  />
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full" style={{ background: selected.color }} />
                    <span className="font-display text-[0.68rem] font-bold tracking-[0.16em] text-ink-500 uppercase">
                      {vertebraLabel(selected, hit.h)} · {selected.code}
                    </span>
                  </div>
                  <p className="mt-1.5 font-display text-lg leading-tight font-extrabold text-ink-900">
                    {selected.name}
                  </p>
                  <p className="mt-1 text-[0.8rem] leading-snug text-ink-500">{selected.subtitle}</p>
                </div>
              </div>
            </Html>
          )}
        </group>

        <ContactShadows
          position={[0, -2.55, 0]}
          opacity={0.32}
          scale={9}
          blur={2.8}
          far={4.5}
          color="#0b1f38"
        />
      </Suspense>

      <OrbitControls
        ref={controls}
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={4}
        maxDistance={10}
        minPolarAngle={Math.PI * 0.18}
        maxPolarAngle={Math.PI * 0.86}
        autoRotate={!selected && !userMoved}
        autoRotateSpeed={0.55}
        onStart={() => setUserMoved(true)}
      />
      <CameraRig controls={controls} focusY={selected ? heightToWorldY(selected.focus) : null} />
    </Canvas>
  )
}
