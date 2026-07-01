"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  RefreshCw,
  AlertCircle,
  Settings,
  CheckCircle,
  TrendingUp,
  XCircle,
  Info,
} from "lucide-react";
import { db, auth } from "../../firebaseConfig";
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { useFirebaseFunctions } from "./hooks";

// ─────────────────────────────────────────────────────────────────────────
// Operational Strength — standalone card.
// Scored ENTIRELY from OperationsOverview.js — nothing else. That form has
// exactly 3 sections + 1 free-text field:
//   1. Supplier & Continuity Risk  (multipleSuppliers, contingencyPlan)
//   2. Delivery (Productivity & Reliability) (trackPerformanceMetrics,
//      threeSuccessfulDeliveries, hasCapacityToIncrease)
//   3. Safety (Risk & Compliance)  (hasFormalProcedures, hasMajorIncidents)
//   + operationalChallenges (free text — narrative context only, not scored,
//     since there's no way to turn open text into an objective 0-5 without
//     the AI inventing criteria that were never actually asked)
// Category 4 of 5 in the taxonomy:
//   1. Compliance   2. Legitimacy   3. Leadership & Governance
//   4. Operational Strength (this file)   5. Financial Strength / Capital Appeal
//
// IMPORTANT: earlier versions of this card also factored in
// entityOverview.fullTimeEmployees under a "Team Capacity & Scale" category.
// That field is NOT part of the Operations Overview page — it's collected on
// Entity Overview — so scoring it here made this card claim to read data it
// never actually fetched from this section. Removed. Every sub-score below
// is one of the 7 literal questions on OperationsOverview.js, nothing else.
// ─────────────────────────────────────────────────────────────────────────

const SUB_COMPONENTS = [
  { key: "supplierContinuity", name: "Supplier & Continuity Risk", weight: 30 },
  { key: "delivery",           name: "Delivery (Productivity & Reliability)", weight: 40 },
  { key: "safety",             name: "Safety (Risk & Compliance)", weight: 30 },
];

