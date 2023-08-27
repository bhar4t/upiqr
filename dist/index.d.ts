declare const QRCode: any;
type ImageType = 'png' | 'jpeg';
type Base64<imageType extends ImageType> = `data:image/${imageType};base64${string}`;
interface UPIIntentParams {
    payeeVPA?: string;
    payeeName?: string;
    payeeMerchantCode?: string;
    transactionId?: string;
    transactionRef?: string;
    transactionNote?: string;
    amount?: string;
    minimumAmount?: string;
    currency?: string;
    transactionRefUrl?: string;
}
interface UPIIntentResult {
    qr: string;
    intent: string;
    error: string;
}
declare function validateParams({ pa, pn }: {
    pa: string | undefined;
    pn: string | undefined;
}): string;
declare function buildUrl(this: string, params: object): string;
declare function upiqr({ payeeVPA: pa, payeeName: pn, payeeMerchantCode: me, transactionId: tid, transactionRef: tr, transactionNote: tn, amount: am, minimumAmount: mam, currency: cu, transactionRefUrl: url, }: UPIIntentParams): Promise<UPIIntentResult | Error>;
