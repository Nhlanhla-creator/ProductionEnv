"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Edit, User, Briefcase, Handshake } from "lucide-react"

const ApplicationSummary = ({ formData, onEdit }) => {
  const [expandedSections, setExpandedSections] = useState({
    internshipRequest: false,
    jobOverview: false,
    matchingAgreement: false,
  })

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const formatArray = (arr) => {
    if (!arr || !arr.length) return "None specified"
    return arr.filter((item) => item.trim()).join(" • ")
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
            margin: "0",
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
                  Internship Application
                </h1>
                <p
                  style={{
                    color: "#7d5a50",
                    fontSize: "clamp(14px, 2vw, 18px)",
                    margin: 0,
                    fontWeight: "500",
                  }}
                >
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
            {/* Internship Request */}
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
                onClick={() => toggleSection("internshipRequest")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  background: expandedSections.internshipRequest
                    ? "linear-gradient(135deg, #a67c52, #7d5a50)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <User size={20} color={expandedSections.internshipRequest ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "clamp(16px, 2.5vw, 20px)",
                      fontWeight: "700",
                      color: expandedSections.internshipRequest ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Internship Request Details
                  </h2>
                </div>
                {expandedSections.internshipRequest ? (
                  <ChevronUp size={20} color="#faf7f2" />
                ) : (
                  <ChevronDown size={20} color="#4a352f" />
                )}
              </div>
              {expandedSections.internshipRequest && (
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
                      { label: "Number of Interns", value: formData?.numberOfInterns },
                      { label: "Intern Roles/Functions", value: formData?.internRolesText },
                      { label: "Intern Type", value: formData?.internType },
                      {
                        label: "Hours Per Week",
                        value: formData?.hoursPerWeek ? `${formData.hoursPerWeek} hours` : "",
                      },
                      { label: "Start Date", value: formData?.startDate },
                      { label: "Duration", value: formData?.duration },
                      { label: "Stipend Offered", value: formData?.stipendOffered },
                      {
                        label: "Stipend Amount",
                        value: formData?.stipendAmount ? `ZAR ${formData.stipendAmount}` : "N/A",
                      },
                      { label: "Equity/Incentives", value: formData?.equityOrIncentives },
                      { label: "Reporting Department", value: formData?.reportingDepartment },
                      { label: "Can Rotate Roles", value: formData?.canRotate },
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
                        <span
                          style={{
                            display: "block",
                            fontSize: "12px",
                            color: "#7d5a50",
                            marginBottom: "6px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {item.label}
                        </span>
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
                  {formData?.workDescription && (
                    <div
                      style={{
                        marginTop: "16px",
                        background: "rgba(166, 124, 82, 0.1)",
                        borderRadius: "12px",
                        padding: "16px",
                        border: "1px solid rgba(166, 124, 82, 0.2)",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          fontSize: "12px",
                          color: "#7d5a50",
                          marginBottom: "8px",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Work Description & Learning Objectives
                      </span>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#4a352f",
                          fontWeight: "500",
                          lineHeight: "1.6",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {formData.workDescription}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Job Overview */}
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
                onClick={() => toggleSection("jobOverview")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  background: expandedSections.jobOverview
                    ? "linear-gradient(135deg, #7d5a50, #4a352f)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Briefcase size={20} color={expandedSections.jobOverview ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "clamp(16px, 2.5vw, 20px)",
                      fontWeight: "700",
                      color: expandedSections.jobOverview ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Internship Overview
                  </h2>
                </div>
                {expandedSections.jobOverview ? (
                  <ChevronUp size={20} color="#faf7f2" />
                ) : (
                  <ChevronDown size={20} color="#4a352f" />
                )}
              </div>
              {expandedSections.jobOverview && (
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
                      marginBottom: "20px",
                    }}
                  >
                    {[
                      { label: "Internship Title", value: formData?.internshipTitle },
                      { label: "Department", value: formData?.department },
                      { label: "Preferred Skills", value: formatArray(formData?.preferredSkills) },
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
                        <span
                          style={{
                            display: "block",
                            fontSize: "12px",
                            color: "#7d5a50",
                            marginBottom: "6px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {item.label}
                        </span>
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

                  {/* Description Fields */}
                  {[
                    { label: "Brief Description", value: formData?.briefDescription },
                    { label: "Key Tasks", value: formData?.keyTasks },
                    { label: "Learning Outcomes", value: formData?.learningOutcomes },
                  ].map(
                    (item, i) =>
                      item.value && (
                        <div
                          key={i}
                          style={{
                            marginBottom: "16px",
                            background: "rgba(166, 124, 82, 0.1)",
                            borderRadius: "12px",
                            padding: "16px",
                            border: "1px solid rgba(166, 124, 82, 0.2)",
                          }}
                        >
                          <span
                            style={{
                              display: "block",
                              fontSize: "12px",
                              color: "#7d5a50",
                              marginBottom: "8px",
                              fontWeight: "700",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {item.label}
                          </span>
                          <div
                            style={{
                              fontSize: "14px",
                              color: "#4a352f",
                              fontWeight: "500",
                              lineHeight: "1.6",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {item.value}
                          </div>
                        </div>
                      ),
                  )}
                </div>
              )}
            </div>

            {/* Matching Agreement */}
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
                onClick={() => toggleSection("matchingAgreement")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  background: expandedSections.matchingAgreement
                    ? "linear-gradient(135deg, #c8b6a6, #a67c52)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Handshake size={20} color={expandedSections.matchingAgreement ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "clamp(16px, 2.5vw, 20px)",
                      fontWeight: "700",
                      color: expandedSections.matchingAgreement ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Matching Agreement
                  </h2>
                </div>
                {expandedSections.matchingAgreement ? (
                  <ChevronUp size={20} color="#faf7f2" />
                ) : (
                  <ChevronDown size={20} color="#4a352f" />
                )}
              </div>
              {expandedSections.matchingAgreement && (
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
                      gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    {[
                      {
                        label: "Written Evaluation",
                        value: formData?.writtenEvaluation,
                        description: "Willing to provide written assessment of intern's performance",
                      },
                      {
                        label: "Mentorship Support",
                        value: formData?.mentorshipSupport,
                        description: "Commitment to assign mentor and support learning journey",
                      },
                      {
                        label: "Code of Conduct",
                        value: formData?.codeOfConduct,
                        description: "Agreement to professional behavior standards",
                      },
                      {
                        label: "Declaration & Consent",
                        value: formData?.consentDeclaration,
                        description: "Consent to share information and comply with program terms",
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
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <div
                            style={{
                              width: "18px",
                              height: "18px",
                              borderRadius: "4px",
                              background: item.value ? "linear-gradient(135deg, #a67c52, #7d5a50)" : "#e5e5e5",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontSize: "10px",
                              fontWeight: "bold",
                            }}
                          >
                            {item.value ? "✓" : ""}
                          </div>
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
                            fontSize: "13px",
                            color: "#4a352f",
                            fontWeight: "400",
                            lineHeight: "1.4",
                            display: "block",
                            marginBottom: "8px",
                          }}
                        >
                          {item.description}
                        </span>
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            color: item.value ? "#22c55e" : "#ef4444",
                          }}
                        >
                          {item.value ? "Agreed" : "Not Agreed"}
                        </div>
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
              onClick={() => window.location.href = "/intern-matches-page"}
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