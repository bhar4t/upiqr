import { test } from 'node:test'
import assert from 'node:assert/strict'
import { RGBAImage } from '../qr/pixels'

interface FakeCanvasContext {
    putImageData(imageData: unknown, x: number, y: number): void
}

test('encodeCanvasPNG: wires width/height/pixel data into the Canvas API and returns its data URL', async () => {
    const putImageDataCalls: unknown[] = []
    const fakeContext: FakeCanvasContext = {
        putImageData(imageData, x, y) {
            putImageDataCalls.push({ imageData, x, y })
        },
    }
    const fakeCanvas = {
        width: 0,
        height: 0,
        getContext: () => fakeContext,
        toDataURL: (type: string) => `data:${type};base64,FAKE`,
    }

    ;(globalThis as unknown as { document: unknown }).document = {
        createElement: (tag: string) => {
            assert.equal(tag, 'canvas')
            return fakeCanvas
        },
    }
    ;(globalThis as unknown as { ImageData: unknown }).ImageData = class {
        constructor(public data: Uint8ClampedArray, public width: number, public height: number) {}
    }

    try {
        const { encodeCanvasPNG } = await import('../qr/canvas')
        const image: RGBAImage = {
            width: 21,
            height: 21,
            data: new Uint8ClampedArray(21 * 21 * 4),
        }

        const result = encodeCanvasPNG(image)

        assert.equal(result, 'data:image/png;base64,FAKE')
        assert.equal(fakeCanvas.width, 21)
        assert.equal(fakeCanvas.height, 21)
        assert.equal(putImageDataCalls.length, 1)
    } finally {
        delete (globalThis as { document?: unknown }).document
        delete (globalThis as { ImageData?: unknown }).ImageData
    }
})
