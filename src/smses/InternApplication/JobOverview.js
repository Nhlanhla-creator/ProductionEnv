"use client"

import { useState } from "react"
import { Briefcase } from "lucide-react"
import FormField from "./FormField"
import styles from "../../catalyst/CatalystUniversalProfile/catalyst-universal-profile.module.css"

// Comprehensive South African departments/functions
const departmentOptions = [
  "",
  // Core Business Functions
  "Accounting & Finance",
  "Human Resources (HR)",
  "Information Technology (IT)",
  "Marketing & Communications",
  "Sales & Business Development", 
  "Operations & Logistics",
  "Administration & Office Management",
  "Legal & Compliance",
  "Procurement & Supply Chain",
  "Customer Service & Support",
  
  // Industry-Specific Departments
  "Mining & Extractives",
  "Manufacturing & Production",
  "Agriculture & Agribusiness",
  "Tourism & Hospitality",
  "Healthcare & Medical Services",
  "Education & Training",
  "Banking & Financial Services",
  "Insurance & Risk Management",
  "Real Estate & Property Management",
  "Retail & Consumer Goods",
  
  // Specialized Functions
  "Research & Development (R&D)",
  "Quality Assurance & Control",
  "Health, Safety & Environment (HSE)",
  "Project Management",
  "Business Analysis & Strategy",
  "Audit & Internal Controls",
  "Corporate Affairs & Public Relations",
  "Facilities Management",
  "Transport & Fleet Management",
  "Maintenance & Engineering",
  
  // Government/Public Sector
  "Public Administration",
  "Municipal Services",
  "Social Development",
  "Environmental Management",
  
  // Other
  "Other"
]

// South African provinces
const provinceOptions = [
  "Eastern Cape",
  "Free State", 
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape"
]

// Major South African cities (comprehensive list)
const cityOptions = [
  // Gauteng
  "Johannesburg",
  "Pretoria (Tshwane)",
  "Soweto",
  "Sandton",
  "Centurion",
  "Randburg",
  "Roodepoort",
  "Benoni",
  "Boksburg",
  "Germiston",
  "Kempton Park",
  "Springs",
  "Alberton",
  "Midrand",
  "Vanderbijlpark",
  "Vereeniging",
  "Krugersdorp",
  
  // Western Cape
  "Cape Town",
  "Stellenbosch",
  "Paarl",
  "Somerset West",
  "Bellville",
  "George",
  "Mossel Bay",
  "Oudtshoorn",
  "Worcester",
  "Hermanus",
  "Knysna",
  "Plettenberg Bay",
  "Swellendam",
  "Malmesbury",
  
  // KwaZulu-Natal
  "Durban",
  "Pietermaritzburg",
  "Newcastle",
  "Richards Bay",
  "Empangeni",
  "Pinetown",
  "Chatsworth",
  "Umlazi",
  "Port Shepstone",
  "Ladysmith",
  "Dundee",
  "Margate",
  
  // Eastern Cape
  "Port Elizabeth (Gqeberha)",
  "East London",
  "Uitenhage",
  "Despatch",
  "Grahamstown (Makhanda)",
  "King William's Town",
  "Mdantsane",
  "Butterworth",
  "Queenstown",
  
  // Free State
  "Bloemfontein",
  "Welkom",
  "Kroonstad",
  "Bethlehem",
  "Sasolburg",
  "Phuthaditjhaba",
  "Virginia",
  "Parys",
  
  // Limpopo
  "Polokwane",
  "Mokopane",
  "Thohoyandou",
  "Phalaborwa",
  "Musina",
  "Giyani",
  "Louis Trichardt (Makhado)",
  "Lebowakgomo",
  
  // Mpumalanga
  "Nelspruit (Mbombela)",
  "Witbank (eMalahleni)",
  "Secunda",
  "Standerton",
  "Middelburg",
  "Ermelo",
  "Bethal",
  "Barberton",
  "White River",
  
  // Northern Cape
  "Kimberley",
  "Upington",
  "Kuruman",
  "Port Nolloth",
  "De Aar",
  "Springbok",
  "Postmasburg",
  
  // North West
  "Mahikeng",
  "Klerksdorp",
  "Potchefstroom", 
  "Rustenburg",
  "Brits",
  "Vryburg",
  "Lichtenburg",
  "Zeerust"
]

