"use client"
import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { doc, getDoc, getDocs, query, where, collection } from 'firebase/firestore'
import { auth, db } from "../../firebaseConfig"
import { Eye, Filter } from "lucide-react"

// Status definitions with color scheme
const STATUS_TYPES = {
  "New Match": {
    color: "#EFEBE9",
    textColor: "#3E2723",
  },
  Shortlisted: {
    color: "#E8F5E9",
    textColor: "#2E7D32",
  },
  Contacted: {
    color: "#FFF8E1",
    textColor: "#F57F17",
  },
  Confirmed: {
    color: "#E8F5E9",
    textColor: "#1B5E20",
  },
  Declined: {
    color: "#FFEBEE",
    textColor: "#C62828",
  },
}

// Text truncation component
const TruncatedText = ({ text, maxLength = 25 }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!text || text === "-" || text === "Not specified" || text === "Various") {
    return <span style={{ color: "#999" }}>{text || "-"}</span>
  }

  const shouldTruncate = text.length > maxLength
  const displayText = isExpanded || !shouldTruncate ? text : `${text.slice(0, maxLength)}...`

  const toggleExpanded = (e) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  return (
    <div style={{ lineHeight: "1.4" }}>
      <span style={{ wordBreak: "break-word" }}>{displayText}</span>
      {shouldTruncate && (
        <button
          style={{
            background: "none",
            border: "none",
            color: "#5D4037",
            cursor: "pointer",
            fontSize: "0.7rem",
            marginLeft: "4px",
            textDecoration: "underline",
            padding: "0",
          }}
          onClick={toggleExpanded}
        >
          {isExpanded ? "Less" : "More"}
        </button>
      )}
    </div>
  )
}

const getStatusStyle = (status) => {
  return STATUS_TYPES[status] || { color: "#F5F5F5", textColor: "#666666" }
}

// Add this helper function
const getScoreColor = (score) => {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
};


// Add these style constants
const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(62, 39, 35, 0.85)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
  animation: "fadeIn 0.3s ease-out",
  backdropFilter: "blur(4px)",
};

const modalContentStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "20px",
  padding: "40px",
  maxWidth: "900px",
  width: "95%",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 20px 60px rgba(62, 39, 35, 0.5), 0 0 0 1px rgba(141, 110, 99, 0.1)",
  border: "none",
  animation: "slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
  position: "relative",
};


// Match Breakdown Modal Component
const MatchBreakdownModal = ({ intern, onClose }) => {
  const matchAnalysis = intern?.matchAnalysis || {
    breakdown: {
      availabilityAlignment: {
        score: 0,
        maxScore: 15,
        description: "Availability data not available",
      },
      locationCompatibility: {
        score: 0,
        maxScore: 20,
        description: "Location data not available",
      },
      profileCompleteness: {
        score: 0,
        maxScore: 10,
        description: "Profile data not available",
      },
      skillsMatch: {
        score: 0,
        maxScore: 30,
        description: "Skills data not available",
      },
      workModeCompatibility: {
        score: 0,
        maxScore: 25,
        description: "Work mode data not available",
      },
    },
    matchSummary: {
      overallScore: 0,
      matchPercentage: intern?.matchPercentage || 0,
      overallAssessment: "No assessment available",
      strongPoints: ["No strengths data available"],
      weakPoints: [],
    },
  };

  const { breakdown = {}, matchSummary = {} } = matchAnalysis;
  const {
    availabilityAlignment = {},
    locationCompatibility = {},
    profileCompleteness = {},
    skillsMatch = {},
    workModeCompatibility = {},
  } = breakdown;

  const {
    overallAssessment = "No assessment",
    matchPercentage = intern?.matchPercentage,
    strongPoints = [],
    overallScore = 0,
  } = matchSummary;

  const scoreData = [
    {
      name: "Skills/Role",
      ...skillsMatch,
      maxScore: skillsMatch.maxScore || 30,
      color: "#4CAF50",
    },
    {
      name: "Work Mode",
      ...workModeCompatibility,
      maxScore: workModeCompatibility.maxScore || 25,
      color: "#2196F3",
    },
    {
      name: "Location",
      ...locationCompatibility,
      maxScore: locationCompatibility.maxScore || 20,
      color: "#FFC107",
    },
    {
      name: "Availability",
      ...availabilityAlignment,
      maxScore: availabilityAlignment.maxScore || 15,
      color: "#9C27B0",
    },
    {
      name: "Profile",
      ...profileCompleteness,
      maxScore: profileCompleteness.maxScore || 10,
      color: "#607D8B",
    },
  ];

  const getScoreColor = (score) => {
    if (score >= 80) return "#22c55e";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div
        style={{
          ...modalContentStyle,
          maxWidth: "800px",
          padding: "32px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "700",
                margin: "0 0 4px 0",
                color: "#3e2723",
              }}
            >
              Match Breakdown
            </h2>
            <p
              style={{
                fontSize: "16px",
                color: "#666",
                margin: 0,
              }}
            >
              {intern?.internName || "Applicant"} - {intern?.internRole || "Role not specified"}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#666",
              padding: "8px",
            }}
          >
            ✖
          </button>
        </div>

        {/* Main Score */}
        <div
          style={{
            backgroundColor: "#f8f9fa",
            padding: "24px",
            borderRadius: "12px",
            marginBottom: "32px",
            textAlign: "center",
          }}
        >
          <h3
            style={{
              fontSize: "20px",
              fontWeight: "600",
              margin: "0 0 16px 0",
              color: "#4a352f",
            }}
          >
            {overallAssessment}
          </h3>

          <div
            style={{
              fontSize: "48px",
              fontWeight: "800",
              color: getScoreColor(matchPercentage),
              margin: "0 0 8px 0",
            }}
          >
            {matchPercentage}%
          </div>

          <p
            style={{
              fontSize: "16px",
              color: "#666",
              margin: "0 0 24px 0",
            }}
          >
            Compatibility with {intern?.internRole || "this role"}
          </p>

          {strongPoints.length > 0 && (
            <div
              style={{
                textAlign: "left",
                maxWidth: "500px",
                margin: "0 auto",
              }}
            >
              <h4
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  margin: "0 0 12px 0",
                  color: "#4a352f",
                }}
              >
                Strengths
              </h4>
              <ul
                style={{
                  paddingLeft: "20px",
                  margin: 0,
                }}
              >
                {strongPoints.map((point, index) => (
                  <li
                    key={index}
                    style={{
                      marginBottom: "8px",
                      fontSize: "14px",
                      color: "#333",
                    }}
                  >
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Detailed Breakdown */}
        <div>
          <h4
            style={{
              fontSize: "20px",
              fontWeight: "600",
              margin: "0 0 20px 0",
              color: "#4a352f",
            }}
          >
            Detailed Breakdown
          </h4>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gap: "16px",
            }}
          >
            {scoreData.map((item, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: "#fff",
                  padding: "16px",
                  borderRadius: "8px",
                  borderLeft: `4px solid ${item.color}`,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}
              >
                <h5
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    margin: "0 0 8px 0",
                    color: "#4a352f",
                  }}
                >
                  {item.name}
                </h5>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "4px",
                      backgroundColor: item.color,
                      marginRight: "8px",
                    }}
                  />
                  <div>
                    <span
                      style={{
                        fontWeight: "600",
                        color: item.color,
                      }}
                    >
                      {item.score || 0}/{item.maxScore}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#666",
                        marginLeft: "8px",
                      }}
                    >
                      ({item.score && item.maxScore ? Math.round((item.score / item.maxScore) * 100) : 0}%)
                    </span>
                  </div>
                </div>

                <p
                  style={{
                    fontSize: "14px",
                    color: "#666",
                    margin: 0,
                  }}
                >
                  {item.description || "No description available"}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "32px",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 24px",
              backgroundColor: "#5d4037",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// BIG Score Breakdown Modal Component
