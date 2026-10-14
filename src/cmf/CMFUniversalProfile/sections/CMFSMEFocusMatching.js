"use client"

import React, { useState } from "react"
import { Check, ShieldAlert, Sparkles, AlertCircle, HelpCircle } from "lucide-react"
import {
  SECTOR_OPTIONS,
  BUSINESS_STAGES,
  FUNDING_INSTRUMENTS,
  OPPORTUNITY_TYPES
} from "../../cmfProfileConfig"

const PROVINCES_SA = [
  "Gauteng",
  "Western Cape",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Free State",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape"
]

const ELIGIBILITY_OPTIONS = [
  "Registered legal entity (Pty Ltd / close corp)",
  "Minimum operating track record (1+ years)",
  "Dedicated full-time founder / executive team",
  "SARS Tax compliance & PIN",
  "Minimum annual revenue generated",
  "Audited or verified financial statements",
  "Clear proprietary product / value proposition",
  "No minimum criteria (Open to all viable applicants)"
]

const PROGRAMME_CRITERIA_OPTIONS = [
  "Black-owned (B-BBEE Qualifying)",
  "Women-owned enterprise",
  "Youth-owned enterprise (< 35 years)",
  "Export-ready enterprise",
  "Township / rural based enterprise",
  "Green / clean energy certified",
  "No specific demographic requirement (Open)"
]

