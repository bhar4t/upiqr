import { parseHexColor, RGBA } from './color.js'
import { UpiqrRenderOptions } from '../types/upiqr.js'
import { RenderOptions } from './pixels.js'

/** Resolves user-supplied renderer options against defaults matching the previous `qrcode` package behavior. */
export function resolveRenderOptions(moduleCount: number, options?: UpiqrRenderOptions): RenderOptions {
    const margin = options?.margin ?? 4
    if (margin < 0) throw new Error('margin must be a non-negative number.')

    const dark: RGBA = parseHexColor(options?.color?.dark ?? '#000000ff')
    const light: RGBA = parseHexColor(options?.color?.light ?? '#ffffffff')

    let scale = options?.scale ?? 4
    if (scale <= 0) throw new Error('scale must be a positive number.')

    if (options?.width) {
        const totalModules = moduleCount + margin * 2
        const computed = Math.floor(options.width / totalModules)
        if (computed > 0) scale = computed
    }

    return { scale, margin, dark, light }
}
