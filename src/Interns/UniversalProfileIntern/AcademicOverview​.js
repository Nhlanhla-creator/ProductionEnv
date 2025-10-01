"use client"
import { useState } from "react"
import { GraduationCap, Plus, X } from "lucide-react"
import FormField from "./FormFieldCustom"
import styles from "../../catalyst/CatalystUniversalProfile/catalyst-universal-profile.module.css"

const institutionOptions = [
  "",
  "University - University of Cape Town",
  "University - University of the Witwatersrand",
  "University - Stellenbosch University",
  "University - University of Pretoria",
  "University - University of KwaZulu‑Natal",
  "University - University of the Western Cape",
  "University - University of Johannesburg",
  "University - University of the Free State",
  "University - University of the North‑West",
  "University - Rhodes University",
  "University - University of Limpopo",
  "University - University of Mpumalanga",
  "University - University of Fort Hare",
  "University - Nelson Mandela University",
  "University - University of Venda",
  "University - Walter Sisulu University",
  "University - University of Zululand",
  "University - Sefako Makgatho Health Sciences University",
  "University - Cape Peninsula University of Technology",
  "University - Central University of Technology",
  "University - Durban University of Technology",
  "University - Mangosuthu University of Technology",
  "University - Tshwane University of Technology",
  "University - Vaal University of Technology",
  "TVET - Boland TVET College",
  "TVET - Buffalo City TVET College",
  "TVET - Capricorn TVET College",
  "TVET - Central Johannesburg TVET College",
  "TVET - Coastal TVET College",
  "TVET - College of Cape Town",
  "TVET - Eastcape Midlands TVET College",
  "TVET - Ehlanzeni TVET College",
  "TVET - Ekurhuleni East TVET College",
  "TVET - Ekurhuleni West TVET College",
  "TVET - Elangeni TVET College",
  "TVET - Esayidi TVET College",
  "TVET - False Bay TVET College",
  "TVET - Flavius Mareka TVET College",
  "TVET - Gert Sibande TVET College",
  "TVET - Goldfields TVET College",
  "TVET - Ikhala TVET College",
  "TVET - Ingwe TVET College",
  "TVET - King Hintsa TVET College",
  "TVET - King Sabata Dalindyebo TVET College",
  "TVET - Lephalale TVET College",
  "TVET - Letaba TVET College",
  "TVET - Lovedale TVET College",
  "TVET - Majuba TVET College",
  "TVET - Maluti TVET College",
  "TVET - Mnambithi TVET College",
  "TVET - Mopani South East TVET College",
  "TVET - Motheo TVET College",
  "TVET - Mthashana TVET College",
  "TVET - Nkangala TVET College",
  "TVET - Northlink TVET College",
  "TVET - Northern Cape Rural TVET College",
  "TVET - Northern Cape Urban TVET College",
  "TVET - Orbit TVET College",
  "TVET - Port Elizabeth TVET College",
  "TVET - Sedibeng TVET College",
  "TVET - Sekhukhune TVET College",
  "TVET - South Cape TVET College",
  "TVET - South West Gauteng TVET College",
  "TVET - Taletso TVET College",
  "TVET - Thekwini TVET College",
  "TVET - Tshwane North TVET College",
  "TVET - Tshwane South TVET College",
  "TVET - Umfolozi TVET College",
  "TVET - Umgungundlovu TVET College",
  "TVET - Vhembe TVET College",
  "TVET - Vuselela TVET College",
  "TVET - Waterberg TVET College",
  "TVET - West Coast TVET College",
  "Other",
]

// Mapping institutions to their relevant faculties/schools
const institutionFaculties = {
  "University - University of Cape Town": [
    "Commerce Faculty",
    "Engineering & Built Environment Faculty",
    "Health Sciences Faculty", 
    "Humanities Faculty",
    "Law Faculty",
    "Science Faculty",
    "Graduate School of Business"
  ],
  "University - University of the Witwatersrand": [
    "Commerce, Law & Management Faculty",
    "Engineering & Built Environment Faculty",
    "Health Sciences Faculty",
    "Humanities Faculty", 
    "Science Faculty",
    "Wits Business School"
  ],
  "University - Stellenbosch University": [
    "AgriSciences Faculty",
    "Arts & Social Sciences Faculty",
    "Economic & Management Sciences Faculty",
    "Education Faculty",
    "Engineering Faculty",
    "Law Faculty",
    "Medicine & Health Sciences Faculty",
    "Science Faculty",
    "Theology Faculty"
  ],
  "University - University of Pretoria": [
    "Economic & Management Sciences Faculty",
    "Education Faculty",
    "Engineering, Built Environment & IT Faculty",
    "Health Sciences Faculty",
    "Humanities Faculty",
    "Law Faculty",
    "Natural & Agricultural Sciences Faculty",
    "Theology & Religion Faculty",
    "Veterinary Science Faculty"
  ],
  "University - University of Johannesburg": [
    "Art, Design & Architecture Faculty",
    "Economic & Financial Sciences Faculty",
    "Education Faculty",
    "Engineering & Built Environment Faculty",
    "Health Sciences Faculty",
    "Humanities Faculty",
    "Law Faculty",
    "Science Faculty"
  ]
}

