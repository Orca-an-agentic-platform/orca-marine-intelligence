import React, { useState } from 'react'
import {
  ArrowLeft,
  LogIn,
  Fish,
  Anchor,
  AlertTriangle,
  Ship,
  Microscope,
  Package,
  ArrowUpRight,
  Search,
  ShieldCheck
} from 'lucide-react'

interface RoleSelectionLandingProps {
  onSelectRole: (roleName: string) => void
  onBackToHome: () => void
  onOpenLogin: () => void
}

export const RoleSelectionLanding: React.FC<RoleSelectionLandingProps> = ({
  onSelectRole,
  onBackToHome,
  onOpenLogin
}) => {
  const [filterQuery, setFilterQuery] = useState('')

  const rolesList = [
    {
      id: 'fisherman',
      roleKey: 'Fishermen',
      title: 'Fisherman',
      badgeTag: 'HARBOR & COASTAL FLEET',
      subtitle: 'PFZ, weather, Go/No-Go, offline',
      details: 'Access potential fishing zones, localized wave heights, IMBL proximity alerts, and emergency SOS.',
      accent: 'cyan',
      icon: <Fish size={24} className="role-ico-cyan" />
    },
    {
      id: 'coastal',
      roleKey: 'Coastal Authorities',
      title: 'Coastal Authority',
      badgeTag: 'MARITIME DEFENSE & POLICING',
      subtitle: 'Vessel tracking, geofencing, incidents',
      details: 'Real-time AIS vessel tracking, geofence surveillance, SOS alert triage, and fleet compliance.',
      accent: 'sky',
      icon: <Anchor size={24} className="role-ico-sky" />
    },
    {
      id: 'disaster',
      roleKey: 'Disaster Management',
      title: 'Disaster Management',
      badgeTag: 'EMERGENCY & CRISIS RESPONSE',
      subtitle: 'Hazard intel, response prioritisation',
      details: 'Early cyclone detection, storm surge modeling, high wave inundation, and evacuation routing.',
      accent: 'rose',
      icon: <AlertTriangle size={24} className="role-ico-rose" />
    },
    {
      id: 'maritime',
      roleKey: 'Maritime Operators',
      title: 'Maritime Operator',
      badgeTag: 'COMMERCIAL & OFFSHORE OPS',
      subtitle: 'Route planning, sea-state scheduling',
      details: 'Deep sea bathymetry, current-assisted routing, port clearance, and weather-safe transit plans.',
      accent: 'purple',
      icon: <Ship size={24} className="role-ico-purple" />
    },
    {
      id: 'researcher',
      roleKey: 'Researchers',
      title: 'Researcher',
      badgeTag: 'OCEAN SCIENCES & SATELLITE DATA',
      subtitle: 'Historical analysis, data export',
      details: 'Sea surface temperature anomalies, Chlorophyll-a layers, NetCDF datasets, and trend analytics.',
      accent: 'emerald',
      icon: <Microscope size={24} className="role-ico-emerald" />
    },
    {
      id: 'shipping',
      roleKey: 'Shipping Operators',
      title: 'Shipping Operator',
      badgeTag: 'LOGISTICS & CONTAINER BERTHING',
      subtitle: 'Port conditions, route optimisation',
      details: 'Container terminal berthing status, tide windows, bunkering economics, and turnaround forecasts.',
      accent: 'amber',
      icon: <Package size={24} className="role-ico-amber" />
    }
  ]

  const filteredRoles = rolesList.filter(
    (r) =>
      r.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      r.subtitle.toLowerCase().includes(filterQuery.toLowerCase()) ||
      r.details.toLowerCase().includes(filterQuery.toLowerCase())
  )

  return (
    <div className="orca-role-landing-page fullscreen-ocean-theme">
      {/* ── 1. Full-Screen Ocean Video Background ────────────────────────────── */}
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
        <div className="fullscreen-video-overlay role-landing-overlay"></div>
      </div>

      {/* ── 2. Top Navigation Bar ────────────────────────────────────────────── */}
      <header className="role-landing-top-bar">
        <div className="top-bar-left">
          <button className="btn-back-pill" onClick={onBackToHome} title="Return to Overview Home">
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </button>
          
          <div className="top-bar-brand" onClick={onBackToHome}>
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

        <div className="top-bar-right">
          <div className="role-search-box">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Filter roles or capabilities..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="role-search-input"
            />
            {filterQuery && (
              <button className="btn-clear-search" onClick={() => setFilterQuery('')}>
                ×
              </button>
            )}
          </div>

          <button className="btn-floating-login" onClick={onOpenLogin} title="Login to ORCA Portal">
            <LogIn size={15} />
            <span>Login</span>
          </button>
        </div>
      </header>

      {/* ── 3. Main Role Selection Showcase ──────────────────────────────────── */}
      <main className="role-landing-main-content">
        <div className="role-landing-header">
          <span className="roles-select-tag">MISSION CONTROL</span>
          <h1 className="role-landing-title">SELECT YOUR ROLE TO CONTINUE</h1>
          <p className="role-landing-subtitle">
            Choose your specialized operational console to access real-time ocean intelligence, satellite feeds, safety advisories, and AI multi-agent reasoning.
          </p>
        </div>

        {/* 6 Role Cards Grid */}
        <div className="ocean-roles-grid role-landing-grid">
          {filteredRoles.map((item) => (
            <div
              key={item.id}
              className={`ocean-role-card role-landing-card role-accent-${item.accent}`}
              onClick={() => onSelectRole(item.roleKey)}
              role="button"
              tabIndex={0}
            >
              <div className="role-card-top-row">
                <div className={`role-badge-icon role-badge-${item.accent}`}>
                  {item.icon}
                </div>
                <div className="role-action-arrow">
                  <ArrowUpRight size={18} />
                </div>
              </div>

              <div className="role-card-info">
                <span className={`role-card-tag-pill tag-${item.accent}`}>{item.badgeTag}</span>
                <h2 className="role-title-text">{item.title}</h2>
                <p className="role-subtitle-text">{item.subtitle}</p>
                <p className="role-details-text">{item.details}</p>
              </div>

              <div className="role-card-footer">
                <span className="role-launch-text">Launch Console</span>
                <span className="role-arrow-bullet">→</span>
              </div>

              <div className="role-hover-glow-line"></div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
