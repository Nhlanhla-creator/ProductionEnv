// src/utils/roleRoutes.js
// Single source of truth for "where does this logged-in user belong?"
//
// Strategy, in order:
//   1. The portal they were actually last in (recorded by PortalMemory).
//      This is trusted on its own: ProtectedRoute already admitted them
//      there, which is better evidence than string-matching a role field.
//   2. Their highest-priority role, if we have no memory.
//   3. SME dashboard as a last resort.

export const PUBLIC_HOME = "/";

const LAST_PORTAL_KEY = "big:lastPortalRole";

// Flip to true to log portal detection in the console while debugging.
const DEBUG_PORTAL = false;

// Canonical role key -> the route the user returns to from the public site
export const DASHBOARD_ROUTES = {
  admin: "/admin/dashboard",
  associator: "/associator-dashboard",
  cmf: "/cmf-profile",
  investor: "/investor-profile",
  catalyst: "/support-profile",
  programsponsor: "/program-sponsor-profile",
  advisor: "/advisor-dashboard",
  intern: "/intern-dashboard",
  sme: "/dashboard",
};

// Fallback only — used when we have no memory of the last portal.
const ROLE_PRIORITY = [
  "admin",
  "associator",
  "cmf",
  "investor",
  "catalyst",
  "programsponsor",
  "advisor",
  "intern",
  "sme",
];

// Every portal uses the same wording on the "go back" button.
const DEFAULT_PORTAL_LABEL = "My Dashboard";

// Every spelling your Firestore docs might contain -> canonical key.
const ROLE_ALIASES = {
  admin: "admin",
  administrator: "admin",
  superadmin: "admin",

  sme: "sme",
  smes: "sme",
  smse: "sme",
  smses: "sme",
  business: "sme",
  businesses: "sme",
  npo: "sme",
  npos: "sme",
  corporate: "sme",
  corporates: "sme",

  investor: "investor",
  investors: "investor",
  funder: "investor",
  funders: "investor",

  catalyst: "catalyst",
  catalysts: "catalyst",
  support: "catalyst",
  supportprogram: "catalyst",
  supportprograms: "catalyst",
  accelerator: "catalyst",
  accelerators: "catalyst",
  incubator: "catalyst",
  incubators: "catalyst",
  esd: "catalyst",

  advisor: "advisor",
  advisors: "advisor",
  adviser: "advisor",
  advisers: "advisor",
  mentor: "advisor",
  mentors: "advisor",
  boardmember: "advisor",
  boardmembers: "advisor",

  intern: "intern",
  interns: "intern",
  graduate: "intern",
  graduates: "intern",
  student: "intern",
  students: "intern",

  programsponsor: "programsponsor",
  programsponsors: "programsponsor",
  programmesponsor: "programsponsor",
  programmesponsors: "programsponsor",
  sponsor: "programsponsor",
  sponsors: "programsponsor",

  associator: "associator",
  associators: "associator",
  association: "associator",
  associations: "associator",
  memberorganisation: "associator",
  memberorganisations: "associator",
  memberorganization: "associator",

  cmf: "cmf",
  cmfs: "cmf",
  capitalmarketfacilitator: "cmf",
  capitalmarketfacilitators: "cmf",
  capitalandmarketfacilitator: "cmf",
  capitalandmarketfacilitators: "cmf",
  capitalmarketsfacilitator: "cmf",
  marketfacilitator: "cmf",
  facilitator: "cmf",
  facilitators: "cmf",
};

const normalise = (value) =>
  String(value || "").toLowerCase().replace(/[^a-z]/g, "");

export const normaliseRoles = (userRoles = []) =>
  (Array.isArray(userRoles) ? userRoles : [userRoles])
    .map((r) => ROLE_ALIASES[normalise(r)])
    .filter(Boolean);

export const getPrimaryRole = (userRoles = []) => {
  const roles = normaliseRoles(userRoles);
  return ROLE_PRIORITY.find((key) => roles.includes(key)) || null;
};

// ─── Portal detection ────────────────────────────────────────────────────────

// SME routes that LOOK like they belong to another portal. Checked first so
// e.g. /intern-matches-page (an SME page) isn't mistaken for the intern portal.
const SME_EXCEPTIONS = new Set([
  "/intern-matches-page",
  "/intern-dealflow-page",
  "/intern-insights-page",
  "/intern-table-page",
  "/support-program-matches",
  "/find-advisors",
]);

