"use client"

import { useState, useEffect } from "react"
import { Eye, X, Trophy, TrendingUp, Calendar, DollarSign, Package, Building, Award, Ticket, Copy, CheckCircle } from "lucide-react"
import { collection, getDocs, query, where } from "firebase/firestore"
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
      default: return "Premium Subscription"
    }
  }
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
        <div style={{ backgroundColor: "#e8f5e9", border: "2px solid #4caf50", borderRadius: "12px", padding: "24px", marginBottom: "24px", textAlign: "center" }}>
          <CheckCircle size={48} style={{ color: "#4caf50", marginBottom: "16px" }} />
          <h3 style={{ color: "#2e7d32", marginBottom: "8px" }}>Valid Voucher Available!</h3>
          <p style={{ color: "#3e2723", marginBottom: "16px" }}>{getVoucherTypeName(voucher.type)} • {voucher.seats} seat{voucher.seats > 1 ? 's' : ''}</p>
          <div style={{ background: "#fff", border: "2px dashed #a67c52", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
            <div style={{ fontFamily: "'Courier New', monospace", fontSize: "1.2rem", fontWeight: "bold", color: "#3e2723", marginBottom: "8px" }}>{voucher.code}</div>
            <button onClick={() => handleCopyCode(voucher.code)} style={{ background: "none", border: "none", color: "#a67c52", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", margin: "0 auto" }}>
              <Copy size={16} />{copied ? "Copied!" : "Copy Code"}
            </button>
          </div>
          <p style={{ fontSize: "0.85rem", color: "#666" }}>Expires: {new Date(voucher.expiresAt).toLocaleDateString()}</p>
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
    <td colSpan="11" style={{ ...tableCellStyle, textAlign: "center", padding: "2rem", color: "#999", fontStyle: "italic", borderRight: "none" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
        <Trophy size={48} style={{ color: "#ddd" }} />
        <div>
          <p style={{ margin: "0 0 0.5rem 0", fontSize: "1rem", color: "#666" }}>You have not applied for any accelerators, so there are no successful deals available.</p>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#999" }}>You need to apply first to see your successful deals here.</p>
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

  useEffect(() => {
    const fetchCompletedDeals = async () => {
      try {
        const user = auth.currentUser
        if (!user) return

        console.log("🔍 Fetching deals for user:", user.uid)

        const dealsQuery = query(
          collection(db, "smeCatalystApplications"),
          where("smeId", "==", user.uid),
          where("status", "in", ["Support Approved", "Active Support", "Successful Deals", "Graduated Successfully"])
        )

        const snapshot = await getDocs(dealsQuery)
        console.log("📊 Found deals count:", snapshot.size)

        // Fetch all vouchers for this SME
        const vouchersQuery = query(
          collection(db, "vouchers"),
          where("smeId", "==", user.uid),
          where("status", "==", "active")
        )
        const vouchersSnapshot = await getDocs(vouchersQuery)
        
        console.log("🎫 Found vouchers count:", vouchersSnapshot.size)
        
        const vouchersList = []
        vouchersSnapshot.docs.forEach(doc => {
          const voucherData = doc.data()
          if (voucherData.remainingSeats > 0) {
            vouchersList.push({ id: doc.id, ...voucherData })
          }
        })

        const completedDealsArray = []

        for (const docSnap of snapshot.docs) {
          const dealData = docSnap.data()
          
          const catalystQuery = query(collection(db, "catalystProfiles"), where("__name__", "==", dealData.catalystId))
          const catalystSnapshot = await getDocs(catalystQuery)
          
          let catalystDetails = {}
          if (!catalystSnapshot.empty) {
            catalystDetails = catalystSnapshot.docs[0].data()
          }

          const formData = catalystDetails.formData || {}
          const overview = formData.entityOverview || {}
          const matchPrefs = formData.generalMatchingPreference || {}
          const programs = formData?.programmeDetails?.programs || []
          const program = programs[dealData.programIndex || 0] || {}

          const hasVoucher = vouchersList.length > 0
          const voucher = vouchersList[0] || null

          completedDealsArray.push({
            id: docSnap.id,
            acceleratorName: dealData.acceleratorName || overview.registeredName || "Unknown",
            sectorFocus: matchPrefs.sectorFocus || dealData.sector || "-",
            fundingType: program.supportType || matchPrefs.supportFocusSubtype || dealData.fundingType || "-",
            completionDate: dealData.applicationDate || dealData.createdAt?.toDate?.() || new Date(),
            ticketSize: program.budget || `${program.minimumSupport || "0"} - ${program.maximumSupport || "0"}` || dealData.fundingRequired || "-",
            geographicFocus: matchPrefs.geographicFocus || overview.province || dealData.location || "-",
            deadline: formData.applicationBrief?.applicationWindow || "Rolling",
            fundingStage: matchPrefs.programStage || dealData.fundingStage || "-",
            currentStatus: dealData.status || "Active Support",
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
            dealType: program.supportType || dealData.fundingType || "-",
            hasVoucher: hasVoucher,
            voucher: voucher
          })
        }

        setDeals(completedDealsArray)
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
      case "Active Support": return "#4caf50"
      case "Support Approved": return "#2196f3"
      case "Graduated Successfully": return "#ff9800"
      default: return "#666"
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
    if (dateInput?.toDate) date = dateInput.toDate()
    else if (typeof dateInput === 'string') date = new Date(dateInput)
    else if (dateInput instanceof Date) date = dateInput
    else date = new Date()
    return date.toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })
  }

  const handleViewDetails = (deal) => setSelectedDeal(deal)
  const handleViewVoucher = (deal) => {
    if (deal.voucher) {
      setSelectedVoucher(deal.voucher)
      setShowVoucherModal(true)
    }
  }

  if (loading) {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem", color: "#a67c52" }}><p>Loading completed deals...</p></div>
  }

  return (
    <>
      <div style={{ backgroundColor: "#f0f7ff", border: "1px solid #a67c52", borderRadius: "8px", padding: "16px 24px", marginBottom: "24px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <Ticket size={24} style={{ color: "#a67c52", flexShrink: 0, marginTop: "2px" }} />
        <div>
          <p style={{ margin: "0 0 8px 0", color: "#3e2723", fontSize: "0.95rem", fontWeight: "600" }}>🎟️ Check for Vouchers from Your Catalyst!</p>
          <p style={{ margin: 0, color: "#5d4037", fontSize: "0.9rem", lineHeight: "1.5" }}>Your catalyst may send you vouchers to help you continue improving your scores. Look for the <Ticket size={14} style={{ display: "inline", margin: "0 2px" }} /> <strong>"View Voucher"</strong> button in the Actions column.</p>
          <p style={{ margin: "8px 0 0 0", color: "#a67c52", fontSize: "0.85rem", fontStyle: "italic" }}>💡 Vouchers can be redeemed on the Subscription Page for premium access or score boosts!</p>
        </div>
      </div>

      <div style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid #E8D5C4", boxShadow: "0 4px 24px rgba(139, 69, 19, 0.08)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "white", fontSize: "0.8rem", backgroundColor: "#FEFCFA", tableLayout: "fixed", fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}>
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
              <th style={{ ...tableHeaderStyle, borderRight: "none" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deals.length === 0 ? (
              <EmptyTableRow />
            ) : (
              deals.map((deal) => (
                <tr key={deal.id} style={{ borderBottom: "1px solid #E8D5C4", transition: "all 0.2s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f5f5f5"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)" }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none" }}>
                  <td style={tableCellStyle}><span style={{ color: "#a67c52", fontSize: "0.8rem" }}><TruncatedText text={deal.acceleratorName} maxLength={30} /></span></td>
                  <td style={tableCellStyle}><TruncatedText text={deal.sectorFocus} maxLength={20} /></td>
                  <td style={tableCellStyle}><span style={{ color: "#374151", fontSize: "0.8rem" }}>{deal.fundingType}</span></td>
                  <td style={tableCellStyle}><span style={{ fontSize: "0.8rem" }}>{formatDate(deal.completionDate)}</span></td>
                  <td style={tableCellStyle}><TruncatedText text={deal.ticketSize} maxLength={15} /></td>
                  <td style={tableCellStyle}><TruncatedText text={deal.geographicFocus} maxLength={15} /></td>
                  <td style={tableCellStyle}><span style={{ fontSize: "0.8rem" }}>{deal.deadline}</span></td>
                  <td style={tableCellStyle}><span style={{ fontSize: "0.8rem" }}>{deal.fundingStage}</span></td>
                  <td style={tableCellStyle}><span style={{ backgroundColor: getStatusColor(deal.currentStatus) + "20", color: getStatusColor(deal.currentStatus), padding: "4px 8px", borderRadius: "12px", fontSize: "0.7rem", display: "inline-block" }}>{deal.currentStatus}</span></td>
                  <td style={{ ...tableCellStyle, borderRight: "none", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                      <button onClick={() => handleViewDetails(deal)} style={{ backgroundColor: "#5d4037", color: "white", border: "none", borderRadius: "6px", padding: "6px", fontSize: "0.7rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Eye size={12} /></button>
                      {deal.hasVoucher && deal.voucher && (
                        <button onClick={() => handleViewVoucher(deal)} style={{ backgroundColor: "#a67c52", color: "white", border: "none", borderRadius: "6px", padding: "6px", fontSize: "0.7rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="View Voucher"><Ticket size={12} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedDeal && (
        <div style={modalOverlayStyle} onClick={() => setSelectedDeal(null)}>
          <div style={{...modalContentStyle, maxWidth: "900px"}} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", paddingBottom: "24px", borderBottom: "3px solid #8d6e63" }}>
              <h2 style={{ fontSize: "24px", color: "#3e2723", margin: 0, display: "flex", alignItems: "center", gap: "12px" }}><Building size={28} style={{ color: "#4caf50" }} />Accelerator Deal: {selectedDeal.acceleratorName}</h2>
              <button onClick={() => setSelectedDeal(null)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#666", padding: "8px" }}><X size={20} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "24px" }}>
              <div style={{ backgroundColor: "#f8f9fa", padding: "20px", borderRadius: "12px", border: "1px solid #e9ecef" }}>
                <h3 style={{ color: "#3e2723", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "16px" }}><DollarSign size={18} />Deal Financial Details</h3>
                <div style={{ display: "grid", gap: "10px", fontSize: "14px" }}>
                  <div><strong>Funding Amount:</strong> {selectedDeal.dealAmount}</div>
                  <div><strong>Total Value:</strong> {selectedDeal.contractValue}</div>
                  <div><strong>Deal Type:</strong> {selectedDeal.dealType}</div>
                  <div><strong>Equity Taken:</strong> {selectedDeal.equityTaken}</div>
                  <div><strong>Performance Rating:</strong> <span style={{ color: getRatingColor(selectedDeal.performanceRating), marginLeft: "8px", fontWeight: "600" }}>{selectedDeal.performanceRating}</span></div>
                </div>
              </div>
              <div style={{ backgroundColor: "#f8f9fa", padding: "20px", borderRadius: "12px", border: "1px solid #e9ecef" }}>
                <h3 style={{ color: "#3e2723", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "16px" }}><Calendar size={18} />Program Timeline</h3>
                <div style={{ display: "grid", gap: "10px", fontSize: "14px" }}>
                  <div><strong>Start Date:</strong> {formatDate(selectedDeal.completionDate)}</div>
                  <div><strong>Program Duration:</strong> {selectedDeal.dealDuration}</div>
                  <div><strong>Next Milestone:</strong> {selectedDeal.nextMilestone}</div>
                  <div><strong>Graduation Status:</strong> {selectedDeal.graduationStatus}</div>
                  <div><strong>Current Status:</strong> <span style={{ backgroundColor: getStatusColor(selectedDeal.currentStatus) + "20", color: getStatusColor(selectedDeal.currentStatus), padding: "4px 8px", borderRadius: "8px", fontSize: "12px", marginLeft: "8px" }}>{selectedDeal.currentStatus}</span></div>
                </div>
              </div>
              <div style={{ backgroundColor: "#f8f9fa", padding: "20px", borderRadius: "12px", border: "1px solid #e9ecef" }}>
                <h3 style={{ color: "#3e2723", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "16px" }}><Award size={18} />Accelerator Information</h3>
                <div style={{ display: "grid", gap: "10px", fontSize: "14px" }}>
                  <div><strong>Sector:</strong> {selectedDeal.sector}</div>
                  <div><strong>Accelerator Type:</strong> {selectedDeal.acceleratorType}</div>
                  <div><strong>Program Cohort:</strong> {selectedDeal.programCohort}</div>
                  <div><strong>Location:</strong> {selectedDeal.location}</div>
                </div>
              </div>
            </div>
            <div style={{ backgroundColor: "#f8f9fa", padding: "20px", borderRadius: "12px", border: "1px solid #e9ecef", marginBottom: "20px" }}>
              <h3 style={{ color: "#3e2723", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "16px" }}><Package size={18} />Services & Support Delivered</h3>
              <p style={{ fontSize: "14px", color: "#333", lineHeight: "1.5", margin: 0 }}>{selectedDeal.servicesDelivered}</p>
            </div>
            {selectedDeal.hasVoucher && selectedDeal.voucher && (
              <div style={{ backgroundColor: "#e8f5e9", padding: "20px", borderRadius: "12px", border: "2px solid #4caf50", marginBottom: "20px" }}>
                <h3 style={{ color: "#2e7d32", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "16px" }}><Ticket size={18} />Voucher Available from Catalyst!</h3>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ margin: "0 0 4px 0", color: "#3e2723" }}><strong>Type:</strong> {selectedDeal.voucher.type === "legitimacy" ? "Boost Your Legitimacy Score" : selectedDeal.voucher.type === "capital" ? "Boost Capital Appeal Score" : selectedDeal.voucher.type === "governance" ? "Boost Governance Score" : "Premium Subscription"}</p>
                    <p style={{ margin: 0, color: "#3e2723" }}><strong>Seats:</strong> {selectedDeal.voucher.seats}</p>
                  </div>
                  <button onClick={() => { setSelectedVoucher(selectedDeal.voucher); setShowVoucherModal(true) }} style={{ backgroundColor: "#a67c52", color: "white", border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}><Ticket size={16} />View Voucher</button>
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

      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
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
        const dealsQuery = query(collection(db, "smeCatalystApplications"), where("smeId", "==", user.uid), where("status", "in", ["Support Approved", "Active Support", "Successful Deals", "Graduated Successfully"]))
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
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
    </div>
  )
}

export default AcceleratorTabbedTables