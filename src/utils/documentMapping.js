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
  "Guarantee/Contract": { id: "guaranteeContract", category: DOCUMENT_CATEGORIES.ADDITIONAL },
  "Impact Statements": { id: "impactStatements", category: DOCUMENT_CATEGORIES.ADDITIONAL },
  "Loan Agreements": { id: "loanAgreements", category: DOCUMENT_CATEGORIES.ADDITIONAL },
  "Pitch Deck": { id: "pitchDeck", category: DOCUMENT_CATEGORIES.ADDITIONAL },
  "Previous Program Reports": { id: "previousProgramReports", category: DOCUMENT_CATEGORIES.ADDITIONAL },
  "Support Letters / Endorsements": { id: "supportLetters", category: DOCUMENT_CATEGORIES.ADDITIONAL }
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