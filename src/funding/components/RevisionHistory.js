"use client"

import { useEffect, useState } from "react"
import { Loader2, GitBranch, ChevronRight, ShieldCheck, FileEdit } from "lucide-react"
import { T } from "./matching/Badges"
import { listVersionsInChain } from "../services/revisionService"

/**
 * Shows every version in a submission chain (Brief §7, p.58).
 * Used on the SME case view and the investor case view.
 */

export default function RevisionHistory({ chainId, currentSubmissionId, onOpenVersion }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!chainId) { setLoading(false); return }
    let cancelled = false
    ;(async () => {
      try {
        const data = await listVersionsInChain(chainId)
        if (!cancelled) setRows(data)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [chainId])

  if (!chainId || (!loading && rows.length <= 1)) return null

  return (
    <div style={{
      padding: "14px 16px", background: T.bg, borderRadius: 11,
      border: `1px solid ${T.lineSoft}`,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
      }}>
        <GitBranch size={14} color={T.accentSoft} />
        <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 0.5, textTransform: "uppercase" }}>
          Version history
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 12, textAlign: "center", color: T.muted }}>
          <Loader2 size={14} className="animate-spin" />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {rows.map((v) => {
            const isCurrent = v.submissionId === currentSubmissionId
            const isFrozen = v.status === "submitted" && v.frozenAt
            return (
              <button
                key={v.submissionId}
                onClick={() => onOpenVersion?.(v.submissionId)}
                disabled={isCurrent}
                style={{
                  padding: "10px 12px", borderRadius: 9,
                  background: isCurrent ? T.accentTint : T.panel,
                  border: `1px solid ${isCurrent ? T.accent : T.lineSoft}`,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  gap: 10, cursor: isCurrent ? "default" : "pointer", fontFamily: "inherit",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  {isFrozen ? (
                    <ShieldCheck size={13} color={T.green} />
                  ) : (
                    <FileEdit size={13} color={T.amber} />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: T.ink }}>
                      v{v.version || 1}
                      {isCurrent ? " · current" : isFrozen ? " · frozen" : " · draft"}
                    </div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>
                      {v.frozenAt
                        ? new Date(v.frozenAt).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })
                        : v.revisedAt
                          ? new Date(v.revisedAt).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })
                          : "—"}
                      {v.revisionReason ? ` · ${v.revisionReason}` : ""}
                    </div>
                  </div>
                </div>
                {!isCurrent && <ChevronRight size={13} color={T.muted} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}