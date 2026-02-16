/**
 * Tech Architecture structure with file upload definitions
 * All sections use file uploads (no text editors or databases)
 */

export const TECH_STRUCTURE = {
  "Database Schema": {
    type: "file",
    icon: "database",
    accept: ".pdf,.docx,.doc,.sql,.json,.png,.jpg,.svg",
    maxSize: 2097152,
    description: "Upload database schema diagrams and documentation (PDF/Word/SQL/Images, max 2MB)"
  },

  "Firebase / Supabase": {
    type: "file",
    icon: "server",
    accept: ".pdf,.docx,.doc,.json,.yaml",
    maxSize: 2097152,
    description: "Upload Firebase/Supabase configuration and documentation (PDF/Word/JSON/YAML, max 2MB)"
  },

  "APIs": {
    type: "file",
    icon: "code",
    accept: ".pdf,.docx,.doc,.json,.yaml,.postman_collection",
    maxSize: 2097152,
    description: "Upload API documentation and collections (PDF/Word/JSON/YAML/Postman, max 2MB)"
  },

  "Security Auth": {
    type: "file",
    icon: "shield",
    accept: ".pdf,.docx,.doc",
    maxSize: 2097152,
    description: "Upload security and authentication documentation (PDF/Word, max 2MB)"
  },

  "DevOps Deployment": {
    type: "file",
    icon: "rocket",
    accept: ".pdf,.docx,.doc,.yaml,.yml,.sh",
    maxSize: 2097152,
    description: "Upload deployment scripts and CI/CD documentation (PDF/Word/YAML/Shell, max 2MB)"
  },

  "Cost Management": {
    type: "file",
    icon: "dollar-sign",
    accept: ".pdf,.docx,.doc,.xlsx,.xls,.csv",
    maxSize: 2097152,
    description: "Upload cost analysis and budget tracking (PDF/Word/Excel/CSV, max 2MB)"
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