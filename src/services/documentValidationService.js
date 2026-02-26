import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: "AIzaSyA3AIJgagmVwL930v9CO56i3M45Gq0usPI"
});

export const documentValidationRules = {
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
  "Company Letterhead": {
    requiredElements: [
      "Company name clearly displayed",
      "Contact information (phone OR email OR website OR address)",
      "Official company branding/design",
      "✅ ACCEPT: Official letterhead OR company stationery",
      "✅ ACCEPT: Both single-page letters AND multi-page documents",
      "✅ COMPANY LOGO: Optional - accept even if logo is not present",
      "✅ REGISTRATION NUMBER: Optional - not always required on letterhead",
      "✅ DATE: Optional - letterhead may or may not have date",
      "✅ ACCEPT VARIATIONS: Official business letter, company stationery, business communication paper"
    ],
    strictChecks: ["has_company_details", "has_contact_info"]
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
    "Person's full name",
    "Work experience with dates",
    "Educational background",
    "Skills or competencies"
  ],
  strictChecks: ["has_work_experience", "has_education", "is_cv"],
  skipNameCheck: true, 
  ignoreCompanyName: true 
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

// Helper function to create validation prompts
const createStrictPrompt = (docLabel, rules, registeredName) => { 
  let customInstructions = "";
  
  // SPECIAL HANDLING FOR CVs - OVERRIDE EVERYTHING
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
  
  // Special handling for B-BBEE
  if (docLabel === "B-BBEE Certificate") {
    customInstructions = `SPECIAL INSTRUCTIONS FOR B-BBEE DOCUMENTS:
- ACCEPT BOTH: Traditional B-BBEE Certificates AND Exemption Affidavits for micro-enterprises
- EXEMPTION AFFIDAVITS MUST CONTAIN: Clear 'Exemption Affidavit' or 'Micro Enterprise' title, Commissioner of Oaths stamp, turnover declaration below R10 million
- CERTIFICATES MUST CONTAIN: B-BBEE level (1-8), certificate number, expiry date, issued by accredited agency
- REJECT: Generic letters, self-declarations without commissioner stamp, expired certificates, non-accredited certificates
- BOTH DOCUMENT TYPES ARE VALID for different business sizes
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
2. 🔴 COMPANY NAME: ${docLabel === "CV" ? "NOT REQUIRED - IGNORE COMPANY NAME" : `Must match "${registeredName}"`}
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


// Helper function to parse AI response
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
  // SPECIAL HANDLING FOR CVs
  if (docLabel === "CV") {
    // Check if the identified type is actually a CV but mislabeled
    const lowerIdentified = identifiedType.toLowerCase();
    const isActuallyCV = lowerIdentified.includes('cv') || 
                        lowerIdentified.includes('resume') || 
                        lowerIdentified.includes('curriculum') ||
                        lowerIdentified.includes('personal') ||
                        lowerIdentified.includes('work experience');
    
    if (isActuallyCV) {
      userMessage = "CV verified";
      status = "verified";
    } else {
      userMessage = `Please upload a CV, not ${identifiedType}`;
      status = "wrong_type";
    }
  }
  else if (docLabel === "Financial Statements" && 
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

// Helper function to check expiry dates
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

// Helper function for manual expiry check
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

// Main validation function
export const validateDocument = async (docLabel, file, registeredName = "") => {
  try {
    const rules = documentValidationRules[docLabel];
    
    if (!rules) {
      return {
        isValid: false,
        status: "validation_failed",
        message: `No validation rules found for ${docLabel}`,
        warnings: []
      };
    }

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

// Utility function to get all document types
export const getAllDocumentTypes = () => {
  return Object.keys(documentValidationRules);
};

// Utility function to check if document type is supported
export const isDocumentTypeSupported = (docLabel) => {
  return documentValidationRules.hasOwnProperty(docLabel);
};

export default {
  validateDocument,
  documentValidationRules,
  getAllDocumentTypes,
  isDocumentTypeSupported
};