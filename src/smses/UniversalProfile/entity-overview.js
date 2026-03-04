import { useEffect, useState } from "react"
import { Info, ChevronDown, ChevronUp, Upload, X } from "lucide-react"
import { db, auth, storage } from '../../firebaseConfig';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
// import { validateDocument } from '../../services/documentValidationService';
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

// City mapping for each country (truncated for brevity)
const citiesByCountry = {
  "Algeria": ["Algiers", "Oran", "Constantine", "Annaba", "Batna"],
  "Angola": ["Luanda", "Huambo", "Lobito", "Benguela", "Lubango"],
  "South Africa": [
    "Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth",
    "Bloemfontein", "East London", "Nelspruit", "Polokwane", "Kimberley",
    "Pietermaritzburg", "Rustenburg", "George", "Middelburg", "Witbank"
  ],
  // ... other countries
}

// Simple FormField component
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

// MultiSelect component
function MultiSelect({ options, selected, onChange, label }) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleDropdown = () => setIsOpen(!isOpen)
  const closeDropdown = () => setIsOpen(false)

  const handleSelect = (value) => {
    const newSelected = selected.includes(value) 
      ? selected.filter((item) => item !== value) 
      : [...selected, value]
    onChange(newSelected)
  }

  return (
    <div style={{ position: 'relative' }}>
      <div 
        onClick={toggleDropdown}
        style={{
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '8px 12px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '40px'
        }}
      >
        {selected.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {selected.map((sector) => (
              <span 
                key={sector}
                style={{
                  backgroundColor: '#e0e0e0',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '14px'
                }}
              >
                {options.find((opt) => opt.value === sector)?.label || sector}
              </span>
            ))}
          </div>
        ) : (
          <span style={{ color: '#999' }}>Select {label}</span>
        )}
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
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
          maxHeight: '300px',
          overflow: 'auto'
        }}>
          <div style={{ padding: '8px' }}>
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                style={{
                  padding: '8px',
                  cursor: 'pointer',
                  backgroundColor: selected.includes(option.value) ? '#f0f0f0' : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={() => {}}
                  style={{ cursor: 'pointer' }}
                />
                <span>{option.label}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '8px', borderTop: '1px solid #ccc' }}>
            <button 
              type="button"
              onClick={closeDropdown}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
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
  const [showLogoUpload, setShowLogoUpload] = useState(false);
  const [logoPreview, setLogoPreview] = useState("");
  const [letterheadUploading, setLetterheadUploading] = useState(false);
  const [letterheadFile, setLetterheadFile] = useState(null);

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

    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Create preview
    const previewURL = URL.createObjectURL(file);
    setLogoPreview(previewURL);

    const timestamp = Date.now();
    const fileName = `company_logos/${currentUser.uid}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, fileName);

    const uploadResult = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(uploadResult.ref);

    // ✅ Use validateDocument for logo (optional validation)
    try {
      const validationResult = await validateDocument('Company Logo', file, "");
      if (validationResult.isValid) {
        await uploadDocumentWithSync('Company Logo', downloadURL, validationResult);
      } else {
        await uploadDocumentWithSync('Company Logo', downloadURL, {
          status: 'warning',
          message: 'Logo uploaded without AI validation'
        });
      }
    } catch (validationError) {
      // If validation fails, still upload but mark as warning
      console.warn('Logo validation failed, proceeding with upload:', validationError);
      await uploadDocumentWithSync('Company Logo', downloadURL, {
        status: 'warning',
        message: 'Logo uploaded without AI validation'
      });
    }

    const userDocRef = doc(db, "universalProfiles", currentUser.uid);
    const currentProfileDoc = await getDoc(userDocRef);
    const currentData = currentProfileDoc.exists() ? currentProfileDoc.data() : {};

    const updatedData = {
      ...currentData,
      entityOverview: {
        ...currentData.entityOverview,
        companyLogo: downloadURL
      },
      updatedAt: new Date().toISOString()
    };

    await updateDoc(userDocRef, updatedData);
    
    // Update local form data
    const newFormData = { ...formData, companyLogo: downloadURL };
    updateFormData(newFormData);

    // Clean up old logo if it exists and is different
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

    setShowLogoUpload(false);
    
  } catch (error) {
    console.error('Error uploading logo:', error);
    let errorMessage = 'Failed to upload logo. Please try again.';

    if (error.code === 'storage/unauthorized') {
      errorMessage = 'You do not have permission to upload images.';
    } else if (error.code === 'storage/canceled') {
      errorMessage = 'Upload was canceled.';
    } else if (error.code === 'storage/unknown') {
      errorMessage = 'An unknown error occurred. Please check your internet connection.';
    }

    alert(errorMessage);
    setLogoPreview("");
  } finally {
    setLogoUploading(false);
  }
};


  const handleRemoveLogo = async () => {
  try {
    // Show confirmation
    const confirmDelete = window.confirm('Are you sure you want to delete the Company Logo?');
    if (!confirmDelete) return;

    // ✅ Use sync service for deletion
    await deleteDocumentWithSync('Company Logo');
    
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const userDocRef = doc(db, "universalProfiles", currentUser.uid);
    const currentProfileDoc = await getDoc(userDocRef);
    const currentData = currentProfileDoc.exists() ? currentProfileDoc.data() : {};

    // Update Firestore
    const updatedData = {
      ...currentData,
      entityOverview: {
        ...currentData.entityOverview,
        companyLogo: ""
      },
      updatedAt: new Date().toISOString()
    };

    await updateDoc(userDocRef, updatedData);
    
    // Update local state
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

  // Update form data and notify parent
  const updateFormData = (newData) => {
    setFormData(newData)
    updateData(newData)
  }

  // Load data from Firebase
  useEffect(() => {
    const loadEntityOverview = async () => {
      try {
        setIsLoading(true);
        const userId = auth.currentUser?.uid;
        
        if (!userId) {
          setIsLoading(false);
          return;
        }

        const docRef = doc(db, "universalProfiles", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const profileData = docSnap.data();
          let entityData = profileData.entityOverview || {};
          
          // ✅ Get letterhead URL using sync service helper
          const companyLetterhead = getDocumentUrlFromAnyLocation(
            'Company Letterhead', 
            profileData
          );
          
          // Get company logo from any location
          const companyLogo = getDocumentUrlFromAnyLocation('Company Logo', profileData);
          
          // Find timestamps
          let companyLetterheadUpdatedAt = null;
          let companyLogoUpdatedAt = null;
          
          if (companyLetterhead) {
            companyLetterheadUpdatedAt = profileData.documents?.companyLetterheadUpdatedAt || 
                                        profileData.entityOverview?.companyLetterheadUpdatedAt ||
                                        new Date().toISOString();
          }
          
          if (companyLogo) {
            companyLogoUpdatedAt = profileData.documents?.companyLogoUpdatedAt || 
                                  profileData.entityOverview?.companyLogoUpdatedAt ||
                                  new Date().toISOString();
          }
          
          updateFormData({
            ...entityData,
            companyLetterhead,
            companyLetterheadUpdatedAt,
            companyLogo,
            companyLogoUpdatedAt
          });
        } else {
          updateFormData(data);
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
    
    // If country changes, clear city selection
    if (name === "location") {
      newData.city = ""
    }
    
    updateFormData(newData)
  }

  const handleMultiSelectChange = (field, value) => {
    const newData = { ...formData, [field]: value }
    updateFormData(newData)
  }

 const handleLetterheadUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
  const fileExtension = file.name.toLowerCase().split('.').pop();
  
  if (!allowedTypes.includes(`.${fileExtension}`)) {
    alert(`Please upload only PDF, Word, or Image files. File type .${fileExtension} is not allowed.`);
    return;
  }

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    alert('File size exceeds 10MB limit. Please upload a smaller file.');
    return;
  }

  try {
    setLetterheadUploading(true);
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Get registered name for validation
    const userDocRef = doc(db, "universalProfiles", currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    const registeredName = userDoc.exists() 
      ? userDoc.data()?.entityOverview?.registeredName || ""
      : "";

    // ✅ RUN AI VALIDATION using the Firebase function via validateCompanyDocument
    const validationResult = await validateCompanyDocument('Company Letterhead', file, registeredName);
    
    if (!validationResult.isValid) {
      alert(`Validation failed: ${validationResult.message}`);
      setLetterheadUploading(false);
      return;
    }

    // Create unique filename
    const timestamp = Date.now();
    const fileName = `company_letterhead/${currentUser.uid}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, fileName);

    // Upload to storage
    const uploadResult = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(uploadResult.ref);

    // ✅ Use sync service for letterhead
    await uploadDocumentWithSync('Company Letterhead', downloadURL, validationResult);

    // Update local state
    const newFormData = { 
      ...formData, 
      companyLetterhead: downloadURL,
      companyLetterheadUpdatedAt: new Date().toISOString()
    };
    updateFormData(newFormData);
    
    setLetterheadFile(file);
    alert('Company Letterhead uploaded and validated successfully!');

  } catch (error) {
    console.error('Error uploading letterhead:', error);
    
    // Handle specific error cases
    if (error.message?.includes('Missing registeredName')) {
      alert('Please save your Registered Name before uploading a letterhead.');
    } else if (error.message?.includes('Network error')) {
      alert('Network error. Please check your connection and try again.');
    } else {
      alert('Failed to upload letterhead. Please try again.');
    }
  } finally {
    setLetterheadUploading(false);
  }
};

  const handleDeleteLetterhead = async () => {
    try {
      const confirmDelete = window.confirm('Are you sure you want to delete the Company Letterhead?');
      if (!confirmDelete) return;

      // ✅ Use sync service for deletion
      await deleteDocumentWithSync('Company Letterhead');
      
      // Update local state
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

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px'
  }

  if (isLoading) {
    return (
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Entity Overview</h2>
        <p>Loading your information...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Entity Overview</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div>
          <FormField label="Registered Name" required>
            <input
              type="text"
              name="registeredName"
              value={formData.registeredName || ""}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </FormField>

          <FormField label="Trading Name (if different)">
            <input
              type="text"
              name="tradingName"
              value={formData.tradingName || ""}
              onChange={handleChange}
              style={inputStyle}
            />
          </FormField>

          <FormField label="Registration Number" required>
            <input
              type="text"
              name="registrationNumber"
              value={formData.registrationNumber || ""}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </FormField>

          <FormField label="Entity Type" required>
            <select
              name="entityType"
              value={formData.entityType || ""}
              onChange={handleChange}
              style={inputStyle}
              required
            >
              <option value="">Select Entity Type</option>
              {entityTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Legal Structure" required>
            <select
              name="legalStructure"
              value={formData.legalStructure || ""}
              onChange={handleChange}
              style={inputStyle}
              required
            >
              <option value="">Select Legal Structure</option>
              {legalStructures.map((structure) => (
                <option key={structure.value} value={structure.value}>
                  {structure.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Entity Size" required>
            <select
              name="entitySize"
              value={formData.entitySize || ""}
              onChange={handleChange}
              style={inputStyle}
              required
            >
              <option value="">Select Entity Size</option>
              {entitySizes.map((size) => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Financial Year End" required>
            <input
              type="month"
              name="financialYearEnd"
              value={formData.financialYearEnd || ""}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </FormField>

          <FormField label="No. of Employees" required>
            <input
              type="number"
              name="employeeCount"
              value={formData.employeeCount || ""}
              onChange={handleChange}
              min="0"
              style={inputStyle}
              required
            />
          </FormField>

          <FormField label="Years in Operation" required>
            <input
              type="number"
              name="yearsInOperation"
              value={formData.yearsInOperation || ""}
              onChange={handleChange}
              min="0"
              step="0.5"
              style={inputStyle}
              required
            />
          </FormField>
        </div>

        <div>
          <FormField label="Business Stage" required>
            <select
              name="operationStage"
              value={formData.operationStage || ""}
              onChange={handleChange}
              style={inputStyle}
              required
            >
              <option value="">Select Operation Stage</option>
              {operationStages.map((stage) => (
                <option key={stage.value} value={stage.value}>
                  {stage.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Economic Sector" required>
            <MultiSelect
              options={economicSectors}
              selected={formData.economicSectors || []}
              onChange={(value) => handleMultiSelectChange("economicSectors", value)}
              label="Economic Sectors"
            />
          </FormField>

          <FormField label="Country" required>
            <select
              name="location"
              value={formData.location || ""}
              onChange={handleChange}
              style={inputStyle}
              required
            >
              <option value="">Select Country</option>
              {africanCountries.map((country) => (
                <option key={country.value} value={country.value}>
                  {country.label}
                </option>
              ))}
            </select>
          </FormField>

          {/* City dropdown - shows when country is selected */}
          {formData.location && citiesByCountry[formData.location] && (
            <FormField label="City" required>
              <select
                name="city"
                value={formData.city || ""}
                onChange={handleChange}
                style={inputStyle}
                required
              >
                <option value="">Select City</option>
                {citiesByCountry[formData.location].map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </FormField>
          )}

          {formData.location === "South Africa" && (
            <FormField label="Province" required>
              <select
                name="province"
                value={formData.province || ""}
                onChange={handleChange}
                style={inputStyle}
                required
              >
                <option value="">Select Province</option>
                <option value="eastern_cape">Eastern Cape</option>
                <option value="free_state">Free State</option>
                <option value="gauteng">Gauteng</option>
                <option value="kwazulu_natal">KwaZulu-Natal</option>
                <option value="limpopo">Limpopo</option>
                <option value="mpumalanga">Mpumalanga</option>
                <option value="northern_cape">Northern Cape</option>
                <option value="north_west">North West</option>
                <option value="western_cape">Western Cape</option>
              </select>
            </FormField>
          )}

          <FormField label="Brief Business Description" required>
            <textarea
              name="businessDescription"
              value={formData.businessDescription || ""}
              onChange={handleChange}
              rows={4}
              style={{...inputStyle, resize: 'vertical'}}
              required
            />
          </FormField>

          <FormField label="Company Logo">
            <div style={{ 
              border: '2px dashed #C19A6B', 
              borderRadius: '8px', 
              padding: '16px',
              backgroundColor: '#FAF8F5',
              transition: 'all 0.3s ease',
              maxWidth: '400px'
            }}>
              <style>
                {`
                  @keyframes spin {
                    to { transform: rotate(360deg); }
                  }
                `}
              </style>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px',
                justifyContent: 'flex-start'
              }}>
                {/* Circular Logo Preview */}
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%', 
                  overflow: 'hidden', 
                  border: '3px solid #8B6F47',
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(139, 111, 71, 0.2)',
                  flexShrink: 0,
                  background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)'
                }}>
                  {formData.companyLogo || logoPreview ? (
                    <img 
                      src={logoPreview || formData.companyLogo} 
                      alt="Company Logo" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover' 
                      }}
                    />
                  ) : (
                    <div style={{ 
                      color: '#A0826D', 
                      fontSize: '10px', 
                      textAlign: 'center',
                      padding: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px'
                    }}>
                      <div style={{ 
                        fontSize: '28px', 
                        lineHeight: '1',
                        filter: 'grayscale(0.3)'
                      }}>🏢</div>
                      <div style={{ 
                        fontWeight: '600',
                        letterSpacing: '0.2px',
                        color: '#8B6F47',
                        fontSize: '9px'
                      }}>No Logo</div>
                    </div>
                  )}
                </div>
                
                {/* Upload Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <label 
                      htmlFor="logo-upload"
                      title="Upload Logo"
                      style={{
                        padding: '10px',
                        background: logoUploading 
                          ? 'linear-gradient(135deg, #A0826D 0%, #8B6F47 100%)' 
                          : 'linear-gradient(135deg, #8B4513 0%, #6B3410 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: logoUploading ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 8px rgba(139, 69, 19, 0.25)',
                        opacity: logoUploading ? 0.7 : 1,
                        width: '40px',
                        height: '40px'
                      }}
                      onMouseOver={(e) => {
                        if (!logoUploading) {
                          e.target.style.transform = 'translateY(-1px)';
                          e.target.style.boxShadow = '0 4px 12px rgba(139, 69, 19, 0.35)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!logoUploading) {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 8px rgba(139, 69, 19, 0.25)';
                        }
                      }}
                    >
                      {logoUploading ? (
                        <div style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid transparent',
                          borderTop: '2px solid white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></div>
                      ) : (
                        <Upload size={18} />
                      )}
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleLogoUpload}
                        disabled={logoUploading}
                        style={{ display: 'none' }}
                      />
                    </label>
                    
                    {(formData.companyLogo || logoPreview) && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        title="Remove Logo"
                        style={{
                          padding: '10px',
                          background: 'linear-gradient(135deg, #B8860B 0%, #996515 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 8px rgba(184, 134, 11, 0.25)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '40px',
                          height: '40px'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.transform = 'translateY(-1px)';
                          e.target.style.boxShadow = '0 4px 12px rgba(184, 134, 11, 0.35)';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 8px rgba(184, 134, 11, 0.25)';
                        }}
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                  
                  {/* File Info */}
                  <div style={{ 
                    fontSize: '11px', 
                    color: '#8B6F47',
                    lineHeight: '1.4',
                    backgroundColor: 'rgba(139, 111, 71, 0.08)',
                    padding: '8px 10px',
                    borderRadius: '5px',
                    border: '1px solid rgba(139, 111, 71, 0.15)'
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '2px' }}>📋 Requirements</div>
                    <div>JPG, PNG, GIF, WebP • Max 5MB</div>
                  </div>
                </div>
              </div>
            </div>
          </FormField>
          
          <FormField label="Company Letterhead">
            <div style={{ 
              border: '2px dashed #C19A6B', 
              borderRadius: '8px', 
              padding: '16px',
              backgroundColor: '#FAF8F5',
              maxWidth: '400px'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px',
                justifyContent: 'flex-start'
              }}>
                {/* Letterhead Preview/Icon */}
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '8px', 
                  overflow: 'hidden', 
                  border: '3px solid #8B6F47',
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(139, 111, 71, 0.2)',
                  flexShrink: 0,
                  background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)'
                }}>
                  {formData.companyLetterhead ? (
                    <div style={{ 
                      padding: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ 
                        fontSize: '32px', 
                        lineHeight: '1',
                        marginBottom: '4px'
                      }}>📄</div>
                      <div style={{ 
                        fontSize: '9px', 
                        fontWeight: '600',
                        color: '#8B6F47'
                      }}>Letterhead</div>
                    </div>
                  ) : (
                    <div style={{ 
                      color: '#A0826D', 
                      fontSize: '10px', 
                      textAlign: 'center',
                      padding: '6px'
                    }}>
                      <div style={{ 
                        fontSize: '28px', 
                        lineHeight: '1',
                        marginBottom: '2px'
                      }}>📋</div>
                      <div style={{ 
                        fontWeight: '600',
                        letterSpacing: '0.2px',
                        color: '#8B6F47',
                        fontSize: '9px'
                      }}>No Letterhead</div>
                    </div>
                  )}
                </div>
                
                {/* Upload Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <label 
                      htmlFor="letterhead-upload"
                      title="Upload Company Letterhead"
                      style={{
                        padding: '10px 16px',
                        background: letterheadUploading 
                          ? 'linear-gradient(135deg, #A0826D 0%, #8B6F47 100%)' 
                          : 'linear-gradient(135deg, #8B4513 0%, #6B3410 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: letterheadUploading ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 8px rgba(139, 69, 19, 0.25)',
                        opacity: letterheadUploading ? 0.7 : 1
                      }}
                      onMouseOver={(e) => {
                        if (!letterheadUploading) {
                          e.target.style.transform = 'translateY(-1px)';
                          e.target.style.boxShadow = '0 4px 12px rgba(139, 69, 19, 0.35)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!letterheadUploading) {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 8px rgba(139, 69, 19, 0.25)';
                        }
                      }}
                    >
                      {letterheadUploading ? (
                        <>
                          <div style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid transparent',
                            borderTop: '2px solid white',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }}></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={16} />
                          {formData.companyLetterhead ? 'Replace' : 'Upload'}
                        </>
                      )}
                      <input
                        id="letterhead-upload"
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleLetterheadUpload}
                        disabled={letterheadUploading}
                        style={{ display: 'none' }}
                      />
                    </label>
                    
                    {formData.companyLetterhead && (
                      <button
                        type="button"
                        onClick={handleDeleteLetterhead}
                        title="Delete Letterhead"
                        style={{
                          padding: '10px 16px',
                          background: 'linear-gradient(135deg, #B8860B 0%, #996515 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 8px rgba(184, 134, 11, 0.25)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.transform = 'translateY(-1px)';
                          e.target.style.boxShadow = '0 4px 12px rgba(184, 134, 11, 0.35)';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 8px rgba(184, 134, 11, 0.25)';
                        }}
                      >
                        <X size={16} />
                        Delete
                      </button>
                    )}
                  </div>
                  
                  {/* File Info and Status */}
                  <div style={{ 
                    fontSize: '11px', 
                    color: '#8B6F47',
                    lineHeight: '1.4',
                    backgroundColor: 'rgba(139, 111, 71, 0.08)',
                    padding: '8px 10px',
                    borderRadius: '5px',
                    border: '1px solid rgba(139, 111, 71, 0.15)'
                  }}>
                    {formData.companyLetterhead ? (
                      <>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>✅ Letterhead Uploaded</div>
                        <a 
                          href={formData.companyLetterhead} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            color: '#8B4513', 
                            textDecoration: 'underline',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          View Document ↗
                        </a>
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
        </div>
      </div>
    </div>
  )
}