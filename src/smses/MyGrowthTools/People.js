import React, { useState, useEffect } from 'react';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import Sidebar from 'smses/Sidebar/Sidebar';
import Header from '../DashboardHeader/DashboardHeader';
import { db, auth } from '../../firebaseConfig'; // Import auth as well
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Enhanced Dark Brown Color Palette
const DARK_BROWN_COLORS = {
  primary: '#3E2723',      // Very dark brown
  secondary: '#5D4037',    // Dark brown
  tertiary: '#6D4C41',     // Medium dark brown
  accent1: '#795548',      // Brown
  accent2: '#8D6E63',      // Light brown
  accent3: '#A1887F',      // Lighter brown
  accent4: '#BCAAA4',      // Very light brown
  complement1: '#D84315',  // Dark orange-red
  complement2: '#FF5722',  // Orange-red
  complement3: '#FF7043',  // Light orange-red
  complement4: '#FF8A65',  // Very light orange-red
  success: '#2E7D32',      // Dark green
  warning: '#F57C00',      // Dark orange
  error: '#C62828'         // Dark red
};

// Data Entry Modal Component
const DataEntryModal = ({ isOpen, onClose, section, onSave, currentData }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (currentData) {
      setFormData(currentData);
    }
  }, [currentData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const renderFormFields = () => {
    switch (section) {
      case 'employee-composition':
        return (
          <>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: DARK_BROWN_COLORS.secondary, fontWeight: 'bold' }}>Head Count:</label>
              <input
                type="number"
                value={formData.headCount || ''}
                onChange={(e) => setFormData({...formData, headCount: parseInt(e.target.value) || 0})}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `2px solid ${DARK_BROWN_COLORS.accent3}`, fontSize: '14px' }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '10px', color: DARK_BROWN_COLORS.secondary, fontWeight: 'bold' }}>Occupational Levels:</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input
                  type="number"
                  placeholder="Unskilled"
                  value={formData.unskilled || ''}
                  onChange={(e) => setFormData({...formData, unskilled: parseInt(e.target.value) || 0})}
                  style={{ padding: '8px', borderRadius: '4px', border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
                <input
                  type="number"
                  placeholder="Semi-skilled"
                  value={formData.semiSkilled || ''}
                  onChange={(e) => setFormData({...formData, semiSkilled: parseInt(e.target.value) || 0})}
                  style={{ padding: '8px', borderRadius: '4px', border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
                <input
                  type="number"
                  placeholder="Skilled & Jnr Mgt"
                  value={formData.skilledJnr || ''}
                  onChange={(e) => setFormData({...formData, skilledJnr: parseInt(e.target.value) || 0})}
                  style={{ padding: '8px', borderRadius: '4px', border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
                <input
                  type="number"
                  placeholder="Professionals & Mid Mgt"
                  value={formData.profMid || ''}
                  onChange={(e) => setFormData({...formData, profMid: parseInt(e.target.value) || 0})}
                  style={{ padding: '8px', borderRadius: '4px', border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
                <input
                  type="number"
                  placeholder="Snr Mgt"
                  value={formData.snrMgt || ''}
                  onChange={(e) => setFormData({...formData, snrMgt: parseInt(e.target.value) || 0})}
                  style={{ padding: '8px', borderRadius: '4px', border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
                <input
                  type="number"
                  placeholder="Top Mgt"
                  value={formData.topMgt || ''}
                  onChange={(e) => setFormData({...formData, topMgt: parseInt(e.target.value) || 0})}
                  style={{ padding: '8px', borderRadius: '4px', border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '10px', color: DARK_BROWN_COLORS.secondary, fontWeight: 'bold' }}>Demographics (%):</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input
                  type="number"
                  placeholder="Female %"
                  value={formData.femalePercent || ''}
                  onChange={(e) => setFormData({...formData, femalePercent: parseInt(e.target.value) || 0})}
                  style={{ padding: '8px', borderRadius: '4px', border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
                <input
                  type="number"
                  placeholder="Permanent %"
                  value={formData.permanentPercent || ''}
                  onChange={(e) => setFormData({...formData, permanentPercent: parseInt(e.target.value) || 0})}
                  style={{ padding: '8px', borderRadius: '4px', border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
                <input
                  type="number"
                  placeholder="Local %"
                  value={formData.localPercent || ''}
                  onChange={(e) => setFormData({...formData, localPercent: parseInt(e.target.value) || 0})}
                  style={{ padding: '8px', borderRadius: '4px', border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
                <input
                  type="number"
                  placeholder="African %"
                  value={formData.africanPercent || ''}
                  onChange={(e) => setFormData({...formData, africanPercent: parseInt(e.target.value) || 0})}
                  style={{ padding: '8px', borderRadius: '4px', border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
                <input
                  type="number"
                  placeholder="Colored %"
                  value={formData.coloredPercent || ''}
                  onChange={(e) => setFormData({...formData, coloredPercent: parseInt(e.target.value) || 0})}
                  style={{ padding: '8px', borderRadius: '4px', border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
                <input
                  type="number"
                  placeholder="Indian %"
                  value={formData.indianPercent || ''}
                  onChange={(e) => setFormData({...formData, indianPercent: parseInt(e.target.value) || 0})}
                  style={{ padding: '8px', borderRadius: '4px', border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
              </div>
            </div>
          </>
        );
      case 'turnover-rate':
        return (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', color: DARK_BROWN_COLORS.secondary, fontWeight: 'bold' }}>Select Year and Date Range:</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', color: DARK_BROWN_COLORS.tertiary, fontSize: '14px' }}>Year:</label>
                  <select
                    value={formData.selectedYear || new Date().getFullYear()}
                    onChange={(e) => setFormData({...formData, selectedYear: parseInt(e.target.value)})}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                  >
                    {Array.from({length: 10}, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', color: DARK_BROWN_COLORS.tertiary, fontSize: '14px' }}>Start Month:</label>
                  <select
                    value={formData.startMonth || 'Jan'}
                    onChange={(e) => setFormData({...formData, startMonth: e.target.value})}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                  >
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', color: DARK_BROWN_COLORS.tertiary, fontSize: '14px' }}>End Month:</label>
                  <select
                    value={formData.endMonth || 'Dec'}
                    onChange={(e) => setFormData({...formData, endMonth: e.target.value})}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                  >
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '10px', color: DARK_BROWN_COLORS.secondary, fontWeight: 'bold' }}>
                Workforce Movements ({formData.startMonth || 'Jan'} - {formData.endMonth || 'Dec'} {formData.selectedYear || new Date().getFullYear()}):
              </label>
              {(() => {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const startIdx = months.indexOf(formData.startMonth || 'Jan');
                const endIdx = months.indexOf(formData.endMonth || 'Dec');
                const selectedMonths = startIdx <= endIdx 
                  ? months.slice(startIdx, endIdx + 1)
                  : [...months.slice(startIdx), ...months.slice(0, endIdx + 1)];
                
                return selectedMonths.map((month) => (
                  <div key={month} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'center' }}>
                    <span style={{ width: '50px', color: DARK_BROWN_COLORS.secondary, fontWeight: 'bold' }}>{month}:</span>
                    <input
                      type="number"
                      placeholder="New Engagements"
                      value={formData[`${month.toLowerCase()}New`] || ''}
                      onChange={(e) => setFormData({...formData, [`${month.toLowerCase()}New`]: parseInt(e.target.value) || 0})}
                      style={{ flex: 1, padding: '6px', borderRadius: '4px', border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                    />
                    <input
                      type="number"
                      placeholder="Terminations"
                      value={formData[`${month.toLowerCase()}Term`] || ''}
                      onChange={(e) => setFormData({...formData, [`${month.toLowerCase()}Term`]: parseInt(e.target.value) || 0})}
                      style={{ flex: 1, padding: '6px', borderRadius: '4px', border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                    />
                  </div>
                ));
              })()}
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '10px', color: DARK_BROWN_COLORS.secondary, fontWeight: 'bold' }}>Reasons for Terminations (%):</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input
                  type="number"
                  placeholder="Resigned %"
                  value={formData.resignedPercent || ''}
                  onChange={(e) => setFormData({...formData, resignedPercent: parseInt(e.target.value) || 0})}
                  style={{ padding: '8px', borderRadius: '4px', border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
                <input
                  type="number"
                  placeholder="Dismissed %"
                  value={formData.dismissedPercent || ''}
                  onChange={(e) => setFormData({...formData, dismissedPercent: parseInt(e.target.value) || 0})}
                  style={{ padding: '8px', borderRadius: '4px', border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
                <input
                  type="number"
                  placeholder="EoC %"
                  value={formData.eocPercent || ''}
                  onChange={(e) => setFormData({...formData, eocPercent: parseInt(e.target.value) || 0})}
                  style={{ padding: '8px', borderRadius: '4px', border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
                <input
                  type="number"
                  placeholder="Deceased %"
                  value={formData.deceasedPercent || ''}
                  onChange={(e) => setFormData({...formData, deceasedPercent: parseInt(e.target.value) || 0})}
                  style={{ padding: '8px', borderRadius: '4px', border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
                <input
                  type="number"
                  placeholder="Desertion %"
                  value={formData.desertionPercent || ''}
                  onChange={(e) => setFormData({...formData, desertionPercent: parseInt(e.target.value) || 0})}
                  style={{ padding: '8px', borderRadius: '4px', border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
                <input
                  type="number"
                  placeholder="Retrenched %"
                  value={formData.retrenchedPercent || ''}
                  onChange={(e) => setFormData({...formData, retrenchedPercent: parseInt(e.target.value) || 0})}
                  style={{ padding: '8px', borderRadius: '4px', border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
                <input
                  type="number"
                  placeholder="VSP %"
                  value={formData.vspPercent || ''}
                  onChange={(e) => setFormData({...formData, vspPercent: parseInt(e.target.value) || 0})}
                  style={{ padding: '8px', borderRadius: '4px', border: `2px solid ${DARK_BROWN_COLORS.accent3}` }}
                />
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: `rgba(62, 39, 35, 0.8)`,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#fdfcfb',
        padding: '30px',
        borderRadius: '12px',
        maxWidth: '700px',
        maxHeight: '85vh',
        overflow: 'auto',
        width: '90%',
        boxShadow: `0 10px 25px rgba(62, 39, 35, 0.4)`,
        border: `2px solid ${DARK_BROWN_COLORS.accent3}`
      }}>
        <h3 style={{ color: DARK_BROWN_COLORS.secondary, marginTop: 0, fontSize: '24px', textAlign: 'center' }}>
          {section === 'employee-composition' ? 'Enter Employee Composition Data' : 'Enter Turnover Data'}
        </h3>
        <form onSubmit={handleSubmit}>
          {renderFormFields()}
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '25px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 25px',
                backgroundColor: DARK_BROWN_COLORS.accent4,
                color: DARK_BROWN_COLORS.secondary,
                border: `2px solid ${DARK_BROWN_COLORS.accent3}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '12px 25px',
                backgroundColor: DARK_BROWN_COLORS.secondary,
                color: '#fdfcfb',
                border: `2px solid ${DARK_BROWN_COLORS.secondary}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              Save Data
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Enhanced Employee Composition Component
const EmployeeComposition = ({ activeSection, userData, onOpenModal }) => {
  if (activeSection !== 'employee-composition') return null;

  // Default data when no user data is available
  const defaultData = {
    headCount: 0,
    unskilled: 0,
    semiSkilled: 0,
    skilledJnr: 0,
    profMid: 0,
    snrMgt: 0,
    topMgt: 0,
    femalePercent: 0,
    permanentPercent: 0,
    localPercent: 0,
    africanPercent: 0,
    coloredPercent: 0,
    indianPercent: 0
  };

  const data = { ...defaultData, ...userData };

  const occupationalData = {
    labels: ['Unskilled', 'Semi-skilled', 'Skilled & Jnr Mgt', 'Professionals & Mid-Mgt', 'Snr Mgt', 'Top Mgt'],
    datasets: [{
      label: 'Count',
      data: [data.unskilled, data.semiSkilled, data.skilledJnr, data.profMid, data.snrMgt, data.topMgt],
      backgroundColor: [
        DARK_BROWN_COLORS.primary,
        DARK_BROWN_COLORS.secondary,
        DARK_BROWN_COLORS.tertiary,
        DARK_BROWN_COLORS.accent1,
        DARK_BROWN_COLORS.accent2,
        DARK_BROWN_COLORS.accent3
      ],
      borderColor: DARK_BROWN_COLORS.primary,
      borderWidth: 2
    }]
  };

  const genderData = {
    labels: ['Female', 'Male'],
    datasets: [{
      data: [data.femalePercent, 100 - data.femalePercent],
      backgroundColor: [DARK_BROWN_COLORS.secondary, DARK_BROWN_COLORS.accent3],
      borderColor: DARK_BROWN_COLORS.primary,
      borderWidth: 2
    }]
  };

  const contractData = {
    labels: ['Permanent', 'Contractor'],
    datasets: [{
      data: [data.permanentPercent, 100 - data.permanentPercent],
      backgroundColor: [DARK_BROWN_COLORS.tertiary, DARK_BROWN_COLORS.accent2],
      borderColor: DARK_BROWN_COLORS.primary,
      borderWidth: 2
    }]
  };

  const localityData = {
    labels: ['Local', 'Foreign'],
    datasets: [{
      data: [data.localPercent, 100 - data.localPercent],
      backgroundColor: [DARK_BROWN_COLORS.secondary, DARK_BROWN_COLORS.accent4],
      borderColor: DARK_BROWN_COLORS.primary,
      borderWidth: 2
    }]
  };

  const eapData = {
    labels: ['African', 'Colored', 'Indian', 'White'],
    datasets: [{
      data: [
        data.africanPercent,
        data.coloredPercent,
        data.indianPercent,
        100 - (data.africanPercent + data.coloredPercent + data.indianPercent)
      ],
      backgroundColor: [
        DARK_BROWN_COLORS.primary,
        DARK_BROWN_COLORS.secondary,
        DARK_BROWN_COLORS.tertiary,
        DARK_BROWN_COLORS.accent1
      ],
      borderColor: DARK_BROWN_COLORS.primary,
      borderWidth: 2
    }]
  };

  return (
    <div style={{ 
      backgroundColor: '#fdfcfb', 
      padding: '25px', 
      margin: '20px 0',
      borderRadius: '12px',
      boxShadow: `0 4px 12px rgba(62, 39, 35, 0.15)`,
      border: `1px solid ${DARK_BROWN_COLORS.accent4}`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: DARK_BROWN_COLORS.secondary, margin: 0, fontSize: '28px' }}>Employee Composition</h2>
        <button
          onClick={() => onOpenModal('employee-composition')}
          style={{
            padding: '12px 20px',
            backgroundColor: DARK_BROWN_COLORS.secondary,
            color: '#fdfcfb',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          📝 Enter Data
        </button>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '25px',
        marginTop: '25px'
      }}>
        {/* Head Count */}
        <div style={{ 
          backgroundColor: '#f7f3f0', 
          padding: '25px', 
          borderRadius: '12px',
          textAlign: 'center',
          border: `2px solid ${DARK_BROWN_COLORS.accent4}`
        }}>
          <h3 style={{ color: DARK_BROWN_COLORS.tertiary, margin: '0 0 20px 0', fontSize: '18px' }}>Head Count</h3>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${DARK_BROWN_COLORS.secondary}, ${DARK_BROWN_COLORS.tertiary})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            color: '#fdfcfb',
            fontSize: '32px',
            fontWeight: 'bold',
            boxShadow: '0 6px 12px rgba(62, 39, 35, 0.3)'
          }}>
            {data.headCount}
          </div>
        </div>

        {/* Occupational Levels */}
        <div style={{ 
          backgroundColor: '#f7f3f0', 
          padding: '25px', 
          borderRadius: '12px',
          border: `2px solid ${DARK_BROWN_COLORS.accent4}`
        }}>
          <h3 style={{ color: DARK_BROWN_COLORS.tertiary, margin: '0 0 20px 0', fontSize: '18px' }}>Occupational Levels</h3>
          <div style={{ height: '200px' }}>
            <Bar 
              data={occupationalData}
              options={{
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  x: {
                    beginAtZero: true,
                    grid: {
                      color: DARK_BROWN_COLORS.accent4
                    },
                    ticks: {
                      color: DARK_BROWN_COLORS.secondary
                    }
                  },
                  y: {
                    grid: {
                      display: false
                    },
                    ticks: {
                      color: DARK_BROWN_COLORS.secondary
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Gender */}
        <div style={{ 
          backgroundColor: '#f7f3f0', 
          padding: '25px', 
          borderRadius: '12px',
          textAlign: 'center',
          border: `2px solid ${DARK_BROWN_COLORS.accent4}`
        }}>
          <h3 style={{ color: DARK_BROWN_COLORS.tertiary, margin: '0 0 20px 0', fontSize: '18px' }}>Gender</h3>
          <div style={{ height: '150px' }}>
            <Doughnut 
              data={genderData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      color: DARK_BROWN_COLORS.secondary,
                      font: {
                        weight: 'bold'
                      }
                    }
                  }
                }
              }}
            />
          </div>
          <div style={{ marginTop: '15px', fontSize: '14px', color: DARK_BROWN_COLORS.tertiary, fontWeight: 'bold' }}>
            {data.femalePercent}% Female • {100 - data.femalePercent}% Male
          </div>
        </div>

        {/* Contract Type */}
        <div style={{ 
          backgroundColor: '#f7f3f0', 
          padding: '25px', 
          borderRadius: '12px',
          textAlign: 'center',
          border: `2px solid ${DARK_BROWN_COLORS.accent4}`
        }}>
          <h3 style={{ color: DARK_BROWN_COLORS.tertiary, margin: '0 0 20px 0', fontSize: '18px' }}>Contract Type</h3>
          <div style={{ height: '150px' }}>
            <Doughnut 
              data={contractData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      color: DARK_BROWN_COLORS.secondary,
                      font: {
                        weight: 'bold'
                      }
                    }
                  }
                }
              }}
            />
          </div>
          <div style={{ marginTop: '15px', fontSize: '14px', color: DARK_BROWN_COLORS.tertiary, fontWeight: 'bold' }}>
            {data.permanentPercent}% Permanent • {100 - data.permanentPercent}% Contractor
          </div>
        </div>

        {/* Locality */}
        <div style={{ 
          backgroundColor: '#f7f3f0', 
          padding: '25px', 
          borderRadius: '12px',
          textAlign: 'center',
          border: `2px solid ${DARK_BROWN_COLORS.accent4}`
        }}>
          <h3 style={{ color: DARK_BROWN_COLORS.tertiary, margin: '0 0 20px 0', fontSize: '18px' }}>Locality</h3>
          <div style={{ height: '150px' }}>
            <Doughnut 
              data={localityData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      color: DARK_BROWN_COLORS.secondary,
                      font: {
                        weight: 'bold'
                      }
                    }
                  }
                }
              }}
            />
          </div>
          <div style={{ marginTop: '15px', fontSize: '14px', color: DARK_BROWN_COLORS.tertiary, fontWeight: 'bold' }}>
            {data.localPercent}% Local • {100 - data.localPercent}% Foreign
          </div>
        </div>

        {/* EAP % */}
        <div style={{ 
          backgroundColor: '#f7f3f0', 
          padding: '25px', 
          borderRadius: '12px',
          textAlign: 'center',
          border: `2px solid ${DARK_BROWN_COLORS.accent4}`
        }}>
          <h3 style={{ color: DARK_BROWN_COLORS.tertiary, margin: '0 0 20px 0', fontSize: '18px' }}>EAP %</h3>
          <div style={{ height: '150px' }}>
            <Doughnut 
              data={eapData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      color: DARK_BROWN_COLORS.secondary,
                      font: {
                        size: 11,
                        weight: 'bold'
                      }
                    }
                  }
                }
              }}
            />
          </div>
          <div style={{ marginTop: '15px', fontSize: '12px', color: DARK_BROWN_COLORS.tertiary, fontWeight: 'bold' }}>
            {data.africanPercent}% African • {data.coloredPercent}% Colored • {data.indianPercent}% Indian
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Turnover Rate Component
const TurnoverRate = ({ activeSection, turnoverData, onOpenModal }) => {
  if (activeSection !== 'turnover-rate') return null;

  const defaultTurnoverData = {
    selectedYear: new Date().getFullYear(),
    startMonth: 'Jan',
    endMonth: 'Dec',
    janNew: 0, febNew: 0, marNew: 0, aprNew: 0, mayNew: 0, junNew: 0, julNew: 0, augNew: 0, sepNew: 0, octNew: 0, novNew: 0, decNew: 0,
    janTerm: 0, febTerm: 0, marTerm: 0, aprTerm: 0, mayTerm: 0, junTerm: 0, julTerm: 0, augTerm: 0, sepTerm: 0, octTerm: 0, novTerm: 0, decTerm: 0,
    resignedPercent: 0, dismissedPercent: 0, eocPercent: 0, deceasedPercent: 0,
    desertionPercent: 0, retrenchedPercent: 0, vspPercent: 0
  };

  const data = { ...defaultTurnoverData, ...turnoverData };

  // Generate months based on selected range
  const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const startIdx = allMonths.indexOf(data.startMonth);
  const endIdx = allMonths.indexOf(data.endMonth);
  const selectedMonths = startIdx <= endIdx 
    ? allMonths.slice(startIdx, endIdx + 1)
    : [...allMonths.slice(startIdx), ...allMonths.slice(0, endIdx + 1)];

  const monthLabels = selectedMonths.map(month => `${month}-${data.selectedYear.toString().slice(-2)}`);
  
  const workforceData = {
    labels: monthLabels,
    datasets: [
      {
        label: 'New Engagements',
        data: selectedMonths.map(month => data[`${month.toLowerCase()}New`] || 0),
        backgroundColor: DARK_BROWN_COLORS.success,
        borderColor: '#1B5E20',
        borderWidth: 2
      },
      {
        label: 'Terminations',
        data: selectedMonths.map(month => data[`${month.toLowerCase()}Term`] || 0),
        backgroundColor: DARK_BROWN_COLORS.error,
        borderColor: '#B71C1C',
        borderWidth: 2
      }
    ]
  };

  const terminationReasonsData = {
    labels: ['Resigned', 'Dismissed', 'EoC', 'Deceased', 'Desertion', 'Retrenched', 'VSP'],
    datasets: [{
      data: [
        data.resignedPercent, data.dismissedPercent, data.eocPercent, 
        data.deceasedPercent, data.desertionPercent, data.retrenchedPercent, data.vspPercent
      ],
      backgroundColor: [
        DARK_BROWN_COLORS.primary,
        DARK_BROWN_COLORS.complement1,
        DARK_BROWN_COLORS.secondary,
        DARK_BROWN_COLORS.complement2,
        DARK_BROWN_COLORS.tertiary,
        DARK_BROWN_COLORS.accent1,
        DARK_BROWN_COLORS.accent2
      ],
      borderColor: DARK_BROWN_COLORS.primary,
      borderWidth: 2
    }]
  };

  return (
    <div style={{ 
      backgroundColor: '#fdfcfb', 
      padding: '25px', 
      margin: '20px 0',
      borderRadius: '12px',
      boxShadow: `0 4px 12px rgba(62, 39, 35, 0.15)`,
      border: `1px solid ${DARK_BROWN_COLORS.accent4}`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h2 style={{ color: DARK_BROWN_COLORS.secondary, margin: 0, fontSize: '28px' }}>Turnover</h2>
        <button
          onClick={() => onOpenModal('turnover-rate')}
          style={{
            padding: '12px 20px',
            backgroundColor: DARK_BROWN_COLORS.tertiary,
            color: '#fdfcfb',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          📊 Enter Data
        </button>
      </div>

      {/* Date Range Display */}
      <div style={{ 
        backgroundColor: '#f7f3f0', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '25px',
        border: `1px solid ${DARK_BROWN_COLORS.accent4}`,
        textAlign: 'center'
      }}>
        <h4 style={{ color: DARK_BROWN_COLORS.tertiary, margin: 0, fontSize: '16px' }}>
          📅 Current Period: {data.startMonth} - {data.endMonth} {data.selectedYear}
        </h4>
      </div>
      
      {/* Workforce Movements */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ color: DARK_BROWN_COLORS.tertiary, fontSize: '20px', marginBottom: '20px' }}>Workforce Movements</h3>
        <div style={{ 
          height: '400px', 
          backgroundColor: '#f7f3f0', 
          padding: '20px', 
          borderRadius: '12px',
          border: `2px solid ${DARK_BROWN_COLORS.accent4}`
        }}>
          <Bar 
            data={workforceData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: {
                  stacked: false,
                  grid: {
                    color: DARK_BROWN_COLORS.accent4
                  },
                  ticks: {
                    color: DARK_BROWN_COLORS.secondary
                  }
                },
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Number of Employees',
                    color: DARK_BROWN_COLORS.secondary,
                    font: {
                      weight: 'bold'
                    }
                  },
                  grid: {
                    color: DARK_BROWN_COLORS.accent4
                  },
                  ticks: {
                    color: DARK_BROWN_COLORS.secondary
                  }
                }
              },
              plugins: {
                legend: {
                  position: 'top',
                  labels: {
                    color: DARK_BROWN_COLORS.secondary,
                    font: {
                      weight: 'bold'
                    }
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Reasons for Terminations */}
      <div>
        <h3 style={{ color: DARK_BROWN_COLORS.tertiary, fontSize: '20px', marginBottom: '20px' }}>Reasons for Terminations</h3>
        <div style={{ 
          height: '400px', 
          maxWidth: '600px',
          backgroundColor: '#f7f3f0', 
          padding: '20px', 
          borderRadius: '12px',
          border: `2px solid ${DARK_BROWN_COLORS.accent4}`
        }}>
          <Pie 
            data={terminationReasonsData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right',
                  labels: {
                    color: DARK_BROWN_COLORS.secondary,
                    font: {
                      weight: 'bold'
                    }
                  }
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

// EmployeeCost Component
const EmployeeCost = ({ activeSection }) => {
  if (activeSection !== 'employee-cost') return null;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const costData = [28, 27, 29, 28, 27, 26];
  const turnoverData = [100, 105, 110, 115, 120, 125];

  return (
    <div style={{ 
      backgroundColor: '#fdfcfb', 
      padding: '20px', 
      margin: '20px 0',
      borderRadius: '8px',
      boxShadow: `0 2px 4px rgba(62, 39, 35, 0.1)`
    }}>
      <h2 style={{ color: DARK_BROWN_COLORS.secondary, marginTop: 0 }}>Employee Costs as % of Turnover</h2>
      <div style={{ height: '400px' }}>
        <Line 
          data={{
            labels: months,
            datasets: [
              {
                label: 'Employee Cost %',
                data: costData,
                borderColor: DARK_BROWN_COLORS.secondary,
                backgroundColor: `rgba(93, 64, 55, 0.1)`,
                borderWidth: 3,
                tension: 0.1,
                yAxisID: 'y'
              },
              {
                label: 'Turnover (index)',
                data: turnoverData,
                borderColor: DARK_BROWN_COLORS.tertiary,
                backgroundColor: `rgba(109, 76, 65, 0.1)`,
                borderWidth: 3,
                tension: 0.1,
                yAxisID: 'y1'
              }
            ]
          }}
          options={{
            responsive: true,
            interaction: {
              mode: 'index',
              intersect: false,
            },
            scales: {
              y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                  display: true,
                  text: 'Cost %',
                  color: DARK_BROWN_COLORS.secondary
                },
                ticks: {
                  color: DARK_BROWN_COLORS.secondary
                }
              },
              y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                  display: true,
                  text: 'Turnover Index',
                  color: DARK_BROWN_COLORS.secondary
                },
                grid: {
                  drawOnChartArea: false,
                },
                ticks: {
                  color: DARK_BROWN_COLORS.secondary
                }
              },
              x: {
                ticks: {
                  color: DARK_BROWN_COLORS.secondary
                }
              }
            },
            plugins: {
              legend: {
                labels: {
                  color: DARK_BROWN_COLORS.secondary
                }
              }
            }
          }}
        />
      </div>
    </div>
  );
};

// ProductivityMetrics Component
const ProductivityMetrics = ({ activeSection }) => {
  if (activeSection !== 'productivity-metrics') return null;

  const metrics = [
    { name: 'Revenue per Employee', current: 125000, target: 150000 },
    { name: 'Output per Employee', current: 85, target: 100 },
    { name: 'Utilization Rate', current: 72, target: 80 }
  ];

  return (
    <div style={{ 
      backgroundColor: '#fdfcfb', 
      padding: '20px', 
      margin: '20px 0',
      borderRadius: '8px',
      boxShadow: `0 2px 4px rgba(62, 39, 35, 0.1)`
    }}>
      <h2 style={{ color: DARK_BROWN_COLORS.secondary, marginTop: 0 }}>Productivity Metrics</h2>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {metrics.map((metric, index) => (
          <div key={index} style={{ 
            padding: '15px', 
            backgroundColor: '#f7f3f0', 
            borderRadius: '6px',
            border: `1px solid ${DARK_BROWN_COLORS.accent4}`
          }}>
            <h3 style={{ color: DARK_BROWN_COLORS.tertiary, marginTop: 0 }}>{metric.name}</h3>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '15px'
            }}>
              <div>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: DARK_BROWN_COLORS.secondary }}>
                  {metric.current.toLocaleString()}
                  {typeof metric.current === 'number' && metric.name === 'Utilization Rate' ? '%' : ''}
                </span>
                <span style={{ display: 'block', color: DARK_BROWN_COLORS.tertiary, fontSize: '14px' }}>
                  Current
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: DARK_BROWN_COLORS.tertiary }}>
                  Target: {metric.target.toLocaleString()}
                  {typeof metric.target === 'number' && metric.name === 'Utilization Rate' ? '%' : ''}
                </span>
                <div style={{ 
                  height: '6px', 
                  backgroundColor: DARK_BROWN_COLORS.accent4,
                  marginTop: '5px',
                  borderRadius: '3px'
                }}>
                  <div style={{ 
                    width: `${Math.min(100, (metric.current / metric.target) * 100)}%`, 
                    height: '100%',
                    backgroundColor: metric.current >= metric.target ? DARK_BROWN_COLORS.success : DARK_BROWN_COLORS.warning,
                    borderRadius: '3px'
                  }}></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ShareholderBreakdown Component
const ShareholderBreakdown = ({ activeSection, shareholderData }) => {
  if (activeSection !== 'shareholder-breakdown') return null;

  const mainShareholderData = {
    labels: ['Founders', 'Employees', 'Investors', 'Public'],
    datasets: [{
      data: [35, 15, 40, 10],
      backgroundColor: [
        DARK_BROWN_COLORS.primary,
        DARK_BROWN_COLORS.secondary,
        DARK_BROWN_COLORS.tertiary,
        DARK_BROWN_COLORS.accent1
      ],
      borderColor: DARK_BROWN_COLORS.primary,
      borderWidth: 2
    }]
  };

  // Process the shareholder data for the additional charts
  const genderData = {
    labels: ['Male', 'Female', 'Other'],
    datasets: [{
      data: shareholderData.gender || [60, 35, 5],
      backgroundColor: [DARK_BROWN_COLORS.primary, DARK_BROWN_COLORS.secondary, DARK_BROWN_COLORS.tertiary],
      borderColor: DARK_BROWN_COLORS.primary,
      borderWidth: 2
    }]
  };

  const raceData = {
    labels: ['Black', 'White', 'Colored', 'Indian/Asian', 'Other'],
    datasets: [{
      data: shareholderData.race || [40, 30, 15, 10, 5],
      backgroundColor: [
        DARK_BROWN_COLORS.primary,
        DARK_BROWN_COLORS.secondary,
        DARK_BROWN_COLORS.tertiary,
        DARK_BROWN_COLORS.accent1,
        DARK_BROWN_COLORS.accent2
      ],
      borderColor: DARK_BROWN_COLORS.primary,
      borderWidth: 2
    }]
  };

  const nationalityData = {
    labels: ['South African', 'Other African', 'European', 'Asian', 'American', 'Other'],
    datasets: [{
      data: shareholderData.nationality || [70, 10, 8, 7, 3, 2],
      backgroundColor: [
        DARK_BROWN_COLORS.primary,
        DARK_BROWN_COLORS.secondary,
        DARK_BROWN_COLORS.tertiary,
        DARK_BROWN_COLORS.accent1,
        DARK_BROWN_COLORS.accent2,
        DARK_BROWN_COLORS.accent3
      ],
      borderColor: DARK_BROWN_COLORS.primary,
      borderWidth: 2
    }]
  };

  const youthData = {
    labels: ['Youth', 'Non-Youth'],
    datasets: [{
      data: shareholderData.youth || [25, 75],
      backgroundColor: [DARK_BROWN_COLORS.primary, DARK_BROWN_COLORS.secondary],
      borderColor: DARK_BROWN_COLORS.primary,
      borderWidth: 2
    }]
  };

  const disabilityData = {
    labels: ['Disabled', 'Not Disabled'],
    datasets: [{
      data: shareholderData.disability || [8, 92],
      backgroundColor: [DARK_BROWN_COLORS.primary, DARK_BROWN_COLORS.secondary],
      borderColor: DARK_BROWN_COLORS.primary,
      borderWidth: 2
    }]
  };

  return (
    <div style={{ 
      backgroundColor: '#fdfcfb', 
      padding: '20px', 
      margin: '20px 0',
      borderRadius: '8px',
      boxShadow: `0 2px 4px rgba(62, 39, 35, 0.1)`
    }}>
      <h2 style={{ color: DARK_BROWN_COLORS.secondary, marginTop: 0 }}>Shareholder Breakdown</h2>
      <div style={{ height: '400px' }}>
        <Doughnut 
          data={mainShareholderData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  color: DARK_BROWN_COLORS.secondary
                }
              }
            }
          }}
        />
      </div>
      
      <h3 style={{ color: DARK_BROWN_COLORS.secondary, marginTop: '30px' }}>Shareholder Demographics</h3>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginTop: '20px'
      }}>
        {/* Gender Chart */}
        <div style={{ 
          backgroundColor: '#f7f3f0', 
          padding: '15px', 
          borderRadius: '8px',
          textAlign: 'center',
          border: `1px solid ${DARK_BROWN_COLORS.accent4}`
        }}>
          <h4 style={{ color: DARK_BROWN_COLORS.tertiary, margin: '0 0 10px 0' }}>Gender</h4>
          <div style={{ height: '150px' }}>
            <Doughnut 
              data={genderData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                }
              }}
            />
          </div>
          <div style={{ marginTop: '10px', fontSize: '12px', color: DARK_BROWN_COLORS.tertiary }}>
            {genderData.labels.map((label, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '2px 0' }}>
                <div style={{ 
                  width: '10px', 
                  height: '10px', 
                  backgroundColor: genderData.datasets[0].backgroundColor[i],
                  marginRight: '5px',
                  borderRadius: '2px'
                }}></div>
                {label}: {genderData.datasets[0].data[i]}%
              </div>
            ))}
          </div>
        </div>

        {/* Race Chart */}
        <div style={{ 
          backgroundColor: '#f7f3f0', 
          padding: '15px', 
          borderRadius: '8px',
          textAlign: 'center',
          border: `1px solid ${DARK_BROWN_COLORS.accent4}`
        }}>
          <h4 style={{ color: DARK_BROWN_COLORS.tertiary, margin: '0 0 10px 0' }}>Race</h4>
          <div style={{ height: '150px' }}>
            <Doughnut 
              data={raceData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                }
              }}
            />
          </div>
          <div style={{ marginTop: '10px', fontSize: '12px', color: DARK_BROWN_COLORS.tertiary }}>
            {raceData.labels.map((label, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '2px 0' }}>
                <div style={{ 
                  width: '10px', 
                  height: '10px', 
                  backgroundColor: raceData.datasets[0].backgroundColor[i],
                  marginRight: '5px',
                  borderRadius: '2px'
                }}></div>
                {label}: {raceData.datasets[0].data[i]}%
              </div>
            ))}
          </div>
        </div>

        {/* Nationality Chart */}
        <div style={{ 
          backgroundColor: '#f7f3f0', 
          padding: '15px', 
          borderRadius: '8px',
          textAlign: 'center',
          border: `1px solid ${DARK_BROWN_COLORS.accent4}`
        }}>
          <h4 style={{ color: DARK_BROWN_COLORS.tertiary, margin: '0 0 10px 0' }}>Nationality</h4>
          <div style={{ height: '150px' }}>
            <Doughnut 
              data={nationalityData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                }
              }}
            />
          </div>
          <div style={{ marginTop: '10px', fontSize: '12px', color: DARK_BROWN_COLORS.tertiary }}>
            {nationalityData.labels.map((label, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '2px 0' }}>
                <div style={{ 
                  width: '10px', 
                  height: '10px', 
                  backgroundColor: nationalityData.datasets[0].backgroundColor[i],
                  marginRight: '5px',
                  borderRadius: '2px'
                }}></div>
                {label}: {nationalityData.datasets[0].data[i]}%
              </div>
            ))}
          </div>
        </div>

        {/* Youth Chart */}
        <div style={{ 
          backgroundColor: '#f7f3f0', 
          padding: '15px', 
          borderRadius: '8px',
          textAlign: 'center',
          border: `1px solid ${DARK_BROWN_COLORS.accent4}`
        }}>
          <h4 style={{ color: DARK_BROWN_COLORS.tertiary, margin: '0 0 10px 0' }}>Youth</h4>
          <div style={{ height: '150px' }}>
            <Doughnut 
              data={youthData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                }
              }}
            />
          </div>
          <div style={{ marginTop: '10px', fontSize: '12px', color: DARK_BROWN_COLORS.tertiary }}>
            {youthData.labels.map((label, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '2px 0' }}>
                <div style={{ 
                  width: '10px', 
                  height: '10px', 
                  backgroundColor: youthData.datasets[0].backgroundColor[i],
                  marginRight: '5px',
                  borderRadius: '2px'
                }}></div>
                {label}: {youthData.datasets[0].data[i]}%
              </div>
            ))}
          </div>
        </div>

        {/* Disability Chart */}
        <div style={{ 
          backgroundColor: '#f7f3f0', 
          padding: '15px', 
          borderRadius: '8px',
          textAlign: 'center',
          border: `1px solid ${DARK_BROWN_COLORS.accent4}`
        }}>
          <h4 style={{ color: DARK_BROWN_COLORS.tertiary, margin: '0 0 10px 0' }}>Disability</h4>
          <div style={{ height: '150px' }}>
            <Doughnut 
              data={disabilityData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                }
              }}
            />
          </div>
          <div style={{ marginTop: '10px', fontSize: '12px', color: DARK_BROWN_COLORS.tertiary }}>
            {disabilityData.labels.map((label, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '2px 0' }}>
                <div style={{ 
                  width: '10px', 
                  height: '10px', 
                  backgroundColor: disabilityData.datasets[0].backgroundColor[i],
                  marginRight: '5px',
                  borderRadius: '2px'
                }}></div>
                {label}: {disabilityData.datasets[0].data[i]}%
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// TrainingSpend Component
const TrainingSpend = ({ activeSection }) => {
  if (activeSection !== 'training-spend') return null;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const spendData = [1200, 1500, 1800, 900, 2100, 2400];
  const employees = [125, 128, 130, 132, 135, 138];

  return (
    <div style={{ 
      backgroundColor: '#fdfcfb', 
      padding: '20px', 
      margin: '20px 0',
      borderRadius: '8px',
      boxShadow: `0 2px 4px rgba(62, 39, 35, 0.1)`
    }}>
      <h2 style={{ color: DARK_BROWN_COLORS.secondary, marginTop: 0 }}>Training Spend per Employee</h2>
      <div style={{ height: '400px' }}>
        <Line 
          data={{
            labels: months,
            datasets: [
              {
                label: 'Training Spend ($)',
                data: spendData,
                borderColor: DARK_BROWN_COLORS.secondary,
                backgroundColor: `rgba(93, 64, 55, 0.1)`,
                borderWidth: 3,
                tension: 0.1,
                yAxisID: 'y'
              },
              {
                label: 'Avg per Employee ($)',
                data: spendData.map((spend, i) => spend / employees[i]),
                borderColor: DARK_BROWN_COLORS.tertiary,
                backgroundColor: `rgba(109, 76, 65, 0.1)`,
                borderWidth: 3,
                tension: 0.1,
                yAxisID: 'y1'
              }
            ]
          }}
          options={{
            responsive: true,
            interaction: {
              mode: 'index',
              intersect: false,
            },
            scales: {
              y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                  display: true,
                  text: 'Total Spend ($)',
                  color: DARK_BROWN_COLORS.secondary
                },
                ticks: {
                  color: DARK_BROWN_COLORS.secondary
                }
              },
              y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                  display: true,
                  text: 'Per Employee ($)',
                  color: DARK_BROWN_COLORS.secondary
                },
                grid: {
                  drawOnChartArea: false,
                },
                ticks: {
                  color: DARK_BROWN_COLORS.secondary
                }
              },
              x: {
                ticks: {
                  color: DARK_BROWN_COLORS.secondary
                }
              }
            },
            plugins: {
              legend: {
                labels: {
                  color: DARK_BROWN_COLORS.secondary
                }
              }
            }
          }}
        />
      </div>
    </div>
  );
};

