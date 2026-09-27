export interface RGBA {
    r: number;
    g: number;
    b: number;
    a: number;
}
/** Parses a `#rgb`, `#rgba`, `#rrggbb` or `#rrggbbaa` hex color string into RGBA components. */
export declare function parseHexColor(input: string): RGBA;
