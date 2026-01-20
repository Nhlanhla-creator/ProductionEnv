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
      healthy: '#10b981',
      watch: '#f59e0b',
      risk: '#ef4444'
    };
    return {
      backgroundColor: colors[status] || '#94a3b8',
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      margin: '0 auto'
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
      background: 'linear-gradient(135deg, #faf7f2 0%, #f5f0e1 100%)',
      padding: `70px 24px 40px ${isSidebarCollapsed ? "100px" : "270px"}`,
      margin: "0",
      width: '100%',
      boxSizing: 'border-box',
      transition: 'padding 0.3s ease'
    }}>
      <div style={{ maxWidth: '100%', margin: '0 auto', width: '100%' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '42px',
            fontWeight: '800',
            color: '#4a352f',
            marginBottom: '8px',
            letterSpacing: '-0.02em'
          }}>
            Overall Company Health
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#7d5a50',
            fontWeight: '500'
          }}>
            Comprehensive health assessment across all business dimensions
          </p>
        </div>

        {/* Health Assessment Table */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(125, 90, 80, 0.08)',
          overflow: 'hidden',
          border: '1px solid #e6d7c3'
        }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 2fr 1.5fr 1.5fr 2fr',
            background: 'linear-gradient(135deg, #a67c52 0%, #7d5a50 100%)',
            color: 'white',
            fontWeight: '600',
            fontSize: '14px'
          }}>
            <div style={{
              padding: '20px 24px',
              borderRight: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              Category
            </div>
            <div style={{
              padding: '20px 24px',
              borderRight: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              Metrics
            </div>
            <div style={{
              padding: '20px 24px',
              textAlign: 'center',
              borderRight: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div>Health Status</div>
              <div style={{ fontSize: '11px', fontWeight: '400', marginTop: '4px', opacity: '0.9' }}>
                🟢 Healthy 🟡 Watch 🔴 Risk
              </div>
            </div>
            <div style={{
              padding: '20px 24px',
              textAlign: 'center',
              borderRight: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div>Risk Level</div>
              <div style={{ fontSize: '11px', fontWeight: '400', marginTop: '4px', opacity: '0.9' }}>
                (Low, Medium, High)
              </div>
            </div>
            <div style={{
              padding: '20px 24px',
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
                borderBottom: index < healthData.length - 1 ? '1px solid #e6d7c3' : 'none',
                backgroundColor: index % 2 === 0 ? '#faf7f2' : 'white',
                transition: 'background-color 0.2s ease'
              }}
            >
              {/* Category */}
              <div style={{
                padding: '24px',
                borderRight: '1px solid #e6d7c3',
                fontWeight: '600',
                color: '#4a352f',
                fontSize: '15px'
              }}>
                {row.category}
              </div>

              {/* Metrics */}
              <div style={{
                padding: '24px',
                borderRight: '1px solid #e6d7c3'
              }}>
                {row.metrics.map((metric, idx) => (
                  <div
                    key={idx}
                    style={{
                      fontSize: '13px',
                      color: '#4a352f',
                      marginBottom: idx < row.metrics.length - 1 ? '6px' : '0',
                      lineHeight: '1.5'
                    }}
                  >
                    {metric}
                  </div>
                ))}
              </div>

              {/* Health Status */}
              <div style={{
                padding: '24px',
                borderRight: '1px solid #e6d7c3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={getStatusIndicator(row.healthStatus)}></div>
              </div>

              {/* Risk Level */}
              <div style={{
                padding: '24px',
                borderRight: '1px solid #e6d7c3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{
                  ...getRiskBadge(row.riskLevel),
                  padding: '6px 16px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  textTransform: 'capitalize'
                }}>
                  {row.riskLevel}
                </span>
              </div>

              {/* Analysis */}
              <div style={{
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <p style={{
                  fontSize: '13px',
                  color: '#4a352f',
                  lineHeight: '1.6',
                  textAlign: 'center',
                  margin: 0
                }}>
                  {row.analysis}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{
          marginTop: '32px',
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <button style={{
            padding: '14px 32px',
            background: 'linear-gradient(135deg, #a67c52 0%, #7d5a50 100%)',
            color: 'white',
            fontWeight: '600',
            fontSize: '15px',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(166, 124, 82, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(166, 124, 82, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(166, 124, 82, 0.3)';
          }}
          >
            Generate Health Report
          </button>
          
          <button style={{
            padding: '14px 32px',
            background: '#e6d7c3',
            color: '#4a352f',
            fontWeight: '600',
            fontSize: '15px',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#c8b6a6';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = '#e6d7c3';
          }}
          >
            Export Data
          </button>
        </div>
      </div>
    </div>
  );
}

export default OverallCompanyHealth;