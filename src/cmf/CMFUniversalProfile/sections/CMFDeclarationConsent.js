"use client"

import React from "react"
import { CheckSquare, ShieldCheck, AlertCircle, FileCheck, Info } from "lucide-react"

export default function CMFDeclarationConsent({ data = {}, updateData = () => {}, onSubmit, canSubmit = false }) {
  const handleChange = (field, value) => {
    updateData({ ...data, [field]: value })
  }

  const allMandatoryChecked = Boolean(
    data.accuracy &&
    data.permissionRelationships &&
    data.approvePublicProfile &&
    data.acceptTermsPrivacy
  )

  return (
    <div style={{ width: "100%", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#4a352f", margin: "0 0 0.5rem 0" }}>
          Declaration & Consent
        </h2>
        <p style={{ color: "#7d5a50", fontSize: "0.95rem", margin: 0 }}>
          Confirm the accuracy of your facilitator profile, grant publication permissions for public credentials, and accept platform operating provisions.
        </p>
      </div>

      <div style={{ background: "#ffffff", border: "1px solid #e6d7c3", borderRadius: "14px", padding: "1.75rem", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#4a352f", margin: "0 0 0.5rem 0" }}>
            Mandatory Declarations
          </h3>
          <p style={{ margin: "0 0 1.25rem 0", fontSize: "13px", color: "#7d5a50" }}>
            All four confirmations below are required before your facilitator profile can be published on BIG Marketplace.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* 1. Accuracy */}
            <label style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              padding: "12px 14px",
              borderRadius: "10px",
              background: data.accuracy ? "#f3e5dc" : "#faf7f2",
              border: `1px solid ${data.accuracy ? "#8d6e63" : "#e6d7c3"}`,
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}>
              <input
                type="checkbox"
                checked={Boolean(data.accuracy)}
                onChange={(e) => handleChange("accuracy", e.target.checked)}
                style={{ accentColor: "#8d6e63", marginTop: "3px" }}
              />
              <div>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#4a352f", display: "block" }}>
                  1. Accuracy of Information Supplied <span style={{ color: "#e53e3e" }}>*</span>
                </span>
                <span style={{ fontSize: "12px", color: "#7d5a50", lineHeight: "1.5" }}>
                  I declare that all information, team credentials, track record statements, and legal details provided in this profile are true, complete, and accurate.
                </span>
              </div>
            </label>

            {/* 2. Permission to publish named relationships */}
            <label style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              padding: "12px 14px",
              borderRadius: "10px",
              background: data.permissionRelationships ? "#f3e5dc" : "#faf7f2",
              border: `1px solid ${data.permissionRelationships ? "#8d6e63" : "#e6d7c3"}`,
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}>
              <input
                type="checkbox"
                checked={Boolean(data.permissionRelationships)}
                onChange={(e) => handleChange("permissionRelationships", e.target.checked)}
                style={{ accentColor: "#8d6e63", marginTop: "3px" }}
              />
              <div>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#4a352f", display: "block" }}>
                  2. Permission to Publish Named Relationships, Logos and Testimonials <span style={{ color: "#e53e3e" }}>*</span>
                </span>
                <span style={{ fontSize: "12px", color: "#7d5a50", lineHeight: "1.5" }}>
                  I confirm that our organisation has obtained all necessary permissions, rights, and client consents to publish any named partner relationships, corporate logos, case study details, and client testimonials included in this profile.
                </span>
              </div>
            </label>

            {/* 3. Approve public profile for sharing with SMEs */}
            <label style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              padding: "12px 14px",
              borderRadius: "10px",
              background: data.approvePublicProfile ? "#f3e5dc" : "#faf7f2",
              border: `1px solid ${data.approvePublicProfile ? "#8d6e63" : "#e6d7c3"}`,
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}>
              <input
                type="checkbox"
                checked={Boolean(data.approvePublicProfile)}
                onChange={(e) => handleChange("approvePublicProfile", e.target.checked)}
                style={{ accentColor: "#8d6e63", marginTop: "3px" }}
              />
              <div>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#4a352f", display: "block" }}>
                  3. Approval for Sharing with SMEs on BIG Marketplace <span style={{ color: "#e53e3e" }}>*</span>
                </span>
                <span style={{ fontSize: "12px", color: "#7d5a50", lineHeight: "1.5" }}>
                  I approve the displayed public profile to be listed on BIG Marketplace and matched with eligible SMEs seeking capital and market facilitation.
                </span>
              </div>
            </label>

            {/* 4. Terms and privacy provisions */}
            <label style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              padding: "12px 14px",
              borderRadius: "10px",
              background: data.acceptTermsPrivacy ? "#f3e5dc" : "#faf7f2",
              border: `1px solid ${data.acceptTermsPrivacy ? "#8d6e63" : "#e6d7c3"}`,
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}>
              <input
                type="checkbox"
                checked={Boolean(data.acceptTermsPrivacy)}
                onChange={(e) => handleChange("acceptTermsPrivacy", e.target.checked)}
                style={{ accentColor: "#8d6e63", marginTop: "3px" }}
              />
              <div>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#4a352f", display: "block" }}>
                  4. Platform Terms & Privacy Acceptance <span style={{ color: "#e53e3e" }}>*</span>
                </span>
                <span style={{ fontSize: "12px", color: "#7d5a50", lineHeight: "1.5" }}>
                  I accept the BIG Platform Terms of Service, Facilitator Participation Agreement, and Protection of Personal Information (POPIA) privacy provisions.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Optional Marketing Consent */}
        <div style={{
          padding: "1.25rem",
          borderRadius: "10px",
          background: "#faf7f2",
          border: "1px solid #e6d7c3",
          marginBottom: "1.5rem"
        }}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={Boolean(data.marketingConsent)}
              onChange={(e) => handleChange("marketingConsent", e.target.checked)}
              style={{ accentColor: "#8d6e63", marginTop: "3px" }}
            />
            <div>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#4a352f", display: "block" }}>
                Platform Insights & Opportunity Alerts (Optional)
              </span>
              <span style={{ fontSize: "12px", color: "#7d5a50", lineHeight: "1.5" }}>
                I agree to receive platform deal-flow digests, procurement opportunity circulars, and quarterly facilitation reports.
              </span>
            </div>
          </label>
        </div>

        {!allMandatoryChecked && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 14px",
            borderRadius: "8px",
            background: "#fffbeb",
            border: "1px solid #fde68a",
            color: "#92400e",
            fontSize: "12px",
            fontWeight: "600"
          }}>
            <AlertCircle size={16} />
            Please confirm all four mandatory statements above to submit your CMF profile.
          </div>
        )}
      </div>
    </div>
  )
}
