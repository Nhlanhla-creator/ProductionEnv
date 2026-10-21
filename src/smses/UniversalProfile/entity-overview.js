import { useEffect, useState } from "react"
import { Info, ChevronDown, ChevronUp, Upload, X, Check } from "lucide-react"
import { db, auth, storage } from '../../firebaseConfig';
import { getProfileOwnerId } from "../../utils/profile-context"
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { uploadDocumentWithSync, deleteDocumentWithSync, getDocumentUrlFromAnyLocation } from '../../utils/documentSyncService';
import { validateDocument, validateCompanyDocument } from '../../services/documentValidationService';

const entityTypes = [
  { value: "SME", label: "SME" },
  { value: "Social Enterprise", label: "Social Enterprise" },
  { value: "Funder/Investor", label: "Funder/Investor" },
  { value: "Corporate", label: "Corporate" },
  { value: "Accelerator", label: "Accelerator" },
  { value: "Incubator", label: "Incubator" },
]

const legalStructures = [
  { value: "(pty) Ltd", label: "(Pty) Ltd - Private Company" },
  { value: "Ltd", label: "Ltd - Public Company" },
  { value: "NPC", label: "NPC - Non-Profit Company" },
  { value: "Sole Proprietor", label: "Sole Proprietor" },
  { value: "Partnership", label: "Partnership" },
  { value: "CC", label: "CC - Close Corporation (Legacy)" },
  { value: "Trust", label: "Trust" },
  { value: "Cooperative", label: "Cooperative" },
  { value: "Joint Venture", label: "Joint Venture" },
  { value: "State Owned", label: "State-Owned Enterprise" },
]

const entitySizes = [
  { value: "Micro", label: "Micro (< R1M annual turnover)" },
  { value: "Small", label: "Small (R1M - R10M annual turnover)" },
  { value: "Medium", label: "Medium (R10M - R50M annual turnover)" },
  { value: "Large", label: "Large (> R50M annual turnover)" },
]

const operationStages = [
  { value: "Startup", label: "Startup" },
  { value: "Growth", label: "Growth" },
  { value: "Scaling", label: "Scaling" },
  { value: "Turnaround", label: "Turnaround" },
  { value: "Mature", label: "Mature" },
]

const economicSectors = [
  { value: "Generalist", label: "Generalist" },
  { value: "Agriculture", label: "Agriculture" },
  { value: "Automotive", label: "Automotive" },
  { value: "Banking, Finance & Insurance", label: "Banking, Finance & Insurance" },
  { value: "Beauty / Cosmetics / Personal Care", label: "Beauty / Cosmetics / Personal Care" },
  { value: "Construction", label: "Construction" },
  { value: "Consulting", label: "Consulting" },
  { value: "Creative Arts / Design", label: "Creative Arts / Design" },
  { value: "Customer Service", label: "Customer Service" },
  { value: "Education & Training", label: "Education & Training" },
  { value: "Engineering", label: "Engineering" },
  { value: "Environmental / Natural Sciences", label: "Environmental / Natural Sciences" },
  { value: "Government / Public Sector", label: "Government / Public Sector" },
  { value: "Healthcare / Medical", label: "Healthcare / Medical" },
  { value: "Hospitality / Tourism", label: "Hospitality / Tourism" },
  { value: "Human Resources", label: "Human Resources" },
  { value: "Information Technology (IT)", label: "Information Technology (IT)" },
  { value: "Infrastructure", label: "Infrastructure" },
  { value: "Legal / Law", label: "Legal / Law" },
  { value: "Logistics / Supply Chain", label: "Logistics / Supply Chain" },
  { value: "Manufacturing", label: "Manufacturing" },
  { value: "Marketing / Advertising / PR", label: "Marketing / Advertising / PR" },
  { value: "Media / Journalism / Broadcasting", label: "Media / Journalism / Broadcasting" },
  { value: "Mining", label: "Mining" },
  { value: "Energy", label: "Energy" },
  { value: "Oil & Gas", label: "Oil & Gas" },
  { value: "Non-Profit / NGO", label: "Non-Profit / NGO" },
  { value: "Property / Real Estate", label: "Property / Real Estate" },
  { value: "Retail / Wholesale", label: "Retail / Wholesale" },
  { value: "Safety & Security / Police / Defence", label: "Safety & Security / Police / Defence" },
  { value: "Sales", label: "Sales" },
  { value: "Science & Research", label: "Science & Research" },
  { value: "Social Services / Social Work", label: "Social Services / Social Work" },
  { value: "Sports / Recreation / Fitness", label: "Sports / Recreation / Fitness" },
  { value: "Telecommunications", label: "Telecommunications" },
  { value: "Transport", label: "Transport" },
  { value: "Utilities (Water, Electricity, Waste)", label: "Utilities (Water, Electricity, Waste)" },
]

