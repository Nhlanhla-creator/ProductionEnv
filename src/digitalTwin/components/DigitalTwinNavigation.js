"use client"
import { useNavigate } from 'react-router-dom';
import { twinPath } from '../models/navigation';
import '../styles/Downtime.css';
export default function DigitalTwinNavigation({view}) {
  const navigate=useNavigate();
  const isSetup=['setupHome','assetSetup','shiftSetup','guide','assets','groups','setup','periods','import','packs','convert','measurements','grid'].includes(view);
  const active=['performance','analysis'].includes(view)?'kpis':['capture','records'].includes(view)?'capture':view;
  const link=(key,label,on)=> <button key={key} type="button" className={`dt-button ${on?'dt-button-primary':''}`} aria-current={on?'page':undefined} onClick={()=>navigate(twinPath(key))}>{label}</button>;
  return <nav className="dt-panel" aria-label="Workspace navigation"><div className="dt-actions">{link('setupHome','Setup',isSetup)}{link('performance','Operations Performance',!isSetup&&view!=='home')}</div>
    {isSetup?<div className="dt-actions" style={{marginTop:14}}>{[['guide','Operating structure'],['assetSetup','Asset Setup'],['shiftSetup','Shift Setup'],['import','Data imports'],['packs','Sector packs']].map(([key,label])=>link(key,label,key==='assetSetup'?['assetSetup','assets','groups','setup'].includes(view):key==='shiftSetup'?['shiftSetup','measurements','grid'].includes(view):view===key))}</div>:view!=='home'&&<div className="dt-actions" style={{marginTop:14}}>{[['kpis','KPI Summary'],['supplyChain','Supply Chain'],['delivery','Delivery'],['safety','Safety'],['capture','Downtime'],['capacity','Capacity']].map(([key,label])=>link(key,label,key===active))}</div>}
  </nav>;
}
