import React, { useState, useEffect } from 'react'
import {
  Waves,
  Wind,
  Shield,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Radio,
  MapPin,
  Flame,
  CheckCircle2,
  Users,
  Compass,
  ArrowRight,
  Send,
  Zap,
  Activity,
  Layers,
  Sparkles,
  BarChart3,
  TrendingUp,
  CloudRain,
  Ship,
  Anchor,
  Navigation
} from 'lucide-react'

interface CoastalSector {
  id: string
  name: string
  state: string
  seawallHeight: number // in meters
  elevation: number // in meters
  population: number
  riskLevel: 'LOW' | 'MODERATE' | 'CRITICAL' | 'EXTREME'
}

const COASTAL_SECTORS: CoastalSector[] = [
  { id: 'sec-1', name: 'Rameswaram & Palk Bay Sector', state: 'Tamil Nadu', seawallHeight: 2.8, elevation: 1.5, population: 44000, riskLevel: 'CRITICAL' },
  { id: 'sec-2', name: 'Paradip Port & Coastal Belt', state: 'Odisha', seawallHeight: 3.5, elevation: 2.1, population: 68000, riskLevel: 'MODERATE' },
  { id: 'sec-3', name: 'Digha & Coastal Purba Medinipur', state: 'West Bengal', seawallHeight: 3.2, elevation: 1.8, population: 82000, riskLevel: 'CRITICAL' },
  { id: 'sec-4', name: 'Alibaug & Raigad Estuary', state: 'Maharashtra', seawallHeight: 4.0, elevation: 3.0, population: 36000, riskLevel: 'LOW' },
]

interface SimulatedBoat {
  id: string
  name: string
  regNo: string
  craftType: string
  xPos: number
  distanceKm: number
  crew: number
  speedKts: number
  engineStatus: string
  status: 'SAFE_HARBOR' | 'TRANSIT_TO_CREEK' | 'ALERT_HIGH_SURGE'
}

