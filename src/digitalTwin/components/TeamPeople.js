import { useState } from "react"
import { savePerson } from "../services/teamService"

const blankPerson = { name: "", surname: "", role: "", category: "nonTechnical", base: "corporate", siteId: "" }
const categories = { technical: "Technical", nonTechnical: "Non-technical" }

export default function TeamPeople({ tenantId, people, roles, sites = [], onRefresh }) {
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
          <label className="dt-field"><span>Category</span><select value={person.category}
            onChange={(event) => setPerson({ ...person, category: event.target.value, role: "" })}>
            {Object.entries(categories).map(([key, name]) => <option key={key} value={key}>{name}</option>)}
          </select></label>
          <label className="dt-field"><span>Role</span>
            <input required list="dt-team-role-options" maxLength={120} value={person.role} placeholder="Choose or specify a role"
              onChange={(event) => setPerson({ ...person, role: event.target.value })} />
            <datalist id="dt-team-role-options">
              {(roles[person.category] || []).map((role) => <option key={role.id} value={role.name} />)}
            </datalist>
          </label>
          <label className="dt-field"><span>Name</span><input required maxLength={120} value={person.name}
            onChange={(event) => setPerson({ ...person, name: event.target.value })} /></label>
          <label className="dt-field"><span>Surname</span><input required maxLength={120} value={person.surname || ""}
            onChange={(event) => setPerson({ ...person, surname: event.target.value })} /></label>
          <label className="dt-field"><span>Based at</span><select value={person.base || "corporate"}
            onChange={(event) => setPerson({ ...person, base: event.target.value, siteId: "" })}>
            <option value="corporate">Corporate</option><option value="site">Site</option></select></label>
          {person.base === "site" && <label className="dt-field"><span>Site</span><select required value={person.siteId || ""}
            onChange={(event) => setPerson({ ...person, siteId: event.target.value })}><option value="">Select a site</option>
            {sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
          </select></label>}
        </div>
        <div className="dt-actions"><button className="dt-button dt-button-primary">{busy ? "Saving…" : "Save person"}</button>
          <button type="button" className="dt-button" onClick={() => setPerson(null)}>Cancel</button></div>
      </fieldset>
    </form>}
    {people.length ? <div className="dt-table-wrap"><table className="dt-table">
      <thead><tr><th>Name</th><th>Surname</th><th>Role</th><th>Category</th><th>Based at</th><th>Actions</th></tr></thead>
      <tbody>{people.map((record) => <tr key={record.id}>
        <td>{record.name}</td><td>{record.surname || "—"}</td><td>{record.role || "—"}</td><td>{categories[record.category]}</td><td>{record.base === "site" ? sites.find((site) => site.id === record.siteId)?.name || "Site unavailable" : "Corporate"}</td>
        <td><button type="button" className="dt-button dt-button-small" disabled={busy}
          onClick={() => { setError(""); setPerson(record) }}>Edit</button></td>
      </tr>)}</tbody>
    </table></div> : <div className="dt-empty">Add employees here. Role options come from Operating Structure.</div>}
  </section>
}
