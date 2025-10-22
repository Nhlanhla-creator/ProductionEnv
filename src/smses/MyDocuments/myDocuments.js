import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getDoc, doc, updateDoc, serverTimestamp, collection, getDocs, where } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "../../firebaseConfig";
import { FileText, ExternalLink, Upload } from "lucide-react";
import get from "lodash.get";
import { DOCUMENT_PATHS, checkSubmittedDocs, getDocumentURL } from "../../utils/documentUtils";
import { onAuthStateChanged } from "firebase/auth";
import { GoogleGenAI } from "@google/genai";
import { API_KEYS } from '../../API';

const DOCUMENTS = Object.keys(DOCUMENT_PATHS).sort((a, b) => a.localeCompare(b));
const ai = new GoogleGenAI({ 
  apiKey: "AIzaSyBV5LGcaYjT0qLWsfqpbKxo8ohz0SDkIvU"
});

const documentValidationRules = {
  "5 Year Budget": {
    requiredElements: [
      "Income Statement with 5-year projections",
      "Cash Flow Statement with 5-year projections", 
      "Balance Sheet with 5-year projections",
      "Revenue and expense projections",
      "Financial assumptions"
    ],
    strictChecks: ["covers_5_years", "has_all_three_statements", "shows_projection_basis"]
  },
  "Audited Financials": {
    requiredElements: [
      "Auditor's report/signed opinion",
      "Complete financial statements",
      "Notes to financial statements", 
      "Comparative figures",
      "Auditor signature and date"
    ],
    strictChecks: ["has_auditor_report", "is_signed", "has_comparatives"]
  },
  "Bank Details Confirmation Letter": {
    requiredElements: [
      "Bank name clearly stated",
      "Account holder name",
      "Account number",
      "Account type",
      "Branch Code",
      "Date Of Issue"
    ],
    strictChecks:["has_account_number", "shows_valid_south_african_bank", "has_account_holder's_name"]
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
   "Business Plan": {
    requiredElements: [
      "Executive Summary",
      "Company Description", 
      "Market Analysis",
      "Products/Services",
      "Marketing Strategy",
      "Management Team",
      "Financial Projections",
      "Information Filled In"
    ],
    strictChecks: ["has_executive_summary", "has_market_analysis", "has_financials"]
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
"Financial Statements": {
  requiredElements: [
    "Balance Sheet (Statement of Financial Position)",
    "Income Statement (Profit & Loss)",
    "Cash Flow Statement",
    "Notes to financial statements",
    "Company name and period covered",
    "Currency specified (Rands)"
  ],
  strictChecks: ["has_all_statements", "has_company_name", "covers_complete_period"]
},
"Guarantee/Contract": {
  requiredElements: [
    "Contract/Agreement title",
    "Parties involved clearly defined",
    "Terms and obligations specified",
    "Duration/validity period",
    "Signatures from all parties"
  ],
   strictChecks: ["has_parties", "has_terms", "fully_signed"]
},
"Impact Statements": {
  requiredElements: [
    "Impact Statement/Report title",
    "Reporting period/dates",
    "Objectives and goals stated",
    "Measurable results/outcomes",
    "Beneficiary numbers/statistics",
    "Monitoring and evaluation data"
  ],
  strictChecks: ["has_measurable_results", "has_reporting_period", "shows_impact_evidence"]
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
"Loan Agreements": {
  requiredElements: [
    "Parties involved (lender/borrower)",
    "Loan amount and interest rate",
    "Repayment terms and schedule",
    "Signatures from all parties",
    "Agreement date and duration"
  ],
   strictChecks: ["has_loan_amount", "has_repayment_terms", "fully_signed"]
},
"Pitch Deck": {
  requiredElements: [
    "Company name and problem statement",
    "Solution/product offering",
    "Business model and revenue streams",
    "Market analysis and opportunity",
    "Management team overview",
    "Funding requirements and use"
  ]
},
"Previous Program Reports": {
  requiredElements: [
    "Program/project name and description",
    "Reporting period and dates",
    "Activities and deliverables completed",
    "Results and achievements measured",
    "Challenges and lessons learned",
    "Financial expenditure summary"
  ]
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
"Support Letters / Endorsements": {
  requiredElements: [
    "Letterhead of supporting organization",
    "Clear endorsement statement",
    "Relationship to applicant described",
    "Specific support details provided",
    "Authorized signature and position",
    "Contact details of endorser"
  ]
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
}
};
const MyDocuments = () => {
  const [profileData, setProfileData] = useState({});
  const [submittedDocuments, setSubmittedDocuments] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [validatingDoc, setValidatingDoc] = useState(null);
  const [validationResults, setValidationResults] = useState({});

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profileRef = doc(db, "universalProfiles", user.uid);
          const profileSnap = await getDoc(profileRef);
          if (!profileSnap.exists()) return;

          const data = profileSnap.data();
          setProfileData(data);
          const submitted = checkSubmittedDocs(DOCUMENTS, data);
          setSubmittedDocuments(submitted);
        } catch (err) {
          console.error("Failed to load user documents:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Add sidebar detection
  useEffect(() => {
    const checkSidebarState = () => {
      setIsSidebarCollapsed(document.body.classList.contains("sidebar-collapsed"))
    }

    // Check initial state
    checkSidebarState()

    // Watch for changes
    const observer = new MutationObserver(checkSidebarState)
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

useEffect(() => {
  const auth = getAuth();
  
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    console.log("Auth state user:", user);
    console.log("User UID:", user?.uid);
    console.log("User Name:", user?.email)
  });

  return () => unsubscribe(); // Cleanup
}, []);
//   const getUserDetails = async () => {
//   const auth = getAuth();
//   const user = auth.currentUser;
  
//   if (!user) return null;

//   try {
//     const profileRef = doc(db, "universalProfiles", user.uid);
//     const profileSnap = await getDoc(profileRef);
    
//     if (profileSnap.exists()) {
//       const data = profileSnap.data();
//       return {
//         companyName: data.registeredName || data.companyName,
//         taxNumber: data.taxNumber,
//         vatNumber: data.vatNumber,
//         registrationNumber: data.registrationNumber,
//         contactName: data.contactName
//         // Add other fields you need
//       };
//     }
//     return null;
//   } catch (error) {
//     console.error("Error fetching user details:", error);
//     return null;
//   }
// };


const createStrictPrompt = (docLabel, rules) => {  // ✅ Remove userDetails parameter
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
  // ✅ MOVE THE PARSER FUNCTION INSIDE
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
        rejectionReason: "Document does not appear to be the correct type",
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
    
    return parseDetailedResponse(response.text); // ✅ Now it's defined
    
  } catch (error) {
    console.error("AI validation failed:", error);
    return {
      isValid: false,
      rejectionReason: "Validation service unavailable",
      warnings: []
    };
  }
};
const handleFileUpload = async (docLabel, file) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user || !file) return;

  // Your existing file validation (type and size checks)...
  const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
  const fileExtension = file.name.toLowerCase().split('.').pop();
  
  if (!allowedTypes.includes(`.${fileExtension}`)) {
    alert(`Please upload only PDF or Image files. File type .${fileExtension} is not allowed.`);
    return;
  }

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    alert('File size exceeds 10MB limit. Please upload a smaller file.');
    return;
  }

  // Start loading for AI validation
  setIsUploading(true);
  setIsOverlayVisible(true);

   try {
       const validationResult = await validateDocumentWithAI(docLabel, file);
    console.log("AI validation result:", validationResult);

    if (!validationResult.isValid) {
      alert(`Document rejected: ${validationResult.rejectionReason}`);
      setIsUploading(false);
      setIsOverlayVisible(false);
      return;
    }

    if (!validationResult.isValid) {
      alert(`Document rejected: ${validationResult.rejectionReason}`);
      return;
    }

    // Check for warnings
    if (validationResult.warnings && validationResult.warnings.length > 0) {
      const proceed = window.confirm(
        `Document has warnings:\n${validationResult.warnings.join('\n')}\n\nDo you want to proceed anyway?`
      );
      if (!proceed) return;
    }

    // Only if validation passes, continue to Firebase upload
    const storage = getStorage();
    const storageRef = ref(storage, `universalProfiles/documents/${user.uid}/${docLabel}.${fileExtension}`);

    const existingDocumentUrl = getDocumentURL(docLabel, profileData);
    const isUpdate = !!existingDocumentUrl;

    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    const profileRef = doc(db, "universalProfiles", user.uid);
    const path = DOCUMENT_PATHS[docLabel];

    const timestampPath = (() => {
      const parts = path.split(".");
      if (parts.length === 1) return `${parts[0]}UpdatedAt`;
      parts.pop();
      return `${parts.join(".")}.UpdatedAt`;
    })();

    await updateDoc(profileRef, {
      [path]: downloadURL,
      [timestampPath]: serverTimestamp(),
    });

    setSubmittedDocuments((prev) => Array.from(new Set([...prev, docLabel])));
    
    const updatedProfileSnap = await getDoc(profileRef);
    if (updatedProfileSnap.exists()) {
      setProfileData(updatedProfileSnap.data());
    }
    
    // Success
    setIsUploading(false);
    setTimeout(() => {
      setIsOverlayVisible(false);
      alert(`${docLabel} ${isUpdate ? 'updated' : 'uploaded'} successfully.`);
    }, 300);
    
  } catch (error) {
    console.error("Upload failed:", error);
    setIsUploading(false);
    setTimeout(() => {
      setIsOverlayVisible(false);
      alert('Upload failed. Please try again.');
    }, 300);
    
  }
};

  const filteredDocuments = DOCUMENTS.filter((doc) => {
    const isSubmitted = submittedDocuments.includes(doc);
    const matchFilter =
      filter === "all" ||
      (filter === "submitted" && isSubmitted) ||
      (filter === "pending" && !isSubmitted);
    const matchSearch = doc.toLowerCase().includes(searchTerm.toLowerCase());
    return matchFilter && matchSearch;
  });

  const renderDocumentLink = (label) => {
    const url = getDocumentURL(label, profileData);
    if (!url) return (
      <span style={{
        color: "#8d6e63",
        fontSize: "12px",
        fontStyle: "italic"
      }}>
        No document uploaded
      </span>
    );

    
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          color: "#5d4037",
          textDecoration: "none",
          fontSize: "12px",
          fontWeight: "500",
          padding: "4px 0",
          borderBottom: "1px solid #5d4037",
          transition: "all 0.2s ease"
        }}
        onMouseEnter={(e) => {
          e.target.style.color = "#8d6e63";
          e.target.style.borderBottomColor = "#8d6e63";
        }}
        onMouseLeave={(e) => {
          e.target.style.color = "#5d4037";
          e.target.style.borderBottomColor = "#5d4037";
        }}
      >
        <FileText size={14} />
        <span>View Document</span>
        <ExternalLink size={12} />
      </a>
    );
  };

  const getStatusBadge = (docLabel) => {
    const url = getDocumentURL(docLabel, profileData);
    const isUploaded = !!url;
    
    return (
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 8px",
        borderRadius: "12px",
        fontSize: "11px",
        fontWeight: "600",
        backgroundColor: isUploaded ? "#e8f5e8" : "#ffebee",
        color: isUploaded ? "#2e7d32" : "#c62828"
      }}>
        {isUploaded ? "Uploaded" : "Pending"}
      </span>
    );
  };

  // Responsive container styles
  const getContainerStyles = () => ({
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    width: "100%",
    minHeight: "100vh",
    maxWidth: "100vw",
    overflowX: "hidden",
    padding: `80px 20px 20px ${isSidebarCollapsed ? "100px" : "290px"}`,
    margin: "0",
    boxSizing: "border-box",
    position: "relative",
    transition: "padding 0.3s ease",
    backgroundColor: "#faf8f6"
  })

  if (!getAuth().currentUser && !loading) {
    return (
      <div style={getContainerStyles()}>
        <div style={{
          textAlign: "center",
          padding: "80px 32px",
          backgroundColor: "#f5f2f0",
          borderRadius: "16px",
          border: "2px dashed #d7ccc8",
          color: "#6d4c41",
          fontSize: "1.125rem",
          fontWeight: "500"
        }}>
          Please sign in to view documents.
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        html {
          -webkit-text-size-adjust: 100%;
          text-size-adjust: 100%;
        }
        body {
          touch-action: manipulation;
          min-width: 100vw;
          overflow-x: hidden;
        }
        
        @media (max-width: 1024px) {          
          .document-controls {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }
          
          .search-box {
            width: 100% !important;
          }
        }
        
        @media (max-width: 768px) {
          .documents-table-container {
            overflow-x: auto;
          }
          
          .documents-table {
            min-width: 700px;
          }
        }
        
        @media (max-width: 480px) {
          .my-documents-header {
            padding: 20px !important;
          }
          
          .my-documents-header h1 {
            font-size: 1.75rem !important;
          }
          
          .my-documents-header p {
            font-size: 1rem !important;
          }
        }
      `}</style>

      <div
        className="my-documents-container"
        style={getContainerStyles()}
      >
        <div style={{
          width: "100%",
          maxWidth: "1400px",
          margin: "0 auto",
        }}>
          {/* Header */}
          <div className="my-documents-header" style={{
            marginBottom: "32px",
            padding: "32px",
            background: "linear-gradient(135deg, #f5f2f0 0%, #faf8f6 100%)",
            borderRadius: "16px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            border: "2px solid #d7ccc8"
          }}>
            <h1 style={{
              fontSize: "2.5rem",
              fontWeight: "700",
              color: "#5d4037",
              margin: "0 0 8px 0",
              letterSpacing: "-0.025em"
            }}>My Documents</h1>
            <p style={{
              fontSize: "1.125rem",
              color: "#6d4c41",
              margin: "0",
              fontWeight: "400"
            }}>Track all your submitted documents in one place</p>
          </div>

          {/* Controls Section */}
          <div className="document-controls" style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "32px",
            padding: "20px 24px",
            backgroundColor: "#f5f2f0",
            borderRadius: "12px",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
            border: "1px solid #d7ccc8",
            width: "100%",
            boxSizing: "border-box"
          }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {["all", "submitted", "pending"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  style={{
                    padding: "10px 20px",
                    border: filter === type ? "2px solid #8d6e63" : "2px solid #d7ccc8",
                    backgroundColor: filter === type ? "#8d6e63" : "#faf8f6",
                    color: filter === type ? "white" : "#6d4c41",
                    borderRadius: "8px",
                    fontWeight: "500",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    minWidth: "100px"
                  }}
                  onMouseEnter={(e) => {
                    if (filter !== type) {
                      e.target.style.backgroundColor = "#efebe9";
                      e.target.style.borderColor = "#a67c52";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filter !== type) {
                      e.target.style.backgroundColor = "#faf8f6";
                      e.target.style.borderColor = "#d7ccc8";
                    }
                  }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
            <input
              className="search-box"
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "12px 16px",
                border: "2px solid #d7ccc8",
                borderRadius: "8px",
                fontSize: "0.875rem",
                backgroundColor: "#faf8f6",
                color: "#5d4037",
                minWidth: "200px",
                width: "280px",
                outline: "none",
                boxSizing: "border-box"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#8d6e63";
                e.target.style.boxShadow = "0 0 0 3px rgba(141, 110, 99, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#d7ccc8";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Documents Table */}
          {loading ? (
            <div style={{
              textAlign: "center",
              padding: "80px 32px",
              backgroundColor: "#f5f2f0",
              borderRadius: "16px",
              border: "2px dashed #d7ccc8",
              color: "#6d4c41",
              fontSize: "1.125rem",
              fontWeight: "500",
              width: "100%"
            }}>Loading documents...</div>
          ) : filteredDocuments.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "80px 32px",
              backgroundColor: "#f5f2f0",
              borderRadius: "16px",
              border: "2px dashed #d7ccc8",
              color: "#6d4c41",
              fontSize: "1.125rem",
              fontWeight: "500",
              width: "100%"
            }}>No documents found</div>
          ) : (
            <div className="documents-table-container" style={{
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              overflow: "hidden",
              border: "1px solid #d7ccc8",
              width: "100%",
              overflowX: "auto"
            }}>
              <table className="documents-table" style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "800px"
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: "#8d6e63",
                    color: "white",
                    height: "50px"
                  }}>
                    <th style={{
                      padding: "16px 20px",
                      textAlign: "left",
                      fontWeight: "600",
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: "2px solid #6d4c41",
                      width: "25%"
                    }}>Document Name</th>
                    <th style={{
                      padding: "16px 20px",
                      textAlign: "center",
                      fontWeight: "600",
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: "2px solid #6d4c41",
                      width: "20%"
                    }}>Uploaded Document</th>
                    <th style={{
                      padding: "16px 20px",
                      textAlign: "center",
                      fontWeight: "600",
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: "2px solid #6d4c41",
                      width: "15%"
                    }}>Last Updated</th>
                    <th style={{
                      padding: "16px 20px",
                      textAlign: "center",
                      fontWeight: "600",
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: "2px solid #6d4c41",
                      width: "15%"
                    }}>Status</th>
                    <th style={{
                      padding: "16px 20px",
                      textAlign: "center",
                      fontWeight: "600",
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: "2px solid #6d4c41",
                      width: "25%"
                    }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc, index) => {
                    const base = DOCUMENT_PATHS[doc];
                    let updatedAt;
                    if (typeof base === "string") {
                      const parts = base.split(".");
                      const timestampPath =
                        parts.length === 1
                          ? `${parts[0]}UpdatedAt`
                          : `${parts.slice(0, -1).join(".")}.UpdatedAt`;
                      updatedAt = get(profileData, timestampPath);
                    }

                    return (
                      <tr key={doc} style={{
                        backgroundColor: index % 2 === 0 ? "white" : "#faf8f6",
                        borderBottom: "1px solid #e8d8cf",
                        transition: "background-color 0.2s ease",
                        height: "60px"
                      }}
                      onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = "#efebe9"}
                      onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = index % 2 === 0 ? "white" : "#faf8f6"}
                      >
                        <td style={{
                          padding: "16px 20px",
                          fontSize: "14px",
                          color: "#5d4037",
                          fontWeight: "600",
                          verticalAlign: "middle"
                        }}>
                          {doc.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </td>
                        <td style={{
                          padding: "16px 20px",
                          textAlign: "center",
                          verticalAlign: "middle",
                          backgroundColor: "transparent"
                        }}>
                          {renderDocumentLink(doc)}
                        </td>
                        <td style={{
                          padding: "16px 20px",
                          fontSize: "13px",
                          color: "#6d4c41",
                          textAlign: "center",
                          verticalAlign: "middle",
                          backgroundColor: "transparent"
                        }}>
                          {updatedAt?.seconds
                            ? new Date(updatedAt.seconds * 1000).toLocaleDateString()
                            : "-"}
                        </td>
                        <td style={{
                          padding: "16px 20px",
                          textAlign: "center",
                          verticalAlign: "middle",
                          backgroundColor: "transparent"
                        }}>
                          {getStatusBadge(doc)}
                        </td>
                        <td style={{
                          padding: "16px 20px",
                          textAlign: "center",
                          verticalAlign: "middle",
                          backgroundColor: "transparent"
                        }}>
                          <label style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 16px",
                            backgroundColor: "#a67c52",
                            color: "white",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "#8d6e63";
                            e.target.style.transform = "translateY(-1px)";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "#a67c52";
                            e.target.style.transform = "translateY(0)";
                          }}
                          >
                            <Upload size={12} />
                            {getDocumentURL(doc, profileData) ? "Update" : "Upload"}
                            <input
                              type="file"
                              style={{ display: "none" }}
                              onChange={(e) => handleFileUpload(doc, e.target.files[0])}
                            />
                          </label>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

  {isOverlayVisible && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(4px)',
    opacity: isUploading ? 1 : 0,
    transition: 'opacity 0.3s ease-in-out',
    pointerEvents: isUploading ? 'auto' : 'none'
  }}>
    <div style={{
      backgroundColor: '#f5f5f5',
      padding: '40px 60px',
      borderRadius: '12px',
      textAlign: 'center',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      border: '1px solid #ddd',
      transform: isUploading ? 'scale(1)' : 'scale(0.9)',
      transition: 'all 0.3s ease-in-out',
      opacity: isUploading ? 1 : 0
    }}>
      <div style={{
        width: '50px',
        height: '50px',
        border: '4px solid #e0e0e0',
        borderTop: '4px solid #a67c52',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 20px auto'
      }}></div>
      <p style={{
        margin: 0,
        color: '#5d4037',
        fontSize: '16px',
        fontWeight: '600',
        fontFamily: 'Arial, sans-serif'
      }}>
        Uploading Document...
      </p>
      <p style={{
        margin: '10px 0 0 0',
        color: '#8d6e63',
        fontSize: '12px',
        fontStyle: 'italic'
      }}>
        Please wait while we process your file
      </p>
    </div>
  </div>
)}  
    </>
  );
};

export default MyDocuments;