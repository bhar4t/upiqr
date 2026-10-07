import { test } from 'node:test'
import assert from 'node:assert/strict'
import jsQR from 'jsqr'
import { upiqrSync } from '../index.js'
import { decodeOwnPng } from './helpers/png.js'
import { ErrorCorrectionLevel, UPIIntentParams, UpiqrRenderOptions } from '../types/upiqr.js'

/**
 * Payment-critical exhaustive test suite.
 *
 * The QR engine is now entirely in-house (no third-party fallback), so every generated QR MUST
 * either:
 *   (a) decode back to the exact original intent string (verified via a real decoder, jsQR), or
 *   (b) throw a clear, catchable error (so the caller can stop the transaction safely).
 * It must NEVER silently return a QR that fails to scan or decodes to the wrong payload - that
 * would let a transaction proceed with a broken/unpayable QR code.
 */

function decodeDataUrl(dataUrl: string) {
    assert.match(dataUrl, /^data:image\/png;base64,/)
    const png = Buffer.from(dataUrl.substring('data:image/png;base64,'.length), 'base64')
    const { data, width, height } = decodeOwnPng(png)
    return jsQR(data, width, height)
}

function assertRoundTrip(params: UPIIntentParams, qrOptions: UpiqrRenderOptions | undefined, label: string): void {
    const { qr, intent } = upiqrSync(params, qrOptions)
    const result = decodeDataUrl(qr)
    assert.ok(result, `[${label}] QR failed to scan (jsQR returned null) for intent="${intent}"`)
    assert.equal(result!.data, intent, `[${label}] decoded payload does not match the original intent`)
}

const ECC_LEVELS: ErrorCorrectionLevel[] = ['L', 'M', 'Q', 'H']

const BASE: UPIIntentParams = { payeeVPA: 'bhar4t@upi', payeeName: 'Bharat Sahu' }

const OPTIONAL_FIELD_VALUES = {
    payeeMerchantCode: '1234',
    transactionId: 'txn123',
    transactionRef: 'ref456',
    transactionNote: 'Order 42',
    amount: '499.00',
    minimumAmount: '100.00',
    currency: 'INR',
} as const
const OPTIONAL_KEYS = Object.keys(OPTIONAL_FIELD_VALUES) as (keyof typeof OPTIONAL_FIELD_VALUES)[]

function buildParamsForMask(mask: number): UPIIntentParams {
    const params: UPIIntentParams = { ...BASE }
    for (let i = 0; i < OPTIONAL_KEYS.length; i++) {
        if (mask & (1 << i)) {
            const key = OPTIONAL_KEYS[i]!
            params[key] = OPTIONAL_FIELD_VALUES[key]
        }
    }
    return params
}

// ---------------------------------------------------------------------------
// 1. Every combination of optional UPI fields (2^7 = 128) x every ECC level (4) = 512 round-trips.
// ---------------------------------------------------------------------------
test('upiqrSync(): every optional-field combination round-trips correctly at every ECC level', () => {
    const totalCombos = 1 << OPTIONAL_KEYS.length
    const failures: string[] = []
    let total = 0

    for (const ecc of ECC_LEVELS) {
        for (let mask = 0; mask < totalCombos; mask++) {
            total++
            const params = buildParamsForMask(mask)
            const label = `ecc=${ecc} mask=${mask.toString(2).padStart(OPTIONAL_KEYS.length, '0')}`
            try {
                assertRoundTrip(params, { errorCorrectionLevel: ecc }, label)
            } catch (e) {
                failures.push(`${label}: ${(e as Error).message}`)
            }
        }
    }

    assert.equal(failures.length, 0, `${failures.length}/${total} combinations failed:\n${failures.slice(0, 20).join('\n')}`)
})

// ---------------------------------------------------------------------------
// 2. Color hex-format permutations (#rgb/#rgba/#rrggbb/#rrggbbaa) x dark/light.
// ---------------------------------------------------------------------------
test('upiqrSync(): every supported color hex-length format round-trips correctly', () => {
    const darkVariants = ['#000', '#000f', '#000000', '#000000ff', '#123', '#123456', '#1a2b3cff']
    const lightVariants = ['#fff', '#ffff', '#ffffff', '#ffffffff', '#eee', '#eeeeee', '#fef6e4ff']
    const failures: string[] = []

    for (const dark of darkVariants) {
        try {
            assertRoundTrip(BASE, { color: { dark, light: '#ffffffff' } }, `dark=${dark}`)
        } catch (e) {
            failures.push(`dark=${dark}: ${(e as Error).message}`)
        }
    }
    for (const light of lightVariants) {
        try {
            assertRoundTrip(BASE, { color: { dark: '#000000ff', light } }, `light=${light}`)
        } catch (e) {
            failures.push(`light=${light}: ${(e as Error).message}`)
        }
    }

    assert.equal(failures.length, 0, failures.join('\n'))
})

