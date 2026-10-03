import { useCallback, useEffect, useMemo, useState } from 'react'
import MiniCalendar from '../components/MiniCalendar'
import Modal from '../components/Modal'
import {
  subscribeList,
  subscribeValue,
  addItem,
  updateItem,
  removeItem,
} from '../lib/firebaseData'
import { expandEventsByDate, isOccurrenceSkipped } from '../lib/calendarEvents'
import { TAGS, TAG_COLORS } from '../lib/tags'
import { todayStr, formatDateJa, weekdayJaOf } from '../lib/date'
import { normalizeRotation, overridesByDate, resolveDuty } from '../lib/duty'
import './Calendar.css'

const EMPTY_FORM = {
  title: '',
  startDate: '',
  endDate: '',
  tag: '一般',
  note: '',
  repeat: '',
  repeatUntil: '',
}

function CalendarPage() {
  const [events, setEvents] = useState([])
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [editingStart, setEditingStart] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [rotationRaw, setRotationRaw] = useState(null)
  const [overrides, setOverrides] = useState([])

  useEffect(() => {
    const unsubs = [
      subscribeList('calendarEvents', setEvents),
      subscribeList('dutyOverrides', setOverrides),
      subscribeValue('dutyRotation', setRotationRaw),
    ]
    return () => unsubs.forEach((u) => u())
  }, [])

  const rotation = useMemo(() => normalizeRotation(rotationRaw), [rotationRaw])
  const overrideMap = useMemo(() => overridesByDate(overrides), [overrides])
  const getDuty = useCallback(
    (dateStr) => resolveDuty(dateStr, rotation, overrideMap),
    [rotation, overrideMap],
  )

  const eventsByDate = useMemo(() => expandEventsByDate(events), [events])

  const dayEvents = useMemo(
    () =>
      [...(eventsByDate[selectedDate] || [])].sort(
        (a, b) => a.start.localeCompare(b.start) || a.event.title.localeCompare(b.event.title),
      ),
    [eventsByDate, selectedDate],
  )

  function openAddForm() {
    setEditing(null)
    setEditingStart('')
    setForm({ ...EMPTY_FORM, startDate: selectedDate })
    setFormOpen(true)
  }

  function openEditForm(ev, start) {
    setEditing(ev)
    setEditingStart(start || ev.date)
    setForm({
      title: ev.title || '',
      startDate: ev.date,
      endDate: ev.endDate || '',
      tag: ev.tag || '一般',
      note: ev.note || '',
      repeat: ev.repeat || '',
      repeatUntil: ev.repeatUntil || '',
    })
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
    setEditingStart('')
  }

  // 除外日は「毎週」の各回の初日で記録する。他の回には影響しない
  function skipOccurrence() {
    if (!editing || !editingStart) return
    updateItem('calendarEvents', editing.id, { [`skipDates/${editingStart}`]: true })
    closeForm()
  }

  function restoreOccurrence() {
    if (!editing || !editingStart) return
    updateItem('calendarEvents', editing.id, { [`skipDates/${editingStart}`]: null })
    closeForm()
  }

  function submitForm() {
    if (!form.title.trim() || !form.startDate) return
    const weekly = form.repeat === 'weekly'
    const payload = {
      title: form.title.trim(),
      date: form.startDate,
      endDate: form.endDate && form.endDate > form.startDate ? form.endDate : '',
      tag: form.tag,
      note: form.note.trim(),
      repeat: weekly ? 'weekly' : '',
      repeatUntil:
        weekly && form.repeatUntil && form.repeatUntil >= form.startDate ? form.repeatUntil : '',
      updatedAt: Date.now(),
    }
    // くりかえしをやめたら、残った除外日が単発の予定を中止扱いにしないよう消す
    if (!weekly) payload.skipDates = null
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

  const occurrenceSkipped = editing ? isOccurrenceSkipped(editing, editingStart) : false

  return (
    <div className="calendar-page">
      <div className="card">
        <MiniCalendar
          interactive
          eventsByDate={eventsByDate}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          getDuty={getDuty}
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
          dayEvents.map(({ event: ev, start, skipped }) => (
            <button
              type="button"
              key={`${ev.id}-${start}`}
              className={`event-row ${skipped ? 'skipped' : ''}`}
              onClick={() => openEditForm(ev, start)}
            >
              <span className="tag-chip" style={{ background: TAG_COLORS[ev.tag] || TAG_COLORS['その他'] }}>
                {ev.tag}
              </span>
              <span className="event-title">{ev.title}</span>
              {skipped && <span className="event-cancelled">中止</span>}
              {ev.repeat === 'weekly' && <span className="event-repeat">毎週</span>}
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
                  {editing.repeat === 'weekly' ? 'すべて削除' : '削除'}
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
          {editing?.repeat === 'weekly' && editingStart && (
            <div className={`occurrence-box ${occurrenceSkipped ? 'cancelled' : ''}`}>
              <div className="occurrence-date">{formatDateJa(editingStart)}の回</div>
              {occurrenceSkipped ? (
                <>
                  <p className="occurrence-note">この回は中止になっています。</p>
                  <button type="button" className="btn btn-block" onClick={restoreOccurrence}>
                    中止を取り消す
                  </button>
                </>
              ) : (
                <>
                  <p className="occurrence-note">
                    下の編集内容はすべての回に反映されます。この回だけ休むときはこちら。
                  </p>
                  <button type="button" className="btn btn-danger btn-block" onClick={skipOccurrence}>
                    この回だけ中止
                  </button>
                </>
              )}
            </div>
          )}

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
              <label>終了日(連日の場合)</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label>くりかえし</label>
            <div className="repeat-row">
              <button
                type="button"
                className={`repeat-opt ${form.repeat === '' ? 'active' : ''}`}
                onClick={() => setForm({ ...form, repeat: '', repeatUntil: '' })}
              >
                なし
              </button>
              <button
                type="button"
                className={`repeat-opt ${form.repeat === 'weekly' ? 'active' : ''}`}
                onClick={() => setForm({ ...form, repeat: 'weekly' })}
              >
                毎週
              </button>
            </div>
            {form.repeat === 'weekly' && (
              <p className="repeat-hint">
                {form.startDate
                  ? `毎週${weekdayJaOf(form.startDate)}曜日にくりかえします`
                  : '開始日を入れると、その曜日が毎週の曜日になります'}
              </p>
            )}
          </div>

          {form.repeat === 'weekly' && (
            <div className="field">
              <label>くりかえす最終日(空欄なら無期限)</label>
              <input
                type="date"
                value={form.repeatUntil}
                min={form.startDate || undefined}
                onChange={(e) => setForm({ ...form, repeatUntil: e.target.value })}
              />
            </div>
          )}

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
