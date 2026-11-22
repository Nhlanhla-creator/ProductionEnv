"use client"
import { useEffect,useMemo,useState } from 'react';
import AssetRegisterTable from './AssetRegisterTable';
import AssetForm from './AssetForm';
import AssetDetail from './AssetDetail';
import DowntimeMasterSetup from './DowntimeMasterSetup';
import DowntimeEventForm from './DowntimeEventForm';
import DowntimeRecords from './DowntimeRecords';
import DowntimeDialog from './DowntimeDialog';
import AssetImportDialog from './AssetImportDialog';
import { RESOURCE_KIND } from '../models/assetSchema';
import { NODE_TYPES } from '../models/enums';
import { listResources,createResource,updateResource,retireResource,listGroups,createGroup,listOperatingSites } from '../services/resourceService';
import { createNode } from '../services/hierarchyService';
import { canCaptureAsset } from '../models/downtimeCodes';
import '../styles/Downtime.css';
export default function AssetRegister({tenantId,onBack,onWorkspaceNavigate,initialAssetId=''}) {
  const [reportAsset,setReportAsset]=useState(''),[reportRange,setReportRange]=useState(null);
  const [view,setView]=useState('assets'),[assets,setAssets]=useState([]),[groups,setGroups]=useState([]),[sites,setSites]=useState([]);
  const [loading,setLoading]=useState(true),[reload,setReload]=useState(0),[error,setError]=useState(''),[message,setMessage]=useState('');
  const [form,setForm]=useState(null),[viewing,setViewing]=useState(null),[captureAsset,setCaptureAsset]=useState(null),[correction,setCorrection]=useState(null),[importing,setImporting]=useState(false);
  const [create,setCreate]=useState(null),[referenceName,setReferenceName]=useState(''),[busy,setBusy]=useState(false);
  useEffect(()=>{
    let live=true;setLoading(true);setError('');setAssets([]);setGroups([]);setSites([]);
    if(!tenantId){setLoading(false);return undefined;}
    Promise.all([listResources(tenantId,{resourceKind:null}),listGroups(tenantId,{status:null}),listOperatingSites(tenantId,{activeOnly:false})]).then(([a,g,s])=>{if(live){setAssets(a);setGroups(g);setSites(s);}}).catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setLoading(false);});
    return()=>{live=false;};
  },[tenantId,reload]);
  useEffect(()=>{setView('assets');setForm(null);setViewing(null);setCaptureAsset(null);setCorrection(null);setMessage('');setImporting(false);setCreate(null);},[tenantId]);
  const navigate=(key,context={})=>{if(onWorkspaceNavigate){onWorkspaceNavigate(key,context);return;}setReportAsset(context.assetId||'');setReportRange(context.from?{from:context.from,to:context.to}:null);setView(key);setForm(null);setViewing(null);setCorrection(null);setCaptureAsset(null);if(key==='assets')setReload(x=>x+1);};
  const physical = useMemo(() => assets.filter(asset => asset.resourceKind === RESOURCE_KIND.ASSET), [assets]);
  const rows = useMemo(() => {
    const groupNames = new Map(groups.map(group => [group.id, group.name]));
    const siteNames = new Map(sites.map(site => [site.id, site.name]));
    return physical.map(asset => ({
      asset,
      group: groupNames.get(asset.equipmentGroupId) || "",
      location: siteNames.get(asset.siteId) || asset.location || "",
    }));
  }, [physical, groups, sites]);
  const save=async value=>{if(form?.assetId)await updateResource(tenantId,form.assetId,value);else await createResource(tenantId,value);setForm(null);setMessage('Asset saved. Its type, group and site are now available for downtime setup and capture.');setReload(x=>x+1);};
  const retire=async a=>{if(!window.confirm(`Retire ${a.name}? Historical records will be retained.`))return;setError('');try{await retireResource(tenantId,a.assetId||a.id);setReload(x=>x+1);}catch(e){setError(e.message);}};
  const addReference=async e=>{
    e.preventDefault();setBusy(true);setError('');try{if(create==='group')await createGroup(tenantId,{name:referenceName.trim(),status:'active'});else await createNode(tenantId,{nodeType:NODE_TYPES.SITE,name:referenceName.trim()});setCreate(null);setReferenceName('');setReload(x=>x+1);}catch(e){setError(e.message);}finally{setBusy(false);}
  };
  const capture=id=>{const a=assets.find(a=>(a.assetId||a.id)===id);if(onWorkspaceNavigate){onWorkspaceNavigate(a&&!canCaptureAsset(a)?'records':'capture',{assetId:id});return;}setCaptureAsset(id);setCorrection(null);setViewing(null);if(a&&!canCaptureAsset(a)){setReportAsset(id);setReportRange({from:'',to:''});setView('records');}else setView('capture');};
  const correct=e=>{setCorrection(e);setCaptureAsset(e.assetId);setView('capture');};
  if(view==='setup')return <DowntimeMasterSetup tenantId={tenantId} onBack={()=>navigate('assets')} onNavigate={navigate}/>;
  if(view==='capture')return <DowntimeEventForm key={correction?.eventId||correction?.id||captureAsset||'new'} tenantId={tenantId} defaultAssetId={captureAsset} initialEvent={correction} onBack={()=>navigate('assets')} onNavigate={navigate}/>;
  if(view==='records')return <DowntimeRecords initialRange={reportRange} initialAssetId={reportAsset} tenantId={tenantId} onNavigate={navigate} onCorrect={correct} onOpenAsset={id=>{const a=assets.find(a=>(a.assetId||a.id)===id);if(a){setViewing(a);setView('assets');}}}/>;
  if(viewing)return <AssetDetail tenantId={tenantId} asset={viewing} onBack={()=>{setViewing(null);setReload(x=>x+1);}} onNavigate={navigate}/>;
  if(form)return <div className="dt-workspace"><div className="dt-topline">Setup / Asset register</div><AssetForm tenantId={tenantId} initial={form.assetId?form:null} onSave={save} onCancel={()=>setForm(null)}/></div>;
  const active=physical.filter(canCaptureAsset);
  return <section className="dt-workspace"><div className="dt-topline">Setup / Asset register</div>
    <div className="dt-heading"><div><h2>Asset Register</h2></div><div className="dt-actions">{onBack&&<button className="dt-button" onClick={onBack}>← Back</button>}<button className="dt-button" disabled={loading||!tenantId} onClick={()=>setImporting(true)}>Import assets</button><button className="dt-button dt-button-primary" disabled={!tenantId} onClick={()=>setForm({})}>+ Add asset</button></div></div>
    {error&&<div className="dt-notice dt-notice-error" role="alert">{error}</div>}{message&&<div className="dt-notice dt-notice-success" role="status">{message}</div>}
    <p className="dt-muted" aria-label="Register totals">{physical.length} registered · {active.length} active · {groups.filter(g=>g.status==='active').length} equipment groups</p>
    <div className="dt-panel"><div className="dt-panel-head"><h3>Equipment & resources</h3><div className="dt-actions"><button className="dt-button dt-button-small" disabled={!tenantId} onClick={()=>{setReferenceName('');setCreate('group');}}>+ Equipment group</button><button className="dt-button dt-button-small" disabled={!tenantId} onClick={()=>{setReferenceName('');setCreate('site');}}>+ Site / location</button><button className="dt-button dt-button-small" disabled={loading} onClick={()=>setReload(x=>x+1)}>Refresh</button></div></div>
      <AssetRegisterTable key={`${tenantId}:${initialAssetId}`} tenantId={tenantId} rows={rows}
        initialAssetId={initialAssetId} loading={loading} onView={setViewing} onCapture={capture} onEdit={setForm} onRetire={retire}/>

    </div>
    {importing&&<AssetImportDialog tenantId={tenantId} assets={physical} groups={groups} sites={sites} onClose={()=>setImporting(false)} onImported={async()=>{const latest=await listResources(tenantId,{resourceKind:null});setAssets(latest);}}/>}
    {create&&<DowntimeDialog title={create==='group'?'Create equipment group':'Create site / location'} busy={busy} onClose={()=>setCreate(null)}><form onSubmit={addReference}><label className="dt-field"><span>{create==='group'?'Group name':'Site name'}</span><input data-autofocus required maxLength={120} value={referenceName} onChange={e=>setReferenceName(e.target.value)}/></label>{error&&<p className="dt-notice dt-notice-error">{error}</p>}<div className="dt-footer"><button className="dt-button dt-button-primary" disabled={busy}>Create {create==='group'?'group':'site'}</button></div></form></DowntimeDialog>}
  </section>;
}
