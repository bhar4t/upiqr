/**
 * Supported image types for the QR code.
 */
export type ImageType = 'png' | 'jpeg' | 'webp';
/**
 * Base64 encoded image string.
 * @template imageType - The type of the image.
 */
export type Base64<imageType extends ImageType> = `data:image/${imageType};base64,${string}`;
/**
 * Parameters for generating UPI intent.
 */
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
    transactionRefUrl?: string;
}
/**
 * Result of the UPI QR code generation.
 */
export interface QRResult {
    qr: Base64<ImageType>;
    intent: string;
}
