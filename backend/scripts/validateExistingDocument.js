// scripts/validateExistingDocuments.js
import { GoogleGenAI } from "@google/genai";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { config } from "dotenv";
import fetch from 'node-fetch';
import get from 'lodash.get';
import { Buffer } from 'buffer';

// Load environment variables
config();

const ai = new GoogleGenAI({ 
  apiKey: process.env.REACT_APP_GEMINI_API_KEY || "AIzaSyDwdY9ZbfwjRftP4WAlKfLIQ9jR-vWYYxk"
});

// Document mapping (copy from your documentMapping.js)
const DOCUMENT_MAPPING = {
  "Company Registration Certificate": { id: "registrationCertificate", category: "profile" },
  "Certified IDs of Directors & Shareholders": { id: "certifiedIds", category: "profile" },
  "Share Register": { id: "shareRegister", category: "profile" },
  "Proof of Address": { id: "proofOfAddress", category: "profile" },
  "Tax Clearance Certificate": { id: "taxClearanceCert", category: "profile" },
  "VAT Certificate": { id: "vatCertificate", category: "profile" },
  "B-BBEE Certificate": { id: "bbbeeCert", category: "profile" },
  "UIF/PAYE/COIDA Certificates": { id: "otherCerts", category: "profile" },
  "Industry Accreditations": { id: "industryAccreditationDocs", category: "profile" },
  "Company Profile / Brochure": { id: "companyProfile", category: "profile" },
  "Client References": { id: "clientReferences", category: "profile" },
  "5 Year Budget": { id: "fiveYearBudget", category: "additional" },
  "Audited Financials": { id: "auditedFinancials", category: "additional" },
  "Bank Details Confirmation Letter": { id: "bankDetailsConfirmation", category: "additional" },
  "Business Plan": { id: "businessPlan", category: "additional" },
  "Financial Statements": { id: "financialStatements", category: "additional" },
  "Guarantee/Contract": { id: "guaranteeContract", category: "additional" },
  "Impact Statements": { id: "impactStatements", category: "additional" },
  "Loan Agreements": { id: "loanAgreements", category: "additional" },
  "Pitch Deck": { id: "pitchDeck", category: "additional" },
  "Previous Program Reports": { id: "previousProgramReports", category: "additional" },
  "Support Letters / Endorsements": { id: "supportLetters", category: "additional" }
};

const DOCUMENT_PATHS = Object.keys(DOCUMENT_MAPPING).reduce((acc, label) => {
  const { id } = DOCUMENT_MAPPING[label];
  acc[label] = `documents.${id}`;
  return acc;
}, {});

const getDocumentId = (label) => DOCUMENT_MAPPING[label]?.id || label;
const getAllDocumentLabels = () => Object.keys(DOCUMENT_MAPPING);