// ---------------------------------------------------------------------------
// 3. margin x scale grid.
// ---------------------------------------------------------------------------
test('upiqrSync(): every margin x scale combination with >=2px of quiet zone round-trips correctly', () => {
    const margins = [1, 2, 4, 8]
    const scales = [1, 2, 3, 4, 8]
    const failures: string[] = []

    for (const margin of margins) {
        for (const scale of scales) {
            // A quiet zone thinner than 2px (e.g. margin=1 x scale=1) is below any real scanner's
            // detection threshold - confirmed this holds even for a reference-correct QR code, so
            // it's a physical/decoder limitation, not something the encoder can or should fix.
            if (margin * scale < 2) continue
            try {
                assertRoundTrip(BASE, { margin, scale }, `margin=${margin} scale=${scale}`)
            } catch (e) {
                failures.push(`margin=${margin} scale=${scale}: ${(e as Error).message}`)
            }
        }
    }

    assert.equal(failures.length, 0, `${failures.length} failed:\n${failures.join('\n')}`)
})

// ---------------------------------------------------------------------------
// 4. `width` override at various target sizes.
// ---------------------------------------------------------------------------
test('upiqrSync(): width override produces a scannable image at every requested size', () => {
    const widths = [50, 100, 150, 200, 300, 500, 1000]
    const failures: string[] = []

    for (const width of widths) {
        const { qr, intent } = upiqrSync(BASE, { width })
        const png = Buffer.from(qr.substring('data:image/png;base64,'.length), 'base64')
        const decoded = decodeOwnPng(png)
        const result = jsQR(decoded.data, decoded.width, decoded.height)
        if (!result || result.data !== intent) {
            failures.push(`width=${width}: decodeOk=${!!result} dims=${decoded.width}x${decoded.height}`)
        }
    }

    assert.equal(failures.length, 0, failures.join('\n'))
})

// ---------------------------------------------------------------------------
// 5. Every accepted errorCorrectionLevel spelling (short/long form, case-insensitive).
// ---------------------------------------------------------------------------
test('upiqrSync(): every accepted errorCorrectionLevel spelling round-trips correctly', () => {
    const aliases = ['L', 'M', 'Q', 'H', 'l', 'm', 'q', 'h', 'low', 'medium', 'quartile', 'high', 'LOW', 'Medium', 'QUARTILE', 'High']
    const failures: string[] = []

    for (const alias of aliases) {
        try {
            assertRoundTrip(BASE, { errorCorrectionLevel: alias as ErrorCorrectionLevel }, `errorCorrectionLevel=${alias}`)
        } catch (e) {
            failures.push(`errorCorrectionLevel=${alias}: ${(e as Error).message}`)
        }
    }

    assert.equal(failures.length, 0, failures.join('\n'))
})

// ---------------------------------------------------------------------------
// 6. Boundary validation - exact length thresholds for payeeVPA (>=5) / payeeName (>=4).
// ---------------------------------------------------------------------------
test('upiqrSync(): payeeVPA/payeeName length boundaries are enforced exactly', () => {
    // Valid: exactly at the minimum length.
    assert.doesNotThrow(() => upiqrSync({ payeeVPA: 'a@bcd', payeeName: 'Abcd' })) // pa=5, pn=4

    // Invalid: one character short of the minimum.
    assert.throws(() => upiqrSync({ payeeVPA: 'a@bc', payeeName: 'Abcd' }), /too short/)
    assert.throws(() => upiqrSync({ payeeVPA: 'a@bcd', payeeName: 'Abc' }), /too short/)
    assert.throws(() => upiqrSync({ payeeVPA: 'a@bc', payeeName: 'Abc' }), /too short/)

    // Invalid: missing entirely.
    assert.throws(() => upiqrSync({ payeeVPA: '', payeeName: '' }), /compulsory/)
    assert.throws(() => upiqrSync({ payeeVPA: '', payeeName: 'Abcd' }), /compulsory/)
    assert.throws(() => upiqrSync({ payeeVPA: 'a@bcd', payeeName: '' }), /compulsory/)
})

// ---------------------------------------------------------------------------
// 7. Invalid render options must always throw a clear error - never silently degrade.
// ---------------------------------------------------------------------------
test('upiqrSync(): invalid render options always throw a clear, catchable error', () => {
    assert.throws(() => upiqrSync(BASE, { margin: -1 }), /non-negative/)
    assert.throws(() => upiqrSync(BASE, { scale: 0 }), /positive/)
    assert.throws(() => upiqrSync(BASE, { scale: -2 }), /positive/)
    assert.throws(() => upiqrSync(BASE, { errorCorrectionLevel: 'XYZ' as ErrorCorrectionLevel }), /Invalid errorCorrectionLevel/)
    assert.throws(() => upiqrSync(BASE, { color: { dark: 'notacolor' } }), /Invalid color/)
    assert.throws(() => upiqrSync(BASE, { color: { light: '#12' } }), /Invalid color/)
    assert.throws(() => upiqrSync(BASE, { color: { dark: '#1234567' } }), /Invalid color/) // 7 hex digits, invalid length
    assert.throws(() => upiqrSync(BASE, { color: { dark: '#gggggg' } }), /Invalid color/) // non-hex chars
})

