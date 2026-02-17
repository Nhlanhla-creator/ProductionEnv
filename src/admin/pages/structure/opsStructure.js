/**
 * Operations & Internal structure with file upload definitions
 * All sections use file uploads (no text editors or databases)
 */

export const OPS_STRUCTURE = {
  "Org Structure": {
    type: "file",
    icon: "sitemap",
    accept: ".pdf,.docx,.doc,.png,.jpg,.svg,.pptx",
    maxSize: 2097152,
    description: "Upload org charts and structure diagrams (PDF/Word/Images/PPT, max 2MB)"
  },

  "Roles KPIs": {
    type: "file",
    icon: "target",
    accept: ".pdf,.docx,.doc,.xlsx,.xls",
    maxSize: 2097152,
    description: "Upload role definitions and KPI documentation (PDF/Word/Excel, max 2MB)"
  },

  "Intern Programme": {
    type: "file",
    icon: "users",
    accept: ".pdf,.docx,.doc",
    maxSize: 2097152,
    description: "Upload internship program documentation (PDF/Word, max 2MB)"
  },

  "SOPs": {
    type: "file",
    icon: "file-text",
    accept: ".pdf,.docx,.doc",
    maxSize: 2097152,
    description: "Upload Standard Operating Procedures (PDF/Word, max 2MB)"
  },

  "Meetings Notes": {
    type: "file",
    icon: "clipboard",
    accept: ".pdf,.docx,.doc",
    maxSize: 2097152,
    description: "Upload meeting minutes and notes (PDF/Word, max 2MB)"
  },

  "Tools Access": {
    type: "file",
    icon: "key",
    accept: ".pdf,.docx,.doc,.xlsx,.xls",
    maxSize: 2097152,
    description: "Upload tools access documentation and credentials (PDF/Word/Excel, max 2MB)"
  },

  "Training": {
    type: "file",
    icon: "book-open",
    accept: ".pdf,.docx,.doc,.pptx,.mp4",
    maxSize: 2097152,
    description: "Upload training materials and guides (PDF/Word/PPT, max 2MB)"
  },

  "Admin Dashboards": {
    type: "file",
    icon: "layout-dashboard",
    accept: ".pdf,.docx,.doc,.png,.jpg,.xlsx,.xls",
    maxSize: 2097152,
    description: "Upload admin dashboard documentation (PDF/Word/Images/Excel, max 2MB)"
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