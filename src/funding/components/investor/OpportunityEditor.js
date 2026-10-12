"use client"

import { useEffect, useState } from "react"
import { Save, CheckCircle2, Plus, Trash2, Rocket } from "lucide-react"
import { validateOpportunity } from "../../models/investorFirm"
import { listAllInstruments, getInstrumentLabel } from "../../models/instruments"
import RequirementRuleBuilder from "./RequirementRuleBuilder"
import ScoringProfileEditor from "./ScoringProfileEditor"
import SmeDialogPreview from "./SmeDialogPreview"

const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55",
  line: "#ded8d4", lineSoft: "#e9e3df", lineStrong: "#b0a29b",
  bg: "#ffffff", panel: "#faf8f7",
  accent: "#5D4037", accentTint: "#EFEBE9",
  red: "#991b1b", redBg: "#fef2f2",
  green: "#166534", greenBg: "#f0fdf4",
  amber: "#92400e", amberBg: "#fffbeb",
}

const inputS = {
  width: "100%", padding: "10px 12px", border: `1px solid ${T.lineStrong}`,
  borderRadius: 9, fontSize: 14, fontFamily: "inherit", color: T.ink,
  background: T.bg, outline: "none", boxSizing: "border-box",
}
const labelS = { display: "block", fontSize: 12.5, fontWeight: 600, color: T.accent, marginBottom: 6 }

const TABS = ["Details", "Requirements", "Scoring", "Preview"]

