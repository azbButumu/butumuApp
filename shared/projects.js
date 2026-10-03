// 制作グループ。members は { uid: true } の連想配列で持つので、
// 追加・削除を projects/<id>/members/<uid> のピンポイント更新にでき、
// 複数人が同時に編集しても互いの変更を消さない。

export function projectMemberIds(project) {
  return Object.keys(project?.members || {}).filter((uid) => project.members[uid])
}

export function isProjectMember(project, uid) {
  return Boolean(uid && project?.members?.[uid])
}

export function memberCount(project) {
  return projectMemberIds(project).length
}

// 自分が所属している制作だけを名前順で返す
export function projectsOfUser(projects, uid) {
  return projects
    .filter((p) => isProjectMember(p, uid))
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'ja'))
}

export function sortProjects(projects) {
  return [...projects].sort((a, b) =>
    String(a.name || '').localeCompare(String(b.name || ''), 'ja'),
  )
}
