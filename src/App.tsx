import { useCallback, useEffect, useRef, useState } from 'react'
import { Content, DIMS, EVENT } from './lib/types'
import { loadContent, saveContent } from './lib/store'
import { byId } from './lib/programme'
import { SessionCard } from './modes/SessionCard'
import { Rail } from './components/Rail'
import { Gate, unlocked } from './components/Gate'
import { cardBlob, downloadBlob } from './lib/export'
import { recordGif } from './lib/gif'

const GIF_FRAMES = 28
const GIF_DELAY = 60
const GIF_HOLD = 2000

export default function App() {
  const [c, setC] = useState<Content>(() => loadContent())
  const [zoom, setZoom] = useState(0.62)
  const [busy, setBusy] = useState('')
  const [toast, setToast] = useState('')
  const [pending, setPending] = useState<{ url: string; name: string; label: string } | null>(null)
  const [open, setOpen] = useState(() => unlocked())
  const cardRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  const set = useCallback((patch: Partial<Content>) => {
    setC((prev) => {
      const next = { ...prev, ...patch }
      saveContent(next)
      return next
    })
  }, [])

  // fit the 1080 card into whatever room the window gives it
  useEffect(() => {
    const fit = () => {
      const el = stageRef.current
      const w = el?.clientWidth ?? 800
      const h = el?.clientHeight ?? 800
      const z = Math.min((w - 24) / DIMS.w, (h - 24) / DIMS.h, 1)
      setZoom(Math.max(0.2, z))
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  // one timeline value drives the preview and the GIF frames
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = ((now - start) % 12000) / 12000
      cardRef.current?.style.setProperty('--t', String(t))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    ;(window as unknown as { __setTimeline?: (t: number) => void }).__setTimeline = (t: number) => {
      cancelAnimationFrame(raf)
      cardRef.current?.style.setProperty('--t', String(t))
    }
    return () => cancelAnimationFrame(raf)
  }, [])

  const filename = useCallback((ext: string) => {
    const s = byId(c.sessionId)
    const slug = s.title
      .toLowerCase()
      .replace(/^(session|deep dive)\s+\d+:\s*/i, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60)
    return `epw2026-${slug}.${ext}`
  }, [c.sessionId])

  /** Capture at the card's real size: undo the preview zoom, then restore it. */
  const withNaturalSize = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    const card = cardRef.current
    const wrap = card?.parentElement as HTMLElement | null
    const holder = wrap?.parentElement as HTMLElement | null
    if (!wrap || !holder) return fn()
    const prev = { transform: wrap.style.transform, w: holder.style.width, h: holder.style.height }
    wrap.style.transform = 'none'
    holder.style.width = `${DIMS.w}px`
    holder.style.height = `${DIMS.h}px`
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 80)))
    try {
      return await fn()
    } finally {
      wrap.style.transform = prev.transform
      holder.style.width = prev.w
      holder.style.height = prev.h
    }
  }, [])

  const onPng = useCallback(async () => {
    if (!cardRef.current) return
    setBusy('Rendering')
    try {
      const blob = await withNaturalSize(() => cardBlob(cardRef.current!, '#002030'))
      downloadBlob(blob, filename('png'))
      setToast(`PNG ${DIMS.w}x${DIMS.h} · ${(blob.size / 1e6).toFixed(1)} MB`)
    } finally {
      setBusy('')
    }
  }, [filename, withNaturalSize])

  const onGif = useCallback(async () => {
    if (!cardRef.current) return
    setBusy('Recording frames 0%')
    try {
      const setT = (window as unknown as { __setTimeline?: (t: number) => void }).__setTimeline
      const res = await withNaturalSize(() => recordGif(
        cardRef.current!,
        (t) => setT?.(t),
        GIF_FRAMES,
        GIF_DELAY,
        '#002030',
        (done, total) => setBusy(`Recording frames ${Math.round((done / total) * 100)}%`),
        GIF_HOLD
      ))
      // Chrome drops a download fired long after the click that started it
      // (transient activation expires), so the encoded GIF becomes a real link
      setPending({
        url: URL.createObjectURL(res.blob),
        name: filename('gif'),
        label: `Save GIF (${(res.blob.size / 1e6).toFixed(1)} MB)`,
      })
      setToast(`GIF ${res.w}x${res.h} · ${res.frames} frames, ready to save`)
    } finally {
      setBusy('')
    }
  }, [filename, withNaturalSize])

  useEffect(() => {
    document.title = `${EVENT.title} · session card`
  }, [])

  if (!open) return <Gate onOpen={() => setOpen(true)} />

  return (
    <div className="app">
      <Rail c={c} set={set} onPng={onPng} onGif={onGif} busy={busy} toast={toast} pending={pending} />
      <main className="stage" ref={stageRef}>
        <div className="stage__inner" style={{ width: DIMS.w * zoom, height: DIMS.h * zoom }}>
          <div className="stage__scale" style={{ transform: `scale(${zoom})` }}>
            <div ref={cardRef}>
              <SessionCard c={c} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
