"use client"
import { useEffect,useMemo,useState } from 'react';
import { listCaptureAssets } from '../services/downtimeService';
import { listShifts,saveShiftRow } from '../services/shiftCaptureService';
import { SHIFT_COMPONENTS,localDate,shiftWindow,validateShiftRow } from '../models/shiftCapture';
import { COMPONENT_CATALOGUE } from '../models/kpiSchema';
import '../styles/Downtime.css';
const empty=()=>({_id:`${Date.now()}-${Math.random()}`,assetId:'',operatorOrCrew:'',notes:'',...Object.fromEntries(SHIFT_COMPONENTS.map(k=>[k,'']))});
export default function InputSheetGrid({tenantId,onBack,initialRowCount=1}) {
  const [assets,setAssets]=useState([]),[shifts,setShifts]=useState([]),[date,setDate]=useState(localDate),[shiftId,setShiftId]=useState('day');
  const [rows,setRows]=useState(()=>Array.from({length:initialRowCount},empty)),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[message,setMessage]=useState('');
  useEffect(()=>{let live=true;setLoading(true);setError('');
    Promise.all([listCaptureAssets(tenantId,{includeInactive:true}),listShifts(tenantId)]).then(([a,s])=>{if(live){setAssets(a);setShifts(s);setShiftId(s.find(v=>v.active)?.id||'');}}).catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setLoading(false);});
    return()=>{live=false;};
  },[tenantId]);
  const shift=shifts.find(s=>s.id===shiftId);let window=null,windowError='';try{if(shift)window=shiftWindow(date,shift);}catch(e){windowError=e.message;}
  const errors=useMemo(()=>rows.map(row=>{const list=validateShiftRow(row,window?.hours||24);if(row.assetId&&rows.filter(r=>r.assetId===row.assetId).length>1)list.push('Use one row per machine and shift.');return list;}),[rows,window?.hours]);
  const update=(id,key,value)=>{setRows(old=>old.map(row=>row._id===id?{...row,[key]:value}:row));setMessage('');};
  const save=async()=>{
    setError('');setMessage('');
    if(!window||!shift?.active){setError(windowError||'Choose an active configured shift.');return;}
    if(errors.some(e=>e.length)){setError('Resolve the row issues before saving.');return;}
    setBusy(true);const savedIds=[],failures=[];
    try{
      for(const row of rows)try{await saveShiftRow(tenantId,{row,date,shift});savedIds.push(row._id);}catch(e){failures.push(`${assets.find(a=>(a.assetId||a.id)===row.assetId)?.internalNumber||row.assetId}: ${e.message}`);}
      setRows(old=>old.filter(row=>!savedIds.includes(row._id)));
      if(savedIds.length)setMessage(`${savedIds.length} machine-shift row(s) recorded. New measurements save together as draft; identical existing records are kept.`);
      if(failures.length)setError(failures.join(' '));
    }finally{setBusy(false);}
  };
  return <section className="dt-workspace">
    <div className="dt-heading"><div><h2>Shift data capture</h2><p>One row per machine and shift. Add rows for the grid workflow; the same fields and save rules apply.</p></div><div className="dt-actions">{onBack&&<button className="dt-button" disabled={busy} onClick={onBack}>Back</button>}<button className="dt-button" disabled={busy||loading} onClick={()=>setRows(old=>[...old,empty()])}>+ Add machine</button><button className="dt-button dt-button-primary" disabled={busy||loading||!rows.length} onClick={save}>{busy?'Saving…':'Save shift data'}</button></div></div>
    {error&&<div className="dt-notice dt-notice-error" role="alert">{error}</div>}{message&&<div className="dt-notice dt-notice-success" role="status">{message}</div>}
    <fieldset className="dt-panel" disabled={busy||loading}><div className="dt-asset-toolbar"><label className="dt-field"><span>Shift start date</span><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><label className="dt-field"><span>Configured shift</span><select value={shiftId} onChange={e=>setShiftId(e.target.value)}><option value="">Select shift</option>{shifts.filter(s=>s.active).map(s=><option key={s.id} value={s.id}>{s.name} · {s.startTime}–{s.endTime}</option>)}</select></label><p className="dt-muted">{shift?.timezone||'Configure a shift first'}{window?` · ${window.hours} hours`:''}<br/>The date is when the shift starts. Overnight shifts end the following day. KPI Summary includes approved measurements; review and approve the saved drafts below.</p></div>{windowError&&<p role="alert" className="dt-notice dt-notice-error">{windowError}</p>}</fieldset>
    {loading?<div className="dt-empty">Loading machines and shifts…</div>:<fieldset disabled={busy} className="dt-panel"><div className="dt-table-wrap"><table className="dt-table"><thead><tr><th>Machine</th>{SHIFT_COMPONENTS.map(k=><th key={k}>{COMPONENT_CATALOGUE[k]?.label||k}<small>{COMPONENT_CATALOGUE[k]?.unit}</small></th>)}<th>Crew</th><th>Notes</th><th>Row checks</th></tr></thead><tbody>{rows.map((row,i)=><tr key={row._id}><td><select aria-label={`Machine row ${i+1}`} value={row.assetId} onChange={e=>update(row._id,'assetId',e.target.value)}><option value="">Select machine</option>{assets.map(a=><option key={a.assetId||a.id} value={a.assetId||a.id}>{a.internalNumber} — {a.name}</option>)}</select><small>Site and group use the assignment effective on this shift date.</small></td>{SHIFT_COMPONENTS.map(k=><td key={k}><input aria-label={`${k} row ${i+1}`} style={{minWidth:90}} type="number" min="0" step="any" value={row[k]} onChange={e=>update(row._id,k,e.target.value)}/></td>)}<td><input aria-label={`Crew row ${i+1}`} value={row.operatorOrCrew} onChange={e=>update(row._id,'operatorOrCrew',e.target.value)}/></td><td><input aria-label={`Notes row ${i+1}`} value={row.notes} onChange={e=>update(row._id,'notes',e.target.value)}/></td><td><small>{errors[i]?.join(' ')||'Ready to save'}</small><button className="dt-button dt-button-small" onClick={()=>setRows(old=>old.filter(r=>r._id!==row._id))}>Remove</button></td></tr>)}</tbody></table></div>{!rows.length&&<div className="dt-empty">Add a machine to capture its shift.</div>}</fieldset>}
  </section>;
}
