import QRCode from 'qrcode'
import { QRResult, UPIIntentParams } from './types/upiqr'

function validateParams({ pa, pn }: {pa: string | undefined, pn: string | undefined }): string {
    if (!pa || !pn) return "Virtual Payee's Address/Payee's Name is compulsory"
    if (pa?.length < 5 || pn?.length < 4) return "Virtual Payee's Address/Payee's Name is too short."   
    return ''
}

function buildUrl(this: string, params: object) {
    let url = this, qs = ""
    for(let [key, value] of Object.entries(params)) 
        qs += encodeURIComponent(key) + "=" + encodeURIComponent(value) + "&"
    if (qs.length > 0) url = url + qs
    return url
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

        let error = validateParams({ pa, pn })
        if (error) reject(new Error(error))
    
        let intent = "upi://pay?"
        if (pa) intent = buildUrl.call(intent, { pa, pn })
        if (am) intent = buildUrl.call(intent, { am })
        if (mam) intent = buildUrl.call(intent, { mam })
        if (cu) intent = buildUrl.call(intent, { cu })
        if (mc) intent = buildUrl.call(intent, { mc })
        if (tid) intent = buildUrl.call(intent, { tid })
        if (tr) intent = buildUrl.call(intent, { tr }) // tr: transactionRef upto 35 digits
        if (tn) intent = buildUrl.call(intent, { tn })
        intent = intent.substring(0, intent.length-1)

        QRCode
            .toDataURL(intent)
            .then((base64Data: string) => resolve({ qr: base64Data, intent } as QRResult))
            .catch(err => reject(new Error("Unable to generate UPI QR Code.\n" + err)))
    })
}
