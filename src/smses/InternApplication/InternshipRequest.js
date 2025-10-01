"use client"

import { useState, useEffect } from "react"
import { User } from "lucide-react"
import FormField from "./FormField"
import styles from "../../catalyst/CatalystUniversalProfile/catalyst-universal-profile.module.css"

const InternshipRequest = ({ data, updateData }) => {
  const [formData, setFormData] = useState({
    numberOfInterns: data?.numberOfInterns || "",
    internRoles: data?.internRoles || [],
    locationFlexibility: data?.locationFlexibility || [],
    hoursPerWeek: data?.hoursPerWeek || "",
    startDate: data?.startDate || "",
    duration: data?.duration || "",
    stipendOffered: data?.stipendOffered || "No",
    stipendAmount: data?.stipendAmount || "",
    equityOrIncentives: data?.equityOrIncentives || "",
    reportingDepartment: data?.reportingDepartment || "",
    workDescription: data?.workDescription || "",
    canRotate: data?.canRotate || "No",
    ...data,
  })

  const [errors, setErrors] = useState({})

  // Predefined intern roles
  const internRoleOptions = [
    "",
    "Data Science",
    "IT Support",
    "Software Development",
    "Marketing",
    "Human Resources",
    "Finance",
    "Admin",
    "Business Analysis",
    "Graphic Design",
    "Content Writing",
    "Social Media Management",
    "Customer Service",
    "Sales",
    "Research",
    "Project Management",
    "Quality Assurance",
    "Operations",
    "Legal",
    "Engineering",
    "Accounting",
    "Other"
  ]

  // Update intern roles array when number of interns changes
  useEffect(() => {
    const numInterns = parseInt(formData.numberOfInterns) || 0
    const currentRoles = formData.internRoles || []
    
    if (numInterns > 0 && currentRoles.length !== numInterns) {
      const newRoles = Array(numInterns).fill(null).map((_, index) => ({
        role: currentRoles[index]?.role || "",
        customRole: currentRoles[index]?.customRole || ""
      }))
      
      handleChange("internRoles", newRoles)
    } else if (numInterns === 0) {
      handleChange("internRoles", [])
    }
  }, [formData.numberOfInterns])

  const handleChange = (field, value) => {
    const updatedData = { ...formData, [field]: value }
    setFormData(updatedData)
    updateData(updatedData)
    
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleRoleChange = (index, field, value) => {
    const updatedRoles = [...(formData.internRoles || [])]
    updatedRoles[index] = {
      ...updatedRoles[index],
      [field]: value
    }
    
    // Clear custom role if not "Other"
    if (field === 'role' && value !== 'Other') {
      updatedRoles[index].customRole = ""
    }
    
    handleChange("internRoles", updatedRoles)
  }

  const handleLocationFlexibilityChange = (option) => {
    const currentSelections = formData.locationFlexibility || []
    let updatedSelections
    
    if (currentSelections.includes(option)) {
      updatedSelections = currentSelections.filter(item => item !== option)
    } else {
      updatedSelections = [...currentSelections, option]
    }
    
    handleChange("locationFlexibility", updatedSelections)
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.numberOfInterns) newErrors.numberOfInterns = "Required"
    if (!formData.locationFlexibility.length) newErrors.locationFlexibility = "Please select at least one option"
    if (!formData.hoursPerWeek) newErrors.hoursPerWeek = "Required"
    if (!formData.startDate) newErrors.startDate = "Required"
    if (!formData.duration) newErrors.duration = "Required"
    if (!formData.workDescription.trim()) newErrors.workDescription = "Required"

    // Validate intern roles
    const numInterns = parseInt(formData.numberOfInterns) || 0
    if (numInterns > 0) {
      const roles = formData.internRoles || []
      for (let i = 0; i < numInterns; i++) {
        if (!roles[i]?.role) {
          newErrors[`internRole_${i}`] = "Required"
        }
        if (roles[i]?.role === "Other" && !roles[i]?.customRole?.trim()) {
          newErrors[`customRole_${i}`] = "Required"
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const hoursOptions = ["", "10–20 hours per week", "20–30 hours per week", "30+ hours per week"]
  const durationOptions = ["", "1 month", "2 months", "3 months", "4 months", "5 months", "6 months", "6+ months"]
  const yesNoOptions = ["Yes", "No"]
  const locationOptions = ["In-person", "Remote", "Hybrid", "All"]

  const numInterns = parseInt(formData.numberOfInterns) || 0

  return (
    <div className={styles.sectionContainer}>
      <div className={styles.sectionHeader}>
        <div className={styles.headerIcon}>
          <User size={24} />
        </div>
        <div className={styles.headerContent}>
          <h2 className={styles.sectionTitle}>Internship Request</h2>
          <p className={styles.sectionDescription}>Provide details about your internship opportunity</p>
        </div>
      </div>

      <div className={styles.formContent}>
        <div className={styles.formSection}>
          {/* Grid Group 1 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "20px",
              width: "100%",
              marginBottom: "20px"
            }}
          >
            <div>
              <FormField
                label="Number of Interns Required"
                type="number"
                value={formData.numberOfInterns}
                onChange={(val) => handleChange("numberOfInterns", val)}
                placeholder="e.g., 2"
                required
                error={errors.numberOfInterns}
                min="1"
                max="20"
              />

              <FormField
                label="Weekly Hours / Time Commitment"
                type="dropdown"
                options={hoursOptions}
                value={formData.hoursPerWeek}
                onChange={(val) => handleChange("hoursPerWeek", val)}
                required
                error={errors.hoursPerWeek}
              />
            </div>

            <div>
              {/* Location Flexibility Section */}
              <div style={{ marginBottom: "20px" }}>
                <h3 className={styles.subSectionTitle} style={{ marginBottom: "10px" }}>
                  Location Flexibility *
                </h3>
                <div 
                  style={{ 
                    display: "flex", 
                    gap: "20px", 
                    flexWrap: "wrap",
                    alignItems: "center"
                  }}
                >
                  {locationOptions.map((option) => (
                    <label 
                      key={option}
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "8px",
                        cursor: "pointer",
                        fontSize: "14px"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.locationFlexibility?.includes(option) || false}
                        onChange={() => handleLocationFlexibilityChange(option)}
                        style={{
                          width: "18px",
                          height: "18px",
                          accentColor: "#a67c52"
                        }}
                      />
                      {option}
                    </label>
                  ))}
                </div>
                {errors.locationFlexibility && (
                  <div style={{ 
                    color: "#ef4444", 
                    fontSize: "12px", 
                    marginTop: "4px" 
                  }}>
                    {errors.locationFlexibility}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Individual Intern Roles Section */}
          {numInterns > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h3 className={styles.subSectionTitle} style={{ marginBottom: "15px" }}>
                Specify Role for Each Intern *
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: numInterns === 1 ? "1fr" : "repeat(2, 1fr)",
                  gap: "15px",
                  width: "100%"
                }}
              >
                {Array(numInterns).fill(null).map((_, index) => (
                  <div key={index} style={{ 
                    border: "1px solid #e5e7eb", 
                    borderRadius: "8px", 
                    padding: "15px",
                    backgroundColor: "#f9fafb"
                  }}>
                    <h4 style={{ 
                      margin: "0 0 10px 0", 
                      fontSize: "14px", 
                      fontWeight: "600",
                      color: "#374151"
                    }}>
                      Intern #{index + 1}
                    </h4>
                    
                    <div style={{ marginBottom: "10px" }}>
                      <label style={{ 
                        display: "block", 
                        marginBottom: "5px", 
                        fontSize: "13px",
                        fontWeight: "500"
                      }}>
                        Role *
                      </label>
                      <select
                        value={formData.internRoles?.[index]?.role || ""}
                        onChange={(e) => handleRoleChange(index, 'role', e.target.value)}
                        className={styles.formInput}
                        style={{ fontSize: "14px" }}
                      >
                        {internRoleOptions.map((role) => (
                          <option key={role} value={role}>
                            {role || "Select role"}
                          </option>
                        ))}
                      </select>
                      {errors[`internRole_${index}`] && (
                        <div style={{ 
                          color: "#ef4444", 
                          fontSize: "12px", 
                          marginTop: "4px" 
                        }}>
                          {errors[`internRole_${index}`]}
                        </div>
                      )}
                    </div>

                    {formData.internRoles?.[index]?.role === "Other" && (
                      <div>
                        <label style={{ 
                          display: "block", 
                          marginBottom: "5px", 
                          fontSize: "13px",
                          fontWeight: "500"
                        }}>
                          Specify Role *
                        </label>
                        <input
                          type="text"
                          value={formData.internRoles?.[index]?.customRole || ""}
                          onChange={(e) => handleRoleChange(index, 'customRole', e.target.value)}
                          className={styles.formInput}
                          placeholder="Enter custom role"
                          style={{ fontSize: "14px" }}
                        />
                        {errors[`customRole_${index}`] && (
                          <div style={{ 
                            color: "#ef4444", 
                            fontSize: "12px", 
                            marginTop: "4px" 
                          }}>
                            {errors[`customRole_${index}`]}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grid Group 2 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "20px",
              width: "100%",
              marginBottom: "20px"
            }}
          >
            <div>
              <FormField
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(val) => handleChange("startDate", val)}
                required
                error={errors.startDate}
              />

              <FormField
                label="Stipend Offered"
                type="dropdown"
                options={["", ...yesNoOptions]}
                value={formData.stipendOffered}
                onChange={(val) => handleChange("stipendOffered", val)}
                required
              />
            </div>

            <div>
              <FormField
                label="Duration"
                type="dropdown"
                options={durationOptions}
                value={formData.duration}
                onChange={(val) => handleChange("duration", val)}
                required
                error={errors.duration}
              />

              {formData.stipendOffered === "Yes" && (
                <FormField
                  label="Stipend Amount (ZAR per month)"
                  type="number"
                  value={formData.stipendAmount}
                  onChange={(val) => handleChange("stipendAmount", val)}
                  placeholder="e.g., 5000"
                />
              )}
            </div>
          </div>

          {/* Grid Group 3 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "20px",
              width: "100%",
              marginBottom: "20px"
            }}
          >
            <div>
              <FormField
                label="Equity Offering or Other Incentives"
                type="text"
                value={formData.equityOrIncentives}
                onChange={(val) => handleChange("equityOrIncentives", val)}
                placeholder="e.g., Performance bonus, certificate, etc."
              />
            </div>

            <div>
              <FormField
                label="Department / Manager Intern Will Report To"
                type="text"
                value={formData.reportingDepartment}
                onChange={(val) => handleChange("reportingDepartment", val)}
                placeholder="e.g., HR Manager, Finance Team Lead"
              />
            </div>
          </div>

          {/* Grid Group 4 — WORK DESCRIPTION + ROTATE */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "20px",
              width: "100%",
            }}
          >
           

            <div>
              <FormField
                label="Can Intern Rotate Between Roles/Departments?"
                type="dropdown"
                options={["", ...yesNoOptions]}
                value={formData.canRotate}
                onChange={(val) => handleChange("canRotate", val)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InternshipRequest