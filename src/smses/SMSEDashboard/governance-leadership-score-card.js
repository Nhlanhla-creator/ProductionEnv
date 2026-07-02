"use client"

import { useState, useEffect } from "react"
import { ChevronDown, RefreshCw, AlertCircle, Users, CheckCircle, TrendingUp, Shield } from "lucide-react"
import { db, auth } from "../../firebaseConfig"
import { doc, onSnapshot, updateDoc, setDoc, getDoc, collection, getDocs } from "firebase/firestore"
import { getFunctions, httpsCallable } from "firebase/functions"
import {
  calculateGovernanceScore,
  buildGovernancePrompt,
} from "./governance-improvements"

// ─────────────────────────────────────────────────────────────────────────
// Governance & Leadership — combined card.
// Replaces the old separate PISScoreCard (governance) and LeadershipScoreCard.
// Category 3 of the 5-pillar taxonomy:
//   1. Compliance   2. Legitimacy   3. Leadership & Governance (this file)
//   4. Operational Strength   5. Financial Strength / Capital Appeal
//
// Internally this is organised into three sub-sections that mirror how the
// business actually thinks about this pillar:
//   A. Ownership & Structure   — directors, shareholders, succession
//      (sourced from the deterministic Board Structure scorer)
//   B. Leadership Quality      — founder experience, qualifications,
//      industry expertise, execution capability, ambition, learning mindset
//      (sourced from the AI leadership evaluation)
//   C. Governance Maturity     — board, advisors, policies, reporting,
//      risk management, integrity & risk, sanctions, conflicts, legal,
//      reputation
//      (sourced from the deterministic Strategic/Risk/Transparency/Policies
//      scorers, i.e. calculateGovernanceScore() minus the board component)
// ─────────────────────────────────────────────────────────────────────────

const SECTION_WEIGHTS = {
  ownership: 25,
  leadership: 40,
  maturity: 35,
}

