import { deflateSync } from 'node:zlib'
import { RGBAImage } from './pixels.js'

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

function buildCrcTable(): Uint32Array {
    const table = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
        let c = n
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
        table[n] = c >>> 0
    }
    return table
}

const CRC_TABLE = buildCrcTable()

function crc32(buf: Buffer): number {
    let crc = 0xffffffff
    for (const byte of buf) crc = CRC_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8)
    return (crc ^ 0xffffffff) >>> 0
}

function chunk(type: string, data: Buffer): Buffer {
    const length = Buffer.alloc(4)
    length.writeUInt32BE(data.length, 0)
    const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data])
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(typeAndData), 0)
    return Buffer.concat([length, typeAndData, crc])
}

/** Encodes an RGBA pixel buffer as a PNG (truecolor + alpha), using only Node's built-in zlib. */
export function encodePNG(image: RGBAImage): Buffer {
    const { width, height, data } = image

    const ihdr = Buffer.alloc(13)
    ihdr.writeUInt32BE(width, 0)
    ihdr.writeUInt32BE(height, 4)
    ihdr.writeUInt8(8, 8) // bit depth
    ihdr.writeUInt8(6, 9) // color type: truecolor + alpha
    ihdr.writeUInt8(0, 10) // compression method
    ihdr.writeUInt8(0, 11) // filter method
    ihdr.writeUInt8(0, 12) // interlace method

    const stride = width * 4
    const rgba = Buffer.from(data.buffer, data.byteOffset, data.byteLength)
    const raw = Buffer.alloc((stride + 1) * height)
    for (let y = 0; y < height; y++) {
        const destStart = y * (stride + 1)
        raw[destStart] = 0 // filter type: none
        rgba.copy(raw, destStart + 1, y * stride, y * stride + stride)
    }

    const idat = deflateSync(raw, { level: 9 })

    return Buffer.concat([
        PNG_SIGNATURE,
        chunk('IHDR', ihdr),
        chunk('IDAT', idat),
        chunk('IEND', Buffer.alloc(0)),
    ])
}
