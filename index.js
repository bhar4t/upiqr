const QRCode = require("qrcode");

class UPI {
    constructor() {
        if (this.upi) return this.upi;
        this.upi = this;
    }
    generateQR = ({ vpa, pn }) => new Promise((resolve, reject) => {
        
        if (!vpa || !pn) reject(new Error("Please provide valid Virtual Payee's Address/Payee's Name."));
        if ((vpa && vpa.length < 5) || (pn && pn.length < 4))    reject(new Error("Virtual Payee's Address/Payee's Name is too short."));
        
        const intent = `upi://pay?pa=${vpa}&pn=${pn}`;
        
        QRCode.toDataURL(
            intent,
            (err, qr) => {
              if (err) reject(new Error("Unable to generate UPI QR Code."));
              resolve({ qr, intent });
            });
    })
}

module.exports = new UPI();


// with payment optional
// am=696&mode=01

// without payment
// mode=01


// bhim
// cu=INR&mode=02&purpose=00