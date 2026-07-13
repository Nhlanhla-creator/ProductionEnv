"use client"
import { useEffect, useState } from "react"
import { HelpCircle, Plus, Trash2 } from "lucide-react"
import FormField from "./form-field"
import FileUpload from "./file-upload"
import './UniversalProfile.css';
import { db, auth, storage } from "../../firebaseConfig"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

// Governance Checklist Items (updated with Bribery and Corruption)
const governanceChecklistItems = [
  {
    category: "Agreements",
    items: [
      { name: "Employment Contract (Basic)", id: "employmentContract" },
      { name: "NDA (Non-Disclosure Agreement)", id: "nda" },
      { name: "MOU (Memorandum of Understanding)", id: "mou" },
      { name: "Supplier Contracts", id: "suppliercontract" },
      { name: "Customer Agreements", id: "customerAgreements" },
    ]
  },
  {
    category: "Policy Essentials",
    items: [
      { name: "Employee Code of Conduct", id: "codeOfConduct" },
      { name: "Ethics Policy", id: "ethicsPolicy" },
      { name: "Whistleblowing Policy", id: "whistleblowingPolicy" },
      { name: "Leave Policy", id: "leavePolicy" },
      { name: "Disciplinary & Grievance Policy", id: "disciplinaryPolicy" },
      { name: "Health & Safety Policy", id: "healthSafetyPolicy" },
      { name: "Privacy & Data Protection Policy", id: "privacyPolicy" },
      { name: "Bribery and Corruption Policy", id: "briberyCorruptionPolicy" },
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

// Strategic Clarity & Planning questions
const strategicClarityQuestions = [
  {
    field: "strategicDirection",
    question: "Do you have clearly defined strategic priorities for the next 12–24 months?",
    dimension: "Strategic Direction",
    options: [
      { value: "documented_shared", label: "Documented & shared" },
      { value: "informal", label: "Informal" },
      { value: "none", label: "None" },
    ],
  },
  {
    field: "planningDepth",
    question: "Which of the following do you have? (Business plan, financial model, GTM, ops plan)",
    dimension: "Planning Depth",
    options: [
      { value: "3_4_selected", label: "3–4 selected" },
      { value: "1_2_selected", label: "1–2 selected" },
      { value: "none", label: "None" },
    ],
  },
  {
    field: "marketStrategy",
    question: "Do you have a clearly defined target market and value proposition?",
    dimension: "Market Strategy",
    options: [
      { value: "clearly_defined", label: "Clearly defined & validated" },
      { value: "partially_defined", label: "Partially defined" },
      { value: "unclear", label: "Unclear" },
    ],
  },
  {
    field: "executionRoadmap",
    question: "Do you have a clear roadmap to achieve your strategy?",
    dimension: "Execution Roadmap",
    options: [
      { value: "detailed_roadmap", label: "Detailed roadmap with milestones" },
      { value: "high_level_plan", label: "High-level plan" },
      { value: "no_roadmap", label: "No roadmap" },
    ],
  },
  {
    field: "decisionMaking",
    question: "How are key strategic decisions made?",
    dimension: "Decision-Making",
    options: [
      { value: "structured_data_driven", label: "Structured & data-driven" },
      { value: "semi_structured", label: "Semi-structured" },
      { value: "informal_reactive", label: "Informal/reactive" },
    ],
  },
  {
    field: "adaptability",
    question: "When strategy is not working, how do you respond?",
    dimension: "Adaptability",
    options: [
      { value: "structured_review", label: "Structured review + adjustment" },
      { value: "some_adjustment", label: "Some adjustment" },
      { value: "reactive_none", label: "Reactive / none" },
    ],
  },
];

// Risk Management questions
const riskManagementQuestions = [
  {
    field: "riskIdentification",
    question: "Do you formally identify key business risks?",
    dimension: "Risk Identification",
    options: [
      { value: "documented_risk_register", label: "Documented risk register" },
      { value: "informal_awareness", label: "Informal awareness" },
      { value: "no_structured_identification", label: "No structured identification" },
    ],
  },
  {
    field: "riskAssessment",
    question: "How do you assess the impact and likelihood of risks?",
    dimension: "Risk Assessment",
    options: [
      { value: "structured_assessment", label: "Structured assessment (scoring/prioritisation)" },
      { value: "basic_informal", label: "Basic / informal assessment" },
      { value: "no_formal_assessment", label: "No formal assessment" },
    ],
  },
  {
    field: "riskMitigation",
    question: "Do you have mitigation plans for key risks?",
    dimension: "Risk Mitigation",
    options: [
      { value: "defined_mitigation_plans", label: "Defined mitigation plans" },
      { value: "some_mitigation_actions", label: "Some mitigation actions" },
      { value: "no_clear_approach", label: "No clear mitigation approach" },
    ],
  },
  {
    field: "businessContinuity",
    question: "Do you have a business continuity or contingency plan?",
    dimension: "Business Continuity",
    options: [
      { value: "formal_documented_plan", label: "Formal documented plan" },
      { value: "partial_informal_plan", label: "Partial / informal plan" },
      { value: "none", label: "None" },
    ],
  },
  {
    field: "crisisPreparedness",
    question: "How prepared are you to respond to unexpected disruptions?",
    dimension: "Crisis Preparedness",
    options: [
      { value: "clear_response_protocols", label: "Clear response protocols & roles" },
      { value: "some_readiness", label: "Some readiness" },
      { value: "reactive_unprepared", label: "Reactive / unprepared" },
    ],
  },
  {
    field: "riskOwnership",
    question: "Is risk management assigned to specific roles or leadership?",
    dimension: "Risk Ownership",
    options: [
      { value: "clear_ownership", label: "Clear ownership & accountability" },
      { value: "shared_unclear", label: "Shared but unclear ownership" },
      { value: "no_ownership_defined", label: "No ownership defined" },
    ],
  },
];

// Transparency & Reporting questions
const transparencyReportingQuestions = [
  {
    field: "reportingFrequency",
    question: "How often do you report to stakeholders?",
    dimension: "Reporting Frequency",
    options: [
      { value: "monthly", label: "Monthly" },
      { value: "quarterly", label: "Quarterly" },
      { value: "ad_hoc_none", label: "Ad hoc / none" },
    ],
  },
  {
    field: "performanceReviewCycle",
    question: "How often is performance formally reviewed internally?",
    dimension: "Performance Review Cycle",
    options: [
      { value: "monthly", label: "Monthly" },
      { value: "quarterly_biannual", label: "Quarterly / Bi-annual" },
      { value: "ad_hoc_none", label: "Ad hoc / none" },
    ],
  },
  {
    field: "kpiMonitoring",
    question: "How structured is your KPI tracking?",
    dimension: "KPI Monitoring",
    options: [
      { value: "defined_kpis_tracked", label: "Defined KPIs + tracked regularly" },
      { value: "some_kpis_tracked", label: "Some KPIs tracked" },
      { value: "no_structured_tracking", label: "No structured tracking" },
    ],
  },
  {
    field: "stakeholderCommunication",
    question: "How do you communicate performance?",
    dimension: "Stakeholder Communication",
    options: [
      { value: "structured_reports", label: "Structured (reports, dashboards, meetings)" },
      { value: "informal_updates", label: "Informal updates" },
      { value: "minimal", label: "Minimal" },
    ],
  },
  {
    field: "complianceAndRisk",
    question: "Do you have formal compliance & risk processes?",
    dimension: "Compliance & Risk",
    options: [
      { value: "formal_risk_register_audits", label: "Formal (risk register + audits)" },
      { value: "partial_some_controls", label: "Partial (some controls)" },
      { value: "none", label: "None" },
    ],
  },
  {
    field: "dataGovernance",
    question: "How is data managed and protected?",
    dimension: "Data Governance",
    options: [
      { value: "formal_popia_aligned", label: "Formal policies + controls (POPIA aligned)" },
      { value: "basic_controls", label: "Basic controls" },
      { value: "no_formal_approach", label: "No formal approach" },
    ],
  },
  {
    field: "auditAndAssurance",
    question: "Do you conduct internal/external audits?",
    dimension: "Audit & Assurance",
    options: [
      { value: "regular_internal_external", label: "Regular internal + external audits" },
      { value: "occasional_audits", label: "Occasional audits" },
      { value: "none", label: "None" },
    ],
  },
];

const Governance = ({ data, updateData }) => {
  const [formData, setFormData] = useState({
    governanceChecklist: {},
    // Conflict of Interest
    membersHaveMultipleBusinesses: "",
    conflictOfInterest: [],
    // Ethics Training
    ethicsTrainingFrequency: "",
    lastEthicsTrainingDate: "",
    // Strategic Clarity & Planning
    strategicClarity: {},
    // Risk Management
    riskManagement: {},
    // Transparency & Reporting
    transparencyReporting: {},
    // Risk & Legal
    adverseListings: "",
    adverseListingsDetails: "",
    courtNotices: "",
    courtNoticesDetails: "",
  })
  const [isLoading, setIsLoading] = useState(true)

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
              const governanceData = {
                ...userData.governance,
              }
              setFormData(governanceData)
              updateData("governance", governanceData)
            } else {
              const initialData = {
                governanceChecklist: {},
                membersHaveMultipleBusinesses: "",
                conflictOfInterest: [],
                ethicsTrainingFrequency: "",
                lastEthicsTrainingDate: "",
                strategicClarity: {},
                riskManagement: {},
                transparencyReporting: {},
                adverseListings: "",
                adverseListingsDetails: "",
                courtNotices: "",
                courtNoticesDetails: "",
              }
              setFormData(initialData)
              updateData("governance", initialData)
            }
          } else {
            const initialData = {
              governanceChecklist: {},
              membersHaveMultipleBusinesses: "",
              conflictOfInterest: [],
              ethicsTrainingFrequency: "",
              lastEthicsTrainingDate: "",
              strategicClarity: {},
              riskManagement: {},
              transparencyReporting: {},
              adverseListings: "",
              adverseListingsDetails: "",
              courtNotices: "",
              courtNoticesDetails: "",
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
    const updatedFormData = { ...formData, [name]: value }
    setFormData(updatedFormData)
    updateData("governance", updatedFormData)
  }

  const handleDateChange = (e) => {
    const { name, value } = e.target
    const updatedFormData = { ...formData, [name]: value }
    setFormData(updatedFormData)
    updateData("governance", updatedFormData)
  }

  const handleChecklistChange = async (itemId, isChecked) => {
    const updatedChecklist = { ...formData.governanceChecklist, [itemId]: isChecked }
    const updatedFormData = { ...formData, governanceChecklist: updatedChecklist }
    setFormData(updatedFormData)
    updateData("governance", updatedFormData)

    try {
      const user = auth.currentUser
      if (user) {
        const docRef = doc(db, "universalProfiles", user.uid)
        await updateDoc(docRef, { "governance.governanceChecklist": updatedChecklist })
      }
    } catch (error) {
      console.error("Error saving checklist to Firebase:", error)
    }
  }

  // Conflict of Interest handlers
  const handleAddConflictOfInterest = () => {
    const newEntry = {
      id: Date.now(),
      personName: "",
      otherPositions: "",
      companyName: "",
      businessType: "",
    }
    const updated = { 
      ...formData, 
      conflictOfInterest: [...(formData.conflictOfInterest || []), newEntry] 
    }
    setFormData(updated)
    updateData("governance", updated)
  }

  const handleConflictOfInterestChange = (id, field, value) => {
    const updatedEntries = (formData.conflictOfInterest || []).map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    )
    const updated = { ...formData, conflictOfInterest: updatedEntries }
    setFormData(updated)
    updateData("governance", updated)
  }

  const handleRemoveConflictOfInterest = (id) => {
    const updatedEntries = (formData.conflictOfInterest || []).filter(entry => entry.id !== id)
    const updated = { ...formData, conflictOfInterest: updatedEntries }
    setFormData(updated)
    updateData("governance", updated)
  }

  // Strategic Clarity handler
  const handleStrategicClarityChange = (field, value) => {
    const updated = { ...formData, strategicClarity: { ...(formData.strategicClarity || {}), [field]: value } }
    setFormData(updated)
    updateData("governance", updated)
  }

  // Risk Management handler
  const handleRiskManagementChange = (field, value) => {
    const updated = { ...formData, riskManagement: { ...(formData.riskManagement || {}), [field]: value } }
    setFormData(updated)
    updateData("governance", updated)
  }

  // Transparency & Reporting handler
  const handleTransparencyChange = (field, value) => {
    const updated = { ...formData, transparencyReporting: { ...(formData.transparencyReporting || {}), [field]: value } }
    setFormData(updated)
    updateData("governance", updated)
  }

  // Calculate completed checklist items
  const getCompletedChecklistCount = () => {
    if (!formData.governanceChecklist) return 0
    return Object.values(formData.governanceChecklist).filter(Boolean).length
  }

  const totalChecklistItems = governanceChecklistItems.reduce(
    (total, category) => total + category.items.length, 0
  )
  const completedCount = getCompletedChecklistCount()

  if (isLoading) {
    return (
      <div className="governance-loading">
        <h2 className="text-2xl font-bold text-brown-800 mb-6">Governance</h2>
        <p>Loading your governance information...</p>
      </div>
    )
  }

  // Generic section renderer for dropdown-based question sets - 3 per row
  const renderQuestionSection = (title, subtitle, questions, dataObject, changeHandler) => (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-brown-700 mt-6 mb-2 border-b border-brown-200 pb-2">{title}</h3>
      {subtitle && <p className="text-sm text-brown-500 mb-4">{subtitle}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {questions.map((item) => (
          <div key={item.field} className="bg-white border border-brown-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-brown-700 mb-1">{item.question}</label>
            <span className="text-xs text-brown-400 mb-2 block">{item.dimension}</span>
            <select
              value={(dataObject || {})[item.field] || ""}
              onChange={(e) => changeHandler(item.field, e.target.value)}
              className="w-full px-3 py-2 border border-brown-300 rounded-md text-sm text-brown-800 focus:outline-none focus:ring-2 focus:ring-brown-500 bg-white"
            >
              <option value="">Select</option>
              {item.options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );

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
            Add checkmark if you have these policies and they are enforced. Leave blank if you do not have them or they are not enforced.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {governanceChecklistItems.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-white border border-brown-200 rounded-lg p-4">
              <h5 className="font-semibold text-brown-800 mb-3 text-lg">{category.category}</h5>
              <div className="space-y-3">
                {category.items.map((item) => (
                  <div key={item.id} className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      id={item.id}
                      checked={formData.governanceChecklist?.[item.id] || false}
                      onChange={(e) => handleChecklistChange(item.id, e.target.checked)}
                      className="h-4 w-4 text-brown-600 focus:ring-brown-500 border-brown-300 rounded mt-0.5 flex-shrink-0"
                    />
                    <label htmlFor={item.id} className="text-sm text-brown-700 cursor-pointer leading-tight">
                      {item.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conflict of Interest Section - FIXED */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-brown-700 mt-6 mb-6 border-b border-brown-200 pb-2">
          Conflict of Interest
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <FormField label="Do your members have more than one business?" required>
              <select
                name="membersHaveMultipleBusinesses"
                value={formData.membersHaveMultipleBusinesses || ""}
                onChange={(e) => {
                  const newValue = e.target.value;
                  // Create updated object with the new value
                  const updatedFormData = { 
                    ...formData, 
                    membersHaveMultipleBusinesses: newValue 
                  };
                  
                  // If "No" is selected, clear conflict of interest entries
                  if (newValue === "No") {
                    updatedFormData.conflictOfInterest = [];
                  }
                  
                  setFormData(updatedFormData);
                  updateData("governance", updatedFormData);
                }}
                className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                required
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </FormField>
          </div>
        </div>

        {formData.membersHaveMultipleBusinesses === "Yes" && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-brown-700">Members' Other Business Interests</h4>
              <button
                type="button"
                onClick={handleAddConflictOfInterest}
                className="flex items-center gap-2 px-4 py-2 bg-stone-700 text-white rounded-md hover:bg-stone-800 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Member
              </button>
            </div>

            {(formData.conflictOfInterest || []).length === 0 && (
              <p className="text-sm text-brown-500 italic">No members added yet. Click "Add Member" to add.</p>
            )}

            {(formData.conflictOfInterest || []).map((entry, index) => (
              <div key={entry.id} className="bg-white border border-brown-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-brown-700">Member #{index + 1}</h5>
                  <button
                    type="button"
                    onClick={() => handleRemoveConflictOfInterest(entry.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-brown-700 mb-1">Person Name</label>
                    <input
                      type="text"
                      value={entry.personName || ""}
                      onChange={(e) => handleConflictOfInterestChange(entry.id, "personName", e.target.value)}
                      className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brown-700 mb-1">Other Positions Held</label>
                    <input
                      type="text"
                      value={entry.otherPositions || ""}
                      onChange={(e) => handleConflictOfInterestChange(entry.id, "otherPositions", e.target.value)}
                      className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                      placeholder="e.g., Director, Shareholder"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brown-700 mb-1">Company Name</label>
                    <input
                      type="text"
                      value={entry.companyName || ""}
                      onChange={(e) => handleConflictOfInterestChange(entry.id, "companyName", e.target.value)}
                      className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                      placeholder="Company name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brown-700 mb-1">Business Type</label>
                    <input
                      type="text"
                      value={entry.businessType || ""}
                      onChange={(e) => handleConflictOfInterestChange(entry.id, "businessType", e.target.value)}
                      className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                      placeholder="e.g., Consulting, Manufacturing"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ethics Training Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-brown-700 mt-6 mb-6 border-b border-brown-200 pb-2">
          Ethics Training
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <FormField label="Ethics training frequency">
              <select
                name="ethicsTrainingFrequency"
                value={formData.ethicsTrainingFrequency || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              >
                <option value="">Select frequency</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Bi-annually">Bi-annually</option>
                <option value="Annually">Annually</option>
                <option value="As needed">As needed</option>
                <option value="None">None</option>
              </select>
            </FormField>
          </div>

          <div>
            <FormField label="Last ethics training date">
              <input
                type="date"
                name="lastEthicsTrainingDate"
                value={formData.lastEthicsTrainingDate || ""}
                onChange={handleDateChange}
                className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              />
            </FormField>
          </div>
        </div>
      </div>

      {/* Strategic Clarity & Planning Section */}
      {renderQuestionSection(
        "Strategic Clarity & Planning",
        "",
        strategicClarityQuestions,
        formData.strategicClarity,
        handleStrategicClarityChange
      )}

      {/* Risk Management Section */}
      {renderQuestionSection(
        "Risk Management",
        "",
        riskManagementQuestions,
        formData.riskManagement,
        handleRiskManagementChange
      )}

      {/* Transparency & Reporting Section */}
      {renderQuestionSection(
        "Transparency & Reporting",
        "",
        transparencyReportingQuestions,
        formData.transparencyReporting,
        handleTransparencyChange
      )}

      {/* Risk & Legal Section - FIXED */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-brown-700 mt-6 mb-6 border-b border-brown-200 pb-2">
          Risk & Legal
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FormField label="Are there any adverse listings against the business or its members?">
              <select
                name="adverseListings"
                value={formData.adverseListings || ""}
                onChange={(e) => {
                  const newValue = e.target.value;
                  const updatedFormData = { ...formData, adverseListings: newValue };
                  
                  if (newValue === "No") {
                    updatedFormData.adverseListingsDetails = "";
                  }
                  
                  setFormData(updatedFormData);
                  updateData("governance", updatedFormData);
                }}
                className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </FormField>
            {formData.adverseListings === "Yes" && (
              <div className="mt-2">
                <textarea
                  name="adverseListingsDetails"
                  value={formData.adverseListingsDetails || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                  placeholder="Please provide details of any adverse listings"
                  rows={3}
                ></textarea>
              </div>
            )}
          </div>

          <div>
            <FormField label="Are there any court notices or legal proceedings against the business?">
              <select
                name="courtNotices"
                value={formData.courtNotices || ""}
                onChange={(e) => {
                  const newValue = e.target.value;
                  const updatedFormData = { ...formData, courtNotices: newValue };
                  
                  if (newValue === "No") {
                    updatedFormData.courtNoticesDetails = "";
                  }
                  
                  setFormData(updatedFormData);
                  updateData("governance", updatedFormData);
                }}
                className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </FormField>
            {formData.courtNotices === "Yes" && (
              <div className="mt-2">
                <textarea
                  name="courtNoticesDetails"
                  value={formData.courtNoticesDetails || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                  placeholder="Please provide details of any court notices or legal proceedings"
                  rows={3}
                ></textarea>
              </div>
            )}
          </div>
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