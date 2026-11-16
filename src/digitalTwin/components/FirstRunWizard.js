"use client"

import { useEffect, useState } from "react"
import { listPacks } from "../services/taxonomyService"
import { saveOnboardingState } from "../services/onboardingState"
import { loadOperatingStructure, saveOperatingStructure } from "../services/operatingStructureService"
import { changeWorkSelection, EMPTY_STRUCTURE, STRUCTURE_STEPS, structureOptions } from "../models/operatingStructure"
import StructureMultiSelect from "./StructureMultiSelect"
import TwinFlowDiagram from "./TwinFlowDiagram"

export default function FirstRunWizard({ tenantId, onComplete, onCancel }) {
  const [loaded, setLoaded] = useState(null)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(EMPTY_STRUCTURE)
  const [diagram, setDiagram] = useState(null)
  const [tab, setTab] = useState("equipment")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")

  useEffect(() => {
    let active = true
    loadOperatingStructure(tenantId).then((data) => {
      if (!active) return
      const draft = data.state.structureDraft
      const legacyPack = listPacks().some(({ key }) => key === data.state.sectorPack) ? data.state.sectorPack : ""
      setForm({ ...EMPTY_STRUCTURE, sectorPack: legacyPack, ...draft })
      setStep(draft ? Math.min(data.state.currentStep, STRUCTURE_STEPS.length - 1) : 0)
      setDiagram(data.diagram)
      setLoaded(data)
    }).catch((failure) => { if (active) setError(failure.message) })
    return () => { active = false }
  }, [tenantId])

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
  const save = async () => {
    setBusy(true)
    setError("")
    setStatus("")
    try {
      await saveOperatingStructure(tenantId, form, diagram, loaded)
      const updated = await loadOperatingStructure(tenantId)
      setLoaded(updated)
      setDiagram(updated.diagram)
      setStatus("Operating structure saved.")
    } catch (failure) {
      setError(failure.message)
    } finally {
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
        <label className="dt-field"><span>Sector pack</span>
          <select value={form.sectorPack} onChange={(event) => {
            const sectorPack = event.target.value
            setForm({ ...EMPTY_STRUCTURE, sectorPack })
          }}>
            <option value="">Select a sector</option>
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
      {step === 3 && <TwinFlowDiagram {...diagram} onChange={(value) => { setDiagram(value); setStatus("") }}
        choices={graphChoices} roster={loaded.roster} peopleRoles={{ technical: form.technical, nonTechnical: form.nonTechnical }} />}
    </fieldset>
    <div className="dt-actions dt-structure-footer">
      <button type="button" className="dt-button" disabled={busy} onClick={() => step ? move(step - 1) : onCancel?.()}>Back</button>
      <div className="dt-actions">
        {status && onComplete && <button type="button" className="dt-button" onClick={onComplete}>Finish</button>}
        {step < 3
          ? <button type="button" className="dt-button dt-button-primary" disabled={busy || !sectorReady} onClick={() => move(step + 1)}>Continue</button>
          : <button type="button" className="dt-button dt-button-primary" disabled={busy || !sectorReady} onClick={save}>{busy ? "Saving…" : "Save operating structure"}</button>}
      </div>
    </div>
  </section>
}
