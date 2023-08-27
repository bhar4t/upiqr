import { UPIIntentParams, UPIIntentResult } from "./types/upiqr";
export default function upiqr({ payeeVPA: pa, payeeName: pn, payeeMerchantCode: me, transactionId: tid, transactionRef: tr, transactionNote: tn, amount: am, minimumAmount: mam, currency: cu, }: UPIIntentParams): Promise<UPIIntentResult>;
