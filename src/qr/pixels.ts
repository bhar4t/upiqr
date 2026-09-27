import { RGBA } from './color.js'

export interface RenderOptions {
    scale: number
    margin: number
    dark: RGBA
    light: RGBA
}

export interface RGBAImage {
    width: number
    height: number
    /** Row-major RGBA pixel data, 4 bytes per pixel. */
    data: Uint8ClampedArray<ArrayBuffer>
}

/** Rasterizes a QR module matrix into an RGBA pixel buffer, applying scale/margin/colors. */
export function renderModulesToRGBA(matrix: readonly (readonly number[])[], options: RenderOptions): RGBAImage {
    const { scale, margin, dark, light } = options
    const n = matrix.length
    const size = (n + margin * 2) * scale
    const data = new Uint8ClampedArray(size * size * 4)

    for (let y = 0; y < size; y++) {
        const moduleRow = Math.floor(y / scale) - margin
        const row = moduleRow >= 0 && moduleRow < n ? matrix[moduleRow] : undefined
        for (let x = 0; x < size; x++) {
            const moduleCol = Math.floor(x / scale) - margin
            const isDark = row !== undefined && moduleCol >= 0 && moduleCol < n && row[moduleCol] === 1
            const color = isDark ? dark : light
            const idx = (y * size + x) * 4
            data[idx] = color.r
            data[idx + 1] = color.g
            data[idx + 2] = color.b
            data[idx + 3] = color.a
        }
    }

    return { width: size, height: size, data }
}