// Comprehensive degree options based on South African qualifications
const degreeOptions = [
  "",
  // Undergraduate Degrees
  "Bachelor of Commerce (BCom)",
  "Bachelor of Business Administration (BBA)", 
  "Bachelor of Arts (BA)",
  "Bachelor of Science (BSc)",
  "Bachelor of Engineering (BEng)",
  "Bachelor of Technology (BTech)",
  "Bachelor of Education (BEd)",
  "Bachelor of Law (LLB)",
  "Bachelor of Medicine (MBChB)",
  "Bachelor of Accounting Science (BAcc)",
  "Bachelor of Social Work (BSW)",
  "Bachelor of Fine Arts (BFA)",
  // Diplomas
  "National Diploma",
  "Higher Certificate",
  "Advanced Diploma",
  "Postgraduate Diploma",
  // TVET Qualifications
  "N6 Certificate",
  "N5 Certificate", 
  "N4 Certificate",
  "NCV Level 4",
  "NCV Level 3",
  "NCV Level 2",
  // Postgraduate
  "Honours Degree",
  "Master's Degree",
  "Doctoral Degree (PhD)",
  "Other"
]

// Field of study options relevant to South African context
const fieldOfStudyOptions = [
  "",
  // Business & Commerce
  "Accounting",
  "Finance",
  "Marketing",
  "Human Resources",
  "Supply Chain Management",
  "Economics",
  "Business Management",
  "Entrepreneurship",
  // Technology & Engineering
  "Information Technology",
  "Computer Science",
  "Software Engineering",
  "Civil Engineering",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Industrial Engineering",
  "Mining Engineering",
  // Health Sciences
  "Medicine",
  "Nursing",
  "Pharmacy",
  "Physiotherapy",
  "Occupational Therapy",
  "Dentistry",
  // Social Sciences & Humanities
  "Education",
  "Psychology",
  "Social Work",
  "Law",
  "Political Science",
  "Sociology",
  "History",
  "English",
  "Languages",
  // Natural Sciences
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Environmental Science",
  "Geology",
  // Creative & Arts
  "Fine Arts",
  "Drama",
  "Music",
  "Graphic Design",
  "Architecture",
  "Other"
]

// Year of study options
const yearOfStudyOptions = [
  "",
  "1st Year",
  "2nd Year", 
  "3rd Year",
  "4th Year",
  "5th Year",
  "6th Year",
  "Final Year",
  "Postgraduate",
  "Graduate/Completed",
  "Other"
]

// Graduation year options (current year ± range)
const currentYear = new Date().getFullYear()
const graduationYearOptions = [""]
for (let year = currentYear - 5; year <= currentYear + 10; year++) {
  graduationYearOptions.push(year.toString())
}

// Qualification level options for scoring
const qualificationLevelOptions = [
  "",
  "NQF Level 1-3 (Basic Education)",
  "NQF Level 4 (Matric/Grade 12)",
  "NQF Level 5 (Higher Certificate)",
  "NQF Level 6 (National Diploma/Advanced Certificate)",
  "NQF Level 7 (Bachelor's Degree/Advanced Diploma)",
  "NQF Level 8 (Honours/Postgraduate Diploma)",
  "NQF Level 9 (Master's Degree)",
  "NQF Level 10 (Doctoral Degree)"
]

