import React from 'react'
import { Shield, Radio, AlertTriangle, CloudLightning, Activity, Bell, Lock, Compass, Volume2 } from 'lucide-react'

interface GovHeaderProps {
  cycloneEmergency: boolean
  onToggleCyclone: () => void
  onOpenBroadcastModal: () => void
  activeSOSCount: number
  suspiciousVesselCount: number
  buoysOnline: number
  totalBuoys: number
  onTestVoiceAlert: () => void
}

export const GovHeader: React.FC<GovHeaderProps> = ({
  cycloneEmergency,
  onToggleCyclone,
  onOpenBroadcastModal,
  activeSOSCount,
  suspiciousVesselCount,
  buoysOnline,
  totalBuoys,
  onTestVoiceAlert
}) => {
  return (
    <header className="gov-header-wrapper">
      {/* National Tricolor Stripe */}
      <div className="national-stripe">
        <span className="stripe saffron"></span>
        <span className="stripe white"></span>
        <span className="stripe green"></span>
      </div>

      {/* Main Official Header Bar */}
      <div className="gov-header-main">
        <div className="gov-identity-block">
          {/* Government of India Ashoka Lion Emblem Emblem SVG */}
          <div className="emblem-container" title="Government of India Seal">
            <svg viewBox="0 0 100 100" className="ashoka-emblem" aria-label="National Emblem of India">
              <circle cx="50" cy="50" r="46" fill="none" stroke="#d4af37" strokeWidth="2.5" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="#d4af37" strokeWidth="1" strokeDasharray="3 3" />
              {/* Ashoka Chakra 24 spokes representation */}
              <circle cx="50" cy="50" r="14" fill="#0b2545" stroke="#00d2ff" strokeWidth="1.5" />
              {Array.from({ length: 24 }).map((_, i) => (
                <line
                  key={i}
                  x1="50"
                  y1="50"
                  x2={50 + 13 * Math.cos((i * 15 * Math.PI) / 180)}
                  y2={50 + 13 * Math.sin((i * 15 * Math.PI) / 180)}
                  stroke="#00d2ff"
                  strokeWidth="1"
                />
              ))}
              {/* Lions outline motif */}
              <path d="M36 28 Q50 18 64 28 Q60 42 50 44 Q40 42 36 28 Z" fill="#d4af37" opacity="0.9" />
              <rect x="42" y="66" width="16" height="4" fill="#d4af37" rx="2" />
              <text x="50" y="82" textAnchor="middle" fill="#d4af37" fontSize="7.5" fontWeight="bold" letterSpacing="0.5">
                सत्यमेव जयते
              </text>
            </svg>
          </div>

          <div className="gov-titles">
            <div className="gov-level-tag">
              <span className="tag-hi">भारत सरकार</span>
              <span className="tag-en">GOVERNMENT OF INDIA</span>
              <span className="security-tag">
                <Lock size={10} /> RESTRICTED — OFFICIAL COMMAND SYSTEM
              </span>
            </div>
            <h1 className="portal-main-heading">
              <span className="orca-acronym">ORCA</span>
              <span className="heading-divider">|</span>
              <span className="heading-title">National Maritime Intelligence & Coastal Defence Network</span>
            </h1>
            <p className="ministry-subtext">
              Ministry of Earth Sciences (MoES) & Department of Fisheries • INCOIS Hyderabad • Indian Coast Guard MRCC
            </p>
          </div>
        </div>

        {/* Telemetry & Quick Action Hub */}
        <div className="gov-actions-hub">
          {/* Status Metrics Bar */}
          <div className="telemetry-badges">
            <div className="badge-item" title="INCOIS Ocean Buoy Network Telemetry">
              <Activity size={14} className="badge-icon text-cyan" />
              <div className="badge-text">
                <span className="badge-label">INCOIS BUOYS</span>
                <span className="badge-val text-cyan">{buoysOnline}/{totalBuoys} ONLINE</span>
              </div>
            </div>

            <div className="badge-item" title="Unverified or Flagged Imposters in Territorial Waters">
              <Shield size={14} className={`badge-icon ${suspiciousVesselCount > 0 ? 'text-amber blink' : 'text-green'}`} />
              <div className="badge-text">
                <span className="badge-label">SECURITY RADAR</span>
                <span className={`badge-val ${suspiciousVesselCount > 0 ? 'text-amber' : 'text-green'}`}>
                  {suspiciousVesselCount} FLAGGED
                </span>
              </div>
            </div>

            <div className="badge-item" title="Active EPIRB/NavIC Maritime Distress Signals">
              <AlertTriangle size={14} className={`badge-icon ${activeSOSCount > 0 ? 'text-danger pulse' : 'text-muted'}`} />
              <div className="badge-text">
                <span className="badge-label">COAST GUARD SAR</span>
                <span className={`badge-val ${activeSOSCount > 0 ? 'text-danger font-bold' : 'text-muted'}`}>
                  {activeSOSCount} DISTRESS SOS
                </span>
              </div>
            </div>
          </div>

          {/* Government Direct Actions */}
          <div className="gov-btn-group">
            <button 
              className={`btn-gov-emergency ${cycloneEmergency ? 'active-crisis' : ''}`}
              onClick={onToggleCyclone}
              title="Demonstrates emergency response mode for disaster judges"
            >
              <CloudLightning size={16} />
              <span>{cycloneEmergency ? '⚡ CYCLONE PROTOCOL ACTIVE' : '⚡ SIMULATE CYCLONE'}</span>
            </button>

            <button 
              className="btn-gov-broadcast"
              onClick={onOpenBroadcastModal}
              title="Issue mass satellite and SMS bulletin to registered fishermen"
            >
              <Radio size={16} />
              <span>SATELLITE BROADCAST</span>
            </button>

            <button 
              className="btn-voice-quick"
              onClick={onTestVoiceAlert}
              title="Listen to Coastal Warning Audio Advisory"
            >
              <Volume2 size={16} />
              <span>VOICE ALERT</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Warning / Broadcast Ticker */}
      <div className={`gov-ticker-bar ${cycloneEmergency ? 'ticker-emergency' : ''}`}>
        <div className="ticker-label">
          <span className="pulse-dot"></span>
          {cycloneEmergency ? 'DEFCON-1 CYCLONE EMERGENCY :' : 'INCOIS MARITIME BULLETIN :'}
        </div>
        <div className="ticker-content">
          {cycloneEmergency ? (
            <span className="ticker-animated-text">
              🔴 SEVERE CYCLONE WARNING BOB-02: DEEP DEPRESSION OVER BAY OF BENGAL TO CROSS NORTH ODISHA-WEST BENGAL COASTS. WINDS 65-75 KTS, GUSTING TO 85 KTS. ALL VESSELS WITHIN 100 NM ORDERED IMMEDIATE HARBOR RECALL. IMBL PATROL BOATS ON RED ALERT.
            </span>
          ) : (
            <span className="ticker-animated-text">
              ⚠️ PALK BAY & GULF OF MANNAR: MODERATE SEA STATE (WAVE 1.2M - 1.6M). FISHERMEN WARNED NOT TO VENTURE WITHIN 5KM OF INTERNATIONAL MARITIME BOUNDARY LINE (IMBL). | 🛡️ RE-ALCRAFT BIOMETRIC SCAN MANDATORY AT CASHEW/RAMESWARAM PIERS.
            </span>
          )}
        </div>
        <div className="ticker-hotline">
          <span>EMERGENCY HELPLINE: COAST GUARD MRCC <strong>1554</strong> | DISASTER CONTROL <strong>1077</strong></span>
        </div>
      </div>
    </header>
  )
}
