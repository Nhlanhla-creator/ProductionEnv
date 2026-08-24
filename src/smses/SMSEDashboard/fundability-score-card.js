"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { ChevronDown, AlertCircle, DollarSign, RefreshCw } from "lucide-react";
import { db, auth } from "../../firebaseConfig";
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useFirebaseFunctions } from "./hooks";
import { useSolvencyScore } from "../hooks/useSolvencyScore";
import { normalizeSolvencyScore } from "../MyGrowthTools/financial/data_utils/solvencyScoreUtils";
import { buildCapitalAppealAssessment, fmtPts } from "./fundability-potential";
import { buildDocumentFindings } from "./document-findings";
import ScoreExplorer from "./ScoreExplorer";

// ─────────────────────────────────────────────────────────────────────────
// CAPITAL APPEAL
//
// WHAT CHANGED IN THIS PASS — NAVIGATION, NOT ARITHMETIC
//
//   The scoring is untouched. buildCapitalAppealAssessment still produces
//   every number in code and the AI still never writes one.
//
//   What changed is that the modal no longer shows everything at once.
//   Four accordions could all be open together — about, potential points,
//   score breakdown, and a single scrolling slab of AI narrative — so the
//   first thing a business saw was roughly two thousand words. The order
//   was also arbitrary.
//
//   It is now a navigation stack, in a fixed order:
//
//     1. About this score   → 1.1 definition · 1.2 assessment areas
//                             1.3 interpretation · 1.4 weighting
//     2. Your score         → block → element → 2.1 breakdown
//                                               2.2 analysis
//                                               2.3 improvements
//     3. Potential points   → item detail
//
//   Every element carries those three as buttons with a pop-out preview,
//   so a quick look does not cost a navigation. Everything below Home has
//   a back arrow and a breadcrumb.
//
//   The AI prompt now emits ONE SECTION PER ELEMENT (twelve, not seven)
//   with a fixed heading, so parseAnalysisByElement can route each section
//   to the element it describes. That is what makes tab 2.2 possible: the
//   narrative is no longer a document, it is twelve short findings filed
//   against the twelve things they describe.
//
// Category 5 of 5 in the taxonomy:
//   1. Compliance  2. Legitimacy  3. Leadership & Governance
//   4. Operational Strength  5. Capital Appeal (this file)
// ─────────────────────────────────────────────────────────────────────────

const GRANT_KEYWORDS = ["grant", "grants"];
const DEBT_KEYWORDS = ["debt", "loan"];
const PO_KEYWORDS = ["purchase_order", "purchaseorder", "po", "supply_chain", "supplychain"];
const EQUITY_KEYWORDS = [
  "equity", "convertible", "hybrid", "revenue-based", "revenue_based",
  "secondary", "special",
];
const ESD_FUNDER_KEYWORDS = [
  "grant / non-profit", "grant/non-profit", "development_finance",
  "development finance", "incubator",
];

function detectFundingTier(profileData) {
  const instruments = (profileData?.useOfFunds?.fundingInstruments || [])
    .map((s) => s.toLowerCase().replace(/[\s-]/g, "_"));
  const funderTypes = (profileData?.useOfFunds?.funderTypes || []).map((s) => s.toLowerCase());
  const supportFocus = profileData?.useOfFunds?.additionalSupportFocus || "";
  const amountStr = profileData?.useOfFunds?.amountRequested || "";
  const amountNum = parseInt(amountStr.replace(/[^\d]/g, ""), 10) || 0;

  const hasPO = instruments.some((i) => PO_KEYWORDS.some((k) => i.includes(k)));
  const hasDebt = instruments.some((i) => DEBT_KEYWORDS.some((k) => i.includes(k)));
  const hasGrant = instruments.some((i) => GRANT_KEYWORDS.some((k) => i.includes(k)));
  const hasEquity = instruments.some((i) => EQUITY_KEYWORDS.some((k) => i.includes(k)));
  const hasESDFunder = funderTypes.some((f) => ESD_FUNDER_KEYWORDS.some((k) => f.includes(k)));
  const hasSupportFocus = !!supportFocus;
  const isLargeAmount = amountNum > 10_000_000;

  if (!instruments.length && !hasSupportFocus) return null;

  if (hasEquity || isLargeAmount) return "D";
  if (hasPO || hasDebt) return "B";
  if (hasESDFunder || hasSupportFocus) return "C";
  if (hasGrant || instruments.length > 0) return "A";
  return null;
}

const TIER_LABELS = {
  A: "Grant",
  B: "Purchase Order / Debt",
  C: "ESD / Support Programme / Accelerator",
  D: "Full Fundability (Serious Funding)",
};

const TIER_BADGE_COLORS = {
  A: { bg: "#e8f5e9", border: "#4CAF50", text: "#1B5E20" },
  B: { bg: "#e3f2fd", border: "#1976d2", text: "#0d47a1" },
  C: { bg: "#fff8e1", border: "#f9a825", text: "#e65100" },
  D: { bg: "#fce4ec", border: "#c62828", text: "#b71c1c" },
};

function getFundabilitySubWeights(tier) {
  if (!tier) return null;
  switch (tier) {
    case "A":
      return {
        businessPlan: 21, pitchDeck: 17, impactMandate: 34, creditworthiness: 13,
        guarantees: 0, financialResilience: 0, growthPotential: 15,
        _excluded: {
          guarantees: "Non-repayable funding — collateral security is not required.",
          financialResilience: "Financial resilience metrics are not assessed at grant level.",
        },
        _reduced: {
          creditworthiness: "Reduced weight — credit discipline is noted but is not a primary grant criterion.",
        },
      };
    case "B":
      return {
        businessPlan: 18, pitchDeck: 9, impactMandate: 9, creditworthiness: 27,
        guarantees: 27, financialResilience: 0, growthPotential: 10,
        _excluded: {
          financialResilience: "Underwriting-grade resilience metrics are reserved for tickets above R10m.",
        },
        _reduced: {
          pitchDeck: "Reduced — pitch readiness is secondary to credit strength and collateral for PO/debt finance.",
          impactMandate: "Reduced — social impact is a secondary consideration for purchase-order or debt finance.",
        },
      };
    case "C":
      return {
        businessPlan: 21, pitchDeck: 17, impactMandate: 34, creditworthiness: 13,
        guarantees: 0, financialResilience: 0, growthPotential: 15,
        _excluded: {
          guarantees: "ESD / support programmes do not require collateral from applicants.",
          financialResilience: "Financial resilience is not assessed for accelerator or ESD programmes.",
        },
        _reduced: {
          creditworthiness: "Reduced — some ESD programmes note credit history but it is not a primary requirement.",
        },
      };
    case "D":
      return {
        businessPlan: 18, pitchDeck: 9, impactMandate: 9, creditworthiness: 23,
        guarantees: 13, financialResilience: 18, growthPotential: 10,
        _excluded: {},
        _reduced: {
          pitchDeck: "Reduced — investor communications matter but fundamentals dominate at serious ticket sizes.",
          impactMandate: "Reduced — ESG / impact is a qualifier, not the primary investment criterion.",
        },
      };
    default:
      return null;
  }
}

