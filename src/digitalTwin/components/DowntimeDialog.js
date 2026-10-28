"use client"
import { useEffect,useRef } from 'react';
import '../styles/Downtime.css';
export default function DowntimeDialog({ title,children,onClose,busy=false }) {
  const ref=useRef(null),state=useRef({onClose,busy});state.current={onClose,busy};
  useEffect(() => {
    const previous=document.activeElement,root=ref.current;
    const focusable=() => [...root.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')];
    (root.querySelector('[data-autofocus]') || focusable()[0] || root).focus();
    const handle=e => {
      if(e.key==='Escape' && !state.current.busy){e.preventDefault();state.current.onClose();}
      if(e.key==='Tab'){
        const all=focusable(),first=all[0],last=all[all.length-1];
        if(!all.length){e.preventDefault();root.focus();}
        else if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
        else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
      }
    };
    const oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';root.addEventListener('keydown',handle);
    return () => {document.body.style.overflow=oldOverflow;root.removeEventListener('keydown',handle);previous?.focus?.();};
  },[]);
  return <div className="dt-dialog-backdrop"><div ref={ref} className="dt-dialog" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
    <div className="dt-panel-head"><h3>{title}</h3><button className="dt-button dt-button-small" type="button" aria-label="Close dialog" disabled={busy} onClick={onClose}>Close</button></div>{children}
  </div></div>;
}
