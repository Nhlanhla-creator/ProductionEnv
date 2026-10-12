"use client"

import PrefillRow from "../PrefillRow"

const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55",
  line: "#ded8d4", lineSoft: "#e9e3df", lineStrong: "#b0a29b",
  bg: "#ffffff", panel: "#faf8f7", raised: "#f2eeec",
  accent: "#5D4037", accentSoft: "#8D6E63", accentTint: "#EFEBE9",
  amber: "#92400e", amberBg: "#fffbeb",
}

const inputS = {
  width: "100%", padding: "10px 12px",
  border: `1px solid ${T.lineStrong}`, borderRadius: "9px",
  fontSize: "14px", fontFamily: "inherit", color: T.ink, background: T.bg, outline: "none",
  boxSizing: "border-box",
}
const labelS = { display: "block", fontSize: "12.5px", fontWeight: 600, color: T.accent, marginBottom: "6px" }

/**
 * The readiness step combines:
 *   - profile facts already available (from canonical fields)
 *   - Vault evidence already uploaded
 *   - route-specific readiness fields the SME has not yet supplied
 *
 * The set of "extra" fields shown here is derived from the instrument's
 * `incrementalCapture` minus whatever the profile already covers.
 * For Phase 2, we show a fixed core set plus whatever the SME ticks to add.
 */
export default function StepReadiness({ request, profile, vault, updateField }) {
  const answers = request.readinessAnswers || {}

  const setAnswer = (key, value) => {
    updateField("readinessAnswers", { ...answers, [key]: value })
  }

  return (
    <div>
      <p style={{ margin: "0 0 14px", fontSize: "13.5px", color: T.body, lineHeight: 1.55 }}>
        We already have most of what a funder needs from your profile and Vault. Fill in only what's missing for this request.
      </p>

      {/* Profile facts already available — read-only reference panel */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "11.5px", fontWeight: 700, color: T.muted, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "8px" }}>
          Available from your profile
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
          <PrefillRow
            label="Revenue (current year)"
            fieldPath="financialOverview.incomeTurnoverCurrent"
            value={profile?.financialOverview?.incomeTurnoverCurrent}
            source="Universal Profile"
            verificationState={profile?.verification?.incomeTurnoverCurrent?.status}
          />
          <PrefillRow
            label="Net profit (current year)"
            fieldPath="financialOverview.incomeNetProfitCurrent"
            value={profile?.financialOverview?.incomeNetProfitCurrent}
            source="Universal Profile"
          />
          <PrefillRow
            label="Total assets"
            fieldPath="financialOverview.balanceTotalAssetsCurrent"
            value={profile?.financialOverview?.balanceTotalAssetsCurrent}
            source="Universal Profile"
          />
          <PrefillRow
            label="B-BBEE level"
            fieldPath="legalCompliance.bbbeeLevel"
            value={profile?.legalCompliance?.bbbeeLevel}
            source="Universal Profile"
          />
        </div>
      </div>

      {/* Vault — already on file */}
      {vault && vault.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "11.5px", fontWeight: 700, color: T.muted, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "8px" }}>
            Already in your Vault
          </div>
          <div style={{ border: `1px solid ${T.lineSoft}`, borderRadius: "10px", overflow: "hidden" }}>
            {vault.slice(0, 6).map((v, i) => (
              <div key={v.id || i} style={{ padding: "10px 14px", background: i % 2 ? T.panel : T.bg, borderBottom: i < Math.min(vault.length, 6) - 1 ? `1px solid ${T.lineSoft}` : "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                <div>
                  <div style={{ fontSize: "13.5px", fontWeight: 500, color: T.ink }}>{v.label || v.type}</div>
                  <div style={{ fontSize: "11.5px", color: T.muted }}>
                    {v.period || "—"} · {v.type}
                  </div>
                </div>
                <span style={{
                  padding: "2px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700,
                  background: v.status === "verified" ? "#f0fdf4" : "#fffbeb",
                  color: v.status === "verified" ? "#166534" : "#92400e",
                }}>
                  {v.status || "uploaded"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Route-specific readiness — the extra answers this request needs */}
      <div style={{ fontSize: "11.5px", fontWeight: 700, color: T.muted, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "8px" }}>
        Additional answers for this request
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div>
          <label style={labelS}>Cash-flow summary</label>
          <textarea
            rows={3}
            value={answers.cashflowSummary || ""}
            onChange={(e) => setAnswer("cashflowSummary", e.target.value)}
            placeholder="Brief description of your expected cash flow over the funding period"
            style={{ ...inputS, resize: "vertical", fontFamily: "inherit" }}
          />
        </div>
        <div>
          <label style={labelS}>Transaction economics</label>
          <textarea
            rows={3}
            value={answers.transactionEconomics || ""}
            onChange={(e) => setAnswer("transactionEconomics", e.target.value)}
            placeholder="Cost, price, margin and expected return from this specific transaction"
            style={{ ...inputS, resize: "vertical", fontFamily: "inherit" }}
          />
        </div>
        <div>
          <label style={labelS}>Traction to date</label>
          <textarea
            rows={3}
            value={answers.traction || ""}
            onChange={(e) => setAnswer("traction", e.target.value)}
            placeholder="Recent commercial wins, signed contracts, customer pipeline"
            style={{ ...inputS, resize: "vertical", fontFamily: "inherit" }}
          />
        </div>
      </div>

      <div style={{ marginTop: "16px", padding: "12px 14px", background: T.amberBg, border: `1px solid ${T.amber}33`, borderRadius: "9px", fontSize: "12.5px", color: T.amber, lineHeight: 1.55 }}>
        Self-declared answers are labelled as such in the funder's view. If you upload supporting evidence, the classification is upgraded automatically.
      </div>
    </div>
  )
}