import React, { useState, useEffect } from 'react';
import { Bar, Pie, Doughnut, Line } from 'react-chartjs-2';
import { Download, Plus, Edit3, Save, X } from 'lucide-react';
import Sidebar from 'smses/Sidebar/Sidebar';
import Header from '../DashboardHeader/DashboardHeader';
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
);

// Download Modal Component
const DownloadModal = ({ isOpen, onClose, onDownload, sectionName, availableData }) => {
  const [selectedItems, setSelectedItems] = useState({});

  useEffect(() => {
    if (isOpen) {
      // Initialize all items as selected
      const initialSelection = {};
      availableData.forEach(item => {
        initialSelection[item.key] = true;
      });
      setSelectedItems(initialSelection);
    }
  }, [isOpen, availableData]);

  const handleToggle = (key) => {
    setSelectedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleDownload = () => {
    const selectedData = availableData.filter(item => selectedItems[item.key]);
    onDownload(selectedData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#fdfcfb',
        padding: '30px',
        borderRadius: '12px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#5d4037', margin: 0 }}>Download {sectionName} Data</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#5d4037'
            }}
          >
            <X size={24} />
          </button>
        </div>

        <p style={{ color: '#72542b', marginBottom: '20px' }}>
          Select the data you want to include in your download:
        </p>

        <div style={{ marginBottom: '20px' }}>
          {availableData.map(item => (
            <label key={item.key} style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '10px',
              cursor: 'pointer',
              color: '#5d4037'
            }}>
              <input
                type="checkbox"
                checked={selectedItems[item.key] || false}
                onChange={() => handleToggle(item.key)}
                style={{ marginRight: '10px' }}
              />
              {item.label}
            </label>
          ))}
        </div>

        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#e8ddd4',
              color: '#5d4037',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            style={{
              padding: '10px 20px',
              backgroundColor: '#5d4037',
              color: '#fdfcfb',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Download size={16} />
            Download Selected
          </button>
        </div>
      </div>
    </div>
  );
};

