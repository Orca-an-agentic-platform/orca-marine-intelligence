import React, { useState } from 'react'
import { Vessel, BuoyStation } from '../types'
import { Shield, AlertOctagon, Anchor, Navigation, Eye, Layers, Compass, Wind, Droplets, Info } from 'lucide-react'

interface TacticalRadarMapProps {
  vessels: Vessel[]
  buoys: BuoyStation[]
  cycloneActive: boolean
  onSelectVessel: (vessel: Vessel) => void
  onSelectBuoy: (buoy: BuoyStation) => void
  selectedVessel: Vessel | null
  selectedBuoy: BuoyStation | null
}

export const TacticalRadarMap: React.FC<TacticalRadarMapProps> = ({
  vessels,
  buoys,
  cycloneActive,
  onSelectVessel,
  onSelectBuoy,
  selectedVessel,
  selectedBuoy
}) => {
  const [showPfz, setShowPfz] = useState(true)
  const [showImbl, setShowImbl] = useState(true)
  const [showBuoys, setShowBuoys] = useState(true)
  const [showVessels, setShowVessels] = useState(true)
  const [radarSweep, setRadarSweep] = useState(true)
  const [mapRegion, setMapRegion] = useState<'palk_strait' | 'pan_india' | 'bay_of_bengal'>('palk_strait')

  return (
    <div className="tactical-map-container">
      {/* Map Control Bar */}
      <div className="tactical-map-toolbar">
        <div className="toolbar-left">
          <div className="radar-status-pill">
            <span className="live-blip"></span>
            <span>INDIAN NAVAL & COAST GUARD GIS RADAR (MRCC CHENNAI)</span>
          </div>

          <div className="region-selector">
            <button 
              className={`btn-region ${mapRegion === 'palk_strait' ? 'active' : ''}`}
              onClick={() => setMapRegion('palk_strait')}
            >
              📍 Palk Strait & IMBL (High Sensitivity)
            </button>
            <button 
              className={`btn-region ${mapRegion === 'bay_of_bengal' ? 'active' : ''}`}
              onClick={() => setMapRegion('bay_of_bengal')}
            >
              🌊 Bay of Bengal (Cyclone Sector)
            </button>
            <button 
              className={`btn-region ${mapRegion === 'pan_india' ? 'active' : ''}`}
              onClick={() => setMapRegion('pan_india')}
            >
              🇮🇳 Pan-India EEZ
            </button>
          </div>
        </div>

        <div className="toolbar-right">
          <div className="layer-toggles">
            <button 
              className={`btn-layer ${showImbl ? 'active' : ''}`} 
              onClick={() => setShowImbl(!showImbl)}
              title="International Maritime Boundary Line (1974 Treaty)"
            >
              <Shield size={12} /> IMBL Border Line
            </button>
            <button 
              className={`btn-layer ${showPfz ? 'active' : ''}`} 
              onClick={() => setShowPfz(!showPfz)}
              title="INCOIS Potential Fishing Zones (PFZ) Chlorophyll / SST"
            >
              <Droplets size={12} /> INCOIS PFZ
            </button>
            <button 
              className={`btn-layer ${showBuoys ? 'active' : ''}`} 
              onClick={() => setShowBuoys(!showBuoys)}
              title="INCOIS & NIOT Moored Buoys"
            >
              <Anchor size={12} /> Ocean Buoys
            </button>
            <button 
              className={`btn-layer ${showVessels ? 'active' : ''}`} 
              onClick={() => setShowVessels(!showVessels)}
              title="Registered & Flagged Vessels"
            >
              <Navigation size={12} /> Vessels
            </button>
            <button 
              className={`btn-layer ${radarSweep ? 'active' : ''}`} 
              onClick={() => setRadarSweep(!radarSweep)}
            >
              ⚡ Radar Sweep
            </button>
          </div>
        </div>
      </div>

      {/* Main Tactical Map Display Canvas/SVG */}
      <div className="radar-canvas-frame">
        {/* Animated Radar Sweep Overlay */}
        {radarSweep && <div className="radar-sweep-beam"></div>}

        {/* SVG Tactical Maritime Map Visualizer */}
        <svg viewBox="0 0 1000 650" className="tactical-svg-map">
          <defs>
            {/* Gradients */}
            <radialGradient id="oceanGlow" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#08203e" />
              <stop offset="100%" stopColor="#030c1b" />
            </radialGradient>
            <linearGradient id="pfzGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#00ffcc" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0088ff" stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="cycloneGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ff3838" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ff9f1a" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Deep Ocean Background */}
          <rect width="1000" height="650" fill="url(#oceanGlow)" />

          {/* Concentric Maritime Radar Range Rings */}
          <g className="tactical-range-rings" opacity="0.4">
            <circle cx="500" cy="325" r="140" fill="none" stroke="#00d2ff" strokeWidth="0.8" strokeDasharray="3 3" />
            <text x="505" y="190" fill="#00d2ff" fontSize="9" opacity="0.8">12 NM Territorial Water Limit</text>

            <circle cx="500" cy="325" r="260" fill="none" stroke="#00d2ff" strokeWidth="0.8" strokeDasharray="4 4" />
            <text x="505" y="70" fill="#00d2ff" fontSize="9" opacity="0.8">24 NM Contiguous Zone</text>

            <circle cx="500" cy="325" r="420" fill="none" stroke="#00d2ff" strokeWidth="0.8" strokeDasharray="6 6" />
            <text x="820" y="320" fill="#00d2ff" fontSize="9" opacity="0.8">200 NM Indian EEZ</text>

            {/* Crosshairs */}
            <line x1="500" y1="20" x2="500" y2="630" stroke="#00d2ff" strokeWidth="0.5" strokeOpacity="0.2" />
            <line x1="20" y1="325" x2="980" y2="325" stroke="#00d2ff" strokeWidth="0.5" strokeOpacity="0.2" />
          </g>


          {/* Bathymetry depth contours (aesthetic high-tech GIS lines) */}
          <path d="M50 150 Q300 200 600 180 T950 300" stroke="#00d2ff" strokeWidth="0.5" strokeOpacity="0.2" fill="none" />
          <path d="M50 300 Q400 350 700 320 T950 480" stroke="#00d2ff" strokeWidth="0.5" strokeOpacity="0.15" fill="none" />
          <path d="M50 450 Q350 500 750 460 T950 580" stroke="#00d2ff" strokeWidth="0.5" strokeOpacity="0.1" fill="none" />

          {/* 1. Coastline Representations */}
          {mapRegion === 'palk_strait' ? (
            /* Detailed Palk Strait & Gulf of Mannar View (Tamil Nadu - Sri Lanka corridor) */
            <g className="coastline-palk-strait">
              {/* Indian Coast (Tamil Nadu - Rameswaram, Mandapam, Dhanushkodi) */}
              <path
                d="M 40 50 L 180 50 L 220 180 L 190 280 L 260 340 L 320 360 L 350 365 L 360 375 L 340 380 L 250 380 L 180 430 L 160 520 L 140 620 L 40 620 Z"
                fill="#0d2847"
                stroke="#1b528b"
                strokeWidth="2"
              />
              <text x="140" y="240" fill="#6996bf" fontSize="13" fontWeight="bold" letterSpacing="1">
                INDIA (TAMIL NADU)
              </text>
              <text x="210" y="345" fill="#00e5ff" fontSize="11" fontWeight="600">
                Rameswaram Harbor
              </text>
              <circle cx="340" cy="370" r="4" fill="#00e5ff" />
              <text x="345" y="365" fill="#8bc34a" fontSize="10">
                Dhanushkodi Point
              </text>

              {/* Sri Lanka Coastline (Jaffna, Talaimannar, Mannar Island) */}
              <path
                d="M 520 370 L 580 385 L 680 370 L 760 390 L 820 480 L 800 580 L 700 620 L 580 620 L 530 520 L 510 420 Z"
                fill="#081e36"
                stroke="#174474"
                strokeWidth="2"
              />
              <text x="640" y="470" fill="#5b82a7" fontSize="13" fontWeight="bold" letterSpacing="1">
                SRI LANKA (NORTHERN PROVINCE)
              </text>
              <circle cx="530" cy="375" r="4" fill="#ff7979" />
              <text x="535" y="370" fill="#ff7979" fontSize="10">
                Talaimannar
              </text>

              {/* Palk Strait / Palk Bay Waterway Labels */}
              <text x="360" y="220" fill="#2d6a9f" fontSize="16" fontWeight="bold" letterSpacing="2" opacity="0.6">
                PALK BAY
              </text>
              <text x="430" y="520" fill="#2d6a9f" fontSize="16" fontWeight="bold" letterSpacing="2" opacity="0.6">
                GULF OF MANNAR
              </text>

              {/* 2. IMBL Border Line & 5km Buffer Zone */}
              {showImbl && (
                <g className="imbl-boundary-layer">
                  {/* Flashing 5km Buffer Zone (Danger of Arrest) */}
                  <path
                    d="M 400 60 L 415 220 L 420 360 L 410 460 L 390 620"
                    stroke="#ff3838"
                    strokeWidth="32"
                    strokeOpacity="0.12"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Precise Treaty Boundary Line */}
                  <path
                    d="M 400 60 L 415 220 L 420 360 L 410 460 L 390 620"
                    stroke="#ff4757"
                    strokeWidth="2.5"
                    strokeDasharray="6 4"
                    fill="none"
                  />
                  <rect x="425" y="160" width="200" height="22" fill="#140810" rx="3" stroke="#ff4757" strokeWidth="0.8" />
                  <text x="432" y="175" fill="#ff4757" fontSize="10" fontWeight="bold" letterSpacing="0.8">
                    ⚠️ IMBL (1974 TREATY BORDER)
                  </text>
                  <text x="428" y="200" fill="#ffa502" fontSize="9" opacity="0.9">
                    5-KM CRITICAL STANDOFF ZONE
                  </text>
                </g>
              )}

              {/* 3. INCOIS Potential Fishing Zones (PFZ) polygons */}
              {showPfz && (
                <g className="pfz-layer">
                  <ellipse cx="320" cy="270" rx="45" ry="25" fill="url(#pfzGrad)" stroke="#00ffcc" strokeWidth="1.5" strokeDasharray="3 2" />
                  <text x="320" y="272" textAnchor="middle" fill="#00ffcc" fontSize="9" fontWeight="bold">
                    PFZ #TN-401 (High Chl-a)
                  </text>
                  <text x="320" y="284" textAnchor="middle" fill="#99ffea" fontSize="7.5">
                    Sardine / Seer Aggregation
                  </text>

                  <ellipse cx="290" cy="460" rx="55" ry="30" fill="url(#pfzGrad)" stroke="#00ffcc" strokeWidth="1.5" strokeDasharray="3 2" />
                  <text x="290" y="462" textAnchor="middle" fill="#00ffcc" fontSize="9" fontWeight="bold">
                    PFZ #GM-108 (Thermal Front)
                  </text>
                </g>
              )}
            </g>
          ) : (
            /* Pan-India EEZ / Bay of Bengal Outline */
            <g className="coastline-pan-india">
              {/* Generalized Peninsular India Coast */}
              <path
                d="M 120 80 L 150 160 L 190 280 L 260 420 L 370 540 L 400 580 L 440 520 L 510 390 L 620 290 L 740 210 L 840 180 L 920 180 L 920 50 L 120 50 Z"
                fill="#0d2847"
                stroke="#1b528b"
                strokeWidth="2"
              />
              <text x="280" y="320" fill="#6996bf" fontSize="18" fontWeight="bold" letterSpacing="2">
                INDIAN PENINSULA
              </text>
              <text x="680" y="390" fill="#2d6a9f" fontSize="18" fontWeight="bold" letterSpacing="2" opacity="0.6">
                BAY OF BENGAL
              </text>
              <text x="180" y="460" fill="#2d6a9f" fontSize="18" fontWeight="bold" letterSpacing="2" opacity="0.6">
                ARABIAN SEA
              </text>

              {showPfz && (
                <ellipse cx="650" cy="340" rx="80" ry="40" fill="url(#pfzGrad)" stroke="#00ffcc" strokeWidth="1.5" strokeDasharray="4 2" />
              )}
            </g>
          )}

          {/* 4. Cyclone Simulation Path & Storm Cone (When Active) */}
          {cycloneActive && (
            <g className="cyclone-overlay-group">
              {/* Cyclone Storm Cone */}
              <path
                d="M 780 480 Q 600 360 450 250 T 360 140"
                stroke="#ff4757"
                strokeWidth="4"
                strokeDasharray="8 4"
                fill="none"
              />
              <circle cx="680" cy="400" r="85" fill="url(#cycloneGrad)" stroke="#ff4757" strokeWidth="2" strokeDasharray="5 5" className="pulse-danger" />
              <circle cx="680" cy="400" r="16" fill="#ff4757" />
              <text x="680" y="405" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
                CYCLONE EYE
              </text>
              <rect x="610" y="495" width="220" height="38" fill="#200508" stroke="#ff4757" rx="4" />
              <text x="620" y="512" fill="#ff4757" fontSize="10" fontWeight="bold">
                🔴 CYCLONE BOB-02 (LANDFALL 14 HRS)
              </text>
              <text x="620" y="525" fill="#ffa502" fontSize="9">
                Max Wind: 75 Kts | Sea State: ROUGH (4.2m)
              </text>
            </g>
          )}

          {/* 5. INCOIS Ocean Buoy Markers */}
          {showBuoys && buoys.map((buoy, idx) => {
            // Map coordinates to canvas space
            let cx = 460 + (buoy.lon - 80) * 22
            let cy = 380 - (buoy.lat - 10) * 24
            if (mapRegion === 'palk_strait') {
              if (buoy.id === 'WRB-RAM') { cx = 350; cy = 330 }
              else if (buoy.id === 'CB02') { cx = 220; cy = 110 }
              else if (buoy.id === 'BD08') { cx = 820; cy = 180 }
              else { cx = 150 + idx * 80; cy = 540 }
            }

            const isSelected = selectedBuoy?.id === buoy.id

            return (
              <g 
                key={buoy.id} 
                className="buoy-marker-group" 
                onClick={() => onSelectBuoy(buoy)}
                style={{ cursor: 'pointer' }}
              >
                <circle cx={cx} cy={cy} r={isSelected ? 14 : 9} fill="#0d3b66" stroke="#00e5ff" strokeWidth="2" />
                <circle cx={cx} cy={cy} r={isSelected ? 6 : 4} fill="#00e5ff" className="pulse-buoy" />
                <text x={cx + 12} y={cy + 4} fill="#00e5ff" fontSize="9.5" fontWeight="600">
                  {buoy.id}
                </text>
                <text x={cx + 12} y={cy + 15} fill="#88b5dd" fontSize="8">
                  {buoy.waveHeightM}m | {buoy.seaSurfaceTempC}°C
                </text>
              </g>
            )
          })}

          {/* 6. Fleet Vessels & Suspicious Imposter Markers */}
          {showVessels && vessels.map((v) => {
            // Map coordinate relative to selected region
            let vx = 300 + (v.currentLon - 79) * 140
            let vy = 400 - (v.currentLat - 9) * 120

            if (mapRegion === 'palk_strait') {
              if (v.id === 'V-101') { vx = 340; vy = 310 }
              if (v.id === 'V-102') { vx = 390; vy = 290 }
              if (v.id === 'V-103') { vx = 430; vy = 260 } // Suspicious imposter right near IMBL border!
              if (v.id === 'V-104') { vx = 140; vy = 480 }
              if (v.id === 'V-105') { vx = 280; vy = 160 } // SOS distress vessel
              if (v.id === 'V-106') { vx = 110; vy = 80 }
            }

            const isSelected = selectedVessel?.id === v.id
            const isSuspicious = v.authStatus === 'SUSPICIOUS_IMPOSTER'
            const isSOS = v.authStatus === 'DISTRESS_SOS'
            const isVerified = v.authStatus === 'VERIFIED'

            const markerColor = isSuspicious ? '#ff3838' : isSOS ? '#ffa502' : '#2ed573'

            return (
              <g 
                key={v.id} 
                className="vessel-marker-group" 
                onClick={() => onSelectVessel(v)}
                style={{ cursor: 'pointer' }}
              >
                {/* Heading Vector Arrow */}
                <line
                  x1={vx}
                  y1={vy}
                  x2={vx + 18 * Math.sin((v.headingDeg * Math.PI) / 180)}
                  y2={vy - 18 * Math.cos((v.headingDeg * Math.PI) / 180)}
                  stroke={markerColor}
                  strokeWidth="2"
                />

                {/* Pulsing ring for Imposter or SOS */}
                {(isSuspicious || isSOS) && (
                  <circle cx={vx} cy={vy} r={isSelected ? 18 : 13} fill="none" stroke={markerColor} strokeWidth="1.5" className="pulse-danger" />
                )}

                {/* Vessel Base Glyph */}
                <circle cx={vx} cy={vy} r={isSelected ? 8 : 6} fill={markerColor} stroke="#ffffff" strokeWidth="1.5" />

                {/* Marker Labels */}
                <text x={vx + 10} y={vy - 6} fill={markerColor} fontSize="9.5" fontWeight="bold">
                  {v.name.slice(0, 14)}
                </text>
                <text x={vx + 10} y={vy + 6} fill="#a1c4e2" fontSize="8">
                  {v.registrationNo} • {v.speedKnots} kts
                </text>
              </g>
            )
          })}
        </svg>

        {/* Tactical Legend & Scale Indicator */}
        <div className="tactical-legend-card">
          <div className="legend-title">TACTICAL SYMBOLOGY</div>
          <div className="legend-items">
            <div className="l-item"><span className="dot dot-green"></span> Authorized Indian Vessel (Biometric Verified)</div>
            <div className="l-item"><span className="dot dot-red"></span> <strong>FLAGGED IMPOSTER / UNVERIFIED INTRUSION</strong></div>
            <div className="l-item"><span className="dot dot-amber"></span> Distress SOS / Mechanical Failure</div>
            <div className="l-item"><span className="dot dot-cyan"></span> INCOIS Telemetry Ocean Buoy</div>
            <div className="l-item"><span className="line-dashed-red"></span> IMBL Border & 5km Danger Buffer</div>
          </div>
        </div>

        {/* Selected Vessel / Buoy Deep Inspection HUD Panel */}
        {selectedVessel && (
          <div className={`tactical-detail-hud ${selectedVessel.authStatus === 'SUSPICIOUS_IMPOSTER' ? 'hud-threat' : ''}`}>
            <div className="hud-header">
              <div className="hud-title-wrap">
                <span className={`status-badge-mini ${selectedVessel.authStatus}`}>
                  {selectedVessel.authStatus === 'SUSPICIOUS_IMPOSTER' ? '🚨 SECURITY THREAT / FAKE IDENTITY' : selectedVessel.authStatus}
                </span>
                <h3>{selectedVessel.name}</h3>
                <span className="vessel-reg">{selectedVessel.registrationNo}</span>
              </div>
              <button className="btn-hud-close" onClick={() => onSelectVessel(null as any)}>✕</button>
            </div>

            <div className="hud-body-grid">
              <div className="hud-prop">
                <span className="lbl">Master / Owner:</span>
                <span className="val">{selectedVessel.ownerName}</span>
              </div>
              <div className="hud-prop">
                <span className="lbl">Aadhaar KYC Hash:</span>
                <span className="val font-mono">{selectedVessel.aadhaarHash}</span>
              </div>
              <div className="hud-prop">
                <span className="lbl">Marine Card ID:</span>
                <span className="val font-mono">{selectedVessel.biometricCardId}</span>
              </div>
              <div className="hud-prop">
                <span className="lbl">Transponder / Beacon:</span>
                <span className="val font-mono">{selectedVessel.transponderId}</span>
              </div>
              <div className="hud-prop">
                <span className="lbl">Port of Origin:</span>
                <span className="val">{selectedVessel.portOfOrigin}</span>
              </div>
              <div className="hud-prop">
                <span className="lbl">Distance to IMBL:</span>
                <span className={`val font-bold ${selectedVessel.distToImblKm <= 5 ? 'text-danger' : 'text-green'}`}>
                  {selectedVessel.distToImblKm} km {selectedVessel.distToImblKm <= 5 ? '(VIOLATION WARNING)' : ''}
                </span>
              </div>
              <div className="hud-prop">
                <span className="lbl">Telemetry / Speed:</span>
                <span className="val">{selectedVessel.speedKnots} knots @ {selectedVessel.headingDeg}°</span>
              </div>
              <div className="hud-prop">
                <span className="lbl">Crew On-board:</span>
                <span className="val">{selectedVessel.crewCount} personnel</span>
              </div>
            </div>

            {selectedVessel.flagReason && (
              <div className="hud-alert-box">
                <AlertOctagon size={16} />
                <span>{selectedVessel.flagReason}</span>
              </div>
            )}

            <div className="hud-actions">
              {selectedVessel.authStatus === 'SUSPICIOUS_IMPOSTER' ? (
                <button 
                  className="btn-action-threat"
                  onClick={() => alert(`🚨 ALERT DISPATCHED TO INDIAN COAST GUARD MRCC:\nInterception vector issued for vessel ${selectedVessel.registrationNo} at coords (${selectedVessel.currentLat}, ${selectedVessel.currentLon}). Patrol boat ICGS Rajdoot redirected!`)}
                >
                  <Shield size={14} /> DISPATCH COAST GUARD INTERCEPTOR
                </button>
              ) : selectedVessel.authStatus === 'DISTRESS_SOS' ? (
                <button 
                  className="btn-action-sos"
                  onClick={() => alert(`🆘 SAR DISPATCH CONFIRMED: Coast Guard Hovercraft H-181 dispatched to ${selectedVessel.name}.`)}
                >
                  DEPLOY SEARCH & RESCUE (SAR)
                </button>
              ) : (
                <button 
                  className="btn-action-verify"
                  onClick={() => alert(`✅ ReALCraft Database Query Success: Biometric card verified for ${selectedVessel.ownerName}. Clearance status: CLEARED FOR FISHING.`)}
                >
                  RE-VERIFY BIOMETRIC TOKEN
                </button>
              )}
            </div>
          </div>
        )}

        {/* Selected Buoy Deep Inspection HUD Panel */}
        {selectedBuoy && (
          <div className="tactical-detail-hud buoy-hud">
            <div className="hud-header">
              <div className="hud-title-wrap">
                <span className="status-badge-mini VERIFIED">INCOIS BUOY TELEMETRY</span>
                <h3>{selectedBuoy.name}</h3>
                <span className="vessel-reg">ID: {selectedBuoy.id} • Lat: {selectedBuoy.lat}°N, Lon: {selectedBuoy.lon}°E</span>
              </div>
              <button className="btn-hud-close" onClick={() => onSelectBuoy(null as any)}>✕</button>
            </div>

            <div className="buoy-gauges-grid">
              <div className="gauge-card">
                <span className="gauge-label"><Wind size={12} /> Significant Wave Height</span>
                <span className="gauge-value">{selectedBuoy.waveHeightM} m</span>
                <span className="gauge-sub">Period: {selectedBuoy.wavePeriodS}s</span>
              </div>
              <div className="gauge-card">
                <span className="gauge-label"><Droplets size={12} /> Sea Surface Temp</span>
                <span className="gauge-value">{selectedBuoy.seaSurfaceTempC} °C</span>
                <span className="gauge-sub">Thermal Front: Active</span>
              </div>
              <div className="gauge-card">
                <span className="gauge-label"><Wind size={12} /> Wind Speed</span>
                <span className="gauge-value">{selectedBuoy.windSpeedKnots} kts</span>
                <span className="gauge-sub">Dir: {selectedBuoy.windDirectionDeg}°</span>
              </div>
              <div className="gauge-card">
                <span className="gauge-label"><Info size={12} /> Barometric Pressure</span>
                <span className="gauge-value">{selectedBuoy.pressureHpa} hPa</span>
                <span className="gauge-sub">Trend: Stable</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
