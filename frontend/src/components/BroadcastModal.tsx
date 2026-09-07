import React, { useState } from 'react'
import { Radio, AlertTriangle, Send, CheckCircle, ShieldAlert, X } from 'lucide-react'

interface BroadcastModalProps {
  isOpen: boolean
  onClose: () => void
  cycloneActive: boolean
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({ isOpen, onClose, cycloneActive }) => {
  if (!isOpen) return null

  const [message, setMessage] = useState(
    cycloneActive
      ? '🔴 RED ALERT: Cyclone Warning BOB-02 issued by IMD/INCOIS. All vessels within 100 NM of North Odisha-Bengal coast must return to nearest harbor immediately. High swell 4.5m expected.'
      : '⚠️ MARITIME ADVISORY: Palk Bay fishermen must maintain minimum 5km distance from IMBL line. Check biometric card clearance at harbor before setting sail.'
  )
  const [channels, setChannels] = useState({
    datSg: true,
    navtex: true,
    sms: true,
    sirens: cycloneActive
  })
  const [broadcastSent, setBroadcastSent] = useState(false)

  const handleSend = () => {
    setBroadcastSent(true)
    setTimeout(() => {
      alert('📢 OFFICIAL BROADCAST DISPATCHED:\n• ISRO NavIC DAT-SG Satellite Blip: Transmitted to 4,280 vessels\n• Coastal NAVTEX 518 kHz: Transmitted from Chennai & Mumbai stations\n• Mass SMS: 18,920 registered fishermen notified.')
      setBroadcastSent(false)
      onClose()
    }, 1500)
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog-gov">
        <div className="modal-header-gov">
          <div className="m-title-block">
            <span className="m-tag">MINISTRY OF EARTH SCIENCES • DISASTER PROTOCOL</span>
            <h3>🛰️ Emergency Mass Maritime Broadcast System</h3>
          </div>
          <button className="btn-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body-gov">
          <p className="modal-desc">
            Direct transmission channel connected to ISRO NavIC satellite gateways, coastal radio stations, and the National Disaster Management Authority (NDMA) SMS gateway.
          </p>

          <div className="form-group">
            <label className="form-label">Broadcast Advisory Text:</label>
            <textarea
              className="gov-textarea"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Active Dissemination Channels:</label>
            <div className="channel-checkbox-grid">
              <label className="channel-chk">
                <input
                  type="checkbox"
                  checked={channels.datSg}
                  onChange={(e) => setChannels({ ...channels, datSg: e.target.checked })}
                />
                <span>🛰️ ISRO NavIC DAT-SG Satellite Terminals</span>
              </label>

              <label className="channel-chk">
                <input
                  type="checkbox"
                  checked={channels.navtex}
                  onChange={(e) => setChannels({ ...channels, navtex: e.target.checked })}
                />
                <span>📻 Coastal NAVTEX Radio (518 kHz)</span>
              </label>

              <label className="channel-chk">
                <input
                  type="checkbox"
                  checked={channels.sms}
                  onChange={(e) => setChannels({ ...channels, sms: e.target.checked })}
                />
                <span>📱 GSM Cellular SMS (Aadhaar Linked Numbers)</span>
              </label>

              <label className="channel-chk">
                <input
                  type="checkbox"
                  checked={channels.sirens}
                  onChange={(e) => setChannels({ ...channels, sirens: e.target.checked })}
                />
                <span>🚨 Coastal Early Warning Siren Towers (Disaster Mgmt)</span>
              </label>
            </div>
          </div>
        </div>

        <div className="modal-footer-gov">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button 
            className="btn-submit-broadcast"
            onClick={handleSend}
            disabled={broadcastSent}
          >
            {broadcastSent ? 'TRANSMITTING SATELLITE PACKETS...' : 'TRANSMIT MASS BROADCAST'}
          </button>
        </div>
      </div>
    </div>
  )
}
