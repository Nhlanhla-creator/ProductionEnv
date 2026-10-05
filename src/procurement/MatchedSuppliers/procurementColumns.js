"use client"

/**
 * ════════════════════════════════════════════════════════════════════════════
 * procurementColumns.js
 *
 * Approved column definitions and metadata for the BIG Prism Procurement
 * Matched Suppliers Grid, complying with the Core Developer Brief.
 * ════════════════════════════════════════════════════════════════════════════
 */

export const PROCUREMENT_COLUMN_DEFS = {
  offeringCategory: {
    label: "Offering Category",
    width: 170,
    filterType: "category",
    visible: true,
    priority: 1,
    sortable: true,
    tooltip: "Primary product or service category declared in supplier universal profile.",
  },
  location: {
    label: "Location & Site",
    width: 140,
    filterType: "location",
    visible: true,
    priority: 2,
    sortable: true,
    tooltip: "Operating site and geographic delivery capabilities.",
  },
  matchReason: {
    label: "Match Reason",
    width: 160,
    filterType: "matchReason",
    visible: true,
    priority: 1,
    sortable: false,
    tooltip: "Click to inspect explainable AI reasoning and criteria breakdown.",
  },
  bbbeeLevel: {
    label: "B-BBEE Level",
    width: 120,
    filterType: "bbbeeLevel",
    visible: true,
    priority: 2,
    sortable: true,
    tooltip: "Verified South African Broad-Based Black Economic Empowerment compliance level.",
  },
  bigScore: {
    label: "BIG Score",
    align: "center",
    width: 120,
    filterType: "bigScore",
    visible: true,
    priority: 1,
    sortable: true,
    tooltip: "Platform readiness BIG Score (0–100) assessing compliance, financial, and operational health.",
  },
  verifiedCoverage: {
    label: "Verification",
    align: "center",
    width: 130,
    filterType: "verification",
    visible: true,
    priority: 2,
    sortable: true,
    tooltip: "Verified statutory documentation coverage and clearance percentage.",
  },
  passportStatus: {
    label: "Passport Status",
    width: 140,
    filterType: "passport",
    visible: true,
    priority: 1,
    sortable: true,
    tooltip: "Prism Universal Passport status: Active, In Review, or Gap Identified.",
  },
  requirementFit: {
    label: "Requirement Fit",
    align: "center",
    width: 140,
    filterType: "match",
    visible: true,
    priority: 1,
    sortable: true,
    tooltip: "Algorithmic alignment with buyer demand context, criteria weights, and AI semantic match.",
  },
  criticalGaps: {
    label: "Critical Gaps",
    width: 160,
    filterType: "gaps",
    visible: true,
    priority: 2,
    sortable: false,
    tooltip: "Pre-onboarding gates or missing statutory compliance items.",
  },
  capacity: {
    label: "Capacity & Lead Time",
    width: 160,
    filterType: "capacity",
    visible: false,
    priority: 3,
    sortable: true,
    tooltip: "Production volume capacity and standard delivery lead times.",
  },
  ownershipProfile: {
    label: "Ownership Demographics",
    width: 170,
    filterType: "ownership",
    visible: false,
    priority: 3,
    sortable: false,
    tooltip: "Shareholding distribution: Black, Women, Youth, and Disability ownership.",
  },
  lastUpdated: {
    label: "Last Updated",
    width: 130,
    filterType: "date",
    visible: false,
    priority: 4,
    sortable: true,
    tooltip: "Timestamp of last verified update to supplier profile.",
  },
}

export const DEFAULT_PROCUREMENT_COLUMN_ORDER = Object.keys(PROCUREMENT_COLUMN_DEFS)

export const DEFAULT_PROCUREMENT_VISIBILITY = Object.fromEntries(
  DEFAULT_PROCUREMENT_COLUMN_ORDER.map((k) => [k, PROCUREMENT_COLUMN_DEFS[k].visible !== false])
)

export const DEFAULT_PROCUREMENT_WIDTHS = Object.fromEntries(
  DEFAULT_PROCUREMENT_COLUMN_ORDER.map((k) => [k, PROCUREMENT_COLUMN_DEFS[k].width])
)

export const DEFAULT_PROCUREMENT_PINNED = Object.fromEntries(
  DEFAULT_PROCUREMENT_COLUMN_ORDER.map((k) => [k, null])
)

export const SUPPLIER_KEY = "__supplier__"
export const ACTION_KEY = "__action__"
export const FIXED_WIDTHS = { [SUPPLIER_KEY]: 220, [ACTION_KEY]: 160 }
export const MIN_COLUMN_WIDTH = 84
