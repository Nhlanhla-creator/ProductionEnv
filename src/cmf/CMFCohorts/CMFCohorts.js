"use client"
import React, { useState, useEffect } from "react"
import { Trophy, Users, TrendingUp, Building, MapPin, DollarSign, Calendar, Eye, RefreshCw, X, BarChart3, ChevronDown, FileText, Copy, CheckCircle } from "lucide-react"
import { collection, addDoc } from "firebase/firestore"
import { db, auth } from "../../firebaseConfig"

const INITIAL_MOCK_COHORTS = [
  {
    id: "cohort_1",
    smeId: "sme_5",
    smeName: "Siyakhula Logistics",
    dealAmount: "R3,000,000",
    dealAmountRaw: 3000000,
    dealType: "Equity (12%)",
    completionDate: "2026-02-18",
    sector: "Logistics",
    location: "Eastern Cape",
    teamSize: "24",
    description: "Fleet management and logistics operations across South Africa.",
    currentStatus: "Active Support",
    lastUpdated: "2026-07-17T12:00:00.000Z",
    dealStructure: "Support Program",
    dealDuration: "Ongoing",
    supportProvided: "Fleet management systems & working capital optimization",
    roi: "85%",
    exitStrategy: "Equity buyout or trade sale",
    revenueGrowth: "+32%",
    guarantees: "Vehicle Fleet Lien",
    servicesRequired: "Corporate Connections",
    applicationDate: "2026-02-18"
  },
  {
    id: "cohort_2",
    smeId: "sme_7",
    smeName: "BlueSky Logistics",
    dealAmount: "R2,500,000",
    dealAmountRaw: 2500000,
    dealType: "Equity (10%)",
    completionDate: "2026-06-25",
    sector: "Retail",
    location: "Western Cape",
    teamSize: "18",
    description: "Last-mile courier and retail shipping operations.",
    currentStatus: "Active Support",
    lastUpdated: "2026-07-17T12:00:00.000Z",
    dealStructure: "Support Program",
    dealDuration: "Ongoing",
    supportProvided: "Strategic expansion and supply chain consulting",
    roi: "45%",
    exitStrategy: "M&A advisory integration",
    revenueGrowth: "+18%",
    guarantees: "Vehicle Fleet pledge",
    servicesRequired: "Advisory",
    applicationDate: "2026-06-25"
  },
  {
    id: "cohort_3",
    smeId: "sme_3",
    smeName: "EcoPower CleanTech",
    dealAmount: "R2,800,000",
    dealAmountRaw: 2800000,
    dealType: "Equity (15%)",
    completionDate: "2026-06-01",
    sector: "CleanTech",
    location: "Eastern Cape",
    teamSize: "12",
    description: "Renewable energy products and community microgrids.",
    currentStatus: "Exit",
    lastUpdated: "2026-07-17T12:00:00.000Z",
    dealStructure: "Debt/Equity Hybrid",
    dealDuration: "Completed (2 Years)",
    supportProvided: "IP protection patent audits & capital structuring",
    roi: "120%",
    exitStrategy: "IPO or trade acquisition",
    revenueGrowth: "+75%",
    guarantees: "IP Patent Pledge",
    servicesRequired: "Deal Readiness",
    applicationDate: "2026-06-01"
  }
]

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

