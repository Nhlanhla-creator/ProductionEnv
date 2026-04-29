"use client"

import { useMemo, useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Eye, MessageSquare, Users, Award, MapPin, Percent, Info, Brain, Settings2 } from "lucide-react"
import SupplierDetailsModal from "./SupplierDetailsModal"

/**
 * SupplierMatchesTable — compact, read-only presentation of supplier matches.
 *
 * It is a deliberate duplicate of the SupplierTable render used on the
 * Supplier Matches page: same rows, fewer columns, no filter / AI / contacted
 * bookkeeping. It is embedded inside My Applications (per-application) and
 * inside the grouped-by-AppID view on Supplier Matches.
 *
 * Props:
 *   suppliers      Array of already-scored supplier objects (see useMatches).
 *   loading        Optional boolean for skeleton state.
 *   emptyMessage   Optional override for the no-matches placeholder.
 *   onContact      Optional callback fired when the user clicks Contact.
 *   onView         Optional callback fired when the user clicks View. When
 *                  omitted the built-in SupplierDetailsModal is opened.
 *   dense          Optional: render smaller paddings for embedded contexts.
 */
// ── Reusable breakdown card (mirrors FunderMatches pattern) ──────────
const BreakdownCard = ({ label, weight, score, appValue, supplierValue }) => {
  const color = score >= 75 ? "#388E3C" : score >= 50 ? "#F57C00" : "#D32F2F"
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
          {label} (Weight: {Math.round(weight * 100)}%)
        </h4>
        <span style={{ fontSize: "1.25rem", fontWeight: "bold", color, marginLeft: "1rem" }}>
          {Math.round(score)}%
        </span>
      </div>
      <div style={{ background: "#E8D5C4", borderRadius: 4, height: 8, overflow: "hidden", marginBottom: "0.5rem" }}>
        <div style={{ height: "100%", background: color, width: `${score}%`, transition: "width 0.3s ease" }} />
      </div>
      <div style={{ fontSize: "0.75rem", color: "#8D6E63" }}>
        <div>Your Requirement: {appValue}</div>
        <div>Supplier: {supplierValue}</div>
      </div>
    </div>
  )
}

