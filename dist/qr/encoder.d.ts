/**
 * Dependency-free QR Code encoder (byte mode, versions 1-10, ECC levels L/M/Q/H).
 * Ported from a from-scratch reference implementation and fixed/hardened for production use.
 *
 * Known scope limits (by design, matching the original reference implementation):
 * - Only byte mode (UTF-8) is supported, no numeric/alphanumeric/kanji optimization.
 * - Only versions 1-10 are supported (max ~213 data bytes at ECC M), which comfortably
 *   covers UPI intent URLs but will reject unusually large payloads.
 */
export type ECCLevel = 'L' | 'M' | 'Q' | 'H';
export interface QRMatrixResult {
    /** Square matrix of 0/1 values. No cell is left unresolved. */
    matrix: number[][];
    version: number;
}
declare function normalizeErrorCorrectionLevel(level?: string): ECCLevel;
/** Encodes `text` (byte/UTF-8 mode) into the smallest fitting QR matrix (versions 1-10). */
export declare function encodeQRMatrix(text: string, ecc: ECCLevel): QRMatrixResult;
export { normalizeErrorCorrectionLevel };
