"use client"

import { useState } from "react"
import { CheckCircle, FileText, AlertTriangle, Lock, Users } from "lucide-react"

const DeclarationConsent = ({ data, updateData }) => {
  const [formData, setFormData] = useState({
    dataProcessingConsent: data?.dataProcessingConsent || false,
    backgroundCheckConsent: data?.backgroundCheckConsent || false,
    communicationConsent: data?.communicationConsent || false,
    termsAndConditions: data?.termsAndConditions || false,
    privacyPolicy: data?.privacyPolicy || false,
    accuracyDeclaration: data?.accuracyDeclaration || false,
    eligibilityConfirmation: data?.eligibilityConfirmation || false,
    commitmentAgreement: data?.commitmentAgreement || false,
    ...data,
  })

  const [errors, setErrors] = useState({})

  const handleConsentChange = (field, value) => {
    const updatedData = {
      ...formData,
      [field]: value,
    }
    setFormData(updatedData)
    updateData(updatedData)

    // Clear error when user checks the box
    if (errors[field] && value) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }))
    }
  }

  const allRequiredConsentsGiven = () => {
    return (
      formData.dataProcessingConsent &&
      formData.termsAndConditions &&
      formData.privacyPolicy &&
      formData.accuracyDeclaration &&
      formData.eligibilityConfirmation &&
      formData.commitmentAgreement
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
        }}
      >
        Declaration & Consent
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
        Please review and agree to the following terms and declarations to complete your profile
      </p>

      {/* Data Processing & Privacy */}
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
          <Lock size={24} color="#8d6e63" />
          Data Processing & Privacy
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
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#5d4037",
              marginBottom: "16px",
            }}
          >
            Data Processing Consent
          </h3>
          <p
            style={{
              fontSize: "15px",
              lineHeight: "1.6",
              color: "#6d4c41",
              marginBottom: "16px",
            }}
          >
            By checking this box, you consent to the collection, processing, and storage of your personal data for the
            purpose of:
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
              "Processing your internship applications",
              "Matching you with suitable internship opportunities",
              "Communicating with you about your applications and opportunities",
              "Maintaining records for compliance and reporting purposes",
              "Improving our platform and services",
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
          id="dataProcessingConsent"
          checked={formData.dataProcessingConsent}
          onChange={(value) => handleConsentChange("dataProcessingConsent", value)}
          label="I consent to the processing of my personal data as described above"
          required
          error={errors.dataProcessingConsent}
        />
      </div>

      {/* Optional Consents */}
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
          <Users size={24} color="#8d6e63" />
          Additional Permissions
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#5d4037",
                marginBottom: "12px",
              }}
            >
              Background Check Consent (Optional)
            </h3>
            <p
              style={{
                fontSize: "15px",
                lineHeight: "1.6",
                color: "#6d4c41",
                marginBottom: "16px",
              }}
            >
              Some employers may require background checks as part of their internship selection process. This consent
              is optional and will only be used if specifically required by an employer.
            </p>
            <ConsentCheckbox
              id="backgroundCheckConsent"
              checked={formData.backgroundCheckConsent}
              onChange={(value) => handleConsentChange("backgroundCheckConsent", value)}
              label="I consent to background checks when required by potential employers"
            />
          </div>

          <div>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#5d4037",
                marginBottom: "12px",
              }}
            >
              Communication Preferences
            </h3>
            <p
              style={{
                fontSize: "15px",
                lineHeight: "1.6",
                color: "#6d4c41",
                marginBottom: "16px",
              }}
            >
              We would like to keep you informed about new internship opportunities, platform updates, and relevant
              career resources.
            </p>
            <ConsentCheckbox
              id="communicationConsent"
              checked={formData.communicationConsent}
              onChange={(value) => handleConsentChange("communicationConsent", value)}
              label="I agree to receive communications about internship opportunities and platform updates"
            />
          </div>
        </div>
      </div>

      {/* Terms & Conditions */}
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
          Terms & Conditions
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
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#5d4037",
              marginBottom: "16px",
            }}
          >
            Platform Terms of Use
          </h3>
          <p
            style={{
              fontSize: "15px",
              lineHeight: "1.6",
              color: "#6d4c41",
              marginBottom: "16px",
            }}
          >
            By using our internship platform, you agree to:
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
              "Use the platform only for legitimate internship-seeking purposes",
              "Provide accurate and truthful information in your profile and applications",
              "Respect the intellectual property rights of the platform and other users",
              "Maintain professional conduct in all interactions",
              "Not share your account credentials with others",
              "Comply with all applicable laws and regulations",
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
            }}
          >
            <a
              href="/terms-and-conditions"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#8d6e63",
                textDecoration: "underline",
              }}
            >
              Read full Terms & Conditions
            </a>
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <ConsentCheckbox
            id="termsAndConditions"
            checked={formData.termsAndConditions}
            onChange={(value) => handleConsentChange("termsAndConditions", value)}
            label="I agree to the Terms & Conditions"
            required
            error={errors.termsAndConditions}
          />

          <ConsentCheckbox
            id="privacyPolicy"
            checked={formData.privacyPolicy}
            onChange={(value) => handleConsentChange("privacyPolicy", value)}
            label="I have read and agree to the Privacy Policy"
            required
            error={errors.privacyPolicy}
          />
        </div>
      </div>

      {/* Declarations */}
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
          <AlertTriangle size={24} color="#8d6e63" />
          Declarations
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#5d4037",
                marginBottom: "12px",
              }}
            >
              Accuracy of Information
            </h3>
            <p
              style={{
                fontSize: "15px",
                lineHeight: "1.6",
                color: "#6d4c41",
                marginBottom: "16px",
              }}
            >
              I declare that all information provided in my profile and applications is accurate, complete, and truthful
              to the best of my knowledge. I understand that providing false information may result in disqualification
              from internship opportunities.
            </p>
            <ConsentCheckbox
              id="accuracyDeclaration"
              checked={formData.accuracyDeclaration}
              onChange={(value) => handleConsentChange("accuracyDeclaration", value)}
              label="I declare that all information provided is accurate and truthful"
              required
              error={errors.accuracyDeclaration}
            />
          </div>

          <div>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#5d4037",
                marginBottom: "12px",
              }}
            >
              Eligibility Confirmation
            </h3>
            <p
              style={{
                fontSize: "15px",
                lineHeight: "1.6",
                color: "#6d4c41",
                marginBottom: "16px",
              }}
            >
              I confirm that I am eligible to participate in internship programs and have the legal right to work in the
              locations where I am applying for internships.
            </p>
            <ConsentCheckbox
              id="eligibilityConfirmation"
              checked={formData.eligibilityConfirmation}
              onChange={(value) => handleConsentChange("eligibilityConfirmation", value)}
              label="I confirm my eligibility for internship programs"
              required
              error={errors.eligibilityConfirmation}
            />
          </div>

          <div>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#5d4037",
                marginBottom: "12px",
              }}
            >
              Commitment Agreement
            </h3>
            <p
              style={{
                fontSize: "15px",
                lineHeight: "1.6",
                color: "#6d4c41",
                marginBottom: "16px",
              }}
            >
              I understand that internships are professional commitments. If selected for an internship, I commit to
              fulfilling the agreed-upon duration and responsibilities to the best of my ability.
            </p>
            <ConsentCheckbox
              id="commitmentAgreement"
              checked={formData.commitmentAgreement}
              onChange={(value) => handleConsentChange("commitmentAgreement", value)}
              label="I commit to fulfilling internship responsibilities if selected"
              required
              error={errors.commitmentAgreement}
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div
        style={{
          backgroundColor: allRequiredConsentsGiven() ? "#e8f5e8" : "#ffebee",
          borderRadius: "12px",
          padding: "32px",
          borderLeft: `4px solid ${allRequiredConsentsGiven() ? "#4caf50" : "#f44336"}`,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        }}
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "600",
            color: allRequiredConsentsGiven() ? "#2e7d32" : "#c62828",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          {allRequiredConsentsGiven() ? (
            <CheckCircle size={24} color="#4caf50" />
          ) : (
            <AlertTriangle size={24} color="#f44336" />
          )}
          Consent Summary
        </h2>
        <p
          style={{
            fontSize: "16px",
            lineHeight: "1.6",
            color: allRequiredConsentsGiven() ? "#388e3c" : "#d32f2f",
            margin: 0,
            fontWeight: "500",
          }}
        >
          {allRequiredConsentsGiven()
            ? "✅ All required consents have been provided. You can now submit your profile."
            : "⚠️ Please provide all required consents to complete your profile submission."}
        </p>
      </div>
    </div>
  )
}

export default DeclarationConsent
