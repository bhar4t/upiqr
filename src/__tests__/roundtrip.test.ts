import { test } from 'node:test'
import assert from 'node:assert/strict'
import jsQR from 'jsqr'
import { encodeQRMatrix, ECCLevel } from '../qr/encoder'
import { renderModulesToRGBA } from '../qr/pixels'
import { parseHexColor } from '../qr/color'
import { encodePNG } from '../qr/png'
import { decodeOwnPng } from './helpers/png'

function decodeMatrix(text: string, ecc: ECCLevel, colorOverrides?: { dark?: string, light?: string }) {
    const { matrix } = encodeQRMatrix(text, ecc)
    const image = renderModulesToRGBA(matrix, {
        scale: 6,
        margin: 4,
        dark: parseHexColor(colorOverrides?.dark ?? '#000000ff'),
        light: parseHexColor(colorOverrides?.light ?? '#ffffffff'),
    })
    return jsQR(image.data, image.width, image.height)
}

const sampleIntents: string[] = [
    'upi://pay?pa=bhar4t@upi&pn=Bharat+Sahu',
    'upi://pay?pa=merchant@okhdfcbank&pn=Merchant+Store&am=499.00&cu=INR&tn=Order+42',
    'upi://pay?pa=a@b&pn=Cd',
    'upi://pay?' + 'a'.repeat(90), // forces a higher version at every ECC level
]

for (const intent of sampleIntents) {
    for (const ecc of ['L', 'M', 'Q', 'H'] as ECCLevel[]) {
        test(`round-trip decode: ecc=${ecc} len=${intent.length} scans back to the exact original string`, () => {
            const result = decodeMatrix(intent, ecc)
            assert.ok(result, 'jsQR failed to detect/decode the generated QR code')
            assert.equal(result!.data, intent)
        })
    }
}

test('round-trip decode: custom dark/light colors still scan correctly', () => {
    const intent = 'upi://pay?pa=bhar4t@upi&pn=Bharat+Sahu'
    const result = decodeMatrix(intent, 'M', { dark: '#0a1f44ff', light: '#fef6e4ff' })
    assert.ok(result)
    assert.equal(result!.data, intent)
})

test('round-trip decode: small scale (1px/module) with the standard 4-module quiet zone still scans correctly', () => {
    // margin=0 (no quiet zone) is intentionally not tested here: it violates the ISO/IEC 18004
    // quiet-zone requirement and fails to scan even for a reference-correct QR code.
    const { matrix } = encodeQRMatrix('upi://pay?pa=a@b&pn=Cd', 'H')
    const image = renderModulesToRGBA(matrix, {
        scale: 1,
        margin: 4,
        dark: parseHexColor('#000000ff'),
        light: parseHexColor('#ffffffff'),
    })
    const result = jsQR(image.data, image.width, image.height)
    assert.ok(result)
    assert.equal(result!.data, 'upi://pay?pa=a@b&pn=Cd')
})

test('encodePNG: produced PNG bytes decode back to the exact same pixel buffer', () => {
    const { matrix } = encodeQRMatrix('upi://pay?pa=bhar4t@upi&pn=Bharat+Sahu', 'M')
    const image = renderModulesToRGBA(matrix, {
        scale: 5,
        margin: 4,
        dark: parseHexColor('#000000ff'),
        light: parseHexColor('#ffffffff'),
    })

    const png = encodePNG(image)
    assert.deepEqual(png.subarray(0, 8), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))

    const decoded = decodeOwnPng(png)
    assert.equal(decoded.width, image.width)
    assert.equal(decoded.height, image.height)
    assert.deepEqual(Buffer.from(decoded.data.buffer), Buffer.from(image.data.buffer))
})

test('encodePNG: end-to-end PNG bytes are still scannable by a QR decoder', () => {
    const intent = 'upi://pay?pa=bhar4t@upi&pn=Bharat+Sahu'
    const { matrix } = encodeQRMatrix(intent, 'M')
    const image = renderModulesToRGBA(matrix, {
        scale: 5,
        margin: 4,
        dark: parseHexColor('#000000ff'),
        light: parseHexColor('#ffffffff'),
    })
    const png = encodePNG(image)
    const decoded = decodeOwnPng(png)
    const result = jsQR(decoded.data, decoded.width, decoded.height)
    assert.ok(result)
    assert.equal(result!.data, intent)
})
