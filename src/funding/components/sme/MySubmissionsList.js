"use client"

import { useEffect, useState } from "react"
import { Loader2, AlertTriangle, FileText, ChevronRight, Archive } from "lucide-react"
import { T } from "../matching/Badges"
import { listMySubmissions } from "../../services/submissionReader"
import DownloadBar from "../shared/DownloadBar"
import { getInstrumentLabel } from "../../models/instruments"

/**
 * SME's list of submitted packages — Brief §7, p.57.
 *
 * "SME may retrieve its own versions." Submitted PDFs and authorised ZIPs
 * are downloadable per row.
 */

export default function MySubmissionsList({ onOpenCase }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    (async () => {
      try {
        const data = await listMySubmissions()
        setRows(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return <div style={{ padding: 60, textAlign: "center", color: T.muted }}>
      <Loader2 size={22} className="animate-spin" />
    </div>
  }

  return (
    <div style={{ padding: "24px 20px", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 700, color: T.accent, letterSpacing: -0.3 }}>
          My submissions
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: T.muted }}>
          Every package you have submitted to a funder. Snapshots are frozen — later profile changes do not alter them.
        </p>
      </div>

      {error && <div style={errorBox}><AlertTriangle size={14} /> {error}</div>}

      {!loading && rows.length === 0 ? (
        <div style={{
          padding: "40px 24px", background: T.panel, borderRadius: 12,
          border: `1px dashed ${T.lineStrong}`, textAlign: "center",
        }}>
          <FileText size={28} color={T.accentSoft} style={{ marginBottom: 10 }} />
          <h3 style={{ margin: "0 0 6px", fontSize: 16, color: T.accent }}>No submissions yet</h3>
          <p style={{ margin: 0, fontSize: 13, color: T.muted }}>
            Submit a funding request to an opportunity to see it here.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rows.map((r) => (
            <div key={r.submissionId} style={{
              padding: "16px 18px", background: T.bg, borderRadius: 12,
              border: `1px solid ${T.lineSoft}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: T.accent }}>
                    {r.opportunityName || "Submission"}
                  </div>
                  <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>
                    {r.instrumentId ? getInstrumentLabel(r.instrumentId) : "—"}
                    {" · "}
                    <code style={codeStyle}>{r.submissionId}</code>
                    {" · v"}{r.version ?? 1}
                  </div>
                  <div style={{ fontSize: 11.5, color: T.muted, marginTop: 3 }}>
                    Submitted {r.frozenAt ? new Date(r.frozenAt).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    {typeof r.completeness === "number" && <> · {Math.round(r.completeness * 100)}% complete</>}
                  </div>
                </div>
                <button onClick={() => onOpenCase?.(r.submissionId)} style={openBtn}>
                  <ChevronRight size={12} /> Open case
                </button>
              </div>

              <div style={{ marginTop: 12 }}>
                <DownloadBar
                  submissionId={r.submissionId}
                  version={r.version}
                  variant="sme"
                  canZip={true}
                  evidence={[]}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const openBtn = {
  padding: "6px 12px", borderRadius: 7,
  background: T.accentTint, color: T.accent, border: `1px solid ${T.lineStrong}`,
  fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  display: "inline-flex", alignItems: "center", gap: 5,
}
const errorBox = {
  padding: "10px 14px", background: T.redBg, border: `1px solid ${T.red}33`,
  color: T.red, borderRadius: 9, fontSize: 12.5,
  display: "inline-flex", gap: 8, alignItems: "center", marginBottom: 12,
}
const codeStyle = {
  fontSize: 11, background: T.raised, padding: "1px 6px", borderRadius: 4,
  fontFamily: "ui-monospace, monospace",
}