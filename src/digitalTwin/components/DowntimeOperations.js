"use client"
import { useEffect,useState } from 'react';
import { closeDowntimeEvent } from '../services/downtimeService';
import DowntimeEventForm from './DowntimeEventForm';
import DowntimeDialog from './DowntimeDialog';
import DowntimeRecords from './DowntimeRecords';
import '../styles/Downtime.css';
const localTime=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,19);};
export default function DowntimeOperations({tenantId,defaultAssetId='',initialEvent=null,startRecording=false,onNavigate}) {
  const [error,setError]=useState(''),[recording,setRecording]=useState(!!defaultAssetId||!!initialEvent||startRecording),[closing,setClosing]=useState(null),[end,setEnd]=useState(''),[notes,setNotes]=useState(''),[status,setStatus]=useState('available'),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  useEffect(()=>{setRecording(!!defaultAssetId||!!initialEvent||startRecording);},[defaultAssetId,initialEvent,startRecording]);
  const openClose=e=>{setClosing(e);setEnd(localTime());setNotes('');setStatus('available');setError('');};
  const finish=async e=>{e.preventDefault();setBusy(true);setError('');try{
    if(!end||!Number.isFinite(new Date(end).getTime()))throw new Error('Enter the date and time the asset returned online.');
    if(new Date(end).getTime()>Date.now())throw new Error('The return-online time cannot be in the future.');
    await closeDowntimeEvent(tenantId,closing.eventId||closing.id,{eventEnd:new Date(end).toISOString(),actionTaken:notes,returnStatus:status,expectedVersion:closing.eventVersion});
    setMessage(`${closing.assetNumber||closing.assetId} is back online. Final downtime is saved in history.`);setClosing(null);
  }catch(err){setError(err.message);}finally{setBusy(false);}};
  if(recording)return <DowntimeEventForm tenantId={tenantId} defaultAssetId={defaultAssetId} initialEvent={initialEvent} onNavigate={(key,ctx)=>{if(key==='capture'){setRecording(false);onNavigate?.('capture');}else onNavigate?.(key,ctx);}} onBack={()=>{setRecording(false);onNavigate?.('capture');}} onSaved={()=>{setRecording(false);onNavigate?.('capture');}}/>;
  return <section>
    {message&&<div role="status" className="dt-notice dt-notice-success">{message}</div>}
    <DowntimeRecords tenantId={tenantId} onNavigate={onNavigate} onRecord={()=>{setRecording(true);setMessage('');}} onCloseEvent={openClose} onCorrect={e=>onNavigate?.('capture',{assetId:e.assetId,eventId:e.eventId||e.id})} onOpenAsset={assetId=>onNavigate?.('assets',{assetId})}/>
    {closing&&<DowntimeDialog title={`Back online — ${closing.assetNumber||closing.assetId}`} busy={busy} onClose={()=>setClosing(null)}><form onSubmit={finish}><label className="dt-field"><span>Returned online at *</span><input data-autofocus required type="datetime-local" step="1" value={end} onChange={e=>setEnd(e.target.value)}/></label><label className="dt-field"><span>Asset status after return</span><select value={status} onChange={e=>setStatus(e.target.value)}><option value="available">Available</option><option value="operating">Operating</option><option value="standby">Standby</option></select></label><label className="dt-field"><span>Action taken / notes</span><textarea maxLength={9000} value={notes} onChange={e=>setNotes(e.target.value)}/></label>{error&&<p role="alert" className="dt-notice dt-notice-error">{error}</p>}<div className="dt-footer"><button className="dt-button dt-button-primary" disabled={busy}>{busy?'Saving…':'Confirm back online'}</button></div></form></DowntimeDialog>}
  </section>;
}
