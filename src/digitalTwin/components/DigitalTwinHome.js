"use client"
import { useEffect,useState } from 'react';
import { useLocation,useNavigate } from 'react-router-dom';
import { auth } from '../../firebaseConfig';
import { getTenant } from '../services/hierarchyService';
import { getDowntimeEvent } from '../services/downtimeService';
import { twinPath,twinView } from '../models/navigation';
import DigitalTwinNavigation from './DigitalTwinNavigation';
import AssetSetup from './AssetSetup';
import EquipmentGroupManager from './EquipmentGroupManager';
import ShiftSetup from './ShiftSetup';
import InputSheetGrid from './InputSheetGrid';
import ShiftMeasurementReview from './ShiftMeasurementReview';

import ImportCentre from './ImportCentre';
import ReportingPeriodManager from './ReportingPeriodManager';
import FirstRunWizard from './FirstRunWizard';
import DowntimeOperations from './DowntimeOperations';
import OperationalDataSources from './OperationalDataSources';
import SectorPackLoader from './SectorPackLoader';
import CapabilityToTwinConverter from './CapabilityToTwinConverter';
import OperationalPerformance from '../../smses/MyGrowthTools/OperationalStrength';
import '../styles/Downtime.css';
import '../styles/BuilderForms.css';
function Cards({rows,onPick}){return <div className="dt-grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))'}}>{rows.map(([key,label,description])=><button type="button" key={key} className="dt-panel dt-nav-card" onClick={()=>onPick(key)}><strong>{label}</strong><p className="dt-muted">{description}</p><span>Open →</span></button>)}</div>;}
export default function DigitalTwinHome({initialActive=null}) {
  const location=useLocation(),navigate=useNavigate(),view=twinView(location.pathname,location.search,initialActive);
  const [user,setUser]=useState(null),[authReady,setAuthReady]=useState(false),[tenant,setTenant]=useState(null),[error,setError]=useState('');
  const [correction,setCorrection]=useState(null),[eventLoading,setEventLoading]=useState(false);
  const query=new URLSearchParams(location.search),assetId=query.get('assetId')||'',eventId=query.get('eventId')||'';
  useEffect(()=>auth.onAuthStateChanged(u=>{setUser(u);setAuthReady(true);setTenant(null);setError('');}),[]);
  useEffect(()=>{let live=true;if(user?.uid)getTenant(user.uid).then(t=>{if(live)setTenant(t);}).catch(e=>{if(live)setError(e.message);});return()=>{live=false;};},[user?.uid]);
  useEffect(()=>{let live=true;setCorrection(null);setEventLoading(!!eventId&&view==='capture');if(user?.uid&&eventId&&view==='capture')getDowntimeEvent(user.uid,eventId).then(e=>{if(live){if(!e)throw new Error('Downtime event not found.');setCorrection(e);}}).catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setEventLoading(false);});return()=>{live=false;};},[user?.uid,eventId,view]);
  const go=(key,context={})=>{setError('');navigate(twinPath(key,context));};
  if(!authReady)return <div className="dt-empty">Loading your account…</div>;
  if(!user)return <div className="dt-notice">Sign in to open Setup and Operations.</div>;
  const id=user.uid,back=()=>go(['assets','groups','setup'].includes(view)?'assetSetup':'setupHome');
  const edit=correction&&(correction.eventId||correction.id)===eventId?correction:null;
  let content;
  if(view==='guide')content=<FirstRunWizard key={id} tenantId={id} onCancel={back} onComplete={()=>go('assets')}/>;
  else if(view==='shiftSetup'||view==='shiftDefinitions'||view==='measurements')content=<ShiftSetup key={`${id}:${view}`} tenantId={id} initialView={{shiftSetup:'people',shiftDefinitions:'definitions',measurements:'capture'}[view]} onNavigate={go}/>;
  else if(view==='grid')content=<><InputSheetGrid tenantId={id}/><ShiftMeasurementReview tenantId={id}/></>;
  else if(view==='assetSetup'||view==='assets')content=<AssetSetup tenantId={id} assetId={assetId} onNavigate={go}/>;
  else if(view==='groups')content=<EquipmentGroupManager tenantId={id} onBack={back}/>;
  else if(view==='setup')content=<AssetSetup tenantId={id} tab="codes" masterId={query.get("masterId")||""} groupId={query.get("groupId")||""} onNavigate={go}/>;
  else if(view==='packs')content=<SectorPackLoader tenantId={id} onBack={back}/>;
  else if(view==='convert')content=<CapabilityToTwinConverter tenantId={id} onBack={back}/>;
  else if(view==='periods')content=<ReportingPeriodManager tenantId={id} onBack={back}/>;
  else if(view==='import')content=<><OperationalDataSources tenantId={id} onNavigate={go}/><ImportCentre tenantId={id} onBack={back}/></>;
  else if(view==='capture')content=(eventLoading||(eventId&&!edit&&!error))?<div className="dt-empty">Loading downtime…</div>:eventId&&!edit?<div className="dt-notice">The selected event could not be loaded. <button className="dt-button" onClick={()=>go('capture')}>View ongoing downtime</button></div>:<DowntimeOperations key={location.search} tenantId={id} defaultAssetId={assetId} initialEvent={edit} startRecording={query.get('view')==='record'} onNavigate={go}/>;
  else if(view==='records')content=<DowntimeOperations key={location.search} tenantId={id} defaultAssetId={assetId} outputOnly initialRange={{from:query.get('from')||'',to:query.get('to')||'',siteId:query.get('siteId')||'',shiftId:query.get('shiftId')||'',groupId:query.get('groupId')||'',contractId:query.get('contractId')||'',activityId:query.get('activityId')||'',serviceId:query.get('serviceId')||'',crew:query.get('crew')||''}} onNavigate={go}/>;
  else if(view==='kpis'||view==='performance')content=<OperationalPerformance categoryId="delivery" embedded/>;
  else if(view==='capacity')content=<OperationalPerformance categoryId="delivery" embedded/>;
  else if(view==='delivery')content=<OperationalPerformance categoryId="delivery" embedded/>;
  else if(['supplyChain','safety','analysis'].includes(view))content=<OperationalPerformance key={view} categoryId={{supplyChain:'supply-chain',delivery:'delivery',safety:'safety'}[view]||null} embedded/>;
  else if(view==='setupHome')content=<div className="dt-heading"><div><h2>Setup</h2><p>Choose an item under Setup in the sidebar.</p></div></div>;

  else content=<><div className="dt-heading"><div><h2>{tenant?.displayName||'Your operations'}</h2><p>Set up the structure once, then capture downtime and monitor performance every day.</p></div></div><Cards rows={[["setupHome","Setup","Operating structure, Asset Setup and Team Setup."],["performance","Operations Performance","Supply Chain, Delivery, Safety and Downtime."]]} onPick={go}/></>;
  return <div className="dt-workspace" style={{maxWidth:1500,margin:'0 auto'}}><DigitalTwinNavigation view={view}/>{error&&<div role="alert" className="dt-notice dt-notice-error">{error}</div>}{content}</div>;
}
