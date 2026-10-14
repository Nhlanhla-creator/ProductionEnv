"use client"

import React from "react"
import { DollarSign, Clock, CheckCircle2, ShieldCheck, Link2, Upload, FileText } from "lucide-react"

const PAYER_OPTIONS = [
  "SME",
  "Funder",
  "Buyer",
  "Sponsor",
  "Combination"
]

const FEE_MODELS = [
  "Free",
  "Fixed fee",
  "Retainer",
  "Success fee",
  "Combination"
]

const PAYMENT_TIMING_OPTIONS = [
  "Upfront",
  "Milestones",
  "Completion",
  "Success"
]

const RESPONSE_TIME_OPTIONS = [
  "Within 24 hours",
  "1 - 2 business days",
  "3 - 5 business days",
  "Within 1 week"
]

const INITIAL_CHECKLIST_DEFAULT_ITEMS = [
  "CIPC company registration certificate",
  "Executive summary or company profile",
  "Pitch deck or funding proposition",
  "Last 6-12 months bank statements",
  "Latest management accounts / annual financials",
  "Tax compliance PIN / certificate",
  "Specific supplier tender / contract requirements"
]

export default function CMFFeesEngagement({ data = {}, updateData = () => {} }) {
  const handleChange = (field, value) => {
    updateData({ ...data, [field]: value })
  }

  const isPaid = (data.feeModel || "Fixed fee") !== "Free"
  const isSuccessFee = (data.feeModel === "Success fee" || data.feeModel === "Combination")

  const currentChecklist = Array.isArray(data.initialAssessmentInfo) ? data.initialAssessmentInfo : []

  const toggleChecklistItem = (item) => {
    if (currentChecklist.includes(item)) {
      handleChange("initialAssessmentInfo", currentChecklist.filter(i => i !== item))
    } else {
      handleChange("initialAssessmentInfo", [...currentChecklist, item])
    }
  }

  return (
    <div style={{ width: "100%", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#4a352f", margin: "0 0 0.5rem 0" }}>
          Fees & Engagement
        </h2>
        <p style={{ color: "#7d5a50", fontSize: "0.95rem", margin: 0 }}>
          Explain your commercial terms, fee structure, payment timing, and how an initial facilitation engagement begins.
        </p>
      </div>

      <div style={{ background: "#ffffff", border: "1px solid #e6d7c3", borderRadius: "14px", padding: "1.75rem", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        {/* Payer and Fee Model */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "1.75rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
              Who Pays for the Service? <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {PAYER_OPTIONS.map(opt => {
                const selected = (data.payer || "SME") === opt
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleChange("payer", opt)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "8px",
                      border: `2px solid ${selected ? "#8d6e63" : "#d7ccc8"}`,
                      background: selected ? "#f3e5dc" : "#faf7f2",
                      color: "#4a352f",
                      fontSize: "13px",
                      fontWeight: selected ? "700" : "500",
                      cursor: "pointer"
                    }}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
            <span style={{ fontSize: "12px", color: "#8d6e63", display: "block", marginTop: "4px" }}>
              Identifies whether the SME pays directly, or if fees are subsidized by funder, corporate buyer or sponsor.
            </span>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
              Fee Model <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {FEE_MODELS.map(opt => {
                const selected = (data.feeModel || "Fixed fee") === opt
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleChange("feeModel", opt)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "8px",
                      border: `2px solid ${selected ? "#8d6e63" : "#d7ccc8"}`,
                      background: selected ? "#f3e5dc" : "#faf7f2",
                      color: "#4a352f",
                      fontSize: "13px",
                      fontWeight: selected ? "700" : "500",
                      cursor: "pointer"
                    }}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Paid Fee Details (Conditional where paid) */}
        {isPaid && (
          <div style={{ padding: "1.25rem", borderRadius: "10px", background: "#faf7f2", border: "1px solid #e6d7c3", marginBottom: "1.75rem" }}>
            <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f", margin: "0 0 1rem 0" }}>
              Indicative Pricing & Payment Timing
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
                  Indicative Fees or Quotation Basis <span style={{ color: "#e53e3e" }}>*</span>
                </label>
                <input
                  type="text"
                  value={data.indicativeFees || ""}
                  onChange={(e) => handleChange("indicativeFees", e.target.value)}
                  placeholder="e.g. Fixed package R15,000, or 2.5% success fee on capital raised"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
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
                  Payment Timing <span style={{ color: "#e53e3e" }}>*</span>
                </label>
                <select
                  value={data.paymentTiming || "Milestones"}
                  onChange={(e) => handleChange("paymentTiming", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    border: "1px solid #d7ccc8",
                    borderRadius: "8px",
                    fontSize: "13px",
                    background: "#ffffff",
                    color: "#4a352f"
                  }}
                >
                  {PAYMENT_TIMING_OPTIONS.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Success Fee Basis and Trigger (Conditional) */}
            {isSuccessFee && (
              <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px dashed #d7ccc8" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
                  Success Fee Basis and Trigger
                </label>
                <input
                  type="text"
                  value={data.successFeeBasis || ""}
                  onChange={(e) => handleChange("successFeeBasis", e.target.value)}
                  placeholder="e.g. 2% to 4% of gross funds disbursed, triggered upon counterparty drawdown"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    border: "1px solid #d7ccc8",
                    borderRadius: "8px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                    background: "#ffffff",
                    color: "#4a352f"
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Third-Party Referral & Exclusivity */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "1.75rem" }}>
          {/* Referral payments */}
          <div style={{ padding: "1.25rem", borderRadius: "10px", background: "#faf7f2", border: "1px solid #e6d7c3" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
              Third-Party Referral Payments or Commissions? <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <div style={{ display: "flex", gap: "10px", marginBottom: "8px" }}>
              {["No", "Yes"].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleChange("referralCommissions", opt)}
                  style={{
                    padding: "6px 16px",
                    borderRadius: "6px",
                    border: `1px solid ${data.referralCommissions === opt ? "#8d6e63" : "#d7ccc8"}`,
                    background: data.referralCommissions === opt ? "#f3e5dc" : "#ffffff",
                    fontWeight: data.referralCommissions === opt ? "700" : "normal",
                    color: "#4a352f",
                    fontSize: "13px",
                    cursor: "pointer"
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
            {data.referralCommissions === "Yes" && (
              <textarea
                rows={2}
                value={data.referralExplanation || ""}
                onChange={(e) => handleChange("referralExplanation", e.target.value)}
                placeholder="Explain referral arrangements or commission splitting terms..."
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid #d7ccc8",
                  fontSize: "12px",
                  boxSizing: "border-box",
                  background: "#ffffff"
                }}
              />
            )}
          </div>

          {/* Exclusivity */}
          <div style={{ padding: "1.25rem", borderRadius: "10px", background: "#faf7f2", border: "1px solid #e6d7c3" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
              Exclusivity Required? <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <div style={{ display: "flex", gap: "10px", marginBottom: "8px" }}>
              {["No", "Yes"].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleChange("exclusivityRequired", opt)}
                  style={{
                    padding: "6px 16px",
                    borderRadius: "6px",
                    border: `1px solid ${data.exclusivityRequired === opt ? "#8d6e63" : "#d7ccc8"}`,
                    background: data.exclusivityRequired === opt ? "#f3e5dc" : "#ffffff",
                    fontWeight: data.exclusivityRequired === opt ? "700" : "normal",
                    color: "#4a352f",
                    fontSize: "13px",
                    cursor: "pointer"
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
            {data.exclusivityRequired === "Yes" && (
              <textarea
                rows={2}
                value={data.exclusivityExplanation || ""}
                onChange={(e) => handleChange("exclusivityExplanation", e.target.value)}
                placeholder="Explain exclusivity scope, duration, or counterparty carve-outs..."
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid #d7ccc8",
                  fontSize: "12px",
                  boxSizing: "border-box",
                  background: "#ffffff"
                }}
              />
            )}
          </div>
        </div>

        {/* How Engagement Starts & Response Time */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "1.75rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
              How Engagement Starts <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <select
              value={data.howEngagementStarts || "Initial assessment"}
              onChange={(e) => handleChange("howEngagementStarts", e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                border: "1px solid #d7ccc8",
                borderRadius: "8px",
                fontSize: "13px",
                background: "#faf7f2",
                color: "#4a352f"
              }}
            >
              <option value="Enquiry">Enquiry — initial message exchange</option>
              <option value="Consultation">Consultation — introductory discovery call</option>
              <option value="Initial assessment">Initial assessment — review of core information</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
              Typical Response Time <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <select
              value={data.typicalResponseTime || "1 - 2 business days"}
              onChange={(e) => handleChange("typicalResponseTime", e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                border: "1px solid #d7ccc8",
                borderRadius: "8px",
                fontSize: "13px",
                background: "#faf7f2",
                color: "#4a352f"
              }}
            >
              {RESPONSE_TIME_OPTIONS.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Information Needed for Initial Assessment */}
        <div style={{ marginBottom: "1.75rem" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
            Information Needed for an Initial Assessment (Short Checklist) <span style={{ color: "#e53e3e" }}>*</span>
          </label>
          <p style={{ margin: "0 0 0.75rem 0", fontSize: "12px", color: "#7d5a50" }}>
            Keep the initial checklist short. Detailed SME documents should be requested through the support workflow when needed.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "8px" }}>
            {INITIAL_CHECKLIST_DEFAULT_ITEMS.map(item => {
              const isChecked = currentChecklist.includes(item)
              return (
                <label
                  key={item}
                  onClick={() => toggleChecklistItem(item)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 10px",
                    borderRadius: "6px",
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
                  <span>{item}</span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Engagement Terms Link or URL */}
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
            Engagement Terms / Standard Agreement Link <span style={{ fontSize: "11px", color: "#8d6e63", fontWeight: "normal" }}>(Optional)</span>
          </label>
          <div style={{ position: "relative" }}>
            <input
              type="url"
              value={data.engagementTermsUrl || ""}
              onChange={(e) => handleChange("engagementTermsUrl", e.target.value)}
              placeholder="https://yourcompany.com/terms or link to shared standard advisory terms"
              style={{
                width: "100%",
                padding: "9px 12px 9px 34px",
                border: "1px solid #d7ccc8",
                borderRadius: "8px",
                fontSize: "13px",
                boxSizing: "border-box",
                background: "#faf7f2",
                color: "#4a352f"
              }}
            />
            <Link2 size={16} color="#8d6e63" style={{ position: "absolute", left: "10px", top: "10px" }} />
          </div>
        </div>
      </div>
    </div>
  )
}
