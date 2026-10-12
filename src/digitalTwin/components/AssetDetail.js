"use client"

/**
 * digitalTwin/components/AssetDetail.jsx
 *
 * Full asset page — identity, capacity, assignments, compliance, history.
 * Assignment history preserves every historical placement (Section 4.2 #7).
 */

import { useEffect, useState } from "react"
import { ArrowLeft, Plus, Pencil, CheckCircle2, AlertTriangle, XCircle, History } from "lucide-react"
import AssetForm from "./AssetForm"
import AssetAssignmentModal from "./AssetAssignmentModal"
import { getResource, updateResource, listAssignmentsForResource, closeAssignment, effectiveContextFor } from "../services/resourceService"
import { ASSET_STATUS } from "../models/enums"

const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55", line: "#ded8d4",
  lineSoft: "#e9e3df", lineStrong: "#b0a29b", bg: "#ffffff",
  panel: "#faf8f7", raised: "#f2eeec", accent: "#4a352f", accentTint: "#f4efec",
  green: "#166534", amber: "#92400e", red: "#991b1b",
  greenBg: "#f0fdf4", amberBg: "#fffbeb", redBg: "#fef2f2",
}
const btnBase = { padding: "9px 16px", borderRadius: "8px", fontSize: "13.5px", fontWeight: 500,
  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "7px", fontFamily: "inherit" }
