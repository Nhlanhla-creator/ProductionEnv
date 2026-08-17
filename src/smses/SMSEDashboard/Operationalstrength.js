"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  RefreshCw,
  AlertCircle,
  Settings,
  CheckCircle,
  Target,
  Lock,
} from "lucide-react";
import { db, auth } from "../../firebaseConfig";
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { useFirebaseFunctions } from "./hooks";

// ─────────────────────────────────────────────────────────────────────────
// OPERATIONAL STRENGTH
//
// Scored ENTIRELY from OperationsOverview.js — nothing else, except
// entityOverview.economicSectors, used only to sanity-check whether the
// declared premises type fits the declared business.
//
// WHAT CHANGED, AND WHY IT HAD TO
//
//   This card used to let the AI assign each category a 0–5 score, with a
//   deterministic fallback used only until the AI ran. That is incompatible
//   with promising a business "+7.5% if you answer this question": the AI
//   could return a different number next run, so the promise would be a
//   guess wearing a decimal point.
//
//   So the arithmetic is now always the code, exactly as in the legitimacy
//   and compliance cards. Every answer on the form is an ITEM worth a fixed
//   number of item points. Items sum to a category percentage, the category
//   percentage is multiplied by its weight, and that is the score. The AI
//   never touches a number — it explains what was counted, what was withheld
//   and why, and what to do next.
//
//   NOT EVERYTHING WITHHELD IS CLAIMABLE. "No major incidents in the past
//   24 months" cannot be earned by editing a form, so it is shown as a
//   deduction in the breakdown but kept out of Potential points. Offering it
//   as an action would be dishonest.
//
// Category 4 of 5 in the taxonomy:
//   1. Compliance  2. Legitimacy  3. Leadership & Governance
//   4. Operational Strength (this file)  5. Financial Strength / Capital Appeal
// ─────────────────────────────────────────────────────────────────────────

const PROFILE_ROUTE = "/profile";
const OPS_SECTION = "operationsOverview";

// The profile page renders every section from one route via `activeSection`,
// so we deep-link with ?section=<id>. `field` lets the form scroll to and
// highlight the exact question, the same way My Documents highlights a row.
const routeToField = (field) =>
  `${PROFILE_ROUTE}?section=${OPS_SECTION}${field ? `&field=${encodeURIComponent(field)}` : ""}`;

const CATEGORY_LABELS = {
  supplierContinuity: "Supplier & Continuity Risk",
  delivery: "Delivery (Productivity & Reliability)",
  safety: "Safety (Risk & Compliance)",
  premises: "Premises & Facilities",
};

const CATEGORY_WEIGHTS = {
  supplierContinuity: 25,
  delivery: 30,
  safety: 20,
  premises: 25,
};

const CATEGORY_COLORS = {
  supplierContinuity: "#8D6E63",
  delivery: "#6D4C41",
  safety: "#A67C52",
  premises: "#D7CCC8",
};

// Which form section each category comes from, for the "where" text.
const CATEGORY_SECTION = {
  supplierContinuity: "Section 4",
  delivery: "Section 6",
  safety: "Section 7",
  premises: "Section 5",
};

const STATE_STYLE = {
  counted: { dot: "#4CAF50", label: "Counted in full", text: "#2E7D32" },
  partial: { dot: "#FF9800", label: "Partly counted", text: "#EF6C00" },
  missing: { dot: "#F44336", label: "Not answered", text: "#C62828" },
  negative: { dot: "#B71C1C", label: "Answered — counts against you", text: "#B71C1C" },
  na: { dot: "#90A4AE", label: "Not applicable", text: "#546E7A" },
};

// Sectors where a business realistically needs production/storage/workshop
// space — used only to check whether the declared premises type fits the
// declared business, never to penalise a services business for using an office.
const PHYSICAL_SECTOR_KEYWORDS = [
  "manufactur", "agricult", "construction", "mining", "logistics",
  "warehous", "food", "industrial", "fabrication", "processing",
];

const sectorNeedsPhysicalPremises = (sectors = []) =>
  (sectors || []).some((s) =>
    PHYSICAL_SECTOR_KEYWORDS.some((k) => String(s || "").toLowerCase().includes(k))
  );

const cleanStr = (v) =>
  typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();

const isYes = (v) => v === true || /^yes$/i.test(cleanStr(v));
const isNo = (v) => v === false || /^no$/i.test(cleanStr(v));
const answered = (v) => cleanStr(v) !== "" && v !== null && v !== undefined;

// ─────────────────────────────────────────────────────────────────────────
// THE SCORER
//   earned     = round(points × credit)
//   pointValue = (points − earned) ÷ categoryPossible × categoryWeight
// ─────────────────────────────────────────────────────────────────────────
const mk = ({
  key, label, points, field, guidance, importance,
  credit, evidence, reason, fix, claimable = true, applicable = true, state,
}) => {
  const c = Math.max(0, Math.min(1, credit || 0));
  const earned = Math.round(points * c);
  return {
    key, label, points, field, guidance, importance,
    credit: c, earned, withheld: points - earned,
    evidence: evidence || "",
    reason: reason || null,
    fix: fix || null,
    claimable,
    applicable,
    where: routeToField(field),
    state: state || (c >= 1 ? "counted" : c > 0 ? "partial" : "missing"),
  };
};