const BigScoreBreakdownModal = ({ intern, onClose,bigScoreData }) => {
  // Sample BIG score data structure (replace with actual data from your intern object)
  // const bigScoreData = {
  //   PresentationScore: {
  //     score: intern.aiPresentationScore || 0,
  //     color: getScoreColor(intern.aiPresentationScore || 0),
  //   },
  //   ProfessionalSkillsScore: {
  //     score: intern.aiProfessionalSkillsScore || 0,
  //     color: getScoreColor(intern.aiProfessionalSkillsScore || 0),
  //   },
  //   WorkExperienceScore: {
  //     score: intern.aiWorkExperienceScore || 0,
  //     color: getScoreColor(intern.aiWorkExperienceScore || 0),
  //   },
  //   AcademicScore: {
  //     score: intern.aiAcademicScore || 0,
  //     color: getScoreColor(intern.aiAcademicScore || 0),
  //   },
  // };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={{ ...modalContentStyle, maxWidth: "1000px" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
          <h3 style={{ fontSize: "32px", fontWeight: "800", color: "#3e2723", margin: 0 }}>
            BIG Score Breakdown
          </h3>
          <div
            style={{
              backgroundColor: getScoreColor(intern.bigScore),
              color: "white",
              borderRadius: "50%",
              width: "100px",
              height: "100px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              fontWeight: "800",
              boxShadow: "0 12px 32px rgba(93, 64, 55, 0.4)",
            }}
          >
            {intern.bigScore}
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#f8f5f3",
            padding: "24px",
            borderRadius: "16px",
            marginBottom: "32px",
            border: "2px solid #8d6e63",
          }}
        >
          <p
            style={{
              fontSize: "20px",
              color: "#5d4037",
              marginBottom: "16px",
              lineHeight: "1.6",
              fontWeight: "500",
            }}
          >
            The BIG Score is a comprehensive evaluation of {intern.internName}'s internship readiness
            across key dimensions:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#4E342E" }}></div>
              <span style={{ fontWeight: "600", color: "#3e2723" }}>Presentation Score (25%)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#8D6E63" }}></div>
              <span style={{ fontWeight: "600", color: "#3e2723" }}>Professional Skills (25%)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#5D4037" }}></div>
              <span style={{ fontWeight: "600", color: "#3e2723" }}>Work Experience (25%)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#3E2723" }}></div>
              <span style={{ fontWeight: "600", color: "#3e2723" }}>Academic Score (25%)</span>
            </div>
          </div>
        </div>

        {/* Score breakdown sections */}
        {Object.entries(bigScoreData).map(([key, data]) => (
          <div
            key={key}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              padding: "32px",
              marginBottom: "24px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)",
              border: `2px solid ${data.color}20`,
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 12px 40px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)";
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h4
                  style={{
                    margin: 0,
                    fontSize: "24px",
                    fontWeight: "700",
                    textTransform: "capitalize",
                    color: "#3e2723",
                  }}
                >
                  {key === "PresentationScore"
                    ? "Presentation Score"
                    : key === "ProfessionalSkillsScore"
                    ? "Professional Skills Score"
                    : key === "WorkExperienceScore"
                    ? "Work Experience Score"
                    : key === "AcademicScore"
                    ? "Academic Score"
                    : key}
                </h4>
                <p style={{ margin: "8px 0 0 0", fontSize: "16px", color: "#666", fontWeight: "400" }}>
                  {key === "PresentationScore" && "Communication and presentation capabilities assessment"}
                  {key === "ProfessionalSkillsScore" && "Technical and professional competencies evaluation"}
                  {key === "WorkExperienceScore" && "Relevant work experience and practical skills"}
                  {key === "AcademicScore" && "Educational background and academic achievements"}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div
                  style={{
                    fontSize: "36px",
                    fontWeight: "800",
                    color: data.color,
                    textShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  {data.score}%
                </div>
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    backgroundColor: `${data.color}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `3px solid ${data.color}`,
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      backgroundColor: data.color,
                    }}
                  />
                </div>
              </div>
            </div>
            <div
              style={{
                width: "100%",
                height: "20px",
                backgroundColor: "#f5f5f5",
                borderRadius: "10px",
                overflow: "hidden",
                boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.1)",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: `${data.score}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${data.color}, ${data.color}dd)`,
                  borderRadius: "10px",
                  transition: "width 2s cubic-bezier(0.4, 0, 0.2, 1)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                    animation: "shimmer 2s infinite",
                  }}
                />
              </div>
            </div>
          </div>
        ))}

        <div
          style={{
            backgroundColor: "#f3e5f5",
            padding: "24px",
            borderRadius: "16px",
            marginTop: "32px",
            marginBottom: "32px",
            border: "2px solid #ce93d8",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "24px", color: "#5d4037" }}>ℹ️</span>
            <p style={{ margin: 0, color: "#5d4037", fontSize: "16px", lineHeight: "1.5", fontWeight: "500" }}>
              The BIG Score is calculated using equal weights: Presentation Score (25%) + Professional Skills
              Score (25%) + Work Experience Score (25%) + Academic Score (25%)
            </p>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            style={{
              background: "linear-gradient(135deg, #5d4037 0%, #4e342e 100%)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "16px 32px",
              fontSize: "18px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(93, 64, 55, 0.3)",
              transition: "all 0.3s ease",
            }}
            onMouseOver={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 8px 24px rgba(93, 64, 55, 0.4)";
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 16px rgba(93, 64, 55, 0.3)";
            }}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Empty State Component
const EmptyStateTable = () => {
  return (
    <div>
      {/* Empty Table Structure */}
      <div
        style={{
          borderRadius: "8px",
          border: "1px solid #E0E0E0",
          boxShadow: "0 4px 24px rgba(93, 64, 55, 0.08)",
          width: "100%",
          marginBottom: "2rem",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "white",
            fontSize: "0.8rem",
            backgroundColor: "#FFFFFF",
            tableLayout: "fixed",
          }}
        >
          <colgroup>
            <col style={{ width: "10%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "8%" }} />
          </colgroup>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Intern Name</th>
              <th style={tableHeaderStyle}>Institution</th>
              <th style={tableHeaderStyle}>Degree</th>
              <th style={tableHeaderStyle}>Field</th>
              <th style={tableHeaderStyle}>Location</th>
              <th style={tableHeaderStyle}>SME Name</th>
              <th style={tableHeaderStyle}>Intern Role</th>
              <th style={tableHeaderStyle}>Sponsorship Start</th>
              <th style={tableHeaderStyle}>Internship Start</th>
              <th style={tableHeaderStyle}>Match %</th>
              <th style={tableHeaderStyle}>BIG Score</th>
              <th style={tableHeaderStyle}>Internship Status</th>
              <th style={tableHeaderStyle}>Sponsorship period</th>
              <th style={{ ...tableHeaderStyle, borderRight: "none" }}>Rating</th>
            </tr>
          </thead>
          <tbody>
            {/* Empty rows to show structure */}
            {[].map((index) => (
              <tr key={index} style={{ borderBottom: "1px solid #E0E0E0", opacity: 0.3 }}>
                <td style={tableCellStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: "#EFEBE9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.7rem",
                        fontWeight: "bold",
                        color: "#5D4037",
                        flexShrink: 0,
                      }}
                    >
                      -
                    </div>
                    <span style={{ color: "#999" }}>No data</span>
                  </div>
                </td>
                <td style={tableCellStyle}><span style={{ color: "#999" }}>-</span></td>
                <td style={tableCellStyle}><span style={{ color: "#999" }}>-</span></td>
                <td style={tableCellStyle}><span style={{ color: "#999" }}>-</span></td>
                <td style={tableCellStyle}><span style={{ color: "#999" }}>-</span></td>
                <td style={tableCellStyle}><span style={{ color: "#999" }}>-</span></td>
                <td style={tableCellStyle}><span style={{ color: "#999" }}>-</span></td>
                <td style={tableCellStyle}><span style={{ color: "#999" }}>-</span></td>
                <td style={tableCellStyle}><span style={{ color: "#999" }}>-</span></td>
                <td style={tableCellStyle}>
                  <div style={matchContainerStyle}>
                    <div style={progressBarStyle}>
                      <div style={{ ...progressFillStyle, width: "0%" }} />
                    </div>
                    <span style={{ ...matchScoreStyle, color: "#999" }}>0%</span>
                  </div>
                </td>
                <td style={tableCellStyle}>
                  <div style={matchContainerStyle}>
                    <div style={progressBarStyle}>
                      <div style={{ ...progressFillStyle, width: "0%" }} />
                    </div>
                    <span style={{ ...matchScoreStyle, color: "#999" }}>0%</span>
                  </div>
                </td>
                <td style={tableCellStyle}><span style={{ color: "#999" }}>-</span></td>
                <td style={tableCellStyle}><span style={{ color: "#999" }}>-</span></td>
                <td style={{ ...tableCellStyle, borderRight: "none" }}><span style={{ color: "#999" }}>-</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Message underneath the empty table */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "3rem 2rem",
          backgroundColor: "#f8f9fa",
          borderRadius: "12px",
          border: "2px dashed #d7ccc8",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "3rem",
            marginBottom: "1rem",
            color: "#8d6e63",
          }}
        >
          📋
        </div>
        <h3
          style={{
            fontSize: "1.5rem",
            fontWeight: "600",
            color: "#5d4037",
            margin: "0 0 1rem 0",
          }}
        >
          No Applications Yet
        </h3>
        <p
          style={{
            fontSize: "1.1rem",
            color: "#666",
            margin: "0 0 1.5rem 0",
            maxWidth: "500px",
            lineHeight: "1.6",
          }}
        >
          You have not applied for any interns, so there are no matches available. You need to apply first.
        </p>
     
      </div>
    </div>
  );
};

export function ProgramSponsorInternTable() {
  const [interns, setInterns] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showBriefModal, setShowBriefModal] = useState(false)
  const [selectedIntern, setSelectedIntern] = useState(null)
  const [messageText, setMessageText] = useState("")
  const [noteText, setNoteText] = useState("")
  const [statuses, setStatuses] = useState({})
  const [notification, setNotification] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [currentSponsor, setCurrentSponsor] = useState(null)
  const [filters, setFilters] = useState({
    location: "",
    matchScore: 0,
    bigScore: 0,
    institution: "",
    degree: "",
    field: [],
    type: "",
    sortBy: "",
  })

  
  // Add to your existing state declarations
const [showMatchModal, setShowMatchModal] = useState(false);
const [selectedMatchIntern, setSelectedMatchIntern] = useState(null);
  const [bigScoreData, setBigScoreData] = useState({
    PresentationScore: { score: 0, color: "#4E342E" },
    ProfessionalSkillsScore: { score: 0, color: "#8D6E63" },
    WorkExperienceScore: { score: 0, color: "#5D4037" },
    AcademicScore: { score: 0, color: "#3E2723" },
    // leadership: { score: 0, color: "#4E342E" },
  })
// Add to your existing state declarations
const [showBigScoreModal, setShowBigScoreModal] = useState(false);
const [selectedBigScoreIntern, setSelectedBigScoreIntern] = useState(null);

// Add these handler functions
const handleBigScoreClick = (intern) => {
  setSelectedBigScoreIntern(intern);
  setShowBigScoreModal(true);
};

const closeBigScoreModal = () => {
  setShowBigScoreModal(false);
  setSelectedBigScoreIntern(null);
};
// Add these handler functions
const handleMatchScoreBreakdown = (intern) => {
  const matchAnalysis = intern.matchAnalysis || {
    breakdown: {
      availabilityAlignment: { score: 0, maxScore: 15, description: "No data available" },
      locationCompatibility: { score: 0, maxScore: 20, description: "No data available" },
      profileCompleteness: { score: 0, maxScore: 10, description: "No data available" },
      skillsMatch: { score: 0, maxScore: 30, description: "No data available" },
      workModeCompatibility: { score: 0, maxScore: 25, description: "No data available" },
    },
    matchSummary: {
      overallScore: 0,
      matchPercentage: 0,
      overallAssessment: "No data",
      strongPoints: [],
      weakPoints: [],
    },
  };

  setSelectedMatchIntern({
    ...intern,
    matchAnalysis,
  });
  setShowMatchModal(true);
};

const closeMatchModal = () => {
  setShowMatchModal(false);
  setSelectedMatchIntern(null);
};
  const renderDocumentLink = (url, label = "View Document") => {
    if (!url) return "No document uploaded";
    
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="document-link">
        {label}
      </a>
    );
  };


  const filterPanelRef = useRef(null)

  useEffect(() => {
    setMounted(true)
    fetchSponsorAndInterns()
    return () => setMounted(false)
  }, [])

  const calculateMonthsLeft = (startDate, durationInMonths) => {
    if (!startDate || !durationInMonths) return null;
    
    const start = new Date(startDate);
    const now = new Date();
    const endDate = new Date(start);
    endDate.setMonth(start.getMonth() + parseInt(durationInMonths));
    
    if (now >= endDate) return 0; // Program has ended
    
    const monthsElapsed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    const monthsLeft = parseInt(durationInMonths) - monthsElapsed;
    
    return Math.max(0, monthsLeft);
  };

  const fetchSponsorAndInterns = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // First get the current sponsor's profile to get their organization name
      const sponsorProfileRef = doc(db, "programSponsorProfiles", user.uid);
      const sponsorProfileSnap = await getDoc(sponsorProfileRef);
      
      if (!sponsorProfileSnap.exists()) {
        console.error("Sponsor profile not found");
        setLoading(false);
        return;
      }

      const sponsorData = sponsorProfileSnap.data();
      const sponsorOrgName = sponsorData.formData?.entityOverview?.organizationName;
      setCurrentSponsor(sponsorData);

      // Now fetch all internship applications
      const applicationsSnapshot = await getDocs(collection(db, "internshipApplications"));
      
      const internMatches = await Promise.all(
        applicationsSnapshot.docs.map(async (applicationDoc) => {
          const data = applicationDoc.data();
          const internId = data.applicantId;
          
          if (!internId) return null;

          try {
            // Get the intern profile to check the sponsor name
            const internProfileRef = doc(db, "internProfiles", internId);
            const internProfileSnap = await getDoc(internProfileRef);
            
            if (!internProfileSnap.exists()) return null;

            const profile = internProfileSnap.data();
            const internSponsorName = profile.formData?.programAffiliation?.sponsorName;
            const sponsorDate = profile.formData?.programAffiliation?.programStartDate;
            const sponsorduration = profile.formData?.programAffiliation?.duration;

            const monthsLeft = calculateMonthsLeft(sponsorDate, sponsorduration);

            // Only include if the intern's sponsor matches the current sponsor's org name
            if (internSponsorName.toLowerCase() !== sponsorOrgName.toLowerCase()) return null;


            // Fetch additional data for briefDescription - with error handling
            let formData = {};
            let Application = {};
            let ApplicationOverview = {};
            let overview = {};
            let type="Unspecified";
            try {
              const appDoc = await getDoc(doc(db, "internApplications", data.sponsorId));
              const AppData = appDoc.data() || {};
              
              // Get universal profiles data
              const snapshot = await getDocs(collection(db, "universalProfiles"));
              const Smedata = snapshot.docs.length > 0 ? snapshot.docs[0].data() : {};
              
              formData = Smedata || {};
              Application = AppData.internshipRequest || AppData || {};
              type = Application.internType
              ApplicationOverview = AppData.jobOverview || AppData || {};
              overview = formData.entityOverview || {};
            } catch (briefError) {
              console.warn(`Error fetching brief description data for ${internId}:`, briefError);
              // Continue with empty objects as fallbacks
            }

            // Extract profile data
            const profileData = {
              cvUrl: profile?.formData?.requiredDocuments?.cvFile?.[0]?.url || 
                    profile?.requiredDocuments?.cvFile?.[0]?.url,
              idDocumentUrl: profile?.formData?.requiredDocuments?.idDocument?.[0]?.url || 
                           profile?.requiredDocuments?.idDocument?.[0]?.url,
              transcriptUrl: profile?.formData?.requiredDocuments?.transcriptFile?.[0]?.url || 
                           profile?.requiredDocuments?.transcriptFile?.[0]?.url,
              motivationLetterUrl: profile?.formData?.requiredDocuments?.motivationLetter?.[0]?.url || 
                                  profile?.requiredDocuments?.motivationLetter?.[0]?.url,
              portfolioFileUrl: profile?.formData?.requiredDocuments?.portfolioFile?.[0]?.url || 
                               profile?.requiredDocuments?.portfolioFile?.[0]?.url,
              proofOfStudyUrl: profile?.formData?.requiredDocuments?.proofOfStudy?.[0]?.url || 
                              profile?.requiredDocuments?.proofOfStudy?.[0]?.url,
              referencesUrl: profile?.formData?.requiredDocuments?.references?.[0]?.url || 
                           profile?.requiredDocuments?.references?.[0]?.url,
              sponsorName: profile.formData?.programAffiliation?.sponsorName || null,
              availableHours: profile?.skillsInterests?.availableHours || null,
              internTypePreference: profile?.skillsInterests?.internTypePreference || null,
              languagesSpoken: profile?.skillsInterests?.languagesSpoken || [],
              technicalSkills: profile?.skillsInterests?.technicalSkills || [],
              userEmail: profile?.userEmail || null
            };
               // Fetch average rating for this intern - CHANGED: using internId instead of internName
            let avgRating = null;
            try {
              const reviewsCol = collection(db, "internReviews");
              // CHANGED: Using internId instead of internName
              const q = query(reviewsCol, where("internId", "==", internId));
              const reviewsSnapshot = await getDocs(q);

              if (!reviewsSnapshot.empty) {
                const ratings = reviewsSnapshot.docs.map(doc => doc.data().rating || 0);
                avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
              }
            } catch (reviewError) {
              console.warn(`Error fetching reviews for intern ${internId}:`, reviewError);
            }

            setBigScoreData({
            PresentationScore: {
              score: data.aiPresentationScore || 0,
              color: getScoreColor(data.aiPresentationScore || 0),
            },
            ProfessionalSkillsScore: {
              score: data.aiProfessionalSkillsScore || 0,
              color: getScoreColor(data.aiProfessionalSkillsScore || 0),
            },
            WorkExperienceScore: {
              score: data.aiWorkExperienceScore || 0,
              color: getScoreColor(data.aiWorkExperienceScore || 0),
            },
            AcademicScore: {
              score: data.aiAcademicScore || 0,
              color: getScoreColor(data.aiAcademicScore || 0),
            },
          })

            return {
              id: applicationDoc.id,
              internId: internId,
              internName: data.applicantName,
              location: data.location,
              institution: data.institution,
              degree: data.degree,
              field: data.field,
              internType: data.locationFlexibility[0],
              internRole: data.role,
              start: data.startDate || "Anytime",
              sponsorStart: sponsorDate,
              monthsLeft: monthsLeft, 
              sponsorDuration: sponsorduration, 
              type,
              matchPercentage: data.matchAnalysis?.overallScore || 0,
              matchAnalysis:data.matchAnalysis || {},
              SMEName:data.sponsorName || "N/A",
              bigScore: data.bigInternScore || 0,
              status: data.status || "New Match",
              action: "Application Review",
                rating: avgRating !== null ? avgRating.toFixed(1) + " ★" : "No ratings yet",
              briefDescription: {
                title: `Internship at ${overview.registeredName || overview.organizationName || "Organization"}`,
                company: overview.registeredName || overview.organizationName || "Organization",
                duration: Application.duration || "unspecified",
                requirements: ApplicationOverview.briefDescription || [
                  "Currently pursuing relevant degree",
                  "Strong communication skills",
                  "Willingness to learn",
                  "Team collaboration abilities"
                ],
                responsibilities: ApplicationOverview.keyTasks || [
                  "Support daily operations",
                  "Participate in projects",
                  "Learn industry best practices",
                  "Contribute to team initiatives"
                ],
                benefits: ApplicationOverview.learningOutcomes || [
                  "Professional development",
                  "Mentorship opportunities",
                  "Industry exposure",
                  "Networking opportunities"
                ],
                applicationProcess: formData.applicationBrief?.applicationProcess || "Submit application through our portal. Successful candidates will be contacted for interviews."
              },
              // Document URLs
              cv: profileData.cvUrl,
              idDocument: profileData.idDocumentUrl,
              transcript: profileData.transcriptUrl,
              motivationLetter: profileData.motivationLetterUrl,
              portfolioFile: profileData.portfolioFileUrl,
              proofOfStudy: profileData.proofOfStudyUrl,
              references: profileData.referencesUrl,
              // Profile information
              sponsorName: profileData.sponsorName,
              profileEmail: profileData.userEmail,
              availableHours: profileData.availableHours,
              internTypePreference: profileData.internTypePreference,
              languagesSpoken: profileData.languagesSpoken,
              technicalSkills: profileData.technicalSkills
            };
          } catch (error) {
            console.error(`Error processing intern ${internId}:`, error);
            return null;
          }
        })
      );

      // Filter out any null values from the map
      const validInterns = internMatches.filter(intern => intern !== null);
      setInterns(validInterns);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setLoading(false);
    }
  };

  const filteredInterns = interns.filter((intern) => {
    if (filters.location && !intern.location.includes(filters.location)) return false
    if (intern.matchPercentage < filters.matchScore) return false
    if (intern.bigScore < filters.bigScore) return false
    if (filters.institution && !intern.institution.includes(filters.institution)) return false
    if (filters.degree && intern.degree !== filters.degree) return false
    if (filters.field.length > 0 && !filters.field.some(field => intern.field.includes(field))) return false
    if (filters.type && intern.type !== filters.type) return false
    return true
  })

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(event.target)) {
        setShowFilters(false)
      }
    }
    if (showFilters) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showFilters])

  const handleConnectClick = (intern) => {
    setStatuses((prev) => ({ ...prev, [intern.id]: "Contacted" }))
    setNotification({ type: "success", message: `Contacted ${intern.internName}!` })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleViewDetails = (intern) => {
    setSelectedIntern(intern)
    setShowModal(true)
  }

  const handleViewDocuments = (intern) => {
    setSelectedIntern(intern)
    setShowDocumentModal(true)
  }

  const handleMessage = (intern) => {
    setSelectedIntern(intern)
    setMessageText("")
    setShowMessageModal(true)
  }

  const handleAddNote = (intern) => {
    setSelectedIntern(intern)
    setNoteText("")
    setShowNoteModal(true)
  }

  const handleViewBrief = (intern) => {
    setSelectedIntern(intern)
    setShowBriefModal(true)
  }

  const handleSendMessage = () => {
    if (messageText.trim()) {
      setNotification({ type: "success", message: `Message sent to ${selectedIntern.internName}` })
      setShowMessageModal(false)
      setMessageText("")
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const handleSaveNote = () => {
    if (noteText.trim()) {
      setNotification({ type: "info", message: `Note saved for ${selectedIntern.internName}` })
      setShowNoteModal(false)
      setNoteText("")
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const handleExport = () => {
    setNotification({ type: "info", message: "Exporting intern data..." })
    setTimeout(() => setNotification(null), 3000)
  }

  const closeAllModals = () => {
    setShowModal(false)
    setShowDocumentModal(false)
    setShowMessageModal(false)
    setShowNoteModal(false)
    setShowBriefModal(false)
    setSelectedIntern(null)
  }

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Loading applications...</div>
  }

  // SA Universities list in alphabetical order
  const saUniversities = [
    "Cape Peninsula University of Technology",
    "Central University of Technology",
    "Durban University of Technology",
    "Mangosuthu University of Technology",
    "Nelson Mandela University",
    "North-West University",
    "Rhodes University",
    "Sefako Makgatho Health Sciences University",
    "Sol Plaatje University",
    "Stellenbosch University",
    "Tshwane University of Technology",
    "University of Cape Town",
    "University of Fort Hare",
    "University of Johannesburg",
    "University of KwaZulu-Natal",
    "University of Limpopo",
    "University of Mpumalanga",
    "University of Pretoria",
    "University of South Africa",
    "University of the Free State",
    "University of the Western Cape",
    "University of Venda",
    "University of Zululand",
    "Vaal University of Technology",
    "Walter Sisulu University",
    "TVET College",
    "Private College"
  ].sort();

  // SA Provinces list
  const saProvinces = [
    "Eastern Cape",
    "Free State",
    "Gauteng",
    "KwaZulu-Natal",
    "Limpopo",
    "Mpumalanga",
    "Northern Cape",
    "North West",
    "Western Cape"
  ];

  // Field options for multiselect
  const fieldOptions = [
    // Business & Commerce
    "Accounting",
    "Finance",
    "Marketing",
    "Human Resources",
    "Supply Chain Management",
    "Economics",
    "Business Management",
    "Entrepreneurship",
    // Technology & Engineering
    "Information Technology",
    "Computer Science",
    "Software Engineering",
    "Civil Engineering",
    "Mechanical Engineering",
    "Electrical Engineering",
    "Industrial Engineering",
    "Mining Engineering",
    // Health Sciences
    "Medicine",
    "Nursing",
    "Pharmacy",
    "Physiotherapy",
    "Occupational Therapy",
    "Dentistry",
    // Social Sciences & Humanities
    "Education",
    "Psychology",
    "Social Work",
    "Law",
    "Political Science",
    "Sociology",
    "History",
    "English",
    "Languages",
    // Natural Sciences
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Environmental Science",
    "Geology",
    // Creative & Arts
    "Fine Arts",
    "Drama",
    "Music",
    "Graphic Design",
    "Architecture",
    "Other"
  ];

  const toggleFieldFilter = (field) => {
    setFilters(prev => {
      if (prev.field.includes(field)) {
        return {
          ...prev,
          field: prev.field.filter(f => f !== field)
        }
      } else {
        return {
          ...prev,
          field: [...prev.field, field]
        }
      }
    })
  }

  return (
    <>
      {/* Main content container */}
      <div
        style={{
          position: "relative",
          filter: selectedIntern || showFilters ? "blur(2px)" : "none",
          transition: "filter 0.2s ease",
        }}
      >
        {/* Notification area */}
        {notification && (
          <div
            style={{
              position: "fixed",
              top: "1rem",
              right: "1rem",
              padding: "1rem",
              borderRadius: "6px",
              color: "white",
              fontWeight: "500",
              zIndex: 1001,
              background:
                notification.type === "success" ? "#48BB78" : notification.type === "error" ? "#F56565" : "#5D4037",
            }}
          >
            {notification.message}
          </div>
        )}

        {/* Table header with filter button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
         
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              style={{
                background: "#EFEBE9",
                color: "#5D4037",
                border: "1px solid #D7CCC8",
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.875rem",
                transition: "all 0.2s",
              }}
              onClick={() => setShowFilters(true)}
            >
              Filters
              {Object.keys(filters).some(
                (key) =>
                  key !== "matchScore" &&
                  key !== "bigScore" &&
                  filters[key] !== "" &&
                  filters[key] !== 0 &&
                  (!Array.isArray(filters[key]) || filters[key].length > 0),
              ) && (
                <span
                  style={{
                    background: "#5D4037",
                    color: "white",
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                  }}
                >
                  {
                    Object.keys(filters).filter(
                      (key) =>
                        key !== "matchScore" &&
                        key !== "bigScore" &&
                        filters[key] !== "" &&
                        filters[key] !== 0 &&
                        (!Array.isArray(filters[key]) || filters[key].length > 0),
                    ).length
                  }
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Table content */}
        {filteredInterns.length === 0 ? (
          <EmptyStateTable />
        ) : (
          <div
            style={{
              borderRadius: "8px",
              border: "1px solid #E0E0E0",
              boxShadow: "0 4px 24px rgba(93, 64, 55, 0.08)",
              width: "100%",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                background: "white",
                fontSize: "0.8rem",
                backgroundColor: "#FFFFFF",
                tableLayout: "fixed",
              }}
            >
              <colgroup>
                <col style={{ width: "10%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "10%" }} />
                 <col style={{ width: "10%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "8%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Intern Name</th>
                  <th style={tableHeaderStyle}>Institution</th>
                  <th style={tableHeaderStyle}>Degree</th>
                  <th style={tableHeaderStyle}>Field</th>
                  <th style={tableHeaderStyle}>Location</th>
                  <th style={tableHeaderStyle}>SME Name</th>
                  <th style={tableHeaderStyle}>Intern Role</th>
                    <th style={tableHeaderStyle}>Sponsorship Start</th>
                  <th style={tableHeaderStyle}>Internship Start</th>
                  <th style={tableHeaderStyle}>Match %</th>
                  <th style={tableHeaderStyle}>BIG Score</th>
                  <th style={tableHeaderStyle}>Internship Status</th>
                  <th style={tableHeaderStyle}>Sponsorship period</th>
                  <th style={{ ...tableHeaderStyle, borderRight: "none" }}>Rating</th>
                </tr>
              </thead>
              <tbody>
                {filteredInterns.map((intern) => {
                  const currentStatus = statuses[intern.id] || intern.status
                  const statusStyle = getStatusStyle(currentStatus)
                  return (
                    <tr key={intern.id} style={{ borderBottom: "1px solid #E0E0E0" }}>
                      {/* Intern Name */}
                      <td style={tableCellStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <div
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "50%",
                              background: "#EFEBE9",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.7rem",
                              fontWeight: "bold",
                              color: "#5D4037",
                              flexShrink: 0,
                            }}
                          >
                            {intern.internName ? intern.internName.charAt(0) : "?"}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <span
                              onClick={() => handleViewDetails(intern)}
                              style={{
                                color: "#5D4037",
                                textDecoration: "underline",
                                cursor: "pointer",
                                fontWeight: "500",
                                wordBreak: "break-word",
                                fontSize: "0.8rem",
                              }}
                            >
                              {intern.internName}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Institution */}
                      <td style={tableCellStyle}>
                        <TruncatedText text={intern.institution} maxLength={8} />
                      </td>

                      {/* Degree */}
                      <td style={tableCellStyle}>
                        <span style={{ wordBreak: "break-word", fontSize: "0.8rem" }}>{intern.degree}</span>
                      </td>

                      {/* Field */}
                      <td style={tableCellStyle}>
                        <TruncatedText text={intern.field} maxLength={10} />
                      </td>

                      {/* Location */}
                      <td style={tableCellStyle}>
                        <TruncatedText text={intern.location} maxLength={10} />
                      </td>

                      {/* Type */}
                      <td style={tableCellStyle}>
                        <span style={{ fontSize: "0.75rem" }}>{intern.SMEName || "-"}</span>
                      </td>

                      {/* Intern Role */}
                      <td style={tableCellStyle}>
                        <TruncatedText text={intern.internRole} maxLength={12} />
                        <div style={{ marginTop: "4px" }}>
                          <button
                            style={{
                              background: "#4CAF50",
                              color: "white",
                              border: "none",
                              padding: "2px 6px",
                              borderRadius: "3px",
                              fontSize: "0.6rem",
                              cursor: "pointer",
                            }}
                            onClick={() => handleViewBrief(intern)}
                          >
                            Brief
                          </button>
                        </div>
                      </td>

                      {/* Start */}
                      <td style={tableCellStyle}>
                        <span style={{ fontSize: "0.75rem" }}>{intern.sponsorStart || "-"}</span>
                      </td>
                      <td style={tableCellStyle}>
                        <span style={{ fontSize: "0.75rem" }}>{intern.start || "-"}</span>
                      </td>

                      {/* Match % */}
                     
<td style={tableCellStyle}>
  <div style={matchContainerStyle}>
    <div style={progressBarStyle}>
      <div style={{ ...progressFillStyle, width: `${intern.matchPercentage}%` }} />
    </div>
    <span style={matchScoreStyle}>{intern.matchPercentage}%</span>
   
    <Eye     onClick={(e) => {
        e.stopPropagation();
        handleMatchScoreBreakdown(intern);
      }} size={12} color="#5D2A0A" />
  </div>
</td>

                      {/* BIG Score */}
                    
<td style={tableCellStyle}>
  <div style={matchContainerStyle}>
    <div style={progressBarStyle}>
      <div
        style={{
          ...progressFillStyle,
          width: `${intern.bigScore}%`,
          background: `linear-gradient(90deg, ${getScoreColor(intern.bigScore)}, ${getScoreColor(intern.bigScore)}aa)`,
        }}
      />
    </div>
    <button
      onClick={() => handleBigScoreClick(intern)}
      style={{
        background: "none",
        border: "none",
        color: getScoreColor(intern.bigScore),
        textDecoration: "underline",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "1px",
        fontWeight: "600",
        fontSize: "0.7rem",
        padding: 0,
        marginTop: "2px",
      }}
    >
      {intern.bigScore}%
          <Eye size={12} color="#5D2A0A" />
    </button>
  </div>
</td>

                      {/* Status */}
                      <td style={tableCellStyle}>
                        <span
                          style={{
                            ...statusBadgeStyle,
                            background: statusStyle.color,
                            color: statusStyle.textColor,
                            fontSize: "0.65rem",
                          }}
                        >
                          {currentStatus}
                        </span>
                      </td>

                      {/* Action */}
                     <td style={tableCellStyle}>
                        <span style={{ 
                          fontSize: "0.75rem", 
                          fontWeight: "600",
                          color: (() => {
                            if (!intern.monthsLeft || !intern.sponsorDuration) return "#666"; // Gray for missing data
                            
                            const totalDuration = parseInt(intern.sponsorDuration);
                            const monthsLeft = parseInt(intern.monthsLeft);
                            
                            if (isNaN(totalDuration) || isNaN(monthsLeft)) return "#666"; // Gray for invalid data
                            
                            const percentageLeft = (monthsLeft / totalDuration) * 100;
                            
                            if (percentageLeft > 70) return "#22c55e"; // Green - more than 70% left
                            if (percentageLeft > 30) return "#f59e0b"; // Orange - between 30-70% left
                            return "#ef4444"; // Red - less than 30% left
                          })()
                        }}> 
                          {intern.monthsLeft} Months Left
                        </span>
                      </td>
                      {/* Rating */}
                      <td style={{ ...tableCellStyle, borderRight: "none" }}>
                        <span style={{ color: "#999", fontSize: "0.65rem" }}>
                          <TruncatedText text={intern.rating} maxLength={10} />
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Match Breakdown Modal */}
{mounted &&
  showMatchModal &&
  selectedMatchIntern &&
  createPortal(
    <MatchBreakdownModal intern={selectedMatchIntern} onClose={closeMatchModal} />,
    document.body
  )}

{/* BIG Score Breakdown Modal */}
{mounted &&
  showBigScoreModal &&
  selectedBigScoreIntern &&
  createPortal(
    <BigScoreBreakdownModal intern={selectedBigScoreIntern} bigScoreData={bigScoreData} onClose={closeBigScoreModal} />,
    document.body
  )}
      {/* All your existing modals remain the same */}
      {/* Brief Description Modal */}
      {mounted &&
        showBriefModal &&
        selectedIntern &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                maxWidth: "800px",
                width: "90%",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              }}
            >
              <div style={modalHeaderStyle}>
                <h3 style={modalTitleStyle}>
                  {selectedIntern.briefDescription.title}
                </h3>
                <button onClick={closeAllModals} style={modalCloseButtonStyle}>
                  ✖
                </button>
              </div>
              <div style={modalBodyStyle}>
                {/* Company Info */}
                <div
                  style={{
                    marginBottom: "1.5rem",
                    padding: "1rem",
                    background: "#F8F9FA",
                    borderRadius: "8px",
                  }}
                >
                  <h4 style={{ margin: "0 0 0.5rem 0", color: "#5D4037", fontSize: "1.1rem" }}>
                    {selectedIntern.briefDescription.company}
                  </h4>
                  <p style={{ margin: "0", color: "#666", fontSize: "0.9rem" }}>
                    <strong>Duration:</strong> {selectedIntern.briefDescription.duration}
                  </p>
                </div>

                {/* Requirements */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <h4 style={{ color: "#5D4037", marginBottom: "0.75rem", fontSize: "1rem" }}>Requirements</h4>
                  <ul style={{ margin: "0", paddingLeft: "1.5rem", color: "#333" }}>
                    {selectedIntern.briefDescription.requirements}
                  </ul>
                </div>

                {/* Responsibilities */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <h4 style={{ color: "#5D4037", marginBottom: "0.75rem", fontSize: "1rem" }}>
                    Key Responsibilities
                  </h4>
                  <ul style={{ margin: "0", paddingLeft: "1.5rem", color: "#333" }}>
                    {selectedIntern.briefDescription.responsibilities}
                  </ul>
                </div>

                {/* Benefits */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <h4 style={{ color: "#5D4037", marginBottom: "0.75rem", fontSize: "1rem" }}>What You'll Gain</h4>
                  <ul style={{ margin: "0", paddingLeft: "1.5rem", color: "#333" }}>
                    {selectedIntern.briefDescription.benefits}
                  </ul>
                </div>

                {/* Application Process */}
                <div
                  style={{
                    padding: "1rem",
                    background: "#EFEBE9",
                    borderRadius: "8px",
                    border: "1px solid #D7CCC8",
                  }}
                >
                  <h4 style={{ color: "#5D4037", marginBottom: "0.75rem", fontSize: "1rem" }}>
                    Application Process
                  </h4>
                  <p style={{ margin: "0", color: "#333", lineHeight: "1.5" }}>
                    {selectedIntern.briefDescription.applicationProcess}
                  </p>
                </div>
              </div>
              <div style={modalActionsStyle}>
                <button
                  style={primaryButtonStyle}
                  onClick={() => {
                    closeAllModals()
                    handleConnectClick(selectedIntern)
                  }}
                >
                  Connect with Intern
                </button>
                <button
                  style={{
                    background: "#EFEBE9",
                    color: "#5D4037",
                    border: "1px solid #D7CCC8",
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.875rem",
                  }}
                  onClick={() => {
                    closeAllModals()
                    handleMessage(selectedIntern)
                  }}
                >
                  Send Message
                </button>
                <button style={cancelButtonStyle} onClick={closeAllModals}>
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Filter Modal */}
      {mounted &&
        showFilters &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              ref={filterPanelRef}
              style={{
                background: "white",
                borderRadius: "12px",
                maxWidth: "1000px",
                width: "95%",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              }}
            >
              <div style={modalHeaderStyle}>
                <h3 style={modalTitleStyle}>Filter Interns</h3>
                <button onClick={() => setShowFilters(false)} style={modalCloseButtonStyle}>
                  ✖
                </button>
              </div>
              <div style={modalBodyStyle}>
                <div
                  style={{
                    textAlign: "center",
                    marginBottom: "2rem",
                    paddingBottom: "1rem",
                    borderBottom: "2px solid #E0E0E0",
                  }}
                >
                  <h1
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      color: "#5D4037",
                      margin: "0 0 0.5rem 0",
                    }}
                  >
                    Filter Intern Candidates
                  </h1>
                  <p
                    style={{
                      fontSize: "1rem",
                      color: "#5F6368",
                      margin: "0",
                    }}
                  >
                    Find the perfect intern candidates for your programs
                  </p>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "1.5rem",
                    marginBottom: "2rem",
                  }}
                >
                  <div
                    style={{
                      background: "#F8F9FA",
                      border: "1px solid #E0E0E0",
                      borderRadius: "8px",
                      padding: "1.25rem",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "1rem",
                        fontWeight: "600",
                        color: "#5D4037",
                        margin: "0 0 0.75rem 0",
                      }}
                    >
                      Location
                    </h3>
                    <select
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #E0E0E0",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                        background: "white",
                        color: "#202124",
                      }}
                      value={filters.location}
                      onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    >
                      <option value="">All Locations</option>
                      {saProvinces.map((province) => (
                        <option key={province} value={province}>
                          {province}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div
                    style={{
                      background: "#F8F9FA",
                      border: "1px solid #E0E0E0",
                      borderRadius: "8px",
                      padding: "1.25rem",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "1rem",
                        fontWeight: "600",
                        color: "#5D4037",
                        margin: "0 0 0.75rem 0",
                      }}
                    >
                      Institution
                    </h3>
                    <select
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #E0E0E0",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                        background: "white",
                        color: "#202124",
                      }}
                      value={filters.institution}
                      onChange={(e) => setFilters({ ...filters, institution: e.target.value })}
                    >
                      <option value="">All Institutions</option>
                      {saUniversities.map((university) => (
                        <option key={university} value={university}>
                          {university}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div
                    style={{
                      background: "#F8F9FA",
                      border: "1px solid #E0E0E0",
                      borderRadius: "8px",
                      padding: "1.25rem",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "1rem",
                        fontWeight: "600",
                        color: "#5D4037",
                        margin: "0 0 0.75rem 0",
                      }}
                    >
                      Match Score
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={filters.matchScore}
                        onChange={(e) => setFilters({ ...filters, matchScore: parseInt(e.target.value) })}
                        style={{ flex: 1 }}
                      />
                      <span style={{ minWidth: "40px", textAlign: "center" }}>{filters.matchScore}%</span>
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#F8F9FA",
                      border: "1px solid #E0E0E0",
                      borderRadius: "8px",
                      padding: "1.25rem",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "1rem",
                        fontWeight: "600",
                        color: "#5D4037",
                        margin: "0 0 0.75rem 0",
                      }}
                    >
                      BIG Score
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={filters.bigScore}
                        onChange={(e) => setFilters({ ...filters, bigScore: parseInt(e.target.value) })}
                        style={{ flex: 1 }}
                      />
                      <span style={{ minWidth: "40px", textAlign: "center" }}>{filters.bigScore}%</span>
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#F8F9FA",
                      border: "1px solid #E0E0E0",
                      borderRadius: "8px",
                      padding: "1.25rem",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "1rem",
                        fontWeight: "600",
                        color: "#5D4037",
                        margin: "0 0 0.75rem 0",
                      }}
                    >
                      Field of Study
                    </h3>
                    <div style={{ 
                      display: "grid", 
                      gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                      gap: "0.5rem",
                      maxHeight: "200px",
                      overflowY: "auto",
                      padding: "0.5rem"
                    }}>
                      {fieldOptions.map((field) => (
                        <div key={field} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <input
                            type="checkbox"
                            id={`field-${field}`}
                            checked={filters.field.includes(field)}
                            onChange={() => toggleFieldFilter(field)}
                          />
                          <label htmlFor={`field-${field}`} style={{ fontSize: "0.8rem" }}>
                            {field}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem",
                    paddingTop: "1.5rem",
                    borderTop: "1px solid #E0E0E0",
                  }}
                >
                  <button
                    style={{
                      flex: "1",
                      padding: "0.75rem 1.5rem",
                      background: "#EFEBE9",
                      color: "#5D4037",
                      border: "1px solid #D7CCC8",
                      borderRadius: "6px",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onClick={() => {
                      setFilters({
                        location: "",
                        matchScore: 0,
                        bigScore: 0,
                        institution: "",
                        degree: "",
                        field: [],
                        type: "",
                        sortBy: "",
                      })
                    }}
                  >
                    Clear All Filters
                  </button>
                  <button
                    style={{
                      flex: "1",
                      padding: "0.75rem 1.5rem",
                      background: "#5D4037",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onClick={() => setShowFilters(false)}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Detail Modal */}
      {mounted &&
        showModal &&
        selectedIntern &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                maxWidth: "700px",
                width: "90%",
                maxHeight: "80vh",
                overflowY: "auto",
                boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              }}
            >
              <div style={modalHeaderStyle}>
                <h3 style={modalTitleStyle}>
                  Intern Details
                </h3>
                <button onClick={closeAllModals} style={modalCloseButtonStyle}>
                  ✖
                </button>
              </div>
              <div style={modalBodyStyle}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "1.5rem",
                  }}
                >
                  <div style={detailCardStyle}>
                    <h4 style={detailCardTitleStyle}>
                      Personal Information
                    </h4>
                    <p style={detailTextStyle}>
                      <strong>Name:</strong> {selectedIntern.internName}
                    </p>
                    <p style={detailTextStyle}>
                      <strong>Institution:</strong> {selectedIntern.institution}
                    </p>
                    <p style={detailTextStyle}>
                      <strong>Degree:</strong> {selectedIntern.degree}
                    </p>
                    <p style={detailTextStyle}>
                      <strong>Field:</strong> {selectedIntern.field}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <h4>Documents</h4>

                    <div>
                     {renderDocumentLink(selectedIntern.cv, "CV Document")}
                  </div>
                     <div>
                     {renderDocumentLink(selectedIntern.transcript, "transcript Document")}
                  </div>
                  <div>
                     {renderDocumentLink(selectedIntern.idDocument, "ID Document Document")}
                  </div><div>
                     {renderDocumentLink(selectedIntern.portfolioFile, "portfolioFile Document")}
                  </div>
                    <div>
                     {renderDocumentLink(selectedIntern.proofOfStudy, "proofOfStudy Document")}
                  </div>
                  <div>
                     {renderDocumentLink(selectedIntern.references, "references Document")}
                  </div>
                 
                 <div>
                     {renderDocumentLink(selectedIntern.motivationLetter, "motivationLetter Document")}
                  </div>
                  
                  </div>
                  </div>
                  <div style={detailCardStyle}>
                    <h4 style={detailCardTitleStyle}>
                      Internship Details
                    </h4>
                    <p style={detailTextStyle}>
                      <strong>Role:</strong> {selectedIntern.internRole}
                    </p>
                    <p style={detailTextStyle}>
                      <strong>Location:</strong> {selectedIntern.location}
                    </p>
                    <p style={detailTextStyle}>
                      <strong>Type:</strong> {selectedIntern.type}
                    </p>
                    <p style={detailTextStyle}>
                      <strong>Match Score:</strong> {selectedIntern.matchPercentage}%
                    </p>
                    <p style={detailTextStyle}>
                      <strong>BIG Score:</strong> {selectedIntern.bigScore}%
                    </p>
                  </div>
                  
                </div>
              </div>
              <div style={modalActionsStyle}>
                <button
                  style={primaryButtonStyle}
                  onClick={() => {
                    closeAllModals()
                    handleMessage(selectedIntern)
                  }}
                >
                  Send Message
                </button>
                <button style={cancelButtonStyle} onClick={closeAllModals}>
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}

// Style constants with brown color scheme
const tableHeaderStyle = {
  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
  color: "#FEFCFA",
  padding: "0.75rem 0.5rem",
  textAlign: "left",
  fontWeight: "600",
  fontSize: "0.65rem",
  letterSpacing: "0.5px",
  textTransform: "uppercase",
  position: "sticky",
  top: "0",
  zIndex: "10",
  borderBottom: "2px solid #1a0c02",
  borderRight: "1px solid #1a0c02",
  lineHeight: "1.2",
}

const tableCellStyle = {
  padding: "0.6rem 0.4rem",
  borderBottom: "1px solid #E8D5C4",
  borderRight: "1px solid #E8D5C4",
  fontSize: "0.75rem",
  verticalAlign: "top",
  color: "#5d2a0a",
  lineHeight: "1.3",
  wordWrap: "break-word",
  overflow: "hidden",
}

const matchContainerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "0.25rem",
}

const progressBarStyle = {
  width: "40px",
  height: "5px",
  background: "#E0E0E0",
  borderRadius: "3px",
  overflow: "hidden",
}

const progressFillStyle = {
  height: "100%",
  background: "linear-gradient(90deg, #5D4037, #8D6E63)",
  transition: "width 0.3s ease",
}

const matchScoreStyle = {
  fontWeight: "600",
  color: "#202124",
  fontSize: "0.7rem",
}

const statusBadgeStyle = {
  padding: "0.2rem 0.3rem",
  borderRadius: "3px",
  fontSize: "0.65rem",
  fontWeight: "500",
  display: "inline-block",
  whiteSpace: "nowrap",
}

const actionButtonsStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
  width: "100%",
}

const connectButtonStyle = {
  padding: "0.3rem 0.5rem",
  background: "#5D4037",
  color: "white",
  border: "none",
  borderRadius: "3px",
  fontSize: "0.65rem",
  cursor: "pointer",
  transition: "background 0.2s",
  whiteSpace: "nowrap",
}

const confirmedBadgeStyle = {
  background: "#8D6E63",
  color: "white",
  padding: "0.3rem 0.5rem",
  borderRadius: "3px",
  fontSize: "0.65rem",
  fontWeight: "500",
  display: "flex",
  alignItems: "center",
  gap: "0.25rem",
  whiteSpace: "nowrap",
}

const contactedBadgeStyle = {
  background: "#F3E5F5",
  color: "#7B1FA2",
  padding: "0.3rem 0.5rem",
  borderRadius: "3px",
  fontSize: "0.65rem",
  fontWeight: "500",
  whiteSpace: "nowrap",
}

const modalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "1.5rem",
  borderBottom: "1px solid #E0E0E0",
  background: "#EFEBE9",
}

const modalTitleStyle = {
  margin: "0",
  fontSize: "1.25rem",
  fontWeight: "600",
  color: "#5D4037",
}

const modalCloseButtonStyle = {
  background: "none",
  border: "none",
  fontSize: "1.5rem",
  cursor: "pointer",
  color: "#5D4037",
}

const modalBodyStyle = {
  padding: "1.5rem",
}

const detailCardStyle = {
  padding: "1rem",
  background: "#F8F9FA",
  border: "1px solid #E0E0E0",
  borderRadius: "8px",
}

const detailCardTitleStyle = {
  fontSize: "1rem",
  fontWeight: "600",
  margin: "0 0 0.5rem 0",
  color: "#5D4037",
}

const detailTextStyle = {
  margin: "0.25rem 0",
  fontSize: "0.875rem",
  color: "#202124",
}

const modalActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "0.5rem",
  padding: "1.5rem",
  borderTop: "1px solid #E0E0E0",
}

const primaryButtonStyle = {
  background: "#5D4037",
  color: "white",
  border: "none",
  padding: "0.5rem 1rem",
  borderRadius: "6px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  fontSize: "0.875rem",
  transition: "all 0.2s",
}

const cancelButtonStyle = {
  background: "#F1F3F4",
  color: "#5F6368",
  border: "none",
  padding: "0.5rem 1rem",
  borderRadius: "6px",
  cursor: "pointer",
}