// Jobs Created Component
const JobsCreated = ({ activeSection, fundingData }) => {
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const availableData = [
    { key: 'totalJobs', label: 'Total Jobs to Create' },
    { key: 'distribution', label: 'Job Distribution by HDI Group' },
    { key: 'ownership', label: 'Ownership Percentages' }
  ];

  const handleDownload = (selectedData) => {
    const jobsToCreate = fundingData?.socialImpact?.jobsToCreate || 0;
    const blackOwnership = parseFloat(fundingData?.socialImpact?.blackOwnership || 0);
    const womenOwnership = parseFloat(fundingData?.socialImpact?.womenOwnership || 0);
    const youthOwnership = parseFloat(fundingData?.socialImpact?.youthOwnership || 0);
    const disabledOwnership = parseFloat(fundingData?.socialImpact?.disabledOwnership || 0);

    const jobDistribution = {
      'Black Employees': Math.round(jobsToCreate * (blackOwnership / 100)),
      'Women Employees': Math.round(jobsToCreate * (womenOwnership / 100)),
      'Youth Employees': Math.round(jobsToCreate * (youthOwnership / 100)),
      'Disabled Employees': Math.round(jobsToCreate * (disabledOwnership / 100))
    };

    const data = {
      totalJobsToCreate: jobsToCreate,
      jobDistribution: jobDistribution,
      ownershipPercentages: {
        black: blackOwnership,
        women: womenOwnership,
        youth: youthOwnership,
        disabled: disabledOwnership
      }
    };

    const filteredData = {};
    selectedData.forEach(item => {
      if (item.key === 'totalJobs') filteredData.totalJobsToCreate = data.totalJobsToCreate;
      if (item.key === 'distribution') filteredData.jobDistribution = data.jobDistribution;
      if (item.key === 'ownership') filteredData.ownershipPercentages = data.ownershipPercentages;
    });

    const blob = new Blob([JSON.stringify(filteredData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jobs-created-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (activeSection !== 'jobs-created') return null;

  const jobsToCreate = fundingData?.socialImpact?.jobsToCreate || 0;
  
  // Calculate distribution based on ownership percentages
  const blackOwnership = parseFloat(fundingData?.socialImpact?.blackOwnership || 0);
  const womenOwnership = parseFloat(fundingData?.socialImpact?.womenOwnership || 0);
  const youthOwnership = parseFloat(fundingData?.socialImpact?.youthOwnership || 0);
  const disabledOwnership = parseFloat(fundingData?.socialImpact?.disabledOwnership || 0);

  // Estimate job distribution based on ownership percentages
  const jobDistribution = {
    'Black Employees': Math.round(jobsToCreate * (blackOwnership / 100)),
    'Women Employees': Math.round(jobsToCreate * (womenOwnership / 100)),
    'Youth Employees': Math.round(jobsToCreate * (youthOwnership / 100)),
    'Disabled Employees': Math.round(jobsToCreate * (disabledOwnership / 100))
  };

  const hdiGroups = Object.keys(jobDistribution);
  const jobsData = Object.values(jobDistribution);

  return (
    <div style={{ 
      backgroundColor: '#fdfcfb', 
      padding: '20px', 
      margin: '20px 0',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ color: '#5d4037', margin: 0 }}>Jobs Created by HDI Group</h2>
        <button
          onClick={() => setShowDownloadModal(true)}
          style={{
            padding: '8px 12px',
            backgroundColor: '#9c7c5f',
            color: '#fdfcfb',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <Download size={16} />
          Download
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '20px'
      }}>
        <div style={{
          backgroundColor: '#f7f3f0',
          padding: '20px',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#72542b', margin: '0 0 10px 0' }}>Total Jobs to Create</h3>
          <div style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#5d4037'
          }}>
            {jobsToCreate}
          </div>
        </div>
        
        <div style={{
          backgroundColor: '#f7f3f0',
          padding: '20px',
          borderRadius: '6px'
        }}>
          <h3 style={{ color: '#72542b', margin: '0 0 15px 0' }}>Ownership Breakdown</h3>
          <div style={{ fontSize: '14px', color: '#5d4037' }}>
            <div>Black Ownership: {blackOwnership}%</div>
            <div>Women Ownership: {womenOwnership}%</div>
            <div>Youth Ownership: {youthOwnership}%</div>
            <div>Disabled Ownership: {disabledOwnership}%</div>
          </div>
        </div>
      </div>

      <div style={{ height: '400px' }}>
        <Bar 
          data={{
            labels: hdiGroups,
            datasets: [{
              label: 'Estimated Jobs',
              data: jobsData,
              backgroundColor: '#9c7c5f',
              borderColor: '#5d4037',
              borderWidth: 1
            }]
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Number of Jobs'
                }
              }
            }
          }}
        />
      </div>

      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownload={handleDownload}
        sectionName="Jobs Created"
        availableData={availableData}
      />
    </div>
  );
};

// HDI Funding Component
const HDIFunding = ({ activeSection, fundingData }) => {
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const availableData = [
    { key: 'breakdown', label: 'HDI Ownership Breakdown' },
    { key: 'distribution', label: 'Funding Distribution Chart Data' }
  ];

  const handleDownload = (selectedData) => {
    const blackOwnership = parseFloat(fundingData?.socialImpact?.blackOwnership || 0);
    const womenOwnership = parseFloat(fundingData?.socialImpact?.womenOwnership || 0);
    const youthOwnership = parseFloat(fundingData?.socialImpact?.youthOwnership || 0);
    const disabledOwnership = parseFloat(fundingData?.socialImpact?.disabledOwnership || 0);
    const avgHDIOwnership = (blackOwnership + womenOwnership + youthOwnership + disabledOwnership) / 4;
    const nonHDI = 100 - avgHDIOwnership;

    const data = {
      hdiOwnershipBreakdown: {
        black: blackOwnership,
        women: womenOwnership,
        youth: youthOwnership,
        disabled: disabledOwnership,
        average: avgHDIOwnership
      },
      fundingDistribution: {
        hdiOwned: avgHDIOwnership,
        nonHDI: nonHDI
      }
    };

    const filteredData = {};
    selectedData.forEach(item => {
      if (item.key === 'breakdown') filteredData.hdiOwnershipBreakdown = data.hdiOwnershipBreakdown;
      if (item.key === 'distribution') filteredData.fundingDistribution = data.fundingDistribution;
    });

    const blob = new Blob([JSON.stringify(filteredData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hdi-funding-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (activeSection !== 'hdi-funding') return null;

  const blackOwnership = parseFloat(fundingData?.socialImpact?.blackOwnership || 0);
  const womenOwnership = parseFloat(fundingData?.socialImpact?.womenOwnership || 0);
  const youthOwnership = parseFloat(fundingData?.socialImpact?.youthOwnership || 0);
  const disabledOwnership = parseFloat(fundingData?.socialImpact?.disabledOwnership || 0);

  // Calculate average HDI ownership
  const avgHDIOwnership = (blackOwnership + womenOwnership + youthOwnership + disabledOwnership) / 4;
  const nonHDI = 100 - avgHDIOwnership;

  const fundingChartData = {
    labels: ['HDI-Owned', 'Non-HDI'],
    datasets: [{
      data: [avgHDIOwnership, nonHDI],
      backgroundColor: ['#9c7c5f', '#e8ddd4'],
      borderColor: '#5d4037',
      borderWidth: 1
    }]
  };

  return (
    <div style={{ 
      backgroundColor: '#fdfcfb', 
      padding: '20px', 
      margin: '20px 0',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ color: '#5d4037', margin: 0 }}>HDI Ownership Distribution</h2>
        <button
          onClick={() => setShowDownloadModal(true)}
          style={{
            padding: '8px 12px',
            backgroundColor: '#9c7c5f',
            color: '#fdfcfb',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <Download size={16} />
          Download
        </button>
      </div>

      <div style={{ 
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        alignItems: 'center'
      }}>
        <div style={{ height: '300px' }}>
          <Doughnut 
            data={fundingChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right'
                }
              }
            }}
          />
        </div>
        <div>
          <div style={{ 
            backgroundColor: '#f7f3f0',
            padding: '20px',
            borderRadius: '6px'
          }}>
            <h3 style={{ color: '#72542b' }}>HDI Ownership Breakdown</h3>
            <ul style={{ 
              listStyle: 'none',
              padding: 0,
              color: '#5d4037'
            }}>
              <li style={{ marginBottom: '10px' }}>• Black Ownership: {blackOwnership}%</li>
              <li style={{ marginBottom: '10px' }}>• Women Ownership: {womenOwnership}%</li>
              <li style={{ marginBottom: '10px' }}>• Youth Ownership: {youthOwnership}%</li>
              <li style={{ marginBottom: '10px' }}>• Disabled Ownership: {disabledOwnership}%</li>
              <li style={{ marginBottom: '10px', fontWeight: 'bold' }}>• Average HDI: {avgHDIOwnership.toFixed(1)}%</li>
            </ul>
          </div>
        </div>
      </div>

      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownload={handleDownload}
        sectionName="HDI Funding"
        availableData={availableData}
      />
    </div>
  );
};

// CSI/CSR Spend Component
const CSISpend = ({ activeSection, fundingData }) => {
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const availableData = [
    { key: 'spend', label: 'CSI/CSR Spend Amount' },
    { key: 'numeric', label: 'Numeric Value' },
    { key: 'currency', label: 'Currency Information' }
  ];

  const handleDownload = (selectedData) => {
    const csiSpend = fundingData?.socialImpact?.csiCsrSpend || 'R0';
    const numericSpend = parseFloat(csiSpend.replace(/[^\d.]/g, '')) || 0;

    const data = {
      csiCsrSpend: csiSpend,
      numericValue: numericSpend,
      currency: 'ZAR'
    };

    const filteredData = {};
    selectedData.forEach(item => {
      if (item.key === 'spend') filteredData.csiCsrSpend = data.csiCsrSpend;
      if (item.key === 'numeric') filteredData.numericValue = data.numericValue;
      if (item.key === 'currency') filteredData.currency = data.currency;
    });

    const blob = new Blob([JSON.stringify(filteredData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'csi-spend-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (activeSection !== 'csi-spend') return null;

  const csiSpend = fundingData?.socialImpact?.csiCsrSpend || 'R0';
  
  // Extract numeric value from CSI spend (remove R and any formatting)
  const numericSpend = parseFloat(csiSpend.replace(/[^\d.]/g, '')) || 0;

  return (
    <div style={{ 
      backgroundColor: '#fdfcfb', 
      padding: '20px', 
      margin: '20px 0',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ color: '#5d4037', margin: 0 }}>CSI/CSR Spend</h2>
        <button
          onClick={() => setShowDownloadModal(true)}
          style={{
            padding: '8px 12px',
            backgroundColor: '#9c7c5f',
            color: '#fdfcfb',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <Download size={16} />
          Download
        </button>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px'
      }}>
        <div style={{
          backgroundColor: '#f7f3f0',
          padding: '40px',
          borderRadius: '12px',
          textAlign: 'center',
          minWidth: '300px'
        }}>
          <h3 style={{ color: '#72542b', margin: '0 0 20px 0' }}>Annual CSI/CSR Investment</h3>
          <div style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#5d4037',
            marginBottom: '10px'
          }}>
            {csiSpend}
          </div>
          <div style={{
            fontSize: '16px',
            color: '#72542b'
          }}>
            Corporate Social Investment & Responsibility
          </div>
        </div>
      </div>

      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownload={handleDownload}
        sectionName="CSI/CSR Spend"
        availableData={availableData}
      />
    </div>
  );
};

// B-BBEE Level Component (pulled from funding data if available)
const BbbeeLevel = ({ activeSection, fundingData }) => {
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const availableData = [
    { key: 'level', label: 'Estimated B-BBEE Level' },
    { key: 'breakdown', label: 'Ownership Breakdown' },
    { key: 'note', label: 'Calculation Notes' }
  ];

  const handleDownload = (selectedData) => {
    const blackOwnership = parseFloat(fundingData?.socialImpact?.blackOwnership || 0);
    const womenOwnership = parseFloat(fundingData?.socialImpact?.womenOwnership || 0);
    const youthOwnership = parseFloat(fundingData?.socialImpact?.youthOwnership || 0);
    const disabledOwnership = parseFloat(fundingData?.socialImpact?.disabledOwnership || 0);
    const totalHDI = blackOwnership + womenOwnership + youthOwnership + disabledOwnership;
    
    let estimatedLevel = 8;
    if (totalHDI >= 300) estimatedLevel = 1;
    else if (totalHDI >= 250) estimatedLevel = 2;
    else if (totalHDI >= 200) estimatedLevel = 3;
    else if (totalHDI >= 150) estimatedLevel = 4;
    else if (totalHDI >= 120) estimatedLevel = 5;
    else if (totalHDI >= 90) estimatedLevel = 6;
    else if (totalHDI >= 60) estimatedLevel = 7;

    const data = {
      estimatedBBBEELevel: estimatedLevel,
      ownershipBreakdown: {
        black: blackOwnership,
        women: womenOwnership,
        youth: youthOwnership,
        disabled: disabledOwnership,
        total: totalHDI
      },
      calculationNote: "This is a simplified estimation based on ownership percentages only"
    };

    const filteredData = {};
    selectedData.forEach(item => {
      if (item.key === 'level') filteredData.estimatedBBBEELevel = data.estimatedBBBEELevel;
      if (item.key === 'breakdown') filteredData.ownershipBreakdown = data.ownershipBreakdown;
      if (item.key === 'note') filteredData.calculationNote = data.calculationNote;
    });

    const blob = new Blob([JSON.stringify(filteredData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bbbee-level-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (activeSection !== 'bbbee-level') return null;

  // Calculate B-BBEE level based on ownership percentages
  const blackOwnership = parseFloat(fundingData?.socialImpact?.blackOwnership || 0);
  const womenOwnership = parseFloat(fundingData?.socialImpact?.womenOwnership || 0);
  const youthOwnership = parseFloat(fundingData?.socialImpact?.youthOwnership || 0);
  const disabledOwnership = parseFloat(fundingData?.socialImpact?.disabledOwnership || 0);

  // Simple B-BBEE level calculation (this is simplified - actual calculation is more complex)
  const totalHDI = blackOwnership + womenOwnership + youthOwnership + disabledOwnership;
  let estimatedLevel = 8; // Default to lowest level

  if (totalHDI >= 300) estimatedLevel = 1;
  else if (totalHDI >= 250) estimatedLevel = 2;
  else if (totalHDI >= 200) estimatedLevel = 3;
  else if (totalHDI >= 150) estimatedLevel = 4;
  else if (totalHDI >= 120) estimatedLevel = 5;
  else if (totalHDI >= 90) estimatedLevel = 6;
  else if (totalHDI >= 60) estimatedLevel = 7;

  const levels = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div style={{ 
      backgroundColor: '#fdfcfb', 
      padding: '20px', 
      margin: '20px 0',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ color: '#5d4037', margin: 0 }}>B-BBEE Level (Estimated)</h2>
        <button
          onClick={() => setShowDownloadModal(true)}
          style={{
            padding: '8px 12px',
            backgroundColor: '#9c7c5f',
            color: '#fdfcfb',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <Download size={16} />
          Download
        </button>
      </div>

      <div style={{ 
        display: 'flex',
        justifyContent: 'center',
        marginTop: '30px'
      }}>
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div style={{ 
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            backgroundColor: '#9c7c5f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '48px',
            fontWeight: 'bold',
            marginBottom: '20px'
          }}>
            {estimatedLevel}
          </div>
          
          <div style={{ 
            display: 'flex',
            gap: '5px',
            marginBottom: '20px'
          }}>
            {levels.map(level => (
              <div key={level} style={{ 
                width: '35px',
                height: '35px',
                borderRadius: '50%',
                backgroundColor: level <= estimatedLevel ? '#9c7c5f' : '#e8ddd4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: level <= estimatedLevel ? 'white' : '#5d4037',
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                {level}
              </div>
            ))}
          </div>

          <div style={{
            backgroundColor: '#f7f3f0',
            padding: '20px',
            borderRadius: '6px',
            textAlign: 'center',
            maxWidth: '400px'
          }}>
            <h3 style={{ color: '#72542b', margin: '0 0 15px 0' }}>Ownership Summary</h3>
            <div style={{ color: '#5d4037', fontSize: '14px', textAlign: 'left' }}>
              <div>Black Ownership: {blackOwnership}%</div>
              <div>Women Ownership: {womenOwnership}%</div>
              <div>Youth Ownership: {youthOwnership}%</div>
              <div>Disabled Ownership: {disabledOwnership}%</div>
              <hr style={{ margin: '10px 0', border: '1px solid #d4c4b0' }} />
              <div style={{ fontWeight: 'bold' }}>Total HDI Score: {totalHDI}</div>
            </div>
            <div style={{ 
              marginTop: '15px', 
              fontSize: '12px', 
              color: '#72542b',
              fontStyle: 'italic'
            }}>
              *Simplified estimation based on ownership data only
            </div>
          </div>
        </div>
      </div>

      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownload={handleDownload}
        sectionName="B-BBEE Level"
        availableData={availableData}
      />
    </div>
  );
};

// Main SocialImpact Component
const SocialImpact = () => {
  const [activeSection, setActiveSection] = useState('jobs-created');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [fundingData, setFundingData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load funding application data
  useEffect(() => {
    const loadFundingData = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          setLoading(false);
          return;
        }

        const docRef = doc(db, "universalProfiles", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFundingData(data);
        }
      } catch (error) {
        console.error("Error loading funding data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFundingData();
  }, []);

  useEffect(() => {
    const checkSidebarState = () => {
      setIsSidebarCollapsed(document.body.classList.contains("sidebar-collapsed"));
    }

    checkSidebarState();

    const observer = new MutationObserver(checkSidebarState);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const getContentStyles = () => ({
    width: '100%',
    marginLeft: '0',
    backgroundColor: '#f7f3f0',
    minHeight: '100vh',
    padding: `70px 20px 20px ${isSidebarCollapsed ? "100px" : "270px"}`,
    transition: 'padding 0.3s ease',
    boxSizing: 'border-box'
  });

  const sectionButtons = [
    { id: 'jobs-created', label: 'Jobs Created' },
    { id: 'hdi-funding', label: 'HDI Ownership' },
    { id: 'csi-spend', label: 'CSI/CSR Spend' },
    { id: 'bbbee-level', label: 'B-BBEE Level' }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <div style={getContentStyles()}>
          <Header />
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '50vh',
            color: '#5d4037'
          }}>
            Loading social impact data...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      
      <div style={getContentStyles()}>
        <Header />
        
        <div style={{ padding: '20px' }}>
          <div style={{
            display: 'flex',
            gap: '10px',
            margin: '50px 0 20px 0',
            padding: '15px',
            backgroundColor: '#fdfcfb',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}>
            {sectionButtons.map((button) => (
              <button
                key={button.id}
                onClick={() => setActiveSection(button.id)}
                style={{
                  padding: '10px 15px',
                  backgroundColor: activeSection === button.id ? '#5d4037' : '#e8ddd4',
                  color: activeSection === button.id ? '#fdfcfb' : '#5d4037',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  minWidth: '120px',
                  textAlign: 'center',
                  flexShrink: 0
                }}
              >
                {button.label}
              </button>
            ))}
          </div>

          <JobsCreated activeSection={activeSection} fundingData={fundingData} />
          <HDIFunding activeSection={activeSection} fundingData={fundingData} />
          <CSISpend activeSection={activeSection} fundingData={fundingData} />
          <BbbeeLevel activeSection={activeSection} fundingData={fundingData} />
        </div>
      </div>
    </div>
  );
};

export default SocialImpact;