import { useState, useEffect } from "react";

function OverallCompanyHealth() {
  const [aiInsights, setAiInsights] = useState({});
  const [loading, setLoading] = useState({});
  const [isInvestorView, setIsInvestorView] = useState(false);
  const [viewingSMEId, setViewingSMEId] = useState(null);
  const [viewingSMEName, setViewingSMEName] = useState("");
  const [viewOrigin, setViewOrigin] = useState("investor");

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

  useEffect(() => {
    // Check for investor/catalyst view mode
    const investorViewMode = sessionStorage.getItem("investorViewMode");
    const smeId = sessionStorage.getItem("viewingSMEId");
    const smeName = sessionStorage.getItem("viewingSMEName");
    const origin = sessionStorage.getItem("viewOrigin");

    if (investorViewMode === "true" && smeId) {
      setIsInvestorView(true);
      setViewingSMEId(smeId);
      setViewingSMEName(smeName || "SME");
      setViewOrigin(origin || "investor");
    }
  }, []);

  const handleExitInvestorView = () => {
    // Clear all session storage items
    sessionStorage.removeItem("viewingSMEId");
    sessionStorage.removeItem("viewingSMEName");
    sessionStorage.removeItem("investorViewMode");
    sessionStorage.removeItem("viewOrigin");
    
    // Navigate based on origin
    if (viewOrigin === "catalyst") {
      window.location.href = "/catalyst/cohorts"; // Go back to Catalyst cohorts
    } else {
      window.location.href = "/my-cohorts"; // Go back to Investor cohorts
    }
  };

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
      baseAnalysis: "Strong strategic alignment with clear execution pathway",
      aiPrompt: "Analyzing strategic KPIs and market positioning..."
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
      baseAnalysis: "Liquidity requires monitoring, profitability trending positive",
      aiPrompt: "Analyzing cash flow patterns and market volatility impact..."
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
      baseAnalysis: "Operational systems stable and scalable",
      aiPrompt: "Optimizing workflow efficiency and resource allocation..."
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
      baseAnalysis: "Key person dependency identified, succession planning needed",
      aiPrompt: "Analyzing team structure and skill gap risks..."
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
      baseAnalysis: "Pipeline building, revenue concentration being addressed",
      aiPrompt: "Evaluating campaign performance and market trends..."
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
      baseAnalysis: "ESG framework in place and operating effectively",
      aiPrompt: "Assessing sustainability metrics and compliance standards..."
    }
  ];

  // Simulate AI analysis for each category
  useEffect(() => {
    const generateAIInsights = async () => {
      // Simulate AI analysis for each category
      healthData.forEach((item, index) => {
        setTimeout(() => {
          setLoading(prev => ({ ...prev, [index]: true }));
          
          // Simulate API call delay
          setTimeout(() => {
            const insights = {
              "Strategy & Execution": "AI Analysis: Strategic clarity scores 92/100. Market positioning shows 15% improvement in competitive advantage. Recommendation: Maintain current trajectory with quarterly strategy reviews.",
              
              "Finance": "AI Analysis: Liquidity ratio at 1.8 (target: 2.0). Profit margin trending +8% QoQ. Cash runway: 14 months. Alert: Consider optimizing AR collection to improve liquidity.",
              
              "Operations": "AI Analysis: Operational efficiency index: 94%. Supply chain resilience score: 88/100. Scalability readiness: 92%. No immediate interventions required.",
              
              "People Health": "AI Analysis: Critical alert: 3 key personnel with single points of failure. Succession risk: High. Recommended: Implement knowledge transfer program within 30 days.",
              
              "Marketing": "AI Analysis: Pipeline conversion rate: 68% (above industry avg). Revenue concentration risk: Top 2 customers = 45% of revenue. Action: Diversification strategy needed.",
              
              "ESG": "AI Analysis: ESG rating: A-. Carbon footprint reduced by 12% YoY. Governance score: 91/100. Social impact metrics showing positive community engagement trend."
            };
            
            setAiInsights(prev => ({ ...prev, [index]: insights[item.category] }));
            setLoading(prev => ({ ...prev, [index]: false }));
          }, 800);
        }, index * 200); // Stagger the loading effects
      });
    };

    generateAIInsights();
  }, []);

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

  const getAnalysisDisplay = (index, row) => {
    if (loading[index]) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <div style={{
            width: '16px',
            height: '16px',
            border: '2px solid #e8ddd4',
            borderTopColor: '#7d5a50',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <span style={{ fontSize: '12px', color: '#7d5a50' }}>AI analyzing...</span>
        </div>
      );
    }

    if (aiInsights[index]) {
      return (
        <div style={{ position: 'relative' }}>
          <p style={{
            fontSize: '13px',
            color: '#4a352f',
            lineHeight: '1.6',
            textAlign: 'center',
            margin: 0,
            backgroundColor: '#f0f9ff',
            padding: '10px',
            borderRadius: '6px',
            borderLeft: '3px solid #7d5a50'
          }}>
            {aiInsights[index]}
          </p>
          <div style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            backgroundColor: '#7d5a50',
            color: '#fdfcfb',
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '12px',
            fontWeight: '600'
          }}>
            AI
          </div>
        </div>
      );
    }

    return (
      <div>
        <p style={{
          fontSize: '13px',
          color: '#4a352f',
          lineHeight: '1.6',
          textAlign: 'center',
          margin: 0,
          fontStyle: 'italic'
        }}>
          {row.baseAnalysis}
        </p>
        <p style={{
          fontSize: '11px',
          color: '#7d5a50',
          textAlign: 'center',
          margin: '8px 0 0',
          opacity: 0.7
        }}>
          {row.aiPrompt}
        </p>
      </div>
    );
  };

  // Add CSS animation
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f7f3f0',
      margin: "0",
      width: '100%',
      boxSizing: 'border-box',
      transition: 'padding 0.3s ease'
    }}>
      <div style={{ maxWidth: '100%', margin: '0 auto', width: '100%' }}>
        {/* Investor/Catalyst View Banner */}
        {isInvestorView && (
          <div
            style={{
              backgroundColor: "#e8f5e9",
              padding: "16px 20px",
              margin: "0 20px 20px 20px",
              borderRadius: "8px",
              border: "2px solid #4caf50",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "20px" }}>👁️</span>
              <span style={{ color: "#2e7d32", fontWeight: "600", fontSize: "15px" }}>
                {viewOrigin === "catalyst" 
                  ? `Catalyst View: Viewing ${viewingSMEName}'s Company Health`
                  : `Investor View: Viewing ${viewingSMEName}'s Company Health`
                }
              </span>
            </div>
            <button
              onClick={handleExitInvestorView}
              style={{
                padding: "8px 16px",
                backgroundColor: "#4caf50",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                transition: "background-color 0.3s ease",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = "#45a049"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "#4caf50"}
            >
              <span>←</span>
              {viewOrigin === "catalyst" 
                ? "Back to Catalyst Cohorts"
                : "Back to My Cohorts"
              }
            </button>
          </div>
        )}

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

        {/* AI Summary Banner */}
        <div style={{
          backgroundColor: '#5d4037',
          margin: '0 20px 20px',
          padding: '16px 24px',
          borderRadius: '8px',
          color: '#fdfcfb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16v-4"></path>
              <circle cx="12" cy="8" r="0.5" fill="currentColor"></circle>
            </svg>
            <div>
              <span style={{ fontWeight: '600', fontSize: '14px' }}>AI Executive Summary</span>
              <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.9 }}>
                Overall health: 4 categories healthy, 2 requiring attention. Primary risks in People Health and Finance.
                Recommended actions: Succession planning, AR optimization, revenue diversification.
              </p>
            </div>
          </div>
          <span style={{
            backgroundColor: '#f0f9ff',
            color: '#065f46',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            Updated 2 min ago
          </span>
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
              <div>AI Analysis</div>
              <div style={{ fontSize: '11px', fontWeight: '400', marginTop: '4px', opacity: '0.9' }}>
                (AI-powered insights)
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
                ':hover': {
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

              {/* AI Analysis */}
              <div style={{
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {getAnalysisDisplay(index, row)}
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
            Generate AI Health Report
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
            Export Analysis
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