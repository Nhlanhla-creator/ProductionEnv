"use client";


import { useState, useEffect, useMemo } from "react";
import { ChevronDown, FileCheck, AlertCircle, RefreshCw } from "lucide-react";
import ScoreExplorer from "./ScoreExplorer";
import { getDocumentId } from "../../utils/documentMapping";
import { getDocumentUrlFromAnyLocation } from "../../utils/documentSyncService";

// ─────────────────────────────────────────────────────────────────────────
// COMPLIANCE
//
// Same contract as the legitimacy card:
//
//   DOCUMENTS — already decided. validateMyDocument read the file at upload
//   time and stored a verdict. This card reads that verdict and nothing
//   else. Verified → full weight. Expired / rejected / wrong type → no
//   weight, with the same reason the user saw in My Documents.
//
//   ARITHMETIC — always the code. credit → weight earned → point value.
//   pointValue = (weight withheld ÷ total applicable weight) × 100, so the
//   "+5.6%" on an item is exactly what the score moves when it is fixed.
// ─────────────────────────────────────────────────────────────────────────

const PROFILE_ROUTE = "/profile";
const DOCUMENTS_ROUTE = "/my-documents";

// The profile page renders every section from one route via `activeSection`.
const SECTION_TARGETS = {
  "My Documents": DOCUMENTS_ROUTE,
  "Legal & Compliance": `${PROFILE_ROUTE}?section=legalCompliance`,
  "Entity Overview": `${PROFILE_ROUTE}?section=entityOverview`,
  "Contact Details": `${PROFILE_ROUTE}?section=contactDetails`,
  Profile: PROFILE_ROUTE,
};

// "My Documents → upload your CIPC registration certificate"
//
// My Documents filters rows by `searchTerm` against the document LABEL, and
// by `filter` against a category list that does not contain every item scored
// here (Share Register and Director IDs sit under Governance, Industry
// Accreditations under Operations). So the deep link carries the exact label
// rather than a category, and `doc` as the stable id for highlighting.
const buildDocRoute = (documentId, docLabel) => {
  const qs = new URLSearchParams();
  if (documentId) qs.set("doc", documentId);
  if (docLabel) qs.set("search", docLabel);
  const s = qs.toString();
  return s ? `${DOCUMENTS_ROUTE}?${s}` : DOCUMENTS_ROUTE;
};

const parseWhere = (where, documentId, docLabel) => {
  const parts = String(where || "").split("→");
  const section = (parts[0] || "").trim();
  const base = SECTION_TARGETS[section] || null;
  return {
    section,
    action: (parts.slice(1).join("→") || where || "").trim(),
    route:
      base === DOCUMENTS_ROUTE
        ? buildDocRoute(documentId, docLabel)
        : base,
  };
};

const cleanStr = (v) =>
  typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();

const urlOf = (v) => {
  if (!v) return "";
  if (typeof v === "string") return cleanStr(v);
  if (typeof v === "object") return cleanStr(v.url);
  return "";
};

// validateMyDocument's own vocabulary. Only these two are a pass.
const PASS_STATUSES = new Set(["verified", "verified:not_audited"]);

// What each failure means, in the same words used in My Documents.
const DOC_FAIL = {
  expired: {
    reason: "This document has expired.",
    fix: "Upload a current copy — My Documents → find the row → Update.",
  },
  incomplete: {
    reason:
      "This is the right document, but required details could not be read off it.",
    fix: "Check every page is included, then re-upload it in My Documents.",
  },
  name_mismatch: {
    reason:
      "The company name on this document does not match your registered name.",
    fix: "Upload the copy issued in your registered company name, or correct the registered name under Entity Overview.",
  },
  wrong_type: {
    reason: "The file uploaded is not this document.",
    fix: "Upload the correct document in My Documents.",
  },
  rejected: {
    reason: "This document could not be verified.",
    fix: "Re-upload a clear, complete copy in My Documents.",
  },
};

