"use client"
import { useEffect, useState, useRef } from "react"
import { HelpCircle, ChevronDown, X, Check } from "lucide-react"
import FormField from "./form-field"
import FileUpload from "./file-upload"
import './UniversalProfile.css';
import { db, auth } from "../../firebaseConfig"
import { doc, getDoc, updateDoc } from "firebase/firestore"

const bbbeeOptions = [
  { value: "1", label: "Level 1" },
  { value: "2", label: "Level 2" },
  { value: "3", label: "Level 3" },
  { value: "4", label: "Level 4" },
  { value: "5", label: "Level 5" },
  { value: "6", label: "Level 6" },
  { value: "7", label: "Level 7" },
  { value: "8", label: "Level 8" },
  { value: "Exempt", label: "Exempt" },
  { value: "None", label: "None" },
]

const cipcStatusOptions = [
  { value: "Current", label: "Current" },
  { value: "Pending", label: "Pending" },
  { value: "Overdue", label: "Overdue" },
  { value: "N/A", label: "Not Applicable" },
]

const uifStatusOptions = [
  { value: "Registered", label: "Registered with UIF" },
  { value: "Not yet registered", label: "Not yet registered" },
  { value: "In progress / Awaiting confirmation", label: "In progress / Awaiting confirmation" },
]

const industryAccreditationOptions = [
  { value: "ISO 9001", label: "ISO 9001 – Quality Management" },
  { value: "ISO 14001", label: "ISO 14001 – Environmental Management" },
  { value: "ISO 45001", label: "ISO 45001 – Occupational Health & Safety" },
  { value: "ISO 27001", label: "ISO 27001 – Information Security" },
  { value: "CIDB", label: "CIDB – Construction Industry Development Board" },
  { value: "NHBRC", label: "NHBRC – National Home Builders Registration Council" },
  { value: "SACPCMP", label: "SACPCMP – SA Council for Project & Construction Management" },
  { value: "ECSA", label: "ECSA – Engineering Council of South Africa" },
  { value: "SABS", label: "SABS – South African Bureau of Standards" },
  { value: "FSCA", label: "FSCA – Financial Sector Conduct Authority" },
  { value: "PSIRA", label: "PSIRA – Private Security Industry Regulatory Authority" },
  { value: "SAICA", label: "SAICA – SA Institute of Chartered Accountants" },
  { value: "SAIPA", label: "SAIPA – SA Institute of Professional Accountants" },
  { value: "HPCSA", label: "HPCSA – Health Professions Council of SA" },
  { value: "Other", label: "Other (please specify)" },
]

