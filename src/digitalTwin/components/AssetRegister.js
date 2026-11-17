"use client"
import { useEffect,useMemo,useState } from 'react';
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
import { listDowntimeMasters } from '../services/downtimeMasterService';
import { appliesTo,canCaptureAsset } from '../models/downtimeCodes';
import { unitLabel } from '../models/units';
import '../styles/Downtime.css';
const EMPTY_FILTERS = { group: '', location: '', ownership: '', model: '', status: '' };
const FILTER_COLUMNS = [
  ['group', 'Equipment group'], ['location', 'Location'], ['ownership', 'Ownership status'],
  ['model', 'Model group'], ['status', 'Status'],
];
const labelCode = value => value?.replace(/_/g, ' ') || '—';
const assetMatches = (asset, search) => [
  asset.name, asset.internalNumber, asset.assetId, asset.id, asset.serialNumber,
  asset.registration, asset.equipmentTypeId, asset.modelGroup, asset.model,
].join(' ').toLowerCase().includes(search.trim().toLowerCase());

function RegisterFilter({ label, value, options, onChange }) {
  return <select aria-label={`Filter by ${label.toLowerCase()}`} value={value} onChange={event => onChange(event.target.value)}>
    <option value="">All</option>
    {options.map(option => <option key={option} value={option}>{option === '—' ? 'Unspecified' : option}</option>)}
  </select>;
}

