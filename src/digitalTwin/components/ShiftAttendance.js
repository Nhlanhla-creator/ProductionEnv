import { useEffect, useRef, useState } from "react"
import { Download, Save } from "lucide-react"
import { localDate } from "../models/shiftCapture"
import { loadAttendance, markAttendance } from "../services/teamService"
import { listResources } from "../services/resourceService"
import { downloadCsv } from "../models/downloadCsv"

const EMPTY = { status: "", vehicleId: "", vehicleLabel: "", role: "", reason: "", activity: "", checkIn: "", checkOut: "", notes: "" }
const EXTERNAL = "__external__"

function reasonOptions(person, status) {
  if (status === "absent") return ["Sick leave", "Annual leave", "Training off site", "Unscheduled absence"]
  const role = person.role || ""
  if (/driver|operat|haul|blasting|drill/i.test(role)) return ["Transport crew", "Move equipment", "Production assignment", "Site inspection"]
  if (/mainten|technician|engineer|fitter|mechanic/i.test(role)) return ["Planned maintenance", "Breakdown response", "Inspection", "Collect parts"]
  return ["Regular assignment", "Site visit", "Training", "Operational support"]
}

function AttendanceRow({ person, row, vehicles, saving, disabled, onChange, onSave }) {
  const title = (label) => `${label}: ${person.name}`
  const change = (key) => (event) => onChange({ [key]: event.target.value })
  const registered = vehicles.find(({ id }) => id === row.vehicleId)
  const enteredExternal = !row.vehicleId && !!row.externalVehicle
  const choice = row.vehicleId || (enteredExternal || row.vehicleLabel ? EXTERNAL : "")
  const listId = `shift-reasons-${person.id}`
  return <tr>
    <td><strong>{person.name}</strong></td><td>{row.role || person.role || "—"}</td>
    <td><div className="dt-attendance-buttons">
      {[["present", "Present"], ["absent", "Absent"]].map(([value, label]) =>
        <button type="button" key={value} aria-label={title(label)} aria-pressed={row.status === value} disabled={disabled}
          className={`dt-button dt-button-small ${row.status === value ? "dt-button-primary" : ""}`}
          onClick={() => onChange({ status: value })}>{label}</button>)}
    </div></td>
    <td><select aria-label={title("Vehicle or equipment used")} value={choice} disabled={disabled} onChange={(event) => {
      const id = event.target.value
      onChange({ vehicleId: id === EXTERNAL ? "" : id, externalVehicle: id === EXTERNAL,
        vehicleLabel: vehicles.find((vehicle) => vehicle.id === id)?.label || "" })
    }}>
      <option value="">None</option>
      {row.vehicleId && !registered && <option value={row.vehicleId}>{row.vehicleLabel || row.vehicleId} (previously recorded)</option>}
      {vehicles.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
      <option value={EXTERNAL}>Other vehicle</option>
    </select>
    {choice === EXTERNAL && <input aria-label={title("Other vehicle")} maxLength={300} value={row.vehicleLabel} disabled={disabled}
      placeholder="Vehicle name or registration" onChange={change("vehicleLabel")} />}</td>
    <td><input aria-label={title("Check in")} type="time" disabled={disabled} value={row.checkIn} onChange={change("checkIn")} /></td>
    <td><input aria-label={title("Check out")} type="time" disabled={disabled} value={row.checkOut} onChange={change("checkOut")} /></td>
    <td><input aria-label={title("Work or activity")} disabled={disabled} maxLength={240} placeholder="e.g. Haul ore to stockpile"
      value={row.activity} onChange={change("activity")} /></td>
    <td><input aria-label={title("Reason")} disabled={disabled} list={listId} maxLength={240} placeholder="Select or enter reason"
      value={row.reason} onChange={change("reason")} />
      <datalist id={listId}>{reasonOptions({ role: row.role || person.role }, row.status).map((reason) => <option key={reason} value={reason} />)}</datalist></td>
    <td><textarea aria-label={title("Shift notes")} disabled={disabled} maxLength={1000} rows={2} placeholder="What happened on shift?"
      value={row.notes} onChange={change("notes")} /></td>
    <td><button type="button" className="dt-button dt-button-small" disabled={disabled || !row.status}
      aria-label={title("Save attendance")} onClick={onSave}><Save size={14} /> {saving ? "Saving…" : "Save"}</button></td>
  </tr>
}

export default function ShiftAttendance({ tenantId, people, shifts }) {
  const [date, setDate] = useState(localDate)
  const [shiftId, setShiftId] = useState("")
  const [attendance, setAttendance] = useState({})
  const [edits, setEdits] = useState({})
  const [vehicles, setVehicles] = useState([])
  const [vehicleError, setVehicleError] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const pending = useRef(null)
  const active = shifts.filter((shift) => shift.active)
  const shift = active.find((record) => record.id === shiftId) || active[0]
  const effectiveShift = shift?.id

  useEffect(() => {
    let live = true
    listResources(tenantId, { resourceKind: "asset" }).then((items) => {
      if (live) setVehicles(items.filter((item) => !["retired", "disposed"].includes(item.status))
        .map((item) => ({ id: item.id, label: [item.name, item.registration || item.internalNumber].filter(Boolean).join(" · ") })))
    }).catch(() => { if (live) setVehicleError("Equipment could not be loaded. Select Other vehicle to enter a vehicle manually.") })
    return () => { live = false }
  }, [tenantId])

  useEffect(() => {
    let current = true
    setAttendance({})
    setEdits({})
    setError("")
    setNotice("")
    if (!date || !effectiveShift) { setLoading(false); return undefined }
    setLoading(true)
    loadAttendance(tenantId, date, effectiveShift).then((rows) => {
      if (current) setAttendance(rows)
    }).catch((failure) => {
      if (current) setError(failure.message)
    }).finally(() => {
      if (current) setLoading(false)
    })
    return () => { current = false }
  }, [tenantId, date, effectiveShift])

  const rowFor = (id) => ({ ...EMPTY, ...attendance[id], ...edits[id] })
  const save = async (person) => {
    if (pending.current) return
    const row = rowFor(person.id)
    if (row.externalVehicle && !row.vehicleLabel.trim()) {
      setError(`Enter the vehicle used by ${person.name}, or select None.`)
      return
    }
    pending.current = person.id
    setSaving(person.id)
    setError("")
    setNotice("")
    try {
      const saved = await markAttendance(tenantId, { date, shift, personId: person.id, ...row, role: row.role || person.role || "" })
      setAttendance((current) => ({ ...current, [person.id]: saved }))
      setEdits((current) => {
        const next = { ...current }
        delete next[person.id]
        return next
      })
      setNotice(`Attendance saved for ${person.name}.`)
    } catch (failure) {
      setError(failure.message)
    } finally {
      pending.current = null
      setSaving(null)
    }
  }
  const savedPeople = people.filter(({ id }) => attendance[id])
  const exportAttendance = () => downloadCsv(`shift-attendance-${date}-${effectiveShift}.csv`, [
    ["Date", "Shift", "Person", "Role", "Attendance", "Vehicle / equipment", "Check in", "Check out", "Work / activity", "Reason", "Shift notes"],
    ...savedPeople.map((person) => {
      const row = attendance[person.id]
      return [date, shift.name, person.name, row.role || person.role, row.status, row.vehicleLabel || row.vehicleId,
        row.checkIn, row.checkOut, row.activity, row.reason, row.notes]
    }),
  ])

  return <section className="dt-panel">
    <div className="dt-panel-head"><h3>Shift attendance</h3>
      <button type="button" className="dt-button dt-button-small" onClick={exportAttendance}
        disabled={loading || !!saving || !savedPeople.length}><Download size={15} /> Export CSV</button>
    </div>
    <div className="dt-asset-toolbar">
      <label className="dt-field"><span>Shift date</span><input type="date" disabled={!!saving}
        value={date} onChange={(event) => setDate(event.target.value)} /></label>
      <label className="dt-field"><span>Shift</span><select disabled={!!saving} value={effectiveShift || ""}
        onChange={(event) => setShiftId(event.target.value)}>
        {!active.length && <option value="">No active shifts</option>}
        {active.map((item) => <option value={item.id} key={item.id}>{item.name} · {item.startTime}–{item.endTime}</option>)}
      </select></label>
    </div>
    {error && <p role="alert" className="dt-notice dt-notice-error">{error}</p>}
    {notice && <p role="status" className="dt-notice dt-notice-success">{notice}</p>}
    {vehicleError && <p role="status" className="dt-muted">{vehicleError}</p>}
    {people.length ? <div className="dt-table-wrap"><table className="dt-table dt-shift-attendance-table">
      <thead><tr>{["Name", "Role", "Attendance", "Vehicle / equipment", "Check in", "Check out", "Work / activity", "Reason", "Shift notes", "Action"]
        .map((label) => <th scope="col" key={label}>{label}</th>)}</tr></thead>
      <tbody>{people.map((person) => <AttendanceRow key={person.id} person={person} row={rowFor(person.id)} vehicles={vehicles}
        saving={saving === person.id} disabled={loading || !!saving || !date || !shift}
        onChange={(patch) => setEdits((current) => ({ ...current, [person.id]: { ...current[person.id], ...patch } }))}
        onSave={() => save(person)} />)}</tbody>
    </table></div> : <div className="dt-empty">Add people in People setup to record attendance.</div>}
  </section>
}
