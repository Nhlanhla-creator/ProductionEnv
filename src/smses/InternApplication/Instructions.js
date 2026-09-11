 "use client"

import React from "react"

const Instructions = ({ data, updateData }) => {
  const handleConfirm = (e) => {
    const checked = e.target.checked
    updateData({ confirmed: checked })
  }

  return (
    <div
      style={{
        padding: "32px",
        backgroundColor: "#faf8f6",
        borderRadius: "12px",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <h1
        style={{
          fontSize: "32px",
          fontWeight: "700",
          color: "#5d4037",
          marginBottom: "8px",
          letterSpacing: "-0.02em",
        }}
      >
        📋 Internship Application Instructions
      </h1>
      <div
        style={{
          width: "80px",
          height: "3px",
          backgroundColor: "#8d6e63",
          marginBottom: "40px",
          borderRadius: "2px",
        }}
      />

      {/* Overview Section */}
      <div
        style={{
          backgroundColor: "#f5f2f0",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
          borderLeft: "4px solid #8d6e63",
        }}
      >
        <h2
          style={{
            fontSize: "20px",
            fontWeight: "600",
            color: "#5d4037",
            marginBottom: "12px",
          }}
        >
          📌 Overview
        </h2>
        <p
          style={{
            fontSize: "15px",
            lineHeight: "1.6",
            color: "#6d4c41",
            marginBottom: "12px",
          }}
        >
          This application form is designed to help us understand your internship needs and match you with the most
          suitable candidates. The application consists of four sections:
        </p>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
          }}
        >
          <li style={{ padding: "6px 0", fontSize: "15px", color: "#6d4c41", display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <span style={{ color: "#8d6e63" }}>•</span>
            <span><strong>Instructions:</strong> Review the application guidelines and requirements</span>
          </li>
          <li style={{ padding: "6px 0", fontSize: "15px", color: "#6d4c41", display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <span style={{ color: "#8d6e63" }}>•</span>
            <span><strong>Job Overview:</strong> Provide details about the internship position</span>
          </li>
          <li style={{ padding: "6px 0", fontSize: "15px", color: "#6d4c41", display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <span style={{ color: "#8d6e63" }}>•</span>
            <span><strong>Internship Request:</strong> Specify the number of interns needed and requirements</span>
          </li>
          <li style={{ padding: "6px 0", fontSize: "15px", color: "#6d4c41", display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <span style={{ color: "#8d6e63" }}>•</span>
            <span><strong>Matching Agreement:</strong> Review and accept the terms and conditions</span>
          </li>
        </ul>
      </div>

      {/* How to Complete Section */}
      <div
        style={{
          backgroundColor: "#f5f2f0",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
          borderLeft: "4px solid #8d6e63",
        }}
      >
        <h2
          style={{
            fontSize: "20px",
            fontWeight: "600",
            color: "#5d4037",
            marginBottom: "12px",
          }}
        >
          ✅ How to Complete This Application
        </h2>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
          }}
        >
          <li style={{ padding: "6px 0", fontSize: "15px", color: "#6d4c41", display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <span style={{ color: "#8d6e63" }}>1.</span>
            <span>Navigate through each section using the tracker buttons at the top of the page</span>
          </li>
          <li style={{ padding: "6px 0", fontSize: "15px", color: "#6d4c41", display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <span style={{ color: "#8d6e63" }}>2.</span>
            <span>Fill in all required fields marked with a red asterisk (*)</span>
          </li>
          <li style={{ padding: "6px 0", fontSize: "15px", color: "#6d4c41", display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <span style={{ color: "#8d6e63" }}>3.</span>
            <span>Use the "Save & Continue" button to save your progress and move to the next section</span>
          </li>
          <li style={{ padding: "6px 0", fontSize: "15px", color: "#6d4c41", display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <span style={{ color: "#8d6e63" }}>4.</span>
            <span>You can return to previous sections at any time to make changes</span>
          </li>
          <li style={{ padding: "6px 0", fontSize: "15px", color: "#6d4c41", display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <span style={{ color: "#8d6e63" }}>5.</span>
            <span>Once all sections are complete, submit your application for review</span>
          </li>
        </ul>
        <div
          style={{
            marginTop: "12px",
            padding: "12px",
            backgroundColor: "#e8e0d8",
            borderRadius: "6px",
            fontSize: "14px",
            color: "#5d4037",
          }}
        >
          💡 <strong>Note:</strong> Your progress is automatically saved when you click "Save & Continue". You can leave and
          return to your application at any time.
        </div>
      </div>

      {/* Important Information Section */}
      <div
        style={{
          backgroundColor: "#faf6f2",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
          borderLeft: "4px solid #a1887f",
        }}
      >
        <h2
          style={{
            fontSize: "20px",
            fontWeight: "600",
            color: "#5d4037",
            marginBottom: "12px",
          }}
        >
          ⚠️ Important Information
        </h2>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
          }}
        >
          <li style={{ padding: "6px 0", fontSize: "15px", color: "#6d4c41", display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <span style={{ color: "#a1887f" }}>•</span>
            <span>Your organization must be registered and verified to post internship opportunities</span>
          </li>
          <li style={{ padding: "6px 0", fontSize: "15px", color: "#6d4c41", display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <span style={{ color: "#a1887f" }}>•</span>
            <span>All applications are reviewed within 3-5 business days</span>
          </li>
          <li style={{ padding: "6px 0", fontSize: "15px", color: "#6d4c41", display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <span style={{ color: "#a1887f" }}>•</span>
            <span>Once approved, your internship will be matched with suitable candidates from our talent pool</span>
          </li>
          <li style={{ padding: "6px 0", fontSize: "15px", color: "#6d4c41", display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <span style={{ color: "#a1887f" }}>•</span>
            <span>For assistance, contact our support team at support@big.org.za</span>
          </li>
        </ul>
      </div>

      {/* Purpose Section */}
      <div
        style={{
          backgroundColor: "#f5f2f0",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
          borderLeft: "4px solid #8d6e63",
        }}
      >
        <h2
          style={{
            fontSize: "20px",
            fontWeight: "600",
            color: "#5d4037",
            marginBottom: "12px",
          }}
        >
          🎯 Purpose of Data Collection
        </h2>
        <p
          style={{
            fontSize: "15px",
            lineHeight: "1.6",
            color: "#6d4c41",
            marginBottom: "12px",
          }}
        >
          The information collected in this application will be used to:
        </p>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
          }}
        >
          <li style={{ padding: "6px 0", fontSize: "15px", color: "#6d4c41", display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <span style={{ color: "#8d6e63" }}>•</span>
            <span>Create your comprehensive internship profile</span>
          </li>
          <li style={{ padding: "6px 0", fontSize: "15px", color: "#6d4c41", display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <span style={{ color: "#8d6e63" }}>•</span>
            <span>Match you with suitable candidates from our talent pool</span>
          </li>
          <li style={{ padding: "6px 0", fontSize: "15px", color: "#6d4c41", display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <span style={{ color: "#8d6e63" }}>•</span>
            <span>Evaluate the suitability of your internship opportunity</span>
          </li>
          <li style={{ padding: "6px 0", fontSize: "15px", color: "#6d4c41", display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <span style={{ color: "#8d6e63" }}>•</span>
            <span>Support decision-making by the review committee</span>
          </li>
          <li style={{ padding: "6px 0", fontSize: "15px", color: "#6d4c41", display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <span style={{ color: "#8d6e63" }}>•</span>
            <span>Track and manage internship placements</span>
          </li>
        </ul>
      </div>

      {/* Quick Tips Section */}
      <div
        style={{
          backgroundColor: "#f3f0ed",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
          borderLeft: "4px solid #a1887f",
        }}
      >
        <h2
          style={{
            fontSize: "20px",
            fontWeight: "600",
            color: "#5d4037",
            marginBottom: "12px",
          }}
        >
          💡 Quick Tips for Success
        </h2>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
          }}
        >
          <li style={{ padding: "6px 0", fontSize: "15px", color: "#6d4c41", display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <span style={{ color: "#a1887f" }}>•</span>
            <span>Be specific about internship requirements to attract the right candidates</span>
          </li>
          <li style={{ padding: "6px 0", fontSize: "15px", color: "#6d4c41", display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <span style={{ color: "#a1887f" }}>•</span>
            <span>Provide clear expectations for intern responsibilities and learning outcomes</span>
          </li>
          <li style={{ padding: "6px 0", fontSize: "15px", color: "#6d4c41", display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <span style={{ color: "#a1887f" }}>•</span>
            <span>Ensure your department information is accurate and up-to-date</span>
          </li>
          <li style={{ padding: "6px 0", fontSize: "15px", color: "#6d4c41", display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <span style={{ color: "#a1887f" }}>•</span>
            <span>Consider what makes your internship opportunity unique and attractive</span>
          </li>
          <li style={{ padding: "6px 0", fontSize: "15px", color: "#6d4c41", display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <span style={{ color: "#a1887f" }}>•</span>
            <span>Review all information before submitting to avoid delays</span>
          </li>
        </ul>
      </div>

      {/* Confirmation Section */}
      <div
        style={{
          backgroundColor: "#f1f8f1",
          borderRadius: "12px",
          padding: "24px",
          borderLeft: "4px solid #4caf50",
        }}
      >
        <h2
          style={{
            fontSize: "20px",
            fontWeight: "600",
            color: "#2e7d32",
            marginBottom: "12px",
          }}
        >
          ✅ Confirmation
        </h2>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          <input
            type="checkbox"
            id="instructions-confirm"
            checked={data?.confirmed || false}
            onChange={handleConfirm}
            style={{
              width: "20px",
              height: "20px",
              marginTop: "2px",
              accentColor: "#4caf50",
              cursor: "pointer",
              flexShrink: 0,
            }}
          />
          <div>
            <label
              htmlFor="instructions-confirm"
              style={{
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer",
                color: "#2e7d32",
                display: "block",
                marginBottom: "4px",
              }}
            >
              I confirm that I have read and understood all the instructions above.
            </label>
            <span
              style={{
                fontSize: "14px",
                color: "#4e342e",
                display: "block",
              }}
            >
              I understand that incomplete applications may delay the review process.
            </span>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div
        style={{
          marginTop: "24px",
          padding: "16px 20px",
          backgroundColor: "#e8e0d8",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}>📄</span>
          <span style={{ fontWeight: "500", color: "#4e342e" }}>
            Ready to start your internship application?
          </span>
        </div>
        <div>
          <span
            style={{
              fontSize: "14px",
              fontWeight: "500",
              color: data?.confirmed ? "#2e7d32" : "#795548",
            }}
          >
            {data?.confirmed ? "✅ Confirmed" : "⏳ Please confirm to proceed"}
          </span>
        </div>
      </div>
    </div>
  )
}

export default Instructions
