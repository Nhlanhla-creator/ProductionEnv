"use client"
// Removed 'import type React from "react"'
import { useEffect } from "react"
import { Plus, Trash2 } from "lucide-react"
import FormField from "./FormField" // Added import for FormField
import styles from "./catalyst-universal-profile.module.css" // Kept this one, removed duplicate

// Program Target Beneficiaries options
const programTargetBeneficiariesOptions = [
  { value: "early_stage_entrepreneurs", label: "Early-Stage Entrepreneurs" },
  { value: "women_entrepreneurs", label: "Women Entrepreneurs" },
  { value: "youth_entrepreneurs", label: "Youth Entrepreneurs (18-35)" },
  { value: "rural_entrepreneurs", label: "Rural Entrepreneurs" },
  { value: "tech_startups", label: "Tech Startups" },
  { value: "social_enterprises", label: "Social Enterprises" },
  { value: "smes", label: "Small & Medium Enterprises (SMEs)" },
  { value: "cooperatives", label: "Cooperatives" },
  { value: "previously_disadvantaged", label: "Previously Disadvantaged Individuals" },
  { value: "mixed", label: "Mixed Target Groups" },
]

// Program Structure options
const programStructureOptions = [
   { value: "Any", label: "Any" },
  { value: "Venture Capital", label: "Venture Capital" },
  { value: "Angel Investment", label: "Angel Investment" },
  { value: "Private Equity", label: "Private Equity" },
  { value: "Government Fund", label: "Government Fund" },
  { value: "Grant / Non-Profit", label: "Grant / Non-Profit" },
  { value: "Development Finance", label: "Development Finance" },
  { value: "Corporate Investment", label: "Corporate Investment" },
  { value: "Other (specify)", label: "Other (specify)" },
]

// Program Legal Structure options
const programLegalStructureOptions = [
  { value: "npc", label: "Non-Profit Company (NPC)" },
  { value: "pty_ltd", label: "Private Company (Pty) Ltd" },
  { value: "trust", label: "Trust" },
  { value: "government_entity", label: "Government Entity" },
  { value: "university_program", label: "University Program" },
  { value: "international_org", label: "International Organization" },
  { value: "other", label: "Other (Specify)" },
]

// Program Budget options
const programBudgetOptions = [
  { value: "micro", label: "Micro (<R1M)" },
  { value: "small", label: "Small (R1M–R10M)" },
  { value: "medium", label: "Medium (R10M–R50M)" },
  { value: "large", label: "Large (>R50M)" },
]

// Business Stage options
const businessStageOptions = [
  { value: "early_pre_seed", label: "Pre-seed" },
  { value: "early_seed", label: " Seed" },
  { value: "venture_series_a", label: "Series A" },
  { value: "venture_series_b", label: "Series B" },
  { value: "venture_series_c", label: "Series C+" },
  { value: "late_growth_pe", label: "Growth/PE" },
  { value: "late_mbo", label: "MBO" },
  { value: "late_mbi", label: "MBI" },
  { value: "late_lbo", label: "LBO" },
]

// Default empty program template
const emptyProgram = {
  name: "",
  budget: "",
  // Structural/organizational details
  targetBeneficiaries: [],
  governmentBacked: false,
  fundingSources: "",
  programStructure: "",
  programLegalStructure: "",
  programLegalStructureOther: "",
  // Program sizing metrics
  programBudgetCategory: "",
  averageSupportAmount: "",
  minimumSupport: "",
  maximumSupport: "",
  providesFollowUp: false,
  followUpPercentage: "",
  continuedSupport: false,
  // Business stage
  businessStage: "",
}

