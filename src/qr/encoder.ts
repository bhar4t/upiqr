/**
 * Dependency-free QR Code encoder (byte mode, versions 1-10, ECC levels L/M/Q/H).
 * Ported from a from-scratch reference implementation and fixed/hardened for production use.
 *
 * Known scope limits (by design, matching the original reference implementation):
 * - Only byte mode (UTF-8) is supported, no numeric/alphanumeric/kanji optimization.
 * - Only versions 1-10 are supported (max ~213 data bytes at ECC M), which comfortably
 *   covers UPI intent URLs but will reject unusually large payloads.
 */

export type ECCLevel = 'L' | 'M' | 'Q' | 'H'

export interface QRMatrixResult {
    /** Square matrix of 0/1 values. No cell is left unresolved. */
    matrix: number[][]
    version: number
}

/** Thrown internally when a payload does not fit in the given version/ECC combination. */
class CapacityExceededError extends Error {}

type RSBlockGroup = readonly [count: number, total: number, data: number]

// Reed-Solomon block layout per version/ECC level (ISO/IEC 18004 Annex tables, versions 1-10).
const RS_BLOCKS: Readonly<Record<number, Readonly<Record<ECCLevel, readonly RSBlockGroup[]>>>> = {
    1: { L: [[1, 26, 19]], M: [[1, 26, 16]], Q: [[1, 26, 13]], H: [[1, 26, 9]] },
    2: { L: [[1, 44, 34]], M: [[1, 44, 28]], Q: [[1, 44, 22]], H: [[1, 44, 16]] },
    3: { L: [[1, 70, 55]], M: [[1, 70, 44]], Q: [[2, 35, 17]], H: [[2, 35, 13]] },
    4: { L: [[1, 100, 80]], M: [[2, 50, 32]], Q: [[2, 50, 24]], H: [[4, 25, 9]] },
    5: { L: [[1, 134, 108]], M: [[2, 67, 43]], Q: [[2, 33, 15], [2, 34, 16]], H: [[2, 33, 11], [2, 34, 12]] },
    6: { L: [[2, 86, 68]], M: [[4, 43, 27]], Q: [[4, 43, 19]], H: [[4, 43, 15]] },
    7: { L: [[2, 98, 78]], M: [[4, 49, 31]], Q: [[2, 32, 14], [4, 33, 15]], H: [[4, 39, 13], [1, 40, 14]] },
    8: { L: [[2, 121, 97]], M: [[2, 60, 38], [2, 61, 39]], Q: [[4, 40, 18], [2, 41, 19]], H: [[4, 40, 14], [2, 41, 15]] },
    9: { L: [[2, 146, 116]], M: [[3, 58, 36], [2, 59, 37]], Q: [[4, 36, 16], [4, 37, 17]], H: [[4, 36, 12], [4, 37, 13]] },
    10: { L: [[2, 86, 68], [2, 87, 69]], M: [[4, 69, 43], [1, 70, 44]], Q: [[6, 43, 19], [2, 44, 20]], H: [[6, 43, 15], [2, 44, 16]] },
}

// Alignment pattern center coordinates per version (versions 1-10).
const ALIGN: Readonly<Record<number, readonly number[]>> = {
    1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
    6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50],
}

// ECC indicator bits used in the 15-bit format info (ISO/IEC 18004 Table 25).
const ECC_FORMAT: Readonly<Record<ECCLevel, number>> = { L: 1, M: 0, Q: 3, H: 2 }

// The 8 standard QR mask patterns (ISO/IEC 18004 Table 20).
const MASKS: ReadonlyArray<(row: number, col: number) => boolean> = [
    (r, c) => (r + c) % 2 === 0,
    (r, _c) => r % 2 === 0,
    (_r, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => ((r * c) % 2 + (r * c) % 3) === 0,
    (r, c) => ((r * c) % 2 + (r * c) % 3) % 2 === 0,
    (r, c) => ((r * c) % 3 + (r + c) % 2) % 2 === 0,
]

function normalizeErrorCorrectionLevel(level?: string): ECCLevel {
    if (!level) return 'M'
    const map: Record<string, ECCLevel> = {
        low: 'L', medium: 'M', quartile: 'Q', high: 'H',
        l: 'L', m: 'M', q: 'Q', h: 'H',
    }
    const normalized = map[level.toLowerCase()]
    if (!normalized) {
        throw new Error(`Invalid errorCorrectionLevel "${level}". Expected one of: L, M, Q, H, low, medium, quartile, high.`)
    }
    return normalized
}

// GF(256) arithmetic (irreducible polynomial x^8+x^4+x^3+x^2+1 = 0x11d), as used by QR's Reed-Solomon codes.
function gfMul(x: number, y: number): number {
    let a = x
    let b = y
    let z = 0
    while (b) {
        if (b & 1) z ^= a
        a <<= 1
        if (a & 0x100) a ^= 0x11d
        b >>>= 1
    }
    return z
}

const EXP = new Uint8Array(512)
const LOG = new Uint16Array(256);
(() => {
    let x = 1
    for (let i = 0; i < 255; i++) {
        EXP[i] = x
        LOG[x] = i
        x <<= 1
        if (x & 0x100) x ^= 0x11d
    }
    for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]!
})()

function rsGenerator(degree: number): number[] {
    let g: number[] = [1]
    for (let i = 0; i < degree; i++) {
        const next: number[] = new Array(g.length + 1).fill(0)
        const a = EXP[i]!
        for (let j = 0; j < g.length; j++) {
            next[j]! ^= g[j]!
            next[j + 1]! ^= gfMul(g[j]!, a)
        }
        g = next
    }
    return g
}

const GEN_CACHE = new Map<number, number[]>()

function reedSolomon(data: readonly number[], degree: number): number[] {
    let gen = GEN_CACHE.get(degree)
    if (!gen) {
        gen = rsGenerator(degree)
        GEN_CACHE.set(degree, gen)
    }
    const ecc: number[] = new Array(degree).fill(0)
    for (const b of data) {
        const f = b ^ ecc[0]!
        for (let i = 0; i < degree - 1; i++) {
            ecc[i] = ecc[i + 1]! ^ gfMul(gen[i + 1]!, f)
        }
        ecc[degree - 1] = gfMul(gen[degree]!, f)
    }
    return ecc
}

interface RSBlock {
    total: number
    data: number
    ec: number
}

function rsBlocks(version: number, ecc: ECCLevel): RSBlock[] {
    const groups = RS_BLOCKS[version]![ecc]
    const out: RSBlock[] = []
    for (const [count, total, data] of groups) {
        for (let i = 0; i < count; i++) out.push({ total, data, ec: total - data })
    }
    return out
}

function bitAppend(bits: number[], value: number, len: number): void {
    for (let i = len - 1; i >= 0; i--) bits.push((value >>> i) & 1)
}

function makeDataBytes(text: string, version: number, ecc: ECCLevel): number[] {
    const bytes = [...new TextEncoder().encode(text)]
    const blocks = rsBlocks(version, ecc)
    const capacity = blocks.reduce((n, b) => n + b.data, 0)
    const countBits = version < 10 ? 8 : 16

    const bits: number[] = []
    bitAppend(bits, 0b0100, 4) // byte mode indicator
    bitAppend(bits, bytes.length, countBits)
    for (const b of bytes) bitAppend(bits, b, 8)

    if (bits.length > capacity * 8) {
        throw new CapacityExceededError(`Text is too long for version ${version} / ECC ${ecc}`)
    }

    for (let i = 0; i < 4 && bits.length < capacity * 8; i++) bits.push(0)
    while (bits.length % 8) bits.push(0)

    let pad = 0
    while (bits.length < capacity * 8) {
        bitAppend(bits, pad++ % 2 ? 0x11 : 0xec, 8)
    }

    const data: number[] = []
    for (let i = 0; i < bits.length; i += 8) {
        let v = 0
        for (let j = 0; j < 8; j++) v = (v << 1) | bits[i + j]!
        data.push(v)
    }

    const dataBlocks: number[][] = []
    const eccBlocks: number[][] = []
    let pos = 0
    for (const block of blocks) {
        const d = data.slice(pos, pos + block.data)
        pos += block.data
        dataBlocks.push(d)
        eccBlocks.push(reedSolomon(d, block.ec))
    }

    const interleaved: number[] = []
    const maxD = Math.max(...blocks.map(b => b.data))
    const maxE = Math.max(...blocks.map(b => b.ec))

    for (let i = 0; i < maxD; i++) for (const d of dataBlocks) if (i < d.length) interleaved.push(d[i]!)
    for (let i = 0; i < maxE; i++) for (const e of eccBlocks) if (i < e.length) interleaved.push(e[i]!)

    return interleaved
}

function bitLen(x: number): number {
    let n = 0
    let v = x
    while (v) {
        n++
        v >>>= 1
    }
    return n
}

function bchFormat(data: number): number {
    let d = data << 10
    const g = 0x537
    while (bitLen(d) - bitLen(g) >= 0) d ^= g << (bitLen(d) - bitLen(g))
    return ((data << 10) | d) ^ 0x5412
}

function bchVersion(data: number): number {
    let d = data << 12
    const g = 0x1f25
    while (bitLen(d) - bitLen(g) >= 0) d ^= g << (bitLen(d) - bitLen(g))
    return (data << 12) | d
}

function getCell(m: number[][], r: number, c: number): number {
    return m[r]![c]!
}

function setCell(m: number[][], r: number, c: number, v: number): void {
    m[r]![c] = v
}

function matrixBase(version: number): number[][] {
    const n = version * 4 + 17
    const m: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(-1))

    function finder(r0: number, c0: number): void {
        for (let dr = -1; dr <= 7; dr++) {
            for (let dc = -1; dc <= 7; dc++) {
                const r = r0 + dr
                const c = c0 + dc
                if (r < 0 || r >= n || c < 0 || c >= n) continue
                const dark = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6 &&
                    (dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4))
                setCell(m, r, c, dark ? 1 : 0)
            }
        }
    }

    finder(0, 0)
    finder(n - 7, 0)
    finder(0, n - 7)

    for (let i = 8; i < n - 8; i++) {
        if (getCell(m, 6, i) === -1) setCell(m, 6, i, i % 2 === 0 ? 1 : 0)
        if (getCell(m, i, 6) === -1) setCell(m, i, 6, i % 2 === 0 ? 1 : 0)
    }

    if (version >= 2) {
        const positions = ALIGN[version]!
        const first = positions[0]!
        const last = positions[positions.length - 1]!
        for (const r of positions) {
            for (const c of positions) {
                // Skip the 3 corner combinations that overlap a finder pattern; every other
                // combination must be drawn unconditionally (it legitimately overrides the
                // timing pattern where the two intersect, e.g. (6, 22) for version 7).
                const overlapsFinder = (r === first && c === first) || (r === first && c === last) || (r === last && c === first)
                if (overlapsFinder) continue
                for (let dr = -2; dr <= 2; dr++) {
                    for (let dc = -2; dc <= 2; dc++) {
                        const dark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1
                        setCell(m, r + dr, c + dc, dark ? 1 : 0)
                    }
                }
            }
        }
    }

    // Reserve format information cells (filled in later by drawFormat).
    for (let i = 0; i < 15; i++) {
        const fr = i < 6 ? i : i < 8 ? i + 1 : n - 15 + i
        const fc = i < 8 ? n - i - 1 : i < 9 ? 15 - i : 14 - i
        setCell(m, fr, 8, 0)
        setCell(m, 8, fc, 0)
    }

    setCell(m, n - 8, 8, 1) // fixed dark module

    if (version >= 7) {
        for (let i = 0; i < 18; i++) {
            const r = Math.floor(i / 3)
            const c = (i % 3) + n - 11
            setCell(m, r, c, 0)
            setCell(m, c, r, 0)
        }
    }

    return m
}

function drawFormat(m: number[][], version: number, ecc: ECCLevel, mask: number): void {
    const n = m.length
    const bits = bchFormat((ECC_FORMAT[ecc] << 3) | mask)

    for (let i = 0; i < 15; i++) {
        const bit = (bits >>> i) & 1
        const r = i < 6 ? i : i < 8 ? i + 1 : n - 15 + i
        setCell(m, r, 8, bit)
        const c = i < 8 ? n - i - 1 : i < 9 ? 15 - i : 14 - i
        setCell(m, 8, c, bit)
    }

    setCell(m, n - 8, 8, 1)

    if (version >= 7) {
        const vb = bchVersion(version)
        for (let i = 0; i < 18; i++) {
            const bit = (vb >>> i) & 1
            const r = Math.floor(i / 3)
            const c = (i % 3) + n - 11
            setCell(m, r, c, bit)
            setCell(m, c, r, bit)
        }
    }
}