const africanCountries = [
  { value: "Algeria", label: "Algeria" },
  { value: "Angola", label: "Angola" },
  { value: "Benin", label: "Benin" },
  { value: "Botswana", label: "Botswana" },
  { value: "Burkina Faso", label: "Burkina Faso" },
  { value: "Burundi", label: "Burundi" },
  { value: "Cabo Verde", label: "Cabo Verde" },
  { value: "Cameroon", label: "Cameroon" },
  { value: "Central African Republic", label: "Central African Republic" },
  { value: "Chad", label: "Chad" },
  { value: "Comoros", label: "Comoros" },
  { value: "Congo", label: "Congo" },
  { value: "Côte d'Ivoire", label: "Côte d'Ivoire" },
  { value: "Djibouti", label: "Djibouti" },
  { value: "DR Congo", label: "DR Congo" },
  { value: "Egypt", label: "Egypt" },
  { value: "Equatorial Guinea", label: "Equatorial Guinea" },
  { value: "Eritrea", label: "Eritrea" },
  { value: "Eswatini", label: "Eswatini" },
  { value: "Ethiopia", label: "Ethiopia" },
  { value: "Gabon", label: "Gabon" },
  { value: "Gambia", label: "Gambia" },
  { value: "Ghana", label: "Ghana" },
  { value: "Guinea", label: "Guinea" },
  { value: "Guinea-Bissau", label: "Guinea-Bissau" },
  { value: "Kenya", label: "Kenya" },
  { value: "Lesotho", label: "Lesotho" },
  { value: "Liberia", label: "Liberia" },
  { value: "Libya", label: "Libya" },
  { value: "Madagascar", label: "Madagascar" },
  { value: "Malawi", label: "Malawi" },
  { value: "Mali", label: "Mali" },
  { value: "Mauritania", label: "Mauritania" },
  { value: "Mauritius", label: "Mauritius" },
  { value: "Morocco", label: "Morocco" },
  { value: "Mozambique", label: "Mozambique" },
  { value: "Namibia", label: "Namibia" },
  { value: "Niger", label: "Niger" },
  { value: "Nigeria", label: "Nigeria" },
  { value: "Rwanda", label: "Rwanda" },
  { value: "São Tomé and Príncipe", label: "São Tomé and Príncipe" },
  { value: "Senegal", label: "Senegal" },
  { value: "Seychelles", label: "Seychelles" },
  { value: "Sierra Leone", label: "Sierra Leone" },
  { value: "Somalia", label: "Somalia" },
  { value: "South Africa", label: "South Africa" },
  { value: "South Sudan", label: "South Sudan" },
  { value: "Sudan", label: "Sudan" },
  { value: "Tanzania", label: "Tanzania" },
  { value: "Togo", label: "Togo" },
  { value: "Tunisia", label: "Tunisia" },
  { value: "Uganda", label: "Uganda" },
  { value: "Zambia", label: "Zambia" },
  { value: "Zimbabwe", label: "Zimbabwe" },
]

const southAfricanProvinces = [
  { value: "Eastern Cape", label: "Eastern Cape" },
  { value: "Free State", label: "Free State" },
  { value: "Gauteng", label: "Gauteng" },
  { value: "KwaZulu-Natal", label: "KwaZulu-Natal" },
  { value: "Limpopo", label: "Limpopo" },
  { value: "Mpumalanga", label: "Mpumalanga" },
  { value: "Northern Cape", label: "Northern Cape" },
  { value: "North West", label: "North West" },
  { value: "Western Cape", label: "Western Cape" },
]

