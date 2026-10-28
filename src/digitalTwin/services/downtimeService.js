/** Published, asset-based downtime capture. Legacy category constants remain read-compatible. */
import { db } from "../../firebaseConfig";
import { collection, doc, getDoc, getDocs, query, where, runTransaction } from "firebase/firestore";
import { DOWNTIME_LEVEL_1, DOWNTIME_LOSS_TYPE, DATA_CONFIDENCE } from "../models/enums";
import { durationOf, overlapping, selectedClassification, canCaptureAsset } from "../models/downtimeCodes";
import { masterRef, downtimeActor } from "./downtimeMasterService";
const eventsCol = tenantId => collection(db,"digitalTwinTenants",tenantId,"downtimeEvents");
const eventRef = (tenantId,id) => doc(eventsCol(tenantId),id);
const resourceRef = (tenantId,id) => doc(db,"digitalTwinTenants",tenantId,"resources",id);
const lockRef = (tenantId,id) => doc(db,"digitalTwinTenants",tenantId,"downtimeAssetLocks",id);
export const DOWNTIME_TAXONOMY = Object.freeze({
  [DOWNTIME_LEVEL_1.PLANNED_MAINTENANCE]: {
    label: "Planned maintenance",
    lossType: DOWNTIME_LOSS_TYPE.AVAILABILITY_LOSS,
    planned: true,
    subcategories: ["Preventive service", "Inspection", "Statutory inspection", "Planned component replacement", "Shutdown"],
  },
  [DOWNTIME_LEVEL_1.UNPLANNED_MECHANICAL]: {
    label: "Unplanned mechanical",
    lossType: DOWNTIME_LOSS_TYPE.AVAILABILITY_LOSS,
    planned: false,
    subcategories: ["Engine", "Drivetrain", "Hydraulics", "Structure", "Bearings", "Wear parts", "Lubrication"],
  },
  [DOWNTIME_LEVEL_1.UNPLANNED_ELECTRICAL]: {
    label: "Unplanned electrical or control",
    lossType: DOWNTIME_LOSS_TYPE.AVAILABILITY_LOSS,
    planned: false,
    subcategories: ["Electrical", "Instrumentation", "Communications", "Software", "Control-system failure"],
  },
  [DOWNTIME_LEVEL_1.OPERATIONAL_DELAY]: {
    label: "Operational delay",
    lossType: DOWNTIME_LOSS_TYPE.UTILISATION_LOSS,
    planned: false,
    subcategories: ["No operator", "Shift change", "Queue", "Congestion", "Relocation", "Cleaning", "Setup"],
  },
  [DOWNTIME_LEVEL_1.PROCESS_DEPENDENCY]: {
    label: "Process dependency",
    lossType: DOWNTIME_LOSS_TYPE.UTILISATION_LOSS,
    planned: false,
    subcategories: ["Upstream starvation", "Downstream blockage", "No feed", "No storage", "Process instability"],
  },
  [DOWNTIME_LEVEL_1.SUPPLY_DEPENDENCY]: {
    label: "Supply dependency",
    lossType: DOWNTIME_LOSS_TYPE.AVAILABILITY_LOSS,
    planned: false,
    subcategories: ["Fuel", "Parts", "Consumables", "Explosives", "Power", "Water", "Contractor delay"],
  },
  [DOWNTIME_LEVEL_1.EXTERNAL_DELAY]: {
    label: "External or client delay",
    lossType: DOWNTIME_LOSS_TYPE.UTILISATION_LOSS,
    planned: false,
    subcategories: ["Access", "Permit", "Instruction", "Security", "Blast clearance", "Client hold"],
  },
  [DOWNTIME_LEVEL_1.WEATHER_ENVIRONMENT]: {
    label: "Weather and environment",
    lossType: DOWNTIME_LOSS_TYPE.UTILISATION_LOSS,
    planned: false,
    subcategories: ["Rain", "Lightning", "Heat", "Flooding", "Dust", "Geotechnical condition"],
  },
  [DOWNTIME_LEVEL_1.SAFETY_REGULATORY]: {
    label: "Safety or regulatory",
    lossType: DOWNTIME_LOSS_TYPE.AVAILABILITY_LOSS,
    planned: false,
    subcategories: ["Incident stop", "Inspection hold", "Unsafe condition", "Statutory prohibition"],
  },
  [DOWNTIME_LEVEL_1.COMMERCIAL_STANDBY]: {
    label: "Commercial or strategic standby",
    lossType: DOWNTIME_LOSS_TYPE.UTILISATION_LOSS,
    planned: true,
    subcategories: ["No order", "Demand constraint", "Budget hold", "Deliberate idle capacity"],
  },
});

