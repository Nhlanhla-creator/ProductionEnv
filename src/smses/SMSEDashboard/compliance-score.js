"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  Check,
  FileCheck,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  Target,
  Upload,
} from "lucide-react";
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
    if (score > 90)
      return { level: "Fully compliant", color: "#1B5E20", icon: CheckCircle };
    if (score >= 81)
      return { level: "Highly compliant", color: "#4CAF50", icon: CheckCircle };
    if (score >= 61)
      return { level: "Mostly compliant", color: "#FF9800", icon: TrendingUp };
    if (score >= 41)
      return {
        level: "Partially compliant",
        color: "#F44336",
        icon: AlertCircle,
      };
    return { level: "Non-compliant", color: "#B71C1C", icon: AlertCircle };
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

  // ── One outstanding item, expandable, with the exact value and a way there ──
  const PotentialItem = ({ item, index }) => {
    const open = openItem === item.key;
    const { section, action, route } = parseWhere(item.where, item.documentId, item.docLabelResolved);
    const projected = Math.round(a.totalRaw + item.pointValue);
    const chip = !item.present
      ? "Not uploaded yet"
      : item.credit > 0
      ? "Partly counted — worth more"
      : "On file but not counting";

    return (
      <div
        style={{
          border: `1px solid ${open ? "#c8e6c9" : "#f0e8e0"}`,
          background: "white",
          borderRadius: "10px",
          marginBottom: "8px",
          overflow: "hidden",
          transition: "border-color 0.2s ease",
        }}
      >
        <div
          onClick={() => setOpenItem(open ? null : item.key)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 14px",
            cursor: "pointer",
            background: open ? "#f7fbf7" : "white",
          }}
        >
          <span style={{ color: "#a1887f", fontWeight: 800, fontSize: "12px", minWidth: "18px" }}>
            {index + 1}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: "#4e342e", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
              {item.displayName}
              {item.compulsory && (
                <span
                  style={{
                    backgroundColor: "#F44336",
                    color: "white",
                    fontSize: "8px",
                    padding: "2px 4px",
                    borderRadius: "4px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  Required
                </span>
              )}
            </div>
            <div style={{ fontSize: "11px", color: "#8d6e63" }}>
              {item.weightPct}% weight · {chip}
            </div>
          </div>
          <span
            style={{
              backgroundColor: "#e8f5e9",
              color: "#1B5E20",
              border: "1px solid #c8e6c9",
              borderRadius: "4px",
              padding: "3px 8px",
              fontWeight: 800,
              fontSize: "11.5px",
              whiteSpace: "nowrap",
            }}
          >
            {fmtPts(item.pointValue)}
          </span>
          <ChevronDown
            size={16}
            style={{
              color: "#a1887f",
              flexShrink: 0,
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          />
        </div>

        {open && (
          <div style={{ padding: "14px", borderTop: "1px dashed #e8d8cf", background: "#fcfbfa" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "14px",
                padding: "14px",
                background: "linear-gradient(135deg,#f1f8f1 0%,#e8f5e9 100%)",
                border: "1px solid #c8e6c9",
                borderRadius: "10px",
                marginBottom: "12px",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "9.5px", color: "#6d4c41", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 700 }}>
                  Now
                </div>
                <div style={{ fontSize: "26px", fontWeight: 800, color: "#8d6e63", lineHeight: 1.1 }}>
                  {complianceScore}%
                </div>
              </div>
              <div style={{ fontSize: "22px", color: "#1B5E20", fontWeight: 800 }}>→</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "9.5px", color: "#1B5E20", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 700 }}>
                  Once this is verified
                </div>
                <div style={{ fontSize: "30px", fontWeight: 800, color: "#1B5E20", lineHeight: 1.1 }}>
                  {projected}%
                </div>
                <div style={{ fontSize: "11px", color: "#2E7D32", fontWeight: 700 }}>
                  {fmtPts(item.pointValue)}
                </div>
              </div>
            </div>

            {item.present && item.evidence && (
              <div style={{ fontSize: "12px", color: "#6d4c41", marginBottom: "8px" }}>
                <strong style={{ color: "#4e342e" }}>On file:</strong> {item.evidence}
              </div>
            )}

            {item.reason && (
              <div
                style={{
                  fontSize: "12.5px",
                  color: "#8d3a2e",
                  background: "#fdecea",
                  border: "1px solid #e6b8ac",
                  borderRadius: "8px",
                  padding: "9px 11px",
                  marginBottom: "10px",
                  lineHeight: 1.6,
                }}
              >
                {item.reason}
              </div>
            )}

            {item.guidance && !item.reason && (
              <div style={{ fontSize: "12px", color: "#8d6e63", fontStyle: "italic", marginBottom: "10px", lineHeight: 1.6 }}>
                {item.guidance}
              </div>
            )}

            <div style={{ fontSize: "10px", color: "#8d6e63", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "6px" }}>
              Why funders ask for it
            </div>
            <div style={{ fontSize: "12.5px", color: "#5d4037", marginBottom: "10px", lineHeight: 1.6 }}>
              {item.importance}
            </div>

            <div style={{ fontSize: "10px", color: "#8d6e63", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "6px" }}>
              What to do
            </div>
            <div style={{ fontSize: "12.5px", color: "#5d4037", marginBottom: "12px", lineHeight: 1.6 }}>
              {item.fix || action}
            </div>

            <button
              onClick={() => goTo(route)}
              disabled={!route}
              style={{
                padding: "9px 16px",
                background: "linear-gradient(135deg,#5d4037 0%,#4a2c20 100%)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "12px",
                cursor: route ? "pointer" : "not-allowed",
                opacity: route ? 1 : 0.55,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {section === "My Documents" ? <Upload size={13} /> : null}
              Go to {section || "the form"} <span style={{ fontSize: "13px" }}>→</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  // ── One row in the full breakdown ──
  const ItemRow = ({ item, last }) => {
    const st = STATE_STYLE[item.state] || STATE_STYLE.missing;
    const { section, route } = parseWhere(item.where, item.documentId, item.docLabelResolved);

    return (
      <div
        style={{
          padding: "13px 14px",
          background: "white",
          marginBottom: last ? 0 : "6px",
          borderRadius: "8px",
          border: "1px solid #f0e8e0",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
          <span
            style={{
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              backgroundColor: item.verified ? "#4CAF50" : "#f3e8dc",
              border: `2px solid ${item.verified ? "#4CAF50" : "#d6b88a"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: "1px",
            }}
          >
            {item.verified ? (
              <Check size={12} color="white" />
            ) : (
              <span style={{ color: st.dot, fontSize: "14px", fontWeight: "bold", lineHeight: 1 }}>×</span>
            )}
          </span>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 600,
                color: "#5d4037",
                fontSize: "13.5px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                flexWrap: "wrap",
              }}
            >
              {item.displayName}
              {item.compulsory && (
                <span
                  style={{
                    backgroundColor: "#F44336",
                    color: "white",
                    fontSize: "8px",
                    padding: "2px 4px",
                    borderRadius: "4px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  Required
                </span>
              )}
            </div>

            <div style={{ fontSize: "11.5px", color: "#8d6e63", marginTop: "2px" }}>
              {item.description} · weight {item.weightPct}% ·{" "}
              <span style={{ color: st.text, fontWeight: 700 }}>{st.label}</span>
            </div>

            {item.present && item.evidence && (
              <div style={{ fontSize: "11.5px", color: "#6d4c41", marginTop: "4px" }}>{item.evidence}</div>
            )}
            {item.reason && (
              <div style={{ fontSize: "11.5px", color: "#8d3a2e", marginTop: "4px", lineHeight: 1.5 }}>{item.reason}</div>
            )}
            {item.pointValue > 0.05 && (
              <div style={{ fontSize: "11.5px", color: "#8d3a2e", marginTop: "3px", lineHeight: 1.5 }}>
                {item.fix || parseWhere(item.where, item.documentId, item.docLabelResolved).action}
              </div>
            )}
            {item.note && (
              <div style={{ fontSize: "11px", color: "#8d6e63", fontStyle: "italic", marginTop: "3px" }}>{item.note}</div>
            )}

            {item.pointValue > 0.05 && route && (
              <button
                onClick={() => goTo(route)}
                style={{
                  marginTop: "7px",
                  background: "none",
                  border: "1px solid #d6b88a",
                  color: "#5d4037",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                {section === "My Documents" ? <Upload size={11} /> : null}
                Go to {section} →
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "5px", flexShrink: 0 }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: item.verified ? "#4CAF50" : "#FF5722" }}>
              {item.verified ? "Verified" : item.credit > 0 ? "Partial" : "Missing"}
            </span>
            {item.pointValue > 0.05 && (
              <span
                style={{
                  backgroundColor: "#e8f5e9",
                  color: "#1B5E20",
                  border: "1px solid #c8e6c9",
                  borderRadius: "4px",
                  padding: "2px 7px",
                  fontWeight: 800,
                  fontSize: "11.5px",
                  whiteSpace: "nowrap",
                }}
              >
                {fmtPts(item.pointValue)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const Section = ({ title, right, open, onToggle, children }) => (
    <div style={{ marginTop: "16px", border: "1px solid #d7ccc8", borderRadius: "8px", overflow: "hidden" }}>
      <div
        style={{
          backgroundColor: "#8d6e63",
          color: "white",
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          fontWeight: "bold",
        }}
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

  return (
    <>
      {/* ── Card ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #faf8f6 100%)",
          borderRadius: "20px",
          boxShadow: "0 8px 32px rgba(141, 110, 99, 0.15)",
          border: "1px solid #e8ddd6",
          overflow: "hidden",
          position: "relative",
          width: "100%",
          minWidth: "210px",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #8d6e63 0%, #6d4c41 100%)",
            padding: "24px 30px 20px 30px",
            color: "white",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
              Compliance
            </h2>
            <FileCheck size={24} style={{ opacity: 0.8 }} />
          </div>
          <p style={{ margin: 0, fontSize: "13px", opacity: 0.9, fontWeight: 400 }}>Legal &amp; regulatory verification</p>

          <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "80px", height: "80px", background: "rgba(255,255,255,0.1)", borderRadius: "50%", opacity: 0.6 }} />
          <div style={{ position: "absolute", bottom: "-10px", left: "-10px", width: "60px", height: "60px", background: "rgba(255,255,255,0.05)", borderRadius: "50%" }} />
        </div>

        <div style={{ padding: "24px", background: "white", textAlign: "center" }}>
          <div style={{ position: "relative", display: "inline-block", marginBottom: "24px" }}>
            <div
              style={{
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
                fontWeight: "bold",
              }}
            >
              <span style={{ fontSize: "26px", fontWeight: 800, lineHeight: 1, marginBottom: "2px" }}>
                {complianceScore}%
              </span>
              <div
                style={{
                  position: "absolute",
                  top: "-6px",
                  left: "-6px",
                  right: "-6px",
                  bottom: "-6px",
                  border: `2px solid ${scoreLevel.color}20`,
                  borderRadius: "50%",
                  animation: "pulse 2s infinite",
                }}
              />
            </div>

            <div
              style={{
                position: "absolute",
                bottom: "-12px",
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: scoreLevel.color,
                color: "white",
                padding: "6px 16px",
                borderRadius: "20px",
                fontSize: "10px",
                fontWeight: 600,
                textTransform: "capitalize",
                letterSpacing: "0.5px",
                boxShadow: `0 4px 12px ${scoreLevel.color}40`,
                border: "2px solid white",
                whiteSpace: "nowrap",
              }}
            >
              {scoreLevel.level}
            </div>
          </div>

          {/* {a && a.availablePoints > 0 && (
            <div
              style={{
                marginTop: "6px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 12px",
                background: "#e8f5e9",
                border: "1px solid #c8e6c9",
                borderRadius: "20px",
                color: "#1B5E20",
                fontWeight: 700,
                fontSize: "11px",
              }}
            >
              <Target size={12} /> {fmtPts(a.availablePoints)} available
            </div>
          )} */}

          <button
            onClick={() => setShowModal(true)}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #5d4037 0%, #4a2c20 100%)",
              color: "white",
              border: "none",
              marginTop: "15px",
              fontWeight: 600,
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 16px rgba(93, 64, 55, 0.3)",
              whiteSpace: "nowrap",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(93, 64, 55, 0.4)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0px)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(93, 64, 55, 0.3)";
            }}
          >
            <span>Score breakdown</span>
            <ChevronDown size={16} />
          </button>
        </div>

        <style>{`@keyframes pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.7; } }`}</style>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999999,
            padding: "20px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div
            style={{
              position: "relative",
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
              maxHeight: "90vh",
              overflowY: "auto",
              width: "90%",
              maxWidth: "780px",
              border: "1px solid #ccc",
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
                zIndex: 2,
                width: "35px",
                height: "35px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                fontWeight: "bold",
              }}
            >
              ×
            </button>

            <div style={{ padding: "30px 20px 20px 20px" }}>
              <h3 style={{ margin: "0 0 20px 0", fontSize: "24px", fontWeight: 600, color: "#5d4037", textAlign: "center" }}>
                Compliance verification
              </h3>

              <div
                style={{
                  textAlign: "center",
                  padding: "20px",
                  background: "linear-gradient(135deg, #fdf8f6 0%, #f3e8dc 100%)",
                  borderRadius: "12px",
                  border: "1px solid #d6b88a",
                }}
              >
                <div
                  style={{
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
                    marginBottom: "12px",
                  }}
                >
                  <span style={{ fontSize: "28px", fontWeight: 700, color: "#5d4037", lineHeight: 1 }}>
                    {complianceScore}%
                  </span>
                  <span
                    style={{
                      color: scoreLevel.color,
                      fontSize: "12px",
                      fontWeight: 600,
                      marginTop: "4px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {scoreLevel.level}
                  </span>
                </div>

                <div style={{ fontSize: "14px", color: "#6d4c41" }}>
                  Business stage:{" "}
                  <strong style={{ color: "#5d4037", textTransform: "capitalize" }}>
                    {a ? `${a.rawStage} (${a.stageLabel} weighting)` : "Ideation"}
                  </strong>
                </div>

                {a && a.availablePoints > 0 && (
                  <div
                    style={{
                      marginTop: "10px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 16px",
                      background: "#e8f5e9",
                      border: "1px solid #c8e6c9",
                      borderRadius: "20px",
                      color: "#1B5E20",
                      fontWeight: 700,
                      fontSize: "12px",
                    }}
                  >
                    <Target size={13} /> {fmtPts(a.availablePoints)} available · potential score{" "}
                    {Math.round(a.totalRaw + a.availablePoints)}%
                  </div>
                )}

                {a && a.blockedPoints > 0 && (
                  <div style={{ marginTop: "8px", fontSize: "11.5px", color: "#8d3a2e" }}>
                    {fmtPts(a.blockedPoints)} of that sits on documents you already uploaded that are not counting.
                  </div>
                )}
              </div>

              
              {/* ── About ── */}
              <Section
                title="About the compliance score"
                open={showAboutScore}
                onToggle={() => setShowAboutScore(!showAboutScore)}
              >
                <div style={{ color: "#5d4037", fontSize: "13px", lineHeight: 1.6 }}>
                  <p style={{ marginBottom: "16px" }}>
                    The compliance score measures whether your business meets the core legal and regulatory requirements
                    needed to operate formally and access funding. Weightings shift with your business stage — a mature
                    business is expected to hold more than an early-stage one.
                  </p>

                  <div style={{ backgroundColor: "#efebe9", padding: "16px", borderRadius: "8px", marginBottom: "16px", borderLeft: "4px solid #8d6e63" }}>
                    <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>How a point value is worked out</p>
                    <p
                      style={{
                        margin: 0,
                        fontFamily: "monospace",
                        fontSize: "12px",
                        backgroundColor: "white",
                        padding: "8px 10px",
                        borderRadius: "6px",
                        border: "1px solid #e0d5c8",
                      }}
                    >
                      value = (weight withheld ÷ total applicable weight) × 100
                    </p>
                  </div>

                  <div style={{ backgroundColor: "#efebe9", padding: "16px", borderRadius: "8px", marginBottom: "16px", borderLeft: "4px solid #8d6e63" }}>
                    <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>Uploaded documents</p>
                    <p style={{ margin: 0 }}>
                      Every document was checked when you uploaded it in My Documents — the file itself was read and its
                      type, company name and expiry date confirmed. A <strong>verified</strong> document counts in full.
                      A document that was rejected or has expired counts for nothing, and the reason shown here is the
                      same one on the My Documents page. Re-upload a corrected copy there and the points return.
                    </p>
                  </div>

                  {a && (
                    <div style={{ backgroundColor: "#efebe9", padding: "16px", borderRadius: "8px", marginBottom: "16px", borderLeft: "4px solid #8d6e63" }}>
                      <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>
                        What is scored for a {a.stageLabel.toLowerCase()} business
                      </p>
                      <ul style={{ margin: 0, paddingLeft: "20px", color: "#5d4037" }}>
                        {a.documents.map((d) => (
                          <li key={d.key} style={{ marginBottom: "4px" }}>
                            {d.displayName} — <strong>{d.weightPct}%</strong>
                            {d.compulsory ? " (required)" : ""}
                          </li>
                        ))}
                      </ul>
                      <p style={{ margin: "10px 0 0 0", fontSize: "12px", fontStyle: "italic", color: "#6d4c41" }}>
                        Items carrying no weight at this stage are not shown and cost you nothing.
                      </p>
                    </div>
                  )}

                  <div style={{ backgroundColor: "#efebe9", padding: "16px", borderRadius: "8px", borderLeft: "4px solid #8d6e63" }}>
                    <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>Score bands</p>
                    <ul style={{ margin: 0, paddingLeft: "20px", color: "#5d4037" }}>
                      <li style={{ marginBottom: "4px" }}>
                        <strong>91–100%:</strong> Fully compliant — ready for all opportunities
                      </li>
                      <li style={{ marginBottom: "4px" }}>
                        <strong>81–90%:</strong> Highly compliant — minor gaps to address
                      </li>
                      <li style={{ marginBottom: "4px" }}>
                        <strong>61–80%:</strong> Mostly compliant — some documentation needed
                      </li>
                      <li style={{ marginBottom: "4px" }}>
                        <strong>41–60%:</strong> Partially compliant — significant gaps present
                      </li>
                      <li style={{ marginBottom: "4px" }}>
                        <strong>0–40%:</strong> Non-compliant — substantial work required
                      </li>
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
                    <div
                      style={{
                        padding: "14px",
                        background: "#f1f8f1",
                        border: "1px solid #c8e6c9",
                        borderRadius: "8px",
                        color: "#2E7D32",
                        lineHeight: 1.7,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 800,
                          marginBottom: "4px",
                          fontSize: "12px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        <CheckCircle size={14} /> Nothing left to claim
                      </div>
                      Every document required of a {a.stageLabel.toLowerCase()} business is on file and verified.
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          padding: "16px",
                          background: "linear-gradient(135deg,#fdf8f6 0%,#e8f5e9 100%)",
                          border: "1px solid #c8e6c9",
                          borderRadius: "10px",
                          marginBottom: "14px",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ fontSize: "10px", color: "#1B5E20", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.7px" }}>
                          Your score could reach
                        </div>
                        <div style={{ fontSize: "34px", fontWeight: 800, color: "#1B5E20", lineHeight: 1.2 }}>
                          {Math.round(a.totalRaw + a.availablePoints)}%
                        </div>
                        <div style={{ fontSize: "12.5px", color: "#5d4037", lineHeight: 1.6 }}>
                          {complianceScore}% today ·{" "}
                          <strong style={{ color: "#1B5E20" }}>{fmtPts(a.availablePoints)}</strong> sitting in{" "}
                          {a.outstanding.length} item{a.outstanding.length === 1 ? "" : "s"} below
                        </div>
                        <div style={{ fontSize: "11.5px", color: "#8d6e63", marginTop: "6px", fontStyle: "italic" }}>
                          Tap any item to see what it is worth and go straight to the upload.
                        </div>
                      </div>

                      {a.blocked.length > 0 && (
                        <div
                          style={{
                            padding: "10px 12px",
                            background: "#fdecea",
                            border: "1px solid #e6b8ac",
                            borderRadius: "8px",
                            fontSize: "11.5px",
                            color: "#8d3a2e",
                            lineHeight: 1.6,
                            marginBottom: "12px",
                          }}
                        >
                          <strong>Start here.</strong> {a.blocked.length} document
                          {a.blocked.length === 1 ? " is" : "s are"} already uploaded but did not pass verification, worth{" "}
                          {fmtPts(a.blockedPoints)}. Fixing an existing upload is faster than sourcing a new document.
                        </div>
                      )}

                      {a.outstanding.map((item, i) => (
                        <PotentialItem key={item.key} item={item} index={i} />
                      ))}

                      <div
                        style={{
                          marginTop: "10px",
                          padding: "10px 12px",
                          background: "#f9f5f0",
                          border: "1px solid #e6d3c4",
                          borderRadius: "8px",
                          fontSize: "11.5px",
                          color: "#6d4c41",
                          lineHeight: 1.6,
                        }}
                      >
                        Each figure is the exact amount the score moves when that item is verified — the same function
                        promises it and awards it.
                      </div>
                    </>
                  )}
                </Section>
              )}

              {/* ── Score breakdown ── */}
              {a && (
                <Section
                  title="Score breakdown"
                  right={`${complianceScore}%`}
                  open={showScoreBreakdown}
                  onToggle={() => setShowScoreBreakdown(!showScoreBreakdown)}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "12px",
                      padding: "10px 12px",
                      background: "white",
                      border: "1px solid #f0e8e0",
                      borderRadius: "8px",
                    }}
                  >
                    <div style={{ flex: 1, height: "10px", background: "#f3e8dc", borderRadius: "5px", overflow: "hidden", border: "1px solid #d6b88a" }}>
                      <div
                        style={{
                          width: `${complianceScore}%`,
                          height: "100%",
                          background: barColor(complianceScore),
                          borderRadius: "5px",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                    <span style={{ fontWeight: 700, color: "#5d4037", fontSize: "14px", minWidth: "42px", textAlign: "right" }}>
                      {complianceScore}%
                    </span>
                  </div>

                  {a.documents.map((item, i) => (
                    <ItemRow key={item.key} item={item} last={i === a.documents.length - 1} />
                  ))}
                </Section>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
}