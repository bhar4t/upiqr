const QRCode = require("qrcode")

function validateParams({ pa, pn }) {
    let error = false
    if (!pa || !pn) error = "Virtual Payee's Address/Payee's Name is compulsory"
    if (pa?.length < 5 || pn?.length < 4) error = "Virtual Payee's Address/Payee's Name is too short."   
    return error
}

function buildUrl(params) {
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
}) {
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
        if (tr) intent = buildUrl.call(intent, { tr }) // // tr: transactionRef upto 35 digits
        if (tn) intent = buildUrl.call(intent, { tn })
        intent = intent.substring(0, intent.length-1)

        QRCode.toDataURL(
            intent,
            (err, qr) => {
              if (err) reject(new Error("Unable to generate UPI QR Code."))
              resolve({ qr, intent })
            }
        )
    })
}

module.exports = {
    upiqr
}