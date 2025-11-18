"use client"
import { useState, useEffect } from "react"
import { CheckCircle, XCircle, Upload, FileText, Loader2 } from "lucide-react"
import FileUpload from "./file-upload"
import './UniversalProfile.css';
import { GoogleGenAI } from "@google/genai";
import { db, auth } from "../../firebaseConfig"
import { doc, getDoc, updateDoc, serverTimestamp  } from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  getProfileDocuments, 
  getDocumentLabel, 
  UNIFIED_DOCUMENT_PATHS,
  getDocumentId 
} from "../../utils/documentMapping";
import { useDocumentSync } from "../../components/useDocumentSync";

const ai = new GoogleGenAI({ 
  apiKey: "AIzaSyDwdY9ZbfwjRftP4WAlKfLIQ9jR-vWYYxk"
});

const documentValidationRules = {
  "Company Registration Certificate": {
  requiredElements: [
    "Issued by CIPC/Companies Registry",
    "Company registration number",
    "Registered company name",
    "Date of incorporation",
    "Company type (Pty Ltd, CC, etc.)",
    "Official stamp/signature"
  ],
  strictChecks: ["issued_by_cipc", "has_registration_number", "matches_company_name"]
},
  "Certified IDs of Directors & Shareholders": {
  requiredElements: [
    "Certification stamp/signature (Commissioner of Oaths)",
    "Certification date within last 3 months",
    "South African ID number (13 digits)",
    "Photograph of ID holder",
    "Full names matching company records",
    "Keywords: Certified, True Copy, Commissioner of Oaths"
  ],
    strictChecks: ["certified_within_3_months", "has_id_numbers", "names_match_records"]
},
"Share Register": {
  requiredElements: [
    "Company name and registration number",
    "Shareholder names and details",
    "Number and class of shares held",
    "Issue dates of shares",
    "Certificate numbers",
    "Director/company secretary signature"
  ],
  strictChecks: ["matches_company_records", "has_share_details", "complete_shareholder_list"]
},
"Proof of Address": {
  requiredElements: [
    "Full name and physical address",
    "Issue date within last 3 months",
    "Utility company/landlord details",
    "Account number or reference",
    "Official stamp/letterhead"
  ],
  strictChecks: ["recent_issue_date", "matches_applicant_name", "has_physical_address"]
},
  "Tax Clearance Certificate": {
  requiredElements: [
    "Issued by South African Revenue Service (SARS)",
    "Tax Reference Number",
    "Issue Date", 
    "Expiry Date (usually 1 year from issue)",
    "Certificate Number",
    "Taxpayer Name and Address",
    "SARS official stamp/signature",
    "Clearance Status (Good Standing)"
  ],
  criticalChecks: ["has_tax_reference_number", "has_expiry_date", "issued_by_sars", "valid_clearance_status"]
},
"VAT Certificate": {
  requiredElements: [
    "VAT Registration Number",
    "Business Name and Trading Name", 
    "Business Address",
    "Date of Registration",
    "VAT Registration Status",
    "Issued by SARS",
    "VAT number format (starts with 4)"
  ],
  criticalChecks: ["has_vat_number", "valid_vat_format", "issued_by_sars", "has_registration_date"]
},
  "B-BBEE Certificate": {
    requiredElements: [
      "Issued by accredited verification agency",
      "B-BBEE certificate number",
      "B-BBEE level (1-8)",
      "Expiry dates",
      "Company registration details",
     "SANAS logo or accreditation number / CIPC Logo / DTIC",
     "Expiry date (B-BBEE certificates are valid for 1 year only)"

    ],
  strictChecks: ["has_certificate_number", "not_expired", "currently_valid"]
  },
  "UIF/PAYE/COIDA Certificates": {
  requiredElements: [
    "Certificate type clearly stated (UIF/PAYE/COIDA)",
    "Company name and registration number",
    "Certificate/registration number",
    "Issue date and validity period", 
    "Issued by Department of Labour/SARS",
    "Compliance status (Good Standing/Registered)",
    "Official stamp or signature"
  ],
  criticalChecks: ["certificate_type_clear", "has_registration_number", "valid_issue_date"]
},
"Industry Accreditations": {
  requiredElements: [
    "Accreditation/Certificate title",
    "Issuing accreditation body",
    "Scope/standard (e.g., ISO 9001)",
    "Issue and expiry dates",
    "Company name matches applicant"
  ],
   strictChecks: ["has_expiry_date", "issued_by_accredited_body", "matches_company_name"]
},
"Company Profile / Brochure": {
  requiredElements: [
    "Company name and logo",
    "About Us/Company Overview section",
    "Mission, Vision, Values statements",
    "Management/Team information",
    "Contact details",
    "Services/Products description"
  ],
  strictChecks: ["has_company_details", "has_mission_vision", "has_contact_info"]
},
"Client References": {
  requiredElements: [
    "Reference letter heading/title",
    "Client company name and contact details",
    "Description of services provided",
    "Performance/satisfaction statement",
    "Dates of service/work period",
    "Authorized signature and position"
  ],
  strictChecks:["has_client_details", "describes_services", "has_signature"]
},
}

