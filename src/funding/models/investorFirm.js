/**
 * funding/models/investorFirm.js
 *
 * Firm → Programme → Opportunity hierarchy from Brief §4.
 *
 * A firm is NOT itself a matching mandate. The programme carries the
 * mandate (capital source, ticket, sectors, stage, geography). The
 * opportunity is the live, dated, submittable unit.
 */

export const FIRM_TYPES = Object.freeze({
  BANK: "bank",
  DFI: "dfi",
  FUND: "fund",
  FAMILY_OFFICE: "family_office",
  GOVERNMENT: "government",
  CORPORATE: "corporate",
  NGO: "ngo",
  ACCELERATOR: "accelerator",
  OTHER: "other",
});

export const FIRM_ROLES = Object.freeze({
  LENDER: "lender",
  EQUITY_INVESTOR: "equity_investor",
  GRANT_MAKER: "grant_maker",
  GUARANTOR: "guarantor",
  BLENDED_PROVIDER: "blended_provider",
});

export const OPPORTUNITY_STATUS = Object.freeze({
  DRAFT: "draft",
  PENDING_APPROVAL: "pending_approval",
  PUBLISHED: "published",
  CLOSED: "closed",
  ARCHIVED: "archived",
});

const nowIso = () => new Date().toISOString();

// ── Firm ─────────────────────────────────────────────────────────────────
export const createEmptyFirm = ({ userId, userEmail }) => ({
  firmId: null,
  ownerId: userId,
  ownerEmail: userEmail,

  name: "",
  type: FIRM_TYPES.FUND,
  roles: [],
  registrationNumber: "",
  country: "ZA",

  contactName: "",
  contactEmail: "",
  contactPhone: "",

  verifiedAuthority: false,
  verificationNotes: "",

  status: OPPORTUNITY_STATUS.DRAFT,
  createdAt: nowIso(),
  createdBy: userId,
  updatedAt: nowIso(),
  updatedBy: userId,
  version: 1,
});

// ── Programme ────────────────────────────────────────────────────────────
export const createEmptyProgramme = ({ firmId, userId }) => ({
  programmeId: null,
  firmId,
  ownerId: userId,

  name: "",
  capitalSource: "",
  mandate: "",

  allowedInstruments: [],
  ticketMin: null,
  ticketMax: null,
  currency: "ZAR",

  sectors: [],
  stages: [],
  geographies: [],
  supportOffered: [],

  status: OPPORTUNITY_STATUS.DRAFT,
  createdAt: nowIso(),
  createdBy: userId,
  updatedAt: nowIso(),
  updatedBy: userId,
  version: 1,
});

// ── Opportunity ──────────────────────────────────────────────────────────
export const createEmptyOpportunity = ({ programmeId, firmId, userId }) => ({
  opportunityId: null,
  programmeId,
  firmId,
  ownerId: userId,

  name: "",
  purpose: "",

  liveFrom: null,
  liveTo: null,
  deadline: null,

  instrumentId: "",         // primary instrument (from instruments.js)
  evaluationCriteria: "",

  // Matching rules (soft)
  matchRules: {
    minBigScore: null,
    requireVerifiedFinancials: false,
    customNotes: "",
  },

  // Submission configuration
  validationLevel: "uploaded",   // "uploaded" | "checked" | "verified"
  declarations: [],
  submissionRoute: "in_app",     // "in_app" | "email" | "portal"

  scoringProfileId: null,
  requirementRuleCount: 0,

  status: OPPORTUNITY_STATUS.DRAFT,
  publishedVersion: null,
  publishedAt: null,
  publishedBy: null,

  createdAt: nowIso(),
  createdBy: userId,
  updatedAt: nowIso(),
  updatedBy: userId,
  version: 1,
});

// ── Validation ───────────────────────────────────────────────────────────
export const validateFirm = (firm) => {
  const errors = [];
  if (!firm.name?.trim()) errors.push({ field: "name", message: "Firm name is required." });
  if (!firm.type) errors.push({ field: "type", message: "Firm type is required." });
  if (!firm.roles?.length) errors.push({ field: "roles", message: "At least one role is required." });
  return { ok: errors.length === 0, errors };
};

export const validateProgramme = (programme) => {
  const errors = [];
  if (!programme.name?.trim()) errors.push({ field: "name", message: "Programme name is required." });
  if (!programme.capitalSource?.trim()) errors.push({ field: "capitalSource", message: "Capital source is required." });
  if (!programme.allowedInstruments?.length) {
    errors.push({ field: "allowedInstruments", message: "Select at least one allowed instrument." });
  }
  if (programme.ticketMin == null || programme.ticketMax == null) {
    errors.push({ field: "ticket", message: "Both ticket minimum and maximum are required." });
  } else if (Number(programme.ticketMin) > Number(programme.ticketMax)) {
    errors.push({ field: "ticket", message: "Ticket minimum cannot exceed maximum." });
  }
  if (programme.ticketMin != null && Number(programme.ticketMin) <= 0) {
    errors.push({ field: "ticketMin", message: "Ticket minimum must be greater than zero." });
  }
  return { ok: errors.length === 0, errors };
};

export const validateOpportunity = (opportunity) => {
  const errors = [];
  if (!opportunity.name?.trim()) errors.push({ field: "name", message: "Opportunity name is required." });
  if (!opportunity.purpose?.trim()) errors.push({ field: "purpose", message: "Purpose is required." });
  if (!opportunity.instrumentId) errors.push({ field: "instrumentId", message: "Primary instrument is required." });
  if (!opportunity.deadline) errors.push({ field: "deadline", message: "Deadline is required." });
  if (opportunity.liveFrom && opportunity.liveTo && opportunity.liveFrom > opportunity.liveTo) {
    errors.push({ field: "liveTo", message: "Live-to date must be after live-from." });
  }
  return { ok: errors.length === 0, errors };
};