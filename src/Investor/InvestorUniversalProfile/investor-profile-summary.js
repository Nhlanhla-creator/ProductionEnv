import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, Edit, Printer, Check, Star, Shield, TrendingUp, User, Mail, Building, Briefcase, FileText, CheckSquare } from 'lucide-react'
import { createPortal } from 'react-dom'
import {documentsList} from "./DocumentUpload"
import VerificationScoreCard from './VerificationScoreCard'

const InvestorProfileSummary = ({ data, onEdit }) => {
  const [expanded, setExpanded] = useState({
    fundManageOverview: false,
    generalInvestmentPreference: false,
    contactDetails: false,
    fundDetails: false,
    applicationBrief: false,
    documentUpload: false,
    declarationConsent: false
  })

  const toggle = (key) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))

const formatFiles = (files) => {
  if (!files) return "None"
  
  // Handle object with file URLs (your current structure)
  if (typeof files === 'object' && !Array.isArray(files)) {
    const fileCount = Object.values(files).filter(url => !!url).length
    return fileCount > 0 ? `${fileCount} file(s) uploaded` : "None"
  }
  
  // Handle array of files (previous structure)
  const filesArray = Array.isArray(files) ? files : []
  if (!filesArray.length) return "None"
  return filesArray.map((file) => (typeof file === "string" ? file : file.name)).join(", ")
}

  const formatArray = (arr) => {
    if (!arr || !arr.length) return "None specified"
    return arr.join(" • ")
  }

  const formatBoolean = (value) => (value ? "✅ Confirmed" : "❌ Pending")

  const handleEdit = () => {
    if (onEdit) onEdit()
  }

  const handleNavigate = () => {
    // Add your navigation logic here
  }

