import { YORUMLAR_YAYIN_KARARI } from './yayin'

/*
 * Tarayıcı tarafı: hasta yorumları yalnızca geliştirme ortamında ya da yayın
 * kararı verilince çizilir (src/lib/yayin.ts). Derlemede sabit olduğu için
 * kayıtlı içerik bunu değiştiremez.
 */
export const yorumlarGorunur = import.meta.env.DEV || YORUMLAR_YAYIN_KARARI
