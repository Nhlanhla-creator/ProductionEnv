/**
 * Admin & Governance structure with file upload definitions
 * Maintains sidebar structure with file/folder types
 */

export const ADMIN_STRUCTURE = {
  "Board Matters": {
    type: "file",
    icon: "building-2",
    accept: ".pdf,.docx,.doc,.pptx",
    maxSize: 2097152,
    description: "Upload board meeting minutes, resolutions, and documents (PDF/Word/PPT, max 2MB)"
  },

  "Shareholding Equity": {
    type: "file",
    icon: "users",
    accept: ".pdf,.docx,.doc,.xlsx,.xls",
    maxSize: 2097152,
    description: "Upload shareholder agreements and equity documentation (PDF/Word/Excel, max 2MB)"
  },

  "SAFE Notes / Convertible": {
    type: "file",
    icon: "file-check",
    accept: ".pdf,.docx,.doc,.xlsx,.xls",
    maxSize: 2097152,
    description: "Upload SAFE notes and convertible instruments (PDF/Word/Excel, max 2MB)"
  },

  "Cap Table": {
    type: "file",
    icon: "table",
    accept: ".xlsx,.xls,.csv,.pdf",
    maxSize: 2097152,
    description: "Upload capitalization tables and ownership structure (Excel/CSV/PDF, max 2MB)"
  },

  "Governance Framework": {
    type: "file",
    icon: "shield",
    accept: ".pdf,.docx,.doc",
    maxSize: 2097152,
    description: "Upload governance policies and frameworks (PDF/Word, max 2MB)"
  },

  "Policies Master": {
    type: "file",
    icon: "scroll-text",
    accept: ".pdf,.docx,.doc",
    maxSize: 2097152,
    description: "Upload company policies and procedures (PDF/Word, max 2MB)"
  },

  "Risk Register": {
    type: "file",
    icon: "alert-triangle",
    accept: ".pdf,.docx,.doc,.xlsx,.xls",
    maxSize: 2097152,
    description: "Upload risk assessment and mitigation documents (PDF/Word/Excel, max 2MB)"
  },

  "Decisions Log": {
    type: "file",
    icon: "clipboard-list",
    accept: ".pdf,.docx,.doc,.xlsx,.xls",
    maxSize: 2097152,
    description: "Upload decision records and logs (PDF/Word/Excel, max 2MB)"
  },

  "HR": {
    type: "file",
    icon: "user-check",
    accept: ".pdf,.docx,.doc,.xlsx,.xls",
    maxSize: 2097152,
    description: "Upload HR documentation and employee records (PDF/Word/Excel, max 2MB)"
  },

  "Legal & Compliance": {
    type: "folder",
    icon: "scale",
    items: {
      "Company Registration": {
        type: "file",
        icon: "file-badge",
        accept: ".pdf,.docx,.doc,.jpg,.png",
        maxSize: 2097152,
        description: "Upload company registration certificates (PDF/Word/Images, max 2MB)"
      },
      "Contracts Templates": {
        type: "file",
        icon: "file-text",
        accept: ".pdf,.docx,.doc",
        maxSize: 2097152,
        description: "Upload standard contract templates (PDF/Word, max 2MB)"
      },
      "NDAs": {
        type: "file",
        icon: "file-lock",
        accept: ".pdf,.docx,.doc",
        maxSize: 2097152,
        description: "Upload non-disclosure agreements (PDF/Word, max 2MB)"
      },
      "POPIA Data Privacy": {
        type: "file",
        icon: "shield-check",
        accept: ".pdf,.docx,.doc",
        maxSize: 2097152,
        description: "Upload POPIA compliance documents (PDF/Word, max 2MB)"
      },
      "Terms & Conditions": {
        type: "file",
        icon: "scroll",
        accept: ".pdf,.docx,.doc,.html",
        maxSize: 2097152,
        description: "Upload terms of service documents (PDF/Word/HTML, max 2MB)"
      },
      "Platform Disclaimers": {
        type: "file",
        icon: "alert-circle",
        accept: ".pdf,.docx,.doc,.html",
        maxSize: 2097152,
        description: "Upload legal disclaimers (PDF/Word/HTML, max 2MB)"
      }
    }
  }
};

// Helper to get icon name for lucide-react
export const getIconComponent = (iconName) => {
  const iconMap = {
    'building-2': 'Building2',
    'users': 'Users',
    'file-check': 'FileCheck',
    'table': 'Table',
    'shield': 'Shield',
    'scroll-text': 'ScrollText',
    'alert-triangle': 'AlertTriangle',
    'clipboard-list': 'ClipboardList',
    'user-check': 'UserCheck',
    'scale': 'Scale',
    'file-badge': 'FileBadge',
    'file-text': 'FileText',
    'file-lock': 'FileLock',
    'shield-check': 'ShieldCheck',
    'scroll': 'Scroll',
    'alert-circle': 'AlertCircle'
  };
  return iconMap[iconName] || 'File';
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