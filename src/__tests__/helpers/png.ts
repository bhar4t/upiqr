import { inflateSync } from 'node:zlib'

export interface DecodedPng {
    width: number
    height: number
    data: Uint8ClampedArray
}

/**
 * Minimal PNG parser for test verification only. Understands exactly the subset of PNG
 * produced by `src/qr/png.ts` (8-bit truecolor+alpha, filter type 0/None on every row).
 */
export function decodeOwnPng(buffer: Buffer): DecodedPng {
    const signature = buffer.subarray(0, 8)
    const expectedSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    if (!signature.equals(expectedSignature)) throw new Error('Not a PNG file (bad signature).')

    let offset = 8
    let width = 0
    let height = 0
    const idatParts: Buffer[] = []

    while (offset < buffer.length) {
        const length = buffer.readUInt32BE(offset)
        const type = buffer.toString('ascii', offset + 4, offset + 8)
        const data = buffer.subarray(offset + 8, offset + 8 + length)

        if (type === 'IHDR') {
            width = data.readUInt32BE(0)
            height = data.readUInt32BE(4)
            const bitDepth = data.readUInt8(8)
            const colorType = data.readUInt8(9)
            if (bitDepth !== 8 || colorType !== 6) {
                throw new Error(`Unsupported PNG format for test decoder: bitDepth=${bitDepth} colorType=${colorType}`)
            }
        } else if (type === 'IDAT') {
            idatParts.push(Buffer.from(data))
        } else if (type === 'IEND') {
            break
        }

        offset += 8 + length + 4 // length + type + data + crc
    }

    const raw = inflateSync(Buffer.concat(idatParts))
    const stride = width * 4
    const pixels = new Uint8ClampedArray(width * height * 4)

    for (let y = 0; y < height; y++) {
        const rowStart = y * (stride + 1)
        const filterType = raw[rowStart]
        if (filterType !== 0) throw new Error(`Unsupported filter type in test decoder: ${filterType}`)
        raw.copy(Buffer.from(pixels.buffer, pixels.byteOffset, pixels.byteLength), y * stride, rowStart + 1, rowStart + 1 + stride)
    }

    return { width, height, data: pixels }
}
