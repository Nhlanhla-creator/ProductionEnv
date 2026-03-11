import React, { useState, useEffect } from 'react';
import { Bar, Pie, Doughnut, Radar } from 'react-chartjs-2';
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
  RadialLinearScale,
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
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
);

// RedFlags Component
const RedFlags = ({ activeSection }) => {
  if (activeSection !== 'red-flags') return null;

  const categories = [
    { name: 'Missed Payments', count: 12, severity: 'High' },
    { name: 'Overdue Reporting', count: 8, severity: 'Medium' },
    { name: 'Contract Violations', count: 5, severity: 'High' },
    { name: 'Quality Issues', count: 15, severity: 'Medium' },
    { name: 'Regulatory Warnings', count: 3, severity: 'Critical' }
  ];

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'Critical': return '#F44336';
      case 'High': return '#FF9800';
      case 'Medium': return '#FFC107';
      case 'Low': return '#8BC34A';
      default: return '#9E9E9E';
    }
  };

  return (
    <div style={{ 
      backgroundColor: '#fdfcfb', 
      padding: '20px', 
      margin: '20px 0',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <h2 style={{ color: '#5d4037', marginTop: 0 }}>Red Flags Dashboard</h2>
      
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {categories.map((category, index) => (
          <div key={index} style={{ 
            backgroundColor: '#f7f3f0',
            padding: '15px',
            borderRadius: '6px',
            borderLeft: `4px solid ${getSeverityColor(category.severity)}`
          }}>
            <h3 style={{ color: '#72542b', marginTop: 0 }}>{category.name}</h3>
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ 
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#5d4037'
              }}>
                {category.count}
              </span>
              <span style={{
                padding: '4px 10px',
                borderRadius: '4px',
                backgroundColor: getSeverityColor(category.severity),
                color: 'white',
                fontWeight: '500'
              }}>
                {category.severity}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ height: '400px' }}>
        <Bar 
          data={{
            labels: categories.map(c => c.name),
            datasets: [{
              label: 'Red Flag Count',
              data: categories.map(c => c.count),
              backgroundColor: categories.map(c => getSeverityColor(c.severity)),
              borderColor: '#5d4037',
              borderWidth: 1
            }]
          }}
          options={{
            responsive: true,
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
                  text: 'Number of Incidents'
                }
              }
            }
          }}
        />
      </div>
    </div>
  );
};

