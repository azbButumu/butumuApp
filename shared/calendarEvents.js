import { TAG_COLORS } from './tags'
import { addDays, diffDays, todayStr } from './date'
import { isProjectMember } from './projects'

// 終了日なしの「毎週」はこの範囲まで展開する
const OPEN_ENDED_DAYS = 365 * 3
const MAX_OCCURRENCES = 200
const MAX_SPAN_DAYS = 365

// その予定が始まる日(毎週なら各回の初日)を列挙する
export function occurrenceStarts(ev, horizonEnd) {
  if (ev.repeat !== 'weekly') return [ev.date]
  const until = ev.repeatUntil && ev.repeatUntil < horizonEnd ? ev.repeatUntil : horizonEnd
  const out = []
  let cursor = ev.date
  while (cursor <= until && out.length < MAX_OCCURRENCES) {
    out.push(cursor)
    cursor = addDays(cursor, 7)
  }
  // 最終日が開始日より前でも、予定そのものが消えないように初回は残す
  return out.length > 0 ? out : [ev.date]
}

// 「この回だけ中止」された回かどうか(除外日は各回の初日で記録する)
export function isOccurrenceSkipped(ev, start) {
  return Boolean(ev.skipDates && ev.skipDates[start])
}

// 制作限定の予定(projectId あり)は、その制作に所属している人にだけ見せる。
// 制作が削除された・自分が抜けた場合も見えなくなる
export function isEventVisibleTo(ev, projectsById, uid) {
  if (!ev.projectId) return true
  return isProjectMember(projectsById[ev.projectId], uid)
}

export function visibleEvents(events, projects, uid) {
  const projectsById = {}
  projects.forEach((p) => {
    projectsById[p.id] = p
  })
  return events.filter((ev) => isEventVisibleTo(ev, projectsById, uid))
}

export function expandEventsByDate(events, baseDate = todayStr()) {
  const map = {}
  const horizonEnd = addDays(baseDate, OPEN_ENDED_DAYS)
  events.forEach((ev) => {
    if (!ev.date) return
    const color = TAG_COLORS[ev.tag] || TAG_COLORS['その他']
    // 1回あたりの長さ(終了日が入っていれば複数日)
    const span = Math.min(Math.max(diffDays(ev.date, ev.endDate || ev.date), 0), MAX_SPAN_DAYS)
    occurrenceStarts(ev, horizonEnd).forEach((start) => {
      const skipped = isOccurrenceSkipped(ev, start)
      for (let i = 0; i <= span; i++) {
        const date = addDays(start, i)
        if (!map[date]) map[date] = []
        map[date].push({ color, event: ev, start, skipped })
      }
    })
  })
  return map
}
