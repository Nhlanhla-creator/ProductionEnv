"use client"
import React from "react"
import FormField from "./FormField"
import styles from "./catalyst-universal-profile.module.css"

const legalEntityTypes = [
   { value: "(pty) Ltd", label: "(Pty) Ltd - Private Company" },
   { value: "Ltd", label: "Ltd - Public Company" },
   { value: "NPC", label: "NPC - Non-Profit Company" },
   { value: "Sole Proprietor", label: "Sole Proprietor" },
   { value: "Partnership", label: "Partnership" },
   { value: "CC", label: "CC - Close Corporation (Legacy)" },
   { value: "Trust", label: "Trust" },
   { value: "Cooperative", label: "Cooperative" },
   { value: "Joint Venture", label: "Joint Venture" },
   { value: "State Qwned", label: "State-Owned Enterprise" },
]

const companySizes = [
  { value: "large_enterprise", label: "Large Enterprise" },
  { value: "medium_enterprise", label: "Medium Enterprise" },
  { value: "multinational", label: "Multinational" },
]

const industrySectors = [
   { value: "Generalist", label: "Generalist" },
  { value: "Agriculture", label: "Agriculture" },
  { value: "Automotive", label: "Automotive" },
  { value: "Banking, Finance & Insurance", label: "Banking, Finance & Insurance" },
  { value: "Beauty / Cosmetics / Personal Care", label: "Beauty / Cosmetics / Personal Care" },
  { value: "Construction", label: "Construction" },
  { value: "Consulting", label: "Consulting" },
  { value: "Creative Arts / Design", label: "Creative Arts / Design" },
  { value: "Customer Service", label: "Customer Service" },
  { value: "Education & Training", label: "Education & Training" },
  { value: "Engineering", label: "Engineering" },
  { value: "Environmental / Natural Sciences", label: "Environmental / Natural Sciences" },
  { value: "Government / Public Sector", label: "Government / Public Sector" },
  { value: "Healthcare / Medical", label: "Healthcare / Medical" },
  { value: "Hospitality / Tourism", label: "Hospitality / Tourism" },
  { value: "Human Resources", label: "Human Resources" },
  { value: "Information Technology (IT)", label: "Information Technology (IT)" },
  { value: "Infrastructure", label: "Infrastructure" },
  { value: "Legal / Law", label: "Legal / Law" },
  { value: "Logistics / Supply Chain", label: "Logistics / Supply Chain" },
  { value: "Manufacturing", label: "Manufacturing" },
  { value: "Marketing / Advertising / PR", label: "Marketing / Advertising / PR" },
  { value: "Media / Journalism / Broadcasting", label: "Media / Journalism / Broadcasting" },
  { value: "Mining", label: "Mining" },
  { value: "Energy", label: "Energy" },
  { value: "Oil & Gas", label: "Oil & Gas" },
  { value: "Non-Profit / NGO", label: "Non-Profit / NGO" },
  { value: "Property / Real Estate", label: "Property / Real Estate" },
  { value: "Retail / Wholesale", label: "Retail / Wholesale" },
  { value: "Safety & Security / Police / Defence", label: "Safety & Security / Police / Defence" },
  { value: "Sales", label: "Sales" },
  { value: "Science & Research", label: "Science & Research" },
  { value: "Social Services / Social Work", label: "Social Services / Social Work" },
  { value: "Sports / Recreation / Fitness", label: "Sports / Recreation / Fitness" },
  { value: "Telecommunications", label: "Telecommunications" },
  { value: "Transport", label: "Transport" },
  { value: "Utilities (Water, Electricity, Waste)", label: "Utilities (Water, Electricity, Waste)" },
]

const referralSources = [
  { value: "google_search", label: "Google Search" },
  { value: "social_media", label: "Social Media" },
  { value: "referral", label: "Referral from Friend/Colleague" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "website", label: "Company Website" },
  { value: "advertisement", label: "Advertisement" },
  { value: "event", label: "Event/Conference" },
  { value: "other", label: "Other" },
]

export default function CatalystEntityOverview({ data = {}, updateData }) {
  const handleChange = (e) => {
    const { name, value } = e.target
    updateData({ [name]: value })
  }

  return (
    <div className={styles.productApplicationContainer}>
      <h2 className={styles.productApplicationHeading}>Entity Overview</h2>
      <div className={styles.formContent}>
        <div className={styles.gridContainer}>
          <FormField label="Registered Name" required>
            <input
              type="text"
              name="registeredName"
              value={data.registeredName || ""}
              onChange={handleChange}
              className={styles.formInput}
              required
            />
          </FormField>
          <FormField label="Trading Name (if different)">
            <input
              type="text"
              name="tradingName"
              value={data.tradingName || ""}
              onChange={handleChange}
              className={styles.formInput}
            />
          </FormField>
        </div>

        <div className={styles.gridContainer}>
          <FormField label="Legal Entity of Firm" required>
            <select
              name="legalEntityType"
              value={data.legalEntityType || ""}
              onChange={handleChange}
              className={styles.formSelect}
              required
            >
              <option value="">Select Legal Entity Type</option>
              {legalEntityTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Registration Number" required>
            <input
              type="text"
              name="registrationNumber"
              value={data.registrationNumber || ""}
              onChange={handleChange}
              className={styles.formInput}
              required
            />
          </FormField>
        </div>

        <div className={styles.gridContainer}>
          <FormField label="Industry Sector" required>
            <select
              name="industrySector"
              value={data.industrySector || ""}
              onChange={handleChange}
              className={styles.formSelect}
              required
            >
              <option value="">Select Industry Sector</option>
              {industrySectors.map((sector) => (
                <option key={sector.value} value={sector.value}>
                  {sector.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Company Size" required>
            <select
              name="companySize"
              value={data.companySize || ""}
              onChange={handleChange}
              className={styles.formSelect}
              required
            >
              <option value="">Select Company Size</option>
              {companySizes.map((size) => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div className={styles.gridContainer}>
          <FormField label="Year Established" required>
            <input
              type="number"
              name="yearEstablished"
              value={data.yearEstablished || ""}
              onChange={handleChange}
              className={styles.formInput}
              required
              min="1800"
              max={new Date().getFullYear()}
              placeholder="e.g. 2010"
            />
          </FormField>
          <FormField label="Website (URL)">
            <input
              type="url"
              name="website"
              value={data.website || ""}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="https://www.example.com"
            />
          </FormField>
        </div>

        <div className={styles.gridContainer}>
          <FormField label="Brief Description" required>
            <textarea
              name="briefDescription"
              value={data.briefDescription || ""}
              onChange={handleChange}
              className={`${styles.formTextarea} ${styles.small}`}
              rows={3}
              placeholder="Brief description of your business..."
              required
            />
          </FormField>
          <FormField label="How did you hear about us?" required>
            <select
              name="referralSource"
              value={data.referralSource || ""}
              onChange={handleChange}
              className={styles.formSelect}
              required
            >
              <option value="">Select how you heard about us</option>
              {referralSources.map((source) => (
                <option key={source.value} value={source.value}>
                  {source.label}
                </option>
              ))}
            </select>
            {data.referralSource === "other" && (
              <div style={{ marginTop: "8px" }}>
                <input
                  type="text"
                  name="referralSourceOther"
                  value={data.referralSourceOther || ""}
                  onChange={handleChange}
                  className={styles.formInput}
                  placeholder="Please specify..."
                  required
                />
              </div>
            )}
          </FormField>
        </div>
      </div>
    </div>
  )
}