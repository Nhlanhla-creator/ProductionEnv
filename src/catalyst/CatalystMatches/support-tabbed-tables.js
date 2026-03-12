"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Eye, X, Trophy, Calendar, DollarSign, Users, Package, Award, Building } from "lucide-react"
import { SupportSMETable } from "./support-sme-table"

// Successful Support Deals Table Component
const SuccessfulSupportDealsTable = ({ successfulDeals }) => {
  const [selectedDeal, setSelectedDeal] = useState(null)

  const getStatusColor = (status) => {
    switch (status) {
      case "Active Support":        return "#4caf50"
      case "Completed Successfully": return "#2196f3"
      case "Under Review":          return "#ff9800"
      default:                      return "#666"
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-ZA", {
      year: "numeric", month: "short", day: "numeric",
    })
  }

  const modalOverlayStyle = {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(62, 39, 35, 0.85)",
    display: "flex", justifyContent: "center", alignItems: "center",
    zIndex: 1000, animation: "fadeIn 0.3s ease-out", backdropFilter: "blur(4px)",
  }

  const modalContentStyle = {
    backgroundColor: "#ffffff", borderRadius: "20px", padding: "40px",
    maxWidth: "900px", width: "95%", maxHeight: "90vh", overflowY: "auto",
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
  }

  return (
    <>
      <div style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid #E8D5C4", boxShadow: "0 4px 24px rgba(139, 69, 19, 0.08)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "white", fontSize: "0.875rem", backgroundColor: "#FEFCFA", tableLayout: "fixed" }}>
          <thead>
            <tr>
              {[
                { label: "SMSE Name",         w: "12%" },
                { label: "Funding Required",  w: "10%" },
                { label: "Equity Offered",    w: "9%"  },
                { label: "Start Date",        w: "10%" },
                { label: "Sector",            w: "9%"  },
                { label: "Location",          w: "10%" },
                { label: "Guarantees",        w: "8%"  },
                { label: "Services Required", w: "7%"  },
                { label: "Status",            w: "11%" },
                { label: "Action",            w: "14%", align: "center", noBorderRight: true },
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
                  <td style={{ padding: "0.75rem 0.5rem", borderRight: "1px solid #E8D5C4", verticalAlign: "top" }}>
                    <span style={{ color: "#a67c52", fontWeight: "500" }}><TruncatedText text={deal.smseName} maxLength={30} /></span>
                  </td>
                  <td style={{ padding: "0.75rem 0.5rem", borderRight: "1px solid #E8D5C4", verticalAlign: "top" }}><TruncatedText text={deal.fundingRequired} maxLength={20} /></td>
                  <td style={{ padding: "0.75rem 0.5rem", borderRight: "1px solid #E8D5C4", verticalAlign: "top" }}>
                    <span style={{ backgroundColor: "#fff3e0", color: "#e65100", padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" }}>{deal.equityOffered}</span>
                  </td>
                  <td style={{ padding: "0.75rem 0.5rem", borderRight: "1px solid #E8D5C4", verticalAlign: "top", fontSize: "14px" }}>{new Date(deal.startDate).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })}</td>
                  <td style={{ padding: "0.75rem 0.5rem", borderRight: "1px solid #E8D5C4", verticalAlign: "top" }}><TruncatedText text={deal.sector} maxLength={20} /></td>
                  <td style={{ padding: "0.75rem 0.5rem", borderRight: "1px solid #E8D5C4", verticalAlign: "top" }}><TruncatedText text={deal.location} maxLength={15} /></td>
                  <td style={{ padding: "0.75rem 0.5rem", borderRight: "1px solid #E8D5C4", verticalAlign: "top" }}><TruncatedGuarantees text={deal.guarantees} maxLines={2} /></td>
                  <td style={{ padding: "0.75rem 0.5rem", borderRight: "1px solid #E8D5C4", verticalAlign: "top", textAlign: "center" }}><TruncatedText text={deal.servicesRequired} maxLength={20} /></td>
                  <td style={{ padding: "0.75rem 0.5rem", borderRight: "1px solid #E8D5C4", verticalAlign: "top" }}>
                    <span style={{ backgroundColor: getStatusColor(deal.currentStatus) + "20", color: getStatusColor(deal.currentStatus), padding: "6px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600", display: "inline-block" }}>
                      {deal.currentStatus}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 0.5rem", verticalAlign: "top", textAlign: "center" }}>
                    <button onClick={() => setSelectedDeal(deal)}
                      style={{ backgroundColor: "#5d4037", color: "white", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", margin: "0 auto" }}>
                      <Eye size={14} /> View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedDeal && (
        <div style={modalOverlayStyle} onClick={() => setSelectedDeal(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", paddingBottom: "24px", borderBottom: "3px solid #8d6e63" }}>
              <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#3e2723", margin: 0, display: "flex", alignItems: "center", gap: "12px" }}>
                <Building size={32} style={{ color: "#4caf50" }} />
                Support Program Details: {selectedDeal.smseName}
              </h2>
              <button onClick={() => setSelectedDeal(null)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#666", padding: "8px" }}>
                <X size={24} />
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", marginBottom: "32px" }}>
              {[
                { icon: <DollarSign size={20} />, title: "Program Financial Details", rows: [["Funding Required", selectedDeal.fundingRequired], ["Equity Offered", selectedDeal.equityOffered], ["Guarantees", selectedDeal.guarantees], ["Services Required", selectedDeal.servicesRequired]] },
                { icon: <Calendar size={20} />, title: "Program Timeline", rows: [["Start Date", formatDate(selectedDeal.startDate)], ["Current Status", <span style={{ backgroundColor: getStatusColor(selectedDeal.currentStatus) + "20", color: getStatusColor(selectedDeal.currentStatus), padding: "4px 8px", borderRadius: "8px", fontSize: "12px", fontWeight: "600", marginLeft: "8px" }}>{selectedDeal.currentStatus}</span>]] },
                { icon: <Award size={20} />, title: "SMSE Information", rows: [["Sector", selectedDeal.sector], ["Location", selectedDeal.location]] },
              ].map(({ icon, title, rows }) => (
                <div key={title} style={{ backgroundColor: "#f8f9fa", padding: "24px", borderRadius: "12px", border: "1px solid #e9ecef" }}>
                  <h3 style={{ color: "#3e2723", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>{icon}{title}</h3>
                  <div style={{ display: "grid", gap: "12px" }}>
                    {rows.map(([k, v]) => <div key={k}><strong>{k}:</strong> {v}</div>)}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ backgroundColor: "#f8f9fa", padding: "24px", borderRadius: "12px", border: "1px solid #e9ecef", marginBottom: "24px" }}>
              <h3 style={{ color: "#3e2723", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}><Package size={20} />Support Services Required</h3>
              <p style={{ fontSize: "16px", color: "#333", lineHeight: "1.6", margin: 0 }}>{selectedDeal.servicesRequired}</p>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setSelectedDeal(null)} style={{ backgroundColor: "#5d4037", color: "white", border: "none", borderRadius: "12px", padding: "16px 32px", fontSize: "16px", fontWeight: "600", cursor: "pointer" }}>Close</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } } @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.95) } to { opacity: 1; transform: translateY(0) scale(1) } }`}</style>
    </>
  )
}

// ── Main Tabbed Component ─────────────────────────────────────────────────────
const SupportTabbedTables = ({ filters, stageFilter, loading }) => {
  const [activeTab, setActiveTab]       = useState("my-matches")
  const [successfulDeals, setSuccessfulDeals] = useState([])
  const [smeMatches, setSmeMatches]     = useState([])
  // Track whether we've seen data at least once so we don't fire notifications on initial load
  const isFirstLoad = useRef(true)

  const extractSuccessfulDeals = (smes) =>
    smes
      .filter((sme) =>
        ["support approved", "active support"].includes((sme.currentStatus || "").toLowerCase()) ||
        ["support approved", "active support"].includes((sme.pipelineStage || "").toLowerCase())
      )
      .map((sme) => ({
        id:               sme.id,
        smseName:         sme.name,
        fundingRequired:  sme.fundingRequired,
        equityOffered:    sme.equityOffered,
        startDate:        sme.applicationDate,
        sector:           sme.sector,
        location:         sme.location,
        guarantees:       sme.guarantees,
        servicesRequired: sme.servicesRequired,
        currentStatus:    sme.currentStatus || sme.pipelineStage,
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
          { id: "my-matches",       icon: <Users size={18} />,  label: "My Matches",      count: smeMatches.length },
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
          <SupportSMETable filters={filters} stageFilter={stageFilter} onSMEsLoaded={handleSMEsLoaded} />
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