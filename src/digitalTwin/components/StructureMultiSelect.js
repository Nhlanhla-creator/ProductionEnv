import { useEffect, useRef, useState } from "react"
import { ChevronDown, Search, X } from "lucide-react"

export default function StructureMultiSelect({ label, options = [], selected = [], onChange, disabled = false }) {
  const [custom, setCustom] = useState("")
  const [search, setSearch] = useState("")
  const dropdown = useRef(null)
  useEffect(() => {
    const close = (event) => { if (dropdown.current && !dropdown.current.contains(event.target)) dropdown.current.open = false }
    document.addEventListener("pointerdown", close)
    return () => document.removeEventListener("pointerdown", close)
  }, [])
  const toggle = (option) => onChange(selected.some(({ id }) => id === option.id)
    ? selected.filter(({ id }) => id !== option.id) : [...selected, option])
  const add = () => {
    const name = custom.trim()
    if (name && !selected.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
      onChange([...selected, { id: `custom:${name.toLowerCase()}`, name, custom: true }])
      setCustom("")
    }
  }
  const query = search.trim().toLowerCase()
  const visible = options.filter((option) => [option.name, option.label, option.category].filter(Boolean).join(" ").toLowerCase().includes(query))
  return <div className="dt-choice-field">
    <div className="dt-choice-field__label"><span>{label}</span><small>{selected.length ? `${selected.length} selected` : "Select one or more"}</small></div>
    <details ref={dropdown} className="dt-choice-dropdown" name="operating-structure-options"
      onKeyDown={(event) => { if (event.key === "Escape") { event.currentTarget.open = false; event.currentTarget.querySelector("summary")?.focus() } }}>
      <summary aria-label={`Choose ${label.toLowerCase()}`} aria-disabled={disabled} onClick={(event) => { if (disabled) event.preventDefault() }}>
        <span>{selected.length ? `${selected.length} selected — view options` : `Choose ${label.toLowerCase()}`}</span><ChevronDown size={17} aria-hidden="true" />
      </summary>
      <div className="dt-choice-menu">
        <div className="dt-choice-search"><Search size={16} aria-hidden="true" /><input type="search" aria-label={`Search ${label.toLowerCase()}`}
          value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search options…" disabled={disabled} /></div>
        <div className="dt-choice-options">
          {visible.map((option) => <label key={option.id} className="dt-choice-option" data-selected={selected.some(({ id }) => id === option.id)}>
            <input type="checkbox" disabled={disabled} checked={selected.some(({ id }) => id === option.id)} onChange={() => toggle(option)} />
            <span>{option.name}{option.category && <small>{option.category}</small>}</span>
          </label>)}
          {!visible.length && <p className="dt-choice-empty">{query ? "No matching options. Use Other below to specify your own." : "No preset options available. Use Other below to add your own."}</p>}
        </div>
        <div className="dt-choice-custom"><label><span>Other</span><input aria-label={`Other ${label.toLowerCase()}`} placeholder="Specify another option" maxLength={120} value={custom}
          disabled={disabled} onChange={(event) => setCustom(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); add() } }} /></label>
          <button type="button" className="dt-button dt-button-small" disabled={disabled || !custom.trim()} onClick={add}>Add</button>
        </div>
      </div>
    </details>
    {!!selected.length && <div className="dt-choice-selections" aria-label={`Selected ${label.toLowerCase()}`}>
      {selected.map((value) => <button key={value.id} type="button" disabled={disabled} className="dt-choice-chip"
        aria-label={`Remove ${value.name}`} onClick={() => toggle(value)}><span>{value.name}</span><X size={13} aria-hidden="true" /></button>)}
    </div>}
  </div>
}
