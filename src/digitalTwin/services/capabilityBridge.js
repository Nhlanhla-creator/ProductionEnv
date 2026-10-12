/**
 * digitalTwin/services/capabilityBridge.js
 *
 * The capability ↔ operational twin bridge (Brief Section 9.5).
 *
 * Two distinct journeys that share canonical taxonomy IDs but never share
 * records:
 *   - CAPABILITY profile: what the SME can offer (products-services.js)
 *   - OPERATIONAL twin:   what is actually being delivered, where, with
 *                         which resources
 *
 * This service:
 *   1. Drafts a twin structure from a selected capability offering
 *   2. Converts it on confirmation (creates nodes + relations + groups)
 *   3. Runs the reverse: given a twin, produce a capability summary
 *
 * Nothing here writes capability records — those stay owned by the profile
 * module. Conversion only reads from capabilities and writes to the twin.
 */

import { db, auth } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { createNode, createRelation, getNode } from "./hierarchyService";
import { createGroup } from "./resourceService";
import { NODE_TYPES, RELATION_TYPES } from "../models/enums";

const today = () => new Date().toISOString().split("T")[0];
const nowIso = () => new Date().toISOString();
const actor = () => {
  const u = auth.currentUser;
  return u ? { uid: u.uid, email: u.email } : { uid: "system", email: null };
};

// ── Draft generation ──────────────────────────────────────────────────────

/**
 * Build a draft twin structure from an offering + delivery context.
 * The wizard renders this draft for the user to confirm or edit before
 * anything is created.
 */
