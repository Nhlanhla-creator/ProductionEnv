"use client"
import { twinPath } from '../models/navigation';
import '../styles/Downtime.css';
export default function DowntimeFlowNav({current,onNavigate,disabled=false}) {
  const setup=['assets','setup'].includes(current);
  const items=setup?[['assets','Asset register'],['setup','Master Codes']]:[['capture','Downtime summary']];
  return <nav className="dt-actions" aria-label={setup?'Setup navigation':'Downtime operations navigation'}>{items.map(([key,label])=><button key={key} type="button" className={`dt-button ${key===current?'dt-button-primary':''}`} disabled={disabled||key===current} aria-current={key===current?'page':undefined} onClick={()=>onNavigate?onNavigate(key):window.location.assign(twinPath(key))}>{label}</button>)}</nav>;
}
