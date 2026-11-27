import { useMemo, useState } from 'react'
import { Item, programme, search, dayLabel } from '../lib/programme'

type Props = {
  value: string
  onPick: (id: string) => void
}

export function SessionPicker({ value, onPick }: Props) {
  const [q, setQ] = useState('')
  const list = useMemo(() => search(q), [q])

  return (
    <div className="picker">
      <input
        className="search"
        type="search"
        placeholder="Search sessions, speakers, days"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search the programme"
      />
      <div className="picker__list" role="listbox" aria-label="Programme">
        {list.some((i) => i.kind === 'week') ? (
          <div className="picker__day">
            <p className="picker__dayhead">All four days</p>
            {list.filter((i) => i.kind === 'week').map((i) => (
              <button
                key={i.id}
                type="button"
                role="option"
                aria-selected={i.id === value}
                className={`picker__item${i.id === value ? ' is-on' : ''}`}
                onClick={() => onPick(i.id)}
              >
                <span className="picker__time">{i.time}</span>
                <span className="picker__title">{clean(i)}</span>
              </button>
            ))}
          </div>
        ) : null}
        {programme.days.map((day) => {
          const items = list.filter((i) => i.day === day.day)
          if (!items.length) return null
          return (
            <div key={day.day} className="picker__day">
              <p className="picker__dayhead">
                Day {day.day} <span>{day.theme}</span>
              </p>
              {items.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  role="option"
                  aria-selected={i.id === value}
                  className={`picker__item${i.id === value ? ' is-on' : ''}`}
                  onClick={() => onPick(i.id)}
                >
                  <span className="picker__time">{i.time}</span>
                  <span className="picker__title">{clean(i)}</span>
                </button>
              ))}
            </div>
          )
        })}
        {!list.length ? <p className="picker__empty">Nothing matches that.</p> : null}
      </div>
      <p className="picker__count">
        {list.filter((i) => i.kind !== 'week').length} of {programme.counts?.sessions ?? '?'} sessions
      </p>
    </div>
  )
}

function clean(i: Item): string {
  return i.title.replace(/^(Session|Deep Dive)\s+\d+:\s*/i, '')
}

export { dayLabel }
