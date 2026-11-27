import { Content, BGS, BgId, EVENT } from '../lib/types'
import { SessionPicker } from './SessionPicker'

type Props = {
  c: Content
  set: (patch: Partial<Content>) => void
  onPng: () => void
  onGif: () => void
  busy: string
  toast: string
  pending: { url: string; name: string; label: string } | null
}

export function Rail({ c, set, onPng, onGif, busy, toast, pending }: Props) {
  return (
    <aside className="rail">
      <header className="rail__head">
        <p className="brand">EPW cards</p>
        <p className="rail__sub">
          {EVENT.dates} · {EVENT.venue}
        </p>
      </header>

      <section className="field">
        <label className="field__label" htmlFor="session-search">
          Session
        </label>
        <SessionPicker value={c.sessionId} onPick={(id) => set({ sessionId: id })} />
      </section>

      <section className="field">
        <p className="field__label">Background</p>
        <div className="swatches">
          {BGS.map((b) => (
            <button
              key={b.id}
              type="button"
              className={`swatch${c.bg === b.id ? ' is-on' : ''}`}
              onClick={() => set({ bg: b.id as BgId })}
              title={b.note}
              aria-pressed={c.bg === b.id}
            >
              <span className={`swatch__thumb thumb-${b.id}`} />
              <span className="swatch__label">{b.label.replace('Background ', '')}</span>
            </button>
          ))}
        </div>
        <label className="check">
          <input type="checkbox" checked={c.motion} onChange={(e) => set({ motion: e.target.checked })} />
          <span>Slow drift on the artwork</span>
        </label>
      </section>

      <section className="field">
        <label className="field__label" htmlFor="name">
          Your name (optional)
        </label>
        <input
          id="name"
          type="text"
          value={c.name}
          placeholder="Leave empty for a clean card"
          onChange={(e) => set({ name: e.target.value })}
        />
        <label className="check">
          <input
            type="checkbox"
            checked={c.showDayTheme}
            onChange={(e) => set({ showDayTheme: e.target.checked })}
          />
          <span>Show the day theme</span>
        </label>
      </section>

      <section className="field field--actions">
        <button type="button" className="btn btn--primary" onClick={onPng} disabled={!!busy}>
          Download PNG
        </button>
        <button type="button" className="btn" onClick={onGif} disabled={!!busy}>
          Animated GIF
        </button>
        {pending ? (
          <a className="btn btn--save" href={pending.url} download={pending.name}>
            {pending.label}
          </a>
        ) : null}
        {busy ? <p className="hint">{busy}</p> : null}
        {toast ? <p className="toast">{toast}</p> : null}
      </section>

      <footer className="rail__foot">
        <p>
          A card for one session. The QR opens {EVENT.qrLabel}.
        </p>
      </footer>
    </aside>
  )
}
