import React, { useState, useEffect } from 'react';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import {
  FiPieChart,
  FiDollarSign,
  FiUsers,
  FiAlertTriangle,
  FiMap,
  FiTrendingUp
} from 'react-icons/fi';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MyInvestments.css';

// Sample South Africa GeoJSON data (simplified)
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
    // Add other provinces similarly...
  ]
};

const brownShades = [
  '#5e3f26', '#7d5a36', '#9c7c54', '#b8a082',
  '#3f2a18', '#d4c4b0', '#5D4037', '#3E2723'
];

const MyInvestments = () => {
  const [activeCategory, setActiveCategory] = useState('Deployment Overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const checkSidebarState = () => {
      setIsSidebarCollapsed(document.body.classList.contains("sidebar-collapsed"));
    };

    checkSidebarState();

    const observer = new MutationObserver(checkSidebarState);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const generateBarData = (labels, data, label, colorIndex) => ({
    labels,
    datasets: [{
      label,
      data,
      backgroundColor: brownShades[colorIndex],
      borderColor: brownShades[colorIndex + 1],
      borderWidth: 1
    }]
  });

  const generateLineData = (labels, datasets) => ({
    labels,
    datasets: datasets.map((ds, i) => ({
      label: ds.label,
      data: ds.values,
      borderColor: brownShades[i % brownShades.length],
      backgroundColor: 'transparent',
      borderWidth: 2,
      pointBackgroundColor: brownShades[(i + 2) % brownShades.length],
    }))
  });

  const generatePieData = (labels, data) => ({
    labels,
    datasets: [{
      data,
      backgroundColor: brownShades.slice(0, data.length),
      borderWidth: 1
    }]
  });

  const getRegionColor = (value) => {
    if (value > 30) return brownShades[0];
    if (value > 20) return brownShades[1];
    if (value > 10) return brownShades[2];
    return brownShades[3];
  };

  const categoryData = {
    'Deployment Overview': {
      icon: <FiPieChart />,
      charts: [
        { title: 'Total Funds Deployed', type: 'bar', data: ['Q1', 'Q2', 'Q3', 'Q4'], values: [45, 60, 75, 90], label: 'ZAR (millions)' },
        { title: 'SME Count', type: 'doughnut', data: ['Agriculture', 'Manufacturing', 'Services', 'Retail'], values: [30, 25, 35, 10] },
        { title: '% Disbursed vs Approved', type: 'line', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [
            { label: 'Disbursed', values: [65, 70, 80, 75, 85, 90] },
            { label: 'Approved', values: [80, 85, 90, 85, 95, 100] }
          ]
        }
      ]
    },
    'Financial Performance': {
      icon: <FiDollarSign />,
      charts: [
        { title: 'Portfolio IRR (Equity)', type: 'bar', data: ['2020', '2021', '2022', '2023'], values: [12, 15, 18, 20], label: 'IRR %' },
        { title: 'Avg Yield (Debt)', type: 'line', data: ['Q1', 'Q2', 'Q3', 'Q4'], datasets: [{ label: 'Yield %', values: [8.5, 9.2, 9.0, 9.5] }] },
        { title: 'JIBAR + 3%', type: 'bar', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], values: [10.2, 10.5, 10.3, 10.7, 10.9, 11.0], label: 'JIBAR + 3%' },
        { title: 'Benchmark Tracking', type: 'line', data: ['2020', '2021', '2022', '2023'],
          datasets: [
            { label: 'Portfolio', values: [100, 115, 135, 162] },
            { label: 'Benchmark', values: [100, 110, 125, 145] }
          ]
        }
      ]
    },
    'Impact': {
      icon: <FiUsers />,
      charts: [
        { title: 'Jobs Created', type: 'bar', data: ['Agriculture', 'Manufacturing', 'Services', 'Retail'], values: [1200, 850, 1500, 400], label: 'Jobs' },
        { title: 'Township/Rural Penetration', type: 'pie', data: ['Urban', 'Township', 'Rural'], values: [35, 45, 20] },
        { title: '% Women/Youth Funded SMEs', type: 'doughnut', data: ['Women-led', 'Youth-led', 'Other'], values: [40, 30, 30] }
      ]
    },
    'Risk Flags': {
      icon: <FiAlertTriangle />,
      charts: [
        { title: 'Defaults', type: 'bar', data: ['Q1', 'Q2', 'Q3', 'Q4'], values: [5, 8, 6, 4], label: 'Default Count' },
        { title: 'Missed Reports', type: 'line', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], datasets: [{ label: 'Missed Reports', values: [12, 8, 5, 7, 4, 3] }] },
        { title: 'Compliance Alerts', type: 'bar', data: ['Financial', 'Operational', 'Legal', 'Other'], values: [15, 8, 5, 3], label: 'Alert Count' }
      ]
    },
    'Sector/Geographic heatmap': {
      icon: <FiMap />,
      charts: [
        { 
          title: 'Map View by Province/Region/Township', 
          type: 'map',
          data: ['Gauteng', 'Western Cape', 'KZN', 'Eastern Cape', 'Other'], 
          values: [35, 25, 15, 10, 15] 
        },
        { title: 'Return Attribution by Sector', type: 'bar', data: ['Agriculture', 'Manufacturing', 'Services', 'Retail', 'Tech'], values: [15, 22, 18, 12, 25], label: 'Return %' },
        { title: 'Return Attribution by Geography', type: 'bar', data: ['Gauteng', 'Western Cape', 'KZN', 'Eastern Cape', 'Other'], values: [35, 25, 15, 10, 15], label: 'Return %' }
      ]
    },
    'Pipeline vs Deployment': {
      icon: <FiTrendingUp />,
      charts: [
        { title: 'Approved but Not Disbursed', type: 'bar', data: ['<1 month', '1-3 months', '3-6 months', '>6 months'], values: [15, 25, 30, 10], label: 'Deals Count' },
        { title: 'Conversion Rates', type: 'line', data: ['Q1', 'Q2', 'Q3', 'Q4'],
          datasets: [
            { label: 'Application to Approval', values: [20, 22, 25, 28] },
            { label: 'Approval to Disbursement', values: [75, 78, 80, 82] }
          ]
        }
      ]
    }
  };

  const renderChart = (chart) => {
    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#5e3f26',
            font: { size: 10 }
          }
        }
      }
    };

    switch (chart.type) {
      case 'bar':
        return <Bar data={generateBarData(chart.data, chart.values, chart.label, 0)} options={commonOptions} />;
      case 'line':
        return <Line data={generateLineData(chart.data, chart.datasets)} options={commonOptions} />;
      case 'pie':
        return <Pie data={generatePieData(chart.data, chart.values)} options={commonOptions} />;
      case 'doughnut':
        return <Doughnut data={generatePieData(chart.data, chart.values)} options={commonOptions} />;
      case 'map':
        return (
          <div className="map-container">
            <MapContainer 
              center={[-28.4796, 24.6987]} 
              zoom={5} 
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
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
                    Value: ${feature.properties.value}%
                  `);
                }}
              />
            </MapContainer>
          </div>
        );
      default:
        return null;
    }
  };

  const renderCharts = () => {
    const charts = categoryData[activeCategory].charts;
    const half = Math.ceil(charts.length / 2);
    const firstRow = charts.slice(0, half);
    const secondRow = charts.slice(half);

    return (
      <>
        <div className="chart-row">
          {firstRow.map((chart, index) => (
            <div className="chart-container" key={`first-${index}`}>
              <h3 className="chart-title">{chart.title}</h3>
              <div className="chart-area">{renderChart(chart)}</div>
            </div>
          ))}
        </div>
        {secondRow.length > 0 && (
          <div className="chart-row">
            {secondRow.map((chart, index) => (
              <div className="chart-container" key={`second-${index}`}>
                <h3 className="chart-title">{chart.title}</h3>
                <div className="chart-area">{renderChart(chart)}</div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  const getContainerStyles = () => ({
    width: "100%",
    minHeight: "100vh",
    maxWidth: "100vw",
    overflowX: "hidden",
    padding: `70px 20px 20px ${isSidebarCollapsed ? "100px" : "270px"}`,
    margin: "0",
    boxSizing: "border-box",
    position: "relative",
    transition: "padding 0.3s ease",
    backgroundColor: "#f8f9fa",
  });

  return (
    <div className="investments-container" style={getContainerStyles()}>
      <div className="investments-content">
        <h2 className="investments-title">My Investments</h2>

        <div className="categories-scroll-container">
          <div className="categories-grid">
            {Object.keys(categoryData).map((category) => (
              <button
                key={category}
                className={`category-btn ${activeCategory === category ? 'active' : ''}`}
                onClick={() => setActiveCategory(category)}
              >
                <span className="btn-icon">{categoryData[category].icon}</span>
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="charts-wrapper">
          {renderCharts()}
        </div>
      </div>
    </div>
  );
};

export default MyInvestments;
