"use client"

/**
 * digitalTwin/components/ImportCentre.jsx
 *
 * The Import Centre (Brief Section 8.5.1, 8.5.4, 8.5.5).
 *
 * Flow:
 *   1. Select sheet + scope + period
 *   2. Download context-bound template
 *   3. Upload the filled file
 *   4. Dry-run validation, showing row-level errors and warnings
 *   5. Commit only when zero blocking errors remain
 *   6. Rollback within the recovery window
 */

import { useEffect, useState } from "react"
import { Download, Upload, Check, AlertTriangle, XCircle, RotateCcw, FileText, Loader2 } from "lucide-react"
import { INPUT_SHEETS } from "../models/inputSheets"
import {
  createImportBatch, dryRunImportBatch, commitImportBatch, rollbackImportBatch,
  listImportBatches, getImportBatch,
} from "../services/importService"
import { downloadTemplate, parseUploadedTemplate, TEMPLATE_VERSION } from "../services/spreadsheetTemplateService"

const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55", line: "#ded8d4",
  lineSoft: "#e9e3df", lineStrong: "#b0a29b", bg: "#ffffff",
  panel: "#faf8f7", raised: "#f2eeec", accent: "#4a352f", accentTint: "#f4efec",
  red: "#991b1b", amber: "#92400e", green: "#166534",
  redBg: "#fef2f2", amberBg: "#fffbeb", greenBg: "#f0fdf4", header: "#33231e",
}
const btnBase = { padding: "9px 16px", borderRadius: "8px", fontSize: "13.5px", fontWeight: 500,
  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "7px", fontFamily: "inherit" }
const btnPrimary = { ...btnBase, background: T.accent, color: "#fff", border: `1px solid ${T.accent}`, fontWeight: 600 }
const btnGhost = { ...btnBase, background: T.bg, color: T.body, border: `1px solid ${T.lineStrong}` }
const inputS = { width: "100%", padding: "9px 11px", border: `1px solid ${T.lineStrong}`,
  borderRadius: "8px", fontSize: "13.5px", fontFamily: "inherit",
  boxSizing: "border-box", color: T.ink, background: T.bg, outline: "none" }
const labelS = { display: "block", fontSize: "12px", fontWeight: 600, color: T.accent, marginBottom: "5px" }
const cardS = { background: T.bg, border: `1px solid ${T.line}`, borderRadius: "10px", padding: "16px", marginBottom: "14px" }

const STATE_LABEL = {
  uploaded: "Uploaded",
  mapped: "Mapped",
  validating: "Validating",
  errors_found: "Errors found",
  ready: "Ready to commit",
  committed: "Committed",
  failed: "Failed",
  rolled_back: "Rolled back",
}

