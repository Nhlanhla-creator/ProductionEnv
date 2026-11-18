"use client"

import { useEffect, useRef, useState } from "react"
import { listPacks } from "../services/taxonomyService"
import { saveOnboardingState } from "../services/onboardingState"
import { loadOperatingStructure, saveOperatingStructure } from "../services/operatingStructureService"
import { changeWorkSelection, EMPTY_STRUCTURE, STRUCTURE_STEPS, structureOptions, uniqueChoices, workLabel } from "../models/operatingStructure"
import StructureMultiSelect from "./StructureMultiSelect"
import TwinFlowDiagram from "./TwinFlowDiagram"

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
  const sectorOptions = form.valueChains.length ? structureOptions(form.sectorPack) : options
  const selectedFamilies = new Set(form.equipmentGroups.filter((group) => !group.custom).map(({ id }) => id))
  const equipmentOptions = options.asset.filter(({ equipmentGroupChoiceId }) => !selectedFamilies.size ||
    selectedFamilies.has(equipmentGroupChoiceId))
  const groupIds = new Set(options.equipmentGroups.map(({ id }) => id))
  const selectedEquipment = form.equipment.map((item) => groupIds.has(item.id)
    ? { ...item, name: `${item.name} (previously selected)` } : item)
  const sectorReady = !!form.sectorPack && (form.sectorPack !== "other" || !!form.sectorName.trim())
  const pick = (key, label, choices = options[key]) => <StructureMultiSelect key={key} label={label}
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
    ...available, ...selected.map((choice) => ({ ...choice, name: workLabel(choice.name) })), ...existing,
  ]).sort((a, b) => Number(selected.some(({ id }) => id === b.id)) - Number(selected.some(({ id }) => id === a.id)))
    .map((choice) => selected.some(({ id }) => id === choice.id)
      ? { ...choice, label: `${choice.name} · selected in setup` } : choice)
  const graphChoices = {
    value_chain: workChoices(form.valueChains, options.valueChains, savedNodes("value_chain")),
    activity: workChoices(form.activities, sectorOptions.activities, savedNodes("activity")),
    service: workChoices(form.services, options.services, savedNodes("service")),
    equipment_group: [
      ...loaded.groups.map(({ id, name }) => ({ id, name, registerId: id,
        equipmentGroupChoiceId: [...form.equipmentGroups, ...options.equipmentGroups]
          .find((item) => item.name.toLowerCase() === name.toLowerCase())?.id || null })),
      ...workChoices(form.equipmentGroups, options.equipmentGroups)
        .filter((choice) => !loaded.groups.some((item) => item.name.toLowerCase() === choice.name.toLowerCase())),
    ],
    asset: [...loaded.assets.filter(({ status: assetStatus }) => !["retired", "disposed"].includes(assetStatus))
      .map(({ id, name, internalNumber }) => ({ id, name, label: `${name} (${internalNumber || id})`, registerId: id })),
      ...workChoices(form.equipment, options.asset).map((item) => groupIds.has(item.id)
        ? { ...item, label: `${item.name} · previously selected equipment` } : item)],
    site: savedNodes("site"),
    contract: savedNodes("contract"),
    facility: savedNodes("facility"),
    process_area: savedNodes("process_area"),
  }


  return <section className="dt-workspace">
    <div className="dt-topline">Setup / Operating structure</div>
    <nav className="dt-stepper" aria-label="Setup steps">
      {STRUCTURE_STEPS.map((title, index) => <button key={title} type="button" className="dt-step"
        aria-current={step === index ? "step" : undefined}
        disabled={busy || step === index || index > reached || (index > 0 && !sectorReady)}
        onClick={() => move(index)}>
        <span className="dt-step-num">{index + 1}</span><strong>{title}</strong>
      </button>)}
    </nav>
    <div className="dt-heading"><div><h2>{STRUCTURE_STEPS[step]}</h2><p>Step {step + 1} of {STRUCTURE_STEPS.length}</p></div></div>
    {error && <div role="alert" className="dt-notice dt-notice-error">{error}</div>}
    {status && <div role="status" className="dt-notice dt-notice-success">{status}</div>}
    <fieldset className="dt-panel" disabled={busy}>
      {step === 0 && <>
        <label className="dt-field"><span>Sector pack</span>
          <select value={form.sectorPack} onChange={(event) => {
            const sectorPack = event.target.value
            setForm((current) => current.sectorPack === sectorPack ? current : { ...EMPTY_STRUCTURE, sectorPack })
            setReached(0)
          }}>
            <option value="">Select a sector pack</option>
            {listPacks().map(({ key, sector }) => <option key={key} value={key}>{sector.name}</option>)}
            <option value="other">Other</option>
          </select>
        </label>
        {form.sectorPack === "other" && <label className="dt-field"><span>Specify your sector</span>
          <input maxLength={120} value={form.sectorName} onChange={(event) => setForm({ ...form, sectorName: event.target.value })} />
        </label>}
      </>}
      {step === 1 && <>
        <p>Choose the value chains, activities and services that apply to your operation.</p>
        {pick("valueChains", "Value chain")}
        {pick("activities", "Activities")}
        {pick("services", "Support Services")}
      </>}
      {step === 2 && <>
        <div className="dt-actions" aria-label="Asset structure">
          {[["equipment", "Equipment group"], ["people", "People"]].map(([key, label]) =>
            <button type="button" key={key} aria-pressed={tab === key} className={`dt-button ${tab === key ? "dt-button-primary" : ""}`}
              onClick={() => setTab(key)}>{label}</button>)}
        </div>
        <div style={{ marginTop: 16 }}>
          {tab === "equipment" ? <>
            {pick("equipmentGroups", "Equipment groups")}
            <p className="dt-muted">Choose the equipment types within each group. Use Other to enter your own.</p>
            {pick("equipment", "Equipment", equipmentOptions)}
          </> : <>
            {pick("technical", "Technical roles")}
            {pick("nonTechnical", "Non-technical roles")}
          </>}
        </div>
      </>}
      {step === 3 && <>
        <p className="dt-muted">Save operating structure to publish your diagram and add its equipment to the Asset Register.</p>
        {draftStorageError && <p role="status" className="dt-notice">Draft storage is unavailable in this browser. Save operating structure before leaving.</p>}
        <TwinFlowDiagram {...diagram} onChange={changeDiagram}
          choices={graphChoices} roster={loaded.roster} peopleRoles={{ technical: form.technical, nonTechnical: form.nonTechnical }} />
      </>}
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
