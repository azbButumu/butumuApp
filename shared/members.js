// 部員のプロフィール(本名・学年)まわり

export const GRADES = ['M1', 'M2', 'M3', 'H1', 'H2']

const GRADE_ORDER = Object.fromEntries(GRADES.map((g, i) => [g, i]))

export function isValidGrade(grade) {
  return GRADES.includes(grade)
}

// 本名と学年が入っているか。未入力なら入力画面に誘導する
export function isProfileComplete(member) {
  return Boolean(member && String(member.name || '').trim() && isValidGrade(member.grade))
}

export function memberLabel(member) {
  if (!member) return '不明'
  const name = String(member.name || '').trim()
  return name || member.email || '名前未設定'
}

// 学年順(M1→H2)、同学年は名前順
export function sortMembers(list) {
  return [...list].sort((a, b) => {
    const ga = GRADE_ORDER[a.grade] ?? 99
    const gb = GRADE_ORDER[b.grade] ?? 99
    if (ga !== gb) return ga - gb
    return memberLabel(a).localeCompare(memberLabel(b), 'ja')
  })
}

export function membersById(list) {
  const map = {}
  list.forEach((m) => {
    map[m.id] = m
  })
  return map
}
