"use client"

import { useState, useEffect } from "react"
import { Eye, X, Trophy, Calendar, DollarSign, Users, Package, Award, Briefcase } from "lucide-react"
import { AdvisorTable } from "./advisor-sme-table"
import { collection, getDocs, query, where } from "firebase/firestore"
import { auth, db } from "../../firebaseConfig"

// Text truncation component
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

// Successful Advisor Deals Table Component
const SuccessfulAdvisorDealsTable = ({ onDealsCountChange }) => {
  const [deals, setDeals] = useState([])
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSuccessfulDeals = async () => {
      try {
        const user = auth.currentUser
        if (!user) return

        const advisorId = user.uid

        // Query for successful deals in AdvisorApplications
        const q = query(
          collection(db, "AdvisorApplications"),
          where("advisorId", "==", advisorId),
          where("status", "==", "Deal Successful"),
        )

        const snapshot = await getDocs(q)
        const successfulDeals = []

        snapshot.forEach((doc) => {
          const data = doc.data()
          successfulDeals.push({
            id: doc.id,
            smseName: data.smeName || "N/A",
            dealAmount: data.advisorCompensationModel || "N/A",
            dealType: data.smeSupport || "N/A",
            completionDate:
              data.createdAt?.toDate().toISOString().split("T")[0] || new Date().toISOString().split("T")[0],
            sector: data.smeSector || "N/A",
            dealStructure: data.dealStructure || "Advisory contract",
            dealDuration: data.dealDuration || "Ongoing",
            serviceDelivered: data.serviceDelivered || "Strategic advisory services",
            currentStatus: "Active Advisory",
            contractValue: data.contractValue || "N/A",
            nextRenewal: data.nextRenewal || "To be determined",
            location: data.smeLocation || "N/A",
            advisoryType: data.advisoryType || "Strategic Advisor",
            performanceRating: data.performanceRating || "4.5/5",
            smeStage: data.smeStage || "N/A",
            revenueBand: data.revenue || "N/A",
          })
        })

        setDeals(successfulDeals)
        setLoading(false)

        // Notify parent component of the count
        if (onDealsCountChange) {
          onDealsCountChange(successfulDeals.length)
        }
      } catch (error) {
        console.error("Error fetching successful deals:", error)
        setLoading(false)

        // Notify parent component even on error
        if (onDealsCountChange) {
          onDealsCountChange(0)
        }
      }
    }

    fetchSuccessfulDeals()
  }, [onDealsCountChange])

  const getStatusColor = (status) => {
    switch (status) {
      case "Active Advisory":
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

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Loading successful deals...</div>
  }

  return (
    <>
      {/* Always show the table structure */}
      <div
        style={{
          overflowX: "auto",
          borderRadius: "8px",
          border: "1px solid #E8D5C4",
          boxShadow: "0 4px 24px rgba(139, 69, 19, 0.08)",
          marginBottom: deals.length === 0 ? "24px" : "0",
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
                Revenue Band
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
                Support Required
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
                Duration
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
                  width: "12%",
                }}
              >
                Compensation Model
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
                  width: "10%",
                }}
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {deals.length > 0 ? (
              deals.map((deal) => (
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
                    {deal.revenueBand}
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
                        backgroundColor: "#e8f5e9",
                        color: "#2e7d32",
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      <TruncatedText text={deal.dealType} maxLength={20} />
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
                    {formatDate(deal.completionDate)}
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
                    {deal.dealDuration}
                  </td>

                  <td
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRight: "1px solid #E8D5C4",
                      verticalAlign: "top",
                      textAlign: "center",
                      fontSize: "0.875rem",
                      color: "#333",
                      fontWeight: "400",
                    }}
                  >
                    <TruncatedText text={deal.dealAmount} maxLength={15} />
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
                        whiteSpace: "nowrap",
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
                        padding: "8px",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto",
                        width: "32px",
                        height: "32px",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#3e2723"
                        e.target.style.transform = "scale(1.1)"
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "#5d4037"
                        e.target.style.transform = "scale(1)"
                      }}
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              // Empty state row to show table structure
              <tr style={{ borderBottom: "1px solid #E8D5C4" }}>
                <td style={{ padding: "2rem 0.5rem", borderRight: "1px solid #E8D5C4", color: "#ccc", textAlign: "center" }}>-</td>
                <td style={{ padding: "2rem 0.5rem", borderRight: "1px solid #E8D5C4", color: "#ccc", textAlign: "center" }}>-</td>
                <td style={{ padding: "2rem 0.5rem", borderRight: "1px solid #E8D5C4", color: "#ccc", textAlign: "center" }}>-</td>
                <td style={{ padding: "2rem 0.5rem", borderRight: "1px solid #E8D5C4", color: "#ccc", textAlign: "center" }}>-</td>
                <td style={{ padding: "2rem 0.5rem", borderRight: "1px solid #E8D5C4", color: "#ccc", textAlign: "center" }}>-</td>
                <td style={{ padding: "2rem 0.5rem", borderRight: "1px solid #E8D5C4", color: "#ccc", textAlign: "center" }}>-</td>
                <td style={{ padding: "2rem 0.5rem", borderRight: "1px solid #E8D5C4", color: "#ccc", textAlign: "center" }}>-</td>
                <td style={{ padding: "2rem 0.5rem", borderRight: "1px solid #E8D5C4", color: "#ccc", textAlign: "center" }}>-</td>
                <td style={{ padding: "2rem 0.5rem", borderRight: "1px solid #E8D5C4", color: "#ccc", textAlign: "center" }}>-</td>
                <td style={{ padding: "2rem 0.5rem", color: "#ccc", textAlign: "center" }}>-</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Message shown when no deals */}
      {deals.length === 0 && (
        <div
          style={{
            backgroundColor: "#f8f5f3",
            padding: "24px",
            borderRadius: "8px",
            textAlign: "center",
            border: "1px solid #e8d5c4",
          }}
        >
          <Trophy size={48} style={{ color: "#a67c52", marginBottom: "16px" }} />
          <h3 style={{ color: "#5d4037", marginBottom: "8px" }}>No Successful Deals Yet</h3>
          <p style={{ color: "#7d5a50" }}>
            Your successful advisory deals will appear here once you complete matches.
          </p>
        </div>
      )}

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
                <Briefcase size={32} style={{ color: "#4caf50" }} />
                Advisory Details: {selectedDeal.smseName}
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
                  Advisory Financial Details
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div>
                    <strong>Compensation Model:</strong> {selectedDeal.dealAmount}
                  </div>
                  <div>
                    <strong>Total Value:</strong> {selectedDeal.contractValue}
                  </div>
                  <div>
                    <strong>Support Required:</strong> {selectedDeal.dealType}
                  </div>
                  <div>
                    <strong>Revenue Band:</strong> {selectedDeal.revenueBand}
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
                  Advisory Timeline
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div>
                    <strong>Start Date:</strong> {formatDate(selectedDeal.completionDate)}
                  </div>
                  <div>
                    <strong>Advisory Duration:</strong> {selectedDeal.dealDuration}
                  </div>
                  <div>
                    <strong>Next Review:</strong> {selectedDeal.nextRenewal}
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
                    <strong>Stage:</strong> {selectedDeal.smeStage}
                  </div>
                  <div>
                    <strong>Location:</strong> {selectedDeal.location}
                  </div>
                </div>
              </div>
            </div>

            {/* Services Delivered Section */}
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
                Advisory Services Delivered
              </h3>
              <p style={{ fontSize: "16px", color: "#333", lineHeight: "1.6", margin: 0 }}>
                {selectedDeal.serviceDelivered}
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

// Main Tabbed Component for Advisors
const AdvisorTabbedTables = ({ filters, stageFilter, loading }) => {
  const [activeTab, setActiveTab] = useState("my-matches")
  const [myMatchesCount, setMyMatchesCount] = useState(0)
  const [successfulDealsCount, setSuccessfulDealsCount] = useState(0)

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

  // Function to update successful deals count
  const handleDealsCountChange = (count) => {
    setSuccessfulDealsCount(count)
  }

  // Function to update matches count (you'll need to implement this in your AdvisorTable component)
  const handleMatchesCountChange = (count) => {
    setMyMatchesCount(count)
  }

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
            {myMatchesCount}
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
            {successfulDealsCount}
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
            <AdvisorTable filters={filters} stageFilter={stageFilter} onMatchesCountChange={handleMatchesCountChange} />
          </div>
        )}

        {activeTab === "successful-deals" && (
          <SuccessfulAdvisorDealsTable onDealsCountChange={handleDealsCountChange} />
        )}
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

export default AdvisorTabbedTables