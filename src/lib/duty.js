import { addDays, diffDays } from './date'

export function normalizeRotation(raw) {
  const members = Array.isArray(raw?.members)
    ? raw.members.map((m) => String(m).trim()).filter(Boolean)
    : []
  return { members, startDate: raw?.startDate || '' }
}

export function overridesByDate(list) {
  const map = {}
  list.forEach((o) => {
    // ドキュメントIDが日付(YYYY-MM-DD)
    if (o.person) map[o.date || o.id] = o
  })
  return map
}

// 一周にかかる日数は部員数そのもの(14人なら二週間)
export function cycleLabel(members) {
  const n = members.length
  if (n === 0) return ''
  return n % 7 === 0 ? `一周 ${n}日(${n / 7}週間)` : `一周 ${n}日`
}

// 責任者は日替わりで、部員リストの順に1人ずつ交代する
export function assignmentFor(dateStr, rotation) {
  const { members, startDate } = rotation
  if (members.length === 0 || !startDate) return null
  const offset = diffDays(startDate, dateStr)
  const turn = ((offset % members.length) + members.length) % members.length
  return { person: members[turn], turn }
}

// 当日変更を反映した、その日の実際の責任者
export function resolveDuty(dateStr, rotation, overrides) {
  const assigned = assignmentFor(dateStr, rotation)
  const scheduled = assigned ? assigned.person : ''
  const turn = assigned ? assigned.turn : -1
  const override = overrides[dateStr]
  if (override?.person) {
    return {
      date: dateStr,
      person: override.person,
      scheduled,
      note: override.note || '',
      isOverride: true,
      turn,
    }
  }
  return { date: dateStr, person: scheduled, scheduled, note: '', isOverride: false, turn }
}

// 指定日から連続する count 日分
export function dutiesFrom(dateStr, rotation, overrides, count) {
  if (rotation.members.length === 0 || !rotation.startDate) return []
  const out = []
  for (let i = 0; i < count; i++) {
    out.push(resolveDuty(addDays(dateStr, i), rotation, overrides))
  }
  return out
}
