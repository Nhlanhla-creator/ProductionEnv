"use client"
import { useState, useRef, useEffect } from "react"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { db, auth } from "../../firebaseConfig"
import { Trophy, Users, TrendingUp, Building, MapPin, DollarSign, Calendar, Eye, Wrench, Loader, RefreshCw, X, BarChart3, ChevronDown } from "lucide-react"

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

// Text truncation component (same as your successful deals)
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

// Cache key for localStorage
const COHORTS_CACHE_KEY = 'myCohorts_cache'
const CACHE_TIMEOUT = 5 * 60 * 1000 // 5 minutes

function MyCohorts() {
  const [cohorts, setCohorts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCohort, setSelectedCohort] = useState(null)

  useEffect(() => {
    fetchCohorts()
  }, [])

  const getCachedCohorts = () => {
    try {
      const cached = localStorage.getItem(COHORTS_CACHE_KEY)
      if (!cached) return null

      const { data, timestamp } = JSON.parse(cached)
      
      // Check if cache is still valid (less than 5 minutes old)
      if (Date.now() - timestamp < CACHE_TIMEOUT) {
        return data
      } else {
        // Clear expired cache
        localStorage.removeItem(COHORTS_CACHE_KEY)
        return null
      }
    } catch (error) {
      console.error("Error reading cache:", error)
      return null
    }
  }

  const setCachedCohorts = (data) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      }
      localStorage.setItem(COHORTS_CACHE_KEY, JSON.stringify(cacheData))
    } catch (error) {
      console.error("Error setting cache:", error)
    }
  }

  const fetchCohorts = async (forceRefresh = false) => {
    try {
      setLoading(true)
      
      // Check cache first unless forcing refresh
      if (!forceRefresh) {
        const cachedCohorts = getCachedCohorts()
        if (cachedCohorts) {
          setCohorts(cachedCohorts)
          setLoading(false)
          return
        }
      }

      const currentUser = auth.currentUser
      
      if (!currentUser) {
        console.log("No authenticated user")
        setLoading(false)
        return
      }

      const q = query(
        collection(db, "investorApplications"),
        where("pipelineStage", "==", "Deal Complete")
      )

      const querySnapshot = await getDocs(q)
      console.log("Found successful deals:", querySnapshot.docs.length)

      const cohortsData = await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data()
          
          try {
            let profileData = {}

            if (data.smeId) {
              const profileRef = doc(db, "universalProfiles", data.smeId)
              const profileSnap = await getDoc(profileRef)

              if (profileSnap.exists()) {
                profileData = profileSnap.data()
              } else if (data.userId) {
                const userProfileRef = doc(db, "universalProfiles", data.userId)
                const userProfileSnap = await getDoc(userProfileRef)
                if (userProfileSnap.exists()) {
                  profileData = userProfileSnap.data()
                }
              }
            }

            const smeName =
              profileData.entityOverview?.tradingName ||
              profileData.entityOverview?.registeredName ||
              data.companyName ||
              data.smeName ||
              "Unnamed Business"

            return {
              id: docSnap.id,
              smeId: data.smeId || data.userId,
              smeName,
              dealAmount: data.fundingDetails?.amountApproved || data.fundingRequired || "Not specified",
              dealType: data.fundingDetails?.investmentType || data.investmentType || "equity",
              completionDate: data.updatedAt || data.createdAt,
              sector: formatLabel(profileData.entityOverview?.economicSectors?.[0]) || formatLabel(data.sector) || "Not specified",
              location: formatLabel(profileData.entityOverview?.location) || formatLabel(data.location) || "Not specified",
              teamSize: profileData.entityOverview?.employeeCount || data.teamSize || "Not specified",
              description: profileData.entityOverview?.shortBusinessDescription || "No description available",
              currentStatus: "Active Investment",
              profileData: profileData,
              lastUpdated: new Date().toISOString(),
              // Additional fields for detailed view
              dealStructure: data.fundingDetails?.paymentDeployment || "Not specified",
              dealDuration: "Not specified",
              supportProvided: "Funding and Strategic Support",
              roi: "Pending",
              exitStrategy: "To be determined",
              revenueGrowth: "Pending",
              fundingDetails: data.fundingDetails || {},
            }
          } catch (error) {
            console.error("Error fetching profile:", error)
            return null
          }
        })
      )

      const validCohorts = cohortsData.filter(cohort => cohort !== null)
      setCohorts(validCohorts)
      setCachedCohorts(validCohorts)
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

  // Helper functions for detailed modal (same as your successful deals)
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

  // Modal styles (same as your successful deals)
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

  // Clear cache when component unmounts (optional)
  useEffect(() => {
    return () => {
      // Only clear cache if you want fresh data on next visit
      // localStorage.removeItem(COHORTS_CACHE_KEY)
    }
  }, [])

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "80vh",
        flexDirection: "column",
        gap: "16px"
      }}>
        <Loader size={48} style={{ color: "#a67c52", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "#7d5a50", fontSize: "16px" }}>Loading your portfolio...</p>
      </div>
    )
  }

  return (
    <div style={{ 
      padding: "70px", 
      marginLeft: "150px",
      marginRight: "20px",
      backgroundColor: "#faf7f2", 
      minHeight: "100vh",
      boxSizing: "border-box",
      width: "calc(100vw - 100px)"
    }}>
      <div style={{ 
        maxWidth: "1200px", 
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
              My Investment Cohorts
            </h1>
            <p style={{ color: "#7d5a50", fontSize: "16px" }}>
              View and manage your portfolio of successful SME investments
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
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
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
                Total Investments
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
                Active Deals
              </h3>
            </div>
            <p style={{ fontSize: "32px", fontWeight: "700", color: "#4caf50", margin: 0 }}>
              {cohorts.filter(c => c.currentStatus === "Active Investment").length}
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
            width: "100%"
          }}>
            <div style={{
              padding: "20px",
              borderBottom: "2px solid #e6d7c3",
              backgroundColor: "#f5f0e1",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#4a352f", margin: 0 }}>
                Your Portfolio Companies
              </h2>
              <span style={{ 
                fontSize: "12px", 
                color: "#7d5a50",
                backgroundColor: "rgba(166, 124, 82, 0.1)",
                padding: "4px 8px",
                borderRadius: "4px"
              }}>
                {cohorts.length} companies
              </span>
            </div>

            <div style={{ padding: "8px" }}>
              {cohorts.map((cohort, index) => (
                <div
                  key={cohort.id}
                  style={{
                    padding: "20px",
                    borderBottom: index < cohorts.length - 1 ? "1px solid #f0e6d9" : "none",
                    transition: "all 0.3s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#faf7f2"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent"
                  }}
                >
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "flex-start", 
                    gap: "20px", 
                    flexWrap: "wrap" 
                  }}>
                    <div style={{ flex: 1, minWidth: "280px" }}>
                      <div style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "12px", 
                        marginBottom: "12px", 
                        flexWrap: "wrap" 
                      }}>
                        <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#4a352f", margin: 0 }}>
                          {cohort.smeName}
                        </h3>
                        <span style={{
                          backgroundColor: "#4caf5020",
                          color: "#4caf50",
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "600"
                        }}>
                          {cohort.currentStatus}
                        </span>
                      </div>

                      <p style={{ 
                        color: "#7d5a50", 
                        marginBottom: "16px", 
                        lineHeight: "1.6",
                        fontSize: "14px" 
                      }}>
                        {cohort.description}
                      </p>

                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "12px"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <DollarSign size={14} style={{ color: "#a67c52" }} />
                          <span style={{ color: "#7d5a50", fontSize: "13px" }}>
                            <strong>Investment:</strong> {formatCurrency(cohort.dealAmount)}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Calendar size={14} style={{ color: "#a67c52" }} />
                          <span style={{ color: "#7d5a50", fontSize: "13px" }}>
                            <strong>Date:</strong> {formatDate(cohort.completionDate)}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Building size={14} style={{ color: "#a67c52" }} />
                          <span style={{ color: "#7d5a50", fontSize: "13px" }}>
                            <strong>Sector:</strong> {cohort.sector}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <MapPin size={14} style={{ color: "#a67c52" }} />
                          <span style={{ color: "#7d5a50", fontSize: "13px" }}>
                            <strong>Location:</strong> {cohort.location}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Users size={14} style={{ color: "#a67c52" }} />
                          <span style={{ color: "#7d5a50", fontSize: "13px" }}>
                            <strong>Team Size:</strong> {cohort.teamSize}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Trophy size={14} style={{ color: "#a67c52" }} />
                          <span style={{ color: "#7d5a50", fontSize: "13px" }}>
                            <strong>Type:</strong> {cohort.dealType}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ 
                      display: "flex", 
                      flexDirection: "column", 
                      gap: "10px", 
                      minWidth: "180px" 
                    }}>
                      <button
                        onClick={() => handleViewGrowthSuite(cohort)}
                        style={{
                          backgroundColor: "#a67c52",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          padding: "10px 16px",
                          fontSize: "13px",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          transition: "all 0.3s ease",
                          whiteSpace: "nowrap",
                          width: "100%"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = "#7d5a50"
                          e.target.style.transform = "translateY(-2px)"
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = "#a67c52"
                          e.target.style.transform = "translateY(0)"
                        }}
                      >
                        <Wrench size={14} />
                        View Growth Suite
                      </button>

                      <button
                        onClick={() => handleViewDetails(cohort)}
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
                          justifyContent: "center",
                          gap: "6px",
                          transition: "all 0.3s ease",
                          whiteSpace: "nowrap",
                          width: "100%"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = "#f5f0e1"
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = "white"
                        }}
                      >
                        <Eye size={14} />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{
            textAlign: "center",
            padding: "60px 20px",
            backgroundColor: "white",
            borderRadius: "16px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            width: "100%"
          }}>
            <Trophy size={60} style={{ color: "#c8b6a6", marginBottom: "20px" }} />
            <h3 style={{ fontSize: "22px", fontWeight: "600", color: "#4a352f", marginBottom: "12px" }}>
              No Portfolio Companies Yet
            </h3>
            <p style={{ color: "#7d5a50", fontSize: "15px", maxWidth: "500px", margin: "0 auto" }}>
              Your successful investment deals will appear here once you complete funding transactions with SMEs.
            </p>
          </div>
        )}
      </div>

      {/* Detailed View Modal - Same as your successful deals */}
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
                Investment Details: {selectedCohort.smeName}
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
                    <strong>Investment Amount:</strong> {formatCurrency(selectedCohort.dealAmount)}
                  </div>
                  <div>
                    <strong>Deal Type:</strong> {selectedCohort.dealType}
                  </div>
                  <div>
                    <strong>Deal Structure:</strong> {selectedCohort.dealStructure}
                  </div>
                  <div>
                    <strong>ROI:</strong>{" "}
                    <span style={{ color: getRoiColor(selectedCohort.roi), fontWeight: "700" }}>{selectedCohort.roi}</span>
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
                    <strong>Investment Date:</strong> {formatDate(selectedCohort.completionDate)}
                  </div>
                  <div>
                    <strong>Investment Duration:</strong> {selectedCohort.dealDuration}
                  </div>
                  <div>
                    <strong>Revenue Growth:</strong>
                    <span
                      style={{
                        color: getRoiColor(selectedCohort.revenueGrowth),
                        fontWeight: "600",
                        marginLeft: "8px",
                      }}
                    >
                      {selectedCohort.revenueGrowth}
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
                    <strong>Exit Strategy:</strong> {selectedCohort.exitStrategy}
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
                  <div style={{ fontSize: "24px", fontWeight: "700", color: getRoiColor(selectedCohort.roi) }}>
                    {selectedCohort.roi}
                  </div>
                  <div style={{ fontSize: "14px", color: "#666" }}>Return on Investment</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: "700", color: "#2196f3" }}>{formatCurrency(selectedCohort.dealAmount)}</div>
                  <div style={{ fontSize: "14px", color: "#666" }}>Investment Amount</div>
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
      `}</style>
    </div>
  )
}

export default MyCohorts