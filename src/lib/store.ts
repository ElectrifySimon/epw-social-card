import { Content, DEFAULT_LABEL } from './types'
import { sessions } from './programme'

const KEY = 'epw-card:v1'

export function starterContent(): Content {
  return {
    sessionId: (sessions.find((s) => s.number === 1) ?? sessions[0])?.id ?? '',
    bg: 1,
    name: '',
    label: DEFAULT_LABEL,
    showDayTheme: true,
  }
}

export function loadContent(): Content {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return starterContent()
    return { ...starterContent(), ...(JSON.parse(raw) as Partial<Content>) }
  } catch {
    return starterContent()
  }
}

export function saveContent(c: Content) {
  try {
    localStorage.setItem(KEY, JSON.stringify(c))
  } catch {
    /* a full quota is not worth interrupting the card */
  }
}
