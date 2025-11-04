// tabs/PipelineFutureOpportunities.js
import React from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { FiEye } from 'react-icons/fi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Styles for PipelineFutureOpportunities
const styles = `
.pipeline-opportunities {
  width: 100%;
}

.charts-grid-4x4 {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0 10px;
}

.top-row,
.bottom-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.bottom-full {
  grid-column: 1 / -1;
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

.chart-title-fixed {
  font-size: 14px;
  font-weight: 600;
  color: #7d5a36;
  margin-bottom: 15px;
  text-align: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #7d5a36;
}

.chart-area {
  flex-grow: 1;
  min-height: 240px;
  position: relative;
  margin-bottom: 10px;
}

/* Funnel Chart Styles */
.funnel-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  height: 100%;
  justify-content: center;
}

.funnel-stage {
  width: 100%;
  display: flex;
  justify-content: center;
}

.funnel-bar {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  border-radius: 4px;
  position: relative;
  transition: none !important;
  animation: none !important;
  transform: none !important;
}

.funnel-bar:hover {
  transform: none !important;
  animation: none !important;
  transition: none !important;
  box-shadow: none !important;
}

.funnel-label {
  color: white;
  font-weight: 600;
  font-size: 12px;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
}

.funnel-value {
  color: white;
  font-weight: 700;
  font-size: 14px;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
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

.popup-chart {
  height: 300px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.popup-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #7d5a36;
}

.detail-label {
  font-weight: 600;
  color: #5e3f26;
  font-size: 14px;
}

.detail-value {
  font-weight: 600;
  color: #7d5a36;
  font-size: 14px;
}

/* Funnel in popup */
.funnel-container-popup {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  width: 100%;
  padding: 20px;
}

.funnel-stage-popup {
  width: 100%;
  display: flex;
  justify-content: center;
}

.funnel-bar-popup {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-radius: 6px;
  min-width: 200px;
}

.funnel-label-popup {
  color: white;
  font-weight: 600;
  font-size: 14px;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
}

.funnel-value-popup {
  color: white;
  font-weight: 700;
  font-size: 16px;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
}

/* Table in popup */
.table-container-popup {
  overflow-x: auto;
  margin-top: 15px;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .top-row,
  .bottom-row {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .chart-container {
    height: 400px;
  }
}

@media (max-width: 992px) {
  .top-row,
  .bottom-row {
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
  
  .charts-grid-4x4 {
    padding: 0 5px;
  }
  
  .data-table {
    font-size: 12px;
  }
  
  .data-table th,
  .data-table td {
    padding: 8px;
  }
  
  .funnel-bar {
    padding: 0 10px;
  }
  
  .funnel-label {
    font-size: 10px;
  }
  
  .funnel-value {
    font-size: 12px;
  }
}
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

const brownShades = [
  '#5e3f26', '#7d5a36', '#9c7c54', '#b8a082',
  '#3f2a18', '#d4c4b0', '#5D4037', '#3E2723'
];

// Static options
const staticBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, grid: { drawBorder: false } }
  }
};

const staticPieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: { legend: { position: 'bottom' } }
};

const PipelineFutureOpportunities = ({ openPopup }) => {
  // Data generation functions
  const generateBarData = (labels, data, label, colorIndex) => ({
    labels,
    datasets: [{
      label,
      data,
      backgroundColor: brownShades[colorIndex % brownShades.length]
    }]
  });

  const generateStackedBarData = (labels, datasets) => ({
    labels,
    datasets: datasets.map((ds, i) => ({
      label: ds.label,
      data: ds.values,
      backgroundColor: brownShades[i % brownShades.length]
    }))
  });

  const generatePieData = (labels, data) => ({
    labels,
    datasets: [{
      data,
      backgroundColor: brownShades.slice(0, data.length),
      borderWidth: 2,
      borderColor: '#fff',
      hoverOffset: 0
    }]
  });

  // Chart Components
  const BarChartWithTitle = ({ data, title, chartTitle, chartId }) => {
    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>{title}</h3>
          <div className="popup-description">
            Detailed breakdown of {title.toLowerCase()}
          </div>
          <div className="popup-chart">
            <Bar data={data} options={staticBarOptions} />
          </div>
          <div className="popup-details">
            {data.labels.map((label, index) => (
              <div key={label} className="detail-item">
                <span className="detail-label">{label}:</span>
                <span className="detail-value">{data.datasets[0].data[index]}</span>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          <button className="breakdown-icon-btn" onClick={handleEyeClick} title="View breakdown">
            <FiEye />
          </button>
        </div>
        <div className="chart-title-fixed">{chartTitle}</div>
        <div className="chart-area">
          <Bar data={data} options={staticBarOptions} />
        </div>
      </div>
    );
  };

  // Pie Chart with Numbers ALWAYS visible
  const PieChartWithNumbers = ({ title, labels, data, chartId }) => {
    const chartData = generatePieData(labels, data);

    const plugins = [{
      id: 'centerText',
      afterDraw: (chart) => {
        const ctx = chart.ctx;
        const { chartArea: { left, right, top, bottom, width, height } } = chart;
        
        chart.data.datasets.forEach((dataset, i) => {
          chart.getDatasetMeta(i).data.forEach((arc, index) => {
            const { x, y } = arc.tooltipPosition();
            
            ctx.save();
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(dataset.data[index], x, y);
            ctx.restore();
          });
        });
      }
    }];

    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>{title}</h3>
          <div className="popup-description">
            Detailed percentage breakdown of {title.toLowerCase()}
          </div>
          <div className="popup-chart">
            <Doughnut data={chartData} options={staticPieOptions} plugins={plugins} />
          </div>
          <div className="popup-details">
            {labels.map((label, index) => (
              <div key={label} className="detail-item">
                <span className="detail-label">{label}:</span>
                <span className="detail-value">{data[index]}%</span>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          <button className="breakdown-icon-btn" onClick={handleEyeClick} title="View breakdown">
            <FiEye />
          </button>
        </div>
        <div className="chart-area">
          <Doughnut data={chartData} options={staticPieOptions} plugins={plugins} />
        </div>
      </div>
    );
  };

  // Funnel Chart Component
  const FunnelChart = ({ stages, values, colors, title }) => {
    const maxValue = Math.max(...values);
    
    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>Conversion Funnel Details</h3>
          <div className="popup-description">
            Application conversion efficiency from application to approval to disbursement stages
          </div>
          <div className="popup-chart">
            <div className="funnel-container-popup">
              {stages.map((stage, index) => {
                const width = (values[index] / maxValue) * 80 + 20;
                return (
                  <div key={stage} className="funnel-stage-popup">
                    <div 
                      className="funnel-bar-popup"
                      style={{
                        width: `${width}%`,
                        backgroundColor: colors[index] || brownShades[index % brownShades.length]
                      }}
                    >
                      <span className="funnel-label-popup">{stage}</span>
                      <span className="funnel-value-popup">{values[index]}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="popup-details">
            {stages.map((stage, index) => (
              <div key={stage} className="detail-item">
                <span className="detail-label">{stage}:</span>
                <span className="detail-value">{values[index]}% conversion rate</span>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          <button className="breakdown-icon-btn" onClick={handleEyeClick} title="View breakdown">
            <FiEye />
          </button>
        </div>
        <div className="chart-area">
          <div className="funnel-container">
            {stages.map((stage, index) => {
              const width = (values[index] / maxValue) * 80 + 20;
              return (
                <div key={stage} className="funnel-stage">
                  <div 
                    className="funnel-bar"
                    style={{
                      width: `${width}%`,
                      backgroundColor: colors[index] || brownShades[index % brownShades.length]
                    }}
                  >
                    <span className="funnel-label">{stage}</span>
                    <span className="funnel-value">{values[index]}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pipeline-opportunities">
      {/* TOP ROW - 4 charts */}
      <div className="charts-grid-4x4">
        <div className="top-row">
          <BarChartWithTitle
            data={generateBarData(
              ['<1 month', '1-3 months', '3-6 months', '>6 months'],
              [15, 24, 30, 10],
              '# of SMEs',
              0
            )}
            title="Pipeline Stage Aging"
            chartTitle="Number of SMEs by pipeline age"
            chartId="pipeline-aging"
          />

          <FunnelChart 
            stages={['Application', 'Approval', 'Disbursed']}
            values={[28, 45, 82]}
            colors={[brownShades[0], brownShades[1], brownShades[2]]}
            title="Conversion Funnel (App→Approval→Disburse)"
          />

          <BarChartWithTitle
            data={generateStackedBarData(
              ['Q1', 'Q2', 'Q3', 'Q4'],
              [
                { label: 'Debt', values: [35, 40, 45, 50] },
                { label: 'Equity', values: [22, 25, 28, 30] },
                { label: 'Grants', values: [15, 18, 20, 22] }
              ]
            )}
            title="Forecasted Capital Requirement (Next 12mo)"
            chartTitle="Capital requirements by instrument (R millions)"
            chartId="capital-requirement"
          />

          <PieChartWithNumbers
            title="Data Confidence Meter"
            labels={['Verified', 'Partial', 'Unverified']}
            data={[78, 15, 7]}
            chartId="data-confidence"
          />
        </div>

        {/* BOTTOM - Full width table */}
        <div className="bottom-full">
          <div className="chart-container full-width">
            <div className="chart-header">
              <h3 className="chart-title">Co-Invest / Support Opportunities</h3>
              <button 
                className="breakdown-icon-btn"
                onClick={() => openPopup(
                  <div className="popup-content">
                    <h3>Co-Invest / Support Opportunities</h3>
                    <div className="popup-description">
                      Promising investment opportunities available for co-investment
                    </div>
                    <div className="table-container-popup">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>SME</th>
                            <th>Stage</th>
                            <th>Ask</th>
                            <th>Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>KZN AgroPack</td>
                            <td>Growth</td>
                            <td>R8m</td>
                            <td>83</td>
                          </tr>
                          <tr>
                            <td>Tech Innovate</td>
                            <td>Early</td>
                            <td>R5m</td>
                            <td>79</td>
                          </tr>
                          <tr>
                            <td>Green Manufacturing</td>
                            <td>Mature</td>
                            <td>R12m</td>
                            <td>88</td>
                          </tr>
                          <tr>
                            <td>Urban Solutions</td>
                            <td>Growth</td>
                            <td>R6m</td>
                            <td>76</td>
                          </tr>
                          <tr>
                            <td>Digital Finance Co</td>
                            <td>Early</td>
                            <td>R10m</td>
                            <td>81</td>
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
                    <th>Stage</th>
                    <th>Ask</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>KZN AgroPack</td>
                    <td>Growth</td>
                    <td>R8m</td>
                    <td>83</td>
                  </tr>
                  <tr>
                    <td>Tech Innovate</td>
                    <td>Early</td>
                    <td>R5m</td>
                    <td>79</td>
                  </tr>
                  <tr>
                    <td>Green Manufacturing</td>
                    <td>Mature</td>
                    <td>R12m</td>
                    <td>88</td>
                  </tr>
                  <tr>
                    <td>Urban Solutions</td>
                    <td>Growth</td>
                    <td>R6m</td>
                    <td>76</td>
                  </tr>
                  <tr>
                    <td>Digital Finance Co</td>
                    <td>Early</td>
                    <td>R10m</td>
                    <td>81</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelineFutureOpportunities;