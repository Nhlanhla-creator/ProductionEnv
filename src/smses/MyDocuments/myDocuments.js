import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getDoc, doc, updateDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth } from "../../firebaseConfig";
import { FileText, ExternalLink, Upload, Filter, ChevronDown, ChevronUp, Trash2, Plus, Minus } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { GoogleGenAI } from "@google/genai";
import { 
  getDocumentId, 
  UNIFIED_DOCUMENT_PATHS,
  getDocumentCategory,
  DOCUMENT_CATEGORIES
} from "../../utils/documentMapping";
import { useDocumentSync } from "../../components/useDocumentSync";
import { 
  uploadDocumentWithSync, 
  deleteDocumentWithSync,
  getDocumentUrlFromAnyLocation,
  getSyncConfig
} from "../../utils/documentSyncService";

const ai = new GoogleGenAI({ 
  apiKey: "AIzaSyA3AIJgagmVwL930v9CO56i3M45Gq0usPI"
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
  "Company Letterhead",
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
  const [expandedClientReferences, setExpandedClientReferences] = useState(false);
  const [expandedGuarantees, setExpandedGuarantees] = useState(false);
  const [expandedAccreditations, setExpandedAccreditations] = useState(false);
  const [expandedLoanAgreements, setExpandedLoanAgreements] = useState(false);
  const [activeSection, setActiveSection] = useState('documents');

  // Use the synchronization hook
  useDocumentSync(setSubmittedDocuments, setProfileData, null);

  const checkSubmittedDocs = (documents, data) => {
    return documents.filter(docLabel => {
      const url = getDocumentUrlFromAnyLocation(docLabel, data);
      return !!(url && url !== null && url !== '');
    });
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profileRef = doc(db, "universalProfiles", user.uid);
          
          const unsubscribeSnapshot = onSnapshot(profileRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setProfileData(data);
              const submitted = checkSubmittedDocs(DOCUMENTS, data);
              setSubmittedDocuments(submitted);
            }
            setLoading(false);
          });

          return () => unsubscribeSnapshot(); 
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

  // Add this useEffect to MyDocuments component
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showStatusFilter && !event.target.closest('th')) {
        setShowStatusFilter(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showStatusFilter]);
  
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

