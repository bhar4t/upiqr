const QRCode = require("qrcode")

type ImageType = 'png' | 'jpeg'
type Base64<imageType extends ImageType> = `data:image/${imageType};base64${string}`

interface UPIIntentParams {
    payeeVPA?: string;
    payeeName?: string;
    payeeMerchantCode?: string;
    transactionId?: string;
    transactionRef?: string;
    transactionNote?: string;
    amount?: string;
    minimumAmount?: string;
    currency?: string;
    transactionRefUrl?: string;
}

interface UPIIntentResult {
    qr: string;
    intent: string;
    error: string
}

function validateParams({ pa, pn }: {pa: string | undefined, pn: string | undefined }): string {
    let error = ''
    if (!pa || !pn) return "Virtual Payee's Address/Payee's Name is compulsory"
    if (pa?.length < 5 || pn?.length < 4) return "Virtual Payee's Address/Payee's Name is too short."   
    return error
}

function buildUrl(this: string, params: object) {
    let url = this, qs = ""
    for(let [key, value] of Object.entries(params)) 
        qs += encodeURIComponent(key) + "=" + encodeURIComponent(value) + "&"
    if (qs.length > 0) url = url + qs
    return url
}

function upiqr ({
    payeeVPA: pa,
    payeeName: pn,
    payeeMerchantCode: me,
    transactionId: tid,
    transactionRef: tr,
    transactionNote: tn,
    amount: am,
    minimumAmount: mam,
    currency: cu,
    transactionRefUrl: url,
}: UPIIntentParams): Promise<UPIIntentResult | Error> {
    return new Promise((resolve, reject) => {

        let error = validateParams({ pa, pn })
        if (error) reject(new Error(error))
    
        let intent = "upi://pay?"
        if (pa) intent = buildUrl.call(intent, { pa, pn })
        if (am) intent = buildUrl.call(intent, { am })
        if (mam) intent = buildUrl.call(intent, { mam })
        if (cu) intent = buildUrl.call(intent, { cu })
        if (me) intent = buildUrl.call(intent, { me })
        if (tid) intent = buildUrl.call(intent, { tid })
        if (tr) intent = buildUrl.call(intent, { tr }) // tr: transactionRef upto 35 digits
        if (tn) intent = buildUrl.call(intent, { tn })
        console.log(url)
        intent = intent.substring(0, intent.length-1)

        QRCode.toDataURL(
            intent,
            (err: string, qr: Base64<'png'>) => {
              if (err) reject(new Error("Unable to generate UPI QR Code."))
              resolve({ qr, intent, error: '' } as UPIIntentResult)
            }
        )
    })
}

exports.default = upiqr;