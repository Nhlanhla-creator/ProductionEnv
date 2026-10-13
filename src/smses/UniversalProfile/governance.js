"use client"
import { useEffect, useState } from "react"
import { HelpCircle, Plus, Trash2, X } from "lucide-react"
import FormField from "./form-field"
import FileUpload from "./file-upload"
import './UniversalProfile.css';
import { db, auth, storage } from "../../firebaseConfig"
import { getProfileOwnerId } from "../../utils/profile-context"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

// ─── HELPER DATA ──────────────────────────────────────────────────────────

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
  },
  {
    category: "Ethics",
    items: [
      { name: "Conflict of Interest Declarations", id: "conflictDeclarations" },
      { name: "Ethics Training Completed", id: "ethicsTraining" },
      { name: "Code of Conduct Signed", id: "codeOfConductSigned" },
    ]
  }
]

const strategicClarityQuestions = [
  { field: "strategicDirection", question: "Do you have clearly defined strategic priorities for the next 12–24 months?", dimension: "Strategic Direction", options: [{ value: "documented_shared", label: "Documented & shared" }, { value: "informal", label: "Informal" }, { value: "none", label: "None" }] },
  { field: "planningDepth", question: "Which of the following do you have? (Business plan, financial model, GTM, ops plan)", dimension: "Planning Depth", options: [{ value: "3_4_selected", label: "3–4 selected" }, { value: "1_2_selected", label: "1–2 selected" }, { value: "none", label: "None" }] },
  { field: "marketStrategy", question: "Do you have a clearly defined target market and value proposition?", dimension: "Market Strategy", options: [{ value: "clearly_defined", label: "Clearly defined & validated" }, { value: "partially_defined", label: "Partially defined" }, { value: "unclear", label: "Unclear" }] },
  { field: "executionRoadmap", question: "Do you have a clear roadmap to achieve your strategy?", dimension: "Execution Roadmap", options: [{ value: "detailed_roadmap", label: "Detailed roadmap with milestones" }, { value: "high_level_plan", label: "High-level plan" }, { value: "no_roadmap", label: "No roadmap" }] },
  { field: "decisionMaking", question: "How are key strategic decisions made?", dimension: "Decision-Making", options: [{ value: "structured_data_driven", label: "Structured & data-driven" }, { value: "semi_structured", label: "Semi-structured" }, { value: "informal_reactive", label: "Informal/reactive" }] },
  { field: "adaptability", question: "When strategy is not working, how do you respond?", dimension: "Adaptability", options: [{ value: "structured_review", label: "Structured review + adjustment" }, { value: "some_adjustment", label: "Some adjustment" }, { value: "reactive_none", label: "Reactive / none" }] },
];

const riskManagementQuestions = [
  { field: "riskIdentification", question: "Do you formally identify key business risks?", dimension: "Risk Identification", options: [{ value: "documented_risk_register", label: "Documented risk register" }, { value: "informal_awareness", label: "Informal awareness" }, { value: "no_structured_identification", label: "No structured identification" }] },
  { field: "riskAssessment", question: "How do you assess the impact and likelihood of risks?", dimension: "Risk Assessment", options: [{ value: "structured_assessment", label: "Structured assessment (scoring/prioritisation)" }, { value: "basic_informal", label: "Basic / informal assessment" }, { value: "no_formal_assessment", label: "No formal assessment" }] },
  { field: "riskMitigation", question: "Do you have mitigation plans for key risks?", dimension: "Risk Mitigation", options: [{ value: "defined_mitigation_plans", label: "Defined mitigation plans" }, { value: "some_mitigation_actions", label: "Some mitigation actions" }, { value: "no_clear_approach", label: "No clear mitigation approach" }] },
  { field: "businessContinuity", question: "Do you have a business continuity or contingency plan?", dimension: "Business Continuity", options: [{ value: "formal_documented_plan", label: "Formal documented plan" }, { value: "partial_informal_plan", label: "Partial / informal plan" }, { value: "none", label: "None" }] },
  { field: "crisisPreparedness", question: "How prepared are you to respond to unexpected disruptions?", dimension: "Crisis Preparedness", options: [{ value: "clear_response_protocols", label: "Clear response protocols & roles" }, { value: "some_readiness", label: "Some readiness" }, { value: "reactive_unprepared", label: "Reactive / unprepared" }] },
  { field: "riskOwnership", question: "Is risk management assigned to specific roles or leadership?", dimension: "Risk Ownership", options: [{ value: "clear_ownership", label: "Clear ownership & accountability" }, { value: "shared_unclear", label: "Shared but unclear ownership" }, { value: "no_ownership_defined", label: "No ownership defined" }] },
];

