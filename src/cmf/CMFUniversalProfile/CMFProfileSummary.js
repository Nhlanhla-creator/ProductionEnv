import { useState } from "react"
import { Building, User, Phone, FileText, TrendingUp, Briefcase, ChevronDown, ChevronUp, Edit, CheckCircle, AlertCircle, Shield } from "lucide-react"

const SectionCard = ({ title, icon: Icon, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", marginBottom: "1.25rem", overflow: "hidden", backgroundColor: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {Icon && <Icon size={20} style={{ color: "#6366f1" }} />}
          <span style={{ fontWeight: "700", fontSize: "1rem", color: "#1f2937" }}>{title}</span>
        </div>
        {open ? <ChevronUp size={18} style={{ color: "#6b7280" }} /> : <ChevronDown size={18} style={{ color: "#6b7280" }} />}
      </button>
      {open && <div style={{ padding: "0 1.25rem 1.25rem", borderTop: "1px solid #f3f4f6" }}>{children}</div>}
    </div>
  )
}

const InfoRow = ({ label, value }) => {
  if (!value || value === "" || (Array.isArray(value) && value.length === 0)) return null
  return (
    <div style={{ display: "flex", gap: "1rem", padding: "0.5rem 0", borderBottom: "1px solid #f9fafb", flexWrap: "wrap" }}>
      <span style={{ minWidth: "200px", fontSize: "0.85rem", color: "#6b7280", fontWeight: "500" }}>{label}</span>
      <span style={{ fontSize: "0.85rem", color: "#1f2937", flex: 1 }}>
        {Array.isArray(value) ? value.join(", ") : String(value)}
      </span>
    </div>
  )
}

const NoDataCard = ({ message }) => (
  <div style={{ padding: "1.5rem", textAlign: "center", color: "#6b7280", backgroundColor: "#f9fafb", borderRadius: "8px", fontSize: "0.9rem" }}>
    <AlertCircle size={24} style={{ color: "#d1d5db", marginBottom: "0.5rem" }} />
    <p style={{ margin: 0 }}>{message}</p>
  </div>
)

const DocumentBadge = ({ label, files = [] }) => {
  const hasFiles = files && files.length > 0
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.75rem", borderRadius: "6px", backgroundColor: hasFiles ? "#f0fdf4" : "#fef9f0", border: `1px solid ${hasFiles ? "#86efac" : "#fcd34d"}`, fontSize: "0.8rem", marginBottom: "0.4rem" }}>
      {hasFiles ? <CheckCircle size={14} style={{ color: "#059669" }} /> : <AlertCircle size={14} style={{ color: "#d97706" }} />}
      <span style={{ color: hasFiles ? "#065f46" : "#92400e", fontWeight: "500" }}>{label}</span>
      {hasFiles && <span style={{ color: "#6b7280", marginLeft: "auto" }}>({files.length} file{files.length !== 1 ? "s" : ""})</span>}
    </div>
  )
}

