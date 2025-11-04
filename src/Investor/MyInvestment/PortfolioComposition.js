// tabs/PortfolioComposition.js
import React from 'react';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
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

// Styles for PortfolioComposition
const styles = `
.portfolio-composition {
  width: 100%;
}

.composition-charts-grid {
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

/* Fixed Map Container Styles */
.map-container-full {
  height: 100%;
  width: 100%;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
}

.map-container-full .leaflet-container {
  height: 100% !important;
  width: 100% !important;
  min-height: 300px;
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

.map-container-popup {
  height: 400px;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

/* Responsive Design */
@media (max-width: 992px) {
  .composition-charts-grid {
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
  
  .composition-charts-grid {
    padding: 0 5px;
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

// COMPLETE South Africa GeoJSON data
const southAfricaGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Gauteng", value: 35 },
      geometry: { 
        type: "Polygon", 
        coordinates: [[
          [27.5, -26.5], [28.5, -26.5], [28.5, -25.5],
          [27.5, -25.5], [27.5, -26.5]
        ]] 
      }
    },
    {
      type: "Feature",
      properties: { name: "Western Cape", value: 25 },
      geometry: { 
        type: "Polygon", 
        coordinates: [[
          [18.0, -34.5], [19.5, -34.5], [19.5, -32.0],
          [18.0, -32.0], [18.0, -34.5]
        ]] 
      }
    },
    {
      type: "Feature",
      properties: { name: "KwaZulu-Natal", value: 15 },
      geometry: { 
        type: "Polygon", 
        coordinates: [[
          [29.0, -31.0], [31.5, -31.0], [31.5, -27.0],
          [29.0, -27.0], [29.0, -31.0]
        ]] 
      }
    },
    {
      type: "Feature",
      properties: { name: "Eastern Cape", value: 10 },
      geometry: { 
        type: "Polygon", 
        coordinates: [[
          [24.0, -34.0], [27.5, -34.0], [27.5, -30.5],
          [24.0, -30.5], [24.0, -34.0]
        ]] 
      }
    },
    {
      type: "Feature",
      properties: { name: "Other", value: 15 },
      geometry: { 
        type: "Polygon", 
        coordinates: [[
          [22.0, -30.0], [25.0, -30.0], [25.0, -27.0],
          [22.0, -27.0], [22.0, -30.0]
        ]] 
      }
    }
  ]
};

const PortfolioComposition = ({ openPopup }) => {
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

  const GeographyMap = ({ title }) => {
    const getRegionColor = (value) => {
      if (value > 30) return brownShades[0];
      if (value > 20) return brownShades[1];
      if (value > 10) return brownShades[2];
      return brownShades[3];
    };

    const handleEyeClick = () => {
      openPopup(
        <div className="popup-content">
          <h3>Geographical Distribution</h3>
          <div className="popup-description">
            Investment distribution across different regions in South Africa
          </div>
          <div className="popup-chart">
            <div className="map-container-popup">
              <MapContainer 
                center={[-28.4796, 24.6987]} 
                zoom={5} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <GeoJSON
                  data={southAfricaGeoJSON}
                  style={(feature) => ({
                    fillColor: getRegionColor(feature.properties.value),
                    weight: 1,
                    opacity: 1,
                    color: 'white',
                    fillOpacity: 0.7
                  })}
                  onEachFeature={(feature, layer) => {
                    layer.bindPopup(`
                      <strong>${feature.properties.name}</strong><br>
                      Allocation: ${feature.properties.value}%
                    `);
                  }}
                />
              </MapContainer>
            </div>
          </div>
          <div className="popup-details">
            {southAfricaGeoJSON.features.map((feature) => (
              <div key={feature.properties.name} className="detail-item">
                <span className="detail-label">{feature.properties.name}:</span>
                <span className="detail-value">{feature.properties.value}%</span>
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
          <div className="map-container-full">
            <MapContainer 
              center={[-28.4796, 24.6987]} 
              zoom={5} 
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <GeoJSON
                data={southAfricaGeoJSON}
                style={(feature) => ({
                  fillColor: getRegionColor(feature.properties.value),
                  weight: 1,
                  opacity: 1,
                  color: 'white',
                  fillOpacity: 0.7
                })}
                onEachFeature={(feature, layer) => {
                  layer.bindPopup(`
                    <strong>${feature.properties.name}</strong><br>
                    Allocation: ${feature.properties.value}%
                  `);
                }}
              />
            </MapContainer>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="portfolio-composition">
      <div className="composition-charts-grid">
        <PieChartWithNumbers
          title="By Lifecycle Stage"
          labels={['Early', 'Growth', 'Mature', 'Exit-ready']}
          data={[22, 41, 27, 10]}
          chartId="lifecycle-stage"
        />

        <BarChartWithTitle
          data={generateBarData(
            ['Manufacturing', 'Services', 'Agriculture', 'Retail', 'Tech'],
            [28, 24, 20, 18, 10],
            '% Capital',
            1
          )}
          title="By Industry / Sector"
          chartTitle="Capital allocation by sector (%)"
          chartId="industry-sector"
        />

        <GeographyMap title="By Geography" />

        <BarChartWithTitle
          data={generateStackedBarData(
            ['Equity', 'Debt', 'Grant', 'EaaS'],
            [
              { label: 'Current', values: [120, 95, 45, 52] },
              { label: 'Target', values: [130, 100, 50, 70] }
            ]
          )}
          title="By Funding Instrument"
          chartTitle="Current vs Target allocation (R millions)"
          chartId="funding-instrument"
        />

        <PieChartWithNumbers
          title="By Demographic / Ownership"
          labels={['Women-led', 'Youth-led', 'Black-owned', 'Other']}
          data={[38, 24, 72, 16]}
          chartId="demographic-ownership"
        />
      </div>
    </div>
  );
};

export default PortfolioComposition;