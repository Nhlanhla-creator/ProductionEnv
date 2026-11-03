/** Stable routes: setup configures; operations captures and analyses. */
export const TWIN_ROUTES = Object.freeze({
  home:'/digital-twin',setupHome:'/digital-twin/setup',guide:'/digital-twin/setup/guide',
  assets:'/digital-twin/setup/assets',groups:'/digital-twin/setup/groups',setup:'/digital-twin/setup/master-codes',
  periods:'/digital-twin/setup/periods',import:'/digital-twin/setup/imports',
  packs:'/digital-twin/setup/packs',convert:'/digital-twin/setup/convert',
  capture:'/digital-twin/operations/downtime',records:'/digital-twin/operations/downtime/history',
  performance:'/digital-twin/operations/performance',kpis:'/digital-twin/operations/performance/kpis',
  capacity:'/digital-twin/operations/performance/capacity',analysis:'/digital-twin/operations/performance/analysis',
  measurements:'/digital-twin/operations/performance/capture',grid:'/digital-twin/operations/performance/grid',
});
export function twinPath(key,context={}) {
  const params=new URLSearchParams();
  for(const k of ['assetId','eventId','from','to'])if(context[k])params.set(k,context[k]);
  return (TWIN_ROUTES[key]||TWIN_ROUTES.home)+(params.size?'?'+params:'');
}
export function twinView(pathname,search='',initialActive=null) {
  pathname=pathname.replace(/\/+$/, '')||'/';
  const q=new URLSearchParams(search);
  if(pathname==='/digital-twin'&&q.get('setup')==='true')return 'guide';
  if(pathname==='/digital-twin'&&q.get('view'))return ({capture:'measurements',downtime:'capture',setup:'guide'}[q.get('view')]||q.get('view'));
  const aliases={'/digital-twin/packs':'packs','/digital-twin/convert':'convert','/digital-twin/dashboard':'performance','/digital-twin/assets':'assets','/digital-twin/downtime':'capture','/digital-twin/imports':'import'};
  if(aliases[pathname])return aliases[pathname];
  const match=Object.entries(TWIN_ROUTES).find(([,path])=>path===pathname);
  if(match&&match[0]!=='home')return match[0];
  return initialActive?({setup:'setupHome',downtime:'capture',capture:'measurements'}[initialActive]||initialActive):'home';
}
