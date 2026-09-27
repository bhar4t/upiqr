import { RGBAImage } from './pixels.js';
/** Encodes an RGBA pixel buffer as a PNG (truecolor + alpha), using only Node's built-in zlib. */
export declare function encodePNG(image: RGBAImage): Buffer;
