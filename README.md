Generate NPCI's UPI QR code (BASE64) along with UPI intent link, By using it any payment is possible from UPI enabled apps.

This package will work on client and server.

```js

  import { upiqr } from "upiqr";

  upiqr({
    payeeVPA: "bhar4t@upi",
    payeeName: "Bharat Sahu"
  })
  .then((upi) => {
    console.log(upi.qr);      // data:image/png;base64,eR0lGODP...
    console.log(upi.intent);  // upi://pay?pa=bhar4t@upi&pn=Bharat..
  })
  .catch(err => {
    console.log(err);
  });


```

### Fields detail:

| Fields            | Description                                       | Required  |
|-------------------|---------------------------------------------------|-----------|
| payeeVPA          | VPA address from UPI payment account              | Mandatory |
| payeeName         | Merchant Name registered in UPI payment account   | Mandatory |
| payeeMerchantCode | Merchant Code from UPI payment account            | Optional  |
| transactionId     | Unique transaction id for merchant's reference    | Optional  |
| transactionRef    | Unique transaction id for merchant's reference    | Optional  |
| transactionNote   | Note will appear in payment app while transaction | Optional  |
| amount            | Amount                                            | Optional  |
| minimumAmount     | Minimum amount that has to be transferred         | Optional  |
| currency          | Currency of amount (default: INR)                 | Optional  |
| transactionRefUrl | URL for the order                                 | Optional  |


In table, fields requirement column is based on static QR, For dynamic QR you need to change more fields along with `payeeVPA` and `payeeName`.

For a complete list of supported fields, refer to the [NPCI UPI Linking Specs](https://www.npci.org.in/PDF/npci/upi/circular/2017/Circular18_BankCompliances_to_enbaleUPIMerchantecosystem_0.pdf)

Internally using `qrcode` for QR Generation.
