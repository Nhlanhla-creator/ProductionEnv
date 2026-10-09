"use client"

import { useState } from "react"
import {
  FileDown, Loader2, AlertTriangle, CheckCircle2, Archive, RefreshCw, Info,
} from "lucide-react"
import { T } from "../matching/Badges"
import useSubmissionDownload from "../../hooks/useSubmissionDownload"

/**
 * PDF + ZIP download control — Brief §7, p.55–58.
 *
 * PDF: always available for the SME and for authorised investors.
 * ZIP: separate permission; user explicitly selects the files to include.
 */

const ZIP_PERMISSION = {
  sme:      "Your own evidence files are available for ZIP download.",
  investor: "Only evidence with submission consent can be downloaded as a ZIP.",
}

export default function DownloadBar({
  submissionId,
  version,
  variant = "sme",           // "sme" | "investor"
  canZip = true,
  evidence = [],             // [{ ruleId, name, type, status }]
  restrictedCount = 0,       // items that must NOT leak into the ZIP
  onZipRequest,
}) {
  const dl = useSubmissionDownload()
  const [zipOpen, setZipOpen] = useState(false)
  const [selected, setSelected] = useState(() =>
    new Set(evidence.filter((e) => e.status === "verified").map((e) => e.ruleId))
  )

  const handlePdf = () => {
    dl.downloadPdf(submissionId, { version })
  }

  const handleZipConfirm = async () => {
    const ids = Array.from(selected)
    if (onZipRequest) await onZipRequest(ids)
    await dl.downloadZip(submissionId, { version })
    setZipOpen(false)
  }

  const isBusy = dl.isPreparing || dl.isDownloading

  return (
    <div style={{
      padding: "12px 14px", background: T.panel,
      borderRadius: 10, border: `1px solid ${T.lineSoft}`,
    }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {/* PDF */}
        <button
          onClick={handlePdf}
          disabled={isBusy}
          style={{
            ...primaryBtn,
            opacity: isBusy ? 0.6 : 1,
            cursor: isBusy ? "wait" : "pointer",
          }}
        >
          {dl.isDownloading && dl.lastFormat === "pdf"
            ? <Loader2 size={13} className="animate-spin" />
            : <FileDown size={13} />}
          {dl.isDownloading && dl.lastFormat === "pdf" ? "Generating PDF…" : "Download PDF"}
        </button>

        {/* ZIP */}
        {canZip && (
          <button
            onClick={() => setZipOpen(true)}
            disabled={isBusy}
            style={{
              ...ghostBtn,
              opacity: isBusy ? 0.6 : 1,
              cursor: isBusy ? "wait" : "pointer",
            }}
          >
            <Archive size={13} /> Download with evidence (ZIP)
          </button>
        )}

        {/* Status */}
        {dl.isComplete && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: T.green, fontSize: 12, fontWeight: 600 }}>
            <CheckCircle2 size={12} /> Ready
          </span>
        )}
        {dl.isError && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: T.red, fontSize: 12, fontWeight: 600 }}>
            <AlertTriangle size={12} /> {dl.error}
            <button onClick={handlePdf} style={retryBtn}>
              <RefreshCw size={11} /> Retry
            </button>
          </span>
        )}
      </div>

      {restrictedCount > 0 && (
        <div style={{
          marginTop: 10, fontSize: 11.5, color: T.muted,
          display: "flex", gap: 6, alignItems: "center",
        }}>
          <Info size={12} /> {restrictedCount} restricted item{restrictedCount === 1 ? "" : "s"} withheld from ZIP due to consent scope.
        </div>
      )}

      {/* ZIP selection dialog */}
      {zipOpen && (
        <div onClick={() => setZipOpen(false)} style={overlay}>
          <div onClick={(e) => e.stopPropagation()} style={modal}>
            <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: T.accent }}>
              Select files for the ZIP
            </h3>
            <p style={{ margin: "0 0 14px", fontSize: 12, color: T.muted, lineHeight: 1.5 }}>
              {ZIP_PERMISSION[variant]} The ZIP manifest records names, IDs, versions, and hashes for every file included.
            </p>

            {evidence.length === 0 ? (
              <div style={{ padding: 16, background: T.panel, borderRadius: 8, fontSize: 12.5, color: T.muted, textAlign: "center" }}>
                No evidence files available for this submission.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 320, overflowY: "auto", marginBottom: 14 }}>
                {evidence.map((e) => {
                  const checked = selected.has(e.ruleId)
                  const restricted = e.status === "restricted"
                  return (
                    <label key={e.ruleId} style={{
                      display: "flex", gap: 10, alignItems: "center",
                      padding: "10px 12px", borderRadius: 8,
                      background: restricted ? T.amberBg : T.bg,
                      border: `1px solid ${restricted ? `${T.amber}33` : T.lineSoft}`,
                      cursor: restricted ? "not-allowed" : "pointer",
                    }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={restricted}
                        onChange={(ev) => {
                          const next = new Set(selected)
                          if (ev.target.checked) next.add(e.ruleId)
                          else next.delete(e.ruleId)
                          setSelected(next)
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{e.name}</div>
                        <div style={{ fontSize: 11, color: T.muted }}>
                          {e.type} · {e.status}
                          {restricted && " · restricted, cannot be shared"}
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <button onClick={() => setZipOpen(false)} style={ghostBtn}>Cancel</button>
              <button
                onClick={handleZipConfirm}
                disabled={selected.size === 0 || isBusy}
                style={{
                  ...primaryBtn,
                  opacity: selected.size === 0 || isBusy ? 0.5 : 1,
                  cursor: selected.size === 0 || isBusy ? "not-allowed" : "pointer",
                }}
              >
                {isBusy ? <Loader2 size={13} className="animate-spin" /> : <Archive size={13} />}
                Download ZIP ({selected.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const primaryBtn = {
  padding: "9px 16px", borderRadius: 8,
  background: T.accent, color: "#fff", border: `1px solid ${T.accent}`,
  fontSize: 12.5, fontWeight: 600, fontFamily: "inherit",
  display: "inline-flex", alignItems: "center", gap: 6,
}
const ghostBtn = {
  padding: "9px 16px", borderRadius: 8,
  background: T.bg, color: T.body, border: `1px solid ${T.lineStrong}`,
  fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 6,
}
const retryBtn = {
  marginLeft: 6, padding: "2px 8px", borderRadius: 6,
  background: T.bg, color: T.red, border: `1px solid ${T.red}55`,
  fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  display: "inline-flex", alignItems: "center", gap: 4,
}
const overlay = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 220, padding: 20,
}
const modal = {
  background: T.bg, borderRadius: 14, maxWidth: 520, width: "100%",
  maxHeight: "90vh", overflowY: "auto", padding: 22,
  boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
}