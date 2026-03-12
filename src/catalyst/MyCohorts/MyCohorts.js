"use client"
import { useState, useEffect } from "react"
import { Trophy, Users, TrendingUp, Building, MapPin, DollarSign, Calendar, Eye, Wrench, Loader, RefreshCw, X, BarChart3, ChevronDown, FileText } from "lucide-react"
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

// Skeleton Components
const StatCardSkeleton = () => (
  <div className="bg-white p-5 rounded-xl shadow-md border-2 border-[#e6d7c3]">
    <div className="flex items-center gap-3 mb-2">
      <div className="w-5 h-5 rounded bg-shimmer-mid bg-shimmer animate-shimmer" />
      <div className="w-24 h-4 bg-shimmer-light bg-shimmer animate-shimmer-d1 rounded" />
    </div>
    <div className="w-16 h-8 bg-shimmer-dark bg-shimmer animate-shimmer-d2 rounded mt-2" />
  </div>
)

const TableHeaderSkeleton = () => (
  <thead>
    <tr className="bg-[#faf7f2] border-b-2 border-[#e6d7c3]">
      {[1,2,3,4,5,6].map((i) => (
        <th key={i} className="p-5">
          <div className="w-20 h-3 bg-shimmer-mid bg-shimmer animate-shimmer rounded" />
        </th>
      ))}
    </tr>
  </thead>
)

const TableRowSkeleton = ({ index }) => {
  const delays = ['animate-shimmer', 'animate-shimmer-d1', 'animate-shimmer-d2', 'animate-shimmer-d3', 'animate-shimmer-d4']
  
  return (
    <tr className="border-b border-[#f0e6d9]">
      {/* Company */}
      <td className="p-5">
        <div className="space-y-2">
          <div className={`w-32 h-4 bg-shimmer-dark bg-shimmer ${delays[0]} rounded`} />
          <div className={`w-24 h-3 bg-shimmer-mid bg-shimmer ${delays[1]} rounded`} />
          <div className={`w-20 h-3 bg-shimmer-light bg-shimmer ${delays[2]} rounded`} />
        </div>
      </td>
      
      {/* Support Value */}
      <td className="p-5">
        <div className={`w-20 h-5 bg-shimmer-dark bg-shimmer ${delays[1]} rounded`} />
      </td>
      
      {/* Sector & Location */}
      <td className="p-5">
        <div className="space-y-2">
          <div className={`w-24 h-3 bg-shimmer-mid bg-shimmer ${delays[2]} rounded`} />
          <div className={`w-20 h-3 bg-shimmer-light bg-shimmer ${delays[3]} rounded`} />
        </div>
      </td>
      
      {/* Start Date */}
      <td className="p-5">
        <div className={`w-16 h-3 bg-shimmer-mid bg-shimmer ${delays[2]} rounded`} />
      </td>
      
      {/* Status */}
      <td className="p-5">
        <div className={`w-20 h-6 bg-shimmer-light bg-shimmer ${delays[3]} rounded-full`} />
      </td>
      
      {/* Actions */}
      <td className="p-5">
        <div className="flex gap-2 justify-center">
          <div className={`w-20 h-8 bg-shimmer-dark bg-shimmer ${delays[4]} rounded`} />
          <div className={`w-16 h-8 bg-shimmer-mid bg-shimmer ${delays[0]} rounded`} />
        </div>
      </td>
    </tr>
  )
}

