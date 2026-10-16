"use client"

import React, { useRef } from "react"
import { ShieldCheck, Lock, Upload, CheckCircle2, FileText, AlertCircle, Building, UserCheck } from "lucide-react"
import CMFSelectDropdown from "../../components/CMFSelectDropdown"

export default function CMFLegalVerification({ data = {}, allFormData = {}, updateData = () => {} }) {
  const isOrg = (allFormData?.entityOverview?.profileType || data?.profileType) !== "Individual practitioner"

  const handleChange = (field, value) => {
    updateData({ ...data, [field]: value })
  }

  const handleFileUpload = (field, file) => {
    if (!file) return
    handleChange(field, {
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString()
    })
  }

  const renderFileUploader = (field, label, required = false, description = "") => {
    const fileObj = data[field]
    return (
      <div style={{ marginTop: "8px", padding: "10px 14px", borderRadius: "8px", background: "#ffffff", border: "1px dashed #bcaaa4" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#4a352f" }}>
              {label} {required && <span style={{ color: "#e53e3e" }}>*</span>}
            </span>
            {description && <span style={{ display: "block", fontSize: "11px", color: "#8d6e63" }}>{description}</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {fileObj ? (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <CheckCircle2 size={16} color="#2e7d32" />
                <span style={{ fontSize: "12px", color: "#2e7d32", fontWeight: "600" }}>{fileObj.name}</span>
                <button
                  type="button"
                  onClick={() => handleChange(field, null)}
                  style={{ background: "transparent", border: "none", color: "#e53e3e", fontSize: "11px", cursor: "pointer", textDecoration: "underline" }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <label style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                background: "#f3e5dc",
                border: "1px solid #d7ccc8",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "600",
                color: "#4a352f",
                cursor: "pointer"
              }}>
                <Upload size={14} /> Upload Document
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={(e) => handleFileUpload(field, e.target.files?.[0])}
                  style={{ display: "none" }}
                />
              </label>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: "100%", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#fef3c7", padding: "4px 10px", borderRadius: "14px", fontSize: "12px", fontWeight: "700", color: "#92400e", marginBottom: "0.5rem" }}>
          <Lock size={13} /> Private — BIG Verification Only
        </div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#4a352f", margin: "0 0 0.5rem 0" }}>
          Legal & Verification
        </h2>
        <p style={{ color: "#7d5a50", fontSize: "0.95rem", margin: 0 }}>
          Private verification information. Uploads are placed directly next to relevant fields. Any public badge will clearly specify what BIG verified (e.g. registration, identity, or specific regulatory credential).
        </p>
      </div>

      <div style={{ background: "#ffffff", border: "1px solid #e6d7c3", borderRadius: "14px", padding: "1.75rem", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        {/* Capacity in which the CMF acts */}
        <div style={{ marginBottom: "1.75rem" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
            Capacity in which the CMF Acts <span style={{ color: "#e53e3e" }}>*</span>
          </label>
          <CMFSelectDropdown
            options={[
              { value: "Independent facilitator", label: "Independent Facilitator", desc: "Operates as an autonomous advisory intermediary" },
              { value: "Appointed representative", label: "Appointed Representative", desc: "Formally mandated by institutional funders or buyers" },
              { value: "Programme partner", label: "Programme Partner", desc: "Designated delivery partner for an enterprise / incubator programme" }
            ]}
            value={data.capacityInWhichActs || "Independent facilitator"}
            onChange={(val) => handleChange("capacityInWhichActs", val)}
            placeholder="Select capacity..."
            multiple={false}
          />
        </div>

        {/* Organisation Entity Registration (Conditional on Organisation Profile) */}
        {isOrg ? (
          <div style={{ padding: "1.25rem", borderRadius: "10px", background: "#faf7f2", border: "1px solid #e6d7c3", marginBottom: "2rem" }}>
            <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f", margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <Building size={16} color="#8d6e63" /> Organisation Legal Registration
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
                  Legal Entity Registered Name <span style={{ color: "#e53e3e" }}>*</span>
                </label>
                <input
                  type="text"
                  value={data.legalEntityName || allFormData?.entityOverview?.organisationName || ""}
                  onChange={(e) => handleChange("legalEntityName", e.target.value)}
                  placeholder="e.g. Alpha Financial Advisory (Pty) Ltd"
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
                  Registration Country <span style={{ color: "#e53e3e" }}>*</span>
                </label>
                <input
                  type="text"
                  value={data.registrationCountry || "South Africa"}
                  onChange={(e) => handleChange("registrationCountry", e.target.value)}
                  placeholder="e.g. South Africa"
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
                  Registration Number <span style={{ color: "#e53e3e" }}>*</span>
                </label>
                <input
                  type="text"
                  value={data.registrationNumber || ""}
                  onChange={(e) => handleChange("registrationNumber", e.target.value)}
                  placeholder="e.g. 2021/123456/07"
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
            </div>

            {/* Entity Registration Certificate Upload */}
            {renderFileUploader("entityRegistrationDoc", "Entity Registration Document (CIPC / Incorporation)", true, "Certificate of Incorporation or registration certificate in entity's country")}
          </div>
        ) : (
          <div style={{ padding: "1.25rem", borderRadius: "10px", background: "#faf7f2", border: "1px solid #e6d7c3", marginBottom: "2rem" }}>
            <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f", margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <UserCheck size={16} color="#8d6e63" /> Individual Practitioner Identity Verification
            </h4>
            <p style={{ margin: "0 0 1rem 0", fontSize: "12px", color: "#7d5a50" }}>
              Individual practitioners verify their own identity through government ID or passport.
            </p>
            {renderFileUploader("identityVerificationDoc", "Identity Document / Passport", true, "High-resolution copy of ID document or passport")}
          </div>
        )}

        {/* Professional or Regulatory Authorisation */}
        <div style={{ marginBottom: "2rem", padding: "1.25rem", borderRadius: "10px", background: "#faf7f2", border: "1px solid #e6d7c3" }}>
          <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f", margin: "0 0 0.5rem 0" }}>
            Relevant Professional or Regulatory Authorisation
          </h4>
          <p style={{ margin: "0 0 0.75rem 0", fontSize: "12px", color: "#7d5a50" }}>
            Conditional on services offered (e.g. FAIS FSP licence, NCR credit broker registration, legal or audit practice certificate).
          </p>

          <input
            type="text"
            value={data.professionalAuthorisationDetails || ""}
            onChange={(e) => handleChange("professionalAuthorisationDetails", e.target.value)}
            placeholder="Licence number, statutory body, scope of license and expiry date (if applicable)..."
            style={{
              width: "100%",
              padding: "9px 12px",
              border: "1px solid #d7ccc8",
              borderRadius: "8px",
              fontSize: "13px",
              boxSizing: "border-box",
              background: "#ffffff",
              color: "#4a352f",
              marginBottom: "10px"
            }}
          />

          {renderFileUploader("professionalAuthorisationDoc", "Licence or Authorisation Evidence", false, "Official licence certificate or compliance evidence")}
        </div>

        {/* Formal Mandate Evidence (Conditional if appointed representative or formal partner) */}
        {(data.capacityInWhichActs === "Appointed representative" || data.capacityInWhichActs === "Programme partner") && (
          <div style={{ marginBottom: "2rem", padding: "1.25rem", borderRadius: "10px", background: "#faf7f2", border: "1px solid #e6d7c3" }}>
            <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f", margin: "0 0 0.5rem 0" }}>
              Evidence of Claimed Formal Partnerships or Mandates <span style={{ color: "#e53e3e" }}>*</span>
            </h4>
            <p style={{ margin: "0 0 0.75rem 0", fontSize: "12px", color: "#7d5a50" }}>
              Upload appointment letter, memorandum of understanding, or representative agreement. (Document is private; status verified).
            </p>
            {renderFileUploader("mandateEvidenceDoc", "Mandate or Appointment Agreement", true, "Official appointment letter or signed partner mandate")}
          </div>
        )}

        {/* Supporting Credentials Documents */}
        <div style={{ padding: "1.25rem", borderRadius: "10px", background: "#faf7f2", border: "1px solid #e6d7c3" }}>
          <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f", margin: "0 0 0.5rem 0" }}>
            Supporting Credential Documents <span style={{ fontSize: "12px", color: "#8d6e63", fontWeight: "normal" }}>(Optional)</span>
          </h4>
          <p style={{ margin: "0 0 0.75rem 0", fontSize: "12px", color: "#7d5a50" }}>
            Upload qualifications, accreditations, or certificates to earn verified platform badges.
          </p>
          {renderFileUploader("supportingCredentialDocs", "Additional Credential Certificates", false, "Professional membership certificates, diplomas or industry awards")}
        </div>
      </div>
    </div>
  )
}