export default function CMFProfileSummary({ data = {}, onEdit }) {
  const entity = data.entityOverview || {}
  const contact = data.contactDetails || {}
  const legal = data.legalCompliance || {}
  const products = data.productsServices || {}
  const fundDetails = data.fundDetails || {}
  const applicationBrief = data.applicationBrief || {}
  const investmentPrefs = data.generalInvestmentPreference || {}
  const documents = data.documents || {}
  const completedSections = data.completedSections || {}

  const sectionCount = Object.keys(completedSections).length
  const completedCount = Object.values(completedSections).filter(Boolean).length
  const verificationScore = sectionCount > 0 ? Math.round((completedCount / sectionCount) * 100) : 0

  const hasApplicationBriefData = applicationBrief.overviewObjectives || applicationBrief.instructionsForApplying || applicationBrief.evaluationCriteria
  const hasInvestmentPreferenceData = (investmentPrefs.investmentStage && investmentPrefs.investmentStage.length > 0) || investmentPrefs.riskAppetite || investmentPrefs.fundStructure || (investmentPrefs.sectorFocus && investmentPrefs.sectorFocus.length > 0)
  const hasFundDetails = fundDetails.funds && fundDetails.funds.length > 0

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "1.5rem", fontFamily: "system-ui, sans-serif" }}>
      {/* Header Banner */}
      <div style={{ background: "linear-gradient(135deg, #312e81 0%, #6366f1 50%, #8b5cf6 100%)", borderRadius: "16px", padding: "2rem", marginBottom: "2rem", color: "white", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "200px", height: "200px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ fontSize: "0.8rem", opacity: 0.8, marginBottom: "0.4rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>Capital and Market Facilitator</div>
              <h1 style={{ margin: 0, fontSize: "clamp(1.25rem, 3vw, 1.75rem)", fontWeight: "700" }}>
                {entity.registeredName || "CMF Profile Summary"}
              </h1>
              {entity.tradingName && entity.tradingName !== entity.registeredName && (
                <p style={{ margin: "0.25rem 0 0", opacity: 0.85, fontSize: "0.9rem" }}>Trading as: {entity.tradingName}</p>
              )}
            </div>
            <button
              onClick={onEdit}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.2rem", backgroundColor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "8px", color: "white", cursor: "pointer", fontSize: "0.9rem", fontWeight: "600", backdropFilter: "blur(4px)" }}
            >
              <Edit size={16} /> Edit Profile
            </button>
          </div>
          {/* Verification Score */}
          <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
            <div style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: "12px", padding: "0.75rem 1.25rem", backdropFilter: "blur(4px)" }}>
              <div style={{ fontSize: "0.75rem", opacity: 0.8, marginBottom: "0.2rem" }}>Verification Score</div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ position: "relative", width: "60px", height: "60px" }}>
                  <svg viewBox="0 0 36 36" style={{ width: "60px", height: "60px", transform: "rotate(-90deg)" }}>
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="white" strokeWidth="3"
                      strokeDasharray={`${verificationScore} ${100 - verificationScore}`} strokeLinecap="round" />
                  </svg>
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: "0.85rem", fontWeight: "700" }}>{verificationScore}%</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.8rem", opacity: 0.85 }}>{completedCount} of {sectionCount} sections</div>
                  <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>completed</div>
                </div>
              </div>
            </div>
            {entity.entityType && (
              <div style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: "12px", padding: "0.75rem 1.25rem", backdropFilter: "blur(4px)" }}>
                <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>Entity Type</div>
                <div style={{ fontWeight: "600", fontSize: "0.95rem" }}>{entity.entityType}</div>
              </div>
            )}
            {entity.operatingCountries && entity.operatingCountries.length > 0 && (
              <div style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: "12px", padding: "0.75rem 1.25rem", backdropFilter: "blur(4px)" }}>
                <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>Market</div>
                <div style={{ fontWeight: "600", fontSize: "0.95rem" }}>{entity.operatingCountries.slice(0, 2).join(", ")}{entity.operatingCountries.length > 2 ? ` +${entity.operatingCountries.length - 2}` : ""}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Entity Overview */}
      <SectionCard title="Entity Overview" icon={Building} defaultOpen>
        <InfoRow label="Registered Name" value={entity.registeredName} />
        <InfoRow label="Trading Name" value={entity.tradingName} />
        <InfoRow label="Registration Number" value={entity.registrationNumber} />
        <InfoRow label="Entity Type" value={entity.entityType} />
        <InfoRow label="Legal Structure" value={entity.legalStructure} />
        <InfoRow label="Entity Size" value={entity.entitySize} />
        <InfoRow label="Years in Operation" value={entity.yearsInOperation} />
        <InfoRow label="Operation Stage" value={entity.operationStage} />
        <InfoRow label="Economic Sectors" value={entity.economicSectors} />
        <InfoRow label="Operating Countries" value={entity.operatingCountries} />
        {entity.businessDescription && (
          <div style={{ marginTop: "0.75rem" }}>
            <p style={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: "500", marginBottom: "0.25rem" }}>Business Description</p>
            <p style={{ fontSize: "0.9rem", color: "#1f2937", lineHeight: "1.6", backgroundColor: "#f9fafb", padding: "0.75rem", borderRadius: "8px", margin: 0 }}>{entity.businessDescription}</p>
          </div>
        )}
      </SectionCard>

      {/* Contact Details */}
      <SectionCard title="Contact Details" icon={Phone}>
        <InfoRow label="Contact Name" value={contact.contactName ? `${contact.contactTitle || ""} ${contact.contactName}`.trim() : null} />
        <InfoRow label="Position" value={contact.position} />
        <InfoRow label="Email" value={contact.email} />
        <InfoRow label="Business Phone" value={contact.businessPhone} />
        <InfoRow label="Mobile" value={contact.mobile} />
        <InfoRow label="Physical Address" value={contact.physicalAddress} />
        <InfoRow label="Postal Address" value={contact.sameAsPhysical ? "Same as physical" : contact.postalAddress} />
      </SectionCard>

      {/* Legal & Compliance */}
      <SectionCard title="Legal & Compliance" icon={Shield}>
        <InfoRow label="Tax Number" value={legal.taxNumber} />
        <InfoRow label="Tax Clearance PIN" value={legal.taxClearancePin} />
        <InfoRow label="VAT Number" value={legal.vatNumber} />
        <InfoRow label="PAYE Number" value={legal.payeNumber} />
        <InfoRow label="B-BBEE Level" value={legal.bbbeeLevel} />
        <InfoRow label="UIF Status" value={legal.uifStatus} />
      </SectionCard>

      {/* Products & Services */}
      <SectionCard title="Products & Services" icon={Briefcase}>
        <InfoRow label="Offering Type" value={products.offeringType} />
        <InfoRow label="Service Categories" value={products.serviceCategories} />
        <InfoRow label="Delivery Modes" value={products.deliveryModes} />
        <InfoRow label="Target Market" value={products.targetMarket} />
        <InfoRow label="Key Clients" value={products.keyClients} />
      </SectionCard>

      {/* Fund Details */}
      <SectionCard title="Fund Details" icon={TrendingUp}>
        {hasFundDetails ? (
          fundDetails.funds.map((fund, idx) => (
            <div key={idx} style={{ padding: "0.75rem", backgroundColor: "#f9fafb", borderRadius: "8px", marginBottom: "0.75rem" }}>
              <div style={{ fontWeight: "600", color: "#1f2937", marginBottom: "0.5rem" }}>Fund {idx + 1}: {fund.name || "Unnamed Fund"}</div>
              {fund.fundType && <InfoRow label="Type" value={fund.fundType} />}
              {fund.size && <InfoRow label="Size" value={fund.size} />}
              {fund.vintage && <InfoRow label="Vintage" value={fund.vintage} />}
            </div>
          ))
        ) : (
          <NoDataCard message="No fund details provided" />
        )}
      </SectionCard>

      {/* Application Brief */}
      <SectionCard title="Application Brief" icon={FileText}>
        {hasApplicationBriefData ? (
          <>
            <InfoRow label="Overview & Objectives" value={applicationBrief.overviewObjectives} />
            <InfoRow label="Instructions for Applying" value={applicationBrief.instructionsForApplying} />
            <InfoRow label="Estimated Review Time" value={applicationBrief.estimatedReviewTime} />
            <InfoRow label="Typical Deal Closing Time" value={applicationBrief.typicalDealClosingTime} />
            <InfoRow label="Application Window" value={applicationBrief.applicationWindow} />
            <InfoRow label="Core Documents Required" value={applicationBrief.coreDocuments} />
            <InfoRow label="Evaluation Criteria" value={applicationBrief.evaluationCriteria} />
            <InfoRow label="Impact Alignment" value={applicationBrief.impactAlignment} />
          </>
        ) : (
          <NoDataCard message="No application brief details provided" />
        )}
      </SectionCard>

      {/* Investment Preferences */}
      <SectionCard title="Investment Preferences" icon={TrendingUp}>
        {hasInvestmentPreferenceData ? (
          <>
            <InfoRow label="Fund Structure" value={investmentPrefs.fundStructure} />
            <InfoRow label="Legal Entity Fit" value={investmentPrefs.legalEntityFit} />
            <InfoRow label="Investment Stage" value={investmentPrefs.investmentStage} />
            <InfoRow label="Investment Focus" value={investmentPrefs.investmentFocus} />
            <InfoRow label="Sector Focus" value={investmentPrefs.sectorFocus} />
            <InfoRow label="Sector Exclusions" value={investmentPrefs.sectorExclusions} />
            <InfoRow label="Geographic Focus" value={investmentPrefs.geographicFocus} />
            <InfoRow label="Risk Appetite" value={investmentPrefs.riskAppetite} />
            <InfoRow label="Preferred Exit Strategy" value={investmentPrefs.preferredExitStrategy} />
            <InfoRow label="Expected Exit Timeline" value={investmentPrefs.expectedExitTimeline} />
            <InfoRow label="Target IRR" value={investmentPrefs.targetIRR} />
          </>
        ) : (
          <NoDataCard message="No investment preferences details provided" />
        )}
      </SectionCard>

      {/* Documents */}
      <SectionCard title="Uploaded Documents" icon={FileText}>
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: "600", marginBottom: "0.75rem" }}>REQUIRED</p>
          {[
            { id: "cipcRegistration", label: "CIPC Registration Document" },
            { id: "taxCompliancePin", label: "Tax Compliance PIN" },
            { id: "companyProfile", label: "Company Profile (PDF)" },
            { id: "logo", label: "Company Logo" },
            { id: "proofOfAddress", label: "Proof of Address" },
          ].map(doc => <DocumentBadge key={doc.id} label={doc.label} files={documents[doc.id]} />)}
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: "600", marginBottom: "0.75rem" }}>COMPLIANCE & CREDENTIALS</p>
          {[
            { id: "vatCertificate", label: "VAT Certificate" },
            { id: "bbbeeCertificate", label: "B-BBEE Certificate" },
            { id: "fspLicence", label: "FSP Licence / FSP Partner Details" },
            { id: "professionalIndemnityInsurance", label: "Professional Indemnity Insurance" },
            { id: "isoCertifications", label: "ISO Certifications" },
            { id: "industryAccreditations", label: "Industry Accreditations" },
          ].map(doc => <DocumentBadge key={doc.id} label={doc.label} files={documents[doc.id]} />)}
        </div>
        <div>
          <p style={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: "600", marginBottom: "0.75rem" }}>MARKETING & CAPABILITY</p>
          {[
            { id: "capabilityStatement", label: "Capability Statement" },
            { id: "caseStudies", label: "Case Studies" },
            { id: "clientReferences", label: "Client References" },
            { id: "brochure", label: "Brochure" },
            { id: "serviceCatalogue", label: "Service Catalogue" },
          ].map(doc => <DocumentBadge key={doc.id} label={doc.label} files={documents[doc.id]} />)}
        </div>
      </SectionCard>
    </div>
  )
}
