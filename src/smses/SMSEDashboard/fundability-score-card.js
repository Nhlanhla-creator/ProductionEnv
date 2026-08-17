"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ChevronDown,
  RefreshCw,
  AlertCircle,
  DollarSign,
  CheckCircle,
  TrendingUp,
  XCircle,
  Info,
  Target,
  Lock,
} from "lucide-react";
import { db, auth } from "../../firebaseConfig";
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useFirebaseFunctions } from "./hooks";
import { useSolvencyScore } from "../hooks/useSolvencyScore";
import { normalizeSolvencyScore } from "../MyGrowthTools/financial/data_utils/solvencyScoreUtils";
import {
  buildCapitalAppealAssessment,
  FINANCIAL_STRENGTH_WEIGHTS,
  fmtPts,
} from "./fundability-potential";

// ─────────────────────────────────────────────────────────────────────────
// CAPITAL APPEAL
//
// WHAT CHANGED
//
//   The score used to come out of parseAiEvaluationScores — Financial
//   Strength (40%) and Impact & Mandate were numbers the model wrote in
//   prose and the card re-parsed. The About panel said so of Financial
//   Strength: the documented weighting "is not applied programmatically to
//   sub-scores — it guides the AI's single overall rating."
//
//   It is applied programmatically now. Revenue & Profitability 30, Records
//   25, Balance Sheet 20, Debt 15, Credit 10, against literal fields on
//   financialOverview. Impact & Mandate the same, against socialImpact. The
//   document-backed components were already deterministic and are unchanged.
//
//   The AI never touches a number. It reads the finished ones and explains
//   what was counted, what was withheld and what to do next — which is what
//   lets an item promise "+3.4%" rather than estimate it.
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

// The eight sections of the funding application, and what they are called on
// screen. Fundability (60% of this score) only activates once they are done,
// so when it is missing the business needs to be told exactly which ones.
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

const STATE_STYLE = {
  counted: { dot: "#4CAF50", label: "Counted in full", text: "#2E7D32" },
  partial: { dot: "#FF9800", label: "Partly counted", text: "#EF6C00" },
  missing: { dot: "#F44336", label: "Not captured", text: "#C62828" },
};

// ═════════════════════════════════════════════════════════════════════════