const validateDocumentWithAI = async (docLabel, file, registeredName) => {
  // Helper function for name similarity (inside the function to avoid global scope)
  const calculateNameSimilarity = (name1, name2) => {
    if (!name1 || !name2) return 0;
    
    const normalize = (str) => {
      return str.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special chars
        .replace(/\b(pty|ltd|limited|cc|inc|incorporation|and|&)\b/g, '') // Remove common suffixes
        .replace(/\s+/g, ' ')
        .trim();
    };
    
    const normalized1 = normalize(name1);
    const normalized2 = normalize(name2);
    
    // Get core words (skip common words)
    const words1 = normalized1.split(' ').filter(w => w.length > 2);
    const words2 = normalized2.split(' ').filter(w => w.length > 2);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    // Count matching words
    let matches = 0;
    for (const word of words1) {
      if (words2.some(w => w.includes(word) || word.includes(w))) {
        matches++;
      }
    }
    
    // Calculate similarity percentage
    const similarity = (matches / Math.max(words1.length, words2.length)) * 100;
    return similarity;
  };

  // Document validation rules (flexible version)
  const documentValidationRules = {
    "5 Year Budget": {
      requiredElements: [
        "Financial projections covering multiple years",
        "Income statement or revenue projections",
        "Expense or cost projections"
      ],
      strictChecks: ["covers_approximately_5_years", "has_financial_projections"],
      skipNameCheck: true // Budgets don't need name check
    },
    "Bank Confirmation Letter": {
  requiredElements: [
    "Bank name clearly stated",
    "Account holder name",
    "Account number",
    "Date (statement date or issue date)",  // More flexible
    "Bank details (branch code or account type optional)"
  ],
  strictChecks: ["has_account_number", "shows_valid_south_african_bank", "has_account_holder's_name"]
},
 "B-BBEE Certificate": {
  requiredElements: [
    "B-BBEE level or exemption status (1-8 or Exempted)",
    "Company name",
    "Issue date",
    "Expiry date or validity period",
    "ACCEPT BOTH: Formal certificates AND sworn affidavits",
    "FORMAL CERTIFICATES MUST HAVE: Accredited verification agency name or SANAS accreditation",
    "SWORN AFFIDAVITS MUST HAVE: Commissioner of Oaths stamp and signature",
    "ACCEPT MULTI-PAGE DOCUMENTS: Even if other certificates are included"
  ],
  strictChecks: ["has_bbbee_status", "not_expired", "has_valid_issuing_body"]
},

    "Business Plan": {
      requiredElements: [
        "Business description",
        "Market analysis", 
        "Financial projections"
      ],
      strictChecks: ["has_business_description", "has_market_analysis", "has_financials"],
      skipNameCheck: true
    },
   "IDs of Directors & Shareholders": {
  requiredElements: [
    "ID document",
    "Photograph",
    "ID number"
  ],
  strictChecks: ["has_photo", "has_id_number", "is_official_id"],
  skipNameCheck: true // Don't check names
},
    "Client references / Support Letters": {
      requiredElements: [
        "Client company name",
        "Description of services",
        "Contact details"
      ],
      strictChecks: ["has_client_details", "describes_services", "has_contact"],
      skipNameCheck: true // References are about client, not company
    },
    "Company Profile / Brochure": {
      requiredElements: [
        "Company name",
        "Description of business",
        "Contact information"
      ],
      strictChecks: ["has_company_name", "has_description", "has_contact_info"],
      nameThreshold: 40
    },
    "Company Registration Certificate": {
      requiredElements: [
        "Company registration number",
        "Registered company name",
        "Official issuance"
      ],
      strictChecks: ["has_registration_number", "matches_company_name_flexible", "from_cipc"],
      nameThreshold: 40
    },
    "COIDA Letter of Good Standing": {
      requiredElements: [
        "Issued by Compensation Fund",
        "Letter of Good Standing title", 
        "Employer reference number",
        "Company name that matches your registered company",
        "Good Standing status confirmation",
        "Issue date",
        "ACCEPT MULTI-PAGE DOCUMENTS: Even if other COIDA documents are included"
      ],
      strictChecks: ["issued_by_compensation_fund", "has_employer_reference", "shows_good_standing", "company_name_matches"]
    },
    "CV": {
      requiredElements: [
        "Person's name",
        "Work experience",
        "Education or qualifications"
      ],
      strictChecks: ["has_work_experience", "has_education", "is_cv"],
      skipNameCheck: true // CVs are personal
    },
      "Financial Statements": {
      requiredElements: [
        "Financial figures (revenue, expenses, or balances)",
        "Company name",
        "Period covered",
        "ACCEPT BOTH: Audited AND Unaudited financial statements",
        "ACCEPT BOTH: Full statements AND management accounts",
        "ACCEPT MULTI-PAGE DOCUMENTS: Even if other documents are included"
      ],
      strictChecks: ["has_financials", "has_company_name", "has_period"]
    },
    "Guarantee/Contract": {
  requiredElements: [
    "Contract/Agreement title",
    "Parties involved clearly defined",
    "Terms and obligations specified",
    "Duration or effective date",
    "ACCEPT BOTH: Signed AND unsigned agreements (if parties and terms are clear)",
    "ACCEPT MULTI-PAGE DOCUMENTS: Even if terms and conditions are included"
  ],
  strictChecks: ["has_parties", "has_terms", "has_dates"]
},
    "Industry Accreditations": {
      requiredElements: [
        "Issuing body",
        "Company name",
        "Accreditation details"
      ],
      strictChecks: ["has_issuing_body", "matches_company_name_flexible", "has_accreditation"],
      nameThreshold: 40
    },
    "Loan Agreements": {
      requiredElements: [
        "Parties involved",
        "Loan amount",
        "Signatures"
      ],
      strictChecks: ["has_loan_amount", "has_parties", "has_signatures"],
      skipNameCheck: true
    },
    "Pitch Deck": {
      requiredElements: [
        "Business concept",
        "Market opportunity",
        "Team information"
      ],
      strictChecks: ["has_business_concept", "has_market_info", "has_team_info"],
      skipNameCheck: true
    },
   "Proof of Address": {
  requiredElements: [
    "Full name and physical address",
    "Date (reasonably recent - within 6 months)",
    "Issuer name (utility, bank, municipality, etc.)",
    "Reference or account number",
  ],
  strictChecks: ["recent_issue_date", "matches_applicant_name", "has_physical_address"]
},
"Share Register": {
  requiredElements: [
    "Company name",                    // MUST have
    "Shareholder names",               // MUST have  
    "Share quantities or percentages", // MUST have
    "ACCEPT BOTH: Formal registers AND simple shareholder lists",
    "ACCEPT BOTH: Signed documents AND unsigned extracts",
    "ACCEPT MULTI-PAGE DOCUMENTS: Even if other company documents are included"
  ],
  strictChecks: ["has_shareholders", "has_share_details", "matches_company_name"], // Keep this
  nameThreshold: 40 // 
},
    "Tax Clearance Certificate": {
  requiredElements: [
    "Issued by South African Revenue Service (SARS)",
    "Tax Reference Number",
    "Taxpayer Name",
    "Compliance status (Good Standing or Compliant)",
    "ACCEPT BOTH: Tax Clearance Certificate AND Tax Compliance Status",
    "ACCEPT MULTI-PAGE DOCUMENTS: Even if other tax documents are included"
  ],
  criticalChecks: ["has_tax_reference_number", "issued_by_sars", "valid_clearance_status"]
},
  };

 const createStrictPrompt = (docLabel, rules, registeredName) => { 
  let customInstructions = "";
  
  // Special handling for specific document types
  if (docLabel === "Company Registration Certificate") {
    customInstructions = `SPECIAL INSTRUCTIONS FOR REGISTRATION CERTIFICATES:
- ✅ ACCEPT ANY VARIATION: COR14.3, Certificate of Incorporation, CIPC Certificate, CK1, CK2
- ✅ COMMON VARIATIONS TO ACCEPT: "COR14.3", "CoR 14.3", "Certificate of Incorporation", "Registration Certificate"
`;
  }
  
  if (docLabel === "B-BBEE Certificate") {
    customInstructions = `SPECIAL INSTRUCTIONS FOR B-BBEE DOCUMENTS:
- ACCEPT BOTH: Traditional B-BBEE Certificates AND Exemption Affidavits for micro-enterprises
- EXEMPTION AFFIDAVITS MUST CONTAIN: Clear 'Exemption Affidavit' or 'Micro Enterprise' title, Commissioner of Oaths stamp, turnover declaration below R10 million
- CERTIFICATES MUST CONTAIN: B-BBEE level (1-8), issued by accredited agency, expiry date
- BOTH DOCUMENT TYPES ARE VALID for different business sizes
- FORMAL CERTIFICATES MUST HAVE: Accredited verification agency name or SANAS accreditation
- SWORN AFFIDAVITS MUST HAVE: Commissioner of Oaths stamp and signature
`;
  }

  if (docLabel === "Company Letterhead") {
    customInstructions = `SPECIAL INSTRUCTIONS FOR COMPANY LETTERHEAD:
- ✅ ACCEPT ANY OFFICIAL BUSINESS STATIONERY: Letterhead, business letter, official company paper
- ✅ COMPANY LOGO: Optional - accept even if logo is missing
- ✅ REGISTRATION NUMBER: Optional - not always required on letterhead
- ✅ DATE: Optional - letterhead may or may not have a date
- ✅ MINIMAL REQUIREMENTS: Company name + at least one contact method (phone, email, address, or website)
- ✅ DESIGN: Must look like official business stationery (not plain paper)
- ✅ REJECT: Plain blank paper without company branding
- ✅ ACCEPT MULTIPLE FORMATS: Single-page letters, multi-page documents, scanned stationery
- ✅ MATCHING COMPANY NAME: Should contain or match "${registeredName}" (be flexible with abbreviations)
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
- FOCUS ON: SARS issuance, tax reference number, company name, compliance status
- EXPIRY DATE: Check if present, but focus on "compliant" status
- DO NOT REJECT based on document title variation
`;
  }

  if (docLabel === "Financial Statements") { 
    customInstructions = `SPECIAL INSTRUCTIONS FOR FINANCIAL STATEMENTS:
- ACCEPT BOTH: Audited AND Unaudited financial statements
- ACCEPT BOTH: Full statements AND management accounts
- ACCEPT MULTI-PAGE DOCUMENTS: Even if the PDF contains other documents
- FOCUS ON: Finding financial figures anywhere in the document
- DO NOT REJECT if other documents are included in the same PDF
- CHECK ALL PAGES: Scan entire document for financial content
- IF FINANCIAL INFORMATION FOUND: Return status "verified" regardless of audit status
- IF NOT AUDITED: Return status "verified:not_audited" with appropriate message
- AUDITED DOCUMENTS MUST CONTAIN: "auditor", "audit report", or "audit opinion" keywords
- KEY ELEMENTS TO LOOK FOR: Revenue, expenses, assets, liabilities, profit/loss
`;
  }

  if (docLabel === "Proof of Address") {
    customInstructions = `SPECIAL INSTRUCTIONS FOR PROOF OF ADDRESS:
- ACCEPT ANY OFFICIAL DOCUMENT: Utility bill, bank statement, municipal letter, lease agreement
- DATE REQUIREMENT: Should be within last 6 months (flexible)
- FOCUS ON: Full physical address and name matching
- DO NOT REJECT for missing stamps or letterheads
`;
  }

  if (docLabel === "Bank Confirmation Letter") {
    customInstructions = `SPECIAL INSTRUCTIONS FOR BANK DOCUMENTS:
- ACCEPT BOTH: Formal confirmation letters AND bank statements
- FOCUS ON: Account number, bank name, account holder name
- BRANCH CODE & ACCOUNT TYPE: Optional - don't reject if missing
- DATE: Statement date or letter date is sufficient
`;
  }
if (docLabel === "Share Register") {
  customInstructions = `SPECIAL INSTRUCTIONS FOR SHARE REGISTER:
- ACCEPT BOTH: Formal registers AND simple shareholder lists
- ACCEPT BOTH: Signed documents AND unsigned extracts
- FOCUS ON: Shareholder names and share quantities/percentages
- CERTIFICATE NUMBERS & SIGNATURES: Optional - don't reject if missing

🔴 CRITICAL - COMPANY NAME MUST MATCH:
- Extract the company name from the share register
- Compare with "${registeredName}"
- If company name is different → REJECT with "name_mismatch"
- Do NOT accept share registers from other companies
`;
}

  if (docLabel === "Guarantee/Contract") {
    customInstructions = `SPECIAL INSTRUCTIONS FOR CONTRACTS:
- ACCEPT BOTH: Signed AND unsigned agreements
- FOCUS ON: Parties involved, terms and conditions, effective date
- SIGNATURES: Preferred but not mandatory for validation
- DURATION: Should be specified or implied
`;
  }

  // Add this special instruction for COIDA right after your other special instructions:
if (docLabel === "COIDA Letter of Good Standing") {
  customInstructions = `CRITICAL - COIDA LETTER VALIDATION RULES:
  
🔴 YOU MUST EXTRACT AND RETURN:
- The company name found on the COIDA letter
- Compare it with "${registeredName}"

🔴 RESPONSE MUST INCLUDE:
"extractedCompanyName": "the name you found on the document"

🔴 REJECT IF:
- Extracted name doesn't match "${registeredName}" (allow flexible matching)
- No company name found on the document
`;
}

  // Special handling for CVs - complete override
  if (docLabel === "CV") {
    return `ANALYZE THE UPLOADED DOCUMENT FILE:

DOCUMENT VALIDATION FOR: CV

IMPORTANT - CV VALIDATION RULES:
1. 🔴 THIS IS A CV - DO NOT CHECK COMPANY NAME
2. 🔴 CVs are personal documents - they will NOT contain "${registeredName}"
3. 🔴 ONLY validate that this is a legitimate CV/resume

REQUIRED ELEMENTS:
- Person's full name
- Work experience with dates
- Educational background
- Skills or competencies

ACCEPT IF:
- Document is a CV, resume, or curriculum vitae
- Contains personal details and work history
- Shows education or qualifications

REJECT IF:
- Document is not a CV (e.g., company document, ID, certificate)
- No work experience or education section
- Appears to be a company document

RESPOND WITH:
{
  "isValid": true/false,
  "status": "verified" | "wrong_type" | "incomplete",
  "identifiedDocumentType": "What you detected",
  "message": "Brief validation result",
  "warnings": []
}`;
  }

  // PRIORITIZATION SYSTEM - Add this after special instructions
  const prioritizationRules = `VALIDATION PRIORITY LEVELS - CRITICAL TO UNDERSTAND:

🔴 LEVEL 1 - MUST HAVE (Hard Requirements - REJECT IF MISSING):
- Document type must be correct or serve the same purpose
- Company name in document MUST match "${registeredName}" (for company documents)
  → Extract the actual company name from the document text
  → Compare with registered name
  → If different company found → REJECT
- Document must not be expired (for certificates with expiry dates)

🟡 LEVEL 2 - SHOULD HAVE (Important but flexible - ACCEPT WITH WARNING IF MISSING):
- Most required elements should be present, but missing 1-2 is acceptable
- Formatting can vary (audited/unaudited, certified/uncertified, formal/informal)
- Dates should be recent but not strictly enforced (within 6 months for proof of address)
- Signatures on contracts (preferred but not mandatory)

🟢 LEVEL 3 - NICE TO HAVE (Ignore completely if missing - NEVER REJECT FOR THESE):
- Branch codes, certificate numbers, specific stamps/logos (except Commissioner stamps on affidavits)
- "Professional certifications" on CVs, "Certificate numbers" on share registers
- Exact document titles - variations like "COR14.3", "Tax Compliance Status" are fine
- SANAS logos, accreditation numbers (except for formal B-BBEE certificates)
- Account type on bank statements

DECISION RULES:
- If ALL Level 1 requirements are met → ACCEPT the document
- If Level 1 requirements are met but some Level 2 are missing → ACCEPT with warning
- If ANY Level 1 requirement fails → REJECT the document
- Level 3 items should NEVER cause a rejection
`;

  // FLEXIBILITY GUIDELINES
  const flexibilityGuidelines = `FLEXIBILITY GUIDELINES:
- ✅ ACCEPT DOCUMENT VARIATIONS: Different names for the same document are acceptable
- ✅ ACCEPT MULTI-PAGE DOCUMENTS: Even if other documents are included in the same PDF
- ✅ SCAN ALL PAGES: Check the entire document thoroughly
- ✅ IF FOUND ANYWHERE: Consider it valid, regardless of other content
- ✅ BE PRACTICAL: The goal is to verify the document exists, not to enforce strict formatting
`;

  // UNIVERSAL INSTRUCTIONS
  const universalInstructions = `UNIVERSAL DOCUMENT VALIDATION RULES:
- ✅ SCAN ALL PAGES: Check every page of the uploaded document
- ✅ ACCEPT MULTI-PAGE DOCUMENTS: Even if other documents are included in the same PDF
- ✅ IF THE REQUIRED DOCUMENT IS FOUND ON ANY PAGE: Return status "verified"
- ✅ DO NOT REJECT just because there are other documents in the same file
- ✅ FOCUS ON: Finding the required ${docLabel} anywhere in the document
`;

  return `${customInstructions}
${prioritizationRules}
${flexibilityGuidelines}
${universalInstructions}

ANALYZE THE UPLOADED DOCUMENT FILE:

DOCUMENT VALIDATION FOR: ${docLabel}

CRITICAL CHECKS:
1. 🔴 DOCUMENT TYPE: Must be ${docLabel} or an accepted variation
2. 🔴 COMPANY NAME VERIFICATION: 
   - Extract the company name FROM THE DOCUMENT CONTENT
   - Compare it with "${registeredName}"
   - They must match (flexible matching allowed for Pty Ltd variations)
   - If the document shows a DIFFERENT company name → REJECT with "name_mismatch"
   - Do NOT guess or assume - actually check the content
3. 🔴 EXPIRY DATE: Check for expiry if applicable (current year: 2025)
4. 🔴 COMPLETENESS: Apply Priority Levels above when evaluating

REQUIRED ELEMENTS (mix of Level 1, 2, and 3):
${rules.requiredElements.map(item => `- ${item}`).join('\n')}

Apply the Priority Levels above when evaluating this document. Remember:
- Level 1 items MUST be present
- Level 2 items SHOULD be present (accept if 1-2 missing)
- Level 3 items are NICE TO HAVE (ignore if missing)

RESPOND WITH:
{
  "isValid": true/false,
  "status": "verified" | "verified:not_audited" | "wrong_type" | "name_mismatch" | "expired" | "incomplete",
  "extractedCompanyName": "name from document", // ADD THIS
  "identifiedDocumentType": "What you detected the uploaded file to be",
  "message": "Brief validation result",
  "missingLevel1Elements": [],
  "warnings": []
}
`;
};
  try {
    const rules = documentValidationRules[docLabel] || {
      requiredElements: ["Document must be valid and complete"],
      skipNameCheck: true
    };
    
    const validationPrompt = createStrictPrompt(docLabel, rules, registeredName);

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

    const parseDetailedResponse = (responseText, docLabel) => {
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          
          // Special handling for CVs - if it looks like a CV, accept it
          if (docLabel === "CV" && 
              (parsed.identifiedDocumentType?.toLowerCase().includes("cv") ||
               parsed.identifiedDocumentType?.toLowerCase().includes("resume") ||
               parsed.identifiedDocumentType?.toLowerCase().includes("curriculum"))) {
            return {
              isValid: true,
              status: "verified",
              message: "CV verified",
              warnings: []
            };
          }
          
          let userMessage;
          let status = parsed.status;
          
          if (parsed.status === "wrong_type") {
            userMessage = `Please upload a ${docLabel} document`;
            status = "wrong_type";
          } else if (parsed.status === "name_mismatch") {
            userMessage = "Company name does not match your registered name";
            status = "name_mismatch";
          } else if (parsed.status === "incomplete") {
            userMessage = "Document is incomplete - missing required elements";
            status = "incomplete";
          } else {
            userMessage = "Document verified";
            status = "verified";
          }
          
          return {
            isValid: parsed.isValid,
            status: status,
            message: userMessage,
            warnings: parsed.warnings || []
          };
        }
        
        // Fallback - be more accepting for CVs
        if (docLabel === "CV") {
          return {
            isValid: true,
            status: "verified",
            message: "CV verified",
            warnings: []
          };
        }
        
        const lowerText = responseText.toLowerCase();
        if (lowerText.includes('false') || lowerText.includes('invalid') || lowerText.includes('reject')) {
          return {
            isValid: false,
            status: "wrong_type",
            message: `Please upload a ${docLabel} document`,
            warnings: []
          };
        }
        
        return {
          isValid: true,
          status: "verified", 
          message: "Document verified",
          warnings: []
        };
        
      } catch (error) {
        // On parse error, be more accepting for CVs
        if (docLabel === "CV") {
          return {
            isValid: true,
            status: "verified",
            message: "CV verified",
            warnings: []
          };
        }
        
        return {
          isValid: false,
          status: "rejected",
          message: "Validation error",
          warnings: []
        };
      }
    };

    return parseDetailedResponse(response.text, docLabel);
    
  } catch (error) {
    console.error("AI validation failed:", error);
    
    // For CVs, be forgiving on network errors
    if (docLabel === "CV") {
      return {
        isValid: true,
        status: "verified",
        message: "CV accepted",
        warnings: []
      };
    }
    
    // Throw network error to prevent document upload
    throw new Error("Network error - please check your connection and try again");
  }
};


  const getMultipleDocumentData = (docLabel, profileData) => {
    const documentId = getDocumentId(docLabel);
    
    const multiUploadDocuments = [
      "IDs of Directors & Shareholders",
      "Client references / Support Letters",
      "Guarantee/Contract",
      "Industry Accreditations",
      "Loan Agreements"
    ];
    
    if (multiUploadDocuments.includes(docLabel)) {
      const multipleDocs = profileData.documents?.[`${documentId}_multiple`] || [];
      
      if (multipleDocs.length === 0) {
        const singleUrl = getDocumentUrlFromAnyLocation(docLabel, profileData);
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
    }
    
    if (docLabel === "CV") {
      const regularCVs = profileData.documents?.cv_multiple || [];
      const ownershipCVs = profileData.documents?.cv_multiple || [];
      
      const allCVs = [...regularCVs, ...ownershipCVs];
      const uniqueCVs = allCVs.filter((cv, index, self) => 
        index === self.findIndex(c => c.url === cv.url)
      );
      
      return uniqueCVs;
    }
    
    const url = getDocumentUrlFromAnyLocation(docLabel, profileData);
    if (url) {
      return [{
        url: url,
        status: "verified",
        message: `${docLabel} verified`,
        uploadedAt: profileData.documents?.[`${documentId}UpdatedAt`]?.seconds ? 
          new Date(profileData.documents[`${documentId}UpdatedAt`].seconds * 1000).toISOString() : 
          new Date().toISOString()
      }];
    }
    
    return [];
  };

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
      
      // Store validation result for display in notes (only if validation succeeded)
      setValidationResults(prev => ({
        ...prev,
        [docLabel]: validationResult
      }));

      if (!validationResult.isValid) {
        // Upload the document but mark it as rejected
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
        return;
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
        // Show alert only - no document should be uploaded or status shown
        alert(error.message || "Network error - please try again");
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
      
      const docToDelete = currentDocs[displayIndex];
      
      if (!docToDelete) {
        alert("Document not found!");
        return;
      }

      if (docLabel === "CV" && docToDelete.source === "ownership_management") {
        const updatedDocs = currentDocs.filter((doc, i) => {
          if (doc.source === "ownership_management" && doc.directorIndex !== undefined) {
            return doc.directorIndex !== docToDelete.directorIndex;
          }
          if (doc.source === "ownership_management" && doc.executiveIndex !== undefined) {
            return doc.executiveIndex !== docToDelete.executiveIndex;
          }
          return i !== displayIndex;
        });

        const updateData = {
          [`documents.cv_multiple`]: updatedDocs,
          [`documents.cv_multiple_updated`]: serverTimestamp(),
          [`documents.cv_count`]: updatedDocs.length
        };

        await updateDoc(profileRef, updateData);
        
        if (docToDelete.directorIndex !== undefined) {
          console.log("Director CV should be deleted from ownership management too");
        }
      } else {
        const updatedDocs = currentDocs.filter((_, i) => i !== displayIndex);
        
        const updateData = {
          [`documents.${documentId}_multiple`]: updatedDocs,
          [`documents.${documentId}_multiple_updated`]: serverTimestamp(),
          [`documents.${documentId}_count`]: updatedDocs.length
        };

        await updateDoc(profileRef, updateData);
      }
      
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
        status: "pending", // Changed from "pending" to be consistent
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

const renderIndividualDocumentActions = (docLabel, docIndex, doc) => {
  // For CVs from ownership management, show delete button only
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
  
  if (docLabel === "CV") {
    return (
      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
        <label style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 12px",
          backgroundColor: "#d3d3d3",
          color: "#666", 
          borderRadius: "6px",
          fontSize: "11px",
          fontWeight: "600",
          cursor: "not-allowed", 
          opacity: 0.6 
        }}>
          <Upload size={12} />
          Upload
        </label>
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
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              handleIndividualDocumentUpload(docLabel, file, docIndex);
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
    const multiUploadDocuments = [
      "IDs of Directors & Shareholders", 
      "Client references / Support Letters",
      "Guarantee/Contract",
      "Industry Accreditations",
      "Loan Agreements"
    ];
    
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

      const getExpandedState = () => {
        switch(label) {
          case "IDs of Directors & Shareholders":
            return { isExpanded: expandedIDs, setExpanded: setExpandedIDs };
          case "Client references / Support Letters":
            return { isExpanded: expandedClientReferences, setExpanded: setExpandedClientReferences };
          case "Guarantee/Contract":
            return { isExpanded: expandedGuarantees, setExpanded: setExpandedGuarantees };
          case "Industry Accreditations":
            return { isExpanded: expandedAccreditations, setExpanded: setExpandedAccreditations };
          case "Loan Agreements":
            return { isExpanded: expandedLoanAgreements, setExpanded: setExpandedLoanAgreements };
          default:
            return { isExpanded: false, setExpanded: () => {} };
        }
      };

      const { isExpanded, setExpanded } = getExpandedState();
      const documentName = label.split('/')[0].trim();

      return (
        <div style={{ textAlign: "center" }}>
          <span style={{
            color: "#5d4037",
            fontSize: "12px",
            fontWeight: "500"
          }}>
            {allDocs.filter(doc => doc.url && doc.url !== "").length} {documentName}{allDocs.filter(doc => doc.url && doc.url !== "").length !== 1 ? 's' : ''} uploaded
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
              {isExpanded ? "Hide" : "Show"} {documentName}
            </button>
          </div>
        </div>
      );
    }

    if (label === "CV") {
      const allDocs = getMultipleDocumentData(label, profileData);
      const hasDocuments = allDocs.some(doc => doc.url && doc.url !== "");
      
      if (!hasDocuments) {
        return (
          <span style={{
            color: "#8d6e63",
            fontSize: "12px",
            fontStyle: "italic"
          }}>
            No CVs uploaded
          </span>
        );
      }

      return (
        <div style={{ textAlign: "center" }}>
          <span style={{
            color: "#5d4037",
            fontSize: "12px",
            fontWeight: "500"
          }}>
            {allDocs.filter(doc => doc.url && doc.url !== "").length} CV{allDocs.filter(doc => doc.url && doc.url !== "").length !== 1 ? 's' : ''} uploaded
          </span>
          <div style={{ marginTop: "4px" }}>
            <button
              onClick={() => setExpandedCVs(!expandedCVs)}
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
              {expandedCVs ? <Minus size={10} /> : <Plus size={10} />}
              {expandedCVs ? "Hide" : "Show"} CVs
            </button>
          </div>
        </div>
      );
    }

    const url = getDocumentUrlFromAnyLocation(label, profileData);
    
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
      // Store error in validation results for display in notes
      setValidationResults(prev => ({
        ...prev,
        [docLabel]: {
          isValid: false,
          status: "rejected",
          message: `Invalid file type. Please upload only PDF or Image files (.pdf, .jpg, .jpeg, .png)`,
          warnings: []
        }
      }));
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      // Store error in validation results for display in notes
      setValidationResults(prev => ({
        ...prev,
        [docLabel]: {
          isValid: false,
          status: "rejected",
          message: `File size exceeds 10MB limit. Please upload a smaller file.`,
          warnings: []
        }
      }));
      return;
    }

    setIsUploading(true);
    setIsOverlayVisible(true);

    try {
      const registeredName = await getRegisteredName();
      const validationResult = await validateDocumentWithAI(docLabel, file, registeredName);

      // Always store validation result for display in notes
      setValidationResults(prev => ({
        ...prev,
        [docLabel]: validationResult
      }));

      // Remove the alert - validation result will show in Notes column
      if (validationResult.warnings && validationResult.warnings.length > 0) {
        // Store warnings but don't show alert
        console.log("Document has warnings:", validationResult.warnings);
      }

      const storage = getStorage();
      const documentId = getDocumentId(docLabel);
      
      const fileName = `${documentId}.${fileExtension}`;
      const storageRef = ref(storage, `universalProfiles/documents/${user.uid}/${fileName}`);

      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // ✅ Use sync service for upload
      await uploadDocumentWithSync(docLabel, downloadURL, validationResult);
      
      setSubmittedDocuments((prev) => Array.from(new Set([...prev, docLabel])));
      
      const profileRef = doc(db, "universalProfiles", user.uid);
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
        // Show alert only - no document should be uploaded
        alert(error.message || "Network error - please try again");
      }, 300);
    }
  };

 const getDocumentStatus = (docLabel) => {
  const multiUploadDocuments = [
    "IDs of Directors & Shareholders",
    "Client references / Support Letters",
    "Guarantee/Contract",
    "Industry Accreditations",
    "Loan Agreements"
  ];
  
  // Handle multi-upload documents
  if (multiUploadDocuments.includes(docLabel)) {
    const allDocs = getMultipleDocumentData(docLabel, profileData);
    const uploadedDocs = allDocs.filter(doc => doc.url && doc.url !== "");
    
    if (uploadedDocs.length === 0) {
      return "pending";
    }
    
    // Check for any rejected/expired documents
    const hasRejected = uploadedDocs.some(doc => 
      doc.status === "wrong_type" || 
      doc.status === "name_mismatch" || 
      doc.status === "incomplete" || 
      doc.status === "rejected" ||
      doc.status === "expired"
    );
    
    if (hasRejected) {
      return "rejected";
    }
    
    // Check if all are verified
    if (uploadedDocs.every(doc => 
      doc.status === "verified" || doc.status === "verified:not_audited"
    )) {
      return "verified";
    }
    
    return "pending";
  }
  
  // Handle CV separately
  if (docLabel === "CV") {
    const allDocs = getMultipleDocumentData(docLabel, profileData);
    const uploadedDocs = allDocs.filter(doc => doc.url && doc.url !== "");
    
    if (uploadedDocs.length === 0) {
      return "pending";
    }
    
    const hasRejected = uploadedDocs.some(doc => 
      doc.status === "wrong_type" || 
      doc.status === "name_mismatch" || 
      doc.status === "incomplete" || 
      doc.status === "rejected" ||
      doc.status === "expired"
    );
    
    if (hasRejected) {
      return "rejected";
    }
    
    if (uploadedDocs.every(doc => 
      doc.status === "verified" || doc.status === "verified:not_audited"
    )) {
      return "verified";
    }
    
    return "pending";
  }
  
  // Handle single upload documents
  const documentId = getDocumentId(docLabel);
  const url = getDocumentUrlFromAnyLocation(docLabel, profileData);
  const verification = profileData.verification?.[documentId];
  
  if (!url) {
    return "pending";
  }
  
  if (!verification) {
    return "pending";
  }
  
  if (verification.status === "verified" || verification.status === "verified:not_audited") {
    return "verified";
  } else {
    return "rejected"; // Any non-verified status (expired, wrong_type, etc.) is rejected
  }
};

  // This function checks if a multi-upload document has ANY individual document matching the status filter
  const hasDocumentMatchingStatusFilter = (docLabel, statusFilter) => {
    const multiUploadDocuments = [
      "IDs of Directors & Shareholders",
      "Client references / Support Letters",
      "Guarantee/Contract",
      "Industry Accreditations",
      "Loan Agreements"
    ];
    
    if (!multiUploadDocuments.includes(docLabel) && docLabel !== "CV") {
      // For single documents, just check the overall status
      return getDocumentStatus(docLabel) === statusFilter;
    }
    
    const allDocs = getMultipleDocumentData(docLabel, profileData);
    
    if (statusFilter === "pending") {
      // Check if any document has no URL (pending)
      return allDocs.some(doc => !doc.url || doc.url === "");
    }
    
    if (statusFilter === "expired") {
      return allDocs.some(doc => doc.url && doc.url !== "" && doc.status === "expired");
    }
    
    if (statusFilter === "rejected") {
      return allDocs.some(doc => 
        doc.url && doc.url !== "" && (
          doc.status === "wrong_type" || 
          doc.status === "name_mismatch" || 
          doc.status === "incomplete" || 
          doc.status === "rejected"
        )
      );
    }
    
    if (statusFilter === "verified") {
      return allDocs.some(doc => 
        doc.url && doc.url !== "" && (
          doc.status === "verified" || doc.status === "verified:not_audited"
        )
      );
    }
    
    if (statusFilter === "uploaded") {
      return allDocs.some(doc => 
        doc.url && doc.url !== "" && !(
          doc.status === "verified" || 
          doc.status === "verified:not_audited" ||
          doc.status === "wrong_type" || 
          doc.status === "name_mismatch" || 
          doc.status === "incomplete" || 
          doc.status === "rejected" ||
          doc.status === "expired"
        )
      );
    }
    
    return true; // "all" filter
  };

  // This function gets individual documents that match the status filter
  const getIndividualDocumentsMatchingFilter = (docLabel, statusFilter) => {
    const multiUploadDocuments = [
      "IDs of Directors & Shareholders",
      "Client references / Support Letters",
      "Guarantee/Contract",
      "Industry Accreditations",
      "Loan Agreements"
    ];
    
    if (!multiUploadDocuments.includes(docLabel) && docLabel !== "CV") {
      return []; // Single documents don't have individual entries
    }
    
    const allDocs = getMultipleDocumentData(docLabel, profileData);
    
    return allDocs.filter(doc => {
      if (statusFilter === "pending") {
        return !doc.url || doc.url === "";
      }
      
      if (statusFilter === "expired") {
        return doc.url && doc.url !== "" && doc.status === "expired";
      }
      
      if (statusFilter === "rejected") {
        return doc.url && doc.url !== "" && (
          doc.status === "wrong_type" || 
          doc.status === "name_mismatch" || 
          doc.status === "incomplete" || 
          doc.status === "rejected"
        );
      }
      
      if (statusFilter === "verified") {
        return doc.url && doc.url !== "" && (
          doc.status === "verified" || doc.status === "verified:not_audited"
        );
      }
      
      if (statusFilter === "uploaded") {
        return doc.url && doc.url !== "" && !(
          doc.status === "verified" || 
          doc.status === "verified:not_audited" ||
          doc.status === "wrong_type" || 
          doc.status === "name_mismatch" || 
          doc.status === "incomplete" || 
          doc.status === "rejected" ||
          doc.status === "expired"
        );
      }
      
      return true; // "all" filter - show all documents
    });
  };

  const filteredDocuments = DOCUMENTS.filter((docLabel) => {
    const documentId = getDocumentId(docLabel);
    
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
      "Bank Details Confirmation Letter",
      "COIDA Letter of Good Standing",
      "Proof of Address",
      "Company Profile / Brochure"
    ];

    const legitimacyDocuments = [
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
      "Industry Accreditations",
      "Loan Agreements",
      "Guarantee/Contract"
    ];

    const matchFilter =
      filter === "all" ||
      (filter === "Funding" && fundingDocuments.includes(docLabel)) ||
      (filter === "Compliance" && complianceDocuments.includes(docLabel)) || 
      (filter === "Legitimacy" && legitimacyDocuments.includes(docLabel)) || 
      (filter === "Leadership" && leadershipDocuments.includes(docLabel)) || 
      (filter === "Governance" && governanceDocuments.includes(docLabel)) ||
      (filter === "Capital Appeal" && capitalAppealDocuments.includes(docLabel)); 

    const matchStatusFilter = 
      statusFilter === "all" ||
      hasDocumentMatchingStatusFilter(docLabel, statusFilter);

    const matchSearch = docLabel.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchFilter && matchStatusFilter && matchSearch;
  });

  const handleDeleteDocument = async (docLabel) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const confirmDelete = window.confirm(`Are you sure you want to delete ${docLabel}?`);
    if (!confirmDelete) return;

    try {
      // ✅ Use sync service for deletion
      await deleteDocumentWithSync(docLabel);
      
      setSubmittedDocuments(prev => prev.filter(d => d !== docLabel));
      
      const profileRef = doc(db, "universalProfiles", user.uid);
      const updatedProfileSnap = await getDoc(profileRef);
      if (updatedProfileSnap.exists()) {
        setProfileData(updatedProfileSnap.data());
      }
      
    } catch (error) {
      console.error("Error deleting document:", error);
      alert('Failed to delete document. Please try again.');
    }
  };

  
 const getStatusBadge = (docLabel, individualDoc = null, docIndex = null) => {
  const multiUploadDocuments = [
    "IDs of Directors & Shareholders",
    "Client references / Support Letters",
    "Guarantee/Contract",
    "Industry Accreditations",
    "Loan Agreements"
  ];
  
  // If we have an individual document, show its specific status
  if (individualDoc && docIndex !== null) {
    let status = "pending";
    let displayStatus = "Pending";
    
    if (!individualDoc.url || individualDoc.url === "") {
      status = "pending";
      displayStatus = "Pending";
    } else if (
      individualDoc.status === "wrong_type" || 
      individualDoc.status === "name_mismatch" || 
      individualDoc.status === "incomplete" || 
      individualDoc.status === "rejected" ||
      individualDoc.status === "expired"
    ) {
      status = "rejected";
      displayStatus = "Rejected";
    } else if (individualDoc.status === "verified" || individualDoc.status === "verified:not_audited") {
      status = "verified";
      displayStatus = "Verified";
    }
    
    return <span style={badgeStyles(status)}>{displayStatus}</span>;
  }
  
  // For multi-upload parent documents, show count of rejected/total
  if (multiUploadDocuments.includes(docLabel) || docLabel === "CV") {
    const allDocs = getMultipleDocumentData(docLabel, profileData);
    const uploadedDocs = allDocs.filter(doc => doc.url && doc.url !== "");
    
    if (uploadedDocs.length === 0) {
      return <span style={badgeStyles("pending")}>Pending</span>;
    }

    // Count rejected documents
    const rejectedCount = uploadedDocs.filter(doc => 
      doc.status === "wrong_type" || 
      doc.status === "name_mismatch" || 
      doc.status === "incomplete" || 
      doc.status === "rejected" ||
      doc.status === "expired"
    ).length;
    
    if (rejectedCount > 0) {
      return <span style={badgeStyles("rejected")}>{rejectedCount}/{uploadedDocs.length} Rejected</span>;
    }

    // Check if all are verified
    const allVerified = uploadedDocs.every(doc => 
      doc.status === "verified" || doc.status === "verified:not_audited"
    );
    
    if (allVerified) {
      return <span style={badgeStyles("verified")}>{uploadedDocs.length} Verified</span>;
    }

    return <span style={badgeStyles("pending")}>Pending</span>;
  }

  // Handle single upload documents
  const documentId = getDocumentId(docLabel);
  const url = getDocumentUrlFromAnyLocation(docLabel, profileData);
  const verification = profileData.verification?.[documentId];
  
  if (!url) {
    return <span style={badgeStyles("pending")}>Pending</span>;
  }

  let status = "pending";
  let displayStatus = "Pending";
  
  if (verification) {
    if (verification.status === "verified" || verification.status === "verified:not_audited") {
      status = "verified";
      displayStatus = "Verified";
    } else {
      status = "rejected";
      displayStatus = "Rejected";
    }
  }

  return <span style={badgeStyles(status)}>{displayStatus}</span>;
};

