"use client"

import React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"

const africanCountries = [
  "Algeria",
  "Angola",
  "Benin",
  "Botswana",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cameroon",
  "Central African Republic",
  "Chad",
  "Comoros",
  "Congo",
  "Côte d'Ivoire",
  "Djibouti",
  "Egypt",
  "Equatorial Guinea",
  "Eritrea",
  "Eswatini",
  "Ethiopia",
  "Gabon",
  "Gambia",
  "Ghana",
  "Guinea",
  "Guinea-Bissau",
  "Kenya",
  "Lesotho",
  "Liberia",
  "Libya",
  "Madagascar",
  "Malawi",
  "Mali",
  "Mauritania",
  "Mauritius",
  "Morocco",
  "Mozambique",
  "Namibia",
  "Niger",
  "Nigeria",
  "Rwanda",
  "Sao Tome and Principe",
  "Senegal",
  "Seychelles",
  "Sierra Leone",
  "Somalia",
  "South Africa",
  "South Sudan",
  "Sudan",
  "Tanzania",
  "Togo",
  "Tunisia",
  "Uganda",
  "Zambia",
  "Zimbabwe",
]

const funderTypes = [
  {
    category: "Equity Investors",
    types: [
      { id: "1.1", name: "Angel Investors", description: "Early-stage, high-risk" },
      { id: "1.2", name: "Venture Capital (VC) Firms", description: "Startups/growth-stage" },
      { id: "1.3", name: "Private Equity (PE) Firms", description: "Mature businesses, buyouts" },
      { id: "1.4", name: "Corporate Venture Capital (CVC)", description: "Strategic investments" },
      { id: "1.5", name: "Family Offices", description: "Wealthy families investing directly" },
      { id: "1.6", name: "Crowdfunding Platforms", description: "Equity-based" },
    ],
  },
  {
    category: "Debt Providers",
    types: [
      { id: "2.1", name: "Commercial Banks", description: "Term loans, overdrafts" },
      { id: "2.2", name: "Non-Banking Financial Companies (NBFCs)", description: "Flexible debt" },
      { id: "2.3", name: "Microfinance Institutions (MFIs)", description: "Small-ticket loans" },
      { id: "2.4", name: "Peer-to-Peer (P2P) Lenders", description: "Marketplace lending" },
      { id: "2.5", name: "Development Banks", description: "SME-focused, low-interest" },
    ],
  },
  {
    category: "Alternative Financing",
    types: [
      { id: "3.1", name: "Revenue-Based Financing", description: "Repay via % revenue" },
      { id: "3.2", name: "Convertible Note Investors", description: "Debt → equity" },
      { id: "3.3", name: "Mezzanine Financing", description: "Hybrid debt/equity" },
      { id: "3.4", name: "Factoring Companies", description: "Invoice-based advances" },
      { id: "3.5", name: "Supply Chain Financiers", description: "Supplier/vendor credit" },
    ],
  },
  {
    category: "Grants & Subsidies",
    types: [
      { id: "4.1", name: "Government Grants", description: "Non-repayable, sector-specific" },
      { id: "4.2", name: "Corporate Grants", description: "CSR/foundation funding" },
      { id: "4.3", name: "International Aid Agencies", description: "UNDP, World Bank" },
    ],
  },
  {
    category: "Specialized Funders",
    types: [
      { id: "5.1", name: "Impact Investors", description: "ESG/social impact focus" },
      { id: "5.2", name: "Real Estate Financiers", description: "Property-backed loans" },
      { id: "5.3", name: "Equipment Lessors", description: "Hardware/tech leasing" },
      { id: "5.4", name: "Franchise Financiers", description: "Franchise-specific capital" },
    ],
  },
  {
    category: "Other",
    types: [
      { id: "6.1", name: "Incubators/Accelerators", description: "Funding + mentorship" },
      { id: "6.2", name: "Tokenized Investment Pools", description: "Crypto/DeFi" },
      { id: "6.3", name: "Trade Unions/Associations", description: "Sector-specific loans" },
    ],
  },
]

const fundingTypes = [
  { id: "ft1", name: "Equity Investment" },
  { id: "ft2", name: "Convertible Debt" },
  { id: "ft3", name: "Term Loans" },
  { id: "ft4", name: "Working Capital Loans" },
  { id: "ft5", name: "Revenue-Based Financing" },
  { id: "ft6", name: "Grants" },
  { id: "ft7", name: "Mezzanine Financing" },
  { id: "ft8", name: "Factoring" },
  { id: "ft9", name: "Supply Chain Financing" },
  { id: "ft10", name: "Equipment Leasing" },
  { id: "ft11", name: "Mentorship & Incubation" },
]

const funderToFundingMap = {
  "1.1": ["ft1", "ft2"],
  "1.2": ["ft1", "ft2"],
  "1.3": ["ft1", "ft7"],
  "1.4": ["ft1", "ft2"],
  "1.5": ["ft1", "ft2", "ft3"],
  "1.6": ["ft1"],
  "2.1": ["ft3", "ft4"],
  "2.2": ["ft3", "ft4", "ft5"],
  "2.3": ["ft3"],
  "2.4": ["ft3"],
  "2.5": ["ft3", "ft6"],
  "3.1": ["ft5"],
  "3.2": ["ft2"],
  "3.3": ["ft7"],
  "3.4": ["ft8"],
  "3.5": ["ft9"],
  "4.1": ["ft6"],
  "4.2": ["ft6"],
  "4.3": ["ft6"],
  "5.1": ["ft1", "ft2", "ft6"],
  "5.2": ["ft3"],
  "5.3": ["ft10"],
  "5.4": ["ft3", "ft1"],
  "6.1": ["ft11", "ft1", "ft2"],
  "6.2": ["ft1"],
  "6.3": ["ft3"],
}