const STATE_STYLE = {
  verified: { dot: "#4CAF50", label: "Verified at upload", text: "#2E7D32" },
  captured: { dot: "#4CAF50", label: "Captured", text: "#2E7D32" },
  partial: { dot: "#FF9800", label: "Partly counted", text: "#EF6C00" },
  expired: { dot: "#B71C1C", label: "Not counted — expired", text: "#B71C1C" },
  wrong_type: {
    dot: "#B71C1C",
    label: "Not counted — wrong document",
    text: "#B71C1C",
  },
  name_mismatch: {
    dot: "#B71C1C",
    label: "Not counted — name mismatch",
    text: "#B71C1C",
  },
  incomplete: {
    dot: "#B71C1C",
    label: "Not counted — incomplete",
    text: "#B71C1C",
  },
  rejected: { dot: "#B71C1C", label: "Not counted — rejected", text: "#B71C1C" },
  pending: { dot: "#90A4AE", label: "Awaiting check", text: "#546E7A" },
  missing: { dot: "#F44336", label: "Not uploaded", text: "#C62828" },
};

// ─────────────────────────────────────────────────────────────────────────
// Reading stored document verdicts
//
// Two storage locations, because MyDocuments has two upload paths:
//   Single upload → uploadDocumentWithSync → verification.{documentId}
//   Multi upload  → documents.{documentId}_multiple[i]
// ─────────────────────────────────────────────────────────────────────────

const docIdsFor = (docLabel) => {
  const ids = [];
  try {
    const id = getDocumentId(docLabel);
    if (id) ids.push(id);
  } catch (e) {
    /* fall back to the label itself */
  }
  ids.push(docLabel);
  return [...new Set(ids.filter(Boolean))];
};

const collectCopies = (data, ids, docLabel) => {
  const out = [];
  const docs = data?.documents || {};
  const legal = data?.legalCompliance || {};
  const entity = data?.entityOverview || {};

  // Same resolver My Documents uses, so "uploaded" means the same thing on
  // both pages. Falls back to the raw paths if the helper is unavailable.
  let resolved = "";
  try {
    resolved = cleanStr(getDocumentUrlFromAnyLocation(docLabel, data));
  } catch (e) {
    resolved = "";
  }

  ids.forEach((id) => {
    const arr = docs[`${id}_multiple`];
    if (Array.isArray(arr)) {
      arr
        .filter((d) => urlOf(d))
        .forEach((d) =>
          out.push({
            url: urlOf(d),
            status: cleanStr(d.status) || "verified", // pre-validation uploads count
            message: cleanStr(d.message),
          })
        );
    }

    const single =
      urlOf(docs[id]) || urlOf(legal[id]) || urlOf(entity[id]) || resolved;
    const verification = data?.verification?.[id];
    if (single || verification?.status) {
      out.push({
        url: single,
        status: cleanStr(verification?.status) || "verified",
        message: cleanStr(verification?.message),
      });
    }
  });

  const seen = new Set();
  return out.filter((d) => {
    const k = d.url || `${d.status}|${d.message}`;
    return seen.has(k) ? false : seen.add(k);
  });
};

// The BEST copy wins — a valid certificate next to an old expired one is a
// business with a valid certificate.
const readDocVerdict = (data, docLabel) => {
  const ids = docIdsFor(docLabel);
  const copies = collectCopies(data, ids, docLabel);
  const documentId = ids[0];

  if (!copies.length) {
    return { documentId, docLabel, present: false, credit: 0, state: "missing" };
  }

  const passing = copies.filter((d) => PASS_STATUSES.has(d.status));
  if (passing.length) {
    const stale = copies.length - passing.length;
    return {
      documentId,
      docLabel,
      present: true,
      credit: 1,
      state: "verified",
      evidence: `${copies.length} on file · ${passing.length} verified`,
      note: stale
        ? `${stale} older cop${
            stale === 1 ? "y is" : "ies are"
          } still on file with a failed status; the verified copy is what counts.`
        : null,
    };
  }

  const worst = copies[0];
  const fail = DOC_FAIL[worst.status] || DOC_FAIL.rejected;
  return {
    documentId,
    docLabel,
    present: true,
    credit: 0,
    state: DOC_FAIL[worst.status] ? worst.status : "rejected",
    evidence: `${copies.length} on file · none counted`,
    reason:
      worst.message && worst.message !== "Document verified"
        ? worst.message
        : fail.reason,
    fix: fail.fix,
  };
};

