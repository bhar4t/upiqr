import { RGBA } from './color.js';
export interface RenderOptions {
    scale: number;
    margin: number;
    dark: RGBA;
    light: RGBA;
}
export interface RGBAImage {
    width: number;
    height: number;
    /** Row-major RGBA pixel data, 4 bytes per pixel. */
    data: Uint8ClampedArray<ArrayBuffer>;
}
/** Rasterizes a QR module matrix into an RGBA pixel buffer, applying scale/margin/colors. */
export declare function renderModulesToRGBA(matrix: readonly (readonly number[])[], options: RenderOptions): RGBAImage;
