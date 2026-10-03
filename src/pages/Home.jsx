import { useEffect, useMemo, useState } from 'react'
import MiniCalendar from '../components/MiniCalendar'
import { subscribeList } from '../lib/firebaseData'
import { expandEventsByDate } from '../lib/calendarEvents'
import { todayStr, formatDateJa } from '../lib/date'
import './Home.css'

function Home({ onNavigate }) {
  const [orders, setOrders] = useState([])
  const [reservations, setReservations] = useState([])
  const [events, setEvents] = useState([])

  useEffect(() => {
    const unsub1 = subscribeList('orders', setOrders)
    const unsub2 = subscribeList('printerReservations', setReservations)
    const unsub3 = subscribeList('calendarEvents', setEvents)
    return () => {
      unsub1()
      unsub2()
      unsub3()
    }
  }, [])

  const eventsByDate = useMemo(() => expandEventsByDate(events), [events])

  const orderStats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      bought: orders.filter((o) => o.status === 'bought').length,
      unavail: orders.filter((o) => o.status === 'unavail').length,
    }
  }, [orders])

  const upcomingReservations = useMemo(() => {
    const today = todayStr()
    return reservations
      .filter((r) => r.date >= today)
      .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
      .slice(0, 5)
  }, [reservations])

  return (
    <div className="home-page">
      <div className="card">
        <MiniCalendar eventsByDate={eventsByDate} />
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
    </div>
  )
}

export default Home