// LegalCompliance Component
const LegalCompliance = ({ activeSection }) => {
  if (activeSection !== 'legal-compliance') return null;

  const complianceAreas = [
    { name: 'Data Protection', status: 'Compliant', lastAudit: '2023-05-15' },
    { name: 'Labor Laws', status: 'Non-Compliant', lastAudit: '2023-04-22' },
    { name: 'Environmental', status: 'Partially Compliant', lastAudit: '2023-06-10' },
    { name: 'Tax Regulations', status: 'Compliant', lastAudit: '2023-03-30' },
    { name: 'Industry Specific', status: 'Non-Compliant', lastAudit: '2023-07-05' }
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'Compliant': return '#4CAF50';
      case 'Partially Compliant': return '#FFC107';
      case 'Non-Compliant': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  return (
    <div style={{ 
      backgroundColor: '#fdfcfb', 
      padding: '20px', 
      margin: '20px 0',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <h2 style={{ color: '#5d4037', marginTop: 0 }}>Legal & Compliance Status</h2>
      
      <div style={{ overflowX: 'auto', marginBottom: '30px' }}>
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
              <th style={{ padding: '12px', textAlign: 'left' }}>Area</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Last Audit</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Action</th>
            </tr>
          </thead>
          <tbody>
{complianceAreas.map((area, index) => (
  <tr key={index} style={{ 
    borderBottom: '1px solid #e8ddd4'
  }}>
                <td style={{ padding: '12px' }}>{area.name}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    backgroundColor: getStatusColor(area.status),
                    color: 'white',
                    display: 'inline-block'
                  }}>
                    {area.status}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>{area.lastAudit}</td>
                <td style={{ padding: '12px' }}>
                  <button style={{
                    padding: '6px 12px',
                    backgroundColor: area.status === 'Non-Compliant' ? '#F44336' : '#9c7c5f',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}>
                    {area.status === 'Non-Compliant' ? 'Remediate' : 'View Details'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ 
        backgroundColor: '#f7f3f0',
        padding: '20px',
        borderRadius: '6px'
      }}>
        <h3 style={{ color: '#72542b', marginTop: 0 }}>Compliance Summary</h3>
        <div style={{ 
          display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginTop: '15px'
        }}>
          <div>
            <p style={{ color: '#5d4037', margin: '5px 0' }}>Total Areas</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#5d4037', margin: '5px 0' }}>5</p>
          </div>
          <div>
            <p style={{ color: '#5d4037', margin: '5px 0' }}>Fully Compliant</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50', margin: '5px 0' }}>2</p>
          </div>
          <div>
            <p style={{ color: '#5d4037', margin: '5px 0' }}>Non-Compliant</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#F44336', margin: '5px 0' }}>2</p>
          </div>
          <div>
            <p style={{ color: '#5d4037', margin: '5px 0' }}>Next Audit Due</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#5d4037', margin: '5px 0' }}>Oct 2023</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// InsuranceCoverage Component
const InsuranceCoverage = ({ activeSection }) => {
  if (activeSection !== 'insurance-coverage') return null;

  const policies = [
    { name: 'General Liability', coverage: 5000000, premium: 12000, expiry: '2024-03-15', status: 'Active' },
    { name: 'Professional Liability', coverage: 3000000, premium: 8500, expiry: '2023-12-01', status: 'Active' },
    { name: 'Property Insurance', coverage: 2500000, premium: 9500, expiry: '2023-09-30', status: 'Expiring Soon' },
    { name: 'Cyber Liability', coverage: 2000000, premium: 6500, expiry: '2024-06-20', status: 'Active' },
    { name: 'Directors & Officers', coverage: 5000000, premium: 15000, expiry: '2023-08-15', status: 'Expired' }
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'Active': return '#4CAF50';
      case 'Expiring Soon': return '#FFC107';
      case 'Expired': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  return (
    <div style={{ 
      backgroundColor: '#fdfcfb', 
      padding: '20px', 
      margin: '20px 0',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <h2 style={{ color: '#5d4037', marginTop: 0 }}>Insurance Coverage Status</h2>
      
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          backgroundColor: '#f7f3f0',
          padding: '20px',
          borderRadius: '6px'
        }}>
          <h3 style={{ color: '#72542b', marginTop: 0 }}>Total Coverage</h3>
          <p style={{ 
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#5d4037',
            margin: '10px 0'
          }}>
            ZAR {policies.reduce((sum, policy) => sum + policy.coverage, 0).toLocaleString()}
          </p>
          <p style={{ color: '#5d4037' }}>Across {policies.length} policies</p>
        </div>
        <div style={{ 
          backgroundColor: '#f7f3f0',
          padding: '20px',
          borderRadius: '6px'
        }}>
          <h3 style={{ color: '#72542b', marginTop: 0 }}>Annual Premium</h3>
          <p style={{ 
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#5d4037',
            margin: '10px 0'
          }}>
            ZAR {policies.reduce((sum, policy) => sum + policy.premium, 0).toLocaleString()}
          </p>
          <p style={{ color: '#5d4037' }}>{policies.filter(p => p.status === 'Expired').length} policies need renewal</p>
        </div>
      </div>

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
              <th style={{ padding: '12px', textAlign: 'left' }}>Policy</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Coverage (ZAR)</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Premium (ZAR)</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Expiry Date</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {policies.map((policy, index) => (
              <tr key={index} style={{ 
                borderBottom: '1px solid #e8ddd4'
              }}>
                <td style={{ padding: '12px' }}>{policy.name}</td>
                <td style={{ padding: '12px' }}>{policy.coverage.toLocaleString()}</td>
                <td style={{ padding: '12px' }}>{policy.premium.toLocaleString()}</td>
                <td style={{ padding: '12px' }}>{policy.expiry}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    backgroundColor: getStatusColor(policy.status),
                    color: 'white',
                    display: 'inline-block'
                  }}>
                    {policy.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// SectorRiskTracking Component
const SectorRiskTracking = ({ activeSection }) => {
  if (activeSection !== 'sector-risk-tracking') return null;

  const sectors = ['Agriculture', 'Manufacturing', 'Construction', 'Technology', 'Healthcare'];
  const riskFactors = ['Regulatory', 'Economic', 'Supply Chain', 'Competition', 'Technological'];
  
  const riskData = {
    labels: riskFactors,
    datasets: sectors.map((sector, index) => ({
      label: sector,
      data: riskFactors.map(() => Math.floor(Math.random() * 80) + 20),
      backgroundColor: [
        '#9c7c5f',
        '#e8ddd4',
        '#d4c4b0',
        '#b8a38d',
        '#a58f7a'
      ][index],
      borderColor: '#5d4037',
      borderWidth: 1
    }))
  };

  return (
    <div style={{ 
      backgroundColor: '#fdfcfb', 
      padding: '20px', 
      margin: '20px 0',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <h2 style={{ color: '#5d4037', marginTop: 0 }}>Sector-Specific Risk Tracking</h2>
      
      <div style={{ height: '500px' }}>
        <Radar 
          data={riskData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              r: {
                angleLines: {
                  display: true
                },
                suggestedMin: 0,
                suggestedMax: 100
              }
            },
            plugins: {
              legend: {
                position: 'top'
              }
            }
          }}
        />
      </div>

      <div style={{ 
        backgroundColor: '#f7f3f0',
        padding: '20px',
        borderRadius: '6px',
        marginTop: '30px'
      }}>
        <h3 style={{ color: '#72542b', marginTop: 0 }}>Risk Factor Descriptions</h3>
        <ul style={{ 
          listStyle: 'none',
          padding: 0,
          color: '#5d4037'
        }}>
          <li style={{ marginBottom: '10px' }}><strong>Regulatory:</strong> Changes in laws and regulations affecting the sector</li>
          <li style={{ marginBottom: '10px' }}><strong>Economic:</strong> Market conditions, inflation, and economic downturns</li>
          <li style={{ marginBottom: '10px' }}><strong>Supply Chain:</strong> Dependencies on suppliers and logistics</li>
          <li style={{ marginBottom: '10px' }}><strong>Competition:</strong> Market saturation and competitive pressures</li>
          <li style={{ marginBottom: '10px' }}><strong>Technological:</strong> Disruptive technologies and innovation pace</li>
        </ul>
      </div>
    </div>
  );
};

// KeyPersonDependency Component
const KeyPersonDependency = ({ activeSection }) => {
  if (activeSection !== 'key-person-dependency') return null;

  const keyPeople = [
    { name: 'CEO', dependencyScore: 85, backupPlan: 'Partial', skills: ['Leadership', 'Strategy', 'Investor Relations'] },
    { name: 'CTO', dependencyScore: 90, backupPlan: 'None', skills: ['Technology', 'Product', 'R&D'] },
    { name: 'CFO', dependencyScore: 75, backupPlan: 'Full', skills: ['Finance', 'Compliance', 'Investor Relations'] },
    { name: 'Head of Sales', dependencyScore: 80, backupPlan: 'Partial', skills: ['Sales', 'Client Relations', 'Negotiation'] }
  ];

  return (
    <div style={{ 
      backgroundColor: '#fdfcfb', 
      padding: '20px', 
      margin: '20px 0',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <h2 style={{ color: '#5d4037', marginTop: 0 }}>Key Person Dependency Risk</h2>
      
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {keyPeople.map((person, index) => (
          <div key={index} style={{ 
            backgroundColor: '#f7f3f0',
            padding: '20px',
            borderRadius: '6px'
          }}>
            <h3 style={{ color: '#72542b', marginTop: 0 }}>{person.name}</h3>
            <div style={{ 
              width: '100%',
              height: '20px',
              backgroundColor: '#e8ddd4',
              borderRadius: '10px',
              margin: '15px 0',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${person.dependencyScore}%`,
                height: '100%',
                backgroundColor: person.dependencyScore > 80 ? '#F44336' : 
                                person.dependencyScore > 60 ? '#FF9800' : '#4CAF50',
                borderRadius: '10px'
              }}></div>
            </div>
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '15px'
            }}>
              <span>Dependency Score:</span>
              <span style={{ fontWeight: 'bold' }}>{person.dependencyScore}/100</span>
            </div>
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '15px'
            }}>
              <span>Backup Plan:</span>
              <span style={{ 
                fontWeight: 'bold',
                color: person.backupPlan === 'Full' ? '#4CAF50' : 
                      person.backupPlan === 'Partial' ? '#FF9800' : '#F44336'
              }}>
                {person.backupPlan}
              </span>
            </div>
            <div>
              <p style={{ marginBottom: '5px' }}>Critical Skills:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {person.skills.map((skill, i) => (
                  <span key={i} style={{
                    padding: '4px 8px',
                    backgroundColor: '#e8ddd4',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ 
        backgroundColor: '#f7f3f0',
        padding: '20px',
        borderRadius: '6px'
      }}>
        <h3 style={{ color: '#72542b', marginTop: 0 }}>Mitigation Strategies</h3>
        <ul style={{ 
          listStyle: 'none',
          padding: 0,
          color: '#5d4037'
        }}>
          <li style={{ marginBottom: '10px' }}>• Develop succession plans for all key positions</li>
          <li style={{ marginBottom: '10px' }}>• Cross-train employees to reduce single-point dependencies</li>
          <li style={{ marginBottom: '10px' }}>• Implement knowledge sharing and documentation processes</li>
          <li style={{ marginBottom: '10px' }}>• Consider key person insurance for critical roles</li>
        </ul>
      </div>
    </div>
  );
};

// DisasterRecovery Component
const DisasterRecovery = ({ activeSection }) => {
  if (activeSection !== 'disaster-recovery') return null;

  const recoveryAreas = [
    { name: 'Data Backup', readiness: 90, lastTested: '2023-06-15' },
    { name: 'System Redundancy', readiness: 75, lastTested: '2023-05-20' },
    { name: 'Emergency Communication', readiness: 85, lastTested: '2023-07-01' },
    { name: 'Alternative Workspace', readiness: 60, lastTested: '2023-04-10' },
    { name: 'IT Recovery', readiness: 80, lastTested: '2023-06-30' }
  ];

  return (
    <div style={{ 
      backgroundColor: '#fdfcfb', 
      padding: '20px', 
      margin: '20px 0',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <h2 style={{ color: '#5d4037', marginTop: 0 }}>Disaster Recovery Readiness</h2>
      
      <div style={{ height: '400px', marginBottom: '30px' }}>
        <Bar 
          data={{
            labels: recoveryAreas.map(area => area.name),
            datasets: [{
              label: 'Readiness Score',
              data: recoveryAreas.map(area => area.readiness),
              backgroundColor: recoveryAreas.map(area => 
                area.readiness >= 85 ? '#4CAF50' : 
                area.readiness >= 70 ? '#FFC107' : '#F44336'),
              borderColor: '#5d4037',
              borderWidth: 1
            }]
          }}
          options={{
            responsive: true,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                title: {
                  display: true,
                  text: 'Readiness Score (%)'
                }
            }
            }
          }}
        />
      </div>

      <div style={{ 
        backgroundColor: '#f7f3f0',
        padding: '20px',
        borderRadius: '6px'
      }}>
        <h3 style={{ color: '#72542b', marginTop: 0 }}>Recovery Time Objectives</h3>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginTop: '15px'
        }}>
          <div>
            <p style={{ color: '#5d4037', margin: '5px 0' }}>Critical Systems</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#5d4037', margin: '5px 0' }}>4 hours</p>
          </div>
          <div>
            <p style={{ color: '#5d4037', margin: '5px 0' }}>Business Operations</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#5d4037', margin: '5px 0' }}>24 hours</p>
          </div>
          <div>
            <p style={{ color: '#5d4037', margin: '5px 0' }}>Full Recovery</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#5d4037', margin: '5px 0' }}>72 hours</p>
          </div>
        </div>
      </div>

      <div style={{ 
        marginTop: '30px',
        backgroundColor: '#f7f3f0',
        padding: '20px',
        borderRadius: '6px'
      }}>
        <h3 style={{ color: '#72542b', marginTop: 0 }}>Recent Tests & Updates</h3>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          color: '#5d4037',
          marginTop: '15px'
        }}>
          <thead>
            <tr style={{ 
              backgroundColor: '#e8ddd4',
              borderBottom: '2px solid #d4c4b0'
            }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Area</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Last Tested</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {recoveryAreas.map((area, index) => (
              <tr key={index} style={{ 
                borderBottom: '1px solid #e8ddd4'
              }}>
                <td style={{ padding: '12px' }}>{area.name}</td>
                <td style={{ padding: '12px' }}>{area.lastTested}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    backgroundColor: area.readiness >= 85 ? '#4CAF50' : 
                                    area.readiness >= 70 ? '#FFC107' : '#F44336',
                    color: 'white',
                    display: 'inline-block'
                  }}>
                    {area.readiness}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Main RiskManagement Component
const RiskManagement = () => {
  const [activeSection, setActiveSection] = useState('red-flags');

  const getContentStyles = () => ({
    width: '100%',
    marginLeft: '0',
    backgroundColor: '#f7f3f0',
    minHeight: '100vh',
    transition: 'padding 0.3s ease',
    boxSizing: 'border-box'
  });

  const sectionButtons = [
    { id: 'red-flags', label: 'Red Flags' },
    { id: 'legal-compliance', label: 'Legal/Compliance' },
    { id: 'insurance-coverage', label: 'Insurance' },
    { id: 'sector-risk-tracking', label: 'Sector Risk' },
    { id: 'key-person-dependency', label: 'Key Person Risk' },
    { id: 'disaster-recovery', label: 'Disaster Recovery' }
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
                  minWidth: '120px',
                  textAlign: 'center',
                  flexShrink: 0,
                  ':hover': {
                    backgroundColor: activeSection === button.id ? '#72542b' : '#d4c4b0',
                  }
                }}
              >
                {button.label}
              </button>
            ))}
          </div>

          <RedFlags activeSection={activeSection} />
          <LegalCompliance activeSection={activeSection} />
          <InsuranceCoverage activeSection={activeSection} />
          <SectorRiskTracking activeSection={activeSection} />
          <KeyPersonDependency activeSection={activeSection} />
          <DisasterRecovery activeSection={activeSection} />
        </div>
      </div>
    </div>
  );
};

export default RiskManagement;