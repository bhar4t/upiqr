import { parseHexColor } from './color.js';
/** Resolves user-supplied renderer options against defaults matching the previous `qrcode` package behavior. */
export function resolveRenderOptions(moduleCount, options) {
    var _a, _b;
    var _c, _d, _e, _f;
    const margin = (_c = options === null || options === void 0 ? void 0 : options.margin) !== null && _c !== void 0 ? _c : 4;
    if (margin < 0)
        throw new Error('margin must be a non-negative number.');
    const dark = parseHexColor((_d = (_a = options === null || options === void 0 ? void 0 : options.color) === null || _a === void 0 ? void 0 : _a.dark) !== null && _d !== void 0 ? _d : '#000000ff');
    const light = parseHexColor((_e = (_b = options === null || options === void 0 ? void 0 : options.color) === null || _b === void 0 ? void 0 : _b.light) !== null && _e !== void 0 ? _e : '#ffffffff');
    let scale = (_f = options === null || options === void 0 ? void 0 : options.scale) !== null && _f !== void 0 ? _f : 4;
    if (scale <= 0)
        throw new Error('scale must be a positive number.');
    if (options === null || options === void 0 ? void 0 : options.width) {
        const totalModules = moduleCount + margin * 2;
        const computed = Math.floor(options.width / totalModules);
        if (computed > 0)
            scale = computed;
    }
    return { scale, margin, dark, light };
}