export function GovernanceLeadershipScoreCard({ styles, profileData, onScoreUpdate, apiKey }) {
  const [showModal, setShowModal] = useState(false)

  // ── Combined ──
  const [overallScore, setOverallScore] = useState(0)

  // ── A. Ownership & Structure ──
  const [ownershipScore, setOwnershipScore] = useState(0)
  const [ownershipDetail, setOwnershipDetail] = useState(null)

  // ── B. Leadership Quality ──
  const [leadershipScore, setLeadershipScore] = useState(0)
  const [leadershipBreakdown, setLeadershipBreakdown] = useState([])
  const [leadershipAiResult, setLeadershipAiResult] = useState("")
  const [confidenceScores, setConfidenceScores] = useState({})
  const [evidenceTraceability, setEvidenceTraceability] = useState({})

  // ── C. Governance Maturity ──
  const [maturityScore, setMaturityScore] = useState(0)
  const [maturityBreakdown, setMaturityBreakdown] = useState([])
  const [governanceStage, setGovernanceStage] = useState("")
  const [governanceAiResult, setGovernanceAiResult] = useState("")

  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluationError, setEvaluationError] = useState("")
  const [showAboutScore, setShowAboutScore] = useState(false)
  const [openSection, setOpenSection] = useState("leadership") // which sub-section is expanded
  const [triggeredByAuto, setTriggeredByAuto] = useState(false)

  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : ""
    return () => (document.body.style.overflow = "")
  }, [showModal])

  // ─────────────────────────────────────────────────────────────────────
  // Deterministic scoring — runs on every profileData change, no AI needed
  // for Ownership & Structure / Governance Maturity.
  // ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!profileData) return

    const cleanProfile = {
      ...profileData,
      ownershipManagement: {
        ...profileData?.ownershipManagement,
        directors: (profileData?.ownershipManagement?.directors || []).filter(
          (d) => d?.name && d.name.trim() !== ""
        ),
      },
    }

    const gov = calculateGovernanceScore(cleanProfile)
    const boardCat = gov.categories.find((c) => c.name === "Board Structure")
    const nonBoardCats = gov.categories.filter((c) => c.name !== "Board Structure")

    // Re-normalise the non-board categories to their own 100% so "Governance
    // Maturity" reads as a standalone score, not diluted by board weight.
    const nonBoardWeightTotal = nonBoardCats.reduce((s, c) => s + c.weight, 0) || 1
    const maturityOverall = Math.round(
      nonBoardCats.reduce((s, c) => s + c.score * (c.weight / nonBoardWeightTotal), 0)
    )

    setOwnershipScore(boardCat?.score || 0)
    setOwnershipDetail(boardCat || null)
    setMaturityScore(maturityOverall)
    setMaturityBreakdown(nonBoardCats)
    setGovernanceStage(gov.stage)
  }, [
    profileData?.entityOverview?.operationStage,
    profileData?.entityOverview?.employeeCount,
    profileData?.governance,
    profileData?.ownershipManagement?.directors?.length,
    profileData?.ownershipManagement?.businessLeadership?.decisionGovernance,
    profileData?.ownershipManagement?.businessLeadership?.opennessToAdvice,
    profileData?.enterpriseReadiness?.hasAdvisors,
    profileData?.enterpriseReadiness?.advisorsMeetRegularly,
    profileData?.enterpriseReadiness?.advisorsMeetingFrequency,
    profileData?.financialOverview?.annualRevenue,
    profileData?.financialOverview?.existingDebt,
    profileData?.ownershipManagement?.shareholders?.length,
  ])

  // ─────────────────────────────────────────────────────────────────────
  // Leadership Quality — parsed from AI text (credentials / structure /
  // behaviour), same rubric as the old standalone LeadershipScoreCard.
  // ─────────────────────────────────────────────────────────────────────
  const parseLeadershipAiScores = (text) => {
    const categories = {
      leadership_credentials: ["Leadership Credentials"],
      leadership_structure: ["Leadership Structure"],
      leadership_behaviour: ["Leadership Behaviour"],
    }

    const cleanedText = text.replace(/\*\*(.*?)\*\*/g, "$1")
    const scores = {}
    const evidenceMap = {}
    const confidenceMap = {}

    // Split into ### chunks and search the WHOLE chunk (heading included),
    // not just the text after the first line break. The model sometimes
    // crams "Score: X/5   Confidence: ...   Evidence: ..." onto the same
    // line as the "### N. Label" heading itself — a body-only search misses
    // that entirely, which is why a section can show correctly in the
    // detailed analysis text but still score 0 in the breakdown.
    const chunks = cleanedText.split(/(?=###\s)/g)

    Object.entries(categories).forEach(([key, labels]) => {
      let found = null
      let evidence = null
      let confidence = "Medium"

      for (const label of labels) {
        const chunk = chunks.find((c) => new RegExp(`###\\s*\\d*\\.?\\s*${label}`, "i").test(c))
        if (chunk) {
          const evidencePatterns = [/Evidence:?\s*([^\n]+)/i, /Based on:?\s*([^\n]+)/i, /Supporting data:?\s*([^\n]+)/i]
          for (const p of evidencePatterns) {
            const mm = chunk.match(p)
            if (mm) { evidence = mm[1].trim(); break }
          }
          const confidencePatterns = [/Confidence:?\s*(High|Medium|Low)/i, /Confidence level:?\s*(High|Medium|Low)/i]
          for (const p of confidencePatterns) {
            const mm = chunk.match(p)
            if (mm) { confidence = mm[1]; break }
          }
          const scorePatterns = [
            /Score\s*:\s*(\d(?:\.\d)?)\s*\/\s*5/i,
            /Score\s*:\s*(\d(?:\.\d)?)/i,
            /(\d(?:\.\d)?)\s*\/\s*5/i,
            /(\d(?:\.\d)?)\s*out\s*of\s*5/i,
            /(\d(?:\.\d)?)\s*\*\s*\d+%/i,
          ]
          for (const p of scorePatterns) {
            const mm = chunk.match(p)
            if (mm) { found = parseFloat(mm[1]); break }
          }
        }
        if (found != null) break
      }

      if (found != null) {
        scores[key] = Math.min(Math.max(found, 0), 5)
        if (evidence) evidenceMap[key] = evidence
        if (confidence) confidenceMap[key] = confidence
      }
    })

    setConfidenceScores(confidenceMap)
    setEvidenceTraceability(evidenceMap)
    return scores
  }

  const calculateLeadershipQuality = (aiText) => {
    const weightings = { credentials: 40, structure: 30, behaviour: 30 }
    const ai = aiText ? parseLeadershipAiScores(aiText) : {}
    const keyMap = {
      credentials: ["leadership_credentials"],
      structure: ["leadership_structure"],
      behaviour: ["leadership_behaviour"],
    }
    const categoryNames = {
      credentials: "Leadership Credentials",
      structure: "Leadership Structure",
      behaviour: "Leadership Behaviour",
    }
    const colors = ["#8D6E63", "#6D4C41", "#A67C52"]

    const breakdown = Object.entries(categoryNames).map(([key, label], i) => {
      const raw = keyMap[key].reduce((acc, k) => (ai[k] != null ? ai[k] : acc), null) ?? 0
      const percent = (raw / 5) * 100
      const weighted = percent * (weightings[key] / 100)
      return {
        name: label,
        score: Math.round(percent),
        weight: weightings[key],
        weightedScore: Math.round(weighted),
        color: colors[i],
        rawScore: raw,
        maxScore: 5,
      }
    })

    const totalScore = Math.round(breakdown.reduce((s, x) => s + x.weightedScore, 0))
    return { totalScore, breakdown }
  }

  useEffect(() => {
    if (!leadershipAiResult) return
    const result = calculateLeadershipQuality(leadershipAiResult)
    setLeadershipScore(result.totalScore)
    setLeadershipBreakdown(result.breakdown)
  }, [leadershipAiResult])

  // ─────────────────────────────────────────────────────────────────────
  // Combined overall score
  // ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const overall = Math.round(
      ownershipScore * (SECTION_WEIGHTS.ownership / 100) +
      leadershipScore * (SECTION_WEIGHTS.leadership / 100) +
      maturityScore * (SECTION_WEIGHTS.maturity / 100)
    )
    setOverallScore(overall)
    if (onScoreUpdate) onScoreUpdate(overall)
  }, [ownershipScore, leadershipScore, maturityScore])

  // ─────────────────────────────────────────────────────────────────────
  // AI evaluation — fires the two backend prompts in parallel, then merges
  // ─────────────────────────────────────────────────────────────────────
  const prepareLeadershipData = async (userId) => {
    let cvText = ""
    try {
      const cvsRef = collection(db, "userCVData", userId, "cvs")
      const snap = await getDocs(cvsRef)
      const cvs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      cvText = cvs
        .map((cv) => {
          const lines = []
          if (cv.personName) lines.push(`Name: ${cv.personName}`)
          if (cv.currentRole || cv.currentCompany) lines.push(`Current Role: ${cv.currentRole || "Not specified"} at ${cv.currentCompany || "Not specified"}`)
          if (cv.yearsOfExperience != null) lines.push(`Years of Experience: ${cv.yearsOfExperience}`)
          if (Array.isArray(cv.education) && cv.education.length) {
            lines.push("Education:")
            cv.education.forEach((ed) => lines.push(`  - ${ed.degree || "Degree"} in ${ed.field || "Not specified"}, ${ed.institution || "Not specified"} (${ed.graduationYear || "N/A"})`))
          }
          if (Array.isArray(cv.certifications) && cv.certifications.length) lines.push(`Certifications: ${cv.certifications.join("; ")}`)
          if (Array.isArray(cv.skills) && cv.skills.length) lines.push(`Skills: ${cv.skills.join(", ")}`)
          return lines.join("\n")
        })
        .join("\n\n")
    } catch (e) {
      console.error("Error fetching CV data:", e)
    }

    // ── Ownership & Management structure — feeds Leadership Structure ──
    const om = profileData?.ownershipManagement || {}
    const bl = om.businessLeadership || {}
    const validShareholders = (om.shareholders || []).filter((s) => s?.name && s.name.trim() !== "")
    const validDirectors = (om.directors || []).filter((d) => d?.name && d.name.trim() !== "")
    const validExecutives = (om.executives || []).filter((e) => e?.name && e.name.trim() !== "")
    const shareholderCount = validShareholders.length

    const execSplit = validDirectors.reduce(
      (acc, d) => {
        if (d.execType === "Executive") acc.exec++
        else if (d.execType === "Non-Executive") acc.nonExec++
        else acc.unspecified++
        return acc
      },
      { exec: 0, nonExec: 0, unspecified: 0 }
    )

    // ── Conflict of interest signal — feeds Leadership Behaviour ──
    // A shareholder/director/executive with a declared ACTIVE interest in
    // another operating business is a potential conflict of interest. This
    // is a distinct data source from Governance.js's own conflict-of-interest
    // section — both should be weighed, but this one is specifically tied to
    // named individuals via the Ownership & Management "Interests Declaration".
    const activeInterests = om.activeInterests || []
    const previousInterests = om.previousInterests || []
    const activeConflicts = activeInterests.filter((i) => i?.assignedTo && i.businessStatus && i.businessStatus !== "Closed")
    const conflictSummary = activeConflicts.length > 0
      ? activeConflicts.map((i) => `${i.assignedTo} — active interest in ${i.companyName || "unnamed company"} (status: ${i.businessStatus})`).join("; ")
      : "None declared"

    const employeeSummary = `Permanent: ${om.permanentEmployees || 0}, Contract: ${om.contractEmployees || 0}, Internship: ${om.internshipEmployees || 0}, Temporary: ${om.temporaryEmployees || 0}`

    return `
STARTUP LEADERSHIP EVALUATION

Founder/Director Profiles:
${cvText || "No CVs uploaded."}

Business Leadership Data (all 6 questions):
Owner-Led Structure: ${bl.ownerLed || "Not specified"}
Primary Motivation: ${bl.primaryMotivation || "Not specified"}
Growth Ambition (5yr): ${bl.growthAmbition || "Not specified"}
Founder Full-Time Involvement: ${bl.founderFullTime || "Not specified"}
Openness to Advice: ${bl.opennessToAdvice || "Not specified"}
Decision Governance: ${bl.decisionGovernance || "Not specified"}

Ownership & Management Structure:
Number of Shareholders: ${shareholderCount}${shareholderCount > 8 ? " — NOTE: a shareholder count this high for an SME can signal fragmented decision-making, slower governance, and dilution risk; treat this as a structure risk factor rather than automatically positive." : ""}
Number of Directors: ${validDirectors.length} (Executive: ${execSplit.exec}, Non-Executive: ${execSplit.nonExec}, Unspecified: ${execSplit.unspecified})
Number of Executives (management team beyond the board): ${validExecutives.length}
Employee Composition: ${employeeSummary}

Conflict of Interest Signal (from Interests Declaration):
Active outside business interests held by shareholders/directors/executives: ${conflictSummary}
Previous (closed) interests declared: ${previousInterests.length}
${activeConflicts.length > 0 ? "NOTE: Named individuals with active interests in other operating businesses represent a potential conflict of interest for this business. Factor this into Leadership Behaviour — note whether it appears to be transparently disclosed here (it is, since it's declared) versus whether the scale or nature of the interest raises concern (e.g. an active director also running a business in a similar sector)." : ""}

RESPONSE FORMAT (follow exactly):

### 1. Leadership Credentials
Score: X/5
Confidence: High | Medium | Low
Evidence: (cite specific data)

### 2. Leadership Structure
Score: X/5
Confidence: High | Medium | Low
Evidence: (cite specific data — including shareholder count/concentration, director exec/non-exec balance, and management team depth)

### 3. Leadership Behaviour
Score: X/5
Confidence: High | Medium | Low
Evidence: (cite specific data — including openness to advice and any conflict-of-interest signal from declared active business interests)
`
  }

  const runAiEvaluation = async () => {
    if (!apiKey?.trim()) { setEvaluationError("API key not configured."); return }
    if (!profileData) { setEvaluationError("No profile data."); return }

    setIsEvaluating(true)
    setEvaluationError("")

    try {
      const userId = auth?.currentUser?.uid
      const functions = getFunctions()
      const generateLeadershipAnalysis = httpsCallable(functions, "generateLeadershipAnalysis")
      const generateGovernanceAnalysis = httpsCallable(functions, "generateGovernanceAnalysis")

      const cleanProfile = {
        ...profileData,
        ownershipManagement: {
          ...profileData?.ownershipManagement,
          directors: (profileData?.ownershipManagement?.directors || []).filter((d) => d?.name && d.name.trim() !== ""),
        },
      }
      const gov = calculateGovernanceScore(cleanProfile)
      const pisCalc = { totalPIS: gov.pisTotal }
      const stage = gov.stage === "startup" ? "Advisors Stage" : gov.pisTotal >= 350 ? "Full Board Stage" : "Emerging Board Stage"
      const recommendation = stage === "Advisors Stage" ? "Advisors sufficient" : stage === "Full Board Stage" ? "Formal board strongly recommended" : "Informal board recommended"

      const leadershipPrompt = await prepareLeadershipData(userId)
      const governancePrompt = buildGovernancePrompt(profileData, pisCalc, stage, recommendation)

      const [leadershipResp, governanceResp] = await Promise.all([
        generateLeadershipAnalysis({ prompt: leadershipPrompt }),
        generateGovernanceAnalysis({ prompt: governancePrompt }),
      ])

      const leadershipText = leadershipResp?.data?.content
      const governanceText = governanceResp?.data?.content
      if (!leadershipText && !governanceText) throw new Error("Invalid response format from server")

      if (leadershipText) setLeadershipAiResult(leadershipText)
      if (governanceText) setGovernanceAiResult(governanceText)

      if (userId) {
        if (leadershipText) {
          await setDoc(doc(db, "aiLeadershipEvaluation", userId), {
            result: leadershipText, timestamp: new Date(), profileSnapshot: profileData,
          }, { merge: true })
        }
        if (governanceText) {
          await setDoc(doc(db, "aiGovernanceEvaluation", userId), {
            result: governanceText, timestamp: new Date(), profileSnapshot: profileData,
          }, { merge: true })
        }
      }
    } catch (error) {
      console.error("Governance & Leadership AI evaluation error:", error)
      setEvaluationError(`Failed to get AI evaluation: ${error.message}`)
    } finally {
      setIsEvaluating(false)
    }
  }

  // ── Load saved evaluations + auto-trigger listener ──
  useEffect(() => {
    if (!auth?.currentUser?.uid || !apiKey) return
    const userId = auth.currentUser.uid
    const profileRef = doc(db, "universalProfiles", userId)
    const leadershipRef = doc(db, "aiLeadershipEvaluation", userId)
    const governanceRef = doc(db, "aiGovernanceEvaluation", userId)

    const unsubscribe = onSnapshot(profileRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        const needsRun = data.triggerLeadershipEvaluation === true || data.triggerGovernanceEvaluation === true
        if (needsRun && !isEvaluating) {
          setTriggeredByAuto(true)
          await runAiEvaluation()
          await updateDoc(profileRef, { triggerLeadershipEvaluation: false, triggerGovernanceEvaluation: false })
        }
      }
      try {
        const [leadershipSnap, governanceSnap] = await Promise.all([getDoc(leadershipRef), getDoc(governanceRef)])
        if (leadershipSnap.exists() && leadershipSnap.data().result) setLeadershipAiResult(leadershipSnap.data().result)
        if (governanceSnap.exists() && governanceSnap.data().result) setGovernanceAiResult(governanceSnap.data().result)
      } catch (e) {
        console.error("Error loading saved evaluations:", e)
      }
    })
    return () => unsubscribe()
  }, [auth?.currentUser?.uid, apiKey])

  // ─────────────────────────────────────────────────────────────────────
  // Presentation helpers
  // ─────────────────────────────────────────────────────────────────────
  const getProgressBarColor = (score) => {
    if (score > 90) return "#1B5E20"
    if (score >= 81) return "#4CAF50"
    if (score >= 61) return "#FF9800"
    if (score >= 41) return "#F44336"
    return "#B71C1C"
  }

  const getScoreLevel = (score) => {
    if (score >= 91) return { level: "Scaler", color: "#1B5E20", icon: CheckCircle, description: "High ambition + high execution" }
    if (score >= 81) return { level: "Builder", color: "#4CAF50", icon: CheckCircle, description: "High commitment + strong execution" }
    if (score >= 61) return { level: "Visionary", color: "#FF9800", icon: TrendingUp, description: "High ambition but weaker execution" }
    if (score >= 41) return { level: "Survivalist", color: "#F44336", icon: AlertCircle, description: "Moderate commitment, limited ambition" }
    return { level: "Passenger", color: "#B71C1C", icon: AlertCircle, description: "Low commitment / passive leadership" }
  }

  const scoreLevel = getScoreLevel(overallScore)
  const ScoreIcon = scoreLevel.icon

  const formatAiResult = (text) => {
    if (!text) return null
    const cleaned = text.replace(/\*\*(.*?)\*\*/g, "$1")
    const sections = cleaned.split(/(?=###\s)/g)
    return sections.map((section, index) => {
      const trimmed = section.trim()
      if (!trimmed) return null

      // Pull the heading out on its own so it can be highlighted, even when
      // the model puts "Score: X/5 Confidence: ... Evidence: ..." right on
      // the same line as "### N. Label" instead of the line below it.
      const headingMatch = trimmed.match(/^###\s*(.+?)(?=\s+Score\s*:|\n|$)/i)
      const heading = headingMatch ? headingMatch[1].trim() : null
      const rest = heading
        ? trimmed.slice(trimmed.indexOf(heading) + heading.length).replace(/^###\s*/, "").trim()
        : trimmed.replace(/^###\s*/, "")

      return (
        <div key={index} style={{ marginBottom: "15px" }}>
          {heading && (
            <div style={{ backgroundColor: "#8d6e63", color: "white", padding: "8px 14px", borderRadius: "8px 8px 0 0", fontWeight: "700", fontSize: "13px" }}>
              {heading}
            </div>
          )}
          <div style={{ fontSize: "14px", lineHeight: "1.6", color: "#6d4c41", whiteSpace: "pre-wrap", backgroundColor: "white", padding: "16px", borderRadius: heading ? "0 0 8px 8px" : "8px", border: "1px solid #e8d8cf", borderTop: heading ? "none" : "1px solid #e8d8cf" }}>
            {rest || trimmed}
          </div>
        </div>
      )
    }).filter(Boolean)
  }

  // ── Reusable collapsible sub-section ──
  const SubSection = ({ id, title, score, breakdown, aiText, extra }) => {
    const isOpen = openSection === id
    return (
      <div style={{ marginTop: "16px", border: "1px solid #d7ccc8", borderRadius: "8px", overflow: "hidden" }}>
        <div
          style={{ backgroundColor: "#8d6e63", color: "white", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontWeight: "bold" }}
          onClick={() => setOpenSection(isOpen ? "" : id)}
        >
          <span>{title}</span>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "13px", fontWeight: "700" }}>{score}%</span>
            <ChevronDown size={18} style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }} />
          </div>
        </div>
        {isOpen && (
          <div style={{ backgroundColor: "#f5f2f0", padding: "18px" }}>
            {extra}
            {breakdown && breakdown.length > 0 && (
              <div style={{ marginBottom: "10px" }}>
                {breakdown.map((item, i) => (
                  <div key={i} style={{ padding: "10px 14px", background: "white", marginBottom: "6px", borderRadius: "8px", border: "1px solid #f0e8e0" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", flex: 1, minWidth: "140px" }}>
                        <div style={{ backgroundColor: item.color, width: "10px", height: "10px", borderRadius: "50%", marginRight: "10px", flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: "600", color: "#5d4037", fontSize: "13px" }}>{item.name}</div>
                          <div style={{ fontSize: "11px", color: "#8d6e63", fontStyle: "italic" }}>
                            {item.rawScore != null ? `${item.rawScore}/${item.maxScore ?? 5} × ${item.weight}% weight = ${item.weightedScore}%` : `weight ${item.weight}%`}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "60px", height: "7px", background: "#f3e8dc", borderRadius: "4px", overflow: "hidden", border: "1px solid #d6b88a" }}>
                          <div style={{ width: `${item.score}%`, height: "100%", background: getProgressBarColor(item.score), borderRadius: "4px" }} />
                        </div>
                        <span style={{ fontWeight: "600", color: "#5d4037", fontSize: "13px", minWidth: "32px", textAlign: "right" }}>{item.score}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {aiText ? (
              <div style={{ backgroundColor: "white", padding: "16px", borderRadius: "8px", border: "1px solid #e8d8cf", maxHeight: "320px", overflowY: "auto" }}>
                {formatAiResult(aiText)}
              </div>
            ) : (
              <div style={{ fontSize: "12px", color: "#8d6e63", fontStyle: "italic", display: "flex", alignItems: "center", gap: "6px" }}>
                <AlertCircle size={14} /> No AI analysis yet — click "Load AI analysis" below.
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* ── Score Card ── */}
      <div style={{ background: "linear-gradient(135deg, #ffffff 0%, #faf8f6 100%)", borderRadius: "20px", boxShadow: "0 8px 32px rgba(141, 110, 99, 0.15)", border: "1px solid #e8ddd6", overflow: "hidden", position: "relative", width: "100%", minWidth: "210px" }}>
        <div style={{ background: "linear-gradient(135deg, #8d6e63 0%, #6d4c41 100%)", padding: "24px 30px 20px 30px", color: "white", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "700", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>Leadership & Governance</h2>
            <Users size={24} style={{ opacity: 0.8 }} />
          </div>
          <p style={{ margin: 0, fontSize: "13px", opacity: 0.9 }}>Who's in charge, and can we trust them</p>
          <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "80px", height: "80px", background: "rgba(255,255,255,0.1)", borderRadius: "50%", opacity: 0.6 }} />
        </div>

        <div style={{ padding: "24px", background: "white", textAlign: "center" }}>
          <div style={{ position: "relative", display: "inline-block", marginBottom: "24px" }}>
            <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "110px", height: "110px", border: `4px solid ${scoreLevel.color}`, borderRadius: "50%", background: "linear-gradient(135deg, #ffffff 0%, #f8fff8 100%)", boxShadow: `0 6px 20px ${scoreLevel.color}30`, fontWeight: "bold" }}>
              <span style={{ fontSize: "26px", fontWeight: "800", lineHeight: 1 }}>{overallScore}%</span>
              <div style={{ position: "absolute", top: "-6px", left: "-6px", right: "-6px", bottom: "-6px", border: `2px solid ${scoreLevel.color}20`, borderRadius: "50%", animation: "pulse 2s infinite" }} />
            </div>
            <div style={{ position: "absolute", bottom: "-12px", left: "50%", transform: "translateX(-50%)", backgroundColor: scoreLevel.color, color: "white", padding: "6px 16px", borderRadius: "20px", fontSize: "10px", fontWeight: "600", letterSpacing: "0.5px", boxShadow: `0 4px 12px ${scoreLevel.color}40`, border: "2px solid white", whiteSpace: "nowrap" }}>
              {scoreLevel.level}
            </div>
          </div>

          <button onClick={() => setShowModal(true)} style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", background: "linear-gradient(135deg, #5d4037 0%, #4a2c20 100%)", color: "white", marginTop: "15px", border: "none", fontWeight: "600", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", boxShadow: "0 4px 16px rgba(93,64,55,0.3)", whiteSpace: "nowrap" }}>
            <span>Score breakdown</span>
            <ChevronDown size={16} />
          </button>
        </div>

        <style>{`@keyframes pulse { 0%,100% { transform:scale(1); opacity:1; } 50% { transform:scale(1.05); opacity:0.7; } }`}</style>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999999, padding: "20px" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div style={{ position: "relative", backgroundColor: "#ffffff", borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)", zIndex: 999999, maxHeight: "90vh", overflowY: "auto", width: "90%", maxWidth: "780px", border: "1px solid #ccc" }}
            onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowModal(false)}
              style={{ position: "absolute", top: "15px", right: "15px", background: "#fff", border: "2px solid #ddd", fontSize: "20px", cursor: "pointer", color: "#666", zIndex: 999999, width: "35px", height: "35px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontWeight: "bold" }}
            >
              {"×"}
            </button>
            <div style={{ padding: "30px 20px 20px 20px" }}>
              <h3 style={{ margin: "0 0 20px 0", fontSize: "24px", fontWeight: "600", color: "#5d4037", textAlign: "center" }}>
                Leadership & Governance Score breakdown
              </h3>

              <div style={{ textAlign: "center", marginBottom: "30px", padding: "20px", background: "linear-gradient(135deg, #fdf8f6 0%, #f3e8dc 100%)", borderRadius: "12px", border: "1px solid #d6b88a" }}>
                <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "120px", height: "120px", border: `4px solid ${scoreLevel.color}`, borderRadius: "50%", background: "white", boxShadow: "0 4px 12px rgba(139,69,19,0.2)", marginBottom: "15px" }}>
                  <span style={{ fontSize: "28px", fontWeight: "700", color: "#5d4037", lineHeight: 1 }}>{overallScore}%</span>
                  <span style={{ color: scoreLevel.color, fontSize: "12px", fontWeight: "600", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {scoreLevel.level}
                  </span>
                </div>
                {governanceStage && (
                  <div style={{ marginTop: "6px" }}>
                    <span style={{ display: "inline-block", padding: "6px 16px", background: "#fdecea", border: "1px solid #e6b8ac", borderRadius: "20px", color: "#8d6e63", fontWeight: "600", fontSize: "12px" }}>
                      Governance stage: {governanceStage}
                    </span>
                  </div>
                )}
              </div>

              {!leadershipAiResult && !governanceAiResult && (
                <div style={{ marginBottom: "15px", textAlign: "center" }}>
                  <button onClick={runAiEvaluation} disabled={isEvaluating || !apiKey}
                    style={{ padding: "10px 20px", backgroundColor: isEvaluating ? "#8d6e63" : "#5d4037", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", cursor: isEvaluating || !apiKey ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", opacity: isEvaluating || !apiKey ? 0.7 : 1 }}>
                    {isEvaluating ? (<><RefreshCw size={16} className="spin" />Loading...</>) : (<><RefreshCw size={16} />Load AI analysis</>)}
                  </button>
                </div>
              )}

              <div style={{ fontSize: "11px", color: "#8d6e63", marginBottom: "6px", display: "flex", justifyContent: "space-around" }}>
                <span>Ownership & Structure {SECTION_WEIGHTS.ownership}%</span>
                <span>Leadership Quality {SECTION_WEIGHTS.leadership}%</span>
                <span>Governance Maturity {SECTION_WEIGHTS.maturity}%</span>
              </div>

              <SubSection
                id="ownership"
                title="Ownership & Structure"
                score={ownershipScore}
                breakdown={null}
                aiText={null}
                extra={
                  <div style={{ fontSize: "13px", color: "#5d4037", marginBottom: "10px", lineHeight: 1.6 }}>
                    Directors, shareholders and succession readiness — derived from your board composition, exec / non-exec mix, decision governance and advisory structure.
                    {ownershipDetail && (
                      <div style={{ marginTop: "8px", padding: "10px 14px", background: "white", borderRadius: "8px", border: "1px solid #f0e8e0", fontSize: "12px" }}>
                        Board Structure score: <strong>{ownershipDetail.score}%</strong>
                      </div>
                    )}
                  </div>
                }
              />

              <SubSection
                id="leadership"
                title="Leadership Quality"
                score={leadershipScore}
                breakdown={leadershipBreakdown}
                aiText={leadershipAiResult}
              />

              <SubSection
                id="maturity"
                title="Governance Maturity"
                score={maturityScore}
                breakdown={maturityBreakdown}
                aiText={governanceAiResult}
              />

              {/* ── About Score ── */}
              <div style={{ marginTop: "20px", border: "1px solid #d7ccc8", borderRadius: "8px", overflow: "hidden" }}>
                <div style={{ backgroundColor: "#8d6e63", color: "white", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontWeight: "bold" }}
                  onClick={() => setShowAboutScore(!showAboutScore)}>
                  <span>About this score</span>
                  <ChevronDown size={20} style={{ transform: showAboutScore ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }} />
                </div>
                {showAboutScore && (
                  <div style={{ backgroundColor: "#f5f2f0", padding: "20px", color: "#5d4037", fontSize: "13px", lineHeight: 1.6 }}>
                    <p style={{ marginBottom: "10px" }}>
                      Leadership & Governance answers one question for a funder: <strong>can we trust the people and decision-making structures behind this business?</strong> It replaces the old separate Leadership and Governance/PIS cards with a single view across three areas:
                    </p>
                    <ul style={{ margin: 0, paddingLeft: "18px" }}>
                      <li><strong>Ownership & Structure</strong> — directors, shareholders, succession</li>
                      <li><strong>Leadership Quality</strong> — founder experience, qualifications, industry expertise, execution capability, ambition, learning mindset</li>
                      <li><strong>Governance Maturity</strong> — board, advisors, policies, reporting, risk management, integrity & risk, sanctions, conflicts, legal, reputation</li>
                    </ul>
                  </div>
                )}
              </div>

              {evaluationError && (
                <div style={{ marginTop: "15px", padding: "12px", backgroundColor: "#f8d7da", color: "#721c24", border: "1px solid #f5c6cb", borderRadius: "6px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <AlertCircle size={16} /> {evaluationError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </>
  )
}