// Tooltip Component
const Tooltip = ({ children, content, position = "top" }) => {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 px-3 py-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg whitespace-nowrap max-w-xs ${position === "top"
            ? "bottom-full left-1/2 transform -translate-x-1/2 mb-2"
            : "top-full left-1/2 transform -translate-x-1/2 mt-2"
            }`}
          style={{ width: "max-content", maxWidth: "300px", whiteSpace: "normal" }}
        >
          {content}
          <div
            className={`absolute w-2 h-2 bg-gray-800 transform rotate-45 ${position === "top"
              ? "top-full left-1/2 -translate-x-1/2 -mt-1"
              : "bottom-full left-1/2 -translate-x-1/2 -mb-1"
              }`}
          />
        </div>
      )}
    </div>
  )
}

// Multi-Select Dropdown Component
const MultiSelectDropdown = ({ options, selected = [], onChange, placeholder = "Select options..." }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const toggleOption = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const removeTag = (e, value) => {
    e.stopPropagation()
    onChange(selected.filter((v) => v !== value))
  }

  const getLabel = (value) => {
    const opt = options.find((o) => o.value === value)
    return opt ? opt.label : value
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full min-h-[42px] px-3 py-2 border border-brown-300 rounded-md cursor-pointer flex flex-wrap items-center gap-1 focus:outline-none focus:ring-2 focus:ring-brown-500 bg-white"
        style={{ borderColor: "#d6c4a8" }}
      >
        {selected.length === 0 ? (
          <span className="text-gray-400 text-sm">{placeholder}</span>
        ) : (
          selected.map((val) => (
            <span
              key={val}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: "#f3ebe0", color: "#6b4c2a", border: "1px solid #d6c4a8" }}
            >
              {val === "Other" ? "Other" : val}
              <button
                onClick={(e) => removeTag(e, val)}
                className="hover:opacity-70 transition-opacity"
                type="button"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
        <ChevronDown
          className={`w-4 h-4 ml-auto flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
          style={{ color: "#9c7a5a" }}
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto"
          style={{ borderColor: "#d6c4a8" }}
        >
          {options.map((option) => {
            const isSelected = selected.includes(option.value)
            return (
              <div
                key={option.value}
                onClick={() => toggleOption(option.value)}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer text-sm hover:bg-amber-50 transition-colors"
                style={{ color: "#3d2b1f" }}
              >
                <div
                  className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border"
                  style={{
                    borderColor: isSelected ? "#8b5e3c" : "#d6c4a8",
                    backgroundColor: isSelected ? "#8b5e3c" : "transparent",
                  }}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
                <span>{option.label}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function LegalCompliance({ data = {}, updateData }) {
  const [formData, setFormData] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [uploadingDocs, setUploadingDocs] = useState({});

  // Load data from Firebase when component mounts
  useEffect(() => {
    const loadLegalCompliance = async () => {
      try {
        setIsLoading(true)
        const userId = auth.currentUser?.uid

        if (!userId) {
          setIsLoading(false)
          return
        }

        const docRef = doc(db, "universalProfiles", userId)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const profileData = docSnap.data()

          if (profileData.legalCompliance) {
            const legalData = profileData.legalCompliance
            // Migrate old string industryAccreditations to array
            if (typeof legalData.industryAccreditations === "string") {
              legalData.industryAccreditations = legalData.industryAccreditations
                ? legalData.industryAccreditations.split(",").map((s) => s.trim()).filter(Boolean)
                : []
            }
            setFormData(legalData)
            updateData(legalData)
          } else {
            const initData = getDefaultData(data)
            setFormData(initData)
            updateData(initData)
          }
        } else {
          const initData = getDefaultData(data)
          setFormData(initData)
          updateData(initData)
        }
      } catch (error) {
        console.error("Error loading legal compliance details:", error)
        setFormData(data)
        updateData(data)
      } finally {
        setIsLoading(false)
      }
    }

    loadLegalCompliance()
  }, [])

  const getDefaultData = (passedData) => {
    if (Object.keys(passedData).length > 0) return passedData
    return {
      taxNumber: "",
      vatNumber: "",
      uifStatus: "",
      uifNumber: "",
      payeNumber: "",
      bbbeeLevel: "",
      coidaNumber: "",
      industryAccreditations: [],
      industryAccreditationsOther: "",
      taxClearanceCert: [],
      vatCertificate: [],
      bbbeeCert: [],
      otherCerts: [],
      industryAccreditationDocs: [],
    }
  }

  useEffect(() => {
    if (!isLoading && Object.keys(formData).length === 0) {
      setFormData(data)
    }
  }, [data, isLoading])

  const handleChange = (e) => {
    const { name, value } = e.target
    const updatedData = { ...formData, [name]: value }

    if (name === "uifStatus" && value !== "Registered") {
      updatedData.uifNumber = ""
    }

    if (name === "hasAdvisoryStructure" && value === "No") updatedData.advisoryStructureDocs = []
    if (name === "hasPolicyControls" && value === "No") updatedData.policyControlsDocs = []
    if (name === "hasEthicsPolicy" && value === "No") updatedData.ethicsPolicyDocs = []
    if (name === "hasConflictResolution" && value === "No") updatedData.conflictResolutionDocs = []
    if (name === "hasWhistleblowingPolicy" && value === "No") updatedData.whistleblowingPolicyDocs = []

    setFormData(updatedData)
    updateData(updatedData)
  }

  const handleAccreditationsChange = (selectedValues) => {
    const updatedData = { ...formData, industryAccreditations: selectedValues }
    // Clear "Other" text if "Other" is deselected
    if (!selectedValues.includes("Other")) {
      updatedData.industryAccreditationsOther = ""
    }
    setFormData(updatedData)
    updateData(updatedData)
  }

  const handleFileChange = (name, files) => {
    const updatedData = { ...formData, [name]: files }
    setFormData(updatedData)
    updateData(updatedData)
  }

  const handleDateChange = (e) => {
    const { name, value } = e.target
    const updatedData = { ...formData, [name]: value }
    setFormData(updatedData)
    updateData(updatedData)
  }

  const selectedAccreditations = Array.isArray(formData.industryAccreditations)
    ? formData.industryAccreditations
    : []
  const showOtherInput = selectedAccreditations.includes("Other")

  if (isLoading) {
    return (
      <div className="legal-compliance-loading">
        <h2 className="text-2xl font-bold text-brown-800 mb-6">Legal & Compliance</h2>
        <p>Loading your compliance information...</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-brown-800 mb-6">Legal & Compliance</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <FormField label="Tax Number">
            <input
              type="text"
              name="taxNumber"
              value={formData.taxNumber || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              required
            />
          </FormField>

          <FormField label="PAYE Number">
            <input
              type="text"
              name="payeNumber"
              value={formData.payeNumber || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
            />
          </FormField>

          <FormField label="VAT Number">
            <input
              type="text"
              name="vatNumber"
              value={formData.vatNumber || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
            />
          </FormField>

          <FormField label="UIF Status">
            <select
              name="uifStatus"
              value={formData.uifStatus || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              required
            >
              <option value="">Select UIF Status</option>
              {uifStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          {formData.uifStatus === "Registered" && (
            <FormField label="UIF Reference Number">
              <input
                type="text"
                name="uifNumber"
                value={formData.uifNumber || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                required
              />
            </FormField>
          )}

          <div>
            <div className="flex items-center gap-1 mb-2">
              <label className="block text-sm font-medium text-brown-700">
                COIDA No. (if applicable)
              </label>
              <Tooltip
                content="Compensation for Occupational Injuries and Diseases Act number. This is required if you have employees and need to register for workplace injury compensation insurance. Only applicable to businesses with employees."
                position="top"
              >
                <HelpCircle className="w-3.5 h-3.5 text-brown-400 cursor-help hover:text-brown-600 transition-colors" />
              </Tooltip>
            </div>
            <input
              type="text"
              name="coidaNumber"
              value={formData.coidaNumber || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
            />
          </div>
        </div>

        <div>
          <FormField label="B-BBEE Level">
            <select
              name="bbbeeLevel"
              value={formData.bbbeeLevel || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              required
            >
              <option value="">Select Level</option>
              {bbbeeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Industry Accreditations (optional)">
            <MultiSelectDropdown
              options={industryAccreditationOptions}
              selected={selectedAccreditations}
              onChange={handleAccreditationsChange}
              placeholder="Select accreditations..."
            />
          </FormField>

          {showOtherInput && (
            <FormField label="Please specify other accreditation(s)">
              <input
                type="text"
                name="industryAccreditationsOther"
                value={formData.industryAccreditationsOther || ""}
                onChange={handleChange}
                placeholder="e.g. SETA accreditation, Industry-specific certification..."
                className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              />
            </FormField>
          )}
        </div>
      </div>
    </div>
  )
}