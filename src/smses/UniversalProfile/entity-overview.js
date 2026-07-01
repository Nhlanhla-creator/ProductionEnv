import { useEffect, useState } from "react"
import { Info, ChevronDown, ChevronUp, Upload, X, Check } from "lucide-react"
import { db, auth, storage } from '../../firebaseConfig';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
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

// ── Industry Associations ──
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

// ── Currencies ──
const currencies = [
  { value: "ZAR", label: "ZAR - South African Rand" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "NGN", label: "NGN - Nigerian Naira" },
]

// ── Import/Export options ──
const importExportOptions = [
  { value: "import", label: "Import" },
  { value: "export", label: "Export" },
  { value: "both", label: "Both" },
  { value: "none", label: "None" },
]

// FormField component
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

// Section heading component
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

// Radio Group component
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

// Reusable MultiSelect Dropdown
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

// Main component
export default function EntityOverview({ data = {}, updateData }) {
  const [formData, setFormData] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState("");
  const [letterheadUploading, setLetterheadUploading] = useState(false);
  const [letterheadFile, setLetterheadFile] = useState(null);
  const [orgStructureUploading, setOrgStructureUploading] = useState(false);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Image size must be less than 5MB');
      return;
    }

    try {
      setLogoUploading(true);
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      const previewURL = URL.createObjectURL(file);
      setLogoPreview(previewURL);

      const timestamp = Date.now();
      const fileName = `company_logos/${currentUser.uid}/${timestamp}_${file.name}`;
      const storageRef = ref(storage, fileName);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      try {
        const validationResult = await validateDocument('Company Logo', file, "");
        if (validationResult.isValid) {
          await uploadDocumentWithSync('Company Logo', downloadURL, validationResult);
        } else {
          await uploadDocumentWithSync('Company Logo', downloadURL, { status: 'warning', message: 'Logo uploaded without AI validation' });
        }
      } catch (validationError) {
        console.warn('Logo validation failed, proceeding with upload:', validationError);
        await uploadDocumentWithSync('Company Logo', downloadURL, { status: 'warning', message: 'Logo uploaded without AI validation' });
      }

      const userDocRef = doc(db, "universalProfiles", currentUser.uid);
      const currentProfileDoc = await getDoc(userDocRef);
      const currentData = currentProfileDoc.exists() ? currentProfileDoc.data() : {};

      await updateDoc(userDocRef, {
        ...currentData,
        entityOverview: { ...currentData.entityOverview, companyLogo: downloadURL },
        updatedAt: new Date().toISOString()
      });

      const newFormData = { ...formData, companyLogo: downloadURL };
      updateFormData(newFormData);

      if (currentData.entityOverview?.companyLogo &&
          currentData.entityOverview.companyLogo !== downloadURL &&
          currentData.entityOverview.companyLogo.includes('firebase')) {
        try {
          const oldImageRef = ref(storage, currentData.entityOverview.companyLogo);
          await deleteObject(oldImageRef);
        } catch (deleteError) {
          console.warn('Could not delete old logo:', deleteError);
        }
      }

    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Failed to upload logo. Please try again.');
      setLogoPreview("");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      const confirmDelete = window.confirm('Are you sure you want to delete the Company Logo?');
      if (!confirmDelete) return;

      await deleteDocumentWithSync('Company Logo');

      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const userDocRef = doc(db, "universalProfiles", currentUser.uid);
      const currentProfileDoc = await getDoc(userDocRef);
      const currentData = currentProfileDoc.exists() ? currentProfileDoc.data() : {};

      await updateDoc(userDocRef, {
        ...currentData,
        entityOverview: { ...currentData.entityOverview, companyLogo: "" },
        updatedAt: new Date().toISOString()
      });

      const newFormData = { ...formData };
      delete newFormData.companyLogo;
      updateFormData(newFormData);
      setLogoPreview("");
      alert('Company Logo deleted successfully!');
    } catch (error) {
      console.error('Error removing logo:', error);
      alert('Failed to remove logo. Please try again.');
    }
  };

  const updateFormData = (newData) => {
    setFormData(newData)
    updateData(newData)
  }

  useEffect(() => {
    const loadEntityOverview = async () => {
      try {
        setIsLoading(true);
        const userId = auth.currentUser?.uid;
        if (!userId) { setIsLoading(false); return; }

        const docRef = doc(db, "universalProfiles", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const profileData = docSnap.data();
          let entityData = profileData.entityOverview || {};

          const companyLetterhead = getDocumentUrlFromAnyLocation('Company Letterhead', profileData);
          const companyLogo = getDocumentUrlFromAnyLocation('Company Logo', profileData);
          const orgStructure = getDocumentUrlFromAnyLocation('Org Structure', profileData);

          // Initialize fields if they don't exist
          const defaultFields = {
            memberOfAssociation: "",
            industryAssociations: [],
            industryAssociationsOther: "",
            brandsOwned: "",
            brandsRepresented: "",
            holdsFranchises: "",
            holdsAgencies: "",
          };

          Object.keys(defaultFields).forEach(key => {
            if (entityData[key] === undefined) {
              entityData[key] = defaultFields[key];
            }
          });

          updateFormData({
            ...entityData,
            companyLetterhead,
            companyLetterheadUpdatedAt: companyLetterhead
              ? profileData.documents?.companyLetterheadUpdatedAt || profileData.entityOverview?.companyLetterheadUpdatedAt || new Date().toISOString()
              : null,
            companyLogo,
            companyLogoUpdatedAt: companyLogo
              ? profileData.documents?.companyLogoUpdatedAt || profileData.entityOverview?.companyLogoUpdatedAt || new Date().toISOString()
              : null,
            orgStructure,
          });
        } else {
          updateFormData({
            ...data,
            memberOfAssociation: "",
            industryAssociations: [],
            industryAssociationsOther: "",
            brandsOwned: "",
            brandsRepresented: "",
            holdsFranchises: "",
            holdsAgencies: "",
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

  const handleLetterheadUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    if (!allowedTypes.includes(`.${fileExtension}`)) {
      alert(`Please upload only PDF, Word, or Image files.`);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit.');
      return;
    }

    try {
      setLetterheadUploading(true);
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      const userDocRef = doc(db, "universalProfiles", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      const registeredName = userDoc.exists() ? userDoc.data()?.entityOverview?.registeredName || "" : "";

      const validationResult = await validateCompanyDocument('Company Letterhead', file, registeredName);
      if (!validationResult.isValid) {
        alert(`Validation failed: ${validationResult.message}`);
        setLetterheadUploading(false);
        return;
      }

      const timestamp = Date.now();
      const storageRef = ref(storage, `company_letterhead/${currentUser.uid}/${timestamp}_${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      await uploadDocumentWithSync('Company Letterhead', downloadURL, validationResult);

      updateFormData({ ...formData, companyLetterhead: downloadURL, companyLetterheadUpdatedAt: new Date().toISOString() });
      setLetterheadFile(file);
      alert('Company Letterhead uploaded and validated successfully!');
    } catch (error) {
      console.error('Error uploading letterhead:', error);
      alert('Failed to upload letterhead. Please try again.');
    } finally {
      setLetterheadUploading(false);
    }
  };

  const handleDeleteLetterhead = async () => {
    try {
      const confirmDelete = window.confirm('Are you sure you want to delete the Company Letterhead?');
      if (!confirmDelete) return;
      await deleteDocumentWithSync('Company Letterhead');
      const newFormData = { ...formData };
      delete newFormData.companyLetterhead;
      delete newFormData.companyLetterheadUpdatedAt;
      updateFormData(newFormData);
      setLetterheadFile(null);
      alert('Company Letterhead deleted successfully!');
    } catch (error) {
      console.error('Error deleting letterhead:', error);
      alert('Failed to delete letterhead. Please try again.');
    }
  };

  const handleOrgStructureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    if (!allowedTypes.includes(`.${fileExtension}`)) {
      alert('Please upload a PDF, Word, Excel, or Image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit.');
      return;
    }

    try {
      setOrgStructureUploading(true);
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      const timestamp = Date.now();
      const storageRef = ref(storage, `org_structure/${currentUser.uid}/${timestamp}_${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      await uploadDocumentWithSync('Org Structure', downloadURL, { status: 'ok', message: 'Org structure uploaded' });

      updateFormData({ ...formData, orgStructure: downloadURL, orgStructureFileName: file.name, orgStructureUpdatedAt: new Date().toISOString() });
      alert('Org structure uploaded successfully!');
    } catch (error) {
      console.error('Error uploading org structure:', error);
      alert('Failed to upload org structure. Please try again.');
    } finally {
      setOrgStructureUploading(false);
    }
  };

  const handleDeleteOrgStructure = async () => {
    try {
      const confirmDelete = window.confirm('Are you sure you want to delete the Org Structure?');
      if (!confirmDelete) return;
      await deleteDocumentWithSync('Org Structure');
      const newFormData = { ...formData };
      delete newFormData.orgStructure;
      delete newFormData.orgStructureFileName;
      delete newFormData.orgStructureUpdatedAt;
      updateFormData(newFormData);
      alert('Org structure deleted successfully!');
    } catch (error) {
      console.error('Error deleting org structure:', error);
      alert('Failed to delete org structure. Please try again.');
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
  }

  const spinnerStyle = {
    width: '16px', height: '16px',
    border: '2px solid transparent',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
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

        <FormField label="CIPC Annual Return">
          <input type="text" name="cipcAnnualReturn" value={formData.cipcAnnualReturn || ""} onChange={handleChange} style={inputStyle} placeholder="e.g., 2024-01-15" />
        </FormField>
      </div>

      {/* ============================================================ */}
      {/* SECTION 2: Business Details - 3 per row */}
      {/* ============================================================ */}
      <SectionHeading title="Business Details" />

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
      </div>

      {/* Business Description - Full Width */}
      <div style={{ marginTop: '1rem' }}>
        <FormField label="Brief Business Description" required>
          <textarea name="businessDescription" value={formData.businessDescription || ""} onChange={handleChange} rows={4} style={{ ...inputStyle, resize: 'vertical' }} required />
        </FormField>
      </div>

      {/* ============================================================ */}
      {/* SECTION 3: Employees - All 4 in one row */}
      {/* ============================================================ */}
      <SectionHeading title="Employees" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px' }}>
        <FormField label="Permanent" required>
          <input
            type="number"
            name="permanentEmployees"
            value={formData.permanentEmployees || ""}
            onChange={handleChange}
            min="0"
            style={inputStyle}
            placeholder="0"
            required
          />
        </FormField>

        <FormField label="Contract">
          <input
            type="number"
            name="contractEmployees"
            value={formData.contractEmployees || ""}
            onChange={handleChange}
            min="0"
            style={inputStyle}
            placeholder="0"
          />
        </FormField>

        <FormField label="Internship">
          <input
            type="number"
            name="internshipEmployees"
            value={formData.internshipEmployees || ""}
            onChange={handleChange}
            min="0"
            style={inputStyle}
            placeholder="0"
          />
        </FormField>

        <FormField label="Temporary">
          <input
            type="number"
            name="temporaryEmployees"
            value={formData.temporaryEmployees || ""}
            onChange={handleChange}
            min="0"
            style={inputStyle}
            placeholder="0"
          />
        </FormField>
      </div>

      {/* ============================================================ */}
      {/* SECTION 4: Industry Associations - 3 per row */}
      {/* ============================================================ */}
      <SectionHeading title="Industry Associations" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
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
            gridColumn: 'span 2',
          }}>
            You indicated that you are not a member of any industry association.
          </div>
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

      {/* ============================================================ */}
      {/* SECTION 5: Brand Assets - Includes Brands, Franchises & Agencies */}
      {/* ============================================================ */}
      <SectionHeading title="Brand Assets" />

      {/* Brands, Franchises & Agencies - 3 per row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '1.5rem' }}>
        <FormField label="Brands Owned">
          <input
            type="text"
            name="brandsOwned"
            value={formData.brandsOwned || ""}
            onChange={handleChange}
            style={inputStyle}
            placeholder="e.g., Brand A, Brand B"
          />
        </FormField>

        <FormField label="Brands Represented">
          <input
            type="text"
            name="brandsRepresented"
            value={formData.brandsRepresented || ""}
            onChange={handleChange}
            style={inputStyle}
            placeholder="e.g., Brand X, Brand Y"
          />
        </FormField>

        <FormField label="Do you hold any Franchises?">
          <RadioGroup 
            name="holdsFranchises" 
            value={formData.holdsFranchises} 
            onChange={(value) => handleRadioChange("holdsFranchises", value)}
          />
        </FormField>

        <FormField label="Do you hold any Agencies?">
          <RadioGroup 
            name="holdsAgencies" 
            value={formData.holdsAgencies} 
            onChange={(value) => handleRadioChange("holdsAgencies", value)}
          />
        </FormField>
      </div>

      {/* Company Logo, Letterhead, Org Structure - 2 per row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Company Logo */}
        <FormField label="Company Logo">
          <div style={{
            border: '2px dashed #C19A6B', borderRadius: '8px', padding: '16px',
            backgroundColor: '#FAF8F5',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden',
                border: '3px solid #8B6F47', backgroundColor: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(139,111,71,0.2)', flexShrink: 0,
              }}>
                {formData.companyLogo || logoPreview ? (
                  <img src={logoPreview || formData.companyLogo} alt="Company Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ color: '#A0826D', fontSize: '10px', textAlign: 'center', padding: '6px' }}>
                    <div style={{ fontSize: '28px', lineHeight: '1' }}>🏢</div>
                    <div style={{ fontWeight: '600', color: '#8B6F47', fontSize: '9px' }}>No Logo</div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <label htmlFor="logo-upload" style={{
                    padding: '10px 16px',
                    background: logoUploading ? 'linear-gradient(135deg,#A0826D,#8B6F47)' : 'linear-gradient(135deg,#8B4513,#6B3410)',
                    color: 'white', border: 'none', borderRadius: '5px', fontSize: '13px', fontWeight: '600',
                    cursor: logoUploading ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px',
                    opacity: logoUploading ? 0.7 : 1,
                  }}>
                    {logoUploading ? <><div style={spinnerStyle}></div>Uploading...</> : <><Upload size={16} />{formData.companyLogo ? 'Replace' : 'Upload'}</>}
                    <input id="logo-upload" type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={handleLogoUpload} disabled={logoUploading} style={{ display: 'none' }} />
                  </label>
                  {(formData.companyLogo || logoPreview) && (
                    <button type="button" onClick={handleRemoveLogo} style={{
                      padding: '10px 16px', background: 'linear-gradient(135deg,#B8860B,#996515)', color: 'white',
                      border: 'none', borderRadius: '5px', cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                    }}>
                      <X size={16} />Delete
                    </button>
                  )}
                </div>
                <div style={{
                  fontSize: '11px', color: '#8B6F47', lineHeight: '1.4',
                  backgroundColor: 'rgba(139,111,71,0.08)', padding: '8px 10px',
                  borderRadius: '5px', border: '1px solid rgba(139,111,71,0.15)',
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '2px' }}>📋 Requirements</div>
                  <div>JPG, PNG, GIF, WebP • Max 5MB</div>
                </div>
              </div>
            </div>
          </div>
        </FormField>

        {/* Company Letterhead */}
        <FormField label="Company Letterhead">
          <div style={{
            border: '2px dashed #C19A6B', borderRadius: '8px', padding: '16px',
            backgroundColor: '#FAF8F5',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden',
                border: '3px solid #8B6F47', backgroundColor: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(139,111,71,0.2)', flexShrink: 0,
              }}>
                {formData.companyLetterhead ? (
                  <div style={{ padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', lineHeight: '1', marginBottom: '4px' }}>📄</div>
                    <div style={{ fontSize: '9px', fontWeight: '600', color: '#8B6F47' }}>Letterhead</div>
                  </div>
                ) : (
                  <div style={{ color: '#A0826D', fontSize: '10px', textAlign: 'center', padding: '6px' }}>
                    <div style={{ fontSize: '28px', lineHeight: '1', marginBottom: '2px' }}>📋</div>
                    <div style={{ fontWeight: '600', color: '#8B6F47', fontSize: '9px' }}>No Letterhead</div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <label htmlFor="letterhead-upload" style={{
                    padding: '10px 16px',
                    background: letterheadUploading ? 'linear-gradient(135deg,#A0826D,#8B6F47)' : 'linear-gradient(135deg,#8B4513,#6B3410)',
                    color: 'white', border: 'none', borderRadius: '5px', fontSize: '13px', fontWeight: '600',
                    cursor: letterheadUploading ? 'not-allowed' : 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    opacity: letterheadUploading ? 0.7 : 1,
                  }}>
                    {letterheadUploading ? <><div style={spinnerStyle}></div>Uploading...</> : <><Upload size={16} />{formData.companyLetterhead ? 'Replace' : 'Upload'}</>}
                    <input id="letterhead-upload" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleLetterheadUpload} disabled={letterheadUploading} style={{ display: 'none' }} />
                  </label>
                  {formData.companyLetterhead && (
                    <button type="button" onClick={handleDeleteLetterhead} style={{
                      padding: '10px 16px', background: 'linear-gradient(135deg,#B8860B,#996515)', color: 'white',
                      border: 'none', borderRadius: '5px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                    }}>
                      <X size={16} />Delete
                    </button>
                  )}
                </div>
                <div style={{
                  fontSize: '11px', color: '#8B6F47', lineHeight: '1.4',
                  backgroundColor: 'rgba(139,111,71,0.08)', padding: '8px 10px',
                  borderRadius: '5px', border: '1px solid rgba(139,111,71,0.15)',
                }}>
                  {formData.companyLetterhead ? (
                    <>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>✅ Letterhead Uploaded</div>
                      <a href={formData.companyLetterhead} target="_blank" rel="noopener noreferrer"
                        style={{ color: '#8B4513', textDecoration: 'underline' }}>View Document ↗</a>
                    </>
                  ) : (
                    <>
                      <div style={{ fontWeight: '600', marginBottom: '2px' }}>📋 Requirements</div>
                      <div>PDF, JPG, PNG • Max 10MB</div>
                      <div style={{ marginTop: '2px' }}>Company name, logo, address, contact info required</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </FormField>

        {/* Organisational Structure */}
        <FormField label="Organisational Structure (optional)">
          <div style={{
            border: '2px dashed #C19A6B',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: '#FAF8F5',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '8px',
                border: '3px solid #8B6F47', backgroundColor: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(139,111,71,0.2)', flexShrink: 0,
              }}>
                {formData.orgStructure ? (
                  <div style={{ textAlign: 'center', padding: '6px' }}>
                    <div style={{ fontSize: '28px', lineHeight: '1' }}>🗂️</div>
                    <div style={{ fontSize: '9px', fontWeight: '600', color: '#8B6F47', marginTop: '2px' }}>Uploaded</div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '6px' }}>
                    <div style={{ fontSize: '28px', lineHeight: '1' }}>📊</div>
                    <div style={{ fontSize: '9px', fontWeight: '600', color: '#8B6F47', marginTop: '2px' }}>No File</div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <label
                    htmlFor="org-structure-upload"
                    style={{
                      padding: '10px 16px',
                      background: orgStructureUploading
                        ? 'linear-gradient(135deg, #A0826D 0%, #8B6F47 100%)'
                        : 'linear-gradient(135deg, #8B4513 0%, #6B3410 100%)',
                      color: 'white', border: 'none', borderRadius: '5px',
                      fontSize: '13px', fontWeight: '600',
                      cursor: orgStructureUploading ? 'not-allowed' : 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      transition: 'all 0.3s ease',
                      opacity: orgStructureUploading ? 0.7 : 1,
                    }}
                  >
                    {orgStructureUploading ? (
                      <><div style={spinnerStyle}></div> Uploading...</>
                    ) : (
                      <><Upload size={16} />{formData.orgStructure ? 'Replace' : 'Upload'}</>
                    )}
                    <input
                      id="org-structure-upload"
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
                      onChange={handleOrgStructureUpload}
                      disabled={orgStructureUploading}
                      style={{ display: 'none' }}
                    />
                  </label>

                  {formData.orgStructure && (
                    <button
                      type="button"
                      onClick={handleDeleteOrgStructure}
                      style={{
                        padding: '10px 16px',
                        background: 'linear-gradient(135deg, #B8860B 0%, #996515 100%)',
                        color: 'white', border: 'none', borderRadius: '5px',
                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px',
                      }}
                    >
                      <X size={16} />Delete
                    </button>
                  )}
                </div>

                <div style={{
                  fontSize: '11px', color: '#8B6F47', lineHeight: '1.4',
                  backgroundColor: 'rgba(139,111,71,0.08)', padding: '8px 10px',
                  borderRadius: '5px', border: '1px solid rgba(139,111,71,0.15)',
                }}>
                  {formData.orgStructure ? (
                    <>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>✅ Org Structure Uploaded</div>
                      <a href={formData.orgStructure} target="_blank" rel="noopener noreferrer"
                        style={{ color: '#8B4513', textDecoration: 'underline' }}>
                        View Document ↗
                      </a>
                    </>
                  ) : (
                    <>
                      <div style={{ fontWeight: '600', marginBottom: '2px' }}>📋 Accepted formats</div>
                      <div>PDF, Word, Excel, Image • Max 10MB</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </FormField>
      </div>
    </div>
  )
}