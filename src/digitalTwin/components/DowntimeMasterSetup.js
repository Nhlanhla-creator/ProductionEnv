"use client"
import { useEffect,useMemo,useState } from 'react';
import { listDowntimeMasters,createDowntimeMaster,saveDowntimeMaster,getDowntimeAudit } from '../services/downtimeMasterService';
import { listCaptureAssets } from '../services/downtimeService';
import { listGroups } from '../services/resourceService';
import { downloadMasterWorkbook,readMasterWorkbook } from '../services/downtimeSpreadsheetService';
import { DOWNTIME_HEADINGS,childrenOf,codePath,validateCodes,appliesTo } from '../models/downtimeCodes';
import DowntimeFlowNav from './DowntimeFlowNav';
import DowntimeDialog from './DowntimeDialog';
import '../styles/Downtime.css';
const initialPath=nodes => {const leaf=nodes.find(n=>n.active&&n.terminal);return leaf ? codePath(nodes,leaf.id).map(n=>n.id) : [nodes[0]?.id].filter(Boolean);};
export default function DowntimeMasterSetup({ tenantId,onBack,onNavigate }) {
  const [masters,setMasters]=useState([]),[selected,setSelected]=useState(''),[draft,setDraft]=useState(null),[path,setPath]=useState([]);
  const [assets,setAssets]=useState([]),[groups,setGroups]=useState([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
  const [dirty,setDirty]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[tab,setTab]=useState('builder');
  const [createOpen,setCreateOpen]=useState(false),[name,setName]=useState('Mining — Mobile Equipment'),[mining,setMining]=useState(true),[industry,setIndustry]=useState('Mining');
  const [editing,setEditing]=useState(null),[audit,setAudit]=useState(null),[reload,setReload]=useState(0);
  const current=masters.find(m=>m.id===selected),node=draft?.nodes.find(n=>n.id===path[path.length-1]);
  const matching=useMemo(()=>draft?assets.filter(a=>appliesTo(draft.assignment,a)):[],[draft,assets]);
  useEffect(()=>{
    let live=true;setLoading(true);setError('');setMasters([]);setDraft(null);setSelected('');setPath([]);setDirty(false);setEditing(null);setAudit(null);
    if(!tenantId){setLoading(false);return undefined;}
    Promise.all([listDowntimeMasters(tenantId),listCaptureAssets(tenantId),listGroups(tenantId,{status:null})]).then(([m,a,g])=>{
      if(!live)return;setMasters(m);setAssets(a);setGroups(g);
      if(m.length){setSelected(m[0].id);setDraft(m[0].draft);setPath(initialPath(m[0].draft.nodes));}
    }).catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setLoading(false);});
    return()=>{live=false;};
  },[tenantId,reload]);
  const change=d=>{setDraft(d);setDirty(true);setMessage('');};
  const run=async fn=>{setBusy(true);setError('');setMessage('');try{await fn();}catch(e){setError(e.message);}finally{setBusy(false);}};
  const leave=fn=>{if(!dirty||window.confirm('Discard unsaved master-code changes?'))fn?.();};
  const navigate=key=>leave(()=>{if(onNavigate)onNavigate(key);else if(key==='assets')onBack?.();});
  const choose=id=>leave(()=>{const m=masters.find(v=>v.id===id);setSelected(id);setDraft(m.draft);setPath(initialPath(m.draft.nodes));setDirty(false);setMessage('');setError('');});
  const create=()=>run(async()=>{
    const m=await createDowntimeMaster(tenantId,{name,industry,mining});
    setMasters(old=>[...old,m]);setSelected(m.id);setDraft(m.draft);setPath(initialPath(m.draft.nodes));setDirty(false);setCreateOpen(false);
    setMessage('Organisation copy created. Review the levels, assign assets and publish when ready.');
  });
  const save=publish=>run(async()=>{
    const m=await saveDowntimeMaster(tenantId,current.id,draft,current.revision,{publish});
    setMasters(old=>old.map(v=>v.id===m.id?m:v));setDraft(m.draft);setDirty(false);
    setMessage(publish?`Version ${m.published.version} is published. ${matching.length} active assets match the assignment.`:'Draft saved. Daily capture continues to use the published version.');
  });
  const add=parent=>{
    const level=parent.level+1;
    setEditing({id:`org-${Date.now()}-${Math.random().toString(36).slice(2,10)}`,parentId:parent.id,level,label:'',canonicalId:null,standardLabel:null,origin:level===3?'custom_unmapped':'organisation',active:true,terminal:level>=3,sortOrder:draft.nodes.length,isNew:true});
  };
  const apply=e=>{
    e.preventDefault();setError('');
    const {isNew,...value}=editing;value.label=value.label.trim();
    const nodes=isNew?[...draft.nodes.map(n=>n.id===value.parentId?{...n,terminal:false}:n),value]:draft.nodes.map(n=>n.id===value.id?value:n);
    try{
      validateCodes(nodes,draft.nodes,current.templateId,false);
      if(value.active&&value.terminal&&childrenOf(nodes,value.id).length)throw new Error('Deactivate the child codes before making this a final selection.');
      change({...draft,nodes});setPath(codePath(nodes,value.id).map(n=>n.id));setEditing(null);
    }catch(e){setError(e.message);}
  };
  const toggle=n=>{
    const affected=new Set([n.id]);
    if(n.active)for(let i=0;i<5;i++)draft.nodes.forEach(c=>{if(affected.has(c.parentId))affected.add(c.id);});
    else codePath(draft.nodes,n.id).forEach(c=>affected.add(c.id));
    change({...draft,nodes:draft.nodes.map(c=>affected.has(c.id)?{...c,active:!n.active}:c)});
  };
  const pick=(field,id,checked)=>change({...draft,assignment:{...draft.assignment,[field]:checked?[...new Set([...draft.assignment[field],id])]:draft.assignment[field].filter(x=>x!==id)}});
  const types=[...new Set([...assets.map(a=>a.equipmentTypeId).filter(Boolean),...(draft?.assignment.equipmentTypeIds||[])])].sort();
  const tree=n=><details key={n.id} open={n.level<3}><summary onClick={()=>setPath(codePath(draft.nodes,n.id).map(v=>v.id))}>{n.label}<span>Level {n.level} · {DOWNTIME_HEADINGS[n.level-1]}{n.terminal?' · Final selection':''}{!n.active?' · Inactive':''}</span></summary>{childrenOf(draft.nodes,n.id,false).map(tree)}</details>;
  return <section className="dt-workspace">
    <div className="dt-topline">Operations performance / Downtime configuration</div>
    <DowntimeFlowNav current="setup" disabled={busy} onNavigate={onNavigate?navigate:key=>key==='assets'&&navigate(key)}/>
    <div className="dt-heading"><div><h2>One setup. Consistent capture.</h2><p>Build your downtime hierarchy once, assign it to the right equipment and publish it for your team.</p></div><div className="dt-actions">
      <button className="dt-button" disabled={busy} onClick={()=>leave(()=>{setReload(x=>x+1);})}>Reload</button>
      <button className="dt-button dt-button-primary" disabled={busy||!tenantId} onClick={()=>leave(()=>setCreateOpen(true))}>+ New master list</button>
    </div></div>
    {error&&<div role="alert" className="dt-notice dt-notice-error">{error}</div>}
    {message&&<div role="status" className="dt-notice dt-notice-success">{message}</div>}
    {loading&&<div className="dt-empty">Loading your assets and master lists…</div>}
    {!loading&&!masters.length&&<div className="dt-empty"><strong>Start with a BIG template</strong>Create your own editable copy of Mining — Mobile Equipment, or start another industry's hierarchy.<br/>Register assets first so you can assign and publish your codes.<div className="dt-actions" style={{justifyContent:'center',marginTop:16}}><button className="dt-button dt-button-primary" disabled={!tenantId} onClick={()=>setCreateOpen(true)}>Create master list</button>{onNavigate&&<button className="dt-button" onClick={()=>navigate('assets')}>Open asset register</button>}</div></div>}
    {draft&&current&&<>
      <div className="dt-panel"><div className="dt-panel-head"><label className="dt-field" style={{flex:1,maxWidth:600}}><span>Organisation master list</span><select value={selected} disabled={busy} onChange={e=>choose(e.target.value)}>{masters.map(m=><option key={m.id} value={m.id}>{m.draft.name}</option>)}</select></label><span className={`dt-badge ${current.published?'dt-badge-green':'dt-badge-amber'}`}>{current.published?`Published v${current.published.version}`:'Draft only'}</span>{dirty&&<span className="dt-badge dt-badge-amber">Unsaved changes</span>}</div>
        <div className="dt-fields"><label className="dt-field"><span>List name</span><input value={draft.name} maxLength={120} disabled={busy} onChange={e=>change({...draft,name:e.target.value})}/></label><label className="dt-field"><span>Industry</span><input value={draft.industry} readOnly/><small>BIG standards and organisation-specific codes remain separate.</small></label></div>
      </div>
      <div className="dt-panel"><div className="dt-panel-head"><div><h3>Your classification hierarchy</h3><p className="dt-muted" style={{marginBottom:0}}>Select a value to see only its children. Level 5 holds the specific downtime reason.</p></div><div className="dt-actions"><button className="dt-button dt-button-small" disabled={busy} onClick={()=>{try{downloadMasterWorkbook(draft);}catch(e){setError(e.message);}}}>Download code template</button><label className="dt-button dt-button-small">Import codes<input className="dt-sr-only" type="file" accept=".xlsx,.xls,.csv" disabled={busy} aria-label="Import downtime master-code workbook" onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)run(async()=>{const next=await readMasterWorkbook(file,draft,current.templateId);change(next);setPath(initialPath(next.nodes));setMessage('Codes imported into the draft. Review and publish to use them in capture.');});}}/></label></div></div>
        <div className="dt-tabs" role="tablist" aria-label="Hierarchy view"><button type="button" className="dt-tab" role="tab" aria-selected={tab==='builder'} onClick={()=>setTab('builder')}>Level-by-level builder</button><button type="button" className="dt-tab" role="tab" aria-selected={tab==='tree'} onClick={()=>setTab('tree')}>Expandable tree</button></div>
        {tab==='builder'?<div className="dt-builder">{DOWNTIME_HEADINGS.map((heading,i)=>{
          const parent=i?draft.nodes.find(n=>n.id===path[i-1]):null,choices=(!i||parent)&&!parent?.terminal?childrenOf(draft.nodes,parent?.id||null,false):[];
          return <div key={heading} className="dt-code-column"><header><div><strong>LEVEL {i+1}</strong>{heading}</div></header>{choices.map(n=><button type="button" disabled={busy} key={n.id} className="dt-code-choice" data-active={n.active} aria-pressed={path[i]===n.id} onClick={()=>setPath([...path.slice(0,i),n.id])}>{n.label}<small>{n.origin==='custom_unmapped'?'Custom / Unmapped':n.level<3?'System standard':n.level===3?`Reports as ${n.standardLabel}`:n.terminal?'Final selection':'Has child codes'}{!n.active?' · Inactive':''}</small></button>)}{parent?.terminal?<p className="dt-muted">This branch ends at Level {parent.level}. No further selection is required.</p>:!choices.length&&<p className="dt-muted">{i&&!parent?'Select the previous level.':'No codes here yet.'}</p>}{i>=2&&parent&&!parent.terminal&&<button type="button" className="dt-button dt-button-small" disabled={busy||!parent.active} onClick={()=>add(parent)}>+ {i===4?'Add reason':`Add Level ${i+1}`}</button>}</div>;
        })}</div>:<div className="dt-tree">{childrenOf(draft.nodes,null,false).map(tree)}</div>}
        <div className="dt-footer"><div className="dt-path">{path.map((id,i)=>{const n=draft.nodes.find(x=>x.id===id);return n&&<span key={id}>{i+1}. {n.label}</span>;})}</div><div className="dt-actions">{node&&node.level>=3&&<button className="dt-button dt-button-small" disabled={busy} onClick={()=>setEditing({...node,isNew:false})}>{node.level===5?'Edit reason':node.origin==='industry'?'Edit preferred label':'Edit code'}</button>}{node&&node.level>=2&&node.level<5&&<button className="dt-button dt-button-small" disabled={busy||!node.active} onClick={()=>add(node)}>+ {node.level===4?'Add reason':`Add Level ${node.level+1}`}</button>}{node&&<button className="dt-button dt-button-small" disabled={busy} onClick={()=>toggle(node)}>{node.active?'Deactivate branch':'Activate code'}</button>}</div></div>
        <p className="dt-muted">Levels 1–2 are system-controlled. Standard Level 3 reporting classifications stay fixed; local labels are aliases. Additions to Level 3 are Custom / Unmapped. Levels 4–5 are editable. Deactivate codes to preserve history.</p>
      </div>
      <div className="dt-grid"><div className="dt-panel"><div className="dt-panel-head"><div><h3>Assign codes to equipment</h3><p className="dt-muted" style={{marginBottom:0}}>Match by asset type, group, or explicitly include all assets.</p></div><span className="dt-badge dt-badge-dark">{matching.length} active assets</span></div>
        <label className="dt-check"><input type="checkbox" disabled={busy} checked={draft.assignment.allAssets} onChange={e=>change({...draft,assignment:{...draft.assignment,allAssets:e.target.checked}})}/><span><strong>All assets in this organisation</strong><br/>Use this list across every registered asset.</span></label>
        <div className="dt-split" style={{marginTop:20}}><div><h4>Asset types</h4><div className="dt-check-grid">{types.map(id=><label key={id} className="dt-check"><input type="checkbox" disabled={busy} checked={draft.assignment.equipmentTypeIds.includes(id)} onChange={e=>pick('equipmentTypeIds',id,e.target.checked)}/>{id.split('.').pop().replace(/_/g,' ')}</label>)}</div>{!types.length&&<p className="dt-muted">Register an asset to see your equipment types.</p>}</div><div><h4>Asset groups</h4><div className="dt-check-grid">{[...new Set([...groups.map(g=>g.id||g.groupId),...draft.assignment.groupIds])].map(id=><label key={id} className="dt-check"><input type="checkbox" disabled={busy} checked={draft.assignment.groupIds.includes(id)} onChange={e=>pick('groupIds',id,e.target.checked)}/>{groups.find(g=>(g.id||g.groupId)===id)?.name||id}</label>)}</div>{!groups.length&&<p className="dt-muted">Create a group in the asset register, then reload this list.</p>}</div></div>
      </div><aside className="dt-panel"><h3>Ready for daily capture?</h3><p className="dt-muted">Save work in progress as a draft. Publish only when the branches and asset assignment are ready.</p><p className="dt-muted">{draft.nodes.filter(n=>n.active&&n.terminal).length} final selections · {draft.nodes.filter(n=>n.active).length} active codes</p><div className="dt-actions"><button className="dt-button" disabled={busy} onClick={()=>run(async()=>setAudit(await getDowntimeAudit(tenantId,selected)))}>View audit history</button></div></aside></div>
      <div className="dt-footer"><p className="dt-muted" style={{margin:0}}>Published changes become available to new captures. Saved records retain their original classification.</p><div className="dt-actions"><button className="dt-button" disabled={busy||!!editing} onClick={()=>save(false)}>Save draft</button><button className="dt-button dt-button-primary" disabled={busy||!!editing||!assets.length} onClick={()=>save(true)}>{busy?'Working…':'Publish master codes'}</button>{current.published&&onNavigate&&<button className="dt-button" disabled={busy||dirty} onClick={()=>navigate('capture')}>Continue to capture →</button>}</div></div>
    </>}
    {createOpen&&<DowntimeDialog title="Create organisation master list" busy={busy} onClose={()=>setCreateOpen(false)}><form onSubmit={e=>{e.preventDefault();create();}}>{error&&<div role="alert" className="dt-notice dt-notice-error">{error}</div>}<div className="dt-fields"><label className="dt-field dt-colspan"><span>List name</span><input data-autofocus required maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></label><label className="dt-field dt-colspan"><span>Starting template</span><select value={mining?'mining':'custom'} onChange={e=>{const value=e.target.value==='mining';setMining(value);setIndustry(value?'Mining':'');setName(value?'Mining — Mobile Equipment':'Organisation downtime codes');}}><option value="mining">BIG Mining — Mobile Equipment</option><option value="custom">Other industry — start with fixed Levels 1–2</option></select></label><label className="dt-field dt-colspan"><span>Industry</span><input required readOnly={mining} value={industry} onChange={e=>setIndustry(e.target.value)}/><small>Other industries use Custom / Unmapped Level 3 extensions until BIG supplies an approved taxonomy.</small></label></div><div className="dt-footer"><button className="dt-button dt-button-primary" disabled={busy}>Create editable copy</button></div></form></DowntimeDialog>}
    {editing&&<DowntimeDialog title={`${editing.isNew?'Add':'Edit'} Level ${editing.level} — ${DOWNTIME_HEADINGS[editing.level-1]}`} busy={busy} onClose={()=>setEditing(null)}><form onSubmit={apply}>{error&&<div role="alert" className="dt-notice dt-notice-error">{error}</div>}<label className="dt-field"><span>{editing.level===5?'Specific downtime reason':'Code label'}</span><input data-autofocus required maxLength={120} value={editing.label} onChange={e=>setEditing({...editing,label:e.target.value})}/></label>{editing.origin==='industry'&&<p className="dt-muted">Reporting classification stays: <strong>{editing.standardLabel}</strong></p>}{editing.origin==='custom_unmapped'&&<p className="dt-notice">This is an organisation-specific Level 3 extension, marked Custom / Unmapped.</p>}<label className="dt-check" style={{marginTop:16}}><input type="checkbox" checked={editing.terminal} disabled={editing.level===5} onChange={e=>setEditing({...editing,terminal:e.target.checked})}/>End the branch at this level</label><label className="dt-field" style={{marginTop:16}}><span>Display order</span><input type="number" required value={editing.sortOrder} onChange={e=>setEditing({...editing,sortOrder:Number(e.target.value)})}/></label><div className="dt-footer"><button className="dt-button dt-button-primary">Apply to draft</button></div></form></DowntimeDialog>}
    {audit&&<DowntimeDialog title="Master-code audit history" onClose={()=>setAudit(null)}>{audit.length?<ol>{audit.map(a=><li key={a.id} className="dt-muted"><strong>{a.action.replace(/_/g,' ')}</strong> · revision {a.revision}<br/>{new Date(a.at).toLocaleString()} · {a.actor.email||a.actor.uid}</li>)}</ol>:<p className="dt-muted">No audit entries.</p>}</DowntimeDialog>}
  </section>;
}
