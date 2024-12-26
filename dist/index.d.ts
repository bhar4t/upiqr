import QRCode from 'qrcode';
import { QRResult, UPIIntentParams } from './types/upiqr';
/**
 * Generates a UPI QR code and intent URL.
 * @param {UPIIntentParams} params - The UPI intent parameters.
 * @param {QRCode.QRCodeToDataURLOptions} [qrOptions] - Optional QR code generation options.
 * @returns {Promise<QRResult>} - A promise that resolves to the QR code and intent URL.
 */
export default function upiqr({ payeeVPA: pa, payeeName: pn, payeeMerchantCode: mc, transactionId: tid, transactionRef: tr, transactionNote: tn, amount: am, minimumAmount: mam, currency: cu, }: UPIIntentParams, qrOptions?: QRCode.QRCodeToDataURLOptions): Promise<QRResult>;
