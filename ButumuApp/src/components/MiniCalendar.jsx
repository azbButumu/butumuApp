import { useState } from 'react'
import { toDateStr, todayStr, weekdayJa } from '../lib/date'
import './MiniCalendar.css'

function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1)
  const startOffset = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function MiniCalendar({ interactive = false, eventsByDate = {}, selectedDate, onSelectDate }) {
  const today = todayStr()
  const [viewDate, setViewDate] = useState(() => {
    const base = selectedDate ? new Date(selectedDate) : new Date()
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const cells = buildMonthGrid(year, month)

  function changeMonth(delta) {
    setViewDate(new Date(year, month + delta, 1))
  }

  return (
    <div className={`mini-calendar ${interactive ? 'interactive' : 'compact'}`}>
      <div className="mc-header">
        {interactive && (
          <button type="button" className="mc-nav" onClick={() => changeMonth(-1)}>
            ◀
          </button>
        )}
        <div className="mc-title">
          {year}年 {month + 1}月
        </div>
        {interactive && (
          <button type="button" className="mc-nav" onClick={() => changeMonth(1)}>
            ▶
          </button>
        )}
      </div>
      <div className="mc-weekdays">
        {[0, 1, 2, 3, 4, 5, 6].map((w) => (
          <div key={w} className={`mc-weekday ${w === 0 ? 'sun' : ''} ${w === 6 ? 'sat' : ''}`}>
            {weekdayJa(w)}
          </div>
        ))}
      </div>
      <div className="mc-grid">
        {cells.map((cellDate, i) => {
          if (!cellDate) return <div key={i} className="mc-cell empty" />
          const dateStr = toDateStr(cellDate)
          const isToday = dateStr === today
          const isSelected = interactive && dateStr === selectedDate
          const dow = cellDate.getDay()
          const dayEvents = eventsByDate[dateStr] || []
          return (
            <button
              type="button"
              key={i}
              className={`mc-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${dow === 0 ? 'sun' : ''} ${dow === 6 ? 'sat' : ''}`}
              onClick={() => interactive && onSelectDate && onSelectDate(dateStr)}
              disabled={!interactive}
            >
              <span className="mc-daynum">{cellDate.getDate()}</span>
              {dayEvents.length > 0 && (
                <span className="mc-dots">
                  {dayEvents.slice(0, 4).map((ev, di) => (
                    <span key={di} className="mc-dot" style={{ background: ev.color }} />
                  ))}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default MiniCalendar
