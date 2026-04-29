"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Eye, X, Trophy, Calendar, DollarSign, Users, Package, Award, Building, Ticket, Copy, CheckCircle } from "lucide-react"
import { SupportSMETable } from "./support-sme-table"
import { auth, db } from "../../firebaseConfig"
import { collection, addDoc, getDocs, query, where, doc, updateDoc, getDoc } from "firebase/firestore"

// Successful Support Deals Table Component
const SuccessfulSupportDealsTable = ({ successfulDeals }) => {
  const [selectedDeal, setSelectedDeal] = useState(null)

  const getStatusColor = (status) => {
    switch (status) {
      case "Active Support":
      case "Active":
        return "#4caf50"
      case "Exit":
        return "#9e9e9e"
      case "Completed Successfully": 
        return "#2196f3"
      case "Under Review": 
        return "#ff9800"
      default: 
        return "#666"
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-ZA", {
      year: "numeric", month: "short", day: "numeric",
    })
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
                  No successful deals yet. When your matches reach "Active", "Active Support", or "Exit" status, they will appear here.
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
                      {deal.currentStatus === "Active" ? "Active Support" : deal.currentStatus}
                    </span>
                  </td>
                  <td style={{ ...TD, borderRight: "none", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" }}>
                      <button onClick={() => setSelectedDeal(deal)}
                        style={{ backgroundColor: "#5d4037", color: "white", border: "none", borderRadius: "6px", padding: "6px 10px", fontSize: "11px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Eye size={12} /> View
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
      {selectedDeal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(62, 39, 35, 0.85)",
          display: "flex", justifyContent: "center", alignItems: "center",
          zIndex: 1000, animation: "fadeIn 0.3s ease-out", backdropFilter: "blur(4px)",
        }} onClick={() => setSelectedDeal(null)}>
          <div style={{
            backgroundColor: "#ffffff", borderRadius: "20px", padding: "40px",
            maxWidth: "500px", width: "95%", maxHeight: "90vh", overflowY: "auto",
            boxShadow: "0 20px 60px rgba(62, 39, 35, 0.5), 0 0 0 1px rgba(141, 110, 99, 0.1)",
            animation: "slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }} onClick={(e) => e.stopPropagation()}>
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
                <div><strong>Status:</strong> {selectedDeal.currentStatus === "Active" ? "Active Support" : selectedDeal.currentStatus}</div>
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
              <button onClick={() => setSelectedDeal(null)} style={{ backgroundColor: "#5d4037", color: "white", border: "none", borderRadius: "8px", padding: "12px 24px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } } @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.95) } to { opacity: 1; transform: translateY(0) scale(1) } }`}</style>
    </>
  )
}

// ── Main Tabbed Component ─────────────────────────────────────────────────────
const SupportTabbedTables = ({ filters, stageFilter, loading, onStageOverride }) => {
  const [activeTab, setActiveTab] = useState("my-matches")
  const [successfulDeals, setSuccessfulDeals] = useState([])
  const [smeMatches, setSmeMatches] = useState([])
  // Track whether we've seen data at least once so we don't fire notifications on initial load
  const isFirstLoad = useRef(true)

  // FIXED: Extract successful deals - include "active", "active support", AND "exit" status
  const extractSuccessfulDeals = (smes) =>
    smes
      .filter((sme) => {
        const status = (sme.currentStatus || sme.pipelineStage || "").toLowerCase()
        // Check for "active", "active support", "support approved", OR "exit"
        return status === "active" || 
               status === "active support" || 
               status === "support approved" ||
               status === "exit"
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