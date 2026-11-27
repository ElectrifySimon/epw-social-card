export const EVENT = {
  title: 'Energy Planning Week 2026',
  dates: '1-4 December 2026',
  venue: 'GIZ Campus Forum, Bonn',
  url: 'https://energyplanningweek.info/',
  qrLabel: 'energyplanningweek.info',
} as const

export type BgId = 1 | 2 | 3 | 4

export type Content = {
  sessionId: string
  bg: BgId
  name: string
  /** Badge line above the name. Editable, defaults to "I'm attending". */
  label: string
  showDayTheme: boolean
}

export const BGS: { id: BgId; label: string; note: string }[] = [
  { id: 1, label: 'Background 1', note: 'Title top left, partner banner in the lower third' },
  { id: 2, label: 'Background 2', note: 'Title only, open ground below' },
  { id: 3, label: 'Background 3', note: 'Title top left, partner banner on the bottom edge' },
  { id: 4, label: 'Background 4', note: 'Line artwork only, no type' },
]

export const DEFAULT_LABEL = "I'm attending"

export const DIMS = { w: 1080, h: 1080 } as const