const documentValidationRules = {
  "5 Year Budget": {
    requiredElements: [
      "Income Statement with 5-year projections",
      "Cash Flow Statement with 5-year projections", 
      "Balance Sheet with 5-year projections",
      "Revenue and expense projections",
      "Financial assumptions"
    ]
  },
  "Audited Financials": {
    requiredElements: [
      "Auditor's report/signed opinion",
      "Complete financial statements",
      "Notes to financial statements", 
      "Comparative figures",
      "Auditor signature and date"
    ]
  },
  "Bank Details Confirmation Letter": {
    requiredElements: [
      "Bank name clearly stated",
      "Account holder name",
      "Account number",
      "Account type",
      "Branch Code",
      "Date Of Issue"
    ]
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
    ]
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
    ]
  },
  "Certified IDs of Directors & Shareholders": {
    requiredElements: [
      "Certification stamp/signature (Commissioner of Oaths)",
      "Certification date within last 3 months",
      "South African ID number (13 digits)",
      "Photograph of ID holder",
      "Full names matching company records",
      "Keywords: Certified, True Copy, Commissioner of Oaths"
    ]
  },
  "Client References": {
    requiredElements: [
      "Reference letter heading/title",
      "Client company name and contact details",
      "Description of services provided",
      "Performance/satisfaction statement",
      "Dates of service/work period",
      "Authorized signature and position"
    ]
  },
  "Company Profile / Brochure": {
    requiredElements: [
      "Company name and logo",
      "About Us/Company Overview section",
      "Mission, Vision, Values statements",
      "Management/Team information",
      "Contact details",
      "Services/Products description"
    ]
  },
  "Company Registration Certificate": {
    requiredElements: [
      "Issued by CIPC/Companies Registry",
      "Company registration number",
      "Registered company name",
      "Date of incorporation",
      "Company type (Pty Ltd, CC, etc.)",
      "Official stamp/signature"
    ]
  },
  "Financial Statements": {
    requiredElements: [
      "Balance Sheet (Statement of Financial Position)",
      "Income Statement (Profit & Loss)",
      "Cash Flow Statement",
      "Notes to financial statements",
      "Company name and period covered",
      "Currency specified (Rands)"
    ]
  },
  "Guarantee/Contract": {
    requiredElements: [
      "Contract/Agreement title",
      "Parties involved clearly defined",
      "Terms and obligations specified",
      "Duration/validity period",
      "Signatures from all parties"
    ]
  },
  "Impact Statements": {
    requiredElements: [
      "Impact Statement/Report title",
      "Reporting period/dates",
      "Objectives and goals stated",
      "Measurable results/outcomes",
      "Beneficiary numbers/statistics",
      "Monitoring and evaluation data"
    ]
  },
  "Industry Accreditations": {
    requiredElements: [
      "Accreditation/Certificate title",
      "Issuing accreditation body",
      "Scope/standard (e.g., ISO 9001)",
      "Issue and expiry dates",
      "Company name matches applicant"
    ]
  },
  "Loan Agreements": {
    requiredElements: [
      "Parties involved (lender/borrower)",
      "Loan amount and interest rate",
      "Repayment terms and schedule",
      "Signatures from all parties",
      "Agreement date and duration"
    ]
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
    ]
  },
  "Share Register": {
    requiredElements: [
      "Company name and registration number",
      "Shareholder names and details",
      "Number and class of shares held",
      "Issue dates of shares",
      "Certificate numbers",
      "Director/company secretary signature"
    ]
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
    ]
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
    ]
  }
};

const getRegisteredName = (profileData) => {
  return profileData.entityOverview?.registeredName || null;
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

const parseDetailedResponse = (responseText, docLabel) => {
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      let userMessage;
      let status = parsed.status;
      
      let identifiedType = parsed.identifiedDocumentType;
      
      if (!identifiedType || identifiedType === "EXACT_DOCUMENT_NAME_FROM_LIST") {
        identifiedType = "this document type";
      }

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
      return {
        isValid: true,
        status: "wrong_type",
        message: `Please upload a valid ${docLabel}`,
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

const validateDocumentWithAI = async (docLabel, fileUrl, registeredName, userId) => {
  try {
    const rules = documentValidationRules[docLabel];
    
    const validationPrompt = rules ? 
      createStrictPrompt(docLabel, rules, registeredName) :
      `Check if this document is a valid ${docLabel}. Return JSON with isValid true/false and message.`;

    console.log(`    📥 Downloading file from: ${fileUrl}`);
    
    // Download the file
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }
    
    // Get file info from URL and headers
    const contentType = response.headers.get('content-type') || 'application/pdf';
    const contentLength = response.headers.get('content-length');
    const fileName = fileUrl.split('/').pop() || 'document';
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    
    console.log(`    📄 File info: ${fileName}, Type: ${contentType}, Size: ${contentLength} bytes`);
    
    // Check if file is too small (likely empty/corrupted)
    if (contentLength && parseInt(contentLength) < 100) {
      console.log(`    🚫 File appears empty or corrupted (size: ${contentLength} bytes)`);
      return {
        isValid: false,
        status: "validation_failed",
        message: "Document appears empty or corrupted. Please re-upload.",
        warnings: [`File size too small: ${contentLength} bytes`]
      };
    }

    // Define supported and unsupported types
    const supportedTypes = [
      'application/pdf',
      'image/jpeg', 
      'image/jpg',
      'image/png',
      'image/webp'
    ];
    
    const unsupportedTypes = {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word document (.docx)',
      'application/msword': 'Word document (.doc)',
      'application/vnd.ms-excel': 'Excel spreadsheet (.xls)',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel spreadsheet (.xlsx)',
      'text/plain': 'Text file (.txt)'
    };
    
    // Check if file type is unsupported
    if (unsupportedTypes[contentType]) {
      const fileTypeDesc = unsupportedTypes[contentType];
      console.log(`    🚫 Unsupported file type: ${fileTypeDesc}`);
      
      return {
        isValid: false,
        status: "validation_failed",
        message: `Unsupported file format (${fileTypeDesc}). Please upload as PDF`,
        warnings: [`File format not supported. Convert to PDF and re-upload.`]
      };
    }
    
    // Check if file type is unknown/not supported
    if (!supportedTypes.includes(contentType)) {
      console.log(`    ⚠️  Unknown file type: ${contentType}. Attempting validation anyway.`);
    }
    
    // Get the file buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Convert to base64
    const base64Data = buffer.toString('base64');

    console.log(`    🤖 Sending to AI for validation...`);
    
    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: contentType,
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

    console.log(`    ✅ AI response received`);
    
    const finalResult = parseDetailedResponse(aiResponse.text, docLabel);
    return finalResult;

  } catch (error) {
    console.error(`    ❌ AI validation failed:`, error.message);
    
    // ✅ MIRRORING YOUR REACT COMPONENT'S ERROR HANDLING
    let errorMessage = "Network error - please try again";
    
    if (error.message?.includes('network') || error.message?.includes('fetch') || error.message?.includes('timeout')) {
      errorMessage = "Network error - please check your connection and try again";
    } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
      errorMessage = "Validation service temporarily unavailable - please try again later";
    } else if (error.message?.includes('api key') || error.message?.includes('authentication')) {
      errorMessage = "Validation service configuration error - please contact support";
    } else if (error.message?.includes('no pages') || error.message?.includes('empty') || error.message?.includes('corrupted')) {
      errorMessage = "Document appears empty or corrupted. Please re-upload a valid file.";
    } else if (error.message?.includes('unsupported') || error.message?.includes('file type') || error.message?.includes('mime type')) {
      errorMessage = "Unsupported file format. Please upload as PDF";
    } else if (error.message?.includes('INVALID_ARGUMENT') || error.message?.includes('400')) {
      errorMessage = "Document cannot be processed. Please check file and try again.";
    }
    
    return {
      isValid: false,
      status: "validation_failed",
      message: errorMessage,
      warnings: []
    };
  }
};

const getDocumentUrl = (profileData, docLabel) => {
  const documentId = getDocumentId(docLabel);
  
  console.log(`   🔍 Searching for: ${docLabel} (ID: ${documentId})`);
  
  // Define where each document type might be stored based on your upload code
  const documentLocations = {
    'registrationCertificate': ['documents.registrationCertificate', 'entityOverview.registrationCertificate'],
    'certifiedIds': ['documents.certifiedIds', 'ownershipManagement.certifiedIds'],
    'shareRegister': ['documents.shareRegister', 'ownershipManagement.shareRegister'],
    'proofOfAddress': ['documents.proofOfAddress', 'contactDetails.proofOfAddress'],
    'taxClearanceCert': ['documents.taxClearanceCert', 'legalCompliance.taxClearanceCert'],
    'vatCertificate': ['documents.vatCertificate', 'legalCompliance.vatCertificate'],
    'bbbeeCert': ['documents.bbbeeCert', 'legalCompliance.bbbeeCert'],
    'otherCerts': ['documents.otherCerts', 'legalCompliance.otherCerts'],
    'industryAccreditationDocs': ['documents.industryAccreditationDocs', 'legalCompliance.industryAccreditationDocs'],
    'companyProfile': ['documents.companyProfile', 'productsServices.companyProfile'],
    'clientReferences': ['documents.clientReferences', 'productsServices.clientReferences']
  };

  // Check all possible locations for this document
  const locations = documentLocations[documentId] || [`documents.${documentId}`, documentId];
  
  for (const location of locations) {
    const url = get(profileData, location);
    if (url && typeof url === 'string' && url.trim() !== '' && url.includes('firebasestorage')) {
      console.log(`   ✅ Found in ${location}: ${url.substring(0, 80)}...`);
      return url;
    }
    
    // Also check if it's stored as an array (your upload code handles arrays)
    const urlArray = get(profileData, location);
    if (Array.isArray(urlArray) && urlArray.length > 0 && typeof urlArray[0] === 'string' && urlArray[0].includes('firebasestorage')) {
      console.log(`   ✅ Found in ${location} (array): ${urlArray[0].substring(0, 80)}...`);
      return urlArray[0]; // Return first file in array
    }
  }

  // Deep search as fallback
  const deepSearchUrls = deepSearchForUrls(profileData, docLabel);
  if (deepSearchUrls.length > 0) {
    const bestMatch = deepSearchUrls[0];
    console.log(`   ✅ Found in deep search (${bestMatch.path}): ${bestMatch.url.substring(0, 80)}...`);
    return bestMatch.url;
  }

  console.log(`   ❌ No URL found for ${docLabel}`);
  return null;
};

// Enhanced deep search that handles arrays properly
const deepSearchForUrls = (profileData, docLabel) => {
  const urls = [];
  const searchStack = [{ obj: profileData, path: '' }];
  
  while (searchStack.length > 0) {
    const { obj, path } = searchStack.pop();
    
    if (obj && typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (typeof value === 'string' && value.includes('firebasestorage')) {
          urls.push({
            path: currentPath,
            url: value,
            key: key.toLowerCase()
          });
        } else if (Array.isArray(value)) {
          // Handle arrays - check each element
          value.forEach((item, index) => {
            if (typeof item === 'string' && item.includes('firebasestorage')) {
              urls.push({
                path: `${currentPath}[${index}]`,
                url: item,
                key: key.toLowerCase()
              });
            }
          });
        } else if (typeof value === 'object' && value !== null) {
          searchStack.push({ obj: value, path: currentPath });
        }
      }
    }
  }
  
  // Sort by relevance to the document label
  return urls.sort((a, b) => {
    const aScore = calculateRelevanceScore(a.key, docLabel);
    const bScore = calculateRelevanceScore(b.key, docLabel);
    return bScore - aScore;
  });
};

