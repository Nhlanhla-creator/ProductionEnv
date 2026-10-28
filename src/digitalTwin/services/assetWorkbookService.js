import * as XLSX from 'xlsx';
import { createEmptyResource,validateResource } from '../models/assetSchema';
import { normalAssetNumber } from '../models/assetIdentity';
import { createResource } from './resourceService';
const columns=['assetNumber','name','equipmentTypeId','equipmentGroupId','siteId','location','status'];
export function downloadAssetWorkbook({groups=[],sites=[]}={}) {
  const book=XLSX.utils.book_new();
  const sheet=XLSX.utils.aoa_to_sheet([columns]);sheet['!cols']=columns.map(()=>({wch:28}));
  XLSX.utils.book_append_sheet(book,sheet,'Assets');
  XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet([
    ['Asset register import'],['Fill the Assets sheet; do not change its column headings.'],
    ['assetNumber','Required unique ID, e.g. ADT-001. Letters, numbers, dots, underscores and hyphens only. Format IDs as text.'],
    ['name','Required asset name.'],['equipmentTypeId','Required canonical type ID, or your own stable type name for another industry.'],
    ['equipmentGroupId','Optional existing group ID or unique group name from References.'],['siteId','Optional existing site ID or unique site name from References.'],
    ['location','Optional location description.'],['status','Active or Inactive; Active maps to available. Existing operational statuses are also accepted.'],
    ['Import policy','New assets only. An identical existing row is skipped on retry. Conflicting IDs are never overwritten. Maximum 500 rows per file.'],
  ]),'Instructions');
  XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet([['Kind','ID','Name'],...groups.map(g=>['Group',g.groupId||g.id,g.name]),...sites.map(s=>['Site',s.id,s.name])]),'References');
  XLSX.writeFile(book,'asset-register-template.xlsx');
}
const statusOf=value=>{const key=String(value||'').trim().toLowerCase().replace(/ /g,'_');if(!key)throw new Error('Status is required: Active or Inactive.');if(key==='active')return 'available';if(!['inactive','planned','commissioning','available','operating','standby','planned_maintenance','unplanned_downtime','suspended','retired','disposed'].includes(key))throw new Error('Unknown asset status.');return key;};
function reference(value,records,kind) {
  const key=String(value||'').trim();if(!key)return null;
  const exact=records.find(r=>(r.id||r.groupId)===key);if(exact)return exact.id||exact.groupId;
  const names=records.filter(r=>r.name?.toLowerCase()===key.toLowerCase());
  if(names.length!==1)throw new Error(`${kind} "${key}" is missing or ambiguous. Use an ID from the References sheet.`);
  return names[0].id||names[0].groupId;
}
const sameAsset=(a,b)=>['name','equipmentTypeId','equipmentGroupId','siteId','location','status'].every(k=>(a[k]||'')===(b[k]||''));
export function prepareAssetRows(rows,{tenantId,assets=[],groups=[],sites=[]}={}) {
  if(!rows.length||rows.length>500)throw new Error('Use 1–500 asset rows per import.');
  const seen=new Set(),prepared=[],errors=[];
  rows.forEach((raw,index)=>{
    try{
      const internalNumber=normalAssetNumber(raw.assetNumber??raw.internalNumber);
      if(seen.has(internalNumber))throw new Error('Duplicate Asset ID in this file.');seen.add(internalNumber);
      const resource=createEmptyResource(tenantId,{resourceKind:'asset',internalNumber,name:String(raw.name||'').trim(),equipmentTypeId:String(raw.equipmentTypeId||'').trim(),equipmentGroupId:reference(raw.equipmentGroupId,groups,'Group'),siteId:reference(raw.siteId,sites,'Site'),location:String(raw.location||'').trim(),status:statusOf(raw.status)});
      const result=validateResource(resource,{isCreate:true});if(!result.ok)throw new Error(result.errors.map(e=>e.message).join(' '));
      const matches=assets.filter(a=>String(a.internalNumber||'').trim().toUpperCase()===internalNumber);
      if(matches.length>1)throw new Error('More than one existing asset has this ID. Resolve the legacy duplicate first.');
      const existing=matches[0];if(existing&&!sameAsset(existing,resource))throw new Error('Asset ID already exists with different details. Edit it in the register instead.');
      prepared.push({row:index+2,resource,action:existing?'skip':'create',existingId:existing?.assetId||existing?.id||null});
    }catch(e){errors.push({row:index+2,message:e.message});}
  });
  return {prepared,errors};
}
export async function readAssetWorkbook(file,context) {
  if(file.size>5000000)throw new Error('Choose a file smaller than 5 MB.');
  const book=XLSX.read(await file.arrayBuffer(),{type:'array'}),sheet=book.Sheets.Assets||book.Sheets[book.SheetNames[0]];
  const rows=XLSX.utils.sheet_to_json(sheet,{defval:'',raw:false});
  return prepareAssetRows(rows,context);
}
export async function commitAssetRows(tenantId,prepared,{onProgress}={}) {
  const result={created:0,skipped:0,errors:[],ids:[]};
  for(let i=0;i<prepared.length;i++){
    const row=prepared[i];
    try{
      if(row.action==='skip'){result.skipped++;result.ids.push(row.existingId);}
      else {const asset=await createResource(tenantId,row.resource,{legacyChecked:true});result.created++;result.ids.push(asset.assetId);}
    }catch(e){result.errors.push({row:row.row,message:e.message});break;}
    onProgress?.(i+1,prepared.length);
  }
  return result;
}
