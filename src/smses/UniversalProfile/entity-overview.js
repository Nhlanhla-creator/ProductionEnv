"use client"
import { useEffect, useState } from "react"
import { Info } from "lucide-react"
import FormField from "./form-field"
import FileUpload from "./file-upload"
import "./UniversalProfile.css"
import { db, auth, storage } from "../../firebaseConfig"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import ProfileView from "./LindelaniTestView" // Adjust the import based on your file structure
import { ChevronDown, ChevronUp } from "lucide-react"
import RegistrationSummary from "./registration-summary"


// Updated entity types
const entityTypes = [
  { value: "SME", label: "SME" },
  { value: "Social Enterprise", label: "Social Enterprise" },
  { value: "Funder/Investor", label: "Funder/Investor" },
  { value: "Corporate", label: "Corporate" },
  { value: "Accelerator", label: "Accelerator" },
  { value: "Incubator", label: "Incubator" },
]

// New legal structure options
const legalStructures = [
  { value: "(pty) Ltd", label: "(Pty) Ltd - Private Company" },
  { value: "Ltd", label: "Ltd - Public Company" },
  { value: "NPC", label: "NPC - Non-Profit Company" },
  { value: "Sole Proprietor", label: "Sole Proprietor" },
  { value: "Partnership", label: "Partnership" },
  { value: "CC", label: "CC - Close Corporation (Legacy)" },
  { value: "Trust", label: "Trust" },
  { value: "Cooperative", label: "Cooperative" },
  { value: "Joint Venture", label: "Joint Venture" },
  { value: "State Qwned", label: "State-Owned Enterprise" },

];

const entitySizes = [
  { value: "Micro", label: "Micro (< R1M annual turnover)" },
  { value: "Small", label: "Small (R1M - R10M annual turnover)" },
  { value: "Medium", label: "Medium (R10M - R50M annual turnover)" },
  { value: "Large", label: "Large (> R50M annual turnover)" },
]

const operationStages = [
  { value: "Startup", label: "Startup" },
  { value: "Growth", label: "Growth" },
  { value: "Scaling", label: "Scaling" },
  { value: "Turnaround", label: "Turnaround" },
  { value: "Mature", label: "Mature" },

]

const economicSectors = [
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

const africanCountries = [
  { value: "Algeria", label: "Algeria" },
  { value: "Angola", label: "Angola" },
  { value: "Benin", label: "Benin" },
  { value: "Botswana", label: "Botswana" },
  { value: "Burkina Faso", label: "Burkina Faso" },
  { value: "Burundi", label: "Burundi" },
  { value: "Cabo Verde", label: "Cabo Verde" },
  { value: "Cameroon", label: "Cameroon" },
  { value: "Central African Republic", label: "Central African Republic" },
  { value: "Chad", label: "Chad" },
  { value: "Comoros", label: "Comoros" },
  { value: "Congo", label: "Congo" },
  { value: "Côte d'Ivoire", label: "Côte d'Ivoire" },
  { value: "Djibouti", label: "Djibouti" },
  { value: "DR Congo", label: "DR Congo" },
  { value: "Egypt", label: "Egypt" },
  { value: "Equatorial Guinea", label: "Equatorial Guinea" },
  { value: "Eritrea", label: "Eritrea" },
  { value: "Eswatini", label: "Eswatini" },
  { value: "Ethiopia", label: "Ethiopia" },
  { value: "Gabon", label: "Gabon" },
  { value: "Gambia", label: "Gambia" },
  { value: "Ghana", label: "Ghana" },
  { value: "Guinea", label: "Guinea" },
  { value: "Guinea-Bissau", label: "Guinea-Bissau" },
  { value: "Kenya", label: "Kenya" },
  { value: "Lesotho", label: "Lesotho" },
  { value: "Liberia", label: "Liberia" },
  { value: "Libya", label: "Libya" },
  { value: "Madagascar", label: "Madagascar" },
  { value: "Malawi", label: "Malawi" },
  { value: "Mali", label: "Mali" },
  { value: "Mauritania", label: "Mauritania" },
  { value: "Mauritius", label: "Mauritius" },
  { value: "Morocco", label: "Morocco" },
  { value: "Mozambique", label: "Mozambique" },
  { value: "Namibia", label: "Namibia" },
  { value: "Niger", label: "Niger" },
  { value: "Nigeria", label: "Nigeria" },
  { value: "Rwanda", label: "Rwanda" },
  { value: "São Tomé and Príncipe", label: "São Tomé and Príncipe" },
  { value: "Senegal", label: "Senegal" },
  { value: "Seychelles", label: "Seychelles" },
  { value: "Sierra Leone", label: "Sierra Leone" },
  { value: "Somalia", label: "Somalia" },
  { value: "South Africa", label: "South Africa" },
  { value: "South Sudan", label: "South Sudan" },
  { value: "Sudan", label: "Sudan" },
  { value: "Tanzania", label: "Tanzania" },
  { value: "Togo", label: "Togo" },
  { value: "Tunisia", label: "Tunisia" },
  { value: "Uganda", label: "Uganda" },
  { value: "Zambia", label: "Zambia" },
  { value: "Zimbabwe", label: "Zimbabwe" },
];

// MultiSelect component for Economic Sector
function MultiSelect({ options, selected, onChange, label }) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleDropdown = () => setIsOpen(!isOpen)
  const closeDropdown = () => setIsOpen(false)

  const handleSelect = (value) => {
    const newSelected = selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]
    onChange(newSelected)
  }

  return (
    <div className="multi-select-container">
      <div className="multi-select-header" onClick={toggleDropdown}>
        {selected.length > 0 ? (
          <div className="selected-items">
            {selected.map((sector) => (
              <span key={sector} className="selected-item">
                {options.find((opt) => opt.value === sector)?.label || sector}
              </span>
            ))}
          </div>
        ) : (
          <span className="placeholder">Select {label}</span>
        )}
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>

      {isOpen && (
        <div className="multi-select-dropdown">
          <div className="multi-select-options">
            {options.map((option) => (
              <div
                key={option.value}
                className={`multi-select-option ${selected.includes(option.value) ? "selected" : ""}`}
                onClick={() => handleSelect(option.value)}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={() => { }}
                  className="multi-select-checkbox"
                />
                <span>{option.label}</span>
              </div>
            ))}
          </div>
          <div className="multi-select-actions">
            <button type="button" className="multi-select-button" onClick={closeDropdown}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function EntityOverview({ data = {}, updateData, onSave }) {
  const [formData, setFormData] = useState({})
  const [isSaving, setSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load data from Firebase when component mounts
  useEffect(() => {
    const loadEntityOverview = async () => {
      try {
        setIsLoading(true)
        const userId = auth.currentUser?.uid

        if (!userId) {
          setIsLoading(false)
          return
        }

        // Load from the universalProfiles collection (matching your main structure)
        const docRef = doc(db, "universalProfiles", userId)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const profileData = docSnap.data()

          // Check if entityOverview data exists
          if (profileData.entityOverview) {
            const entityData = profileData.entityOverview
            setFormData(entityData)
            updateData(entityData)
          } else {
            // If no data exists, initialize with passed data
            setFormData(data)
          }
        } else {
          // No profile exists yet, use passed data
          setFormData(data)
        }
      } catch (error) {
        console.error("Error loading entity overview:", error)
        // Fallback to passed data on error
        setFormData(data)
      } finally {
        setIsLoading(false)
      }
    }

    loadEntityOverview()
  }, []) // Remove data dependency to prevent infinite loops

  // Update form data when data prop changes (but only if not loading from Firebase)
  useEffect(() => {
    if (!isLoading && Object.keys(formData).length === 0) {
      setFormData(data)
    }
  }, [data, isLoading])

  const handleChange = (e) => {
    const { name, value } = e.target
    const updatedData = { ...formData, [name]: value }
    setFormData(updatedData)
    updateData(updatedData)
  }

  const handleMultiSelectChange = (field, value) => {
    const updatedData = { ...formData, [field]: value }
    setFormData(updatedData)
    updateData(updatedData)
  }

  const handleFileChange = (name, files) => {
    const updatedData = { ...formData, [name]: files }
    setFormData(updatedData)
    updateData(updatedData)
  }

  // Remove the old Firebase save logic since it's handled by the parent component
  // Keep this for backwards compatibility if needed
  const saveEntityOverview = async () => {
    // This can be removed since the parent component handles saving
    return { success: true }
  }

  useEffect(() => {
    if (onSave) {
      onSave.current = saveEntityOverview
    }
  }, [formData, onSave])

  // Show loading state while fetching data
  if (isLoading) {
    return (
      <div className="entity-overview-loading">
        <h2 className="text-2xl font-bold text-brown-800 mb-6">Entity Overview</h2>
        <p>Loading your information...</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-brown-800 mb-6">Entity Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <FormField label="Registered Name" required>
            <input
              type="text"
              name="registeredName"
              value={formData.registeredName || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              required
            />
          </FormField>

          <FormField label="Trading Name (if different)">
            <input
              type="text"
              name="tradingName"
              value={formData.tradingName || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
            />
          </FormField>

          <FormField label="Registration Number" required>
            <input
              type="text"
              name="registrationNumber"
              value={formData.registrationNumber || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              required
            />
          </FormField>

          <FormField label="Entity Type" required>
            <select
              name="entityType"
              value={formData.entityType || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              required
            >
              <option value="">Select Entity Type</option>
              {entityTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Legal Structure" required>
            <select
              name="legalStructure"
              value={formData.legalStructure || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              required
            >
              <option value="">Select Legal Structure</option>
              {legalStructures.map((structure) => (
                <option key={structure.value} value={structure.value}>
                  {structure.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Entity Size" required>
            <select
              name="entitySize"
              value={formData.entitySize || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              required
            >
              <option value="">Select Entity Size</option>
              {entitySizes.map((size) => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Financial Year End" required>
            <input
              type="month"
              name="financialYearEnd"
              value={formData.financialYearEnd || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              required
            />
          </FormField>

          <FormField label="No. of Employees" required>
            <input
              type="number"
              name="employeeCount"
              value={formData.employeeCount || ""}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              required
            />
          </FormField>

          <FormField label="Years in Operation" required>
            <input
              type="number"
              name="yearsInOperation"
              value={formData.yearsInOperation || ""}
              onChange={handleChange}
              min="0"
              step="0.5"
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              required
            />
          </FormField>
        </div>

        <div>
          <FormField
            label="Business Stage "
            tooltip={
              <div className="tooltip-content">
                <p>Select the current stage of your business operation:</p>
                <ul className="list-disc pl-4 mt-1">
                  <li><strong>Idea:</strong> Conceptual phase, not yet operational</li>
                  <li><strong>Prototype:</strong> Developing product/service prototype</li>
                  <li><strong>Startup:</strong> Recently launched, establishing operations</li>
                  <li><strong>Early-Growth:</strong> Initial expansion phase</li>
                  <li><strong>Growth:</strong> Established and growing steadily</li>
                  <li><strong>Scale-up:</strong> Rapid expansion phase</li>
                  <li><strong>Mature:</strong> Well-established, stable operations</li>
                </ul>
              </div>
            }
            required
          >
            <select
              name="operationStage"
              value={formData.operationStage || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              required
            >
              <option value="">Select Operation Stage</option>
              {operationStages.map((stage) => (
                <option key={stage.value} value={stage.value}>
                  {stage.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Economic Sector" required>
            <MultiSelect
              options={economicSectors}
              selected={formData.economicSectors || []}
              onChange={(value) => handleMultiSelectChange("economicSectors", value)}
              label="Economic Sectors"
            />
          </FormField>

          <FormField label="Location" required>
            <select
              name="location"
              value={formData.location || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              required
            >
              <option value="">Select Country</option>
              {africanCountries.map((country) => (
                <option key={country.value} value={country.value}>
                  {country.label}
                </option>
              ))}
            </select>
          </FormField>

          {formData.location === "south_africa" && (
            <FormField label="Province" required>
              <select
                name="province"
                value={formData.province || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                required
              >
                <option value="">Select Province</option>
                <option value="eastern_cape">Eastern Cape</option>
                <option value="free_state">Free State</option>
                <option value="gauteng">Gauteng</option>
                <option value="kwazulu_natal">KwaZulu-Natal</option>
                <option value="limpopo">Limpopo</option>
                <option value="mpumalanga">Mpumalanga</option>
                <option value="northern_cape">Northern Cape</option>
                <option value="north_west">North West</option>
                <option value="western_cape">Western Cape</option>
              </select>
            </FormField>
          )}

          <FormField
            label="Brief Business Description "
            tooltip={
              <div className="tooltip-content">
                <p>Provide a concise overview of your business (100-200 words). Include:</p>
                <ul className="list-disc pl-4 mt-1">
                  <li>What products/services you offer</li>
                  <li>What makes your business unique</li>
                  <li>Key value propositions</li>
                  <li>Any notable achievements or milestones</li>
                </ul>
              </div>
            }
            required
          >
            <textarea
              name="businessDescription"
              value={formData.businessDescription || ""}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              required
            ></textarea>
          </FormField>

          <FormField label="Company Logo" tooltip="Recommended size: 300x300px, Max size: 2MB">
            <FileUpload
              label=""
              accept=".jpg,.jpeg,.png,.svg"
              onChange={(files) => handleFileChange("companyLogo", files)}
              value={formData.companyLogo || []}
            />
          </FormField>
        </div>
      </div>



      <div className="mt-8 flex justify-end"></div>
    </div>
  )
}