// Renamed component from OwnershipManagement to CatalystProgramDetails
export default function CatalystProgramDetails({ data = {}, updateData }) {
  // Initialize with at least one program by default
  useEffect(() => {
    if (!data.programs || data.programs.length === 0) {
      updateData({
        programs: [{ ...emptyProgram }],
      })
    }
  }, [data, updateData])

  const handleChange = (e) => {
    const { name, value } = e.target
    updateData({ [name]: value })
  }

  const addProgram = () => {
    const programs = data.programs || []
    updateData({
      programs: [...programs, { ...emptyProgram }],
    })
  }

  const updateProgram = (index, field, value) => {
    const programs = [...(data.programs || [])]
    programs[index] = {
      ...programs[index],
      [field]: value,
    }
    updateData({ programs })
  }

  const removeProgram = (index) => {
    const programs = [...(data.programs || [])]
    programs.splice(index, 1)
    updateData({ programs })
  }

  // Checkbox styling
  const checkboxStyle = {
    width: "16px",
    height: "16px",
    accentColor: "#8b4513",
    marginRight: "8px",
    cursor: "pointer",
  }

  const checkboxLabelStyle = {
    display: "flex",
    alignItems: "center",
    fontSize: "14px",
    color: "#5d4037",
    fontWeight: "500",
    cursor: "pointer",
    marginBottom: "4px",
  }

  return (
    <div className={`${styles.productApplicationContainer} ${styles.productServiceTop}`}>
      <h2 className={styles.productApplicationHeading}>Support Program Details</h2>
      <div className={styles.investorSection}>
        <div className={styles.sectionHeader}>
          <button type="button" onClick={addProgram} className={styles.addButton}>
            <Plus className={styles.icon} /> Add Program
          </button>
        </div>
        {(data.programs || []).map((program, programIndex) => (
          <div key={programIndex} className={styles.fundCard}>
            <div className={styles.fundHeader}>
              <h5 className={styles.fundTitle}>Program {programIndex + 1}</h5>
              {(data.programs || []).length > 1 && (
                <button type="button" onClick={() => removeProgram(programIndex)} className={styles.deleteButton}>
                  <Trash2 className={styles.icon} />
                </button>
              )}
            </div>

            {/* Program Name and Budget */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <FormField label="Program Name">
                <input
                  type="text"
                  value={program.name || ""}
                  onChange={(e) => updateProgram(programIndex, "name", e.target.value)}
                  className={styles.formInput}
                  placeholder="Enter program name"
                  required
                />
              </FormField>
              <FormField label="Program Budget">
                <input
                  type="text"
                  value={program.budget || ""}
                  onChange={(e) => {
                    let value = e.target.value.replace(/[^\d]/g, "")
                    if (value) value = "R" + value.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    updateProgram(programIndex, "budget", value)
                  }}
                  className={styles.formInput}
                  placeholder="R10,000,000"
                  required
                />
              </FormField>
            </div>

            {/* Target Beneficiaries - Checkboxes */}
            <div style={{ marginBottom: "1.5rem" }}>
              <FormField label="Target Beneficiaries">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "8px",
                    padding: "12px",
                    border: "1px solid #d2b48c",
                    borderRadius: "6px",
                    backgroundColor: "#fafafa",
                  }}
                >
                  {programTargetBeneficiariesOptions.map(({ value, label }) => (
                    <label key={value} style={checkboxLabelStyle}>
                      <input
                        type="checkbox"
                        checked={(program.targetBeneficiaries || []).includes(value)}
                        onChange={(e) => {
                          const currentBeneficiaries = program.targetBeneficiaries || []
                          const newBeneficiaries = e.target.checked
                            ? [...currentBeneficiaries, value]
                            : currentBeneficiaries.filter((item) => item !== value)
                          updateProgram(programIndex, "targetBeneficiaries", newBeneficiaries)
                        }}
                        style={checkboxStyle}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </FormField>
            </div>

            {/* Program Structure and Program Legal Structure */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <FormField label="Program Structure">
                <select
                  value={program.programStructure || ""}
                  onChange={(e) => updateProgram(programIndex, "programStructure", e.target.value)}
                  className={styles.formInput}
                  required
                >
                  <option value="">Select</option>
                  {programStructureOptions.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Program Legal Structure (Optional)">
                <select
                  value={program.programLegalStructure || ""}
                  onChange={(e) => updateProgram(programIndex, "programLegalStructure", e.target.value)}
                  className={styles.formInput}
                >
                  <option value="">Select</option>
                  {programLegalStructureOptions.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                {program.programLegalStructure === "other" && (
                  <input
                    type="text"
                    value={program.programLegalStructureOther || ""}
                    onChange={(e) => updateProgram(programIndex, "programLegalStructureOther", e.target.value)}
                    className={styles.formInput}
                    placeholder="Please specify legal structure"
                    style={{ marginTop: "8px" }}
                  />
                )}
              </FormField>
            </div>

            {/* Government Backed Checkbox */}
            <div style={{ marginBottom: "1rem" }}>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={program.governmentBacked || false}
                  onChange={(e) => updateProgram(programIndex, "governmentBacked", e.target.checked)}
                  style={checkboxStyle}
                />
                Government Backed? (If supported by government entity)
              </label>
            </div>

            {/* Funding Sources */}
            <div style={{ marginBottom: "1.5rem" }}>
              <FormField label="Funding Sources">
                <input
                  type="text"
                  value={program.fundingSources || ""}
                  onChange={(e) => updateProgram(programIndex, "fundingSources", e.target.value)}
                  className={styles.formInput}
                  placeholder='E.g., "60% Government, 30% Private Donors, 10% Corporate"'
                  style={{ width: "100%", maxWidth: "400px" }}
                />
              </FormField>
            </div>

            {/* Support Details Section */}
            <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid #e5e7eb" }}>
              <h5 style={{ fontSize: "1.1rem", fontWeight: "600", color: "#5d4037", marginBottom: "1rem" }}>
                Support Details (Optional)
              </h5>

              {/* Business Stage and Program Budget Category */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                <FormField label="Target Business Stage" required>
                  <select
                    value={program.businessStage || ""}
                    onChange={(e) => updateProgram(programIndex, "businessStage", e.target.value)}
                    className={styles.formInput}
                    required
                  >
                    <option value="">Select</option>
                    {businessStageOptions.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Program Budget Category">
                  <select
                    value={program.programBudgetCategory || ""}
                    onChange={(e) => updateProgram(programIndex, "programBudgetCategory", e.target.value)}
                    className={styles.formInput}
                  >
                    <option value="">Select</option>
                    {programBudgetOptions.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              {/* Average Support Amount, Minimum Support, Maximum Support */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                <FormField label="Average Support Amount" required>
                  <input
                    type="text"
                    value={program.averageSupportAmount || ""}
                    onChange={(e) => {
                      let value = e.target.value.replace(/[^\d]/g, "")
                      if (value) value = "R" + value.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      updateProgram(programIndex, "averageSupportAmount", value)
                    }}
                    className={styles.formInput}
                    placeholder="R100,000"
                    required
                  />
                </FormField>
                <FormField label="Minimum Support" required>
                  <input
                    type="text"
                    value={program.minimumSupport || ""}
                    onChange={(e) => {
                      let value = e.target.value.replace(/[^\d]/g, "")
                      if (value) value = "R" + value.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      updateProgram(programIndex, "minimumSupport", value)
                    }}
                    className={styles.formInput}
                    placeholder="R10,000"
                    required
                  />
                </FormField>
                <FormField label="Maximum Support" required>
                  <input
                    type="text"
                    value={program.maximumSupport || ""}
                    onChange={(e) => {
                      let value = e.target.value.replace(/[^\d]/g, "")
                      if (value) value = "R" + value.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      updateProgram(programIndex, "maximumSupport", value)
                    }}
                    className={styles.formInput}
                    placeholder="R1,000,000"
                    required
                  />
                </FormField>
              </div>

              {/* Checkbox options */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={checkboxLabelStyle}>
                    <input
                      type="checkbox"
                      checked={program.providesFollowUp || false}
                      onChange={(e) => updateProgram(programIndex, "providesFollowUp", e.target.checked)}
                      style={checkboxStyle}
                    />
                    Provides Follow-Up Support?
                  </label>
                  {program.providesFollowUp && (
                    <div style={{ display: "flex", alignItems: "center", marginTop: "8px" }}>
                      <span style={{ fontSize: "14px", color: "#5d4037", marginRight: "8px" }}>Budget allocated:</span>
                      <input
                        type="number"
                        value={program.followUpPercentage || ""}
                        onChange={(e) => updateProgram(programIndex, "followUpPercentage", e.target.value)}
                        className={styles.formInput}
                        placeholder="25"
                        style={{ width: "80px", marginRight: "4px" }}
                      />
                      <span style={{ fontSize: "14px", color: "#5d4037" }}>%</span>
                    </div>
                  )}
                </div>
                <div>
                  <label style={checkboxLabelStyle}>
                    <input
                      type="checkbox"
                      checked={program.continuedSupport || false}
                      onChange={(e) => updateProgram(programIndex, "continuedSupport", e.target.checked)}
                      style={checkboxStyle}
                    />
                    Continued Support Rights? (For ongoing assistance)
                  </label>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
