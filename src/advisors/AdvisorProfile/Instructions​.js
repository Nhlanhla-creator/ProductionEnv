"use client"

export default function Instructions() {
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
        Welcome to Your Advisor Profile
      </h2>

      <div style={{ padding: "0.5rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "#5D4037",
              marginBottom: "1rem",
            }}
          >
            Getting Started
          </h3>
          <p
            style={{
              color: "#6D4C41",
              lineHeight: "1.6",
              marginBottom: "1rem",
            }}
          >
            Welcome to the BIG Marketplace Advisor Profile! This comprehensive profile will help us understand your
            expertise, experience, and preferences to match you with small and medium enterprises (SMEs) that need your
            advisory support.
          </p>
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "#5D4037",
              marginBottom: "1rem",
            }}
          >
            What You'll Need
          </h3>
          <ul
            style={{
              color: "#6D4C41",
              lineHeight: "1.6",
              paddingLeft: "1.5rem",
            }}
          >
            <li style={{ marginBottom: "0.5rem" }}>Your professional background and experience details</li>
            <li style={{ marginBottom: "0.5rem" }}>Current and past board positions or advisory roles</li>
            <li style={{ marginBottom: "0.5rem" }}>Your area of expertise and industry experience</li>
            <li style={{ marginBottom: "0.5rem" }}>Contact information and location preferences</li>
            <li style={{ marginBottom: "0.5rem" }}>
              Documents: ID/Passport, CV, certifications, and reference letters
            </li>
            <li style={{ marginBottom: "0.5rem" }}>Your availability and compensation preferences</li>
          </ul>
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "#5D4037",
              marginBottom: "1rem",
            }}
          >
            Profile Sections
          </h3>
          <div style={{ display: "grid", gap: "1rem" }}>
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#EFEBE9",
                borderRadius: "8px",
                border: "1px solid #8D6E63",
              }}
            >
              <h4
                style={{
                  fontWeight: "600",
                  color: "#4E342E",
                  marginBottom: "0.5rem",
                }}
              >
                Personal & Professional Overview
              </h4>
              <p
                style={{
                  color: "#6D4C41",
                  fontSize: "0.9rem",
                }}
              >
                Your background, expertise, and professional headline
              </p>
            </div>
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#EFEBE9",
                borderRadius: "8px",
                border: "1px solid #8D6E63",
              }}
            >
              <h4
                style={{
                  fontWeight: "600",
                  color: "#4E342E",
                  marginBottom: "0.5rem",
                }}
              >
                Contact Details
              </h4>
              <p
                style={{
                  color: "#6D4C41",
                  fontSize: "0.9rem",
                }}
              >
                How SMEs can reach you and your location preferences
              </p>
            </div>
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#EFEBE9",
                borderRadius: "8px",
                border: "1px solid #8D6E63",
              }}
            >
              <h4
                style={{
                  fontWeight: "600",
                  color: "#4E342E",
                  marginBottom: "0.5rem",
                }}
              >
                Selection Criteria
              </h4>
              <p
                style={{
                  color: "#6D4C41",
                  fontSize: "0.9rem",
                }}
              >
                Your preferences for SME stage, sector, and engagement type
              </p>
            </div>
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#EFEBE9",
                borderRadius: "8px",
                border: "1px solid #8D6E63",
              }}
            >
              <h4
                style={{
                  fontWeight: "600",
                  color: "#4E342E",
                  marginBottom: "0.5rem",
                }}
              >
                Professional Credentials
              </h4>
              <p
                style={{
                  color: "#6D4C41",
                  fontSize: "0.9rem",
                }}
              >
                Your qualifications, board seats, and key achievements
              </p>
            </div>
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#EFEBE9",
                borderRadius: "8px",
                border: "1px solid #8D6E63",
              }}
            >
              <h4
                style={{
                  fontWeight: "600",
                  color: "#4E342E",
                  marginBottom: "0.5rem",
                }}
              >
                Required Documents
              </h4>
              <p
                style={{
                  color: "#6D4C41",
                  fontSize: "0.9rem",
                }}
              >
                Upload your ID, CV, certifications, and reference letters
              </p>
            </div>
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#EFEBE9",
                borderRadius: "8px",
                border: "1px solid #8D6E63",
              }}
            >
              <h4
                style={{
                  fontWeight: "600",
                  color: "#4E342E",
                  marginBottom: "0.5rem",
                }}
              >
                Declaration & Consent
              </h4>
              <p
                style={{
                  color: "#6D4C41",
                  fontSize: "0.9rem",
                }}
              >
                Final agreements and consent for profile visibility
              </p>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "#5D4037",
              marginBottom: "1rem",
            }}
          >
            Important Notes
          </h3>
          <div
            style={{
              backgroundColor: "#D7CCC8",
              border: "1px solid #8D6E63",
              borderRadius: "8px",
              padding: "1rem",
            }}
          >
            <ul
              style={{
                color: "#3E2723",
                lineHeight: "1.6",
                paddingLeft: "1.5rem",
                margin: 0,
              }}
            >
              <li style={{ marginBottom: "0.5rem" }}>You can save your progress at any time and return later</li>
              <li style={{ marginBottom: "0.5rem" }}>All required fields must be completed before submission</li>
              <li style={{ marginBottom: "0.5rem" }}>
                Your profile will be reviewed before being made visible to SMEs
              </li>
              <li style={{ marginBottom: "0.5rem" }}>You can edit your profile anytime after submission</li>
            </ul>
          </div>
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: "2rem",
            backgroundColor: "#5D4037",
            padding: "1rem",
            borderRadius: "8px",
          }}
        >
          <p
            style={{
              color: "#EFEBE9",
              fontSize: "1rem",
              fontWeight: "500",
            }}
          >
            Ready to get started? Click "Save & Continue" below to begin your advisor profile.
          </p>
        </div>
      </div>
    </div>
  )
}
