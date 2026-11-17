"use client"

import { useEffect, useRef, useState } from "react"
import { listPacks } from "../services/taxonomyService"
import { saveOnboardingState } from "../services/onboardingState"
import { loadOperatingStructure, saveOperatingStructure } from "../services/operatingStructureService"
import { changeWorkSelection, EMPTY_STRUCTURE, STRUCTURE_STEPS, structureOptions } from "../models/operatingStructure"
import SectorPackLoader from "./SectorPackLoader"
import StructureMultiSelect from "./StructureMultiSelect"
import TwinFlowDiagram from "./TwinFlowDiagram"

export default function FirstRunWizard({ tenantId, onComplete, onCancel }) {
  const [loaded, setLoaded] = useState(null)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(EMPTY_STRUCTURE)
  const [diagram, setDiagram] = useState(null)
  const [tab, setTab] = useState("equipment")
  const [busy, setBusy] = useState(false)
  const [packBusy, setPackBusy] = useState(false)
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
      setDiagram(localDraft || data.diagram)
      if (localDraft) setStatus("Diagram draft restored from this browser.")
      setLoaded(data)
    }).catch((failure) => { if (active) setError(failure.message) })
    return () => { active = false }
  }, [tenantId, draftKey])

  const options = structureOptions(form.sectorPack, form.valueChains, form.activities)
  const sectorReady = !!form.sectorPack && (form.sectorPack !== "other" || !!form.sectorName.trim())
  const pick = (key, label) => <StructureMultiSelect label={label} options={options[key]} selected={form[key]}
    onChange={(values) => setForm((current) => changeWorkSelection(current, key, values))} />

  const move = async (next) => {
    setBusy(true)
    setError("")
    setStatus("")
    try {
      await saveOnboardingState(tenantId, { structureDraft: form, sectorPack: form.sectorPack, currentStep: next })
      setStep(next)
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
  const graphChoices = {
    value_chain: form.valueChains,
    activity: form.activities,
    service: form.services,
    equipment_group: [...loaded.groups.map(({ id, name }) => ({ id, name, registerId: id })),
      ...form.equipmentGroups.filter((choice) => !loaded.groups.some((item) => item.name.toLowerCase() === choice.name.toLowerCase()))],
    asset: [...loaded.assets.filter(({ status: assetStatus }) => !["retired", "disposed"].includes(assetStatus))
      .map(({ id, name, internalNumber }) => ({ id, name, label: `${name} (${internalNumber || id})`, registerId: id })), ...options.asset],
    site: savedNodes("site"),
    contract: savedNodes("contract"),
    facility: savedNodes("facility"),
    process_area: savedNodes("process_area"),
  }


  return <section className="dt-workspace">
    <div className="dt-topline">Setup / Operating structure</div>
    <div className="dt-heading"><div><h2>{STRUCTURE_STEPS[step]}</h2><p>Step {step + 1} of {STRUCTURE_STEPS.length}</p></div></div>
    {error && <div role="alert" className="dt-notice dt-notice-error">{error}</div>}
    {status && <div role="status" className="dt-notice dt-notice-success">{status}</div>}
    <fieldset className="dt-panel" disabled={busy}>
      {step === 0 && <>
        <SectorPackLoader tenantId={tenantId} selectedKey={form.sectorPack} onActivationPending={setPackBusy}
          onPackSelect={(sectorPack) => setForm((current) =>
            current.sectorPack === sectorPack ? current : { ...EMPTY_STRUCTURE, sectorPack })} />
        {form.sectorPack === "other" && <label className="dt-field"><span>Specify your sector</span>
          <input maxLength={120} value={form.sectorName} onChange={(event) => setForm({ ...form, sectorName: event.target.value })} />
        </label>}
      </>}
      {step === 1 && <>
        <p>Choose the value chains, activities and services that apply to your operation.</p>
        {pick("valueChains", "Value chain")}
        {pick("activities", "Activities")}
        {pick("services", "Services")}
      </>}
      {step === 2 && <>
        <div className="dt-actions" aria-label="Asset structure">
          {[["equipment", "Equipment group"], ["people", "People"]].map(([key, label]) =>
            <button type="button" key={key} aria-pressed={tab === key} className={`dt-button ${tab === key ? "dt-button-primary" : ""}`}
              onClick={() => setTab(key)}>{label}</button>)}
        </div>
        <div style={{ marginTop: 16 }}>
          {tab === "equipment" ? pick("equipmentGroups", "Equipment groups") : <>
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
      <button type="button" className="dt-button" disabled={busy || packBusy} onClick={() => step ? move(step - 1) : onCancel?.()}>
        {step === 3 ? "Edit asset structure" : "Back"}
      </button>
      <div className="dt-actions">
        {step < 3
          ? <button type="button" className="dt-button dt-button-primary" disabled={busy || packBusy || !sectorReady} onClick={() => move(step + 1)}>Continue</button>
          : <button type="button" className="dt-button dt-button-primary" disabled={busy || !sectorReady} onClick={save}>{busy ? "Saving…" : "Save operating structure"}</button>}
      </div>
    </div>
  </section>
}
