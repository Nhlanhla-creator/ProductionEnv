"use client"

import { useMemo, useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { Eye, MessageSquare, Users, Award, MapPin, Percent, Info, Brain, Settings2, Loader2, CheckCircle, AlertCircle, DollarSign } from "lucide-react"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "../../firebaseConfig"
import FunderDetailsModal from "./FunderDetailsModal"

// ── Reusable breakdown card ──
const BreakdownCard = ({ itemKey, item, devMode }) => {
  const labels = {
    // Secondary matching keys
    sectorMatch: "Economic Sector Match",
    stageMatch: "Funding Stage Fit",
    ticketMatch: "Ticket Size Fit",
    instrumentMatch: "Funding Instrument Fit",
    locationMatch: "Location Alignment",
    supportMatch: "Support Alignment",
    // Fallback / legacy keys
    fundingAlignment: "Funding Alignment",
    amountFit: "Amount Fit",
    sectorFit: "Sector Fit",
    locationPreference: "Location Preference",
  };

  const label = labels[itemKey] || itemKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  const score = item.score || 0;
  const color = score >= 75 ? "#388E3C" : score >= 50 ? "#F57C00" : "#D32F2F";

  return (
    <div
      style={{
        background: "#FEFCFA",
        border: "1px solid #E8D5C4",
        borderRadius: 8,
        padding: "1.25rem",
        borderLeft: `4px solid ${color}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
        <h4 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#5D2A0A", margin: 0, flex: 1, lineHeight: 1.3 }}>
          {label}{devMode ? ` (Weight: ${Math.round((item.weight || 0) * 100)}%)` : ""}
        </h4>
        <span style={{ fontSize: "1.25rem", fontWeight: "bold", color, marginLeft: "1rem" }}>
          {Math.round(score)}%
        </span>
      </div>
      <div style={{ background: "#E8D5C4", borderRadius: 4, height: 8, overflow: "hidden", marginBottom: "0.5rem" }}>
        <div style={{ height: "100%", background: color, width: `${score}%`, transition: "width 0.3s ease" }} />
      </div>
      <div style={{ fontSize: "0.75rem", color: "#8D6E63" }}>
        {item.reasoning && <div>{item.reasoning}</div>}
      </div>
    </div>
  );
};

// ── Status display helpers ──
const STATUS_CONFIG = {
  matched: { label: "Matched", color: "#F57C00", bg: "rgba(245,124,0,0.12)" },
  contacted: { label: "Contacted", color: "#388E3C", bg: "rgba(56,142,60,0.12)" },
  evaluation: { label: "Evaluation", color: "#1976D2", bg: "rgba(25,118,210,0.12)" },
  negotiation: { label: "Negotiation", color: "#7B1FA2", bg: "rgba(123,31,162,0.12)" },
  termIssued: { label: "Term Issued", color: "#00838F", bg: "rgba(0,131,143,0.12)" },
  "Term Issued": { label: "Term Issued", color: "#00838F", bg: "rgba(0,131,143,0.12)" },
  dealClosed: { label: "Deal Closed", color: "#2E7D32", bg: "rgba(46,125,50,0.12)" },
  "Deal Closed": { label: "Deal Closed", color: "#2E7D32", bg: "rgba(46,125,50,0.12)" },
  "Deal Successful": { label: "Deal Closed", color: "#2E7D32", bg: "rgba(46,125,50,0.12)" },
  withdrawn: { label: "Withdrawn", color: "#757575", bg: "rgba(117,117,117,0.12)" },
  declined: { label: "Declined", color: "#D32F2F", bg: "rgba(211,47,47,0.12)" },
  Declined: { label: "Declined", color: "#D32F2F", bg: "rgba(211,47,47,0.12)" },
}

const getStatusDisplay = (status) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.matched
  return config
}

const FundingMatchesTable = ({
  funders: externalFunders = [],
  applicationId,
  loading: externalLoading = false,
  emptyMessage = "No matching funders for this application yet.",
  onContact,
  onView,
  dense = false,
  embedded = false,
}) => {
  const [fetchedFunders, setFetchedFunders] = useState([])
  const [fetchLoading, setFetchLoading] = useState(applicationId ? true : false)
  const [modalFunder, setModalFunder] = useState(null)
  const [breakdownFunder, setBreakdownFunder] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [devMode, setDevMode] = useState(false)
  const [contactingId, setContactingId] = useState(null)
  const [filterHighMatches, setFilterHighMatches] = useState(true)

  useEffect(() => { setMounted(true) }, [])

  // Fetch from smseFundingMatches if applicationId is provided
  useEffect(() => {
    if (!applicationId) {
      setFetchedFunders([])
      setFetchLoading(false)
      return
    }

    const q = query(
      collection(db, "smseFundingMatches"),
      where("applicationId", "==", applicationId)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setFetchedFunders(data)
        setFetchLoading(false)
      },
      (err) => {
        console.error("Error fetching funding matches:", err)
        setFetchLoading(false)
      }
    )

    return () => unsubscribe()
  }, [applicationId])

  // Secret: Ctrl+Alt+P while breakdown modal is open toggles verbose dev labels
  useEffect(() => {
    if (!breakdownFunder) { setDevMode(false); return }
    const handler = (e) => {
      if (e.ctrlKey && e.altKey && e.key === "p") {
        e.preventDefault()
        setDevMode((v) => !v)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [breakdownFunder])

  // Filter to only show matches with finalScore >= 50
  const funders = applicationId ? fetchedFunders : externalFunders
  const loading = applicationId ? fetchLoading : externalLoading
  const denseMode = dense || embedded

  const rows = useMemo(() => {
    const allRows = funders || []
    return allRows.filter((funder) => {
      const score = funder.finalScore || 0
      if (filterHighMatches) {
        return score >= 70
      }
      return score > 0
    })
  }, [funders, filterHighMatches])

  const handleView = (funder) => {
    if (onView) {
      onView(funder)
      return
    }
    setModalFunder(funder)
  }

  const handleContact = async (funder) => {
    if (!onContact || funder.status === "contacted") return
    setContactingId(funder.id)
    try {
      await onContact(funder)
    } catch (err) {
      // Contact failed; user can retry
    } finally {
      setContactingId(null)
    }
  }

  const funderName = (f) =>
    f.profile?.name ||
    f.funderName ||
    f.name ||
    "Unnamed Funder"

  const funderLocation = (f) =>
    f.profile?.location || f.location || "Not specified"

  const funderType = (f) =>
    f.profile?.funderType || f.funderType || "Not specified"

  const scoreColor = (pct) => {
    if (pct >= 75) return "#2E7D32"
    if (pct >= 50) return "#F57C00"
    return "#D32F2F"
  }

  const scoreLabel = (pct) => {
    if (pct >= 90) return "Perfect"
    if (pct >= 75) return "Strong"
    if (pct >= 50) return "Potential"
    if (pct >= 25) return "Low"
    return "New Lead"
  }

  const pad = denseMode ? "8px 10px" : "12px 14px"
  const fontSz = denseMode ? "12px" : "13px"

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          marginBottom: "12px",
          gap: "10px",
          fontFamily: "'Outfit', 'Inter', sans-serif",
        }}
      >
        <span style={{ fontSize: "12px", fontWeight: "600", color: "#8D6E63", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Filter Matches:
        </span>
        <div
          style={{
            display: "inline-flex",
            background: "#efebe9",
            padding: "3px",
            borderRadius: "20px",
            border: "1px solid #d7ccc8",
          }}
        >
          <button
            onClick={() => setFilterHighMatches(false)}
            style={{
              padding: "4px 12px",
              borderRadius: "15px",
              border: "none",
              fontSize: "11px",
              fontWeight: "700",
              cursor: "pointer",
              background: !filterHighMatches ? "#5d4037" : "transparent",
              color: !filterHighMatches ? "#fff" : "#8d6e63",
              transition: "all 0.2s ease",
            }}
          >
            All Matches
          </button>
          <button
            onClick={() => setFilterHighMatches(true)}
            style={{
              padding: "4px 12px",
              borderRadius: "15px",
              border: "none",
              fontSize: "11px",
              fontWeight: "700",
              cursor: "pointer",
              background: filterHighMatches ? "#5d4037" : "transparent",
              color: filterHighMatches ? "#fff" : "#8d6e63",
              transition: "all 0.2s ease",
            }}
          >
            Best Matches
          </button>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div
        style={{
          width: "100%",
          overflowX: "auto",
          borderRadius: "12px",
          border: "1px solid #E8D5C4",
          background: "#fff",
          boxShadow: "0 2px 8px rgba(93, 64, 55, 0.08)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
            minWidth: 820,
            tableLayout: "fixed",
          }}
        >
          <colgroup>
            <col style={{ width: "22%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "18%" }} />
          </colgroup>
          <thead>
            <tr style={{ backgroundColor: "#5d4037" }}>
              {[
                { label: "Funder", Icon: Users },
                { label: "Type", Icon: null },
                { label: "Match", Icon: Percent },
                { label: "Rating", Icon: Award },
                { label: "Location", Icon: MapPin },
                { label: "Status", Icon: null },
                { label: "Actions", Icon: null, align: "center" },
              ].map(({ label, Icon, align }) => (
                <th
                  key={label}
                  style={{
                    padding: pad,
                    color: "white",
                    backgroundColor: "#5d4037",
                    textAlign: align || "left",
                    fontWeight: 600,
                    fontSize: denseMode ? "11px" : "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    {Icon ? <Icon size={13} /> : null}
                    {label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} style={{ padding: "28px", textAlign: "center", color: "#8D6E63" }}>
                  Loading matches…
                </td>
              </tr>
            )}

            {!loading && rows.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: "28px",
                    textAlign: "center",
                    color: "#8D6E63",
                    fontStyle: "italic",
                    fontSize: fontSz,
                  }}
                >
                  {funders?.length > 0
                    ? `Found ${funders.length} potential funder(s) but none met the 50% match threshold. Try adjusting your application.`
                    : emptyMessage}
                </td>
              </tr>
            )}

            {!loading &&
              rows.map((f, idx) => {
                const pct = f.finalScore || 0
                const statusInfo = getStatusDisplay(f.status)
                return (
                  <tr
                    key={f.id}
                    style={{
                      borderBottom: idx < rows.length - 1 ? "1px solid #F0E6DA" : "none",
                      transition: "background-color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAF7F3")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ padding: pad, fontSize: fontSz, color: "#4A352F", fontWeight: 600 }}>
                      <div
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={funderName(f)}
                      >
                        {funderName(f)}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                        {f.hasPrimaryAnalysis && (
                          <span style={{ fontSize: "10px", color: "#388E3C", fontWeight: 500 }}>
                            Primary {Math.round(f.primaryScore)}%
                          </span>
                        )}
                        {f.secondaryScore != null && (
                          <span style={{ fontSize: "10px", color: "#8D6E63", fontWeight: 500 }}>
                            Prefs {Math.round(f.secondaryScore)}%
                          </span>
                        )}
                        {!f.hasPrimaryAnalysis && (
                          <span style={{ fontSize: "10px", color: "#bbb", fontStyle: "italic" }}>
                            Pending
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: pad, fontSize: fontSz, color: "#5D4037" }}>
                      <span
                        style={{
                          display: "inline-block",
                          maxWidth: "100%",
                          padding: "3px 9px",
                          background: "rgba(166,124,82,0.12)",
                          borderRadius: 12,
                          fontSize: "11px",
                          fontWeight: 500,
                          color: "#7D5A50",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={funderType(f)}
                      >
                        {funderType(f)}
                      </span>
                    </td>

                    <td
                      style={{ padding: pad, cursor: "pointer" }}
                      onClick={(e) => { e.stopPropagation(); setBreakdownFunder(f) }}
                      title="Click to view match breakdown"
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: scoreColor(pct),
                            fontSize: fontSz,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {pct}%
                          <Info size={11} style={{ opacity: 0.5 }} />
                        </span>
                        <span style={{ fontSize: "10px", color: "#8D6E63" }}>
                          {scoreLabel(pct)}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: pad, fontSize: fontSz, color: "#5D4037" }}>
                      {f.profile?.rating ? `${f.profile.rating} / 5` : "N/A"}
                    </td>

                    <td
                      style={{
                        padding: pad,
                        fontSize: fontSz,
                        color: "#5D4037",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={funderLocation(f)}
                    >
                      {funderLocation(f)}
                    </td>

                    {/* Status column — reactive to Firestore status changes */}
                    <td style={{ padding: pad }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 10px",
                          borderRadius: 12,
                          fontSize: "11px",
                          fontWeight: 600,
                          background: statusInfo.bg,
                          color: statusInfo.color,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {statusInfo.label}
                      </span>
                    </td>

                    <td style={{ padding: pad }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                        <button
                          onClick={() => handleView(f)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: denseMode ? "6px 9px" : "7px 11px",
                            background: "rgba(250,247,242,0.95)",
                            color: "#4A352F",
                            border: "1px solid rgba(200,182,166,0.5)",
                            borderRadius: 6,
                            fontSize: "12px",
                            fontWeight: 500,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            transition: "transform 0.15s, box-shadow 0.15s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
                          title={`View details for ${funderName(f)}`}
                        >
                          <Eye size={12} />
                        </button>
                        {onContact && (() => {
                          const isContacted = f.status === "contacted"
                          const isThisContacting = contactingId === f.id

                          // Already contacted — show permanent green state
                          if (isContacted) {
                            return (
                              <button
                                disabled
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  padding: denseMode ? "6px 9px" : "7px 11px",
                                  background: "linear-gradient(135deg,#388E3C,#2E7D32)",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: 6,
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  cursor: "default",
                                  whiteSpace: "nowrap",
                                  boxShadow: "0 2px 6px rgba(56,142,60,0.3)",
                                }}
                                title={`Contacted ${funderName(f)}`}
                              >
                                <CheckCircle size={12} />
                                Contacted
                              </button>
                            )
                          }

                          // Loading
                          if (isThisContacting) {
                            return (
                              <button
                                disabled
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  padding: denseMode ? "6px 9px" : "7px 11px",
                                  background: "linear-gradient(135deg,#a67c52,#7d5a50)",
                                  color: "#FAF7F2",
                                  border: "none",
                                  borderRadius: 6,
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  cursor: "not-allowed",
                                  whiteSpace: "nowrap",
                                  boxShadow: "0 2px 6px rgba(166,124,82,0.3)",
                                }}
                              >
                                <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                              </button>
                            )
                          }

                          // Idle — contact button
                          return (
                            <button
                              onClick={() => handleContact(f)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                padding: denseMode ? "6px 9px" : "7px 11px",
                                background: "linear-gradient(135deg,#a67c52,#7d5a50)",
                                color: "#FAF7F2",
                                border: "none",
                                borderRadius: 6,
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                boxShadow: "0 2px 6px rgba(166,124,82,0.3)",
                                transition: "transform 0.15s, box-shadow 0.15s",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                              onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
                              title={`Contact ${funderName(f)}`}
                            >
                              <MessageSquare size={12} />
                            </button>
                          )
                        })()}
                      </div>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      <FunderDetailsModal
        funder={modalFunder}
        isOpen={!!modalFunder}
        onClose={() => setModalFunder(null)}
      />

      {/* Match Breakdown Modal */}
      {mounted && breakdownFunder && createPortal(
        <div
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setBreakdownFunder(null)}
        >
          <div
            style={{
              background: "white", borderRadius: 12, maxWidth: 850, width: "95%",
              maxHeight: "90vh", overflowY: "auto",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: "1.5rem 2rem", borderBottom: "2px solid #E8D5C4", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#5D2A0A", display: "flex", alignItems: "center", gap: 8 }}>
                Match Breakdown — {funderName(breakdownFunder)}
                {devMode && (
                  <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "#a67c52", background: "rgba(166,124,82,0.12)", border: "1px solid rgba(166,124,82,0.3)", borderRadius: 4, padding: "2px 6px", letterSpacing: "0.5px" }}>DEV</span>
                )}
              </h3>
              <button
                onClick={() => setBreakdownFunder(null)}
                style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "#8D6E63" }}
              >
                ✖
              </button>
            </div>

            <div style={{ padding: "1.5rem 2rem" }}>
              {/* Overall score */}
              <div style={{ textAlign: "center", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "2px solid #E8D5C4" }}>
                <div style={{
                  fontSize: "3rem", fontWeight: "bold", marginBottom: "0.5rem",
                  color: scoreColor(breakdownFunder.finalScore || 0),
                }}>
                  {breakdownFunder.finalScore || 0}%
                </div>
                <p style={{ fontSize: "1rem", color: "#8D6E63", margin: 0 }}>Overall Match Score</p>
                <p style={{ fontSize: "0.8rem", color: "#bbb", margin: "4px 0 0" }}>
                  {breakdownFunder.hasPrimaryAnalysis
                    ? "60% Primary + 40% Preferences"
                    : "Preferences only — run Primary Matching for full analysis"}
                </p>
              </div>

              {/* PRIMARY: AI Analysis (60%) */}
              <div style={{ marginBottom: "2rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
                  <Brain size={18} style={{ color: "#5D2A0A" }} />
                  <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#5D2A0A" }}>
                    Primary Matching
                    {devMode && <span style={{ fontWeight: 400, fontSize: "0.85rem", color: "#8D6E63" }}> (60% weight)</span>}
                  </h4>
                </div>

                {breakdownFunder.primaryBreakdown ? (
                  <div style={{ background: "#FEFCFA", border: "1px solid #E8D5C4", borderRadius: 8, padding: "1.25rem", borderLeft: `4px solid ${scoreColor(breakdownFunder.primaryScore || 0)}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                      <span style={{ fontWeight: 600, color: "#5D2A0A" }}>AI Semantic Score</span>
                      <span style={{ fontSize: "1.5rem", fontWeight: "bold", color: scoreColor(breakdownFunder.primaryScore || 0) }}>
                        {Math.round(breakdownFunder.primaryScore || 0)}%
                      </span>
                    </div>
                    <div style={{ background: "#E8D5C4", borderRadius: 4, height: 8, overflow: "hidden", marginBottom: "0.75rem" }}>
                      <div style={{ height: "100%", background: scoreColor(breakdownFunder.primaryScore || 0), width: `${breakdownFunder.primaryScore || 0}%`, transition: "width 0.3s" }} />
                    </div>
                    {breakdownFunder.primaryReasoning && (
                      <div style={{ fontSize: "0.8rem", color: "#5D4037", marginBottom: "0.5rem" }}>
                        <strong>Reasoning:</strong> {breakdownFunder.primaryReasoning}
                      </div>
                    )}

                    {/* Display matched capabilities */}
                    {(() => {
                      const matchedCaps = breakdownFunder.matchedCapabilities || breakdownFunder.primaryBreakdown?.capabilities || [];
                      if (matchedCaps.length === 0) return null;
                      return (
                        <div style={{ fontSize: "0.8rem", color: "#5D4037", marginTop: "0.5rem" }}>
                          <strong>Matched Capabilities:</strong>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                            {matchedCaps.map((cap, i) => (
                              <span key={i} style={{ padding: "2px 8px", background: "rgba(56,142,60,0.1)", borderRadius: 10, fontSize: "0.75rem", color: "#388E3C" }}>
                                {cap}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Individual AI breakdown items */}
                    <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
                      {Object.entries(breakdownFunder.primaryBreakdown).map(([key, item], i) => {
                        if (!item || typeof item !== "object" || !("score" in item)) return null;

                        const labels = {
                          sectorAlignment: "Sector Alignment",
                          stageAlignment: "Stage Alignment",
                          missionFit: "Mission Fit",
                          impactAlignment: "Impact Alignment",
                          overallNarrativeFit: "Overall Narrative Fit"
                        };

                        const label = labels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

                        return (
                          <div key={i} style={{ background: "#FEFCFA", border: "1px solid #E8D5C4", borderRadius: 6, padding: "0.75rem" }}>
                            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#5D2A0A" }}>{label}</div>
                            <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: scoreColor(item.score) }}>
                              {Math.round(item.score)}%
                            </div>
                            <div style={{ fontSize: "0.7rem", color: "#8D6E63" }}>{item.reasoning}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ background: "#f9f5f0", border: "1px dashed #E8D5C4", borderRadius: 8, padding: "1.25rem", textAlign: "center", color: "#8D6E63" }}>
                    <Brain size={24} style={{ opacity: 0.3, marginBottom: 6 }} />
                    <p style={{ margin: 0, fontSize: "0.85rem" }}>Primary analysis pending.</p>
                    <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#bbb" }}>Run AI Analysis on the Funding Matches page.</p>
                  </div>
                )}
              </div>

              {/* SECONDARY: Preferences (40%) */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
                  <Settings2 size={18} style={{ color: "#5D2A0A" }} />
                  <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#5D2A0A" }}>
                    Secondary Matching
                    {devMode && <span style={{ fontWeight: 400, fontSize: "0.85rem", color: "#8D6E63" }}> (40% weight)</span>}
                  </h4>
                  <span style={{ marginLeft: "auto", fontSize: "1.25rem", fontWeight: "bold", color: scoreColor(breakdownFunder.secondaryScore || 0) }}>
                    {Math.round(breakdownFunder.secondaryScore || 0)}%
                  </span>
                </div>

                {breakdownFunder.secondaryBreakdown && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem" }}>
                    {Object.entries(breakdownFunder.secondaryBreakdown).map(([key, item], i) => (
                      <BreakdownCard key={i} itemKey={key} item={item} devMode={devMode} />
                    ))}
                  </div>
                )}
              </div>

              {/* Close button */}
              <div style={{ display: "flex", justifyContent: "center", paddingTop: "1.5rem", borderTop: "1px solid #E8D5C4", marginTop: "1.5rem" }}>
                <button
                  style={{
                    padding: "0.75rem 2rem", background: "#5D2A0A", color: "white",
                    border: "none", borderRadius: 6, fontSize: "0.875rem", fontWeight: 500, cursor: "pointer",
                  }}
                  onClick={() => setBreakdownFunder(null)}
                >
                  Close Breakdown
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default FundingMatchesTable