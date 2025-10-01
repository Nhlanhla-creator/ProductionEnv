"use client"

import { useState } from "react"
import { User } from 'lucide-react'
import FormField from "./FormField"
import styles from "../../catalyst/CatalystUniversalProfile/catalyst-universal-profile.module.css"

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

const PersonalOverview = ({ data, updateData }) => {
  const [formData, setFormData] = useState({
    fullName: data?.fullName || "",
    email: data?.email || "",
    phone: data?.phone || "",
    provinces: data?.provinces || [],
    cities: data?.cities || [],
    dateOfBirth: data?.dateOfBirth || "",
    nationalIdOrStudentNo: data?.nationalIdOrStudentNo || "",
  })

  const [errors, setErrors] = useState({})

  const handleChange = (field, value) => {
    const updatedData = {
      ...formData,
      [field]: value,
    }
    setFormData(updatedData)
    updateData(updatedData)
    
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }))
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
    
    handleChange(field, updatedSelections)
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
          <User size={24} />
        </div>
        <div className={styles.headerContent}>
          <h2 className={styles.sectionTitle}>Personal Overview</h2>
          <p className={styles.sectionDescription}>
            Provide your basic personal information for verification and contact purposes.
          </p>
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
                label="Full Name"
                type="text"
                value={formData.fullName}
                onChange={(val) => handleChange("fullName", val)}
                required
                error={errors.fullName}
              />
            </div>
            <div>
              <FormField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(val) => handleChange("email", val)}
                required
                note="Used for login & contact"
                error={errors.email}
              />
            </div>

            <div>
              <FormField
                label="Phone Number"
                type="text"
                value={formData.phone}
                onChange={(val) => handleChange("phone", val)}
                required
                error={errors.phone}
              />
            </div>
            
            <div style={{ position: "relative" }}>
              <MultiSelectField
                label="Provinces (Where you can work)"
                options={provinceOptions}
                selectedValues={formData.provinces}
                onChange={(option) => handleMultiSelectChange("provinces", option)}
                required
                error={errors.provinces}
              />
            </div>

            <div>
              <FormField
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(val) => handleChange("dateOfBirth", val)}
                required
                error={errors.dateOfBirth}
              />
            </div>
            
            <div style={{ position: "relative" }}>
              <MultiSelectField
                label="Cities (Where you can work)"
                options={cityOptions}
                selectedValues={formData.cities}
                onChange={(option) => handleMultiSelectChange("cities", option)}
                required
                error={errors.cities}
              />
            </div>

            <div style={{ gridColumn: "span 2" }}>
              <FormField
                label="National ID or Student Number"
                type="text"
                value={formData.nationalIdOrStudentNo}
                onChange={(val) => handleChange("nationalIdOrStudentNo", val)}
                required
                note="For verification purposes"
                error={errors.nationalIdOrStudentNo}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PersonalOverview