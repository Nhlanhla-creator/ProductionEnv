"use client"
import { collection,onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useCallback,useEffect,useMemo,useState } from 'react';
import { listCaptureAssets,getDowntimeEventAudit } from '../services/downtimeService';
import { listGroups,listOperatingSites } from '../services/resourceService';
import { listShifts } from '../services/shiftCaptureService';
import { filterReport,aggregateReport,classificationKey } from '../models/downtimeReporting';
import { listDowntimeMasters } from '../services/downtimeMasterService';
import DowntimeRegisterTable from './DowntimeRegisterTable';
import DowntimeDialog from './DowntimeDialog';
import '../styles/Downtime.css';
const blank=()=>({assetId:'',groupId:'',siteId:'',contractId:'',activityId:'',serviceId:'',shiftId:'',crew:'',status:'',type:'',search:'',from:'',to:''});
const stamp=(value,options)=>value?new Date(value).toLocaleString(undefined,options):'Ongoing';
export default function DowntimeRecords({tenantId,initialAssetId='',initialRange=null,onNavigate,onCorrect,onOpenAsset,onRecord,onCloseEvent}) {
  const [masters,setMasters]=useState([]),[tableIds,setTableIds]=useState(null),[tableReset,setTableReset]=useState(0);
  const [events,setEvents]=useState([]),[assets,setAssets]=useState([]),[groups,setGroups]=useState([]),[sites,setSites]=useState([]),[shifts,setShifts]=useState([]);
  const [filters,setFilters]=useState(()=>({...blank(),...(initialRange||{}),assetId:initialAssetId})),[path,setPath]=useState([]),[dimension,setDimension]=useState('reason');
  const [asOf,setAsOf]=useState(Date.now()),[loading,setLoading]=useState(true),[error,setError]=useState(''),[audit,setAudit]=useState(null),[analysis,setAnalysis]=useState(true);
  useEffect(()=>{let live=true;setError('');setAssets([]);setGroups([]);setSites([]);setShifts([]);
    Promise.all([listCaptureAssets(tenantId,{includeInactive:true}),listGroups(tenantId,{status:null}),listOperatingSites(tenantId,{activeOnly:false}),listShifts(tenantId),listDowntimeMasters(tenantId)]).then(([a,g,s,h,m])=>{if(live){setAssets(a);setGroups(g);setSites(s);setShifts(h);setMasters(m);}}).catch(e=>{if(live)setError(e.message);});
    return()=>{live=false;};
  },[tenantId]);
  useEffect(()=>{const t=setInterval(()=>setAsOf(Date.now()),30000);return()=>clearInterval(t);},[]);
  useEffect(()=>{setLoading(true);setEvents([]);if(!tenantId){setLoading(false);return;}return onSnapshot(collection(db,'digitalTwinTenants',tenantId,'downtimeEvents'),s=>{setAsOf(Date.now());setEvents(s.docs.map(d=>({...d.data(),id:d.id})));setLoading(false);},e=>{setError(e.message);setLoading(false);});},[tenantId]);
  const enriched=useMemo(()=>events.map(e=>{const a=assets.find(a=>(a.assetId||a.id)===e.assetId);return {...e,assetName:a?.name||e.assetName,assetNumber:a?.internalNumber||e.assetNumber,masterName:masters.find(m=>m.id===e.masterListId)?.published?.name||masters.find(m=>m.id===e.masterListId)?.draft.name||e.masterListId,groupName:groups.find(g=>(g.id||g.groupId)===e.groupId)?.name||e.groupId,siteName:sites.find(s=>s.id===e.siteId)?.name||e.siteId,shiftName:shifts.find(s=>s.id===e.shiftId)?.name||e.shiftId};}),[events,assets,groups,sites,shifts,masters]);
  const report=useMemo(()=>{try{return {rows:filterReport(enriched,{...filters,asOf,path:path.map(p=>p.key)}).sort((a,b)=>Date.parse(b.eventStart)-Date.parse(a.eventStart)),error:''};}catch(e){return {rows:[],error:e.message};}},[enriched,filters,path,asOf]);
  // This exact array drives the summary, its totals, export, drill-down and Pareto.
  const onVisibleRowsChange=useCallback((visible)=>{const ids=visible.map(e=>e.id);setTableIds(old=>JSON.stringify(old)===JSON.stringify(ids)?old:ids);},[]);
  const rows=useMemo(()=>tableIds===null?report.rows:report.rows.filter(e=>tableIds.includes(e.id)),[report.rows,tableIds]);
  const total=rows.reduce((sum,e)=>sum+e.periodDurationHours,0),pareto=aggregateReport(rows,dimension),sitesSummary=aggregateReport(rows,'site'),shiftsSummary=aggregateReport(rows,'shift');
  const pick=(key,value)=>{setFilters(old=>({...old,[key]:value}));setPath([]);};
  const contributor=row=>{
    if(['asset','group','site','shift','crew'].includes(dimension)){pick(({asset:'assetId',group:'groupId',site:'siteId',shift:'shiftId',crew:'crew'})[dimension],row.key==='unassigned'?'__none__':row.key);return;}
    const lookupIndex=Number(dimension.slice(-1))-1,event=rows.find(e=>classificationKey(e,dimension==='reason'?(e.classificationPath?.length||0)-1:lookupIndex)===row.key);
    const index=dimension==='reason'?(event?.classificationPath?.length||0)-1:lookupIndex;
    if(event?.classificationPath)setPath(event.classificationPath.slice(0,index+1).map((p,i)=>({key:classificationKey(event,i),label:p.label})));
  };
  const auditEvent=async event=>{setError('');try{setAudit({event,rows:await getDowntimeEventAudit(tenantId,event.eventId||event.id)});}catch(e){setError(e.message);}};
  return <section className="dt-workspace"><div className="dt-heading"><div><h2>Downtime Output</h2><p>All logged downtime, including ongoing events. Capture first, then analyse the same records.</p></div><div className="dt-actions"><button className="dt-button dt-button-primary" onClick={()=>onRecord?onRecord():onNavigate?.('capture', {view:'record'})}>+ Record downtime</button></div></div>
    {(error||report.error)&&<div role="alert" className="dt-notice dt-notice-error">{error||report.error}</div>}
    <section className="dt-panel"><div className="dt-panel-head"><h3>Downtime records</h3><button className="dt-button dt-button-small" onClick={()=>{setFilters(blank());setPath([]);setTableIds(null);setTableReset(x=>x+1);}}>Clear all filters</button></div>
      <div className="dt-actions"><label className="dt-field"><span>From</span><input type="date" value={filters.from} onChange={e=>pick('from',e.target.value)}/></label>
        <label className="dt-field"><span>To</span><input type="date" value={filters.to} min={filters.from||undefined} onChange={e=>pick('to',e.target.value)}/></label>
        {Object.entries(filters).some(([key,value])=>value&&!['from','to','search'].includes(key))&&<span className="dt-badge">Filtered by the selected equipment / drill-down</span>}
      </div>
      {path.length>0&&<div className="dt-path"><button className="dt-button dt-button-small" onClick={()=>setPath([])}>Clear reason drill-down</button>{path.map(p=><span className="dt-badge" key={p.key}>{p.label}</span>)}</div>}
      <p className="dt-muted">{rows.length} records · {total.toFixed(2)} asset-hours · {rows.filter(e=>!e.eventEnd).length} ongoing. Header filters, charts and exports use the same records.</p>
      <DowntimeRegisterTable key={`${tenantId}:${tableReset}`} tenantId={tenantId} rows={report.rows} loading={loading}
        onVisibleRowsChange={onVisibleRowsChange} onOpenAsset={onOpenAsset} onCorrect={onCorrect} onCloseEvent={onCloseEvent} onAudit={auditEvent}
        onMasterCodes={event=>onNavigate?.('setup',{masterId:event.masterListId,groupId:event.groupId||''})}/>
    </section>
    {rows.some(e=>!e.eventEnd)&&<p className="dt-notice">Ongoing hours are provisional as of {new Date(asOf).toLocaleString()}. Events remain open until the machine returns online.</p>}
    <button className="dt-button" aria-expanded={analysis} onClick={()=>setAnalysis(v=>!v)}>{analysis?'Hide analysis':'Analyse this table selection'}</button>
    {analysis&&<><div className="dt-split" style={{marginTop:20}}>{[['Operating site',sitesSummary,'siteId'],['Shift at event start',shiftsSummary,'shiftId']].map(([label,summary,key])=><section className="dt-panel" key={key}><h3>{label} breakdown</h3>{summary.map(row=><button className="dt-bar-button" key={row.key} onClick={()=>pick(key,row.key==='unassigned'?'__none__':row.key)}><span className="dt-bar-label"><span>{row.label}</span><strong>{row.hours.toFixed(2)} h</strong></span><small>{row.eventCount} records · {row.assets.length} machines</small></button>)}</section>)}</div>
      <section className="dt-panel"><div className="dt-panel-head"><h3>Pareto — summary table records</h3><select className="dt-input" style={{maxWidth:240}} aria-label="Pareto dimension" value={dimension} onChange={e=>setDimension(e.target.value)}>{[['reason','Specific reason'],['level5','Level 5 reason'],['level4','Subcategory'],['level3','Classification'],['level2','Delay category'],['level1','Downtime type'],['site','Operating site'],['shift','Shift'],['crew','Crew'],['asset','Machine'],['group','Equipment group']].map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div><p className="dt-muted">Click a contributor to filter the table. Percentages and cumulative share use the same {rows.length} records and {total.toFixed(2)} hours.</p><div className="dt-bars">{pareto.map(row=><button type="button" key={row.key} className="dt-bar-button" disabled={row.key.startsWith('ended:')||row.key.startsWith('legacy:')} onClick={()=>contributor(row)}><span className="dt-bar-label"><span>{row.label}</span><strong>{row.hours.toFixed(2)} h</strong></span><div className="dt-bar-track"><div className="dt-bar-fill" style={{width:`${pareto[0]?.hours?row.hours/pareto[0].hours*100:0}%`}}/></div><small>{row.share.toFixed(1)}% · {row.cumulative.toFixed(1)}% cumulative · {row.eventCount} records</small></button>)}</div></section>
    </>}
    {audit&&<DowntimeDialog title={`Audit — ${audit.event.assetNumber||audit.event.assetId}`} onClose={()=>setAudit(null)}>{audit.rows.length?audit.rows.map(a=><article key={a.id} className="dt-panel"><strong>{a.action}</strong><p>{a.reason||'Initial capture'}</p><small>{stamp(a.at)} · {a.actor?.email||a.actor?.uid}</small></article>):<p>No audit entries for this legacy record.</p>}</DowntimeDialog>}
  </section>;
}