const AcademicOverview = ({ data, updateData }) => {
  const [formData, setFormData] = useState({
    institution: data?.institution || "",
    institutionOther: data?.institutionOther || "",
    degree: data?.degree || "",
    degreeOther: data?.degreeOther || "",
    fieldOfStudy: data?.fieldOfStudy || "",
    fieldOther: data?.fieldOther || "",
    yearOfStudy: data?.yearOfStudy || "",
    yearOther: data?.yearOther || "",
    graduationYear: data?.graduationYear || "",
    qualificationLevel: data?.qualificationLevel || "",
    academicPerformance: data?.academicPerformance || "",
    academicHonors: data?.academicHonors || "",
    certifications: data?.certifications || [""],
    locationFlexibility: data?.locationFlexibility || [], // New field for location preferences
  })

  const [errors, setErrors] = useState({})

  const handleChange = (field, value) => {
    const updatedData = { ...formData, [field]: value }
    setFormData(updatedData)
    updateData(updatedData)
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

  const handleCertificationChange = (index, value) => {
    const updatedCertifications = [...formData.certifications]
    updatedCertifications[index] = value
    handleChange("certifications", updatedCertifications)
  }

  const addCertification = () => {
    const updatedCertifications = [...formData.certifications, ""]
    handleChange("certifications", updatedCertifications)
  }

  const removeCertification = (index) => {
    if (formData.certifications.length > 1) {
      const updatedCertifications = formData.certifications.filter((_, i) => i !== index)
      handleChange("certifications", updatedCertifications)
    }
  }

  // Get relevant fields based on selected institution
  const getRelevantFields = () => {
    if (institutionFaculties[formData.institution]) {
      return institutionFaculties[formData.institution]
    }
    return fieldOfStudyOptions
  }

  const locationOptions = ["In-person", "Hybrid", "Remote", "All"]

  return (
    <div className={styles.sectionContainer}>
      <div className={styles.sectionHeader}>
        <div className={styles.headerIcon}>
          <GraduationCap size={24} />
        </div>
        <div className={styles.headerContent}>
          <h2 className={styles.sectionTitle}>Academic Background</h2>
          <p className={styles.sectionDescription}>Provide your current academic information.</p>
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
                label="Current Institution"
                type="dropdown"
                options={institutionOptions}
                value={formData.institution}
                onChange={(val) => handleChange("institution", val)}
                required
                error={errors.institution}
              />
              {formData.institution === "Other" && (
                <FormField
                  label="Specify Other Institution"
                  type="text"
                  value={formData.institutionOther}
                  onChange={(val) => handleChange("institutionOther", val)}
                  required
                />
              )}
            </div>

            <div>
              <FormField
                label="Degree or Qualification"
                type="dropdown"
                options={degreeOptions}
                value={formData.degree}
                onChange={(val) => handleChange("degree", val)}
                required
                error={errors.degree}
              />
              {formData.degree === "Other" && (
                <FormField
                  label="Specify Other Degree"
                  type="text"
                  value={formData.degreeOther}
                  onChange={(val) => handleChange("degreeOther", val)}
                  required
                />
              )}
            </div>

            <div>
              <FormField
                label="Field of Study"
                type="dropdown"
                options={getRelevantFields()}
                value={formData.fieldOfStudy}
                onChange={(val) => handleChange("fieldOfStudy", val)}
                required
                error={errors.fieldOfStudy}
              />
              {formData.fieldOfStudy === "Other" && (
                <FormField
                  label="Specify Other Field"
                  type="text"
                  value={formData.fieldOther}
                  onChange={(val) => handleChange("fieldOther", val)}
                  required
                />
              )}
            </div>

            <div>
              <FormField
                label="Year of Study"
                type="dropdown"
                options={yearOfStudyOptions}
                value={formData.yearOfStudy}
                onChange={(val) => handleChange("yearOfStudy", val)}
                required
                error={errors.yearOfStudy}
              />
              {formData.yearOfStudy === "Other" && (
                <FormField
                  label="Specify Other Year"
                  type="text"
                  value={formData.yearOther}
                  onChange={(val) => handleChange("yearOther", val)}
                  required
                />
              )}
            </div>

            <div>
              <FormField
                label="Graduation Year (Expected/Actual)"
                type="dropdown"
                options={graduationYearOptions}
                value={formData.graduationYear}
                onChange={(val) => handleChange("graduationYear", val)}
                required
                error={errors.graduationYear}
              />
            </div>

            <div>
              <FormField
                label="Qualification Level (For Scoring)"
                type="dropdown"
                options={qualificationLevelOptions}
                value={formData.qualificationLevel}
                onChange={(val) => handleChange("qualificationLevel", val)}
                required
              />
            </div>

            <div>
              <FormField
                label="Academic Performance"
                type="text"
                value={formData.academicPerformance}
                onChange={(val) => handleChange("academicPerformance", val)}
                placeholder="e.g., 3.8 GPA or 75%"
              />
            </div>

            <div>
              <FormField
                label="Academic Honors & Distinctions"
                type="textarea"
                value={formData.academicHonors}
                onChange={(val) => handleChange("academicHonors", val)}
                placeholder="e.g., Dean's List, Cum Laude, Academic Awards..."
                rows={3}
              />
            </div>
          </div>

          {/* Location Flexibility Section */}
          <div style={{ marginTop: "30px" }}>
            <h3 className={styles.subSectionTitle} style={{ marginBottom: "15px" }}>
              Location Flexibility
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
          </div>

          {/* Professional Certifications with Add Button */}
          <div style={{ marginTop: "30px" }}>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}
            >
              <h3 className={styles.subSectionTitle}>Professional Certifications</h3>
              <button
                type="button"
                onClick={addCertification}
                className={styles.addButton}
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
                }}
              >
                <Plus size={16} /> Add Certification
              </button>
            </div>

            {formData.certifications.map((cert, index) => (
              <div key={index} style={{ display: "flex", gap: "10px", marginBottom: "10px", alignItems: "end" }}>
                <div style={{ flex: 1 }}>
                  <FormField
                    label={`Certification ${index + 1}`}
                    type="text"
                    value={cert}
                    onChange={(val) => handleCertificationChange(index, val)}
                    placeholder="e.g., Microsoft Office Specialist, SAICA Articles, Google Analytics..."
                  />
                </div>
                {formData.certifications.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCertification(index)}
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
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AcademicOverview