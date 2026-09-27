export interface RGBA {
    r: number
    g: number
    b: number
    a: number
}

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

/** Parses a `#rgb`, `#rgba`, `#rrggbb` or `#rrggbbaa` hex color string into RGBA components. */
export function parseHexColor(input: string): RGBA {
    const match = HEX_COLOR_RE.exec(input)
    if (!match) {
        throw new Error(`Invalid color "${input}". Expected hex format like #000000 or #000000ff.`)
    }

    let hex = match[1]!
    if (hex.length === 3 || hex.length === 4) {
        hex = hex.split('').map(ch => ch + ch).join('')
    }
    if (hex.length === 6) hex += 'ff'

    const int = parseInt(hex, 16)
    return {
        r: (int >>> 24) & 0xff,
        g: (int >>> 16) & 0xff,
        b: (int >>> 8) & 0xff,
        a: int & 0xff,
    }
}
