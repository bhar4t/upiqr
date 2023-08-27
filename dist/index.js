import QRCode from 'qrcode';
export default function upiqr({ payeeVPA: pa, payeeName: pn, payeeMerchantCode: me, transactionId: tid, transactionRef: tr, transactionNote: tn, amount: am, minimumAmount: mam, currency: cu, }) {
    return new Promise((resolve, reject) => {
        let error = validateParams({ pa, pn });
        if (error)
            reject(new Error(error));
        let intent = "upi://pay?";
        if (pa)
            intent = buildUrl.call(intent, { pa, pn });
        if (am)
            intent = buildUrl.call(intent, { am });
        if (mam)
            intent = buildUrl.call(intent, { mam });
        if (cu)
            intent = buildUrl.call(intent, { cu });
        if (me)
            intent = buildUrl.call(intent, { me });
        if (tid)
            intent = buildUrl.call(intent, { tid });
        if (tr)
            intent = buildUrl.call(intent, { tr }); // tr: transactionRef upto 35 digits
        if (tn)
            intent = buildUrl.call(intent, { tn });
        intent = intent.substring(0, intent.length - 1);
        QRCode
            .toDataURL(intent)
            .then((base64Data) => resolve({ qr: base64Data, intent }))
            .catch(err => reject(new Error("Unable to generate UPI QR Code.\n" + err)));
    });
}
