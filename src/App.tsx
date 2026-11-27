import { useCallback, useEffect, useRef, useState } from 'react'
import { Content, DIMS, EVENT } from './lib/types'
import { loadContent, saveContent } from './lib/store'
import { byId } from './lib/programme'
import { SessionCard } from './modes/SessionCard'
import { Rail } from './components/Rail'
import { Gate, unlocked } from './components/Gate'
import { cardBlob, downloadBlob } from './lib/export'


export default function App() {
  const [c, setC] = useState<Content>(() => loadContent())
  const [zoom, setZoom] = useState(0.62)
  const [busy, setBusy] = useState('')
  const [toast, setToast] = useState('')
  const [open, setOpen] = useState(() => unlocked())
  const cardRef = useRef<HTMLDivElement>(null)
  // a second card, never scaled, parked off screen: the export and the GIF
  // always read 1080 by 1080 whatever the preview zoom is doing
  const exportRef = useRef<HTMLDivElement>(null)
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

  const onPng = useCallback(async () => {
    if (!cardRef.current) return
    setBusy('Rendering')
    try {
      const blob = await cardBlob(exportRef.current!, '#002030')
      downloadBlob(blob, filename('png'))
      setToast(`PNG ${DIMS.w}x${DIMS.h} · ${(blob.size / 1e6).toFixed(1)} MB`)
    } finally {
      setBusy('')
    }
  }, [filename])

  useEffect(() => {
    document.title = `${EVENT.title} · session card`
  }, [])

  if (!open) return <Gate onOpen={() => setOpen(true)} />

  return (
    <div className="app">
      <Rail c={c} set={set} onPng={onPng} busy={busy} toast={toast} />
      <main className="stage" ref={stageRef}>
        <div className="stage__inner" style={{ width: DIMS.w * zoom, height: DIMS.h * zoom }}>
          <div className="stage__scale" style={{ transform: `scale(${zoom})` }}>
            <div ref={cardRef}>
              <SessionCard c={c} />
            </div>
          </div>
        </div>
      </main>

      <div className="export-node" ref={exportRef} aria-hidden>
        <SessionCard c={c} />
      </div>
    </div>
  )
}