const buildOperationalAssessment = (data) => {
  const ops = data?.operationsOverview || {};
  const sectors = data?.entityOverview?.economicSectors || [];

  // ── 1. Supplier & Continuity Risk ──
  const multi = ops.multipleSuppliers;
  const namedSuppliers = [1, 2, 3].filter((n) => cleanStr(ops[`supplier${n}Name`])).length;
  const SUPPLIER_TARGET = 2;

  const supplierItems = [
    mk({
      key: "multipleSuppliers",
      label: "More than one key supplier for critical inputs",
      points: 35,
      field: "multipleSuppliers",
      importance:
        "Single-supplier dependency is the most common way a small business stops trading overnight.",
      guidance:
        "A second approved supplier for your most critical input is enough to answer yes — it does not have to be one you buy from every month.",
      credit: isYes(multi) ? 1 : 0,
      evidence: answered(multi) ? cleanStr(multi) : "",
      state: isNo(multi) ? "negative" : undefined,
      reason: isNo(multi)
        ? "You rely on a single key supplier, which a funder reads as concentration risk."
        : null,
      fix: isNo(multi)
        ? "Identify and record a second approved supplier for your most critical input, then update this answer."
        : null,
    }),
    mk({
      key: "supplierNames",
      label: `Named supplier references (${namedSuppliers} of ${SUPPLIER_TARGET} expected)`,
      points: 25,
      field: "supplier1Name",
      applicable: isYes(multi), // the form only asks for names when this is yes
      importance:
        "A yes with no names behind it is an assertion; names make it verifiable.",
      credit: Math.min(namedSuppliers / SUPPLIER_TARGET, 1),
      evidence: namedSuppliers
        ? [1, 2, 3].map((n) => cleanStr(ops[`supplier${n}Name`])).filter(Boolean).join(", ")
        : "",
      reason:
        isYes(multi) && namedSuppliers < SUPPLIER_TARGET
          ? "You indicated multiple suppliers, but fewer than two are named."
          : null,
      fix:
        isYes(multi) && namedSuppliers < SUPPLIER_TARGET
          ? `Add ${SUPPLIER_TARGET - namedSuppliers} more supplier name${SUPPLIER_TARGET - namedSuppliers === 1 ? "" : "s"} under Section 4.`
          : null,
    }),
    mk({
      key: "contingencyPlan",
      label: "Documented contingency or continuity plan",
      points: 40,
      field: "contingencyPlan",
      importance:
        "Shows a funder you have thought about what happens when something goes wrong, before it does.",
      guidance:
        "A one-page document naming your backup supplier, backup premises and who decides in a crisis satisfies this.",
      credit: isYes(ops.contingencyPlan) ? 1 : 0,
      evidence: answered(ops.contingencyPlan) ? cleanStr(ops.contingencyPlan) : "",
    }),
  ];

  // ── 2. Delivery ──
  const deliveryItems = [
    mk({
      key: "trackPerformanceMetrics",
      label: "Tracks operational performance metrics",
      points: 35,
      field: "trackPerformanceMetrics",
      importance: "A business that measures delivery can prove delivery.",
      guidance:
        "On-time delivery rate, defect rate or job completion time counts — a spreadsheet is enough.",
      credit: isYes(ops.trackPerformanceMetrics) ? 1 : 0,
      evidence: answered(ops.trackPerformanceMetrics) ? cleanStr(ops.trackPerformanceMetrics) : "",
    }),
    mk({
      key: "threeSuccessfulDeliveries",
      label: "Three or more contracts delivered in the past 12 months",
      points: 35,
      field: "threeSuccessfulDeliveries",
      importance: "The single strongest evidence of real commercial delivery.",
      credit: isYes(ops.threeSuccessfulDeliveries) ? 1 : 0,
      evidence: answered(ops.threeSuccessfulDeliveries) ? cleanStr(ops.threeSuccessfulDeliveries) : "",
    }),
    mk({
      key: "hasCapacityToIncrease",
      label: "Capacity to increase output without compromising quality",
      points: 30,
      field: "hasCapacityToIncrease",
      importance:
        "Funders lend against growth. Headroom is what makes the funding usable.",
      credit: isYes(ops.hasCapacityToIncrease) ? 1 : 0,
      evidence: answered(ops.hasCapacityToIncrease) ? cleanStr(ops.hasCapacityToIncrease) : "",
    }),
  ];

  // ── 3. Safety ──
  const hadIncidents = isYes(ops.hasMajorIncidents);
  const safetyItems = [
    mk({
      key: "hasFormalProcedures",
      label: "Formal safety, risk or compliance procedures",
      points: 60,
      field: "hasFormalProcedures",
      importance:
        "Required before most corporates will place you on a supplier database at all.",
      guidance:
        "A written health and safety procedure with a named responsible person satisfies this.",
      credit: isYes(ops.hasFormalProcedures) ? 1 : 0,
      evidence: answered(ops.hasFormalProcedures) ? cleanStr(ops.hasFormalProcedures) : "",
    }),
    mk({
      key: "hasMajorIncidents",
      label: "No major operational incidents in the past 24 months",
      points: 40,
      field: "hasMajorIncidents",
      importance: "A clean 24-month record is what an insurer and a funder both check.",
      credit: isNo(ops.hasMajorIncidents) ? 1 : 0,
      claimable: !hadIncidents, // a disclosed incident cannot be un-disclosed
      state: hadIncidents ? "negative" : undefined,
      evidence: answered(ops.hasMajorIncidents) ? cleanStr(ops.hasMajorIncidents) : "",
      reason: hadIncidents
        ? "You disclosed a major incident in the past 24 months. Disclosure is the right call — these points cannot be recovered by editing the form, and they return once the incident falls outside the 24-month window."
        : null,
      fix: hadIncidents
        ? null
        : "Answer the incident question under Section 7.",
    }),
  ];

  // ── 4. Premises & Facilities ──
  const needsPhysical = sectorNeedsPhysicalPremises(sectors);
  const fitTypes = ["warehouse", "factory", "workshop"];
  const hasFitPremises = fitTypes.includes(cleanStr(ops.premisesType).toLowerCase());
  const expiry = ops.leaseExpiryDate ? new Date(ops.leaseExpiryDate) : null;
  const monthsToExpiry =
    expiry && !isNaN(expiry.getTime())
      ? (expiry - new Date()) / (1000 * 60 * 60 * 24 * 30)
      : null;

  let tenureCredit = 0;
  let tenureReason = null;
  let tenureFix = null;
  let tenureField = "premisesStatus";

  if (cleanStr(ops.premisesStatus).toLowerCase() === "owned") {
    tenureCredit = 1;
  } else if (cleanStr(ops.premisesStatus).toLowerCase() === "rented") {
    tenureField = "leaseExpiryDate";
    if (monthsToExpiry === null) {
      tenureCredit = 0.5;
      tenureReason = "Premises are rented, but no lease expiry date is recorded.";
      tenureFix = "Add the lease expiry date under Section 5.";
    } else if (monthsToExpiry > 6) {
      tenureCredit = 0.85;
      tenureReason = null;
    } else {
      tenureCredit = 0.15;
      tenureReason = `The lease expires in about ${Math.max(0, Math.round(monthsToExpiry))} month${Math.round(monthsToExpiry) === 1 ? "" : "s"}, which reads as a continuity risk.`;
      tenureFix = "Renew or extend the lease, then update the expiry date under Section 5.";
    }
  }

  const premisesItems = [
    mk({
      key: "tenure",
      label: "Security of tenure",
      points: 30,
      field: tenureField,
      importance: "A funder wants to know you will still be at this address next year.",
      credit: tenureCredit,
      evidence: [
        cleanStr(ops.premisesStatus),
        expiry && !isNaN(expiry.getTime()) ? `lease to ${expiry.toLocaleDateString()}` : "",
      ].filter(Boolean).join(" · "),
      reason: tenureReason,
      fix: tenureFix,
    }),
    mk({
      key: "premisesFit",
      label: "Premises suited to the business",
      points: 30,
      field: "premisesType",
      importance: needsPhysical
        ? "Your declared sector needs production or storage space; an office alone leaves capacity unverified."
        : "Recording the premises type tells a funder how you operate.",
      guidance: needsPhysical
        ? "If you have a workshop, warehouse or factory, record it here — it is often simply unrecorded rather than absent."
        : null,
      credit: needsPhysical
        ? (hasFitPremises ? 1 : 0.15)
        : (cleanStr(ops.premisesType) ? 1 : 0.5),
      evidence: cleanStr(ops.premisesType),
      reason:
        needsPhysical && !hasFitPremises
          ? `Your sector normally needs production or storage space, but the premises recorded ${cleanStr(ops.premisesType) ? `is "${cleanStr(ops.premisesType)}"` : "is blank"}.`
          : null,
      fix:
        needsPhysical && !hasFitPremises
          ? "Record your workshop, warehouse or factory under Section 5, or explain the arrangement in Operational Challenges."
          : null,
    }),
    mk({
      key: "premisesSize",
      label: "Premises size recorded",
      points: 20,
      field: "premisesSize",
      importance: "Gives scale to everything else you claim about capacity.",
      credit: Number(ops.premisesSize) > 0 ? 1 : 0,
      evidence: Number(ops.premisesSize) > 0 ? `${ops.premisesSize} sqm` : "",
    }),
    mk({
      key: "branches",
      label: "Branch footprint recorded",
      points: 20,
      field: "hasBranches",
      importance: "Multiple sites are an asset, but only if a funder can see where they are.",
      credit: isYes(ops.hasBranches)
        ? (cleanStr(ops.numberOfBranches) && cleanStr(ops.branchLocations) ? 1 : 0.3)
        : isNo(ops.hasBranches)
        ? 1
        : 0,
      evidence: isYes(ops.hasBranches)
        ? `${cleanStr(ops.numberOfBranches) || "?"} branch(es)${cleanStr(ops.branchLocations) ? ` · ${cleanStr(ops.branchLocations)}` : ""}`
        : answered(ops.hasBranches)
        ? "No branches"
        : "",
      reason:
        isYes(ops.hasBranches) && !(cleanStr(ops.numberOfBranches) && cleanStr(ops.branchLocations))
          ? "Branches are indicated, but the number and locations are incomplete."
          : null,
      fix:
        isYes(ops.hasBranches) && !(cleanStr(ops.numberOfBranches) && cleanStr(ops.branchLocations))
          ? "Add the number of branches and their locations under Section 5."
          : null,
    }),
  ];

  // ── Assemble ──
  const groups = {
    supplierContinuity: supplierItems,
    delivery: deliveryItems,
    safety: safetyItems,
    premises: premisesItems,
  };

  let totalRaw = 0;

  const categories = Object.entries(groups).map(([key, all]) => {
    const items = all.filter((i) => i.applicable);
    const possible = items.reduce((s, i) => s + i.points, 0) || 1;
    const earned = items.reduce((s, i) => s + i.earned, 0);
    const percent = (earned / possible) * 100;
    const weight = CATEGORY_WEIGHTS[key];
    totalRaw += percent * (weight / 100);

    const scored = items.map((i) => ({
      ...i,
      pointValue: (i.withheld / possible) * weight,
      maxPointValue: (i.points / possible) * weight,
      category: key,
      categoryLabel: CATEGORY_LABELS[key],
      formSection: CATEGORY_SECTION[key],
    }));

    return {
      key,
      label: CATEGORY_LABELS[key],
      color: CATEGORY_COLORS[key],
      formSection: CATEGORY_SECTION[key],
      weight,
      items: scored,
      earned,
      possible,
      percent: Math.round(percent),
      rawScore: Math.round((percent / 20) * 10) / 10,
      weightedScore: Math.round(percent * (weight / 100) * 10) / 10,
      headroom: Math.round((100 - percent) * (weight / 100) * 10) / 10,
    };
  });

  const allItems = categories.flatMap((c) => c.items);
  const withheldItems = allItems.filter((i) => i.withheld > 0);
  const outstanding = withheldItems
    .filter((i) => i.claimable)
    .sort((x, y) => y.pointValue - x.pointValue);
  const locked = withheldItems.filter((i) => !i.claimable);

  return {
    ops,
    categories,
    allItems,
    outstanding,
    locked,
    totalRaw,
    totalScore: Math.round(totalRaw),
    availablePoints:
      Math.round(outstanding.reduce((s, i) => s + i.pointValue, 0) * 10) / 10,
    lockedPoints:
      Math.round(locked.reduce((s, i) => s + i.pointValue, 0) * 10) / 10,
  };
};

