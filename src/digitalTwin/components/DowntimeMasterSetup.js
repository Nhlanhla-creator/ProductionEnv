"use client"
import { useEffect, useState } from 'react';
import { listDowntimeMasters,createDowntimeMaster,saveDowntimeMaster,getDowntimeAudit } from '../services/downtimeMasterService';
import { listCaptureAssets } from '../services/downtimeService';
import { listGroups } from '../services/resourceService';
import { downloadMasterWorkbook,readMasterWorkbook } from '../services/downtimeSpreadsheetService';
import { DOWNTIME_HEADINGS,childrenOf } from '../models/downtimeCodes';
const C = { ink:'#2d201c',muted:'#6b5b55',line:'#ded8d4',accent:'#4a352f',panel:'#faf8f7' };
const input = { padding:'9px 11px',border:`1px solid ${C.line}`,borderRadius:8,font:'inherit',color:C.ink,background:'white',boxSizing:'border-box',maxWidth:'100%' };
const button = { ...input,cursor:'pointer',fontSize:13 };
const primary = { ...button,background:C.accent,color:'white' };
const card = { border:`1px solid ${C.line}`,borderRadius:12,padding:18,marginBottom:16,background:'white' };
export default function DowntimeMasterSetup({ tenantId,onBack }) {
  const [masters,setMasters] = useState([]), [selected,setSelected] = useState('');
  const [draft,setDraft] = useState(null), [dirty,setDirty] = useState(false);
  const [assets,setAssets] = useState([]), [groups,setGroups] = useState([]);
  const [busy,setBusy] = useState(false), [message,setMessage] = useState(''),[error,setError] = useState('');
  const [name,setName] = useState('Mining — Mobile Equipment'),[mining,setMining] = useState(true),[industry,setIndustry] = useState('Mining');
  const [audit,setAudit] = useState(null),[editing,setEditing] = useState(null);
  const current = masters.find(m => m.id === selected);
  useEffect(() => {
    let live=true;
    setMasters([]);setSelected('');setDraft(null);setDirty(false);setError('');setAudit(null);setEditing(null);
    if (!tenantId) return undefined;
    setBusy(true);
    Promise.all([listDowntimeMasters(tenantId),listCaptureAssets(tenantId),listGroups(tenantId)]).then(([m,a,g]) => {
      if (!live) return;
      setMasters(m);setAssets(a);setGroups(g);
      if (m.length) { setSelected(m[0].id);setDraft(m[0].draft); }
    }).catch(e => { if(live) setError(e.message); }).finally(() => { if(live) setBusy(false); });
    return () => { live=false; };
  },[tenantId]);
  const change = value => { setDraft(value);setDirty(true);setMessage('');setAudit(null); };
  const act = async fn => {
    setBusy(true);setError('');setMessage('');
    try { await fn(); } catch(e) { setError(e.message); } finally { setBusy(false); }
  };
  const switchTo = id => {
    if (dirty && !window.confirm('Discard unsaved draft changes?')) return;
    setSelected(id);setDraft(masters.find(m => m.id === id)?.draft || null);setDirty(false);setEditing(null);setAudit(null);setError('');setMessage('');
  };
  const create = () => act(async () => {
    if(dirty && !window.confirm('Discard unsaved draft changes?')) return;
    const m = await createDowntimeMaster(tenantId,{ name,mining,industry });
    setMasters(old => [...old,m]);setSelected(m.id);setDraft(m.draft);setDirty(false);setEditing(null);setAudit(null);
    setMessage('Organisation copy created. Review, assign and publish it before capture.');
  });
  const save = publish => act(async () => {
    const m = await saveDowntimeMaster(tenantId,current.id,draft,current.revision,{ publish });
    setMasters(old => old.map(x => x.id === m.id ? m : x));setDraft(m.draft);setDirty(false);setEditing(null);
    setMessage(publish ? `Published version ${m.published.version}. Capture now uses this version.` : 'Draft saved. Capture continues using the last published version.');
  });
  const toggleBranch = node => {
    const ids = new Set([node.id]);
    for(let i=0;i<5;i++) draft.nodes.forEach(n => { if(ids.has(n.parentId)) ids.add(n.id); });
    // Reactivation only enables the chosen node. Enable its intended children individually.
    change({ ...draft,nodes:draft.nodes.map(n => node.active && ids.has(n.id) ? { ...n,active:false } : n.id === node.id ? { ...n,active:true } : n) });
  };
  const add = parent => {
    const level = parent.level+1;
    setEditing({ id:`org-${Date.now()}-${Math.random().toString(36).slice(2,10)}`,parentId:parent.id,level,label:'',
      canonicalId:null,standardLabel:null,origin:level===3 ? 'custom_unmapped' : 'organisation',active:true,terminal:level>=3,sortOrder:draft.nodes.length,isNew:true });
  };
  const applyEdit = e => {
    e.preventDefault();
    if(!editing.label.trim()) return;
    const { isNew,...value } = editing;
    const nodes = isNew ? [...draft.nodes.map(n => n.id === value.parentId ? { ...n,terminal:false } : n),value]
      : draft.nodes.map(n => n.id === value.id ? value : n);
    change({ ...draft,nodes });setEditing(null);
  };
  const renderNode = n => {
    const kids = childrenOf(draft.nodes,n.id,false);
    return <details key={n.id} open style={{ marginLeft:n.level===1 ? 0 : 16,marginTop:8,opacity:n.active ? 1 : 0.6 }}>
      <summary style={{ cursor:'pointer',padding:8,background:C.panel,borderRadius:6 }}>
        <strong>{n.label}</strong> <small>· L{n.level}{n.terminal ? ' · Final selection' : ''}{!n.active ? ' · Inactive' : ''}</small>
        {n.origin==='custom_unmapped' && <small style={{ color:'#92400e' }}> · Custom / Unmapped</small>}
        {n.level===3 && n.standardLabel && <small> · Reports as {n.standardLabel}</small>}
      </summary>
      <div style={{ display:'flex',gap:6,flexWrap:'wrap',padding:'6px 8px' }}>
        {n.level>=3 && <button type="button" disabled={busy} style={button} onClick={() => setEditing({ ...n,isNew:false })}>Edit {n.level===3 && n.origin==='industry' ? 'preferred label' : 'code'}</button>}
        {n.level<5 && <button type="button" disabled={busy || !n.active} style={button} onClick={() => add(n)}>Add Level {n.level+1}{n.level===2 ? ' extension' : ''}</button>}
        {<button type="button" disabled={busy} style={button} onClick={() => toggleBranch(n)}>{n.active ? 'Deactivate branch' : 'Activate code'}</button>}
      </div>
      {kids.map(renderNode)}
    </details>;
  };
  const typeIds = [...new Set(assets.map(a => a.equipmentTypeId).filter(Boolean))].sort();
  const pick = (field,value,checked) => change({ ...draft,assignment:{ ...draft.assignment,
    [field]:checked ? [...draft.assignment[field],value] : draft.assignment[field].filter(x => x!==value) } });
  return <section style={{ color:C.ink,maxWidth:1100,margin:'0 auto' }}>
    {onBack && <button style={button} disabled={busy} onClick={() => { if(!dirty || window.confirm('Discard unsaved draft changes?')) onBack(); }}>← Back to assets</button>}
    <h2>Downtime master codes</h2>
    <p style={{ color:C.muted }}>Configure once, assign to assets, then publish for daily capture. Historical records keep their original codes and labels.</p>
    {error && <p role="alert" style={{ color:'#991b1b' }}>{error}</p>}
    {message && <p role="status" style={{ color:'#166534' }}>{message}</p>}
    {!tenantId && <p>Select an organisation first.</p>}
    <fieldset disabled={busy || !tenantId} style={{ ...card }}>
      <legend>Create an organisation master list</legend>
      <div style={{ display:'flex',gap:10,flexWrap:'wrap',alignItems:'center' }}>
        <label>Name <input style={input} value={name} onChange={e => setName(e.target.value)} /></label>
        <label>Starting template <select style={input} value={mining ? 'mining' : 'custom'} onChange={e => { const v=e.target.value==='mining';setMining(v);setIndustry(v ? 'Mining' : ''); }}>
          <option value="mining">BIG Mining — Mobile Equipment</option><option value="custom">Other industry — controlled skeleton</option>
        </select></label>
        <label>Industry <input style={input} value={industry} readOnly={mining} onChange={e => setIndustry(e.target.value)} /></label>
        <button type="button" style={primary} onClick={create}>Create editable copy</button>
      </div>
      <p><small>Other industries start with fixed Levels 1–2. New Level 3 classifications are Custom / Unmapped until BIG supplies a reviewed industry template.</small></p>
    </fieldset>
    {!!masters.length && <div style={card}>
      <label>Master list <select disabled={busy} style={input} value={selected} onChange={e => switchTo(e.target.value)}>
        {masters.map(m => <option key={m.id} value={m.id}>{m.draft.name} · {m.published ? `Published v${m.published.version}` : 'Not published'}</option>)}
      </select></label>
      <button style={{ ...button,marginLeft:8 }} disabled={busy} onClick={() => act(async () => { setAudit(await getDowntimeAudit(tenantId,selected)); })}>View audit history</button>
      {audit && <ul>{audit.map(a => <li key={a.id}>{new Date(a.at).toLocaleString()} · {a.action} · {a.actor.email || a.actor.uid} · revision {a.revision}</li>)}</ul>}
    </div>}
    {draft && current && <>
      <fieldset disabled={busy} style={card}>
        <legend>Draft settings {dirty ? '· Unsaved changes' : ''}</legend>
        <label>Name <input style={input} value={draft.name} onChange={e => change({ ...draft,name:e.target.value })} /></label>
        <h3>Assign this master list</h3>
        <label><input type="checkbox" checked={draft.assignment.allAssets} onChange={e => change({ ...draft,assignment:{ ...draft.assignment,allAssets:e.target.checked } })} /> All assets in this organisation</label>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:16,marginTop:12 }}>
          <div><strong>Asset types</strong>{[...new Set([...typeIds,...draft.assignment.equipmentTypeIds])].map(id => <label key={id} style={{ display:'block',marginTop:6 }}>
            <input type="checkbox" checked={draft.assignment.equipmentTypeIds.includes(id)} onChange={e => pick('equipmentTypeIds',id,e.target.checked)} /> {id.split('.').pop().replace(/_/g,' ')}
          </label>)}</div>
          <div><strong>Asset groups</strong>{[...new Set([...groups.map(g => g.id || g.groupId),...draft.assignment.groupIds])].map(id => <label key={id} style={{ display:'block',marginTop:6 }}>
            <input type="checkbox" checked={draft.assignment.groupIds.includes(id)} onChange={e => pick('groupIds',id,e.target.checked)} /> {groups.find(g => (g.id || g.groupId) === id)?.name || id}
          </label>)}</div>
        </div>
      </fieldset>
      <div style={card}>
        <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
          <button disabled={busy} style={button} onClick={() => { try { downloadMasterWorkbook(draft); } catch(e) { setError(e.message); } }}>Download editable workbook</button>
          <label style={button}>Import workbook / CSV<input aria-label="Import master codes" type="file" accept=".xlsx,.xls,.csv" disabled={busy} style={{ display:'block',marginTop:6 }} onChange={e => {
            const file=e.target.files?.[0];e.target.value='';if(!file) return;
            act(async () => { change(await readMasterWorkbook(file,draft,current.templateId));setMessage('Imported into the draft. Review before saving or publishing.'); });
          }} /></label>
        </div>
        <p><small>{DOWNTIME_HEADINGS.map((h,i) => `${i+1}. ${h}`).join(' → ')}</small></p>
        <p><small>Levels 1–2 are fixed. Standard Level 3 labels can have local aliases; their reporting classifications stay fixed. Branches can end at Level 3, 4 or 5.</small></p>
        {childrenOf(draft.nodes,null,false).map(renderNode)}
      </div>
      {editing && <form style={card} onSubmit={applyEdit}>
        <h3>{editing.isNew ? 'Add' : 'Edit'} Level {editing.level} — {DOWNTIME_HEADINGS[editing.level-1]}</h3>
        <label>Label <input style={input} required maxLength={120} value={editing.label} onChange={e => setEditing({ ...editing,label:e.target.value })} /></label>{' '}
        <label><input type="checkbox" checked={editing.terminal} onChange={e => setEditing({ ...editing,terminal:e.target.checked })} /> End branch here</label>{' '}
        <label>Sort order <input type="number" style={{ ...input,width:100 }} value={editing.sortOrder} onChange={e => setEditing({ ...editing,sortOrder:Number(e.target.value) })} /></label>{' '}
        <button style={primary} disabled={busy}>Apply to draft</button>{' '}<button type="button" style={button} onClick={() => setEditing(null)}>Cancel</button>
      </form>}
      <div style={{ display:'flex',gap:10,paddingBottom:24 }}>
        <button style={button} disabled={busy || !!editing} onClick={() => save(false)}>Save draft</button>
        <button style={primary} disabled={busy || !!editing} onClick={() => save(true)}>{busy ? 'Working…' : 'Publish for capture'}</button>
      </div>
    </>}
  </section>;
}
