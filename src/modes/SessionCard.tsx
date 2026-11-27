import { useLayoutEffect, useRef } from 'react'
import { Content, EVENT } from '../lib/types'
import { byId, cohostLine, dayFor, dayLabel } from '../lib/programme'
import bg1 from '../assets/bg/bg-1.jpg'
import bg2 from '../assets/bg/bg-2.jpg'
import bg3 from '../assets/bg/bg-3.jpg'
import bg4 from '../assets/bg/bg-4.jpg'
import qrSrc from '../assets/qr-epw.png'

const BG: Record<number, string> = { 1: bg1, 2: bg2, 3: bg3, 4: bg4 }

/**
 * Each artwork leaves a different amount of room, so the title scale is set per
 * background. Four steps: short title first, longest last.
 */
const SCALE: Record<number, [number, number, number, number]> = {
  1: [46, 42, 38, 33],
  2: [64, 58, 52, 45],
  3: [46, 42, 38, 33],
  4: [72, 64, 57, 49],
}

function titleSize(bg: number, title: string): number {
  const s = SCALE[bg] ?? SCALE[1]
  if (title.length > 110) return s[3]
  if (title.length > 84) return s[2]
  if (title.length > 60) return s[1]
  return s[0]
}

function badge(item: { number: number | null; title: string }): string {
  if (!item.number) return ''
  return /deep dive/i.test(item.title) ? `DEEP DIVE ${item.number}` : `SESSION ${item.number}`
}

export function SessionCard({ c }: { c: Content }) {
  const s = byId(c.sessionId)
  const day = dayFor(s)
  const title = s.title.replace(/^(Session|Deep Dive)\s+\d+:\s*/i, '')
  const mark = badge(s)
  const host = cohostLine(s)
  const name = c.name.trim()
  const bodyRef = useRef<HTMLDivElement>(null)

  /**
   * A long co-host line can push the block into the partner banner. Rather than
   * guess per session, measure the block and step the title down until it fits.
   */
  useLayoutEffect(() => {
    const body = bodyRef.current
    const heading = body?.querySelector<HTMLElement>('.title')
    if (!body || !heading) return
    let size = titleSize(c.bg, title)
    heading.style.fontSize = `${size}px`
    let guard = 0
    while (body.scrollHeight > body.clientHeight && size > 26 && guard < 24) {
      size -= 1
      heading.style.fontSize = `${size}px`
      guard += 1
    }
  }, [c.sessionId, c.bg, c.showDayTheme, title])

  return (
    <article
      className="card"
      data-bg={c.bg}
      data-named={name ? 'on' : 'off'}
    >
      <div className="bg" style={{ backgroundImage: `url(${BG[c.bg]})` }} aria-hidden />

      <div className="qr">
        <img src={qrSrc} alt="" />
        <span>{EVENT.qrLabel}</span>
      </div>

      <div className="body" ref={bodyRef}>
        <p className="kicker">
          {mark ? <em>{mark}</em> : null}
          {mark ? <i className="dot" /> : null}
          <span>{dayLabel(s)}</span>
        </p>
        {c.showDayTheme && day.theme ? <p className="theme">{day.theme}</p> : null}
        <h1 className="title" style={{ fontSize: titleSize(c.bg, title) }}>
          {title}
        </h1>
        <p className="time">{s.time}</p>
        {host ? <p className="host">{host}</p> : null}
      </div>

      {name ? (
        <div className="attend">
          <p className="attend__label">I'm attending</p>
          <p className="attend__name">{name}</p>
        </div>
      ) : null}
    </article>
  )
}