const btnPrimary = { ...btnBase, background: T.accent, color: "#fff", border: `1px solid ${T.accent}`, fontWeight: 600 }
const btnGhost = { ...btnBase, background: T.bg, color: T.body, border: `1px solid ${T.lineStrong}` }
const cardS = { background: T.bg, border: `1px solid ${T.line}`, borderRadius: "10px", padding: "16px", marginBottom: "14px" }
const labelS = { display: "block", fontSize: "11px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }
const valueS = { fontSize: "14px", color: T.ink, fontWeight: 500 }
const TABS = ["Overview", "Assignment history", "Compliance"]

export default function AssetDetail({ tenantId, asset: initialAsset, onBack }) {
  const [asset, setAsset] = useState(initialAsset)
  const [assignments, setAssignments] = useState([])
  const [effectiveNow, setEffectiveNow] = useState([])
  const [activeTab, setActiveTab] = useState("Overview")
  const [editing, setEditing] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [loading, setLoading] = useState(true)

  const assetId = initialAsset.assetId || initialAsset.id

  const reload = async () => {
    setLoading(true)
    try {
      const [a, all, effective] = await Promise.all([
        getResource(tenantId, assetId),
        listAssignmentsForResource(tenantId, assetId),
        effectiveContextFor(tenantId, assetId),
      ])
      setAsset(a)
      setAssignments(all)
      setEffectiveNow(effective)
    } finally { setLoading(false) }
  }

  useEffect(() => { reload() }, [tenantId, assetId])

  const handleUpdate = async (form) => {
    await updateResource(tenantId, assetId, form)
    setEditing(false)
    await reload()
  }

  const closeActive = async (assignment) => {
    if (!window.confirm(`Close this assignment effective today?`)) return
    const today = new Date().toISOString().split("T")[0]
    await closeAssignment(tenantId, assignment.id, { effectiveTo: today, reason: "Closed from asset detail" })
    await reload()
  }

  if (loading && !asset) {
    return <div style={{ padding: "40px", textAlign: "center", color: T.muted }}>Loading asset…</div>
  }

  if (editing) {
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <AssetForm tenantId={tenantId} initial={asset} onSave={handleUpdate} onCancel={() => setEditing(false)} />
      </div>
    )
  }

  const statusColor = (s) => {
    if (["available", "operating"].includes(s)) return T.green
    if (["planned_maintenance", "standby", "commissioning"].includes(s)) return T.amber
    if (["unplanned_downtime", "suspended"].includes(s)) return T.red
    return T.muted
  }

  const Field = ({ label, value, mono = false }) => (
    <div>
      <span style={labelS}>{label}</span>
      <div style={{ ...valueS, fontFamily: mono ? "ui-monospace, monospace" : "inherit" }}>{value ?? "—"}</div>
    </div>
  )

  return (
    <div>
      <button onClick={onBack} style={{ ...btnGhost, marginBottom: "14px" }}><ArrowLeft size={14} /> Back to register</button>

      {/* Header */}
      <div style={{ ...cardS, background: T.panel }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px", flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: T.accent }}>{asset?.name}</h2>
              <span style={{
                padding: "3px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 700,
                background: `${statusColor(asset?.status)}22`, color: statusColor(asset?.status),
              }}>
                {String(asset?.status || "unknown").replace(/_/g, " ")}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: "13px", color: T.muted }}>
              {asset?.equipmentTypeId ? asset.equipmentTypeId.split(".").pop().replace(/_/g, " ") : "Unclassified"}
              {asset?.make && ` · ${asset.make} ${asset.model || ""}`.trim()}
              {asset?.internalNumber && ` · ${asset.internalNumber}`}
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setShowAssign(true)} style={btnPrimary}><Plus size={14} /> New assignment</button>
            <button onClick={() => setEditing(true)} style={btnGhost}><Pencil size={14} /> Edit</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "2px", borderBottom: `1px solid ${T.lineStrong}`, marginBottom: "16px" }}>
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{
              padding: "12px 20px", background: "none", border: "none", cursor: "pointer",
              fontSize: "14px", fontWeight: activeTab === tab ? 600 : 500,
              color: activeTab === tab ? T.accent : T.body,
              borderBottom: activeTab === tab ? `2px solid ${T.accent}` : "2px solid transparent",
              marginBottom: "-1px", fontFamily: "inherit",
            }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === "Overview" && (
        <>
          <div style={cardS}>
            <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Identity</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
              <Field label="Internal number" value={asset?.internalNumber} mono />
              <Field label="Serial number" value={asset?.serialNumber} mono />
              <Field label="Registration" value={asset?.registration} />
              <Field label="Barcode / QR" value={asset?.barcodeOrQr} mono />
            </div>
          </div>

          <div style={cardS}>
            <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Capacity</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
              <Field label="Nameplate capacity" value={asset?.nameplateCapacity ? `${asset.nameplateCapacity} ${asset.canonicalUnit}` : null} />
              <Field label="Current derated capacity" value={asset?.currentDeratedCapacity ? `${asset.currentDeratedCapacity} ${asset.canonicalUnit}` : null} />
              <Field label="Derating reason" value={asset?.deratingReason} />
            </div>
          </div>

          <div style={cardS}>
            <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Ownership</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
              <Field label="Owner" value={asset?.owner} />
              <Field label="Ownership type" value={asset?.ownershipType?.replace(/_/g, " ")} />
              <Field label="Lessor" value={asset?.lessor} />
              <Field label="Finance / SPV" value={asset?.financeOrSpv} />
              <Field label="Acquisition" value={asset?.acquisitionDate} />
              <Field label="Book / replacement value" value={asset?.bookOrReplacementValue ? `R ${asset.bookOrReplacementValue.toLocaleString()}` : null} />
            </div>
          </div>

          <div style={cardS}>
            <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Effective context (today)</h3>
            {effectiveNow.length === 0 ? (
              <p style={{ margin: 0, fontSize: "13.5px", color: T.muted, fontStyle: "italic" }}>
                No active assignment. This asset is not currently contributing to any site, contract, activity or group.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {effectiveNow.map((a) => (
                  <div key={a.id} style={{ padding: "10px 12px", background: T.panel, borderRadius: "8px", border: `1px solid ${T.lineSoft}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                      <div style={{ fontSize: "13.5px", color: T.ink }}>
                        {a.isPrimary && <span style={{ padding: "2px 8px", borderRadius: "999px", background: T.accentTint, color: T.accent, fontWeight: 700, fontSize: "10.5px", marginRight: "8px", letterSpacing: "0.3px" }}>PRIMARY</span>}
                        {describeContext(a)}
                      </div>
                      <button onClick={() => closeActive(a)} style={{ ...btnGhost, padding: "6px 12px", fontSize: "12px", color: T.red, borderColor: `${T.red}55` }}>
                        Close
                      </button>
                    </div>
                    {a.allocationBasis && (
                      <div style={{ fontSize: "11.5px", color: T.muted, marginTop: "4px" }}>
                        Allocation: {a.allocationValue} {a.allocationBasis === "approved_percentage" ? "%" : a.allocationUnit}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={cardS}>
            <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Data quality</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
              <Field label="Source" value={asset?.sourceSystem} />
              <Field label="Confidence" value={asset?.confidence?.replace(/_/g, " ")} />
              <Field label="Verification" value={asset?.verificationStatus} />
              <Field label="Steward" value={asset?.steward} />
            </div>
          </div>
        </>
      )}

      {/* Assignment history */}
      {activeTab === "Assignment history" && (
        <div style={cardS}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <History size={16} color={T.muted} />
            <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Assignment history — every historical placement preserved
            </h3>
          </div>
          {assignments.length === 0 ? (
            <p style={{ margin: 0, fontSize: "13.5px", color: T.muted, fontStyle: "italic" }}>No assignments yet.</p>
          ) : (
            <div style={{ overflowX: "auto", border: `1px solid ${T.lineSoft}`, borderRadius: "8px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: T.header, color: "#fff" }}>
                    {["Context", "Primary", "From", "To", "Allocation", "State"].map((h) => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "11px",
                        fontWeight: 700, letterSpacing: "0.4px", textTransform: "uppercase",
                        borderRight: "1px solid rgba(255,255,255,0.14)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a, i) => (
                    <tr key={a.id} style={{ background: i % 2 ? T.panel : T.bg, borderBottom: `1px solid ${T.lineSoft}` }}>
                      <td style={{ padding: "10px 12px", borderRight: `1px solid ${T.lineSoft}` }}>{describeContext(a)}</td>
                      <td style={{ padding: "10px 12px", borderRight: `1px solid ${T.lineSoft}` }}>
                        {a.isPrimary ? <CheckCircle2 size={15} color={T.green} /> : <span style={{ color: T.muted }}>—</span>}
                      </td>
                      <td style={{ padding: "10px 12px", borderRight: `1px solid ${T.lineSoft}` }}>{a.effectiveFrom || "—"}</td>
                      <td style={{ padding: "10px 12px", borderRight: `1px solid ${T.lineSoft}` }}>{a.effectiveTo || <span style={{ color: T.green }}>open</span>}</td>
                      <td style={{ padding: "10px 12px", borderRight: `1px solid ${T.lineSoft}`, fontSize: "12.5px", color: T.muted }}>
                        {a.allocationBasis ? `${a.allocationValue} ${a.allocationBasis === "approved_percentage" ? "%" : a.allocationUnit || ""}` : a.isPrimary ? "100%" : "—"}
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: "12.5px" }}>
                        <span style={{ padding: "2px 10px", borderRadius: "999px", fontWeight: 600,
                          background: a.state === "active" ? T.greenBg : a.state === "closed" ? T.raised : T.amberBg,
                          color: a.state === "active" ? T.green : a.state === "closed" ? T.muted : T.amber }}>
                          {a.state}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Compliance */}
      {activeTab === "Compliance" && (
        <div style={cardS}>
          <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Compliance status</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
            <Field label="Licence number" value={asset?.licenceNumber} />
            <Field label="Inspection expiry" value={asset?.inspectionExpiryDate} />
            <Field label="Certificate expiry" value={asset?.certificateExpiryDate} />
            <Field label="Evidence status" value={asset?.evidenceStatus} />
          </div>
          {asset?.inspectionExpiryDate && new Date(asset.inspectionExpiryDate) < new Date() && (
            <div style={{ marginTop: "14px", padding: "10px 14px", background: T.redBg, border: `1px solid ${T.red}33`, borderRadius: "8px", color: T.red, fontSize: "13.5px", display: "flex", alignItems: "center", gap: "8px" }}>
              <XCircle size={15} /> Inspection has expired — asset should not be listed as available.
            </div>
          )}
          {asset?.certificateExpiryDate && new Date(asset.certificateExpiryDate) < new Date() && (
            <div style={{ marginTop: "10px", padding: "10px 14px", background: T.redBg, border: `1px solid ${T.red}33`, borderRadius: "8px", color: T.red, fontSize: "13.5px", display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertTriangle size={15} /> Certificate has expired.
            </div>
          )}
        </div>
      )}

      {showAssign && (
        <AssetAssignmentModal
          tenantId={tenantId}
          assetId={assetId}
          assetName={asset?.name}
          onClose={() => setShowAssign(false)}
          onSaved={async () => { setShowAssign(false); await reload() }}
        />
      )}
    </div>
  )
}

function describeContext(a) {
  const bits = []
  if (a.siteId) bits.push(`Site ${a.siteId.slice(0, 6)}`)
  if (a.contractId) bits.push(`Contract ${a.contractId.slice(0, 6)}`)
  if (a.activityId) bits.push(`Activity ${a.activityId.slice(0, 6)}`)
  if (a.groupId) bits.push(`Group ${a.groupId.slice(0, 6)}`)
  if (a.serviceId) bits.push(`Service ${a.serviceId.slice(0, 6)}`)
  if (bits.length === 0) return "Unspecified context"
  return bits.join(" · ")
}