const steps = [
  { id: 1, name: "Basic Information & Contact" },
  { id: 2, name: "Investment Criteria" },
  { id: 3, name: "Compliance & Reputation" },
  { id: 4, name: "Additional Preferences" },
  { id: 5, name: "Review & Submit" },
]

function FormTracker({ steps, currentStep, onStepClick }) {
  return (
    <div className="form-tracker">
      <div className="tracker-steps">
        {steps.map((step, index) => (
          <div key={step.id} className="tracker-step-container">
            {index < steps.length - 1 && (
              <div className={`tracker-connector ${currentStep > step.id ? "tracker-connector-active" : ""}`}></div>
            )}
            <button
              onClick={() => onStepClick(step.id)}
              className={`tracker-step ${currentStep === step.id ? "tracker-step-current" : currentStep > step.id ? "tracker-step-completed" : ""
                }`}
            >
              {currentStep > step.id ? "✓" : <span>{step.id}</span>}
            </button>
            <span className={`tracker-step-name ${currentStep === step.id ? "tracker-step-name-current" : ""}`}>
              {step.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function InvestorForm() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedFunderTypes, setSelectedFunderTypes] = useState([])
  const [selectedFundingTypes, setSelectedFundingTypes] = useState([])

  const [formData, setFormData] = useState({
    investorName: "",
    registrationNumber: "",
    website: "",
    country: "",
    languages: "",
    contactName: "",
    contactEmail: "",
    phoneNumber: "",
    preferredSectors: "",
    geographyFocus: "",
    stagePreference: "",
    ticketSize: "",
    esgFocus: "",
    localRequirements: "",
    businessRegistration: null,
    taxClearance: null,
    directorIDs: null,
    financialStatements: null,
    priorDeals: "",
    dealTimeline: "",
    ndaTemplate: false,
    ndaTemplateFile: null,
    mentorship: false,
    nonFinancialSupport: "",
  })

  const getAvailableFundingTypes = () => {
    const availableFundingTypeIds = new Set()
    selectedFunderTypes.forEach((funderId) => {
      const fundingTypeIds = funderToFundingMap[funderId] || []
      fundingTypeIds.forEach((id) => availableFundingTypeIds.add(id))
    })
    return fundingTypes.filter((ft) => availableFundingTypeIds.has(ft.id))
  }

  const availableFundingTypes = getAvailableFundingTypes()

  const handleFunderTypeChange = (funderId, isChecked) => {
    if (isChecked) {
      setSelectedFunderTypes((prev) => [...prev, funderId])
    } else {
      setSelectedFunderTypes((prev) => prev.filter((id) => id !== funderId))
      setSelectedFundingTypes((prev) => {
        const newAvailableFundingTypeIds = new Set()
        selectedFunderTypes
          .filter((id) => id !== funderId)
          .forEach((id) => {
            const fundingTypeIds = funderToFundingMap[id] || []
            fundingTypeIds.forEach((ftId) => newAvailableFundingTypeIds.add(ftId))
          })
        return prev.filter((id) => newAvailableFundingTypeIds.has(id))
      })
    }
  }

  const handleFundingTypeChange = (fundingTypeId, isChecked) => {
    if (isChecked) {
      setSelectedFundingTypes((prev) => [...prev, fundingTypeId])
    } else {
      setSelectedFundingTypes((prev) => prev.filter((id) => id !== fundingTypeId))
    }
  }

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleFileChange = (e) => {
    const { id, files } = e.target
    if (files && files.length > 0) {
      setFormData((prev) => ({ ...prev, [id]: files[0] }))
    }
  }

  const handleCheckboxChange = (id, checked) => {
    setFormData((prev) => ({ ...prev, [id]: checked }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    router.push("/dashboard")
  }

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
      window.scrollTo(0, 0)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  const goToStep = (step) => {
    if (step >= 1 && step <= steps.length) {
      setCurrentStep(step)
      window.scrollTo(0, 0)
    }
  }

  const renderForm = () => {
    switch (currentStep) {
      case 1:
        return (
          // ... same as before
          // code omitted for brevity
          <div className="form-section">
          ... (keep the same JSX)
          </div>
        )
      case 2:
        return (
          // ... same as before
          <div className="form-section">
          ... (keep the same JSX)
          </div>
        )
      case 3:
        return (
          // ... same as before
          <div className="form-section">
          ... (keep the same JSX)
          </div>
        )
      case 4:
        return (
          // ... same as before
          <div className="form-section">
          ... (keep the same JSX)
          </div>
        )
      case 5:
        return (
          // ... same as before
          <div className="form-section">
          ... (keep the same JSX)
          </div>
        )
      default:
        return null
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <FormTracker steps={steps} currentStep={currentStep} onStepClick={goToStep} />
      {renderForm()}
      <div className="form-navigation">
        {currentStep > 1 ? (
          <button type="button" onClick={prevStep} className="button button-outline">
            Previous
          </button>
        ) : (
          <div></div>
        )}
        {currentStep < steps.length ? (
          <button type="button" onClick={nextStep} className="button button-primary">
            Next
          </button>
        ) : (
          <button type="submit" className="button button-primary">
            Submit Application
          </button>
        )}
      </div>
    </form>
  )
}
