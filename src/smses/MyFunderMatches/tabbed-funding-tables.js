"use client"
import { useState, useRef, useEffect } from "react"
import { Eye, ChevronDown, Search, X, Trophy, TrendingUp, Calendar, DollarSign } from "lucide-react"
import { FundingTable } from "./funding-table"
import styles from "./funding.module.css"
import { db } from "../../firebaseConfig"
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore"
import { getAuth } from "firebase/auth"

// Text truncation component
const TruncatedText = ({ text, maxLines = 2 }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showSeeMore, setShowSeeMore] = useState(false)
  const textRef = useRef(null)

  useEffect(() => {
    if (!text || !textRef.current) {
      setShowSeeMore(false)
      return
    }

    const charLimit = maxLines * 35
    const hasLongText = text.length > charLimit
    const hasMultipleItems = (text.match(/,/g) || []).length >= 2

    setShowSeeMore(hasLongText || hasMultipleItems)
  }, [text, maxLines])

  if (!text || text === "-" || text === "Not specified" || text === "Various") {
    return <span>{text || "-"}</span>
  }

  const toggleExpanded = (e) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  return (
    <div className={styles.truncatedTextContainer}>
      <div
        ref={textRef}
        className={`${styles.truncatedText} ${isExpanded ? styles.expanded : ""}`}
        style={{
          "--max-lines": maxLines,
          WebkitLineClamp: isExpanded ? "none" : maxLines,
        }}
      >
        {text}
      </div>
      {showSeeMore && (
        <button className={styles.seeMoreButton} onClick={toggleExpanded}>
          {isExpanded ? "See less" : "See more"}
          <ChevronDown
            size={12}
            style={{
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          />
        </button>
      )}
    </div>
  )
}

// Calculate duration between two dates
const calculateDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return "Not specified"

  try {
    const start = new Date(startDate)
    const end = new Date(endDate)

    // If dates are the same, return "Same day"
    if (start.toDateString() === end.toDateString()) {
      return "Same day"
    }

    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""}`
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      return `${months} month${months !== 1 ? "s" : ""}`
    } else {
      const years = Math.floor(diffDays / 365)
      const remainingMonths = Math.floor((diffDays % 365) / 30)
      return `${years} year${years !== 1 ? "s" : ""}${remainingMonths > 0 ? ` ${remainingMonths} month${remainingMonths !== 1 ? "s" : ""}` : ""}`
    }
  } catch (error) {
    console.error("Error calculating duration:", error)
    return "Not specified"
  }
}

// Successful Deals Table Component
const SuccessfulDealsTable = () => {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDeal, setSelectedDeal] = useState(null)

  useEffect(() => {
    const auth = getAuth()
    const user = auth.currentUser
    if (!user) {
      setLoading(false)
      return
    }

    const unsubscribe = onSnapshot(
      query(
        collection(db, "smeApplications"),
        where("smeId", "==", user.uid),
        where("pipelineStage", "in", ["Deal Complete", "Closed"]),
      ),
      async (snapshot) => {
        try {
          const successfulDeals = []

          for (const docSnapshot of snapshot.docs) {
            const data = docSnapshot.data()

            let investorProfile = null
            try {
              const investorDoc = await getDoc(doc(db, "MyuniversalProfiles", data.funderId))
              if (investorDoc.exists()) {
                investorProfile = investorDoc.data()
                console.log("[v0] Investor profile data:", investorProfile)
              } else {
                console.log("[v0] No investor profile found for funderId:", data.funderId)
              }
            } catch (error) {
              console.error("Error fetching investor profile:", error)
            }

            let smeProfile = null
            try {
              const smeDoc = await getDoc(doc(db, "universalProfiles", data.smeId))
              if (smeDoc.exists()) {
                smeProfile = smeDoc.data()
              }
            } catch (error) {
              console.error("Error fetching SME profile:", error)
            }

            // Get completion date - prioritize deal completion date, then current date for active deals
            const completionDate =
              data.dealCompletionDate ||
              (data.pipelineStage === "Closed" ? data.updatedAt : null) ||
              new Date().toISOString().split("T")[0]

            // Calculate duration from application to completion
            const dealDuration = calculateDuration(data.applicationDate, completionDate)

            const deal = {
              id: docSnapshot.id,
              funderName:
                investorProfile?.formData?.fundManageOverview?.registeredName ||
                investorProfile?.formData?.fundManageOverview?.tradingName ||
                investorProfile?.fundManageOverview?.registeredName ||
                investorProfile?.fundManageOverview?.tradingName ||
                data.funderName ||
                "Unnamed Investor",
              dealAmount:
                data.fundingDetails?.amountApproved ||
                investorProfile?.formData?.fundManageOverview?.valueDeployed ||
                data.fundingNeeded ||
                "Not specified",
              dealType: data.investmentType || data.fundingDetails?.investmentType || "Not specified",
              completionDate: completionDate,
              sector:
                investorProfile?.formData?.fundManageOverview?.focusAreas?.[0] ||
                investorProfile?.formData?.generalInvestmentPreference?.sectorFocus?.[0] ||
                investorProfile?.fundManageOverview?.investmentFocus ||
                data.investorSector ||
                "Not specified",
              dealStructure: data.fundingDetails?.paymentDeployment || data.supportFormat || "Not specified",
              dealDuration: dealDuration,
              supportReceived: data.funderSupportOffered || "Not specified",
              currentStatus: data.pipelineStage === "Closed" ? "Exited (Successful)" : "Active Investment",
              roi: "Pending", // This would need to be calculated based on actual performance
              nextMilestone: data.pipelineStage === "Closed" ? "Exit Completed" : "Ongoing Operations",
              location:
                investorProfile?.formData?.fundManageOverview?.location ||
                investorProfile?.formData?.entityOverview?.location ||
                investorProfile?.fundManageOverview?.location ||
                investorProfile?.entityOverview?.location ||
                data.investorLocation ||
                "Not specified",
              teamSize:
                investorProfile?.formData?.fundManageOverview?.numberOfInvestmentExecutives ||
                investorProfile?.fundManageOverview?.numberOfInvestmentExecutives ||
                "Not specified",
              revenue: data.revenue || "Not specified",
              focusArea: data.focusArea || "Not specified",
              applicationDate: data.applicationDate, // Store for duration calculation
            }

            successfulDeals.push(deal)
          }

          console.log("[v0] Successful deals fetched:", successfulDeals.length)
          setDeals(successfulDeals)
        } catch (error) {
          console.error("Error processing successful deals:", error)
        } finally {
          setLoading(false)
        }
      },
      (error) => {
        console.error("Error fetching successful deals:", error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case "Active Investment":
        return "#5392e0ff"
      case "Exited (Successful)":
        return "#1c8546ff"
      default:
        return "#666"
    }
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
    maxWidth: "800px",
    width: "95%",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 20px 60px rgba(62, 39, 35, 0.5), 0 0 0 1px rgba(141, 110, 99, 0.1)",
    animation: "slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "200px",
          fontSize: "16px",
          color: "#666",
        }}
      >
        Loading successful deals...
      </div>
    )
  }

  if (deals.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "200px",
          fontSize: "16px",
          color: "#666",
          textAlign: "center",
        }}
      >
        <Trophy size={48} style={{ color: "#ccc", marginBottom: "16px" }} />
        <p>No successful deals yet.</p>
        <p style={{ fontSize: "14px", color: "#999" }}>
          Completed deals will appear here when applications reach "Deal Complete" status.
        </p>
      </div>
    )
  }

  return (
    <>
      <div style={{ marginBottom: "24px" }}>
        <p style={{ color: "#666", fontSize: "14px" }}>
          {deals.length} successful deal{deals.length !== 1 ? "s" : ""} completed
        </p>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.fundingTable} style={{ tableLayout: "fixed", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ width: "10%", lineHeight: "1.2", fontWeight: "600", fontSize: "12px" }}>Investor Name</th>
              <th style={{ width: "9%", fontWeight: "600", fontSize: "12px" }}>Deal Amount</th>
              <th style={{ width: "8%", fontWeight: "600", fontSize: "12px" }}>Deal Type</th>
              <th style={{ width: "9%", fontWeight: "600", fontSize: "12px" }}>Completion Date</th>
              <th style={{ width: "8%", fontWeight: "600", fontSize: "12px" }}>Sector</th>
              <th style={{ width: "10%", fontWeight: "600", fontSize: "12px" }}>Deal Structure</th>
              <th style={{ width: "6%", fontWeight: "600", fontSize: "12px" }}>ROI</th>
              <th style={{ width: "10%", fontWeight: "600", fontSize: "12px" }}>Current Status</th>
              <th style={{ width: "8%", fontWeight: "600", fontSize: "12px" }}>Team Size</th>
              <th style={{ width: "8%", fontWeight: "600", fontSize: "12px" }}>Revenue</th>
              <th style={{ width: "7%", fontWeight: "600", fontSize: "12px" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((deal) => (
              <tr key={deal.id}>
                <td style={{ wordWrap: "break-word", whiteSpace: "normal", verticalAlign: "top", fontSize: "14px" }}>
                  <span
                    style={{
                      color: "#a67c52",
                     
                    fontSize: "12px",
                      display: "block",
                      lineHeight: "1.3",
                      wordWrap: "break-word",
                      whiteSpace: "normal",
                    }}
                  >
                    <TruncatedText text={deal.funderName} maxLines={2} />
                  </span>
                </td>

                <td
                  style={{
                    verticalAlign: "top",
                    fontWeight: "400",
                    color: "#321e0cff",
                    fontSize: "12px",
                  }}
                >
                  {deal.dealAmount}
                </td>

                <td style={{ verticalAlign: "top", fontSize: "12px", fontWeight: "400" }}>{deal.dealType}</td>

                <td
                  style={{
                    verticalAlign: "top",
                    color: "#321e0cff",
                    fontSize: "12px",
                    fontWeight: "400",
                  }}
                >
                  {formatDate(deal.completionDate)}
                </td>

                <td style={{ verticalAlign: "top", fontSize: "12px", fontWeight: "400" }}>
                  <TruncatedText text={deal.sector} maxLines={2} />
                </td>

                <td style={{ verticalAlign: "top", fontSize: "12px", fontWeight: "400" }}>
                  <TruncatedText text={deal.dealStructure} maxLines={2} />
                </td>

                <td
                  style={{
                    verticalAlign: "top",
                    textAlign: "center",
                    color: "#321e0cff",
                    fontSize: "12px",
                  }}
                >
                  {deal.roi}
                </td>

                <td style={{ verticalAlign: "top", fontSize: "12px", fontWeight: "400" }}>
                  <span
                    style={{
                      backgroundColor: getStatusColor(deal.currentStatus) + "20",
                      color: getStatusColor(deal.currentStatus),
                      padding: "6px 10px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "500",
                      display: "inline-block",
                    }}
                  >
                    {deal.currentStatus}
                  </span>
                </td>

                <td style={{ verticalAlign: "top", fontSize: "12px", fontWeight: "400" }}>{deal.teamSize}</td>

                <td style={{ verticalAlign: "top", fontSize: "12px", fontWeight: "400" }}>{deal.revenue}</td>

                <td
                  style={{
                    verticalAlign: "top",
                    textAlign: "center",
                    fontSize: "14px",
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
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto",
                    }}
                  >
                    <Eye size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Deal Details Modal */}
      {selectedDeal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
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
                <Trophy size={32} style={{ color: "#ffd700" }} />
                Deal Details: {selectedDeal.funderName}
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

            {/* Deal Overview */}
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
                  Financial Details
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div>
                    <strong>Deal Amount:</strong> {selectedDeal.dealAmount}
                  </div>
                  <div>
                    <strong>Deal Type:</strong> {selectedDeal.dealType}
                  </div>
                  <div>
                    <strong>Deal Structure:</strong> {selectedDeal.dealStructure}
                  </div>
                  <div>
                    <strong>ROI:</strong> {selectedDeal.roi}
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
                  Timeline & Status
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div>
                    <strong>Application Date:</strong> {formatDate(selectedDeal.applicationDate)}
                  </div>
                  <div>
                    <strong>Completion Date:</strong> {formatDate(selectedDeal.completionDate)}
                  </div>
                  <div>
                    <strong>Deal Duration:</strong> {selectedDeal.dealDuration}
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
                  <div>
                    <strong>Next Milestone:</strong> {selectedDeal.nextMilestone}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
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
                <TrendingUp size={20} />
                Additional Details
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "16px",
                }}
              >
                <div>
                  <strong>Sector:</strong> {selectedDeal.sector}
                </div>
                <div>
                  <strong>Support Received:</strong> {selectedDeal.supportReceived}
                </div>
                <div>
                  <strong>Location:</strong> {selectedDeal.location}
                </div>
                <div>
                  <strong>Team Size:</strong> {selectedDeal.teamSize}
                </div>
                <div>
                  <strong>Revenue:</strong> {selectedDeal.revenue}
                </div>
                <div>
                  <strong>Focus Area:</strong> {selectedDeal.focusArea}
                </div>
              </div>
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
    </>
  )
}

const TabbedFundingTables = ({
  filters,
  onInsightsData,
  onPrimaryMatchCount,
  activeTab = "matches",
  setActiveTab,
  onDealComplete,
}) => {
  const [successfulDealsCount, setSuccessfulDealsCount] = useState(0)

  useEffect(() => {
    const auth = getAuth()
    const user = auth.currentUser
    if (!user) return

    const unsubscribe = onSnapshot(
      query(
        collection(db, "smeApplications"),
        where("smeId", "==", user.uid),
        where("pipelineStage", "in", ["Deal Complete", "Closed"]),
      ),
      (snapshot) => {
        setSuccessfulDealsCount(snapshot.docs.length)
      },
      (error) => {
        console.error("Error counting successful deals:", error)
      },
    )

    return () => unsubscribe()
  }, [])

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
          onClick={() => setActiveTab && setActiveTab("matches")}
          style={tabStyle(activeTab === "matches")}
          onMouseEnter={(e) => {
            if (activeTab !== "matches") {
              e.target.style.backgroundColor = "#8d6e63"
              e.target.style.color = "white"
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "matches") {
              e.target.style.backgroundColor = "transparent"
              e.target.style.color = "#5d4037"
            }
          }}
        >
          <Search size={18} />
          My Matches
          <span
            style={{
              backgroundColor: activeTab === "matches" ? "rgba(255, 255, 255, 0.2)" : "rgba(93, 64, 55, 0.1)",
              color: activeTab === "matches" ? "white" : "#5d4037",
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
            24
          </span>
        </button>

        <button
          onClick={() => setActiveTab && setActiveTab("successful")}
          style={tabStyle(activeTab === "successful")}
          onMouseEnter={(e) => {
            if (activeTab !== "successful") {
              e.target.style.backgroundColor = "#8d6e63"
              e.target.style.color = "white"
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "successful") {
              e.target.style.backgroundColor = "transparent"
              e.target.style.color = "#5d4037"
            }
          }}
        >
          <Trophy size={18} />
          Successful Deals
          <span
            style={{
              backgroundColor: activeTab === "successful" ? "rgba(255, 255, 255, 0.2)" : "rgba(93, 64, 55, 0.1)",
              color: activeTab === "successful" ? "white" : "#5d4037",
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
        {activeTab === "matches" && (
          <div>
            <FundingTable
              filters={filters}
              onInsightsData={onInsightsData}
              onPrimaryMatchCount={onPrimaryMatchCount}
              onDealComplete={onDealComplete}
            />
          </div>
        )}

        {activeTab === "successful" && <SuccessfulDealsTable />}
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

export default TabbedFundingTables
