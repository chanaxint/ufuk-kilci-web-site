import { Suspense, useCallback, useRef, useState, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Html } from '@react-three/drei'
import * as THREE from 'three'
import SpineParts from './SpineParts'
import type { SpinePart } from '../../lib/spineGeometry'
import type { SpineRegionId } from '../../lib/spine'
import { desktopFocus, mobileFocus, restPose, type Pose } from './spinePose'

/*
 * İki duruş var: omurga fotoğraftaki standın üzerinde dururken (rest) ve
 * üzerine tıklandığında kameranın yaklaştığı hâl (focus). Aradaki geçiş
 * `focus` değeriyle (0→1) sürülüyor; scroll ile hiçbir ilgisi yok.
 * Sayılar ayrı bir dosyada duruyor, çünkü ayar paneli de onları kullanıyor.
 */
/*
 * Bölge yazılarının gölgesi. Renkler sahnenin sıcak paletinden çıkmıyor
 * (fildişi/kum), okunurluğu ise renk değil bu katmanlı gölge taşıyor: yakın
 * bir sert kenar, geniş bir hâle. Böylece yazı fotoğrafın en açık yerine
 * denk gelse de ayakta kalıyor, ama ekrana bir kutu çakılmış gibi durmuyor.
 */
const LABEL_SHADOW =
  '0 1px 2px rgb(18 12 7 / 0.92), 0 0 10px rgb(18 12 7 / 0.85), 0 0 28px rgb(18 12 7 / 0.6)'

function sample(rest: Pose, focus: Pose, f: number) {
  const t = THREE.MathUtils.clamp(f, 0, 1)
  const e = t * t * (3 - 2 * t)
  return {
    x: THREE.MathUtils.lerp(rest.x, focus.x, e),
    y: THREE.MathUtils.lerp(rest.y, focus.y, e),
    z: THREE.MathUtils.lerp(rest.z, focus.z, e),
    scale: THREE.MathUtils.lerp(rest.scale, focus.scale, e),
    rotY: THREE.MathUtils.lerp(rest.rotY, focus.rotY, e),
  }
}

/** Odak durumunu ve fare paralaksını modele uygulayan taşıyıcı. */
function ScrollRig({
  focus,
  isMobile,
  children,
}: {
  focus: RefObject<number>
  isMobile: boolean
  children: React.ReactNode
}) {
  const rig = useRef<THREE.Group>(null)
  const spin = useRef<THREE.Group>(null)
  const placed = useRef(false)
  const { pointer, size } = useThree()

  useFrame((_, delta) => {
    if (!rig.current || !spin.current) return
    const k = 1 - Math.pow(0.002, Math.min(delta, 0.1))
    /* Duruş fotoğrafa göre; yakın plan pencereden bağımsız */
    const rest = restPose(size.width, size.height)
    const target = sample(rest, isMobile ? mobileFocus : desktopFocus, focus.current ?? 0)

    /*
     * İlk kare: model yüklendiği an doğrudan standın üzerinde belirsin.
     * Yumuşatma sıfır noktasından başlıyordu; sahne omurga zaten görünürken
     * kurulduğunda (yenilemeden sonra doğrudan girişe inilince) model
     * ekranın ortasından standa doğru süzülüyordu.
     */
    if (!placed.current) {
      placed.current = true
      rig.current.position.set(target.x, target.y, target.z)
      rig.current.scale.setScalar(target.scale)
      spin.current.rotation.set(0, target.rotY, 0)
      return
    }

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
  /** 0: standın üzerinde duruyor, 1: kamera omurgaya yaklaşmış */
  focus: RefObject<number>
  /** Sahne ekranda mı — değilse render döngüsü tamamen durur */
  active: boolean
  labelsVisible: boolean
  hovered: SpineRegionId | null
  onHover: (id: SpineRegionId | null) => void
  onSelect: () => void
  isMobile: boolean
}

export default function SpineStageScene({
  focus,
  active,
  labelsVisible,
  hovered,
  onHover,
  onSelect,
  isMobile,
}: Props) {
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
        gl.toneMappingExposure = 0.96
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
        <ScrollRig focus={focus} isMobile={isMobile}>
          <SpineParts
            hovered={hovered}
            onHover={onHover}
            onParts={handleParts}
            onSelect={onSelect}
            interactive={labelsVisible}
          />

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
                            {/*
                              Yazılar koyulaşan fotoğrafın üzerinde duruyor;
                              sıcak fildişi hem okunuyor hem de sahnenin
                              paletinden çıkmıyor. Gölge, koyu kitapların
                              üzerine denk geldiğinde de ayakta tutuyor.
                            */}
                            <span
                              className="font-display text-[0.72rem] font-bold tracking-[0.16em] whitespace-nowrap uppercase"
                              style={{ color: '#f6efe2', textShadow: LABEL_SHADOW }}
                            >
                              {part.region.name}
                            </span>
                            <span
                              className={`font-display text-[0.66rem] font-bold whitespace-nowrap transition-all duration-500 ${
                                active ? 'max-w-32 opacity-100' : 'max-w-0 overflow-hidden opacity-0'
                              }`}
                              style={{ color: '#d8c3a0', textShadow: LABEL_SHADOW }}
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
                              className={`overflow-hidden text-[0.8rem] leading-snug ${
                                right ? 'text-left' : 'text-right'
                              }`}
                              style={{ color: '#e8ddca', textShadow: LABEL_SHADOW }}
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
