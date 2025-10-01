"use client"

export default function DeclarationConsent({ data = {}, updateData }) {
  const handleChange = (e) => {
    const { name, checked } = e.target
    updateData({ [name]: checked })
  }

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "2rem",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      }}
    >
      <h2
        style={{
          fontSize: "1.75rem",
          fontWeight: "700",
          color: "#3E2723",
          marginBottom: "1.5rem",
          borderBottom: "2px solid #8D6E63",
          paddingBottom: "0.75rem",
        }}
      >
        Declaration & Consent
      </h2>

      <div style={{ padding: "0.5rem" }}>
        {/* Code of Conduct */}
        <div
          style={{
            marginBottom: "2rem",
            backgroundColor: "#EFEBE9",
            padding: "1.5rem",
            borderRadius: "8px",
            border: "1px solid #8D6E63",
          }}
        >
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: "600",
              color: "#5D4037",
              marginBottom: "1rem",
            }}
          >
            Code of Conduct
          </h3>
          <p
            style={{
              color: "#6D4C41",
              lineHeight: "1.6",
              marginBottom: "1rem",
            }}
          >
            As a professional advisor, you are expected to maintain the highest standards of ethical conduct. This
            includes providing honest and transparent advice, acting in the best interests of the SMEs you advise,
            maintaining confidentiality, and conducting yourself with integrity in all professional interactions.
          </p>
          <div
            style={{
              marginTop: "1rem",
              backgroundColor: "#D7CCC8",
              padding: "0.75rem",
              borderRadius: "6px",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                name="codeOfConduct"
                checked={data.codeOfConduct || false}
                onChange={handleChange}
                style={{
                  marginRight: "12px",
                  width: "18px",
                  height: "18px",
                  accentColor: "#5D4037",
                }}
                required
              />
              <span
                style={{
                  color: "#3E2723",
                  fontSize: "14px",
                  fontStyle: "italic",
                  fontWeight: "500",
                }}
              >
                "I adhere to ethical advisory practices"
              </span>
            </label>
          </div>
        </div>

        {/* Data Sharing Consent */}
        <div
          style={{
            marginBottom: "2rem",
            backgroundColor: "#EFEBE9",
            padding: "1.5rem",
            borderRadius: "8px",
            border: "1px solid #8D6E63",
          }}
        >
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: "600",
              color: "#5D4037",
              marginBottom: "1rem",
            }}
          >
            Data Sharing Consent
          </h3>
          <p
            style={{
              color: "#6D4C41",
              lineHeight: "1.6",
              marginBottom: "1rem",
            }}
          >
            To facilitate effective matching between advisors and SMEs, we need your consent to share your profile
            information with qualified small and medium enterprises that match your expertise and preferences. Your
            contact details and professional background will only be shared with pre-screened SMEs seeking advisory
            support in your areas of expertise.
          </p>
          <div
            style={{
              marginTop: "1rem",
              backgroundColor: "#D7CCC8",
              padding: "0.75rem",
              borderRadius: "6px",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                name="dataSharingConsent"
                checked={data.dataSharingConsent || false}
                onChange={handleChange}
                style={{
                  marginRight: "12px",
                  width: "18px",
                  height: "18px",
                  accentColor: "#5D4037",
                }}
                required
              />
              <span
                style={{
                  color: "#3E2723",
                  fontSize: "14px",
                  fontStyle: "italic",
                  fontWeight: "500",
                }}
              >
                "I consent to my profile being visible to matched SMEs"
              </span>
            </label>
          </div>
        </div>

        {/* Availability Confirmation */}
        <div
          style={{
            marginBottom: "2rem",
            backgroundColor: "#EFEBE9",
            padding: "1.5rem",
            borderRadius: "8px",
            border: "1px solid #8D6E63",
          }}
        >
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: "600",
              color: "#5D4037",
              marginBottom: "1rem",
            }}
          >
            Availability Confirmation
          </h3>
          <p
            style={{
              color: "#6D4C41",
              lineHeight: "1.6",
              marginBottom: "1rem",
            }}
          >
            Please confirm that you are currently available to take on advisory engagements. This confirmation helps us
            ensure that SMEs are only matched with advisors who can commit time and energy to supporting their business
            growth. You can update your availability status at any time through your profile settings.
          </p>
          <div
            style={{
              marginTop: "1rem",
              backgroundColor: "#D7CCC8",
              padding: "0.75rem",
              borderRadius: "6px",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                name="availabilityConfirmation"
                checked={data.availabilityConfirmation || false}
                onChange={handleChange}
                style={{
                  marginRight: "12px",
                  width: "18px",
                  height: "18px",
                  accentColor: "#5D4037",
                }}
                required
              />
              <span
                style={{
                  color: "#3E2723",
                  fontSize: "14px",
                  fontStyle: "italic",
                  fontWeight: "500",
                }}
              >
                "I confirm my current availability"
              </span>
            </label>
          </div>
        </div>

        {/* Declaration of no conflict */}
        <div
          style={{
            marginBottom: "2rem",
            backgroundColor: "#EFEBE9",
            padding: "1.5rem",
            borderRadius: "8px",
            border: "1px solid #8D6E63",
          }}
        >
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: "600",
              color: "#5D4037",
              marginBottom: "1rem",
            }}
          >
            Declaration of no conflict
          </h3>
          <p
            style={{
              color: "#6D4C41",
              lineHeight: "1.6",
              marginBottom: "1rem",
            }}
          >
            By completing this profile, you declare that you have no conflicts of interest that would prevent you from
            providing objective and unbiased advisory services. If any potential conflicts arise during your engagement
            with SMEs, you commit to disclosing them immediately and taking appropriate steps to address them in
            accordance with professional advisory standards.
          </p>
          <div
            style={{
              marginTop: "1rem",
              backgroundColor: "#D7CCC8",
              padding: "0.75rem",
              borderRadius: "6px",
              textAlign: "center",
              fontWeight: "500",
              color: "#3E2723",
            }}
          >
            By submitting this profile, you acknowledge this declaration
          </div>
        </div>
      </div>
    </div>
  )
}
