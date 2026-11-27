import { useState } from 'react'
import { EVENT } from '../lib/types'

const CODE = 'epw'
const KEY = 'epw-card:pass'

export function unlocked(): boolean {
  try {
    return sessionStorage.getItem(KEY) === CODE
  } catch {
    return false
  }
}

export function Gate({ onOpen }: { onOpen: () => void }) {
  const [value, setValue] = useState('')
  const [wrong, setWrong] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim().toLowerCase() === CODE) {
      try {
        sessionStorage.setItem(KEY, CODE)
      } catch {
        /* private mode still lets the card render for this visit */
      }
      onOpen()
      return
    }
    setWrong(true)
  }

  return (
    <main className="gate">
      <form className="gate__card" onSubmit={submit}>
        <p className="gate__kicker">Session cards</p>
        <h1 className="gate__title">{EVENT.title}</h1>
        <p className="gate__sub">
          {EVENT.dates} · {EVENT.venue}
        </p>
        <label className="gate__label" htmlFor="pass">
          Passcode
        </label>
        <input
          id="pass"
          type="password"
          autoFocus
          autoComplete="off"
          value={value}
          aria-invalid={wrong}
          onChange={(e) => {
            setValue(e.target.value)
            setWrong(false)
          }}
        />
        {wrong ? <p className="gate__err">Wrong passcode. Ask the organisers for it.</p> : null}
        <button className="btn btn--primary" type="submit">
          Open the card builder
        </button>
        <p className="gate__foot">
          Make a card for the session you are attending. Nothing is uploaded anywhere.
        </p>
      </form>
    </main>
  )
}
