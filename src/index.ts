import QRCode from 'qrcode'
import { QRResult, UPIIntentParams, Base64, ImageType } from './types/upiqr'

/**
 * Validates the required parameters for generating UPI intent.
 * @param {Object} params - The parameters object containing payeeVPA and payeeName.
 * @returns {string} - An error message if validation fails, otherwise an empty string.
 */
function validate<T extends { pa: string, pn: string }>({ pa, pn }: T): string {
    if (!pa || !pn) return "Virtual payee's address/name is compulsory"
    if (pa.length < 5 || pn.length < 4) return "Virtual payee's address/name is too short."
    return ''
}

/**
 * Generates a UPI QR code and intent URL.
 * @param {UPIIntentParams} params - The UPI intent parameters.
 * @param {QRCode.QRCodeToDataURLOptions} [qrOptions] - Optional QR code generation options.
 * @returns {Promise<QRResult>} - A promise that resolves to the QR code and intent URL.
 */
export default async function upiqr ({
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
    const params: Record<string, string> = { pa, pn }
    for (const [key, value] of Object.entries({ am, mam, cu, mc, tid, tr, tn })) {
        if (value) params[key] = value
    }

    const error = validate(params as any)
    if (error) throw new Error(error)

    const intent = 'upi://pay?' + new URLSearchParams(params).toString()

    try {
        const qr = await QRCode.toDataURL(intent, qrOptions) as Base64<ImageType>
        return { qr, intent }
    } catch (err) {
        throw new Error("Unable to generate UPI QR Code.\n" + err)
    }
}

upiqr({ payeeVPA: 'bhar4t@ybl', payeeName: 'Bharat Sahu' }).then(console.log).catch(console.error)