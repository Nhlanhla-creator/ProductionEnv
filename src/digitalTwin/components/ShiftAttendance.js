import { useEffect, useState } from "react"
import { localDate } from "../models/shiftCapture"
import { loadAttendance, markAttendance } from "../services/teamService"

export default function ShiftAttendance({ tenantId, people, shifts }) {
  const [date, setDate] = useState(localDate)
  const [shiftId, setShiftId] = useState("")
  const [attendance, setAttendance] = useState({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const active = shifts.filter((shift) => shift.active)
  const shift = active.find((record) => record.id === shiftId) || active[0]
  const effectiveShift = shift?.id

  useEffect(() => {
    let current = true
    setAttendance({})
    setError("")
    setLoading(true)
    if (!date || !effectiveShift) {
      setLoading(false)
      return undefined
    }
    loadAttendance(tenantId, date, effectiveShift).then((rows) => {
      if (current) setAttendance(rows)
    }).catch((failure) => {
      if (current) setError(failure.message)
    }).finally(() => {
      if (current) setLoading(false)
    })
    return () => { current = false }
  }, [tenantId, date, effectiveShift])

  const mark = async (personId, status) => {
    setBusy(true)
    setError("")
    try {
      await markAttendance(tenantId, { date, shift, personId, status })
      setAttendance((current) => ({ ...current, [personId]: status }))
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  return <section className="dt-panel">
    <div className="dt-panel-head"><h3>Shift attendance</h3></div>
    <div className="dt-asset-toolbar">
      <label className="dt-field"><span>Shift date</span><input type="date" disabled={busy}
        value={date} onChange={(event) => setDate(event.target.value)} /></label>
      <label className="dt-field"><span>Shift</span><select disabled={busy} value={effectiveShift || ""}
        onChange={(event) => setShiftId(event.target.value)}>
        {!active.length && <option value="">No active shifts</option>}
        {active.map((item) => <option value={item.id} key={item.id}>{item.name} · {item.startTime}–{item.endTime}</option>)}
      </select></label>
    </div>
    {error && <p role="alert" className="dt-notice dt-notice-error">{error}</p>}
    {people.length ? <div className="dt-table-wrap"><table className="dt-table">
      <thead><tr><th>Name</th><th>Role</th><th>Attendance</th></tr></thead>
      <tbody>{people.map((person) => <tr key={person.id}>
        <td>{person.name}</td><td>{person.role || "—"}</td><td>
          <div className="dt-attendance-buttons">
            {[["present", "✓", "Present"], ["absent", "✕", "Absent"]].map(([status, symbol, label]) =>
              <button type="button" className={`dt-button dt-button-small ${attendance[person.id] === status ? "dt-button-primary" : ""}`}
                key={status} aria-label={`${label}: ${person.name}`} aria-pressed={attendance[person.id] === status}
                disabled={loading || busy || !date || !shift} onClick={() => mark(person.id, status)}>{symbol} {label}</button>)}
          </div>
        </td>
      </tr>)}</tbody>
    </table></div> : <div className="dt-empty">Add people in People setup to record attendance.</div>}
  </section>
}
