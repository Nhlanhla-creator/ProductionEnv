"use client"

import { useMemo, useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Eye, Users, Percent, Award, MapPin, Brain, Settings2, ChevronDown, ChevronUp, Info, GraduationCap } from "lucide-react"
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore"
import { db } from "../../firebaseConfig"
import InternDetailsModal from "./InternDetailsModal"

// ── Reusable breakdown card (same style as AdvisorMatchesTable) ──
const BreakdownCard = ({ itemKey, item, devMode }) => {
  const labels = {
    skillsMatch: "Skills Match",
    locationMatch: "Location Match",
    availabilityMatch: "Availability Match",
    workModeMatch: "Work Mode Match",
    profileCompleteness: "Application Completeness",
  };

  const label = labels[itemKey] || itemKey;
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
        <div>SME: {item.appValue || "Not specified"}</div>
        <div>Intern: {item.internValue || "Not specified"}</div>
        {item.reasoning && <div style={{ marginTop: 4 }}>{item.reasoning}</div>}
      </div>
    </div>
  );
};

export default function InternMatchesTable({
  applicationId,
  emptyMessage = "No matching interns for this application yet.",
}) {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(applicationId ? true : false)
  const [breakdownMatch, setBreakdownMatch] = useState(null)
  const [modalIntern, setModalIntern] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [devMode, setDevMode] = useState(false)
  const [primaryExpanded, setPrimaryExpanded] = useState(true)

  const [internData, setInternData] = useState({})

  useEffect(() => { setMounted(true) }, [])

  // Fetch from internMatchResults
  useEffect(() => {
    if (!applicationId) {
      setMatches([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, "internMatchResults"),
      where("applicationId", "==", applicationId),
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setMatches(data)
        setLoading(false)
      },
      (err) => {
        console.error("Error fetching intern matches:", err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [applicationId])

  // Secret: Ctrl+Alt+P while breakdown modal is open toggles verbose dev labels
  useEffect(() => {
    if (!breakdownMatch) { setDevMode(false); return }
    const handler = (e) => {
      if (e.ctrlKey && e.altKey && e.key === "p") {
        e.preventDefault()
        setDevMode((v) => !v)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [breakdownMatch])

  // Filter to finalScore >= 50 and sort descending
  const rows = useMemo(() => {
    const allRows = matches || [];
    return allRows
      .filter(m => (m.finalScore || 0) > 0)
      .sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
  }, [matches]);

  useEffect(() => {
    // Auto-fetch locations for all interns when matches load
    const fetchAllLocations = async () => {
      for (const match of rows) {
        if (match.internId && !internData[match.internId]) {
          // Fetch just the location data (you can create a lightweight API endpoint for this)
          try {
            const profileDoc = await getDoc(doc(db, "internProfiles", match.internId))
            if (profileDoc.exists()) {
              const data = profileDoc.data()
              const personalOverview = data.formData?.personalOverview || {}
              setInternData(prev => ({
                ...prev,
                [match.internId]: {
                  degree: data.formData?.academicOverview?.degree || "Not specified",
                  provinces: personalOverview.provinces || [],
                  cities: personalOverview.cities || [],
                  displayLocation: personalOverview.cities?.length > 0 
                    ? personalOverview.cities.join(", ") 
                    : personalOverview.provinces?.join(", ") || "Not specified"
                }
              }))
            }
          } catch (error) {
            console.error("Error fetching location:", error)
          }
        }
      }
    }
    
    if (rows.length > 0) {
      fetchAllLocations()
    }
  }, [rows])

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

  const internName = (m) => {
    const name = m.internName || "Unnamed Intern"
    return name.split(" ").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ")
  }

  const internSkills = (m) =>
    (m.matchedCapabilities || []).slice(0, 3)

  const formatProvinces = (provinces) => {
    if (!provinces || !Array.isArray(provinces) || provinces.length === 0) return ""
    return provinces.join(", ")
  }

  return (
    <div style={{ width: "100%" }}>
      {loading && (
        <div style={{ textAlign: "center", padding: "28px", color: "#8D6E63" }}>
          Loading matches…
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "28px",
            color: "#8D6E63",
            fontStyle: "italic",
            background: "white",
            borderRadius: 12,
            border: "1px solid #E8D5C4",
          }}
        >
          {matches?.length > 0
            ? `Found ${matches.length} potential intern(s) but none met the 50% match threshold.`
            : emptyMessage}
        </div>
      )}

      {!loading && rows.length > 0 && (
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
              <col style={{ width: "20%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "10%" }} />
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: "#5d4037" }}>
                {[
                  { label: "Intern", Icon: Users },
                  { label: "Rating", Icon: GraduationCap },
                  { label: "Capabilities", Icon: null },
                  { label: "Match", Icon: Percent },
                  { label: "Location", Icon: MapPin },
                  { label: "Actions", Icon: null, align: "center" },
                ].map(({ label, Icon, align }) => (
                  <th
                    key={label}
                    style={{
                      padding: "12px 14px",
                      color: "white",
                      backgroundColor: "#5d4037",
                      textAlign: align || "left",
                      fontWeight: 600,
                      fontSize: "12px",
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
              {rows.map((m, idx) => {
                const pct = m.finalScore || 0
                return (
                  <tr
                    key={m.id}
                    style={{
                      borderBottom: idx < rows.length - 1 ? "1px solid #F0E6DA" : "none",
                      transition: "background-color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAF7F3")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ padding: "12px 14px", fontSize: "13px", color: "#4A352F", fontWeight: 600 }}>
                      <div
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={internName(m)}
                      >
                        {internName(m)}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                        {m.hasPrimaryAnalysis && (
                          <span style={{ fontSize: "10px", color: "#388E3C", fontWeight: 500 }}>
                            Primary {Math.round(m.primaryScore)}%
                          </span>
                        )}
                        {m.secondaryScore != null && (
                          <span style={{ fontSize: "10px", color: "#8D6E63", fontWeight: 500 }}>
                            Prefs {Math.round(m.secondaryScore)}%
                          </span>
                        )}
                        {!m.hasPrimaryAnalysis && (
                          <span style={{ fontSize: "10px", color: "#bbb", fontStyle: "italic" }}>
                            Pending
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: "12px 14px", fontSize: "13px", color: "#5D4037" }}>
                      {internData[m.internId]?.degree || "Not specified"}
                    </td>

                    <td style={{ padding: "12px 14px", fontSize: "13px", color: "#5D4037" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {internSkills(m).map((cap, i) => (
                          <span
                            key={i}
                            style={{
                              display: "inline-block",
                              padding: "3px 9px",
                              background: "rgba(56,142,60,0.12)",
                              borderRadius: 12,
                              fontSize: "11px",
                              fontWeight: 500,
                              color: "#388E3C",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: 120,
                            }}
                            title={cap}
                          >
                            {cap}
                          </span>
                        ))}
                        {(m.matchedCapabilities || []).length > 3 && (
                          <span style={{ fontSize: "11px", color: "#8D6E63", alignSelf: "center" }}>
                            +{m.matchedCapabilities.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    <td
                      style={{ padding: "12px 14px", cursor: "pointer" }}
                      onClick={(e) => { e.stopPropagation(); setBreakdownMatch(m) }}
                      title="Click to view match breakdown"
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: scoreColor(pct),
                            fontSize: "13px",
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

                    <td style={{ padding: "12px 14px", fontSize: "13px", color: "#5D4037", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={formatProvinces(internData[m.internId]?.provinces) || internData[m.internId]?.displayLocation || m.internLocation || "Not specified"}>
                      {formatProvinces(internData[m.internId]?.provinces) || internData[m.internId]?.displayLocation || m.internLocation || "Not specified"}
                    </td>

                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                        <button
                          onClick={() => setModalIntern(m)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "7px 11px",
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
                          title={`View details for ${internName(m)}`}
                        >
                          <Eye size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Intern Details Modal */}
      <InternDetailsModal
        intern={modalIntern}
        isOpen={!!modalIntern}
        onClose={() => setModalIntern(null)}
      />

      {/* Match Breakdown Modal */}
      {mounted && breakdownMatch && createPortal(
        <div
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setBreakdownMatch(null)}
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
                Match Breakdown — {internName(breakdownMatch)}
                {devMode && (
                  <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "#a67c52", background: "rgba(166,124,82,0.12)", border: "1px solid rgba(166,124,82,0.3)", borderRadius: 4, padding: "2px 6px", letterSpacing: "0.5px" }}>DEV</span>
                )}
              </h3>
              <button
                onClick={() => setBreakdownMatch(null)}
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
                  color: scoreColor(breakdownMatch.finalScore || 0),
                }}>
                  {breakdownMatch.finalScore || 0}%
                </div>
                <p style={{ fontSize: "1rem", color: "#8D6E63", margin: 0 }}>Overall Match Score</p>
                <p style={{ fontSize: "0.8rem", color: "#bbb", margin: "4px 0 0" }}>
                  {breakdownMatch.hasPrimaryAnalysis
                    ? "60% Primary + 40% Preferences"
                    : "Preferences only — run AI for full analysis"}
                </p>
              </div>

              {/* PRIMARY: AI Analysis (60%) */}
              <div style={{ marginBottom: "2rem" }}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem", cursor: "pointer" }}
                  onClick={() => setPrimaryExpanded(!primaryExpanded)}
                >
                  <Brain size={18} style={{ color: "#5D2A0A" }} />
                  <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#5D2A0A", flex: 1 }}>
                    Primary Matching
                    {devMode && <span style={{ fontWeight: 400, fontSize: "0.85rem", color: "#8D6E63" }}> (60% weight)</span>}
                  </h4>
                  {primaryExpanded ? <ChevronUp size={16} color="#8D6E63" /> : <ChevronDown size={16} color="#8D6E63" />}
                </div>

                {primaryExpanded && (
                  <>
                    {breakdownMatch.primaryBreakdown ? (
                      <div style={{ background: "#FEFCFA", border: "1px solid #E8D5C4", borderRadius: 8, padding: "1.25rem", borderLeft: `4px solid ${scoreColor(breakdownMatch.primaryScore || 0)}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                          <span style={{ fontWeight: 600, color: "#5D2A0A" }}>AI Semantic Score</span>
                          <span style={{ fontSize: "1.5rem", fontWeight: "bold", color: scoreColor(breakdownMatch.primaryScore || 0) }}>
                            {Math.round(breakdownMatch.primaryScore || 0)}%
                          </span>
                        </div>
                        <div style={{ background: "#E8D5C4", borderRadius: 4, height: 8, overflow: "hidden", marginBottom: "0.75rem" }}>
                          <div style={{ height: "100%", background: scoreColor(breakdownMatch.primaryScore || 0), width: `${breakdownMatch.primaryScore || 0}%`, transition: "width 0.3s" }} />
                        </div>
                        {breakdownMatch.primaryReasoning && (
                          <div style={{ fontSize: "0.8rem", color: "#5D4037", marginBottom: "0.5rem" }}>
                            <strong>Reasoning:</strong> {breakdownMatch.primaryReasoning}
                          </div>
                        )}

                        {/* Matched capabilities */}
                        {breakdownMatch.matchedCapabilities?.length > 0 && (
                          <div style={{ fontSize: "0.8rem", color: "#5D4037", marginTop: "0.5rem" }}>
                            <strong>Matched Capabilities:</strong>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                              {breakdownMatch.matchedCapabilities.map((cap, i) => (
                                <span key={i} style={{ padding: "2px 8px", background: "rgba(56,142,60,0.1)", borderRadius: 10, fontSize: "0.75rem", color: "#388E3C" }}>
                                  {cap}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Individual AI breakdown items */}
                        <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
                          {breakdownMatch.primaryBreakdown.skillsAlignment && (
                            <div style={{ background: "#FEFCFA", border: "1px solid #E8D5C4", borderRadius: 6, padding: "0.75rem" }}>
                              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#5D2A0A" }}>Skills Alignment</div>
                              <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: scoreColor(breakdownMatch.primaryBreakdown.skillsAlignment.score) }}>
                                {Math.round(breakdownMatch.primaryBreakdown.skillsAlignment.score)}%
                              </div>
                              <div style={{ fontSize: "0.7rem", color: "#8D6E63" }}>{breakdownMatch.primaryBreakdown.skillsAlignment.reasoning}</div>
                            </div>
                          )}
                          {breakdownMatch.primaryBreakdown.careerFit && (
                            <div style={{ background: "#FEFCFA", border: "1px solid #E8D5C4", borderRadius: 6, padding: "0.75rem" }}>
                              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#5D2A0A" }}>Career Fit</div>
                              <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: scoreColor(breakdownMatch.primaryBreakdown.careerFit.score) }}>
                                {Math.round(breakdownMatch.primaryBreakdown.careerFit.score)}%
                              </div>
                              <div style={{ fontSize: "0.7rem", color: "#8D6E63" }}>{breakdownMatch.primaryBreakdown.careerFit.reasoning}</div>
                            </div>
                          )}
                          {breakdownMatch.primaryBreakdown.availabilityReadiness && (
                            <div style={{ background: "#FEFCFA", border: "1px solid #E8D5C4", borderRadius: 6, padding: "0.75rem" }}>
                              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#5D2A0A" }}>Availability Readiness</div>
                              <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: scoreColor(breakdownMatch.primaryBreakdown.availabilityReadiness.score) }}>
                                {Math.round(breakdownMatch.primaryBreakdown.availabilityReadiness.score)}%
                              </div>
                              <div style={{ fontSize: "0.7rem", color: "#8D6E63" }}>{breakdownMatch.primaryBreakdown.availabilityReadiness.reasoning}</div>
                            </div>
                          )}
                          {breakdownMatch.primaryBreakdown.overallFit && (
                            <div style={{ background: "#FEFCFA", border: "1px solid #E8D5C4", borderRadius: 6, padding: "0.75rem" }}>
                              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#5D2A0A" }}>Overall Fit</div>
                              <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: scoreColor(breakdownMatch.primaryBreakdown.overallFit.score) }}>
                                {Math.round(breakdownMatch.primaryBreakdown.overallFit.score)}%
                              </div>
                              <div style={{ fontSize: "0.7rem", color: "#8D6E63" }}>{breakdownMatch.primaryBreakdown.overallFit.reasoning}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{ background: "#f9f5f0", border: "1px dashed #E8D5C4", borderRadius: 8, padding: "1.25rem", textAlign: "center", color: "#8D6E63" }}>
                        <Brain size={24} style={{ opacity: 0.3, marginBottom: 6 }} />
                        <p style={{ margin: 0, fontSize: "0.85rem" }}>Primary analysis pending.</p>
                        <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#bbb" }}>Run AI Analysis to get semantic matching.</p>
                      </div>
                    )}
                  </>
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
                  <span style={{ marginLeft: "auto", fontSize: "1.25rem", fontWeight: "bold", color: scoreColor(breakdownMatch.secondaryScore || 0) }}>
                    {Math.round(breakdownMatch.secondaryScore || 0)}%
                  </span>
                </div>

                {breakdownMatch.secondaryBreakdown && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem" }}>
                    {Object.entries(breakdownMatch.secondaryBreakdown).map(([key, item], i) => (
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
                  onClick={() => setBreakdownMatch(null)}
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