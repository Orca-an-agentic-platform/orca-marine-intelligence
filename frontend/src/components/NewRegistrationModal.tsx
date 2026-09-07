import React, { useState } from 'react'
import { Vessel } from '../types'
import { Shield, CheckCircle, Fingerprint, QrCode, FileText, Anchor, UserCheck, X } from 'lucide-react'

interface NewRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onRegisterVessel: (newVessel: Vessel) => void
}

export const NewRegistrationModal: React.FC<NewRegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegisterVessel
}) => {
  if (!isOpen) return null

  const [formData, setFormData] = useState({
    name: 'M/V Meenatchi Amman',
    registrationNo: 'IND-TN-04-MM-5512',
    ownerName: 'P. Arul Rajan',
    aadhaarNo: '5542 9901 8834',
    marineCardId: 'TN-BIO-2026-8819',
    vesselType: 'Mechanized Trawler' as const,
    engineHp: 160,
    engineSerial: 'KIRLOSKAR-MAR-99410',
    portOfOrigin: 'Rameswaram Fisheries Harbor',
    transponderId: 'DAT-SG-55120'
  })

  const [isVerifying, setIsVerifying] = useState(false)
  const [kycSuccess, setKycSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsVerifying(true)

    // Simulate multi-tier government KYC verification against ReALCraft and UIDAI
    setTimeout(() => {
      setIsVerifying(false)
      setKycSuccess(true)

      const newVessel: Vessel = {
        id: `V-${Date.now().toString().slice(-4)}`,
        name: formData.name,
        registrationNo: formData.registrationNo,
        ownerName: formData.ownerName,
        aadhaarHash: `XXXX-XXXX-${formData.aadhaarNo.slice(-4)}`,
        biometricCardId: formData.marineCardId,
        vesselType: formData.vesselType,
        engineHp: formData.engineHp,
        portOfOrigin: formData.portOfOrigin,
        currentLat: 9.35,
        currentLon: 79.40,
        speedKnots: 6.4,
        headingDeg: 90,
        crewCount: 5,
        distToImblKm: 14.2,
        authStatus: 'VERIFIED',
        lastBiometricScan: 'Just now (Harbor Kiosk Verification)',
        transponderId: formData.transponderId
      }

      setTimeout(() => {
        onRegisterVessel(newVessel)
        alert(`✅ OFFICIAL HARBOR KYC APPROVED:\nVessel ${formData.registrationNo} registered successfully!\n• UIDAI Aadhaar Hash: Validated\n• Marine Card: Authenticated via Department of Fisheries\n• ReALCraft Engine Serial: Matched\n\nVessel is now cleared for navigation in Indian EEZ.`)
        onClose()
      }, 1000)
    }, 1200)
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog-gov modal-lg">
        <div className="modal-header-gov">
          <div className="m-title-block">
            <span className="m-tag">DEPARTMENT OF FISHERIES & COAST GUARD VERIFICATION CELL</span>
            <h3>🛡️ Harbor Biometric & Vessel KYC Enrollment</h3>
          </div>
          <button className="btn-modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body-gov">
          <div className="kyc-notice-box">
            <Fingerprint size={20} className="text-cyan" />
            <p>
              <strong>Anti-Fraud Verification:</strong> All submitted credentials are cross-referenced with the <em>UIDAI Aadhaar Offline KYC</em> and <em>Ministry of Fisheries ReALCraft National Registry</em> to prevent unauthorized vessel registration or foreign infiltration.
            </p>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Master Fisherman Full Name:</label>
              <input
                type="text"
                required
                className="gov-input"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Aadhaar Card Number (Hashed at Harbor):</label>
              <input
                type="text"
                required
                className="gov-input font-mono"
                value={formData.aadhaarNo}
                onChange={(e) => setFormData({ ...formData, aadhaarNo: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Marine Biometric Card ID (Dept of Fisheries):</label>
              <input
                type="text"
                required
                className="gov-input font-mono"
                value={formData.marineCardId}
                onChange={(e) => setFormData({ ...formData, marineCardId: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Vessel Craft Name:</label>
              <input
                type="text"
                required
                className="gov-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">ReALCraft Vessel Registration Number:</label>
              <input
                type="text"
                required
                className="gov-input font-mono"
                value={formData.registrationNo}
                onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Inboard Engine Serial Number (Anti-Tamper):</label>
              <input
                type="text"
                required
                className="gov-input font-mono"
                value={formData.engineSerial}
                onChange={(e) => setFormData({ ...formData, engineSerial: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Base Harbor / Port of Origin:</label>
              <select
                className="gov-select"
                value={formData.portOfOrigin}
                onChange={(e) => setFormData({ ...formData, portOfOrigin: e.target.value })}
              >
                <option>Rameswaram Fisheries Harbor (Tamil Nadu)</option>
                <option>Mandapam Pier (Tamil Nadu)</option>
                <option>Kasimedu Chennai Harbor (Tamil Nadu)</option>
                <option>Cochin Fisheries Harbor (Kerala)</option>
                <option>Visakhapatnam Port (Andhra Pradesh)</option>
                <option>Paradip Harbor (Odisha)</option>
                <option>Veraval Commercial Harbor (Gujarat)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">NavIC / DAT-SG Satellite Transponder UUID:</label>
              <input
                type="text"
                required
                className="gov-input font-mono"
                value={formData.transponderId}
                onChange={(e) => setFormData({ ...formData, transponderId: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer-gov">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button 
              type="submit" 
              className="btn-submit-kyc"
              disabled={isVerifying || kycSuccess}
            >
              {isVerifying ? (
                <span>VALIDATING WITH REALCRAFT & UIDAI...</span>
              ) : kycSuccess ? (
                <span>✅ VERIFICATION PASSED</span>
              ) : (
                <span>AUTHENTICATE & REGISTER VESSEL</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
