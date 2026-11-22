"use client"
import { useNavigate } from 'react-router-dom';
import { twinPath } from '../models/navigation';
import '../styles/Downtime.css';
export default function DigitalTwinNavigation({view}) {
  const navigate=useNavigate();
  const isSetup=['setupHome','assetSetup','shiftSetup','shiftDefinitions','guide','assets','groups','setup','periods','import','packs','convert','measurements','grid'].includes(view);
  if(isSetup)return null;
  const active=['performance','analysis','kpis','capacity'].includes(view)?'delivery':['capture','records'].includes(view)?'capture':view;
  const link=(key,label,on)=> <button key={key} type="button" className={`dt-button ${on?'dt-button-primary':''}`} aria-current={on?'page':undefined} onClick={()=>navigate(twinPath(key))}>{label}</button>;
  if(view==='home')return null;
  return <nav className="dt-actions" aria-label="Operations sections" style={{marginBottom:20}}>
    {[['supplyChain','Supply Chain'],['delivery','Delivery'],['safety','Safety'],['capture','Downtime']].map(([key,label])=>link(key,label,key===active))}
  </nav>;
}