const mapStageToCategory = (stage) => {
  const s = (stage || "").toLowerCase();
  if (["pre-seed", "preseed"].includes(s)) return "pre-seed";
  if (["seed"].includes(s)) return "seed";
  if (["series a", "seriesa"].includes(s)) return "seriesa";
  if (["series b", "seriesb"].includes(s)) return "seriesb";
  if (["early-growth", "growth", "scale-up"].includes(s)) return "growth";
  return "maturity";
};

const weightingsByStage = {
  "pre-seed": { financialStrength: 42, impactMandate: 58 },
  seed: { financialStrength: 54, impactMandate: 46 },
  seriesa: { financialStrength: 64, impactMandate: 36 },
  seriesb: { financialStrength: 73, impactMandate: 27 },
  growth: { financialStrength: 81, impactMandate: 19 },
  maturity: { financialStrength: 88, impactMandate: 12 },
};

const FUNDING_SECTION_LABELS = {
  applicationOverview: "Application Overview",
  useOfFunds: "Use of Funds",
  enterpriseReadiness: "Enterprise Readiness",
  guarantees: "Guarantees",
  growthPotential: "Growth Potential",
  socialImpact: "Social Impact",
  documentUpload: "Document Upload",
  declarationCommitment: "Declaration & Commitment",
};
const REQUIRED_FUNDING_SECTIONS = Object.keys(FUNDING_SECTION_LABELS);
const FUNDING_ROUTE = "/applications/funding";

// What each element is for, in one line. Used by About → 1.2 Assessment
// areas, which is a map of the assessment rather than a second copy of it.
const ELEMENT_PURPOSE = {
  revenueProfitability: "Whether the business earns money and keeps some of it — the first thing every funder looks at.",
  records: "Whether the numbers are auditable. Unverified figures are treated as claims, not facts.",
  balanceSheet: "What the business owns against what it owes, and whether it can meet the next twelve months.",
  debt: "Existing obligations and how well they are being serviced. New debt sits behind old debt.",
  credit: "The external credit record — the one number a lender can check without asking you.",
  businessPlan: "Whether there is a costed, coherent plan for the money.",
  pitchDeck: "Whether the case can be communicated to an investment committee.",
  impactMandate: "Whether the business fits the mandate the money comes with — jobs, ownership, sector, geography.",
  creditworthiness: "Repayment capacity as evidenced by the credit report on file.",
  guarantees: "Security available if the plan does not work: instruments, whether signed, whether current, and what they are worth.",
  financialResilience: "Whether the business survives a bad year — the underwriting view at serious ticket sizes.",
  growthPotential: "Whether the capital compounds or is simply consumed.",
};

const INTERPRETATION = [
  { range: "91–100%", label: "Highly fundable", color: "#1B5E20", meaning: "Fundable as presented. Diligence confirms rather than discovers." },
  { range: "81–90%", label: "Strong investment case", color: "#4CAF50", meaning: "A funder engages. Expect questions on one or two areas, not a rebuild." },
  { range: "61–80%", label: "Moderate potential", color: "#FF9800", meaning: "Credible but incomplete. Most declines at this level are about evidence, not the business." },
  { range: "41–60%", label: "Basic potential", color: "#F44336", meaning: "The shape of a case exists. Non-bank and development routes are more realistic than commercial credit." },
  { range: "0–40%", label: "Needs development", color: "#B71C1C", meaning: "Not yet a fundable file. Build the record before approaching capital." },
];

// ═════════════════════════════════════════════════════════════════════════
// AI narrative → per-element findings
//
// The prompt emits "### 4. Balance Sheet" and inside it a fixed set of
// bold labels. This splits that into a map keyed on a normalised label, so
// each element's Analysis tab shows only its own finding.
// ═════════════════════════════════════════════════════════════════════════

const normLabel = (s) =>
  String(s || "").toLowerCase().replace(/^\s*\d+[.)]\s*/, "").replace(/[^a-z0-9]/g, "");

const FIELD_PATTERNS = [
  ["evidence", /\*\*Evidence:\*\*/i],
  ["withheld", /\*\*Points withheld:\*\*/i],
  ["rationale", /\*\*Rationale:\*\*/i],
  ["available", /\*\*Points available:\*\*/i],
  ["why", /\*\*Why:\*\*/i],
  ["impact", /\*\*Impact on your score:\*\*/i],
];

function parseFields(body) {
  const out = { raw: body.trim() };
  const marks = [];
  FIELD_PATTERNS.forEach(([key, re]) => {
    const m = body.match(re);
    if (m) marks.push({ key, start: m.index, end: m.index + m[0].length });
  });
  marks.sort((a, b) => a.start - b.start);
  marks.forEach((mk, i) => {
    const stop = i + 1 < marks.length ? marks[i + 1].start : body.length;
    out[mk.key] = body.slice(mk.end, stop).replace(/\*\*/g, "").trim();
  });
  return out;
}

