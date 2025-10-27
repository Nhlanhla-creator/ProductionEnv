import React, { useState, useEffect } from 'react';
import { Bar, Pie, Line, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  Filler
} from 'chart.js';
import {
  FiPieChart,
  FiDollarSign,
  FiUsers,
  FiAlertTriangle,
  FiMap,
  FiTrendingUp,
  FiEye,
  FiPieChart as FiComposition,
  FiBarChart2,
  FiGlobe,
  FiTarget,
  FiDollarSign as FiLiquidity,
  FiHeart,
  FiActivity,
  FiShield,
  FiClock,
  FiCheckCircle,
  FiArrowUp,
  FiArrowDown,
  FiCalendar,
  FiDownload,
  FiTrendingUp as FiTrendingUpIcon
} from 'react-icons/fi';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MyInvestments.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  Filler
);

// Sample South Africa GeoJSON data
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

const brownShades = [
  '#5e3f26', '#7d5a36', '#9c7c54', '#b8a082',
  '#3f2a18', '#d4c4b0', '#5D4037', '#3E2723'
];

const MyInvestments = () => {
  const [activeCategory, setActiveCategory] = useState('Portfolio Overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [timeToFundView, setTimeToFundView] = useState('Quarterly');
  const [timeToExitView, setTimeToExitView] = useState('Quarterly');
  const [vettingTimeView, setVettingTimeView] = useState('Monthly');
  const [portfolioTrendView, setPortfolioTrendView] = useState('Quarterly');

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

  // Time view data generators
  const getTimeData = (view, monthlyData, quarterlyData, yearlyData) => {
    switch (view) {
      case 'Monthly':
        return monthlyData;
      case 'Quarterly':
        return quarterlyData;
      case 'Yearly':
        return yearlyData;
      default:
        return quarterlyData;
    }
  };

  const timeToFundData = {
    Monthly: [35, 34, 33, 32, 32, 31],
    Quarterly: [35, 33, 32, 32],
    Yearly: [36, 34, 32, 30]
  };

  const timeToExitData = {
    Monthly: [34, 33, 32, 31, 31, 30],
    Quarterly: [34, 32, 31, 30],
    Yearly: [35, 33, 31, 29]
  };

  const vettingTimeData = {
    Monthly: [12, 11, 10, 9, 9, 9],
    Quarterly: [11, 10, 9, 9],
    Yearly: [12, 11, 10, 9]
  };

  const portfolioTrendData = {
    Monthly: [4.5, 4.3, 4.1, 4.2, 4.0, 3.9],
    Quarterly: [4.5, 4.1, 4.2, 4.0],
    Yearly: [4.8, 4.3, 4.1, 3.8]
  };

  // Sparkline Component
  const Sparkline = ({ data, color = '#5e3f26', height = 40 }) => {
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    
    return (
      <div className="sparkline" style={{ height: `${height}px` }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${data.length * 10} ${height}`}>
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2"
            points={data.map((value, index) => 
              `${index * 10},${height - ((value - minValue) / (maxValue - minValue)) * (height - 5)}`
            ).join(' ')}
          />
        </svg>
      </div>
    );
  };

  // Gauge Component
  const GaugeChart = ({ value, target, min = 0, max = 100, title, description, showZones = true }) => {
    const percentage = ((value - min) / (max - min)) * 100;
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    let color = '#4CAF50'; // Green
    if (value < 60) color = '#f44336'; // Red
    else if (value < 80) color = '#ff9800'; // Amber

    return (
      <div className="gauge-container">
        <h4 className="chart-title">{title}</h4>
        {description && <div className="visual-description">{description}</div>}
        <div className="gauge-wrapper">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#e0e0e0"
              strokeWidth="8"
            />
            
            {showZones && (
              <>
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="#f44336"
                  strokeWidth="8"
                  strokeDasharray={circumference * 0.6}
                  strokeDashoffset={circumference * 0.7}
                  transform="rotate(-90 60 60)"
                  opacity="0.3"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="#ff9800"
                  strokeWidth="8"
                  strokeDasharray={circumference * 0.2}
                  strokeDashoffset={circumference * 0.1}
                  transform="rotate(-90 60 60)"
                  opacity="0.3"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="#4CAF50"
                  strokeWidth="8"
                  strokeDasharray={circumference * 0.2}
                  strokeDashoffset={0}
                  transform="rotate(-90 60 60)"
                  opacity="0.3"
                />
              </>
            )}
            
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
            />
            
            <text
              x="60"
              y="60"
              textAnchor="middle"
              dy="7"
              fontSize="20"
              fontWeight="bold"
              fill={color}
            >
              {value}
            </text>
          </svg>
        </div>
        {target && (
          <div className="gauge-target">Target: {target}</div>
        )}
      </div>
    );
  };

  // Progress Ring Component
  const ProgressRing = ({ value, target, title, description, label }) => {
    const percentage = value;
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    let color = '#4CAF50';
    if (percentage < 40) color = '#f44336';
    else if (percentage < 60) color = '#ff9800';

    return (
      <div className="progress-ring-container">
        <h4 className="chart-title">{title}</h4>
        {description && <div className="visual-description">{description}</div>}
        <div className="progress-ring-wrapper">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#e0e0e0"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
            <text
              x="50"
              y="50"
              textAnchor="middle"
              dy="7"
              fontSize="16"
              fontWeight="bold"
              fill={color}
            >
              {value}%
            </text>
          </svg>
        </div>
        {label && <div className="progress-label">{label}</div>}
        {target && <div className="progress-target">Target: {target}%</div>}
      </div>
    );
  };

  // Stat Card with Sparkline Component
  const StatCardWithSparkline = ({ title, value, target, unit, data, colorIndex = 0, description, showTrend = false }) => {
    const trendData = data || [65, 70, 80, 75, 85, 90];
    const isImproving = trendData[trendData.length - 1] > trendData[0];
    
    return (
      <div className="stat-card">
        <div className="stat-header">
          <div className="stat-title">{title}</div>
        </div>
        {description && <div className="visual-description">{description}</div>}
        <div className="stat-value">{value}{unit}</div>
        <div className="sparkline-container">
          <Sparkline data={trendData} color={brownShades[colorIndex]} />
        </div>
        {target && (
          <div className="stat-target">
            Target: {target}{unit}
          </div>
        )}
        {showTrend && (
          <div className={`stat-trend ${isImproving ? 'up' : 'down'}`}>
            {isImproving ? <FiArrowUp /> : <FiArrowDown />}
            {isImproving ? 'Improving' : 'Declining'}
          </div>
        )}
      </div>
    );
  };

  // Simple Stat Card Component
  const SimpleStatCard = ({ title, value, unit, description }) => (
    <div className="stat-card simple">
      <div className="stat-header">
        <div className="stat-title">{title}</div>
      </div>
      {description && <div className="visual-description">{description}</div>}
      <div className="stat-value-large">{value}</div>
      <div className="stat-unit">{unit}</div>
    </div>
  );

  // Stat Card with Trend Indicator
  const StatCardWithTrend = ({ title, value, target, unit, data, colorIndex = 0, description, timeView, onTimeViewChange, timeOptions = ['Monthly', 'Quarterly'] }) => {
    const trendData = data || [35, 33, 32, 32];
    const isImproving = trendData[trendData.length - 1] < trendData[0];
    
    return (
      <div className="stat-card">
        <div className="stat-header">
          <div className="stat-title">{title}</div>
          {onTimeViewChange && (
            <div className="view-toggle">
              {timeOptions.map(option => (
                <button 
                  key={option}
                  className={`toggle-btn ${timeView === option ? 'active' : ''}`}
                  onClick={() => onTimeViewChange(option)}
                >
                  {option.charAt(0)}
                </button>
              ))}
            </div>
          )}
        </div>
        {description && <div className="visual-description">{description}</div>}
        <div className="stat-value">{value}{unit}</div>
        <div className="sparkline-container">
          <Sparkline data={trendData} color={brownShades[colorIndex]} />
        </div>
        {target && (
          <div className="stat-target">
            Target: {target}{unit}
          </div>
        )}
        <div className={`stat-trend ${isImproving ? 'up' : 'down'}`}>
          {isImproving ? <FiArrowDown /> : <FiArrowUp />}
          {isImproving ? 'Improving' : 'Declining'}
        </div>
      </div>
    );
  };

  // Bar Trend Stat Card
  const BarTrendStatCard = ({ title, value, target, unit, data, colorIndex = 0, description }) => {
    const trendData = data || [10, 11, 12, 12];
    
    return (
      <div className="stat-card">
        <div className="stat-header">
          <div className="stat-title">{title}</div>
        </div>
        {description && <div className="visual-description">{description}</div>}
        <div className="stat-value">{value}{unit}</div>
        <div className="barchart-container">
          <div className="mini-barchart">
            {trendData.map((value, index) => (
              <div 
                key={index}
                className="bar" 
                style={{
                  height: `${(value / Math.max(...trendData)) * 30}px`,
                  backgroundColor: brownShades[colorIndex]
                }}
                title={`Q${index + 1}: ${value}%`}
              />
            ))}
          </div>
          <div className="barchart-labels">
            {trendData.map((_, index) => (
              <span key={index}>Q{index + 1}</span>
            ))}
          </div>
        </div>
        {target && (
          <div className="stat-target">
            Target: {target}{unit}
          </div>
        )}
      </div>
    );
  };

  // Funnel Chart Component
  const FunnelChart = ({ stages, values, colors }) => {
    const maxValue = Math.max(...values);
    
    return (
      <div className="funnel-container">
        {stages.map((stage, index) => {
          const width = (values[index] / maxValue) * 80 + 20; // Minimum 20% width
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
    );
  };

  // Audit Trail Component
  const AuditTrailExport = ({ timestamp, description }) => (
    <div className="audit-trail-card">
      <div className="visual-description">{description}</div>
      <button className="download-btn">
        <FiDownload className="download-icon" />
        Download Report Pack
      </button>
      <div className="timestamp">Generated: {timestamp}</div>
    </div>
  );

  // Trend Alert Card Component
  const TrendAlertCard = ({ title, value, description, trend, isPositive = true }) => (
    <div className={`trend-alert-card ${isPositive ? 'positive' : 'negative'}`}>
      <div className="trend-alert-header">
        <div className="trend-alert-title">{title}</div>
        <div className={`trend-alert-icon ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? <FiArrowDown /> : <FiAlertTriangle />}
        </div>
      </div>
      <div className="trend-alert-value">{value}</div>
      <div className="trend-alert-description">{description}</div>
      <div className="trend-alert-sparkline">
        <Sparkline 
          data={isPositive ? [5.6, 5.2, 4.8, 4.5, 4.3, 4.2] : [2.1, 2.4, 2.8, 3.1, 3.5, 3.8]} 
          color={isPositive ? '#4CAF50' : '#f44336'} 
          height={20} 
        />
      </div>
    </div>
  );

  const generateBarData = (labels, data, label, colorIndex) => ({
    labels,
    datasets: [{
      label,
      data,
      backgroundColor: brownShades[colorIndex % brownShades.length],
      borderColor: brownShades[(colorIndex + 1) % brownShades.length],
      borderWidth: 1
    }]
  });

  const generateLineData = (labels, datasets) => ({
    labels,
    datasets: datasets.map((ds, i) => ({
      label: ds.label,
      data: ds.values,
      borderColor: brownShades[i % brownShades.length],
      backgroundColor: brownShades[i % brownShades.length] + '20',
      borderWidth: 2,
      pointBackgroundColor: brownShades[i % brownShades.length],
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      fill: ds.fill || false,
    }))
  });

  const generatePieData = (labels, data) => ({
    labels,
    datasets: [{
      data,
      backgroundColor: brownShades.slice(0, data.length),
      borderWidth: 1,
      borderColor: '#fff'
    }]
  });

  const generateStackedBarData = (labels, datasets) => ({
    labels,
    datasets: datasets.map((ds, i) => ({
      label: ds.label,
      data: ds.values,
      backgroundColor: brownShades[i % brownShades.length],
      borderColor: brownShades[i % brownShades.length],
      borderWidth: 1
    }))
  });

  const generateRadarData = (labels, actualData, targetData) => ({
    labels,
    datasets: [
      {
        label: 'Actual',
        data: actualData,
        backgroundColor: 'rgba(94, 63, 38, 0.2)',
        borderColor: brownShades[0],
        pointBackgroundColor: brownShades[0],
        borderWidth: 2
      },
      {
        label: 'Target',
        data: targetData,
        backgroundColor: 'rgba(125, 90, 54, 0.2)',
        borderColor: brownShades[1],
        pointBackgroundColor: brownShades[1],
        borderWidth: 2
      }
    ]
  });

  const getRegionColor = (value) => {
    if (value > 30) return brownShades[0];
    if (value > 20) return brownShades[1];
    if (value > 10) return brownShades[2];
    return brownShades[3];
  };

  // Section Purpose Component
  const SectionPurpose = ({ purpose }) => (
    <div className="section-purpose">
      <div className="purpose-text">
        <strong>Section Purpose:</strong> {purpose}
      </div>
    </div>
  );

  // Data for each section based on the document specifications
  const sectionData = {
    'Portfolio Overview': {
      icon: <FiEye />,
      purpose: 'Provide a high-level snapshot of overall performance and exposure at a glance',
      content: (
        <div className="portfolio-overview">
          <SectionPurpose purpose="Provide a high-level snapshot of overall performance and exposure at a glance" />
          
          <div className="kpi-grid-overview">
            <StatCardWithSparkline
              title="Total Portfolio Value / Exposure"
              value="R312m"
              target="R350m"
              unit=""
              data={[280, 295, 305, 312]}
              colorIndex={0}
              description="Card showing current value (R312m) and small 4-quarter trendline"
            />

            <SimpleStatCard
              title="# of Active SMEs"
              value="128"
              unit="SMEs"
              description="Displays total number of SMEs under management"
            />

            <div className="gauge-card">
              <GaugeChart 
                value={78.4} 
                target={80} 
                title="Avg. BIG Score"
                description="Shows average score with color zones (red <60, amber 60–80, green >80)"
                showZones={true}
              />
            </div>

            <div className="gauge-card">
              <ProgressRing 
                value={46} 
                target={50} 
                title='% Portfolio "Funding Ready" (≥80 BIG Score)'
                description='Shows readiness ratio with label "59/128 SMEs ready"'
                label="59/128 SMEs ready"
              />
            </div>

            <StatCardWithSparkline
              title="Funding Facilitated"
              value="R94m"
              target="R100m"
              unit=""
              data={[75, 82, 88, 94]}
              colorIndex={2}
              description="Displays total funding facilitated over time"
              showTrend={true}
            />

            <StatCardWithTrend
              title="Avg. Time-to-Fund"
              value="32"
              target="≤30"
              unit="days"
              data={getTimeData(timeToFundView, timeToFundData.Monthly, timeToFundData.Quarterly, timeToFundData.Yearly)}
              colorIndex={3}
              description="Shows efficiency trend with down arrow if improving"
              timeView={timeToFundView}
              onTimeViewChange={setTimeToFundView}
              timeOptions={['Monthly', 'Quarterly', 'Yearly']}
            />

            <StatCardWithSparkline
              title="Follow-on Funding Rate"
              value="27%"
              target="30%"
              unit=""
              data={[22, 24, 25, 27]}
              colorIndex={4}
              description="Displays growth of follow-on deals"
            />

            <BarTrendStatCard
              title="Exit / Repayment Ratio"
              value="12%"
              target="15%"
              unit=""
              data={[10, 11, 12, 12]}
              colorIndex={5}
              description="Tracks liquidity rate over time"
            />
          </div>
        </div>
      )
    },
    'Portfolio Composition': {
      icon: <FiComposition />,
      purpose: 'Show diversification and concentration by sector, stage, location, etc.',
      content: (
        <div className="portfolio-composition">
          <SectionPurpose purpose="Show diversification and concentration by sector, stage, location, etc." />
          
          <div className="composition-charts-grid">
            <div className="chart-container">
              <h3 className="chart-title">By Lifecycle Stage</h3>
              <div className="visual-description">Shows breakdown by Early/Growth/Mature/Exit-ready</div>
              <div className="chart-area">
                <Doughnut 
                  data={generatePieData(
                    ['Early', 'Growth', 'Mature', 'Exit-ready'],
                    [22, 41, 27, 10]
                  )}
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="chart-container">
              <h3 className="chart-title">By Industry / Sector</h3>
              <div className="visual-description">Highlights sector diversification</div>
              <div className="chart-area">
                <Bar 
                  data={generateBarData(
                    ['Manufacturing', 'Services', 'Agriculture', 'Retail', 'Tech'],
                    [28, 24, 20, 18, 10],
                    '% Capital',
                    1
                  )}
                  options={{
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false
                  }}
                />
              </div>
            </div>

            <div className="chart-container">
              <h3 className="chart-title">By Geography</h3>
              <div className="visual-description">Displays provincial distribution with hover tooltips</div>
              <div className="chart-area">
                <div className="map-container">
                  <MapContainer 
                    center={[-28.4796, 24.6987]} 
                    zoom={5} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap contributors'
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
                          Allocation: ${feature.properties.value}%
                        `);
                      }}
                    />
                  </MapContainer>
                </div>
              </div>
            </div>

            <div className="chart-container">
              <h3 className="chart-title">By Funding Instrument</h3>
              <div className="visual-description">Shows allocation by debt/equity/grant/EaaS</div>
              <div className="chart-area">
                <Bar 
                  data={generateStackedBarData(
                    ['Equity', 'Debt', 'Grant', 'EaaS'],
                    [
                      { label: 'Current', values: [120, 95, 45, 52] },
                      { label: 'Target', values: [130, 100, 50, 70] }
                    ]
                  )}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: { stacked: true },
                      y: { 
                        stacked: true,
                        title: {
                          display: true,
                          text: 'ZAR millions'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="chart-container">
              <h3 className="chart-title">By Demographic / Ownership</h3>
              <div className="visual-description">Highlights women/youth/black-owned ratios</div>
              <div className="chart-area">
                <Doughnut 
                  data={generatePieData(
                    ['Women-led', 'Youth-led', 'Black-owned', 'Other'],
                    [38, 24, 72, 16]
                  )}
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )
    },
    'Performance & Risk Dashboard': {
      icon: <FiBarChart2 />,
      purpose: 'Assess growth, risk, and inclusion performance of portfolio',
      content: (
        <div className="performance-risk">
          <SectionPurpose purpose="Assess growth, risk, and inclusion performance of portfolio" />
          
          <div className="performance-charts-grid">
            <div className="chart-container">
              <h3 className="chart-title">Default / Non-performing Ratio</h3>
              <div className="visual-description">Tracks decline in defaults</div>
              <div className="chart-area">
                <Bar 
                  data={generateBarData(
                    ['Q1', 'Q2', 'Q3', 'Q4'],
                    [7.5, 9.8, 6.1, 4.2],
                    '% Defaults',
                    0
                  )}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 12,
                        title: {
                          display: true,
                          text: '% of active loans'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="chart-container">
              <h3 className="chart-title">SME Growth Index</h3>
              <div className="visual-description">Shows average revenue growth vs benchmark</div>
              <div className="chart-area">
                <Line 
                  data={generateLineData(
                    ['Q1', 'Q2', 'Q3', 'Q4'],
                    [
                      { label: 'Revenue Growth', values: [9, 10, 12, 11] },
                      { label: 'Benchmark (8%)', values: [8, 8, 8, 8] }
                    ]
                  )}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        title: {
                          display: true,
                          text: '% Revenue Growth QoQ'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="chart-container">
              <h3 className="chart-title">Job Creation / Retention</h3>
              <div className="visual-description">Shows jobs created by sector</div>
              <div className="chart-area">
                <Bar 
                  data={generateStackedBarData(
                    ['Agriculture', 'Services', 'Manufacturing', 'Retail', 'Tech'],
                    [
                      { label: 'New Jobs', values: [800, 1000, 600, 400, 300] },
                      { label: 'Retained Jobs', values: [400, 500, 400, 300, 200] }
                    ]
                  )}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: { stacked: true },
                      y: { 
                        stacked: true,
                        title: {
                          display: true,
                          text: '# of jobs'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="chart-container">
              <h3 className="chart-title">SME Graduation Rate (to 80+ BIG Score)</h3>
              <div className="visual-description">Indicates progress in improving SME readiness</div>
              <div className="chart-area">
                <Line 
                  data={generateLineData(
                    ['Q1', 'Q2', 'Q3', 'Q4'],
                    [
                      { label: 'Graduation Rate', values: [15, 17, 18, 19] },
                      { label: 'Target (25%)', values: [20, 21, 23, 25] }
                    ]
                  )}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 30,
                        title: {
                          display: true,
                          text: '% of SMEs'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="chart-container">
              <h3 className="chart-title">Diversity & Inclusion Score</h3>
              <div className="visual-description">Compares actual vs target inclusion values</div>
              <div className="chart-area">
                <Radar 
                  data={generateRadarData(
                    ['Women', 'Youth', 'Rural', 'Black-owned'],
                    [38, 24, 45, 72],
                    [35, 25, 40, 70]
                  )}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                          stepSize: 20
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )
    },
    'ESG & Impact Performance': {
      icon: <FiGlobe />,
      purpose: 'Measure environmental, social, and governance outcomes',
      content: (
        <div className="esg-impact">
          <SectionPurpose purpose="Measure environmental, social, and governance outcomes" />
          
          <div className="esg-charts-grid">
            {/* Top Row - Three charts side by side */}
            <div className="chart-container">
              <h3 className="chart-title">ESG Pillar Scores (E, S, G)</h3>
              <div className="visual-description">Shows average ESG performance</div>
              <div className="chart-area">
                <Bar 
                  data={generateBarData(
                    ['Environmental', 'Social', 'Governance'],
                    [62, 81, 74],
                    'Score (0-100)',
                    1
                  )}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="chart-container">
              <h3 className="chart-title">SDG Alignment</h3>
              <div className="visual-description">Highlights SDG coverage (8, 9, 5, 11)</div>
              <div className="chart-area">
                <Bar 
                  data={generateBarData(
                    ['SDG8', 'SDG9', 'SDG5', 'SDG11'],
                    [64, 41, 38, 32],
                    '% of portfolio',
                    2
                  )}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false
                  }}
                />
              </div>
            </div>

            <div className="chart-container">
              <h3 className="chart-title">Governance Compliance Health</h3>
              <div className="visual-description">Displays compliance ratio from BIG Score data</div>
              <div className="chart-area">
                <Doughnut 
                  data={generatePieData(
                    ['Compliant', 'Partial', 'At Risk'],
                    [72, 21, 7]
                  )}
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Bottom Row - Full width table */}
            <div className="chart-container full-width">
              <h3 className="chart-title">Top 5 ESG Contributors</h3>
              <div className="visual-description">Lists SMEs with notable ESG impacts</div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>SME</th>
                      <th>Pillar</th>
                      <th>Supporting Stat</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>FemmeTech Labs</td>
                      <td>Social</td>
                      <td>68 new jobs created</td>
                    </tr>
                    <tr>
                      <td>Green Agro</td>
                      <td>Environmental</td>
                      <td>120t CO2 reduced annually</td>
                    </tr>
                    <tr>
                      <td>EduTech SA</td>
                      <td>Social</td>
                      <td>500+ training hours delivered</td>
                    </tr>
                    <tr>
                      <td>Clean Energy Co</td>
                      <td>Environmental</td>
                      <td>100% renewable energy usage</td>
                    </tr>
                    <tr>
                      <td>Community Build</td>
                      <td>Governance</td>
                      <td>100% compliance rating</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )
    },
    'Pipeline & Future Opportunities': {
      icon: <FiTarget />,
      purpose: 'Show pipeline strength and forecast future capital needs',
      content: (
        <div className="pipeline-opportunities">
          <SectionPurpose purpose="Show pipeline strength and forecast future capital needs" />
          
          <div className="pipeline-charts-grid">
            {/* Pipeline Stage Aging */}
            <div className="chart-container">
              <h3 className="chart-title">Pipeline Stage Aging</h3>
              <div className="visual-description">Age distribution of pipeline</div>
              <div className="chart-area">
                <Bar 
                  data={generateBarData(
                    ['<1 month', '1-3 months', '3-6 months', '>6 months'],
                    [15, 24, 30, 10],
                    '# of SMEs',
                    0
                  )}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false
                  }}
                />
              </div>
            </div>

            {/* Conversion Funnel */}
            <div className="chart-container">
              <h3 className="chart-title">Conversion Funnel (App→Approval→Disburse)</h3>
              <div className="visual-description">Displays application conversion efficiency</div>
              <div className="chart-area">
                <FunnelChart 
                  stages={['Application', 'Approval', 'Disbursed']}
                  values={[28, 45, 82]}
                  colors={[brownShades[0], brownShades[1], brownShades[2]]}
                />
              </div>
            </div>

            {/* Forecasted Capital Requirement */}
            <div className="chart-container">
              <h3 className="chart-title">Forecasted Capital Requirement (Next 12mo)</h3>
              <div className="visual-description">Forecasted need by instrument</div>
              <div className="chart-area">
                <Bar 
                  data={generateStackedBarData(
                    ['Q1', 'Q2', 'Q3', 'Q4'],
                    [
                      { label: 'Debt', values: [35, 40, 45, 50] },
                      { label: 'Equity', values: [22, 25, 28, 30] },
                      { label: 'Grants', values: [15, 18, 20, 22] }
                    ]
                  )}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: { stacked: true },
                      y: { 
                        stacked: true,
                        title: {
                          display: true,
                          text: 'ZAR millions'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Data Confidence Meter */}
            <div className="chart-container">
              <h3 className="chart-title">Data Confidence Meter</h3>
              <div className="visual-description">Highlights data reliability</div>
              <div className="chart-area">
                <Doughnut 
                  data={generatePieData(
                    ['Verified', 'Partial', 'Unverified'],
                    [78, 15, 7]
                  )}
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Audit Trail Export */}
            <div className="chart-container">
              <AuditTrailExport 
                timestamp="2025-10-04 07:45"
                description="Downloadable report pack"
              />
            </div>

            {/* Co-Invest / Support Opportunities */}
            <div className="chart-container full-width">
              <h3 className="chart-title">Co-Invest / Support Opportunities</h3>
              <div className="visual-description">Ranked table of co-investment candidates</div>
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
      )
    },
    'Exit & Liquidity Metrics': {
      icon: <FiLiquidity />,
      purpose: 'Measure realized outcomes, repayments, and liquidity flow',
      content: (
        <div className="exit-liquidity">
          <SectionPurpose purpose="Measure realized outcomes, repayments, and liquidity flow" />
          
          <div className="exit-charts-grid">
            {/* Exit / Repayment History */}
            <div className="chart-container">
              <h3 className="chart-title">Exit / Repayment History</h3>
              <div className="visual-description">Exit trends over time</div>
              <div className="chart-area">
                <Bar 
                  data={generateBarData(
                    ['Q1', 'Q2', 'Q3', 'Q4'],
                    [2, 4, 5, 7],
                    '# of Exits',
                    0
                  )}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false
                  }}
                />
              </div>
            </div>

            {/* Avg. Time-to-Exit */}
            <div className="chart-container">
              <h3 className="chart-title">Avg. Time-to-Exit</h3>
              <div className="visual-description">Average months to exit</div>
              <div className="chart-area">
                <Line 
                  data={generateLineData(
                    getTimeData(timeToExitView, ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], ['Q1', 'Q2', 'Q3', 'Q4'], ['2021', '2022', '2023', '2024']),
                    [
                      { label: 'Avg Months', values: getTimeData(timeToExitView, timeToExitData.Monthly, timeToExitData.Quarterly, timeToExitData.Yearly) },
                      { label: 'Target (<32)', values: getTimeData(timeToExitView, [32, 32, 32, 32, 32, 32], [32, 32, 32, 32], [32, 32, 32, 32]) }
                    ]
                  )}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        title: {
                          display: true,
                          text: 'Months'
                        }
                      }
                    }
                  }}
                />
              </div>
              <div className="view-toggle-container">
                <div className="view-toggle">
                  {['Monthly', 'Quarterly', 'Yearly'].map(option => (
                    <button 
                      key={option}
                      className={`toggle-btn ${timeToExitView === option ? 'active' : ''}`}
                      onClick={() => setTimeToExitView(option)}
                    >
                      {option.charAt(0)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Exit Multiple */}
            <div className="chart-container">
              <h3 className="chart-title">Exit Multiple</h3>
              <div className="visual-description">Return multiples for exited equity deals</div>
              <div className="chart-area">
                <Bar 
                  data={generateBarData(
                    ['Deal A', 'Deal B', 'Deal C', 'Deal D', 'Deal E'],
                    [1.8, 2.4, 3.0, 2.1, 2.8],
                    'Multiple (x)',
                    1
                  )}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false
                  }}
                />
              </div>
            </div>

            {/* Reinvestment Ratio */}
            <div className="chart-container">
              <h3 className="chart-title">Reinvestment Ratio</h3>
              <div className="visual-description">Share of capital recycled</div>
              <div className="chart-area">
                <Doughnut 
                  data={generatePieData(
                    ['Reinvested', 'Held'],
                    [64, 36]
                  )}
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* SME Graduation to Bankable */}
            <div className="stat-card simple">
              <div className="stat-header">
                <div className="stat-title">SME Graduation to Bankable</div>
              </div>
              <div className="visual-description">% of SMEs now self-sustaining</div>
              <div className="stat-value-large">31%</div>
              <div className="stat-unit">graduated</div>
            </div>
          </div>
        </div>
      )
    },
    'Funder Health & Efficiency': {
      icon: <FiHeart />,
      purpose: 'Track funder/catalyst performance and operational efficiency',
      content: (
        <div className="funder-efficiency">
          <SectionPurpose purpose="Track funder/catalyst performance and operational efficiency" />
          
          <div className="funder-charts-grid">
            {/* Applications Reviewed vs Funded */}
            <div className="chart-container">
              <h3 className="chart-title">Applications Reviewed vs Funded</h3>
              <div className="visual-description">Compares funnel volumes</div>
              <div className="chart-area">
                <Bar 
                  data={generateBarData(
                    ['Reviewed', 'Approved', 'Funded'],
                    [210, 85, 46],
                    '# of apps',
                    0
                  )}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false
                  }}
                />
              </div>
            </div>

            {/* Avg. Vetting Time */}
            <div className="chart-container">
              <h3 className="chart-title">Avg. Vetting Time</h3>
              <div className="visual-description">Efficiency metric</div>
              <div className="chart-area">
                <Line 
                  data={generateLineData(
                    getTimeData(vettingTimeView, ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], ['Q1', 'Q2', 'Q3', 'Q4'], ['2021', '2022', '2023', '2024']),
                    [{ label: 'Days', values: getTimeData(vettingTimeView, vettingTimeData.Monthly, vettingTimeData.Quarterly, vettingTimeData.Yearly) }]
                  )}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        title: {
                          display: true,
                          text: 'Days'
                        }
                      }
                    }
                  }}
                />
              </div>
              <div className="view-toggle-container">
                <div className="view-toggle">
                  {['Monthly', 'Quarterly', 'Yearly'].map(option => (
                    <button 
                      key={option}
                      className={`toggle-btn ${vettingTimeView === option ? 'active' : ''}`}
                      onClick={() => setVettingTimeView(option)}
                    >
                      {option.charAt(0)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Cost per Funded SME */}
            <div className="stat-card simple">
              <div className="stat-header">
                <div className="stat-title">Cost per Funded SME</div>
              </div>
              <div className="visual-description">Average operational cost per SME</div>
              <div className="stat-value-large">R27,500</div>
            </div>

            {/* Active Partnerships / Co-Funders */}
            <div className="chart-container">
              <h3 className="chart-title">Active Partnerships / Co-Funders</h3>
              <div className="visual-description">Lists top partners by activity</div>
              <div className="chart-area">
                <Bar 
                  data={generateBarData(
                    ['Funder A', 'Funder B', 'Funder C', 'Funder D'],
                    [12, 9, 7, 5],
                    '# SMEs co-funded',
                    2
                  )}
                  options={{
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false
                  }}
                />
              </div>
            </div>

            {/* Catalyst Engagement Score */}
            <div className="gauge-card">
              <GaugeChart 
                value={82} 
                target={85} 
                title="Catalyst Engagement Score"
                description="Engagement health"
                showZones={true}
              />
            </div>
          </div>
        </div>
      )
    },
    'Insights & AI Recommendations': {
      icon: <FiActivity />,
      purpose: 'Provide AI-driven opportunities, risks, and alerts',
      content: (
        <div className="insights-ai">
          <SectionPurpose purpose="Provide AI-driven opportunities, risks, and alerts" />
          
          <div className="empty-section">
            <div className="empty-state">
              <FiActivity className="empty-icon" />
              <h3>Insights & AI Recommendations</h3>
              <p>This section is currently empty.</p>
            </div>
          </div>
        </div>
      )
    },
    'Data Integrity & Trust Layer': {
      icon: <FiShield />,
      purpose: 'Ensure transparency, compliance, and auditability',
      content: (
        <div className="data-integrity">
          <SectionPurpose purpose="Ensure transparency, compliance, and auditability" />
          
          <div className="empty-section">
            <div className="empty-state">
              <FiShield className="empty-icon" />
              <h3>Data Integrity & Trust Layer</h3>
              <p>This section is currently empty.</p>
            </div>
          </div>
        </div>
      )
    }
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

  const allCategories = Object.keys(sectionData);

  return (
    <div className="investments-container" style={getContainerStyles()}>
      <div className="investments-content">
        <h2 className="investments-title">My Investments</h2>

        <div className="categories-scroll-container">
          <div className="categories-grid">
            {allCategories.map((category) => (
              <button
                key={category}
                className={`category-btn ${activeCategory === category ? 'active' : ''}`}
                onClick={() => setActiveCategory(category)}
              >
                <span className="btn-icon">{sectionData[category].icon}</span>
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="section-content">
          {sectionData[activeCategory].content}
        </div>
      </div>
    </div>
  );
};

export default MyInvestments;