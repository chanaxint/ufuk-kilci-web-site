import { Suspense, useCallback, useRef, useState, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Html } from '@react-three/drei'
import * as THREE from 'three'
import SpineParts from './SpineParts'
import type { SpinePart } from '../../lib/spineGeometry'
import type { SpineRegionId } from '../../lib/spine'

type Keyframe = { p: number; x: number; y: number; z: number; scale: number; rotY: number }

/* Scroll ilerlemesine (0→1) bağlı kamera/model koreografisi */
const desktopKeys: Keyframe[] = [
  { p: 0.0, x: 2.35, y: 0.25, z: 0, scale: 0.5, rotY: -0.45 },
  { p: 0.34, x: 0.22, y: -0.12, z: 0, scale: 0.84, rotY: 0.3 },
  { p: 0.68, x: 0.22, y: -0.12, z: 0.35, scale: 0.88, rotY: 1.0 },
  { p: 1.0, x: 0.16, y: -0.12, z: 0.45, scale: 0.88, rotY: 1.15 },
]

const mobileKeys: Keyframe[] = [
  { p: 0.0, x: 0.05, y: 1.45, z: 0, scale: 0.3, rotY: -0.35 },
  { p: 0.34, x: 0.0, y: 1.0, z: 0, scale: 0.46, rotY: 0.3 },
  { p: 0.68, x: 0.0, y: 1.0, z: 0.2, scale: 0.49, rotY: 1.0 },
  { p: 1.0, x: 0.0, y: 1.0, z: 0.35, scale: 0.51, rotY: 1.15 },
]

function sample(keys: Keyframe[], p: number) {
  const t = THREE.MathUtils.clamp(p, 0, 1)
  let a = keys[0]
  let b = keys[keys.length - 1]
  for (let i = 0; i < keys.length - 1; i++) {
    if (t >= keys[i].p && t <= keys[i + 1].p) {
      a = keys[i]
      b = keys[i + 1]
      break
    }
  }
  const span = b.p - a.p || 1
  const local = THREE.MathUtils.clamp((t - a.p) / span, 0, 1)
  // yumuşak geçiş (smoothstep)
  const e = local * local * (3 - 2 * local)
  return {
    x: THREE.MathUtils.lerp(a.x, b.x, e),
    y: THREE.MathUtils.lerp(a.y, b.y, e),
    z: THREE.MathUtils.lerp(a.z, b.z, e),
    scale: THREE.MathUtils.lerp(a.scale, b.scale, e),
    rotY: THREE.MathUtils.lerp(a.rotY, b.rotY, e),
  }
}

/** Scroll ilerlemesini ve fare paralaksını modele uygulayan taşıyıcı. */
function ScrollRig({
  progress,
  isMobile,
  children,
}: {
  progress: RefObject<number>
  isMobile: boolean
  children: React.ReactNode
}) {
  const rig = useRef<THREE.Group>(null)
  const spin = useRef<THREE.Group>(null)
  const { pointer } = useThree()

  useFrame((_, delta) => {
    if (!rig.current || !spin.current) return
    const k = 1 - Math.pow(0.002, Math.min(delta, 0.1))
    const target = sample(isMobile ? mobileKeys : desktopKeys, progress.current ?? 0)

    rig.current.position.x += (target.x - rig.current.position.x) * k
    rig.current.position.y += (target.y - rig.current.position.y) * k
    rig.current.position.z += (target.z - rig.current.position.z) * k
    const s = rig.current.scale.x + (target.scale - rig.current.scale.x) * k
    rig.current.scale.setScalar(s)

    // Fare paralaksı: ölçülü bir canlılık
    const tiltY = target.rotY + pointer.x * 0.22
    const tiltX = -pointer.y * 0.1
    spin.current.rotation.y += (tiltY - spin.current.rotation.y) * k
    spin.current.rotation.x += (tiltX - spin.current.rotation.x) * k
  })

  return (
    <group ref={rig}>
      <group ref={spin}>{children}</group>
    </group>
  )
}

function Loader() {
  return (
    <Html center>
      <div className="flex items-center gap-3">
        <span className="size-2.5 animate-ping rounded-full bg-brand-500" />
        <span className="font-display text-sm font-semibold text-ink-700">Model yükleniyor…</span>
      </div>
    </Html>
  )
}

type Props = {
  progress: RefObject<number>
  /** Sahne ekranda mı — değilse render döngüsü tamamen durur */
  active: boolean
  labelsVisible: boolean
  hovered: SpineRegionId | null
  onHover: (id: SpineRegionId | null) => void
  isMobile: boolean
}

export default function SpineStageScene({ progress, active, labelsVisible, hovered, onHover, isMobile }: Props) {
  const [parts, setParts] = useState<SpinePart[]>([])
  const handleParts = useCallback((p: SpinePart[]) => setParts(p), [])

  return (
    <Canvas
      shadows
      /*
       * Sahne görüş alanından çıkınca render döngüsü duruyor. Aksi hâlde iki
       * WebGL sahnesi de sayfanın tamamı boyunca her karede çiziliyor ve
       * metin bölümlerinde bile belirgin bir takılma bırakıyordu.
       */
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 8], fov: 35 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.08
      }}
      style={{ touchAction: 'pan-y' }}
    >
      <hemisphereLight args={['#ffffff', '#d9c7ad', 0.9]} />
      <directionalLight
        position={[4.5, 6, 5]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={24}
      />
      <directionalLight position={[-5, 1.5, -3]} intensity={0.95} color="#ecdfc9" />
      <directionalLight position={[0, -3, -4]} intensity={0.5} color="#e8ddc6" />

      <Suspense fallback={<Loader />}>
        <ScrollRig progress={progress} isMobile={isMobile}>
          <SpineParts hovered={hovered} onHover={onHover} onParts={handleParts} />

          {/* Etiketler modelle birlikte dönmez; omurganın iki yanında sabit durur */}
          {!isMobile &&
            parts.map((part) => {
              const active = hovered === part.region.id
              const right = part.side === 'right'
              return (
                <Html
                  key={part.region.id}
                  position={[right ? 1.22 : -1.22, part.center.y, 0]}
                  zIndexRange={[30, 0]}
                  style={{ pointerEvents: labelsVisible && active ? 'auto' : 'none' }}
                >
                  <div
                    onMouseEnter={() => onHover(part.region.id)}
                    onMouseLeave={() => onHover(null)}
                    className={`-translate-y-1/2 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      right ? '' : '-translate-x-full'
                    } ${labelsVisible ? 'opacity-100' : 'pointer-events-none translate-y-2 opacity-0'}`}
                  >
                    <div className={`flex items-center gap-3 ${right ? '' : 'flex-row-reverse'}`}>
                      <span
                        className="h-px transition-all duration-500"
                        style={{
                          width: active ? '2.6rem' : '1.6rem',
                          background: `linear-gradient(to ${right ? 'right' : 'left'}, ${part.region.color}, transparent)`,
                        }}
                      />
                      {/*
                        Bölge adı yalnızca imleç omurganın o parçasına gelince
                        açılır. Boştayken geriye yalnızca bu küçük nokta kalır;
                        nereye gelineceğini gösterir ama yazı yazmaz.
                      */}
                      <span
                        className={`size-1.5 shrink-0 rounded-full transition-opacity duration-500 ${
                          active ? 'opacity-0' : 'opacity-80'
                        }`}
                        style={{ background: part.region.color }}
                      />
                      {/* Kart yüzeyi yok: bölge adı doğrudan zeminin üzerine yazılıyor */}
                      <div
                        className={`transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                          active ? 'w-52 opacity-100' : 'pointer-events-none w-auto opacity-0'
                        }`}
                      >
                        <div className="py-1">
                          <div className={`flex items-center gap-2 ${right ? '' : 'flex-row-reverse'}`}>
                            <span
                              className="size-1.5 shrink-0 rounded-full"
                              style={{ background: part.region.color }}
                            />
                            <span className="font-display text-[0.72rem] font-bold tracking-[0.16em] whitespace-nowrap text-ink-800 uppercase">
                              {part.region.name}
                            </span>
                            <span
                              className={`font-display text-[0.66rem] font-bold whitespace-nowrap text-ink-500 transition-all duration-500 ${
                                active ? 'max-w-32 opacity-100' : 'max-w-0 overflow-hidden opacity-0'
                              }`}
                            >
                              {part.region.code}
                            </span>
                          </div>
                          <div
                            className={`grid transition-all duration-500 ${
                              active ? 'mt-2 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                            }`}
                          >
                            <p
                              className={`overflow-hidden text-[0.8rem] leading-snug text-ink-600 ${
                                right ? 'text-left' : 'text-right'
                              }`}
                            >
                              {part.region.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Html>
              )
            })}
        </ScrollRig>

        <ContactShadows
          position={[0.22, -2.75, 0]}
          opacity={0.26}
          scale={11}
          blur={3}
          far={5}
          color="#3a2c20"
        />
      </Suspense>
    </Canvas>
  )
}
