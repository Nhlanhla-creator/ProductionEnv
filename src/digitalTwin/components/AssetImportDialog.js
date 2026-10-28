"use client"
import { useState } from 'react';
import DowntimeDialog from './DowntimeDialog';
import { downloadAssetWorkbook,readAssetWorkbook,commitAssetRows } from '../services/assetWorkbookService';
export default function AssetImportDialog({tenantId,assets,groups,sites,onClose,onImported}) {
  const [preview,setPreview]=useState(null),[error,setError]=useState(''),[result,setResult]=useState(null),[busy,setBusy]=useState(false),[progress,setProgress]=useState('');
  const parse=async file=>{setBusy(true);setError('');setResult(null);try{setPreview(await readAssetWorkbook(file,{tenantId,assets,groups,sites}));}catch(e){setError(e.message);}finally{setBusy(false);}};
  const commit=async()=>{
    setBusy(true);setError('');try{const r=await commitAssetRows(tenantId,preview.prepared,{onProgress:(done,total)=>setProgress(`${done} / ${total}`)});setResult(r);setPreview(null);await onImported?.();}catch(e){setError(e.message);}finally{setBusy(false);}
  };
  return <DowntimeDialog title="Import your asset register" busy={busy} onClose={onClose}>
    <p className="dt-muted">Download the template, enter your assets, then upload Excel or CSV. You can review all rows before anything is saved.</p>
    <button className="dt-button" disabled={busy} onClick={()=>{try{downloadAssetWorkbook({groups,sites});}catch(e){setError(e.message);}}}>Download asset template</button>
    <label className="dt-field" style={{marginTop:18}}><span>Upload completed file</span><input type="file" accept=".xlsx,.xls,.csv" disabled={busy} onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)parse(file);}}/></label>
    {error&&<div className="dt-notice dt-notice-error" role="alert">{error}</div>}
    {preview&&<><p className="dt-muted">{preview.prepared.filter(r=>r.action==='create').length} new assets · {preview.prepared.filter(r=>r.action==='skip').length} identical rows to skip · {preview.errors.length} errors</p>
      {!!preview.errors.length&&<div className="dt-notice dt-notice-error" role="alert">{preview.errors.map(e=><div key={e.row}>Row {e.row}: {e.message}</div>)}</div>}
      <div className="dt-table-wrap"><table className="dt-table" style={{minWidth:400}}><thead><tr><th>ID</th><th>Name / type</th><th>Action</th></tr></thead><tbody>{preview.prepared.map(r=><tr key={r.row}><td>{r.resource.internalNumber}</td><td>{r.resource.name}<small>{r.resource.equipmentTypeId}</small></td><td>{r.action==='skip'?'Skip existing':'Create'}</td></tr>)}</tbody></table></div>
      <div className="dt-footer"><button className="dt-button dt-button-primary" disabled={busy||!!preview.errors.length||!preview.prepared.length} onClick={commit}>{busy?`Importing ${progress}`:'Confirm asset import'}</button></div></>}
    {result&&<div role="status" className={`dt-notice ${result.errors.length?'dt-notice-error':'dt-notice-success'}`}>{result.created} assets created. {result.skipped} identical rows skipped.{result.errors.map(e=><div key={e.row}>Stopped at row {e.row}: {e.message}</div>)}{result.errors.length>0&&<p>Earlier rows remain saved. Reload the register, resolve the error and upload again; identical rows are skipped.</p>}</div>}
  </DowntimeDialog>;
}