export const DisasterDigitalTwin: React.FC = () => {
  // Digital Twin Simulation Variables
  const [selectedSector, setSelectedSector] = useState<CoastalSector>(COASTAL_SECTORS[0])
  const [cycloneCat, setCycloneCat] = useState<number>(3) // Cat 1 to 5
  const [windSpeed, setWindSpeed] = useState<number>(145) // km/h
  const [stormSurge, setStormSurge] = useState<number>(2.4) // meters
  const [tideType, setTideType] = useState<'Spring High' | 'Mean High' | 'Neap Tide'>('Spring High')
  const [simHour, setSimHour] = useState<number>(12) // hours ahead
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [broadcastSent, setBroadcastSent] = useState<boolean>(false)
  const [vesselRecallSent, setVesselRecallSent] = useState<string | null>(null)

  // Real-time animation ticker for continuous wave and boat physics bobbing
  const [simTick, setSimTick] = useState<number>(0)
  useEffect(() => {
    const timer = setInterval(() => {
      setSimTick((t) => (t + 1) % 3600)
    }, 80)
    return () => clearInterval(timer)
  }, [])

  // Auto-step simulation if playing
  useEffect(() => {
    let timer: any
    if (isPlaying) {
      timer = setInterval(() => {
        setSimHour((prev) => {
          if (prev >= 48) return 0
          return prev + 2
        })
      }, 1200)
    }
    return () => clearInterval(timer)
  }, [isPlaying])

  // Presets
  const applyPreset = (type: 'super_cyclone' | 'monsoon_surge' | 'safe_baseline') => {
    if (type === 'super_cyclone') {
      setCycloneCat(5)
      setWindSpeed(210)
      setStormSurge(4.2)
      setTideType('Spring High')
      setSimHour(18)
    } else if (type === 'monsoon_surge') {
      setCycloneCat(2)
      setWindSpeed(95)
      setStormSurge(1.8)
      setTideType('Mean High')
      setSimHour(6)
    } else {
      setCycloneCat(1)
      setWindSpeed(50)
      setStormSurge(0.8)
      setTideType('Neap Tide')
      setSimHour(0)
    }
  }

  // Calculated Digital Twin Impact Metrics
  const tideOffset = tideType === 'Spring High' ? 0.9 : tideType === 'Mean High' ? 0.4 : -0.2
  const totalWaterLevel = Math.max(0.4, Number((stormSurge + tideOffset).toFixed(2)))
  const breach = totalWaterLevel >= selectedSector.seawallHeight
  const breachMargin = Number((totalWaterLevel - selectedSector.seawallHeight).toFixed(2))
  const inundatedAreaSqKm = Math.min(120, Number((totalWaterLevel * 8.4 * (selectedSector.elevation < 2 ? 1.5 : 0.9)).toFixed(1)))
  const affectedPopulation = Math.min(
    selectedSector.population,
    Math.round(selectedSector.population * (totalWaterLevel / 4.5))
  )
  const seawallOvertoppingProbability = Math.min(
    100,
    Math.max(5, Math.round((totalWaterLevel / selectedSector.seawallHeight) * 75))
  )

  // Real-time simulated fleet of boats reacting dynamically to storm surge & winds
  const boats: SimulatedBoat[] = [
    {
      id: 'boat-1',
      name: 'M/V Matsya Sugandhi',
      regNo: 'IND-TN-04-MM-1204',
      craftType: '180HP Mechanized Trawler',
      xPos: 95,
      distanceKm: 4.8,
      crew: 6,
      speedKts: cycloneCat >= 4 ? 4.2 : 8.6,
      engineStatus: 'Full Throttle (Inbound)',
      status: cycloneCat >= 3 || stormSurge >= 2.0 ? 'ALERT_HIGH_SURGE' : 'TRANSIT_TO_CREEK'
    },
    {
      id: 'boat-2',
      name: 'Sea Queen II',
      regNo: 'IND-TN-02-MM-4019',
      craftType: 'Motorized Fiber Gillnetter',
      xPos: 195,
      distanceKm: 2.1,
      crew: 4,
      speedKts: 6.0,
      engineStatus: 'Navigating to Basin',
      status: cycloneCat >= 4 ? 'ALERT_HIGH_SURGE' : 'TRANSIT_TO_CREEK'
    },
    {
      id: 'boat-3',
      name: 'Sagar Kanya',
      regNo: 'IND-TN-08-MM-0884',
      craftType: 'Traditional FRP Boat',
      xPos: 310,
      distanceKm: 0.6,
      crew: 3,
      speedKts: 0.0,
      engineStatus: 'Moored at Inner Creek',
      status: 'SAFE_HARBOR'
    }
  ]

  const handleBroadcastDirective = () => {
    setBroadcastSent(true)
    setTimeout(() => setBroadcastSent(false), 5000)
  }

  const handleRecallVessel = (boatName: string) => {
    setVesselRecallSent(boatName)
    setTimeout(() => setVesselRecallSent(null), 4000)
  }

  return (
    <div
      className="disaster-digital-twin-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        color: '#0f172a',
        fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)'
      }}
    >
      {/* ── 1. DIGITAL TWIN HEADER STRIP (Sky Blue + White Theme) ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 45%, #38bdf8 100%)',
          borderRadius: '16px',
          padding: '24px 28px',
          color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(14, 165, 233, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '24px' }}>🌐</span>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, letterSpacing: '-0.4px', color: '#ffffff' }}>
              ORCA Coastal Digital Twin Simulator
            </h2>
            <span
              style={{
                background: 'rgba(255, 255, 255, 0.22)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.45)',
                padding: '3px 12px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.6px',
                backdropFilter: 'blur(4px)'
              }}
            >
              HYDRODYNAMIC PHYSICS REPLICA
            </span>
          </div>
          <p style={{ margin: 0, color: '#e0f2fe', fontSize: '13px', lineHeight: '1.5', maxWidth: '780px' }}>
            Predictive AI & Hydrodynamic Surging Model coupled with <strong>INCOIS Ocean Observation Buoys</strong>, <strong>IMD Doppler Weather Radar</strong>, and <strong>Real-Time Fishing Fleet Vessel Telemetry</strong> for live coastal inundation & boat rescue simulation.
          </p>
        </div>

        {/* Live Telemetry Sensor Sync Status */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.18)',
            border: '1px solid rgba(255, 255, 255, 0.35)',
            borderRadius: '12px',
            padding: '10px 16px',
            backdropFilter: 'blur(8px)',
            textAlign: 'right'
          }}
        >
          <div style={{ fontSize: '11px', color: '#bae6fd', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
            Fleet & Physics Sync
          </div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginTop: '2px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80' }} />
            Live Vessel Tracking: 3 Active Crafts
          </div>
        </div>
      </div>

      {/* ── 2. PRESETS & SECTOR SELECTOR BAR ── */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          padding: '14px 20px',
          border: '1px solid #bae6fd',
          boxShadow: '0 4px 15px rgba(14, 165, 233, 0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Target Coastal Sector:
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {COASTAL_SECTORS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setSelectedSector(sec)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: selectedSector.id === sec.id ? '1px solid #0284c7' : '1px solid #e2e8f0',
                  background: selectedSector.id === sec.id ? '#0284c7' : '#f8fafc',
                  color: selectedSector.id === sec.id ? '#ffffff' : '#334155',
                  boxShadow: selectedSector.id === sec.id ? '0 2px 8px rgba(2, 132, 199, 0.25)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                📍 {sec.name}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Scenario Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Presets:</span>
          <button
            onClick={() => applyPreset('super_cyclone')}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              background: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #fca5a5',
              cursor: 'pointer'
            }}
          >
            🔥 Super Cyclone Cat-5
          </button>
          <button
            onClick={() => applyPreset('monsoon_surge')}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              background: '#fef3c7',
              color: '#d97706',
              border: '1px solid #fde68a',
              cursor: 'pointer'
            }}
          >
            🌊 High Surge Monsoon
          </button>
          <button
            onClick={() => applyPreset('safe_baseline')}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              background: '#e0f2fe',
              color: '#0284c7',
              border: '1px solid #bae6fd',
              cursor: 'pointer'
            }}
          >
            🛡️ Calm Baseline
          </button>
        </div>
      </div>

      {/* ── 3. SIMULATION TELEMETRY CARDS (Sky Blue + White Theme) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}
      >
        {/* Card 1: Total Surging Water Height */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            padding: '18px 20px',
            border: breach ? '1.5px solid #f87171' : '1px solid #bae6fd',
            boxShadow: '0 4px 15px rgba(14, 165, 233, 0.06)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>
              Simulated Water Level
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: breach ? '#fee2e2' : '#e0f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: breach ? '#dc2626' : '#0284c7'
              }}
            >
              <Waves size={18} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: breach ? '#dc2626' : '#0284c7', lineHeight: '1' }}>
            +{totalWaterLevel} m
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
            Seawall Crest: <strong>{selectedSector.seawallHeight}m</strong> ({breach ? `Breached by +${breachMargin}m` : `Safety buffer: ${Math.abs(breachMargin)}m`})
          </div>
        </div>

        {/* Card 2: Active Simulated Boats */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            padding: '18px 20px',
            border: '1px solid #bae6fd',
            boxShadow: '0 4px 15px rgba(14, 165, 233, 0.06)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>
              Tracked Fleet In Sector
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#e0f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0284c7'
              }}
            >
              <Ship size={18} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', lineHeight: '1' }}>
            3 Boats <span style={{ fontSize: '15px', fontWeight: 600, color: cycloneCat >= 3 ? '#dc2626' : '#16a34a' }}>({cycloneCat >= 3 ? '1 Hazard' : 'All Safe'})</span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
            1 Moored • 1 In-Transit • 1 Outer Swell Zone
          </div>
        </div>

        {/* Card 3: Vulnerable Citizens at Risk */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            padding: '18px 20px',
            border: '1px solid #bae6fd',
            boxShadow: '0 4px 15px rgba(14, 165, 233, 0.06)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>
              Citizens at Risk
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: affectedPopulation > 20000 ? '#fef3c7' : '#e0f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: affectedPopulation > 20000 ? '#d97706' : '#0284c7'
              }}
            >
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', lineHeight: '1' }}>
            {affectedPopulation.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
            {((affectedPopulation / selectedSector.population) * 100).toFixed(0)}% of zonal sector population
          </div>
        </div>

        {/* Card 4: Seawall Overtopping Risk */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            padding: '18px 20px',
            border: '1px solid #bae6fd',
            boxShadow: '0 4px 15px rgba(14, 165, 233, 0.06)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>
              Overtopping Probability
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: seawallOvertoppingProbability > 70 ? '#fee2e2' : '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: seawallOvertoppingProbability > 70 ? '#dc2626' : '#16a34a'
              }}
            >
              <Shield size={18} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: seawallOvertoppingProbability > 70 ? '#dc2626' : '#16a34a', lineHeight: '1' }}>
            {seawallOvertoppingProbability}%
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
            Structural Barrier Stress: <strong>{seawallOvertoppingProbability > 70 ? 'CRITICAL BREACH RISK' : 'DEFENSES HOLDING'}</strong>
          </div>
        </div>
      </div>

      {/* ── 4. TWO-COLUMN LAYOUT: SIMULATION CONTROLS & DYNAMIC CROSS-SECTION WITH REAL-TIME BOATS ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 380px) 1fr',
          gap: '20px',
          alignItems: 'stretch'
        }}
      >
        {/* Left Column: What-If Parameter Controls Studio (Sky Blue & White Theme) */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '22px 24px',
            border: '1px solid #bae6fd',
            boxShadow: '0 4px 20px rgba(14, 165, 233, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e0f2fe' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} style={{ color: '#0284c7' }} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Scenario Studio Controls
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: isPlaying ? '1px solid #f59e0b' : '1px solid #0284c7',
                  background: isPlaying ? '#fef3c7' : '#0284c7',
                  color: isPlaying ? '#b45309' : '#ffffff'
                }}
              >
                {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                {isPlaying ? 'Pause' : 'Simulate'}
              </button>
              <button
                onClick={() => {
                  setIsPlaying(false)
                  setSimHour(0)
                }}
                title="Reset simulation step"
                style={{
                  padding: '5px 8px',
                  borderRadius: '6px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={12} />
              </button>
            </div>
          </div>

          {/* Slider 1: Cyclone Intensity Category */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              <span style={{ color: '#334155' }}>🌪️ Cyclone Category:</span>
              <span style={{ color: '#0284c7', fontWeight: 800 }}>Category {cycloneCat}</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={cycloneCat}
              onChange={(e) => {
                const cat = parseInt(e.target.value)
                setCycloneCat(cat)
                setWindSpeed(cat === 1 ? 55 : cat === 2 ? 85 : cat === 3 ? 140 : cat === 4 ? 175 : 220)
                setStormSurge(cat === 1 ? 0.9 : cat === 2 ? 1.6 : cat === 3 ? 2.4 : cat === 4 ? 3.4 : 4.5)
              }}
              style={{ width: '100%', accentColor: '#0284c7', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
              <span>Depression (1)</span>
              <span>Severe (3)</span>
              <span>Super Cyclone (5)</span>
            </div>
          </div>

          {/* Slider 2: Peak Wind Speed */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              <span style={{ color: '#334155' }}>💨 Sustained Wind Speed:</span>
              <span style={{ color: '#0284c7', fontWeight: 800 }}>{windSpeed} km/h</span>
            </div>
            <input
              type="range"
              min="40"
              max="240"
              step="5"
              value={windSpeed}
              onChange={(e) => setWindSpeed(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#0284c7', cursor: 'pointer' }}
            />
          </div>

          {/* Slider 3: Storm Surge Height */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              <span style={{ color: '#334155' }}>🌊 Astronomical Surge Amplitude:</span>
              <span style={{ color: breach ? '#dc2626' : '#0284c7', fontWeight: 800 }}>+{stormSurge} m</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.1"
              value={stormSurge}
              onChange={(e) => setStormSurge(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#0284c7', cursor: 'pointer' }}
            />
          </div>

          {/* Radio Group: Astronomical Tide Cycle */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              🌙 Tidal Phase Synchronisation:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
              {(['Spring High', 'Mean High', 'Neap Tide'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTideType(t)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: tideType === t ? '1px solid #0284c7' : '1px solid #e2e8f0',
                    background: tideType === t ? '#e0f2fe' : '#f8fafc',
                    color: tideType === t ? '#0369a1' : '#64748b'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Slider 4: Forecast Time Horizon */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              <span style={{ color: '#334155' }}>⏱️ Timeline Projection:</span>
              <span style={{ color: '#0284c7', fontWeight: 800 }}>T + {simHour} hours</span>
            </div>
            <input
              type="range"
              min="0"
              max="48"
              step="2"
              value={simHour}
              onChange={(e) => setSimHour(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#0284c7', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
              <span>T+0h (Now)</span>
              <span>T+24h (Landfall)</span>
              <span>T+48h (Recession)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Digital Twin Coastal Cross-Section with REAL-TIME BOATS */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '22px 24px',
            border: '1px solid #bae6fd',
            boxShadow: '0 4px 20px rgba(14, 165, 233, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Ship size={18} style={{ color: '#0284c7' }} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  Coastal Hydrodynamic Cross-Section & Real-Time Boat Dynamics
                </h3>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                Simulating boat wave pitch, heave motion, offshore standoff, and seawall inundation
              </p>
            </div>
            <span
              style={{
                background: breach ? '#fee2e2' : '#dcfce7',
                color: breach ? '#dc2626' : '#16a34a',
                border: breach ? '1px solid #fca5a5' : '1px solid #86efac',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {breach ? '⚠️ SEAWALL OVERTOPPING' : '🛡️ DEFENSES SECURE'}
            </span>
          </div>

          {/* SVG Digital Twin Interactive Diagram with Live Animated Boats */}
          <div
            style={{
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#f0f9ff',
              border: '1px solid #bae6fd'
            }}
          >
            <svg viewBox="0 0 740 300" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                {/* Sky Gradient */}
                <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#f0f9ff" stopOpacity="0.2" />
                </linearGradient>

                {/* Surge Water Column Gradient */}
                <linearGradient id="surgeWaterGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.85" />
                  <stop offset="60%" stopColor="#0369a1" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#082f49" stopOpacity="0.95" />
                </linearGradient>

                {/* Ground Terrain Gradient */}
                <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#78716c" />
                  <stop offset="30%" stopColor="#57534e" />
                  <stop offset="100%" stopColor="#292524" />
                </linearGradient>

                {/* Overtopping Water Flow */}
                <linearGradient id="overtopGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.3" />
                </linearGradient>
              </defs>

              {/* Sky Background */}
              <rect width="740" height="300" fill="url(#skyGrad)" />

              {/* Rain Streaks if Cat >= 3 */}
              {cycloneCat >= 3 && (
                <g opacity="0.35" stroke="#38bdf8" strokeWidth="1" strokeDasharray="6,8">
                  <line x1="50" y1="10" x2="30" y2="150" />
                  <line x1="120" y1="20" x2="100" y2="160" />
                  <line x1="200" y1="10" x2="180" y2="180" />
                  <line x1="300" y1="15" x2="280" y2="170" />
                  <line x1="450" y1="10" x2="430" y2="150" />
                  <line x1="600" y1="20" x2="580" y2="160" />
                </g>
              )}

              {/* Wind Speed Arrows in the Atmosphere */}
              <g fill="#0284c7" opacity="0.6">
                <path d="M 40 40 Q 140 30 240 40 L 230 35 L 245 40 L 230 45 Z" stroke="#0284c7" strokeWidth="2" fill="none" />
                <path d="M 280 50 Q 380 40 480 50 L 470 45 L 485 50 L 470 55 Z" stroke="#0284c7" strokeWidth="2" fill="none" />
                <text x="250" y="32" fontSize="10" fontWeight="700" fill="#0369a1">{windSpeed} km/h Gale Wind Force</text>
              </g>

              {/* Ground & Seabed Profile */}
              <path
                d="M 0 300 L 0 250 Q 160 240 280 215 L 370 190 L 370 140 L 390 140 L 400 180 L 520 180 L 600 175 L 740 170 L 740 300 Z"
                fill="url(#groundGrad)"
              />

              {/* Concrete Seawall Block (x=368, y=140 to y=190) */}
              <rect x="368" y="140" width="24" height="52" fill="#94a3b8" stroke="#475569" strokeWidth="1.5" />
              <text x="380" y="132" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#334155">
                Seawall ({selectedSector.seawallHeight}m)
              </text>

              {/* Offshore Water Column with Waves and Real-Time Boats */}
              {(() => {
                const baseWaterY = Math.max(95, 200 - totalWaterLevel * 22)
                const waveA = Math.sin(simTick * 0.08) * 3
                const waveB = Math.cos(simTick * 0.08) * 3
                const waterY = baseWaterY + waveA

                return (
                  <>
                    <path
                      d={`M 0 300 L 0 ${waterY} Q 90 ${waterY - 7 + waveB} 180 ${waterY + 5 + waveA} T 368 ${waterY} L 368 300 Z`}
                      fill="url(#surgeWaterGrad)"
                    />
                    {/* Water Surface Wave Line */}
                    <path
                      d={`M 0 ${waterY} Q 90 ${waterY - 7 + waveB} 180 ${waterY + 5 + waveA} T 368 ${waterY}`}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="3.5"
                    />

                    {/* Water Level Label */}
                    <line x1="20" y1={waterY} x2="160" y2={waterY} stroke="#facc15" strokeWidth="1.5" strokeDasharray="3,3" />
                    <text x="25" y={waterY - 8} fontSize="11" fontWeight="800" fill="#0c4a6e">
                      🌊 Surge Peak: +{totalWaterLevel}m
                    </text>

                    {/* ── REAL-TIME SIMULATION OF BOATS IN WATER COLUMN ── */}
                    {boats.map((b, idx) => {
                      // Dynamic wave heave & roll angle for each boat
                      const boatHeave = Math.sin(simTick * 0.12 + idx * 2.1) * (3.5 + cycloneCat * 0.8)
                      const boatRoll = Math.sin(simTick * 0.1 + idx * 1.8) * (3.5 + (windSpeed / 16))
                      const boatY = waterY + boatHeave - 2
                      const isHazard = b.status === 'ALERT_HIGH_SURGE'

                      return (
                        <g
                          key={b.id}
                          transform={`translate(${b.xPos}, ${boatY}) rotate(${boatRoll})`}
                          style={{ transition: 'transform 0.08s linear' }}
                        >
                          {/* Water foam splash around boat */}
                          <ellipse cx="0" cy="5" rx="20" ry="3.5" fill="#ffffff" opacity="0.65" />

                          {/* Boat Hull */}
                          <path
                            d="M -20 0 L 20 0 L 14 10 L -15 10 Z"
                            fill={isHazard ? '#b91c1c' : idx === 1 ? '#0284c7' : '#059669'}
                            stroke="#ffffff"
                            strokeWidth="1.5"
                          />
                          {/* Boat Cabin */}
                          <rect x="-8" y="-11" width="15" height="11" fill="#ffffff" rx="2" stroke="#cbd5e1" strokeWidth="1" />
                          <rect x="-4" y="-8" width="7" height="5" fill="#38bdf8" />

                          {/* Boat Mast & Rigging */}
                          <line x1="2" y1="-21" x2="2" y2="-11" stroke="#475569" strokeWidth="1.5" />
                          <line x1="2" y1="-21" x2="-14" y2="0" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" />
                          <line x1="2" y1="-21" x2="16" y2="0" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" />

                          {/* Signal Beacon on Mast Head */}
                          <circle
                            cx="2"
                            cy="-21"
                            r={isHazard ? 3.5 : 2.5}
                            fill={isHazard ? '#ef4444' : '#22c55e'}
                          />
                          {isHazard && (
                            <circle
                              cx="2"
                              cy="-21"
                              r="7"
                              fill="none"
                              stroke="#ef4444"
                              strokeWidth="1.5"
                              opacity={Math.sin(simTick * 0.2) > 0 ? 0.9 : 0.2}
                            />
                          )}

                          {/* Live Boat Name & Status Floating Badge */}
                          <g transform="translate(0, -32)">
                            <rect
                              x="-48"
                              y="-12"
                              width="96"
                              height="14"
                              rx="4"
                              fill={isHazard ? 'rgba(185, 28, 28, 0.92)' : 'rgba(15, 23, 42, 0.88)'}
                            />
                            <text
                              x="0"
                              y="-2"
                              textAnchor="middle"
                              fontSize="8"
                              fontWeight="800"
                              fill="#ffffff"
                            >
                              {b.name} ({b.speedKts}kt)
                            </text>
                          </g>
                        </g>
                      )
                    })}

                    {/* Overtopping Water Flow over Seawall into Settlement if breached */}
                    {breach && (
                      <g>
                        {/* Overflow cascading over seawall */}
                        <path
                          d={`M 368 140 Q 380 135 400 150 L 400 180 L 540 180 Q 620 180 740 176 L 740 188 L 400 188 Z`}
                          fill="url(#overtopGrad)"
                        />
                        <path
                          d={`M 368 140 Q 380 135 400 150 L 540 180`}
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2.5"
                          strokeDasharray="4,4"
                        />
                        {/* Flooded Pool on Inland Settlements */}
                        <rect x="400" y="176" width="340" height="8" fill="#0284c7" opacity="0.75" />
                        <text x="440" y="170" fontSize="10" fontWeight="bold" fill="#dc2626">
                          ⚠️ Active Overtopping: Inundating Coastal Plain
                        </text>
                      </g>
                    )}
                  </>
                )
              })()}

              {/* Coastal Infrastructure on Land (Right Side) */}
              {/* Coastal Houses / Fishing Village */}
              <g transform="translate(430, 148)">
                <polygon points="12,0 0,12 24,12" fill="#f87171" />
                <rect x="3" y="12" width="18" height="18" fill="#f1f5f9" stroke="#cbd5e1" />
                <rect x="9" y="18" width="6" height="12" fill="#0f172a" />
                <text x="12" y="38" textAnchor="middle" fontSize="9" fontWeight="600" fill="#475569">Habitation</text>
              </g>

              {/* Fishing Port / Harbor Mast */}
              <g transform="translate(510, 135)">
                <rect x="8" y="0" width="4" height="42" fill="#64748b" />
                <line x1="2" y1="12" x2="18" y2="12" stroke="#64748b" strokeWidth="2" />
                <circle cx="10" cy="0" r="3" fill="#38bdf8" />
                <text x="10" y="50" textAnchor="middle" fontSize="9" fontWeight="600" fill="#475569">Fish Harbor</text>
              </g>

              {/* Critical Infrastructure: Evacuation Shelter */}
              <g transform="translate(610, 132)">
                <rect x="0" y="10" width="36" height="30" fill="#e2e8f0" stroke="#0284c7" strokeWidth="1.5" />
                <text x="18" y="24" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#0284c7">EOC</text>
                <text x="18" y="34" textAnchor="middle" fontSize="7" fill="#475569">SHELTER</text>
                <line x1="18" y1="0" x2="18" y2="10" stroke="#0284c7" strokeWidth="2" />
                <circle cx="18" cy="0" r="3" fill="#22c55e" />
                <text x="18" y="54" textAnchor="middle" fontSize="9" fontWeight="700" fill="#0284c7">Zonal Refuge</text>
              </g>

              {/* Labels & Annotations */}
              <text x="30" y="275" fill="#bae6fd" fontSize="11" fontWeight="700">Deep Ocean Column (3 Boats Simulated)</text>
              <text x="420" y="275" fill="#cbd5e1" fontSize="11" fontWeight="700">Inland Coastal Elevation (+{selectedSector.elevation}m)</text>
            </svg>
          </div>

          {/* ── REAL-TIME BOAT TELEMETRY FLEET CONSOLE ── */}
          <div
            style={{
              borderRadius: '12px',
              border: '1px solid #bae6fd',
              background: '#f8fafc',
              padding: '14px 16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Anchor size={15} style={{ color: '#0284c7' }} />
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#0369a1' }}>
                  Live Vessel Wave Response & Distance Telemetry (Boat Dynamics)
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                Real-Time Physics Bobbing: Active (12.5 Hz)
              </span>
            </div>

            {vesselRecallSent && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: '#dcfce7',
                  border: '1px solid #86efac',
                  color: '#166534',
                  fontSize: '12px',
                  fontWeight: 700,
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <CheckCircle2 size={14} />
                Emergency Port Return Signal broadcasted to {vesselRecallSent}!
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              {boats.map((boat) => {
                const rollDeg = (3.5 + (windSpeed / 16)).toFixed(1)
                const isAlert = boat.status === 'ALERT_HIGH_SURGE'

                return (
                  <div
                    key={boat.id}
                    style={{
                      background: '#ffffff',
                      border: isAlert ? '1.5px solid #fca5a5' : '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '12px', color: '#0f172a' }}>{boat.name}</strong>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: isAlert ? '#fee2e2' : boat.status === 'SAFE_HARBOR' ? '#dcfce7' : '#e0f2fe',
                          color: isAlert ? '#dc2626' : boat.status === 'SAFE_HARBOR' ? '#16a34a' : '#0284c7'
                        }}
                      >
                        {isAlert ? 'SWELL HAZARD' : boat.status === 'SAFE_HARBOR' ? 'MOORED' : 'IN-TRANSIT'}
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>
                      <div>Type: <strong>{boat.craftType}</strong></div>
                      <div>Roll Angle: <strong style={{ color: isAlert ? '#dc2626' : '#0f172a' }}>±{rollDeg}°</strong> • Crew: <strong>{boat.crew}</strong></div>
                      <div>Distance: <strong>{boat.distanceKm} km offshore</strong></div>
                    </div>

                    <button
                      onClick={() => handleRecallVessel(boat.name)}
                      style={{
                        marginTop: '8px',
                        width: '100%',
                        padding: '5px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: '1px solid #bae6fd',
                        background: '#f0f9ff',
                        color: '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <Navigation size={11} /> Recall Vessel to Harbor
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. AI MITIGATION DIRECTIVE & EVACUATION PROTOCOL ── */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '22px 26px',
          border: '1px solid #bae6fd',
          boxShadow: '0 4px 20px rgba(14, 165, 233, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#e0f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0284c7'
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Automated AI Tactical Directives (Digital Twin Engine)
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                Actionable multi-agency response protocols synthesized from current simulated hydrodynamic breach and vessel trajectory parameters.
              </p>
            </div>
          </div>

          <button
            onClick={handleBroadcastDirective}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '8px',
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
              transition: 'all 0.15s ease'
            }}
          >
            <Send size={15} />
            Broadcast Directives to Field Units
          </button>
        </div>

        {/* Broadcast Toast Notification */}
        {broadcastSent && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: '8px',
              background: '#dcfce7',
              border: '1px solid #86efac',
              color: '#166534',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <CheckCircle2 size={18} />
            Evacuation & Seawall Breach Warning successfully broadcasted to District Collectorate, Coast Guard & NDRF Battalions!
          </div>
        )}

        {/* 3 Directive Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          {/* Directive 1 */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px 18px',
              borderLeft: '4px solid #0284c7'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#0369a1' }}>
                1. Mandatory Coastal Evacuation
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
              {breach
                ? `Immediate Stage-3 evacuation of ${affectedPopulation.toLocaleString()} citizens across 14 low-lying villages situated below ${selectedSector.seawallHeight}m contour line.`
                : 'Stage-1 Precautionary advisory: Alert coastal settlements within 500m of high tide line to secure small craft.'}
            </p>
          </div>

          {/* Directive 2 */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px 18px',
              borderLeft: '4px solid #38bdf8'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#0369a1' }}>
                2. Flood Gate & Drainage Defense
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
              Depressurise and seal automated tidal sluice gates at Sector Inlet. Deploy 18 high-volume diesel dewatering pumps along coastal highway corridor.
            </p>
          </div>

          {/* Directive 3 */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px 18px',
              borderLeft: '4px solid #0ea5e9'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#0369a1' }}>
                3. Harbor & Vessel Recall Directive
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
              Enforce immediate berth haul-up for all 3 tracked fishing vessels in sector. Dispatch Indian Coast Guard fast-patrol craft to shepherd M/V Matsya into sheltered creek.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
