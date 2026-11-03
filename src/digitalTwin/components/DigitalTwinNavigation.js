"use client"
import { useNavigate } from 'react-router-dom';
import { twinPath } from '../models/navigation';
import '../styles/Downtime.css';
export default function DigitalTwinNavigation({view}) {
  const navigate=useNavigate();
  const isSetup=['setupHome','guide','assets','groups','setup','periods','import','packs','convert'].includes(view);
  const isDowntime=['capture','records'].includes(view);
  const link=(key,label,on)=><button type="button" className={`dt-button ${on?'dt-button-primary':''}`} aria-current={on?'page':undefined} disabled={key===view} onClick={()=>navigate(twinPath(key))}>{label}</button>;
  return <nav className="dt-panel" aria-label="Digital Twin navigation"><div className="dt-actions">
    {link('setupHome','Setup',isSetup)}<span className="dt-muted" style={{margin:0}}>Operations</span>
    {link('capture','Downtime',isDowntime)}{link('performance','Performance',!isSetup&&!isDowntime&&view!=='home')}
  </div><p className="dt-muted" style={{marginBottom:0}}>{isSetup?'Setup / Configure your operating structure, asset register and master codes':isDowntime?'Operations / Downtime — daily capture, ongoing events and history':view==='home'?'Configure once. Run and measure your operations every day.':'Operations / Performance'}</p></nav>;
}
