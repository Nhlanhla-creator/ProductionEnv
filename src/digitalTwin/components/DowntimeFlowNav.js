"use client"
import '../styles/Downtime.css';
export default function DowntimeFlowNav({ current,onNavigate,disabled = false }) {
  const steps=[['assets','Asset register','Register your equipment'],['setup','Master codes','Configure & publish'],['capture','Capture downtime','Classify the event'],['records','Records & analysis','Review, drill down & export']];
  return <nav className="dt-stepper" aria-label="Downtime workflow">{steps.map(([key,title,description],i) => <button type="button" key={key} className="dt-step" disabled={disabled || !onNavigate} aria-current={key===current ? 'step' : undefined} onClick={() => onNavigate?.(key)}>
    <span className="dt-step-num">{i+1}</span><span><strong>{title}</strong><small>{description}</small></span>
  </button>)}</nav>;
}
