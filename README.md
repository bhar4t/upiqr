Generate NPCI's UPI QR code (BASE64) along with UPI intent link, By using it any payment is possible from UPI enabled apps.

This package will work on client and server.

```js

  const upiqr =  require('upiqr');

  upiqr
  .generate({
    payeeVPA: 'john@upi',
    payeeName: "JOHN DOE"
  })
  .then((upi) => {
    console.log(upi.qr);      // data:image/png;base64,eR0lGODP...
    console.log(upi.intent);  // upi://pay?pa=john@upi&pn=JOHN DOE
  })
  .catch(err => {
    console.log(err);
  });


```

### Fields detail:

| Fields              | Description                                                | Default  | Required  |
|---------------------|------------------------------------------------------------|----------|-----------|
| payeeVPA            | VPA address from UPI payment account                       |          | Mandatory | pa
| payeeName           | Merchant Name registered in UPI payment account            |          | Mandatory | pn
| payeeMerchantCode   | Merchant Code from UPI payment account                     |          | Optional  | me
| transactionId       | Unique transaction id for merchant's reference             |          | Optional  | tid
| transactionRef      | Unique transaction id for merchant's reference             |          | Optional  | tr
| transactionNote     | Note that will displayed in payment app during transaction |          | Optional  | tn
| amount              | Amount                                                     |          | Optional  | am
| minimumAmount       | Minimum amount that has to be transferred                  |          | Optional  | mam
| currency            | Currency of amount                                         | INR      | Optional  | cu
| transactionRefUrl   | URL for the order                                          |          | Optional  | url


In table, fields requirement column is based on static QR, For dynamic QR you need to change more fields along with `payeeVPA` and `payeeName`.

For a complete list of supported fields, refer to the [NPCI UPI Linking Specs](https://www.npci.org.in/PDF/npci/upi/circular/2017/Circular18_BankCompliances_to_enbaleUPIMerchantecosystem_0.pdf)

Internally using `qrcode` for QR Generation.