export default function ImportCentre({ tenantId, onBack }) {
  const [sheetId, setSheetId] = useState("IS05")
  const [contextId, setContextId] = useState("")
  const [batch, setBatch] = useState(null)
  const [batches, setBatches] = useState([])
  const [notification, setNotification] = useState(null)
  const [busy, setBusy] = useState(null)   // "dryrun" | "commit" | "rollback" | "upload"

  const notify = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 6000)
  }

  const loadBatches = async () => {
    if (!tenantId) return
    try {
      const list = await listImportBatches(tenantId, { pageSize: 50 })
      setBatches(list)
    } catch (err) { console.error(err) }
  }

  useEffect(() => { loadBatches() }, [tenantId])

  // ── Download template ──
  const handleDownload = () => {
    try {
      const fileName = downloadTemplate({ tenantId, sheetId, contextId: contextId || null, sectorPackKey: "mining" })
      notify("success", `Template downloaded: ${fileName}`)
    } catch (err) {
      notify("error", err.message)
    }
  }

  // ── Upload ──
  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy("upload")
    try {
      const parsed = await parseUploadedTemplate(file)
      if (parsed.meta.sheetId && parsed.meta.sheetId !== sheetId) {
        notify("error", `This file is for ${parsed.meta.sheetId}, not ${sheetId}. Switch the sheet or upload the correct template.`)
        return
      }
      const idempotencyKey = `${sheetId}:${file.name}:${file.size}:${file.lastModified}`
      const created = await createImportBatch(tenantId, {
        sheetId,
        idempotencyKey,
        fileName: file.name,
        rows: parsed.rows,
        templateVersion: parsed.meta.templateVersion,
        taxonomyVersion: parsed.meta.taxonomyVersion,
        contextId: parsed.meta.contextId,
      })
      if (created.idempotent) notify("info", "This file was already uploaded — showing the existing batch.")
      else notify("success", `Uploaded ${parsed.rows.length} rows for validation.`)
      setBatch(created)
      await loadBatches()
    } catch (err) {
      notify("error", err.message)
    } finally {
      setBusy(null)
      e.target.value = ""
    }
  }

  // ── Dry run ──
  const handleDryRun = async (b = batch) => {
    if (!b) return
    setBusy("dryrun")
    try {
      const result = await dryRunImportBatch(tenantId, b.id)
      setBatch(result)
      if (result.errorRows > 0) notify("warning", `${result.errorRows} row(s) have blocking errors.`)
      else notify("success", `Validation clean — ${result.validRows} rows ready to commit.`)
      await loadBatches()
    } catch (err) {
      notify("error", err.message)
    } finally { setBusy(null) }
  }

  // ── Commit ──
  const handleCommit = async () => {
    if (!batch) return
    setBusy("commit")
    try {
      const result = await commitImportBatch(tenantId, batch.id, { commitToken: batch.commitToken })
      setBatch(result)
      notify("success", `Committed ${result.rowIds?.length || 0} records.`)
      await loadBatches()
    } catch (err) {
      notify("error", err.message)
    } finally { setBusy(null) }
  }

  // ── Rollback ──
  const handleRollback = async () => {
    if (!batch) return
    if (!window.confirm(`Roll back this batch? All ${batch.rowIds?.length || 0} committed records will be deleted.`)) return
    setBusy("rollback")
    try {
      const reason = window.prompt("Reason for rollback (optional)") || ""
      await rollbackImportBatch(tenantId, batch.id, { reason })
      notify("success", "Batch rolled back.")
      setBatch(null)
      await loadBatches()
    } catch (err) {
      notify("error", err.message)
    } finally { setBusy(null) }
  }

  const selectBatch = async (id) => {
    const b = await getImportBatch(tenantId, id)
    setBatch(b)
  }

  const sheet = INPUT_SHEETS[sheetId]

  return (
    <div>
      {onBack && <button onClick={onBack} style={{ ...btnGhost, marginBottom: "14px" }}>← Back</button>}

      <h2 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: 700, color: T.accent }}>Import Centre</h2>
      <p style={{ margin: "0 0 18px", fontSize: "13px", color: T.muted }}>
        Download a context-bound template, fill it, upload for dry-run validation, then commit atomically.
      </p>

      {notification && (
        <div style={{
          padding: "11px 14px", borderRadius: "10px", marginBottom: "14px", fontSize: "13.5px",
          background: notification.type === "error" ? T.redBg : notification.type === "warning" ? T.amberBg : T.greenBg,
          border: `1px solid ${(notification.type === "error" ? T.red : notification.type === "warning" ? T.amber : T.green)}33`,
          color: notification.type === "error" ? T.red : notification.type === "warning" ? T.amber : T.green,
        }}>{notification.message}</div>
      )}

      {/* Step 1 — select sheet */}
      <div style={cardS}>
        <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          1. Select input sheet
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
          <div>
            <label style={labelS}>Sheet</label>
            <select value={sheetId} onChange={(e) => { setSheetId(e.target.value); setBatch(null) }} style={inputS}>
              {Object.values(INPUT_SHEETS).map((s) => (
                <option key={s.id} value={s.id}>{s.id} — {s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelS}>Context ID (optional)</label>
            <input value={contextId} onChange={(e) => setContextId(e.target.value)} style={inputS} placeholder="e.g. site:NORTH_PIT" />
          </div>
        </div>
        <div style={{ marginTop: "10px", fontSize: "12.5px", color: T.muted, lineHeight: 1.5 }}>
          <strong>{sheet.grain}.</strong> {sheet.frequency.replace(/_/g, " ")}. Template version {TEMPLATE_VERSION}.
        </div>
      </div>

      {/* Step 2 — template */}
      <div style={cardS}>
        <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          2. Download the template
        </h3>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button onClick={handleDownload} style={btnPrimary}><Download size={14} /> Download template (.xlsx)</button>
        </div>
        <p style={{ margin: "10px 0 0", fontSize: "12px", color: T.muted }}>
          The template embeds the sheet contract version, taxonomy version and your tenant ID so the importer can reject mismatches cleanly.
        </p>
      </div>

      {/* Step 3 — upload */}
      <div style={cardS}>
        <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          3. Upload your filled file
        </h3>
        <label style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
          padding: "22px", borderRadius: "10px", cursor: busy === "upload" ? "not-allowed" : "pointer",
          border: `2px dashed ${T.lineStrong}`, background: T.panel, color: T.body, fontSize: "13.5px",
          opacity: busy === "upload" ? 0.6 : 1,
        }}>
          {busy === "upload" ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
          <span>{busy === "upload" ? "Parsing file…" : "Click to choose an .xlsx file"}</span>
          <input type="file" accept=".xlsx,.xls" onChange={handleUpload} disabled={busy === "upload"}
            style={{ display: "none" }} />
        </label>
        <p style={{ margin: "10px 0 0", fontSize: "12px", color: T.muted }}>
          No operational records are written yet. Upload creates a batch that you dry-run next.
        </p>
      </div>

      {/* Step 4 — dry run + preview */}
      {batch && (
        <div style={cardS}>
          <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            4. Dry-run validation
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "14px" }}>
            <Stat label="Total rows" value={batch.totalRows} />
            <Stat label="Valid" value={batch.validRows ?? 0} color={T.green} />
            <Stat label="Warnings" value={batch.warningRows ?? 0} color={T.amber} />
            <Stat label="Errors" value={batch.errorRows ?? 0} color={T.red} />
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
            <button onClick={() => handleDryRun(batch)} disabled={busy === "dryrun" || batch.state === "committed"}
              style={{ ...btnGhost, opacity: (busy === "dryrun" || batch.state === "committed") ? 0.6 : 1 }}>
              {busy === "dryrun" ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} Run validation
            </button>
            <button onClick={handleCommit}
              disabled={busy === "commit" || batch.state !== "ready" || !batch.commitToken}
              style={{ ...btnPrimary, opacity: (busy === "commit" || batch.state !== "ready") ? 0.6 : 1 }}>
              {busy === "commit" ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Commit
            </button>
            {batch.state === "committed" && (
              <button onClick={handleRollback} disabled={busy === "rollback"}
                style={{ ...btnGhost, color: T.red, borderColor: `${T.red}55`, opacity: busy === "rollback" ? 0.6 : 1 }}>
                {busy === "rollback" ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />} Roll back
              </button>
            )}
          </div>

          <div style={{ fontSize: "12.5px", color: T.muted }}>
            <span style={{ padding: "3px 10px", borderRadius: "999px", background: T.raised, fontWeight: 600 }}>
              State: {STATE_LABEL[batch.state] || batch.state}
            </span>
            {batch.commitToken && <span style={{ marginLeft: "10px", fontFamily: "ui-monospace, monospace", fontSize: "11.5px" }}>Commit token issued.</span>}
          </div>

          {batch.errors?.length > 0 && (
            <div style={{ marginTop: "14px", border: `1px solid ${T.red}33`, borderRadius: "8px", background: T.redBg, overflow: "hidden" }}>
              <div style={{ padding: "10px 12px", borderBottom: `1px solid ${T.red}33`, fontWeight: 700, color: T.red, fontSize: "12px", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <XCircle size={14} /> Blocking errors
              </div>
              <div style={{ maxHeight: "260px", overflowY: "auto" }}>
                {batch.errors.slice(0, 100).map((e, i) => (
                  <div key={i} style={{ padding: "8px 12px", borderBottom: i < Math.min(batch.errors.length, 100) - 1 ? `1px solid ${T.red}22` : "none", fontSize: "12.5px", color: T.body }}>
                    <strong>Row {e.row}</strong>{e.field ? ` · ${e.field}` : ""} — {e.message}
                  </div>
                ))}
                {batch.errors.length > 100 && (
                  <div style={{ padding: "8px 12px", fontSize: "12px", color: T.muted, fontStyle: "italic" }}>
                    … {batch.errors.length - 100} more errors not shown.
                  </div>
                )}
              </div>
            </div>
          )}

          {batch.warnings?.length > 0 && (
            <div style={{ marginTop: "14px", border: `1px solid ${T.amber}33`, borderRadius: "8px", background: T.amberBg, overflow: "hidden" }}>
              <div style={{ padding: "10px 12px", borderBottom: `1px solid ${T.amber}33`, fontWeight: 700, color: T.amber, fontSize: "12px", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <AlertTriangle size={14} /> Warnings
              </div>
              <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                {batch.warnings.slice(0, 60).map((w, i) => (
                  <div key={i} style={{ padding: "8px 12px", borderBottom: i < Math.min(batch.warnings.length, 60) - 1 ? `1px solid ${T.amber}22` : "none", fontSize: "12.5px", color: T.body }}>
                    <strong>Row {w.row}</strong>{w.field ? ` · ${w.field}` : ""} — {w.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Batch history */}
      {batches.length > 0 && (
        <div style={cardS}>
          <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Recent batches
          </h3>
          <div style={{ overflowX: "auto", border: `1px solid ${T.lineSoft}`, borderRadius: "8px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
              <thead>
                <tr style={{ background: T.header, color: "#fff" }}>
                  {["Batch", "Sheet", "File", "State", "Rows", "When"].map((h) => (
                    <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontSize: "11px", fontWeight: 700, letterSpacing: "0.4px", textTransform: "uppercase", borderRight: "1px solid rgba(255,255,255,0.14)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {batches.map((b, i) => (
                  <tr key={b.id} style={{ background: i % 2 ? T.panel : T.bg, borderBottom: `1px solid ${T.lineSoft}`, cursor: "pointer" }}
                    onClick={() => selectBatch(b.id)}>
                    <td style={{ padding: "9px 12px", borderRight: `1px solid ${T.lineSoft}`, fontFamily: "ui-monospace, monospace", fontSize: "11.5px", color: T.muted }}>{b.id.slice(0, 8)}</td>
                    <td style={{ padding: "9px 12px", borderRight: `1px solid ${T.lineSoft}` }}>{b.sheetId}</td>
                    <td style={{ padding: "9px 12px", borderRight: `1px solid ${T.lineSoft}` }}>{b.fileName || "—"}</td>
                    <td style={{ padding: "9px 12px", borderRight: `1px solid ${T.lineSoft}` }}>
                      <span style={{ padding: "2px 9px", borderRadius: "999px", fontWeight: 600, fontSize: "11px",
                        background: b.state === "committed" ? T.greenBg : b.state === "errors_found" ? T.redBg : b.state === "ready" ? T.amberBg : T.raised,
                        color: b.state === "committed" ? T.green : b.state === "errors_found" ? T.red : b.state === "ready" ? T.amber : T.muted }}>
                        {STATE_LABEL[b.state] || b.state}
                      </span>
                    </td>
                    <td style={{ padding: "9px 12px", borderRight: `1px solid ${T.lineSoft}` }}>
                      {b.validRows ?? 0} valid · {b.errorRows ?? 0} errors
                    </td>
                    <td style={{ padding: "9px 12px", color: T.muted }}>
                      {b.createdAt ? new Date(b.createdAt).toLocaleString("en-ZA", { dateStyle: "short", timeStyle: "short" }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div style={{ padding: "12px 14px", background: T.panel, borderRadius: "8px", border: `1px solid ${T.lineSoft}` }}>
      <div style={{ fontSize: "10.5px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</div>
      <div style={{ fontSize: "20px", fontWeight: 700, color: color || T.ink, marginTop: "2px", fontVariantNumeric: "tabular-nums" }}>{value}</div>
    </div>
  )
}