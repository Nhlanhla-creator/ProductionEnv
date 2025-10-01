"use client"

import React, { useState, useEffect } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import Sidebar from 'smses/Sidebar/Sidebar';
import Header from '../DashboardHeader/DashboardHeader';
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
} from 'chart.js';

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
  Legend
);

// Download utility function
const downloadData = (data, filename, format = 'json') => {
  let content, mimeType;
  
  if (format === 'json') {
    content = JSON.stringify(data, null, 2);
    mimeType = 'application/json';
  } else if (format === 'csv') {
    if (Array.isArray(data) && data.length > 0) {
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => Object.values(row).join(',')).join('\n');
      content = headers + '\n' + rows;
    } else {
      content = JSON.stringify(data, null, 2);
    }
    mimeType = 'text/csv';
  }
  
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Loan Repayments Component
const LoanRepayments = ({ activeSection }) => {
  const [timeFrame, setTimeFrame] = useState('monthly');
  const [monthlyData, setMonthlyData] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    scheduled: [0, 0, 0, 0, 0, 0],
    actual: [0, 0, 0, 0, 0, 0]
  });
  const [quarterlyData, setQuarterlyData] = useState({
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    scheduled: [0, 0, 0, 0],
    actual: [0, 0, 0, 0]
  });
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);

  const saveLoanData = async () => {
    try {
      await setDoc(doc(db, 'loan-repayments', 'main'), { 
        monthlyData, 
        quarterlyData, 
        comments 
      });
      setShowEditForm(false);
      alert('Loan repayment data saved successfully!');
    } catch (error) {
      console.error('Error saving loan data:', error);
      alert('Error saving data');
    }
  };

  const loadLoanData = async () => {
    try {
      const docRef = doc(db, 'loan-repayments', 'main');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMonthlyData(data.monthlyData || {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          scheduled: [0, 0, 0, 0, 0, 0],
          actual: [0, 0, 0, 0, 0, 0]
        });
        setQuarterlyData(data.quarterlyData || {
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          scheduled: [0, 0, 0, 0],
          actual: [0, 0, 0, 0]
        });
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error loading loan data:', error);
    }
  };

  useEffect(() => {
    loadLoanData();
  }, []);

  const updateScheduledValue = (index, value, period) => {
    if (period === 'monthly') {
      const newData = { ...monthlyData };
      newData.scheduled[index] = parseFloat(value) || 0;
      setMonthlyData(newData);
    } else {
      const newData = { ...quarterlyData };
      newData.scheduled[index] = parseFloat(value) || 0;
      setQuarterlyData(newData);
    }
  };

  const updateActualValue = (index, value, period) => {
    if (period === 'monthly') {
      const newData = { ...monthlyData };
      newData.actual[index] = parseFloat(value) || 0;
      setMonthlyData(newData);
    } else {
      const newData = { ...quarterlyData };
      newData.actual[index] = parseFloat(value) || 0;
      setQuarterlyData(newData);
    }
  };

  const handleAddComment = () => {
    if (comment.trim()) {
      const newComment = {
        id: comments.length + 1,
        text: comment,
        date: new Date().toISOString().split('T')[0]
      };
      setComments([...comments, newComment]);
      setComment('');
    }
  };

  const handleDownload = (format) => {
    const downloadData = {
      monthlyData,
      quarterlyData,
      comments,
      timeFrame
    };
    downloadData(downloadData, 'loan-repayments', format);
    setShowDownloadOptions(false);
  };

  if (activeSection !== 'loan-repayments') return null;

  const data = timeFrame === 'monthly' ? monthlyData : quarterlyData;

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Loan Repayments vs Schedule (${timeFrame})`,
        color: '#5d4037'
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount ($)',
          color: '#72542b'
        }
      },
      x: {
        title: {
          display: true,
          text: timeFrame === 'monthly' ? 'Months' : 'Quarters',
          color: '#72542b'
        }
      }
    },
  };

  return (
    <div style={{ 
      display: 'flex',
      gap: '20px',
      flexDirection: window.innerWidth < 768 ? 'column' : 'row'
    }}>
      <div style={{ 
        flex: 2,
        backgroundColor: '#fdfcfb', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexDirection: window.innerWidth < 768 ? 'column' : 'row',
          gap: window.innerWidth < 768 ? '10px' : '0'
        }}>
          <h2 style={{ color: '#5d4037', margin: 0 }}>Loan Repayments</h2>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setTimeFrame('monthly')}
              style={{
                padding: '8px 15px',
                backgroundColor: timeFrame === 'monthly' ? '#5d4037' : '#e8ddd4',
                color: timeFrame === 'monthly' ? '#fdfcfb' : '#5d4037',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setTimeFrame('quarterly')}
              style={{
                padding: '8px 15px',
                backgroundColor: timeFrame === 'quarterly' ? '#5d4037' : '#e8ddd4',
                color: timeFrame === 'quarterly' ? '#fdfcfb' : '#5d4037',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Quarterly
            </button>
            <button
              onClick={() => setShowEditForm(!showEditForm)}
              style={{
                padding: '8px 15px',
                backgroundColor: '#5d4037',
                color: '#fdfcfb',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {showEditForm ? 'Cancel' : 'Edit Data'}
            </button>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                style={{
                  padding: '8px 15px',
                  backgroundColor: '#72542b',
                  color: '#fdfcfb',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Download
              </button>
              {showDownloadOptions && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  backgroundColor: '#fdfcfb',
                  border: '1px solid #d4c4b0',
                  borderRadius: '4px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  zIndex: 1000
                }}>
                  <button
                    onClick={() => handleDownload('json')}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px 15px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: '#5d4037'
                    }}
                  >
                    Download JSON
                  </button>
                  <button
                    onClick={() => handleDownload('csv')}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px 15px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: '#5d4037'
                    }}
                  >
                    Download CSV
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {showEditForm && (
          <div style={{ 
            backgroundColor: '#f7f3f0', 
            padding: '20px', 
            borderRadius: '6px',
            marginBottom: '20px'
          }}>
            <h3 style={{ color: '#72542b', marginTop: 0 }}>Edit Loan Repayment Data</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <h4 style={{ color: '#72542b' }}>Monthly Data</h4>
                <div style={{ marginBottom: '15px' }}>
                  <h5 style={{ color: '#72542b' }}>Scheduled</h5>
                  {monthlyData.labels.map((month, index) => (
                    <div key={month} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ minWidth: '40px', color: '#72542b' }}>{month}:</span>
                      <input
                        type="number"
                        value={monthlyData.scheduled[index]}
                        onChange={(e) => updateScheduledValue(index, e.target.value, 'monthly')}
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
                  <h5 style={{ color: '#72542b' }}>Actual</h5>
                  {monthlyData.labels.map((month, index) => (
                    <div key={month} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ minWidth: '40px', color: '#72542b' }}>{month}:</span>
                      <input
                        type="number"
                        value={monthlyData.actual[index]}
                        onChange={(e) => updateActualValue(index, e.target.value, 'monthly')}
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
              <div>
                <h4 style={{ color: '#72542b' }}>Quarterly Data</h4>
                <div style={{ marginBottom: '15px' }}>
                  <h5 style={{ color: '#72542b' }}>Scheduled</h5>
                  {quarterlyData.labels.map((quarter, index) => (
                    <div key={quarter} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ minWidth: '40px', color: '#72542b' }}>{quarter}:</span>
                      <input
                        type="number"
                        value={quarterlyData.scheduled[index]}
                        onChange={(e) => updateScheduledValue(index, e.target.value, 'quarterly')}
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
                  <h5 style={{ color: '#72542b' }}>Actual</h5>
                  {quarterlyData.labels.map((quarter, index) => (
                    <div key={quarter} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ minWidth: '40px', color: '#72542b' }}>{quarter}:</span>
                      <input
                        type="number"
                        value={quarterlyData.actual[index]}
                        onChange={(e) => updateActualValue(index, e.target.value, 'quarterly')}
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
            </div>
            <button
              onClick={saveLoanData}
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
              labels: data.labels,
              datasets: [
                {
                  label: 'Scheduled',
                  data: data.scheduled,
                  backgroundColor: '#d4c4b0',
                  borderColor: '#5d4037',
                  borderWidth: 1,
                },
                {
                  label: 'Actual',
                  data: data.actual,
                  backgroundColor: '#9c7c5f',
                  borderColor: '#5d4037',
                  borderWidth: 1,
                }
              ]
            }} 
            options={options} 
          />
        </div>
      </div>
      
      <div style={{ 
        flex: 1,
        backgroundColor: '#fdfcfb', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <h3 style={{ color: '#5d4037', marginTop: 0 }}>Comments & Notes</h3>
        <div style={{ marginBottom: '15px' }}>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment..."
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '10px',
              border: '1px solid #d4c4b0',
              borderRadius: '4px',
              resize: 'vertical'
            }}
          />
          <button
            onClick={handleAddComment}
            style={{
              padding: '8px 15px',
              backgroundColor: '#5d4037',
              color: '#fdfcfb',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Add Comment
          </button>
        </div>
        
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {comments.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '20px',
              color: '#72542b'
            }}>
              <p>No comments yet. Add your first comment above.</p>
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id} style={{ 
                padding: '10px',
                marginBottom: '10px',
                backgroundColor: '#f7f3f0',
                borderRadius: '4px'
              }}>
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '5px',
                  fontSize: '0.9em',
                  color: '#72542b'
                }}>
                  <span>Comment #{c.id}</span>
                  <span>{c.date}</span>
                </div>
                <p style={{ margin: 0 }}>{c.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// IRR Component
const IRRInvestments = ({ activeSection }) => {
  const [investments, setInvestments] = useState([]);
  const [expandedInvestment, setExpandedInvestment] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);

  const saveIRRData = async () => {
    try {
      await setDoc(doc(db, 'irr-investments', 'main'), { investments });
      setShowEditForm(false);
      alert('IRR investment data saved successfully!');
    } catch (error) {
      console.error('Error saving IRR data:', error);
      alert('Error saving data');
    }
  };

  const loadIRRData = async () => {
    try {
      const docRef = doc(db, 'irr-investments', 'main');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setInvestments(docSnap.data().investments || []);
      }
    } catch (error) {
      console.error('Error loading IRR data:', error);
    }
  };

  useEffect(() => {
    loadIRRData();
  }, []);

  const updateInvestment = (index, field, value) => {
    const newInvestments = [...investments];
    if (field === 'name' || field === 'riskRating') {
      newInvestments[index][field] = value;
    } else if (field === 'irr') {
      newInvestments[index][field] = parseFloat(value) || 0;
    } else if (field.startsWith('details.')) {
      const detailField = field.split('.')[1];
      if (detailField === 'cashFlows') {
        newInvestments[index].details[detailField] = value.split(',').map(flow => flow.trim());
      } else {
        newInvestments[index].details[detailField] = value;
      }
    }
    setInvestments(newInvestments);
  };

  const addInvestment = () => {
    const newInvestment = {
      name: 'New Project',
      irr: 0,
      details: {
        initialInvestment: '$0M',
        duration: '0 years',
        cashFlows: ['Year 1: $0M'],
        riskRating: 'Medium'
      }
    };
    setInvestments([...investments, newInvestment]);
  };

  const removeInvestment = (index) => {
    const newInvestments = investments.filter((_, i) => i !== index);
    setInvestments(newInvestments);
  };

  const toggleInvestment = (index) => {
    if (expandedInvestment === index) {
      setExpandedInvestment(null);
    } else {
      setExpandedInvestment(index);
    }
  };

  const handleDownload = (format) => {
    downloadData(investments, 'irr-investments', format);
    setShowDownloadOptions(false);
  };

  if (activeSection !== 'irr-investments') return null;

  return (
    <div style={{ 
      backgroundColor: '#fdfcfb', 
      padding: '20px', 
      margin: '20px 0',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#5d4037', marginTop: 0 }}>IRR on Equity Investments</h2>
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
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDownloadOptions(!showDownloadOptions)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#72542b',
                color: '#fdfcfb',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Download
            </button>
            {showDownloadOptions && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                backgroundColor: '#fdfcfb',
                border: '1px solid #d4c4b0',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                zIndex: 1000
              }}>
                <button
                  onClick={() => handleDownload('json')}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 15px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: '#5d4037'
                  }}
                >
                  Download JSON
                </button>
                <button
                  onClick={() => handleDownload('csv')}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 15px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: '#5d4037'
                  }}
                >
                  Download CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showEditForm && (
        <div style={{ 
          backgroundColor: '#f7f3f0', 
          padding: '20px', 
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#72542b', marginTop: 0 }}>Edit IRR Investment Data</h3>
          {investments.map((investment, index) => (
            <div key={index} style={{ 
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: '#fdfcfb',
              borderRadius: '4px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                <input
                  type="text"
                  value={investment.name}
                  onChange={(e) => updateInvestment(index, 'name', e.target.value)}
                  style={{
                    padding: '8px',
                    border: '1px solid #d4c4b0',
                    borderRadius: '4px'
                  }}
                  placeholder="Project Name"
                />
                <input
                  type="number"
                  value={investment.irr}
                  onChange={(e) => updateInvestment(index, 'irr', e.target.value)}
                  style={{
                    padding: '8px',
                    border: '1px solid #d4c4b0',
                    borderRadius: '4px'
                  }}
                  placeholder="IRR %"
                />
                <select
                  value={investment.details.riskRating}
                  onChange={(e) => updateInvestment(index, 'details.riskRating', e.target.value)}
                  style={{
                    padding: '8px',
                    border: '1px solid #d4c4b0',
                    borderRadius: '4px'
                  }}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
                <button
                  onClick={() => removeInvestment(index)}
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <input
                  type="text"
                  value={investment.details.initialInvestment}
                  onChange={(e) => updateInvestment(index, 'details.initialInvestment', e.target.value)}
                  style={{
                    padding: '8px',
                    border: '1px solid #d4c4b0',
                    borderRadius: '4px'
                  }}
                  placeholder="Initial Investment"
                />
                <input
                  type="text"
                  value={investment.details.duration}
                  onChange={(e) => updateInvestment(index, 'details.duration', e.target.value)}
                  style={{
                    padding: '8px',
                    border: '1px solid #d4c4b0',
                    borderRadius: '4px'
                  }}
                  placeholder="Duration"
                />
                <input
                  type="text"
                  value={investment.details.cashFlows.join(', ')}
                  onChange={(e) => updateInvestment(index, 'details.cashFlows', e.target.value)}
                  style={{
                    padding: '8px',
                    border: '1px solid #d4c4b0',
                    borderRadius: '4px'
                  }}
                  placeholder="Cash Flows (comma separated)"
                />
              </div>
            </div>
          ))}
          <div style={{ marginTop: '15px' }}>
            <button
              onClick={addInvestment}
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
              Add Investment
            </button>
            <button
              onClick={saveIRRData}
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

      {investments.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          color: '#72542b'
        }}>
          <p>No investment data available. Click "Edit Data" to add your first investment.</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}>
          {investments.map((investment, index) => (
            <div key={index} style={{ 
              padding: '15px', 
              backgroundColor: '#f7f3f0', 
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#72542b' }}>{investment.name}</h3>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                backgroundColor: '#e8ddd4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                border: '8px solid #9c7c5f',
                marginBottom: '15px'
              }}>
                <span style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold',
                  color: '#5d4037'
                }}>{investment.irr}%</span>
              </div>
              
              <button
                onClick={() => toggleInvestment(index)}
                style={{
                  padding: '8px 15px',
                  backgroundColor: '#5d4037',
                  color: '#fdfcfb',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginBottom: '10px'
                }}
              >
                {expandedInvestment === index ? 'Hide Details' : 'Breakdown'}
              </button>
              
              {expandedInvestment === index && (
                <div style={{ 
                  textAlign: 'left',
                  backgroundColor: '#e8ddd4',
                  padding: '10px',
                  borderRadius: '4px',
                  marginTop: '10px'
                }}>
                  <p><strong>Initial Investment:</strong> {investment.details.initialInvestment}</p>
                  <p><strong>Duration:</strong> {investment.details.duration}</p>
                  <p><strong>Risk Rating:</strong> {investment.details.riskRating}</p>
                  <div>
                    <strong>Cash Flows:</strong>
                    <ul style={{ margin: '5px 0 0 20px', padding: 0 }}>
                      {investment.details.cashFlows.map((flow, i) => (
                        <li key={i}>{flow}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Default Flags Component
const DefaultFlags = ({ activeSection }) => {
  const [flags, setFlags] = useState([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);

  const saveDefaultFlagsData = async () => {
    try {
      await setDoc(doc(db, 'default-flags', 'main'), { flags });
      setShowEditForm(false);
      alert('Default flags data saved successfully!');
    } catch (error) {
      console.error('Error saving default flags data:', error);
      alert('Error saving data');
    }
  };

  const loadDefaultFlagsData = async () => {
    try {
      const docRef = doc(db, 'default-flags', 'main');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setFlags(docSnap.data().flags || []);
      }
    } catch (error) {
      console.error('Error loading default flags data:', error);
    }
  };

  useEffect(() => {
    loadDefaultFlagsData();
  }, []);

  const updateFlag = (index, field, value) => {
    const newFlags = [...flags];
    newFlags[index][field] = field === 'count' ? parseFloat(value) || 0 : value;
    setFlags(newFlags);
  };

  const addFlag = () => {
    const newFlag = {
      id: flags.length + 1,
      name: 'New Flag',
      status: 'Watch',
      count: 0,
      action: 'Monitor'
    };
    setFlags([...flags, newFlag]);
  };

  const removeFlag = (index) => {
    const newFlags = flags.filter((_, i) => i !== index);
    setFlags(newFlags);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Critical': return '#f44336';
      case 'Warning': return '#FF9800';
      case 'Watch': return '#FFC107';
      default: return '#9E9E9E';
    }
  };

  const handleAction = (id, action) => {
    alert(`Action "${action}" initiated for flag ${id}`);
  };

  const handleDownload = (format) => {
    downloadData(flags, 'default-flags', format);
    setShowDownloadOptions(false);
  };

  if (activeSection !== 'default-flags') return null;

  return (
    <div style={{ 
      backgroundColor: '#fdfcfb', 
      padding: '20px', 
      margin: '20px 0',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#5d4037', marginTop: 0 }}>Default Flags & Early Warnings</h2>
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
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDownloadOptions(!showDownloadOptions)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#72542b',
                color: '#fdfcfb',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Download
            </button>
            {showDownloadOptions && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                backgroundColor: '#fdfcfb',
                border: '1px solid #d4c4b0',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                zIndex: 1000
              }}>
                <button
                  onClick={() => handleDownload('json')}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 15px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: '#5d4037'
                  }}
                >
                  Download JSON
                </button>
                <button
                  onClick={() => handleDownload('csv')}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 15px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: '#5d4037'
                  }}
                >
                  Download CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showEditForm && (
        <div style={{ 
          backgroundColor: '#f7f3f0', 
          padding: '20px', 
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#72542b', marginTop: 0 }}>Edit Default Flags Data</h3>
          {flags.map((flag, index) => (
            <div key={index} style={{ 
              display: 'grid', 
              gridTemplateColumns: '2fr 1fr 1fr 2fr auto',
              gap: '10px',
              alignItems: 'center',
              marginBottom: '10px',
              padding: '10px',
              backgroundColor: '#fdfcfb',
              borderRadius: '4px'
            }}>
              <input
                type="text"
                value={flag.name}
                onChange={(e) => updateFlag(index, 'name', e.target.value)}
                style={{
                  padding: '8px',
                  border: '1px solid #d4c4b0',
                  borderRadius: '4px'
                }}
                placeholder="Flag Name"
              />
              <select
                value={flag.status}
                onChange={(e) => updateFlag(index, 'status', e.target.value)}
                style={{
                  padding: '8px',
                  border: '1px solid #d4c4b0',
                  borderRadius: '4px'
                }}
              >
                <option value="Watch">Watch</option>
                <option value="Warning">Warning</option>
                <option value="Critical">Critical</option>
              </select>
              <input
                type="number"
                value={flag.count}
                onChange={(e) => updateFlag(index, 'count', e.target.value)}
                style={{
                  padding: '8px',
                  border: '1px solid #d4c4b0',
                  borderRadius: '4px'
                }}
                placeholder="Count"
              />
              <input
                type="text"
                value={flag.action}
                onChange={(e) => updateFlag(index, 'action', e.target.value)}
                style={{
                  padding: '8px',
                  border: '1px solid #d4c4b0',
                  borderRadius: '4px'
                }}
                placeholder="Action"
              />
              <button
                onClick={() => removeFlag(index)}
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
              onClick={addFlag}
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
              Add Flag
            </button>
            <button
              onClick={saveDefaultFlagsData}
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

      {flags.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          color: '#72542b'
        }}>
          <p>No flag data available. Click "Edit Data" to add your first flag.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            color: '#5d4037'
          }}>
            <thead>
              <tr style={{ 
                backgroundColor: '#e8ddd4',
                borderBottom: '2px solid #d4c4b0'
              }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Flag Type</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Count</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Action</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {flags.map((flag) => (
                <tr key={flag.id} style={{ 
                  borderBottom: '1px solid #e8ddd4'
                }}>
                  <td style={{ padding: '12px' }}>{flag.name}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '4px',
                      backgroundColor: getStatusColor(flag.status),
                      color: 'white',
                      display: 'inline-block'
                    }}>
                      {flag.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>{flag.count}</td>
                  <td style={{ padding: '12px' }}>{flag.action}</td>
                  <td style={{ padding: '12px' }}>
                    <button
                      onClick={() => handleAction(flag.id, flag.action)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#5d4037',
                        color: '#fdfcfb',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Take Action
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Investment Ratios Component (keeping as is per user request)
const InvestmentRatios = ({ activeSection }) => {
  const [expandedRatio, setExpandedRatio] = useState(null);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);

  if (activeSection !== 'investment-ratios') return null;

  const ratios = [
    { 
      name: 'Debt/EBITDA', 
      value: 3.2, 
      target: '<4.0',
      description: 'Measures a company\'s ability to pay off its debt with EBITDA',
      status: 'Good'
    },
    { 
      name: 'Interest Coverage', 
      value: 4.5, 
      target: '>3.0',
      description: 'Measures how easily a company can pay interest on outstanding debt',
      status: 'Excellent'
    },
    { 
      name: 'Current Ratio', 
      value: 1.8, 
      target: '>1.5',
      description: 'Measures a company\'s ability to pay short-term obligations',
      status: 'Good'
    },
    { 
      name: 'ROIC', 
      value: 12.5, 
      target: '>10.0',
      description: 'Measures how well a company generates cash flow relative to capital invested',
      status: 'Excellent'
    }
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'Excellent': return '#4CAF50';
      case 'Good': return '#8BC34A';
      case 'Fair': return '#FFC107';
      case 'Poor': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const toggleRatio = (index) => {
    if (expandedRatio === index) {
      setExpandedRatio(null);
    } else {
      setExpandedRatio(index);
    }
  };

  const handleDownload = (format) => {
    downloadData(ratios, 'investment-ratios', format);
    setShowDownloadOptions(false);
  };

  return (
    <div style={{ 
      backgroundColor: '#fdfcfb', 
      padding: '20px', 
      margin: '20px 0',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#5d4037', marginTop: 0 }}>Investment Ratios</h2>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDownloadOptions(!showDownloadOptions)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#72542b',
              color: '#fdfcfb',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Download
          </button>
          {showDownloadOptions && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              backgroundColor: '#fdfcfb',
              border: '1px solid #d4c4b0',
              borderRadius: '4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              zIndex: 1000
            }}>
              <button
                onClick={() => handleDownload('json')}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 15px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: '#5d4037'
                }}
              >
                Download JSON
              </button>
              <button
                onClick={() => handleDownload('csv')}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 15px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: '#5d4037'
                }}
              >
                Download CSV
              </button>
            </div>
          )}
        </div>
      </div>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px'
      }}>
        {ratios.map((ratio, index) => (
          <div key={index} style={{ 
            padding: '15px', 
            backgroundColor: '#f7f3f0', 
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#72542b' }}>{ratio.name}</h3>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: '#e8ddd4',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              border: `8px solid ${getStatusColor(ratio.status)}`,
              marginBottom: '15px',
              position: 'relative'
            }}>
              <span style={{ 
                fontSize: '24px', 
                fontWeight: 'bold',
                color: '#5d4037'
              }}>
                {ratio.value}
              </span>
              <span style={{
                fontSize: '12px',
                color: '#72542b',
                marginTop: '5px'
              }}>
                Target: {ratio.target}
              </span>
            </div>
            
            <button
              onClick={() => toggleRatio(index)}
              style={{
                padding: '8px 15px',
                backgroundColor: '#5d4037',
                color: '#fdfcfb',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginBottom: '10px'
              }}
            >
              {expandedRatio === index ? 'Hide Details' : 'Show Details'}
            </button>
            
            {expandedRatio === index && (
              <div style={{ 
                textAlign: 'left',
                backgroundColor: '#e8ddd4',
                padding: '10px',
                borderRadius: '4px',
                marginTop: '10px'
              }}>
                <p><strong>Description:</strong> {ratio.description}</p>
                <p>
                  <strong>Status:</strong> 
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: getStatusColor(ratio.status),
                    color: 'white',
                    marginLeft: '8px'
                  }}>
                    {ratio.status}
                  </span>
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Cap Table Component
const CapTable = ({ activeSection }) => {
  const [investors, setInvestors] = useState([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);

  const saveCapTableData = async () => {
    try {
      await setDoc(doc(db, 'cap-table', 'main'), { investors });
      setShowEditForm(false);
      alert('Cap table data saved successfully!');
    } catch (error) {
      console.error('Error saving cap table data:', error);
      alert('Error saving data');
    }
  };

  const loadCapTableData = async () => {
    try {
      const docRef = doc(db, 'cap-table', 'main');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setInvestors(docSnap.data().investors || []);
      }
    } catch (error) {
      console.error('Error loading cap table data:', error);
    }
  };

  useEffect(() => {
    loadCapTableData();
  }, []);

  const updateInvestor = (index, field, value) => {
    const newInvestors = [...investors];
    newInvestors[index][field] = field === 'name' ? value : parseFloat(value) || 0;
    setInvestors(newInvestors);
  };

  const addInvestor = () => {
    setInvestors([...investors, { name: 'New Investor', shares: 0, valuation: 0 }]);
  };

  const removeInvestor = (index) => {
    const newInvestors = investors.filter((_, i) => i !== index);
    setInvestors(newInvestors);
  };

  const handleDownload = (format) => {
    const totalShares = investors.reduce((sum, inv) => sum + inv.shares, 0);
    const totalValuation = investors.reduce((sum, inv) => sum + inv.valuation, 0);
    
    const downloadData = {
      investors: investors.map(inv => ({
        ...inv,
        percentage: totalShares > 0 ? ((inv.shares / totalShares) * 100).toFixed(1) : 0
      })),
      totals: {
        totalShares,
        totalValuation
      }
    };
    
    downloadData(downloadData, 'cap-table', format);
    setShowDownloadOptions(false);
  };

  if (activeSection !== 'cap-table') return null;

  const totalShares = investors.reduce((sum, inv) => sum + inv.shares, 0);
  const totalValuation = investors.reduce((sum, inv) => sum + inv.valuation, 0);

  return (
    <div style={{ 
      backgroundColor: '#fdfcfb', 
      padding: '20px', 
      margin: '20px 0',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#5d4037', marginTop: 0 }}>Cap Table Overview</h2>
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
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDownloadOptions(!showDownloadOptions)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#72542b',
                color: '#fdfcfb',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Download
            </button>
            {showDownloadOptions && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                backgroundColor: '#fdfcfb',
                border: '1px solid #d4c4b0',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                zIndex: 1000
              }}>
                <button
                  onClick={() => handleDownload('json')}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 15px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: '#5d4037'
                  }}
                >
                  Download JSON
                </button>
                <button
                  onClick={() => handleDownload('csv')}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 15px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: '#5d4037'
                  }}
                >
                  Download CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showEditForm && (
        <div style={{ 
          backgroundColor: '#f7f3f0', 
          padding: '20px', 
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#72542b', marginTop: 0 }}>Edit Cap Table Data</h3>
          {investors.map((investor, index) => (
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
                value={investor.name}
                onChange={(e) => updateInvestor(index, 'name', e.target.value)}
                style={{
                  padding: '8px',
                  border: '1px solid #d4c4b0',
                  borderRadius: '4px'
                }}
                placeholder="Investor Name"
              />
              <input
                type="number"
                value={investor.shares}
                onChange={(e) => updateInvestor(index, 'shares', e.target.value)}
                style={{
                  padding: '8px',
                  border: '1px solid #d4c4b0',
                  borderRadius: '4px'
                }}
                placeholder="Shares %"
              />
              <input
                type="number"
                step="0.1"
                value={investor.valuation}
                onChange={(e) => updateInvestor(index, 'valuation', e.target.value)}
                style={{
                  padding: '8px',
                  border: '1px solid #d4c4b0',
                  borderRadius: '4px'
                }}
                placeholder="Valuation ($M)"
              />
              <button
                onClick={() => removeInvestor(index)}
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
              onClick={addInvestor}
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
              Add Investor
            </button>
            <button
              onClick={saveCapTableData}
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

      {investors.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          color: '#72542b'
        }}>
          <p>No investor data available. Click "Edit Data" to add your first investor.</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr',
          gap: '30px'
        }}>
          <div>
            <h3 style={{ color: '#72542b' }}>Ownership Structure</h3>
            <div style={{ height: '400px' }}>
              <Pie 
                data={{
                  labels: investors.map(inv => inv.name),
                  datasets: [{
                    data: investors.map(inv => inv.shares),
                    backgroundColor: [
                      '#9c7c5f',
                      '#8b6914',
                      '#b89f8d',
                      '#d4c4b0',
                      '#e8ddd4'
                    ],
                    borderColor: '#5d4037',
                    borderWidth: 1
                  }]
                }}
                options={{
                  plugins: {
                    legend: {
                      position: window.innerWidth < 768 ? 'bottom' : 'right'
                    }
                  }
                }}
              />
            </div>
          </div>
          <div>
            <h3 style={{ color: '#72542b' }}>Investor Details</h3>
            <div style={{ 
              backgroundColor: '#f7f3f0',
              padding: '15px',
              borderRadius: '6px'
            }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                color: '#5d4037'
              }}>
                <thead>
                  <tr style={{ 
                    borderBottom: '2px solid #d4c4b0'
                  }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Investor</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Shares (%)</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Valuation ($M)</th>
                  </tr>
                </thead>
                <tbody>
                  {investors.map((investor, index) => (
                    <tr key={index} style={{ 
                      borderBottom: '1px solid #e8ddd4'
                    }}>
                      <td style={{ padding: '12px' }}>{investor.name}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {totalShares > 0 ? (investor.shares / totalShares * 100).toFixed(1) : 0}%
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>${investor.valuation.toFixed(1)}</td>
                    </tr>
                  ))}
                  <tr style={{ 
                    borderTop: '2px solid #d4c4b0',
                    fontWeight: 'bold'
                  }}>
                    <td style={{ padding: '12px' }}>Total</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>100%</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>${totalValuation.toFixed(1)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Dividend History Component
const DividendHistory = ({ activeSection }) => {
  const [dividends, setDividends] = useState([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);

  const saveDividendData = async () => {
    try {
      await setDoc(doc(db, 'dividend-history', 'main'), { dividends });
      setShowEditForm(false);
      alert('Dividend history data saved successfully!');
    } catch (error) {
      console.error('Error saving dividend data:', error);
      alert('Error saving data');
    }
  };

  const loadDividendData = async () => {
    try {
      const docRef = doc(db, 'dividend-history', 'main');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setDividends(docSnap.data().dividends || []);
      }
    } catch (error) {
      console.error('Error loading dividend data:', error);
    }
  };

  useEffect(() => {
    loadDividendData();
  }, []);

  const updateDividend = (index, field, value) => {
    const newDividends = [...dividends];
    if (field === 'year') {
      newDividends[index][field] = parseInt(value) || 0;
    } else if (field === 'amount') {
      newDividends[index][field] = parseFloat(value) || 0;
    } else {
      newDividends[index][field] = value;
    }
    setDividends(newDividends);
  };

  const addDividend = () => {
    setDividends([...dividends, { year: new Date().getFullYear(), amount: 0, paymentDate: '' }]);
  };

  const removeDividend = (index) => {
    const newDividends = dividends.filter((_, i) => i !== index);
    setDividends(newDividends);
  };

  const handleDownload = (format) => {
    downloadData(dividends, 'dividend-history', format);
    setShowDownloadOptions(false);
  };

  if (activeSection !== 'dividend-history') return null;

  return (
    <div style={{ 
      backgroundColor: '#fdfcfb', 
      padding: '20px', 
      margin: '20px 0',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#5d4037', marginTop: 0 }}>Dividend History</h2>
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
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDownloadOptions(!showDownloadOptions)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#72542b',
                color: '#fdfcfb',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Download
            </button>
            {showDownloadOptions && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                backgroundColor: '#fdfcfb',
                border: '1px solid #d4c4b0',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                zIndex: 1000
              }}>
                <button
                  onClick={() => handleDownload('json')}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 15px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: '#5d4037'
                  }}
                >
                  Download JSON
                </button>
                <button
                  onClick={() => handleDownload('csv')}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 15px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: '#5d4037'
                  }}
                >
                  Download CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showEditForm && (
        <div style={{ 
          backgroundColor: '#f7f3f0', 
          padding: '20px', 
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#72542b', marginTop: 0 }}>Edit Dividend History Data</h3>
          {dividends.map((dividend, index) => (
            <div key={index} style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr 2fr auto',
              gap: '10px',
              alignItems: 'center',
              marginBottom: '10px',
              padding: '10px',
              backgroundColor: '#fdfcfb',
              borderRadius: '4px'
            }}>
              <input
                type="number"
                value={dividend.year}
                onChange={(e) => updateDividend(index, 'year', e.target.value)}
                style={{
                  padding: '8px',
                  border: '1px solid #d4c4b0',
                  borderRadius: '4px'
                }}
                placeholder="Year"
              />
              <input
                type="number"
                step="0.01"
                value={dividend.amount}
                onChange={(e) => updateDividend(index, 'amount', e.target.value)}
                style={{
                  padding: '8px',
                  border: '1px solid #d4c4b0',
                  borderRadius: '4px'
                }}
                placeholder="Amount per Share"
              />
              <input
                type="date"
                value={dividend.paymentDate}
                onChange={(e) => updateDividend(index, 'paymentDate', e.target.value)}
                style={{
                  padding: '8px',
                  border: '1px solid #d4c4b0',
                  borderRadius: '4px'
                }}
              />
              <button
                onClick={() => removeDividend(index)}
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
              onClick={addDividend}
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
              Add Dividend
            </button>
            <button
              onClick={saveDividendData}
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

      {dividends.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          color: '#72542b'
        }}>
          <p>No dividend data available. Click "Edit Data" to add your first dividend entry.</p>
        </div>
      ) : (
        <div style={{ 
          backgroundColor: '#f7f3f0',
          padding: '15px',
          borderRadius: '6px'
        }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            color: '#5d4037'
          }}>
            <thead>
              <tr style={{ 
                borderBottom: '2px solid #d4c4b0'
              }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Year</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Amount per Share</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Payment Date</th>
              </tr>
            </thead>
            <tbody>
              {dividends
                .sort((a, b) => b.year - a.year)
                .map((div, index) => (
                <tr key={index} style={{ 
                  borderBottom: '1px solid #e8ddd4'
                }}>
                  <td style={{ padding: '12px' }}>{div.year}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>${div.amount.toFixed(2)}</td>
                  <td style={{ padding: '12px' }}>{div.paymentDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Main Capital Structure Component
const CapitalStructure = () => {
  const [activeSection, setActiveSection] = useState('cap-table');
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
    { id: 'cap-table', label: 'Cap Table' },
    { id: 'irr-investments', label: 'IRR on Investments' },
    { id: 'investment-ratios', label: 'Investment Ratios' },
    { id: 'dividend-history', label: 'Dividend History' },
    { id: 'loan-repayments', label: 'Loan Repayments' },
    { id: 'default-flags', label: 'Default Flags' }
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
            margin: '0 0 20px 0',
            padding: '15px',
            backgroundColor: '#fdfcfb',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            flexWrap: 'wrap',
            overflowX: 'auto'
          }}>
            {sectionButtons.map((button) => (
              <button
                key={button.id}
                onClick={() => setActiveSection(button.id)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: activeSection === button.id ? '#5d4037' : '#e8ddd4',
                  color: activeSection === button.id ? '#fdfcfb' : '#5d4037',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {button.label}
              </button>
            ))}
          </div>

          <CapTable activeSection={activeSection} />
          <IRRInvestments activeSection={activeSection} />
          <InvestmentRatios activeSection={activeSection} />
          <DividendHistory activeSection={activeSection} />
          <LoanRepayments activeSection={activeSection} />
          <DefaultFlags activeSection={activeSection} />
        </div>
      </div>
    </div>
  );
};

export default CapitalStructure;