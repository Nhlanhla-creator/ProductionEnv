import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getDoc, doc, updateDoc, serverTimestamp, collection, getDocs, where, onSnapshot } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth } from "../../firebaseConfig";
import { FileText, ExternalLink, Upload, Filter, ChevronDown, ChevronUp, Trash2, Plus, Minus } from "lucide-react";
import get from "lodash.get";
import { onAuthStateChanged } from "firebase/auth";
import { GoogleGenAI } from "@google/genai";
import { API_KEYS } from '../../API';
import { 
  getAllDocumentLabels, 
  getDocumentId, 
  UNIFIED_DOCUMENT_PATHS,
  getDocumentCategory,
  DOCUMENT_CATEGORIES,
  DOCUMENT_PATHS 
} from "../../utils/documentMapping";
import { useDocumentSync } from "../../components/useDocumentSync";

const ai = new GoogleGenAI({ 
  apiKey: "AIzaSyCNgMy76oz4N-mNXEmoc5e3XPO-Sem4ca8"
});

const DOCUMENTS = [
  "5 Year Budget",
  "Bank Details Confirmation Letter",
  "B-BBEE Certificate",
  "Business Plan",
  "IDs of Directors & Shareholders",
  "Client References / Support Letters",
  "Company Profile / Brochure",
  "Company Registration Certificate",
  "COIDA Letter of Good Standing",
  "CV",
  "Financial Statements",
  "Guarantee/Contract",
  "Industry Accreditations",
  "Loan Agreements",
  "Pitch Deck",
  "Proof of Address",
  "Share Register",
  "Tax Clearance Certificate"
].sort((a, b) => a.localeCompare(b));

const getDocumentURL = (docLabel, profileData) => {
  const documentId = getDocumentId(docLabel);
  return profileData.documents?.[documentId] || get(profileData, DOCUMENT_PATHS[docLabel]);
};