export default function CMFSMEFocusMatching({ data = {}, allFormData = {}, updateData = () => {} }) {
  const focus = allFormData?.entityOverview?.facilitationFocus || "Both"
  const showCapital = focus === "Capital" || focus === "Both"
  const showMarket = focus === "Market access" || focus === "Both"

  const handleChange = (field, value) => {
    updateData({ ...data, [field]: value })
  }

  const toggleArrayItem = (field, item) => {
    const list = Array.isArray(data[field]) ? data[field] : []
    if (list.includes(item)) {
      handleChange(field, list.filter(i => i !== item))
    } else {
      handleChange(field, [...list, item])
    }
  }

  const handleSelectAllSectors = () => {
    const current = Array.isArray(data.sectorsSupported) ? data.sectorsSupported : []
    if (current.length === SECTOR_OPTIONS.length) {
      handleChange("sectorsSupported", [])
    } else {
      handleChange("sectorsSupported", [...SECTOR_OPTIONS])
    }
  }

  const currentSectors = Array.isArray(data.sectorsSupported) ? data.sectorsSupported : []
  const currentGeos = Array.isArray(data.geographicAreas) ? data.geographicAreas : []
  const currentStages = Array.isArray(data.businessStages) ? data.businessStages : []
  const currentCriteria = Array.isArray(data.eligibilityCriteria) ? data.eligibilityCriteria : []
  const currentProgCriteria = Array.isArray(data.programmeCriteria) ? data.programmeCriteria : []
  const currentFundingInstruments = Array.isArray(data.fundingInstruments) ? data.fundingInstruments : []
  const currentBuyerSectors = Array.isArray(data.buyerSectors) ? data.buyerSectors : []
  const currentOppTypes = Array.isArray(data.opportunityTypes) ? data.opportunityTypes : []

  return (
    <div style={{ width: "100%", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#4a352f", margin: "0 0 0.5rem 0" }}>
          SME Focus & Matching
        </h2>
        <p style={{ color: "#7d5a50", fontSize: "0.95rem", margin: 0 }}>
          Define which SMEs you support. These fields are captured once and drive both your public facilitator profile and the algorithmic matching engine on BIG.
        </p>
      </div>

      <div style={{ background: "#ffffff", border: "1px solid #e6d7c3", borderRadius: "14px", padding: "1.75rem", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        {/* Sectors Supported */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <label style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f" }}>
              Sectors Supported <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <button
              type="button"
              onClick={handleSelectAllSectors}
              style={{
                background: "transparent",
                border: "none",
                color: "#8d6e63",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                textDecoration: "underline"
              }}
            >
              {currentSectors.length === SECTOR_OPTIONS.length ? "Deselect All" : "Select All Sectors"}
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "10px" }}>
            {SECTOR_OPTIONS.map(sec => {
              const isChecked = currentSectors.includes(sec)
              return (
                <label
                  key={sec}
                  onClick={() => toggleArrayItem("sectorsSupported", sec)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: isChecked ? "#f3e5dc" : "#faf7f2",
                    border: `1px solid ${isChecked ? "#8d6e63" : "#d7ccc8"}`,
                    cursor: "pointer",
                    fontSize: "13px",
                    color: "#4a352f",
                    fontWeight: isChecked ? "600" : "normal"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    style={{ accentColor: "#8d6e63" }}
                  />
                  <span>{sec}</span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Geographic Areas Served */}
        <div style={{ marginBottom: "2rem" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#4a352f", marginBottom: "0.5rem" }}>
            Geographic Areas Served <span style={{ color: "#e53e3e" }}>*</span>
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
            {["National (All South Africa)", ...PROVINCES_SA, "SADC Region", "Rest of Africa", "International"].map(geo => {
              const isChecked = currentGeos.includes(geo)
              return (
                <label
                  key={geo}
                  onClick={() => toggleArrayItem("geographicAreas", geo)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: isChecked ? "#f3e5dc" : "#faf7f2",
                    border: `1px solid ${isChecked ? "#8d6e63" : "#d7ccc8"}`,
                    cursor: "pointer",
                    fontSize: "13px",
                    color: "#4a352f",
                    fontWeight: isChecked ? "600" : "normal"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    style={{ accentColor: "#8d6e63" }}
                  />
                  <span>{geo}</span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Business Stages Supported */}
        <div style={{ marginBottom: "2rem" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#4a352f", marginBottom: "0.5rem" }}>
            Business Stages Supported <span style={{ color: "#e53e3e" }}>*</span>
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "10px" }}>
            {BUSINESS_STAGES.map(stage => {
              const isChecked = currentStages.includes(stage)
              return (
                <label
                  key={stage}
                  onClick={() => toggleArrayItem("businessStages", stage)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    background: isChecked ? "#f3e5dc" : "#faf7f2",
                    border: `1px solid ${isChecked ? "#8d6e63" : "#d7ccc8"}`,
                    cursor: "pointer",
                    fontSize: "13px",
                    color: "#4a352f",
                    fontWeight: isChecked ? "600" : "normal"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    style={{ accentColor: "#8d6e63" }}
                  />
                  <span>{stage}</span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Eligibility Requirements */}
        <div style={{ marginBottom: "2rem" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#4a352f", marginBottom: "0.5rem" }}>
            Eligibility Requirements <span style={{ color: "#e53e3e" }}>*</span>
          </label>
          <p style={{ fontSize: "13px", color: "#7d5a50", margin: "0 0 0.75rem 0" }}>
            Select structured criteria and provide a short explanation (allow no minimum if applicable).
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px", marginBottom: "1rem" }}>
            {ELIGIBILITY_OPTIONS.map(opt => {
              const isChecked = currentCriteria.includes(opt)
              return (
                <label
                  key={opt}
                  onClick={() => toggleArrayItem("eligibilityCriteria", opt)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: isChecked ? "#f3e5dc" : "#faf7f2",
                    border: `1px solid ${isChecked ? "#8d6e63" : "#d7ccc8"}`,
                    cursor: "pointer",
                    fontSize: "12px",
                    color: "#4a352f",
                    fontWeight: isChecked ? "600" : "normal"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    style={{ accentColor: "#8d6e63" }}
                  />
                  <span>{opt}</span>
                </label>
              )
            })}
          </div>
          <textarea
            rows={2}
            value={data.eligibilityExplanation || ""}
            onChange={(e) => handleChange("eligibilityExplanation", e.target.value)}
            placeholder="Short explanation of minimum eligibility or criteria for admission into your facilitation pipeline..."
            style={{
              width: "100%",
              padding: "9px 12px",
              border: "1px solid #d7ccc8",
              borderRadius: "8px",
              fontSize: "13px",
              boxSizing: "border-box",
              background: "#faf7f2",
              color: "#4a352f"
            }}
          />
        </div>

        {/* Turnover Range & Programme Criteria */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
              Turnover Range Supported <span style={{ fontSize: "11px", color: "#8d6e63", fontWeight: "normal" }}>(Optional)</span>
            </label>
            <input
              type="text"
              disabled={data.allowNoTurnoverRestriction}
              value={data.allowNoTurnoverRestriction ? "No restriction" : (data.turnoverRange || "")}
              onChange={(e) => handleChange("turnoverRange", e.target.value)}
              placeholder="e.g. R 2,000,000 - R 50,000,000"
              style={{
                width: "100%",
                padding: "9px 12px",
                border: "1px solid #d7ccc8",
                borderRadius: "8px",
                fontSize: "13px",
                boxSizing: "border-box",
                background: data.allowNoTurnoverRestriction ? "#f0ede8" : "#faf7f2",
                color: "#4a352f",
                marginBottom: "6px"
              }}
            />
            <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#7d5a50", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={Boolean(data.allowNoTurnoverRestriction)}
                onChange={(e) => handleChange("allowNoTurnoverRestriction", e.target.checked)}
                style={{ accentColor: "#8d6e63" }}
              />
              Allow no restriction / Any turnover
            </label>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
              Excluded Sectors or Activities <span style={{ fontSize: "11px", color: "#8d6e63", fontWeight: "normal" }}>(Optional)</span>
            </label>
            <input
              type="text"
              value={data.excludedSectorsText || ""}
              onChange={(e) => handleChange("excludedSectorsText", e.target.value)}
              placeholder="e.g. Weapons, tobacco, gambling, speculative real estate"
              style={{
                width: "100%",
                padding: "9px 12px",
                border: "1px solid #d7ccc8",
                borderRadius: "8px",
                fontSize: "13px",
                boxSizing: "border-box",
                background: "#faf7f2",
                color: "#4a352f"
              }}
            />
          </div>
        </div>

        {/* Ownership / Programme Criteria */}
        <div style={{ marginBottom: "2rem" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
            Ownership or Programme Criteria <span style={{ fontSize: "11px", color: "#8d6e63", fontWeight: "normal" }}>(Conditional / Optional)</span>
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "10px" }}>
            {PROGRAMME_CRITERIA_OPTIONS.map(crit => {
              const isChecked = currentProgCriteria.includes(crit)
              return (
                <label
                  key={crit}
                  onClick={() => toggleArrayItem("programmeCriteria", crit)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: isChecked ? "#f3e5dc" : "#faf7f2",
                    border: `1px solid ${isChecked ? "#8d6e63" : "#d7ccc8"}`,
                    cursor: "pointer",
                    fontSize: "12px",
                    color: "#4a352f"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    style={{ accentColor: "#8d6e63" }}
                  />
                  <span>{crit}</span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Pipeline Capacity & Engagement Intake */}
        <div style={{
          padding: "1.25rem",
          borderRadius: "12px",
          background: "#faf7f2",
          border: "1px solid #e6d7c3",
          marginBottom: "2rem"
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
                Accepting New SMEs? <span style={{ color: "#e53e3e" }}>*</span>
              </label>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {[
                  { id: "Yes", label: "Yes (Open)", color: "#2e7d32" },
                  { id: "Limited capacity", label: "Limited Capacity", color: "#b45309" },
                  { id: "Currently closed", label: "Currently Closed", color: "#c62828" }
                ].map(opt => {
                  const isSel = (data.acceptingNewSmes || "Yes") === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleChange("acceptingNewSmes", opt.id)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "8px",
                        border: `1px solid ${isSel ? opt.color : "#d7ccc8"}`,
                        background: isSel ? "rgba(255,255,255,0.9)" : "#ffffff",
                        color: isSel ? opt.color : "#4a352f",
                        fontWeight: isSel ? "700" : "500",
                        fontSize: "13px",
                        cursor: "pointer"
                      }}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "0.4rem" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "#4a352f" }}>
                  Preferred Number of New Engagements
                </label>
                <span style={{ fontSize: "11px", background: "#fef3c7", color: "#92400e", padding: "2px 6px", borderRadius: "10px", fontWeight: "600" }}>
                  🔒 Private
                </span>
              </div>
              <input
                type="number"
                min="1"
                max="1000"
                value={data.preferredNewEngagements || 10}
                onChange={(e) => handleChange("preferredNewEngagements", Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d7ccc8",
                  borderRadius: "8px",
                  fontSize: "13px",
                  boxSizing: "border-box",
                  background: "#ffffff",
                  color: "#4a352f"
                }}
              />
              <span style={{ fontSize: "11px", color: "#8d6e63", display: "block", marginTop: "3px" }}>
                Target capacity per cohort or month. Used privately for capacity management.
              </span>
            </div>
          </div>
        </div>

        {/* Capital Facilitation Conditionals */}
        {showCapital && (
          <div style={{
            padding: "1.25rem",
            borderRadius: "12px",
            background: "#fffaf0",
            border: "1px solid #feebc8",
            marginBottom: "1.75rem"
          }}>
            <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#744210", margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>💰</span> Capital Facilitation Focus Specifications
            </h3>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
                Funding Instruments Supported
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "8px" }}>
                {FUNDING_INSTRUMENTS.map(inst => {
                  const isChecked = currentFundingInstruments.includes(inst)
                  return (
                    <label
                      key={inst}
                      onClick={() => toggleArrayItem("fundingInstruments", inst)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "7px 10px",
                        borderRadius: "6px",
                        background: isChecked ? "#fef3c7" : "#ffffff",
                        border: `1px solid ${isChecked ? "#d97706" : "#e2e8f0"}`,
                        cursor: "pointer",
                        fontSize: "12px",
                        color: "#4a352f",
                        fontWeight: isChecked ? "600" : "normal"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        style={{ accentColor: "#d97706" }}
                      />
                      <span>{inst}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
                  Typical Funding Amount Range
                </label>
                <input
                  type="text"
                  value={data.typicalFundingRange || ""}
                  onChange={(e) => handleChange("typicalFundingRange", e.target.value)}
                  placeholder="e.g. R 1,000,000 - R 25,000,000 or 'No fixed range'"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d7ccc8",
                    borderRadius: "8px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                    background: "#ffffff",
                    color: "#4a352f"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
                  Specific Funding Readiness Requirements
                </label>
                <input
                  type="text"
                  value={data.fundingReadinessRequirements || ""}
                  onChange={(e) => handleChange("fundingReadinessRequirements", e.target.value)}
                  placeholder="e.g. 2 years audited statements, 15% debt-service ratio"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d7ccc8",
                    borderRadius: "8px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                    background: "#ffffff",
                    color: "#4a352f"
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Market Facilitation Conditionals */}
        {showMarket && (
          <div style={{
            padding: "1.25rem",
            borderRadius: "12px",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            marginBottom: "1rem"
          }}>
            <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#166534", margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>🤝</span> Market Access & Commercial Focus Specifications
            </h3>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
                Opportunity Types Facilitated
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "8px" }}>
                {OPPORTUNITY_TYPES.map(opp => {
                  const isChecked = currentOppTypes.includes(opp)
                  return (
                    <label
                      key={opp}
                      onClick={() => toggleArrayItem("opportunityTypes", opp)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "7px 10px",
                        borderRadius: "6px",
                        background: isChecked ? "#dcfce7" : "#ffffff",
                        border: `1px solid ${isChecked ? "#16a34a" : "#e2e8f0"}`,
                        cursor: "pointer",
                        fontSize: "12px",
                        color: "#4a352f",
                        fontWeight: isChecked ? "600" : "normal"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        style={{ accentColor: "#16a34a" }}
                      />
                      <span>{opp}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
                  Corporate / Buyer Sectors Served
                </label>
                <input
                  type="text"
                  value={data.buyerSectorsText || ""}
                  onChange={(e) => handleChange("buyerSectorsText", e.target.value)}
                  placeholder="e.g. Retail FMCG buyers, Mining supply chains, Telcos"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d7ccc8",
                    borderRadius: "8px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                    background: "#ffffff",
                    color: "#4a352f"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
                  Specific Supplier Readiness Requirements
                </label>
                <input
                  type="text"
                  value={data.supplierReadinessRequirements || ""}
                  onChange={(e) => handleChange("supplierReadinessRequirements", e.target.value)}
                  placeholder="e.g. ISO 9001, COIDA letter of good standing, delivery vehicle fleet"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d7ccc8",
                    borderRadius: "8px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                    background: "#ffffff",
                    color: "#4a352f"
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
