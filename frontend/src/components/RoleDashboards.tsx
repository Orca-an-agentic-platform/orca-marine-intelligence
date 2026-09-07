import React, { useState, useEffect } from 'react'
import {
  Search,
  CloudSun,
  Waves,
  Wind,
  Fish,
  Thermometer,
  Leaf,
  Droplets,
  Activity,
  Shield,
  Radio,
  AlertTriangle,
  Compass,
  FileText,
  Settings,
  HelpCircle,
  Download,
  ExternalLink,
  MapPin,
  ArrowLeft,
  MessageSquare,
  Bot,
  Wifi,
  WifiOff,
  Navigation,
  Sparkles,
  Volume2,
  CheckCircle2,
  AlertOctagon,
  PhoneCall,
  Map,
  Clock,
  Send,
  Zap,
  RadioTower,
  Info
} from 'lucide-react'
import { isBackendAvailable } from '../api'
import { TacticalRadarMap } from './TacticalRadarMap'
import { AgentReasoningEngine } from './AgentReasoningEngine'
import { FLEET_VESSELS, INCOIS_BUOYS } from '../mockData'
import { Vessel, BuoyStation } from '../types'

interface RoleDashboardsProps {
  initialRole: 'Fishermen' | 'Researchers' | 'Coastal Authorities' | 'Disaster Management' | string
  onBackToHome: () => void
  onOpenAgentModal: () => void
}

