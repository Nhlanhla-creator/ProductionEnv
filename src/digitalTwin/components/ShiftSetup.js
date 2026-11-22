"use client"
import { useEffect,useState } from 'react';
import { listShifts,saveShift } from '../services/shiftCaptureService';
import { getOnboardingState } from '../services/onboardingState';
import { listOperatingSites } from "../services/resourceService"
import { structureOptions, uniqueChoices } from "../models/operatingStructure"
import { listPeople } from '../services/teamService';
import TeamPeople from './TeamPeople';
import ShiftAttendance from './ShiftAttendance';
import '../styles/Downtime.css';
export default function ShiftSetup({tenantId,initialView='people',onNavigate}) {
  const [shifts,setShifts]=useState([]),[editing,setEditing]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [sites,setSites]=useState([]);
  const [people,setPeople]=useState([]),[roles,setRoles]=useState({}),[loading,setLoading]=useState(true);
  useEffect(()=>{
    let live=true;
    Promise.all([listShifts(tenantId),listPeople(tenantId),getOnboardingState(tenantId),listOperatingSites(tenantId)])
      .then(([rows,roster,state,siteRows])=>{if(live){setShifts(rows);setPeople(roster);setSites(siteRows);
        const form=state.structureDraft||{}, opts=structureOptions(form.sectorPack);
        const graphRoles=(state.operatingDiagram?.nodes||[]).flatMap(n=>n.attributes?.roles||[]);
        setRoles(Object.fromEntries(['technical','nonTechnical'].map(key=>[key,uniqueChoices([...(opts[key]||[]),...(form[key]||[]),
          ...graphRoles.filter(r=>r.category===key).map(r=>({id:r.id,name:r.role}))])])))
      }})
      .catch(failure=>{if(live)setError(failure.message);})
      .finally(()=>{if(live)setLoading(false);});
    return()=>{live=false;};
  },[tenantId]);
  const save=async e=>{e.preventDefault();setBusy(true);setError('');try{await saveShift(tenantId,editing);setShifts(await listShifts(tenantId));setEditing(null);}catch(e){setError(e.message);}finally{setBusy(false);}};
  const tabs=[['people','shiftSetup','People setup'],['definitions','shiftDefinitions','Shift setup'],['capture','measurements','Shift data capture']];
  return <section>
    <div className="dt-topline">Setup / Team Setup</div>
    <div className="dt-heading"><h2>Team Setup</h2></div>
    <nav className="dt-actions" aria-label="Team Setup">{tabs.map(([key,route,label])=>
      <button type="button" key={key} className={`dt-button ${initialView===key?'dt-button-primary':''}`}
        aria-current={initialView===key?'page':undefined} onClick={()=>onNavigate(route)}>{label}</button>)}</nav>
    {error&&<p role="alert" className="dt-notice dt-notice-error">{error}</p>}
    {loading ? <div className="dt-empty">Loading team setup…</div> : <div style={{marginTop:20}}>
    {initialView==='people' ? <TeamPeople tenantId={tenantId} people={people} roles={roles} sites={sites} onRefresh={async()=>setPeople(await listPeople(tenantId))}/>
      : initialView==='capture' ? <ShiftAttendance tenantId={tenantId} people={people} shifts={shifts}/>
      : <div className="dt-panel"><div className="dt-panel-head"><h3>Configured shifts</h3><button className="dt-button" onClick={()=>setEditing({id:'',name:'',startTime:'06:00',endTime:'18:00',timezone:'Africa/Johannesburg',active:true})}>+ Add shift</button></div><div className="dt-table-wrap"><table className="dt-table"><thead><tr><th>Shift</th><th>Start</th><th>End</th><th>Timezone</th><th>Status</th><th/></tr></thead><tbody>{shifts.map(s=><tr key={s.id}><td>{s.name}<small>{s.id}</small></td><td>{s.startTime}</td><td>{s.endTime}{s.endTime<=s.startTime?' (next day)':''}</td><td>{s.timezone}</td><td>{s.active?'Active':'Inactive'}</td><td><button className="dt-button" onClick={()=>setEditing({...s,existing:true})}>Edit</button></td></tr>)}</tbody></table></div><p className="dt-muted">Day and Night defaults are available initially. Saving a definition configures future capture; existing records keep their saved timestamps.</p>
      {editing&&<form onSubmit={save}><fieldset className="dt-panel" disabled={busy}><div className="dt-asset-toolbar">{[['id','Shift ID','text'],['name','Name','text'],['startTime','Start time','time'],['endTime','End time','time'],['timezone','Timezone','text']].map(([key,label,type])=><label key={key} className="dt-field"><span>{label}</span><input required type={type} disabled={key==='id'&&editing.existing} value={editing[key]} onChange={e=>setEditing(v=>({...v,[key]:e.target.value}))}/></label>)}<label><input type="checkbox" checked={editing.active} onChange={e=>setEditing(v=>({...v,active:e.target.checked}))}/> Active for capture</label></div><div className="dt-actions"><button className="dt-button dt-button-primary">{busy?'Saving…':'Save shift'}</button><button type="button" className="dt-button" onClick={()=>setEditing(null)}>Cancel</button></div></fieldset></form>}
    </div>}
    </div>}
  </section>;
}
