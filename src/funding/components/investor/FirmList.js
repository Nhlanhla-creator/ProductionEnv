"use client"

import { Plus, Building2, Trash2, ChevronRight } from "lucide-react"

const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55",
  line: "#ded8d4", lineSoft: "#e9e3df", lineStrong: "#b0a29b",
  bg: "#ffffff", panel: "#faf8f7",
  accent: "#5D4037", accentSoft: "#8D6E63", accentTint: "#EFEBE9",
  red: "#991b1b", green: "#166534", greenBg: "#f0fdf4",
}

export default function FirmList({ firms, onOpen, onCreate, onDelete }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: T.accent }}>Investor setup</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13.5, color: T.muted }}>
            Model your firm, its programmes, and the live opportunities it publishes.
          </p>
        </div>
        <button onClick={onCreate} style={{
          padding: "10px 18px", borderRadius: 9, background: T.accent, color: "#fff",
          border: `1px solid ${T.accent}`, fontSize: 13.5, fontWeight: 600, cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 7,
        }}>
          <Plus size={14} /> Add firm
        </button>
      </div>

      {firms.length === 0 ? (
        <div style={{ padding: "40px 24px", background: T.panel, borderRadius: 14, border: `1px dashed ${T.lineStrong}`, textAlign: "center" }}>
          <Building2 size={28} color={T.accentSoft} style={{ marginBottom: 12 }} />
          <h3 style={{ margin: "0 0 6px", fontSize: 16, color: T.accent }}>No firms yet</h3>
          <p style={{ margin: "0 0 16px", fontSize: 13.5, color: T.muted }}>
            Add your firm first. You'll then create programmes and opportunities under it.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {firms.map((f) => (
            <div key={f.firmId} style={{
              padding: "16px 18px", background: T.bg, borderRadius: 12,
              border: `1px solid ${T.lineSoft}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 600, color: T.accent }}>{f.name || "Untitled firm"}</span>
                  <span style={{
                    padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                    background: f.status === "published" ? T.greenBg : "#fef3c7",
                    color: f.status === "published" ? T.green : "#92400e",
                  }}>{f.status || "draft"}</span>
                </div>
                <div style={{ fontSize: 12.5, color: T.muted }}>
                  {f.type || "—"} · {(f.roles || []).join(", ") || "no roles yet"}
                </div>
              </div>
              <button onClick={() => onOpen(f.firmId)} style={{
                padding: "8px 12px", borderRadius: 8, background: T.accentTint, color: T.accent,
                border: `1px solid ${T.lineStrong}`, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 5,
              }}>
                Open <ChevronRight size={12} />
              </button>
              <button onClick={() => onDelete(f.firmId)} style={{
                padding: 8, background: "none", border: "none", cursor: "pointer", color: T.red,
              }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}