const transparencyReportingQuestions = [
  { field: "reportingFrequency", question: "How often do you report to stakeholders?", dimension: "Reporting Frequency", options: [{ value: "monthly", label: "Monthly" }, { value: "quarterly", label: "Quarterly" }, { value: "ad_hoc_none", label: "Ad hoc / none" }] },
  { field: "performanceReviewCycle", question: "How often is performance formally reviewed internally?", dimension: "Performance Review Cycle", options: [{ value: "monthly", label: "Monthly" }, { value: "quarterly_biannual", label: "Quarterly / Bi-annual" }, { value: "ad_hoc_none", label: "Ad hoc / none" }] },
  { field: "kpiMonitoring", question: "How structured is your KPI tracking?", dimension: "KPI Monitoring", options: [{ value: "defined_kpis_tracked", label: "Defined KPIs + tracked regularly" }, { value: "some_kpis_tracked", label: "Some KPIs tracked" }, { value: "no_structured_tracking", label: "No structured tracking" }] },
  { field: "stakeholderCommunication", question: "How do you communicate performance?", dimension: "Stakeholder Communication", options: [{ value: "structured_reports", label: "Structured (reports, dashboards, meetings)" }, { value: "informal_updates", label: "Informal updates" }, { value: "minimal", label: "Minimal" }] },
  { field: "complianceAndRisk", question: "Do you have formal compliance & risk processes?", dimension: "Compliance & Risk", options: [{ value: "formal_risk_register_audits", label: "Formal (risk register + audits)" }, { value: "partial_some_controls", label: "Partial (some controls)" }, { value: "none", label: "None" }] },
  { field: "dataGovernance", question: "How is data managed and protected?", dimension: "Data Governance", options: [{ value: "formal_popia_aligned", label: "Formal policies + controls (POPIA aligned)" }, { value: "basic_controls", label: "Basic controls" }, { value: "no_formal_approach", label: "No formal approach" }] },
  { field: "auditAndAssurance", question: "Do you conduct internal/external audits?", dimension: "Audit & Assurance", options: [{ value: "regular_internal_external", label: "Regular internal + external audits" }, { value: "occasional_audits", label: "Occasional audits" }, { value: "none", label: "None" }] },
];

