import get from "lodash.get";

export const DOCUMENT_PATHS = {
  "Pitch Deck": "enterpriseReadiness.pitchDeckFile",
  "Business Plan": "enterpriseReadiness.businessPlanFile",
  "Audited Financials": "enterpriseReadiness.auditedFinancialsFile",
  "Guarante/Contract": "enterpriseReadiness.guaranteeFile",
  "Company Registration Certificate": "documents.registrationCertificate",
  "Certified IDs of Directors & Shareholders": "documents.certifiedIds",
  "Share Register": "documents.shareRegister",
  "Proof of Address (Utility Bill, Lease Agreement)": "documents.proofOfAddress",
  "Tax Clearance Certificate": "documents.taxClearanceCert",
  "B-BBEE Certificate": "documents.bbbeeCert",
  "VAT Certificates": "documents.vatCertificate",
  "Industry Accreditations": "documents.industryAccreditationDocs",
  "Company Profile / Brochure": "documents.companyProfile",
  "Client References": "documents.clientReferences",
  "5 Year Budget (Income Statement, Cashflows, Balance Sheet)": "documentUpload.budgetDocuments",
  "Previous Program Reports": "documentUpload.programReports",
  // "Bank Statements (6 months)": "documentUpload.bankStatements",
  "Bank Details Confirmation Letter": "documentUpload.bankConfirmation",
  "Loan Agreements": "documentUpload.loanAgreements",
  "Financial Statements": "documentUpload.financialStatements",
  "Impact Statements": "documentUpload.impactStatement",
  "Support Letters / Endorsements": "documentUpload.supportLetters",

};

export const checkSubmittedDocs = (requiredDocs, profileData) => {
  const submitted = [];

  requiredDocs.forEach(doc => {
    const path = DOCUMENT_PATHS[doc];
    if (!path) return;

    const value = Array.isArray(path)
      ? path.map(p => get(profileData, p)).find(Boolean)
      : get(profileData, path);

    // ✅ This now detects both string URLs and object values with `url`
    const isSubmitted = typeof value === "string"
      ? value.startsWith("http") || value.length > 5
      : value?.url;

    if (isSubmitted) submitted.push(doc);
  });

  return submitted;
};

export const getDocumentURL = (label, profileData) => {
  const path = DOCUMENT_PATHS[label];
  if (!path) return null;
  const value = Array.isArray(path)
    ? path.map(p => get(profileData, p)).find(v => !!v)
    : get(profileData, path);
  return Array.isArray(value) ? value[0] : value;
};