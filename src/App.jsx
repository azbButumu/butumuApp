import { useState } from 'react'
import BottomNav from './components/BottomNav'
import SideNav from './components/SideNav'
import Home from './pages/Home'
import AkibaChu from './pages/AkibaChu'
import Printer3D from './pages/Printer3D'
import Library from './pages/Library'
import Calendar from './pages/Calendar'
import './App.css'

const TITLES = {
  home: 'ホーム',
  akiba: '秋葉注',
  printer: '3Dプリンター予約',
  library: 'ライブラリ',
  calendar: 'カレンダー',
}

function App() {
  const [tab, setTab] = useState('home')
  const isFullBleed = tab === 'akiba'

  return (
    <div className="app-shell">
      <SideNav active={tab} onChange={setTab} />
      <div className="app-content">
        <header className="app-header">
          <h1>{TITLES[tab]}</h1>
        </header>
        <main className={`app-main ${isFullBleed ? 'no-padding' : ''}`}>
          {tab === 'home' && <Home onNavigate={setTab} />}
          {tab === 'akiba' && <AkibaChu />}
          {tab === 'printer' && <Printer3D />}
          {tab === 'library' && <Library />}
          {tab === 'calendar' && <Calendar />}
        </main>
      </div>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}

export default App
