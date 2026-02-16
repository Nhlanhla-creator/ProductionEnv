/**
 * Users & Marketplace structure with file upload definitions
 * All sections use file uploads (no text editors or databases)
 */

export const USERS_STRUCTURE = {
  "SMEs": {
    type: "file",
    icon: "briefcase",
    accept: ".pdf,.docx,.doc,.xlsx,.xls,.csv",
    maxSize: 2097152,
    description: "Upload SME profiles, databases, and documentation (PDF/Word/Excel/CSV, max 2MB)"
  },

  "Investors": {
    type: "file",
    icon: "trending-up",
    accept: ".pdf,.docx,.doc,.xlsx,.xls,.csv",
    maxSize: 2097152,
    description: "Upload investor profiles, databases, and documentation (PDF/Word/Excel/CSV, max 2MB)"
  },

  "Service Providers": {
    type: "file",
    icon: "users",
    accept: ".pdf,.docx,.doc,.xlsx,.xls,.csv",
    maxSize: 2097152,
    description: "Upload service provider profiles and databases (PDF/Word/Excel/CSV, max 2MB)"
  },

  "User Personas": {
    type: "file",
    icon: "user-circle",
    accept: ".pdf,.docx,.doc,.png,.jpg,.pptx",
    maxSize: 2097152,
    description: "Upload user persona documentation and profiles (PDF/Word/Images/PPT, max 2MB)"
  },

  "Onboarding Materials": {
    type: "file",
    icon: "clipboard-check",
    accept: ".pdf,.docx,.doc,.pptx,.mp4",
    maxSize: 2097152,
    description: "Upload user onboarding guides and materials (PDF/Word/PPT, max 2MB)"
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