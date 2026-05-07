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
  { value: "State Owned", label: "State-Owned Enterprise" },
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

// ── Industry Associations (single-select) ─────────────────────────────────
const industryAssociations = [
  { value: "SA Township Traders Association", label: "SA Township Traders Association" },
  { value: "Minerals Council South Africa", label: "Minerals Council South Africa" },
  { value: "Junior Mining Council (JEMD-linked)", label: "Junior Mining Council (JEMD-linked)" },
  { value: "Mandela Mining Precinct", label: "Mandela Mining Precinct" },
  { value: "African Chamber of Commerce and Industry", label: "African Chamber of Commerce and Industry" },
  { value: "Black Business Council", label: "Black Business Council" },
  { value: "South African Renewable Energy Council (SAREC)", label: "South African Renewable Energy Council (SAREC)" },
  { value: "SAPICS: Supply Chain Institute of Southern Africa", label: "SAPICS: Supply Chain Institute of Southern Africa" },
  { value: "Manufacturing Circle", label: "Manufacturing Circle" },
  { value: "Southern African Renewable Energy Council (SAWEA / SA-PVIA)", label: "Southern African Renewable Energy Council (SAWEA / SA-PVIA)" },
  { value: "South African Institute of Black Property Practitioners", label: "South African Institute of Black Property Practitioners" },
  { value: "ASASA / ASISA-linked industry groups", label: "ASASA / ASISA-linked industry groups" },
  { value: "South African Venture Capital and Private Equity Association (SAVCA)", label: "South African Venture Capital and Private Equity Association (SAVCA)" },
  { value: "ABSA Black Business Awards / ABSIP / BEE-linked networks", label: "ABSA Black Business Awards / ABSIP / BEE-linked networks" },
  { value: "SA SME Fund", label: "SA SME Fund" },
  { value: "Endeva (SA / global ESO-backed networks)", label: "Endeva (SA / global ESO-backed networks)" },
  { value: "SA Industrial Development Corporation (IDC)", label: "SA Industrial Development Corporation (IDC)" },
  { value: "SA Department of Trade, Industry and Competition (DTIC)", label: "SA Department of Trade, Industry and Competition (DTIC)" },
  { value: "SA Department of Mineral Resources and Energy (DMRE)", label: "SA Department of Mineral Resources and Energy (DMRE)" },
  { value: "SA Department of Employment and Labour (BEE-linked units)", label: "SA Department of Employment and Labour (BEE-linked units)" },
  { value: "SA National Business Initiative (NBI)", label: "SA National Business Initiative (NBI)" },
  { value: "Other", label: "Other" },
]

export default function AssociatorEntityOverview({ data = {}, updateData }) {
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
                <option key={type.value} value={type.value}>{type.label}</option>
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
                <option key={sector.value} value={sector.value}>{sector.label}</option>
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
                <option key={size.value} value={size.value}>{size.label}</option>
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
              placeholder="Brief description of your association..."
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
                <option key={source.value} value={source.value}>{source.label}</option>
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

        {/* ── INDUSTRY ASSOCIATIONS (single-select) ── */}
        <div style={{
          borderTop: "2px solid #C19A6B",
          marginTop: "1.75rem",
          paddingTop: "1.25rem",
          marginBottom: "1rem",
        }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#6B3410", margin: "0 0 1.25rem 0", letterSpacing: "0.3px" }}>
            Industry Associations
          </h3>
        </div>

        <div className={styles.gridContainer}>
          <FormField label="Which industry association are you part of?">
            <select
              name="industryAssociation"
              value={data.industryAssociation || ""}
              onChange={handleChange}
              className={styles.formSelect}
            >
              <option value="">Select an association...</option>
              {industryAssociations.map((assoc) => (
                <option key={assoc.value} value={assoc.value}>{assoc.label}</option>
              ))}
            </select>
            {data.industryAssociation === "Other" && (
              <div style={{ marginTop: "8px" }}>
                <input
                  type="text"
                  name="industryAssociationOther"
                  value={data.industryAssociationOther || ""}
                  onChange={handleChange}
                  className={styles.formInput}
                  placeholder="Please specify your association..."
                />
              </div>
            )}
          </FormField>
        </div>

      </div>
    </div>
  )
}