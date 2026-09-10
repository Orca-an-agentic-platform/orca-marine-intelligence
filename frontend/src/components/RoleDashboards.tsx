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
import { FishermanDashboard } from './FishermanDashboard'
import { MarineWeatherDashboard } from './MarineWeatherDashboard'
import { DisasterDigitalTwin } from './DisasterDigitalTwin'

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
  const getNormalizedRole = (role: string) => {
    if (role === 'Fishermen' || role === 'Fisherman') return 'Fisherman'
    if (role === 'Researchers' || role === 'Researcher') return 'Researcher'
    if (role === 'Disaster Management' || role === 'disaster_management') return 'Disaster Management'
    return 'Coastal Authority'
  }

  const [currentRole, setCurrentRole] = useState<string>(getNormalizedRole(initialRole))

  const [activeSidebarItem, setActiveSidebarItem] = useState('Dashboard')
  const [liveBackend, setLiveBackend] = useState<boolean | null>(null)
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(FLEET_VESSELS[0])
  const [selectedBuoy, setSelectedBuoy] = useState<BuoyStation | null>(INCOIS_BUOYS[3])
  const [fishermanSubTab, setFishermanSubTab] = useState<'all' | 'map' | 'agent' | 'sos'>('all')
  const [disasterSubTab, setDisasterSubTab] = useState<'overview' | 'digital_twin' | 'weather'>('overview')
  const [sosSent, setSosSent] = useState(false)
  const [fishermanName, setFishermanName] = useState<string>('Captain Anthony Murugan')

  const [officerInfo, setOfficerInfo] = useState<{
    name: string
    phone: string
    department: string
    designation: string
    govId: string
    idCardPhoto?: string
  } | null>(null)

  useEffect(() => {
    setCurrentRole(getNormalizedRole(initialRole))
  }, [initialRole])

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

    try {
      const u = JSON.parse(localStorage.getItem('orca_current_user') || '{}')
      const storedName = localStorage.getItem('orca_disaster_officer_name') || u.name
      const storedPhone = localStorage.getItem('orca_disaster_officer_phone') || u.phone
      const storedDept = localStorage.getItem('orca_disaster_officer_dept') || u.department || 'National Disaster Response Force (NDRF)'
      const storedDesig = localStorage.getItem('orca_disaster_officer_designation') || u.designation || 'Zonal Disaster Mitigation Officer'
      const storedId = localStorage.getItem('orca_disaster_officer_id') || u.govId || 'NDRF-EOC-2026-DM'
      const storedPhoto = u.idCardPhoto || localStorage.getItem('orca_disaster_officer_photo') || ''

      if (storedName || u.name || localStorage.getItem('orca_disaster_management_registered') === 'true') {
        setOfficerInfo({
          name: storedName || 'Commanding Officer',
          phone: storedPhone || '',
          department: storedDept,
          designation: storedDesig,
          govId: storedId,
          idCardPhoto: storedPhoto
        })
      }
    } catch {}
  }, [currentRole])

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
    <>
    {/* ── FISHERMAN: Render the new 3-column dashboard ── */}
    {currentRole === 'Fisherman' && (
      <FishermanDashboard onSwitchRole={onBackToHome} />
    )}

    {/* ── OTHER ROLES: Existing dashboard shell ── */}
    {currentRole !== 'Fisherman' && (
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
                <button
                  className={`nav-menu-btn ${(activeSidebarItem === 'Dashboard' && disasterSubTab === 'overview') ? 'active' : ''}`}
                  onClick={() => { setActiveSidebarItem('Dashboard'); setDisasterSubTab('overview'); }}
                >
                  <span className="menu-icon">📊</span> Command Center
                </button>
                <button
                  className={`nav-menu-btn ${(activeSidebarItem === 'Digital Twin' || disasterSubTab === 'digital_twin') ? 'active' : ''}`}
                  onClick={() => { setActiveSidebarItem('Digital Twin'); setDisasterSubTab('digital_twin'); }}
                >
                  <span className="menu-icon">🌐</span> Digital Twin Simulator
                </button>
                <button
                  className={`nav-menu-btn ${(activeSidebarItem === 'Weather Forecast' || disasterSubTab === 'weather') ? 'active' : ''}`}
                  onClick={() => { setActiveSidebarItem('Weather Forecast'); setDisasterSubTab('weather'); }}
                >
                  <span className="menu-icon">⛅</span> Weather Surveillance
                </button>
                <button className={`nav-menu-btn ${activeSidebarItem === 'Early Warnings' ? 'active' : ''}`} onClick={() => setActiveSidebarItem('Early Warnings')}>
                  <span className="menu-icon">🔔</span> Early Warnings
                </button>
                <button className={`nav-menu-btn ${activeSidebarItem === 'Cyclone Tracking' ? 'active' : ''}`} onClick={() => setActiveSidebarItem('Cyclone Tracking')}>
                  <span className="menu-icon">🌪️</span> Cyclone Tracking
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

          {/* ════ VIEW 4: DISASTER MANAGEMENT DASHBOARD (Sky Blue + White Theme) ════ */}
          {/* Sub-view A: Digital Twin Simulator */}
          {currentRole === 'Disaster Management' && (activeSidebarItem === 'Digital Twin' || disasterSubTab === 'digital_twin') && (
            <div className="role-view-content" style={{ padding: '8px 0 30px 0' }}>
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => { setActiveSidebarItem('Dashboard'); setDisasterSubTab('overview'); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      background: '#ffffff',
                      border: '1px solid #bae6fd',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#0284c7',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(14, 165, 233, 0.1)'
                    }}
                  >
                    <ArrowLeft size={14} /> Back to Command Center
                  </button>
                  <span style={{ fontSize: '13px', color: '#0369a1', fontWeight: 600 }}>• Coastal Digital Twin Hydrodynamic Simulation</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => { setActiveSidebarItem('Dashboard'); setDisasterSubTab('overview'); }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: '1px solid #bae6fd',
                      background: '#ffffff',
                      color: '#0369a1',
                      cursor: 'pointer'
                    }}
                  >
                    📊 Command Overview
                  </button>
                  <button
                    onClick={() => { setActiveSidebarItem('Weather Forecast'); setDisasterSubTab('weather'); }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: '1px solid #bae6fd',
                      background: '#ffffff',
                      color: '#0369a1',
                      cursor: 'pointer'
                    }}
                  >
                    ⛅ Weather Surveillance
                  </button>
                </div>
              </div>
              <DisasterDigitalTwin />
            </div>
          )}

          {/* Sub-view B: Integrated Weather Surveillance */}
          {currentRole === 'Disaster Management' && (activeSidebarItem === 'Weather Forecast' || disasterSubTab === 'weather') && (
            <div className="role-view-content" style={{ padding: '8px 0 30px 0' }}>
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => { setActiveSidebarItem('Dashboard'); setDisasterSubTab('overview'); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      background: '#ffffff',
                      border: '1px solid #bae6fd',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#0284c7',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(14, 165, 233, 0.1)'
                    }}
                  >
                    <ArrowLeft size={14} /> Back to Command Center
                  </button>
                  <span style={{ fontSize: '13px', color: '#0369a1', fontWeight: 600 }}>• EOC Integrated Weather Surveillance</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => { setActiveSidebarItem('Dashboard'); setDisasterSubTab('overview'); }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: '1px solid #bae6fd',
                      background: '#ffffff',
                      color: '#0369a1',
                      cursor: 'pointer'
                    }}
                  >
                    📊 Command Overview
                  </button>
                  <button
                    onClick={() => { setActiveSidebarItem('Digital Twin'); setDisasterSubTab('digital_twin'); }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: '1px solid #0284c7',
                      background: '#0284c7',
                      color: '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    🌐 Digital Twin Simulator
                  </button>
                </div>
              </div>
              <MarineWeatherDashboard />
            </div>
          )}

          {/* Sub-view C: Main Disaster Management Command Center (Sky Blue + White Theme) */}
          {currentRole === 'Disaster Management' &&
            activeSidebarItem === 'Dashboard' &&
            disasterSubTab === 'overview' && (
            <div className="role-view-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* 1. Sky Blue + White Greeting Banner with Quick Mode Tabs */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 45%, #38bdf8 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  borderRadius: '16px',
                  padding: '24px 28px',
                  color: '#ffffff',
                  boxShadow: '0 10px 25px -5px rgba(14, 165, 233, 0.35)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '26px' }}>🚨</span>
                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, letterSpacing: '-0.4px', color: '#ffffff' }}>
                      Welcome, {officerInfo?.name || 'Captain Vikram Rathore'}!
                    </h2>
                    <span style={{
                      background: 'rgba(255, 255, 255, 0.22)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.45)',
                      padding: '3px 12px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.6px',
                      backdropFilter: 'blur(4px)'
                    }}>
                      DISASTER COMMAND CENTER
                    </span>
                  </div>
                  <p style={{ margin: 0, color: '#e0f2fe', fontSize: '13px', lineHeight: '1.5' }}>
                    Agency: <strong style={{ color: '#ffffff' }}>{officerInfo?.department || 'NDRF Coastal Operations'}</strong> • Designation: <strong style={{ color: '#ffffff' }}>{officerInfo?.designation || 'Zonal Mitigation Officer'}</strong> • Official ID: <span style={{ fontFamily: 'var(--font-mono, monospace)', color: '#fef08a', fontWeight: 700 }}>{officerInfo?.govId || 'NDRF-7483'}</span>
                  </p>

                  {/* Mode Tabs inside Sky Blue Banner */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
                    <button
                      onClick={() => { setDisasterSubTab('overview'); setActiveSidebarItem('Dashboard'); }}
                      style={{
                        padding: '7px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: '#ffffff',
                        color: '#0369a1',
                        border: '1px solid #ffffff',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      📊 Command Overview
                    </button>
                    <button
                      onClick={() => { setDisasterSubTab('digital_twin'); setActiveSidebarItem('Digital Twin'); }}
                      style={{
                        padding: '7px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: 'rgba(255, 255, 255, 0.22)',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.45)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <span>🌐</span> Digital Twin Simulator
                    </button>
                    <button
                      onClick={() => { setDisasterSubTab('weather'); setActiveSidebarItem('Weather Forecast'); }}
                      style={{
                        padding: '7px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: 'rgba(255, 255, 255, 0.22)',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.45)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <span>⛅</span> Weather Surveillance
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {officerInfo?.idCardPhoto && (
                    <img
                      src={officerInfo.idCardPhoto}
                      alt="Officer ID Badge"
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '10px',
                        objectFit: 'cover',
                        border: '2px solid #ffffff',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                      }}
                    />
                  )}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.18)',
                      border: '1px solid rgba(255, 255, 255, 0.35)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      textAlign: 'right',
                      backdropFilter: 'blur(8px)'
                    }}
                  >
                    <div style={{ fontSize: '11px', color: '#bae6fd', textTransform: 'uppercase', fontWeight: 700 }}>Emergency Operations</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginTop: '2px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80' }}></span>
                      Live Radar Online
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Four Metric Cards in Sky Blue + White Theme */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                  gap: '16px'
                }}
              >
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #bae6fd',
                    borderRadius: '14px',
                    padding: '18px 20px',
                    boxShadow: '0 4px 15px rgba(14, 165, 233, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px'
                  }}
                >
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: '#f0fdf4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#16a34a'
                  }}>
                    <Shield size={22} />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>
                      Cyclone Alert
                    </span>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: '#16a34a' }}>
                      None
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #bae6fd',
                    borderRadius: '14px',
                    padding: '18px 20px',
                    boxShadow: '0 4px 15px rgba(14, 165, 233, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px'
                  }}
                >
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: '#fef3c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#d97706'
                  }}>
                    <AlertTriangle size={22} />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>
                      High Wave Alert
                    </span>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: '#d97706' }}>
                      1 Active
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #bae6fd',
                    borderRadius: '14px',
                    padding: '18px 20px',
                    boxShadow: '0 4px 15px rgba(14, 165, 233, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px'
                  }}
                >
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: '#e0f2fe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0284c7'
                  }}>
                    <MapPin size={22} />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>
                      Affected Districts
                    </span>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                      0
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #bae6fd',
                    borderRadius: '14px',
                    padding: '18px 20px',
                    boxShadow: '0 4px 15px rgba(14, 165, 233, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px'
                  }}
                >
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: '#f0fdf4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#16a34a'
                  }}>
                    <Activity size={22} />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>
                      Overall Risk
                    </span>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: '#16a34a' }}>
                      Low
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Cyclone & Weather Monitoring Card (Sky Blue & White Theme) */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '22px 24px',
                  border: '1px solid #bae6fd',
                  boxShadow: '0 4px 20px rgba(14, 165, 233, 0.08)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>🌪️</span>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                      Cyclone & Weather Monitoring
                    </h3>
                  </div>
                  <button
                    onClick={() => { setDisasterSubTab('digital_twin'); setActiveSidebarItem('Digital Twin'); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#0284c7',
                      background: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Open Digital Twin Simulator →
                  </button>
                </div>

                <div className="cyclone-map-box" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #bae6fd' }}>
                  <svg viewBox="0 0 800 240" className="map-svg-canvas">
                    <defs>
                      <linearGradient id="oceanBgGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0369a1" />
                        <stop offset="100%" stopColor="#082f49" />
                      </linearGradient>
                      <radialGradient id="vortexGrad" cx="75%" cy="60%" r="40%">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
                        <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.65" />
                        <stop offset="80%" stopColor="#38bdf8" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#0369a1" stopOpacity="0.2" />
                      </radialGradient>
                    </defs>
                    <rect width="800" height="240" fill="url(#oceanBgGrad)" />
                    {/* India Map Outline */}
                    <path
                      d="M 280 20 L 320 80 L 360 140 L 420 180 L 460 210 L 480 180 L 530 120 L 600 80 L 640 60 Z"
                      fill="#1e293b"
                      stroke="#38bdf8"
                      strokeWidth="1"
                    />
                    <text x="440" y="100" fill="#cbd5e1" fontSize="13" fontWeight="bold">INDIA</text>
                    <text x="240" y="140" fill="#7dd3fc" fontSize="11" fontWeight="600">Arabian Sea</text>
                    <text x="620" y="170" fill="#7dd3fc" fontSize="11" fontWeight="600">Bay of Bengal</text>

                    {/* Cyclone Vortex */}
                    <circle cx="680" cy="150" r="70" fill="url(#vortexGrad)" />
                    <circle cx="680" cy="150" r="8" fill="#ffffff" />
                  </svg>

                  {/* Wind speed colorbar scale */}
                  <div className="wind-speed-scale" style={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid #bae6fd', color: '#0f172a' }}>
                    <span className="scale-title" style={{ color: '#0369a1', fontWeight: 700 }}>Wind Speed (km/h)</span>
                    <div className="wind-colorbar-strip"></div>
                    <div className="wind-scale-numbers" style={{ color: '#475569', fontWeight: 600 }}>
                      <span>0</span>
                      <span>30</span>
                      <span>60</span>
                      <span>90</span>
                      <span>120+</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Latest Warnings (Sky Blue & White Theme) */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '22px 24px',
                  border: '1px solid #bae6fd',
                  boxShadow: '0 4px 20px rgba(14, 165, 233, 0.08)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>🔔</span>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                      Latest Warnings & Bulletins
                    </h3>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#0284c7' }}>
                    Updated 2m ago • Live INCOIS Feed
                  </span>
                </div>

                <div className="recent-alerts-list">
                  <div className="alert-row" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 16px' }}>
                    <span className="alert-icon-wrap amber"><AlertTriangle size={14} /></span>
                    <span className="alert-title-text" style={{ color: '#1e293b' }}>Moderate sea conditions expected along Maharashtra & Gujarat coast</span>
                    <span className="alert-time font-mono" style={{ color: '#64748b' }}>06 Sep 2026, 08:30</span>
                  </div>
                  <div className="alert-row" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 16px' }}>
                    <span className="alert-icon-wrap blue" style={{ background: '#e0f2fe', color: '#0284c7' }}><Shield size={14} /></span>
                    <span className="alert-title-text" style={{ color: '#1e293b' }}>No active cyclone in the North Indian Ocean basin</span>
                    <span className="alert-time font-mono" style={{ color: '#64748b' }}>06 Sep 2026, 06:00</span>
                  </div>
                  <div className="alert-row" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 16px' }}>
                    <span className="alert-icon-wrap blue" style={{ background: '#e0f2fe', color: '#0284c7' }}><CloudSun size={14} /></span>
                    <span className="alert-title-text" style={{ color: '#1e293b' }}>Routine weather advisory issued for coastal districts</span>
                    <span className="alert-time font-mono" style={{ color: '#64748b' }}>05 Sep 2026, 18:20</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-view D: Early Warnings & Hazard Bulletins (Sky Blue + White Theme) */}
          {currentRole === 'Disaster Management' && activeSidebarItem === 'Early Warnings' && (
            <div className="role-view-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 45%, #38bdf8 100%)',
                  borderRadius: '16px',
                  padding: '24px 28px',
                  color: '#ffffff',
                  boxShadow: '0 10px 25px -5px rgba(14, 165, 233, 0.35)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '24px' }}>🔔</span>
                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#ffffff' }}>
                      Coastal Hazard Early Warnings & Advisory Bulletins
                    </h2>
                  </div>
                  <p style={{ margin: 0, color: '#e0f2fe', fontSize: '13px' }}>
                    Live official bulletins aggregated from INCOIS Ocean State Forecast (OSF) and IMD Cyclone Warning Division.
                  </p>
                </div>
                <button
                  onClick={() => alert('Broadcast Alert sent to Coastal Warning Sirens and SMS Gateway!')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: '#ffffff',
                    color: '#0284c7',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                >
                  ⚡ Trigger Siren & SMS Broadcast
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                <div style={{ background: '#ffffff', border: '1px solid #bae6fd', borderRadius: '14px', padding: '20px', boxShadow: '0 4px 15px rgba(14,165,233,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>STAGE-3 WARNING</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>06 Sep, 10:00 AM</span>
                  </div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#0f172a' }}>Palk Bay & Gulf of Mannar High Wave Advisory</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
                    Waves reaching 3.8m to 4.5m with high swell periods (14s). Total suspension of fishing operations advised within 25 nautical miles of coastline.
                  </p>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #bae6fd', borderRadius: '14px', padding: '20px', boxShadow: '0 4px 15px rgba(14,165,233,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>STAGE-2 ALERT</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>06 Sep, 08:30 AM</span>
                  </div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#0f172a' }}>Swell Surge Notice: Maharashtra Coastal Belt</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
                    Low-lying beaches in Ratnagiri and Sindhudurg may experience spring-tide inundation. Harbors advised to double mooring lines for trawlers.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sub-view E: Cyclone Tracking Trajectory Radar (Sky Blue + White Theme) */}
          {currentRole === 'Disaster Management' && activeSidebarItem === 'Cyclone Tracking' && (
            <div className="role-view-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 45%, #38bdf8 100%)',
                  borderRadius: '16px',
                  padding: '24px 28px',
                  color: '#ffffff',
                  boxShadow: '0 10px 25px -5px rgba(14, 165, 233, 0.35)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '24px' }}>🌪️</span>
                  <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#ffffff' }}>
                    Doppler Cyclone Radar & Trajectory Cone
                  </h2>
                </div>
                <p style={{ margin: 0, color: '#e0f2fe', fontSize: '13px' }}>
                  Live radar telemetry & eye tracking for North Indian Ocean cyclonic disturbances.
                </p>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #bae6fd', borderRadius: '16px', padding: '22px 24px', boxShadow: '0 4px 20px rgba(14,165,233,0.08)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '18px' }}>
                  <div style={{ background: '#f0f9ff', padding: '14px', borderRadius: '10px', border: '1px solid #bae6fd' }}>
                    <div style={{ fontSize: '11px', color: '#0369a1', fontWeight: 700 }}>STORM INTENSITY</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Cat-2 Severe</div>
                  </div>
                  <div style={{ background: '#f0f9ff', padding: '14px', borderRadius: '10px', border: '1px solid #bae6fd' }}>
                    <div style={{ fontSize: '11px', color: '#0369a1', fontWeight: 700 }}>CENTRAL PRESSURE</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>982 hPa</div>
                  </div>
                  <div style={{ background: '#f0f9ff', padding: '14px', borderRadius: '10px', border: '1px solid #bae6fd' }}>
                    <div style={{ fontSize: '11px', color: '#0369a1', fontWeight: 700 }}>SUSTAINED WINDS</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#0284c7' }}>115 km/h</div>
                  </div>
                  <div style={{ background: '#f0f9ff', padding: '14px', borderRadius: '10px', border: '1px solid #bae6fd' }}>
                    <div style={{ fontSize: '11px', color: '#0369a1', fontWeight: 700 }}>ESTIMATED LANDFALL</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#d97706' }}>T + 18 hrs</div>
                  </div>
                </div>

                <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #bae6fd', background: '#082f49', height: '260px', position: 'relative' }}>
                  <svg viewBox="0 0 800 260" style={{ width: '100%', height: '100%' }}>
                    <rect width="800" height="260" fill="#0c4a6e" opacity="0.6" />
                    <path d="M 240 20 L 280 90 L 320 150 L 380 190 L 440 220 L 480 190 L 540 120 Z" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                    <text x="360" y="110" fill="#94a3b8" fontSize="14" fontWeight="bold">INDIA</text>
                    {/* Trajectory Cone */}
                    <polygon points="680,180 500,120 520,200" fill="#38bdf8" opacity="0.25" />
                    <path d="M 680 180 Q 580 160 510 160" stroke="#f59e0b" strokeWidth="3" fill="none" strokeDasharray="6,4" />
                    <circle cx="680" cy="180" r="28" fill="#ef4444" opacity="0.4" />
                    <circle cx="680" cy="180" r="6" fill="#ffffff" />
                    <text x="610" y="140" fill="#ffffff" fontSize="12" fontWeight="bold">Cyclone Eye: 10.4°N, 81.8°E</text>
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Sub-view F: Coast Guard Fleet & Vessel Monitoring (Sky Blue + White Theme) */}
          {currentRole === 'Disaster Management' && activeSidebarItem === 'Vessel Monitoring' && (
            <div className="role-view-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 45%, #38bdf8 100%)',
                  borderRadius: '16px',
                  padding: '24px 28px',
                  color: '#ffffff',
                  boxShadow: '0 10px 25px -5px rgba(14, 165, 233, 0.35)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '24px' }}>🚢</span>
                  <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#ffffff' }}>
                    Maritime Vessel Telemetry & Search & Rescue Surveillance
                  </h2>
                </div>
                <p style={{ margin: 0, color: '#e0f2fe', fontSize: '13px' }}>
                  Real-time AIS tracking of fishing fleet, emergency beacons, and Coast Guard patrol assets in coastal waters.
                </p>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #bae6fd', borderRadius: '16px', padding: '22px 24px', boxShadow: '0 4px 20px rgba(14,165,233,0.08)' }}>
                <h4 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#0f172a' }}>Monitored Crafts in Disaster Sector</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { name: 'M/V Matsya Sugandhi', reg: 'IND-TN-04-MM-1204', type: 'Mechanized Trawler', dist: '4.8 km offshore', crew: 6, status: 'Returning to Port', alert: false },
                    { name: 'Sea Queen II', reg: 'IND-TN-02-MM-4019', type: 'Motorized Gillnetter', dist: '2.1 km offshore', crew: 4, status: 'Navigating to Basin', alert: false },
                    { name: 'Sagar Kanya', reg: 'IND-TN-08-MM-0884', type: 'Traditional FRP', dist: '0.6 km (In-Creek)', crew: 3, status: 'Moored Safe', alert: false },
                    { name: 'ICGS Varad', reg: 'CG-881', type: 'Fast Patrol Vessel', dist: '8.2 km patrol line', crew: 24, status: 'Active Escort Standby', alert: false }
                  ].map((v, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <strong style={{ fontSize: '13px', color: '#0f172a' }}>{v.name}</strong>
                        <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '8px' }}>({v.reg} • {v.type})</span>
                        <div style={{ fontSize: '11px', color: '#0284c7', marginTop: '2px' }}>📍 {v.dist} • Crew: {v.crew}</div>
                      </div>
                      <span style={{ background: '#e0f2fe', color: '#0284c7', padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700 }}>
                        {v.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sub-view G: Hazard Inundation Risk Maps (Sky Blue + White Theme) */}
          {currentRole === 'Disaster Management' && activeSidebarItem === 'Risk Maps' && (
            <div className="role-view-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 45%, #38bdf8 100%)',
                  borderRadius: '16px',
                  padding: '24px 28px',
                  color: '#ffffff',
                  boxShadow: '0 10px 25px -5px rgba(14, 165, 233, 0.35)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '24px' }}>🗺️</span>
                  <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#ffffff' }}>
                    Coastal Vulnerability & Storm Surge Inundation Risk Maps
                  </h2>
                </div>
                <p style={{ margin: 0, color: '#e0f2fe', fontSize: '13px' }}>
                  Multi-hazard vulnerability zones categorized by elevation, seawall barrier crest, and population density.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div style={{ background: '#ffffff', border: '1px solid #bae6fd', borderRadius: '14px', padding: '20px', boxShadow: '0 4px 15px rgba(14,165,233,0.06)' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#0f172a' }}>Zone 1: Extreme Inundation (&lt;1.5m Elevation)</h4>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0' }}>Immediate mandatory evacuation zone during surge events over 2.0m.</p>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626' }}>🚨 14 Fishing Hamlets • 18,400 Residents</div>
                </div>
                <div style={{ background: '#ffffff', border: '1px solid #bae6fd', borderRadius: '14px', padding: '20px', boxShadow: '0 4px 15px rgba(14,165,233,0.06)' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#0f172a' }}>Zone 2: Buffer Coastal Plain (1.5m - 3.5m)</h4>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0' }}>Precautionary stage-1 alert zone. Livestock and small craft relocation.</p>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#d97706' }}>⚠️ 8 Village Panchayats • 22,100 Residents</div>
                </div>
                <div style={{ background: '#ffffff', border: '1px solid #bae6fd', borderRadius: '14px', padding: '20px', boxShadow: '0 4px 15px rgba(14,165,233,0.06)' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#0f172a' }}>Zone 3: Elevated Cyclone Shelters (&gt;4.0m)</h4>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0' }}>Designated multi-purpose cyclone shelters equipped with emergency power and dewatering units.</p>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a' }}>🛡️ 6 Shelters Active • 14,000 Capacity</div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-view H: EOC Incident Reports & SITREPs (Sky Blue + White Theme) */}
          {currentRole === 'Disaster Management' && activeSidebarItem === 'Incident Reports' && (
            <div className="role-view-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 45%, #38bdf8 100%)',
                  borderRadius: '16px',
                  padding: '24px 28px',
                  color: '#ffffff',
                  boxShadow: '0 10px 25px -5px rgba(14, 165, 233, 0.35)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '24px' }}>📑</span>
                  <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#ffffff' }}>
                    Emergency Operations Center (EOC) Incident Log & SITREPs
                  </h2>
                </div>
                <p style={{ margin: 0, color: '#e0f2fe', fontSize: '13px' }}>
                  Official maritime emergency logs, search & rescue tasking, and relief operations records.
                </p>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #bae6fd', borderRadius: '16px', padding: '22px 24px', boxShadow: '0 4px 20px rgba(14,165,233,0.08)' }}>
                <h4 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#0f172a' }}>Live Incident Incident Register (Last 24 Hours)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', borderLeft: '4px solid #16a34a' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>#NDRF-2026-041: Pre-Emptive Harbor Haul-Up Order Executed</strong>
                      <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>RESOLVED</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                      142 Mechanized boats at Rameswaram South Jetty berthed and tied off safely. Zero damage reported.
                    </p>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', borderLeft: '4px solid #0284c7' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>#NDRF-2026-042: High Swell Inundation along Danushkodi Causeway</strong>
                      <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: 700 }}>MONITORING</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                      Water depth 0.2m over low-lying road. Traffic redirected. NDRF Battalion 4 deployed with high-capacity pumps.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-view I: Disaster Management Settings (Sky Blue + White Theme) */}
          {currentRole === 'Disaster Management' && activeSidebarItem === 'Settings' && (
            <div className="role-view-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 45%, #38bdf8 100%)',
                  borderRadius: '16px',
                  padding: '24px 28px',
                  color: '#ffffff',
                  boxShadow: '0 10px 25px -5px rgba(14, 165, 233, 0.35)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '24px' }}>⚙️</span>
                  <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#ffffff' }}>
                    Disaster Management Console Configuration
                  </h2>
                </div>
                <p style={{ margin: 0, color: '#e0f2fe', fontSize: '13px' }}>
                  Official agency credentials, siren trigger thresholds, and emergency SMS gateway bindings.
                </p>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #bae6fd', borderRadius: '16px', padding: '22px 24px', boxShadow: '0 4px 20px rgba(14,165,233,0.08)' }}>
                <h4 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#0f172a' }}>Agency Identity & Credentials</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', fontSize: '13px' }}>
                  <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Designated Agency:</span>
                    <strong style={{ color: '#0f172a' }}>NDRF Coastal Operations</strong>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Officer Designation:</span>
                    <strong style={{ color: '#0f172a' }}>Superintendent of Disaster Operations</strong>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Official ID Badge:</span>
                    <strong style={{ color: '#0284c7' }}>NDRF-7483</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
      </main>
      </div>
    </div>
    )}
    </>
  )
}
