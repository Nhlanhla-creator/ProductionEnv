import { useState } from "react"
import { savePerson } from "../services/teamService"

const blankPerson = { name: "", role: "", category: "nonTechnical" }
const categories = { technical: "Technical", nonTechnical: "Non-technical" }

export default function TeamPeople({ tenantId, people, roles, onRefresh }) {
  const [person, setPerson] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const save = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError("")
    try {
      await savePerson(tenantId, person)
      setPerson(null)
      await onRefresh()
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  return <section className="dt-panel">
    <div className="dt-panel-head"><h3>People</h3><button type="button" className="dt-button dt-button-primary"
      disabled={busy} onClick={() => { setError(""); setPerson(blankPerson) }}>+ Add person</button></div>
    {error && <p role="alert" className="dt-notice dt-notice-error">{error}</p>}
    {person && <form onSubmit={save}>
      <fieldset className="dt-panel" disabled={busy}>
        <div className="dt-asset-toolbar">
          <label className="dt-field"><span>Name</span><input required maxLength={120} value={person.name}
            onChange={(event) => setPerson({ ...person, name: event.target.value })} /></label>
          <label className="dt-field"><span>Category</span><select value={person.category}
            onChange={(event) => setPerson({ ...person, category: event.target.value, role: "" })}>
            {Object.entries(categories).map(([key, name]) => <option key={key} value={key}>{name}</option>)}
          </select></label>
          <label className="dt-field"><span>Role</span>
            <input list="dt-team-role-options" maxLength={120} value={person.role} placeholder="Choose or specify a role"
              onChange={(event) => setPerson({ ...person, role: event.target.value })} />
            <datalist id="dt-team-role-options">
              {(roles[person.category] || []).map((role) => <option key={role.id} value={role.name} />)}
            </datalist>
          </label>
        </div>
        <div className="dt-actions"><button className="dt-button dt-button-primary">{busy ? "Saving…" : "Save person"}</button>
          <button type="button" className="dt-button" onClick={() => setPerson(null)}>Cancel</button></div>
      </fieldset>
    </form>}
    {people.length ? <div className="dt-table-wrap"><table className="dt-table">
      <thead><tr><th>Name</th><th>Role</th><th>Category</th><th>Actions</th></tr></thead>
      <tbody>{people.map((record) => <tr key={record.id}>
        <td>{record.name}</td><td>{record.role || "—"}</td><td>{categories[record.category]}</td>
        <td><button type="button" className="dt-button dt-button-small" disabled={busy}
          onClick={() => { setError(""); setPerson(record) }}>Edit</button></td>
      </tr>)}</tbody>
    </table></div> : <div className="dt-empty">Add someone here or under a node in the Operating Structure diagram.</div>}
  </section>
}
