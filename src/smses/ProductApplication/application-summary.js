"use client"

import { useState } from "react"
import {
  ChevronDown,
  ChevronUp,
  Edit,
  FileText,
  Package,
  Users,
  Mail,
  DollarSign,
  MapPin,
  Calendar,
} from "lucide-react"

const ApplicationSummary = ({ data, onEdit }) => {
  const [expandedSections, setExpandedSections] = useState({
    requestOverview: false,
   
    matchingPreferences: false,
    contactSubmission: false,
  })

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Helper functions
  const formatFiles = (files) => {
    if (!files || !files.length) return "None"
    return files.map((file) => (typeof file === "string" ? file : file.name)).join(", ")
  }

  const formatArray = (arr) => {
    if (!arr || !arr.length) return "None specified"
    return arr.join(" • ")
  }

  const formatBoolean = (value) => (value ? "✅ Confirmed" : "❌ Pending")

  const formatCurrency = (value) => {
    if (!value) return "R 0"
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const handleEdit = () => {
    if (onEdit) onEdit()
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
            body.sidebar-collapsed .main-container {
    padding-left: var(--sidebar-collapsed-width) !important;
  }
        
        /* Responsive adjustments for mobile/tablet */
        @media (max-width: 1024px) {
          .main-container {
            padding-left: 16px !important;
            padding-top: 16px !important;
          }
        }
        
        @media (max-width: 768px) {
          .main-container {
            padding-left: 12px !important;
            padding-top: 12px !important;
          }
        }
      `}</style>

      <div
        className="main-container"
        style={{
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          minHeight: "100vh",
          width: "100%",
          background: "linear-gradient(135deg, #faf7f2 0%, #f5f0e1 50%, #f0e6d9 100%)",
          padding: "16px",
          paddingLeft: "280px", // Account for sidebar
          paddingTop: "80px", // Bring content down from top
          boxSizing: "border-box",
          transition: "all 0.3s ease",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "none",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
              backdropFilter: "blur(20px)",
              borderRadius: "16px",
              padding: "20px",
              marginBottom: "20px",
              boxShadow: "0 20px 40px rgba(74, 53, 47, 0.1)",
              border: "1px solid rgba(200, 182, 166, 0.3)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Background decoration */}
            <div
              style={{
                position: "absolute",
                top: "-50%",
                right: "-20%",
                width: "400px",
                height: "400px",
                background: "radial-gradient(circle, rgba(166, 124, 82, 0.1) 0%, transparent 70%)",
                borderRadius: "50%",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                position: "relative",
                zIndex: 2,
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              {/* Title */}
              <div style={{ flex: "1", minWidth: "250px" }}>
                <h1
                  style={{
                    background: "linear-gradient(135deg, #4a352f, #7d5a50)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontSize: "clamp(24px, 4vw, 36px)",
                    fontWeight: "800",
                    margin: "0 0 8px 0",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Application Summary
                </h1>
                <p
                  style={{
                    color: "#7d5a50",
                    fontSize: "clamp(14px, 2vw, 18px)",
                    margin: 0,
                    fontWeight: "500",
                  }}
                >
                  Product & Service Request Overview
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
                  background: "linear-gradient(135deg, #a67c52, #7d5a50)",
                  color: "#faf7f2",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 4px 16px rgba(166, 124, 82, 0.3)",
                  minWidth: "140px",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)"
                  e.target.style.boxShadow = "0 8px 24px rgba(166, 124, 82, 0.4)"
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)"
                  e.target.style.boxShadow = "0 4px 16px rgba(166, 124, 82, 0.3)"
                }}
              >
                <Edit size={16} /> Edit Application
              </button>
            </div>
          </div>

          {/* Application Sections */}
          <div
            style={{
              display: "grid",
              gap: "16px",
            }}
          >
            {/* Request Overview */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
                backdropFilter: "blur(20px)",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid rgba(200, 182, 166, 0.3)",
                boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
                transition: "all 0.3s ease",
              }}
            >
              <div
                onClick={() => toggleSection("requestOverview")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  background: expandedSections.requestOverview
                    ? "linear-gradient(135deg, #a67c52, #7d5a50)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  if (!expandedSections.requestOverview) {
                    e.currentTarget.style.background = "linear-gradient(135deg, #c8b6a6, #a67c52)"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!expandedSections.requestOverview) {
                    e.currentTarget.style.background = "linear-gradient(135deg, #e6d7c3, #c8b6a6)"
                  }
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <FileText size={20} color={expandedSections.requestOverview ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "clamp(16px, 2.5vw, 20px)",
                      fontWeight: "700",
                      color: expandedSections.requestOverview ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Request Overview
                  </h2>
                </div>
                {expandedSections.requestOverview ? (
                  <ChevronUp size={20} color="#faf7f2" />
                ) : (
                  <ChevronDown size={20} color="#4a352f" />
                )}
              </div>

              {expandedSections.requestOverview && (
                <div
                  style={{
                    padding: "20px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  <div
                    style={{
                      background: "rgba(166, 124, 82, 0.1)",
                      borderRadius: "12px",
                      padding: "16px",
                      border: "1px solid rgba(166, 124, 82, 0.2)",
                      marginBottom: "16px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <FileText size={16} color="#a67c52" />
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#7d5a50",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Purpose of Request
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#4a352f",
                        lineHeight: "1.7",
                        margin: 0,
                        fontWeight: "400",
                      }}
                    >
                      {data?.requestOverview?.purpose || "Not provided"}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    {[
                      { label: "Type of Engagement", value: data?.requestOverview?.engagementType, icon: Users },
                      {
                        label: "Preferred Delivery Mode",
                        value: formatArray(data?.requestOverview?.deliveryModes),
                        icon: Package,
                      },
                      { label: "Start Date", value: data?.requestOverview?.startDate, icon: Calendar },
                      { label: "End Date", value: data?.requestOverview?.endDate, icon: Calendar },
                      { label: "Location", value: data?.requestOverview?.location, icon: MapPin },
                      {
                        label: "Budget Range",
                        value: `${formatCurrency(data?.requestOverview?.minBudget)} to ${formatCurrency(data?.requestOverview?.maxBudget)}`,
                        icon: DollarSign,
                      },
                      {
                        label: "Linked to ESD/CSR Program",
                        value:
                          data?.requestOverview?.esdProgram === null
                            ? "Not specified"
                            : formatBoolean(data?.requestOverview?.esdProgram),
                        icon: FileText,
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        style={{
                          background: "rgba(250, 247, 242, 0.8)",
                          borderRadius: "12px",
                          padding: "16px",
                          border: "1px solid rgba(200, 182, 166, 0.2)",
                          transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-1px)"
                          e.currentTarget.style.boxShadow = "0 4px 16px rgba(74, 53, 47, 0.08)"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)"
                          e.currentTarget.style.boxShadow = "none"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                          <item.icon size={14} color="#a67c52" />
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#7d5a50",
                              fontWeight: "600",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {item.label}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#4a352f",
                            fontWeight: "500",
                            lineHeight: "1.4",
                          }}
                        >
                          {item.value || "Not provided"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Required Products or Services */}
          

            {/* Matching Preferences */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
                backdropFilter: "blur(20px)",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid rgba(200, 182, 166, 0.3)",
                boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
                transition: "all 0.3s ease",
              }}
            >
              <div
                onClick={() => toggleSection("matchingPreferences")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  background: expandedSections.matchingPreferences
                    ? "linear-gradient(135deg, #c8b6a6, #a67c52)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Users size={20} color={expandedSections.matchingPreferences ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "clamp(16px, 2.5vw, 20px)",
                      fontWeight: "700",
                      color: expandedSections.matchingPreferences ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Matching Preferences
                  </h2>
                </div>
                {expandedSections.matchingPreferences ? (
                  <ChevronUp size={20} color="#faf7f2" />
                ) : (
                  <ChevronDown size={20} color="#4a352f" />
                )}
              </div>

              {expandedSections.matchingPreferences && (
                <div
                  style={{
                    padding: "20px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    {[
                      { label: "Preferred B-BBEE Level", value: data?.matchingPreferences?.bbeeLevel, icon: FileText },
                      {
                        label: "Ownership Preferences",
                        value: formatArray(data?.matchingPreferences?.ownershipPrefs),
                        icon: Users,
                      },
                      {
                        label: "Sector Experience Required",
                        value: data?.matchingPreferences?.sectorExperience,
                        icon: Package,
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        style={{
                          background: "rgba(250, 247, 242, 0.8)",
                          borderRadius: "12px",
                          padding: "16px",
                          border: "1px solid rgba(200, 182, 166, 0.2)",
                          transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-1px)"
                          e.currentTarget.style.boxShadow = "0 4px 16px rgba(74, 53, 47, 0.08)"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)"
                          e.currentTarget.style.boxShadow = "none"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                          <item.icon size={14} color="#c8b6a6" />
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#7d5a50",
                              fontWeight: "600",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {item.label}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#4a352f",
                            fontWeight: "500",
                            lineHeight: "1.4",
                          }}
                        >
                          {item.value || "Not specified"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Contact & Submission */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
                backdropFilter: "blur(20px)",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid rgba(200, 182, 166, 0.3)",
                boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
                transition: "all 0.3s ease",
              }}
            >
              <div
                onClick={() => toggleSection("contactSubmission")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  background: expandedSections.contactSubmission
                    ? "linear-gradient(135deg, #a67c52, #7d5a50)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Mail size={20} color={expandedSections.contactSubmission ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "clamp(16px, 2.5vw, 20px)",
                      fontWeight: "700",
                      color: expandedSections.contactSubmission ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Contact & Submission
                  </h2>
                </div>
                {expandedSections.contactSubmission ? (
                  <ChevronUp size={20} color="#faf7f2" />
                ) : (
                  <ChevronDown size={20} color="#4a352f" />
                )}
              </div>

              {expandedSections.contactSubmission && (
                <div
                  style={{
                    padding: "20px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    {[
                      { label: "Contact Person Name", value: data?.contactSubmission?.contactName, icon: Users },
                      { label: "Role", value: data?.contactSubmission?.contactRole, icon: FileText },
                      { label: "Business Name", value: data?.contactSubmission?.businessName, icon: Package },
                      { label: "Email", value: data?.contactSubmission?.email, icon: Mail },
                      { label: "Phone Number", value: data?.contactSubmission?.phone, icon: Mail },
                      {
                        label: "Preferred Response Method",
                        value: data?.contactSubmission?.responseMethod,
                        icon: Mail,
                      },
                      {
                        label: "Declaration",
                        value: formatBoolean(data?.contactSubmission?.declaration),
                        icon: FileText,
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        style={{
                          background: "rgba(250, 247, 242, 0.8)",
                          borderRadius: "12px",
                          padding: "16px",
                          border: "1px solid rgba(200, 182, 166, 0.2)",
                          transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-1px)"
                          e.currentTarget.style.boxShadow = "0 4px 16px rgba(74, 53, 47, 0.08)"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)"
                          e.currentTarget.style.boxShadow = "none"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                          <item.icon size={14} color="#a67c52" />
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#7d5a50",
                              fontWeight: "600",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {item.label}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#4a352f",
                            fontWeight: "500",
                            lineHeight: "1.4",
                          }}
                        >
                          {item.value || "Not provided"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: "24px",
              textAlign: "center",
              background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
              backdropFilter: "blur(20px)",
              borderRadius: "16px",
              padding: "20px",
              border: "1px solid rgba(200, 182, 166, 0.3)",
              boxShadow: "0 16px 32px rgba(74, 53, 47, 0.08)",
            }}
          >
            <button
              onClick={() => window.location.href = "/supplier-matches"}
              style={{
                padding: "14px 28px",
                background: "linear-gradient(135deg, #a67c52, #7d5a50)",
                color: "#faf7f2",
                border: "none",
                borderRadius: "12px",
                fontSize: "clamp(14px, 2vw, 16px)",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 8px 24px rgba(166, 124, 82, 0.3)",
                minWidth: "180px",
                width: "100%",
                maxWidth: "250px",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-4px)";
                e.target.style.boxShadow = "0 16px 40px rgba(166, 124, 82, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 8px 24px rgba(166, 124, 82, 0.3)";
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