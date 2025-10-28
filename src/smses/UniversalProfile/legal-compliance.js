"use client"
import { useEffect, useState } from "react"
import { HelpCircle } from "lucide-react"
import FormField from "./form-field"
import FileUpload from "./file-upload"
import './UniversalProfile.css';
import { db, auth } from "../../firebaseConfig"
import { doc, getDoc,updateDoc } from "firebase/firestore"

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

        // Load from the universalProfiles collection
        const docRef = doc(db, "universalProfiles", userId)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const profileData = docSnap.data()

          // Check if legalCompliance data exists
          if (profileData.legalCompliance) {
            const legalData = profileData.legalCompliance
            setFormData(legalData)
            updateData(legalData)
          } else {
            // If no data exists, initialize with passed data or default structure
            const initData = Object.keys(data).length > 0 ? data : {
              taxNumber: "",
              vatNumber: "",
              uifStatus: "",
              uifNumber: "",
              payeNumber: "",
              bbbeeLevel: "",
              coidaNumber: "",
              industryAccreditations: "",
              taxClearanceCert: [],
              vatCertificate: [],
              bbbeeCert: [],
              otherCerts: [],
              industryAccreditationDocs: [],
            }
            setFormData(initData)
            updateData(initData)
          }
        } else {
          // No profile exists yet, use passed data or default structure
          const initData = Object.keys(data).length > 0 ? data : {
            taxNumber: "",
            vatNumber: "",
            uifStatus: "",
            uifNumber: "",
            payeNumber: "",
            bbbeeLevel: "",
            coidaNumber: "",
            coidaNumber: "",
            industryAccreditations: "",
            taxClearanceCert: [],
            vatCertificate: [],
            bbbeeCert: [],
            otherCerts: [],
            industryAccreditationDocs: [],
          }
          setFormData(initData)
          updateData(initData)
        }
      } catch (error) {
        console.error("Error loading legal compliance details:", error)
        // Fallback to passed data on error
        setFormData(data)
        updateData(data)
      } finally {
        setIsLoading(false)
      }
    }

    loadLegalCompliance()
  }, []) // Empty dependency array to run only once on mount

  // Update form data when data prop changes (but only if not loading from Firebase)
  useEffect(() => {
    if (!isLoading && Object.keys(formData).length === 0) {
      setFormData(data)
    }
  }, [data, isLoading])

  const handleChange = (e) => {
    const { name, value } = e.target
    const updatedData = { ...formData, [name]: value }

    // Clear UIF number if status is not "registered"
    if (name === "uifStatus" && value !== "Registered") {
      updatedData.uifNumber = ""
    }

    // Clear document arrays when answer is "No"
    if (name === "hasAdvisoryStructure" && value === "No") {
      updatedData.advisoryStructureDocs = []
    }
    if (name === "hasPolicyControls" && value === "No") {
      updatedData.policyControlsDocs = []
    }
    if (name === "hasEthicsPolicy" && value === "No") {
      updatedData.ethicsPolicyDocs = []
    }
    if (name === "hasConflictResolution" && value === "No") {
      updatedData.conflictResolutionDocs = []
    }
    if (name === "hasWhistleblowingPolicy" && value === "No") {
      updatedData.whistleblowingPolicyDocs = []
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

  // Show loading state while fetching data
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
          <FormField label="Tax Number" >
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

          <FormField label="UIF Status" >
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
            <FormField label="UIF Reference Number" >
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
          <FormField label="B-BBEE Level" >
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
            <textarea
              name="industryAccreditations"
              value={formData.industryAccreditations || ""}
              onChange={handleChange}
              rows={2}
              placeholder="List any industry-specific accreditations"
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
            ></textarea>
          </FormField>
        </div>
      </div>
    </div>
  )
}