const JobOverview = ({ data, updateData }) => {
  const [formData, setFormData] = useState({
    internshipTitle: data?.internshipTitle || "",
    department: data?.department || "",
    departmentOther: data?.departmentOther || "",
    provinces: data?.provinces || [],
    cities: data?.cities || [],
    briefDescription: data?.briefDescription || "",
    keyTasks: data?.keyTasks || "",
    learningOutcomes: data?.learningOutcomes || "",
    preferredSkills: data?.preferredSkills || [""],
    ...data,
  })

  const [errors, setErrors] = useState({})

  const handleInputChange = (field, value) => {
    const updatedData = { ...formData, [field]: value }
    setFormData(updatedData)
    updateData(updatedData)
    
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleMultiSelectChange = (field, option) => {
    const currentSelections = formData[field] || []
    let updatedSelections
    
    if (currentSelections.includes(option)) {
      updatedSelections = currentSelections.filter(item => item !== option)
    } else {
      updatedSelections = [...currentSelections, option]
    }
    
    handleInputChange(field, updatedSelections)
  }

  const handleArrayChange = (index, value) => {
    const updatedSkills = formData.preferredSkills.map((item, i) =>
      i === index ? value : item
    )
    const updatedData = { ...formData, preferredSkills: updatedSkills }
    setFormData(updatedData)
    updateData(updatedData)
  }

  const addSkill = () => {
    const updatedSkills = [...formData.preferredSkills, ""]
    const updatedData = { ...formData, preferredSkills: updatedSkills }
    setFormData(updatedData)
    updateData(updatedData)
  }

  const removeSkill = (index) => {
    if (formData.preferredSkills.length > 1) {
      const updatedSkills = formData.preferredSkills.filter((_, i) => i !== index)
      const updatedData = { ...formData, preferredSkills: updatedSkills }
      setFormData(updatedData)
      updateData(updatedData)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.internshipTitle.trim())
      newErrors.internshipTitle = "Title is required"
    if (!formData.department.trim())
      newErrors.department = "Department is required"
    if (!formData.provinces.length)
      newErrors.provinces = "At least one province is required"
    if (!formData.cities.length)
      newErrors.cities = "At least one city is required"
    if (!formData.briefDescription.trim())
      newErrors.briefDescription = "Brief description is required"
    if (!formData.keyTasks.trim())
      newErrors.keyTasks = "Key tasks are required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const MultiSelectField = ({ label, options, selectedValues, onChange, error, required }) => {
    const [isOpen, setIsOpen] = useState(false)
    
    return (
      <div style={{ marginBottom: "20px" }}>
        <label style={{
          display: "block",
          fontSize: "14px",
          fontWeight: "600",
          color: "#4a352f",
          marginBottom: "8px",
        }}>
          {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
        </label>
        
        {/* Dropdown Button */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          style={{
            border: "2px solid #e5e7eb",
            borderRadius: "8px",
            padding: "12px 16px",
            backgroundColor: "#ffffff",
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            minHeight: "48px",
            transition: "border-color 0.2s ease",
            borderColor: isOpen ? "#a67c52" : "#e5e7eb"
          }}
        >
          <div style={{ flex: 1 }}>
            {selectedValues && selectedValues.length > 0 ? (
              <div style={{ 
                display: "flex", 
                flexWrap: "wrap", 
                gap: "4px",
                alignItems: "center"
              }}>
                {selectedValues.slice(0, 3).map((value, index) => (
                  <span
                    key={index}
                    style={{
                      backgroundColor: "#f3f4f6",
                      color: "#5d4037",
                      padding: "2px 6px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      border: "1px solid #e5e7eb"
                    }}
                  >
                    {value}
                  </span>
                ))}
                {selectedValues.length > 3 && (
                  <span style={{
                    color: "#6b7280",
                    fontSize: "12px",
                    fontWeight: "500"
                  }}>
                    +{selectedValues.length - 3} more
                  </span>
                )}
              </div>
            ) : (
              <span style={{ color: "#9ca3af", fontSize: "14px" }}>
                Select {label.toLowerCase()}...
              </span>
            )}
          </div>
          
          {/* Dropdown Arrow */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            style={{
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
              color: "#6b7280"
            }}
          >
            <path 
              d="M6 9l6 6 6-6" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
        
        {/* Dropdown Content */}
        {isOpen && (
          <div style={{
            position: "absolute",
            zIndex: 1000,
            width: "calc(100% - 4px)",
            maxHeight: "200px",
            overflowY: "auto",
            backgroundColor: "#ffffff",
            border: "2px solid #a67c52",
            borderRadius: "8px",
            marginTop: "2px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
          }}>
            {options.map((option) => (
              <label 
                key={option}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  padding: "8px 12px",
                  borderBottom: "1px solid #f3f4f6",
                  transition: "background-color 0.1s ease"
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = "#f9fafb"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                onClick={(e) => {
                  e.stopPropagation()
                  onChange(option)
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedValues?.includes(option) || false}
                  onChange={() => {}} // Handled by label click
                  style={{
                    width: "16px",
                    height: "16px",
                    accentColor: "#a67c52"
                  }}
                />
                {option}
              </label>
            ))}
          </div>
        )}
        
        {/* Selection Summary */}
        {selectedValues && selectedValues.length > 0 && (
          <div style={{ 
            fontSize: "12px", 
            color: "#6b7280", 
            marginTop: "4px" 
          }}>
            {selectedValues.length} selected
          </div>
        )}
        
        {error && (
          <div style={{ 
            color: "#ef4444", 
            fontSize: "12px", 
            marginTop: "4px" 
          }}>
            {error}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={styles.sectionContainer}>
      <div className={styles.sectionHeader}>
        <div className={styles.headerIcon}>
          <Briefcase size={24} />
        </div>
        <div className={styles.headerContent}>
          <h2 className={styles.sectionTitle}>Internship Overview</h2>
          <p className={styles.sectionDescription}>Provide the core details about this internship opportunity</p>
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
            <div>
              <FormField
                label="Internship Title"
                type="text"
                value={formData.internshipTitle}
                onChange={(val) => handleInputChange("internshipTitle", val)}
                placeholder="e.g., Marketing Intern, Finance Support Assistant"
                required
                error={errors.internshipTitle}
              />

              <FormField
                label="Brief Description"
                type="textarea"
                value={formData.briefDescription}
                onChange={(val) => handleInputChange("briefDescription", val)}
                placeholder="e.g., Assist with reconciliations, data entry, and internal audit reporting"
                rows={3}
                required
                error={errors.briefDescription}
              />
            </div>

            <div style={{ position: "relative" }}>
              <FormField
                label="Department / Function"
                type="dropdown"
                options={departmentOptions}
                value={formData.department}
                onChange={(val) => handleInputChange("department", val)}
                required
                error={errors.department}
              />
              {formData.department === "Other" && (
                <FormField
                  label="Specify Other Department"
                  type="text"
                  value={formData.departmentOther}
                  onChange={(val) => handleInputChange("departmentOther", val)}
                  placeholder="Please specify the department"
                  required
                />
              )}

              <div style={{ position: "relative" }}>
                <MultiSelectField
                  label="Provinces"
                  options={provinceOptions}
                  selectedValues={formData.provinces}
                  onChange={(option) => handleMultiSelectChange("provinces", option)}
                  required
                  error={errors.provinces}
                />
              </div>

              <div style={{ position: "relative" }}>
                <MultiSelectField
                  label="Cities"
                  options={cityOptions}
                  selectedValues={formData.cities}
                  onChange={(option) => handleMultiSelectChange("cities", option)}
                  required
                  error={errors.cities}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "20px",
              width: "100%",
              marginTop: "20px"
            }}
          >
            <div>
              <FormField
                label="Key Tasks"
                type="textarea"
                value={formData.keyTasks}
                onChange={(val) => handleInputChange("keyTasks", val)}
                placeholder="e.g., Support admin, update CRM, attend weekly team calls"
                rows={4}
                required
                error={errors.keyTasks}
              />
            </div>

            <div>
              <FormField
                label="Learning Objectives / Outcomes"
                type="textarea"
                value={formData.learningOutcomes}
                onChange={(val) => handleInputChange("learningOutcomes", val)}
                placeholder="e.g., Exposure to project planning, budgeting, and operations"
                rows={4}
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "20px",
              width: "100%",
              marginTop: "20px"
            }}
          >
            <div>
              <div style={{ marginBottom: "10px" }}>
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}
                >
                  <h3 className={styles.subSectionTitle}>Preferred Skills / Tools</h3>
                  <button
                    type="button"
                    onClick={addSkill}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      background: "#a67c52",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "8px 12px",
                      cursor: "pointer",
                      fontSize: "14px"
                    }}
                  >
                    + Add Skill
                  </button>
                </div>

                {formData.preferredSkills.map((skill, index) => (
                  <div key={index} style={{ display: "flex", gap: "10px", marginBottom: "10px", alignItems: "end" }}>
                    <div style={{ flex: 1 }}>
                      <FormField
                        label={`Skill ${index + 1}`}
                        type="text"
                        value={skill}
                        onChange={(val) => handleArrayChange(index, val)}
                        placeholder="e.g., Excel, Canva, Google Workspace"
                      />
                    </div>
                    {formData.preferredSkills.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSkill(index)}
                        style={{
                          background: "#8b4513",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          padding: "8px",
                          cursor: "pointer",
                          height: "36px",
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JobOverview