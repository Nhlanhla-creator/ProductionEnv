import { useState, useEffect } from "react";

function OverallCompanyHealth() {
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

  // Demo data matching the screenshot structure
  const healthData = [
    {
      category: "Strategy & Execution",
      metrics: [
        "Strategic clarity",
        "Operating model fit",
        "Execution discipline",
        "Strategic risk control",
        "Change & adaptability"
      ],
      healthStatus: "healthy",
      riskLevel: "low",
      analysis: "Strong strategic alignment with clear execution pathway"
    },
    {
      category: "Finance",
      metrics: [
        "Solvency",
        "Liquidity",
        "Profitability trend",
        "Cost agility",
        "Cash survivability",
        "Investability"
      ],
      healthStatus: "watch",
      riskLevel: "medium",
      analysis: "Liquidity requires monitoring, profitability trending positive"
    },
    {
      category: "Operations",
      metrics: [
        "Supply chain resilience (if on)",
        "Delivery capacity",
        "Reliability",
        "Safety risk (if on)",
        "Scalability readiness"
      ],
      healthStatus: "healthy",
      riskLevel: "low",
      analysis: "Operational systems stable and scalable"
    },
    {
      category: "People Health",
      metrics: [
        "Overall",
        "Dependency Risk",
        "Execution Capacity",
        "Scalability Risk",
        "Continuity Risk",
        "External Credibility Risk"
      ],
      healthStatus: "risk",
      riskLevel: "high",
      analysis: "Key person dependency identified, succession planning needed"
    },
    {
      category: "Marketing",
      metrics: [
        "Pipeline visibility",
        "Pipeline sufficiency",
        "Pipeline quality",
        "Revenue concentration",
        "Demand sustainability"
      ],
      healthStatus: "watch",
      riskLevel: "medium",
      analysis: "Pipeline building, revenue concentration being addressed"
    },
    {
      category: "ESG",
      metrics: [
        "Environmental Risk",
        "Social Risk",
        "Governance Risk"
      ],
      healthStatus: "healthy",
      riskLevel: "low",
      analysis: "ESG framework in place and operating effectively"
    }
  ];

  const getStatusIndicator = (status) => {
    const colors = {
      healthy: '#16a34a', // Green
      watch: '#f59e0b',   // Amber
      risk: '#dc2626'     // Red
    };
    return {
      backgroundColor: colors[status] || '#94a3b8',
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      margin: '0 auto',
      border: '2px solid #fdfcfb',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    };
  };

  const getRiskBadge = (level) => {
    const styles = {
      low: {
        backgroundColor: '#d1fae5',
        color: '#065f46',
        border: '1px solid #6ee7b7'
      },
      medium: {
        backgroundColor: '#fef3c7',
        color: '#92400e',
        border: '1px solid #fcd34d'
      },
      high: {
        backgroundColor: '#fee2e2',
        color: '#991b1b',
        border: '1px solid #fca5a5'
      }
    };
    return styles[level] || { backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1' };
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f7f3f0',
      padding: `70px 20px 20px ${isSidebarCollapsed ? "100px" : "270px"}`,
      margin: "0",
      width: '100%',
      boxSizing: 'border-box',
      transition: 'padding 0.3s ease'
    }}>
      <div style={{ maxWidth: '100%', margin: '0 auto', width: '100%' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '30px', paddingLeft: '20px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#5d4037',
            marginBottom: '10px',
            marginTop: 0
          }}>
            Overall Company Health
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#7d5a50',
            fontWeight: '500',
            margin: 0
          }}>
            Comprehensive health assessment across all business dimensions
          </p>
        </div>

        {/* Health Assessment Table */}
        <div style={{
          backgroundColor: '#fdfcfb',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(93, 64, 55, 0.1)',
          overflow: 'hidden',
          border: '1px solid #e8ddd4',
          margin: '0 20px'
        }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 2fr 1.5fr 1.5fr 2fr',
            backgroundColor: '#5d4037',
            color: '#fdfcfb',
            fontWeight: '600',
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            <div style={{
              padding: '15px 20px',
              borderRight: '1px solid rgba(253, 252, 251, 0.2)'
            }}>
              Category
            </div>
            <div style={{
              padding: '15px 20px',
              borderRight: '1px solid rgba(253, 252, 251, 0.2)'
            }}>
              Metrics
            </div>
            <div style={{
              padding: '15px 20px',
              textAlign: 'center',
              borderRight: '1px solid rgba(253, 252, 251, 0.2)'
            }}>
              <div>Health Status</div>
              <div style={{ fontSize: '11px', fontWeight: '400', marginTop: '4px', opacity: '0.9' }}>
                🟢 Healthy 🟡 Watch 🔴 Risk
              </div>
            </div>
            <div style={{
              padding: '15px 20px',
              textAlign: 'center',
              borderRight: '1px solid rgba(253, 252, 251, 0.2)'
            }}>
              <div>Risk Level</div>
              <div style={{ fontSize: '11px', fontWeight: '400', marginTop: '4px', opacity: '0.9' }}>
                (Low, Medium, High)
              </div>
            </div>
            <div style={{
              padding: '15px 20px',
              textAlign: 'center'
            }}>
              <div>Analysis</div>
              <div style={{ fontSize: '11px', fontWeight: '400', marginTop: '4px', opacity: '0.9' }}>
                (Summary of AI analysis in each section)
              </div>
            </div>
          </div>

          {/* Table Body */}
          {healthData.map((row, index) => (
            <div
              key={index}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 2fr 1.5fr 1.5fr 2fr',
                borderBottom: index < healthData.length - 1 ? '1px solid #e8ddd4' : 'none',
                backgroundColor: index % 2 === 0 ? '#fdfcfb' : '#f7f3f0',
                transition: 'background-color 0.2s ease',
                '&:hover': {
                  backgroundColor: '#f5f0eb'
                }
              }}
            >
              {/* Category */}
              <div style={{
                padding: '20px',
                borderRight: '1px solid #e8ddd4',
                fontWeight: '600',
                color: '#5d4037',
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center'
              }}>
                {row.category}
              </div>

              {/* Metrics */}
              <div style={{
                padding: '20px',
                borderRight: '1px solid #e8ddd4',
                display: 'flex',
                alignItems: 'center'
              }}>
                <div>
                  {row.metrics.map((metric, idx) => (
                    <div
                      key={idx}
                      style={{
                        fontSize: '13px',
                        color: '#4a352f',
                        marginBottom: idx < row.metrics.length - 1 ? '6px' : '0',
                        lineHeight: '1.4',
                        padding: '2px 0'
                      }}
                    >
                      • {metric}
                    </div>
                  ))}
                </div>
              </div>

              {/* Health Status */}
              <div style={{
                padding: '20px',
                borderRight: '1px solid #e8ddd4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={getStatusIndicator(row.healthStatus)}></div>
              </div>

              {/* Risk Level */}
              <div style={{
                padding: '20px',
                borderRight: '1px solid #e8ddd4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{
                  ...getRiskBadge(row.riskLevel),
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  textTransform: 'capitalize'
                }}>
                  {row.riskLevel}
                </span>
              </div>

              {/* Analysis */}
              <div style={{
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <p style={{
                  fontSize: '13px',
                  color: '#4a352f',
                  lineHeight: '1.6',
                  textAlign: 'center',
                  margin: 0,
                  fontStyle: 'italic'
                }}>
                  {row.analysis}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{
          marginTop: '30px',
          display: 'flex',
          justifyContent: 'center',
          gap: '15px',
          flexWrap: 'wrap',
          padding: '0 20px'
        }}>
          <button style={{
            padding: '12px 24px',
            backgroundColor: '#7d5a50',
            color: '#fdfcfb',
            fontWeight: '600',
            fontSize: '14px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#5d4037';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#7d5a50';
          }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            Generate Health Report
          </button>
          
          <button style={{
            padding: '12px 24px',
            backgroundColor: '#e8ddd4',
            color: '#5d4037',
            fontWeight: '600',
            fontSize: '14px',
            borderRadius: '6px',
            border: '1px solid #d4c4b0',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#d4c4b0';
            e.currentTarget.style.borderColor = '#7d5a50';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#e8ddd4';
            e.currentTarget.style.borderColor = '#d4c4b0';
          }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export Data
          </button>
        </div>

        {/* Legend */}
        <div style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#fdfcfb',
          borderRadius: '8px',
          border: '1px solid #e8ddd4',
          margin: '30px 20px 0'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#5d4037',
            marginTop: 0,
            marginBottom: '15px'
          }}>
            Status Legend
          </h3>
          <div style={{
            display: 'flex',
            gap: '20px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: '#16a34a'
              }}></div>
              <span style={{ fontSize: '13px', color: '#4a352f' }}>Healthy - Good performance, minimal risk</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: '#f59e0b'
              }}></div>
              <span style={{ fontSize: '13px', color: '#4a352f' }}>Watch - Requires monitoring, some risk</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: '#dc2626'
              }}></div>
              <span style={{ fontSize: '13px', color: '#4a352f' }}>Risk - Immediate attention required</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OverallCompanyHealth;