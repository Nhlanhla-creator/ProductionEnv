"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import { createDowntimeMaster, listDowntimeMasters, saveDowntimeMaster } from "../services/downtimeMasterService"
import { listCaptureAssets } from "../services/downtimeService"
import { listGroups } from "../services/resourceService"
import { getOnboardingState } from "../services/onboardingState"
import { getPack } from "../services/taxonomyService"
import { sectorMasterCodes } from "../models/sectorMasterCodes"
import { codeAppliesToEquipment } from "../models/equipmentDowntime"
import { withActOfGod, appendDowntimeCategory } from "../models/downtimeAdditions"
import DowntimeDialog from "./DowntimeDialog"
import { structureId } from "../services/operatingStructureService"
import { validateCodes, appliesTo, childrenOf, DOWNTIME_HEADINGS, TEMPLATE_VERSION } from "../models/downtimeCodes"
import "../styles/Downtime.css"

export default function DowntimeMasterSetup({ tenantId, onNavigate, initialMasterId = "", initialGroupId = "" }) {
  const [masters, setMasters] = useState([]), [assets, setAssets] = useState([]), [groups, setGroups] = useState([])
  const [sector, setSector] = useState({ key: "", name: "" }), [groupId, setGroupId] = useState(initialGroupId)
  const [selected, setSelected] = useState(""), [path, setPath] = useState([]), [allAssets, setAllAssets] = useState(true)
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("")
  const [customNodes,setCustomNodes]=useState(null),[editor,setEditor]=useState(null)
  const saving = useRef(false)
  useEffect(() => {
    let live = true
    setLoading(true); setError(""); setSelected(""); setPath([])
    Promise.all([listDowntimeMasters(tenantId), listCaptureAssets(tenantId,{includeInactive:true}), listGroups(tenantId), getOnboardingState(tenantId)])
      .then(([lists, equipment, equipmentGroups, state]) => {
        if (!live) return
        const form = state.structureDraft || state.form?.structureDraft || {}
        const key = form.sectorPack || state.sectorPack || ""
        const name = getPack(key)?.sector.name || form.sectorName || (key === "other" ? "Other" : "")
        setSector({ key, name }); setMasters(lists); setAssets(equipment.filter((asset)=>asset.currentStructureAsset!==false))
        const matching = lists.find((master) => initialMasterId ? master.id === initialMasterId :
          (master.draft.industry.toLowerCase() === name.toLowerCase() || (key === "mining" && master.templateId === TEMPLATE_VERSION)) &&
          (!initialGroupId || equipment.some((asset) => asset.equipmentGroupId === initialGroupId && appliesTo(master.draft.assignment, asset))))
        setSelected(matching?.id || ""); setAllAssets(matching ? matching.draft.assignment.allAssets : !initialGroupId)
        if (!initialGroupId && matching?.draft.assignment.groupIds.length === 1 && !matching.draft.assignment.allAssets) setGroupId(matching.draft.assignment.groupIds[0])
        setGroups(equipmentGroups.filter((group) => equipment.some((asset) => asset.equipmentGroupId === group.id)))
      }).catch((failure) => { if (live) setError(failure.message) }).finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [tenantId, initialMasterId, initialGroupId])
  const scopedAssets = useMemo(() => assets.filter((asset) => !groupId || asset.equipmentGroupId === groupId), [assets, groupId])
  const typeIds = useMemo(() => [...new Set(scopedAssets.map((asset) => asset.equipmentTypeId).filter(Boolean))], [scopedAssets])
  const lists = masters.filter((master) => {
    const sameSector = master.draft.industry.toLowerCase() === sector.name.toLowerCase() ||
      (sector.key === "mining" && master.templateId === TEMPLATE_VERSION)
    return master.id === initialMasterId || (sameSector && (!groupId || scopedAssets.some((asset) => appliesTo(master.draft.assignment, asset))))
  })
  const current = lists.find((master) => master.id === selected)
  const nodes = useMemo(() => customNodes || withActOfGod(current?.draft.nodes || (sector.key ? sectorMasterCodes(sector.key, typeIds) : [])), [customNodes,current, sector.key, typeIds])
  const assignment = { allAssets, equipmentTypeIds: [], groupIds: allAssets ? [] : groupId ? [groupId] : [] }
  const matched = assets.filter((asset) => appliesTo(assignment, asset))
  const publish = async () => {
    if (saving.current) return
    saving.current = true; setBusy(true); setError(""); setMessage("")
    try {
      if (!sector.key || !sector.name) throw new Error("Select and save a sector pack in Operating structure first.")
      if (!allAssets && !groupId) throw new Error("Select an equipment group above, or include all registered equipment.")
      if (!matched.length) throw new Error("No current equipment matches this assignment. Add equipment to the Asset Register first.")
      const record = current || await createDowntimeMaster(tenantId, {
        name: `${sector.name}${groupId ? ` — ${groups.find((group) => group.id === groupId)?.name || 'Equipment'}` : ''}`.slice(0, 120),
        industry: sector.name, sectorPack: sector.key, mining: sector.key === "mining", equipmentTypeIds: typeIds,
        groupIds: groupId ? [groupId] : [],
      })
      // Keep the created draft selectable if publication fails. Retry must not create another list.
      if (!current) { setMasters((old) => [...old, record]); setSelected(record.id) }
      const draft = { ...record.draft, nodes, industry: sector.name, assignment }
      const saved = await saveDowntimeMaster(tenantId, record.id, draft, record.revision, { publish: true })
      setMasters((old) => old.map((entry) => entry.id === saved.id ? saved : entry)); setSelected(saved.id)
      setMessage(`Published version ${saved.published.version} for ${matched.length} equipment records. Downtime Inputs now uses this list.`)
    } catch (failure) { setError(failure.message) } finally { saving.current = false; setBusy(false) }
  }
  return <section className="dt-workspace">
    <div className="dt-heading"><h2>Master Downtime Codes</h2></div>
    {error && <p role="alert" className="dt-notice dt-notice-error">{error}</p>}
    {message && <p role="status" className="dt-notice dt-notice-success">{message}</p>}
    {loading ? <div className="dt-empty">Loading sector and equipment…</div> : <>
      {!sector.key && <p className="dt-notice">Save your Sector pack in Operating structure to load its classifications.</p>}
      <fieldset className="dt-panel" disabled={busy}><div className="dt-asset-toolbar">
        <label className="dt-field"><span>Sector</span><input value={sector.name} readOnly placeholder="From Operating structure" /></label>
        <label className="dt-field"><span>Equipment group</span><select value={groupId} onChange={(event) => {
          setGroupId(event.target.value); setSelected(""); setPath([]); setCustomNodes(null); setAllAssets(!event.target.value); setMessage("")
        }}><option value="">All registered equipment groups</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label>
        <label className="dt-field"><span>Master-code list</span><select value={current?.id || ""} onChange={(event) => {
          setSelected(event.target.value); setPath([]); setCustomNodes(null); setMessage("")
          const record = lists.find((entry) => entry.id === event.target.value)
          if (record) { setAllAssets(record.draft.assignment.allAssets); if (!record.draft.assignment.allAssets && record.draft.assignment.groupIds.length === 1) setGroupId(record.draft.assignment.groupIds[0]) }
        }}>
          <option value="">Sector defaults</option>{lists.map((master) => <option key={master.id} value={master.id}>{master.draft.name}{master.published ? ` · v${master.published.version}` : " · Draft"}</option>)}
        </select></label>
      </div></fieldset>
      <section className="dt-panel"><h3>Your classification hierarchy</h3><p className="dt-muted">Choose an item to view the list below it. Classifications come from the selected sector and registered equipment.</p>
        <div className="dt-builder">{DOWNTIME_HEADINGS.map((heading, index) => {
          const parent = index ? nodes.find((node) => node.id === path[index - 1]) : null
          const options = (!index || parent) && !parent?.terminal ? childrenOf(nodes, parent?.id || null)
            .filter((node) => index < 3 || !node.equipmentTypeIds?.length || typeIds.some((id) => codeAppliesToEquipment(node, id))) : []
          return <div key={heading} className="dt-code-column"><header><div><strong>LEVEL {index + 1}</strong>{heading}</div></header>
            {options.map((node) => <button type="button" key={node.id} className="dt-code-choice" aria-pressed={path[index] === node.id}
              onClick={() => setPath([...path.slice(0, index), node.id])}>{node.label}</button>)}
            {[2,3].includes(index) && parent && <button type="button" className="dt-button dt-button-small" disabled={busy} onClick={() => setEditor({parentId:parent.id,level:index+1,label:""})}>+ Add missing Level {index+1} category</button>}
            {!options.length && <p className="dt-muted">{parent?.terminal ? "This classification ends here." : index && !parent ? "Select the preceding level." : "No options available."}</p>}
          </div>
        })}</div>
      </section>
      <section className="dt-panel"><h3>Assign codes to equipment</h3>
        <label className="dt-check"><input type="checkbox" checked={allAssets} disabled={busy} onChange={(event) => setAllAssets(event.target.checked)} />All equipment in the Asset Register</label>
        <p className="dt-muted">{allAssets ? "Applies across all registered equipment." : groupId ? `Applies to ${groups.find((group) => group.id === groupId)?.name || 'the selected group'}.` : "Select an equipment group above, or tick All equipment."} {matched.length} matching records.</p>
        <div className="dt-actions"><button type="button" className="dt-button dt-button-primary" disabled={busy || !sector.key || !matched.length} onClick={publish}>{busy ? "Publishing…" : "Publish for equipment"}</button>
          <button type="button" className="dt-button" onClick={() => onNavigate?.("assets")}>Asset Register</button>
          <button type="button" className="dt-button" onClick={() => onNavigate?.("capture", { view: "record" })}>Downtime Inputs</button></div>
      </section>
    </>}
    {editor && <DowntimeDialog title={`Add Level ${editor.level} category`} onClose={()=>setEditor(null)}><form onSubmit={(event)=>{
      event.preventDefault();setError("");try {
        const next=appendDowntimeCategory(nodes,{...editor,id:`org-${structureId()}`});validateCodes(next,current?.draft.nodes||[],current?.templateId||(sector.key==="mining"?TEMPLATE_VERSION:"custom-industry-1"),false)
        setCustomNodes(next);setEditor(null);setMessage("Category added to this draft. Publish to make it available in Downtime Inputs.")
      } catch(failure){setError(failure.message)}
    }}><label className="dt-field"><span>Category name</span><input required maxLength={120} value={editor.label} onChange={(event)=>setEditor({...editor,label:event.target.value})}/></label><button type="submit" className="dt-button dt-button-primary">Add category</button></form></DowntimeDialog>}
  </section>
}
