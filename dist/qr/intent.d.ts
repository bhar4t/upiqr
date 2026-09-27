import { UPIIntentParams } from '../types/upiqr.js';
/** Validates UPI intent params and builds the `upi://pay?...` deep link. */
export declare function buildUPIIntent({ payeeVPA: pa, payeeName: pn, payeeMerchantCode: mc, transactionId: tid, transactionRef: tr, transactionNote: tn, amount: am, minimumAmount: mam, currency: cu, }: UPIIntentParams): string;
