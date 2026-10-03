import { useEffect, useMemo, useState } from 'react'
import MiniCalendar from '../components/MiniCalendar'
import Modal from '../components/Modal'
import { subscribeList, addItem, updateItem, removeItem } from '../lib/firebaseData'
import { expandEventsByDate } from '../lib/calendarEvents'
import { TAGS, TAG_COLORS } from '../lib/tags'
import { todayStr, formatDateJa } from '../lib/date'
import './Calendar.css'

const EMPTY_FORM = { title: '', startDate: '', endDate: '', tag: '一般', note: '' }

function CalendarPage() {
  const [events, setEvents] = useState([])
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => subscribeList('calendarEvents', setEvents), [])

  const eventsByDate = useMemo(() => expandEventsByDate(events), [events])

  const dayEvents = useMemo(() => {
    const end = (ev) => ev.endDate || ev.date
    return events
      .filter((ev) => selectedDate >= ev.date && selectedDate <= end(ev))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [events, selectedDate])

  function openAddForm() {
    setEditing(null)
    setForm({ ...EMPTY_FORM, startDate: selectedDate })
    setFormOpen(true)
  }

  function openEditForm(ev) {
    setEditing(ev)
    setForm({
      title: ev.title || '',
      startDate: ev.date,
      endDate: ev.endDate || '',
      tag: ev.tag || '一般',
      note: ev.note || '',
    })
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
  }

  function submitForm() {
    if (!form.title.trim() || !form.startDate) return
    const payload = {
      title: form.title.trim(),
      date: form.startDate,
      endDate: form.endDate && form.endDate > form.startDate ? form.endDate : '',
      tag: form.tag,
      note: form.note.trim(),
      updatedAt: Date.now(),
    }
    if (editing) {
      updateItem('calendarEvents', editing.id, payload)
    } else {
      addItem('calendarEvents', { ...payload, createdAt: Date.now() })
    }
    closeForm()
  }

  function deleteEvent() {
    if (editing) removeItem('calendarEvents', editing.id)
    closeForm()
  }

  return (
    <div className="calendar-page">
      <div className="card">
        <MiniCalendar
          interactive
          eventsByDate={eventsByDate}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>

      <div className="tag-legend">
        {TAGS.map((t) => (
          <span key={t.key} className="tag-chip" style={{ background: t.color }}>
            {t.key}
          </span>
        ))}
      </div>

      <div className="card">
        <div className="row-between">
          <h2>{formatDateJa(selectedDate)}の予定</h2>
          <button type="button" className="btn btn-primary" onClick={openAddForm}>
            + 追加
          </button>
        </div>
        {dayEvents.length === 0 ? (
          <div className="empty-state">予定はありません</div>
        ) : (
          dayEvents.map((ev) => (
            <button type="button" key={ev.id} className="event-row" onClick={() => openEditForm(ev)}>
              <span className="tag-chip" style={{ background: TAG_COLORS[ev.tag] || TAG_COLORS['その他'] }}>
                {ev.tag}
              </span>
              <span className="event-title">{ev.title}</span>
              {ev.endDate && (
                <span className="event-range">
                  〜{ev.endDate.slice(5).replace('-', '/')}
                </span>
              )}
            </button>
          ))
        )}
      </div>

      {formOpen && (
        <Modal
          title={editing ? '予定の編集' : '予定を追加'}
          onClose={closeForm}
          footer={
            <>
              {editing && (
                <button type="button" className="btn btn-danger" onClick={deleteEvent}>
                  削除
                </button>
              )}
              <button type="button" className="btn" onClick={closeForm}>
                キャンセル
              </button>
              <button type="button" className="btn btn-primary btn-block" onClick={submitForm}>
                {editing ? '更新' : '追加'}
              </button>
            </>
          }
        >
          <div className="field">
            <label>タイトル *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="例: 新歓ミーティング" />
          </div>
          <div className="field-row">
            <div className="field">
              <label>開始日 *</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="field">
              <label>終了日(任意)</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label>タグ</label>
            <div className="tag-select">
              {TAGS.map((t) => (
                <button
                  type="button"
                  key={t.key}
                  className={`tag-option ${form.tag === t.key ? 'active' : ''}`}
                  style={{ '--tag-color': t.color }}
                  onClick={() => setForm({ ...form, tag: t.key })}
                >
                  {t.key}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label>メモ(任意)</label>
            <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
        </Modal>
      )}
    </div>
  )
}

export default CalendarPage
