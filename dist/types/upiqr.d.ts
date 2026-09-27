
export type ImageType='png';export type Base64<imageType extends ImageType>=`data:image/${imageType};base64,${string}`;export type ErrorCorrectionLevel='low'|'medium'|'quartile'|'high'|'L'|'M'|'Q'|'H';export interface UpiqrColorOptions{dark?:string;light?:string;}
export interface UpiqrRenderOptions{errorCorrectionLevel?:ErrorCorrectionLevel;margin?:number;scale?:number;width?:number;color?:UpiqrColorOptions;}
export interface UPIIntentParams{payeeVPA:string;payeeName:string;payeeMerchantCode?:string;transactionId?:string;transactionRef?:string;transactionNote?:string;amount?:string;minimumAmount?:string;currency?:string;transactionRefUrl?:string;}
export interface QRResult{qr:Base64<ImageType>;intent:string;}