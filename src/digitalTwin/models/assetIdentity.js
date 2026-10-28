/** User-facing equipment ID; Firestore's generated assetId remains the stable internal ID. */
export function normalAssetNumber(value) {
  const code=String(value||'').trim().toUpperCase();
  if(!/^[A-Z0-9][A-Z0-9._-]{0,79}$/.test(code))throw new Error('Asset ID is required: use 1–80 letters, numbers, dots, underscores or hyphens.');
  return code;
}
export function selectEventContext(assignments,date,asset={}) {
  const eligible=assignments.filter(a=>a.effectiveFrom&&a.effectiveFrom<=date&&(!a.effectiveTo||date<=a.effectiveTo)&&
    (a.state!=='closed'||a.effectiveTo));
  const primary=eligible.filter(a=>a.isPrimary),pool=(primary.length?primary:eligible).slice().sort((a,b)=>b.effectiveFrom.localeCompare(a.effectiveFrom));
  if(!pool.length)return {siteId:asset.siteId||null,groupId:asset.equipmentGroupId||null};
  const newest=pool.filter(a=>a.effectiveFrom===pool[0].effectiveFrom);
  const signature=a=>['siteId','contractId','activityId','serviceId','groupId'].map(k=>a[k]||'').join('|');
  if(new Set(newest.map(signature)).size>1)throw new Error('More than one assignment applies at this start date. Resolve the asset assignment before capturing downtime.');
  return {...pool[0],siteId:pool[0].siteId||asset.siteId||null,groupId:pool[0].groupId||asset.equipmentGroupId||null};
}
