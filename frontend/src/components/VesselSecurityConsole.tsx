import React, { useState } from 'react'
import { Vessel } from '../types'
import { Shield, AlertTriangle, CheckCircle, Fingerprint, QrCode, FileText, Search, UserPlus, Radio, Lock } from 'lucide-react'

interface VesselSecurityConsoleProps {
  vessels: Vessel[]
  onOpenNewRegistration: () => void
  onSelectVessel: (vessel: Vessel) => void
}

export const VesselSecurityConsole: React.FC<VesselSecurityConsoleProps> = ({
  vessels,
  onOpenNewRegistration,
  onSelectVessel
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'ALL' | 'VERIFIED' | 'SUSPICIOUS_IMPOSTER' | 'DISTRESS_SOS'>('ALL')

  const filteredVessels = vessels.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.registrationNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.ownerName.toLowerCase().includes(searchTerm.toLowerCase())

    if (filterType === 'ALL') return matchesSearch
    return matchesSearch && v.authStatus === filterType
  })

  const flaggedCount = vessels.filter((v) => v.authStatus === 'SUSPICIOUS_IMPOSTER').length
  const verifiedCount = vessels.filter((v) => v.authStatus === 'VERIFIED').length

  return (
    <div className="security-console-container">
      {/* Government Security Architecture Overview Banner */}
      <div className="security-architecture-banner">
        <div className="sec-banner-icon">
          <Shield size={36} className="text-cyan" />
        </div>
        <div className="sec-banner-text">
          <div className="sec-gov-stamp">
            <span>COASTAL SECURITY DIRECTIVE 2024</span>
            <span className="bullet">•</span>
            <span>MINISTRY OF HOME AFFAIRS & INDIAN COAST GUARD</span>
          </div>
          <h2>Anti-Imposter & Biometric Vessel Verification System</h2>
          <p>
            Zero-Trust coastal security architecture preventing illegal trans-boundary infiltration, identity spoofing, and unauthorized fishing in Indian territorial waters (EEZ).
          </p>
        </div>
        <div className="sec-banner-action">
          <button className="btn-register-kyc" onClick={onOpenNewRegistration}>
            <UserPlus size={16} />
            <span>+ REGISTER NEW VESSEL (HARBOR KYC)</span>
          </button>
        </div>
      </div>

      {/* 4-Tier Anti-Imposter Defence Mechanism Cards */}
      <div className="security-pillars-grid">
        <div className="pillar-card">
          <div className="pillar-header">
            <div className="pillar-num">01</div>
            <Fingerprint size={20} className="text-cyan" />
          </div>
          <h4>Marine Biometric Card</h4>
          <p>Dual-interface smart card issued by Fisheries Dept with encrypted biometric fingerprint hash matching National Marine Fishermen Registry.</p>
          <div className="pillar-badge">UIDAI AADHAAR HASHED</div>
        </div>

        <div className="pillar-card">
          <div className="pillar-header">
            <div className="pillar-num">02</div>
            <QrCode size={20} className="text-cyan" />
          </div>
          <h4>ReALCraft Vessel QR</h4>
          <p>Cryptographic QR plate welded to boat hull. Encodes hull dimensions, engine serial number, and harbor registration certificate.</p>
          <div className="pillar-badge">PHYSICAL TAMPER PROOF</div>
        </div>

        <div className="pillar-card">
          <div className="pillar-header">
            <div className="pillar-num">03</div>
            <Lock size={20} className="text-cyan" />
          </div>
          <h4>Harbor RFID Token Clearance</h4>
          <p>Fishermen must tap biometric card at port departure gate. Harbor master assigns daily operational token valid for designated trip duration.</p>
          <div className="pillar-badge">GEO-FENCED PORT GATEWAY</div>
        </div>

        <div className="pillar-card">
          <div className="pillar-header">
            <div className="pillar-num">04</div>
            <Radio size={20} className="text-cyan" />
          </div>
          <h4>DAT-SG Transponder Blip</h4>
          <p>ISRO/NavIC satellite terminal emits signed telemetry heartbeat. Any vessel without valid cryptographic key is immediately tracked as suspect.</p>
          <div className="pillar-badge">NAVIC ENCRYPTED BEACON</div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="vessel-list-controls">
        <div className="search-box-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by Vessel Name, ReALCraft Reg No, or Master Fisherman..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-pill-group">
          <button 
            className={`filter-pill ${filterType === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterType('ALL')}
          >
            All Vessels ({vessels.length})
          </button>
          <button 
            className={`filter-pill filter-verified ${filterType === 'VERIFIED' ? 'active' : ''}`}
            onClick={() => setFilterType('VERIFIED')}
          >
            <CheckCircle size={14} /> Verified ({verifiedCount})
          </button>
          <button 
            className={`filter-pill filter-threat ${filterType === 'SUSPICIOUS_IMPOSTER' ? 'active' : ''}`}
            onClick={() => setFilterType('SUSPICIOUS_IMPOSTER')}
          >
            <AlertTriangle size={14} /> Imposters / Flagged ({flaggedCount})
          </button>
        </div>
      </div>

      {/* Security Threat & Vessel Roster Table */}
      <div className="vessels-table-card">
        <table className="gov-table">
          <thead>
            <tr>
              <th>Status / Threat Level</th>
              <th>Vessel & Registration</th>
              <th>Owner / Biometric Token</th>
              <th>Port / Engine</th>
              <th>Distance to IMBL</th>
              <th>Transponder & Telemetry</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVessels.map((v) => {
              const isThreat = v.authStatus === 'SUSPICIOUS_IMPOSTER'
              const isSOS = v.authStatus === 'DISTRESS_SOS'

              return (
                <tr key={v.id} className={isThreat ? 'row-threat' : isSOS ? 'row-sos' : ''}>
                  <td>
                    <div className="status-cell">
                      {isThreat ? (
                        <span className="badge-threat-flag">
                          <AlertTriangle size={12} /> SUSPECT IMPOSTER
                        </span>
                      ) : isSOS ? (
                        <span className="badge-sos-flag">
                          DISTRESS SOS
                        </span>
                      ) : (
                        <span className="badge-verified-flag">
                          <CheckCircle size={12} /> VERIFIED KYC
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="vessel-primary">
                      <strong>{v.name}</strong>
                      <span className="vessel-subreg">{v.registrationNo}</span>
                      <span className="vessel-type-tag">{v.vesselType}</span>
                    </div>
                  </td>
                  <td>
                    <div className="vessel-owner">
                      <span>{v.ownerName}</span>
                      <span className="text-muted text-xs">Card: {v.biometricCardId}</span>
                      <span className="text-muted text-xs font-mono">UID: {v.aadhaarHash}</span>
                    </div>
                  </td>
                  <td>
                    <div>
                      <span>{v.portOfOrigin}</span>
                      <span className="text-muted text-xs block">{v.engineHp} HP Inboard</span>
                    </div>
                  </td>
                  <td>
                    <div>
                      <span className={`font-bold ${v.distToImblKm <= 5 ? 'text-danger font-mono' : 'text-green font-mono'}`}>
                        {v.distToImblKm} km
                      </span>
                      {v.distToImblKm <= 5 && <span className="text-danger text-xs block">⚠️ Border Breach</span>}
                    </div>
                  </td>
                  <td>
                    <div>
                      <span className="font-mono text-xs text-cyan">{v.transponderId}</span>
                      <span className="text-muted text-xs block">{v.speedKnots} kts • {v.headingDeg}°</span>
                    </div>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button 
                        className="btn-tbl-inspect"
                        onClick={() => onSelectVessel(v)}
                        title="Open on Tactical Radar"
                      >
                        Inspect
                      </button>
                      {isThreat ? (
                        <button 
                          className="btn-tbl-intercept"
                          onClick={() => alert(`🚨 IMMEDIATE INTERCEPTION DIRECTIVE:\nCoast Guard Fast Interceptor Craft C-438 tasked to intercept ${v.registrationNo} immediately.`)}
                        >
                          Intercept
                        </button>
                      ) : (
                        <button 
                          className="btn-tbl-audit"
                          onClick={() => alert(`Audit log for ${v.name}: Biometric check-in verified at ${v.lastBiometricScan}. Zero violations.`)}
                        >
                          Audit
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
