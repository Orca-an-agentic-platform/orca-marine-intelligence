import React, { useState } from 'react'
import { AlertTriangle, Waves, Wind, Cloud, Fish, CheckCircle, Info } from 'lucide-react'

type TabKey = 'risk' | 'evidence' | 'alerts'

interface RiskFactor {
  icon: React.ReactNode
  label: string
  detail: string
  dotColor?: string
}

const riskFactors: RiskFactor[] = [
  {
    icon: <Waves size={16} />,
    label: 'Wave Height',
    detail: '1.8m',
    dotColor: '#38bdf8',
  },
  {
    icon: <Wind size={16} />,
    label: 'Wind Speed',
    detail: '22 km/h',
    dotColor: '#a78bfa',
  },
  {
    icon: <Cloud size={16} />,
    label: 'SW Monsoon Active',
    detail: 'Seasonal',
    dotColor: '#f87171',
  },
  {
    icon: <Fish size={16} />,
    label: 'PFZ Available',
    detail: '12 from 100',
    dotColor: '#4ade80',
  },
  {
    icon: <CheckCircle size={16} />,
    label: 'No Cyclone',
    detail: 'Calm',
    dotColor: '#4ade80',
  },
]

export const RiskPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('risk')
  const riskScore = 35

  return (
    <div className="fd-risk-panel">
      {/* Header */}
      <div className="risk-panel-header">
        <span className="risk-title">Risk Assessment</span>
        <span className="risk-badge moderate">MODERATE</span>
      </div>

      {/* Score */}
      <div className="risk-score-section">
        <span className="risk-score-label">Risk Score</span>
        <span className="risk-score-value">{riskScore}/100</span>
      </div>
      <div className="risk-score-bar">
        <div className="risk-score-fill" style={{ width: `${riskScore}%` }} />
      </div>

      {/* Caution Banner */}
      <div className="risk-caution-banner">
        <AlertTriangle size={18} className="caution-icon" />
        <div className="caution-text">
          <span className="caution-level">CAUTION</span>
          <span className="caution-detail">for departure</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="risk-tabs">
        <button
          className={`risk-tab ${activeTab === 'risk' ? 'active' : ''}`}
          onClick={() => setActiveTab('risk')}
        >
          Risk
        </button>
        <button
          className={`risk-tab ${activeTab === 'evidence' ? 'active' : ''}`}
          onClick={() => setActiveTab('evidence')}
        >
          Evidence
        </button>
        <button
          className={`risk-tab ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          Alerts
        </button>
      </div>

      {/* Tab Content */}
      <div className="risk-tab-content">
        {activeTab === 'risk' && (
          <>
            <div className="risk-factors-title">Risk Factors</div>
            <div className="risk-factors-list">
              {riskFactors.map((f, i) => (
                <div key={i} className="risk-factor-item">
                  <div className="risk-factor-left">
                    <div className="risk-factor-icon">{f.icon}</div>
                    <div className="risk-factor-info">
                      <span className="risk-factor-label">{f.label}</span>
                      <span className="risk-factor-detail">{f.detail}</span>
                    </div>
                  </div>
                  {f.dotColor && (
                    <span className="risk-factor-dot" style={{ background: f.dotColor }} />
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'evidence' && (
          <div className="risk-evidence-content">
            <div className="evidence-item">
              <Info size={14} />
              <div>
                <strong>INCOIS Bulletin #RN-2026-09</strong>
                <p>Moderate wave conditions observed along Konkan coast. SW monsoon residual swell persists.</p>
              </div>
            </div>
            <div className="evidence-item">
              <Info size={14} />
              <div>
                <strong>IMD Mumbai Forecast</strong>
                <p>Winds 20-25 km/h from SW. Isolated squally weather possible in evening.</p>
              </div>
            </div>
            <div className="evidence-item">
              <Info size={14} />
              <div>
                <strong>MOSDAC Chlorophyll-a Data</strong>
                <p>PFZ zones identified via satellite imagery. Elevated Chl-a concentrations near Ratnagiri shelf.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="risk-alerts-content">
            <div className="alert-item warning">
              <AlertTriangle size={14} />
              <span>SW Monsoon Advisory: Moderate swells expected along Maharashtra coast through September.</span>
            </div>
            <div className="alert-item info">
              <Info size={14} />
              <span>No active cyclone warnings for Arabian Sea sector.</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Disclaimer */}
      <div className="risk-panel-footer">
        <AlertTriangle size={12} />
        <span>
          Risk assessment based on available data at time of query. Conditions may change. Always
          verify with local authorities before venturing to sea.
        </span>
      </div>
    </div>
  )
}
