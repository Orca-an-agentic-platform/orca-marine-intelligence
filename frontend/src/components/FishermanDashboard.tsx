import React, { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Map,
  Bell,
  Route,
  Clock,
  Database,
  ArrowLeftRight,
  Globe,
  Wifi,
  User,
  CloudSun,
} from 'lucide-react'
import { ChatPane } from './ChatPane'
import { OrcaMap } from './OrcaMap'
import { ConditionCards } from './ConditionCards'
import { MarineWeatherDashboard } from './MarineWeatherDashboard'

interface FishermanDashboardProps {
  onSwitchRole: () => void
}

const sidebarItems = [
  { id: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { id: 'marine-map', icon: <Map size={18} />, label: 'Marine Map' },
  { id: 'weather', icon: <CloudSun size={18} />, label: 'Weather Forecast' },
  { id: 'alerts', icon: <Bell size={18} />, label: 'Alerts' },
  { id: 'route-planner', icon: <Route size={18} />, label: 'Route Planner' },
  { id: 'history', icon: <Clock size={18} />, label: 'History' },
  { id: 'data-sources', icon: <Database size={18} />, label: 'Data Sources' },
]

export const FishermanDashboard: React.FC<FishermanDashboardProps> = ({ onSwitchRole }) => {
  const [activeSidebar, setActiveSidebar] = useState('dashboard')
  const [currentTime, setCurrentTime] = useState('')
  const [language, setLanguage] = useState('English')

  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      )
    }
    updateClock()
    const interval = setInterval(updateClock, 1000)
    return () => clearInterval(interval)
  }, [])

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: undefined,
  })

  return (
    <div className="fd-shell">
      {/* ── Header ── */}
      <header className="fd-header">
        <div className="fd-header-left">
          <div className="fd-logo">
            <svg viewBox="0 0 32 22" className="fd-logo-svg" aria-label="ORCA">
              <path d="M3 14 Q 10 7 18 14 T 29 14" fill="none" stroke="#00c2d4" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M6 9 Q 14 3 22 9 T 30 9" fill="none" stroke="#0099ff" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
            </svg>
            <div className="fd-logo-text">
              <span className="fd-logo-name">ORCA</span>
              <span className="fd-logo-sub">Marine Intel</span>
            </div>
          </div>

          <div className="fd-header-title">
            <span className="fd-title-main">Fisherman Dashboard</span>
            <span className="fd-title-date">{todayStr}</span>
          </div>
        </div>

        <div className="fd-header-right">
          <span className="fd-clock">{currentTime}</span>
          <div className="fd-lang-select">
            <Globe size={14} />
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option>English</option>
              <option>हिन्दी</option>
              <option>मराठी</option>
            </select>
          </div>
          <button className="fd-header-icon-btn" title="Notifications">
            <Bell size={17} />
          </button>
          <div className="fd-user-avatar">
            <User size={16} />
          </div>
        </div>
      </header>

      {/* ── Sidebar ── */}
      <aside className="fd-sidebar">
        <div className="fd-sidebar-role-badge">
          <span className="fd-role-dot" />
          Fisherman
        </div>

        <nav className="fd-sidebar-nav">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              className={`fd-nav-item ${activeSidebar === item.id ? 'active' : ''}`}
              onClick={() => setActiveSidebar(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main Content Area ── */}
      <main className={`fd-main ${activeSidebar === 'weather' ? 'weather-full-view' : ''}`}>
        {activeSidebar === 'weather' ? (
          <MarineWeatherDashboard />
        ) : (
          <>
            {/* Left: Chat (30% width) */}
            <ChatPane />

            {/* Center / Right: Interactive Map + Condition Cards (Spacious 70% width) */}
            <div className="fd-center-column">
              <OrcaMap />
              <ConditionCards />
            </div>
          </>
        )}
      </main>
    </div>
  )
}
