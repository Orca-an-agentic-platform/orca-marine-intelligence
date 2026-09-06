import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { UserRole } from '../../types'
import { useLangStore, LANGUAGES } from '../../store/langStore'

export default function Header({ role, onToggleSidebar }: { role: UserRole; onToggleSidebar: () => void }) {
  const { t } = useTranslation()
  const { lang, setLang } = useLangStore()
  const [time, setTime] = useState(new Date())
  const [alerts] = useState(3)
  const [showLangMenu, setShowLangMenu] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const currentLang = LANGUAGES.find(l => l.code === lang)

  return (
    <header className="glass border-b border-white/5 px-4 py-2.5 flex items-center gap-4">
      {/* Sidebar toggle */}
      <button onClick={onToggleSidebar} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* Page title */}
      <div>
        <h1 className="text-sm font-semibold text-white">{t(`dashboard.${role}`)}</h1>
        <p className="text-xs text-slate-500 font-mono">
          {time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · IST
        </p>
      </div>

      {/* Location pill */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-white/10 text-xs text-slate-300 cursor-pointer hover:border-cyan-400/30 transition-colors">
        <span className="text-cyan-400">📍</span>
        <span>{t('header.location')}</span>
        <span className="text-slate-600">▾</span>
      </div>

      {/* Live badge */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        {t('header.live')}
      </div>

      <div className="flex-1" />

      {/* Clock */}
      <div className="font-mono text-sm text-slate-300 tabular-nums">
        {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>

      {/* ── Language switcher ── */}
      <div className="relative">
        <button
          onClick={() => setShowLangMenu(!showLangMenu)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass border border-white/10 hover:border-cyan-400/30 transition-all text-xs text-white"
        >
          <span>{currentLang?.flag}</span>
          <span className="font-medium">{currentLang?.nativeName}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${showLangMenu ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {/* Dropdown */}
        {showLangMenu && (
          <div className="absolute right-0 top-full mt-2 w-44 glass border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 animate-fade-in-up">
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => { setLang(l.code); setShowLangMenu(false) }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 transition-colors ${lang === l.code ? 'text-cyan-400 bg-cyan-400/5' : 'text-slate-300'}`}
              >
                <span className="text-base">{l.flag}</span>
                <div className="text-left">
                  <p className="font-medium leading-none">{l.nativeName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{l.label}</p>
                </div>
                {lang === l.code && <span className="ml-auto text-cyan-400 text-xs">✓</span>}
              </button>
            ))}
          </div>
        )}
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

      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-teal-400 flex items-center justify-center text-xs font-bold text-white cursor-pointer">
        U
      </div>

      {/* Close lang menu on outside click */}
      {showLangMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)} />
      )}
    </header>
  )
}
