import React from 'react'
import { FISH_MARKET_PRICES } from '../mockData'
import { TrendingUp, TrendingDown, Minus, DollarSign, Fish, Calendar, Award } from 'lucide-react'

export const FisheriesAnalytics: React.FC = () => {
  return (
    <div className="fisheries-analytics-container">
      {/* Header */}
      <div className="fisheries-header-banner">
        <div className="f-icon-wrap">
          <Fish size={32} className="text-cyan" />
        </div>
        <div className="f-title-wrap">
          <div className="f-tag">DEPARTMENT OF FISHERIES • MPEDA & CMFRI DATA FEEDS</div>
          <h2>Marine Fisheries Economic Intelligence & Mandi Rates</h2>
          <p>
            Real-time coastal landing prices, sustainable catch quota monitoring, and seasonal ban enforcement across Indian maritime states.
          </p>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="fisheries-stat-cards">
        <div className="f-stat-card">
          <span className="f-lbl">Daily Landings Monitored</span>
          <span className="f-num text-cyan">4,820 MT</span>
          <span className="f-sub">Kasimedu, Cochin, Vizag & Veraval</span>
        </div>
        <div className="f-stat-card">
          <span className="f-lbl">Average Fisherman Realization</span>
          <span className="f-num text-green">₹ 420 / kg</span>
          <span className="f-sub">+18% via Direct Mandi Integration</span>
        </div>
        <div className="f-stat-card">
          <span className="f-lbl">PFZ Advisory Fuel Savings</span>
          <span className="f-num text-cyan">32.4 %</span>
          <span className="f-sub">INCOIS ocean thermal front guidance</span>
        </div>
        <div className="f-stat-card">
          <span className="f-lbl">Monsoon Ban Status</span>
          <span className="f-num text-amber">LIFTED</span>
          <span className="f-sub">Next ban: April 15 (East Coast)</span>
        </div>
      </div>

      {/* Mandi Table */}
      <div className="mandi-table-card">
        <div className="mandi-table-header">
          <h3>🐟 Live Fish Market (Mandi) Rates Across Coastal Harbors</h3>
          <span className="text-muted text-xs">Updated Every 30 Minutes from Harbor Kiosks</span>
        </div>

        <table className="gov-table">
          <thead>
            <tr>
              <th>Commercial Species</th>
              <th>Regional Name</th>
              <th>Major Harbor / Landing Centre</th>
              <th>Wholesale Rate (₹ / kg)</th>
              <th>24h Trend</th>
              <th>Verified Source</th>
            </tr>
          </thead>
          <tbody>
            {FISH_MARKET_PRICES.map((item, idx) => (
              <tr key={idx}>
                <td>
                  <strong>{item.species}</strong>
                </td>
                <td>
                  <span className="regional-tamil">{item.speciesTamil || '—'}</span>
                </td>
                <td>
                  <span className="port-badge">{item.port}</span>
                </td>
                <td>
                  <span className="price-tag font-mono font-bold">₹ {item.price_per_kg}</span>
                </td>
                <td>
                  <div className="trend-badge">
                    {item.trend === 'up' && <span className="trend-up"><TrendingUp size={14} /> +8.5%</span>}
                    {item.trend === 'down' && <span className="trend-down"><TrendingDown size={14} /> -4.2%</span>}
                    {item.trend === 'stable' && <span className="trend-stable"><Minus size={14} /> Steady</span>}
                  </div>
                </td>
                <td>
                  <span className="text-muted text-xs font-mono">{item.source}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