// Order matters: first match wins.
const PORTAL_TESTS = [
  { role: "admin", test: (p) => p.startsWith("/admin") },
  { role: "associator", test: (p) => p.startsWith("/associator") },
  { role: "cmf", test: (p) => p.startsWith("/cmf") },
  { role: "programsponsor", test: (p) => p.startsWith("/program-sponsor") },
  { role: "advisor", test: (p) => p.startsWith("/advisor") },
  { role: "intern", test: (p) => p.startsWith("/intern") },
  {
    role: "investor",
    test: (p) =>
      p.startsWith("/investor") ||
      p === "/my-investments" ||
      p === "/my-cohorts",
  },
  {
    // Catalyst pages span two prefixes: /support-* and /catalyst/*
    role: "catalyst",
    test: (p) => p.startsWith("/support") || p.startsWith("/catalyst"),
  },
  {
    role: "sme",
    test: (p) =>
      p === "/dashboard" ||
      p === "/insights" ||
      p === "/messages" ||
      p === "/calendar" ||
      p === "/settings" ||
      p === "/my-documents" ||
      p === "/documents" ||
      p === "/customer-matches" ||
      p === "/supplier-matches" ||
      p === "/funding-matches" ||
      p === "/opportunity-matches" ||
      p === "/find-matches" ||
      p === "/overall-company-health" ||
      p === "/governance-calendar" ||
      p === "/raps-actions" ||
      p === "/raps-overview" ||
      p === "/Strategy" ||
      p === "/FinancialPerformance" ||
      p === "/OperationalStrength" ||
      p === "/People" ||
      p === "/SocialImpact" ||
      p === "/MarketingSales" ||
      p.startsWith("/profile") ||
      p.startsWith("/applications") ||
      p.startsWith("/billing") ||
      p.startsWith("/growth"),
  },
];

/**
 * Which portal does this pathname belong to? null for public pages.
 */
export const detectPortalRole = (pathname = "") => {
  if (!pathname) return null;
  if (SME_EXCEPTIONS.has(pathname)) return "sme";
  const hit = PORTAL_TESTS.find((entry) => entry.test(pathname));
  return hit ? hit.role : null;
};

/**
 * Remember the portal the user is currently in.
 */
export const rememberPortal = (pathname) => {
  const role = detectPortalRole(pathname);

  if (DEBUG_PORTAL) {
    console.log("[portal] path:", pathname, "-> detected:", role);
  }

  if (!role) return;
  try {
    sessionStorage.setItem(LAST_PORTAL_KEY, role);
  } catch {
    /* storage unavailable — fall back to role priority */
  }
};

/**
 * The portal the user was last in.
 *
 * This is trusted whether or not the role field confirms it. The user reached
 * that portal through ProtectedRoute, so the visit itself is the evidence —
 * and role strings in Firestore vary too much to be a reliable gatekeeper
 * here. Access control stays with ProtectedRoute, where it belongs; this
 * function only decides which link to show.
 */
export const getRememberedPortal = (userRoles = []) => {
  try {
    const stored = sessionStorage.getItem(LAST_PORTAL_KEY);
    if (!stored || !DASHBOARD_ROUTES[stored]) return null;

    if (DEBUG_PORTAL) {
      console.log(
        "[portal] stored:",
        stored,
        "| held roles:",
        normaliseRoles(userRoles),
        "| raw:",
        userRoles
      );
    }
    return stored;
  } catch {
    return null;
  }
};

export const clearRememberedPortal = () => {
  try {
    sessionStorage.removeItem(LAST_PORTAL_KEY);
  } catch {
    /* no-op */
  }
};

// ─── Public API used by Header ───────────────────────────────────────────────

/**
 * The route a logged-in user should return to.
 */
export const getDashboardRoute = (userRoles = []) => {
  const role = getRememberedPortal(userRoles) || getPrimaryRole(userRoles);
  return (role && DASHBOARD_ROUTES[role]) || "/dashboard";
};

/**
 * Label for the "back to dashboard" button. Same wording for every portal.
 */
export const getPortalLabel = () => DEFAULT_PORTAL_LABEL;