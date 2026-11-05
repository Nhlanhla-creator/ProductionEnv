"use client"
import { useEffect,useState } from 'react';
import { useLocation,useNavigate } from 'react-router-dom';
import { auth } from '../../firebaseConfig';
import { getTenant } from '../services/hierarchyService';
import { getDowntimeEvent } from '../services/downtimeService';
import { twinPath,twinView } from '../models/navigation';
import DigitalTwinNavigation from './DigitalTwinNavigation';
import AssetRegister from './AssetRegister';
import EquipmentGroupManager from './EquipmentGroupManager';
import ShiftSetup from './ShiftSetup';

import ImportCentre from './ImportCentre';
import ReportingPeriodManager from './ReportingPeriodManager';
import FirstRunWizard from './FirstRunWizard';
import CommandCentreHandoff from './CommandCentreHandoff';
import DowntimeMasterSetup from './DowntimeMasterSetup';
import DowntimeOperations from './DowntimeOperations';
import DowntimeRecords from './DowntimeRecords';
import KpiSummary from './KpiSummary';
import AssetLocationReview from './AssetLocationReview';
import CapacityReadinessPanel from './CapacityReadinessPanel';
import SectorPackLoader from './SectorPackLoader';
import CapabilityToTwinConverter from './CapabilityToTwinConverter';
import OperationalPerformance from '../../smses/MyGrowthTools/OperationalStrength';
import '../styles/Downtime.css';
const setupCards=[['guide','Operating structure','Configure the organisation, operating sites and contracts.'],['assetSetup','Asset Setup','Asset Register, Equipment Groups and Master Codes.'],['shiftSetup','Shift Setup','Configure shifts and capture machine-shift data in one workflow.'],['import','Data imports','Templates, preview and validated imports.'],['packs','Sector packs','Activate sector configuration for your operation.']];
const assetCards=[['assets','Asset Register','Register machines and their operating locations.'],['groups','Equipment Groups','Organise fleets, circuits and shared equipment groups.'],['setup','Master Codes','Configure, assign and publish downtime reasons.']];
function Cards({rows,onPick}){return <div className="dt-grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))'}}>{rows.map(([key,label,description])=><button type="button" key={key} className="dt-panel dt-nav-card" onClick={()=>onPick(key)}><strong>{label}</strong><p className="dt-muted">{description}</p><span>Open →</span></button>)}</div>;}
export default function DigitalTwinHome({initialActive=null}) {
  const location=useLocation(),navigate=useNavigate(),view=twinView(location.pathname,location.search,initialActive);
  const [user,setUser]=useState(null),[authReady,setAuthReady]=useState(false),[tenant,setTenant]=useState(null),[error,setError]=useState(''),[handoff,setHandoff]=useState(false);
  const [correction,setCorrection]=useState(null),[eventLoading,setEventLoading]=useState(false);
  const query=new URLSearchParams(location.search),assetId=query.get('assetId')||'',eventId=query.get('eventId')||'';
  useEffect(()=>auth.onAuthStateChanged(u=>{setUser(u);setAuthReady(true);setTenant(null);setError('');setHandoff(false);}),[]);
  useEffect(()=>{let live=true;if(user?.uid)getTenant(user.uid).then(t=>{if(live)setTenant(t);}).catch(e=>{if(live)setError(e.message);});return()=>{live=false;};},[user?.uid]);
  useEffect(()=>{let live=true;setCorrection(null);setEventLoading(!!eventId&&view==='capture');if(user?.uid&&eventId&&view==='capture')getDowntimeEvent(user.uid,eventId).then(e=>{if(live){if(!e)throw new Error('Downtime event not found.');setCorrection(e);}}).catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setEventLoading(false);});return()=>{live=false;};},[user?.uid,eventId,view]);
  const go=(key,context={})=>{setHandoff(false);setError('');navigate(twinPath(key,context));};
  if(!authReady)return <div className="dt-empty">Loading your account…</div>;
  if(!user)return <div className="dt-notice">Sign in to open Setup and Operations.</div>;
  const id=user.uid,back=()=>go(['assets','groups','setup'].includes(view)?'assetSetup':'setupHome');
  const edit=correction&&(correction.eventId||correction.id)===eventId?correction:null;
  let content;
  if(handoff)content=<CommandCentreHandoff tenantId={id} onOpenCommandCentre={()=>go('performance')} onOpenAssets={()=>go('assets')} onOpenMasterCodes={()=>go('setup')}/>;
  else if(view==='guide')content=<FirstRunWizard tenantId={id} onCancel={back} onComplete={()=>setHandoff(true)}/>;
  else if(view==='assetSetup')content=<><div className="dt-heading"><div><h2>Asset Setup</h2><p>Register machines, organise equipment groups and configure Master Codes.</p></div></div><Cards rows={assetCards} onPick={go}/></>;
  else if(view==='shiftSetup'||view==='measurements'||view==='grid')content=<ShiftSetup key={view} tenantId={id} initialView={view==='shiftSetup'?'definitions':'capture'} onNavigate={go}/>;
  else if(view==='assets')content=<AssetRegister key={assetId} tenantId={id} initialAssetId={assetId} onBack={back} onWorkspaceNavigate={go}/>;
  else if(view==='groups')content=<EquipmentGroupManager tenantId={id} onBack={back}/>;
  else if(view==='setup')content=<DowntimeMasterSetup tenantId={id} onBack={back} onNavigate={go}/>;
  else if(view==='packs')content=<SectorPackLoader tenantId={id} onBack={back}/>;
  else if(view==='convert')content=<CapabilityToTwinConverter tenantId={id} onBack={back}/>;
  else if(view==='periods')content=<ReportingPeriodManager tenantId={id} onBack={back}/>;
  else if(view==='import')content=<ImportCentre tenantId={id} onBack={back}/>;
  else if(view==='capture')content=(eventLoading||(eventId&&!edit&&!error))?<div className="dt-empty">Loading downtime…</div>:eventId&&!edit?<div className="dt-notice">The selected event could not be loaded. <button className="dt-button" onClick={()=>go('capture')}>View ongoing downtime</button></div>:<DowntimeOperations key={location.search} tenantId={id} defaultAssetId={assetId} initialEvent={edit} startRecording={query.get('view')==='record'} onNavigate={go}/>;
  else if(view==='records')content=<DowntimeRecords key={location.search} tenantId={id} initialAssetId={assetId} initialRange={{from:query.get('from')||'',to:query.get('to')||'',siteId:query.get('siteId')||'',shiftId:query.get('shiftId')||'',groupId:query.get('groupId')||'',contractId:query.get('contractId')||'',activityId:query.get('activityId')||'',serviceId:query.get('serviceId')||'',crew:query.get('crew')||''}} onNavigate={go} onCorrect={e=>go('capture',{assetId:e.assetId,eventId:e.eventId||e.id})} onOpenAsset={aid=>go('assets',{assetId:aid})}/>;
  else if(view==='kpis'||view==='performance')content=<KpiSummary tenantId={id} onNavigate={go}/>;
  else if(view==='capacity')content=<><AssetLocationReview tenantId={id} onNavigate={go}/><CapacityReadinessPanel tenantId={id} onBack={()=>go('kpis')}/></>;
  else if(['supplyChain','delivery','safety','analysis'].includes(view))content=<OperationalPerformance key={view} categoryId={{supplyChain:'supply-chain',delivery:'delivery',safety:'safety'}[view]||null} embedded/>;
  else if(view==='setupHome')content=<><div className="dt-heading"><div><h2>Setup</h2><p>Configure assets and shifts on separate pages. Capture downtime under Operations Performance.</p></div></div><Cards rows={setupCards} onPick={go}/></>;

  else content=<><div className="dt-heading"><div><h2>{tenant?.displayName||'Your operations'}</h2><p>Set up the structure once, then capture downtime and monitor performance every day.</p></div></div><Cards rows={[["setupHome","Setup","Operating structure, Asset Setup and Shift Setup."],["performance","Operations Performance","KPI Summary, Supply Chain, Delivery, Safety, Downtime and Capacity."]]} onPick={go}/></>;
  return <div className="dt-workspace" style={{maxWidth:1500,margin:'0 auto'}}><DigitalTwinNavigation view={view}/>{!['home','setupHome','assetSetup','shiftSetup','measurements','grid','guide','assets','groups','setup','periods','import','packs','convert'].includes(view)&&<div className="dt-heading"><div><h1>Operations Performance</h1></div></div>}{error&&<div role="alert" className="dt-notice dt-notice-error">{error}</div>}{content}</div>;
}
