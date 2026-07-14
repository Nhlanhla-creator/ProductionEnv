"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { FileText, Package, Calendar, Hash, RefreshCw, Brain, Loader2, Eye } from "lucide-react"
import { useNavigate } from "react-router-dom"
import useMatches, { deriveAppId } from "../hooks/useMatches"
import { runAiAnalysisForApplication } from "./supplier-table"
import SupplierMatchesTable from "./SupplierMatchesTable"

/**
 * GroupedSupplierMatches — renders the Supplier Matches table split by AppID.
 *
 * For each of the current user's product applications, it shows a divider
 * "AppID {last8chars} ─────────" followed by a compact supplier matches table
 * filtered to only the suppliers relevant to that application (via the
 * category-match logic in useMatches).
 */
const GroupedSupplierMatches = ({ onSuppliersUpdate, onSupplierContacted, contactedSuppliers = [] }) => {
  const navigate = useNavigate()
  const { applications, suppliers, matchesByAppId, allMatches, refreshAiCache, loading, error } = useMatches()

  // Per-app AI analysis state: { [appFullId]: { running, progress, error } }
  const [aiState, setAiState] = useState({})
  const [showIneligibleSuppliers, setShowIneligibleSuppliers] = useState(false)

  const handleRunAi = useCallback(async (app) => {
    const id = app.id
    setAiState((prev) => ({ ...prev, [id]: { running: true, progress: { current: 0, total: null }, error: null } }))

    // Simulated ticker: increments every 1.2 s so users see movement while
    // the Firebase callable is in-flight. It tracks the real total once
    // onProgress fires, and never advances past total-1 (so it can't
    // "complete" before the actual work finishes).
    let simCurrent = 0
    let simTotal = null
    const ticker = setInterval(() => {
      if (simTotal !== null && simCurrent >= simTotal) return
      simCurrent += 1
      if (simTotal !== null) simCurrent = Math.min(simCurrent, simTotal - 1)
      setAiState((prev) => {
        if (!prev[id]?.running) return prev
        return { ...prev, [id]: { ...prev[id], progress: { current: simCurrent, total: simTotal } } }
      })
    }, 1200)

    try {
      await runAiAnalysisForApplication(app, suppliers, {
        onProgress: (p) => {
          // Sync ticker state to real values; don't let sim go backwards.
          simTotal = p.total
          simCurrent = Math.max(simCurrent, p.current)
          setAiState((prev) => ({ ...prev, [id]: { ...prev[id], progress: p } }))
        },
      })
      clearInterval(ticker)
      await refreshAiCache(id)
      setAiState((prev) => ({ ...prev, [id]: { running: false, progress: null, error: null } }))
    } catch (err) {
      clearInterval(ticker)
      console.error("[GroupedSupplierMatches] AI analysis failed for", id, err)
      setAiState((prev) => ({
        ...prev,
        [id]: { running: false, progress: null, error: err.message || "AI analysis failed" },
      }))
    }
  }, [suppliers, refreshAiCache])

  // Keep the latest onSuppliersUpdate callback in a ref so the
  // propagation effect below only re-fires when the match data actually
  // changes — NOT every time the parent re-renders and passes a new
  // function reference. Without this, the effect + the parent's inline
  // handleSuppliersUpdate (which always allocates a fresh filtered array
  // for acceptedSuppliers) form an infinite render loop that freezes the
  // route transition.
  const onSuppliersUpdateRef = useRef(onSuppliersUpdate)
  useEffect(() => {
    onSuppliersUpdateRef.current = onSuppliersUpdate
  }, [onSuppliersUpdate])

  // Mirror the legacy SupplierTable behaviour: propagate all suppliers (flat,
  // deduped) to the parent so the DealFlow Pipeline + tab counts stay in sync.
  // Deliberately exclude onSuppliersUpdate from the dep array (read via ref).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (loading) return
    const cb = onSuppliersUpdateRef.current
    if (cb) cb(allMatches, allMatches)
  }, [loading, allMatches])

  const sortedApps = useMemo(() => {
    return [...(applications || [])].sort((a, b) => {
      const at = a?.lastUpdated?.toMillis?.() || a?.lastUpdated?.seconds * 1000 || 0
      const bt = b?.lastUpdated?.toMillis?.() || b?.lastUpdated?.seconds * 1000 || 0
      return bt - at
    })
  }, [applications])

  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#5D2A0A" }}>
        <div
          style={{
            display: "inline-block",
            width: 32,
            height: 32,
            border: "3px solid rgba(166,124,82,0.2)",
            borderTopColor: "#a67c52",
            borderRadius: "50%",
            animation: "gsm-spin 0.8s linear infinite",
            marginBottom: 12,
          }}
        />
        <p style={{ margin: 0, fontSize: 14 }}>Loading your matches…</p>
        <style>{`@keyframes gsm-spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: "3rem", textAlign: "center" }}>
        <p style={{ color: "#D32F2F", fontSize: "1rem", marginBottom: "1rem" }}>
          Failed to load matches: {error.message || String(error)}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "0.6rem 1.2rem",
            background: "#5D2A0A",
            color: "white",
            border: "none",
            borderRadius: 6,
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    )
  }

  if (!sortedApps.length) {
    return (
      <div style={{ padding: "3rem", textAlign: "center" }}>
        <FileText size={42} style={{ color: "#c8b6a6", marginBottom: 12 }} />
        <h3 style={{ color: "#4a352f", marginBottom: 6, fontSize: 18, fontWeight: 700 }}>
          No Applications Yet
        </h3>
        <p style={{ color: "#6b7280", marginBottom: 20 }}>
          Create a product/service request to start receiving supplier matches.
        </p>
        <button
          onClick={() => navigate("/applications/products-services")}
          style={{
            padding: "0.6rem 1.2rem",
            background: "linear-gradient(135deg,#a67c52,#7d5a50)",
            color: "#faf7f2",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Create Application
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {sortedApps.map((app) => {
        const appId = deriveAppId(app.id)
        const matches = matchesByAppId[appId] || []
        const purpose = app?.requestOverview?.purpose || "Product/Service Request"
        const primaryCategory =
          app?.requestOverview?.categories?.[0] ||
          app?.productsServices?.categories?.[0] ||
          "Uncategorized"

        return (
          <section
            key={app.id}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            {/* AppID ─── divider header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "6px 2px",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  background: "linear-gradient(135deg,#5d4037,#4a332a)",
                  color: "#FAF7F2",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  boxShadow: "0 2px 6px rgba(93,64,55,0.25)",
                  whiteSpace: "nowrap",
                }}
                title={`Full application ID: ${app.id}`}
              >
                <Hash size={13} />
                AppID&nbsp;{appId}
              </div>
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background:
                    "linear-gradient(90deg, rgba(200,182,166,0.6), rgba(200,182,166,0))",
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  fontSize: 12,
                  color: "#7D5A50",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                  title="Primary category"
                >
                  <span
                    style={{
                      padding: "2px 8px",
                      background: "rgba(166,124,82,0.12)",
                      color: "#7D5A50",
                      borderRadius: 10,
                      fontSize: 11,
                      fontWeight: 500,
                    }}
                  >
                    {primaryCategory}
                  </span>
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Calendar size={12} />
                  {matches.length} {matches.length === 1 ? "match" : "matches"}
                </span>

                {/* Run AI Analysis button */}
                {(() => {
                  const st = aiState[app.id] || {};
                  const hasAi = matches.some((m) => m.hasPrimaryAnalysis);
                  return (
                    <button
                      disabled={st.running || matches.length === 0}
                      onClick={() => handleRunAi(app)}
                      title={
                        hasAi
                          ? "Re-run AI analysis for this application"
                          : "Run AI analysis to generate primary scores"
                      }
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "4px 10px",
                        background: st.running
                          ? "rgba(166,124,82,0.12)"
                          : hasAi
                            ? "rgba(56,142,60,0.1)"
                            : "linear-gradient(135deg,#a67c52,#7d5a50)",
                        color: st.running
                          ? "#8D6E63"
                          : hasAi
                            ? "#388E3C"
                            : "#FAF7F2",
                        border: hasAi
                          ? "1px solid rgba(56,142,60,0.3)"
                          : "none",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: st.running ? "default" : "pointer",
                        whiteSpace: "nowrap",
                        opacity: matches.length === 0 ? 0.5 : 1,
                      }}
                    >
                      {st.running ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          Analyzing
                          {st.progress
                            ? ` (${st.progress.current}${st.progress.total != null ? `/${st.progress.total}` : ""})`
                            : "…"}
                        </>
                      ) : (
                        <>
                          <Brain size={12} />
                          {hasAi ? "Re-run Analysis" : "Run Analysis"}
                        </>
                      )}
                    </button>
                  );
                })()}
                {aiState[app.id]?.error && (
                  <span style={{ fontSize: 11, color: "#D32F2F" }}>
                    {aiState[app.id].error}
                  </span>
                )}

                {/* <button
                  onClick={() => setShowIneligibleSuppliers(!showIneligibleSuppliers)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "4px 10px",
                    background: showIneligibleSuppliers ? "#5D2A0A" : "#E8D5C4",
                    color: showIneligibleSuppliers ? "#FAF7F2" : "#5D2A0A",
                    border: showIneligibleSuppliers ? "1px solid #5D2A0A" : "1px solid #D9C4B8",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s"
                  }}
                  title={showIneligibleSuppliers ? "Hide ineligible suppliers" : "Show all suppliers (including incomplete profiles)"}
                >
                  <Eye size={12} />
                  {showIneligibleSuppliers ? "Show All" : "Eligible Only"}
                </button> */}
              </div>
            </div>
            <div
              style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
              title="Purpose"
            >
              <span style={{ color: "#4A352F" }}>
                {purpose}
              </span>
            </div>

            <SupplierMatchesTable
              suppliers={matches}
              contactedSuppliers={contactedSuppliers}
              showIneligibleSuppliers={showIneligibleSuppliers}
              onContact={
                onSupplierContacted
                  ? (supplier) => onSupplierContacted(supplier)
                  : undefined
              }
              emptyMessage="No supplier matches for this application yet."
            />
          </section>
        );
      })}
    </div>
  )
}

export default GroupedSupplierMatches