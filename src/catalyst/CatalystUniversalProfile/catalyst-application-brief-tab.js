"use client"

import React from "react"
import { Plus, Trash2, ArrowUp, ArrowDown, FileCheck, Shield, Clock } from "lucide-react"
import FormField from "./FormField"
import styles from "./catalyst-universal-profile.module.css"
import {
  SELECTION_STAGES,
  REQUIRED_DOCUMENT_TYPES,
  DOCUMENT_TIMING,
  EVIDENCE_RULES,
} from "./catalystTaxonomy"

const threeColGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "1.25rem",
}

const twoColGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "1.25rem",
}

const sectionHeadingStyle = {
  borderBottom: "2px solid #795548",
  marginBottom: "1.25rem",
  marginTop: "1.75rem",
  paddingBottom: "6px",
}

const sectionHeadingTextStyle = {
  fontSize: "16px",
  fontWeight: "700",
  color: "#5d4037",
  margin: 0,
  letterSpacing: "0.2px",
}

export default function CatalystApplicationBriefTab({
  programme = {},
  updateProgramme,
  isLocked = false,
}) {
  const appBrief = programme.applicationBrief || {}

  const handleAppChange = (e) => {
    const { name, value, type, checked } = e.target
    const val = type === "checkbox" ? checked : value
    updateProgramme({
      applicationBrief: {
        ...appBrief,
        [name]: val,
      },
    })
  }

  // Active Selection Stages (ordered array)
  const activeStages =
    Array.isArray(appBrief.selectionStages) && appBrief.selectionStages.length > 0
      ? appBrief.selectionStages
      : ["screening", "profile_review", "diagnostic", "interview", "panel"]

  const moveStage = (index, direction) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= activeStages.length) return
    const newStages = [...activeStages]
    const temp = newStages[index]
    newStages[index] = newStages[targetIndex]
    newStages[targetIndex] = temp
    updateProgramme({
      applicationBrief: {
        ...appBrief,
        selectionStages: newStages,
      },
    })
  }

  const toggleStage = (stageId) => {
    const updated = activeStages.includes(stageId)
      ? activeStages.filter((s) => s !== stageId)
      : [...activeStages, stageId]
    updateProgramme({
      applicationBrief: {
        ...appBrief,
        selectionStages: updated,
      },
    })
  }

  // Required Documents list
  const requiredDocs = Array.isArray(appBrief.requiredDocuments) ? appBrief.requiredDocuments : []

  const toggleRequiredDoc = (docId) => {
    const exists = requiredDocs.find((d) => d.docId === docId)
    let updated
    if (exists) {
      updated = requiredDocs.filter((d) => d.docId !== docId)
    } else {
      const docMeta = REQUIRED_DOCUMENT_TYPES.find((d) => d.id === docId)
      updated = [
        ...requiredDocs,
        {
          docId,
          label: docMeta?.label || docId,
          timing: "application",
          rule: "required",
          alternatives: "case_by_case",
        },
      ]
    }
    updateProgramme({
      applicationBrief: {
        ...appBrief,
        requiredDocuments: updated,
      },
    })
  }

  const updateDocProperty = (docId, prop, value) => {
    const updated = requiredDocs.map((d) => {
      if (d.docId === docId) {
        return { ...d, [prop]: value }
      }
      return d
    })
    updateProgramme({
      applicationBrief: {
        ...appBrief,
        requiredDocuments: updated,
      },
    })
  }

  return (
    <div style={{ marginTop: "1rem" }}>
      <div
        style={{
          backgroundColor: "#f8f5f2",
          borderLeft: "4px solid #795548",
          padding: "12px 16px",
          borderRadius: "4px",
          marginBottom: "1.5rem",
          color: "#5d4037",
          fontSize: "14px",
        }}
      >
        <strong>Application Guidance:</strong> Configure the applicant intake journey. Applicants will reuse their verified Universal Profile and Data Vault; ask only for missing or programme-specific items and disclose when each document becomes necessary.
      </div>

      {/* ─── Instructions & Timelines ────────────────────────────────────────── */}
      <div style={sectionHeadingStyle}>
        <h3 style={sectionHeadingTextStyle}>Application Channel, Instructions & Timing</h3>
      </div>

      <div className={styles.gridContainer} style={threeColGrid}>
        <FormField
          label="Application Channel"
          required
          tooltip="How a candidate SME submits their application."
        >
          <select
            name="applicationChannel"
            value={appBrief.applicationChannel || "big_application"}
            onChange={handleAppChange}
            className={styles.formSelect}
            required
          >
            <option value="big_application">BIG Marketplace Digital Application</option>
            <option value="external_url">External Application Portal (URL)</option>
            <option value="invitation_only">Invitation / Onboarding Only</option>
          </select>
        </FormField>

        {appBrief.applicationChannel === "external_url" && (
          <FormField label="External Portal URL" required>
            <input
              type="url"
              name="externalApplicationUrl"
              value={appBrief.externalApplicationUrl || ""}
              onChange={handleAppChange}
              placeholder="https://apply.hub.org"
              className={styles.formInput}
              required
            />
          </FormField>
        )}

        <FormField
          label="Application Window"
          required
          tooltip="Opening and closing dates or rolling intake."
        >
          <select
            name="applicationWindow"
            value={appBrief.applicationWindow || "rolling"}
            onChange={handleAppChange}
            className={styles.formSelect}
            required
          >
            <option value="rolling">Rolling Intake (Always Open)</option>
            <option value="fixed_window">Fixed Dates Window</option>
            <option value="tba">Dates to be Announced</option>
          </select>
        </FormField>

        {appBrief.applicationWindow === "fixed_window" && (
          <>
            <FormField label="Opening Date" required>
              <input
                type="date"
                name="openingDate"
                value={appBrief.openingDate || ""}
                onChange={handleAppChange}
                className={styles.formInput}
                required
              />
            </FormField>
            <FormField label="Closing Date" required>
              <input
                type="date"
                name="closingDate"
                value={appBrief.closingDate || ""}
                onChange={handleAppChange}
                className={styles.formInput}
                required
              />
            </FormField>
          </>
        )}

        <FormField
          label="Estimated Review Turnaround"
          tooltip="Expected days between application submission and decision."
        >
          <input
            type="text"
            name="estimatedReviewTime"
            value={appBrief.estimatedReviewTime || "10 working days"}
            onChange={handleAppChange}
            placeholder="e.g. 10 working days"
            className={styles.formInput}
          />
        </FormField>

        <FormField
          label="Onboarding Turnaround Time"
          tooltip="Time between selection approval and cohort commencement."
        >
          <input
            type="text"
            name="onboardingTime"
            value={appBrief.onboardingTime || "1 week"}
            onChange={handleAppChange}
            placeholder="e.g. 1 week"
            className={styles.formInput}
          />
        </FormField>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <FormField
          label="Instructions for Applicants"
          tooltip="Clear instructions shown to founders when starting the application."
        >
          <textarea
            name="instructionsForApplicants"
            value={appBrief.instructionsForApplicants || ""}
            onChange={handleAppChange}
            rows={3}
            placeholder="e.g. Ensure your Universal Profile is up to date. You will be prompted to grant consent to share your financial statements and pitch deck..."
            className={styles.formTextarea}
          />
        </FormField>
      </div>

      {/* ─── Ordered Selection Stages ────────────────────────────────────────── */}
      <div style={sectionHeadingStyle}>
        <h3 style={sectionHeadingTextStyle}>Selection Pipeline & Stages</h3>
      </div>

      <p style={{ fontSize: "14px", color: "#6d4c41", margin: "0 0 1rem 0" }}>
        Configure the sequential stages applicants progress through during review. You can re-order stages or activate/deactivate steps.
      </p>

      <div style={{ display: "grid", gap: "8px", maxWidth: "600px", marginBottom: "1rem" }}>
        {activeStages.map((stageId, idx) => {
          const meta = SELECTION_STAGES.find((s) => s.id === stageId)
          return (
            <div
              key={stageId}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 14px",
                backgroundColor: "#ffffff",
                border: "1px solid #d7ccc8",
                borderRadius: "6px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    backgroundColor: "#f3ebe0",
                    color: "#6b4c2a",
                    fontWeight: 700,
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {idx + 1}
                </span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#4e342e" }}>
                  {meta?.label || stageId}
                </span>
              </div>

              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  type="button"
                  onClick={() => moveStage(idx, -1)}
                  disabled={idx === 0}
                  style={{
                    padding: "4px",
                    background: "transparent",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    cursor: idx === 0 ? "not-allowed" : "pointer",
                    opacity: idx === 0 ? 0.4 : 1,
                  }}
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => moveStage(idx, 1)}
                  disabled={idx === activeStages.length - 1}
                  style={{
                    padding: "4px",
                    background: "transparent",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    cursor: idx === activeStages.length - 1 ? "not-allowed" : "pointer",
                    opacity: idx === activeStages.length - 1 ? 0.4 : 1,
                  }}
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => toggleStage(stageId)}
                  style={{
                    padding: "4px 8px",
                    background: "transparent",
                    border: "none",
                    color: "#c62828",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Available stages to add (dropdown) */}
      {SELECTION_STAGES.some((s) => !activeStages.includes(s.id)) && (
        <div style={{ marginBottom: "1.5rem", maxWidth: "400px" }}>
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) toggleStage(e.target.value)
            }}
            className={styles.formSelect}
          >
            <option value="">+ Add or restore pipeline stage...</option>
            {SELECTION_STAGES.filter((s) => !activeStages.includes(s.id)).map((s) => (
              <option key={s.id} value={s.id}>
                + {s.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ─── Required Evidence & Document Timing ─────────────────────────────── */}
      <div style={sectionHeadingStyle}>
        <h3 style={sectionHeadingTextStyle}>Required Evidence & Document Timing</h3>
      </div>

      <p style={{ fontSize: "14px", color: "#6d4c41", margin: "0 0 1rem 0" }}>
        Select which evidence documents are needed and when they must be supplied. Applicants can approve instant sharing from their existing BIG Data Vault.
      </p>

      {/* Available Document Selector Dropdown */}
      <div style={{ marginBottom: "1.25rem", maxWidth: "450px" }}>
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) toggleRequiredDoc(e.target.value)
          }}
          className={styles.formSelect}
        >
          <option value="">+ Add required document...</option>
          {REQUIRED_DOCUMENT_TYPES.filter((doc) => !requiredDocs.some((d) => d.docId === doc.id)).map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.label} ({doc.category})
            </option>
          ))}
        </select>
      </div>

      {/* Configured Document Requirement Cards */}
      {requiredDocs.length > 0 && (
        <div style={{ display: "grid", gap: "10px", marginBottom: "1.5rem" }}>
          {requiredDocs.map((reqDoc) => (
            <div
              key={reqDoc.docId}
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                padding: "10px 14px",
                backgroundColor: "#ffffff",
                border: "1px solid #d7ccc8",
                borderRadius: "6px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FileCheck size={18} color="#795548" />
                <strong style={{ fontSize: "14px", color: "#4e342e" }}>{reqDoc.label}</strong>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "#8d6e63", display: "block" }}>
                    Timing Needed:
                  </span>
                  <select
                    value={reqDoc.timing}
                    onChange={(e) => updateDocProperty(reqDoc.docId, "timing", e.target.value)}
                    style={{ padding: "4px 8px", fontSize: "12px", borderRadius: "4px", border: "1px solid #ccc" }}
                  >
                    {DOCUMENT_TIMING.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span style={{ fontSize: "11px", color: "#8d6e63", display: "block" }}>
                    Evidence Rule:
                  </span>
                  <select
                    value={reqDoc.rule}
                    onChange={(e) => updateDocProperty(reqDoc.docId, "rule", e.target.value)}
                    style={{ padding: "4px 8px", fontSize: "12px", borderRadius: "4px", border: "1px solid #ccc" }}
                  >
                    {EVIDENCE_RULES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => toggleRequiredDoc(reqDoc.docId)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#c62828",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 600,
                    marginTop: "12px",
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── 4. Agreements & Terms ─────────────────────────────────────────────── */}
      <div style={sectionHeadingStyle}>
        <h3 style={sectionHeadingTextStyle}>4. Programme Agreements & NDA</h3>
      </div>

      <div className={styles.gridContainer} style={twoColGrid}>
        <FormField
          label="Standard Programme Contract / Term Sheet"
          tooltip="Participant terms agreement presented upon admission."
        >
          <select
            name="standardContractType"
            value={appBrief.standardContractType || "platform_template"}
            onChange={handleAppChange}
            className={styles.formSelect}
          >
            <option value="platform_template">Approved Platform Standard Template</option>
            <option value="upload_custom">Custom Uploaded Terms</option>
            <option value="not_prepared">Not Yet Prepared (Draft Warning)</option>
          </select>
        </FormField>

        <FormField
          label="Programme Specific NDA"
          tooltip="Whether a specific non-disclosure agreement is required beyond standard terms."
        >
          <select
            name="standardNda"
            value={appBrief.standardNda || "not_required"}
            onChange={handleAppChange}
            className={styles.formSelect}
          >
            <option value="not_required">Not required (Platform terms suffice)</option>
            <option value="at_shortlisting">Required before Shortlisting / Pitch</option>
            <option value="at_admission">Required upon Admission</option>
          </select>
        </FormField>
      </div>
    </div>
  )
}