const industryAssociations = [
  { value: "SA Township Traders Association", label: "SA Township Traders Association" },
  { value: "Minerals Council South Africa", label: "Minerals Council South Africa" },
  { value: "Junior Mining Council (JEMD-linked)", label: "Junior Mining Council (JEMD-linked)" },
  { value: "Mandela Mining Precinct", label: "Mandela Mining Precinct" },
  { value: "African Chamber of Commerce and Industry", label: "African Chamber of Commerce and Industry" },
  { value: "Black Business Council", label: "Black Business Council" },
  { value: "South African Renewable Energy Council (SAREC)", label: "South African Renewable Energy Council (SAREC)" },
  { value: "SAPICS: Supply Chain Institute of Southern Africa", label: "SAPICS: Supply Chain Institute of Southern Africa" },
  { value: "Manufacturing Circle", label: "Manufacturing Circle" },
  { value: "Southern African Renewable Energy Council (SAWEA / SA-PVIA)", label: "Southern African Renewable Energy Council (SAWEA / SA-PVIA)" },
  { value: "South African Institute of Black Property Practitioners", label: "South African Institute of Black Property Practitioners" },
  { value: "ASASA / ASISA-linked industry groups", label: "ASASA / ASISA-linked industry groups" },
  { value: "South African Venture Capital and Private Equity Association (SAVCA)", label: "South African Venture Capital and Private Equity Association (SAVCA)" },
  { value: "ABSA Black Business Awards / ABSIP / BEE-linked networks", label: "ABSA Black Business Awards / ABSIP / BEE-linked networks" },
  { value: "SA SME Fund", label: "SA SME Fund" },
  { value: "Endeva (SA / global ESO-backed networks)", label: "Endeva (SA / global ESO-backed networks)" },
  { value: "SA Industrial Development Corporation (IDC)", label: "SA Industrial Development Corporation (IDC)" },
  { value: "SA Department of Trade, Industry and Competition (DTIC)", label: "SA Department of Trade, Industry and Competition (DTIC)" },
  { value: "SA Department of Mineral Resources and Energy (DMRE)", label: "SA Department of Mineral Resources and Energy (DMRE)" },
  { value: "SA Department of Employment and Labour (BEE-linked units)", label: "SA Department of Employment and Labour (BEE-linked units)" },
  { value: "SA National Business Initiative (NBI)", label: "SA National Business Initiative (NBI)" },
  { value: "Other", label: "Other" },
]

const sponsorTypes = [
  { value: "CMF", label: "CMF" },
  { value: "Investor", label: "Investor" },
  { value: "Catalyst", label: "Catalyst" },
  { value: "Advisor", label: "Advisor" },
]

const sponsorDirectory = {
  CMF: [
    { value: "cmf_001", label: "Ubuntu Capital Markets Fund" },
    { value: "cmf_002", label: "Kagiso Enterprise Fund" },
  ],
  Investor: [
    { value: "inv_001", label: "Sanlam Investment Holdings" },
    { value: "inv_002", label: "Mineworkers Investment Company" },
  ],
  Catalyst: [
    { value: "cat_001", label: "Catalyst Growth Partners" },
    { value: "cat_002", label: "Impact Catalyst SA" },
  ],
  Advisor: [
    { value: "adv_001", label: "Thabo Mokoena Advisory" },
    { value: "adv_002", label: "Nkosi & Associates" },
  ],
}

function FormField({ label, required, tooltip, children }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
        {label} {required && <span style={{ color: 'red' }}>*</span>}
        {tooltip && <span style={{ marginLeft: '0.5rem', color: '#666' }}>ℹ️</span>}
      </label>
      {children}
    </div>
  )
}

function SectionHeading({ title }) {
  return (
    <div style={{
      borderBottom: '2px solid #C19A6B',
      marginBottom: '1.25rem',
      marginTop: '1.75rem',
      paddingBottom: '6px',
    }}>
      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#6B3410', margin: 0, letterSpacing: '0.3px' }}>
        {title}
      </h3>
    </div>
  )
}

