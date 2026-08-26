"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { ChevronDown, RefreshCw, AlertCircle } from "lucide-react"
import { db, auth } from "../../firebaseConfig"
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from "firebase/firestore"
import { getFunctions, httpsCallable } from "firebase/functions"
import ScoreExplorer from "./ScoreExplorer"
import {
  buildLegitimacyAssessment,
  buildBallotPrompt,
  buildLegitimacyPrompt,
  parseBallot,
  weightingsByStage,
  STAGE_LABELS,
  CATEGORY_HEADINGS,
  DOCUMENTS_ROUTE,
  fmtPts,
} from "./legitimacy-scoring"

// ─────────────────────────────────────────────────────────────────────────
// LEGITIMACY
//
// Same navigation shell as the other cards. The scoring is untouched —
// buildLegitimacyAssessment is still the single path, verdicts are still
// cached against a fingerprint of the exact value, and the AI still never
// writes a number.
//
//   Home ─┬─ 1. About this score ─┬─ 1.1 Definition
//         │                       ├─ 1.2 Assessment areas
//         │                       ├─ 1.3 Score interpretation
//         │                       └─ 1.4 Score weighting
//         ├─ 2. Your score ── element ─┬─ 2.1 Score breakdown
//         │                            ├─ 2.2 Analysis
//         │                            └─ 2.3 Improvements
//         └─ 3. Potential points ── item detail
//
// There is only one block here, so the explorer skips the block level and
// Your score opens straight onto the four elements:
//
//   Identity Markers · Digital Presence · Track Record · Third-Party
//
// The appeal button ("this verdict is wrong") travels with the item it
// belongs to, into both the breakdown and the improvements tab.
// ─────────────────────────────────────────────────────────────────────────

const ELEMENT_PURPOSE = {
  foundational: "Professional website, business email, logo, physical address and proof of address — the markers a funder checks before anything else.",
  digital: "The web and social channels that matter for your industry. Channels outside that set are not scored, so missing them costs nothing.",
  track: "Years of operation, named clients, revenue history and brands owned — evidence of real commercial activity.",
  thirdParty: "Compliance certificates, accreditations, support letters and association membership — where somebody else vouches for you.",
}

const INTERPRETATION = [
  { range: "91–100%", label: "Market Leader", color: "#1B5E20", meaning: "Exceptional credibility and a strong, trusted market presence." },
  { range: "81–90%", label: "Trusted Brand", color: "#4CAF50", meaning: "Well established, with a professional identity and growing influence." },
  { range: "61–80%", label: "Emerging Force", color: "#FF9800", meaning: "Good foundations. Refining the presence is what strengthens credibility from here." },
  { range: "41–60%", label: "Building Credibility", color: "#F44336", meaning: "The key elements of a professional identity exist, with noticeable gaps around them." },
  { range: "0–40%", label: "Early Stage Identity", color: "#B71C1C", meaning: "Foundational work needed before a funder reads this as an established business." },
]

const getScoreLevel = (score) => {
  if (score >= 91) return { level: "Market Leader", color: "#1B5E20" }
  if (score >= 81) return { level: "Trusted Brand", color: "#4CAF50" }
  if (score >= 61) return { level: "Emerging Force", color: "#FF9800" }
  if (score >= 41) return { level: "Building Credibility", color: "#F44336" }
  return { level: "Early Stage Identity", color: "#B71C1C" }
}

const cleanStr = (v) => (typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim())

// ── AI narrative → per-element findings ──
const normLabel = (s) =>
  String(s || "").toLowerCase().replace(/^\s*\d+[.)]\s*/, "").replace(/[^a-z0-9]/g, "")

const FIELDS = [
  { key: "evidence", label: "What was counted", re: /\*\*\s*Evidence\s*:?\s*\*\*/i },
  { key: "withheld", label: "Why points were withheld", re: /\*\*\s*Points withheld\s*:?\s*\*\*/i, tone: "bad" },
  { key: "rationale", label: "What a funder reads into this", re: /\*\*\s*Rationale\s*:?\s*\*\*/i },
]