const SupplierMatchesTable = ({
  suppliers = [],
  loading = false,
  emptyMessage = "No matching suppliers for this application yet.",
  onContact,
  onView,
  dense = false,
}) => {
  const [modalSupplier, setModalSupplier] = useState(null)
  const [breakdownSupplier, setBreakdownSupplier] = useState(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const rows = useMemo(() => suppliers || [], [suppliers])

  const handleView = (supplier) => {
    if (onView) {
      onView(supplier)
      return
    }
    setModalSupplier(supplier)
  }

  const handleContact = (supplier) => {
    if (onContact) onContact(supplier)
  }

  const supplierName = (s) =>
    s.entityOverview?.tradingName ||
    s.entityOverview?.registeredName ||
    s.name ||
    "Unnamed Supplier"

  const supplierLocation = (s) =>
    s.entityOverview?.location || s.location || "Not specified"

  const supplierBBBEE = (s) =>
    s.legalCompliance?.bbbeeLevel || s.bbbeeLevel || "N/A"

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

  const pad = dense ? "8px 10px" : "12px 14px"
  const fontSz = dense ? "12px" : "13px"

  return (
    <div style={{ width: "100%" }}>
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
            minWidth: 720,
            tableLayout: "fixed",
          }}
        >
          <colgroup>
            <col style={{ width: "28%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "14%" }} />
          </colgroup>
          <thead>
            <tr style={{ backgroundColor: "#5d4037" }}>
              {[
                { label: "Supplier", Icon: Users },
                { label: "Category", Icon: null },
                { label: "Match", Icon: Percent },
                { label: "BBBEE", Icon: Award },
                { label: "Location", Icon: MapPin },
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
                    fontSize: dense ? "11px" : "12px",
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
                <td colSpan={6} style={{ padding: "28px", textAlign: "center", color: "#8D6E63" }}>
                  Loading matches…
                </td>
              </tr>
            )}

            {!loading && rows.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: "28px",
                    textAlign: "center",
                    color: "#8D6E63",
                    fontStyle: "italic",
                    fontSize: fontSz,
                  }}
                >
                  {emptyMessage}
                </td>
              </tr>
            )}

            {!loading &&
              rows.map((s, idx) => {
                const pct = s.matchPercentage || 0
                return (
                  <tr
                    key={s.id}
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
                        title={supplierName(s)}
                      >
                        {supplierName(s)}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                        {s.hasPrimaryAnalysis && (
                          <span style={{ fontSize: "10px", color: "#388E3C", fontWeight: 500 }}>
                            AI {Math.round(s.primaryScore)}%
                          </span>
                        )}
                        {s.secondaryScore != null && (
                          <span style={{ fontSize: "10px", color: "#8D6E63", fontWeight: 500 }}>
                            Prefs {Math.round(s.secondaryScore)}%
                          </span>
                        )}
                        {!s.hasPrimaryAnalysis && (
                          <span style={{ fontSize: "10px", color: "#bbb", fontStyle: "italic" }}>
                            AI pending
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
                        title={s.serviceCategory || "Not specified"}
                      >
                        {s.serviceCategory || "Not specified"}
                      </span>
                    </td>

                    <td
                      style={{ padding: pad, cursor: "pointer" }}
                      onClick={(e) => { e.stopPropagation(); setBreakdownSupplier(s) }}
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
                      {supplierBBBEE(s)}
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
                      title={supplierLocation(s)}
                    >
                      {supplierLocation(s)}
                    </td>

                    <td style={{ padding: pad }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                        <button
                          onClick={() => handleView(s)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: dense ? "6px 9px" : "7px 11px",
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
                        >
                          <Eye size={12} /> View
                        </button>
                        {onContact && (
                          <button
                            onClick={() => handleContact(s)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: dense ? "6px 9px" : "7px 11px",
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
                          >
                            <MessageSquare size={12} /> Contact
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      <SupplierDetailsModal
        supplier={modalSupplier}
        isOpen={!!modalSupplier}
        onClose={() => setModalSupplier(null)}
      />

      {/* ── Match Breakdown Modal ── */}
      {mounted && breakdownSupplier && createPortal(
        <div
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setBreakdownSupplier(null)}
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
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#5D2A0A" }}>
                Match Breakdown — {supplierName(breakdownSupplier)}
              </h3>
              <button
                onClick={() => setBreakdownSupplier(null)}
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
                  color: scoreColor(breakdownSupplier.matchPercentage || 0),
                }}>
                  {breakdownSupplier.matchPercentage || 0}%
                </div>
                <p style={{ fontSize: "1rem", color: "#8D6E63", margin: 0 }}>Overall Match Score</p>
                <p style={{ fontSize: "0.8rem", color: "#bbb", margin: "4px 0 0" }}>
                  {breakdownSupplier.hasPrimaryAnalysis ? "60% AI Primary + 40% Preferences" : "Preferences only — run AI for full analysis"}
                </p>
              </div>

              {/* ── PRIMARY: AI Analysis (60%) ── */}
              <div style={{ marginBottom: "2rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
                  <Brain size={18} style={{ color: "#5D2A0A" }} />
                  <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#5D2A0A" }}>
                    Primary Matching — AI Product/Service Analysis
                    <span style={{ fontWeight: 400, fontSize: "0.85rem", color: "#8D6E63" }}> (60% weight)</span>
                  </h4>
                </div>

                {breakdownSupplier.primaryBreakdown ? (
                  <div style={{ background: "#FEFCFA", border: "1px solid #E8D5C4", borderRadius: 8, padding: "1.25rem", borderLeft: `4px solid ${scoreColor(breakdownSupplier.primaryScore || 0)}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                      <span style={{ fontWeight: 600, color: "#5D2A0A" }}>AI Semantic Score</span>
                      <span style={{ fontSize: "1.5rem", fontWeight: "bold", color: scoreColor(breakdownSupplier.primaryScore || 0) }}>
                        {Math.round(breakdownSupplier.primaryScore || 0)}%
                      </span>
                    </div>
                    <div style={{ background: "#E8D5C4", borderRadius: 4, height: 8, overflow: "hidden", marginBottom: "0.75rem" }}>
                      <div style={{ height: "100%", background: scoreColor(breakdownSupplier.primaryScore || 0), width: `${breakdownSupplier.primaryScore || 0}%`, transition: "width 0.3s" }} />
                    </div>
                    {breakdownSupplier.primaryBreakdown.reasoning && (
                      <div style={{ fontSize: "0.8rem", color: "#5D4037", marginBottom: "0.5rem" }}>
                        <strong>Reasoning:</strong> {breakdownSupplier.primaryBreakdown.reasoning}
                      </div>
                    )}
                    {breakdownSupplier.primaryBreakdown.capabilities?.length > 0 && (
                      <div style={{ fontSize: "0.8rem", color: "#5D4037" }}>
                        <strong>Matched Capabilities:</strong>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                          {breakdownSupplier.primaryBreakdown.capabilities.map((cap, i) => (
                            <span key={i} style={{ padding: "2px 8px", background: "rgba(56,142,60,0.1)", borderRadius: 10, fontSize: "0.75rem", color: "#388E3C" }}>
                              {cap}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {breakdownSupplier.categoryMatches?.length > 0 && (
                      <div style={{ fontSize: "0.8rem", color: "#5D4037", marginTop: "0.5rem" }}>
                        <strong>Category Matches:</strong> {breakdownSupplier.categoryMatches.join(", ")}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ background: "#f9f5f0", border: "1px dashed #E8D5C4", borderRadius: 8, padding: "1.25rem", textAlign: "center", color: "#8D6E63" }}>
                    <Brain size={24} style={{ opacity: 0.3, marginBottom: 6 }} className="mx-auto" />
                    <p style={{ margin: 0, fontSize: "0.85rem" }}>AI analysis has not been run for this application yet.</p>
                    <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#bbb" }}>Run AI Analysis on the Supplier Matches page to generate primary scores.</p>
                  </div>
                )}
              </div>

              {/* ── SECONDARY: Preferences (40%) ── */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
                  <Settings2 size={18} style={{ color: "#5D2A0A" }} />
                  <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#5D2A0A" }}>
                    Secondary Matching — Applicant Preferences
                    <span style={{ fontWeight: 400, fontSize: "0.85rem", color: "#8D6E63" }}> (40% weight)</span>
                  </h4>
                  <span style={{ marginLeft: "auto", fontSize: "1.25rem", fontWeight: "bold", color: scoreColor(breakdownSupplier.secondaryScore || 0) }}>
                    {Math.round(breakdownSupplier.secondaryScore || 0)}%
                  </span>
                </div>

                {breakdownSupplier.secondaryBreakdown && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem" }}>
                    {Object.values(breakdownSupplier.secondaryBreakdown).map((item, i) => (
                      <BreakdownCard
                        key={i}
                        label={item.label}
                        weight={item.weight}
                        score={item.score}
                        appValue={item.appValue}
                        supplierValue={item.supplierValue}
                      />
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
                  onClick={() => setBreakdownSupplier(null)}
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

export default SupplierMatchesTable
