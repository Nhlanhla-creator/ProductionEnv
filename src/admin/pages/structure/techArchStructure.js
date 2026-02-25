/**
 * Tech Architecture structure with file upload definitions
 * All sections use file uploads (no text editors or databases)
 */

export const TECH_STRUCTURE = {
  "System Architecture Overview": {
    type: "file",
    icon: "layers",
    accept: ".pdf,.docx,.doc,.png,.jpg,.svg,.drawio",
    maxSize: 10485760,
    description: "Upload system architecture overview diagrams and documentation (PDF/Word/Images/Draw.io, max 10MB)"
  },

  "Backend Structure": {
    type: "file",
    icon: "server",
    accept: ".pdf,.docx,.doc,.json,.yaml,.md",
    maxSize: 10485760,
    description: "Upload backend architecture and structure documentation (PDF/Word/JSON/YAML/Markdown, max 10MB)"
  },

  "Frontend Structure": {
    type: "file",
    icon: "monitor",
    accept: ".pdf,.docx,.doc,.json,.yaml,.md",
    maxSize: 10485760,
    description: "Upload frontend architecture and component structure (PDF/Word/JSON/YAML/Markdown, max 10MB)"
  },

  "Database Schema": {
    type: "file",
    icon: "database",
    accept: ".pdf,.docx,.doc,.sql,.json,.png,.jpg,.svg",
    maxSize: 10485760,
    description: "Upload database schema diagrams and documentation (PDF/Word/SQL/Images, max 10MB)"
  },

  "BIG Score Logic": {
    type: "file",
    icon: "calculator",
    accept: ".pdf,.docx,.doc,.json,.yaml,.md,.xlsx,.xls",
    maxSize: 10485760,
    description: "Upload BIG Score calculation logic and algorithms (PDF/Word/JSON/YAML/Markdown/Excel, max 10MB)"
  },

  "Matching Logic": {
    type: "file",
    icon: "git-branch",
    accept: ".pdf,.docx,.doc,.json,.yaml,.md,.js,.py",
    maxSize: 10485760,
    description: "Upload matching algorithms and business logic (PDF/Word/JSON/YAML/Markdown/Code, max 10MB)"
  },

  "Deployment Steps": {
    type: "file",
    icon: "rocket",
    accept: ".pdf,.docx,.doc,.yaml,.yml,.sh,.md",
    maxSize: 10485760,
    description: "Upload deployment procedures and step-by-step guides (PDF/Word/YAML/Shell/Markdown, max 10MB)"
  },

  "Payment Integration Flow": {
    type: "file",
    icon: "credit-card",
    accept: ".pdf,.docx,.doc,.json,.yaml,.md,.png,.jpg,.svg",
    maxSize: 10485760,
    description: "Upload payment integration flows and documentation (PDF/Word/JSON/YAML/Markdown/Images, max 10MB)"
  },

  "Third-party Services List": {
    type: "file",
    icon: "external-link",
    accept: ".pdf,.docx,.doc,.json,.yaml,.md,.xlsx,.xls",
    maxSize: 10485760,
    description: "Upload third-party services documentation and integration guides (PDF/Word/JSON/YAML/Markdown/Excel, max 10MB)"
  },

  "Firebase / Supabase": {
    type: "file",
    icon: "server",
    accept: ".pdf,.docx,.doc,.json,.yaml",
    maxSize: 10485760,
    description: "Upload Firebase/Supabase configuration and documentation (PDF/Word/JSON/YAML, max 10MB)"
  },

  "APIs": {
    type: "file",
    icon: "code",
    accept: ".pdf,.docx,.doc,.json,.yaml,.postman_collection",
    maxSize: 10485760,
    description: "Upload API documentation and collections (PDF/Word/JSON/YAML/Postman, max 10MB)"
  },

  "Security Auth": {
    type: "file",
    icon: "shield",
    accept: ".pdf,.docx,.doc",
    maxSize: 10485760,
    description: "Upload security and authentication documentation (PDF/Word, max 10MB)"
  },

  "DevOps Deployment": {
    type: "file",
    icon: "settings",
    accept: ".pdf,.docx,.doc,.yaml,.yml,.sh",
    maxSize: 10485760,
    description: "Upload DevOps configuration and CI/CD documentation (PDF/Word/YAML/Shell, max 10MB)"
  },

  "Cost Management": {
    type: "file",
    icon: "dollar-sign",
    accept: ".pdf,.docx,.doc,.xlsx,.xls,.csv",
    maxSize: 10485760,
    description: "Upload cost analysis and budget tracking (PDF/Word/Excel/CSV, max 10MB)"
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