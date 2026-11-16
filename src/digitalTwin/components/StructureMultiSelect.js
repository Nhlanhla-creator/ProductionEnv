import { useState } from "react"
import { ChevronDown, X } from "lucide-react"

export default function StructureMultiSelect({ label, options, selected, onChange }) {
  const [custom, setCustom] = useState("")
  const toggle = (option) => onChange(selected.some(({ id }) => id === option.id)
    ? selected.filter(({ id }) => id !== option.id)
    : [...selected, option])
  const add = () => {
    const name = custom.trim()
    if (name && !selected.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
      onChange([...selected, { id: `custom:${name.toLowerCase()}`, name, custom: true }])
      setCustom("")
    }
  }

  return <div className="dt-structure-field">
    <details className="dt-structure-select">
      <summary><span>{label}{selected.length ? ` (${selected.length})` : ""}</span><ChevronDown size={16} /></summary>
      <div className="dt-structure-options">
        {options.map((option) => <label key={option.id}>
          <input type="checkbox" checked={selected.some(({ id }) => id === option.id)} onChange={() => toggle(option)} />
          {option.name}
        </label>)}
        <div className="dt-actions">
          <input aria-label={`Other ${label.toLowerCase()}`} placeholder="Other (specify)" maxLength={120} value={custom}
            onChange={(event) => setCustom(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); add() } }} />
          <button type="button" className="dt-button" disabled={!custom.trim()} onClick={add}>Add</button>
        </div>
      </div>
    </details>
    {!!selected.length && <div className="dt-actions">
      {selected.map((value) => <button key={value.id} type="button" className="dt-button dt-button-small"
        aria-label={`Remove ${value.name}`} onClick={() => toggle(value)}>{value.name} <X size={12} /></button>)}
    </div>}
  </div>
}
