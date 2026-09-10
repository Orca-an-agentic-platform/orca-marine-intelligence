import React from 'react'
import { Waves, Wind, Thermometer, Droplets, ArrowUp, Eye } from 'lucide-react'

interface ConditionCard {
  icon: React.ReactNode
  value: string
  unit: string
  label: string
  subtitle: string
  trend?: string
  trendColor?: string
  iconColor: string
  iconBg: string
}

const conditions: ConditionCard[] = [
  {
    icon: <Waves size={18} />,
    value: '1.8',
    unit: 'm',
    label: 'Wave Height',
    subtitle: 'Significant wave height',
    trend: '+0.2m',
    trendColor: '#38bdf8',
    iconColor: '#38bdf8',
    iconBg: 'rgba(56, 189, 248, 0.15)',
  },
  {
    icon: <Wind size={18} />,
    value: '22',
    unit: 'km/h',
    label: 'Wind Speed',
    subtitle: 'SW direction',
    trend: 'SW',
    trendColor: '#a78bfa',
    iconColor: '#a78bfa',
    iconBg: 'rgba(167, 139, 250, 0.15)',
  },
  {
    icon: <Thermometer size={18} />,
    value: '28.4',
    unit: '°C',
    label: 'Sea Temp',
    subtitle: 'Surface temp (SST)',
    trend: '+0.3°',
    trendColor: '#f97316',
    iconColor: '#f97316',
    iconBg: 'rgba(249, 115, 22, 0.15)',
  },
  {
    icon: <Droplets size={18} />,
    value: '0.8',
    unit: 'mg/m³',
    label: 'Chlorophyll',
    subtitle: 'Ocean productivity',
    trendColor: '#4ade80',
    iconColor: '#4ade80',
    iconBg: 'rgba(74, 222, 128, 0.15)',
  },
  {
    icon: <ArrowUp size={18} />,
    value: '2.3',
    unit: 'm',
    label: 'Tide',
    subtitle: 'High tide at 14:30',
    trend: '↑ Rising',
    trendColor: '#fbbf24',
    iconColor: '#fbbf24',
    iconBg: 'rgba(251, 191, 36, 0.15)',
  },
  {
    icon: <Eye size={18} />,
    value: '8',
    unit: 'km',
    label: 'Visibility',
    subtitle: 'Good visibility',
    trend: 'Good',
    trendColor: '#34d399',
    iconColor: '#34d399',
    iconBg: 'rgba(52, 211, 153, 0.15)',
  },
]

export const ConditionCards: React.FC = () => {
  return (
    <div className="fd-condition-cards">
      {conditions.map((c, i) => (
        <div key={i} className="condition-card">
          <div className="condition-card-icon" style={{ background: c.iconBg, color: c.iconColor }}>
            {c.icon}
          </div>
          <div className="condition-card-body">
            {c.trend && (
              <span className="condition-trend" style={{ color: c.trendColor }}>
                {c.trend}
              </span>
            )}
            <div className="condition-value">
              <span className="val">{c.value}</span>
              <span className="unit">{c.unit}</span>
            </div>
            <div className="condition-label">{c.label}</div>
            <div className="condition-subtitle">{c.subtitle}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
