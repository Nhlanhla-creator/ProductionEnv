"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Save, ChevronLeft, ChevronRight, Check, Loader2, AlertTriangle } from "lucide-react"

import useFundingRequest from "../hooks/useFundingRequest"
import { STEPS } from "../models/fundingRequest"

import StepNeed from "./steps/StepNeed"
import StepRoute from "./steps/StepRoute"
import StepReadiness from "./steps/StepReadiness"
import StepTerms from "./steps/StepTerms"
import StepOutcomes from "./steps/StepOutcomes"
import StepReview from "./steps/StepReview"

const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55",
  line: "#ded8d4", lineSoft: "#e9e3df", lineStrong: "#b0a29b",
  bg: "#ffffff", panel: "#faf8f7", raised: "#f2eeec",
  accent: "#5D4037", accentSoft: "#8D6E63", accentTint: "#EFEBE9",
  green: "#166534", greenBg: "#f0fdf4",
  amber: "#92400e", amberBg: "#fffbeb",
  red: "#991b1b", redBg: "#fef2f2",
}

export default function FundingRequestWizard({
  requestId = null,
  isNew = false,
  onBack,
  onContinueToMatches,
}) {
  const {
    request,
    profile,
    vault,
    loading,
    error,
    saving,
    dirty,
    completion,
    updateField,
    updateNested,
    setStep,
    markStepComplete,
    validateStep,
    saveNow,
  } = useFundingRequest({ requestId, isNew })

  const [validation, setValidation] = useState(null)

  useEffect(() => { window.scrollTo(0, 0) }, [request?.currentStep])

  if (loading || !request) {
    return (
      <div style={{ padding: "60px", textAlign: "center", color: T.muted }}>
        <Loader2 size={22} className="animate-spin" style={{ marginBottom: 12 }} />
        <div style={{ fontSize: 13 }}>Loading funding request…</div>
      </div>
    )
  }

  const currentIndex = request.currentStep ?? 0
  const current = STEPS[currentIndex]
  const isLast = currentIndex === STEPS.length - 1

  const goNext = () => {
    const v = validateStep(current.key)
    if (!v.ok) {
      setValidation({ title: `Cannot continue from "${current.label}"`, messages: v.errors.map((e) => e.message) })
      return
    }
    markStepComplete(current.key)
    if (isLast) {
      saveNow().then(() => onContinueToMatches?.(request.requestId))
    } else {
      setStep(currentIndex + 1)
    }
  }

  const goBack = () => {
    if (currentIndex === 0) return onBack?.()
    setStep(currentIndex - 1)
  }

  const renderStep = () => {
    switch (current.key) {
      case "need":      return <StepNeed      request={request} updateField={updateField} />
      case "route":     return <StepRoute     request={request} updateField={updateField} />
      case "readiness": return <StepReadiness request={request} profile={profile} vault={vault} updateField={updateField} />
      case "terms":     return <StepTerms     request={request} updateField={updateField} />
      case "outcomes":  return <StepOutcomes  request={request} updateField={updateField} />
      case "review":    return <StepReview    request={request} profile={profile} vault={vault} onConfirm={(patch) => Object.entries(patch).forEach(([k, v]) => updateField(k, v))} />
      default: return null
    }
  }

  return (
    <div style={{ minHeight: "100vh", padding: "24px 20px", background: T.bg, fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        {/* Back */}
        {onBack && (
          <button onClick={goBack} disabled={saving} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 0", background: "none", border: "none",
            color: T.accentSoft, cursor: saving ? "default" : "pointer",
            fontFamily: "inherit", fontSize: 13, fontWeight: 500, marginBottom: 8,
          }}>
            <ChevronLeft size={16} /> Back
          </button>
        )}

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "12px", marginBottom: "18px", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: "0 0 4px", fontSize: "26px", fontWeight: 700, color: T.accent, letterSpacing: "-0.4px" }}>
              Funding request
            </h1>
            <p style={{ margin: 0, fontSize: "13.5px", color: T.muted }}>
              Step {currentIndex + 1} of {STEPS.length} · {completion.percent}% complete · {current.label}
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "11.5px", color: dirty || saving ? T.amber : T.green, fontWeight: 600 }}>
              {saving ? "Saving…" : dirty ? "Unsaved changes" : "Saved"}
            </span>
            <button onClick={saveNow} disabled={saving || !dirty} style={{
              padding: "7px 12px", borderRadius: "8px",
              border: `1px solid ${T.lineStrong}`, background: T.bg, color: T.body,
              fontSize: "12.5px", fontWeight: 500, cursor: saving || !dirty ? "not-allowed" : "pointer",
              fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: "5px",
              opacity: saving || !dirty ? 0.5 : 1,
            }}>
              <Save size={12} /> Save draft
            </button>
          </div>
        </div>

        {/* Step rail */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "20px", overflowX: "auto", paddingBottom: "4px" }}>
          {STEPS.map((s, i) => {
            const done = request.completedSteps?.[s.key] || i < currentIndex
            const active = i === currentIndex
            return (
              <button key={s.key} type="button" onClick={() => setStep(i)} disabled={saving} style={{
                flex: "1 0 auto", minWidth: "120px", padding: "10px 12px",
                borderRadius: "10px", cursor: saving ? "default" : "pointer",
                border: `1.5px solid ${active ? T.accent : done ? T.green + "55" : T.lineSoft}`,
                background: active ? T.accent : done ? T.greenBg : T.bg,
                color: active ? "#fff" : T.body,
                fontFamily: "inherit", textAlign: "left",
                display: "flex", flexDirection: "column", gap: "2px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: "50%",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    background: active ? "#fff" : done ? T.green : T.raised,
                    color: active ? T.accent : done ? "#fff" : T.muted,
                    fontSize: 10, fontWeight: 700,
                  }}>{done ? <Check size={10} /> : i + 1}</span>
                  <span style={{ fontSize: "12.5px", fontWeight: 600 }}>{s.label}</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Validation banner */}
        {validation && (
          <div style={{
            marginBottom: "14px", padding: "12px 14px", borderRadius: "10px",
            background: T.redBg, border: `1px solid ${T.red}33`, color: T.red,
            display: "flex", gap: "10px", alignItems: "flex-start",
          }}>
            <AlertTriangle size={15} style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: "13px", marginBottom: "4px" }}>{validation.title}</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: "12.5px", lineHeight: 1.6 }}>
                {validation.messages.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
              <button onClick={() => setValidation(null)} style={{
                marginTop: "6px", background: "none", border: "none", color: T.red,
                fontSize: "12px", fontWeight: 600, cursor: "pointer", padding: 0, fontFamily: "inherit",
              }}>Dismiss</button>
            </div>
          </div>
        )}

        {/* Step body */}
        <div style={{ padding: "20px", background: T.bg, borderRadius: "14px", border: `1px solid ${T.line}`, marginBottom: "16px" }}>
          <h2 style={{ margin: "0 0 6px", fontSize: "18px", fontWeight: 700, color: T.accent }}>{current.label}</h2>
          <p style={{ margin: "0 0 18px", fontSize: "13.5px", color: T.muted }}>{current.description}</p>
          {renderStep()}
        </div>

        {/* Footer nav */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
          <button onClick={goBack} disabled={saving} style={{
            padding: "10px 18px", borderRadius: "9px",
            border: `1px solid ${T.lineStrong}`, background: T.bg, color: T.body,
            fontSize: "13.5px", fontWeight: 500, cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: "6px",
          }}>
            <ChevronLeft size={14} /> {currentIndex === 0 ? "Cancel" : "Back"}
          </button>
          <button onClick={goNext} disabled={saving} style={{
            padding: "10px 22px", borderRadius: "9px",
            border: `1px solid ${T.accent}`, background: T.accent, color: "#fff",
            fontSize: "13.5px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: "6px",
            opacity: saving ? 0.6 : 1,
          }}>
            {isLast ? "See matching opportunities" : "Continue"} <ChevronRight size={14} />
          </button>
        </div>

        {error && (
          <div style={{ marginTop: "14px", padding: "10px 12px", background: T.redBg, border: `1px solid ${T.red}33`, borderRadius: "8px", color: T.red, fontSize: "12.5px" }}>
            {error}
          </div>
        )}
      </div>
    </div>
  )
}