export async function getDowntimeEvent(tenantId,eventId) {
  const snap = await getDoc(eventRef(tenantId,eventId));
  return snap.exists() ? { ...snap.data(),id:snap.id } : null;
}
export async function listDowntimeEvents(tenantId,options = {}) {
  if (!tenantId) return [];
  const keys = ['assetId','groupId','activityId','serviceId','contractId','siteId','categoryLevel1'];
  // One indexed equality, then filter locally: no new composite index required.
  const key = keys.find(k => options[k]);
  const snap = await getDocs(key ? query(eventsCol(tenantId),where(key,'==',options[key])) : eventsCol(tenantId));
  return snap.docs.map(d => ({ ...d.data(),id:d.id })).filter(e =>
    e.validationStatus !== 'void' && keys.every(k => !options[k] || e[k] === options[k]) &&
    (options.planned == null || e.planned === options.planned) &&
    (!options.startFrom || !e.eventEnd || Date.parse(e.eventEnd) > Date.parse(options.startFrom)) &&
    (!options.endTo || Date.parse(e.eventStart) <= Date.parse(options.endTo)))
    .sort((a,b) => Date.parse(b.eventStart)-Date.parse(a.eventStart));
  // pageSize is retained as an accepted option, but never silently truncates reports/overlap checks.
}
async function allAssetEvents(tenantId,assetId) {
  const snap = await getDocs(query(eventsCol(tenantId),where('assetId','==',assetId)));
  return snap.docs.map(d => ({ ...d.data(),id:d.id }));
}
export async function validateDowntimeInput(tenantId,input) {
  if (!tenantId || !input.assetId) throw new Error('Organisation and Asset ID are required.');
  const timing = durationOf(input.eventStart,input.eventEnd);
  if (!input.masterListId || !input.selectedCodeId) throw new Error('Select a published master list and terminal code.');
  const [assetSnap,masterSnap,events] = await Promise.all([
    getDoc(resourceRef(tenantId,input.assetId)),getDoc(masterRef(tenantId,input.masterListId)),allAssetEvents(tenantId,input.assetId),
  ]);
  if (!assetSnap.exists() || !canCaptureAsset(assetSnap.data())) throw new Error('Select an active registered asset.');
  if (!masterSnap.exists()) throw new Error('Master list not found.');
  const published = masterSnap.data().published;
  if (input.masterVersion !== published?.version) throw new Error('The published codes changed. Reload and select the classification again.');
  const classificationPath = selectedClassification(published,assetSnap.data(),input.selectedCodeId);
  const conflicts = overlapping(events,timing.eventStart,timing.eventEnd,input.eventId || null);
  if (conflicts.length) {
    const error = new Error(`Overlapping downtime: ${conflicts.length} existing event(s) for this asset.`);
    error.conflicts = conflicts; throw error;
  }
  return { timing,classificationPath };
}
// A revision lock protects the outside-transaction query. If another cooperating writer
// changes this asset's events, rerun the query before attempting a new transaction.
async function mutateEvent(tenantId,input,{ eventId = null,reason = '',legacyClose = false } = {}) {
  if (!tenantId || !input.assetId) throw new Error('Organisation and Asset ID are required.');
  if (eventId && !reason.trim()) throw new Error('A correction reason is required.');
  const actor = downtimeActor(), timing = durationOf(input.eventStart,input.eventEnd);
  const ref = eventId ? eventRef(tenantId,eventId) : doc(eventsCol(tenantId));
  const lock = lockRef(tenantId,input.assetId);
  for (let attempt = 0; attempt < 4; attempt++) {
    const beforeLock = await getDoc(lock), revision = beforeLock.data()?.revision || 0;
    const events = await allAssetEvents(tenantId,input.assetId);
    const conflicts = overlapping(events,timing.eventStart,timing.eventEnd,eventId);
    if (conflicts.length) {
      const error = new Error(`Overlapping downtime: ${conflicts.length} existing event(s) for this asset.`);
      error.conflicts = conflicts; throw error;
    }
    try {
      return await runTransaction(db,async tx => {
        const locked = await tx.get(lock);
        if ((locked.data()?.revision || 0) !== revision) {
          const error = new Error('Asset events changed.'); error.code = 'downtime/requery'; throw error;
        }
        const existingSnap = eventId ? await tx.get(ref) : null;
        const old = existingSnap?.exists() ? existingSnap.data() : null;
        if (eventId && !old) throw new Error('Event no longer exists.');
        if (old && old.assetId !== input.assetId) throw new Error('An event cannot be moved to another asset.');
        if (old && input.eventVersion !== old.eventVersion) throw new Error('This event changed. Reload before correcting it.');
        const assetSnap = await tx.get(resourceRef(tenantId,input.assetId));
        if (!assetSnap.exists() || (!old && !canCaptureAsset(assetSnap.data()))) throw new Error('Select an active registered asset.');
        const asset = assetSnap.data();
        let classification = {};
        if (legacyClose && old && !old.masterListId) {
          if (old.eventEnd) throw new Error('This event is already closed.');
        } else {
          if (!input.masterListId) throw new Error('Select a published master list.');
          const masterSnap = await tx.get(masterRef(tenantId,input.masterListId));
          const published = masterSnap.data()?.published;
          // Historical classification is kept unchanged for timing/notes-only corrections.
          const unchanged = old && old.masterListId === input.masterListId && old.selectedCodeId === input.selectedCodeId && old.masterVersion === input.masterVersion;
          const path = unchanged ? old.classificationPath : selectedClassification(published,asset,input.selectedCodeId);
          if (!unchanged && input.masterVersion !== published.version) throw new Error('Published codes changed. Reload before saving.');
          classification = { masterListId:input.masterListId,masterVersion:input.masterVersion,
            selectedCodeId:input.selectedCodeId,classificationPath:path,
            planned:path[0].reportingLabel === 'Planned',
            categoryLevel1:path[0].reportingLabel.toLowerCase(), categoryLevel2:path[1].reportingLabel,
            categoryLevel3:path[2].reportingLabel, categoryLevel4:path[3]?.label || null,categoryLevel5:path[4]?.label || null,
            lossType:path[1].reportingLabel === 'Engineering' ? DOWNTIME_LOSS_TYPE.AVAILABILITY_LOSS : DOWNTIME_LOSS_TYPE.UTILISATION_LOSS };
        }
        const now = new Date().toISOString();
        const payload = { ...(old || {}),...classification,...timing,
          eventId:ref.id,tenantId,assetId:input.assetId,
          assetName:old?.assetName || asset.name,assetNumber:old?.assetNumber || asset.internalNumber || input.assetId,
          groupId:old ? (old.groupId ?? null) : (input.groupId || asset.equipmentGroupId || null),equipmentTypeId:old ? (old.equipmentTypeId ?? null) : (asset.equipmentTypeId || null),
          siteId:old ? (old.siteId ?? null) : (input.siteId || asset.siteId || null),contractId:old ? (old.contractId ?? null) : (input.contractId || null),
          activityId:old ? (old.activityId ?? null) : (input.activityId || null),serviceId:old ? (old.serviceId ?? null) : (input.serviceId || null),
          notes:String(input.notes ?? old?.notes ?? ''),timezone:input.timezone || old?.timezone || 'Africa/Johannesburg',
          lostOperatingHours:timing.durationHours,confidence:old?.confidence || input.confidence || DATA_CONFIDENCE.MANUAL_ACTUAL,
          source:old?.source || input.source || 'manual',ingestionBatchId:old?.ingestionBatchId || input.ingestionBatchId || null,
          externalSourceId:old?.externalSourceId || input.externalSourceId || null,
          validationStatus:'valid',eventVersion:(old?.eventVersion || 0)+1,
          createdAt:old?.createdAt || now,createdBy:old?.createdBy || actor,updatedAt:now,updatedBy:actor };
        tx.set(ref,payload);
        tx.set(lock,{ revision:revision+1,updatedAt:now,updatedBy:actor });
        tx.set(doc(collection(ref,'auditLog')),{ action:old ? 'corrected' : 'created',reason,actor,at:now,before:old,after:payload });
        return payload;
      });
    } catch (error) { if (error.code !== 'downtime/requery') throw error; }
  }
  throw new Error('Another user is changing this asset. Reload and retry.');
}
export const createDowntimeEvent = (tenantId,input) => mutateEvent(tenantId,input);
export async function correctDowntimeEvent(tenantId,eventId,patch,{ reason,expectedVersion } = {}) {
  const existing = await getDowntimeEvent(tenantId,eventId);
  if (!existing) throw new Error('Event not found.');
  return mutateEvent(tenantId,{ ...existing,...patch,assetId:existing.assetId,eventVersion:expectedVersion },{ eventId,reason });
}
export async function closeDowntimeEvent(tenantId,eventId,{ eventEnd,actionTaken = '',rootCause = '' } = {}) {
  const old = await getDowntimeEvent(tenantId,eventId);
  if (!old) throw new Error('Event not found.');
  if (old.eventEnd) throw new Error('This event is already closed.');
  return mutateEvent(tenantId,{ ...old,eventStart:new Date(old.eventStart).toISOString(),eventEnd,notes:[old.notes,actionTaken,rootCause].filter(Boolean).join('\n') },
    { eventId,reason:'Closed an existing open event',legacyClose:true });
}
export const parentDowntime = (events = []) => {
  const intervals = events
    .filter((e) => e.validationStatus !== "void" && Number.isFinite(Date.parse(e.eventStart)) && Date.parse(e.eventEnd) > Date.parse(e.eventStart))
    .map((e) => ({
      start: new Date(e.eventStart).getTime(),
      end: new Date(e.eventEnd).getTime(),
      category: e.categoryLevel1,
      planned: e.planned,
    }))
    .sort((a, b) => a.start - b.start);

  if (intervals.length === 0) return { totalHours: 0, byCategory: {}, planned: 0, unplanned: 0, merged: [] };

  const merged = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const last = merged[merged.length - 1];
    if (intervals[i].start <= last.end) {
      last.end = Math.max(last.end, intervals[i].end);
    } else {
      merged.push(intervals[i]);
    }
  }

  const totalMs = merged.reduce((s, m) => s + (m.end - m.start), 0);
  const totalHours = totalMs / 3600000;

  // By-category breakdown uses the raw events (not merged) so a category
  // sum can exceed the total when intervals overlap across categories —
  // which is correct: overlapping categories mean the asset was down for
  // multiple qualifying reasons in the same window.
  const byCategory = {};
  let planned = 0, unplanned = 0;
  intervals.forEach((e) => {
    const hours = (e.end - e.start) / 3600000;
    byCategory[e.category] = (byCategory[e.category] || 0) + hours;
    if (e.planned) planned += hours; else unplanned += hours;
  });

  return { totalHours, byCategory, planned, unplanned, merged };
};

