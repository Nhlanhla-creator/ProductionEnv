"use client"
import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import FormField from "./FormField"

import styles from "./AdvisorProfile.module.css"

const yearsOfExperienceOptions = [
  { value: "less_than_5", label: "*<5" },
  { value: "5_to_10", label: "5-10" },
  { value: "10_to_20", label: "10-20" },
  { value: "20_plus", label: "20+*" },
]

const functionalExpertiseOptions = [
  { value: "finance", label: "Finance" },
  { value: "hr", label: "HR" },
  { value: "legal", label: "Legal" },
  { value: "strategy", label: "Strategy" },
  { value: "esg", label: "ESG" },
  { value: "tech", label: "Tech" },
  { value: "governance", label: "Governance" },
]

const industryExperienceOptions = [
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

const boardExperienceOptions = [
  { value: "none", label: "None" },
  { value: "advisory_board", label: "Advisory Board" },
  { value: "fiduciary_board", label: "Fiduciary Board" },
  { value: "chair", label: "Chair" },
]

const mentorshipExperienceOptions = [
  { value: "none", label: "None" },
  { value: "1_to_3_years", label: "1-3 years" },
  { value: "3_to_5_years", label: "3-5" },
  { value: "5_plus_years", label: "5+" },
]

const languagesOptions = [
  { value: "english", label: "English" },
  { value: "afrikaans", label: "Afrikaans" },
  { value: "zulu", label: "Zulu" },
  { value: "xhosa", label: "Xhosa" },
  { value: "sotho", label: "Sotho" },
  { value: "tswana", label: "Tswana" },
  { value: "french", label: "French" },
  { value: "portuguese", label: "Portuguese" },
  { value: "swahili", label: "Swahili" },
  { value: "arabic", label: "Arabic" },
]

const regionFamiliarityOptions = [
  { value: "africa_wide", label: "Africa-wide" },
  { value: "southern_africa", label: "Southern Africa" },
  { value: "east_africa", label: "East Africa" },
  { value: "west_africa", label: "West Africa" },
  { value: "north_africa", label: "North Africa" },
  { value: "gauteng", label: "Gauteng" },
  { value: "western_cape", label: "Western Cape" },
  { value: "kwazulu_natal", label: "KwaZulu-Natal" },
  { value: "eastern_cape", label: "Eastern Cape" },
  { value: "free_state", label: "Free State" },
  { value: "limpopo", label: "Limpopo" },
  { value: "mpumalanga", label: "Mpumalanga" },
  { value: "northern_cape", label: "Northern Cape" },
  { value: "north_west", label: "North West" },
]

// MultiSelectDropdown component
function MultiSelectDropdown({
  options,
  value = [],
  onChange,
  placeholder = "Select options",
  name,
  required = false,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState(value)
  const dropdownRef = useRef(null)

  useEffect(() => {
    setSelectedOptions(value)
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const toggleOption = (optionValue) => {
    let newSelectedOptions

    if (selectedOptions.includes(optionValue)) {
      newSelectedOptions = selectedOptions.filter((value) => value !== optionValue)
    } else {
      newSelectedOptions = [...selectedOptions, optionValue]
    }

    setSelectedOptions(newSelectedOptions)
    onChange(newSelectedOptions)
  }

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  const getSelectedLabels = () => {
    return options.filter((option) => selectedOptions.includes(option.value)).map((option) => option.label)
  }

  return (
    <div className={styles.multiSelectContainer} ref={dropdownRef}>
      <div className={styles.multiSelectHeader} onClick={toggleDropdown} aria-haspopup="listbox" aria-expanded={isOpen}>
        {selectedOptions.length > 0 ? (
          <div className={styles.selectedItems}>
            {getSelectedLabels().map((label) => (
              <span key={label} className={styles.selectedItem}>
                {label}
              </span>
            ))}
          </div>
        ) : (
          <span className={styles.placeholder}>{placeholder}</span>
        )}
        <ChevronDown size={16} />
      </div>

      {isOpen && (
        <div className={styles.multiSelectDropdown}>
          <div className={styles.multiSelectOptions} role="listbox">
            {options.map((option) => (
              <div
                key={option.value}
                className={`${styles.multiSelectOption} ${
                  selectedOptions.includes(option.value) ? styles.selected : ""
                }`}
                onClick={() => toggleOption(option.value)}
                role="option"
                aria-selected={selectedOptions.includes(option.value)}
              >
                <input
                  type="checkbox"
                  className={styles.multiSelectCheckbox}
                  checked={selectedOptions.includes(option.value)}
                  onChange={() => {}}
                  id={`${name}-${option.value}`}
                />
                <label htmlFor={`${name}-${option.value}`}>{option.label}</label>
              </div>
            ))}
          </div>
          <div className={styles.multiSelectActions}>
            <button type="button" className={styles.multiSelectButton} onClick={() => setIsOpen(false)}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* Hidden select for form submission */}
      <select
        name={name}
        multiple
        value={selectedOptions}
        onChange={() => {}}
        required={required}
        style={{ display: "none" }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function PersonalProfessionalOverview({ data = {}, updateData }) {
  const handleChange = (e) => {
    const { name, value } = e.target
    updateData({ [name]: value })
  }

  const handleBioChange = (e) => {
    const { value } = e.target
    const wordCount = value.trim().split(/\s+/).filter(word => word.length > 0).length
    
    // Limit to 200 words
    if (wordCount <= 200) {
      updateData({ briefBio: value })
    }
  }

  const getBioWordCount = () => {
    if (!data.briefBio) return 0
    return data.briefBio.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  return (
    <div className={styles.productApplicationContainer}>
      <h2 className={styles.productApplicationHeading}>Personal & Professional Overview</h2>
      <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
      
      </p>

      <div className={styles.formContent}>
        {/* 1. Personal & Professional Overview */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
          
          </h3>

          <div className={styles.gridContainer}>
        {/* <FormField label="Title">
                     <select
                       name="title"
                       value={data.title || ""}
                       onChange={handleChange}
                       className={styles.formSelect}
                     >
                       <option value="">Select Title</option>
                       <option value="mr">Mr</option>
                       <option value="mrs">Mrs</option>
                       <option value="ms">Ms</option>
                       <option value="dr">Dr</option>
                       <option value="prof">Prof</option>
                     </select>
                   </FormField> */}

            {/* <FormField label="Full Name" required>
              <input
                type="text"
                name="fullName"
                value={data.fullName || ""}
                onChange={handleChange}
                className={styles.formInput}
                required
              />
            </FormField> */}
          </div>

          <div className={styles.gridContainer}>
            {/* <FormField label="Current Position" required>
              <input
                type="text"
                name="currentPosition"
                value={data.currentPosition || ""}
                onChange={handleChange}
                className={styles.formInput}
                placeholder='e.g., "CFO Advisor," "Tech Board Specialist"'
                required
              />
            </FormField> */}

            <FormField label="Current Employer">
              <input
                type="text"
                name="currentEmployer"
                value={data.currentEmployer || ""}
                onChange={handleChange}
                className={styles.formInput}
              />
            </FormField>

            <FormField label="Professional Headline" >
              <input
                type="text"
                name="professionalHeadline"
                value={data.professionalHeadline || ""}
                onChange={handleChange}
                className={styles.formInput}
                placeholder='e.g., "CFO with 15+ years in mining & infrastructure"'
                required
              />
            </FormField>
          </div>

          <FormField label="Brief Bio - 200 words max: expertise, career highlights, passion areas" >
            <div style={{ position: 'relative' }}>
              <textarea
                name="briefBio"
                value={data.briefBio || ""}
                onChange={handleBioChange}
                className={styles.formTextarea}
                rows={4}
                placeholder="Describe your expertise, career highlights, and passion areas..."
                required
              />
              <div style={{ 
                position: 'absolute', 
                bottom: '8px', 
                right: '12px', 
                fontSize: '0.8rem', 
                color: getBioWordCount() > 200 ? '#ef4444' : '#6b7280'
              }}>
                {getBioWordCount()}/200 words
              </div>
            </div>
          </FormField>

          <FormField label="Years of Experience" >
            <select
              name="yearsOfExperience"
              value={data.yearsOfExperience || ""}
              onChange={handleChange}
              className={styles.formSelect}
              required
            >
              <option value="">Select Years of Experience</option>
              {yearsOfExperienceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {/* 2. Areas of Expertise */}
        <div style={{ margin: '2rem 0 1rem 0', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
         </h3>

          <div className={styles.gridContainer}>
            <FormField label="Functional Expertise">
              <MultiSelectDropdown
                name="functionalExpertise"
                options={functionalExpertiseOptions}
                value={data.functionalExpertise || []}
                onChange={(selectedOptions) => updateData({ functionalExpertise: selectedOptions })}
                placeholder="e.g., Finance, HR, Legal, Strategy, ESG, Tech, Governance"
              />
            </FormField>

            <FormField label="Industry Experience">
              <MultiSelectDropdown
                name="industryExperience"
                options={industryExperienceOptions}
                value={data.industryExperience || []}
                onChange={(selectedOptions) => updateData({ industryExperience: selectedOptions })}
                placeholder="e.g., Agri, Mining, Education, Health, FMCG, Tech"
              />
            </FormField>
          </div>

          <div className={styles.gridContainer}>
            <FormField label="Board Experience">
              <select
                name="boardExperience"
                value={data.boardExperience || ""}
                onChange={handleChange}
                className={styles.formSelect}
              >
                <option value="">Select Board Experience</option>
                {boardExperienceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Mentorship Experience">
              <select
                name="mentorshipExperience"
                value={data.mentorshipExperience || ""}
                onChange={handleChange}
                className={styles.formSelect}
              >
                <option value="">Select Mentorship Experience</option>
                {mentorshipExperienceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className={styles.gridContainer}>
            <FormField label="Languages Spoken">
              <MultiSelectDropdown
                name="languagesSpoken"
                options={languagesOptions}
                value={data.languagesSpoken || []}
                onChange={(selectedOptions) => updateData({ languagesSpoken: selectedOptions })}
                placeholder="Select Languages"
              />
            </FormField>

            <FormField label="Region Familiarity">
              <MultiSelectDropdown
                name="regionFamiliarity"
                options={regionFamiliarityOptions}
                value={data.regionFamiliarity || []}
                onChange={(selectedOptions) => updateData({ regionFamiliarity: selectedOptions })}
                placeholder="Africa-wide, Province-specific, etc."
              />
            </FormField>
          </div>
        </div>
      </div>
    </div>
  )
}