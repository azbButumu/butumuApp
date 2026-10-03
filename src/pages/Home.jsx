import { useCallback, useEffect, useMemo, useState } from 'react'
import MiniCalendar from '../components/MiniCalendar'
import Modal from '../components/Modal'
import {
  subscribeList,
  subscribeValue,
  setItem,
  setValue,
  removeItem,
} from '../lib/firebaseData'
import { expandEventsByDate } from '../lib/calendarEvents'
import { todayStr, addDays, formatDateJa } from '../lib/date'
import {
  normalizeRotation,
  overridesByDate,
  resolveDuty,
  dutiesFrom,
  cycleLabel,
} from '../lib/duty'
import './Home.css'

function Home({ onNavigate }) {
  const [orders, setOrders] = useState([])
  const [reservations, setReservations] = useState([])
  const [events, setEvents] = useState([])
  const [rotationRaw, setRotationRaw] = useState(null)
  const [overrides, setOverrides] = useState([])
  const [today, setToday] = useState(todayStr)

  const [changeOpen, setChangeOpen] = useState(false)
  const [changePerson, setChangePerson] = useState('')
  const [changeNote, setChangeNote] = useState('')

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [draftMembers, setDraftMembers] = useState([])
  const [draftStart, setDraftStart] = useState('')
  const [newMember, setNewMember] = useState('')

  useEffect(() => {
    const unsubs = [
      subscribeList('orders', setOrders),
      subscribeList('printerReservations', setReservations),
      subscribeList('calendarEvents', setEvents),
      subscribeList('dutyOverrides', setOverrides),
      subscribeValue('dutyRotation', setRotationRaw),
    ]
    return () => unsubs.forEach((u) => u())
  }, [])

  // アプリを開いたままでも日付が変わったら切り替わるように
  useEffect(() => {
    const timer = setInterval(() => setToday((d) => (todayStr() === d ? d : todayStr())), 60000)
    return () => clearInterval(timer)
  }, [])

  const rotation = useMemo(() => normalizeRotation(rotationRaw), [rotationRaw])
  const overrideMap = useMemo(() => overridesByDate(overrides), [overrides])
  const duty = useMemo(() => resolveDuty(today, rotation, overrideMap), [today, rotation, overrideMap])
  const upcoming = useMemo(
    () => dutiesFrom(addDays(today, 1), rotation, overrideMap, 5),
    [today, rotation, overrideMap],
  )

  const eventsByDate = useMemo(() => expandEventsByDate(events), [events])
  const getDuty = useCallback(
    (dateStr) => resolveDuty(dateStr, rotation, overrideMap),
    [rotation, overrideMap],
  )

  const orderStats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      bought: orders.filter((o) => o.status === 'bought').length,
      unavail: orders.filter((o) => o.status === 'unavail').length,
    }
  }, [orders])

  const upcomingReservations = useMemo(() => {
    return reservations
      .filter((r) => r.date >= today)
      .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
      .slice(0, 5)
  }, [reservations, today])

  function openChangeForm() {
    setChangePerson(duty.isOverride ? duty.person : '')
    setChangeNote(duty.note)
    setChangeOpen(true)
  }

  function submitChange() {
    const person = changePerson.trim()
    if (!person) return
    setItem('dutyOverrides', today, {
      date: today,
      person,
      note: changeNote.trim(),
      updatedAt: Date.now(),
    })
    setChangeOpen(false)
  }

  function clearChange() {
    removeItem('dutyOverrides', today)
    setChangeOpen(false)
  }

  function openSettings() {
    setDraftMembers(rotation.members)
    setDraftStart(rotation.startDate || today)
    setNewMember('')
    setSettingsOpen(true)
  }

  function addMember() {
    const name = newMember.trim()
    if (!name) return
    setDraftMembers((list) => [...list, name])
    setNewMember('')
  }

  function removeMember(index) {
    setDraftMembers((list) => list.filter((_, i) => i !== index))
  }

  function moveMember(index, delta) {
    const target = index + delta
    setDraftMembers((list) => {
      if (target < 0 || target >= list.length) return list
      const next = [...list]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function submitSettings() {
    setValue('dutyRotation', {
      members: draftMembers,
      startDate: draftStart,
    })
    setSettingsOpen(false)
  }

  const draftPreview = useMemo(
    () => dutiesFrom(today, { members: draftMembers, startDate: draftStart }, {}, 7),
    [today, draftMembers, draftStart],
  )

  return (
    <div className="home-page">
      <div className="card duty-card">
        <div className="row-between">
          <h2>今日の責任者</h2>
          <button type="button" className="card-link" onClick={openSettings}>
            ローテ設定
          </button>
        </div>

        {duty.person ? (
          <>
            <div className="duty-main">
              <span className="duty-name">{duty.person}</span>
              {duty.isOverride && <span className="duty-badge">当日変更</span>}
            </div>
            <div className="duty-meta">
              {formatDateJa(today)}
              {duty.isOverride
                ? duty.scheduled && ` · 本来: ${duty.scheduled}`
                : ` · ${duty.turn + 1}/${rotation.members.length}人目`}
            </div>
            {duty.note && <div className="duty-note">{duty.note}</div>}
          </>
        ) : (
          <div className="empty-state">
            ローテーションが未設定です。「ローテ設定」から部員と開始日を登録してください。
          </div>
        )}

        <div className="duty-actions">
          <button type="button" className="btn btn-block" onClick={openChangeForm}>
            {duty.isOverride ? '当日変更を編集' : '今日だけ変更'}
          </button>
        </div>

        {upcoming.length > 0 && (
          <div className="duty-next">
            <div className="duty-next-head">このあとの担当</div>
            {upcoming.map((d) => (
              <div className="duty-next-row" key={d.date}>
                <span className="duty-next-date">{formatDateJa(d.date)}</span>
                <span className="duty-next-person">{d.person}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <MiniCalendar eventsByDate={eventsByDate} getDuty={getDuty} />
      </div>

      <div className="card">
        <div className="row-between">
          <h2>秋葉注 注文数</h2>
          <button type="button" className="card-link" onClick={() => onNavigate('akiba')}>
            開く →
          </button>
        </div>
        <div className="stat-grid">
          <div>
            <div className="stat-num">{orderStats.total}</div>
            <div className="stat-lbl">合計</div>
          </div>
          <div>
            <div className="stat-num" style={{ color: '#a16207' }}>
              {orderStats.pending}
            </div>
            <div className="stat-lbl">未購入</div>
          </div>
          <div>
            <div className="stat-num" style={{ color: 'var(--success)' }}>
              {orderStats.bought}
            </div>
            <div className="stat-lbl">購入済</div>
          </div>
          <div>
            <div className="stat-num" style={{ color: 'var(--danger)' }}>
              {orderStats.unavail}
            </div>
            <div className="stat-lbl">入手不可</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="row-between">
          <h2>3Dプリンター予約</h2>
          <button type="button" className="card-link" onClick={() => onNavigate('printer')}>
            開く →
          </button>
        </div>
        {upcomingReservations.length === 0 ? (
          <div className="empty-state">今後の予約はありません</div>
        ) : (
          upcomingReservations.map((r) => (
            <div className="list-item" key={r.id}>
              <div>
                <div className="res-date">{formatDateJa(r.date)}</div>
                <div className="res-person">{r.person || '未記入'}</div>
              </div>
              <div className="res-time">
                {r.start} - {r.end}
              </div>
            </div>
          ))
        )}
      </div>

      {changeOpen && (
        <Modal
          title="今日の責任者を変更"
          onClose={() => setChangeOpen(false)}
          footer={
            <>
              {duty.isOverride && (
                <button type="button" className="btn btn-danger" onClick={clearChange}>
                  元に戻す
                </button>
              )}
              <button type="button" className="btn" onClick={() => setChangeOpen(false)}>
                キャンセル
              </button>
              <button type="button" className="btn btn-primary btn-block" onClick={submitChange}>
                保存
              </button>
            </>
          }
        >
          <p className="modal-sub">
            {formatDateJa(today)} · 本来の担当: {duty.scheduled || '未設定'}
          </p>
          <div className="field">
            <label>今日の責任者 *</label>
            <input
              value={changePerson}
              onChange={(e) => setChangePerson(e.target.value)}
              placeholder="名前"
            />
          </div>
          {rotation.members.length > 0 && (
            <div className="duty-picks">
              {rotation.members.map((m) => (
                <button
                  type="button"
                  key={m}
                  className={`duty-pick ${changePerson === m ? 'active' : ''}`}
                  onClick={() => setChangePerson(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
          <div className="field">
            <label>メモ(任意)</label>
            <input
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              placeholder="交代の理由など"
            />
          </div>
        </Modal>
      )}

      {settingsOpen && (
        <Modal
          title="責任者ローテーション"
          onClose={() => setSettingsOpen(false)}
          footer={
            <>
              <button type="button" className="btn" onClick={() => setSettingsOpen(false)}>
                キャンセル
              </button>
              <button type="button" className="btn btn-primary btn-block" onClick={submitSettings}>
                保存
              </button>
            </>
          }
        >
          <p className="modal-sub">
            開始日から日替わりで、下の順番に1人ずつ交代します。
            {draftMembers.length > 0 && ` 現在 ${draftMembers.length}人 → ${cycleLabel(draftMembers)}`}
          </p>
          <div className="field">
            <label>1番目の人が担当する日 *</label>
            <input type="date" value={draftStart} onChange={(e) => setDraftStart(e.target.value)} />
          </div>

          <div className="field">
            <label>順番({draftMembers.length}人)</label>
            {draftMembers.length === 0 ? (
              <div className="empty-state">まだ登録がありません</div>
            ) : (
              <div className="member-list">
                {draftMembers.map((m, i) => (
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
                      disabled={i === draftMembers.length - 1}
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

          {draftPreview.length > 0 && (
            <div className="duty-preview">
              <div className="duty-preview-head">この設定での割り当て(今日から)</div>
              {draftPreview.map((d) => (
                <div className="duty-next-row" key={d.date}>
                  <span className="duty-next-date">{formatDateJa(d.date)}</span>
                  <span className="duty-next-person">{d.person}</span>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}

export default Home
