import { useState } from "react"
import { ChevronDown, ChevronUp, Edit, ExternalLink, FileText, FileBarChart, TrendingUp, DollarSign, Building, Users, Heart, CheckSquare } from "lucide-react"
import FundabilityScoreCard from './FundabilityScoreCard'

const ApplicationSummary = ({ formData, onEdit }) => {
  const [expandedSections, setExpandedSections] = useState({
    applicationOverview: false,
    useOfFunds: false,
    enterpriseReadiness: false,
    financialOverview: false,
    growthPotential: false,
    socialImpact: false,
    declarationCommitment: false,
  })

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Add currency parsing function
  const parseCurrency = (value) => {
    if (!value) return 0
    return parseInt(value.toString().replace(/[^\d]/g, '')) || 0
  }

  const renderDocumentLink = (url, label = "View Document") => {
    if (!url) return <span style={{ color: '#7d5a50', fontStyle: 'italic' }}>No document uploaded</span>

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        background: 'linear-gradient(135deg, #a67c52, #7d5a50)',
        color: '#faf7f2',
        borderRadius: '8px',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        maxWidth: 'fit-content'
      }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(166, 124, 82, 0.3)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }}
        onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
      >
        <FileText size={16} />
        <span>{label}</span>
        <ExternalLink size={14} />
      </div>
    )
  }

  const formatFiles = (files) => {
    if (!files || !files.length) return "None"
    return files.map((file) => (typeof file === "string" ? file : file.name)).join(", ")
  }

  const formatArray = (arr) => {
    if (!arr || !arr.length) return "None specified"
    return arr.join(" • ")
  }

  const formatBoolean = (value) => (value ? "✅ Confirmed" : "❌ Pending")

  // Safe value formatter - removes double question marks issue
  const formatValue = (value, defaultText = "Not provided") => {
    if (value === null || value === undefined || value === "") {
      return defaultText
    }
    return value
  }

  const handleEdit = () => {
    if (onEdit) onEdit()
  }

  const handleNavigate = () => {
    // Add your navigation logic here
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from { 
            opacity: 0;
            transform: translateY(-16px);
            max-height: 0;
          }
          to { 
            opacity: 1;
            transform: translateY(0);
            max-height: 1000px;
          }
        }
        
        /* Responsive sidebar adjustments */
        @media (max-width: 1024px) {
          .application-summary-container {
            padding-left: 24px !important;
          }
          .header-grid {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 24px !important;
          }
        }
        
        @media (max-width: 768px) {
          .application-summary-container {
            padding: 16px !important;
          }
          .header-grid {
            gap: 16px !important;
          }
        }
        
        /* For collapsed sidebar state */
        .sidebar-collapsed .application-summary-container {
          padding-left: max(24px, calc(80px + 24px)) !important;
        }
      `}</style>

      <div
        className="application-summary-container"
        style={{
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #faf7f2 0%, #f5f0e1 50%, #f0e6d9 100%)',
          padding: "24px 24px 24px max(24px, calc(280px + 24px))",
          marginTop: "60px",
          transition: 'all 0.3s ease'
        }}>
        <div style={{
          width: '100%',
          maxWidth: 'none'
        }}>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))',
            backdropFilter: 'blur(20px)',
            borderRadius: "24px",
            padding: "32px",
            marginBottom: "32px",
            boxShadow: "0 20px 40px rgba(74, 53, 47, 0.1)",
            border: '1px solid rgba(200, 182, 166, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background decoration */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-20%',
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, rgba(166, 124, 82, 0.1) 0%, transparent 70%)',
              borderRadius: '50%'
            }} />

            <div
              className="header-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                gap: '32px',
                alignItems: 'center',
                position: 'relative',
                zIndex: 2
              }}>

              {/* Fundability Score */}
              <FundabilityScoreCard applicationData={formData} />

              {/* Title */}
              <div style={{ textAlign: 'center' }}>
                <h1 style={{
                  background: 'linear-gradient(135deg, #4a352f, #7d5a50)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: "36px",
                  fontWeight: '800',
                  margin: '0 0 8px 0',
                  letterSpacing: '-0.02em'
                }}>
                  Funding Application
                </h1>
                <p style={{
                  color: '#7d5a50',
                  fontSize: '18px',
                  margin: 0,
                  fontWeight: '500'
                }}>
                  Complete Application Summary
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={handleEdit}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 20px",
                  background: 'linear-gradient(135deg, #a67c52, #7d5a50)',
                  color: "#faf7f2",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: '0 4px 16px rgba(166, 124, 82, 0.3)',
                  minWidth: '140px',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 8px 24px rgba(166, 124, 82, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = '0 4px 16px rgba(166, 124, 82, 0.3)'
                }}
              >
                <Edit size={16} /> Edit Application
              </button>
            </div>
          </div>

          {/* Application Sections */}
          <div style={{
            display: 'grid',
            gap: '24px'
          }}>

            {/* Application Overview */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))',
              backdropFilter: 'blur(20px)',
              borderRadius: "20px",
              overflow: "hidden",
              border: "1px solid rgba(200, 182, 166, 0.3)",
              boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
              transition: 'all 0.3s ease'
            }}>
              <div
                onClick={() => toggleSection("applicationOverview")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expandedSections.applicationOverview
                    ? 'linear-gradient(135deg, #a67c52, #7d5a50)'
                    : 'linear-gradient(135deg, #e6d7c3, #c8b6a6)',
                  cursor: "pointer",
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (!expandedSections.applicationOverview) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #c8b6a6, #a67c52)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!expandedSections.applicationOverview) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #e6d7c3, #c8b6a6)'
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FileBarChart size={24} color={expandedSections.applicationOverview ? "#faf7f2" : "#4a352f"} />
                  <h2 style={{
                    margin: 0,
                    fontSize: "20px",
                    fontWeight: "700",
                    color: expandedSections.applicationOverview ? "#faf7f2" : "#4a352f"
                  }}>
                    Application Overview
                  </h2>
                </div>
                {expandedSections.applicationOverview ?
                  <ChevronUp size={24} color="#faf7f2" /> :
                  <ChevronDown size={24} color="#4a352f" />
                }
              </div>

              {expandedSections.applicationOverview && (
                <div style={{
                  padding: "28px",
                  background: 'linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))',
                  animation: 'slideDown 0.3s ease-out'
                }}>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "20px"
                  }}>
                    {[
                      { label: "Application Date", value: formatValue(formData?.applicationOverview?.applicationDate) },
                      { label: "Application Type", value: formatValue(formData?.applicationOverview?.applicationType) },
                      { label: "Funding Stage", value: formatValue(formData?.applicationOverview?.fundingStage) },
                      { label: "Preferred Start Date", value: formatValue(formData?.applicationOverview?.preferredStartDate) },
                      { label: "Submission Channel", value: formatValue(formData?.applicationOverview?.submissionChannel) },
                      { label: "Support Required", value: formatValue(formData?.applicationOverview?.supportFormat) },
                      { label: "Urgency", value: formatValue(formData?.applicationOverview?.urgency) }
                    ].map((item, i) => (
                      <div key={i} style={{
                        background: 'rgba(250, 247, 242, 0.8)',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '1px solid rgba(200, 182, 166, 0.2)',
                        transition: 'all 0.3s ease'
                      }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)'
                          e.currentTarget.style.boxShadow = '0 4px 16px rgba(74, 53, 47, 0.08)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}>
                        <span style={{
                          display: "block",
                          fontSize: "13px",
                          color: "#7d5a50",
                          marginBottom: "8px",
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {item.label}
                        </span>
                        <span style={{
                          fontSize: "15px",
                          color: "#4a352f",
                          fontWeight: "500",
                          lineHeight: '1.4'
                        }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Use of Funds */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))',
              backdropFilter: 'blur(20px)',
              borderRadius: "20px",
              overflow: "hidden",
              border: "1px solid rgba(200, 182, 166, 0.3)",
              boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
              transition: 'all 0.3s ease'
            }}>
              <div
                onClick={() => toggleSection("useOfFunds")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expandedSections.useOfFunds
                    ? 'linear-gradient(135deg, #7d5a50, #4a352f)'
                    : 'linear-gradient(135deg, #e6d7c3, #c8b6a6)',
                  cursor: "pointer",
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <DollarSign size={24} color={expandedSections.useOfFunds ? "#faf7f2" : "#4a352f"} />
                  <h2 style={{
                    margin: 0,
                    fontSize: "20px",
                    fontWeight: "700",
                    color: expandedSections.useOfFunds ? "#faf7f2" : "#4a352f"
                  }}>
                    Use of Funds
                  </h2>
                </div>
                {expandedSections.useOfFunds ?
                  <ChevronUp size={24} color="#faf7f2" /> :
                  <ChevronDown size={24} color="#4a352f" />
                }
              </div>

              {expandedSections.useOfFunds && (
                <div style={{
                  padding: "28px",
                  background: 'linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))',
                  animation: 'slideDown 0.3s ease-out'
                }}>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "20px",
                    marginBottom: '24px'
                  }}>
                    {[
                      { label: "Amount Requested", value: formatValue(formData?.useOfFunds?.amountRequested, "R 0") },
                      { label: "Personal Equity Contributed", value: formatValue(formData?.useOfFunds?.personalEquity, "R 0") },
                      { label: "Funding Instruments Preferred", value: formatArray(formData?.useOfFunds?.fundingInstruments) },
                      { label: "Type of Funder Preferred", value: formatArray(formData?.useOfFunds?.funderTypes) },
                      { label: "Equity Offered", value: formatValue(formData?.useOfFunds?.equityType, "0%") }, // This now correctly shows "0-20%"
                    ].map((item, i) => (
                      <div key={i} style={{
                        background: 'rgba(250, 247, 242, 0.8)',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '1px solid rgba(200, 182, 166, 0.2)',
                        transition: 'all 0.3s ease'
                      }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)'
                          e.currentTarget.style.boxShadow = '0 4px 16px rgba(74, 53, 47, 0.08)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}>
                        <span style={{
                          display: "block",
                          fontSize: "13px",
                          color: "#7d5a50",
                          marginBottom: "8px",
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {item.label}
                        </span>
                        <span style={{
                          fontSize: "15px",
                          color: "#4a352f",
                          fontWeight: "500",
                          lineHeight: '1.4'
                        }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Rest of the component remains the same */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "#4a352f",
                      marginBottom: "16px",
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <DollarSign size={20} color="#a67c52" />
                      Purpose of Funds
                    </h3>
                    {formData?.useOfFunds?.fundingItems && formData.useOfFunds.fundingItems.length > 0 ? (
                      <div style={{
                        background: 'rgba(250, 247, 242, 0.8)',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '1px solid rgba(200, 182, 166, 0.2)',
                        overflowX: 'auto'
                      }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '2px solid #c8b6a6' }}>
                              {['Category', 'Sub-area', 'Description', 'Amount'].map((header, i) => (
                                <th key={i} style={{
                                  padding: '12px 8px',
                                  textAlign: 'left',
                                  fontSize: '13px',
                                  fontWeight: '700',
                                  color: '#7d5a50',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px'
                                }}>
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {formData.useOfFunds.fundingItems.map((item, index) => (
                              <tr key={index} style={{ borderBottom: '1px solid #e6d7c3' }}>
                                <td style={{ padding: '12px 8px', color: '#4a352f', fontWeight: '500' }}>{item.category}</td>
                                <td style={{ padding: '12px 8px', color: '#4a352f' }}>{item.subArea}</td>
                                <td style={{ padding: '12px 8px', color: '#4a352f' }}>{item.description}</td>
                                <td style={{ padding: '12px 8px', color: '#4a352f', fontWeight: '600' }}>{item.amount}</td>
                              </tr>
                            ))}
                            <tr style={{
                              borderTop: '2px solid #a67c52',
                              background: 'rgba(166, 124, 82, 0.1)'
                            }}>
                              <td colSpan={3} style={{
                                padding: '12px 8px',
                                color: '#4a352f',
                                fontWeight: '700',
                                fontSize: '16px'
                              }}>
                                Total:
                              </td>
                              <td style={{
                                padding: '12px 8px',
                                color: '#4a352f',
                                fontWeight: '700',
                                fontSize: '16px'
                              }}>
                                R {formData.useOfFunds.fundingItems
                                  ?.reduce((sum, item) => sum + parseCurrency(item.amount), 0)
                                  .toLocaleString() || "0"}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{
                        background: 'rgba(200, 182, 166, 0.1)',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '1px solid rgba(200, 182, 166, 0.2)',
                        textAlign: 'center',
                        color: '#7d5a50',
                        fontStyle: 'italic'
                      }}>
                        No funding items provided
                      </div>
                    )}
                  </div>

                  <div style={{
                    background: 'rgba(166, 124, 82, 0.1)',
                    borderRadius: '16px',
                    padding: '20px',
                    border: '1px solid rgba(166, 124, 82, 0.2)'
                  }}>
                    <span style={{
                      display: "block",
                      fontSize: "13px",
                      color: "#7d5a50",
                      marginBottom: "12px",
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Budget Documents
                    </span>
                    {renderDocumentLink(formData?.useOfFunds?.budgetDocuments, "Budget Documents")}
                  </div>
                </div>
              )}
            </div>

            {/* Enterprise Readiness */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))',
              backdropFilter: 'blur(20px)',
              borderRadius: "20px",
              overflow: "hidden",
              border: "1px solid rgba(200, 182, 166, 0.3)",
              boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
              transition: 'all 0.3s ease'
            }}>
              <div
                onClick={() => toggleSection("enterpriseReadiness")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expandedSections.enterpriseReadiness
                    ? 'linear-gradient(135deg, #c8b6a6, #a67c52)'
                    : 'linear-gradient(135deg, #e6d7c3, #c8b6a6)',
                  cursor: "pointer",
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Building size={24} color={expandedSections.enterpriseReadiness ? "#faf7f2" : "#4a352f"} />
                  <h2 style={{
                    margin: 0,
                    fontSize: "20px",
                    fontWeight: "700",
                    color: expandedSections.enterpriseReadiness ? "#faf7f2" : "#4a352f"
                  }}>
                    Enterprise Readiness
                  </h2>
                </div>
                {expandedSections.enterpriseReadiness ?
                  <ChevronUp size={24} color="#faf7f2" /> :
                  <ChevronDown size={24} color="#4a352f" />
                }
              </div>

              {expandedSections.enterpriseReadiness && (
                <div style={{
                  padding: "28px",
                  background: 'linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))',
                  animation: 'slideDown 0.3s ease-out'
                }}>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "20px"
                  }}>
                    {[
                      {
                        label: "Has Business Plan",
                        value: formatValue(formData?.enterpriseReadiness?.hasBusinessPlan, "No")
                      },
                      {
                        label: "Has Pitch Deck",
                        value: formatValue(formData?.enterpriseReadiness?.hasPitchDeck, "No")
                      },
                      {
                        label: "Has MVP/Prototype",
                        value: formatValue(formData?.enterpriseReadiness?.hasMvp, "No"),
                        detail: formData?.enterpriseReadiness?.hasMvp === "yes" ? formData?.enterpriseReadiness?.mvpDetails : null
                      },
                      {
                        label: "Has Traction",
                        value: formatValue(formData?.enterpriseReadiness?.hasTraction, "No"),
                        detail: formData?.enterpriseReadiness?.hasTraction === "yes" ? formData?.enterpriseReadiness?.tractionDetails : null
                      },
                      {
                        label: "Has Audited Financials",
                        value: formatValue(formData?.enterpriseReadiness?.hasAuditedFinancials, "No")
                      },
                      {
                        label: "Has Mentor",
                        value: formatValue(formData?.enterpriseReadiness?.hasMentor, "No"),
                        detail: formData?.enterpriseReadiness?.hasMentor === "yes" ? formData?.enterpriseReadiness?.mentorDetails : null
                      },
                      {
                        label: "Has Advisors/Board",
                        value: formatValue(formData?.enterpriseReadiness?.hasAdvisors, "No"),
                        detail: formData?.enterpriseReadiness?.hasAdvisors === "yes" ? formData?.enterpriseReadiness?.advisorsDetails : null
                      },
                      {
                        label: "Main Barriers to Growth",
                        value: formatArray(formData?.enterpriseReadiness?.barriers)
                      },
                      {
                        label: "Support Previously Received",
                        value: formatValue(formData?.enterpriseReadiness?.previousSupport, "No"),
                        detail: formData?.enterpriseReadiness?.previousSupport === "yes" ?
                          `What: ${formData?.enterpriseReadiness?.previousSupportDetails || 'N/A'} | From: ${formData?.enterpriseReadiness?.previousSupportSource || 'N/A'}` : null
                      },
                      {
                        label: "Current Paying Customers",
                        value: formatValue(formData?.enterpriseReadiness?.hasPayingCustomers, "No"),
                        detail: formData?.enterpriseReadiness?.hasPayingCustomers === "yes" ? formData?.enterpriseReadiness?.payingCustomersDetails : null
                      }
                    ].map((item, i) => (
                      <div key={i} style={{
                        background: 'rgba(250, 247, 242, 0.8)',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '1px solid rgba(200, 182, 166, 0.2)',
                        transition: 'all 0.3s ease'
                      }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)'
                          e.currentTarget.style.boxShadow = '0 4px 16px rgba(74, 53, 47, 0.08)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}>
                        <span style={{
                          display: "block",
                          fontSize: "13px",
                          color: "#7d5a50",
                          marginBottom: "8px",
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {item.label}
                        </span>
                        <span style={{
                          fontSize: "15px",
                          color: "#4a352f",
                          fontWeight: "500",
                          lineHeight: '1.4',
                          display: 'block',
                          marginBottom: item.detail ? '8px' : 0
                        }}>
                          {item.value}
                        </span>
                        {item.detail && (
                          <div style={{
                            fontSize: "14px",
                            color: "#7d5a50",
                            fontStyle: 'italic',
                            padding: '8px 12px',
                            background: 'rgba(166, 124, 82, 0.1)',
                            borderRadius: '6px',
                            border: '1px solid rgba(166, 124, 82, 0.2)'
                          }}>
                            {item.detail}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Financial Overview */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))',
              backdropFilter: 'blur(20px)',
              borderRadius: "20px",
              overflow: "hidden",
              border: "1px solid rgba(200, 182, 166, 0.3)",
              boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
              transition: 'all 0.3s ease'
            }}>
              <div
                onClick={() => toggleSection("financialOverview")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expandedSections.financialOverview
                    ? 'linear-gradient(135deg, #a67c52, #7d5a50)'
                    : 'linear-gradient(135deg, #e6d7c3, #c8b6a6)',
                  cursor: "pointer",
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <TrendingUp size={24} color={expandedSections.financialOverview ? "#faf7f2" : "#4a352f"} />
                  <h2 style={{
                    margin: 0,
                    fontSize: "20px",
                    fontWeight: "700",
                    color: expandedSections.financialOverview ? "#faf7f2" : "#4a352f"
                  }}>
                    Financial Overview
                  </h2>
                </div>
                {expandedSections.financialOverview ?
                  <ChevronUp size={24} color="#faf7f2" /> :
                  <ChevronDown size={24} color="#4a352f" />
                }
              </div>

              {expandedSections.financialOverview && (
                <div style={{
                  padding: "28px",
                  background: 'linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))',
                  animation: 'slideDown 0.3s ease-out'
                }}>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "20px",
                    marginBottom: '24px'
                  }}>
                    {[
                      { label: "Generates Revenue", value: formatValue(formData?.financialOverview?.generatesRevenue, "No") },
                      ...(formData?.financialOverview?.generatesRevenue === "yes" ?
                        [{ label: "Annual Revenue", value: formatValue(formData?.financialOverview?.annualRevenue, "R 0") }] : []
                      ),
                      { label: "Current Valuation", value: formatValue(formData?.financialOverview?.currentValuation, "Not provided") },
                      { label: "Profitability Status", value: formatValue(formData?.financialOverview?.profitabilityStatus, "Not provided") },
                      { label: "Existing Debt or Loans", value: formatValue(formData?.financialOverview?.existingDebt, "R 0") },
                      { label: "Fundraising History", value: formatValue(formData?.financialOverview?.fundraisingHistory, "None") }
                    ].map((item, i) => (
                      <div key={i} style={{
                        background: 'rgba(250, 247, 242, 0.8)',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '1px solid rgba(200, 182, 166, 0.2)',
                        transition: 'all 0.3s ease'
                      }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)'
                          e.currentTarget.style.boxShadow = '0 4px 16px rgba(74, 53, 47, 0.08)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}>
                        <span style={{
                          display: "block",
                          fontSize: "13px",
                          color: "#7d5a50",
                          marginBottom: "8px",
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {item.label}
                        </span>
                        <span style={{
                          fontSize: "15px",
                          color: "#4a352f",
                          fontWeight: "500",
                          lineHeight: '1.4'
                        }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    background: 'rgba(166, 124, 82, 0.1)',
                    borderRadius: '16px',
                    padding: '20px',
                    border: '1px solid rgba(166, 124, 82, 0.2)'
                  }}>
                    <h3 style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "#4a352f",
                      marginBottom: "16px",
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Financial Documents
                    </h3>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "16px"
                    }}>
                      {[
                        { label: "Bank Statements", url: formData?.financialOverview?.bankStatements },
                        { label: "Bank Confirmation", url: formData?.financialOverview?.bankConfirmation },
                        { label: "Loan Agreements", url: formData?.financialOverview?.loanAgreements },
                        { label: "Financial Statements", url: formData?.financialOverview?.financialStatements }
                      ].map((doc, i) => (
                        <div key={i} style={{
                          padding: '12px'
                        }}>
                          <span style={{
                            display: "block",
                            fontSize: "12px",
                            color: "#7d5a50",
                            marginBottom: "8px",
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {doc.label}
                          </span>
                          {renderDocumentLink(doc.url, doc.label)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>


            {/* Guarantees Section */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))',
              backdropFilter: 'blur(20px)',
              borderRadius: "20px",
              overflow: "hidden",
              border: "1px solid rgba(200, 182, 166, 0.3)",
              boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
              transition: 'all 0.3s ease'
            }}>
              <div
                onClick={() => toggleSection("guarantees")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expandedSections.guarantees
                    ? 'linear-gradient(135deg, #7d5a50, #4a352f)'
                    : 'linear-gradient(135deg, #e6d7c3, #c8b6a6)',
                  cursor: "pointer",
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FileText size={24} color={expandedSections.guarantees ? "#faf7f2" : "#4a352f"} />
                  <h2 style={{
                    margin: 0,
                    fontSize: "20px",
                    fontWeight: "700",
                    color: expandedSections.guarantees ? "#faf7f2" : "#4a352f"
                  }}>
                    Guarantees & Security
                  </h2>
                </div>
                {expandedSections.guarantees ?
                  <ChevronUp size={24} color="#faf7f2" /> :
                  <ChevronDown size={24} color="#4a352f" />
                }
              </div>

              {expandedSections.guarantees && (
                <div style={{
                  padding: "28px",
                  background: 'linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))',
                  animation: 'slideDown 0.3s ease-out'
                }}>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "20px",
                    marginBottom: '24px'
                  }}>
                    {[
                      { label: "Signed Customer Contracts", value: formatValue(formData?.guarantees?.signedCustomerContracts, "Not provided") },
                      { label: "Purchase Orders", value: formatValue(formData?.guarantees?.purchaseOrders, "Not provided") },
                      { label: "Offtake Agreements", value: formatValue(formData?.guarantees?.offtakeAgreements, "Not provided") },
                      { label: "Subscription Revenue", value: formatValue(formData?.guarantees?.subscriptionRevenue, "Not provided") },
                      { label: "Letters of Credit", value: formatValue(formData?.guarantees?.letterOfGuarantee, "Not provided") },
                      { label: "Third-Party Guarantees", value: formatValue(formData?.guarantees?.thirdPartyGuarantees, "Not provided") },
                      { label: "Government Contracts", value: formatValue(formData?.guarantees?.governmentContracts, "Not provided") },
                      { label: "Personal Surety", value: formatValue(formData?.guarantees?.personalSurety, "Not provided") }
                    ].map((item, i) => (
                      <div key={i} style={{
                        background: 'rgba(250, 247, 242, 0.8)',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '1px solid rgba(200, 182, 166, 0.2)',
                        transition: 'all 0.3s ease'
                      }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)'
                          e.currentTarget.style.boxShadow = '0 4px 16px rgba(74, 53, 47, 0.08)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}>
                        <span style={{
                          display: "block",
                          fontSize: "13px",
                          color: "#7d5a50",
                          marginBottom: "8px",
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {item.label}
                        </span>
                        <span style={{
                          fontSize: "15px",
                          color: "#4a352f",
                          fontWeight: "500",
                          lineHeight: '1.4'
                        }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    background: 'rgba(166, 124, 82, 0.1)',
                    borderRadius: '16px',
                    padding: '20px',
                    border: '1px solid rgba(166, 124, 82, 0.2)'
                  }}>
                    <h3 style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "#4a352f",
                      marginBottom: "16px",
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Guarantee Documents
                    </h3>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "16px"
                    }}>
                      {[
                        { label: "Signed Contracts", url: formData?.guarantees?.signedCustomerContractsFiles },
                        { label: "Purchase Orders", url: formData?.guarantees?.purchaseOrdersFiles },
                        { label: "Offtake Agreements", url: formData?.guarantees?.offtakeAgreementsFiles },
                        { label: "Letters of Credit", url: formData?.guarantees?.letterOfGuaranteeFiles },
                        { label: "Third-Party Guarantees", url: formData?.guarantees?.thirdPartyGuaranteesFiles },
                        { label: "Government Contracts", url: formData?.guarantees?.governmentContractsFiles },
                        { label: "Factoring Agreements", url: formData?.guarantees?.factoringAgreementsFiles },
                        { label: "Surety Bonds", url: formData?.guarantees?.suretyBondsFiles },
                        { label: "Export Credit Guarantees", url: formData?.guarantees?.exportCreditGuaranteesFiles },
                        { label: "Corporate Guarantees", url: formData?.guarantees?.corporateGuaranteesFiles }
                      ].map((doc, i) => (
                        <div key={i} style={{ padding: '12px' }}>
                          <span style={{
                            display: "block",
                            fontSize: "12px",
                            color: "#7d5a50",
                            marginBottom: "8px",
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {doc.label}
                          </span>
                          {renderDocumentLink(doc.url, doc.label)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Growth Potential */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))',
              backdropFilter: 'blur(20px)',
              borderRadius: "20px",
              overflow: "hidden",
              border: "1px solid rgba(200, 182, 166, 0.3)",
              boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
              transition: 'all 0.3s ease'
            }}>
              <div
                onClick={() => toggleSection("growthPotential")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expandedSections.growthPotential
                    ? 'linear-gradient(135deg, #7d5a50, #4a352f)'
                    : 'linear-gradient(135deg, #e6d7c3, #c8b6a6)',
                  cursor: "pointer",
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <TrendingUp size={24} color={expandedSections.growthPotential ? "#faf7f2" : "#4a352f"} />
                  <h2 style={{
                    margin: 0,
                    fontSize: "20px",
                    fontWeight: "700",
                    color: expandedSections.growthPotential ? "#faf7f2" : "#4a352f"
                  }}>
                    Growth Potential
                  </h2>
                </div>
                {expandedSections.growthPotential ?
                  <ChevronUp size={24} color="#faf7f2" /> :
                  <ChevronDown size={24} color="#4a352f" />
                }
              </div>


              {expandedSections.growthPotential && (
                <div style={{
                  padding: "28px",
                  background: 'linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))',
                  animation: 'slideDown 0.3s ease-out'
                }}>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "20px",
                    marginBottom: '24px'
                  }}>
                    {[
                      {
                        label: "Market Share",
                        value: formatValue(formData?.growthPotential?.marketShare, "No"),
                        detail: formData?.growthPotential?.marketShare === "yes" ? formData?.growthPotential?.marketShareDetails : null
                      },
                      {
                        label: "Quality Improvement",
                        value: formatValue(formData?.growthPotential?.qualityImprovement, "No"),
                        detail: formData?.growthPotential?.qualityImprovement === "yes" ? formData?.growthPotential?.qualityImprovementDetails : null
                      },
                      {
                        label: "Green Technology",
                        value: formatValue(formData?.growthPotential?.greenTech, "No"),
                        detail: formData?.growthPotential?.greenTech === "yes" ? formData?.growthPotential?.greenTechDetails : null
                      },
                      {
                        label: "Localisation",
                        value: formatValue(formData?.growthPotential?.localisation, "No"),
                        detail: formData?.growthPotential?.localisation === "yes" ? formData?.growthPotential?.localisationDetails : null
                      },
                      {
                        label: "Regional Spread",
                        value: formatValue(formData?.growthPotential?.regionalSpread, "No"),
                        detail: formData?.growthPotential?.regionalSpread === "yes" ? formData?.growthPotential?.regionalSpreadDetails : null
                      },
                      {
                        label: "Personal Risk",
                        value: formatValue(formData?.growthPotential?.personalRisk, "No"),
                        detail: formData?.growthPotential?.personalRisk === "yes" ? formData?.growthPotential?.personalRiskDetails : null
                      },
                      {
                        label: "Empowerment",
                        value: formatValue(formData?.growthPotential?.empowerment, "No"),
                        detail: formData?.growthPotential?.empowerment === "yes" ? formData?.growthPotential?.empowermentDetails : null
                      },
                      {
                        label: "Employment Increase",
                        value: formatValue(formData?.growthPotential?.employment, "No"),
                        detail: formData?.growthPotential?.employment === "yes" ?
                          `Direct Jobs: ${formData?.growthPotential?.employmentIncreaseDirect || "0"} | Indirect Jobs: ${formData?.growthPotential?.employmentIncreaseIndirect || "0"}` : null
                      }
                    ].map((item, i) => (
                      <div key={i} style={{
                        background: 'rgba(250, 247, 242, 0.8)',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '1px solid rgba(200, 182, 166, 0.2)',
                        transition: 'all 0.3s ease'
                      }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)'
                          e.currentTarget.style.boxShadow = '0 4px 16px rgba(74, 53, 47, 0.08)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}>
                        <span style={{
                          display: "block",
                          fontSize: "13px",
                          color: "#7d5a50",
                          marginBottom: "8px",
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {item.label}
                        </span>
                        <span style={{
                          fontSize: "15px",
                          color: "#4a352f",
                          fontWeight: "500",
                          lineHeight: '1.4',
                          display: 'block',
                          marginBottom: item.detail ? '8px' : 0
                        }}>
                          {item.value}
                        </span>
                        {item.detail && (
                          <div style={{
                            fontSize: "14px",
                            color: "#7d5a50",
                            fontStyle: 'italic',
                            padding: '8px 12px',
                            background: 'rgba(166, 124, 82, 0.1)',
                            borderRadius: '6px',
                            border: '1px solid rgba(166, 124, 82, 0.2)'
                          }}>
                            {item.detail}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div style={{
                    background: 'rgba(166, 124, 82, 0.1)',
                    borderRadius: '16px',
                    padding: '20px',
                    border: '1px solid rgba(166, 124, 82, 0.2)'
                  }}>
                    <span style={{
                      display: "block",
                      fontSize: "13px",
                      color: "#7d5a50",
                      marginBottom: "12px",
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Support Letters
                    </span>
                    {renderDocumentLink(formData?.growthPotential?.supportLetters, "Support Letters")}
                  </div>
                </div>
              )}
            </div>

            {/* Social Impact & Alignment */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))',
              backdropFilter: 'blur(20px)',
              borderRadius: "20px",
              overflow: "hidden",
              border: "1px solid rgba(200, 182, 166, 0.3)",
              boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
              transition: 'all 0.3s ease'
            }}>
              <div
                onClick={() => toggleSection("socialImpact")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expandedSections.socialImpact
                    ? 'linear-gradient(135deg, #c8b6a6, #a67c52)'
                    : 'linear-gradient(135deg, #e6d7c3, #c8b6a6)',
                  cursor: "pointer",
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Heart size={24} color={expandedSections.socialImpact ? "#faf7f2" : "#4a352f"} />
                  <h2 style={{
                    margin: 0,
                    fontSize: "20px",
                    fontWeight: "700",
                    color: expandedSections.socialImpact ? "#faf7f2" : "#4a352f"
                  }}>
                    Social Impact & Alignment
                  </h2>
                </div>
                {expandedSections.socialImpact ?
                  <ChevronUp size={24} color="#faf7f2" /> :
                  <ChevronDown size={24} color="#4a352f" />
                }
              </div>

              {expandedSections.socialImpact && (
                <div style={{
                  padding: "28px",
                  background: 'linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))',
                  animation: 'slideDown 0.3s ease-out'
                }}>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "20px",
                    marginBottom: '24px'
                  }}>
                    {[
                      { label: "Jobs to be Created (Next 12 months)", value: formatValue(formData?.socialImpact?.jobsToCreate, "0") },
                      { label: "Youth Ownership %", value: `${formatValue(formData?.socialImpact?.youthOwnership, "0")}%` },
                      { label: "Women Ownership %", value: `${formatValue(formData?.socialImpact?.womenOwnership, "0")}%` },
                      { label: "Black Ownership %", value: `${formatValue(formData?.socialImpact?.blackOwnership, "0")}%` },
                      { label: "Environmental or Community Impact", value: formatValue(formData?.socialImpact?.environmentalImpact, "None specified") },
                      { label: "Alignment with SDGs or ESD priorities", value: formatValue(formData?.socialImpact?.sdgAlignment, "None specified") }
                    ].map((item, i) => (
                      <div key={i} style={{
                        background: 'rgba(250, 247, 242, 0.8)',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '1px solid rgba(200, 182, 166, 0.2)',
                        transition: 'all 0.3s ease'
                      }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)'
                          e.currentTarget.style.boxShadow = '0 4px 16px rgba(74, 53, 47, 0.08)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}>
                        <span style={{
                          display: "block",
                          fontSize: "13px",
                          color: "#7d5a50",
                          marginBottom: "8px",
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {item.label}
                        </span>
                        <span style={{
                          fontSize: "15px",
                          color: "#4a352f",
                          fontWeight: "500",
                          lineHeight: '1.4'
                        }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    background: 'rgba(166, 124, 82, 0.1)',
                    borderRadius: '16px',
                    padding: '20px',
                    border: '1px solid rgba(166, 124, 82, 0.2)'
                  }}>
                    <span style={{
                      display: "block",
                      fontSize: "13px",
                      color: "#7d5a50",
                      marginBottom: "12px",
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Impact Statement
                    </span>
                    {renderDocumentLink(formData?.socialImpact?.impactStatement, "Impact Statement")}
                  </div>
                </div>
              )}
            </div>

            {/* Declaration & Commitment */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))',
              backdropFilter: 'blur(20px)',
              borderRadius: "20px",
              overflow: "hidden",
              border: "1px solid rgba(200, 182, 166, 0.3)",
              boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
              transition: 'all 0.3s ease'
            }}>
              <div
                onClick={() => toggleSection("declarationCommitment")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expandedSections.declarationCommitment
                    ? 'linear-gradient(135deg, #a67c52, #7d5a50)'
                    : 'linear-gradient(135deg, #e6d7c3, #c8b6a6)',
                  cursor: "pointer",
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckSquare size={24} color={expandedSections.declarationCommitment ? "#faf7f2" : "#4a352f"} />
                  <h2 style={{
                    margin: 0,
                    fontSize: "20px",
                    fontWeight: "700",
                    color: expandedSections.declarationCommitment ? "#faf7f2" : "#4a352f"
                  }}>
                    Declaration & Commitment
                  </h2>
                </div>
                {expandedSections.declarationCommitment ?
                  <ChevronUp size={24} color="#faf7f2" /> :
                  <ChevronDown size={24} color="#4a352f" />
                }
              </div>

              {expandedSections.declarationCommitment && (
                <div style={{
                  padding: "28px",
                  background: 'linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))',
                  animation: 'slideDown 0.3s ease-out'
                }}>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "20px"
                  }}>
                    {[
                      { label: "Confirmed Intent to Participate", value: formatBoolean(formData?.declarationCommitment?.confirmIntent) },
                      { label: "Committed to Reporting Requirements", value: formatBoolean(formData?.declarationCommitment?.commitReporting) },
                      { label: "Consented to Share Profile", value: formatBoolean(formData?.declarationCommitment?.consentShare) }
                    ].map((item, i) => (
                      <div key={i} style={{
                        background: 'rgba(250, 247, 242, 0.8)',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '1px solid rgba(200, 182, 166, 0.2)',
                        transition: 'all 0.3s ease'
                      }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)'
                          e.currentTarget.style.boxShadow = '0 4px 16px rgba(74, 53, 47, 0.08)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}>
                        <span style={{
                          display: "block",
                          fontSize: "13px",
                          color: "#7d5a50",
                          marginBottom: "8px",
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {item.label}
                        </span>
                        <span style={{
                          fontSize: "15px",
                          color: "#4a352f",
                          fontWeight: "500"
                        }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{
            marginTop: "40px",
            textAlign: "center",
            background: 'linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))',
            backdropFilter: 'blur(20px)',
            borderRadius: "20px",
            padding: "32px",
            border: '1px solid rgba(200, 182, 166, 0.3)',
            boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)"
          }}>
            <button
              onClick={() => window.location.href = "/funding-matches"}
              style={{
                padding: "16px 32px",
                background: 'linear-gradient(135deg, #a67c52, #7d5a50)',
                color: "#faf7f2",
                border: "none",
                borderRadius: "16px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: '0 8px 24px rgba(166, 124, 82, 0.3)',
                minWidth: '200px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-4px)';
                e.target.style.boxShadow = '0 16px 40px rgba(166, 124, 82, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 24px rgba(166, 124, 82, 0.3)';
              }}
            >
              🚀 Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default ApplicationSummary