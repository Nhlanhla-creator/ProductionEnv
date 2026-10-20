"use client"

import React from "react"
import {
  ShieldCheck,
  CheckCircle2,
  FileText,
  Upload,
  ExternalLink,
  Users,
  Eye,
  Lock,
  Globe,
  Trash2,
} from "lucide-react"
import FormField from "./FormField"
import MultiSelectDropdown from "./MultiSelectDropdown"
import styles from "./catalyst-universal-profile.module.css"
import {
  ORGANISATION_LISTING_VISIBILITY,
  ONBOARDING_RELATIONSHIPS,
  THIRD_PARTY_ACCESS_SCOPES,
} from "./catalystTaxonomy"

export default function CatalystDeclarationConsent({
  data = {},
  updateData,
  formData = {},
  isLocked = false,
}) {
  const decData = data || {}

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    updateData({
      ...decData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const handleThirdPartyFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      alert("File exceeds 10 MB limit.")
      return
    }
    updateData({
      ...decData,
      representativeAgreementFile: file,
      representativeAgreementFileName: file.name,
      representativeAgreementFileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
    })
  }

  const handleRemoveThirdPartyFile = () => {
    updateData({
      ...decData,
      representativeAgreementFile: null,
      representativeAgreementFileName: "",
      representativeAgreementFileSize: "",
    })
  }

  const isThirdPartyManaged = decData.onboardingRelationship === "authorised_third_party"

  const sectionHeadingStyle = {
    borderBottom: "2px solid #795548",
    marginBottom: "1.25rem",
    marginTop: "2rem",
    paddingBottom: "6px",
  }

  const sectionHeadingTextStyle = {
    color: "#4e342e",
    fontSize: "16px",
    fontWeight: "700",
    margin: 0,
  }

  return (
    <div className={styles.productApplicationContainer}>
      <h2 className={styles.productApplicationHeading}>Declaration & Governance</h2>

      <div
        style={{
          backgroundColor: "#f8f5f2",
          borderLeft: "4px solid #795548",
          padding: "12px 16px",
          borderRadius: "4px",
          marginBottom: "1.5rem",
          color: "#5d4037",
          fontSize: "14px",
          lineHeight: "1.5",
        }}
      >
        <strong>Governance Guidance:</strong> Confirm information accuracy and legal representation authority. Configure marketplace listing visibility and optional delegated third-party access permissions. Programme participant consents are captured separately.
      </div>

      {/* ─── 1. Mandatory Declarations & Legal Consents ──────────────────────── */}
      <div style={sectionHeadingStyle}>
        <h3 style={sectionHeadingTextStyle}>Mandatory Declarations & Legal Consents</h3>
      </div>

      <div style={{ display: "grid", gap: "1.25rem", marginBottom: "1.5rem" }}>
        {/* Declaration of Accuracy */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #d7ccc8",
            borderRadius: "8px",
            padding: "1.25rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <h4 style={{ margin: "0 0 8px 0", fontSize: "15px", fontWeight: 700, color: "#4e342e" }}>
            Declaration of Accuracy <span style={{ color: "#c62828" }}>*</span>
          </h4>
          <p style={{ margin: "0 0 1rem 0", fontSize: "13px", color: "#5d4037", lineHeight: "1.5" }}>
            I hereby declare that all information provided in this Catalyst Universal Profile and associated programme setups is true, accurate, and complete to the best of my knowledge. I understand that any false, misleading, or fabricated information may result in the suspension of the hub profile and termination of platform matching permissions.
          </p>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#3e2723",
              cursor: isLocked ? "not-allowed" : "pointer",
            }}
          >
            <input
              type="checkbox"
              name="accuracy"
              checked={!!decData.accuracy}
              onChange={handleChange}
              disabled={isLocked}
              style={{ width: "16px", height: "16px", accentColor: "#795548" }}
              required
            />
            I confirm that all information provided is accurate and complete
          </label>
        </div>

        {/* Authority Declaration */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #d7ccc8",
            borderRadius: "8px",
            padding: "1.25rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <h4 style={{ margin: "0 0 8px 0", fontSize: "15px", fontWeight: 700, color: "#4e342e" }}>
            Authority to Act & Represent <span style={{ color: "#c62828" }}>*</span>
          </h4>
          <p style={{ margin: "0 0 1rem 0", fontSize: "13px", color: "#5d4037", lineHeight: "1.5" }}>
            I declare and confirm that I hold official authority to act on behalf of this enterprise support organisation or operating unit, to configure programmes, to review applicant businesses, and to commit institutional resources. For hosted university or corporate units, delegation evidence is maintained in the Document Vault.
          </p>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#3e2723",
              cursor: isLocked ? "not-allowed" : "pointer",
            }}
          >
            <input
              type="checkbox"
              name="authority"
              checked={!!decData.authority}
              onChange={handleChange}
              disabled={isLocked}
              style={{ width: "16px", height: "16px", accentColor: "#795548" }}
              required
            />
            I confirm my authority to represent this organisation and administer its programmes
          </label>
        </div>

        {/* Platform Terms & Conditions */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #d7ccc8",
            borderRadius: "8px",
            padding: "1.25rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <h4 style={{ margin: "0 0 8px 0", fontSize: "15px", fontWeight: 700, color: "#4e342e" }}>
            Platform Terms & Conditions <span style={{ color: "#c62828" }}>*</span>
          </h4>
          <p style={{ margin: "0 0 1rem 0", fontSize: "13px", color: "#5d4037", lineHeight: "1.5" }}>
            Participation on BIG Marketplace Africa as an Enterprise Support Catalyst is governed by the Platform Master Services Terms (Version 2.4, October 2026) and the Ecosystem Code of Conduct, ensuring fair treatment of SME candidates and data privacy.
          </p>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#3e2723",
              cursor: isLocked ? "not-allowed" : "pointer",
            }}
          >
            <input
              type="checkbox"
              name="platformTerms"
              checked={!!decData.platformTerms}
              onChange={handleChange}
              disabled={isLocked}
              style={{ width: "16px", height: "16px", accentColor: "#795548" }}
              required
            />
            I have read and accept the BIG Marketplace Platform Terms & Code of Conduct
          </label>
        </div>

        {/* Consent for Data Processing */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #d7ccc8",
            borderRadius: "8px",
            padding: "1.25rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <h4 style={{ margin: "0 0 8px 0", fontSize: "15px", fontWeight: 700, color: "#4e342e" }}>
            Consent for Data Processing <span style={{ color: "#c62828" }}>*</span>
          </h4>
          <p style={{ margin: "0 0 1rem 0", fontSize: "13px", color: "#5d4037", lineHeight: "1.5" }}>
            I acknowledge the BIG Data Protection Notice. I consent to the processing and verification of organisation and programme data for matchmaking, diagnostic alignment, and ecosystem impact reporting in compliance with the Protection of Personal Information Act (POPIA) and GDPR.
          </p>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#3e2723",
              cursor: isLocked ? "not-allowed" : "pointer",
            }}
          >
            <input
              type="checkbox"
              name="dataProcessing"
              checked={!!decData.dataProcessing}
              onChange={handleChange}
              disabled={isLocked}
              style={{ width: "16px", height: "16px", accentColor: "#795548" }}
              required
            />
            I consent to the collection, verification, and processing of organisation data
          </label>
        </div>
      </div>

      {/* ─── 2. Marketplace Discovery & Privacy Controls ─────────────────────── */}
      <div style={sectionHeadingStyle}>
        <h3 style={sectionHeadingTextStyle}>Marketplace Discovery & Privacy Settings</h3>
      </div>

      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #d7ccc8",
          borderRadius: "8px",
          padding: "1.25rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ maxWidth: "500px", marginBottom: "1.25rem" }}>
          <FormField
            label="Organisation Directory Listing Visibility"
            required
            tooltip="Controls who can discover your organisation and its active programmes on BIG."
          >
            <select
              name="listingVisibility"
              value={decData.listingVisibility || "members"}
              onChange={handleChange}
              disabled={isLocked}
              className={styles.formSelect}
              required
            >
              {ORGANISATION_LISTING_VISIBILITY.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
          </FormField>
          <span style={{ fontSize: "12px", color: "#6d4c41", marginTop: "4px", display: "block" }}>
            {ORGANISATION_LISTING_VISIBILITY.find((v) => v.value === (decData.listingVisibility || "members"))?.description}
          </span>
        </div>

        <div style={{ borderTop: "1px solid #f0e6df", paddingTop: "1rem" }}>
          <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "14px", color: "#4e342e" }}>
            Optional Visibility & Promotion Permissions
          </h4>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              color: "#3e2723",
              marginBottom: "8px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              name="promotionalOptIn"
              checked={!!decData.promotionalOptIn}
              onChange={handleChange}
              disabled={isLocked}
              style={{ accentColor: "#795548" }}
            />
            Opt in for promotional spotlight (Feature our hub in monthly marketplace newsletters and sector impact showcases)
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              color: "#3e2723",
              marginBottom: "8px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              name="shareCapabilityWithSponsors"
              checked={!!decData.shareCapabilityWithSponsors}
              onChange={handleChange}
              disabled={isLocked}
              style={{ accentColor: "#795548" }}
            />
            Share organisation capability statement with accredited corporate sponsors seeking ESD implementation partners
          </label>
        </div>
      </div>

      {/* ─── 3. Account Governance & Third-Party / CMF Delegation ─────────────── */}
      <div style={sectionHeadingStyle}>
        <h3 style={sectionHeadingTextStyle}>Account Governance & Third-Party Management</h3>
      </div>

      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #d7ccc8",
          borderRadius: "8px",
          padding: "1.25rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ maxWidth: "550px", marginBottom: "1.25rem" }}>
          <FormField
            label="Onboarding & Profile Administration Relationship"
            required
            tooltip="Indicate whether full-time internal staff administer this profile or if a third party represents you."
          >
            <select
              name="onboardingRelationship"
              value={decData.onboardingRelationship || "self_managed"}
              onChange={handleChange}
              disabled={isLocked}
              className={styles.formSelect}
              required
            >
              {ONBOARDING_RELATIONSHIPS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </FormField>
          <span style={{ fontSize: "12px", color: "#6d4c41", marginTop: "4px", display: "block" }}>
            {ONBOARDING_RELATIONSHIPS.find((r) => r.value === (decData.onboardingRelationship || "self_managed"))?.description}
          </span>
        </div>

        {/* Third-Party Representative Details */}
        {isThirdPartyManaged && (
          <div
            style={{
              padding: "1.25rem",
              backgroundColor: "#fcfaf8",
              border: "1.5px solid #d7ccc8",
              borderRadius: "6px",
              marginTop: "1rem",
            }}
          >
            <h4 style={{ margin: "0 0 1rem 0", fontSize: "14px", color: "#5d4037", fontWeight: 700 }}>
              Authorised Representative Credentials & Delegated Scopes
            </h4>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "1rem",
                marginBottom: "1rem",
              }}
            >
              <FormField label="Representative Organisation Name" required>
                <input
                  type="text"
                  name="representativeOrgName"
                  value={decData.representativeOrgName || ""}
                  onChange={handleChange}
                  placeholder="e.g. Ubuntu Capital Advisors"
                  className={styles.formInput}
                  required
                />
              </FormField>
              <FormField label="Representative Contact Person" required>
                <input
                  type="text"
                  name="representativeContactPerson"
                  value={decData.representativeContactPerson || ""}
                  onChange={handleChange}
                  placeholder="e.g. Sipho Moyo"
                  className={styles.formInput}
                  required
                />
              </FormField>
              <FormField label="Representative Business Email" required>
                <input
                  type="email"
                  name="representativeEmail"
                  value={decData.representativeEmail || ""}
                  onChange={handleChange}
                  placeholder="sipho@ubuntucapital.example"
                  className={styles.formInput}
                  required
                />
              </FormField>
            </div>

            {/* Third-Party Access Scope MultiSelectDropdown */}
            <div style={{ marginBottom: "1rem" }}>
              <FormField
                label="Authorised Management Access Scopes (Multi-Select)"
                required
                tooltip="Select specific administrative modules the representative is authorized to manage."
              >
                <MultiSelectDropdown
                  options={THIRD_PARTY_ACCESS_SCOPES.map((s) => ({
                    value: s.value,
                    label: s.label,
                    description: s.description,
                  }))}
                  selected={decData.thirdPartyAccessScopes || ["profile_edits", "programme_setup"]}
                  onChange={(selected) => updateData({
                    ...decData,
                    thirdPartyAccessScopes: selected,
                  })}
                  placeholder="Select authorized access scopes..."
                  disabled={isLocked}
                />
              </FormField>
            </div>

            {/* Permission Agreement File Upload */}
            <div style={{ marginTop: "1rem" }}>
              <FormField
                label="CMF / Authorised Representative Permission Agreement"
                required
                tooltip="Signed authorization mandate form empowering the third party to act on the hub's behalf."
              >
                {!decData.representativeAgreementFileName ? (
                  <div
                    style={{
                      border: "1.5px dashed #bcaaa4",
                      borderRadius: "6px",
                      padding: "1rem",
                      backgroundColor: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "13px", color: "#5d4037", fontWeight: 600 }}>
                        Upload signed authorization agreement
                      </span>
                      <span style={{ display: "block", fontSize: "12px", color: "#8d6e63" }}>
                        Accepted formats: PDF, DOC, DOCX (Max 10 MB)
                      </span>
                    </div>

                    <label
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "6px 14px",
                        backgroundColor: "#795548",
                        color: "#ffffff",
                        borderRadius: "4px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: isLocked ? "not-allowed" : "pointer",
                      }}
                    >
                      <Upload size={14} /> Upload Agreement
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleThirdPartyFile}
                        disabled={isLocked}
                        style={{ display: "none" }}
                      />
                    </label>
                  </div>
                ) : (
                  <div
                    style={{
                      border: "1px solid #c8e6c9",
                      backgroundColor: "#f1f8e9",
                      borderRadius: "6px",
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <FileText size={20} color="#2e7d32" />
                      <div>
                        <span style={{ fontWeight: 600, fontSize: "13px", color: "#1b5e20", display: "block" }}>
                          {decData.representativeAgreementFileName}
                        </span>
                        <span style={{ fontSize: "11px", color: "#558b2f" }}>
                          Size: {decData.representativeAgreementFileSize}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveThirdPartyFile}
                      disabled={isLocked}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "#ffebee",
                        border: "1px solid #ffcdd2",
                        borderRadius: "4px",
                        fontSize: "12px",
                        color: "#c62828",
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                )}
              </FormField>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}