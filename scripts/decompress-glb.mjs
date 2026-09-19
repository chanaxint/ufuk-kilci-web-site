/**
 * assets/spine-draco.glb (Meshy çıktısı, KHR_draco_mesh_compression ile sıkıştırılmış)
 * dosyasını tarayıcıda ek bir decoder gerektirmeyen sıkıştırılmamış bir GLB'ye çevirir.
 *
 * Kullanım: node scripts/decompress-glb.mjs [kaynak.glb] [hedef.glb]
 */
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import draco3d from 'draco3dgltf'

const src = process.argv[2] ?? 'assets/spine-draco.glb'
const dst = process.argv[3] ?? 'public/models/spine.glb'

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
})

const doc = await io.read(src)
doc
  .getRoot()
  .listExtensionsUsed()
  .forEach((ext) => {
    if (ext.extensionName === 'KHR_draco_mesh_compression') ext.dispose()
  })
await io.write(dst, doc)

console.log(`✓ ${src} → ${dst}`)