function RadioGroup({ name, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '24px', marginTop: '6px' }}>
      {["yes", "no"].map((val) => (
        <label
          key={val}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            userSelect: 'none',
            fontSize: '14px',
            fontWeight: '500',
            color: '#3d2b1f',
          }}
        >
          <input
            type="radio"
            name={name}
            value={val}
            checked={value === val}
            onChange={(e) => onChange(e.target.value)}
            style={{
              position: 'absolute',
              opacity: 0,
              width: 0,
              height: 0,
              margin: 0,
            }}
          />
          <div
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              border: `2px solid ${value === val ? '#8B4513' : '#ccc'}`,
              backgroundColor: value === val ? '#8B4513' : 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.15s ease',
              boxShadow: value === val ? '0 0 0 3px rgba(139,69,19,0.12)' : 'none',
            }}
          >
            {value === val && (
              <div style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: 'white',
              }} />
            )}
          </div>
          <span style={{ textTransform: 'capitalize' }}>{val}</span>
        </label>
      ))}
    </div>
  )
}

function MultiSelectDropdown({ options, selected = [], onChange, placeholder = "Select options..." }) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(`[data-multiselect]`)) setIsOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const toggle = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const removeTag = (e, value) => {
    e.stopPropagation()
    onChange(selected.filter((v) => v !== value))
  }

  const getLabel = (value) => options.find((o) => o.value === value)?.label || value

  return (
    <div style={{ position: 'relative' }} data-multiselect="true">
      <div
        onClick={() => setIsOpen((p) => !p)}
        style={{
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '6px 10px',
          cursor: 'pointer',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '4px',
          minHeight: '40px',
          backgroundColor: 'white',
          fontSize: '14px',
        }}
      >
        {selected.length === 0 ? (
          <span style={{ color: '#999' }}>{placeholder}</span>
        ) : (
          selected.map((val) => (
            <span
              key={val}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: '#f3ebe0',
                border: '1px solid #d6c4a8',
                color: '#6b4c2a',
                borderRadius: '12px',
                padding: '2px 10px',
                fontSize: '13px',
                fontWeight: '500',
              }}
            >
              {getLabel(val)}
              <span
                onClick={(e) => removeTag(e, val)}
                style={{ cursor: 'pointer', lineHeight: 1, opacity: 0.7, fontSize: '12px' }}
              >✕</span>
            </span>
          ))
        )}
        <span style={{ marginLeft: 'auto', color: '#999', fontSize: '12px' }}>{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '4px',
          marginTop: '4px',
          zIndex: 1000,
          maxHeight: '260px',
          overflowY: 'auto',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}>
          {options.map((option) => {
            const isSel = selected.includes(option.value)
            return (
              <div
                key={option.value}
                onClick={() => toggle(option.value)}
                style={{
                  padding: '9px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: isSel ? '#fdf6ee' : 'white',
                  fontSize: '14px',
                  color: '#3d2b1f',
                }}
                onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.backgroundColor = '#faf5ef' }}
                onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.backgroundColor = 'white' }}
              >
                <div style={{
                  width: '16px', height: '16px', borderRadius: '3px', flexShrink: 0,
                  border: `1px solid ${isSel ? '#8b5e3c' : '#ccc'}`,
                  backgroundColor: isSel ? '#8b5e3c' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isSel && <span style={{ color: 'white', fontSize: '10px', fontWeight: 'bold' }}>✓</span>}
                </div>
                <span>{option.label}</span>
              </div>
            )
          })}
          <div style={{ padding: '8px', borderTop: '1px solid #eee', position: 'sticky', bottom: 0, backgroundColor: 'white' }}>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                width: '100%', padding: '8px',
                backgroundColor: '#8B4513', color: 'white',
                border: 'none', borderRadius: '4px',
                cursor: 'pointer', fontSize: '13px', fontWeight: '600',
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function EntityOverview({ data = {}, updateData }) {
  const [formData, setFormData] = useState({})
  const [dynamicSponsors, setDynamicSponsors] = useState(null)

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        const collections = {
          CMF: "cmfProfiles",
          Investor: "MyuniversalProfiles",
          Catalyst: "catalystProfiles",
          Advisor: "advisorProfiles"
        }
        const loadedSponsors = {}
        for (const [type, collName] of Object.entries(collections)) {
          const qSnap = await getDocs(collection(db, collName))
          const list = []
          qSnap.forEach(docSnap => {
            const docData = docSnap.data()
            let label = ""
            if (type === "CMF" || type === "Investor" || type === "Catalyst") {
              label = docData?.entityOverview?.tradingName ||
                docData?.entityOverview?.registeredName ||
                docData?.formData?.entityOverview?.tradingName ||
                docData?.formData?.entityOverview?.registeredName ||
                docData?.contactDetails?.contactName ||
                docData?.contactDetails?.primaryContactName ||
                docData?.formData?.contactDetails?.contactName ||
                docData?.formData?.contactDetails?.primaryContactName ||
                docData?.registeredName ||
                docSnap.id
            } else if (type === "Advisor") {
              label = docData?.personalProfessionalOverview?.fullName ||
                docData?.formData?.personalProfessionalOverview?.fullName ||
                docData?.contactDetails?.contactName ||
                docData?.formData?.contactDetails?.contactName ||
                docData?.name ||
                docSnap.id
            }
            const isVerified = type === "CMF" && (docData?.verificationStatus === "Verified" || docData?.isVerified === true || docData?.status === "Verified")
            list.push({ value: docSnap.id, label: label, isVerified: !!isVerified })
          })
          loadedSponsors[type] = list
        }
        setDynamicSponsors(loadedSponsors)
      } catch (err) {
        console.error("Error loading dynamic sponsors:", err)
      }
    }
    fetchSponsors()
  }, [])

  const [isLoading, setIsLoading] = useState(true)

  const updateFormData = (newData) => {
    setFormData(newData)
    updateData(newData)
  }

  useEffect(() => {
    const loadEntityOverview = async () => {
      try {
        setIsLoading(true);
        const isOnboarding = sessionStorage.getItem("isOnboarding") === "true";
        if (isOnboarding) {
          setFormData(data || {});
          setIsLoading(false);
          return;
        }

        const userId = await getProfileOwnerId();
        if (!userId) { setIsLoading(false); return; }

        const docRef = doc(db, "universalProfiles", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const profileData = docSnap.data();
          let entityData = profileData.entityOverview || {};

          // Initialize fields if they don't exist
          const defaultFields = {
            memberOfAssociation: "",
            industryAssociations: [],
            industryAssociationsOther: "",
            sponsorType: "",
            sponsorName: "",
            sponsorViewPermission: "",
          };

          Object.keys(defaultFields).forEach(key => {
            if (entityData[key] === undefined) {
              entityData[key] = defaultFields[key];
            }
          });

          // Note: brand assets fields (brandsOwned, brandsRepresented, holdsFranchises,
          // holdsAgencies, companyLogo, companyLetterhead, orgStructure) now live in
          // the separate `brandAssets` section and are loaded/saved there.
          updateFormData({ ...entityData });
        } else {
          updateFormData({
            ...data,
            memberOfAssociation: "",
            industryAssociations: [],
            industryAssociationsOther: "",
            sponsorType: "",
            sponsorName: "",
            sponsorViewPermission: "",
          });
        }
      } catch (error) {
        console.error("Error loading entity overview:", error);
        updateFormData(data);
      } finally {
        setIsLoading(false);
      }
    };

    loadEntityOverview();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target
    const newData = { ...formData, [name]: value }
    updateFormData(newData)
  }

  const handleRadioChange = (name, value) => {
    const newData = { ...formData, [name]: value }
    updateFormData(newData)
  }

  const handleMultiSelectChange = (field, value) => {
    updateFormData({ ...formData, [field]: value })
  }

  const handleSponsorTypeChange = (e) => {
    updateFormData({
      ...formData,
      sponsorType: e.target.value,
      sponsorName: "",
      sponsorViewPermission: "",
    })
  }

  const handleSponsorNameChange = (e) => {
    updateFormData({
      ...formData,
      sponsorName: e.target.value,
      sponsorViewPermission: "",
    })
  }

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
  }

  if (isLoading) {
    return (
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Entity Overview</h2>
        <p>Loading your information...</p>
      </div>
    )
  }

  const selectedCountries = Array.isArray(formData.operatingCountries) ? formData.operatingCountries : []
  const showProvinces = selectedCountries.includes("South Africa")
  const memberOfAssociation = formData.memberOfAssociation
  const isOnboarding = sessionStorage.getItem("isOnboarding") === "true"

  const sponsorType = formData.sponsorType || ""
  const sponsorOptions = (dynamicSponsors && dynamicSponsors[sponsorType]) || sponsorDirectory[sponsorType] || []
  const selectedSponsorLabel = sponsorOptions.find((s) => s.value === formData.sponsorName)?.label || ""

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Entity Overview</h2>

      {/* ============================================================ */}
      {/* SECTION 1: Company Information - 3 per row */}
      {/* ============================================================ */}
      <SectionHeading title="Company Information" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        <FormField label="Registered Name" required>
          <input type="text" name="registeredName" value={formData.registeredName || ""} onChange={handleChange} style={inputStyle} required />
        </FormField>

        <FormField label="Trading Name (if different)">
          <input type="text" name="tradingName" value={formData.tradingName || ""} onChange={handleChange} style={inputStyle} />
        </FormField>

        <FormField label="Registration Number" required>
          <input type="text" name="registrationNumber" value={formData.registrationNumber || ""} onChange={handleChange} style={inputStyle} required />
        </FormField>

        <FormField label="Entity Type" required>
          <select name="entityType" value={formData.entityType || ""} onChange={handleChange} style={inputStyle} required>
            <option value="">Select Entity Type</option>
            {entityTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
        </FormField>

        <FormField label="Legal Structure" required>
          <select name="legalStructure" value={formData.legalStructure || ""} onChange={handleChange} style={inputStyle} required>
            <option value="">Select Legal Structure</option>
            {legalStructures.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </FormField>

        <FormField label="Entity Size" required>
          <select name="entitySize" value={formData.entitySize || ""} onChange={handleChange} style={inputStyle} required>
            <option value="">Select Entity Size</option>
            {entitySizes.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </FormField>

        <FormField label="Financial Year End" required>
          <input type="month" name="financialYearEnd" value={formData.financialYearEnd || ""} onChange={handleChange} style={inputStyle} required />
        </FormField>

        <FormField label="Years in Operation" required>
          <input type="number" name="yearsInOperation" value={formData.yearsInOperation || ""} onChange={handleChange} min="0" step="0.5" style={inputStyle} required />
        </FormField>
      </div>

      {/* ============================================================ */}
      {/* SECTION 2: Business Classification - 3 per row */}
      {/* ============================================================ */}
      <SectionHeading title="Business Classification" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        <FormField label="Business Stage" required>
          <select name="operationStage" value={formData.operationStage || ""} onChange={handleChange} style={inputStyle} required>
            <option value="">Select Operation Stage</option>
            {operationStages.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </FormField>

        <FormField label="Economic Sector" required>
          <MultiSelectDropdown
            options={economicSectors}
            selected={formData.economicSectors || []}
            onChange={(value) => handleMultiSelectChange("economicSectors", value)}
            placeholder="Select economic sectors..."
          />
        </FormField>

        <FormField label="Countries of Operation" required>
          <MultiSelectDropdown
            options={africanCountries}
            selected={selectedCountries}
            onChange={(value) => handleMultiSelectChange("operatingCountries", value)}
            placeholder="Select countries..."
          />
        </FormField>

        {showProvinces && (
          <FormField label="Provinces (South Africa)" required>
            <MultiSelectDropdown
              options={southAfricanProvinces}
              selected={Array.isArray(formData.operatingProvinces) ? formData.operatingProvinces : []}
              onChange={(value) => handleMultiSelectChange("operatingProvinces", value)}
              placeholder="Select provinces..."
            />
          </FormField>
        )}

        <FormField label="Are you a member of any industry association?">
          <div style={{ display: 'flex', gap: '16px' }}>
            {["yes", "no"].map((opt) => (
              <label
                key={opt}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: `2px solid ${memberOfAssociation === opt ? '#8B4513' : '#ccc'}`,
                  backgroundColor: memberOfAssociation === opt ? '#fdf6ee' : 'white',
                  cursor: 'pointer',
                  fontWeight: memberOfAssociation === opt ? '600' : '400',
                  color: memberOfAssociation === opt ? '#6B3410' : '#555',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  userSelect: 'none',
                }}
              >
                <input
                  type="radio"
                  name="memberOfAssociation"
                  value={opt}
                  checked={memberOfAssociation === opt}
                  onChange={(e) => handleRadioChange("memberOfAssociation", e.target.value)}
                  style={{ display: 'none' }}
                />
                <span style={{
                  width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${memberOfAssociation === opt ? '#8B4513' : '#ccc'}`,
                  backgroundColor: memberOfAssociation === opt ? '#8B4513' : 'transparent',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {memberOfAssociation === opt && (
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'white' }} />
                  )}
                </span>
                <span style={{ textTransform: 'capitalize' }}>{opt}</span>
              </label>
            ))}
          </div>
        </FormField>

        {memberOfAssociation === "yes" && (
          <>
            <FormField label="Select your association(s)">
              <MultiSelectDropdown
                options={industryAssociations}
                selected={Array.isArray(formData.industryAssociations) ? formData.industryAssociations : []}
                onChange={(value) => handleMultiSelectChange("industryAssociations", value)}
                placeholder="Select associations..."
              />
            </FormField>

            {Array.isArray(formData.industryAssociations) && formData.industryAssociations.includes("Other") && (
              <FormField label="Specify other association">
                <input
                  type="text"
                  name="industryAssociationsOther"
                  value={formData.industryAssociationsOther || ""}
                  onChange={handleChange}
                  placeholder="Please specify..."
                  style={inputStyle}
                />
              </FormField>
            )}
          </>
        )}

        {memberOfAssociation === "no" && (
          <div style={{
            padding: '10px 12px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#666',
          }}>
            You indicated that you are not a member of any industry association.
          </div>
        )}

        {!isOnboarding && (
          <>
            <FormField label="Are you working with a specific sponsor?">
              <select
                name="sponsorType"
                value={sponsorType}
                onChange={handleSponsorTypeChange}
                style={inputStyle}
              >
                <option value="">Select sponsor type</option>
                {sponsorTypes.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </FormField>

            {sponsorType && (
              <FormField label={`Which ${sponsorType}?`}>
                <select
                  name="sponsorName"
                  value={formData.sponsorName || ""}
                  onChange={handleSponsorNameChange}
                  style={inputStyle}
                >
                  <option value="">{`Select ${sponsorType}...`}</option>
                  {sponsorOptions.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.isVerified ? "✓ [Verified] " : ""}{s.label}
                    </option>
                  ))}
                </select>
                {sponsorType === "CMF" && sponsorOptions.find(s => s.value === formData.sponsorName)?.isVerified && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '12px', fontWeight: 'bold', color: '#16a34a' }}>
                    <Check size={12} style={{ strokeWidth: 3 }} /> Verified CMF Profile
                  </div>
                )}
              </FormField>
            )}

            {sponsorType && formData.sponsorName && (
              <FormField label="Do you give them permission to view your profile?">
                <RadioGroup
                  name="sponsorViewPermission"
                  value={formData.sponsorViewPermission}
                  onChange={(value) => handleRadioChange("sponsorViewPermission", value)}
                />
              </FormField>
            )}
          </>
        )}
      </div>

      {memberOfAssociation === "yes" && (
        <div style={{
          marginTop: '12px',
          padding: '10px 12px',
          backgroundColor: '#f0f7f0',
          borderLeft: '3px solid #4CAF50',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#2e7d32',
        }}>
          <strong>📌 Note:</strong> The associations you select here will be able to see your business in their member ecosystem.
          Make sure to select all associations you are a member of.
        </div>
      )}

      {formData.sponsorViewPermission === "yes" && selectedSponsorLabel && (
        <div style={{
          marginTop: '12px',
          padding: '10px 12px',
          backgroundColor: '#f0f7f0',
          borderLeft: '3px solid #4CAF50',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#2e7d32',
        }}>
          <strong>📌 Note:</strong> {selectedSponsorLabel} will be able to view your full profile. You can withdraw this at any time by changing your answer above.
        </div>
      )}

      {formData.sponsorViewPermission === "no" && selectedSponsorLabel && (
        <div style={{
          marginTop: '12px',
          padding: '10px 12px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#666',
        }}>
          {selectedSponsorLabel} is recorded as your sponsor, but will not be able to view your profile.
        </div>
      )}

      {/* Business Description */}
      <div style={{ marginTop: '20px', marginBottom: '20px' }}>
        <FormField label="Brief Business Description">
          <textarea
            name="businessDescription"
            value={formData.businessDescription || ""}
            onChange={handleChange}
            rows={4}
            style={{ ...inputStyle, resize: 'vertical' }}
            maxLength={1500}
            placeholder="Brief overview of your business..."
          />
          <div style={{
            fontSize: '12px',
            color: '#666',
            marginTop: '4px',
            textAlign: 'right'
          }}>
            {(formData.businessDescription || "").length}/1500 characters
          </div>
        </FormField>
      </div>
    </div>
  )
}