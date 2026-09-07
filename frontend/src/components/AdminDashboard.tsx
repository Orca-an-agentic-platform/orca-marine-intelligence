import React, { useState, useEffect } from 'react'
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Eye,
  Search,
  RefreshCw,
  Users,
  AlertTriangle
} from 'lucide-react'

interface Registration {
  id: string
  name: string
  phone: string
  password: string
  aadharNumber: string
  dob: string
  age: number
  gender: string
  address: string
  district: string
  state: string
  pincode: string
  photo: string
  aadharImage: string
  careOf: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  submittedAt: string
  reviewedAt?: string
}

export const AdminDashboard: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  const loadRegistrations = () => {
    try {
      const data = JSON.parse(localStorage.getItem('orca_pending_registrations') || '[]')
      setRegistrations(data)
    } catch {
      setRegistrations([])
    }
  }

  useEffect(() => {
    loadRegistrations()
  }, [])

  const updateStatus = (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    const updated = registrations.map((r) =>
      r.id === id ? { ...r, status: newStatus, reviewedAt: new Date().toISOString() } : r
    )
    setRegistrations(updated)
    localStorage.setItem('orca_pending_registrations', JSON.stringify(updated))
  }

  const filteredRegs = registrations
    .filter((r) => filter === 'ALL' || r.status === filter)
    .filter(
      (r) =>
        !searchQuery ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.phone.includes(searchQuery) ||
        r.aadharNumber.includes(searchQuery)
    )

  const stats = {
    total: registrations.length,
    pending: registrations.filter((r) => r.status === 'PENDING').length,
    approved: registrations.filter((r) => r.status === 'APPROVED').length,
    rejected: registrations.filter((r) => r.status === 'REJECTED').length
  }

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return iso
    }
  }

  return (
    <div className="admin-dashboard-container">
      {/* Header */}
      <div className="admin-dash-header">
        <div className="admin-header-left">
          <ShieldCheck size={28} className="text-sky-400" />
          <div>
            <h1 className="admin-dash-title">Admin Verification Panel</h1>
            <p className="admin-dash-subtitle">Review and manage fisherman registration requests</p>
          </div>
        </div>
        <button className="admin-refresh-btn" onClick={loadRegistrations} title="Refresh registrations">
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="admin-stats-row">
        <div className="admin-stat-card stat-total" onClick={() => setFilter('ALL')}>
          <Users size={22} />
          <div className="stat-info">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>
        <div className="admin-stat-card stat-pending" onClick={() => setFilter('PENDING')}>
          <Clock size={22} />
          <div className="stat-info">
            <span className="stat-number">{stats.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
        <div className="admin-stat-card stat-approved" onClick={() => setFilter('APPROVED')}>
          <CheckCircle2 size={22} />
          <div className="stat-info">
            <span className="stat-number">{stats.approved}</span>
            <span className="stat-label">Approved</span>
          </div>
        </div>
        <div className="admin-stat-card stat-rejected" onClick={() => setFilter('REJECTED')}>
          <XCircle size={22} />
          <div className="stat-info">
            <span className="stat-number">{stats.rejected}</span>
            <span className="stat-label">Rejected</span>
          </div>
        </div>
      </div>

      {/* Filter + Search */}
      <div className="admin-filter-bar">
        <div className="admin-filter-tabs">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((f) => (
            <button
              key={f}
              className={`admin-filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
              <span className="filter-count">
                {f === 'ALL' ? stats.total : f === 'PENDING' ? stats.pending : f === 'APPROVED' ? stats.approved : stats.rejected}
              </span>
            </button>
          ))}
        </div>
        <div className="admin-search-box">
          <Search size={15} />
          <input
            type="text"
            placeholder="Search by name, phone, or Aadhaar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Registration Cards */}
      <div className="admin-reg-list">
        {filteredRegs.length === 0 ? (
          <div className="admin-empty-state">
            <AlertTriangle size={40} className="text-slate-500" />
            <p>No registrations found{filter !== 'ALL' ? ` with status "${filter}"` : ''}.</p>
          </div>
        ) : (
          filteredRegs.map((reg) => (
            <div key={reg.id} className={`admin-reg-card reg-status-${reg.status.toLowerCase()}`}>
              <div className="reg-card-main">
                {/* Photo */}
                <div className="reg-photo-col">
                  {reg.photo ? (
                    <img src={reg.photo} alt={reg.name} className="reg-photo-img" />
                  ) : (
                    <div className="reg-photo-placeholder">
                      <User size={32} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="reg-info-col">
                  <div className="reg-name-row">
                    <h3 className="reg-name">{reg.name}</h3>
                    <span className={`reg-status-badge badge-${reg.status.toLowerCase()}`}>
                      {reg.status === 'PENDING' && <Clock size={12} />}
                      {reg.status === 'APPROVED' && <CheckCircle2 size={12} />}
                      {reg.status === 'REJECTED' && <XCircle size={12} />}
                      {reg.status}
                    </span>
                  </div>

                  <div className="reg-details-grid">
                    <div className="reg-detail-item">
                      <Phone size={14} />
                      <span>+91 {reg.phone}</span>
                    </div>
                    <div className="reg-detail-item">
                      <CreditCard size={14} />
                      <span>{reg.aadharNumber}</span>
                    </div>
                    <div className="reg-detail-item">
                      <Calendar size={14} />
                      <span>DOB: {reg.dob}</span>
                    </div>
                    <div className="reg-detail-item">
                      <User size={14} />
                      <span>{reg.gender}, {reg.age} yrs</span>
                    </div>
                  </div>

                  <div className="reg-detail-item reg-address-item">
                    <MapPin size={14} />
                    <span>{reg.address || 'No address'}</span>
                  </div>

                  <div className="reg-meta-row">
                    <span className="reg-submitted-at">Submitted: {formatDate(reg.submittedAt)}</span>
                    {reg.reviewedAt && (
                      <span className="reg-reviewed-at">Reviewed: {formatDate(reg.reviewedAt)}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="reg-actions-col">
                  {reg.status === 'PENDING' ? (
                    <>
                      <button
                        className="admin-action-btn btn-approve"
                        onClick={() => updateStatus(reg.id, 'APPROVED')}
                        title="Approve this registration"
                      >
                        <CheckCircle2 size={16} />
                        <span>Accept</span>
                      </button>
                      <button
                        className="admin-action-btn btn-reject"
                        onClick={() => updateStatus(reg.id, 'REJECTED')}
                        title="Reject this registration"
                      >
                        <XCircle size={16} />
                        <span>Reject</span>
                      </button>
                    </>
                  ) : (
                    <span className="reg-action-done">
                      {reg.status === 'APPROVED' ? '✅ Verified' : '❌ Declined'}
                    </span>
                  )}
                  <button
                    className="admin-action-btn btn-view-details"
                    onClick={() => setExpandedCard(expandedCard === reg.id ? null : reg.id)}
                  >
                    <Eye size={14} />
                    <span>{expandedCard === reg.id ? 'Hide' : 'View'} Aadhaar</span>
                  </button>
                </div>
              </div>

              {/* Expanded Aadhaar View */}
              {expandedCard === reg.id && reg.aadharImage && (
                <div className="reg-expanded-aadhaar">
                  <img src={reg.aadharImage} alt="Aadhaar Card" className="reg-aadhaar-full-img" />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
