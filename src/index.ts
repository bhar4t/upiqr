import QRCode from 'qrcode'
import { QRResult, UPIIntentParams, Base64, ImageType } from './types/upiqr'

function validateParams({ pa, pn }: { pa: string, pn: string }): string {
    if (!pa || !pn) return "Virtual payee's address/name is compulsory"
    if (pa.length < 5 || pn.length < 4) return "Virtual payee's address/name is too short."
    return ''
}

function buildUrl(params: object) {
    let qs = ""
    for(let [key, value] of Object.entries(params)) {
        if (value)
            qs += encodeURIComponent(key) + "=" + encodeURIComponent(value) + "&"
    }

    return "upi://pay?" + qs.slice(0, -1)
}

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
            .toDataURL(intent,qrOptions)
            .then((base64Data: string) => resolve({ qr: base64Data as Base64<ImageType>, intent } as QRResult))
            .catch(err => reject(new Error("Unable to generate UPI QR Code.\n" + err)))
    })
}