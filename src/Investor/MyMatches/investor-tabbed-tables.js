"use client"
import { useState, useRef, useEffect } from "react"
import { ChevronDown, X, Trophy, TrendingUp, Calendar, DollarSign, Users, BarChart3, Info } from "lucide-react"
import { InvestorSMETable } from "./investor-sme-table"
import styles from "./investor-funding.module.css"
import { collection, query, where, getDocs, onSnapshot, doc, getDoc } from "firebase/firestore"
import { db } from "../../firebaseConfig"

const formatLabel = (value) => { 
  if (!value) return ""

  return value
    .toString()
    .split(",")
    .map((item) => item.trim())
    .map((word) => {
      if (word.toLowerCase() === "ict") return "ICT"
      if (word.toLowerCase() === "southafrica" || word.toLowerCase() === "south_africa") return "South Africa"
      return word
        .split(/[_\s-]+/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ")
    })
    .join(", ")
}

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
    <div style={{ position: "relative" }}>
      <div
        ref={textRef}
        style={{
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: isExpanded ? "none" : maxLines,
          overflow: "hidden",
          lineHeight: "1.4",
        }}
      >
        {text}
      </div>
      {showSeeMore && (
        <button
          onClick={toggleExpanded}
          style={{
            backgroundColor: "transparent",
            border: "none",
            color: "#5d4037",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "500",
            padding: "2px 4px",
            display: "flex",
            alignItems: "center",
            gap: "2px",
            marginTop: "2px",
          }}
        >
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

const SuccessfulDealsTable = () => {
  const [deals, setDeals] = useState([])
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processedDeals, setProcessedDeals] = useState(new Set()) // Track processed deal IDs

  useEffect(() => {
    const fetchSuccessfulDeals = async () => {
      try {
        setLoading(true)
        // Query for deals with "Deal Complete" status
        const q = query(collection(db, "investorApplications"), where("pipelineStage", "==", "Deal Complete"))

        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
          console.log("[v0] Found successful deals:", querySnapshot.docs.length)

          const newDeals = []
          const newProcessedDeals = new Set(processedDeals)

          for (const docSnap of querySnapshot.docs) {
            const data = docSnap.data()
            
            // Skip if we've already processed this deal
            if (newProcessedDeals.has(docSnap.id)) {
              continue
            }

            console.log("[v0] Processing deal with smeId:", data.smeId)

            try {
              let profileData = {}
              let smeName = "Unnamed Business"

              // First try with smeId as document ID
              if (data.smeId) {
                const profileRef = doc(db, "universalProfiles", data.smeId)
                const profileSnap = await getDoc(profileRef)

                if (profileSnap.exists()) {
                  profileData = profileSnap.data()
                  smeName = profileData.entityOverview?.tradingName || 
                           profileData.entityOverview?.registeredName || 
                           data.companyName || 
                           data.smeName || 
                           "Unnamed Business"
                  console.log("[v0] Found profile data for smeId:", data.smeId, smeName)
                } else {
                  console.log("[v0] No profile found for smeId:", data.smeId)

                  // If not found, try with userId field
                  if (data.userId) {
                    const userProfileRef = doc(db, "universalProfiles", data.userId)
                    const userProfileSnap = await getDoc(userProfileRef)

                    if (userProfileSnap.exists()) {
                      profileData = userProfileSnap.data()
                      smeName = profileData.entityOverview?.tradingName || 
                               profileData.entityOverview?.registeredName || 
                               data.companyName || 
                               data.smeName || 
                               "Unnamed Business"
                      console.log("[v0] Found profile data for userId:", data.userId, smeName)
                    }
                  }
                }
              }

              // If we still don't have a proper name, use available data
              if (smeName === "Unnamed Business") {
                smeName = data.companyName || data.smeName || "Unnamed Business"
              }

              const location = formatLabel(profileData.entityOverview?.location) || formatLabel(data.location) || "Not specified"
              const sector = formatLabel(profileData.entityOverview?.economicSectors?.[0]) || formatLabel(data.sector) || "Not specified"
              const teamSize = profileData.entityOverview?.employeeCount || data.teamSize || "Not specified"

              console.log("[v0] Final deal data:", { smeName, location, sector, teamSize })

              const deal = {
                id: docSnap.id,
                smeName,
                dealAmount: data.fundingDetails?.amountApproved || data.fundingRequired || "Not specified",
                dealType: data.fundingDetails?.investmentType || data.investmentType || "equity",
                completionDate: data.updatedAt || data.createdAt,
                sector,
                dealStructure: data.fundingDetails?.paymentDeployment || "Not specified",
                dealDuration: "Not specified",
                supportProvided: "Funding and Strategic Support",
                currentStatus: "Active Investment",
                roi: "Pending",
                exitStrategy: "To be determined",
                location,
                teamSize,
                revenueGrowth: "Pending",
                fundingDetails: data.fundingDetails || {},
              }

              newDeals.push(deal)
              newProcessedDeals.add(docSnap.id)

            } catch (error) {
              console.error("[v0] Error fetching profile for deal:", data.smeId, error)
              const fallbackDeal = {
                id: docSnap.id,
                smeName: data.companyName || data.smeName || "Unnamed Business",
                dealAmount: data.fundingDetails?.amountApproved || data.fundingRequired || "Not specified",
                dealType: data.fundingDetails?.investmentType || data.investmentType || "equity",
                completionDate: data.updatedAt || data.createdAt,
                sector: formatLabel(data.sector) || "Not specified",
                dealStructure: data.fundingDetails?.paymentDeployment || "Not specified",
                dealDuration: "Not specified",
                supportProvided: "Funding and Strategic Support",
                currentStatus: "Active Investment",
                roi: "Pending",
                exitStrategy: "To be determined",
                location: formatLabel(data.location) || "Not specified",
                teamSize: data.teamSize || "Not specified",
                revenueGrowth: "Pending",
                fundingDetails: data.fundingDetails || {},
              }
              newDeals.push(fallbackDeal)
              newProcessedDeals.add(docSnap.id)
            }
          }

          // Only update if we have new deals to prevent infinite re-renders
          if (newDeals.length > 0) {
            setDeals(prev => {
              const updatedDeals = [...newDeals, ...prev.filter(deal => !newProcessedDeals.has(deal.id))]
              return updatedDeals.slice(0, 50) // Keep only latest 50 deals
            })
            setProcessedDeals(newProcessedDeals)
          }
          
          setLoading(false)
        })

        return () => unsubscribe()
      } catch (error) {
        console.error("[v0] Error fetching successful deals:", error)
        setLoading(false)
      }
    }

    fetchSuccessfulDeals()
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case "Active Investment":
        return "#4caf50"
      case "Exited (Successful)":
        return "#2196f3"
      default:
        return "#666"
    }
  }

  const getRoiColor = (roi) => {
    if (roi === "Pending") return "#666"
    const percentage = Number.parseInt(roi.replace(/[+%]/g, ""))
    if (percentage >= 100) return "#4caf50"
    if (percentage >= 50) return "#8bc34a"
    if (percentage >= 20) return "#ff9800"
    return "#f44336"
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified"
    return new Date(dateString).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handleViewDetails = (deal) => {
    setSelectedDeal(deal)
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
          fontSize: "16px",
          color: "#666",
        }}
      >
        Loading successful deals...
      </div>
    )
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

  return (
    <>
      {/* Always show the table structure */}
      <div className={styles.tableContainer}>
        <table className={styles.fundingTable} style={{ tableLayout: "fixed", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ width: "12%", lineHeight: "1.2" }}>SME Name</th>
              <th style={{ width: "10%" }}>Deal Amount</th>
              <th style={{ width: "9%" }}>Deal Type</th>
              <th style={{ width: "10%" }}>Completion Date</th>
              <th style={{ width: "11%" }}>Sector</th>
              <th style={{ width: "10%" }}>Location</th>
              <th style={{ width: "8%" }}>Team Size</th>
              <th style={{ width: "7%" }}>ROI</th>
              <th style={{ width: "8%" }}>Revenue Growth</th>
              <th style={{ width: "10%" }}>Current Status</th>
              <th style={{ width: "5%" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {deals.length > 0 ? (
              deals.map((deal) => (
                <tr key={deal.id}>
                  <td style={{ wordWrap: "break-word", whiteSpace: "normal", verticalAlign: "top" }}>
                    <span
                      style={{
                        color: "#a67c52",
                        fontWeight: "500",
                        display: "block",
                        lineHeight: "1.3",
                        wordWrap: "break-word",
                        whiteSpace: "normal",
                        cursor: "pointer",
                      }}
                      onClick={() => handleViewDetails(deal)}
                    >
                      <TruncatedText text={deal.smeName} maxLines={2} />
                    </span>
                  </td>

                  <td
                    style={{
                      verticalAlign: "top",
                      fontWeight: "600",
                      color: "#2196f3",
                      fontSize: "13px",
                    }}
                  >
                    {deal.dealAmount}
                  </td>

                  <td style={{ verticalAlign: "top" }}>
                    <span
                      style={{
                        backgroundColor: "#e3f2fd",
                        color: "#1976d2",
                        padding: "3px 6px",
                        borderRadius: "10px",
                        fontSize: "11px",
                        fontWeight: "600",
                      }}
                    >
                      {deal.dealType}
                    </span>
                  </td>

                  <td
                    style={{
                      verticalAlign: "top",
                      fontSize: "13px",
                    }}
                  >
                    {formatDate(deal.completionDate)}
                  </td>

                  <td style={{ verticalAlign: "top", fontSize: "13px" }}>
                    <TruncatedText text={deal.sector} maxLines={2} />
                  </td>

                  <td style={{ verticalAlign: "top", fontSize: "13px" }}>
                    <TruncatedText text={deal.location} maxLines={2} />
                  </td>

                  <td
                    style={{
                      verticalAlign: "top",
                      fontSize: "13px",
                      textAlign: "center",
                    }}
                  >
                    {deal.teamSize}
                  </td>

                  <td
                    style={{
                      verticalAlign: "top",
                      textAlign: "center",
                    }}
                  >
                    <span
                      style={{
                        color: getRoiColor(deal.roi),
                        fontWeight: "700",
                        fontSize: "13px",
                      }}
                    >
                      {deal.roi}
                    </span>
                  </td>

                  <td
                    style={{
                      verticalAlign: "top",
                      textAlign: "center",
                    }}
                  >
                    <span
                      style={{
                        color: getRoiColor(deal.revenueGrowth),
                        fontWeight: "600",
                        fontSize: "13px",
                      }}
                    >
                      {deal.revenueGrowth}
                    </span>
                  </td>

                  <td style={{ verticalAlign: "top" }}>
                    <span
                      style={{
                        backgroundColor: getStatusColor(deal.currentStatus) + "20",
                        color: getStatusColor(deal.currentStatus),
                        padding: "4px 8px",
                        borderRadius: "10px",
                        fontSize: "11px",
                        fontWeight: "600",
                        display: "inline-block",
                      }}
                    >
                      {deal.currentStatus}
                    </span>
                  </td>

                  <td style={{ verticalAlign: "top", textAlign: "center" }}>
                    <button
                      onClick={() => handleViewDetails(deal)}
                      style={{
                        backgroundColor: "#5d4037",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        padding: "4px 8px",
                        fontSize: "11px",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#3e2723"
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "#5d4037"
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              // Empty state row to show table structure
              <tr>
                <td style={{ padding: "2rem 8px", color: "#ccc", textAlign: "center" }}>-</td>
                <td style={{ padding: "2rem 8px", color: "#ccc", textAlign: "center" }}>-</td>
                <td style={{ padding: "2rem 8px", color: "#ccc", textAlign: "center" }}>-</td>
                <td style={{ padding: "2rem 8px", color: "#ccc", textAlign: "center" }}>-</td>
                <td style={{ padding: "2rem 8px", color: "#ccc", textAlign: "center" }}>-</td>
                <td style={{ padding: "2rem 8px", color: "#ccc", textAlign: "center" }}>-</td>
                <td style={{ padding: "2rem 8px", color: "#ccc", textAlign: "center" }}>-</td>
                <td style={{ padding: "2rem 8px", color: "#ccc", textAlign: "center" }}>-</td>
                <td style={{ padding: "2rem 8px", color: "#ccc", textAlign: "center" }}>-</td>
                <td style={{ padding: "2rem 8px", color: "#ccc", textAlign: "center" }}>-</td>
                <td style={{ padding: "2rem 8px", color: "#ccc", textAlign: "center" }}>-</td>
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
            marginTop: "24px",
          }}
        >
          <Trophy size={48} style={{ color: "#a67c52", marginBottom: "16px" }} />
          <h3 style={{ color: "#5d4037", marginBottom: "8px" }}>No Successful Deals Yet</h3>
          <p style={{ color: "#7d5a50" }}>
            Your successful investment deals will appear here once you complete funding transactions.
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
                <Trophy size={32} style={{ color: "#ffd700" }} />
                Investment Details: {selectedDeal.smeName}
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

            {/* Investment Overview Cards */}
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
                  Investment Details
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div>
                    <strong>Investment Amount:</strong> {selectedDeal.dealAmount}
                  </div>
                  <div>
                    <strong>Deal Type:</strong> {selectedDeal.dealType}
                  </div>
                  <div>
                    <strong>Deal Structure:</strong> {selectedDeal.dealStructure}
                  </div>
                  <div>
                    <strong>ROI:</strong>{" "}
                    <span style={{ color: getRoiColor(selectedDeal.roi), fontWeight: "700" }}>{selectedDeal.roi}</span>
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
                  Timeline & Performance
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div>
                    <strong>Investment Date:</strong> {formatDate(selectedDeal.completionDate)}
                  </div>
                  <div>
                    <strong>Investment Duration:</strong> {selectedDeal.dealDuration}
                  </div>
                  <div>
                    <strong>Revenue Growth:</strong>
                    <span
                      style={{
                        color: getRoiColor(selectedDeal.revenueGrowth),
                        fontWeight: "600",
                        marginLeft: "8px",
                      }}
                    >
                      {selectedDeal.revenueGrowth}
                    </span>
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
                  <Users size={20} />
                  Company Details
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div>
                    <strong>Sector:</strong> {selectedDeal.sector}
                  </div>
                  <div>
                    <strong>Location:</strong> {selectedDeal.location}
                  </div>
                  <div>
                    <strong>Team Size:</strong> {selectedDeal.teamSize}
                  </div>
                  <div>
                    <strong>Exit Strategy:</strong> {selectedDeal.exitStrategy}
                  </div>
                </div>
              </div>
            </div>

            {/* Support Provided Section */}
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
                Value-Add Support Provided
              </h3>
              <p style={{ fontSize: "16px", color: "#333", lineHeight: "1.6", margin: 0 }}>
                {selectedDeal.supportProvided}
              </p>
            </div>

            {/* Key Metrics Summary */}
            <div
              style={{
                backgroundColor: "#e8f5e9",
                padding: "24px",
                borderRadius: "12px",
                border: "1px solid #4caf50",
                marginBottom: "24px",
              }}
            >
              <h3
                style={{
                  color: "#2e7d32",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <BarChart3 size={20} />
                Investment Performance Summary
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "16px",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: "700", color: getRoiColor(selectedDeal.roi) }}>
                    {selectedDeal.roi}
                  </div>
                  <div style={{ fontSize: "14px", color: "#666" }}>Return on Investment</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: "700", color: "#2196f3" }}>{selectedDeal.dealAmount}</div>
                  <div style={{ fontSize: "14px", color: "#666" }}>Investment Amount</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: "700", color: getRoiColor(selectedDeal.revenueGrowth) }}>
                    {selectedDeal.revenueGrowth}
                  </div>
                  <div style={{ fontSize: "14px", color: "#666" }}>Revenue Growth</div>
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

const InvestorTabbedTables = ({ filters, stageFilter, activeTab, setActiveTab, onDealComplete }) => {
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

  // Calculate counts for tab badges
  const smeOpportunitiesCount = 8
  const [portfolioCompaniesCount, setPortfolioCompaniesCount] = useState(0)

  useEffect(() => {
    const fetchSuccessfulDealsCount = async () => {
      try {
        const q = query(collection(db, "investorApplications"), where("pipelineStage", "==", "Deal Complete"))
        const snapshot = await getDocs(q)
        setPortfolioCompaniesCount(snapshot.size)
      } catch (error) {
        console.error("Error fetching successful deals count:", error)
      }
    }

    fetchSuccessfulDealsCount()
  }, [])

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
          onClick={() => setActiveTab("sme-opportunities")}
          style={tabStyle(activeTab === "sme-opportunities")}
          onMouseEnter={(e) => {
            if (activeTab !== "sme-opportunities") {
              e.target.style.backgroundColor = "#8d6e63"
              e.target.style.color = "white"
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "sme-opportunities") {
              e.target.style.backgroundColor = "transparent"
              e.target.style.color = "#5d4037"
            }
          }}
        >
          <Users size={18} />
          My Matches
          
        </button>

        <button
          onClick={() => setActiveTab("portfolio")}
          style={tabStyle(activeTab === "portfolio")}
          onMouseEnter={(e) => {
            if (activeTab !== "portfolio") {
              e.target.style.backgroundColor = "#8d6e63"
              e.target.style.color = "white"
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "portfolio") {
              e.target.style.backgroundColor = "transparent"
              e.target.style.color = "#5d4037"
            }
          }}
        >
          <Trophy size={18} />
          Successful Deals
          <span
            style={{
              backgroundColor: activeTab === "portfolio" ? "rgba(255, 255, 255, 0.2)" : "rgba(93, 64, 55, 0.1)",
              color: activeTab === "portfolio" ? "white" : "#5d4037",
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
            {portfolioCompaniesCount}
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
        {activeTab === "sme-opportunities" && (
          <div>
            <InvestorSMETable filters={filters} stageFilter={stageFilter} onDealComplete={onDealComplete} />
          </div>
        )}

        {activeTab === "portfolio" && <SuccessfulDealsTable />}
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

export default InvestorTabbedTables