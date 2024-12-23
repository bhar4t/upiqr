import QRCode from 'qrcode'
import { QRResult, UPIIntentParams } from './types/upiqr'

function validateParams({ pa, pn }: { pa: string, pn: string }): string {
    if (!pa || !pn) return "Virtual Payee's Address/Payee's Name is compulsory"
    if ((pa?.length ?? 0) < 5 || (pn?.length ?? 0) < 4) return "Virtual Payee's Address/Payee's Name is too short."
    return ''
}

function buildUrl(params: object) {
    let qs = ""
    for(let [key, value] of Object.entries(params)) {
        if (value)
            qs += encodeURIComponent(key) + "=" + encodeURIComponent(value) + "&"
    }
    if (!qs.length)
        throw new Error("No valid parameters found to build UPI intent.")

    return "upi://pay?" + qs.slice(0, -1) // Remove trailing '&'
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
}: UPIIntentParams): Promise<QRResult> {
    return new Promise((resolve, reject) => {
        const params = { pa, pn, am, mam, cu, mc, tid, tr, tn }
        let error = validateParams(params)
        if (error) return reject(new Error(error))
        const intent = buildUrl(params)

        QRCode
            .toDataURL(intent)
            .then((base64Data: string) => resolve({ qr: base64Data, intent } as QRResult))
            .catch(err => reject(new Error("Unable to generate UPI QR Code.\n" + err)))
    })
}