import { UpiqrRenderOptions } from '../types/upiqr.js';
import { RenderOptions } from './pixels.js';
/** Resolves user-supplied renderer options against defaults matching the previous `qrcode` package behavior. */
export declare function resolveRenderOptions(moduleCount: number, options?: UpiqrRenderOptions): RenderOptions;