const fmtPts = (n) =>
  `${n >= 0 ? "+" : ""}${(Math.round(n * 10) / 10).toFixed(1)}%`;

// ─────────────────────────────────────────────────────────────────────────
// NARRATIVE PROMPT — finished numbers in, explanation out.
// The context-only sections are passed as colour, never as a graded category.
// ─────────────────────────────────────────────────────────────────────────
const buildContextBlock = (ops) => {
  let out = "";
  out += `Contracts out part of value chain: ${cleanStr(ops.outsourcesValueChain) || "Not specified"}\n`;
  if (isYes(ops.outsourcesValueChain)) {
    out += `Outsourced services: ${cleanStr(ops.outsourcedServices) || "Not specified"}\n`;
    out += `Annual value of outsourced services: ${ops.outsourcedValue ? `${ops.outsourcedValue} ${ops.outsourcedCurrency || "ZAR"}` : "Not specified"}\n`;
  }
  out += `Import/Export status: ${cleanStr(ops.importExport) || "none"}\n`;
  if (ops.importExport && ops.importExport !== "none") {
    out += `Annual import/export value: ${ops.importExportValue ? `${ops.importExportValue} ${ops.importExportCurrency || "ZAR"}` : "Not specified"}\n`;
  }
  out += `Operates on a contract basis: ${cleanStr(ops.operatesOnContract) || "Not specified"}\n`;
  if (isYes(ops.operatesOnContract)) {
    out += `Total contracts value: ${ops.totalContractValue ? `${ops.totalContractValue} ${ops.contractCurrency || "ZAR"}` : "Not specified"}\n`;
  }
  out += `Operational challenges (free text): ${cleanStr(ops.operationalChallenges) || "Not specified"}\n`;
  return out;
};

