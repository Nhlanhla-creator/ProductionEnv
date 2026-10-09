"use client"

import { CheckCircle2 } from "lucide-react"

const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55",
  line: "#ded8d4", lineSoft: "#e9e3df", lineStrong: "#b0a29b",
  bg: "#ffffff", panel: "#faf8f7", raised: "#f2eeec",
  accent: "#5D4037", accentSoft: "#8D6E63", accentTint: "#EFEBE9",
  green: "#166534", greenBg: "#f0fdf4",
}

export default function StepReview({ request, profile, vault, onConfirm }) {
  const confirmedAccuracy = !!request.accuracyConfirmed
  const confirmedSharing = !!request.sharingConsent

  const setAccuracy = (v) => onConfirm({ accuracyConfirmed: v })
  const setSharing = (v) => onConfirm({ sharingConsent: v })

  return (
    <div>
      <p style={{ margin: "0 0 16px", fontSize: "13.5px", color: T.body, lineHeight: 1.55 }}>
        Review your generic funding request. This is what will be matched against live opportunities. You'll confirm each opportunity's specific requirements before submitting.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "20px" }}>
        <SummaryCard title="Request">
          <SummaryRow label="Purpose" value={request.purpose} />
          <SummaryRow label="Requested amount" value={request.requestedAmount ? `${request.currency} ${Number(request.requestedAmount).toLocaleString("en-ZA")}` : null} />
          <SummaryRow label="Needed by" value={request.neededBy} />
          <SummaryRow label="Uses of funds" value={`${request.usesOfFunds?.length || 0} line${request.usesOfFunds?.length === 1 ? "" : "s"}`} />
        </SummaryCard>

        <SummaryCard title="Route">
          <SummaryRow label="Certainty" value={request.routeUncertainty} />
          <SummaryRow label="Category" value={request.instrumentCategory} />
          <SummaryRow label="Instrument" value={request.instrumentId} />
          <SummaryRow label="Preferred provider" value={request.preferredProvider} />
        </SummaryCard>

        <SummaryCard title="Readiness">
          <SummaryRow label="Additional answers captured" value={Object.keys(request.readinessAnswers || {}).filter((k) => request.readinessAnswers[k]).length} />
          <SummaryRow label="Profile facts available" value={`${Object.keys(profile || {}).length ? "yes" : "no"}`} />
          <SummaryRow label="Vault evidence" value={`${vault?.length || 0} item${vault?.length === 1 ? "" : "s"}`} />
        </SummaryCard>

        <SummaryCard title="Terms & security">
          <SummaryRow label="Security rights offered" value={`${request.securityRights?.length || 0}`} />
          <SummaryRow label="Terms answers captured" value={`${Object.keys(request.termsAnswers || {}).filter((k) => request.termsAnswers[k]).length}`} />
        </SummaryCard>

        <SummaryCard title="Outcomes" fullWidth>
          {request.outcomes?.length === 0 ? (
            <div style={{ fontSize: "13px", color: T.muted, fontStyle: "italic" }}>No outcomes added.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ color: T.muted, fontSize: "11.5px", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                  <th style={{ textAlign: "left", paddingBottom: "6px" }}>Metric</th>
                  <th style={{ textAlign: "right", paddingBottom: "6px" }}>Baseline</th>
                  <th style={{ textAlign: "right", paddingBottom: "6px" }}>Target</th>
                  <th style={{ textAlign: "right", paddingBottom: "6px" }}>Unit</th>
                </tr>
              </thead>
              <tbody>
                {request.outcomes.map((o, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${T.lineSoft}` }}>
                    <td style={{ padding: "6px 0", color: T.ink }}>{o.metric || "—"}</td>
                    <td style={{ padding: "6px 0", textAlign: "right", color: T.body }}>{o.baseline || "—"}</td>
                    <td style={{ padding: "6px 0", textAlign: "right", color: T.ink, fontWeight: 600 }}>{o.target || "—"}</td>
                    <td style={{ padding: "6px 0", textAlign: "right", color: T.muted }}>{o.unit || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SummaryCard>
      </div>

      <div style={{ padding: "16px", background: T.panel, borderRadius: "12px", border: `1px solid ${T.lineSoft}`, marginBottom: "14px" }}>
        <ConfirmRow
          checked={confirmedAccuracy}
          onChange={setAccuracy}
          label="I confirm the information in this request is accurate."
          description="You'll be able to revise it before submitting to any opportunity."
        />
        <ConfirmRow
          checked={confirmedSharing}
          onChange={setSharing}
          label="I consent to matching this request against investor opportunities."
          description="No investor sees your data until you submit to their specific opportunity."
        />
      </div>
    </div>
  )
}

function SummaryCard({ title, children, fullWidth }) {
  return (
    <div style={{
      padding: "14px 16px", background: T.bg, borderRadius: "10px", border: `1px solid ${T.lineSoft}`,
      gridColumn: fullWidth ? "1 / -1" : "auto",
    }}>
      <div style={{ fontSize: "11.5px", fontWeight: 700, color: T.muted, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "10px" }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: "13px" }}>
      <span style={{ color: T.muted }}>{label}</span>
      <span style={{ color: value ? T.ink : T.muted, fontWeight: value ? 500 : 400, textTransform: "capitalize" }}>
        {value || "—"}
      </span>
    </div>
  )
}

function ConfirmRow({ checked, onChange, label, description }) {
  return (
    <label style={{ display: "flex", gap: "10px", alignItems: "flex-start", cursor: "pointer", marginBottom: "10px" }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ marginTop: "3px" }} />
      <div>
        <div style={{ fontSize: "13.5px", color: T.ink, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: "12px", color: T.muted, marginTop: "2px" }}>{description}</div>
      </div>
    </label>
  )
}