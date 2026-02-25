/**
 * QA & Testing structure with file upload definitions
 * All sections use file uploads (no text editors or databases)
 */

export const QA_STRUCTURE = {
  "QA Tools": {
    type: "file",
    icon: "code",
    accept: ".pdf,.docx,.doc,.xlsx,.xls",
    maxSize: 10485760,
    description: "Upload QA tools documentation and reports (PDF/Word/Excel, max 10MB)"
  },

  "Integration Tests": {
    type: "file",
    icon: "git-merge",
    accept: ".pdf,.docx,.doc,.xlsx,.xls",
    maxSize: 10485760,
    description: "Upload integration test plans and results (PDF/Word/Excel, max 10MB)"
  },

  "E2E Tests": {
    type: "file",
    icon: "play-circle",
    accept: ".pdf,.docx,.doc,.xlsx,.xls",
    maxSize: 10485760,
    description: "Upload end-to-end test scenarios and results (PDF/Word/Excel, max 10MB)"
  },

  "Performance Tests": {
    type: "file",
    icon: "activity",
    accept: ".pdf,.docx,.doc,.xlsx,.xls",
    maxSize: 10485760,
    description: "Upload performance test reports and metrics (PDF/Word/Excel, max 10MB)"
  },

  "Security Tests": {
    type: "file",
    icon: "database",
    accept: ".csv,.xlsx,.xls,.json,.pdf",
    maxSize: 10485760,
    description: "Upload security test reports and findings (CSV/Excel/JSON/PDF, max 10MB)"
  }
};

// Helper function to navigate structure
export const navigateToPath = (structure, path) => {
  let current = structure;
  for (const segment of path) {
    if (current[segment]) {
      current = current[segment].items || current[segment];
    } else {
      return null;
    }
  }
  return current;
};

// Helper function to get item type
export const getItemType = (structure, path) => {
  const item = navigateToPath(structure, path);
  return item?.type || null;
};