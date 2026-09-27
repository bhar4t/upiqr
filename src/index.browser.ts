import { buildUPIIntent } from './qr/intent.js'
import { encodeQRMatrix, normalizeErrorCorrectionLevel } from './qr/encoder.js'
import { renderModulesToRGBA } from './qr/pixels.js'
import { resolveRenderOptions } from './qr/options.js'
import { encodeCanvasPNG } from './qr/canvas.js'
import { warnDeprecatedAsyncDefault } from './qr/deprecation.js'
import { QRResult, UPIIntentParams, UpiqrRenderOptions } from './types/upiqr.js'

/**
 * Generates a UPI QR code (PNG data URL) and intent URL. Synchronous - no Promise involved.
 * Browser entry point - rendering uses the native Canvas API (resolved via the package's
 * `browser`/`exports` field, so bundlers pick this file instead of the Node entry point).
 * @param {UPIIntentParams} params - The UPI intent parameters.
 * @param {UpiqrRenderOptions} [qrOptions] - Optional QR code generation options.
 * @returns {QRResult} - The QR code and intent URL.
 */
export function upiqrSync(params: UPIIntentParams, qrOptions?: UpiqrRenderOptions): QRResult {
    const intent = buildUPIIntent(params)

    try {
        const ecc = normalizeErrorCorrectionLevel(qrOptions?.errorCorrectionLevel)
        const { matrix } = encodeQRMatrix(intent, ecc)
        const renderOptions = resolveRenderOptions(matrix.length, qrOptions)
        const image = renderModulesToRGBA(matrix, renderOptions)
        const qr = encodeCanvasPNG(image)
        return { qr, intent }
    } catch (err) {
        throw new Error("Unable to generate UPI QR Code.\n" + err)
    }
}

/**
 * @deprecated Use the synchronous `upiqrSync` export instead - `upiqr` does no async work anymore
 * and is kept only so existing `await upiqr(...)`/`upiqr(...).then(...)` call sites keep working.
 * Will be removed in a future major version.
 * @param {UPIIntentParams} params - The UPI intent parameters.
 * @param {UpiqrRenderOptions} [qrOptions] - Optional QR code generation options.
 * @returns {Promise<QRResult>} - A promise that resolves to the QR code and intent URL.
 */
export default async function upiqr(params: UPIIntentParams, qrOptions?: UpiqrRenderOptions): Promise<QRResult> {
    warnDeprecatedAsyncDefault()
    return upiqrSync(params, qrOptions)
}