export function FundabilityScoreCard({ styles = {}, profileData, onScoreUpdate, apiKey, onNavigate }) {
  const [showModal, setShowModal] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [fundabilityScore, setFundabilityScore] = useState(0);

  const [aiEvaluationResult, setAiEvaluationResult] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState("");
  const [evaluationTimestamp, setEvaluationTimestamp] = useState(null);

  // Panels — same set and order as the Operational Strength card
  const [showPotential, setShowPotential] = useState(true);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  const [showAboutScore, setShowAboutScore] = useState(false);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);
  const [openItem, setOpenItem] = useState(null);
  const [openBlock, setOpenBlock] = useState("financialStrength");

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

  // ── Load the document-backed analyses ──
  const fetchFundingApplicationData = useCallback(async () => {
    if (dataLoadPromiseRef.current) return dataLoadPromiseRef.current;

    const loadPromise = (async () => {
      const userId = auth.currentUser.uid;
      const fresh = {
        businessPlanAnalysis: null, pitchDeckAnalysis: null, creditReportAnalysis: null,
        guaranteesAnalysis: null, solvencyAnalysis: null, financialStatementsAnalysis: null,
      };

      // ── Financial statements: aiFinancialEvaluations/{userId} ──
      // A real document read and scored — breakdown, summary and the file
      // itself. It backs four of the five Financial Strength sub-categories,
      // so it is loaded for every business, not only funding applicants.
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
          const content = d?.evaluation?.content || "";
          const score = d?.evaluation?.analysisResult?.creditScore ?? d?.evaluation?.score ?? 0;
          const label = d?.evaluation?.analysisResult?.creditRating ?? d?.evaluation?.label ?? "";
          const isCreditReport =
            d?.evaluation?.analysisResult?.isCreditReport ?? d?.evaluation?.isCreditReport ?? d?.isCreditReport ?? false;
          fresh.creditReportAnalysis = {
            score, content, label, isCreditReport,
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
        // The document analyses feed Financial Strength too (credit report), so
        // they are loaded whether or not a funding application exists.
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

  // ── Narrative prompt: finished numbers in, explanation out ──
  //
  // ONE SECTION PER SCORED COMPONENT, as the card had before the rewrite.
  // Collapsing Fundability into a single block hid seven separate findings
  // behind one paragraph: a business needs to see that its pitch deck is the
  // weak component and its impact alignment is the strong one, not an average
  // of the two. Excluded components still get a section so the reason they do
  // not count is visible rather than absent.
  const buildSections = (a) => {
    const sections = [
      {
        title: "Financial Strength",
        weightLabel: `weighted ${a.blockWeights.financialStrength}% of the final score`,
        percent: Math.round(a.financialStrength.percent),
        subCategories: a.financialStrength.subCategories,
        items: a.financialStrength.items,
        sourceNote: "Read from the fields on your Financial Overview, plus the credit report on file.",
      },
    ];

    a.fundabilityComponents.forEach((c) => {
      sections.push({
        title: c.label,
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

  const buildPrompt = (a) => {
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
        const body = sec.subCategories
          ? sec.subCategories
              .map((sc) => `  ${sc.label} (${sc.weight}% of this section, ${Math.round(sc.percent)}%)\n${sc.items.map(line).join("\n")}`)
              .join("\n")
          : sec.items.map(line).join("\n");
        return `\n### ${idx + 1}. ${sec.title}\nSCORE: ${sec.percent}% · ${sec.weightLabel}${sec.reductionNote ? `\nREDUCED WEIGHT: ${sec.reductionNote}` : ""}${sec.sourceNote ? `\n${sec.sourceNote}` : ""}\n${body}`;
      })
      .join("\n");

    const outputFormat = sections
      .map((sec, idx) => {
        if (sec.excluded) {
          return `### ${idx + 1}. ${sec.title}
**Status:** Excluded at Tier ${fundingTier}
**Why:** [one sentence, from the exclusion note above]
**Impact on your score:** None — this is not a gap and costs you nothing.`;
        }
        return `### ${idx + 1}. ${sec.title}
**Score:** ${sec.percent}% · ${sec.weightLabel}
**Evidence:** [what was actually counted in this section — cite the values on file]
**Points withheld:** [one bullet per item with points withheld, as: - Item — reason — **+X.X%** via Section. Mark any NOT RECOVERABLE item as a fixed deduction instead. If none: "None — everything captured was counted in full."]
**Rationale:** [2–3 sentences on what this section means to a funder]
**Points available:** [one bullet per recoverable item, as: - → Section: action — **+X.X%**. If none: "None — this section is complete."]`;
      })
      .join("\n\n");

    return `You are writing the capital appeal section of a funding-readiness report.

EVERY NUMBER BELOW IS FINAL. You do not calculate, adjust or re-derive anything. Your job is to explain what was counted, what was withheld and why, and what to do next. Stating a different number is an error.

ONLY the data below exists. Do not invent or infer any figure that is not here. Where an item says NOT CAPTURED, treat it as unproven, never as a positive.

An item marked NOT RECOVERABLE must never appear under "Points available". Explain it under "Points withheld" as a fixed deduction that follows the underlying financial reality rather than the form.

A section marked EXCLUDED costs the business nothing at this tier and must never be described as a gap or a weakness.

WRITE ONE SECTION PER HEADING BELOW. Do not merge sections, do not skip sections, and do not add sections. Each is a separate finding a funder reads on its own.

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
${a.statements.hasDiscrepancy ? "\nIMPORTANT: that analysis found figures in the statements that do not match the self-reported Financial Overview. Raise this in section 1 as a reconciliation item. Say plainly which way it cuts: the profile is what gets scored, so where the statements are stronger the business is under-scoring itself, and where they are weaker a funder will find the difference in due diligence. Do not adjust any score for it — flag it." : ""}` : `
═══ FINANCIAL STATEMENTS ═══
No financial statements have been read. Several items above are unbacked as a result; say so in section 1.`}

RULES
- Where points were withheld on something that WAS captured, lead with that — it is more useful than listing blanks.
- Every recommendation must be an item above, must be marked recoverable, and must carry its exact value.
- Never invent an improvement that is not on the list — it cannot earn anything.
- Plain business English. Short sentences.

OUTPUT FORMAT — follow exactly, including the bold labels and the section numbering:

${outputFormat}

### Overall Assessment
**Total score:** ${a.totalScore}%
**Recoverable:** ${a.availablePoints}%
**Strongest section:** [name it and say in one line why it stands out to a funder]
**Weakest section:** [name it, excluding anything marked EXCLUDED, and say what it costs]
**Highest-value next step:** [the single top recoverable item, its section and exact value]
**Final analysis:** [short paragraph: where this business stands, and what the score becomes once the top three recoverable items are resolved]`;
  };

  // ── Build the assessment from whatever the freshest inputs are ──
  //
  // The auto-trigger can fire before the score effect has run or before the
  // document analyses have loaded. Relying on `assessment` state there meant
  // the trigger bailed with "no profile data" and silently did nothing — the
  // old card avoided that by loading its data first, so this does the same.
  const computeAssessment = (fresh) => {
    const pd = profileDataRef.current || profileData;
    if (!pd) return null;
    const pick = (key, stateValue) => (fresh && key in fresh ? fresh[key] : stateValue);
    return buildCapitalAppealAssessment({
      profileData: pd,
      fundingTier,
      hasAppliedForFunding,
      subWeights: getFundabilitySubWeights(fundingTier),
      stageWeights: weightingsByStage[mapStageToCategory(pd?.entityOverview?.operationStage)],
      businessPlanAnalysis: pick("businessPlanAnalysis", businessPlanAnalysis),
      pitchDeckAnalysis: pick("pitchDeckAnalysis", pitchDeckAnalysis),
      creditReportAnalysis: pick("creditReportAnalysis", creditReportAnalysis),
      guaranteesAnalysis: pick("guaranteesAnalysis", guaranteesAnalysis),
      solvencyAnalysis: pick("solvencyAnalysis", solvencyAnalysis),
      financialStatementsAnalysis: pick("financialStatementsAnalysis", financialStatementsAnalysis),
    });
  };

  const runAiEvaluation = async () => {
    if (!apiKey?.trim()) { setEvaluationError("AI analysis is not configured yet."); return null; }
    if (!profileDataRef.current && !profileData) { setEvaluationError("No profile data available to analyse."); return null; }

    setIsEvaluating(true);
    setEvaluationError("");
    try {
      // Load the document analyses first if the trigger beat them to it, then
      // score against what actually came back rather than against state that
      // may not have settled.
      let fresh = null;
      if (!fundingCheckCompleteRef.current || !isFundingDataLoaded) {
        setEvaluationError("Loading your document analyses…");
        try {
          fresh = await fetchFundingApplicationData();
        } catch (e) {
          console.error("Could not load document analyses before evaluation:", e);
        }
        setEvaluationError("");
      }

      const a = computeAssessment(fresh);
      if (!a) { setEvaluationError("No profile data available to analyse."); return null; }

      setAssessment(a);
      setFundabilityScore(a.totalScore);

      const result = await callFunction("generateFundabilityAnalysis", { prompt: buildPrompt(a) });
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
        setShowDetailedAnalysis(true);
      }
    } catch (error) {
      setEvaluationError(`Failed to refresh: ${error.message}`);
    }
  };

  // ── Auto-trigger + load saved narrative ──
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
              setShowDetailedAnalysis(true);
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
  const barColor = (s) =>
    s > 90 ? "#1B5E20" : s >= 81 ? "#4CAF50" : s >= 61 ? "#FF9800" : s >= 41 ? "#F44336" : "#B71C1C";

  const getScoreLevel = (score) => {
    if (score > 90) return { level: "Highly fundable", color: "#1B5E20" };
    if (score >= 81) return { level: "Strong investment case", color: "#4CAF50" };
    if (score >= 61) return { level: "Moderate potential", color: "#FF9800" };
    if (score >= 41) return { level: "Basic potential", color: "#F44336" };
    return { level: "Needs development", color: "#B71C1C" };
  };
  const scoreLevel = getScoreLevel(fundabilityScore);

  const a = assessment;

  // ─────────────────────────────────────────────────────────────────────
  // WHY IS FUNDABILITY NOT BEING SCORED?
  //
  // Fundability is 60% of this score, and it activates on two conditions:
  // the funding application is complete, AND a funding tier can be worked
  // out from the instruments selected. Miss either and the business is
  // scored on Financial Strength alone — which is a very different number,
  // and previously arrived with no explanation at all.
  //
  // Both conditions are checked separately here, because the fix is
  // different: one is "finish these sections", the other is "you finished
  // the application but never picked what kind of funding you want".
  // ─────────────────────────────────────────────────────────────────────
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
        headline: missingFundingSections.length
          ? `${missingFundingSections.length} funding application section${missingFundingSections.length === 1 ? "" : "s"} still to complete`
          : "No funding application on file",
        detail:
          "Fundability is 60% of the Capital Appeal score and only activates once the funding application is complete. Until then you are scored on Financial Strength alone, which is why the weighting above reads differently from the published one.",
        missing: missingFundingSections,
        cta: "Go to the funding application",
        route: FUNDING_ROUTE,
        evidenceNote: fundingEvidence.length
          ? `You already have ${fundingEvidence.join(", ")} on file, so most of the work is done — the sections above just need marking complete.`
          : null,
      };
    }

    return {
      headline: "Funding type not identified",
      detail:
        "The application is complete, but no funding instrument has been selected — and the instrument is what decides how Fundability is weighted. A grant is scored on impact and business plan; purchase-order finance is scored on collateral and credit. Without one, the block cannot be weighted at all.",
      missing: [],
      cta: "Select your funding instruments",
      route: `${FUNDING_ROUTE}?section=useOfFunds`,
      evidenceNote: null,
    };
  })();

  // ── Rich rendering for the AI narrative ──
  //
  // The model writes labelled lines — Score, Evidence, Points withheld,
  // Rationale, Points available. Rendered as pre-wrapped text they collapse
  // into a wall. Each label becomes a chip, each +X.X% becomes a green pill,
  // and Points withheld / Points available get opposing colours so the eye
  // can separate what was lost from what is recoverable.
  const HIGHLIGHT_LABELS = [
    "score", "evidence", "points withheld", "withheld", "rationale",
    "points available", "recoverable", "status", "why", "impact on your score",
    "total score", "strongest section", "weakest section",
    "highest-value next step", "final analysis",
  ];
  const LABEL_LINE = /^\s*(?:[-•*]\s*)?([A-Za-z][A-Za-z0-9 /&'()–-]{1,44}):\s*(.*)$/;
  const POINT_VALUE = /\+\d+(?:\.\d+)?%/g;
  const stripMd = (x) => String(x || "").replace(/\*\*/g, "").trim();

  const renderInline = (text, keyPrefix) => {
    const src = String(text);
    const out = [];
    let last = 0;
    let m;
    let i = 0;
    POINT_VALUE.lastIndex = 0;
    while ((m = POINT_VALUE.exec(src)) !== null) {
      if (m.index > last) out.push(src.slice(last, m.index));
      out.push(
        <span
          key={`${keyPrefix}-p${i++}`}
          style={{ backgroundColor: "#e8f5e9", color: "#1B5E20", border: "1px solid #c8e6c9", borderRadius: "4px", padding: "1px 6px", fontWeight: 800, fontSize: "11.5px", whiteSpace: "nowrap" }}
        >
          {m[0]}
        </span>
      );
      last = m.index + m[0].length;
    }
    if (last < src.length) out.push(src.slice(last));
    return out.length ? out : src;
  };

  const renderRichText = (text) =>
    String(text).split("\n").map((line, i) => {
      if (!line.trim()) return <div key={i} style={{ height: "7px" }} />;
      const bare = stripMd(line);

      const m = bare.match(LABEL_LINE);
      if (m) {
        const labelKey = m[1].toLowerCase().trim();
        if (HIGHLIGHT_LABELS.some((l) => labelKey === l || labelKey.startsWith(l))) {
          const isWithheld = labelKey.startsWith("points withheld") || labelKey.startsWith("withheld");
          const isAvailable = labelKey.startsWith("points available") || labelKey.startsWith("recoverable") || labelKey.startsWith("highest-value");
          const tone = isWithheld
            ? { fg: "#B71C1C", bg: "#fdecea", br: "#e6b8ac" }
            : isAvailable
            ? { fg: "#1B5E20", bg: "#e8f5e9", br: "#c8e6c9" }
            : { fg: "#4e342e", bg: "#f3e8dc", br: "#e6d3c4" };
          return (
            <div key={i} style={{ margin: "12px 0 4px 0" }}>
              <span
                style={{ fontWeight: 800, color: tone.fg, backgroundColor: tone.bg, padding: "2px 8px", borderRadius: "4px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.6px", border: `1px solid ${tone.br}`, display: "inline-block" }}
              >
                {m[1]}
              </span>
              {m[2] ? <span style={{ marginLeft: "8px" }}>{renderInline(m[2], i)}</span> : null}
            </div>
          );
        }
      }

      if (/^\s*[-•*→]\s+/.test(line)) {
        return (
          <div key={i} style={{ display: "flex", gap: "8px", margin: "3px 0 3px 6px" }}>
            <span style={{ color: "#a1887f" }}>•</span>
            <span>{renderInline(bare.replace(/^\s*[-•*]\s*/, "").replace(/^→\s*/, ""), i)}</span>
          </div>
        );
      }

      return <div key={i} style={{ margin: "3px 0" }}>{renderInline(bare, i)}</div>;
    });

  // Each ### section gets its own bordered card, so the seven findings read as
  // seven findings rather than one continuous document.
  const formatAiResult = (text) => {
    if (!text) return null;
    return String(text).split(/(?=###\s)/g).map((section, index) => {
      const trimmed = section.trim();
      if (!trimmed) return null;
      const headingMatch = trimmed.match(/^###\s*(.+?)(?=\n|$)/);
      const rawHeading = headingMatch ? headingMatch[1].trim() : null;
      const heading = rawHeading ? stripMd(rawHeading) : null;
      const rest = rawHeading
        ? trimmed.slice(trimmed.indexOf(rawHeading) + rawHeading.length).replace(/^###\s*/, "").trim()
        : trimmed.replace(/^###\s*/, "");

      const isExcluded = /excluded/i.test(rest.slice(0, 160));
      const isOverall = heading && /overall/i.test(heading);

      return (
        <div key={index} style={{ marginBottom: "16px", border: `1px solid ${isExcluded ? "#e0d5cf" : "#e8d8cf"}`, borderRadius: "8px", overflow: "hidden", opacity: isExcluded ? 0.78 : 1 }}>
          {heading && (
            <div
              style={{
                background: isOverall
                  ? "linear-gradient(135deg,#4e342e 0%,#2e1c16 100%)"
                  : isExcluded
                  ? "#a1887f"
                  : "linear-gradient(135deg,#8d6e63 0%,#6d4c41 100%)",
                color: "white",
                padding: "10px 14px",
                fontWeight: 700,
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {isExcluded && <XCircle size={13} />}
              {heading}
            </div>
          )}
          <div style={{ fontSize: "13.5px", lineHeight: 1.6, color: "#6d4c41", backgroundColor: isExcluded ? "#faf8f6" : "white", padding: "14px 16px" }}>
            {renderRichText(rest || trimmed)}
          </div>
        </div>
      );
    }).filter(Boolean);
  };

  const Section = ({ title, right, open, onToggle, children }) => (
    <div style={{ marginTop: "16px", border: "1px solid #d7ccc8", borderRadius: "8px", overflow: "hidden" }}>
      <div
        style={{ backgroundColor: "#8d6e63", color: "white", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontWeight: "bold" }}
        onClick={onToggle}
      >
        <span>{title}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {right && <span style={{ fontSize: "13px", fontWeight: 700 }}>{right}</span>}
          <ChevronDown size={18} style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }} />
        </div>
      </div>
      {open && <div style={{ backgroundColor: "#f5f2f0", padding: "18px" }}>{children}</div>}
    </div>
  );

  const PotentialItem = ({ item, index }) => {
    const open = openItem === item.key;
    const projected = Math.round(a.totalRaw + item.pointValue);
    const chip =
      item.state === "missing" ? "Not captured yet"
      : item.earned > 0 ? "Partly counted — worth more"
      : "Captured — not counting";

    return (
      <div style={{ border: `1px solid ${open ? "#c8e6c9" : "#f0e8e0"}`, background: "white", borderRadius: "10px", marginBottom: "8px", overflow: "hidden", transition: "border-color 0.2s ease" }}>
        <div
          onClick={() => setOpenItem(open ? null : item.key)}
          style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", cursor: "pointer", background: open ? "#f7fbf7" : "white" }}
        >
          <span style={{ color: "#a1887f", fontWeight: 800, fontSize: "12px", minWidth: "18px" }}>{index + 1}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: "#4e342e", fontSize: "13px" }}>{item.label}</div>
            <div style={{ fontSize: "11px", color: "#8d6e63" }}>{item.container} · {chip}</div>
          </div>
          <span style={{ backgroundColor: "#e8f5e9", color: "#1B5E20", border: "1px solid #c8e6c9", borderRadius: "4px", padding: "3px 8px", fontWeight: 800, fontSize: "11.5px", whiteSpace: "nowrap" }}>
            {fmtPts(item.pointValue)}
          </span>
          <ChevronDown size={16} style={{ color: "#a1887f", flexShrink: 0, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }} />
        </div>

        {open && (
          <div style={{ padding: "14px", borderTop: "1px dashed #e8d8cf", background: "#fcfbfa" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", padding: "14px", background: "linear-gradient(135deg,#f1f8f1 0%,#e8f5e9 100%)", border: "1px solid #c8e6c9", borderRadius: "10px", marginBottom: "12px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "9.5px", color: "#6d4c41", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 700 }}>Now</div>
                <div style={{ fontSize: "26px", fontWeight: 800, color: "#8d6e63", lineHeight: 1.1 }}>{fundabilityScore}%</div>
              </div>
              <div style={{ fontSize: "22px", color: "#1B5E20", fontWeight: 800 }}>→</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "9.5px", color: "#1B5E20", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 700 }}>With this resolved</div>
                <div style={{ fontSize: "30px", fontWeight: 800, color: "#1B5E20", lineHeight: 1.1 }}>{projected}%</div>
                <div style={{ fontSize: "11px", color: "#2E7D32", fontWeight: 700 }}>{fmtPts(item.pointValue)}</div>
              </div>
            </div>

            {item.evidence && (
              <div style={{ fontSize: "12px", color: "#6d4c41", marginBottom: "8px" }}>
                <strong style={{ color: "#4e342e" }}>Currently recorded:</strong> {item.evidence}
              </div>
            )}
            {item.reason && (
              <div style={{ fontSize: "12.5px", color: "#8d3a2e", background: "#fdecea", border: "1px solid #e6b8ac", borderRadius: "8px", padding: "9px 11px", marginBottom: "10px", lineHeight: 1.6 }}>
                {item.reason}
              </div>
            )}
            {item.guidance && !item.reason && (
              <div style={{ fontSize: "12px", color: "#8d6e63", fontStyle: "italic", marginBottom: "10px", lineHeight: 1.6 }}>{item.guidance}</div>
            )}

            {item.importance && (
              <>
                <div style={{ fontSize: "10px", color: "#8d6e63", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "6px" }}>
                  Why funders ask for it
                </div>
                <div style={{ fontSize: "12.5px", color: "#5d4037", marginBottom: "10px", lineHeight: 1.6 }}>{item.importance}</div>
              </>
            )}

            <div style={{ fontSize: "10px", color: "#8d6e63", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "6px" }}>
              What to do
            </div>
            <div style={{ fontSize: "12.5px", color: "#5d4037", marginBottom: "12px", lineHeight: 1.6 }}>
              {item.fix || `Capture this under ${item.section}.`}
            </div>

            <button
              onClick={() => goTo(item.route)}
              disabled={!item.route}
              style={{ padding: "9px 16px", background: "linear-gradient(135deg,#5d4037 0%,#4a2c20 100%)", color: "white", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "12px", cursor: item.route ? "pointer" : "not-allowed", opacity: item.route ? 1 : 0.55, display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              Go to {item.section} <span style={{ fontSize: "13px" }}>→</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  const ItemRow = ({ item }) => {
    const st = STATE_STYLE[item.state] || STATE_STYLE.missing;
    return (
      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "9px" }}>
        <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", marginTop: "6px", flexShrink: 0, backgroundColor: st.dot }} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ color: "#4e342e" }}>{item.label}</strong>
          <span style={{ color: "#a1887f", fontSize: "11px" }}>
            {" "}· {item.earned}/{item.points} item points · <span style={{ color: st.text, fontWeight: 700 }}>{st.label}</span>
          </span>
          <br />
          {item.evidence && <span style={{ color: "#6d4c41" }}>{item.evidence}</span>}
          {item.reason && <span style={{ display: "block", color: "#8d3a2e" }}>{item.reason}</span>}
          {item.withheld > 0 && item.claimable && item.fix && (
            <span style={{ display: "block", color: "#8d3a2e" }}>{item.fix}</span>
          )}
          {item.withheld > 0 && item.claimable && item.route && (
            <button
              onClick={() => goTo(item.route)}
              style={{ marginTop: "6px", background: "none", border: "1px solid #d6b88a", color: "#5d4037", borderRadius: "6px", padding: "3px 10px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
            >
              Go to {item.section} →
            </button>
          )}
          {!item.claimable && item.withheld > 0 && (
            <span style={{ display: "block", color: "#8d6e63", fontStyle: "italic", fontSize: "11.5px", marginTop: "3px" }}>
              Fixed deduction — follows the underlying financial position, not the form.
            </span>
          )}
        </span>
        {item.withheld > 0 && (
          <span
            style={{
              backgroundColor: item.claimable ? "#e8f5e9" : "#f5f2f0",
              color: item.claimable ? "#1B5E20" : "#8d6e63",
              border: `1px solid ${item.claimable ? "#c8e6c9" : "#d7ccc8"}`,
              borderRadius: "4px", padding: "2px 7px", fontWeight: 800, fontSize: "11.5px",
              whiteSpace: "nowrap", marginTop: "2px", display: "inline-flex", alignItems: "center", gap: "4px",
            }}
          >
            {!item.claimable && <Lock size={10} />}
            {fmtPts(item.pointValue)}
          </span>
        )}
      </div>
    );
  };

  const ContainerRow = ({ label, weight, percent, effectiveWeight, excluded, exclusionNote, reductionNote, items }) => (
    <div style={{ marginBottom: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, color: excluded ? "#a1887f" : "#4e342e", fontSize: "12.5px" }}>{label}</span>
          {excluded && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "#e53935", backgroundColor: "#ffebee", borderRadius: "12px", padding: "2px 8px" }}>
              <XCircle size={10} /> excluded at this tier
            </span>
          )}
          {!excluded && reductionNote && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "#f57c00", backgroundColor: "#fff3e0", borderRadius: "12px", padding: "2px 8px" }}>
              <Info size={10} /> reduced weight
            </span>
          )}
        </div>
        <span style={{ fontSize: "11.5px", color: "#8d6e63", whiteSpace: "nowrap" }}>
          {excluded ? "0% weight" : `${Math.round(percent)}% × ${weight}% weight`}
          {!excluded && effectiveWeight ? ` · ${effectiveWeight.toFixed(1)} of the final score` : ""}
        </span>
      </div>

      {excluded && exclusionNote && (
        <div style={{ fontSize: "11.5px", color: "#8d6e63", fontStyle: "italic", lineHeight: 1.6, marginBottom: "6px" }}>
          {exclusionNote} It costs you nothing.
        </div>
      )}
      {!excluded && reductionNote && (
        <div style={{ fontSize: "11.5px", color: "#f57c00", lineHeight: 1.6, marginBottom: "6px" }}>{reductionNote}</div>
      )}

      {!excluded && items && items.map((it) => <ItemRow key={it.key} item={it} />)}
    </div>
  );

  const BlockBlock = ({ block }) => {
    const open = openBlock === block.key;
    const pct = Math.round(block.percent);
    return (
      <div style={{ background: "white", borderRadius: "8px", border: "1px solid #f0e8e0", padding: "14px", marginBottom: "8px" }}>
        <div
          onClick={() => setOpenBlock(open ? "" : block.key)}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", cursor: "pointer" }}
        >
          <div style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
            <div style={{ backgroundColor: block.color, width: "12px", height: "12px", borderRadius: "50%", marginRight: "12px", flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, color: "#5d4037", fontSize: "14px" }}>{block.label}</div>
              <div style={{ fontSize: "11.5px", color: "#8d6e63", fontStyle: "italic" }}>
                {pct}% × {block.blockWeight}% weight = {Math.round(pct * (block.blockWeight / 100) * 10) / 10} points of the final score
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "80px", height: "8px", background: "#f3e8dc", borderRadius: "4px", overflow: "hidden", border: "1px solid #d6b88a" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: barColor(pct), borderRadius: "4px", transition: "width 0.3s ease" }} />
            </div>
            <span style={{ fontWeight: 600, color: "#5d4037", fontSize: "14px", minWidth: "35px", textAlign: "right" }}>{pct}%</span>
            <ChevronDown size={16} style={{ color: "#a1887f", flexShrink: 0, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }} />
          </div>
        </div>

        {open && (
          <div style={{ borderTop: "1px dashed #e8d8cf", paddingTop: "10px", marginTop: "10px", fontSize: "12.5px", color: "#6d4c41", lineHeight: 1.7 }}>
            {(block.subCategories || block.components || []).map((c) => (
              <ContainerRow
                key={c.key}
                label={c.label}
                weight={c.weight}
                percent={c.percent}
                effectiveWeight={c.effectiveWeight}
                excluded={c.excluded}
                exclusionNote={c.exclusionNote}
                reductionNote={c.reductionNote}
                items={c.items}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTierBadge = () => {
    if (!a?.fundingActive) return null;
    const c = TIER_BADGE_COLORS[fundingTier];
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", backgroundColor: c.bg, border: `1px solid ${c.border}`, borderRadius: "20px", padding: "6px 14px", fontSize: "12px", fontWeight: 600, color: c.text, marginTop: "8px" }}>
        <span>🏷</span>
        <span>Tier {fundingTier}: {TIER_LABELS[fundingTier]}</span>
      </div>
    );
  };

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
            <span>Score breakdown</span>
            <ChevronDown size={16} />
          </button>
        </div>

        <style>{`@keyframes pulse { 0%,100% { transform:scale(1); opacity:1; } 50% { transform:scale(1.05); opacity:0.7; } }`}</style>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999999, padding: "20px" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            style={{ position: "relative", backgroundColor: "#ffffff", borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto", width: "90%", maxWidth: "780px", border: "1px solid #ccc" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              style={{ position: "absolute", top: "15px", right: "15px", background: "#fff", border: "2px solid #ddd", fontSize: "20px", cursor: "pointer", color: "#666", zIndex: 2, width: "35px", height: "35px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontWeight: "bold" }}
            >
              {"×"}
            </button>

            <div style={{ padding: "30px 20px 20px 20px" }}>
              <h3 style={{ margin: "0 0 20px 0", fontSize: "24px", fontWeight: 600, color: "#5d4037", textAlign: "center" }}>
                Capital appeal breakdown
              </h3>

              <div style={{ textAlign: "center", padding: "20px", background: "linear-gradient(135deg,#fdf8f6 0%,#f3e8dc 100%)", borderRadius: "12px", border: "1px solid #d6b88a" }}>
                <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "120px", height: "120px", border: `4px solid ${scoreLevel.color}`, borderRadius: "50%", background: "white", boxShadow: "0 4px 12px rgba(139,69,19,0.2)", marginBottom: "12px" }}>
                  <span style={{ fontSize: "28px", fontWeight: 700, color: "#5d4037", lineHeight: 1 }}>{fundabilityScore}%</span>
                  <span style={{ color: scoreLevel.color, fontSize: "12px", fontWeight: 600, marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{scoreLevel.level}</span>
                </div>

                <div style={{ fontSize: "14px", color: "#6d4c41" }}>
                  Business stage:{" "}
                  <strong style={{ color: "#5d4037", textTransform: "capitalize" }}>
                    {profileData?.entityOverview?.operationStage || "Ideation"}
                  </strong>
                </div>

                {renderTierBadge()}

                {a && (
                  <div style={{ fontSize: "11.5px", color: "#8d6e63", marginTop: "6px" }}>
                    {a.fundingActive
                      ? `Financial Strength ${a.blockWeights.financialStrength}% · Fundability ${a.blockWeights.fundability}%`
                      : `No funding application on file — scored on Financial Strength alone, weighted ${a.blockWeights.financialStrength}% for this stage`}
                  </div>
                )}

                {a && a.availablePoints > 0 && (
                  <div style={{ marginTop: "10px", display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 16px", background: "#e8f5e9", border: "1px solid #c8e6c9", borderRadius: "20px", color: "#1B5E20", fontWeight: 700, fontSize: "12px" }}>
                    <Target size={13} /> {fmtPts(a.availablePoints)} available · potential score {Math.round(a.totalRaw + a.availablePoints)}%
                  </div>
                )}

                {a && a.lockedPoints > 0 && (
                  <div style={{ marginTop: "8px", fontSize: "11.5px", color: "#8d6e63", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <Lock size={11} /> A further {fmtPts(a.lockedPoints)} follows your financial position rather than the form.
                  </div>
                )}

                {a?.statements?.present && (
                  <div style={{ marginTop: "8px", fontSize: "11.5px", color: "#2E7D32", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <CheckCircle size={11} /> Financial statements read and scored
                    {a.statements.overallScore !== null ? ` — ${a.statements.overallScore}/5 overall` : ""}
                  </div>
                )}

                {evaluationTimestamp && (
                  <div style={{ fontSize: "11.5px", color: "#8d6e63", marginTop: "8px" }}>Last evaluated: {evaluationTimestamp}</div>
                )}

                {!aiEvaluationResult && (
                  <div style={{ marginTop: "14px" }}>
                    <button
                      onClick={refreshAiEvaluation}
                      disabled={isEvaluating || !apiKey}
                      style={{ padding: "10px 20px", backgroundColor: isEvaluating ? "#8d6e63" : "#5d4037", color: "white", border: "none", borderRadius: "6px", fontWeight: 600, cursor: isEvaluating || !apiKey ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", opacity: isEvaluating || !apiKey ? 0.7 : 1 }}
                    >
                      <RefreshCw size={16} className={isEvaluating ? "spin" : ""} />
                      {isEvaluating ? "Loading analysis..." : "Load AI analysis"}
                    </button>
                    {!apiKey && (
                      <p style={{ fontSize: "12px", color: "#f44336", marginTop: "8px" }}>
                        <AlertCircle size={14} style={{ verticalAlign: "-2px" }} /> AI analysis requires API key configuration
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* ── Fundability is 60% and it is not being scored ── */}
              {fundabilityStatus && (
                <div style={{ marginTop: "16px", padding: "14px 16px", background: "#fff8e1", border: "2px solid #e8d0a8", borderRadius: "8px" }}>
                  <div style={{ fontWeight: 800, color: "#8a5a00", marginBottom: "6px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    <AlertCircle size={14} /> Fundability is not being scored — {fundabilityStatus.headline}
                  </div>

                  <div style={{ fontSize: "12.5px", color: "#6d4c41", lineHeight: 1.7, marginBottom: "10px" }}>
                    {fundabilityStatus.detail}
                  </div>

                  {fundabilityStatus.missing.length > 0 && (
                    <div style={{ background: "white", border: "1px solid #e8d0a8", borderRadius: "6px", padding: "10px 12px", marginBottom: "10px" }}>
                      <div style={{ fontSize: "10px", fontWeight: 800, color: "#8a5a00", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "6px" }}>
                        Outstanding sections
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {fundabilityStatus.missing.map((k) => (
                          <span key={k} style={{ fontSize: "11.5px", color: "#8a5a00", background: "#fff8e1", border: "1px solid #e8d0a8", borderRadius: "12px", padding: "3px 10px" }}>
                            {FUNDING_SECTION_LABELS[k] || k}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {fundabilityStatus.evidenceNote && (
                    <div style={{ fontSize: "12px", color: "#2E7D32", background: "#f1f8f1", border: "1px solid #c8e6c9", borderRadius: "6px", padding: "9px 11px", marginBottom: "10px", lineHeight: 1.6 }}>
                      {fundabilityStatus.evidenceNote}
                    </div>
                  )}

                  <button
                    onClick={() => goTo(fundabilityStatus.route)}
                    style={{ padding: "9px 16px", background: "linear-gradient(135deg,#5d4037 0%,#4a2c20 100%)", color: "white", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    {fundabilityStatus.cta} <span style={{ fontSize: "13px" }}>→</span>
                  </button>
                </div>
              )}

              {/* ── Statements disagree with the profile ── */}
              {a?.statements?.hasDiscrepancy && (
                <div style={{ marginTop: "16px", padding: "14px 16px", background: "#fff6e8", border: "1px solid #e8d0a8", borderRadius: "8px" }}>
                  <div style={{ fontWeight: 800, color: "#8a5a00", marginBottom: "6px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    <AlertCircle size={14} /> Your statements and your profile disagree
                  </div>
                  <div style={{ fontSize: "12.5px", color: "#6d4c41", lineHeight: 1.7, marginBottom: "10px" }}>
                    The analysis of your uploaded financial statements found figures that do not match what is captured on your Financial Overview. This matters more than it looks: the profile is what gets scored, so where the statements are stronger you are being <strong>under-scored</strong>, and where they are weaker a funder will find the difference in due diligence. Either way it is worth reconciling before you apply.
                  </div>
                  {a.statements.summary && (
                    <div style={{ fontSize: "12px", color: "#5d4037", background: "white", border: "1px solid #e8d0a8", borderRadius: "6px", padding: "10px 12px", lineHeight: 1.7, marginBottom: "10px" }}>
                      {a.statements.summary}
                    </div>
                  )}
                  <button
                    onClick={() => goTo("/profile?section=financialOverview")}
                    style={{ padding: "8px 14px", background: "linear-gradient(135deg,#5d4037 0%,#4a2c20 100%)", color: "white", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    Reconcile on Financial Overview <span style={{ fontSize: "13px" }}>→</span>
                  </button>
                </div>
              )}

              
              {/* ── About ── */}
              <Section title="About the Capital Appeal score" open={showAboutScore} onToggle={() => setShowAboutScore(!showAboutScore)}>
                <div style={{ color: "#5d4037", fontSize: "13px", lineHeight: 1.6 }}>
                  <p style={{ marginBottom: "16px" }}>
                    Capital Appeal measures whether this business can absorb, deploy and return capital. Two blocks: Financial Strength, and Fundability — which activates on a completed funding application and whose sub-component weights follow your funding tier.
                  </p>

                  <div style={{ backgroundColor: "#efebe9", padding: "16px", borderRadius: "8px", marginBottom: "16px", borderLeft: "4px solid #8d6e63" }}>
                    <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>How a point value is worked out</p>
                    <p style={{ margin: 0, fontFamily: "monospace", fontSize: "12px", backgroundColor: "white", padding: "8px 10px", borderRadius: "6px", border: "1px solid #e0d5c8" }}>
                      value = (item points withheld ÷ container points) × block weight × component weight
                    </p>
                    <p style={{ margin: "8px 0 0 0" }}>
                      The score is calculated in code, not by the AI. The AI reads the finished numbers and explains them, which is what lets a figure like +3.4% be a promise rather than an estimate.
                    </p>
                  </div>

                  {a && (
                    <div style={{ backgroundColor: "#efebe9", padding: "16px", borderRadius: "8px", marginBottom: "16px", borderLeft: "4px solid #8d6e63" }}>
                      <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>Weighting within Financial Strength</p>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                        <thead>
                          <tr style={{ color: "#6d4c41" }}>
                            <th style={{ textAlign: "left", padding: "4px 6px" }}>Factor</th>
                            <th style={{ textAlign: "right", padding: "4px 6px" }}>Weight</th>
                            <th style={{ textAlign: "right", padding: "4px 6px" }}>Now</th>
                          </tr>
                        </thead>
                        <tbody>
                          {a.financialStrength.subCategories.map((sc) => (
                            <tr key={sc.key} style={{ color: "#5d4037" }}>
                              <td style={{ padding: "4px 6px" }}>{sc.label}</td>
                              <td style={{ padding: "4px 6px", textAlign: "right" }}>{sc.weight}%</td>
                              <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: 700 }}>{Math.round(sc.percent)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p style={{ margin: "8px 0 0 0", fontSize: "11.5px", fontStyle: "italic", color: "#6d4c41" }}>
                        This weighting is applied in code against the fields on your Financial Overview — it is the arithmetic, not a guide.
                      </p>
                    </div>
                  )}

                  {a?.fundingActive && (
                    <div style={{ backgroundColor: "#efebe9", padding: "16px", borderRadius: "8px", marginBottom: "16px", borderLeft: "4px solid #8d6e63" }}>
                      <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>
                        Weighting within Fundability — Tier {fundingTier}: {TIER_LABELS[fundingTier]}
                      </p>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                        <thead>
                          <tr style={{ color: "#6d4c41" }}>
                            <th style={{ textAlign: "left", padding: "4px 6px" }}>Sub-component</th>
                            <th style={{ textAlign: "right", padding: "4px 6px" }}>Weight</th>
                            <th style={{ textAlign: "right", padding: "4px 6px" }}>Now</th>
                          </tr>
                        </thead>
                        <tbody>
                          {a.fundabilityComponents.map((c) => (
                            <tr key={c.key} style={{ color: c.excluded ? "#a1887f" : "#5d4037" }}>
                              <td style={{ padding: "4px 6px" }}>{c.label}</td>
                              <td style={{ padding: "4px 6px", textAlign: "right" }}>{c.weight}%</td>
                              <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: 700 }}>
                                {c.excluded ? "—" : `${Math.round(c.percent)}%`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p style={{ margin: "8px 0 0 0", fontSize: "11.5px", fontStyle: "italic", color: "#6d4c41" }}>
                        A sub-component at 0% is excluded for your tier. It is not a gap and costs you nothing.
                      </p>
                    </div>
                  )}

                  <div style={{ backgroundColor: "#efebe9", padding: "16px", borderRadius: "8px", marginBottom: "16px", borderLeft: "4px solid #8d6e63" }}>
                    <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>Points that cannot be claimed back</p>
                    <p style={{ margin: 0 }}>
                      A credit score band, a solvency position and a current ratio are what your records say, not what the form says. Capturing the numbers is an action and is listed in Potential points; the position itself is shown as a fixed deduction and kept out of the total, because listing it as an action would imply you could type your way to a better balance sheet.
                    </p>
                  </div>

                  <div style={{ backgroundColor: "#efebe9", padding: "16px", borderRadius: "8px", borderLeft: "4px solid #8d6e63" }}>
                    <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>Score bands</p>
                    <ul style={{ margin: 0, paddingLeft: "20px" }}>
                      {[["91–100%", "Highly fundable"], ["81–90%", "Strong investment case"], ["61–80%", "Moderate potential"], ["41–60%", "Basic potential"], ["0–40%", "Needs development"]].map(([r, l]) => (
                        <li key={r} style={{ marginBottom: "4px" }}><strong>{r}:</strong> {l}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Section>

              {/* ── Potential points ── */}
              {a && (
                <Section
                  title="Potential points"
                  right={a.availablePoints > 0 ? `${fmtPts(a.availablePoints)} to claim` : "All claimed"}
                  open={showPotential}
                  onToggle={() => setShowPotential(!showPotential)}
                >
                  {a.outstanding.length === 0 ? (
                    <div style={{ padding: "14px", background: "#f1f8f1", border: "1px solid #c8e6c9", borderRadius: "8px", color: "#2E7D32", lineHeight: 1.7 }}>
                      <div style={{ fontWeight: 800, marginBottom: "4px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        <CheckCircle size={14} /> Nothing left to claim
                      </div>
                      Everything that can be captured is captured and counted.
                    </div>
                  ) : (
                    <>
                      <div style={{ padding: "16px", background: "linear-gradient(135deg,#fdf8f6 0%,#e8f5e9 100%)", border: "1px solid #c8e6c9", borderRadius: "10px", marginBottom: "14px", textAlign: "center" }}>
                        <div style={{ fontSize: "10px", color: "#1B5E20", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.7px" }}>
                          Your score could reach
                        </div>
                        <div style={{ fontSize: "34px", fontWeight: 800, color: "#1B5E20", lineHeight: 1.2 }}>
                          {Math.round(a.totalRaw + a.availablePoints)}%
                        </div>
                        <div style={{ fontSize: "12.5px", color: "#5d4037", lineHeight: 1.6 }}>
                          {fundabilityScore}% today · <strong style={{ color: "#1B5E20" }}>{fmtPts(a.availablePoints)}</strong> sitting in {a.outstanding.length} item{a.outstanding.length === 1 ? "" : "s"} below
                        </div>
                        <div style={{ fontSize: "11.5px", color: "#8d6e63", marginTop: "6px", fontStyle: "italic" }}>
                          Tap any item to see what it is worth and go straight to the form.
                        </div>
                      </div>

                      {a.outstanding.map((item, i) => (
                        <PotentialItem key={item.key} item={item} index={i} />
                      ))}

                      {a.locked.length > 0 && (
                        <div style={{ marginTop: "12px", padding: "12px", background: "#f5f2f0", border: "1px solid #d7ccc8", borderRadius: "8px", fontSize: "11.5px", color: "#6d4c41", lineHeight: 1.6 }}>
                          <div style={{ fontWeight: 800, marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "10.5px" }}>
                            <Lock size={12} /> Not listed above
                          </div>
                          {a.locked.map((i) => i.label).join("; ")} — worth {fmtPts(a.lockedPoints)}, but these follow your actual credit record and balance sheet rather than anything you can enter. They move as the business does. Left out of the total above rather than dressed up as an action.
                        </div>
                      )}

                      <div style={{ marginTop: "10px", padding: "10px 12px", background: "#f9f5f0", border: "1px solid #e6d3c4", borderRadius: "8px", fontSize: "11.5px", color: "#6d4c41", lineHeight: 1.6 }}>
                        Each figure is the exact amount the score moves when that item is resolved — the same function promises it and awards it.
                      </div>
                    </>
                  )}
                </Section>
              )}

              {/* ── Score breakdown ── */}
              {a && (
                <Section
                  title="Score breakdown"
                  right={`${fundabilityScore}%`}
                  open={showScoreBreakdown}
                  onToggle={() => setShowScoreBreakdown(!showScoreBreakdown)}
                >
                  {a.blocks.map((block) => <BlockBlock key={block.key} block={block} />)}

                  {!a.fundingActive && fundabilityStatus && (
                    <div style={{ marginTop: "4px", padding: "12px", background: "#fff8e1", border: "1px solid #e8d0a8", borderRadius: "8px", fontSize: "11.5px", color: "#8a5a00", lineHeight: 1.7 }}>
                      <strong>Fundability — 60%, not scored.</strong> {fundabilityStatus.headline}. The seven sub-components below it — business plan, pitch deck, impact and mandate, creditworthiness, guarantees, financial resilience and growth potential — are all inactive, so this breakdown shows Financial Strength only.
                    </div>
                  )}
                </Section>
              )}


              {/* ── Detailed analysis ── */}
              <Section title="Detailed analysis" open={showDetailedAnalysis} onToggle={() => setShowDetailedAnalysis(!showDetailedAnalysis)}>
                {aiEvaluationResult ? (
                  <div style={{ backgroundColor: "white", padding: "16px", borderRadius: "8px", border: "1px solid #e8d8cf", maxHeight: "460px", overflowY: "auto" }}>
                    {formatAiResult(aiEvaluationResult)}
                  </div>
                ) : (
                  <div style={{ fontSize: "12.5px", color: "#8d6e63", fontStyle: "italic", display: "flex", alignItems: "center", gap: "6px" }}>
                    <AlertCircle size={14} /> No AI analysis yet — the score and point values above are already final and do not depend on it.
                  </div>
                )}
                {aiEvaluationResult && (
                  <div style={{ marginTop: "12px", textAlign: "right" }}>
                    <button
                      onClick={refreshAiEvaluation}
                      disabled={isEvaluating || !apiKey}
                      style={{ padding: "8px 14px", backgroundColor: "#5d4037", color: "white", border: "none", borderRadius: "6px", fontWeight: 600, fontSize: "12px", cursor: isEvaluating ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: "6px", opacity: isEvaluating ? 0.7 : 1 }}
                    >
                      <RefreshCw size={14} className={isEvaluating ? "spin" : ""} />
                      {isEvaluating ? "Refreshing..." : "Refresh analysis"}
                    </button>
                  </div>
                )}
                {evaluationError && (
                  <div style={{ marginTop: "12px", padding: "12px", backgroundColor: "#f8d7da", color: "#721c24", border: "1px solid #f5c6cb", borderRadius: "6px", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <AlertCircle size={16} /> {evaluationError}
                  </div>
                )}
              </Section>
            </div>
          </div>
        </div>
      )}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </>
  );
}