// Create documents list from profile documents
const documentsList = getProfileDocuments().map(label => {
  const documentId = getDocumentId(label);
  const baseConfig = {
    id: documentId,
    label: label,
    accept: ".pdf,.jpg,.jpeg,.png",
    required: true,
    multiple: false,
    description: `${label} document`
  };
  
  // Add multiple file support for specific documents
  if (['certifiedIds', 'otherCerts', 'industryAccreditationDocs', 'clientReferences'].includes(documentId)) {
    baseConfig.multiple = true;
  }
  
  // Add Excel support for share register
  if (documentId === 'shareRegister') {
    baseConfig.accept = ".pdf,.jpg,.jpeg,.png,.xlsx,.xls";
  }
  
  return baseConfig;
});

export default function Documents({ data = {}, updateData }) {
  const [formData, setFormData] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [uploadStatus, setUploadStatus] = useState({})
  const [uploadingDocs, setUploadingDocs] = useState({})
  const [verificationStatus, setVerificationStatus] = useState({});
  const [uploadProgress, setUploadProgress] = useState({
    isUploading: false,
    currentStep: '',
    documentName: ''
  });

  // Use the synchronization hook
  useDocumentSync(null, null, setFormData);

  useEffect(() => {
    const loadDocuments = async () => {
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
          const documentsData = {};
          const verificationData = {};
          
          // Initialize all documents with empty arrays
          documentsList.forEach(doc => {
            documentsData[doc.id] = [];
          });
          
          // Populate with unified document data
          if (profileData.documents) {
            documentsList.forEach(doc => {
              const url = profileData.documents[doc.id];
              if (url) {
                documentsData[doc.id] = Array.isArray(url) ? url : [url];
              }
            });
          }
          
          // Load verification status
          if (profileData.verification) {
            documentsList.forEach(doc => {
              if (profileData.verification[doc.id]) {
                verificationData[doc.id] = profileData.verification[doc.id];
              }
            });
          }
            
          setFormData(documentsData);
          setVerificationStatus(verificationData);
          updateData(documentsData);
          
          // Update upload status
          const status = {};
          documentsList.forEach(doc => {
            const files = documentsData[doc.id] || [];
            status[doc.id] = files.length > 0 ? 'success' : 'pending';
          });
          setUploadStatus(status);
          
        } else {
          // Initialize with passed data
          setFormData(data);
          const status = {};
          documentsList.forEach(doc => {
            const files = data[doc.id] || [];
            status[doc.id] = files.length > 0 ? 'success' : 'pending';
          });
          setUploadStatus(status);
        }
      } catch (error) {
        console.error("Error loading documents:", error);
        setFormData(data);
      } finally {
        setIsLoading(false);
      }
    };

    loadDocuments();
  }, []);

  const getRegisteredName = async () => {
    const user = auth.currentUser;
    
    if (!user) {
      console.log("❌ No user found");
      return null;
    }

    try {
      console.log("🔍 Fetching from universalProfiles with UID:", user.uid);
      const profileRef = doc(db, "universalProfiles", user.uid);
      const profileSnap = await getDoc(profileRef);
      
      console.log("🔍 Profile exists:", profileSnap.exists());
      
      if (profileSnap.exists()) {
        const data = profileSnap.data();
        
        // ✅ GET registeredName FROM entityOverview
        const registeredName = data.entityOverview?.registeredName;
        
        console.log("🏢 Found registeredName:", registeredName);
        return registeredName || null;
      } else {
        console.log("❌ No profile found for UID:", user.uid);
        return null;
      }
    } catch (error) {
      console.error("❌ Error fetching registeredName:", error);
      return null;
    }
  };

  const createStrictPrompt = (docLabel, rules, registeredName) => { 
    return `
ANALYZE THE UPLOADED DOCUMENT FILE (not these instructions):

DOCUMENT VALIDATION FOR: ${docLabel}

CRITICAL CHECKS:
1. 🔴 DOCUMENT TYPE: Must be exactly ${docLabel}
2. 🔴 COMPANY NAME: Must match "${registeredName}" 
3. 🔴 EXPIRY DATE: Must not be expired (current year: 2025)
4. 🔴 COMPLETENESS: All required elements present

REQUIRED ELEMENTS IN UPLOADED DOCUMENT:
${rules.requiredElements.map(item => `- ${item}`).join('\n')}

ANALYZE THE UPLOADED FILE AND RESPOND WITH:
{
  "isValid": true,
  "status": "verified" | "wrong_type" | "name_mismatch" | "expired" | "incomplete",
  "identifiedDocumentType": "What you detected the uploaded file to be",
  "message": "Brief validation result",
  "warnings": []
}
`;
  };

  const validateDocumentWithAI = async (docLabel, file, registeredName) => {
    const checkExpiryDate = (aiResponseText, file) => {
      const datePatterns = [
        /\b(\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b/gi,
        /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})\b/gi,
        /\b(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/gi
      ];
      
      let allDates = [];
      datePatterns.forEach(pattern => {
        const matches = aiResponseText.match(pattern) || [];
        allDates = [...allDates, ...matches];
      });
      
      const hasExpiryKeyword = /expir|valid until|valid to|expires|valid through|expiry date|validity|expiration/i.test(aiResponseText);
      
      const hasOldDate = allDates.some(date => {
        const yearMatch = date.match(/\d{4}/);
        if (yearMatch) {
          const year = parseInt(yearMatch[0]);
          return year < 2023;
        }
        return false;
      });
      
      return hasExpiryKeyword && hasOldDate;
    };

    const manualExpiryCheck = (file, docLabel) => {
    const expiryDocuments = [
      'B-BBEE Certificate', 'Tax Clearance Certificate', 
      'Industry Accreditations', 'VAT Certificate', 'Tax Clearance Cert'
    ];
    
    if (!expiryDocuments.includes(docLabel)) {
      return false;
    }
    
    const currentYear = new Date().getFullYear();
    const fileName = file.name.toLowerCase();
    
    // Check for old dates in filename (2010-2022)
    for (let year = 2010; year < 2023; year++) {
      if (fileName.includes(year.toString())) {
        console.log(`🔍 Manual expiry detected: File contains ${year}`);
        return true;
      }
    }
    
    // Check file modification date
    if (file.lastModified) {
      const fileYear = new Date(file.lastModified).getFullYear();
      if (fileYear < 2023) {
        console.log(`🔍 Manual expiry detected: File from ${fileYear}`);
        return true;
      }
    }
    
    return false;
  };

    const parseDetailedResponse = (responseText, docLabel) => {
      const documentTypeMap = {
        "tax clearance": "Tax Clearance Certificate",
        "tax certificate": "Tax Clearance Certificate", 
        "sars certificate": "Tax Clearance Certificate",
        "vat": "VAT Certificate",
        "vat registration": "VAT Certificate",
        "financial statement": "Financial Statements",
        "audited financial": "Audited Financials",
        "5 year budget": "5 Year Budget",
        "bbbee": "B-BBEE Certificate",
        "b-bbee": "B-BBEE Certificate",
        "company registration": "Company Registration Certificate",
        "cipc": "Company Registration Certificate",
        "company profile": "Company Profile",
        "brochure": "Company Profile",
        "share register": "Share Register",
        "certified id": "Certified IDs",
        "id document": "Certified IDs",
        "proof of address": "Proof of Address",
        "utility bill": "Proof of Address",
        "client reference": "Client References",
        "reference letter": "Client References",
        "industry accreditation": "Industry Accreditations",
        "certificate": "Industry Accreditations",
        "support letter": "Support Letters",
        "endorsement": "Support Letters",
        "business plan": "Business Plan",
        "pitch deck": "Pitch Deck",
        "impact statement": "Impact Statements",
        "loan agreement": "Loan Agreements",
        "contract": "Guarantee Contracts",
        "uif": "UIF/PAYE/COIDA Certificates",
        "paye": "UIF/PAYE/COIDA Certificates",
        "coida": "UIF/PAYE/COIDA Certificates",
        "program report": "Previous Program Reports"
      };

      const extractDocumentType = (text) => {
        const lowerText = text.toLowerCase();
        
        for (const [key, documentType] of Object.entries(documentTypeMap)) {
          if (lowerText.includes(key)) {
            return documentType;
          }
        }
        
        if (lowerText.includes('tax') && lowerText.includes('clearance')) return "Tax Clearance Certificate";
        if (lowerText.includes('bbbee') || lowerText.includes('b-bbee')) return "B-BBEE Certificate";
        if (lowerText.includes('vat')) return "VAT Certificate";
        if (lowerText.includes('company') && lowerText.includes('registration')) return "Company Registration Certificate";
        if (lowerText.includes('business') && lowerText.includes('plan')) return "Business Plan";
        
        return "this document type";
      };

   try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        let userMessage;
        let status = parsed.status;
        
        // ✅ MORE RELIABLE: Use the AI's identifiedDocumentType if provided
        let identifiedType = parsed.identifiedDocumentType;
        
        // If AI didn't provide identified type, use our fallback
        if (!identifiedType || identifiedType === "EXACT_DOCUMENT_NAME_FROM_LIST") {
          identifiedType = extractDocumentType(parsed.message || responseText);
        }

        // ✅ CLEANER WRONG TYPE MESSAGES
        if (parsed.status === "wrong_type" || (!parsed.isValid && identifiedType !== docLabel)) {
          userMessage = `Please upload a ${docLabel} doc, not ${identifiedType}`;
          status = "wrong_type";
        } else if (parsed.status === "name_mismatch") {
          userMessage = "Company name does not match your registered name";
          status = "name_mismatch";
        } else if (parsed.status === "expired") {
          userMessage = "Document expired";
          status = "expired";
        } else {
          userMessage = "Document verified";
          status = "verified";
        }
        
        return {
          isValid: true,
          status: status,
          message: userMessage,
          warnings: parsed.warnings || []
        };
      }
   
        const lowerText = responseText.toLowerCase();
        if (lowerText.includes('false') || lowerText.includes('invalid') || lowerText.includes('reject')) {
          const docType = extractDocumentType(responseText);
          return {
            isValid: true,
            status: "wrong_type",
            message: `Please upload a ${docLabel}, not ${docType}`,
            warnings: []
          };
        }
        
        if (lowerText.includes('true') || lowerText.includes('valid') || lowerText.includes('approve')) {
          return {
            isValid: true,
            status: "verified", 
            message: "Document verified",
            warnings: []
          };
        }
        
        return {
          isValid: true,
          status: "rejected",
          message: "Validation failed",
          warnings: []
        };
        
      } catch (error) {
        return {
          isValid: true,
          status: "rejected",
          message: "Validation error",
          warnings: []
        };
      }
    };

    try {
      const rules = documentValidationRules[docLabel];
      
      const validationPrompt = rules ? 
        createStrictPrompt(docLabel, rules, registeredName) :
        `Check if this document is a valid ${docLabel}. Return JSON with isValid true/false and message.`;

      const base64Data = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
      });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: file.type,
                  data: base64Data,
                }
              },
              {
                text: validationPrompt
              }
            ]
          }
        ]
      });

     console.log("🔍 RAW AI RESPONSE:", response.text);

  let finalResult = parseDetailedResponse(response.text, docLabel);

  // ✅ ALWAYS CHECK EXPIRY, NOT JUST FOR VERIFIED DOCUMENTS
  const isExpired = checkExpiryDate(response.text, file) || manualExpiryCheck(file, docLabel);

  if (isExpired) {
    finalResult = {
      isValid: true,
      status: "expired", 
      message: "Document expired",
      warnings: []
    };
  }

  return finalResult;
      
      
    } catch (error) {
    console.error("AI validation failed:", error);
    
    let errorMessage = "Network error - please try again";
    
    if (error.message?.includes('network') || error.message?.includes('fetch') || error.message?.includes('timeout')) {
      errorMessage = "Network error - please check your connection and try again";
    } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
      errorMessage = "Validation service temporarily unavailable - please try again later";
    } else if (error.message?.includes('api key') || error.message?.includes('authentication')) {
      errorMessage = "Validation service configuration error - please contact support";
    }
    
    return {
      isValid: false, 
      status: "validation_failed",
      message: errorMessage,
      warnings: []
    };
  }
};

