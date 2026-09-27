import { RGBAImage } from './pixels.js'
import { Base64, ImageType } from '../types/upiqr.js'

/** Renders an RGBA pixel buffer to a PNG data URL using the browser's native Canvas API. */
export function encodeCanvasPNG(image: RGBAImage): Base64<ImageType> {
    const canvas = document.createElement('canvas')
    canvas.width = image.width
    canvas.height = image.height

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Unable to acquire a 2D canvas context for QR rendering.')

    ctx.putImageData(new ImageData(image.data, image.width, image.height), 0, 0)
    return canvas.toDataURL('image/png') as Base64<ImageType>
}
