"use client"
import { useEffect, useState } from "react"
import { HelpCircle } from "lucide-react"
import FormField from "./form-field"
import FileUpload from "./file-upload"
import './UniversalProfile.css';
import { db, auth, storage } from "../../firebaseConfig"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

// Governance Checklist Items (moved from Legal Compliance)
const governanceChecklistItems = [
  {
    category: "Agreements",
    items: [
      { name: "Employment Contract (Basic)", id: "employmentContract" },
      { name: "NDA (Non-Disclosure Agreement)", id: "nda" },
      { name: "MOU (Memorandum of Understanding)", id: "mou" },
      { name: "Supplier Contracts", id: "suppliercontract" }
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
          className={`absolute z-50 px-3 py-2 text-xs text-white bg-brown-900 rounded-lg shadow-lg whitespace-normal max-w-xs ${
            position === "top"
              ? "bottom-full left-1/2 -translate-x-1/2 mb-2"
              : "top-full left-1/2 -translate-x-1/2 mt-2"
          }`}
          style={{ width: "max-content", maxWidth: "300px" }}
        >
          {content}
          <div
            className={`absolute w-2 h-2 bg-brown-900 transform rotate-45 ${
              position === "top" ? "top-full left-1/2 -translate-x-1/2 -mt-1" : "bottom-full left-1/2 -translate-x-1/2 -mb-1"
            }`}
          />
        </div>
      )}
    </div>
  )
}

