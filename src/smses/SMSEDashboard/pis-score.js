"use client"

import { useState, useEffect } from "react";
import { ChevronDown, RefreshCw, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { db, auth } from "../../firebaseConfig";
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { API_KEYS } from '../../API';
import { getFunctions, httpsCallable } from "firebase/functions";

export function PISScoreCard({ styles, profileData, onScoreUpdate ,apiKey}) {
  const [showModal, setShowModal] = useState(false);
  const [pisScore, setPisScore] = useState(0);
  const [governanceScore, setGovernanceScore] = useState(0);
  const [scoreBreakdown, setScoreBreakdown] = useState([]);
  const [aiEvaluationResult, setAiEvaluationResult] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState('');
  const [showAboutScore, setShowAboutScore] = useState(false);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);
  const [governanceStage, setGovernanceStage] = useState("");
  const [governanceRecommendation, setGovernanceRecommendation] = useState("");
  const [triggeredByAuto, setTriggeredByAuto] = useState(true);

  

  // Add/remove body class to prevent scrolling when modal is open
  // ⬇️ Add this effect (after parseAiEvaluation, before other effects)
useEffect(() => {
  if (!aiEvaluationResult) return;

  const parsed = parseAiEvaluation(aiEvaluationResult);

  // Keep all local states in sync from the parsed AI result
  setPisScore(parsed.pis || 0);
  setGovernanceScore(parsed.govScore || 0);
  setScoreBreakdown(parsed.breakdown || []);
  setGovernanceStage(parsed.stage || "");
  setGovernanceRecommendation(parsed.recommendation || "");

  // Notify parent with the current overall score
  if (onScoreUpdate) onScoreUpdate(parsed.govScore || 0);
}, [aiEvaluationResult, profileData]); // include profileData so fallback PIS recalculation can use latest data


  useEffect(() => {
    document.body.style.overflow = showModal ? 'hidden' : '';
    return () => document.body.style.overflow = '';
  }, [showModal]);
  

  const refreshAiEvaluation = async () => {
    const userId = auth?.currentUser?.uid;
    if (!userId) return;

    try {
      const aiEvalRef = doc(db, "aiGovernanceEvaluation", userId);
      const aiSnap = await getDoc(aiEvalRef);

      if (aiSnap.exists()) {
        const saved = aiSnap.data();
        if (saved.result) {
          console.log("Refreshing AI evaluation result");
          setAiEvaluationResult(saved.result);
          return;
        }
      }

      // If no saved result, run new evaluation
      console.log("No saved result found, running new evaluation");
      await runAiEvaluation();
    } catch (error) {
      console.error("Error refreshing AI evaluation:", error);
      setEvaluationError(`Failed to refresh evaluation: ${error.message}`);
    }
  };

const sendMessageToChatGPT = async (message) => {
  try {
    const functions = getFunctions(); // optionally: getFunctions(undefined, "us-central1")
    const fn = httpsCallable(functions, "generateGovernanceAnalysis");
    const resp = await fn({ prompt: message });
    const content = resp?.data?.content;
    if (!content) throw new Error("Empty response from analysis function.");
    return content;
  } catch (err) {
    console.error("Callable error:", err);
    throw new Error(
      err?.message || "Failed to generate governance analysis."
    );
  }
};

  const parseAiEvaluation = (text) => {
  const raw = text || "";
  // Strip bold markers so "**Governance Score**: 75%" becomes "Governance Score: 75%"
  const cleaned = raw.replace(/\*\*/g, "");

  // --- PIS ---
  let pis = 0;
  const pisRegexes = [
    /PIS\s*Score\s*[:\-–—]?\s*([\d.]+)/i,      // "PIS Score: 72.72"
    /PIS[^=]{0,20}=\s*([\d.]+)/i,              // "PIS = 72.72" or "\text{PIS} = 72.72"
  ];
  for (const rx of pisRegexes) {
    const m = cleaned.match(rx);
    if (m) { pis = parseFloat(m[1]); break; }
  }

  // Fallback: recalc from profileData if PIS is missing/invalid or tiny
  if ((!pis || isNaN(pis)) && profileData) {
    const employees = parseInt(profileData?.entityOverview?.employeeCount) || 0;
    const turnover = parseInt(profileData?.financialOverview?.annualRevenue) || 0;
    const liabilities = (profileData?.financialOverview?.existingDebt || "R0").replace(/[^0-9]/g, "") || 0;
    const shareholders = profileData?.shareholders?.length || 1;
    pis = employees + Math.floor(turnover / 1_000_000) + Math.floor(liabilities / 1_000_000) + shareholders;
  }

  // --- Governance Score ---
  let govScore = 0;
  const govRegexes = [
    /(?:Overall\s*)?Governance\s*Score\s*[:\-–—]?\s*([\d.]+)\s*%/i, // "Governance Score: 75%" / "Overall Governance Score – 75%"
    /Governance\s*:\s*([\d.]+)\s*%/i,                              // "Governance: 75%"
  ];
  for (const rx of govRegexes) {
    const m = cleaned.match(rx);
    if (m) { govScore = Math.round(parseFloat(m[1])); break; }
  }

  // --- Stage ---
  let stage = "";
  if (/Advisors Stage/i.test(cleaned)) stage = "Advisors Stage";
  else if (/Emerging Board Stage/i.test(cleaned)) stage = "Emerging Board Stage";
  else if (/Full Board Stage/i.test(cleaned)) stage = "Full Board Stage";

  // --- Recommendation ---
  let recommendation = "";
  if (/Advisors sufficient/i.test(cleaned)) recommendation = "Advisors sufficient";
  else if (/Informal board recommended/i.test(cleaned)) recommendation = "Informal board recommended";
  else if (/Formal board strongly recommended/i.test(cleaned)) recommendation = "Formal board strongly recommended";

  // --- Category breakdown ---
  const breakdown = [];
  const categoryRegex = /([A-Za-z &()\/]+)\s*:\s*(\d+)\s*\/\s*(\d+)/g;
  const colors = ["#8D6E63", "#6D4C41", "#A67C52", "#5D4037", "#4E342E"];
  let i = 0, match;
  while ((match = categoryRegex.exec(cleaned)) !== null) {
    breakdown.push({
      name: match[1].trim(),
      score: parseInt(match[2]),
      max: parseInt(match[3]),
      color: colors[i % colors.length],
    });
    i++;
  }

  return {
    pis,
    govScore,
    stage,
    recommendation,
    breakdown,
    analysis: raw,
  };
};


  const runAiEvaluation = async () => {
    if (!apiKey?.trim()) {
      setEvaluationError('OpenAI API key not configured.');
      return;
    }

    if (!profileData) {
      setEvaluationError('No profile data available for evaluation.');
      return;
    }

    // Clear previous results before running new evaluation
    setIsEvaluating(true);
    setEvaluationError('');
    setAiEvaluationResult('');
    setPisScore(0);
    setGovernanceScore(0);
    setScoreBreakdown([]);
    setGovernanceStage("");
    setGovernanceRecommendation("");

    try {
      const evaluationData = prepareDataForAiEvaluation(profileData);

      const prompt = `Evaluate the business's governance readiness using the Public Interest Score (PIS) system.

1. First calculate the PIS score using EXACTLY THESE VALUES:
   Employees: ${profileData?.entityOverview?.employeeCount || 0}
   Annual Turnover: R${profileData?.financialOverview?.annualRevenue || 0}
   Liabilities: ${profileData?.financialOverview?.existingDebt || 'R0'}
   Shareholders: ${profileData?.shareholders?.length || 1}
   
   PIS = Employees + (Turnover/R1m) + (Liabilities/R1m) + Shareholders

2. Then evaluate governance maturity based on PIS level:
   - PIS < 100: Advisors Stage rubric
   - PIS 100-349: Emerging Board Stage rubric
   - PIS ≥ 350: Full Board Stage rubric

3. For each category in the appropriate rubric:
   - Score from 0 to max points
   - Provide specific rationale for the score
   - Highlight strengths and weaknesses

4. Finally, provide:
   - Overall governance score (0-100%)
   - Governance stage
   - Clear recommendation
   - Actionable improvement suggestions

Input Data:
${evaluationData}

Output Format:
PIS Score: [calculated PIS]
Governance Stage: [stage]
Governance Recommendation: [recommendation]
Governance Score: [score]%

**Category Breakdown:**
1. [Category Name]: [score]/[max] - [rationale]
2. [Category Name]: [score]/[max] - [rationale]
...

**Detailed Analysis:**
[paragraphs of detailed analysis]`;

      const result = await sendMessageToChatGPT(prompt);
      const parsed = parseAiEvaluation(result);

      setPisScore(parsed.pis);
      setGovernanceScore(parsed.govScore);
      setScoreBreakdown(parsed.breakdown);
      setGovernanceStage(parsed.stage);
      setGovernanceRecommendation(parsed.recommendation);
      setAiEvaluationResult(parsed.analysis);
      setShowDetailedAnalysis(true);

      // Save to Firestore
      const userId = auth?.currentUser?.uid;
      if (userId) {
        const aiEvalRef = doc(db, "aiGovernanceEvaluation", userId);
        await setDoc(aiEvalRef, {
          result: parsed.analysis,
          pisScore: parsed.pis,
          governanceScore: parsed.govScore,
          timestamp: new Date(),
          profileSnapshot: profileData
        }, { merge: true });
      }

      if (onScoreUpdate) onScoreUpdate(parsed.govScore);
    } catch (error) {
      console.error('AI Evaluation error:', error);
      setEvaluationError(`Failed to get AI evaluation: ${error.message}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  const prepareDataForAiEvaluation = (data) => {
    let evaluationData = '=== BUSINESS DATA ===\n';

    // PIS Calculation Components
    evaluationData += `Employees: ${data?.entityOverview?.employeeCount || 0}\n`;
    evaluationData += `Annual Turnover: R${data?.financialOverview?.annualRevenue || 0}\n`;
    evaluationData += `Liabilities: ${data?.financialOverview?.existingDebt || 'R0'}\n`;
    evaluationData += `Shareholders: ${data?.shareholders?.length || 1}\n\n`;

    // Governance Factors
    evaluationData += '=== GOVERNANCE FACTORS ===\n';
    evaluationData += `Directors: ${data?.ownershipManagement?.directors?.length || 0}\n`;
    evaluationData += `Has Advisors: ${data?.enterpriseReadiness?.hasAdvisors === 'yes' ? 'Yes' : 'No'}\n`;
    evaluationData += `Audited Financials: ${data?.enterpriseReadiness?.hasAuditedFinancials === 'yes' ? 'Yes' : 'No'}\n`;
    evaluationData += `BB-BEE Level: ${data?.legalCompliance?.bbbeeLevel || 'Not provided'}\n`;
    evaluationData += `Board Meetings: ${data?.enterpriseReadiness?.advisorsMeetingFrequency || 'Not specified'}\n`;

    return evaluationData;
  };

  // Load saved evaluation if exists
  useEffect(() => {
    const userId = auth?.currentUser?.uid;
    if (!userId) return;

    const loadSavedEvaluation = async () => {
      const aiEvalRef = doc(db, "aiGovernanceEvaluation", userId);
      const docSnap = await getDoc(aiEvalRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.result) {
          const parsed = parseAiEvaluation(data.result);
          setPisScore(data.pisScore || 0);
          setGovernanceScore(data.governanceScore || 0);
          setAiEvaluationResult(data.result);
          setGovernanceStage(parsed.stage);
          setGovernanceRecommendation(parsed.recommendation);
          setScoreBreakdown(parsed.breakdown);
        }
      }
    };

    loadSavedEvaluation();
  }, [auth?.currentUser?.uid]);

  // Trigger evaluation when profile data changes or manual trigger
  useEffect(() => {
    if (!auth?.currentUser?.uid || !apiKey) return;

    const docRef = doc(db, "universalProfiles", auth.currentUser.uid);
    const aiEvalRef = doc(db, "aiGovernanceEvaluation", auth.currentUser.uid);

    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (!docSnap.exists()) return;

      const data = docSnap.data();
    if (data.triggerLegitimacyEvaluation === true && !isEvaluating) {

        console.log("Trigger detected: Running PIS AI evaluation...");
       

        const result = await runAiEvaluation(); // This already saves to Firestore internally

        // Reset the trigger
           await updateDoc(docRef, { triggerLegitimacyEvaluation: false });

        // Also ensure result is loaded into state if not already
        const aiSnap = await getDoc(aiEvalRef);
        if (aiSnap.exists()) {
          const saved = aiSnap.data();
          if (saved.result) {
            const parsed = parseAiEvaluation(saved.result);
            setPisScore(saved.pisScore || 0);
            setGovernanceScore(saved.governanceScore || 0);
            setAiEvaluationResult(saved.result);
            setGovernanceStage(parsed.stage);
            setGovernanceRecommendation(parsed.recommendation);
            setScoreBreakdown(parsed.breakdown);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [auth?.currentUser?.uid,apiKey, isEvaluating]);

  const getProgressBarColor = (score) => {
    if (score > 90) return "#1B5E20";
    if (score >= 81) return "#4CAF50";
    if (score >= 61) return "#FF9800";
    if (score >= 41) return "#F44336";
    return "#B71C1C";
  };

  const getScoreLevel = (score) => {
    if (score > 90) return { level: "Strong Governance", color: "#1B5E20", icon: CheckCircle };
    if (score >= 81) return { level: "Strong Governance", color: "#4CAF50", icon: CheckCircle };
    if (score >= 61) return { level: "Adequate", color: "#FF9800", icon: TrendingUp };
    if (score >= 41) return { level: "Weak Governance", color: "#F44336", icon: AlertCircle };
    return { level: "Poor Governance", color: "#B71C1C", icon: AlertCircle };
  };

  const formatAiResult = (text) => {
    if (!text) return null;

    // Split into sections
    const sections = text.split(/(?=\*\*[A-Za-z ]+:\*\*|\n\n)/g);

    return sections.map((section, index) => {
      const trimmed = section.trim();
      if (!trimmed) return null;

      const isHeader = trimmed.startsWith("**") && trimmed.includes(":**");

      return (
        <div key={index} style={{ marginBottom: "15px" }}>
          {isHeader ? (
            <div style={{
              fontWeight: "bold",
              color: "#5d4037",
              fontSize: "16px",
              marginBottom: "8px",
              paddingBottom: "5px",
              borderBottom: "1px solid #e8d8cf"
            }}>
              {trimmed.split('\n')[0].replace(/\*\*/g, '')}
            </div>
          ) : null}
          <div style={{
            fontSize: "14px",
            lineHeight: "1.6",
            color: "#6d4c41",
            whiteSpace: "pre-wrap"
          }}>
            {isHeader ? trimmed.split('\n').slice(1).join('\n') : trimmed}
          </div>
        </div>
      );
    }).filter(Boolean);
  };

  const scoreLevel = getScoreLevel(governanceScore);
  const ScoreIcon = scoreLevel.icon;

  return (
    <>
      {/* Enhanced Outside Card Design */}
      <div style={{
        background: "linear-gradient(135deg, #ffffff 0%, #faf8f6 100%)",
    borderRadius: "20px",
    boxShadow: "0 8px 32px rgba(141, 110, 99, 0.15)",
    border: "1px solid #e8ddd6",
    overflow: "hidden",
    position: "relative",
    width: "100%", // Add this line to make it full width
    minWidth: "210px", // Add this for minimum width
    maxWidth: "000px", // Add this to limit maximum width (optional)
      }}>
        {/* Header with gradient */}
        <div style={{
          background: "linear-gradient(135deg, #8d6e63 0%, #6d4c41 100%)",
          padding: "24px 30px 20px 30px",
          color: "white",
          position: "relative"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "8px"
          }}>
            <h2 style={{
              margin: "0",
              fontSize: "16px",
              fontWeight: "700",
              letterSpacing: "0.5px",
              whiteSpace: "nowrap"
            }}>Governance Score</h2>
          </div>
          <p style={{
            margin: "0",
            fontSize: "13px",
            opacity: "0.9",
            fontWeight: "400"
          }}>Assess compliance readiness </p>

          {/* Decorative elements */}
          <div style={{
            position: "absolute",
            top: "-20px",
            right: "-20px",
            width: "80px",
            height: "80px",
            background: "rgba(255, 255, 255, 0.1)",
            borderRadius: "50%",
            opacity: "0.6"
          }}></div>
          <div style={{
            position: "absolute",
            bottom: "-10px",
            left: "-10px",
            width: "60px",
            height: "60px",
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: "50%"
          }}></div>
        </div>

        {/* Main Content Area */}
        <div style={{
          padding: "24px",
          background: "white",
          textAlign: "center"
        }}>
          {/* Score Circle with Connected Badge */}
          <div style={{
            position: "relative",
            display: "inline-block",
            marginBottom: "24px"
          }}>
            {/* Main Score Circle */}
            <div style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "110px",
              height: "110px",
              border: `4px solid ${scoreLevel.color}`,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #ffffff 0%, #f8fff8 100%)",
              boxShadow: `0 6px 20px ${scoreLevel.color}30`,
              color: "#2d2d2d",
              fontWeight: "bold"
            }}>
              <span style={{
                fontSize: "26px",
                fontWeight: "800",
                lineHeight: "1",
                marginBottom: "2px"
              }}>{governanceScore}%</span>
              <span style={{
                fontSize: "11px",
                fontWeight: "600",
                color: scoreLevel.color,
                textTransform: "uppercase",
                letterSpacing: "1px"
              }}>{governanceRecommendation.split(' ')[0]}</span>

              {/* Animated ring */}
              <div style={{
                position: "absolute",
                top: "-6px",
                left: "-6px",
                right: "-6px",
                bottom: "-6px",
                border: `2px solid ${scoreLevel.color}20`,
                borderRadius: "50%",
                animation: "pulse 2s infinite"
              }}></div>
            </div>

            {/* Connected Status Badge */}
            <div style={{
              position: "absolute",
              bottom: "-12px",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: scoreLevel.color,
              color: "white",
              padding: "6px 16px",
              borderRadius: "20px",
              fontSize: "10px",
              fontWeight: "600",
              textTransform: "capitalize",
              letterSpacing: "0.5px",
              boxShadow: `0 4px 12px ${scoreLevel.color}40`,
              border: "2px solid white",
              whiteSpace: "nowrap"
            }}>
              {scoreLevel.level}
            </div>
          </div>

          {/* Action Button */}
      <button
  onClick={() => setShowModal(true)}
  style={{
    width: "100%",
    padding: "12px 16px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #5d4037 0%, #4a2c20 100%)",
    color: "white",
    border: "none",
    fontWeight: "600",
    fontSize: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 16px rgba(93, 64, 55, 0.3)",
    whiteSpace: "nowrap",
    marginTop: "18px" // 👈 added this line to bring it down
  }}
  onMouseOver={(e) => {
    e.target.style.transform = "translateY(-2px)";
    e.target.style.boxShadow = "0 6px 20px rgba(93, 64, 55, 0.4)";
  }}
  onMouseOut={(e) => {
    e.target.style.transform = "translateY(0px)";
    e.target.style.boxShadow = "0 4px 16px rgba(93, 64, 55, 0.3)";
  }}
>
  <span>Score breakdown</span>
  <ChevronDown size={16} />
</button>

        </div>

        {/* CSS Animations */}
        <style jsx>{`
          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.05);
              opacity: 0.7;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}</style>
      </div>

      {/* Enhanced Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            right: "0",
            bottom: "0",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: "999999",
            padding: "20px"
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div
            style={{
              position: "relative",
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
              zIndex: "999999",
              maxHeight: "90vh",
              overflowY: "auto",
              width: "90%",
              maxWidth: "700px",
              border: "1px solid #ccc"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: "absolute",
                top: "15px",
                right: "15px",
                background: "#fff",
                border: "2px solid #ddd",
                fontSize: "20px",
                cursor: "pointer",
                color: "#666",
                zIndex: "999999",
                width: "35px",
                height: "35px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                fontWeight: "bold"
              }}
            >
              ×
            </button>

            <div style={{ padding: "30px 20px 20px 20px" }}>
              <h3 style={{
                margin: "0 0 20px 0",
                fontSize: "24px",
                fontWeight: "600",
                color: "#5d4037",
                textAlign: "center"
              }}>Governance score breakdown</h3>

              <div style={{
                textAlign: "center",
                marginBottom: "30px",
                padding: "20px",
                background: "linear-gradient(135deg, #fdf8f6 0%, #f3e8dc 100%)",
                borderRadius: "12px",
                border: "1px solid #d6b88a"
              }}>
                <div style={{
                  display: "inline-flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "120px",
                  height: "120px",
                  border: `4px solid ${scoreLevel.color}`,
                  borderRadius: "50%",
                  background: "white",
                  boxShadow: "0 4px 12px rgba(139, 69, 19, 0.2)",
                  marginBottom: "15px"
                }}>
                  <span style={{
                    fontSize: "28px",
                    fontWeight: "700",
                    color: "#5d4037",
                    lineHeight: "1"
                  }}>{governanceScore}%</span>
                  <span style={{
                    color: scoreLevel.color,
                    fontSize: "12px",
                    fontWeight: "600",
                    marginTop: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    {scoreLevel.level}
                  </span>
                </div>

                <div style={{
                  fontSize: "16px",
                  color: "#6d4c41",
                  marginBottom: "15px"
                }}>
                  <span>Governance status: </span>
                  <span style={{
                    fontWeight: "600",
                    color: "#5d4037",
                    textTransform: "capitalize"
                  }}>
                    {governanceStage}
                  </span>
                </div>

                {isEvaluating && (
                  <p style={{ color: "#5d4037", fontSize: "14px", textAlign: "center", marginTop: "10px" }}>
                    <RefreshCw size={16} className="spin" style={{ marginRight: "6px" }} />
                    Running automatic AI analysis...
                  </p>
                )}

                
              </div>

              {/* About the Governance Score section */}
              <div style={{
                marginTop: "20px",
                border: "1px solid #d7ccc8",
                borderRadius: "8px",
                overflow: "hidden"
              }}>
                <div
                  style={{
                    backgroundColor: "#8d6e63",
                    color: "white",
                    padding: "12px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                  onClick={() => setShowAboutScore(!showAboutScore)}
                >
                  <span>About the Governance Score</span>
                  <ChevronDown
                    size={20}
                    style={{
                      transform: showAboutScore ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease"
                    }}
                  />
                </div>
                {showAboutScore && (
                  <div style={{
                    backgroundColor: "#f5f2f0",
                    padding: "20px",
                    color: "#5d4037"
                  }}>
                    <p style={{ marginBottom: "16px", lineHeight: "1.6" }}>
                      The Governance score evaluates whether a business is ready to establish or improve its governance structures.
                      It combines the Public Interest Score (PIS) with an assessment of governance maturity.
                    </p>
                    <div style={{
                      backgroundColor: "#efebe9",
                      padding: "16px",
                      borderRadius: "8px",
                      marginBottom: "16px",
                      borderLeft: "4px solid #8d6e63"
                    }}>
                      <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>PIS Calculation:</p>
                      <ul style={{ margin: "0", paddingLeft: "20px", color: "#5d4037" }}>
                        <li style={{ marginBottom: "6px" }}><strong>PIS = Employees + (Turnover/R1m) + (Liabilities/R1m) + Shareholders</strong></li>
                        <li style={{ marginBottom: "6px" }}>Higher PIS indicates greater public interest and governance requirements</li>
                      </ul>
                    </div>
                    <div style={{
                      backgroundColor: "##efebe9",
                      padding: "16px",
                      borderRadius: "8px",
                      marginBottom: "16px",
                      borderLeft: "4px solid #8d6e63"
                    }}>
                      <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>Governance Stages:</p>
                      <ul style={{ margin: "0", paddingLeft: "20px", color: "#5d4037" }}>
                        <li style={{ marginBottom: "4px" }}><strong>PIS &lt; 100:</strong> Advisors Stage - light governance</li>
                        <li style={{ marginBottom: "4px" }}><strong>PIS 100-349:</strong> Emerging Board Stage - informal board recommended</li>
                        <li style={{ marginBottom: "4px" }}><strong>PIS ≥ 350:</strong> Full Board Stage - formal board strongly recommended</li>
                      </ul>
                    </div>
                    <div style={{
                      backgroundColor: "#efebe9",
                      padding: "16px",
                      borderRadius: "8px",
                      marginBottom: "16px",
                      borderLeft: "4px solid #8d6e63"
                    }}>
                      <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>Purpose - the governance score helps:</p>
                      <ul style={{ margin: "0", paddingLeft: "20px", color: "#5d4037" }}>
                        <li style={{ marginBottom: "4px" }}>Determine appropriate governance structures</li>
                        <li style={{ marginBottom: "4px" }}>Assess compliance readiness</li>
                        <li style={{ marginBottom: "4px" }}>Identify governance improvement areas</li>
                        <li style={{ marginBottom: "4px" }}>Prepare for investment and scaling</li>
                      </ul>
                    </div>
                    <p style={{ marginBottom: "0", lineHeight: "1.6", fontStyle: "italic", color: "#6d4c41" }}>
                      Strong governance scores indicate readiness for investment and ability to manage complex business operations.
                    </p>
                  </div>
                )}
              </div>

              {/* Score Breakdown Section */}
              <div style={{
                marginTop: "20px",
                border: "1px solid #d7ccc8",
                borderRadius: "8px",
                overflow: "hidden"
              }}>
                <div
                  style={{
                    backgroundColor: "#8d6e63",
                    color: "white",
                    padding: "12px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                  onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
                >
                  <span>Score breakdown</span>
                  <ChevronDown
                    size={20}
                    style={{
                      transform: showScoreBreakdown ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease"
                    }}
                  />
                </div>
                {showScoreBreakdown && (
                  <div style={{
                    backgroundColor: "#f5f2f0",
                    padding: "20px",
                    color: "#5d4037"
                  }}>
                    {scoreBreakdown.map((item, index) => (
                      <div key={index} style={{
                        padding: "15px",
                        borderBottom: index < scoreBreakdown.length - 1 ? "1px solid #e8d8cf" : "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "white",
                        marginBottom: "5px",
                        borderRadius: "8px"
                      }}>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          flex: "1"
                        }}>
                          <div style={{
                            backgroundColor: item.color,
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                            marginRight: "12px",
                            flexShrink: "0"
                          }}></div>
                          <div>
                            <div style={{
                              fontWeight: "600",
                              color: "#5d4037",
                              fontSize: "14px",
                              marginBottom: "2px"
                            }}>{item.name}</div>
                            <div style={{
                              fontSize: "12px",
                              color: "#8d6e63",
                              fontStyle: "italic"
                            }}>
                              {item.score}/{item.max} points
                            </div>
                          </div>
                        </div>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px"
                        }}>
                          <div style={{
                            width: "80px",
                            height: "8px",
                            background: "#f3e8dc",
                            borderRadius: "4px",
                            overflow: "hidden",
                            border: "1px solid #d6b88a"
                          }}>
                            <div style={{
                              width: `${(item.score / item.max) * 100}%`,
                              backgroundColor: getProgressBarColor((item.score / item.max) * 100),
                              height: "100%",
                              borderRadius: "4px",
                              transition: "width 0.3s ease"
                            }}></div>
                          </div>
                          <span style={{
                            fontWeight: "600",
                            color: "#5d4037",
                            fontSize: "14px",
                            minWidth: "35px",
                            textAlign: "right"
                          }}>{Math.round((item.score / item.max) * 100)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Detailed Analysis Section */}
              <div style={{
                marginTop: "20px",
                border: "1px solid #d7ccc8",
                borderRadius: "8px",
                overflow: "hidden"
              }}>
                <div
                  style={{
                    backgroundColor: "#8d6e63",
                    color: "white",
                    padding: "12px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                  onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
                >
                  <span>Detailed analysis</span>
                  <ChevronDown
                    size={20}
                    style={{
                      transform: showDetailedAnalysis ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease"
                    }}
                  />
                </div>
                {showDetailedAnalysis && (
                  <div style={{
                    backgroundColor: "#f5f2f0",
                    padding: "20px",
                    color: "#5d4037"
                  }}>
                    {aiEvaluationResult ? (
                      <div style={{
                        backgroundColor: "white",
                        padding: "20px",
                        borderRadius: "8px",
                        border: "1px solid #e8d8cf",
                        maxHeight: "400px",
                        overflowY: "auto"
                      }}>
                        {formatAiResult(aiEvaluationResult)}
                      </div>
                    ) : (
                      <div style={{ color: "#5d4037", lineHeight: "1.6" }}>
                        {governanceScore > 90 && (
                          <p style={{ margin: "0" }}>
                            <strong>Exceptional governance capability.</strong> Your business demonstrates outstanding governance maturity with comprehensive structures in place. You have all the necessary governance elements for investment readiness and complex operations.
                          </p>
                        )}
                        {governanceScore >= 81 && governanceScore <= 90 && (
                          <p style={{ margin: "0" }}>
                            <strong>Strong governance foundation.</strong> Your business shows excellent governance capabilities with most key elements in place. Your governance profile would inspire confidence from investors and stakeholders.
                          </p>
                        )}
                        {governanceScore >= 61 && governanceScore <= 80 && (
                          <p style={{ margin: "0" }}>
                            <strong>Developing governance with growth potential.</strong> You have established a good governance foundation but need to strengthen certain areas. Continued development in governance structures could significantly enhance your business profile.
                          </p>
                        )}
                        {governanceScore >= 41 && governanceScore <= 60 && (
                          <p style={{ margin: "0" }}>
                            <strong>Emerging governance requiring development.</strong> While you show governance potential, significant work is needed across multiple areas before you'll be viewed as having strong governance by investors and partners.
                          </p>
                        )}
                        {governanceScore <= 40 && (
                          <p style={{ margin: "0" }}>
                            <strong>Governance development essential.</strong> Your governance profile requires substantial strengthening across multiple dimensions. Focus on implementing basic governance structures and gradually building more sophisticated elements.
                          </p>
                        )}
                      </div>
                    )}

                    {evaluationError && (
                      <div style={{
                        marginTop: "15px",
                        padding: "12px",
                        backgroundColor: "#f8d7da",
                        color: "#721c24",
                        border: "1px solid #f5c6cb",
                        borderRadius: "6px",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}>
                        <AlertCircle size={16} />
                        {evaluationError}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}