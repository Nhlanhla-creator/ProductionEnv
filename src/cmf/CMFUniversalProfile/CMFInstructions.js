import React from "react"

export default function CMFInstructions() {
  return (
    <div style={{ width: "100%", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#4a352f", marginBottom: "0.5rem" }}>
          Instructions & Overview
        </h2>
        <p style={{ color: "#7d5a50", fontSize: "0.95rem", lineHeight: "1.6" }}>
          Welcome to your Capital and Market Facilitator (CMF) Profile. Follow these guidelines to complete your profile registration.
        </p>
      </div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", 
        gap: "1.5rem", 
        marginBottom: "2rem" 
      }}>
        {/* Card 1 */}
        <div style={{ backgroundColor: "#faf7f2", border: "1px solid #e6d7c3", borderRadius: "12px", padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", fontWeight: "700", color: "#4a352f" }}>How to Complete the Profile</h3>
          <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.9rem", color: "#7d5a50", lineHeight: "1.6" }}>
            <li>Complete all required fields marked with an asterisk (*).</li>
            <li>Use the tracking bar at the top to navigate between profile sections.</li>
            <li>You can save progress incrementally and resume at any time.</li>
            <li>Upload verification documents in standard formats (PDF, PNG, etc.).</li>
          </ul>
        </div>

        {/* Card 2 */}
        <div style={{ backgroundColor: "#faf7f2", border: "1px solid #e6d7c3", borderRadius: "12px", padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", fontWeight: "700", color: "#4a352f" }}>CMF Profile Purpose</h3>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#7d5a50", lineHeight: "1.6" }}>
            As a Capital and Market Facilitator, your profile is used to:
          </p>
          <ul style={{ margin: "0.5rem 0 0 0", paddingLeft: "1.2rem", fontSize: "0.9rem", color: "#7d5a50", lineHeight: "1.6" }}>
            <li>Introduce your facilitation services to businesses and fund managers.</li>
            <li>Establish deal-flow pipelines for potential capital matching.</li>
            <li>Verify compliance and credentials (B-BBEE, Tax compliance, CIPC status).</li>
          </ul>
        </div>

        {/* Card 3 */}
        <div style={{ backgroundColor: "#faf7f2", border: "1px solid #e6d7c3", borderRadius: "12px", padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", fontWeight: "700", color: "#4a352f" }}>Capital & Market Matching</h3>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#7d5a50", lineHeight: "1.6" }}>
            Your matches show businesses requiring advisory, capital structuring, and corporate connections:
          </p>
          <ul style={{ margin: "0.5rem 0 0 0", paddingLeft: "1.2rem", fontSize: "0.9rem", color: "#7d5a50", lineHeight: "1.6" }}>
            <li><strong>SME Leads:</strong> Businesses looking for deal readiness assistance.</li>
            <li><strong>Funder Matches:</strong> Capital providers looking for origination support.</li>
          </ul>
        </div>

        {/* Card 4 */}
        <div style={{ backgroundColor: "#faf7f2", border: "1px solid #e6d7c3", borderRadius: "12px", padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", fontWeight: "700", color: "#4a352f" }}>Privacy & Security</h3>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#7d5a50", lineHeight: "1.6" }}>
            All corporate profiles and client deal structures uploaded here are encrypted and stored in secure cloud environments. Information is only visible to matching parties when mutually authorized.
          </p>
        </div>
      </div>
    </div>
  )
}
