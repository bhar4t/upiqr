/**
 * Supported image types for the QR code. Only PNG is produced by the built-in encoder.
 */
export type ImageType = 'png'

/**
 * Base64 encoded image string.
 * @template imageType - The type of the image.
 */
export type Base64<imageType extends ImageType> = `data:image/${imageType};base64,${string}`

/**
 * Error correction level, matching the ISO/IEC 18004 naming used by the previous `qrcode` dependency.
 */
export type ErrorCorrectionLevel = 'low' | 'medium' | 'quartile' | 'high' | 'L' | 'M' | 'Q' | 'H'

/**
 * Dark/light module colors, in `#rgb`, `#rgba`, `#rrggbb` or `#rrggbbaa` hex format.
 */
export interface UpiqrColorOptions {
    dark?: string;
    light?: string;
}

/**
 * Options for customizing the generated QR code image.
 */
export interface UpiqrRenderOptions {
    /** @default 'M' */
    errorCorrectionLevel?: ErrorCorrectionLevel;
    /** Quiet zone width, in modules. @default 4 */
    margin?: number;
    /** Pixels per module. @default 4 */
    scale?: number;
    /** Forces an output width in pixels; takes precedence over `scale`. */
    width?: number;
    color?: UpiqrColorOptions;
}

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
    transactionRefUrl?: string; // Not in use, as of now
}

/**
 * Result of the UPI QR code generation.
 */
export interface QRResult {
    qr: Base64<ImageType>;
    intent: string;
}