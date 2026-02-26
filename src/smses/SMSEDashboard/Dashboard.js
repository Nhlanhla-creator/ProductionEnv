"use client"

import { useState, useEffect, useRef } from "react"
import { DashboardHeader } from "./dashboard-header"
import { ApplicationTracker } from "./application-tracker"
import { LegitimacyScoreCard } from "./legitimacy-score-card"
import { FundabilityScoreCard } from "./fundability-score-card"
import { ComplianceScoreCard } from "./compliance-score"
import { BigScoreCard } from "./big-score"
import { PISScoreCard } from "./pis-score"
import { LeadershipScoreCard } from "./leadership-score-card"
import { CustomerReviewsCard } from "./customer-reviews-card"
import ShopToolsPage from "../../smses/MyGrowthTools/shop"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "../../firebaseConfig"
import { X, ChevronRight, Info, Smile, Star, ShieldCheck, ChevronDown, ChevronUp, FileText, TrendingUp, AlertCircle, CheckCircle, Download, Calendar, Bus } from 'lucide-react'
import "./Dashboard.css"
import { getFunctions, httpsCallable } from "firebase/functions";

import { onAuthStateChanged, getAuth } from "firebase/auth"
import {
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { API_KEYS } from "../../API"

const sendMessageToChatGPT = async (message) => {
  try {
    const functions = getFunctions();
    const call = httpsCallable(functions, "generateSummaryText");
    const resp = await call({ prompt: message });
    const content = resp?.data?.content;
    if (!content) throw new Error("Empty response from summary function.");
    return content;
  } catch (err) {
    console.error("Callable error:", err);
    throw new Error(err?.message || "Failed to generate summary text.");
  }
};

export const SummaryReportCard = ({ userId: propUserId, styles = {}, apiKey }) => {
  const [userId, setUserId] = useState(propUserId || null);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [topPriorities, setTopPriorities] = useState([]);
  const [prioritiesLoading, setPrioritiesLoading] = useState(false);
  const [improvementSummary, setImprovementSummary] = useState("");
  const [isGeneratingNew, setIsGeneratingNew] = useState(false);

  // ─── Auth ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (propUserId) {
      setUserId(propUserId);
      return;
    }
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setError("User not logged in");
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [propUserId]);

  // ─── Main fetch flow ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // STEP 1: Check if there's a trigger flag asking for a fresh evaluation
        const shouldTriggerNew = await checkTriggerFundabilityEvaluation(userId);

        if (shouldTriggerNew) {
          // Trigger wins – always regenerate
          console.log("Trigger detected → generating new evaluation");
          setIsGeneratingNew(true);
          await generateNewEvaluation(userId);
          await resetTrigger(userId);
          setIsGeneratingNew(false);
          return;
        }

        // STEP 2: Try to load an existing summary from Firebase
        const existingSummary = await loadSummaryFromFirebase(userId);

        if (existingSummary && existingSummary.reportData) {
          // Validate the saved summary isn't a stub / fallback
          const summaryIsFallback = isFallbackSummary(existingSummary.improvementSummary);
          const reportHasData = hasValidEvaluationData(existingSummary.reportData);

          if (!summaryIsFallback && reportHasData) {
            // STEP 2a: Good existing data – use it
            console.log("Using cached summary from Firebase");
            setReportData(existingSummary.reportData);
            setTopPriorities(existingSummary.topPriorities || []);
            setImprovementSummary(existingSummary.improvementSummary || "");
            return;
          }

          // STEP 2b: Cached data exists but is a fallback stub – regenerate
          console.log("Cached summary is a fallback → regenerating");
          await generateNewEvaluation(userId);
          return;
        }

        // STEP 3: No data found at all (new user) – generate from scratch
        console.log("No existing summary found (new user) → generating from scratch");
        await generateNewEvaluation(userId);

      } catch (err) {
        console.error("fetchData error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
        setIsGeneratingNew(false);
      }
    };

    fetchData();
  }, [userId]);

  // ─── Firebase helpers ────────────────────────────────────────────────────────

  const loadSummaryFromFirebase = async (userId) => {
    try {
      const summaryRef = doc(db, "Aisummaryreports", userId);
      const summarySnap = await getDoc(summaryRef);

      if (summarySnap.exists()) {
        const data = summarySnap.data();
        return {
          topPriorities: data.topPriorities || [],
          improvementSummary: data.improvementSummary || "",
          reportData: data.reportData || null,
          createdAt: data.createdAt,
          lastUpdated: data.lastUpdated,
        };
      }

      // Fallback paths (legacy / alternative storage)
      const [altSnap1, altSnap2] = await Promise.all([
        getDoc(doc(db, "users", userId, "summary", "latest")),
        getDoc(doc(db, "summaryReports", userId)),
      ]);

      if (altSnap1.exists()) return processSnapshotData(altSnap1);
      if (altSnap2.exists()) return processSnapshotData(altSnap2);

      return null; // truly new user
    } catch (error) {
      console.error("loadSummaryFromFirebase error:", error.message);
      return null;
    }
  };

  const processSnapshotData = (snap) => {
    const data = snap.data();
    return {
      topPriorities: data.topPriorities || [],
      improvementSummary: data.improvementSummary || "",
      reportData: data.reportData || null,
      createdAt: data.createdAt,
      lastUpdated: data.lastUpdated,
    };
  };

  const saveSummaryToFirebase = async (userId, summaryData) => {
    try {
      const summaryRef = doc(db, "Aisummaryreports", userId);
      await setDoc(summaryRef, {
        ...summaryData,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
      });
      console.log("Summary saved to Firebase");
    } catch (error) {
      console.error("saveSummaryToFirebase error:", error);
    }
  };

  const checkTriggerFundabilityEvaluation = async (userId) => {
    try {
      const profileRef = doc(db, "universalProfiles", userId);
      const profileSnap = await getDoc(profileRef);
      return profileSnap.exists()
        ? profileSnap.data().triggerLegitimacyEvaluation === true
        : false;
    } catch (error) {
      console.error("checkTriggerFundabilityEvaluation error:", error);
      return false;
    }
  };

  const resetTrigger = async (userId) => {
    try {
      const profileRef = doc(db, "universalProfiles", userId);
      await setDoc(profileRef, { triggerLegitimacyEvaluation: false }, { merge: true });
    } catch (error) {
      console.error("resetTrigger error:", error);
    }
  };

  // ─── Validation helpers ──────────────────────────────────────────────────────

  /**
   * Returns true when the stored improvement summary is clearly a stub/fallback
   * and should NOT be treated as real content.
   */
  const isFallbackSummary = (summary) => {
    if (!summary || summary.trim().length === 0) return true;
    const fallbackPhrases = [
      "unavailable",
      "using fallback",
      "unable to generate",
      "pending",
      "basic evaluation",
      "no data",
      "basic evaluation pending",
    ];
    const lower = summary.toLowerCase();
    return fallbackPhrases.some((phrase) => lower.includes(phrase));
  };

  const hasValidEvaluationData = (reportData) => {
    if (!reportData) return false;
    const hasScores =
      reportData.overallScore > 0 ||
      reportData.governanceScore > 0 ||
      reportData.leadershipScore > 0 ||
      reportData.profileEvaluationScore > 0;
    const hasStructuredContent =
      reportData.structuredContent &&
      Object.keys(reportData.structuredContent).length > 0;
    return hasScores || hasStructuredContent;
  };

  // ─── Score helpers ───────────────────────────────────────────────────────────

  const getScoreLevel = (score) => {
    if (score >= 85) return { level: "Highly Fundable", color: "#4CAF50" };
    if (score >= 70) return { level: "Fundable", color: "#8BC34A" };
    if (score >= 55) return { level: "Moderately Fundable", color: "#FF9800" };
    if (score >= 40) return { level: "Low Fundability", color: "#FF5722" };
    return { level: "Not Ready for Funding", color: "#F44336" };
  };

  // ─── Generation ──────────────────────────────────────────────────────────────

  const generateNewEvaluation = async (userId) => {
    try {
      console.log("generateNewEvaluation → userId:", userId);

      const newReportData = {
        generatedDate: new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        overallScore: 0,
        bigScore: 0,
        fundabilityStatus: "Assessment Incomplete",
        governanceScore: 0,
        leadershipScore: 0,
        profileEvaluationScore: 0,
        weightedAverageScore: 0,
        detailedScores: [],
        improvementSuggestions: [],
        structuredContent: {},
        aiEvaluations: {},
        missingSections: [],
      };

      const availableData = {
        combinedEvaluations: false,
        fundability: false,
        legitimacy: false,
        profile: false,
        governance: false,
        leadership: false,
      };

      // Combined evaluations
      const combinedQuery = query(
        collection(db, "combinedEvaluations"),
        where("userId", "==", userId)
      );
      const combinedSnap = await getDocs(combinedQuery);

      if (!combinedSnap.empty) {
        availableData.combinedEvaluations = true;
        const combinedData = combinedSnap.docs[0].data();
        newReportData.structuredContent = combinedData.structuredContent || {};
        newReportData.overallScore = combinedData.combinedScore || 0;
        newReportData.fundabilityStatus =
          combinedData.status || getScoreLevel(newReportData.overallScore).level;
      }

      // All individual evaluations in parallel
      const [fundSnap, legitSnap, profileSnap, governanceSnap, leadershipSnap, bigEvalSnap] =
  await Promise.all([
    getDoc(doc(db, "aiFundabilityEvaluations", userId)),
    getDoc(doc(db, "aiLegitimacyEvaluation", userId)),
    getDoc(doc(db, "universalProfiles", userId)),
    getDoc(doc(db, "aiGovernanceEvaluation", userId)),
    getDoc(doc(db, "aiLeadershipEvaluation", userId)),
    getDoc(doc(db, "bigEvaluations", userId)),
  ]);
// ── Authoritative scores from bigEvaluations ──────────────────────
if (bigEvalSnap.exists()) {
  const bigEvalData = bigEvalSnap.data();
  const scores = bigEvalData.scores || {};
  newReportData.bigScore            = scores.bigScore       ?? 0;  // ← explicit bigScore
  newReportData.overallScore        = scores.bigScore       ?? newReportData.overallScore;
  newReportData.governanceScore     = scores.governance     ?? newReportData.governanceScore;
  newReportData.leadershipScore     = scores.leadership     ?? newReportData.leadershipScore;
  newReportData.profileEvaluationScore = scores.pis         ?? newReportData.profileEvaluationScore;
  newReportData.complianceScore     = scores.compliance     ?? 0;
  newReportData.legitimacyScore     = scores.legitimacy     ?? 0;
  newReportData.fundabilityScore    = scores.fundability    ?? 0;
  newReportData.fundabilityStatus   = getScoreLevel(scores.bigScore ?? 0).level;
  newReportData.smeName             = bigEvalData.smeName   || "";
  newReportData.scoresLastUpdated   = scores.lastUpdated    || "";
  availableData.combinedEvaluations = true;
}
      if (fundSnap.exists()) {
        availableData.fundability = true;
        newReportData.aiEvaluations.fundability = fundSnap.data();
      } else {
        newReportData.missingSections.push("Capital Appeal");
      }

      if (legitSnap.exists()) {
        availableData.legitimacy = true;
        newReportData.aiEvaluations.legitimacy = legitSnap.data();
      } else {
        newReportData.missingSections.push("Legitimacy Evaluation");
      }

      if (profileSnap.exists()) {
  const profileData = profileSnap.data();
  availableData.profile = true;
  newReportData.aiEvaluations.profile = profileData;
  // Only use profile scores as fallback if bigEvaluations didn't provide them
  if (!bigEvalSnap.exists()) {
    newReportData.overallScore = profileData.bigScore || newReportData.overallScore;
    newReportData.profileEvaluationScore = profileData.pisScore || 0;
    if (!availableData.combinedEvaluations) {
      newReportData.fundabilityStatus = getScoreLevel(newReportData.overallScore).level;
    }
  }

  // ── Compliance document analysis ──────────────────────────────────
  const complianceRubric = [
    {
      label: "CIPC business registration",
      compulsory: true,
      verified: profileData.verification?.registrationCertificate?.status === "verified",
      message: profileData.verification?.registrationCertificate?.message || "",
    },
    {
      label: "SARS tax compliance status",
      compulsory: true,
      verified: profileData.verification?.taxClearanceCert?.status === "verified",
      message: profileData.verification?.taxClearanceCert?.message || "",
    },
    {
      label: "B-BBEE certification",
      compulsory: true,
      verified: profileData.verification?.bbbeeCert?.status === "verified",
      message: profileData.verification?.bbbeeCert?.message || "",
    },
    {
      label: "Business Bank Account",
      compulsory: false,
      verified: !!(
        profileData.fundingDocuments?.bankConfirmation ||
        profileData.documents?.bankConfirmation ||
        profileData.financialOverview?.bankAccount
      ),
      message: "",
    },
    {
      label: "Ownership/Shareholding Structure",
      compulsory: true,
      verified: profileData.verification?.shareRegister?.status === "verified",
      message: profileData.verification?.shareRegister?.message || "",
    },
    {
      label: "Verified Address & Director ID",
      compulsory: true,
      verified: profileData.verification?.certifiedIds?.status === "verified",
      message: profileData.verification?.certifiedIds?.message || "",
    },
    {
      label: "Complete business profile",
      compulsory: false,
      verified: (() => {
        const totalSections = [
          "instructions", "entityOverview", "ownershipManagement",
          "contactDetails", "legalCompliance", "productsServices",
          "howDidYouHear", "documents", "declarationConsent",
        ];
        const completed = totalSections.filter(k => profileData.completedSections?.[k]).length;
        return (completed / totalSections.length) >= 0.8;
      })(),
      message: "",
    },
  ];

  // Also pull rejected/flagged docs from *_multiple arrays
  const multipleDocFields = [
    { key: "CV_multiple", label: "CV" },
    { key: "cv_multiple", label: "CV" },
    { key: "IDs of Directors & Shareholders_multiple", label: "Director/Shareholder ID" },
    { key: "guaranteeContract_multiple", label: "Guarantee/Contract" },
    { key: "industryAccreditationDocs_multiple", label: "Industry Accreditation" },
    { key: "loanAgreements_multiple", label: "Loan Agreement" },
  ];

  const rejectedDocs = [];
  for (const { key, label } of multipleDocFields) {
    const entries = profileData.documents?.[key] || profileData[key] || [];
    for (const entry of entries) {
      if (["name_mismatch", "wrong_type", "expired", "rejected"].includes(entry.status)) {
        rejectedDocs.push({
          label,
          status: entry.status,
          message: entry.message || "",
          person: entry.directorName || entry.executiveName || entry.personName || "",
          role: entry.roleLabel || entry.role || "",
        });
      }
    }
  }

  newReportData.complianceRubric = complianceRubric;
  newReportData.rejectedDocs = rejectedDocs;
}

      if (governanceSnap.exists()) {
        availableData.governance = true;
        const governanceData = governanceSnap.data() || {};
        newReportData.aiEvaluations.governance = governanceData;
        newReportData.governanceScore = governanceData.governanceScore || 0;
      } else {
        newReportData.missingSections.push("Governance Evaluation");
      }

      if (leadershipSnap.exists()) {
  availableData.leadership = true;
  const leadershipData = leadershipSnap.data() || {};
  newReportData.aiEvaluations.leadership = leadershipData;
  // Only use this score if bigEvaluations didn't already set it
  if (!bigEvalSnap.exists()) {
    newReportData.leadershipScore = leadershipData.leadershipScore || 0;
  }
} else {
  newReportData.missingSections.push("Leadership Evaluation");
}

      // Weighted average
      const scores = [];
      if (availableData.governance) scores.push(newReportData.governanceScore);
      if (availableData.leadership) scores.push(newReportData.leadershipScore);
      if (availableData.profile) scores.push(newReportData.profileEvaluationScore);

      if (scores.length > 0) {
        newReportData.weightedAverageScore =
          scores.reduce((a, b) => a + b, 0) / scores.length;
        if (!availableData.combinedEvaluations) {
          newReportData.overallScore = newReportData.weightedAverageScore;
          newReportData.fundabilityStatus = getScoreLevel(
            newReportData.overallScore
          ).level;
        }
      }

      // Detailed scores from markdown
      if (newReportData.structuredContent.governance?.rawContent) {
        newReportData.detailedScores = [
          ...newReportData.detailedScores,
          ...extractScoresFromMarkdown(
            newReportData.structuredContent.governance.rawContent
          ),
        ];
      }
      if (newReportData.structuredContent.leadership?.rawContent) {
        newReportData.detailedScores = [
          ...newReportData.detailedScores,
          ...extractScoresFromMarkdown(
            newReportData.structuredContent.leadership.rawContent
          ),
        ];
      }
      if (newReportData.structuredContent.profileEvaluation?.breakdown) {
        newReportData.detailedScores = [
          ...newReportData.detailedScores,
          ...Object.entries(
            newReportData.structuredContent.profileEvaluation.breakdown
          ).map(([category, score]) => ({
            category,
            score,
            maxScore: getMaxScoreForProfileCategory(category),
            rationale: `${category} scored ${score} out of ${getMaxScoreForProfileCategory(category)}`,
          })),
        ];
      }

      newReportData.improvementSuggestions = getImprovementSuggestions(
        newReportData.structuredContent
      );

      if (newReportData.missingSections.length > 0) {
        newReportData.improvementSuggestions.push({
          category: "Complete Missing Evaluations",
          suggestions: [
            `The following evaluations are missing: ${newReportData.missingSections.join(", ")}.`,
            "Complete these evaluations for a more comprehensive analysis.",
          ],
        });
      }

      setReportData(newReportData);

      // Generate AI narrative – always try; fall back to basic if no data at all
      const hasAnyData = Object.values(availableData).some((v) => v);
      if (hasAnyData) {
        await generateAIInsights(newReportData, userId);
      } else {
        await generateBasicAIInsights(newReportData, userId);
      }
    } catch (error) {
      console.error("generateNewEvaluation error:", error);
      throw error;
    }
  };

  const generateBasicAIInsights = async (reportData, userId) => {
    const fallbackPriorities = [
      {
        title: "Complete Business Profile",
        description:
          "Fill out all sections of your business profile to get comprehensive evaluation insights.",
      },
      {
        title: "Upload Business Documents",
        description:
          "Upload your documents for detailed AI analysis and recommendations.",
      },
      {
        title: "Financial Documentation",
        description:
          "Provide financial statements and projections to improve your fundability assessment.",
      },
    ];

    const basicSummary =
      "### Complete Your Profile\n- Fill out all business profile sections\n- Upload required documents\n- Provide financial information\n\n### Next Steps\n- Complete document upload for compliance\n- Submit leadership structure for review\n- Ensure all compliance requirements are met";

    setTopPriorities(fallbackPriorities);
    setImprovementSummary(basicSummary);

    await saveSummaryToFirebase(userId, {
      reportData,
      topPriorities: fallbackPriorities,
      // Use the full markdown text (not the stub phrase) so isFallbackSummary
      // won't trigger a re-generation on the next load.
      improvementSummary: basicSummary,
      userId,
    });
  };

  const generateAIInsights = async (reportData, userId) => {
    if (!reportData?.aiEvaluations) return;

   const complianceRubricText = (reportData.complianceRubric || [])
  .map(doc =>
    `- [${doc.verified ? "✓ Verified" : "✗ Missing"}] ${doc.compulsory ? "(Required) " : ""}${doc.label}${doc.message ? ` — ${doc.message}` : ""}`
  )
  .join("\n");

const rejectedDocsText = (reportData.rejectedDocs || []).length
  ? (reportData.rejectedDocs)
      .map(doc =>
        `- [${doc.status.toUpperCase()}] ${doc.label}${doc.person ? ` for ${doc.person}${doc.role ? ` (${doc.role})` : ""}` : ""}: ${doc.message}`
      )
      .join("\n")
  : "No rejected documents.";

  const scoreSummaryText = `
BIG Score: ${reportData.overallScore} — ${getScoreLevel(reportData.overallScore).level}
Compliance: ${reportData.complianceScore ?? "N/A"}
Legitimacy: ${reportData.legitimacyScore ?? "N/A"}
Leadership: ${reportData.leadershipScore ?? "N/A"}
Fundability: ${reportData.fundabilityScore ?? "N/A"}
Governance: ${reportData.governanceScore ?? "N/A"}
PIS Score: ${reportData.profileEvaluationScore ?? "N/A"}
`.trim();

const combinedText = `
Score Summary (from bigEvaluations):
${scoreSummaryText}

Capital Appeal Analysis:
${reportData.aiEvaluations.fundability?.result || ""}

AI Legitimacy Analysis:
${reportData.aiEvaluations.legitimacy?.result || ""}

Governance Evaluation:
${reportData.aiEvaluations.governance?.result || ""}

Leadership Evaluation:
${reportData.aiEvaluations.leadership?.result || ""}

Compliance Score Breakdown:
${complianceRubricText}

Rejected/Flagged Documents:
${rejectedDocsText}
`.trim();

    setPrioritiesLoading(true);

    try {
      const priorityPrompt = `
You are an expert business analyst specializing in fundability assessment. Based on the comprehensive business evaluations provided below, identify the TOP 3 MOST CRITICAL PRIORITIES that this business needs to address immediately to improve their fundability and investment readiness.

EVALUATIONS:
${combinedText}

RESPONSE FORMAT:
{
  "priorities": [
    { "title": "Priority 1", "description": "Short, specific action." },
    { "title": "Priority 2", "description": "Short, specific action." },
    { "title": "Priority 3", "description": "Short, specific action." }
  ]
}

Respond only with valid JSON.
      `.trim();

      const prioritiesResponse = await sendMessageToChatGPT(priorityPrompt);

      let newTopPriorities = [];
      try {
        const jsonMatch =
          prioritiesResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || [];
        const cleaned = jsonMatch[1] || prioritiesResponse;
        const parsed = JSON.parse(cleaned);
        if (parsed?.priorities?.length === 3) {
          newTopPriorities = parsed.priorities;
        } else {
          throw new Error("Invalid priorities format");
        }
      } catch (err) {
        console.warn("Priorities parse fallback:", err);
        newTopPriorities = generateIntelligentFallback(reportData);
      }

      setTopPriorities(newTopPriorities);

      const summaryPrompt = `
You are an expert business analyst. Summarize key improvement areas grouped under each heading below.

### AI Capital Appeal Analysis
- [Improvement 1]
- [Improvement 2]

### AI Legitimacy Analysis
- [Improvement 1]
- [Improvement 2]

### Governance Evaluation
- [Improvement 1]
- [Improvement 2]

### Leadership Evaluation
- [Improvement 1]
- [Improvement 2]

if neccessary, list more improvement areas under each section, but keep it concise.

### Compliance Score
- List each missing required document and what the business needs to do to get it verified.
- For each rejected or flagged document, name who it belongs to, the rejection reason, and corrective action needed.
- Note any documents that are verified as positive progress.

Keep it concise, professional, and actionable.
`.trim();

      const summaryResponse = await sendMessageToChatGPT(
        summaryPrompt + "\n\n" + combinedText
      );
      setImprovementSummary(summaryResponse);

      await saveSummaryToFirebase(userId, {
        reportData,
        topPriorities: newTopPriorities,
        improvementSummary: summaryResponse,
        userId,
      });
    } catch (err) {
      console.error("generateAIInsights error:", err);

      // Even on error, set something meaningful so the UI isn't empty
      const fallbackPriorities = generateIntelligentFallback(reportData);
      const fallbackSummary =
        "### Evaluation Summary\n- Complete all profile sections for a detailed analysis.\n- Provide financial documentation to improve your fundability score.\n- Strengthen governance and leadership documentation.";

      setTopPriorities(fallbackPriorities);
      setImprovementSummary(fallbackSummary);

      await saveSummaryToFirebase(userId, {
        reportData,
        topPriorities: fallbackPriorities,
        improvementSummary: fallbackSummary,
        userId,
      });
    } finally {
      setPrioritiesLoading(false);
    }
  };

  // ─── Fallback / utility helpers ──────────────────────────────────────────────

  const generateIntelligentFallback = (reportData) => {
    const scores = {
      governance: reportData.governanceScore || 0,
      leadership: reportData.leadershipScore || 0,
      profile: reportData.profileEvaluationScore || 0,
      overall: reportData.overallScore || 0,
    };

    const sortedScores = Object.entries(scores).sort(([, a], [, b]) => a - b);

    const priorityMap = {
      governance: {
        title: "Governance Structure",
        description:
          "Strengthen your governance framework with clear policies, decision-making processes, and accountability measures to build investor confidence.",
      },
      leadership: {
        title: "Leadership Development",
        description:
          "Enhance leadership team capabilities by showcasing experience, expertise, and strategic vision to demonstrate strong business stewardship.",
      },
      profile: {
        title: "Company Profile",
        description:
          "Enhance your company profile by showcasing team expertise, operational achievements, and governance structure to build investor confidence.",
      },
      overall: {
        title: "Overall Readiness",
        description:
          "Address fundamental business readiness issues across planning, presentation, and operational capabilities to improve fundability.",
      },
    };

    const commonPriorities = [
      {
        title: "Financial Modeling",
        description:
          "Develop comprehensive financial projections with realistic assumptions and a clear path to profitability to meet investor requirements.",
      },
      {
        title: "Market Validation",
        description:
          "Provide concrete evidence of market demand through customer testimonials, pilot programs, or pre-orders to reduce investment risk.",
      },
      {
        title: "Competitive Edge",
        description:
          "Clearly articulate your unique value proposition and sustainable competitive advantages to differentiate from alternatives.",
      },
    ];

    const result = [];
    for (const [scoreType] of sortedScores) {
      if (result.length >= 3) break;
      if (priorityMap[scoreType]) result.push(priorityMap[scoreType]);
    }
    for (const cp of commonPriorities) {
      if (result.length >= 3) break;
      if (!result.some((r) => r.title === cp.title)) result.push(cp);
    }
    return result.slice(0, 3);
  };

  const extractScoresFromMarkdown = (markdown) => {
    const scoreRegex = /\| (.+?) \| (\d) \|/g;
    return [...markdown.matchAll(scoreRegex)].map((match) => ({
      category: match[1],
      score: parseInt(match[2]) * 20,
      maxScore: 100,
      rationale: `${match[1]} scored ${parseInt(match[2])} out of 5`,
    }));
  };

  const getMaxScoreForProfileCategory = (category) => {
    const maxScores = {
      leadership: 15,
      financialReadiness: 5,
      financialStrength: 5,
      operationalStrength: 15,
      guarantees: 10,
      impact: 10,
      governance: 15,
    };
    return maxScores[category] || 5;
  };

  const getImprovementSuggestions = (structuredContent) => {
    const suggestions = [];
    if (structuredContent.governance?.rawContent) {
      const match = structuredContent.governance.rawContent.match(
        /### 3\. Improvement Suggestions.*?### 4/s
      );
      if (match) {
        suggestions.push({
          category: "Governance Improvements",
          suggestions: match[0]
            .split("\n")
            .filter((l) => l.trim().startsWith("-") || l.trim().startsWith("•"))
            .map((l) => l.replace(/^[-•]\s*/, "").trim()),
        });
      }
    }
    if (structuredContent.leadership?.rawContent) {
      const match = structuredContent.leadership.rawContent.match(
        /### 4\. Key Improvement Suggestions.*?### 5/s
      );
      if (match) {
        suggestions.push({
          category: "Leadership Improvements",
          suggestions: match[0]
            .split("\n")
            .filter((l) => l.trim().startsWith("-") || l.trim().startsWith("•"))
            .map((l) => l.replace(/^[-•]\s*/, "").trim()),
        });
      }
    }
    if (structuredContent.profileEvaluation?.summaryRecommendation) {
      suggestions.push({
        category: "Profile Evaluation",
        suggestions: [structuredContent.profileEvaluation.summaryRecommendation],
      });
    }
    return suggestions.length > 0
      ? suggestions
      : [
          {
            category: "General Improvements",
            suggestions: [
              "Refine executive summary",
              "Add detailed projections",
              "Clarify team strengths",
            ],
          },
        ];
  };

  // ─── Download ────────────────────────────────────────────────────────────────

  const handleDownloadReport = () => {
    if (!reportData) return;

    const formatImprovementSummary = (summary) =>
      summary
        .replace(
          /### (.*?)$/gm,
          '<h3 style="color: #5D4037; font-size: 1.3rem; font-weight: 600; margin: 25px 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #8D6E63;">$1</h3>'
        )
        .replace(
          /\*\*(.*?)\*\*/g,
          '<strong style="color: #5D4037; font-weight: 600;">$1</strong>'
        )
        .replace(
          /^- (.*?)$/gm,
          '<div style="margin: 10px 0; padding-left: 20px; position: relative; line-height: 1.6;"><span style="position: absolute; left: 0; color: #5D4037; font-weight: bold;">•</span>$1</div>'
        )
        .replace(/\n/g, "<br>");

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>BIG Fundability Report</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #f8f9fa; padding: 20px; color: #333; }
          .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; }
          .header { background: linear-gradient(135deg, #5D4037 0%, #3E2723 100%); color: white; padding: 40px 30px; text-align: center; }
          .report-title { font-size: 2.2rem; font-weight: 700; margin-bottom: 8px; }
          .report-date { font-size: 1rem; opacity: 0.9; }
          .content { padding: 40px 30px; }
          .scores-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
          .score-card { text-align: center; padding: 20px; background: #f8f9fa; border-radius: 12px; border: 1px solid #e9ecef; }
          .score-value { font-size: 2rem; font-weight: 700; color: #5D4037; margin-bottom: 5px; }
          .score-label { font-size: 0.9rem; color: #6c757d; font-weight: 500; }
          .improvement-content { background: #f8f9fa; border-radius: 12px; padding: 30px; border: 1px solid #e9ecef; line-height: 1.7; }
          .status-badge { display: inline-block; padding: 8px 16px; background: rgba(255,152,0,0.1); color: #ff9800; border-radius: 20px; border: 1px solid rgba(255,152,0,0.3); font-weight: 600; font-size: 0.9rem; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="font-size:1.5rem;font-weight:700;margin-bottom:10px;">📊 BIG Analytics</div>
            <h1 class="report-title">Business Evaluation Summary Report</h1>
            <p class="report-date">Generated on ${reportData.generatedDate}</p>
          </div>
          <div class="content">
            <div class="scores-grid">
      <div class="score-card"><div class="score-value">${reportData.bigScore}</div><div class="score-label">BIG Score</div></div>
<div class="score-card"><div class="score-value">${reportData.complianceScore ?? 0}%</div><div class="score-label">Compliance</div></div>
<div class="score-card"><div class="score-value">${reportData.legitimacyScore ?? 0}</div><div class="score-label">Legitimacy</div></div>
<div class="score-card"><div class="score-value">${reportData.leadershipScore ?? 0}</div><div class="score-label">Leadership</div></div>
<div class="score-card"><div class="score-value">${reportData.fundabilityScore ?? 0}</div><div class="score-label">Fundability</div></div>
<div class="score-card"><div class="score-value">${reportData.governanceScore ?? 0}</div><div class="score-label">Governance</div></div>
<div class="score-card"><div class="score-value">${reportData.profileEvaluationScore ?? 0}</div><div class="score-label">PIS Score</div></div>
            </div>
            <div style="text-align:center;margin-bottom:30px;"><span class="status-badge">Status: ${reportData.fundabilityStatus}</span></div>
            <h2 style="font-size:1.8rem;color:#3E2723;margin-bottom:20px;font-weight:600;">Key Improvement Areas</h2>
            <div class="improvement-content">
              ${improvementSummary ? formatImprovementSummary(improvementSummary) : "<p>No recommendations available.</p>"}
            </div>
            <div style="text-align:center;padding-top:30px;border-top:1px solid #e9ecef;color:#6c757d;font-size:0.9rem;">
              <p>Generated by BIG Analytics on ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `BIG-Fundability-Report-${new Date().toISOString().split("T")[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ padding: 20, color: "#5D4037" }}>
        {isGeneratingNew
          ? "Generating new summary evaluation..."
          : "Loading summary report..."}
      </div>
    );
  }

  if (error) return <div style={{ padding: 20, color: "red" }}>Error: {error}</div>;

  if (!reportData) {
    return (
      <div style={{ padding: 20, color: "#5D4037" }}>
        No report data available. Please complete your business profile to generate a summary.
      </div>
    );
  }

  return (
    <>
      {/* ── Compact card ── */}
      <div
        className="summary-report-card"
        style={{
          background: "linear-gradient(135deg, #3E2723 0%, #5D4037 50%, #4E342E 100%)",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 8px 32px rgba(62, 39, 35, 0.3)",
          border: "1px solid #6D4C41",
          position: "relative",
          overflow: "hidden",
          transition: "all 0.3s ease",
          cursor: "pointer",
          minHeight: "280px",
          color: "white",
          ...styles,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 12px 40px rgba(62, 39, 35, 0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 8px 32px rgba(62, 39, 35, 0.3)";
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, #8D6E63, #A1887F, #BCAAA4)" }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ padding: "12px", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: "12px" }}>
              <FileText size={24} color="#D7CCC8" />
            </div>
            <div>
              <h3 style={{ color: "#EFEBE9", fontSize: "1.3rem", fontWeight: "700", margin: "0 0 4px 0" }}>
                BIG Score Summary Analysis
              </h3>
              <p style={{ color: "#BCAAA4", fontSize: "0.85rem", margin: 0, opacity: 0.9 }}>
                {reportData.generatedDate}
              </p>
            </div>
          </div>
        </div>

        {/* Top 3 Priorities */}
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ fontSize: "0.9rem", fontWeight: "600", color: "#EFEBE9", margin: "0 0 16px 0", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ padding: "4px", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: "6px" }}>🎯</span>
            Top 3 Priorities
          </h4>

          {prioritiesLoading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "20px", color: "#BCAAA4" }}>
              <div style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #EFEBE9", borderRadius: "50%", animation: "spin 1s linear infinite", marginRight: "8px" }} />
              Analyzing priorities...
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              {topPriorities.map((priority, index) => (
                <div
                  key={index}
                  className="priority-card"
                  style={{ position: "relative", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "14px 12px", minHeight: "90px", display: "flex", flexDirection: "column", justifyContent: "center" }}
                >
                  <h4 style={{ color: "#EFEBE9", fontSize: "0.8rem", fontWeight: "700", marginBottom: "4px" }}>
                    {priority.title}
                  </h4>
                  <p style={{ fontSize: "0.7rem", color: "#D7CCC8", lineHeight: "1.3", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {priority.description}
                  </p>
                  <div className="tooltip-content">
                    <strong>{priority.title}</strong><br />{priority.description}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* View Full Report */}
        <button
          onClick={() => setShowReportModal(true)}
          style={{ width: "100%", background: "linear-gradient(135deg, #8D6E63, #A1887F)", border: "none", color: "white", fontSize: "1rem", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "12px 24px", borderRadius: "12px", transition: "all 0.3s ease", boxShadow: "0 4px 16px rgba(141,110,99,0.3)", textTransform: "uppercase", letterSpacing: "0.5px" }}
          onMouseOver={(e) => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 6px 24px rgba(141,110,99,0.4)"; }}
          onMouseOut={(e) => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 4px 16px rgba(141,110,99,0.3)"; }}
        >
          <FileText size={18} />
          View Full Summary
        </button>
      </div>

      {/* ── Full Report Modal ── */}
      {showReportModal && reportData && (
        <div
          className="modal-overlay"
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, overflowY: "auto", padding: "20px" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowReportModal(false); }}
        >
          <div
            className="modal-content"
            style={{ backgroundColor: "#ffffff", borderRadius: "20px", maxWidth: "900px", width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 25px 60px rgba(0,0,0,0.4)", position: "relative", overflow: "hidden" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ background: "linear-gradient(135deg, #5D4037 0%, #3E2723 100%)", color: "white", padding: "32px", position: "relative" }}>
              <button
                onClick={() => setShowReportModal(false)}
                style={{ position: "absolute", top: "20px", right: "20px", background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", cursor: "pointer", fontSize: "20px" }}
              >×</button>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ padding: "16px", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: "16px" }}>
                  <FileText size={32} color="white" />
                </div>
                <div>
                  <h2 style={{ fontSize: "2rem", fontWeight: "700", margin: "0 0 8px 0" }}>Business Evaluation Summary</h2>
                  <p style={{ fontSize: "1rem", margin: 0, opacity: 0.9 }}>Comprehensive AI-driven analysis and improvement recommendations</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "40px", overflowY: "auto", flex: 1 }}>
              <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "32px", border: "1px solid #dee2e6", boxShadow: "0 4px 16px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                  <div style={{ padding: "12px", backgroundColor: "#5D4037", borderRadius: "12px" }}>
                    <TrendingUp size={24} color="white" />
                  </div>
                  <h3 style={{ fontSize: "1.5rem", color: "#3E2723", margin: 0, fontWeight: "600" }}>Key Improvement Areas</h3>
                </div>

                {improvementSummary ? (
                  <div
                    style={{ backgroundColor: "#f8f9fa", borderRadius: "12px", padding: "24px", border: "1px solid #e9ecef", fontSize: "0.95rem", lineHeight: "1.7", color: "#333" }}
                    dangerouslySetInnerHTML={{
                      __html: improvementSummary
                        .replace(/### (.*?)$/gm, '<h4 style="color:#5D4037;font-size:1.1rem;font-weight:600;margin:20px 0 12px 0;padding-bottom:8px;border-bottom:2px solid #8D6E63;">$1</h4>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#5D4037;font-weight:600;">$1</strong>')
                        .replace(/^- (.*?)$/gm, '<div style="margin:8px 0;padding-left:16px;position:relative;"><span style="position:absolute;left:0;color:#5D4037;font-weight:bold;">•</span>$1</div>')
                        .replace(/\n/g, "<br>"),
                    }}
                  />
                ) : (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "40px", color: "#6c757d" }}>
                    <div style={{ width: "20px", height: "20px", border: "2px solid #5D4037", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 1s linear infinite", marginRight: "12px" }} />
                    Generating improvement recommendations...
                  </div>
                )}
              </div>

              <div style={{ textAlign: "center", marginTop: "32px" }}>
                <button
                  onClick={handleDownloadReport}
                  style={{ background: "linear-gradient(135deg, #5D4037, #3E2723)", color: "white", border: "none", borderRadius: "12px", padding: "16px 32px", fontSize: "1rem", fontWeight: "600", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "12px", boxShadow: "0 4px 16px rgba(93,64,55,0.3)", textTransform: "uppercase", letterSpacing: "0.5px" }}
                >
                  <Download size={20} />
                  Download Full Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export function Dashboard() {
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("Funders")
  const [showDashboardPopup, setShowDashboardPopup] = useState(false)
  const [applicationRefreshKey, setApplicationRefreshKey] = useState(0)
  const [currentDashboardStep, setCurrentDashboardStep] = useState(0)
  const [authChecked, setAuthChecked] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState("bigscore") // New state for tab management

  // Score states for BIG Score calculation - Added leadershipScore
  const [complianceScore, setComplianceScore] = useState(0)
  const [legitimacyScore, setLegitimacyScore] = useState(0)
  const [leadershipScore, setLeadershipScore] = useState(0) // New state
  const [fundabilityScore, setFundabilityScore] = useState(0)
  const [pisScore, setPisScore] = useState(0)
  // Add these state variables after existing state declarations in Dashboard component
const [companyOwnerId, setCompanyOwnerId] = useState(null);
const [isCompanyMember, setIsCompanyMember] = useState(false);
const [effectiveUserId, setEffectiveUserId] = useState(null);
const [userRole, setUserRole] = useState(null);

  const apiKey = API_KEYS.OPENAI
  console.log(apiKey)
  const user = auth.currentUser
  const userName = user ? user.email : "User"

  const dashboardSteps = [
    {
      title: "Welcome to Your Dashboard",
      content:
        "This is your central hub for tracking applications, viewing matches, and monitoring your business metrics.",
      icon: "🏠",
    },
    {
      title: "Application Tracker",
      content:
        "Track the status of all your applications in one place. See which stage each application is in and what's next.",
      icon: "📊",
    },
    {
      title: "Business Metrics",
      content:
        "Monitor your BIG Score components: Compliance, Legitimacy, Leadership, Fundability, PIS Score and overall BIG Score to understand how your business is perceived.",
      icon: "📈",
    },
    {
      title: "Customer Reviews",
      content: "See what customers are saying about your business and track your reputation in the marketplace.",
      icon: "📅",
    },
  ]

  const styles = {
    primaryBrown: "#5D4037",
    lightBrown: "#8D6E63",
    darkBrown: "#3E2723",
    accentBrown: "#A67C52",
    paleBrown: "#D7CCC8",
    backgroundBrown: "#EFEBE9",
  }

  // Add/remove body class to prevent scrolling when modal is open
  useEffect(() => {
    if (showDashboardPopup) {
      document.body.classList.add('modal-open');
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.classList.remove('modal-open');
      document.body.style.position = '';
      document.body.style.width = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [showDashboardPopup]);

  const getUserSpecificKey = (baseKey) => {
    const userId = auth.currentUser?.uid
    return userId ? `${baseKey}_${userId}` : baseKey
  }
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        setIsAuthenticated(true);
        
        // Check if user is part of a company
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const userCompanyId = userData.companyId;
          const userCompanyRole = userData.userRole;
          
          if (userCompanyId) {
            // User is part of a company, fetch company details
            const companyDocRef = doc(db, "companies", userCompanyId);
            const companyDocSnap = await getDoc(companyDocRef);
            
            if (companyDocSnap.exists()) {
              const companyData = companyDocSnap.data();
              const ownerId = companyData.createdBy;
              
              // Set user role
              setUserRole(userCompanyRole || 'viewer');
              
              // Check if current user is the owner
              if (ownerId === user.uid) {
                // Current user is the owner
                setIsCompanyMember(false);
                setEffectiveUserId(user.uid);
              } else {
                // Current user is a member, use owner's ID for data
                setIsCompanyMember(true);
                setCompanyOwnerId(ownerId);
                setEffectiveUserId(ownerId);
              }
            }
          } else {
            // No company, use current user as owner
            setIsCompanyMember(false);
            setEffectiveUserId(user.uid);
            setUserRole('owner');
          }
        }
      } catch (error) {
        console.error("Error checking company membership:", error);
        setEffectiveUserId(user.uid);
        setUserRole('owner');
      }
    }
    setAuthChecked(true);
  });

  return () => unsubscribe();
}, []);

 useEffect(() => {
  if (!isAuthenticated || !effectiveUserId) return;

  const fetchProfileData = async () => {
    try {
      const userId = effectiveUserId; // Use effectiveUserId instead of current user

      const docRef = doc(db, "universalProfiles", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setProfileData({ id: userId, formData: docSnap.data() });
      } else {
        console.error("No profile found");
      }

      const hasSeenDashboardPopup = localStorage.getItem(getUserSpecificKey("hasSeenDashboardPopup")) === "true";
      if (!hasSeenDashboardPopup) {
        setShowDashboardPopup(true);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error fetching profile data:", err);
      setLoading(false);
    }
  };

  fetchProfileData();
}, [isAuthenticated, effectiveUserId]);


  const handleNextDashboardStep = () => {
    if (currentDashboardStep < dashboardSteps.length - 1) {
      setCurrentDashboardStep(currentDashboardStep + 1)
    } else {
      handleCloseDashboardPopup()
    }
  }

  const handleCloseDashboardPopup = () => {
    setShowDashboardPopup(false)
    localStorage.setItem(getUserSpecificKey("hasSeenDashboardPopup"), "true")
  }

  const handleApplicationSubmitted = () => {
    setApplicationRefreshKey((prev) => prev + 1)
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading dashboard...</div>
  }

  return (
    <div className="dashboard-container bg-[#EFEBE9]">
   

      {showDashboardPopup && (
        <div className="popup-overlay">
          <div className="welcome-popup dashboard-popup">
            <button className="close-popup" onClick={handleCloseDashboardPopup}>
              <X size={24} />
            </button>
            <div className="popup-content">
              <div className="popup-icon">{dashboardSteps[currentDashboardStep].icon}</div>
              <h2>{dashboardSteps[currentDashboardStep].title}</h2>
              <p>{dashboardSteps[currentDashboardStep].content}</p>
              <div className="popup-progress">
                {dashboardSteps.map((_, index) => (
                  <div key={index} className={`progress-dot ${index === currentDashboardStep ? "active" : ""}`} />
                ))}
              </div>
              <div className="popup-buttons">
                <button className="btn btn-secondary" onClick={handleCloseDashboardPopup}>Close</button>
                {currentDashboardStep < dashboardSteps.length - 1 ? (
                  <button className="btn btn-primary" onClick={handleNextDashboardStep}>
                    Next <ChevronRight size={16} />
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={handleCloseDashboardPopup}>Get Started</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="content">
        <main className="dashboard-main">
          <DashboardHeader userName={userName} />
   {isCompanyMember && (
  <div style={{
    backgroundColor: userRole === 'viewer' ? '#fef3c7' : '#e0f2fe',
    border: `2px solid ${userRole === 'viewer' ? '#f59e0b' : '#0369a1'}`,
    borderRadius: '12px',
    padding: '16px 24px',
    marginBottom: '24px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
  }}>
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '12px', 
      marginBottom: '8px' 
    }}>
      <Bus size={24} color={userRole === 'viewer' ? '#f59e0b' : '#0369a1'} />
      <h3 style={{ 
        margin: 0, 
        color: userRole === 'viewer' ? '#f59e0b' : '#0369a1', 
        fontWeight: '700',
        fontSize: '1.1rem'
      }}>
        Company Member Dashboard - Role: {userRole?.toUpperCase()}
      </h3>
    </div>
    <p style={{ 
      margin: 0, 
      color: '#4a5568', 
      fontSize: '0.95rem',
      lineHeight: '1.5'
    }}>
      {userRole === 'owner' && 'You have full access to all company data and metrics.'}
      {userRole === 'admin' && 'You can view and manage most company metrics and applications.'}
      {userRole === 'manager' && 'You can view company metrics and manage team activities.'}
      {userRole === 'employee' && 'You can view company metrics and track applications.'}
      {userRole === 'viewer' && 'You have read-only access to company metrics and data.'}
    </p>
  </div>
)}
          {/* Tab Navigation */}
          <section className="tab-navigation" style={{ marginTop: '40px', marginBottom: '30px' }}>
            <div style={{
              display: 'flex',
              gap: '0',
              background: '#ffffff',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e8ddd6'
            }}>
              <button
                onClick={() => setActiveTab("bigscore")}
                style={{
                  flex: 1,
                  padding: '18px 24px',
                  background: activeTab === "bigscore" ? styles.primaryBrown : '#ffffff',
                  color: activeTab === "bigscore" ? '#ffffff' : styles.primaryBrown,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  borderRight: '1px solid #e8ddd6'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== "bigscore") {
                    e.target.style.background = '#f5f2f0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== "bigscore") {
                    e.target.style.background = '#ffffff';
                  }
                }}
              >
                BIG Score
              </button>
              <button
                onClick={() => setActiveTab("tools")}
                style={{
                  flex: 1,
                  padding: '18px 24px',
                  background: activeTab === "tools" ? styles.primaryBrown : '#ffffff',
                  color: activeTab === "tools" ? '#ffffff' : styles.primaryBrown,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== "tools") {
                    e.target.style.background = '#f5f2f0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== "tools") {
                    e.target.style.background = '#ffffff';
                  }
                }}
              >
            Improve My BIG Score
              </button>
            </div>
          </section>

          {/* Conditional Content Based on Active Tab */}
          {activeTab === "bigscore" ? (
            <>
              {/* Top Row - Application Tracker (full width) */}
              <section className="tracker-section" style={{ marginBottom: '20px' }}>
               <ApplicationTracker styles={styles} userId={effectiveUserId} />

              </section>

              {/* Row 1 - BIG Score, Customer Reviews, and wider Summary Report */}
              <section className="big-score-reviews-row" style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1.5fr',
                gap: '20px',
                marginBottom: '20px'
              }}>
                <BigScoreCard
                  styles={styles}
                  profileData={profileData}
                  complianceScore={complianceScore}
                  legitimacyScore={legitimacyScore}
                  leadershipScore={leadershipScore}
                  fundabilityScore={fundabilityScore}
                  pisScore={pisScore}
                  onScoreUpdate={score => console.log("Updated BIG Score:", score)}
                  setActiveTab={setActiveTab}
                />

                <CustomerReviewsCard styles={styles} />

                {apiKey && (
                  <SummaryReportCard
                    styles={styles}
                     userId={effectiveUserId}
                    apiKey={apiKey}
                  />
                )}
                {!apiKey && (
                  <section className="individual-scores-row" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '20px',
                    marginBottom: '20px'
                  }}>

                    <div style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #faf8f6 100%)',
                      borderRadius: '20px',
                      padding: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '200px',
                      border: '1px solid #e8ddd6'
                    }}>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        color: '#8d6e63'
                      }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          border: '3px solid #d7ccc8',
                          borderTop: '3px solid #8d6e63',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></div>
                        <span style={{ fontSize: '12px', fontWeight: '500' }}>Loading...</span>
                      </div>
                    </div>

                  </section>
                )}
              </section>

              {apiKey && (
                <section className="individual-scores-row" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '20px',
                  marginBottom: '20px'
                }}>
                <ComplianceScoreCard
  styles={styles}
  profileData={profileData?.formData}
  onScoreUpdate={setComplianceScore}
  apiKey={apiKey}
  userId={effectiveUserId} // Add this prop
/>

<LegitimacyScoreCard
  styles={styles}
  profileData={profileData?.formData}
  onScoreUpdate={setLegitimacyScore}
  apiKey={apiKey}
  userId={effectiveUserId} // Add this prop
/>

<LeadershipScoreCard
  styles={styles}
  profileData={profileData?.formData}
  onScoreUpdate={setLeadershipScore}
  apiKey={apiKey}
  userId={effectiveUserId} // Add this prop
/>

<PISScoreCard
  styles={styles}
  profileData={profileData?.formData}
  onScoreUpdate={setPisScore}
  apiKey={apiKey}
  userId={effectiveUserId} // Add this prop
/>

<FundabilityScoreCard
  profileData={profileData?.formData}
  userId={effectiveUserId} // Changed from profileData?.id
  onScoreUpdate={setFundabilityScore}
  apiKey={apiKey}
/>
                </section>
              )}

              {/* Loading indicator while API key is being fetched */}
              {!apiKey && (
                <section className="individual-scores-row" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '20px',
                  marginBottom: '20px'
                }}>
                  {[...Array(5)].map((_, index) => (
                    <div key={index} style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #faf8f6 100%)',
                      borderRadius: '20px',
                      padding: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '200px',
                      border: '1px solid #e8ddd6'
                    }}>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        color: '#8d6e63'
                      }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          border: '3px solid #d7ccc8',
                          borderTop: '3px solid #8d6e63',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></div>
                        <span style={{ fontSize: '12px', fontWeight: '500' }}>Loading...</span>
                      </div>
                    </div>
                  ))}
                </section>
              )}
            </>
          ) : (
            // Tools & Templates Tab Content
            <section className="tools-section">
              <ShopToolsPage />
            </section>
          )}
        </main>
      </div>

      {/* Additional CSS for responsive design - UPDATED for 5 cards */}
      <style jsx>{`
        /* Prevent body scroll when modal is open */
        body.modal-open {
          overflow: hidden;
          position: fixed;
          width: 100%;
        }

        /* Summary Report Card Specific Styles */
        .summary-report-card {
          min-height: 400px;
        }

        /* Enhanced z-index and interaction handling */
        .score-card-wrapper {
          transition: transform 0.2s ease;
          position: relative;
          z-index: 1;
          isolation: isolate;
        }
        .priority-card {
  position: relative;
}

.priority-card:hover .tooltip-content {
  opacity: 1;
  visibility: visible;
  transform: translateY(0px);
  z-index: 99;
}
.tooltip-content {
  position: absolute;
  bottom: 120%;
  left: 50%;
  transform: translateX(-50%);
  background-color: #3E2723;
  color: #EFEBE9;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.75rem;
  max-width: 240px;
  width: max-content;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
  white-space: normal;
  line-height: 1.4;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.25s ease, transform 0.25s ease;
  z-index: 1000;
}

.priority-card:hover .tooltip-content {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(-6px);
}


        .score-card-wrapper:hover {
          transform: translateY(-2px);
          z-index: 50;
        }

        /* Ensure buttons are always clickable with higher specificity */
        .score-card-wrapper .fun-button,
        .score-card-wrapper button,
        .score-card-wrapper .text-center {
          position: relative;
          z-index: 999 !important;
          pointer-events: auto !important;
        }

        /* Enhanced tooltip positioning and interaction */
        .score-tooltip {
          animation: fadeInUp 0.3s ease;
          z-index: 100 !important;
          pointer-events: none !important;
          user-select: none;
        }

        /* Prevent tooltip from interfering with buttons */
        .score-card-wrapper .fun-button:hover ~ .score-tooltip,
        .score-card-wrapper button:hover ~ .score-tooltip,
        .score-card-wrapper .text-center:hover ~ .score-tooltip {
          display: none !important;
        }

        .explanation-card {
          transition: all 0.3s ease;
          position: relative;
          z-index: 1;
        }

        .explanation-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(141, 110, 99, 0.3) !important;
          z-index: 2;
        }

        /* Modal improvements */
        .modal-overlay {
          z-index: 9999;
          backdrop-filter: blur(4px);
        }

        .modal-content {
          z-index: 10000;
        }

        /* Spinning animation for loading indicator */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes fadeInUp {
          from { 
            opacity: 0; 
            transform: translateX(-50%) translateY(10px); 
          }
          to { 
            opacity: 1; 
            transform: translateX(-50%) translateY(0); 
          }
        }

        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .modal-content {
          animation: modalFadeIn 0.4s ease-out;
        }

        @media (max-width: 1400px) {
          .individual-scores-row {
            grid-template-columns: repeat(3, 1fr) !important; /* 3 columns on smaller desktops */
          }
        }

        @media (max-width: 1200px) {
          .big-score-reviews-row {
            grid-template-columns: 1fr 2fr !important; /* Stack BIG Score and Customer Reviews, keep Summary Report wider */
          }
          
          .individual-scores-row {
            grid-template-columns: repeat(3, 1fr) !important; /* 3 columns on tablets */
          }
        }

        @media (max-width: 1024px) {
          .big-score-reviews-row {
            grid-template-columns: repeat(2, 1fr) !important; /* Two columns on tablets */
          }
          
          .summary-report-card {
            grid-column: 1 / -1; /* Summary Report spans full width on tablets */
          }
          
          .individual-scores-row {
            grid-template-columns: repeat(2, 1fr) !important; /* 2 columns on smaller tablets */
          }

          .explanation-card {
            padding: 20px !important;
          }

          .explanation-title {
            font-size: 1.1rem !important;
          }

          .explanation-text {
            font-size: 0.9rem !important;
          }
        }
        
        @media (max-width: 768px) {
          .big-score-reviews-row,
          .individual-scores-row {
            grid-template-columns: 1fr !important; /* Single column on mobile */
          }

          .summary-report-card {
            grid-column: 1;
            min-height: 350px;
          }

          .score-tooltip {
            width: 280px !important;
            font-size: 11px !important;
            padding: 12px 14px !important;
            max-height: 250px !important;
          }

          .explanation-card {
            padding: 18px !important;
          }

          .explanation-title {
            font-size: 1rem !important;
          }

          .explanation-text {
            font-size: 0.85rem !important;
          }

          .view-more-btn {
            padding: 10px 16px !important;
            font-size: 0.8rem !important;
          }

          /* Modal adjustments for mobile */
          .modal-content {
            max-width: 95vw !important;
            max-height: 95vh !important;
            padding: 20px !important;
          }
        }

        @media (max-width: 480px) {
          .summary-report-card {
            padding: 18px !important;
            min-height: 320px;
          }

          .summary-report-card h3 {
            font-size: 1.1rem !important;
          }

          .score-tooltip {
            width: 250px !important;
            font-size: 10px !important;
            padding: 10px 12px !important;
            max-height: 200px !important;
          }

          .explanation-card {
            padding: 16px !important;
          }

          .explanation-title {
            font-size: 0.95rem !important;
          }

          .explanation-text {
            font-size: 0.8rem !important;
          }

          .modal-content {
            padding: 16px !important;
          }

          .modal-content h2 {
            font-size: 1.4rem !important;
          }

          .modal-content h3 {
            font-size: 1.1rem !important;
          }
        }
      `}</style>
    </div>
  )
}
