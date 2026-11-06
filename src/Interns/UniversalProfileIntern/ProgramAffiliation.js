"use client"

import { useState } from "react"
import { User, CreditCard, ShieldCheck } from "lucide-react"
import styles from "../../catalyst/CatalystUniversalProfile/catalyst-universal-profile.module.css"

const BANK_BRANCH_CODES = {
  "ABSA": "632005",
  "African Bank": "430000",
  "Capitec Bank": "470010",
  "Discovery Bank": "679000",
  "First National Bank (FNB)": "250655",
  "Investec": "580105",
  "Nedbank": "198765",
  "Standard Bank": "051001",
  "TymeBank": "678910",
}

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
    // Stipend Payout & Banking Details
    bankName: data?.bankName || "",
    customBankName: data?.customBankName || "",
    accountHolderName: data?.accountHolderName || "",
    accountType: data?.accountType || "",
    accountNumber: data?.accountNumber || "",
    branchCode: data?.branchCode || "",
    beneficiaryVerificationStatus: data?.beneficiaryVerificationStatus || "Pending Verification",
  })

  const programTypes = [
    "SETA program",
    "YES program",
    "Graduate program",
    "Skills development",
    "Other",
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
    "FoodBev SETA",
  ]

  const southAfricanBanks = [
    ...Object.keys(BANK_BRANCH_CODES),
    "Other",
  ]

  const accountTypes = [
    "Cheque / Current Account",
    "Savings Account",
    "Transmission Account",
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
      customSponsorName: value === "Other" ? formData.customSponsorName : "",
    }
    setFormData(updatedData)
    updateData(updatedData)
  }

  const handleProgramTypeChange = (value) => {
    const updatedData = {
      ...formData,
      programType: value,
      // Clear custom program type if not "Other"
      customProgramType: value === "Other" ? formData.customProgramType : "",
    }
    setFormData(updatedData)
    updateData(updatedData)
  }

  const handleBankChange = (value) => {
    const defaultBranch = BANK_BRANCH_CODES[value] || ""
    const isCurrentBranchUniversal =
      !formData.branchCode || Object.values(BANK_BRANCH_CODES).includes(formData.branchCode)

    const updatedData = {
      ...formData,
      bankName: value,
      customBankName: value === "Other" ? formData.customBankName : "",
      branchCode: value === "Other" ? (isCurrentBranchUniversal ? "" : formData.branchCode) : defaultBranch,
    }
    setFormData(updatedData)
    updateData(updatedData)
  }

  const verificationStatus = formData.beneficiaryVerificationStatus || "Pending Verification"
  const isVerified = verificationStatus.toLowerCase() === "verified"

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

        {/* Stipend Payout & Banking Details */}
        <div
          className={styles.sectionHeader}
          style={{ marginTop: "32px", paddingTop: "24px", borderTop: "1px solid #e6d7c3" }}
        >
          <div className={styles.headerIcon}>
            <CreditCard size={24} />
          </div>
          <div className={styles.headerContent}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                Stipend Payout & Banking Details
              </h2>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 10px",
                  borderRadius: "16px",
                  fontSize: "12px",
                  fontWeight: "600",
                  backgroundColor: isVerified ? "#e8f5e9" : "#fff8e1",
                  color: isVerified ? "#2e7d32" : "#b45309",
                  border: `1px solid ${isVerified ? "#a5d6a7" : "#ffe082"}`,
                }}
              >
                <ShieldCheck size={14} />
                {verificationStatus}
              </span>
            </div>
            <p className={styles.sectionDescription}>
              Provide your South African bank account details for monthly internship stipend disbursement. Please also
              upload your Proof of Bank Account in Required Documents.
            </p>
          </div>
        </div>

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
                Bank Name<span className={styles.required}>*</span>
              </label>
              <select
                value={formData.bankName}
                onChange={(e) => handleBankChange(e.target.value)}
                className={styles.formInput}
              >
                <option value="">Select bank</option>
                {southAfricanBanks.map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>
            </div>

            {formData.bankName === "Other" && (
              <div className={styles.formGroup}>
                <label>
                  Specify Other Bank Name<span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.customBankName}
                  onChange={(e) => handleChange("customBankName", e.target.value)}
                  className={styles.formInput}
                  placeholder="Enter bank name"
                />
              </div>
            )}

            <div className={styles.formGroup}>
              <label>
                Account Holder Name<span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                value={formData.accountHolderName}
                onChange={(e) => handleChange("accountHolderName", e.target.value)}
                className={styles.formInput}
                placeholder="Full name as registered with bank"
              />
            </div>

            <div className={styles.formGroup}>
              <label>
                Account Type<span className={styles.required}>*</span>
              </label>
              <select
                value={formData.accountType}
                onChange={(e) => handleChange("accountType", e.target.value)}
                className={styles.formInput}
              >
                <option value="">Select account type</option>
                {accountTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>
                Account Number<span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formData.accountNumber}
                onChange={(e) => handleChange("accountNumber", e.target.value.replace(/[^\d\s-]/g, ""))}
                className={styles.formInput}
                placeholder="Enter bank account number"
              />
            </div>

            <div className={styles.formGroup}>
              <label>
                Branch Code<span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formData.branchCode}
                onChange={(e) => handleChange("branchCode", e.target.value.replace(/[^\d-]/g, ""))}
                className={styles.formInput}
                placeholder="e.g. 250655"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProgramAffiliation
