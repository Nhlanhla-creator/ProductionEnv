"use client"
import { useEffect, useState } from "react"
import { HelpCircle } from "lucide-react"
import FormField from "./form-field"
import FileUpload from "./file-upload"
import './UniversalProfile.css';
import { db, auth } from "../../firebaseConfig"
import { doc, getDoc } from "firebase/firestore"

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

// Compliance Checklist Items
const complianceChecklistItems = [
  {
    category: "Legal Templates",
    items: [
      { name: "Employment Contract (Basic)", id: "employmentContract" },
      { name: "NDA (Non-Disclosure Agreement)", id: "nda" },
      { name: "MOU (Memorandum of Understanding)", id: "mou" },
    ]
  },
  {
    category: "Policy Essentials",
    items: [
      { name: "Employee Code of Conduct", id: "codeOfConduct" },
      { name: "Leave Policy", id: "leavePolicy" },
      { name: "Disciplinary & Grievance Policy", id: "disciplinaryPolicy" },
      { name: "Health & Safety Policy", id: "healthSafetyPolicy" },
      { name: "Privacy & Data Protection Policy", id: "privacyPolicy" },
    ]
  },
  {
    category: "Specialised Policies",
    items: [
      { name: "Remote Work Policy", id: "remoteWorkPolicy" },
      { name: "Conflict of Interest Policy", id: "conflictInterestPolicy" },
      { name: "Intellectual Property Protection", id: "ipProtection" },
      { name: "Social Media Use Policy", id: "socialMediaPolicy" },
      { name: "Expense Reimbursement Policy", id: "expensePolicy" },
      { name: "Overtime & Compensation Policy", id: "overtimePolicy" },
      { name: "Termination Policy", id: "terminationPolicy" },
      { name: "Performance Review Policy", id: "performancePolicy" },
    ]
  }
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
              pin: "",
              pinExpiryDate: "",
              vatNumber: "",
              uifStatus: "",
              uifNumber: "",
              payeNumber: "",
              bbbeeLevel: "",
              bbbeeCertRenewalDate: "",
              cipcStatus: "",
              coidaNumber: "",
              industryAccreditations: "",
              taxClearanceCert: [],
              vatCertificate: [],
              bbbeeCert: [],
              otherCerts: [],
              industryAccreditationDocs: [],
              // Policies & Controls
              hasAdvisoryStructure: "",
              advisoryStructureDocs: [],
              hasPolicyControls: "",
              policyControlsDocs: [],
              // Conflict Resolution / Ethics
              hasEthicsPolicy: "",
              ethicsPolicyDocs: [],
              hasConflictResolution: "",
              conflictResolutionDocs: [],
              hasWhistleblowingPolicy: "",
              whistleblowingPolicyDocs: [],
              ethicsTrainingFrequency: "",
              lastEthicsTrainingDate: "",
              // Compliance Checklist
              complianceChecklist: {}
            }
            setFormData(initData)
            updateData(initData)
          }
        } else {
          // No profile exists yet, use passed data or default structure
          const initData = Object.keys(data).length > 0 ? data : {
            taxNumber: "",
            pin: "",
            pinExpiryDate: "",
            vatNumber: "",
            uifStatus: "",
            uifNumber: "",
            payeNumber: "",
            bbbeeLevel: "",
            bbbeeCertRenewalDate: "",
            cipcStatus: "",
            coidaNumber: "",
            industryAccreditations: "",
            taxClearanceCert: [],
            vatCertificate: [],
            bbbeeCert: [],
            otherCerts: [],
            industryAccreditationDocs: [],
            // Policies & Controls
            hasAdvisoryStructure: "",
            advisoryStructureDocs: [],
            hasPolicyControls: "",
            policyControlsDocs: [],
            // Conflict Resolution / Ethics
            hasEthicsPolicy: "",
            ethicsPolicyDocs: [],
            hasConflictResolution: "",
            conflictResolutionDocs: [],
            hasWhistleblowingPolicy: "",
            whistleblowingPolicyDocs: [],
            ethicsTrainingFrequency: "",
            lastEthicsTrainingDate: "",
            // Compliance Checklist
            complianceChecklist: {}
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

  const handleChecklistChange = (itemId, checked) => {
    const updatedChecklist = {
      ...formData.complianceChecklist,
      [itemId]: checked
    }
    
    const updatedData = {
      ...formData,
      complianceChecklist: updatedChecklist
    }
    
    setFormData(updatedData)
    updateData(updatedData)
  }

  // Calculate completed checklist items
  const getCompletedChecklistCount = () => {
    if (!formData.complianceChecklist) return 0
    return Object.values(formData.complianceChecklist).filter(Boolean).length
  }

  const totalChecklistItems = complianceChecklistItems.reduce((total, category) => total + category.items.length, 0)
  const completedCount = getCompletedChecklistCount()

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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1 mb-2">
                <label className="block text-sm font-medium text-brown-700">
                  PIN
                  <span className="text-red-500 ml-1"></span>
                </label>
                <Tooltip
                  content="Personal Identification Number from SARS. In future, this PIN will help us get your tax certificates directly from SARS, making the compliance process much easier and faster for you."
                  position="top"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-brown-400 cursor-help hover:text-brown-600 transition-colors" />
                </Tooltip>
              </div>
              <input
                type="text"
                name="pin"
                value={formData.pin || ""}
                onChange={handleChange}
                placeholder="Personal Identification Number"
                className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                required
              />
            </div>

            <FormField label="PIN Expiry Date" >
              <input
                type="date"
                name="pinExpiryDate"
                value={formData.pinExpiryDate || ""}
                onChange={handleDateChange}
                className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                required
              />
            </FormField>
          </div>

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
        </div>

        <div>
          <FormField label="PAYE Number">
            <input
              type="text"
              name="payeNumber"
              value={formData.payeNumber || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
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

            <FormField
              label="Certificate Renewal Date"

            >
              <input
                type="date"
                name="bbbeeCertRenewalDate"
                value={formData.bbbeeCertRenewalDate || ""}
                onChange={handleDateChange}
                className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                required={formData.bbbeeLevel && formData.bbbeeLevel !== "none" && formData.bbbeeLevel !== "exempt"}
              />
            </FormField>
          </div>

          <FormField label="CIPC Returns Status" >
            <select
              name="cipcStatus"
              value={formData.cipcStatus || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              required
            >
              <option value="">Select Status</option>
              {cipcStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

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

      {/* Compliance Checklist Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-brown-700 mt-6 mb-6 border-b border-brown-200 pb-2">
          Compliance Documents Checklist
        </h3>
        
        <div className="bg-brown-50 p-4 rounded-lg border border-brown-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-brown-800">Your Compliance Progress</h4>
            <span className="text-sm font-medium text-brown-700">
              {completedCount} of {totalChecklistItems} completed
            </span>
          </div>
          <div className="w-full bg-brown-200 rounded-full h-2.5">
            <div 
              className="bg-brown-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${(completedCount / totalChecklistItems) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-brown-600 mt-2">
            Tick the boxes to track which compliance documents you already have in place.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {complianceChecklistItems.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-white border border-brown-200 rounded-lg p-4">
              <h5 className="font-semibold text-brown-800 mb-3 text-lg">{category.category}</h5>
              <div className="space-y-3">
                {category.items.map((item, itemIndex) => (
                  <div key={item.id} className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      id={item.id}
                      checked={formData.complianceChecklist?.[item.id] || false}
                      onChange={(e) => handleChecklistChange(item.id, e.target.checked)}
                      className="h-4 w-4 text-brown-600 focus:ring-brown-500 border-brown-300 rounded mt-0.5 flex-shrink-0"
                    />
                    <label 
                      htmlFor={item.id} 
                      className={`text-sm leading-tight cursor-pointer select-none ${
                        formData.complianceChecklist?.[item.id] 
                          ? 'text-brown-800 line-through' 
                          : 'text-brown-600'
                      }`}
                    >
                      {item.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Policies & Controls Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-brown-700 mt-6 mb-6 border-b border-brown-200 pb-2">
          Policies & Controls
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <FormField label="Do you have advisory structure?" required>
              <select
                name="hasAdvisoryStructure"
                value={formData.hasAdvisoryStructure || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                required
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </FormField>

            {formData.hasAdvisoryStructure === "Yes" && (
              <div className="mt-4">

                <FileUpload
                  label="Upload Advisory Structure Documents"
                  value={formData.advisoryStructureDocs || []}
                  onChange={(files) => handleFileChange("advisoryStructureDocs", files)}
                  accept=".pdf,.doc,.docx"
                  multiple="true"
                  isUploading={uploadingDocs["advisoryStructureDocs"]}
                />
              </div>
            )}
          </div>

          <div>
            <FormField label="Do you have policy and controls?" required>
              <select
                name="hasPolicyControls"
                value={formData.hasPolicyControls || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                required
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </FormField>

            {formData.hasPolicyControls === "Yes" && (
              <div className="mt-4">

                <FileUpload
                  label="Upload Policy and Controls Documents"
                  value={formData.policyControlsDocs || []}
                  onChange={(files) => handleFileChange("policyControlsDocs", files)}
                  accept=".pdf,.doc,.docx"
                  multiple="true"
                  isUploading={uploadingDocs["policyControlsDocs"]}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conflict Resolution / Ethics Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-brown-700 mt-6 mb-6 border-b border-brown-200 pb-2">
          Conflict Resolution / Ethics
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div>
              <FormField label="Do you have an ethics policy?" required>
                <select
                  name="hasEthicsPolicy"
                  value={formData.hasEthicsPolicy || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                  required
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </FormField>

              {formData.hasEthicsPolicy === "Yes" && (
                <div className="mt-4">

                  <FileUpload
                    label="Upload Ethics Policy Documents"
                    value={formData.ethicsPolicyDocs || []}
                    onChange={(files) => handleFileChange("ethicsPolicyDocs", files)}
                    accept=".pdf,.doc,.docx"
                    multiple="true"
                    isUploading={uploadingDocs["ethicsPolicyDocs"]}
                  />
                </div>
              )}
            </div>

            <div>
              <FormField label="Do you have conflict resolution procedures?" required>
                <select
                  name="hasConflictResolution"
                  value={formData.hasConflictResolution || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                  required
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </FormField>

              {formData.hasConflictResolution === "Yes" && (
                <div className="mt-4">

                  <FileUpload
                    label="Upload Conflict Resolution Documents"
                    value={formData.conflictResolutionDocs || []}
                    onChange={(files) => handleFileChange("conflictResolutionDocs", files)}
                    accept=".pdf,.doc,.docx"
                    multiple="true"
                    isUploading={uploadingDocs["conflictResolutionDocs"]}
                  />
                </div>
              )}
            </div>

            <div>
              <FormField label="Do you have a whistleblowing policy?" required>
                <select
                  name="hasWhistleblowingPolicy"
                  value={formData.hasWhistleblowingPolicy || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                  required
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </FormField>

              {formData.hasWhistleblowingPolicy === "Yes" && (
                <div className="mt-4">

                  <FileUpload
                    label="Upload Whistleblowing Policy Documents"
                    value={formData.whistleblowingPolicyDocs || []}
                    onChange={(files) => handleFileChange("whistleblowingPolicyDocs", files)}
                    accept=".pdf,.doc,.docx"
                    multiple="true"
                    isUploading={uploadingDocs["whistleblowingPolicyDocs"]}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <FormField label="Ethics training frequency">
              <select
                name="ethicsTrainingFrequency"
                value={formData.ethicsTrainingFrequency || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              >
                <option value="">Select frequency</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Bi-annually">Bi-annually</option>
                <option value="Annually">Annually</option>
                <option value="As needed">As needed</option>
                <option value="None">None</option>
              </select>
            </FormField>

            <FormField label="Last ethics training date">
              <input
                type="date"
                name="lastEthicsTrainingDate"
                value={formData.lastEthicsTrainingDate || ""}
                onChange={handleDateChange}
                className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              />
            </FormField>

            <div className="bg-brown-50 p-4 rounded-md border border-brown-200">
              <h4 className="text-sm font-medium text-brown-700 mb-2">Ethics & Compliance Notes</h4>
              <p className="text-xs text-brown-600 leading-relaxed">
                Having proper ethics policies and conflict resolution procedures demonstrates good corporate governance
                and helps protect your organization from potential disputes and reputational risks. These documents
                are often required by investors and partners.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}