export const RoleDashboards: React.FC<RoleDashboardsProps> = ({
  initialRole,
  onBackToHome,
  onOpenAgentModal
}) => {
  const [currentRole, setCurrentRole] = useState<string>(
    initialRole === 'Fishermen' ? 'Fisherman'
    : initialRole === 'Researchers' ? 'Researcher'
    : initialRole === 'Disaster Management' ? 'Disaster Management'
    : 'Coastal Authority'
  )

  const [activeSidebarItem, setActiveSidebarItem] = useState('Dashboard')
  const [liveBackend, setLiveBackend] = useState<boolean | null>(null)
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(FLEET_VESSELS[0])
  const [selectedBuoy, setSelectedBuoy] = useState<BuoyStation | null>(INCOIS_BUOYS[3])
  const [fishermanSubTab, setFishermanSubTab] = useState<'all' | 'map' | 'agent' | 'sos'>('all')
  const [sosSent, setSosSent] = useState(false)
  const [fishermanName, setFishermanName] = useState<string>('Captain Anthony Murugan')

  useEffect(() => {
    isBackendAvailable().then(avail => setLiveBackend(avail))
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('orca_fisherman_name')
    if (stored) {
      setFishermanName(stored)
    } else {
      try {
        const u = JSON.parse(localStorage.getItem('orca_current_user') || '{}')
        if (u.name) setFishermanName(u.name)
      } catch {}
    }
  }, [])

  const speakAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.lang = 'en-IN'
      window.speechSynthesis.speak(utterance)
    }
  }

  return (
    <div className="role-dashboard-shell">
      {/* ── Top Role Switcher Toolbar (Allows user to inspect all 4 dashboards easily) ── */}
      <div className="dashboard-role-switcher-strip">
        <div className="strip-left">
          <button className="btn-back-to-home" onClick={onBackToHome} title="Return to Portal Homepage">
            <ArrowLeft size={15} />
            <span>Back to Portal</span>
          </button>
          <span className="divider-v">|</span>
          <span className="strip-view-title">Active Role View:</span>
          
          <div className="role-tab-buttons">
            <button
              className={`role-tab-btn ${currentRole === 'Fisherman' ? 'active' : ''}`}
              onClick={() => { setCurrentRole('Fisherman'); setActiveSidebarItem('Dashboard'); }}
            >
              ⚓ Fisherman Dashboard
            </button>
            <button
              className={`role-tab-btn ${currentRole === 'Researcher' ? 'active' : ''}`}
              onClick={() => { setCurrentRole('Researcher'); setActiveSidebarItem('Dashboard'); }}
            >
              🔬 Researcher Dashboard
            </button>
            <button
              className={`role-tab-btn ${currentRole === 'Coastal Authority' ? 'active' : ''}`}
              onClick={() => { setCurrentRole('Coastal Authority'); setActiveSidebarItem('Dashboard'); }}
            >
              🛡️ Coastal Authority Dashboard
            </button>
            <button
              className={`role-tab-btn ${currentRole === 'Disaster Management' ? 'active' : ''}`}
              onClick={() => { setCurrentRole('Disaster Management'); setActiveSidebarItem('Dashboard'); }}
            >
              ⚠️ Disaster Management Dashboard
            </button>
          </div>
        </div>

        <div className="strip-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 600,
              background: liveBackend ? 'rgba(6, 78, 59, 0.4)' : 'rgba(120, 53, 15, 0.4)',
              border: liveBackend ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(251, 191, 36, 0.3)',
              color: liveBackend ? '#6ee7b7' : '#fcd34d',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: liveBackend ? '#34d399' : '#fbbf24' }} />
            <span>{liveBackend ? 'API Live' : 'Local'}</span>
          </div>

          <button className="btn-ask-orca-header" onClick={onOpenAgentModal}>
            <Bot size={16} />
            <span>Ask ORCA (AI Agent)</span>
          </button>
        </div>
      </div>

      {/* ── Main Dashboard Layout (Sidebar + Main Content) ── */}
      <div className="dashboard-body-container">
        {/* ── 1. Left Sidebar (Dark Navy Theme) ── */}
        <aside className="dashboard-sidebar">
          <div className="sidebar-brand-row">
            <div className="sidebar-logo">
              <svg viewBox="0 0 40 28" className="sidebar-wave-svg" aria-label="ORCA Wave Mark">
                <path d="M4 18 Q 14 10 24 18 T 36 18" fill="none" stroke="#0070f3" strokeWidth="3" strokeLinecap="round" />
                <path d="M8 12 Q 18 5 28 12 T 38 12" fill="none" stroke="#0099ff" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
                <path d="M12 6 Q 22 1 32 6" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
              </svg>
              <span className="sidebar-brand-name">ORCA</span>
            </div>
          </div>

          {/* User Profile Info */}
          <div className="sidebar-user-card">
            <div className="user-avatar-circle">
              <span>{currentRole[0]}</span>
            </div>
            <div className="user-meta">
              <span className="user-role-label">{currentRole}</span>
              <span className="user-timestamp">Sat, 6 Sep 2026 | 10:24 AM</span>
            </div>
          </div>

          {/* Nav Items (Role Specific) */}
          <nav className="sidebar-nav-menu">
            {currentRole === 'Fisherman' && (
              <>
                <button
                  className={`nav-menu-btn ${fishermanSubTab === 'all' && activeSidebarItem === 'Dashboard' ? 'active' : ''}`}
                  onClick={() => { setActiveSidebarItem('Dashboard'); setFishermanSubTab('all'); }}
                >
                  <span className="menu-icon">📊</span> Overview Console
                </button>
                <button
                  className={`nav-menu-btn ${fishermanSubTab === 'map' ? 'active' : ''}`}
                  onClick={() => { setActiveSidebarItem('Fishing Zones'); setFishermanSubTab('map'); }}
                >
                  <span className="menu-icon">🗺️</span> Location Radar Map
                </button>
                <button
                  className={`nav-menu-btn ${fishermanSubTab === 'agent' ? 'active' : ''}`}
                  onClick={() => { setActiveSidebarItem('Ask ORCA'); setFishermanSubTab('agent'); }}
                >
                  <span className="menu-icon">🤖</span> Ask ORCA AI Agent
                </button>
                <button
                  className={`nav-menu-btn ${fishermanSubTab === 'sos' ? 'active' : ''}`}
                  onClick={() => { setActiveSidebarItem('Emergency SOS'); setFishermanSubTab('sos'); }}
                >
                  <span className="menu-icon">🚨</span> Emergency Distress SOS
                </button>
                <button
                  className={`nav-menu-btn ${activeSidebarItem === 'Settings' ? 'active' : ''}`}
                  onClick={() => setActiveSidebarItem('Settings')}
                >
                  <span className="menu-icon">⚙️</span> Settings
                </button>
              </>
            )}

            {currentRole === 'Researcher' && (
              <>
                <button className={`nav-menu-btn ${activeSidebarItem === 'Dashboard' ? 'active' : ''}`} onClick={() => setActiveSidebarItem('Dashboard')}>
                  <span className="menu-icon">📊</span> Dashboard
                </button>
                <button className={`nav-menu-btn ${activeSidebarItem === 'Data Explorer' ? 'active' : ''}`} onClick={() => setActiveSidebarItem('Data Explorer')}>
                  <span className="menu-icon">🔍</span> Data Explorer
                </button>
                <button className={`nav-menu-btn ${activeSidebarItem === 'Satellite Data' ? 'active' : ''}`} onClick={() => setActiveSidebarItem('Satellite Data')}>
                  <span className="menu-icon">🛰️</span> Satellite Data
                </button>
                <button className={`nav-menu-btn ${activeSidebarItem === 'Ocean Models' ? 'active' : ''}`} onClick={() => setActiveSidebarItem('Ocean Models')}>
                  <span className="menu-icon">📈</span> Ocean Models
                </button>
                <button className={`nav-menu-btn ${activeSidebarItem === 'Download Data' ? 'active' : ''}`} onClick={() => setActiveSidebarItem('Download Data')}>
                  <span className="menu-icon">⬇️</span> Download Data
                </button>
                <button className={`nav-menu-btn ${activeSidebarItem === 'Visualization Tools' ? 'active' : ''}`} onClick={() => setActiveSidebarItem('Visualization Tools')}>
                  <span className="menu-icon">📉</span> Visualization Tools
                </button>
                <button className="nav-menu-btn" onClick={onOpenAgentModal}>
                  <span className="menu-icon">🤖</span> Ask ORCA
                </button>
                <button className={`nav-menu-btn ${activeSidebarItem === 'Saved Workspace' ? 'active' : ''}`} onClick={() => setActiveSidebarItem('Saved Workspace')}>
                  <span className="menu-icon">📁</span> Saved Workspace
                </button>
                <button className={`nav-menu-btn ${activeSidebarItem === 'Settings' ? 'active' : ''}`} onClick={() => setActiveSidebarItem('Settings')}>
                  <span className="menu-icon">⚙️</span> Settings
                </button>
              </>
            )}

            {currentRole === 'Coastal Authority' && (
              <>
                <button className={`nav-menu-btn ${activeSidebarItem === 'Dashboard' ? 'active' : ''}`} onClick={() => setActiveSidebarItem('Dashboard')}>
                  <span className="menu-icon">📊</span> Dashboard
                </button>
                <button className={`nav-menu-btn ${activeSidebarItem === 'Coastal Monitoring' ? 'active' : ''}`} onClick={() => setActiveSidebarItem('Coastal Monitoring')}>
                  <span className="menu-icon">🛡️</span> Coastal Monitoring
                </button>
                <button className={`nav-menu-btn ${activeSidebarItem === 'Weather & Alerts' ? 'active' : ''}`} onClick={() => setActiveSidebarItem('Weather & Alerts')}>
                  <span className="menu-icon">⛅</span> Weather & Alerts
                </button>
                <button className={`nav-menu-btn ${activeSidebarItem === 'Vessel Tracking' ? 'active' : ''}`} onClick={() => setActiveSidebarItem('Vessel Tracking')}>
                  <span className="menu-icon">🚢</span> Vessel Tracking
                </button>
                <button className={`nav-menu-btn ${activeSidebarItem === 'Risk Assessment' ? 'active' : ''}`} onClick={() => setActiveSidebarItem('Risk Assessment')}>
                  <span className="menu-icon">⚠️</span> Risk Assessment
                </button>
                <button className={`nav-menu-btn ${activeSidebarItem === 'Incident Reporting' ? 'active' : ''}`} onClick={() => setActiveSidebarItem('Incident Reporting')}>
                  <span className="menu-icon">🚨</span> Incident Reporting
                </button>
                <button className="nav-menu-btn" onClick={onOpenAgentModal}>
                  <span className="menu-icon">🤖</span> Ask ORCA
                </button>
                <button className={`nav-menu-btn ${activeSidebarItem === 'Reports' ? 'active' : ''}`} onClick={() => setActiveSidebarItem('Reports')}>
                  <span className="menu-icon">📄</span> Reports
                </button>
                <button className={`nav-menu-btn ${activeSidebarItem === 'Settings' ? 'active' : ''}`} onClick={() => setActiveSidebarItem('Settings')}>
                  <span className="menu-icon">⚙️</span> Settings
                </button>
              </>
            )}

            {currentRole === 'Disaster Management' && (
              <>
                <button className={`nav-menu-btn ${activeSidebarItem === 'Dashboard' ? 'active' : ''}`} onClick={() => setActiveSidebarItem('Dashboard')}>
                  <span className="menu-icon">📊</span> Dashboard
                </button>
                <button className={`nav-menu-btn ${activeSidebarItem === 'Early Warnings' ? 'active' : ''}`} onClick={() => setActiveSidebarItem('Early Warnings')}>
                  <span className="menu-icon">🔔</span> Early Warnings
                </button>
                <button className={`nav-menu-btn ${activeSidebarItem === 'Cyclone Tracking' ? 'active' : ''}`} onClick={() => setActiveSidebarItem('Cyclone Tracking')}>
                  <span className="menu-icon">🌪️</span> Cyclone Tracking
                </button>
                <button className={`nav-menu-btn ${activeSidebarItem === 'Weather Forecast' ? 'active' : ''}`} onClick={() => setActiveSidebarItem('Weather Forecast')}>
                  <span className="menu-icon">⛅</span> Weather Forecast
                </button>
                <button className={`nav-menu-btn ${activeSidebarItem === 'Vessel Monitoring' ? 'active' : ''}`} onClick={() => setActiveSidebarItem('Vessel Monitoring')}>
                  <span className="menu-icon">🚢</span> Vessel Monitoring
                </button>
                <button className={`nav-menu-btn ${activeSidebarItem === 'Risk Maps' ? 'active' : ''}`} onClick={() => setActiveSidebarItem('Risk Maps')}>
                  <span className="menu-icon">🗺️</span> Risk Maps
                </button>
                <button className={`nav-menu-btn ${activeSidebarItem === 'Incident Reports' ? 'active' : ''}`} onClick={() => setActiveSidebarItem('Incident Reports')}>
                  <span className="menu-icon">📑</span> Incident Reports
                </button>
                <button className="nav-menu-btn" onClick={onOpenAgentModal}>
                  <span className="menu-icon">🤖</span> Ask ORCA
                </button>
                <button className={`nav-menu-btn ${activeSidebarItem === 'Settings' ? 'active' : ''}`} onClick={() => setActiveSidebarItem('Settings')}>
                  <span className="menu-icon">⚙️</span> Settings
                </button>
              </>
            )}


          </nav>

          {/* Need Help Footer */}
          <div className="sidebar-help-box" onClick={onOpenAgentModal}>
            <div className="help-icon-wrap">🎧</div>
            <div className="help-text">
              <span className="help-title">Need Help?</span>
              <span className="help-link">Ask ORCA AI</span>
            </div>
          </div>
        </aside>

        {/* ── 2. Main Dashboard Content View (White/Clean layout) ── */}
        <main className="dashboard-main-pane">
          {/* Top Header with Search Bar */}
          <div className="dashboard-content-header">
            <div className="header-search-bar">
              <input type="text" placeholder="Search..." />
              <Search size={16} className="search-icon" />
            </div>
          </div>

          {/* ════ VIEW 1: FISHERMAN REAL-TIME MISSION DASHBOARD ════ */}
          {currentRole === 'Fisherman' && (
            <div className="role-view-content fisherman-realtime-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* 1. Header Greeting & Real-Time Telemetry Ribbon */}
              <div 
                style={{
                  background: 'linear-gradient(135deg, #061e38 0%, #082d54 50%, #0c3b6d 100%)',
                  borderRadius: '12px',
                  padding: '20px 24px',
                  border: '1px solid rgba(0, 194, 212, 0.3)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '24px' }}>⚓</span>
                      <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.3px' }}>
                        Welcome, {fishermanName}!
                      </h2>
                      <span 
                        style={{
                          background: 'rgba(34, 197, 94, 0.15)',
                          color: '#4ade80',
                          border: '1px solid rgba(34, 197, 94, 0.3)',
                          padding: '2px 10px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono, monospace)'
                        }}
                      >
                        RECOGNISED VESSEL MASTER
                      </span>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
                      Craft: <strong style={{ color: '#38bdf8' }}>IND-TN-04-MM-1204 (M/V Matsya Sugandhi)</strong> • Port of Origin: <strong style={{ color: '#e2e8f0' }}>Rameswaram Fisheries Harbor</strong> • 180HP Mechanized Trawler
                    </p>
                  </div>

                  {/* Quick Sub-Tab Selector */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setFishermanSubTab('all')}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s',
                        background: fishermanSubTab === 'all' ? '#00c2d4' : 'rgba(255, 255, 255, 0.08)',
                        color: fishermanSubTab === 'all' ? '#031b2b' : '#cbd5e1',
                        border: fishermanSubTab === 'all' ? '1px solid #00c2d4' : '1px solid rgba(255, 255, 255, 0.15)',
                      }}
                    >
                      <span>📊</span> All-in-One Console
                    </button>
                    <button
                      onClick={() => setFishermanSubTab('map')}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s',
                        background: fishermanSubTab === 'map' ? '#00c2d4' : 'rgba(255, 255, 255, 0.08)',
                        color: fishermanSubTab === 'map' ? '#031b2b' : '#cbd5e1',
                        border: fishermanSubTab === 'map' ? '1px solid #00c2d4' : '1px solid rgba(255, 255, 255, 0.15)',
                      }}
                    >
                      <Map size={14} /> Location Radar Map
                    </button>
                    <button
                      onClick={() => setFishermanSubTab('agent')}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s',
                        background: fishermanSubTab === 'agent' ? '#00c2d4' : 'rgba(255, 255, 255, 0.08)',
                        color: fishermanSubTab === 'agent' ? '#031b2b' : '#cbd5e1',
                        border: fishermanSubTab === 'agent' ? '1px solid #00c2d4' : '1px solid rgba(255, 255, 255, 0.15)',
                      }}
                    >
                      <Bot size={14} /> Ask ORCA AI Agent
                    </button>
                    <button
                      onClick={() => setFishermanSubTab('sos')}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s',
                        background: fishermanSubTab === 'sos' ? '#ef4444' : 'rgba(239, 68, 68, 0.15)',
                        color: fishermanSubTab === 'sos' ? '#ffffff' : '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                      }}
                    >
                      <AlertOctagon size={14} /> Distress SOS
                    </button>
                  </div>
                </div>

                {/* Real-Time Telemetry Badges Strip */}
                <div 
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '10px',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(0, 0, 0, 0.35)',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono, monospace)',
                      color: '#38bdf8',
                      border: '1px solid rgba(56, 189, 248, 0.25)'
                    }}
                  >
                    <Navigation size={13} className="text-cyan animate-pulse" />
                    <span>GPS FIX: 9.3800°N, 79.4800°E (Palk Strait)</span>
                  </div>

                  <div 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono, monospace)',
                      color: '#34d399',
                      border: '1px solid rgba(52, 211, 153, 0.3)'
                    }}
                  >
                    <Shield size={13} />
                    <span>IMBL STANDOFF: 8.4 km WEST (SAFE BUFFER &gt; 5km)</span>
                  </div>

                  <div 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(0, 0, 0, 0.35)',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono, monospace)',
                      color: '#a5b4fc',
                      border: '1px solid rgba(165, 180, 252, 0.25)'
                    }}
                  >
                    <RadioTower size={13} />
                    <span>DAT-SG BEACON #91823: BROADCASTING (100% BATTERY)</span>
                  </div>

                  <div 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(234, 179, 8, 0.15)',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono, monospace)',
                      color: '#facc15',
                      border: '1px solid rgba(250, 204, 21, 0.3)'
                    }}
                  >
                    <Fish size={13} />
                    <span>PFZ VECTOR: 12.4 km SE (HIGH PELAGIC CATCH)</span>
                  </div>
                </div>
              </div>

              {/* 2. Real-Time Ocean State Metrics (Live INCOIS Buoy WRB-RAM) */}
              <div className="dashboard-metrics-4">
                <div className="dash-metric-card" style={{ borderLeft: '4px solid #38bdf8' }}>
                  <div className="metric-icon-box blue-soft">
                    <CloudSun size={20} />
                  </div>
                  <div className="metric-text-wrap">
                    <span className="card-lbl">Weather Condition</span>
                    <span className="card-val" style={{ color: '#38bdf8' }}>Moderate / Clear</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>31°C • Vis 10nm</span>
                  </div>
                </div>

                <div className="dash-metric-card" style={{ borderLeft: '4px solid #34d399' }}>
                  <div className="metric-icon-box green-soft">
                    <Waves size={20} />
                  </div>
                  <div className="metric-text-wrap">
                    <span className="card-lbl">Sig. Wave Height</span>
                    <span className="card-val" style={{ color: '#34d399' }}>0.9 m (Safe)</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Threshold &lt; 2.0m • Period 4.8s</span>
                  </div>
                </div>

                <div className="dash-metric-card" style={{ borderLeft: '4px solid #00c2d4' }}>
                  <div className="metric-icon-box blue-soft">
                    <Wind size={20} />
                  </div>
                  <div className="metric-text-wrap">
                    <span className="card-lbl">Wind Speed</span>
                    <span className="card-val">11.0 knots</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>19.8 km/h SSW • Gusts 16 kts</span>
                  </div>
                </div>

                <div className="dash-metric-card" style={{ borderLeft: '4px solid #a855f7' }}>
                  <div className="metric-icon-box purple-soft">
                    <Fish size={20} />
                  </div>
                  <div className="metric-text-wrap">
                    <span className="card-lbl">INCOIS PFZ Hotspots</span>
                    <span className="card-val text-blue">3 Active Zones</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Chl: 0.85 mg/m³ • Mackerel / Sardine</span>
                  </div>
                </div>
              </div>

              {/* 3. Emergency SOS View (When activated) */}
              {fishermanSubTab === 'sos' && (
                <div 
                  style={{
                    background: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)',
                    borderRadius: '12px',
                    padding: '24px',
                    border: '1px solid #ef4444',
                    color: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <AlertOctagon size={32} className="text-red-400 animate-pulse" />
                    <div>
                      <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>
                        Maritime Distress &amp; SOS Beacon (MRCC Chennai Broadcast)
                      </h3>
                      <p style={{ margin: 0, color: '#fca5a5', fontSize: '13px' }}>
                        Transmits direct emergency packet with GPS coordinates to Indian Coast Guard and Coastal Security Police.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#fca5a5', display: 'block' }}>Emergency VHF Channel</span>
                      <strong style={{ fontSize: '16px' }}>CH 16 (156.800 MHz)</strong>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#fca5a5', display: 'block' }}>Indian Coast Guard Toll Free</span>
                      <strong style={{ fontSize: '16px' }}>1554 (MRCC)</strong>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#fca5a5', display: 'block' }}>Marine Police Helpline</span>
                      <strong style={{ fontSize: '16px' }}>1093 (Coastal)</strong>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#fca5a5', display: 'block' }}>Distress Coordinates</span>
                      <strong style={{ fontSize: '16px', fontFamily: 'var(--font-mono)' }}>9.3800°N, 79.4800°E</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
                    <button
                      onClick={() => setSosSent(!sosSent)}
                      style={{
                        padding: '14px 28px',
                        background: sosSent ? '#22c55e' : '#dc2626',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        boxShadow: '0 0 20px rgba(220, 38, 38, 0.5)'
                      }}
                    >
                      <PhoneCall size={18} />
                      {sosSent ? '✅ SOS BEACON ACTIVE — MRCC DISPATCHED' : '🚨 TRANSMIT EMERGENCY DISTRESS BEACON'}
                    </button>
                    {sosSent && (
                      <span style={{ color: '#86efac', fontSize: '13px', fontWeight: 600 }}>
                        MRCC Chennai has logged your distress beacon. Coast Guard QRT Mandapam notified.
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* 4. Feature: REAL-TIME LOCATION & TACTICAL RADAR MAP */}
              {(fishermanSubTab === 'all' || fishermanSubTab === 'map') && (
                <div 
                  style={{
                    background: '#041224',
                    borderRadius: '12px',
                    padding: '18px',
                    border: '1px solid rgba(0, 194, 212, 0.25)',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Map size={20} className="text-cyan" />
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                          Real-Time Maritime Location &amp; Tactical Radar (GIS)
                        </h3>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#94a3b8' }}>
                        Live georeferenced position tracking for your craft, Indo-Sri Lanka IMBL border standoff, and INCOIS Potential Fishing Zones (PFZ).
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span 
                        style={{
                          background: 'rgba(56, 189, 248, 0.15)',
                          color: '#38bdf8',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontFamily: 'var(--font-mono, monospace)',
                          fontWeight: 700
                        }}
                      >
                        Sector: Palk Strait &amp; Gulf of Mannar
                      </span>
                    </div>
                  </div>

                  {/* The Full Tactical Interactive Radar Map */}
                  <TacticalRadarMap
                    vessels={FLEET_VESSELS}
                    buoys={INCOIS_BUOYS}
                    cycloneActive={false}
                    onSelectVessel={(v) => setSelectedVessel(v)}
                    onSelectBuoy={(b) => setSelectedBuoy(b)}
                    selectedVessel={selectedVessel}
                    selectedBuoy={selectedBuoy}
                  />

                  {/* Selected Object Telemetry Drawer if clicked */}
                  {selectedVessel && (
                    <div 
                      style={{
                        background: 'rgba(6, 26, 50, 0.85)',
                        border: '1px solid rgba(0, 194, 212, 0.3)',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px',
                        fontSize: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Navigation size={18} className="text-cyan" />
                        <div>
                          <strong style={{ color: '#ffffff', fontSize: '13px' }}>{selectedVessel.name}</strong>
                          <span style={{ color: '#94a3b8', marginLeft: '8px' }}>({selectedVessel.registrationNo})</span>
                          <div style={{ color: '#cbd5e1', fontSize: '11.5px', marginTop: '2px' }}>
                            Master: {selectedVessel.ownerName} • Type: {selectedVessel.vesselType} ({selectedVessel.engineHp} HP)
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '16px', fontFamily: 'var(--font-mono, monospace)' }}>
                        <div><span style={{ color: '#94a3b8' }}>Coords:</span> <span style={{ color: '#38bdf8' }}>{selectedVessel.currentLat.toFixed(2)}°N, {selectedVessel.currentLon.toFixed(2)}°E</span></div>
                        <div><span style={{ color: '#94a3b8' }}>Speed:</span> <span style={{ color: '#e2e8f0' }}>{selectedVessel.speedKnots} kts</span></div>
                        <div><span style={{ color: '#94a3b8' }}>IMBL Distance:</span> <strong style={{ color: selectedVessel.distToImblKm < 5 ? '#f87171' : '#4ade80' }}>{selectedVessel.distToImblKm} km</strong></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 5. Feature: EMBEDDED ASK ORCA AI AGENT (CHATBOT) */}
              {(fishermanSubTab === 'all' || fishermanSubTab === 'agent') && (
                <div 
                  style={{
                    background: '#041224',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid rgba(0, 194, 212, 0.25)',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Bot size={24} className="text-cyan animate-pulse" />
                      <div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                          Ask ORCA — Multi-Agent Conversational AI Safety Agent
                        </h3>
                        <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#94a3b8' }}>
                          Real-time reasoning across Weather (IMD), Ocean State (INCOIS PFZ), and IMBL Border Guardrails with local Qwen 2.5 LLM.
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => onOpenAgentModal()}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: '#e2e8f0',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <ExternalLink size={13} /> Open Fullscreen AI
                      </button>
                    </div>
                  </div>

                  {/* The Live Agent Reasoning Engine Component */}
                  <AgentReasoningEngine onSpeakAdvisory={speakAudio} />
                </div>
              )}
            </div>
          )}

          {/* ════ VIEW 2: RESEARCHER DASHBOARD ════ */}
          {currentRole === 'Researcher' && (
            <div className="role-view-content">
              <div className="greeting-banner">
                <h2>Welcome, Researcher</h2>
                <p>Access and analyze ocean data products.</p>
              </div>

              {/* 4 Metric Cards */}
              <div className="dashboard-metrics-4">
                <div className="dash-metric-card">
                  <div className="metric-icon-box blue-soft">
                    <Thermometer size={20} />
                  </div>
                  <div className="metric-text-wrap">
                    <span className="card-lbl">SST</span>
                    <span className="card-val">28.4 °C</span>
                  </div>
                </div>

                <div className="dash-metric-card">
                  <div className="metric-icon-box blue-soft">
                    <Leaf size={20} />
                  </div>
                  <div className="metric-text-wrap">
                    <span className="card-lbl">Chlorophyll-a</span>
                    <span className="card-val">1.2 mg/m³</span>
                  </div>
                </div>

                <div className="dash-metric-card">
                  <div className="metric-icon-box blue-soft">
                    <Droplets size={20} />
                  </div>
                  <div className="metric-text-wrap">
                    <span className="card-lbl">Sea Surface Salinity</span>
                    <span className="card-val">34.8 PSU</span>
                  </div>
                </div>

                <div className="dash-metric-card">
                  <div className="metric-icon-box blue-soft">
                    <Waves size={20} />
                  </div>
                  <div className="metric-text-wrap">
                    <span className="card-lbl">Ocean Currents</span>
                    <span className="card-val">0.4 m/s</span>
                  </div>
                </div>
              </div>

              {/* Live Ocean Data (Heatmap) */}
              <div className="dash-section-card">
                <div className="card-header-row">
                  <h3>Live Ocean Data</h3>
                  <a href="#full-map" className="card-action-link">Open Full Map</a>
                </div>

                <div className="sst-heatmap-box">
                  <svg viewBox="0 0 800 240" className="map-svg-canvas">
                    <defs>
                      <linearGradient id="heatGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#0070f3" />
                        <stop offset="35%" stopColor="#00c2d4" />
                        <stop offset="65%" stopColor="#facc15" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                    </defs>
                    <rect width="800" height="240" fill="url(#heatGrad)" />
                    {/* Land boundary */}
                    <path
                      d="M 520 0 Q 560 60 540 120 T 570 180 T 530 240 L 800 240 L 800 0 Z"
                      fill="#0f172a"
                      opacity="0.85"
                    />
                    <text x="620" y="80" fill="#94a3b8" fontSize="12" fontWeight="bold">INDIA</text>
                    <text x="560" y="110" fill="#e2e8f0" fontSize="10">Mumbai</text>
                    <text x="580" y="160" fill="#e2e8f0" fontSize="10">Ratnagiri</text>
                  </svg>

                  {/* SST Colorbar Scale */}
                  <div className="sst-colorbar-scale">
                    <span className="scale-title">SST (°C)</span>
                    <div className="colorbar-strip"></div>
                    <div className="scale-numbers">
                      <span>32</span>
                      <span>28</span>
                      <span>24</span>
                      <span>22</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Latest Datasets Table */}
              <div className="dash-section-card">
                <div className="card-header-row">
                  <h3>Latest Datasets</h3>
                  <a href="#view-all" className="card-action-link">View All</a>
                </div>

                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Dataset</th>
                      <th>Parameter</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Oceansat-3</strong></td>
                      <td>Chlorophyll-a</td>
                      <td>06 Sep 2026</td>
                      <td><a href="#download" className="tbl-download-link"><Download size={13} /> Download</a></td>
                    </tr>
                    <tr>
                      <td><strong>INSAT-3D</strong></td>
                      <td>Sea Surface Temperature</td>
                      <td>06 Sep 2026</td>
                      <td><a href="#download" className="tbl-download-link"><Download size={13} /> Download</a></td>
                    </tr>
                    <tr>
                      <td><strong>HYCOM</strong></td>
                      <td>Ocean Currents</td>
                      <td>05 Sep 2026</td>
                      <td><a href="#download" className="tbl-download-link"><Download size={13} /> Download</a></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════ VIEW 3: COASTAL AUTHORITY DASHBOARD ════ */}
          {currentRole === 'Coastal Authority' && (
            <div className="role-view-content">
              <div className="greeting-banner">
                <h2>Welcome, Coastal Authority</h2>
                <p>Monitor coastal conditions and ensure safety.</p>
              </div>

              {/* 4 Metric Cards */}
              <div className="dashboard-metrics-4">
                <div className="dash-metric-card">
                  <div className="metric-icon-box red-soft">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="metric-text-wrap">
                    <span className="card-lbl">Coastal Alerts</span>
                    <span className="card-val text-red">2 Active</span>
                  </div>
                </div>

                <div className="dash-metric-card">
                  <div className="metric-icon-box blue-soft">
                    <Radio size={20} />
                  </div>
                  <div className="metric-text-wrap">
                    <span className="card-lbl">Vessel Activity</span>
                    <span className="card-val">124</span>
                  </div>
                </div>

                <div className="dash-metric-card">
                  <div className="metric-icon-box blue-soft">
                    <Waves size={20} />
                  </div>
                  <div className="metric-text-wrap">
                    <span className="card-lbl">Wave Height</span>
                    <span className="card-val">1.5 m</span>
                  </div>
                </div>

                <div className="dash-metric-card">
                  <div className="metric-icon-box green-soft">
                    <CloudSun size={20} />
                  </div>
                  <div className="metric-text-wrap">
                    <span className="card-lbl">Weather</span>
                    <span className="card-val">Stable</span>
                  </div>
                </div>
              </div>

              {/* Coastal Overview Map */}
              <div className="dash-section-card">
                <div className="card-header-row">
                  <h3>Coastal Overview</h3>
                  <a href="#full-map" className="card-action-link">View Full Map</a>
                </div>

                <div className="coastal-overview-map-box">
                  <svg viewBox="0 0 800 240" className="map-svg-canvas">
                    <rect width="800" height="240" fill="#034b75" />
                    {/* Coastline */}
                    <path
                      d="M 480 0 Q 520 60 500 120 T 540 180 T 490 240 L 800 240 L 800 0 Z"
                      fill="#0f172a"
                    />
                    <text x="580" y="40" fill="#94a3b8" fontSize="12" fontWeight="bold">MAHARASHTRA</text>
                    <text x="520" y="55" fill="#e2e8f0" fontSize="10">Mumbai</text>
                    <text x="540" y="130" fill="#e2e8f0" fontSize="10">Ratnagiri</text>
                    <text x="530" y="210" fill="#e2e8f0" fontSize="10">Goa</text>

                    {/* Vessels markers */}
                    <circle cx="430" cy="90" r="5" fill="#22c55e" />
                    <circle cx="450" cy="110" r="5" fill="#22c55e" />
                    <circle cx="440" cy="140" r="6" fill="#ef4444" />
                    <circle cx="480" cy="180" r="5" fill="#eab308" />
                    <circle cx="380" cy="160" r="5" fill="#22c55e" />

                    {/* Restricted Area Line */}
                    <line x1="400" y1="40" x2="380" y2="200" stroke="#ef4444" strokeWidth="2" strokeDasharray="5 3" />
                  </svg>

                  {/* Mini Legend */}
                  <div className="coastal-map-legend">
                    <div className="l-item"><span className="dot dot-amber"></span> Weather Alert</div>
                    <div className="l-item"><span className="dot dot-red"></span> High Wave</div>
                    <div className="l-item"><span className="line-red"></span> Restricted Area</div>
                    <div className="l-item"><span className="dot dot-green"></span> Vessel Cluster</div>
                  </div>
                </div>
              </div>

              {/* Recent Alerts */}
              <div className="dash-section-card">
                <div className="card-header-row">
                  <h3>Recent Alerts</h3>
                  <a href="#all-alerts" className="card-action-link">View All</a>
                </div>

                <div className="recent-alerts-list">
                  <div className="alert-row">
                    <span className="alert-icon-wrap amber"><AlertTriangle size={14} /></span>
                    <span className="alert-title-text">Moderate sea conditions expected along Maharashtra coast</span>
                    <span className="alert-time font-mono">06 Sep 2026, 08:30</span>
                  </div>
                  <div className="alert-row">
                    <span className="alert-icon-wrap red"><AlertTriangle size={14} /></span>
                    <span className="alert-title-text">High wave alert for coastal Ratnagiri</span>
                    <span className="alert-time font-mono">06 Sep 2026, 06:15</span>
                  </div>
                  <div className="alert-row">
                    <span className="alert-icon-wrap green"><Fish size={14} /></span>
                    <span className="alert-title-text">New PFZ advisory available</span>
                    <span className="alert-time font-mono">05 Sep 2026, 14:20</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ VIEW 4: DISASTER MANAGEMENT DASHBOARD ════ */}
          {currentRole === 'Disaster Management' && (
            <div className="role-view-content">
              <div className="greeting-banner">
                <h2>Welcome, Disaster Management</h2>
                <p>Early warnings for safer and resilient coastal communities.</p>
              </div>

              {/* 4 Metric Cards */}
              <div className="dashboard-metrics-4">
                <div className="dash-metric-card">
                  <div className="metric-icon-box green-soft">
                    <Shield size={20} />
                  </div>
                  <div className="metric-text-wrap">
                    <span className="card-lbl">Cyclone Alert</span>
                    <span className="card-val text-green">None</span>
                  </div>
                </div>

                <div className="dash-metric-card">
                  <div className="metric-icon-box amber-soft">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="metric-text-wrap">
                    <span className="card-lbl">High Wave Alert</span>
                    <span className="card-val text-amber">1 Active</span>
                  </div>
                </div>

                <div className="dash-metric-card">
                  <div className="metric-icon-box blue-soft">
                    <MapPin size={20} />
                  </div>
                  <div className="metric-text-wrap">
                    <span className="card-lbl">Affected Districts</span>
                    <span className="card-val">0</span>
                  </div>
                </div>

                <div className="dash-metric-card">
                  <div className="metric-icon-box green-soft">
                    <Activity size={20} />
                  </div>
                  <div className="metric-text-wrap">
                    <span className="card-lbl">Overall Risk</span>
                    <span className="card-val text-green">Low</span>
                  </div>
                </div>
              </div>

              {/* Cyclone & Weather Monitoring */}
              <div className="dash-section-card">
                <div className="card-header-row">
                  <h3>Cyclone & Weather Monitoring</h3>
                  <a href="#full-cyclone" className="card-action-link">View Full Map</a>
                </div>

                <div className="cyclone-map-box">
                  <svg viewBox="0 0 800 240" className="map-svg-canvas">
                    <defs>
                      <radialGradient id="vortexGrad" cx="75%" cy="60%" r="40%">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                        <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.6" />
                        <stop offset="80%" stopColor="#0284c7" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#082f49" stopOpacity="0.2" />
                      </radialGradient>
                    </defs>
                    <rect width="800" height="240" fill="#082f49" />
                    {/* India Map Outline */}
                    <path
                      d="M 280 20 L 320 80 L 360 140 L 420 180 L 460 210 L 480 180 L 530 120 L 600 80 L 640 60 Z"
                      fill="#1e293b"
                    />
                    <text x="440" y="100" fill="#94a3b8" fontSize="13" fontWeight="bold">INDIA</text>
                    <text x="240" y="140" fill="#38bdf8" fontSize="11">Arabian Sea</text>
                    <text x="620" y="170" fill="#38bdf8" fontSize="11">Bay of Bengal</text>

                    {/* Cyclone Vortex */}
                    <circle cx="680" cy="150" r="70" fill="url(#vortexGrad)" />
                    <circle cx="680" cy="150" r="8" fill="#ffffff" />
                  </svg>

                  {/* Wind speed colorbar scale */}
                  <div className="wind-speed-scale">
                    <span className="scale-title">Wind Speed (km/h)</span>
                    <div className="wind-colorbar-strip"></div>
                    <div className="wind-scale-numbers">
                      <span>0</span>
                      <span>30</span>
                      <span>60</span>
                      <span>90</span>
                      <span>120+</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Latest Warnings */}
              <div className="dash-section-card">
                <div className="card-header-row">
                  <h3>Latest Warnings</h3>
                  <a href="#all-warnings" className="card-action-link">View All</a>
                </div>

                <div className="recent-alerts-list">
                  <div className="alert-row">
                    <span className="alert-icon-wrap amber"><AlertTriangle size={14} /></span>
                    <span className="alert-title-text">Moderate sea conditions expected along Maharashtra coast</span>
                    <span className="alert-time font-mono">06 Sep 2026, 08:30</span>
                  </div>
                  <div className="alert-row">
                    <span className="alert-icon-wrap blue"><Shield size={14} /></span>
                    <span className="alert-title-text">No active cyclone in the North Indian Ocean</span>
                    <span className="alert-time font-mono">06 Sep 2026, 06:00</span>
                  </div>
                  <div className="alert-row">
                    <span className="alert-icon-wrap blue"><CloudSun size={14} /></span>
                    <span className="alert-title-text">Routine weather advisory for coastal regions</span>
                    <span className="alert-time font-mono">05 Sep 2026, 18:20</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
