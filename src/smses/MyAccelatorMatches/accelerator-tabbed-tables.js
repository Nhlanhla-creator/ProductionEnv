"use client"

import { useState, useEffect } from "react"
import { Eye, X, Trophy, TrendingUp, Calendar, DollarSign, BarChart3, Package, Building, Award } from "lucide-react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { auth, db } from "../../firebaseConfig"
import { AcceleratorTable } from "./accelator-table"

// Text truncation component
const TruncatedText = ({ text, maxLength = 40 }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!text || text === "-" || text === "Not specified" || text === "Various") {
    return <span style={{ color: "#999", fontSize: "0.8rem" }}>{text || "-"}</span>
  }

  const shouldTruncate = text.length > maxLength
  const displayText = isExpanded || !shouldTruncate ? text : `${text.slice(0, maxLength)}...`

  const toggleExpanded = (e) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  return (
    <div style={{ lineHeight: "1.4" }}>
      <span style={{ wordBreak: "break-word", fontSize: "0.8rem" }}>{displayText}</span>
      {shouldTruncate && (
        <button
          style={{
            background: "none",
            border: "none",
            color: "#a67c52",
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

// Empty table row component for when there are no deals
const EmptyTableRow = () => (
  <tr style={{ borderBottom: "1px solid #E8D5C4" }}>
    <td colSpan="10" style={{ 
      ...tableCellStyle, 
      textAlign: "center", 
      padding: "2rem",
      color: "#999",
      fontStyle: "italic",
      borderRight: "none"
    }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
        <Trophy size={48} style={{ color: "#ddd" }} />
        <div>
          <p style={{ margin: "0 0 0.5rem 0", fontSize: "1rem", color: "#666" }}>
            You have not applied for any accelerators, so there are no successful deals available.
          </p>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#999" }}>
            You need to apply first to see your successful deals here.
          </p>
        </div>
      </div>
    </td>
  </tr>
)

// Successful Accelerator Deals Table Component
const SuccessfulAcceleratorDealsTable = () => {
  const [deals, setDeals] = useState([])
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCompletedDeals = async () => {
      try {
        const user = auth.currentUser
        if (!user) return

        // Query for completed deals only
        const dealsQuery = query(
          collection(db, "smeCatalystApplications"),
          where("smeId", "==", user.uid),
          where("pipelineStage", "in", ["Support Approved", "Active Support", "Graduated Successfully"])
        )

        const snapshot = await getDocs(dealsQuery)
        const completedDeals = []

        for (const docSnap of snapshot.docs) {
          const dealData = docSnap.data()
          
          // Get additional catalyst details
          const catalystQuery = query(
            collection(db, "catalystProfiles"),
            where("__name__", "==", dealData.catalystId)
          )
          const catalystSnapshot = await getDocs(catalystQuery)
          
          let catalystDetails = {}
          if (!catalystSnapshot.empty) {
            const catalystDoc = catalystSnapshot.docs[0]
            catalystDetails = catalystDoc.data()
          }

          const formData = catalystDetails.formData || {}
          const overview = formData.entityOverview || {}
          const matchPrefs = formData.generalMatchingPreference || {}
          const programs = formData?.programmeDetails?.programs || []
          const program = programs[dealData.programIndex || 0] || {}

          completedDeals.push({
            id: docSnap.id,
            acceleratorName: dealData.acceleratorName || overview.registeredName || "Unknown",
            sectorFocus: matchPrefs.sectorFocus || dealData.sector || "-",
            fundingType: program.supportType || matchPrefs.supportFocusSubtype || dealData.fundingType || "-",
            completionDate: dealData.applicationDate || dealData.createdAt?.toDate?.() || new Date(),
            ticketSize: program.budget || `${program.minimumSupport || "0"} - ${program.maximumSupport || "0"}` || dealData.fundingRequired || "-",
            geographicFocus: matchPrefs.geographicFocus || overview.province || dealData.location || "-",
            deadline: formData.applicationBrief?.applicationWindow || "Rolling",
            fundingStage: matchPrefs.programStage || dealData.fundingStage || "-",
            currentStatus: dealData.pipelineStage || "Active Support",
            nextMilestone: dealData.nextStage || "N/A",
            servicesDelivered: program.servicesOffered || matchPrefs.supportFocus || "Standard accelerator services",
            contractValue: dealData.fundingRequired || program.budget || "-",
            performanceRating: dealData.matchPercentage ? `${Math.round(dealData.matchPercentage / 20)}/5` : "4.5/5",
            programCohort: `Program ${dealData.programIndex + 1 || 1}`,
            graduationStatus: dealData.pipelineStage === "Graduated Successfully" ? "Graduated" : "In Progress",
            acceleratorType: formData.entityOverview?.entityType || "Accelerator",
            equityTaken: program.equityRequirement || "N/A",
            dealStructure: `${program.duration || "12"}-month program`,
            dealDuration: program.duration || "12 months",
            sector: matchPrefs.sectorFocus || dealData.sector || "-",
            location: overview.province || dealData.location || "-",
            dealAmount: dealData.fundingRequired || program.budget || "-",
            dealType: program.supportType || dealData.fundingType || "-"
          })
        }

        setDeals(completedDeals)
      } catch (error) {
        console.error("Error fetching completed deals:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCompletedDeals()
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case "Active Support":
        return "#4caf50"
      case "Support Approved":
        return "#2196f3"
      case "Graduated Successfully":
        return "#ff9800"
      default:
        return "#666"
    }
  }

  const getRatingColor = (rating) => {
    const score = parseFloat(rating.split("/")[0])
    if (score >= 4.5) return "#412d11ff"
    if (score >= 4.0) return "#261d03ff"
    if (score >= 3.5) return "#271a05ff"
    return "#f44336"
  }

  const formatDate = (dateInput) => {
    let date
    if (dateInput?.toDate) {
      date = dateInput.toDate()
    } else if (typeof dateInput === 'string') {
      date = new Date(dateInput)
    } else if (dateInput instanceof Date) {
      date = dateInput
    } else {
      date = new Date()
    }
    
    return date.toLocaleDateString("en-ZA", {
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
    boxShadow: "0 20px 60px rgba(62, 39, 19, 0.5), 0 0 0 1px rgba(141, 110, 99, 0.1)",
    animation: "slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem", color: "#a67c52" }}>
        <p>Loading completed deals...</p>
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
            fontSize: "0.8rem",
            backgroundColor: "#FEFCFA",
            tableLayout: "fixed",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Catalyst Name</th>
              <th style={tableHeaderStyle}>Sector Focus</th>
              <th style={tableHeaderStyle}>Funding Type</th>
              <th style={tableHeaderStyle}>Completion Date</th>
              <th style={tableHeaderStyle}>Ticket Size</th>
              <th style={tableHeaderStyle}>Geographic Focus</th>
              <th style={tableHeaderStyle}>Deadline</th>
              <th style={tableHeaderStyle}>Funding Stage</th>
              <th style={tableHeaderStyle}>Program Status</th>
              <th style={{ ...tableHeaderStyle, borderRight: "none" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {deals.length === 0 ? (
              <EmptyTableRow />
            ) : (
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
                  <td style={tableCellStyle}>
                    <span style={{ color: "#a67c52", fontSize: "0.8rem" }}>
                      <TruncatedText text={deal.acceleratorName} maxLength={30} />
                    </span>
                  </td>

                  <td style={tableCellStyle}>
                    <TruncatedText text={deal.sectorFocus} maxLength={20} />
                  </td>

                  <td style={tableCellStyle}>
                    <span style={{ color: "#374151", fontSize: "0.8rem" }}>
                      {deal.fundingType}
                    </span>
                  </td>

                  <td style={tableCellStyle}>
                    <span style={{ fontSize: "0.8rem" }}>
                      {formatDate(deal.completionDate)}
                    </span>
                  </td>

                  <td style={tableCellStyle}>
                    <TruncatedText text={deal.ticketSize} maxLength={15} />
                  </td>

                  <td style={tableCellStyle}>
                    <TruncatedText text={deal.geographicFocus} maxLength={15} />
                  </td>

                  <td style={tableCellStyle}>
                    <span style={{ fontSize: "0.8rem" }}>
                      {deal.deadline}
                    </span>
                  </td>

                  <td style={tableCellStyle}>
                    <span style={{ fontSize: "0.8rem" }}>
                      {deal.fundingStage}
                    </span>
                  </td>

                  <td style={tableCellStyle}>
                    <span
                      style={{
                        backgroundColor: getStatusColor(deal.currentStatus) + "20",
                        color: getStatusColor(deal.currentStatus),
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "0.7rem",
                        display: "inline-block",
                      }}
                    >
                      {deal.currentStatus}
                    </span>
                  </td>

                  <td style={{ ...tableCellStyle, borderRight: "none" }}>
                    <button
                      onClick={() => handleViewDetails(deal)}
                      style={{
                        backgroundColor: "#5d4037",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        padding: "6px",
                        fontSize: "0.8rem",
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
                  color: "#3e2723",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <Building size={32} style={{ color: "#4caf50" }} />
                Accelerator Deal: {selectedDeal.acceleratorName}
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
                  Deal Financial Details
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div>
                    <span>Funding Amount:</span> {selectedDeal.dealAmount}
                  </div>
                  <div>
                    <span>Total Value:</span> {selectedDeal.contractValue}
                  </div>
                  <div>
                    <span>Deal Type:</span> {selectedDeal.dealType}
                  </div>
                  <div>
                    <span>Equity Taken:</span> {selectedDeal.equityTaken}
                  </div>
                  <div>
                    <span>Performance Rating:</span>
                    <span
                      style={{
                        color: getRatingColor(selectedDeal.performanceRating),
                        marginLeft: "8px",
                      }}
                    >
                      {selectedDeal.performanceRating}
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
                  <Calendar size={20} />
                  Program Timeline
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div>
                    <span>Start Date:</span> {formatDate(selectedDeal.completionDate)}
                  </div>
                  <div>
                    <span>Program Duration:</span> {selectedDeal.dealDuration}
                  </div>
                  <div>
                    <span>Next Milestone:</span> {selectedDeal.nextMilestone}
                  </div>
                  <div>
                    <span>Graduation Status:</span> {selectedDeal.graduationStatus}
                  </div>
                  <div>
                    <span>Current Status:</span>
                    <span
                      style={{
                        backgroundColor: getStatusColor(selectedDeal.currentStatus) + "20",
                        color: getStatusColor(selectedDeal.currentStatus),
                        padding: "4px 8px",
                        borderRadius: "8px",
                        fontSize: "12px",
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
                  Accelerator Information
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div>
                    <span>Sector:</span> {selectedDeal.sector}
                  </div>
                  <div>
                    <span>Accelerator Type:</span> {selectedDeal.acceleratorType}
                  </div>
                  <div>
                    <span>Program Cohort:</span> {selectedDeal.programCohort}
                  </div>
                  <div>
                    <span>Location:</span> {selectedDeal.location}
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
                Services & Support Delivered
              </h3>
              <p style={{ fontSize: "16px", color: "#333", lineHeight: "1.6", margin: 0 }}>
                {selectedDeal.servicesDelivered}
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
                Deal Performance Summary
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "16px",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "24px",
                      color: getRatingColor(selectedDeal.performanceRating),
                    }}
                  >
                    {selectedDeal.performanceRating}
                  </div>
                  <div style={{ fontSize: "14px", color: "#666" }}>Performance Rating</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "24px", color: "#2196f3" }}>{selectedDeal.dealAmount}</div>
                  <div style={{ fontSize: "14px", color: "#666" }}>Funding Secured</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "24px", color: "#ff9800" }}>
                    {selectedDeal.equityTaken}
                  </div>
                  <div style={{ fontSize: "14px", color: "#666" }}>Equity Given</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{ fontSize: "24px", color: getStatusColor(selectedDeal.currentStatus) }}
                  >
                    {selectedDeal.currentStatus === "Active Support" ? "ACTIVE" : "GRADUATED"}
                  </div>
                  <div style={{ fontSize: "14px", color: "#666" }}>Program Status</div>
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

// Main Tabbed Component for Accelerators
const AcceleratorTabbedTables = ({ filters, onApplicationSubmitted }) => {
  const [activeTab, setActiveTab] = useState("my-matches")
  const [myMatchesCount, setMyMatchesCount] = useState(0)
  const [successfulDealsCount, setSuccessfulDealsCount] = useState(0)

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const user = auth.currentUser
        if (!user) return

        // Count matches (all available accelerators)
        const catalystSnapshot = await getDocs(collection(db, "catalystProfiles"))
        setMyMatchesCount(catalystSnapshot.size)

        // Count successful deals
        const dealsQuery = query(
          collection(db, "smeCatalystApplications"),
          where("smeId", "==", user.uid),
          where("pipelineStage", "in", ["Support Approved", "Active Support", "Graduated Successfully"])
        )
        const dealsSnapshot = await getDocs(dealsQuery)
        setSuccessfulDealsCount(dealsSnapshot.size)
      } catch (error) {
        console.error("Error fetching counts:", error)
      }
    }

    fetchCounts()
  }, [])

  const tabStyle = (isActive) => ({
    flex: 1,
    padding: "16px 24px",
    border: "none",
    backgroundColor: isActive ? "#5d4037" : "transparent",
    color: isActive ? "white" : "#5d4037",
    fontSize: "16px",
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
          <TrendingUp size={18} />
          My Matches
          <span
            style={{
              backgroundColor: activeTab === "my-matches" ? "rgba(255, 255, 255, 0.2)" : "rgba(93, 64, 55, 0.1)",
              color: activeTab === "my-matches" ? "white" : "#5d4037",
              borderRadius: "50%",
              width: "24px",
              height: "24px",
              fontSize: "12px",
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
            <AcceleratorTable filters={filters} onApplicationSubmitted={onApplicationSubmitted} />
          </div>
        )}

        {activeTab === "successful-deals" && <SuccessfulAcceleratorDealsTable />}
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

// Style constants for consistent table styling
const tableHeaderStyle = {
  background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
  color: "#FEFCFA",
  padding: "0.6rem 0.4rem",
  textAlign: "left",
  fontSize: "0.8rem",
  letterSpacing: "0.3px",
  textTransform: "none",
  borderRight: "1px solid #1a0c02",
  fontFamily: "system-ui, -apple-system, sans-serif",
}

const tableCellStyle = {
  padding: "0.6rem 0.4rem",
  borderRight: "1px solid #E8D5C4",
  fontSize: "0.8rem",
  verticalAlign: "top",
  color: "#5d2a0a",
  lineHeight: "1.4",
  fontFamily: "system-ui, -apple-system, sans-serif",
}

export default AcceleratorTabbedTables