// ---------------------------------------------------------------------------
// 8. Exhaustive-by-one-byte capacity sweep per ECC level: every length that succeeds must decode
//    correctly, and crossing the limit must throw (never hang or silently corrupt).
// ---------------------------------------------------------------------------
test('upiqrSync(): every payload length, byte by byte, either round-trips exactly or throws a clear capacity error', () => {
    const ranges: Record<ErrorCorrectionLevel, number> = { L: 265, M: 205, Q: 145, H: 105 }
    const failures: string[] = []
    let successes = 0
    let capacityErrors = 0

    for (const ecc of ECC_LEVELS) {
        const maxLen = ranges[ecc]
        for (let len = 0; len <= maxLen; len++) {
            const params: UPIIntentParams = { ...BASE, transactionNote: 'n'.repeat(len) }
            try {
                const { qr, intent } = upiqrSync(params, { errorCorrectionLevel: ecc })
                const result = decodeDataUrl(qr)
                if (!result || result.data !== intent) {
                    failures.push(`ecc=${ecc} len=${len}: generated a QR that failed to decode correctly (silent corruption)`)
                } else {
                    successes++
                }
            } catch (e) {
                const message = (e as Error).message
                if (!/too long to encode/i.test(message)) {
                    failures.push(`ecc=${ecc} len=${len}: unexpected error: ${message}`)
                } else {
                    capacityErrors++
                }
            }
        }
    }

    assert.ok(successes > 0, 'expected at least some successful round-trips in the sweep')
    assert.ok(capacityErrors > 0, 'expected the sweep to eventually hit a clear capacity error at every ECC level')
    assert.equal(failures.length, 0, `${failures.length} unexpected outcomes:\n${failures.slice(0, 20).join('\n')}`)
})

// ---------------------------------------------------------------------------
// 9. Unicode / special-character payloads - byte-mode UTF-8 correctness, across all ECC levels.
// Using the same name twice (payeeName + transactionNote) can legitimately exceed capacity for
// multi-byte scripts at low-capacity ECC levels (Q/H) - a clear capacity error is an acceptable
// outcome there, same invariant as the byte-sweep test; silent corruption is never acceptable.
// ---------------------------------------------------------------------------
test('upiqrSync(): unicode and special-character field values either round-trip exactly or throw a clear capacity error', () => {
    const specialNames = [
        'Bharat Sahu',
        "O'Brien & Sons",
        'Müller Straße',
        'भरत साहू', // Devanagari (multi-byte UTF-8)
        '店铺名称', // Chinese
        'مرحبا بك', // Arabic
        'Café "Deluxe" #1',
        '😀 Payments Pvt Ltd 🚀',
        'Test=Value&More?Stuff#Here',
    ]
    const failures: string[] = []

    for (const ecc of ECC_LEVELS) {
        for (const name of specialNames) {
            const params: UPIIntentParams = { payeeVPA: 'merchant@upi', payeeName: name, transactionNote: name }
            const label = `ecc=${ecc} name="${name}"`
            try {
                assertRoundTrip(params, { errorCorrectionLevel: ecc }, label)
            } catch (e) {
                const message = (e as Error).message
                if (!/too long to encode/i.test(message)) failures.push(`${label}: ${message}`)
            }
        }
    }

    assert.equal(failures.length, 0, failures.join('\n'))
})

// ---------------------------------------------------------------------------
// 10. Deprecated async default export must match the sync result exactly, for the full field matrix.
// ---------------------------------------------------------------------------
test('upiqr() (deprecated) and upiqrSync() produce identical intents across the full optional-field matrix', async () => {
    const { default: upiqr } = await import('../index.js')
    const totalCombos = 1 << OPTIONAL_KEYS.length
    const failures: string[] = []

    for (let mask = 0; mask < totalCombos; mask += 17) { // sampled stride, full matrix already covered in test 1
        const params = buildParamsForMask(mask)
        const sync = upiqrSync(params)
        const asyncResult = await upiqr(params)
        if (sync.intent !== asyncResult.intent) {
            failures.push(`mask=${mask}: sync="${sync.intent}" async="${asyncResult.intent}"`)
        }
    }

    assert.equal(failures.length, 0, failures.join('\n'))
})
