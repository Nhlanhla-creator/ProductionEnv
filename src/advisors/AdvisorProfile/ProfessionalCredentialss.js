"use client"
import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import FormField from "./FormField"

import styles from "./AdvisorProfile.module.css"

const qualificationsOptions = [
  { value: "ca_sa", label: "CA(SA)" },
  { value: "mba", label: "MBA" },
  { value: "phd", label: "PhD" },
  { value: "engineering_cert", label: "Engineering Cert" },
  { value: "cfa", label: "CFA" },
  { value: "acca", label: "ACCA" },
  { value: "cima", label: "CIMA" },
  { value: "llb", label: "LLB" },
  { value: "llm", label: "LLM" },
  { value: "bcom", label: "BCom" },
  { value: "bsc", label: "BSc" },
  { value: "ba", label: "BA" },
  { value: "masters_degree", label: "Master's Degree" },
  { value: "postgrad_diploma", label: "Postgrad Diploma" },
  { value: "other", label: "Other" },
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

export default function ProfessionalCredentials({ data = {}, updateData }) {
  const handleChange = (e) => {
    const { name, value } = e.target
    updateData({ [name]: value })
  }

  return (
    <div className={styles.productApplicationContainer}>
      <h2 className={styles.productApplicationHeading}>Professional Credentials</h2>

      <div className={styles.formContent}>
        <div style={{ marginBottom: '2rem' }}>
          <FormField label="Qualifications" >
            <MultiSelectDropdown
              name="qualifications"
              options={qualificationsOptions}
              value={data.qualifications || []}
              onChange={(selectedOptions) => updateData({ qualifications: selectedOptions })}
              placeholder="Select Qualifications"
              required
            />
            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px', fontStyle: 'italic' }}>
             
            </div>
          </FormField>

          <FormField label="Current Board Seats " >
            <input
              type="text"
              name="currentBoardSeats"
              value={data.currentBoardSeats || ""}
              onChange={handleChange}
              className={styles.formInput}
              placeholder='"Independent Advisor" or "Director at XYZ Corp"'
           
            />
            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px', fontStyle: 'italic' }}>
             
            </div>
          </FormField>

          <FormField label="Past Board/Advisory Roles" >
            <textarea
              name="pastBoardRoles"
              value={data.pastBoardRoles || ""}
              onChange={handleChange}
              className={styles.formTextarea}
              rows={3}
              placeholder='"Former Board Member at ABC Startup"'
              required
            />
            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px', fontStyle: 'italic' }}>

            </div>
          </FormField>

          <FormField label="Key Achievements ">
            <textarea
              name="keyAchievements"
              value={data.keyAchievements || ""}
              onChange={handleChange}
              className={styles.formTextarea}
              rows={4}
              placeholder='Bullet points, e.g., "Raised R10M for AgriTech SME"'
            />
            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px', fontStyle: 'italic' }}>
           
            </div>
          </FormField>
        </div>
      </div>
    </div>
  )
}