const DEFAULT_INTEREST = {
  companyName: "",
  registrationNo: "",
  businessStatus: "",
  assignedTo: ""
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────

const Governance = ({ data, updateData }) => {
  const [activeTab, setActiveTab] = useState("environmental")
  const [formData, setFormData] = useState({
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
    activeInterests: [],
    previousInterests: [],
    // Environment fields
    exposureType: "none",
    complianceRequired: "no",
    permitsInPlace: "no",
    incidents: "none",
    controls: "none",
    // Social fields
    employmentPractices: "no",
    healthSafety: "no",
    fairTreatment: "no",
    skillsDevelopment: "no",
    supplyChain: "no",
    socialIncidents: "no",
  })
  const [isLoading, setIsLoading] = useState(true)

  // ─── DATA LOADING ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchGovernanceData = async () => {
      try {
        const isOnboarding = sessionStorage.getItem("isOnboarding") === "true";
        if (isOnboarding) {
          setFormData(prev => ({ ...prev, ...data }));
          setIsLoading(false);
          return;
        }

        const userId = await getProfileOwnerId();
        if (userId) {
          const docRef = doc(db, "universalProfiles", userId)
          const docSnap = await getDoc(docRef)

          if (docSnap.exists()) {
            const userData = docSnap.data()
            if (userData.governance) {
              setFormData(prev => ({ ...prev, ...userData.governance }))
              updateData("governance", userData.governance)
            } else {
              updateData("governance", formData)
            }
          } else {
            updateData("governance", formData)
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

  // ─── HANDLERS ────────────────────────────────────────────────────────────
  const handleChange = (e) => {
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
      const isOnboarding = sessionStorage.getItem("isOnboarding") === "true";
      if (!isOnboarding) {
        const userId = await getProfileOwnerId();
        if (userId) {
          const docRef = doc(db, "universalProfiles", userId)
          await updateDoc(docRef, { "governance.governanceChecklist": updatedChecklist })
        }
      }
    } catch (error) {
      console.error("Error saving checklist to Firebase:", error)
    }
  }

  const handleAddConflictOfInterest = () => {
    const newEntry = { id: Date.now(), personName: "", otherPositions: "", companyName: "", businessType: "" }
    const updated = { ...formData, conflictOfInterest: [...(formData.conflictOfInterest || []), newEntry] }
    setFormData(updated)
    updateData("governance", updated)
  }

  const handleConflictOfInterestChange = (id, field, value) => {
    const updatedEntries = (formData.conflictOfInterest || []).map(entry => entry.id === id ? { ...entry, [field]: value } : entry)
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

  const handleStrategicClarityChange = (field, value) => {
    const updated = { ...formData, strategicClarity: { ...(formData.strategicClarity || {}), [field]: value } }
    setFormData(updated)
    updateData("governance", updated)
  }

  const handleRiskManagementChange = (field, value) => {
    const updated = { ...formData, riskManagement: { ...(formData.riskManagement || {}), [field]: value } }
    setFormData(updated)
    updateData("governance", updated)
  }

  const handleTransparencyChange = (field, value) => {
    const updated = { ...formData, transparencyReporting: { ...(formData.transparencyReporting || {}), [field]: value } }
    setFormData(updated)
    updateData("governance", updated)
  }

  // Interest handlers
  const handleAddInterest = (type) => {
    const updated = { ...formData, [type]: [...(formData[type] || []), { ...DEFAULT_INTEREST, id: Date.now() }] }
    setFormData(updated)
    updateData("governance", updated)
  }

  const handleInterestChange = (type, id, field, value) => {
    const updatedList = (formData[type] || []).map(item => item.id === id ? { ...item, [field]: value } : item)
    const updated = { ...formData, [type]: updatedList }
    setFormData(updated)
    updateData("governance", updated)
  }

  const handleRemoveInterest = (type, id) => {
    const updatedList = (formData[type] || []).filter(item => item.id !== id)
    const updated = { ...formData, [type]: updatedList }
    setFormData(updated)
    updateData("governance", updated)
  }

  const getCompletedChecklistCount = () => {
    if (!formData.governanceChecklist) return 0
    return Object.values(formData.governanceChecklist).filter(Boolean).length
  }

  const totalChecklistItems = governanceChecklistItems.reduce((total, category) => total + category.items.length, 0)
  const completedCount = getCompletedChecklistCount()

  if (isLoading) {
    return <div className="governance-loading"><h2 className="text-2xl font-bold text-brown-800 mb-6">ESG Readiness</h2><p>Loading...</p></div>
  }

  // ─── RENDER HELPERS ──────────────────────────────────────────────────────
  const renderQuestionSection = (title, subtitle, questions, dataObject, changeHandler) => (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-brown-700 mt-6 mb-2 border-b border-brown-200 pb-2">{title}</h3>
      {subtitle && <p className="text-sm text-brown-500 mb-4">{subtitle}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {questions.map((item) => (
          <div key={item.field} className="bg-white border border-brown-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-brown-700 mb-1">{item.question}</label>
            <span className="text-xs text-brown-400 mb-2 block">{item.dimension}</span>
            <select value={(dataObject || {})[item.field] || ""} onChange={(e) => changeHandler(item.field, e.target.value)} className="w-full px-3 py-2 border border-brown-300 rounded-md text-sm text-brown-800 focus:outline-none focus:ring-2 focus:ring-brown-500 bg-white">
              <option value="">Select</option>
              {item.options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEnvironmentTab = () => (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-brown-700 mb-4">Environmental Impact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white border border-brown-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-brown-700 mb-1">Environmental Exposure Type</label>
            <select name="exposureType" value={formData.exposureType || "none"} onChange={handleChange} className="w-full px-3 py-2 border border-brown-300 rounded-md text-sm text-brown-800 focus:outline-none focus:ring-2 focus:ring-brown-500 bg-white">
              <option value="none">None</option>
              <option value="indirect">Indirect</option>
              <option value="direct">Direct</option>
            </select>
          </div>
          <div className="bg-white border border-brown-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-brown-700 mb-1">Environmental Compliance Required</label>
            <select name="complianceRequired" value={formData.complianceRequired || "no"} onChange={handleChange} className="w-full px-3 py-2 border border-brown-300 rounded-md text-sm text-brown-800 focus:outline-none focus:ring-2 focus:ring-brown-500 bg-white">
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <div className="bg-white border border-brown-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-brown-700 mb-1">Environmental Permits in Place</label>
            <select name="permitsInPlace" value={formData.permitsInPlace || "no"} onChange={handleChange} className="w-full px-3 py-2 border border-brown-300 rounded-md text-sm text-brown-800 focus:outline-none focus:ring-2 focus:ring-brown-500 bg-white">
              <option value="no">No</option>
              <option value="partial">Partial</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <div className="bg-white border border-brown-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-brown-700 mb-1">Environmental Incidents</label>
            <select name="incidents" value={formData.incidents || "none"} onChange={handleChange} className="w-full px-3 py-2 border border-brown-300 rounded-md text-sm text-brown-800 focus:outline-none focus:ring-2 focus:ring-brown-500 bg-white">
              <option value="none">None</option>
              <option value="minor">Minor</option>
              <option value="major">Major</option>
            </select>
          </div>
          <div className="bg-white border border-brown-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-brown-700 mb-1">Environmental Controls</label>
            <select name="controls" value={formData.controls || "none"} onChange={handleChange} className="w-full px-3 py-2 border border-brown-300 rounded-md text-sm text-brown-800 focus:outline-none focus:ring-2 focus:ring-brown-500 bg-white">
              <option value="none">None</option>
              <option value="basic">Basic</option>
              <option value="formal">Formal</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSocialTab = () => (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-brown-700 mb-4">Social Impact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white border border-brown-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-brown-700 mb-1">Employment Practices</label>
            <select name="employmentPractices" value={formData.employmentPractices || "no"} onChange={handleChange} className="w-full px-3 py-2 border border-brown-300 rounded-md text-sm text-brown-800 focus:outline-none focus:ring-2 focus:ring-brown-500 bg-white">
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <div className="bg-white border border-brown-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-brown-700 mb-1">Health & Safety</label>
            <select name="healthSafety" value={formData.healthSafety || "no"} onChange={handleChange} className="w-full px-3 py-2 border border-brown-300 rounded-md text-sm text-brown-800 focus:outline-none focus:ring-2 focus:ring-brown-500 bg-white">
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <div className="bg-white border border-brown-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-brown-700 mb-1">Fair Treatment & Grievances</label>
            <select name="fairTreatment" value={formData.fairTreatment || "no"} onChange={handleChange} className="w-full px-3 py-2 border border-brown-300 rounded-md text-sm text-brown-800 focus:outline-none focus:ring-2 focus:ring-brown-500 bg-white">
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <div className="bg-white border border-brown-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-brown-700 mb-1">Skills & Development</label>
            <select name="skillsDevelopment" value={formData.skillsDevelopment || "no"} onChange={handleChange} className="w-full px-3 py-2 border border-brown-300 rounded-md text-sm text-brown-800 focus:outline-none focus:ring-2 focus:ring-brown-500 bg-white">
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <div className="bg-white border border-brown-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-brown-700 mb-1">Supply Chain</label>
            <select name="supplyChain" value={formData.supplyChain || "no"} onChange={handleChange} className="w-full px-3 py-2 border border-brown-300 rounded-md text-sm text-brown-800 focus:outline-none focus:ring-2 focus:ring-brown-500 bg-white">
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <div className="bg-white border border-brown-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-brown-700 mb-1">Social Incidents</label>
            <select name="socialIncidents" value={formData.socialIncidents || "no"} onChange={handleChange} className="w-full px-3 py-2 border border-brown-300 rounded-md text-sm text-brown-800 focus:outline-none focus:ring-2 focus:ring-brown-500 bg-white">
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )

  const renderGovernanceTab = () => (
    <div>
      {/* 4-Column Layout for Core Fields */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "30px" }}>
        
        {/* Column 1: Policies and SOPs */}
        <div className="bg-white border border-brown-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-brown-800 mb-4 border-b border-brown-200 pb-2">Policies & SOPs</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-brown-700 mb-1">Required Policies Approved</label>
              <select name="corePolicies" value={formData.corePolicies || "no"} onChange={handleChange} className="w-full px-2 py-1.5 border border-brown-300 rounded-md text-xs bg-white">
                <option value="no">No</option>
                <option value="partial">Partial</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-brown-700 mb-1">Critical SOPs Documented</label>
              <select name="criticalSOPs" value={formData.criticalSOPs || "no"} onChange={handleChange} className="w-full px-2 py-1.5 border border-brown-300 rounded-md text-xs bg-white">
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-brown-700 mb-1">Policy Owner Assigned</label>
              <select name="policyOwner" value={formData.policyOwner || "no"} onChange={handleChange} className="w-full px-2 py-1.5 border border-brown-300 rounded-md text-xs bg-white">
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-brown-700 mb-1">Review Cycle Defined</label>
              <select name="reviewCycle" value={formData.reviewCycle || "no"} onChange={handleChange} className="w-full px-2 py-1.5 border border-brown-300 rounded-md text-xs bg-white">
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Column 2: Risk & Controls */}
        <div className="bg-white border border-brown-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-brown-800 mb-4 border-b border-brown-200 pb-2">Risk & Controls</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-brown-700 mb-1">Risk Register Maintained</label>
              <select name="riskRegister" value={formData.riskRegister || "no"} onChange={handleChange} className="w-full px-2 py-1.5 border border-brown-300 rounded-md text-xs bg-white">
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-brown-700 mb-1">Reporting Responsibility Assigned</label>
              <select name="reportingResponsibility" value={formData.reportingResponsibility || "no"} onChange={handleChange} className="w-full px-2 py-1.5 border border-brown-300 rounded-md text-xs bg-white">
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-brown-700 mb-1">Internal Controls Documented</label>
              <select name="internalControls" value={formData.internalControls || "no"} onChange={handleChange} className="w-full px-2 py-1.5 border border-brown-300 rounded-md text-xs bg-white">
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-brown-700 mb-1">Audit Schedule</label>
              <select name="auditSchedule" value={formData.auditSchedule || "no"} onChange={handleChange} className="w-full px-2 py-1.5 border border-brown-300 rounded-md text-xs bg-white">
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Column 3: Reporting & Compliance */}
        <div className="bg-white border border-brown-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-brown-800 mb-4 border-b border-brown-200 pb-2">Reporting & Compliance</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-brown-700 mb-1">Required Submissions On Time</label>
              <select name="submissionsOnTime" value={formData.submissionsOnTime || "no"} onChange={handleChange} className="w-full px-2 py-1.5 border border-brown-300 rounded-md text-xs bg-white">
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-brown-700 mb-1">Management Reports Delivered</label>
              <select name="managementReports" value={formData.managementReports || "no"} onChange={handleChange} className="w-full px-2 py-1.5 border border-brown-300 rounded-md text-xs bg-white">
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-brown-700 mb-1">Overdue Compliance Obligations</label>
              <select name="overdueCompliance" value={formData.overdueCompliance || "no"} onChange={handleChange} className="w-full px-2 py-1.5 border border-brown-300 rounded-md text-xs bg-white">
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-brown-700 mb-1">Data Protection Policy</label>
              <select name="dataProtection" value={formData.dataProtection || "no"} onChange={handleChange} className="w-full px-2 py-1.5 border border-brown-300 rounded-md text-xs bg-white">
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Column 4: Ownership & Transparency */}
        <div className="bg-white border border-brown-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-brown-800 mb-4 border-b border-brown-200 pb-2">Ownership & Oversight</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-brown-700 mb-1">Shareholder Register Maintained</label>
              <select name="shareholderRegister" value={formData.shareholderRegister || "no"} onChange={handleChange} className="w-full px-2 py-1.5 border border-brown-300 rounded-md text-xs bg-white">
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-brown-700 mb-1">Voting Rights Documented</label>
              <select name="votingRights" value={formData.votingRights || "no"} onChange={handleChange} className="w-full px-2 py-1.5 border border-brown-300 rounded-md text-xs bg-white">
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-brown-700 mb-1">Oversight Structure</label>
              <select name="oversightStructure" value={formData.oversightStructure || "none"} onChange={handleChange} className="w-full px-2 py-1.5 border border-brown-300 rounded-md text-xs bg-white">
                <option value="none">None</option>
                <option value="founder-only">Founder Only</option>
                <option value="advisory-board">Advisory Board</option>
                <option value="formal-board">Formal Board</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-brown-700 mb-1">Independent Oversight</label>
              <select name="independentOversight" value={formData.independentOversight || "no"} onChange={handleChange} className="w-full px-2 py-1.5 border border-brown-300 rounded-md text-xs bg-white">
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-brown-700 mb-1">Meeting Cadence</label>
              <select name="meetingCadence" value={formData.meetingCadence || "ad-hoc"} onChange={handleChange} className="w-full px-2 py-1.5 border border-brown-300 rounded-md text-xs bg-white">
                <option value="ad-hoc">Ad Hoc</option>
                <option value="quarterly">Quarterly</option>
                <option value="monthly">Monthly</option>
                <option value="regular">Regular</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Ethics Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-brown-700 mb-6 border-b border-brown-200 pb-2">Ethics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-brown-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-brown-700 mb-1">Conflict of Interest Declarations</label>
            <select name="conflictDeclarations" value={formData.conflictDeclarations || "no"} onChange={handleChange} className="w-full px-3 py-2 border border-brown-300 rounded-md text-sm text-brown-800 focus:outline-none focus:ring-2 focus:ring-brown-500 bg-white">
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <div className="bg-white border border-brown-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-brown-700 mb-1">Ethics Training Completed</label>
            <select name="ethicsTraining" value={formData.ethicsTraining || "no"} onChange={handleChange} className="w-full px-3 py-2 border border-brown-300 rounded-md text-sm text-brown-800 focus:outline-none focus:ring-2 focus:ring-brown-500 bg-white">
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <div className="bg-white border border-brown-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-brown-700 mb-1">Code of Conduct Signed</label>
            <select name="codeOfConductSigned" value={formData.codeOfConductSigned || "no"} onChange={handleChange} className="w-full px-3 py-2 border border-brown-300 rounded-md text-sm text-brown-800 focus:outline-none focus:ring-2 focus:ring-brown-500 bg-white">
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Interests Declaration Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-brown-700 mb-6 border-b border-brown-200 pb-2">Interests Declaration</h3>
        
        {/* Active Interests */}
        <div className="bg-white border border-brown-200 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-brown-700">Active Interests</h4>
            <button type="button" onClick={() => handleAddInterest('activeInterests')} className="flex items-center px-3 py-1 bg-brown-100 text-brown-700 rounded-md hover:bg-brown-200 text-sm"><Plus className="w-4 h-4 mr-1" /> Add Active</button>
          </div>
          {(formData.activeInterests || []).length === 0 ? (
            <p className="text-sm text-brown-500 italic">No active interests added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead><tr className="bg-brown-800 text-white"><th className="p-2 text-left">Assigned To</th><th className="p-2 text-left">Company</th><th className="p-2 text-left">Reg No.</th><th className="p-2 text-left">Status</th><th className="p-2 w-10"></th></tr></thead>
                <tbody>
                  {(formData.activeInterests || []).map((item, idx) => (
                    <tr key={item.id || idx} className="border-b border-brown-100">
                      <td className="p-2"><input type="text" value={item.assignedTo || ""} onChange={(e) => handleInterestChange('activeInterests', item.id, 'assignedTo', e.target.value)} className="w-full p-1 border rounded text-xs" placeholder="Person" /></td>
                      <td className="p-2"><input type="text" value={item.companyName || ""} onChange={(e) => handleInterestChange('activeInterests', item.id, 'companyName', e.target.value)} className="w-full p-1 border rounded text-xs" placeholder="Company" /></td>
                      <td className="p-2"><input type="text" value={item.registrationNo || ""} onChange={(e) => handleInterestChange('activeInterests', item.id, 'registrationNo', e.target.value)} className="w-full p-1 border rounded text-xs" placeholder="Reg No." /></td>
                      <td className="p-2">
                        <select value={item.businessStatus || ""} onChange={(e) => handleInterestChange('activeInterests', item.id, 'businessStatus', e.target.value)} className="w-full p-1 border rounded text-xs">
                          <option value="">Select</option><option value="Active">Active</option><option value="Dormant">Dormant</option><option value="Closed">Closed</option>
                        </select>
                      </td>
                      <td className="p-2 text-center"><button type="button" onClick={() => handleRemoveInterest('activeInterests', item.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Previous Interests */}
        <div className="bg-white border border-brown-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-brown-700">Previous Interests</h4>
            <button type="button" onClick={() => handleAddInterest('previousInterests')} className="flex items-center px-3 py-1 bg-brown-100 text-brown-700 rounded-md hover:bg-brown-200 text-sm"><Plus className="w-4 h-4 mr-1" /> Add Previous</button>
          </div>
          {(formData.previousInterests || []).length === 0 ? (
            <p className="text-sm text-brown-500 italic">No previous interests added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead><tr className="bg-brown-800 text-white"><th className="p-2 text-left">Assigned To</th><th className="p-2 text-left">Company</th><th className="p-2 text-left">Reg No.</th><th className="p-2 text-left">Status</th><th className="p-2 w-10"></th></tr></thead>
                <tbody>
                  {(formData.previousInterests || []).map((item, idx) => (
                    <tr key={item.id || idx} className="border-b border-brown-100">
                      <td className="p-2"><input type="text" value={item.assignedTo || ""} onChange={(e) => handleInterestChange('previousInterests', item.id, 'assignedTo', e.target.value)} className="w-full p-1 border rounded text-xs" placeholder="Person" /></td>
                      <td className="p-2"><input type="text" value={item.companyName || ""} onChange={(e) => handleInterestChange('previousInterests', item.id, 'companyName', e.target.value)} className="w-full p-1 border rounded text-xs" placeholder="Company" /></td>
                      <td className="p-2"><input type="text" value={item.registrationNo || ""} onChange={(e) => handleInterestChange('previousInterests', item.id, 'registrationNo', e.target.value)} className="w-full p-1 border rounded text-xs" placeholder="Reg No." /></td>
                      <td className="p-2">
                        <select value={item.businessStatus || ""} onChange={(e) => handleInterestChange('previousInterests', item.id, 'businessStatus', e.target.value)} className="w-full p-1 border rounded text-xs">
                          <option value="">Select</option><option value="Active">Active</option><option value="Dormant">Dormant</option><option value="Closed">Closed</option>
                        </select>
                      </td>
                      <td className="p-2 text-center"><button type="button" onClick={() => handleRemoveInterest('previousInterests', item.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* KPI Summary Table */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-brown-700 mb-6 border-b border-brown-200 pb-2">Governance KPI Summary</h3>
        <div className="bg-white border border-brown-200 rounded-lg overflow-hidden">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-brown-800 text-white">
                <th className="p-3 text-left font-semibold">Category</th>
                <th className="p-3 text-left font-semibold">KPI</th>
                <th className="p-3 text-center font-semibold">Target</th>
                <th className="p-3 text-center font-semibold">Actual</th>
                <th className="p-3 text-center font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {/* Policies & SOPs */}
              <tr className="border-b border-brown-100">
                <td rowSpan={3} className="p-3 text-brown-800 font-semibold bg-brown-50 align-top">Policies & SOPs</td>
                <td className="p-3 text-brown-700">Required policies approved and current</td>
                <td className="p-3 text-center">Yes</td>
                <td className="p-3 text-center">Yes</td>
                <td className="p-3 text-center"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 font-bold">✓</span></td>
              </tr>
              <tr className="border-b border-brown-100">
                <td className="p-3 text-brown-700">Critical SOPs documented and current</td>
                <td className="p-3 text-center">Yes</td>
                <td className="p-3 text-center">Partial</td>
                <td className="p-3 text-center"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 text-yellow-700 font-bold">!</span></td>
              </tr>
              <tr className="border-b border-brown-100">
                <td className="p-3 text-brown-700">Required policy acknowledgements completed</td>
                <td className="p-3 text-center">100%</td>
                <td className="p-3 text-center">85%</td>
                <td className="p-3 text-center"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 text-yellow-700 font-bold">!</span></td>
              </tr>
              
              {/* Risk & Controls */}
              <tr className="border-b border-brown-100">
                <td rowSpan={3} className="p-3 text-brown-800 font-semibold bg-brown-50 align-top">Risk & Controls</td>
                <td className="p-3 text-brown-700">High/critical risks with owner and treatment plan</td>
                <td className="p-3 text-center">100%</td>
                <td className="p-3 text-center">100%</td>
                <td className="p-3 text-center"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 font-bold">✓</span></td>
              </tr>
              <tr className="border-b border-brown-100">
                <td className="p-3 text-brown-700">Scheduled control checks completed</td>
                <td className="p-3 text-center">100%</td>
                <td className="p-3 text-center">75%</td>
                <td className="p-3 text-center"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 text-yellow-700 font-bold">!</span></td>
              </tr>
              <tr className="border-b border-brown-100">
                <td className="p-3 text-brown-700">Overdue high-priority risk actions</td>
                <td className="p-3 text-center">0</td>
                <td className="p-3 text-center">2</td>
                <td className="p-3 text-center"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 font-bold">✗</span></td>
              </tr>

              {/* Reporting & Compliance */}
              <tr className="border-b border-brown-100">
                <td rowSpan={3} className="p-3 text-brown-800 font-semibold bg-brown-50 align-top">Reporting & Compliance</td>
                <td className="p-3 text-brown-700">Required submissions completed on time</td>
                <td className="p-3 text-center">100%</td>
                <td className="p-3 text-center">100%</td>
                <td className="p-3 text-center"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 font-bold">✓</span></td>
              </tr>
              <tr className="border-b border-brown-100">
                <td className="p-3 text-brown-700">Management reports delivered on time</td>
                <td className="p-3 text-center">100%</td>
                <td className="p-3 text-center">90%</td>
                <td className="p-3 text-center"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 text-yellow-700 font-bold">!</span></td>
              </tr>
              <tr className="border-b border-brown-100">
                <td className="p-3 text-brown-700">Overdue compliance obligations</td>
                <td className="p-3 text-center">0</td>
                <td className="p-3 text-center">0</td>
                <td className="p-3 text-center"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 font-bold">✓</span></td>
              </tr>

              {/* Ownership & Transparency */}
              <tr className="border-b border-brown-100">
                <td rowSpan={2} className="p-3 text-brown-800 font-semibold bg-brown-50 align-top">Ownership & Transparency</td>
                <td className="p-3 text-brown-700">Required ownership/control records current</td>
                <td className="p-3 text-center">Yes</td>
                <td className="p-3 text-center">Yes</td>
                <td className="p-3 text-center"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 font-bold">✓</span></td>
              </tr>
              <tr className="border-b border-brown-100">
                <td className="p-3 text-brown-700">Required conflict-of-interest declarations current</td>
                <td className="p-3 text-center">Yes</td>
                <td className="p-3 text-center">No</td>
                <td className="p-3 text-center"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 font-bold">✗</span></td>
              </tr>

              {/* Oversight & Accountability */}
              <tr className="border-b border-brown-100">
                <td rowSpan={3} className="p-3 text-brown-800 font-semibold bg-brown-50 align-top">Oversight & Accountability</td>
                <td className="p-3 text-brown-700">Planned oversight meetings held</td>
                <td className="p-3 text-center">100%</td>
                <td className="p-3 text-center">100%</td>
                <td className="p-3 text-center"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 font-bold">✓</span></td>
              </tr>
              <tr className="border-b border-brown-100">
                <td className="p-3 text-brown-700">Meeting attendance</td>
                <td className="p-3 text-center">80%</td>
                <td className="p-3 text-center">85%</td>
                <td className="p-3 text-center"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 font-bold">✓</span></td>
              </tr>
              <tr className="border-b border-brown-100">
                <td className="p-3 text-brown-700">Decisions/actions completed by due date</td>
                <td className="p-3 text-center">100%</td>
                <td className="p-3 text-center">70%</td>
                <td className="p-3 text-center"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 text-yellow-700 font-bold">!</span></td>
              </tr>

              {/* Ethics & Conduct */}
              <tr className="border-b border-brown-100">
                <td rowSpan={3} className="p-3 text-brown-800 font-semibold bg-brown-50 align-top">Ethics & Conduct</td>
                <td className="p-3 text-brown-700">Required ethics training completed</td>
                <td className="p-3 text-center">100%</td>
                <td className="p-3 text-center">95%</td>
                <td className="p-3 text-center"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 font-bold">✓</span></td>
              </tr>
              <tr className="border-b border-brown-100">
                <td className="p-3 text-brown-700">Substantiated misconduct cases</td>
                <td className="p-3 text-center">0</td>
                <td className="p-3 text-center">1</td>
                <td className="p-3 text-center"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 text-yellow-700 font-bold">!</span></td>
              </tr>
              <tr className="border-b border-brown-100">
                <td className="p-3 text-brown-700">Cases resolved within agreed timeframe</td>
                <td className="p-3 text-center">100%</td>
                <td className="p-3 text-center">100%</td>
                <td className="p-3 text-center"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 font-bold">✓</span></td>
              </tr>

              {/* Leadership Representation */}
              <tr className="border-b border-brown-100">
                <td rowSpan={2} className="p-3 text-brown-800 font-semibold bg-brown-50 align-top">Leadership Representation</td>
                <td className="p-3 text-brown-700">Women in governing body</td>
                <td className="p-3 text-center">30%</td>
                <td className="p-3 text-center">25%</td>
                <td className="p-3 text-center"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 text-yellow-700 font-bold">!</span></td>
              </tr>
              <tr className="border-b border-brown-100">
                <td className="p-3 text-brown-700">Women in senior management</td>
                <td className="p-3 text-center">30%</td>
                <td className="p-3 text-center">35%</td>
                <td className="p-3 text-center"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 font-bold">✓</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <h2 className="text-2xl font-bold text-brown-800 mb-2">ESG Readiness</h2>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
          <HelpCircle className="w-5 h-5" />
          What is ESG?
        </h4>
        <p className="text-sm text-blue-700 mb-2">
          <strong>ESG</strong> stands for <strong>Environmental, Social, and Governance</strong>. It is a framework used to assess how a business manages risks and opportunities related to sustainability and ethical impact.
        </p>
        <ul className="text-sm text-blue-700 ml-4 list-disc space-y-1">
          <li><strong>Environmental:</strong> How the business impacts the natural environment (e.g., waste, emissions, resource use).</li>
          <li><strong>Social:</strong> How the business manages relationships with employees, suppliers, customers, and communities.</li>
          <li><strong>Governance:</strong> How the business is directed and controlled (e.g., leadership, policies, risk management, ethics).</li>
        </ul>
        <p className="text-sm text-blue-700 mt-2">
          Demonstrating strong ESG readiness helps attract funding, build trust with partners, and ensure long-term resilience.
        </p>
      </div>

      <div className="mb-6">
        <p className="text-brown-700 mb-4">
          Track your ESG readiness across Environment, Social, and Governance dimensions. This helps demonstrate your organizational maturity and compliance readiness.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-brown-200 mb-6">
        {[
          { id: "environmental", label: "Environment" },
          { id: "social", label: "Social" },
          { id: "governance", label: "Governance" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-brown-600 text-brown-800"
                : "border-transparent text-brown-500 hover:text-brown-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "environmental" && renderEnvironmentTab()}
      {activeTab === "social" && renderSocialTab()}
      {activeTab === "governance" && renderGovernanceTab()}
    </div>
  )
}

export default Governance