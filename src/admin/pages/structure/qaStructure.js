/**
 * QA & Testing structure with file upload definitions
 * All sections use file uploads (no text editors or databases)
 */

export const QA_STRUCTURE = {
  "Unit Tests": {
    type: "file",
    icon: "code",
    accept: ".pdf,.docx,.doc,.xlsx,.xls",
    maxSize: 2097152,
    description: "Upload unit test documentation and reports (PDF/Word/Excel, max 2MB)"
  },

  "Integration Tests": {
    type: "file",
    icon: "git-merge",
    accept: ".pdf,.docx,.doc,.xlsx,.xls",
    maxSize: 2097152,
    description: "Upload integration test plans and results (PDF/Word/Excel, max 2MB)"
  },

  "E2E Tests": {
    type: "file",
    icon: "play-circle",
    accept: ".pdf,.docx,.doc,.xlsx,.xls",
    maxSize: 2097152,
    description: "Upload end-to-end test scenarios and results (PDF/Word/Excel, max 2MB)"
  },

  "Performance Tests": {
    type: "file",
    icon: "activity",
    accept: ".pdf,.docx,.doc,.xlsx,.xls",
    maxSize: 2097152,
    description: "Upload performance test reports and metrics (PDF/Word/Excel, max 2MB)"
  },

  "Test Data": {
    type: "file",
    icon: "database",
    accept: ".csv,.xlsx,.xls,.json,.pdf",
    maxSize: 2097152,
    description: "Upload test datasets and mock data (CSV/Excel/JSON/PDF, max 2MB)"
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