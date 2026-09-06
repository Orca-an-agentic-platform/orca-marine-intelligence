import { useState } from 'react'

interface Props {
  text: string
  severity: 'info' | 'moderate' | 'danger' | 'critical'
  onDismiss: () => void
}

const COLORS = {
  info: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
  moderate: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
  danger: 'bg-red-500/10 border-red-500/30 text-red-300',
  critical: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
}
const ICONS = { info: 'ℹ️', moderate: '⚠️', danger: '🚨', critical: '🆘' }

export default function AlertBanner({ text, severity, onDismiss }: Props) {
  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 border-b text-xs font-medium ${COLORS[severity]} animate-fade-in-up`}>
      <span>{ICONS[severity]}</span>
      <span className="flex-1">{text}</span>
      <span className="text-[10px] opacity-60 font-mono">IMD · INCOIS</span>
      <button onClick={onDismiss} className="opacity-50 hover:opacity-100 transition-opacity ml-2 text-base leading-none">×</button>
    </div>
  )
}