// ─────────────────────────────────────────────────────────────────────────
// THE RUBRIC
// ─────────────────────────────────────────────────────────────────────────

const PROFILE_SECTIONS = [
  "instructions",
  "entityOverview",
  "ownershipManagement",
  "contactDetails",
  "legalCompliance",
  "productsServices",
  "howDidYouHear",
  "documents",
  "declarationConsent",
];

const STAGE_LABELS = {
  earlyStage: "Early stage",
  growthStage: "Growth / scale-up",
  matureStage: "Mature",
};

// Presentation-only grouping — buildComplianceAssessment stays flat.
// Regroup here if you'd rather split these differently; it changes nothing
// about scoring, only how the 11 requirements are bucketed on screen.
const COMPLIANCE_GROUPS = [
  { key: "registrationTax", label: "Registration & Tax", items: ["companyReg", "taxClearance", "vat"] },
  { key: "bbbeeLabour", label: "B-BBEE & Labour Compliance", items: ["bbbee", "coida"] },
  { key: "financialOwnership", label: "Financial & Ownership", items: ["bankLetter", "shareRegister", "directorIds"] },
  { key: "locationLicensing", label: "Location & Licensing", items: ["proofOfAddress", "accreditation"] },
  { key: "profile", label: "Profile Completeness", items: ["profileCompletion"] },
];

const mapStageToWeightKey = (stageRaw) => {
  const s = cleanStr(stageRaw).toLowerCase();
  if (["growth", "scale-up", "scaleup", "scaling"].includes(s))
    return "growthStage";
  if (["mature", "established"].includes(s)) return "matureStage";
  return "earlyStage";
};