export default function OpportunityEditor({
  firm, programme, opportunity, rules, scoringProfile,
  onSave, onPublish,
  onUpsertRule, onDeleteRule,
  onCreateScoringProfile, onSaveScoringProfile, onApproveScoringProfile,
}) {
  const [draft, setDraft] = useState(opportunity)
  const [tab, setTab] = useState("Details")
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState([])
  const [editingRule, setEditingRule] = useState(null)

  useEffect(() => { setDraft(opportunity) }, [opportunity])

  if (!draft) return null
  const set = (k, v) => setDraft((p) => ({ ...p, [k]: v }))

  const handleSave = async () => {
    const v = validateOpportunity(draft)
    if (!v.ok) { setErrors(v.errors); return }
    setSaving(true)
    try {
      await onSave({
        name: draft.name, purpose: draft.purpose,
        liveFrom: draft.liveFrom, liveTo: draft.liveTo, deadline: draft.deadline,
        instrumentId: draft.instrumentId, evaluationCriteria: draft.evaluationCriteria,
        validationLevel: draft.validationLevel, submissionRoute: draft.submissionRoute,
      })
      setErrors([])
    } finally { setSaving(false) }
  }

  const handlePublish = async () => {
    const v = validateOpportunity(draft)
    if (!v.ok) { setErrors(v.errors); setTab("Details"); return }
    if ((rules || []).length === 0) {
      setErrors([{ field: "rules", message: "Add at least one requirement rule before publishing." }])
      setTab("Requirements")
      return
    }
    setSaving(true)
    try {
      await handleSave()
      await onPublish()
    } finally { setSaving(false) }
  }

  // Preview rules: simulate the SME's view by resolving against an empty SME context
  // (every field is treated as "not yet satisfied"). Lindelani's requirement engine
  // will produce the real states at runtime.
  const previewRules = (rules || []).map((r) => ({
    ...r,
    state: r.requirement === "recommended"
      ? "optional"
      : r.evidenceType
        ? "missing_evidence"
        : "missing_answer",
  }))

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.accent }}>
            {draft.name || "New opportunity"}
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: T.muted }}>
            {firm?.name} · {programme?.name}
          </p>
        </div>
        <span style={{
          padding: "4px 12px", borderRadius: 999, fontSize: 11.5, fontWeight: 700,
          background: draft.status === "published" ? T.greenBg : "#fef3c7",
          color: draft.status === "published" ? T.green : T.amber,
        }}>
          {draft.status}{draft.publishedVersion ? ` · v${draft.publishedVersion}` : ""}
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, margin: "18px 0", borderBottom: `1px solid ${T.lineSoft}` }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "10px 16px", background: "none", border: "none",
            borderBottom: `2px solid ${tab === t ? T.accent : "transparent"}`,
            color: tab === t ? T.accent : T.muted,
            fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}>{t}{(t === "Requirements" && rules.length) ? ` (${rules.length})` : ""}</button>
        ))}
      </div>

      {errors.length > 0 && (
        <div style={{ padding: "10px 14px", background: T.redBg, border: `1px solid ${T.red}33`, color: T.red, borderRadius: 9, marginBottom: 14, fontSize: 12.5 }}>
          {errors.map((e, i) => <div key={i}>{e.message}</div>)}
        </div>
      )}

      {tab === "Details" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelS}>Opportunity name *</label>
              <input value={draft.name || ""} onChange={(e) => set("name", e.target.value)} style={inputS} />
            </div>
            <div>
              <label style={labelS}>Primary instrument *</label>
              <select value={draft.instrumentId || ""} onChange={(e) => set("instrumentId", e.target.value)} style={inputS}>
                <option value="">Select an instrument</option>
                {listAllInstruments()
                  .filter((i) => !programme?.allowedInstruments?.length || programme.allowedInstruments.includes(i.id))
                  .map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelS}>Purpose *</label>
            <textarea rows={2} value={draft.purpose || ""} onChange={(e) => set("purpose", e.target.value)}
              style={{ ...inputS, resize: "vertical", fontFamily: "inherit" }}
              placeholder="What this specific opportunity is for." />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelS}>Live from</label>
              <input type="date" value={draft.liveFrom || ""} onChange={(e) => set("liveFrom", e.target.value)} style={inputS} />
            </div>
            <div>
              <label style={labelS}>Live to</label>
              <input type="date" value={draft.liveTo || ""} onChange={(e) => set("liveTo", e.target.value)} style={inputS} />
            </div>
            <div>
              <label style={labelS}>Deadline *</label>
              <input type="date" value={draft.deadline || ""} onChange={(e) => set("deadline", e.target.value)} style={inputS} />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelS}>Evaluation criteria</label>
            <textarea rows={2} value={draft.evaluationCriteria || ""} onChange={(e) => set("evaluationCriteria", e.target.value)}
              style={{ ...inputS, resize: "vertical", fontFamily: "inherit" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelS}>Validation level</label>
              <select value={draft.validationLevel} onChange={(e) => set("validationLevel", e.target.value)} style={inputS}>
                <option value="uploaded">Uploaded</option>
                <option value="checked">Checked</option>
                <option value="verified">Verified</option>
              </select>
            </div>
            <div>
              <label style={labelS}>Submission route</label>
              <select value={draft.submissionRoute} onChange={(e) => set("submissionRoute", e.target.value)} style={inputS}>
                <option value="in_app">In-app</option>
                <option value="email">Email</option>
                <option value="portal">External portal</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {tab === "Requirements" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 13, color: T.muted }}>
              Structured rules that inherit from base → category → instrument → programme → opportunity.
            </p>
            <button onClick={() => setEditingRule({})} style={{
              padding: "6px 12px", borderRadius: 7, background: T.accentTint, color: T.accent,
              border: `1px solid ${T.lineStrong}`, fontSize: 12, fontWeight: 600, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 5,
            }}>
              <Plus size={12} /> Add rule
            </button>
          </div>

          {rules.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", background: T.panel, borderRadius: 10, border: `1px dashed ${T.lineStrong}`, color: T.muted, fontSize: 13 }}>
              No rules yet. The base/category/instrument rules apply automatically — you only add the extra ones this opportunity requires.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {rules.map((r) => (
                <div key={r.ruleId} style={{
                  padding: "12px 14px", background: T.bg, border: `1px solid ${T.lineSoft}`,
                  borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink, marginBottom: 2 }}>{r.label}</div>
                    <div style={{ fontSize: 11.5, color: T.muted }}>
                      {r.requirement} · {r.canonicalFieldPath || r.answerSchema || r.evidenceType || "no route"}
                    </div>
                  </div>
                  <button onClick={() => setEditingRule(r)} style={{
                    padding: "6px 12px", borderRadius: 7, background: T.bg, color: T.body,
                    border: `1px solid ${T.lineStrong}`, fontSize: 11.5, fontWeight: 500, cursor: "pointer",
                  }}>Edit</button>
                  <button onClick={() => onDeleteRule(r.ruleId)} style={{ padding: 6, background: "none", border: "none", cursor: "pointer", color: T.red }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {editingRule && (
            <RequirementRuleBuilder
              rule={editingRule.ruleId ? editingRule : null}
              parentProgrammeId={programme?.programmeId}
              onCancel={() => setEditingRule(null)}
              onSave={async (rule) => {
                await onUpsertRule({ ...rule, level: "opportunity", parentId: programme?.programmeId, status: "published" })
                setEditingRule(null)
              }}
            />
          )}
        </div>
      )}

      {tab === "Scoring" && (
        <ScoringProfileEditor
          scoringProfile={scoringProfile}
          onCreate={onCreateScoringProfile}
          onSave={onSaveScoringProfile}
          onApprove={onApproveScoringProfile}
          canApprove={false}
        />
      )}

      {tab === "Preview" && (
        <SmeDialogPreview rules={previewRules} />
      )}

      {/* Footer actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
        <button onClick={handleSave} disabled={saving} style={{
          padding: "10px 18px", borderRadius: 9, background: T.bg, color: T.body,
          border: `1px solid ${T.lineStrong}`, fontSize: 13, fontWeight: 600, cursor: saving ? "wait" : "pointer",
          display: "inline-flex", alignItems: "center", gap: 6,
        }}>
          <Save size={13} /> Save draft
        </button>
        {draft.status !== "published" && (
          <button onClick={handlePublish} disabled={saving} style={{
            padding: "10px 20px", borderRadius: 9, background: T.accent, color: "#fff",
            border: `1px solid ${T.accent}`, fontSize: 13, fontWeight: 600, cursor: saving ? "wait" : "pointer",
            display: "inline-flex", alignItems: "center", gap: 6, opacity: saving ? 0.7 : 1,
          }}>
            <Rocket size={13} /> Publish opportunity
          </button>
        )}
        {draft.status === "published" && (
          <span style={{
            padding: "10px 18px", borderRadius: 9,
            background: T.greenBg, color: T.green,
            fontSize: 13, fontWeight: 600,
            display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            <CheckCircle2 size={13} /> Published v{draft.publishedVersion}
          </span>
        )}
      </div>
    </div>
  )
}