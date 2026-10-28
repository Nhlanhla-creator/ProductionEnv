"use client"

/**
 * digitalTwin/components/AssetForm.jsx
 *
 * Guided form for creating or editing an asset/resource. Field groups match
 * the schema exactly (Section 6.1). Non-asset kinds use a reduced field set.
 */

import { useEffect, useState } from "react"
import { Save, X } from "lucide-react"
import { createEmptyResource, validateResource, RESOURCE_KIND, OWNERSHIP_TYPE, CRITICALITY, CONDITION } from "../models/assetSchema"
import { ASSET_STATUS, DATA_CONFIDENCE } from "../models/enums"
import { UNITS, unitLabel, CANONICAL_UNIT } from "../models/units"
import { optionsFor } from "../services/taxonomyService"
import { listGroups, listOperatingSites } from "../services/resourceService"
import { normalAssetNumber } from "../models/assetIdentity"
import "../styles/Downtime.css"

const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55", line: "#ded8d4",
  lineSoft: "#e9e3df", lineStrong: "#b0a29b", bg: "#ffffff",
  panel: "#faf8f7", raised: "#f2eeec", accent: "#4a352f",
  accentTint: "#f4efec", red: "#991b1b", amber: "#92400e", green: "#166534",
}

const inputS = {
  width: "100%", padding: "9px 11px", border: `1px solid ${T.lineStrong}`,
  borderRadius: "8px", fontSize: "13.5px", fontFamily: "inherit",
  boxSizing: "border-box", color: T.ink, background: T.bg, outline: "none",
}
const labelS = { display: "block", fontSize: "12.5px", fontWeight: 600, color: T.accent, marginBottom: "5px" }
const cardS = { background: T.bg, border: `1px solid ${T.line}`, borderRadius: "10px", padding: "14px 16px" }
const sectionS = { marginBottom: "18px" }

const GROUPS = {
  identity: "Identity",
  classification: "Classification",
  ownership: "Ownership & commercial",
  capacity: "Capacity",
  lifecycle: "Lifecycle",
  metering: "Metering",
  maintenance: "Maintenance",
  compliance: "Compliance",
  dataQuality: "Data quality",
}

function Row({ children, cols = 2 }) { return <div className={`dt-fields ${cols === 3 ? "dt-fields-three" : ""}`} style={{ marginBottom: 12 }}>{children}</div> }
function Field({ label, name, children, required, errors = [], warnings = [] }) {
  const error = errors.find(e => e.field === name)?.message, warning = warnings.find(w => w.field === name)?.message
  return <div><label style={labelS}>{label}{required && <span style={{ color: T.red }}> *</span>}</label>{children}{error && <div role="alert" style={{ color: T.red, fontSize: 12 }}>{error}</div>}{warning && <div style={{ color: T.amber, fontSize: 12 }}>{warning}</div>}</div>
}

