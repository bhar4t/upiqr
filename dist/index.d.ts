import QRCode from 'qrcode';
import { QRResult, UPIIntentParams } from './types/upiqr';
export default function upiqr({ payeeVPA: pa, payeeName: pn, payeeMerchantCode: mc, transactionId: tid, transactionRef: tr, transactionNote: tn, amount: am, minimumAmount: mam, currency: cu, }: UPIIntentParams, qrOptions?: QRCode.QRCodeToDataURLOptions): Promise<QRResult>;
