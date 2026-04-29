"use client"

import { useState, useEffect } from "react"
import { Eye, X, Trophy, TrendingUp, Calendar, DollarSign, Package, Building, Award, Ticket, Copy, CheckCircle, Clock, Calendar as CalendarIcon, AlertCircle } from "lucide-react"
import { collection, getDocs, query, where, doc, updateDoc, onSnapshot, orderBy } from "firebase/firestore"
import { auth, db } from "../../firebaseConfig"
import { AcceleratorTable } from "./accelator-table"

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
  maxWidth: "500px",
  width: "95%",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 20px 60px rgba(62, 39, 19, 0.5), 0 0 0 1px rgba(141, 110, 99, 0.1)",
  animation: "slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
}

const TruncatedText = ({ text, maxLength = 40 }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  if (!text || text === "-" || text === "Not specified" || text === "Various") {
    return <span style={{ color: "#999", fontSize: "0.8rem" }}>{text || "-"}</span>
  }
  const shouldTruncate = text.length > maxLength
  const displayText = isExpanded || !shouldTruncate ? text : `${text.slice(0, maxLength)}...`
  return (
    <div style={{ lineHeight: "1.4" }}>
      <span style={{ wordBreak: "break-word", fontSize: "0.8rem" }}>{displayText}</span>
      {shouldTruncate && (
        <button
          style={{ background: "none", border: "none", color: "#a67c52", cursor: "pointer", fontSize: "0.7rem", marginLeft: "4px", textDecoration: "underline", padding: "0" }}
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded) }}
        >
          {isExpanded ? "Less" : "More"}
        </button>
      )}
    </div>
  )
}

