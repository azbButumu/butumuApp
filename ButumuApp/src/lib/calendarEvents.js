import { TAG_COLORS } from './tags'
import { addDays } from './date'

export function expandEventsByDate(events) {
  const map = {}
  events.forEach((ev) => {
    const start = ev.date
    const end = ev.endDate || ev.date
    let cursor = start
    let guard = 0
    while (cursor <= end && guard < 366) {
      if (!map[cursor]) map[cursor] = []
      map[cursor].push({ color: TAG_COLORS[ev.tag] || TAG_COLORS['その他'], event: ev })
      cursor = addDays(cursor, 1)
      guard++
    }
  })
  return map
}
