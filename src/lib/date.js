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
