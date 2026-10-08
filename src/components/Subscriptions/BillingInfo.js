// components/Subscriptions/BillingInfo.jsx
"use client";
import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { getBillingInfoStyles, defaultFields } from "./Styles";
import { colors } from "../../shared/theme";

const BillingInfo = ({
  userType = "catalyst", // 'catalyst' | 'smse' | 'cmf'
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

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  useEffect(() => {
    if (!showSidebarSpacing) return;
    const checkSidebarState = () => {
      setIsSidebarCollapsed(document.body.classList.contains("sidebar-collapsed"));
    };
    checkSidebarState();
    const observer = new MutationObserver(checkSidebarState);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [showSidebarSpacing]);

  const billingStyles = getBillingInfoStyles(isSidebarCollapsed, userType);

  const defaultValidateBilling = () => {
    const newErrors = {};
    if (!formData.fullName) newErrors.fullName = "Full name is required.";
    if (!formData.email) newErrors.email = "Email is required.";
    if (!formData.companyName) newErrors.companyName = "Company name is required.";
    if (!formData.address) newErrors.address = "Address is required.";
    if (!formData.city) newErrors.city = "City is required.";
    if (!formData.postalCode) newErrors.postalCode = "Postal Code is required.";
    if (!formData.taxId) newErrors.taxId = "Tax ID is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const defaultHandleSaveBilling = async () => {
    const validate = customValidation || defaultValidateBilling;
    if (!validate()) return;
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      await setDoc(doc(db, "billingProfiles", user.uid), formData, { merge: true });
      alert("Billing info saved successfully!");
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error("Error saving billing info:", err);
      alert("Failed to save billing info.");
    }
    setSaving(false);
  };

  const defaultFetchCatalystData = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const billingSnap = await getDoc(doc(db, "billingProfiles", user.uid));
      const billingData = billingSnap.exists() ? billingSnap.data() : {};
      const userSnap = await getDoc(doc(db, "users", user.uid));
      const userData = userSnap.exists() ? userSnap.data() : {};
      const profileSnap = await getDoc(doc(db, "catalystProfiles", user.uid));
      const profileData = profileSnap.exists() ? profileSnap.data().formData || {} : {};

      const mergedData = {
        fullName:
          billingData.fullName ||
          (profileData?.contactDetails?.primaryContactName && profileData?.contactDetails?.primaryContactSurname
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
        address: billingData.address || profileData?.contactDetails?.physicalAddress || "",
        city: billingData.city || userData?.city || "",
        stateRegion: billingData.stateRegion || userData?.stateRegion || "",
        country: billingData.country || userData?.country || "South Africa",
        postalCode: billingData.postalCode || profileData?.contactDetails?.postalAddress || "",
        taxId: billingData.taxId || profileData?.legalCompliance?.taxNumber || "",
      };
      setFormData((prev) => ({ ...prev, ...mergedData }));
    } catch (err) {
      console.error("Failed to fetch billing info:", err);
    } finally {
      setLoading(false);
    }
  };

  const defaultFetchSMSEData = async () => {
    setLoading(true);
    try {
      const isInvestorView = sessionStorage.getItem("investorViewMode") === "true";
      const viewingSMEId = sessionStorage.getItem("viewingSMEId");
      const user = auth.currentUser;
      const targetUid = isInvestorView && viewingSMEId ? viewingSMEId : user?.uid;
      if (!targetUid) return;
      const profileSnap = await getDoc(doc(db, "universalProfiles", targetUid));
      const profileData = profileSnap.exists() ? profileSnap.data() : {};
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

  const defaultFetchCMFData = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const billingSnap = await getDoc(doc(db, "billingProfiles", user.uid));
      const billingData = billingSnap.exists() ? billingSnap.data() : {};

      let profileData = {};
      const cmfSnap = await getDoc(doc(db, "cmfProfiles", `${user.uid}_cmf`));
      if (cmfSnap.exists()) {
        profileData = cmfSnap.data().formData || cmfSnap.data() || {};
      } else {
        const altSnap = await getDoc(doc(db, "cmfProfiles", user.uid));
        if (altSnap.exists()) profileData = altSnap.data().formData || altSnap.data() || {};
      }

      const mergedData = {
        fullName: billingData.fullName || profileData?.contactDetails?.contactName || user.displayName || "",
        companyName:
          billingData.companyName ||
          profileData?.entityOverview?.registeredName ||
          profileData?.entityOverview?.tradingName ||
          "",
        email: billingData.email || profileData?.contactDetails?.email || user.email || "",
        address: billingData.address || profileData?.contactDetails?.physicalAddress || "",
        city: billingData.city || profileData?.contactDetails?.city || "",
        stateRegion: billingData.stateRegion || profileData?.contactDetails?.province || "",
        country: billingData.country || profileData?.contactDetails?.country || "South Africa",
        postalCode: billingData.postalCode || profileData?.contactDetails?.postalAddress || "",
        taxId: billingData.taxId || profileData?.legalCompliance?.taxNumber || "",
      };
      setFormData((prev) => ({ ...prev, ...mergedData }));
    } catch (err) {
      console.error("Failed to fetch CMF billing info:", err);
    } finally {
      setLoading(false);
    }
  };

  const getFetchFunction = () => {
    if (customFetchData) return customFetchData;
    if (userType === "cmf") return defaultFetchCMFData;
    return userType === "catalyst" ? defaultFetchCatalystData : defaultFetchSMSEData;
  };

  const getFields = () => {
    if (customFields) return customFields;
    const fields = [...defaultFields];
    if (userType === "smse") {
      return fields.map((field) =>
        field.key === "country"
          ? {
              ...field,
              isSelect: true,
              options: ["South Africa", "United States", "United Kingdom", "Canada", "Australia"],
            }
          : field
      );
    }
    return fields;
  };

  useEffect(() => {
    const fetchData = getFetchFunction();
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userType]);

  const handleSave = customOnSave || defaultHandleSaveBilling;
  const fields = getFields();

  const handleInputFocus = (e) => Object.assign(e.target.style, billingStyles.inputFocus);
  const handleInputBlur = (e) => Object.assign(e.target.style, billingStyles.input);

  if (loading) {
    return (
      <div style={billingStyles.fullPageContainer}>
        <div style={billingStyles.contentWrapper}>
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <div style={billingStyles.loadingSpinner}></div>
            <h2 style={{ color: colors.darkBrown, fontSize: "1.5rem", fontWeight: 600 }}>
              Loading billing information...
            </h2>
          </div>
        </div>
        <style>{`@keyframes spin {0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}`}</style>
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
              {errors[field.key] && <div style={billingStyles.error}>{errors[field.key]}</div>}
            </div>
          ))}

          {hasUnsavedChanges && (
            <div style={{ color: colors.accentGold, fontSize: "0.9rem", marginTop: "1rem", fontStyle: "italic" }}>
              You have unsaved changes
            </div>
          )}

          <button
            style={{ ...billingStyles.button, ...(saving ? billingStyles.buttonDisabled : {}) }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Billing Info"}
          </button>
        </div>

        <style>{`@keyframes spin {0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}`}</style>
      </div>
    </div>
  );
};

export default BillingInfo;