// DiversityMetrics Component
const DiversityMetrics = ({ activeSection }) => {
  if (activeSection !== 'diversity-metrics') return null;

  const metrics = [
    { name: 'Female Leadership', value: 35, target: 40 },
    { name: 'Youth Leadership', value: 25, target: 30 },
    { name: 'HDI Ownership', value: 45, target: 50 }
  ];

  return (
    <div style={{ 
      backgroundColor: '#fdfcfb', 
      padding: '20px', 
      margin: '20px 0',
      borderRadius: '8px',
      boxShadow: `0 2px 4px rgba(62, 39, 35, 0.1)`
    }}>
      <h2 style={{ color: DARK_BROWN_COLORS.secondary, marginTop: 0 }}>Diversity Metrics in Leadership</h2>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {metrics.map((metric, index) => (
          <div key={index} style={{ 
            padding: '15px', 
            backgroundColor: '#f7f3f0', 
            borderRadius: '6px',
            textAlign: 'center',
            border: `1px solid ${DARK_BROWN_COLORS.accent4}`
          }}>
            <h3 style={{ color: DARK_BROWN_COLORS.tertiary, marginTop: 0 }}>{metric.name}</h3>
            <div style={{
              width: '120px',
              height: '120px',
              margin: '0 auto',
              position: 'relative'
            }}>
              <Doughnut 
                data={{
                  labels: ['Achieved', 'Remaining'],
                  datasets: [{
                    data: [metric.value, 100 - metric.value],
                    backgroundColor: [
                      metric.value >= metric.target ? DARK_BROWN_COLORS.success : DARK_BROWN_COLORS.warning,
                      DARK_BROWN_COLORS.accent4
                    ],
                    borderColor: DARK_BROWN_COLORS.primary,
                    borderWidth: 2
                  }]
                }}
                options={{
                  cutout: '70%',
                  plugins: {
                    legend: {
                      display: false
                    }
                  }
                }}
              />
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center'
              }}>
                <span style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold',
                  color: DARK_BROWN_COLORS.secondary
                }}>{metric.value}%</span>
                <div style={{ 
                  fontSize: '12px',
                  color: DARK_BROWN_COLORS.tertiary
                }}>Target: {metric.target}%</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main People Component
const People = () => {
  const [activeSection, setActiveSection] = useState('employee-composition');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSection, setModalSection] = useState('');
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({});
  const [turnoverData, setTurnoverData] = useState({});
  const [shareholderData, setShareholderData] = useState({
    gender: [],
    race: [],
    nationality: [],
    youth: [],
    disability: []
  });

  useEffect(() => {
    const checkSidebarState = () => {
      setIsSidebarCollapsed(document.body.classList.contains("sidebar-collapsed"));
    }

    // Check initial state
    checkSidebarState();

    // Watch for changes
    const observer = new MutationObserver(checkSidebarState);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchUserData(currentUser.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Fetch shareholder data from the database
    const fetchShareholderData = async () => {
      try {
        // In a real application, you would fetch this data from your API
        // For now, we'll use mock data that simulates what you'd get from the database
        const mockData = {
          gender: [60, 35, 5], // Male, Female, Other
          race: [40, 30, 15, 10, 5], // Black, White, Colored, Indian/Asian, Other
          nationality: [70, 10, 8, 7, 3, 2], // South African, Other African, European, Asian, American, Other
          youth: [25, 75], // Youth, Non-Youth
          disability: [8, 92] // Disabled, Not Disabled
        };
        
        setShareholderData(mockData);
      } catch (error) {
        console.error("Error fetching shareholder data:", error);
      }
    };

    fetchShareholderData();
  }, []);

  const fetchUserData = async (userId) => {
    try {
      // Fetch employee composition data
      const employeeQuery = query(
        collection(db, 'employeeComposition'),
        where('userId', '==', userId)
      );
      const employeeSnapshot = await getDocs(employeeQuery);
      if (!employeeSnapshot.empty) {
        setUserData(employeeSnapshot.docs[0].data());
      }

      // Fetch turnover data
      const turnoverQuery = query(
        collection(db, 'turnoverData'),
        where('userId', '==', userId)
      );
      const turnoverSnapshot = await getDocs(turnoverQuery);
      if (!turnoverSnapshot.empty) {
        setTurnoverData(turnoverSnapshot.docs[0].data());
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleSaveData = async (data) => {
    if (!user) return;

    try {
      if (modalSection === 'employee-composition') {
        // Check if document exists
        const employeeQuery = query(
          collection(db, 'employeeComposition'),
          where('userId', '==', user.uid)
        );
        const employeeSnapshot = await getDocs(employeeQuery);
        
        if (employeeSnapshot.empty) {
          // Create new document
          await addDoc(collection(db, 'employeeComposition'), {
            ...data,
            userId: user.uid,
            createdAt: new Date()
          });
        } else {
          // Update existing document
          const docRef = doc(db, 'employeeComposition', employeeSnapshot.docs[0].id);
          await updateDoc(docRef, {
            ...data,
            updatedAt: new Date()
          });
        }
        setUserData(data);
      } else if (modalSection === 'turnover-rate') {
        // Check if document exists
        const turnoverQuery = query(
          collection(db, 'turnoverData'),
          where('userId', '==', user.uid)
        );
        const turnoverSnapshot = await getDocs(turnoverQuery);
        
        if (turnoverSnapshot.empty) {
          // Create new document
          await addDoc(collection(db, 'turnoverData'), {
            ...data,
            userId: user.uid,
            createdAt: new Date()
          });
        } else {
          // Update existing document
          const docRef = doc(db, 'turnoverData', turnoverSnapshot.docs[0].id);
          await updateDoc(docRef, {
            ...data,
            updatedAt: new Date()
          });
        }
        setTurnoverData(data);
      }
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  const openModal = (section) => {
    setModalSection(section);
    setIsModalOpen(true);
  };

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
    { id: 'employee-composition', label: 'Employee Composition' },
    { id: 'employee-cost', label: 'Employee Costs' },
    { id: 'productivity-metrics', label: 'Productivity Metrics' },
    { id: 'shareholder-breakdown', label: 'Shareholders' },
    { id: 'turnover-rate', label: 'Turnover Rate' },
    { id: 'training-spend', label: 'Training Spend' },
    { id: 'diversity-metrics', label: 'Diversity Metrics' }
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
            boxShadow: `0 2px 4px rgba(62, 39, 35, 0.1)`,
            flexWrap: 'wrap',
            overflowX: 'auto'
          }}>
            {sectionButtons.map((button) => (
              <button
                key={button.id}
                onClick={() => setActiveSection(button.id)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: activeSection === button.id ? DARK_BROWN_COLORS.secondary : DARK_BROWN_COLORS.accent4,
                  color: activeSection === button.id ? '#fdfcfb' : DARK_BROWN_COLORS.secondary,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap',
                  boxShadow: activeSection === button.id ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'
                }}
              >
                {button.label}
              </button>
            ))}
          </div>

          <EmployeeComposition 
            activeSection={activeSection} 
            userData={userData} 
            onOpenModal={openModal}
          />
          <EmployeeCost activeSection={activeSection} />
          <ProductivityMetrics activeSection={activeSection} />
          <ShareholderBreakdown activeSection={activeSection} shareholderData={shareholderData} />
          <TurnoverRate 
            activeSection={activeSection} 
            turnoverData={turnoverData} 
            onOpenModal={openModal}
          />
          <TrainingSpend activeSection={activeSection} />
          <DiversityMetrics activeSection={activeSection} />
        </div>
      </div>

      <DataEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        section={modalSection}
        onSave={handleSaveData}
        currentData={modalSection === 'employee-composition' ? userData : turnoverData}
      />
    </div>
  );
};

export default People;