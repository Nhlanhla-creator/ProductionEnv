"use client"

import { useEffect, useState } from "react"
import { Plus, FileText, Clock, ChevronRight, Loader2 } from "lucide-react"
import { listMyRequests } from "../services/fundingRequestService"

const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55",
  line: "#ded8d4", lineSoft: "#e9e3df", lineStrong: "#b0a29b",
  bg: "#ffffff", panel: "#faf8f7", raised: "#f2eeec",
  accent: "#5D4037", accentSoft: "#8D6E63", accentTint: "#EFEBE9",
  green: "#166534", greenBg: "#f0fdf4",
}

const STATUS_LABEL = {
  draft: "Draft",
  ready: "Ready",
  matched: "Matched",
  submitted: "Submitted",
  archived: "Archived",
}

const STATUS_STYLE = {
  draft:     { bg: "#fef3c7", fg: "#92400e" },
  ready:     { bg: "#dbeafe", fg: "#1e40af" },
  matched:   { bg: "#ede9fe", fg: "#6d28d9" },
  submitted: { bg: T.greenBg, fg: T.green },
  archived:  { bg: T.raised,  fg: T.muted },
}

export default function FundingRequestList({ onCreateNew, onOpenRequest }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const rows = await listMyRequests()
        setRequests(rows)
      } finally { setLoading(false) }
    })()
  }, [])

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "12px", marginBottom: "18px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: "26px", fontWeight: 700, color: T.accent, letterSpacing: "-0.4px" }}>
            Funding applications
          </h1>
          <p style={{ margin: 0, fontSize: "13.5px", color: T.muted }}>
            One application per funding need. Match it against live investor opportunities.
          </p>
        </div>
        <button onClick={onCreateNew} style={{
          padding: "10px 18px", borderRadius: "9px",
          background: T.accent, color: "#fff", border: `1px solid ${T.accent}`,
          fontSize: "13.5px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          display: "inline-flex", alignItems: "center", gap: "7px",
        }}>
          <Plus size={14} /> New funding request
        </button>
      </div>

      {loading ? (
        <div style={{ padding: "60px", textAlign: "center", color: T.muted }}>
          <Loader2 size={22} className="animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div style={{ padding: "40px 24px", background: T.panel, borderRadius: "14px", border: `1px dashed ${T.lineStrong}`, textAlign: "center" }}>
          <FileText size={28} color={T.accentSoft} style={{ marginBottom: 12 }} />
          <h3 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 600, color: T.accent }}>No funding requests yet</h3>
          <p style={{ margin: "0 0 16px", fontSize: "13.5px", color: T.muted, maxWidth: 380, marginLeft: "auto", marginRight: "auto" }}>
            Start with your funding need and we'll match it against investors, grants and programmes.
          </p>
          <button onClick={onCreateNew} style={{
            padding: "10px 18px", borderRadius: "9px",
            background: T.accent, color: "#fff", border: `1px solid ${T.accent}`,
            fontSize: "13.5px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            display: "inline-flex", alignItems: "center", gap: "7px",
          }}>
            <Plus size={14} /> Start your first request
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {requests.map((r) => {
            const style = STATUS_STYLE[r.status] || STATUS_STYLE.draft
            return (
              <button key={r.requestId} onClick={() => onOpenRequest(r.requestId)} style={{
                padding: "16px 18px", background: T.bg, borderRadius: "12px",
                border: `1px solid ${T.lineSoft}`, cursor: "pointer", fontFamily: "inherit",
                textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center",
                gap: "12px", flexWrap: "wrap",
              }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontSize: "14.5px", fontWeight: 600, color: T.accent }}>
                      {r.purpose ? r.purpose.replace(/_/g, " ") : "Untitled request"}
                    </span>
                    <span style={{
                      padding: "2px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700,
                      background: style.bg, color: style.fg,
                    }}>
                      {STATUS_LABEL[r.status] || r.status}
                    </span>
                  </div>
                  <div style={{ fontSize: "12.5px", color: T.muted, display: "flex", gap: "14px", flexWrap: "wrap" }}>
                    {r.requestedAmount ? <span><strong style={{ color: T.ink }}>{r.currency || "ZAR"} {Number(r.requestedAmount).toLocaleString("en-ZA")}</strong></span> : null}
                    {r.instrumentId ? <span>{r.instrumentId.replace(/_/g, " ")}</span> : null}
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={11} /> {r.updatedAt?.seconds ? new Date(r.updatedAt.seconds * 1000).toLocaleDateString("en-ZA", { day: "2-digit", month: "short" }) : "just now"}
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} color={T.muted} />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}