const buildRubric = () => [
  {
    key: "companyReg",
    kind: "document",
    docLabel: "Company Registration Certificate",
    displayName: "Company Registration Certificate",
    description: "CIPC registration document",
    importance: "Non-negotiable – proves legal existence",
    compulsory: true,
    weights: { earlyStage: 0.2, growthStage: 0.15, matureStage: 0.1 },
    where: "My Documents → upload your CIPC registration certificate",
    guidance:
      "The CoR 14.3 or CIPC disclosure certificate. Download a fresh copy from the CIPC portal if you cannot find the original.",
  },
  {
    key: "taxClearance",
    kind: "document",
    docLabel: "Tax Clearance Certificate",
    displayName: "SARS Tax Clearance",
    description: "Valid tax clearance certificate",
    importance: "Critical – shows financial/legal integrity",
    compulsory: true,
    weights: { earlyStage: 0.2, growthStage: 0.15, matureStage: 0.1 },
    where: "My Documents → upload your SARS tax clearance certificate",
    guidance:
      "SARS issues a tax compliance status PIN online at no cost — usually within a day.",
  },
  {
    key: "vat",
    kind: "field",
    displayName: "VAT registration",
    description: "VAT number captured",
    importance: "Compulsory for turnover above R1m",
    weights: { earlyStage: 0.0, growthStage: 0.05, matureStage: 0.05 },
    where: "Legal & Compliance → add your VAT number",
    guidance:
      "Your declared turnover is above the R1m threshold, so SARS registration is compulsory rather than optional.",
    condition: (data) =>
      Number.parseFloat(
        cleanStr(data?.financialOverview?.annualRevenue).replace(/[^\d.]/g, "") ||
          "0"
      ) > 1000000,
    read: (data) => {
      const vat = cleanStr(data?.legalCompliance?.vatNumber);
      return vat
        ? { present: true, credit: 1, state: "captured", evidence: vat }
        : { present: false, credit: 0, state: "missing" };
    },
  },
  {
    key: "bbbee",
    kind: "document",
    docLabel: "B-BBEE Certificate",
    displayName: "B-BBEE Certification",
    description: "Valid B-BBEE certificate or affidavit",
    importance: "Essential for corporate procurement",
    compulsory: true,
    weights: { earlyStage: 0.1, growthStage: 0.15, matureStage: 0.15 },
    where: "My Documents → upload your B-BBEE certificate or affidavit",
    guidance:
      "Turnover under R10m qualifies as an Exempted Micro Enterprise — a sworn affidavit counts in full and costs nothing at a police station or Commissioner of Oaths.",
  },
  {
    key: "coida",
    kind: "compound",
    docLabel: "COIDA Letter of Good Standing",
    displayName: "COIDA registration",
    description: "Letter of good standing plus UIF number",
    importance: "Shows compliance with labour laws",
    weights: { earlyStage: 0.0, growthStage: 0.05, matureStage: 0.1 },
    where: "My Documents → upload your COIDA letter of good standing",
    guidance:
      "This item needs two things: the letter of good standing from the Compensation Fund, and your UIF number under Legal & Compliance.",
    read: (data) => {
      const docv = readDocVerdict(data, "COIDA Letter of Good Standing");
      const uif = cleanStr(data?.legalCompliance?.uifNumber);
      if (docv.credit === 1 && uif)
        return {
          ...docv,
          credit: 1,
          state: "verified",
          evidence: `${docv.evidence} · UIF ${uif}`,
        };
      if (docv.credit === 1 && !uif)
        return {
          ...docv,
          credit: 0,
          state: "incomplete",
          reason:
            "The letter of good standing is verified, but no UIF number is captured on the profile.",
          fix: "Add your UIF reference number under Legal & Compliance — the letter already on file then counts in full.",
          where: "Legal & Compliance → add your UIF number",
        };
      if (docv.present) return docv;
      return {
        ...docv,
        present: false,
        credit: 0,
        state: "missing",
        reason: uif
          ? "Your UIF number is captured, but the COIDA letter of good standing has not been uploaded."
          : null,
      };
    },
  },
  {
    key: "bankLetter",
    kind: "document",
    docLabel: "Bank Details Confirmation Letter",
    displayName: "Business bank account",
    description: "Bank confirmation letter in the company name",
    importance: "Confirms financial separation from owners",
    weights: { earlyStage: 0.1, growthStage: 0.15, matureStage: 0.2 },
    where: "My Documents → upload your bank confirmation letter",
    guidance:
      "Any branch or your banking app can issue a stamped confirmation letter, usually the same day.",
  },
  {
    key: "shareRegister",
    kind: "document",
    docLabel: "Share Register",
    displayName: "Share register",
    description: "Official share register document",
    importance: "Ensures ownership transparency",
    compulsory: true,
    weights: { earlyStage: 0.1, growthStage: 0.1, matureStage: 0.1 },
    where: "My Documents → upload your share register",
    guidance:
      "The securities register listing every shareholder and their holding, signed by a director.",
  },
  {
    key: "directorIds",
    kind: "document",
    docLabel: "IDs of Directors & Shareholders",
    displayName: "Director & shareholder IDs",
    description: "Certified copies of ID documents",
    importance: "Verifies accountable individuals",
    compulsory: true,
    weights: { earlyStage: 0.1, growthStage: 0.1, matureStage: 0.05 },
    where: "My Documents → upload certified IDs for every director",
    guidance:
      "Certification must be within three months. Any police station certifies free of charge.",
  },
  {
    key: "proofOfAddress",
    kind: "document",
    docLabel: "Proof of Address",
    displayName: "Proof of address",
    description: "Business address verification",
    importance: "Confirms physical business location",
    compulsory: true,
    weights: { earlyStage: 0.1, growthStage: 0.05, matureStage: 0.05 },
    where: "My Documents → upload proof of address",
    guidance:
      "A municipal bill or signed lease in the company name, dated within three months.",
  },
  {
    key: "accreditation",
    kind: "document",
    docLabel: "Industry Accreditations",
    displayName: "Industry licences",
    description: "Sector-specific permits and accreditations",
    importance: "Required for regulated industries",
    weights: { earlyStage: 0.0, growthStage: 0.05, matureStage: 0.1 },
    where: "My Documents → upload your industry accreditations",
    guidance:
      "CIDB, PSIRA, liquor, health or transport permits — whatever your sector requires to trade lawfully.",
  },
  {
    key: "profileCompletion",
    kind: "profile",
    displayName: "Complete business profile",
    description: "All profile sections completed",
    importance: "Tells funders who they are dealing with",
    weights: { earlyStage: 0.1, growthStage: 0.1, matureStage: 0.1 },
    where: "Profile → complete the remaining sections",
    guidance:
      "This one is scored proportionally — every section you finish adds part of the weight.",
    read: (data) => {
      const completedMap = data?.completedSections || {};
      const done = PROFILE_SECTIONS.filter((k) => completedMap[k]).length;
      const ratio = done / PROFILE_SECTIONS.length;
      return {
        present: done > 0,
        credit: ratio,
        state: ratio >= 1 ? "captured" : ratio > 0 ? "partial" : "missing",
        evidence: `${done} of ${PROFILE_SECTIONS.length} sections complete`,
        reason:
          ratio < 1
            ? `${PROFILE_SECTIONS.length - done} section${
                PROFILE_SECTIONS.length - done === 1 ? "" : "s"
              } still incomplete.`
            : null,
        fix: ratio < 1 ? "Finish the outstanding sections on your profile." : null,
      };
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────
// THE SCORER
//   earned     = weight × credit
//   pointValue = (weight − earned) ÷ total applicable weight × 100
// ─────────────────────────────────────────────────────────────────────────
const buildComplianceAssessment = (data) => {
  const weightKey = mapStageToWeightKey(data?.entityOverview?.operationStage);

  const graded = buildRubric().map((item) => {
    const applicable = item.condition ? !!item.condition(data) : true;
    const weight = applicable ? item.weights[weightKey] || 0 : 0;

    const v =
      typeof item.read === "function"
        ? item.read(data)
        : readDocVerdict(data, item.docLabel);

    const credit = Math.max(0, Math.min(1, v.credit || 0));
    const earned = weight * credit;

    return {
      ...item,
      documentId: v.documentId || null,
      docLabelResolved: v.docLabel || item.docLabel || null,
      applicable,
      weight,
      credit,
      earned,
      withheldWeight: weight - earned,
      verified: credit >= 1,
      present: !!v.present,
      state: v.state || (credit >= 1 ? "captured" : "missing"),
      evidence: v.evidence || "",
      reason: v.reason || null,
      fix: v.fix || null,
      note: v.note || null,
      where: v.where || item.where,
    };
  });

  const scored = graded.filter((i) => i.weight > 0);
  const maxWeight = scored.reduce((s, i) => s + i.weight, 0);
  const totalEarned = scored.reduce((s, i) => s + i.earned, 0);

  const documents = scored.map((i) => ({
    ...i,
    weightPct: Math.round(i.weight * 100),
    pointValue: maxWeight > 0 ? (i.withheldWeight / maxWeight) * 100 : 0,
    maxPointValue: maxWeight > 0 ? (i.weight / maxWeight) * 100 : 0,
  }));

  const totalRaw = maxWeight > 0 ? (totalEarned / maxWeight) * 100 : 0;
  const outstanding = documents
    .filter((i) => i.pointValue > 0.05)
    .sort((a, b) => b.pointValue - a.pointValue);

  return {
    weightKey,
    stageLabel: STAGE_LABELS[weightKey],
    rawStage: cleanStr(data?.entityOverview?.operationStage) || "Ideation",
    documents,
    outstanding,
    blocked: outstanding.filter((i) => i.present), // supplied but not counting
    missing: outstanding.filter((i) => !i.present),
    totalRaw,
    score: Math.round(totalRaw),
    availablePoints:
      Math.round(outstanding.reduce((s, i) => s + i.pointValue, 0) * 10) / 10,
    blockedPoints:
      Math.round(
        outstanding
          .filter((i) => i.present)
          .reduce((s, i) => s + i.pointValue, 0) * 10
      ) / 10,
  };
};

const fmtPts = (n) =>
  `${n >= 0 ? "+" : ""}${(Math.round(n * 10) / 10).toFixed(1)}%`;

// ═════════════════════════════════════════════════════════════════════════

export function ComplianceScoreCard({
  styles,
  profileData,
  onScoreUpdate,
  onNavigate,
}) {
  const [showModal, setShowModal] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [complianceScore, setComplianceScore] = useState(0);
  const [showAboutScore, setShowAboutScore] = useState(false);
  const [showPotential, setShowPotential] = useState(true);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  const [openItem, setOpenItem] = useState(null);


  useEffect(() => {
    if (showModal) {
      document.body.classList.add("modal-open");
      document.body.style.overflow = "hidden";
    } else {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
    }
    return () => {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
    };
  }, [showModal]);

  useEffect(() => {
    if (!profileData) return;
    try {
      const a = buildComplianceAssessment(profileData);
      setAssessment(a);
      setComplianceScore(a.score);
      if (onScoreUpdate) onScoreUpdate(a.score);
    } catch (e) {
      console.error("Compliance scoring error:", e);
    }
  }, [profileData]);

const getScoreLevel = (score) => {
  if (score > 90) return { level: "Fully compliant", color: "#1B5E20" };
  if (score >= 81) return { level: "Highly compliant", color: "#4CAF50" };
  if (score >= 61) return { level: "Mostly compliant", color: "#FF9800" };
  if (score >= 41) return { level: "Partially compliant", color: "#F44336" };
  return { level: "Non-compliant", color: "#B71C1C" };
};

  const scoreLevel = getScoreLevel(complianceScore);
  const barColor = (s) =>
    s > 90 ? "#1B5E20" : s >= 81 ? "#4CAF50" : s >= 61 ? "#FF9800" : s >= 41 ? "#F44336" : "#B71C1C";

  const a = assessment;

const goTo = (route) => {
  if (!route) return;
  if (onNavigate) onNavigate(route);
  else window.location.assign(route);
};

const explorer = useMemo(() => {
  if (!a) return null;

  const withRoute = (item) => {
    const { section, action, route } = parseWhere(item.where, item.documentId, item.docLabelResolved);
    const points = item.weightPct;
    const earned = Math.round(points * item.credit);
    const displayState = ["verified", "captured"].includes(item.state)
      ? "counted"
      : item.state === "partial"
      ? "partial"
      : "missing";
    return {
      ...item,
      label: `${item.displayName}${item.compulsory ? " (required)" : ""}`,
      points,
      earned,
      withheld: points - earned,
      state: displayState,
      route,
      section,
      claimable: true,
      fix: item.fix || action,
    };
  };

  const elements = COMPLIANCE_GROUPS.map((g) => {
    const items = a.documents.filter((d) => g.items.includes(d.key)).map(withRoute);
    if (!items.length) return null;
    const possible = items.reduce((s, i) => s + i.points, 0) || 1;
    const earned = items.reduce((s, i) => s + i.earned, 0);
    const percent = Math.round((earned / possible) * 100);
    const weight = Math.round(possible); // this group's share of the 100-point score
    return {
      key: g.key,
      label: g.label,
      percent,
      weight,
      effectiveWeight: weight,
      breakdown: items,
      improvements: items.filter((i) => i.pointValue > 0.05),
      sourceNote: `${earned} of ${possible} weighted points → ${percent}% of this group, worth ${weight} points of the final score.`,
    };
  }).filter(Boolean);

  const attention = [];
  if (a.blocked.length) {
    attention.push({
      key: "blockedDocs",
      headline: `${a.blocked.length} uploaded document${a.blocked.length === 1 ? "" : "s"} on file but not counting`,
      detail: `These were already uploaded but did not pass verification — worth ${fmtPts(a.blockedPoints)}. Fixing an existing upload is faster than sourcing a new document.`,
      chips: a.blocked.map((i) => `${i.displayName} — ${i.reason || "not verified"}`),
      cta: "Go to My Documents",
      route: DOCUMENTS_ROUTE,
    });
  }

  return {
    blocks: [
      {
        key: "compliance",
        label: "Compliance",
        percent: a.score,
        blockWeight: 100,
        elements,
      },
    ],
    attention,
    about: {
      definition:
        "The compliance score measures whether your business meets the core legal and regulatory requirements needed to operate formally and access funding. Weightings shift with your business stage — a mature business is expected to hold more than an early-stage one.",
      definitionNotes: [
        {
          title: "Uploaded documents",
          body: "Every document was checked when you uploaded it in My Documents — the file itself was read and its type, company name and expiry date confirmed. A verified document counts in full. A document that was rejected or has expired counts for nothing, and the reason shown here is the same one on the My Documents page. Re-upload a corrected copy there and the points return.",
        },
      ],
      assessmentAreas: a.documents.map((d) => ({
        label: `${d.displayName}${d.compulsory ? " (required)" : ""}`,
        weightLabel: `${d.weightPct}% at ${a.stageLabel.toLowerCase()}`,
        detail: d.description,
      })),
      interpretation: [
        { range: "91–100%", label: "Fully compliant", color: "#1B5E20", meaning: "Ready for all opportunities." },
        { range: "81–90%", label: "Highly compliant", color: "#4CAF50", meaning: "Minor gaps to address." },
        { range: "61–80%", label: "Mostly compliant", color: "#FF9800", meaning: "Some documentation needed." },
        { range: "41–60%", label: "Partially compliant", color: "#F44336", meaning: "Significant gaps present." },
        { range: "0–40%", label: "Non-compliant", color: "#B71C1C", meaning: "Substantial work required." },
      ],
      weighting: {
        formula: "value = (weight withheld ÷ total applicable weight) × 100",
        formulaNote: "Weightings shift by stage — items carrying no weight at this stage are not shown and cost nothing.",
        tables: [
          {
            title: `What is scored for a ${a.stageLabel.toLowerCase()} business`,
            firstColumn: "Requirement",
            rows: a.documents.map((d) => ({
              label: d.displayName,
              weight: `${d.weightPct}%`,
              now: d.credit >= 1 ? "met" : `${Math.round(d.credit * 100)}%`,
            })),
            note: `Business stage: ${a.rawStage} (${a.stageLabel} weighting).`,
          },
        ],
      },
    },
    potential: {
      available: a.availablePoints,
      locked: 0,
      current: a.totalRaw,
      projected: Math.round(a.totalRaw + a.availablePoints),
      items: a.outstanding.map((i) => {
        const w = withRoute(i);
        return {
          ...w,
          container: COMPLIANCE_GROUPS.find((g) => g.items.includes(i.key))?.label || "Compliance",
          state: i.present ? (i.credit > 0 ? "partial" : "missing") : "missing",
          importance: i.importance,
        };
      }),
      lockedItems: [],
    },
    summary: null,
  };
}, [a]);

  

return (
  <>
    {/* ── Card ── */}
    <div style={{ background: "linear-gradient(135deg, #ffffff 0%, #faf8f6 100%)", borderRadius: "20px", boxShadow: "0 8px 32px rgba(141,110,99,0.15)", border: "1px solid #e8ddd6", overflow: "hidden", position: "relative", width: "100%", minWidth: "210px" }}>
      <div style={{ background: "linear-gradient(135deg, #8d6e63 0%, #6d4c41 100%)", padding: "24px 30px 20px 30px", color: "white", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, letterSpacing: "0.5px", whiteSpace: "nowrap" }}>Compliance</h2>
          <FileCheck size={24} style={{ opacity: 0.8 }} />
        </div>
        <p style={{ margin: 0, fontSize: "13px", opacity: 0.9 }}>Legal &amp; regulatory verification</p>
        <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "80px", height: "80px", background: "rgba(255,255,255,0.1)", borderRadius: "50%", opacity: 0.6 }} />
        <div style={{ position: "absolute", bottom: "-10px", left: "-10px", width: "60px", height: "60px", background: "rgba(255,255,255,0.05)", borderRadius: "50%" }} />
      </div>

      <div style={{ padding: "24px", background: "white", textAlign: "center" }}>
        <div style={{ position: "relative", display: "inline-block", marginBottom: "24px" }}>
          <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "110px", height: "110px", border: `4px solid ${scoreLevel.color}`, borderRadius: "50%", background: "linear-gradient(135deg,#fff 0%,#f8fff8 100%)", boxShadow: `0 6px 20px ${scoreLevel.color}30`, fontWeight: "bold" }}>
            <span style={{ fontSize: "26px", fontWeight: 800, lineHeight: 1 }}>{complianceScore}%</span>
            <div style={{ position: "absolute", top: "-6px", left: "-6px", right: "-6px", bottom: "-6px", border: `2px solid ${scoreLevel.color}20`, borderRadius: "50%", animation: "pulse 2s infinite" }} />
          </div>
          <div style={{ position: "absolute", bottom: "-12px", left: "50%", transform: "translateX(-50%)", backgroundColor: scoreLevel.color, color: "white", padding: "6px 16px", borderRadius: "20px", fontSize: "10px", fontWeight: 600, letterSpacing: "0.5px", boxShadow: `0 4px 12px ${scoreLevel.color}40`, border: "2px solid white", whiteSpace: "nowrap" }}>
            {scoreLevel.level}
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", background: "linear-gradient(135deg,#5d4037 0%,#4a2c20 100%)", color: "white", marginTop: "12px", border: "none", fontWeight: 600, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", boxShadow: "0 4px 16px rgba(93,64,55,0.3)" }}
        >
          <span>Explore your score</span><ChevronDown size={16} />
        </button>
      </div>

      <style>{`@keyframes pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.7; } }`}</style>
    </div>

    {/* ── Modal — one screen at a time ── */}
    {showModal && (
      <div
        style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999999, padding: "20px" }}
        onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
      >
        <div
          style={{ position: "relative", backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)", width: "100%", maxWidth: "620px", border: "1px solid #e8ddd6", overflow: "hidden" }}
          onClick={(e) => e.stopPropagation()}
        >
          {explorer ? (
            <ScoreExplorer
              title="Compliance"
              score={complianceScore}
              band={scoreLevel}
              contextLine={
                a && (
                  <div style={{ fontSize: "11.5px", color: "#8d6e63" }}>
                    {a.rawStage} ({a.stageLabel} weighting)
                  </div>
                )
              }
              about={explorer.about}
              blocks={explorer.blocks}
              potential={explorer.potential}
              attention={explorer.attention}
              summary={explorer.summary}
              onNavigate={goTo}
              onClose={() => setShowModal(false)}
              fmtPts={fmtPts}
            />
          ) : (
            <div style={{ padding: "40px", textAlign: "center", color: "#8d6e63", fontSize: "13px" }}>
              <RefreshCw size={18} className="spin" style={{ marginBottom: "10px" }} />
              <div>Working out your score…</div>
            </div>
          )}
        </div>
      </div>
    )}

    <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </>
);
}