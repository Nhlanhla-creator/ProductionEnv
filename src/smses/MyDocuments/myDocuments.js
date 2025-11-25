import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getDoc, doc, updateDoc, serverTimestamp, collection, getDocs, where } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth } from "../../firebaseConfig";
import { FileText, ExternalLink, Upload, Filter } from "lucide-react";
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
  "Audited Financials", 
  "Bank Details Confirmation Letter",
  "B-BBEE Certificate",
  "Business Plan",
  "Certified IDs of Directors & Shareholders",
  "Client References",
  "Company Profile / Brochure",
  "Company Registration Certificate",
  "COIDA Letter of Good Standing",
  "CV", // ✅ ADDED CV DOCUMENT
  "Financial Statements", 
  "Guarantee/Contract",
  "Impact Statements", 
  "Industry Accreditations",
  "Loan Agreements",
  "Pitch Deck",
  "Previous Program Reports",
  "Proof of Address",
  "Share Register",
  "Support Letters / Endorsements",
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
      "Financial assumptions"
    ],
    strictChecks: ["covers_5_years", "has_all_three_statements", "shows_projection_basis"]
  },
  "Audited Financials": {
    requiredElements: [
      "Financial statements (Balance Sheet, Income Statement, Cash Flow)",
      "Auditor's report/signed opinion (if audited)",
      "Notes to financial statements", 
      "Comparative figures",
      "Company name and period covered"
    ],
    strictChecks: ["has_financial_statements", "has_company_name", "covers_complete_period"]
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
  "B-BBEE Certificate": {
    requiredElements: [
      "Expiry date - MUST NOT BE EXPIRED",
      "Issued by accredited verification agency",
      "B-BBEE certificate number",
      "B-BBEE level (1-8)", 
      "Issue date",
      "Certificate must be currently valid",
      "Company registration details",
      "SANAS logo or accreditation number"
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
      "Information Filled In"
    ],
    strictChecks: ["has_executive_summary", "has_market_analysis", "has_financials"]
  },
  "Certified IDs of Directors & Shareholders": {
    requiredElements: [
      "Certification stamp/signature (Commissioner of Oaths)",
      "Certification date within last 3 months", 
      "ID document (South African ID Card, Passport, Driver's License, etc.)",
      "Photograph of ID holder",
      "Full names matching company records",
      "Keywords: Certified, True Copy, Commissioner of Oaths",
      "✅ ACCEPT ANY OFFICIAL ID: South African ID Card, Passport, Driver's License, Refugee ID"
    ],
    strictChecks: ["certified_within_3_months", "has_id_details", "names_match_records"]
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
  "COIDA Letter of Good Standing": {
    requiredElements: [
      "Issued by Compensation Fund",
      "Letter of Good Standing title",
      "Employer reference number",
      "Company name and address",
      "Issue date",
      "Status confirmation (Good Standing)",
      "Official stamp/signature"
    ],
    strictChecks: ["issued_by_compensation_fund", "has_employer_reference", "shows_good_standing"]
  },
  "CV": { // ✅ ADDED CV VALIDATION RULES
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
      "Clearance Status (Good Standing)",
      "✅ ACCEPT: Tax Clearance Certificate OR Tax Compliance Status document - THEY ARE THE SAME"
    ],
    criticalChecks: ["has_tax_reference_number", "has_expiry_date", "issued_by_sars", "valid_clearance_status"]
  },
};


