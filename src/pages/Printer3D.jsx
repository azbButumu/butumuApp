import { useEffect, useMemo, useState } from 'react'
import Modal from '../components/Modal'
import {
  subscribeList,
  subscribeValue,
  addItem,
  updateItem,
  removeItem,
} from '../../shared/firebaseData'
import { getAuthInstance } from '../../shared/auth'
import { memberLabel } from '../../shared/members'
import { projectsOfUser } from '../../shared/projects'
import { todayStr, addDays, formatDateJa } from '../../shared/date'
import './Printer3D.css'

const START_HOUR = 8
const END_HOUR = 24 // exclusive end of day

function buildSlots() {
  const slots = []
  for (let h = START_HOUR; h < END_HOUR; h++) {
    for (const m of [0, 30]) {
      const start = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      const endMinutesTotal = h * 60 + m + 30
      const end = `${String(Math.floor(endMinutesTotal / 60)).padStart(2, '0')}:${String(endMinutesTotal % 60).padStart(2, '0')}`
      slots.push({ start, end })
    }
  }
  return slots
}

const SLOTS = buildSlots()

function Printer3D() {
  const [date, setDate] = useState(todayStr())
  const [reservations, setReservations] = useState([])
  const [selection, setSelection] = useState(null) // {start, end} slot indices
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [person, setPerson] = useState('')
  const [note, setNote] = useState('')
  const [projectId, setProjectId] = useState('')
  const [projects, setProjects] = useState([])
  const [me, setMe] = useState(null)

  const uid = getAuthInstance().currentUser?.uid

  useEffect(() => {
    const unsubs = [
      subscribeList('printerReservations', setReservations),
      subscribeList('projects', setProjects),
    ]
    return () => unsubs.forEach((u) => u())
  }, [])

  useEffect(() => {
    if (!uid) return
    return subscribeValue(`members/${uid}`, setMe)
  }, [uid])

  // 予約できるのは自分が所属している制作だけ
  const myProjects = useMemo(() => projectsOfUser(projects, uid), [projects, uid])

  const dayReservations = useMemo(
    () => reservations.filter((r) => r.date === date).sort((a, b) => a.start.localeCompare(b.start)),
    [reservations, date],
  )

  const slotOwner = useMemo(() => {
    const map = {}
    dayReservations.forEach((r) => {
      SLOTS.forEach((s, idx) => {
        if (s.start >= r.start && s.start < r.end) map[idx] = r
      })
    })
    return map
  }, [dayReservations])

  function resetSelection() {
    setSelection(null)
  }

  function handleSlotClick(idx) {
    const existing = slotOwner[idx]
    if (existing) {
      setEditing(existing)
      setPerson(existing.person || '')
      setNote(existing.note || '')
      setProjectId(existing.projectId || '')
      setFormOpen(true)
      return
    }
    if (!selection) {
      setSelection({ start: idx, end: idx })
      return
    }
    // 既存の選択範囲とタップしたコマを両方含む範囲に「延長」する(縮めない)
    const lo = Math.min(selection.start, idx)
    const hi = Math.max(selection.end, idx)
    let blocked = false
    for (let i = lo; i <= hi; i++) {
      if (slotOwner[i]) blocked = true
    }
    if (blocked) {
      // 既存予約をまたぐ場合は、タップしたコマから選び直す
      setSelection({ start: idx, end: idx })
    } else {
      setSelection({ start: lo, end: hi })
    }
  }

  function openNewReservationForm() {
    setEditing(null)
    setPerson(memberLabel(me) === '不明' ? '' : memberLabel(me))
    setNote('')
    setProjectId('')
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
  }

  function submitForm() {
    if (!person.trim()) return
    const project = myProjects.find((p) => p.id === projectId)
    if (editing) {
      updateItem('printerReservations', editing.id, {
        person: person.trim(),
        note: note.trim(),
        projectId: projectId || '',
        projectName: project ? project.name : '',
      })
    } else if (selection) {
      addItem('printerReservations', {
        date,
        start: SLOTS[selection.start].start,
        end: SLOTS[selection.end].end,
        person: person.trim(),
        note: note.trim(),
        projectId: projectId || '',
        projectName: project ? project.name : '',
        createdAt: Date.now(),
        createdBy: uid || '',
      })
      resetSelection()
    }
    closeForm()
  }

  function deleteReservation() {
    if (editing) removeItem('printerReservations', editing.id)
    closeForm()
  }

  const selectionLabel = selection
    ? `${SLOTS[selection.start].start} 〜 ${SLOTS[selection.end].end}`
    : ''

  return (
    <div className="printer-page">
      <div className="date-nav">
        <button type="button" className="btn" onClick={() => { setDate((d) => addDays(d, -1)); resetSelection() }}>
          ◀
        </button>
        <button type="button" className="btn date-nav-label" onClick={() => { setDate(todayStr()); resetSelection() }}>
          {formatDateJa(date)}
        </button>
        <button type="button" className="btn" onClick={() => { setDate((d) => addDays(d, 1)); resetSelection() }}>
          ▶
        </button>
      </div>

      <div className="slot-list card">
        {SLOTS.map((s, idx) => {
          const owner = slotOwner[idx]
          const isSelected = selection && idx >= selection.start && idx <= selection.end
          const isHourStart = s.start.endsWith(':00')
          return (
            <button
              type="button"
              key={s.start}
              className={`slot-row ${owner ? 'reserved' : 'free'} ${isSelected ? 'selected' : ''} ${isHourStart ? 'hour-start' : ''}`}
              onClick={() => handleSlotClick(idx)}
            >
              <span className="slot-time">{s.start}</span>
              <span className="slot-content">
                {owner ? (
                  <>
                    <span className="slot-person">
                      {owner.person}
                      {owner.projectName && (
                        <span className="slot-project">{owner.projectName}</span>
                      )}
                    </span>
                    {owner.note && <span className="slot-note">{owner.note}</span>}
                  </>
                ) : isSelected ? (
                  <span className="slot-selecting">選択中</span>
                ) : (
                  <span className="slot-empty">空き</span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      {selection && (
        <div className="selection-bar">
          <div className="selection-info">
            <span className="selection-range">{selectionLabel} を予約</span>
            <span className="selection-hint">他の空きコマをタップすると延長できます</span>
          </div>
          <div className="selection-actions">
            <button type="button" className="btn" onClick={resetSelection}>
              取消
            </button>
            <button type="button" className="btn btn-primary" onClick={openNewReservationForm}>
              予約する
            </button>
          </div>
        </div>
      )}

      {formOpen && (
        <Modal
          title={editing ? '予約の編集' : '予約する'}
          onClose={closeForm}
          footer={
            <>
              {editing && (
                <button type="button" className="btn btn-danger" onClick={deleteReservation}>
                  削除
                </button>
              )}
              <button type="button" className="btn" onClick={closeForm}>
                キャンセル
              </button>
              <button type="button" className="btn btn-primary btn-block" onClick={submitForm}>
                {editing ? '更新' : '予約を確定'}
              </button>
            </>
          }
        >
          <p className="modal-sub">
            {editing ? `${date} ${editing.start} 〜 ${editing.end}` : `${date} ${selectionLabel}`}
          </p>
          <div className="field">
            <label>名前 *</label>
            <input value={person} onChange={(e) => setPerson(e.target.value)} placeholder="名前または制作名" />
          </div>
          <div className="field">
            <label>制作(任意)</label>
            {myProjects.length === 0 ? (
              <p className="field-hint">
                所属している制作がありません。設定タブの「制作グループ」から参加できます。
              </p>
            ) : (
              <div className="project-select">
                <button
                  type="button"
                  className={`project-option ${projectId === '' ? 'active' : ''}`}
                  onClick={() => setProjectId('')}
                >
                  個人
                </button>
                {myProjects.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    className={`project-option ${projectId === p.id ? 'active' : ''}`}
                    onClick={() => setProjectId(p.id)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="field">
            <label>メモ(任意)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="出力物やフィラメント色など" />
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Printer3D
