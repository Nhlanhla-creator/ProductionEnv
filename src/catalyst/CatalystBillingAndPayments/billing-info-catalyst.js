"use client"
import { useEffect, useState } from "react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db, auth } from "../../firebaseConfig"

// Define your consistent color palette
const colors = {
  darkBrown: "#372C27",
  mediumBrown: "#5D4037",
  lightBrown: "#8D6E63",
  accentGold: "#A67C52",
  offWhite: "#F5F2F0",
  cream: "#EFEBE9",
  lightTan: "#D7CCC8",
  darkText: "#2C2927",
  lightText: "#F5F2F0",
  gradientStart: "#4A352F",
  gradientEnd: "#7D5A50",
  featureCheck: "#A67C52",
  featureCross: "#D32F2F",
}

const BillingInfoCatalyst = () => {
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
    const fetchAllBillingData = async () => {
      setLoading(true)
      try {
        const user = auth.currentUser
        if (!user) return

        // 1. Get Billing Info (editable)
        const billingRef = doc(db, "billingProfiles", user.uid)
        const billingSnap = await getDoc(billingRef)
        const billingData = billingSnap.exists() ? billingSnap.data() : {}

        // 2. Get User Info (for email/username fallback)
        const userRef = doc(db, "users", user.uid)
        const userSnap = await getDoc(userRef)
        const userData = userSnap.exists() ? userSnap.data() : {}

        // 3. Get Profile Info from catalystProfiles
        const profileRef = doc(db, "catalystProfiles", user.uid)
        const profileSnap = await getDoc(profileRef)
        const profileData = profileSnap.exists() ? profileSnap.data().formData || {} : {}

        // Merge priority: billingProfiles > catalystProfiles > users
        const mergedData = {
          fullName:
            billingData.fullName ||
            (profileData?.contactDetails?.primaryContactName && profileData?.contactDetails?.primaryContactSurname
              ? `${profileData.contactDetails.primaryContactName} ${profileData.contactDetails.primaryContactSurname}`
              : profileData?.contactDetails?.primaryContactName || "") ||
            userData?.username ||
            "",
          companyName:
            billingData.companyName || profileData?.entityOverview?.registeredName || userData?.company || "",
          email: billingData.email || profileData?.contactDetails?.businessEmail || userData?.email || user.email,
          address: billingData.address || profileData?.contactDetails?.physicalAddress || "",
          city: billingData.city || userData?.city || "",
          stateRegion: billingData.stateRegion || userData?.stateRegion || "",
          country: billingData.country || userData?.country || "South Africa",
          postalCode: billingData.postalCode || profileData?.contactDetails?.postalAddress || "",
          taxId: billingData.taxId || profileData?.legalCompliance?.taxNumber || "",
        }
        setFormData((prev) => ({ ...prev, ...mergedData }))
      } catch (err) {
        console.error("Failed to fetch billing info:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchAllBillingData()
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
      alignItems: "flex-start",
      padding: "2rem 4rem"
    },
    contentWrapper: {
      borderRadius: "24px",
      padding: "clamp(1rem, 3vw, 2rem)",
      boxShadow: `0 20px 60px ${colors.darkBrown}15, 0 8px 24px ${colors.darkBrown}0A`,
      border: `1px solid ${colors.lightTan}`,
      position: "relative",
      overflow: "hidden",
      width: "100%",
      backgroundColor: colors.offWhite,
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
      "&:focus": {
        borderColor: colors.accentGold,
        boxShadow: `0 0 0 3px ${colors.accentGold}33`,
        outline: "none",
      },
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
        <p style={styles.subtitle}>Manage your billing details</p>

        <div>
          {[
            { label: "Full Name", key: "fullName" },
            { label: "Company Name", key: "companyName" },
            { label: "Email", key: "email", type: "email" },
            { label: "Address", key: "address" },
            { label: "City", key: "city" },
            { label: "State/Region", key: "stateRegion" },
            { label: "Country", key: "country" },
            { label: "Postal Code", key: "postalCode" },
            { label: "Tax ID", key: "taxId" },
          ].map((field) => (
            <div key={field.key} style={styles.formGroup}>
              <label style={styles.label}>{field.label}</label>
              <input
                style={styles.input}
                type={field.type || "text"}
                value={formData[field.key]}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={`Enter ${field.label}`}
              />
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

export default BillingInfoCatalyst