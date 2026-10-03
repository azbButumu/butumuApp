export function toDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayStr() {
  return toDateStr(new Date())
}

export function addDays(dateStr, delta) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d + delta)
  return toDateStr(dt)
}

const WEEKDAYS_JA = ['日', '月', '火', '水', '木', '金', '土']

export function weekdayJa(index) {
  return WEEKDAYS_JA[index]
}

export function formatDateJa(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return `${m}月${d}日(${WEEKDAYS_JA[dt.getDay()]})`
}

export function diffDays(fromStr, toStr) {
  const [y1, m1, d1] = fromStr.split('-').map(Number)
  const [y2, m2, d2] = toStr.split('-').map(Number)
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000)
}

export function weekdayJaOf(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return WEEKDAYS_JA[new Date(y, m - 1, d).getDay()]
}
