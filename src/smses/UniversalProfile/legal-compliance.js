"use client"
import { useEffect, useState, useRef } from "react"
import { HelpCircle, ChevronDown, X, Check } from "lucide-react"
import FormField from "./form-field"
import FileUpload from "./file-upload"
import './UniversalProfile.css';
import { db, auth } from "../../firebaseConfig"
import { getProfileOwnerId } from "../../utils/profile-context"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { checkIsNGO } from "./ngoTaxonomy"

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

const ngoBbbeeOptions = [
  { value: "sed_75_plus", label: "B-BBEE SED Beneficiary Allocation (≥75% Black Beneficiaries)" },
  { value: "sed_under_75", label: "B-BBEE SED Beneficiary Allocation (<75% Black Beneficiaries)" },
  { value: "specialised_eme", label: "Exempt Specialised Enterprise (EME)" },
  { value: "specialised_qse", label: "Qualifying Specialised Enterprise (QSE)" },
  { value: "standard_scorecard", label: "Standard B-BBEE Scorecard (Level 1–8)" },
  { value: "not_applicable", label: "Not Applicable / None" },
]

const npoStatusOptions = [
  { value: "Registered", label: "Registered with DSD (NPO Directorate)" },
  { value: "Applied", label: "Application submitted / In progress" },
  { value: "Not registered", label: "Not registered as NPO" },
  { value: "Unsure", label: "Unsure / Under review" },
]

const pboStatusOptions = [
  { value: "Approved", label: "Approved PBO (SARS Section 30)" },
  { value: "Applied", label: "Application in progress with SARS TEU" },
  { value: "Not approved", label: "Not registered as PBO" },
  { value: "Unsure", label: "Unsure / Under review" },
]

const section18aStatusOptions = [
  { value: "Approved", label: "Approved for Section 18A receipts" },
  { value: "Applied", label: "Application submitted to SARS" },
  { value: "Not approved", label: "Not approved for S18A" },
  { value: "Unsure", label: "Unsure / Under review" },
]

const dsdReportingOptions = [
  { value: "Up to date", label: "Up to date – Narrative report submitted" },
  { value: "In preparation", label: "In preparation for submission" },
  { value: "Pending review", label: "Submitted – Awaiting DSD acknowledgement" },
  { value: "Overdue", label: "Overdue" },
  { value: "Not applicable", label: "Not applicable (newly established)" },
]

const ngoVatOptions = [
  { value: "exempt", label: "Exempt / Non-VAT vendor" },
  { value: "registered", label: "Registered VAT vendor" },
  { value: "not_registered", label: "Not registered" },
]

