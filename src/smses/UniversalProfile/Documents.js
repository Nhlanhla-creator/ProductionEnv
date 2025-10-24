

"use client"
import { useState, useEffect } from "react"
import { CheckCircle, XCircle, Upload, FileText, Loader2 } from "lucide-react"
import FileUpload from "./file-upload"
import './UniversalProfile.css';
import { GoogleGenAI } from "@google/genai";
import { db, auth } from "../../firebaseConfig"
import { doc, getDoc, updateDoc } from "firebase/firestore"

const ai = new GoogleGenAI({ 
  apiKey: "AIzaSyBV5LGcaYjT0qLWsfqpbKxo8ohz0SDkIvU"
});

const documentsList = [
  {
    id: "registrationCertificate",
    label: "Company Registration Certificate",
    accept: ".pdf,.jpg,.jpeg,.png",
    required: true,
    multiple: false,
    description: "Official company registration document from CIPC"
  },
  {
    id: "certifiedIds",
    label: "Certified IDs of Directors & Shareholders",
    accept: ".pdf,.jpg,.jpeg,.png",
    required: true,
    multiple: true,
    description: "Certified copies of identity documents for all directors and shareholders"
  },
  {
    id: "shareRegister",
    label: "Share Register",
    accept: ".pdf,.jpg,.jpeg,.png,.xlsx,.xls",
    required: true,
    multiple: false,
    description: "Current share register showing ownership structure"
  },
  {
    id: "proofOfAddress",
    label: "Proof of Address",
    accept: ".pdf,.jpg,.jpeg,.png",
    required: true,
    multiple: false,
    description: "Recent utility bill, lease agreement, or bank statement (not older than 3 months)"
  },
  {
    id: "taxClearanceCert",
    label: "Tax Clearance Certificate",
    accept: ".pdf,.jpg,.jpeg,.png",
    required: true,
    multiple: false,
    description: "Valid tax clearance certificate from SARS"
  },
  {
    id: "vatCertificate",
    label: "VAT Certificate",
    accept: ".pdf,.jpg,.jpeg,.png",
    required: true,
    multiple: false,
    description: "VAT registration certificate (if VAT registered)"
  },
  {
    id: "bbbeeCert",
    label: "B-BBEE Certificate",
    accept: ".pdf,.jpg,.jpeg,.png",
    required: true,
    multiple: false,
    description: "Current B-BBEE certificate (if applicable)"
  },
  {
    id: "otherCerts",
    label: "UIF/PAYE/COIDA Certificates",
    accept: ".pdf,.jpg,.jpeg,.png",
    required: true,
    multiple: true,
    description: "Employment-related certificates (if applicable)"
  },
  {
    id: "industryAccreditationDocs",
    label: "Industry Accreditations",
    accept: ".pdf,.jpg,.jpeg,.png",
    required: true,
    multiple: true,
    description: "Professional or industry-specific accreditation documents"
  },
  {
    id: "companyProfile",
    label: "Company Profile / Brochure",
    accept: ".pdf,.doc,.docx",
    required: true,
    multiple: false,
    description: "Marketing materials or company overview document"
  },
  {
    id: "clientReferences",
    label: "Client References",
    accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png",
    required: true,
    multiple: true,
    description: "Letters of recommendation or client testimonials"
  }
]

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
  "B-B BEE Certificate": {
    requiredElements: [
      "Issued by accredited verification agency",
      "B-BBEE certificate number",
      "B-BBEE level (1-8)",
      "Issue and expiry dates",
      "Company registration details",
     "SANAS logo or accreditation number / CIPC Logo / DTIC"
    ],
    strictChecks: ["has_certificate_number", "shows_verification_details", "has_expiry_date"]
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
export default function Documents({ data = {}, updateData }) {
  const [formData, setFormData] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [uploadStatus, setUploadStatus] = useState({})
  const [uploadingDocs, setUploadingDocs] = useState({}) // Track which docs are uploading

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
        
        // Initialize all documents with empty arrays
        documentsList.forEach(doc => {
          documentsData[doc.id] = [];
        });
        
        // Then populate with actual data
        if (profileData.documents) {
          Object.keys(profileData.documents).forEach(docKey => {
            if (profileData.documents[docKey]) {
              documentsData[docKey] = Array.isArray(profileData.documents[docKey]) 
                ? profileData.documents[docKey] 
                : [profileData.documents[docKey]];
            }
          });
        }
          
          // ALSO check other sections for backward compatibility
          // But don't override if documents section already has the data
          if (profileData.entityOverview?.registrationCertificate && !documentsData.registrationCertificate) {
            documentsData.registrationCertificate = profileData.entityOverview.registrationCertificate
          }
          if (profileData.contactDetails?.proofOfAddress && !documentsData.proofOfAddress) {
            documentsData.proofOfAddress = profileData.contactDetails.proofOfAddress
          }
          if (profileData.legalCompliance?.vatCertificate && !documentsData.vatCertificate) {
            documentsData.vatCertificate = profileData.legalCompliance.vatCertificate
          }
          if (profileData.legalCompliance?.bbbeeCert && !documentsData.bbbeeCert) {
            documentsData.bbbeeCert = profileData.legalCompliance.bbbeeCert
          }
          if (profileData.legalCompliance?.otherCerts && !documentsData.otherCerts) {
            documentsData.otherCerts = profileData.legalCompliance.otherCerts
          }
          if (profileData.productsServices?.companyProfile && !documentsData.companyProfile) {
            documentsData.companyProfile = profileData.productsServices.companyProfile
          }
          // Add other document types as needed
          
          setFormData(documentsData)
          updateData(documentsData)
          
          // Update upload status
          const status = {}
          documentsList.forEach(doc => {
            const files = documentsData[doc.id] || []
            status[doc.id] = files.length > 0 ? 'success' : 'pending'
          })
          setUploadStatus(status)
          
        } else {
          // Initialize with passed data
          setFormData(data)
          const status = {}
          documentsList.forEach(doc => {
            const files = data[doc.id] || []
            status[doc.id] = files.length > 0 ? 'success' : 'pending'
          })
          setUploadStatus(status)
        }
      } catch (error) {
        console.error("Error loading documents:", error)
        setFormData(data)
      } finally {
        setIsLoading(false)
      }
    }

    loadDocuments()
  }, [])

  const createStrictPrompt = (docLabel, rules) => { 
  return `
VALIDATE THIS ${docLabel} DOCUMENT:

REQUIRED ELEMENTS:
${rules.requiredElements.map(item => `- ${item}`).join('\n')}

VALIDATION CHECKS:
1. Document matches ${docLabel} requirements
2. Expiry date check (reject if expired/expiring soon)
3. All required elements present

RESPONSE FORMAT (JSON only):
{
  "isValid": true/false,
  "rejectionReason": "if invalid",
  "warnings": ["expiring_soon"],
  "expiryDate": "YYYY-MM-DD if found"
}
`;
};

 const validateDocumentWithAI = async (docLabel, file) => {
 const parseDetailedResponse = (responseText) => {
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // ✅ Better fallback: Check what the AI actually said
    if (responseText.toLowerCase().includes('false')) {
      return {
        isValid: false,
        rejectionReason: `Please upload the correct document`,
        warnings: []
      };
    }
    
    if (responseText.toLowerCase().includes('true')) {
      return {
        isValid: true,
        rejectionReason: "",
        warnings: []
      };
    }
    
    // ✅ If we can't parse, show the actual AI response
    return {
      isValid: false,
      rejectionReason: `Validation failed: ${responseText.substring(0, 100)}...`,
      warnings: []
    };
    
  } catch (error) {
    return {
      isValid: false,
      rejectionReason: "Unable to validate document format",
      warnings: []
    };
  }
};

  try {
    const rules = documentValidationRules[docLabel];
    
    const validationPrompt = rules ? 
      createStrictPrompt(docLabel, rules) :
      `Check if this document is a valid ${docLabel}. Return only "true" or "false".`;

    // Convert file to base64
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
    
    return parseDetailedResponse(response.text); 
    
  } catch (error) {
    console.error("AI validation failed:", error);
    return {
      isValid: false,
      rejectionReason: "Validation service unavailable",
      warnings: []
    };
  }
};

  const handleFileChange = async (documentId, files) => {
  try {
    if (!auth.currentUser) {
      console.error("User not authenticated");
      return;
    }
    
    setUploadingDocs(prev => ({ ...prev, [documentId]: true }));
    
    // Ensure files is always an array
    const filesArray = Array.isArray(files) ? files : [files];
    
    // AI VALIDATION HERE
    for (const file of filesArray) {
      const validationResult = await validateDocumentWithAI(documentId, file);
      
      if (!validationResult.isValid) {
        alert(`Document rejected: ${validationResult.rejectionReason}`);
        setUploadingDocs(prev => ({ ...prev, [documentId]: false }));
        return; // Stop if any file fails validation
      }
    }
    
    // Update local state
    const updatedData = { ...formData, [documentId]: filesArray };
    setFormData(updatedData);
    updateData(updatedData)
      
      setUploadStatus(prev => ({
        ...prev,
        [documentId]: files.length > 0 ? 'success' : 'pending'
      }));

      // Save to Firebase
      const userId = auth.currentUser?.uid;
      if (userId) {
        const docRef = doc(db, "universalProfiles", userId);
        
        // Prepare the update object
        const updateData = {
          [`documents.${documentId}`]: files,
        };

        // FIXED: Complete switch statement with ALL document types
        switch(documentId) {
          case 'registrationCertificate':
            updateData[`entityOverview.${documentId}`] = files;
            break;
          case 'certifiedIds':
          case 'shareRegister':
            updateData[`ownershipManagement.${documentId}`] = files;
            break;
          case 'proofOfAddress': // This was missing proper handling
            updateData[`contactDetails.${documentId}`] = files;
            break;
          case 'taxClearanceCert':
          case 'vatCertificate': // This was being handled correctly
          case 'bbbeeCert': // This was being handled correctly
          case 'otherCerts': // This was being handled correctly
          case 'industryAccreditationDocs': // This was being handled correctly
            updateData[`legalCompliance.${documentId}`] = files;
            break;
          case 'companyProfile': // This was being handled correctly
          case 'clientReferences': // This was being handled correctly
            updateData[`productsServices.${documentId}`] = files;
            break;
          // Add any missing document types here
          default:
            // For any document types not specifically categorized,
            // they will still be saved under documents.${documentId}
            console.log(`Document ${documentId} saved to documents section only`);
        }
        
        await updateDoc(docRef, updateData);
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      // Show user-friendly error message
      // alert(`Failed to upload ${documentId}. Please try again.`);
    } finally {
      setUploadingDocs(prev => ({ ...prev, [documentId]: false }));
    }
  }

  const getStatusBadge = (documentId, document) => {
    const isUploading = uploadingDocs[documentId]
    const files = formData[documentId] || []
    
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
      )
    }
    
    if (files.length > 0) {
      return (
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 8px",
          borderRadius: "16px",
          fontSize: "11px",
          fontWeight: "600",
          backgroundColor: "#e8f5e8",
          color: "#2e7d32"
        }}>
          <CheckCircle style={{ width: "12px", height: "12px" }} />
          Uploaded
        </span>
      )
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
          {document.required ? "missing" : "Optional"}
        </span>
      )
    }
  }

  const handleDeleteFile = async (documentId, fileIndex) => {
    const currentFiles = formData[documentId] || []
    const updatedFiles = currentFiles.filter((_, index) => index !== fileIndex)
    
    // Update local state
    const updatedData = { ...formData, [documentId]: updatedFiles }
    setFormData(updatedData)
    updateData(updatedData)
    
    // Update Firebase
    try {
      const userId = auth.currentUser?.uid
      if (userId) {
        const docRef = doc(db, "universalProfiles", userId)
        const updateData = {
          [`documents.${documentId}`]: updatedFiles,
        }

        switch(documentId) {
          case 'registrationCertificate':
            updateData[`entityOverview.${documentId}`] = updatedFiles
            break
          case 'certifiedIds':
          case 'shareRegister':
            updateData[`ownershipManagement.${documentId}`] = updatedFiles
            break
          case 'proofOfAddress':
            updateData[`contactDetails.${documentId}`] = updatedFiles
            break
          case 'taxClearanceCert':
          case 'vatCertificate':
          case 'bbbeeCert':
          case 'otherCerts':
          case 'industryAccreditationDocs':
            updateData[`legalCompliance.${documentId}`] = updatedFiles
            break
          case 'companyProfile':
          case 'clientReferences':
            updateData[`productsServices.${documentId}`] = updatedFiles
            break
          default:
            console.log(`Document ${documentId} removed from documents section`)
        }
        
        await updateDoc(docRef, updateData)
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
              }}>DESCRIPTION</th>
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
                <td style={{
                  padding: "6px 8px",
                  verticalAlign: "middle"
                }}>
                  <div style={{
                    color: "#6d4c41",
                    fontSize: "11px",
                    lineHeight: "1.2"
                  }}>
                    {document.description}
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
    </div>
  )
}