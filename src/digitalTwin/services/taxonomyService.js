/**
 * digitalTwin/services/taxonomyService.js
 *
 * Canonical taxonomy service — the single source of truth for all terms
 * (Section 5, Section 5.3E, Section 13.7).
 *
 * Responsibilities:
 *   - Load sector packs at runtime
 *   - Resolve aliases and search terms to canonical IDs
 *   - Return valid next-level options for a given context
 *   - Apply applicability rules (recommended / compatible / excluded)
 *   - Manage tenant-scoped aliases and taxonomy requests
 *
 * The service never mutates a canonical term in place — new versions are
 * published, and existing records keep their historical taxonomy_version.
 */

import { db } from "../../firebaseConfig";
import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, query,
  where, orderBy, limit, serverTimestamp,
} from "firebase/firestore";
import { MINING_PACK_VERSION, MINING_SECTOR, MINING_VALUE_CHAIN, MINING_CONTEXT_RULES, MINING_KPI_PACKS, MINING_COMMODITIES, MINING_METHODS } from "../taxonomy/miningPack";
import { INDUSTRIAL_SUPPORT_PACK_VERSION, SUPPORT_SECTOR, SUPPORT_SERVICES, NON_ASSET_RESOURCES, SUPPORT_KPI_PACKS } from "../taxonomy/industrialSupportPack";
import { APPLICABILITY_DECISION } from "../models/enums";

// ── In-memory pack registry (loaded once per session) ─────────────────────
const PACKS = {
  mining: {
    version: MINING_PACK_VERSION,
    sector: MINING_SECTOR,
    valueChain: MINING_VALUE_CHAIN,
    contextRules: MINING_CONTEXT_RULES,
    kpiPacks: MINING_KPI_PACKS,
    commodities: MINING_COMMODITIES,
    methods: MINING_METHODS,
    nonAssetResources: [],
  },
  industrial_support: {
    version: INDUSTRIAL_SUPPORT_PACK_VERSION,
    sector: SUPPORT_SECTOR,
    services: SUPPORT_SERVICES,
    kpiPacks: SUPPORT_KPI_PACKS,
    nonAssetResources: NON_ASSET_RESOURCES,
  },
};

// ── Global alias index built from all packs ───────────────────────────────
const ALIAS_INDEX = (() => {
  const idx = new Map();
  const add = (alias, canonicalId) => {
    const key = alias.toLowerCase().trim();
    if (!key) return;
    if (!idx.has(key)) idx.set(key, []);
    idx.get(key).push(canonicalId);
  };

  Object.values(PACKS).forEach((pack) => {
    if (pack.valueChain) {
      pack.valueChain.forEach((vc) => {
        add(vc.code, vc.id);
        add(vc.name, vc.id);
        (vc.services || []).forEach((svc) => {
          add(svc.code, svc.id);
          add(svc.name, svc.id);
          (svc.activities || []).forEach((act) => {
            add(act.code, act.id);
            add(act.name, act.id);
          });
        });
        (vc.equipmentFamilies || []).forEach((fam) => {
          add(fam.code, fam.id);
          add(fam.name, fam.id);
          (fam.types || []).forEach((t) => {
            add(t.code, t.id);
            add(t.name, t.id);
            (t.examples || []).forEach((ex) => add(ex, t.id));
          });
        });
      });
    }
    if (pack.services) {
      pack.services.forEach((svc) => {
        add(svc.code, svc.id);
        add(svc.name, svc.id);
        (svc.activities || []).forEach((act) => {
          add(act.code, act.id);
          add(act.name, act.id);
        });
      });
    }
    if (pack.commodities) pack.commodities.forEach((c) => { add(c.code, c.id); add(c.name, c.id); });
    if (pack.methods)     pack.methods.forEach((m) => { add(m.code, m.id); add(m.name, m.id); });
    if (pack.nonAssetResources) pack.nonAssetResources.forEach((r) => { add(r.code, r.id); add(r.name, r.id); });
  });

  return idx;
})();

// ── Fast lookup index ─────────────────────────────────────────────────────
const buildTermIndex = () => {
  const index = new Map();
  Object.values(PACKS).forEach((pack) => {
    if (pack.valueChain) {
      pack.valueChain.forEach((vc) => {
        index.set(vc.id, { ...vc, kind: "value_chain" });
        (vc.services || []).forEach((svc) => index.set(svc.id, { ...svc, kind: "service", parentId: vc.id }));
        (vc.equipmentFamilies || []).forEach((fam) => {
          index.set(fam.id, { ...fam, kind: "equipment_family", parentId: vc.id });
          (fam.types || []).forEach((t) => index.set(t.id, { ...t, kind: "equipment_type", parentId: fam.id }));
        });
      });
    }
    if (pack.services) {
      pack.services.forEach((svc) => index.set(svc.id, { ...svc, kind: "service" }));
    }
    if (pack.commodities) pack.commodities.forEach((c) => index.set(c.id, { ...c, kind: "commodity" }));
    if (pack.methods)     pack.methods.forEach((m) => index.set(m.id, { ...m, kind: "method" }));
    if (pack.nonAssetResources) pack.nonAssetResources.forEach((r) => index.set(r.id, { ...r, kind: "non_asset_resource" }));
  });
  return index;
};

