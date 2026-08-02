"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Info, Calendar, X, Eye, ChevronDown, MoreVertical, CheckCircle,
  Clock, Users, Download, MessageSquare, ArrowRight, SlidersHorizontal,
  RotateCcw, Settings, Target, Briefcase, Video, LayoutGrid, Trash2, Plus,
  GripVertical, ExternalLink, AlertTriangle, Shield, XCircle
} from "lucide-react";
import { db, auth, storage } from "../../firebaseConfig";
import {
  collection, query, where, onSnapshot, updateDoc, doc, getDoc, getDocs, addDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import * as XLSX from "xlsx";
import Modal from "components/Modal/Modal";
import Upsell from "../../components/Upsell/Upsell";
import useSubscriptionPlan from "../../hooks/useSubscriptionPlan";
import InvestorSMEDetailsModal from "./InvestorSMEDetailsModal";
import { addInvestorNotification } from "../NotificationInvestor";
import {
  DEFAULT_STAGES, PROGRAMME_TEMPLATES, mapStatusToStageId, getStageColors,
  getNextStageId, getStageActionConfig, loadPipelineSettings, getActiveStages,
  PIPELINE_SETTINGS_EVENT, notifyPipelineRefresh,
} from "./investorStageConfig";

// ─── Constants & Helpers ──────────────────────────────────────────────────────
const BIG_SCORE_LABELS = {
  excellent: { min: 80, label: "Excellent", color: "#22c55e" },
  strong: { min: 60, label: "Strong", color: "#86efac" },
  moderate: { min: 40, label: "Moderate", color: "#f59e0b" },
  weak: { min: 20, label: "Weak", color: "#ef4444" },
  critical: { min: 0, label: "Critical", color: "#dc2626" }
};

// Match % maps to a plain label + fit bar rather than a raw number alone
const MATCH_LABELS = {
  excellent: { min: 80, label: "Excellent Fit", color: "#22c55e" },
  strong: { min: 60, label: "Strong Fit", color: "#86efac" },
  moderate: { min: 40, label: "Moderate Fit", color: "#f59e0b" },
  weak: { min: 20, label: "Weak Fit", color: "#ef4444" },
  poor: { min: 0, label: "Poor Fit", color: "#dc2626" }
};

const getBigScoreLabel = (score) => {
  for (const value of Object.values(BIG_SCORE_LABELS)) {
    if (score >= value.min) return value;
  }
  return BIG_SCORE_LABELS.critical;
};

const getMatchLabel = (score) => {
  for (const value of Object.values(MATCH_LABELS)) {
    if (score >= value.min) return value;
  }
  return MATCH_LABELS.poor;
};

// Stage lookups take the currently *active* stage list as a parameter (BIG
// Default, or whichever PROGRAMME_TEMPLATES entry the investor has switched
// to, with any customization applied) — rather than always resolving against
// the flat DEFAULT_STAGES import. Without this, an investor switching to e.g.
// the Grant Funding template (which introduces a "Committee Review" stage)
// would find that stage never shows up anywhere in this table.
const getStageById = (id, stages = DEFAULT_STAGES) =>
  stages.find((s) => s.id === id) || stages[0];

const getStatusStyle = (status, stages = DEFAULT_STAGES) => {
  const stage = getStageById(mapStatusToStageId(status, stages), stages);
  const colors = getStageColors(stage.group);
  return { bg: colors.bgColor, text: colors.color, border: colors.borderColor, dot: colors.color, stage };
};

// Reads whatever the investor configured in the pipeline's "Stage Actions"
// settings panel.
const getStageFields = (stageName, stages = DEFAULT_STAGES) => {
  const id = mapStatusToStageId(stageName, stages);
  const overrides = loadPipelineSettings().customization?.stageActions || {};
  return getStageActionConfig(id, overrides);
};

const getNextStage = (currentStage, stages = DEFAULT_STAGES) => {
  const currentId = mapStatusToStageId(currentStage, stages);
  const nextId = getNextStageId(stages, currentId);
  return getStageById(nextId, stages).name;
};

const formatLabel = (value) => {
  if (!value) return "";
  return value
    .toString()
    .split(",")
    .map((item) => item.trim())
    .map((word) => {
      if (word.toLowerCase() === "ict") return "ICT";
      if (word.toLowerCase() === "southafrica" || word.toLowerCase() === "south_africa") return "South Africa";
      return word
        .split(/[_\s-]+/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
    })
    .join(", ");
};

const formatCurrency = (value) => {
  if (!value || value === "-" || value === "N/A") return value || "N/A";
  const num = parseFloat(value.toString().replace(/[^0-9.]/g, ""));
  if (isNaN(num) || num === 0) return "N/A";
  if (num >= 1000000) return `R${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `R${(num / 1000).toFixed(0)}K`;
  return `R${num}`;
};

// Derives how many calendar days have elapsed since the stage was last
// updated. Handles the shapes `updatedAt` can arrive in:
//   • ISO string (what this collection writes)  → new Date(string)
//   • Firestore Timestamp object                → .toDate()
//   • Serialised { seconds, nanoseconds }       → seconds * 1000
//   • Already a JS Date                         → use directly
const calculateDaysInStage = (updatedAt) => {
  if (!updatedAt) return 0;
  let date;
  if (typeof updatedAt === "string") {
    date = new Date(updatedAt);
  } else if (typeof updatedAt?.toDate === "function") {
    date = updatedAt.toDate();
  } else if (updatedAt?.seconds != null) {
    date = new Date(updatedAt.seconds * 1000);
  } else if (updatedAt instanceof Date) {
    date = updatedAt;
  } else {
    return 0;
  }
  if (isNaN(date.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)));
};

// ─── Attention indicator ──────────────────────────────────────────────────────
const getAttentionReasons = (sme, stages = DEFAULT_STAGES) => {
  const reasons = [];
  if ((sme.daysInStage || 0) >= 14) reasons.push("Stalled for 14+ days");
  if ((sme.bigScore || 0) < 40 && sme.bigScore > 0) reasons.push("BIG Score below threshold");
  const stageId = mapStatusToStageId(sme.pipelineStage, stages);
  if (stageId === "decision") reasons.push("Decision pending");
  if (stageId === "evaluation" && (sme.daysInStage || 0) >= 7) reasons.push("Evaluation overdue");
  if (stageId === "terms" && (sme.daysInStage || 0) >= 7) reasons.push("Terms awaiting response");
  return reasons;
};

// ─── Match scoring ────────────────────────────────────────────────────────────
const normalizeText = (str) => {
  if (!str) return "";
  return str.toString().toLowerCase().trim().replace(/[^\w\s]/g, "").replace(/\s+/g, "_");
};

const normalizeArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((i) => normalizeText(i)).filter(Boolean);
  return [normalizeText(value)].filter(Boolean);
};

const normalizeAmount = (value) => {
  if (!value) return 0;
  if (typeof value === "number") return value;
  const clean = value.toString().replace(/[^\d.]/g, "").replace(/^\./, "0.");
  return Math.round((Number.parseFloat(clean) || 0) * 100) / 100;
};

const SECTOR_SYNONYMS = {
  general: "generalist", generalist: "generalist",
  agri: "agriculture", agriculture: "agriculture", farming: "agriculture",
  auto: "automotive", automotive: "automotive", cars: "automotive", vehicles: "automotive",
  banking: "banking_finance_insurance", finance: "banking_finance_insurance",
  insurance: "banking_finance_insurance", financial_services: "banking_finance_insurance",
  banking_finance_insurance: "banking_finance_insurance",
};

const INSTRUMENT_SYNONYMS = {
  equity: "equity", preferred_equity: "preferred_equity", preferred: "preferred_equity",
  debt: "debt", loan: "debt", grant: "grant", funding: "grant",
  skills_training: "skills_training", training: "skills_training", mentorship: "skills_training",
};

const STAGE_SYNONYMS = {
  pre_seed: "early_pre_seed", seed: "early_seed", series_a: "venture_series_a",
  series_b: "venture_series_b", series_c: "venture_series_c", growth: "late_growth_pe",
  pe: "late_growth_pe", mbo: "late_mbo", mbi: "late_mbi", lbo: "late_lbo",
  early_pre_seed: "early_pre_seed", early_seed: "early_seed",
  venture_series_a: "venture_series_a", venture_series_b: "venture_series_b",
  late_growth_pe: "late_growth_pe",
};

const normalizeSector = (value) => (value ? SECTOR_SYNONYMS[normalizeText(value)] || normalizeText(value) : "");
const normalizeInstrument = (value) => (value ? INSTRUMENT_SYNONYMS[normalizeText(value)] || normalizeText(value) : "");
const normalizeStage = (value) => (value ? STAGE_SYNONYMS[normalizeText(value)] || normalizeText(value) : "");

const formatInvestmentStage = (stage) => {
  const stageMap = {
    early_pre_seed: "Pre-Seed", early_seed: "Seed", venture_series_a: "Series A",
    venture_series_b: "Series B", late_growth_pe: "Growth",
  };
  if (Array.isArray(stage)) return stage.map((s) => stageMap[s?.toLowerCase()] || s).join(", ");
  if (typeof stage === "string") {
    if (stage.includes(",")) {
      return stage.split(",").map((s) => stageMap[s.trim().toLowerCase()] || s.trim()).join(", ");
    }
    return stageMap[stage.toLowerCase()] || stage;
  }
  return "Various";
};

// Match breakdown carries a score and a weight per component, so the popup can
// show both the component score and how much it actually moved the total.
const calculateInvestorMatchScore = (investorProfile, smeApplication) => {
  const weights = { sector: 0.5, stage: 0.2, ticket: 0.2, type: 0.1 };
  let score = 0;
  const breakdown = {
    sector: { score: 0, matched: [], investorSectors: [], smeSectors: [], weight: weights.sector },
    stage: { score: 0, investorStages: [], smeStage: "", matched: false, weight: weights.stage },
    ticket: { score: 0, investorMin: 0, investorMax: 0, smeAmount: 0, inRange: false, weight: weights.ticket },
    type: { score: 0, investorInstruments: [], smeInstruments: [], matchedInstruments: [], weight: weights.type },
  };
  if (!investorProfile || !smeApplication) return { score: 0, breakdown };

  const investorSectors = normalizeArray(investorProfile.generalInvestmentPreference?.sectorFocus).map(normalizeSector);
  const investorStages = normalizeArray(investorProfile.generalInvestmentPreference?.investmentStage).map(normalizeStage);
  const investorInstruments = normalizeArray(investorProfile.generalInvestmentPreference?.investmentFocus).map(normalizeInstrument);
  const investorMinTicket = normalizeAmount(investorProfile.fundDetails?.funds?.[0]?.minimumTicket || 0);
  const investorMaxTicket = normalizeAmount(investorProfile.fundDetails?.funds?.[0]?.maximumTicket || 0) || Infinity;

  const smeSectors = normalizeArray(smeApplication.entityOverview?.economicSectors).map(normalizeSector);
  const smeStage = normalizeStage(smeApplication.applicationOverview?.fundingStage);
  const smeAmount = normalizeAmount(smeApplication.useOfFunds?.amountRequested);
  const smeInstruments = normalizeArray(smeApplication.useOfFunds?.fundingInstruments).map(normalizeInstrument);

  const matchedSectors = smeSectors.filter((s) => investorSectors.includes(s));
  const sectorScore = matchedSectors.length > 0 ? 10 : 0;
  score += sectorScore * weights.sector;
  breakdown.sector = { ...breakdown.sector, score: sectorScore * 10, matched: matchedSectors, investorSectors, smeSectors };

  const stageMatch = investorStages.includes(smeStage) ? 10 : 0;
  score += stageMatch * weights.stage;
  breakdown.stage = { ...breakdown.stage, score: stageMatch * 10, investorStages, smeStage, matched: stageMatch > 0 };

  let ticketScore = 0;
  if (smeAmount >= investorMinTicket && smeAmount <= investorMaxTicket) {
    ticketScore = 10;
  } else {
    const distance = smeAmount < investorMinTicket ? investorMinTicket - smeAmount : smeAmount - investorMaxTicket;
    const range = (investorMaxTicket === Infinity ? investorMinTicket : investorMaxTicket - investorMinTicket) || 1;
    ticketScore = Math.max(0, 10 - Math.min((distance / range) * 10, 10));
  }
  score += ticketScore * weights.ticket;
  breakdown.ticket = {
    ...breakdown.ticket, score: ticketScore * 10, investorMin: investorMinTicket,
    investorMax: investorMaxTicket === Infinity ? 0 : investorMaxTicket, smeAmount,
    inRange: smeAmount >= investorMinTicket && smeAmount <= investorMaxTicket,
  };

  const matchedInstruments = investorInstruments.filter((inv) => smeInstruments.includes(inv));
  const typeMatch = matchedInstruments.length > 0 ? 10 : 0;
  score += typeMatch * weights.type;
  breakdown.type = { ...breakdown.type, score: typeMatch * 10, investorInstruments, smeInstruments, matchedInstruments };

  return { score: Math.round(score * 10), breakdown };
};

// Small helper component so all popups can be portaled straight to <body>.
const PopupPortal = ({ children }) => {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
};

// ─── Column header info tooltip ───────────────────────────────────────────────
const HeaderInfoTooltip = ({ text }) => {
  const [rect, setRect] = useState(null);
  return (
    <span
      onMouseEnter={(e) => setRect(e.currentTarget.getBoundingClientRect())}
      onMouseLeave={() => setRect(null)}
      className="inline-flex"
    >
      <Info size={12} style={{ color: "#d9c7b8" }} className="opacity-80 hover:opacity-100" />
      {rect && (
        <PopupPortal>
          <div
            className="fixed z-[1200] bg-[#4a352f] text-[#faf7f2] text-xs rounded-lg px-3 py-2 shadow-2xl pointer-events-none normal-case font-normal"
            style={{
              top: rect.bottom + 8,
              left: Math.min(Math.max(rect.left - 90, 12), window.innerWidth - 232),
              width: "220px",
            }}
          >
            {text}
          </div>
        </PopupPortal>
      )}
    </span>
  );
};

// ─── Reorderable column definitions ───────────────────────────────────────────
// These are the columns that live *between* the pinned "Business Name" (always
// first) and "Actions" (always last) columns. Users can drag these to reorder
// them; the array below is only the default/fallback order.
const DEFAULT_COLUMN_ORDER = [
  "bigScore", "match", "fundingStage", "fundingRequired", "status", "applied",
  "daysInStage", "lastActivity", "location", "sector", "instrument", "guarantees",
  "support", "revenue", "teamSize"
];

const COLUMN_DEFS = {
  bigScore: { label: "BIG Score", align: "center", minWidth: "100px", filterType: "bigScore", tooltip: "BIG Score measures business credibility and readiness — compliance, legitimacy, fundability, PIS, and leadership." },
  match: { label: "Match %", align: "center", minWidth: "110px", filterType: "match", tooltip: "Match Score measures fit with your mandate — sector, stage, ticket size and instrument." },
  fundingStage: { label: "Funding Stage", align: "left", minWidth: "94px", filterType: "fundingStage" },
  fundingRequired: { label: "Funding", align: "left", minWidth: "92px", filterType: "fundingRequired" },
  status: { label: "Status", align: "left", minWidth: "100px", filterType: "status" },
  applied: { label: "Applied", align: "left", minWidth: "92px", filterType: "applied" },
  daysInStage: { label: "Days in Stage", align: "left", minWidth: "134px", filterType: "daysInStage" },
  lastActivity: { label: "Last Activity", align: "left", minWidth: "108px", filterType: "lastActivity" },
  location: { label: "Location", align: "left", minWidth: "92px", filterType: "location" },
  sector: { label: "Sector", align: "left", minWidth: "100px", filterType: "sector" },
  instrument: { label: "Instrument", align: "left", minWidth: "100px", filterType: "instrument" },
  guarantees: { label: "Guarantees", align: "left", minWidth: "110px", filterType: "guarantees" },
  support: { label: "Support", align: "left", minWidth: "92px", filterType: "support" },
  revenue: { label: "Revenue", align: "left", minWidth: "96px", filterType: "revenue" },
  teamSize: { label: "Team Size", align: "left", minWidth: "92px", filterType: "teamSize" }
};

// Maps a column key (used for visibility/order) to the actual field name on
// the mapped row object — these don't always match (e.g. the "sme" column
// shows the `name` field, "match" shows `matchPercentage`).
const EXPORT_FIELD_MAP = {
  sme: "name",
  bigScore: "bigScore",
  match: "matchPercentage",
  fundingStage: "fundingStage",
  fundingRequired: "fundingRequired",
  status: "currentStatus",
  applied: "applicationDate",
  location: "location",
  sector: "sector",
  instrument: "investmentType",
  guarantees: "guaranteesSummary",
  support: "supportRequired",
  revenue: "revenue",
  teamSize: "teamSize",
  daysInStage: "daysInStage",
  lastActivity: "lastActivity"
  // Note: "action" is intentionally omitted — it's a UI-only column.
};

const EXPORT_HEADERS = {
  sme: "Business Name", bigScore: "BIG Score", match: "Match %",
  fundingStage: "Funding Stage", fundingRequired: "Funding Required",
  status: "Status", applied: "Applied Date", location: "Location",
  sector: "Sector", instrument: "Instrument", guarantees: "Guarantees",
  support: "Support Required", revenue: "Annual Revenue", teamSize: "Team Size",
  daysInStage: "Days in Stage", lastActivity: "Last Activity"
};

// ─── Custom Views ─────────────────────────────────────────────────────────────
// A "view" bundles every layout preference a person can customize — column
// visibility, column order, sort, and density — into one named, describable
// object, with exactly one view "active" at a time. Editing the table always
// edits the active view; there's no separate hidden "current layout" that can
// silently drift out of sync with whatever view you think you're on.
const DEFAULT_COLUMN_VISIBILITY = {
  sme: true, bigScore: true, match: true, fundingStage: true,
  fundingRequired: true, status: true, applied: true, action: true,
  daysInStage: true, lastActivity: true,
  location: false, sector: false, instrument: false, guarantees: false,
  support: false, revenue: false, teamSize: false
};
const DEFAULT_SORT_CONFIG = { key: "attentionThenScore", direction: "desc" };
const DEFAULT_DENSITY = "comfortable";

const BUILTIN_VIEW_ID = "__default__";
const VIEWS_STORAGE_KEY = "investor-sme-table-views-v2";

// Keeps a stored column order valid against the columns this build of the
// table actually knows about: drops keys that no longer exist, and appends any
// newly-introduced columns so a future column addition can't silently corrupt
// an old saved view's header row.
const sanitizeColumnOrder = (order) => {
  if (!Array.isArray(order)) return [...DEFAULT_COLUMN_ORDER];
  const known = new Set(DEFAULT_COLUMN_ORDER);
  const deduped = order.filter((key) => known.has(key));
  const missing = DEFAULT_COLUMN_ORDER.filter((key) => !deduped.includes(key));
  return [...deduped, ...missing];
};

const createDefaultViewLayout = () => ({
  columnVisibility: { ...DEFAULT_COLUMN_VISIBILITY },
  columnOrder: [...DEFAULT_COLUMN_ORDER],
  sortConfig: { ...DEFAULT_SORT_CONFIG },
  density: DEFAULT_DENSITY,
  columnWidths: {},
});

const createBuiltinDefaultView = () => ({
  id: BUILTIN_VIEW_ID,
  name: "Default",
  description: "",
  builtin: true,
  ...createDefaultViewLayout(),
});

const sanitizeView = (view, fallbackId) => ({
  id: view?.id || fallbackId,
  name: (view?.name || "Untitled view").toString(),
  description: (view?.description || "").toString(),
  builtin: !!view?.builtin,
  columnVisibility: { ...DEFAULT_COLUMN_VISIBILITY, ...(view?.columnVisibility || {}) },
  columnOrder: sanitizeColumnOrder(view?.columnOrder),
  sortConfig: view?.sortConfig?.key ? view.sortConfig : { ...DEFAULT_SORT_CONFIG },
  density: view?.density || DEFAULT_DENSITY,
  columnWidths: view?.columnWidths || {},
});

const loadViewsState = () => {
  const freshDefault = () => ({ activeViewId: BUILTIN_VIEW_ID, views: { [BUILTIN_VIEW_ID]: createBuiltinDefaultView() } });
  if (typeof window === "undefined") return freshDefault();
  try {
    const saved = JSON.parse(window.localStorage.getItem(VIEWS_STORAGE_KEY) || "null");
    const rawViews = saved?.views && typeof saved.views === "object" ? saved.views : {};
    const views = {};
    Object.entries(rawViews).forEach(([id, v]) => { views[id] = sanitizeView(v, id); });
    views[BUILTIN_VIEW_ID] = views[BUILTIN_VIEW_ID]
      ? { ...views[BUILTIN_VIEW_ID], id: BUILTIN_VIEW_ID, name: "Default", builtin: true }
      : createBuiltinDefaultView();
    const activeViewId = saved?.activeViewId && views[saved.activeViewId] ? saved.activeViewId : BUILTIN_VIEW_ID;
    return { activeViewId, views };
  } catch {
    return freshDefault();
  }
};

const persistViewsState = (state) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can fail (private browsing, quota) — the table still works for
    // the current session, it just won't persist across reloads.
  }
};

const generateViewId = () => {
  try {
    return `view_${crypto.randomUUID()}`;
  } catch {
    return `view_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
};

// ─── Default stage messages ───────────────────────────────────────────────────
const DEFAULT_STAGE_MESSAGES = {
  evaluation: "Dear Valued Partner,\n\nWe are pleased to inform you that your funding application has progressed to our evaluation stage. Our investment team will conduct a thorough review of your business proposal, financial projections, and growth potential.\n\nWe appreciate your patience during this assessment period and will keep you informed of our progress.\n\nBest regards,\nInvestment Review Team",
  diligence: "Dear Valued Partner,\n\nYour application has progressed to the Due Diligence stage. Our team will now review your business operations, financials, and compliance documentation.\n\nWe may reach out for additional information during this process and appreciate your cooperation.\n\nBest regards,\nDue Diligence Team",
  decision: "Dear Esteemed Entrepreneur,\n\nCongratulations! We are delighted to inform you that your funding application has been approved. After careful consideration of your business proposal, we are excited to support your growth journey.\n\nPlease find the funding details below for your review and confirmation.\n\nBest regards,\nFunding Approval Team",
  terms: "Dear Esteemed Entrepreneur,\n\nFollowing our evaluation, we are pleased to present our formal term sheet for your consideration. This document outlines the proposed investment terms, conditions, and partnership structure.\n\nPlease review it carefully and let us know if you have any questions.\n\nKindest regards,\nInvestment Committee",
  closed: "Dear Business Partner,\n\nIt is with great pleasure that we confirm the successful completion of your funding arrangement. We are excited to embark on this partnership and support your growth objectives.\n\nOur team will be in contact shortly to finalise all administrative requirements.\n\nWarm regards,\nPartnership Team",
  declined: "Dear Applicant,\n\nThank you for presenting your business opportunity to our investment committee. After careful consideration, we regret to inform you that we are unable to proceed with funding at this time.\n\nThis decision does not reflect the quality of your business concept, and we encourage you to continue pursuing your goals.\n\nRespectfully,\nInvestment Committee",
};

// ─── Guarantees Modal ─────────────────────────────────────────────────────────
const GUARANTEE_CATEGORIES = [
  {
    title: "Forward Contracts (Revenue Guarantees)",
    guarantees: [
      { key: "signedCustomerContracts", label: "Signed customer contracts with clear payment terms" },
      { key: "purchaseOrders", label: "Purchase orders (POs) from reputable buyers" },
      { key: "offtakeAgreements", label: "Offtake agreements" },
      { key: "subscriptionRevenue", label: "Subscription revenue from signed clients" },
    ],
  },
  {
    title: "Payment or Credit Guarantees",
    guarantees: [
      { key: "letterOfGuarantee", label: "Letter of guarantee or letter of credit" },
      { key: "thirdPartyGuarantees", label: "Third-party payment guarantees" },
      { key: "factoringAgreements", label: "Factoring agreements" },
      { key: "suretyBonds", label: "Surety bonds on contracts or performance" },
    ],
  },
  {
    title: "Government or Institutional Support",
    guarantees: [
      { key: "governmentContracts", label: "Government contracts or grants" },
      { key: "approvedSupplierStatus", label: "Approved supplier status" },
      { key: "incubatorGuarantees", label: "Incubator or accelerator guarantees" },
      { key: "exportCreditGuarantees", label: "Export credit guarantees" },
    ],
  },
  {
    title: "Asset-backed Guarantees",
    guarantees: [
      { key: "liensCollateral", label: "Liens, collateral, security interests" },
      { key: "securedAssets", label: "Secured assets used in contract delivery" },
      { key: "retentionGuarantees", label: "Retention guarantees" },
    ],
  },
  {
    title: "Trade Cover & Receivables",
    guarantees: [
      { key: "exportCreditInsurance", label: "Export credit or trade insurance cover" },
      { key: "receivablesFinancing", label: "Factoring or receivables-backed financing" },
    ],
  },
  {
    title: "Personal or Third-Party Guarantees",
    guarantees: [
      { key: "personalSurety", label: "Personal surety from directors or shareholders" },
      { key: "corporateGuarantees", label: "Corporate guarantees from a partner or holding company" },
    ],
  },
];

const GuaranteesModal = ({ guarantees, businessName, onClose }) => {
  if (!guarantees) return null;
  const value = (key) => guarantees[key] || "no";
  const files = (key) => guarantees[`${key}Files`] || [];
  const availableCount = Object.keys(guarantees).filter((k) => !k.includes("Files") && guarantees[k] === "yes").length;
  const withDocsCount = Object.keys(guarantees).filter((k) => k.includes("Files") && guarantees[k]?.length > 0).length;
  const totalTypes = GUARANTEE_CATEGORIES.reduce((t, c) => t + c.guarantees.length, 0);

  return (
    <PopupPortal>
      <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-[#4a352f]/40 backdrop-blur-sm font-sans p-4" onClick={onClose}>
        <div className="bg-white rounded-3xl shadow-2xl border border-[#e6d7c3] w-[720px] max-w-full max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white sticky top-0 z-10 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Guarantees</p>
              <h3 className="text-sm font-bold mt-0.5">{businessName}</h3>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white p-1"><X size={18} /></button>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { value: availableCount, label: "Available", color: "#22c55e" },
                { value: withDocsCount, label: "With documents", color: "#7d5a50" },
                { value: totalTypes, label: "Total types", color: "#4a352f" },
              ].map((s) => (
                <div key={s.label} className="bg-[#faf7f2] rounded-xl border border-[#e6d7c3] p-3 text-center">
                  <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs text-[#7d5a50] mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {GUARANTEE_CATEGORIES.map((category) => (
              <div key={category.title} className="mb-4 rounded-xl border border-[#e6d7c3] overflow-hidden">
                <h4 className="bg-[#f5f0e1] px-4 py-2.5 text-xs font-semibold text-[#4a352f] uppercase tracking-wide">{category.title}</h4>
                <div className="p-3 bg-white">
                  {category.guarantees.map((g) => (
                    <div key={g.key} className="flex items-center justify-between gap-3 py-2 border-b border-[#f0e6d9] last:border-0">
                      <span className="text-xs text-[#4a352f] flex-1">{g.label}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {files(g.key).length > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f5f0e1] text-[#7d5a50] font-medium">
                            {files(g.key).length} file{files(g.key).length > 1 ? "s" : ""}
                          </span>
                        )}
                        <span
                          className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                          style={{
                            backgroundColor: value(g.key) === "yes" ? "#dcfce7" : "#f3f4f6",
                            color: value(g.key) === "yes" ? "#166534" : "#6b7280",
                          }}
                        >
                          {value(g.key) === "yes" ? "Yes" : "No"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PopupPortal>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────
export function InvestorSMETable({ filters, stageFilter, onDealComplete, onSMEsLoaded }) {
  const navigate = useNavigate();
  const { currentPlan, subscriptionLoading } = useSubscriptionPlan();

  const [rawApps, setRawApps] = useState([]);
  const [investorProfile, setInvestorProfile] = useState(null);
  const [bigScoresMap, setBigScoresMap] = useState({});
  const [matchBreakdowns, setMatchBreakdowns] = useState({});
  const [termsheetStatuses, setTermsheetStatuses] = useState({});
  const [updatedStages, setUpdatedStages] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ─── Views ────────────────────────────────────────────────────────────────
  // viewsState = { activeViewId, views: { [id]: {...layout} } }. The four
  // "live" pieces below are what the rest of the table renders from; they're
  // initialized from the active view and auto-saved back into that same view
  // on every change. Switching views is the only thing that reassigns them
  // from a *different* view's stored layout.
  const [viewsState, setViewsState] = useState(() => loadViewsState());
  const initialActiveView = viewsState.views[viewsState.activeViewId] || viewsState.views[BUILTIN_VIEW_ID];
  const [columnVisibility, setColumnVisibility] = useState(() => initialActiveView.columnVisibility);
  const [columnOrder, setColumnOrder] = useState(() => initialActiveView.columnOrder);
  const [sortConfig, setSortConfig] = useState(() => initialActiveView.sortConfig);
  const [density, setDensity] = useState(() => initialActiveView.density);
  const [columnWidths, setColumnWidths] = useState(() => initialActiveView.columnWidths || {});

  const [showColumnChooser, setShowColumnChooser] = useState(false);
  const [columnChooserRect, setColumnChooserRect] = useState(null);
  const [showNewViewForm, setShowNewViewForm] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const [newViewDescription, setNewViewDescription] = useState("");
  const [editingViewMeta, setEditingViewMeta] = useState(null);

  const [headerFilterOpen, setHeaderFilterOpen] = useState(null);
  const [localFilters, setLocalFilters] = useState({
    name: "", fundingStage: [], bigScoreRange: [0, 100], matchRange: [0, 100], status: [],
    sector: [], instrument: [], fundingRequiredRange: [null, null], daysInStageRange: [null, null],
    appliedRange: [null, null], location: "", lastActivity: "", guarantees: "", support: "",
    revenue: "", teamSize: ""
  });
  const [notification, setNotification] = useState(null);
  const [hoveredRowKey, setHoveredRowKey] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Column drag-to-reorder state
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [dragHintRect, setDragHintRect] = useState(null);

  // Popup states
  const [activePopup, setActivePopup] = useState(null);
  const [selectedSMEForPopup, setSelectedSMEForPopup] = useState(null);
  const [showSMEDetails, setShowSMEDetails] = useState(false);
  const [selectedSMEDetails, setSelectedSMEDetails] = useState(null);
  const [bigScoreLoading, setBigScoreLoading] = useState(false);
  const [bigScoreData, setBigScoreData] = useState({
    compliance: { score: 0 }, legitimacy: { score: 0 }, fundability: { score: 0 },
    pis: { score: 0 }, leadership: { score: 0 }
  });
  const [matchBreakdownData, setMatchBreakdownData] = useState(null);
  const [showGuarantees, setShowGuarantees] = useState(null); // { guarantees, name }
  const [showStageUpsell, setShowStageUpsell] = useState(false);

  // Stage update form
  const [stageUpdateData, setStageUpdateData] = useState({
    nextStage: "", message: "", meetingTime: "", meetingLocation: "", meetingPurpose: "",
    termSheetFile: null, amountAsked: "", amountApproved: "", investmentType: "", paymentDeployment: ""
  });
  const [stageFormErrors, setStageFormErrors] = useState({});
  const [isStageSubmitting, setIsStageSubmitting] = useState(false);
  const [availabilities, setAvailabilities] = useState([]);
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  const [tempDates, setTempDates] = useState([]);
  const [timeSlot, setTimeSlot] = useState({ start: "09:00", end: "17:00" });
  const [timeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // ─── Programme-aware pipeline stages ──────────────────────────────────────
  // Pipeline settings (active programme template plus any customization) live
  // in the shared localStorage key InvestorDealFlowPipeline.jsx writes to, so
  // the table's stage list always matches whatever pipeline is selected.
  const [pipelineSettings, setPipelineSettings] = useState(() => loadPipelineSettings());

  useEffect(() => {
    const refresh = () => setPipelineSettings(loadPipelineSettings());
    window.addEventListener("storage", refresh);
    window.addEventListener(PIPELINE_SETTINGS_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(PIPELINE_SETTINGS_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const activeProgrammeLabel = (PROGRAMME_TEMPLATES[pipelineSettings.programmeType] || PROGRAMME_TEMPLATES.default).label;
  const activeStages = useMemo(() => getActiveStages(pipelineSettings), [pipelineSettings]);

  const activeView = viewsState.views[viewsState.activeViewId] || viewsState.views[BUILTIN_VIEW_ID];

  // Auto-save: any edit to columns/order/sort/density writes straight back into
  // the active view (and persists immediately) — there's no separate "unsaved
  // changes" state to lose track of.
  useEffect(() => {
    setViewsState((prev) => {
      const current = prev.views[prev.activeViewId];
      if (!current) return prev;
      const updated = { ...current, columnVisibility, columnOrder, sortConfig, density, columnWidths };
      const next = { ...prev, views: { ...prev.views, [prev.activeViewId]: updated } };
      persistViewsState(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnVisibility, columnOrder, sortConfig, density, columnWidths]);

  const switchToView = (viewId) => {
    const target = viewsState.views[viewId];
    if (!target) return;
    setViewsState((prev) => {
      const next = { ...prev, activeViewId: viewId };
      persistViewsState(next);
      return next;
    });
    setColumnVisibility(target.columnVisibility);
    setColumnOrder(target.columnOrder);
    setSortConfig(target.sortConfig);
    setDensity(target.density);
    setColumnWidths(target.columnWidths || {});
  };

  const createNewView = () => {
    const trimmedName = newViewName.trim();
    if (!trimmedName) return;
    const id = generateViewId();
    const newView = {
      id, name: trimmedName, description: newViewDescription.trim(), builtin: false,
      columnVisibility: { ...columnVisibility }, columnOrder: [...columnOrder],
      sortConfig: { ...sortConfig }, density, columnWidths: { ...columnWidths },
    };
    setViewsState((prev) => {
      const next = { activeViewId: id, views: { ...prev.views, [id]: newView } };
      persistViewsState(next);
      return next;
    });
    setNewViewName("");
    setNewViewDescription("");
    setShowNewViewForm(false);
    setNotification({ type: "success", message: `View "${trimmedName}" created` });
  };

  const startEditingViewMeta = (view) =>
    setEditingViewMeta({ id: view.id, name: view.name, description: view.description, builtin: !!view.builtin });

  const saveViewMeta = () => {
    if (!editingViewMeta) return;
    const trimmedName = editingViewMeta.name.trim();
    if (!trimmedName && !editingViewMeta.builtin) return;
    setViewsState((prev) => {
      const existing = prev.views[editingViewMeta.id];
      if (!existing) return prev;
      const updated = {
        ...existing,
        name: existing.builtin ? existing.name : trimmedName,
        description: editingViewMeta.description.trim(),
      };
      const next = { ...prev, views: { ...prev.views, [editingViewMeta.id]: updated } };
      persistViewsState(next);
      return next;
    });
    setEditingViewMeta(null);
  };

  const removeView = (viewId) => {
    if (viewId === BUILTIN_VIEW_ID) return;
    const wasActive = viewsState.activeViewId === viewId;
    setViewsState((prev) => {
      const { [viewId]: _removed, ...restViews } = prev.views;
      const nextActiveId = prev.activeViewId === viewId ? BUILTIN_VIEW_ID : prev.activeViewId;
      const next = { activeViewId: nextActiveId, views: restViews };
      persistViewsState(next);
      return next;
    });
    if (wasActive) {
      const def = viewsState.views[BUILTIN_VIEW_ID];
      setColumnVisibility(def.columnVisibility);
      setColumnOrder(def.columnOrder);
      setSortConfig(def.sortConfig);
      setDensity(def.density);
      setColumnWidths(def.columnWidths || {});
    }
    setNotification({ type: "success", message: "View deleted" });
  };

  const resetActiveViewToDefault = () => {
    const layout = createDefaultViewLayout();
    setColumnVisibility(layout.columnVisibility);
    setColumnOrder(layout.columnOrder);
    setSortConfig(layout.sortConfig);
    setDensity(layout.density);
    setColumnWidths(layout.columnWidths || {});
    setNotification({ type: "success", message: `"${activeView.name}" reset to factory defaults` });
  };

  // ─── Data loading ─────────────────────────────────────────────────────────
  useEffect(() => {
    let unsubscribeData = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (!currentUser) {
        setLoading(false);
        setRawApps([]);
        return;
      }

      const processedAppsKey = `investorProcessedApplications_${currentUser.uid}`;
      const getProcessed = () => {
        try { return new Set(JSON.parse(localStorage.getItem(processedAppsKey) || "[]")); }
        catch { return new Set(); }
      };
      const saveProcessed = (set) => {
        try { localStorage.setItem(processedAppsKey, JSON.stringify([...set])); }
        catch (err) { console.error("Error saving processed applications:", err); }
      };

      try {
        const investorProfileSnap = await getDoc(doc(db, "MyuniversalProfiles", currentUser.uid));
        const investorData = investorProfileSnap.exists() ? investorProfileSnap.data().formData : null;
        setInvestorProfile(investorData);

        const q = query(collection(db, "investorApplications"), where("funderId", "==", currentUser.uid));

        unsubscribeData = onSnapshot(q, async (querySnapshot) => {
          try {
            const processed = getProcessed();
            const newProcessed = new Set(processed);
            const breakdowns = {};

            const enriched = await Promise.all(
              querySnapshot.docs.map(async (docSnap) => {
                const data = docSnap.data();

                if (!processed.has(docSnap.id) && data.smeName) {
                  addInvestorNotification(
                    `New application received from ${data.smeName}`,
                    "new_application",
                    docSnap.id,
                    data.smeName
                  );
                  newProcessed.add(docSnap.id);
                }

                if (data.availableDates) {
                  data.availableDates = data.availableDates.map((a) => ({ ...a, date: new Date(a.date) }));
                }

                let profile = null;
                let matchPercentage = 0;
                try {
                  const profileSnap = await getDoc(doc(db, "universalProfiles", data.smeId));
                  if (profileSnap.exists()) {
                    profile = profileSnap.data();
                    if (investorData) {
                      const result = calculateInvestorMatchScore(investorData, profile);
                      matchPercentage = result.score;
                      breakdowns[docSnap.id] = result.breakdown;
                    }
                  }
                } catch (err) {
                  console.error("Error fetching business profile for", data.smeId, err);
                }

                return { id: docSnap.id, ...data, profile, matchPercentage };
              })
            );

            saveProcessed(newProcessed);
            setMatchBreakdowns(breakdowns);
            enriched.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            setRawApps(enriched);
            setLoading(false);
          } catch (err) {
            console.error("Error processing applications:", err);
            setNotification({ type: "error", message: "Failed to load applications" });
            setLoading(false);
          }
        });
      } catch (err) {
        console.error("Error fetching investor profile:", err);
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribeData) unsubscribeData();
      unsubscribeAuth();
    };
  }, []);

  // BIG Scores come from their own collection — previously this table showed a
  // random placeholder number, which made the column meaningless.
  useEffect(() => {
    const fetchBigScores = async () => {
      try {
        const snapshot = await getDocs(collection(db, "bigEvaluations"));
        const scores = {};
        snapshot.forEach((d) => { scores[d.id] = d.data(); });
        setBigScoresMap(scores);
      } catch (err) {
        console.error("Error fetching BIG Scores:", err);
      }
    };
    fetchBigScores();
  }, []);

  useEffect(() => {
    const fetchTermsheetStatuses = async () => {
      const statusMap = {};
      for (const app of rawApps) {
        if (!app.id) continue;
        try {
          const snap = await getDoc(doc(db, "investorApplications", app.id));
          if (snap.exists() && snap.data().termsheetStatus) statusMap[app.id] = snap.data().termsheetStatus;
        } catch (err) {
          console.error("Error fetching termsheet status:", err);
        }
      }
      setTermsheetStatuses(statusMap);
    };
    if (rawApps.length > 0) fetchTermsheetStatuses();
  }, [rawApps]);

  // ─── Row mapping ──────────────────────────────────────────────────────────
  const smes = useMemo(() => {
    const mapRow = (a) => {
      const entity = a.profile?.entityOverview || {};
      const appOverview = a.profile?.applicationOverview || {};
      const funding = a.profile?.useOfFunds || {};
      const financials = a.profile?.financialOverview || {};
      const guaranteesObj = a.profile?.guarantees || null;
      const guaranteeCount = guaranteesObj
        ? Object.keys(guaranteesObj).filter((k) => !k.includes("Files") && guaranteesObj[k] === "yes").length
        : 0;

      const currentStatus = updatedStages[a.id] || a.pipelineStage || a.stage || a.status || "Application Received";

      return {
        id: a.id,
        docId: a.id,
        smeId: a.smeId,
        userId: a.smeId,
        name: entity.tradingName || entity.registeredName || a.smeName || "Unnamed Business",
        location: formatLabel(entity.location) || "N/A",
        province: formatLabel(entity.province) || "N/A",
        sector: formatLabel((entity.economicSectors || []).join(", ")) || "N/A",
        fundingStage: formatLabel(appOverview.fundingStage || entity.operationStage) || "N/A",
        fundingRequired: formatCurrency(funding.amountRequested),
        fundingAmount: normalizeAmount(funding.amountRequested),
        fundingRequestedRaw: funding.amountRequested || "",
        investmentType: formatLabel(
          Array.isArray(funding.fundingInstruments) ? funding.fundingInstruments.join(", ") : funding.fundingInstruments
        ) || "N/A",
        guaranteesObj,
        guaranteeCount,
        guaranteesSummary: guaranteeCount > 0 ? `${guaranteeCount} available` : "None",
        supportRequired: formatLabel(appOverview.supportFormat) || "N/A",
        revenue: financials.annualRevenue ? `R${Number(financials.annualRevenue).toLocaleString()}` : "N/A",
        teamSize: entity.employeeCount || "N/A",
        applicationDate: appOverview.applicationDate
          ? new Date(appOverview.applicationDate).toLocaleDateString("en-ZA", { month: "short", day: "numeric", year: "numeric" })
          : (a.createdAt ? new Date(a.createdAt).toLocaleDateString("en-ZA", { month: "short", day: "numeric", year: "numeric" }) : "N/A"),
        applicationDateRaw: appOverview.applicationDate
          ? new Date(appOverview.applicationDate)
          : (a.createdAt ? new Date(a.createdAt) : null),
        daysInStage: calculateDaysInStage(a.updatedAt),
        lastActivity: a.lastActivity
          ? new Date(a.lastActivity).toLocaleDateString("en-ZA", { month: "short", day: "numeric", year: "numeric" })
          : "N/A",
        matchPercentage: a.matchPercentage || 0,
        bigScore: bigScoresMap[a.smeId]?.scores?.bigScore || 0,
        currentStatus,
        pipelineStage: currentStatus,
        nextStage: getNextStage(currentStatus, activeStages),
        pipelineHistory: a.pipelineHistory || [],
        availableDates: a.availableDates || [],
        documents: a.documentURLs || {},
        email: a.email || entity.email || "N/A",
        profile: a.profile,
        raw: a,
      };
    };

    let mapped = rawApps.map(mapRow);

    if (stageFilter && stageFilter !== "initial" && stageFilter !== "matched") {
      mapped = mapped.filter((s) => mapStatusToStageId(s.pipelineStage, activeStages) === stageFilter);
    } else if (stageFilter === "matched" || stageFilter === "initial") {
      // "Matches" is an entry pool of businesses that have not applied yet, so
      // there are no applications to list under it.
      mapped = [];
    }

    return mapped;
  }, [rawApps, bigScoresMap, updatedStages, activeStages, stageFilter]);

  useEffect(() => { onSMEsLoaded?.(smes); }, [smes, onSMEsLoaded]);

  // ─── Filtering & Sorting ──────────────────────────────────────────────────
  const filteredAndSortedSMEs = useMemo(() => {
    let result = [...smes];

    if (localFilters.name?.trim()) {
      const q = localFilters.name.toLowerCase().trim();
      result = result.filter((s) => s.name.toLowerCase().includes(q));
    }
    if (localFilters.fundingStage?.length > 0) {
      result = result.filter((s) => localFilters.fundingStage.some((st) => s.fundingStage.toLowerCase().includes(st.toLowerCase())));
    }
    result = result.filter((s) => s.bigScore >= localFilters.bigScoreRange[0] && s.bigScore <= localFilters.bigScoreRange[1]);
    result = result.filter((s) => s.matchPercentage >= localFilters.matchRange[0] && s.matchPercentage <= localFilters.matchRange[1]);

    if (localFilters.status?.length > 0) {
      result = result.filter((s) => {
        const stageName = getStatusStyle(s.currentStatus, activeStages).stage.name;
        return localFilters.status.includes(stageName);
      });
    }
    if (localFilters.sector?.length > 0) {
      result = result.filter((s) => localFilters.sector.some((sec) => s.sector.toLowerCase().includes(sec.toLowerCase())));
    }
    if (localFilters.instrument?.length > 0) {
      result = result.filter((s) => localFilters.instrument.some((i) => (s.investmentType || "").toLowerCase().includes(i.toLowerCase())));
    }

    const [fundingMin, fundingMax] = localFilters.fundingRequiredRange;
    if (fundingMin != null) result = result.filter((s) => s.fundingAmount >= fundingMin);
    if (fundingMax != null) result = result.filter((s) => s.fundingAmount <= fundingMax);

    const [daysMin, daysMax] = localFilters.daysInStageRange;
    if (daysMin != null) result = result.filter((s) => (s.daysInStage || 0) >= daysMin);
    if (daysMax != null) result = result.filter((s) => (s.daysInStage || 0) <= daysMax);

    const [appliedFrom, appliedTo] = localFilters.appliedRange;
    if (appliedFrom) result = result.filter((s) => s.applicationDateRaw && s.applicationDateRaw >= new Date(appliedFrom));
    if (appliedTo) result = result.filter((s) => s.applicationDateRaw && s.applicationDateRaw <= new Date(new Date(appliedTo).setHours(23, 59, 59, 999)));

    const textFilter = (key, field) => {
      if (localFilters[key]?.trim()) {
        const q = localFilters[key].toLowerCase().trim();
        result = result.filter((s) => (s[field] || "").toString().toLowerCase().includes(q));
      }
    };
    textFilter("location", "location");
    textFilter("lastActivity", "lastActivity");
    textFilter("guarantees", "guaranteesSummary");
    textFilter("support", "supportRequired");
    textFilter("revenue", "revenue");
    textFilter("teamSize", "teamSize");

    if (sortConfig.key === "attentionThenScore") {
      result.sort((a, b) => {
        const aFlag = getAttentionReasons(a, activeStages).length > 0 ? 1 : 0;
        const bFlag = getAttentionReasons(b, activeStages).length > 0 ? 1 : 0;
        if (aFlag !== bFlag) return bFlag - aFlag;
        return b.bigScore - a.bigScore;
      });
    } else if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key], bVal = b[sortConfig.key];
        if (typeof aVal === "string") aVal = aVal.toLowerCase();
        if (typeof bVal === "string") bVal = bVal.toLowerCase();
        if (aVal == null) aVal = ""; if (bVal == null) bVal = "";
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [smes, sortConfig, localFilters, activeStages]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedSMEs.length / pageSize));
  const paginatedSMEs = filteredAndSortedSMEs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const sectorOptions = useMemo(
    () => [...new Set(smes.map((s) => s.sector).filter((s) => s && s !== "N/A"))].sort(),
    [smes]
  );
  const instrumentOptions = useMemo(
    () => [...new Set(smes.map((s) => s.investmentType).filter((s) => s && s !== "N/A"))].sort(),
    [smes]
  );

  const activeFilterCount = (localFilters.name?.trim() ? 1 : 0)
    + localFilters.fundingStage.length + localFilters.status.length + localFilters.sector.length + localFilters.instrument.length
    + (localFilters.bigScoreRange[0] > 0 || localFilters.bigScoreRange[1] < 100 ? 1 : 0)
    + (localFilters.matchRange[0] > 0 || localFilters.matchRange[1] < 100 ? 1 : 0)
    + (localFilters.fundingRequiredRange[0] != null || localFilters.fundingRequiredRange[1] != null ? 1 : 0)
    + (localFilters.daysInStageRange[0] != null || localFilters.daysInStageRange[1] != null ? 1 : 0)
    + (localFilters.appliedRange[0] || localFilters.appliedRange[1] ? 1 : 0)
    + ["location", "lastActivity", "guarantees", "support", "revenue", "teamSize"]
      .filter((k) => localFilters[k]?.trim()).length;

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const toggleColumn = (key) => setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key] }));

  const getFilterActive = (filterType) => {
    switch (filterType) {
      case "bigScore": return localFilters.bigScoreRange[0] > 0 || localFilters.bigScoreRange[1] < 100;
      case "match": return localFilters.matchRange[0] > 0 || localFilters.matchRange[1] < 100;
      case "fundingStage": return localFilters.fundingStage.length > 0;
      case "fundingRequired": return localFilters.fundingRequiredRange[0] != null || localFilters.fundingRequiredRange[1] != null;
      case "status": return localFilters.status.length > 0;
      case "applied": return !!(localFilters.appliedRange[0] || localFilters.appliedRange[1]);
      case "daysInStage": return localFilters.daysInStageRange[0] != null || localFilters.daysInStageRange[1] != null;
      case "sector": return localFilters.sector.length > 0;
      case "instrument": return localFilters.instrument.length > 0;
      default: return !!localFilters[filterType]?.toString().trim();
    }
  };

  // ─── Column drag-to-reorder ───────────────────────────────────────────────
  const handleColumnDragStart = (e, key) => {
    setDraggedColumn(key);
    setDragHintRect(null);
    try {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", key);
    } catch {
      // Some browsers are picky about dataTransfer in certain contexts.
    }
  };

  const handleColumnDragOver = (e, key) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (key !== dragOverColumn) setDragOverColumn(key);
  };

  const handleColumnDrop = (e, key) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === key) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }
    setColumnOrder((prev) => {
      const next = [...prev];
      const fromIdx = next.indexOf(draggedColumn);
      const toIdx = next.indexOf(key);
      if (fromIdx === -1 || toIdx === -1) return prev;
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, draggedColumn);
      return next;
    });
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const handleColumnDragEnd = () => {
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const openHeaderFilter = (type, event) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setHeaderFilterOpen((prev) => (prev?.type === type ? null : { type, rect }));
  };
  const closeHeaderFilter = () => setHeaderFilterOpen(null);

  const FilterTrigger = ({ type, active }) => (
    <button
      type="button"
      onClick={(e) => openHeaderFilter(type, e)}
      className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors ${active ? "text-[#e6d7c3]" : "text-[#c8b6a6] hover:text-white"}`}
      title="Filter this column"
    >
      <SlidersHorizontal size={11} />
    </button>
  );

  const handleViewDetails = (sme) => {
    setSelectedSMEDetails({
      ...sme.raw,
      ...(sme.profile || {}),
      smeName: sme.name,
      matchPercentage: sme.matchPercentage,
      investorRequiredDocuments: sme.documents || {},
    });
    setShowSMEDetails(true);
    setActivePopup(null);
  };

  // ─── Popups ───────────────────────────────────────────────────────────────
  const openPopup = (type, sme, rect, options = {}) => {
    let popupWidth, popupHeight;
    switch (type) {
      case "bigScore": popupWidth = 380; popupHeight = 450; break;
      case "match": popupWidth = 380; popupHeight = 420; break;
      case "stage": popupWidth = 460; popupHeight = 540; break;
      case "quickActions": popupWidth = 210; popupHeight = 260; break;
      default: popupWidth = 300; popupHeight = 300;
    }

    let x = rect.left + (rect.width / 2) - (popupWidth / 2);
    let y = rect.bottom + 8;
    if (x + popupWidth > window.innerWidth - 20) x = window.innerWidth - popupWidth - 20;
    if (x < 20) x = 20;
    if (y + popupHeight > window.innerHeight - 20) y = rect.top - popupHeight - 8;
    if (y < 20) y = 20;

    setSelectedSMEForPopup(sme);
    setActivePopup({ type, smeKey: sme.id, position: { x, y }, rect });

    if (type === "bigScore") {
      setBigScoreLoading(true);
      setBigScoreData({
        compliance: { score: 0 }, legitimacy: { score: 0 }, fundability: { score: 0 },
        pis: { score: 0 }, leadership: { score: 0 }
      });
      getDoc(doc(db, "bigEvaluations", sme.smeId))
        .then((snap) => {
          if (snap.exists()) {
            const s = snap.data().scores || {};
            setBigScoreData({
              compliance: { score: s.compliance || 0 },
              legitimacy: { score: s.legitimacy || 0 },
              fundability: { score: s.fundability || 0 },
              pis: { score: s.pis || 0 },
              leadership: { score: s.leadership || 0 },
              _bigScore: s.bigScore || 0,
              _lastUpdated: s.lastUpdated || null,
            });
          }
        })
        .catch((err) => console.error("bigEvaluations fetch error:", err))
        .finally(() => setBigScoreLoading(false));
    }

    if (type === "match") {
      setMatchBreakdownData(matchBreakdowns[sme.id] || null);
    }

    if (type === "stage") {
      const presetStage = options.presetStage || sme.nextStage || getNextStage(sme.currentStatus, activeStages);
      const presetId = mapStatusToStageId(presetStage, activeStages);
      setStageUpdateData({
        nextStage: presetStage,
        message: DEFAULT_STAGE_MESSAGES[presetId] || "",
        meetingTime: "", meetingLocation: "", meetingPurpose: "", termSheetFile: null,
        amountAsked: sme.fundingRequestedRaw || "", amountApproved: "", investmentType: "", paymentDeployment: "",
      });
      setStageFormErrors({});
      setAvailabilities(sme.availableDates || []);
    }
  };

  const openPopupFromEvent = (type, sme, event, options) => {
    event.stopPropagation();
    openPopup(type, sme, event.currentTarget.getBoundingClientRect(), options);
  };

  const closePopup = () => {
    setActivePopup(null);
    setSelectedSMEForPopup(null);
    setMatchBreakdownData(null);
    setShowCalendarPopup(false);
  };

  // Investors on the Discover plan see the upsell instead of the stage form.
  const openStageUpdate = (sme, event, options) => {
    if (currentPlan === "basic") {
      setSelectedSMEForPopup(sme);
      setShowStageUpsell(true);
      return;
    }
    openPopupFromEvent("stage", sme, event, options);
  };

  const handleOpenGuarantees = async (sme) => {
    if (sme.guaranteesObj) {
      setShowGuarantees({ guarantees: sme.guaranteesObj, name: sme.name });
      return;
    }
    try {
      const snap = await getDoc(doc(db, "universalProfiles", sme.smeId));
      if (snap.exists()) setShowGuarantees({ guarantees: snap.data().guarantees || {}, name: sme.name });
    } catch (err) {
      console.error("Error fetching guarantees:", err);
      setNotification({ type: "error", message: "Failed to load guarantees" });
    }
  };

  // ─── Stage progression ────────────────────────────────────────────────────
  // Forward-only through the live stages, with terminal outcomes always
  // reachable. "Deal Closed" additionally needs a decision and terms on record.
  const getStageProgressionError = (targetStageName, sme) => {
    const targetId = mapStatusToStageId(targetStageName, activeStages);
    const currentId = mapStatusToStageId(sme.currentStatus, activeStages);
    const target = activeStages.find((s) => s.id === targetId);
    const current = activeStages.find((s) => s.id === currentId);
    if (!target || !current) return null;
    if (target.id === current.id) return "This business is already at that stage";
    if (target.terminal) {
      if (target.group === "success") {
        const history = [...(sme.pipelineHistory || []), sme.currentStatus].map((h) => mapStatusToStageId(h, activeStages));
        const missing = ["decision", "terms"]
          .filter((needed) => activeStages.some((s) => s.id === needed))
          .filter((needed) => !history.includes(needed));
        if (missing.length > 0) {
          const names = missing.map((id) => activeStages.find((s) => s.id === id)?.name).join(" and ");
          return `Complete ${names} before closing the deal`;
        }
      }
      return null;
    }
    if (current.terminal) return "This application has reached a final stage";
    if (target.order < current.order) return "Stages move forward only — use a terminal outcome to close or decline";
    return null;
  };

  const handleStageUpdate = async () => {
    const sme = selectedSMEForPopup;
    if (!sme) return;

    const targetId = mapStatusToStageId(stageUpdateData.nextStage, activeStages);
    const stageFields = getStageFields(stageUpdateData.nextStage, activeStages);
    const targetStage = activeStages.find((s) => s.id === targetId);

    const errors = {};
    if (!stageUpdateData.nextStage) errors.nextStage = "Please select a stage";
    else {
      const progressionError = getStageProgressionError(stageUpdateData.nextStage, sme);
      if (progressionError) errors.nextStage = progressionError;
    }
    if (stageFields.showMessage && !stageUpdateData.message.trim()) errors.message = "Please provide a message";
    if (stageFields.showMeeting) {
      if (!stageUpdateData.meetingLocation.trim()) errors.meetingLocation = "Please provide a meeting location";
      if (!stageUpdateData.meetingPurpose.trim()) errors.meetingPurpose = "Please provide a purpose for the meeting";
    }
    if (stageFields.showAvailability && availabilities.length === 0) {
      errors.availabilities = "Please add at least one available date";
    }
    if (stageFields.showFundingDetails) {
      if (!stageUpdateData.amountApproved.trim()) errors.amountApproved = "Please enter the amount approved";
      if (!stageUpdateData.investmentType) errors.investmentType = "Please select an investment type";
      if (!stageUpdateData.paymentDeployment.trim()) errors.paymentDeployment = "Please describe how the payment will be deployed";
    }
    if (stageFields.showTermSheet && targetId === "terms" && !stageUpdateData.termSheetFile) {
      errors.termSheetFile = "Please attach the term sheet document";
    }

    if (Object.keys(errors).length > 0) { setStageFormErrors(errors); return; }

    setIsStageSubmitting(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("User not authenticated");

      const appRef = doc(db, "investorApplications", sme.id);
      const availabilityData = availabilities.map((a) => ({
        date: a.date instanceof Date ? a.date.toISOString() : a.date,
        timeSlots: a.timeSlots,
        timeZone: a.timeZone,
        status: a.status || "available",
      }));

      const updateData = {
        status: stageUpdateData.nextStage,
        stage: stageUpdateData.nextStage,
        pipelineStage: stageUpdateData.nextStage,
        nextStage: getNextStage(stageUpdateData.nextStage, activeStages),
        pipelineHistory: [...(sme.pipelineHistory || []), sme.currentStatus],
        updatedAt: new Date().toISOString(),
        lastMessage: stageUpdateData.message,
        lastActivity: new Date().toISOString(),
      };

      if (stageFields.showMeeting) {
        updateData.meetingLocation = stageUpdateData.meetingLocation;
        updateData.meetingPurpose = stageUpdateData.meetingPurpose;
        updateData.meetingDetails = {
          time: stageUpdateData.meetingTime,
          location: stageUpdateData.meetingLocation,
          purpose: stageUpdateData.meetingPurpose,
        };
      }
      if (stageFields.showAvailability) updateData.availableDates = availabilityData;
      if (stageFields.showFundingDetails) {
        updateData.fundingDetails = {
          amountAsked: stageUpdateData.amountAsked,
          amountApproved: stageUpdateData.amountApproved,
          investmentType: stageUpdateData.investmentType,
          paymentDeployment: stageUpdateData.paymentDeployment,
          approvedAt: new Date().toISOString(),
        };
      }

      let attachmentUrl = null;
      if (stageUpdateData.termSheetFile) {
        const fileRef = ref(storage, `termsheets/${sme.id}/${stageUpdateData.termSheetFile.name}`);
        const snapshot = await uploadBytes(fileRef, stageUpdateData.termSheetFile);
        attachmentUrl = await getDownloadURL(snapshot.ref);
        updateData.termsheetUrl = attachmentUrl;
      }

      await updateDoc(appRef, updateData);

      // Mirror onto the SME's own copy of the application.
      const smeSnapshot = await getDocs(query(
        collection(db, "smeApplications"),
        where("smeId", "==", sme.smeId),
        where("funderId", "==", currentUser.uid)
      ));
      if (!smeSnapshot.empty) {
        await updateDoc(smeSnapshot.docs[0].ref, updateData);
      }

      if (stageFields.showAvailability && availabilityData.length > 0) {
        await addDoc(collection(db, "smeCalendarEvents"), {
          smeId: sme.smeId,
          funderId: currentUser.uid,
          title: stageUpdateData.meetingPurpose || "Meeting",
          date: availabilityData[0].date,
          location: stageUpdateData.meetingLocation || "",
          type: "meeting",
          createdAt: new Date().toISOString(),
          availableDates: availabilityData,
        });
      }

      // In-app message to the business (inbox + sent copies).
      const subject = `${targetStage?.name || stageUpdateData.nextStage}: ${sme.name}`;
      let content = `Dear ${sme.name},\n\nYour application has moved to "${targetStage?.name || stageUpdateData.nextStage}".\n\n${stageUpdateData.message}\n`;
      if (stageFields.showMeeting) {
        content += `\nMeeting\nLocation: ${stageUpdateData.meetingLocation}\nPurpose: ${stageUpdateData.meetingPurpose}\n`;
      }
      if (stageFields.showAvailability && availabilities.length > 0) {
        content += `\nAvailable times:\n${availabilities.map((a, i) => {
          const dateStr = a.date instanceof Date
            ? a.date.toLocaleDateString("en-ZA", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
            : "Date unavailable";
          const timeStr = a.timeSlots?.[0] ? `${a.timeSlots[0].start} – ${a.timeSlots[0].end} ${a.timeZone}` : "Time not specified";
          return `${i + 1}. ${dateStr} (${timeStr})`;
        }).join("\n")}\n\nPlease RSVP on your calendar with your preferred time.\n`;
      }
      if (stageFields.showFundingDetails) {
        content += `\nFunding\nAmount requested: ${stageUpdateData.amountAsked}\nAmount approved: ${stageUpdateData.amountApproved}\nInstrument: ${stageUpdateData.investmentType}\nDeployment: ${stageUpdateData.paymentDeployment}\n`;
      }
      content += `\nBest regards,\nInvestment Team`;

      const messagePayload = {
        to: sme.smeId,
        from: currentUser.uid,
        subject,
        content,
        date: new Date().toISOString(),
        read: false,
        type: "inbox",
        applicationId: sme.id,
        attachments: attachmentUrl ? [attachmentUrl] : [],
        availableDates: stageFields.showAvailability ? availabilityData : null,
      };
      await Promise.all([
        addDoc(collection(db, "messages"), messagePayload),
        addDoc(collection(db, "messages"), { ...messagePayload, read: true, type: "sent" }),
      ]);

      // Email notification (best effort — never blocks the stage update).
      try {
        const smeUserDoc = await getDoc(doc(db, "users", sme.smeId));
        const smeEmail = smeUserDoc.exists() ? smeUserDoc.data().email : null;
        if (smeEmail) {
          await fetch("https://us-central1-tuts-7ea8c.cloudfunctions.net/sendInvestorUpdateEmail", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              data: {
                to: smeEmail,
                name: sme.name,
                status: targetStage?.name || stageUpdateData.nextStage,
                message: stageUpdateData.message,
                meetingLocation: stageFields.showMeeting ? stageUpdateData.meetingLocation : null,
                meetingPurpose: stageFields.showMeeting ? stageUpdateData.meetingPurpose : null,
                availabilityDates: stageFields.showAvailability
                  ? availabilities.map((a) => ({
                      date: a.date instanceof Date
                        ? a.date.toLocaleDateString("en-ZA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
                        : "Date unavailable",
                      time: a.timeSlots?.[0] ? `${a.timeSlots[0].start} - ${a.timeSlots[0].end} ${a.timeZone}` : "Time not specified",
                    }))
                  : [],
              },
            }),
          });
        }
      } catch (emailError) {
        console.error("Failed to send investor update email:", emailError);
      }

      addInvestorNotification(
        `Application moved to ${targetStage?.name || stageUpdateData.nextStage} for ${sme.name}`,
        "status_change",
        sme.id
      );

      setUpdatedStages((prev) => ({ ...prev, [sme.id]: stageUpdateData.nextStage }));
      if (targetStage?.group === "success") onDealComplete?.();
      notifyPipelineRefresh();

      setNotification({ type: "success", message: `Application updated to ${targetStage?.name || stageUpdateData.nextStage}` });
      closePopup();
    } catch (error) {
      console.error("Stage update error:", error);
      setNotification({ type: "error", message: `Failed to update stage: ${error.message}` });
    } finally {
      setIsStageSubmitting(false);
    }
  };

  // ─── Export ───────────────────────────────────────────────────────────────
  const handleExport = () => {
    try {
      // Respect the table's current visual order: pinned "Business Name"
      // first, then the reorderable columns in whatever order they've been
      // dragged into, skipping the UI-only "Action" column and hidden columns.
      const visibleCols = [
        "sme",
        ...columnOrder.filter((key) => key !== "sme" && key !== "action" && columnVisibility[key])
      ].filter((key) => columnVisibility[key] && EXPORT_FIELD_MAP[key]);

      if (visibleCols.length === 0) {
        setNotification({ type: "error", message: "No visible columns to export" });
        return;
      }
      if (filteredAndSortedSMEs.length === 0) {
        setNotification({ type: "error", message: "No businesses to export" });
        return;
      }

      const rows = filteredAndSortedSMEs.map((sme) => {
        const row = {};
        visibleCols.forEach((key) => {
          const label = EXPORT_HEADERS[key] || key;
          let value = sme[EXPORT_FIELD_MAP[key]];
          if (key === "match") value = value != null ? `${value}%` : "";
          if (key === "status") value = getStatusStyle(sme.currentStatus, activeStages).stage.name;
          if (value === null || value === undefined) value = "";
          row[label] = value;
        });
        return row;
      });

      const headerOrder = visibleCols.map((key) => EXPORT_HEADERS[key] || key);
      const worksheet = XLSX.utils.json_to_sheet(rows, { header: headerOrder });

      worksheet["!cols"] = headerOrder.map((label) => {
        const contentLengths = rows.map((r) => String(r[label] ?? "").length);
        const maxLen = Math.max(label.length, ...contentLengths, 8);
        return { wch: Math.min(maxLen + 2, 45) };
      });

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Businesses");
      XLSX.writeFile(workbook, `dealflow-export-${new Date().toISOString().split("T")[0]}.xlsx`);
      setNotification({ type: "success", message: "Export downloaded" });
    } catch (error) {
      console.error("Export error:", error);
      setNotification({ type: "error", message: `Export failed: ${error.message}` });
    }
  };

  // ─── Availability helpers ─────────────────────────────────────────────────
  const handleDateSelect = (dates) => setTempDates(dates || []);
  const handleTimeChange = (field, value) => setTimeSlot((prev) => ({ ...prev, [field]: value }));
  const removeAvailability = (date) =>
    setAvailabilities((prev) => prev.filter((a) => a.date?.getTime?.() !== date?.getTime?.()));

  const saveSelectedDates = () => {
    setAvailabilities((prev) => ([
      ...prev,
      ...tempDates
        .filter((date) => !prev.some((a) => a.date?.getTime?.() === date.getTime?.()))
        .map((date) => ({ date, timeSlots: [{ ...timeSlot }], timeZone, status: "available" })),
    ]));
    setTempDates([]);
    setShowCalendarPopup(false);
  };

  const densityStyles = {
    comfortable: { cell: "py-3 px-3", header: "py-3 px-3", fontSize: "text-sm", avatarSize: "w-8 h-8" },
    compact: { cell: "py-2 px-2", header: "py-2 px-2", fontSize: "text-xs", avatarSize: "w-7 h-7" },
    "ultra-compact": { cell: "py-1.5 px-1.5", header: "py-1.5 px-1.5", fontSize: "text-xs", avatarSize: "w-6 h-6" },
  };
  const ds = densityStyles[density] || densityStyles.comfortable;

  // ─── Column resizing ──────────────────────────────────────────────────────
  // Drag the divider on a header's right edge to resize the column; double-click
  // it to snap that column back to auto width. Widths are stored per view
  // alongside visibility/order/sort/density, so they persist and travel with
  // whichever view is active.
  const [resizingColumn, setResizingColumn] = useState(null);

  const widthStyle = (key, fallbackMin, fallbackMax) => {
    const w = columnWidths[key];
    if (w) return { width: `${w}px`, minWidth: `${w}px`, maxWidth: `${w}px` };
    return fallbackMax ? { minWidth: fallbackMin, maxWidth: fallbackMax } : { minWidth: fallbackMin };
  };

  const startResize = (event, key) => {
    event.preventDefault();
    event.stopPropagation();
    const th = event.currentTarget.closest("th");
    const startX = event.clientX;
    const startWidth = th ? th.getBoundingClientRect().width : 120;
    setResizingColumn(key);

    const onMove = (moveEvent) => {
      const next = Math.max(64, Math.round(startWidth + (moveEvent.clientX - startX)));
      setColumnWidths((prev) => ({ ...prev, [key]: next }));
    };
    const onUp = () => {
      setResizingColumn(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    // Held on <body> so the cursor doesn't flicker back as the pointer leaves
    // the 6px handle mid-drag, and so text can't be selected while resizing.
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const autoFitColumn = (key) =>
    setColumnWidths((prev) => { const { [key]: _dropped, ...rest } = prev; return rest; });

  const ColumnResizer = ({ colKey }) => (
    <span
      onMouseDown={(e) => startResize(e, colKey)}
      onDoubleClick={(e) => { e.stopPropagation(); autoFitColumn(colKey); }}
      onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onClick={(e) => e.stopPropagation()}
      title="Drag to resize · double-click to auto-fit"
      className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize select-none z-10"
      style={{ backgroundColor: resizingColumn === colKey ? "#a67c52" : "transparent" }}
    />
  );

  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(t);
  }, [notification]);

  if (!authLoading && !user) {
    return (
      <div className="w-full p-10 text-center text-sm text-[#7d5a50]">
        Sign in to view your applications.
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-4 p-6">
      {notification && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium border ${notification.type === "success" ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"}`}>
          <div className="flex items-center justify-between">
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-2 text-current opacity-50 hover:opacity-100"><X size={16} /></button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-[#faf7f2] rounded-t-2xl p-4 border border-[#e6d7c3] border-b-0 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#f5f0e1] text-[#7d5a50] border border-[#c8b6a6]" title="Determined by the pipeline's programme type setting">
              <Briefcase size={12} /> {activeProgrammeLabel} pipeline
            </span>
            {/* Always-visible active view name (+ description, if any) — no
                hover required, so it's never ambiguous which view is live. */}
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-[#4a352f] border border-[#c8b6a6]">
              <LayoutGrid size={12} className="text-[#7d5a50] flex-shrink-0" />
              Viewing: {activeView.name}
              {activeView.description && (
                <span className="font-normal text-[#a89482]"> — {activeView.description}</span>
              )}
            </span>
            {activeFilterCount > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#fff3e0] text-[#e65100] border border-[#e65100]/30">
                <SlidersHorizontal size={12} /> {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">

            {/* ─── Customize Table (Views + Hide/Unhide + Density + Reset) ── */}
            <div className="relative">
              <button
                onClick={(e) => {
                  if (showColumnChooser) {
                    setShowColumnChooser(false);
                    setColumnChooserRect(null);
                  } else {
                    setColumnChooserRect(e.currentTarget.getBoundingClientRect());
                    setShowColumnChooser(true);
                    setShowNewViewForm(false);
                    setEditingViewMeta(null);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#c8b6a6] rounded-xl text-sm text-[#4a352f] hover:bg-[#f5f0e1] transition-all shadow-sm"
              >
                <SlidersHorizontal size={16} /> Customize Table <ChevronDown size={14} className={`transition-transform ${showColumnChooser ? "rotate-180" : ""}`} />
              </button>
              {showColumnChooser && columnChooserRect && (() => {
                const panelWidth = 320;
                const margin = 12;
                let left = columnChooserRect.right - panelWidth;
                left = Math.min(Math.max(left, margin), window.innerWidth - panelWidth - margin);
                const spaceBelow = window.innerHeight - columnChooserRect.bottom - margin - 8;
                const spaceAbove = columnChooserRect.top - margin - 8;
                const openUpward = spaceBelow < 320 && spaceAbove > spaceBelow;
                const maxHeight = Math.max(200, Math.min(620, openUpward ? spaceAbove : spaceBelow));
                const top = openUpward ? undefined : columnChooserRect.bottom + 8;
                const bottom = openUpward ? window.innerHeight - columnChooserRect.top + 8 : undefined;
                const allViews = Object.values(viewsState.views).sort((a, b) => (a.builtin ? -1 : b.builtin ? 1 : a.name.localeCompare(b.name)));
                return (
                  <PopupPortal>
                    <div className="fixed inset-0 z-40" onClick={() => { setShowColumnChooser(false); setColumnChooserRect(null); setShowNewViewForm(false); setEditingViewMeta(null); }} />
                    <div
                      className="fixed bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] p-5 z-50 overflow-y-auto"
                      style={{ left, width: panelWidth, top, bottom, maxHeight }}
                    >
                      {/* ─── Views ─────────────────────────────────────── */}
                      <h4 className="text-sm font-semibold text-[#4a352f] mb-1">Views</h4>
                      <p className="text-xs text-[#a89482] mb-3">Edits below auto-save into whichever view is selected.</p>

                      <div className="space-y-1 mb-3">
                        {allViews.map((view) => {
                          const isActive = view.id === viewsState.activeViewId;
                          const isEditing = editingViewMeta?.id === view.id;
                          if (isEditing) {
                            return (
                              <div key={view.id} className="p-2.5 rounded-lg border border-[#c8b6a6] bg-[#faf7f2] space-y-2">
                                {!view.builtin ? (
                                  <input
                                    autoFocus
                                    value={editingViewMeta.name}
                                    onChange={(e) => setEditingViewMeta((prev) => ({ ...prev, name: e.target.value }))}
                                    placeholder="View name"
                                    className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-sm"
                                  />
                                ) : (
                                  <p className="text-sm font-semibold text-[#4a352f]">Default <span className="font-normal text-[#a89482] text-xs">(name can't be changed)</span></p>
                                )}
                                <textarea
                                  value={editingViewMeta.description}
                                  onChange={(e) => setEditingViewMeta((prev) => ({ ...prev, description: e.target.value }))}
                                  placeholder="Description (optional) — what is this view for?"
                                  rows={2}
                                  className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-xs resize-none"
                                />
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => setEditingViewMeta(null)} className="px-2.5 py-1 text-xs text-[#7d5a50] hover:text-[#4a352f]">Cancel</button>
                                  <button onClick={saveViewMeta} className="px-2.5 py-1 bg-[#7d5a50] text-white rounded-lg text-xs font-semibold">Save</button>
                                </div>
                              </div>
                            );
                          }
                          return (
                            <div key={view.id} className={`flex items-start justify-between gap-2 px-2.5 py-2 rounded-lg ${isActive ? "bg-[#f5f0e1]" : "hover:bg-[#faf7f2]"}`}>
                              <button onClick={() => switchToView(view.id)} className="flex-1 text-left min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {isActive && <CheckCircle size={12} className="text-[#7d5a50] flex-shrink-0" />}
                                  <span className={`text-sm ${isActive ? "font-semibold text-[#4a352f]" : "text-[#4a352f]"}`}>{view.name}</span>
                                  {view.builtin && <span className="text-[10px] uppercase tracking-wide text-[#a89482] font-semibold">Built-in</span>}
                                </div>
                                {view.description && <p className="text-xs text-[#a89482] mt-0.5 truncate">{view.description}</p>}
                              </button>
                              <div className="flex items-center gap-0.5 flex-shrink-0">
                                <button onClick={() => startEditingViewMeta(view)} title="Rename / edit description" className="text-[#a89482] hover:text-[#7d5a50] p-1">
                                  <Settings size={13} />
                                </button>
                                {!view.builtin && (
                                  <button onClick={() => removeView(view.id)} title="Delete view" className="text-[#a89482] hover:text-red-500 p-1">
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {showNewViewForm ? (
                        <div className="space-y-2 mb-1">
                          <input
                            autoFocus
                            value={newViewName}
                            onChange={(e) => setNewViewName(e.target.value)}
                            placeholder="New view name..."
                            className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-sm"
                          />
                          <textarea
                            value={newViewDescription}
                            onChange={(e) => setNewViewDescription(e.target.value)}
                            placeholder="Description (optional) — what is this view for?"
                            rows={2}
                            className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-xs resize-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button onClick={() => { setShowNewViewForm(false); setNewViewName(""); setNewViewDescription(""); }} className="px-2.5 py-1 text-xs text-[#7d5a50] hover:text-[#4a352f]">Cancel</button>
                            <button onClick={createNewView} disabled={!newViewName.trim()} className="px-3 py-1.5 bg-[#7d5a50] text-white rounded-lg text-xs font-semibold disabled:opacity-40">Create view</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setShowNewViewForm(true)} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-[#c8b6a6] rounded-lg text-xs font-semibold text-[#7d5a50] hover:bg-[#faf7f2]">
                          <Plus size={13} /> New view from current layout
                        </button>
                      )}

                      <div className="border-t border-[#e6d7c3] my-4" />

                      {/* ─── Hide/Unhide ─────────────────────────────── */}
                      <h4 className="text-sm font-semibold text-[#4a352f] mb-3">Hide/Unhide</h4>
                      <p className="text-xs text-[#a89482] mb-3 flex items-center gap-1.5">
                        <GripVertical size={12} className="flex-shrink-0" /> Tip: drag any column header in the table to reorder it.
                      </p>
                      {[{ key: "sme", label: "Business Name" }, { key: "bigScore", label: "BIG Score" }, { key: "match", label: "Match %" }, { key: "status", label: "Status" }, { key: "action", label: "Action" }].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-3 py-2 px-2 rounded-lg opacity-75">
                          <input type="checkbox" checked readOnly disabled className="rounded border-[#c8b6a6]" />
                          <span className="text-sm text-[#4a352f]">{label}</span>
                        </label>
                      ))}
                      <div className="border-t border-[#e6d7c3] my-2" />
                      {[
                        { key: "fundingStage", label: "Funding Stage" }, { key: "fundingRequired", label: "Funding Required" },
                        { key: "applied", label: "Applied Date" }, { key: "daysInStage", label: "Days in Stage" },
                        { key: "lastActivity", label: "Last Activity" }, { key: "location", label: "Location" },
                        { key: "sector", label: "Sector" }, { key: "instrument", label: "Instrument" },
                        { key: "guarantees", label: "Guarantees" }, { key: "support", label: "Support Required" },
                        { key: "revenue", label: "Annual Revenue" }, { key: "teamSize", label: "Team Size" },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-[#faf7f2] cursor-pointer">
                          <input type="checkbox" checked={columnVisibility[key] || false} onChange={() => toggleColumn(key)} className="rounded border-[#c8b6a6] text-[#7d5a50]" />
                          <span className="text-sm text-[#4a352f]">{label}</span>
                        </label>
                      ))}

                      <div className="border-t border-[#e6d7c3] my-4" />
                      <h4 className="text-sm font-semibold text-[#4a352f] mb-3">Density</h4>
                      <div className="flex gap-1.5 mb-1">
                        {[{ key: "comfortable", label: "Comfortable" }, { key: "compact", label: "Compact" }, { key: "ultra-compact", label: "Ultra Compact" }].map((d) => (
                          <button
                            key={d.key}
                            onClick={() => setDensity(d.key)}
                            className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${density === d.key ? "bg-[#7d5a50] text-white" : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"}`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>

                      <div className="border-t border-[#e6d7c3] my-4" />
                      <button onClick={resetActiveViewToDefault} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#a67c52] hover:text-[#4a352f] hover:bg-[#faf7f2] border border-[#e6d7c3]">
                        <RotateCcw size={12} /> Reset "{activeView.name}" to factory defaults
                      </button>
                    </div>
                  </PopupPortal>
                );
              })()}
            </div>

            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#7d5a50] to-[#4a352f] text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all shadow-sm" title="Export the currently filtered/sorted businesses to Excel (.xlsx)">
              <Download size={16} /> Export to Excel
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#e6d7c3] shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-8"><div className="space-y-4">{[...Array(8)].map((_, i) => (<div key={i} className="h-10 bg-[#f5f0e1] rounded-lg animate-pulse" />))}</div></div>
        ) : (
          <>
            <div className="overflow-auto" style={{ maxHeight: "70vh" }}>
              <style>{`
                .ismt-th { color: #faf7f2 !important; line-height: 1.1; font-size: 0.75rem !important; font-weight: 600 !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; font-family: inherit !important; vertical-align: top !important; }
                .ismt-th-draggable { cursor: grab; }
                .ismt-th-draggable:active { cursor: grabbing; }
                /* Wrap header labels onto at most 2 lines instead of forcing
                   the column wider than needed. This only lays out cleanly
                   because each column also has a real min-width in
                   COLUMN_DEFS — without that floor, the browser sizes
                   wrapped-text columns to their smallest possible content. */
                .ismt-th-label { flex: 1 1 auto; min-width: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; white-space: normal; overflow-wrap: break-word; line-height: 1.2; }
                /* Column resizing: an explicit header width only holds if the
                   cells below can shrink, so long values wrap rather than
                   forcing the column wider than the width that was dragged. */
                .bigt-fit th, .bigt-fit td { overflow: hidden; }
                .bigt-fit td { word-break: break-word; }
              `}</style>
              <table className="border-collapse bigt-fit" style={{ tableLayout: "auto" }}>
                <thead>
                  <tr className="bg-[#4a352f]">
                    <th className="ismt-th py-3 px-3 relative text-left font-semibold uppercase tracking-wider text-xs border-r border-[#e6d7c3] sticky top-0 left-0 z-30" style={{ backgroundColor: "#4a352f", ...widthStyle("__name__", "170px", "190px") }}>
                      <div className="flex items-start gap-1 min-w-0">
                        <span className="ismt-th-label">Business Name</span>
                        <FilterTrigger type="name" active={!!localFilters.name.trim()} />
                      </div>
                      <ColumnResizer colKey="__name__" />
                    </th>

                    {/* ─── Reorderable columns ──────────────────────── */}
                    {columnOrder.filter((key) => columnVisibility[key]).map((key) => {
                      const col = COLUMN_DEFS[key];
                      if (!col) return null;
                      const isDragging = draggedColumn === key;
                      const isDragOver = dragOverColumn === key && draggedColumn !== key;
                      return (
                        <th
                          key={key}
                          draggable={!resizingColumn}
                          onDragStart={(e) => handleColumnDragStart(e, key)}
                          onDragOver={(e) => handleColumnDragOver(e, key)}
                          onDrop={(e) => handleColumnDrop(e, key)}
                          onDragEnd={handleColumnDragEnd}
                          onMouseEnter={(e) => setDragHintRect(e.currentTarget.getBoundingClientRect())}
                          onMouseLeave={() => setDragHintRect(null)}
                          className={`ismt-th ismt-th-draggable py-3 px-3 relative font-semibold uppercase tracking-wider text-xs border-r border-[#e6d7c3] sticky top-0 z-20 select-none transition-opacity ${col.align === "center" ? "text-center" : "text-left"} ${isDragging ? "opacity-40" : ""}`}
                          style={{ ...widthStyle(key, col.minWidth), backgroundColor: isDragOver ? "#5a423b" : "#4a352f" }}
                        >
                          <div className={`flex items-start gap-1 min-w-0 ${col.align === "center" ? "justify-center" : ""}`}>
                            <GripVertical size={11} className="opacity-40 flex-shrink-0 mt-0.5" />
                            <span className="ismt-th-label">{col.label}</span>
                            <FilterTrigger type={col.filterType} active={getFilterActive(col.filterType)} />
                            {col.tooltip && <HeaderInfoTooltip text={col.tooltip} />}
                          </div>
                          <ColumnResizer colKey={key} />
                        </th>
                      );
                    })}

                    {columnVisibility.action && (
                      <th className="ismt-th py-3 px-3 relative text-center font-semibold uppercase tracking-wider text-xs whitespace-nowrap sticky top-0 z-20" style={{ minWidth: "190px", backgroundColor: "#4a352f" }}>Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginatedSMEs.length === 0 ? (
                    <tr><td colSpan={Object.values(columnVisibility).filter(Boolean).length + 1} className="text-center py-20">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-[#f5f0e1] flex items-center justify-center"><Users size={32} className="text-[#7d5a50] opacity-50" /></div>
                        <p className="text-lg font-semibold text-[#4a352f]">No Businesses Found</p>
                        <p className="text-sm text-[#7d5a50] max-w-xs">
                          {activeFilterCount > 0 ? "Clear a filter to widen the list." : "Applications will appear here as businesses apply to your fund."}
                        </p>
                      </div>
                    </td></tr>
                  ) : (
                    paginatedSMEs.map((sme) => {
                      const bigScoreLabel = getBigScoreLabel(sme.bigScore);
                      const matchLabel = getMatchLabel(sme.matchPercentage);
                      const statusStyle = getStatusStyle(sme.currentStatus, activeStages);
                      const isTerminal = !!statusStyle.stage.terminal;
                      const nextStageLabel = sme.nextStage || "—";
                      const termsheetStatus = termsheetStatuses[sme.id];

                      const renderCell = (key) => {
                        switch (key) {
                          case "bigScore":
                            return (
                              <td key={key} className={`${ds.cell} text-center cursor-pointer border-r border-[#e6d7c3]`} onClick={(e) => openPopupFromEvent("bigScore", sme, e)}>
                                <div className="flex flex-col items-center gap-1">
                                  <div className="relative w-11 h-11">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                      <circle cx="18" cy="18" r="14" fill="none" stroke="#e6d7c3" strokeWidth="3" />
                                      <circle cx="18" cy="18" r="14" fill="none" stroke={bigScoreLabel.color} strokeWidth="3" strokeDasharray={`${sme.bigScore * 0.88} 88`} strokeLinecap="round" />
                                    </svg>
                                    <span className={`absolute inset-0 flex items-center justify-center ${ds.fontSize} font-normal`} style={{ color: bigScoreLabel.color }}>{sme.bigScore}</span>
                                  </div>
                                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${bigScoreLabel.color}20`, color: bigScoreLabel.color }}>{bigScoreLabel.label}</span>
                                </div>
                              </td>
                            );
                          case "match":
                            return (
                              <td key={key} className={`${ds.cell} text-center cursor-pointer border-r border-[#e6d7c3]`} onClick={(e) => openPopupFromEvent("match", sme, e)}>
                                <div className="flex flex-col items-center gap-1 w-full max-w-[90px] mx-auto">
                                  <span className={`${ds.fontSize} font-normal text-[#4a352f]`}>{sme.matchPercentage}%</span>
                                  <span className="text-xs font-medium" style={{ color: matchLabel.color }}>{matchLabel.label}</span>
                                  <div className="w-full h-1.5 bg-[#e6d7c3] rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${sme.matchPercentage}%`, backgroundColor: matchLabel.color }} />
                                  </div>
                                </div>
                              </td>
                            );
                          case "fundingStage":
                            return (
                              <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}>
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#f5f0e1] rounded-full text-xs font-medium">{sme.fundingStage}</span>
                              </td>
                            );
                          case "fundingRequired":
                            return (
                              <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}>
                                <span className="font-normal">{sme.fundingRequired}</span>
                              </td>
                            );
                          case "status":
                            return (
                              <td key={key} className={`${ds.cell} border-r border-[#e6d7c3]`}>
                                <span
                                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border"
                                  style={{ backgroundColor: statusStyle.bg, color: statusStyle.text, borderColor: statusStyle.border }}
                                  title={statusStyle.stage.tooltip}
                                >
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusStyle.dot }} />{statusStyle.stage.name}
                                </span>
                              </td>
                            );
                          case "applied":
                            return (
                              <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}>
                                <div className="flex items-center gap-1.5"><Calendar size={14} className="text-[#7d5a50]" />{sme.applicationDate}</div>
                              </td>
                            );
                          case "daysInStage":
                            return (
                              <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}>
                                <div className="flex items-center gap-1.5"><Clock size={14} className="text-[#7d5a50]" />{sme.daysInStage} days</div>
                              </td>
                            );
                          case "guarantees":
                            return (
                              <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}>
                                {sme.guaranteeCount > 0 ? (
                                  <button
                                    onClick={() => handleOpenGuarantees(sme)}
                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7d5a50] hover:text-[#4a352f] underline underline-offset-2"
                                    title="View guarantees"
                                  >
                                    <Shield size={13} /> {sme.guaranteeCount} available
                                  </button>
                                ) : (
                                  <span className="text-[#a89482]">None</span>
                                )}
                              </td>
                            );
                          case "lastActivity":
                          case "location":
                          case "sector":
                          case "revenue":
                          case "teamSize":
                            return <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}>{sme[key]}</td>;
                          case "instrument":
                            return <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}>{sme.investmentType}</td>;
                          case "support":
                            return (
                              <td key={key} className={`${ds.cell} ${ds.fontSize} text-[#4a352f] border-r border-[#e6d7c3]`}>
                                <span className="line-clamp-1">{sme.supportRequired}</span>
                              </td>
                            );
                          default:
                            return null;
                        }
                      };

                      return (
                        <tr
                          key={sme.id}
                          className="border-b border-[#f0e6d9] transition-all"
                          style={{ backgroundColor: hoveredRowKey === sme.id ? "#fdf8f4" : undefined }}
                          onMouseEnter={() => setHoveredRowKey(sme.id)}
                          onMouseLeave={() => setHoveredRowKey(null)}
                        >
                          {columnVisibility.sme && (
                            <td
                              className={`${ds.cell} ${ds.fontSize} text-[#4a352f] sticky left-0 border-r border-b border-[#e6d7c3] z-10 transition-colors`}
                              style={{ ...widthStyle("__name__", "170px", "190px"), backgroundColor: hoveredRowKey === sme.id ? "#fdf8f4" : "#ffffff" }}
                            >
                              <div className="flex items-start gap-2">
                                <div className={`${ds.avatarSize} rounded-full bg-gradient-to-br from-[#7d5a50] to-[#4a352f] flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5`}>{sme.name.charAt(0)}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start gap-1.5 flex-wrap">
                                    <span className={`${ds.fontSize} font-normal leading-snug text-[#4a352f]`}>{sme.name}</span>
                                    <button
                                      onClick={() => handleViewDetails(sme)}
                                      className="text-[#a89482] hover:text-[#7d5a50] transition-colors flex-shrink-0 mt-0.5"
                                      aria-label={`View profile for ${sme.name}`}
                                      title="View profile"
                                    >
                                      <Eye size={13} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          )}

                          {columnOrder.filter((key) => columnVisibility[key]).map((key) => renderCell(key))}

                          {columnVisibility.action && (
                            <td className={`${ds.cell} text-center`} style={{ minWidth: "190px" }}>
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={(e) => { if (!isTerminal && !subscriptionLoading) openStageUpdate(sme, e); }}
                                  disabled={isTerminal || subscriptionLoading}
                                  title={isTerminal ? `${statusStyle.stage.name} — no further stage` : `Move to ${nextStageLabel}`}
                                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                                    isTerminal || subscriptionLoading
                                      ? "bg-[#e6d7c3]/60 text-[#a89482] cursor-not-allowed"
                                      : "text-white hover:shadow-md hover:brightness-105"
                                  }`}
                                  style={{ width: "128px", height: "34px", backgroundColor: isTerminal || subscriptionLoading ? undefined : "#7d5a50" }}
                                >
                                  {!isTerminal && <ArrowRight size={13} className="flex-shrink-0" />}
                                  <span className="truncate">{isTerminal ? statusStyle.stage.name : nextStageLabel}</span>
                                </button>

                                {/* Term sheet response indicator */}
                                {mapStatusToStageId(sme.currentStatus, activeStages) === "terms" && termsheetStatus && (
                                  <span
                                    title={termsheetStatus === "accepted" ? "Term sheet accepted" : "Term sheet declined"}
                                    className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[11px] font-bold flex-shrink-0"
                                    style={{ backgroundColor: termsheetStatus === "accepted" ? "#22c55e" : "#ef4444" }}
                                  >
                                    {termsheetStatus === "accepted" ? "✓" : "✗"}
                                  </span>
                                )}

                                <button
                                  onClick={(e) => openPopupFromEvent("quickActions", sme, e)}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-all hover:bg-[#f5f0e1] flex-shrink-0"
                                  style={{ borderColor: "#7d5a5050", color: "#7d5a50" }}
                                  title="More actions"
                                >
                                  <MoreVertical size={14} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#e6d7c3] bg-[#faf7f2] rounded-b-2xl">
              <div className="flex items-center gap-4">
                <span className="text-sm text-[#4a352f]">
                  Showing {Math.min((currentPage - 1) * pageSize + 1, filteredAndSortedSMEs.length)}-{Math.min(currentPage * pageSize, filteredAndSortedSMEs.length)} of {filteredAndSortedSMEs.length} Businesses
                </span>
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="px-3 py-1.5 bg-white border border-[#c8b6a6] rounded-lg text-sm text-[#4a352f]">
                  <option value={25}>25</option><option value={50}>50</option><option value={100}>100</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-3 py-1.5 bg-white border border-[#c8b6a6] rounded-lg text-sm text-[#4a352f] disabled:opacity-50">First</button>
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 bg-white border border-[#c8b6a6] rounded-lg text-sm text-[#4a352f] disabled:opacity-50">Prev</button>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pn;
                  if (totalPages <= 5) pn = i + 1;
                  else if (currentPage <= 3) pn = i + 1;
                  else if (currentPage >= totalPages - 2) pn = totalPages - 4 + i;
                  else pn = currentPage - 2 + i;
                  return <button key={pn} onClick={() => setCurrentPage(pn)} className={`w-8 h-8 rounded-lg text-sm font-medium ${currentPage === pn ? "bg-[#7d5a50] text-white" : "bg-white border border-[#c8b6a6] text-[#4a352f]"}`}>{pn}</button>;
                })}
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 bg-white border border-[#c8b6a6] rounded-lg text-sm text-[#4a352f] disabled:opacity-50">Next</button>
                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-3 py-1.5 bg-white border border-[#c8b6a6] rounded-lg text-sm text-[#4a352f] disabled:opacity-50">Last</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── Drag-to-reorder hint tooltip ─────────────────────────────────── */}
      {dragHintRect && !draggedColumn && (
        <PopupPortal>
          <div
            className="fixed z-[1200] bg-[#4a352f] text-[#faf7f2] text-xs rounded-lg px-3 py-2 shadow-2xl pointer-events-none normal-case font-normal flex items-center gap-1.5"
            style={{
              top: dragHintRect.bottom + 8,
              left: Math.min(Math.max(dragHintRect.left, 12), window.innerWidth - 200),
              width: "190px",
            }}
          >
            <GripVertical size={12} className="flex-shrink-0" /> Drag to reorder columns
          </div>
        </PopupPortal>
      )}

      {/* ─── Column header filter popover ─────────────────────────────────── */}
      {headerFilterOpen && (
        <PopupPortal>
          <div className="fixed inset-0 z-[1090]" onClick={closeHeaderFilter} />
          <div
            className="fixed z-[1091] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] p-4"
            style={{
              top: headerFilterOpen.rect.bottom + 8,
              left: Math.min(Math.max(headerFilterOpen.rect.left - 20, 12), window.innerWidth - 292),
              width: "280px",
            }}
          >
            {headerFilterOpen.type === "name" && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#4a352f]">Filter by business name</label>
                  {localFilters.name && (
                    <button onClick={() => setLocalFilters((p) => ({ ...p, name: "" }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                  )}
                </div>
                <input
                  autoFocus type="text" value={localFilters.name}
                  onChange={(e) => { setLocalFilters((p) => ({ ...p, name: e.target.value })); setCurrentPage(1); }}
                  placeholder="Search business name..."
                  className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7d5a50]/20"
                />
              </>
            )}

            {(headerFilterOpen.type === "bigScore" || headerFilterOpen.type === "match") && (() => {
              const isBig = headerFilterOpen.type === "bigScore";
              const rangeKey = isBig ? "bigScoreRange" : "matchRange";
              const range = localFilters[rangeKey];
              return (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-semibold text-[#4a352f]">{isBig ? "BIG Score" : "Match %"}: {range[0]} - {range[1]}</label>
                    {(range[0] > 0 || range[1] < 100) && (
                      <button onClick={() => setLocalFilters((p) => ({ ...p, [rangeKey]: [0, 100] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <input type="number" min="0" max="100" value={range[0]}
                      onChange={(e) => setLocalFilters((p) => ({ ...p, [rangeKey]: [Math.min(parseInt(e.target.value) || 0, p[rangeKey][1]), p[rangeKey][1]] }))}
                      className="w-16 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center" />
                    <span className="text-[#7d5a50]">to</span>
                    <input type="number" min="0" max="100" value={range[1]}
                      onChange={(e) => setLocalFilters((p) => ({ ...p, [rangeKey]: [p[rangeKey][0], Math.max(parseInt(e.target.value) || 0, p[rangeKey][0])] }))}
                      className="w-16 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center" />
                  </div>
                  <input type="range" min="0" max="100" value={range[0]}
                    onChange={(e) => setLocalFilters((p) => ({ ...p, [rangeKey]: [parseInt(e.target.value), p[rangeKey][1]] }))}
                    className="w-full accent-[#7d5a50]" />
                </>
              );
            })()}

            {headerFilterOpen.type === "status" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">Status</label>
                  {localFilters.status.length > 0 && (
                    <button onClick={() => setLocalFilters((p) => ({ ...p, status: [] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeStages.map((s) => (
                    <button key={s.id}
                      onClick={() => setLocalFilters((p) => ({ ...p, status: p.status.includes(s.name) ? p.status.filter((x) => x !== s.name) : [...p.status, s.name] }))}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${localFilters.status.includes(s.name) ? "bg-[#7d5a50] text-white" : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"}`}>
                      {s.name}
                    </button>
                  ))}
                </div>
              </>
            )}

            {headerFilterOpen.type === "fundingStage" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#4a352f]">Funding Stage</label>
                  {localFilters.fundingStage.length > 0 && (
                    <button onClick={() => setLocalFilters((p) => ({ ...p, fundingStage: [] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Pre-Seed", "Seed", "Series A", "Series B", "Growth", "Startup", "Scale"].map((s) => (
                    <button key={s}
                      onClick={() => setLocalFilters((p) => ({ ...p, fundingStage: p.fundingStage.includes(s) ? p.fundingStage.filter((x) => x !== s) : [...p.fundingStage, s] }))}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${localFilters.fundingStage.includes(s) ? "bg-[#7d5a50] text-white" : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}

            {(headerFilterOpen.type === "sector" || headerFilterOpen.type === "instrument") && (() => {
              const isSector = headerFilterOpen.type === "sector";
              const key = isSector ? "sector" : "instrument";
              const options = isSector ? sectorOptions : instrumentOptions;
              return (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-semibold text-[#4a352f]">{isSector ? "Sector" : "Instrument"}</label>
                    {localFilters[key].length > 0 && (
                      <button onClick={() => setLocalFilters((p) => ({ ...p, [key]: [] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-[180px] overflow-y-auto">
                    {options.length === 0 && <span className="text-xs text-[#a89482]">No data available</span>}
                    {options.map((s) => (
                      <button key={s}
                        onClick={() => setLocalFilters((p) => ({ ...p, [key]: p[key].includes(s) ? p[key].filter((x) => x !== s) : [...p[key], s] }))}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${localFilters[key].includes(s) ? "bg-[#7d5a50] text-white" : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              );
            })()}

            {(headerFilterOpen.type === "fundingRequired" || headerFilterOpen.type === "daysInStage") && (() => {
              const isFunding = headerFilterOpen.type === "fundingRequired";
              const key = isFunding ? "fundingRequiredRange" : "daysInStageRange";
              const range = localFilters[key];
              return (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-[#4a352f]">{isFunding ? "Funding Required (R)" : "Days in Stage"}</label>
                    {(range[0] != null || range[1] != null) && (
                      <button onClick={() => setLocalFilters((p) => ({ ...p, [key]: [null, null] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="number" min="0" placeholder="Min" value={range[0] ?? ""}
                      onChange={(e) => setLocalFilters((p) => ({ ...p, [key]: [e.target.value === "" ? null : Number(e.target.value), p[key][1]] }))}
                      className="w-full px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center" />
                    <span className="text-[#7d5a50]">to</span>
                    <input type="number" min="0" placeholder="Max" value={range[1] ?? ""}
                      onChange={(e) => setLocalFilters((p) => ({ ...p, [key]: [p[key][0], e.target.value === "" ? null : Number(e.target.value)] }))}
                      className="w-full px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center" />
                  </div>
                </>
              );
            })()}

            {headerFilterOpen.type === "applied" && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#4a352f]">Applied Date</label>
                  {(localFilters.appliedRange[0] || localFilters.appliedRange[1]) && (
                    <button onClick={() => setLocalFilters((p) => ({ ...p, appliedRange: [null, null] }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                  )}
                </div>
                <div className="space-y-2">
                  <input type="date" value={localFilters.appliedRange[0] || ""}
                    onChange={(e) => setLocalFilters((p) => ({ ...p, appliedRange: [e.target.value || null, p.appliedRange[1]] }))}
                    className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-sm" />
                  <input type="date" value={localFilters.appliedRange[1] || ""}
                    onChange={(e) => setLocalFilters((p) => ({ ...p, appliedRange: [p.appliedRange[0], e.target.value || null] }))}
                    className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-sm" />
                </div>
              </>
            )}

            {["location", "lastActivity", "guarantees", "support", "revenue", "teamSize"].includes(headerFilterOpen.type) && (() => {
              const key = headerFilterOpen.type;
              const labels = {
                location: "location", lastActivity: "last activity", guarantees: "guarantees",
                support: "support required", revenue: "revenue", teamSize: "team size",
              };
              return (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-[#4a352f]">Filter by {labels[key]}</label>
                    {localFilters[key] && (
                      <button onClick={() => setLocalFilters((p) => ({ ...p, [key]: "" }))} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">Clear</button>
                    )}
                  </div>
                  <input autoFocus type="text" value={localFilters[key]}
                    onChange={(e) => setLocalFilters((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={`Search ${labels[key]}...`}
                    className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7d5a50]/20" />
                </>
              );
            })()}
          </div>
        </PopupPortal>
      )}

      {/* ─── BIG Score Popup ──────────────────────────────────────────────── */}
      {activePopup?.type === "bigScore" && selectedSMEForPopup && (
        <PopupPortal>
          <div className="fixed inset-0 z-[1000]" onClick={closePopup} />
          <div className="fixed z-[1001] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] overflow-hidden"
            style={{ top: activePopup.position.y, left: activePopup.position.x, width: "380px", maxHeight: "480px", overflowY: "auto" }}>
            <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">BIG Score</p>
                  <h3 className="text-sm font-bold mt-0.5 truncate max-w-[200px]">{selectedSMEForPopup.name}</h3>
                  {bigScoreData._lastUpdated && (
                    <p className="text-[10px] text-[#f5f0e1]/70 mt-0.5">
                      Updated {new Date(bigScoreData._lastUpdated).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center text-xl font-bold">
                    {bigScoreLoading ? "…" : (bigScoreData._bigScore || selectedSMEForPopup.bigScore)}
                  </div>
                  <button onClick={closePopup} className="text-white/70 hover:text-white transition-colors flex-shrink-0 p-1"><X size={18} /></button>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {bigScoreLoading ? (
                <div className="space-y-3">{[...Array(5)].map((_, i) => (<div key={i} className="h-16 bg-[#f5f0e1] rounded-xl animate-pulse" />))}</div>
              ) : (
                [
                  { key: "compliance", label: "Compliance", desc: "Regulatory & legal standing" },
                  { key: "legitimacy", label: "Legitimacy", desc: "Business verification status" },
                  { key: "fundability", label: "Capital Appeal", desc: "Investment readiness & fundability" },
                  { key: "pis", label: "Performance", desc: "Performance indicators & strategic metrics" },
                  { key: "leadership", label: "Leadership", desc: "Management team quality & experience" },
                ].map(({ key, label, desc }) => {
                  const score = bigScoreData[key]?.score || 0;
                  const lbl = getBigScoreLabel(score);
                  return (
                    <div key={key} className="bg-[#faf7f2] rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="text-xs font-semibold text-[#4a352f]">{label}</span>
                          <p className="text-[10px] text-[#7d5a50]">{desc}</p>
                        </div>
                        <span className="text-sm font-bold" style={{ color: lbl.color }}>{score}%</span>
                      </div>
                      <div className="w-full h-2 bg-[#e6d7c3] rounded-full">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, backgroundColor: lbl.color }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </PopupPortal>
      )}

      {/* ─── Match Breakdown Popup ────────────────────────────────────────── */}
      {activePopup?.type === "match" && selectedSMEForPopup && (
        <PopupPortal>
          <div className="fixed inset-0 z-[1000]" onClick={closePopup} />
          <div className="fixed z-[1001] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] overflow-hidden"
            style={{ top: activePopup.position.y, left: activePopup.position.x, width: "380px", maxHeight: "420px", overflowY: "auto" }}>
            <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Why this match?</p>
                  <h3 className="text-sm font-bold mt-0.5 truncate max-w-[200px]">{selectedSMEForPopup.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xl font-bold">{selectedSMEForPopup.matchPercentage}%</div>
                  <button onClick={closePopup} className="text-white/70 hover:text-white transition-colors flex-shrink-0 p-1"><X size={18} /></button>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {matchBreakdownData ? Object.entries(matchBreakdownData).map(([key, data]) => {
                if (!data || typeof data !== "object") return null;
                const labels = { sector: "Sector Match", stage: "Stage Match", ticket: "Ticket Size", type: "Instrument Match" };
                const pct = Math.round(data.score || 0);
                const good = pct >= 50;
                return (
                  <div key={key} className="p-3 rounded-lg border border-[#e6d7c3] bg-[#faf7f2] text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-[#4a352f]">
                        {labels[key] || key}
                        <span className="font-normal text-[#a89482]"> · weight {Math.round((data.weight || 0) * 100)}%</span>
                      </span>
                      <span className="font-bold" style={{ color: good ? "#22c55e" : "#ef4444" }}>{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#e6d7c3] rounded-full overflow-hidden mb-2">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: good ? "#22c55e" : "#ef4444" }} />
                    </div>
                    {key === "sector" && (
                      <p className="text-[11px] text-[#7d5a50]">
                        Matched: {data.matched?.length ? data.matched.join(", ") : "None"}
                      </p>
                    )}
                    {key === "stage" && (
                      <p className="text-[11px] text-[#7d5a50]">
                        Your stages: {formatInvestmentStage(data.investorStages?.join(", ")) || "Not set"} · Business: {formatInvestmentStage(data.smeStage) || "Not set"}
                      </p>
                    )}
                    {key === "ticket" && (
                      <p className="text-[11px] text-[#7d5a50]">
                        Your range: R{(data.investorMin || 0).toLocaleString("en-ZA")} – {data.investorMax ? `R${data.investorMax.toLocaleString("en-ZA")}` : "no max"} · Requested: R{(data.smeAmount || 0).toLocaleString("en-ZA")}
                      </p>
                    )}
                    {key === "type" && (
                      <p className="text-[11px] text-[#7d5a50]">
                        Matched: {data.matchedInstruments?.length ? data.matchedInstruments.join(", ") : "None"}
                      </p>
                    )}
                  </div>
                );
              }) : <p className="text-xs text-[#a89482] text-center py-4">No breakdown available for this application.</p>}
            </div>
          </div>
        </PopupPortal>
      )}

      {/* ─── Stage Update Popup ───────────────────────────────────────────── */}
      {activePopup?.type === "stage" && selectedSMEForPopup && (() => {
        const stageFields = getStageFields(stageUpdateData.nextStage, activeStages);
        return (
          <PopupPortal>
            <div className="fixed inset-0 z-[1000]" onClick={closePopup} />
            <div className="fixed z-[1001] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] overflow-hidden"
              style={{ top: activePopup.position.y, left: activePopup.position.x, width: "460px", maxHeight: "560px", overflowY: "auto" }}>
              <div className="bg-gradient-to-br from-[#4a352f] to-[#7d5a50] p-4 text-white sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#f5f0e1] uppercase tracking-wider">Update Stage</p>
                    <h3 className="text-sm font-bold mt-0.5 truncate max-w-[300px]">{selectedSMEForPopup.name}</h3>
                  </div>
                  <button onClick={closePopup} className="text-white/70 hover:text-white transition-colors flex-shrink-0 p-1"><X size={18} /></button>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4a352f] mb-1">Select Next Stage *</label>
                  <select
                    value={stageUpdateData.nextStage}
                    onChange={(e) => {
                      const stageId = mapStatusToStageId(e.target.value, activeStages);
                      setStageUpdateData((prev) => ({
                        ...prev,
                        nextStage: e.target.value,
                        message: DEFAULT_STAGE_MESSAGES[stageId] || prev.message,
                      }));
                      setStageFormErrors((prev) => ({ ...prev, nextStage: null }));
                    }}
                    className={`w-full px-3 py-2 border-2 rounded-lg text-xs ${stageFormErrors.nextStage ? "border-red-500" : "border-[#c8b6a6]"}`}
                  >
                    <option value="">Choose a stage...</option>
                    {activeStages.map((s) => (<option key={s.id} value={s.name}>{s.name}</option>))}
                  </select>
                  {stageFormErrors.nextStage && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertTriangle size={12} /> {stageFormErrors.nextStage}</p>}
                </div>

                {stageUpdateData.nextStage && (
                  <>
                    {stageFields.showMessage && (
                      <div>
                        <label className="block text-xs font-semibold text-[#4a352f] mb-1">Message to Business *</label>
                        <textarea
                          value={stageUpdateData.message}
                          onChange={(e) => setStageUpdateData((prev) => ({ ...prev, message: e.target.value }))}
                          placeholder="Enter your message..." rows={4}
                          className={`w-full px-3 py-2 border-2 rounded-lg text-xs resize-y ${stageFormErrors.message ? "border-red-500" : "border-[#c8b6a6]"}`}
                        />
                        <p className="text-[11px] text-[#a89482] mt-1">A template is loaded for this stage — edit it to suit.</p>
                        {stageFormErrors.message && <p className="text-red-500 text-xs mt-1">{stageFormErrors.message}</p>}
                      </div>
                    )}

                    {stageFields.showMeeting && (
                      <div className="bg-[#faf7f2] rounded-xl p-4 space-y-3">
                        <h4 className="text-xs font-semibold text-[#4a352f] flex items-center gap-2"><Video size={14} /> Schedule Meeting</h4>
                        <div>
                          <label className="block text-xs text-[#4a352f] mb-1">Meeting Time</label>
                          <input type="datetime-local" value={stageUpdateData.meetingTime}
                            onChange={(e) => setStageUpdateData((prev) => ({ ...prev, meetingTime: e.target.value }))}
                            className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-xs" />
                        </div>
                        <div>
                          <label className="block text-xs text-[#4a352f] mb-1">Location *</label>
                          <input type="text" value={stageUpdateData.meetingLocation}
                            onChange={(e) => setStageUpdateData((prev) => ({ ...prev, meetingLocation: e.target.value }))}
                            placeholder="Office, Virtual, etc."
                            className={`w-full px-3 py-2 border-2 rounded-lg text-xs ${stageFormErrors.meetingLocation ? "border-red-500" : "border-[#c8b6a6]"}`} />
                          {stageFormErrors.meetingLocation && <p className="text-red-500 text-xs mt-1">{stageFormErrors.meetingLocation}</p>}
                        </div>
                        <div>
                          <label className="block text-xs text-[#4a352f] mb-1">Purpose *</label>
                          <input type="text" value={stageUpdateData.meetingPurpose}
                            onChange={(e) => setStageUpdateData((prev) => ({ ...prev, meetingPurpose: e.target.value }))}
                            placeholder="Initial discussion, strategy review, etc."
                            className={`w-full px-3 py-2 border-2 rounded-lg text-xs ${stageFormErrors.meetingPurpose ? "border-red-500" : "border-[#c8b6a6]"}`} />
                          {stageFormErrors.meetingPurpose && <p className="text-red-500 text-xs mt-1">{stageFormErrors.meetingPurpose}</p>}
                        </div>
                      </div>
                    )}

                    {stageFields.showAvailability && (
                      <div className="bg-[#faf7f2] rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-semibold text-[#4a352f] flex items-center gap-2"><Calendar size={14} /> Your Availability</h4>
                          <button onClick={() => setShowCalendarPopup(true)} className="flex items-center gap-1 px-3 py-1.5 bg-[#7d5a50] text-white rounded-lg text-xs hover:bg-[#4a352f] transition-all">
                            <Calendar size={12} /> Add Dates
                          </button>
                        </div>
                        {availabilities.length > 0 ? (
                          <div className="space-y-2 max-h-[150px] overflow-y-auto">
                            {availabilities.map((a, i) => (
                              <div key={i} className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#e6d7c3]">
                                <div>
                                  <div className="text-xs font-medium text-[#4a352f]">
                                    {a.date?.toLocaleDateString?.("en-ZA", { weekday: "short", month: "short", day: "numeric" }) || "Date unavailable"}
                                  </div>
                                  {a.timeSlots?.[0] && (<div className="text-xs text-[#7d5a50]">{a.timeSlots[0].start} – {a.timeSlots[0].end}</div>)}
                                </div>
                                <button onClick={() => removeAvailability(a.date)} className="text-red-500 hover:text-red-700 p-1"><X size={14} /></button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[#7d5a50] italic">No availability added yet</p>
                        )}
                        {stageFormErrors.availabilities && <p className="text-red-500 text-xs mt-2">{stageFormErrors.availabilities}</p>}
                      </div>
                    )}

                    {stageFields.showFundingDetails && (
                      <div className="bg-[#faf7f2] rounded-xl p-4 space-y-3">
                        <h4 className="text-xs font-semibold text-[#4a352f] flex items-center gap-2"><Target size={14} /> Funding Details</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-[#4a352f] mb-1">Amount Requested</label>
                            <div className="px-3 py-2 rounded-lg border border-[#c8b6a6] bg-white text-xs text-[#7d5a50] flex items-center justify-between">
                              <span>{selectedSMEForPopup.fundingRequired}</span>
                              <Info size={12} className="text-[#a89482]" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-[#4a352f] mb-1">Amount Approved *</label>
                            <input type="text" value={stageUpdateData.amountApproved}
                              onChange={(e) => setStageUpdateData((prev) => ({ ...prev, amountApproved: e.target.value }))}
                              placeholder="R450,000"
                              className={`w-full px-3 py-2 border-2 rounded-lg text-xs ${stageFormErrors.amountApproved ? "border-red-500" : "border-[#c8b6a6]"}`} />
                          </div>
                        </div>
                        {stageFormErrors.amountApproved && <p className="text-red-500 text-xs">{stageFormErrors.amountApproved}</p>}
                        <div>
                          <label className="block text-xs text-[#4a352f] mb-1">Investment Type *</label>
                          <select value={stageUpdateData.investmentType}
                            onChange={(e) => setStageUpdateData((prev) => ({ ...prev, investmentType: e.target.value }))}
                            className={`w-full px-3 py-2 border-2 rounded-lg text-xs ${stageFormErrors.investmentType ? "border-red-500" : "border-[#c8b6a6]"}`}>
                            <option value="">Select investment type</option>
                            <option value="equity">Equity (shareholding)</option>
                            <option value="debt">Debt (loan)</option>
                            <option value="grant">Grant / Donation</option>
                            <option value="convertible">Convertible Note</option>
                            <option value="blended">Strategic Partnership</option>
                            <option value="other">Other</option>
                          </select>
                          {stageFormErrors.investmentType && <p className="text-red-500 text-xs mt-1">{stageFormErrors.investmentType}</p>}
                        </div>
                        <div>
                          <label className="block text-xs text-[#4a352f] mb-1">Payment Deployment *</label>
                          <textarea value={stageUpdateData.paymentDeployment}
                            onChange={(e) => setStageUpdateData((prev) => ({ ...prev, paymentDeployment: e.target.value }))}
                            placeholder="e.g. 50% upfront, 50% on milestone completion" rows={3}
                            className={`w-full px-3 py-2 border-2 rounded-lg text-xs resize-y ${stageFormErrors.paymentDeployment ? "border-red-500" : "border-[#c8b6a6]"}`} />
                          {stageFormErrors.paymentDeployment && <p className="text-red-500 text-xs mt-1">{stageFormErrors.paymentDeployment}</p>}
                        </div>
                      </div>
                    )}

                    {stageFields.showTermSheet && (
                      <div>
                        <label className="block text-xs font-semibold text-[#4a352f] mb-1">Term Sheet / Agreement (PDF, DOC)</label>
                        <input type="file" accept=".pdf,.doc,.docx"
                          onChange={(e) => setStageUpdateData((prev) => ({ ...prev, termSheetFile: e.target.files[0] }))}
                          className={`w-full px-3 py-2 border rounded-lg text-xs ${stageFormErrors.termSheetFile ? "border-red-500" : "border-[#c8b6a6]"}`} />
                        {stageUpdateData.termSheetFile && (
                          <p className="text-xs text-green-700 mt-1">Selected: {stageUpdateData.termSheetFile.name}</p>
                        )}
                        {stageFormErrors.termSheetFile && <p className="text-red-500 text-xs mt-1">{stageFormErrors.termSheetFile}</p>}
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={closePopup} className="px-4 py-2 bg-[#faf7f2] text-[#7d5a50] rounded-lg text-xs font-medium hover:bg-[#f5f0e1] transition-all">Cancel</button>
                  <button onClick={handleStageUpdate} disabled={isStageSubmitting} className="px-4 py-2 bg-[#7d5a50] text-white rounded-lg text-xs font-semibold hover:bg-[#4a352f] transition-all disabled:opacity-50">
                    {isStageSubmitting ? "Updating..." : "Update Stage"}
                  </button>
                </div>
              </div>
            </div>

            {/* Calendar Popup */}
            {showCalendarPopup && (
              <>
                <div className="fixed inset-0 z-[1100]" onClick={() => setShowCalendarPopup(false)} />
                <div className="fixed z-[1101] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] p-6"
                  style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "400px", maxHeight: "80vh", overflowY: "auto" }}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-[#4a352f]">Select Available Dates</h4>
                    <button onClick={() => setShowCalendarPopup(false)} className="text-[#7d5a50] hover:text-[#4a352f]"><X size={18} /></button>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-[#4a352f] mb-2">Time Slot</label>
                    <div className="flex gap-2">
                      <input type="time" value={timeSlot.start} onChange={(e) => handleTimeChange("start", e.target.value)} className="flex-1 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-xs" />
                      <span className="text-[#7d5a50] self-center">to</span>
                      <input type="time" value={timeSlot.end} onChange={(e) => handleTimeChange("end", e.target.value)} className="flex-1 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-xs" />
                    </div>
                  </div>
                  <div className="mb-4">
                    <DayPicker mode="multiple" selected={tempDates} onSelect={handleDateSelect} fromDate={new Date()} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowCalendarPopup(false)} className="px-4 py-2 bg-[#faf7f2] text-[#7d5a50] rounded-lg text-xs">Cancel</button>
                    <button onClick={saveSelectedDates} disabled={tempDates.length === 0} className="px-4 py-2 bg-[#7d5a50] text-white rounded-lg text-xs disabled:opacity-50">
                      Save Dates ({tempDates.length})
                    </button>
                  </div>
                </div>
              </>
            )}
          </PopupPortal>
        );
      })()}

      {/* ─── Quick Actions Popup ──────────────────────────────────────────── */}
      {activePopup?.type === "quickActions" && selectedSMEForPopup && (() => {
        const sme = selectedSMEForPopup;
        const stage = getStatusStyle(sme.currentStatus, activeStages).stage;
        const declinedStage = activeStages.find((s) => s.terminal && /declined/i.test(s.name));
        return (
          <PopupPortal>
            <div className="fixed inset-0 z-[1000]" onClick={closePopup} />
            <div className="fixed z-[1001] bg-white rounded-xl shadow-2xl border border-[#e6d7c3] py-1 overflow-hidden"
              style={{ top: activePopup.position.y, left: activePopup.position.x, width: "210px" }}>
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#e6d7c3]">
                <span className="text-xs font-semibold text-[#4a352f]">Quick Actions</span>
                <button onClick={closePopup} className="text-[#7d5a50] hover:text-[#4a352f]"><X size={14} /></button>
              </div>
              <button onClick={() => handleViewDetails(sme)} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"><Eye size={12} /> View Profile</button>
              <button onClick={() => openPopup("bigScore", sme, activePopup.rect)} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"><ExternalLink size={12} /> BIG Score Breakdown</button>
              <button onClick={() => openPopup("match", sme, activePopup.rect)} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"><Target size={12} /> Why This Match?</button>
              {sme.guaranteeCount > 0 && (
                <button onClick={() => { handleOpenGuarantees(sme); closePopup(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"><Shield size={12} /> View Guarantees</button>
              )}
              <button onClick={() => { setNotification({ type: "success", message: "Messaging coming soon" }); closePopup(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4a352f] hover:bg-[#faf7f2] text-left"><MessageSquare size={12} /> Send Message</button>
              {!stage.terminal && declinedStage && (
                <button
                  onClick={(e) => openStageUpdate(sme, e, { presetStage: declinedStage.name })}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 text-left border-t border-[#e6d7c3]"
                >
                  <XCircle size={12} /> Decline Application
                </button>
              )}
            </div>
          </PopupPortal>
        );
      })()}

      {/* ─── Guarantees Modal ─────────────────────────────────────────────── */}
      {showGuarantees && (
        <GuaranteesModal
          guarantees={showGuarantees.guarantees}
          businessName={showGuarantees.name}
          onClose={() => setShowGuarantees(null)}
        />
      )}

      {/* ─── Subscription Upsell ──────────────────────────────────────────── */}
      {showStageUpsell && (
        <Modal onClose={() => setShowStageUpsell(false)}>
          <Upsell
            inModal
            onClose={() => setShowStageUpsell(false)}
            title="Stage Update"
            subtitle="Stage updates and status actions are available on Engage & Partner plans."
            features={["Update pipeline stage", "Record decisions & notes", "Notify businesses", "Track history & timestamps"]}
            plans={["Engage", "Partner"]}
            upgradeMessage="Upgrade to access stage updates for your matches and manage deal flow effectively."
            primaryLabel="View Plans"
            onPrimary={() => { setShowStageUpsell(false); navigate("/investor/billing/subscriptions"); }}
          />
        </Modal>
      )}

      {/* ─── Business Details Modal ───────────────────────────────────────── */}
      {showSMEDetails && selectedSMEDetails && (
        <InvestorSMEDetailsModal
          sme={selectedSMEDetails}
          isOpen={showSMEDetails}
          onClose={() => { setShowSMEDetails(false); setSelectedSMEDetails(null); }}
        />
      )}
    </div>
  );
}

// Default export alongside the named export so this component resolves whether
// the importing file uses `import InvestorSMETable from "./InvestorSMETable"`
// or `import { InvestorSMETable } from "./InvestorSMETable"`.
export default InvestorSMETable;