const buildOperationalPrompt = (a) => {
  const line = (i) => {
    const status =
      i.state === "missing"
        ? "NOT ANSWERED"
        : i.withheld === 0
        ? "COUNTED IN FULL"
        : `${i.earned}/${i.points} item points — ${i.withheld} withheld`;
    return `  - ${i.label}: ${status}${i.evidence ? ` — on file: ${i.evidence}` : ""}${i.reason ? ` — ${i.reason}` : ""}${
      i.withheld > 0
        ? i.claimable
          ? ` — recoverable ${fmtPts(i.pointValue)} via Operations Overview, ${i.formSection}`
          : ` — ${fmtPts(i.pointValue)} NOT RECOVERABLE by editing the form`
        : ""
    }`;
  };

  const block = (c) => `
### ${c.label}
Score: ${c.rawScore}/5 (${c.percent}%), weighted ${c.weight}% = ${c.weightedScore} points of the final score. Unclaimed here: ${c.headroom}%.
${c.items.map(line).join("\n")}`;

  return `You are writing the operational strength section of a funding-readiness report.

EVERY NUMBER BELOW IS FINAL. You do not calculate, adjust or re-derive anything. Your job is to explain what was counted, what was withheld and why, and what to do next. Stating a different number is an error.

ONLY the data below exists. Do not invent, assume or infer any operational detail — headcount, technology, revenue, team size — that is not here. None of it is collected on this form. Where an item says NOT ANSWERED, treat it as unproven, never as a positive.

An item marked NOT RECOVERABLE must never appear as a recommendation. Explain it as a fixed deduction and say plainly that it cannot be undone by editing the form.

FINAL SCORE: ${a.totalScore}%
Recoverable in total: ${a.availablePoints}%${a.lockedPoints > 0 ? `\nFixed deductions that cannot be recovered: ${a.lockedPoints}%` : ""}
${a.categories.map(block).join("\n")}

CONTEXT ONLY — never scored, may only be referenced in the Final Analysis as qualitative colour. These are either free text or genuinely double-edged (importing can mean market diversification or forex exposure, and the form does not capture which):
${buildContextBlock(a.ops)}

RULES
- Where points were withheld on something that WAS answered, lead with that — it is more useful than listing blanks.
- Every recommendation must be an item above, must be marked recoverable, and must carry its exact value.
- Never invent an improvement that is not on the list — it cannot earn anything.
- Plain business English. Short sentences.

OUTPUT FORMAT — follow exactly, including bold labels:

### 1. Supplier & Continuity Risk
**Score:** ${a.categories[0].rawScore}/5 (${a.categories[0].percent}%) · weighted ${a.categories[0].weight}%
**Evidence:** [what was counted]
**Points withheld:** [one bullet per item with points withheld, as: - Item — reason — **+X.X%** to recover via Section N. If none: "None — everything answered was counted in full."]
**Rationale:** [2–3 sentences on what this means to a funder]
**Points available:** [one bullet per outstanding item, as: - → Section N: action — **+X.X%**. If none: "None — this category is complete."]

### 2. Delivery (Productivity & Reliability)
[the same five labels]

### 3. Safety (Risk & Compliance)
[the same five labels]

### 4. Premises & Facilities
[the same five labels]

### Overall Assessment
**Total score:** ${a.totalScore}%
**Recoverable:** ${a.availablePoints}%
**Highest-value next step:** [the single top recoverable item, its section and exact value]
**Final analysis:** [short paragraph: where this business stands operationally, any colour from the context-only data, and what the score becomes once the top three recoverable items are resolved]`;
};

