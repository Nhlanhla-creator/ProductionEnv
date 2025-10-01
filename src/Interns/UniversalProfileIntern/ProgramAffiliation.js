"use client"

import { useState } from "react"
import { User } from "lucide-react"
import styles from "../../catalyst/CatalystUniversalProfile/catalyst-universal-profile.module.css"

const ProgramAffiliation = ({ data, updateData }) => {
  const [formData, setFormData] = useState({
    programType: data?.programType || "",
    sponsorName: data?.sponsorName || "",
    referenceCode: data?.referenceCode || "",
    fundingStatus: data?.fundingStatus || "",
    stipendAmount: data?.stipendAmount || "",
    sponsorContactName: data?.sponsorContactName || "",
    sponsorContactEmail: data?.sponsorContactEmail || "",
    requiresLogbook: data?.requiresLogbook || false,
    duration: data?.duration || "",
    locationLimit: data?.locationLimit || "",
    programStartDate: data?.programStartDate || "",
    customSponsorName: data?.customSponsorName || "", // For when "Other" is selected for sponsor
    customProgramType: data?.customProgramType || "", // For when "Other" is selected for program type
  })

  const programTypes = [
    "SETA program",
    "YES program", 
    "Graduate program",
    "Skills development",
    "Other"
  ]

  const fundingPrograms = [
    "YES",
    "MICT SETA",
    "Bank SETA",
    "Agri SETA",
    "CHIETA",
    "CETA",
    "CATHSSETA",
    "ETDP SETA",
    "EWSETA",
    "FP&M SETA",
    "FASSET",
    "HWSETA",
    "SASSETA",
    "LGSETA",
    "MERSETA",
    "MQA",
    "TETA",
    "Services SETA",
    "PSETA",
    "W&RSETA",
    "INSETA",
    "FoodBev SETA"
  ]

  const handleChange = (field, value) => {
    const updatedData = {
      ...formData,
      [field]: value,
    }
    setFormData(updatedData)
    updateData(updatedData)
  }

  const handleSponsorChange = (value) => {
    const updatedData = {
      ...formData,
      sponsorName: value,
      // Clear custom name if not "Other"
      customSponsorName: value === "Other" ? formData.customSponsorName : ""
    }
    setFormData(updatedData)
    updateData(updatedData)
  }

  const handleProgramTypeChange = (value) => {
    const updatedData = {
      ...formData,
      programType: value,
      // Clear custom program type if not "Other"
      customProgramType: value === "Other" ? formData.customProgramType : ""
    }
    setFormData(updatedData)
    updateData(updatedData)
  }

  return (
    <div className={styles.sectionContainer}>
      <div className={styles.sectionHeader}>
        <div className={styles.headerIcon}>
          <User size={24} />
        </div>
        <div className={styles.headerContent}>
          <h2 className={styles.sectionTitle}>Program Overview</h2>
          <p className={styles.sectionDescription}>Provide your internship or funding program details</p>
        </div>
      </div>

      <div className={styles.formContent}>
        <div className={styles.formSection}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "20px",
              width: "100%",
            }}
          >
            <div className={styles.formGroup}>
              <label>
                Program Type<span className={styles.required}>*</span>
              </label>
              <select
                value={formData.programType}
                onChange={(e) => handleProgramTypeChange(e.target.value)}
                className={styles.formInput}
              >
                <option value="">Select program type</option>
                {programTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Show custom input when "Other" is selected for program type */}
            {formData.programType === "Other" && (
              <div className={styles.formGroup}>
                <label>
                  Specify Other Program Type<span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.customProgramType}
                  onChange={(e) => handleChange("customProgramType", e.target.value)}
                  className={styles.formInput}
                  placeholder="Enter program type"
                />
              </div>
            )}

            <div className={styles.formGroup}>
              <label>
                Funding Program Name / Sponsor<span className={styles.required}>*</span>
              </label>
              <select
                value={formData.sponsorName}
                onChange={(e) => handleSponsorChange(e.target.value)}
                className={styles.formInput}
              >
                <option value="">Select funding program</option>
                {fundingPrograms.map((program) => (
                  <option key={program} value={program}>
                    {program}
                  </option>
                ))}
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Show custom input when "Other" is selected for sponsor */}
            {formData.sponsorName === "Other" && (
              <div className={styles.formGroup}>
                <label>
                  Specify Other Sponsor<span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.customSponsorName}
                  onChange={(e) => handleChange("customSponsorName", e.target.value)}
                  className={styles.formInput}
                  placeholder="Enter sponsor name"
                />
              </div>
            )}

            <div className={styles.formGroup}>
              <label>Program Reference Number or Code</label>
              <input
                type="text"
                value={formData.referenceCode}
                onChange={(e) => handleChange("referenceCode", e.target.value)}
                className={styles.formInput}
                placeholder="Optional tracking code"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>
                Funding Status<span className={styles.required}>*</span>
              </label>
              <select
                value={formData.fundingStatus}
                onChange={(e) => handleChange("fundingStatus", e.target.value)}
                className={styles.formInput}
              >
                <option value="">Select status</option>
                <option value="fully-funded">Fully Funded</option>
                <option value="partial-stipend">Partial Stipend</option>
                <option value="self-funded">Self-funded</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Monthly Stipend Amount (ZAR)</label>
              <input
                type="number"
                value={formData.stipendAmount}
                onChange={(e) => handleChange("stipendAmount", e.target.value)}
                className={styles.formInput}
                placeholder="e.g. 3500"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>Admin Contact at Sponsor</label>
              <input
                type="text"
                value={formData.sponsorContactName}
                onChange={(e) => handleChange("sponsorContactName", e.target.value)}
                className={styles.formInput}
                placeholder="Program Manager's Name"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Email of Sponsor Contact</label>
              <input
                type="email"
                value={formData.sponsorContactEmail}
                onChange={(e) => handleChange("sponsorContactEmail", e.target.value)}
                className={styles.formInput}
                placeholder="email@example.com"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>Duration Covered by Sponsor (months)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => handleChange("duration", e.target.value)}
                className={styles.formInput}
                placeholder="e.g. 6"
                min="1"
                max="60"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Program Start Date</label>
              <input
                type="date"
                value={formData.programStartDate}
                onChange={(e) => handleChange("programStartDate", e.target.value)}
                className={styles.formInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Location/Placement Limits</label>
              <input
                type="text"
                value={formData.locationLimit}
                onChange={(e) => handleChange("locationLimit", e.target.value)}
                className={styles.formInput}
                placeholder="e.g. Must be based in Limpopo"
              />
            </div>
            
            <div className={styles.formGroup} style={{ display: "flex", alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  checked={formData.requiresLogbook}
                  onChange={(e) => handleChange("requiresLogbook", e.target.checked)}
                />
                Required Reporting / Logbook
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProgramAffiliation