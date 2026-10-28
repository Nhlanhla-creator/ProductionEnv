/** Fixed headings and pure validation; no Firebase or browser dependencies. */
export const DOWNTIME_HEADINGS = Object.freeze([
  'Downtime Type', 'Delay Category', 'Delay Classification',
  'Delay Subcategory', 'Specific Delay Reason',
]);
export const TEMPLATE_VERSION = 'mining-mobile-1';
const rows = [
  ['Unplanned','Engineering','Mechanical','Engine','Engine Failure'],
  ['Unplanned','Engineering','Mechanical','Engine','No Parts Available'],
  ['Unplanned','Engineering','Mechanical','Engine','No Mechanic Available'],
  ['Unplanned','Engineering','Mechanical','Transmission','Transmission Failure'],
  ['Unplanned','Engineering','Mechanical','Brakes','Brake Failure'],
  ['Unplanned','Engineering','Mechanical','Hydraulic System','Hydraulic Leak'],
  ['Unplanned','Engineering','Electrical','Starting System','Starter Failure'],
  ['Unplanned','Engineering','Electrical','Wiring','Wiring Fault'],
  ['Unplanned','Engineering','Instrumentation','Sensors','Sensor Failure'],
  ['Unplanned','Production','People','Operator Availability','No Operator'],
  ['Unplanned','Production','Operations','Dispatch','Dispatch System Failure'],
  ['Unplanned','Production','Site Conditions','Haul Roads','Poor Road Conditions'],
  ['Unplanned','Production','Materials','Material Availability','No Material'],
  ['Unplanned','Production','Safety','Incidents','Accident'],
  ['Unplanned','Standby','Weather','Severe Weather'],
  ['Unplanned','Standby','Industrial Relations','Strike'],
  ['Planned','Engineering','Maintenance','Preventive Maintenance','Scheduled Service'],
  ['Planned','Engineering','Maintenance','Component Replacement','GET Change Out'],
  ['Planned','Engineering','Maintenance','Inspections','Scheduled Inspection'],
  ['Planned','Engineering','Maintenance','Workshop Activities','Washbay'],
  ['Planned','Production','People','Shift Management','Shift Change'],
  ['Planned','Production','People','Breaks','Lunch Break'],
  ['Planned','Production','People','Training','Scheduled Training'],
  ['Planned','Production','Equipment Preparation','Refuelling','Scheduled Refuelling'],
  ['Planned','Production','Equipment Preparation','Inspection','Pre-Shift Inspection'],
  ['Planned','Production','Safety','Meetings','SHEQ Meeting'],
  ['Planned','Standby','Scheduled Standby','Holiday'],
  ['Planned','Standby','Scheduled Standby','Non-Production Day'],
  ['Planned','Standby','Operational Demand','Equipment Not Required'],
];
const systemRows = ['Planned','Unplanned'].flatMap(a =>
  ['Engineering','Production','Standby'].map(b => [a,b]));
export const cleanLabel = value => String(value || '').trim();
const normal = value => cleanLabel(value).toLowerCase();
export function seedCodes(mining = true) {
  const nodes = [], paths = new Map();
  [...systemRows, ...(mining ? rows : [])].forEach(path => {
    let parentId = null;
    path.forEach((label, index) => {
      const key = path.slice(0,index+1).join('|');
      let node = paths.get(key);
      if (!node) {
        const level = index + 1;
        node = { id: `big-${nodes.length+1}`, parentId, level, label,
          standardLabel: level <= 3 ? label : null,
          canonicalId: level <= 3 ? `${level <= 2 ? 'system' : 'mining'}.${key.toLowerCase().replace(/[^a-z0-9]+/g,'.')}` : null,
          origin: level <= 2 ? 'system' : level === 3 ? 'industry' : 'organisation',
          active: true, terminal: false, sortOrder: nodes.length };
        nodes.push(node); paths.set(key,node);
      }
      parentId = node.id;
    });
  });
  nodes.forEach(n => { n.terminal = n.level >= 3 && !nodes.some(c => c.parentId === n.id); });
  return nodes;
}
export function codePath(nodes, id) {
  const path = [], seen = new Set(), byId = new Map(nodes.map(n => [n.id,n]));
  let next = id;
  while (next) {
    if (seen.has(next)) throw new Error('Classification contains a cycle.');
    seen.add(next);
    const node = byId.get(next);
    if (!node) throw new Error('Classification contains a missing parent.');
    path.unshift(node); next = node.parentId;
  }
  return path;
}
export const childrenOf = (nodes, parentId = null, activeOnly = true) => nodes
  .filter(n => n.parentId === parentId && (!activeOnly || n.active))
  .sort((a,b) => a.sortOrder-b.sortOrder || a.label.localeCompare(b.label));