const documentValidationRules = {
  "5 Year Budget": {
    requiredElements: [
      "Income Statement with 5-year projections",
      "Cash Flow Statement with 5-year projections", 
      "Balance Sheet with 5-year projections",
      "Revenue and expense projections",
      "Financial assumptions",
      "✅ ACCEPT MULTI-PAGE DOCUMENTS: Even if other financial documents are included"
    ],
    strictChecks: ["covers_5_years", "has_all_three_statements", "shows_projection_basis"]
  },
  "Bank Confirmation Letter": {
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
  "B-BBEE Certificate": {
    requiredElements: [
      "Expiry date - MUST NOT BE EXPIRED",
      "Issued by accredited verification agency",
      "B-BBEE certificate number",
      "B-BBEE level (1-8)", 
      "Issue date",
      "Certificate must be currently valid",
      "Company registration details",
      "SANAS logo or accreditation number",
      "ACCEPT MULTI-PAGE DOCUMENTS: Even if other certificates are included"
    ],
    strictChecks: ["has_certificate_number", "not_expired", "currently_valid"]
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
      "Information Filled In",
      "ACCEPT MULTI-PAGE DOCUMENTS: Even if appendices or additional documents are included"
    ],
    strictChecks: ["has_executive_summary", "has_market_analysis", "has_financials"]
  },
  "IDs of Directors & Shareholders": {
    requiredElements: [
      "ID document (South African ID Card, Passport, Driver's License, etc.)",
      "Photograph of ID holder",
      "Full names matching company records",
      "ID number or passport number",
      "✅ ACCEPT ANY OFFICIAL ID: South African ID Card, Passport, Driver's License, Refugee ID",
      "✅ CERTIFICATION NOT REQUIRED: Regular ID copies are acceptable"
    ],
    strictChecks: ["has_id_details", "names_match_records"]
  },
  "Client references / Support Letters": { 
    requiredElements: [
      "Reference letter heading/title",
      "Client company name and contact details",
      "Description of services provided",
      "Performance/satisfaction statement",
      "Dates of service/work period",
      "Authorized signature and position",
      "ACCEPT MULTI-PAGE DOCUMENTS: Even if multiple reference letters are included"
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
      "Services/Products description",
      "ACCEPT MULTI-PAGE DOCUMENTS: Even if additional marketing materials are included"
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
      "Official stamp/signature",
      "ACCEPT MULTI-PAGE DOCUMENTS: Even if other CIPC documents are included"
    ],
    strictChecks: ["issued_by_cipc", "has_registration_number", "matches_company_name"]
  },
  "COIDA Letter of Good Standing": {
    requiredElements: [
      "Issued by Compensation Fund",
      "Letter of Good Standing title",
      "Employer reference number",
      "Company name and address",
      "Issue date",
      "Status confirmation (Good Standing)",
      "Official stamp/signature",
      "ACCEPT MULTI-PAGE DOCUMENTS: Even if other COIDA documents are included"
    ],
    strictChecks: ["issued_by_compensation_fund", "has_employer_reference", "shows_good_standing"]
  },
  "CV": {
    requiredElements: [
      "Personal details and contact information",
      "Professional summary/objective",
      "Work experience with dates and descriptions",
      "Educational background and qualifications",
      "Skills and competencies",
      "Professional certifications (if any)",
      "References or availability upon request"
    ],
    strictChecks: ["has_work_experience", "has_education", "has_contact_info"]
  },
  "Financial Statements": {
    requiredElements: [
      "Financial statements (Balance Sheet, Income Statement, Cash Flow)",
      "Company name and period covered",
      "Revenue and expense details",
      "Assets and liabilities information",
      "ACCEPT BOTH: Audited AND Unaudited financial statements",
      "ACCEPT MULTI-PAGE DOCUMENTS: Even if other documents are included in the same PDF",
      "FOCUS ON: Presence of financial statements, not audit status",
      "ACCEPT MULTI-PAGE DOCUMENTS: Even if other documents are included in the same PDF"
    ],
    strictChecks: ["has_financial_statements", "has_company_name", "covers_complete_period"]
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
  "Industry Accreditations": {
    requiredElements: [
      "Accreditation/Certificate title",
      "Issuing accreditation body",
      "Scope/standard (e.g., ISO 9001)",
      "Issue and expiry dates",
      "Company name matches applicant",
      "ACCEPT MULTI-PAGE DOCUMENTS: Even if multiple certificates are included"
    ],
    strictChecks: ["has_expiry_date", "issued_by_accredited_body", "matches_company_name"]
  },
  "Loan Agreements": {
    requiredElements: [
      "Parties involved (lender/borrower)",
      "Loan amount and interest rate",
      "Repayment terms and schedule",
      "Signatures from all parties",
      "Agreement date and duration",
      "ACCEPT MULTI-PAGE DOCUMENTS: Even if terms and conditions or other related documents are included"
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
      "Funding requirements and use",
      "ACCEPT MULTI-PAGE DOCUMENTS: Even if additional slides are included"
    ]
  },
  "Proof of Address": {
    requiredElements: [
      "Full name and physical address",
      "Issue date within last 3 months",
      "Utility company/landlord details",
      "Account number or reference",
      "Official stamp/letterhead",
      "ACCEPT MULTI-PAGE DOCUMENTS: Even if billing details are included"
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
  "Tax Clearance Certificate": {
    requiredElements: [
      "Issued by South African Revenue Service (SARS)",
      "Tax Reference Number",
      "Issue Date", 
      "Expiry Date (usually 1 year from issue)",
      "Certificate Number",
      "Taxpayer Name and Address",
      "SARS official stamp/signature",
      "Clearance Status (Good Standing)",
      "ACCEPT: Tax Clearance Certificate OR Tax Compliance Status document - THEY ARE THE SAME",
      "ACCEPT MULTI-PAGE DOCUMENTS: Even if other tax documents are included"
    ],
    criticalChecks: ["has_tax_reference_number", "has_expiry_date", "issued_by_sars", "valid_clearance_status"]
  },
};

const MyDocuments = () => {
  const [profileData, setProfileData] = useState({});
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [validationResults, setValidationResults] = useState({});
  const [rejectionReasons, setRejectionReasons] = useState({});
  const [submittedDocuments, setSubmittedDocuments] = useState([]);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [expandedIDs, setExpandedIDs] = useState(false);
  const [expandedCVs, setExpandedCVs] = useState(false);
  const [activeSection, setActiveSection] = useState('documents');

  // Use the synchronization hook
  useDocumentSync(setSubmittedDocuments, setProfileData, null);

 // Replace your checkSubmittedDocs function with this:
const checkSubmittedDocs = (documents, data) => {
  return documents.filter(docLabel => {
    if (docLabel === "CV") {
      // Check for CVs from both sources
      const regularCVs = data.documents?.cv_multiple || [];
      const ownershipCVs = data.documents?.cv_multiple || []; // This gets both now
      const singleCV = getDocumentURL(docLabel, data);
      
      return regularCVs.length > 0 || ownershipCVs.length > 0 || !!singleCV;
    }
    
    // For other documents, use existing logic
    const url = getDocumentURL(docLabel, data);
    return !!(url && url !== null && url !== '');
  });
};

  useEffect(() => {
  const auth = getAuth();
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const profileRef = doc(db, "universalProfiles", user.uid);
        
        // ✅ REPLACE getDoc with onSnapshot for real-time updates
        const unsubscribeSnapshot = onSnapshot(profileRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfileData(data);
            const submitted = checkSubmittedDocs(DOCUMENTS, data);
            setSubmittedDocuments(submitted);
          }
          setLoading(false);
        });

        return () => unsubscribeSnapshot(); // Clean up snapshot listener
      } catch (err) {
        console.error("Failed to load user documents:", err);
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

  
  const getRegisteredName = async () => {
    const user = auth.currentUser;
    
    if (!user) {
      console.log("❌ No user found");
      return null;
    }

    try {
      const profileRef = doc(db, "universalProfiles", user.uid);
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        const data = profileSnap.data();
        const registeredName = data.entityOverview?.registeredName;
        return registeredName || null;
      } else {
        return null;
      }
    } catch (error) {
      console.error("❌ Error fetching registeredName:", error);
      return null;
    }
  };

  const createStrictPrompt = (docLabel, rules, registeredName) => { 
    let customInstructions = "";
    
    if (docLabel === "B-BBEE Certificate") {
      customInstructions = `SPECIAL INSTRUCTIONS FOR B-BBEE DOCUMENTS:
- ACCEPT BOTH: Traditional B-BBEE Certificates AND Exemption Affidavits for micro-enterprises
- EXEMPTION AFFIDAVITS MUST CONTAIN: Clear 'Exemption Affidavit' or 'Micro Enterprise' title, Commissioner of Oaths stamp, turnover declaration below R10 million
- CERTIFICATES MUST CONTAIN: B-BBEE level (1-8), certificate number, expiry date, issued by accredited agency
- REJECT: Generic letters, self-declarations without commissioner stamp, expired certificates, non-accredited certificates
- BOTH DOCUMENT TYPES ARE VALID for different business sizes
`;
    }

    if (docLabel === "IDs of Directors & Shareholders") {
      customInstructions = `SPECIAL INSTRUCTIONS FOR ID DOCUMENTS:
- ACCEPT ANY OFFICIAL ID DOCUMENT: South African ID Card, Passport, Driver's License, Refugee ID, Asylum Seeker Certificate
- CERTIFICATION NOT REQUIRED: Regular ID copies are acceptable - no commissioner stamp needed
- FOCUS ON: Document clarity, ID details, readability
- IGNORE COMPANY NAME CHECK: ID DOCUMENTS DON'T CONTAIN COMPANY NAMES
- DO NOT REJECT based on specific ID type - all official IDs are acceptable
- DO NOT REQUIRE CERTIFICATION: Regular copies are fully acceptable
`;
    }

    if (docLabel === "Tax Clearance Certificate") {
      customInstructions = `SPECIAL INSTRUCTIONS FOR TAX DOCUMENTS:
- ACCEPT BOTH: Tax Clearance Certificate AND Tax Compliance Status documents - THEY ARE THE SAME
- BOTH DOCUMENTS serve the same purpose and are issued by SARS
- FOCUS ON: SARS issuance, tax reference number, expiry date, company name matching
- DO NOT REJECT based on document title variation
`;
    }

    if (docLabel === "Financial Statements") { 
      customInstructions = `SPECIAL INSTRUCTIONS FOR FINANCIAL STATEMENTS:
- ACCEPT BOTH: Audited AND Unaudited financial statements
- ACCEPT MULTI-PAGE DOCUMENTS: Even if the PDF contains other documents (like VAT certificates, tax documents, etc.)
- FOCUS ON: Finding financial statements (Balance Sheet, Income Statement, Cash Flow) anywhere in the document
- DO NOT REJECT if other documents are included in the same PDF
- CHECK ALL PAGES: Scan entire document for financial statements
- IF FINANCIAL STATEMENTS FOUND: Return status "verified" regardless of audit status
- IF NOT AUDITED: Return status "verified:not_audited" with appropriate message
- AUDITED DOCUMENTS MUST CONTAIN: "auditor", "audit report", or "audit opinion" keywords
- KEY ELEMENTS TO LOOK FOR: Balance sheet, income statement, cash flow, revenue, expenses, assets, liabilities
`;
    }

    const universalInstructions = `UNIVERSAL DOCUMENT VALIDATION RULES:
- ✅ ACCEPT MULTI-PAGE DOCUMENTS: Even if other documents are included in the same PDF
- ✅ SCAN ALL PAGES: Check entire document for the required ${docLabel}
- ✅ DO NOT REJECT if other documents are included in the same file
- ✅ FOCUS ON: Finding the required ${docLabel} anywhere in the document
- ✅ IF ${docLabel.toUpperCase()} FOUND: Return status "verified" regardless of additional content
`;
    
    return `${customInstructions}
    ${universalInstructions}

ANALYZE THE UPLOADED DOCUMENT FILE (not these instructions):

DOCUMENT VALIDATION FOR: ${docLabel}

CRITICAL CHECKS:
1. 🔴 DOCUMENT TYPE: Must be exactly ${docLabel}
2. 🔴 COMPANY NAME: Must match "${registeredName}" 
3. 🔴 EXPIRY DATE: Must not be expired (current year: 2025)
4. 🔴 COMPLETENESS: Required elements present (somewhere in the document)

REQUIRED ELEMENTS IN UPLOADED DOCUMENT:
${rules.requiredElements.map(item => `- ${item}`).join('\n')}

ANALYZE THE UPLOADED FILE AND RESPOND WITH:
{
  "isValid": true,
  "status": "verified" | "verified:not_audited" | "wrong_type" | "name_mismatch" | "expired" | "incomplete",
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
        'Industry Accreditations', 'COIDA Letter of Good Standing'
      ];
      
      if (!expiryDocuments.includes(docLabel)) {
        return false;
      }
      
      const currentYear = new Date().getFullYear();
      const fileName = file.name.toLowerCase();
      
      for (let year = 2010; year < 2023; year++) {
        if (fileName.includes(year.toString())) {
          return true;
        }
      }
      
      if (file.lastModified) {
        const fileYear = new Date(file.lastModified).getFullYear();
        if (fileYear < 2023) {
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
        "tax compliance": "Tax Clearance Certificate",
        "financial statement": "Financial Statements",
        "audited financial": "Financial Statements", 
        "unaudited financial": "Financial Statements", 
        "balance sheet": "Financial Statements", 
        "income statement": "Financial Statements", 
        "cash flow": "Financial Statements",
        "5 year budget": "5 Year Budget",
        "bbbee": "B-BBEE Certificate",
        "b-bbee": "B-BBEE Certificate",
        "company registration": "Company Registration Certificate",
        "cipc": "Company Registration Certificate",
        "company profile": "Company Profile",
        "brochure": "Company Profile",
        "share register": "Share Register",
        "id document": "IDs of Directors & Shareholders",
        "passport": "IDs of Directors & Shareholders",
        "driver license": "IDs of Directors & Shareholders",
        "proof of address": "Proof of Address",
        "utility bill": "Proof of Address",
        "client reference": "Client references / Support Letters", 
        "reference letter": "Client references / Support Letters",
        "industry accreditation": "Industry Accreditations",
        "certificate": "Industry Accreditations",
        "support letter": "Client references / Support Letters", 
        "endorsement": "Client references / Support Letters", 
        "business plan": "Business Plan",
        "pitch deck": "Pitch Deck",
        "impact statement": "Impact Statements",
        "loan agreement": "Loan Agreements",
        "contract": "Guarantee Contracts",
        "coida": "COIDA Letter of Good Standing",
        "program report": "Previous Program Reports",
        "cv": "CV",
        "resume": "CV",
        "curriculum vitae": "CV"
      };

      const extractDocumentType = (text) => {
        const lowerText = text.toLowerCase();
        
        for (const [key, documentType] of Object.entries(documentTypeMap)) {
          if (lowerText.includes(key)) {
            return documentType;
          }
        }
        
        if (lowerText.includes('tax') && (lowerText.includes('clearance') || lowerText.includes('compliance'))) return "Tax Clearance Certificate";
        if (lowerText.includes('bbbee') || lowerText.includes('b-bbee')) return "B-BBEE Certificate";
        if (lowerText.includes('company') && lowerText.includes('registration')) return "Company Registration Certificate";
        if (lowerText.includes('business') && lowerText.includes('plan')) return "Business Plan";
        if (lowerText.includes('coida') || lowerText.includes('letter of good standing')) return "COIDA Letter of Good Standing";
        if (lowerText.includes('cv') || lowerText.includes('resume') || lowerText.includes('curriculum vitae')) return "CV";
        if (lowerText.includes('financial') && (lowerText.includes('statement') || lowerText.includes('balance sheet') || lowerText.includes('income statement') || lowerText.includes('cash flow'))) return "Financial Statements";
        if (lowerText.includes('client') && (lowerText.includes('reference') || lowerText.includes('support'))) return "Client references / Support Letters";

        return "this document type";
      };

      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          
          let userMessage;
          let status = parsed.status;
          
          let identifiedType = parsed.identifiedDocumentType;
          
          if (!identifiedType || identifiedType === "EXACT_DOCUMENT_NAME_FROM_LIST") {
            identifiedType = extractDocumentType(parsed.message || responseText);
          }
          
          if (parsed.status === "wrong_type" || (!parsed.isValid && identifiedType !== docLabel)) {
            if (docLabel === "Financial Statements" && 
                (identifiedType.includes("Financial") || identifiedType.includes("Statement") || 
                 identifiedType.includes("Balance Sheet") || identifiedType.includes("Income Statement") || 
                 identifiedType.includes("Cash Flow"))) {
              const isAudited = responseText.toLowerCase().includes('audit') || 
                               responseText.toLowerCase().includes('auditor') ||
                               responseText.toLowerCase().includes('audited') ||
                               responseText.toLowerCase().includes('audit report') ||
                               responseText.toLowerCase().includes('audit opinion');
              
              if (isAudited) {
                userMessage = "Audited financial statements verified";
                status = "verified";
              } else {
                userMessage = "Financial statements verified (not audited)";
                status = "verified:not_audited";
              }
            } else {
              userMessage = `Please upload a ${docLabel} doc, not ${identifiedType}`;
              status = "wrong_type";
            }
          } else if (parsed.status === "name_mismatch") {
            userMessage = "Company name does not match your registered name";
            status = "name_mismatch";
          } else if (parsed.status === "expired") {
            userMessage = "Document expired";
            status = "expired";
          } else if (parsed.status === "incomplete") {
            userMessage = "Document is incomplete - missing required elements";
            status = "incomplete";
          } else if (parsed.status === "verified:not_audited") {
            userMessage = "Financial statements verified (not audited)";
            status = "verified:not_audited";
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

      let finalResult = parseDetailedResponse(response.text, docLabel);

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

 // Replace your getMultipleDocumentData function with this:
const getMultipleDocumentData = (docLabel, profileData) => {
  const documentId = getDocumentId(docLabel);
  
  if (docLabel === "CV") {
    // Get CVs from both sources and merge them
    const regularCVs = profileData.documents?.[`${documentId}_multiple`] || [];
    const ownershipCVs = profileData.documents?.cv_multiple || [];
    
    // Combine and deduplicate by URL
    const allCVs = [...regularCVs, ...ownershipCVs];
    const uniqueCVs = allCVs.filter((cv, index, self) => 
      index === self.findIndex(c => c.url === cv.url)
    );
    
    return uniqueCVs;
  }
  
  // For other documents, use existing logic
  const multipleDocs = profileData.documents?.[`${documentId}_multiple`] || [];
  
  if (multipleDocs.length === 0) {
    const singleUrl = getDocumentURL(docLabel, profileData);
    if (singleUrl) {
      return [{
        url: singleUrl,
        status: "verified",
        message: `${docLabel} verified`,
        uploadedAt: profileData.documents?.[`${documentId}UpdatedAt`]?.seconds ? 
          new Date(profileData.documents[`${documentId}UpdatedAt`].seconds * 1000).toISOString() : 
          new Date().toISOString()
      }];
    }
  }
  
  return multipleDocs;
};

  // Unified function to handle individual document upload
  const handleIndividualDocumentUpload = async (docLabel, file, docIndex) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user || !file) return;

    setIsUploading(true);
    setIsOverlayVisible(true);

    try {
      const registeredName = await getRegisteredName();
      const storage = getStorage();
      const documentId = getDocumentId(docLabel);
      const profileRef = doc(db, "universalProfiles", user.uid);

      const validationResult = await validateDocumentWithAI(docLabel, file, registeredName);
      
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${validationResult.message}`);
      }

      const fileExtension = file.name.toLowerCase().split('.').pop();
      const fileName = `${documentId}_${Date.now()}_${docIndex}.${fileExtension}`;
      const storageRef = ref(storage, `universalProfiles/documents/${user.uid}/${fileName}`);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const newDocData = {
        url: downloadURL,
        status: validationResult.status,
        message: validationResult.message,
        uploadedAt: new Date().toISOString()
      };

      const existingDocs = getMultipleDocumentData(docLabel, profileData);
      let updatedDocs;

      if (docIndex < existingDocs.length) {
        updatedDocs = existingDocs.map((doc, index) => 
          index === docIndex ? newDocData : doc
        );
      } else {
        updatedDocs = [...existingDocs, newDocData];
      }

      const updateData = {
        [`documents.${documentId}_multiple`]: updatedDocs,
        [`documents.${documentId}_multiple_updated`]: serverTimestamp(),
        [`documents.${documentId}_count`]: updatedDocs.length
      };

      await updateDoc(profileRef, updateData);
      
      const updatedProfileSnap = await getDoc(profileRef);
      if (updatedProfileSnap.exists()) {
        setProfileData(updatedProfileSnap.data());
      }
      
      setIsUploading(false);
      setTimeout(() => {
        setIsOverlayVisible(false);
      }, 300);
      
    } catch (error) {
      console.error("Individual document upload failed:", error);
      setIsUploading(false);
      setTimeout(() => {
        setIsOverlayVisible(false);
        alert(`Upload failed: ${error.message}`);
      }, 300);
    }
  };

  const handleDeleteIndividualDocument = async (docLabel, displayIndex) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return;

  const confirmDelete = window.confirm(`Are you sure you want to delete this ${docLabel}?`);
  if (!confirmDelete) return;

  try {
    const documentId = getDocumentId(docLabel);
    const profileRef = doc(db, "universalProfiles", user.uid);

    const currentDocs = getMultipleDocumentData(docLabel, profileData);
    
    // Get the document to be deleted
    const docToDelete = currentDocs[displayIndex];
    
    if (!docToDelete) {
      alert("Document not found!");
      return;
    }

    // For ownership management CVs, find by source and index
    if (docLabel === "CV" && docToDelete.source === "ownership_management") {
      const updatedDocs = currentDocs.filter((doc, i) => {
        // Match by source AND director/executive index
        if (doc.source === "ownership_management" && doc.directorIndex !== undefined) {
          return doc.directorIndex !== docToDelete.directorIndex;
        }
        if (doc.source === "ownership_management" && doc.executiveIndex !== undefined) {
          return doc.executiveIndex !== docToDelete.executiveIndex;
        }
        // Keep other documents
        return i !== displayIndex;
      });

      const updateData = {
        [`documents.cv_multiple`]: updatedDocs,
        [`documents.cv_multiple_updated`]: serverTimestamp(),
        [`documents.cv_count`]: updatedDocs.length
      };

      await updateDoc(profileRef, updateData);
      
      // Also delete from ownership management data
      if (docToDelete.directorIndex !== undefined) {
        // Trigger deletion from ownership management
        console.log("Director CV should be deleted from ownership management too");
      }
    } else {
      // Regular deletion for other documents
      const updatedDocs = currentDocs.filter((_, i) => i !== displayIndex);
      
      const updateData = {
        [`documents.${documentId}_multiple`]: updatedDocs,
        [`documents.${documentId}_multiple_updated`]: serverTimestamp(),
        [`documents.${documentId}_count`]: updatedDocs.length
      };

      await updateDoc(profileRef, updateData);
    }
    
    // Refresh data
    const updatedProfileSnap = await getDoc(profileRef);
    if (updatedProfileSnap.exists()) {
      setProfileData(updatedProfileSnap.data());
      const submitted = checkSubmittedDocs(DOCUMENTS, updatedProfileSnap.data());
      setSubmittedDocuments(submitted);
    }
    
  } catch (error) {
    console.error("Error deleting individual document:", error);
    alert('Failed to delete document. Please try again.');
  }
};

  // Unified function to add new document slot
  const handleAddNewDocument = async (docLabel) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    try {
      const documentId = getDocumentId(docLabel);
      const profileRef = doc(db, "universalProfiles", user.uid);

      const currentDocs = getMultipleDocumentData(docLabel, profileData);
      const newDocData = {
        url: "",
        status: "pending",
        message: "No document uploaded",
        uploadedAt: new Date().toISOString()
      };

      const updatedDocs = [...currentDocs, newDocData];

      const updateData = {
        [`documents.${documentId}_multiple`]: updatedDocs,
        [`documents.${documentId}_multiple_updated`]: serverTimestamp(),
        [`documents.${documentId}_count`]: updatedDocs.length
      };

      await updateDoc(profileRef, updateData);
      
      const updatedProfileSnap = await getDoc(profileRef);
      if (updatedProfileSnap.exists()) {
        setProfileData(updatedProfileSnap.data());
      }
      
    } catch (error) {
      console.error("Error adding new document slot:", error);
      alert('Failed to add new document slot. Please try again.');
    }
  };

  // Helper function to render document link for individual documents
  const renderDocumentLinkForIndividual = (doc) => {
    if (!doc.url || doc.url === "") {
      return (
        <span style={{
          color: "#8d6e63",
          fontSize: "12px",
          fontStyle: "italic"
        }}>
          No document uploaded
        </span>
      );
    }

    return (
      <a
        href={doc.url}
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

  // In renderIndividualDocumentActions function, check if it's a CV from ownership
const renderIndividualDocumentActions = (docLabel, docIndex, doc) => {
  // If it's a CV from ownership management, only show delete, not upload
  if (docLabel === "CV" && doc.source === "ownership_management") {
    return (
      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
        <button
          onClick={() => handleDeleteIndividualDocument(docLabel, docIndex)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "6px 12px",
            backgroundColor: "#d32f2f",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "11px",
            cursor: "pointer",
            fontWeight: "600",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#b71c1c";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#d32f2f";
          }}
        >
          <Trash2 size={12} />
          Delete
        </button>
      </div>
    );
  }
  
  // Regular actions for other documents
  return (
    <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
      <label style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 12px",
        backgroundColor: "#a67c52",
        color: "white",
        borderRadius: "6px",
        fontSize: "11px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.2s ease"
      }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = "#8d6e63";
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = "#a67c52";
      }}
      >
        <Upload size={12} />
        {doc.url ? "Update" : "Upload"}
        <input
          type="file"
          style={{ display: "none" }}
          onChange={(e) => {
            const files = e.target.files[0];
            if (files) {
              handleIndividualDocumentUpload(docLabel, files[0], docIndex);
            }
          }}
          accept=".pdf,.jpg,.jpeg,.png"
        />
      </label>
      <button
        onClick={() => handleDeleteIndividualDocument(docLabel, docIndex)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "6px 12px",
          backgroundColor: "#d32f2f",
          color: "white",
          border: "none",
          borderRadius: "6px",
          fontSize: "11px",
          cursor: "pointer",
          fontWeight: "600",
          transition: "all 0.2s ease"
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = "#b71c1c";
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = "#d32f2f";
        }}
      >
        <Trash2 size={12} />
        Delete
      </button>
    </div>
  );
};
  const renderDocumentLink = (label) => {
    const multiUploadDocuments = ["IDs of Directors & Shareholders", "CV"];
    
    if (multiUploadDocuments.includes(label)) {
      const allDocs = getMultipleDocumentData(label, profileData);
      const hasDocuments = allDocs.some(doc => doc.url && doc.url !== "");
      
      if (!hasDocuments) {
        return (
          <span style={{
            color: "#8d6e63",
            fontSize: "12px",
            fontStyle: "italic"
          }}>
            No documents uploaded
          </span>
        );
      }

      const isExpanded = label === "IDs of Directors & Shareholders" ? expandedIDs : expandedCVs;
      const setExpanded = label === "IDs of Directors & Shareholders" ? setExpandedIDs : setExpandedCVs;

      return (
        <div style={{ textAlign: "center" }}>
          <span style={{
            color: "#5d4037",
            fontSize: "12px",
            fontWeight: "500"
          }}>
            {allDocs.filter(doc => doc.url && doc.url !== "").length} {label === "IDs of Directors & Shareholders" ? "ID(s)" : "CV(s)"} uploaded
          </span>
          <div style={{ marginTop: "4px" }}>
            <button
              onClick={() => setExpanded(!isExpanded)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 8px",
                backgroundColor: "transparent",
                color: "#8d6e63",
                border: "1px solid #8d6e63",
                borderRadius: "4px",
                fontSize: "10px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#8d6e63";
                e.target.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
                e.target.style.color = "#8d6e63";
              }}
            >
              {isExpanded ? <Minus size={10} /> : <Plus size={10} />}
              {isExpanded ? "Hide" : "Show"} {label === "IDs of Directors & Shareholders" ? "IDs" : "CVs"}
            </button>
          </div>
        </div>
      );
    }

    // Regular documents (unchanged)
    const documentId = getDocumentId(label);
    const url = profileData.documents?.[documentId] || getDocumentURL(label, profileData);
    
    if (!url) {
      return (
        <span style={{
          color: "#8d6e63",
          fontSize: "12px",
          fontStyle: "italic"
        }}>
          No document uploaded
        </span>
      );
    }

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

  const handleFileUpload = async (docLabel, file) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user || !file) return;

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

    setIsUploading(true);
    setIsOverlayVisible(true);

    try {
      const registeredName = await getRegisteredName();
      const validationResult = await validateDocumentWithAI(docLabel, file, registeredName);

      if (!validationResult.isValid) {
        alert(`Validation failed: ${validationResult.message}`);
        setIsUploading(false);
        setIsOverlayVisible(false);
        return;
      }

      setRejectionReasons(prev => ({
        ...prev,
        [docLabel]: validationResult.rejectionReason
      }));

      if (validationResult.warnings && validationResult.warnings.length > 0) {
        const proceed = window.confirm(
          `Document has warnings:\n${validationResult.warnings.join('\n')}\n\nDo you want to proceed anyway?`
        );
        if (!proceed) {
          setIsUploading(false);
          setIsOverlayVisible(false);
          return;
        }
      }

      const storage = getStorage();
      const documentId = getDocumentId(docLabel);
      const category = getDocumentCategory(docLabel);
      
      const fileName = `${documentId}.${fileExtension}`;
      const storageRef = ref(storage, `universalProfiles/documents/${user.uid}/${fileName}`);

      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const profileRef = doc(db, "universalProfiles", user.uid);
      const unifiedPath = UNIFIED_DOCUMENT_PATHS[documentId];

      const updateData = {
        [unifiedPath]: downloadURL,
        [`${unifiedPath}UpdatedAt`]: serverTimestamp(),
        [`verification.${documentId}`]: {
          status: validationResult.status,
          message: validationResult.message,
          lastChecked: serverTimestamp()
        }
      };

      if (category === DOCUMENT_CATEGORIES.PROFILE) {
        switch(documentId) {
          case 'registrationCertificate':
            updateData[`entityOverview.registrationCertificate`] = downloadURL;
            break;
          case 'certifiedIds':
            updateData[`ownershipManagement.certifiedIds`] = downloadURL;
            break;
          case 'shareRegister':
            updateData[`ownershipManagement.shareRegister`] = downloadURL;
            break;
          case 'proofOfAddress':
            updateData[`contactDetails.proofOfAddress`] = downloadURL;
            break;
          case 'taxClearanceCert':
          case 'bbbeeCert':
          case 'otherCerts':
          case 'industryAccreditationDocs':
            updateData[`legalCompliance.${documentId}`] = downloadURL;
            break;
          case 'companyProfile':
          case 'clientReferences':
            updateData[`productsServices.${documentId}`] = downloadURL;
            break;
          case 'cv':
            updateData[`productsServices.cv`] = downloadURL;
            break;
        }
      }

      await updateDoc(profileRef, updateData);
      setSubmittedDocuments((prev) => Array.from(new Set([...prev, docLabel])));
      
      const updatedProfileSnap = await getDoc(profileRef);
      if (updatedProfileSnap.exists()) {
        setProfileData(updatedProfileSnap.data());
      }
      
      setIsUploading(false);
      setTimeout(() => {
        setIsOverlayVisible(false);
      }, 300);
      
    } catch (error) {
      console.error("Upload failed:", error);
      setIsUploading(false);
      setTimeout(() => {
        setIsOverlayVisible(false);
        alert('Upload failed - please try again');
      }, 300);
    }
  };

  const getDocumentStatus = (docLabel) => {
    const documentId = getDocumentId(docLabel);
    const url = getDocumentURL(docLabel, profileData);
    const verification = profileData.verification?.[documentId];
    
    if (!url) {
      return "pending";
    }
    
    if (!verification) {
      return "uploaded";
    }
    
    return verification.status || "uploaded";
  };

  const filteredDocuments = DOCUMENTS.filter((doc) => {
    const documentStatus = getDocumentStatus(doc);
    
    const fundingDocuments = [
      "5 Year Budget",
      "Bank Details Confirmation Letter", 
      "Financial Statements",
      "Loan Agreements",
    ];

    const complianceDocuments = [
      "Company Registration Certificate",
      "Tax Clearance Certificate", 
      "B-BBEE Certificate",
      "Bank Confirmation Letter",
      "COIDA Letter of Good Standing",
      "Proof of Address",
      "Company Profile / Brochure"
    ];

    const legitimacyDocuments = [
      "Company Registration Certificate",
      "Tax Clearance Certificate",
      "B-BBEE Certificate",
      "COIDA Letter of Good Standing",
      "Industry Accreditations",
      "Client References / Support Letters",
      "Company Profile / Brochure",
    ];

    const leadershipDocuments = [
      "CV"
    ];

    const governanceDocuments = [
      "IDs of Directors & Shareholders",
      "Share Register",
    ];

    const capitalAppealDocuments = [
      "Financial Statements", 
      "5 Year Budget",
      "Business Plan",
      "Pitch Deck",
      "B-BBEE Certificate",
      "Company Profile / Brochure",
      "Industry Accreditations",
      "Loan Agreements",
      "Guarantee/Contract"
    ];

    const matchFilter =
      filter === "all" ||
      (filter === "Funding" && fundingDocuments.includes(doc)) ||
      (filter === "Compliance" && complianceDocuments.includes(doc)) || 
      (filter === "Legitimacy" && legitimacyDocuments.includes(doc)) || 
      (filter === "Leadership" && leadershipDocuments.includes(doc)) || 
      (filter === "Governance" && governanceDocuments.includes(doc)) ||
      (filter === "Capital Appeal" && capitalAppealDocuments.includes(doc)); 

    const matchStatusFilter = 
      statusFilter === "all" ||
      (statusFilter === "pending" && !getDocumentURL(doc, profileData)) ||
      (statusFilter === "verified" && (documentStatus === "verified" || documentStatus === "verified:not_audited")) ||
      (statusFilter === "rejected" && 
        (documentStatus === "wrong_type" || documentStatus === "expired" || 
         documentStatus === "name_mismatch" || documentStatus === "incomplete")) ||
      (statusFilter === "uploaded" && getDocumentURL(doc, profileData) && 
       documentStatus !== "verified" && documentStatus !== "verified:not_audited");

    const matchSearch = doc.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchFilter && matchStatusFilter && matchSearch;
  });

  const handleDeleteDocument = async (docLabel) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const confirmDelete = window.confirm(`Are you sure you want to delete ${docLabel}?`);
    if (!confirmDelete) return;

    try {
      const documentId = getDocumentId(docLabel);
      const category = getDocumentCategory(docLabel);
      const profileRef = doc(db, "universalProfiles", user.uid);

      const updateData = {
        [`documents.${documentId}`]: null,
        [`verification.${documentId}`]: null,
        [`documents.${documentId}UpdatedAt`]: null,
        [`documents.${documentId}_multiple`]: null,
        [`documents.${documentId}_multiple_updated`]: null,
        [`documents.${documentId}_count`]: null
      };

      if (category === DOCUMENT_CATEGORIES.PROFILE) {
        switch(documentId) {
          case 'registrationCertificate':
            updateData[`entityOverview.registrationCertificate`] = null;
            updateData[`entityOverview.registrationCertificateUpdatedAt`] = null; 
            break;
          case 'certifiedIds':
            updateData[`ownershipManagement.certifiedIds`] = null;
            updateData[`ownershipManagement.certifiedIdsUpdatedAt`] = null;
            break;
          case 'shareRegister':
            updateData[`ownershipManagement.shareRegister`] = null;
            updateData[`ownershipManagement.shareRegisterUpdatedAt`] = null;
            break;
          case 'proofOfAddress':
            updateData[`contactDetails.proofOfAddress`] = null;
            updateData[`contactDetails.proofOfAddressUpdatedAt`] = null;
            break;
          case 'taxClearanceCert':
          case 'bbbeeCert':
          case 'otherCerts':
          case 'industryAccreditationDocs':
            updateData[`legalCompliance.${documentId}`] = null;
            updateData[`legalCompliance.${documentId}UpdatedAt`] = null;
            break;
          case 'companyProfile':
          case 'clientReferences':
            updateData[`productsServices.${documentId}`] = null;
            updateData[`productsServices.${documentId}UpdatedAt`] = null;
            break;
          case 'cv':
            updateData[`productsServices.cv`] = null;
            updateData[`productsServices.cvUpdatedAt`] = null;
            break;
        }
      }

      await updateDoc(profileRef, updateData);
      
      setSubmittedDocuments(prev => prev.filter(d => d !== docLabel));
      
      const updatedProfileSnap = await getDoc(profileRef);
      if (updatedProfileSnap.exists()) {
        setProfileData(updatedProfileSnap.data());
      }
      
    } catch (error) {
      console.error("Error deleting document:", error);
      alert('Failed to delete document. Please try again.');
    }
  };

  const getStatusBadge = (docLabel) => {
    const multiUploadDocuments = ["IDs of Directors & Shareholders", "CV"];
    
    if (multiUploadDocuments.includes(docLabel)) {
      const allDocs = getMultipleDocumentData(docLabel, profileData);
      const hasUploadedDocs = allDocs.some(doc => doc.url && doc.url !== "");
      
      if (!hasUploadedDocs) {
        return (
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "4px 8px",
            borderRadius: "12px",
            fontSize: "11px",
            fontWeight: "600",
            backgroundColor: "#ffebee",
            color: "#c62828"
          }}>
            Not Uploaded
          </span>
        );
      }

      const allVerified = allDocs.filter(doc => doc.url && doc.url !== "").every(doc => 
        doc.status === "verified" || doc.status === "verified:not_audited"
      );

      if (allVerified) {
        return (
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "4px 8px",
            borderRadius: "12px",
            fontSize: "11px",
            fontWeight: "600",
            backgroundColor: "#e8f5e8",
            color: "#2e7d32"
          }}>
            Verified
          </span>
        );
      }

      return (
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "4px 8px",
          borderRadius: "12px",
          fontSize: "11px",
          fontWeight: "600",
          backgroundColor: "#fff3e0",
          color: "#ef6c00"
        }}>
          Uploaded
        </span>
      );
    }

    const documentId = getDocumentId(docLabel);
    const url = getDocumentURL(docLabel, profileData);
    const verification = profileData.verification?.[documentId];
    
    if (!url) {
      return (
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "4px 8px",
          borderRadius: "12px",
          fontSize: "11px",
          fontWeight: "600",
          backgroundColor: "#ffebee",
          color: "#c62828"
        }}>
          Pending
        </span>
      );
    }

    let backgroundColor = "#e8f5e8";
    let color = "#2e7d32";
    let statusText = "Uploaded";

    if (verification) {
      if (verification.status === "verified" || verification.status === "verified:not_audited") {
        backgroundColor = verification.status === "verified:not_audited" ? "#fff3e0" : "#e8f5e8";
        color = verification.status === "verified:not_audited" ? "#ef6c00" : "#2e7d32";
        statusText = verification.status === "verified:not_audited" ? "Verified (Not Audited)" : "Verified";
      } else if (verification.status === "expired") {
        backgroundColor = "#ffebee";
        color = "#c62828";
        statusText = "Expired";
      } else if (verification.status === "wrong_type") {
        backgroundColor = "#fff3e0";
        color = "#ef6c00";
        statusText = "Wrong Type";
      } else if (verification.status === "name_mismatch") {
        backgroundColor = "#fff3e0";
        color = "#ef6c00";
        statusText = "Name Mismatch";
      } else if (verification.status === "incomplete") {
        backgroundColor = "#fff3e0";
        color = "#ef6c00";
        statusText = "Incomplete";
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
        padding: "4px 8px",
        borderRadius: "12px",
        fontSize: "11px",
        fontWeight: "600",
        backgroundColor,
        color
      }}>
        {statusText}
      </span>
    );
  };

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

 // In the expanded rows render function