export default function AssetRegister({tenantId,onBack,onWorkspaceNavigate,initialAssetId=''}) {
  const [reportAsset,setReportAsset]=useState(''),[reportRange,setReportRange]=useState(null);
  const [view,setView]=useState('assets'),[assets,setAssets]=useState([]),[groups,setGroups]=useState([]),[sites,setSites]=useState([]),[masters,setMasters]=useState([]);
  const [loading,setLoading]=useState(true),[reload,setReload]=useState(0),[error,setError]=useState(''),[message,setMessage]=useState('');
  const [search,setSearch]=useState(initialAssetId);
  const [filters,setFilters]=useState(EMPTY_FILTERS);
  const [form,setForm]=useState(null),[viewing,setViewing]=useState(null),[captureAsset,setCaptureAsset]=useState(null),[correction,setCorrection]=useState(null),[importing,setImporting]=useState(false);
  const [create,setCreate]=useState(null),[referenceName,setReferenceName]=useState(''),[busy,setBusy]=useState(false);
  useEffect(()=>{
    let live=true;setLoading(true);setError('');setAssets([]);setGroups([]);setSites([]);setMasters([]);
    if(!tenantId){setLoading(false);return undefined;}
    Promise.all([listResources(tenantId,{resourceKind:null}),listGroups(tenantId,{status:null}),listOperatingSites(tenantId,{activeOnly:false}),listDowntimeMasters(tenantId)]).then(([a,g,s,m])=>{if(live){setAssets(a);setGroups(g);setSites(s);setMasters(m);}}).catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setLoading(false);});
    return()=>{live=false;};
  },[tenantId,reload]);
  useEffect(()=>{setView('assets');setForm(null);setViewing(null);setCaptureAsset(null);setCorrection(null);setMessage('');setImporting(false);setCreate(null);setFilters(EMPTY_FILTERS);},[tenantId]);
  const navigate=(key,context={})=>{if(onWorkspaceNavigate){onWorkspaceNavigate(key,context);return;}setReportAsset(context.assetId||'');setReportRange(context.from?{from:context.from,to:context.to}:null);setView(key);setForm(null);setViewing(null);setCorrection(null);setCaptureAsset(null);if(key==='assets')setReload(x=>x+1);};
  const physical = useMemo(() => assets.filter(asset => asset.resourceKind === RESOURCE_KIND.ASSET), [assets]);
  const rows = useMemo(() => {
    const groupNames = new Map(groups.map(group => [group.id, group.name]));
    const siteNames = new Map(sites.map(site => [site.id, site.name]));
    return physical.map(asset => ({
      asset,
      group: groupNames.get(asset.equipmentGroupId) || '—',
      location: siteNames.get(asset.siteId) || asset.location || '—',
      ownership: labelCode(asset.ownershipType),
      model: asset.modelGroup || asset.model || '—',
      status: labelCode(asset.status),
    }));
  }, [physical, groups, sites]);
  const filtered = rows.filter(row => assetMatches(row.asset, search) &&
    FILTER_COLUMNS.every(([key]) => !filters[key] || filters[key] === row[key]));
  const filterOptions = key => [...new Set(rows.map(row => row[key]).concat(filters[key] || []).filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b)));
  const columnFilter = (key, label) => <th scope="col" key={key}>
    <span>{label}</span>
    <RegisterFilter label={label} value={filters[key]} options={filterOptions(key)}
      onChange={value => setFilters(current => ({ ...current, [key]: value }))}/>
  </th>;
  const save=async value=>{if(form?.assetId)await updateResource(tenantId,form.assetId,value);else await createResource(tenantId,value);setForm(null);setMessage('Asset saved. Its type, group and site are now available for downtime setup and capture.');setReload(x=>x+1);};
  const retire=async a=>{if(!window.confirm(`Retire ${a.name}? Historical records will be retained.`))return;setError('');try{await retireResource(tenantId,a.assetId||a.id);setReload(x=>x+1);}catch(e){setError(e.message);}};
  const addReference=async e=>{
    e.preventDefault();setBusy(true);setError('');try{if(create==='group')await createGroup(tenantId,{name:referenceName.trim(),status:'active'});else await createNode(tenantId,{nodeType:NODE_TYPES.SITE,name:referenceName.trim()});setCreate(null);setReferenceName('');setReload(x=>x+1);}catch(e){setError(e.message);}finally{setBusy(false);}
  };
  const capture=id=>{if(onWorkspaceNavigate){onWorkspaceNavigate('capture',{assetId:id});return;}const a=assets.find(a=>(a.assetId||a.id)===id);setCaptureAsset(id);setCorrection(null);setViewing(null);if(a&&!canCaptureAsset(a)){setReportAsset(id);setReportRange({from:'',to:''});setView('records');}else setView('capture');};
  const correct=e=>{setCorrection(e);setCaptureAsset(e.assetId);setView('capture');};
  if(view==='setup')return <DowntimeMasterSetup tenantId={tenantId} onBack={()=>navigate('assets')} onNavigate={navigate}/>;
  if(view==='capture')return <DowntimeEventForm key={correction?.eventId||correction?.id||captureAsset||'new'} tenantId={tenantId} defaultAssetId={captureAsset} initialEvent={correction} onBack={()=>navigate('assets')} onNavigate={navigate}/>;
  if(view==='records')return <DowntimeRecords initialRange={reportRange} initialAssetId={reportAsset} tenantId={tenantId} onNavigate={navigate} onCorrect={correct} onOpenAsset={id=>{const a=assets.find(a=>(a.assetId||a.id)===id);if(a){setViewing(a);setView('assets');}}}/>;
  if(viewing)return <AssetDetail tenantId={tenantId} asset={viewing} onBack={()=>{setViewing(null);setReload(x=>x+1);}} onNavigate={navigate}/>;
  if(form)return <div className="dt-workspace"><div className="dt-topline">Setup / Asset register</div><AssetForm tenantId={tenantId} initial={form.assetId?form:null} onSave={save} onCancel={()=>setForm(null)}/></div>;
  const active=physical.filter(canCaptureAsset),covered=active.filter(a=>masters.some(m=>m.published&&appliesTo(m.published.assignment,a)));
  const hasFilters = !!search || Object.values(filters).some(Boolean);
  return <section className="dt-workspace"><div className="dt-topline">Setup / Asset register</div>
    <div className="dt-heading"><div><h2>Asset Register</h2></div><div className="dt-actions">{onBack&&<button className="dt-button" onClick={onBack}>← Back</button>}<button className="dt-button" disabled={loading||!tenantId} onClick={()=>setImporting(true)}>Import assets</button><button className="dt-button dt-button-primary" disabled={!tenantId} onClick={()=>setForm({})}>+ Add asset</button></div></div>
    {error&&<div className="dt-notice dt-notice-error" role="alert">{error}</div>}{message&&<div className="dt-notice dt-notice-success" role="status">{message}</div>}
    <p className="dt-muted" aria-label="Register totals">{physical.length} registered · {active.length} active · {covered.length} capture-ready · {groups.filter(g=>g.status==='active').length} equipment groups</p>
    <div className="dt-panel"><div className="dt-panel-head"><h3>Equipment & resources</h3><div className="dt-actions"><button className="dt-button dt-button-small" disabled={!tenantId} onClick={()=>{setReferenceName('');setCreate('group');}}>+ Asset group</button><button className="dt-button dt-button-small" disabled={!tenantId} onClick={()=>{setReferenceName('');setCreate('site');}}>+ Site / location</button><button className="dt-button dt-button-small" disabled={loading} onClick={()=>setReload(x=>x+1)}>Refresh</button></div></div>
      <div className="dt-actions dt-register-filter-actions">
        <button type="button" className="dt-button dt-button-small" disabled={!hasFilters}
          onClick={() => { setSearch(''); setFilters(EMPTY_FILTERS); }}>Clear filters</button>
      </div>
      <div className="dt-table-wrap">
        <table className="dt-table dt-register-table">
          <thead>
            <tr>
              <th scope="col">
                <span>Equipment / Asset ID</span>
                <input type="search" aria-label="Search equipment or asset ID" value={search}
                  onChange={event => setSearch(event.target.value)} placeholder="Name, asset ID or serial…"/>
              </th>
              {FILTER_COLUMNS.slice(0, 3).map(([key, label]) => columnFilter(key, label))}
              <th scope="col">Capacity / unit</th>
              {FILTER_COLUMNS.slice(3).map(([key, label]) => columnFilter(key, label))}
              <th scope="col">Downtime setup</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>{filtered.map(({ asset: a, group, location, ownership, model, status }) => {
            const id = a.internalNumber || a.assetId || a.id;
            const published = masters.filter(master => master.published && appliesTo(master.published.assignment, a));
            const capturable = canCaptureAsset(a);
            const capacity = [a.currentDeratedCapacity ?? a.nameplateCapacity, a.canonicalUnit ? unitLabel(a.canonicalUnit) : '']
              .filter(value => value != null && value !== '').join(' ');
            return <tr key={a.id}>
              <td>
                <button type="button" className="dt-button dt-button-text" onClick={() => setViewing(a)}>
                  <strong>{a.name || id}</strong>
                </button>
                <small>{id}{a.serialNumber ? ` · SN ${a.serialNumber}` : ''}</small>
              </td>
              <td>{group}</td><td>{location}</td><td>{ownership}</td><td>{capacity || '—'}</td><td>{model}</td>
              <td><span className={`dt-badge ${capturable ? 'dt-badge-green' : ''}`}>{status}</span></td>
              <td><button type="button" className="dt-button dt-button-small" onClick={() => navigate('setup')}>
                {published.length ? `${published.length} published list${published.length === 1 ? '' : 's'}` : 'Assign master codes →'}
              </button></td>
              <td><div className="dt-actions">
                <button type="button" className="dt-button dt-button-small" onClick={() => capture(a.assetId || a.id)}>
                  {capturable ? 'Record downtime' : 'View history'}
                </button>
                <button type="button" className="dt-button dt-button-small" onClick={() => setForm(a)}>Edit</button>
                <button type="button" className="dt-button dt-button-small" onClick={() => retire(a)}>Retire</button>
              </div></td>
            </tr>;
          })}</tbody>
        </table>
      </div>
      {loading ? <div className="dt-empty">Loading the register…</div> : !filtered.length && <div className="dt-empty">
        {physical.length ? <strong>No equipment matches these filters.</strong> :
          <><strong>No equipment registered yet.</strong>Save equipment in your diagram, add an asset or import a register.</>}
      </div>}
      <div className="dt-footer"><p className="dt-muted" style={{margin:0}}>{filtered.length} resources shown · asset IDs stay unique within this organisation.</p><button className="dt-button dt-button-primary" onClick={()=>navigate('setup')}>Open Master Codes →</button></div>
    </div>
    {importing&&<AssetImportDialog tenantId={tenantId} assets={physical} groups={groups} sites={sites} onClose={()=>setImporting(false)} onImported={async()=>{const latest=await listResources(tenantId,{resourceKind:null});setAssets(latest);}}/>}
    {create&&<DowntimeDialog title={create==='group'?'Create asset group':'Create site / location'} busy={busy} onClose={()=>setCreate(null)}><form onSubmit={addReference}><label className="dt-field"><span>{create==='group'?'Group name':'Site name'}</span><input data-autofocus required maxLength={120} value={referenceName} onChange={e=>setReferenceName(e.target.value)}/></label>{error&&<p className="dt-notice dt-notice-error">{error}</p>}<div className="dt-footer"><button className="dt-button dt-button-primary" disabled={busy}>Create {create==='group'?'group':'site'}</button></div></form></DowntimeDialog>}
  </section>;
}
