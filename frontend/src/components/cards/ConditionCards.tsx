const CONDITIONS = [
  { id: 'waves', label: 'Wave Height', value: '1.8', unit: 'm', icon: '🌊', sub: 'Significant wave height', color: 'text-cyan-400', trend: '+0.2m', trendUp: true },
  { id: 'wind', label: 'Wind Speed', value: '22', unit: 'km/h', icon: '💨', sub: 'SW direction', color: 'text-blue-400', trend: 'SW', trendUp: false },
  { id: 'sst', label: 'Sea Temp', value: '28.4', unit: '°C', icon: '🌡️', sub: 'Surface temp (SST)', color: 'text-orange-400', trend: '+0.3°', trendUp: true },
  { id: 'chl', label: 'Chlorophyll', value: '0.8', unit: 'mg/m³', icon: '🟢', sub: 'Ocean productivity', color: 'text-emerald-400', trend: 'Medium', trendUp: false },
  { id: 'tide', label: 'Tide', value: '2.3', unit: 'm', icon: '🌊', sub: 'High tide at 14:30', color: 'text-violet-400', trend: '↑ Rising', trendUp: true },
  { id: 'vis', label: 'Visibility', value: '8', unit: 'km', icon: '👁️', sub: 'Good visibility', color: 'text-slate-300', trend: 'Good', trendUp: false },
]

export default function ConditionCards() {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {CONDITIONS.map((c, i) => (
        <div
          key={c.id}
          className="glass rounded-xl border border-white/5 hover:border-cyan-400/20 p-3 flex-shrink-0 w-32 cursor-pointer transition-all duration-200 hover:scale-105 animate-fade-in-up"
          style={{ animationDelay: `${i * 0.06}s` }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-base">{c.icon}</span>
            <span className={`text-[10px] font-mono ${c.trendUp ? 'text-emerald-400' : 'text-slate-500'}`}>{c.trend}</span>
          </div>
          <p className={`text-xl font-bold ${c.color} leading-none`}>
            {c.value}<span className="text-xs font-normal text-slate-500 ml-0.5">{c.unit}</span>
          </p>
          <p className="text-[10px] text-slate-500 mt-1 leading-tight">{c.label}</p>
          <p className="text-[9px] text-slate-600 mt-0.5">{c.sub}</p>
        </div>
      ))}
      {/* Source tag */}
      <div className="flex-shrink-0 flex items-center px-2">
        <p className="text-[9px] text-slate-600 font-mono writing-mode-vertical transform rotate-90 whitespace-nowrap">
          INCOIS · IMD · MOSDAC
        </p>
      </div>
    </div>
  )
}
