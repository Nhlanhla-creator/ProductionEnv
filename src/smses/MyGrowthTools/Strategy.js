"use client";

import { useState, useEffect } from "react";
import { Bar, Scatter } from "react-chartjs-2";
import { db, auth, storage } from "../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import {
  FaChevronDown,
  FaChevronUp,
  FaRobot,
  FaSpinner,
  FaDownload,
} from "react-icons/fa";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
);

// ─── Design Tokens (matching Financial Performance) ──────────────────────
const T = {
  ink: "#2d201c",
  body: "#3b2b26",
  muted: "#6b5b55",
  faint: "#8a7a74",
  line: "#ded8d4",
  lineSoft: "#e9e3df",
  lineStrong: "#b0a29b",
  bg: "#ffffff",
  panel: "#faf8f7",
  raised: "#f2eeec",
  accent: "#4a352f",
  accentSoft: "#6b4f47",
  accentTint: "#f4efec",
  header: "#241813",
  green: "#166534",
  greenBg: "#f0fdf4",
  amber: "#92400e",
  amberBg: "#fffbeb",
  red: "#991b1b",
  redBg: "#fef2f2",
  blue: "#1e40af",
};

// ─── Shared UI Components ────────────────────────────────────────────────
const btnBase = {
  padding: "9px 16px",
  borderRadius: "8px",
  fontSize: "13.5px",
  fontWeight: 500,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  fontFamily: "inherit",
};
const btnPrimary = {
  ...btnBase,
  background: T.accent,
  color: "#fff",
  border: `1px solid ${T.accent}`,
  fontWeight: 600,
};
const btnGhost = {
  ...btnBase,
  background: T.bg,
  color: T.body,
  border: `1px solid ${T.lineStrong}`,
};
const btnQuiet = {
  ...btnBase,
  background: "transparent",
  color: T.accent,
  border: "1px solid transparent",
};
const inputS = {
  width: "100%",
  padding: "9px 11px",
  border: `1px solid ${T.lineStrong}`,
  borderRadius: "8px",
  fontSize: "13.5px",
  fontFamily: "inherit",
  boxSizing: "border-box",
  color: T.ink,
  background: T.bg,
  outline: "none",
};
const selectS = { ...inputS, cursor: "pointer" };
const labelS = {
  display: "block",
  fontSize: "12.5px",
  fontWeight: 600,
  color: T.accent,
  marginBottom: "5px",
};
const cardS = {
  background: T.bg,
  border: `1px solid ${T.line}`,
  borderRadius: "10px",
  padding: "14px 16px",
};

const SECTION_DATA = {
  "strategic-clarity": {
    name: "Strategic Clarity",
    keyQuestion:
      "Is there a clear, articulated strategy that guides decision-making across the business?",
    keySignals:
      "Strategic priorities are explicit, Operating intent is consistent",
    keyDecisions:
      "Is the business intentionally steered or founder-driven? Is strategic clarification required before scaling or funding? Can external stakeholders understand the business direction?",
    kpis: [
      "Vision",
      "Mission",
      "Values",
      "Operating Principles",
      "Strategic Priorities (Max 3-5)",
      "Strategic Horizon (timeframe selector 12-36 months)",
    ],
  },
  "operating-model": {
    name: "Operating Model",
    keyQuestion:
      "Is the operating model aligned with the current business strategy and stage?",
    keySignals:
      "Business model canvas is clearly defined, Resources and activities match strategic priorities",
    keyDecisions:
      "Does the operating model need to evolve for scaling? Are there gaps between strategy and execution? Is the cost structure sustainable?",
    kpis: [
      "Key Partners",
      "Key Activities",
      "Key Resources",
      "Value Propositions",
      "Customer Relationships",
      "Channels",
      "Customer Segments",
      "Cost Structure",
      "Revenue Streams",
    ],
  },
  "strategy-operationalisation": {
    name: "Strategy Operationalisation",
    keyQuestion:
      "Is strategy being translated into actionable goals and milestones?",
    keySignals:
      "Clear strategic goals exist, Progress is tracked against milestones",
    keyDecisions:
      "Are goals being met? Should resources be reallocated? Are timelines realistic?",
    kpis: [
      "Goal completion rates",
      "Milestone achievement",
      "Progress tracking",
    ],
  },
  "strategic-risk-control": {
    name: "Strategic Risk Control",
    keyQuestion: "Are strategic risks identified and actively managed?",
    keySignals: "Risk register is maintained, Mitigation plans are in place",
    keyDecisions:
      "What risks are acceptable? Where to invest in risk mitigation? Is the risk appetite appropriate?",
    kpis: [
      "Risk identification",
      "Risk assessment",
      "Mitigation status",
      "Review cadence",
    ],
  },
};

// RISK COLORS for scatter plot
const RISK_COLORS = {
  "financial-risk": "#4CAF50",
  "market-risk": "#2196F3",
  "operational-risk": "#FF9800",
  "reputational-risk": "#9C27B0",
  "compliance-risk": "#F44336",
  "technology-risk": "#FF69B4",
  "business-risk": "#7d5a50",
};

// Helper function to get months array based on year
const getMonths = (year) => {
  const currentYear = new Date().getFullYear();
  if (year === currentYear) {
    const currentMonth = new Date().getMonth();
    return Array.from({ length: currentMonth + 1 }, (_, i) =>
      new Date(currentYear, i, 1).toLocaleString("default", { month: "short" })
    );
  }
  return Array.from({ length: 12 }, (_, i) =>
    new Date(year, i, 1).toLocaleString("default", { month: "short" })
  );
};

// Key Question Component
const KeyQuestionBox = ({ question, signals, decisions, section }) => {
  const [showMore, setShowMore] = useState(false);

  const getFirstSentence = (text) => {
    const match = text.match(/^[^.!?]+[.!?]/);
    return match ? match[0] : text.split(".")[0] + ".";
  };

  return (
    <div
      style={{
        background: T.panel,
        padding: "15px 20px",
        borderRadius: "10px",
        marginBottom: "20px",
        border: `1px solid ${T.line}`,
      }}
    >
      <div style={{ marginBottom: "8px" }}>
        <strong style={{ color: T.accent, fontSize: "14px" }}>
          Key Question:
        </strong>
        <span style={{ color: T.body, fontSize: "14px", marginLeft: "8px" }}>
          {showMore ? question : getFirstSentence(question)}
        </span>
        {!showMore &&
          (question.length > getFirstSentence(question).length ||
            signals ||
            decisions) && (
            <button
              onClick={() => setShowMore(true)}
              style={{
                background: "none",
                border: "none",
                color: T.accent,
                fontWeight: "600",
                cursor: "pointer",
                marginLeft: "5px",
                textDecoration: "underline",
              }}
            >
              See more
            </button>
          )}
      </div>

      {showMore && (
        <>
          <div style={{ marginBottom: "8px" }}>
            <strong style={{ color: T.accent, fontSize: "14px" }}>
              Key Signals:
            </strong>
            <span style={{ color: T.body, fontSize: "14px", marginLeft: "8px" }}>
              {signals}
            </span>
          </div>
          <div>
            <strong style={{ color: T.accent, fontSize: "14px" }}>
              Key Decisions:
            </strong>
            <span style={{ color: T.body, fontSize: "14px", marginLeft: "8px" }}>
              {decisions}
            </span>
          </div>
          <button
            onClick={() => setShowMore(false)}
            style={{
              background: "none",
              border: "none",
              color: T.accent,
              fontWeight: "600",
              cursor: "pointer",
              marginTop: "10px",
              textDecoration: "underline",
            }}
          >
            See less
          </button>
        </>
      )}
    </div>
  );
};

const RISK_TYPE_DEFINITIONS = {
  "Financial Risk":
    "Risks related to funding, cash flow, pricing, revenue, and financial sustainability",
  "Market Risk":
    "Risks related to market dynamics, competition, demand shifts, and market positioning",
  "Operational Risk":
    "Risks related to processes, systems, resource availability, and operational execution",
  "Reputational Risk":
    "Risks related to brand perception, stakeholder trust, and public image",
  "Compliance Risk":
    "Risks related to legal requirements, regulations, licenses, and statutory obligations",
  "Technology Risk":
    "Risks related to technology infrastructure, cybersecurity, and digital capabilities",
};

