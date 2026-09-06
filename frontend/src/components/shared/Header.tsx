import { useState, useEffect } from 'react'
import { UserRole } from '../../types'

const ROLE_LABELS: Record<string, string> = {
  fisherman: 'Fisherman Dashboard', coastal_authority: 'Coastal Authority',
  disaster_management: 'Disaster Management', maritime_operator: 'Maritime Ops',
  researcher: 'Research Dashboard', shipping_operator: 'Shipping Ops',
  fisheries_dept: 'Fisheries', marketplace: 'Marketplace',
  institutional_researcher: 'Marine Analysis', admin: 'Marine Logistics',
}

const LANGUAGES = ['EN', 'हि', 'मरा', 'தமி']

export default function Header({ role, onToggleSidebar }: { role: UserRole; onToggleSidebar: () => void }) {
  const [time, setTime] = useState(new Date())
  const [lang, setLang] = useState(0)
  const [alerts, setAlerts] = useState(3)

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <header className="glass border-b border-white/5 px-4 py-2.5 flex items-center gap-4">
      {/* Toggle */}
      <button onClick={onToggleSidebar} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* Page title */}
      <div>
        <h1 className="text-sm font-semibold text-white">{ROLE_LABELS[role]}</h1>
        <p className="text-xs text-slate-500 font-mono">
          {time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · IST
        </p>
      </div>

      {/* Location pill */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-white/10 text-xs text-slate-300 cursor-pointer hover:border-cyan-400/30 transition-colors">
        <span className="text-cyan-400">📍</span>
        <span>Ratnagiri Coast, MH</span>
        <span className="text-slate-600">▾</span>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        LIVE
      </div>

      <div className="flex-1" />

      {/* Clock */}
      <div className="font-mono text-sm text-slate-300 tabular-nums">
        {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>

      {/* Language */}
      <div className="flex gap-1">
        {LANGUAGES.map((l, i) => (
          <button key={l} onClick={() => setLang(i)}
            className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${i === lang ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/30' : 'text-slate-500 hover:text-slate-300'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Alerts bell */}
      <button className="relative p-2 rounded-xl hover:bg-white/5 transition-colors text-slate-400 hover:text-white">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {alerts > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-[9px] font-bold text-black flex items-center justify-center">
            {alerts}
          </span>
        )}
      </button>

      {/* User avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-teal-400 flex items-center justify-center text-xs font-bold text-white cursor-pointer">
        U
      </div>
    </header>
  )
}
