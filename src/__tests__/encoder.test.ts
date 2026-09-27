import { test } from 'node:test'
import assert from 'node:assert/strict'
import { encodeQRMatrix, normalizeErrorCorrectionLevel, ECCLevel } from '../qr/encoder'

test('normalizeErrorCorrectionLevel: defaults to M when omitted', () => {
    assert.equal(normalizeErrorCorrectionLevel(undefined), 'M')
})

test('normalizeErrorCorrectionLevel: accepts short and long forms, case-insensitively', () => {
    assert.equal(normalizeErrorCorrectionLevel('L'), 'L')
    assert.equal(normalizeErrorCorrectionLevel('l'), 'L')
    assert.equal(normalizeErrorCorrectionLevel('low'), 'L')
    assert.equal(normalizeErrorCorrectionLevel('LOW'), 'L')
    assert.equal(normalizeErrorCorrectionLevel('medium'), 'M')
    assert.equal(normalizeErrorCorrectionLevel('quartile'), 'Q')
    assert.equal(normalizeErrorCorrectionLevel('high'), 'H')
})

test('normalizeErrorCorrectionLevel: rejects invalid values', () => {
    assert.throws(() => normalizeErrorCorrectionLevel('invalid'), /Invalid errorCorrectionLevel/)
})

test('encodeQRMatrix: every mask function is callable without throwing (regression for broken MASKS[5])', () => {
    // A payload picked so that all 8 masks get evaluated by chooseMask() internally;
    // failure here previously manifested as a ReferenceError at module load time.
    for (const ecc of ['L', 'M', 'Q', 'H'] as ECCLevel[]) {
        assert.doesNotThrow(() => encodeQRMatrix('upi://pay?pa=test@upi&pn=Test', ecc))
    }
})

test('encodeQRMatrix: produces a fully resolved square matrix (no leftover -1 sentinels)', () => {
    const { matrix, version } = encodeQRMatrix('upi://pay?pa=test@upi&pn=Test', 'M')
    const expectedSize = version * 4 + 17
    assert.equal(matrix.length, expectedSize)
    for (const row of matrix) {
        assert.equal(row.length, expectedSize)
        for (const cell of row) {
            assert.ok(cell === 0 || cell === 1, `unresolved cell found: ${cell}`)
        }
    }
})

test('encodeQRMatrix: a very small payload fits within version 1 at ECC L', () => {
    const { version } = encodeQRMatrix('upi://pay?pa=a@b', 'L')
    assert.equal(version, 1)
})

test('encodeQRMatrix: version grows monotonically as content length grows (same ECC)', () => {
    const short = encodeQRMatrix('upi://pay?pa=a@b&pn=Cd', 'M')
    const long = encodeQRMatrix('upi://pay?' + 'a'.repeat(150), 'M')
    assert.ok(long.version > short.version)
})

test('encodeQRMatrix: higher ECC level needs an equal or larger version for the same payload', () => {
    const text = 'upi://pay?pa=merchant@upi&pn=Merchant%20Name&am=499.00&tn=Order%20123456'
    const low = encodeQRMatrix(text, 'L')
    const high = encodeQRMatrix(text, 'H')
    assert.ok(high.version >= low.version)
})

test('encodeQRMatrix: throws a clear capacity error when payload exceeds version 10 at the requested ECC', () => {
    const huge = 'x'.repeat(5000)
    assert.throws(() => encodeQRMatrix(huge, 'H'), /Input is too long to encode/)
})

test('encodeQRMatrix: UTF-8 multi-byte payloads (e.g. payee names with non-ASCII characters) encode without error', () => {
    assert.doesNotThrow(() => encodeQRMatrix('upi://pay?pa=a@b&pn=Bharat%20%E0%A4%AD%E0%A4%BE%E0%A4%B0%E0%A4%A4', 'M'))
})
