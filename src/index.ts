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
    if (am) params['am'] = am
    if (mam) params['mam'] = mam
    if (cu) params['cu'] = cu
    if (mc) params['mc'] = mc
    if (tid) params['tid'] = tid
    if (tr) params['tr'] = tr
    if (tn) params['tn'] = tn

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