const LoadingSkeleton = () => (
  <div className="min-h-screen box-border transition-[margin-left] duration-300">
    <div className="mx-auto px-8 w-full">
      {/* Header */}
      <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
        <div className="space-y-2">
          <div className="w-48 h-7 bg-shimmer-dark bg-shimmer animate-shimmer rounded" />
          <div className="w-64 h-4 bg-shimmer-mid bg-shimmer animate-shimmer-d1 rounded" />
        </div>
        <div className="w-32 h-9 bg-shimmer-light bg-shimmer animate-shimmer-d2 rounded" />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5 mb-8">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden w-full border border-[#e6d7c3]">
        <div className="p-5 border-b-2 border-[#e6d7c3] bg-[#f5f0e1] flex justify-between items-center">
          <div className="w-40 h-5 bg-shimmer-dark bg-shimmer animate-shimmer rounded" />
          <div className="w-20 h-6 bg-shimmer-mid bg-shimmer animate-shimmer-d1 rounded" />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <TableHeaderSkeleton />
            <tbody>
              {[1,2,3,4].map((i) => (
                <TableRowSkeleton key={i} index={i} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
)

function MyCohorts() {
  const [cohorts, setCohorts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCohort, setSelectedCohort] = useState(null)

  useEffect(() => {
    fetchCohorts()
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

  // UPDATED: Added origin tracking for Catalyst view
  const handleViewGrowthSuite = (cohort) => {
    sessionStorage.setItem('viewingSMEId', cohort.smeId)
    sessionStorage.setItem('viewingSMEName', cohort.smeName)
    sessionStorage.setItem('investorViewMode', 'true')
    sessionStorage.setItem('viewOrigin', 'catalyst') // Set origin as catalyst
    window.location.href = '/overall-company-health'
  }

    const handleViewDocuments = (cohort) => {
    sessionStorage.setItem('viewingSMEId', cohort.smeId)
    sessionStorage.setItem('viewingSMEName', cohort.smeName)
    sessionStorage.setItem('investorViewMode', 'true')
    window.location.href = '/my-documents'
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

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="min-h-screen box-border transition-[margin-left] duration-300">
      <div className="mx-auto px-8 w-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-[28px] font-bold text-[#4a352f] mb-2">
              My Support Portfolio
            </h1>
            <p className="text-[#7d5a50] text-base">
              View and manage your portfolio of successful SME support deals
            </p>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`bg-white text-[#a67c52] border-2 border-[#a67c52] rounded-lg px-4 py-2.5 text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-all duration-300 hover:bg-[#f5f0e1] ${refreshing ? 'opacity-60' : ''}`}
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-md border-2 border-[#e6d7c3]">
            <div className="flex items-center gap-3 mb-2">
              <Trophy size={20} className="text-[#a67c52]" />
              <h3 className="text-sm font-semibold text-[#7d5a50] m-0">
                Total Support Deals
              </h3>
            </div>
            <p className="text-3xl font-bold text-[#a67c52] m-0">
              {cohorts.length}
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-md border-2 border-[#e6d7c3]">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp size={20} className="text-green-600" />
              <h3 className="text-sm font-semibold text-[#7d5a50] m-0">
                Active Support
              </h3>
            </div>
            <p className="text-3xl font-bold text-green-600 m-0">
              {cohorts.filter(c => c.currentStatus === "Active Support").length}
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-md border-2 border-[#e6d7c3]">
            <div className="flex items-center gap-3 mb-2">
              <Building size={20} className="text-blue-500" />
              <h3 className="text-sm font-semibold text-[#7d5a50] m-0">
                Portfolio Companies
              </h3>
            </div>
            <p className="text-3xl font-bold text-blue-500 m-0">
              {cohorts.length}
            </p>
          </div>
        </div>

        {cohorts.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden w-full border border-[#e6d7c3]">
            <div className="p-5 border-b-2 border-[#e6d7c3] bg-[#f5f0e1] flex justify-between items-center">
              <h2 className="text-xl font-semibold text-[#4a352f] m-0">
                Portfolio Companies
              </h2>
              <span className="text-xs text-[#7d5a50] bg-[#a67c52]/15 px-3 py-1.5 rounded-md font-semibold">
                {cohorts.length} {cohorts.length === 1 ? 'company' : 'companies'}
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#faf7f2] border-b-2 border-[#e6d7c3]">
                    <th className="p-5 text-left font-semibold text-[#4a352f] text-xs uppercase tracking-wide whitespace-nowrap">
                      Company
                    </th>
                    <th className="p-5 text-left font-semibold text-[#4a352f] text-xs uppercase tracking-wide whitespace-nowrap">
                      Support Value
                    </th>
                    <th className="p-5 text-left font-semibold text-[#4a352f] text-xs uppercase tracking-wide whitespace-nowrap">
                      Sector & Location
                    </th>
                    <th className="p-5 text-left font-semibold text-[#4a352f] text-xs uppercase tracking-wide whitespace-nowrap">
                      Start Date
                    </th>
                    <th className="p-5 text-left font-semibold text-[#4a352f] text-xs uppercase tracking-wide whitespace-nowrap">
                      Status
                    </th>
                    <th className="p-5 text-center font-semibold text-[#4a352f] text-xs uppercase tracking-wide whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cohorts.map((cohort, index) => (
                    <tr 
                      key={cohort.id}
                      className={`border-b border-[#f0e6d9] last:border-b-0 hover:bg-[#faf7f2] transition-colors duration-200`}
                    >
                      {/* Company Name & Type */}
                      <td className="p-5 min-w-[220px]">
                        <div className="flex flex-col gap-1.5">
                          <div className="text-base font-semibold text-[#4a352f] mb-1">
                            {cohort.smeName}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Trophy size={13} className="text-[#a67c52]" />
                            <span className="text-xs text-[#7d5a50] capitalize">
                              {cohort.dealType}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users size={13} className="text-[#a67c52]" />
                            <span className="text-xs text-[#7d5a50]">
                              {cohort.teamSize} employees
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Investment Amount */}
                      <td className="p-5 min-w-[140px]">
                        <div className="text-base font-bold text-[#4a352f] flex items-center gap-1">
                          {formatCurrency(cohort.dealAmount)}
                        </div>
                      </td>

                      {/* Sector & Location */}
                      <td className="p-5 min-w-[200px]">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-1.5">
                            <Building size={13} className="text-[#a67c52]" />
                            <span className="text-sm text-[#5d4037]">
                              {cohort.sector}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin size={13} className="text-[#a67c52]" />
                            <span className="text-sm text-[#5d4037]">
                              {cohort.location}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="p-5 min-w-[130px]">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-[#a67c52]" />
                          <span className="text-sm text-[#5d4037]">
                            {formatDate(cohort.completionDate)}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-5 min-w-[150px]">
                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold inline-block whitespace-nowrap"
                          style={{
                            backgroundColor: getStatusColor(cohort.currentStatus) + "20",
                            color: getStatusColor(cohort.currentStatus)
                          }}>
                          {cohort.currentStatus}
                        </span>
                      </td>

                    {/* Actions */}
<td style={{ padding: "8px", minWidth: "150px" }}>
<div style={{ 
  display: "flex", 
  flexDirection: "column",
  gap: "6px",
  alignItems: "center"
}}>
    <button
      onClick={() => handleViewGrowthSuite(cohort)}
      style={{
        backgroundColor: "#a67c52",
        color: "white",
        border: "none",
        borderRadius: "6px",
        padding: "6px 8px",
        fontSize: "11px",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "3px",
        transition: "all 0.2s ease",
        whiteSpace: "nowrap",
        flex: "0 1 auto"
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
      <Wrench size={11} />
     Growth Suite
    </button>

    <button
      onClick={() => handleViewDocuments(cohort)}
      style={{
        backgroundColor: "#74635b",
        color: "white",
        border: "none",
        borderRadius: "6px",
        padding: "6px 8px",
        fontSize: "11px",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "3px",
        transition: "all 0.2s ease",
        whiteSpace: "nowrap",
        flex: "0 1 auto"
      }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = "#357abd"
        e.target.style.transform = "translateY(-1px)"
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = "#4a90e2"
        e.target.style.transform = "translateY(0)"
      }}
    >
      <FileText size={11} />
      Documents
    </button>

    <button
      onClick={() => handleViewDetails(cohort)}
      style={{
        backgroundColor: "white",
        color: "#a67c52",
        border: "1.5px solid #a67c52",
        borderRadius: "6px",
        padding: "6px 8px",
        fontSize: "11px",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "3px",
        transition: "all 0.2s ease",
        whiteSpace: "nowrap",
        flex: "0 1 auto"
      }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = "#faf7f2"
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = "white"
      }}
    >
      <Eye size={11} />
      View Summary
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
          <div className="text-center p-[60px_20px] bg-white rounded-2xl shadow-md border border-[#e6d7c3] w-full">
            <Trophy size={60} className="text-[#c8b6a6] mx-auto mb-5" />
            <h3 className="text-2xl font-semibold text-[#4a352f] mb-3">
              No Support Portfolio Yet
            </h3>
            <p className="text-[#7d5a50] text-base max-w-[500px] mx-auto">
              Your successful support deals will appear here once you approve support for SMEs.
              <br />
              <span className="text-xs text-[#a67c52]">
                Current statuses that appear: "Support Approved", "Active Support", "Deal Closed"
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Detailed View Modal */}
      {selectedCohort && (
        <div 
          className="fixed inset-0 bg-[#3e2723]/85 flex justify-center items-center z-[1000] animate-[fadeIn_0.3s_ease-out] backdrop-blur-sm"
          onClick={() => setSelectedCohort(null)}
        >
          <div 
            className="bg-white rounded-2xl p-10 max-w-[900px] w-[95%] max-h-[90vh] overflow-y-auto shadow-2xl border border-[#8d6e63]/10 animate-[slideUp_0.4s_cubic-bezier(0.34,1.56,0.64,1)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-8 pb-6 border-b-3 border-[#8d6e63]">
              <h2 className="text-[28px] font-bold text-[#3e2723] m-0 flex items-center gap-3">
                <Trophy size={32} className="text-yellow-400" />
                Support Deal Details: {selectedCohort.smeName}
              </h2>
              <button
                onClick={() => setSelectedCohort(null)}
                className="bg-none border-none text-2xl cursor-pointer text-gray-600 p-2"
              >
                <X size={24} />
              </button>
            </div>

            {/* Support Deal Overview Cards */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6 mb-8">
              <div className="bg-[#f8f9fa] p-6 rounded-xl border border-gray-200">
                <h3 className="text-[#3e2723] mb-4 flex items-center gap-2">
                  <DollarSign size={20} />
                  Financial Details
                </h3>
                <div className="grid gap-3">
                  <div><strong>Funding Required:</strong> {formatCurrency(selectedCohort.dealAmount)}</div>
                  <div><strong>Equity Offered:</strong> {selectedCohort.dealType}</div>
                  <div><strong>Guarantees:</strong> {selectedCohort.guarantees || "Not specified"}</div>
                  <div><strong>Deal Structure:</strong> {selectedCohort.dealStructure}</div>
                </div>
              </div>

              <div className="bg-[#f8f9fa] p-6 rounded-xl border border-gray-200">
                <h3 className="text-[#3e2723] mb-4 flex items-center gap-2">
                  <Calendar size={20} />
                  Timeline & Performance
                </h3>
                <div className="grid gap-3">
                  <div><strong>Start Date:</strong> {formatDate(selectedCohort.completionDate)}</div>
                  <div><strong>Support Duration:</strong> {selectedCohort.dealDuration}</div>
                  <div>
                    <strong>ROI:</strong>
                    <span className="font-bold ml-2" style={{ color: getRoiColor(selectedCohort.roi) }}>
                      {selectedCohort.roi}
                    </span>
                  </div>
                  <div>
                    <strong>Current Status:</strong>
                    <span
                      className="ml-2 px-2 py-1 rounded-lg text-xs font-semibold"
                      style={{
                        backgroundColor: getStatusColor(selectedCohort.currentStatus) + "20",
                        color: getStatusColor(selectedCohort.currentStatus),
                      }}
                    >
                      {selectedCohort.currentStatus}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#f8f9fa] p-6 rounded-xl border border-gray-200">
                <h3 className="text-[#3e2723] mb-4 flex items-center gap-2">
                  <Users size={20} />
                  Company Details
                </h3>
                <div className="grid gap-3">
                  <div><strong>Sector:</strong> {selectedCohort.sector}</div>
                  <div><strong>Location:</strong> {selectedCohort.location}</div>
                  <div><strong>Team Size:</strong> {selectedCohort.teamSize}</div>
                  <div><strong>Description:</strong> {selectedCohort.description}</div>
                </div>
              </div>
            </div>

            {/* Support Provided Section */}
            <div className="bg-[#f8f9fa] p-6 rounded-xl border border-gray-200 mb-6">
              <h3 className="text-[#3e2723] mb-4 flex items-center gap-2">
                <Wrench size={20} />
                Support Services Provided
              </h3>
              <p className="text-base text-gray-800 leading-relaxed m-0">
                {selectedCohort.supportProvided}
              </p>
            </div>

            {/* Key Metrics Summary */}
            <div className="bg-green-50 p-6 rounded-xl border border-green-600 mb-6">
              <h3 className="text-green-800 mb-4 flex items-center gap-2">
                <BarChart3 size={20} />
                Support Program Summary
              </h3>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: getRoiColor(selectedCohort.roi) }}>
                    {selectedCohort.roi}
                  </div>
                  <div className="text-sm text-gray-600">Return on Investment</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{formatCurrency(selectedCohort.dealAmount)}</div>
                  <div className="text-sm text-gray-600">Support Value</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: getRoiColor(selectedCohort.revenueGrowth) }}>
                    {selectedCohort.revenueGrowth}
                  </div>
                  <div className="text-sm text-gray-600">Revenue Growth</div>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedCohort(null)}
                className="bg-[#5d4037] text-white border-none rounded-xl px-8 py-4 text-base font-semibold cursor-pointer transition-all duration-300 hover:bg-[#4a352f]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
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