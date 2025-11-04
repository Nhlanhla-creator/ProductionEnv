// tabs/DataIntegrityTrustLayer.js
import React from 'react';
import { FiEye } from 'react-icons/fi';

// Styles for DataIntegrityTrustLayer
const styles = `
.data-integrity {
  width: 100%;
}

.data-integrity-grid {
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

.verification-table tr:hover {
  background-color: #f9f9f9;
  transform: none !important;
  animation: none !important;
  transition: none !important;
}

/* Status badges */
.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  display: inline-block;
  text-align: center;
  min-width: 60px;
}

.status-badge.verified {
  background-color: #4CAF50;
  color: white;
}

.status-badge.partial {
  background-color: #FF9800;
  color: white;
}

.status-badge.unverified {
  background-color: #f44336;
  color: white;
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

/* Responsive Design */
@media (max-width: 992px) {
  .data-integrity-grid {
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
}

@media (max-width: 576px) {
  .chart-container {
    padding: 15px;
    height: 320px;
  }
  
  .data-integrity-grid {
    padding: 0 5px;
  }
  
  .data-table {
    font-size: 12px;
  }
  
  .data-table th,
  .data-table td {
    padding: 8px;
  }
  
  .status-badge {
    font-size: 10px;
    padding: 3px 6px;
    min-width: 50px;
  }
}
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

const DataIntegrityTrustLayer = ({ openPopup }) => {
  return (
    <div className="data-integrity">
      <div className="data-integrity-grid">
        <div className="chart-container full-width">
          <div className="chart-header">
            <h3 className="chart-title">Compliance Verification Status</h3>
            <button 
              className="breakdown-icon-btn"
              onClick={() => openPopup(
                <div className="popup-content">
                  <h3>Compliance Verification Status</h3>
                  <div className="popup-description">
                    Detailed compliance verification status across all regulatory requirements
                  </div>
                  <div className="table-container-popup">
                    <table className="data-table verification-table">
                      <thead>
                        <tr>
                          <th>SME</th>
                          <th>CIPC</th>
                          <th>Tax</th>
                          <th>KYC</th>
                          <th>Audit Stamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>FemmeTech Labs</td>
                          <td><span className="status-badge verified">Verified</span></td>
                          <td><span className="status-badge verified">Verified</span></td>
                          <td><span className="status-badge verified">Verified</span></td>
                          <td>2024-12-01</td>
                        </tr>
                        <tr>
                          <td>Green Agro</td>
                          <td><span className="status-badge verified">Verified</span></td>
                          <td><span className="status-badge partial">Partial</span></td>
                          <td><span className="status-badge verified">Verified</span></td>
                          <td>2024-11-15</td>
                        </tr>
                        <tr>
                          <td>Tech Innovate</td>
                          <td><span className="status-badge unverified">Pending</span></td>
                          <td><span className="status-badge verified">Verified</span></td>
                          <td><span className="status-badge partial">Partial</span></td>
                          <td>2024-12-10</td>
                        </tr>
                        <tr>
                          <td>Urban Solutions</td>
                          <td><span className="status-badge verified">Verified</span></td>
                          <td><span className="status-badge verified">Verified</span></td>
                          <td><span className="status-badge verified">Verified</span></td>
                          <td>2024-10-22</td>
                        </tr>
                        <tr>
                          <td>Service Provider</td>
                          <td><span className="status-badge partial">Partial</span></td>
                          <td><span className="status-badge unverified">Pending</span></td>
                          <td><span className="status-badge verified">Verified</span></td>
                          <td>2024-11-30</td>
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
            <table className="data-table verification-table">
              <thead>
                <tr>
                  <th>SME</th>
                  <th>CIPC</th>
                  <th>Tax</th>
                  <th>KYC</th>
                  <th>Audit Stamp</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>FemmeTech Labs</td>
                  <td><span className="status-badge verified">Verified</span></td>
                  <td><span className="status-badge verified">Verified</span></td>
                  <td><span className="status-badge verified">Verified</span></td>
                  <td>2024-12-01</td>
                </tr>
                <tr>
                  <td>Green Agro</td>
                  <td><span className="status-badge verified">Verified</span></td>
                  <td><span className="status-badge partial">Partial</span></td>
                  <td><span className="status-badge verified">Verified</span></td>
                  <td>2024-11-15</td>
                </tr>
                <tr>
                  <td>Tech Innovate</td>
                  <td><span className="status-badge unverified">Pending</span></td>
                  <td><span className="status-badge verified">Verified</span></td>
                  <td><span className="status-badge partial">Partial</span></td>
                  <td>2024-12-10</td>
                </tr>
                <tr>
                  <td>Urban Solutions</td>
                  <td><span className="status-badge verified">Verified</span></td>
                  <td><span className="status-badge verified">Verified</span></td>
                  <td><span className="status-badge verified">Verified</span></td>
                  <td>2024-10-22</td>
                </tr>
                <tr>
                  <td>Service Provider</td>
                  <td><span className="status-badge partial">Partial</span></td>
                  <td><span className="status-badge unverified">Pending</span></td>
                  <td><span className="status-badge verified">Verified</span></td>
                  <td>2024-11-30</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataIntegrityTrustLayer;