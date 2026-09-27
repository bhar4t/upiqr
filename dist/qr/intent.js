function validate({ pa, pn }) {
    if (!pa || !pn)
        return "Virtual payee's address/name is compulsory";
    if (pa.length < 5 || pn.length < 4)
        return "Virtual payee's address/name is too short.";
    return '';
}
/** Validates UPI intent params and builds the `upi://pay?...` deep link. */
export function buildUPIIntent({ payeeVPA: pa, payeeName: pn, payeeMerchantCode: mc, transactionId: tid, transactionRef: tr, transactionNote: tn, amount: am, minimumAmount: mam, currency: cu, }) {
    const error = validate({ pa, pn });
    if (error)
        throw new Error(error);
    const params = { pa, pn };
    if (am)
        params['am'] = am;
    if (mam)
        params['mam'] = mam;
    if (cu)
        params['cu'] = cu;
    if (mc)
        params['mc'] = mc;
    if (tid)
        params['tid'] = tid;
    if (tr)
        params['tr'] = tr;
    if (tn)
        params['tn'] = tn;
    return 'upi://pay?' + new URLSearchParams(params).toString();
}
