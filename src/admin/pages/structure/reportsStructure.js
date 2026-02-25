/**
 * Reports & Analytics structure with file upload definitions
 * All sections use file uploads (no text editors or databases)
 */

export const REPORTS_STRUCTURE = {
  "Platform Metrics": {
    type: "file",
    icon: "trending-up",
    accept: ".pdf,.docx,.doc,.xlsx,.xls,.pptx",
    maxSize: 10485760,
    description: "Upload platform usage metrics and KPI reports (PDF/Word/Excel/PPT, max 10MB)"
  },

  "ESG Impact": {
    type: "file",
    icon: "leaf",
    accept: ".pdf,.docx,.doc,.xlsx,.xls,.pptx",
    maxSize: 10485760,
    description: "Upload ESG and impact measurement reports (PDF/Word/Excel/PPT, max 10MB)"
  },

  "Investor Reports": {
    type: "file",
    icon: "file-text",
    accept: ".pdf,.docx,.doc,.xlsx,.xls,.pptx",
    maxSize: 10485760,
    description: "Upload investor updates and financial reports (PDF/Word/Excel/PPT, max 10MB)"
  },

  "Usage Analytics": {
    type: "file",
    icon: "bar-chart",
    accept: ".pdf,.docx,.doc,.xlsx,.xls,.csv",
    maxSize: 10485760,
    description: "Upload user analytics and engagement data (PDF/Word/Excel/CSV, max 10MB)"
  },

  "Board Reports": {
    type: "file",
    icon: "briefcase",
    accept: ".pdf,.docx,.doc,.pptx",
    maxSize: 10485760,
    description: "Upload board meeting presentations and reports (PDF/Word/PPT, max 10MB)"
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