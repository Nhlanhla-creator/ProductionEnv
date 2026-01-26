// components/BillingInfo.jsx
"use client";
import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { getBillingInfoStyles, defaultFields } from "./Styles";
import { colors } from "../../shared/theme";

const BillingInfo = ({
  userType = "catalyst", // 'catalyst' or 'smse'
  customFields = null,
  customValidation = null,
  customFetchData = null,
  customOnSave = null,
  showSidebarSpacing = false,
}) => {
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
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Handle input changes
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  // Detect sidebar collapse state
  useEffect(() => {
    if (!showSidebarSpacing) return;

    const checkSidebarState = () => {
      setIsSidebarCollapsed(
        document.body.classList.contains("sidebar-collapsed")
      );
    };

    checkSidebarState();

    const observer = new MutationObserver(checkSidebarState);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [showSidebarSpacing]);

  const billingStyles = getBillingInfoStyles(isSidebarCollapsed, userType);

  // Default validation function
  const defaultValidateBilling = () => {
    const newErrors = {};
    if (!formData.fullName) newErrors.fullName = "Full name is required.";
    if (!formData.email) newErrors.email = "Email is required.";
    if (!formData.companyName)
      newErrors.companyName = "Company name is required.";
    if (!formData.address) newErrors.address = "Address is required.";
    if (!formData.city) newErrors.city = "City is required.";
    if (!formData.postalCode) newErrors.postalCode = "Postal Code is required.";
    if (!formData.taxId) newErrors.taxId = "Tax ID is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Default save function
  const defaultHandleSaveBilling = async () => {
    const validate = customValidation || defaultValidateBilling;
    if (!validate()) return;

    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      await setDoc(doc(db, "billingProfiles", user.uid), formData, {
        merge: true,
      });
      alert("Billing info saved successfully!");
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error("Error saving billing info:", err);
      alert("Failed to save billing info.");
    }
    setSaving(false);
  };

  // Default fetch function for Catalyst
  const defaultFetchCatalystData = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      // 1. Get Billing Info (editable)
      const billingRef = doc(db, "billingProfiles", user.uid);
      const billingSnap = await getDoc(billingRef);
      const billingData = billingSnap.exists() ? billingSnap.data() : {};

      // 2. Get User Info (for email/username fallback)
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};

      // 3. Get Profile Info from catalystProfiles
      const profileRef = doc(db, "catalystProfiles", user.uid);
      const profileSnap = await getDoc(profileRef);
      const profileData = profileSnap.exists()
        ? profileSnap.data().formData || {}
        : {};

      // Merge priority: billingProfiles > catalystProfiles > users
      const mergedData = {
        fullName:
          billingData.fullName ||
          (profileData?.contactDetails?.primaryContactName &&
          profileData?.contactDetails?.primaryContactSurname
            ? `${profileData.contactDetails.primaryContactName} ${profileData.contactDetails.primaryContactSurname}`
            : profileData?.contactDetails?.primaryContactName || "") ||
          userData?.username ||
          "",
        companyName:
          billingData.companyName ||
          profileData?.entityOverview?.registeredName ||
          userData?.company ||
          "",
        email:
          billingData.email ||
          profileData?.contactDetails?.businessEmail ||
          userData?.email ||
          user.email,
        address:
          billingData.address ||
          profileData?.contactDetails?.physicalAddress ||
          "",
        city: billingData.city || userData?.city || "",
        stateRegion: billingData.stateRegion || userData?.stateRegion || "",
        country: billingData.country || userData?.country || "South Africa",
        postalCode:
          billingData.postalCode ||
          profileData?.contactDetails?.postalAddress ||
          "",
        taxId:
          billingData.taxId || profileData?.legalCompliance?.taxNumber || "",
      };
      setFormData((prev) => ({ ...prev, ...mergedData }));
    } catch (err) {
      console.error("Failed to fetch billing info:", err);
    } finally {
      setLoading(false);
    }
  };

  // Default fetch function for SMSE
  const defaultFetchSMSEData = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Only get Profile Info from 'universalProfiles'
      const profileRef = doc(db, "universalProfiles", user.uid);
      const profileSnap = await getDoc(profileRef);
      const profileData = profileSnap.exists() ? profileSnap.data() : {};

      // Map data directly from universalProfiles
      const initialBillingData = {
        fullName: profileData?.contactDetails?.contactName || "",
        companyName: profileData?.entityOverview?.registeredName || "",
        email: profileData?.contactDetails?.email || user.email,
        address: profileData?.contactDetails?.physicalAddress || "",
        city: profileData?.contactDetails?.city || "",
        stateRegion: profileData?.contactDetails?.province || "",
        country: profileData?.contactDetails?.country || "South Africa",
        postalCode: profileData?.contactDetails?.postalAddress || "",
        taxId: profileData?.legalCompliance?.taxNumber || "",
      };

      setFormData((prev) => ({ ...prev, ...initialBillingData }));
    } catch (err) {
      console.error("Failed to fetch billing info:", err);
    }
    setLoading(false);
  };

  // Determine which fetch function to use
  const getFetchFunction = () => {
    if (customFetchData) return customFetchData;
    return userType === "catalyst"
      ? defaultFetchCatalystData
      : defaultFetchSMSEData;
  };

  // Determine which fields to display
  const getFields = () => {
    if (customFields) return customFields;

    const fields = [...defaultFields];

    if (userType === "smse") {
      // Add country options for SMSE
      return fields.map((field) => {
        if (field.key === "country") {
          return {
            ...field,
            isSelect: true,
            options: [
              "South Africa",
              "United States",
              "United Kingdom",
              "Canada",
              "Australia",
            ],
          };
        }
        return field;
      });
    }

    return fields;
  };

  useEffect(() => {
    const fetchData = getFetchFunction();
    fetchData();
  }, [userType]);

  const handleSave = customOnSave || defaultHandleSaveBilling;
  const fields = getFields();

  // Handle input focus/blur for better UX
  const handleInputFocus = (e) => {
    Object.assign(e.target.style, billingStyles.inputFocus);
  };

  const handleInputBlur = (e) => {
    Object.assign(e.target.style, billingStyles.input);
  };

  if (loading) {
    return (
      <div style={billingStyles.fullPageContainer}>
        <div style={billingStyles.contentWrapper}>
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <div style={billingStyles.loadingSpinner}></div>
            <h2
              style={{
                color: colors.darkBrown,
                fontSize: "1.5rem",
                fontWeight: 600,
              }}
            >
              Loading billing information...
            </h2>
          </div>
        </div>
        <style jsx>{`
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
    );
  }

  return (
    <div style={billingStyles.fullPageContainer}>
      <div style={billingStyles.contentWrapper}>
        <h1 style={billingStyles.pageTitle}>Billing Information</h1>
        <p style={billingStyles.subtitle}>Manage your billing details</p>

        <div>
          {fields.map((field) => (
            <div key={field.key} style={billingStyles.formGroup}>
              <label style={billingStyles.label}>{field.label}</label>
              {field.isSelect ? (
                <select
                  style={billingStyles.input}
                  value={formData[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                >
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  style={billingStyles.input}
                  type={field.type || "text"}
                  value={formData[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={`Enter ${field.label}`}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              )}
              {errors[field.key] && (
                <div style={billingStyles.error}>{errors[field.key]}</div>
              )}
            </div>
          ))}

          {hasUnsavedChanges && (
            <div
              style={{
                color: colors.accentGold,
                fontSize: "0.9rem",
                marginTop: "1rem",
                fontStyle: "italic",
              }}
            >
              You have unsaved changes
            </div>
          )}

          <button
            style={{
              ...billingStyles.button,
              ...(saving ? billingStyles.buttonDisabled : {}),
            }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Billing Info"}
          </button>
        </div>

        <style jsx>{`
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
  );
};

export default BillingInfo;