const renderDocsStatus = () => {
  // Use the same documents list as the upload component
  // const documentsList = [
  //   { id: 'registrationDocs', label: 'Company Registration Documents', required: true },
  //   { id: 'idOffund', label: 'ID of Fund Lead', required: true },
  //   { id: 'fundMandate', label: 'Investment Mandate/Programme Brochures', required: true },
  // ]

  return documentsList
    .filter((doc) => doc.required)
    .map((doc, idx) => {
      // Get the uploaded file URL from your data structure
      const fileUrl = data?.documentUpload?.[doc.id]
      const isUploaded = !!fileUrl // Check if URL exists

      return (
        <div key={idx} style={{
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
            {doc.label}
          </span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: isUploaded ? '8px' : '0'
          }}>
            {isUploaded ? (
              <>
                <Check size={16} color="#a67c52" />
                <span style={{ color: '#4a352f', fontWeight: '500' }}>Uploaded</span>
              </>
            ) : (
              <span style={{ color: '#7d5a50', fontStyle: 'italic' }}>Not uploaded</span>
            )}
          </div>

          {/* Show uploaded file information */}
          {isUploaded && (
            <div style={{
              marginTop: '8px',
              padding: '8px',
              backgroundColor: 'rgba(166, 124, 82, 0.1)',
              borderRadius: '6px'
            }}>
              <span style={{
                fontSize: "12px",
                color: "#7d5a50",
                fontWeight: "500",
                display: "block",
                marginBottom: "4px"
              }}>
                Uploaded file:
              </span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                color: '#4a352f',
                marginBottom: '2px'
              }}>
                <FileText size={12} />
                <span>{doc.label}</span>
              </div>
              {/* Optional: Add a download link */}
              <a 
                href={fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  fontSize: '11px',
                  color: '#a67c52',
                  textDecoration: 'underline',
                  marginTop: '4px',
                  display: 'inline-block'
                }}
              >
                View/Download File
              </a>
            </div>
          )}
        </div>
      )
    })
}
  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(32px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
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
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* Responsive sidebar adjustments */
        @media (max-width: 1024px) {
          .investor-profile-container {
            padding-left: 24px !important;
          }
          .header-grid {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 24px !important;
          }
        }
           /* ADD THIS NEW RULE */
  body.sidebar-collapsed .main-container {
    padding-left: var(--sidebar-collapsed-width) !important;
  }
        
        @media (max-width: 768px) {
          .investor-profile-container {
            padding: 16px !important;
          }
          .header-grid {
            gap: 16px !important;
          }
        }
        
        /* For collapsed sidebar state */
        .sidebar-collapsed .investor-profile-container {
          padding-left: max(24px, calc(80px + 24px)) !important;
        }
      `}</style>

      <div
        className="investor-profile-container"
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

              {/* Verification Score */}
              <VerificationScoreCard profileData={data} />

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
                  Investor Profile
                </h1>
                <p style={{
                  color: '#7d5a50',
                  fontSize: '18px',
                  margin: 0,
                  fontWeight: '500'
                }}>
                  Professional Investment Dashboard
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: "flex",
                gap: "12px",
                flexDirection: 'column'
              }}>

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
                  <Edit size={16} /> Edit Profile
                </button>
              </div>
            </div>
          </div>

          {/* Profile Sections */}
          <div style={{
            display: 'grid',
            gap: '24px'
          }}>

            {/* Fund Manage Overview */}
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
                onClick={() => toggle("fundManageOverview")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expanded.fundManageOverview
                    ? 'linear-gradient(135deg, #a67c52, #7d5a50)'
                    : 'linear-gradient(135deg, #e6d7c3, #c8b6a6)',
                  cursor: "pointer",
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Briefcase size={24} color={expanded.fundManageOverview ? "#faf7f2" : "#4a352f"} />
                  <h2 style={{
                    margin: 0,
                    fontSize: "20px",
                    fontWeight: "700",
                    color: expanded.fundManageOverview ? "#faf7f2" : "#4a352f"
                  }}>
                    Fund Management Overview
                  </h2>
                </div>
                {expanded.fundManageOverview ?
                  <ChevronUp size={24} color="#faf7f2" /> :
                  <ChevronDown size={24} color="#4a352f" />
                }
              </div>

              {expanded.fundManageOverview && (
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
                    {Object.entries(data?.fundManageOverview || {}).map(([key, val]) => (
                      <div key={key} style={{
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
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                        <span style={{
                          fontSize: "15px",
                          color: "#4a352f",
                          fontWeight: "500",
                          lineHeight: '1.4'
                        }}>
                          {Array.isArray(val) ? formatArray(val) : val || "Not provided"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Investment Preferences */}
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
                onClick={() => toggle("generalInvestmentPreference")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expanded.generalInvestmentPreference
                    ? 'linear-gradient(135deg, #7d5a50, #4a352f)'
                    : 'linear-gradient(135deg, #e6d7c3, #c8b6a6)',
                  cursor: "pointer",
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <TrendingUp size={24} color={expanded.generalInvestmentPreference ? "#faf7f2" : "#4a352f"} />
                  <h2 style={{
                    margin: 0,
                    fontSize: "20px",
                    fontWeight: "700",
                    color: expanded.generalInvestmentPreference ? "#faf7f2" : "#4a352f"
                  }}>
                    Investment Preferences
                  </h2>
                </div>
                {expanded.generalInvestmentPreference ?
                  <ChevronUp size={24} color="#faf7f2" /> :
                  <ChevronDown size={24} color="#4a352f" />
                }
              </div>

              {expanded.generalInvestmentPreference && (
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
                    {Object.entries(data?.generalInvestmentPreference || {}).map(([key, val]) => (
                      <div key={key} style={{
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
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                        <span style={{
                          fontSize: "15px",
                          color: "#4a352f",
                          fontWeight: "500",
                          lineHeight: '1.4'
                        }}>
                          {Array.isArray(val) ? formatArray(val) : val || "Not provided"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Contact Details */}
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
                onClick={() => toggle("contactDetails")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expanded.contactDetails
                    ? 'linear-gradient(135deg, #c8b6a6, #a67c52)'
                    : 'linear-gradient(135deg, #e6d7c3, #c8b6a6)',
                  cursor: "pointer",
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Mail size={24} color={expanded.contactDetails ? "#faf7f2" : "#4a352f"} />
                  <h2 style={{
                    margin: 0,
                    fontSize: "20px",
                    fontWeight: "700",
                    color: expanded.contactDetails ? "#faf7f2" : "#4a352f"
                  }}>
                    Contact Details
                  </h2>
                </div>
                {expanded.contactDetails ?
                  <ChevronUp size={24} color="#faf7f2" /> :
                  <ChevronDown size={24} color="#4a352f" />
                }
              </div>

              {expanded.contactDetails && (
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
                    {Object.entries(data?.contactDetails || {}).map(([key, val]) => (
                      <div key={key} style={{
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
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                        <span style={{
                          fontSize: "15px",
                          color: "#4a352f",
                          fontWeight: "500",
                          lineHeight: '1.4'
                        }}>
                          {val || "Not provided"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Fund Details */}
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
                onClick={() => toggle("fundDetails")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expanded.fundDetails
                    ? 'linear-gradient(135deg, #a67c52, #7d5a50)'
                    : 'linear-gradient(135deg, #e6d7c3, #c8b6a6)',
                  cursor: "pointer",
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Building size={24} color={expanded.fundDetails ? "#faf7f2" : "#4a352f"} />
                  <h2 style={{
                    margin: 0,
                    fontSize: "20px",
                    fontWeight: "700",
                    color: expanded.fundDetails ? "#faf7f2" : "#4a352f"
                  }}>
                    Fund Details
                  </h2>
                </div>
                {expanded.fundDetails ?
                  <ChevronUp size={24} color="#faf7f2" /> :
                  <ChevronDown size={24} color="#4a352f" />
                }
              </div>

              {expanded.fundDetails && (
                <div style={{
                  padding: "28px",
                  background: 'linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))',
                  animation: 'slideDown 0.3s ease-out'
                }}>
                  {(data?.fundDetails?.funds || []).map((fund, idx) => (
                    <div key={idx} style={{
                      background: 'rgba(166, 124, 82, 0.1)',
                      borderRadius: '16px',
                      padding: '24px',
                      border: '1px solid rgba(166, 124, 82, 0.2)',
                      marginBottom: idx < (data.fundDetails?.funds.length - 1) ? '24px' : 0
                    }}>
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#4a352f',
                        marginBottom: '20px',
                        background: 'linear-gradient(135deg, #a67c52, #7d5a50)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}>
                        Fund {idx + 1}
                      </h3>
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                        gap: "16px"
                      }}>
                        {Object.entries(fund).map(([k, v]) => (
                          <div key={k} style={{
                            background: 'rgba(250, 247, 242, 0.8)',
                            borderRadius: '12px',
                            padding: '16px',
                            border: '1px solid rgba(200, 182, 166, 0.2)'
                          }}>
                            <span style={{
                              display: "block",
                              fontSize: "13px",
                              color: "#7d5a50",
                              marginBottom: "6px",
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              {k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </span>
                            <span style={{
                              fontSize: "15px",
                              color: "#4a352f",
                              fontWeight: "500"
                            }}>
                              {Array.isArray(v) ? formatArray(v) : v || "Not provided"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {(!data?.fundDetails?.funds || data.fundDetails.funds.length === 0) && (
                    <div style={{
                      background: 'rgba(200, 182, 166, 0.1)',
                      borderRadius: '12px',
                      padding: '20px',
                      border: '1px solid rgba(200, 182, 166, 0.2)',
                      textAlign: 'center',
                      color: '#7d5a50',
                      fontStyle: 'italic'
                    }}>
                      No fund details provided
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Application Brief */}
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
                onClick={() => toggle("applicationBrief")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expanded.applicationBrief
                    ? 'linear-gradient(135deg, #7d5a50, #4a352f)'
                    : 'linear-gradient(135deg, #e6d7c3, #c8b6a6)',
                  cursor: "pointer",
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FileText size={24} color={expanded.applicationBrief ? "#faf7f2" : "#4a352f"} />
                  <h2 style={{
                    margin: 0,
                    fontSize: "20px",
                    fontWeight: "700",
                    color: expanded.applicationBrief ? "#faf7f2" : "#4a352f"
                  }}>
                    Application Brief
                  </h2>
                </div>
                {expanded.applicationBrief ?
                  <ChevronUp size={24} color="#faf7f2" /> :
                  <ChevronDown size={24} color="#4a352f" />
                }
              </div>

              {expanded.applicationBrief && (
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
                    {Object.entries(data?.applicationBrief || {}).map(([key, val]) => (
                      <div key={key} style={{
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
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                        <span style={{
                          fontSize: "15px",
                          color: "#4a352f",
                          fontWeight: "500",
                          lineHeight: '1.4'
                        }}>
                          {Array.isArray(val) ? formatArray(val) : val || "Not provided"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Document Upload */}
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
                onClick={() => toggle("documentUpload")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expanded.documentUpload
                    ? 'linear-gradient(135deg, #c8b6a6, #a67c52)'
                    : 'linear-gradient(135deg, #e6d7c3, #c8b6a6)',
                  cursor: "pointer",
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FileText size={24} color={expanded.documentUpload ? "#faf7f2" : "#4a352f"} />
                  <h2 style={{
                    margin: 0,
                    fontSize: "20px",
                    fontWeight: "700",
                    color: expanded.documentUpload ? "#faf7f2" : "#4a352f"
                  }}>
                    Document Upload
                  </h2>
                </div>
                {expanded.documentUpload ?
                  <ChevronUp size={24} color="#faf7f2" /> :
                  <ChevronDown size={24} color="#4a352f" />
                }
              </div>

              {expanded.documentUpload && (
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
                    {renderDocsStatus()}
                  </div>
                </div>
              )}
            </div>

            {/* Declaration & Consent */}
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
                onClick={() => toggle("declarationConsent")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  background: expanded.declarationConsent
                    ? 'linear-gradient(135deg, #a67c52, #7d5a50)'
                    : 'linear-gradient(135deg, #e6d7c3, #c8b6a6)',
                  cursor: "pointer",
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckSquare size={24} color={expanded.declarationConsent ? "#faf7f2" : "#4a352f"} />
                  <h2 style={{
                    margin: 0,
                    fontSize: "20px",
                    fontWeight: "700",
                    color: expanded.declarationConsent ? "#faf7f2" : "#4a352f"
                  }}>
                    Declaration & Consent
                  </h2>
                </div>
                {expanded.declarationConsent ?
                  <ChevronUp size={24} color="#faf7f2" /> :
                  <ChevronDown size={24} color="#4a352f" />
                }
              </div>

              {expanded.declarationConsent && (
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
                      { label: "Declaration of Accuracy", value: formatBoolean(data?.declarationConsent?.accuracy) },
                      { label: "Consent for Data Processing", value: formatBoolean(data?.declarationConsent?.dataProcessing) },
                      { label: "Agreement to Terms & Conditions", value: formatBoolean(data?.declarationConsent?.termsConditions) }
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
              onClick={handleNavigate}
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
                e.target.style.transform = 'translateY(-4px)'
                e.target.style.boxShadow = '0 16px 40px rgba(166, 124, 82, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 8px 24px rgba(166, 124, 82, 0.3)'
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

export default InvestorProfileSummary