import { useLayoutEffect, useRef } from 'react'
import { Content, DEFAULT_LABEL, EVENT } from '../lib/types'
import { byId, cohostLine, dayLabel, isWeek, programme } from '../lib/programme'
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
  1: [54, 46, 40, 33],
  2: [74, 64, 55, 45],
  3: [64, 54, 46, 36],
  4: [88, 74, 62, 49],
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
  const week = isWeek(s)
  const name = c.name.trim()
  const label = c.label.trim() || DEFAULT_LABEL
  // the artwork already prints the event name, so the week card leads with the
  // attendee instead of repeating it
  const title = week ? label : s.title.replace(/^(Session|Deep Dive)\s+\d+:\s*/i, '')
  const mark = week ? '' : badge(s)
  // the artwork already prints the dates and the city, so the week card says
  // something the poster cannot: how much programme there is
  const when = week
    ? `${programme.days.length} days · ${programme.counts?.sessions ?? 0} sessions`
    : `${dayLabel(s)} · ${s.time}`
  const host = week ? '' : cohostLine(s)
  const bodyRef = useRef<HTMLDivElement>(null)

  /**
   * A long co-host line can push the block into the partner banner. Rather than
   * guess per session, measure the block and step the title down until it fits.
   */
  useLayoutEffect(() => {
    const body = bodyRef.current
    const card = body?.closest('.card') as HTMLElement | null
    const heading = body?.querySelector<HTMLElement>('.title')
    if (!body || !card || !heading) return

    const limit = parseFloat(getComputedStyle(card).getPropertyValue('--bmax')) || 1080
    // measure real content, not the decorative wash that hangs outside the block
    // layout offsets, not client rects: the intro animation translates the
    // block, and a rect read mid-flight reports the wrong bottom
    const contentBottom = () => {
      const kids = Array.from(body.children) as HTMLElement[]
      const last = kids[kids.length - 1]
      let y = 0
      let node: HTMLElement | null = last
      while (node && node !== card) {
        y += node.offsetTop
        node = node.offsetParent as HTMLElement | null
      }
      return y + last.offsetHeight
    }

    const fit = () => {
      body.style.paddingTop = '0px'
      // the week card has no co-host line, so it can carry a bigger title
      const start = week ? Math.round(SCALE[c.bg][0] * 1.15) : Math.max(titleSize(c.bg, title), SCALE[c.bg][0])
      let size = start
      heading.style.fontSize = `${size}px`
      let guard = 0
      while (contentBottom() > limit && size > 26 && guard < 40) {
        size -= 1
        heading.style.fontSize = `${size}px`
        guard += 1
      }

      // the week card has no co-host line, so the block would float at the top.
      // Push it down to sit just above the partner banner instead.
      if (week) {
        const slack = limit - contentBottom() - 56
        body.style.paddingTop = `${Math.max(0, Math.round(slack))}px`
      }
    }

    fit()
    // web fonts land after the first layout, and they change the metrics this
    // block is fitted against, so fit again once they are in
    let alive = true
    document.fonts?.ready.then(() => {
      if (alive) fit()
    })
    return () => {
      alive = false
    }
  }, [c.sessionId, c.bg, title, week])

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
          <span>{when}</span>
        </p>
        <h1
          className={week ? 'title title--week' : 'title'}
          style={{ fontSize: week ? undefined : titleSize(c.bg, title) }}
        >
          {title}
        </h1>
        {host ? <p className="host">{host}</p> : null}
        {week && name ? <p className="host host--name">{name}</p> : null}
      </div>

      {name && !week ? (
        <div className="attend">
          <p className="attend__label">{label}</p>
          <p className="attend__name">{name}</p>
        </div>
      ) : null}
    </article>
  )
}
