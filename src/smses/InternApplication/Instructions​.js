"use client"

import React from "react"
import { BookOpen, CheckCircle, Target } from "lucide-react"

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
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <BookOpen size={40} color="#8d6e63" />
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
          <CheckCircle size={24} color="#8d6e63" />
          How to complete the form
        </h2>

        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "0",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
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
                fontSize: "15px",
                lineHeight: "1.5",
                color: "#6d4c41",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
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
          <Target size={24} color="#8d6e63" />
          Purpose of data collection
        </h2>

        <p
          style={{
            fontSize: "15px",
            lineHeight: "1.6",
            color: "#6d4c41",
            marginBottom: "16px",
          }}
        >
          The information collected in this Universal Profile will be used to:
        </p>

        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "0",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {[
            "Create your comprehensive business profile",
            "Match you with relevant interns and candidates",
            "Evaluate your suitability for available opportunities",
            "Support decision-making by host organizations",
          ].map((item, index) => (
            <li
              key={index}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                fontSize: "15px",
                lineHeight: "1.5",
                color: "#6d4c41",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
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
    </div>
  )
}

export default Instructions