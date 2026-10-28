/** Pure reporting over frozen event snapshots. Totals are asset-hours, not fleet-clock time. */
export function reportWindow(from,to) {
  for (const value of [from,to]) if (value && (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value) || !Number.isFinite(new Date(`${value}T00:00:00`).getTime()) || dateKey(new Date(`${value}T00:00:00`)) !== value)) throw new Error('Choose valid reporting dates.');
  const start=from?new Date(`${from}T00:00:00`).getTime():-Infinity;
  const end=to?new Date(`${to}T00:00:00`):null;
  if(end)end.setDate(end.getDate()+1);
  if((from&&!Number.isFinite(start))||(to&&!Number.isFinite(end.getTime()))||start>=(end?.getTime()??Infinity))throw new Error('Choose a valid reporting date range.');
  return {start,end:end?.getTime()??Infinity};
}
export function periodSeconds(e,window={start:-Infinity,end:Infinity}) {
  const a=Date.parse(e.eventStart),b=Date.parse(e.eventEnd);
  return Number.isFinite(a)&&Number.isFinite(b)&&b>a?Math.max(0,Math.min(b,window.end)-Math.max(a,window.start))/1000:0;
}
export function filterReport(events,{assetId='',groupId='',siteId='',type='',from='',to='',path=[]}={}) {
  const window=reportWindow(from,to);
  return events.filter(e=>e.validationStatus!=='void'&&(!assetId||e.assetId===assetId)&&(!groupId||(groupId==='__none__'?!e.groupId:e.groupId===groupId))&&(!siteId||(siteId==='__none__'?!e.siteId:e.siteId===siteId))&&
    (!type||(type==='planned'?e.planned===true:e.planned===false))&&path.every((key,i)=>classificationKey(e,i)===key))
    .map(e=>({...e,periodDurationSeconds:periodSeconds(e,window),periodDurationHours:periodSeconds(e,window)/3600}))
    .filter(e=>e.periodDurationSeconds>0||(!e.eventEnd&&Date.parse(e.eventStart)<window.end));
}
export function classificationLabel(e,index) {
  const part=e.classificationPath?.[index];
  return part?(part.reportingLabel||part.label):index===0?(e.planned===true?'Planned':e.planned===false?'Unplanned':e.categoryLevel1||'Legacy / Unclassified'):index===1?`Legacy / ${e.categoryLevel2||'Unclassified'}`:'Legacy / Unclassified';
}
export function classificationKey(e,index) {
  const part=e.classificationPath?.[index];
  if(!part)return `legacy:${index}:${classificationLabel(e,index)}`;
  return part.canonicalId||`${e.masterListId}:${part.codeId}`;
}
export function aggregateReport(events,dimension='asset') {
  const groups=new Map();
  events.forEach(e=>{
    let key,label;
    if(/^level[1-5]$/.test(dimension)){const i=Number(dimension.slice(-1))-1;key=classificationKey(e,i);label=classificationLabel(e,i);if(e.classificationPath&&e.classificationPath.length<=i){key=`ended:${i}`;label='Branch ends before this level';}}
    else if(dimension==='asset'){key=e.assetId||'unknown';label=e.assetNumber||e.assetName||e.assetId||'Unknown asset';}
    else if(dimension==='group'){key=e.groupId||'unassigned';label=e.groupName||e.groupId||'No group assigned';}
    else {key=e.siteId||'unassigned';label=e.siteName||e.siteId||'No site assigned';}
    if(!groups.has(key))groups.set(key,{key,label,seconds:0,hours:0,eventCount:0,assets:new Set()});
    const row=groups.get(key);row.seconds+=e.periodDurationSeconds??periodSeconds(e);row.eventCount++;row.assets.add(e.assetId);
  });
  let cumulative=0;const total=[...groups.values()].reduce((s,r)=>s+r.seconds,0);
  return [...groups.values()].sort((a,b)=>b.seconds-a.seconds).map(r=>{cumulative+=r.seconds;return {...r,assets:[...r.assets],hours:r.seconds/3600,share:total?r.seconds/total*100:0,cumulative:total?cumulative/total*100:0};});
}
const dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export function downtimeTrend(events,{from='',to='',grain='day'}={}) {
  const window=reportWindow(from,to),buckets=new Map();let iterations=0;
  events.forEach(e=>{
    const a=Math.max(Date.parse(e.eventStart),window.start),b=Math.min(Date.parse(e.eventEnd),window.end);
    if(!Number.isFinite(a)||!Number.isFinite(b)||b<=a)return;
    let cursor=a;
    while(cursor<b){
      if(++iterations>250000)throw new Error('Reporting range is too large. Choose a shorter period.');
      const day=new Date(cursor);day.setHours(0,0,0,0);const next=new Date(day);next.setDate(next.getDate()+1);
      const cut=Math.min(b,next.getTime()),keyDate=new Date(day);
      if(grain==='week')keyDate.setDate(keyDate.getDate()-((keyDate.getDay()+6)%7));
      if(grain==='month')keyDate.setDate(1);
      const key=dateKey(keyDate);buckets.set(key,(buckets.get(key)||0)+(cut-cursor)/1000);cursor=cut;
    }
  });
  // Include zero-activity periods inside a bounded selected date range.
  if(from&&to){let day=new Date(`${from}T00:00:00`);for(let i=0;day.getTime()<window.end&&i<5000;i++){
    const bucket=new Date(day);if(grain==='week')bucket.setDate(bucket.getDate()-((bucket.getDay()+6)%7));if(grain==='month')bucket.setDate(1);
    const key=dateKey(bucket);if(!buckets.has(key))buckets.set(key,0);day.setDate(day.getDate()+1);
  }}
  return [...buckets].sort(([a],[b])=>a.localeCompare(b)).map(([key,seconds])=>({key,label:grain==='month'?key.slice(0,7):key,seconds,hours:seconds/3600}));
}