export default function AssetForm({ tenantId, initial = null, onSave, onCancel }) {
  const [form, setForm] = useState(() => initial || createEmptyResource(tenantId))
  const [errors, setErrors] = useState([])
  const [warnings, setWarnings] = useState([])
  const [saving, setSaving] = useState(false)
  const [groups, setGroups] = useState([])
  const [sites, setSites] = useState([])
  const [customType, setCustomType] = useState(false)
  useEffect(() => {
    let live = true
    if (!tenantId) return undefined
    Promise.all([listGroups(tenantId), listOperatingSites(tenantId)]).then(([g, s]) => { if (live) { setGroups(g); setSites(s) } }).catch(e => { if (live) setErrors([{ field: "_references", message: e.message }]) })
    return () => { live = false }
  }, [tenantId])

  const isAsset = form.resourceKind === RESOURCE_KIND.ASSET
  const isEdit = Boolean(initial?.assetId)

  const set = (patch) => setForm((p) => ({ ...p, ...patch }))

  // Equipment-type options — mining pack by default
  const equipmentTypeOptions = (() => {
    const families = optionsFor({ packKey: "mining", domain: "equipment_family" })
    const types = []
    families.forEach((f) => {
      const children = optionsFor({ packKey: "mining", domain: "equipment_type", parentId: f.id })
      children.forEach((t) => types.push({ id: t.id, name: `${f.name} › ${t.name}` }))
    })
    return types
  })()

  const handleSubmit = async () => {
    let submission = form
    if (isAsset) {
      try { submission = { ...form, internalNumber: normalAssetNumber(form.internalNumber) }; setForm(submission) } catch (e) { setErrors([{ field: "internalNumber", message: e.message }]); return }
    }
    const { ok, errors: verrs, warnings: vwarns } = validateResource(submission, { isCreate: !isEdit })
    setErrors(verrs); setWarnings(vwarns)
    if (!ok) return
    setSaving(true)
    try {
      await onSave(submission)
    } catch (e) {
      setErrors([{ field: "_submit", message: e.message || "Save failed" }])
    } finally {
      setSaving(false)
    }
  }


  return (
    <div className="dt-workspace" style={cardS}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: T.accent }}>
          {isEdit ? `Edit ${form.name || "asset"}` : "Add asset"}
        </h3>
        <button type="button" onClick={onCancel}
          style={{ background: T.raised, border: "none", cursor: "pointer", color: T.body,
            width: 30, height: 30, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={15} />
        </button>
      </div>

      {/* Resource kind selector — only at create */}
      {!isEdit && (
        <div style={sectionS}>
          <label style={labelS}>Resource kind</label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {Object.values(RESOURCE_KIND).map((k) => (
              <button key={k} type="button"
                onClick={() => set({ resourceKind: k })}
                style={{
                  padding: "8px 14px", borderRadius: "8px", cursor: "pointer",
                  fontFamily: "inherit", fontSize: "13px", fontWeight: 500,
                  border: form.resourceKind === k ? `1.5px solid ${T.accent}` : `1px solid ${T.lineStrong}`,
                  background: form.resourceKind === k ? T.accentTint : T.bg,
                  color: T.accent, textTransform: "capitalize",
                }}>
                {k}
              </button>
            ))}
          </div>
          <p style={{ fontSize: "11.5px", color: T.muted, margin: "6px 0 0" }}>
            Teams, consumables and logical resources skip asset-specific fields (capacity, metering, compliance).
          </p>
        </div>
      )}

      {/* Identity */}
      <div style={sectionS}>
        <h4 style={{ fontSize: "13px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px" }}>
          {GROUPS.identity}
        </h4>
        <Row>
          <Field errors={errors} warnings={warnings} label="Name" name="name" required>
            <input value={form.name || ""} onChange={(e) => set({ name: e.target.value })}
              style={inputS} placeholder="e.g. KMS TRK 014" />
          </Field>
          <Field errors={errors} warnings={warnings} label="Asset ID / internal number" name="internalNumber" required={isAsset}>
            <input value={form.internalNumber || ""} onChange={(e) => set({ internalNumber: e.target.value })}
              style={inputS} placeholder="e.g. TRK-014" />
          </Field>
        </Row>
        <Row>
          <Field errors={errors} warnings={warnings} label="Serial number" name="serialNumber">
            <input value={form.serialNumber || ""} onChange={(e) => set({ serialNumber: e.target.value })} style={inputS} />
          </Field>
          <Field errors={errors} warnings={warnings} label="Registration" name="registration">
            <input value={form.registration || ""} onChange={(e) => set({ registration: e.target.value })} style={inputS} />
          </Field>
        </Row>
        <Row>
          <Field errors={errors} warnings={warnings} label="Barcode / QR" name="barcodeOrQr">
            <input value={form.barcodeOrQr || ""} onChange={(e) => set({ barcodeOrQr: e.target.value })} style={inputS} />
          </Field>
          <div />
        </Row>
      </div>

      {/* Classification — asset only */}
      {isAsset && (
        <div style={sectionS}>
          <h4 style={{ fontSize: "13px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px" }}>
            {GROUPS.classification}
          </h4>
          <Row>
            <Field errors={errors} warnings={warnings} label="Asset type" name="equipmentTypeId" required>
              {customType ? <input value={form.equipmentTypeId || ""} onChange={e => set({ equipmentTypeId: e.target.value })} style={inputS} placeholder="e.g. Delivery van or processing line" /> : <select value={form.equipmentTypeId || ""} onChange={e => { if (e.target.value === "__custom__") { setCustomType(true); set({ equipmentTypeId: "" }) } else set({ equipmentTypeId: e.target.value || null }) }} style={inputS}>
                <option value="">Select equipment type…</option>
                {form.equipmentTypeId && !equipmentTypeOptions.some(o => o.id === form.equipmentTypeId) && <option value={form.equipmentTypeId}>{form.equipmentTypeId}</option>}
                {equipmentTypeOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                <option value="__custom__">Other industry / add own type…</option>
              </select>}
              <small style={{ color: T.muted }}>Use the same type ID for equipment that shares a downtime master list.</small>
            </Field>
            <Field errors={errors} warnings={warnings} label="Criticality" name="criticality">
              <select value={form.criticality || ""} onChange={(e) => set({ criticality: e.target.value })} style={inputS}>
                {Object.values(CRITICALITY).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </Row>
          <Row cols={3}>
            <Field errors={errors} warnings={warnings} label="Make" name="make">
              <input value={form.make || ""} onChange={(e) => set({ make: e.target.value })} style={inputS} placeholder="e.g. Caterpillar" />
            </Field>
            <Field errors={errors} warnings={warnings} label="Model" name="model">
              <input value={form.model || ""} onChange={(e) => set({ model: e.target.value })} style={inputS} placeholder="e.g. 777E" />
            </Field>
            <Field errors={errors} warnings={warnings} label="Year" name="year">
              <input type="number" value={form.year ?? ""} onChange={(e) => set({ year: e.target.value ? Number(e.target.value) : null })} style={inputS} />
            </Field>
          </Row>
          <Field errors={errors} warnings={warnings} label="Configuration" name="configuration">
            <input value={form.configuration || ""} onChange={(e) => set({ configuration: e.target.value })} style={inputS}
              placeholder="Body type, engine, attachments" />
          </Field>
        </div>
      )}

      {isAsset && <div style={sectionS}>
        <h4 style={{ color: T.accent }}>Group & operating location</h4>
        <Row>
          <Field errors={errors} warnings={warnings} label="Asset group (optional)" name="equipmentGroupId"><select style={inputS} value={form.equipmentGroupId || ""} onChange={e => set({ equipmentGroupId: e.target.value || null })}><option value="">No group</option>{form.equipmentGroupId && !groups.some(g => g.id === form.equipmentGroupId) && <option value={form.equipmentGroupId}>{form.equipmentGroupId}</option>}{groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></Field>
          <Field errors={errors} warnings={warnings} label="Site (optional)" name="siteId"><select style={inputS} value={form.siteId || ""} onChange={e => set({ siteId: e.target.value || null })}><option value="">No site</option>{form.siteId && !sites.some(s => s.id === form.siteId) && <option value={form.siteId}>{form.siteId}</option>}{sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
        </Row>
        <Field errors={errors} warnings={warnings} label="Location description (optional)" name="location"><input style={inputS} value={form.location || ""} onChange={e => set({ location: e.target.value })} placeholder="e.g. North pit / Workshop A" /></Field>
      </div>}

      {/* Ownership */}
      <div style={sectionS}>
        <h4 style={{ fontSize: "13px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px" }}>
          {GROUPS.ownership}
        </h4>
        <Row>
          <Field errors={errors} warnings={warnings} label="Owner" name="owner">
            <input value={form.owner || ""} onChange={(e) => set({ owner: e.target.value })} style={inputS} />
          </Field>
          <Field errors={errors} warnings={warnings} label="Ownership type" name="ownershipType">
            <select value={form.ownershipType || ""} onChange={(e) => set({ ownershipType: e.target.value })} style={inputS}>
              {Object.values(OWNERSHIP_TYPE).map((o) => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
            </select>
          </Field>
        </Row>
        <Row>
          <Field errors={errors} warnings={warnings} label="Lessor" name="lessor">
            <input value={form.lessor || ""} onChange={(e) => set({ lessor: e.target.value })} style={inputS} />
          </Field>
          <Field errors={errors} warnings={warnings} label="Finance / SPV entity" name="financeOrSpv">
            <input value={form.financeOrSpv || ""} onChange={(e) => set({ financeOrSpv: e.target.value })} style={inputS} />
          </Field>
        </Row>
        <Row>
          <Field errors={errors} warnings={warnings} label="Acquisition date" name="acquisitionDate">
            <input type="date" value={form.acquisitionDate || ""} onChange={(e) => set({ acquisitionDate: e.target.value || null })} style={inputS} />
          </Field>
          <Field errors={errors} warnings={warnings} label="Book / replacement value" name="bookOrReplacementValue">
            <input type="number" step="0.01" value={form.bookOrReplacementValue ?? ""} onChange={(e) => set({ bookOrReplacementValue: e.target.value ? Number(e.target.value) : null })} style={inputS} />
          </Field>
        </Row>
      </div>

      {/* Capacity — asset only */}
      {isAsset && (
        <div style={sectionS}>
          <h4 style={{ fontSize: "13px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px" }}>
            {GROUPS.capacity}
          </h4>
          <Row cols={3}>
            <Field errors={errors} warnings={warnings} label="Nameplate capacity" name="nameplateCapacity">
              <input type="number" step="0.01" value={form.nameplateCapacity ?? ""} onChange={(e) => set({ nameplateCapacity: e.target.value ? Number(e.target.value) : null })} style={inputS} />
            </Field>
            <Field errors={errors} warnings={warnings} label="Canonical unit" name="canonicalUnit" required>
              <select value={form.canonicalUnit || ""} onChange={(e) => set({ canonicalUnit: e.target.value })} style={inputS}>
                {Object.entries(UNITS).map(([code, u]) => <option key={code} value={code}>{unitLabel(code)} ({u.type})</option>)}
              </select>
            </Field>
            <Field errors={errors} warnings={warnings} label="Current derated capacity" name="currentDeratedCapacity">
              <input type="number" step="0.01" value={form.currentDeratedCapacity ?? ""} onChange={(e) => set({ currentDeratedCapacity: e.target.value ? Number(e.target.value) : null })} style={inputS} />
            </Field>
          </Row>
          <Field errors={errors} warnings={warnings} label="Derating reason" name="deratingReason">
            <input value={form.deratingReason || ""} onChange={(e) => set({ deratingReason: e.target.value })} style={inputS}
              placeholder="e.g. Restricted to 85t due to road condition" />
          </Field>
        </div>
      )}

      {/* Lifecycle */}
      <div style={sectionS}>
        <h4 style={{ fontSize: "13px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px" }}>
          {GROUPS.lifecycle}
        </h4>
        <Row cols={3}>
          <Field errors={errors} warnings={warnings} label="Status" name="status">
            <select value={form.status || ""} onChange={(e) => set({ status: e.target.value })} style={inputS}>
              {[...Object.values(ASSET_STATUS), "inactive"].map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
          </Field>
          <Field errors={errors} warnings={warnings} label="Condition" name="condition">
            <select value={form.condition || ""} onChange={(e) => set({ condition: e.target.value })} style={inputS}>
              {Object.values(CONDITION).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field errors={errors} warnings={warnings} label="Commissioned" name="commissionedDate">
            <input type="date" value={form.commissionedDate || ""} onChange={(e) => set({ commissionedDate: e.target.value || null })} style={inputS} />
          </Field>
        </Row>
        <Row>
          <Field errors={errors} warnings={warnings} label="Expected end of life" name="expectedEndOfLife">
            <input type="date" value={form.expectedEndOfLife || ""} onChange={(e) => set({ expectedEndOfLife: e.target.value || null })} style={inputS} />
          </Field>
          <Field errors={errors} warnings={warnings} label="Disposal date" name="disposalDate">
            <input type="date" value={form.disposalDate || ""} onChange={(e) => set({ disposalDate: e.target.value || null })} style={inputS} />
          </Field>
        </Row>
      </div>

      {/* Metering — asset only */}
      {isAsset && (
        <div style={sectionS}>
          <h4 style={{ fontSize: "13px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px" }}>
            {GROUPS.metering}
          </h4>
          <Row cols={4}>
            <Field errors={errors} warnings={warnings} label="Hour meter" name="hourMeter">
              <input type="number" step="0.1" value={form.hourMeter ?? ""} onChange={(e) => set({ hourMeter: e.target.value ? Number(e.target.value) : null })} style={inputS} />
            </Field>
            <Field errors={errors} warnings={warnings} label="Odometer" name="odometer">
              <input type="number" step="0.1" value={form.odometer ?? ""} onChange={(e) => set({ odometer: e.target.value ? Number(e.target.value) : null })} style={inputS} />
            </Field>
            <Field errors={errors} warnings={warnings} label="Cycle meter" name="cycleMeter">
              <input type="number" step="1" value={form.cycleMeter ?? ""} onChange={(e) => set({ cycleMeter: e.target.value ? Number(e.target.value) : null })} style={inputS} />
            </Field>
            <Field errors={errors} warnings={warnings} label="Fuel meter" name="fuelMeter">
              <input type="number" step="0.1" value={form.fuelMeter ?? ""} onChange={(e) => set({ fuelMeter: e.target.value ? Number(e.target.value) : null })} style={inputS} />
            </Field>
          </Row>
          <Field errors={errors} warnings={warnings} label="Last meter reading date" name="lastMeterReadingDate">
            <input type="date" value={form.lastMeterReadingDate || ""} onChange={(e) => set({ lastMeterReadingDate: e.target.value || null })} style={inputS} />
          </Field>
        </div>
      )}

      {/* Maintenance — asset only */}
      {isAsset && (
        <div style={sectionS}>
          <h4 style={{ fontSize: "13px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px" }}>
            {GROUPS.maintenance}
          </h4>
          <Row cols={3}>
            <Field errors={errors} warnings={warnings} label="Strategy" name="maintenanceStrategy">
              <select value={form.maintenanceStrategy || ""} onChange={(e) => set({ maintenanceStrategy: e.target.value })} style={inputS}>
                <option value="">Select…</option>
                <option value="preventive">Preventive</option>
                <option value="predictive">Predictive</option>
                <option value="condition_based">Condition-based</option>
                <option value="run_to_failure">Run-to-failure</option>
              </select>
            </Field>
            <Field errors={errors} warnings={warnings} label="Service interval (hours)" name="serviceIntervalHours">
              <input type="number" step="1" value={form.serviceIntervalHours ?? ""} onChange={(e) => set({ serviceIntervalHours: e.target.value ? Number(e.target.value) : null })} style={inputS} />
            </Field>
            <Field errors={errors} warnings={warnings} label="Responsible party" name="responsibleParty">
              <input value={form.responsibleParty || ""} onChange={(e) => set({ responsibleParty: e.target.value })} style={inputS} />
            </Field>
          </Row>
          <Row cols={3}>
            <Field errors={errors} warnings={warnings} label="Last service" name="lastServiceDate">
              <input type="date" value={form.lastServiceDate || ""} onChange={(e) => set({ lastServiceDate: e.target.value || null })} style={inputS} />
            </Field>
            <Field errors={errors} warnings={warnings} label="Next service due" name="nextServiceDueDate">
              <input type="date" value={form.nextServiceDueDate || ""} onChange={(e) => set({ nextServiceDueDate: e.target.value || null })} style={inputS} />
            </Field>
            <Field errors={errors} warnings={warnings} label="Warranty expiry" name="warrantyExpiryDate">
              <input type="date" value={form.warrantyExpiryDate || ""} onChange={(e) => set({ warrantyExpiryDate: e.target.value || null })} style={inputS} />
            </Field>
          </Row>
        </div>
      )}

      {/* Compliance — asset only */}
      {isAsset && (
        <div style={sectionS}>
          <h4 style={{ fontSize: "13px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px" }}>
            {GROUPS.compliance}
          </h4>
          <Row cols={3}>
            <Field errors={errors} warnings={warnings} label="Licence number" name="licenceNumber">
              <input value={form.licenceNumber || ""} onChange={(e) => set({ licenceNumber: e.target.value })} style={inputS} />
            </Field>
            <Field errors={errors} warnings={warnings} label="Inspection expiry" name="inspectionExpiryDate">
              <input type="date" value={form.inspectionExpiryDate || ""} onChange={(e) => set({ inspectionExpiryDate: e.target.value || null })} style={inputS} />
            </Field>
            <Field errors={errors} warnings={warnings} label="Certificate expiry" name="certificateExpiryDate">
              <input type="date" value={form.certificateExpiryDate || ""} onChange={(e) => set({ certificateExpiryDate: e.target.value || null })} style={inputS} />
            </Field>
          </Row>
          <Field errors={errors} warnings={warnings} label="Evidence status" name="evidenceStatus">
            <select value={form.evidenceStatus || "missing"} onChange={(e) => set({ evidenceStatus: e.target.value })} style={inputS}>
              <option value="missing">Missing</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
            </select>
          </Field>
        </div>
      )}

      {/* Data quality */}
      <div style={sectionS}>
        <h4 style={{ fontSize: "13px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px" }}>
          {GROUPS.dataQuality}
        </h4>
        <Row cols={3}>
          <Field errors={errors} warnings={warnings} label="Source system" name="sourceSystem">
            <select value={form.sourceSystem || "manual"} onChange={(e) => set({ sourceSystem: e.target.value })} style={inputS}>
              <option value="manual">Manual</option>
              <option value="import">Import</option>
              <option value="telematics">Telematics</option>
              <option value="cmmis">CMMS</option>
              <option value="erp">ERP</option>
            </select>
          </Field>
          <Field errors={errors} warnings={warnings} label="Confidence" name="confidence">
            <select value={form.confidence || ""} onChange={(e) => set({ confidence: e.target.value })} style={inputS}>
              {Object.values(DATA_CONFIDENCE).map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
            </select>
          </Field>
          <Field errors={errors} warnings={warnings} label="Steward" name="steward">
            <input value={form.steward || ""} onChange={(e) => set({ steward: e.target.value })} style={inputS} />
          </Field>
        </Row>
      </div>

      {/* Submit */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "12px", borderTop: `1px solid ${T.line}` }}>
        <button type="button" onClick={onCancel}
          style={{ padding: "9px 16px", borderRadius: "8px", border: `1px solid ${T.lineStrong}`,
            background: T.bg, color: T.body, cursor: "pointer", fontFamily: "inherit", fontSize: "13.5px", fontWeight: 500 }}>
          Cancel
        </button>
        <button type="button" onClick={handleSubmit} disabled={saving}
          style={{ padding: "9px 16px", borderRadius: "8px", border: `1px solid ${T.accent}`,
            background: T.accent, color: "#fff", cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "inherit", fontSize: "13.5px", fontWeight: 600, opacity: saving ? 0.6 : 1,
            display: "inline-flex", alignItems: "center", gap: "7px" }}>
          <Save size={14} /> {saving ? "Saving…" : (isEdit ? "Save changes" : "Create asset")}
        </button>
      </div>
    </div>
  )
}