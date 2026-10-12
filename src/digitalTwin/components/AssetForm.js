"use client"

/**
 * digitalTwin/components/AssetForm.jsx
 *
 * Guided form for creating or editing an asset/resource. Field groups match
 * the schema exactly (Section 6.1). Non-asset kinds use a reduced field set.
 */

import { useState } from "react"
import { Save, X } from "lucide-react"
import { createEmptyResource, validateResource, RESOURCE_KIND, OWNERSHIP_TYPE, CRITICALITY, CONDITION } from "../models/assetSchema"
import { ASSET_STATUS, DATA_CONFIDENCE } from "../models/enums"
import { UNITS, unitLabel, CANONICAL_UNIT } from "../models/units"
import { optionsFor } from "../services/taxonomyService"

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

export default function AssetForm({ tenantId, initial = null, onSave, onCancel }) {
  const [form, setForm] = useState(() => initial || createEmptyResource(tenantId))
  const [errors, setErrors] = useState([])
  const [warnings, setWarnings] = useState([])
  const [saving, setSaving] = useState(false)

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
    const { ok, errors: verrs, warnings: vwarns } = validateResource(form, { isCreate: !isEdit })
    setErrors(verrs); setWarnings(vwarns)
    if (!ok) return
    setSaving(true)
    try {
      await onSave(form)
    } catch (e) {
      setErrors([{ field: "_submit", message: e.message || "Save failed" }])
    } finally {
      setSaving(false)
    }
  }

  const fieldError = (name) => errors.find((e) => e.field === name)?.message
  const fieldWarning = (name) => warnings.find((w) => w.field === name)?.message

  const Err = ({ name }) => {
    const e = fieldError(name)
    return e ? <div style={{ color: T.red, fontSize: "11.5px", marginTop: "3px" }}>{e}</div> : null
  }
  const Warn = ({ name }) => {
    const w = fieldWarning(name)
    return w ? <div style={{ color: T.amber, fontSize: "11.5px", marginTop: "3px" }}>{w}</div> : null
  }

  const Row = ({ children, cols = 2 }) => (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: "12px", marginBottom: "12px" }}>
      {children}
    </div>
  )
  const Field = ({ label, name, children, required }) => (
    <div>
      <label style={labelS}>{label}{required && <span style={{ color: T.red }}> *</span>}</label>
      {children}
      <Err name={name} />
      <Warn name={name} />
    </div>
  )

  return (
    <div style={cardS}>
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
          <Field label="Name" name="name" required>
            <input value={form.name || ""} onChange={(e) => set({ name: e.target.value })}
              style={inputS} placeholder="e.g. KMS TRK 014" />
          </Field>
          <Field label="Internal number" name="internalNumber">
            <input value={form.internalNumber || ""} onChange={(e) => set({ internalNumber: e.target.value })}
              style={inputS} placeholder="e.g. TRK-014" />
          </Field>
        </Row>
        <Row>
          <Field label="Serial number" name="serialNumber">
            <input value={form.serialNumber || ""} onChange={(e) => set({ serialNumber: e.target.value })} style={inputS} />
          </Field>
          <Field label="Registration" name="registration">
            <input value={form.registration || ""} onChange={(e) => set({ registration: e.target.value })} style={inputS} />
          </Field>
        </Row>
        <Row>
          <Field label="Barcode / QR" name="barcodeOrQr">
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
            <Field label="Canonical equipment type" name="equipmentTypeId" required>
              <select value={form.equipmentTypeId || ""} onChange={(e) => set({ equipmentTypeId: e.target.value || null })} style={inputS}>
                <option value="">Select equipment type…</option>
                {equipmentTypeOptions.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </Field>
            <Field label="Criticality" name="criticality">
              <select value={form.criticality || ""} onChange={(e) => set({ criticality: e.target.value })} style={inputS}>
                {Object.values(CRITICALITY).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </Row>
          <Row cols={3}>
            <Field label="Make" name="make">
              <input value={form.make || ""} onChange={(e) => set({ make: e.target.value })} style={inputS} placeholder="e.g. Caterpillar" />
            </Field>
            <Field label="Model" name="model">
              <input value={form.model || ""} onChange={(e) => set({ model: e.target.value })} style={inputS} placeholder="e.g. 777E" />
            </Field>
            <Field label="Year" name="year">
              <input type="number" value={form.year ?? ""} onChange={(e) => set({ year: e.target.value ? Number(e.target.value) : null })} style={inputS} />
            </Field>
          </Row>
          <Field label="Configuration" name="configuration">
            <input value={form.configuration || ""} onChange={(e) => set({ configuration: e.target.value })} style={inputS}
              placeholder="Body type, engine, attachments" />
          </Field>
        </div>
      )}

      {/* Ownership */}
      <div style={sectionS}>
        <h4 style={{ fontSize: "13px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px" }}>
          {GROUPS.ownership}
        </h4>
        <Row>
          <Field label="Owner" name="owner">
            <input value={form.owner || ""} onChange={(e) => set({ owner: e.target.value })} style={inputS} />
          </Field>
          <Field label="Ownership type" name="ownershipType">
            <select value={form.ownershipType || ""} onChange={(e) => set({ ownershipType: e.target.value })} style={inputS}>
              {Object.values(OWNERSHIP_TYPE).map((o) => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
            </select>
          </Field>
        </Row>
        <Row>
          <Field label="Lessor" name="lessor">
            <input value={form.lessor || ""} onChange={(e) => set({ lessor: e.target.value })} style={inputS} />
          </Field>
          <Field label="Finance / SPV entity" name="financeOrSpv">
            <input value={form.financeOrSpv || ""} onChange={(e) => set({ financeOrSpv: e.target.value })} style={inputS} />
          </Field>
        </Row>
        <Row>
          <Field label="Acquisition date" name="acquisitionDate">
            <input type="date" value={form.acquisitionDate || ""} onChange={(e) => set({ acquisitionDate: e.target.value || null })} style={inputS} />
          </Field>
          <Field label="Book / replacement value" name="bookOrReplacementValue">
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
            <Field label="Nameplate capacity" name="nameplateCapacity">
              <input type="number" step="0.01" value={form.nameplateCapacity ?? ""} onChange={(e) => set({ nameplateCapacity: e.target.value ? Number(e.target.value) : null })} style={inputS} />
            </Field>
            <Field label="Canonical unit" name="canonicalUnit" required>
              <select value={form.canonicalUnit || ""} onChange={(e) => set({ canonicalUnit: e.target.value })} style={inputS}>
                {Object.entries(UNITS).map(([code, u]) => <option key={code} value={code}>{unitLabel(code)} ({u.type})</option>)}
              </select>
            </Field>
            <Field label="Current derated capacity" name="currentDeratedCapacity">
              <input type="number" step="0.01" value={form.currentDeratedCapacity ?? ""} onChange={(e) => set({ currentDeratedCapacity: e.target.value ? Number(e.target.value) : null })} style={inputS} />
            </Field>
          </Row>
          <Field label="Derating reason" name="deratingReason">
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
          <Field label="Status" name="status">
            <select value={form.status || ""} onChange={(e) => set({ status: e.target.value })} style={inputS}>
              {Object.values(ASSET_STATUS).map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
          </Field>
          <Field label="Condition" name="condition">
            <select value={form.condition || ""} onChange={(e) => set({ condition: e.target.value })} style={inputS}>
              {Object.values(CONDITION).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Commissioned" name="commissionedDate">
            <input type="date" value={form.commissionedDate || ""} onChange={(e) => set({ commissionedDate: e.target.value || null })} style={inputS} />
          </Field>
        </Row>
        <Row>
          <Field label="Expected end of life" name="expectedEndOfLife">
            <input type="date" value={form.expectedEndOfLife || ""} onChange={(e) => set({ expectedEndOfLife: e.target.value || null })} style={inputS} />
          </Field>
          <Field label="Disposal date" name="disposalDate">
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
            <Field label="Hour meter" name="hourMeter">
              <input type="number" step="0.1" value={form.hourMeter ?? ""} onChange={(e) => set({ hourMeter: e.target.value ? Number(e.target.value) : null })} style={inputS} />
            </Field>
            <Field label="Odometer" name="odometer">
              <input type="number" step="0.1" value={form.odometer ?? ""} onChange={(e) => set({ odometer: e.target.value ? Number(e.target.value) : null })} style={inputS} />
            </Field>
            <Field label="Cycle meter" name="cycleMeter">
              <input type="number" step="1" value={form.cycleMeter ?? ""} onChange={(e) => set({ cycleMeter: e.target.value ? Number(e.target.value) : null })} style={inputS} />
            </Field>
            <Field label="Fuel meter" name="fuelMeter">
              <input type="number" step="0.1" value={form.fuelMeter ?? ""} onChange={(e) => set({ fuelMeter: e.target.value ? Number(e.target.value) : null })} style={inputS} />
            </Field>
          </Row>
          <Field label="Last meter reading date" name="lastMeterReadingDate">
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
            <Field label="Strategy" name="maintenanceStrategy">
              <select value={form.maintenanceStrategy || ""} onChange={(e) => set({ maintenanceStrategy: e.target.value })} style={inputS}>
                <option value="">Select…</option>
                <option value="preventive">Preventive</option>
                <option value="predictive">Predictive</option>
                <option value="condition_based">Condition-based</option>
                <option value="run_to_failure">Run-to-failure</option>
              </select>
            </Field>
            <Field label="Service interval (hours)" name="serviceIntervalHours">
              <input type="number" step="1" value={form.serviceIntervalHours ?? ""} onChange={(e) => set({ serviceIntervalHours: e.target.value ? Number(e.target.value) : null })} style={inputS} />
            </Field>
            <Field label="Responsible party" name="responsibleParty">
              <input value={form.responsibleParty || ""} onChange={(e) => set({ responsibleParty: e.target.value })} style={inputS} />
            </Field>
          </Row>
          <Row cols={3}>
            <Field label="Last service" name="lastServiceDate">
              <input type="date" value={form.lastServiceDate || ""} onChange={(e) => set({ lastServiceDate: e.target.value || null })} style={inputS} />
            </Field>
            <Field label="Next service due" name="nextServiceDueDate">
              <input type="date" value={form.nextServiceDueDate || ""} onChange={(e) => set({ nextServiceDueDate: e.target.value || null })} style={inputS} />
            </Field>
            <Field label="Warranty expiry" name="warrantyExpiryDate">
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
            <Field label="Licence number" name="licenceNumber">
              <input value={form.licenceNumber || ""} onChange={(e) => set({ licenceNumber: e.target.value })} style={inputS} />
            </Field>
            <Field label="Inspection expiry" name="inspectionExpiryDate">
              <input type="date" value={form.inspectionExpiryDate || ""} onChange={(e) => set({ inspectionExpiryDate: e.target.value || null })} style={inputS} />
            </Field>
            <Field label="Certificate expiry" name="certificateExpiryDate">
              <input type="date" value={form.certificateExpiryDate || ""} onChange={(e) => set({ certificateExpiryDate: e.target.value || null })} style={inputS} />
            </Field>
          </Row>
          <Field label="Evidence status" name="evidenceStatus">
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
          <Field label="Source system" name="sourceSystem">
            <select value={form.sourceSystem || "manual"} onChange={(e) => set({ sourceSystem: e.target.value })} style={inputS}>
              <option value="manual">Manual</option>
              <option value="import">Import</option>
              <option value="telematics">Telematics</option>
              <option value="cmmis">CMMS</option>
              <option value="erp">ERP</option>
            </select>
          </Field>
          <Field label="Confidence" name="confidence">
            <select value={form.confidence || ""} onChange={(e) => set({ confidence: e.target.value })} style={inputS}>
              {Object.values(DATA_CONFIDENCE).map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
            </select>
          </Field>
          <Field label="Steward" name="steward">
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