const VoucherView = ({ voucher, onClose }) => {
  const [copied, setCopied] = useState(false)
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
  const isExpired = voucher.expiresAt ? new Date(voucher.expiresAt) < new Date() : false
  
  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#3e2723", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <Ticket size={24} style={{ color: "#a67c52" }} />
            Your Voucher
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
        </div>
        <div style={{ 
          backgroundColor: isExpired ? "#ffebee" : "#e8f5e9", 
          border: `2px solid ${isExpired ? "#f44336" : "#4caf50"}`, 
          borderRadius: "12px", 
          padding: "24px", 
          marginBottom: "24px", 
          textAlign: "center" 
        }}>
          {isExpired ? (
            <AlertCircle size={48} style={{ color: "#f44336", marginBottom: "16px" }} />
          ) : (
            <CheckCircle size={48} style={{ color: "#4caf50", marginBottom: "16px" }} />
          )}
          <h3 style={{ color: isExpired ? "#c62828" : "#2e7d32", marginBottom: "8px" }}>
            {isExpired ? "Voucher Expired" : "Valid Voucher Available!"}
          </h3>
          <p style={{ color: "#3e2723", marginBottom: "16px" }}>
            {getVoucherTypeName(voucher.type)} • {voucher.seats} seat{voucher.seats > 1 ? 's' : ''}
          </p>
          <div style={{ background: "#fff", border: "2px dashed #a67c52", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
            <div style={{ fontFamily: "'Courier New', monospace", fontSize: "1.2rem", fontWeight: "bold", color: "#3e2723", marginBottom: "8px" }}>{voucher.code}</div>
            <button onClick={() => handleCopyCode(voucher.code)} style={{ background: "none", border: "none", color: "#a67c52", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", margin: "0 auto" }}>
              <Copy size={16} />{copied ? "Copied!" : "Copy Code"}
            </button>
          </div>
          <p style={{ fontSize: "0.85rem", color: isExpired ? "#c62828" : "#666" }}>
            Received: {voucher.receivedAt ? new Date(voucher.receivedAt).toLocaleString() : new Date(voucher.createdAt).toLocaleString()}
          </p>
          <p style={{ fontSize: "0.85rem", color: isExpired ? "#c62828" : "#666", fontWeight: isExpired ? "bold" : "normal" }}>
            Expires: {voucher.expiresAt ? new Date(voucher.expiresAt).toLocaleString() : "Never"}
            {isExpired && " (EXPIRED)"}
          </p>
        </div>
        <div style={{ backgroundColor: "#f0f7ff", border: "1px solid #a67c52", borderRadius: "8px", padding: "16px", marginBottom: "24px" }}>
          <p style={{ margin: 0, color: "#3e2723", fontSize: "0.9rem" }}><strong>📍 How to Redeem:</strong></p>
          <ol style={{ margin: "8px 0 0 0", paddingLeft: "20px", color: "#5d4037" }}>
            <li>Go to the <strong>Subscription Page</strong></li>
            <li>Click "Have a voucher code? Click here to redeem"</li>
            <li>Enter this code to activate your {getVoucherTypeName(voucher.type)}</li>
          </ol>
        </div>
        <button onClick={onClose} style={{ width: "100%", padding: "16px", backgroundColor: "#5d4037", color: "white", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "600", cursor: "pointer" }}>Close</button>
      </div>
    </div>
  )
}

const EmptyTableRow = () => (
  <tr style={{ borderBottom: "1px solid #E8D5C4" }}>
    <td colSpan="12" style={{ ...tableCellStyle, textAlign: "center", padding: "2rem", color: "#999", fontStyle: "italic", borderRight: "none" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
        <Trophy size={48} style={{ color: "#ddd" }} />
        <div>
          <p style={{ margin: "0 0 0.5rem 0", fontSize: "1rem", color: "#666" }}>No successful deals found.</p>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#999" }}>When you have successful deals with catalysts, they will appear here.</p>
        </div>
      </div>
    </td>
  </tr>
)

const SuccessfulAcceleratorDealsTable = () => {
  const [deals, setDeals] = useState([])
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [selectedVoucher, setSelectedVoucher] = useState(null)
  const [showVoucherModal, setShowVoucherModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [allVouchers, setAllVouchers] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser
        if (!user) {
          console.log("No user logged in")
          setLoading(false)
          return
        }

        console.log("🔍 Fetching deals for SME user:", user.uid)

        // FIXED: Include "Exit" status in successful deals
        const dealsQuery = query(
          collection(db, "smeCatalystApplications"),
          where("smeId", "==", user.uid),
          where("status", "in", ["Support Approved", "Active Support", "Active", "Exit", "Successful Deals", "Graduated Successfully"])
        )

        const dealsSnapshot = await getDocs(dealsQuery)
        console.log("📊 Found deals count (including Exit):", dealsSnapshot.size)
        
        // Log each deal for debugging
        dealsSnapshot.docs.forEach((doc, index) => {
          console.log(`Deal ${index + 1}:`, doc.id, doc.data())
        })

        if (dealsSnapshot.empty) {
          console.log("No deals found")
          setDeals([])
          setLoading(false)
          return
        }

        // Query for vouchers
        const vouchersQuery = query(
          collection(db, "vouchers"),
          where("smeId", "==", user.uid),
          orderBy("createdAt", "desc")
        )

        const vouchersSnapshot = await getDocs(vouchersQuery)
        const initialVouchers = []
        vouchersSnapshot.docs.forEach(doc => {
          const voucherData = { id: doc.id, ...doc.data(), receivedAt: doc.data().createdAt }
          initialVouchers.push(voucherData)
        })
        console.log("🎫 Found vouchers count:", initialVouchers.length)

        // Process deals
        const completedDealsArray = []

        for (const docSnap of dealsSnapshot.docs) {
          const dealData = docSnap.data()
          console.log("Processing deal:", docSnap.id, dealData)
          
          // Get catalyst details
          let catalystName = dealData.acceleratorName || "Unknown Catalyst"
          let sector = dealData.sector || "-"
          let fundingType = dealData.fundingType || "-"
          let ticketSize = dealData.fundingRequired || "-"
          let location = dealData.location || "-"
          
          // Try to get catalyst profile if catalystId exists
          if (dealData.catalystId) {
            try {
              const catalystQuery = query(collection(db, "catalystProfiles"), where("__name__", "==", dealData.catalystId))
              const catalystSnapshot = await getDocs(catalystQuery)
              
              if (!catalystSnapshot.empty) {
                const catalystDetails = catalystSnapshot.docs[0].data()
                const formData = catalystDetails.formData || {}
                const overview = formData.entityOverview || {}
                const matchPrefs = formData.generalMatchingPreference || {}
                
                catalystName = dealData.acceleratorName || overview.registeredName || catalystName
                sector = matchPrefs.sectorFocus || sector
                fundingType = matchPrefs.supportFocusSubtype || fundingType
                location = matchPrefs.geographicFocus || overview.province || location
              }
            } catch (err) {
              console.error("Error fetching catalyst:", err)
            }
          }

          // Get vouchers for this deal
          const dealVouchers = initialVouchers.filter(v => 
            v.catalystId === dealData.catalystId || 
            v.createdForSME === docSnap.id ||
            v.cohortId === docSnap.id
          )

          let displayStatus = dealData.status || "Active Support"
          if (displayStatus === "Active") displayStatus = "Active Support"

          completedDealsArray.push({
            id: docSnap.id,
            acceleratorName: catalystName,
            sectorFocus: sector,
            fundingType: fundingType,
            completionDate: dealData.applicationDate || dealData.createdAt?.toDate?.() || new Date(),
            ticketSize: ticketSize,
            geographicFocus: location,
            deadline: "Rolling",
            fundingStage: dealData.fundingStage || "-",
            currentStatus: displayStatus,
            nextMilestone: dealData.nextStage || "N/A",
            servicesDelivered: dealData.servicesRequired || "Standard accelerator services",
            contractValue: dealData.fundingRequired || "-",
            performanceRating: "4.5/5",
            programCohort: `Program ${(dealData.programIndex || 0) + 1}`,
            graduationStatus: dealData.pipelineStage === "Graduated Successfully" ? "Graduated" : "In Progress",
            acceleratorType: "Accelerator",
            equityTaken: dealData.equityOffered || "N/A",
            dealStructure: "12-month program",
            dealDuration: "12 months",
            sector: sector,
            location: location,
            dealAmount: dealData.fundingRequired || "-",
            dealType: dealData.fundingType || "-",
            hasVoucher: dealVouchers.length > 0,
            vouchers: dealVouchers
          })
        }

        console.log("✅ Processed deals:", completedDealsArray.length)
        setDeals(completedDealsArray)
        setAllVouchers(initialVouchers)
        setLoading(false)
        
        // Set up real-time listener for new vouchers
        const unsubscribeVouchers = onSnapshot(vouchersQuery, async (snapshot) => {
          console.log("🔄 Vouchers updated, refreshing deals...")
          const updatedVouchers = []
          snapshot.docs.forEach(doc => {
            const voucherData = { id: doc.id, ...doc.data(), receivedAt: doc.data().createdAt }
            updatedVouchers.push(voucherData)
          })
          
          // Update deals with new vouchers
          setDeals(prevDeals => prevDeals.map(deal => ({
            ...deal,
            hasVoucher: updatedVouchers.some(v => 
              v.catalystId === deal.id.split('_')[1] || 
              v.createdForSME === deal.id
            ),
            vouchers: updatedVouchers.filter(v => 
              v.catalystId === deal.id.split('_')[1] || 
              v.createdForSME === deal.id
            )
          })))
          setAllVouchers(updatedVouchers)
        })

        return () => unsubscribeVouchers()
        
      } catch (error) {
        console.error("Error fetching completed deals:", error)
        setError(error.message)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case "Active Support":
      case "Active":
        return "#4caf50"
      case "Exit":
        return "#9e9e9e"
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
    if (!dateInput) return "Not specified"
    let date
    if (dateInput?.toDate) date = dateInput.toDate()
    else if (typeof dateInput === 'string') date = new Date(dateInput)
    else if (dateInput instanceof Date) date = dateInput
    else date = new Date()
    return date.toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })
  }

  const formatDateTime = (dateInput) => {
    if (!dateInput) return "Not specified"
    let date
    if (dateInput?.toDate) date = dateInput.toDate()
    else if (typeof dateInput === 'string') date = new Date(dateInput)
    else if (dateInput instanceof Date) date = dateInput
    else date = new Date()
    return date.toLocaleString("en-ZA", { 
      year: "numeric", 
      month: "short", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const handleViewDetails = (deal) => setSelectedDeal(deal)
  
  const handleViewVoucher = (voucher) => {
    setSelectedVoucher(voucher);
    setShowVoucherModal(true);
  }

  const getVoucherTypeName = (type) => {
    switch(type) {
      case "legitimacy": return "Legitimacy Boost"
      case "capital": return "Capital Appeal Boost"
      case "governance": return "Governance Boost"
      case "compliance": return "Compliance Boost"
      default: return "Premium Subscription"
    }
  }

  const isVoucherExpired = (expiresAt) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem", color: "#a67c52" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ 
            width: "40px", 
            height: "40px", 
            border: "3px solid #E8D5C4", 
            borderTop: "3px solid #a67c52", 
            borderRadius: "50%", 
            animation: "spin 1s linear infinite", 
            margin: "0 auto 1rem auto" 
          }}></div>
          <p>Loading successful deals...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#f44336" }}>
        <AlertCircle size={48} style={{ marginBottom: "1rem" }} />
        <p>Error loading deals: {error}</p>
        <button onClick={() => window.location.reload()} style={{ marginTop: "1rem", padding: "0.5rem 1rem", backgroundColor: "#a67c52", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Retry</button>
      </div>
    )
  }

  return (
    <>
      <div style={{ backgroundColor: "#f0f7ff", border: "1px solid #a67c52", borderRadius: "8px", padding: "16px 24px", marginBottom: "24px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <Ticket size={24} style={{ color: "#a67c52", flexShrink: 0, marginTop: "2px" }} />
        <div>
          <p style={{ margin: "0 0 8px 0", color: "#3e2723", fontSize: "0.95rem", fontWeight: "600" }}>🎟️ Vouchers from Your Catalyst!</p>
          <p style={{ margin: 0, color: "#5d4037", fontSize: "0.9rem", lineHeight: "1.5" }}>
            You have {deals.length} successful deal{deals.length !== 1 ? 's' : ''} and {allVouchers.length} voucher{allVouchers.length !== 1 ? 's' : ''}.
            Click the <strong>"View Vouchers"</strong> button to see all vouchers for each deal.
          </p>
          <p style={{ margin: "8px 0 0 0", color: "#a67c52", fontSize: "0.85rem", fontStyle: "italic" }}>
            💡 Vouchers can be redeemed on the Subscription Page for premium access or score boosts!
          </p>
        </div>
      </div>

      {deals.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", backgroundColor: "#faf7f2", borderRadius: "12px" }}>
          <Trophy size={64} style={{ color: "#ccc", marginBottom: "1rem" }} />
          <h3 style={{ color: "#5d4037", marginBottom: "0.5rem" }}>No Successful Deals Yet</h3>
          <p style={{ color: "#7d5a50" }}>When you have successful deals with catalysts, they will appear here.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid #E8D5C4", boxShadow: "0 4px 24px rgba(139, 69, 19, 0.08)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "white", fontSize: "0.8rem", backgroundColor: "#FEFCFA", tableLayout: "fixed", fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Catalyst Name</th>
                <th style={tableHeaderStyle}>Sector Focus</th>
                <th style={tableHeaderStyle}>Funding Type</th>
                <th style={tableHeaderStyle}>Completion Date</th>
                <th style={tableHeaderStyle}>Ticket Size</th>
                <th style={tableHeaderStyle}>Location</th>
                <th style={tableHeaderStyle}>Status</th>
                <th style={tableHeaderStyle}>Vouchers</th>
                <th style={{ ...tableHeaderStyle, borderRight: "none" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => (
                <tr key={deal.id} style={{ borderBottom: "1px solid #E8D5C4", transition: "all 0.2s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f5f5f5" }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white" }}>
                  <td style={tableCellStyle}><span style={{ color: "#a67c52", fontSize: "0.8rem", fontWeight: "bold" }}><TruncatedText text={deal.acceleratorName} maxLength={30} /></span></td>
                  <td style={tableCellStyle}><TruncatedText text={deal.sectorFocus} maxLength={20} /></td>
                  <td style={tableCellStyle}><span style={{ color: "#374151", fontSize: "0.8rem" }}>{deal.fundingType}</span></td>
                  <td style={tableCellStyle}><span style={{ fontSize: "0.8rem" }}>{formatDate(deal.completionDate)}</span></td>
                  <td style={tableCellStyle}><TruncatedText text={deal.ticketSize} maxLength={15} /></td>
                  <td style={tableCellStyle}><TruncatedText text={deal.geographicFocus} maxLength={15} /></td>
                  <td style={tableCellStyle}>
                    <span style={{ 
                      backgroundColor: getStatusColor(deal.currentStatus) + "20", 
                      color: getStatusColor(deal.currentStatus), 
                      padding: "4px 8px", 
                      borderRadius: "12px", 
                      fontSize: "0.7rem", 
                      display: "inline-block" 
                    }}>
                      {deal.currentStatus === "Exit" ? "Exited" : deal.currentStatus}
                    </span>
                  </td>
                  <td style={tableCellStyle}>
                    {deal.hasVoucher ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ 
                          backgroundColor: "#4caf50", 
                          color: "white", 
                          padding: "2px 6px", 
                          borderRadius: "10px", 
                          fontSize: "0.65rem",
                          display: "inline-block",
                          width: "fit-content"
                        }}>
                          {deal.vouchers.length} voucher{deal.vouchers.length !== 1 ? 's' : ''}
                        </span>
                        {deal.vouchers.slice(0, 1).map(v => (
                          <div key={v.id} style={{ fontSize: "0.65rem", color: isVoucherExpired(v.expiresAt) ? "#f44336" : "#666" }}>
                            {getVoucherTypeName(v.type)} • {formatDateTime(v.createdAt)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: "#999", fontSize: "0.7rem" }}>No vouchers</span>
                    )}
                  </td>
                  <td style={{ ...tableCellStyle, borderRight: "none", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexDirection: "column" }}>
                      <button onClick={() => handleViewDetails(deal)} 
                        style={{ backgroundColor: "#5d4037", color: "white", border: "none", borderRadius: "6px", padding: "6px", fontSize: "0.7rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                        <Eye size={12} /> Details
                      </button>
                      {deal.hasVoucher && (
                        <button onClick={() => {
                          if (deal.vouchers.length === 1) {
                            handleViewVoucher(deal.vouchers[0])
                          } else {
                            const voucherList = deal.vouchers.map((v, idx) => 
                              `${idx + 1}. ${getVoucherTypeName(v.type)} - Received: ${formatDateTime(v.createdAt)}`
                            ).join('\n')
                            const selectedIndex = prompt(`Select a voucher to view:\n\n${voucherList}\n\nEnter number (1-${deal.vouchers.length}):`)
                            if (selectedIndex && parseInt(selectedIndex) > 0 && parseInt(selectedIndex) <= deal.vouchers.length) {
                              handleViewVoucher(deal.vouchers[parseInt(selectedIndex) - 1])
                            }
                          }
                        }} 
                        style={{ backgroundColor: "#a67c52", color: "white", border: "none", borderRadius: "6px", padding: "6px", fontSize: "0.7rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                          <Ticket size={12} /> View {deal.vouchers.length > 1 ? `(${deal.vouchers.length})` : ''}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedDeal && (
        <div style={modalOverlayStyle} onClick={() => setSelectedDeal(null)}>
          <div style={{...modalContentStyle, maxWidth: "900px"}} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", paddingBottom: "24px", borderBottom: "3px solid #8d6e63" }}>
              <h2 style={{ fontSize: "24px", color: "#3e2723", margin: 0, display: "flex", alignItems: "center", gap: "12px" }}><Building size={28} style={{ color: "#4caf50" }} />Deal Details: {selectedDeal.acceleratorName}</h2>
              <button onClick={() => setSelectedDeal(null)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#666", padding: "8px" }}><X size={20} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "24px" }}>
              <div style={{ backgroundColor: "#f8f9fa", padding: "20px", borderRadius: "12px", border: "1px solid #e9ecef" }}>
                <h3 style={{ color: "#3e2723", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "16px" }}><DollarSign size={18} />Financial Details</h3>
                <div style={{ display: "grid", gap: "10px", fontSize: "14px" }}>
                  <div><strong>Funding Amount:</strong> {selectedDeal.dealAmount}</div>
                  <div><strong>Contract Value:</strong> {selectedDeal.contractValue}</div>
                  <div><strong>Deal Type:</strong> {selectedDeal.dealType}</div>
                  <div><strong>Equity Taken:</strong> {selectedDeal.equityTaken}</div>
                  <div><strong>Performance Rating:</strong> <span style={{ color: getRatingColor(selectedDeal.performanceRating), fontWeight: "600" }}>{selectedDeal.performanceRating}</span></div>
                </div>
              </div>
              <div style={{ backgroundColor: "#f8f9fa", padding: "20px", borderRadius: "12px", border: "1px solid #e9ecef" }}>
                <h3 style={{ color: "#3e2723", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "16px" }}><Calendar size={18} />Timeline</h3>
                <div style={{ display: "grid", gap: "10px", fontSize: "14px" }}>
                  <div><strong>Start Date:</strong> {formatDate(selectedDeal.completionDate)}</div>
                  <div><strong>Program Duration:</strong> {selectedDeal.dealDuration}</div>
                  <div><strong>Next Milestone:</strong> {selectedDeal.nextMilestone}</div>
                  <div><strong>Graduation Status:</strong> {selectedDeal.graduationStatus}</div>
                  <div><strong>Current Status:</strong> <span style={{ backgroundColor: getStatusColor(selectedDeal.currentStatus) + "20", color: getStatusColor(selectedDeal.currentStatus), padding: "4px 8px", borderRadius: "8px", fontSize: "12px", marginLeft: "8px" }}>{selectedDeal.currentStatus === "Exit" ? "Exited" : selectedDeal.currentStatus}</span></div>
                </div>
              </div>
              <div style={{ backgroundColor: "#f8f9fa", padding: "20px", borderRadius: "12px", border: "1px solid #e9ecef" }}>
                <h3 style={{ color: "#3e2723", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "16px" }}><Award size={18} />Information</h3>
                <div style={{ display: "grid", gap: "10px", fontSize: "14px" }}>
                  <div><strong>Sector:</strong> {selectedDeal.sector}</div>
                  <div><strong>Accelerator Type:</strong> {selectedDeal.acceleratorType}</div>
                  <div><strong>Program Cohort:</strong> {selectedDeal.programCohort}</div>
                  <div><strong>Location:</strong> {selectedDeal.location}</div>
                </div>
              </div>
            </div>
            <div style={{ backgroundColor: "#f8f9fa", padding: "20px", borderRadius: "12px", border: "1px solid #e9ecef", marginBottom: "20px" }}>
              <h3 style={{ color: "#3e2723", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "16px" }}><Package size={18} />Services & Support</h3>
              <p style={{ fontSize: "14px", color: "#333", lineHeight: "1.5", margin: 0 }}>{selectedDeal.servicesDelivered}</p>
            </div>
            
            {/* Show ALL vouchers for this deal */}
            {selectedDeal.hasVoucher && selectedDeal.vouchers && selectedDeal.vouchers.length > 0 && (
              <div style={{ backgroundColor: "#e8f5e9", padding: "20px", borderRadius: "12px", border: "2px solid #4caf50", marginBottom: "20px" }}>
                <h3 style={{ color: "#2e7d32", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "16px" }}>
                  <Ticket size={18} /> All Vouchers ({selectedDeal.vouchers.length})
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {selectedDeal.vouchers.map((voucher, idx) => {
                    const expired = isVoucherExpired(voucher.expiresAt)
                    return (
                      <div key={voucher.id} style={{ 
                        backgroundColor: expired ? "#ffebee" : "white", 
                        padding: "12px", 
                        borderRadius: "8px", 
                        border: `1px solid ${expired ? "#f44336" : "#4caf50"}`,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "12px"
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                            <strong style={{ color: "#3e2723" }}>#{idx + 1}</strong>
                            <span style={{ 
                              backgroundColor: expired ? "#f44336" : "#4caf50", 
                              color: "white", 
                              padding: "2px 8px", 
                              borderRadius: "12px", 
                              fontSize: "0.7rem" 
                            }}>
                              {expired ? "EXPIRED" : "ACTIVE"}
                            </span>
                            <span style={{ fontWeight: "600", color: "#a67c52" }}>{getVoucherTypeName(voucher.type)}</span>
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#666", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                            <span><Clock size={12} style={{ display: "inline", marginRight: "4px" }} /> Received: {formatDateTime(voucher.createdAt)}</span>
                            <span><CalendarIcon size={12} style={{ display: "inline", marginRight: "4px" }} /> Expires: {voucher.expiresAt ? formatDateTime(voucher.expiresAt) : "Never"}</span>
                          </div>
                          <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.7rem", color: "#888", marginTop: "4px" }}>
                            Code: {voucher.code}
                          </div>
                        </div>
                        <button 
                          onClick={() => { setSelectedVoucher(voucher); setShowVoucherModal(true) }} 
                          style={{ 
                            backgroundColor: expired ? "#ccc" : "#a67c52", 
                            color: "white", 
                            border: "none", 
                            borderRadius: "6px", 
                            padding: "6px 12px", 
                            fontSize: "0.7rem", 
                            fontWeight: "600", 
                            cursor: expired ? "not-allowed" : "pointer",
                            opacity: expired ? 0.6 : 1
                          }}
                          disabled={expired}
                        >
                          <Ticket size={12} style={{ display: "inline", marginRight: "4px" }} />
                          View Voucher
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setSelectedDeal(null)} style={{ backgroundColor: "#5d4037", color: "white", border: "none", borderRadius: "8px", padding: "12px 24px", fontSize: "14px", cursor: "pointer" }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showVoucherModal && selectedVoucher && <VoucherView voucher={selectedVoucher} onClose={() => setShowVoucherModal(false)} />}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}

const AcceleratorTabbedTables = ({ filters, onApplicationSubmitted }) => {
  const [activeTab, setActiveTab] = useState("my-matches")
  const [myMatchesCount, setMyMatchesCount] = useState(0)
  const [successfulDealsCount, setSuccessfulDealsCount] = useState(0)

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const user = auth.currentUser
        if (!user) return
        const catalystSnapshot = await getDocs(collection(db, "catalystProfiles"))
        setMyMatchesCount(catalystSnapshot.size)
        // FIXED: Include "Exit" status in successful deals count
        const dealsQuery = query(
          collection(db, "smeCatalystApplications"), 
          where("smeId", "==", user.uid), 
          where("status", "in", ["Support Approved", "Active Support", "Active", "Exit", "Successful Deals", "Graduated Successfully"])
        )
        const dealsSnapshot = await getDocs(dealsQuery)
        setSuccessfulDealsCount(dealsSnapshot.size)
      } catch (error) { console.error("Error fetching counts:", error) }
    }
    fetchCounts()
  }, [])

  const tabStyle = (isActive) => ({
    flex: 1, padding: "16px 24px", border: "none", backgroundColor: isActive ? "#5d4037" : "transparent",
    color: isActive ? "white" : "#5d4037", fontSize: "16px", cursor: "pointer", transition: "all 0.3s ease",
    borderRadius: "12px 12px 0 0", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  })

  return (
    <div style={{ maxWidth: "100%", margin: "0 auto", padding: "0" }}>
      <div style={{ display: "flex", marginBottom: "0", backgroundColor: "#f5f5f5", borderRadius: "12px 12px 0 0", padding: "4px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <button onClick={() => setActiveTab("my-matches")} style={tabStyle(activeTab === "my-matches")}>
          <TrendingUp size={18} /> My Matches <span style={{ backgroundColor: activeTab === "my-matches" ? "rgba(255,255,255,0.2)" : "rgba(93,64,55,0.1)", color: activeTab === "my-matches" ? "white" : "#5d4037", borderRadius: "50%", width: "24px", height: "24px", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "4px" }}>{myMatchesCount}</span>
        </button>
        <button onClick={() => setActiveTab("successful-deals")} style={tabStyle(activeTab === "successful-deals")}>
          <Trophy size={18} /> Successful Deals <span style={{ backgroundColor: activeTab === "successful-deals" ? "rgba(255,255,255,0.2)" : "rgba(93,64,55,0.1)", color: activeTab === "successful-deals" ? "white" : "#5d4037", borderRadius: "50%", width: "24px", height: "24px", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "4px" }}>{successfulDealsCount}</span>
        </button>
      </div>
      <div style={{ backgroundColor: "white", borderRadius: "0 0 16px 16px", padding: "24px", minHeight: "600px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid #e8e8e8", borderTop: "none" }}>
        {activeTab === "my-matches" && <div><AcceleratorTable filters={filters} onApplicationSubmitted={onApplicationSubmitted} /></div>}
        {activeTab === "successful-deals" && <SuccessfulAcceleratorDealsTable />}
      </div>
    </div>
  )
}

export default AcceleratorTabbedTables