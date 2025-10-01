"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"

// List of African countries
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

// Define the funder types and their corresponding funding types
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

// Define funding types
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

// Map funder types to relevant funding types
const funderToFundingMap: Record<string, string[]> = {
  "1.1": ["ft1", "ft2"], // Angel Investors
  "1.2": ["ft1", "ft2"], // VC Firms
  "1.3": ["ft1", "ft7"], // PE Firms
  "1.4": ["ft1", "ft2"], // CVC
  "1.5": ["ft1", "ft2", "ft3"], // Family Offices
  "1.6": ["ft1"], // Crowdfunding
  "2.1": ["ft3", "ft4"], // Commercial Banks
  "2.2": ["ft3", "ft4", "ft5"], // NBFCs
  "2.3": ["ft3"], // MFIs
  "2.4": ["ft3"], // P2P Lenders
  "2.5": ["ft3", "ft6"], // Development Banks
  "3.1": ["ft5"], // Revenue-Based Financing
  "3.2": ["ft2"], // Convertible Note
  "3.3": ["ft7"], // Mezzanine
  "3.4": ["ft8"], // Factoring
  "3.5": ["ft9"], // Supply Chain
  "4.1": ["ft6"], // Government Grants
  "4.2": ["ft6"], // Corporate Grants
  "4.3": ["ft6"], // International Aid
  "5.1": ["ft1", "ft2", "ft6"], // Impact Investors
  "5.2": ["ft3"], // Real Estate
  "5.3": ["ft10"], // Equipment Lessors
  "5.4": ["ft3", "ft1"], // Franchise Financiers
  "6.1": ["ft11", "ft1", "ft2"], // Incubators
  "6.2": ["ft1"], // Tokenized
  "6.3": ["ft3"], // Trade Unions
}

// Define form steps
const steps = [
  { id: 1, name: "Basic Information & Contact" },
  { id: 2, name: "Investment Criteria" },
  { id: 3, name: "Compliance & Reputation" },
  { id: 4, name: "Additional Preferences" },
  { id: 5, name: "Review & Submit" },
]

// Form Tracker Component
interface Step {
  id: number
  name: string
}

interface FormTrackerProps {
  steps: Step[]
  currentStep: number
  onStepClick: (step: number) => void
}

