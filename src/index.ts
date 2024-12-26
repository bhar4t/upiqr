import QRCode from 'qrcode'
import { QRResult, UPIIntentParams, Base64, ImageType } from './types/upiqr'

/**
 * Validates the required parameters for generating UPI intent.
 * @param {Object} params - The parameters object containing payeeVPA and payeeName.
 * @returns {string} - An error message if validation fails, otherwise an empty string.
 */
function validateParams({ pa, pn }: { pa: string, pn: string }): string {
    if (!pa || !pn) return "Virtual payee's address/name is compulsory"
    if (pa.length < 5 || pn.length < 4) return "Virtual payee's address/name is too short."
    return ''
}

/**
 * Builds the UPI intent URL from the given parameters.
 * @param {Object} params - The parameters object containing UPI intent fields.
 * @returns {string} - The constructed UPI intent URL.
 */
function buildUrl(params: object): string {
    let qs = ""
    for (let [key, value] of Object.entries(params)) {
        if (value)
            qs += encodeURIComponent(key) + "=" + encodeURIComponent(value) + "&"
    }
    return "upi://pay?" + qs.slice(0, -1) // Remove trailing '&'
}

/**
 * Generates a UPI QR code and intent URL.
 * @param {UPIIntentParams} params - The UPI intent parameters.
 * @param {QRCode.QRCodeToDataURLOptions} [qrOptions] - Optional QR code generation options.
 * @returns {Promise<QRResult>} - A promise that resolves to the QR code and intent URL.
 */
export default function upiqr ({
    payeeVPA: pa,
    payeeName: pn,
    payeeMerchantCode: mc,
    transactionId: tid,
    transactionRef: tr,
    transactionNote: tn,
    amount: am,
    minimumAmount: mam,
    currency: cu,
}: UPIIntentParams, qrOptions?: QRCode.QRCodeToDataURLOptions): Promise<QRResult> {
    return new Promise((resolve, reject) => {
        const params = { pa, pn, am, mam, cu, mc, tid, tr, tn }
        let error = validateParams(params)
        if (error) return reject(new Error(error))
        const intent = buildUrl(params)

        QRCode
            .toDataURL(intent, qrOptions)
            .then((base64Data: string) => resolve({ qr: base64Data as Base64<ImageType>, intent } as QRResult))
            .catch(err => reject(new Error("Unable to generate UPI QR Code.\n" + err)))
    })
}