const handleFileChange = async (documentId, files) => {
  console.log("🎯 handleFileChange STARTED");
  
  const documentConfig = documentsList.find(doc => doc.id === documentId);
  const documentLabel = documentConfig?.label || getDocumentLabel(documentId);
  
  setUploadProgress({
    isUploading: true,
    currentStep: 'Starting validation...',
    documentName: documentLabel
  });

  try {
    if (!auth.currentUser) {
      console.error("User not authenticated");
      setUploadProgress({ isUploading: false, currentStep: '', documentName: '' });
      return;
    }
    
    setUploadingDocs(prev => ({ ...prev, [documentId]: true }));
    
    const filesArray = Array.isArray(files) ? files : [files];
    
    if (filesArray.length === 0 || !filesArray[0]) {
      console.error("No files selected");
      setUploadingDocs(prev => ({ ...prev, [documentId]: false }));
      setUploadProgress({ isUploading: false, currentStep: '', documentName: '' });
      return;
    }
    
    // File format check
    setUploadProgress(prev => ({ ...prev, currentStep: 'Checking file format...' }));
    
    for (const file of filesArray) {
      if (file && (file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc'))) {
        alert('Please convert this Word document to PDF before uploading. Gemini AI cannot process .docx files.');
        setUploadingDocs(prev => ({ ...prev, [documentId]: false }));
        setUploadProgress({ isUploading: false, currentStep: '', documentName: '' });
        return;
      }
    }
    
    // Get registered name
    setUploadProgress(prev => ({ ...prev, currentStep: 'Verifying company details...' }));
    
    const registeredName = await getRegisteredName();
    console.log("🏢 Registered Name:", registeredName);
    
    let validationResult;
    
    // Validate each file
    for (const file of filesArray) {
      setUploadProgress(prev => ({ ...prev, currentStep: 'Analyzing document content...' }));
      validationResult = await validateDocumentWithAI(documentLabel, file, registeredName);
      
      // ✅ CRITICAL: Check if validation failed
      if (!validationResult.isValid) {
        alert(`Validation failed: ${validationResult.message}`);
        setUploadingDocs(prev => ({ ...prev, [documentId]: false }));
        setUploadProgress({ isUploading: false, currentStep: '', documentName: '' });
        return; // ✅ STOP HERE - don't upload to database
      }
    }

    if (!validationResult) {
      console.error("No validation result obtained");
      setUploadingDocs(prev => ({ ...prev, [documentId]: false }));
      setUploadProgress({ isUploading: false, currentStep: '', documentName: '' });
      return;
    }


      // ✅ USE FUNCTION FORM
      setUploadProgress(prev => ({ ...prev, currentStep: 'Updating verification status...' }));
      
      setVerificationStatus(prev => ({
        ...prev,
        [documentId]: {
          status: validationResult.status,
          message: validationResult.message,
          lastChecked: new Date()
        }
      }));

      const updatedData = { ...formData, [documentId]: filesArray };
      setFormData(updatedData);
      updateData(updatedData);
        
      setUploadStatus(prev => ({
        ...prev,
        [documentId]: files.length > 0 ? 'success' : 'pending'
      }));

      const userId = auth.currentUser?.uid;
      if (userId) {
        // ✅ USE FUNCTION FORM
        setUploadProgress(prev => ({ ...prev, currentStep: 'Uploading to secure storage...' }));
        
        const docRef = doc(db, "universalProfiles", userId);
        const file = filesArray[0];
        const fileExtension = file.name.toLowerCase().split('.').pop();

        const storage = getStorage();
        const storageRef = ref(storage, `universalProfiles/documents/${userId}/${documentId}_${Date.now()}.${fileExtension}`);
    
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
    
        const updateData = {
          [`documents.${documentId}`]: downloadURL,
          [`documents.${documentId}UpdatedAt`]: serverTimestamp(),
          [`verification.${documentId}`]: {
            status: validationResult.status,
            message: validationResult.message,
            lastChecked: serverTimestamp()
          }
        };

        // Update profile-specific paths
        switch(documentId) {
          case 'registrationCertificate':
            updateData[`entityOverview.${documentId}`] = downloadURL;
            break;
          case 'certifiedIds':
          case 'shareRegister':
            updateData[`ownershipManagement.${documentId}`] = downloadURL;
            break;
          case 'proofOfAddress':
            updateData[`contactDetails.${documentId}`] = downloadURL;
            break;
          case 'taxClearanceCert':
          case 'vatCertificate':
          case 'bbbeeCert':
          case 'otherCerts':
          case 'industryAccreditationDocs':
            updateData[`legalCompliance.${documentId}`] = downloadURL;
            break;
          case 'companyProfile':
          case 'clientReferences':
            updateData[`productsServices.${documentId}`] = downloadURL;
            break;
          default:
            console.log(`Document ${documentId} saved to documents section only`);
        }      
        await updateDoc(docRef, updateData);
        
        setVerificationStatus(prev => ({
          ...prev,
          [documentId]: {
            status: validationResult.status,
            message: validationResult.message,
            lastChecked: new Date()
          }
        }));
        
        console.log(`Document ${documentId} uploaded with status: ${validationResult.status}`);
      }

      // ✅ UPLOAD COMPLETE - KEEP THIS
      setUploadProgress({ isUploading: false, currentStep: '', documentName: '' });
      
      } catch (error) {
        console.error("Error uploading files:", error);
        alert('Upload failed - please try again');
        setUploadProgress({ isUploading: false, currentStep: '', documentName: '' });
      } finally {
        setUploadingDocs(prev => ({ ...prev, [documentId]: false }));
      }
  };

  const getStatusBadge = (documentId, document) => {
    const isUploading = uploadingDocs[documentId];
    const files = formData[documentId] || [];
    const verification = verificationStatus[documentId];
    
    if (isUploading) {
      return (
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 8px",
          borderRadius: "16px",
          fontSize: "11px",
          fontWeight: "600",
          backgroundColor: "#e3f2fd",
          color: "#1976d2"
        }}>
          <Loader2 style={{ width: "12px", height: "12px" }} className="animate-spin" />
          Uploading
        </span>
      );
    }
    
 if (files.length > 0) {
  let backgroundColor = "#e8f5e8";
  let color = "#2e7d32";
  let statusText = "Uploaded";
  
  if (verification) {
    // ✅ ANY non-verified status = "Rejected"
    if (verification.status === "verified" || verification.status === "expiring_soon") {
      backgroundColor = "#e8f5e8";
      color = "#2e7d32";
      statusText = "Uploaded";
    } else {
      backgroundColor = "#ffebee";
      color = "#c62828";
      statusText = "Rejected";
    }
  }
  
      
      return (
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 8px",
          borderRadius: "16px",
          fontSize: "11px",
          fontWeight: "600",
          backgroundColor,
          color
        }}>
          <CheckCircle style={{ width: "12px", height: "12px" }} />
          {statusText}
        </span>
      );
    } else {
      return (
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 8px",
          borderRadius: "16px",
          fontSize: "11px",
          fontWeight: "600",
          backgroundColor: document.required ? "#ffebee" : "#e3f2fd",
          color: document.required ? "#c62828" : "#1976d2"
        }}>
          <XCircle style={{ width: "12px", height: "12px" }} />
          {document.required ? "Missing" : "Optional"}
        </span>
      );
    }
  };

