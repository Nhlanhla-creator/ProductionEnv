"use client"
import { useEffect,useMemo,useState } from 'react';
import { createDowntimeEvent,correctDowntimeEvent,listDowntimeEvents,listCaptureAssets } from '../services/downtimeService';
import { listDowntimeMasters } from '../services/downtimeMasterService';
import { effectiveContextFor } from '../services/resourceService';
import { appliesTo,childrenOf,DOWNTIME_HEADINGS,durationOf,canCaptureAsset } from '../models/downtimeCodes';
import { downloadDowntimeCsv } from '../services/downtimeSpreadsheetService';
import DowntimeMasterSetup from './DowntimeMasterSetup';
const input = { width:'100%',padding:'10px 12px',border:'1px solid #b0a29b',borderRadius:8,font:'inherit',boxSizing:'border-box',color:'#2d201c',background:'white' };
const button = { ...input,width:'auto',cursor:'pointer',fontSize:13 };
const primary = { ...button,background:'#4a352f',color:'white',fontWeight:600 };
const card = { padding:18,border:'1px solid #ded8d4',borderRadius:12,background:'white',marginBottom:16 };
const localInput = value => {
  const d=value ? new Date(value) : new Date();
  return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);
};
const blank = () => ({ start:localInput(),end:'',notes:'' });
const zoned = value => { const d = new Date(value);if(!value || !Number.isFinite(d.getTime())) throw new Error('Enter valid start and end times.');return d.toISOString(); };
export default function DowntimeEventForm({ tenantId,defaultAssetId = null,onBack }) {
  const [assets,setAssets] = useState([]),[masters,setMasters] = useState([]),[assetId,setAssetId] = useState(defaultAssetId || '');
  const [masterId,setMasterId] = useState(''),[selected,setSelected] = useState([]),[form,setForm] = useState(blank);
  const [events,setEvents] = useState([]),[busy,setBusy] = useState(false),[error,setError] = useState(''),[message,setMessage] = useState('');
  const [loading,setLoading] = useState(true),[refresh,setRefresh] = useState(0),[setup,setSetup] = useState(false);
  const [editing,setEditing] = useState(null),[reason,setReason] = useState('');
  const [from,setFrom] = useState(''),[to,setTo] = useState('');
  useEffect(() => {
    let live=true;
    setAssets([]);setMasters([]);setEvents([]);setEditing(null);setReason('');setSelected([]);setMasterId('');setForm(blank());setError('');setMessage('');setLoading(true);
    if(!tenantId) { setLoading(false);return undefined; }
    Promise.all([listCaptureAssets(tenantId,{ includeInactive:true }),listDowntimeMasters(tenantId)]).then(([a,m]) => {
      if(!live) return;
      setAssets(a);setMasters(m);
      setAssetId(old => a.some(x => (x.assetId || x.id) === (defaultAssetId || old)) ? (defaultAssetId || old) : (a[0]?.assetId || a[0]?.id || ''));
    }).catch(e => { if(live) setError(e.message); }).finally(() => { if(live) setLoading(false); });
    return () => { live=false; };
  },[tenantId,defaultAssetId,refresh]);
  useEffect(() => {
    let live=true;setEvents([]);
    if(!tenantId || !assetId) return undefined;
    listDowntimeEvents(tenantId,{ assetId }).then(rows => { if(live) setEvents(rows); }).catch(e => { if(live) setError(e.message); });
    return () => { live=false; };
  },[tenantId,assetId,refresh]);
  const asset = assets.find(a => (a.assetId || a.id) === assetId);
  const eligible = useMemo(() => masters.filter(m => m.published && asset && appliesTo(m.published.assignment,asset)),[masters,asset]);
  const master = eligible.find(m => m.id === masterId) || (eligible.length === 1 ? eligible[0] : null);
  const nodes = master?.published.nodes || [];
  const path = selected.map(id => nodes.find(n => n.id === id)).filter(Boolean);
  const terminal = path.length>=3 && path[path.length-1]?.terminal;
  const preview = useMemo(() => { try { return durationOf(zoned(form.start),zoned(form.end)).durationHours; } catch { return null; } },[form.start,form.end]);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const filtered = events.filter(e => (!from || Date.parse(e.eventEnd || e.eventStart)>new Date(`${from}T00:00`).getTime()) &&
    (!to || Date.parse(e.eventStart)<new Date(`${to}T23:59:59.999`).getTime()));
  // Filters select overlapping events; the table/export retain each full saved duration.
  const shownEvents = filtered;
  const editEvent = e => {
    if(!e.masterListId || !e.classificationPath) { setError('Legacy records remain readable. Use the service API to close an open legacy record.');return; }
    setEditing(e);setReason('');setForm({ start:localInput(e.eventStart),end:localInput(e.eventEnd),notes:e.notes || '' });
    setError('');setMessage('');
  };
  const cancelEdit = () => { setEditing(null);setReason('');setForm(blank());setSelected([]); };
  const submit = async e => {
    e.preventDefault();setBusy(true);setError('');setMessage('');
    try {
      if(!tenantId || !assetId) throw new Error('Select an organisation and asset.');
      const timing = durationOf(zoned(form.start),zoned(form.end));
      if(editing) {
        await correctDowntimeEvent(tenantId,editing.eventId || editing.id,{ ...timing,notes:form.notes },{ reason,expectedVersion:editing.eventVersion });
      } else {
        if(!master || !terminal) throw new Error('Select a published master list and complete the classification.');
        const assignments = await effectiveContextFor(tenantId,assetId,timing.eventStart.slice(0,10));
        const context = assignments.find(a => a.isPrimary) || assignments[0] || {};
        await createDowntimeEvent(tenantId,{ ...timing,assetId,masterListId:master.id,masterVersion:master.published.version,
          selectedCodeId:path[path.length-1].id,notes:form.notes,timezone,
          siteId:context.siteId || null,contractId:context.contractId || null,activityId:context.activityId || null,serviceId:context.serviceId || null });
      }
      const wasEditing=!!editing;
      cancelEdit();setMessage(wasEditing ? 'Correction saved with an audit trail.' : 'Downtime saved.');
      setEvents(await listDowntimeEvents(tenantId,{ assetId }));
    } catch(e) { setError(e.message); } finally { setBusy(false); }
  };
  if(setup) return <DowntimeMasterSetup tenantId={tenantId} onBack={() => { setSetup(false);setRefresh(r => r+1); }} />;
  return <section style={{ maxWidth:1100,margin:'0 auto',color:'#2d201c' }}>
    <div style={{ display:'flex',gap:10,flexWrap:'wrap' }}>
      {onBack && <button style={button} disabled={busy} onClick={onBack}>← Back</button>}
      <button style={button} disabled={busy} onClick={() => setSetup(true)}>Manage master codes</button>
      <button style={button} disabled={busy || loading} onClick={() => setRefresh(r => r+1)}>Reload assets and published codes</button>
    </div>
    <h2>Record asset downtime</h2>
    <p style={{ color:'#6b5b55' }}>Choose the asset and its published classification. Hours are calculated from start and end times.</p>
    {error && <p role="alert" style={{ color:'#991b1b' }}>{error}</p>}
    {message && <p role="status" style={{ color:'#166534' }}>{message}</p>}
    {loading && <p>Loading assets and published codes…</p>}
    {!loading && !assets.length && <p>No registered assets. Add an asset in the Asset Register first.</p>}
    <form onSubmit={submit}>
      <fieldset disabled={busy || loading || !tenantId} style={card}>
        <legend>{editing ? 'Correct downtime — historical classification retained' : 'Downtime capture'}</legend>
        <label style={{ display:'block',marginBottom:14 }}>Asset ID / name
          <select required style={input} disabled={!!editing} value={assetId} onChange={e => { setAssetId(e.target.value);setMasterId('');setSelected([]);setError('');setMessage(''); }}>
            <option value="">Select an asset</option>{assets.map(a => <option key={a.id} value={a.assetId || a.id}>{a.internalNumber || a.assetId || a.id} — {a.name}{!canCaptureAsset(a) ? " (history only)" : ""}</option>)}
          </select>
        </label>
        {asset && !canCaptureAsset(asset) && <p>Historical asset: review and correct existing records here. New downtime requires an active asset.</p>}
        <p style={{ fontSize:12,color:'#6b5b55' }}>Times use your device timezone: <strong>{timezone}</strong>. Stored as UTC. Events may cross midnight or span multiple days.</p>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:14 }}>
          <label>Start date and time<input required type="datetime-local" style={input} value={form.start} onChange={e => setForm({ ...form,start:e.target.value })} /></label>
          <label>End date and time<input required type="datetime-local" style={input} value={form.end} onChange={e => setForm({ ...form,end:e.target.value })} /></label>
        </div>
        {editing ? <p style={card}>{editing.classificationPath.map(n => n.label).join(' → ')} · saved version {editing.masterVersion}</p> : <>
          {!eligible.length && asset && <p style={{ color:'#92400e' }}>No published master list is assigned to this asset type or group. Open Manage master codes, assign a list and publish it.</p>}
          <label style={{ display:'block',margin:'16px 0' }}>Published master list
            <select required style={input} value={master?.id || ''} onChange={e => { setMasterId(e.target.value);setSelected([]); }}>
              <option value="">Select a published list</option>{eligible.map(m => <option key={m.id} value={m.id}>{m.published.name} · v{m.published.version}</option>)}
            </select>
          </label>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:14 }}>
            {DOWNTIME_HEADINGS.map((heading,i) => {
              const parent=i ? nodes.find(n => n.id === selected[i-1]) : null;
              if(!master || (i && (!parent || parent.terminal))) return null;
              const choices=childrenOf(nodes,parent?.id || null);
              return <label key={heading}>Level {i+1} — {heading}
                <select required style={input} value={selected[i] || ''} onChange={e => setSelected([...selected.slice(0,i),e.target.value].filter(Boolean))}>
                  <option value="">Select {heading.toLowerCase()}</option>{choices.map(n => <option key={n.id} value={n.id}>{n.label}{n.origin==='custom_unmapped' ? ' (Custom / Unmapped)' : ''}</option>)}
                </select>
              </label>;
            })}
          </div>
          {!!path.length && <p>{path.map(n => n.label).join(' → ')}</p>}
        </>}
        <label style={{ display:'block',marginTop:14 }}>Notes (optional)<textarea style={input} maxLength={10000} rows={3} value={form.notes} onChange={e => setForm({ ...form,notes:e.target.value })} /></label>
        {editing && <label style={{ display:'block',marginTop:14 }}>Reason for correction<input required style={input} value={reason} onChange={e => setReason(e.target.value)} /></label>}
        <div style={{ display:'flex',gap:14,flexWrap:'wrap',alignItems:'center',marginTop:16 }}>
          <div style={{ padding:14,borderRadius:10,background:'#f4efec' }}><strong style={{ fontSize:28 }}>{preview === null ? '—' : preview.toFixed(2)}</strong> hours</div>
          <button style={primary} disabled={busy || !asset || (!editing && (!terminal || !canCaptureAsset(asset)))}>{busy ? 'Saving…' : editing ? 'Save audited correction' : 'Save downtime'}</button>
          {editing && <button type="button" style={button} onClick={cancelEdit}>Cancel correction</button>}
        </div>
      </fieldset>
    </form>
    <div style={card}>
      <div style={{ display:'flex',gap:12,alignItems:'end',flexWrap:'wrap' }}>
        <h3 style={{ marginRight:'auto' }}>Downtime records for this asset</h3>
        <label>From<input type="date" style={input} value={from} onChange={e => setFrom(e.target.value)} /></label>
        <label>To<input type="date" min={from || undefined} style={input} value={to} onChange={e => setTo(e.target.value)} /></label>
        <button style={button} disabled={!shownEvents.length} onClick={() => { try { downloadDowntimeCsv(shownEvents); } catch(e) { setError(e.message); } }}>Export CSV</button>
      </div>
      <p>{shownEvents.length} events · {shownEvents.reduce((s,e) => s+(Number(e.durationHours)||0),0).toFixed(2)} full event hours</p>
      <div style={{ overflowX:'auto' }}><table style={{ width:'100%',borderCollapse:'collapse',fontSize:13 }}>
        <thead><tr>{['Start','End','Hours','Classification','Notes',''].map((h,i) => <th key={i} style={{ padding:10,textAlign:'left',borderBottom:'1px solid #ded8d4' }}>{h}</th>)}</tr></thead>
        <tbody>{shownEvents.map(e => <tr key={e.id}>
          <td style={{ padding:10 }}>{new Date(e.eventStart).toLocaleString()}</td>
          <td style={{ padding:10 }}>{e.eventEnd ? new Date(e.eventEnd).toLocaleString() : 'Open (legacy)'}</td>
          <td style={{ padding:10 }}>{e.durationHours == null ? '—' : Number(e.durationHours).toFixed(2)}</td>
          <td style={{ padding:10 }}>{e.classificationPath?.map(n => n.label).join(' → ') || [e.categoryLevel1,e.categoryLevel2].filter(Boolean).join(' → ')}</td>
          <td style={{ padding:10 }}>{e.notes}</td><td style={{ padding:10 }}>{e.masterListId && <button style={button} disabled={busy} onClick={() => editEvent(e)}>Correct</button>}</td>
        </tr>)}</tbody>
      </table></div>
      {!shownEvents.length && <p>No downtime records for this selection.</p>}
    </div>
  </section>;
}
