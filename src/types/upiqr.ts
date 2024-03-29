type ImageType = 'png' | 'jpeg'
export type Base64<imageType extends ImageType> = `data:image/${imageType};base64${string}`

export interface UPIIntentParams {
    payeeVPA: string;
    payeeName: string;
    payeeMerchantCode?: string;
    transactionId?: string;
    transactionRef?: string;
    transactionNote?: string;
    amount?: string;
    minimumAmount?: string;
    currency?: string;
    transactionRefUrl?: string; // Not in use, as of now
}

export interface QRResult {
    qr: string;
    intent: string;
}