export const draftTwinFromCapability = async ({
  tenantId,
  offering,
  deliveryContext = {},
  sectorPackKey = "mining",
}) => {
  if (!offering) throw new Error("offering is required");
  if (!deliveryContext.siteName && !deliveryContext.contractName) {
    throw new Error("Provide a site or contract name for the delivery context.");
  }

  const company = await readCompanySummary(tenantId)

  const draft = {
    draftId: `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    offeringId: offering.id,
    offeringName: offering.name,
    sectorPackKey,
    company: {
      name: company?.displayName || company?.legalName || "Your business",
      existingNodeId: company?.companyNodeId || null,
    },
    site: deliveryContext.siteName ? {
      name: deliveryContext.siteName,
      environment: deliveryContext.environment || "surface",
      commodity: deliveryContext.commodity || offering.industries?.[0] || null,
      productionMethod: deliveryContext.productionMethod || null,
    } : null,
    contract: deliveryContext.contractName ? {
      name: deliveryContext.contractName,
      client: deliveryContext.client || null,
      scopeSummary: offering.description || "",
    } : null,
    service: {
      name: offering.name,
      code: offering.taxonomyLeafId || offering.customCategoryRequest || null,
      taxonomyLeafId: offering.taxonomyLeafId || null,
      activities: inferActivities(offering),
    },
    equipmentGroups: inferEquipmentGroups(offering, deliveryContext),
    complianceHints: inferComplianceHints(offering),
    notes: [
      offering.description ? `From capability: ${offering.description.slice(0, 180)}` : null,
      offering.deliveryRole?.length ? `Delivery role: ${offering.deliveryRole.join(", ")}` : null,
      offering.geographicCoverage?.length ? `Geography: ${offering.geographicCoverage.join(", ")}` : null,
    ].filter(Boolean),
    createdAt: nowIso(),
    createdBy: actor(),
  };

  return draft;
};

const readCompanySummary = async (tenantId) => {
  try {
    const snap = await getDoc(doc(db, "digitalTwinTenants", tenantId));
    if (!snap.exists()) return null;
    const data = snap.data();
    return { displayName: data.displayName, legalName: data.legalName, companyNodeId: data.companyNodeId || null };
  } catch { return null; }
};

const inferActivities = (offering) => {
  // Derive plausible activities from the offering's delivery role and
  // taxonomy. In the twin, activities are Level 2 detail — a Level 1
  // service can have one or many. Default to one clear activity named after
  // the offering unless the offering has explicit delivery role hints.
  const roles = offering.deliveryRole || [];
  const activities = [];
  if (roles.includes("Supply and install")) activities.push("Supply and install");
  if (roles.includes("Mobile field-service team")) activities.push("Field service visit");
  if (roles.includes("Fixed workshop or repair centre")) activities.push("Workshop execution");
  if (roles.includes("Project-based workforce")) activities.push("Project execution");
  if (roles.includes("Managed or outsourced service")) activities.push("Managed delivery");
  if (roles.includes("Equipment-enabled service")) activities.push("Equipment-enabled delivery");
  if (activities.length === 0) activities.push(offering.name);
  return activities;
};

const inferEquipmentGroups = (offering, deliveryContext) => {
  // If the offering is asset-based (equipment hire, mobile field service,
  // etc.) propose an initial group. Otherwise return an empty list — a
  // non-asset capability correctly produces no dummy equipment.
  const roles = offering.deliveryRole || [];
  const assetBasedRoles = ["Hire or lease", "Supply and install", "Equipment-enabled service", "Mobile field-service team"];
  const isAssetBased = roles.some((r) => assetBasedRoles.includes(r));
  if (!isAssetBased) return [];
  return [{
    name: `${offering.name} — initial fleet`,
    groupType: "fleet",
    equipmentTypeId: null,   // user confirms in wizard
    nominalCapacity: null,
    capacityUnit: "tonnes",
  }];
};

const inferComplianceHints = (offering) => {
  // Simple heuristics — real list would come from the sector pack once the
  // service/activity is confirmed. Here we surface only obvious flags.
  const hints = [];
  const text = `${offering.name || ""} ${offering.description || ""}`.toLowerCase();
  if (text.includes("medical") || text.includes("health")) hints.push("Professional registration (HPCSA)");
  if (text.includes("security")) hints.push("PSIRA accreditation");
  if (text.includes("electrical")) hints.push("Wireman's licence / master installation electrician");
  if (text.includes("lifting") || text.includes("crane")) hints.push("Lifting equipment certification");
  return hints;
};

// ── Conversion (create on confirmation) ───────────────────────────────────

/**
 * Create the twin nodes and relations from a confirmed draft.
 * Idempotent to a degree — if the site/contract already exists (name match),
 * it reuses the existing node instead of creating a duplicate.
 */
export const createTwinFromDraft = async (tenantId, draft, { confirmedEdits = {} } = {}) => {
  if (!tenantId) throw new Error("tenantId is required");
  if (!draft) throw new Error("draft is required");

  const edited = mergeDraft(draft, confirmedEdits);
  const created = { nodes: {}, relations: [], groups: [] };

  // 1. Company — reuse if the tenant already has one
  let company = edited.company.existingNodeId
    ? await getNode(tenantId, edited.company.existingNodeId)
    : null;

  if (!company) {
    const existingCompanies = await findNodeByName(tenantId, NODE_TYPES.COMPANY, edited.company.name);
    if (existingCompanies) company = existingCompanies;
  }

  if (!company) {
    company = await createNode(tenantId, {
      nodeType: NODE_TYPES.COMPANY,
      name: edited.company.name,
      attributes: { sourceOfferingId: draft.offeringId },
    });
  }
  created.nodes.company = company.id;

  // 2. Site (optional in the draft, but usually needed)
  if (edited.site?.name) {
    const existing = await findNodeByName(tenantId, NODE_TYPES.SITE, edited.site.name);
    const site = existing || await createNode(tenantId, {
      nodeType: NODE_TYPES.SITE,
      name: edited.site.name,
      attributes: {
        environment: edited.site.environment,
        commodity: edited.site.commodity,
        method: edited.site.productionMethod,
      },
    });
    created.nodes.site = site.id;

    if (!existing) {
      const rel = await createRelation(tenantId, {
        fromId: company.id,
        toId: site.id,
        relationType: RELATION_TYPES.CONTAINS,
        isPrimary: true,
      });
      created.relations.push(rel.id);
    }
  }

  // 3. Contract (separate from site — Brief Section 4.2 #2)
  if (edited.contract?.name) {
    const existing = await findNodeByName(tenantId, NODE_TYPES.CONTRACT, edited.contract.name);
    const contract = existing || await createNode(tenantId, {
      nodeType: NODE_TYPES.CONTRACT,
      name: edited.contract.name,
      attributes: {
        client: edited.contract.client,
        scopeSummary: edited.contract.scopeSummary,
        sourceOfferingId: draft.offeringId,
      },
    });
    created.nodes.contract = contract.id;

    if (!existing) {
      await createRelation(tenantId, {
        fromId: company.id, toId: contract.id,
        relationType: RELATION_TYPES.SCOPES, isPrimary: false,
      });
      if (created.nodes.site) {
        await createRelation(tenantId, {
          fromId: contract.id, toId: created.nodes.site,
          relationType: RELATION_TYPES.DELIVERED_AT, isPrimary: true,
        });
      }
    }
  }

  // 4. Service
  if (edited.service?.name) {
    const service = await createNode(tenantId, {
      nodeType: NODE_TYPES.SERVICE,
      name: edited.service.name,
      code: edited.service.code || null,
      attributes: { taxonomyId: edited.service.taxonomyLeafId, sourceOfferingId: draft.offeringId },
    });
    created.nodes.service = service.id;

    const serviceParent = created.nodes.contract || created.nodes.site;
    if (serviceParent) {
      await createRelation(tenantId, {
        fromId: serviceParent, toId: service.id,
        relationType: RELATION_TYPES.SCOPES, isPrimary: true,
      });
    }
  }

  // 5. Activities
  created.nodes.activities = [];
  for (const actName of edited.service?.activities || []) {
    const act = await createNode(tenantId, {
      nodeType: NODE_TYPES.ACTIVITY,
      name: actName,
      attributes: { sourceOfferingId: draft.offeringId },
    });
    created.nodes.activities.push(act.id);
    if (created.nodes.service) {
      await createRelation(tenantId, {
        fromId: created.nodes.service, toId: act.id,
        relationType: RELATION_TYPES.REALIZED_BY, isPrimary: true,
      });
    }
  }

  // 6. Equipment groups (only for asset-based capabilities)
  for (const g of edited.equipmentGroups || []) {
    const group = await createGroup(tenantId, {
      name: g.name,
      groupType: g.groupType || "fleet",
      equipmentTypeId: g.equipmentTypeId || null,
      nominalCapacity: g.nominalCapacity || null,
      capacityUnit: g.capacityUnit || "tonnes",
    });
    created.groups.push(group.id);

    // Wire the group to the primary activity if one exists
    if (created.nodes.activities[0]) {
      await createRelation(tenantId, {
        fromId: group.id, toId: created.nodes.activities[0],
        relationType: RELATION_TYPES.SUPPORTS, isPrimary: true,
      });
    }
  }

  return {
    ok: true,
    created,
    summary: {
      nodesCreated: Object.values(created.nodes).flat().filter(Boolean).length,
      relationsCreated: created.relations.length,
      groupsCreated: created.groups.length,
    },
  };
};

const mergeDraft = (draft, edits) => ({
  ...draft,
  ...edits,
  company: { ...draft.company, ...(edits.company || {}) },
  site: draft.site ? { ...draft.site, ...(edits.site || {}) } : (edits.site || null),
  contract: draft.contract ? { ...draft.contract, ...(edits.contract || {}) } : (edits.contract || null),
  service: { ...draft.service, ...(edits.service || {}) },
  equipmentGroups: edits.equipmentGroups !== undefined ? edits.equipmentGroups : draft.equipmentGroups,
});

const findNodeByName = async (tenantId, nodeType, name) => {
  const { listNodes } = await import("./hierarchyService");
  const rows = await listNodes(tenantId, { nodeType, status: "active" });
  const normalized = String(name).trim().toLowerCase();
  return rows.find((r) => String(r.name).trim().toLowerCase() === normalized) || null;
};

// ── Reverse direction — twin to capability summary ───────────────────────

/**
 * Build a capability summary from an operational twin. Used when a
 * capability profile needs to reflect what is being delivered right now
 * (e.g. an offering's "in production" badge, or a Passport readiness view).
 *
 * The summary is read-only — it does not write back to the capability
 * profile. The profile module decides whether to persist it.
 */
export const summariseTwinAsCapability = async (tenantId, {
  serviceId = null,
  contractId = null,
} = {}) => {
  const { listNodes, listRelations } = await import("./hierarchyService");

  const services = serviceId
    ? [await getNode(tenantId, serviceId)].filter(Boolean)
    : await listNodes(tenantId, { nodeType: NODE_TYPES.SERVICE });

  const results = [];
  for (const svc of services) {
    const children = await listRelations(tenantId, { fromId: svc.id, status: "active" });
    const activityIds = children.filter((r) => r.relationType === RELATION_TYPES.REALIZED_BY).map((r) => r.toId);
    const activities = await Promise.all(activityIds.map((id) => getNode(tenantId, id)));

    const groupRelations = await listRelations(tenantId, { toId: svc.id, status: "active" })
      .catch(() => []);
    // Also find groups linked to activities
    const allSupports = [];
    for (const act of activities.filter(Boolean)) {
      const supports = await listRelations(tenantId, { toId: act.id, relationType: RELATION_TYPES.SUPPORTS, status: "active" });
      allSupports.push(...supports);
    }

    results.push({
      serviceId: svc.id,
      serviceName: svc.name,
      taxonomyId: svc.attributes?.taxonomyId || null,
      sourceOfferingId: svc.attributes?.sourceOfferingId || null,
      activities: activities.filter(Boolean).map((a) => ({ id: a.id, name: a.name })),
      equipmentGroupCount: new Set(allSupports.map((r) => r.fromId)).size,
      status: svc.status,
    });
  }

  return {
    tenantId,
    generatedAt: nowIso(),
    services: results,
  };
};

export default {
  draftTwinFromCapability,
  createTwinFromDraft,
  summariseTwinAsCapability,
};