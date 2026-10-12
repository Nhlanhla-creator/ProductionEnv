"use client"

/**
 * digitalTwin/components/ReportingPeriodManager.jsx
 *
 * Period calendar and target entry (Brief Section 8.5.2 IS04).
 * A period may be open or closed; closing freezes approved values
 * (Section 7.6).
 */

import { useEffect, useState } from "react"
import { Plus, Lock, Unlock, Save } from "lucide-react"
import { db, auth } from "../../firebaseConfig"
import { collection, doc, getDocs, setDoc, updateDoc, query, where, limit } from "firebase/firestore"

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

const currentMonthKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export default function ReportingPeriodManager({ tenantId, onBack }) {
  const [periods, setPeriods] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [notification, setNotification] = useState(null)

  const notify = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 4000)
  }

  const reload = async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const q = query(collection(db, "digitalTwinTenants", tenantId, "reportingPeriods"), limit(500))
      const snap = await getDocs(q)
      setPeriods(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    } finally { setLoading(false) }
  }

  useEffect(() => { reload() }, [tenantId])

  const newPeriod = () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    setEditing({
      _new: true,
      periodKey: currentMonthKey(),
      periodType: "month",
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      timezone: "Africa/Johannesburg",
      workingCalendar: "24_7",
      status: "open",
      scheduledHours: null,
      targetKpiId: "",
      targetValue: null,
      warningValue: null,
      criticalValue: null,
    })
  }

  const save = async () => {
    if (!editing) return
    try {
      const id = editing.id || editing.periodKey
      const ref = doc(db, "digitalTwinTenants", tenantId, "reportingPeriods", id)
      await setDoc(ref, { ...editing, id, updatedAt: new Date().toISOString() }, { merge: true })
      notify("success", editing._new ? "Period created." : "Period updated.")
      setEditing(null)
      await reload()
    } catch (err) {
      notify("error", err.message)
    }
  }

  const toggleStatus = async (period) => {
    const nextStatus = period.status === "closed" ? "open" : "closed"
    if (nextStatus === "closed" && !window.confirm("Closing this period freezes approved values. Continue?")) return
    try {
      const ref = doc(db, "digitalTwinTenants", tenantId, "reportingPeriods", period.id)
      await updateDoc(ref, { status: nextStatus, updatedAt: new Date().toISOString() })
      notify("success", `Period ${nextStatus}.`)
      await reload()
    } catch (err) { notify("error", err.message) }
  }

  return (
    <div>
      {onBack && <button onClick={onBack} style={{ ...btnGhost, marginBottom: "14px" }}>← Back</button>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: T.accent }}>Reporting periods and targets</h2>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: T.muted }}>
            Freeze approved periods and set targets for KPI attainment.
          </p>
        </div>
        <button onClick={newPeriod} style={btnPrimary}><Plus size={14} /> New period</button>
      </div>

      {notification && (
        <div style={{ padding: "11px 14px", borderRadius: "10px", margin: "14px 0", fontSize: "13.5px",
          background: notification.type === "error" ? T.redBg : T.greenBg,
          border: `1px solid ${(notification.type === "error" ? T.red : T.green)}33`,
          color: notification.type === "error" ? T.red : T.green }}>{notification.message}</div>
      )}

      {editing && (
        <div style={{ ...cardS, background: T.panel }}>
          <h3 style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: 600, color: T.accent }}>
            {editing._new ? "New period" : "Edit period"}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={labelS}>Period key</label>
              <input value={editing.periodKey || ""} onChange={(e) => setEditing({ ...editing, periodKey: e.target.value })}
                style={inputS} placeholder="e.g. 2026-04" disabled={!editing._new} />
            </div>
            <div>
              <label style={labelS}>Type</label>
              <select value={editing.periodType} onChange={(e) => setEditing({ ...editing, periodType: e.target.value })} style={inputS}>
                <option value="month">Month</option>
                <option value="week">Week</option>
                <option value="quarter">Quarter</option>
                <option value="year">Year</option>
              </select>
            </div>
            <div>
              <label style={labelS}>Status</label>
              <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} style={inputS}>
                <option value="planned">Planned</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={labelS}>Start</label>
              <input type="date" value={editing.startDate} onChange={(e) => setEditing({ ...editing, startDate: e.target.value })} style={inputS} />
            </div>
            <div>
              <label style={labelS}>End</label>
              <input type="date" value={editing.endDate} onChange={(e) => setEditing({ ...editing, endDate: e.target.value })} style={inputS} />
            </div>
            <div>
              <label style={labelS}>Timezone</label>
              <input value={editing.timezone} onChange={(e) => setEditing({ ...editing, timezone: e.target.value })} style={inputS} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={labelS}>Target KPI</label>
              <input value={editing.targetKpiId || ""} onChange={(e) => setEditing({ ...editing, targetKpiId: e.target.value })}
                style={inputS} placeholder="e.g. kpi.physical_availability" />
            </div>
            <div>
              <label style={labelS}>Target value</label>
              <input type="number" value={editing.targetValue ?? ""} onChange={(e) => setEditing({ ...editing, targetValue: e.target.value ? Number(e.target.value) : null })} style={inputS} />
            </div>
            <div>
              <label style={labelS}>Warning</label>
              <input type="number" value={editing.warningValue ?? ""} onChange={(e) => setEditing({ ...editing, warningValue: e.target.value ? Number(e.target.value) : null })} style={inputS} />
            </div>
            <div>
              <label style={labelS}>Critical</label>
              <input type="number" value={editing.criticalValue ?? ""} onChange={(e) => setEditing({ ...editing, criticalValue: e.target.value ? Number(e.target.value) : null })} style={inputS} />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button onClick={() => setEditing(null)} style={btnGhost}>Cancel</button>
            <button onClick={save} style={btnPrimary}><Save size={14} /> Save</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: T.muted, fontSize: "13.5px" }}>Loading periods…</div>
      ) : periods.length === 0 ? (
        <div style={cardS}>
          <p style={{ margin: 0, fontSize: "13.5px", color: T.muted, fontStyle: "italic" }}>
            No periods yet. Click <strong>New period</strong> to open the first reporting window.
          </p>
        </div>
      ) : (
        <div style={{ border: `1px solid ${T.lineStrong}`, borderRadius: "12px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: T.header, color: "#fff" }}>
                {["Period", "Type", "Start", "End", "Status", "Target", ""].map((h) => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "11px", fontWeight: 700, letterSpacing: "0.4px", textTransform: "uppercase", borderRight: "1px solid rgba(255,255,255,0.14)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((p, i) => (
                <tr key={p.id} style={{ background: i % 2 ? T.panel : T.bg, borderBottom: `1px solid ${T.lineSoft}` }}>
                  <td style={{ padding: "10px 12px", borderRight: `1px solid ${T.lineSoft}`, fontFamily: "ui-monospace, monospace", fontSize: "12px" }}>{p.periodKey || p.id}</td>
                  <td style={{ padding: "10px 12px", borderRight: `1px solid ${T.lineSoft}` }}>{p.periodType}</td>
                  <td style={{ padding: "10px 12px", borderRight: `1px solid ${T.lineSoft}` }}>{p.startDate}</td>
                  <td style={{ padding: "10px 12px", borderRight: `1px solid ${T.lineSoft}` }}>{p.endDate}</td>
                  <td style={{ padding: "10px 12px", borderRight: `1px solid ${T.lineSoft}` }}>
                    <span style={{ padding: "2px 10px", borderRadius: "999px", fontWeight: 600, fontSize: "11.5px",
                      background: p.status === "closed" ? T.raised : p.status === "open" ? T.greenBg : T.amberBg,
                      color: p.status === "closed" ? T.muted : p.status === "open" ? T.green : T.amber }}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", borderRight: `1px solid ${T.lineSoft}`, fontSize: "12.5px", color: T.muted }}>
                    {p.targetKpiId ? `${p.targetKpiId.split(".").pop()} = ${p.targetValue ?? "—"}` : "—"}
                  </td>
                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => setEditing({ ...p })} style={{ ...btnGhost, padding: "5px 10px", fontSize: "12px" }}>Edit</button>
                      <button onClick={() => toggleStatus(p)} style={{ ...btnGhost, padding: "5px 10px", fontSize: "12px",
                        color: p.status === "closed" ? T.green : T.amber }}>
                        {p.status === "closed" ? <><Unlock size={12} /> Reopen</> : <><Lock size={12} /> Close</>}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}