const renderExpandedRows = (docLabel, docs, isExpanded, docType) => {
  if (!isExpanded) return null;

  return docs.map((doc, docIndex) => {
    // Determine display name based on role
    let displayName = `${docType} ${docIndex + 1}`;
    
    if (doc.role && doc.personName) {
      if (doc.role === "Director") {
        displayName = `${doc.personName} (Director ${doc.directorIndex + 1})`;
      } else if (doc.role === "Executive") {
        displayName = `${doc.personName} (Executive ${doc.executiveIndex + 1})`;
      }
    }
    
    return (
      <tr 
        key={`${docType}-${docIndex}`}
        style={{
          backgroundColor: docIndex % 2 === 0 ? "#f9f5f3" : "#f5f2f0",
          borderBottom: "1px solid #e8d8cf",
          transition: "background-color 0.2s ease"
        }}
      >
        <td style={{
          padding: "12px 20px 12px 40px",
          fontSize: "13px",
          color: "#6d4c41",
          fontWeight: "500",
          verticalAlign: "middle",
          borderLeft: "3px solid #8d6e63"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              justifyContent: "center",
              width: "20px",
              height: "20px",
              backgroundColor: "#8d6e63",
              color: "white",
              borderRadius: "50%",
              fontSize: "10px",
              fontWeight: "600"
            }}>
              {docIndex + 1}
            </span>
            {displayName} {/* Use displayName instead of static text */}
            {docLabel === "IDs of Directors & Shareholders" ? "of Directors & Shareholders" : ""}
          </div>
        </td>
        
        <td style={{
          padding: "12px 20px",
          textAlign: "center",
          verticalAlign: "middle"
        }}>
          {renderDocumentLinkForIndividual(doc)}
        </td>
        <td style={{
          padding: "12px 20px",
          fontSize: "12px",
          color: "#6d4c41",
          textAlign: "center",
          verticalAlign: "middle"
        }}>
          {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "-"}
        </td>
        <td style={{
          padding: "12px 20px",
          fontSize: "12px",
          color: "#6d4c41",
          textAlign: "center",
          verticalAlign: "middle"
        }}>
          {doc.message || "No document uploaded"}
        </td>
        <td style={{
          padding: "12px 20px",
          textAlign: "center",
          verticalAlign: "middle"
        }}>
          {!doc.url || doc.url === "" ? (
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "4px 8px",
              borderRadius: "12px",
              fontSize: "10px",
              fontWeight: "600",
              backgroundColor: "#ffebee",
              color: "#c62828"
            }}>
              Not Uploaded
            </span>
          ) : (
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "4px 8px",
              borderRadius: "12px",
              fontSize: "10px",
              fontWeight: "600",
              backgroundColor: doc.status === "verified" || doc.status === "verified:not_audited" ? "#e8f5e8" : 
                              doc.status === "pending" ? "#fff3e0" : "#ffebee",
              color: doc.status === "verified" || doc.status === "verified:not_audited" ? "#2e7d32" : 
                    doc.status === "pending" ? "#ef6c00" : "#c62828"
            }}>
              {doc.status === "verified" || doc.status === "verified:not_audited" ? "Verified" : 
              doc.status === "pending" ? "Pending" : 
              doc.status || "Uploaded"}
            </span>
          )}
        </td>
        <td style={{
          padding: "12px 20px",
          textAlign: "center",
          verticalAlign: "middle"
        }}>
          {renderIndividualDocumentActions(docLabel, docIndex, doc)}
        </td>
      </tr>
    );
  });
}; 

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
            fontSize: "1rem !important";
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
              {["all", "Compliance", "Legitimacy", "Leadership", "Governance", "Capital Appeal"].map((type) => (
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
                    }}>
                      Documents Verification
                    </th>
                    <th style={{
                      padding: "16px 20px",
                      textAlign: "center",
                      fontWeight: "600",
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: "2px solid #6d4c41",
                      width: "15%"
                    }}>
                      <div style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        gap: "8px",
                        cursor: "pointer"
                      }}
                      onClick={() => setShowStatusFilter(!showStatusFilter)}
                      >
                        Status
                        <Filter size={14} />
                      </div>
                    </th>
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
                    const documentId = getDocumentId(doc);
                    const unifiedPath = UNIFIED_DOCUMENT_PATHS[documentId];
                    let updatedAt;
                    
                    updatedAt = profileData[`documents.${documentId}UpdatedAt`] || 
                              get(profileData, `${unifiedPath}UpdatedAt`) ||
                              get(profileData, `${DOCUMENT_PATHS[doc]}UpdatedAt`);

                    const isMultiUpload = ["IDs of Directors & Shareholders", "CV"].includes(doc);
                    const allDocs = isMultiUpload ? getMultipleDocumentData(doc, profileData) : [];

                    return (
                      <>
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
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              {doc.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                {isMultiUpload && doc === "IDs of Directors & Shareholders" && (  // Only show for IDs
                                      <button
                                        onClick={() => handleAddNewDocument(doc)}
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "4px",
                                          padding: "4px 8px",
                                          backgroundColor: "#5d4037",
                                          color: "white",
                                          border: "none",
                                          borderRadius: "4px",
                                          fontSize: "10px",
                                          cursor: "pointer",
                                          fontWeight: "600",
                                          transition: "all 0.2s ease"
                                        }}
                                        onMouseEnter={(e) => {
                                          e.target.style.backgroundColor = "#3e2723";
                                          e.target.style.transform = "translateY(-1px)";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.target.style.backgroundColor = "#5d4037";
                                          e.target.style.transform = "translateY(0)";
                                        }}
                                      >
                                        <Plus size={10} />
                                        Add ID
                                      </button>
                                    )}
                            </div>
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
                            fontSize: "13px",
                            fontWeight: "10px",
                            color: "#6d4c41",
                            textAlign: "center",
                            verticalAlign: "middle",
                            backgroundColor: "transparent"
                          }}>
                            {isMultiUpload ? (
                              (() => {
                                const uploadedCount = allDocs.filter(d => d.url && d.url !== "").length;
                                const verifiedCount = allDocs.filter(d => 
                                  d.url && d.url !== "" && (d.status === "verified" || d.status === "verified:not_audited")
                                ).length;
                                
                                if (uploadedCount === 0) {
                                  return "No documents uploaded";
                                }
                                
                                return `${verifiedCount}/${uploadedCount} ${doc === "IDs of Directors & Shareholders" ? "ID(s)" : "CV(s)"} verified`;
                              })()
                            ) : (
                              (() => {
                                const url = getDocumentURL(doc, profileData);
                                const documentId = getDocumentId(doc);
                                const verification = profileData.verification?.[documentId];
                                
                                if (!url) {
                                  return "No document uploaded";
                                }
                                
                                if (!verification) {
                                  return "Uploaded - Pending Verification";
                                }
                                
                                return verification.message || "Document uploaded";
                              })()
                            )}
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
                            {isMultiUpload ? (
                              <div style={{ display: "flex", gap: "8px", justifyContent: "center", alignItems: "center" }}>
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
                                  Upload
                                  <input
                                    type="file"
                                    style={{ display: "none" }}
                                    onChange={(e) => {
                                      const files = e.target.files;
                                      if (files && files.length > 0) {
                                        handleIndividualDocumentUpload(doc, files[0], 0);
                                      }
                                    }}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                  />
                                </label>
                              </div>
                            ) : (
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
                            )}
                          </td>
                        </tr>
                        
                        {/* Expanded rows for multi-upload documents */}
                        {doc === "IDs of Directors & Shareholders" && 
                          renderExpandedRows(doc, allDocs, expandedIDs, "ID")}
                        
                        {doc === "CV" && 
                          renderExpandedRows(doc, allDocs, expandedCVs, "CV")}
                      </>
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