const uifStatusOptions = [
  { value: "Registered", label: "Registered with UIF" },
  { value: "Not yet registered", label: "Not yet registered" },
  { value: "In progress / Awaiting confirmation", label: "In progress / Awaiting confirmation" },
  { value: "Exempt", label: "Exempt / No paid employees" },
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

export default function LegalCompliance({ data = {}, updateData, isNGO: isNGOProp, allFormData }) {
  const isNGO = typeof isNGOProp === "boolean" ? isNGOProp : checkIsNGO(allFormData || {}, auth.currentUser)
  const legalStructure = allFormData?.entityOverview?.legalStructure || ""
  const [formData, setFormData] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [uploadingDocs, setUploadingDocs] = useState({})

  const getDefaultData = (passedData) => {
    if (passedData && Object.keys(passedData).length > 0) return passedData
    return {
      taxNumber: "",
      taxClearancePin: "",
      vatStatus: isNGO ? "exempt" : "",
      vatNumber: "",
      uifStatus: "",
      uifNumber: "",
      payeNumber: "",
      bbbeeLevel: "",
      bbbeeSedStatus: isNGO ? "sed_75_plus" : "",
      blackBeneficiaryPercentage: "",
      coidaNumber: "",
      cipcAnnualReturn: "",
      npoStatus: isNGO ? "Registered" : "",
      npoNumber: "",
      npoRegistrationDate: "",
      pboStatus: isNGO ? "Approved" : "",
      pboReferenceNumber: "",
      pboApprovalDate: "",
      section18aStatus: isNGO ? "Approved" : "",
      section18aApprovedScope: "",
      dsdAnnualReportStatus: isNGO ? "Up to date" : "",
      dsdLastSubmissionDate: "",
      pendingLegalJudgments: "No",
      pendingLegalJudgmentsDetails: "",
      taxClearanceCert: [],
      vatCertificate: [],
      bbbeeCert: [],
      otherCerts: [],
    }
  }

  useEffect(() => {
    const loadLegalCompliance = async () => {
      try {
        setIsLoading(true)
        const isOnboarding = sessionStorage.getItem("isOnboarding") === "true";
        if (isOnboarding) {
          setFormData(getDefaultData(data));
          setIsLoading(false);
          return;
        }

        const userId = await getProfileOwnerId();
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
        setFormData(getDefaultData(data))
        updateData(getDefaultData(data))
      } finally {
        setIsLoading(false)
      }
    }
    loadLegalCompliance()
  }, [])

  useEffect(() => {
    if (!isLoading && Object.keys(formData).length === 0) {
      setFormData(getDefaultData(data))
    }
  }, [data, isLoading])

  const handleChange = (e) => {
    const { name, value } = e.target
    const updatedData = { ...formData, [name]: value }
    if (name === "uifStatus" && value !== "Registered") updatedData.uifNumber = ""
    if (name === "vatStatus" && value !== "registered") updatedData.vatNumber = ""
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

  if (isLoading) {
    return (
      <div className="legal-compliance-loading">
        <h2 className="text-2xl font-bold text-brown-800 mb-6">Legal & Compliance</h2>
        <p>Loading compliance information...</p>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // NGO VIEW
  // ─────────────────────────────────────────────────────────────────────────────
  if (isNGO) {
    const isNPC = legalStructure === "NPC" || legalStructure.toLowerCase().includes("non-profit company");
    return (
      <div>
        <div style={{ marginBottom: "20px" }}>
          <h2 className="text-2xl font-bold text-brown-800" style={{ marginBottom: "4px" }}>Legal & Compliance</h2>
          <p style={{ color: "#7d5a50", fontSize: "14px" }}>
            Public benefit and non-profit registrations, SARS tax exemptions, employment compliance, and governance standing.
          </p>
        </div>

        {/* 1. Public Benefit & Non-Profit Registrations */}
        <div style={{
          backgroundColor: "#fdfbf9",
          border: "1px solid #ebd9c8",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "24px"
        }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            Public Benefit & Non-Profit Registrations
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            {/* NPO Registration Status */}
            <FormField label="DSD NPO Directorate Status">
              <select
                name="npoStatus"
                value={formData.npoStatus || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              >
                <option value="">Select NPO Status</option>
                {npoStatusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </FormField>

            {formData.npoStatus === "Registered" ? (
              <>
                <FormField label="NPO Registration Number">
                  <input
                    type="text"
                    name="npoNumber"
                    value={formData.npoNumber || ""}
                    onChange={handleChange}
                    placeholder="e.g. 123-456 NPO"
                    className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                  />
                </FormField>

                <FormField label="NPO Registration Date">
                  <input
                    type="date"
                    name="npoRegistrationDate"
                    value={formData.npoRegistrationDate || ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                  />
                </FormField>
              </>
            ) : (
              <div style={{ gridColumn: "span 2", display: "flex", alignItems: "center", color: "#8a6d58", fontSize: "13px" }}>
                NPO registration under the Non-Profit Organisations Act (DSD) is strongly recommended for non-profit credibility.
              </div>
            )}

            {/* SARS PBO Status (Section 30) */}
            <FormField label="SARS PBO Status (Section 30)">
              <select
                name="pboStatus"
                value={formData.pboStatus || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              >
                <option value="">Select PBO Status</option>
                {pboStatusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </FormField>

            {formData.pboStatus === "Approved" ? (
              <>
                <FormField label="PBO Reference Number">
                  <input
                    type="text"
                    name="pboReferenceNumber"
                    value={formData.pboReferenceNumber || ""}
                    onChange={handleChange}
                    placeholder="e.g. 930012345"
                    className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                  />
                </FormField>

                <FormField label="PBO Approval Date">
                  <input
                    type="date"
                    name="pboApprovalDate"
                    value={formData.pboApprovalDate || ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                  />
                </FormField>
              </>
            ) : (
              <div style={{ gridColumn: "span 2", display: "flex", alignItems: "center", color: "#8a6d58", fontSize: "13px" }}>
                PBO approval exempts the organisation from income tax on bona fide donations and public benefit activities.
              </div>
            )}

            {/* Section 18A Status */}
            <FormField label="Section 18A Tax Receipts Approval">
              <select
                name="section18aStatus"
                value={formData.section18aStatus || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              >
                <option value="">Select Section 18A Status</option>
                {section18aStatusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </FormField>

            {formData.section18aStatus === "Approved" ? (
              <div style={{ gridColumn: "span 2" }}>
                <FormField label="Approved 18A Activity Scope">
                  <input
                    type="text"
                    name="section18aApprovedScope"
                    value={formData.section18aApprovedScope || ""}
                    onChange={handleChange}
                    placeholder="e.g. Part I Welfare & Humanitarian, Education & Development"
                    className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                  />
                </FormField>
              </div>
            ) : (
              <div style={{ gridColumn: "span 2", display: "flex", alignItems: "center", color: "#8a6d58", fontSize: "13px" }}>
                Note: PBO approval does not automatically confer permission to issue Section 18A tax receipts. S18A receipts allow donors to deduct donations from their taxable income.
              </div>
            )}
          </div>
        </div>

        {/* 2. Tax & Statutory Reporting */}
        <div style={{
          backgroundColor: "#fdfbf9",
          border: "1px solid #ebd9c8",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "24px"
        }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "16px" }}>
            Tax & Statutory Reporting
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <FormField label="Income Tax Reference Number">
              <input
                type="text"
                name="taxNumber"
                value={formData.taxNumber || ""}
                onChange={handleChange}
                placeholder="e.g. 9000000000"
                className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              />
            </FormField>

            <FormField label="Tax Compliance PIN">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="text"
                  name="taxClearancePin"
                  value={formData.taxClearancePin || ""}
                  onChange={handleChange}
                  placeholder="SARS eFiling PIN"
                  className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                />
                <Tooltip
                  content="Your SARS Tax Clearance PIN confirms your organisation's tax compliance status with the South African Revenue Service."
                  position="top"
                >
                  <HelpCircle className="w-4 h-4 text-brown-400 cursor-help hover:text-brown-600 transition-colors flex-shrink-0" />
                </Tooltip>
              </div>
            </FormField>

            <FormField label="VAT Vendor Status">
              <select
                name="vatStatus"
                value={formData.vatStatus || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              >
                <option value="">Select VAT Status</option>
                {ngoVatOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </FormField>

            {formData.vatStatus === "registered" && (
              <FormField label="VAT Registration Number">
                <input
                  type="text"
                  name="vatNumber"
                  value={formData.vatNumber || ""}
                  onChange={handleChange}
                  placeholder="4XXXXXXXXX"
                  className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                />
              </FormField>
            )}

            <FormField label="DSD Annual Narrative Reporting">
              <select
                name="dsdAnnualReportStatus"
                value={formData.dsdAnnualReportStatus || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              >
                <option value="">Select DSD Report Status</option>
                {dsdReportingOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </FormField>

            <FormField label={isNPC ? "CIPC Annual Return Date" : "Founding Document Annual Review"}>
              <input
                type="date"
                name="cipcAnnualReturn"
                value={formData.cipcAnnualReturn || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              />
            </FormField>
          </div>
        </div>

        {/* 3. Employment Compliance */}
        <div style={{
          backgroundColor: "#fdfbf9",
          border: "1px solid #ebd9c8",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "24px"
        }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "16px" }}>
            Employment & Labour Compliance
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <FormField label="PAYE Registration Number">
              <input
                type="text"
                name="payeNumber"
                value={formData.payeNumber || ""}
                onChange={handleChange}
                placeholder="7XXXXXXXXX (if paid staff)"
                className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              />
            </FormField>

            <FormField label="UIF Registration Status">
              <select
                name="uifStatus"
                value={formData.uifStatus || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              >
                <option value="">Select UIF Status</option>
                {uifStatusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
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
                  placeholder="UXXXXXXXXX"
                  className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                />
              </FormField>
            ) : (
              <FormField label="COIDA Reference Number">
                <input
                  type="text"
                  name="coidaNumber"
                  value={formData.coidaNumber || ""}
                  onChange={handleChange}
                  placeholder="Compensation fund (if applicable)"
                  className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                />
              </FormField>
            )}

            {formData.uifStatus === "Registered" && (
              <FormField label="COIDA Reference Number">
                <input
                  type="text"
                  name="coidaNumber"
                  value={formData.coidaNumber || ""}
                  onChange={handleChange}
                  placeholder="Compensation fund (if applicable)"
                  className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                />
              </FormField>
            )}
          </div>
        </div>

        {/* 4. B-BBEE / Socio-Economic Development (SED) */}
        <div style={{
          backgroundColor: "#fdfbf9",
          border: "1px solid #ebd9c8",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "24px"
        }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "16px" }}>
            B-BBEE / Socio-Economic Development (SED) Standing
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "16px" }}>
            <FormField label="B-BBEE / SED Classification">
              <select
                name="bbbeeSedStatus"
                value={formData.bbbeeSedStatus || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              >
                <option value="">Select Classification</option>
                {ngoBbbeeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </FormField>

            <FormField label="% Black South African Beneficiaries">
              <input
                type="text"
                name="blackBeneficiaryPercentage"
                value={formData.blackBeneficiaryPercentage || ""}
                onChange={handleChange}
                placeholder="e.g. 85%"
                className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              />
            </FormField>
          </div>
          <div style={{ marginTop: "10px", color: "#7d5a50", fontSize: "12px", lineHeight: "1.5" }}>
            * Note: Non-profit organisations with ≥75% black beneficiaries qualify for full (100%) Socio-Economic Development (SED) scorecard recognition for corporate donors under the B-BBEE Codes of Good Practice.
          </div>
        </div>

        {/* 5. Legal Matters */}
        <div style={{
          backgroundColor: "#fdfbf9",
          border: "1px solid #ebd9c8",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "24px"
        }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#4a352f", marginBottom: "16px" }}>
            Legal Standing & Disclosures
          </h3>

          <FormField label="Are there any pending legal judgments or material litigation against the organisation, directors, trustees, or office bearers?">
            <YesNoRadio
              value={formData.pendingLegalJudgments || "No"}
              onChange={(val) => handleYesNo("pendingLegalJudgments", val)}
            />
          </FormField>

          {formData.pendingLegalJudgments === "Yes" && (
            <div style={{ marginTop: "16px" }}>
              <FormField label="Please elaborate on the nature and status of the matter">
                <textarea
                  name="pendingLegalJudgmentsDetails"
                  value={formData.pendingLegalJudgmentsDetails || ""}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe the nature of the matter, parties involved, financial exposure, and current status..."
                  className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
                  style={{ resize: "vertical", fontFamily: "inherit", fontSize: "14px" }}
                />
              </FormField>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SME DEFAULT VIEW (Preserved 100% backward-compatible)
  // ─────────────────────────────────────────────────────────────────────────────
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