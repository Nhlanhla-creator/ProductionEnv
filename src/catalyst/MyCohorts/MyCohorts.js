"use client"
import { useState, useEffect } from "react"
import { Trophy, Users, TrendingUp, Building, MapPin, DollarSign, Calendar, Eye, Wrench, Loader, RefreshCw, X, BarChart3, ChevronDown } from "lucide-react"
import { collection, query, where, getDocs, doc, getDoc, orderBy } from "firebase/firestore"
import { db, auth } from "../../firebaseConfig"

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

const formatCurrency = (amount) => {
  if (!amount || amount === "Not specified") return "Not specified"
  if (typeof amount === "string") return amount
  return `R ${amount.toLocaleString()}`
}

const formatDate = (dateString) => {
  if (!dateString) return "Not specified"
  return new Date(dateString).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function MyCohorts() {
  const [cohorts, setCohorts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCohort, setSelectedCohort] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  useEffect(() => {
    fetchCohorts()
    
    const checkSidebarState = () => {
      const sidebarState = localStorage.getItem('sidebarOpen')
      setIsSidebarOpen(sidebarState !== 'false')
    }
    
    checkSidebarState()
    
    window.addEventListener('sidebarToggle', checkSidebarState)
    window.addEventListener('storage', checkSidebarState)
    
    return () => {
      window.removeEventListener('sidebarToggle', checkSidebarState)
      window.removeEventListener('storage', checkSidebarState)
    }
  }, [])

  // Fetch successful support deals from Firestore
  const fetchCohorts = async (forceRefresh = false) => {
    try {
      setLoading(true)
      
      const currentUser = auth.currentUser
      
      if (!currentUser) {
        console.log("No authenticated user")
        setLoading(false)
        return
      }

      // Query catalystApplications for successful deals
      const q = query(
        collection(db, "catalystApplications"),
        where("catalystId", "==", currentUser.uid),
        where("status", "in", ["Support Approved", "Active Support", "Deal Closed"])
      )

      const querySnapshot = await getDocs(q)
      console.log("Found successful support deals:", querySnapshot.docs.length)

      const cohortsData = await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data()
          
          try {
            // Extract SME ID from the document ID
            const docIdParts = docSnap.id.split('_')
            const smeId = docIdParts[1] // Format: catalystId_smeId_programIndex
            
            if (!smeId) {
              console.error("No SME ID found in document ID:", docSnap.id)
              return null
            }

            // Get SME profile data
            let smeName = "Unnamed Business"
            let sector = "Not specified"
            let location = "Not specified"
            let teamSize = "Not specified"
            let description = "No description available"
            let fundingRequired = data.fundingRequired || "Not specified"
            let equityOffered = data.equityOffered || "Not specified"
            let guarantees = data.guarantees || "Not specified"

            const profileRef = doc(db, "universalProfiles", smeId)
            const profileSnap = await getDoc(profileRef)

            if (profileSnap.exists()) {
              const profileData = profileSnap.data()
              const entity = profileData.entityOverview || {}
              
              smeName = entity.registeredName || entity.tradingName || "Unnamed Business"
              sector = formatLabel(entity.economicSectors?.[0]) || "Not specified"
              location = formatLabel(entity.location) || "Not specified"
              teamSize = entity.employeeCount || "Not specified"
              description = entity.shortBusinessDescription || "No description available"
              
              // Get funding details from useOfFunds if available
              const useOfFunds = profileData.useOfFunds || {}
              fundingRequired = fundingRequired === "Not specified" ? 
                (useOfFunds.amountRequested || "Not specified") : fundingRequired
              equityOffered = equityOffered === "Not specified" ?
                (useOfFunds.equityType || "Not specified") : equityOffered
            }

            // Extract program index from document ID
            const programIndex = docIdParts[2] || '0'
            const programSuffix = programIndex !== '0' ? ` (Program ${parseInt(programIndex) + 1})` : ""

            return {
              id: docSnap.id,
              smeId: smeId,
              smeName: `${smeName}${programSuffix}`,
              dealAmount: fundingRequired,
              dealType: equityOffered,
              completionDate: data.updatedAt || data.createdAt || new Date().toISOString(),
              sector: sector,
              location: location,
              teamSize: teamSize,
              description: description,
              currentStatus: data.status || "Active Support",
              lastUpdated: new Date().toISOString(),
              dealStructure: "Support Program",
              dealDuration: "Ongoing",
              supportProvided: data.servicesRequired || "Funding and Strategic Support",
              roi: "To be determined",
              exitStrategy: "To be determined",
              revenueGrowth: "Pending",
              fundingDetails: {
                amountRequested: fundingRequired,
                equityType: equityOffered,
                guarantees: guarantees,
                servicesRequired: data.servicesRequired || "Not specified",
              },
              // Additional fields from successful deals
              guarantees: guarantees,
              servicesRequired: data.servicesRequired || "Not specified",
              applicationDate: data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() : "Not specified",
              programIndex: programIndex,
            }
          } catch (error) {
            console.error("Error processing cohort:", error)
            return null
          }
        })
      )

      const validCohorts = cohortsData.filter(cohort => cohort !== null)
      setCohorts(validCohorts)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching cohorts:", error)
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchCohorts(true)
    setRefreshing(false)
  }

  const handleViewGrowthSuite = (cohort) => {
    sessionStorage.setItem('viewingSMEId', cohort.smeId)
    sessionStorage.setItem('viewingSMEName', cohort.smeName)
    sessionStorage.setItem('investorViewMode', 'true')
    window.location.href = '/Strategy'
  }

  const handleViewDetails = (cohort) => {
    setSelectedCohort(cohort)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Active Support":
        return "#4caf50"
      case "Support Approved":
        return "#2196f3"
      case "Deal Closed":
        return "#4caf50"
      default:
        return "#666"
    }
  }

  const getRoiColor = (roi) => {
    if (roi === "Pending" || roi === "To be determined") return "#666"
    const percentage = Number.parseInt(roi.replace(/[+%]/g, ""))
    if (percentage >= 100) return "#4caf50"
    if (percentage >= 50) return "#8bc34a"
    if (percentage >= 20) return "#ff9800"
    return "#f44336"
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

  const mainMarginLeft = isSidebarOpen ? "250px" : "80px"

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        flexDirection: "column",
        gap: "16px",
        marginLeft: mainMarginLeft,
        padding: "20px",
        transition: "margin-left 0.3s ease"
      }}>
        <Loader size={48} style={{ color: "#a67c52", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "#7d5a50", fontSize: "16px" }}>Loading your portfolio...</p>
      </div>
    )
  }

  return (
    <div style={{ 
      marginLeft: mainMarginLeft,
      padding: "60px",
      backgroundColor: "#faf7f2", 
      minHeight: "100vh",
      boxSizing: "border-box",
      transition: "margin-left 0.3s ease"
    }}>
      <div style={{ 
        maxWidth: "1400px", 
        margin: "0 auto",
        width: "100%"
      }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "flex-start",
          marginBottom: "32px",
          flexWrap: "wrap",
          gap: "16px"
        }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#4a352f", marginBottom: "8px" }}>
              My Support Portfolio
            </h1>
            <p style={{ color: "#7d5a50", fontSize: "16px" }}>
              View and manage your portfolio of successful SME support deals
            </p>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              backgroundColor: "white",
              color: "#a67c52",
              border: "2px solid #a67c52",
              borderRadius: "8px",
              padding: "10px 16px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.3s ease",
              opacity: refreshing ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!refreshing) {
                e.target.style.backgroundColor = "#f5f0e1"
              }
            }}
            onMouseLeave={(e) => {
              if (!refreshing) {
                e.target.style.backgroundColor = "white"
              }
            }}
          >
            <RefreshCw size={16} className={refreshing ? "spinning" : ""} />
            {refreshing ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginBottom: "32px"
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            border: "2px solid #e6d7c3"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <Trophy size={20} style={{ color: "#a67c52" }} />
              <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#7d5a50", margin: 0 }}>
                Total Support Deals
              </h3>
            </div>
            <p style={{ fontSize: "32px", fontWeight: "700", color: "#a67c52", margin: 0 }}>
              {cohorts.length}
            </p>
          </div>

          <div style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            border: "2px solid #e6d7c3"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <TrendingUp size={20} style={{ color: "#4caf50" }} />
              <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#7d5a50", margin: 0 }}>
                Active Support
              </h3>
            </div>
            <p style={{ fontSize: "32px", fontWeight: "700", color: "#4caf50", margin: 0 }}>
              {cohorts.filter(c => c.currentStatus === "Active Support").length}
            </p>
          </div>

          <div style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            border: "2px solid #e6d7c3"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <Building size={20} style={{ color: "#2196f3" }} />
              <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#7d5a50", margin: 0 }}>
                Portfolio Companies
              </h3>
            </div>
            <p style={{ fontSize: "32px", fontWeight: "700", color: "#2196f3", margin: 0 }}>
              {cohorts.length}
            </p>
          </div>
        </div>

        {cohorts.length > 0 ? (
          <div style={{ 
            backgroundColor: "white", 
            borderRadius: "16px", 
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)", 
            overflow: "hidden",
            width: "100%",
            border: "1px solid #e6d7c3"
          }}>
            <div style={{
              padding: "20px 24px",
              borderBottom: "2px solid #e6d7c3",
              backgroundColor: "#f5f0e1",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#4a352f", margin: 0 }}>
                Portfolio Companies
              </h2>
              <span style={{ 
                fontSize: "12px", 
                color: "#7d5a50",
                backgroundColor: "rgba(166, 124, 82, 0.15)",
                padding: "6px 12px",
                borderRadius: "6px",
                fontWeight: "600"
              }}>
                {cohorts.length} {cohorts.length === 1 ? 'company' : 'companies'}
              </span>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ 
                width: "100%", 
                borderCollapse: "collapse",
                fontSize: "14px"
              }}>
                <thead>
                  <tr style={{ backgroundColor: "#faf7f2", borderBottom: "2px solid #e6d7c3" }}>
                    <th style={{ 
                      padding: "16px 20px", 
                      textAlign: "left", 
                      fontWeight: "600", 
                      color: "#4a352f",
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      whiteSpace: "nowrap"
                    }}>
                      Company
                    </th>
                    <th style={{ 
                      padding: "16px 20px", 
                      textAlign: "left", 
                      fontWeight: "600", 
                      color: "#4a352f",
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      whiteSpace: "nowrap"
                    }}>
                      Support Value
                    </th>
                    <th style={{ 
                      padding: "16px 20px", 
                      textAlign: "left", 
                      fontWeight: "600", 
                      color: "#4a352f",
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      whiteSpace: "nowrap"
                    }}>
                      Sector & Location
                    </th>
                    <th style={{ 
                      padding: "16px 20px", 
                      textAlign: "left", 
                      fontWeight: "600", 
                      color: "#4a352f",
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      whiteSpace: "nowrap"
                    }}>
                      Start Date
                    </th>
                    <th style={{ 
                      padding: "16px 20px", 
                      textAlign: "left", 
                      fontWeight: "600", 
                      color: "#4a352f",
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      whiteSpace: "nowrap"
                    }}>
                      Status
                    </th>
                    <th style={{ 
                      padding: "16px 20px", 
                      textAlign: "center", 
                      fontWeight: "600", 
                      color: "#4a352f",
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      whiteSpace: "nowrap"
                    }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cohorts.map((cohort, index) => (
                    <tr 
                      key={cohort.id}
                      style={{
                        borderBottom: index < cohorts.length - 1 ? "1px solid #f0e6d9" : "none",
                        transition: "background-color 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#faf7f2"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent"
                      }}
                    >
                      {/* Company Name & Type */}
                      <td style={{ padding: "20px", minWidth: "220px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <div style={{ 
                            fontSize: "15px", 
                            fontWeight: "600", 
                            color: "#4a352f",
                            marginBottom: "4px"
                          }}>
                            {cohort.smeName}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Trophy size={13} style={{ color: "#a67c52" }} />
                            <span style={{ 
                              fontSize: "12px", 
                              color: "#7d5a50",
                              textTransform: "capitalize"
                            }}>
                              {cohort.dealType}
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Users size={13} style={{ color: "#a67c52" }} />
                            <span style={{ fontSize: "12px", color: "#7d5a50" }}>
                              {cohort.teamSize} employees
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Investment Amount */}
                      <td style={{ padding: "20px", minWidth: "140px" }}>
                        <div style={{ 
                          fontSize: "16px", 
                          fontWeight: "700", 
                          color: "#4a352f",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}>
                          {formatCurrency(cohort.dealAmount)}
                        </div>
                      </td>

                      {/* Sector & Location */}
                      <td style={{ padding: "20px", minWidth: "200px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Building size={13} style={{ color: "#a67c52" }} />
                            <span style={{ fontSize: "13px", color: "#5d4037" }}>
                              {cohort.sector}
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <MapPin size={13} style={{ color: "#a67c52" }} />
                            <span style={{ fontSize: "13px", color: "#5d4037" }}>
                              {cohort.location}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td style={{ padding: "20px", minWidth: "130px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Calendar size={14} style={{ color: "#a67c52" }} />
                          <span style={{ fontSize: "13px", color: "#5d4037" }}>
                            {formatDate(cohort.completionDate)}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "20px", minWidth: "150px" }}>
                        <span style={{
                          backgroundColor: getStatusColor(cohort.currentStatus) + "20",
                          color: getStatusColor(cohort.currentStatus),
                          padding: "6px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "600",
                          display: "inline-block",
                          whiteSpace: "nowrap"
                        }}>
                          {cohort.currentStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "20px", minWidth: "200px" }}>
                        <div style={{ 
                          display: "flex", 
                          gap: "8px",
                          justifyContent: "center",
                          flexWrap: "wrap"
                        }}>
                          <button
                            onClick={() => handleViewGrowthSuite(cohort)}
                            style={{
                              backgroundColor: "#a67c52",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              padding: "8px 12px",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              transition: "all 0.2s ease",
                              whiteSpace: "nowrap"
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = "#8d6e63"
                              e.target.style.transform = "translateY(-1px)"
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = "#a67c52"
                              e.target.style.transform = "translateY(0)"
                            }}
                          >
                            <Wrench size={13} />
                            Growth Suite
                          </button>

                          <button
                            onClick={() => handleViewDetails(cohort)}
                            style={{
                              backgroundColor: "white",
                              color: "#a67c52",
                              border: "1.5px solid #a67c52",
                              borderRadius: "6px",
                              padding: "8px 12px",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              transition: "all 0.2s ease",
                              whiteSpace: "nowrap"
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = "#faf7f2"
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = "white"
                            }}
                          >
                            <Eye size={13} />
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div style={{
            textAlign: "center",
            padding: "60px 20px",
            backgroundColor: "white",
            borderRadius: "16px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            border: "1px solid #e6d7c3",
            width: "100%"
          }}>
            <Trophy size={60} style={{ color: "#c8b6a6", marginBottom: "20px" }} />
            <h3 style={{ fontSize: "22px", fontWeight: "600", color: "#4a352f", marginBottom: "12px" }}>
              No Support Portfolio Yet
            </h3>
            <p style={{ color: "#7d5a50", fontSize: "15px", maxWidth: "500px", margin: "0 auto" }}>
              Your successful support deals will appear here once you approve support for SMEs.
              <br />
              <span style={{ fontSize: "13px", color: "#a67c52" }}>
                Current statuses that appear: "Support Approved", "Active Support", "Deal Closed"
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Detailed View Modal */}
      {selectedCohort && (
        <div style={modalOverlayStyle} onClick={() => setSelectedCohort(null)}>
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
                Support Deal Details: {selectedCohort.smeName}
              </h2>
              <button
                onClick={() => setSelectedCohort(null)}
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

            {/* Support Deal Overview Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
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
                    <strong>Funding Required:</strong> {formatCurrency(selectedCohort.dealAmount)}
                  </div>
                  <div>
                    <strong>Equity Offered:</strong> {selectedCohort.dealType}
                  </div>
                  <div>
                    <strong>Guarantees:</strong> {selectedCohort.guarantees || "Not specified"}
                  </div>
                  <div>
                    <strong>Deal Structure:</strong> {selectedCohort.dealStructure}
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
                    <strong>Start Date:</strong> {formatDate(selectedCohort.completionDate)}
                  </div>
                  <div>
                    <strong>Support Duration:</strong> {selectedCohort.dealDuration}
                  </div>
                  <div>
                    <strong>ROI:</strong>
                    <span style={{ color: getRoiColor(selectedCohort.roi), fontWeight: "700", marginLeft: "8px" }}>
                      {selectedCohort.roi}
                    </span>
                  </div>
                  <div>
                    <strong>Current Status:</strong>
                    <span
                      style={{
                        backgroundColor: getStatusColor(selectedCohort.currentStatus) + "20",
                        color: getStatusColor(selectedCohort.currentStatus),
                        padding: "4px 8px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: "600",
                        marginLeft: "8px",
                      }}
                    >
                      {selectedCohort.currentStatus}
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
                    <strong>Sector:</strong> {selectedCohort.sector}
                  </div>
                  <div>
                    <strong>Location:</strong> {selectedCohort.location}
                  </div>
                  <div>
                    <strong>Team Size:</strong> {selectedCohort.teamSize}
                  </div>
                  <div>
                    <strong>Description:</strong> {selectedCohort.description}
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
                <Wrench size={20} />
                Support Services Provided
              </h3>
              <p style={{ fontSize: "16px", color: "#333", lineHeight: "1.6", margin: 0 }}>
                {selectedCohort.supportProvided}
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
                Support Program Summary
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: "16px",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: "700", color: getRoiColor(selectedCohort.roi) }}>
                    {selectedCohort.roi}
                  </div>
                  <div style={{ fontSize: "14px", color: "#666" }}>Return on Investment</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: "700", color: "#2196f3" }}>{formatCurrency(selectedCohort.dealAmount)}</div>
                  <div style={{ fontSize: "14px", color: "#666" }}>Support Value</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: "700", color: getRoiColor(selectedCohort.revenueGrowth) }}>
                    {selectedCohort.revenueGrowth}
                  </div>
                  <div style={{ fontSize: "14px", color: "#666" }}>Revenue Growth</div>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setSelectedCohort(null)}
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
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#4a352f"
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#5d4037"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spinning {
          animation: spin 1s linear infinite;
        }
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
        
        /* Responsive adjustments */
        @media (max-width: 1400px) {
          .main-container {
            padding: 30px;
          }
        }
        
        @media (max-width: 1024px) {
          .main-container {
            padding: 25px;
          }
        }
        
        @media (max-width: 768px) {
          .main-container {
            margin-left: 0 !important;
            padding: 20px;
          }
        }
      `}</style>
    </div>
  )
}

export default MyCohorts