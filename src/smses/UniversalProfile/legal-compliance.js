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
          className={`absolute z-50 px-3 py-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg whitespace-nowrap max-w-xs ${
            position === "top"
              ? "bottom-full left-1/2 transform -translate-x-1/2 mb-2"
              : "top-full left-1/2 transform -translate-x-1/2 mt-2"
          }`}
          style={{ width: "max-content", maxWidth: "300px", whiteSpace: "normal" }}
        >
          {content}
          <div
            className={`absolute w-2 h-2 bg-gray-800 transform rotate-45 ${
              position === "top"
                ? "top-full left-1/2 -translate-x-1/2 -mt-1"
                : "bottom-full left-1/2 -translate-x-1/2 -mb-1"
            }`}
          />
        </div>
      )}
    </div>
  )
}

// CSS-safe custom Yes/No radio — avoids global stylesheet suppression of native inputs
const YesNoRadio = ({ value, onChange }) => (
  <div style={{ display: "flex", gap: "24px", marginTop: "6px" }}>
    {["Yes", "No"].map((val) => (
      <label
        key={val}
        onClick={() => onChange(val)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          cursor: "pointer",
          userSelect: "none",
          fontSize: "14px",
          fontWeight: "500",
          color: "#3d2b1f",
        }}
      >
        <div
          style={{
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            border: `2px solid ${value === val ? "#8B4513" : "#ccc"}`,
            backgroundColor: value === val ? "#8B4513" : "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "all 0.15s ease",
            boxShadow: value === val ? "0 0 0 3px rgba(139,69,19,0.12)" : "none",
          }}
        >
          {value === val && (
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "white" }} />
          )}
        </div>
        <span>{val}</span>
      </label>
    ))}
  </div>
)

export default function LegalCompliance({ data = {}, updateData }) {
  const [formData, setFormData] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [uploadingDocs, setUploadingDocs] = useState({})

  useEffect(() => {
    const loadLegalCompliance = async () => {
      try {
        setIsLoading(true)
        const userId = auth.currentUser?.uid
        if (!userId) { setIsLoading(false); return }

        const docRef = doc(db, "universalProfiles", userId)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const profileData = docSnap.data()
          if (profileData.legalCompliance) {
            const legalData = profileData.legalCompliance
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
      taxClearancePin: "",
      vatNumber: "",
      uifStatus: "",
      uifNumber: "",
      payeNumber: "",
      bbbeeLevel: "",
      coidaNumber: "",
      cipcAnnualReturn: "",
      pendingLegalJudgments: "",
      pendingLegalJudgmentsDetails: "",
      taxClearanceCert: [],
      vatCertificate: [],
      bbbeeCert: [],
      otherCerts: [],
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
    if (name === "uifStatus" && value !== "Registered") updatedData.uifNumber = ""
    setFormData(updatedData)
    updateData(updatedData)
  }

  const handleYesNo = (field, value) => {
    const updatedData = { ...formData, [field]: value }
    if (field === "pendingLegalJudgments" && value === "No") {
      updatedData.pendingLegalJudgmentsDetails = ""
    }
    setFormData(updatedData)
    updateData(updatedData)
  }

  const handleFileChange = (name, files) => {
    const updatedData = { ...formData, [name]: files }
    setFormData(updatedData)
    updateData(updatedData)
  }

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

      {/* 3 COLUMN GRID LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>

        {/* ROW 1: Tax Number, Tax Clearance PIN, PAYE Number */}
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

        <FormField label="Tax Clearance Number / PIN">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="text"
              name="taxClearancePin"
              value={formData.taxClearancePin || ""}
              onChange={handleChange}
              placeholder="e.g. 0000000000000"
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
            />
            <Tooltip
              content="Your Tax Clearance PIN is issued by SARS and can be verified on eFiling. It confirms your business's tax compliance status."
              position="top"
            >
              <HelpCircle className="w-4 h-4 text-brown-400 cursor-help hover:text-brown-600 transition-colors flex-shrink-0" />
            </Tooltip>
          </div>
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

        {/* ROW 2: VAT Number, COIDA Number, B-BBEE Level */}
        <FormField label="VAT Number">
          <input
            type="text"
            name="vatNumber"
            value={formData.vatNumber || ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
          />
        </FormField>

        <div>
          <div className="flex items-center gap-1 mb-2">
            <label className="block text-sm font-medium text-brown-700">
              COIDA No. (if applicable)
            </label>
            <Tooltip
              content="Compensation for Occupational Injuries and Diseases Act number. Required if you have employees and need to register for workplace injury compensation insurance."
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
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </FormField>

        {/* ROW 3: UIF Status, UIF Number (conditional), CIPC Annual Return */}
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
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </FormField>

        {formData.uifStatus === "Registered" ? (
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
        ) : (
          <div style={{ visibility: 'hidden' }}> {/* Placeholder to maintain grid alignment */} </div>
        )}

        <FormField label="CIPC Annual Return">
          <input
            type="date"
            name="cipcAnnualReturn"
            value={formData.cipcAnnualReturn || ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
          />
        </FormField>

        {/* ROW 4: Pending Legal Judgments (spans all 3 columns) */}
        <div style={{ gridColumn: 'span 3' }}>
          <FormField label="Are there any pending legal judgments against directors / shareholders?">
            <YesNoRadio
              value={formData.pendingLegalJudgments || ""}
              onChange={(val) => handleYesNo("pendingLegalJudgments", val)}
            />
          </FormField>
        </div>

        {/* ROW 5: Pending Legal Judgments Details (conditional, spans all 3 columns) */}
        {formData.pendingLegalJudgments === "Yes" && (
          <div style={{ gridColumn: 'span 3' }}>
            <FormField label="Please elaborate">
              <textarea
                name="pendingLegalJudgmentsDetails"
                value={formData.pendingLegalJudgmentsDetails || ""}
                onChange={handleChange}
                rows={3}
                placeholder="Describe the nature of the pending judgment(s), parties involved, and current status..."
                className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                style={{ resize: "vertical", fontFamily: "inherit", fontSize: "14px" }}
              />
            </FormField>
          </div>
        )}

      </div>
    </div>
  )
}