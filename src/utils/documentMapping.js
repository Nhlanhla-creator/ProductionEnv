export const DOCUMENT_CATEGORIES = {
  PROFILE: 'profile',
  ADDITIONAL: 'additional'
};

export const DOCUMENT_MAPPING = {
  // PROFILE DOCUMENTS (in both components)
  "Company Registration Certificate": { id: "registrationCertificate", category: DOCUMENT_CATEGORIES.PROFILE },
  "Certified IDs of Directors & Shareholders": { id: "certifiedIds", category: DOCUMENT_CATEGORIES.PROFILE },
  "Share Register": { id: "shareRegister", category: DOCUMENT_CATEGORIES.PROFILE },
  "Proof of Address": { id: "proofOfAddress", category: DOCUMENT_CATEGORIES.PROFILE },
  "Tax Clearance Certificate": { id: "taxClearanceCert", category: DOCUMENT_CATEGORIES.PROFILE },
  "VAT Certificate": { id: "vatCertificate", category: DOCUMENT_CATEGORIES.PROFILE },
  "B-BBEE Certificate": { id: "bbbeeCert", category: DOCUMENT_CATEGORIES.PROFILE },
  "UIF/PAYE/COIDA Certificates": { id: "otherCerts", category: DOCUMENT_CATEGORIES.PROFILE },
  "Industry Accreditations": { id: "industryAccreditationDocs", category: DOCUMENT_CATEGORIES.PROFILE },
  "Company Profile / Brochure": { id: "companyProfile", category: DOCUMENT_CATEGORIES.PROFILE },
  "Client References": { id: "clientReferences", category: DOCUMENT_CATEGORIES.PROFILE },

  // ADDITIONAL DOCUMENTS (only in MyDocuments)
  "5 Year Budget": { id: "fiveYearBudget", category: DOCUMENT_CATEGORIES.ADDITIONAL },
  "Audited Financials": { id: "auditedFinancials", category: DOCUMENT_CATEGORIES.ADDITIONAL },
  "Bank Details Confirmation Letter": { id: "bankDetailsConfirmation", category: DOCUMENT_CATEGORIES.ADDITIONAL },
  "Business Plan": { id: "businessPlan", category: DOCUMENT_CATEGORIES.ADDITIONAL },
  "Financial Statements": { id: "financialStatements", category: DOCUMENT_CATEGORIES.ADDITIONAL },
  "Guarantee/Collateral": { id: "guaranteeContract", category: DOCUMENT_CATEGORIES.ADDITIONAL },
  "Impact Statements": { id: "impactStatements", category: DOCUMENT_CATEGORIES.ADDITIONAL },
  "Loan Agreements": { id: "loanAgreements", category: DOCUMENT_CATEGORIES.ADDITIONAL },
  "Pitch Deck": { id: "pitchDeck", category: DOCUMENT_CATEGORIES.ADDITIONAL },
  "Previous Program Reports": { id: "previousProgramReports", category: DOCUMENT_CATEGORIES.ADDITIONAL },
  "Support Letters / Endorsements": { id: "supportLetters", category: DOCUMENT_CATEGORIES.ADDITIONAL },

  // NEW GOVERNANCE & HR DOCUMENTS - Added to ADDITIONAL
  "Employment Contract": { id: "employment_contract", category: DOCUMENT_CATEGORIES.ADDITIONAL },
  "Non-Disclosure Agreement (NDA)": { id: "nda", category: DOCUMENT_CATEGORIES.ADDITIONAL },
  "Employee Code of Conduct": { id: "employee_code_of_conduct", category: DOCUMENT_CATEGORIES.ADDITIONAL },
  "Memorandum of Understanding (MOU)": { id: "mou", category: DOCUMENT_CATEGORIES.ADDITIONAL },
  "Supplier Contracts": { id: "supplier_contracts", category: DOCUMENT_CATEGORIES.ADDITIONAL },
  "Ethics Policy": { id: "ethics_policy", category: DOCUMENT_CATEGORIES.ADDITIONAL },
  "Whistleblowing Policy": { id: "whistleblowing_policy", category: DOCUMENT_CATEGORIES.ADDITIONAL },
  "Leave Policy": { id: "leave_policy", category: DOCUMENT_CATEGORIES.ADDITIONAL },
  "Disciplinary & Grievance Policy": { id: "disciplinary_grievance_policy", category: DOCUMENT_CATEGORIES.ADDITIONAL },
  "Health & Safety Policy": { id: "health_safety_policy", category: DOCUMENT_CATEGORIES.ADDITIONAL },
  "Privacy & Data Protection Policy": { id: "privacy_data_protection_policy", category: DOCUMENT_CATEGORIES.ADDITIONAL },
  "Remote Work Policy": { id: "remote_work_policy", category: DOCUMENT_CATEGORIES.ADDITIONAL },
  "Conflict of Interest Policy": { id: "conflict_of_interest_policy", category: DOCUMENT_CATEGORIES.ADDITIONAL },
  "Intellectual Property Protection": { id: "intellectual_property_protection", category: DOCUMENT_CATEGORIES.ADDITIONAL },
  "Social Media Use Policy": { id: "social_media_use_policy", category: DOCUMENT_CATEGORIES.ADDITIONAL },
  "Expense Reimbursement Policy": { id: "expense_reimbursement_policy", category: DOCUMENT_CATEGORIES.ADDITIONAL },
  "Overtime & Compensation Policy": { id: "overtime_compensation_policy", category: DOCUMENT_CATEGORIES.ADDITIONAL },
  "Termination Policy": { id: "termination_policy", category: DOCUMENT_CATEGORIES.ADDITIONAL },
  "Performance Review Policy": { id: "performance_review_policy", category: DOCUMENT_CATEGORIES.ADDITIONAL }
};

export const DOCUMENT_PATHS = Object.keys(DOCUMENT_MAPPING).reduce((acc, label) => {
  const { id } = DOCUMENT_MAPPING[label];
  acc[label] = `documents.${id}`;
  return acc;
}, {});

export const UNIFIED_DOCUMENT_PATHS = Object.values(DOCUMENT_MAPPING).reduce((acc, { id }) => {
  acc[id] = `documents.${id}`;
  return acc;
}, {});

export const getDocumentId = (label) => DOCUMENT_MAPPING[label]?.id || label;

export const getDocumentLabel = (id) => {
  const entry = Object.entries(DOCUMENT_MAPPING).find(([label, data]) => data.id === id);
  return entry ? entry[0] : id;
};

export const getDocumentCategory = (label) => DOCUMENT_MAPPING[label]?.category || DOCUMENT_CATEGORIES.ADDITIONAL;

export const getProfileDocuments = () => 
  Object.keys(DOCUMENT_MAPPING).filter(label => DOCUMENT_MAPPING[label].category === DOCUMENT_CATEGORIES.PROFILE);

export const getAdditionalDocuments = () =>
  Object.keys(DOCUMENT_MAPPING).filter(label => DOCUMENT_MAPPING[label].category === DOCUMENT_CATEGORIES.ADDITIONAL);

export const getAllDocumentLabels = () => Object.keys(DOCUMENT_MAPPING);

export const getProfileDocumentIds = () => 
  getProfileDocuments().map(label => getDocumentId(label))