export function parseAnalysisByElement(text) {
  const map = {};
  let overall = null;
  if (!text) return { map, overall };

  String(text)
    .split(/(?=^###\s)/m)
    .forEach((chunk) => {
      const t = chunk.trim();
      if (!t.startsWith("###")) return;
      const headingEnd = t.indexOf("\n");
      const heading = t.slice(3, headingEnd === -1 ? undefined : headingEnd).replace(/\*\*/g, "").trim();
      const body = headingEnd === -1 ? "" : t.slice(headingEnd + 1);
      const key = normLabel(heading);
      if (key.includes("overall")) {
        const f = parseFields(body);
        const grab = (re) => {
          const m = body.match(re);
          return m ? m[1].replace(/\*\*/g, "").trim() : null;
        };
        overall = {
          strongest: grab(/\*\*Strongest section:\*\*\s*(.+)/i),
          weakest: grab(/\*\*Weakest section:\*\*\s*(.+)/i),
          nextStep: grab(/\*\*Highest-value next step:\*\*\s*(.+)/i),
          final: grab(/\*\*Final analysis:\*\*\s*([\s\S]+)/i),
          raw: f.raw,
        };
        return;
      }
      map[key] = parseFields(body);
    });

  return { map, overall };
}

// ═════════════════════════════════════════════════════════════════════════

export function FundabilityScoreCard({ styles = {}, profileData, onScoreUpdate, apiKey, onNavigate }) {
  const [showModal, setShowModal] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [fundabilityScore, setFundabilityScore] = useState(0);

  const [aiEvaluationResult, setAiEvaluationResult] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState("");
  const [evaluationTimestamp, setEvaluationTimestamp] = useState(null);

  const [businessPlanAnalysis, setBusinessPlanAnalysis] = useState(null);
  const [pitchDeckAnalysis, setPitchDeckAnalysis] = useState(null);
  const [creditReportAnalysis, setCreditReportAnalysis] = useState(null);
  const [guaranteesAnalysis, setGuaranteesAnalysis] = useState(null);
  const [solvencyAnalysis, setSolvencyAnalysis] = useState(null);
  const [financialStatementsAnalysis, setFinancialStatementsAnalysis] = useState(null);
  const [isFundingDataLoaded, setIsFundingDataLoaded] = useState(false);

  const [hasAppliedForFunding, setHasAppliedForFunding] = useState(false);
  const [fundingTier, setFundingTier] = useState(null);
  const [fundingCheckComplete, setFundingCheckComplete] = useState(false);
  const [missingFundingSections, setMissingFundingSections] = useState([]);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);

  const dataLoadPromiseRef = useRef(null);
  const fundingCheckCompleteRef = useRef(false);
  const isEvaluatingRef = useRef(false);
  const isSavingEvaluation = useRef(false);
  const profileDataRef = useRef(profileData);
  const runAiEvaluationRef = useRef(null);

  const { loadLatestSolvencyScore } = useSolvencyScore(auth?.currentUser);
  const { callFunction } = useFirebaseFunctions();

  useEffect(() => { setFundingTier(detectFundingTier(profileData)); }, [profileData]);
  useEffect(() => { isEvaluatingRef.current = isEvaluating; });
  useEffect(() => { profileDataRef.current = profileData; });

  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [showModal]);

  const goTo = (route) => {
    if (!route) return;
    if (onNavigate) onNavigate(route);
    else window.location.assign(route);
  };

  // ── Load the document-backed analyses (unchanged) ──
  const fetchFundingApplicationData = useCallback(async () => {
    if (dataLoadPromiseRef.current) return dataLoadPromiseRef.current;

    const loadPromise = (async () => {
      const userId = auth.currentUser.uid;
      const fresh = {
        businessPlanAnalysis: null, pitchDeckAnalysis: null, creditReportAnalysis: null,
        guaranteesAnalysis: null, solvencyAnalysis: null, financialStatementsAnalysis: null,
      };

      try {
        const snap = await getDoc(doc(db, "aiFinancialEvaluations", userId));
        if (snap.exists()) {
          const d = snap.data();
          const ev = d?.evaluation || {};
          fresh.financialStatementsAnalysis = {
            breakdown: ev.breakdown || {},
            overallScore: ev.overallScore ?? null,
            resilienceScore: ev.resilienceScore ?? null,
            summary: ev.summary || "",
            content: ev.content || "",
            files: d.files || ev.files || [],
            modelVersion: ev.modelVersion || d.modelVersion || "",
            evaluatedAt: ev.evaluatedAt || d.createdAt || "",
            operationStage: ev.operationStage || d.operationStage || "",
          };
          setFinancialStatementsAnalysis(fresh.financialStatementsAnalysis);
        }
      } catch (e) { console.error("Financial statements load error:", e); }

      try {
        const snap = await getDocs(query(collection(db, "aiEvaluations"), where("userId", "==", userId)));
        if (!snap.empty) {
          const d = snap.docs[0].data();
          const content = d?.evaluation?.content || "";
          const score = Math.round(d?.evaluation?.score || 0);
          fresh.businessPlanAnalysis = { score, content, isValid: score > 0 && content.trim().length > 0 };
          setBusinessPlanAnalysis(fresh.businessPlanAnalysis);
        }
      } catch (e) { console.error("BP load error:", e); }

      try {
        const snap = await getDocs(query(collection(db, "aiPitchEvaluations"), where("userId", "==", userId)));
        if (!snap.empty) {
          const d = snap.docs[0].data();
          const content = d?.evaluation?.content || "";
          const score = d?.evaluation?.score || 0;
          fresh.pitchDeckAnalysis = {
            score, operationalScore: d?.evaluation?.operationalScore || 0, content,
            isValid: score > 0 && content.trim().length > 0,
          };
          setPitchDeckAnalysis(fresh.pitchDeckAnalysis);
        }
      } catch (e) { console.error("PD load error:", e); }

      try {
        const snap = await getDocs(query(collection(db, "creditAnalyses"), where("userId", "==", userId)));
        if (!snap.empty) {
          const d = snap.docs[0].data();
          const ar = d?.evaluation?.analysisResult || {};
          const content = d?.evaluation?.content || "";
          const score = ar.creditScore ?? d?.evaluation?.score ?? 0;
          const label = ar.creditRating ?? d?.evaluation?.label ?? "";
          const isCreditReport = ar.isCreditReport ?? d?.evaluation?.isCreditReport ?? d?.isCreditReport ?? false;
          fresh.creditReportAnalysis = {
            score, content, label, isCreditReport,
            // The reasoning was being thrown away. negativeItems is what a
            // lender actually reads — a recorded judgment, days beyond terms,
            // buyer concentration — and it is already a clean array on the doc.
            negativeItems: ar.negativeItems ?? d?.evaluation?.negativeItems ?? d?.negativeItems ?? [],
            positiveItems: ar.positiveItems ?? d?.evaluation?.positiveItems ?? d?.positiveItems ?? [],
            overallAssessment: ar.overallAssessment ?? d?.evaluation?.overallAssessment ?? d?.overallAssessment ?? "",
            isValid: isCreditReport === true && score > 0 && content.trim().length > 0,
          };
          setCreditReportAnalysis(fresh.creditReportAnalysis);
        }
      } catch (e) { console.error("CR load error:", e); }

      try {
        const profSnap = await getDoc(doc(db, "universalProfiles", userId));
        if (profSnap.exists()) {
          const securityInstruments = profSnap.data()?.guarantees?.securityInstruments || [];
          const active = securityInstruments.filter(
            (i) => i.instrument || i.instrumentOther || (i.files && i.files.length > 0)
          );
          fresh.guaranteesAnalysis = {
            activeCount: active.length,
            totalCount: securityInstruments.length,
            items: active.map((i) => i.instrument || i.instrumentOther || "Unnamed instrument"),
            signedCount: active.filter((i) => i.isSigned === "yes").length,
            currentCount: active.filter((i) => i.isCurrent === "yes").length,
            withValue: active.filter((i) => i.value && parseFloat(String(i.value).replace(/[^\d.]/g, "")) > 0).length,
          };
          setGuaranteesAnalysis(fresh.guaranteesAnalysis);
        }
      } catch (e) { console.error("Guarantees load error:", e); }

      try {
        const solvencyData = await loadLatestSolvencyScore();
        if (solvencyData?.rawMetrics) {
          const m = solvencyData.rawMetrics;
          const nav = parseFloat(m.nav) || 0;
          const equityRatio = parseFloat(m.equityRatio) || 0;
          const debtToEquity = parseFloat(m.debtToEquity) || 0;

          let navScore = nav > 100 ? 100 : nav > 50 ? 90 : nav > 10 ? 80 : nav > 1 ? 60 : nav > 0 ? nav * 50 : 0;
          let equityScore =
            equityRatio >= 70 ? 95 : equityRatio >= 60 ? 85 : equityRatio >= 50 ? 75
            : equityRatio >= 40 ? 55 : equityRatio >= 30 ? 35 : Math.max(0, equityRatio);
          const dev = Math.abs(debtToEquity - 1.0);
          let dteScore = dev <= 0.3 ? 90 : dev <= 0.6 ? 75 : dev <= 1.0 ? 55 : dev <= 1.5 ? 35 : Math.max(0, 100 - dev * 10);

          const score = Math.round(navScore * 0.4 + equityScore * 0.35 + dteScore * 0.25);
          fresh.solvencyAnalysis = {
            score,
            normalizedScore: normalizeSolvencyScore(score),
            nav, equityRatio, debtToEquity,
            debtToAssets: parseFloat(m.debtToAssets) || 0,
            interestCoverage: parseFloat(m.interestCoverage) || 0,
            isValid: score > 0,
          };
          setSolvencyAnalysis(fresh.solvencyAnalysis);
        }
      } catch (e) { console.error("Solvency load error:", e); }

      setIsFundingDataLoaded(true);
      return { isLoaded: true, ...fresh };
    })();

    dataLoadPromiseRef.current = loadPromise;
    try { return await loadPromise; }
    finally { dataLoadPromiseRef.current = null; }
  }, [auth?.currentUser?.uid]);

  const checkFundingApplicationStatus = useCallback(async () => {
    if (!auth?.currentUser?.uid || fundingCheckComplete) return;
    try {
      const snap = await getDoc(doc(db, "universalProfiles", auth.currentUser.uid));
      if (snap.exists()) {
        const data = snap.data();
        const completed = data.completedSections || {};
        const missing = REQUIRED_FUNDING_SECTIONS.filter((k) => completed[k] !== true);
        const submitted = data.applicationSubmitted === true;
        const applied = missing.length === 0 || submitted;

        setMissingFundingSections(missing);
        setApplicationSubmitted(submitted);
        setHasAppliedForFunding(applied);
        await fetchFundingApplicationData();
      } else {
        setIsFundingDataLoaded(true);
      }
    } catch (e) {
      console.error("Funding status check error:", e);
      setIsFundingDataLoaded(true);
    } finally {
      setFundingCheckComplete(true);
      fundingCheckCompleteRef.current = true;
    }
  }, [auth?.currentUser?.uid, fundingCheckComplete, fetchFundingApplicationData]);

  useEffect(() => {
    if (auth?.currentUser?.uid) checkFundingApplicationStatus();
  }, [auth?.currentUser?.uid, checkFundingApplicationStatus]);

  // ── Score — a pure function of the profile and the stored analyses ──
  useEffect(() => {
    if (!profileData || !fundingCheckComplete) return;
    try {
      const a = buildCapitalAppealAssessment({
        profileData,
        fundingTier,
        hasAppliedForFunding,
        subWeights: getFundabilitySubWeights(fundingTier),
        stageWeights: weightingsByStage[mapStageToCategory(profileData?.entityOverview?.operationStage)],
        businessPlanAnalysis,
        pitchDeckAnalysis,
        creditReportAnalysis,
        guaranteesAnalysis,
        solvencyAnalysis,
        financialStatementsAnalysis,
      });
      setAssessment(a);
      setFundabilityScore(a.totalScore);
      if (onScoreUpdate) onScoreUpdate(a.totalScore);
    } catch (e) {
      console.error("Capital appeal scoring error:", e);
    }
  }, [
    profileData, fundingTier, hasAppliedForFunding, fundingCheckComplete,
    businessPlanAnalysis, pitchDeckAnalysis, creditReportAnalysis,
    guaranteesAnalysis, solvencyAnalysis, financialStatementsAnalysis, isFundingDataLoaded,
  ]);

  // ═══════════════════════════════════════════════════════════════════════
  // PROMPT — one section per element
  //
  // Financial Strength used to arrive as a single section containing five
  // sub-categories, which meant the model wrote one paragraph covering
  // revenue, records, balance sheet, debt and credit together. There was
  // no way to show a business the finding for its balance sheet on its
  // own. Each sub-category is now its own section with its own heading,
  // matching the element list exactly.
  // ═══════════════════════════════════════════════════════════════════════
  const buildSections = (a) => {
    const sections = a.financialStrength.subCategories.map((sc) => ({
      title: sc.label,
      findingsKey: `financialStrength:${sc.key}`,
      block: "Financial Strength",
      weightLabel: `${sc.weight}% of Financial Strength, which is ${a.blockWeights.financialStrength}% of the final score`,
      percent: Math.round(sc.percent),
      items: sc.items,
      sourceNote: "Read from the fields on your Financial Overview, plus the credit report on file.",
    }));

    a.fundabilityComponents.forEach((c) => {
      sections.push({
        title: c.label,
        findingsKey: `fundability:${c.key}`,
        block: "Fundability",
        weightLabel: c.excluded
          ? `EXCLUDED at Tier ${fundingTier}`
          : `${c.weight}% of Fundability · ${c.effectiveWeight.toFixed(1)} of the final score`,
        percent: c.excluded ? null : Math.round(c.percent),
        items: c.items,
        excluded: c.excluded,
        exclusionNote: c.exclusionNote,
        reductionNote: c.reductionNote,
      });
    });

    return sections;
  };

  const buildPrompt = (a, docFindings = {}) => {
    const line = (i) =>
      `  - ${i.label}: ${
        i.state === "missing" ? "NOT CAPTURED" : i.withheld === 0 ? "COUNTED IN FULL" : `${i.earned}/${i.points} item points — ${i.withheld} withheld`
      }${i.evidence ? ` — on file: ${i.evidence}` : ""}${i.reason ? ` — ${i.reason}` : ""}${
        i.withheld > 0
          ? i.claimable
            ? ` — recoverable ${fmtPts(i.pointValue)} via ${i.section}`
            : ` — ${fmtPts(i.pointValue)} NOT RECOVERABLE by editing the profile`
          : ""
      }`;

    const sections = buildSections(a);

    const sectionData = sections
      .map((sec, idx) => {
        if (sec.excluded) {
          return `\n### ${idx + 1}. ${sec.title}\nSTATUS: EXCLUDED at Tier ${fundingTier} — ${sec.exclusionNote || "not assessed for this funding type"}\nThis carries no weight and is NOT a gap. Say so plainly and move on.`;
        }
        // Where a document evaluator has already scored this element, its own
        // findings go in too. Otherwise the narrative can only talk about
        // fields, and says "pitch deck: 18%, capture more" when the stored
        // analysis already explains exactly what is wrong with the deck.
        const f = docFindings[sec.findingsKey];
        const findingBlock = f
          ? `\nALREADY ASSESSED — findings from the ${f.docLabel || f.source} on file${f.headline ? ` (${f.headline})` : ""}:${
              f.summary ? `\n  Summary: ${f.summary}` : ""
            }${
              f.weakAreas?.length
                ? `\n  Weak areas:\n${f.weakAreas
                    .map((w) => `    - ${w.label}${w.score ? ` (${w.score})` : ""}${w.note ? ` — ${w.note}` : ""}`)
                    .join("\n")}`
                : ""
            }${
              f.improvements?.length
                ? `\n  That evaluation's priority improvements:\n${f.improvements
                    .map((i) => `    - ${i.title}: ${i.body}`)
                    .join("\n")}`
                : ""
            }\n  These are qualitative and carry NO point value. Reference them in Evidence and Rationale. Never list them under "Points available".`
          : "";

        return `\n### ${idx + 1}. ${sec.title}  [${sec.block}]\nSCORE: ${sec.percent}% · ${sec.weightLabel}${sec.reductionNote ? `\nREDUCED WEIGHT: ${sec.reductionNote}` : ""}${sec.sourceNote ? `\n${sec.sourceNote}` : ""}\n${(sec.items || []).map(line).join("\n")}${findingBlock}`;
      })
      .join("\n");

    const outputFormat = sections
      .map((sec, idx) => {
        if (sec.excluded) {
          return `### ${idx + 1}. ${sec.title}
**Why:** [one sentence, from the exclusion note above]
**Impact on your score:** None — this is not a gap and costs you nothing.`;
        }
        return `### ${idx + 1}. ${sec.title}
**Evidence:** [what was actually counted here — cite the values on file. 1–2 sentences.]
**Points withheld:** [one bullet per item with points withheld, as: - Item — reason — **+X.X%** via Section. Mark any NOT RECOVERABLE item as a fixed deduction instead. If none: "None — everything captured was counted in full."]
**Rationale:** [2 sentences on what this element tells a funder]
**Points available:** [one bullet per recoverable item, as: - Section: action — **+X.X%**. If none: "None — this element is complete."]`;
      })
      .join("\n\n");

    return `You are writing the capital appeal findings for a funding-readiness report.

EVERY NUMBER BELOW IS FINAL. You do not calculate, adjust or re-derive anything. Your job is to explain what was counted, what was withheld and why, and what to do next. Stating a different number is an error.

ONLY the data below exists. Do not invent or infer any figure that is not here. Where an item says NOT CAPTURED, treat it as unproven, never as a positive.

An item marked NOT RECOVERABLE must never appear under "Points available". Explain it under "Points withheld" as a fixed deduction that follows the underlying financial reality rather than the form.

A section marked EXCLUDED costs the business nothing at this tier and must never be described as a gap or a weakness.

WRITE ONE SECTION PER HEADING BELOW, WITH THE HEADING TEXT COPIED EXACTLY. Do not merge sections, do not skip sections, do not reorder them and do not add sections. Each heading is read on its own screen, so each section must stand alone and must be SHORT — a reader sees one at a time, not the set.

FINAL SCORE: ${a.totalScore}%
Recoverable in total: ${a.availablePoints}%${a.lockedPoints > 0 ? `\nFixed deductions that cannot be recovered by editing the profile: ${a.lockedPoints}%` : ""}
${a.fundingActive ? `Funding tier: ${fundingTier} — ${TIER_LABELS[fundingTier]}. Financial Strength ${a.blockWeights.financialStrength}%, Fundability ${a.blockWeights.fundability}%.` : `No funding application on file, so the score is Financial Strength only, weighted ${a.blockWeights.financialStrength}% for this business stage.`}

═══ SCORED DATA ═══
${sectionData}

${a.statements?.present ? `
═══ FINANCIAL STATEMENTS ON FILE ═══
The business uploaded financial statements and they were read and scored${a.statements.overallScore !== null ? ` (${a.statements.overallScore}/5 overall)` : ""}${a.statements.evaluatedAt ? ` on ${a.statements.evaluatedAt}` : ""}.
Findings from that analysis:
${a.statements.summary || "No written summary was stored."}
${a.statements.hasDiscrepancy ? "\nIMPORTANT: that analysis found figures in the statements that do not match the self-reported Financial Overview. Raise this under Records. Say plainly which way it cuts: the profile is what gets scored, so where the statements are stronger the business is under-scoring itself, and where they are weaker a funder will find the difference in due diligence. Do not adjust any score for it — flag it." : ""}` : `
═══ FINANCIAL STATEMENTS ═══
No financial statements have been read. Several items above are unbacked as a result; say so under Records.`}

RULES
- Where points were withheld on something that WAS captured, lead with that — it is more useful than listing blanks.
- Every recommendation must be an item above, must be marked recoverable, and must carry its exact value.
- Never invent an improvement that is not on the list — it cannot earn anything.
- Plain business English. Short sentences. No preamble, no closing summary inside a section.

OUTPUT FORMAT — follow exactly, including the bold labels and the section numbering:

${outputFormat}

### Overall Assessment
**Strongest section:** [name it and say in one line why it stands out to a funder]
**Weakest section:** [name it, excluding anything marked EXCLUDED, and say what it costs]
**Highest-value next step:** [the single top recoverable item, its section and exact value]
**Final analysis:** [short paragraph: where this business stands, and what the score becomes once the top three recoverable items are resolved]`;
  };

  // `fresh` wins when the loader beat state to it; otherwise state. Shared by
  // scoring and by the findings parser so the two never disagree.
  const pickAnalyses = (fresh) => {
    const pick = (key, stateValue) => (fresh && key in fresh ? fresh[key] : stateValue);
    return {
      businessPlanAnalysis: pick("businessPlanAnalysis", businessPlanAnalysis),
      pitchDeckAnalysis: pick("pitchDeckAnalysis", pitchDeckAnalysis),
      creditReportAnalysis: pick("creditReportAnalysis", creditReportAnalysis),
      guaranteesAnalysis: pick("guaranteesAnalysis", guaranteesAnalysis),
      solvencyAnalysis: pick("solvencyAnalysis", solvencyAnalysis),
      financialStatementsAnalysis: pick("financialStatementsAnalysis", financialStatementsAnalysis),
    };
  };

  const computeAssessment = (fresh) => {
    const pd = profileDataRef.current || profileData;
    if (!pd) return null;
    return buildCapitalAppealAssessment({
      profileData: pd,
      fundingTier,
      hasAppliedForFunding,
      subWeights: getFundabilitySubWeights(fundingTier),
      stageWeights: weightingsByStage[mapStageToCategory(pd?.entityOverview?.operationStage)],
      ...pickAnalyses(fresh),
    });
  };

  const runAiEvaluation = async () => {
    if (!apiKey?.trim()) { setEvaluationError("AI analysis is not configured yet."); return null; }
    if (!profileDataRef.current && !profileData) { setEvaluationError("No profile data available to analyse."); return null; }

    setIsEvaluating(true);
    setEvaluationError("");
    try {
      let fresh = null;
      if (!fundingCheckCompleteRef.current || !isFundingDataLoaded) {
        try {
          fresh = await fetchFundingApplicationData();
        } catch (e) {
          console.error("Could not load document analyses before evaluation:", e);
        }
      }

      const a = computeAssessment(fresh);
      if (!a) { setEvaluationError("No profile data available to analyse."); return null; }

      setAssessment(a);
      setFundabilityScore(a.totalScore);

      const result = await callFunction("generateFundabilityAnalysis", {
        prompt: buildPrompt(a, buildDocumentFindings(pickAnalyses(fresh))),
      });
      return result?.content || "";
    } catch (error) {
      console.error("Capital appeal AI evaluation error:", error);
      setEvaluationError(`Analysis failed: ${error.message}`);
      return null;
    } finally {
      setIsEvaluating(false);
    }
  };

  useEffect(() => { runAiEvaluationRef.current = runAiEvaluation; });

  const refreshAiEvaluation = async () => {
    const userId = auth?.currentUser?.uid;
    if (!userId) return;
    try {
      const result = await runAiEvaluation();
      if (result) {
        const timestamp = new Date();
        await setDoc(
          doc(db, "aiFundabilityEvaluations", userId),
          { result, score: fundabilityScore, timestamp, fundingTier, includedFundingData: isFundingDataLoaded, profileSnapshot: profileData },
          { merge: true }
        );
        setAiEvaluationResult(result);
        setEvaluationTimestamp(timestamp.toLocaleString());
      }
    } catch (error) {
      setEvaluationError(`Failed to refresh: ${error.message}`);
    }
  };

  // ── Auto-trigger + load saved narrative (unchanged) ──
  useEffect(() => {
    if (!auth?.currentUser?.uid || !apiKey) return;
    const userId = auth.currentUser.uid;
    const docRef = doc(db, "universalProfiles", userId);
    const aiEvalRef = doc(db, "aiFundabilityEvaluations", userId);

    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.triggerFundabilityEvaluation === true && !isEvaluatingRef.current && !isSavingEvaluation.current) {
          isSavingEvaluation.current = true;
          try {
            const result = await runAiEvaluationRef.current();
            if (result) {
              const timestamp = new Date();
              await setDoc(
                aiEvalRef,
                { result, timestamp, profileSnapshot: profileDataRef.current, fundingTier, includedFundingData: true },
                { merge: true }
              );
              setAiEvaluationResult(result);
              setEvaluationTimestamp(timestamp.toLocaleString());
            }
          } catch (error) {
            setEvaluationError(`Auto evaluation failed: ${error.message}`);
          } finally {
            await updateDoc(docRef, { triggerFundabilityEvaluation: false });
            isSavingEvaluation.current = false;
          }
          return;
        }
      }

      if (isSavingEvaluation.current) return;
      try {
        const aiSnap = await getDoc(aiEvalRef);
        if (aiSnap.exists() && aiSnap.data().result) {
          setAiEvaluationResult(aiSnap.data().result);
          if (aiSnap.data().timestamp) {
            setEvaluationTimestamp(new Date(aiSnap.data().timestamp.toDate()).toLocaleString());
          }
        }
      } catch (e) { console.error("Load saved eval error:", e); }
    });

    return () => unsubscribe();
  }, [auth?.currentUser?.uid, apiKey]);

  // ─────────────────────────────────────────────────────────────────────
  // Presentation
  // ─────────────────────────────────────────────────────────────────────
  const getScoreLevel = (score) => {
    if (score > 90) return { level: "Highly fundable", color: "#1B5E20" };
    if (score >= 81) return { level: "Strong investment case", color: "#4CAF50" };
    if (score >= 61) return { level: "Moderate potential", color: "#FF9800" };
    if (score >= 41) return { level: "Basic potential", color: "#F44336" };
    return { level: "Needs development", color: "#B71C1C" };
  };
  const scoreLevel = getScoreLevel(fundabilityScore);
  const a = assessment;

  const fundingEvidence = [
    businessPlanAnalysis?.isValid && "a business plan analysis",
    pitchDeckAnalysis?.isValid && "a pitch deck analysis",
    creditReportAnalysis?.isValid && "a credit report",
    guaranteesAnalysis?.activeCount > 0 && "security instruments",
    (profileData?.useOfFunds?.fundingInstruments || []).length > 0 && "funding instruments",
    profileData?.useOfFunds?.amountRequested && "an amount requested",
  ].filter(Boolean);

  const fundabilityStatus = (() => {
    if (a?.fundingActive) return null;
    if (!fundingCheckComplete) return null;

    if (!hasAppliedForFunding) {
      return {
        key: "fundability",
        headline: missingFundingSections.length
          ? `${missingFundingSections.length} funding application section${missingFundingSections.length === 1 ? "" : "s"} still to complete`
          : "No funding application on file",
        detail:
          "Fundability is 60% of the Capital Appeal score and only activates once the funding application is complete. Until then you are scored on Financial Strength alone, which is why the weighting reads differently from the published one.",
        chips: missingFundingSections.map((k) => FUNDING_SECTION_LABELS[k] || k),
        cta: "Go to the funding application",
        route: FUNDING_ROUTE,
        note: fundingEvidence.length
          ? `You already have ${fundingEvidence.join(", ")} on file, so most of the work is done — the sections above just need marking complete.`
          : null,
      };
    }

    return {
      key: "tier",
      headline: "Funding type not identified",
      detail:
        "The application is complete, but no funding instrument has been selected — and the instrument is what decides how Fundability is weighted. A grant is scored on impact and business plan; purchase-order finance is scored on collateral and credit. Without one, the block cannot be weighted at all.",
      chips: [],
      cta: "Select your funding instruments",
      route: `${FUNDING_ROUTE}?section=useOfFunds`,
      note: null,
    };
  })();

  // ── Assemble what the explorer needs ────────────────────────────────
  const parsed = useMemo(() => parseAnalysisByElement(aiEvaluationResult), [aiEvaluationResult]);

  // Weak areas and priority improvements recovered from the document
  // evaluations that already ran — business plan, pitch deck, credit report,
  // financial statements. Qualitative, no point values, keyed by element.
  const documentFindings = useMemo(
    () =>
      buildDocumentFindings({
        businessPlanAnalysis,
        pitchDeckAnalysis,
        creditReportAnalysis,
        financialStatementsAnalysis,
      }),
    [businessPlanAnalysis, pitchDeckAnalysis, creditReportAnalysis, financialStatementsAnalysis]
  );

  const explorer = useMemo(() => {
    if (!a) return null;

    const findingFor = (label) => parsed.map[normLabel(label)] || null;
    const toElement = (src, blockKey, extra = {}) => ({
      key: `${blockKey}:${src.key}`,
      findings: documentFindings[`${blockKey}:${src.key}`] || null,
      label: src.label,
      weight: src.weight,
      percent: src.percent,
      effectiveWeight: src.effectiveWeight,
      excluded: src.excluded,
      exclusionNote: src.exclusionNote,
      reductionNote: src.reductionNote,
      breakdown: src.items || [],
      improvements: (src.items || []).filter((i) => i.withheld > 0 && i.claimable),
      locked: (src.items || []).filter((i) => i.withheld > 0 && !i.claimable),
      analysis: findingFor(src.label),
      ...extra,
    });

    const blocks = [
      {
        key: "financialStrength",
        label: "Financial Strength",
        percent: a.financialStrength.percent,
        blockWeight: a.blockWeights.financialStrength,
        note: "Scored in code against the fields on your Financial Overview and the credit report on file.",
        elements: a.financialStrength.subCategories.map((sc) =>
          toElement(sc, "financialStrength", {
            sourceNote: "Read from the fields on your Financial Overview, plus the credit report on file.",
          })
        ),
      },
    ];

    if (a.fundingActive) {
      const fundabilityBlock = a.blocks.find((b) => b.key === "fundability");
      blocks.push({
        key: "fundability",
        label: "Fundability",
        percent: fundabilityBlock?.percent ?? 0,
        blockWeight: a.blockWeights.fundability,
        note: `Weighted for Tier ${fundingTier} — ${TIER_LABELS[fundingTier]}. Sub-components at 0% are excluded for this funding type and cost you nothing.`,
        elements: a.fundabilityComponents.map((c) => toElement(c, "fundability")),
      });
    } else if (fundabilityStatus) {
      blocks.push({
        key: "fundability",
        label: "Fundability — not scored",
        percent: 0,
        blockWeight: 60,
        inactive: true,
        note: `${fundabilityStatus.headline}. Its seven sub-components — business plan, pitch deck, impact and mandate, creditworthiness, guarantees, financial resilience and growth potential — are all inactive, so your score is Financial Strength only.`,
        elements: [],
      });
    }

    const assessmentAreas = blocks.flatMap((b) =>
      b.elements.map((e) => ({
        label: e.label,
        weightLabel: e.excluded ? `excluded · ${b.label}` : `${e.weight}% of ${b.label}`,
        detail: ELEMENT_PURPOSE[e.key.split(":")[1]] || "",
      }))
    );

    const weightingTables = [
      {
        title: "Block weighting",
        firstColumn: "Block",
        rows: [
          { label: "Financial Strength", weight: `${a.blockWeights.financialStrength}%`, now: `${Math.round(a.financialStrength.percent)}%` },
          {
            label: "Fundability",
            weight: `${a.blockWeights.fundability}%`,
            now: a.fundingActive ? `${Math.round(a.blocks.find((b) => b.key === "fundability")?.percent || 0)}%` : "—",
            excluded: !a.fundingActive,
          },
        ],
        note: a.fundingActive
          ? "Block weights follow your business stage and funding tier."
          : "Fundability is inactive, so Financial Strength carries the whole score at the weight shown for your stage.",
      },
      {
        title: "Within Financial Strength",
        rows: a.financialStrength.subCategories.map((sc) => ({
          label: sc.label,
          weight: `${sc.weight}%`,
          now: `${Math.round(sc.percent)}%`,
        })),
        note: "Applied in code against the fields on your Financial Overview — this is the arithmetic, not a guide.",
      },
    ];

    if (a.fundingActive) {
      weightingTables.push({
        title: `Within Fundability — Tier ${fundingTier}: ${TIER_LABELS[fundingTier]}`,
        firstColumn: "Sub-component",
        rows: a.fundabilityComponents.map((c) => ({
          label: c.label,
          weight: `${c.weight}%`,
          now: c.excluded ? "—" : `${Math.round(c.percent)}%`,
          excluded: c.excluded,
        })),
        note: "A sub-component at 0% is excluded for your tier. It is not a gap and costs you nothing.",
      });
    }

    const attention = [];
    if (fundabilityStatus) attention.push(fundabilityStatus);
    if (a.statements?.hasDiscrepancy) {
      attention.push({
        key: "discrepancy",
        headline: "Your statements and your profile disagree",
        detail:
          "The analysis of your uploaded financial statements found figures that do not match your Financial Overview. The profile is what gets scored, so where the statements are stronger you are being under-scored, and where they are weaker a funder will find the difference in due diligence.",
        chips: [],
        note: a.statements.summary || null,
        cta: "Reconcile on Financial Overview",
        route: "/profile?section=financialOverview",
      });
    }

    return {
      blocks,
      attention,
      about: {
        definition:
          "Capital Appeal measures whether this business can absorb, deploy and return capital. It is built from two blocks: Financial Strength — what your own numbers say — and Fundability, which activates once a funding application is complete and is weighted according to the kind of money you are asking for.",
        definitionNotes: [
          {
            title: "The score is calculated in code",
            body: "Every figure here comes from a scoring function reading literal fields on your profile and the documents on file. The AI reads the finished numbers and explains them. That is what lets a figure like +3.4% be a promise rather than an estimate.",
          },
          {
            title: "Points that cannot be claimed back",
            body: "A credit score band, a solvency position and a current ratio are what your records say, not what the form says. Capturing the numbers is an action and is listed under Potential points; the position itself is shown as a fixed deduction and kept out of the recoverable total, because listing it as an action would imply you could type your way to a better balance sheet.",
          },
        ],
        assessmentAreas,
        interpretation: INTERPRETATION,
        weighting: {
          formula: "value = (item points withheld ÷ container points) × block weight × component weight",
          formulaNote:
            "Each figure shown against an improvement is the exact amount the score moves when that item is resolved — the same function promises it and awards it.",
          tables: weightingTables,
        },
      },
      potential: {
        available: a.availablePoints,
        locked: a.lockedPoints,
        current: a.totalRaw,
        projected: Math.round(a.totalRaw + a.availablePoints),
        items: a.outstanding,
        lockedItems: a.locked,
      },
      summary: parsed.overall,
    };
  }, [a, parsed, documentFindings, fundingTier, fundabilityStatus]);

  const tierBadge =
    a?.fundingActive && fundingTier ? (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          backgroundColor: TIER_BADGE_COLORS[fundingTier].bg,
          border: `1px solid ${TIER_BADGE_COLORS[fundingTier].border}`,
          borderRadius: "20px",
          padding: "6px 14px",
          fontSize: "12px",
          fontWeight: 600,
          color: TIER_BADGE_COLORS[fundingTier].text,
          marginTop: "8px",
        }}
      >
        <span>🏷</span>
        <span>Tier {fundingTier}: {TIER_LABELS[fundingTier]}</span>
      </div>
    ) : null;

  return (
    <>
      {/* ── Card ── */}
      <div style={{ background: "linear-gradient(135deg, #ffffff 0%, #faf8f6 100%)", borderRadius: "20px", boxShadow: "0 8px 32px rgba(141,110,99,0.15)", border: "1px solid #e8ddd6", overflow: "hidden", position: "relative", width: "100%", minWidth: "210px" }}>
        <div style={{ background: "linear-gradient(135deg, #8d6e63 0%, #6d4c41 100%)", padding: "24px 30px 20px 30px", color: "white", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, letterSpacing: "0.5px", whiteSpace: "nowrap" }}>Capital Appeal</h2>
            <DollarSign size={24} style={{ opacity: 0.8 }} />
          </div>
          <p style={{ margin: 0, fontSize: "13px", opacity: 0.9 }}>Investment readiness assessment</p>
          <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "80px", height: "80px", background: "rgba(255,255,255,0.1)", borderRadius: "50%", opacity: 0.6 }} />
          <div style={{ position: "absolute", bottom: "-10px", left: "-10px", width: "60px", height: "60px", background: "rgba(255,255,255,0.05)", borderRadius: "50%" }} />
        </div>

        <div style={{ padding: "24px", background: "white", textAlign: "center" }}>
          <div style={{ position: "relative", display: "inline-block", marginBottom: "24px" }}>
            <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "110px", height: "110px", border: `4px solid ${scoreLevel.color}`, borderRadius: "50%", background: "linear-gradient(135deg,#fff 0%,#f8fff8 100%)", boxShadow: `0 6px 20px ${scoreLevel.color}30`, fontWeight: "bold" }}>
              <span style={{ fontSize: "26px", fontWeight: 800, lineHeight: 1 }}>{fundabilityScore}%</span>
              <div style={{ position: "absolute", top: "-6px", left: "-6px", right: "-6px", bottom: "-6px", border: `2px solid ${scoreLevel.color}20`, borderRadius: "50%", animation: "pulse 2s infinite" }} />
            </div>
            <div style={{ position: "absolute", bottom: "-12px", left: "50%", transform: "translateX(-50%)", backgroundColor: scoreLevel.color, color: "white", padding: "6px 16px", borderRadius: "20px", fontSize: "10px", fontWeight: 600, letterSpacing: "0.5px", boxShadow: `0 4px 12px ${scoreLevel.color}40`, border: "2px solid white", whiteSpace: "nowrap" }}>
              {scoreLevel.level}
            </div>
          </div>

          {fundabilityStatus && (
            <div style={{ marginTop: "8px", display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 12px", background: "#fff8e1", border: "1px solid #e8d0a8", borderRadius: "20px", color: "#8a5a00", fontWeight: 700, fontSize: "10.5px", lineHeight: 1.4 }}>
              <AlertCircle size={12} /> Fundability (60%) not scored
            </div>
          )}

          <button
            onClick={() => setShowModal(true)}
            style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", background: "linear-gradient(135deg,#5d4037 0%,#4a2c20 100%)", color: "white", marginTop: "15px", border: "none", fontWeight: 600, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "all 0.3s ease", boxShadow: "0 4px 16px rgba(93,64,55,0.3)", whiteSpace: "nowrap" }}
            onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(93,64,55,0.4)"; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0px)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(93,64,55,0.3)"; }}
          >
            <span>Explore your score</span>
            <ChevronDown size={16} />
          </button>
        </div>

        <style>{`@keyframes pulse { 0%,100% { transform:scale(1); opacity:1; } 50% { transform:scale(1.05); opacity:0.7; } }`}</style>
      </div>

      {/* ── Modal — one screen at a time ── */}
      {showModal && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999999, padding: "20px" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            style={{ position: "relative", backgroundColor: "#ffffff", borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)", width: "100%", maxWidth: "620px", border: "1px solid #e8ddd6", overflow: "hidden" }}
            onClick={(e) => e.stopPropagation()}
          >
            {explorer ? (
              <ScoreExplorer
                title="Capital Appeal"
                score={fundabilityScore}
                band={scoreLevel}
                contextLine={
                  <>
                    Business stage:{" "}
                    <strong style={{ color: "#5d4037", textTransform: "capitalize" }}>
                      {profileData?.entityOverview?.operationStage || "Ideation"}
                    </strong>
                    <div style={{ fontSize: "11.5px", color: "#8d6e63", marginTop: "4px" }}>
                      {a.fundingActive
                        ? `Financial Strength ${a.blockWeights.financialStrength}% · Fundability ${a.blockWeights.fundability}%`
                        : `Financial Strength only, weighted ${a.blockWeights.financialStrength}% for this stage`}
                    </div>
                  </>
                }
                badge={tierBadge}
                about={explorer.about}
                blocks={explorer.blocks}
                potential={explorer.potential}
                attention={explorer.attention}
                summary={explorer.summary}
                onNavigate={goTo}
                onClose={() => setShowModal(false)}
                onRequestAnalysis={refreshAiEvaluation}
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
  );
}