// Enhanced relevance scoring
const calculateRelevanceScore = (fieldName, docLabel) => {
  let score = 0;
  const lowerField = fieldName.toLowerCase();
  const lowerDoc = docLabel.toLowerCase();
  
  // Exact matches get highest score
  const documentId = getDocumentId(docLabel).toLowerCase();
  if (lowerField === documentId) score += 20;
  
  // Partial matches
  if (lowerField.includes('uif') && lowerDoc.includes('uif')) score += 10;
  if (lowerField.includes('paye') && lowerDoc.includes('paye')) score += 10;
  if (lowerField.includes('coida') && lowerDoc.includes('coida')) score += 10;
  if (lowerField.includes('cert') && lowerDoc.includes('cert')) score += 5;
  if (lowerField.includes('doc') && lowerDoc.includes('doc')) score += 3;
  if (lowerField.includes('proof') && lowerDoc.includes('proof')) score += 5;
  if (lowerField.includes('address') && lowerDoc.includes('address')) score += 5;
  if (lowerField.includes('tax') && lowerDoc.includes('tax')) score += 5;
  if (lowerField.includes('vat') && lowerDoc.includes('vat')) score += 5;
  if (lowerField.includes('bbbee') && lowerDoc.includes('bbbee')) score += 5;
  if (lowerField.includes('registration') && lowerDoc.includes('registration')) score += 5;
  if (lowerField.includes('company') && lowerDoc.includes('company')) score += 3;
  if (lowerField.includes('profile') && lowerDoc.includes('profile')) score += 3;
  if (lowerField.includes('client') && lowerDoc.includes('client')) score += 3;
  if (lowerField.includes('reference') && lowerDoc.includes('reference')) score += 3;
  if (lowerField.includes('share') && lowerDoc.includes('share')) score += 5;
  if (lowerField.includes('industry') && lowerDoc.includes('industry')) score += 5;
  if (lowerField.includes('accreditation') && lowerDoc.includes('accreditation')) score += 5;
  
  return score;
};