const TERM_INDEX = buildTermIndex();

// ── Public API ────────────────────────────────────────────────────────────

/** List all available sector packs. */
export const listPacks = () =>
  Object.entries(PACKS).map(([key, p]) => ({ key, version: p.version, sector: p.sector }));

/** Fetch a pack by key. */
export const getPack = (key) => PACKS[key] || null;

/** Fetch a canonical term by ID (across all packs). */
export const getTerm = (termId) => TERM_INDEX.get(termId) || null;

/** Breadcrumb for a term — parent chain from root pack. */
export const getBreadcrumb = (termId) => {
  const parts = [];
  let cur = TERM_INDEX.get(termId);
  while (cur) {
    parts.unshift(cur.name);
    cur = cur.parentId ? TERM_INDEX.get(cur.parentId) : null;
  }
  return parts.join(" > ");
};

/**
 * Resolve a free-text query to ranked canonical paths (Section 13.7).
 * Returns up to `limit` matches, each with confidence and decision.
 */
export const resolve = (rawQuery, { context = {}, limit: maxResults = 8 } = {}) => {
  const q = String(rawQuery || "").toLowerCase().trim();
  if (q.length < 2) return [];

  // Direct alias hit
  const directHits = (ALIAS_INDEX.get(q) || [])
    .map((id) => TERM_INDEX.get(id))
    .filter(Boolean);

  // Fuzzy contains hits
  const fuzzy = [];
  TERM_INDEX.forEach((term) => {
    if (directHits.some((d) => d.id === term.id)) return;
    const n = (term.name || "").toLowerCase();
    const c = (term.code || "").toLowerCase();
    if (n.includes(q) || c.includes(q)) fuzzy.push(term);
  });

  const scored = [
    ...directHits.map((t) => ({ term: t, score: 100, decision: APPLICABILITY_DECISION.RECOMMENDED })),
    ...fuzzy.map((t) => ({ term: t, score: 50, decision: APPLICABILITY_DECISION.COMPATIBLE })),
  ].slice(0, maxResults);

  return scored.map((s) => ({
    id: s.term.id,
    name: s.term.name,
    breadcrumb: getBreadcrumb(s.term.id),
    kind: s.term.kind,
    decision: s.decision,
    confidence: s.score >= 100 ? "high" : "medium",
  }));
};

/**
 * Return valid next-level options for a selector, filtered by context.
 * This is what powers the cascading selector (Section 5.3A).
 *
 * domain: "value_chain" | "service" | "activity" | "equipment_family" |
 *         "equipment_type" | "commodity" | "method" | "non_asset_resource"
 */
export const optionsFor = ({ packKey, domain, parentId = null, context = {} } = {}) => {
  const pack = PACKS[packKey];
  if (!pack) return [];

  if (domain === "value_chain" && pack.valueChain) {
    return pack.valueChain.map((vc) => ({
      id: vc.id, name: vc.name, code: vc.code,
      decision: APPLICABILITY_DECISION.RECOMMENDED,
    }));
  }

  if (domain === "service") {
    if (pack.valueChain && parentId) {
      const vc = pack.valueChain.find((v) => v.id === parentId);
      if (vc) return (vc.services || []).map((s) => ({ id: s.id, name: s.name, code: s.code, decision: APPLICABILITY_DECISION.RECOMMENDED }));
    }
    if (pack.services) return pack.services.map((s) => ({ id: s.id, name: s.name, code: s.code, decision: APPLICABILITY_DECISION.RECOMMENDED }));
  }

  if (domain === "activity" && pack.valueChain && parentId) {
    for (const vc of pack.valueChain) {
      const svc = (vc.services || []).find((s) => s.id === parentId);
      if (svc) return (svc.activities || []).map((a) => ({ id: a.id, name: a.name, code: a.code, decision: APPLICABILITY_DECISION.RECOMMENDED }));
    }
  }

  if (domain === "equipment_family") {
    if (pack.valueChain) {
      const vc = pack.valueChain.find((v) => v.id === parentId);
      if (vc) return (vc.equipmentFamilies || []).map((f) => ({ id: f.id, name: f.name, code: f.code, decision: APPLICABILITY_DECISION.RECOMMENDED }));
      // No parent — return all families across the pack
      const all = [];
      pack.valueChain.forEach((v) => (v.equipmentFamilies || []).forEach((f) => all.push({ id: f.id, name: f.name, code: f.code, decision: APPLICABILITY_DECISION.RECOMMENDED })));
      return all;
    }
  }

  if (domain === "equipment_type" && pack.valueChain && parentId) {
    for (const vc of pack.valueChain) {
      const fam = (vc.equipmentFamilies || []).find((f) => f.id === parentId);
      if (fam) return (fam.types || []).map((t) => ({ id: t.id, name: t.name, code: t.code, decision: APPLICABILITY_DECISION.RECOMMENDED }));
    }
  }

  if (domain === "commodity") return (pack.commodities || []).map((c) => ({ id: c.id, name: c.name, code: c.code }));
  if (domain === "method")    return (pack.methods || []).map((m) => ({ id: m.id, name: m.name, code: m.code }));
  if (domain === "non_asset_resource") return (pack.nonAssetResources || []).map((r) => ({ id: r.id, name: r.name, code: r.code }));

  return [];
};