function makeMatrix(version: number, ecc: ECCLevel, data: readonly number[], mask: number): number[][] {
    const m = matrixBase(version)
    const n = m.length
    drawFormat(m, version, ecc, mask)

    const maskFn = MASKS[mask]!
    let bi = 0
    let upward = true

    for (let right = n - 1; right >= 1; right -= 2) {
        if (right === 6) right--

        for (let k = 0; k < n; k++) {
            const r = upward ? n - 1 - k : k
            for (let j = 0; j < 2; j++) {
                const c = right - j
                if (getCell(m, r, c) !== -1) continue

                let bit = 0
                if (bi < data.length * 8) {
                    const b = data[bi >>> 3]!
                    bit = (b >>> (7 - (bi & 7))) & 1
                    bi++
                }

                if (maskFn(r, c)) bit ^= 1
                setCell(m, r, c, bit)
            }
        }
        upward = !upward
    }

    return m
}

function penalty(m: number[][]): number {
    const n = m.length
    let dark = 0
    for (const row of m) for (const v of row) dark += v
    let p = 0

    for (let r = 0; r < n; r++) {
        let run = 1
        for (let c = 1; c < n; c++) {
            if (getCell(m, r, c) === getCell(m, r, c - 1)) run++
            else {
                if (run >= 5) p += 3 + run - 5
                run = 1
            }
        }
        if (run >= 5) p += 3 + run - 5
    }

    for (let c = 0; c < n; c++) {
        let run = 1
        for (let r = 1; r < n; r++) {
            if (getCell(m, r, c) === getCell(m, r - 1, c)) run++
            else {
                if (run >= 5) p += 3 + run - 5
                run = 1
            }
        }
        if (run >= 5) p += 3 + run - 5
    }

    for (let r = 0; r < n - 1; r++) {
        for (let c = 0; c < n - 1; c++) {
            const x = getCell(m, r, c)
            if (x === getCell(m, r, c + 1) && x === getCell(m, r + 1, c) && x === getCell(m, r + 1, c + 1)) p += 3
        }
    }

    const pattern = [1, 0, 1, 1, 1, 0, 1]
    function matchLine(arr: number[]): void {
        for (let i = 0; i <= arr.length - 7; i++) {
            let ok = true
            for (let j = 0; j < 7; j++) {
                if (arr[i + j] !== pattern[j]) { ok = false; break }
            }
            if (ok) p += 40
        }
    }
    for (let r = 0; r < n; r++) matchLine([...m[r]!])
    for (let c = 0; c < n; c++) matchLine(Array.from({ length: n }, (_, r) => getCell(m, r, c)))

    p += Math.floor(Math.abs((100 * dark) / (n * n) - 50) / 5) * 10
    return p
}

function chooseMask(version: number, ecc: ECCLevel, data: readonly number[]): number[][] {
    let best: { m: number[][], score: number } | null = null
    for (let mask = 0; mask < 8; mask++) {
        const m = makeMatrix(version, ecc, data, mask)
        const score = penalty(m)
        if (!best || score < best.score) best = { m, score }
    }
    return best!.m
}

/** Encodes `text` (byte/UTF-8 mode) into the smallest fitting QR matrix (versions 1-10). */
export function encodeQRMatrix(text: string, ecc: ECCLevel): QRMatrixResult {
    for (let version = 1; version <= 10; version++) {
        try {
            const data = makeDataBytes(text, version, ecc)
            return { matrix: chooseMask(version, ecc, data), version }
        } catch (e) {
            if (!(e instanceof CapacityExceededError)) throw e
        }
    }
    throw new Error('Input is too long to encode. This implementation supports QR versions 1-10 (byte mode); reduce the payload length or lower the error correction level.')
}

export { normalizeErrorCorrectionLevel }