function FormTracker({ steps, currentStep, onStepClick }: FormTrackerProps) {
  return (
    <div className="form-tracker">
      <div className="tracker-steps">
        {steps.map((step, index) => (
          <div key={step.id} className="tracker-step-container">
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className={`tracker-connector ${currentStep > step.id ? "tracker-connector-active" : ""}`}></div>
            )}

            {/* Step circle */}
            <button
              onClick={() => onStepClick(step.id)}
              className={`tracker-step ${currentStep === step.id ? "tracker-step-current" : currentStep > step.id ? "tracker-step-completed" : ""
                }`}
            >
              {currentStep > step.id ? "✓" : <span>{step.id}</span>}
            </button>

            {/* Step name */}
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
  const [selectedFunderTypes, setSelectedFunderTypes] = useState < string[] > ([])
  const [selectedFundingTypes, setSelectedFundingTypes] = useState < string[] > ([])

  // Form data state
  const [formData, setFormData] = useState({
    // Basic Info & Contact
    investorName: "",
    registrationNumber: "",
    website: "",
    country: "",
    languages: "",
    contactName: "",
    contactEmail: "",
    phoneNumber: "",

    // Investment Criteria
    preferredSectors: "",
    geographyFocus: "",
    stagePreference: "",
    ticketSize: "",
    esgFocus: "",
    localRequirements: "",

    // Compliance & Reputation
    businessRegistration: null as File | null,
    taxClearance: null as File | null,
    directorIDs: null as File | null,
    financialStatements: null as File | null,
    priorDeals: "",
    dealTimeline: "",

    // Additional Preferences
    ndaTemplate: false,
    ndaTemplateFile: null as File | null,
    mentorship: false,
    nonFinancialSupport: "",
  })

  // Get available funding types based on selected funder types
  const getAvailableFundingTypes = () => {
    const availableFundingTypeIds = new Set < string > ()

    selectedFunderTypes.forEach((funderId) => {
      const fundingTypeIds = funderToFundingMap[funderId] || []
      fundingTypeIds.forEach((id) => availableFundingTypeIds.add(id))
    })

    return fundingTypes.filter((ft) => availableFundingTypeIds.has(ft.id))
  }

  const availableFundingTypes = getAvailableFundingTypes()

  const handleFunderTypeChange = (funderId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedFunderTypes((prev) => [...prev, funderId])
    } else {
      setSelectedFunderTypes((prev) => prev.filter((id) => id !== funderId))
      // Remove any funding types that are no longer available
      setSelectedFundingTypes((prev) => {
        const newAvailableFundingTypeIds = new Set < string > ()

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

  const handleFundingTypeChange = (fundingTypeId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedFundingTypes((prev) => [...prev, fundingTypeId])
    } else {
      setSelectedFundingTypes((prev) => prev.filter((id) => id !== fundingTypeId))
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, files } = e.target
    if (files && files.length > 0) {
      setFormData((prev) => ({ ...prev, [id]: files[0] }))
    }
  }

  const handleCheckboxChange = (id: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [id]: checked }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Navigate to dashboard
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

  const goToStep = (step: number) => {
    if (step >= 1 && step <= steps.length) {
      setCurrentStep(step)
      window.scrollTo(0, 0)
    }
  }

  // Render form based on current step
  const renderForm = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="form-section">
            <h2 className="section-title">Basic Information & Contact</h2>

            {/* Basic Information */}
            <div className="form-group-container">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="investorName" className="form-label">
                    Investor Name / Entity Name <span className="required">*</span>
                  </label>
                  <input
                    id="investorName"
                    value={formData.investorName}
                    onChange={handleInputChange}
                    placeholder="Enter investor or entity name"
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="registrationNumber" className="form-label">
                    Registration Number (if applicable)
                  </label>
                  <input
                    id="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleInputChange}
                    placeholder="Enter registration number"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="website" className="form-label">
                    Website / LinkedIn
                  </label>
                  <input
                    id="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="Enter website or LinkedIn URL"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="country" className="form-label">
                    Country of Operation <span className="required">*</span>
                  </label>
                  <select
                    id="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    required
                    className="form-select"
                  >
                    <option value="">Select a country</option>
                    {africanCountries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="languages" className="form-label">
                  Languages for Communication <span className="required">*</span>
                </label>
                <input
                  id="languages"
                  value={formData.languages}
                  onChange={handleInputChange}
                  placeholder="Enter languages (e.g., English, French)"
                  required
                  className="form-input"
                />
              </div>
            </div>

            {/* Contact Details */}
            <div className="form-group-container">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="contactName" className="form-label">
                    Primary Contact Name <span className="required">*</span>
                  </label>
                  <input
                    id="contactName"
                    value={formData.contactName}
                    onChange={handleInputChange}
                    placeholder="Enter contact name"
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="contactEmail" className="form-label">
                    Contact Email <span className="required">*</span>
                  </label>
                  <input
                    id="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    type="email"
                    placeholder="Enter email address"
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="phoneNumber" className="form-label">
                  Phone Number <span className="required">*</span>
                </label>
                <input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  required
                  className="form-input"
                />
              </div>
            </div>

            {/* What type of funder are you */}
            <div className="form-group-container">
              <div className="form-group">
                <div className="form-label-with-tooltip">
                  <label className="form-label form-label-lg">
                    What type of funder are you? <span className="required">*</span>
                  </label>
                  <div className="tooltip">
                    <span className="tooltip-icon">i</span>
                    <span className="tooltip-text">Select all types of funding you're interested in providing</span>
                  </div>
                </div>

                <div className="funder-types-container">
                  {funderTypes.map((category) => (
                    <div key={category.category} className="funder-category">
                      <h4 className="funder-category-title">{category.category}</h4>
                      <div className="funder-types-grid">
                        {category.types.map((type) => (
                          <div key={type.id} className="funder-type-item">
                            <input
                              type="checkbox"
                              id={`funder-${type.id}`}
                              checked={selectedFunderTypes.includes(type.id)}
                              onChange={(e) => handleFunderTypeChange(type.id, e.target.checked)}
                              className="checkbox"
                            />
                            <div className="funder-type-details">
                              <label htmlFor={`funder-${type.id}`} className="funder-type-label">
                                {type.name}
                              </label>
                              <p className="funder-type-description">{type.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="form-section">
            <h2 className="section-title">Investment Criteria</h2>

            <div className="form-group-container">
              <div className="form-group">
                <div className="form-label-with-tooltip">
                  <label className="form-label">
                    Funding Types Offered <span className="required">*</span>
                  </label>
                  <div className="tooltip">
                    <span className="tooltip-icon">i</span>
                    <span className="tooltip-text">
                      Select all funding types you offer. Options are based on your selected funder types.
                    </span>
                  </div>
                </div>

                <div className="funding-types-container">
                  {selectedFunderTypes.length > 0 ? (
                    <div className="funding-types-grid">
                      {availableFundingTypes.map((type) => (
                        <div key={type.id} className="funding-type-item">
                          <input
                            type="checkbox"
                            id={`funding-${type.id}`}
                            checked={selectedFundingTypes.includes(type.id)}
                            onChange={(e) => handleFundingTypeChange(type.id, e.target.checked)}
                            className="checkbox"
                          />
                          <label htmlFor={`funding-${type.id}`} className="funding-type-label">
                            {type.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-options-message">
                      Please select at least one funder type to see available funding options
                    </p>
                  )}
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="preferredSectors" className="form-label">
                    Preferred Sectors (multi-select) <span className="required">*</span>
                  </label>
                  <select id="preferredSectors" required className="form-select">
                    <option value="">Select sectors</option>
                    <option value="technology">Technology</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="finance">Finance</option>
                    <option value="education">Education</option>
                    <option value="retail">Retail</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="agriculture">Agriculture</option>
                    <option value="energy">Energy</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="geographyFocus" className="form-label">
                    Geography Focus (multi-select) <span className="required">*</span>
                  </label>
                  <select id="geographyFocus" required className="form-select">
                    <option value="">Select regions</option>
                    <option value="north-africa">North Africa</option>
                    <option value="east-africa">East Africa</option>
                    <option value="west-africa">West Africa</option>
                    <option value="central-africa">Central Africa</option>
                    <option value="southern-africa">Southern Africa</option>
                    <option value="pan-african">Pan-African</option>
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="stagePreference" className="form-label">
                    Stage Preference <span className="required">*</span>
                  </label>
                  <select id="stagePreference" required className="form-select">
                    <option value="">Select stage</option>
                    <option value="pre-seed">Pre-seed</option>
                    <option value="seed">Seed</option>
                    <option value="series-a">Series A</option>
                    <option value="series-b">Series B</option>
                    <option value="series-c">Series C+</option>
                    <option value="growth">Growth</option>
                    <option value="mature">Mature</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="ticketSize" className="form-label">
                    Ticket Size Range (Min-Max) <span className="required">*</span>
                  </label>
                  <input
                    id="ticketSize"
                    value={formData.ticketSize}
                    onChange={handleInputChange}
                    placeholder="e.g., $50K - $500K"
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="esgFocus" className="form-label">
                  ESG/Impact Focus (Yes/No + details)
                </label>
                <textarea
                  id="esgFocus"
                  value={formData.esgFocus}
                  onChange={handleInputChange}
                  placeholder="Describe your ESG or impact investment focus, if applicable"
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label htmlFor="localRequirements" className="form-label">
                  B-BBEE / Local Ownership Requirements
                </label>
                <textarea
                  id="localRequirements"
                  value={formData.localRequirements}
                  onChange={handleInputChange}
                  placeholder="Describe any local ownership requirements"
                  className="form-textarea"
                />
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="form-section">
            <h2 className="section-title">Compliance & Reputation</h2>

            <div className="form-group-container">
              <h3 className="subsection-title">Compliance Documents</h3>

              <div className="form-group">
                <label htmlFor="businessRegistration" className="form-label">
                  Business Registration Certificate <span className="required">*</span>
                </label>
                <input
                  id="businessRegistration"
                  type="file"
                  onChange={handleFileChange}
                  required
                  className="form-file-input"
                />
                <p className="form-help-text">Upload your business registration certificate (PDF or image format)</p>
              </div>

              <div className="form-group">
                <label htmlFor="taxClearance" className="form-label">
                  Tax Clearance Certificate <span className="required">*</span>
                </label>
                <input id="taxClearance" type="file" onChange={handleFileChange} required className="form-file-input" />
                <p className="form-help-text">Upload your tax clearance certificate (PDF or image format)</p>
              </div>

              <div className="form-group">
                <label htmlFor="directorIDs" className="form-label">
                  Director IDs / Passports <span className="required">*</span>
                </label>
                <input id="directorIDs" type="file" onChange={handleFileChange} required className="form-file-input" />
                <p className="form-help-text">
                  Upload scanned copies of director IDs or passports (PDF or image format)
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="financialStatements" className="form-label">
                  Financial Statements
                </label>
                <input id="financialStatements" type="file" onChange={handleFileChange} className="form-file-input" />
                <p className="form-help-text">Upload your latest financial statements if available (PDF format)</p>
              </div>

              <div className="form-group">
                <label htmlFor="priorDeals" className="form-label">
                  Prior Deals Completed (Number + Sectors)
                </label>
                <textarea
                  id="priorDeals"
                  value={formData.priorDeals}
                  onChange={handleInputChange}
                  placeholder="Describe your previous investment experience"
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label htmlFor="dealTimeline" className="form-label">
                  Preferred Deal Timeline (response SLA) <span className="required">*</span>
                </label>
                <input
                  id="dealTimeline"
                  value={formData.dealTimeline}
                  onChange={handleInputChange}
                  placeholder="e.g., 2-4 weeks"
                  required
                  className="form-input"
                />
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="form-section">
            <h2 className="section-title">Additional Preferences</h2>

            <div className="form-group-container">
              <div className="form-group">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="ndaTemplate"
                    checked={formData.ndaTemplate}
                    onChange={(e) => handleCheckboxChange("ndaTemplate", e.target.checked)}
                    className="checkbox"
                  />
                  <label htmlFor="ndaTemplate" className="checkbox-label">
                    NDA Template Provided?
                  </label>
                </div>

                {formData.ndaTemplate && (
                  <div className="form-group mt-2">
                    <label htmlFor="ndaTemplateFile" className="form-label">
                      Upload NDA Template
                    </label>
                    <input id="ndaTemplateFile" type="file" onChange={handleFileChange} className="form-file-input" />
                    <p className="form-help-text">Upload your NDA template document (PDF or Word format)</p>
                  </div>
                )}
              </div>

              <div className="form-group">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="mentorship"
                    checked={formData.mentorship}
                    onChange={(e) => handleCheckboxChange("mentorship", e.target.checked)}
                    className="checkbox"
                  />
                  <label htmlFor="mentorship" className="checkbox-label">
                    Availability for Mentorship?
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="nonFinancialSupport" className="form-label">
                  Other Non-financial Support Offered
                </label>
                <textarea
                  id="nonFinancialSupport"
                  value={formData.nonFinancialSupport}
                  onChange={handleInputChange}
                  placeholder="Describe any additional support you offer beyond funding"
                  className="form-textarea"
                />
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="form-section">
            <h2 className="section-title">Review & Submit</h2>

            <div className="form-group-container">
              {/* Basic Information & Contact Summary */}
              <div className="summary-section">
                <h3 className="summary-title">Basic Information & Contact</h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <p className="summary-label">Investor Name</p>
                    <p className="summary-value">{formData.investorName || "Not provided"}</p>
                  </div>
                  <div className="summary-item">
                    <p className="summary-label">Registration Number</p>
                    <p className="summary-value">{formData.registrationNumber || "Not provided"}</p>
                  </div>
                  <div className="summary-item">
                    <p className="summary-label">Website / LinkedIn</p>
                    <p className="summary-value">{formData.website || "Not provided"}</p>
                  </div>
                  <div className="summary-item">
                    <p className="summary-label">Country of Operation</p>
                    <p className="summary-value">{formData.country || "Not provided"}</p>
                  </div>
                  <div className="summary-item">
                    <p className="summary-label">Languages</p>
                    <p className="summary-value">{formData.languages || "Not provided"}</p>
                  </div>
                  <div className="summary-item">
                    <p className="summary-label">Contact Name</p>
                    <p className="summary-value">{formData.contactName || "Not provided"}</p>
                  </div>
                  <div className="summary-item">
                    <p className="summary-label">Contact Email</p>
                    <p className="summary-value">{formData.contactEmail || "Not provided"}</p>
                  </div>
                  <div className="summary-item">
                    <p className="summary-label">Phone Number</p>
                    <p className="summary-value">{formData.phoneNumber || "Not provided"}</p>
                  </div>
                </div>

                <div className="summary-item-full">
                  <p className="summary-label">Funder Types</p>
                  <div className="summary-tags">
                    {selectedFunderTypes.length > 0 ? (
                      selectedFunderTypes.map((typeId) => {
                        const funderType = funderTypes
                          .flatMap((category) => category.types)
                          .find((type) => type.id === typeId)
                        return funderType ? (
                          <span key={typeId} className="summary-tag">
                            {funderType.name}
                          </span>
                        ) : null
                      })
                    ) : (
                      <span className="summary-empty">None selected</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Investment Criteria Summary */}
              <div className="summary-section">
                <h3 className="summary-title">Investment Criteria</h3>
                <div className="summary-item-full">
                  <p className="summary-label">Funding Types Offered</p>
                  <div className="summary-tags">
                    {selectedFundingTypes.length > 0 ? (
                      selectedFundingTypes.map((typeId) => {
                        const fundingType = fundingTypes.find((type) => type.id === typeId)
                        return fundingType ? (
                          <span key={typeId} className="summary-tag">
                            {fundingType.name}
                          </span>
                        ) : null
                      })
                    ) : (
                      <span className="summary-empty">None selected</span>
                    )}
                  </div>
                </div>

                <div className="summary-grid">
                  <div className="summary-item">
                    <p className="summary-label">Ticket Size Range</p>
                    <p className="summary-value">{formData.ticketSize || "Not provided"}</p>
                  </div>
                  <div className="summary-item">
                    <p className="summary-label">ESG/Impact Focus</p>
                    <p className="summary-value">{formData.esgFocus || "Not provided"}</p>
                  </div>
                </div>
              </div>

              {/* Compliance & Additional Preferences Summary */}
              <div className="summary-section">
                <h3 className="summary-title">Compliance & Additional Preferences</h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <p className="summary-label">Deal Timeline</p>
                    <p className="summary-value">{formData.dealTimeline || "Not provided"}</p>
                  </div>
                  <div className="summary-item">
                    <p className="summary-label">Prior Deals</p>
                    <p className="summary-value">{formData.priorDeals || "Not provided"}</p>
                  </div>
                  <div className="summary-item">
                    <p className="summary-label">NDA Template</p>
                    <p className="summary-value">{formData.ndaTemplate ? "Yes" : "No"}</p>
                  </div>
                  <div className="summary-item">
                    <p className="summary-label">Mentorship Available</p>
                    <p className="summary-value">{formData.mentorship ? "Yes" : "No"}</p>
                  </div>
                </div>
              </div>

              <div className="disclaimer">
                <p>By submitting this form, you confirm that all information provided is accurate and complete.</p>
              </div>
            </div>
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