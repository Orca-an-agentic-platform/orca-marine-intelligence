import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { UserRole } from '../../types'

const ROLE_ICONS: Record<string, string> = {
  fisherman: '🎣', coastal_authority: '⚓', disaster_management: '🚨',
  maritime_operator: '🚢', researcher: '🔬', shipping_operator: '📦',
  fisheries_dept: '🐟', marketplace: '🏪', institutional_researcher: '📊', admin: '🏭',
}

const NAV_KEYS = [
  { id: 'dashboard', icon: '⚡', key: 'nav.dashboard' },
  { id: 'map', icon: '🗺️', key: 'nav.map' },
  { id: 'alerts', icon: '🔔', key: 'nav.alerts' },
  { id: 'route', icon: '📍', key: 'nav.route' },
  { id: 'history', icon: '📈', key: 'nav.history' },
  { id: 'data', icon: '🛰️', key: 'nav.data' },
]

interface Props { role: UserRole; open: boolean; onChangeRole: () => void }

export default function Sidebar({ role, open, onChangeRole }: Props) {
  const { t } = useTranslation()
  if (!open) return null

  return (
    <aside className="w-16 md:w-56 flex-shrink-0 glass border-r border-white/5 flex flex-col py-4 gap-1 px-2">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-6">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-400 flex items-center justify-center text-lg flex-shrink-0 glow-teal">
          🐋
        </div>
        <div className="hidden md:block">
          <p className="font-bold text-white text-sm leading-none">ORCA</p>
          <p className="text-xs text-slate-500 mt-0.5">Marine Intel</p>
        </div>
      </div>

      {/* Role badge */}
      <div className="hidden md:flex items-center gap-2 px-2 py-2 rounded-xl glass border border-cyan-400/20 mb-3">
        <span className="text-base">{ROLE_ICONS[role] ?? '👤'}</span>
        <div>
          <p className="text-xs text-cyan-400 font-medium">{t(`roles.${role}`)}</p>
        </div>
      </div>

      {/* Nav items */}
      {NAV_KEYS.map(item => (
        <button
          key={item.id}
          className="nav-item flex items-center gap-3 px-2 py-2.5 rounded-xl border border-transparent text-slate-400 hover:text-white w-full text-left"
        >
          <span className="text-base w-6 text-center">{item.icon}</span>
          <span className="hidden md:block text-sm font-medium">{t(item.key)}</span>
        </button>
      ))}

      <div className="flex-1" />

      <button
        onClick={onChangeRole}
        className="nav-item flex items-center gap-3 px-2 py-2.5 rounded-xl border border-transparent text-slate-500 hover:text-white w-full text-left"
      >
        <span className="text-base w-6 text-center">🔄</span>
        <span className="hidden md:block text-xs">{t('nav.switchRole')}</span>
      </button>
    </aside>
  )
}
