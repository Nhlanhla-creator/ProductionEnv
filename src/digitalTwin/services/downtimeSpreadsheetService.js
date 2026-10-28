/** Separate master-code workbook: imports amend a draft and never publish it. */
import * as XLSX from 'xlsx';
import { validateCodes, DOWNTIME_HEADINGS } from '../models/downtimeCodes';
const columns = ['codeId','parentId','level','label','active','terminal','sortOrder','reportingClassification'];
export function downloadMasterWorkbook(draft) {
  const book = XLSX.utils.book_new();
  const data = draft.nodes.map(n => ({ codeId:n.id,parentId:n.parentId || '',level:n.level,label:n.label,
    active:n.active ? 'Yes' : 'No',terminal:n.terminal ? 'Yes' : 'No',sortOrder:n.sortOrder,
    reportingClassification:n.standardLabel || (n.level === 3 ? 'Custom / Unmapped' : '') }));
  XLSX.utils.book_append_sheet(book,XLSX.utils.json_to_sheet(data,{ header:columns }),'Master Codes');
  const instructions = [
    ['Master-code draft import'],
    ['Edit the existing rows. Omitted codes are retained; set active=No to deactivate.'],
    ['Keep codeId and parentId stable. New rows need a unique codeId and an existing/new parentId.'],
    ['Levels 1–2 cannot be renamed. Level 3 labels are aliases; reportingClassification is read-only.'],
    ['New Level 3 codes are Custom / Unmapped. Levels 4–5 are organisation-specific.'],
    ['Set terminal=Yes only at Level 3, 4 or 5. Terminal nodes cannot have active children.'],
    ['Deactivate an entire branch together. Import only changes the draft; Save/Publish explicitly.'],
    ...DOWNTIME_HEADINGS.map((heading,i) => [`Level ${i+1}`,heading]),
  ];
  XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet(instructions),'Instructions');
  XLSX.writeFile(book,'downtime-master-codes.xlsx');
}
const bool = (v,field) => {
  const s = String(v).trim().toLowerCase();
  if (['true','yes','1'].includes(s)) return true;
  if (['false','no','0'].includes(s)) return false;
  throw new Error(`${field} must be Yes or No.`);
};
export async function readMasterWorkbook(file,draft,templateId) {
  if (file.size > 5000000) throw new Error('Use a workbook smaller than 5 MB.');
  const book = XLSX.read(await file.arrayBuffer(),{ type:'array' });
  const sheet = book.Sheets['Master Codes'] || book.Sheets[book.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet,{ defval:'' });
  if (!rows.length || rows.length > 600) throw new Error('Import 1–600 code rows.');
  const nodes = draft.nodes.map(n => ({ ...n })), seen = new Set();
  rows.forEach((r,i) => {
    const id = String(r.codeId).trim(), old = nodes.find(n => n.id === id);
    if (!id || seen.has(id)) throw new Error(`Row ${i+2}: unique codeId is required.`);
    seen.add(id);
    const level = Number(r.level), parentId = String(r.parentId).trim() || null;
    if (old && (old.level !== level || old.parentId !== parentId)) throw new Error(`Row ${i+2}: existing codes cannot be moved.`);
    const value = { ...(old || { id,parentId,level,canonicalId:null,standardLabel:null,
      origin:level === 3 ? 'custom_unmapped' : 'organisation' }),
      label:String(r.label).trim(),active:bool(r.active,'active'),terminal:bool(r.terminal,'terminal'),sortOrder:Number(r.sortOrder) };
    if (old) nodes[nodes.indexOf(old)] = value; else nodes.push(value);
  });
  validateCodes(nodes,draft.nodes,templateId,false);
  return { ...draft,nodes };
}
export function downloadDowntimeCsv(events) {
  const headers = ['Asset ID','Asset name','Asset type','Asset group','Site','Start UTC','End UTC','Duration seconds','Duration hours','Hours in selected period','Captured reason (final code)',...DOWNTIME_HEADINGS,'Code ID','Master list','Version','Notes'];
  const safe = v => {
    let s = String(v ?? '');
    if (/^[\s]*[=+@-]/.test(s)) s = "'"+s;
    return '"'+s.replace(/"/g,'""')+'"';
  };
  const rows = events.map(e => [e.assetNumber || e.assetId,e.assetName || '',e.equipmentTypeId,e.groupName||e.groupId,e.siteName||e.siteId,
    e.eventStart,e.eventEnd,e.durationSeconds ?? (e.durationHours == null ? '' : e.durationHours*3600),e.durationHours,e.periodDurationHours ?? e.durationHours,e.classificationPath?.slice(-1)[0]?.label || e.causeCode || e.failureMode || '',
    ...DOWNTIME_HEADINGS.map((_,i) => e.classificationPath?.[i]?.label || (i === 0 ? e.categoryLevel1 : i === 1 ? e.categoryLevel2 : '')),
    e.selectedCodeId,e.masterListId,e.masterVersion,e.notes]);
  const blob = new Blob(['\uFEFF'+[headers,...rows].map(r => r.map(safe).join(',')).join('\r\n')],{ type:'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href=url; link.download='downtime-events.csv'; document.body.appendChild(link); link.click();link.remove();
  setTimeout(() => URL.revokeObjectURL(url),1000);
}
