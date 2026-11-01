import { useEffect, useState } from "react"
import {
  SME_ACCESS_OPTIONS,
  SME_PROFILE_SECTIONS,
  expandSmeSidebarSections,
} from "../../utils/sme-access"

export default function SmeAccessEditor({
  initialPermissions,
  value,
  onChange,
  onSave,
  saveLabel = "Save access",
  saving = false,
}) {
  const [draft, setDraft] = useState(initialPermissions || {
    sidebarSections: [],
    profileSections: [],
  })
  const permissions = value || draft
  const initialSignature = JSON.stringify(initialPermissions)

  useEffect(() => {
    if (initialSignature) setDraft(JSON.parse(initialSignature))
  }, [initialSignature])

  const update = (nextPermissions) => {
    if (!value) setDraft(nextPermissions)
    onChange?.(nextPermissions)
  }

  const toggleSidebarSection = (sectionId) => {
    const current = new Set(permissions.sidebarSections || [])
    const section = SME_ACCESS_OPTIONS.find((option) => option.id === sectionId)
    const sectionIndex = SME_ACCESS_OPTIONS.findIndex((option) => option.id === sectionId)
    const descendants = []
    if (section) {
      for (const option of SME_ACCESS_OPTIONS.slice(sectionIndex + 1)) {
        if (option.depth <= section.depth) break
        descendants.push(option.id)
      }
    }
    if (current.has(sectionId)) {
      current.delete(sectionId)
      descendants.forEach((id) => current.delete(id))
      let ancestorDepth = section.depth
      for (let index = sectionIndex - 1; index >= 0 && ancestorDepth > 0; index -= 1) {
        const ancestor = SME_ACCESS_OPTIONS[index]
        if (ancestor.depth < ancestorDepth) {
          current.delete(ancestor.id)
          ancestorDepth = ancestor.depth
        }
      }
    } else {
      current.add(sectionId)
      descendants.forEach((id) => current.add(id))
    }
    update({
      ...permissions,
      sidebarSections: expandSmeSidebarSections([...current]),
    })
  }

  const toggleProfileSection = (sectionId) => {
    const current = new Set(permissions.profileSections || [])
    if (current.has(sectionId)) current.delete(sectionId)
    else current.add(sectionId)
    update({ ...permissions, profileSections: [...current] })
  }

  return (
    <div style={{ display: "grid", gap: "1.25rem", marginTop: "1rem" }}>
      <fieldset style={{ border: "1px solid #e6d7c3", borderRadius: 8, padding: "1rem" }}>
        <legend style={{ padding: "0 0.4rem", fontWeight: 600, color: "#4a352f" }}>
          SME sections
        </legend>
        <p style={{ margin: "0 0 0.75rem", color: "#6b7280", fontSize: "0.875rem" }}>
          Select the sidebar areas this member can open. Selecting a section also selects its subsections.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.4rem 1rem" }}>
          {SME_ACCESS_OPTIONS.map((option) => (
            <label key={option.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginLeft: `${option.depth * 0.75}rem`, color: "#4a352f", fontSize: "0.9rem" }}>
              <input
                type="checkbox"
                checked={(permissions.sidebarSections || []).includes(option.id)}
                onChange={() => toggleSidebarSection(option.id)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset style={{ border: "1px solid #e6d7c3", borderRadius: 8, padding: "1rem" }}>
        <legend style={{ padding: "0 0.4rem", fontWeight: 600, color: "#4a352f" }}>
          Company profile sections
        </legend>
        <p style={{ margin: "0 0 0.75rem", color: "#6b7280", fontSize: "0.875rem" }}>
          Select which parts of the company profile are visible. Editing remains limited by the member's role.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.4rem 1rem" }}>
          {SME_PROFILE_SECTIONS.map((section) => (
            <label key={section.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#4a352f", fontSize: "0.9rem" }}>
              <input
                type="checkbox"
                checked={(permissions.profileSections || []).includes(section.id)}
                onChange={() => toggleProfileSection(section.id)}
              />
              {section.label}
            </label>
          ))}
        </div>
      </fieldset>

      {onSave && (
        <button
          type="button"
          onClick={() => onSave(permissions)}
          disabled={saving}
          style={{ justifySelf: "start", padding: "0.65rem 1rem", border: 0, borderRadius: 6, backgroundColor: "#a67c52", color: "white", fontWeight: 600, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1 }}
        >
          {saving ? "Saving..." : saveLabel}
        </button>
      )}
    </div>
  )
}
