import QRCode from'qrcode';function validateParams({pa,pn}){if(!pa||!pn)
return"Virtual payee's address/name is compulsory";if(pa.length<5||pn.length<4)
return"Virtual payee's address/name is too short.";return'';}
function buildUrl(params){let qs="";for(let[key,value]of Object.entries(params)){if(value)
qs+=encodeURIComponent(key)+"="+encodeURIComponent(value)+"&";}
return"upi://pay?"+qs.slice(0,-1);}
export default function upiqr({payeeVPA:pa,payeeName:pn,payeeMerchantCode:mc,transactionId:tid,transactionRef:tr,transactionNote:tn,amount:am,minimumAmount:mam,currency:cu,},qrOptions){return new Promise((resolve,reject)=>{const params={pa,pn,am,mam,cu,mc,tid,tr,tn};let error=validateParams(params);if(error)
return reject(new Error(error));const intent=buildUrl(params);QRCode.toDataURL(intent,qrOptions).then((base64Data)=>resolve({qr:base64Data,intent})).catch(err=>reject(new Error("Unable to generate UPI QR Code.\n"+err)));});}