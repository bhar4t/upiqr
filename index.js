const QRCode = require("qrcode");

function validateParams({ pa, pn }) {
    if (!pa || !pn) {
        return "Please provide valid Virtual Payee's Address/Payee's Name.";
    } else if ((pa && pa.length < 5) || (pn && pn.length < 4)) {
        return "Virtual Payee's Address/Payee's Name is too short."   
    } else return false;
    // tr: Transaction Ref No. (upto 35 digits) 
}

function buildUrl(url, parameters) {
    var qs = "";
    for(var key in parameters) {
      var value = parameters[key];
      qs += encodeURIComponent(key) + "=" + encodeURIComponent(value) + "&";
    }
    if (qs.length > 0) url = url + qs;
    return url;
  }

  export default function upiqr ({
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

        let error = validateParams({ pa, pn });
        if (error) reject(new Error(error));
    
        let intent = "upi://pay?";
        if (pa) intent = buildUrl(intent, { pa, pn });
        if (am) intent = buildUrl(intent, { am });
        if (mam) intent = buildUrl(intent, { mam });
        if (cu) intent = buildUrl(intent, { cu });
        if (me) intent = buildUrl(intent, { me });
        if (tid) intent = buildUrl(intent, { tid });
        if (tr) intent = buildUrl(intent, { tr });
        if (tn) intent = buildUrl(intent, { tn });
        intent = intent.substring(0, intent.length-1);
        
        QRCode.toDataURL(
            intent,
            (err, qr) => {
              if (err) reject(new Error("Unable to generate UPI QR Code."));
              resolve({ qr, intent });
            }
        );
    })
}