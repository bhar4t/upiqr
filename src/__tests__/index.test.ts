import { test } from 'node:test'
import assert from 'node:assert/strict'
import jsQR from 'jsqr'
import upiqr, { upiqrSync } from '../index'
import { decodeOwnPng } from './helpers/png'

function decodeDataUrl(dataUrl: string) {
    assert.match(dataUrl, /^data:image\/png;base64,/)
    const base64 = dataUrl.substring('data:image/png;base64,'.length)
    const png = Buffer.from(base64, 'base64')
    const decoded = decodeOwnPng(png)
    return jsQR(decoded.data, decoded.width, decoded.height)
}

test('upiqr(): generates a scannable QR whose payload matches the returned intent', async () => {
    const { qr, intent } = await upiqr({ payeeVPA: 'bhar4t@upi', payeeName: 'Bharat Sahu' })
    const result = decodeDataUrl(qr)
    assert.ok(result)
    assert.equal(result!.data, intent)
    assert.equal(intent, 'upi://pay?pa=bhar4t%40upi&pn=Bharat+Sahu')
})

test('upiqr(): includes optional fields (amount, currency, note, ids) in the intent and QR payload', async () => {
    const { qr, intent } = await upiqr({
        payeeVPA: 'merchant@okhdfcbank',
        payeeName: 'Merchant Store',
        amount: '499.00',
        minimumAmount: '100.00',
        currency: 'INR',
        payeeMerchantCode: '1234',
        transactionId: 'txn123',
        transactionRef: 'ref456',
        transactionNote: 'Order 42',
    })
    for (const fragment of ['am=499.00', 'mam=100.00', 'cu=INR', 'mc=1234', 'tid=txn123', 'tr=ref456', 'tn=Order']) {
        assert.ok(intent.includes(fragment), `intent missing expected fragment: ${fragment}`)
    }
    const result = decodeDataUrl(qr)
    assert.ok(result)
    assert.equal(result!.data, intent)
})

test('upiqr(): respects a custom errorCorrectionLevel option end-to-end', async () => {
    const { qr, intent } = await upiqr({ payeeVPA: 'bhar4t@upi', payeeName: 'Bharat Sahu' }, { errorCorrectionLevel: 'H' })
    const result = decodeDataUrl(qr)
    assert.ok(result)
    assert.equal(result!.data, intent)
})

test('upiqr(): respects custom color options and stays scannable', async () => {
    const { qr, intent } = await upiqr(
        { payeeVPA: 'bhar4t@upi', payeeName: 'Bharat Sahu' },
        { color: { dark: '#0a1f44ff', light: '#fef6e4ff' }, scale: 6 },
    )
    const base64 = qr.substring('data:image/png;base64,'.length)
    const png = Buffer.from(base64, 'base64')
    const decoded = decodeOwnPng(png)

    // Spot-check a pixel known to be a dark finder-pattern module (top-left finder, after the margin).
    const margin = 4
    const scale = 6
    const px = (margin + 3) * scale + 1
    const py = (margin + 3) * scale + 1
    const idx = (py * decoded.width + px) * 4
    assert.equal(decoded.data[idx], 0x0a)
    assert.equal(decoded.data[idx + 1], 0x1f)
    assert.equal(decoded.data[idx + 2], 0x44)

    const result = jsQR(decoded.data, decoded.width, decoded.height)
    assert.ok(result)
    assert.equal(result!.data, intent)
})

test('upiqr(): rejects missing payee fields', async () => {
    await assert.rejects(() => upiqr({ payeeVPA: '', payeeName: '' }), /compulsory/)
})

test('upiqr(): rejects too-short payee fields', async () => {
    await assert.rejects(() => upiqr({ payeeVPA: 'a@b', payeeName: 'Cd' }), /too short/)
})

test('upiqr(): rejects an invalid errorCorrectionLevel with a clear error', async () => {
    await assert.rejects(
        () => upiqr({ payeeVPA: 'bhar4t@upi', payeeName: 'Bharat Sahu' }, { errorCorrectionLevel: 'invalid' as never }),
        /Invalid errorCorrectionLevel/,
    )
})

test('upiqrSync(): returns the same result as upiqr() without a Promise', async () => {
    const params = { payeeVPA: 'bhar4t@upi', payeeName: 'Bharat Sahu' }
    const sync = upiqrSync(params)
    assert.equal(typeof (sync as unknown as Promise<unknown>).then, 'undefined')
    const result = decodeDataUrl(sync.qr)
    assert.ok(result)
    assert.equal(result!.data, sync.intent)

    const asyncResult = await upiqr(params)
    assert.equal(sync.intent, asyncResult.intent)
})

test('upiqrSync(): rejects missing payee fields synchronously (throws, not a rejected promise)', () => {
    assert.throws(() => upiqrSync({ payeeVPA: '', payeeName: '' }), /compulsory/)
})

test('upiqr() (deprecated default export): warns at most once, not on every call', async () => {
    const originalWarn = console.warn
    const calls: unknown[][] = []
    console.warn = (...args: unknown[]) => { calls.push(args) }
    try {
        await upiqr({ payeeVPA: 'bhar4t@upi', payeeName: 'Bharat Sahu' })
        await upiqr({ payeeVPA: 'bhar4t@upi', payeeName: 'Bharat Sahu' })
    } finally {
        console.warn = originalWarn
    }
    // warn-once is process-global, so an earlier test in this file may have already triggered it -
    // the invariant under test is "never more than 1 additional warning for these 2 calls".
    assert.ok(calls.length <= 1, `expected at most 1 warning across 2 calls, got ${calls.length}`)
    if (calls.length === 1) assert.match(String(calls[0]?.[0]), /deprecated/i)
})
