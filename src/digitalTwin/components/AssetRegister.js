"use client"
import { useEffect,useMemo,useState } from 'react';
import AssetForm from './AssetForm';
import AssetDetail from './AssetDetail';
import DowntimeMasterSetup from './DowntimeMasterSetup';
import DowntimeEventForm from './DowntimeEventForm';
import DowntimeRecords from './DowntimeRecords';
import DowntimeFlowNav from './DowntimeFlowNav';
import DowntimeDialog from './DowntimeDialog';
import AssetImportDialog from './AssetImportDialog';
import { RESOURCE_KIND } from '../models/assetSchema';
import { ASSET_STATUS,NODE_TYPES } from '../models/enums';
import { listResources,createResource,updateResource,retireResource,listGroups,createGroup,listOperatingSites } from '../services/resourceService';
import { createNode } from '../services/hierarchyService';
import { listDowntimeMasters } from '../services/downtimeMasterService';
import { appliesTo,canCaptureAsset } from '../models/downtimeCodes';
import '../styles/Downtime.css';
export default function AssetRegister({tenantId,onBack}) {
  const [reportAsset,setReportAsset]=useState(''),[reportRange,setReportRange]=useState(null);
  const [view,setView]=useState('assets'),[assets,setAssets]=useState([]),[groups,setGroups]=useState([]),[sites,setSites]=useState([]),[masters,setMasters]=useState([]);
  const [loading,setLoading]=useState(true),[reload,setReload]=useState(0),[error,setError]=useState(''),[message,setMessage]=useState('');
  const [search,setSearch]=useState(''),[kind,setKind]=useState('asset'),[status,setStatus]=useState(''),[group,setGroup]=useState('');
  const [form,setForm]=useState(null),[viewing,setViewing]=useState(null),[captureAsset,setCaptureAsset]=useState(null),[correction,setCorrection]=useState(null),[importing,setImporting]=useState(false);
  const [create,setCreate]=useState(null),[referenceName,setReferenceName]=useState(''),[busy,setBusy]=useState(false);
  useEffect(()=>{
    let live=true;setLoading(true);setError('');setAssets([]);setGroups([]);setSites([]);setMasters([]);
    if(!tenantId){setLoading(false);return undefined;}
    Promise.all([listResources(tenantId,{resourceKind:null}),listGroups(tenantId,{status:null}),listOperatingSites(tenantId,{activeOnly:false}),listDowntimeMasters(tenantId)]).then(([a,g,s,m])=>{if(live){setAssets(a);setGroups(g);setSites(s);setMasters(m);}}).catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setLoading(false);});
    return()=>{live=false;};
  },[tenantId,reload]);
  useEffect(()=>{setView('assets');setForm(null);setViewing(null);setCaptureAsset(null);setCorrection(null);setMessage('');setImporting(false);setCreate(null);},[tenantId]);
  const navigate=(key,context={})=>{setReportAsset(context.assetId||'');setReportRange(context.from?{from:context.from,to:context.to}:null);setView(key);setForm(null);setViewing(null);setCorrection(null);setCaptureAsset(null);if(key==='assets')setReload(x=>x+1);};
  const filtered=useMemo(()=>assets.filter(a=>(!kind||a.resourceKind===kind)&&(!status||a.status===status)&&(!group||a.equipmentGroupId===group)&&(!search||[a.name,a.internalNumber,a.serialNumber,a.registration,a.equipmentTypeId].join(' ').toLowerCase().includes(search.toLowerCase()))),[assets,kind,status,group,search]);
  const save=async value=>{if(form?.assetId)await updateResource(tenantId,form.assetId,value);else await createResource(tenantId,value);setForm(null);setMessage('Asset saved. Its type, group and site are now available for downtime setup and capture.');setReload(x=>x+1);};
  const retire=async a=>{if(!window.confirm(`Retire ${a.name}? Historical records will be retained.`))return;setError('');try{await retireResource(tenantId,a.assetId||a.id);setReload(x=>x+1);}catch(e){setError(e.message);}};
  const addReference=async e=>{
    e.preventDefault();setBusy(true);setError('');try{if(create==='group')await createGroup(tenantId,{name:referenceName.trim(),status:'active'});else await createNode(tenantId,{nodeType:NODE_TYPES.SITE,name:referenceName.trim()});setCreate(null);setReferenceName('');setReload(x=>x+1);}catch(e){setError(e.message);}finally{setBusy(false);}
  };
  const capture=id=>{const a=assets.find(a=>(a.assetId||a.id)===id);setCaptureAsset(id);setCorrection(null);setViewing(null);if(a&&!canCaptureAsset(a)){setReportAsset(id);setReportRange({from:'',to:''});setView('records');}else setView('capture');};
  const correct=e=>{setCorrection(e);setCaptureAsset(e.assetId);setView('capture');};
  if(view==='setup')return <DowntimeMasterSetup tenantId={tenantId} onBack={()=>navigate('assets')} onNavigate={navigate}/>;
  if(view==='capture')return <DowntimeEventForm key={correction?.eventId||correction?.id||captureAsset||'new'} tenantId={tenantId} defaultAssetId={captureAsset} initialEvent={correction} onBack={()=>navigate('assets')} onNavigate={navigate}/>;
  if(view==='records')return <DowntimeRecords initialRange={reportRange} initialAssetId={reportAsset} tenantId={tenantId} onNavigate={navigate} onCorrect={correct} onOpenAsset={id=>{const a=assets.find(a=>(a.assetId||a.id)===id);if(a){setViewing(a);setView('assets');}}}/>;
  if(viewing)return <AssetDetail tenantId={tenantId} asset={viewing} onBack={()=>{setViewing(null);setReload(x=>x+1);}} onNavigate={navigate}/>;
  if(form)return <div className="dt-workspace"><div className="dt-topline">Operations performance / Asset register</div><AssetForm tenantId={tenantId} initial={form.assetId?form:null} onSave={save} onCancel={()=>setForm(null)}/></div>;
  const physical=assets.filter(a=>a.resourceKind==='asset'),active=physical.filter(canCaptureAsset),covered=active.filter(a=>masters.some(m=>m.published&&appliesTo(m.published.assignment,a)));
  return <section className="dt-workspace"><div className="dt-topline">Operations performance / Asset register</div><DowntimeFlowNav current="assets" disabled={loading} onNavigate={navigate}/>
    <div className="dt-heading"><div><h2>Your equipment. One connected register.</h2><p>Register or import assets, group equipment and link each asset to its published downtime codes.</p></div><div className="dt-actions">{onBack&&<button className="dt-button" onClick={onBack}>← Back</button>}<button className="dt-button" disabled={loading||!tenantId} onClick={()=>setImporting(true)}>Import assets</button><button className="dt-button dt-button-primary" disabled={!tenantId} onClick={()=>setForm({})}>+ Add asset</button></div></div>
    {error&&<div className="dt-notice dt-notice-error" role="alert">{error}</div>}{message&&<div className="dt-notice dt-notice-success" role="status">{message}</div>}
    <div className="dt-stat-grid"><div className="dt-stat"><label>Registered assets</label><strong>{physical.length}</strong><small>Unique equipment identities</small></div><div className="dt-stat"><label>Active equipment</label><strong>{active.length}</strong><small>Available for downtime capture</small></div><div className="dt-stat"><label>Capture-ready assets</label><strong>{covered.length}</strong><small>Assigned published master codes</small></div><div className="dt-stat"><label>Asset groups</label><strong>{groups.filter(g=>g.status==='active').length}</strong><small>Shared code assignments</small></div></div>
    <div className="dt-panel"><div className="dt-panel-head"><h3>Equipment & resources</h3><div className="dt-actions"><button className="dt-button dt-button-small" disabled={!tenantId} onClick={()=>{setReferenceName('');setCreate('group');}}>+ Asset group</button><button className="dt-button dt-button-small" disabled={!tenantId} onClick={()=>{setReferenceName('');setCreate('site');}}>+ Site / location</button><button className="dt-button dt-button-small" disabled={loading} onClick={()=>setReload(x=>x+1)}>Refresh</button></div></div>
      <div className="dt-asset-toolbar"><label className="dt-field" style={{flex:2}}><span>Search the register</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Asset ID, name, serial or type…"/></label><label className="dt-field"><span>Resource kind</span><select value={kind} onChange={e=>setKind(e.target.value)}>{Object.values(RESOURCE_KIND).map(k=><option key={k} value={k}>{k}</option>)}<option value="">All resources</option></select></label><label className="dt-field"><span>Status</span><select value={status} onChange={e=>setStatus(e.target.value)}><option value="">All statuses</option>{[...Object.values(ASSET_STATUS),'inactive'].map(s=><option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}</select></label><label className="dt-field"><span>Asset group</span><select value={group} onChange={e=>setGroup(e.target.value)}><option value="">All groups</option>{groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label></div>
      <div className="dt-table-wrap" style={{marginTop:20}}><table className="dt-table"><thead><tr><th>Asset ID / Name</th><th>Type</th><th>Group / Location</th><th>Status</th><th>Downtime setup</th><th>Actions</th></tr></thead><tbody>{filtered.map(a=>{const published=masters.filter(m=>m.published&&appliesTo(m.published.assignment,a));return <tr key={a.id}><td><button className="dt-button dt-button-text" onClick={()=>setViewing(a)}><strong>{a.internalNumber||a.assetId||a.id}</strong></button><small>{a.name}{a.serialNumber?` · SN ${a.serialNumber}`:''}</small></td><td>{a.equipmentTypeId?.split('.').pop().replace(/_/g,' ')||a.resourceKind}</td><td>{groups.find(g=>g.id===a.equipmentGroupId)?.name||'No group'}<small>{sites.find(s=>s.id===a.siteId)?.name||a.location||'No site assigned'}</small></td><td><span className={`dt-badge ${canCaptureAsset(a)?'dt-badge-green':''}`}>{a.status?.replace(/_/g,' ')}</span></td><td>{a.resourceKind==='asset'?<button className="dt-button dt-button-small" onClick={()=>navigate('setup')}>{published.length?`${published.length} published list${published.length===1?'':'s'}`:'Assign master codes →'}</button>:'Not an equipment asset'}</td><td><div className="dt-actions">{a.resourceKind==='asset'&&<button className="dt-button dt-button-small" onClick={()=>capture(a.assetId||a.id)}>{canCaptureAsset(a)?'Record downtime':'View history'}</button>}<button className="dt-button dt-button-small" onClick={()=>setForm(a)}>Edit</button><button className="dt-button dt-button-small" onClick={()=>retire(a)}>Retire</button></div></td></tr>;})}</tbody></table></div>
      {loading?<div className="dt-empty">Loading the register…</div>:!filtered.length&&<div className="dt-empty"><strong>No assets match this selection</strong>Add an asset or import your register to begin.</div>}
      <div className="dt-footer"><p className="dt-muted" style={{margin:0}}>{filtered.length} resources shown · asset IDs stay unique within this organisation.</p><button className="dt-button dt-button-primary" onClick={()=>navigate('setup')}>Continue to master codes →</button></div>
    </div>
    {importing&&<AssetImportDialog tenantId={tenantId} assets={physical} groups={groups} sites={sites} onClose={()=>setImporting(false)} onImported={async()=>{const latest=await listResources(tenantId,{resourceKind:null});setAssets(latest);}}/>}
    {create&&<DowntimeDialog title={create==='group'?'Create asset group':'Create site / location'} busy={busy} onClose={()=>setCreate(null)}><form onSubmit={addReference}><label className="dt-field"><span>{create==='group'?'Group name':'Site name'}</span><input data-autofocus required maxLength={120} value={referenceName} onChange={e=>setReferenceName(e.target.value)}/></label>{error&&<p className="dt-notice dt-notice-error">{error}</p>}<div className="dt-footer"><button className="dt-button dt-button-primary" disabled={busy}>Create {create==='group'?'group':'site'}</button></div></form></DowntimeDialog>}
  </section>;
}
