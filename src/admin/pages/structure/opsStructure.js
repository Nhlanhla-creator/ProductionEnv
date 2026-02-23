/**
 * Operations & Internal structure with file upload definitions
 * All sections use file uploads (no text editors or databases)
 */

export const OPS_STRUCTURE = {
  "Org Structure": {
    type: "file",
    icon: "sitemap",
    accept: ".pdf,.docx,.doc,.png,.jpg,.svg,.pptx",
    maxSize: 10485760,
    description: "Upload org charts and structure diagrams (PDF/Word/Images/PPT, max 10MB)"
  },

  "Roles KPIs": {
    type: "file",
    icon: "target",
    accept: ".pdf,.docx,.doc,.xlsx,.xls",
    maxSize: 10485760,
    description: "Upload role definitions and KPI documentation (PDF/Word/Excel, max 10MB)"
  },

  "Intern Programme": {
    type: "file",
    icon: "users",
    accept: ".pdf,.docx,.doc",
    maxSize: 10485760,
    description: "Upload internship program documentation (PDF/Word, max 10MB)"
  },

  "SOPs": {
    type: "file",
    icon: "file-text",
    accept: ".pdf,.docx,.doc",
    maxSize: 10485760,
    description: "Upload Standard Operating Procedures (PDF/Word, max 10MB)"
  },

  "Meetings Notes": {
    type: "file",
    icon: "clipboard",
    accept: ".pdf,.docx,.doc",
    maxSize: 10485760,
    description: "Upload meeting minutes and notes (PDF/Word, max 10MB)"
  },

  "Tools Access": {
    type: "file",
    icon: "key",
    accept: ".pdf,.docx,.doc,.xlsx,.xls",
    maxSize: 10485760,
    description: "Upload tools access documentation and credentials (PDF/Word/Excel, max 10MB)"
  },

  "Training": {
    type: "file",
    icon: "book-open",
    accept: ".pdf,.docx,.doc,.pptx,.mp4",
    maxSize: 10485760,
    description: "Upload training materials and guides (PDF/Word/PPT, max 10MB)"
  },

  "Admin Dashboards": {
    type: "file",
    icon: "layout-dashboard",
    accept: ".pdf,.docx,.doc,.png,.jpg,.xlsx,.xls",
    maxSize: 10485760,
    description: "Upload admin dashboard documentation (PDF/Word/Images/Excel, max 10MB)"
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