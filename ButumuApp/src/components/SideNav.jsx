import { TABS } from '../lib/tabs'
import './SideNav.css'

function SideNav({ active, onChange }) {
  return (
    <nav className="side-nav">
      <div className="side-nav-brand">部員アプリ</div>
      <div className="side-nav-list">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`side-nav-item ${active === tab.key ? 'active' : ''}`}
            onClick={() => onChange(tab.key)}
          >
            <span className="side-nav-icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

export default SideNav
