"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Edit, ExternalLink, FileText, Target, Upload } from "lucide-react"

const ApplicationSummary = ({ formData, onEdit }) => {
  const [expandedSections, setExpandedSections] = useState({
    advisoryNeedsAssessment: false,
    documentUploads: false,
  })

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const renderDocumentLink = (url, label = "View Document") => {
    if (!url) return <span style={{ color: "#7d5a50", fontStyle: "italic" }}>No document uploaded</span>

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 12px",
          background: "linear-gradient(135deg, #a67c52, #7d5a50)",
          color: "#faf7f2",
          borderRadius: "8px",
          textDecoration: "none",
          fontSize: "14px",
          fontWeight: "500",
          transition: "all 0.3s ease",
          cursor: "pointer",
          maxWidth: "fit-content",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)"
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(166, 124, 82, 0.3)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)"
          e.currentTarget.style.boxShadow = "none"
        }}
        onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
      >
        <FileText size={16} />
        <span>{label}</span>
        <ExternalLink size={14} />
      </div>
    )
  }

  const formatArray = (arr) => {
    if (!arr || !arr.length) return "None specified"
    return arr.join(" • ")
  }

  const formatAdvisors = (advisors) => {
    if (!advisors || !advisors.length) return "None specified"
    return advisors.map((advisor, index) => (
      <div key={index} style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: index < advisors.length - 1 ? "1px solid rgba(200, 182, 166, 0.2)" : "none" }}>
        <div style={{ fontWeight: "600", color: "#4a352f", marginBottom: "8px" }}>
          {advisor.advisorName || `Advisor ${index + 1}`}
        </div>
        <div style={{ fontSize: "13px", color: "#7d5a50", lineHeight: "1.6" }}>
          <div><strong>Role:</strong> {formatArray(advisor.advisoryRole)}</div>
          <div><strong>Focus:</strong> {formatArray(advisor.supportFocus)}</div>
          <div><strong>Expertise:</strong> {formatArray(advisor.functionalExpertise)}</div>
        </div>
      </div>
    ))
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
            max-height: 2000px;
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
                  Advisory Matching Application
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
            {/* Advisory Needs Assessment */}
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
                onClick={() => toggleSection("advisoryNeedsAssessment")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  background: expandedSections.advisoryNeedsAssessment
                    ? "linear-gradient(135deg, #7d5a50, #4a352f)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Target size={20} color={expandedSections.advisoryNeedsAssessment ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "clamp(16px, 2.5vw, 20px)",
                      fontWeight: "700",
                      color: expandedSections.advisoryNeedsAssessment ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Advisory Needs Assessment
                  </h2>
                </div>
                {expandedSections.advisoryNeedsAssessment ? (
                  <ChevronUp size={20} color="#faf7f2" />
                ) : (
                  <ChevronDown size={20} color="#4a352f" />
                )}
              </div>

              {expandedSections.advisoryNeedsAssessment && (
                <div
                  style={{
                    padding: "20px",
                    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.8), rgba(240, 230, 217, 0.6))",
                    animation: "slideDown 0.3s ease-out",
                  }}
                >
                  {/* Advisors Section */}
                  <div
                    style={{
                      background: "rgba(166, 124, 82, 0.1)",
                      borderRadius: "12px",
                      padding: "16px",
                      border: "1px solid rgba(166, 124, 82, 0.2)",
                      marginBottom: "16px",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontSize: "12px",
                        color: "#7d5a50",
                        marginBottom: "12px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Requested Advisors
                    </span>
                    <div>
                      {formatAdvisors(formData?.advisoryNeedsAssessment?.advisors)}
                    </div>
                  </div>

                  {/* Engagement Preferences */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: "16px",
                      marginBottom: "16px",
                    }}
                  >
                    {[
                      { label: "Time Commitment", value: formData?.advisoryNeedsAssessment?.timeCommitment },
                      { label: "Compensation Type", value: formData?.advisoryNeedsAssessment?.compensationType },
                      { label: "Compensation Amount", value: formData?.advisoryNeedsAssessment?.compensationAmount },
                      { label: "Meeting Format", value: formData?.advisoryNeedsAssessment?.meetingFormat },
                      { label: "Province", value: formData?.advisoryNeedsAssessment?.province || "Not applicable" },
                      { label: "Start Date", value: formData?.advisoryNeedsAssessment?.startDate },
                      { label: "Project Duration", value: formData?.advisoryNeedsAssessment?.projectDuration },
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

                  {/* Matching Preferences */}
                  <div
                    style={{
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
                        marginBottom: "12px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Matching Preferences
                    </span>
                    <div style={{ display: "grid", gap: "12px" }}>
                      <div>
                        <strong style={{ color: "#4a352f" }}>B-BBEE Level:</strong>{" "}
                        <span style={{ color: "#7d5a50" }}>{formData?.advisoryNeedsAssessment?.bbeeLevel || "Not specified"}</span>
                      </div>
                      <div>
                        <strong style={{ color: "#4a352f" }}>Ownership Preferences:</strong>{" "}
                        <span style={{ color: "#7d5a50" }}>{formatArray(formData?.advisoryNeedsAssessment?.ownershipPrefs)}</span>
                      </div>
                      <div>
                        <strong style={{ color: "#4a352f" }}>Sector Experience:</strong>{" "}
                        <span style={{ color: "#7d5a50" }}>{formData?.advisoryNeedsAssessment?.sectorExperience || "Not specified"}</span>
                      </div>
                      <div>
                        <strong style={{ color: "#4a352f" }}>Engagement Type:</strong>{" "}
                        <span style={{ color: "#7d5a50" }}>{formData?.advisoryNeedsAssessment?.engagementType || "Not specified"}</span>
                      </div>
                      <div>
                        <strong style={{ color: "#4a352f" }}>Delivery Mode:</strong>{" "}
                        <span style={{ color: "#7d5a50" }}>{formatArray(formData?.advisoryNeedsAssessment?.deliveryModes)}</span>
                      </div>
                      <div>
                        <strong style={{ color: "#4a352f" }}>Location:</strong>{" "}
                        <span style={{ color: "#7d5a50" }}>{formData?.advisoryNeedsAssessment?.location || "Not specified"}</span>
                      </div>
                      <div>
                        <strong style={{ color: "#4a352f" }}>Budget Range:</strong>{" "}
                        <span style={{ color: "#7d5a50" }}>
                          {formData?.advisoryNeedsAssessment?.minBudget || "R 0"} - {formData?.advisoryNeedsAssessment?.maxBudget || "R 0"}
                        </span>
                      </div>
                      <div>
                        <strong style={{ color: "#4a352f" }}>ESD/CSR Program:</strong>{" "}
                        <span style={{ color: "#7d5a50" }}>
                          {formData?.advisoryNeedsAssessment?.esdProgram === true ? "Yes" : formData?.advisoryNeedsAssessment?.esdProgram === false ? "No" : "Not specified"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Document Uploads */}
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
                onClick={() => toggleSection("documentUploads")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  background: expandedSections.documentUploads
                    ? "linear-gradient(135deg, #a67c52, #7d5a50)"
                    : "linear-gradient(135deg, #e6d7c3, #c8b6a6)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Upload size={20} color={expandedSections.documentUploads ? "#faf7f2" : "#4a352f"} />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "clamp(16px, 2.5vw, 20px)",
                      fontWeight: "700",
                      color: expandedSections.documentUploads ? "#faf7f2" : "#4a352f",
                    }}
                  >
                    Document Uploads
                  </h2>
                </div>
                {expandedSections.documentUploads ? (
                  <ChevronUp size={20} color="#faf7f2" />
                ) : (
                  <ChevronDown size={20} color="#4a352f" />
                )}
              </div>

              {expandedSections.documentUploads && (
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
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        background: "rgba(250, 247, 242, 0.8)",
                        borderRadius: "12px",
                        padding: "16px",
                        border: "1px solid rgba(200, 182, 166, 0.2)",
                        transition: "all 0.3s ease",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          fontSize: "12px",
                          color: "#7d5a50",
                          marginBottom: "8px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Business Plan
                      </span>
                      {formData?.documentUploads?.businessPlan && formData.documentUploads.businessPlan.length > 0 ? (
                        renderDocumentLink(formData.documentUploads.businessPlan[0], "Business Plan")
                      ) : (
                        <span style={{ color: "#7d5a50", fontStyle: "italic" }}>Not uploaded</span>
                      )}
                    </div>

                    <div
                      style={{
                        background: "rgba(250, 247, 242, 0.8)",
                        borderRadius: "12px",
                        padding: "16px",
                        border: "1px solid rgba(200, 182, 166, 0.2)",
                        transition: "all 0.3s ease",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          fontSize: "12px",
                          color: "#7d5a50",
                          marginBottom: "8px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Latest Financials
                      </span>
                      {formData?.documentUploads?.latestFinancials &&
                      formData.documentUploads.latestFinancials.length > 0 ? (
                        renderDocumentLink(formData.documentUploads.latestFinancials[0], "Latest Financials")
                      ) : (
                        <span style={{ color: "#7d5a50", fontStyle: "italic" }}>Not uploaded</span>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
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
                      Current Board List
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
                      {formData?.documentUploads?.currentBoardList || "None"}
                    </div>
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
              onClick={() => window.location.href = "/find-advisors"}
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