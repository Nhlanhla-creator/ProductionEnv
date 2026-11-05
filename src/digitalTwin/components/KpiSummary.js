"use client"
import { useEffect,useState } from 'react';
import { listOperatingSites } from '../services/resourceService';
import { listShifts } from '../services/shiftCaptureService';
import { listMeasurements } from '../services/measurementService';
import AssetPerformanceCommandCentre from './AssetPerformanceCommandCentre';
export default function KpiSummary({tenantId,onNavigate}) {
  const [sites,setSites]=useState([]),[shifts,setShifts]=useState([]),[measurements,setMeasurements]=useState([]),[scope,setScope]=useState({}),[error,setError]=useState('');
  useEffect(()=>{let live=true;Promise.all([listOperatingSites(tenantId,{activeOnly:false}),listShifts(tenantId),listMeasurements(tenantId)]).then(([s,h,m])=>{if(live){setSites(s);setShifts(h);setMeasurements(m);}}).catch(e=>{if(live)setError(e.message);});return()=>{live=false;};},[tenantId]);
  const set=(key,value)=>setScope(old=>({...old,[key]:value}));
  return <section><div className="dt-heading"><div><h2>KPI Summary</h2><p>Select an operating site or shift. Open a KPI to break its total down using its existing calculation.</p></div><button className="dt-button" onClick={()=>onNavigate('analysis')}>Open operational KPI register</button></div>
    {error&&<p role="alert" className="dt-notice dt-notice-error">{error}</p>}
    <div className="dt-panel dt-asset-toolbar"><label className="dt-field"><span>Operating site</span><select value={scope.siteId||''} onChange={e=>set('siteId',e.target.value)}><option value="">All sites</option><option value="__none__">No site recorded</option>{[...new Set([...sites.map(s=>s.id),...measurements.map(m=>m.siteId).filter(Boolean)])].map(id=><option key={id} value={id}>{sites.find(s=>s.id===id)?.name||id}</option>)}</select></label><label className="dt-field"><span>Shift</span><select value={scope.shiftId||''} onChange={e=>set('shiftId',e.target.value)}><option value="">All shifts</option><option value="__none__">No shift recorded</option>{[...new Set([...shifts.map(s=>s.id),...measurements.map(m=>m.shiftId).filter(Boolean)])].map(id=><option key={id} value={id}>{shifts.find(s=>s.id===id)?.name||id}</option>)}</select></label>
      {['commodity','product','client','operatingMode','crew'].map(key=>{const choices=[...new Set(measurements.map(m=>key==='crew'?m.tags?.crew:m[key]).filter(Boolean))].sort();return choices.length>0?<label key={key} className="dt-field"><span>{({operatingMode:'Operating mode',crew:'Crew'})[key]||key}</span><select value={scope[key]||''} onChange={e=>set(key,e.target.value)}><option value="">All</option>{choices.map(value=><option key={value} value={value}>{value}</option>)}</select></label>:null;})}<button className="dt-button" onClick={()=>setScope({})}>Clear scope</button>
    </div><AssetPerformanceCommandCentre tenantId={tenantId} scopeFilters={scope} onNavigate={onNavigate}/>
  </section>;
}