/**
 * Apply context rules and return recommended/conditional/excluded decisions
 * for a candidate term (Section 5.3A "Label options as Recommended/…").
 */
export const applicabilityFor = (termId, context = {}) => {
  const rules = MINING_CONTEXT_RULES.filter((r) => {
    if (context.environment && r.when.environment && r.when.environment !== context.environment) return false;
    if (context.valueChain && r.when.valueChain && r.when.valueChain !== context.valueChain) return false;
    return true;
  });

  for (const rule of rules) {
    if (rule.recommend.equipmentFamilies?.includes(termId)) {
      return { decision: APPLICABILITY_DECISION.RECOMMENDED, reason: rule.id };
    }
    if (rule.recommend.kpiPack && termId.startsWith("kpi.")) {
      return { decision: APPLICABILITY_DECISION.COMPATIBLE, reason: rule.id };
    }
  }
  return { decision: APPLICABILITY_DECISION.COMPATIBLE, reason: null };
};

/**
 * Get the KPI pack recommended for a given context.
 */
export const kpiPackFor = ({ packKey, context = {} } = {}) => {
  const pack = PACKS[packKey];
  if (!pack) return [];
  if (context.valueChain === "load_and_haul" && context.environment === "surface") {
    return pack.kpiPacks.load_and_haul_v1 || [];
  }
  if (context.valueChain === "load_and_haul" && context.environment === "underground") {
    return pack.kpiPacks.ug_load_and_haul_v1 || [];
  }
  if (context.valueChain === "beneficiation_and_recovery") {
    return pack.kpiPacks.wash_plant_v1 || [];
  }
  // Fallback: return the first pack
  const firstKey = Object.keys(pack.kpiPacks)[0];
  return firstKey ? pack.kpiPacks[firstKey] : [];
};

// ── Tenant taxonomy requests (Section 5.5 governance workflow) ────────────

/**
 * Submit a taxonomy change request — user searched, no match, proposes a term.
 * Stored under tenants/{tenantId}/taxonomyRequests/{requestId} with status "submitted".
 */
export const submitTaxonomyRequest = async (tenantId, { proposedLabel, parentId = null, description, useCase, evidenceUrls = [] }) => {
  if (!tenantId || !proposedLabel) throw new Error("tenantId and proposedLabel are required");
  const requestsRef = collection(db, "digitalTwinTenants", tenantId, "taxonomyRequests");
  const docRef = await addDoc(requestsRef, {
    proposedLabel: proposedLabel.trim(),
    parentId,
    description: description || "",
    useCase: useCase || "",
    evidenceUrls,
    status: "submitted",
    submittedAt: serverTimestamp(),
    resolvedAt: null,
    resolvedTermId: null,
    stewardNote: "",
  });
  return { id: docRef.id, status: "submitted" };
};

/**
 * Fetch all taxonomy requests for a tenant.
 */
export const listTaxonomyRequests = async (tenantId, { status = null } = {}) => {
  if (!tenantId) return [];
  const requestsRef = collection(db, "digitalTwinTenants", tenantId, "taxonomyRequests");
  const q = status
    ? query(requestsRef, where("status", "==", status), orderBy("submittedAt", "desc"), limit(200))
    : query(requestsRef, orderBy("submittedAt", "desc"), limit(200));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export default {
  listPacks,
  getPack,
  getTerm,
  getBreadcrumb,
  resolve,
  optionsFor,
  applicabilityFor,
  kpiPackFor,
  submitTaxonomyRequest,
  listTaxonomyRequests,
};