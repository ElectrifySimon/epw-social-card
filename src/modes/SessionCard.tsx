import { Content, EVENT } from '../lib/types'
import { byId, cohostLine, dayFor, dayLabel, speakerLine } from '../lib/programme'
import bg1 from '../assets/bg/bg-1.jpg'
import bg2 from '../assets/bg/bg-2.jpg'
import bg3 from '../assets/bg/bg-3.jpg'
import bg4 from '../assets/bg/bg-4.jpg'
import qrSrc from '../assets/qr-epw.png'

const BG: Record<number, string> = { 1: bg1, 2: bg2, 3: bg3, 4: bg4 }

/** Title size steps down with length so a long session still fits three lines. */
function titleSize(title: string): number {
  if (title.length > 110) return 34
  if (title.length > 84) return 38
  if (title.length > 60) return 42
  return 48
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
  const people = speakerLine(s)

  return (
    <article className="card" data-bg={c.bg} data-motion={c.motion ? 'on' : 'off'}>
      <div className="bg" style={{ backgroundImage: `url(${BG[c.bg]})` }} aria-hidden />
      <div className="qr">
        <img src={qrSrc} alt="" />
        <span>{EVENT.qrLabel}</span>
      </div>

      <div className="body">
        <p className="kicker">
          {mark ? <em>{mark}</em> : null}
          {mark ? <i className="dot" /> : null}
          <span>{dayLabel(s)}</span>
        </p>
        {c.showDayTheme && day.theme ? <p className="theme">{day.theme}</p> : null}
        <h1 className="title" style={{ fontSize: titleSize(title) }}>
          {title}
        </h1>
        <div className="meta">
          <p className="time">{s.time}</p>
          {host ? <p className="host">{host}</p> : null}
          {people ? <p className="people">{people}</p> : null}
        </div>
        {c.name.trim() ? <p className="attendee">Attending · {c.name.trim()}</p> : null}
      </div>
    </article>
  )
}