export default function CMFCohorts() {
  const [cohorts, setCohorts] = useState(INITIAL_MOCK_COHORTS)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCohort, setSelectedCohort] = useState(null)
  const [showVoucherModal, setShowVoucherModal] = useState(false)
  const [voucherType, setVoucherType] = useState("")
  const [voucherSeats, setVoucherSeats] = useState(1)
  const [expirationDays, setExpirationDays] = useState(30)
  const [expirationMinutes, setExpirationMinutes] = useState(null) // For test mode
  const [isTestMode, setIsTestMode] = useState(false)
  const [generatedVoucher, setGeneratedVoucher] = useState(null)
  const [copied, setCopied] = useState(false)
  const [savingVoucher, setSavingVoucher] = useState(false)

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setCohorts(INITIAL_MOCK_COHORTS)
      setRefreshing(false)
    }, 800)
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
      return
    }

    const code = generateVoucherCode(voucherType)
    setSavingVoucher(true)

    try {
      const smeUserId = selectedCohort?.smeId
      if (!smeUserId) {
        alert("Error: Cannot find SME user ID. Please contact support.")
        setSavingVoucher(false)
        return
      }

      // Calculate expiration date correctly
      const expiresAt = new Date()
      if (isTestMode && expirationMinutes) {
        expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes)
      } else if (expirationDays) {
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
        catalystName: user.displayName || user.email || "Facilitator",
        cohortId: selectedCohort?.id,
        createdAtTimestamp: Date.now()
      }

      // Save to Firebase database vouchers collection
      const vouchersRef = collection(db, "vouchers")
      const docRef = await addDoc(vouchersRef, voucherData)
      
      setGeneratedVoucher({
        ...voucherData,
        id: docRef.id
      })
      
      const expiryMessage = isTestMode 
        ? `Expires in ${expirationMinutes} minutes at ${expiresAt.toLocaleTimeString()}`
        : `Expires on ${expiresAt.toLocaleDateString()}`
      
      alert(`Voucher ${code} successfully generated for ${selectedCohort?.smeName}! ${expiryMessage}`)
      
    } catch (error) {
      console.error("Error saving voucher:", error)
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
    sessionStorage.setItem('viewOrigin', 'cmf')
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
      case "Active":
        return "#4caf50"
      case "Exit":
      case "Exited":
        return "#9e9e9e"
      default:
        return "#666"
    }
  }

  const getRoiColor = (roi) => {
    if (roi === "Pending" || roi === "To be determined") return "#666"
    const percentage = parseInt(roi.replace(/[+%]/g, ""))
    if (percentage >= 100) return "#2e7d32"
    if (percentage >= 50) return "#4caf50"
    if (percentage >= 20) return "#ff9800"
    return "#f44336"
  }

  const modalOverlayStyle = {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(62, 39, 35, 0.85)",
    display: "flex", justifyContent: "center", alignItems: "center",
    zIndex: 1000, backdropFilter: "blur(4px)",
  }

  const modalContentStyle = {
    backgroundColor: "#ffffff", borderRadius: "20px", padding: "40px",
    maxWidth: "550px", width: "95%", maxHeight: "90vh", overflowY: "auto",
    boxShadow: "0 20px 60px rgba(62, 39, 35, 0.5)",
  }

  return (
    <div className="min-h-screen box-border p-8 font-sans">
      <div className="mx-auto px-4 w-full">
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

        {/* Voucher Info Banner */}
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

        {/* Stats Cards */}
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
              {cohorts.filter(c => c.currentStatus === "Exit" || c.currentStatus === "Exited").length}
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
                  {cohorts.map((cohort) => (
                    <tr 
                      key={cohort.id}
                      className="border-b border-[#f0e6d9] last:border-b-0 hover:bg-[#faf7f2] transition-colors duration-200"
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
                          {cohort.dealAmount}
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

                      <td className="p-5 min-w-[200px]">
                        <div className="flex flex-wrap gap-2 justify-center">
                          <button
                            onClick={() => handleViewGrowthSuite(cohort)}
                            className="bg-[#a67c52] hover:bg-[#8d6e63] text-white rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all duration-200"
                          >
                            Growth Suite
                          </button>

                          <button
                            onClick={() => handleViewDocuments(cohort)}
                            className="bg-[#74635b] hover:bg-[#5d4f48] text-white rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all duration-200"
                          >
                            Documents
                          </button>

                          <button
                            onClick={() => handleGenerateVoucher(cohort, "premium")}
                            className="bg-[#4caf50] hover:bg-[#45a049] text-white rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all duration-200"
                          >
                            Generate Voucher
                          </button>

                          <button
                            onClick={() => handleViewDetails(cohort)}
                            className="bg-white border-2 border-[#a67c52] text-[#a67c52] hover:bg-[#FAF5EF] rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all duration-200"
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
            </p>
          </div>
        )}
      </div>

      {/* Detailed View Modal */}
      {selectedCohort && !showVoucherModal && (
        <div style={modalOverlayStyle} onClick={() => setSelectedCohort(null)}>
          <div 
            className="bg-white rounded-2xl p-10 max-w-[900px] w-[95%] max-h-[90vh] overflow-y-auto shadow-2xl border border-[#8d6e63]/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8 pb-6 border-b-2 border-[#8d6e63]">
              <h2 className="text-[28px] font-bold text-[#3e2723] m-0 flex items-center gap-3">
                Support Deal Details: {selectedCohort.smeName}
              </h2>
              <button onClick={() => setSelectedCohort(null)} className="bg-none border-none text-gray-600 p-2">
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6 mb-8">
              <div className="bg-[#f8f9fa] p-6 rounded-xl border border-gray-200">
                <h3 className="text-[#3e2723] font-bold mb-4">Financial Details</h3>
                <div className="grid gap-3 text-sm text-[#5d4037]">
                  <div><strong>Funding Required:</strong> {selectedCohort.dealAmount}</div>
                  <div><strong>Equity Offered:</strong> {selectedCohort.dealType}</div>
                  <div><strong>Guarantees:</strong> {selectedCohort.guarantees || "Not specified"}</div>
                  <div><strong>Deal Structure:</strong> {selectedCohort.dealStructure}</div>
                </div>
              </div>

              <div className="bg-[#f8f9fa] p-6 rounded-xl border border-gray-200">
                <h3 className="text-[#3e2723] font-bold mb-4">Timeline & Performance</h3>
                <div className="grid gap-3 text-sm text-[#5d4037]">
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
                    <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold"
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
                <h3 className="text-[#3e2723] font-bold mb-4">Company Details</h3>
                <div className="grid gap-3 text-sm text-[#5d4037]">
                  <div><strong>Sector:</strong> {selectedCohort.sector}</div>
                  <div><strong>Location:</strong> {selectedCohort.location}</div>
                  <div><strong>Team Size:</strong> {selectedCohort.teamSize} employees</div>
                  <div><strong>Description:</strong> {selectedCohort.description}</div>
                </div>
              </div>
            </div>

            <div className="bg-[#f8f9fa] p-6 rounded-xl border border-gray-200 mb-6">
              <h3 className="text-[#3e2723] font-bold mb-4">Support Services Provided</h3>
              <p className="text-sm text-gray-800 leading-relaxed m-0">
                {selectedCohort.supportProvided}
              </p>
            </div>

            <div className="bg-green-50 p-6 rounded-xl border border-green-200 mb-6">
              <h3 className="text-green-800 font-bold mb-4">Support Program Summary</h3>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: getRoiColor(selectedCohort.roi) }}>
                    {selectedCohort.roi}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Return on Investment</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{selectedCohort.dealAmount}</div>
                  <div className="text-xs text-gray-600 mt-1">Support Value</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {selectedCohort.revenueGrowth}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Revenue Growth</div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-[#3e2723] font-bold mb-4">Generate Support Vouchers</h3>
              <div className="flex flex-wrap gap-2">
                {["premium", "legitimacy", "capital", "governance", "compliance"].map((type) => (
                  <button
                    key={type}
                    onClick={() => handleGenerateVoucher(selectedCohort, type)}
                    className="bg-[#a67c52] hover:bg-[#8d6e63] text-white rounded-lg px-4 py-2 text-xs font-semibold cursor-pointer transition-all duration-200 capitalize"
                  >
                    {type} Boost
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                onClick={() => setSelectedCohort(null)}
                className="bg-[#5d4037] hover:bg-[#4a352f] text-white rounded-xl px-6 py-2.5 text-sm font-semibold cursor-pointer transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voucher Generation Modal */}
      {showVoucherModal && (
        <div style={modalOverlayStyle} onClick={() => setShowVoucherModal(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#3e2723] m-0">
                Generate Voucher for {selectedCohort?.smeName}
              </h2>
              <button onClick={() => setShowVoucherModal(false)} className="bg-none border-none cursor-pointer">
                <X size={20} className="text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            {!generatedVoucher ? (
              <>
                <p className="text-sm text-[#5d4037] mb-6">
                  Select the type of voucher you want to generate for this SME:
                </p>

                <div className="grid gap-3 mb-6">
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

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-[#5d4037] mb-3">
                    Number of Seats:
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setVoucherSeats(Math.max(1, voucherSeats - 1))}
                      className="w-10 h-10 rounded-full border-2 border-[#a67c52] bg-white text-lg font-bold hover:bg-[#FAF5EF] cursor-pointer flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="text-xl font-bold text-[#3e2723] min-w-[30px] text-center">
                      {voucherSeats}
                    </span>
                    <button
                      onClick={() => setVoucherSeats(voucherSeats + 1)}
                      className="w-10 h-10 rounded-full border-2 border-[#a67c52] bg-white text-lg font-bold hover:bg-[#FAF5EF] cursor-pointer flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="mb-8">
                  <label className="block text-sm font-semibold text-[#5d4037] mb-3">
                    Voucher Expiration:
                  </label>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-4 flex-wrap">
                      <select
                        value={isTestMode ? "5min" : (expirationDays || 30)}
                        onChange={(e) => handleExpirationChange(e.target.value)}
                        className="px-4 py-2 border-2 border-[#a67c52] rounded-lg bg-white text-sm cursor-pointer focus:outline-none flex-1 min-w-[150px]"
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
                      <div className="text-sm font-medium text-gray-600">
                        {isTestMode 
                          ? `⏰ Expires in 5 minutes at ${new Date(Date.now() + 5 * 60 * 1000).toLocaleTimeString()}`
                          : `📅 Expires on ${new Date(Date.now() + (expirationDays || 30) * 24 * 60 * 60 * 1000).toLocaleDateString()}`
                        }
                      </div>
                    </div>
                    <p className={`text-xs ${isTestMode ? "text-[#ff9800] font-bold animate-pulse" : "text-[#a67c52]"}`}>
                      {isTestMode 
                        ? "⚠️ TEST MODE: Voucher will expire in 5 minutes. Perfect for checking redemption checks!"
                        : "💡 Vouchers expire on this date. After that, redemption is barred."
                      }
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleConfirmVoucher}
                  disabled={!voucherType || savingVoucher}
                  className={`w-full py-4 text-white rounded-xl text-base font-bold transition-all duration-200 cursor-pointer ${(!voucherType || savingVoucher) ? "bg-gray-300 cursor-not-allowed" : "bg-[#a67c52] hover:bg-[#8d6e63]"}`}
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
                  <CheckCircle size={48} className="mx-auto" style={{ color: generatedVoucher.isTestMode ? "#ff9800" : "#4caf50", marginBottom: "16px" }} />
                  <h3 style={{ color: generatedVoucher.isTestMode ? "#e65100" : "#2e7d32", marginBottom: "8px", fontWeight: "700" }}>
                    {generatedVoucher.isTestMode ? "⚠️ TEST Voucher Generated!" : "Voucher Generated Successfully!"}
                  </h3>
                  <p className="text-sm text-[#3e2723] mb-4">
                    {getVoucherTypeName(generatedVoucher.type)} • {generatedVoucher.seats} seat{generatedVoucher.seats > 1 ? 's' : ''}
                  </p>
                  
                  <div className="bg-white border-2 border-dashed border-[#a67c52] rounded-lg p-4 mb-4">
                    <div className="font-mono text-xl font-bold text-[#3e2723] mb-2">
                      {generatedVoucher.code}
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="flex items-center gap-1 mx-auto text-[#a67c52] font-semibold text-sm hover:underline cursor-pointer"
                    >
                      <Copy size={16} />
                      {copied ? "Copied!" : "Copy Code"}
                    </button>
                  </div>

                  <p className={`text-xs font-semibold ${generatedVoucher.isTestMode ? "text-[#e65100]" : "text-gray-500"}`}>
                    Expires: {new Date(generatedVoucher.expiresAt).toLocaleString()}
                  </p>
                </div>

                <div className="bg-[#f0f7ff] border border-[#a67c52] rounded-lg p-4 mb-6">
                  <p className="text-sm text-[#3e2723] font-semibold m-0">
                    📍 Share Instructions:
                  </p>
                  <ul className="text-sm text-[#5d4037] pl-5 mt-2">
                    <li>Share the copyable code above with the SME.</li>
                    <li>SMEs enter the code under subscription options or their purchases view.</li>
                  </ul>
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
                  className="w-full py-4 bg-[#5d4037] hover:bg-[#4a352f] text-white rounded-xl text-base font-bold transition-all duration-200 cursor-pointer"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
