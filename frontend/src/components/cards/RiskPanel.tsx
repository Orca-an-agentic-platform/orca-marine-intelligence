import { useState } from 'react'
import { UserRole } from '../../types'

const EVIDENCE = [
  { claim: 'Wave height 1.8m', source: 'INCOIS OSF', time: '23:00 IST', official: false },
  { claim: 'Wind 22 km/h SW', source: 'IMD Forecast', time: '22:30 IST', official: false },
  { claim: 'No active cyclone', source: 'RSMC New Delhi', time: '21:00 IST', official: true },
  { claim: 'PFZ 12.5km SW', source: 'INCOIS PFZ WebGIS', time: '06:00 IST', official: false },
  { claim: 'Lightning risk LOW', source: 'IMD LDN', time: '22:00 IST', official: false },
]

export default function RiskPanel({ role }: { role: UserRole }) {
  const [tab, setTab] = useState<'risk' | 'evidence' | 'alerts'>('risk')
  const riskLevel = 'MODERATE'
  const riskScore = 35
  const goNoGo = 'CAUTION'

  const goColor = goNoGo === 'GO' ? 'go-badge' : goNoGo === 'CAUTION' ? 'caution-badge' : 'nogo-badge'
  const riskColor = riskLevel === 'LOW' ? 'risk-low' : riskLevel === 'MODERATE' ? 'risk-moderate' : riskLevel === 'HIGH' ? 'risk-high' : 'risk-critical'

  return (
    <div className="glass rounded-2xl border border-white/5 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-white">Risk Assessment</p>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${riskColor}`}>{riskLevel}</span>
        </div>

        {/* Risk score bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500">Risk Score</span>
            <span className="text-amber-400 font-mono font-bold">{riskScore}/100</span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${riskScore}%`,
                background: riskScore < 25 ? 'linear-gradient(90deg,#06ffa5,#00d4ff)' : riskScore < 50 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : riskScore < 75 ? 'linear-gradient(90deg,#ef4444,#f97316)' : 'linear-gradient(90deg,#7c3aed,#ef4444)',
              }}
            />
          </div>
        </div>

        {/* Go/No-Go — fisherman only */}
        {['fisherman', 'maritime_operator', 'shipping_operator'].includes(role) && (
          <div className={`flex items-center justify-between px-3 py-2 rounded-xl border text-sm font-bold ${goColor}`}>
            <span>{goNoGo === 'GO' ? '✅' : goNoGo === 'CAUTION' ? '⚠️' : '🚫'}</span>
            <span>{goNoGo}</span>
            <span className="text-xs font-normal opacity-70">for departure</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5">
        {(['risk', 'evidence', 'alerts'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${tab === t ? 'text-cyan-400 border-b border-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {tab === 'risk' && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 mb-2">Risk Factors</p>
            {[
              { name: 'Wave Height', value: '1.8m', contribution: 'neutral', icon: '🌊' },
              { name: 'Wind Speed', value: '22 km/h', contribution: 'neutral', icon: '💨' },
              { name: 'SW Monsoon Active', value: 'Seasonal', contribution: 'increased', icon: '☁️' },
              { name: 'PFZ Available', value: '12.5km SW', contribution: 'decreased', icon: '🎯' },
              { name: 'No Cyclone', value: 'Clear', contribution: 'decreased', icon: '✅' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-xl glass border border-white/5">
                <span className="text-base">{f.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white font-medium truncate">{f.name}</p>
                  <p className="text-[10px] text-slate-500">{f.value}</p>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  f.contribution === 'increased' ? 'bg-red-500/10 text-red-400' :
                  f.contribution === 'decreased' ? 'bg-emerald-500/10 text-emerald-400' :
                  'bg-white/5 text-slate-400'
                }`}>
                  {f.contribution === 'increased' ? '↑' : f.contribution === 'decreased' ? '↓' : '—'}
                </span>
              </div>
            ))}
            <div className="mt-3 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[10px] text-amber-400/80 leading-relaxed">
              ⚠️ Risk assessment based on available data at time of query. Conditions may change. Always verify with local authorities before venturing to sea.
            </div>
          </div>
        )}

        {tab === 'evidence' && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 mb-2">Data Sources & Evidence</p>
            {EVIDENCE.map((e, i) => (
              <div key={i} className="p-2.5 rounded-xl glass border border-white/5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-white font-medium">{e.claim}</p>
                  {e.official && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex-shrink-0">Official</span>}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-cyan-400">{e.source}</span>
                  <span className="text-[10px] text-slate-600">·</span>
                  <span className="text-[10px] text-slate-600 font-mono">{e.time}</span>
                </div>
              </div>
            ))}
            <p className="text-[10px] text-slate-600 text-center mt-2">Sample representative data — live feeds pending API access</p>
          </div>
        )}

        {tab === 'alerts' && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 mb-2">Active Alerts</p>
            {[
              { type: 'SW Monsoon Advisory', severity: 'WARNING', source: 'IMD', icon: '☁️', time: '18:00 IST' },
              { type: 'High Tide Alert', severity: 'INFO', source: 'INCOIS', icon: '🌊', time: '12:00 IST' },
            ].map((a, i) => (
              <div key={i} className={`p-2.5 rounded-xl border ${a.severity === 'WARNING' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-blue-500/5 border-blue-500/20'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{a.icon}</span>
                  <div className="flex-1">
                    <p className="text-xs text-white font-medium">{a.type}</p>
                    <p className="text-[10px] text-slate-500">{a.source} · {a.time}</p>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${a.severity === 'WARNING' ? 'border-amber-400/30 text-amber-400 bg-amber-400/5' : 'border-blue-400/30 text-blue-400 bg-blue-400/5'}`}>
                    {a.severity}
                  </span>
                </div>
              </div>
            ))}
            <div className="p-2.5 rounded-xl glass border border-white/5 text-center">
              <p className="text-xs text-emerald-400">✅ No cyclone or high-wave warnings</p>
              <p className="text-[10px] text-slate-600 mt-0.5">Last checked: 23:00 IST</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