export function OperationalStrengthScoreCard({ styles, profileData, onScoreUpdate, apiKey }) {
  const { callFunction } = useFirebaseFunctions();

  const [showModal, setShowModal] = useState(false);
  const [operationalScore, setOperationalScore] = useState(0);
  const [scoreBreakdown, setScoreBreakdown] = useState([]);
  const [aiEvaluationResult, setAiEvaluationResult] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState("");
  const [showAboutScore, setShowAboutScore] = useState(false);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);
  const [triggeredByAuto, setTriggeredByAuto] = useState(false);

  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [showModal]);

  // ── Parse the AI's 3 scored sections out of its markdown response ──
  const parseAiEvaluationScores = (text) => {
    const categories = {
      supplierContinuity: ["Supplier & Continuity Risk"],
      delivery:            ["Delivery (Productivity & Reliability)", "Delivery"],
      safety:               ["Safety (Risk & Compliance)", "Safety"],
    };

    const cleanedText = text.replace(/\*\*(.*?)\*\*/g, "$1");
    const scores = {};
    const confidenceMap = {};
    const evidenceMap = {};
    const confRationaleMap = {};

    // Split into ### chunks and search the WHOLE chunk (heading included),
    // not just the text after the heading's line break — the model
    // sometimes puts "Score: X Confidence: ... Evidence: ..." on the same
    // line as the heading itself, which a body-only search would miss.
    const chunks = cleanedText.split(/(?=###\s)/g);

    Object.entries(categories).forEach(([key, labels]) => {
      let foundScore = null;

      for (const label of labels) {
        const chunk = chunks.find((c) => new RegExp(`###\\s*\\d+\\.\\s*${label}`, "i").test(c));
        if (!chunk) continue;

        const confMatch    = chunk.match(/Confidence\s*:\s*(High|Medium|Low)/i);
        const confRatMatch = chunk.match(/Confidence Rationale\s*:\s*([^\n]+)/i);
        const evidenceMatch= chunk.match(/Evidence\s*:\s*([^\n]+)/i);

        if (confMatch)    confidenceMap[key]   = confMatch[1];
        if (confRatMatch) confRationaleMap[key] = confRatMatch[1].trim();
        if (evidenceMatch) evidenceMap[key]     = evidenceMatch[1].trim();

        const scoreMatch = chunk.match(/Score:?\s*(\d)\s*\/\s*5/i) || chunk.match(/\*\*Score:\*\*\s*(\d)|Score:\s*(\d)/i);
        if (scoreMatch) {
          foundScore = parseInt(scoreMatch[1] ?? scoreMatch[2], 10);
          break;
        }
      }

      scores[key] = foundScore !== null ? Math.min(Math.max(foundScore, 0), 5) : 0;
    });

    scores._confidence    = confidenceMap;
    scores._evidence      = evidenceMap;
    scores._confRationale = confRationaleMap;
    return scores;
  };

  // ── Deterministic (non-AI) fallback score, in case the AI eval hasn't run yet ──
  // Every input here is a literal field from OperationsOverview.js — no data
  // pulled in from Entity Overview or any other page.
  const calculateFallbackSubScores = (data) => {
    const ops = data?.operationsOverview || {};
    const yesNo = (v) => (v === true || v === "yes" || v === "Yes") ? 1 : 0;

    // 1. Supplier & Continuity Risk — Q1 multipleSuppliers, Q2 contingencyPlan
    const supplierContinuity =
      (yesNo(ops.multipleSuppliers) ? 2.5 : 0) +
      (yesNo(ops.contingencyPlan) ? 2.5 : 0);

    // 2. Delivery — Q3 trackPerformanceMetrics, Q4 threeSuccessfulDeliveries, Q5 hasCapacityToIncrease
    const delivery =
      (yesNo(ops.trackPerformanceMetrics) ? 1.7 : 0) +
      (yesNo(ops.threeSuccessfulDeliveries) ? 1.7 : 0) +
      (yesNo(ops.hasCapacityToIncrease) ? 1.6 : 0);

    // 3. Safety — Q6 hasFormalProcedures, Q7 hasMajorIncidents (no incidents = good)
    const safety =
      (yesNo(ops.hasFormalProcedures) ? 2.5 : 0) +
      (ops.hasMajorIncidents === "no" || ops.hasMajorIncidents === false ? 2.5 : 0);

    return { supplierContinuity, delivery, safety };
  };

  const calculateOperationalScore = (data, aiEvaluationResultText = "") => {
    const aiScores = aiEvaluationResultText ? parseAiEvaluationScores(aiEvaluationResultText) : null;
    const fallbackScores = calculateFallbackSubScores(data);

    const colors = ["#8D6E63", "#6D4C41", "#A67C52", "#D7CCC8", "#4E342E"];
    const breakdown = SUB_COMPONENTS.map((cat, i) => {
      const rawScore = aiScores
        ? (aiScores[cat.key] ?? 0)
        : (fallbackScores[cat.key] ?? 0);
      const percent = (rawScore / 5) * 100;
      const weightedScore = (percent / 100) * cat.weight;

      return {
        name: cat.name,
        score: Math.round(percent),
        weight: cat.weight,
        weightedScore: Math.round(weightedScore),
        color: colors[i],
        rawScore: Math.round(rawScore * 10) / 10,
        maxScore: 5,
        active: true,
        source: aiScores ? "ai" : "fallback",
      };
    });

    const totalScore = Math.round(breakdown.reduce((sum, item) => sum + (item.weightedScore || 0), 0));
    return {
      totalScore: Math.min(Math.max(isNaN(totalScore) ? 0 : totalScore, 0), 100),
      breakdown,
    };
  };

  useEffect(() => {
    if (profileData) {
      const result = calculateOperationalScore(profileData, aiEvaluationResult);
      setOperationalScore(result.totalScore);
      setScoreBreakdown(result.breakdown);
      if (onScoreUpdate) onScoreUpdate(result.totalScore);
    }
  }, [profileData, aiEvaluationResult]);

  // Every line below is one literal field from OperationsOverview.js,
  // grouped under the same 3 section headers used on that page, using the
  // actual question wording so the AI can't mistake this for richer data
  // than what was really collected.
  const prepareDataForEvaluation = (data) => {
    const ops = data?.operationsOverview || {};
    let out = "";

    out += `\n=== OPERATIONAL STRENGTH (source: Operations Overview form) ===\n`;

    out += `\n--- Section 1: Supplier & Continuity Risk ---\n`;
    out += `Q1. Relies on more than one key supplier for critical inputs/services: ${ops?.multipleSuppliers || "Not specified"}\n`;
    out += `Q2. Has a documented contingency or continuity plan: ${ops?.contingencyPlan || "Not specified"}\n`;

    out += `\n--- Section 2: Delivery (Productivity & Reliability) ---\n`;
    out += `Q3. Tracks operational performance metrics: ${ops?.trackPerformanceMetrics || "Not specified"}\n`;
    out += `Q4. Delivered at least three contracts successfully in the past 12 months: ${ops?.threeSuccessfulDeliveries || "Not specified"}\n`;
    out += `Q5. Has capacity to increase output without compromising quality: ${ops?.hasCapacityToIncrease || "Not specified"}\n`;

    out += `\n--- Section 3: Safety (Risk & Compliance) ---\n`;
    out += `Q6. Has formal safety, risk, or compliance procedures: ${ops?.hasFormalProcedures || "Not specified"}\n`;
    out += `Q7. Experienced major operational incidents in the past 24 months: ${ops?.hasMajorIncidents || "Not specified"}\n`;

    out += `\n--- Operational Challenges (free text, context only — do not score this on its own) ---\n`;
    out += `${ops?.operationalChallenges || "Not specified"}\n`;

    return out;
  };

  const sendMessageToChatGPT = async (message) => {
    try {
      const result = await callFunction("generateOperationalAnalysis", { prompt: message });
      return result?.content || "";
    } catch (error) {
      console.error("Operational AI Evaluation API Error:", error);
      throw error;
    }
  };

  const runAiEvaluation = async () => {
    if (!apiKey?.trim()) { setEvaluationError("API key not configured."); return; }
    if (!profileData)    { setEvaluationError("No profile data."); return; }

    setIsEvaluating(true);
    setEvaluationError("");

    try {
      const evalData = prepareDataForEvaluation(profileData);

      const combinedMessage = `Evaluate the operational strength of this business — its ability to reliably execute and deliver — using ONLY the Operations Overview data below.

ABSOLUTE SCORE RULES — NEVER VIOLATE:
1. Only reference data explicitly provided in the input below. Do not invent, assume, or infer any operational detail — like team size, technology, headcount, or revenue — that isn't in this input; none of that is collected on this form.
2. If a field says "Not specified", treat it as unproven, not as a positive signal.
3. A score of 0 is valid and expected when there is no supporting evidence.
4. There are exactly 3 scored categories below, matching the 3 sections of the Operations Overview form. Do not add, rename, or split them further.

Categories to evaluate:

### 1. Supplier & Continuity Risk
**Score:** [0-5]
**Evidence:** [cite only Q1 multiple-suppliers and Q2 contingency-plan answers]
**Confidence:** [High | Medium | Low]
**Confidence Rationale:** [one sentence]
**Rationale:** [explanation based only on Q1 and Q2]
**How to Improve:** 
- → [Operations Overview, Section 1]: [specific action]

### 2. Delivery (Productivity & Reliability)
**Score:** [0-5]
**Evidence:** [cite only Q3 performance-tracking, Q4 successful-deliveries, and Q5 capacity-to-increase answers]
**Confidence:** [High | Medium | Low]
**Confidence Rationale:** [one sentence]
**Rationale:** [explanation based only on Q3, Q4, and Q5]
**How to Improve:** 
- → [Operations Overview, Section 2]: [specific action]

### 3. Safety (Risk & Compliance)
**Score:** [0-5]
**Evidence:** [cite only Q6 formal-procedures and Q7 major-incidents answers]
**Confidence:** [High | Medium | Low]
**Confidence Rationale:** [one sentence]
**Rationale:** [explanation based only on Q6 and Q7]
**How to Improve:** 
- → [Operations Overview, Section 3]: [specific action]

### Overall Assessment
**Final Analysis:** [Brief summary referencing only the 7 answers and the operational challenges text provided — do not reference anything else.]

INPUT DATA:
${evalData}`;

      const result = await sendMessageToChatGPT(combinedMessage);
      return result;
    } catch (error) {
      console.error("Operational AI Evaluation error:", error);
      setEvaluationError(`Failed: ${error.message}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  const refreshAiEvaluation = async () => {
    const userId = auth?.currentUser?.uid;
    if (!userId) return;
    try {
      const aiSnap = await getDoc(doc(db, "aiOperationalEvaluations", userId));
      if (aiSnap.exists() && aiSnap.data().result) {
        setAiEvaluationResult(aiSnap.data().result);
        return;
      }
      const result = await runAiEvaluation();
      if (result) {
        await setDoc(doc(db, "aiOperationalEvaluations", userId), {
          result, timestamp: new Date(), profileSnapshot: profileData,
        }, { merge: true });
        setAiEvaluationResult(result);
        setShowDetailedAnalysis(true);
      }
    } catch (error) {
      setEvaluationError(`Failed to refresh: ${error.message}`);
    }
  };

  // ── Auto-trigger + load saved result, same pattern as the other scorecards ──
  useEffect(() => {
    if (!auth?.currentUser?.uid || !apiKey) return;

    const docRef    = doc(db, "universalProfiles", auth.currentUser.uid);
    const aiEvalRef = doc(db, "aiOperationalEvaluations", auth.currentUser.uid);

    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();

        // Shares the Leadership & Governance trigger for now — one flag fires
        // all three AI evaluations together. Give Operational Strength its own
        // triggerOperationalEvaluation flag later once that flow exists.
        if ((data.triggerOperationalEvaluation === true || data.triggerGovernanceEvaluation === true) && !isEvaluating) {
          setTriggeredByAuto(true);
          const result = await runAiEvaluation();

          if (result) {
            await setDoc(aiEvalRef, {
              result, timestamp: new Date(), profileSnapshot: profileData,
            }, { merge: true });
            setAiEvaluationResult(result);
            setShowDetailedAnalysis(true);
          }

          await updateDoc(docRef, { triggerOperationalEvaluation: false });
        }
      }

      try {
        const aiSnap = await getDoc(aiEvalRef);
        if (aiSnap.exists()) {
          const saved = aiSnap.data();
          if (saved.result) setAiEvaluationResult(saved.result);
        }
      } catch (e) { console.error("Load saved eval error:", e); }
    });

    return () => unsubscribe();
  }, [auth?.currentUser?.uid, apiKey, isEvaluating, profileData]);

  const getProgressBarColor = (score) => {
    if (score > 90) return "#1B5E20";
    if (score >= 81) return "#4CAF50";
    if (score >= 61) return "#FF9800";
    if (score >= 41) return "#F44336";
    return "#B71C1C";
  };

  const getScoreLevel = (score) => {
    if (score > 90)  return { level: "Highly reliable execution", color: "#1B5E20", icon: CheckCircle };
    if (score >= 81) return { level: "Strong operational base",   color: "#4CAF50", icon: CheckCircle };
    if (score >= 61) return { level: "Moderate capability",       color: "#FF9800", icon: TrendingUp };
    if (score >= 41) return { level: "Basic capability",          color: "#F44336", icon: AlertCircle };
    return               { level: "Needs development",            color: "#B71C1C", icon: AlertCircle };
  };

  const scoreLevel = getScoreLevel(operationalScore);

  const formatAiResult = (text) => {
    if (!text) return null;
    const cleaned  = text.replace(/\*\*(.*?)\*\*/g, "$1");
    const sections = cleaned.split(/(?=###\s)/g);

    return sections.map((section, index) => {
      const trimmed = section.trim();
      if (!trimmed) return null;

      const headingMatch = trimmed.match(/^###\s*(.+?)(?=\s+Score\s*:|\n|$)/i);
      const heading = headingMatch ? headingMatch[1].trim() : null;
      const rest = heading
        ? trimmed.slice(trimmed.indexOf(heading) + heading.length).replace(/^###\s*/, "").trim()
        : trimmed.replace(/^###\s*/, "");

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
      );
    }).filter(Boolean);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Score Card ── */}
      <div style={{ background: "linear-gradient(135deg, #ffffff 0%, #faf8f6 100%)", borderRadius: "20px", boxShadow: "0 8px 32px rgba(141, 110, 99, 0.15)", border: "1px solid #e8ddd6", overflow: "hidden", position: "relative", width: "100%", minWidth: "210px" }}>
        <div style={{ background: "linear-gradient(135deg, #8d6e63 0%, #6d4c41 100%)", padding: "24px 30px 20px 30px", color: "white", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <h2 style={{ margin: "0", fontSize: "16px", fontWeight: "700", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>Operational Strength</h2>
            <Settings size={24} style={{ opacity: 0.8 }} />
          </div>
          <p style={{ margin: "0", fontSize: "13px", opacity: "0.9" }}>Execution & delivery reliability</p>
          <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "80px", height: "80px", background: "rgba(255,255,255,0.1)", borderRadius: "50%", opacity: "0.6" }} />
          <div style={{ position: "absolute", bottom: "-10px", left: "-10px", width: "60px", height: "60px", background: "rgba(255,255,255,0.05)", borderRadius: "50%" }} />
        </div>

        <div style={{ padding: "24px", background: "white", textAlign: "center" }}>
          <div style={{ position: "relative", display: "inline-block", marginBottom: "24px" }}>
            <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "110px", height: "110px", border: `4px solid ${scoreLevel.color}`, borderRadius: "50%", background: "linear-gradient(135deg, #ffffff 0%, #f8fff8 100%)", boxShadow: `0 6px 20px ${scoreLevel.color}30`, fontWeight: "bold" }}>
              <span style={{ fontSize: "26px", fontWeight: "800", lineHeight: "1", marginBottom: "2px" }}>{operationalScore}%</span>
              <div style={{ position: "absolute", top: "-6px", left: "-6px", right: "-6px", bottom: "-6px", border: `2px solid ${scoreLevel.color}20`, borderRadius: "50%", animation: "pulse 2s infinite" }} />
            </div>
            <div style={{ position: "absolute", bottom: "-12px", left: "50%", transform: "translateX(-50%)", backgroundColor: scoreLevel.color, color: "white", padding: "6px 16px", borderRadius: "20px", fontSize: "10px", fontWeight: "600", textTransform: "capitalize", letterSpacing: "0.5px", boxShadow: `0 4px 12px ${scoreLevel.color}40`, border: "2px solid white", whiteSpace: "nowrap" }}>
              {scoreLevel.level}
            </div>
          </div>

          <button onClick={() => setShowModal(true)} style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", background: "linear-gradient(135deg, #5d4037 0%, #4a2c20 100%)", color: "white", marginTop: "15px", border: "none", fontWeight: "600", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "all 0.3s ease", boxShadow: "0 4px 16px rgba(93,64,55,0.3)", whiteSpace: "nowrap" }}
            onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(93,64,55,0.4)"; }}
            onMouseOut={(e)  => { e.currentTarget.style.transform = "translateY(0px)";  e.currentTarget.style.boxShadow = "0 4px 16px rgba(93,64,55,0.3)"; }}>
            <span>Score breakdown</span>
            <ChevronDown size={16} />
          </button>
        </div>

        <style>{`@keyframes pulse { 0%,100% { transform:scale(1); opacity:1; } 50% { transform:scale(1.05); opacity:0.7; } }`}</style>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999999, padding: "20px" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ position: "relative", backgroundColor: "#ffffff", borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)", zIndex: 999999, maxHeight: "90vh", overflowY: "auto", width: "90%", maxWidth: "760px", border: "1px solid #ccc" }}
            onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowModal(false)}
              style={{ position: "absolute", top: "15px", right: "15px", background: "#fff", border: "2px solid #ddd", fontSize: "20px", cursor: "pointer", color: "#666", zIndex: 999999, width: "35px", height: "35px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontWeight: "bold" }}
            >
              {"×"}
            </button>
            <div style={{ padding: "30px 20px 20px 20px" }}>
              <h3 style={{ margin: "0 0 20px 0", fontSize: "24px", fontWeight: "600", color: "#5d4037", textAlign: "center" }}>
                Operational Strength Score breakdown
              </h3>

              <div style={{ textAlign: "center", marginBottom: "30px", padding: "20px", background: "linear-gradient(135deg, #fdf8f6 0%, #f3e8dc 100%)", borderRadius: "12px", border: "1px solid #d6b88a" }}>
                <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "120px", height: "120px", border: `4px solid ${scoreLevel.color}`, borderRadius: "50%", background: "white", boxShadow: "0 4px 12px rgba(139,69,19,0.2)", marginBottom: "15px" }}>
                  <span style={{ fontSize: "28px", fontWeight: "700", color: "#5d4037", lineHeight: "1" }}>{operationalScore}%</span>
                  <span style={{ color: scoreLevel.color, fontSize: "12px", fontWeight: "600", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{scoreLevel.level}</span>
                </div>
                <div style={{ fontSize: "16px", color: "#6d4c41" }}>
                  <span>Business stage: </span>
                  <span style={{ fontWeight: "600", color: "#5d4037", textTransform: "capitalize" }}>
                    {profileData?.entityOverview?.operationStage || "Ideation"}
                  </span>
                </div>
              </div>

              {isEvaluating && (
                <p style={{ color: "#5d4037", fontSize: "14px", marginTop: "10px" }}>
                  <RefreshCw size={16} style={{ marginRight: "6px" }} />
                  Running AI analysis...
                </p>
              )}

              {!aiEvaluationResult && (
                <div style={{ marginTop: "5px", marginBottom: "15px" }}>
                  <button onClick={refreshAiEvaluation} disabled={isEvaluating || !apiKey}
                    style={{ padding: "10px 20px", backgroundColor: isEvaluating ? "#8d6e63" : "#5d4037", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", cursor: isEvaluating || !apiKey ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "14px", opacity: isEvaluating || !apiKey ? 0.7 : 1 }}>
                    {isEvaluating
                      ? (<><div style={{ width: "16px", height: "16px", border: "2px solid #fff", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />Loading...</>)
                      : (<><RefreshCw size={16} />Load AI analysis</>)}
                  </button>
                </div>
              )}

              {/* ── About Score ── */}
              <div style={{ marginTop: "20px", border: "1px solid #d7ccc8", borderRadius: "8px", overflow: "hidden" }}>
                <div style={{ backgroundColor: "#8d6e63", color: "white", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontWeight: "bold" }}
                  onClick={() => setShowAboutScore(!showAboutScore)}>
                  <span>About Operational Strength</span>
                  <ChevronDown size={20} style={{ transform: showAboutScore ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }} />
                </div>
                {showAboutScore && (
                  <div style={{ backgroundColor: "#f5f2f0", padding: "20px", color: "#5d4037" }}>
                    <p style={{ marginBottom: "16px", lineHeight: "1.6" }}>
                      Operational Strength measures whether this business can reliably execute and deliver — supplier &amp; continuity risk, delivery reliability, and safety/compliance, drawn entirely from the Operations Overview form. It is one of the five pillars of the overall BIG Score, alongside Compliance, Legitimacy, Leadership &amp; Governance, and Financial Strength / Capital Appeal.
                    </p>
                    <div style={{ backgroundColor: "#efebe9", padding: "14px", borderRadius: "8px", borderLeft: "4px solid #8d6e63" }}>
                      <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>Sub-component weighting:</p>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                        <thead>
                          <tr style={{ backgroundColor: "#d7ccc8" }}>
                            <th style={{ padding: "6px 10px", textAlign: "left", color: "#5d4037" }}>Component</th>
                            <th style={{ padding: "6px 10px", textAlign: "center", color: "#5d4037", borderLeft: "1px solid #c5b8b0" }}>Weight</th>
                          </tr>
                        </thead>
                        <tbody>
                          {SUB_COMPONENTS.map((c, i) => (
                            <tr key={c.key} style={{ backgroundColor: i % 2 === 0 ? "white" : "#f5f0ec" }}>
                              <td style={{ padding: "6px 10px" }}>{c.name}</td>
                              <td style={{ padding: "6px 10px", textAlign: "center", fontWeight: "600", borderLeft: "1px solid #e0d5cf" }}>{c.weight}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Score Breakdown ── */}
              <div style={{ marginTop: "20px", border: "1px solid #d7ccc8", borderRadius: "8px", overflow: "hidden" }}>
                <div style={{ backgroundColor: "#8d6e63", color: "white", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontWeight: "bold" }}
                  onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}>
                  <span>Score breakdown</span>
                  <ChevronDown size={20} style={{ transform: showScoreBreakdown ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }} />
                </div>
                {showScoreBreakdown && (
                  <div style={{ backgroundColor: "#f5f2f0", padding: "20px" }}>
                    {!aiEvaluationResult && (
                      <div style={{ fontSize: "11px", color: "#8d6e63", fontStyle: "italic", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Info size={12} /> Showing a provisional score from profile data. Load AI analysis above for evidence-based scoring.
                      </div>
                    )}
                    {scoreBreakdown.map((item, i) => (
                      <div key={i} style={{ padding: "12px 15px", background: "white", marginBottom: "6px", borderRadius: "8px", border: "1px solid #f0e8e0" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", flex: "1", minWidth: "180px" }}>
                            <div style={{ backgroundColor: item.color, width: "12px", height: "12px", borderRadius: "50%", marginRight: "12px", marginTop: "3px", flexShrink: 0 }} />
                            <div>
                              <div style={{ fontWeight: "600", color: "#5d4037", fontSize: "14px", marginBottom: "2px" }}>{item.name}</div>
                              <div style={{ fontSize: "12px", color: "#8d6e63", fontStyle: "italic" }}>
                                {item.rawScore}/{item.maxScore} × {item.weight}% weight = {item.weightedScore}%
                              </div>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: "100px", justifyContent: "flex-end" }}>
                            <div style={{ width: "80px", height: "8px", background: "#f3e8dc", borderRadius: "4px", overflow: "hidden", border: "1px solid #d6b88a" }}>
                              <div style={{ width: `${item.score}%`, height: "100%", background: getProgressBarColor(item.score), borderRadius: "4px", transition: "width 0.3s ease" }} />
                            </div>
                            <span style={{ fontWeight: "600", color: "#5d4037", fontSize: "14px", minWidth: "35px", textAlign: "right" }}>{item.score}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Detailed Analysis ── */}
              <div style={{ marginTop: "20px", border: "1px solid #d7ccc8", borderRadius: "8px", overflow: "hidden" }}>
                <div style={{ backgroundColor: "#8d6e63", color: "white", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontWeight: "bold" }}
                  onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}>
                  <span>Detailed analysis</span>
                  <ChevronDown size={20} style={{ transform: showDetailedAnalysis ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }} />
                </div>
                {showDetailedAnalysis && (
                  <div style={{ backgroundColor: "#f5f2f0", padding: "20px" }}>
                    {aiEvaluationResult ? (
                      <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", border: "1px solid #e8d8cf", maxHeight: "400px", overflowY: "auto" }}>
                        {formatAiResult(aiEvaluationResult)}
                      </div>
                    ) : (
                      <div style={{ color: "#5d4037", lineHeight: "1.6" }}>
                        {operationalScore > 90  && <p><strong>Highly reliable execution.</strong> Strong operational capability across all key areas.</p>}
                        {operationalScore >= 81 && operationalScore <= 90 && <p><strong>Strong operational base.</strong> Solid execution with minor areas to enhance.</p>}
                        {operationalScore >= 61 && operationalScore <= 80 && <p><strong>Moderate capability.</strong> Reasonable foundations but several areas need strengthening.</p>}
                        {operationalScore >= 41 && operationalScore <= 60 && <p><strong>Basic capability.</strong> Substantial development needed across key areas.</p>}
                        {operationalScore <= 40  && <p><strong>Needs development.</strong> Significant strengthening needed before this business can reliably scale delivery.</p>}
                      </div>
                    )}
                    {evaluationError && (
                      <div style={{ marginTop: "15px", padding: "12px", backgroundColor: "#f8d7da", color: "#721c24", border: "1px solid #f5c6cb", borderRadius: "6px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <AlertCircle size={16} /> {evaluationError}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </>
  );
}