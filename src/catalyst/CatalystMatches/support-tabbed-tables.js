"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Eye, X, Trophy, Calendar, DollarSign, Users, Package, Award, Building } from "lucide-react"
import { SupportSMETable } from "./support-sme-table"

// Successful Support Deals Table Component
const SuccessfulSupportDealsTable = ({ successfulDeals }) => {
  const [selectedDeal, setSelectedDeal] = useState(null)

  const getStatusColor = (status) => {
    switch (status) {
      case "Active Support":
        return "#4caf50"
      case "Completed Successfully":
        return "#2196f3"
      case "Under Review":
        return "#ff9800"
      default:
        return "#666"
    }
  }

  const getRatingColor = (rating) => {
    const score = Number.parseFloat(rating.split("/")[0])
    if (score >= 4.5) return "#4caf50"
    if (score >= 4.0) return "#8bc34a"
    if (score >= 3.5) return "#ff9800"
    return "#f44336"
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handleViewDetails = (deal) => {
    setSelectedDeal(deal)
  }

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
  }

  const modalContentStyle = {
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    padding: "40px",
    maxWidth: "900px",
    width: "95%",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 20px 60px rgba(62, 39, 35, 0.5), 0 0 0 1px rgba(141, 110, 99, 0.1)",
    animation: "slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
  }

  // Text truncation component for Guarantees with 2-line limit
  const TruncatedGuarantees = ({ text, maxLines = 2 }) => {
    const [isExpanded, setIsExpanded] = useState(false)
    const textRef = useRef(null)
    const [needsTruncation, setNeedsTruncation] = useState(false)

    useEffect(() => {
      if (textRef.current) {
        // Check if text exceeds the specified number of lines
        const lineHeight = Number.parseInt(getComputedStyle(textRef.current).lineHeight)
        const maxHeight = lineHeight * maxLines
        setNeedsTruncation(textRef.current.scrollHeight > maxHeight)
      }
    }, [text, maxLines])

    if (!text || text === "-" || text === "Not specified" || text === "Various") {
      return <span style={{ color: "#999" }}>{text || "-"}</span>
    }

    const toggleExpanded = (e) => {
      e.stopPropagation()
      setIsExpanded(!isExpanded)
    }

    return (
      <div style={{ lineHeight: "1.4", position: "relative" }}>
        <div
          ref={textRef}
          style={{
            wordBreak: "break-word",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: isExpanded ? "unset" : maxLines,
            WebkitBoxOrient: "vertical",
            lineHeight: "1.4em",
            maxHeight: isExpanded ? "none" : `${maxLines * 1.4}em`,
          }}
        >
          {text}
        </div>
        {needsTruncation && (
          <button
            style={{
              background: "none",
              border: "none",
              color: "#a67c52",
              cursor: "pointer",
              fontSize: "0.75rem",
              padding: "2px 0 0 0",
              textDecoration: "underline",
              display: "block",
              width: "100%",
              textAlign: "left",
            }}
            onClick={toggleExpanded}
          >
            {isExpanded ? "See less" : "See more"}
          </button>
        )}
      </div>
    )
  }

  // Regular text truncation component for other fields
  const TruncatedText = ({ text, maxLength = 40 }) => {
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
              color: "#a67c52",
              cursor: "pointer",
              fontSize: "0.75rem",
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

  return (
    <>
      <div
        style={{
          overflowX: "auto",
          borderRadius: "8px",
          border: "1px solid #E8D5C4",
          boxShadow: "0 4px 24px rgba(139, 69, 19, 0.08)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "white",
            fontSize: "0.875rem",
            backgroundColor: "#FEFCFA",
            tableLayout: "fixed",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "12%",
                }}
              >
                SMSE Name
              </th>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "10%",
                }}
              >
                Funding Required
              </th>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "9%",
                }}
              >
                Equity Offered
              </th>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "10%",
                }}
              >
                Start Date
              </th>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "9%",
                }}
              >
                Sector
              </th>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "10%",
                }}
              >
                Location
              </th>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "8%",
                }}
              >
                Guarantees
              </th>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "center",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "7%",
                }}
              >
                Services Required
              </th>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "1px solid #1a0c02",
                  width: "11%",
                }}
              >
                Status
              </th>
              <th
                style={{
                  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
                  color: "#FEFCFA",
                  padding: "0.75rem 0.5rem",
                  textAlign: "center",
                  fontWeight: "600",
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  borderRight: "none",
                  width: "14%",
                }}
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {successfulDeals.length === 0 ? (
              <tr>
                <td
                  colSpan="10"
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#666",
                    fontStyle: "italic",
                  }}
                >
                  No successful deals yet. When your matches reach "Support Approved" or "Active Support" status, they
                  will appear here.
                </td>
              </tr>
            ) : (
              successfulDeals.map((deal) => (
                <tr
                  key={deal.id}
                  style={{
                    borderBottom: "1px solid #E8D5C4",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f5f5f5"
                    e.currentTarget.style.transform = "translateY(-1px)"
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "white"
                    e.currentTarget.style.transform = "translateY(0)"
                    e.currentTarget.style.boxShadow = "none"
                  }}
                >
                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      wordWrap: "break-word",
                      whiteSpace: "normal",
                      verticalAlign: "top",
                    }}
                  >
                    <span
                      style={{
                        color: "#a67c52",
                        fontWeight: "500",
                        lineHeight: "1.3",
                      }}
                    >
                      <TruncatedText text={deal.smseName} maxLength={30} />
                    </span>
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top",
                      fontWeight: "400",
                      color: "#333",
                      fontSize: "0.875rem",
                    }}
                  >
                    <TruncatedText text={deal.fundingRequired} maxLength={20} />
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top",
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: "#fff3e0",
                        color: "#e65100",
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      {deal.equityOffered}
                    </span>
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top",
                      fontSize: "14px",
                    }}
                  >
                    {formatDate(deal.startDate)}
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top",
                    }}
                  >
                    <TruncatedText text={deal.sector} maxLength={20} />
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top",
                    }}
                  >
                    <TruncatedText text={deal.location} maxLength={15} />
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top",
                      fontSize: "14px",
                    }}
                  >
                    <TruncatedGuarantees text={deal.guarantees} maxLines={2} />
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top",
                      textAlign: "center",
                      color: "#333",
                      fontSize: "0.875rem",
                      fontWeight: "400",
                    }}
                  >
                    <TruncatedText text={deal.servicesRequired} maxLength={20} />
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top",
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: getStatusColor(deal.currentStatus) + "20",
                        color: getStatusColor(deal.currentStatus),
                        padding: "6px 10px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "600",
                        display: "inline-block",
                      }}
                    >
                      {deal.currentStatus}
                    </span>
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      verticalAlign: "top",
                      textAlign: "center",
                    }}
                  >
                    <button
                      onClick={() => handleViewDetails(deal)}
                      style={{
                        backgroundColor: "#5d4037",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        padding: "8px 16px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        margin: "0 auto",
                      }}
                    >
                      <Eye size={14} />
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Deal Details Modal */}
      {selectedDeal && (
        <div style={modalOverlayStyle} onClick={() => setSelectedDeal(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "32px",
                paddingBottom: "24px",
                borderBottom: "3px solid #8d6e63",
              }}
            >
              <h2
                style={{
                  fontSize: "28px",
                  fontWeight: "700",
                  color: "#3e2723",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <Building size={32} style={{ color: "#4caf50" }} />
                Support Program Details: {selectedDeal.smseName}
              </h2>
              <button
                onClick={() => setSelectedDeal(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#666",
                  padding: "8px",
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Deal Overview Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "24px",
                marginBottom: "32px",
              }}
            >
              <div
                style={{
                  backgroundColor: "#f8f9fa",
                  padding: "24px",
                  borderRadius: "12px",
                  border: "1px solid #e9ecef",
                }}
              >
                <h3
                  style={{
                    color: "#3e2723",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <DollarSign size={20} />
                  Program Financial Details
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div>
                    <strong>Funding Required:</strong> {selectedDeal.fundingRequired}
                  </div>
                  <div>
                    <strong>Equity Offered:</strong> {selectedDeal.equityOffered}
                  </div>
                  <div>
                    <strong>Guarantees:</strong> {selectedDeal.guarantees}
                  </div>
                  <div>
                    <strong>Services Required:</strong> {selectedDeal.servicesRequired}
                  </div>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#f8f9fa",
                  padding: "24px",
                  borderRadius: "12px",
                  border: "1px solid #e9ecef",
                }}
              >
                <h3
                  style={{
                    color: "#3e2723",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Calendar size={20} />
                  Program Timeline
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div>
                    <strong>Start Date:</strong> {formatDate(selectedDeal.startDate)}
                  </div>
                  <div>
                    <strong>Current Status:</strong>
                    <span
                      style={{
                        backgroundColor: getStatusColor(selectedDeal.currentStatus) + "20",
                        color: getStatusColor(selectedDeal.currentStatus),
                        padding: "4px 8px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: "600",
                        marginLeft: "8px",
                      }}
                    >
                      {selectedDeal.currentStatus}
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#f8f9fa",
                  padding: "24px",
                  borderRadius: "12px",
                  border: "1px solid #e9ecef",
                }}
              >
                <h3
                  style={{
                    color: "#3e2723",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Award size={20} />
                  SMSE Information
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div>
                    <strong>Sector:</strong> {selectedDeal.sector}
                  </div>
                  <div>
                    <strong>Location:</strong> {selectedDeal.location}
                  </div>
                </div>
              </div>
            </div>

            {/* Support Required Section */}
            <div
              style={{
                backgroundColor: "#f8f9fa",
                padding: "24px",
                borderRadius: "12px",
                border: "1px solid #e9ecef",
                marginBottom: "24px",
              }}
            >
              <h3
                style={{
                  color: "#3e2723",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Package size={20} />
                Support Services Required
              </h3>
              <p style={{ fontSize: "16px", color: "#333", lineHeight: "1.6", margin: 0 }}>
                {selectedDeal.servicesRequired}
              </p>
            </div>

            {/* Close Button */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setSelectedDeal(null)}
                style={{
                  backgroundColor: "#5d4037",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  padding: "16px 32px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  )
}

// Main Tabbed Component for Support Programs
const SupportTabbedTables = ({ filters, stageFilter, loading }) => {
  const [activeTab, setActiveTab] = useState("my-matches")
  const [successfulDeals, setSuccessfulDeals] = useState([])
  const [smeMatches, setSmeMatches] = useState([])

  // Function to extract successful deals from SME matches
  const extractSuccessfulDeals = (smes) => {
    return smes
      .filter(
        (sme) =>
          sme.currentStatus === "Support Approved" ||
          sme.currentStatus === "Active Support" ||
          sme.pipelineStage === "Support Approved" ||
          sme.pipelineStage === "Active Support",
      )
      .map((sme) => ({
        id: sme.id,
        smseName: sme.name,
        fundingRequired: sme.fundingRequired,
        equityOffered: sme.equityOffered,
        startDate: sme.applicationDate,
        sector: sme.sector,
        location: sme.location,
        guarantees: sme.guarantees,
        servicesRequired: sme.servicesRequired,
        currentStatus: sme.currentStatus || sme.pipelineStage,
      }))
  }

  // Update successful deals when SME matches change
  useEffect(() => {
    if (smeMatches.length > 0) {
      const deals = extractSuccessfulDeals(smeMatches)
      setSuccessfulDeals(deals)
    }
  }, [smeMatches])

  // Function to handle SME data changes and trigger notifications
  const handleSMEsLoaded = useCallback((smes) => {
    setSmeMatches(smes);
    
    // Trigger notification check if the notification system is available
    if (window.catalystNotifications && window.catalystNotifications.checkForChanges) {
      window.catalystNotifications.checkForChanges(smes);
    }
  }, []);

  const tabStyle = (isActive) => ({
    flex: 1,
    padding: "16px 24px",
    border: "none",
    backgroundColor: isActive ? "#5d4037" : "transparent",
    color: isActive ? "white" : "#5d4037",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    borderRadius: "12px 12px 0 0",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  })

  return (
    <div style={{ maxWidth: "100%", margin: "0 auto", padding: "0" }}>
      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          marginBottom: "0",
          backgroundColor: "#f5f5f5",
          borderRadius: "12px 12px 0 0",
          padding: "4px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <button
          onClick={() => setActiveTab("my-matches")}
          style={tabStyle(activeTab === "my-matches")}
          onMouseEnter={(e) => {
            if (activeTab !== "my-matches") {
              e.target.style.backgroundColor = "#8d6e63"
              e.target.style.color = "white"
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "my-matches") {
              e.target.style.backgroundColor = "transparent"
              e.target.style.color = "#5d4037"
            }
          }}
        >
          <Users size={18} />
          My Matches
          <span
            style={{
              backgroundColor: activeTab === "my-matches" ? "rgba(255, 255, 255, 0.2)" : "rgba(93, 64, 55, 0.1)",
              color: activeTab === "my-matches" ? "white" : "#5d4037",
              borderRadius: "50%",
              width: "24px",
              height: "24px",
              fontSize: "12px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: "4px",
            }}
          >
            {smeMatches.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("successful-deals")}
          style={tabStyle(activeTab === "successful-deals")}
          onMouseEnter={(e) => {
            if (activeTab !== "successful-deals") {
              e.target.style.backgroundColor = "#8d6e63"
              e.target.style.color = "white"
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "successful-deals") {
              e.target.style.backgroundColor = "transparent"
              e.target.style.color = "#5d4037"
            }
          }}
        >
          <Trophy size={18} />
          Successful Deals
          <span
            style={{
              backgroundColor: activeTab === "successful-deals" ? "rgba(255, 255, 255, 0.2)" : "rgba(93, 64, 55, 0.1)",
              color: activeTab === "successful-deals" ? "white" : "#5d4037",
              borderRadius: "50%",
              width: "24px",
              height: "24px",
              fontSize: "12px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: "4px",
            }}
          >
            {successfulDeals.length}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "0 0 16px 16px",
          padding: "24px",
          minHeight: "600px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          border: "1px solid #e8e8e8",
          borderTop: "none",
        }}
      >
        {activeTab === "my-matches" && (
          <div>
            <SupportSMETable 
              filters={filters} 
              stageFilter={stageFilter} 
              onSMEsLoaded={handleSMEsLoaded} 
            />
          </div>
        )}

        {activeTab === "successful-deals" && <SuccessfulSupportDealsTable successfulDeals={successfulDeals} />}
      </div>

      {/* Enhanced styling for tab transitions */}
      <style jsx>{`
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translateY(10px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        /* Tab content animation */
        div[style*="backgroundColor: white"] > div {
          animation: fadeIn 0.3s ease-out;
        }
        
        /* Button hover effects */
        button:hover {
          transform: translateY(-1px);
        }
        
        /* Table row hover effects */
        tr:hover {
          transition: all 0.2s ease !important;
        }
        
        /* Input and button focus styles */
        button:focus {
          outline: 2px solid #5d4037;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  )
}

export default SupportTabbedTables