"use client"

import { useState, useEffect, useCallback } from "react"
import { Handshake, CheckCircle, Users, FileText, Award, Shield } from 'lucide-react'

const MatchingAgreement = ({ data, updateData }) => {
  const [formData, setFormData] = useState({
    writtenEvaluation: false,
    mentorshipSupport: false,
    codeOfConduct: false,
    consentDeclaration: false,
  })

  const [errors, setErrors] = useState({})

  // Initialize form data from props only once
  useEffect(() => {
    if (data) {
      setFormData({
        writtenEvaluation: data.writtenEvaluation || false,
        mentorshipSupport: data.mentorshipSupport || false,
        codeOfConduct: data.codeOfConduct || false,
        consentDeclaration: data.consentDeclaration || false,
      })
    }
  }, []) // Empty dependency array - only run once on mount

  const handleChange = useCallback(
    (field, value) => {
      const updatedData = { ...formData, [field]: value }
      setFormData(updatedData)
      updateData(updatedData)

      // Clear error when user checks the box
      if (errors[field] && value) {
        setErrors((prev) => ({
          ...prev,
          [field]: "",
        }))
      }
    },
    [formData, updateData, errors],
  )

  const allRequiredAgreementsGiven = () => {
    return (
      formData.writtenEvaluation &&
      formData.mentorshipSupport &&
      formData.codeOfConduct &&
      formData.consentDeclaration
    )
  }

  const ConsentCheckbox = ({ id, checked, onChange, label, required = false, error }) => (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "16px",
        padding: "20px",
        backgroundColor: "#faf8f6",
        borderRadius: "8px",
        border: error ? "2px solid #f44336" : "1px solid #e8d8cf",
        transition: "all 0.3s ease",
        cursor: "pointer",
      }}
      onClick={() => onChange(!checked)}
    >
      <div
        style={{
          position: "relative",
          width: "24px",
          height: "24px",
          flexShrink: 0,
          marginTop: "2px",
        }}
      >
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={{
            position: "absolute",
            opacity: 0,
            cursor: "pointer",
            height: 0,
            width: 0,
          }}
        />
        <div
          style={{
            height: "24px",
            width: "24px",
            backgroundColor: checked ? "#8d6e63" : "white",
            border: `2px solid ${checked ? "#8d6e63" : "#d7ccc8"}`,
            borderRadius: "6px",
            position: "relative",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {checked && (
            <svg
              width="14"
              height="10"
              viewBox="0 0 14 10"
              fill="none"
              style={{
                position: "absolute",
              }}
            >
              <path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <label
          htmlFor={id}
          style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "#5d4037",
            lineHeight: "1.5",
            cursor: "pointer",
            display: "block",
          }}
        >
          {label}
          {required && <span style={{ color: "#f44336", marginLeft: "4px" }}>*</span>}
        </label>
        {error && (
          <div
            style={{
              color: "#f44336",
              fontSize: "14px",
              marginTop: "8px",
              fontWeight: "500",
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  )

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
        <Handshake size={40} color="#8d6e63" />
        Matching Agreement
      </h1>
      <div
        style={{
          width: "80px",
          height: "3px",
          backgroundColor: "#8d6e63",
          marginBottom: "16px",
          borderRadius: "2px",
        }}
      />
      <p
        style={{
          fontSize: "16px",
          color: "#6d4c41",
          marginBottom: "40px",
          lineHeight: "1.6",
        }}
      >
        As an internship provider, please review and agree to the following commitments to ensure a quality experience for interns
      </p>

      {/* Written Evaluation Commitment */}
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
          <FileText size={24} color="#8d6e63" />
          Written Evaluation Commitment
        </h2>

        <div
          style={{
            backgroundColor: "#faf8f6",
            borderRadius: "8px",
            padding: "24px",
            marginBottom: "24px",
            border: "1px solid #e8d8cf",
          }}
        >
          <p
            style={{
              fontSize: "15px",
              lineHeight: "1.6",
              color: "#6d4c41",
              marginBottom: "16px",
            }}
          >
            I commit to providing a comprehensive written assessment of the intern's performance, including:
          </p>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: "0 0 24px 0",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {[
              "Evaluation of strengths and technical capabilities",
              "Identification of areas for improvement and growth",
              "Assessment of overall contribution to the organization",
              "Feedback on professional development and work ethic",
              "Recommendations for future career development",
            ].map((item, index) => (
              <li
                key={index}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  fontSize: "14px",
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
                    marginTop: "6px",
                    flexShrink: 0,
                  }}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p
            style={{
              fontSize: "14px",
              color: "#8d6e63",
              margin: 0,
              fontStyle: "italic",
            }}
          >
            This evaluation will be completed within one week of the internship conclusion.
          </p>
        </div>

        <ConsentCheckbox
          id="writtenEvaluation"
          checked={formData.writtenEvaluation}
          onChange={(value) => handleChange("writtenEvaluation", value)}
          label="I commit to providing a comprehensive written evaluation"
          required
          error={errors.writtenEvaluation}
        />
      </div>

      {/* Mentorship Support */}
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
          <Users size={24} color="#8d6e63" />
          Mentorship Support
        </h2>

        <div
          style={{
            backgroundColor: "#faf8f6",
            borderRadius: "8px",
            padding: "24px",
            marginBottom: "24px",
            border: "1px solid #e8d8cf",
          }}
        >
          <p
            style={{
              fontSize: "15px",
              lineHeight: "1.6",
              color: "#6d4c41",
              marginBottom: "16px",
            }}
          >
            I agree to assign a qualified mentor to guide the intern throughout their placement, providing:
          </p>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: "0 0 16px 0",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {[
              "Regular check-ins and progress discussions",
              "Career guidance and industry insights",
              "Skill development support and training opportunities",
              "Constructive feedback and professional coaching",
              "A positive learning environment that fosters growth",
            ].map((item, index) => (
              <li
                key={index}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  fontSize: "14px",
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
                    marginTop: "6px",
                    flexShrink: 0,
                  }}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <ConsentCheckbox
          id="mentorshipSupport"
          checked={formData.mentorshipSupport}
          onChange={(value) => handleChange("mentorshipSupport", value)}
          label="I commit to providing dedicated mentorship support"
          required
          error={errors.mentorshipSupport}
        />
      </div>

      {/* Professional Code of Conduct */}
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
          Professional Code of Conduct
        </h2>

        <div
          style={{
            backgroundColor: "#faf8f6",
            borderRadius: "8px",
            padding: "24px",
            marginBottom: "24px",
            border: "1px solid #e8d8cf",
          }}
        >
          <p
            style={{
              fontSize: "15px",
              lineHeight: "1.6",
              color: "#6d4c41",
              marginBottom: "16px",
            }}
          >
            I acknowledge and agree to maintain the highest standards of professional conduct, ensuring:
          </p>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: "0 0 16px 0",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {[
              "The intern is treated with respect, dignity, and fairness",
              "A harassment-free and inclusive workplace environment",
              "Compliance with all applicable employment laws and regulations",
              "Adherence to ethical guidelines and company policies",
              "Protection of the intern's rights and wellbeing",
              "Fair assignment of meaningful and educational tasks",
            ].map((item, index) => (
              <li
                key={index}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  fontSize: "14px",
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
                    marginTop: "6px",
                    flexShrink: 0,
                  }}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <ConsentCheckbox
          id="codeOfConduct"
          checked={formData.codeOfConduct}
          onChange={(value) => handleChange("codeOfConduct", value)}
          label="I agree to uphold professional code of conduct standards"
          required
          error={errors.codeOfConduct}
        />
      </div>

      {/* Declaration & Consent */}
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
          <Award size={24} color="#8d6e63" />
          Declaration & Consent
        </h2>

        <div
          style={{
            backgroundColor: "#faf8f6",
            borderRadius: "8px",
            padding: "24px",
            marginBottom: "24px",
            border: "1px solid #e8d8cf",
          }}
        >
          <p
            style={{
              fontSize: "15px",
              lineHeight: "1.6",
              color: "#6d4c41",
              marginBottom: "16px",
            }}
          >
            I consent to sharing necessary information with the internship program coordinators and agree to:
          </p>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: "0 0 16px 0",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {[
              "Comply with all terms and conditions of the internship program",
              "Participate in program evaluations and feedback sessions",
              "Maintain appropriate confidentiality regarding sensitive information",
              "Report any issues or concerns to program coordinators promptly",
              "Provide timely updates on internship progress and completion",
            ].map((item, index) => (
              <li
                key={index}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  fontSize: "14px",
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
                    marginTop: "6px",
                    flexShrink: 0,
                  }}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <ConsentCheckbox
          id="consentDeclaration"
          checked={formData.consentDeclaration}
          onChange={(value) => handleChange("consentDeclaration", value)}
          label="I consent to program requirements and information sharing"
          required
          error={errors.consentDeclaration}
        />
      </div>

      {/* Summary */}
      <div
        style={{
          backgroundColor: allRequiredAgreementsGiven() ? "#f5f2f0" : "#ffebee",
          borderRadius: "12px",
          padding: "32px",
          borderLeft: `4px solid ${allRequiredAgreementsGiven() ? "#8d6e63" : "#f44336"}`,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        }}
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "600",
            color: allRequiredAgreementsGiven() ? "#5d4037" : "#c62828",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          {allRequiredAgreementsGiven() ? (
            <CheckCircle size={24} color="#8d6e63" />
          ) : (
            <Handshake size={24} color="#f44336" />
          )}
          Agreement Summary
        </h2>
        <p
          style={{
            fontSize: "16px",
            lineHeight: "1.6",
            color: allRequiredAgreementsGiven() ? "#6d4c41" : "#d32f2f",
            margin: 0,
            fontWeight: "500",
          }}
        >
          {allRequiredAgreementsGiven()
            ? "✅ All commitments have been agreed to. You're ready to provide quality internship experiences!"
            : "⚠️ Please agree to all commitments to complete your internship provider registration."}
        </p>
      </div>
    </div>
  )
}

export default MatchingAgreement