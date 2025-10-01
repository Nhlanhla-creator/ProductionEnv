"use client";

import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const BillingInformation = () => {
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

useEffect(() => {
  const fetchAllBillingData = async () => {
    setLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const db = getFirestore();

      // 1. Get Billing Info (editable)
      const billingRef = doc(db, "billingProfiles", user.uid);
      const billingSnap = await getDoc(billingRef);
      const billingData = billingSnap.exists() ? billingSnap.data() : {};

      // 2. Get User Info (for email/username fallback)
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};

      // 3. Get Profile Info (company details etc.)
      const profileRef = doc(db, "MyuniversalProfiles", user.uid);
      const profileSnap = await getDoc(profileRef);
      const profileData = profileSnap.exists() ? profileSnap.data().formData || {} : {};

      // Merge priority: billingProfiles > MyuniversalProfiles > users
      const mergedData = {
        fullName:
          billingData.fullName ||
          profileData?.contactDetails?.fullName ||
          userData?.username ||
          "",
        companyName:
          billingData.companyName ||
          profileData?.entityOverview?.registeredName ||
          userData?.company ||
          "",
        email: billingData.email || userData?.email || user.email,
        address:
          billingData.address ||
          profileData?.contactDetails?.physicalAddress ||
          "",
        city:
          billingData.city ||
          profileData?.contactDetails?.city ||
          "",
        stateRegion:
          billingData.stateRegion ||
          profileData?.contactDetails?.province ||
          "",
        country:
          billingData.country ||
          profileData?.contactDetails?.country ||
          "South Africa",
        postalCode:
          billingData.postalCode ||
          profileData?.contactDetails?.postalAddress ||
          "",
        taxId:
          billingData.taxId ||
          profileData?.legalCompliance?.taxNumber ||
          "",
      };

      setFormData((prev) => ({ ...prev, ...mergedData }));
    } catch (err) {
      console.error("Failed to fetch billing info:", err);
    }
    setLoading(false);
  };

  fetchAllBillingData();
}, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
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

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const auth = getAuth();
      const db = getFirestore();
      const user = auth.currentUser;
      if (!user) return;

      await setDoc(doc(db, "billingProfiles", user.uid), formData, { merge: true });
      alert("Billing info saved successfully!");
    } catch (err) {
      console.error("Error saving billing info:", err);
      alert("Failed to save billing info.");
    }
    setSaving(false);
  };

  const styles = {
    container: {
      maxWidth: "700px",
      margin: "3rem auto",
      padding: "2rem",
      backgroundColor: "white",
      color: "black",
      borderRadius: "0.75rem",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
    },
    title: {
      fontSize: "1.75rem",
      fontWeight: "bold",
      marginBottom: "1.5rem",
      borderBottom: "1px solid #664838",
      paddingBottom: "0.75rem",
      
    },
    fieldGroup: {
      marginBottom: "1rem",
      
    },
    label: {
      display: "block",
      fontSize: "0.9rem",
      fontWeight: 800,
       color: "black",
      marginBottom: "0.5rem",
    },
    input: {
      width: "100%",
      padding: "0.6rem",
      borderRadius: "0.375rem",
      border: "1px solid #d2bab0",
      backgroundColor: "#fff",
      color: "#111827",
      fontSize: "0.9rem",
    },
    error: {
      fontSize: "0.8rem",
      color: "#f87171",
      marginTop: "0.25rem",
    },
    button: {
      marginTop: "1.5rem",
      padding: "0.75rem 1.25rem",
      backgroundColor: "#846358",
      color: "white",
      fontWeight: 600,
      borderRadius: "0.5rem",
      border: "none",
      cursor: "pointer",
    },
    buttonDisabled: {
      opacity: 0.6,
      cursor: "not-allowed",
    },
  };

  if (loading) return <div style={styles.container}>Loading billing information...</div>;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Billing Information</h2>

      {[
        { label: "Full Name", key: "fullName" },
        { label: "Company Name", key: "companyName" },
        { label: "Email", key: "email" },
        { label: "Address", key: "address" },
        { label: "City", key: "city" },
        { label: "State/Region", key: "stateRegion" },
        { label: "Country", key: "country" },
        { label: "Postal Code", key: "postalCode" },
        { label: "Tax ID", key: "taxId" },
      ].map((field) => (
        <div key={field.key} style={styles.fieldGroup}>
          <label style={styles.label}>{field.label}</label>
          <input
            style={styles.input}
            value={formData[field.key]}
            onChange={(e) => handleChange(field.key, e.target.value)}
            placeholder={`Enter ${field.label}`}
          />
          {errors[field.key] && <div style={styles.error}>{errors[field.key]}</div>}
        </div>
      ))}

      <button
        style={{ ...styles.button, ...(saving ? styles.buttonDisabled : {}) }}
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save Billing Info"}
      </button>
    </div>
  );
};

export default BillingInformation;