import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { UserRole } from '../types'
import { useLangStore, LANGUAGES } from '../store/langStore'

const ROLES: { role: UserRole; descKey: string; icon: string; color: string }[] = [
  { role: 'fisherman', descKey: 'roleDesc.fisherman', icon: '🎣', color: 'from-cyan-500/20 to-teal-500/10 border-cyan-500/30 hover:border-cyan-400/60' },
  { role: 'coastal_authority', descKey: 'roleDesc.coastal_authority', icon: '⚓', color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30 hover:border-blue-400/60' },
  { role: 'disaster_management', descKey: 'roleDesc.disaster_management', icon: '🚨', color: 'from-red-500/20 to-orange-500/10 border-red-500/30 hover:border-red-400/60' },
  { role: 'maritime_operator', descKey: 'roleDesc.maritime_operator', icon: '🚢', color: 'from-violet-500/20 to-purple-500/10 border-violet-500/30 hover:border-violet-400/60' },
  { role: 'researcher', descKey: 'roleDesc.researcher', icon: '🔬', color: 'from-emerald-500/20 to-green-500/10 border-emerald-500/30 hover:border-emerald-400/60' },
  { role: 'shipping_operator', descKey: 'roleDesc.shipping_operator', icon: '📦', color: 'from-amber-500/20 to-yellow-500/10 border-amber-500/30 hover:border-amber-400/60' },
]

const EXTENSION_ROLES: { role: UserRole; labelKey: string; icon: string }[] = [
  { role: 'fisheries_dept', labelKey: 'roles.fisheries_dept', icon: '🐟' },
  { role: 'marketplace', labelKey: 'roles.marketplace', icon: '🏪' },
  { role: 'institutional_researcher', labelKey: 'roles.institutional_researcher', icon: '📊' },
  { role: 'admin', labelKey: 'roles.admin', icon: '🏭' },
]

export default function Landing({ onSelectRole }: { onSelectRole: (r: UserRole) => void }) {
  const { t } = useTranslation()
  const { lang, setLang } = useLangStore()
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div className="ocean-mesh min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl animate-pulse-teal pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-teal-400/5 blur-3xl animate-float pointer-events-none" />

      {/* Top-right language picker on landing */}
      <div className="absolute top-6 right-6 flex gap-2">
        {LANGUAGES.map(l => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
              lang === l.code
                ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300'
                : 'border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20 glass'
            }`}
          >
            {l.flag} {l.nativeName}
          </button>
        ))}
      </div>

      {/* Logo */}
      <div className="flex flex-col items-center mb-12 animate-fade-in-up">
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-2xl glass glow-teal flex items-center justify-center text-4xl animate-float">
            🐋
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent animate-pulse-teal">
            <div className="absolute inset-0 rounded-full bg-accent animate-ping-slow opacity-75" />
          </div>
        </div>

        <h1 className="text-5xl font-bold text-gradient-teal tracking-tight mb-2">{t('appName')}</h1>
        <p className="text-base text-slate-400 font-medium tracking-widest uppercase mb-1">{t('tagline')}</p>
        <p className="text-sm text-slate-500 font-mono">{t('promise')}</p>
      </div>

      {/* Role cards */}
      <div className="w-full max-w-4xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <p className="text-center text-slate-400 text-sm font-medium mb-6 uppercase tracking-widest">
          {t('selectRole')}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {ROLES.map(({ role, descKey, icon, color }, i) => (
            <button
              key={role}
              onClick={() => onSelectRole(role)}
              onMouseEnter={() => setHovered(role)}
              onMouseLeave={() => setHovered(null)}
              className={`group relative p-5 rounded-2xl border bg-gradient-to-br cursor-pointer text-left transition-all duration-300 ${color} ${hovered === role ? 'scale-105 shadow-2xl' : 'scale-100'}`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <span className="text-3xl mb-3 block">{icon}</span>
              <p className="font-semibold text-white text-sm mb-1">{t(`roles.${role}`)}</p>
              <p className="text-xs text-slate-400 leading-relaxed">{t(descKey)}</p>
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span className="text-xs text-cyan-400 font-mono">→</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Extension dashboards */}
      <div className="mt-8 flex gap-3 flex-wrap justify-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        {EXTENSION_ROLES.map(({ role, labelKey, icon }) => (
          <button
            key={role}
            onClick={() => onSelectRole(role)}
            className="px-4 py-2 rounded-xl glass border border-white/10 hover:border-cyan-400/30 text-sm text-slate-400 hover:text-white transition-all duration-200 flex items-center gap-2"
          >
            <span>{icon}</span> {t(labelKey)}
          </button>
        ))}
      </div>

      {/* Footer */}
      <p className="mt-10 text-xs text-slate-600 font-mono animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        {t('version')}
      </p>
    </div>
  )
}