// ═════════════════════════════════════════════════════════════════════════

export function OperationalStrengthScoreCard({
  styles,
  profileData,
  onScoreUpdate,
  apiKey,
  onNavigate,
}) {
  const { callFunction } = useFirebaseFunctions();

  const [showModal, setShowModal] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [operationalScore, setOperationalScore] = useState(0);
  const [aiEvaluationResult, setAiEvaluationResult] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState("");
  const [showAboutScore, setShowAboutScore] = useState(false);
  const [showPotential, setShowPotential] = useState(true);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);
  const [openItem, setOpenItem] = useState(null);

  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [showModal]);

  // ── Score — a pure function of the profile. The AI is not in this path. ──
  useEffect(() => {
    if (!profileData) return;
    try {
      const a = buildOperationalAssessment(profileData);
      setAssessment(a);
      setOperationalScore(a.totalScore);
      if (onScoreUpdate) onScoreUpdate(a.totalScore);
    } catch (e) {
      console.error("Operational scoring error:", e);
    }
  }, [profileData]);

  const runAiEvaluation = async () => {
    if (!apiKey?.trim()) {
      setEvaluationError("AI analysis is not configured yet.");
      return null;
    }
    if (!profileData) {
      setEvaluationError("No profile data available to analyse.");
      return null;
    }

    setIsEvaluating(true);
    setEvaluationError("");
    try {
      const a = buildOperationalAssessment(profileData);
      setAssessment(a);
      setOperationalScore(a.totalScore);
      const result = await callFunction("generateOperationalAnalysis", {
        prompt: buildOperationalPrompt(a),
      });
      return result?.content || "";
    } catch (error) {
      console.error("Operational AI evaluation error:", error);
      setEvaluationError(`Analysis failed: ${error.message}`);
      return null;
    } finally {
      setIsEvaluating(false);
    }
  };

  const refreshAiEvaluation = async () => {
    const userId = auth?.currentUser?.uid;
    if (!userId) return;
    try {
      const result = await runAiEvaluation();
      if (result) {
        await setDoc(
          doc(db, "aiOperationalEvaluations", userId),
          { result, score: operationalScore, timestamp: new Date(), profileSnapshot: profileData },
          { merge: true }
        );
        setAiEvaluationResult(result);
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
    const profileRef = doc(db, "universalProfiles", userId);
    const aiEvalRef = doc(db, "aiOperationalEvaluations", userId);

    const unsubscribe = onSnapshot(profileRef, async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        // Shares the Leadership & Governance trigger for now — one flag fires
        // the evaluations together. Give this its own flag when that exists.
        if (
          (data.triggerOperationalEvaluation === true ||
            data.triggerGovernanceEvaluation === true) &&
          !isEvaluating
        ) {
          const result = await runAiEvaluation();
          if (result) {
            await setDoc(
              aiEvalRef,
              { result, timestamp: new Date(), profileSnapshot: profileData },
              { merge: true }
            );
            setAiEvaluationResult(result);
            setShowDetailedAnalysis(true);
          }
          await updateDoc(profileRef, { triggerOperationalEvaluation: false });
          return;
        }
      }
      try {
        const aiSnap = await getDoc(aiEvalRef);
        if (aiSnap.exists() && aiSnap.data().result) {
          setAiEvaluationResult(aiSnap.data().result);
        }
      } catch (e) {
        console.error("Load saved eval error:", e);
      }
    });

    return () => unsubscribe();
  }, [auth?.currentUser?.uid, apiKey]);

  // ─────────────────────────────────────────────────────────────────────
  // Presentation
  // ─────────────────────────────────────────────────────────────────────
  const barColor = (s) =>
    s > 90 ? "#1B5E20" : s >= 81 ? "#4CAF50" : s >= 61 ? "#FF9800" : s >= 41 ? "#F44336" : "#B71C1C";

  const getScoreLevel = (score) => {
    if (score > 90) return { level: "Highly reliable execution", color: "#1B5E20" };
    if (score >= 81) return { level: "Strong operational base", color: "#4CAF50" };
    if (score >= 61) return { level: "Moderate capability", color: "#FF9800" };
    if (score >= 41) return { level: "Basic capability", color: "#F44336" };
    return { level: "Needs development", color: "#B71C1C" };
  };
  const scoreLevel = getScoreLevel(operationalScore);

  const a = assessment;

  const goTo = (route) => {
    if (!route) return;
    if (onNavigate) onNavigate(route);
    else window.location.assign(route);
  };

  const formatAiResult = (text) => {
    if (!text) return null;
    const cleaned = text.replace(/\*\*(.*?)\*\*/g, "$1");
    return cleaned
      .split(/(?=###\s)/g)
      .map((section, index) => {
        const trimmed = section.trim();
        if (!trimmed) return null;
        const headingMatch = trimmed.match(/^###\s*(.+?)(?=\n|$)/);
        const heading = headingMatch ? headingMatch[1].trim() : null;
        const rest = heading
          ? trimmed.slice(trimmed.indexOf(heading) + heading.length).replace(/^###\s*/, "").trim()
          : trimmed.replace(/^###\s*/, "");
        return (
          <div key={index} style={{ marginBottom: "15px" }}>
            {heading && (
              <div style={{ backgroundColor: "#8d6e63", color: "white", padding: "8px 14px", borderRadius: "8px 8px 0 0", fontWeight: 700, fontSize: "13px" }}>
                {heading}
              </div>
            )}
            <div style={{ fontSize: "14px", lineHeight: 1.6, color: "#6d4c41", whiteSpace: "pre-wrap", backgroundColor: "white", padding: "16px", borderRadius: heading ? "0 0 8px 8px" : "8px", border: "1px solid #e8d8cf", borderTop: heading ? "none" : "1px solid #e8d8cf" }}>
              {rest || trimmed}
            </div>
          </div>
        );
      })
      .filter(Boolean);
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
      item.state === "missing"
        ? "Not answered yet"
        : item.earned > 0
        ? "Partly counted — worth more"
        : "Answered — not counting";

    return (
      <div style={{ border: `1px solid ${open ? "#c8e6c9" : "#f0e8e0"}`, background: "white", borderRadius: "10px", marginBottom: "8px", overflow: "hidden", transition: "border-color 0.2s ease" }}>
        <div
          onClick={() => setOpenItem(open ? null : item.key)}
          style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", cursor: "pointer", background: open ? "#f7fbf7" : "white" }}
        >
          <span style={{ color: "#a1887f", fontWeight: 800, fontSize: "12px", minWidth: "18px" }}>{index + 1}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: "#4e342e", fontSize: "13px" }}>{item.label}</div>
            <div style={{ fontSize: "11px", color: "#8d6e63" }}>
              {item.categoryLabel} · {item.formSection} · {chip}
            </div>
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
                <div style={{ fontSize: "26px", fontWeight: 800, color: "#8d6e63", lineHeight: 1.1 }}>{operationalScore}%</div>
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

            <div style={{ fontSize: "10px", color: "#8d6e63", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "6px" }}>
              Why funders ask for it
            </div>
            <div style={{ fontSize: "12.5px", color: "#5d4037", marginBottom: "10px", lineHeight: 1.6 }}>{item.importance}</div>

            <div style={{ fontSize: "10px", color: "#8d6e63", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "6px" }}>
              What to do
            </div>
            <div style={{ fontSize: "12.5px", color: "#5d4037", marginBottom: "12px", lineHeight: 1.6 }}>
              {item.fix || `Answer this question under Operations Overview, ${item.formSection}.`}
            </div>

            <button
              onClick={() => goTo(item.where)}
              style={{ padding: "9px 16px", background: "linear-gradient(135deg,#5d4037 0%,#4a2c20 100%)", color: "white", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              Go to Operations Overview, {item.formSection} <span style={{ fontSize: "13px" }}>→</span>
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
          {item.withheld > 0 && item.claimable && (
            <span style={{ display: "block", color: "#8d3a2e" }}>
              {item.fix || `Answer this under Operations Overview, ${item.formSection}.`}
            </span>
          )}
          {item.withheld > 0 && item.claimable && (
            <button
              onClick={() => goTo(item.where)}
              style={{ marginTop: "6px", background: "none", border: "1px solid #d6b88a", color: "#5d4037", borderRadius: "6px", padding: "3px 10px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
            >
              Go to {item.formSection} →
            </button>
          )}
          {!item.claimable && item.withheld > 0 && (
            <span style={{ display: "block", color: "#8d6e63", fontStyle: "italic", fontSize: "11.5px", marginTop: "3px" }}>
              Fixed deduction — not recoverable by editing the form.
            </span>
          )}
        </span>
        {item.withheld > 0 && (
          <span
            style={{
              backgroundColor: item.claimable ? "#e8f5e9" : "#f5f2f0",
              color: item.claimable ? "#1B5E20" : "#8d6e63",
              border: `1px solid ${item.claimable ? "#c8e6c9" : "#d7ccc8"}`,
              borderRadius: "4px",
              padding: "2px 7px",
              fontWeight: 800,
              fontSize: "11.5px",
              whiteSpace: "nowrap",
              marginTop: "2px",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {!item.claimable && <Lock size={10} />}
            {fmtPts(item.pointValue)}
          </span>
        )}
      </div>
    );
  };

  return (
    <>
      {/* ── Card ── */}
      <div style={{ background: "linear-gradient(135deg, #ffffff 0%, #faf8f6 100%)", borderRadius: "20px", boxShadow: "0 8px 32px rgba(141,110,99,0.15)", border: "1px solid #e8ddd6", overflow: "hidden", position: "relative", width: "100%", minWidth: "210px" }}>
        <div style={{ background: "linear-gradient(135deg, #8d6e63 0%, #6d4c41 100%)", padding: "24px 30px 20px 30px", color: "white", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, letterSpacing: "0.5px", whiteSpace: "nowrap" }}>Operational Strength</h2>
            <Settings size={24} style={{ opacity: 0.8 }} />
          </div>
          <p style={{ margin: 0, fontSize: "13px", opacity: 0.9 }}>Execution &amp; delivery reliability</p>
          <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "80px", height: "80px", background: "rgba(255,255,255,0.1)", borderRadius: "50%", opacity: 0.6 }} />
          <div style={{ position: "absolute", bottom: "-10px", left: "-10px", width: "60px", height: "60px", background: "rgba(255,255,255,0.05)", borderRadius: "50%" }} />
        </div>

        <div style={{ padding: "24px", background: "white", textAlign: "center" }}>
          <div style={{ position: "relative", display: "inline-block", marginBottom: "24px" }}>
            <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "110px", height: "110px", border: `4px solid ${scoreLevel.color}`, borderRadius: "50%", background: "linear-gradient(135deg,#fff 0%,#f8fff8 100%)", boxShadow: `0 6px 20px ${scoreLevel.color}30`, fontWeight: "bold" }}>
              <span style={{ fontSize: "26px", fontWeight: 800, lineHeight: 1 }}>{operationalScore}%</span>
              <div style={{ position: "absolute", top: "-6px", left: "-6px", right: "-6px", bottom: "-6px", border: `2px solid ${scoreLevel.color}20`, borderRadius: "50%", animation: "pulse 2s infinite" }} />
            </div>
            <div style={{ position: "absolute", bottom: "-12px", left: "50%", transform: "translateX(-50%)", backgroundColor: scoreLevel.color, color: "white", padding: "6px 16px", borderRadius: "20px", fontSize: "10px", fontWeight: 600, letterSpacing: "0.5px", boxShadow: `0 4px 12px ${scoreLevel.color}40`, border: "2px solid white", whiteSpace: "nowrap" }}>
              {scoreLevel.level}
            </div>
          </div>

          {/* {a && a.availablePoints > 0 && (
            <div style={{ marginTop: "6px", display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 12px", background: "#e8f5e9", border: "1px solid #c8e6c9", borderRadius: "20px", color: "#1B5E20", fontWeight: 700, fontSize: "11px" }}>
              <Target size={12} /> {fmtPts(a.availablePoints)} available
            </div>
          )} */}

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
                Operational strength breakdown
              </h3>

              <div style={{ textAlign: "center", padding: "20px", background: "linear-gradient(135deg,#fdf8f6 0%,#f3e8dc 100%)", borderRadius: "12px", border: "1px solid #d6b88a" }}>
                <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "120px", height: "120px", border: `4px solid ${scoreLevel.color}`, borderRadius: "50%", background: "white", boxShadow: "0 4px 12px rgba(139,69,19,0.2)", marginBottom: "12px" }}>
                  <span style={{ fontSize: "28px", fontWeight: 700, color: "#5d4037", lineHeight: 1 }}>{operationalScore}%</span>
                  <span style={{ color: scoreLevel.color, fontSize: "12px", fontWeight: 600, marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{scoreLevel.level}</span>
                </div>

                <div style={{ fontSize: "14px", color: "#6d4c41" }}>
                  Business stage:{" "}
                  <strong style={{ color: "#5d4037", textTransform: "capitalize" }}>
                    {profileData?.entityOverview?.operationStage || "Ideation"}
                  </strong>
                </div>

                {a && a.availablePoints > 0 && (
                  <div style={{ marginTop: "10px", display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 16px", background: "#e8f5e9", border: "1px solid #c8e6c9", borderRadius: "20px", color: "#1B5E20", fontWeight: 700, fontSize: "12px" }}>
                    <Target size={13} /> {fmtPts(a.availablePoints)} available · potential score {Math.round(a.totalRaw + a.availablePoints)}%
                  </div>
                )}

                {a && a.lockedPoints > 0 && (
                  <div style={{ marginTop: "8px", fontSize: "11.5px", color: "#8d6e63", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <Lock size={11} /> A further {fmtPts(a.lockedPoints)} is withheld on something the form cannot undo.
                  </div>
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

              {/* ── About ── */}
              <Section title="About operational strength" open={showAboutScore} onToggle={() => setShowAboutScore(!showAboutScore)}>
                <div style={{ color: "#5d4037", fontSize: "13px", lineHeight: 1.6 }}>
                  <p style={{ marginBottom: "16px" }}>
                    Operational strength measures whether this business can reliably execute and deliver — supplier and continuity risk, delivery reliability, safety and compliance, and premises. Every input comes from the Operations Overview form, plus your declared sector, used only to check whether the premises type fits the business.
                  </p>

                  <div style={{ backgroundColor: "#efebe9", padding: "16px", borderRadius: "8px", marginBottom: "16px", borderLeft: "4px solid #8d6e63" }}>
                    <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>How a point value is worked out</p>
                    <p style={{ margin: 0, fontFamily: "monospace", fontSize: "12px", backgroundColor: "white", padding: "8px 10px", borderRadius: "6px", border: "1px solid #e0d5c8" }}>
                      value = (item points withheld ÷ category points) × category weight
                    </p>
                    <p style={{ margin: "8px 0 0 0" }}>
                      The score is calculated in code, not by the AI. The AI reads the finished numbers and explains them, which is what lets a figure like +7.5% be a promise rather than an estimate.
                    </p>
                  </div>

                  {a && (
                    <div style={{ backgroundColor: "#efebe9", padding: "16px", borderRadius: "8px", marginBottom: "16px", borderLeft: "4px solid #8d6e63" }}>
                      <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>Category weighting</p>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                        <thead>
                          <tr style={{ color: "#6d4c41" }}>
                            <th style={{ textAlign: "left", padding: "4px 6px" }}>Category</th>
                            <th style={{ textAlign: "left", padding: "4px 6px" }}>Form</th>
                            <th style={{ textAlign: "right", padding: "4px 6px" }}>Weight</th>
                            <th style={{ textAlign: "right", padding: "4px 6px" }}>Now</th>
                          </tr>
                        </thead>
                        <tbody>
                          {a.categories.map((c) => (
                            <tr key={c.key} style={{ color: "#5d4037" }}>
                              <td style={{ padding: "4px 6px" }}>{c.label}</td>
                              <td style={{ padding: "4px 6px" }}>{c.formSection}</td>
                              <td style={{ padding: "4px 6px", textAlign: "right" }}>{c.weight}%</td>
                              <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: 700 }}>{c.percent}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div style={{ backgroundColor: "#efebe9", padding: "16px", borderRadius: "8px", marginBottom: "16px", borderLeft: "4px solid #8d6e63" }}>
                    <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>What is deliberately not scored</p>
                    <p style={{ margin: 0 }}>
                      Outsourcing and value chain, import/export, contract operations and operational challenges appear in the detailed analysis as context, but carry no points. They are either free text or genuinely double-edged — importing can mean market diversification or forex exposure, and a yes/no answer cannot tell you which. Scoring them would mean inventing a judgement the form does not support.
                    </p>
                  </div>

                  <div style={{ backgroundColor: "#efebe9", padding: "16px", borderRadius: "8px", borderLeft: "4px solid #8d6e63" }}>
                    <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>Points that cannot be claimed back</p>
                    <p style={{ margin: 0 }}>
                      A disclosed major incident in the past 24 months withholds points that no form edit can recover. It is shown as a fixed deduction and kept out of Potential points, because listing it as an action would imply you could undo a disclosure. Those points return on their own once the incident falls outside the 24-month window.
                    </p>
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
                      Every answer on the Operations Overview form that can earn points is recorded and counted.
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
                          {operationalScore}% today · <strong style={{ color: "#1B5E20" }}>{fmtPts(a.availablePoints)}</strong> sitting in {a.outstanding.length} item{a.outstanding.length === 1 ? "" : "s"} below
                        </div>
                        <div style={{ fontSize: "11.5px", color: "#8d6e63", marginTop: "6px", fontStyle: "italic" }}>
                          Tap any item to see what it is worth and go straight to the question.
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
                          {a.locked.map((i) => i.label).join("; ")} — worth {fmtPts(a.lockedPoints)}, but not something editing the form can change. It is left out of the total above rather than dressed up as an action.
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
                  right={`${operationalScore}%`}
                  open={showScoreBreakdown}
                  onToggle={() => setShowScoreBreakdown(!showScoreBreakdown)}
                >
                  {a.categories.map((c) => (
                    <div key={c.key} style={{ background: "white", borderRadius: "8px", border: "1px solid #f0e8e0", padding: "14px", marginBottom: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
                          <div style={{ backgroundColor: c.color, width: "12px", height: "12px", borderRadius: "50%", marginRight: "12px", flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: 600, color: "#5d4037", fontSize: "14px" }}>{c.label}</div>
                            <div style={{ fontSize: "11.5px", color: "#8d6e63", fontStyle: "italic" }}>
                              {c.earned}/{c.possible} item points → {c.percent}% × {c.weight}% weight = {c.weightedScore} points
                              {c.headroom > 0 ? ` · ${fmtPts(c.headroom)} unclaimed here` : " · fully claimed"}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: "80px", height: "8px", background: "#f3e8dc", borderRadius: "4px", overflow: "hidden", border: "1px solid #d6b88a" }}>
                            <div style={{ width: `${c.percent}%`, height: "100%", background: barColor(c.percent), borderRadius: "4px", transition: "width 0.3s ease" }} />
                          </div>
                          <span style={{ fontWeight: 600, color: "#5d4037", fontSize: "14px", minWidth: "35px", textAlign: "right" }}>{c.percent}%</span>
                        </div>
                      </div>
                      <div style={{ borderTop: "1px dashed #e8d8cf", paddingTop: "10px", fontSize: "12.5px", color: "#6d4c41", lineHeight: 1.7 }}>
                        {c.items.map((item) => <ItemRow key={item.key} item={item} />)}
                      </div>
                    </div>
                  ))}
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