const MyDocuments = () => {
  const [profileData, setProfileData] = useState({});
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // ✅ ADDED STATUS FILTER
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [validatingDoc, setValidatingDoc] = useState(null);
  const [validationResults, setValidationResults] = useState({});
  const [rejectionReasons, setRejectionReasons] = useState({});
  const [submittedDocuments, setSubmittedDocuments] = useState([]);
  const [showStatusFilter, setShowStatusFilter] = useState(false); // ✅ ADDED STATUS FILTER DROPDOWN STATE

  // Use the synchronization hook
  useDocumentSync(setSubmittedDocuments, setProfileData, null);

    const checkSubmittedDocs = (documents, data) => {
    return documents.filter(docLabel => {
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
      console.log("User Name:", user?.email)
    });

    return () => unsubscribe();
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
        console.log("❌ No profile found");
        return null;
      }
    } catch (error) {
      console.error("❌ Error fetching registeredName:", error);
      return null;
    }
  };



  const createStrictPrompt = (docLabel, rules, registeredName) => { 
    let customInstructions = "";
    
    // ✅ SPECIAL INSTRUCTIONS FOR DIFFERENT DOCUMENT TYPES
    if (docLabel === "B-BBEE Certificate") {
      customInstructions = `SPECIAL INSTRUCTIONS FOR B-BBEE DOCUMENTS:
- ACCEPT BOTH: Traditional B-BBEE Certificates AND Exemption Affidavits for micro-enterprises
- EXEMPTION AFFIDAVITS MUST CONTAIN: Clear 'Exemption Affidavit' or 'Micro Enterprise' title, Commissioner of Oaths stamp, turnover declaration below R10 million
- CERTIFICATES MUST CONTAIN: B-BBEE level (1-8), certificate number, expiry date, issued by accredited agency
- REJECT: Generic letters, self-declarations without commissioner stamp, expired certificates, non-accredited certificates
- BOTH DOCUMENT TYPES ARE VALID for different business sizes
`;
    }

     if (docLabel === "Certified IDs of Directors & Shareholders") {
      customInstructions = `SPECIAL INSTRUCTIONS FOR ID DOCUMENTS:
- ACCEPT ANY OFFICIAL ID DOCUMENT: South African ID Card, Passport, Driver's License, Refugee ID, Asylum Seeker Certificate
- MUST BE CERTIFIED: Commissioner of Oaths stamp/signature within last 3 months
- FOCUS ON: Certification validity, document clarity, ID details
- IGNORE COMPANY NAME CHECK: ID DOCUMENTS DON'T CONTAIN COMPANY NAMES
- DO NOT REJECT based on specific ID type - all official IDs are acceptable
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
- CHECK IF AUDITED: Look for auditor's report, audit opinion, auditor signature
- COMMENT ON AUDIT STATUS but DO NOT reject based on audit status
- ACCEPT BOTH audited and unaudited financial statements
- FOCUS ON: Completeness of statements (Balance Sheet, Income Statement, Cash Flow), company name, period covered
`;
    }

    return `${customInstructions}
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
      'Industry Accreditations', 'COIDA Letter of Good Standing'
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
        "tax compliance": "Tax Clearance Certificate", // ✅ ADDED Tax Compliance Status
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
        "passport": "Certified IDs", // ✅ ADDED Passport
        "driver license": "Certified IDs", // ✅ ADDED Driver's License
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
        "coida": "COIDA Letter of Good Standing", // ✅ UPDATED to COIDA
        "program report": "Previous Program Reports",
        "cv": "CV", // ✅ ADDED CV
        "resume": "CV", // ✅ ADDED Resume as synonym for CV
        "curriculum vitae": "CV" // ✅ ADDED Curriculum Vitae
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
        if (lowerText.includes('cv') || lowerText.includes('resume') || lowerText.includes('curriculum vitae')) return "CV"; // ✅ ADDED CV DETECTION
        
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

        // ✅ FIXED: Don't override "incomplete" status - preserve all statuses from AI
        if (parsed.status === "wrong_type" || (!parsed.isValid && identifiedType !== docLabel)) {
          // SPECIAL CASE: Certified IDs should accept any ID type
          if (docLabel === "Certified IDs of Directors & Shareholders" && 
              (identifiedType.includes("ID") || identifiedType.includes("Passport") || identifiedType.includes("Driver"))) {
            userMessage = "ID document verified";
            status = "verified";
          } 
          // SPECIAL CASE: Tax Clearance should accept both names
          else if (docLabel === "Tax Clearance Certificate" && 
                   (identifiedType.includes("Tax Compliance") || identifiedType.includes("Tax Clearance"))) {
            userMessage = "Tax compliance document verified";
            status = "verified";
          }
          // SPECIAL CASE: CV should accept both CV and Resume
          else if (docLabel === "CV" && 
                   (identifiedType.includes("CV") || identifiedType.includes("Resume") || identifiedType.includes("Curriculum Vitae"))) {
            userMessage = "CV/Resume verified";
            status = "verified";
          }
          else {
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
          userMessage = "Document is incomplete - missing required elements"; // ✅ PRESERVE INCOMPLETE STATUS
          status = "incomplete";
        } else {
          userMessage = "Document verified";
          status = "verified";
        }
        
        return {
          isValid: true,
          status: status, // ✅ This now correctly shows "incomplete" when AI says incomplete
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
    
    // ✅ BETTER ERROR HANDLING
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

  // Start loading for AI validation
  setIsUploading(true);
  setIsOverlayVisible(true);

  try {
    const registeredName = await getRegisteredName();
    console.log("🏢 Registered Name for validation:", registeredName);
    
    const validationResult = await validateDocumentWithAI(docLabel, file, registeredName);
    console.log("AI validation result:", validationResult);

    if (!validationResult.isValid) {
      alert(`Validation failed: ${validationResult.message}`);
      setIsUploading(false);
      setIsOverlayVisible(false);
      return; // 
    }

    setRejectionReasons(prev => ({
      ...prev,
      [docLabel]: validationResult.rejectionReason
    }));

    // Check for warnings
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

    // ✅ ONLY IF VALIDATION PASSES, continue to Firebase upload
    const storage = getStorage();
    const documentId = getDocumentId(docLabel);
    const category = getDocumentCategory(docLabel);
    const storageRef = ref(storage, `universalProfiles/documents/${user.uid}/${documentId}.${fileExtension}`);

    const existingDocumentUrl = getDocumentURL(docLabel, profileData);
    const isUpdate = !!existingDocumentUrl;

    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    const profileRef = doc(db, "universalProfiles", user.uid);
    const unifiedPath = UNIFIED_DOCUMENT_PATHS[documentId];

    const timestampPath = `${unifiedPath}UpdatedAt`;

    const updateData = {
      [unifiedPath]: downloadURL,
      [timestampPath]: serverTimestamp(),
      [`verification.${documentId}`]: {
        status: validationResult.status,
        message: validationResult.message,
        lastChecked: serverTimestamp()
      }
    };

    // Only update profile-specific paths for profile documents
    if (category === DOCUMENT_CATEGORIES.PROFILE) {
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
        case 'bbbeeCert':
        case 'otherCerts':
        case 'industryAccreditationDocs':
          updateData[`legalCompliance.${documentId}`] = downloadURL;
          break;
        case 'companyProfile':
        case 'clientReferences':
          updateData[`productsServices.${documentId}`] = downloadURL;
          break;
        case 'cv': // ✅ ADDED CV PATH MAPPING
          updateData[`productsServices.${documentId}`] = downloadURL;
          break;
      }
    }

    await updateDoc(profileRef, updateData);
    setSubmittedDocuments((prev) => Array.from(new Set([...prev, docLabel])));
    
    const updatedProfileSnap = await getDoc(profileRef);
    if (updatedProfileSnap.exists()) {
      setProfileData(updatedProfileSnap.data());
    }
    
    // Success
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

// ✅ ADDED: Function to get document status for filtering
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
  const isSubmitted = submittedDocuments.includes(doc);
  const documentStatus = getDocumentStatus(doc); // ✅ ADDED STATUS CHECK
  
  // Big Score documents
  const bigScoreDocuments = [
    "Company Registration Certificate",
    "Tax Clearance Certificate",  
    "Certified IDs of Directors & Shareholders",
    "Share Register",
    "B-BBEE Certificate",
    "COIDA Letter of Good Standing",
    "Proof of Address",
    "Company Profile / Brochure"
  ];

  // Funding documents
  const fundingDocuments = [
    "5 Year Budget",
    "Bank Details Confirmation Letter", 
    "Financial Statements",
    "Previous Program Reports",
    "Loan Agreements",
    "Support Letters / Endorsements",
    "Impact Statements" 
  ];

  // ✅ NEW: Compliance Score documents
  const complianceDocuments = [
    "Company Registration Certificate",        // CIPC business registration
    "Tax Clearance Certificate",               // SARS tax compliance status
    "B-BBEE Certificate",                      // B-BBEE certification
    "COIDA Letter of Good Standing",           // UIF & COIDA registration
    "Certified IDs of Directors & Shareholders", // Verified Director IDs
    "Proof of Address",                        // Verified business address
    "Share Register",                          // Ownership and shareholding structure
    "Company Profile / Brochure"               // Complete business profile
    // Note: VAT registration is included in Tax Clearance Certificate
    // Note: POPIA compliance documentation is not in current document list
  ];

  // ✅ NEW: Legitimacy documents
  const legitimacyDocuments = [
    "Company Registration Certificate",
    "Tax Clearance Certificate",
    "B-BBEE Certificate",
    "COIDA Letter of Good Standing",
    "Industry Accreditations"
  ];

  // ✅ NEW: Leadership documents  
  const leadershipDocuments = [
    "Certified IDs of Directors & Shareholders",
    "Share Register",
    "Company Profile / Brochure",
    "Client References",
    "Support Letters / Endorsements",
    "CV" // ✅ ADDED CV TO LEADERSHIP DOCUMENTS
  ];

  // ✅ NEW: Governance documents
  const governanceDocuments = [
    "Share Register",
    "Audited Financials",
    "Financial Statements", 
    "Loan Agreements",
    "Guarantee/Contract"
  ];

  const capitalAppealDocuments = [
    "Financial Statements",           // Financial readiness & strength
    "Audited Financials",             // Financial strength & credibility  
    "5 Year Budget",                  // Financial projections
    "Business Plan",                  // Business strategy
    "Pitch Deck",                     // Investor presentation
    "Bank Details Confirmation Letter", // Financial reliability
    "Tax Clearance Certificate",      // Compliance
    "B-BBEE Certificate",             // Impact proof
    "Impact Statements",              // Social impact
    "Company Profile / Brochure",     // Operational strength
    "Industry Accreditations",        // Operational standards
    "Loan Agreements",                // Credit history
    "CV" // ✅ ADDED CV TO CAPITAL APPEAL DOCUMENTS
  ];

  // ✅ UPDATED FILTER LOGIC: Remove "submitted" and "pending", add status filter
  const matchFilter =
    filter === "all" ||
    (filter === "Big Score" && bigScoreDocuments.includes(doc)) ||
    (filter === "Funding" && fundingDocuments.includes(doc)) ||
    (filter === "Compliance" && complianceDocuments.includes(doc)) || 
    (filter === "Legitimacy" && legitimacyDocuments.includes(doc)) || 
    (filter === "Leadership" && leadershipDocuments.includes(doc)) || 
    (filter === "Governance" && governanceDocuments.includes(doc)) ||
    (filter === "Capital Appeal" && capitalAppealDocuments.includes(doc)); 

  // ✅ ADDED STATUS FILTER LOGIC
  const matchStatusFilter = 
    statusFilter === "all" ||
    (statusFilter === "pending" && !getDocumentURL(doc, profileData)) ||
    (statusFilter === "verified" && documentStatus === "verified") ||
    (statusFilter === "rejected" && 
      (documentStatus === "wrong_type" || documentStatus === "expired" || 
       documentStatus === "name_mismatch" || documentStatus === "incomplete")) ||
    (statusFilter === "uploaded" && getDocumentURL(doc, profileData) && documentStatus !== "verified");

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

    // Create update data that clears ALL document data including timestamps
    const updateData = {
      [`documents.${documentId}`]: null, // Clear document URL
      [`verification.${documentId}`]: null, // Clear verification status
      [`documents.${documentId}UpdatedAt`]: null // ✅ Clear unified timestamp
    };

    // Also clear from profile-specific paths for profile documents
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
          updateData[`legalCompliance.taxClearanceCert`] = null;
          updateData[`legalCompliance.taxClearanceCertUpdatedAt`] = null;
          break;
        case 'bbbeeCert':
          updateData[`legalCompliance.bbbeeCert`] = null;
          updateData[`legalCompliance.bbbeeCertUpdatedAt`] = null;
          break;
        case 'otherCerts':
          updateData[`legalCompliance.otherCerts`] = null;
          updateData[`legalCompliance.otherCertsUpdatedAt`] = null;
          break;
        case 'industryAccreditationDocs':
          updateData[`legalCompliance.industryAccreditationDocs`] = null;
          updateData[`legalCompliance.industryAccreditationDocsUpdatedAt`] = null;
          break;
        case 'companyProfile':
          updateData[`productsServices.companyProfile`] = null;
          updateData[`productsServices.companyProfileUpdatedAt`] = null;
          break;
        case 'clientReferences':
          updateData[`productsServices.clientReferences`] = null;
          updateData[`productsServices.clientReferencesUpdatedAt`] = null;
          break;
        case 'cv': // ✅ ADDED CV DELETE HANDLING
          updateData[`productsServices.cv`] = null;
          updateData[`productsServices.cvUpdatedAt`] = null;
          break;
      }
    }

    await updateDoc(profileRef, updateData);
    
    setSubmittedDocuments(prev => prev.filter(doc => doc !== docLabel));
    
    // Refresh profile data to ensure UI updates
    const updatedProfileSnap = await getDoc(profileRef);
    if (updatedProfileSnap.exists()) {
      setProfileData(updatedProfileSnap.data());
    }
    
    console.log(`Document ${docLabel} deleted successfully`);
    
  } catch (error) {
    console.error("Error deleting document:", error);
    alert('Failed to delete document. Please try again.');
  }
};

// ✅ ADDED BACK: renderDocumentLink function
const renderDocumentLink = (label) => {
  const documentId = getDocumentId(label);
  const url = profileData.documents?.[documentId] || getDocumentURL(label, profileData);
  
  // Check if URL exists and is not null/empty
  if (!url || url === null || url === '') {
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

 const getStatusBadge = (docLabel) => {
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

  // ✅ UPDATED: Show "incomplete" status when AI returns incomplete
  let backgroundColor = "#e8f5e8";
  let color = "#2e7d32";
  let statusText = "Uploaded";

  if (verification) {
    if (verification.status === "verified") {
      backgroundColor = "#e8f5e8";
      color = "#2e7d32";
      statusText = "Verified";
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
    } else if (verification.status === "incomplete") { // ✅ ADDED INCOMPLETE STATUS
      backgroundColor = "#fff3e0";
      color = "#ef6c00";
      statusText = "Incomplete";
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
              {/* ✅ UPDATED: Removed "submitted" and "pending", kept category filters */}
              {["all", "Big Score", "Compliance", "Legitimacy", "Leadership", "Governance", "Capital Appeal"].map((type) => (
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
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              {/* ✅ ADDED STATUS FILTER DROPDOWN */}
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setShowStatusFilter(!showStatusFilter)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 16px",
                    border: "2px solid #d7ccc8",
                    backgroundColor: "#faf8f6",
                    color: "#6d4c41",
                    borderRadius: "8px",
                    fontWeight: "500",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    minWidth: "140px"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#efebe9";
                    e.target.style.borderColor = "#a67c52";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#faf8f6";
                    e.target.style.borderColor = "#d7ccc8";
                  }}
                >
                  <Filter size={16} />
                  <span>Status: {statusFilter === "all" ? "All" : 
                                statusFilter === "pending" ? "Pending" :
                                statusFilter === "verified" ? "Verified" :
                                statusFilter === "rejected" ? "Rejected" : "Uploaded"}</span>
                </button>
                
                {showStatusFilter && (
                  <div style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: "8px",
                    backgroundColor: "white",
                    border: "2px solid #d7ccc8",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    zIndex: 1000,
                    minWidth: "160px"
                  }}>
                    {["all", "pending", "verified", "rejected", "uploaded"].map((status) => (
                      <div
                        key={status}
                        onClick={() => {
                          setStatusFilter(status);
                          setShowStatusFilter(false);
                        }}
                        style={{
                          padding: "12px 16px",
                          cursor: "pointer",
                          backgroundColor: statusFilter === status ? "#efebe9" : "white",
                          color: "#6d4c41",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          borderBottom: "1px solid #f5f2f0",
                          transition: "background-color 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = "#f5f2f0";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = statusFilter === status ? "#efebe9" : "white";
                        }}
                      >
                        {status === "all" ? "All Statuses" :
                         status === "pending" ? "Pending" :
                         status === "verified" ? "Verified" :
                         status === "rejected" ? "Rejected" : "Uploaded"}
                      </div>
                    ))}
                  </div>
                )}
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
                      {/* ✅ ADDED FILTER ICON TO STATUS HEADING */}
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
                
                // Get timestamp from unified path or legacy path
                updatedAt = profileData[`documents.${documentId}UpdatedAt`] || 
                          get(profileData, `${unifiedPath}UpdatedAt`) ||
                          get(profileData, `${DOCUMENT_PATHS[doc]}UpdatedAt`);

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
                      fontSize: "13px",
                      fontWeight: "10px",
                      color: "#6d4c41",
                      textAlign: "center",
                      verticalAlign: "middle",
                      backgroundColor: "transparent"
                    }}>
                      {(() => {
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
                      })()}
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
                        <td style={{ padding: "16px 20px", textAlign: "center" }}>
                                              {rejectionReasons[doc] && (
                        <div style={{ color: "red", fontSize: "12px" }}>
                          {rejectionReasons[doc]}
                        </div>
                      )}
                                              
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