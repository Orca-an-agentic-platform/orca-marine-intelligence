import { useState } from 'react'
import { UserRole } from '../types'

const ROLES: { role: UserRole; label: string; desc: string; icon: string; color: string }[] = [
  { role: 'fisherman', label: 'Fisherman', desc: 'PFZ, weather, Go/No-Go, offline', icon: '🎣', color: 'from-cyan-500/20 to-teal-500/10 border-cyan-500/30 hover:border-cyan-400/60' },
  { role: 'coastal_authority', label: 'Coastal Authority', desc: 'Vessel tracking, geofencing, incidents', icon: '⚓', color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30 hover:border-blue-400/60' },
  { role: 'disaster_management', label: 'Disaster Management', desc: 'Hazard intel, response prioritisation', icon: '🚨', color: 'from-red-500/20 to-orange-500/10 border-red-500/30 hover:border-red-400/60' },
  { role: 'maritime_operator', label: 'Maritime Operator', desc: 'Route planning, sea-state scheduling', icon: '🚢', color: 'from-violet-500/20 to-purple-500/10 border-violet-500/30 hover:border-violet-400/60' },
  { role: 'researcher', label: 'Researcher', desc: 'Historical analysis, data export', icon: '🔬', color: 'from-emerald-500/20 to-green-500/10 border-emerald-500/30 hover:border-emerald-400/60' },
  { role: 'shipping_operator', label: 'Shipping Operator', desc: 'Port conditions, route optimisation', icon: '📦', color: 'from-amber-500/20 to-yellow-500/10 border-amber-500/30 hover:border-amber-400/60' },
]

export default function Landing({ onSelectRole }: { onSelectRole: (r: UserRole) => void }) {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div className="ocean-mesh min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl animate-pulse-teal pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-teal-400/5 blur-3xl animate-float pointer-events-none" />

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

        <h1 className="text-5xl font-bold text-gradient-teal tracking-tight mb-2">ORCA</h1>
        <p className="text-base text-slate-400 font-medium tracking-widest uppercase mb-1">
          Marine EcOsystem Reasoning with Collaborative Agents
        </p>
        <p className="text-sm text-slate-500 font-mono">
          Reliable Decisions · Safer Operations · Stronger Impact
        </p>
      </div>

      {/* Role selector */}
      <div className="w-full max-w-4xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <p className="text-center text-slate-400 text-sm font-medium mb-6 uppercase tracking-widest">
          Select your role to continue
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {ROLES.map(({ role, label, desc, icon, color }, i) => (
            <button
              key={role}
              onClick={() => onSelectRole(role)}
              onMouseEnter={() => setHovered(role)}
              onMouseLeave={() => setHovered(null)}
              className={`
                group relative p-5 rounded-2xl border bg-gradient-to-br cursor-pointer text-left
                transition-all duration-300 ${color}
                ${hovered === role ? 'scale-105 shadow-2xl' : 'scale-100'}
              `}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <span className="text-3xl mb-3 block">{icon}</span>
              <p className="font-semibold text-white text-sm mb-1">{label}</p>
              <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span className="text-xs text-cyan-400 font-mono">Enter →</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Extension dashboards */}
      <div className="mt-8 flex gap-3 flex-wrap justify-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        {[
          { role: 'fisheries_dept' as UserRole, label: 'Fisheries', icon: '🐟' },
          { role: 'marketplace' as UserRole, label: 'Marketplace', icon: '🏪' },
          { role: 'institutional_researcher' as UserRole, label: 'Marine Analysis', icon: '📊' },
          { role: 'admin' as UserRole, label: 'Logistics', icon: '🏭' },
        ].map(({ role, label, icon }) => (
          <button
            key={role}
            onClick={() => onSelectRole(role)}
            className="px-4 py-2 rounded-xl glass border border-white/10 hover:border-cyan-400/30 text-sm text-slate-400 hover:text-white transition-all duration-200 flex items-center gap-2"
          >
            <span>{icon}</span> {label}
          </button>
        ))}
      </div>

      {/* Footer */}
      <p className="mt-10 text-xs text-slate-600 font-mono animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        SIH26176 · Team TechnoCrakerz · v0.1.0
      </p>
    </div>
  )
}
