import { Info, CheckCircle, XCircle, Target, Shield, Zap } from "lucide-react";
import { useState, useEffect } from "react";

function GrowthSuiteLanding() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const checkSidebarState = () => {
      setIsSidebarCollapsed(document.body.classList.contains("sidebar-collapsed"));
    };

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

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #faf7f2 0%, #f5f0e1 100%)',
      padding: `40px 24px 40px ${isSidebarCollapsed ? "100px" : "270px"}`,
      margin: "0",
      width: '100%',
      boxSizing: 'border-box',
      transition: 'padding 0.3s ease'
    }}>
      <div style={{
        maxWidth: '100%',
        margin: '0 auto',
        width: '100%'
      }}>
        {/* Hero Section */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(125, 90, 80, 0.08)',
          padding: '48px',
          marginBottom: '32px',
          border: '1px solid #f0e6d9'
        }}>
          <div style={{
            borderLeft: '6px solid #a67c52',
            paddingLeft: '32px',
            marginBottom: '32px'
          }}>
            <h1 style={{
              fontSize: '48px',
              fontWeight: '800',
              color: '#4a352f',
              marginBottom: '16px',
              lineHeight: '1.2',
              letterSpacing: '-0.02em'
            }}>
              Growth Suite Overview
            </h1>
            <p style={{
              fontSize: '18px',
              color: '#7d5a50',
              fontStyle: 'italic',
              fontWeight: '500'
            }}>
              Decision support and risk management for resilient, investable businesses
            </p>
          </div>

          {/* Main Content Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
            gap: '32px',
            marginBottom: '40px'
          }}>
            {/* What It Is */}
            <div style={{
              background: 'linear-gradient(135deg, #f5f0e1 0%, #faf7f2 100%)',
              borderRadius: '16px',
              padding: '32px',
              border: '2px solid #e6d7c3'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <Target size={28} style={{ color: '#a67c52', marginRight: '12px' }} />
                <h2 style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: '#4a352f',
                  margin: 0
                }}>
                  What the BIG Growth Suite is
                </h2>
              </div>

              <p style={{
                fontSize: '17px',
                lineHeight: '1.7',
                color: '#4a352f',
                marginBottom: '24px'
              }}>
                A <strong style={{ color: '#a67c52' }}>decision support and risk management system</strong> developed 
                from real management consulting engagements, designed to help founders, executives, boards, funders, 
                and partners answer one question:
              </p>

              <div style={{
                background: 'white',
                borderLeft: '4px solid #a67c52',
                padding: '24px',
                borderRadius: '0 12px 12px 0',
                boxShadow: '0 4px 12px rgba(125, 90, 80, 0.08)',
                marginBottom: '24px'
              }}>
                <p style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#7d5a50',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  "Is this business resilient, investable, and scalable — and what could break it?"
                </p>
              </div>

              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid #e6d7c3'
              }}>
                <p style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#4a352f',
                  marginBottom: '16px'
                }}>
                  It:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    "Abstracts complexity",
                    "Surfaces risk early",
                    "Focuses on key value drivers",
                    "Reduces cognitive load for SMEs",
                    "Trains founders to think like boards and funders"
                  ].map((item, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px'
                    }}>
                      <CheckCircle size={20} style={{ 
                        color: '#a67c52', 
                        flexShrink: 0,
                        marginTop: '2px'
                      }} />
                      <span style={{
                        fontSize: '15px',
                        color: '#4a352f',
                        lineHeight: '1.6'
                      }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* What It's NOT */}
            <div style={{
              background: 'linear-gradient(135deg, #faf7f2 0%, #f5f0e1 100%)',
              borderRadius: '16px',
              padding: '32px',
              border: '2px solid #e6d7c3'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <XCircle size={28} style={{ color: '#7d5a50', marginRight: '12px' }} />
                <h2 style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: '#4a352f',
                  margin: 0
                }}>
                  What the BIG Growth Suite is NOT
                </h2>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '12px'
              }}>
                {[
                  "ERP",
                  "CRM",
                  "HR system",
                  "Accounting software",
                  "Workflow tool",
                  "ESG reporting platform"
                ].map((item, index) => (
                  <div key={index} style={{
                    background: 'white',
                    padding: '16px',
                    borderRadius: '10px',
                    border: '2px solid #e6d7c3',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.2s ease',
                    cursor: 'default'
                  }}>
                    <span style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: '#7d5a50'
                    }}>
                      ✕
                    </span>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#4a352f'
                    }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              {/* Positioning Statement */}
              <div style={{
                marginTop: '24px',
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                border: '2px solid #c8b6a6',
                boxShadow: '0 4px 12px rgba(166, 124, 82, 0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  <Shield size={24} style={{ color: '#a67c52' }} />
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#4a352f'
                  }}>
                    Positioning
                  </span>
                </div>
                <p style={{
                  fontSize: '16px',
                  lineHeight: '1.7',
                  color: '#4a352f',
                  margin: 0
                }}>
                  It sits <strong style={{ color: '#a67c52' }}>above</strong> operational systems 
                  and focuses on <strong style={{ color: '#a67c52' }}>interpretation, prioritisation, 
                  and judgement</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Design Principles */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            border: '2px solid #e6d7c3',
            marginBottom: '24px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <Zap size={28} style={{ color: '#a67c52', marginRight: '12px' }} />
              <h2 style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#4a352f',
                margin: 0
              }}>
                Design principles
              </h2>
              <span style={{
                marginLeft: '12px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#7d5a50',
                background: '#f5f0e1',
                padding: '4px 12px',
                borderRadius: '20px'
              }}>
                non-negotiable
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '16px'
            }}>
              {[
                { label: "Decision-led, not data-led", gradient: "linear-gradient(135deg, #f5f0e1 0%, #faf7f2 100%)" },
                { label: "Risk-weighted, not activity-driven", gradient: "linear-gradient(135deg, #e6d7c3 0%, #f5f0e1 100%)" },
                { label: "Modular (switch on/off by relevance)", gradient: "linear-gradient(135deg, #f0e6d9 0%, #e6d7c3 100%)" },
                { label: "Board- and funder-credible", gradient: "linear-gradient(135deg, #faf7f2 0%, #f0e6d9 100%)" },
                { label: "AI as analyst, not operator", gradient: "linear-gradient(135deg, #f5f0e1 0%, #e6d7c3 100%)" }
              ].map((principle, index) => (
                <div key={index} style={{
                  background: principle.gradient,
                  borderLeft: '4px solid #a67c52',
                  padding: '20px',
                  borderRadius: '0 12px 12px 0',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(125, 90, 80, 0.06)'
                }}>
                  <span style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#4a352f',
                    lineHeight: '1.5'
                  }}>
                    {principle.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Financial Disclaimer */}
        <div style={{
          background: 'linear-gradient(135deg, #e6d7c3 0%, #c8b6a6 100%)',
          borderRadius: '20px',
          padding: '40px',
          border: '3px solid #a67c52',
          boxShadow: '0 12px 40px rgba(166, 124, 82, 0.15)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(125, 90, 80, 0.2)'
            }}>
              <Info size={32} style={{ color: '#a67c52' }} />
            </div>
            <div>
              <h3 style={{
                fontSize: '28px',
                fontWeight: '800',
                color: '#4a352f',
                margin: 0,
                marginBottom: '4px'
              }}>
                Financial Information Disclaimer
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#7d5a50',
                margin: 0,
                fontWeight: '500'
              }}>
                Important information about data accuracy and verification
              </p>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            border: '2px solid #a67c52',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              fontSize: '15px',
              lineHeight: '1.8',
              color: '#4a352f'
            }}>
              <p style={{ margin: 0 }}>
                Financial metrics, ratios, and scores displayed on BIG Marketplace are calculated based on financial information{' '}
                <strong style={{ color: '#7d5a50' }}>
                  provided by the business, including profit and loss statements, balance sheets, and cash flow statements, as submitted by the user
                </strong>.
              </p>
              <p style={{ margin: 0 }}>
                These financial statements are{' '}
                <strong style={{ color: '#7d5a50' }}>
                  accepted and processed as presented
                </strong>{' '}
                and are not independently verified unless explicitly stated otherwise.
              </p>
              <p style={{ margin: 0 }}>
                Where enhanced verification is required by a funder, corporate, or the business itself, BIG Marketplace may 
                request additional supporting information, including but not limited to trial balances, accounting system access, or 
                supplementary schedules, in order to validate or confirm reported figures.
              </p>
              <div style={{
                background: 'linear-gradient(135deg, #f5f0e1 0%, #e6d7c3 50%)',
                borderLeft: '4px solid #a67c52',
                padding: '20px',
                borderRadius: '0 12px 12px 0',
                marginTop: '8px'
              }}>
                <p style={{ 
                  margin: 0,
                  fontWeight: '600',
                  color: '#4a352f'
                }}>
                  BIG Marketplace assumes responsibility for the accuracy, completeness, or appropriateness of financial information 
                  supplied by users only when such information has undergone a formal verification or validation process facilitated by the platform.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GrowthSuiteLanding;