// AI Analysis Component
const AIAnalysisButton = ({
  visionMissionData,
  userId,
  isInvestorView,
  triggerAnalysis,
}) => {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [savedAnalysis, setSavedAnalysis] = useState("");

  useEffect(() => {
    if (userId) {
      loadSavedAnalysis();
    }
  }, [userId]);

  const loadSavedAnalysis = async () => {
    try {
      const aiAnalysisRef = doc(db, "strategicClarityAnalysis", userId);
      const aiSnapshot = await getDoc(aiAnalysisRef);

      if (aiSnapshot.exists()) {
        const data = aiSnapshot.data();
        if (data.analysis) {
          setSavedAnalysis(data.analysis);
          setAiAnalysis(data.analysis);
        }
      }
    } catch (error) {
      console.error("Error loading saved analysis:", error);
    }
  };

  const cleanAIResponse = (text) => {
    if (!text) return text;
    let cleaned = text
      .replace(/^#+\s*/gm, "")
      .replace(/#/g, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
      .split("\n")
      .map((line) => line.trim())
      .join("\n")
      .trim();
    return cleaned;
  };

  const generateAIAnalysis = async () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot generate AI analysis.");
      return;
    }

    if (!visionMissionData || !userId) {
      setAnalysisError("No data available for analysis.");
      return;
    }

    setIsGenerating(true);
    setAnalysisError("");
    setShowAnalysis(true);

    try {
      const analysisData = prepareStrategicClarityData(visionMissionData);
      const prompt = createStrategicClarityPrompt(analysisData);

      const functions = getFunctions();
      const generateStrategicClarityAnalysis = httpsCallable(
        functions,
        "generateStrategicClarityAnalysis"
      );

      const response = await generateStrategicClarityAnalysis({
        prompt: prompt,
        userId: userId,
        timestamp: new Date().toISOString(),
      });

      let analysis = response?.data?.content || response?.data?.analysis;

      if (!analysis) {
        throw new Error("No analysis generated");
      }

      analysis = cleanAIResponse(analysis);

      const aiAnalysisRef = doc(db, "strategicClarityAnalysis", userId);
      await setDoc(
        aiAnalysisRef,
        {
          analysis: analysis,
          timestamp: new Date().toISOString(),
          dataSnapshot: visionMissionData,
          userId: userId,
        },
        { merge: true }
      );

      setAiAnalysis(analysis);
      setSavedAnalysis(analysis);
    } catch (error) {
      console.error("Error generating AI analysis:", error);
      setAnalysisError(`Failed to generate analysis: ${error.message}`);
      setAiAnalysis(
        "AI analysis will be generated based on your data trends, comparing current performance against historical averages and industry benchmarks. This feature provides actionable insights for improving this metric."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const prepareStrategicClarityData = (data) => {
    return {
      vision: data.vision || "Not provided",
      mission: data.mission || "Not provided",
      values: data.values || [],
      operatingPrinciples: data.operatingPrinciples || [],
      strategicPriorities: data.strategicPriorities || [],
      strategicHorizon: data.strategicHorizon || "12",
      completedPriorities:
        data.strategicPriorities?.filter((p) => p.status === "Done").length || 0,
      totalPriorities: data.strategicPriorities?.length || 0,
      valuesCount: data.values?.length || 0,
      operatingPrinciplesCount: data.operatingPrinciples?.length || 0,
      hasVision: !!data.vision,
      hasMission: !!data.mission,
      hasValues: data.values?.length > 0,
      hasOperatingPrinciples: data.operatingPrinciples?.length > 0,
      hasPriorities: data.strategicPriorities?.length > 0,
    };
  };

  const createStrategicClarityPrompt = (data) => {
    return `Analyze the strategic clarity of a business based on the following data and provide actionable insights:

STRATEGIC CLARITY ASSESSMENT DATA:
1. Vision Statement: ${data.vision}
2. Mission Statement: ${data.mission}
3. Core Values: ${data.valuesCount} values defined - ${data.values.join(", ")}
4. Operating Principles: ${data.operatingPrinciplesCount} principles defined - ${data.operatingPrinciples.join(", ")}
5. Strategic Horizon: ${data.strategicHorizon} months
6. Strategic Priorities: ${data.totalPriorities} total, ${data.completedPriorities} completed
   ${data.strategicPriorities.map((p, i) => `${i + 1}. ${p.description} (Due: ${p.dueDate}, Status: ${p.status})`).join("\n   ")}

ANALYSIS REQUIREMENTS:
1. ASSESSMENT OVERVIEW:
   - Evaluate completeness of strategic elements (vision, mission, values, operating principles, priorities)
   - Rate strategic clarity on a scale of 1-10 (10 being highest)
   - Identify strengths and gaps

2. DATA TRENDS ANALYSIS:
   - Compare against industry benchmarks for strategic planning
   - Analyze completion rate of strategic priorities
   - Assess alignment between vision, mission, principles, and actual priorities

3. ACTIONABLE INSIGHTS:
   - Provide 3-5 specific, actionable recommendations
   - Suggest improvements for each strategic element
   - Include timelines and measurable goals

4. RISK ASSESSMENT:
   - Identify potential strategic risks based on gaps
   - Suggest mitigation strategies

5. IMPROVEMENT ROADMAP:
   - Priority areas for immediate attention
   - Timeline for strategic review and updates
   - Key performance indicators to track progress

OUTPUT FORMAT:
Executive Summary
[Brief overview of strategic clarity status]

Current Assessment
- Vision: [Analysis of vision statement clarity and effectiveness]
- Mission: [Analysis of mission statement alignment and focus]
- Values: [Analysis of core values implementation]
- Operating Principles: [Analysis of operating principles and their impact]
- Strategic Priorities: [Analysis of priority setting and execution]
- Strategic Horizon: [Analysis of timeframe appropriateness]

Strategic Clarity Score: [X]/10
Rating: [Poor/Fair/Good/Excellent]

Data Trends & Benchmark Comparison
[Comparison against industry standards and historical trends]

Actionable Recommendations
1. [Specific action with timeline]
2. [Specific action with measurable goal]
3. [Specific action with concrete steps]

Risk Assessment & Mitigation
[Identify risks and provide mitigation strategies]

Improvement Roadmap
[Timeline and steps for strategic clarity enhancement]

IMPORTANT: Do NOT use any markdown formatting like ###, **, or # in your response. Use plain text only with section titles as shown above.`;
  };

  const handleAIAnalysis = () => {
    if (!showAnalysis) {
      if (savedAnalysis) {
        setAiAnalysis(savedAnalysis);
        setShowAnalysis(true);
      } else {
        generateAIAnalysis();
      }
    } else {
      setShowAnalysis(!showAnalysis);
    }
  };

  const refreshAnalysis = async () => {
    await generateAIAnalysis();
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "15px",
        }}
      >
        <button
          onClick={handleAIAnalysis}
          disabled={isGenerating || isInvestorView}
          style={{
            ...btnPrimary,
            opacity: isGenerating ? 0.7 : 1,
            background: isInvestorView ? T.muted : T.accent,
          }}
        >
          {isGenerating ? (
            <>
              <FaSpinner
                className="spin"
                style={{ animation: "spin 1s linear infinite" }}
              />
              Generating Analysis...
            </>
          ) : (
            <>
              <FaRobot />
              AI Analysis
            </>
          )}
        </button>

        {savedAnalysis && !isGenerating && (
          <button
            onClick={refreshAnalysis}
            disabled={isInvestorView}
            style={{
              ...btnGhost,
              padding: "8px 16px",
              fontSize: "12px",
            }}
            title="Refresh AI Analysis"
          >
            Refresh
          </button>
        )}
      </div>

      {showAnalysis && (
        <div
          style={{
            background: T.panel,
            padding: "20px",
            borderRadius: "10px",
            border: `1px solid ${T.line}`,
            marginTop: "10px",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "15px",
            }}
          >
            <div>
              <label
                style={{
                  ...labelS,
                  fontSize: "16px",
                  marginBottom: "8px",
                }}
              >
                Strategic Clarity AI Analysis
              </label>
              <p
                style={{
                  fontSize: "12px",
                  color: T.muted,
                  margin: "0 0 10px 0",
                  fontStyle: "italic",
                }}
              >
                Analysis generated from your strategic clarity data
              </p>
            </div>

            {savedAnalysis && (
              <span
                style={{
                  fontSize: "10px",
                  color: T.muted,
                  background: T.raised,
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontWeight: "500",
                }}
              >
                Saved Analysis
              </span>
            )}
          </div>

          {analysisError ? (
            <div
              style={{
                padding: "15px",
                background: T.redBg,
                borderRadius: "6px",
                border: `1px solid ${T.red}33`,
                color: T.red,
                fontSize: "14px",
              }}
            >
              <strong>Error:</strong> {analysisError}
            </div>
          ) : isGenerating ? (
            <div
              style={{
                textAlign: "center",
                padding: "30px",
                color: T.body,
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  border: `3px solid ${T.lineSoft}`,
                  borderTop: `3px solid ${T.accent}`,
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 15px",
                }}
              ></div>
              <p>Analyzing your strategic clarity data...</p>
              <p
                style={{ fontSize: "12px", color: T.muted, marginTop: "5px" }}
              >
                Comparing against industry benchmarks and best practices
              </p>
            </div>
          ) : (
            <div
              style={{
                background: T.bg,
                padding: "20px",
                borderRadius: "8px",
                border: `1px solid ${T.lineSoft}`,
                maxHeight: "400px",
                overflowY: "auto",
                fontSize: "14px",
                lineHeight: "1.6",
                color: T.body,
                whiteSpace: "pre-wrap",
              }}
            >
              {aiAnalysis ||
                "AI analysis will be generated based on your data trends, comparing current performance against historical averages and industry benchmarks. This feature provides actionable insights for improving this metric."}
            </div>
          )}

          <div
            style={{
              marginTop: "15px",
              paddingTop: "15px",
              borderTop: `1px solid ${T.lineSoft}`,
              fontSize: "11px",
              color: T.muted,
              fontStyle: "italic",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Analysis powered by AI • Updates when data changes</span>
            <button
              onClick={() => setShowAnalysis(false)}
              style={{
                background: "none",
                border: "none",
                color: T.muted,
                cursor: "pointer",
                fontSize: "12px",
                textDecoration: "underline",
              }}
            >
              Hide Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Strategic Clarity Component
const StrategicClarity = ({ activeSection, currentUser, isInvestorView }) => {
  const [visionMissionData, setVisionMissionData] = useState({
    vision: "",
    mission: "",
    values: [],
    operatingPrinciples: [],
    strategicPriorities: [],
    strategicHorizon: "12",
  });
  const [showModal, setShowModal] = useState(false);
  const [showOperatingPrincipleModal, setShowOperatingPrincipleModal] =
    useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [newOperatingPrinciple, setNewOperatingPrinciple] = useState("");
  const [newPriority, setNewPriority] = useState({
    description: "",
    dueDate: "",
    status: "Not Done",
  });
  const [triggerAnalysis, setTriggerAnalysis] = useState(false);

  useEffect(() => {
    if (!currentUser || activeSection !== "strategic-clarity") return;

    const loadVisionMissionData = async () => {
      try {
        const visionMissionSnapshot = await getDocs(
          query(
            collection(db, "visionMission"),
            where("userId", "==", currentUser.uid)
          )
        );

        if (!visionMissionSnapshot.empty) {
          const data = visionMissionSnapshot.docs[0].data();
          setVisionMissionData({
            vision: data.vision || "",
            mission: data.mission || "",
            values: data.values || [],
            operatingPrinciples: data.operatingPrinciples || [],
            strategicPriorities: data.strategicPriorities || [],
            strategicHorizon: data.strategicHorizon || "12",
          });
        }
      } catch (error) {
        console.error("Error loading vision/mission data:", error);
      }
    };

    loadVisionMissionData();

    const visionMissionQuery = query(
      collection(db, "visionMission"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(visionMissionQuery, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setVisionMissionData({
          vision: data.vision || "",
          mission: data.mission || "",
          values: data.values || [],
          operatingPrinciples: data.operatingPrinciples || [],
          strategicPriorities: data.strategicPriorities || [],
          strategicHorizon: data.strategicHorizon || "12",
        });

        if (snapshot.docs[0].metadata.hasPendingWrites) {
          setTriggerAnalysis(true);
        }
      }
    });

    return () => unsubscribe();
  }, [activeSection, currentUser]);

  useEffect(() => {
    if (triggerAnalysis) {
      setTriggerAnalysis(false);
    }
  }, [triggerAnalysis]);

  if (activeSection !== "strategic-clarity") return null;

  const handleSaveVisionMission = async () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.");
      return;
    }

    if (!currentUser) {
      alert("You must be logged in to save data.");
      return;
    }

    try {
      const dataWithUser = {
        ...visionMissionData,
        userId: currentUser.uid,
        updatedAt: new Date().toISOString(),
      };

      const existingSnapshot = await getDocs(
        query(
          collection(db, "visionMission"),
          where("userId", "==", currentUser.uid)
        )
      );

      if (existingSnapshot.empty) {
        await addDoc(collection(db, "visionMission"), dataWithUser);
      } else {
        const docRef = doc(db, "visionMission", existingSnapshot.docs[0].id);
        await updateDoc(docRef, dataWithUser);
      }

      alert("Strategic Clarity data saved successfully!");
    } catch (error) {
      console.error("Error saving vision/mission data:", error);
      alert("Error saving data. Please try again.");
    }
  };

  const handleAddValue = () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.");
      return;
    }

    if (newValue.trim()) {
      setVisionMissionData((prev) => ({
        ...prev,
        values: [...prev.values, newValue.trim()],
      }));
      setNewValue("");
      setShowModal(false);
    }
  };

  const handleRemoveValue = (index) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.");
      return;
    }

    setVisionMissionData((prev) => ({
      ...prev,
      values: prev.values.filter((_, i) => i !== index),
    }));
  };

  const handleAddOperatingPrinciple = () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.");
      return;
    }

    if (newOperatingPrinciple.trim()) {
      setVisionMissionData((prev) => ({
        ...prev,
        operatingPrinciples: [
          ...prev.operatingPrinciples,
          newOperatingPrinciple.trim(),
        ],
      }));
      setNewOperatingPrinciple("");
      setShowOperatingPrincipleModal(false);
    }
  };

  const handleRemoveOperatingPrinciple = (index) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.");
      return;
    }

    setVisionMissionData((prev) => ({
      ...prev,
      operatingPrinciples: prev.operatingPrinciples.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const handleAddPriority = () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.");
      return;
    }

    if (
      newPriority.description.trim() &&
      visionMissionData.strategicPriorities.length < 5
    ) {
      setVisionMissionData((prev) => ({
        ...prev,
        strategicPriorities: [...prev.strategicPriorities, { ...newPriority }],
      }));
      setNewPriority({
        description: "",
        dueDate: "",
        status: "Not Done",
      });
      setShowPriorityModal(false);
    } else if (visionMissionData.strategicPriorities.length >= 5) {
      alert("Maximum 5 strategic priorities allowed");
    }
  };

  const handleRemovePriority = (index) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.");
      return;
    }

    setVisionMissionData((prev) => ({
      ...prev,
      strategicPriorities: prev.strategicPriorities.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const handleUpdatePriority = (index, field, value) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.");
      return;
    }

    setVisionMissionData((prev) => ({
      ...prev,
      strategicPriorities: prev.strategicPriorities.map((priority, i) =>
        i === index ? { ...priority, [field]: value } : priority
      ),
    }));
  };

  return (
    <div style={cardS}>
      <KeyQuestionBox
        question={SECTION_DATA["strategic-clarity"].keyQuestion}
        signals={SECTION_DATA["strategic-clarity"].keySignals}
        decisions={SECTION_DATA["strategic-clarity"].keyDecisions}
      />

      {!currentUser && (
        <div
          style={{
            background: T.amberBg,
            border: `1px solid ${T.amber}33`,
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          <p style={{ color: T.amber, margin: 0 }}>
            Please log in to access and manage your Strategic Clarity data.
          </p>
        </div>
      )}

      {currentUser && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              marginBottom: "20px",
            }}
          >
            <div style={cardS}>
              <h3
                style={{ color: T.accent, marginTop: 0, marginBottom: "15px" }}
              >
                Vision
              </h3>
              <textarea
                value={visionMissionData.vision}
                onChange={(e) =>
                  setVisionMissionData((prev) => ({
                    ...prev,
                    vision: e.target.value,
                  }))
                }
                placeholder="Enter your organization's vision statement..."
                rows="6"
                disabled={isInvestorView}
                style={{
                  ...inputS,
                  resize: "vertical",
                  background: isInvestorView ? T.panel : T.bg,
                  cursor: isInvestorView ? "not-allowed" : "text",
                }}
              />
            </div>

            <div style={cardS}>
              <h3
                style={{ color: T.accent, marginTop: 0, marginBottom: "15px" }}
              >
                Mission
              </h3>
              <textarea
                value={visionMissionData.mission}
                onChange={(e) =>
                  setVisionMissionData((prev) => ({
                    ...prev,
                    mission: e.target.value,
                  }))
                }
                placeholder="Enter your organization's mission statement..."
                rows="6"
                disabled={isInvestorView}
                style={{
                  ...inputS,
                  resize: "vertical",
                  background: isInvestorView ? T.panel : T.bg,
                  cursor: isInvestorView ? "not-allowed" : "text",
                }}
              />
            </div>
          </div>

          {/* Core Values Section */}
          <div style={{ ...cardS, marginBottom: "20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h3 style={{ color: T.accent, margin: 0 }}>Core Values</h3>
              {!isInvestorView && (
                <button onClick={() => setShowModal(true)} style={btnPrimary}>
                  Add Value
                </button>
              )}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "15px",
              }}
            >
              {visionMissionData.values.map((value, index) => (
                <div
                  key={index}
                  style={{
                    background: T.panel,
                    padding: "15px",
                    borderRadius: "8px",
                    border: `1px solid ${T.line}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: T.ink, fontWeight: "500" }}>
                    {value}
                  </span>
                  {!isInvestorView && (
                    <button
                      onClick={() => handleRemoveValue(index)}
                      style={{
                        background: "none",
                        border: "none",
                        color: T.red,
                        cursor: "pointer",
                        fontSize: "18px",
                        padding: "0 5px",
                      }}
                      title="Delete"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Operating Principles Section */}
          <div style={{ ...cardS, marginBottom: "20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h3 style={{ color: T.accent, margin: 0 }}>
                Operating Principles
              </h3>
              {!isInvestorView && (
                <button
                  onClick={() => setShowOperatingPrincipleModal(true)}
                  style={btnPrimary}
                >
                  Add Principle
                </button>
              )}
            </div>

            {visionMissionData.operatingPrinciples.length === 0 ? (
              <p
                style={{
                  color: T.muted,
                  textAlign: "center",
                  padding: "20px",
                }}
              >
                No operating principles added yet. Add principles that guide how
                you operate and make decisions.
              </p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                  gap: "15px",
                }}
              >
                {visionMissionData.operatingPrinciples.map(
                  (principle, index) => (
                    <div
                      key={index}
                      style={{
                        background: T.panel,
                        padding: "15px",
                        borderRadius: "8px",
                        border: `1px solid ${T.line}`,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ color: T.ink, fontWeight: "500" }}>
                        {principle}
                      </span>
                      {!isInvestorView && (
                        <button
                          onClick={() => handleRemoveOperatingPrinciple(index)}
                          style={{
                            background: "none",
                            border: "none",
                            color: T.red,
                            cursor: "pointer",
                            fontSize: "18px",
                            padding: "0 5px",
                          }}
                          title="Delete"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* Strategic Horizon */}
          <div style={{ ...cardS, marginBottom: "20px" }}>
            <h3
              style={{ color: T.accent, marginTop: 0, marginBottom: "15px" }}
            >
              Strategic Horizon
            </h3>
            <select
              value={visionMissionData.strategicHorizon}
              onChange={(e) =>
                setVisionMissionData((prev) => ({
                  ...prev,
                  strategicHorizon: e.target.value,
                }))
              }
              disabled={isInvestorView}
              style={{
                ...selectS,
                width: "150px",
                background: isInvestorView ? T.panel : T.bg,
                cursor: isInvestorView ? "not-allowed" : "pointer",
              }}
            >
              <option value="12">12 months</option>
              <option value="18">18 months</option>
              <option value="24">24 months</option>
              <option value="30">30 months</option>
              <option value="36">36 months</option>
            </select>
          </div>

          <div style={{ ...cardS, marginBottom: "20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h3 style={{ color: T.accent, margin: 0 }}>
                Strategic Priorities (Max 3-5)
              </h3>
              {!isInvestorView &&
                visionMissionData.strategicPriorities.length < 5 && (
                  <button
                    onClick={() => setShowPriorityModal(true)}
                    style={btnPrimary}
                  >
                    Add Priority
                  </button>
                )}
            </div>

            {visionMissionData.strategicPriorities.length === 0 ? (
              <p
                style={{
                  color: T.muted,
                  textAlign: "center",
                  padding: "20px",
                }}
              >
                No strategic priorities added yet.
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    color: T.body,
                    minWidth: "800px",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: T.header,
                        borderBottom: `2px solid ${T.line}`,
                      }}
                    >
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          fontWeight: "600",
                          color: "#fff",
                        }}
                      >
                        Description
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          fontWeight: "600",
                          color: "#fff",
                          width: "120px",
                        }}
                      >
                        Due Date
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          fontWeight: "600",
                          color: "#fff",
                          width: "120px",
                        }}
                      >
                        Status
                      </th>
                      {!isInvestorView && (
                        <th
                          style={{
                            padding: "12px",
                            textAlign: "left",
                            fontWeight: "600",
                            color: "#fff",
                            width: "80px",
                          }}
                        >
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {visionMissionData.strategicPriorities.map(
                      (priority, index) => (
                        <tr
                          key={index}
                          style={{ borderBottom: `1px solid ${T.lineSoft}` }}
                        >
                          <td style={{ padding: "12px" }}>
                            {isInvestorView ? (
                              priority.description
                            ) : (
                              <input
                                type="text"
                                value={priority.description}
                                onChange={(e) =>
                                  handleUpdatePriority(
                                    index,
                                    "description",
                                    e.target.value
                                  )
                                }
                                style={inputS}
                              />
                            )}
                          </td>
                          <td style={{ padding: "12px" }}>
                            {isInvestorView ? (
                              priority.dueDate
                            ) : (
                              <input
                                type="date"
                                value={priority.dueDate}
                                onChange={(e) =>
                                  handleUpdatePriority(
                                    index,
                                    "dueDate",
                                    e.target.value
                                  )
                                }
                                style={inputS}
                              />
                            )}
                          </td>
                          <td style={{ padding: "12px" }}>
                            {isInvestorView ? (
                              <span
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                  background:
                                    priority.status === "Done"
                                      ? T.greenBg
                                      : T.amberBg,
                                  color:
                                    priority.status === "Done"
                                      ? T.green
                                      : T.amber,
                                }}
                              >
                                {priority.status}
                              </span>
                            ) : (
                              <select
                                value={priority.status}
                                onChange={(e) =>
                                  handleUpdatePriority(
                                    index,
                                    "status",
                                    e.target.value
                                  )
                                }
                                style={selectS}
                              >
                                <option value="Not Done">Not Done</option>
                                <option value="Done">Done</option>
                              </select>
                            )}
                          </td>
                          {!isInvestorView && (
                            <td style={{ padding: "12px" }}>
                              <button
                                onClick={() => handleRemovePriority(index)}
                                style={{
                                  padding: "4px 8px",
                                  background: T.red,
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "11px",
                                }}
                                title="Delete"
                              >
                                ×
                              </button>
                            </td>
                          )}
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* AI Analysis Section */}
          <AIAnalysisButton
            visionMissionData={visionMissionData}
            userId={currentUser?.uid}
            isInvestorView={isInvestorView}
            triggerAnalysis={triggerAnalysis}
          />

          {!isInvestorView && (
            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button onClick={handleSaveVisionMission} style={btnPrimary}>
                Save Changes
              </button>
            </div>
          )}
        </>
      )}

      {/* Add Value Modal */}
      {showModal && !isInvestorView && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: T.bg,
              padding: "30px",
              borderRadius: "10px",
              width: "90%",
              maxWidth: "500px",
            }}
          >
            <h3 style={{ color: T.accent, marginTop: 0 }}>Add Core Value</h3>
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Enter a core value..."
              style={{ ...inputS, marginBottom: "20px" }}
            />
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowModal(false)}
                style={btnGhost}
              >
                Cancel
              </button>
              <button
                onClick={handleAddValue}
                style={btnPrimary}
              >
                Add Value
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Operating Principle Modal */}
      {showOperatingPrincipleModal && !isInvestorView && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: T.bg,
              padding: "30px",
              borderRadius: "10px",
              width: "90%",
              maxWidth: "500px",
            }}
          >
            <h3 style={{ color: T.accent, marginTop: 0 }}>
              Add Operating Principle
            </h3>
            <input
              type="text"
              value={newOperatingPrinciple}
              onChange={(e) => setNewOperatingPrinciple(e.target.value)}
              placeholder="Enter an operating principle..."
              style={{ ...inputS, marginBottom: "20px" }}
            />
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowOperatingPrincipleModal(false)}
                style={btnGhost}
              >
                Cancel
              </button>
              <button
                onClick={handleAddOperatingPrinciple}
                style={btnPrimary}
              >
                Add Principle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Priority Modal */}
      {showPriorityModal && !isInvestorView && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: T.bg,
              padding: "30px",
              borderRadius: "10px",
              width: "90%",
              maxWidth: "500px",
            }}
          >
            <h3 style={{ color: T.accent, marginTop: 0 }}>
              Add Strategic Priority
            </h3>
            <input
              type="text"
              value={newPriority.description}
              onChange={(e) =>
                setNewPriority((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Enter a strategic priority..."
              style={{ ...inputS, marginBottom: "15px" }}
            />
            <input
              type="date"
              value={newPriority.dueDate}
              onChange={(e) =>
                setNewPriority((prev) => ({ ...prev, dueDate: e.target.value }))
              }
              style={{ ...inputS, marginBottom: "15px" }}
            />
            <select
              value={newPriority.status}
              onChange={(e) =>
                setNewPriority((prev) => ({ ...prev, status: e.target.value }))
              }
              style={{ ...selectS, marginBottom: "20px" }}
            >
              <option value="Not Done">Not Done</option>
              <option value="Done">Done</option>
            </select>
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowPriorityModal(false)}
                style={btnGhost}
              >
                Cancel
              </button>
              <button
                onClick={handleAddPriority}
                style={btnPrimary}
              >
                Add Priority
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Business Model Canvas Component
const BusinessModelCanvas = ({
  activeSection,
  currentUser,
  isInvestorView,
}) => {
  const [activeSubTab, setActiveSubTab] = useState("all");
  const [viewMode, setViewMode] = useState("month");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [canvasData, setCanvasData] = useState({
    keyPartners: "",
    keyActivities: "",
    keyResources: "",
    valuePropositions: "",
    customerRelationships: "",
    channels: "",
    customerSegments: "",
    costStructure: "",
    revenueStreams: "",
  });

  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [savedAnalysis, setSavedAnalysis] = useState("");

  useEffect(() => {
    const loadCanvasData = async () => {
      if (!currentUser || activeSection !== "operating-model") return;

      try {
        const canvasSnapshot = await getDocs(
          query(
            collection(db, "businessModelCanvas"),
            where("userId", "==", currentUser.uid)
          )
        );

        if (!canvasSnapshot.empty) {
          const data = canvasSnapshot.docs[0].data();
          setCanvasData(data);
        }
      } catch (error) {
        console.error("Error loading canvas data:", error);
      }
    };

    loadCanvasData();
  }, [activeSection, currentUser]);

  useEffect(() => {
    if (currentUser && activeSection === "operating-model") {
      loadSavedAIAnalysis();
    }
  }, [currentUser, activeSection]);

  const loadSavedAIAnalysis = async () => {
    try {
      const aiAnalysisRef = doc(
        db,
        "businessModelCanvasAnalysis",
        currentUser.uid
      );
      const aiSnapshot = await getDoc(aiAnalysisRef);

      if (aiSnapshot.exists()) {
        const data = aiSnapshot.data();
        if (data.analysis) {
          setSavedAnalysis(data.analysis);
          setAiAnalysis(data.analysis);
        }
      }
    } catch (error) {
      console.error("Error loading saved analysis:", error);
    }
  };

  const cleanAIResponse = (text) => {
    if (!text) return text;
    let cleaned = text
      .replace(/^#+\s*/gm, "")
      .replace(/#/g, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
      .split("\n")
      .map((line) => line.trim())
      .join("\n")
      .trim();
    return cleaned;
  };

  if (activeSection !== "operating-model") return null;

  const handleSaveCanvas = async () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.");
      return;
    }

    if (!currentUser) {
      alert("You must be logged in to save data.");
      return;
    }

    try {
      const dataWithUser = {
        ...canvasData,
        userId: currentUser.uid,
        updatedAt: new Date().toISOString(),
      };

      const existingSnapshot = await getDocs(
        query(
          collection(db, "businessModelCanvas"),
          where("userId", "==", currentUser.uid)
        )
      );

      if (existingSnapshot.empty) {
        await addDoc(collection(db, "businessModelCanvas"), dataWithUser);
      } else {
        const docRef = doc(
          db,
          "businessModelCanvas",
          existingSnapshot.docs[0].id
        );
        await updateDoc(docRef, dataWithUser);
      }

      alert("Operating Model saved successfully!");
    } catch (error) {
      console.error("Error saving canvas data:", error);
      alert("Error saving data. Please try again.");
    }
  };

  const prepareBusinessModelData = (data) => {
    return {
      keyPartners: data.keyPartners || "Not provided",
      keyActivities: data.keyActivities || "Not provided",
      keyResources: data.keyResources || "Not provided",
      valuePropositions: data.valuePropositions || "Not provided",
      customerRelationships: data.customerRelationships || "Not provided",
      channels: data.channels || "Not provided",
      customerSegments: data.customerSegments || "Not provided",
      costStructure: data.costStructure || "Not provided",
      revenueStreams: data.revenueStreams || "Not provided",
      hasValueProposition: !!data.valuePropositions,
      hasCustomerSegments: !!data.customerSegments,
      hasRevenueStreams: !!data.revenueStreams,
      hasCostStructure: !!data.costStructure,
      hasKeyPartners: !!data.keyPartners,
      hasKeyActivities: !!data.keyActivities,
      hasKeyResources: !!data.keyResources,
      hasChannels: !!data.channels,
      hasCustomerRelationships: !!data.customerRelationships,
    };
  };

  const createBusinessModelPrompt = (data) => {
    return `Analyze the Business Model Canvas and Operating Model of a business based on the following data:

BUSINESS MODEL CANVAS DATA:
1. Key Partners: ${data.keyPartners}
2. Key Activities: ${data.keyActivities}
3. Key Resources: ${data.keyResources}
4. Value Propositions: ${data.valuePropositions}
5. Customer Relationships: ${data.customerRelationships}
6. Channels: ${data.channels}
7. Customer Segments: ${data.customerSegments}
8. Cost Structure: ${data.costStructure}
9. Revenue Streams: ${data.revenueStreams}

ANALYSIS REQUIREMENTS:

1. OPERATING MODEL ASSESSMENT:
   - Evaluate completeness of each Business Model Canvas block
   - Identify strengths and gaps in the current operating model
   - Rate overall operating model maturity (1-10)

2. COHERENCE ANALYSIS:
   - How well do the nine building blocks align with each other?
   - Is there logical flow from value proposition to customer segments to revenue?
   - Are key activities and resources appropriate for the value proposition?

3. SCALABILITY ASSESSMENT:
   - Can this operating model scale with business growth?
   - Identify bottlenecks or constraints
   - Suggest improvements for scalability

4. RISK IDENTIFICATION:
   - What are the critical dependencies or vulnerabilities?
   - Which building blocks are underdeveloped?
   - What external factors could impact this model?

5. ACTIONABLE RECOMMENDATIONS:
   - Provide 3-5 specific, actionable improvements
   - Prioritize recommendations by impact and effort
   - Include timelines and measurable outcomes

FORMAT REQUIREMENTS:
- Start with an executive summary
- Use plain text section headers without markdown symbols
- Include specific examples from the data
- End with an Operating Model Score and Rating

OUTPUT FORMAT:
Executive Summary
[Brief overview of operating model status]

Business Model Canvas Assessment
- Key Partners: [Analysis and recommendations]
- Key Activities: [Analysis and recommendations]
- Key Resources: [Analysis and recommendations]
- Value Propositions: [Analysis and recommendations]
- Customer Relationships: [Analysis and recommendations]
- Channels: [Analysis and recommendations]
- Customer Segments: [Analysis and recommendations]
- Cost Structure: [Analysis and recommendations]
- Revenue Streams: [Analysis and recommendations]

Operating Model Coherence Score: [X]/10
Rating: [Poor/Fair/Good/Excellent]

Scalability Assessment
[Analysis of scalability potential with recommendations]

Risk Analysis
[Key risks and mitigation strategies]

Top 5 Actionable Recommendations
1. [Specific action with timeline]
2. [Specific action with measurable goal]
3. [Specific action with concrete steps]
4. [Specific action with owner suggestion]
5. [Specific action with expected impact]

IMPORTANT: Do NOT use any markdown formatting like ###, **, or # in your response. Use plain text only with section titles as shown above.`;
  };

  const generateAIAnalysis = async () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot generate AI analysis.");
      return;
    }

    if (!canvasData || !currentUser) {
      setAnalysisError("No data available for analysis.");
      return;
    }

    setIsGenerating(true);
    setAnalysisError("");
    setShowAIAnalysis(true);

    try {
      const analysisData = prepareBusinessModelData(canvasData);
      const prompt = createBusinessModelPrompt(analysisData);

      const functions = getFunctions();
      const generateOperatingModelAnalysis = httpsCallable(
        functions,
        "generateOperatingModelAnalysis"
      );

      const response = await generateOperatingModelAnalysis({
        prompt: prompt,
        userId: currentUser.uid,
        timestamp: new Date().toISOString(),
      });

      let analysis = response?.data?.content || response?.data?.analysis;

      if (!analysis) {
        throw new Error("No analysis generated");
      }

      analysis = cleanAIResponse(analysis);

      const aiAnalysisRef = doc(
        db,
        "businessModelCanvasAnalysis",
        currentUser.uid
      );
      await setDoc(
        aiAnalysisRef,
        {
          analysis: analysis,
          timestamp: new Date().toISOString(),
          dataSnapshot: canvasData,
          userId: currentUser.uid,
        },
        { merge: true }
      );

      setAiAnalysis(analysis);
      setSavedAnalysis(analysis);
    } catch (error) {
      console.error("Error generating AI analysis:", error);
      setAnalysisError(`Failed to generate analysis: ${error.message}`);
      setAiAnalysis(
        "AI analysis will be generated based on your Business Model Canvas data, comparing against best practices and industry benchmarks. This feature provides actionable insights for improving your operating model."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAIAnalysis = () => {
    if (!showAIAnalysis) {
      if (savedAnalysis) {
        setAiAnalysis(savedAnalysis);
        setShowAIAnalysis(true);
      } else {
        generateAIAnalysis();
      }
    } else {
      setShowAIAnalysis(!showAIAnalysis);
    }
  };

  const refreshAnalysis = async () => {
    await generateAIAnalysis();
  };

  return (
    <div style={cardS}>
      <KeyQuestionBox
        question={SECTION_DATA["operating-model"].keyQuestion}
        signals={SECTION_DATA["operating-model"].keySignals}
        decisions={SECTION_DATA["operating-model"].keyDecisions}
      />

      {!currentUser && (
        <div
          style={{
            background: T.amberBg,
            border: `1px solid ${T.amber}33`,
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          <p style={{ color: T.amber, margin: 0 }}>
            Please log in to access and manage your Operating Model.
          </p>
        </div>
      )}

      {currentUser && (
        <>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              marginBottom: "20px",
            }}
          >
            {/* First Row - Value Proposition and Key Activities */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
              }}
            >
              <div style={cardS}>
                <h4
                  style={{
                    color: T.accent,
                    marginTop: 0,
                    marginBottom: "10px",
                    fontSize: "14px",
                  }}
                >
                  Value Proposition
                </h4>
                <textarea
                  value={canvasData.valuePropositions}
                  onChange={(e) =>
                    setCanvasData((prev) => ({
                      ...prev,
                      valuePropositions: e.target.value,
                    }))
                  }
                  placeholder="What value do you deliver?"
                  rows="4"
                  disabled={isInvestorView}
                  style={{
                    ...inputS,
                    resize: "vertical",
                    fontSize: "12px",
                    background: isInvestorView ? T.panel : T.bg,
                    cursor: isInvestorView ? "not-allowed" : "text",
                  }}
                />
              </div>

              <div style={cardS}>
                <h4
                  style={{
                    color: T.accent,
                    marginTop: 0,
                    marginBottom: "10px",
                    fontSize: "14px",
                  }}
                >
                  Key Activities
                </h4>
                <textarea
                  value={canvasData.keyActivities}
                  onChange={(e) =>
                    setCanvasData((prev) => ({
                      ...prev,
                      keyActivities: e.target.value,
                    }))
                  }
                  placeholder="What key activities do you perform?"
                  rows="4"
                  disabled={isInvestorView}
                  style={{
                    ...inputS,
                    resize: "vertical",
                    fontSize: "12px",
                    background: isInvestorView ? T.panel : T.bg,
                    cursor: isInvestorView ? "not-allowed" : "text",
                  }}
                />
              </div>
            </div>

            {/* Second Row - Key Partners and Key Resources */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
              }}
            >
              <div style={cardS}>
                <h4
                  style={{
                    color: T.accent,
                    marginTop: 0,
                    marginBottom: "10px",
                    fontSize: "14px",
                  }}
                >
                  Key Partners
                </h4>
                <textarea
                  value={canvasData.keyPartners}
                  onChange={(e) =>
                    setCanvasData((prev) => ({
                      ...prev,
                      keyPartners: e.target.value,
                    }))
                  }
                  placeholder="Who are your key partners?"
                  rows="4"
                  disabled={isInvestorView}
                  style={{
                    ...inputS,
                    resize: "vertical",
                    fontSize: "12px",
                    background: isInvestorView ? T.panel : T.bg,
                    cursor: isInvestorView ? "not-allowed" : "text",
                  }}
                />
              </div>

              <div style={cardS}>
                <h4
                  style={{
                    color: T.accent,
                    marginTop: 0,
                    marginBottom: "10px",
                    fontSize: "14px",
                  }}
                >
                  Key Resources
                </h4>
                <textarea
                  value={canvasData.keyResources}
                  onChange={(e) =>
                    setCanvasData((prev) => ({
                      ...prev,
                      keyResources: e.target.value,
                    }))
                  }
                  placeholder="What key resources do you need?"
                  rows="4"
                  disabled={isInvestorView}
                  style={{
                    ...inputS,
                    resize: "vertical",
                    fontSize: "12px",
                    background: isInvestorView ? T.panel : T.bg,
                    cursor: isInvestorView ? "not-allowed" : "text",
                  }}
                />
              </div>
            </div>

            {/* Third Row - Customer Segments, Channels, and Customer Relationships */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "15px",
              }}
            >
              <div style={cardS}>
                <h4
                  style={{
                    color: T.accent,
                    marginTop: 0,
                    marginBottom: "10px",
                    fontSize: "14px",
                  }}
                >
                  Customer Segments
                </h4>
                <textarea
                  value={canvasData.customerSegments}
                  onChange={(e) =>
                    setCanvasData((prev) => ({
                      ...prev,
                      customerSegments: e.target.value,
                    }))
                  }
                  placeholder="Who are your customers?"
                  rows="4"
                  disabled={isInvestorView}
                  style={{
                    ...inputS,
                    resize: "vertical",
                    fontSize: "12px",
                    background: isInvestorView ? T.panel : T.bg,
                    cursor: isInvestorView ? "not-allowed" : "text",
                  }}
                />
              </div>

              <div style={cardS}>
                <h4
                  style={{
                    color: T.accent,
                    marginTop: 0,
                    marginBottom: "10px",
                    fontSize: "14px",
                  }}
                >
                  Channels
                </h4>
                <textarea
                  value={canvasData.channels}
                  onChange={(e) =>
                    setCanvasData((prev) => ({
                      ...prev,
                      channels: e.target.value,
                    }))
                  }
                  placeholder="How do you reach customers?"
                  rows="4"
                  disabled={isInvestorView}
                  style={{
                    ...inputS,
                    resize: "vertical",
                    fontSize: "12px",
                    background: isInvestorView ? T.panel : T.bg,
                    cursor: isInvestorView ? "not-allowed" : "text",
                  }}
                />
              </div>

              <div style={cardS}>
                <h4
                  style={{
                    color: T.accent,
                    marginTop: 0,
                    marginBottom: "10px",
                    fontSize: "14px",
                  }}
                >
                  Customer Relationships
                </h4>
                <textarea
                  value={canvasData.customerRelationships}
                  onChange={(e) =>
                    setCanvasData((prev) => ({
                      ...prev,
                      customerRelationships: e.target.value,
                    }))
                  }
                  placeholder="What relationships do you have with customers?"
                  rows="4"
                  disabled={isInvestorView}
                  style={{
                    ...inputS,
                    resize: "vertical",
                    fontSize: "12px",
                    background: isInvestorView ? T.panel : T.bg,
                    cursor: isInvestorView ? "not-allowed" : "text",
                  }}
                />
              </div>
            </div>

            {/* Fourth Row - Cost Structure and Revenue Streams */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
              }}
            >
              <div style={cardS}>
                <h4
                  style={{
                    color: T.accent,
                    marginTop: 0,
                    marginBottom: "10px",
                    fontSize: "14px",
                  }}
                >
                  Cost Structure
                </h4>
                <textarea
                  value={canvasData.costStructure}
                  onChange={(e) =>
                    setCanvasData((prev) => ({
                      ...prev,
                      costStructure: e.target.value,
                    }))
                  }
                  placeholder="What are your main costs?"
                  rows="4"
                  disabled={isInvestorView}
                  style={{
                    ...inputS,
                    resize: "vertical",
                    fontSize: "12px",
                    background: isInvestorView ? T.panel : T.bg,
                    cursor: isInvestorView ? "not-allowed" : "text",
                  }}
                />
              </div>

              <div style={cardS}>
                <h4
                  style={{
                    color: T.accent,
                    marginTop: 0,
                    marginBottom: "10px",
                    fontSize: "14px",
                  }}
                >
                  Revenue Streams
                </h4>
                <textarea
                  value={canvasData.revenueStreams}
                  onChange={(e) =>
                    setCanvasData((prev) => ({
                      ...prev,
                      revenueStreams: e.target.value,
                    }))
                  }
                  placeholder="How do you generate revenue?"
                  rows="4"
                  disabled={isInvestorView}
                  style={{
                    ...inputS,
                    resize: "vertical",
                    fontSize: "12px",
                    background: isInvestorView ? T.panel : T.bg,
                    cursor: isInvestorView ? "not-allowed" : "text",
                  }}
                />
              </div>
            </div>
          </div>

          {/* AI Analysis Section */}
          <div style={{ marginTop: "20px", marginBottom: "20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "15px",
              }}
            >
              <button
                onClick={handleAIAnalysis}
                disabled={isGenerating || isInvestorView}
                style={{
                  ...btnPrimary,
                  opacity: isGenerating ? 0.7 : 1,
                  background: isInvestorView ? T.muted : T.accent,
                }}
              >
                {isGenerating ? (
                  <>
                    <FaSpinner
                      className="spin"
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                    Generating Analysis...
                  </>
                ) : (
                  <>
                    <FaRobot />
                    AI Operating Model Analysis
                  </>
                )}
              </button>

              {savedAnalysis && !isGenerating && !isInvestorView && (
                <button
                  onClick={refreshAnalysis}
                  style={{
                    ...btnGhost,
                    padding: "8px 16px",
                    fontSize: "12px",
                  }}
                  title="Refresh AI Analysis"
                >
                  Refresh
                </button>
              )}
            </div>

            {showAIAnalysis && (
              <div
                style={{
                  background: T.panel,
                  padding: "20px",
                  borderRadius: "10px",
                  border: `1px solid ${T.line}`,
                  marginTop: "10px",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "15px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        ...labelS,
                        fontSize: "16px",
                        marginBottom: "8px",
                      }}
                    >
                      Operating Model AI Analysis
                    </label>
                    <p
                      style={{
                        fontSize: "12px",
                        color: T.muted,
                        margin: "0 0 10px 0",
                        fontStyle: "italic",
                      }}
                    >
                      Analysis generated from your Business Model Canvas data
                    </p>
                  </div>

                  {savedAnalysis && (
                    <span
                      style={{
                        fontSize: "10px",
                        color: T.muted,
                        background: T.raised,
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontWeight: "500",
                      }}
                    >
                      Saved Analysis
                    </span>
                  )}
                </div>

                {analysisError ? (
                  <div
                    style={{
                      padding: "15px",
                      background: T.redBg,
                      borderRadius: "6px",
                      border: `1px solid ${T.red}33`,
                      color: T.red,
                      fontSize: "14px",
                    }}
                  >
                    <strong>Error:</strong> {analysisError}
                  </div>
                ) : isGenerating ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "30px",
                      color: T.body,
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        border: `3px solid ${T.lineSoft}`,
                        borderTop: `3px solid ${T.accent}`,
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                        margin: "0 auto 15px",
                      }}
                    ></div>
                    <p>Analyzing your Business Model Canvas...</p>
                    <p
                      style={{
                        fontSize: "12px",
                        color: T.muted,
                        marginTop: "5px",
                      }}
                    >
                      Evaluating coherence, scalability, and alignment
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      background: T.bg,
                      padding: "20px",
                      borderRadius: "8px",
                      border: `1px solid ${T.lineSoft}`,
                      maxHeight: "400px",
                      overflowY: "auto",
                      fontSize: "14px",
                      lineHeight: "1.6",
                      color: T.body,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {aiAnalysis ||
                      "AI analysis will be generated based on your Business Model Canvas data, comparing against best practices and industry benchmarks. This feature provides actionable insights for improving your operating model."}
                  </div>
                )}

                <div
                  style={{
                    marginTop: "15px",
                    paddingTop: "15px",
                    borderTop: `1px solid ${T.lineSoft}`,
                    fontSize: "11px",
                    color: T.muted,
                    fontStyle: "italic",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>
                    Analysis powered by AI • Updates when data changes
                  </span>
                  <button
                    onClick={() => setShowAIAnalysis(false)}
                    style={{
                      background: "none",
                      border: "none",
                      color: T.muted,
                      cursor: "pointer",
                      fontSize: "12px",
                      textDecoration: "underline",
                    }}
                  >
                    Hide Analysis
                  </button>
                </div>
              </div>
            )}
          </div>

          {!isInvestorView && (
            <div style={{ textAlign: "right", marginTop: "20px" }}>
              <button onClick={handleSaveCanvas} style={btnPrimary}>
                Save Operating Model
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Strategy Operationalisation Component
const StrategicGoals = ({
  activeSection,
  milestoneData,
  setMilestoneData,
  currentUser,
  isInvestorView,
}) => {
  const [activeSubTab, setActiveSubTab] = useState("all");
  const [viewMode, setViewMode] = useState("month");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [savedAnalysis, setSavedAnalysis] = useState("");

  const [filterGoal, setFilterGoal] = useState("");
  const [filterGoalDomain, setFilterGoalDomain] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterOwner, setFilterOwner] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const categories = [
    { key: "Growth", name: "Growth", color: "#4A2E1F" },
    { key: "Marketing", name: "Marketing", color: "#6B3F2A" },
    { key: "Finance", name: "Finance", color: "#8B5A2B" },
    { key: "Operations", name: "Operations", color: "#A47148" },
    {
      key: "Systems & Technology",
      name: "Systems & Technology",
      color: "#7A5230",
    },
    { key: "People", name: "People", color: "#C6A27E" },
    { key: "Governance", name: "Governance", color: "#E0C4A8" },
    { key: "Milestones", name: "Milestones", color: "#9d8573" },
    { key: "R&D", name: "R&D", color: "#b8a491" },
    { key: "ESG", name: "ESG", color: "#8b7355" },
  ];

  const subTabs = [
    { id: "all", label: "All" },
    ...categories.map((cat) => ({ id: cat.key, label: cat.name })),
  ];

  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [newMilestone, setNewMilestone] = useState({
    growthStage: "",
    customGrowthStage: "",
    goal: "",
    goalDescription: "",
    milestoneDescription: "",
    targetDate: "",
    status: "",
    owner: "",
    percentageCompletion: 0,
  });

  const cleanAIResponse = (text) => {
    if (!text) return text;
    let cleaned = text
      .replace(/^#+\s*/gm, "")
      .replace(/#/g, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
      .split("\n")
      .map((line) => line.trim())
      .join("\n")
      .trim();
    return cleaned;
  };

  useEffect(() => {
    if (currentUser && activeSection === "strategy-operationalisation") {
      loadSavedAIAnalysis();
    }
  }, [currentUser, activeSection]);

  const loadSavedAIAnalysis = async () => {
    try {
      const aiAnalysisRef = doc(
        db,
        "strategyOperationalisationAnalysis",
        currentUser.uid
      );
      const aiSnapshot = await getDoc(aiAnalysisRef);

      if (aiSnapshot.exists()) {
        const data = aiSnapshot.data();
        if (data.analysis) {
          setSavedAnalysis(data.analysis);
          setAiAnalysis(data.analysis);
        }
      }
    } catch (error) {
      console.error("Error loading saved analysis:", error);
    }
  };

  if (activeSection !== "strategy-operationalisation") return null;

  const getUniqueGoals = () => {
    const goals = [...new Set(milestoneData.map((m) => m.goal))].sort();
    return goals;
  };

  const getUniqueGoalDomains = () => {
    const domains = [
      ...new Set(milestoneData.map((m) => m.growthStage)),
    ].sort();
    return domains;
  };

  const getUniqueStatuses = () => {
    const statuses = [...new Set(milestoneData.map((m) => m.status))].sort();
    return statuses;
  };

  const getUniqueOwners = () => {
    const owners = [...new Set(milestoneData.map((m) => m.owner))].sort();
    return owners;
  };

  const calculateGoalCompletion = (goalNumber, growthStage) => {
    const relevantMilestones = milestoneData.filter(
      (milestone) =>
        milestone.goal === `Goal ${goalNumber}` &&
        milestone.growthStage === growthStage
    );

    if (relevantMilestones.length === 0) return 0;

    const totalPercentage = relevantMilestones.reduce((sum, milestone) => {
      return sum + (milestone.percentageCompletion || 0);
    }, 0);

    return Math.round(totalPercentage / relevantMilestones.length);
  };

  const getAllGoalDescriptions = (growthStage) => {
    const descriptionsByGoal = {};

    milestoneData
      .filter((m) => m.growthStage === growthStage && m.goalDescription)
      .forEach((milestone) => {
        if (!descriptionsByGoal[milestone.goal]) {
          descriptionsByGoal[milestone.goal] = new Set();
        }
        if (milestone.goalDescription) {
          descriptionsByGoal[milestone.goal].add(milestone.goalDescription);
        }
      });

    const result = {};
    Object.keys(descriptionsByGoal).forEach((goal) => {
      result[goal] = Array.from(descriptionsByGoal[goal]);
    });

    return result;
  };

  const createChartData = (growthStage, color) => {
    const goalsInStage = [
      ...new Set(
        milestoneData
          .filter((m) => m.growthStage === growthStage)
          .map((m) => m.goal)
      ),
    ].sort();

    const completionData = goalsInStage.map((goal) => {
      const relevantMilestones = milestoneData.filter(
        (milestone) =>
          milestone.goal === goal && milestone.growthStage === growthStage
      );

      if (relevantMilestones.length === 0) return 0;

      const totalPercentage = relevantMilestones.reduce((sum, milestone) => {
        return sum + (milestone.percentageCompletion || 0);
      }, 0);

      return Math.round(totalPercentage / relevantMilestones.length);
    });

    const allGoalDescriptions = getAllGoalDescriptions(growthStage);

    return {
      labels: goalsInStage,
      datasets: [
        {
          label: "% Completion",
          data: completionData,
          backgroundColor: color,
          borderColor: "#7d5a50",
          borderWidth: 1,
          goalDescriptions: allGoalDescriptions,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        display: false,
      },
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: (context) => {
            return context[0].label;
          },
          label: (context) => {
            return `Completion: ${context.raw}%`;
          },
          afterBody: (context) => {
            const dataPoint = context[0];
            const goalName = dataPoint.label;

            const chartElement = dataPoint.chart.canvas;
            const growthStage = chartElement?.getAttribute("data-growth-stage");

            if (!growthStage) return [];

            const goalDescriptions = milestoneData
              .filter(
                (m) =>
                  m.growthStage === growthStage &&
                  m.goal === goalName &&
                  m.goalDescription
              )
              .map((m) => m.goalDescription);

            const uniqueDescriptions = [...new Set(goalDescriptions)];

            if (uniqueDescriptions.length === 0) {
              return ["No goal description available"];
            }

            const descriptionLines = ["Goal Description:"];
            uniqueDescriptions.forEach((desc, index) => {
              descriptionLines.push(`  ${desc}`);
            });

            return descriptionLines;
          },
        },
        bodySpacing: 5,
        padding: 10,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value) => `${value}%`,
        },
        title: {
          display: true,
          text: "Completion %",
          color: T.body,
          font: {
            weight: "bold",
            size: 12,
          },
        },
        grid: {
          color: T.lineSoft,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: T.body,
        },
      },
    },
  };

  const goalDomains = [
    "Growth",
    "Marketing",
    "Finance",
    "Operations",
    "Systems & Technology",
    "People",
    "Governance",
    "Milestones",
    "R&D",
    "ESG",
    "Other (Specify)",
  ];

  const statuses = [
    "Not Started",
    "In Progress",
    "On Track",
    "At Risk",
    "Done",
  ];
  const owners = [
    "Product Team",
    "Business Dev",
    "Legal Team",
    "Engineering",
    "Marketing",
    "Operations",
  ];

  const filteredMilestones = milestoneData.filter((milestone) => {
    if (activeSubTab !== "all" && milestone.growthStage !== activeSubTab)
      return false;

    if (filterGoal && milestone.goal !== filterGoal) return false;
    if (filterGoalDomain && milestone.growthStage !== filterGoalDomain)
      return false;
    if (filterStatus && milestone.status !== filterStatus) return false;
    if (filterOwner && milestone.owner !== filterOwner) return false;
    if (filterDate && milestone.targetDate !== filterDate) return false;

    return true;
  });

  const clearAllFilters = () => {
    setFilterGoal("");
    setFilterGoalDomain("");
    setFilterStatus("");
    setFilterOwner("");
    setFilterDate("");
  };

  const prepareStrategicOperationalisationData = (data) => {
    const milestonesByDomain = {};
    const milestonesByGoal = {};
    const milestonesByStatus = {};
    const completionRates = {};

    data.forEach((milestone) => {
      if (!milestonesByDomain[milestone.growthStage]) {
        milestonesByDomain[milestone.growthStage] = [];
      }
      milestonesByDomain[milestone.growthStage].push(milestone);

      const goalKey = `${milestone.growthStage}-${milestone.goal}`;
      if (!milestonesByGoal[goalKey]) {
        milestonesByGoal[goalKey] = [];
      }
      milestonesByGoal[goalKey].push(milestone);

      if (!milestonesByStatus[milestone.status]) {
        milestonesByStatus[milestone.status] = 0;
      }
      milestonesByStatus[milestone.status]++;

      if (!completionRates[milestone.growthStage]) {
        completionRates[milestone.growthStage] = { total: 0, sum: 0 };
      }
      completionRates[milestone.growthStage].total++;
      completionRates[milestone.growthStage].sum +=
        milestone.percentageCompletion || 0;
    });

    const avgCompletionByDomain = {};
    Object.keys(completionRates).forEach((domain) => {
      avgCompletionByDomain[domain] = Math.round(
        completionRates[domain].sum / completionRates[domain].total
      );
    });

    return {
      totalMilestones: data.length,
      milestonesByDomain,
      milestonesByGoal,
      milestonesByStatus,
      avgCompletionByDomain,
      domainsWithMilestones: Object.keys(milestonesByDomain),
      completedMilestones: data.filter((m) => m.status === "Done").length,
      inProgressMilestones: data.filter(
        (m) => m.status === "In Progress" || m.status === "On Track"
      ).length,
      atRiskMilestones: data.filter((m) => m.status === "At Risk").length,
      notStartedMilestones: data.filter((m) => m.status === "Not Started")
        .length,
      overallCompletionRate:
        data.length > 0
          ? Math.round(
            data.reduce((sum, m) => sum + (m.percentageCompletion || 0), 0) /
            data.length
          )
          : 0,
    };
  };

  const createStrategicOperationalisationPrompt = (data) => {
    return `Analyze the Strategy Operationalisation of a business based on the following milestone tracking data:

STRATEGY OPERATIONALISATION DATA:
Total Milestones: ${data.totalMilestones}
Overall Completion Rate: ${data.overallCompletionRate}%

MILESTONES BY STATUS:
- Completed (Done): ${data.completedMilestones}
- In Progress/On Track: ${data.inProgressMilestones}
- At Risk: ${data.atRiskMilestones}
- Not Started: ${data.notStartedMilestones}

MILESTONES BY GOAL DOMAIN:
${Object.keys(data.milestonesByDomain)
        .map((domain) => {
          const milestones = data.milestonesByDomain[domain];
          const avgCompletion = data.avgCompletionByDomain[domain] || 0;
          return `- ${domain}: ${milestones.length} milestones, ${avgCompletion}% avg completion`;
        })
        .join("\n")}

MILESTONE DETAILS BY DOMAIN:
${Object.keys(data.milestonesByDomain)
        .map((domain) => {
          const milestones = data.milestonesByDomain[domain];
          return `\n${domain}:
  ${milestones.map((m) => `  • Goal: ${m.goal} - Goal Description: ${m.goalDescription || "Not provided"} - Milestone: ${m.milestoneDescription} - Status: ${m.status}, ${m.percentageCompletion}% complete, Owner: ${m.owner}, Target: ${m.targetDate}`).join("\n")}`;
        })
        .join("")}

ANALYSIS REQUIREMENTS:

1. STRATEGY EXECUTION ASSESSMENT:
   - Evaluate how well strategy is being translated into actionable milestones
   - Assess goal alignment across different domains
   - Identify strengths and gaps in execution

2. PROGRESS ANALYSIS:
   - Analyze completion rates by domain and goal
   - Identify patterns in milestone delays or early completions
   - Assess overall execution velocity

3. RESOURCE & OWNERSHIP ANALYSIS:
   - Evaluate owner distribution and accountability
   - Identify potential resource constraints or bottlenecks
   - Assess team capacity and workload balance

4. RISK IDENTIFICATION:
   - Identify at-risk milestones and their impact on strategic goals
   - Highlight domains with low completion rates
   - Flag potential timeline issues

5. ACTIONABLE RECOMMENDATIONS:
   - Provide 3-5 specific, actionable improvements
   - Suggest priority areas for immediate focus
   - Recommend resource reallocation if needed
   - Include timelines and measurable outcomes

6. STRATEGIC ALIGNMENT:
   - Assess coherence between milestones and strategic objectives
   - Evaluate balance across different goal domains
   - Suggest strategic reprioritization if needed

FORMAT REQUIREMENTS:
- Start with an executive summary
- Use plain text section headers without markdown symbols
- Include specific examples from the data
- End with a Strategy Execution Score and Rating

OUTPUT FORMAT:
Executive Summary
[Brief overview of strategy operationalisation status]

Strategy Execution Score: [X]/10
Rating: [Poor/Fair/Good/Excellent]

Progress Analysis by Domain
[Detailed analysis of each domain's progress]

Status Distribution Analysis
[Analysis of milestone status distribution and implications]

Risk Assessment
[Key risks and mitigation strategies]

Resource & Ownership Insights
[Analysis of team allocation and accountability]

Top 5 Actionable Recommendations
1. [Specific action with timeline and owner suggestion]
2. [Specific action with measurable goal]
3. [Specific action with concrete steps]
4. [Specific action for at-risk milestones]
5. [Specific action for improving execution velocity]

Strategic Alignment Assessment
[How well execution aligns with strategic objectives]

IMPORTANT: Do NOT use any markdown formatting like ###, **, or # in your response. Use plain text only with section titles as shown above.`;
  };

  const generateAIAnalysis = async () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot generate AI analysis.");
      return;
    }

    if (!milestoneData || milestoneData.length === 0 || !currentUser) {
      setAnalysisError(
        "No milestone data available for analysis. Please add some milestones first."
      );
      return;
    }

    setIsGenerating(true);
    setAnalysisError("");
    setShowAIAnalysis(true);

    try {
      const analysisData =
        prepareStrategicOperationalisationData(milestoneData);
      const prompt = createStrategicOperationalisationPrompt(analysisData);

      const functions = getFunctions();
      const generateStrategyOperationalisationAnalysis = httpsCallable(
        functions,
        "generateStrategyOperationalisationAnalysis"
      );

      const response = await generateStrategyOperationalisationAnalysis({
        prompt: prompt,
        userId: currentUser.uid,
        timestamp: new Date().toISOString(),
      });

      let analysis = response?.data?.content || response?.data?.analysis;

      if (!analysis) {
        throw new Error("No analysis generated");
      }

      analysis = cleanAIResponse(analysis);

      const aiAnalysisRef = doc(
        db,
        "strategyOperationalisationAnalysis",
        currentUser.uid
      );
      await setDoc(
        aiAnalysisRef,
        {
          analysis: analysis,
          timestamp: new Date().toISOString(),
          dataSnapshot: milestoneData,
          userId: currentUser.uid,
          milestoneCount: milestoneData.length,
        },
        { merge: true }
      );

      setAiAnalysis(analysis);
      setSavedAnalysis(analysis);
    } catch (error) {
      console.error("Error generating AI analysis:", error);
      setAnalysisError(`Failed to generate analysis: ${error.message}`);
      setAiAnalysis(
        "AI analysis will be generated based on your strategic milestones data, tracking progress, identifying risks, and providing actionable insights to improve strategy execution."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAIAnalysis = () => {
    if (!showAIAnalysis) {
      if (savedAnalysis) {
        setAiAnalysis(savedAnalysis);
        setShowAIAnalysis(true);
      } else {
        generateAIAnalysis();
      }
    } else {
      setShowAIAnalysis(!showAIAnalysis);
    }
  };

  const refreshAnalysis = async () => {
    await generateAIAnalysis();
  };

  const handleAddMilestone = () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.");
      return;
    }

    setEditingMilestone(null);
    setNewMilestone({
      growthStage: "",
      customGrowthStage: "",
      goal: "",
      goalDescription: "",
      milestoneDescription: "",
      targetDate: "",
      status: "",
      owner: "",
      percentageCompletion: 0,
    });
    setShowMilestoneModal(true);
  };

  const handleEditMilestone = (milestone) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.");
      return;
    }

    setEditingMilestone(milestone);
    setNewMilestone({
      ...milestone,
      customGrowthStage: milestone.customGrowthStage || "",
      goalDescription: milestone.goalDescription || "",
      percentageCompletion: milestone.percentageCompletion || 0,
    });
    setShowMilestoneModal(true);
  };

  const handleSaveMilestone = async () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.");
      return;
    }

    if (!currentUser) {
      alert("You must be logged in to save milestones.");
      return;
    }

    try {
      const finalGrowthStage =
        newMilestone.growthStage === "Other (Specify)"
          ? newMilestone.customGrowthStage
          : newMilestone.growthStage;

      const milestoneWithUser = {
        growthStage: finalGrowthStage,
        customGrowthStage: newMilestone.customGrowthStage,
        goal: newMilestone.goal,
        goalDescription: newMilestone.goalDescription,
        milestoneDescription: newMilestone.milestoneDescription,
        targetDate: newMilestone.targetDate,
        status: newMilestone.status,
        owner: newMilestone.owner,
        percentageCompletion: newMilestone.percentageCompletion,
        userId: currentUser.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingMilestone) {
        const milestoneRef = doc(db, "milestones", editingMilestone.id);
        await updateDoc(milestoneRef, milestoneWithUser);

        setMilestoneData((prev) =>
          prev.map((m) =>
            m.id === editingMilestone.id
              ? { ...milestoneWithUser, id: editingMilestone.id }
              : m
          )
        );
      } else {
        const docRef = await addDoc(
          collection(db, "milestones"),
          milestoneWithUser
        );
        setMilestoneData((prev) => [
          ...prev,
          { ...milestoneWithUser, id: docRef.id },
        ]);
      }

      setShowMilestoneModal(false);
      setNewMilestone({
        growthStage: "",
        customGrowthStage: "",
        goal: "",
        goalDescription: "",
        milestoneDescription: "",
        targetDate: "",
        status: "",
        owner: "",
        percentageCompletion: 0,
      });

      setSavedAnalysis("");
    } catch (error) {
      console.error("Error saving milestone:", error);
      alert("Error saving milestone. Please try again.");
    }
  };

  const handleDeleteMilestone = async (milestoneId) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this milestone?")) {
      try {
        await deleteDoc(doc(db, "milestones", milestoneId));
        setMilestoneData((prev) => prev.filter((m) => m.id !== milestoneId));
        setSavedAnalysis("");
      } catch (error) {
        console.error("Error deleting milestone:", error);
        alert("Error deleting milestone. Please try again.");
      }
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);

  return (
    <div style={cardS}>
      <KeyQuestionBox
        question={SECTION_DATA["strategy-operationalisation"].keyQuestion}
        signals={SECTION_DATA["strategy-operationalisation"].keySignals}
        decisions={SECTION_DATA["strategy-operationalisation"].keyDecisions}
      />

      <h3 style={{ color: T.accent, marginBottom: "10px" }}>
        Strategic Goals Progress
      </h3>

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              padding: "10px 20px",
              background: activeSubTab === tab.id ? T.accent : T.raised,
              color: activeSubTab === tab.id ? "#fff" : T.body,
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "500",
              fontSize: "14px",
              flexShrink: 0,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === "all" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          {categories
            .filter((category) => {
              const chartData = createChartData(category.key, category.color);
              return chartData.labels.length > 0;
            })
            .map((category) => {
              const chartData = createChartData(category.key, category.color);
              return (
                <div
                  key={category.key}
                  style={{
                    ...cardS,
                    border: `2px solid ${category.color}`,
                  }}
                >
                  <h4
                    style={{
                      color: T.accent,
                      marginBottom: "15px",
                      fontSize: "15px",
                    }}
                  >
                    {category.name}
                  </h4>
                  <div style={{ height: "250px" }}>
                    <Bar
                      data={chartData}
                      options={chartOptions}
                      data-growth-stage={category.key}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      ) : (
        <div
          style={{
            ...cardS,
            border: `2px solid ${categories.find((c) => c.key === activeSubTab)?.color || T.accent}`,
            marginBottom: "30px",
          }}
        >
          <h4
            style={{ color: T.accent, marginBottom: "15px", fontSize: "15px" }}
          >
            {categories.find((c) => c.key === activeSubTab)?.name ||
              activeSubTab}
          </h4>
          <div style={{ height: "250px" }}>
            <Bar
              data={createChartData(
                activeSubTab,
                categories.find((c) => c.key === activeSubTab)?.color ||
                T.accent
              )}
              options={chartOptions}
              data-growth-stage={activeSubTab}
            />
          </div>
        </div>
      )}

      <div
        style={{
          marginBottom: "20px",
          padding: "20px",
          background: T.panel,
          borderRadius: "10px",
          border: `2px solid ${activeSubTab === "all" ? T.accent : categories.find((c) => c.key === activeSubTab)?.color || T.accent}`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
          }}
        >
          <h4
            style={{
              color: T.accent,
              margin: 0,
              fontSize: "15px",
              fontWeight: "600",
            }}
          >
            Quick Filters
            {activeSubTab !== "all" && (
              <span
                style={{
                  fontSize: "12px",
                  marginLeft: "10px",
                  color: T.muted,
                  fontWeight: "normal",
                }}
              >
                {categories.find((c) => c.key === activeSubTab)?.name}
              </span>
            )}
          </h4>
          <button
            onClick={clearAllFilters}
            style={btnGhost}
          >
            Clear All
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
          }}
        >
          <div>
            <label
              style={{
                ...labelS,
                fontSize: "12px",
              }}
            >
              Goal
            </label>
            <select
              value={filterGoal}
              onChange={(e) => setFilterGoal(e.target.value)}
              style={selectS}
            >
              <option value="">All Goals</option>
              {getUniqueGoals().map((goal) => (
                <option key={goal} value={goal}>
                  {goal}
                </option>
              ))}
            </select>
          </div>

          {activeSubTab === "all" && (
            <div>
              <label
                style={{
                  ...labelS,
                  fontSize: "12px",
                }}
              >
                Goal Domain
              </label>
              <select
                value={filterGoalDomain}
                onChange={(e) => setFilterGoalDomain(e.target.value)}
                style={selectS}
              >
                <option value="">All Domains</option>
                {getUniqueGoalDomains().map((domain) => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label
              style={{
                ...labelS,
                fontSize: "12px",
              }}
            >
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={selectS}
            >
              <option value="">All Statuses</option>
              {getUniqueStatuses().map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{
                ...labelS,
                fontSize: "12px",
              }}
            >
              Owner
            </label>
            <select
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
              style={selectS}
            >
              <option value="">All Owners</option>
              {getUniqueOwners().map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{
                ...labelS,
                fontSize: "12px",
              }}
            >
              Target Date
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={inputS}
            />
          </div>
        </div>

        {!isInvestorView && (
          <div style={{ marginTop: "15px", textAlign: "right" }}>
            <button
              onClick={handleAddMilestone}
              style={btnPrimary}
            >
              + Add Milestone
            </button>
          </div>
        )}
      </div>

      <div
        style={{
          overflowX: "auto",
          background: T.bg,
          borderRadius: "10px",
          padding: "20px",
          border: `2px solid ${activeSubTab === "all" ? T.accent : categories.find((c) => c.key === activeSubTab)?.color || T.accent}`,
        }}
      >
        <div
          style={{
            marginBottom: "15px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h4
            style={{
              color: T.accent,
              margin: 0,
              fontSize: "15px",
              fontWeight: "600",
            }}
          >
            Milestones
            {activeSubTab !== "all" && (
              <span
                style={{
                  fontSize: "12px",
                  marginLeft: "10px",
                  color: T.muted,
                  fontWeight: "normal",
                }}
              >
                {categories.find((c) => c.key === activeSubTab)?.name}
              </span>
            )}
          </h4>
          {(filterGoal ||
            filterGoalDomain ||
            filterStatus ||
            filterOwner ||
            filterDate) && (
              <span style={{ fontSize: "12px", color: T.muted }}>
                Showing {filteredMilestones.length} of{" "}
                {
                  milestoneData.filter((m) =>
                    activeSubTab === "all"
                      ? true
                      : m.growthStage === activeSubTab
                  ).length
                }{" "}
                items
              </span>
            )}
        </div>

        {filteredMilestones.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "40px", color: T.muted }}
          >
            {milestoneData.length === 0
              ? `No milestones added yet. ${!isInvestorView ? 'Click "Add Milestone" to get started.' : ""}`
              : `No milestones found for the selected filters.`}
            {(filterGoal ||
              filterGoalDomain ||
              filterStatus ||
              filterOwner ||
              filterDate) && (
                <p style={{ marginTop: "10px", fontSize: "13px" }}>
                  Try clearing some filters to see more milestones.
                </p>
              )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                color: T.body,
                minWidth: "1400px",
                fontSize: "12px",
                tableLayout: "fixed",
              }}
            >
              <colgroup>
                {activeSubTab === "all" && (
                  <col style={{ width: "120px" }} />
                )}
                <col style={{ width: "80px" }} />
                <col style={{ width: "200px" }} />
                <col style={{ width: "200px" }} />
                <col style={{ width: "100px" }} />
                <col style={{ width: "120px" }} />
                <col style={{ width: "120px" }} />
                <col style={{ width: "80px" }} />
                {!isInvestorView && activeSubTab !== "all" && (
                  <col style={{ width: "80px" }} />
                )}
              </colgroup>
              <thead>
                <tr
                  style={{
                    background: T.header,
                    borderBottom: `2px solid ${T.line}`,
                  }}
                >
                  {activeSubTab === "all" && (
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontWeight: "600",
                        color: "#fff",
                      }}
                    >
                      Goal Domain
                    </th>
                  )}
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      fontWeight: "600",
                      color: "#fff",
                    }}
                  >
                    Goal
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      fontWeight: "600",
                      color: "#fff",
                    }}
                  >
                    Goal Description
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      fontWeight: "600",
                      color: "#fff",
                    }}
                  >
                    Milestone
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      fontWeight: "600",
                      color: "#fff",
                    }}
                  >
                    Target Date
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      fontWeight: "600",
                      color: "#fff",
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      fontWeight: "600",
                      color: "#fff",
                    }}
                  >
                    Owner
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      fontWeight: "600",
                      color: "#fff",
                    }}
                  >
                    % Complete
                  </th>
                  {!isInvestorView && activeSubTab !== "all" && (
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        fontWeight: "600",
                        color: "#fff",
                      }}
                    >
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredMilestones.map((milestone) => (
                  <tr
                    key={milestone.id}
                    style={{ borderBottom: `1px solid ${T.lineSoft}` }}
                  >
                    {activeSubTab === "all" && (
                      <td
                        style={{
                          padding: "12px",
                          fontSize: "12px",
                          wordWrap: "break-word",
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                          maxWidth: "120px",
                          lineHeight: "1.4",
                        }}
                      >
                        {milestone.growthStage}
                      </td>
                    )}
                    <td
                      style={{
                        padding: "12px",
                        fontSize: "12px",
                        wordWrap: "break-word",
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                      }}
                    >
                      {milestone.goal}
                    </td>
                    <td style={{ padding: "12px", fontSize: "12px" }}>
                      <textarea
                        value={milestone.goalDescription || ""}
                        onChange={(e) => {
                          if (!isInvestorView && activeSubTab !== "all") {
                            const updatedMilestone = {
                              ...milestone,
                              goalDescription: e.target.value,
                            };
                            setMilestoneData((prev) =>
                              prev.map((m) =>
                                m.id === milestone.id ? updatedMilestone : m
                              )
                            );
                            const milestoneRef = doc(
                              db,
                              "milestones",
                              milestone.id
                            );
                            updateDoc(milestoneRef, {
                              goalDescription: e.target.value,
                            });
                          }
                        }}
                        disabled={isInvestorView || activeSubTab === "all"}
                        rows="2"
                        placeholder="Goal description"
                        style={{
                          width: "100%",
                          padding: "6px",
                          border: `1px solid ${T.line}`,
                          borderRadius: "4px",
                          fontSize: "12px",
                          resize: "vertical",
                          background:
                            isInvestorView || activeSubTab === "all"
                              ? T.panel
                              : T.bg,
                          cursor:
                            isInvestorView || activeSubTab === "all"
                              ? "not-allowed"
                              : "text",
                          fontFamily: "inherit",
                        }}
                      />
                    </td>
                    <td style={{ padding: "12px", fontSize: "12px" }}>
                      <textarea
                        value={milestone.milestoneDescription}
                        onChange={(e) => {
                          if (!isInvestorView && activeSubTab !== "all") {
                            const updatedMilestone = {
                              ...milestone,
                              milestoneDescription: e.target.value,
                            };
                            setMilestoneData((prev) =>
                              prev.map((m) =>
                                m.id === milestone.id ? updatedMilestone : m
                              )
                            );
                            const milestoneRef = doc(
                              db,
                              "milestones",
                              milestone.id
                            );
                            updateDoc(milestoneRef, {
                              milestoneDescription: e.target.value,
                            });
                          }
                        }}
                        disabled={isInvestorView || activeSubTab === "all"}
                        rows="2"
                        placeholder="How to reach this goal"
                        style={{
                          width: "100%",
                          padding: "6px",
                          border: `1px solid ${T.line}`,
                          borderRadius: "4px",
                          fontSize: "12px",
                          resize: "vertical",
                          background:
                            isInvestorView || activeSubTab === "all"
                              ? T.panel
                              : T.bg,
                          cursor:
                            isInvestorView || activeSubTab === "all"
                              ? "not-allowed"
                              : "text",
                          fontFamily: "inherit",
                        }}
                      />
                    </td>
                    <td style={{ padding: "12px", fontSize: "12px" }}>
                      <input
                        type="date"
                        value={milestone.targetDate}
                        onChange={(e) => {
                          if (!isInvestorView && activeSubTab !== "all") {
                            const updatedMilestone = {
                              ...milestone,
                              targetDate: e.target.value,
                            };
                            setMilestoneData((prev) =>
                              prev.map((m) =>
                                m.id === milestone.id ? updatedMilestone : m
                              )
                            );
                            const milestoneRef = doc(
                              db,
                              "milestones",
                              milestone.id
                            );
                            updateDoc(milestoneRef, {
                              targetDate: e.target.value,
                            });
                          }
                        }}
                        disabled={isInvestorView || activeSubTab === "all"}
                        style={{
                          ...inputS,
                          fontSize: "12px",
                          padding: "6px",
                          background:
                            isInvestorView || activeSubTab === "all"
                              ? T.panel
                              : T.bg,
                          cursor:
                            isInvestorView || activeSubTab === "all"
                              ? "not-allowed"
                              : "text",
                        }}
                      />
                    </td>
                    <td style={{ padding: "12px", fontSize: "12px" }}>
                      <select
                        value={milestone.status}
                        onChange={(e) => {
                          if (!isInvestorView && activeSubTab !== "all") {
                            const updatedMilestone = {
                              ...milestone,
                              status: e.target.value,
                            };
                            setMilestoneData((prev) =>
                              prev.map((m) =>
                                m.id === milestone.id ? updatedMilestone : m
                              )
                            );
                            const milestoneRef = doc(
                              db,
                              "milestones",
                              milestone.id
                            );
                            updateDoc(milestoneRef, { status: e.target.value });
                          }
                        }}
                        disabled={isInvestorView || activeSubTab === "all"}
                        style={{
                          ...selectS,
                          fontSize: "12px",
                          padding: "6px",
                          background:
                            isInvestorView || activeSubTab === "all"
                              ? T.panel
                              : T.bg,
                          cursor:
                            isInvestorView || activeSubTab === "all"
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        <option value="">Select Status</option>
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: "12px", fontSize: "12px" }}>
                      <select
                        value={milestone.owner}
                        onChange={(e) => {
                          if (!isInvestorView && activeSubTab !== "all") {
                            const updatedMilestone = {
                              ...milestone,
                              owner: e.target.value,
                            };
                            setMilestoneData((prev) =>
                              prev.map((m) =>
                                m.id === milestone.id ? updatedMilestone : m
                              )
                            );
                            const milestoneRef = doc(
                              db,
                              "milestones",
                              milestone.id
                            );
                            updateDoc(milestoneRef, { owner: e.target.value });
                          }
                        }}
                        disabled={isInvestorView || activeSubTab === "all"}
                        style={{
                          ...selectS,
                          fontSize: "12px",
                          padding: "6px",
                          background:
                            isInvestorView || activeSubTab === "all"
                              ? T.panel
                              : T.bg,
                          cursor:
                            isInvestorView || activeSubTab === "all"
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        <option value="">Select Owner</option>
                        {owners.map((owner) => (
                          <option key={owner} value={owner}>
                            {owner}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        fontSize: "12px",
                      }}
                    >
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="5"
                        value={milestone.percentageCompletion || 0}
                        onChange={(e) => {
                          if (!isInvestorView && activeSubTab !== "all") {
                            const value = Number.parseInt(e.target.value);
                            const updatedMilestone = {
                              ...milestone,
                              percentageCompletion: value,
                            };
                            setMilestoneData((prev) =>
                              prev.map((m) =>
                                m.id === milestone.id ? updatedMilestone : m
                              )
                            );
                            const milestoneRef = doc(
                              db,
                              "milestones",
                              milestone.id
                            );
                            updateDoc(milestoneRef, {
                              percentageCompletion: value,
                            });
                          }
                        }}
                        disabled={isInvestorView || activeSubTab === "all"}
                        style={{
                          width: "60px",
                          padding: "6px",
                          border: `1px solid ${T.line}`,
                          borderRadius: "4px",
                          fontSize: "12px",
                          textAlign: "center",
                          background:
                            isInvestorView || activeSubTab === "all"
                              ? T.panel
                              : T.bg,
                          cursor:
                            isInvestorView || activeSubTab === "all"
                              ? "not-allowed"
                              : "text",
                        }}
                      />
                    </td>
                    {!isInvestorView && activeSubTab !== "all" && (
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <button
                          onClick={() => handleDeleteMilestone(milestone.id)}
                          style={{
                            padding: "6px 12px",
                            background: "transparent",
                            color: T.red,
                            border: `1px solid ${T.red}`,
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                          title="Delete"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ marginTop: "30px", marginBottom: "20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "15px",
          }}
        >
          <button
            onClick={handleAIAnalysis}
            disabled={
              isGenerating || isInvestorView || milestoneData.length === 0
            }
            style={{
              ...btnPrimary,
              opacity: isGenerating ? 0.7 : 1,
              background:
                isInvestorView || milestoneData.length === 0
                  ? T.muted
                  : T.accent,
            }}
          >
            {isGenerating ? (
              <>
                <FaSpinner
                  className="spin"
                  style={{ animation: "spin 1s linear infinite" }}
                />
                Generating Analysis...
              </>
            ) : (
              <>
                <FaRobot />
                AI Strategy Execution Analysis
              </>
            )}
          </button>

          {savedAnalysis &&
            !isGenerating &&
            !isInvestorView &&
            milestoneData.length > 0 && (
              <button
                onClick={refreshAnalysis}
                style={{
                  ...btnGhost,
                  padding: "8px 16px",
                  fontSize: "12px",
                }}
                title="Refresh AI Analysis"
              >
                Refresh
              </button>
            )}
        </div>

        {milestoneData.length === 0 && (
          <p
            style={{
              color: T.muted,
              fontSize: "13px",
              fontStyle: "italic",
              marginLeft: "10px",
            }}
          >
            Add milestones to generate AI analysis of your strategy execution.
          </p>
        )}

        {showAIAnalysis && (
          <div
            style={{
              background: T.panel,
              padding: "20px",
              borderRadius: "10px",
              border: `1px solid ${T.line}`,
              marginTop: "10px",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "15px",
              }}
            >
              <div>
                <label
                  style={{
                    ...labelS,
                    fontSize: "16px",
                    marginBottom: "8px",
                  }}
                >
                  Strategy Execution AI Analysis
                </label>
                <p
                  style={{
                    fontSize: "12px",
                    color: T.muted,
                    margin: "0 0 10px 0",
                    fontStyle: "italic",
                  }}
                >
                  Analysis generated from {milestoneData.length} strategic
                  milestones
                </p>
              </div>

              {savedAnalysis && (
                <span
                  style={{
                    fontSize: "10px",
                    color: T.muted,
                    background: T.raised,
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontWeight: "500",
                  }}
                >
                  Saved Analysis
                </span>
              )}
            </div>

            {analysisError ? (
              <div
                style={{
                  padding: "15px",
                  background: T.redBg,
                  borderRadius: "6px",
                  border: `1px solid ${T.red}33`,
                  color: T.red,
                  fontSize: "14px",
                }}
              >
                <strong>Error:</strong> {analysisError}
              </div>
            ) : isGenerating ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "30px",
                  color: T.body,
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    border: `3px solid ${T.lineSoft}`,
                    borderTop: `3px solid ${T.accent}`,
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    margin: "0 auto 15px",
                  }}
                ></div>
                <p>Analyzing your strategic milestones...</p>
                <p
                  style={{
                    fontSize: "12px",
                    color: T.muted,
                    marginTop: "5px",
                  }}
                >
                  Evaluating progress, identifying risks, and generating
                  recommendations
                </p>
              </div>
            ) : (
              <div
                style={{
                  background: T.bg,
                  padding: "20px",
                  borderRadius: "8px",
                  border: `1px solid ${T.lineSoft}`,
                  maxHeight: "400px",
                  overflowY: "auto",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  color: T.body,
                  whiteSpace: "pre-wrap",
                }}
              >
                {aiAnalysis ||
                  "AI analysis will be generated based on your strategic milestones data, tracking progress, identifying risks, and providing actionable insights to improve strategy execution."}
              </div>
            )}

            <div
              style={{
                marginTop: "15px",
                paddingTop: "15px",
                borderTop: `1px solid ${T.lineSoft}`,
                fontSize: "11px",
                color: T.muted,
                fontStyle: "italic",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>
                Analysis powered by AI • Updates when milestone data changes
              </span>
              <button
                onClick={() => setShowAIAnalysis(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: T.muted,
                  cursor: "pointer",
                  fontSize: "12px",
                  textDecoration: "underline",
                }}
              >
                Hide Analysis
              </button>
            </div>
          </div>
        )}
      </div>

      {showMilestoneModal && !isInvestorView && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            overflow: "auto",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: T.bg,
              padding: "30px",
              borderRadius: "10px",
              width: "90%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <h3 style={{ color: T.accent, marginTop: 0 }}>
              {editingMilestone ? "Edit Milestone" : "Add New Milestone"}
            </h3>

            <div style={{ marginBottom: "15px" }}>
              <label style={labelS}>Goal Domain</label>
              <select
                value={newMilestone.growthStage}
                onChange={(e) => {
                  setNewMilestone((prev) => ({
                    ...prev,
                    growthStage: e.target.value,
                  }));
                }}
                style={selectS}
              >
                <option value="">Select Goal Domain</option>
                {goalDomains.map((domain) => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))}
              </select>
            </div>

            {newMilestone.growthStage === "Other (Specify)" && (
              <div style={{ marginBottom: "15px" }}>
                <label style={labelS}>Custom Goal Domain</label>
                <input
                  type="text"
                  value={newMilestone.customGrowthStage}
                  onChange={(e) =>
                    setNewMilestone((prev) => ({
                      ...prev,
                      customGrowthStage: e.target.value,
                    }))
                  }
                  placeholder="Enter custom goal domain"
                  style={inputS}
                />
              </div>
            )}

            <div style={{ marginBottom: "15px" }}>
              <label style={labelS}>Goal</label>
              <select
                value={newMilestone.goal}
                onChange={(e) =>
                  setNewMilestone((prev) => ({ ...prev, goal: e.target.value }))
                }
                style={selectS}
              >
                <option value="">Select Goal</option>
                {getAvailableGoals().map((goal) => (
                  <option key={goal} value={goal}>
                    {goal}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={labelS}>Goal Description</label>
              <textarea
                value={newMilestone.goalDescription}
                onChange={(e) =>
                  setNewMilestone((prev) => ({
                    ...prev,
                    goalDescription: e.target.value,
                  }))
                }
                placeholder="Describe the goal you want to achieve"
                rows="2"
                style={{
                  ...inputS,
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={labelS}>
                Milestone{" "}
                <span
                  style={{
                    fontSize: "12px",
                    color: T.muted,
                    fontWeight: "normal",
                  }}
                >
                  (How you will reach this goal)
                </span>
              </label>
              <textarea
                value={newMilestone.milestoneDescription}
                onChange={(e) =>
                  setNewMilestone((prev) => ({
                    ...prev,
                    milestoneDescription: e.target.value,
                  }))
                }
                placeholder="Describe the specific actions or steps to achieve this goal"
                rows="3"
                style={{
                  ...inputS,
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={labelS}>Target Date</label>
              <input
                type="date"
                value={newMilestone.targetDate}
                onChange={(e) =>
                  setNewMilestone((prev) => ({
                    ...prev,
                    targetDate: e.target.value,
                  }))
                }
                style={inputS}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={labelS}>Status</label>
              <select
                value={newMilestone.status}
                onChange={(e) =>
                  setNewMilestone((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
                style={selectS}
              >
                <option value="">Select Status</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={labelS}>Owner</label>
              <select
                value={newMilestone.owner}
                onChange={(e) =>
                  setNewMilestone((prev) => ({
                    ...prev,
                    owner: e.target.value,
                  }))
                }
                style={selectS}
              >
                <option value="">Select Owner</option>
                {owners.map((owner) => (
                  <option key={owner} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={labelS}>
                Percentage Completion: {newMilestone.percentageCompletion}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={newMilestone.percentageCompletion}
                onChange={(e) =>
                  setNewMilestone((prev) => ({
                    ...prev,
                    percentageCompletion: Number.parseInt(e.target.value),
                  }))
                }
                style={{ width: "100%" }}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowMilestoneModal(false)}
                style={btnGhost}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMilestone}
                style={btnPrimary}
              >
                {editingMilestone ? "Update Milestone" : "Add Milestone"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function for getAvailableGoals (used in StrategicGoals)
const getAvailableGoals = () => {
  // This is a placeholder - in the actual component, this would be defined properly
  // The actual implementation is inside the StrategicGoals component
  return ["Goal 1", "Goal 2", "Goal 3", "Goal 4", "Goal 5"];
};

// Risk Management Component
const RiskManagement = ({ activeSection, currentUser, isInvestorView }) => {
  const [riskData, setRiskData] = useState({
    "financial-risk": [],
    "market-risk": [],
    "operational-risk": [],
    "reputational-risk": [],
    "compliance-risk": [],
    "technology-risk": [],
    "people-risk": [],
  });
  const [riskSection, setRiskSection] = useState("financial-risk");
  const [hoveredRiskType, setHoveredRiskType] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [filterRisk, setFilterRisk] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterOwner, setFilterOwner] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [savedAnalysis, setSavedAnalysis] = useState("");

  const riskCategories = [
    { id: "business-risk", name: "Business Risk (All)", color: "#7d5a50" },
    {
      id: "financial-risk",
      name: "Financial Risk",
      color: RISK_COLORS["financial-risk"],
    },
    {
      id: "market-risk",
      name: "Market Risk",
      color: RISK_COLORS["market-risk"],
    },
    {
      id: "operational-risk",
      name: "Operational Risk",
      color: RISK_COLORS["operational-risk"],
    },
    {
      id: "reputational-risk",
      name: "Reputational Risk",
      color: RISK_COLORS["reputational-risk"],
    },
    {
      id: "compliance-risk",
      name: "Compliance Risk",
      color: RISK_COLORS["compliance-risk"],
    },
    {
      id: "technology-risk",
      name: "Technology Risk",
      color: RISK_COLORS["technology-risk"],
    },
    {
      id: "people-risk",
      name: "People Risk",
      color: RISK_COLORS["people-risk"] || "#619399",
    },
  ];

  const cleanAIResponse = (text) => {
    if (!text) return text;
    let cleaned = text
      .replace(/^#+\s*/gm, "")
      .replace(/#/g, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
      .split("\n")
      .map((line) => line.trim())
      .join("\n")
      .trim();
    return cleaned;
  };

  useEffect(() => {
    const loadRiskData = async () => {
      if (!currentUser || activeSection !== "strategic-risk-control") return;

      try {
        const riskSnapshot = await getDocs(
          query(
            collection(db, "risks"),
            where("userId", "==", currentUser.uid)
          )
        );

        const loadedRisks = {
          "financial-risk": [],
          "market-risk": [],
          "operational-risk": [],
          "reputational-risk": [],
          "compliance-risk": [],
          "technology-risk": [],
          "people-risk": [],
        };

        riskSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          const category = data.category || "financial-risk";
          if (loadedRisks[category]) {
            loadedRisks[category].push({ id: doc.id, ...data });
          }
        });

        setRiskData(loadedRisks);
      } catch (error) {
        console.error("Error loading risk data:", error);
      }
    };

    loadRiskData();
  }, [activeSection, currentUser]);

  useEffect(() => {
    if (currentUser && activeSection === "strategic-risk-control") {
      loadSavedAIAnalysis();
    }
  }, [currentUser, activeSection]);

  const loadSavedAIAnalysis = async () => {
    try {
      const aiAnalysisRef = doc(
        db,
        "strategicRiskControlAnalysis",
        currentUser.uid
      );
      const aiSnapshot = await getDoc(aiAnalysisRef);
      if (aiSnapshot.exists()) {
        const data = aiSnapshot.data();
        if (data.analysis) {
          setSavedAnalysis(data.analysis);
          setAiAnalysis(data.analysis);
        }
      }
    } catch (error) {
      console.error("Error loading saved analysis:", error);
    }
  };

  if (activeSection !== "strategic-risk-control") return null;

  const addRiskItem = async (category) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.");
      return;
    }
    if (!currentUser) {
      alert("You must be logged in to add risks.");
      return;
    }

    const categoryRisks = riskData[category] || [];
    const riskNumber = `${category.split("-")[0].toUpperCase()}-${String(categoryRisks.length + 1).padStart(3, "0")}`;

    const newRisk = {
      riskNumber: riskNumber,
      riskSubCategory: "",
      riskCategory:
        riskCategories.find((c) => c.id === category)?.name || "Financial Risk",
      description: "",
      severity: 1,
      likelihood: 1,
      mitigation: "",
      mitigationStatus: "🔴 Uncontrolled",
      owner: "",
      reviewCadence: "",
      userId: currentUser.uid,
      category: category,
      createdAt: new Date().toISOString(),
      actionDate: "",
    };

    try {
      const docRef = await addDoc(collection(db, "risks"), newRisk);
      setRiskData((prev) => ({
        ...prev,
        [category]: [...prev[category], { id: docRef.id, ...newRisk }],
      }));
      setSavedAnalysis("");
      alert("Risk item added successfully!");
    } catch (error) {
      console.error("Error adding risk:", error);
      alert("Error adding risk. Please try again.");
    }
  };

  const updateRiskItem = async (category, id, field, value) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.");
      return;
    }
    setRiskData((prev) => ({
      ...prev,
      [category]: prev[category].map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
    try {
      const riskRef = doc(db, "risks", id);
      await updateDoc(riskRef, { [field]: value });
    } catch (error) {
      console.error("Error updating risk:", error);
    }
  };

  const deleteRiskItem = async (category, id) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this risk item?")) {
      try {
        await deleteDoc(doc(db, "risks", id));
        setRiskData((prev) => ({
          ...prev,
          [category]: prev[category].filter((item) => item.id !== id),
        }));
        setSavedAnalysis("");
      } catch (error) {
        console.error("Error deleting risk:", error);
        alert("Error deleting risk. Please try again.");
      }
    }
  };

  const getUniqueRiskNames = (category) => {
    const data =
      category === "business-risk"
        ? Object.values(riskData).flat()
        : riskData[category] || [];
    return [
      ...new Set(data.map((item) => item.riskSubCategory).filter(Boolean)),
    ].sort();
  };

  const getUniqueCategories = (category) => {
    const data =
      category === "business-risk"
        ? Object.values(riskData).flat()
        : riskData[category] || [];
    return [
      ...new Set(data.map((item) => item.riskCategory).filter(Boolean)),
    ].sort();
  };

  const getUniqueOwners = (category) => {
    const data =
      category === "business-risk"
        ? Object.values(riskData).flat()
        : riskData[category] || [];
    return [...new Set(data.map((item) => item.owner).filter(Boolean))].sort();
  };

  const getUniqueStatuses = (category) => {
    const data =
      category === "business-risk"
        ? Object.values(riskData).flat()
        : riskData[category] || [];
    return [
      ...new Set(data.map((item) => item.mitigationStatus).filter(Boolean)),
    ].sort();
  };

  const clearAllFilters = () => {
    setFilterRisk("");
    setFilterCategory("");
    setFilterOwner("");
    setFilterStatus("");
    setSelectedMonth("");
    setSelectedYear("");
  };

  const filteredData = (data) => {
    return data.filter((item) => {
      if (selectedMonth || selectedYear) {
        if (!item.actionDate) return false;
        const actionDate = new Date(item.actionDate);
        const monthMatch =
          !selectedMonth ||
          actionDate.getMonth() + 1 === parseInt(selectedMonth);
        const yearMatch =
          !selectedYear || actionDate.getFullYear() === parseInt(selectedYear);
        if (!monthMatch || !yearMatch) return false;
      }

      if (filterRisk && item.riskSubCategory !== filterRisk) return false;
      if (filterCategory && item.riskCategory !== filterCategory) return false;
      if (filterOwner && item.owner !== filterOwner) return false;
      if (filterStatus && item.mitigationStatus !== filterStatus) return false;

      return true;
    });
  };

  const createScatterChartData = (category) => {
    if (category === "business-risk") {
      const datasets = [];

      Object.keys(riskData).forEach((catKey) => {
        const data = riskData[catKey] || [];
        if (data.length > 0) {
          datasets.push({
            label: riskCategories.find((c) => c.id === catKey)?.name || catKey,
            data: data.map((item) => ({
              x: item.likelihood,
              y: item.severity,
              label: item.riskSubCategory || "Unnamed Risk",
              riskNumber: item.riskNumber || "N/A",
              riskLevel: item.likelihood * item.severity,
              status: item.mitigationStatus,
              category: catKey,
              description: item.description || "",
            })),
            backgroundColor: RISK_COLORS[catKey] || "#7d5a50",
            borderColor: T.accent,
            borderWidth: 2,
            pointRadius: 8,
            pointHoverRadius: 10,
          });
        }
      });

      if (datasets.length === 0) {
        return { datasets: [] };
      }

      return { datasets };
    } else {
      const data = filteredData(riskData[category] || []);
      return {
        datasets: [
          {
            label:
              riskCategories.find((c) => c.id === category)?.name || "Risks",
            data: data.map((item) => ({
              x: item.likelihood,
              y: item.severity,
              label: item.riskSubCategory || "Unnamed Risk",
              riskNumber: item.riskNumber || "N/A",
              riskLevel: item.likelihood * item.severity,
              status: item.mitigationStatus,
              description: item.description || "",
            })),
            backgroundColor: RISK_COLORS[category] || "#7d5a50",
            borderColor: T.accent,
            borderWidth: 2,
            pointRadius: 8,
            pointHoverRadius: 10,
          },
        ],
      };
    }
  };

  const scatterOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: { display: false },
      legend: {
        display: true,
        position: "top",
        labels: { color: T.body, font: { size: 12 } },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const datasetLabel = context.dataset.label || "Risk";
            const pointLabel = context.raw.label || "Risk";
            const riskNumber = context.raw.riskNumber || "N/A";
            return `${datasetLabel}: ${pointLabel} (${riskNumber})`;
          },
          afterLabel: (context) => {
            const riskLevel = context.raw.x * context.raw.y;
            const description = context.raw.description;
            const lines = [
              `Risk Score: ${riskLevel} (${context.raw.x} × ${context.raw.y})`,
            ];
            if (description) {
              lines.push(`Description: ${description}`);
            }
            return lines;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Likelihood (1-5)",
          color: T.body,
          font: { weight: "bold", size: 12 },
        },
        min: 0.5,
        max: 5.5,
        ticks: { stepSize: 1, color: T.body },
        grid: { color: T.lineSoft },
      },
      y: {
        title: {
          display: true,
          text: "Severity (1-5)",
          color: T.body,
          font: { weight: "bold", size: 12 },
        },
        min: 0.5,
        max: 5.5,
        ticks: { stepSize: 1, color: T.body },
        grid: { color: T.lineSoft },
      },
    },
  };

  const prepareRiskData = (data) => {
    const allRisks = Object.values(data).flat();
    const riskScores = allRisks.map((risk) => ({
      ...risk,
      riskScore: (risk.severity || 1) * (risk.likelihood || 1),
    }));
    const risksByCategory = {};
    const risksByStatus = {};
    const risksByOwner = {};
    const risksByReviewCadence = {};
    const highRisks = [];
    const mediumRisks = [];
    const lowRisks = [];

    riskScores.forEach((risk) => {
      const category = risk.riskCategory || "Uncategorized";
      if (!risksByCategory[category]) risksByCategory[category] = [];
      risksByCategory[category].push(risk);
      const status = risk.mitigationStatus || "Uncontrolled";
      if (!risksByStatus[status]) risksByStatus[status] = 0;
      risksByStatus[status]++;
      if (risk.owner) {
        if (!risksByOwner[risk.owner]) risksByOwner[risk.owner] = 0;
        risksByOwner[risk.owner]++;
      }
      if (risk.reviewCadence) {
        if (!risksByReviewCadence[risk.reviewCadence])
          risksByReviewCadence[risk.reviewCadence] = 0;
        risksByReviewCadence[risk.reviewCadence]++;
      }
      if (risk.riskScore >= 16) highRisks.push(risk);
      else if (risk.riskScore >= 9) mediumRisks.push(risk);
      else lowRisks.push(risk);
    });

    const avgScoresByCategory = {};
    Object.keys(risksByCategory).forEach((category) => {
      const risks = risksByCategory[category];
      const avgSeverity =
        risks.reduce((sum, r) => sum + (r.severity || 1), 0) / risks.length;
      const avgLikelihood =
        risks.reduce((sum, r) => sum + (r.likelihood || 1), 0) / risks.length;
      const avgRiskScore =
        risks.reduce((sum, r) => sum + (r.riskScore || 1), 0) / risks.length;
      avgScoresByCategory[category] = {
        avgSeverity: Math.round(avgSeverity * 10) / 10,
        avgLikelihood: Math.round(avgLikelihood * 10) / 10,
        avgRiskScore: Math.round(avgRiskScore * 10) / 10,
        count: risks.length,
        controlledRisks: risks.filter(
          (r) => r.mitigationStatus === "🟢 Controlled"
        ).length,
        uncontrolledRisks: risks.filter(
          (r) => r.mitigationStatus === "🔴 Uncontrolled"
        ).length,
      };
    });

    return {
      totalRisks: allRisks.length,
      risksByCategory,
      risksByStatus,
      risksByOwner,
      risksByReviewCadence,
      avgScoresByCategory,
      highRisks: highRisks.length,
      mediumRisks: mediumRisks.length,
      lowRisks: lowRisks.length,
      highRiskItems: highRisks.slice(0, 5),
      controlledRisks: allRisks.filter(
        (r) => r.mitigationStatus === "🟢 Controlled"
      ).length,
      partiallyControlledRisks: allRisks.filter(
        (r) => r.mitigationStatus === "🟡 Partially controlled"
      ).length,
      uncontrolledRisks: allRisks.filter(
        (r) => r.mitigationStatus === "🔴 Uncontrolled"
      ).length,
      risksWithOwners: allRisks.filter((r) => r.owner).length,
      risksWithReviewCadence: allRisks.filter((r) => r.reviewCadence).length,
      risksWithMitigation: allRisks.filter((r) => r.mitigation).length,
    };
  };

  const createRiskPrompt = (data) => {
    return `Analyze the Strategic Risk Control and Risk Register of a business based on the following risk assessment data:

RISK REGISTER DATA:
Total Risks Identified: ${data.totalRisks}

RISK LEVEL DISTRIBUTION:
- High Risk (Score 16-25): ${data.highRisks}
- Medium Risk (Score 9-15): ${data.mediumRisks}
- Low Risk (Score 1-8): ${data.lowRisks}

MITIGATION STATUS:
- 🟢 Controlled: ${data.controlledRisks}
- 🟡 Partially controlled: ${data.partiallyControlledRisks}
- 🔴 Uncontrolled: ${data.uncontrolledRisks}

GOVERNANCE METRICS:
- Risks with assigned owners: ${data.risksWithOwners} (${Math.round((data.risksWithOwners / data.totalRisks) * 100)}%)
- Risks with review cadence: ${data.risksWithReviewCadence} (${Math.round((data.risksWithReviewCadence / data.totalRisks) * 100)}%)
- Risks with mitigation plans: ${data.risksWithMitigation} (${Math.round((data.risksWithMitigation / data.totalRisks) * 100)}%)

RISK CATEGORY BREAKDOWN:
${Object.keys(data.avgScoresByCategory)
        .map((category) => {
          const cat = data.avgScoresByCategory[category];
          return `- ${category}: ${cat.count} risks, Avg Risk Score: ${cat.avgRiskScore}, Controlled: ${cat.controlledRisks}/${cat.count}`;
        })
        .join("\n")}

TOP 5 HIGHEST RISK ITEMS:
${data.highRiskItems
        .map(
          (risk, i) =>
            `  ${i + 1}. ${risk.riskSubCategory || "Unnamed Risk"} (${risk.riskNumber || "N/A"}) - Score: ${risk.riskScore} (Severity: ${risk.severity}, Likelihood: ${risk.likelihood}), Status: ${risk.mitigationStatus}, Owner: ${risk.owner || "Unassigned"}`
        )
        .join("\n")}

RISK STATUS DISTRIBUTION:
${Object.keys(data.risksByStatus)
        .map((status) => `- ${status}: ${data.risksByStatus[status]}`)
        .join("\n")}

ANALYSIS REQUIREMENTS:

1. RISK PROFILE ASSESSMENT:
   - Evaluate the overall risk exposure and maturity of risk management
   - Identify the most critical risk categories and their trends
   - Rate overall risk management effectiveness (1-10)

2. MITIGATION EFFECTIVENESS:
   - Analyze the current state of risk controls
   - Identify gaps in mitigation strategies
   - Assess the balance between controlled vs uncontrolled risks

3. GOVERNANCE & ACCOUNTABILITY:
   - Evaluate risk ownership assignment and coverage
   - Assess review cadence adequacy
   - Identify governance gaps

4. CRITICAL RISK ANALYSIS:
   - Deep dive into top 5 highest risk items
   - Recommend immediate actions for high-risk items
   - Prioritize risks requiring urgent attention

5. ACTIONABLE RECOMMENDATIONS:
   - Provide 3-5 specific, actionable improvements for risk management
   - Suggest mitigation strategies for uncontrolled risks
   - Recommend risk treatment plans with timelines
   - Identify opportunities for risk reduction

6. STRATEGIC IMPLICATIONS:
   - How identified risks impact strategic objectives
   - Risk appetite alignment assessment
   - Recommendations for risk-aware decision making

FORMAT REQUIREMENTS:
- Start with an executive summary
- Use plain text section headers without markdown symbols
- Include specific examples from the data
- End with a Risk Management Maturity Score and Rating

OUTPUT FORMAT:
Executive Summary
[Brief overview of strategic risk control status]

Risk Management Maturity Score: [X]/10
Rating: [Initial/Repeatable/Defined/Managed/Optimizing]

Risk Profile Analysis
[Analysis of overall risk exposure and distribution]

Category Risk Assessment
[Detailed analysis of each risk category with scores]

Critical Risk Watchlist
[Top 5 risks requiring immediate attention with recommended actions]

Mitigation Effectiveness
[Analysis of control effectiveness and gaps]

Governance Assessment
[Evaluation of risk ownership, review cadence, and accountability]

Top 5 Actionable Recommendations
1. [Specific action with timeline and owner suggestion]
2. [Specific action with measurable outcome]
3. [Specific action for high-risk items]
4. [Specific action for governance improvement]
5. [Specific action for risk culture/monitoring]

Strategic Risk Outlook
[How risk posture affects strategic objectives and recommendations]

IMPORTANT: Do NOT use any markdown formatting like ###, **, or # in your response. Use plain text only with section titles as shown above.`;
  };

  const generateAIAnalysis = async () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot generate AI analysis.");
      return;
    }
    const allRisks = Object.values(riskData).flat();
    if (allRisks.length === 0 || !currentUser) {
      setAnalysisError(
        "No risk data available for analysis. Please add some risk items first."
      );
      return;
    }
    setIsGenerating(true);
    setAnalysisError("");
    setShowAIAnalysis(true);

    try {
      const analysisData = prepareRiskData(riskData);
      const prompt = createRiskPrompt(analysisData);
      const functions = getFunctions();
      const generateStrategicRiskAnalysis = httpsCallable(
        functions,
        "generateStrategicRiskAnalysis"
      );
      const response = await generateStrategicRiskAnalysis({
        prompt: prompt,
        userId: currentUser.uid,
        timestamp: new Date().toISOString(),
      });

      let analysis = response?.data?.content || response?.data?.analysis;
      if (!analysis) throw new Error("No analysis generated");
      analysis = cleanAIResponse(analysis);

      const aiAnalysisRef = doc(
        db,
        "strategicRiskControlAnalysis",
        currentUser.uid
      );
      await setDoc(
        aiAnalysisRef,
        {
          analysis: analysis,
          timestamp: new Date().toISOString(),
          dataSnapshot: {
            totalRisks: allRisks.length,
            riskCategories: Object.keys(riskData).filter(
              (cat) => riskData[cat].length > 0
            ),
            riskCount: allRisks.length,
          },
          userId: currentUser.uid,
          riskCount: allRisks.length,
        },
        { merge: true }
      );

      setAiAnalysis(analysis);
      setSavedAnalysis(analysis);
    } catch (error) {
      console.error("Error generating AI analysis:", error);
      setAnalysisError(`Failed to generate analysis: ${error.message}`);
      setAiAnalysis(
        "AI analysis will be generated based on your risk register data, identifying critical risks, evaluating mitigation effectiveness, and providing actionable recommendations to strengthen strategic risk control."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAIAnalysis = () => {
    if (!showAIAnalysis) {
      if (savedAnalysis) {
        setAiAnalysis(savedAnalysis);
        setShowAIAnalysis(true);
      } else {
        generateAIAnalysis();
      }
    } else {
      setShowAIAnalysis(!showAIAnalysis);
    }
  };

  const refreshAnalysis = async () => {
    setSavedAnalysis("");
    setAiAnalysis("");
    await generateAIAnalysis();
  };

  const handleSaveToNotes = async () => {
    if (!currentUser || !aiAnalysis) return;

    setIsSaving(true);
    try {
      const savedAnalysisRef = doc(
        db,
        `users/${currentUser.uid}/savedRiskAnalyses`,
        `risk_analysis_${Date.now()}`
      );

      const allRisks = Object.values(riskData).flat();
      const riskSummary = {
        totalRisks: allRisks.length,
        highRisks: allRisks.filter(r => (r.severity || 1) * (r.likelihood || 1) >= 16).length,
        mediumRisks: allRisks.filter(r => {
          const score = (r.severity || 1) * (r.likelihood || 1);
          return score >= 9 && score < 16;
        }).length,
        lowRisks: allRisks.filter(r => (r.severity || 1) * (r.likelihood || 1) < 9).length,
        uncontrolledRisks: allRisks.filter(r => r.mitigationStatus === "🔴 Uncontrolled").length,
      };

      await setDoc(savedAnalysisRef, {
        type: "risk_analysis",
        analysis: aiAnalysis,
        riskSummary,
        riskCategories: Object.keys(riskData).filter(cat => riskData[cat].length > 0),
        generatedAt: new Date().toISOString(),
        savedAt: new Date().toISOString(),
        notes: "",
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving risk analysis:", error);
      alert("Failed to save analysis");
    } finally {
      setIsSaving(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);

  return (
    <div style={cardS}>
      <KeyQuestionBox
        question={SECTION_DATA["strategic-risk-control"].keyQuestion}
        signals={SECTION_DATA["strategic-risk-control"].keySignals}
        decisions={SECTION_DATA["strategic-risk-control"].keyDecisions}
      />

      <h3 style={{ color: T.accent, marginBottom: "20px" }}>Risk Register</h3>

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        {riskCategories.map((category) => (
          <div key={category.id} style={{ position: "relative" }}>
            <button
              onClick={() => setRiskSection(category.id)}
              onMouseEnter={() => {
                if (category.id !== "business-risk") {
                  setHoveredRiskType(category.name);
                }
              }}
              onMouseLeave={() => setHoveredRiskType(null)}
              style={{
                padding: "10px 20px",
                background:
                  riskSection === category.id ? category.color : T.raised,
                color: riskSection === category.id ? "#fff" : T.body,
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "14px",
              }}
            >
              {category.name}
            </button>
            {hoveredRiskType === category.name &&
              RISK_TYPE_DEFINITIONS[category.name] && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    marginTop: "8px",
                    padding: "10px 15px",
                    background: T.header,
                    color: "#fff",
                    borderRadius: "6px",
                    fontSize: "12px",
                    width: "250px",
                    zIndex: 1000,
                    boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
                    lineHeight: "1.4",
                  }}
                >
                  {RISK_TYPE_DEFINITIONS[category.name]}
                  <div
                    style={{
                      position: "absolute",
                      top: "-6px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "0",
                      height: "0",
                      borderLeft: "6px solid transparent",
                      borderRight: "6px solid transparent",
                      borderBottom: `6px solid ${T.header}`,
                    }}
                  />
                </div>
              )}
          </div>
        ))}
      </div>

      {riskCategories.map((category) => {
        if (riskSection !== category.id) return null;

        const data =
          category.id === "business-risk"
            ? Object.values(riskData).flat()
            : riskData[category.id] || [];
        const filtered = filteredData(data);

        return (
          <div key={category.id}>
            <div
              style={{
                ...cardS,
                marginBottom: "20px",
                border: `2px solid ${category.color}`,
              }}
            >
              <h4 style={{ color: T.accent, marginBottom: "15px" }}>
                {category.name} Matrix
                {category.id === "business-risk" && " (All Risks)"}
                {(selectedMonth ||
                  selectedYear ||
                  filterRisk ||
                  filterCategory ||
                  filterOwner ||
                  filterStatus) &&
                  category.id !== "business-risk" && (
                    <span
                      style={{
                        fontSize: "12px",
                        marginLeft: "10px",
                        color: T.muted,
                      }}
                    >
                      (Filtered)
                    </span>
                  )}
              </h4>
              <div style={{ height: "300px" }}>
                <Scatter
                  data={createScatterChartData(category.id)}
                  options={scatterOptions}
                />
              </div>

              {category.id === "business-risk" && (
                <div
                  style={{
                    marginTop: "10px",
                    padding: "10px",
                    background: T.panel,
                    borderRadius: "4px",
                    fontSize: "12px",
                  }}
                >
                  <strong>Risk Count Summary:</strong>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(150px, 1fr))",
                      gap: "5px",
                      marginTop: "5px",
                    }}
                  >
                    {Object.keys(riskData).map((catKey) => (
                      <div key={catKey} style={{ color: RISK_COLORS[catKey] }}>
                        {riskCategories.find((c) => c.id === catKey)?.name ||
                          catKey}
                        : {riskData[catKey]?.length || 0} risks
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                marginBottom: "20px",
                padding: "20px",
                background: T.panel,
                borderRadius: "10px",
                border: `2px solid ${category.color}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                }}
              >
                <h4
                  style={{
                    color: T.accent,
                    margin: 0,
                    fontSize: "15px",
                    fontWeight: "600",
                  }}
                >
                  Quick Filters
                </h4>
                <button
                  onClick={clearAllFilters}
                  style={btnGhost}
                >
                  Clear All
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: "12px",
                }}
              >
                <div>
                  <label
                    style={{
                      ...labelS,
                      fontSize: "12px",
                    }}
                  >
                    Risk Sub-Category
                  </label>
                  <select
                    value={filterRisk}
                    onChange={(e) => setFilterRisk(e.target.value)}
                    style={selectS}
                  >
                    <option value="">All Sub-Categories</option>
                    {getUniqueRiskNames(category.id).map((risk) => (
                      <option key={risk} value={risk}>
                        {risk}
                      </option>
                    ))}
                  </select>
                </div>

                {category.id === "business-risk" && (
                  <div>
                    <label
                      style={{
                        ...labelS,
                        fontSize: "12px",
                      }}
                    >
                      Category
                    </label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      style={selectS}
                    >
                      <option value="">All Categories</option>
                      {getUniqueCategories(category.id).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label
                    style={{
                      ...labelS,
                      fontSize: "12px",
                    }}
                  >
                    Owner
                  </label>
                  <select
                    value={filterOwner}
                    onChange={(e) => setFilterOwner(e.target.value)}
                    style={selectS}
                  >
                    <option value="">All Owners</option>
                    {getUniqueOwners(category.id).map((owner) => (
                      <option key={owner} value={owner}>
                        {owner}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      ...labelS,
                      fontSize: "12px",
                    }}
                  >
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={selectS}
                  >
                    <option value="">All Statuses</option>
                    {getUniqueStatuses(category.id).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      ...labelS,
                      fontSize: "12px",
                    }}
                  >
                    Month
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    style={selectS}
                  >
                    <option value="">All</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(2024, i, 1).toLocaleString("default", {
                          month: "short",
                        })}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      ...labelS,
                      fontSize: "12px",
                    }}
                  >
                    Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    style={selectS}
                  >
                    <option value="">All</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {!isInvestorView && category.id !== "business-risk" && (
                <div style={{ marginTop: "15px", textAlign: "right" }}>
                  <button
                    onClick={() => addRiskItem(category.id)}
                    style={btnPrimary}
                  >
                    + Add Risk Item to {category.name}
                  </button>
                </div>
              )}

              {category.id === "business-risk" && (
                <div
                  style={{
                    marginTop: "15px",
                    padding: "10px",
                    background: T.raised,
                    borderRadius: "4px",
                    textAlign: "center",
                  }}
                >
                  <p style={{ color: T.body, margin: 0, fontSize: "13px" }}>
                    To add a new risk, select a specific risk category tab
                    above.
                  </p>
                </div>
              )}
            </div>

            <div
              style={{
                ...cardS,
                border: `2px solid ${category.color}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                }}
              >
                <h4 style={{ color: T.accent, margin: 0 }}>
                  Risk Assessment Table
                  {category.id === "business-risk" && " (All Risks)"}
                  {(selectedMonth ||
                    selectedYear ||
                    filterRisk ||
                    filterCategory ||
                    filterOwner ||
                    filterStatus) && (
                      <span
                        style={{
                          fontSize: "12px",
                          marginLeft: "10px",
                          color: T.muted,
                        }}
                      >
                        (Showing {filtered.length} of {data.length} items)
                      </span>
                    )}
                </h4>
              </div>

              {filtered.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: T.muted,
                  }}
                >
                  {category.id === "business-risk"
                    ? "No risk items added yet in any category."
                    : `No risk items added yet in ${category.name}. ${!isInvestorView ? 'Click "Add Risk Item" above to get started.' : ""}`}
                  {(selectedMonth ||
                    selectedYear ||
                    filterRisk ||
                    filterCategory ||
                    filterOwner ||
                    filterStatus) && (
                      <p style={{ marginTop: "10px", fontSize: "13px" }}>
                        Try clearing some filters to see more items.
                      </p>
                    )}
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      color: T.body,
                      minWidth: "1600px",
                      fontSize: "12px",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: T.header,
                          borderBottom: `2px solid ${T.line}`,
                        }}
                      >
                        <th
                          style={{
                            padding: "12px",
                            textAlign: "left",
                            fontWeight: "600",
                            color: "#fff",
                          }}
                        >
                          Risk Number
                        </th>
                        {category.id === "business-risk" && (
                          <th
                            style={{
                              padding: "12px",
                              textAlign: "left",
                              fontWeight: "600",
                              color: "#fff",
                            }}
                          >
                            Risk Category
                          </th>
                        )}
                        <th
                          style={{
                            padding: "12px",
                            textAlign: "left",
                            fontWeight: "600",
                            color: "#fff",
                          }}
                        >
                          Risk Sub-Category
                        </th>
                        <th
                          style={{
                            padding: "12px",
                            textAlign: "left",
                            fontWeight: "600",
                            color: "#fff",
                          }}
                        >
                          Description
                        </th>
                        <th
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            fontWeight: "600",
                            color: "#fff",
                          }}
                        >
                          Severity (1-5)
                        </th>
                        <th
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            fontWeight: "600",
                            color: "#fff",
                          }}
                        >
                          Likelihood (1-5)
                        </th>
                        <th
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            fontWeight: "600",
                            color: "#fff",
                          }}
                        >
                          Risk Score
                        </th>
                        <th
                          style={{
                            padding: "12px",
                            textAlign: "left",
                            fontWeight: "600",
                            color: "#fff",
                          }}
                        >
                          Owner
                        </th>
                        <th
                          style={{
                            padding: "12px",
                            textAlign: "left",
                            fontWeight: "600",
                            color: "#fff",
                          }}
                        >
                          Status
                        </th>
                        <th
                          style={{
                            padding: "12px",
                            textAlign: "left",
                            fontWeight: "600",
                            color: "#fff",
                          }}
                        >
                          Mitigation Plan
                        </th>
                        <th
                          style={{
                            padding: "12px",
                            textAlign: "left",
                            fontWeight: "600",
                            color: "#fff",
                          }}
                        >
                          Review Cadence
                        </th>
                        <th
                          style={{
                            padding: "12px",
                            textAlign: "left",
                            fontWeight: "600",
                            color: "#fff",
                          }}
                        >
                          Action Date
                        </th>
                        {!isInvestorView && category.id !== "business-risk" && (
                          <th
                            style={{
                              padding: "12px",
                              textAlign: "center",
                              fontWeight: "600",
                              color: "#fff",
                            }}
                          >
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((item) => {
                        const originalCategory =
                          category.id === "business-risk"
                            ? Object.keys(riskData).find((key) =>
                              riskData[key].some((r) => r.id === item.id)
                            )
                            : category.id;
                        const riskScore =
                          (item.severity || 1) * (item.likelihood || 1);
                        const scoreColor =
                          riskScore >= 16
                            ? T.red
                            : riskScore >= 9
                              ? T.amber
                              : T.green;

                        return (
                          <tr
                            key={item.id}
                            style={{ borderBottom: `1px solid ${T.lineSoft}` }}
                          >
                            <td style={{ padding: "12px" }}>
                              <input
                                type="text"
                                value={item.riskNumber || ""}
                                onChange={(e) =>
                                  updateRiskItem(
                                    originalCategory,
                                    item.id,
                                    "riskNumber",
                                    e.target.value
                                  )
                                }
                                disabled={
                                  isInvestorView ||
                                  category.id === "business-risk"
                                }
                                placeholder="Risk #"
                                style={{
                                  width: "80px",
                                  padding: "6px",
                                  border: `1px solid ${T.line}`,
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  background:
                                    isInvestorView ||
                                    category.id === "business-risk"
                                      ? T.panel
                                      : T.bg,
                                }}
                              />
                            </td>

                            {category.id === "business-risk" && (
                              <td style={{ padding: "12px", fontSize: "12px" }}>
                                {item.riskCategory}
                              </td>
                            )}

                            <td style={{ padding: "12px" }}>
                              <input
                                type="text"
                                value={item.riskSubCategory || ""}
                                onChange={(e) =>
                                  updateRiskItem(
                                    originalCategory,
                                    item.id,
                                    "riskSubCategory",
                                    e.target.value
                                  )
                                }
                                disabled={
                                  isInvestorView ||
                                  category.id === "business-risk"
                                }
                                placeholder="Sub-category"
                                style={{
                                  width: "120px",
                                  padding: "6px",
                                  border: `1px solid ${T.line}`,
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  background:
                                    isInvestorView ||
                                    category.id === "business-risk"
                                      ? T.panel
                                      : T.bg,
                                }}
                              />
                            </td>

                            <td style={{ padding: "12px" }}>
                              <textarea
                                value={item.description}
                                onChange={(e) =>
                                  updateRiskItem(
                                    originalCategory,
                                    item.id,
                                    "description",
                                    e.target.value
                                  )
                                }
                                disabled={
                                  isInvestorView ||
                                  category.id === "business-risk"
                                }
                                rows="2"
                                placeholder="Description"
                                style={{
                                  width: "150px",
                                  padding: "6px",
                                  border: `1px solid ${T.line}`,
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  resize: "vertical",
                                  background:
                                    isInvestorView ||
                                    category.id === "business-risk"
                                      ? T.panel
                                      : T.bg,
                                }}
                              />
                            </td>

                            <td
                              style={{ padding: "12px", textAlign: "center" }}
                            >
                              <input
                                type="number"
                                min="1"
                                max="5"
                                value={item.severity}
                                onChange={(e) =>
                                  updateRiskItem(
                                    originalCategory,
                                    item.id,
                                    "severity",
                                    Number.parseInt(e.target.value)
                                  )
                                }
                                disabled={
                                  isInvestorView ||
                                  category.id === "business-risk"
                                }
                                style={{
                                  width: "50px",
                                  padding: "6px",
                                  border: `1px solid ${T.line}`,
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  textAlign: "center",
                                  background:
                                    isInvestorView ||
                                    category.id === "business-risk"
                                      ? T.panel
                                      : T.bg,
                                }}
                              />
                            </td>

                            <td
                              style={{ padding: "12px", textAlign: "center" }}
                            >
                              <input
                                type="number"
                                min="1"
                                max="5"
                                value={item.likelihood}
                                onChange={(e) =>
                                  updateRiskItem(
                                    originalCategory,
                                    item.id,
                                    "likelihood",
                                    Number.parseInt(e.target.value)
                                  )
                                }
                                disabled={
                                  isInvestorView ||
                                  category.id === "business-risk"
                                }
                                style={{
                                  width: "50px",
                                  padding: "6px",
                                  border: `1px solid ${T.line}`,
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  textAlign: "center",
                                  background:
                                    isInvestorView ||
                                    category.id === "business-risk"
                                      ? T.panel
                                      : T.bg,
                                }}
                              />
                            </td>

                            <td
                              style={{ padding: "12px", textAlign: "center" }}
                            >
                              <span
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  background: scoreColor,
                                  color: "#fff",
                                  fontWeight: "600",
                                  fontSize: "12px",
                                  display: "inline-block",
                                  minWidth: "40px",
                                  textAlign: "center",
                                }}
                              >
                                {riskScore}
                              </span>
                            </td>

                            <td style={{ padding: "12px" }}>
                              <input
                                type="text"
                                value={item.owner || ""}
                                onChange={(e) =>
                                  updateRiskItem(
                                    originalCategory,
                                    item.id,
                                    "owner",
                                    e.target.value
                                  )
                                }
                                disabled={
                                  isInvestorView ||
                                  category.id === "business-risk"
                                }
                                placeholder="Owner"
                                style={{
                                  width: "100px",
                                  padding: "6px",
                                  border: `1px solid ${T.line}`,
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  background:
                                    isInvestorView ||
                                    category.id === "business-risk"
                                      ? T.panel
                                      : T.bg,
                                }}
                              />
                            </td>

                            <td style={{ padding: "12px" }}>
                              <select
                                value={item.mitigationStatus}
                                onChange={(e) =>
                                  updateRiskItem(
                                    originalCategory,
                                    item.id,
                                    "mitigationStatus",
                                    e.target.value
                                  )
                                }
                                disabled={
                                  isInvestorView ||
                                  category.id === "business-risk"
                                }
                                style={{
                                  width: "140px",
                                  padding: "6px",
                                  border: `1px solid ${T.line}`,
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  background:
                                    isInvestorView ||
                                    category.id === "business-risk"
                                      ? T.panel
                                      : T.bg,
                                }}
                              >
                                <option value="🟢 Controlled">
                                  🟢 Controlled
                                </option>
                                <option value="🟡 Partially controlled">
                                  🟡 Partially controlled
                                </option>
                                <option value="🔴 Uncontrolled">
                                  🔴 Uncontrolled
                                </option>
                              </select>
                            </td>

                            <td style={{ padding: "12px" }}>
                              <textarea
                                value={item.mitigation}
                                onChange={(e) =>
                                  updateRiskItem(
                                    originalCategory,
                                    item.id,
                                    "mitigation",
                                    e.target.value
                                  )
                                }
                                disabled={
                                  isInvestorView ||
                                  category.id === "business-risk"
                                }
                                rows="2"
                                placeholder="Mitigation plan"
                                style={{
                                  width: "150px",
                                  padding: "6px",
                                  border: `1px solid ${T.line}`,
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  resize: "vertical",
                                  background:
                                    isInvestorView ||
                                    category.id === "business-risk"
                                      ? T.panel
                                      : T.bg,
                                }}
                              />
                            </td>

                            <td style={{ padding: "12px" }}>
                              <input
                                type="text"
                                value={item.reviewCadence || ""}
                                onChange={(e) =>
                                  updateRiskItem(
                                    originalCategory,
                                    item.id,
                                    "reviewCadence",
                                    e.target.value
                                  )
                                }
                                disabled={
                                  isInvestorView ||
                                  category.id === "business-risk"
                                }
                                placeholder="e.g., Monthly"
                                style={{
                                  width: "100px",
                                  padding: "6px",
                                  border: `1px solid ${T.line}`,
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  background:
                                    isInvestorView ||
                                    category.id === "business-risk"
                                      ? T.panel
                                      : T.bg,
                                }}
                              />
                            </td>

                            <td style={{ padding: "12px" }}>
                              <input
                                type="date"
                                value={item.actionDate || ""}
                                onChange={(e) =>
                                  updateRiskItem(
                                    originalCategory,
                                    item.id,
                                    "actionDate",
                                    e.target.value
                                  )
                                }
                                disabled={
                                  isInvestorView ||
                                  category.id === "business-risk"
                                }
                                style={{
                                  width: "120px",
                                  padding: "6px",
                                  border: `1px solid ${T.line}`,
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  background:
                                    isInvestorView ||
                                    category.id === "business-risk"
                                      ? T.panel
                                      : T.bg,
                                }}
                              />
                            </td>

                            {!isInvestorView &&
                              category.id !== "business-risk" && (
                                <td
                                  style={{
                                    padding: "12px",
                                    textAlign: "center",
                                  }}
                                >
                                  <button
                                    onClick={() =>
                                      deleteRiskItem(originalCategory, item.id)
                                    }
                                    style={{
                                      padding: "6px 12px",
                                      background: "transparent",
                                      color: T.red,
                                      border: `1px solid ${T.red}`,
                                      borderRadius: "4px",
                                      cursor: "pointer",
                                      fontSize: "14px",
                                    }}
                                    title="Delete"
                                  >
                                    Delete
                                  </button>
                                </td>
                              )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div style={{ marginTop: "30px", marginBottom: "20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "15px",
          }}
        >
          <button
            onClick={handleAIAnalysis}
            disabled={
              isGenerating ||
              isInvestorView ||
              Object.values(riskData).flat().length === 0
            }
            style={{
              ...btnPrimary,
              opacity: isGenerating ? 0.7 : 1,
              background:
                isInvestorView || Object.values(riskData).flat().length === 0
                  ? T.muted
                  : T.accent,
            }}
          >
            {isGenerating ? (
              <>
                <FaSpinner
                  className="spin"
                  style={{ animation: "spin 1s linear infinite" }}
                />
                Generating Risk Analysis...
              </>
            ) : (
              <>
                <FaRobot />
                AI Strategic Risk Analysis
              </>
            )}
          </button>

          {savedAnalysis &&
            !isGenerating &&
            !isInvestorView &&
            Object.values(riskData).flat().length > 0 && (
              <button
                onClick={refreshAnalysis}
                style={{
                  ...btnGhost,
                  padding: "8px 16px",
                  fontSize: "12px",
                }}
                title="Refresh AI Analysis"
              >
                Refresh
              </button>
            )}
        </div>

        {Object.values(riskData).flat().length === 0 && (
          <p
            style={{
              color: T.muted,
              fontSize: "13px",
              fontStyle: "italic",
              marginLeft: "10px",
            }}
          >
            Add risk items to generate AI analysis of your strategic risk posture.
          </p>
        )}

        {showAIAnalysis && (
          <div
            style={{
              background: T.panel,
              padding: "20px",
              borderRadius: "10px",
              border: `1px solid ${T.line}`,
              marginTop: "10px",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "15px",
              }}
            >
              <div>
                <label
                  style={{
                    ...labelS,
                    fontSize: "16px",
                    marginBottom: "8px",
                  }}
                >
                  Strategic Risk Control AI Analysis
                </label>
                <p
                  style={{
                    fontSize: "12px",
                    color: T.muted,
                    margin: "0 0 10px 0",
                    fontStyle: "italic",
                  }}
                >
                  Analysis generated from{" "}
                  {Object.values(riskData).flat().length} risk items in your register
                </p>
              </div>

              {savedAnalysis && (
                <span
                  style={{
                    fontSize: "10px",
                    color: T.muted,
                    background: T.raised,
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontWeight: "500",
                  }}
                >
                  Saved Analysis
                </span>
              )}
            </div>

            {analysisError ? (
              <div
                style={{
                  padding: "15px",
                  background: T.redBg,
                  borderRadius: "6px",
                  border: `1px solid ${T.red}33`,
                  color: T.red,
                  fontSize: "14px",
                }}
              >
                <strong>Error:</strong> {analysisError}
              </div>
            ) : isGenerating ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "30px",
                  color: T.body,
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    border: `3px solid ${T.lineSoft}`,
                    borderTop: `3px solid ${T.accent}`,
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    margin: "0 auto 15px",
                  }}
                ></div>
                <p>Analyzing your risk register...</p>
                <p
                  style={{
                    fontSize: "12px",
                    color: T.muted,
                    marginTop: "5px",
                  }}
                >
                  Evaluating risk scores, mitigation effectiveness, and governance maturity
                </p>
              </div>
            ) : (
              <>
                <div
                  style={{
                    background: T.bg,
                    padding: "20px",
                    borderRadius: "8px",
                    border: `1px solid ${T.lineSoft}`,
                    maxHeight: "400px",
                    overflowY: "auto",
                    fontSize: "14px",
                    lineHeight: "1.6",
                    color: T.body,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {aiAnalysis ||
                    "AI analysis will be generated based on your risk register data, identifying critical risks, evaluating mitigation effectiveness, and providing actionable recommendations to strengthen strategic risk control."}
                </div>

                {!isInvestorView && aiAnalysis && (
                  <div style={{ marginTop: "15px", textAlign: "right" }}>
                    <button
                      onClick={handleSaveToNotes}
                      disabled={isSaving}
                      style={{
                        ...btnGhost,
                        padding: "8px 16px",
                        fontSize: "12px",
                        background: isSaving ? T.muted : T.accent,
                        color: "#fff",
                        opacity: isSaving ? 0.7 : 1,
                      }}
                    >
                      {isSaving ? (
                        "Saving..."
                      ) : saveSuccess ? (
                        "✓ Saved!"
                      ) : (
                        "📌 Save Analysis to Notes"
                      )}
                    </button>
                  </div>
                )}
              </>
            )}

            <div
              style={{
                marginTop: "15px",
                paddingTop: "15px",
                borderTop: `1px solid ${T.lineSoft}`,
                fontSize: "11px",
                color: T.muted,
                fontStyle: "italic",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>
                Analysis powered by AI • Updates when risk data changes
              </span>
              <button
                onClick={() => setShowAIAnalysis(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: T.muted,
                  cursor: "pointer",
                  fontSize: "12px",
                  textDecoration: "underline",
                }}
              >
                Hide Analysis
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Strategy Component - REMOVED Change and adaptability tab
const Strategy = () => {
  const [activeSection, setActiveSection] = useState("strategic-clarity");
  const [milestoneData, setMilestoneData] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isInvestorView, setIsInvestorView] = useState(false);
  const [viewOrigin, setViewOrigin] = useState("investor");
  const [viewingSMEId, setViewingSMEId] = useState(null);
  const [viewingSMEName, setViewingSMEName] = useState("");
  const [selectedCohort, setSelectedCohort] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    const investorViewMode = sessionStorage.getItem("investorViewMode");
    const smeId = sessionStorage.getItem("viewingSMEId");
    const smeName = sessionStorage.getItem("viewingSMEName");
    const origin = sessionStorage.getItem("viewOrigin");

    if (investorViewMode === "true" && smeId) {
      setIsInvestorView(true);
      setViewingSMEId(smeId);
      setViewingSMEName(smeName || "SME");
      setViewOrigin(origin || "investor");
      console.log(
        "Investor view mode activated for SME:",
        smeId,
        "Origin:",
        origin
      );
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (isInvestorView && viewingSMEId) {
        setCurrentUser({ uid: viewingSMEId });
      } else {
        setCurrentUser(user);
      }
    });

    return () => unsubscribe();
  }, [isInvestorView, viewingSMEId]);

  useEffect(() => {
    const loadUserMilestoneData = async () => {
      if (!currentUser) {
        setMilestoneData([]);
        return;
      }

      try {
        const milestonesSnapshot = await getDocs(
          query(
            collection(db, "milestones"),
            where("userId", "==", currentUser.uid)
          )
        );
        setMilestoneData(
          milestonesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      } catch (error) {
        console.error("Error loading user milestone data:", error);
      }
    };

    loadUserMilestoneData();
  }, [currentUser]);

  const getContentStyles = () => ({
    flex: 1,
    transition: "padding 0.3s ease",
    boxSizing: "border-box",
    width: "100%",
    overflowX: "hidden",
  });

  const handleExitInvestorView = () => {
    const origin = sessionStorage.getItem("viewOrigin");
    sessionStorage.removeItem("viewingSMEId");
    sessionStorage.removeItem("viewingSMEName");
    sessionStorage.removeItem("investorViewMode");
    sessionStorage.removeItem("viewOrigin");

    if (origin === "cmf") {
      window.location.href = "/cmf-cohorts";
    } else if (origin === "catalyst") {
      window.location.href = "/catalyst/cohorts";
    } else {
      window.location.href = "/my-cohorts";
    }
  };

  // Updated section buttons - REMOVED "Change and adaptability"
  const sectionButtons = [
    { id: "strategic-clarity", label: "Strategic Clarity" },
    { id: "operating-model", label: "Operating Model" },
    { id: "strategy-operationalisation", label: "Strategy Operationalisation" },
    { id: "strategic-risk-control", label: "Strategic Risk Control" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", overflow: "hidden" }}>
      <div style={getContentStyles()}>
        {isInvestorView && (
          <div
            style={{
              background: T.greenBg,
              padding: "16px 20px",
              margin: "80px 20px 20px 20px",
              borderRadius: "10px",
              border: `2px solid ${T.green}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "20px" }}>👁️</span>
              <span
                style={{
                  color: T.green,
                  fontWeight: "600",
                  fontSize: "15px",
                }}
              >
                {viewOrigin === "catalyst"
                  ? `Catalyst View: Viewing ${viewingSMEName}'s Strategy & Execution`
                  : viewOrigin === "cmf"
                  ? `Facilitator View: Viewing ${viewingSMEName}'s Strategy & Execution`
                  : `Investor View: Viewing ${viewingSMEName}'s Strategy & Execution`}
              </span>
            </div>
            <button
              onClick={handleExitInvestorView}
              style={{
                ...btnPrimary,
                background: T.green,
                borderColor: T.green,
              }}
            >
              <span>←</span>
              {viewOrigin === "catalyst"
                ? "Back to Catalyst Cohorts"
                : "Back to My Cohorts"}
            </button>
          </div>
        )}
        <div style={{ padding: "0 20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h1
              style={{
                color: T.accent,
                fontSize: "27px",
                fontWeight: 650,
                margin: 0,
                letterSpacing: "-0.5px",
              }}
            >
              Strategy & Execution
            </h1>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              marginBottom: "20px",
            }}
          >
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              style={btnQuiet}
            >
              {showFullDescription ? "See less" : "See more about dashboard"}
            </button>
          </div>

          {showFullDescription && (
            <div
              style={{
                ...cardS,
                marginBottom: "30px",
              }}
            >
              <p
                style={{
                  color: T.body,
                  fontSize: "16px",
                  lineHeight: "1.6",
                  margin: 0,
                }}
              >
                The Strategy & Execution dashboard helps you assess whether your
                business is deliberately steered, not reactive. It evaluates how
                strategy is translated into structure, priorities, and action,
                and surfaces strategic execution risks rather than operational
                performance. This dashboard tests whether your operating model
                fits your business's current reality.
              </p>

              <div
                style={{
                  marginTop: "20px",
                  paddingTop: "20px",
                  borderTop: `1px solid ${T.line}`,
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "20px",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        color: T.accent,
                        marginTop: 0,
                        marginBottom: "12px",
                        fontSize: "16px",
                      }}
                    >
                      What this dashboard DOES
                    </h3>
                    <ul
                      style={{
                        color: T.body,
                        fontSize: "14px",
                        lineHeight: "1.7",
                        margin: 0,
                        paddingLeft: "20px",
                      }}
                    >
                      <li>
                        Assesses whether the business is deliberately steered,
                        not reactive
                      </li>
                      <li>
                        Evaluates whether strategy is translated into structure,
                        priorities, and action
                      </li>
                      <li>
                        Surfaces strategic execution risk, not operational
                        performance
                      </li>
                      <li>
                        Tests whether the operating model fits the business's
                        current reality
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3
                      style={{
                        color: T.accent,
                        marginTop: 0,
                        marginBottom: "12px",
                        fontSize: "16px",
                      }}
                    >
                      What this dashboard does NOT do
                    </h3>
                    <ul
                      style={{
                        color: T.body,
                        fontSize: "14px",
                        lineHeight: "1.7",
                        margin: 0,
                        paddingLeft: "20px",
                      }}
                    >
                      <li>Evaluate strategy quality or competitiveness</li>
                      <li>Track operational KPIs (Ops dashboard does that)</li>
                      <li>
                        Measure performance outcomes (Finance &amp; Ops do that)
                      </li>
                      <li>Manage projects or OKRs</li>
                      <li>Replace business planning or consulting work</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab buttons - UPDATED with the same style as Financial Performance */}
          <div
            style={{
              display: "flex",
              gap: "2px",
              borderBottom: `1px solid ${T.lineStrong}`,
              marginBottom: "18px",
              flexWrap: "wrap",
              alignItems: "center",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {sectionButtons.map((button) => (
              <button
                key={button.id}
                onClick={() => setActiveSection(button.id)}
                style={{
                  padding: "12px 20px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14.5px",
                  fontWeight: activeSection === button.id ? 600 : 500,
                  color: activeSection === button.id ? T.accent : T.body,
                  borderBottom:
                    activeSection === button.id
                      ? `2px solid ${T.accent}`
                      : "2px solid transparent",
                  fontFamily: "inherit",
                  marginBottom: "-1px",
                }}
              >
                {button.label}
              </button>
            ))}
          </div>

          <StrategicClarity
            activeSection={activeSection}
            currentUser={currentUser}
            isInvestorView={isInvestorView}
          />
          <BusinessModelCanvas
            activeSection={activeSection}
            currentUser={currentUser}
            isInvestorView={isInvestorView}
          />
          <StrategicGoals
            activeSection={activeSection}
            milestoneData={milestoneData}
            setMilestoneData={setMilestoneData}
            currentUser={currentUser}
            isInvestorView={isInvestorView}
          />
          <RiskManagement
            activeSection={activeSection}
            currentUser={currentUser}
            isInvestorView={isInvestorView}
          />
        </div>
      </div>
    </div>
  );
};

export default Strategy;