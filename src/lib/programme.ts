import raw from '../data/programme.json'
import { EVENT } from './types'

export type Item = {
  day: number
  time: string
  title: string
  cohost: string
  speakers: string[]
  kind: string
  number: number | null
  id: string
}

export type Day = { day: number; heading: string; theme: string; items: Item[] }

export type Programme = {
  event: { title: string; dates: string; venue: string; url: string }
  days: Day[]
  fingerprint?: string
  counts?: { sessions: number; rows: number }
}

export const programme = raw as unknown as Programme

export const sessions: Item[] = programme.days.flatMap((d) => d.items.filter((i) => i.kind === 'session'))

/**
 * The card for someone attending the week rather than one session. It is not in
 * the scraped programme, so it is built here and offered above Day 1.
 */
export const WEEK_ID = 'whole-week'

export const weekItem: Item = {
  day: 0,
  time: EVENT.dates,
  title: EVENT.title,
  cohost: '',
  speakers: [],
  kind: 'week',
  number: null,
  id: WEEK_ID,
}

export function isWeek(item: Item): boolean {
  return item.kind === 'week'
}

export function dayFor(item: Item): Day {
  return programme.days.find((d) => d.day === item.day) ?? programme.days[0]
}

export function byId(id: string): Item {
  if (id === WEEK_ID) return weekItem
  return sessions.find((s) => s.id === id) ?? sessions[0]
}

/** Day 1 is 1 December 2026, so the weekday comes from a real date, not a table. */
export function dayLabel(item: Item): string {
  const d = new Date(2026, 11, item.day)
  const weekday = d.toLocaleDateString('en-GB', { weekday: 'long' })
  return `Day ${item.day}, ${weekday} ${item.day} December`
}

export function shortDay(item: Item): string {
  return `DAY ${item.day}`
}

/** Partner line, kept separate from the title so the card can weight them. */
export function cohostLine(item: Item): string {
  return item.cohost ? `Co-hosted with ${item.cohost}` : ''
}

/** First three names plus a count, which is what fits at card size. */
export function speakerLine(item: Item, limit = 3): string {
  if (!item.speakers.length) return ''
  const head = item.speakers.slice(0, limit).join(', ')
  const rest = item.speakers.length - limit
  return rest > 0 ? `${head} and ${rest} more` : head
}

export function search(query: string): Item[] {
  const q = query.trim().toLowerCase()
  const weekHit = ['whole week', 'the whole week', 'all week', 'attending', weekItem.title, weekItem.time]
    .join(' ')
    .toLowerCase()
    .includes(q)
  if (!q) return [weekItem, ...sessions]
  const hits = sessions.filter((s) =>
    [s.title, s.cohost, s.speakers.join(' '), `day ${s.day}`, s.time].join(' ').toLowerCase().includes(q)
  )
  return weekHit ? [weekItem, ...hits] : hits
}
