import { RGBAImage } from './pixels.js';
import { Base64, ImageType } from '../types/upiqr.js';
/** Renders an RGBA pixel buffer to a PNG data URL using the browser's native Canvas API. */
export declare function encodeCanvasPNG(image: RGBAImage): Base64<ImageType>;
