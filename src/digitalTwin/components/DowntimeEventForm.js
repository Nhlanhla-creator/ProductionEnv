"use client"
import { useEffect,useMemo,useState } from 'react';
import { createDowntimeEvent,correctDowntimeEvent,listDowntimeEvents,listCaptureAssets } from '../services/downtimeService';
import { listDowntimeMasters } from '../services/downtimeMasterService';
import { contextForDowntime } from '../services/resourceService';
import { appliesTo,childrenOf,DOWNTIME_HEADINGS,durationOf,canCaptureAsset,overlapping } from '../models/downtimeCodes';
import DowntimeFlowNav from './DowntimeFlowNav';
import DowntimeMasterSetup from './DowntimeMasterSetup';
import '../styles/Downtime.css';
const localInput=value=>{const d=value?new Date(value):new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,23);};
const blank=()=>({start:localInput(),end:'',notes:''});
const zoned=value=>{const d=new Date(value);if(!value||!Number.isFinite(d.getTime()))throw new Error('Enter valid start and end date-times.');return d.toISOString();};
export default function DowntimeEventForm({tenantId,defaultAssetId=null,initialEvent=null,onBack,onNavigate,onSaved}) {
  const [assets,setAssets]=useState([]),[masters,setMasters]=useState([]),[assetId,setAssetId]=useState(initialEvent?.assetId||defaultAssetId||'');
  const [masterId,setMasterId]=useState(''),[selected,setSelected]=useState([]),[form,setForm]=useState(()=>initialEvent?{start:localInput(initialEvent.eventStart),end:initialEvent.eventEnd?localInput(initialEvent.eventEnd):'',notes:initialEvent.notes||''}:blank());
  const [editing,setEditing]=useState(initialEvent),[reason,setReason]=useState(''),[events,setEvents]=useState([]),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[eventsLoading,setEventsLoading]=useState(false);
  const [lastSavedRange,setLastSavedRange]=useState(null);
  const [error,setError]=useState(''),[message,setMessage]=useState(''),[reload,setReload]=useState(0),[setup,setSetup]=useState(false),[dirty,setDirty]=useState(false);
  const timezone=Intl.DateTimeFormat().resolvedOptions().timeZone;
  useEffect(()=>{
    let live=true;setLoading(true);setError('');setAssets([]);setMasters([]);
    if(!tenantId){setLoading(false);return undefined;}
    Promise.all([listCaptureAssets(tenantId,{includeInactive:true}),listDowntimeMasters(tenantId)]).then(([a,m])=>{if(live){setAssets(a);setMasters(m);}}).catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setLoading(false);});
    return()=>{live=false;};
  },[tenantId,reload]);
  useEffect(()=>{setEditing(initialEvent);setAssetId(initialEvent?.assetId||defaultAssetId||'');setForm(initialEvent?{start:localInput(initialEvent.eventStart),end:initialEvent.eventEnd?localInput(initialEvent.eventEnd):'',notes:initialEvent.notes||''}:blank());setSelected([]);setMasterId('');setReason('');setDirty(false);setMessage('');},[tenantId,defaultAssetId,initialEvent]);
  useEffect(()=>{
    let live=true;setEvents([]);setEventsLoading(Boolean(tenantId&&assetId));
    if(!tenantId||!assetId)return undefined;
    listDowntimeEvents(tenantId,{assetId}).then(rows=>{if(live)setEvents(rows);}).catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setEventsLoading(false);});
    return()=>{live=false;};
  },[tenantId,assetId,reload]);
  const asset=assets.find(a=>(a.assetId||a.id)===assetId);
  const eligible=useMemo(()=>masters.filter(m=>asset&&m.published&&appliesTo(m.published.assignment,asset)),[masters,asset]);
  const master=eligible.find(m=>m.id===masterId)||(eligible.length===1?eligible[0]:null),nodes=master?.published.nodes||[];
  const path=selected.map(id=>nodes.find(n=>n.id===id)).filter(Boolean),final=path[path.length-1],terminal=path.length>=3&&final?.terminal;
  let timing=null,timeError='';try{if(form.start&&form.end)timing=durationOf(zoned(form.start),zoned(form.end));}catch(e){timeError=e.message;}
  const conflicts=timing?overlapping(events,timing.eventStart,timing.eventEnd,editing?.eventId||editing?.id||null):[];
  const update=patch=>{setForm(old=>({...old,...patch}));setDirty(true);setMessage('');};
  const navigate=key=>{if(dirty&&!window.confirm('Leave this unsaved downtime event?'))return;if(onNavigate)onNavigate(key,{assetId,...(lastSavedRange||{})});else if(key==='setup')setSetup(true);else if(key==='assets')onBack?.();};
  const submit=async e=>{
    e.preventDefault();setBusy(true);setError('');setMessage('');
    try{
      if(!asset)throw new Error('Select a registered asset.');
      const value=durationOf(zoned(form.start),zoned(form.end));
      if(editing)await correctDowntimeEvent(tenantId,editing.eventId||editing.id,{...value,notes:form.notes,timezone},{reason,expectedVersion:editing.eventVersion});
      else{
        if(!master||!terminal)throw new Error('Complete the classification through the last configured level.');
        const context=await contextForDowntime(tenantId,assetId,form.start.slice(0,10));
        await createDowntimeEvent(tenantId,{...value,assetId,masterListId:master.id,masterVersion:master.published.version,selectedCodeId:final.id,notes:form.notes,timezone,
          groupId:context.groupId||null,siteId:context.siteId||null,contractId:context.contractId||null,activityId:context.activityId||null,serviceId:context.serviceId||null});
      }
      const correction=Boolean(editing);setLastSavedRange({from:form.start.slice(0,10),to:form.end.slice(0,10)});setEditing(null);setReason('');setForm(blank());setDirty(false);setMessage(correction?'Correction saved. The original classification and an audit trail are retained.':'Downtime recorded. It is now available in Records & analysis.');
      setEvents(await listDowntimeEvents(tenantId,{assetId}));onSaved?.();
    }catch(e){setError(e.message);}finally{setBusy(false);}
  };
  if(setup)return <DowntimeMasterSetup tenantId={tenantId} onBack={()=>{setSetup(false);setSelected([]);setMasterId('');setReload(x=>x+1);}}/>;
  const savedPath=editing?.classificationPath||path.map(n=>({label:n.label}));
  return <section className="dt-workspace"><div className="dt-topline">Operations performance / Daily capture</div>
    <DowntimeFlowNav current="capture" disabled={busy} onNavigate={navigate}/>
    <div className="dt-heading"><div><h2>{editing?'Correct a downtime record':'Capture the delay. Understand the cause.'}</h2><p>Select the equipment, record the time and follow the published levels to the specific reason.</p></div><div className="dt-actions"><button className="dt-button" disabled={busy||loading} onClick={()=>{setSelected([]);setMasterId('');setReload(x=>x+1);}}>Refresh published codes</button></div></div>
    {error&&<div role="alert" className="dt-notice dt-notice-error">{error}</div>}{message&&<div role="status" className="dt-notice dt-notice-success">{message}{onNavigate&&<button className="dt-button dt-button-small" style={{marginLeft:10}} onClick={()=>navigate('records')}>View records →</button>}</div>}
    {loading&&<div className="dt-empty">Loading assets and published master lists…</div>}
    {!loading&&!assets.length&&<div className="dt-empty"><strong>Register your first asset</strong>The capture form uses equipment from your asset register.<div style={{marginTop:14}}><button className="dt-button" onClick={()=>navigate('assets')}>Go to asset register</button></div></div>}
    <form onSubmit={submit}><fieldset disabled={busy||loading||!tenantId}><div className="dt-grid"><main>
      <section className="dt-panel"><div className="dt-panel-head"><h3>01 / Equipment & timing</h3><span className="dt-badge">{timezone}</span></div>
        <label className="dt-field"><span>Asset ID & name <span aria-hidden="true">*</span></span><select required value={assetId} disabled={!!editing} onChange={e=>{setAssetId(e.target.value);setSelected([]);setMasterId('');setDirty(true);setMessage('');setError('');}}><option value="">Choose equipment from your register</option>{assets.map(a=><option key={a.id} value={a.assetId||a.id}>{a.internalNumber||a.assetId||a.id} — {a.name}{!canCaptureAsset(a)?' · History only':''}</option>)}</select></label>
        {asset&&<p className="dt-muted">{asset.equipmentTypeId?.split('.').pop().replace(/_/g,' ')}{asset.location?` · ${asset.location}`:''}{!canCaptureAsset(asset)?' · Inactive equipment: existing records may be corrected, but new capture is unavailable.':''}</p>}
        <div className="dt-fields" style={{marginTop:18}}><label className="dt-field"><span>Start date & time *</span><input type="datetime-local" step="0.001" required value={form.start} onChange={e=>update({start:e.target.value})}/></label><label className="dt-field"><span>End date & time *</span><input type="datetime-local" step="0.001" required value={form.end} onChange={e=>update({end:e.target.value})}/></label></div><p className="dt-muted" style={{marginBottom:0}}>Use dates and times in {timezone}. Events can cross midnight or span multiple days.</p>
        {timeError&&<div role="alert" className="dt-notice dt-notice-error">{timeError}</div>}{conflicts.length>0&&<div role="alert" className="dt-notice dt-notice-error">This overlaps {conflicts.length} existing downtime event(s) for the same asset. Review the timing before saving.</div>}
      </section>
      <section className="dt-panel"><div className="dt-panel-head"><div><h3>02 / Classify the downtime</h3><p className="dt-muted" style={{margin:0}}>Each level follows the selected parent.</p></div><button type="button" className="dt-button dt-button-small" onClick={()=>navigate('setup')}>Manage master codes</button></div>
        {editing?<div className="dt-notice">Historical classification is retained for this correction.<div className="dt-path">{editing.classificationPath?.map((p,i)=><span key={p.codeId}>{i+1}. {p.label}</span>)}</div></div>:<>
          <label className="dt-field" style={{marginBottom:18}}><span>Published master list *</span><select required value={master?.id||''} onChange={e=>{setMasterId(e.target.value);setSelected([]);setDirty(true);}}><option value="">{asset?'Select the applicable published list':'Select an asset first'}</option>{eligible.map(m=><option key={m.id} value={m.id}>{m.published.name} · Version {m.published.version}</option>)}</select></label>
          {asset&&!eligible.length&&!loading&&<div className="dt-notice">No published codes are assigned to this asset type or group. Assign a master list and publish it in Master codes.</div>}
          <div className="dt-levels">{DOWNTIME_HEADINGS.map((heading,i)=>{
            const parent=i?nodes.find(n=>n.id===selected[i-1]):null,ended=path.some(n=>n.terminal&&n.level<=i),enabled=!!master&&(!i||!!parent)&&!ended;
            const choices=enabled?childrenOf(nodes,parent?.id||null):[];
            return <div key={heading} className={`dt-level-row ${i===4?'dt-level-reason':''}`} data-selected={!!selected[i]}><span className="dt-level-number">{i+1}</span><label className="dt-field"><span>Level {i+1} — {heading}{enabled?' *':''}{i===4&&<span className="dt-badge dt-badge-dark">Downtime reason</span>}</span><select required={enabled} disabled={!enabled} value={selected[i]||''} onChange={e=>{setSelected([...selected.slice(0,i),e.target.value].filter(Boolean));setDirty(true);setMessage('');}}><option value="">{ended?`Not required — branch ends at Level ${final?.level}`:enabled?`Choose ${heading.toLowerCase()}`:i?'Choose the preceding level first':'Choose an asset and master list'}</option>{choices.map(n=><option key={n.id} value={n.id}>{n.label}{n.origin==='custom_unmapped'?' · Custom / Unmapped':''}</option>)}</select>{i===4&&<small>{ended?'The final configured selection is the saved reason for this shorter branch.':'Choose the specific reason, such as Engine Failure, No Parts Available or No Mechanic Available.'}</small>}</label></div>;
          })}</div>
        </>}
      </section>
      <section className="dt-panel"><h3>03 / Supporting notes</h3><p className="dt-muted">Add operational detail if useful. Notes do not replace the classification or selected reason.</p><label className="dt-field"><span>Notes <small>Optional</small></span><textarea rows={3} maxLength={10000} value={form.notes} onChange={e=>update({notes:e.target.value})} placeholder="What happened, what was needed, or what the next shift should know…"/></label>{editing&&<label className="dt-field" style={{marginTop:18}}><span>Reason for correction *</span><input required maxLength={10000} value={reason} onChange={e=>{setReason(e.target.value);setDirty(true);}} placeholder="Explain why this record is being corrected"/></label>}</section>
    </main><aside className="dt-sticky"><section className="dt-summary"><h3>Calculated downtime</h3><div className="dt-hours">{timing?timing.durationHours.toFixed(2):'0.00'}</div><small>hours · calculated automatically</small><dl><div><dt>Equipment</dt><dd>{asset?`${asset.internalNumber||asset.assetId} · ${asset.name}`:'No asset selected'}</dd></div><div><dt>Classification</dt><dd>{savedPath.length?savedPath.map(n=>n.label).join(' → '):'Complete the levels to classify this event.'}</dd></div><div><dt>Downtime reason</dt><dd>{editing?savedPath[savedPath.length-1]?.label:terminal?final.label:'Select the final configured code'}</dd></div><div><dt>Code version</dt><dd>{editing?`Historical version ${editing.masterVersion}`:master?`Published version ${master.published.version}`:'No published list selected'}</dd></div></dl></section>
      <section className="dt-panel"><h3>Save this event</h3><p className="dt-muted">The record keeps its classification and code version, even if labels change later.</p><button type="submit" className="dt-button dt-button-primary" style={{width:'100%'}} disabled={busy||!asset||!timing||eventsLoading||!!conflicts.length||(!editing&&(!terminal||!canCaptureAsset(asset)))}>{busy?'Saving…':editing?'Save audited correction':'Save downtime event'}</button>{editing&&<button className="dt-button" type="button" style={{width:'100%',marginTop:8}} onClick={()=>navigate('records')}>Cancel correction</button>}</section>
      <section className="dt-panel"><h3>Recent events for this asset</h3>{eventsLoading?<p className="dt-muted">Loading events…</p>:!events.length?<p className="dt-muted">No downtime recorded for this selection.</p>:events.slice(0,3).map(e=><div key={e.id} style={{borderBottom:'1px solid #eee7df',padding:'10px 0'}}><strong style={{fontSize:12}}>{e.classificationPath?.slice(-1)[0]?.label||e.categoryLevel2||'Legacy event'}</strong><p className="dt-muted" style={{margin:'4px 0'}}>{new Date(e.eventStart).toLocaleDateString()} · {e.durationHours==null?'Open':`${Number(e.durationHours).toFixed(2)} h`}</p></div>)}{onNavigate&&<button type="button" className="dt-button dt-button-text" onClick={()=>navigate('records')}>View all records →</button>}</section>
    </aside></div></fieldset></form>
  </section>;
}
