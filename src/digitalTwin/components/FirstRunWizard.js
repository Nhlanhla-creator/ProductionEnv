"use client"

import { useEffect, useRef, useState } from "react"
import { listPacks } from "../services/taxonomyService"
import { saveOnboardingState } from "../services/onboardingState"
import { loadOperatingStructure, saveOperatingStructure } from "../services/operatingStructureService"
import { changeWorkSelection, EMPTY_STRUCTURE, STRUCTURE_STEPS, structureOptions, uniqueChoices, workLabel } from "../models/operatingStructure"
import { operatingEnvironmentOptions } from "../models/operatingEnvironments"
import StructureMultiSelect from "./StructureMultiSelect"
import TwinFlowDiagram from "./TwinFlowDiagram"
import "../styles/OperatingStructureSteps.css"
import "../styles/OperatingStructureContent.css"

const STEP_DESCRIPTIONS = [
  "Choose your sector and operating environment",
  "Select value chains, activities and Support Services",
  "Choose equipment groups, equipment and roles",
  "Build your hierarchy and save your setup",
]

export default function FirstRunWizard({ tenantId, onComplete, onCancel }) {
  const [loaded, setLoaded] = useState(null)
  const [step, setStep] = useState(0)
  const [reached, setReached] = useState(0)
  const [form, setForm] = useState(EMPTY_STRUCTURE)
  const [diagram, setDiagram] = useState(null)
  const [tab, setTab] = useState("equipment")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [draftStorageError, setDraftStorageError] = useState(false)
  const draftKey = `digitalTwin.operatingDiagramDraft:${tenantId}`
  const activeSave = useRef(false)

  useEffect(() => {
    let active = true
    loadOperatingStructure(tenantId).then((data) => {
      if (!active) return
      const draft = data.state.structureDraft
      const legacyPack = listPacks().some(({ key }) => key === data.state.sectorPack) ? data.state.sectorPack : ""
      setForm({ ...EMPTY_STRUCTURE, sectorPack: legacyPack, ...draft })
      const savedStep = draft ? Math.min(data.state.currentStep, STRUCTURE_STEPS.length - 1) : 0
      let localDraft = null
      try {
        const stored = JSON.parse(window.localStorage.getItem(draftKey) || "null")
        if (stored?.revision === (data.diagram.revision ?? null) &&
            Array.isArray(stored.diagram?.nodes) && Array.isArray(stored.diagram?.relations)) {
          const draftRoot = stored.diagram.nodes.find((node) => node._root)
          const savedRoot = data.diagram.nodes.find((node) => node._root)
          if (draftRoot && savedRoot) {
            const rootId = data.company || data.diagram.revision ? savedRoot.id : draftRoot.id
            const replaceRoot = (id) => id === draftRoot.id ? rootId : id
            const latestNodes = new Map(data.diagram.nodes.map((node) => [node.id, node]))
            localDraft = {
              nodes: stored.diagram.nodes.map((node) => {
                if (node._root) return { ...node, id: rootId, name: savedRoot.name }
                const latest = latestNodes.get(node.id)
                return latest && node.name === stored.assetNames?.[node.id] ? { ...node, name: latest.name } : node
              }),
              relations: stored.diagram.relations.map((edge) => ({ ...edge, fromId: replaceRoot(edge.fromId), toId: replaceRoot(edge.toId) })),
            }
          }
        }
      } catch {
        setDraftStorageError(true)
      }
      setStep(savedStep)
      setReached(data.state.completed || localDraft ? 3 : savedStep)
      setDiagram(localDraft || data.diagram)
      if (localDraft) setStatus("Diagram draft restored from this browser.")
      setLoaded(data)
    }).catch((failure) => { if (active) setError(failure.message) })
    return () => { active = false }
  }, [tenantId, draftKey])

  const options = structureOptions(form.sectorPack, form.valueChains)
    const selectedFamilies = new Set(form.equipmentGroups.filter((group) => !group.custom).map(({ id }) => id))
  const equipmentOptions = options.asset.filter(({ equipmentGroupChoiceId }) => !selectedFamilies.size ||
    selectedFamilies.has(equipmentGroupChoiceId))
  const groupIds = new Set(options.equipmentGroups.map(({ id }) => id))
  const selectedEquipment = form.equipment.map((item) => groupIds.has(item.id)
    ? { ...item, name: `${item.name} (previously selected)` } : item)
  const sectorReady = !!form.sectorPack && (form.sectorPack !== "other" || !!form.sectorName.trim())
  const pick = (key, label, choices = options[key]) => <StructureMultiSelect key={key} label={label} disabled={busy}
    options={choices} selected={(key === "equipment" ? selectedEquipment : form[key]).map((value) => choices.find(({ id }) => id === value.id) || value)}
    onChange={(values) => setForm((current) => changeWorkSelection(current, key, key === "equipment"
      ? values.map((value) => groupIds.has(value.id) ? current.equipment.find(({ id }) => id === value.id) || value : value)
      : values))} />

  const move = async (next) => {
    setBusy(true)
    setError("")
    setStatus("")
    try {
      await saveOnboardingState(tenantId, { structureDraft: form, sectorPack: form.sectorPack, currentStep: next })
      setStep(next)
      setReached((current) => Math.max(current, next))
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }
  const changeDiagram = (next) => {
    const chains = next.nodes.filter((node) => node.nodeType === "value_chain" && node.attributes?.taxonomyId)
      .map((node) => ({ id: node.attributes.taxonomyId, name: node.name }))
    const replaced = new Set((diagram?.nodes || []).filter((node) => node.nodeType === "value_chain" &&
      next.nodes.some((item) => item.id === node.id && item.attributes?.taxonomyId !== node.attributes?.taxonomyId))
      .map((node) => node.attributes?.taxonomyId))
    setForm((current) => changeWorkSelection(current, "valueChains", uniqueChoices([
      ...current.valueChains.filter((item) => !replaced.has(item.id) || chains.some((chain) => chain.id === item.id)), ...chains,
    ])))
    setDiagram(next)
    try {
      window.localStorage.setItem(draftKey, JSON.stringify({
        revision: loaded.diagram.revision ?? null,
        assetNames: Object.fromEntries(loaded.diagram.nodes.filter((node) => node.nodeType === "asset")
          .map(({ id, name }) => [id, name])),
        diagram: next,
      }))
      setDraftStorageError(false)
      setStatus("Draft saved in this browser.")
    } catch {
      setDraftStorageError(true)
      setStatus("")
    }
  }

  const save = async () => {
    if (activeSave.current) return
    activeSave.current = true
    setBusy(true)
    setError("")
    setStatus("")
    try {
      await saveOperatingStructure(tenantId, form, diagram, loaded)
      try {
        window.localStorage.removeItem(draftKey)
      } catch {
        // The committed revision prevents an old draft from being restored.
      }
      setDraftStorageError(false)
      if (onComplete) {
        onComplete()
        return
      }
      const updated = await loadOperatingStructure(tenantId)
      setLoaded(updated)
      setDiagram(updated.diagram)
      setStatus("Operating structure saved.")
    } catch (failure) {
      setError(failure.message)
    } finally {
      activeSave.current = false
      setBusy(false)
    }
  }

  if (!loaded) return <div className="dt-panel">{error
    ? <p role="alert" className="dt-notice dt-notice-error">{error}</p> : "Loading Operating structure…"}</div>

  const savedNodes = (type) => loaded.nodes.filter((node) => node.nodeType === type)
    .map(({ id, name }) => ({ id, name, hierarchyId: id }))
  const workChoices = (selected, available, existing = []) => uniqueChoices([
    ...available, ...selected.map((choice) => ({ ...available.find((item) => item.id === choice.id), ...choice, name: workLabel(choice.name) })), ...existing,
  ]).sort((a, b) => Number(selected.some(({ id }) => id === b.id)) - Number(selected.some(({ id }) => id === a.id)))

  const graphChoices = {
    value_chain: workChoices(form.valueChains, options.valueChains),
    activity: workChoices(form.activities.filter((item) => item.custom || options.activities.some(({ id }) => id === item.id)), options.activities),
    service: workChoices(form.services.filter((item) => item.custom || options.services.some(({ id }) => id === item.id)), options.services),
    equipment_group: [
      ...loaded.groups.map(({ id, name }) => ({ id, name, registerId: id,
        equipmentGroupChoiceId: [...form.equipmentGroups, ...options.equipmentGroups]
          .find((item) => item.name.toLowerCase() === name.toLowerCase())?.id || null })),
      ...workChoices(form.equipmentGroups, options.equipmentGroups)
        .filter((choice) => !loaded.groups.some((item) => item.name.toLowerCase() === choice.name.toLowerCase())),
    ],
    asset: [...loaded.assets.filter(({ status: assetStatus, currentStructureAsset }) => currentStructureAsset !== false && !["retired", "disposed"].includes(assetStatus))
      .map(({ id, name, internalNumber }) => ({ id, name, label: `${name} (${internalNumber || id})`, registerId: id })),
      ...workChoices(form.equipment, options.asset).map((item) => groupIds.has(item.id)
        ? { ...item, label: `${item.name} · previously selected equipment` } : item)],
    site: savedNodes("site"),
    contract: savedNodes("contract"),
    facility: savedNodes("facility"),
    process_area: savedNodes("process_area"),
  }


  return <section className="dt-workspace dt-operating-setup">
    <div className="dt-topline">Setup / Operating structure</div>
    <section className="dt-setup-progress" aria-labelledby="dt-setup-progress-title">
      <div className="dt-setup-progress__header">
        <h3 id="dt-setup-progress-title">Setup steps</h3>
        <span>Step {step + 1} of {STRUCTURE_STEPS.length}</span>
      </div>
      <nav className="dt-setup-progress__nav" aria-label="Setup steps">
        {STRUCTURE_STEPS.map((title, index) => <button key={title} type="button" className="dt-setup-step"
          aria-current={step === index ? "step" : undefined}
          data-available={index <= reached}
          disabled={busy || step === index || index > reached || (index > 0 && !sectorReady)}
          onClick={() => move(index)}>
          <span className="dt-setup-step__number" aria-hidden="true">{index + 1}</span>
          <span className="dt-setup-step__copy"><strong>{title}</strong><small>{STEP_DESCRIPTIONS[index]}</small></span>
        </button>)}
      </nav>
    </section>
    <div className="dt-heading"><div><h2>{STRUCTURE_STEPS[step]}</h2><p>{STEP_DESCRIPTIONS[step]}</p></div></div>
    {error && <div role="alert" className="dt-notice dt-notice-error">{error}</div>}
    {status && <div role="status" className="dt-notice dt-notice-success">{status}</div>}
    <fieldset className="dt-setup-content" disabled={busy}>
      {step === 0 && <div className="dt-setup-content__grid">
        <section className="dt-setup-card"><div className="dt-setup-card__heading"><span className="dt-setup-card__eyebrow">Business context</span><h3>Sector pack</h3><p>Choose the sector that best describes your operation.</p></div>
          <label className="dt-setup-field"><span>Sector</span><select value={form.sectorPack} onChange={(event) => {
            const sectorPack = event.target.value
            setForm((current) => current.sectorPack === sectorPack ? current : { ...EMPTY_STRUCTURE, sectorPack })
            setReached(0)
          }}><option value="">Select a sector pack</option>{listPacks().map(({ key, sector }) => <option key={key} value={key}>{sector.name}</option>)}<option value="other">Other</option></select></label>
          {form.sectorPack === "other" && <label className="dt-setup-field"><span>Specify your sector</span><input maxLength={120} placeholder="Enter your sector" value={form.sectorName}
            onChange={(event) => setForm({ ...form, sectorName: event.target.value })} /></label>}
        </section>
        <section className="dt-setup-card"><div className="dt-setup-card__heading"><span className="dt-setup-card__eyebrow">Operating context</span><h3>Operating environment</h3><p>Select the environments where your work takes place.</p></div>
          {form.sectorPack ? <StructureMultiSelect label="Operating environment" disabled={busy} options={operatingEnvironmentOptions(form.sectorPack)}
            selected={form.operatingEnvironments || []} onChange={(values) => setForm((current) => ({ ...current, operatingEnvironments: values }))} />
            : <div className="dt-setup-placeholder">Choose a sector first to see its operating environments.</div>}
        </section>
      </div>}
      {step === 1 && <div className="dt-setup-content__stack">
        <section className="dt-setup-card"><div className="dt-setup-card__heading"><span className="dt-setup-card__eyebrow">Core operations</span><h3>Work performed</h3><p>Choose your value chains, then select the activities that belong to them.</p></div>
          <div className="dt-setup-content__grid dt-setup-content__grid--fields"><div>{pick("valueChains", "Value chain")}</div><div>{pick("activities", "Activities")}
            {!form.valueChains.length && <p className="dt-setup-field-note">Select a value chain to see the available activities. Other remains available for custom work.</p>}</div></div>
        </section>
        <section className="dt-setup-card"><div className="dt-setup-card__heading"><span className="dt-setup-card__eyebrow">Supporting operations</span><h3>Support Services</h3><p>Choose the services that support your operation. This list is independent of your value chains.</p></div>
          {pick("services", "Support Services", options.services)}
        </section>
      </div>}
      {step === 2 && <section className="dt-setup-card">
        <div className="dt-setup-card__heading"><span className="dt-setup-card__eyebrow">Resources</span><h3>Equipment and roles</h3><p>Define the equipment and roles your operating structure needs.</p></div>
        <div className="dt-setup-resource-tabs" role="group" aria-label="Asset structure">
          {[["equipment", "Equipment"], ["people", "People / roles"]].map(([key, label]) => <button type="button" key={key} aria-pressed={tab === key}
            onClick={() => setTab(key)}>{label}</button>)}
        </div>
        {tab === "equipment" ? <div className="dt-setup-content__grid dt-setup-content__grid--fields">
          <div>{pick("equipmentGroups", "Equipment groups")}<p className="dt-setup-field-note">Group similar equipment together.</p></div>
          <div>{pick("equipment", "Equipment", equipmentOptions)}<p className="dt-setup-field-note">Equipment options follow the groups you select. Set quantities in the diagram.</p></div>
        </div> : <div className="dt-setup-content__grid dt-setup-content__grid--fields">
          <div>{pick("technical", "Technical roles")}<p className="dt-setup-field-note">Operational, engineering and specialist roles.</p></div>
          <div>{pick("nonTechnical", "Non-Technical roles")}<p className="dt-setup-field-note">Administrative, coordination and business support roles.</p></div>
        </div>}
      </section>}
      {step === 3 && <section className="dt-setup-card dt-setup-card--diagram">
        <div className="dt-setup-card__heading"><span className="dt-setup-card__eyebrow">Operating hierarchy</span><h3>Build your diagram</h3><p>Click a node to add or edit its children. Save when you are ready to continue to the Asset Register.</p></div>
        {draftStorageError && <p role="status" className="dt-notice">Draft storage is unavailable in this browser. Save operating structure before leaving.</p>}
        <TwinFlowDiagram {...diagram} onChange={changeDiagram} choices={graphChoices} roster={loaded.roster}
          peopleRoles={{ technical: uniqueChoices([...options.technical, ...form.technical]), nonTechnical: uniqueChoices([...options.nonTechnical, ...form.nonTechnical]) }} />
      </section>}
    </fieldset>
    <div className="dt-actions dt-structure-footer">
      <button type="button" className="dt-button" disabled={busy} onClick={() => step ? move(step - 1) : onCancel?.()}>
        {step === 3 ? "Edit asset structure" : "Back"}
      </button>
      <div className="dt-actions">
        {step < 3
          ? <button type="button" className="dt-button dt-button-primary" disabled={busy || !sectorReady} onClick={() => move(step + 1)}>Continue</button>
          : <button type="button" className="dt-button dt-button-primary" disabled={busy || !sectorReady} onClick={save}>{busy ? "Saving…" : "Save operating structure"}</button>}
      </div>
    </div>
  </section>
}
