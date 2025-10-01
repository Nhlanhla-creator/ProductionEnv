"use client"
import React from "react"
import FormField from "./FormField"
import styles from "./catalyst-universal-profile.module.css"

const legalEntityTypes = [
  { value: "pty_ltd", label: "Private Company (Pty Ltd)" },
  { value: "ltd", label: "Public Company (Ltd)" },
  { value: "partnership", label: "Partnership" },
  { value: "sole_proprietorship", label: "Sole Proprietorship" },
]

const companySizes = [
  { value: "large_enterprise", label: "Large Enterprise" },
  { value: "medium_enterprise", label: "Medium Enterprise" },
  { value: "multinational", label: "Multinational" },
]

const industrySectors = [
  { value: "accounting_finance", label: "Accounting / Finance" },
  { value: "advertising_marketing_pr", label: "Advertising / Marketing / PR" },
  { value: "agriculture_forestry_fishing", label: "Agriculture / Forestry / Fishing" },
  { value: "automotive_motor_industry", label: "Automotive / Motor Industry" },
  { value: "banking_insurance_investments", label: "Banking / Insurance / Investments" },
  { value: "call_centre_customer_service", label: "Call Centre / Customer Service" },
  { value: "construction_building_civils", label: "Construction / Building / Civils" },
  { value: "consulting_business_services", label: "Consulting / Business Services" },
  { value: "education_training_teaching", label: "Education / Training / Teaching" },
  { value: "engineering", label: "Engineering (Civil, Mechanical, Electrical,)" },
  { value: "government_public_sector", label: "Government / Public Sector" },
  { value: "healthcare_nursing_medical", label: "Healthcare / Nursing / Medical" },
  { value: "hospitality_hotel_catering", label: "Hospitality / Hotel / Catering" },
  { value: "human_resources_recruitment", label: "Human Resources / Recruitment" },
  { value: "ict_information_technology", label: "ICT / Information Technology" },
  { value: "legal_law", label: "Legal / Law" },
  { value: "logistics_transport_supply_chain", label: "Logistics / Transport / Supply Chain" },
  { value: "manufacturing_production", label: "Manufacturing / Production" },
  { value: "media_journalism_publishing", label: "Media / Journalism / Publishing" },
  { value: "mining_energy_oil_gas", label: "Mining / Energy / Oil & Gas" },
  { value: "ngo_nonprofit_community", label: "NGO / Non-Profit / Community Services" },
  { value: "real_estate_property", label: "Real Estate / Property" },
  { value: "retail_wholesale_sales", label: "Retail / Wholesale / Sales" },
  { value: "science_research_development", label: "Science / Research / Development" },
  { value: "security_emergency_services", label: "Security / Emergency Services" },
  { value: "telecommunications", label: "Telecommunications" },
  { value: "tourism_travel_leisure", label: "Tourism / Travel / Leisure" },
  { value: "trades_artisans_technical", label: "Trades / Artisans / Technical" },
  { value: "utilities_water_electricity", label: "Utilities / Water / Electricity" },
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