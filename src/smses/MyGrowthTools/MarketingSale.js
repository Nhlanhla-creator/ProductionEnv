"use client"

import React, { useState, useEffect } from 'react';
import { Bar, Pie, Line, Doughnut, Scatter } from 'react-chartjs-2';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import Sidebar from 'smses/Sidebar/Sidebar';
import Header from '../DashboardHeader/DashboardHeader';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Download functionality
const downloadData = (data, filename, selectedSections) => {
  const filteredData = {};
  selectedSections.forEach(section => {
    if (data[section]) {
      filteredData[section] = data[section];
    }
  });

  const dataStr = JSON.stringify(filteredData, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

// Download Modal Component
const DownloadModal = ({ isOpen, onClose, onDownload, availableSections, sectionTitle }) => {
  const [selectedSections, setSelectedSections] = useState([]);

  const toggleSection = (section) => {
    setSelectedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleDownload = () => {
    if (selectedSections.length > 0) {
      onDownload(selectedSections);
      onClose();
      setSelectedSections([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#fdfcfb',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '400px',
        width: '90%'
      }}>
        <h3 style={{ color: '#5d4037', marginTop: 0 }}>Download {sectionTitle} Data</h3>
        <p style={{ color: '#72542b' }}>Select which sections to include in your download:</p>
        
        <div style={{ marginBottom: '20px' }}>
          {availableSections.map(section => (
            <label key={section.id} style={{
              display: 'block',
              marginBottom: '10px',
              color: '#5d4037',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={selectedSections.includes(section.id)}
                onChange={() => toggleSection(section.id)}
                style={{ marginRight: '8px' }}
              />
              {section.label}
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#e8ddd4',
              color: '#5d4037',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={selectedSections.length === 0}
            style={{
              padding: '8px 16px',
              backgroundColor: selectedSections.length > 0 ? '#5d4037' : '#ccc',
              color: '#fdfcfb',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedSections.length > 0 ? 'pointer' : 'not-allowed'
            }}
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

// NewLeads Component
const NewLeads = ({ activeSection }) => {
  const [leadData, setLeadData] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [qualifiedData, setQualifiedData] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const saveLeadsData = async () => {
    try {
      await setDoc(doc(db, 'new-leads', 'main'), { leadData, qualifiedData });
      setShowEditForm(false);
      alert('Leads data saved successfully!');
    } catch (error) {
      console.error('Error saving leads data:', error);
      alert('Error saving data');
    }
  };

  const loadLeadsData = async () => {
    try {
      const docRef = doc(db, 'new-leads', 'main');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLeadData(data.leadData || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        setQualifiedData(data.qualifiedData || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      }
    } catch (error) {
      console.error('Error loading leads data:', error);
    }
  };

  useEffect(() => {
    loadLeadsData();
  }, []);

  const updateLeadValue = (index, value) => {
    const newData = [...leadData];
    newData[index] = parseFloat(value) || 0;
    setLeadData(newData);
  };

  const updateQualifiedValue = (index, value) => {
    const newData = [...qualifiedData];
    newData[index] = parseFloat(value) || 0;
    setQualifiedData(newData);
  };

  const handleDownload = (selectedSections) => {
    const data = {
      'new-leads': leadData,
      'qualified-leads': qualifiedData,
      'summary': {
        totalNewLeads: leadData.reduce((sum, val) => sum + val, 0),
        totalQualifiedLeads: qualifiedData.reduce((sum, val) => sum + val, 0),
        conversionRate: leadData.reduce((sum, val) => sum + val, 0) > 0 ? 
          ((qualifiedData.reduce((sum, val) => sum + val, 0) / leadData.reduce((sum, val) => sum + val, 0)) * 100).toFixed(2) : 0
      }
    };
    downloadData(data, 'new_leads', selectedSections);
  };

  if (activeSection !== 'new-leads') return null;

  return (
    <div style={{ 
      backgroundColor: '#fdfcfb', 
      padding: '20px', 
      margin: '20px 0',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#5d4037', marginTop: 0 }}>New Leads & Qualified Leads</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowEditForm(!showEditForm)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#5d4037',
              color: '#fdfcfb',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showEditForm ? 'Cancel' : 'Edit Data'}
          </button>
          <button
            onClick={() => setShowDownloadModal(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Download
          </button>
        </div>
      </div>

      {showEditForm && (
        <div style={{ 
          backgroundColor: '#f7f3f0', 
          padding: '20px', 
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#72542b', marginTop: 0 }}>Edit Leads Data</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h4 style={{ color: '#72542b' }}>New Leads</h4>
              {months.map((month, index) => (
                <div key={month} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ minWidth: '40px', color: '#72542b' }}>{month}:</span>
                  <input
                    type="number"
                    value={leadData[index]}
                    onChange={(e) => updateLeadValue(index, e.target.value)}
                    style={{
                      padding: '6px',
                      border: '1px solid #d4c4b0',
                      borderRadius: '4px',
                      width: '80px'
                    }}
                  />
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ color: '#72542b' }}>Qualified Leads</h4>
              {months.map((month, index) => (
                <div key={month} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ minWidth: '40px', color: '#72542b' }}>{month}:</span>
                  <input
                    type="number"
                    value={qualifiedData[index]}
                    onChange={(e) => updateQualifiedValue(index, e.target.value)}
                    style={{
                      padding: '6px',
                      border: '1px solid #d4c4b0',
                      borderRadius: '4px',
                      width: '80px'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={saveLeadsData}
            style={{
              padding: '8px 16px',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '15px'
            }}
          >
            Save Data
          </button>
        </div>
      )}

      <div style={{ height: '400px' }}>
        <Bar 
          data={{
            labels: months,
            datasets: [
              {
                label: 'New Leads',
                data: leadData,
                backgroundColor: '#9c7c5f',
                borderColor: '#5d4037',
                borderWidth: 1
              },
              {
                label: 'Qualified Leads',
                data: qualifiedData,
                backgroundColor: '#e8ddd4',
                borderColor: '#d4c4b0',
                borderWidth: 1
              }
            ]
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top'
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Number of Leads'
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
        availableSections={[
          { id: 'new-leads', label: 'New Leads Data' },
          { id: 'qualified-leads', label: 'Qualified Leads Data' },
          { id: 'summary', label: 'Summary Statistics' }
        ]}
        sectionTitle="New Leads"
      />
    </div>
  );
};

// LeadSourceAnalysis Component
const LeadSourceAnalysis = ({ activeSection }) => {
  const [sources, setSources] = useState([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const saveSourceData = async () => {
    try {
      await setDoc(doc(db, 'lead-source', 'main'), { sources });
      setShowEditForm(false);
      alert('Lead source data saved successfully!');
    } catch (error) {
      console.error('Error saving lead source data:', error);
      alert('Error saving data');
    }
  };

  const loadSourceData = async () => {
    try {
      const docRef = doc(db, 'lead-source', 'main');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSources(docSnap.data().sources || []);
      }
    } catch (error) {
      console.error('Error loading lead source data:', error);
    }
  };

  useEffect(() => {
    loadSourceData();
  }, []);

  const updateSource = (index, field, value) => {
    const newSources = [...sources];
    newSources[index][field] = field === 'name' ? value : parseFloat(value) || 0;
    setSources(newSources);
  };

  const addSource = () => {
    setSources([...sources, { name: 'New Source', percentage: 0 }]);
  };

  const removeSource = (index) => {
    const newSources = sources.filter((_, i) => i !== index);
    setSources(newSources);
  };

  const handleDownload = (selectedSections) => {
    const data = {
      'sources': sources,
      'summary': {
        totalSources: sources.length,
        topSource: sources.length > 0 ? sources.reduce((prev, current) => (prev.percentage > current.percentage) ? prev : current) : null
      }
    };
    downloadData(data, 'lead_sources', selectedSections);
  };

  if (activeSection !== 'lead-source-analysis') return null;

  const sourceNames = sources.map(s => s.name);
  const sourceData = sources.map(s => s.percentage);

  return (
    <div style={{ 
      backgroundColor: '#fdfcfb', 
      padding: '20px', 
      margin: '20px 0',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#5d4037', marginTop: 0 }}>Lead Source Analysis</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowEditForm(!showEditForm)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#5d4037',
              color: '#fdfcfb',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showEditForm ? 'Cancel' : 'Edit Data'}
          </button>
          <button
            onClick={() => setShowDownloadModal(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Download
          </button>
        </div>
      </div>

      {showEditForm && (
        <div style={{ 
          backgroundColor: '#f7f3f0', 
          padding: '20px', 
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#72542b', marginTop: 0 }}>Edit Lead Source Data</h3>
          {sources.map((source, index) => (
            <div key={index} style={{ 
              display: 'grid', 
              gridTemplateColumns: '2fr 1fr auto',
              gap: '10px',
              alignItems: 'center',
              marginBottom: '10px',
              padding: '10px',
              backgroundColor: '#fdfcfb',
              borderRadius: '4px'
            }}>
              <input
                type="text"
                value={source.name}
                onChange={(e) => updateSource(index, 'name', e.target.value)}
                style={{
                  padding: '8px',
                  border: '1px solid #d4c4b0',
                  borderRadius: '4px'
                }}
                placeholder="Source Name"
              />
              <input
                type="number"
                value={source.percentage}
                onChange={(e) => updateSource(index, 'percentage', e.target.value)}
                style={{
                  padding: '8px',
                  border: '1px solid #d4c4b0',
                  borderRadius: '4px'
                }}
                placeholder="Percentage"
              />
              <button
                onClick={() => removeSource(index)}
                style={{
                  padding: '8px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <div style={{ marginTop: '15px' }}>
            <button
              onClick={addSource}
              style={{
                padding: '8px 16px',
                backgroundColor: '#72542b',
                color: '#fdfcfb',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Add Source
            </button>
            <button
              onClick={saveSourceData}
              style={{
                padding: '8px 16px',
                backgroundColor: '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Save Data
            </button>
          </div>
        </div>
      )}

      {sources.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          color: '#72542b'
        }}>
          <p>No lead source data available. Click "Edit Data" to add your first source.</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          alignItems: 'center'
        }}>
          <div style={{ height: '300px' }}>
            <Pie 
              data={{
                labels: sourceNames,
                datasets: [{
                  data: sourceData,
                  backgroundColor: [
                    '#9c7c5f',
                    '#e8ddd4',
                    '#d4c4b0',
                    '#b8a38d',
                    '#a58f7a',
                    '#8a7865'
                  ],
                  borderColor: '#5d4037',
                  borderWidth: 1
                }]
              }}
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
              <h3 style={{ color: '#72542b' }}>Top Performing Sources</h3>
              <ol style={{ 
                listStyle: 'none',
                padding: 0,
                color: '#5d4037'
              }}>
                {sources
                  .sort((a, b) => b.percentage - a.percentage)
                  .slice(0, 3)
                  .map((source, index) => (
                    <li key={index} style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{index + 1}. {source.name}</span>
                      <span style={{ fontWeight: 'bold' }}>{source.percentage}%</span>
                    </li>
                  ))}
              </ol>
            </div>
          </div>
        </div>
      )}

      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownload={handleDownload}
        availableSections={[
          { id: 'sources', label: 'Lead Sources Data' },
          { id: 'summary', label: 'Summary Statistics' }
        ]}
        sectionTitle="Lead Source Analysis"
      />
    </div>
  );
};

// CostPerLead Component
const CostPerLead = ({ activeSection }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [industryAvg, setIndustryAvg] = useState(0);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const saveCostPerLeadData = async () => {
    try {
      await setDoc(doc(db, 'cost-per-lead', 'main'), { campaigns, industryAvg });
      setShowEditForm(false);
      alert('Cost per lead data saved successfully!');
    } catch (error) {
      console.error('Error saving cost per lead data:', error);
      alert('Error saving data');
    }
  };

  const loadCostPerLeadData = async () => {
    try {
      const docRef = doc(db, 'cost-per-lead', 'main');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCampaigns(data.campaigns || []);
        setIndustryAvg(data.industryAvg || 0);
      }
    } catch (error) {
      console.error('Error loading cost per lead data:', error);
    }
  };

  useEffect(() => {
    loadCostPerLeadData();
  }, []);

  const updateCampaign = (index, field, value) => {
    const newCampaigns = [...campaigns];
    newCampaigns[index][field] = field === 'name' ? value : parseFloat(value) || 0;
    setCampaigns(newCampaigns);
  };

  const addCampaign = () => {
    setCampaigns([...campaigns, { name: 'New Campaign', cost: 0 }]);
  };

  const removeCampaign = (index) => {
    const newCampaigns = campaigns.filter((_, i) => i !== index);
    setCampaigns(newCampaigns);
  };

  const handleDownload = (selectedSections) => {
    const data = {
      'campaigns': campaigns,
      'industry-average': industryAvg,
      'summary': {
        totalCampaigns: campaigns.length,
        averageCost: campaigns.length > 0 ? (campaigns.reduce((sum, c) => sum + c.cost, 0) / campaigns.length).toFixed(2) : 0,
        bestPerforming: campaigns.length > 0 ? campaigns.reduce((prev, current) => (prev.cost < current.cost) ? prev : current) : null
      }
    };
    downloadData(data, 'cost_per_lead', selectedSections);
  };

  if (activeSection !== 'cost-per-lead') return null;

  const campaignNames = campaigns.map(c => c.name);
  const costData = campaigns.map(c => c.cost);

  return (
    <div style={{ 
      backgroundColor: '#fdfcfb', 
      padding: '20px', 
      margin: '20px 0',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#5d4037', marginTop: 0 }}>Cost Per Lead by Campaign</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowEditForm(!showEditForm)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#5d4037',
              color: '#fdfcfb',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showEditForm ? 'Cancel' : 'Edit Data'}
          </button>
          <button
            onClick={() => setShowDownloadModal(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Download
          </button>
        </div>
      </div>

      {showEditForm && (
        <div style={{ 
          backgroundColor: '#f7f3f0', 
          padding: '20px', 
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#72542b', marginTop: 0 }}>Edit Cost Per Lead Data</h3>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: '#72542b', display: 'block', marginBottom: '5px' }}>Industry Average:</label>
            <input
              type="number"
              value={industryAvg}
              onChange={(e) => setIndustryAvg(parseFloat(e.target.value) || 0)}
              style={{
                padding: '8px',
                border: '1px solid #d4c4b0',
                borderRadius: '4px',
                width: '120px'
              }}
              placeholder="Industry Avg"
            />
          </div>
          {campaigns.map((campaign, index) => (
            <div key={index} style={{ 
              display: 'grid', 
              gridTemplateColumns: '2fr 1fr auto',
              gap: '10px',
              alignItems: 'center',
              marginBottom: '10px',
              padding: '10px',
              backgroundColor: '#fdfcfb',
              borderRadius: '4px'
            }}>
              <input
                type="text"
                value={campaign.name}
                onChange={(e) => updateCampaign(index, 'name', e.target.value)}
                style={{
                  padding: '8px',
                  border: '1px solid #d4c4b0',
                  borderRadius: '4px'
                }}
                placeholder="Campaign Name"
              />
              <input
                type="number"
                value={campaign.cost}
                onChange={(e) => updateCampaign(index, 'cost', e.target.value)}
                style={{
                  padding: '8px',
                  border: '1px solid #d4c4b0',
                  borderRadius: '4px'
                }}
                placeholder="Cost (ZAR)"
              />
              <button
                onClick={() => removeCampaign(index)}
                style={{
                  padding: '8px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <div style={{ marginTop: '15px' }}>
            <button
              onClick={addCampaign}
              style={{
                padding: '8px 16px',
                backgroundColor: '#72542b',
                color: '#fdfcfb',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Add Campaign
            </button>
            <button
              onClick={saveCostPerLeadData}
              style={{
                padding: '8px 16px',
                backgroundColor: '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Save Data
            </button>
          </div>
        </div>
      )}

      {campaigns.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          color: '#72542b'
        }}>
          <p>No campaign data available. Click "Edit Data" to add your first campaign.</p>
        </div>
      ) : (
        <div style={{ height: '400px' }}>
          <Bar 
            data={{
              labels: campaignNames,
              datasets: [
                {
                  label: 'Cost Per Lead (ZAR)',
                  data: costData,
                  backgroundColor: '#9c7c5f',
                  borderColor: '#5d4037',
                  borderWidth: 1
                },
                {
                  label: 'Industry Average',
                  data: Array(campaigns.length).fill(industryAvg),
                  borderColor: '#F44336',
                  borderWidth: 2,
                  borderDash: [5, 5],
                  backgroundColor: 'transparent',
                  type: 'line',
                  pointRadius: 0
                }
              ]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top'
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Cost (ZAR)'
                  }
                }
              }
            }}
          />
        </div>
      )}

      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownload={handleDownload}
        availableSections={[
          { id: 'campaigns', label: 'Campaign Data' },
          { id: 'industry-average', label: 'Industry Average' },
          { id: 'summary', label: 'Summary Statistics' }
        ]}
        sectionTitle="Cost Per Lead"
      />
    </div>
  );
};

// CustomerAcquisitionCost Component
const CustomerAcquisitionCost = ({ activeSection }) => {
  const [cacData, setCacData] = useState([0, 0, 0, 0, 0]);
  const [ltvData, setLtvData] = useState([0, 0, 0, 0, 0]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const quarters = ['Q1 2022', 'Q2 2022', 'Q3 2022', 'Q4 2022', 'Q1 2023'];

  const saveCacData = async () => {
    try {
      await setDoc(doc(db, 'customer-acquisition-cost', 'main'), { cacData, ltvData });
      setShowEditForm(false);
      alert('CAC data saved successfully!');
    } catch (error) {
      console.error('Error saving CAC data:', error);
      alert('Error saving data');
    }
  };

  const loadCacData = async () => {
    try {
      const docRef = doc(db, 'customer-acquisition-cost', 'main');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCacData(data.cacData || [0, 0, 0, 0, 0]);
        setLtvData(data.ltvData || [0, 0, 0, 0, 0]);
      }
    } catch (error) {
      console.error('Error loading CAC data:', error);
    }
  };

  useEffect(() => {
    loadCacData();
  }, []);

  const updateCacValue = (index, value) => {
    const newData = [...cacData];
    newData[index] = parseFloat(value) || 0;
    setCacData(newData);
  };

  const updateLtvValue = (index, value) => {
    const newData = [...ltvData];
    newData[index] = parseFloat(value) || 0;
    setLtvData(newData);
  };

  const handleDownload = (selectedSections) => {
    const currentCac = cacData[cacData.length - 1] || 0;
    const currentLtv = ltvData[ltvData.length - 1] || 0;
    const ratio = currentCac > 0 ? (currentLtv / currentCac).toFixed(1) : 0;

    const data = {
      'cac-data': cacData,
      'ltv-data': ltvData,
      'summary': {
        currentCAC: currentCac,
        currentLTV: currentLtv,
        ratio: ratio,
        quarters: quarters
      }
    };
    downloadData(data, 'customer_acquisition_cost', selectedSections);
  };

  if (activeSection !== 'customer-acquisition-cost') return null;

  const currentCac = cacData[cacData.length - 1] || 0;
  const currentLtv = ltvData[ltvData.length - 1] || 0;
  const ratio = currentCac > 0 ? (currentLtv / currentCac).toFixed(1) : 0;

  return (
    <div style={{ 
      backgroundColor: '#fdfcfb', 
      padding: '20px', 
      margin: '20px 0',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#5d4037', marginTop: 0 }}>Customer Acquisition Cost (CAC) vs LTV</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowEditForm(!showEditForm)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#5d4037',
              color: '#fdfcfb',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showEditForm ? 'Cancel' : 'Edit Data'}
          </button>
          <button
            onClick={() => setShowDownloadModal(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Download
          </button>
        </div>
      </div>

      {showEditForm && (
        <div style={{ 
          backgroundColor: '#f7f3f0', 
          padding: '20px', 
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#72542b', marginTop: 0 }}>Edit CAC & LTV Data</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h4 style={{ color: '#72542b' }}>CAC (ZAR)</h4>
              {quarters.map((quarter, index) => (
                <div key={quarter} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ minWidth: '60px', color: '#72542b' }}>{quarter}:</span>
                  <input
                    type="number"
                    value={cacData[index]}
                    onChange={(e) => updateCacValue(index, e.target.value)}
                    style={{
                      padding: '6px',
                      border: '1px solid #d4c4b0',
                      borderRadius: '4px',
                      width: '100px'
                    }}
                  />
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ color: '#72542b' }}>LTV (ZAR)</h4>
              {quarters.map((quarter, index) => (
                <div key={quarter} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ minWidth: '60px', color: '#72542b' }}>{quarter}:</span>
                  <input
                    type="number"
                    value={ltvData[index]}
                    onChange={(e) => updateLtvValue(index, e.target.value)}
                    style={{
                      padding: '6px',
                      border: '1px solid #d4c4b0',
                      borderRadius: '4px',
                      width: '100px'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={saveCacData}
            style={{
              padding: '8px 16px',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '15px'
            }}
          >
            Save Data
          </button>
        </div>
      )}

      <div style={{ height: '400px' }}>
        <Line 
          data={{
            labels: quarters,
            datasets: [
              {
                label: 'CAC (ZAR)',
                data: cacData,
                borderColor: '#9c7c5f',
                backgroundColor: 'rgba(156, 124, 95, 0.1)',
                borderWidth: 2,
                tension: 0.1,
                fill: true
              },
              {
                label: 'LTV (ZAR)',
                data: ltvData,
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                borderWidth: 2,
                tension: 0.1,
                fill: true
              }
            ]
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top'
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Amount (ZAR)'
                }
              }
            }
          }}
        />
      </div>
      <div style={{ 
        backgroundColor: '#f7f3f0',
        padding: '15px',
        borderRadius: '6px',
        marginTop: '20px'
      }}>
        <h3 style={{ color: '#72542b', marginTop: 0 }}>CAC:LTV Ratio</h3>
        <p style={{ color: '#5d4037' }}>
          Current ratio: <strong>1:{ratio}</strong> (Healthy benchmark is 1:3 or better)
        </p>
      </div>

      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownload={handleDownload}
        availableSections={[
          { id: 'cac-data', label: 'CAC Data' },
          { id: 'ltv-data', label: 'LTV Data' },
          { id: 'summary', label: 'Summary & Ratios' }
        ]}
        sectionTitle="Customer Acquisition Cost"
      />
    </div>
  );
};

// CampaignROI Component
const CampaignROI = ({ activeSection }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const saveCampaignROIData = async () => {
    try {
      await setDoc(doc(db, 'campaign-roi', 'main'), { campaigns });
      setShowEditForm(false);
      alert('Campaign ROI data saved successfully!');
    } catch (error) {
      console.error('Error saving campaign ROI data:', error);
      alert('Error saving data');
    }
  };

  const loadCampaignROIData = async () => {
    try {
      const docRef = doc(db, 'campaign-roi', 'main');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setCampaigns(docSnap.data().campaigns || []);
      }
    } catch (error) {
      console.error('Error loading campaign ROI data:', error);
    }
  };

  useEffect(() => {
    loadCampaignROIData();
  }, []);

  const updateCampaign = (index, field, value) => {
    const newCampaigns = [...campaigns];
    newCampaigns[index][field] = field === 'name' ? value : parseFloat(value) || 0;
    setCampaigns(newCampaigns);
  };

  const addCampaign = () => {
    setCampaigns([...campaigns, { name: 'New Campaign', spend: 0, revenue: 0 }]);
  };

  const removeCampaign = (index) => {
    const newCampaigns = campaigns.filter((_, i) => i !== index);
    setCampaigns(newCampaigns);
  };

  const handleDownload = (selectedSections) => {
    const data = {
      'campaigns': campaigns,
      'summary': {
        totalCampaigns: campaigns.length,
        totalSpend: campaigns.reduce((sum, c) => sum + c.spend, 0),
        totalRevenue: campaigns.reduce((sum, c) => sum + c.revenue, 0),
        averageROI: campaigns.length > 0 ? 
          (campaigns.reduce((sum, c) => sum + (c.spend > 0 ? ((c.revenue - c.spend) / c.spend * 100) : 0), 0) / campaigns.length).toFixed(2) : 0
      }
    };
    downloadData(data, 'campaign_roi', selectedSections);
  };

  if (activeSection !== 'campaign-roi') return null;

  return (
    <div style={{ 
      backgroundColor: '#fdfcfb', 
      padding: '20px', 
      margin: '20px 0',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#5d4037', marginTop: 0 }}>Campaign ROI Analysis</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowEditForm(!showEditForm)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#5d4037',
              color: '#fdfcfb',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showEditForm ? 'Cancel' : 'Edit Data'}
          </button>
          <button
            onClick={() => setShowDownloadModal(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Download
          </button>
        </div>
      </div>

      {showEditForm && (
        <div style={{ 
          backgroundColor: '#f7f3f0', 
          padding: '20px', 
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#72542b', marginTop: 0 }}>Edit Campaign ROI Data</h3>
          {campaigns.map((campaign, index) => (
            <div key={index} style={{ 
              display: 'grid', 
              gridTemplateColumns: '2fr 1fr 1fr auto',
              gap: '10px',
              alignItems: 'center',
              marginBottom: '10px',
              padding: '10px',
              backgroundColor: '#fdfcfb',
              borderRadius: '4px'
            }}>
              <input
                type="text"
                value={campaign.name}
                onChange={(e) => updateCampaign(index, 'name', e.target.value)}
                style={{
                  padding: '8px',
                  border: '1px solid #d4c4b0',
                  borderRadius: '4px'
                }}
                placeholder="Campaign Name"
              />
              <input
                type="number"
                value={campaign.spend}
                onChange={(e) => updateCampaign(index, 'spend', e.target.value)}
                style={{
                  padding: '8px',
                  border: '1px solid #d4c4b0',
                  borderRadius: '4px'
                }}
                placeholder="Spend (ZAR)"
              />
              <input
                type="number"
                value={campaign.revenue}
                onChange={(e) => updateCampaign(index, 'revenue', e.target.value)}
                style={{
                  padding: '8px',
                  border: '1px solid #d4c4b0',
                  borderRadius: '4px'
                }}
                placeholder="Revenue (ZAR)"
              />
              <button
                onClick={() => removeCampaign(index)}
                style={{
                  padding: '8px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <div style={{ marginTop: '15px' }}>
            <button
              onClick={addCampaign}
              style={{
                padding: '8px 16px',
                backgroundColor: '#72542b',
                color: '#fdfcfb',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Add Campaign
            </button>
            <button
              onClick={saveCampaignROIData}
              style={{
                padding: '8px 16px',
                backgroundColor: '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Save Data
            </button>
          </div>
        </div>
      )}

      {campaigns.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          color: '#72542b'
        }}>
          <p>No campaign data available. Click "Edit Data" to add your first campaign.</p>
        </div>
      ) : (
        <>
          <div style={{ height: '400px' }}>
            <Scatter 
              data={{
                datasets: campaigns.map(campaign => ({
                  label: campaign.name,
                  data: [{
                    x: campaign.spend / 1000,
                    y: campaign.revenue / 1000
                  }],
                  backgroundColor: campaign.spend > 0 && campaign.revenue / campaign.spend >= 3 ? '#4CAF50' : 
                                  campaign.spend > 0 && campaign.revenue / campaign.spend >= 2 ? '#FFC107' : '#F44336',
                  radius: 15
                }))
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top'
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const campaign = campaigns.find(c => c.name === context.dataset.label);
                        const roi = campaign.spend > 0 ? ((campaign.revenue - campaign.spend) / campaign.spend * 100).toFixed(0) : 0;
                        return [
                          `Campaign: ${campaign.name}`,
                          `Spend: ZAR ${(campaign.spend / 1000).toFixed(0)}k`,
                          `Revenue: ZAR ${(campaign.revenue / 1000).toFixed(0)}k`,
                          `ROI: ${roi}%`
                        ];
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: 'Spend (ZAR thousands)'
                    },
                    beginAtZero: true
                  },
                  y: {
                    title: {
                      display: true,
                      text: 'Revenue (ZAR thousands)'
                    },
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '15px',
            marginTop: '20px'
          }}>
            {campaigns.map((campaign, index) => {
              const roi = campaign.spend > 0 ? ((campaign.revenue - campaign.spend) / campaign.spend * 100).toFixed(0) : 0;
              return (
                <div key={index} style={{ 
                  backgroundColor: '#f7f3f0',
                  padding: '15px',
                  borderRadius: '6px'
                }}>
                  <h3 style={{ color: '#72542b', marginTop: 0 }}>{campaign.name}</h3>
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <span>Spend:</span>
                    <span style={{ fontWeight: 'bold' }}>ZAR {campaign.spend.toLocaleString()}</span>
                  </div>
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <span>Revenue:</span>
                    <span style={{ fontWeight: 'bold' }}>ZAR {campaign.revenue.toLocaleString()}</span>
                  </div>
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <span>ROI:</span>
                    <span style={{ 
                      fontWeight: 'bold',
                      color: roi >= 200 ? '#4CAF50' : roi >= 100 ? '#FFC107' : '#F44336'
                    }}>
                      {roi}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownload={handleDownload}
        availableSections={[
          { id: 'campaigns', label: 'Campaign Data' },
          { id: 'summary', label: 'Summary Statistics' }
        ]}
        sectionTitle="Campaign ROI"
      />
    </div>
  );
};

// ConversionRate Component
const ConversionRate = ({ activeSection }) => {
  const [stages, setStages] = useState([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const saveConversionData = async () => {
    try {
      await setDoc(doc(db, 'conversion-rate', 'main'), { stages });
      setShowEditForm(false);
      alert('Conversion rate data saved successfully!');
    } catch (error) {
      console.error('Error saving conversion rate data:', error);
      alert('Error saving data');
    }
  };

  const loadConversionData = async () => {
    try {
      const docRef = doc(db, 'conversion-rate', 'main');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setStages(docSnap.data().stages || []);
      }
    } catch (error) {
      console.error('Error loading conversion rate data:', error);
    }
  };

  useEffect(() => {
    loadConversionData();
  }, []);

  const updateStage = (index, field, value) => {
    const newStages = [...stages];
    newStages[index][field] = field === 'name' ? value : parseFloat(value) || 0;
    setStages(newStages);
  };

  const addStage = () => {
    setStages([...stages, { name: 'New Stage', rate: 0 }]);
  };

  const removeStage = (index) => {
    const newStages = stages.filter((_, i) => i !== index);
    setStages(newStages);
  };

  const handleDownload = (selectedSections) => {
    const data = {
      'stages': stages,
      'summary': {
        totalStages: stages.length,
        averageConversion: stages.length > 0 ? (stages.reduce((sum, s) => sum + s.rate, 0) / stages.length).toFixed(2) : 0,
        bestPerforming: stages.length > 0 ? stages.reduce((prev, current) => (prev.rate > current.rate) ? prev : current) : null
      }
    };
    downloadData(data, 'conversion_rates', selectedSections);
  };

  if (activeSection !== 'conversion-rate') return null;

  return (
    <div style={{ 
      backgroundColor: '#fdfcfb', 
      padding: '20px', 
      margin: '20px 0',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#5d4037', marginTop: 0 }}>Conversion Rates</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowEditForm(!showEditForm)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#5d4037',
              color: '#fdfcfb',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showEditForm ? 'Cancel' : 'Edit Data'}
          </button>
          <button
            onClick={() => setShowDownloadModal(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Download
          </button>
        </div>
      </div>

      {showEditForm && (
        <div style={{ 
          backgroundColor: '#f7f3f0', 
          padding: '20px', 
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#72542b', marginTop: 0 }}>Edit Conversion Rate Data</h3>
          {stages.map((stage, index) => (
            <div key={index} style={{ 
              display: 'grid', 
              gridTemplateColumns: '2fr 1fr auto',
              gap: '10px',
              alignItems: 'center',
              marginBottom: '10px',
              padding: '10px',
              backgroundColor: '#fdfcfb',
              borderRadius: '4px'
            }}>
              <input
                type="text"
                value={stage.name}
                onChange={(e) => updateStage(index, 'name', e.target.value)}
                style={{
                  padding: '8px',
                  border: '1px solid #d4c4b0',
                  borderRadius: '4px'
                }}
                placeholder="Stage Name"
              />
              <input
                type="number"
                value={stage.rate}
                onChange={(e) => updateStage(index, 'rate', e.target.value)}
                style={{
                  padding: '8px',
                  border: '1px solid #d4c4b0',
                  borderRadius: '4px'
                }}
                placeholder="Rate %"
              />
              <button
                onClick={() => removeStage(index)}
                style={{
                  padding: '8px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <div style={{ marginTop: '15px' }}>
            <button
              onClick={addStage}
              style={{
                padding: '8px 16px',
                backgroundColor: '#72542b',
                color: '#fdfcfb',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Add Stage
            </button>
            <button
              onClick={saveConversionData}
              style={{
                padding: '8px 16px',
                backgroundColor: '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Save Data
            </button>
          </div>
        </div>
      )}

      {stages.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          color: '#72542b'
        }}>
          <p>No conversion stage data available. Click "Edit Data" to add your first stage.</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {stages.map((stage, index) => (
            <div key={index} style={{ 
              backgroundColor: '#f7f3f0',
              padding: '20px',
              borderRadius: '6px'
            }}>
              <h3 style={{ color: '#72542b', marginTop: 0 }}>{stage.name}</h3>
              <div style={{ 
                width: '100%',
                height: '20px',
                backgroundColor: '#e8ddd4',
                borderRadius: '10px',
                margin: '15px 0',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${stage.rate}%`,
                  height: '100%',
                  backgroundColor: '#9c7c5f',
                  borderRadius: '10px'
                }}></div>
              </div>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                color: '#5d4037'
              }}>
                <span>Current:</span>
                <span style={{ fontWeight: 'bold' }}>{stage.rate}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownload={handleDownload}
        availableSections={[
          { id: 'stages', label: 'Conversion Stages' },
          { id: 'summary', label: 'Summary Statistics' }
        ]}
        sectionTitle="Conversion Rates"
      />
    </div>
  );
};

// RetentionLTV Component
const RetentionLTV = ({ activeSection }) => {
  const [retentionRates, setRetentionRates] = useState([0, 0, 0, 0, 0, 0]);
  const [ltvValues, setLtvValues] = useState([0, 0, 0, 0, 0, 0]);
  const [churnRate, setChurnRate] = useState(0);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const cohorts = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

  const saveRetentionLTVData = async () => {
    try {
      await setDoc(doc(db, 'retention-ltv', 'main'), { retentionRates, ltvValues, churnRate });
      setShowEditForm(false);
      alert('Retention & LTV data saved successfully!');
    } catch (error) {
      console.error('Error saving retention & LTV data:', error);
      alert('Error saving data');
    }
  };

  const loadRetentionLTVData = async () => {
    try {
      const docRef = doc(db, 'retention-ltv', 'main');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRetentionRates(data.retentionRates || [0, 0, 0, 0, 0, 0]);
        setLtvValues(data.ltvValues || [0, 0, 0, 0, 0, 0]);
        setChurnRate(data.churnRate || 0);
      }
    } catch (error) {
      console.error('Error loading retention & LTV data:', error);
    }
  };

  useEffect(() => {
    loadRetentionLTVData();
  }, []);

  const updateRetentionValue = (index, value) => {
    const newData = [...retentionRates];
    newData[index] = parseFloat(value) || 0;
    setRetentionRates(newData);
  };

  const updateLtvValue = (index, value) => {
    const newData = [...ltvValues];
    newData[index] = parseFloat(value) || 0;
    setLtvValues(newData);
  };

  const handleDownload = (selectedSections) => {
    const data = {
      'retention-rates': retentionRates,
      'ltv-values': ltvValues,
      'churn-rate': churnRate,
      'summary': {
        averageRetention: retentionRates.length > 0 ? (retentionRates.reduce((sum, val) => sum + val, 0) / retentionRates.length).toFixed(2) : 0,
        averageLTV: ltvValues.length > 0 ? (ltvValues.reduce((sum, val) => sum + val, 0) / ltvValues.length).toFixed(2) : 0,
        churnRate: churnRate,
        cohorts: cohorts
      }
    };
    downloadData(data, 'retention_ltv', selectedSections);
  };

  if (activeSection !== 'retention-ltv') return null;

  return (
    <div style={{ 
      backgroundColor: '#fdfcfb', 
      padding: '20px', 
      margin: '20px 0',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#5d4037', marginTop: 0 }}>Retention & Lifetime Value (LTV)</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowEditForm(!showEditForm)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#5d4037',
              color: '#fdfcfb',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showEditForm ? 'Cancel' : 'Edit Data'}
          </button>
          <button
            onClick={() => setShowDownloadModal(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Download
          </button>
        </div>
      </div>

      {showEditForm && (
        <div style={{ 
          backgroundColor: '#f7f3f0', 
          padding: '20px', 
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#72542b', marginTop: 0 }}>Edit Retention & LTV Data</h3>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: '#72542b', display: 'block', marginBottom: '5px' }}>Churn Rate (%):</label>
            <input
              type="number"
              value={churnRate}
              onChange={(e) => setChurnRate(parseFloat(e.target.value) || 0)}
              style={{
                padding: '8px',
                border: '1px solid #d4c4b0',
                borderRadius: '4px',
                width: '120px'
              }}
              placeholder="Churn Rate"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h4 style={{ color: '#72542b' }}>Retention Rate (%)</h4>
              {cohorts.map((cohort, index) => (
                <div key={cohort} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ minWidth: '40px', color: '#72542b' }}>{cohort}:</span>
                  <input
                    type="number"
                    value={retentionRates[index]}
                    onChange={(e) => updateRetentionValue(index, e.target.value)}
                    style={{
                      padding: '6px',
                      border: '1px solid #d4c4b0',
                      borderRadius: '4px',
                      width: '80px'
                    }}
                  />
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ color: '#72542b' }}>LTV (ZAR)</h4>
              {cohorts.map((cohort, index) => (
                <div key={cohort} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ minWidth: '40px', color: '#72542b' }}>{cohort}:</span>
                  <input
                    type="number"
                    value={ltvValues[index]}
                    onChange={(e) => updateLtvValue(index, e.target.value)}
                    style={{
                      padding: '6px',
                      border: '1px solid #d4c4b0',
                      borderRadius: '4px',
                      width: '80px'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={saveRetentionLTVData}
            style={{
              padding: '8px 16px',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '15px'
            }}
          >
            Save Data
          </button>
        </div>
      )}

      <div style={{ 
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px'
      }}>
        <div style={{ height: '300px' }}>
          <Line 
            data={{
              labels: cohorts,
              datasets: [{
                label: 'Retention Rate (%)',
                data: retentionRates,
                borderColor: '#9c7c5f',
                backgroundColor: 'rgba(156, 124, 95, 0.1)',
                borderWidth: 2,
                tension: 0.1,
                fill: true
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top'
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  title: {
                    display: true,
                    text: 'Retention Rate (%)'
                  }
                }
              }
            }}
          />
        </div>
        <div style={{ height: '300px' }}>
          <Bar 
            data={{
              labels: cohorts,
              datasets: [{
                label: 'LTV (ZAR)',
                data: ltvValues,
                backgroundColor: '#e8ddd4',
                borderColor: '#d4c4b0',
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
                    text: 'LTV (ZAR)'
                  }
                }
              }
            }}
          />
        </div>
      </div>
      <div style={{ 
        backgroundColor: '#f7f3f0',
        padding: '15px',
        borderRadius: '6px',
        marginTop: '20px'
      }}>
        <h3 style={{ color: '#72542b', marginTop: 0 }}>Churn Analysis</h3>
        <p style={{ color: '#5d4037' }}>
          Current churn rate: <strong>{churnRate}%</strong> (Industry average: 12%)
        </p>
      </div>

      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownload={handleDownload}
        availableSections={[
          { id: 'retention-rates', label: 'Retention Rates' },
          { id: 'ltv-values', label: 'LTV Values' },
          { id: 'churn-rate', label: 'Churn Rate' },
          { id: 'summary', label: 'Summary Statistics' }
        ]}
        sectionTitle="Retention & LTV"
      />
    </div>
  );
};

// SalesVelocity Component
const SalesVelocity = ({ activeSection }) => {
  const [velocityData, setVelocityData] = useState([0, 0, 0, 0, 0, 0, 0, 0]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];

  const saveSalesVelocityData = async () => {
    try {
      await setDoc(doc(db, 'sales-velocity', 'main'), { velocityData });
      setShowEditForm(false);
      alert('Sales velocity data saved successfully!');
    } catch (error) {
      console.error('Error saving sales velocity data:', error);
      alert('Error saving data');
    }
  };

  const loadSalesVelocityData = async () => {
    try {
      const docRef = doc(db, 'sales-velocity', 'main');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setVelocityData(docSnap.data().velocityData || [0, 0, 0, 0, 0, 0, 0, 0]);
      }
    } catch (error) {
      console.error('Error loading sales velocity data:', error);
    }
  };

  useEffect(() => {
    loadSalesVelocityData();
  }, []);

  const updateVelocityValue = (index, value) => {
    const newData = [...velocityData];
    newData[index] = parseFloat(value) || 0;
    setVelocityData(newData);
  };

  const handleDownload = (selectedSections) => {
    const currentVelocity = velocityData[velocityData.length - 1] || 0;
    const firstVelocity = velocityData[0] || 0;
    const improvement = firstVelocity > 0 ? firstVelocity - currentVelocity : 0;

    const data = {
      'velocity-data': velocityData,
      'summary': {
        currentVelocity: currentVelocity,
        improvement: improvement,
        averageVelocity: velocityData.length > 0 ? (velocityData.reduce((sum, val) => sum + val, 0) / velocityData.length).toFixed(2) : 0,
        months: months
      }
    };
    downloadData(data, 'sales_velocity', selectedSections);
  };

  if (activeSection !== 'sales-velocity') return null;

  const currentVelocity = velocityData[velocityData.length - 1] || 0;
  const firstVelocity = velocityData[0] || 0;
  const improvement = firstVelocity > 0 ? firstVelocity - currentVelocity : 0;

  return (
    <div style={{ 
      backgroundColor: '#fdfcfb', 
      padding: '20px', 
      margin: '20px 0',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#5d4037', marginTop: 0 }}>Sales Velocity (Days to Close)</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowEditForm(!showEditForm)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#5d4037',
              color: '#fdfcfb',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showEditForm ? 'Cancel' : 'Edit Data'}
          </button>
          <button
            onClick={() => setShowDownloadModal(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Download
          </button>
        </div>
      </div>

      {showEditForm && (
        <div style={{ 
          backgroundColor: '#f7f3f0', 
          padding: '20px', 
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#72542b', marginTop: 0 }}>Edit Sales Velocity Data</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
            {months.map((month, index) => (
              <div key={month} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ color: '#72542b', fontSize: '14px' }}>{month}:</label>
                <input
                  type="number"
                  value={velocityData[index]}
                  onChange={(e) => updateVelocityValue(index, e.target.value)}
                  style={{
                    padding: '6px',
                    border: '1px solid #d4c4b0',
                    borderRadius: '4px'
                  }}
                  placeholder="Days"
                />
              </div>
            ))}
          </div>
          <button
            onClick={saveSalesVelocityData}
            style={{
              padding: '8px 16px',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '15px'
            }}
          >
            Save Data
          </button>
        </div>
      )}

      <div style={{ height: '400px' }}>
        <Line 
          data={{
            labels: months,
            datasets: [{
              label: 'Average Days to Close',
              data: velocityData,
              borderColor: '#9c7c5f',
              backgroundColor: 'rgba(156, 124, 95, 0.1)',
              borderWidth: 2,
              tension: 0.1,
              fill: true
            }]
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top'
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Days'
                }
              }
            }
          }}
        />
      </div>
      <div style={{ 
        backgroundColor: '#f7f3f0',
        padding: '15px',
        borderRadius: '6px',
        marginTop: '20px'
      }}>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px'
        }}>
          <div>
            <h3 style={{ color: '#72542b', marginTop: 0 }}>Current Velocity</h3>
            <p style={{ 
              color: '#5d4037',
              fontSize: '24px',
              fontWeight: 'bold',
              margin: '5px 0'
            }}>{currentVelocity} days</p>
          </div>
          <div>
            <h3 style={{ color: '#72542b', marginTop: 0 }}>Improvement</h3>
            <p style={{ 
              color: improvement > 0 ? '#4CAF50' : '#5d4037',
              fontSize: '24px',
              fontWeight: 'bold',
              margin: '5px 0'
            }}>{improvement > 0 ? '↓' : ''} {Math.abs(improvement)} days</p>
          </div>
          <div>
            <h3 style={{ color: '#72542b', marginTop: 0 }}>Industry Avg</h3>
            <p style={{ 
              color: '#5d4037',
              fontSize: '24px',
              fontWeight: 'bold',
              margin: '5px 0'
            }}>45 days</p>
          </div>
        </div>
      </div>

      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownload={handleDownload}
        availableSections={[
          { id: 'velocity-data', label: 'Sales Velocity Data' },
          { id: 'summary', label: 'Summary Statistics' }
        ]}
        sectionTitle="Sales Velocity"
      />
    </div>
  );
};

// RepeatCustomers Component
const RepeatCustomers = ({ activeSection }) => {
  const [repeatData, setRepeatData] = useState([0, 0, 0, 0, 0]);
  const [churnData, setChurnData] = useState([0, 0, 0, 0, 0]);
  const [loyaltyImpact, setLoyaltyImpact] = useState(0);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const years = ['2019', '2020', '2021', '2022', '2023'];

  const saveRepeatCustomersData = async () => {
    try {
      await setDoc(doc(db, 'repeat-customers', 'main'), { repeatData, churnData, loyaltyImpact });
      setShowEditForm(false);
      alert('Repeat customers data saved successfully!');
    } catch (error) {
      console.error('Error saving repeat customers data:', error);
      alert('Error saving data');
    }
  };

  const loadRepeatCustomersData = async () => {
    try {
      const docRef = doc(db, 'repeat-customers', 'main');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRepeatData(data.repeatData || [0, 0, 0, 0, 0]);
        setChurnData(data.churnData || [0, 0, 0, 0, 0]);
        setLoyaltyImpact(data.loyaltyImpact || 0);
      }
    } catch (error) {
      console.error('Error loading repeat customers data:', error);
    }
  };

  useEffect(() => {
    loadRepeatCustomersData();
  }, []);

  const updateRepeatValue = (index, value) => {
    const newData = [...repeatData];
    newData[index] = parseFloat(value) || 0;
    setRepeatData(newData);
  };

  const updateChurnValue = (index, value) => {
    const newData = [...churnData];
    newData[index] = parseFloat(value) || 0;
    setChurnData(newData);
  };

  const handleDownload = (selectedSections) => {
    const currentRepeatRate = repeatData[repeatData.length - 1] || 0;
    const currentChurnRate = churnData[churnData.length - 1] || 0;

    const data = {
      'repeat-data': repeatData,
      'churn-data': churnData,
      'loyalty-impact': loyaltyImpact,
      'summary': {
        currentRepeatRate: currentRepeatRate,
        currentChurnRate: currentChurnRate,
        loyaltyImpact: loyaltyImpact,
        years: years
      }
    };
    downloadData(data, 'repeat_customers', selectedSections);
  };

  if (activeSection !== 'repeat-customers') return null;

  const currentRepeatRate = repeatData[repeatData.length - 1] || 0;
  const currentChurnRate = churnData[churnData.length - 1] || 0;

  return (
    <div style={{ 
      backgroundColor: '#fdfcfb', 
      padding: '20px', 
      margin: '20px 0',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#5d4037', marginTop: 0 }}>Repeat Customers & Churn Rate</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowEditForm(!showEditForm)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#5d4037',
              color: '#fdfcfb',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showEditForm ? 'Cancel' : 'Edit Data'}
          </button>
          <button
            onClick={() => setShowDownloadModal(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Download
          </button>
        </div>
      </div>

      {showEditForm && (
        <div style={{ 
          backgroundColor: '#f7f3f0', 
          padding: '20px', 
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#72542b', marginTop: 0 }}>Edit Repeat Customers Data</h3>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: '#72542b', display: 'block', marginBottom: '5px' }}>Loyalty Program Impact (%):</label>
            <input
              type="number"
              value={loyaltyImpact}
              onChange={(e) => setLoyaltyImpact(parseFloat(e.target.value) || 0)}
              style={{
                padding: '8px',
                border: '1px solid #d4c4b0',
                borderRadius: '4px',
                width: '120px'
              }}
              placeholder="Impact %"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h4 style={{ color: '#72542b' }}>Repeat Customers (%)</h4>
              {years.map((year, index) => (
                <div key={year} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ minWidth: '50px', color: '#72542b' }}>{year}:</span>
                  <input
                    type="number"
                    value={repeatData[index]}
                    onChange={(e) => updateRepeatValue(index, e.target.value)}
                    style={{
                      padding: '6px',
                      border: '1px solid #d4c4b0',
                      borderRadius: '4px',
                      width: '80px'
                    }}
                  />
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ color: '#72542b' }}>Churn Rate (%)</h4>
              {years.map((year, index) => (
                <div key={year} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ minWidth: '50px', color: '#72542b' }}>{year}:</span>
                  <input
                    type="number"
                    value={churnData[index]}
                    onChange={(e) => updateChurnValue(index, e.target.value)}
                    style={{
                      padding: '6px',
                      border: '1px solid #d4c4b0',
                      borderRadius: '4px',
                      width: '80px'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={saveRepeatCustomersData}
            style={{
              padding: '8px 16px',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '15px'
            }}
          >
            Save Data
          </button>
        </div>
      )}

      <div style={{ height: '400px' }}>
        <Bar 
          data={{
            labels: years,
            datasets: [
              {
                label: '% Repeat Customers',
                data: repeatData,
                backgroundColor: '#9c7c5f',
                borderColor: '#5d4037',
                borderWidth: 1
              },
              {
                label: '% Churn Rate',
                data: churnData,
                backgroundColor: '#F44336',
                borderColor: '#D32F2F',
                borderWidth: 1
              }
            ]
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top'
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Percentage (%)'
                }
              }
            }
          }}
        />
      </div>
      <div style={{ 
        backgroundColor: '#f7f3f0',
        padding: '15px',
        borderRadius: '6px',
        marginTop: '20px'
      }}>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px'
        }}>
          <div>
            <h3 style={{ color: '#72542b', marginTop: 0 }}>Current Repeat Rate</h3>
            <p style={{ 
              color: '#5d4037',
              fontSize: '24px',
              fontWeight: 'bold',
              margin: '5px 0'
            }}>{currentRepeatRate}%</p>
          </div>
          <div>
            <h3 style={{ color: '#72542b', marginTop: 0 }}>Current Churn Rate</h3>
            <p style={{ 
              color: '#F44336',
              fontSize: '24px',
              fontWeight: 'bold',
              margin: '5px 0'
            }}>{currentChurnRate}%</p>
          </div>
          <div>
            <h3 style={{ color: '#72542b', marginTop: 0 }}>Loyalty Program Impact</h3>
            <p style={{ 
              color: '#4CAF50',
              fontSize: '24px',
              fontWeight: 'bold',
              margin: '5px 0'
            }}>+{loyaltyImpact}%</p>
          </div>
        </div>
      </div>

      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownload={handleDownload}
        availableSections={[
          { id: 'repeat-data', label: 'Repeat Customer Data' },
          { id: 'churn-data', label: 'Churn Rate Data' },
          { id: 'loyalty-impact', label: 'Loyalty Program Impact' },
          { id: 'summary', label: 'Summary Statistics' }
        ]}
        sectionTitle="Repeat Customers"
      />
    </div>
  );
};

// Main MarketingSales Component
const MarketingSales = () => {
  const [activeSection, setActiveSection] = useState('new-leads');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
    { id: 'new-leads', label: 'New Leads' },
    { id: 'lead-source-analysis', label: 'Lead Source' },
    { id: 'cost-per-lead', label: 'Cost/Lead' },
    { id: 'customer-acquisition-cost', label: 'CAC' },
    { id: 'campaign-roi', label: 'Campaign ROI' },
    { id: 'conversion-rate', label: 'Conversion' },
    { id: 'retention-ltv', label: 'Retention/LTV' },
    { id: 'sales-velocity', label: 'Sales Velocity' },
    { id: 'repeat-customers', label: 'Repeat/Churn' }
  ];

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
                  minWidth: '100px',
                  textAlign: 'center',
                  flexShrink: 0
                }}
              >
                {button.label}
              </button>
            ))}
          </div>

          <NewLeads activeSection={activeSection} />
          <LeadSourceAnalysis activeSection={activeSection} />
          <CostPerLead activeSection={activeSection} />
          <CustomerAcquisitionCost activeSection={activeSection} />
          <CampaignROI activeSection={activeSection} />
          <ConversionRate activeSection={activeSection} />
          <RetentionLTV activeSection={activeSection} />
          <SalesVelocity activeSection={activeSection} />
          <RepeatCustomers activeSection={activeSection} />
        </div>
      </div>
    </div>
  );
};

export default MarketingSales;