const Governance = ({ data, updateData }) => {
  const [formData, setFormData] = useState({
    governanceChecklist: {},
    // Conflict Resolution / Ethics
    hasEthicsPolicy: "",
    ethicsPolicyDocs: [],
    hasConflictResolution: "",
    conflictResolutionDocs: [],
    hasWhistleblowingPolicy: "",
    whistleblowingPolicyDocs: [],
    ethicsTrainingFrequency: "",
    lastEthicsTrainingDate: "",
    // Transparency & Reporting (moved from OwnershipManagement)
    stakeholderReportingFrequency: "",
    performanceReviewCycle: "",
    stakeholderCommunicationMethods: "",
    performanceReviewProcess: "",
    complianceProcedures: "",
    dataManagementPolicies: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [uploadingDocs, setUploadingDocs] = useState({})

  useEffect(() => {
    const fetchGovernanceData = async () => {
      try {
        const user = auth.currentUser
        if (user) {
          const docRef = doc(db, "universalProfiles", user.uid)
          const docSnap = await getDoc(docRef)

          if (docSnap.exists()) {
            const userData = docSnap.data()
            if (userData.governance) {
              setFormData(userData.governance)
              updateData("governance", userData.governance)
            } else {
              // Initialize with default structure
              const initialData = {
                governanceChecklist: {},
                hasEthicsPolicy: "",
                ethicsPolicyDocs: [],
                hasConflictResolution: "",
                conflictResolutionDocs: [],
                hasWhistleblowingPolicy: "",
                whistleblowingPolicyDocs: [],
                ethicsTrainingFrequency: "",
                lastEthicsTrainingDate: "",
                stakeholderReportingFrequency: "",
                performanceReviewCycle: "",
                stakeholderCommunicationMethods: "",
                performanceReviewProcess: "",
                complianceProcedures: "",
                dataManagementPolicies: "",
              }
              setFormData(initialData)
              updateData("governance", initialData)
            }
          } else {
            // No profile exists yet, initialize with defaults
            const initialData = {
              governanceChecklist: {},
              hasEthicsPolicy: "",
              ethicsPolicyDocs: [],
              hasConflictResolution: "",
              conflictResolutionDocs: [],
              hasWhistleblowingPolicy: "",
              whistleblowingPolicyDocs: [],
              ethicsTrainingFrequency: "",
              lastEthicsTrainingDate: "",
              stakeholderReportingFrequency: "",
              performanceReviewCycle: "",
              stakeholderCommunicationMethods: "",
              performanceReviewProcess: "",
              complianceProcedures: "",
              dataManagementPolicies: "",
            }
            setFormData(initialData)
            updateData("governance", initialData)
          }
        }
      } catch (error) {
        console.error("Error fetching governance data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchGovernanceData()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    const updatedFormData = {
      ...formData,
      [name]: value,
    }
    setFormData(updatedFormData)
    updateData("governance", updatedFormData)
  }

  const handleDateChange = (e) => {
    const { name, value } = e.target
    const updatedFormData = {
      ...formData,
      [name]: value,
    }
    setFormData(updatedFormData)
    updateData("governance", updatedFormData)
  }

  const handleFileChange = async (name, files) => {
    if (!files || files.length === 0) {
      const updatedFormData = {
        ...formData,
        [name]: [],
      }
      setFormData(updatedFormData)
      updateData("governance", updatedFormData)
      return
    }

    setUploadingDocs((prev) => ({ ...prev, [name]: true }))

    try {
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          if (file.url) {
            return file
          }

          const user = auth.currentUser
          if (!user) throw new Error("User not authenticated")

          const fileName = `${Date.now()}_${file.name}`
          const storageRef = ref(storage, `governance/${user.uid}/${fileName}`)
          await uploadBytes(storageRef, file)
          const url = await getDownloadURL(storageRef)

          return { name: file.name, url, uploadedAt: new Date().toISOString() }
        })
      )

      const updatedFormData = {
        ...formData,
        [name]: uploadedFiles,
      }
      setFormData(updatedFormData)
      updateData("governance", updatedFormData)
    } catch (error) {
      console.error("Error uploading files:", error)
      alert("Failed to upload files. Please try again.")
    } finally {
      setUploadingDocs((prev) => ({ ...prev, [name]: false }))
    }
  }

  const handleChecklistChange = async (itemId, isChecked) => {
    const updatedChecklist = {
      ...formData.governanceChecklist,
      [itemId]: isChecked,
    }

    const updatedFormData = {
      ...formData,
      governanceChecklist: updatedChecklist,
    }

    setFormData(updatedFormData)
    updateData("governance", updatedFormData)

    // Save to Firebase
    try {
      const user = auth.currentUser
      if (user) {
        const docRef = doc(db, "universalProfiles", user.uid)
        await updateDoc(docRef, {
          "governance.governanceChecklist": updatedChecklist,
        })
      }
    } catch (error) {
      console.error("Error saving checklist to Firebase:", error)
    }
  }

  // Calculate completed checklist items
  const getCompletedChecklistCount = () => {
    if (!formData.governanceChecklist) return 0
    return Object.values(formData.governanceChecklist).filter(Boolean).length
  }

  const totalChecklistItems = governanceChecklistItems.reduce(
    (total, category) => total + category.items.length,
    0
  )
  const completedCount = getCompletedChecklistCount()

  // Show loading state while fetching data
  if (isLoading) {
    return (
      <div className="governance-loading">
        <h2 className="text-2xl font-bold text-brown-800 mb-6">Governance</h2>
        <p>Loading your governance information...</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-brown-800 mb-6">Governance</h2>

      <div className="mb-6">
        <p className="text-brown-700 mb-4">
          Track your governance documents, policies, and agreements. This helps demonstrate your organizational maturity and compliance readiness.
        </p>
      </div>

      {/* Governance Checklist Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-brown-700 mt-6 mb-6 border-b border-brown-200 pb-2">
          Policies & Controls
        </h3>

        <div className="bg-brown-50 p-4 rounded-lg border border-brown-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-brown-800">Your Governance Progress</h4>
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
            Tick the boxes to track which governance documents you already have in place.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {governanceChecklistItems.map((category, categoryIndex) => (
            <div
              key={categoryIndex}
              className="bg-white border border-brown-200 rounded-lg p-4"
            >
              <h5 className="font-semibold text-brown-800 mb-3 text-lg">
                {category.category}
              </h5>
              <div className="space-y-3">
                {category.items.map((item, itemIndex) => (
                  <div key={item.id} className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      id={item.id}
                      checked={formData.governanceChecklist?.[item.id] || false}
                      onChange={(e) =>
                        handleChecklistChange(item.id, e.target.checked)
                      }
                      className="h-4 w-4 text-brown-600 focus:ring-brown-500 border-brown-300 rounded mt-0.5 flex-shrink-0"
                    />
                    <label
                      htmlFor={item.id}
                      className="text-sm text-brown-700 cursor-pointer leading-tight"
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
                    multiple={true}
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
                    multiple={true}
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
                    multiple={true}
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

      {/* Transparency & Reporting Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-brown-700 mt-6 mb-6 border-b border-brown-200 pb-2">
          Transparency & Reporting
        </h3>

        {/* Stakeholder Reporting */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <FormField label="Stakeholder Reporting Frequency">
              <select
                name="stakeholderReportingFrequency"
                value={formData.stakeholderReportingFrequency || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              >
                <option value="">Select frequency</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="biannually">Bi-annually</option>
                <option value="annually">Annually</option>
                <option value="as_needed">As needed</option>
              </select>
            </FormField>
          </div>

          <div>
            <FormField label="Performance Review Cycle">
              <select
                name="performanceReviewCycle"
                value={formData.performanceReviewCycle || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              >
                <option value="">Select cycle</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="biannually">Bi-annually</option>
                <option value="annually">Annually</option>
                <option value="as_needed">As needed</option>
              </select>
            </FormField>
          </div>
        </div>

        {/* Reporting Methods */}
        <div className="mb-6">
          <FormField label="Stakeholder Communication Methods">
            <textarea
              name="stakeholderCommunicationMethods"
              value={formData.stakeholderCommunicationMethods || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              placeholder="Describe how you communicate with stakeholders (e.g., annual reports, quarterly meetings, digital dashboards, newsletters)"
              rows={3}
            />
          </FormField>
        </div>

        {/* Performance Review Process */}
        <div className="mb-6">
          <FormField label="Performance Review & KPI Monitoring Process">
            <textarea
              name="performanceReviewProcess"
              value={formData.performanceReviewProcess || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              placeholder="Describe your performance review process, key performance indicators (KPIs), and how progress is measured and reported"
              rows={4}
            />
          </FormField>
        </div>

        {/* Compliance Procedures */}
        <div className="mb-6">
          <FormField label="Compliance Monitoring & Risk Management Procedures">
            <textarea
              name="complianceProcedures"
              value={formData.complianceProcedures || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              placeholder="Describe your compliance monitoring procedures, risk management framework, audit processes, and regulatory reporting requirements"
              rows={4}
            />
          </FormField>
        </div>

        {/* Data Management & Privacy */}
        <div className="mb-6">
          <FormField label="Data Management & Privacy Policies">
            <textarea
              name="dataManagementPolicies"
              value={formData.dataManagementPolicies || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              placeholder="Describe your data management practices, privacy policies, and information security measures"
              rows={3}
            />
          </FormField>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
          <HelpCircle className="w-5 h-5" />
          Why track governance documents?
        </h4>
        <p className="text-sm text-blue-700">
          Having these policies and agreements in place demonstrates organizational maturity and helps with:
        </p>
        <ul className="text-sm text-blue-700 mt-2 ml-4 list-disc space-y-1">
          <li>Meeting funder and investor requirements</li>
          <li>Protecting your business legally</li>
          <li>Building trust with partners and clients</li>
          <li>Ensuring compliance with labor and business regulations</li>
        </ul>
      </div>
    </div>
  )
}

export default Governance