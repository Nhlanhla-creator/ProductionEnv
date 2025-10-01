"use client"

import { FileText, Info, Shield, CheckCircle } from 'lucide-react'

const Instructions = () => {
  return (
    <div
      style={{
        padding: "32px",
        backgroundColor: "#faf8f6",
        borderRadius: "12px",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Main Title */}
      <h1
        style={{
          fontSize: "32px",
          fontWeight: "700",
          color: "#5d4037",
          marginBottom: "8px",
          letterSpacing: "-0.02em",
        }}
      >
        Instructions
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

      {/* How to complete the form */}
      <div
        style={{
          backgroundColor: "#f5f2f0",
          borderRadius: "12px",
          padding: "32px",
          marginBottom: "32px",
          borderLeft: "4px solid #8d6e63",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        }}
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "600",
            color: "#5d4037",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <FileText size={24} color="#8d6e63" />
          How to complete the form
        </h2>

        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {[
            "Complete all required fields marked with an asterisk (*)",
            "Navigate through sections using the tracker at the top",
            "You can save your progress and return later",
            "Upload all required documents in the specified formats",
            "Review your information before final submission",
            "Click on each section in the tracker to view specific instructions",
          ].map((item, index) => (
            <li
              key={index}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                fontSize: "16px",
                lineHeight: "1.6",
                color: "#6d4c41",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#8d6e63",
                  borderRadius: "50%",
                  marginTop: "8px",
                  flexShrink: 0,
                }}
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Purpose of data collection */}
      <div
        style={{
          backgroundColor: "#f5f2f0",
          borderRadius: "12px",
          padding: "32px",
          marginBottom: "32px",
          borderLeft: "4px solid #8d6e63",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        }}
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "600",
            color: "#5d4037",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <Info size={24} color="#8d6e63" />
          Purpose of data collection
        </h2>

        <p
          style={{
            fontSize: "16px",
            lineHeight: "1.6",
            color: "#6d4c41",
            marginBottom: "24px",
            fontWeight: "400",
          }}
        >
          The information collected in this Universal Profile will be used to:
        </p>

        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {[
            "Create your comprehensive student profile",
            "Match you with suitable internship opportunities",
            "Facilitate communication between you and potential employers",
            "Maintain records for compliance and program evaluation",
            "Provide personalized career guidance and support",
            "Generate reports for funding organizations and sponsors",
          ].map((item, index) => (
            <li
              key={index}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                fontSize: "16px",
                lineHeight: "1.6",
                color: "#6d4c41",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#8d6e63",
                  borderRadius: "50%",
                  marginTop: "8px",
                  flexShrink: 0,
                }}
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Data Security & Privacy */}
      <div
        style={{
          backgroundColor: "#f5f2f0",
          borderRadius: "12px",
          padding: "32px",
          marginBottom: "32px",
          borderLeft: "4px solid #8d6e63",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        }}
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "600",
            color: "#5d4037",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <Shield size={24} color="#8d6e63" />
          Data Security & Privacy
        </h2>

        <p
          style={{
            fontSize: "16px",
            lineHeight: "1.6",
            color: "#6d4c41",
            marginBottom: "24px",
            fontWeight: "400",
          }}
        >
          Your privacy and data security are our top priorities. We ensure that:
        </p>

        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {[
            "All data is encrypted and stored securely",
            "Information is only shared with your explicit consent",
            "You can update or delete your profile at any time",
            "We comply with all applicable data protection regulations",
            "Access to your data is strictly controlled and monitored",
          ].map((item, index) => (
            <li
              key={index}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                fontSize: "16px",
                lineHeight: "1.6",
                color: "#6d4c41",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#8d6e63",
                  borderRadius: "50%",
                  marginTop: "8px",
                  flexShrink: 0,
                }}
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Getting Started */}
      <div
        style={{
          backgroundColor: "#e8f5e8",
          borderRadius: "12px",
          padding: "32px",
          borderLeft: "4px solid #4caf50",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        }}
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "600",
            color: "#2e7d32",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <CheckCircle size={24} color="#4caf50" />
          Ready to get started?
        </h2>

        <p
          style={{
            fontSize: "16px",
            lineHeight: "1.6",
            color: "#388e3c",
            margin: 0,
            fontWeight: "500",
          }}
        >
          Click "Save & Continue" below to begin filling out your Universal Profile. Remember, you can save your
          progress at any time and return to complete it later.
        </p>
      </div>
    </div>
  )
}

export default Instructions
