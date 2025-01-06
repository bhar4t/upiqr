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
    const params: any = Object.assign({ pa, pn }, Object.fromEntries(Object.entries({ am, mam, cu, mc, tid, tr, tn }).filter(([_, value]) => value)))
    const error = validate(params)
    if (error) return Promise.reject(new Error(error))

    const intent = 'upi://pay?' + new URLSearchParams(params).toString()
    
    return new Promise((resolve, reject) => {
        QRCode
            .toDataURL(intent, qrOptions)
            .then((base64Data: string) => resolve({ qr: base64Data as Base64<ImageType>, intent } as QRResult))
            .catch(err => reject(new Error("Unable to generate UPI QR Code.\n" + err)))
    })
}