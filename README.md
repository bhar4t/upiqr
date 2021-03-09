Generate NPCI's UPI QR code (BASE64) along with UPI intent link, , By using it any payment is possible from UPI enabled apps.

This package will work on client and server.

```js
const QR =  require('upiqr');


UPI
.generateQR({ vpa: 'name@bank', pn: "John Doe" })
.then((upi) => {
    console.log(upi.qr);        // Base64 URL
    console.log(upi.intent);    // eg: upi://pay?pa=john@bank&pn=JOHN DOE
})
.catch(err => {
    console.log(err);
});

```

Internally using `qrcode` for QR Generation.