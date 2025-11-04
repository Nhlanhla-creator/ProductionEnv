// tabs/InsightsAIRecommendations.js
import React, { useState } from 'react';
import { FiEye, FiArrowUp, FiAlertTriangle } from 'react-icons/fi';

// Styles for InsightsAIRecommendations
const styles = `
.insights-ai {
  width: 100%;
}

.time-view-controls {
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-end;
  padding: 0 10px;
}

.time-view-selector {
  display: flex;
  gap: 8px;
  background: #f5f5f5;
  padding: 8px 12px;
  border-radius: 8px;
  align-items: center;
}

.time-view-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
  margin-right: 8px;
}

.time-view-btn {
  padding: 6px 12px;
  border: none;
  background: transparent;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  color: #666;
  transition: none !important;
  animation: none !important;
  transform: none !important;
}

.time-view-btn.active {
  background-color: #7d5a36;
  color: white;
}

.time-view-btn:hover:not(.active) {
  background-color: #e0e0e0;
  transform: none !important;
  animation: none !important;
}

.insights-charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  padding: 0 10px;
}

.chart-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  height: 420px;
  position: relative;
  overflow: hidden;
  transition: none !important;
  animation: none !important;
  transform: none !important;
}

.chart-container:hover {
  transform: none !important;
  animation: none !important;
  transition: none !important;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.chart-container.full-width {
  grid-column: 1 / -1;
  height: 450px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.chart-title {
  margin: 0 0 10px 0;
  color: #5e3f26;
  font-size: 16px;
  font-weight: 600;
  padding-bottom: 10px;
  border-bottom: 1px solid #ede4d8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  line-height: 1.3;
  min-height: 40px;
}

.breakdown-icon-btn {
  background: none;
  border: none;
  color: #7d5a36;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: none !important;
  animation: none !important;
  transform: none !important;
}

.breakdown-icon-btn:hover {
  background: #f0f0f0;
  transform: none !important;
  animation: none !important;
}

/* Table Styles */
.table-container {
  overflow-x: auto;
  margin-top: 10px;
  height: 300px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table th {
  background-color: #f5f5f5;
  color: #5e3f26;
  font-weight: 600;
  padding: 12px;
  text-align: left;
  border-bottom: 2px solid #ede4d8;
}

.data-table td {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.data-table tr:hover {
  background-color: #f9f9f9;
  transform: none !important;
  animation: none !important;
  transition: none !important;
}

.risk-table tr:hover {
  background-color: #fff3f3;
  transform: none !important;
  animation: none !important;
  transition: none !important;
}

/* Trend Alert Cards */
.trend-alert-card {
  background: white;
  border-radius: 8px;
  padding: 15px;
  border-left: 4px solid #4CAF50;
  height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: none !important;
  animation: none !important;
  transform: none !important;
}

.trend-alert-card.negative {
  border-left-color: #f44336;
}

.trend-alert-card:hover {
  transform: none !important;
  animation: none !important;
  transition: none !important;
  box-shadow: none !important;
}

.trend-alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.trend-alert-title {
  font-size: 14px;
  font-weight: 600;
  color: #5e3f26;
}

.trend-alert-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.trend-alert-icon.positive {
  background: #E8F5E8;
  color: #4CAF50;
}

.trend-alert-icon.negative {
  background: #FFEBEE;
  color: #f44336;
}

.trend-alert-value {
  font-size: 18px;
  font-weight: 700;
  color: #5e3f26;
  margin-bottom: 5px;
}

.trend-alert-description {
  font-size: 11px;
  color: #666;
  margin-bottom: 8px;
  line-height: 1.3;
}

.trend-alerts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 20px;
}

/* Popup Styles */
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.popup-container {
  background: white;
  border-radius: 12px;
  padding: 30px;
  max-width: 90%;
  max-height: 90%;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.popup-close {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 20px;
  color: #666;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: none !important;
  animation: none !important;
  transform: none !important;
}

.popup-close:hover {
  background: #f0f0f0;
  color: #333;
  transform: none !important;
  animation: none !important;
}

.popup-content {
  width: 100%;
}

.popup-content h3 {
  margin: 0 0 20px 0;
  color: #5e3f26;
  font-size: 24px;
  text-align: center;
  border-bottom: 2px solid #ede4d8;
  padding-bottom: 15px;
}

.popup-description {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
  text-align: center;
  line-height: 1.5;
  font-style: italic;
  background: #f8f9fa;
  padding: 12px 15px;
  border-radius: 6px;
  border-left: 3px solid #7d5a36;
}

.table-container-popup {
  overflow-x: auto;
  margin-top: 15px;
}

.trend-alerts-grid-popup {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 20px;
}

/* Responsive Design */
@media (max-width: 992px) {
  .insights-charts-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-container {
    height: 380px;
  }
}

@media (max-width: 768px) {
  .chart-container {
    height: 350px;
    padding: 15px;
  }
  
  .trend-alerts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 576px) {
  .chart-container {
    padding: 15px;
    height: 320px;
  }
  
  .insights-charts-grid {
    padding: 0 5px;
  }
  
  .data-table {
    font-size: 12px;
  }
  
  .data-table th,
  .data-table td {
    padding: 8px;
  }
  
  .trend-alert-card {
    height: 100px;
    padding: 12px;
  }
  
  .trend-alert-value {
    font-size: 16px;
  }
  
  .trend-alert-description {
    font-size: 10px;
  }
}
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

const InsightsAIRecommendations = ({ openPopup }) => {
  const [portfolioTrendView, setPortfolioTrendView] = useState('Quarterly');

  // Time View Selector Component
  const TimeViewSelector = ({ currentView, onViewChange, views = ['Monthly', 'Quarterly', 'Yearly'] }) => (
    <div className="time-view-selector">
      <span className="time-view-label">View:</span>
      {views.map(view => (
        <button
          key={view}
          className={`time-view-btn ${currentView === view ? 'active' : ''}`}
          onClick={() => onViewChange(view)}
        >
          {view}
        </button>
      ))}
    </div>
  );

  // Trend Alert Card Component
  const TrendAlertCard = ({ title, value, description, trend, isPositive = true }) => (
    <div className={`trend-alert-card ${isPositive ? 'positive' : 'negative'}`}>
      <div className="trend-alert-header">
        <div className="trend-alert-title">{title}</div>
        <div className={`trend-alert-icon ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? <FiArrowUp /> : <FiAlertTriangle />}
        </div>
      </div>
      <div className="trend-alert-value">{value}</div>
      <div className="trend-alert-description">{description}</div>
    </div>
  );

  return (
    <div className="insights-ai">
      <div className="time-view-controls">
        <TimeViewSelector 
          currentView={portfolioTrendView} 
          onViewChange={setPortfolioTrendView}
        />
      </div>
      
      <div className="insights-charts-grid">
        <div className="chart-container full-width">
          <div className="chart-header">
            <h3 className="chart-title">Top 5 High-Performers</h3>
            <button 
              className="breakdown-icon-btn"
              onClick={() => openPopup(
                <div className="popup-content">
                  <h3>Top 5 High-Performers</h3>
                  <div className="popup-description">
                    SMEs showing exceptional performance and growth potential
                  </div>
                  <div className="table-container-popup">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>SME</th>
                          <th>Score</th>
                          <th>Growth %</th>
                          <th>Ask</th>
                          <th>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>FemmeTech Labs</td>
                          <td>88</td>
                          <td>+32%</td>
                          <td>R15m</td>
                          <td>Market leader in sector</td>
                        </tr>
                        <tr>
                          <td>Green Agro</td>
                          <td>85</td>
                          <td>+28%</td>
                          <td>R8m</td>
                          <td>Sustainable practices</td>
                        </tr>
                        <tr>
                          <td>Tech Innovate</td>
                          <td>87</td>
                          <td>+45%</td>
                          <td>R12m</td>
                          <td>High growth potential</td>
                        </tr>
                        <tr>
                          <td>Urban Solutions</td>
                          <td>82</td>
                          <td>+25%</td>
                          <td>R6m</td>
                          <td>Strong management</td>
                        </tr>
                        <tr>
                          <td>EduTech SA</td>
                          <td>84</td>
                          <td>+38%</td>
                          <td>R10m</td>
                          <td>Social impact focus</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              title="View details"
            >
              <FiEye />
            </button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>SME</th>
                  <th>Score</th>
                  <th>Growth %</th>
                  <th>Ask</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>FemmeTech Labs</td>
                  <td>88</td>
                  <td>+32%</td>
                  <td>R15m</td>
                  <td>Market leader in sector</td>
                </tr>
                <tr>
                  <td>Green Agro</td>
                  <td>85</td>
                  <td>+28%</td>
                  <td>R8m</td>
                  <td>Sustainable practices</td>
                </tr>
                <tr>
                  <td>Tech Innovate</td>
                  <td>87</td>
                  <td>+45%</td>
                  <td>R12m</td>
                  <td>High growth potential</td>
                </tr>
                <tr>
                  <td>Urban Solutions</td>
                  <td>82</td>
                  <td>+25%</td>
                  <td>R6m</td>
                  <td>Strong management</td>
                </tr>
                <tr>
                  <td>EduTech SA</td>
                  <td>84</td>
                  <td>+38%</td>
                  <td>R10m</td>
                  <td>Social impact focus</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="chart-container full-width">
          <div className="chart-header">
            <h3 className="chart-title">At-Risk / Watchlist SMEs</h3>
            <button 
              className="breakdown-icon-btn"
              onClick={() => openPopup(
                <div className="popup-content">
                  <h3>At-Risk / Watchlist SMEs</h3>
                  <div className="popup-description">
                    SMEs requiring attention due to performance or compliance issues
                  </div>
                  <div className="table-container-popup">
                    <table className="data-table risk-table">
                      <thead>
                        <tr>
                          <th>SME</th>
                          <th>Risk Flag</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Coastal Retail</td>
                          <td>Missed 2 reports</td>
                          <td>Follow up required</td>
                        </tr>
                        <tr>
                          <td>Manufacturing Co</td>
                          <td>Revenue decline</td>
                          <td>Performance review</td>
                        </tr>
                        <tr>
                          <td>Service Provider</td>
                          <td>Compliance issues</td>
                          <td>Audit needed</td>
                        </tr>
                        <tr>
                          <td>Urban Solutions</td>
                          <td>Market volatility</td>
                          <td>Monitor closely</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              title="View details"
            >
              <FiEye />
            </button>
          </div>
          <div className="table-container">
            <table className="data-table risk-table">
              <thead>
                <tr>
                  <th>SME</th>
                  <th>Risk Flag</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Coastal Retail</td>
                  <td>Missed 2 reports</td>
                  <td>Follow up required</td>
                </tr>
                <tr>
                  <td>Manufacturing Co</td>
                  <td>Revenue decline</td>
                  <td>Performance review</td>
                </tr>
                <tr>
                  <td>Service Provider</td>
                  <td>Compliance issues</td>
                  <td>Audit needed</td>
                </tr>
                <tr>
                  <td>Urban Solutions</td>
                  <td>Market volatility</td>
                  <td>Monitor closely</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="chart-container full-width">
          <div className="chart-header">
            <h3 className="chart-title">Portfolio Trend Alerts</h3>
            <button 
              className="breakdown-icon-btn"
              onClick={() => openPopup(
                <div className="popup-content">
                  <h3>Portfolio Trend Alerts</h3>
                  <div className="popup-description">
                    Key performance indicators and trend analysis across the portfolio
                  </div>
                  <div className="trend-alerts-grid-popup">
                    <TrendAlertCard 
                      title="Defaults" 
                      value="↓ to 4.2%" 
                      description="Significant improvement in portfolio health"
                      trend="down"
                      isPositive={true}
                    />
                    <TrendAlertCard 
                      title="ESG Scores" 
                      value="↑ 5.6%" 
                      description="Improved environmental performance"
                      trend="up"
                      isPositive={true}
                    />
                    <TrendAlertCard 
                      title="Pipeline Aging" 
                      value="10 SMEs >6mo" 
                      description="Increased pipeline stagnation risk"
                      trend="up"
                      isPositive={false}
                    />
                    <TrendAlertCard 
                      title="Revenue Growth" 
                      value="↑ 12%" 
                      description="Strong quarter-over-quarter performance"
                      trend="up"
                      isPositive={true}
                    />
                  </div>
                </div>
              )}
              title="View details"
            >
              <FiEye />
            </button>
          </div>
          <div className="trend-alerts-grid">
            <TrendAlertCard 
              title="Defaults" 
              value="↓ to 4.2%" 
              description="Significant improvement in portfolio health"
              trend="down"
              isPositive={true}
            />
            <TrendAlertCard 
              title="ESG Scores" 
              value="↑ 5.6%" 
              description="Improved environmental performance"
              trend="up"
              isPositive={true}
            />
            <TrendAlertCard 
              title="Pipeline Aging" 
              value="10 SMEs >6mo" 
              description="Increased pipeline stagnation risk"
              trend="up"
              isPositive={false}
            />
            <TrendAlertCard 
              title="Revenue Growth" 
              value="↑ 12%" 
              description="Strong quarter-over-quarter performance"
              trend="up"
              isPositive={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsAIRecommendations;