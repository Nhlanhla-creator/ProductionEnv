"use client"
import { useState, useEffect } from "react"
import { Trophy, Users, TrendingUp, Building, MapPin, DollarSign, Calendar, Eye, Wrench, Loader, RefreshCw, X, BarChart3, ChevronDown, FileText, Ticket, Copy, CheckCircle } from "lucide-react"
import { collection, query, where, getDocs, doc, getDoc, orderBy, addDoc, updateDoc } from "firebase/firestore"
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
      <td className="p-5">
        <div className="space-y-2">
          <div className={`w-32 h-4 bg-shimmer-dark bg-shimmer ${delays[0]} rounded`} />
          <div className={`w-24 h-3 bg-shimmer-mid bg-shimmer ${delays[1]} rounded`} />
          <div className={`w-20 h-3 bg-shimmer-light bg-shimmer ${delays[2]} rounded`} />
        </div>
        </td>
      <td className="p-5">
        <div className={`w-20 h-5 bg-shimmer-dark bg-shimmer ${delays[1]} rounded`} />
        </td>
      <td className="p-5">
        <div className="space-y-2">
          <div className={`w-24 h-3 bg-shimmer-mid bg-shimmer ${delays[2]} rounded`} />
          <div className={`w-20 h-3 bg-shimmer-light bg-shimmer ${delays[3]} rounded`} />
        </div>
        </td>
      <td className="p-5">
        <div className={`w-16 h-3 bg-shimmer-mid bg-shimmer ${delays[2]} rounded`} />
        </td>
      <td className="p-5">
        <div className={`w-20 h-6 bg-shimmer-light bg-shimmer ${delays[3]} rounded-full`} />
        </td>
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
      <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
        <div className="space-y-2">
          <div className="w-48 h-7 bg-shimmer-dark bg-shimmer animate-shimmer rounded" />
          <div className="w-64 h-4 bg-shimmer-mid bg-shimmer animate-shimmer-d1 rounded" />
        </div>
        <div className="w-32 h-9 bg-shimmer-light bg-shimmer animate-shimmer-d2 rounded" />
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5 mb-8">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
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
  const [showVoucherModal, setShowVoucherModal] = useState(false)
  const [voucherType, setVoucherType] = useState("")
  const [voucherSeats, setVoucherSeats] = useState(1)
  const [expirationDays, setExpirationDays] = useState(30)
  const [expirationMinutes, setExpirationMinutes] = useState(null) // For test mode
  const [isTestMode, setIsTestMode] = useState(false) // Track if test mode is selected
  const [generatedVoucher, setGeneratedVoucher] = useState(null)
  const [copied, setCopied] = useState(false)
  const [savingVoucher, setSavingVoucher] = useState(false)

  useEffect(() => {
    fetchCohorts()
  }, [])

  const fetchCohorts = async (forceRefresh = false) => {
    try {
      setLoading(true)
      
      const currentUser = auth.currentUser
      
      if (!currentUser) {
        console.log("No authenticated user")
        setLoading(false)
        return
      }

      // FIXED: Include "Exit" status alongside Active and Active Support
      const successfulStatuses = [
        "Active Support",
        "Active",
        "Exit"
      ]

      const q = query(
        collection(db, "catalystApplications"),
        where("catalystId", "==", currentUser.uid),
        where("status", "in", successfulStatuses)
      )

      const querySnapshot = await getDocs(q)
      console.log("Found successful support deals (including Exit):", querySnapshot.docs.length)

      const cohortsData = await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data()
          
          try {
            const docIdParts = docSnap.id.split('_')
            const smeId = docIdParts[1]
            
            if (!smeId) {
              console.error("No SME ID found in document ID:", docSnap.id)
              return null
            }

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
              
              const useOfFunds = profileData.useOfFunds || {}
              fundingRequired = fundingRequired === "Not specified" ? 
                (useOfFunds.amountRequested || "Not specified") : fundingRequired
              equityOffered = equityOffered === "Not specified" ?
                (useOfFunds.equityType || "Not specified") : equityOffered
            }

            const programIndex = docIdParts[2] || '0'
            const programSuffix = programIndex !== '0' ? ` (Program ${parseInt(programIndex) + 1})` : ""

            let displayStatus = data.status || "Active Support"
            if (displayStatus === "Active") displayStatus = "Active Support"

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
              currentStatus: displayStatus,
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

  const generateVoucherCode = (type) => {
    const prefix = type === "legitimacy" ? "LG" : 
                   type === "capital" ? "CA" : 
                   type === "governance" ? "GV" : 
                   type === "compliance" ? "CM" : "PR"
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase()
    const seatsPart = voucherSeats.toString().padStart(2, '0')
    return `${prefix}${seatsPart}${randomPart}`
  }

  const handleGenerateVoucher = (cohort, type) => {
    console.log("🎫 Generating voucher for SME:", cohort)
    setSelectedCohort(cohort)
    setVoucherType(type)
    setShowVoucherModal(true)
    setGeneratedVoucher(null)
    setVoucherSeats(1)
    setExpirationDays(30)
    setExpirationMinutes(null)
    setIsTestMode(false)
  }

  const handleExpirationChange = (value) => {
    if (value === "5min") {
      setIsTestMode(true)
      setExpirationMinutes(5)
      setExpirationDays(null)
    } else {
      setIsTestMode(false)
      setExpirationMinutes(null)
      setExpirationDays(parseInt(value))
    }
  }

  const handleConfirmVoucher = async () => {
    const user = auth.currentUser
    if (!user) {
      alert("Please log in to generate vouchers")
      return
    }

    if (!selectedCohort) {
      alert("No SME selected. Please try again.")
      console.error("❌ No selected SME found")
      return
    }

    const code = generateVoucherCode(voucherType)
    setSavingVoucher(true)

    try {
      const smeUserId = selectedCohort?.smeId
      
      console.log("🔍 Generating voucher for SME:", {
        cohortId: selectedCohort?.id,
        smeUserId: smeUserId,
        smeName: selectedCohort?.smeName,
        expirationDays: expirationDays,
        expirationMinutes: expirationMinutes,
        isTestMode: isTestMode
      })

      if (!smeUserId) {
        console.error("❌ No SME user ID found in cohort:", selectedCohort)
        alert("Error: Cannot find SME user ID. Please contact support.")
        setSavingVoucher(false)
        return
      }

      // Calculate expiration date correctly
      const expiresAt = new Date()
      if (isTestMode && expirationMinutes) {
        // TEST MODE: Add minutes
        expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes)
        console.log(`⏰ TEST MODE: Voucher expires in ${expirationMinutes} minutes at ${expiresAt.toLocaleString()}`)
      } else if (expirationDays) {
        // Normal mode: Add days
        expiresAt.setDate(expiresAt.getDate() + expirationDays)
      }

      const voucherData = {
        code: code,
        type: voucherType,
        seats: voucherSeats,
        planName: voucherType === "premium" ? "Premium" : 
                   voucherType === "legitimacy" ? "Legitimacy Boost" : 
                   voucherType === "capital" ? "Capital Appeal Boost" : 
                   voucherType === "governance" ? "Governance Boost" : 
                   voucherType === "compliance" ? "Compliance Boost" : "Standard",
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        expirationDays: expirationDays,
        expirationMinutes: expirationMinutes,
        isTestMode: isTestMode,
        status: "active",
        remainingSeats: voucherSeats,
        redeemedSeats: [],
        voucherCodes: [code],
        createdBy: user.uid,
        createdForSME: selectedCohort?.id || null,
        catalystId: user.uid,
        smeId: smeUserId,
        smeName: selectedCohort?.smeName || null,
        catalystName: user.displayName || user.email || "Catalyst",
        cohortId: selectedCohort?.id,
        createdAtTimestamp: Date.now()
      }

      const vouchersRef = collection(db, "vouchers")
      const docRef = await addDoc(vouchersRef, voucherData)
      
      console.log("✅ Voucher saved to Firebase:", {
        id: docRef.id,
        smeId: voucherData.smeId,
        code: voucherData.code,
        type: voucherData.type,
        expiresAt: voucherData.expiresAt,
        isTestMode: isTestMode
      })
      
      setGeneratedVoucher({
        ...voucherData,
        id: docRef.id
      })
      
      const expiryMessage = isTestMode 
        ? `Expires in ${expirationMinutes} minutes at ${expiresAt.toLocaleTimeString()}`
        : `Expires on ${expiresAt.toLocaleDateString()}`
      
      alert(`✅ Voucher ${code} successfully generated for ${selectedCohort?.smeName}! ${expiryMessage}`)
      
    } catch (error) {
      console.error("❌ Error saving voucher:", error)
      alert("Failed to save voucher. Please try again.")
    } finally {
      setSavingVoucher(false)
    }
  }

  const handleCopyCode = () => {
    if (generatedVoucher) {
      navigator.clipboard.writeText(generatedVoucher.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getVoucherTypeName = (type) => {
    switch(type) {
      case "legitimacy": return "Boost Your Legitimacy Score"
      case "capital": return "Boost Capital Appeal Score"
      case "governance": return "Boost Governance Score"
      case "compliance": return "Boost Your Compliance"
      default: return "Premium Subscription"
    }
  }

  const handleViewGrowthSuite = (cohort) => {
    sessionStorage.setItem('viewingSMEId', cohort.smeId)
    sessionStorage.setItem('viewingSMEName', cohort.smeName)
    sessionStorage.setItem('investorViewMode', 'true')
    sessionStorage.setItem('viewOrigin', 'catalyst')
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
      case "Active":
        return "#4caf50"
      case "Exit":
        return "#9e9e9e"
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
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(62, 39, 35, 0.85)",
    display: "flex", justifyContent: "center", alignItems: "center",
    zIndex: 1000, animation: "fadeIn 0.3s ease-out", backdropFilter: "blur(4px)",
  }

  const modalContentStyle = {
    backgroundColor: "#ffffff", borderRadius: "20px", padding: "40px",
    maxWidth: "550px", width: "95%", maxHeight: "90vh", overflowY: "auto",
    boxShadow: "0 20px 60px rgba(62, 39, 35, 0.5), 0 0 0 1px rgba(141, 110, 99, 0.1)",
    animation: "slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
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
              View and manage your portfolio of active SME support deals
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

        {/* Voucher Info Banner - No icons */}
        <div style={{
          backgroundColor: "#f0f7ff",
          border: "1px solid #a67c52",
          borderRadius: "8px",
          padding: "16px 24px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
        }}>
          <div>
            <p style={{ margin: "0 0 8px 0", color: "#3e2723", fontSize: "0.95rem", fontWeight: "600" }}>
              Support Your SME's Success with Vouchers!
            </p>
            <p style={{ margin: 0, color: "#5d4037", fontSize: "0.9rem", lineHeight: "1.5" }}>
              You can generate vouchers to help your SMEs continue improving their scores. 
              Click "Generate Voucher" below to create codes for:
            </p>
            <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px", color: "#5d4037", fontSize: "0.9rem" }}>
              <li><strong>Premium Subscription</strong> - Unlock all premium features</li>
              <li><strong>Boost Your Legitimacy Score</strong> - Improve business credibility</li>
              <li><strong>Boost Capital Appeal Score</strong> - Attract more investors</li>
              <li><strong>Boost Governance Score</strong> - Strengthen business structure</li>
              <li><strong>Boost Your Compliance</strong> - Ensure regulatory compliance</li>
            </ul>
            <p style={{ margin: "8px 0 0 0", color: "#a67c52", fontSize: "0.85rem", fontStyle: "italic" }}>
              💡 You can set an expiration date for each voucher - after that date/time, the voucher will no longer be valid!
            </p>
          </div>
        </div>

        {/* Stats Cards - No icons */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-md border-2 border-[#e6d7c3]">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-sm font-semibold text-[#7d5a50] m-0">
                Active Support Deals
              </h3>
            </div>
            <p className="text-3xl font-bold text-[#a67c52] m-0">
              {cohorts.length}
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-md border-2 border-[#e6d7c3]">
            <div className="flex items-center gap-3 mb-2">
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
              <h3 className="text-sm font-semibold text-[#7d5a50] m-0">
                Exited Deals
              </h3>
            </div>
            <p className="text-3xl font-bold text-gray-500 m-0">
              {cohorts.filter(c => c.currentStatus === "Exit" || c.currentStatus === "Exit Support").length}
            </p>
          </div>
        </div>

        {cohorts.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden w-full border border-[#e6d7c3]">
            <div className="p-5 border-b-2 border-[#e6d7c3] bg-[#f5f0e1] flex justify-between items-center">
              <h2 className="text-xl font-semibold text-[#4a352f] m-0">
                Active Support & Exited Companies
              </h2>
              <span className="text-xs text-[#7d5a50] bg-[#a67c52]/15 px-3 py-1.5 rounded-md font-semibold">
                {cohorts.length} {cohorts.length === 1 ? 'company' : 'companies'}
              </span>
            </div>

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
                      <td className="p-5 min-w-[220px]">
                        <div className="flex flex-col gap-1.5">
                          <div className="text-base font-semibold text-[#4a352f] mb-1">
                            {cohort.smeName}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-[#7d5a50] capitalize">
                              {cohort.dealType}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-[#7d5a50]">
                              {cohort.teamSize} employees
                            </span>
                          </div>
                        </div>
                        </td>

                      <td className="p-5 min-w-[140px]">
                        <div className="text-base font-bold text-[#4a352f] flex items-center gap-1">
                          {formatCurrency(cohort.dealAmount)}
                        </div>
                        </td>

                      <td className="p-5 min-w-[200px]">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm text-[#5d4037]">
                              {cohort.sector}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm text-[#5d4037]">
                              {cohort.location}
                            </span>
                          </div>
                        </div>
                        </td>

                      <td className="p-5 min-w-[130px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm text-[#5d4037]">
                            {formatDate(cohort.completionDate)}
                          </span>
                        </div>
                        </td>

                      <td className="p-5 min-w-[150px]">
                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold inline-block whitespace-nowrap"
                          style={{
                            backgroundColor: getStatusColor(cohort.currentStatus) + "20",
                            color: getStatusColor(cohort.currentStatus)
                          }}>
                          {cohort.currentStatus === "Exit" ? "Exited" : cohort.currentStatus}
                        </span>
                        </td>

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
                            Documents
                          </button>

                          <button
                            onClick={() => handleGenerateVoucher(cohort, "premium")}
                            style={{
                              backgroundColor: "#4caf50",
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
                              e.target.style.backgroundColor = "#45a049"
                              e.target.style.transform = "translateY(-1px)"
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = "#4caf50"
                              e.target.style.transform = "translateY(0)"
                            }}
                          >
                            Generate Voucher
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
            <h3 className="text-2xl font-semibold text-[#4a352f] mb-3">
              No Active Support or Exited Deals Yet
            </h3>
            <p className="text-[#7d5a50] text-base max-w-[500px] mx-auto">
              Your active support deals and exited investments will appear here once you approve support for SMEs and they reach the "Active" or "Exit" stage.
              <br />
              <span className="text-xs text-[#a67c52]">
                Statuses that appear: "Active Support", "Active", or "Exit"
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Detailed View Modal */}
      {selectedCohort && !showVoucherModal && (
        <div 
          className="fixed inset-0 bg-[#3e2723]/85 flex justify-center items-center z-[1000] animate-[fadeIn_0.3s_ease-out] backdrop-blur-sm"
          onClick={() => setSelectedCohort(null)}
        >
          <div 
            className="bg-white rounded-2xl p-10 max-w-[900px] w-[95%] max-h-[90vh] overflow-y-auto shadow-2xl border border-[#8d6e63]/10 animate-[slideUp_0.4s_cubic-bezier(0.34,1.56,0.64,1)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8 pb-6 border-b-3 border-[#8d6e63]">
              <h2 className="text-[28px] font-bold text-[#3e2723] m-0 flex items-center gap-3">
                Support Deal Details: {selectedCohort.smeName}
              </h2>
              <button
                onClick={() => setSelectedCohort(null)}
                className="bg-none border-none text-2xl cursor-pointer text-gray-600 p-2"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6 mb-8">
              <div className="bg-[#f8f9fa] p-6 rounded-xl border border-gray-200">
                <h3 className="text-[#3e2723] mb-4 flex items-center gap-2">
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
                      {selectedCohort.currentStatus === "Exit" ? "Exited" : selectedCohort.currentStatus}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#f8f9fa] p-6 rounded-xl border border-gray-200">
                <h3 className="text-[#3e2723] mb-4 flex items-center gap-2">
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

            <div className="bg-[#f8f9fa] p-6 rounded-xl border border-gray-200 mb-6">
              <h3 className="text-[#3e2723] mb-4 flex items-center gap-2">
                Support Services Provided
              </h3>
              <p className="text-base text-gray-800 leading-relaxed m-0">
                {selectedCohort.supportProvided}
              </p>
            </div>

            <div className="bg-green-50 p-6 rounded-xl border border-green-600 mb-6">
              <h3 className="text-green-800 mb-4 flex items-center gap-2">
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

            <div className="mb-6">
              <h3 className="text-[#3e2723] mb-4 flex items-center gap-2">
                Generate Support Vouchers
              </h3>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button
                  onClick={() => handleGenerateVoucher(selectedCohort, "premium")}
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
                    gap: "6px",
                  }}
                >
                  Premium Subscription
                </button>
                <button
                  onClick={() => handleGenerateVoucher(selectedCohort, "legitimacy")}
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
                    gap: "6px",
                  }}
                >
                  Legitimacy Boost
                </button>
                <button
                  onClick={() => handleGenerateVoucher(selectedCohort, "capital")}
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
                    gap: "6px",
                  }}
                >
                  Capital Boost
                </button>
                <button
                  onClick={() => handleGenerateVoucher(selectedCohort, "governance")}
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
                    gap: "6px",
                  }}
                >
                  Governance Boost
                </button>
                <button
                  onClick={() => handleGenerateVoucher(selectedCohort, "compliance")}
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
                    gap: "6px",
                  }}
                >
                  Compliance Boost
                </button>
              </div>
            </div>

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

      {/* Voucher Generation Modal with 5 Minute Test Option */}
      {showVoucherModal && (
        <div style={modalOverlayStyle} onClick={() => setShowVoucherModal(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#3e2723", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                Generate Voucher for {selectedCohort?.smeName}
              </h2>
              <button onClick={() => setShowVoucherModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            {!generatedVoucher ? (
              <>
                <p style={{ color: "#5d4037", marginBottom: "24px" }}>
                  Select the type of voucher you want to generate for this SME:
                </p>

                <div style={{ display: "grid", gap: "12px", marginBottom: "24px" }}>
                  {[
                    { id: "premium", label: "Premium Subscription", icon: "🌟" },
                    { id: "legitimacy", label: "Boost Your Legitimacy Score", icon: "🏆" },
                    { id: "capital", label: "Boost Capital Appeal Score", icon: "💰" },
                    { id: "governance", label: "Boost Governance Score", icon: "⚖️" },
                    { id: "compliance", label: "Boost Your Compliance", icon: "📋" },
                  ].map((option) => (
                    <label key={option.id} style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "16px",
                      border: `2px solid ${voucherType === option.id ? "#a67c52" : "#E8D5C4"}`,
                      borderRadius: "10px",
                      cursor: "pointer",
                      backgroundColor: voucherType === option.id ? "#fef9f4" : "white",
                      transition: "all 0.2s ease",
                    }}>
                      <input
                        type="radio"
                        name="voucherType"
                        value={option.id}
                        checked={voucherType === option.id}
                        onChange={(e) => setVoucherType(e.target.value)}
                        style={{ marginRight: "12px", accentColor: "#a67c52" }}
                      />
                      <span style={{ fontSize: "1.2rem", marginRight: "12px" }}>{option.icon}</span>
                      <span style={{ color: "#3e2723", fontWeight: voucherType === option.id ? "600" : "400" }}>
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <label style={{ display: "block", color: "#5d4037", fontWeight: "600", marginBottom: "8px" }}>
                    Number of Seats:
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <button
                      onClick={() => setVoucherSeats(Math.max(1, voucherSeats - 1))}
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        border: "2px solid #a67c52",
                        background: "white",
                        fontSize: "1.2rem",
                        cursor: "pointer",
                      }}
                    >
                      -
                    </button>
                    <span style={{ fontSize: "1.5rem", fontWeight: "700", color: "#3e2723", minWidth: "40px", textAlign: "center" }}>
                      {voucherSeats}
                    </span>
                    <button
                      onClick={() => setVoucherSeats(voucherSeats + 1)}
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        border: "2px solid #a67c52",
                        background: "white",
                        fontSize: "1.2rem",
                        cursor: "pointer",
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Expiration Date Selection - WITH WORKING 5 MINUTES OPTION */}
                <div style={{ marginBottom: "24px" }}>
                  <label style={{ display: "block", color: "#5d4037", fontWeight: "600", marginBottom: "8px" }}>
                    Voucher Expiration:
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                      <select
                        value={isTestMode ? "5min" : (expirationDays || 30)}
                        onChange={(e) => handleExpirationChange(e.target.value)}
                        style={{
                          padding: "10px 16px",
                          borderRadius: "8px",
                          border: "2px solid #a67c52",
                          backgroundColor: "white",
                          fontSize: "14px",
                          cursor: "pointer",
                          flex: 1,
                          minWidth: "150px"
                        }}
                      >
                        <option value="5min">🔴 5 minutes (TEST MODE - Quick Expiry)</option>
                        <option value="7">7 days</option>
                        <option value="14">14 days</option>
                        <option value="30">30 days (1 month)</option>
                        <option value="60">60 days (2 months)</option>
                        <option value="90">90 days (3 months)</option>
                        <option value="180">180 days (6 months)</option>
                        <option value="365">365 days (1 year)</option>
                      </select>
                      <div style={{ fontSize: "14px", color: "#666" }}>
                        {isTestMode 
                          ? `⏰ Expires in 5 minutes at ${new Date(Date.now() + 5 * 60 * 1000).toLocaleTimeString()}`
                          : `📅 Expires on ${new Date(Date.now() + (expirationDays || 30) * 24 * 60 * 60 * 1000).toLocaleDateString()}`
                        }
                      </div>
                    </div>
                    <p style={{ fontSize: "12px", color: isTestMode ? "#ff9800" : "#a67c52", margin: 0 }}>
                      {isTestMode 
                        ? "⚠️ TEST MODE: This voucher will expire in 5 minutes. Use this to test the expiration logic!"
                        : "💡 After this date, the voucher will expire and the SME will no longer be able to redeem it."
                      }
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleConfirmVoucher}
                  disabled={!voucherType || savingVoucher}
                  style={{
                    width: "100%",
                    padding: "16px",
                    backgroundColor: (!voucherType || savingVoucher) ? "#ccc" : "#a67c52",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: (!voucherType || savingVoucher) ? "not-allowed" : "pointer",
                    transition: "all 0.3s ease",
                  }}
                >
                  {savingVoucher ? "Saving Voucher..." : "Generate Voucher"}
                </button>
              </>
            ) : (
              <>
                <div style={{
                  backgroundColor: generatedVoucher.isTestMode ? "#fff3e0" : "#e8f5e9",
                  border: `2px solid ${generatedVoucher.isTestMode ? "#ff9800" : "#4caf50"}`,
                  borderRadius: "12px",
                  padding: "24px",
                  marginBottom: "24px",
                  textAlign: "center",
                }}>
                  <CheckCircle size={48} style={{ color: generatedVoucher.isTestMode ? "#ff9800" : "#4caf50", marginBottom: "16px" }} />
                  <h3 style={{ color: generatedVoucher.isTestMode ? "#e65100" : "#2e7d32", marginBottom: "8px" }}>
                    {generatedVoucher.isTestMode ? "⚠️ TEST Voucher Generated!" : "Voucher Generated Successfully!"}
                  </h3>
                  <p style={{ color: "#3e2723", marginBottom: "16px" }}>
                    {getVoucherTypeName(generatedVoucher.type)} • {generatedVoucher.seats} seat{generatedVoucher.seats > 1 ? 's' : ''}
                  </p>
                  
                  <div style={{
                    background: "#fff",
                    border: "2px dashed #a67c52",
                    borderRadius: "8px",
                    padding: "16px",
                    marginBottom: "16px",
                  }}>
                    <div style={{ fontFamily: "'Courier New', monospace", fontSize: "1.2rem", fontWeight: "bold", color: "#3e2723", marginBottom: "8px" }}>
                      {generatedVoucher.code}
                    </div>
                    <button
                      onClick={handleCopyCode}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#a67c52",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        margin: "0 auto",
                      }}
                    >
                      <Copy size={16} />
                      {copied ? "Copied!" : "Copy Code"}
                    </button>
                  </div>

                  <p style={{ fontSize: "0.85rem", color: generatedVoucher.isTestMode ? "#e65100" : "#666", fontWeight: generatedVoucher.isTestMode ? "bold" : "normal" }}>
                    Expires: {new Date(generatedVoucher.expiresAt).toLocaleString()}
                  </p>
                  {generatedVoucher.isTestMode && (
                    <p style={{ fontSize: "0.8rem", color: "#ff9800", marginTop: "8px", fontWeight: "bold" }}>
                      ⚠️ TEST MODE: This voucher will expire in 5 minutes! Use it quickly to test the expiration logic.
                    </p>
                  )}
                </div>

                <div style={{
                  backgroundColor: "#f0f7ff",
                  border: "1px solid #a67c52",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "24px",
                }}>
                  <p style={{ margin: 0, color: "#3e2723", fontSize: "0.9rem" }}>
                    <strong>📍 Instructions:</strong> Share this code with the SME. They can redeem it in:
                  </p>
                  <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px", color: "#5d4037" }}>
                    <li><strong>Subscription Page</strong> - For premium access</li>
                    <li><strong>Growth Tools → My Purchases</strong> - To view all received vouchers</li>
                  </ul>
                  <p style={{ margin: "12px 0 0 0", color: generatedVoucher.isTestMode ? "#ff9800" : "#a67c52", fontSize: "0.85rem", fontWeight: generatedVoucher.isTestMode ? "bold" : "normal" }}>
                    ⏰ The SME must redeem this voucher before {new Date(generatedVoucher.expiresAt).toLocaleString()} or it will expire!
                    {generatedVoucher.isTestMode && " This is a TEST voucher - it expires in 5 minutes!"}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowVoucherModal(false)
                    setGeneratedVoucher(null)
                    setVoucherType("")
                    setExpirationDays(30)
                    setExpirationMinutes(null)
                    setIsTestMode(false)
                  }}
                  style={{
                    width: "100%",
                    padding: "16px",
                    backgroundColor: "#5d4037",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </>
            )}
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