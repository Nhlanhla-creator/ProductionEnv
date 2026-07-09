"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { db, auth } from "../../firebaseConfig"
import { Trophy, Users, TrendingUp, Building, MapPin, DollarSign, Calendar, Eye, Wrench, Loader, RefreshCw, X, BarChart3, Briefcase, Award, Package } from "lucide-react"
import { useNavigate } from "react-router-dom"

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
  if (!amount || amount === "Not specified" || amount === "N/A") return "Not specified"
  if (typeof amount === "string") {
    // Check if it's already a formatted currency
    if (amount.includes("R") || amount.includes("$") || amount.includes("€")) return amount
    return `R ${amount}`
  }
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

// Cache key for localStorage
const ADVISOR_COHORTS_CACHE_KEY = 'advisorCohorts_cache'
const CACHE_TIMEOUT = 5 * 60 * 1000 // 5 minutes

function AdvisorCohorts() {
  const [cohorts, setCohorts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCohort, setSelectedCohort] = useState(null)
  
  const navigate = useNavigate()

  // Load cohorts
  useEffect(() => {
    fetchCohorts()
  }, [])

  const getCachedCohorts = () => {
    try {
      const cached = localStorage.getItem(ADVISOR_COHORTS_CACHE_KEY)
      if (!cached) return null

      const { data, timestamp } = JSON.parse(cached)
      
      if (Date.now() - timestamp < CACHE_TIMEOUT) {
        return data
      } else {
        localStorage.removeItem(ADVISOR_COHORTS_CACHE_KEY)
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
      localStorage.setItem(ADVISOR_COHORTS_CACHE_KEY, JSON.stringify(cacheData))
    } catch (error) {
      console.error("Error setting cache:", error)
    }
  }

  const fetchCohorts = async (forceRefresh = false) => {
    try {
      setLoading(true)
      
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

      // Query for successful deals in AdvisorApplications
      const q = query(
        collection(db, "AdvisorApplications"),
        where("advisorId", "==", currentUser.uid),
        where("status", "==", "Deal Successful")
      )

      const querySnapshot = await getDocs(q)
      console.log(`Found successful deals for advisor ${currentUser.uid}:`, querySnapshot.docs.length)

      const cohortsData = await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data()
          
          try {
            let profileData = {}

            // Get SME profile data if available
            if (data.smeId) {
              const profileRef = doc(db, "universalProfiles", data.smeId)
              const profileSnap = await getDoc(profileRef)

              if (profileSnap.exists()) {
                profileData = profileSnap.data()
              }
            }

            const smeName = data.smeName || data.companyName || "Unnamed Business"

            return {
              id: docSnap.id,
              smeId: data.smeId || data.userId,
              smeName: smeName,
              dealAmount: data.advisorCompensationModel || "Not specified",
              dealType: data.smeSupport || "Advisory",
              completionDate: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              sector: formatLabel(data.smeSector) || "Not specified",
              location: formatLabel(data.smeLocation) || "Not specified",
              teamSize: data.teamSize || "Not specified",
              description: data.serviceDelivered || "Advisory services provided",
              currentStatus: "Active Advisory",
              profileData: profileData,
              lastUpdated: new Date().toISOString(),
              dealStructure: data.dealStructure || "Advisory contract",
              dealDuration: data.dealDuration || "Ongoing",
              supportProvided: data.serviceDelivered || "Strategic advisory services",
              compensationModel: data.advisorCompensationModel || "Not specified",
              contractValue: data.contractValue || "Not specified",
              nextRenewal: data.nextRenewal || "To be determined",
              advisoryType: data.advisoryType || "Strategic Advisor",
              performanceRating: data.performanceRating || "4.5/5",
              smeStage: data.smeStage || "Not specified",
              revenueBand: data.revenue || "Not specified",
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
      console.error("Error fetching advisor cohorts:", error)
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
    sessionStorage.setItem('advisorViewMode', 'true')
    sessionStorage.setItem('viewOrigin', 'advisor')
    window.location.href = '/overall-company-health'
  }

  const handleViewDetails = (cohort) => {
    setSelectedCohort(cohort)
  }

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
    if (!rating) return "#666"
    const score = Number.parseFloat(rating.split("/")[0])
    if (score >= 4.5) return "#4caf50"
    if (score >= 4.0) return "#8bc34a"
    if (score >= 3.5) return "#ff9800"
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

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "60vh",
        padding: "20px",
        transition: "margin-left 0.3s ease"
      }}>
        <Loader size={36} style={{ color: "#a67c52", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "#7d5a50", fontSize: "16px", marginLeft: "12px" }}>Loading your advisory cohorts...</p>
      </div>
    )
  }

  return (
    <div style={{ 
      padding: "20px",
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
              My Advisory Cohorts
            </h1>
            <p style={{ color: "#7d5a50", fontSize: "16px" }}>
              View and manage your portfolio of successful SME advisory engagements
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

        {/* Summary Cards */}
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
                Total Engagements
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
                Active Advisory
              </h3>
            </div>
            <p style={{ fontSize: "32px", fontWeight: "700", color: "#4caf50", margin: 0 }}>
              {cohorts.filter(c => c.currentStatus === "Active Advisory").length}
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
                SME Clients
              </h3>
            </div>
            <p style={{ fontSize: "32px", fontWeight: "700", color: "#2196f3", margin: 0 }}>
              {cohorts.length}
            </p>
          </div>
        </div>

        {/* Portfolio Table */}
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
                Advisory Portfolio
              </h2>
              <span style={{ 
                fontSize: "12px", 
                color: "#7d5a50",
                backgroundColor: "rgba(166, 124, 82, 0.15)",
                padding: "6px 12px",
                borderRadius: "6px",
                fontWeight: "600"
              }}>
                {cohorts.length} {cohorts.length === 1 ? 'engagement' : 'engagements'}
              </span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ 
                width: "100%", 
                borderCollapse: "collapse",
                fontSize: "14px"
              }}>
                <thead>
                  <tr style={{ backgroundColor: "#faf7f2", borderBottom: "2px solid #e6d7c3" }}>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: "600", color: "#4a352f", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>SME</th>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: "600", color: "#4a352f", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>Compensation</th>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: "600", color: "#4a352f", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>Sector & Location</th>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: "600", color: "#4a352f", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>Start Date</th>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: "600", color: "#4a352f", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>Status</th>
                    <th style={{ padding: "16px 20px", textAlign: "center", fontWeight: "600", color: "#4a352f", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>Actions</th>
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
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#faf7f2" }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
                    >
                      <td style={{ padding: "20px", minWidth: "200px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <div style={{ fontSize: "15px", fontWeight: "600", color: "#4a352f", marginBottom: "4px" }}>{cohort.smeName}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Briefcase size={13} style={{ color: "#a67c52" }} />
                            <span style={{ fontSize: "12px", color: "#7d5a50", textTransform: "capitalize" }}>{cohort.advisoryType || "Strategic Advisor"}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Award size={13} style={{ color: "#a67c52" }} />
                            <span style={{ fontSize: "12px", color: "#7d5a50" }}>Rating: {cohort.performanceRating}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "20px", minWidth: "140px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <div style={{ fontSize: "14px", fontWeight: "600", color: "#4a352f" }}>
                            {formatCurrency(cohort.dealAmount)}
                          </div>
                          <div style={{ fontSize: "12px", color: "#7d5a50" }}>
                            {cohort.contractValue !== "Not specified" && `Contract: ${formatCurrency(cohort.contractValue)}`}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "20px", minWidth: "200px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Building size={13} style={{ color: "#a67c52" }} />
                            <span style={{ fontSize: "13px", color: "#5d4037" }}>{cohort.sector}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <MapPin size={13} style={{ color: "#a67c52" }} />
                            <span style={{ fontSize: "13px", color: "#5d4037" }}>{cohort.location}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "20px", minWidth: "130px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Calendar size={14} style={{ color: "#a67c52" }} />
                          <span style={{ fontSize: "13px", color: "#5d4037" }}>{formatDate(cohort.completionDate)}</span>
                        </div>
                      </td>
                      <td style={{ padding: "20px", minWidth: "150px" }}>
                        <span style={{
                          backgroundColor: "#4caf5020",
                          color: "#4caf50",
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
                      <td style={{ padding: "20px", minWidth: "200px" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
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
                            onMouseEnter={(e) => { e.target.style.backgroundColor = "#8d6e63"; e.target.style.transform = "translateY(-1px)" }}
                            onMouseLeave={(e) => { e.target.style.backgroundColor = "#a67c52"; e.target.style.transform = "translateY(0)" }}
                          >
                            <Wrench size={13} /> Growth Suite
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
                            onMouseEnter={(e) => { e.target.style.backgroundColor = "#faf7f2" }}
                            onMouseLeave={(e) => { e.target.style.backgroundColor = "white" }}
                          >
                            <Eye size={13} /> Details
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
              No Advisory Engagements Yet
            </h3>
            <p style={{ color: "#7d5a50", fontSize: "15px", maxWidth: "500px", margin: "0 auto" }}>
              Your successful advisory engagements will appear here once you complete matches with SMEs.
            </p>
          </div>
        )}
      </div>

      {/* Detailed View Modal */}
      {selectedCohort && (
        <div style={modalOverlayStyle} onClick={() => setSelectedCohort(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", paddingBottom: "24px", borderBottom: "3px solid #8d6e63" }}>
              <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#3e2723", margin: 0, display: "flex", alignItems: "center", gap: "12px" }}>
                <Briefcase size={32} style={{ color: "#ffd700" }} />
                Advisory Details: {selectedCohort.smeName}
              </h2>
              <button onClick={() => setSelectedCohort(null)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#666", padding: "8px" }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", marginBottom: "32px" }}>
              <div style={{ backgroundColor: "#f8f9fa", padding: "24px", borderRadius: "12px", border: "1px solid #e9ecef" }}>
                <h3 style={{ color: "#3e2723", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <DollarSign size={20} /> Compensation Details
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div><strong>Compensation Model:</strong> {selectedCohort.dealAmount}</div>
                  <div><strong>Contract Value:</strong> {formatCurrency(selectedCohort.contractValue)}</div>
                  <div><strong>Revenue Band:</strong> {selectedCohort.revenueBand}</div>
                  <div><strong>Advisory Type:</strong> {selectedCohort.advisoryType}</div>
                </div>
              </div>

              <div style={{ backgroundColor: "#f8f9fa", padding: "24px", borderRadius: "12px", border: "1px solid #e9ecef" }}>
                <h3 style={{ color: "#3e2723", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Calendar size={20} /> Timeline & Performance
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div><strong>Start Date:</strong> {formatDate(selectedCohort.completionDate)}</div>
                  <div><strong>Advisory Duration:</strong> {selectedCohort.dealDuration}</div>
                  <div><strong>Next Review:</strong> {selectedCohort.nextRenewal}</div>
                  <div><strong>Performance Rating:</strong> <span style={{ color: getRatingColor(selectedCohort.performanceRating), fontWeight: "700" }}>{selectedCohort.performanceRating}</span></div>
                </div>
              </div>

              <div style={{ backgroundColor: "#f8f9fa", padding: "24px", borderRadius: "12px", border: "1px solid #e9ecef" }}>
                <h3 style={{ color: "#3e2723", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Building size={20} /> SME Details
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div><strong>Sector:</strong> {selectedCohort.sector}</div>
                  <div><strong>Stage:</strong> {selectedCohort.smeStage}</div>
                  <div><strong>Location:</strong> {selectedCohort.location}</div>
                  <div><strong>Team Size:</strong> {selectedCohort.teamSize}</div>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: "#f8f9fa", padding: "24px", borderRadius: "12px", border: "1px solid #e9ecef", marginBottom: "24px" }}>
              <h3 style={{ color: "#3e2723", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Package size={20} /> Advisory Services Delivered
              </h3>
              <p style={{ fontSize: "16px", color: "#333", lineHeight: "1.6", margin: 0 }}>{selectedCohort.supportProvided}</p>
            </div>

            <div style={{ backgroundColor: "#e8f5e9", padding: "24px", borderRadius: "12px", border: "1px solid #4caf50", marginBottom: "24px" }}>
              <h3 style={{ color: "#2e7d32", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <BarChart3 size={20} /> Engagement Summary
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "20px", fontWeight: "700", color: getRatingColor(selectedCohort.performanceRating) }}>{selectedCohort.performanceRating}</div>
                  <div style={{ fontSize: "14px", color: "#666" }}>Performance Rating</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "20px", fontWeight: "700", color: "#2196f3" }}>{formatCurrency(selectedCohort.contractValue)}</div>
                  <div style={{ fontSize: "14px", color: "#666" }}>Contract Value</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "20px", fontWeight: "700", color: "#4caf50" }}>{selectedCohort.currentStatus}</div>
                  <div style={{ fontSize: "14px", color: "#666" }}>Current Status</div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setSelectedCohort(null)} style={{
                backgroundColor: "#5d4037", color: "white", border: "none", borderRadius: "12px",
                padding: "16px 32px", fontSize: "16px", fontWeight: "600", cursor: "pointer", transition: "all 0.3s ease"
              }} onMouseEnter={(e) => { e.target.style.backgroundColor = "#4a352f" }} onMouseLeave={(e) => { e.target.style.backgroundColor = "#5d4037" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinning { animation: spin 1s linear infinite; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @media (max-width: 768px) { .main-container { margin-left: 0 !important; padding: 20px; } }
      `}</style>
    </div>
  )
}

export default AdvisorCohorts