"use client"
import { useEffect, useState } from "react"
import { auth, db } from "../../firebaseConfig" // Updated import
import { doc, getDoc, setDoc } from "firebase/firestore"

// Define your consistent color palette
const colors = {
  darkBrown: "#372C27", // Deep coffee/espresso
  mediumBrown: "#5D4037", // Rich, warm brown
  lightBrown: "#8D6E63", // Muted, earthy brown
  accentGold: "#A67C52", // Golden brown for highlights
  offWhite: "#F5F2F0", // Soft off-white for text/backgrounds
  cream: "#EFEBE9", // Slightly darker cream
  lightTan: "#D7CCC8", // Very light tan for borders
  darkText: "#2C2927", // Very dark text on light backgrounds
  lightText: "#F5F2F0", // Light text on dark backgrounds
  gradientStart: "#4A352F",
  gradientEnd: "#7D5A50",
  featureCheck: "#A67C52", // Accent gold for checkmarks
  featureCross: "#D32F2F", // Red for cross marks
}

const BillingInformationSMSE = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    companyName: "",
    email: "",
    country: "South Africa",
    stateRegion: "",
    address: "",
    city: "",
    postalCode: "",
    taxId: "",
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchBillingData = async () => {
      setLoading(true)
      try {
        const user = auth.currentUser
        if (!user) return

        // Only get Profile Info from 'universalProfiles'
        const profileRef = doc(db, "universalProfiles", user.uid)
        const profileSnap = await getDoc(profileRef)
        const profileData = profileSnap.exists() ? profileSnap.data() : {}

        // Map data directly from universalProfiles
        const initialBillingData = {
          fullName: profileData?.contactDetails?.contactName || "",
          companyName: profileData?.entityOverview?.registeredName || "",
          email: profileData?.contactDetails?.email || user.email, // Fallback to user.email from auth
          address: profileData?.contactDetails?.physicalAddress || "",
          city: profileData?.contactDetails?.city || "",
          stateRegion: profileData?.contactDetails?.province || "",
          country: profileData?.contactDetails?.country || "South Africa",
          postalCode: profileData?.contactDetails?.postalAddress || "",
          taxId: profileData?.legalCompliance?.taxNumber || "",
        }

        setFormData((prev) => ({ ...prev, ...initialBillingData }))
      } catch (err) {
        console.error("Failed to fetch billing info:", err)
      }
      setLoading(false)
    }

    fetchBillingData()
  }, [])

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateBilling = () => {
    const newErrors = {}
    if (!formData.fullName) newErrors.fullName = "Full name is required."
    if (!formData.email) newErrors.email = "Email is required."
    if (!formData.companyName) newErrors.companyName = "Company name is required."
    if (!formData.address) newErrors.address = "Address is required."
    if (!formData.city) newErrors.city = "City is required."
    if (!formData.postalCode) newErrors.postalCode = "Postal Code is required."
    if (!formData.taxId) newErrors.taxId = "Tax ID is required."

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveBilling = async () => {
    if (!validateBilling()) return

    setSaving(true)
    try {
      const user = auth.currentUser
      if (!user) return

      await setDoc(doc(db, "billingProfiles", user.uid), formData, { merge: true })
      alert("Billing info saved successfully!")
    } catch (err) {
      console.error("Error saving billing info:", err)
      alert("Failed to save billing info.")
    }
    setSaving(false)
  }

  const styles = {
    fullPageContainer: {
      width: "100%",
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${colors.offWhite} 0%, ${colors.cream} 100%)`,
      fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
      color: colors.darkText,
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start", // Align content to the top
      paddingTop: "2rem", // Add some top padding
      paddingBottom: "2rem", // Add some bottom padding
    },
    contentWrapper: {
      borderRadius: "24px",
      padding: "clamp(1rem, 3vw, 2rem)",
      boxShadow: `0 20px 60px ${colors.darkBrown}15, 0 8px 24px ${colors.darkBrown}0A`,
      border: `1px solid ${colors.lightTan}`,
      position: "relative",
      overflow: "hidden",
      maxWidth: "800px",
      width: "100%", // Ensure it takes full width up to maxWidth
      backgroundColor: colors.offWhite, // Explicit background for the content box
    },
    pageTitle: {
      fontSize: "clamp(2rem, 4vw, 2.75rem)",
      fontWeight: 800,
      background: `linear-gradient(135deg, ${colors.darkBrown} 0%, ${colors.mediumBrown} 100%)`,
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      color: "transparent",
      textAlign: "center",
      marginBottom: "0.5rem",
      letterSpacing: "-1.5px",
      lineHeight: "1.2",
    },
    subtitle: {
      fontSize: "clamp(1rem, 2vw, 1.125rem)",
      color: colors.mediumBrown,
      textAlign: "center",
      marginBottom: "2rem",
      fontWeight: 400,
      opacity: 0.9,
    },
    formGroup: {
      marginBottom: "1.5rem",
    },
    label: {
      display: "block",
      fontSize: "0.95rem",
      fontWeight: 600,
      color: colors.darkBrown,
      marginBottom: "0.6rem",
    },
    input: {
      width: "100%",
      padding: "0.8rem 1rem",
      borderRadius: "10px",
      border: `1px solid ${colors.lightTan}`,
      backgroundColor: colors.offWhite,
      color: colors.darkText,
      fontSize: "1rem",
      boxShadow: `inset 0 1px 3px ${colors.darkBrown}0A`,
      transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    },
    inputFocus: {
      // Added for onFocus/onBlur
      borderColor: colors.accentGold,
      boxShadow: `0 0 0 3px ${colors.accentGold}33`,
      outline: "none",
    },
    error: {
      fontSize: "0.85rem",
      color: colors.featureCross,
      marginTop: "0.5rem",
    },
    button: {
      padding: "1rem 2.5rem",
      background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`,
      color: colors.lightText,
      border: "none",
      borderRadius: "12px",
      fontWeight: 700,
      fontSize: "1rem",
      cursor: "pointer",
      marginTop: "2rem",
      transition: "all 0.3s ease",
      boxShadow: `0 4px 12px ${colors.accentGold}4D`,
      letterSpacing: "0.5px",
      textTransform: "uppercase",
      width: "100%",
    },
    buttonDisabled: {
      opacity: 0.6,
      cursor: "not-allowed",
      background: `linear-gradient(135deg, ${colors.lightTan} 0%, ${colors.cream} 100%)`,
      color: colors.mediumBrown,
      boxShadow: `0 2px 8px ${colors.lightTan}33`,
    },
    loadingSpinner: {
      width: "60px",
      height: "60px",
      border: `4px solid ${colors.lightTan}`,
      borderTop: `4px solid ${colors.accentGold}`,
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
      margin: "0 auto 2rem auto",
    },
  }

  if (loading) {
    return (
      <div style={styles.fullPageContainer}>
        <div style={styles.contentWrapper}>
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <div style={styles.loadingSpinner}></div>
            <h2 style={{ color: colors.darkBrown, fontSize: "1.5rem", fontWeight: 600 }}>
              Loading billing information...
            </h2>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.fullPageContainer}>
      <div style={styles.contentWrapper}>
        <h1 style={styles.pageTitle}>Billing Information</h1>
        <p style={styles.subtitle}>Manage your billing details.</p>

        <div>
          {[
            { label: "Full Name", key: "fullName" },
            { label: "Company Name", key: "companyName" },
            { label: "Email", key: "email", type: "email" },
            { label: "Address", key: "address" },
            { label: "City", key: "city" },
            { label: "State/Region", key: "stateRegion" },
            {
              label: "Country",
              key: "country",
              isSelect: true,
              options: ["South Africa", "United States", "United Kingdom", "Canada", "Australia"],
            },
            { label: "Postal Code", key: "postalCode" },
            { label: "Tax ID", key: "taxId" },
          ].map((field) => (
            <div key={field.key} style={styles.formGroup}>
              <label style={styles.label}>{field.label}</label>
              {field.isSelect ? (
                <select
                  style={styles.input}
                  value={formData[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, styles.input)}
                >
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  style={styles.input}
                  type={field.type || "text"}
                  value={formData[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={`Enter ${field.label}`}
                  onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, styles.input)}
                />
              )}
              {errors[field.key] && <div style={styles.error}>{errors[field.key]}</div>}
            </div>
          ))}
          <button
            style={{ ...styles.button, ...(saving ? styles.buttonDisabled : {}) }}
            onClick={handleSaveBilling}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Billing Info"}
          </button>
        </div>

        <style>{`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    </div>
  )
}

export default BillingInformationSMSE