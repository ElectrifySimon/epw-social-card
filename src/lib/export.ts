import { snapdom } from '@zumer/snapdom'

export async function cardBlob(node: HTMLElement, background: string): Promise<Blob> {
  await document.fonts.ready
  // snapdom measures the rendered box, which carries the preview zoom and the
  // device pixel ratio. Both are corrected here so the file always lands on the
  // card's declared pixel size, whatever the screen and the stage are doing.
  const dpr = window.devicePixelRatio || 1
  const rect = node.getBoundingClientRect()
  const declared = node.offsetWidth || rect.width
  const scale = declared / (Math.max(1, rect.width) * dpr)
  const shot = await snapdom(node, { scale, backgroundColor: background })
  return shot.toBlob({ format: 'png' })
}

export async function copyPng(blob: Blob): Promise<boolean> {
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    return true
  } catch {
    return false
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}
