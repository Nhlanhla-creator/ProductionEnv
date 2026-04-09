"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Eye, X, Trophy, Calendar, DollarSign, Users, Package, Award, Building, Ticket, Copy, CheckCircle } from "lucide-react"
import { SupportSMETable } from "./support-sme-table"
import { auth, db } from "../../firebaseConfig"
import { collection, addDoc, getDocs, query, where, doc, updateDoc, getDoc } from "firebase/firestore"

// Successful Support Deals Table Component
const SuccessfulSupportDealsTable = ({ successfulDeals }) => {
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [showVoucherModal, setShowVoucherModal] = useState(false)
  const [voucherType, setVoucherType] = useState("")
  const [voucherSeats, setVoucherSeats] = useState(1)
  const [generatedVoucher, setGeneratedVoucher] = useState(null)
  const [copied, setCopied] = useState(false)
  const [savingVoucher, setSavingVoucher] = useState(false)

  const getStatusColor = (status) => {
    switch (status) {
      case "Active Support": return "#4caf50"
      case "Completed Successfully": return "#2196f3"
      case "Under Review": return "#ff9800"
      default: return "#666"
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-ZA", {
      year: "numeric", month: "short", day: "numeric",
    })
  }

  // Generate voucher code
  const generateVoucherCode = (type) => {
    const prefix = type === "legitimacy" ? "LG" : type === "capital" ? "CA" : type === "governance" ? "GV" : "PR"
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase()
    const seatsPart = voucherSeats.toString().padStart(2, '0')
    return `${prefix}${seatsPart}${randomPart}`
  }

  const handleGenerateVoucher = (deal, type) => {
    console.log("🎫 Generating voucher for deal:", deal)
    setSelectedDeal(deal)  // Set the selected deal first
    setVoucherType(type)
    setShowVoucherModal(true)
    setGeneratedVoucher(null)
    setVoucherSeats(1)
  }

  const handleConfirmVoucher = async () => {
    const user = auth.currentUser
    if (!user) {
      alert("Please log in to generate vouchers")
      return
    }

    if (!selectedDeal) {
      alert("No deal selected. Please try again.")
      console.error("❌ No selected deal found")
      return
    }

    const code = generateVoucherCode(voucherType)
    setSavingVoucher(true)

    try {
      // Get the correct SME user ID - check multiple possible fields
      const smeUserId = selectedDeal?.smeUserId || selectedDeal?.userId || selectedDeal?.uid || selectedDeal?.smeId
      
      console.log("🔍 Generating voucher for SME:", {
        dealId: selectedDeal?.id,
        smeUserId: smeUserId,
        smeName: selectedDeal?.smseName,
        dealData: selectedDeal
      })

      if (!smeUserId) {
        console.error("❌ No SME user ID found in deal:", selectedDeal)
        alert("Error: Cannot find SME user ID. Please contact support.")
        setSavingVoucher(false)
        return
      }

      const voucherData = {
        code: code,
        type: voucherType,
        seats: voucherSeats,
        planName: voucherType === "premium" ? "Premium" : 
                   voucherType === "legitimacy" ? "Legitimacy Boost" : 
                   voucherType === "capital" ? "Capital Appeal Boost" : 
                   voucherType === "governance" ? "Governance Boost" : "Standard",
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
        remainingSeats: voucherSeats,
        redeemedSeats: [],
        voucherCodes: [code],
        createdBy: user.uid,
        createdForSME: selectedDeal?.id || null,
        catalystId: user.uid,
        smeId: smeUserId,
        smeName: selectedDeal?.smseName || null,
        catalystName: user.displayName || user.email || "Catalyst",
        dealId: selectedDeal?.id,
        createdAtTimestamp: Date.now()
      }

      // Save to Firebase
      const vouchersRef = collection(db, "vouchers")
      const docRef = await addDoc(vouchersRef, voucherData)
      
      console.log("✅ Voucher saved to Firebase:", {
        id: docRef.id,
        smeId: voucherData.smeId,
        code: voucherData.code,
        type: voucherData.type
      })
      
      setGeneratedVoucher({
        ...voucherData,
        id: docRef.id
      })
      
      // Show success message
      alert(`✅ Voucher ${code} successfully generated for ${selectedDeal?.smseName}! The SME can now view it in their Successful Deals table.`)
      
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
      default: return "Premium Subscription"
    }
  }

  const modalOverlayStyle = {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(62, 39, 35, 0.85)",
    display: "flex", justifyContent: "center", alignItems: "center",
    zIndex: 1000, animation: "fadeIn 0.3s ease-out", backdropFilter: "blur(4px)",
  }

  const modalContentStyle = {
    backgroundColor: "#ffffff", borderRadius: "20px", padding: "40px",
    maxWidth: "500px", width: "95%", maxHeight: "90vh", overflowY: "auto",
    boxShadow: "0 20px 60px rgba(62, 39, 35, 0.5), 0 0 0 1px rgba(141, 110, 99, 0.1)",
    animation: "slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
  }

  const TruncatedGuarantees = ({ text, maxLines = 2 }) => {
    const [isExpanded, setIsExpanded] = useState(false)
    const textRef = useRef(null)
    const [needsTruncation, setNeedsTruncation] = useState(false)
    useEffect(() => {
      if (textRef.current) {
        const lineHeight = parseInt(getComputedStyle(textRef.current).lineHeight)
        const maxHeight = lineHeight * maxLines
        setNeedsTruncation(textRef.current.scrollHeight > maxHeight)
      }
    }, [text, maxLines])
    if (!text || text === "-" || text === "Not specified" || text === "Various")
      return <span style={{ color: "#999" }}>{text || "-"}</span>
    return (
      <div style={{ lineHeight: "1.4", position: "relative" }}>
        <div ref={textRef} style={{
          wordBreak: "break-word", overflow: "hidden",
          display: "-webkit-box", WebkitLineClamp: isExpanded ? "unset" : maxLines,
          WebkitBoxOrient: "vertical", lineHeight: "1.4em",
          maxHeight: isExpanded ? "none" : `${maxLines * 1.4}em`,
        }}>{text}</div>
        {needsTruncation && (
          <button style={{ background: "none", border: "none", color: "#a67c52", cursor: "pointer", fontSize: "0.75rem", padding: "2px 0 0 0", textDecoration: "underline", display: "block" }}
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded) }}>
            {isExpanded ? "See less" : "See more"}
          </button>
        )}
      </div>
    )
  }

  const TruncatedText = ({ text, maxLength = 40 }) => {
    const [isExpanded, setIsExpanded] = useState(false)
    if (!text || text === "-" || text === "Not specified" || text === "Various")
      return <span style={{ color: "#999" }}>{text || "-"}</span>
    const shouldTruncate = text.length > maxLength
    const displayText = isExpanded || !shouldTruncate ? text : `${text.slice(0, maxLength)}...`
    return (
      <div style={{ lineHeight: "1.4" }}>
        <span style={{ wordBreak: "break-word" }}>{displayText}</span>
        {shouldTruncate && (
          <button style={{ background: "none", border: "none", color: "#a67c52", cursor: "pointer", fontSize: "0.75rem", marginLeft: "4px", textDecoration: "underline", padding: "0" }}
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded) }}>
            {isExpanded ? "Less" : "More"}
          </button>
        )}
      </div>
    )
  }

  const TH = {
    background: "linear-gradient(135deg, #4e2106 0%, #372c27 100%)",
    color: "#FEFCFA", padding: "0.75rem 0.5rem", textAlign: "left",
    fontWeight: "600", fontSize: "0.75rem", letterSpacing: "0.5px",
    textTransform: "uppercase", borderRight: "1px solid #1a0c02",
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  }

  const TD = {
    padding: "0.75rem 0.5rem",
    borderRight: "1px solid #E8D5C4",
    fontSize: "0.8rem",
    verticalAlign: "top",
    color: "#3e2723",
    lineHeight: "1.4",
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  }

  return (
    <>
      {/* Info Banner */}
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
        <Ticket size={24} style={{ color: "#a67c52", flexShrink: 0, marginTop: "2px" }} />
        <div>
          <p style={{ margin: "0 0 8px 0", color: "#3e2723", fontSize: "0.95rem", fontWeight: "600" }}>
            🎟️ Support Your SME's Success with Vouchers!
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
          </ul>
          <p style={{ margin: "12px 0 0 0", color: "#a67c52", fontSize: "0.85rem", fontStyle: "italic" }}>
            💡 SMEs can check "Successful Deals" to see if you've sent them vouchers!
          </p>
        </div>
      </div>

     

<div style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid #E8D5C4", boxShadow: "0 4px 24px rgba(139, 69, 19, 0.08)" }}>
  <table style={{ width: "100%", borderCollapse: "collapse", background: "white", fontSize: "0.875rem", backgroundColor: "#FEFCFA", tableLayout: "fixed" }}>
    <thead>
      <tr>
        {[
          { label: "SMSE Name", w: "12%" },
          { label: "Funding Required", w: "8%" },
          { label: "Equity Offered", w: "7%" },
          { label: "Start Date", w: "8%" },
          { label: "Sector", w: "8%" },
          { label: "Location", w: "8%" },
          { label: "Guarantees", w: "8%" },
          { label: "Services Required", w: "7%" },
          { label: "Status", w: "9%" },
          { label: "Actions", w: "25%", align: "center", noBorderRight: true },
        ].map(({ label, w, align, noBorderRight }) => (
          <th key={label} style={{ ...TH, width: w, textAlign: align || "left", borderRight: noBorderRight ? "none" : "1px solid #1a0c02" }}>
            {label}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {successfulDeals.length === 0 ? (
        <tr>
          <td colSpan="10" style={{ padding: "2rem", textAlign: "center", color: "#666", fontStyle: "italic" }}>
            No successful deals yet. When your matches reach "Support Approved" or "Active Support" status, they will appear here.
          </td>
        </tr>
      ) : (
        successfulDeals.map((deal) => (
          <tr key={deal.id}
            style={{ borderBottom: "1px solid #E8D5C4", transition: "all 0.2s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f5f5f5" }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white" }}
          >
            <td style={TD}>
              <span style={{ color: "#a67c52", fontWeight: "500" }}><TruncatedText text={deal.smseName} maxLength={30} /></span>
            </td>
            <td style={TD}><TruncatedText text={deal.fundingRequired} maxLength={15} /></td>
            <td style={TD}>
              <span style={{ backgroundColor: "#fff3e0", color: "#e65100", padding: "4px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "600" }}>{deal.equityOffered}</span>
            </td>
            <td style={TD}><span style={{ fontSize: "13px" }}>{formatDate(deal.startDate)}</span></td>
            <td style={TD}><TruncatedText text={deal.sector} maxLength={15} /></td>
            <td style={TD}><TruncatedText text={deal.location} maxLength={15} /></td>
            <td style={TD}><TruncatedGuarantees text={deal.guarantees} maxLines={2} /></td>
            <td style={TD}><TruncatedText text={deal.servicesRequired} maxLength={15} /></td>
            <td style={TD}>
              <span style={{ backgroundColor: getStatusColor(deal.currentStatus) + "20", color: getStatusColor(deal.currentStatus), padding: "4px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "600", display: "inline-block" }}>
                {deal.currentStatus}
              </span>
            </td>
            <td style={{ ...TD, borderRight: "none", textAlign: "center" }}>
              <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={() => setSelectedDeal(deal)}
                  style={{ backgroundColor: "#5d4037", color: "white", border: "none", borderRadius: "6px", padding: "6px 10px", fontSize: "11px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Eye size={12} /> View
                </button>
                <button onClick={() => handleGenerateVoucher(deal, "premium")}
                  style={{ backgroundColor: "#a67c52", color: "white", border: "none", borderRadius: "6px", padding: "6px 10px", fontSize: "11px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Ticket size={12} /> Generate Voucher
                </button>
              </div>
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>

      {/* View Details Modal */}
      {selectedDeal && !showVoucherModal && (
        <div style={modalOverlayStyle} onClick={() => setSelectedDeal(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", paddingBottom: "24px", borderBottom: "3px solid #8d6e63" }}>
              <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#3e2723", margin: 0, display: "flex", alignItems: "center", gap: "12px" }}>
                <Building size={28} style={{ color: "#4caf50" }} />
                Support Program Details
              </h2>
              <button onClick={() => setSelectedDeal(null)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#666", padding: "8px" }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ fontSize: "20px", color: "#a67c52", marginBottom: "16px" }}>{selectedDeal.smseName}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                <div><strong>Funding Required:</strong> {selectedDeal.fundingRequired}</div>
                <div><strong>Equity Offered:</strong> {selectedDeal.equityOffered}</div>
                <div><strong>Start Date:</strong> {formatDate(selectedDeal.startDate)}</div>
                <div><strong>Sector:</strong> {selectedDeal.sector}</div>
                <div><strong>Location:</strong> {selectedDeal.location}</div>
                <div><strong>Status:</strong> {selectedDeal.currentStatus}</div>
              </div>
            </div>
            <div style={{ marginBottom: "24px" }}>
              <h4 style={{ fontSize: "16px", color: "#3e2723", marginBottom: "8px" }}>Guarantees</h4>
              <p style={{ color: "#666", lineHeight: "1.6" }}>{selectedDeal.guarantees}</p>
            </div>
            <div style={{ marginBottom: "24px" }}>
              <h4 style={{ fontSize: "16px", color: "#3e2723", marginBottom: "8px" }}>Services Required</h4>
              <p style={{ color: "#666", lineHeight: "1.6" }}>{selectedDeal.servicesRequired}</p>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button onClick={() => { handleGenerateVoucher(selectedDeal, "premium") }}
                style={{ backgroundColor: "#a67c52", color: "white", border: "none", borderRadius: "8px", padding: "12px 24px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
                <Ticket size={16} style={{ marginRight: "8px", display: "inline" }} />
                Generate Voucher
              </button>
              <button onClick={() => setSelectedDeal(null)} style={{ backgroundColor: "#5d4037", color: "white", border: "none", borderRadius: "8px", padding: "12px 24px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#3e2723", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <Ticket size={24} style={{ color: "#a67c52" }} />
                Generate Voucher for {selectedDeal?.smseName}
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
                  backgroundColor: "#e8f5e9",
                  border: "2px solid #4caf50",
                  borderRadius: "12px",
                  padding: "24px",
                  marginBottom: "24px",
                  textAlign: "center",
                }}>
                  <CheckCircle size={48} style={{ color: "#4caf50", marginBottom: "16px" }} />
                  <h3 style={{ color: "#2e7d32", marginBottom: "8px" }}>Voucher Generated Successfully!</h3>
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

                  <p style={{ fontSize: "0.85rem", color: "#666" }}>
                    Expires: {new Date(generatedVoucher.expiresAt).toLocaleDateString()}
                  </p>
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
                </div>

                <button
                  onClick={() => setShowVoucherModal(false)}
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

      <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } } @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.95) } to { opacity: 1; transform: translateY(0) scale(1) } }`}</style>
    </>
  )
}

// ── Main Tabbed Component ─────────────────────────────────────────────────────
// ── Main Tabbed Component ─────────────────────────────────────────────────────
const SupportTabbedTables = ({ filters, stageFilter, loading, onStageOverride }) => {
  const [activeTab, setActiveTab] = useState("my-matches")
  const [successfulDeals, setSuccessfulDeals] = useState([])
  const [smeMatches, setSmeMatches] = useState([])
  // Track whether we've seen data at least once so we don't fire notifications on initial load
  const isFirstLoad = useRef(true)

const extractSuccessfulDeals = (smes) =>
  smes
    .filter((sme) => {
      const status = (sme.currentStatus || sme.pipelineStage || "").toLowerCase()
      // Check for both new and old terminology
      return status === "active" || 
             status === "active support" || 
             status === "support approved"
    })
    .map((sme) => ({
      id: sme.id,
      smeUserId: sme.userId || sme.smeId || sme.uid,
      smseName: sme.name,
      fundingRequired: sme.fundingRequired,
      equityOffered: sme.equityOffered,
      startDate: sme.applicationDate,
      sector: sme.sector,
      location: sme.location,
      guarantees: sme.guarantees,
      servicesRequired: sme.servicesRequired,
      currentStatus: sme.currentStatus || sme.pipelineStage,
    }))

  useEffect(() => {
    if (smeMatches.length > 0) setSuccessfulDeals(extractSuccessfulDeals(smeMatches))
  }, [smeMatches])

  const handleSMEsLoaded = useCallback((smes) => {
    setSmeMatches(smes)

    // Only fire notifications for genuine stage changes — skip the initial table load
    if (isFirstLoad.current) {
      isFirstLoad.current = false
      return
    }
    if (window.catalystNotifications?.checkForChanges) {
      window.catalystNotifications.checkForChanges(smes)
    }
  }, [])

  const tabStyle = (isActive) => ({
    flex: 1, padding: "16px 24px", border: "none",
    backgroundColor: isActive ? "#5d4037" : "transparent",
    color: isActive ? "white" : "#5d4037",
    fontSize: "16px", fontWeight: "600", cursor: "pointer",
    transition: "all 0.3s ease", borderRadius: "12px 12px 0 0",
    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  })

  const badgeStyle = (isActive) => ({
    backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "rgba(93,64,55,0.1)",
    color: isActive ? "white" : "#5d4037",
    borderRadius: "50%", width: "24px", height: "24px",
    fontSize: "12px", fontWeight: "700",
    display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "4px",
  })

  return (
    <div style={{ maxWidth: "100%", margin: "0 auto", padding: "0" }}>
      {/* Tab Navigation */}
      <div style={{ display: "flex", marginBottom: "0", backgroundColor: "#f5f5f5", borderRadius: "12px 12px 0 0", padding: "4px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        {[
          { id: "my-matches", icon: <Users size={18} />, label: "My Matches", count: smeMatches.length },
          { id: "successful-deals", icon: <Trophy size={18} />, label: "Successful Deals", count: successfulDeals.length },
        ].map(({ id, icon, label, count }) => (
          <button key={id}
            onClick={() => setActiveTab(id)}
            style={tabStyle(activeTab === id)}
            onMouseEnter={(e) => { if (activeTab !== id) { e.currentTarget.style.backgroundColor = "#8d6e63"; e.currentTarget.style.color = "white" } }}
            onMouseLeave={(e) => { if (activeTab !== id) { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#5d4037" } }}
          >
            {icon}
            {label}
            <span style={badgeStyle(activeTab === id)}>{count}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ backgroundColor: "white", borderRadius: "0 0 16px 16px", padding: "24px", minHeight: "600px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid #e8e8e8", borderTop: "none" }}>
        {activeTab === "my-matches" && (
          <SupportSMETable
            filters={filters}
            stageFilter={stageFilter}
            onSMEsLoaded={handleSMEsLoaded}
            onStageOverride={onStageOverride}
          />
        )}
        {activeTab === "successful-deals" && (
          <SuccessfulSupportDealsTable successfulDeals={successfulDeals} />
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.95) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
    </div>
  )
}

export default SupportTabbedTables