[![npm package][npm-img]][npm-url]
[![Build Status][build-img]][build-url]
[![Downloads][downloads-img]][downloads-url]
[![Issues][issues-img]][issues-url]
[![Commitizen Friendly][commitizen-img]][commitizen-url]
[![Semantic Release][semantic-release-img]][semantic-release-url]

Generate NPCI's UPI QR code (BASE64) along with UPI intent link, By using it any payment is possible from UPI enabled apps.

## Supports

<div id="header" align="center">
  <img src="https://raw.githubusercontent.com/bhar4t/bhar4t/master/public/img/upis.png" width="300"/>
</div>

<br/>

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

<!--- [![Code Coverage][codecov-img]][codecov-url] --->

[build-img]:https://github.com/bhar4t/upiqr/actions/workflows/main.yml/badge.svg
[build-url]:https://github.com/bhar4t/upiqr/actions/workflows/main.yml
[downloads-img]:https://img.shields.io/npm/dt/upiqr
[downloads-url]:https://www.npmtrends.com/upiqr
[npm-img]:https://img.shields.io/npm/v/upiqr
[npm-url]:https://www.npmjs.com/package/upiqr
[issues-img]:https://img.shields.io/github/issues/bhar4t/upiqr
[issues-url]:https://github.com/bhar4t/upiqr/issues
[codecov-img]:https://codecov.io/gh/bhar4t/upiqr/branch/main/graph/badge.svg
[codecov-url]:https://codecov.io/gh/bhar4t/upiqr
[semantic-release-img]:https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-release-url]:https://github.com/semantic-release/semantic-release
[commitizen-img]:https://img.shields.io/badge/commitizen-friendly-brightgreen.svg
[commitizen-url]:http://commitizen.github.io/cz-cli/
