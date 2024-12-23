import QRCode from 'qrcode';
function validateParams({ pa, pn }) {
    var _a, _b;
    if (!pa || !pn)
        return "Virtual Payee's Address/Payee's Name is compulsory";
    if (((_a = pa === null || pa === void 0 ? void 0 : pa.length) !== null && _a !== void 0 ? _a : 0) < 5 || ((_b = pn === null || pn === void 0 ? void 0 : pn.length) !== null && _b !== void 0 ? _b : 0) < 4)
        return "Virtual Payee's Address/Payee's Name is too short.";
    return '';
}
function buildUrl(params) {
    let qs = "";
    for (let [key, value] of Object.entries(params)) {
        if (value)
            qs += encodeURIComponent(key) + "=" + encodeURIComponent(value) + "&";
    }
    if (!qs.length)
        throw new Error("No valid parameters found to build UPI intent.");
    return "upi://pay?" + qs.slice(0, -1); // Remove trailing '&'
}
export default function upiqr({ payeeVPA: pa, payeeName: pn, payeeMerchantCode: mc, transactionId: tid, transactionRef: tr, transactionNote: tn, amount: am, minimumAmount: mam, currency: cu, }, qrOptions) {
    return new Promise((resolve, reject) => {
        const params = { pa, pn, am, mam, cu, mc, tid, tr, tn };
        let error = validateParams(params);
        if (error)
            return reject(new Error(error));
        const intent = buildUrl(params);
        QRCode
            .toDataURL(intent, qrOptions)
            .then((base64Data) => resolve({ qr: base64Data, intent }))
            .catch(err => reject(new Error("Unable to generate UPI QR Code.\n" + err)));
    });
}