const badgeStyles = (status) => {
  const styles = {
    pending: {
      backgroundColor: "#fff3e0",
      color: "#ef6c00"
    },
    verified: {
      backgroundColor: "#e8f5e8",
      color: "#2e7d32"
    },
    rejected: {
      backgroundColor: "#ffebee",
      color: "#c62828"
    }
  };
  
  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "600",
    ...styles[status]
  };
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
  });

  // Modified renderExpandedRows to only show matching documents when filtering
  const renderExpandedRows = (docLabel, docs, isExpanded) => {
  if (!isExpanded) return null;

  const getExpandedState = () => {
    switch(docLabel) {
      case "IDs of Directors & Shareholders":
        return expandedIDs;
      case "CV":
        return expandedCVs;
      case "Client references / Support Letters":
        return expandedClientReferences;
      case "Guarantee/Contract":
        return expandedGuarantees;
      case "Industry Accreditations":
        return expandedAccreditations;
      case "Loan Agreements":
        return expandedLoanAgreements;
      default:
        return false;
    }
  };

  if (!getExpandedState()) return null;

  // When filtering by status, only show documents that match the filter
  let filteredDocs = docs;
  if (statusFilter !== "all") {
    filteredDocs = getIndividualDocumentsMatchingFilter(docLabel, statusFilter);
  }

  if (filteredDocs.length === 0) return null;

  return filteredDocs.map((doc, docIndex) => {
    let displayName = "";
    if (docLabel === "IDs of Directors & Shareholders") {
      displayName = doc.role && doc.personName ? 
        `${doc.personName} (${doc.role} ${doc.directorIndex !== undefined ? doc.directorIndex + 1 : doc.executiveIndex + 1})` : 
        `ID ${docIndex + 1}`;
    } else if (docLabel === "CV") {
      displayName = doc.role && doc.personName ? 
        `${doc.personName} (${doc.role} ${doc.directorIndex !== undefined ? doc.directorIndex + 1 : doc.executiveIndex + 1})` : 
        `CV ${docIndex + 1}`;
    } else {
      const baseName = docLabel.split('/')[0].trim();
      displayName = `${baseName} ${docIndex + 1}`;
    }
    
    // Clean up status display - simplified
    let statusDisplay = "Pending";
    let statusStyle = "pending";
    
    if (!doc.url || doc.url === "") {
      statusDisplay = "Pending";
      statusStyle = "pending";
    } else if (doc.status === "verified" || doc.status === "verified:not_audited") {
      statusDisplay = "Verified";
      statusStyle = "verified";
    } else if (doc.status === "expired") {
      statusDisplay = "Expired";
      statusStyle = "expired";
    } else if (
      doc.status === "wrong_type" || 
      doc.status === "name_mismatch" || 
      doc.status === "incomplete" || 
      doc.status === "rejected"
    ) {
      statusDisplay = "Rejected";
      statusStyle = "rejected";
    }
    
    return (
      <tr 
        key={`${docLabel}-${docIndex}`}
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
            {displayName}
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
          {doc.message || (doc.url ? "Document uploaded" : "No document uploaded")}
        </td>
        <td style={{
          padding: "12px 20px",
          textAlign: "center",
          verticalAlign: "middle"
        }}>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "4px 8px",
            borderRadius: "12px",
            fontSize: "10px",
            fontWeight: "600",
            backgroundColor: statusStyle === "verified" ? "#e8f5e8" : 
                          statusStyle === "pending" ? "#fff3e0" : "#ffebee",
            color: statusStyle === "verified" ? "#2e7d32" : 
                  statusStyle === "pending" ? "#ef6c00" : "#c62828"
          }}>
            {statusDisplay}
          </span>
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
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "20px",
            padding: "16px",
            backgroundColor: "#f5f2f0",
            borderRadius: "8px",
            border: "1px solid #d7ccc8"
          }}>
            <button
              onClick={() => window.location.href = "/profile"} 
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                backgroundColor: "transparent",
                color: "#8d6e63",
                border: "1px solid #8d6e63",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500",
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
              ← Universal Profile
            </button>
            <span style={{ color: "#8d6e63" }}>→</span>
            <span style={{ color: "#5d4037", fontWeight: "600" }}>My Documents</span>
          </div>

        <div style={{
          width: "100%",
          maxWidth: "1400px",
          margin: "0 auto",
        }}>
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
              border: "1px solid #d7ccc8",
              width: "100%",
              overflowX: "auto",
              position: "relative"
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
                      Notes
                    </th>
                    <th style={{
                      padding: "16px 20px",
                      textAlign: "center",
                      fontWeight: "600",
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: "2px solid #6d4c41",
                      width: "15%",
                      position: "relative"
                    }}>
                      <div style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        gap: "8px",
                        cursor: "pointer",
                        position: "relative"
                      }}
                      onClick={() => setShowStatusFilter(!showStatusFilter)}
                      >
                        Status
                        <Filter size={14} />
                        
                        {showStatusFilter && (
                          <div style={{
                            position: "absolute",
                            top: "100%",
                            left: "50%",
                            transform: "translateX(-50%)",
                            backgroundColor: "white",
                            border: "1px solid #d7ccc8",
                            borderRadius: "8px",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                            zIndex: 9999,
                            minWidth: "200px",
                            marginTop: "8px",
                            overflow: "hidden"
                          }}>
                            <div style={{
                              padding: "8px 12px",
                              backgroundColor: "#f5f2f0",
                              borderBottom: "1px solid #d7ccc8",
                              fontSize: "12px",
                              fontWeight: "600",
                              color: "#5d4037"
                            }}>
                              Filter by Status
                            </div>
                            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                              {["all", "pending", "verified", "rejected", "expired"].map((status) => {
                                const statusLabels = {
                                  all: "All",
                                  pending: "Pending",
                                  verified: "Verified",
                                  rejected: "Rejected",
                                  expired: "Expired"
                                };
                                return (
                                  <button
                                    key={status}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setStatusFilter(status);
                                      setShowStatusFilter(false);
                                    }}
                                    style={{
                                      display: "block",
                                      width: "100%",
                                      padding: "10px 16px",
                                      textAlign: "left",
                                      border: "none",
                                      backgroundColor: statusFilter === status ? "#efebe9" : "white",
                                      color: "#5d4037",
                                      fontSize: "13px",
                                      cursor: "pointer",
                                      transition: "all 0.2s ease",
                                      borderBottom: "1px solid #f5f2f0"
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.backgroundColor = statusFilter === status ? "#efebe9" : "#faf8f6";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.backgroundColor = statusFilter === status ? "#efebe9" : "white";
                                    }}
                                  >
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                      <span>{statusLabels[status]}</span>
                                      {statusFilter === status && (
                                        <span style={{ color: "#8d6e63", fontSize: "12px" }}>✓</span>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
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
    {filteredDocuments.map((docLabel, index) => {
      const documentId = getDocumentId(docLabel);
      const unifiedPath = UNIFIED_DOCUMENT_PATHS[documentId];
      
    // Get the most recent updatedAt - check both root and documents nested
let updatedAt = 
  // Check in documents nested first (your current structure)
  profileData?.documents?.[`${documentId}UpdatedAt`] || 
  profileData?.documents?.[`${documentId}_multiple_updated`] ||
  // Then check at root level (where your data actually is)
  profileData?.[`${documentId}UpdatedAt`] ||
  profileData?.[`${documentId}_multiple_updated`];

// If unified path exists, try that too in both locations
if (!updatedAt && unifiedPath) {
  updatedAt = profileData?.documents?.[`${unifiedPath}UpdatedAt`] ||
              profileData?.[`${unifiedPath}UpdatedAt`];
}

console.log(`UpdatedAt for ${docLabel}:`, updatedAt);
console.log(`Full documents object:`, profileData?.documents)
      // For multi-upload documents, check the multiple updated timestamp
      const multiUploadDocuments = [
        "IDs of Directors & Shareholders",
        "Client references / Support Letters",
        "Guarantee/Contract",
        "Industry Accreditations",
        "Loan Agreements"
      ];

      const isMultiUpload = multiUploadDocuments.includes(docLabel);

      
      // const isMultiUpload = multiUploadDocuments.includes(docLabel);
      // if (isMultiUpload) {
      //   const multipleUpdatedAt = profileData[`documents.${documentId}_multiple_updated`];
      //   if (multipleUpdatedAt) {
      //     updatedAt = multipleUpdatedAt;
      //   }
      // }
      
      // // For CVs, check CV specific timestamps
      // if (docLabel === "CV") {
      //   const cvUpdatedAt = profileData[`documents.cv_multiple_updated`];
      //   if (cvUpdatedAt) {
      //     updatedAt = cvUpdatedAt;
      //   }
      // }

          // Format the date for display
 const formattedDate = updatedAt ? 
    new Date(updatedAt.seconds * 1000).toLocaleDateString() : 
    "Never";

      const allDocs = isMultiUpload ? getMultipleDocumentData(docLabel, profileData) : [];

      // Get the validation result for this document
      const validationResult = validationResults[docLabel];
      const url = getDocumentUrlFromAnyLocation(docLabel, profileData);
      const verification = profileData.verification?.[documentId];
      
      return (
        <>
          <tr key={docLabel} style={{
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
              <div style={{ 
                display: "flex", 
                flexDirection: "column", // Stack items vertically
                alignItems: "flex-start", // Align to the left
                gap: "4px" // Smaller gap between name and button
              }}>
                {/* Document Name/Label */}
                <div>
                  {docLabel.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </div>
                
                {/* Add Document Button - only for multi-upload documents */}
                {isMultiUpload && (
                  <button
                    onClick={() => handleAddNewDocument(docLabel)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      padding: "3px 8px", // Slightly smaller padding
                      color: "#5d4037", // Match the text color
                      backgroundColor: "transparent", // Transparent background
                      border: "1px solid #5d4037", // Outline border
                      borderRadius: "4px",
                      fontSize: "10px",
                      cursor: "pointer",
                      fontWeight: "500", // Slightly lighter weight
                      transition: "all 0.2s ease",
                      marginTop: "2px", // Small space above the button
                      outline: "none" // Remove default focus outline
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#5d4037"; // Fill with color on hover
                      e.target.style.color = "white"; // White text on hover
                      e.target.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "transparent"; // Back to transparent
                      e.target.style.color = "#5d4037"; // Back to original color
                      e.target.style.transform = "translateY(0)";
                    }}
                    onFocus={(e) => {
                      e.target.style.backgroundColor = "#5d4037";
                      e.target.style.color = "white";
                    }}
                    onBlur={(e) => {
                      e.target.style.backgroundColor = "transparent";
                      e.target.style.color = "#5d4037";
                    }}
                  >
                    <Plus size={10} />
                    Add {docLabel.split('/')[0].trim()}
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
              {renderDocumentLink(docLabel)}
            </td>
           <td style={{
              padding: "16px 20px",
              fontSize: "13px",
              color: "#6d4c41",
              textAlign: "center",
              verticalAlign: "middle",
              backgroundColor: "transparent"
            }}>
              {updatedAt ? (
    // Handle both Timestamp objects and string dates
    updatedAt.seconds 
      ? new Date(updatedAt.seconds * 1000).toLocaleDateString()  // Firestore Timestamp
      : new Date(updatedAt).toLocaleDateString()                  // String date
  ) : "-"}
            </td>

            <td style={{
              padding: "16px 20px",
              fontSize: "12px",
              color: "#6d4c41",
              textAlign: "center",
              verticalAlign: "middle",
              backgroundColor: "transparent"
            }}>
              {/* Notes display logic */}
              {isMultiUpload ? (
                (() => {
                  const uploadedCount = allDocs.filter(d => d.url && d.url !== "").length;
                  const verifiedCount = allDocs.filter(d => 
                    d.url && d.url !== "" && (d.status === "verified" || d.status === "verified:not_audited")
                  ).length;
                  
                  if (uploadedCount === 0) {
                    return "No documents uploaded";
                  }
                  
                  const baseName = docLabel.split('/')[0].trim();
                  return `${verifiedCount}/${uploadedCount} ${baseName}${uploadedCount !== 1 ? 's' : ''} verified`;
                })()
              ) : docLabel === "CV" ? (
                (() => {
                  const allCVs = getMultipleDocumentData(docLabel, profileData);
                  const uploadedCount = allCVs.filter(d => d.url && d.url !== "").length;
                  const verifiedCount = allCVs.filter(d => 
                    d.url && d.url !== "" && (d.status === "verified" || d.status === "verified:not_audited")
                  ).length;
                  
                  if (uploadedCount === 0) {
                    return "No CVs uploaded";
                  }
                  
                  return `${verifiedCount}/${uploadedCount} CV${uploadedCount !== 1 ? 's' : ''} verified`;
                })()
              ) : (
                // For regular documents, show AI validation message if available, otherwise show stored message
                (() => {
                  if (!url) {
                    return "No document uploaded";
                  }
                  
                  // Show AI validation result if available (from validationResults state)
                  if (validationResult) {
                    return validationResult.message || "Document uploaded";
                  }
                  
                  // Otherwise show stored verification message
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
              {getStatusBadge(docLabel)}
            </td>
            <td style={{
              padding: "16px 20px",
              textAlign: "center",
              verticalAlign: "middle",
              backgroundColor: "transparent"
            }}>
              {docLabel === "CV" ? (
                <div style={{ display: "flex", gap: "8px", justifyContent: "center", alignItems: "center" }}>
                  <label style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    backgroundColor: "#d3d3d3", 
                    color: "#666",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "600",
                    cursor: "not-allowed", 
                    opacity: 0.6, 
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    <Upload size={12} />
                    Upload
                  </label>
                </div>
              ) : isMultiUpload ? (
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
                          handleIndividualDocumentUpload(docLabel, files[0], 0);
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
                  {getDocumentUrlFromAnyLocation(docLabel, profileData) ? "Update" : "Upload"}
                  <input
                    type="file"
                    style={{ display: "none" }}
                    onChange={(e) => handleFileUpload(docLabel, e.target.files[0])}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </label>
              )}
            </td>
          </tr>
          
          {/* Expanded rows for multi-upload documents - ONLY show matching documents when filtering */}
          {isMultiUpload && renderExpandedRows(docLabel, allDocs, true)}
          
          {/* Expanded rows for CVs - ONLY show matching documents when filtering */}
          {docLabel === "CV" && renderExpandedRows(docLabel, getMultipleDocumentData(docLabel, profileData), expandedCVs)}
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