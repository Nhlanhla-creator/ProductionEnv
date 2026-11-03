"use client"
import { useEffect,useState } from 'react';
import { collection,onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { closeDowntimeEvent } from '../services/downtimeService';
import { elapsedHours } from '../models/downtimeCodes';
import DowntimeEventForm from './DowntimeEventForm';
import DowntimeDialog from './DowntimeDialog';
import DowntimeFlowNav from './DowntimeFlowNav';
import '../styles/Downtime.css';
const localTime=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,19);};
export default function DowntimeOperations({tenantId,defaultAssetId='',initialEvent=null,onNavigate}) {
  const [events,setEvents]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const [recording,setRecording]=useState(!!defaultAssetId||!!initialEvent),[closing,setClosing]=useState(null),[end,setEnd]=useState(''),[notes,setNotes]=useState(''),[status,setStatus]=useState('available'),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[asOf,setAsOf]=useState(Date.now());
  useEffect(()=>{setRecording(!!defaultAssetId||!!initialEvent);},[defaultAssetId,initialEvent]);
  useEffect(()=>{const t=setInterval(()=>setAsOf(Date.now()),1000);return()=>clearInterval(t);},[]);
  useEffect(()=>{
    if(!tenantId){setEvents([]);setLoading(false);return undefined;}
    setLoading(true);setError('');
    return onSnapshot(collection(db,'digitalTwinTenants',tenantId,'downtimeEvents'),s=>{
      setEvents(s.docs.map(d=>({...d.data(),id:d.id})).filter(e=>!e.eventEnd&&e.validationStatus!=='void').sort((a,b)=>Date.parse(a.eventStart)-Date.parse(b.eventStart)));setLoading(false);
    },e=>{setError(e.message);setLoading(false);});
  },[tenantId]);
  const openClose=e=>{setClosing(e);setEnd(localTime());setNotes('');setStatus('available');setError('');};
  const finish=async e=>{e.preventDefault();setBusy(true);setError('');try{
    if(!end||!Number.isFinite(new Date(end).getTime()))throw new Error('Enter the date and time the asset returned online.');
    if(new Date(end).getTime()>Date.now())throw new Error('The return-online time cannot be in the future.');
    await closeDowntimeEvent(tenantId,closing.eventId||closing.id,{eventEnd:new Date(end).toISOString(),actionTaken:notes,returnStatus:status,expectedVersion:closing.eventVersion});
    setMessage(`${closing.assetNumber||closing.assetId} is back online. Final downtime is saved in history.`);setClosing(null);
  }catch(err){setError(err.message);}finally{setBusy(false);}};
  if(recording)return <DowntimeEventForm tenantId={tenantId} defaultAssetId={defaultAssetId} initialEvent={initialEvent} onNavigate={(key,ctx)=>{if(key==='capture'){setRecording(false);onNavigate?.('capture');}else onNavigate?.(key,ctx);}} onBack={()=>{setRecording(false);onNavigate?.('capture');}} onSaved={()=>{setRecording(false);onNavigate?.('capture');}}/>;
  return <section className="dt-workspace"><div className="dt-topline">Operations / Downtime</div><DowntimeFlowNav current="capture" onNavigate={onNavigate}/>
    <div className="dt-heading"><div><h2>Downtime</h2><p>Start an event when equipment goes down. It stays ongoing until you mark the asset back online.</p></div><div className="dt-actions"><button className="dt-button" onClick={()=>onNavigate?.('records')}>History & analysis</button><button className="dt-button dt-button-primary" onClick={()=>{setRecording(true);setMessage('');}}>+ Record downtime</button></div></div>
    {error&&!closing&&<div role="alert" className="dt-notice dt-notice-error">{error}</div>}{message&&<div role="status" className="dt-notice dt-notice-success">{message}</div>}
    <div className="dt-stat-grid"><div className="dt-stat"><label>Assets currently down</label><strong>{new Set(events.map(e=>e.assetId)).size}</strong><small>Live ongoing events</small></div><div className="dt-stat"><label>Elapsed downtime</label><strong>{events.reduce((n,e)=>n+elapsedHours(e,asOf),0).toFixed(2)} h</strong><small>Provisional asset-hours to now</small></div></div>
    {loading?<div className="dt-empty">Loading ongoing downtime…</div>:events.length?<div className="dt-grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))'}}>{events.map(e=><article key={e.id} className="dt-panel"><div className="dt-panel-head"><strong>{e.assetNumber||e.assetId}</strong><span className="dt-badge dt-badge-amber">Ongoing</span></div><h3>{e.assetName||'Registered asset'}</h3><p>{e.classificationPath?.slice(-1)[0]?.label||e.categoryLevel2||'Legacy downtime'}</p><p className="dt-muted">Started {new Date(e.eventStart).toLocaleString()}<br/>{e.planned?'Planned':'Unplanned'} · {e.categoryLevel2||'Unclassified'}</p><strong className="dt-numeric" style={{fontSize:28}}>{elapsedHours(e,asOf).toFixed(2)} h</strong><p className="dt-muted">Still running — final hours are saved when the asset returns online.</p><div className="dt-actions"><button className="dt-button dt-button-primary" onClick={()=>openClose(e)}>Mark back online</button><button className="dt-button" onClick={()=>onNavigate?.('assets',{assetId:e.assetId})}>View asset</button></div></article>)}</div>:<div className="dt-empty"><strong>All clear — no ongoing downtime</strong>Select Record downtime to choose an asset from your register.</div>}
    {closing&&<DowntimeDialog title={`Back online — ${closing.assetNumber||closing.assetId}`} busy={busy} onClose={()=>setClosing(null)}><form onSubmit={finish}><label className="dt-field"><span>Returned online at *</span><input data-autofocus required type="datetime-local" step="1" value={end} onChange={e=>setEnd(e.target.value)}/></label><label className="dt-field"><span>Asset status after return</span><select value={status} onChange={e=>setStatus(e.target.value)}><option value="available">Available</option><option value="operating">Operating</option><option value="standby">Standby</option></select></label><label className="dt-field"><span>Action taken / notes</span><textarea maxLength={9000} value={notes} onChange={e=>setNotes(e.target.value)}/></label>{error&&<p role="alert" className="dt-notice dt-notice-error">{error}</p>}<div className="dt-footer"><button className="dt-button dt-button-primary" disabled={busy}>{busy?'Saving…':'Confirm back online'}</button></div></form></DowntimeDialog>}
  </section>;
}
