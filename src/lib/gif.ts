import { GIFEncoder, applyPalette, quantize } from 'gifenc'
import { cardBlob } from './export'

/**
 * Yields long enough for React to commit and the DOM to settle.
 * rAF is throttled to zero in a hidden tab, so it must never be the only
 * signal: the timer resolves the wait regardless of tab visibility.
 */
function nextPaint(): Promise<void> {
  return new Promise((resolve) => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      resolve()
    }
    requestAnimationFrame(finish)
    setTimeout(finish, 40)
  })
}

export type GifResult = { blob: Blob; frames: number; w: number; h: number }

/**
 * Rasterises the card at N points on the timeline and encodes a looping GIF.
 * `setT` drives the same progress value the preview animation uses, so the
 * recording is deterministic rather than a screen capture.
 */
export async function recordGif(
  node: HTMLElement,
  setT: (t: number) => void,
  frames: number,
  delayMs: number,
  background: string,
  onProgress?: (done: number, total: number) => void,
  holdMs = 2000
): Promise<GifResult> {
  const gif = GIFEncoder()
  let w = 0
  let h = 0
  for (let i = 0; i < frames; i++) {
    setT(frames === 1 ? 1 : i / (frames - 1))
    await nextPaint()
    const blob = await cardBlob(node, background)
    const bmp = await createImageBitmap(blob)
    w = bmp.width
    h = bmp.height
    const cv = document.createElement('canvas')
    cv.width = w
    cv.height = h
    const ctx = cv.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('canvas unavailable')
    ctx.drawImage(bmp, 0, 0)
    const { data } = ctx.getImageData(0, 0, w, h)
    const palette = quantize(data, 96)
    const index = applyPalette(data, palette)
    gif.writeFrame(index, w, h, { palette, delay: delayMs })
    onProgress?.(i + 1, frames)
    bmp.close()
  }
  setT(1)
  // one held frame with a long delay: same rest for the eye, a fraction of the bytes
  if (holdMs > 0) {
    await nextPaint()
    const blob = await cardBlob(node, background)
    const bmp = await createImageBitmap(blob)
    w = bmp.width
    h = bmp.height
    const cv = document.createElement('canvas')
    cv.width = w
    cv.height = h
    const ctx = cv.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('canvas unavailable')
    ctx.drawImage(bmp, 0, 0)
    const { data } = ctx.getImageData(0, 0, w, h)
    const palette = quantize(data, 96)
    const index = applyPalette(data, palette)
    gif.writeFrame(index, w, h, { palette, delay: holdMs })
    bmp.close()
  }
  gif.finish()
  const bytes = gif.bytes()
  return { blob: new Blob([bytes as unknown as BlobPart], { type: 'image/gif' }), frames: frames + (holdMs > 0 ? 1 : 0), w, h }
}
