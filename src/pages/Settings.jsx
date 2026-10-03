import { useEffect, useMemo, useState } from 'react'
import { subscribeValue, setValue } from '../../shared/firebaseData'
import { normalizeRotation, dutiesFrom, cycleLabel } from '../../shared/duty'
import { todayStr, formatDateJa } from '../../shared/date'
import { getAuthInstance, signOutUser } from '../../shared/auth'
import './Settings.css'

function Settings() {
  const [rotationRaw, setRotationRaw] = useState(null)
  const [members, setMembers] = useState([])
  const [startDate, setStartDate] = useState('')
  const [newMember, setNewMember] = useState('')
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => subscribeValue('dutyRotation', setRotationRaw), [])

  const today = todayStr()
  const rotation = useMemo(() => normalizeRotation(rotationRaw), [rotationRaw])

  // 編集中はサーバーの値で上書きしない
  useEffect(() => {
    if (dirty) return
    setMembers(rotation.members)
    setStartDate(rotation.startDate || todayStr())
  }, [rotation, dirty])

  function edit(fn) {
    setDirty(true)
    setSaved(false)
    fn()
  }

  function addMember() {
    const name = newMember.trim()
    if (!name) return
    edit(() => {
      setMembers((list) => [...list, name])
      setNewMember('')
    })
  }

  function removeMember(index) {
    edit(() => setMembers((list) => list.filter((_, i) => i !== index)))
  }

  function moveMember(index, delta) {
    edit(() =>
      setMembers((list) => {
        const target = index + delta
        if (target < 0 || target >= list.length) return list
        const next = [...list]
        ;[next[index], next[target]] = [next[target], next[index]]
        return next
      }),
    )
  }

  function save() {
    setValue('dutyRotation', { members, startDate })
    setDirty(false)
    setSaved(true)
  }

  const preview = useMemo(
    () => dutiesFrom(today, { members, startDate }, {}, 7),
    [today, members, startDate],
  )

  const account = getAuthInstance().currentUser

  return (
    <div className="settings-page">
      <div className="card">
        <h2>責任者ローテーション</h2>
        <p className="settings-sub">
          開始日から日替わりで、下の順番に1人ずつ交代します。
          {members.length > 0 && ` 現在 ${members.length}人 → ${cycleLabel(members)}`}
        </p>

        <div className="field">
          <label>1番目の人が担当する日 *</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => edit(() => setStartDate(e.target.value))}
          />
        </div>

        <div className="field">
          <label>順番({members.length}人)</label>
          {members.length === 0 ? (
            <div className="empty-state">まだ登録がありません</div>
          ) : (
            <div className="member-list">
              {members.map((m, i) => (
                <div className="member-row" key={`${m}-${i}`}>
                  <span className="member-no">{i + 1}</span>
                  <span className="member-name">{m}</span>
                  <button
                    type="button"
                    className="member-btn"
                    disabled={i === 0}
                    onClick={() => moveMember(i, -1)}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className="member-btn"
                    disabled={i === members.length - 1}
                    onClick={() => moveMember(i, 1)}
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    className="member-btn danger"
                    onClick={() => removeMember(i)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="field-row">
          <div className="field">
            <input
              value={newMember}
              onChange={(e) => setNewMember(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addMember()
                }
              }}
              placeholder="部員を追加"
            />
          </div>
          <button type="button" className="btn" onClick={addMember}>
            追加
          </button>
        </div>

        <div className="settings-save">
          <button type="button" className="btn btn-primary btn-block" onClick={save}>
            保存
          </button>
          {dirty && <span className="settings-hint">未保存の変更があります</span>}
          {saved && <span className="settings-hint saved">保存しました</span>}
        </div>
      </div>

      <div className="card">
        <h2>アカウント</h2>
        <p className="settings-sub">
          {account?.email || 'ログイン中'}
          {account?.providerData?.[0]?.providerId === 'google.com' && '(Google)'}
        </p>
        <button type="button" className="btn btn-danger btn-block" onClick={signOutUser}>
          ログアウト
        </button>
      </div>

      {preview.length > 0 && (
        <div className="card">
          <h2>この設定での割り当て(今日から)</h2>
          {preview.map((d) => (
            <div className="duty-next-row" key={d.date}>
              <span className="duty-next-date">{formatDateJa(d.date)}</span>
              <span className="duty-next-person">{d.person}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Settings