export function validateCodes(nodes, previous = [], templateId = TEMPLATE_VERSION, publishing = true) {
  if (!Array.isArray(nodes) || nodes.length > 600) throw new Error('Use at most 600 codes per master list.');
  const ids = new Set(), siblings = new Set();
  const standards = seedCodes(templateId === TEMPLATE_VERSION);
  const allowed = new Map(standards.filter(n => n.level <= 3).map(n => [n.id,n]));
  previous.forEach(old => {
    const n = nodes.find(c => c.id === old.id);
    if (!n) throw new Error('Codes cannot be deleted. Deactivate them to retain history.');
    for (const key of ['parentId','level','canonicalId','origin','standardLabel']) {
      if (n[key] !== old[key]) throw new Error('A code cannot be reparented or remapped; deactivate it and add another.');
    }
  });
  nodes.forEach(n => {
    if (!n.id || ids.has(n.id)) throw new Error('Code IDs must be unique.');
    ids.add(n.id);
    if (!Number.isInteger(n.level) || n.level < 1 || n.level > 5) throw new Error('Invalid code level.');
    if (!cleanLabel(n.label) || n.label.length > 120) throw new Error('Labels must contain 1–120 characters.');
    if (typeof n.active !== 'boolean' || typeof n.terminal !== 'boolean' || !Number.isFinite(n.sortOrder)) throw new Error('Invalid code settings.');
    const key = `${n.parentId}|${normal(n.label)}`;
    if (siblings.has(key)) throw new Error('Labels must be unique beneath their parent.');
    siblings.add(key);
    const path = codePath(nodes,n.id);
    if (path.length !== n.level || path.some((p,i) => p.level !== i+1)) throw new Error('Every code must belong to the preceding level.');
    if (n.level <= 2 || (n.level === 3 && n.origin === 'industry')) {
      const std = allowed.get(n.id);
      if (!std || ['parentId','level','canonicalId','origin','standardLabel'].some(k => n[k] !== std[k])) throw new Error('Standard codes must come from the BIG template.');
      if (n.level <= 2 && n.label !== std.label) throw new Error('Levels 1 and 2 are system-controlled.');
    } else if (n.level === 3) {
      if (n.origin !== 'custom_unmapped' || n.canonicalId !== null || n.standardLabel !== null) throw new Error('Custom Level 3 must be flagged Custom / Unmapped.');
    } else if (n.origin !== 'organisation' || n.canonicalId !== null || n.standardLabel !== null) throw new Error('Invalid organisation code.');
    if (n.level === 5 && !n.terminal) throw new Error('Level 5 is the final downtime reason and must end the branch.');
    if (n.level < 3 && n.terminal) throw new Error('Branches may end only at Level 3, 4 or 5.');
    if (publishing && n.active) {
      if (path.some(p => !p.active)) throw new Error('An active code has an inactive parent. Deactivate the entire branch.');
      const kids = childrenOf(nodes,n.id);
      if (n.terminal && kids.length) throw new Error('A terminal code cannot have active children.');
      if (!n.terminal && !kids.length) throw new Error(`Finish or deactivate the branch: ${n.label}.`);
    }
  });
  standards.filter(n => n.level <= 2).forEach(n => {
    if (!ids.has(n.id)) throw new Error('The fixed system codes must be retained.');
  });
  if (publishing && !nodes.some(n => n.active && n.terminal)) throw new Error('At least one active terminal code is required.');
  return true;
}
export function appliesTo(assignment, asset) {
  return Boolean(assignment?.allAssets ||
    assignment?.equipmentTypeIds?.includes(asset.equipmentTypeId) ||
    assignment?.groupIds?.includes(asset.equipmentGroupId));
}
export function selectedClassification(published, asset, codeId) {
  if (!published || !appliesTo(published.assignment,asset)) throw new Error('This published master list is not assigned to the asset.');
  const path = codePath(published.nodes,codeId);
  if (path.length < 3 || path.some(n => !n.active) || !path[path.length-1].terminal || childrenOf(published.nodes,codeId).length) throw new Error('Select an active terminal code from the published list.');
  return path.map(n => ({ codeId: n.id, level: n.level, label: n.label,
    canonicalId: n.canonicalId, reportingLabel: n.standardLabel || n.label,
    mappingStatus: n.origin === 'custom_unmapped' ? 'custom_unmapped' : 'mapped' }));
}
export function durationOf(startValue,endValue) {
  // Persist explicit-offset/UTC instants; datetime-local is converted by the form.
  const explicit = v => typeof v === 'string' && /(?:Z|[+-]\d\d:\d\d)$/.test(v);
  if (!explicit(startValue) || !explicit(endValue)) throw new Error('Start and end require a timezone offset or Z.');
  const start = Date.parse(startValue), end = Date.parse(endValue);
  if (!Number.isFinite(start) || !Number.isFinite(end)) throw new Error('Enter valid start and end date-times.');
  if (end <= start) throw new Error('End must be after start.');
  return { eventStart: new Date(start).toISOString(), eventEnd: new Date(end).toISOString(),
    durationSeconds: (end-start)/1000, durationHours: (end-start)/3600000 };
}
export function overlapping(events,startValue,endValue,excludeId = null) {
  const start = Date.parse(startValue), end = Date.parse(endValue);
  return events.filter(e => e.id !== excludeId && e.eventId !== excludeId && e.validationStatus !== 'void' &&
    start < (e.eventEnd ? Date.parse(e.eventEnd) : Infinity) && end > Date.parse(e.eventStart));
}
export const canCaptureAsset = a => a && a.resourceKind === 'asset' &&
  !['retired','disposed','inactive'].includes(a.status);
