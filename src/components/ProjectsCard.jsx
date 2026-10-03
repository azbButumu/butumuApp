import { useMemo, useState } from 'react'
import Modal from './Modal'
import { addItem, updateItem, removeItem } from '../../shared/firebaseData'
import { memberLabel, sortMembers } from '../../shared/members'
import { isProjectMember, memberCount, projectMemberIds, sortProjects } from '../../shared/projects'

function ProjectsCard({ projects, members, uid }) {
  const [editing, setEditing] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')

  const list = useMemo(() => sortProjects(projects), [projects])
  const sortedMembers = useMemo(() => sortMembers(members), [members])
  // editing はモーダルを開いた時点の値なので、購読で届く最新に追従させる
  const current = editing ? projects.find((p) => p.id === editing.id) || editing : null

  function createProject() {
    const name = newName.trim()
    if (!name) return
    addItem('projects', {
      name,
      createdBy: uid,
      createdAt: Date.now(),
      members: { [uid]: true },
    })
    setNewName('')
    setAddOpen(false)
  }

  function toggleMember(projectId, memberId, join) {
    updateItem('projects', projectId, { [`members/${memberId}`]: join ? true : null })
  }

  function deleteProject(project) {
    if (!window.confirm(`制作「${project.name}」を削除しますか?`)) return
    removeItem('projects', project.id)
    setEditing(null)
  }

  return (
    <div className="card">
      <div className="row-between">
        <h2>制作グループ</h2>
        <button type="button" className="card-link" onClick={() => setAddOpen(true)}>
          + 追加
        </button>
      </div>

      {list.length === 0 ? (
        <div className="empty-state">制作はまだありません</div>
      ) : (
        list.map((p) => (
          <button
            type="button"
            key={p.id}
            className="project-row"
            onClick={() => setEditing(p)}
          >
            <span className="project-name">{p.name}</span>
            {isProjectMember(p, uid) && <span className="project-badge">参加中</span>}
            <span className="project-count">{memberCount(p)}人</span>
          </button>
        ))
      )}

      {addOpen && (
        <Modal
          title="制作を追加"
          onClose={() => setAddOpen(false)}
          footer={
            <>
              <button type="button" className="btn" onClick={() => setAddOpen(false)}>
                キャンセル
              </button>
              <button type="button" className="btn btn-primary btn-block" onClick={createProject}>
                作成
              </button>
            </>
          }
        >
          <div className="field">
            <label>制作名 *</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="例: ライントレーサー"
              autoFocus
            />
          </div>
          <p className="modal-sub">作成した人は自動で参加メンバーになります。</p>
        </Modal>
      )}

      {current && (
        <Modal
          title={current.name}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button type="button" className="btn btn-danger" onClick={() => deleteProject(current)}>
                削除
              </button>
              <button type="button" className="btn btn-block" onClick={() => setEditing(null)}>
                閉じる
              </button>
            </>
          }
        >
          <div className="field">
            <label>制作名</label>
            <input
              value={current.name}
              onChange={(e) => updateItem('projects', current.id, { name: e.target.value })}
            />
          </div>

          <div className="field">
            <label>メンバー({projectMemberIds(current).length}人)</label>
            <p className="modal-sub">名前をタップすると参加・解除が切り替わります。</p>
            <div className="member-list">
              {sortedMembers.map((m) => {
                const joined = isProjectMember(current, m.id)
                return (
                  <button
                    type="button"
                    key={m.id}
                    className={`member-pick ${joined ? 'joined' : ''}`}
                    onClick={() => toggleMember(current.id, m.id, !joined)}
                  >
                    <span className="member-grade">{m.grade || '—'}</span>
                    <span className="member-name">{memberLabel(m)}</span>
                    <span className="member-state">{joined ? '参加中' : '追加'}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default ProjectsCard