export async function importDowntimeEvents(tenantId,rows = [],{ dryRun = false,batchId = null } = {}) {
  const result = { created:0,errors:[],warnings:[],committed:false,previewIds:[] };
  for (let i=0;i<rows.length;i++) {
    try {
      await validateDowntimeInput(tenantId,rows[i]);
      if (overlapping(rows.slice(0,i),rows[i].eventStart,rows[i].eventEnd).some(e => e.assetId === rows[i].assetId)) throw new Error('Overlaps another row in this import.');
    } catch (e) { result.errors.push({ row:i+1,message:e.message }); }
  }
  if (result.errors.length || dryRun) return result;
  // Revalidated per write. Results explicitly report partial progress; never claim atomic bulk import.
  for (let i=0;i<rows.length;i++) {
    try {
      const event = await createDowntimeEvent(tenantId,{ ...rows[i],source:'import',ingestionBatchId:batchId });
      result.previewIds.push(event.eventId); result.created++;
    } catch (e) { result.errors.push({ row:i+1,message:e.message }); break; }
  }
  result.committed = result.errors.length === 0;
  return result;
}
export default { DOWNTIME_TAXONOMY,createDowntimeEvent,getDowntimeEvent,listDowntimeEvents,
  correctDowntimeEvent,closeDowntimeEvent,parentDowntime,importDowntimeEvents,validateDowntimeInput };
// All registered physical assets; do not hide assets currently operating or in maintenance.
export async function listCaptureAssets(tenantId,{ includeInactive = false } = {}) {
  if (!tenantId) return [];
  const snap = await getDocs(query(collection(db,'digitalTwinTenants',tenantId,'resources'),where('resourceKind','==','asset')));
  return snap.docs.map(d => ({ ...d.data(),id:d.id })).filter(a => includeInactive || canCaptureAsset(a)).sort((a,b) => a.name.localeCompare(b.name));
}

export async function getDowntimeEventAudit(tenantId,eventId) {
  const snap=await getDocs(collection(eventRef(tenantId,eventId),'auditLog'));
  return snap.docs.map(d=>({...d.data(),id:d.id})).sort((a,b)=>String(b.at).localeCompare(String(a.at)));
}
