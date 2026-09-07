import React, { useState, useEffect } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Fish,
  Anchor,
  AlertTriangle,
  Ship,
  Microscope,
  Package,
  ArrowUpRight,
  Wifi,
  WifiOff
} from 'lucide-react'
import { apiHealth, HealthResponse } from '../api'

interface PortalHomeProps {
  onSelectRole: (roleName: string) => void
  onOpenLogin?: () => void
  onExploreMap?: () => void
  initialSlide?: 0 | 1
}

export const PortalHome: React.FC<PortalHomeProps> = ({
  onSelectRole,
  initialSlide = 0
}) => {
  const [activeSlide, setActiveSlide] = useState<0 | 1>(initialSlide)
  const [backendHealth, setBackendHealth] = useState<HealthResponse | null>(null)
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null)

  useEffect(() => {
    apiHealth()
      .then((res) => {
        setBackendHealth(res)
        setIsBackendOnline(res.status === 'ok')
      })
      .catch(() => setIsBackendOnline(false))
  }, [])

  // Sync initialSlide when prop changes (e.g. returning from dashboard)
  useEffect(() => {
    setActiveSlide(initialSlide)
  }, [initialSlide])

  // Mouse wheel gesture to slide between Page 1 and Page 2
  useEffect(() => {
    let lastWheelTime = 0
    const handleWheel = (e: WheelEvent) => {
      const now = Date.now()
      if (now - lastWheelTime < 800) return

      // Slide 0 -> Slide 1 on scrolling down
      if (activeSlide === 0 && e.deltaY > 35) {
        setActiveSlide(1)
        lastWheelTime = now
      }
      // Slide 1 -> Slide 0 on scrolling up at the top
      else if (activeSlide === 1 && e.deltaY < -35) {
        const rolesContainer = document.querySelector('.slide-roles-container')
        if (!rolesContainer || rolesContainer.scrollTop <= 10) {
          setActiveSlide(0)
          lastWheelTime = now
        }
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: true })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [activeSlide])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'ArrowRight' || e.key === 'ArrowDown') && activeSlide === 0) {
        setActiveSlide(1)
      } else if ((e.key === 'ArrowLeft' || e.key === 'ArrowUp') && activeSlide === 1) {
        setActiveSlide(0)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeSlide])

  const rolesList = [
    {
      id: 'fisherman',
      roleKey: 'Fishermen',
      title: 'Fisherman',
      badgeTag: 'HARBOR & COASTAL FLEET',
      subtitle: 'PFZ, weather, Go/No-Go, offline',
      details: 'Access potential fishing zones, localized wave heights, IMBL proximity alerts, and emergency SOS.',
      accent: 'cyan',
      icon: <Fish size={22} className="role-ico-cyan" />
    },
    {
      id: 'coastal',
      roleKey: 'Coastal Authorities',
      title: 'Coastal Authority',
      badgeTag: 'MARITIME DEFENSE & POLICING',
      subtitle: 'Vessel tracking, geofencing, incidents',
      details: 'Real-time AIS vessel tracking, geofence surveillance, SOS alert triage, and fleet compliance.',
      accent: 'sky',
      icon: <Anchor size={22} className="role-ico-sky" />
    },
    {
      id: 'disaster',
      roleKey: 'Disaster Management',
      title: 'Disaster Management',
      badgeTag: 'EMERGENCY & CRISIS RESPONSE',
      subtitle: 'Hazard intel, response prioritisation',
      details: 'Early cyclone detection, storm surge modeling, high wave inundation, and evacuation routing.',
      accent: 'rose',
      icon: <AlertTriangle size={22} className="role-ico-rose" />
    },
    {
      id: 'maritime',
      roleKey: 'Maritime Operators',
      title: 'Maritime Operator',
      badgeTag: 'COMMERCIAL & OFFSHORE OPS',
      subtitle: 'Route planning, sea-state scheduling',
      details: 'Deep sea bathymetry, current-assisted routing, port clearance, and weather-safe transit plans.',
      accent: 'purple',
      icon: <Ship size={22} className="role-ico-purple" />
    },
    {
      id: 'researcher',
      roleKey: 'Researchers',
      title: 'Researcher',
      badgeTag: 'OCEAN SCIENCES & SATELLITE DATA',
      subtitle: 'Historical analysis, data export',
      details: 'Sea surface temperature anomalies, Chlorophyll-a layers, NetCDF datasets, and trend analytics.',
      accent: 'emerald',
      icon: <Microscope size={22} className="role-ico-emerald" />
    },
    {
      id: 'shipping',
      roleKey: 'Shipping Operators',
      title: 'Shipping Operator',
      badgeTag: 'LOGISTICS & CONTAINER BERTHING',
      subtitle: 'Port conditions, route optimisation',
      details: 'Container terminal berthing status, tide windows, bunkering economics, and turnaround forecasts.',
      accent: 'amber',
      icon: <Package size={22} className="role-ico-amber" />
    }
  ]

  return (
    <div className="portal-slider-viewport">
      {/* ── 1. Full-Screen Continuous Ocean Video (Never breaks or pauses) ───── */}
      <div className="fullscreen-video-bg">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/ratnagiri-hero.jpg"
          className="fullscreen-ocean-video"
        >
          <source src="/ocean-background.mp4" type="video/mp4" />
          <source src="https://v1.pinimg.com/videos/mc/720p/3f/ba/8c/3fba8c6097cc0134bd688173ff2d761a.mp4" type="video/mp4" />
          <img src="/ratnagiri-hero.jpg" alt="Ocean Background" className="fullscreen-ocean-video" />
        </video>
        <div className="fullscreen-video-overlay"></div>
      </div>

      {/* ── 2. Sliding Track containing Page 1 (Home) & Page 2 (Roles) ───────── */}
      <div
        className="portal-slider-track vertical-slider-track"
        style={{ transform: `translateY(-${activeSlide * 100}vh)` }}
      >
        {/* ═════════════════════════════════════════════════════════════════════
           PAGE 1: FIRST HOME PAGE
           ═════════════════════════════════════════════════════════════════════ */}
        <div className="portal-slide slide-home-viewport">
          {/* Top Bar for Home */}
          <header className="portal-floating-top-bar">
            <div className="floating-top-brand" onClick={() => setActiveSlide(0)}>
              <div className="wave-icon-mark">
                <svg viewBox="0 0 40 28" className="orca-wave-svg" aria-label="ORCA Wave Mark">
                  <path d="M4 18 Q 14 10 24 18 T 36 18" fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
                  <path d="M8 12 Q 18 5 28 12 T 38 12" fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
                  <path d="M12 6 Q 22 1 32 6" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
                </svg>
              </div>
              <span className="orca-brand-text">ORCA</span>
            </div>

            {/* Backend Health Status Badge */}
            <div className="portal-top-status-badge">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '11.5px',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 700,
                  backdropFilter: 'blur(12px)',
                  background: isBackendOnline
                    ? 'rgba(6, 78, 59, 0.65)'
                    : isBackendOnline === false
                    ? 'rgba(120, 53, 15, 0.65)'
                    : 'rgba(15, 23, 42, 0.65)',
                  border: isBackendOnline
                    ? '1px solid rgba(52, 211, 153, 0.4)'
                    : isBackendOnline === false
                    ? '1px solid rgba(251, 191, 36, 0.4)'
                    : '1px solid rgba(148, 163, 184, 0.3)',
                  color: isBackendOnline ? '#6ee7b7' : isBackendOnline === false ? '#fcd34d' : '#94a3b8',
                  boxShadow: isBackendOnline ? '0 0 15px rgba(16, 185, 129, 0.25)' : 'none',
                }}
                title={isBackendOnline ? `FastAPI Connected (${backendHealth?.app || 'ORCA'} • ${backendHealth?.env || 'dev'})` : 'Local mode active'}
              >
                {isBackendOnline ? (
                  <>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
                    <span>API & AGENTS ONLINE</span>
                  </>
                ) : isBackendOnline === false ? (
                  <>
                    <WifiOff size={13} style={{ color: '#fbbf24' }} />
                    <span>LOCAL DEMO MODE</span>
                  </>
                ) : (
                  <>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }} />
                    <span>CHECKING BACKEND...</span>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Main Hero View */}
          <main className="slide-hero-center">
            <div className="hero-text-block">
              <h1 className="hero-title-giant">ORCA</h1>
              <h2 className="hero-subtitle-caps">OCEAN & RESOURCES CONVERSATIONAL ASSISTANT</h2>
              <h3 className="hero-tagline-bold">Smart Ocean Information for Safer and Sustainable Seas</h3>

              <p className="hero-description">
                Bringing together ocean data, weather information, fishing zone insights and AI-powered guidance to support everyone who depends on the ocean.
              </p>

              <div className="hero-buttons-group">
                <button className="btn-hero-primary" onClick={() => setActiveSlide(1)}>
                  <span>Select Your Role</span>
                  <ArrowDown size={18} />
                </button>
              </div>
            </div>
          </main>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════
           PAGE 2: ROLE SELECTION (NEXT SLIDING PAGE VERTICAL)
           ═════════════════════════════════════════════════════════════════════ */}
        <div className="portal-slide slide-roles-viewport slide-roles-container">
          {/* Top Bar for Role Selection */}
          <header className="role-landing-top-bar">
            <div className="top-bar-left">
              <button className="btn-back-pill" onClick={() => setActiveSlide(0)} title="Slide Up to Overview Home">
                <ArrowUp size={16} />
                <span>Back to Overview</span>
              </button>

              <div className="top-bar-brand" onClick={() => setActiveSlide(0)}>
                <div className="wave-icon-mark">
                  <svg viewBox="0 0 40 28" className="orca-wave-svg" aria-label="ORCA Wave Mark">
                    <path d="M4 18 Q 14 10 24 18 T 36 18" fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
                    <path d="M8 12 Q 18 5 28 12 T 38 12" fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
                    <path d="M12 6 Q 22 1 32 6" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
                  </svg>
                </div>
                <span className="orca-brand-text">ORCA</span>
              </div>
            </div>
          </header>

          {/* Role Selection Main Showcase */}
          <main className="role-landing-main-content">
            <div className="role-landing-header">
              <span className="roles-select-tag">MISSION CONTROL</span>
              <h2 className="role-landing-title">SELECT YOUR ROLE TO CONTINUE</h2>
              <p className="role-landing-subtitle">
                Choose your specialized operational console to access real-time ocean intelligence, satellite feeds, safety advisories, and AI multi-agent reasoning.
              </p>
            </div>

            {/* 6 Role Cards in Unified Sky Blue Coastal Glass Theme */}
            <div className="ocean-roles-grid role-landing-grid">
              {rolesList.map((item) => (
                <div
                  key={item.id}
                  className="ocean-role-card role-landing-card"
                  onClick={() => onSelectRole(item.roleKey)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="role-card-top-row">
                    <div className="role-badge-icon">
                      {item.icon}
                    </div>
                    <div className="role-action-arrow">
                      <ArrowUpRight size={18} />
                    </div>
                  </div>

                  <div className="role-card-info">
                    <h3 className="role-title-text">{item.title}</h3>
                    <p className="role-subtitle-text">{item.subtitle}</p>
                  </div>

                  <div className="role-card-footer">
                    <span className="role-launch-text">Launch Console</span>
                    <span className="role-arrow-bullet">→</span>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
