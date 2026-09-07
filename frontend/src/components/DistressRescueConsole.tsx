import React, { useState } from 'react'
import { SOSEvent } from '../types'
import { ACTIVE_SOS_ALERTS } from '../mockData'
import { AlertOctagon, Anchor, LifeBuoy, PhoneCall, Radio, Send, ShieldAlert, CheckCircle } from 'lucide-react'

export const DistressRescueConsole: React.FC = () => {
  const [sosList, setSosList] = useState<SOSEvent[]>(ACTIVE_SOS_ALERTS)

  const handleDispatchQRT = (sosId: string, qrtName: string) => {
    setSosList(prev =>
      prev.map(item =>
        item.id === sosId
          ? { ...item, status: 'PATROL_DISPATCHED', assignedQrt: `${qrtName} (Dispatched, ETA 22m)` }
          : item
      )
    )
    alert(`🚨 INDIAN COAST GUARD SAR MISSION LAUNCHED:\nTasking Order issued to ${qrtName} for vessel distress coordinate verification. Real-time telemetry routed to MRCC Chennai.`)
  }

  const handleResolveSOS = (sosId: string) => {
    setSosList(prev =>
      prev.map(item =>
        item.id === sosId ? { ...item, status: 'RESCUED' } : item
      )
    )
    alert(`✅ SAR Mission Successful: Crew safely secured and accounted for.`)
  }

  return (
    <div className="distress-console-container">
      {/* MRCC Header */}
      <div className="mrcc-banner">
        <div className="mrcc-icon-wrap">
          <LifeBuoy size={36} className="text-danger animate-spin" />
        </div>
        <div className="mrcc-banner-info">
          <div className="mrcc-tag">
            <span>INDIAN COAST GUARD MARITIME RESCUE CO-ORDINATION CENTRE (MRCC)</span>
            <span className="bullet">•</span>
            <span>NATIONAL SAR BOARD</span>
          </div>
          <h2>Emergency Maritime Search and Rescue (SAR) Console</h2>
          <p>
            Real-time telemetry triangulation for EPIRB, NavIC DAT-SG, and ORCA app one-touch distress beacons across the Indian Search and Rescue Region (ISRR).
          </p>
        </div>
      </div>

      {/* Active Distress Cards */}
      <div className="distress-cards-grid">
        {sosList.map((sos) => {
          const isPending = sos.status === 'ACTIVE_DISTRESS'
          const isDispatched = sos.status === 'PATROL_DISPATCHED'
          const isRescued = sos.status === 'RESCUED'

          return (
            <div key={sos.id} className={`distress-card ${isPending ? 'card-urgent' : isDispatched ? 'card-dispatched' : 'card-resolved'}`}>
              <div className="distress-card-header">
                <div className="distress-id-row">
                  <span className="sos-beacon-tag font-mono">{sos.id}</span>
                  <span className={`sos-status-pill ${sos.status}`}>
                    {isPending ? '🔴 IMMEDIATE ACTION REQUIRED' : isDispatched ? '🟡 QRT PATROL EN-ROUTE' : '🟢 RESCUED'}
                  </span>
                </div>
                <h3>{sos.vesselName}</h3>
                <span className="sos-captain">Skipper: {sos.captainName} • Phone: {sos.contactPhone}</span>
              </div>

              <div className="distress-telemetry-grid">
                <div className="d-cell">
                  <span className="d-lbl">Nature of Distress:</span>
                  <span className="d-val text-danger font-bold">{sos.natureOfEmergency}</span>
                </div>
                <div className="d-cell">
                  <span className="d-lbl">GPS Coordinates:</span>
                  <span className="d-val font-mono">{sos.lat}°N, {sos.lon}°E</span>
                </div>
                <div className="d-cell">
                  <span className="d-lbl">Souls On Board (Crew):</span>
                  <span className="d-val font-bold">{sos.crewCount} personnel</span>
                </div>
                <div className="d-cell">
                  <span className="d-lbl">Transponder Battery:</span>
                  <span className="d-val">{sos.batteryPct}% (Est 14 hrs)</span>
                </div>
                <div className="d-cell">
                  <span className="d-lbl">Signal Time:</span>
                  <span className="d-val">{sos.signalTime} ({sos.elapsedMinutes} mins ago)</span>
                </div>
                <div className="d-cell">
                  <span className="d-lbl">Assigned SAR Unit:</span>
                  <span className="d-val text-cyan font-bold">{sos.assignedQrt || 'Unassigned'}</span>
                </div>
              </div>

              <div className="distress-card-actions">
                {isPending && (
                  <>
                    <button 
                      className="btn-dispatch-qrt"
                      onClick={() => handleDispatchQRT(sos.id, 'ICGS Rajdoot (Fast Patrol Vessel)')}
                    >
                      <Radio size={14} /> DISPATCH ICGS RAJDOOT (FPV)
                    </button>
                    <button 
                      className="btn-dispatch-hovercraft"
                      onClick={() => handleDispatchQRT(sos.id, 'ICG Air Cushion Vehicle H-187')}
                    >
                      DEPLOY HOVERCRAFT
                    </button>
                  </>
                )}

                {isDispatched && (
                  <button 
                    className="btn-mark-rescued"
                    onClick={() => handleResolveSOS(sos.id)}
                  >
                    <CheckCircle size={14} /> CONFIRM RESCUE / CLOSE INCIDENT
                  </button>
                )}

                {isRescued && (
                  <div className="rescued-notice">
                    <CheckCircle size={16} className="text-green" /> Incident closed. Survivor debrief logged to MRCC records.
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