const handleDeleteFile = async (documentId, fileIndex) => {
  const currentFiles = formData[documentId] || []
  const updatedFiles = currentFiles.filter((_, index) => index !== fileIndex)
  
  // Update local state
  const updatedData = { ...formData, [documentId]: updatedFiles }
  setFormData(updatedData)
  updateData(updatedData)
  
  // Update Firebase - CLEAR VERIFICATION STATUS AND TIMESTAMPS TOO
  try {
    const userId = auth.currentUser?.uid
    if (userId) {
      const docRef = doc(db, "universalProfiles", userId)
      
      // Create update data that clears both document URL, verification, and timestamps
      const updateData = {
        [`documents.${documentId}`]: null, // Set to null instead of empty array
        [`verification.${documentId}`]: null, // Clear verification status
        [`documents.${documentId}UpdatedAt`]: null // ✅ Clear unified timestamp
      }

      // Also clear from profile-specific paths and their timestamps
      switch(documentId) {
        case 'registrationCertificate':
          updateData[`entityOverview.registrationCertificate`] = null
          updateData[`entityOverview.registrationCertificateUpdatedAt`] = null // ✅ Clear timestamp
          break
        case 'certifiedIds':
          updateData[`ownershipManagement.certifiedIds`] = null
          updateData[`ownershipManagement.certifiedIdsUpdatedAt`] = null // ✅ Clear timestamp
          break
        case 'shareRegister':
          updateData[`ownershipManagement.shareRegister`] = null
          updateData[`ownershipManagement.shareRegisterUpdatedAt`] = null // ✅ Clear timestamp
          break
        case 'proofOfAddress':
          updateData[`contactDetails.proofOfAddress`] = null
          updateData[`contactDetails.proofOfAddressUpdatedAt`] = null // ✅ Clear timestamp
          break
        case 'taxClearanceCert':
          updateData[`legalCompliance.taxClearanceCert`] = null
          updateData[`legalCompliance.taxClearanceCertUpdatedAt`] = null // ✅ Clear timestamp
          break
        case 'vatCertificate':
          updateData[`legalCompliance.vatCertificate`] = null
          updateData[`legalCompliance.vatCertificateUpdatedAt`] = null // ✅ Clear timestamp
          break
        case 'bbbeeCert':
          updateData[`legalCompliance.bbbeeCert`] = null
          updateData[`legalCompliance.bbbeeCertUpdatedAt`] = null // ✅ Clear timestamp
          break
        case 'otherCerts':
          updateData[`legalCompliance.otherCerts`] = null
          updateData[`legalCompliance.otherCertsUpdatedAt`] = null // ✅ Clear timestamp
          break
        case 'industryAccreditationDocs':
          updateData[`legalCompliance.industryAccreditationDocs`] = null
          updateData[`legalCompliance.industryAccreditationDocsUpdatedAt`] = null // ✅ Clear timestamp
          break
        case 'companyProfile':
          updateData[`productsServices.companyProfile`] = null
          updateData[`productsServices.companyProfileUpdatedAt`] = null // ✅ Clear timestamp
          break
        case 'clientReferences':
          updateData[`productsServices.clientReferences`] = null
          updateData[`productsServices.clientReferencesUpdatedAt`] = null // ✅ Clear timestamp
          break
      }
      
      await updateDoc(docRef, updateData)
      console.log(`Document ${documentId} deleted and timestamps cleared`)
    }
  } catch (error) {
    console.error("Error deleting file:", error)
  }
}

  const getProgressStats = () => {
    const required = documentsList.filter(doc => doc.required)
    const optional = documentsList.filter(doc => !doc.required)
    
    const requiredUploaded = required.filter(doc => {
      const files = formData[doc.id] || []
      return files.length > 0
    }).length
    
    const optionalUploaded = optional.filter(doc => {
      const files = formData[doc.id] || []
      return files.length > 0
    }).length
    
    return {
      required: { uploaded: requiredUploaded, total: required.length },
      optional: { uploaded: optionalUploaded, total: optional.length }
    }
  }

  const stats = getProgressStats()

  if (isLoading) {
    return (
      <div style={{ 
        backgroundColor: "#faf8f6",
        borderRadius: "12px",
        minHeight: "500px"
      }}>
        <h2 style={{ 
          fontSize: "24px", 
          fontWeight: "bold", 
          color: "#5d4037", 
          marginBottom: "30px",
          textAlign: "left"
        }}>Document Upload Center</h2>
        
        {/* Loading skeleton that matches the actual layout */}
        <div style={{
          backgroundColor: "#f5f2f0",
          border: "2px solid #d7ccc8",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "30px"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "20px"
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              backgroundColor: "#e0e0e0",
              borderRadius: "50%"
            }}></div>
            
            <div style={{ flex: 1 }}>
              <div style={{
                height: "16px",
                backgroundColor: "#e0e0e0",
                width: "60%",
                marginBottom: "8px",
                borderRadius: "4px"
              }}></div>
              <div style={{
                height: "12px",
                backgroundColor: "#e0e0e0",
                width: "80%",
                borderRadius: "4px"
              }}></div>
            </div>
          </div>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px"
          }}>
            {[1, 2, 3].map((item) => (
              <div key={item} style={{
                backgroundColor: "#efebe9",
                padding: "16px",
                borderRadius: "8px",
                height: "120px"
              }}>
                <div style={{
                  height: "16px",
                  backgroundColor: "#e0e0e0",
                  width: "40%",
                  marginBottom: "12px",
                  borderRadius: "4px"
                }}></div>
                <div style={{
                  height: "12px",
                  backgroundColor: "#e0e0e0",
                  width: "90%",
                  marginBottom: "8px",
                  borderRadius: "4px"
                }}></div>
                <div style={{
                  height: "12px",
                  backgroundColor: "#e0e0e0",
                  width: "80%",
                  borderRadius: "4px"
                }}></div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Documents table skeleton */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
          marginBottom: "30px"
        }}>
          <div style={{
            width: "100%",
            borderCollapse: "collapse"
          }}>
            {/* Table header skeleton */}
            <div style={{
              backgroundColor: "#8d6e63",
              height: "40px",
              display: "flex"
            }}>
              {[1, 2, 3, 4].map((item) => (
                <div key={item} style={{
                  flex: item === 3 ? 2 : 1,
                  padding: "8px",
                  borderRight: "1px solid rgba(255,255,255,0.1)"
                }}></div>
              ))}
            </div>
            
            {/* Table rows skeleton */}
            {[1, 2, 3, 4, 5].map((row) => (
              <div key={row} style={{
                display: "flex",
                backgroundColor: row % 2 === 0 ? "#faf8f6" : "#f5f2f0",
                borderBottom: "1px solid #e8d8cf",
                height: "50px"
              }}>
                {[1, 2, 3, 4].map((cell) => (
                  <div key={cell} style={{
                    flex: cell === 3 ? 2 : 1,
                    padding: "8px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center"
                  }}>
                    <div style={{
                      width: cell === 4 ? "80%" : "60%",
                      height: "20px",
                      backgroundColor: "#e0e0e0",
                      borderRadius: "4px"
                    }}></div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        
        {/* Summary footer skeleton */}
        <div style={{
          padding: "20px",
          backgroundColor: "#efebe9",
          borderRadius: "8px",
          borderLeft: "4px solid #8d6e63"
        }}>
          <div style={{
            height: "16px",
            backgroundColor: "#e0e0e0",
            width: "30%",
            marginBottom: "16px",
            borderRadius: "4px"
          }}></div>
          <div style={{
            height: "12px",
            backgroundColor: "#e0e0e0",
            width: "80%",
            marginBottom: "8px",
            borderRadius: "4px"
          }}></div>
          <div style={{
            height: "12px",
            backgroundColor: "#e0e0e0",
            width: "70%",
            borderRadius: "4px"
          }}></div>
        </div>
      </div>
    )
  }


  return (
    
    <div style={{ 
      backgroundColor: "#faf8f6",
      borderRadius: "12px"
    }}>
      <style>
  {`
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `}
</style>

      <h2 style={{ 
        fontSize: "24px", 
        fontWeight: "bold", 
        color: "#5d4037", 
        marginBottom: "30px",
        textAlign: "left"
      }}>Document Upload Center</h2>

      {/* Guidelines Section */}
      <div style={{
        backgroundColor: "#f5f2f0",
        border: "2px solid #d7ccc8",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "30px"
      }}>
        <h3 style={{
          fontSize: "18px",
          fontWeight: "600",
          color: "#5d4037",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          📋 Document Submission Guidelines
        </h3>
        <p style={{
          color: "#6d4c41",
          lineHeight: "1.6",
          marginBottom: "20px"
        }}>
          To ensure smooth processing and consistent formatting across our systems, we only accept the following file types and sizes:
        </p>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px"
        }}>
          <div style={{
            backgroundColor: "#efebe9",
            padding: "16px",
            borderRadius: "8px",
            borderLeft: "4px solid #4caf50"
          }}>
            <h4 style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#2e7d32",
              marginBottom: "12px"
            }}>✅ Accepted File Formats</h4>
            <ul style={{
              margin: "0",
              paddingLeft: "20px",
              color: "#5d4037",
              fontSize: "14px",
              lineHeight: "1.5"
            }}>
              <li style={{ marginBottom: "4px" }}><strong>PDF</strong> (.pdf) – Preferred format for all official documents</li>
              <li style={{ marginBottom: "4px" }}><strong>Word Documents</strong> (.doc, .docx) – For editable text documents</li>
              <li style={{ marginBottom: "4px" }}><strong>Excel Spreadsheets</strong> (.xls, .xlsx) – For financials or data tables</li>
              <li style={{ marginBottom: "4px" }}><strong>Image Files</strong> (.jpg, .jpeg, .png) – For scanned IDs or proof of address</li>
            </ul>
          </div>
          
          <div style={{
            backgroundColor: "#efebe9",
            padding: "16px",
            borderRadius: "8px",
            borderLeft: "4px solid #ff9800"
          }}>
            <h4 style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#f57c00",
              marginBottom: "12px"
            }}>⚠️ File Size Limit</h4>
            <ul style={{
              margin: "0",
              paddingLeft: "20px",
              color: "#5d4037",
              fontSize: "14px",
              lineHeight: "1.5"
            }}>
              <li>Maximum upload size: <strong>10 MB per file</strong></li>
            </ul>
          </div>
          
          <div style={{
            backgroundColor: "#efebe9",
            padding: "16px",
            borderRadius: "8px",
            borderLeft: "4px solid #f44336"
          }}>
            <h4 style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#c62828",
              marginBottom: "12px"
            }}>🚫 Unsupported Formats</h4>
            <ul style={{
              margin: "0",
              paddingLeft: "20px",
              color: "#5d4037",
              fontSize: "14px",
              lineHeight: "1.5"
            }}>
              <li style={{ marginBottom: "4px" }}>No ZIP/RAR folders, executable files (.exe), or Google Docs/Drive links</li>
              <li style={{ marginBottom: "4px" }}>Please download and upload original files directly (no screenshots or photos of screens)</li>
            </ul>
          </div>
        </div>
      </div>

    
      {/* Documents Table */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "12px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        overflow: "hidden"
      }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse"
        }}>
          <thead>
            <tr style={{
              backgroundColor: "#8d6e63",
              color: "white",
              height: "40px"
            }}>
              <th style={{
                padding: "8px",
                textAlign: "center",
                fontWeight: "600",
                fontSize: "11px",
                borderBottom: "2px solid #6d4c41",
                width: "15%"
              }}>STATUS</th>
              <th style={{
                padding: "8px",
                textAlign: "left",
                fontWeight: "600",
                fontSize: "11px",
                borderBottom: "2px solid #6d4c41",
                width: "25%"
              }}>DOCUMENT NAME</th>
              <th style={{
                padding: "8px",
                textAlign: "left",
                fontWeight: "600",
                fontSize: "11px",
                borderBottom: "2px solid #6d4c41",
                width: "40%"
              }}>DOCUMENT VERIFICATION</th>
              <th style={{
                padding: "8px",
                textAlign: "center",
                fontWeight: "600",
                fontSize: "11px",
                borderBottom: "2px solid #6d4c41",
                width: "20%"
              }}>UPLOAD & MANAGE</th>
            </tr>
          </thead>
          <tbody>
            {documentsList.map((document, index) => (
              <tr key={document.id} style={{
                backgroundColor: index % 2 === 0 ? "#faf8f6" : "#f5f2f0",
                borderBottom: "1px solid #e8d8cf",
                transition: "background-color 0.2s",
                height: "50px"
              }}
              onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = "#efebe9"}
              onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = index % 2 === 0 ? "#faf8f6" : "#f5f2f0"}
              >
                <td style={{
                  padding: "6px 8px",
                  textAlign: "center",
                  verticalAlign: "middle"
                }}>
                  {getStatusBadge(document.id, document)}
                </td>
                <td style={{
                  padding: "6px 8px",
                  verticalAlign: "middle"
                }}>
                  <div style={{
                    fontWeight: "500",
                    color: "#5d4037",
                    fontSize: "12px",
                    lineHeight: "1.2"
                  }}>
                    {document.label}
                  </div>
                </td>
   <td style={{ padding: "16px 20px" }}>
      <div style={{ 
        color: "#6d4c41", 
        fontSize: "12px", 
        lineHeight: "1.4" 
      }}>
        {formData[document.id]?.length > 0 
          ? verificationStatus[document.id]?.message : "No document uploaded"
        }
      </div>
    </td>
           <td style={{
                  padding: "6px 8px",
                  textAlign: "center",
                  verticalAlign: "middle"
                }}>
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px"
                  }}>
                    {/* Upload button */}
                    <label style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "4px 8px",
                      backgroundColor: "#8d6e63",
                      color: "white",
                      borderRadius: "6px",
                      fontSize: "10px",
                      fontWeight: "500",
                      cursor: "pointer",
                      border: "none"
                    }}>
                      <Upload style={{ width: "12px", height: "12px" }} />
                      {formData[document.id]?.length > 0 ? "Update" : "Upload"}
                      <input
                        type="file"
                        accept={document.accept}
                        multiple={document.multiple}
                        onChange={(e) => handleFileChange(document.id, Array.from(e.target.files))}
                        style={{ display: "none" }}
                      />
                    </label>
                    
                    {/* Uploaded files list */}
                    {(formData[document.id] || []).length > 0 && (
                      <div style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                        marginTop: "4px"
                      }}>
                       {(Array.isArray(formData[document.id]) ? formData[document.id] : []).map((file, fileIndex) => (
                          <div key={fileIndex} style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "2px 4px",
                            backgroundColor: "#efebe9",
                            borderRadius: "4px",
                            fontSize: "9px",
                            color: "#5d4037"
                          }}>
                            <FileText style={{ width: "10px", height: "10px" }} />
                            <span style={{ 
                              maxWidth: "80px", 
                              overflow: "hidden", 
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            }}>
                              {file.name || `File ${fileIndex + 1}`}
                            </span>
                            <button
                              onClick={() => handleDeleteFile(document.id, fileIndex)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#c62828",
                                cursor: "pointer",
                                padding: "0",
                                display: "flex",
                                alignItems: "center"
                              }}
                              title="Delete file"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div style={{
        marginTop: "30px",
        padding: "20px",
        backgroundColor: "#efebe9",
        borderRadius: "8px",
        borderLeft: "4px solid #8d6e63"
      }}>
        <h4 style={{
          fontSize: "16px",
          fontWeight: "600",
          color: "#5d4037",
          marginBottom: "8px"
        }}>Upload Summary</h4>
        <p style={{
          color: "#6d4c41",
          fontSize: "14px",
          lineHeight: "1.5",
          margin: "0"
        }}>
          You have uploaded <strong>{stats.required.uploaded} out of {stats.required.total}</strong> required documents. 
          {stats.required.uploaded === stats.required.total 
            ? " ✅ All required documents are complete!" 
            : ` Please upload the remaining ${stats.required.total - stats.required.uploaded} required document(s).`
          }
        </p>
      </div>
      {uploadProgress.isUploading && (
  <div style={{
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999
}}>
  <div style={{
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    textAlign: 'center',
    minWidth: '300px'
  }}>
    {/* ✅ REPLACE Loader2 WITH THIS SPINNING DIV */}
    <div style={{
      width: "40px",
      height: "40px",
      border: "3px solid #f3f3f3",
      borderTop: "3px solid #8d6e63",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
      margin: "0 auto"
    }}></div>
    
    <h3 style={{ margin: '16px 0 8px 0' }}>Processing {uploadProgress.documentName}</h3>
    <p style={{ color: '#666', fontSize: '14px' }}>{uploadProgress.currentStep}</p>
  </div>
</div>
)}
    </div>
  )
}