// Enhanced debug function
const debugUserDocuments = async (userId) => {
  console.log(`\n🔍 DEBUGGING USER: ${userId}`);
  const userDoc = await getDoc(doc(db, "universalProfiles", userId));
  const profileData = userDoc.data();
  
  console.log('📊 Checking all document locations:');
  
  const documentLocations = [
    'documents',
    'entityOverview',
    'ownershipManagement', 
    'contactDetails',
    'legalCompliance',
    'productsServices'
  ];
  
  documentLocations.forEach(location => {
    const data = get(profileData, location);
    if (data && typeof data === 'object') {
      console.log(`\n📍 ${location}:`);
      Object.keys(data).forEach(key => {
        const value = data[key];
        if (typeof value === 'string' && value.includes('firebasestorage')) {
          console.log(`   📄 ${key}: ${value.substring(0, 100)}...`);
        } else if (Array.isArray(value) && value.length > 0) {
          console.log(`   📁 ${key} (array with ${value.length} items):`);
          value.forEach((item, index) => {
            if (typeof item === 'string' && item.includes('firebasestorage')) {
              console.log(`     [${index}]: ${item.substring(0, 100)}...`);
            }
          });
        }
      });
    }
  });
  
  console.log('\n🔎 ALL FIREBASE STORAGE URLs FOUND:');
  const allUrls = deepSearchForUrls(profileData, '');
  if (allUrls.length === 0) {
    console.log('   No Firebase Storage URLs found anywhere in profile');
  } else {
    allUrls.forEach(({ path, url }) => {
      console.log(`   📍 ${path}: ${url}`);
    });
  }
};

const migrateAllDocuments = async () => {
  try {
    console.log("🚀 Starting document migration...");
    
    // Get all user profiles
    const profilesSnapshot = await getDocs(collection(db, "universalProfiles"));
    console.log(`📊 Found ${profilesSnapshot.size} user profiles`);
    
    let totalProcessed = 0;
    let totalValidated = 0;
    let totalFailed = 0;

    for (const profileDoc of profilesSnapshot.docs) {
      const profileData = profileDoc.data();
      const userId = profileDoc.id;
      console.log(`\n📋 Processing user: ${userId}`);
      
      const registeredName = getRegisteredName(profileData);
      console.log(`   🏢 Registered name: ${registeredName || 'Not found'}`);
      
      const allDocumentLabels = getAllDocumentLabels();
      let userProcessed = 0;
      let userValidated = 0;

      for (const docLabel of allDocumentLabels) {
        const fileUrl = getDocumentUrl(profileData, docLabel);

        if (fileUrl && fileUrl !== null && fileUrl !== '') {
          console.log(`   📄 Processing document: ${docLabel}`);
          
          try {
            const validationResult = await validateDocumentWithAI(docLabel, fileUrl, registeredName, userId);
            
            // ✅ IMPROVED: Save ALL validation results (both success and failure)
            const profileRef = doc(db, "universalProfiles", userId);
            await updateDoc(profileRef, {
              [`verification.${getDocumentId(docLabel)}`]: {
                status: validationResult.status,
                message: validationResult.message,
                lastChecked: new Date(),
                validatedAt: new Date(),
                warnings: validationResult.warnings || []
              }
            });
            
            if (validationResult.isValid && validationResult.status === "verified") {
              console.log(`   ✅ ${docLabel}: ${validationResult.status} - ${validationResult.message}`);
              totalValidated++;
              userValidated++;
            } else {
              console.log(`   ❌ ${docLabel}: ${validationResult.status} - ${validationResult.message}`);
              totalFailed++;
            }
            
            userProcessed++;
            totalProcessed++;
            
            // Add delay to avoid rate limiting
            console.log(`   ⏳ Waiting 2 seconds before next validation...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            
          } catch (error) {
            console.error(`   💥 Failed to validate ${docLabel}:`, error.message);
            
            // ✅ Save even the catastrophic failures
            try {
              const profileRef = doc(db, "universalProfiles", userId);
              await updateDoc(profileRef, {
                [`verification.${getDocumentId(docLabel)}`]: {
                  status: "validation_failed",
                  message: "Validation process failed - please try again",
                  lastChecked: new Date(),
                  validatedAt: new Date(),
                  warnings: [error.message]
                }
              });
            } catch (updateError) {
              console.error(`   💥 Failed to save error status:`, updateError.message);
            }
            
            totalFailed++;
          }
        } else {
          console.log(`   ⏸️  Skipping ${docLabel}: No document URL found`);
        }
      }
      
      console.log(`   ✅ User ${userId}: ${userProcessed} documents processed, ${userValidated} validated`);
    }
    
    console.log(`\n🎉 Migration completed!`);
    console.log(`📊 Summary:`);
    console.log(`   Total documents processed: ${totalProcessed}`);
    console.log(`   Successfully validated: ${totalValidated}`);
    console.log(`   Failed validations: ${totalFailed}`);
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
  }
};

migrateAllDocuments().then(() => {
  console.log("✨ Script finished");
  process.exit(0);
}).catch(error => {
  console.error("💥 Script failed:", error);
  process.exit(1);
});