export function parseNarrative(text) {
  const map = {}
  let overall = null
  if (!text) return { map, overall }

  String(text)
    .split(/(?=^###\s)/m)
    .forEach((chunk) => {
      const t = chunk.trim()
      if (!t.startsWith("###")) return
      const nl = t.indexOf("\n")
      const heading = t.slice(3, nl === -1 ? undefined : nl).replace(/\*\*/g, "").trim()
      const body = nl === -1 ? "" : t.slice(nl + 1)

      if (/overall/i.test(heading)) {
        const grab = (re) => {
          const m = body.match(re)
          return m ? m[1].replace(/\*\*/g, "").trim() : null
        }
        overall = {
          strongest: grab(/\*\*Strongest section:\*\*\s*(.+)/i),
          weakest: grab(/\*\*Weakest section:\*\*\s*(.+)/i),
          nextStep: grab(/\*\*Highest-value next step:\*\*\s*(.+)/i),
          final: grab(/\*\*Final analysis:\*\*\s*([\s\S]+)/i),
        }
        return
      }

      // "Points available" is deliberately dropped — the code already lists
      // every recoverable item with its exact value under 2.3, and a second
      // list written in prose can only disagree with it.
      const marks = []
      FIELDS.forEach((f) => {
        const m = body.match(f.re)
        if (m) marks.push({ ...f, start: m.index, end: m.index + m[0].length })
      })
      marks.sort((x, y) => x.start - y.start)
      const stopAt = body.search(/\*\*\s*Points available\s*:?\s*\*\*/i)

      const fields = marks.map((mk, i) => {
        let end = i + 1 < marks.length ? marks[i + 1].start : body.length
        if (stopAt > -1 && stopAt > mk.end && stopAt < end) end = stopAt
        return { label: mk.label, tone: mk.tone, text: body.slice(mk.end, end).replace(/\*\*/g, "").trim() }
      })

      map[normLabel(heading)] = { fields: fields.filter((f) => f.text), raw: body.trim() }
    })

  return { map, overall }
}

// ═════════════════════════════════════════════════════════════════════════

export function LegitimacyScoreCard({ styles, profileData, onScoreUpdate, apiKey, onNavigate }) {
  const [showModal, setShowModal] = useState(false)
  const [verdicts, setVerdicts] = useState({})
  const [verdictsLoaded, setVerdictsLoaded] = useState(false)
  const [assessment, setAssessment] = useState(null)
  const [legitimacyScore, setLegitimacyScore] = useState(0)
  const [aiEvaluationResult, setAiEvaluationResult] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluationError, setEvaluationError] = useState("")
  const [evaluationTimestamp, setEvaluationTimestamp] = useState(null)
  const requestedRef = useRef(new Set())

  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : ""
    return () => (document.body.style.overflow = "")
  }, [showModal])

  // ── Free-text verdict cache ──
  useEffect(() => {
    const userId = auth?.currentUser?.uid
    if (!userId) return
    const ref = doc(db, "legitimacyVerdicts", userId)
    const unsub = onSnapshot(
      ref,
      (snap) => { setVerdicts(snap.exists() ? snap.data().verdicts || {} : {}); setVerdictsLoaded(true) },
      (e) => { console.error("Verdict cache error:", e); setVerdictsLoaded(true) }
    )
    return () => unsub()
  }, [auth?.currentUser?.uid])

  // ── Score — pure function of (profile, cached text verdicts) ──
  useEffect(() => {
    if (!profileData) return
    const a = buildLegitimacyAssessment(profileData, verdicts)
    setAssessment(a)
    setLegitimacyScore(a.totalScore)
    if (onScoreUpdate) onScoreUpdate(a.totalScore)
  }, [profileData, verdicts])

  const callAi = async (prompt) => {
    const functions = getFunctions()
    const fn = httpsCallable(functions, "generateLegitimacyAnalysis")
    const resp = await fn({ prompt })
    const content = resp?.data?.content
    if (!content) throw new Error("Invalid response format from server")
    return content
  }

  // ── Free-text verification pass ──
  const runVerification = async (force = false) => {
    const userId = auth?.currentUser?.uid
    if (!userId || !apiKey?.trim() || !profileData) return
    const a = buildLegitimacyAssessment(profileData, force ? {} : verdicts)
    const todo = a.allItems.filter(
      (i) => i.judge && i.present && i.fingerprint && (force || i.state === "pending")
    )
    if (!todo.length) return

    setIsVerifying(true)
    setEvaluationError("")
    try {
      const results = parseBallot(await callAi(buildBallotPrompt(todo, a)))
      const byKey = Object.fromEntries(results.map((r) => [r.key, r]))
      const next = { ...verdicts }
      todo.forEach((item) => {
        const r = byKey[item.key]
        if (!r) return
        next[item.fingerprint] = {
          itemKey: item.key, verdict: r.verdict,
          reason: cleanStr(r.reason), fix: cleanStr(r.fix),
          evidence: item.evidence, checkedAt: new Date().toISOString(),
        }
        requestedRef.current.add(item.fingerprint)
      })
      await setDoc(doc(db, "legitimacyVerdicts", userId), { verdicts: next, updatedAt: new Date() }, { merge: true })
      setVerdicts(next)
    } catch (e) {
      console.error("Verification error:", e)
      setEvaluationError(`The entry check could not finish: ${e.message}. Entries stay counted in full until it succeeds.`)
    } finally {
      setIsVerifying(false)
    }
  }

  useEffect(() => {
    if (!verdictsLoaded || !assessment || !apiKey || isVerifying) return
    const fresh = assessment.unverified.filter((i) => i.fingerprint && !requestedRef.current.has(i.fingerprint))
    if (!fresh.length) return
    fresh.forEach((i) => requestedRef.current.add(i.fingerprint))
    runVerification()
  }, [verdictsLoaded, assessment, apiKey])

  // ── Appeal — only applies to typed entries; documents are re-checked by
  // re-uploading them in My Documents. ──
  const appealVerdict = async (item) => {
    const userId = auth?.currentUser?.uid
    if (!userId || !item.fingerprint) return
    const next = { ...verdicts }
    delete next[item.fingerprint]
    requestedRef.current.delete(item.fingerprint)
    await setDoc(
      doc(db, "legitimacyVerdicts", userId),
      {
        verdicts: next,
        appeals: { [item.fingerprint]: { itemKey: item.key, evidence: item.evidence, at: new Date().toISOString() } },
        updatedAt: new Date(),
      },
      { merge: true }
    )
    setVerdicts(next)
  }

  const runAiEvaluation = async () => {
    if (!apiKey?.trim()) { setEvaluationError("AI analysis is not configured yet."); return }
    if (!profileData) { setEvaluationError("No profile data available to analyse."); return }
    setIsEvaluating(true)
    setEvaluationError("")
    try {
      const a = buildLegitimacyAssessment(profileData, verdicts)
      setAssessment(a)
      setLegitimacyScore(a.totalScore)
      const result = await callAi(buildLegitimacyPrompt(a))
      const timestamp = new Date()
      setAiEvaluationResult(result)
      setEvaluationTimestamp(timestamp.toLocaleString())
      const userId = auth?.currentUser?.uid
      if (userId) {
        await setDoc(
          doc(db, "aiLegitimacyEvaluation", userId),
          { result, score: a.totalScore, timestamp, profileSnapshot: profileData },
          { merge: true }
        )
      }
    } catch (e) {
      console.error("Legitimacy AI evaluation error:", e)
      setEvaluationError(`Analysis failed: ${e.message}`)
    } finally {
      setIsEvaluating(false)
    }
  }

  useEffect(() => {
    if (!auth?.currentUser?.uid) return
    const userId = auth.currentUser.uid
    const profileRef = doc(db, "universalProfiles", userId)
    const aiEvalRef = doc(db, "aiLegitimacyEvaluation", userId)
    const unsub = onSnapshot(profileRef, async (snap) => {
      if (snap.exists() && snap.data().triggerLegitimacyEvaluation === true && !isEvaluating && apiKey) {
        await runVerification()
        await runAiEvaluation()
        await updateDoc(profileRef, { triggerLegitimacyEvaluation: false })
        return
      }
      try {
        const s = await getDoc(aiEvalRef)
        if (s.exists() && s.data().result) {
          setAiEvaluationResult(s.data().result)
          if (s.data().timestamp) setEvaluationTimestamp(new Date(s.data().timestamp.toDate()).toLocaleString())
        }
      } catch (e) { console.error("Error loading saved analysis:", e) }
    })
    return () => unsub()
  }, [auth?.currentUser?.uid, apiKey])

  // ─────────────────────────────────────────────────────────────────────
  // Assemble what the explorer needs
  // ─────────────────────────────────────────────────────────────────────
  const scoreLevel = getScoreLevel(legitimacyScore)
  const a = assessment

  const goTo = (route) => {
    if (!route) return
    if (onNavigate) onNavigate(route)
    else window.location.assign(route)
  }

  const narrative = useMemo(() => parseNarrative(aiEvaluationResult), [aiEvaluationResult])

  const explorer = useMemo(() => {
    if (!a) return null

    // The appeal only exists for typed entries the AI judged — a document
    // verdict is appealed by re-uploading the document, not by arguing.
    const withActions = (item) => ({
      ...item,
      secondaryAction:
        item.judge && item.verdict && item.withheld > 0
          ? { label: "⚑ This is wrong — check it again", onClick: () => appealVerdict(item) }
          : null,
    })

    const elements = a.categories.map((c) => {
      const items = c.items.map(withActions)
      return {
        key: c.key,
        label: c.heading,
        percent: c.percent,
        weight: c.weight,
        effectiveWeight: c.weight,
        breakdown: items,
        improvements: items.filter((i) => i.withheld > 0),
        analysis: narrative.map[normLabel(c.heading)] || null,
        sourceNote:
          c.key === "digital"
            ? `Scored as ${a.digitalProfile.label} — only ${a.digitalProfile.channels.map((ch) => ch.label).join(", ")} count.${a.irrelevantSkipped.length ? " Channels outside this profile are not scored, so missing them costs nothing." : ""}`
            : `${c.earned} of ${c.possible} item points → ${c.percent}% × ${c.weight}% weight = ${c.weightedScore} points of the final score.`,
      }
    })

    const attention = []
    if (a.failedDocs.length) {
      attention.push({
        key: "failedDocs",
        headline: `${a.failedDocs.length} uploaded document${a.failedDocs.length === 1 ? "" : "s"} not counted`,
        detail:
          "These were read when you uploaded them and did not pass. They are on file but earn nothing until a corrected copy replaces them — which is worth doing before a funder finds the same thing.",
        chips: a.failedDocs.map((d) => `${d.label} — ${d.reason || "not verified"}`),
        cta: "Go to My Documents",
        route: DOCUMENTS_ROUTE,
      })
    }
    if (a.unverified.length && isVerifying) {
      attention.push({
        key: "checking",
        headline: `${a.unverified.length} typed entr${a.unverified.length === 1 ? "y is" : "ies are"} being checked`,
        detail:
          "They count in full while the check runs, so the score can only move down from here if something turns out not to be what the field asked for. Nothing is being withheld in the meantime.",
        chips: [],
      })
    }

    return {
      blocks: [
        {
          key: "legitimacy",
          label: "Legitimacy",
          percent: a.totalScore,
          blockWeight: 100,
          elements,
        },
      ],
      attention,
      about: {
        definition:
          "Legitimacy measures how professionally and credibly this business presents itself in the market — beyond legal compliance. It is the brand presence, digital identity and operational transparency that build trust with funders, partners and clients, weighted for your stage.",
        definitionNotes: [
          {
            title: "Uploaded documents",
            body: "Every document was checked when you uploaded it in My Documents — the file itself was read and its type, company name and expiry date confirmed. A verified document counts in full here. One that was rejected or has expired counts for nothing, and the reason shown is the same one on the My Documents page. Re-upload a corrected copy there and the points return.",
          },
          {
            title: "Typed entries",
            body: "Website, email, address, social links, client names and brands are checked separately, since no document backs them. Each is counted in full, at 60%, at 30%, or not at all. The result is stored against the exact value that produced it, so the same entry always earns the same amount — change it and it is checked afresh. If a verdict is wrong, the appeal button on the item clears it and asks for a fresh check.",
          },
          {
            title: "Stage-adjusted weighting",
            body: "Early-stage businesses are weighted more heavily on foundational identity; mature ones are assessed mainly on track record and third-party validation. The same evidence is worth a different amount at a different stage, which is why the weighting table below moves.",
          },
        ],
        assessmentAreas: a.categories.map((c) => ({
          label: c.heading,
          weightLabel: `${c.weight}% at ${a.stageLabel.toLowerCase()}`,
          detail: ELEMENT_PURPOSE[c.key],
        })),
        interpretation: INTERPRETATION,
        weighting: {
          formula: "value = (item points withheld ÷ category points) × stage weight",
          formulaNote:
            "The score is calculated in code, never by the AI — the AI reads the finished numbers and explains them. That is what lets a figure like +5.6% be a promise rather than an estimate.",
          tables: [
            {
              title: `Category weighting — ${a.stageLabel}`,
              firstColumn: "Category",
              rows: a.categories.map((c) => ({
                label: c.label,
                weight: `${c.weight}%`,
                now: `${c.percent}%`,
              })),
              note: `Your business is scored as ${a.stageLabel} in ${a.industry}.`,
            },
            {
              title: "How the weighting moves by stage",
              firstColumn: "Stage",
              rows: Object.entries(weightingsByStage).map(([k, w]) => ({
                label: STAGE_LABELS[k],
                weight: `${w.foundational} · ${w.digital} · ${w.track} · ${w.thirdParty}`,
                now: a.stage === k ? "you" : "—",
                excluded: a.stage !== k,
              })),
              note: "Weights read in order: Identity · Digital · Track record · Third-party.",
            },
          ],
        },
      },
      potential: {
        available: a.availablePoints,
        locked: 0,
        current: a.totalRaw,
        projected: Math.round(a.totalRaw + a.availablePoints),
        items: a.outstanding.map((i) => ({
          ...withActions(i),
          container: i.categoryHeading,
          state: i.present ? (i.earned > 0 ? "partial" : "counted") : "missing",
          fix: i.fix || i.action,
          importance: i.guidance,
        })),
        lockedItems: [],
      },
      summary: narrative.overall,
    }
  }, [a, narrative, isVerifying, verdicts])

  return (
    <>
      {/* ── Card ── */}
      <div style={{ background: "linear-gradient(135deg, #ffffff 0%, #faf8f6 100%)", borderRadius: "20px", boxShadow: "0 8px 32px rgba(141,110,99,0.15)", border: "1px solid #e8ddd6", overflow: "hidden", position: "relative", width: "100%", minWidth: "210px" }}>
          <div style={{ background: "linear-gradient(135deg, #8d6e63 0%, #6d4c41 100%)", padding: "24px 30px 20px 30px", color: "white", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, letterSpacing: "0.5px", whiteSpace: "nowrap" }}>Legitimacy</h2>
          
          </div>
          <p style={{ margin: 0, fontSize: "13px", opacity: 0.9 }}>Business credibility assessment</p>
          <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "80px", height: "80px", background: "rgba(255,255,255,0.1)", borderRadius: "50%", opacity: 0.6 }} />
          <div style={{ position: "absolute", bottom: "-10px", left: "-10px", width: "60px", height: "60px", background: "rgba(255,255,255,0.05)", borderRadius: "50%" }} />
        </div>

        <div style={{ padding: "24px", background: "white", textAlign: "center" }}>
          <div style={{ position: "relative", display: "inline-block", marginBottom: "24px" }}>
            <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "110px", height: "110px", border: `4px solid ${scoreLevel.color}`, borderRadius: "50%", background: "linear-gradient(135deg,#fff 0%,#f8fff8 100%)", color: "#2d2d2d", fontWeight: "bold", boxShadow: `0 6px 20px ${scoreLevel.color}30` }}>
              <span style={{ fontSize: "26px", fontWeight: 800, lineHeight: 1 }}>{legitimacyScore}%</span>
              <div style={{ position: "absolute", top: "-6px", left: "-6px", right: "-6px", bottom: "-6px", border: `2px solid ${scoreLevel.color}20`, borderRadius: "50%", animation: "pulse 2s infinite" }} />
            </div>
            <div style={{ position: "absolute", bottom: "-12px", left: "50%", transform: "translateX(-50%)", backgroundColor: scoreLevel.color, color: "white", padding: "6px 16px", borderRadius: "20px", fontSize: "10px", fontWeight: 600, letterSpacing: "0.5px", boxShadow: `0 4px 12px ${scoreLevel.color}40`, border: "2px solid white", whiteSpace: "nowrap" }}>
              {scoreLevel.level}
            </div>
          </div>

          {/* {a?.failedDocs?.length > 0 && (
            <div style={{ marginTop: "8px", display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 12px", background: "#fdecea", border: "1px solid #e6b8ac", borderRadius: "20px", color: "#B71C1C", fontWeight: 700, fontSize: "10.5px", lineHeight: 1.4 }}>
              <AlertCircle size={12} /> {a.failedDocs.length} document{a.failedDocs.length === 1 ? "" : "s"} not counted
            </div>
          )} */}

          <button onClick={() => setShowModal(true)} style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", background: "linear-gradient(135deg,#5d4037 0%,#4a2c20 100%)", color: "white", marginTop: "12px", border: "none", fontWeight: 600, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", boxShadow: "0 4px 16px rgba(93,64,55,0.3)" }}>
            <span>Explore your score</span><ChevronDown size={16} />
          </button>
        </div>

        <style>{`@keyframes pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.7; } }`}</style>
      </div>

      {/* ── Modal — one screen at a time ── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999999, padding: "20px" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div style={{ position: "relative", backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)", width: "100%", maxWidth: "620px", border: "1px solid #e8ddd6", overflow: "hidden" }}
            onClick={(e) => e.stopPropagation()}>
            {explorer ? (
              <ScoreExplorer
                title="Legitimacy"
                score={legitimacyScore}
                band={scoreLevel}
                contextLine={
                  <>
                    Business stage: <strong style={{ color: "#5d4037" }}>{a.stageLabel}</strong>
                    <div style={{ fontSize: "11.5px", color: "#8d6e63", marginTop: "4px" }}>
                      Identity {a.weights.foundational}% · Digital {a.weights.digital}% · Track record {a.weights.track}% · Third-party {a.weights.thirdParty}%
                    </div>
                  </>
                }
                about={explorer.about}
                blocks={explorer.blocks}
                potential={explorer.potential}
                attention={explorer.attention}
                summary={explorer.summary}
                onNavigate={goTo}
                onClose={() => setShowModal(false)}
                onRequestAnalysis={runAiEvaluation}
                analysisPending={isEvaluating}
                analysisTimestamp={evaluationTimestamp}
                fmtPts={fmtPts}
              />
            ) : (
              <div style={{ padding: "40px", textAlign: "center", color: "#8d6e63", fontSize: "13px" }}>
                <RefreshCw size={18} className="spin" style={{ marginBottom: "10px" }} />
                <div>Working out your score…</div>
              </div>
            )}

            {evaluationError && (
              <div style={{ padding: "12px 16px", backgroundColor: "#f8d7da", color: "#721c24", borderTop: "1px solid #f5c6cb", fontSize: "12.5px", display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertCircle size={15} /> {evaluationError}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </>
  )
}